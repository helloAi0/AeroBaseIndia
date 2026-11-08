import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchFlights, fetchHealth } from "../../api/client";
import { Wifi, WifiOff, Activity, Plane,
         Shield, CreditCard, Zap, Bell } from "lucide-react";

interface LiveEvent {
  id:        number;
  type:      string;
  message:   string;
  timestamp: string;
  severity:  "info"|"success"|"warning"|"error";
  data?:     Record<string,string|number>;
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  flight:   <Plane className="w-4 h-4"/>,
  security: <Shield className="w-4 h-4"/>,
  payment:  <CreditCard className="w-4 h-4"/>,
  system:   <Zap className="w-4 h-4"/>,
  alert:    <Bell className="w-4 h-4"/>,
};

const SEV_COLOR: Record<string,string> = {
  info:    "text-sky-400 border-sky-500/20 bg-sky-500/5",
  success: "text-green-400 border-green-500/20 bg-green-500/5",
  warning: "text-yellow-400 border-yellow-500/20 bg-yellow-500/5",
  error:   "text-red-400 border-red-500/20 bg-red-500/5",
};

const EVENT_TEMPLATES = [
  {type:"flight",  sev:"info",    msg:(f:string)=>`Flight ${f} status updated → Boarding`},
  {type:"system",  sev:"success", msg:(_:string)=>"API Gateway: 847 req/min — healthy"},
  {type:"security",sev:"warning", msg:(_:string)=>"Rate limit reached for tenant BLR"},
  {type:"flight",  sev:"info",    msg:(f:string)=>`Gate assignment: ${f} → Gate A2`},
  {type:"payment", sev:"success", msg:(_:string)=>"Razorpay webhook received — payment verified"},
  {type:"system",  sev:"info",    msg:(_:string)=>"Redis cache hit rate: 94.2%"},
  {type:"flight",  sev:"warning", msg:(f:string)=>`${f} predicted delay: 23 min`},
  {type:"system",  sev:"info",    msg:(_:string)=>"ML model: 12 predictions processed"},
  {type:"alert",   sev:"error",   msg:(_:string)=>"Low visibility alert issued for Runway 28L"},
  {type:"security",sev:"info",    msg:(_:string)=>"JWT token validated for admin@del.in"},
  {type:"flight",  sev:"success", msg:(f:string)=>`${f} landed at 14:32 — on schedule`},
  {type:"system",  sev:"info",    msg:(_:string)=>"Digital Twin state synced — 12 gates updated"},
  {type:"payment", sev:"info",    msg:(_:string)=>"Stripe order ORD-ABC123 created"},
  {type:"alert",   sev:"warning", msg:(_:string)=>"Cargo temperature alert: Tank C above threshold"},
  {type:"system",  sev:"success", msg:(_:string)=>"Health check passed — all systems UP"},
];

