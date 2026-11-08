import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchFlights, fetchEmailQueue } from "../../api/client";
import { Bell, Mail, Plane, Shield, CreditCard,
         Zap, CheckCircle, Trash2 } from "lucide-react";

interface Notif {
  id: number;
  type: "flight"|"email"|"security"|"payment"|"system";
  title: string;
  msg: string;
  time: string;
  read: boolean;
  severity: "info"|"warning"|"error"|"success";
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  flight:   <Plane className="w-4 h-4"/>,
  email:    <Mail className="w-4 h-4"/>,
  security: <Shield className="w-4 h-4"/>,
  payment:  <CreditCard className="w-4 h-4"/>,
  system:   <Zap className="w-4 h-4"/>,
};

const SEV_STYLE: Record<string, string> = {
  info:    "border-l-sky-500    bg-sky-500/5",
  warning: "border-l-yellow-500 bg-yellow-500/5",
  error:   "border-l-red-500    bg-red-500/5",
  success: "border-l-green-500  bg-green-500/5",
};


const INITIAL: Notif[] = [
  {id:1, type:"flight",   title:"AI-101 now boarding",         msg:"Gate A1 — Boarding started for DEL→BOM",        time:"Just now",  read:false, severity:"info"},
  {id:2, type:"security", title:"Login from new IP",           msg:"Admin login from 192.168.1.45 — verify",        time:"2 min ago", read:false, severity:"warning"},
  {id:3, type:"payment",  title:"Payment received ₹1,49,999",  msg:"Invoice INV-2024-006 paid via Razorpay",         time:"5 min ago", read:false, severity:"success"},
  {id:4, type:"flight",   title:"UK-303 delayed 45 min",       msg:"Weather at BOM causing delay — passengers notified", time:"12 min ago",read:false, severity:"warning"},
  {id:5, type:"email",    title:"2 emails queued",             msg:"Delay alert + billing invoice pending send",    time:"15 min ago",read:true,  severity:"info"},
  {id:6, type:"system",   title:"Redis memory 78%",            msg:"Consider scaling Redis — currently 78% full",   time:"32 min ago",read:true,  severity:"warning"},
  {id:7, type:"payment",  title:"Stripe webhook verified",     msg:"Payment pi_ORD confirmed — order updated",      time:"1 hr ago",  read:true,  severity:"success"},
  {id:8, type:"system",   title:"ML prediction complete",      msg:"156 delay predictions processed — accuracy 91%",time:"2 hr ago",  read:true,  severity:"info"},
];

