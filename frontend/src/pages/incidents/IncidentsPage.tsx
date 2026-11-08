import { useState } from "react";
import { AlertTriangle, Clock, CheckCircle,
         FileText, Plus, Search } from "lucide-react";

const INCIDENTS = [
  {id:"INC-2024-001",type:"Security",      severity:"HIGH",  title:"Unauthorized access attempt at Gate B3",
   status:"Resolved",    reported:"10:24 AM",resolved:"10:45 AM",officer:"Amit Singh",   action:"CCTV reviewed, person escorted"},
  {id:"INC-2024-002",type:"Safety",        severity:"MED",   title:"Baggage conveyor belt malfunction",
   status:"In Progress", reported:"09:15 AM",resolved:null,         officer:"Vikram Nair",  action:"Maintenance team dispatched"},
  {id:"INC-2024-003",type:"Medical",       severity:"HIGH",  title:"Passenger medical emergency at Terminal 2",
   status:"Resolved",    reported:"08:50 AM",resolved:"09:10 AM",officer:"Priya Sharma",  action:"Medical team responded, passenger stable"},
  {id:"INC-2024-004",type:"Fire Safety",   severity:"CRIT",  title:"Smoke detector triggered at cargo area",
   status:"Resolved",    reported:"08:12 AM",resolved:"08:30 AM",officer:"Rajesh Kumar",  action:"False alarm — equipment malfunction"},
  {id:"INC-2024-005",type:"IT",            severity:"LOW",   title:"Check-in system slowdown at T1",
   status:"Resolved",    reported:"07:45 AM",resolved:"08:00 AM",officer:"Rohan Mehta",   action:"Server restarted, system restored"},
  {id:"INC-2024-006",type:"Security",      severity:"MED",   title:"Suspicious unattended baggage at T3",
   status:"In Progress", reported:"07:20 AM",resolved:null,         officer:"Amit Singh",   action:"Security sweep in progress"},
];

const SEV_STYLE: Record<string,string> = {
  CRIT:"bg-red-600/20 text-red-300 border-red-600/30",
  HIGH:"bg-red-500/15 text-red-400 border-red-500/20",
  MED: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  LOW: "bg-sky-500/15 text-sky-400 border-sky-500/20",
};

const STATUS_STYLE: Record<string,string> = {
  "Resolved":    "bg-green-500/15 text-green-400 border-green-500/20",
  "In Progress": "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  "Open":        "bg-red-500/15 text-red-400 border-red-500/20",
};


