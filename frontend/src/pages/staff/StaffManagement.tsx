import { useState } from "react";
import { Users, Search, Shield, CheckCircle,
         Clock, Star, Phone, Mail } from "lucide-react";

const STAFF = [
  {id:"S001",name:"Rajesh Kumar",   role:"Ground Operations",dept:"Operations",shift:"Morning",status:"On Duty",  cert:["AVSEC","DGR"],rating:4.8,phone:"+91-98765-43210",email:"rajesh@del.in"},
  {id:"S002",name:"Priya Sharma",   role:"Check-in Agent",   dept:"Passenger", shift:"Morning",status:"On Duty",  cert:["AVSEC"],      rating:4.6,phone:"+91-98765-43211",email:"priya@del.in"},
  {id:"S003",name:"Amit Singh",     role:"Security Officer",  dept:"Security",  shift:"Evening",status:"Off Duty", cert:["AVSEC","BCAS"],rating:4.9,phone:"+91-98765-43212",email:"amit@del.in"},
  {id:"S004",name:"Neha Gupta",     role:"ATC Coordinator",  dept:"ATC",       shift:"Night",  status:"On Duty",  cert:["ATC","AVSEC"], rating:4.7,phone:"+91-98765-43213",email:"neha@del.in"},
  {id:"S005",name:"Vikram Nair",    role:"Baggage Handler",  dept:"Operations",shift:"Morning",status:"Break",    cert:["DGR"],         rating:4.4,phone:"+91-98765-43214",email:"vikram@del.in"},
  {id:"S006",name:"Ananya Reddy",   role:"Gate Manager",     dept:"Passenger", shift:"Evening",status:"On Duty",  cert:["AVSEC","DGR"], rating:4.9,phone:"+91-98765-43215",email:"ananya@del.in"},
  {id:"S007",name:"Rohan Mehta",    role:"IT Support",        dept:"IT",        shift:"Morning",status:"On Duty",  cert:["ITIL"],        rating:4.5,phone:"+91-98765-43216",email:"rohan@del.in"},
  {id:"S008",name:"Sunita Patel",   role:"Finance Officer",  dept:"Finance",   shift:"Morning",status:"Off Duty", cert:["CPA"],         rating:4.6,phone:"+91-98765-43217",email:"sunita@del.in"},
];

const DEPT_COLOR: Record<string,string> = {
  Operations:"sky", Passenger:"teal", Security:"red",
  ATC:"purple", IT:"blue", Finance:"green",
};

const STATUS_STYLE: Record<string,string> = {
  "On Duty": "bg-green-500/15 text-green-400 border-green-500/20",
  "Off Duty":"bg-slate-500/15 text-slate-400 border-slate-500/20",
  "Break":   "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
};

