import { useState } from "react";
import { Wrench, AlertTriangle, CheckCircle,
         Clock, Plus, Search } from "lucide-react";

const TASKS = [
  {id:"MRO-001",aircraft:"VT-AIL",type:"A-Check",    desc:"Routine A-check inspection",         due:"2024-04-28",status:"Scheduled",  priority:"Normal",  tech:"Rajesh K",   duration:"8h"},
  {id:"MRO-002",aircraft:"VT-6EA",type:"Component",  desc:"Left engine fan blade replacement",  due:"2024-04-26",status:"In Progress",priority:"High",    tech:"Amit S",     duration:"4h"},
  {id:"MRO-003",aircraft:"VT-UKA",type:"AOG",        desc:"Hydraulic system failure repair",    due:"2024-04-25",status:"Critical",   priority:"Critical",tech:"Team A",     duration:"12h"},
  {id:"MRO-004",aircraft:"VT-SGA",type:"C-Check",    desc:"Major structural inspection",        due:"2024-05-10",status:"Scheduled",  priority:"Normal",  tech:"Vikram N",   duration:"72h"},
  {id:"MRO-005",aircraft:"VT-IXA",type:"Line Maint", desc:"Pre-flight check & tyre rotation",   due:"2024-04-25",status:"Completed",  priority:"Normal",  tech:"Rohan M",    duration:"2h"},
  {id:"MRO-006",aircraft:"VT-AIL",type:"Avionics",   desc:"ILS calibration & software update",  due:"2024-04-27",status:"Scheduled",  priority:"High",    tech:"Neha G",     duration:"6h"},
  {id:"MRO-007",aircraft:"VT-6EB",type:"AOG",        desc:"APU starter motor failure",          due:"2024-04-25",status:"In Progress",priority:"Critical",tech:"Team B",     duration:"8h"},
  {id:"MRO-008",aircraft:"VT-AIL",type:"B-Check",    desc:"Intermediate systems check",         due:"2024-05-20",status:"Scheduled",  priority:"Normal",  tech:"Rajesh K",   duration:"36h"},
];

const aircraft = [
  {reg:"VT-AIL",model:"Boeing 737-800",  airline:"Air India",  nextCheck:"A-Check in 3d",  flightHours:18420,status:"Active"},
  {reg:"VT-6EA",model:"Airbus A320neo",  airline:"IndiGo",     nextCheck:"Comp. repair",   flightHours:12840,status:"AOG"},
  {reg:"VT-UKA",model:"Airbus A320",     airline:"Vistara",    nextCheck:"Hydraulic fix",  flightHours:9620, status:"AOG"},
  {reg:"VT-SGA",model:"Boeing 737-700",  airline:"SpiceJet",   nextCheck:"C-Check May",    flightHours:22180,status:"Active"},
  {reg:"VT-IXA",model:"Airbus A320",     airline:"Air Asia",   nextCheck:"Line maint ✓",   flightHours:8940, status:"Active"},
];

const STATUS_STYLE: Record<string,string> = {
  "Scheduled":  "bg-sky-500/15 text-sky-400 border-sky-500/20",
  "In Progress":"bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  "Critical":   "bg-red-600/20 text-red-300 border-red-600/30",
  "Completed":  "bg-green-500/15 text-green-400 border-green-500/20",
  "Active":     "bg-green-500/15 text-green-400 border-green-500/20",
  "AOG":        "bg-red-500/15 text-red-400 border-red-500/20",
};

const PRIORITY_DOT: Record<string,string> = {
  Critical:"bg-red-500 animate-pulse", High:"bg-orange-400", Normal:"bg-green-400",
};

