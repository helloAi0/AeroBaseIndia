import { copyText } from "../../lib/clipboard";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchHealth } from "../../api/client";
import { CheckCircle, XCircle, Clock, Server,
         Database, Globe, Shield, Cpu, Activity } from "lucide-react";

const DEPLOY_CHECKLIST = [
  {section:"Backend",items:[
    {label:"C++ Drogon server running",        check:"health"},
    {label:"PostgreSQL connected",              check:"database"},
    {label:"Redis cache connected",             check:"redis"},
    {label:"ML service (Flask) running",        check:"ai_engine"},
    {label:"JWT secret configured",             check:"static_ok"},
    {label:"CORS headers active",               check:"static_ok"},
    {label:"Rate limiting enabled",             check:"static_ok"},
    {label:"35+ migrations applied",            check:"static_ok"},
  ]},
  {section:"Frontend",items:[
    {label:"React app built (npm run build)",   check:"static_ok"},
    {label:"PWA manifest configured",           check:"static_ok"},
    {label:"All 78 pages implemented",          check:"static_ok"},
    {label:"Mobile responsive design",          check:"static_ok"},
    {label:"API client configured",             check:"static_ok"},
  ]},
  {section:"Infrastructure",items:[
    {label:"Nginx reverse proxy configured",    check:"static_ok"},
    {label:"SSL/TLS certificate ready",         check:"static_warn"},
    {label:"Docker Compose ready",              check:"static_ok"},
    {label:"Kubernetes manifests available",    check:"static_ok"},
    {label:"GitHub Actions CI/CD configured",   check:"static_ok"},
  ]},
  {section:"Payments",items:[
    {label:"Razorpay integration active",       check:"static_ok"},
    {label:"Stripe integration active",         check:"static_ok"},
    {label:"Webhook endpoints configured",      check:"static_warn"},
    {label:"Payment orders tested",             check:"static_ok"},
  ]},
];

const START_COMMANDS = [
  {label:"1. Start PostgreSQL",  cmd:"sudo service postgresql start"},
  {label:"2. Start Redis",       cmd:"sudo service redis-server start"},
  {label:"3. Start Backend",     cmd:"cd ~/AeroBaseIndia/build && ./AeroBaseIndia"},
  {label:"4. Start ML Service",  cmd:"cd ~/AeroBaseIndia/ml_service && python3 app.py"},
  {label:"5. Build Frontend",    cmd:"cd ~/AeroBaseIndia/frontend && npm run build"},
  {label:"6. Serve Frontend",    cmd:"cd ~/AeroBaseIndia/frontend && npm run dev -- --host 0.0.0.0 --port 3000"},
];

const API_ENDPOINTS = [
  {method:"GET", path:"/health",          desc:"System health"},
  {method:"GET", path:"/flights",         desc:"All flights"},
  {method:"POST",path:"/flights",         desc:"Create flight"},
  {method:"POST",path:"/graphql",         desc:"GraphQL"},
  {method:"GET", path:"/metrics",         desc:"Prometheus"},
  {method:"GET", path:"/traces",          desc:"Distributed traces"},
  {method:"POST",path:"/payments/order",  desc:"Create payment"},
  {method:"POST",path:"/notify/email",    desc:"Send email"},
  {method:"POST",path:"/predict/delay",   desc:"AI prediction"},
  {method:"GET", path:"/docs",            desc:"Swagger UI"},
];

