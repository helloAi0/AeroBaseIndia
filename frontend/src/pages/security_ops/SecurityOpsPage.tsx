
import { AlertTriangle, Eye, Radio } from "lucide-react";

const ZONES = [
  {id:"Z1", name:"Terminal 3 — Departures Level 3",  status:"clear",   cameras:12, officers:4},
  {id:"Z2", name:"Terminal 1 — Check-in Hall",        status:"alert",   cameras:8,  officers:2},
  {id:"Z3", name:"Terminal 2 — Security Lane Area",   status:"clear",   cameras:10, officers:3},
  {id:"Z4", name:"Runway Perimeter — North Side",     status:"clear",   cameras:20, officers:2},
  {id:"Z5", name:"Cargo Terminal — Gate 5",           status:"watch",   cameras:6,  officers:1},
  {id:"Z6", name:"Parking P3 — Level 2",              status:"clear",   cameras:8,  officers:1},
];

const STATUS_CFG = {
  clear: {color:"#22c55e", label:"All Clear",    bg:"rgba(34,197,94,0.1)"},
  alert: {color:"#ef4444", label:"ALERT",         bg:"rgba(239,68,68,0.15)"},
  watch: {color:"#f59e0b", label:"Watch",         bg:"rgba(245,158,11,0.1)"},
};

const INCIDENTS_LIVE = [
  {id:1, zone:"T1 — Check-in",   type:"Suspicious individual",  time:"10:24",priority:"HIGH",status:"Responding",loc:"Counter 12"},
  {id:2, zone:"T3 — Security",   type:"Unattended baggage",      time:"10:18",priority:"MED", status:"Cleared",   loc:"Lane 4"},
  {id:3, zone:"P3 — Level 2",    type:"Minor altercation",       time:"10:05",priority:"LOW", status:"Resolved",  loc:"Near exit"},
];

export function SecurityOpsPage() {

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Security Operations</h1>
          <p className="text-slate-400 text-sm">Real-time zone monitoring — DEL Airport</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30">
          <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse"/>
          <span className="text-sm text-red-400 font-semibold">1 ACTIVE ALERT</span>
        </div>
      </div>

      {/* Zone grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {ZONES.map(zone=>{
          const cfg = STATUS_CFG[zone.status as keyof typeof STATUS_CFG];
          return (
            <div key={zone.id} className="rounded-2xl p-5 border transition-all"
              style={{background:cfg.bg,borderColor:cfg.color+"40"}}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-semibold text-white">{zone.name}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{zone.id} • {zone.cameras} cameras • {zone.officers} officers</div>
                </div>
                <span className="text-xs px-3 py-1 rounded-full font-bold"
                  style={{background:cfg.color+"25",color:cfg.color,border:`1px solid ${cfg.color}50`}}>
                  {cfg.label}
                </span>
              </div>
              <div className="flex gap-3">
                <button className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border transition-colors"
                  style={{borderColor:cfg.color+"40",color:cfg.color}}
                  onMouseEnter={e=>(e.currentTarget.style.background=cfg.color+"15")}
                  onMouseLeave={e=>(e.currentTarget.style.background="")}>
                  <Eye className="w-3.5 h-3.5"/>View Cameras
                </button>
                {zone.status!=="clear" && (
                  <button className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors">
                    <Radio className="w-3.5 h-3.5"/>Dispatch Officer
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Live incident table */}
      <div className="bg-navy-800 rounded-2xl border border-navy-600 overflow-hidden">
        <div className="p-5 border-b border-navy-600 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-400"/>
          <h2 className="font-semibold text-white">Live Incidents</h2>
          <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse ml-1"/>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-500 text-xs uppercase">
              {["Zone","Incident","Location","Time","Priority","Status","Action"].map(h=>(
                <th key={h} className="px-5 py-3 text-left border-b border-navy-700">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {INCIDENTS_LIVE.map(inc=>(
              <tr key={inc.id} className={`border-b border-navy-700/50 ${inc.priority==="HIGH"?"bg-red-500/5":""}`}>
                <td className="px-5 py-3.5 text-slate-300">{inc.zone}</td>
                <td className="px-5 py-3.5 font-medium text-white">{inc.type}</td>
                <td className="px-5 py-3.5 text-slate-400 text-xs">{inc.loc}</td>
                <td className="px-5 py-3.5 font-mono text-xs text-slate-400">{inc.time}</td>
                <td className="px-5 py-3.5">
                  <span className={`text-xs px-2.5 py-1 rounded-full border font-bold ${
                    inc.priority==="HIGH"?"bg-red-500/15 text-red-400 border-red-500/20":
                    inc.priority==="MED"?"bg-yellow-500/15 text-yellow-400 border-yellow-500/20":
                    "bg-slate-500/15 text-slate-400 border-slate-500/20"}`}>
                    {inc.priority}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`text-xs font-medium ${inc.status==="Cleared"||inc.status==="Resolved"?"text-green-400":"text-red-400 animate-pulse"}`}>
                    ● {inc.status}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <button className="text-xs bg-sky-500/15 text-sky-400 border border-sky-500/20 px-3 py-1.5 rounded-lg hover:bg-sky-500/25 transition-colors">
                    Respond
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Emergency contacts */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          {role:"Control Room",  num:"2567-0000",icon:"🎛"},
          {role:"CISF HQ",       num:"2567-0003",icon:"🛡"},
          {role:"Medical",       num:"2567-0001",icon:"🚑"},
          {role:"Fire Brigade",  num:"2567-0002",icon:"🚒"},
        ].map(({role,num,icon})=>(
          <a key={role} href={`tel:+9111${num}`}
            className="flex items-center gap-3 p-4 rounded-xl border border-navy-600 bg-navy-800 hover:border-sky-500/40 transition-all">
            <span className="text-2xl">{icon}</span>
            <div>
              <div className="text-sm font-semibold text-white">{role}</div>
              <div className="text-xs font-mono text-sky-300">+91-11-{num}</div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
