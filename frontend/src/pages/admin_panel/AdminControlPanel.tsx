import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchFlights, fetchOrders, fetchHealth } from "../../api/client";
import { Settings, Database, Server, Shield,
         Users, Key, RefreshCw, Terminal,
         CheckCircle, AlertTriangle, Cpu } from "lucide-react";

const API_ENDPOINTS = [
  {method:"GET",  path:"/health",           desc:"System health check",      status:200, latency:"12ms"},
  {method:"GET",  path:"/flights",           desc:"List all flights",         status:200, latency:"8ms"},
  {method:"POST", path:"/flights",           desc:"Create new flight",        status:200, latency:"45ms"},
  {method:"POST", path:"/graphql",           desc:"GraphQL endpoint",         status:200, latency:"23ms"},
  {method:"GET",  path:"/metrics",           desc:"Prometheus metrics",       status:200, latency:"5ms"},
  {method:"GET",  path:"/traces",            desc:"Distributed traces",       status:200, latency:"7ms"},
  {method:"POST", path:"/payments/order",    desc:"Create payment order",     status:200, latency:"120ms"},
  {method:"POST", path:"/predict/delay",     desc:"AI delay prediction",      status:200, latency:"340ms"},
  {method:"POST", path:"/notify/email",      desc:"Send email notification",  status:200, latency:"89ms"},
  {method:"GET",  path:"/api-docs",          desc:"Swagger UI",               status:200, latency:"3ms"},
];

const SYSTEM_CONFIG = [
  {key:"MAX_REQUESTS_PER_MIN",  value:"100",    category:"Gateway",   editable:true},
  {key:"JWT_EXPIRY_HOURS",      value:"24",     category:"Auth",      editable:true},
  {key:"DB_POOL_SIZE",          value:"10",     category:"Database",  editable:true},
  {key:"REDIS_POOL_SIZE",       value:"5",      category:"Cache",     editable:true},
  {key:"ML_SERVICE_URL",        value:"http://localhost:5000", category:"AI", editable:true},
  {key:"LOG_LEVEL",             value:"INFO",   category:"Logging",   editable:true},
  {key:"THREAD_NUM",            value:"16",     category:"Server",    editable:false},
  {key:"MAX_PAYLOAD_MB",        value:"1",      category:"Security",  editable:true},
];

const METHOD_COLOR: Record<string,string> = {
  GET:"text-green-400 bg-green-500/10",
  POST:"text-sky-400 bg-sky-500/10",
  PUT:"text-yellow-400 bg-yellow-500/10",
  DELETE:"text-red-400 bg-red-500/10",
};

