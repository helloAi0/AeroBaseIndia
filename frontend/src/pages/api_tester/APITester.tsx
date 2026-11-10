import { copyText } from "../../lib/clipboard";
import { useState } from "react";
import { api } from "../../api/client";
import { Play, Copy, CheckCircle, Code2,
         ChevronDown, ChevronRight } from "lucide-react";

const ENDPOINTS = [
  { group:"System",
    apis:[
      {method:"GET",  path:"/health",           body:"",              desc:"System health check"},
      {method:"GET",  path:"/metrics",           body:"",              desc:"Prometheus metrics"},
      {method:"GET",  path:"/api-docs",          body:"",              desc:"OpenAPI specification"},
    ]
  },
  { group:"Flights",
    apis:[
      {method:"GET",  path:"/flights",           body:"",              desc:"List all flights"},
      {method:"POST", path:"/flights",           desc:"Create flight",
       body:JSON.stringify({flight_number:"AI-999",origin:"DEL",destination:"BOM",gate:"A1",departure_time:"2024-12-01T10:00:00",arrival_time:"2024-12-01T12:00:00",weather_score:3,congestion_score:2},null,2)},
    ]
  },
  { group:"GraphQL",
    apis:[
      {method:"POST", path:"/graphql", desc:"Query flights",
       body:JSON.stringify({query:"{ flights { flightNumber origin destination status } }"},null,2)},
      {method:"POST", path:"/graphql", desc:"Health status",
       body:JSON.stringify({query:"{ healthStatus { api database redis } }"},null,2)},
      {method:"POST", path:"/graphql", desc:"Revenue metrics",
       body:JSON.stringify({query:'{ revenueMetrics(tenantId: "DEL") { totalUsage currency } }'},null,2)},
    ]
  },
  { group:"AI/ML",
    apis:[
      {method:"POST", path:"/predict/delay", desc:"Predict delay",
       body:JSON.stringify({weather_score:7,congestion_score:8},null,2)},
    ]
  },
  { group:"Payments",
    apis:[
      {method:"GET",  path:"/payments/orders", body:"",              desc:"List payment orders"},
      {method:"POST", path:"/payments/order",  desc:"Create order",
       body:JSON.stringify({invoice_id:"INV-TEST-001",amount:49999,currency:"INR",gateway:"razorpay"},null,2)},
    ]
  },
  { group:"Notifications",
    apis:[
      {method:"GET",  path:"/notify/queue",       body:"",    desc:"Email queue"},
      {method:"POST", path:"/notify/test/delay",  desc:"Test delay email",
       body:JSON.stringify({to:"test@aerobase.in",flight:"AI-101",delay_mins:45},null,2)},
    ]
  },
  { group:"Observability",
    apis:[
      {method:"GET",  path:"/traces",     body:"", desc:"Distributed traces"},
      {method:"GET",  path:"/traces/abc", body:"", desc:"Trace by ID"},
    ]
  },
];

const METHOD_STYLE: Record<string,string> = {
  GET:   "bg-green-500/15 text-green-400 border-green-500/30",
  POST:  "bg-sky-500/15 text-sky-400 border-sky-500/30",
  PUT:   "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  DELETE:"bg-red-500/15 text-red-400 border-red-500/30",
};

