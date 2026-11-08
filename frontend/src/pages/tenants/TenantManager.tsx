import { useState } from "react";
import { Building2, Plus, Search, CheckCircle,
         Users, CreditCard, Globe, Settings } from "lucide-react";

const TENANTS = [
  {id:"DEL",name:"Delhi International Airport",   code:"VIDP",city:"New Delhi",  plan:"Enterprise",flights:1240,users:48,status:"Active",  revenue:"₹2.4Cr", joined:"Jan 2023"},
  {id:"BOM",name:"Mumbai Chhatrapati Shivaji",    code:"VABB",city:"Mumbai",     plan:"Professional",flights:980, users:32,status:"Active",  revenue:"₹1.8Cr", joined:"Mar 2023"},
  {id:"BLR",name:"Bengaluru Kempegowda Airport",  code:"VOBL",city:"Bengaluru",  plan:"Professional",flights:820, users:28,status:"Active",  revenue:"₹1.5Cr", joined:"Jun 2023"},
  {id:"HYD",name:"Hyderabad Rajiv Gandhi Airport",code:"VOHS",city:"Hyderabad",  plan:"Starter",     flights:420, users:12,status:"Active",  revenue:"₹0.4Cr", joined:"Sep 2023"},
  {id:"CCU",name:"Kolkata Netaji Subhas Airport", code:"VECC",city:"Kolkata",    plan:"Starter",     flights:310, users:8, status:"Trial",   revenue:"₹0.1Cr", joined:"Nov 2023"},
  {id:"MAA",name:"Chennai International Airport", code:"VOMM",city:"Chennai",    plan:"Professional",flights:680, users:22,status:"Active",  revenue:"₹1.2Cr", joined:"Apr 2023"},
  {id:"AMD",name:"Ahmedabad Sardar Patel Airport",code:"VAAH",city:"Ahmedabad",  plan:"Starter",     flights:280, users:8, status:"Suspended",revenue:"₹0.2Cr", joined:"Oct 2023"},
  {id:"GOI",name:"Goa Dabolim Airport",           code:"VAGO",city:"Goa",        plan:"Starter",     flights:190, users:6, status:"Trial",   revenue:"₹0.08Cr",joined:"Dec 2023"},
];

const PLANS = [
  {name:"Starter",     price:"₹9,999/mo",  color:"sky",    features:["50 flights","Basic analytics","Email support"]},
  {name:"Professional",price:"₹49,999/mo", color:"teal",   features:["500 flights","AI predictions","Priority support","GraphQL"]},
  {name:"Enterprise",  price:"₹1,49,999/mo",color:"purple", features:["Unlimited","Digital twin","24/7 support","Custom SLA"]},
];

const STATUS_STYLE: Record<string,string> = {
  Active:   "bg-green-500/15 text-green-400 border-green-500/20",
  Trial:    "bg-sky-500/15 text-sky-400 border-sky-500/20",
  Suspended:"bg-red-500/15 text-red-400 border-red-500/20",
};

const PLAN_COLOR: Record<string,string> = {
  Enterprise:"purple", Professional:"teal", Starter:"sky",
};

