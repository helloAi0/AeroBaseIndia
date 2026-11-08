import { useState } from "react";
import { DoorOpen, Plane, CheckCircle, Clock,
         XCircle, AlertTriangle, Users, Radio,
         Wrench, Shield, Plus, X } from "lucide-react";

type Gate = {
  id:string; terminal:string; status:string;
  flight:string|null; airline:string|null;
  dest:string|null; dep:string|null;
  capacity:number; load:number; pax:number;
  security:string; notes:string;
};

const INITIAL_GATES: Gate[] = [
  {id:"A1",terminal:"T1",status:"Occupied",  flight:"AI-101",  airline:"Air India",  dest:"BOM",dep:"10:30",capacity:180,load:92,pax:166,security:"Clear",  notes:""},
  {id:"A2",terminal:"T1",status:"Available", flight:null,      airline:null,          dest:null, dep:null,   capacity:220,load:0, pax:0,  security:"Clear",  notes:"Ready for next assignment"},
  {id:"A3",terminal:"T1",status:"Cleaning",  flight:null,      airline:null,          dest:null, dep:null,   capacity:180,load:0, pax:0,  security:"Clear",  notes:"Cleaning after SpiceJet SG-302"},
  {id:"A4",terminal:"T1",status:"Occupied",  flight:"QP-1401", airline:"Akasa Air",   dest:"JAI",dep:"15:30",capacity:160,load:78,pax:125,security:"Clear",  notes:""},
  {id:"B1",terminal:"T2",status:"Occupied",  flight:"6E-2341", airline:"IndiGo",      dest:"BLR",dep:"11:00",capacity:180,load:78,pax:140,security:"Clear",  notes:""},
  {id:"B2",terminal:"T2",status:"Boarding",  flight:"UK-925",  airline:"Vistara",     dest:"HYD",dep:"09:45",capacity:160,load:65,pax:104,security:"Active", notes:"Boarding in progress"},
  {id:"B3",terminal:"T2",status:"Occupied",  flight:"SG-2801", airline:"SpiceJet",    dest:"MAA",dep:"17:00",capacity:200,load:88,pax:176,security:"Clear",  notes:""},
  {id:"B4",terminal:"T2",status:"Maintenance",flight:null,     airline:null,           dest:null, dep:null,   capacity:180,load:0, pax:0,  security:"Closed", notes:"Jetbridge maintenance — 2hr ETA"},
  {id:"B5",terminal:"T2",status:"Available", flight:null,      airline:null,           dest:null, dep:null,   capacity:220,load:0, pax:0,  security:"Clear",  notes:""},
  {id:"C1",terminal:"T3",status:"Available", flight:null,      airline:null,           dest:null, dep:null,   capacity:350,load:0, pax:0,  security:"Clear",  notes:""},
  {id:"C2",terminal:"T3",status:"Delayed",   flight:"IX-611",  airline:"Air Asia",    dest:"COK",dep:"14:00",capacity:180,load:72,pax:130,security:"Clear",  notes:"Delay: Weather at COK — 45 min"},
  {id:"C3",terminal:"T3",status:"Boarding",  flight:"AI-819",  airline:"Air India",   dest:"LHR",dep:"13:45",capacity:380,load:91,pax:346,security:"Active", notes:"International boarding — CISF check"},
  {id:"D1",terminal:"T3",status:"Occupied",  flight:"EK-511",  airline:"Emirates",    dest:"DXB",dep:"16:00",capacity:450,load:95,pax:428,security:"Active", notes:"Full A380 — extra CISF deployed"},
  {id:"D2",terminal:"T3",status:"Available", flight:null,      airline:null,           dest:null, dep:null,   capacity:350,load:0, pax:0,  security:"Clear",  notes:""},
  {id:"E1",terminal:"T3",status:"Occupied",  flight:"AI-2811", airline:"Air India",   dest:"DEL",dep:"07:00",capacity:280,load:82,pax:230,security:"Clear",  notes:""},
  {id:"E2",terminal:"T3",status:"Cleaning",  flight:null,      airline:null,           dest:null, dep:null,   capacity:280,load:0, pax:0,  security:"Closed", notes:"Deep clean — 1hr ETA"},
];