export function APITester() {
  const [selected,   setSelected]   = useState(ENDPOINTS[0].apis[0]);
  const [body,       setBody]       = useState("");
  const [response,   setResponse]   = useState<any>(null);
  const [loading,    setLoading]    = useState(false);
  const [duration,   setDuration]   = useState<number|null>(null);
  const [statusCode, setStatusCode] = useState<number|null>(null);
  const [copied,     setCopied]     = useState(false);
  const [expanded,   setExpanded]   = useState<string[]>(["System","Flights"]);
  const [tenantId,   setTenantId]   = useState("DEL");

  const selectApi = (api:typeof ENDPOINTS[0]["apis"][0]) => {
    setSelected(api);
    setBody(api.body||"");
    setResponse(null);
    setStatusCode(null);
    setDuration(null);
  };

  const run = async () => {
    setLoading(true);
    const start = Date.now();
    try {
      const cfg: any = {
        headers: { "X-Tenant-ID": tenantId },
      };
      let res: any;
      if (selected.method==="GET") {
        res = await api.get(selected.path, cfg);
      } else {
        const parsed = body ? JSON.parse(body) : {};
        res = await api.post(selected.path, parsed, cfg);
      }
      setDuration(Date.now()-start);
      setStatusCode(res.status);
      setResponse(res.data);
    } catch(e: any) {
      setDuration(Date.now()-start);
      setStatusCode(e.response?.status||0);
      setResponse(e.response?.data||{error:String(e.message)});
    }
    setLoading(false);
  };

  const copy = async () => {
    if (!(await copyText(JSON.stringify(response,null,2)))) return;
    setCopied(true);
    setTimeout(()=>setCopied(false),1500);
  };

  const toggleGroup = (g:string) =>
    setExpanded(p=>p.includes(g)?p.filter(x=>x!==g):[...p,g]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-white">API Tester</h1>
        <p className="text-slate-400 text-sm mt-0.5">Interactive REST API client — test all endpoints live</p>
      </div>

      <div className="flex items-center gap-3 bg-navy-800 rounded-xl p-3 border border-navy-600">
        <span className="text-xs text-slate-400">Base URL:</span>
        <span className="font-mono text-sm text-sky-300">http://localhost:8080</span>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-slate-400">X-Tenant-ID:</span>
          <input value={tenantId} onChange={e=>setTenantId(e.target.value)}
            className="bg-navy-700 border border-navy-600 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none w-20 font-mono"/>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-5" style={{minHeight:"70vh"}}>
        {/* Sidebar — endpoint list */}
        <div className="bg-navy-800 rounded-2xl border border-navy-600 overflow-hidden xl:col-span-1">
          <div className="p-4 border-b border-navy-600">
            <h2 className="font-semibold text-white text-sm">Endpoints</h2>
          </div>
          <div className="overflow-y-auto" style={{maxHeight:"calc(70vh - 60px)"}}>
            {ENDPOINTS.map(({group,apis})=>(
              <div key={group}>
                <button onClick={()=>toggleGroup(group)}
                  className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-navy-700/50 transition-colors">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{group}</span>
                  {expanded.includes(group)
                    ?<ChevronDown className="w-3.5 h-3.5 text-slate-500"/>
                    :<ChevronRight className="w-3.5 h-3.5 text-slate-500"/>
                  }
                </button>
                {expanded.includes(group) && apis.map((a,i)=>(
                  <button key={i} onClick={()=>selectApi(a)}
                    className={`w-full flex items-center gap-2 px-4 py-2.5 text-left transition-all ${
                      selected===a?"bg-sky-500/15 border-r-2 border-sky-500":"hover:bg-navy-700/40"}`}>
                    <span className={`text-xs px-1.5 py-0.5 rounded border font-mono font-bold flex-shrink-0 ${METHOD_STYLE[a.method]}`}>
                      {a.method}
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs text-slate-200 truncate">{a.path}</div>
                      <div className="text-xs text-slate-500 truncate">{a.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Main area */}
        <div className="xl:col-span-3 space-y-4">
          {/* Request */}
          <div className="bg-navy-800 rounded-2xl border border-navy-600 overflow-hidden">
            <div className="flex items-center gap-3 p-4 border-b border-navy-600">
              <span className={`text-sm px-3 py-1.5 rounded-lg border font-mono font-bold ${METHOD_STYLE[selected.method]}`}>
                {selected.method}
              </span>
              <span className="font-mono text-sm text-white flex-1">{selected.path}</span>
              <button onClick={run} disabled={loading}
                className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 disabled:opacity-60 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-colors">
                <Play className="w-4 h-4 fill-current"/>
                {loading?"Running...":"Send"}
              </button>
            </div>

            {selected.body && (
              <div>
                <div className="px-4 py-2 border-b border-navy-700 text-xs text-slate-500 font-semibold uppercase">
                  Request Body (JSON)
                </div>
                <textarea value={body} onChange={e=>setBody(e.target.value)} rows={6}
                  className="w-full bg-navy-900 text-green-300 font-mono text-xs p-4 outline-none resize-none"/>
              </div>
            )}
          </div>

          {/* Response */}
          <div className="bg-navy-800 rounded-2xl border border-navy-600 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-navy-600">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${
                  statusCode===null?"bg-slate-500":
                  statusCode<300?"bg-green-400 animate-pulse":"bg-red-400"}`}/>
                <span className="text-sm font-semibold text-white">Response</span>
                {statusCode !== null && (
                  <span className={`text-xs px-2.5 py-1 rounded-full border font-bold ${
                    statusCode<300?"bg-green-500/15 text-green-400 border-green-500/20":
                    "bg-red-500/15 text-red-400 border-red-500/20"}`}>
                    {statusCode}
                  </span>
                )}
                {duration !== null && (
                  <span className="text-xs text-slate-500">{duration}ms</span>
                )}
              </div>
              {response && (
                <button onClick={copy}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
                  {copied?<CheckCircle className="w-3.5 h-3.5 text-green-400"/>:<Copy className="w-3.5 h-3.5"/>}
                  {copied?"Copied!":"Copy"}
                </button>
              )}
            </div>
            <div className="p-4 font-mono text-xs overflow-auto" style={{minHeight:"200px",maxHeight:"400px"}}>
              {loading && (
                <div className="flex items-center gap-2 text-slate-400">
                  <div className="w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin"/>
                  Sending request...
                </div>
              )}
              {!loading && !response && (
                <div className="text-slate-500 text-center pt-8">
                  <Code2 className="w-8 h-8 mx-auto mb-2 opacity-30"/>
                  <p>Click Send to test the endpoint</p>
                </div>
              )}
              {!loading && response && (
                <pre className={`whitespace-pre-wrap leading-relaxed ${
                  statusCode && statusCode<300?"text-green-300":"text-red-300"}`}>
                  {JSON.stringify(response,null,2)}
                </pre>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