export function TenantManager() {
  const [search,  setSearch]   = useState("");
  const [tab,     setTab]      = useState<"tenants"|"plans">("tenants");
  const [selected,setSelected] = useState<typeof TENANTS[0]|null>(null);
  const [showNew, setShowNew]  = useState(false);

  const filtered = TENANTS.filter(t=>
    !search ||
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.id.toLowerCase().includes(search.toLowerCase()) ||
    t.city.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total:   TENANTS.length,
    active:  TENANTS.filter(t=>t.status==="Active").length,
    trial:   TENANTS.filter(t=>t.status==="Trial").length,
    revenue: "₹7.7Cr",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Tenant Manager</h1>
          <p className="text-slate-400 text-sm mt-0.5">Multi-tenant SaaS administration</p>
        </div>
        <button onClick={()=>setShowNew(true)}
          className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors">
          <Plus className="w-4 h-4"/>Add Tenant
        </button>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          {label:"Total Airports",  value:stats.total,   icon:<Building2 className="w-5 h-5"/>,  color:"sky"},
          {label:"Active",          value:stats.active,  icon:<CheckCircle className="w-5 h-5"/>,color:"green"},
          {label:"On Trial",        value:stats.trial,   icon:<Globe className="w-5 h-5"/>,      color:"yellow"},
          {label:"MRR",             value:stats.revenue, icon:<CreditCard className="w-5 h-5"/>, color:"teal"},
        ].map(({label,value,icon,color})=>(
          <div key={label} className="bg-navy-800 rounded-2xl p-5 border border-navy-600">
            <div className={`text-${color}-400 mb-3`}>{icon}</div>
            <div className="text-2xl font-bold font-mono text-white mb-0.5">{value}</div>
            <div className="text-sm text-slate-400">{label}</div>
          </div>
        ))}
      </div>

      {showNew && (
        <div className="bg-navy-800 rounded-2xl p-6 border border-sky-500/30 space-y-4">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-sky-400"/>Onboard New Airport
          </h3>
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
            {[
              {label:"Airport Name",  placeholder:"Delhi International Airport"},
              {label:"IATA Code",     placeholder:"DEL"},
              {label:"ICAO Code",     placeholder:"VIDP"},
              {label:"City",          placeholder:"New Delhi"},
              {label:"Admin Email",   placeholder:"admin@airport.in"},
              {label:"Plan",          placeholder:"Starter / Professional / Enterprise"},
            ].map(({label,placeholder})=>(
              <div key={label}>
                <label className="text-xs text-slate-400 mb-1.5 block">{label}</label>
                <input placeholder={placeholder}
                  className="w-full bg-navy-700 border border-navy-600 focus:border-sky-500 rounded-xl px-3 py-2.5 text-sm text-white outline-none"/>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={()=>setShowNew(false)}
              className="bg-sky-500 hover:bg-sky-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium">
              Onboard Airport
            </button>
            <button onClick={()=>setShowNew(false)}
              className="bg-navy-700 text-slate-400 px-5 py-2.5 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-4">
        <div className="flex gap-1 bg-navy-800 p-1 rounded-xl border border-navy-600">
          {(["tenants","plans"] as const).map(t=>(
            <button key={t} onClick={()=>setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                tab===t?"bg-sky-500 text-white":"text-slate-400 hover:text-white"}`}>
              {t==="tenants"?"All Airports":"Pricing Plans"}
            </button>
          ))}
        </div>
        {tab==="tenants" && (
          <div className="flex items-center gap-2 bg-navy-800 border border-navy-600 rounded-xl px-3.5 py-2.5 flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-500"/>
            <input className="bg-transparent text-sm text-white placeholder-slate-500 outline-none w-full"
              placeholder="Search airports..." value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
        )}
      </div>

      {tab==="tenants" && (
        <div className={`grid gap-5 ${selected?"xl:grid-cols-3":"xl:grid-cols-1"}`}>
          <div className={`bg-navy-800 rounded-2xl border border-navy-600 overflow-hidden ${selected?"xl:col-span-2":""}`}>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-500 text-xs uppercase">
                  {["Airport","Code","City","Plan","Flights","Users","Revenue","Status"].map(h=>(
                    <th key={h} className="px-4 py-3 text-left border-b border-navy-700">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(t=>(
                  <tr key={t.id} onClick={()=>setSelected(selected?.id===t.id?null:t)}
                    className={`border-b border-navy-700/50 cursor-pointer transition-all ${
                      selected?.id===t.id?"bg-sky-500/10":"hover:bg-navy-700/30"}`}>
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-white">{t.name.split(" ").slice(0,2).join(" ")}</div>
                      <div className="text-xs text-slate-500">{t.joined}</div>
                    </td>
                    <td className="px-4 py-3.5 font-mono font-bold text-sky-300">{t.id}</td>
                    <td className="px-4 py-3.5 text-slate-300">{t.city}</td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full bg-${PLAN_COLOR[t.plan]||"sky"}-500/15 text-${PLAN_COLOR[t.plan]||"sky"}-400`}>
                        {t.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-300">{t.flights.toLocaleString()}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1 text-slate-300">
                        <Users className="w-3.5 h-3.5 text-slate-500"/>{t.users}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-mono font-bold text-white">{t.revenue}</td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${STATUS_STYLE[t.status]}`}>
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selected && (
            <div className="bg-navy-800 rounded-2xl border border-sky-500/30 p-5 space-y-4 h-fit">
              <div className="flex justify-between">
                <h2 className="font-semibold text-white">Tenant Details</h2>
                <button onClick={()=>setSelected(null)} className="text-slate-500 hover:text-white text-xl">×</button>
              </div>
              <div className="p-4 bg-navy-700/50 rounded-xl text-center">
                <div className="text-4xl font-bold font-mono text-sky-300 mb-1">{selected.id}</div>
                <div className="text-sm text-slate-300">{selected.name}</div>
                <div className="text-xs text-slate-500">{selected.code} • {selected.city}</div>
              </div>
              {[
                {label:"Plan",      value:selected.plan},
                {label:"Status",    value:selected.status},
                {label:"Flights",   value:selected.flights.toLocaleString()},
                {label:"Users",     value:String(selected.users)},
                {label:"Revenue",   value:selected.revenue},
                {label:"Joined",    value:selected.joined},
              ].map(({label,value})=>(
                <div key={label} className="flex justify-between p-3 bg-navy-700/40 rounded-xl">
                  <span className="text-sm text-slate-400">{label}</span>
                  <span className="text-sm font-medium text-white">{value}</span>
                </div>
              ))}
              <div className="grid grid-cols-2 gap-2">
                <button className="bg-sky-500/15 text-sky-400 border border-sky-500/20 py-2 rounded-xl text-xs font-medium hover:bg-sky-500/25 transition-colors flex items-center justify-center gap-1.5">
                  <Settings className="w-3.5 h-3.5"/>Configure
                </button>
                <button className="bg-navy-700 text-slate-400 py-2 rounded-xl text-xs font-medium hover:text-white transition-colors">
                  View Portal
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {tab==="plans" && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {PLANS.map(p=>(
            <div key={p.name} className={`bg-navy-800 rounded-2xl p-6 border border-${p.color}-500/20`}>
              <div className={`text-${p.color}-400 font-bold text-lg mb-1`}>{p.name}</div>
              <div className="text-2xl font-bold font-mono text-white mb-4">{p.price}</div>
              <div className="space-y-2.5 mb-6">
                {p.features.map(f=>(
                  <div key={f} className="flex items-center gap-2 text-sm text-slate-300">
                    <CheckCircle className={`w-4 h-4 text-${p.color}-400`}/>
                    {f}
                  </div>
                ))}
              </div>
              <div className="pt-4 border-t border-navy-600">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Active tenants</span>
                  <span className="font-bold text-white">
                    {TENANTS.filter(t=>t.plan===p.name).length}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
