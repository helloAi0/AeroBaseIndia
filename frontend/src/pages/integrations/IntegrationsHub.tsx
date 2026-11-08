import { useState } from "react";
import { Plug, CheckCircle, Clock, RefreshCw, Key, Activity } from "lucide-react";

const INTEGRATIONS = [
  {
    id:"razorpay",   name:"Razorpay",         category:"Payments",
    logo:"💳",        status:"Connected",       lastSync:"2 min ago",
    desc:"Payment gateway for invoice processing",
    config:{key:"rzp_test_••••••••",webhook:"/payments/webhook/razorpay",events:["payment.captured","payment.failed"]},
    metrics:{calls:1240,success:98.2,latency:245},
  },
  {
    id:"stripe",     name:"Stripe",            category:"Payments",
    logo:"⚡",        status:"Connected",       lastSync:"5 min ago",
    desc:"International payment processing",
    config:{key:"sk_test_••••••••",webhook:"/payments/webhook/stripe",events:["payment_intent.succeeded"]},
    metrics:{calls:340,success:99.1,latency:180},
  },
  {
    id:"sendgrid",   name:"SendGrid",          category:"Email",
    logo:"📧",        status:"Configured",      lastSync:"Never",
    desc:"Transactional email delivery",
    config:{key:"SG.••••••••",webhook:"",events:["delivered","bounced"]},
    metrics:{calls:0,success:0,latency:0},
  },
  {
    id:"prometheus", name:"Prometheus",        category:"Monitoring",
    logo:"📊",        status:"Connected",       lastSync:"10s ago",
    desc:"Metrics scraping at /metrics endpoint",
    config:{endpoint:"/metrics",interval:"15s",retention:"30d"},
    metrics:{calls:8640,success:100,latency:12},
  },
  {
    id:"kubernetes", name:"Kubernetes",        category:"Deploy",
    logo:"☸",         status:"Connected",       lastSync:"1 hr ago",
    desc:"Container orchestration & auto-scaling",
    config:{cluster:"aerobase-prod",namespace:"default",replicas:3},
    metrics:{calls:288,success:100,latency:450},
  },
  {
    id:"redis",      name:"Redis Cache",       category:"Cache",
    logo:"⚡",        status:"Connected",       lastSync:"Live",
    desc:"In-memory caching layer",
    config:{host:"127.0.0.1",port:"6379",db:0},
    metrics:{calls:84200,success:99.9,latency:2},
  },
  {
    id:"postgres",   name:"PostgreSQL",        category:"Database",
    logo:"🐘",        status:"Connected",       lastSync:"Live",
    desc:"Primary relational database",
    config:{host:"127.0.0.1",port:"5432",db:"aerobase",pool:10},
    metrics:{calls:12480,success:99.9,latency:18},
  },
  {
    id:"ml_flask",   name:"ML Service",        category:"AI/ML",
    logo:"🤖",        status:"Connected",       lastSync:"30s ago",
    desc:"Python Flask delay prediction model",
    config:{endpoint:"http://localhost:5000",model:"delay_v2"},
    metrics:{calls:156,success:94.2,latency:380},
  },
  {
    id:"github",     name:"GitHub Actions",    category:"CI/CD",
    logo:"🐙",        status:"Configured",      lastSync:"Last push",
    desc:"CI/CD pipeline automation",
    config:{repo:"aerobase-india",branch:"main",workflows:3},
    metrics:{calls:45,success:91.1,latency:0},
  },
  {
    id:"dgca",       name:"DGCA Portal",       category:"Compliance",
    logo:"✈",         status:"Pending",         lastSync:"Never",
    desc:"Indian aviation authority data feed",
    config:{apiKey:"pending",endpoint:"https://api.dgca.gov.in"},
    metrics:{calls:0,success:0,latency:0},
  },
];

const STATUS_STYLE: Record<string,string> = {
  Connected:  "bg-green-500/15 text-green-400 border-green-500/20",
  Configured: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  Pending:    "bg-slate-500/15 text-slate-400 border-slate-500/20",
  Error:      "bg-red-500/15 text-red-400 border-red-500/20",
};

const CAT_COLOR: Record<string,string> = {
  Payments:"sky", Email:"teal", Monitoring:"purple",
  Deploy:"orange", Cache:"yellow", Database:"blue",
  "AI/ML":"pink", "CI/CD":"green", Compliance:"red",
};

