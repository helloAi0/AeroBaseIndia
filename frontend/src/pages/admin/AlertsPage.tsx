import { useState } from "react";
import { Bell, AlertTriangle, Plane, Clock, Zap, X } from "lucide-react";

const ALERTS = [
  {id:1, type:"DELAY",    title:"Flight UK-303 delayed 45min",    msg:"Gate C2 — Weather conditions at BOM", time:"2 min ago",  sev:"HIGH",    read:false},
  {id:2, type:"SECURITY", title:"Unusual login attempt detected", msg:"IP 45.33.32.156 blocked by gateway",  time:"15 min ago", sev:"HIGH",    read:false},
  {id:3, type:"SYSTEM",   title:"Redis memory at 78%",            msg:"Consider scaling Redis cluster",       time:"32 min ago", sev:"MED",     read:false},
  {id:4, type:"BILLING",  title:"Invoice INV-2024-006 due soon",  msg:"₹49,999 due in 3 days",               time:"1 hr ago",   sev:"LOW",     read:true},
  {id:5, type:"DELAY",    title:"AI-101 boarding started",        msg:"Gate A1 — All passengers notified",   time:"1 hr ago",   sev:"INFO",    read:true},
  {id:6, type:"SYSTEM",   title:"ML service prediction complete", msg:"156 delay predictions processed",     time:"2 hr ago",   sev:"INFO",    read:true},
  {id:7, type:"BILLING",  title:"Payment received",               msg:"₹1,49,999 from DEL airport",          time:"3 hr ago",   sev:"SUCCESS", read:true},
];

const TYPE_ICON: Record<string, React.ReactNode> = {
  DELAY:    <Plane className="w-4 h-4"/>,
  SECURITY: <AlertTriangle className="w-4 h-4"/>,
  SYSTEM:   <Zap className="w-4 h-4"/>,
  BILLING:  <Clock className="w-4 h-4"/>,
};

const SEV_STYLE: Record<string,string> = {
  HIGH:    "border-l-red-500 bg-red-500/5",
  MED:     "border-l-yellow-500 bg-yellow-500/5",
  LOW:     "border-l-sky-500 bg-sky-500/5",
  INFO:    "border-l-slate-500 bg-navy-700/30",
  SUCCESS: "border-l-green-500 bg-green-500/5",
};

const SEV_ICON_COLOR: Record<string,string> = {
  HIGH:"text-red-400", MED:"text-yellow-400",
  LOW:"text-sky-400",  INFO:"text-slate-400", SUCCESS:"text-green-400",
};

export function AlertsPage() {
  const [filter, setFilter] = useState("ALL");
  const [alerts, setAlerts] = useState(ALERTS);

  const filtered = filter==="ALL" ? alerts : alerts.filter(a=>a.type===filter);
  const unread   = alerts.filter(a=>!a.read).length;

  const markRead = (id:number) => setAlerts(prev=>prev.map(a=>a.id===id?{...a,read:true}:a));
  const markAllRead = () => setAlerts(prev=>prev.map(a=>({...a,read:true})));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Alerts & Notifications</h1>
          <p className="text-slate-400 text-sm mt-0.5">Real-time system alerts</p>
        </div>
        <div className="flex items-center gap-3">
          {unread>0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              {unread} new
            </span>
          )}
          <button onClick={markAllRead}
            className="text-xs text-sky-400 hover:text-sky-300 transition-colors">
            Mark all read
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {["ALL","DELAY","SECURITY","SYSTEM","BILLING"].map(f=>(
          <button key={f} onClick={()=>setFilter(f)}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all border ${
              filter===f
                ?"bg-sky-500 text-white border-sky-500"
                :"bg-navy-800 text-slate-400 border-navy-600 hover:border-navy-500 hover:text-white"
            }`}>{f}</button>
        ))}
      </div>

      {/* Alert list */}
      <div className="space-y-2">
        {filtered.map(alert=>(
          <div key={alert.id}
            className={`border-l-4 ${SEV_STYLE[alert.sev]} rounded-r-2xl p-4 flex items-start gap-4
              ${!alert.read?"ring-1 ring-inset ring-white/5":""} transition-all`}>
            <div className={`mt-0.5 flex-shrink-0 ${SEV_ICON_COLOR[alert.sev]}`}>
              {TYPE_ICON[alert.type]||<Bell className="w-4 h-4"/>}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className={`text-sm font-medium ${!alert.read?"text-white":"text-slate-300"}`}>
                  {alert.title}
                  {!alert.read && <span className="ml-2 w-1.5 h-1.5 bg-sky-400 rounded-full inline-block"/>}
                </p>
                <span className="text-xs text-slate-500 flex-shrink-0">{alert.time}</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{alert.msg}</p>
            </div>
            {!alert.read && (
              <button onClick={()=>markRead(alert.id)}
                className="flex-shrink-0 p-1 hover:bg-navy-600 rounded-lg text-slate-500 hover:text-white transition-colors">
                <X className="w-3.5 h-3.5"/>
              </button>
            )}
          </div>
        ))}
        {filtered.length===0 && (
          <div className="text-center py-12 text-slate-500">
            <Bell className="w-10 h-10 mx-auto mb-3 opacity-30"/>
            <p>No alerts in this category</p>
          </div>
        )}
      </div>
    </div>
  );
}