export function NotificationCenter() {
  const [notifs, setNotifs]   = useState<Notif[]>(INITIAL);
  const [filter, setFilter]   = useState<string>("all");
  const [liveLog, setLiveLog] = useState<string[]>([]);
  const logRef = useRef<HTMLDivElement>(null);
  const counter = useRef(100);

  const {data:flights=[]} = useQuery({queryKey:["flights"],queryFn:fetchFlights,refetchInterval:10000});
  const {data:emailData}  = useQuery({queryKey:["emailQueue"],queryFn:fetchEmailQueue});

  // Simulate live event stream
  useEffect(()=>{
    const events = [
      "→ Flight AI-101 status: Boarding",
      "→ Gate B3 assigned to 6E-202",
      "→ Baggage scan: DEL123002 cleared",
      "→ API request /flights 200 OK 13ms",
      "→ Redis cache hit: flight_status:UK-303",
      "→ ML prediction: SG-404 delay=0min",
      "→ Webhook received from Razorpay",
      "→ Compliance log entry created",
      "→ Tenant DEL: usage metric recorded",
      "→ WebSocket broadcast to 3 clients",
    ];
    let i = 0;
    const t = setInterval(()=>{
      const ts = new Date().toLocaleTimeString();
      setLiveLog(prev=>[`[${ts}] ${events[i%events.length]}`,...prev].slice(0,20));
      i++;
    },2500);
    return ()=>clearInterval(t);
  },[]);

  useEffect(()=>{
    // Add notification when flights update
    const fl = flights as any[];
    const delayed = fl.filter(f=>f.status==="Delayed");
    if(delayed.length>0){
      const already = notifs.find(n=>n.title.includes(delayed[0].flight_number));
      if(!already){
        counter.current++;
        setNotifs(prev=>[{
          id:counter.current,
          type:"flight",
          title:`${delayed[0].flight_number} is delayed`,
          msg:`${delayed[0].origin}→${delayed[0].destination} — Check gate ${delayed[0].gate}`,
          time:"Live",
          read:false,
          severity:"warning"
        },...prev]);
      }
    }
  },[flights]);

  useEffect(()=>{
    // Add email queue notifications
    const emails = (emailData as any)?.emails||[];
    if(emails.length>0){
      counter.current++;
      setNotifs(prev=>{
        if(prev.find(n=>n.title.includes("email queue"))) return prev;
        return [{
          id:counter.current,
          type:"email",
          title:`${emails.length} emails in queue`,
          msg:emails.map((e:any)=>e.type).join(", "),
          time:"Live",
          read:false,
          severity:"info"
        },...prev];
      });
    }
  },[emailData]);

  const unread   = notifs.filter(n=>!n.read).length;
  const filtered = filter==="all" ? notifs : notifs.filter(n=>n.type===filter);

  const markRead    = (id:number) => setNotifs(p=>p.map(n=>n.id===id?{...n,read:true}:n));
  const markAllRead = ()          => setNotifs(p=>p.map(n=>({...n,read:true})));
  const deleteNotif = (id:number) => setNotifs(p=>p.filter(n=>n.id!==id));
  const clearRead   = ()          => setNotifs(p=>p.filter(n=>!n.read));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Notification Center</h1>
          <p className="text-slate-400 text-sm mt-0.5">Real-time alerts & system events</p>
        </div>
        <div className="flex items-center gap-3">
          {unread>0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              {unread} unread
            </span>
          )}
          <button onClick={markAllRead}
            className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 transition-colors">
            <CheckCircle className="w-3.5 h-3.5"/>Mark all read
          </button>
          <button onClick={clearRead}
            className="text-xs text-slate-400 hover:text-red-400 flex items-center gap-1 transition-colors">
            <Trash2 className="w-3.5 h-3.5"/>Clear read
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-5 gap-3">
        {[
          {type:"all",     label:"All",      icon:<Bell className="w-4 h-4"/>,       count:notifs.length},
          {type:"flight",  label:"Flights",  icon:<Plane className="w-4 h-4"/>,      count:notifs.filter(n=>n.type==="flight").length},
          {type:"security",label:"Security", icon:<Shield className="w-4 h-4"/>,     count:notifs.filter(n=>n.type==="security").length},
          {type:"payment", label:"Payments", icon:<CreditCard className="w-4 h-4"/>, count:notifs.filter(n=>n.type==="payment").length},
          {type:"system",  label:"System",   icon:<Zap className="w-4 h-4"/>,        count:notifs.filter(n=>n.type==="system").length},
        ].map(({type,label,icon,count})=>(
          <button key={type} onClick={()=>setFilter(type)}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
              filter===type
                ?"bg-sky-500/15 border-sky-500/30 text-sky-300"
                :"bg-navy-800 border-navy-600 text-slate-400 hover:border-navy-500"
            }`}>
            {icon}
            <span className="text-xs font-medium">{label}</span>
            <span className={`text-lg font-bold font-mono ${filter===type?"text-white":"text-slate-300"}`}>
              {count}
            </span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Notifications list */}
        <div className="xl:col-span-2 space-y-2">
          {filtered.length===0 && (
            <div className="text-center py-12 text-slate-500 bg-navy-800 rounded-2xl border border-navy-600">
              <Bell className="w-10 h-10 mx-auto mb-3 opacity-30"/>
              <p>No notifications</p>
            </div>
          )}
          {filtered.map(n=>(
            <div key={n.id}
              className={`border-l-4 ${SEV_STYLE[n.severity]} rounded-r-2xl p-4 flex items-start gap-3 group
                ${!n.read?"ring-1 ring-inset ring-white/5":""}`}>
              <div className={`mt-0.5 flex-shrink-0 ${
                n.severity==="success"?"text-green-400":
                n.severity==="warning"?"text-yellow-400":
                n.severity==="error"  ?"text-red-400":"text-sky-400"
              }`}>
                {TYPE_ICON[n.type]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-0.5">
                  <p className={`text-sm font-medium ${!n.read?"text-white":"text-slate-300"}`}>
                    {n.title}
                    {!n.read && <span className="ml-2 inline-block w-1.5 h-1.5 bg-sky-400 rounded-full"/>}
                  </p>
                  <span className="text-xs text-slate-500 flex-shrink-0">{n.time}</span>
                </div>
                <p className="text-xs text-slate-400">{n.msg}</p>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                {!n.read && (
                  <button onClick={()=>markRead(n.id)}
                    className="p-1.5 hover:bg-navy-600 rounded-lg text-slate-500 hover:text-green-400 transition-colors"
                    title="Mark read">
                    <CheckCircle className="w-3.5 h-3.5"/>
                  </button>
                )}
                <button onClick={()=>deleteNotif(n.id)}
                  className="p-1.5 hover:bg-navy-600 rounded-lg text-slate-500 hover:text-red-400 transition-colors"
                  title="Delete">
                  <Trash2 className="w-3.5 h-3.5"/>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Live event stream */}
        <div className="bg-navy-800 rounded-2xl border border-navy-600 overflow-hidden h-fit">
          <div className="p-4 border-b border-navy-600 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"/>
            <h2 className="font-semibold text-white text-sm">Live Event Stream</h2>
          </div>
          <div ref={logRef} className="p-4 space-y-1.5 font-mono text-xs max-h-96 overflow-y-auto">
            {liveLog.length===0 && (
              <p className="text-slate-500">Waiting for events...</p>
            )}
            {liveLog.map((log,i)=>(
              <div key={i} className={`text-slate-400 leading-relaxed ${
                i===0?"text-green-300 font-medium":""
              }`}>
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