export function AdminControlPanel() {
  const [tab,    setTab]    = useState<"overview"|"api"|"config"|"tenants">("overview");
  const [config, setConfig] = useState(SYSTEM_CONFIG.reduce((a,c)=>({...a,[c.key]:c.value}),{} as Record<string,string>));

  const {data:flights=[]}  = useQuery({queryKey:["flights"], queryFn:fetchFlights});
  const {data:ordersData}  = useQuery({queryKey:["orders"],  queryFn:fetchOrders});
  const {data:health}      = useQuery({queryKey:["health"],  queryFn:fetchHealth, refetchInterval:10000});

  const fl     = flights as any[];
  const orders = (ordersData as any)?.orders??[];
  const h      = health as any;

  const tabs = ["overview","api","config","tenants"] as const;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Control Panel</h1>
          <p className="text-slate-400 text-sm mt-0.5">System administration & configuration</p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium ${
          h?.status==="healthy"
            ?"bg-green-500/10 border-green-500/20 text-green-400"
            :"bg-red-500/10 border-red-500/20 text-red-400"}`}>
          <div className={`w-2 h-2 rounded-full ${h?.status==="healthy"?"bg-green-400 animate-pulse":"bg-red-400"}`}/>
          {h?.status==="healthy"?"All Systems Operational":"System Degraded"}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-navy-800 p-1 rounded-xl border border-navy-600 w-fit">
        {tabs.map(t=>(
          <button key={t} onClick={()=>setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
              tab===t?"bg-sky-500 text-white":"text-slate-400 hover:text-white"}`}>
            {t==="api"?"API Monitor":t==="config"?"Control":t.charAt(0).toUpperCase()+t.slice(1)}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {tab==="overview" && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              {label:"DB Status",      value:h?.database||"—",  icon:<Database className="w-5 h-5"/>, color:h?.database==="UP"?"green":"red"},
              {label:"Redis Status",   value:h?.redis||"—",     icon:<Server className="w-5 h-5"/>,   color:h?.redis==="UP"?"green":"red"},
              {label:"AI Engine",      value:h?.ai_engine||"—", icon:<Cpu className="w-5 h-5"/>,      color:h?.ai_engine==="UP"?"green":"red"},
              {label:"API Security",   value:"Active",           icon:<Shield className="w-5 h-5"/>,   color:"green"},
            ].map(({label,value,icon,color})=>(
              <div key={label} className="bg-navy-800 rounded-2xl p-5 border border-navy-600">
                <div className={`text-${color}-400 mb-3`}>{icon}</div>
                <div className={`text-xl font-bold font-mono text-${color}-400 mb-0.5`}>{value}</div>
                <div className="text-sm text-slate-400">{label}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            {/* Live stats */}
            <div className="bg-navy-800 rounded-2xl p-5 border border-navy-600">
              <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Terminal className="w-5 h-5 text-sky-400"/>Live Stats
              </h2>
              <div className="space-y-3">
                {[
                  {label:"Flights in DB",   value:fl.length},
                  {label:"Payment Orders",  value:orders.length},
                  {label:"Active Tenants",  value:1},
                  {label:"API Endpoints",   value:API_ENDPOINTS.length},
                  {label:"DB Migrations",   value:37},
                  {label:"Build Phase",     value:"70/70"},
                ].map(({label,value})=>(
                  <div key={label} className="flex justify-between py-2 border-b border-navy-700/50">
                    <span className="text-sm text-slate-400">{label}</span>
                    <span className="text-sm font-mono font-bold text-white">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick actions */}
            <div className="bg-navy-800 rounded-2xl p-5 border border-navy-600">
              <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5 text-sky-400"/>Quick Actions
              </h2>
              <div className="space-y-2">
                {[
                  {label:"Restart API Gateway",  icon:<RefreshCw className="w-4 h-4"/>,  color:"sky"},
                  {label:"Flush Redis Cache",     icon:<Server className="w-4 h-4"/>,     color:"teal"},
                  {label:"Run DB Migration",      icon:<Database className="w-4 h-4"/>,   color:"purple"},
                  {label:"Export Audit Logs",     icon:<Shield className="w-4 h-4"/>,     color:"green"},
                  {label:"Rotate JWT Secret",     icon:<Key className="w-4 h-4"/>,        color:"yellow"},
                  {label:"Clear Email Queue",     icon:<CheckCircle className="w-4 h-4"/>,color:"orange"},
                ].map(({label,icon,color})=>(
                  <button key={label}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border border-navy-600 hover:border-${color}-500/30 hover:bg-${color}-500/5 text-slate-300 hover:text-white transition-all text-sm`}>
                    <span className={`text-${color}-400`}>{icon}</span>{label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tech stack */}
            <div className="bg-navy-800 rounded-2xl p-5 border border-navy-600">
              <h2 className="font-semibold text-white mb-4">Tech Stack</h2>
              <div className="space-y-2.5">
                {[
                  {layer:"Backend",    tech:"C++20 + Drogon",        version:"1.9.3"},
                  {layer:"Database",   tech:"PostgreSQL",             version:"15.0"},
                  {layer:"Cache",      tech:"Redis + hiredis",        version:"7.0"},
                  {layer:"ML Service", tech:"Python Flask",           version:"3.1.3"},
                  {layer:"Frontend",   tech:"React + TypeScript",     version:"18.3"},
                  {layer:"Charts",     tech:"Recharts",               version:"2.x"},
                  {layer:"State",      tech:"Zustand + React Query",  version:"Latest"},
                  {layer:"Styling",    tech:"Tailwind CSS",           version:"3.4"},
                ].map(({layer,tech,version})=>(
                  <div key={layer} className="flex items-center justify-between p-2.5 bg-navy-700/50 rounded-lg">
                    <div>
                      <div className="text-xs text-slate-500">{layer}</div>
                      <div className="text-sm text-slate-200">{tech}</div>
                    </div>
                    <div className="text-xs font-mono text-sky-400">{version}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* API MONITOR */}
      {tab==="api" && (
        <div className="bg-navy-800 rounded-2xl border border-navy-600 overflow-hidden">
          <div className="p-5 border-b border-navy-600 flex items-center justify-between">
            <h2 className="font-semibold text-white">API Endpoint Monitor</h2>
            <span className="text-xs text-green-400 flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"/>
              All endpoints operational
            </span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-500 text-xs uppercase">
                {["Method","Endpoint","Description","Status","Latency"].map(h=>(
                  <th key={h} className="px-5 py-3 text-left border-b border-navy-700">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {API_ENDPOINTS.map((e,i)=>(
                <tr key={i} className="border-b border-navy-700/50 hover:bg-navy-700/30">
                  <td className="px-5 py-3">
                    <span className={`text-xs font-bold px-2 py-1 rounded font-mono ${METHOD_COLOR[e.method]}`}>
                      {e.method}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-mono text-sky-300 text-xs">{e.path}</td>
                  <td className="px-5 py-3 text-slate-400 text-xs">{e.desc}</td>
                  <td className="px-5 py-3">
                    <span className="text-xs bg-green-500/15 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full">
                      {e.status} OK
                    </span>
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-slate-300">{e.latency}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CONFIG */}
      {tab==="config" && (
        <div className="bg-navy-800 rounded-2xl border border-navy-600 overflow-hidden">
          <div className="p-5 border-b border-navy-600 flex items-center justify-between">
            <h2 className="font-semibold text-white">System Configuration</h2>
            <button className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-xl text-xs font-medium">
              Save Changes
            </button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-500 text-xs uppercase">
                {["Config Key","Value","Category","Editable"].map(h=>(
                  <th key={h} className="px-5 py-3 text-left border-b border-navy-700">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SYSTEM_CONFIG.map(c=>(
                <tr key={c.key} className="border-b border-navy-700/50 hover:bg-navy-700/20">
                  <td className="px-5 py-3.5 font-mono text-xs text-sky-300">{c.key}</td>
                  <td className="px-5 py-3.5">
                    {c.editable
                      ? <input
                          value={config[c.key]||c.value}
                          onChange={e=>setConfig(prev=>({...prev,[c.key]:e.target.value}))}
                          className="bg-navy-700 border border-navy-600 focus:border-sky-500 rounded-lg px-2.5 py-1 text-sm text-white font-mono outline-none w-48"/>
                      : <span className="font-mono text-slate-400 text-xs">{c.value}</span>
                    }
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs bg-navy-700 text-slate-400 px-2 py-0.5 rounded-full">{c.category}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    {c.editable
                      ?<CheckCircle className="w-4 h-4 text-green-400"/>
                      :<AlertTriangle className="w-4 h-4 text-slate-600"/>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TENANTS */}
      {tab==="tenants" && (
        <div className="space-y-4">
          <div className="bg-navy-800 rounded-2xl p-6 border border-navy-600">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-sky-400"/>
              </div>
              <div>
                <h2 className="font-bold text-white text-lg">Delhi International Airport</h2>
                <div className="text-sm text-slate-400">Tenant ID: DEL • Enterprise Plan</div>
              </div>
              <div className="ml-auto">
                <span className="bg-green-500/15 text-green-400 border border-green-500/20 text-xs px-3 py-1.5 rounded-full font-medium">
                  Active
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              {[
                {label:"Flights Created",  value:fl.length},
                {label:"Payment Orders",   value:orders.length},
                {label:"Monthly Revenue",  value:"₹8.2Cr"},
                {label:"Plan",             value:"Enterprise"},
              ].map(({label,value})=>(
                <div key={label} className="p-4 bg-navy-700/50 rounded-xl text-center">
                  <div className="text-xl font-bold font-mono text-white mb-0.5">{value}</div>
                  <div className="text-xs text-slate-400">{label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-navy-800 rounded-2xl p-5 border border-navy-600 text-center py-12">
            <Users className="w-10 h-10 mx-auto mb-3 text-slate-600"/>
            <p className="text-slate-400 text-sm">Add more airport tenants to scale</p>
            <button className="mt-4 bg-sky-500 hover:bg-sky-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors">
              + Onboard New Airport
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