const TERMINALS = {
  T1:{name:"Terminal 1",type:"Domestic",      color:"#0ea5e9"},
  T2:{name:"Terminal 2",type:"Domestic",      color:"#14b8a6"},
  T3:{name:"Terminal 3",type:"International", color:"#8b5cf6"},
};

const STATUS_CFG: Record<string,{color:string;icon:React.ReactNode;pulse?:boolean}> = {
  Occupied:    {color:"#0ea5e9",icon:<Plane className="w-4 h-4"/>},
  Available:   {color:"#22c55e",icon:<CheckCircle className="w-4 h-4"/>},
  Boarding:    {color:"#2dd4bf",icon:<Users className="w-4 h-4"/>,pulse:true},
  Delayed:     {color:"#f59e0b",icon:<Clock className="w-4 h-4"/>},
  Cleaning:    {color:"#64748b",icon:<XCircle className="w-4 h-4"/>},
  Maintenance: {color:"#f97316",icon:<Wrench className="w-4 h-4"/>},
};


function GateCard({gate,selected,onClick}:{gate:Gate;selected:boolean;onClick:()=>void}) {
  const cfg = STATUS_CFG[gate.status]||STATUS_CFG["Available"];
  const isCritical = gate.load>=90 && gate.flight;
  return (
    <div onClick={onClick} className="rounded-2xl p-4 border-2 cursor-pointer select-none"
      style={{
        background: selected ? cfg.color+"22" : cfg.color+"0d",
        borderColor: selected ? cfg.color : cfg.color+"33",
        transform: selected ? "scale(1.02)" : "scale(1)",
        transition: "all 0.18s ease",
        boxShadow: selected ? `0 0 24px ${cfg.color}30` : "none",
      }}>
      {/* Gate ID + icon */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl font-black font-mono text-white">{gate.id}</span>
        <span className={cfg.pulse?"animate-pulse":""} style={{color:cfg.color}}>
          {cfg.icon}
        </span>
      </div>

      {/* Status badge */}
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold mb-2"
        style={{background:cfg.color+"20",color:cfg.color,border:`1px solid ${cfg.color}35`}}>
        {cfg.pulse && <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{background:cfg.color}}/>}
        {gate.status}
      </div>

      {gate.flight ? (
        <div>
          <div className="font-bold font-mono text-sm mb-0.5" style={{color:cfg.color}}>
            {gate.flight}
          </div>
          <div className="text-xs text-slate-400">{gate.airline}</div>
          <div className="text-xs text-slate-500">{gate.dest} · {gate.dep}</div>
          <div className="mt-2.5 space-y-1">
            <div className="h-2 bg-navy-700 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all"
                style={{
                  width:`${gate.load}%`,
                  background: gate.load>=90?"#ef4444": gate.load>=75?"#f59e0b":"#0ea5e9",
                  boxShadow: isCritical?"0 0 6px #ef444460":undefined,
                }}/>
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>{gate.pax} pax</span>
              <span className={isCritical?"text-red-400 font-bold":""}>{gate.load}%</span>
            </div>
          </div>
          {gate.security==="Active" && (
            <div className="flex items-center gap-1 mt-2 text-xs font-semibold text-red-400">
              <Shield className="w-3 h-3"/>CISF Active
            </div>
          )}
        </div>
      ) : (
        <div className="text-xs text-slate-500 leading-relaxed">{gate.notes||`Cap: ${gate.capacity}`}</div>
      )}
    </div>
  );
}

