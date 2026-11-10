import { useState } from "react";
import { FileText, CheckCircle, Clock,
         AlertTriangle, Plus, Search } from "lucide-react";

const CONTRACTS = [
  {id:"CTR-001",party:"Air India",        type:"Airline Agreement",    value:"₹2.4Cr/yr", start:"Jan 2024",end:"Dec 2024",status:"Active",   sla:"98% uptime",compliance:98},
  {id:"CTR-002",party:"IndiGo Airlines",  type:"Airline Agreement",    value:"₹1.8Cr/yr", start:"Jan 2024",end:"Dec 2024",status:"Active",   sla:"98% uptime",compliance:96},
  {id:"CTR-003",party:"Celebi Ground",    type:"Ground Handling",      value:"₹80L/yr",   start:"Apr 2024",end:"Mar 2025",status:"Active",   sla:"99% on-time",compliance:99},
  {id:"CTR-004",party:"Bird Group",       type:"Ground Handling",      value:"₹65L/yr",   start:"Jan 2024",end:"Dec 2024",status:"Active",   sla:"99% on-time",compliance:94},
  {id:"CTR-005",party:"Duty Free World",  type:"Retail Concession",    value:"₹1.2Cr/yr", start:"Jan 2023",end:"Dec 2025",status:"Active",   sla:"90% satisfaction",compliance:92},
  {id:"CTR-006",party:"DIAL Security",    type:"Security Services",    value:"₹3.5Cr/yr", start:"Apr 2024",end:"Mar 2025",status:"Active",   sla:"Zero incidents",compliance:97},
  {id:"CTR-007",party:"TCS IT Services",  type:"IT Infrastructure",    value:"₹45L/yr",   start:"Jan 2024",end:"Dec 2024",status:"Expiring", sla:"99.9% uptime",compliance:100},
  {id:"CTR-008",party:"Vistara Airlines", type:"Airline Agreement",    value:"₹1.1Cr/yr", start:"Jun 2024",end:"Dec 2024",status:"Review",   sla:"98% uptime",compliance:88},
];

const STATUS_STYLE: Record<string,string> = {
  Active:  "bg-green-500/15 text-green-400 border-green-500/20",
  Expiring:"bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  Review:  "bg-orange-500/15 text-orange-400 border-orange-500/20",
  Expired: "bg-red-500/15 text-red-400 border-red-500/20",
};

export function ContractsPage() {
  const [search,  setSearch]  = useState("");
  const [selected,setSelected] = useState<typeof CONTRACTS[0]|null>(null);
  const [showNew, setShowNew] = useState(false);

  const filtered = CONTRACTS.filter(c=>
    !search||c.party.toLowerCase().includes(search.toLowerCase())||
    c.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Contracts & SLA</h1>
          <p className="text-slate-400 text-sm mt-0.5">Vendor contracts and SLA compliance tracking</p>
        </div>
        <button onClick={()=>setShowNew(true)}
          className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors">
          <Plus className="w-4 h-4"/>New Contract
        </button>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          {label:"Total Contracts", value:CONTRACTS.length,                                   icon:<FileText className="w-5 h-5"/>,     color:"sky"},
          {label:"Active",          value:CONTRACTS.filter(c=>c.status==="Active").length,    icon:<CheckCircle className="w-5 h-5"/>,  color:"green"},
          {label:"Expiring Soon",   value:CONTRACTS.filter(c=>c.status==="Expiring").length, icon:<Clock className="w-5 h-5"/>,        color:"yellow"},
          {label:"Under Review",    value:CONTRACTS.filter(c=>c.status==="Review").length,   icon:<AlertTriangle className="w-5 h-5"/>,color:"orange"},
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
          <h3 className="font-semibold text-white">New Contract</h3>
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
            {["Party Name","Contract Type","Value","Start Date","End Date","SLA Target"].map(label=>(
              <div key={label}>
                <label className="text-xs text-slate-400 mb-1.5 block">{label}</label>
                <input placeholder={label} className="w-full bg-navy-700 border border-navy-600 focus:border-sky-500 rounded-xl px-3 py-2.5 text-sm text-white outline-none"/>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={()=>setShowNew(false)} className="bg-sky-500 hover:bg-sky-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium">Create</button>
            <button onClick={()=>setShowNew(false)} className="bg-navy-700 text-slate-400 px-5 py-2.5 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-navy-800 border border-navy-600 rounded-xl px-3.5 py-2.5 flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-500"/>
          <input className="bg-transparent text-sm text-white placeholder-slate-500 outline-none w-full"
            placeholder="Search contracts..." value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
      </div>

      <div className={`grid gap-5 ${selected?"xl:grid-cols-3":"xl:grid-cols-1"}`}>
        <div className={`bg-navy-800 rounded-2xl border border-navy-600 overflow-hidden ${selected?"xl:col-span-2":""}`}>
          <div className="table-scroll"><table className="w-full text-sm">
            <thead>
              <tr className="text-slate-500 text-xs uppercase">
                {["ID","Party","Type","Value","Period","SLA","Compliance","Status"].map(h=>(
                  <th key={h} className="px-4 py-3 text-left border-b border-navy-700">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(c=>(
                <tr key={c.id} onClick={()=>setSelected(selected?.id===c.id?null:c)}
                  className={`border-b border-navy-700/50 cursor-pointer transition-all ${selected?.id===c.id?"bg-sky-500/10":"hover:bg-navy-700/30"}`}>
                  <td className="px-4 py-3.5 font-mono text-xs text-sky-300">{c.id}</td>
                  <td className="px-4 py-3.5 font-medium text-white">{c.party}</td>
                  <td className="px-4 py-3.5 text-slate-400 text-xs">{c.type}</td>
                  <td className="px-4 py-3.5 font-mono font-bold text-white">{c.value}</td>
                  <td className="px-4 py-3.5 text-slate-400 text-xs">{c.start}–{c.end}</td>
                  <td className="px-4 py-3.5 text-slate-300 text-xs">{c.sla}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-navy-700 rounded-full">
                        <div className={`h-full rounded-full ${c.compliance>=97?"bg-green-500":c.compliance>=90?"bg-yellow-500":"bg-red-500"}`}
                          style={{width:`${c.compliance}%`}}/>
                      </div>
                      <span className="text-xs text-white font-mono">{c.compliance}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${STATUS_STYLE[c.status]}`}>{c.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </div>
        {selected && (
          <div className="bg-navy-800 rounded-2xl border border-sky-500/30 p-5 space-y-4 h-fit">
            <div className="flex justify-between">
              <h2 className="font-semibold text-white">Contract Detail</h2>
              <button onClick={()=>setSelected(null)} className="text-slate-500 hover:text-white text-xl">×</button>
            </div>
            <div className="p-4 bg-navy-700/50 rounded-xl">
              <div className="font-mono text-xs text-sky-300 mb-1">{selected.id}</div>
              <div className="font-bold text-white text-lg">{selected.party}</div>
              <div className="text-sm text-slate-400">{selected.type}</div>
            </div>
            {[
              {label:"Value",      value:selected.value},
              {label:"Start",      value:selected.start},
              {label:"End",        value:selected.end},
              {label:"SLA Target", value:selected.sla},
              {label:"Compliance", value:`${selected.compliance}%`},
              {label:"Status",     value:selected.status},
            ].map(({label,value})=>(
              <div key={label} className="flex justify-between p-3 bg-navy-700/40 rounded-xl">
                <span className="text-sm text-slate-400">{label}</span>
                <span className="text-sm font-medium text-white">{value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