export function MaintenancePage() {
  const [search, setSearch]   = useState("");
  const [tab,    setTab]      = useState<"tasks"|"aircraft">("tasks");
  const [showNew, setShowNew] = useState(false);

  const filtered = TASKS.filter(t=>
    !search ||
    t.aircraft.toLowerCase().includes(search.toLowerCase()) ||
    t.desc.toLowerCase().includes(search.toLowerCase()) ||
    t.type.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total:      TASKS.length,
    critical:   TASKS.filter(t=>t.priority==="Critical").length,
    inProgress: TASKS.filter(t=>t.status==="In Progress").length,
    completed:  TASKS.filter(t=>t.status==="Completed").length,
    aog:        aircraft.filter(a=>a.status==="AOG").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Maintenance & MRO</h1>
          <p className="text-slate-400 text-sm mt-0.5">Aircraft maintenance & repair operations</p>
        </div>
        <button onClick={()=>setShowNew(true)}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors">
          <Plus className="w-4 h-4"/>New Work Order
        </button>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
        {[
          {label:"Total Tasks",    value:stats.total,      color:"sky",    icon:<Wrench className="w-5 h-5"/>},
          {label:"Critical/AOG",   value:stats.critical,   color:"red",    icon:<AlertTriangle className="w-5 h-5"/>},
          {label:"In Progress",    value:stats.inProgress, color:"yellow", icon:<Clock className="w-5 h-5"/>},
          {label:"Completed",      value:stats.completed,  color:"green",  icon:<CheckCircle className="w-5 h-5"/>},
          {label:"Aircraft AOG",   value:stats.aog,        color:"red",    icon:<AlertTriangle className="w-5 h-5"/>},
        ].map(({label,value,color,icon})=>(
          <div key={label} className="bg-navy-800 rounded-2xl p-5 border border-navy-600">
            <div className={`text-${color}-400 mb-3`}>{icon}</div>
            <div className="text-2xl font-bold font-mono text-white mb-0.5">{value}</div>
            <div className="text-sm text-slate-400">{label}</div>
          </div>
        ))}
      </div>

      {/* New work order form */}
      {showNew && (
        <div className="bg-navy-800 rounded-2xl p-6 border border-orange-500/30 space-y-4">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Wrench className="w-5 h-5 text-orange-400"/>New Work Order
          </h3>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              {label:"Aircraft Reg",      placeholder:"VT-AIL"},
              {label:"Maintenance Type",  placeholder:"A-Check / AOG / Line..."},
              {label:"Assigned Tech",     placeholder:"Technician name"},
              {label:"Priority",          placeholder:"Normal / High / Critical"},
              {label:"Estimated Duration",placeholder:"8h"},
              {label:"Due Date",          placeholder:"2024-04-30"},
            ].map(({label,placeholder})=>(
              <div key={label}>
                <label className="text-xs text-slate-400 mb-1.5 block">{label}</label>
                <input placeholder={placeholder}
                  className="w-full bg-navy-700 border border-navy-600 focus:border-orange-500 rounded-xl px-3 py-2.5 text-sm text-white outline-none"/>
              </div>
            ))}
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Work Description</label>
            <textarea rows={2} placeholder="Describe the maintenance work..."
              className="w-full bg-navy-700 border border-navy-600 focus:border-orange-500 rounded-xl px-3 py-2.5 text-sm text-white outline-none resize-none"/>
          </div>
          <div className="flex gap-3">
            <button onClick={()=>setShowNew(false)}
              className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium">
              Create Work Order
            </button>
            <button onClick={()=>setShowNew(false)}
              className="bg-navy-700 text-slate-400 px-5 py-2.5 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-4">
        <div className="flex gap-1 bg-navy-800 p-1 rounded-xl border border-navy-600">
          {(["tasks","aircraft"] as const).map(t=>(
            <button key={t} onClick={()=>setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                tab===t?"bg-sky-500 text-white":"text-slate-400 hover:text-white"}`}>
              {t==="tasks"?"Work Orders":"Aircraft Status"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 bg-navy-800 border border-navy-600 rounded-xl px-3.5 py-2.5 flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-500"/>
          <input className="bg-transparent text-sm text-white placeholder-slate-500 outline-none w-full"
            placeholder="Search tasks, aircraft..."
            value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
      </div>

      {/* Work orders */}
      {tab==="tasks" && (
        <div className="space-y-3">
          {filtered.map(t=>(
            <div key={t.id} className={`bg-navy-800 rounded-2xl p-5 border transition-all ${
              t.priority==="Critical"
                ?"border-red-500/30 bg-red-500/3"
                :"border-navy-600 hover:border-navy-500"
            }`}>
              <div className="flex items-start gap-4">
                <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${PRIORITY_DOT[t.priority]}`}/>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-mono text-xs text-slate-500">{t.id}</span>
                    <span className="font-mono font-bold text-sky-300 text-sm">{t.aircraft}</span>
                    <span className="text-xs bg-navy-700 text-slate-400 px-2 py-0.5 rounded-full">{t.type}</span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${STATUS_STYLE[t.status]}`}>
                      {t.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-200 mb-2">{t.desc}</p>
                  <div className="flex gap-4 text-xs text-slate-500">
                    <span>👤 {t.tech}</span>
                    <span>⏱ {t.duration}</span>
                    <span>📅 Due: {t.due}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Aircraft status */}
      {tab==="aircraft" && (
        <div className="bg-navy-800 rounded-2xl border border-navy-600 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-500 text-xs uppercase">
                {["Registration","Model","Airline","Flight Hours","Next Check","Status"].map(h=>(
                  <th key={h} className="px-5 py-3 text-left border-b border-navy-700">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {aircraft.map(a=>(
                <tr key={a.reg} className="border-b border-navy-700/50 hover:bg-navy-700/30">
                  <td className="px-5 py-3.5 font-mono font-bold text-sky-300">{a.reg}</td>
                  <td className="px-5 py-3.5 text-slate-300">{a.model}</td>
                  <td className="px-5 py-3.5 text-slate-400">{a.airline}</td>
                  <td className="px-5 py-3.5 font-mono text-slate-300">{a.flightHours.toLocaleString()}h</td>
                  <td className="px-5 py-3.5 text-slate-400 text-xs">{a.nextCheck}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${STATUS_STYLE[a.status]}`}>
                      {a.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