export function IntegrationsHub() {
  const [selected, setSelected] = useState<typeof INTEGRATIONS[0]|null>(null);
  const [filter,   setFilter]   = useState("All");

  const cats = ["All",...Array.from(new Set(INTEGRATIONS.map(i=>i.category)))];
  const filtered = INTEGRATIONS.filter(i=>filter==="All"||i.category===filter);

  const connected = INTEGRATIONS.filter(i=>i.status==="Connected").length;
  const totalCalls = INTEGRATIONS.reduce((s,i)=>s+i.metrics.calls,0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Integrations Hub</h1>
        <p className="text-slate-400 text-sm mt-0.5">Third-party services, APIs and infrastructure connections</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          {label:"Total Integrations",value:INTEGRATIONS.length,    icon:<Plug className="w-5 h-5"/>,     color:"sky"},
          {label:"Connected",         value:connected,               icon:<CheckCircle className="w-5 h-5"/>,color:"green"},
          {label:"Pending Setup",     value:INTEGRATIONS.filter(i=>i.status==="Pending").length,
                                                                     icon:<Clock className="w-5 h-5"/>,    color:"yellow"},
          {label:"API Calls Today",   value:totalCalls.toLocaleString(),icon:<Activity className="w-5 h-5"/>,color:"teal"},
        ].map(({label,value,icon,color})=>(
          <div key={label} className="bg-navy-800 rounded-2xl p-5 border border-navy-600">
            <div className={`text-${color}-400 mb-3`}>{icon}</div>
            <div className="text-2xl font-bold font-mono text-white mb-0.5">{value}</div>
            <div className="text-sm text-slate-400">{label}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {cats.map(c=>(
          <button key={c} onClick={()=>setFilter(c)}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition-all ${
              filter===c?"bg-sky-500 text-white border-sky-500":
              "bg-navy-800 text-slate-400 border-navy-600 hover:text-white"}`}>
            {c}
          </button>
        ))}
      </div>

      <div className={`grid gap-5 ${selected?"xl:grid-cols-3":"xl:grid-cols-1"}`}>
        <div className={`grid gap-4 content-start ${selected?"xl:col-span-2":"xl:grid-cols-2"}`}>
          {filtered.map(intg=>(
            <div key={intg.id} onClick={()=>setSelected(selected?.id===intg.id?null:intg)}
              className={`bg-navy-800 rounded-2xl p-5 border cursor-pointer transition-all ${
                selected?.id===intg.id?"border-sky-500/50":"border-navy-600 hover:border-navy-500"}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{intg.logo}</div>
                  <div>
                    <div className="font-semibold text-white">{intg.name}</div>
                    <span className={`text-xs px-2 py-0.5 rounded-full bg-${CAT_COLOR[intg.category]||"sky"}-500/15 text-${CAT_COLOR[intg.category]||"sky"}-400`}>
                      {intg.category}
                    </span>
                  </div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full border font-medium flex-shrink-0 ${STATUS_STYLE[intg.status]}`}>
                  {intg.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-3">{intg.desc}</p>
              {intg.metrics.calls>0 && (
                <div className="flex gap-4 text-xs text-slate-500">
                  <span><span className="text-white font-mono">{intg.metrics.calls.toLocaleString()}</span> calls</span>
                  <span><span className="text-green-400 font-mono">{intg.metrics.success}%</span> success</span>
                  <span><span className="text-sky-300 font-mono">{intg.metrics.latency}ms</span> avg</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {selected && (
          <div className="bg-navy-800 rounded-2xl border border-sky-500/30 p-5 space-y-4 h-fit">
            <div className="flex justify-between">
              <h2 className="font-semibold text-white">Integration Config</h2>
              <button onClick={()=>setSelected(null)} className="text-slate-500 hover:text-white text-xl">×</button>
            </div>
            <div className="p-4 bg-navy-700/50 rounded-xl flex items-center gap-3">
              <div className="text-4xl">{selected.logo}</div>
              <div>
                <div className="font-bold text-white">{selected.name}</div>
                <div className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_STYLE[selected.status]} w-fit mt-1`}>
                  {selected.status}
                </div>
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Configuration</div>
              <div className="space-y-2">
                {Object.entries(selected.config).map(([k,v])=>(
                  <div key={k} className="flex justify-between p-2.5 bg-navy-700/40 rounded-xl">
                    <span className="text-xs text-slate-400 font-mono">{k}</span>
                    <span className="text-xs text-white font-mono truncate max-w-[60%] text-right">
                      {Array.isArray(v)?v.join(", "):String(v)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {selected.metrics.calls>0 && (
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Metrics</div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    {label:"Calls",   value:selected.metrics.calls.toLocaleString(),color:"sky"},
                    {label:"Success", value:`${selected.metrics.success}%`,          color:"green"},
                    {label:"Latency", value:`${selected.metrics.latency}ms`,         color:"teal"},
                  ].map(({label,value,color})=>(
                    <div key={label} className="text-center p-2.5 bg-navy-700/50 rounded-xl">
                      <div className={`text-sm font-bold font-mono text-${color}-400`}>{value}</div>
                      <div className="text-xs text-slate-500">{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button className="flex items-center justify-center gap-1.5 bg-sky-500/15 text-sky-400 border border-sky-500/20 py-2.5 rounded-xl text-xs font-medium hover:bg-sky-500/25 transition-colors">
                <RefreshCw className="w-3.5 h-3.5"/>Test Connection
              </button>
              <button className="flex items-center justify-center gap-1.5 bg-navy-700 text-slate-400 py-2.5 rounded-xl text-xs font-medium hover:text-white transition-colors">
                <Key className="w-3.5 h-3.5"/>Edit Config
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
              <RefreshCw className="w-3 h-3"/>
              Last sync: {selected.lastSync}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