export function StaffManagement() {
  const [search, setSearch]   = useState("");
  const [dept,   setDept]     = useState("All");
  const [selected, setSelected] = useState<typeof STAFF[0]|null>(null);

  const depts = ["All",...Array.from(new Set(STAFF.map(s=>s.dept)))];
  const filtered = STAFF.filter(s=>
    (dept==="All"||s.dept===dept) &&
    (!search || s.name.toLowerCase().includes(search.toLowerCase()) ||
     s.role.toLowerCase().includes(search.toLowerCase()))
  );

  const onDuty  = STAFF.filter(s=>s.status==="On Duty").length;
  const offDuty = STAFF.filter(s=>s.status==="Off Duty").length;
  const onBreak = STAFF.filter(s=>s.status==="Break").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Staff Management</h1>
          <p className="text-slate-400 text-sm mt-0.5">Airport personnel & certification tracking</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          {label:"Total Staff",  value:STAFF.length, color:"sky",    icon:<Users className="w-5 h-5"/>},
          {label:"On Duty",      value:onDuty,        color:"green",  icon:<CheckCircle className="w-5 h-5"/>},
          {label:"Off Duty",     value:offDuty,       color:"slate",  icon:<Clock className="w-5 h-5"/>},
          {label:"On Break",     value:onBreak,       color:"yellow", icon:<Clock className="w-5 h-5"/>},
        ].map(({label,value,color,icon})=>(
          <div key={label} className="bg-navy-800 rounded-2xl p-5 border border-navy-600">
            <div className={`text-${color}-400 mb-3`}>{icon}</div>
            <div className="text-2xl font-bold font-mono text-white mb-0.5">{value}</div>
            <div className="text-sm text-slate-400">{label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-navy-800 border border-navy-600 rounded-xl px-3.5 py-2.5 flex-1 max-w-xs">
          <Search className="w-4 h-4 text-slate-500"/>
          <input className="bg-transparent text-sm text-white placeholder-slate-500 outline-none w-full"
            placeholder="Search staff..." value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {depts.map(d=>(
            <button key={d} onClick={()=>setDept(d)}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition-all ${
                dept===d
                  ?"bg-sky-500 text-white border-sky-500"
                  :"bg-navy-800 text-slate-400 border-navy-600 hover:text-white"
              }`}>{d}</button>
          ))}
        </div>
      </div>

      <div className={`grid gap-5 ${selected?"xl:grid-cols-3":"xl:grid-cols-1"}`}>
        {/* Staff table */}
        <div className={`bg-navy-800 rounded-2xl border border-navy-600 overflow-hidden ${selected?"xl:col-span-2":""}`}>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-500 text-xs uppercase border-b border-navy-700">
                {["Staff","Role","Dept","Shift","Certifications","Rating","Status"].map(h=>(
                  <th key={h} className="px-5 py-3 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(staff=>(
                <tr key={staff.id} onClick={()=>setSelected(selected?.id===staff.id?null:staff)}
                  className={`border-b border-navy-700/50 cursor-pointer transition-all ${
                    selected?.id===staff.id?"bg-sky-500/10":"hover:bg-navy-700/40"
                  }`}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full bg-${DEPT_COLOR[staff.dept]||"sky"}-500/20 flex items-center justify-center text-xs font-bold text-${DEPT_COLOR[staff.dept]||"sky"}-400`}>
                        {staff.name.split(" ").map(n=>n[0]).join("")}
                      </div>
                      <div>
                        <div className="font-medium text-white text-sm">{staff.name}</div>
                        <div className="text-xs text-slate-500 font-mono">{staff.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-300">{staff.role}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full bg-${DEPT_COLOR[staff.dept]||"sky"}-500/15 text-${DEPT_COLOR[staff.dept]||"sky"}-400`}>
                      {staff.dept}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-400 text-xs">{staff.shift}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex gap-1 flex-wrap">
                      {staff.cert.map(c=>(
                        <span key={c} className="text-xs bg-navy-700 text-slate-300 px-1.5 py-0.5 rounded font-mono">{c}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400"/>
                      <span className="text-sm text-white font-medium">{staff.rating}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${STATUS_STYLE[staff.status]}`}>
                      {staff.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="bg-navy-800 rounded-2xl border border-sky-500/30 p-5 space-y-4 h-fit">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-white">Staff Profile</h2>
              <button onClick={()=>setSelected(null)} className="text-slate-500 hover:text-white text-xl">×</button>
            </div>
            <div className="text-center py-4 bg-navy-700/50 rounded-xl">
              <div className={`w-16 h-16 rounded-full bg-${DEPT_COLOR[selected.dept]||"sky"}-500/20 flex items-center justify-center text-2xl font-bold text-${DEPT_COLOR[selected.dept]||"sky"}-400 mx-auto mb-3`}>
                {selected.name.split(" ").map(n=>n[0]).join("")}
              </div>
              <div className="text-lg font-bold text-white">{selected.name}</div>
              <div className="text-sm text-slate-400">{selected.role}</div>
              <div className="flex items-center justify-center gap-1 mt-1">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400"/>
                <span className="text-yellow-400 font-bold">{selected.rating}</span>
              </div>
            </div>
            {[
              {label:"Employee ID", value:selected.id},
              {label:"Department",  value:selected.dept},
              {label:"Shift",       value:selected.shift},
              {label:"Status",      value:selected.status},
            ].map(({label,value})=>(
              <div key={label} className="flex justify-between p-3 bg-navy-700/40 rounded-xl">
                <span className="text-sm text-slate-400">{label}</span>
                <span className="text-sm font-medium text-white">{value}</span>
              </div>
            ))}
            <div className="p-3 bg-navy-700/40 rounded-xl">
              <div className="text-sm text-slate-400 mb-2">Certifications</div>
              <div className="flex flex-wrap gap-2">
                {selected.cert.map(c=>(
                  <span key={c} className="flex items-center gap-1 text-xs bg-green-500/15 text-green-400 border border-green-500/20 px-2.5 py-1 rounded-full">
                    <Shield className="w-3 h-3"/>{c}
                  </span>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <a href={`mailto:${selected.email}`}
                className="flex items-center gap-2 p-3 bg-navy-700/40 rounded-xl text-sm text-slate-300 hover:text-white transition-colors">
                <Mail className="w-4 h-4 text-sky-400"/>{selected.email}
              </a>
              <div className="flex items-center gap-2 p-3 bg-navy-700/40 rounded-xl text-sm text-slate-300">
                <Phone className="w-4 h-4 text-teal-400"/>{selected.phone}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