export function WebSocketFeed() {
  const [events,    setEvents]    = useState<LiveEvent[]>([]);
  const [connected] = useState(true);
  const [paused,    setPaused]    = useState(false);
  const [filter,    setFilter]    = useState("all");
  const [counter,   setCounter]   = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  const {data:flights=[]} = useQuery({queryKey:["flights"],queryFn:fetchFlights,refetchInterval:10000});
  const {data:health}     = useQuery({queryKey:["health"], queryFn:fetchHealth, refetchInterval:10000});

  const fl = flights as any[];
  const flightNums = fl.length>0 ? fl.map((f:any)=>f.flight_number) : ["AI-101","6E-202","UK-303"];

  useEffect(()=>{
    if(paused) return;
    const interval = setInterval(()=>{
      const tmpl = EVENT_TEMPLATES[Math.floor(Math.random()*EVENT_TEMPLATES.length)];
      const flight = flightNums[Math.floor(Math.random()*flightNums.length)]||"AI-101";
      const now = new Date();
      const event: LiveEvent = {
        id:        counter + Date.now(),
        type:      tmpl.type,
        message:   tmpl.msg(flight),
        timestamp: now.toLocaleTimeString(),
        severity:  tmpl.sev as any,
        data:      {latency:`${Math.floor(Math.random()*50+5)}ms`,tenant:"DEL"},
      };
      setEvents(prev=>[...prev.slice(-99), event]);
      setCounter(p=>p+1);
    }, 1500);
    return ()=>clearInterval(interval);
  }, [paused, flightNums, counter]);

  useEffect(()=>{
    if(!paused) bottomRef.current?.scrollIntoView({behavior:"smooth"});
  },[events, paused]);

  const eventsPerSec = (events.length/Math.max(counter,1)*0.67).toFixed(1);
  const filtered = filter==="all"?events:events.filter(e=>e.type===filter);

  const counts = {
    flight:   events.filter(e=>e.type==="flight").length,
    security: events.filter(e=>e.type==="security").length,
    system:   events.filter(e=>e.type==="system").length,
    payment:  events.filter(e=>e.type==="payment").length,
    alert:    events.filter(e=>e.type==="alert").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">WebSocket Live Feed</h1>
          <p className="text-slate-400 text-sm mt-0.5">Real-time event stream simulation</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium ${
            connected?"bg-green-500/10 border-green-500/20 text-green-400":
                      "bg-red-500/10 border-red-500/20 text-red-400"}`}>
            {connected?<Wifi className="w-4 h-4"/>:<WifiOff className="w-4 h-4"/>}
            {connected?"Connected":"Disconnected"}
          </div>
          <button onClick={()=>setPaused(p=>!p)}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
              paused?"bg-sky-500 text-white border-sky-500":
                     "bg-navy-800 text-slate-400 border-navy-600 hover:text-white"}`}>
            {paused?"▶ Resume":"⏸ Pause"}
          </button>
          <button onClick={()=>setEvents([])}
            className="px-4 py-2 rounded-xl text-sm font-medium border border-navy-600 bg-navy-800 text-slate-400 hover:text-white transition-all">
            Clear
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 xl:grid-cols-6 gap-3">
        {[
          {label:"Total Events",  value:events.length,      color:"sky"},
          {label:"Events/sec",    value:eventsPerSec,        color:"teal"},
          {label:"Flight",        value:counts.flight,       color:"blue"},
          {label:"Security",      value:counts.security,     color:"red"},
          {label:"System",        value:counts.system,       color:"purple"},
          {label:"Alerts",        value:counts.alert,        color:"yellow"},
        ].map(({label,value,color})=>(
          <div key={label} className="bg-navy-800 rounded-xl p-3 border border-navy-600 text-center">
            <div className={`text-xl font-bold font-mono text-${color}-400`}>{value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {["all","flight","security","system","payment","alert"].map(f=>(
          <button key={f} onClick={()=>setFilter(f)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium border transition-all capitalize ${
              filter===f?"bg-sky-500 text-white border-sky-500":
              "bg-navy-800 text-slate-400 border-navy-600 hover:text-white"}`}>
            {TYPE_ICON[f]||<Activity className="w-3.5 h-3.5"/>}
            {f}
          </button>
        ))}
      </div>

      {/* Live feed */}
      <div className="bg-navy-900 rounded-2xl border border-navy-600 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-navy-600 bg-navy-800/50">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${connected&&!paused?"bg-green-400 animate-pulse":"bg-slate-500"}`}/>
            <span className="text-sm font-semibold text-white">Live Event Stream</span>
            <span className="text-xs text-slate-500">{filtered.length} events</span>
          </div>
          {paused && <span className="text-xs text-yellow-400 font-medium">⏸ PAUSED</span>}
        </div>

        <div className="overflow-y-auto p-4 space-y-2 font-mono text-xs" style={{height:"420px"}}>
          {filtered.length===0 && (
            <div className="text-center text-slate-500 pt-16">
              <Activity className="w-8 h-8 mx-auto mb-2 opacity-30"/>
              <p>Waiting for events...</p>
            </div>
          )}
          {filtered.map((e,i)=>(
            <div key={e.id}
              className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                i===filtered.length-1&&!paused?"ring-1 ring-sky-500/30":""} ${SEV_COLOR[e.severity]}`}>
              <div className="flex-shrink-0 mt-0.5">{TYPE_ICON[e.type]||<Activity className="w-4 h-4"/>}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-slate-400">[{e.timestamp}]</span>
                  <span className="uppercase font-bold opacity-70">{e.type}</span>
                </div>
                <div className="text-current">{e.message}</div>
                {e.data && (
                  <div className="flex gap-3 mt-1 opacity-50">
                    {Object.entries(e.data).map(([k,v])=>(
                      <span key={k}>{k}: {v}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef}/>
        </div>
      </div>

      {/* System health */}
      <div className="grid grid-cols-4 gap-4">
        {[
          {label:"API Status",  value:(health as any)?.status==="healthy"?"UP":"DOWN",  ok:(health as any)?.status==="healthy"},
          {label:"Database",    value:(health as any)?.database||"—",                   ok:(health as any)?.database==="UP"},
          {label:"Redis",       value:(health as any)?.redis||"—",                      ok:(health as any)?.redis==="UP"},
          {label:"AI Engine",   value:(health as any)?.ai_engine||"—",                  ok:(health as any)?.ai_engine==="UP"},
        ].map(({label,value,ok})=>(
          <div key={label} className="bg-navy-800 rounded-xl p-4 border border-navy-600 flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${ok?"bg-green-400 animate-pulse":"bg-red-400"}`}/>
            <div>
              <div className="text-xs text-slate-400">{label}</div>
              <div className={`text-sm font-bold ${ok?"text-green-400":"text-red-400"}`}>{value}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