function AddGateModal({onClose, onAdd}:{onClose:()=>void; onAdd:(g:Gate)=>void}) {
  const [form, setForm] = useState({
    id:"", terminal:"T1", status:"Available",
    flight:"", airline:"", dest:"", dep:"",
    capacity:"180", notes:"",
  });
  const [error, setError] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if(!form.id.trim()){ setError("Gate ID is required"); return; }
    onAdd({
      id: form.id.toUpperCase(),
      terminal: form.terminal,
      status: form.status,
      flight: form.flight||null,
      airline: form.airline||null,
      dest: form.dest||null,
      dep: form.dep||null,
      capacity: parseInt(form.capacity)||180,
      load: 0, pax: 0,
      security: "Clear",
      notes: form.notes,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{background:"rgba(0,0,0,0.7)",backdropFilter:"blur(8px)"}}>
      <div className="w-full max-w-lg rounded-3xl border overflow-hidden"
        style={{background:"#0f1629",borderColor:"rgba(14,165,233,0.3)"}}>
        <div className="flex items-center justify-between p-6 border-b"
          style={{borderColor:"rgba(255,255,255,0.06)"}}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{background:"rgba(14,165,233,0.15)"}}>
              <Plus className="w-5 h-5 text-sky-400"/>
            </div>
            <div>
              <h2 className="font-bold text-white">Add New Gate</h2>
              <p className="text-xs text-slate-400">Create a gate for this airport</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-colors">
            <X className="w-4 h-4"/>
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Gate ID *</label>
              <input value={form.id} onChange={e=>setForm({...form,id:e.target.value})}
                placeholder="e.g. A5, F1"
                className="w-full rounded-xl px-3.5 py-3 text-sm text-white font-mono uppercase outline-none border transition-colors"
                style={{background:"rgba(255,255,255,0.05)",borderColor:"rgba(255,255,255,0.1)"}}
                onFocus={e=>(e.target.style.borderColor="#0ea5e9")}
                onBlur={e=>(e.target.style.borderColor="rgba(255,255,255,0.1)")}/>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Terminal</label>
              <select value={form.terminal} onChange={e=>setForm({...form,terminal:e.target.value})}
                className="w-full rounded-xl px-3.5 py-3 text-sm text-white outline-none border"
                style={{background:"#0f1629",borderColor:"rgba(255,255,255,0.1)"}}>
                <option value="T1">T1 — Terminal 1 (Domestic)</option>
                <option value="T2">T2 — Terminal 2 (Domestic)</option>
                <option value="T3">T3 — Terminal 3 (International)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Status</label>
              <select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}
                className="w-full rounded-xl px-3.5 py-3 text-sm text-white outline-none border"
                style={{background:"#0f1629",borderColor:"rgba(255,255,255,0.1)"}}>
                {["Available","Occupied","Boarding","Delayed","Cleaning","Maintenance"].map(s=>(
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Capacity (pax)</label>
              <input type="number" value={form.capacity} onChange={e=>setForm({...form,capacity:e.target.value})}
                className="w-full rounded-xl px-3.5 py-3 text-sm text-white outline-none border"
                style={{background:"rgba(255,255,255,0.05)",borderColor:"rgba(255,255,255,0.1)"}}/>
            </div>
          </div>

          {form.status!=="Available" && form.status!=="Cleaning" && form.status!=="Maintenance" && (
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl border"
              style={{background:"rgba(14,165,233,0.05)",borderColor:"rgba(14,165,233,0.15)"}}>
              <div className="text-xs font-semibold text-sky-400 col-span-2 mb-1">Flight Details (optional)</div>
              {[{l:"Flight No",k:"flight",ph:"AI-101"},{l:"Airline",k:"airline",ph:"Air India"},
                {l:"Destination",k:"dest",ph:"BOM"},{l:"Dep. Time",k:"dep",ph:"10:30"}
              ].map(({l,k,ph})=>(
                <div key={k}>
                  <label className="text-xs text-slate-400 mb-1 block">{l}</label>
                  <input value={(form as any)[k]} onChange={e=>setForm({...form,[k]:e.target.value})}
                    placeholder={ph}
                    className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none border"
                    style={{background:"rgba(255,255,255,0.05)",borderColor:"rgba(255,255,255,0.08)"}}/>
                </div>
              ))}
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Notes</label>
            <input value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}
              placeholder="Any additional notes..."
              className="w-full rounded-xl px-3.5 py-3 text-sm text-white outline-none border"
              style={{background:"rgba(255,255,255,0.05)",borderColor:"rgba(255,255,255,0.1)"}}/>
          </div>

          {error && (
            <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="submit"
              className="flex-1 py-3 rounded-xl font-bold text-sm text-white transition-all"
              style={{background:"linear-gradient(135deg,#0ea5e9,#14b8a6)"}}>
              ✓ Add Gate
            </button>
            <button type="button" onClick={onClose}
              className="px-6 py-3 rounded-xl text-sm text-slate-400 border border-navy-600 hover:text-white hover:border-navy-500 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function GatesPage() {
  const [gates,      setGates]    = useState<Gate[]>(INITIAL_GATES);
  const [activeT,    setActiveT]  = useState<keyof typeof TERMINALS>("T1");
  const [selected,   setSelected] = useState<Gate|null>(null);
  const [filterStatus,setFilter]  = useState("All");
  const [showAdd,    setShowAdd]  = useState(false);

  const addGate = (g:Gate) => {
    setGates(prev=>[...prev,g]);
    setActiveT(g.terminal as keyof typeof TERMINALS);
    setSelected(g);
  };

  const tColor = TERMINALS[activeT].color;
  const termGates = gates.filter(g=>g.terminal===activeT);
  const filtered = filterStatus==="All" ? termGates : termGates.filter(g=>g.status===filterStatus);

  const stats = {
    total:    gates.length,
    occupied: gates.filter(g=>g.status==="Occupied"||g.status==="Boarding").length,
    available:gates.filter(g=>g.status==="Available").length,
    delayed:  gates.filter(g=>g.status==="Delayed").length,
    cisf:     gates.filter(g=>g.security==="Active").length,
    pax:      gates.reduce((s,g)=>s+g.pax,0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Gate Management</h1>
          <p className="text-slate-400 text-sm mt-0.5">Interactive real-time gate status — Delhi IGI Airport</p>
        </div>
        <button onClick={()=>setShowAdd(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90 active:scale-95"
          style={{background:"linear-gradient(135deg,#0ea5e9,#14b8a6)"}}>
          <Plus className="w-4 h-4"/>Add Gate
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 xl:grid-cols-6 gap-3">
        {[
          {label:"Total Gates", value:stats.total,    color:"#38bdf8"},
          {label:"Occupied",    value:stats.occupied,  color:"#60a5fa"},
          {label:"Available",   value:stats.available, color:"#4ade80"},
          {label:"Delayed",     value:stats.delayed,   color:"#fbbf24"},
          {label:"CISF Active", value:stats.cisf,      color:"#f87171"},
          {label:"Passengers",  value:stats.pax.toLocaleString(),color:"#2dd4bf"},
        ].map(({label,value,color})=>(
          <div key={label} className="rounded-2xl p-4 border text-center"
            style={{background:`${color}0a`,borderColor:`${color}22`}}>
            <div className="text-2xl font-bold font-mono" style={{color}}>{value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Terminal selector */}
      <div className="grid grid-cols-3 gap-3">
        {(Object.entries(TERMINALS) as [keyof typeof TERMINALS,typeof TERMINALS[keyof typeof TERMINALS]][]).map(([key,t])=>{
          const tg = gates.filter(g=>g.terminal===key);
          const boarding = tg.filter(g=>g.status==="Boarding").length;
          const delayed  = tg.filter(g=>g.status==="Delayed").length;
          const active   = key===activeT;
          return (
            <button key={key} onClick={()=>{setActiveT(key);setSelected(null);}}
              className="p-4 rounded-2xl border text-left transition-all hover:scale-[1.01] active:scale-[0.99]"
              style={{
                background: active ? t.color+"15" : "rgba(15,22,41,0.8)",
                borderColor: active ? t.color+"60" : "rgba(255,255,255,0.06)",
                boxShadow: active ? `0 0 20px ${t.color}20` : "none",
              }}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xl font-black" style={{color:active?t.color:"#64748b"}}>{key}</span>
                <div className="flex gap-1">
                  {boarding>0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={{background:"rgba(45,212,191,0.15)",color:"#2dd4bf"}}>
                      {boarding} boarding
                    </span>
                  )}
                  {delayed>0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={{background:"rgba(245,158,11,0.15)",color:"#fbbf24"}}>
                      {delayed} delayed
                    </span>
                  )}
                </div>
              </div>
              <div className="font-semibold text-white text-sm">{t.name}</div>
              <div className="text-xs text-slate-500">{t.type} · {tg.length} gates</div>
            </button>
          );
        })}
      </div>

      {/* Filter strip */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-slate-500 font-medium">Filter:</span>
        {["All","Occupied","Available","Boarding","Delayed","Maintenance","Cleaning"].map(f=>(
          <button key={f} onClick={()=>setFilter(f)}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all"
            style={filterStatus===f
              ?{background:"#0ea5e9",borderColor:"#0ea5e9",color:"white"}
              :{background:"rgba(255,255,255,0.03)",borderColor:"rgba(255,255,255,0.08)",color:"#64748b"}}>
            {f}
          </button>
        ))}
        <span className="text-xs text-slate-600 ml-auto">{filtered.length} gates</span>
      </div>

      {/* Main grid + detail */}
      <div className={`grid gap-6 ${selected?"xl:grid-cols-3":"xl:grid-cols-1"}`}>
        {/* Gate cards */}
        <div className={selected?"xl:col-span-2":""}>
          {/* Terminal label */}
          <div className="flex items-center gap-3 p-4 rounded-2xl mb-4 border"
            style={{background:tColor+"0a",borderColor:tColor+"25"}}>
            <DoorOpen className="w-5 h-5 flex-shrink-0" style={{color:tColor}}/>
            <div>
              <div className="font-semibold text-white">{TERMINALS[activeT].name}</div>
              <div className="text-xs text-slate-400">
                {filtered.filter(g=>g.status==="Occupied"||g.status==="Boarding").length} occupied ·
                {filtered.filter(g=>g.status==="Available").length} available ·
                {filtered.filter(g=>g.security==="Active").length} CISF active
              </div>
            </div>
          </div>

          {filtered.length===0 ? (
            <div className="text-center py-12 text-slate-500 bg-navy-800 rounded-2xl border border-navy-600">
              <DoorOpen className="w-10 h-10 mx-auto mb-2 opacity-30"/>
              <p>No gates match this filter</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
              {filtered.map(gate=>(
                <GateCard key={gate.id} gate={gate}
                  selected={selected?.id===gate.id}
                  onClick={()=>setSelected(selected?.id===gate.id?null:gate)}/>
              ))}
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="rounded-2xl border overflow-hidden"
            style={{
              borderColor:(STATUS_CFG[selected.status]?.color||"#0ea5e9")+"50",
              background:"rgba(15,22,41,0.95)"
            }}>
            {/* Header */}
            <div className="p-5 border-b"
              style={{
                background:(STATUS_CFG[selected.status]?.color||"#0ea5e9")+"12",
                borderColor:"rgba(255,255,255,0.06)"
              }}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-4xl font-black font-mono text-white mb-1">{selected.id}</div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
                    style={{
                      background:(STATUS_CFG[selected.status]?.color||"#0ea5e9")+"22",
                      color:STATUS_CFG[selected.status]?.color||"#0ea5e9",
                      border:`1px solid ${STATUS_CFG[selected.status]?.color||"#0ea5e9"}40`,
                    }}>
                    {STATUS_CFG[selected.status]?.pulse &&
                      <div className="w-1.5 h-1.5 rounded-full animate-pulse"
                        style={{background:STATUS_CFG[selected.status]?.color}}/>
                    }
                    {selected.status}
                  </span>
                </div>
                <button onClick={()=>setSelected(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-colors">
                  <X className="w-4 h-4"/>
                </button>
              </div>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto" style={{maxHeight:"calc(100vh - 300px)"}}>
              {/* Flight info */}
              {selected.flight && (
                <div className="p-4 rounded-xl border"
                  style={{background:"rgba(56,189,248,0.06)",borderColor:"rgba(56,189,248,0.15)"}}>
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-3">Flight Info</div>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="text-2xl font-bold font-mono text-sky-300">{selected.flight}</div>
                      <div className="text-sm text-slate-400">{selected.airline}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">{selected.dest}</div>
                      <div className="text-sm text-slate-400">{selected.dep}</div>
                    </div>
                  </div>
                  {/* Load bar */}
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-400">Passenger Load</span>
                      <span className="font-bold"
                        style={{color:selected.load>=90?"#ef4444":selected.load>=75?"#f59e0b":"#22c55e"}}>
                        {selected.pax}/{selected.capacity} ({selected.load}%)
                      </span>
                    </div>
                    <div className="h-3 bg-navy-700 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all"
                        style={{
                          width:`${selected.load}%`,
                          background:selected.load>=90?"linear-gradient(90deg,#ef4444,#dc2626)":
                                     selected.load>=75?"linear-gradient(90deg,#f59e0b,#d97706)":
                                                       "linear-gradient(90deg,#0ea5e9,#38bdf8)",
                        }}/>
                    </div>
                    {selected.load>=90 && (
                      <div className="flex items-center gap-1.5 text-xs text-red-400 mt-1.5 font-medium">
                        <AlertTriangle className="w-3 h-3"/>Gate near capacity — request additional staff
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  {label:"Terminal",        value:selected.terminal},
                  {label:"Capacity",        value:`${selected.capacity} pax`},
                  {label:"Security",        value:selected.security},
                  {label:"CISF Status",     value:selected.security==="Active"?"Deployed":"Standby"},
                ].map(({label,value})=>(
                  <div key={label} className="p-3 rounded-xl"
                    style={{background:"rgba(255,255,255,0.03)"}}>
                    <div className="text-xs text-slate-500 mb-0.5">{label}</div>
                    <div className={`text-sm font-semibold ${
                      value==="Active"||value==="Deployed"?"text-red-400":
                      value==="Clear"||value==="Standby"?"text-green-400":"text-white"}`}>
                      {value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Notes */}
              {selected.notes && (
                <div className="p-3 rounded-xl text-sm text-slate-300"
                  style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)"}}>
                  📝 {selected.notes}
                </div>
              )}

              {/* Action buttons */}
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-2.5">Quick Actions</div>
                <div className="space-y-2">
                  {[
                    {label:"Announce Gate Info",    icon:<Radio className="w-4 h-4"/>,          color:"#0ea5e9"},
                    {label:"Request CISF Security", icon:<Shield className="w-4 h-4"/>,          color:"#ef4444"},
                    {label:"Request Cleaning Crew", icon:<Wrench className="w-4 h-4"/>,          color:"#64748b"},
                    {label:"Dispatch Ground Staff", icon:<Users className="w-4 h-4"/>,           color:"#14b8a6"},
                    {label:"Report Delay",          icon:<AlertTriangle className="w-4 h-4"/>,   color:"#f59e0b"},
                  ].map(({label,icon,color})=>(
                    <button key={label}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border text-sm font-medium transition-all hover:scale-[1.01] active:scale-[0.99]"
                      style={{
                        background:`${color}0d`,
                        borderColor:`${color}25`,
                        color,
                      }}
                      onMouseEnter={e=>(e.currentTarget.style.background=`${color}18`)}
                      onMouseLeave={e=>(e.currentTarget.style.background=`${color}0d`)}>
                      {icon}{label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CISF overview */}
      {gates.filter(g=>g.security==="Active").length>0 && (
        <div className="rounded-2xl border p-5"
          style={{background:"rgba(239,68,68,0.05)",borderColor:"rgba(239,68,68,0.2)"}}>
          <h2 className="font-semibold text-white mb-3 flex items-center gap-2">
            <Shield className="w-5 h-5 text-red-400"/>Active CISF Security Zones
          </h2>
          <div className="grid xl:grid-cols-3 gap-3">
            {gates.filter(g=>g.security==="Active").map(g=>(
              <div key={g.id} className="flex items-start gap-3 p-3.5 rounded-xl"
                style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)"}}>
                <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse mt-1.5 flex-shrink-0"/>
                <div>
                  <div className="font-bold text-white text-sm">Gate {g.id} — {g.terminal}</div>
                  <div className="text-xs text-slate-400">{g.flight} to {g.dest}</div>
                  <div className="text-xs text-red-400 mt-0.5">Full CISF screening active</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Gate Modal */}
      {showAdd && <AddGateModal onClose={()=>setShowAdd(false)} onAdd={addGate}/>}
    </div>
  );
}