export function IncidentsPage() {
  const [search, setSearch]   = useState("");
  const [filter, setFilter]   = useState("All");
  const [selected, setSelected] = useState<typeof INCIDENTS[0]|null>(null);
  const [showNew, setShowNew] = useState(false);

  const filters = ["All","Open","In Progress","Resolved"];
  const filtered = INCIDENTS.filter(i=>
    (filter==="All"||i.status===filter) &&
    (!search || i.title.toLowerCase().includes(search.toLowerCase()) ||
     i.type.toLowerCase().includes(search.toLowerCase()))
  );

  const counts = {
    total: INCIDENTS.length,
    crit:  INCIDENTS.filter(i=>i.severity==="CRIT").length,
    open:  INCIDENTS.filter(i=>i.status==="In Progress").length,
    resolved: INCIDENTS.filter(i=>i.status==="Resolved").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Incidents & Emergency</h1>
          <p className="text-slate-400 text-sm mt-0.5">Airport incident tracking & response</p>
        </div>
        <button onClick={()=>setShowNew(true)}
          className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors">
          <Plus className="w-4 h-4"/> Report Incident
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          {label:"Total Today",    value:counts.total,    icon:<FileText className="w-5 h-5"/>,     color:"sky"},
          {label:"Critical",       value:counts.crit,     icon:<AlertTriangle className="w-5 h-5"/>,color:"red"},
          {label:"In Progress",    value:counts.open,     icon:<Clock className="w-5 h-5"/>,        color:"yellow"},
          {label:"Resolved",       value:counts.resolved, icon:<CheckCircle className="w-5 h-5"/>,  color:"green"},
        ].map(({label,value,icon,color})=>(
          <div key={label} className="bg-navy-800 rounded-2xl p-5 border border-navy-600">
            <div className={`text-${color}-400 mb-3`}>{icon}</div>
            <div className="text-2xl font-bold font-mono text-white mb-0.5">{value}</div>
            <div className="text-sm text-slate-400">{label}</div>
          </div>
        ))}
      </div>

      {/* New incident form */}
      {showNew && (
        <div className="bg-navy-800 rounded-2xl p-6 border border-red-500/30 space-y-4">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400"/> Report New Incident
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              {label:"Incident Type",  placeholder:"Security / Safety / Medical..."},
              {label:"Location",       placeholder:"Terminal 1 / Gate B3 / Runway..."},
              {label:"Severity",       placeholder:"LOW / MED / HIGH / CRIT"},
              {label:"Reporting Officer", placeholder:"Your name"},
            ].map(({label,placeholder})=>(
              <div key={label}>
                <label className="text-xs text-slate-400 mb-1.5 block">{label}</label>
                <input placeholder={placeholder}
                  className="w-full bg-navy-700 border border-navy-600 focus:border-red-500 rounded-xl px-3 py-2.5 text-sm text-white outline-none"/>
              </div>
            ))}
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Description</label>
            <textarea rows={3} placeholder="Describe the incident..."
              className="w-full bg-navy-700 border border-navy-600 focus:border-red-500 rounded-xl px-3 py-2.5 text-sm text-white outline-none resize-none"/>
          </div>
          <div className="flex gap-3">
            <button onClick={()=>setShowNew(false)}
              className="bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium">
              Submit Report
            </button>
            <button onClick={()=>setShowNew(false)}
              className="bg-navy-700 text-slate-400 px-5 py-2.5 rounded-xl text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Filters + Search */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-navy-800 border border-navy-600 rounded-xl px-3.5 py-2.5 flex-1 max-w-xs">
          <Search className="w-4 h-4 text-slate-500"/>
          <input className="bg-transparent text-sm text-white placeholder-slate-500 outline-none w-full"
            placeholder="Search incidents..." value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <div className="flex gap-1.5">
          {filters.map(f=>(
            <button key={f} onClick={()=>setFilter(f)}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition-all ${
                filter===f?"bg-sky-500 text-white border-sky-500":
                "bg-navy-800 text-slate-400 border-navy-600 hover:text-white"}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className={`grid gap-5 ${selected?"xl:grid-cols-3":"xl:grid-cols-1"}`}>
        {/* Incidents list */}
        <div className={`space-y-3 ${selected?"xl:col-span-2":""}`}>
          {filtered.map(inc=>(
            <div key={inc.id} onClick={()=>setSelected(selected?.id===inc.id?null:inc)}
              className={`bg-navy-800 rounded-2xl p-5 border cursor-pointer transition-all ${
                selected?.id===inc.id?"border-sky-500/40 bg-sky-500/5":"border-navy-600 hover:border-navy-500"
              }`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="font-mono text-xs text-slate-500">{inc.id}</span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${SEV_STYLE[inc.severity]}`}>
                      {inc.severity}
                    </span>
                    <span className="text-xs bg-navy-700 text-slate-400 px-2 py-0.5 rounded-full">{inc.type}</span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${STATUS_STYLE[inc.status]}`}>
                      {inc.status}
                    </span>
                  </div>
                  <p className="font-medium text-white mb-1">{inc.title}</p>
                  <p className="text-xs text-slate-400">Officer: {inc.officer} • {inc.reported}</p>
                </div>
                {inc.status==="Resolved"
                  ?<CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0"/>
                  :<Clock className="w-5 h-5 text-yellow-400 flex-shrink-0 animate-pulse"/>
                }
              </div>
            </div>
          ))}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="bg-navy-800 rounded-2xl border border-sky-500/30 p-5 space-y-4 h-fit">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-white">Incident Detail</h2>
              <button onClick={()=>setSelected(null)} className="text-slate-500 hover:text-white text-xl">×</button>
            </div>
            <div className={`p-4 rounded-xl border ${SEV_STYLE[selected.severity]}`}>
              <div className="font-mono text-xs mb-1 opacity-70">{selected.id}</div>
              <div className="font-semibold">{selected.title}</div>
            </div>
            {[
              {label:"Type",      value:selected.type},
              {label:"Severity",  value:selected.severity},
              {label:"Status",    value:selected.status},
              {label:"Officer",   value:selected.officer},
              {label:"Reported",  value:selected.reported},
              {label:"Resolved",  value:selected.resolved||"Pending"},
            ].map(({label,value})=>(
              <div key={label} className="flex justify-between p-3 bg-navy-700/40 rounded-xl">
                <span className="text-sm text-slate-400">{label}</span>
                <span className="text-sm font-medium text-white">{value}</span>
              </div>
            ))}
            <div className="p-3 bg-navy-700/40 rounded-xl">
              <div className="text-sm text-slate-400 mb-1">Action Taken</div>
              <div className="text-sm text-slate-200">{selected.action}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