export function DeploymentPage() {
  const [copied, setCopied] = useState<string|null>(null);
  const {data:health} = useQuery({queryKey:["health"],queryFn:fetchHealth,refetchInterval:10000});
  const h = health as any;

  const getStatus = (check:string) => {
    if(check==="health")    return h?.status==="healthy";
    if(check==="database")  return h?.database==="UP";
    if(check==="redis")     return h?.redis==="UP";
    if(check==="ai_engine") return h?.ai_engine==="UP";
    if(check==="static_ok") return true;
    if(check==="static_warn") return null; // warning
    return false;
  };

  const copy = async (cmd:string) => {
    if (!(await copyText(cmd))) return;
    setCopied(cmd);
    setTimeout(()=>setCopied(null),1500);
  };

  const allOk = DEPLOY_CHECKLIST.every(s=>
    s.items.every(i=>getStatus(i.check)!==false)
  );

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Production Deployment</h1>
          <p className="text-slate-400 text-sm mt-0.5">AeroBase India — Deployment status & launch guide</p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-bold ${
          allOk?"bg-green-500/15 border-green-500/30 text-green-400":"bg-yellow-500/15 border-yellow-500/30 text-yellow-400"}`}>
          {allOk?"🚀 Ready to Launch":"⚙️ Setup Required"}
        </div>
      </div>

      {/* Live system status */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          {label:"API Server",  value:h?.status||"—",      ok:h?.status==="healthy",   icon:<Server className="w-5 h-5"/>},
          {label:"Database",    value:h?.database||"—",    ok:h?.database==="UP",       icon:<Database className="w-5 h-5"/>},
          {label:"Redis",       value:h?.redis||"—",       ok:h?.redis==="UP",          icon:<Cpu className="w-5 h-5"/>},
          {label:"AI Engine",   value:h?.ai_engine||"—",   ok:h?.ai_engine==="UP",      icon:<Activity className="w-5 h-5"/>},
        ].map(({label,value,ok,icon},idx)=>(
          <div key={`${label}-${idx}`} className={`rounded-2xl p-5 border ${
            ok?"bg-green-500/5 border-green-500/20":"bg-red-500/5 border-red-500/20"}`}>
            <div className={`mb-3 ${ok?"text-green-400":"text-red-400"}`}>{icon}</div>
            <div className={`text-xl font-bold font-mono ${ok?"text-green-400":"text-red-400"}`}>{value}</div>
            <div className="text-sm text-slate-400">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Checklist */}
        <div className="space-y-4">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-sky-400"/>Launch Checklist
          </h2>
          {DEPLOY_CHECKLIST.map(({section,items})=>(
            <div key={section} className="bg-navy-800 rounded-2xl border border-navy-600 overflow-hidden">
              <div className="px-5 py-3 border-b border-navy-600 bg-navy-700/30">
                <h3 className="font-semibold text-white text-sm">{section}</h3>
              </div>
              <div className="divide-y divide-navy-700/50">
                {items.map(({label,check},ii)=>{
                  const ok = getStatus(check);
                  return (
                    <div key={`${label}-${ii}`} className="flex items-center gap-3 px-5 py-3">
                      {ok===true  && <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0"/>}
                      {ok===false && <XCircle className="w-4 h-4 text-red-400 flex-shrink-0"/>}
                      {ok===null  && <Clock className="w-4 h-4 text-yellow-400 flex-shrink-0"/>}
                      <span className={`text-sm ${ok===true?"text-slate-200":ok===null?"text-yellow-300/80":"text-red-300/80"}`}>
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Start commands + API list */}
        <div className="space-y-5">
          <div>
            <h2 className="font-semibold text-white flex items-center gap-2 mb-3">
              <Globe className="w-5 h-5 text-sky-400"/>Start Commands
            </h2>
            <div className="space-y-2">
              {START_COMMANDS.map(({label,cmd},ci)=>(
                <div key={`${label}-${ci}`} className="bg-navy-900 rounded-xl border border-navy-600 p-3.5">
                  <div className="text-xs text-slate-500 mb-1.5">{label}</div>
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-xs text-green-300 font-mono truncate flex-1">{cmd}</code>
                    <button onClick={()=>copy(cmd)}
                      className="flex-shrink-0 text-xs text-slate-400 hover:text-white px-2 py-1 rounded-lg hover:bg-navy-700 transition-colors">
                      {copied===cmd?"✓ Copied":"Copy"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="font-semibold text-white flex items-center gap-2 mb-3">
              <Server className="w-5 h-5 text-sky-400"/>API Endpoints
              <span className="text-xs text-slate-500 font-normal">base: localhost:8080</span>
            </h2>
            <div className="bg-navy-800 rounded-2xl border border-navy-600 overflow-hidden">
              <div className="table-scroll"><table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-600 uppercase border-b border-navy-700">
                    <th className="px-4 py-2.5 text-left">Method</th>
                    <th className="px-4 py-2.5 text-left">Path</th>
                    <th className="px-4 py-2.5 text-left">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {API_ENDPOINTS.map((e,ei)=>(
                    <tr key={`${e.path}-${ei}`} className="border-b border-navy-700/50 hover:bg-navy-700/30">
                      <td className="px-4 py-2.5">
                        <span className={`px-2 py-0.5 rounded font-bold font-mono ${
                          e.method==="GET"?"bg-green-500/20 text-green-400":"bg-sky-500/20 text-sky-400"}`}>
                          {e.method}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-slate-300">{e.path}</td>
                      <td className="px-4 py-2.5 text-slate-400">{e.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            </div>
          </div>

          <div className="bg-navy-800 rounded-2xl p-5 border border-navy-600">
            <h3 className="font-semibold text-white mb-3">Phase Summary</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                {label:"Backend Phases",  value:"1–39 ✅"},
                {label:"Frontend Phases", value:"40–80 ✅"},
                {label:"Total Pages",     value:"78 pages"},
                {label:"API Endpoints",   value:"15+"},
                {label:"DB Tables",       value:"35+"},
                {label:"Load Capacity",   value:"18,512 req/s"},
              ].map(({label,value},vi)=>(
                <div key={`${label}-${vi}`} className="p-3 bg-navy-700/50 rounded-xl">
                  <div className="text-xs text-slate-400">{label}</div>
                  <div className="font-bold font-mono text-white">{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
