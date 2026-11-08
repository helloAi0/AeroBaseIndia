import { useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { Plane, Search, AlertTriangle, Clock,
         CheckCircle, Users, Fuel, Wrench,
         TrendingUp } from "lucide-react";

// ── All airport flights (shown to airport admin/staff) ────────────────────────
const ALL_AIRPORT_FLIGHTS = [
  {id:1, flight:"AI-101",  airline:"Air India",  airCode:"AI",  from:"DEL",to:"BOM",dep:"10:30",arr:"12:40",gate:"A1",terminal:"T3",status:"Boarding",  pax:243,aircraft:"B787-8", captain:"Capt. Sharma",   fuel:"87%",bags:312,gc:8,  issue:null},
  {id:2, flight:"6E-2341", airline:"IndiGo",     airCode:"6E",  from:"DEL",to:"BLR",dep:"11:00",arr:"13:15",gate:"B3",terminal:"T2",status:"Scheduled", pax:186,aircraft:"A320neo",captain:"Capt. Gupta",    fuel:"91%",bags:0,  gc:7,  issue:null},
  {id:3, flight:"UK-925",  airline:"Vistara",    airCode:"UK",  from:"DEL",to:"HYD",dep:"09:45",arr:"11:55",gate:"C2",terminal:"T3",status:"Delayed",   pax:142,aircraft:"A320",   captain:"Capt. Pillai",  fuel:"88%",bags:167,gc:5,  issue:"Weather delay 45 min"},
  {id:4, flight:"SG-3405", airline:"SpiceJet",   airCode:"SG",  from:"DEL",to:"CCU",dep:"08:30",arr:"10:45",gate:"A4",terminal:"T1",status:"Departed",  pax:168,aircraft:"B737",   captain:"Capt. Joshi",   fuel:"—",  bags:192,gc:5,  issue:null},
  {id:5, flight:"IX-611",  airline:"Air Asia",   airCode:"IX",  from:"DEL",to:"COK",dep:"14:00",arr:"17:00",gate:"D1",terminal:"T2",status:"Scheduled", pax:168,aircraft:"B737",   captain:"Capt. Thomas",  fuel:"88%",bags:0,  gc:5,  issue:null},
  {id:6, flight:"AI-2811", airline:"Air India",  airCode:"AI",  from:"BOM",to:"DEL",dep:"07:00",arr:"09:05",gate:"A2",terminal:"T3",status:"Landed",    pax:228,aircraft:"B737",   captain:"Capt. Das",     fuel:"—",  bags:287,gc:8,  issue:null},
  {id:7, flight:"6E-5317", airline:"IndiGo",     airCode:"6E",  from:"BLR",to:"DEL",dep:"12:30",arr:"14:45",gate:"B5",terminal:"T2",status:"Boarding",  pax:178,aircraft:"A321neo",captain:"Capt. Ananya",  fuel:"—",  bags:214,gc:7,  issue:null},
  {id:8, flight:"QP-1401", airline:"Akasa Air",  airCode:"QP",  from:"DEL",to:"JAI",dep:"15:30",arr:"16:15",gate:"B1",terminal:"T1",status:"Scheduled", pax:186,aircraft:"B737MAX",captain:"Capt. Mehta",   fuel:"84%",bags:0,  gc:4,  issue:null},
  {id:9, flight:"AI-819",  airline:"Air India",  airCode:"AI",  from:"DEL",to:"LHR",dep:"13:45",arr:"19:15",gate:"E1",terminal:"T3",status:"Boarding",  pax:312,aircraft:"B777-200",captain:"Capt. Verma",   fuel:"94%",bags:428,gc:12, issue:null},
  {id:10,flight:"EK-511",  airline:"Emirates",   airCode:"EK",  from:"DEL",to:"DXB",dep:"16:00",arr:"18:30",gate:"E2",terminal:"T3",status:"Scheduled", pax:412,aircraft:"A380",   captain:"Capt. Al-M",    fuel:"97%",bags:0,  gc:18, issue:null},
  {id:11,flight:"SG-2801", airline:"SpiceJet",   airCode:"SG",  from:"DEL",to:"MAA",dep:"17:00",arr:"19:30",gate:"C4",terminal:"T1",status:"Scheduled", pax:172,aircraft:"B737",   captain:"Capt. Patil",   fuel:"86%",bags:0,  gc:0,  issue:null},
  {id:12,flight:"UK-202",  airline:"Vistara",    airCode:"UK",  from:"DEL",to:"GOI",dep:"18:30",arr:"20:15",gate:"B2",terminal:"T2",status:"Scheduled", pax:156,aircraft:"A321",   captain:"Capt. Rao",     fuel:"82%",bags:0,  gc:0,  issue:null},
  {id:13,flight:"6E-700",  airline:"IndiGo",     airCode:"6E",  from:"DEL",to:"GOA",dep:"18:00",arr:"19:45",gate:"B3",terminal:"T2",status:"Scheduled", pax:186,aircraft:"A320",   captain:"F/O Kiran",     fuel:"85%",bags:0,  gc:0,  issue:null},
  {id:14,flight:"AI-303",  airline:"Air India",  airCode:"AI",  from:"DEL",to:"HYD",dep:"16:00",arr:"18:05",gate:"A3",terminal:"T3",status:"Scheduled", pax:167,aircraft:"A320",   captain:"F/O Mehta",     fuel:"88%",bags:0,  gc:5,  issue:"Fuel top-up delayed"},
  {id:15,flight:"AI-501",  airline:"Air India",  airCode:"AI",  from:"DEL",to:"CCU",dep:"18:30",arr:"20:45",gate:"A2",terminal:"T3",status:"Scheduled", pax:189,aircraft:"TBD",    captain:"TBD",           fuel:"80%",bags:0,  gc:0,  issue:"Captain assignment pending"},
  {id:16,flight:"6E-111",  airline:"IndiGo",     airCode:"6E",  from:"CCU",to:"DEL",dep:"09:00",arr:"11:15",gate:"B4",terminal:"T2",status:"Landed",    pax:162,aircraft:"A320",   captain:"Capt. Singh",   fuel:"—",  bags:188,gc:6,  issue:null},
  {id:17,flight:"UK-555",  airline:"Vistara",    airCode:"UK",  from:"BOM",to:"DEL",dep:"08:00",arr:"10:10",gate:"C1",terminal:"T3",status:"Landed",    pax:138,aircraft:"A320",   captain:"Capt. Menon",   fuel:"—",  bags:156,gc:5,  issue:null},
  {id:18,flight:"EK-512",  airline:"Emirates",   airCode:"EK",  from:"DXB",to:"DEL",dep:"07:30",arr:"12:30",gate:"E2",terminal:"T3",status:"Landed",    pax:398,aircraft:"A380",   captain:"Capt. Hassan",  fuel:"—",  bags:498,gc:18, issue:null},
  {id:19,flight:"QP-201",  airline:"Akasa Air",  airCode:"QP",  from:"BOM",to:"DEL",dep:"11:00",arr:"12:55",gate:"B6",terminal:"T1",status:"Landed",    pax:178,aircraft:"B737MAX",captain:"Capt. Singh",   fuel:"—",  bags:198,gc:4,  issue:null},
  {id:20,flight:"IX-201",  airline:"Air India Express",airCode:"IX",from:"COK",to:"DEL",dep:"07:00",arr:"10:00",gate:"D2",terminal:"T2",status:"Landed",pax:152,aircraft:"B737", captain:"Capt. Nair",     fuel:"—",  bags:172,gc:5,  issue:null},
];

const AIRLINE_CODE_MAP: Record<string,string> = {
  airline_AI:"AI", airline_6E:"6E", airline_UK:"UK", airline_EK:"EK",
  airline_SG:"SG", airline_QP:"QP", airline_IX:"IX",
  pilot_captain_AI:"AI", pilot_captain_6E:"6E", pilot_captain_UK:"UK",
  pilot_fo_AI:"AI", pilot_fo_6E:"6E",
};

const AIRLINE_COLORS: Record<string,string> = {
  AI:"#ef4444","6E":"#0ea5e9",UK:"#8b5cf6",EK:"#f59e0b",
  SG:"#f97316",QP:"#22c55e",IX:"#dc2626",
};
const AIRLINE_NAMES: Record<string,string> = {
  AI:"Air India","6E":"IndiGo",UK:"Vistara",EK:"Emirates",
  SG:"SpiceJet",QP:"Akasa Air",IX:"Air India Express",
};

const STATUS_BADGE: Record<string,string> = {
  "Boarding":  "bg-teal-500/15 text-teal-400 border-teal-500/20",
  "Scheduled": "bg-sky-500/15 text-sky-400 border-sky-500/20",
  "Delayed":   "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  "Departed":  "bg-green-500/15 text-green-400 border-green-500/20",
  "Landed":    "bg-green-600/15 text-green-300 border-green-600/20",
  "Cancelled": "bg-red-500/15 text-red-400 border-red-500/20",
};

type Flight = typeof ALL_AIRPORT_FLIGHTS[0];

export function FlightsPage() {
  const { user } = useAuthStore();
  const [search,  setSearch]  = useState("");
  const [status,  setStatus]  = useState("All");
  const [sel,     setSel]     = useState<Flight|null>(null);

  // Determine if user is airline-specific
  const sl           = user?.staffLevel || "";
  const airlineCode  = AIRLINE_CODE_MAP[sl] || null;
  const isAirlineUser= airlineCode !== null;
  const airlineColor = isAirlineUser ? (AIRLINE_COLORS[airlineCode!]||"#0ea5e9") : "#0ea5e9";
  const airlineName  = isAirlineUser ? (AIRLINE_NAMES[airlineCode!]||"") : "";

  // Filter flights
  const flights = isAirlineUser
    ? ALL_AIRPORT_FLIGHTS.filter(f=>f.airCode===airlineCode)
    : ALL_AIRPORT_FLIGHTS;

  const filtered = flights.filter(f=>
    (status==="All"||f.status===status) &&
    (!search||f.flight.toLowerCase().includes(search.toLowerCase())||
     f.to.toLowerCase().includes(search.toLowerCase())||
     f.from.toLowerCase().includes(search.toLowerCase())||
     f.airline.toLowerCase().includes(search.toLowerCase())||
     f.captain.toLowerCase().includes(search.toLowerCase()))
  );

  const boarding  = flights.filter(f=>f.status==="Boarding").length;
  const airborne  = flights.filter(f=>f.status==="Departed").length;
  const delayed   = flights.filter(f=>f.status==="Delayed").length;
  const issues    = flights.filter(f=>f.issue).length;
  const totalPax  = flights.filter(f=>f.pax>0).reduce((s,f)=>s+f.pax,0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {isAirlineUser ? `${airlineName} Flights — DEL` : "Flight Operations Dashboard"}
          </h1>
          <p className="text-slate-400 text-sm">
            {isAirlineUser
              ? `${airlineCode} · Only your airline's flights · Delhi IGI Airport`
              : "Delhi IGI Airport · All airlines · Live data"}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {isAirlineUser && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border"
              style={{background:`${airlineColor}10`,borderColor:`${airlineColor}30`}}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black text-white"
                style={{background:`${airlineColor}30`}}>
                {airlineCode}
              </div>
              <div className="text-xs">
                <div className="text-slate-400">{airlineName}</div>
                <div className="font-bold" style={{color:airlineColor}}>{flights.length} flights today</div>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border"
            style={{background:"rgba(34,197,94,0.06)",borderColor:"rgba(34,197,94,0.2)"}}>
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"/>
            <div className="text-xs">
              <div className="text-slate-500">Active</div>
              <div className="font-black text-green-400">{boarding+airborne} in progress</div>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
        {[
          {l:"Total Flights",   v:flights.length,                 c:isAirlineUser?airlineColor:"#0ea5e9", icon:<Plane className="w-4 h-4"/>},
          {l:"Total Passengers",v:totalPax.toLocaleString(),       c:"#8b5cf6",       icon:<Users className="w-4 h-4"/>},
          {l:"Boarding Now",    v:boarding,                        c:"#14b8a6",       icon:<CheckCircle className="w-4 h-4"/>},
          {l:"Delayed",         v:delayed,                         c:delayed>0?"#f59e0b":"#22c55e", icon:<Clock className="w-4 h-4"/>},
          {l:"Active Issues",   v:issues,                          c:issues>0?"#ef4444":"#22c55e",  icon:<AlertTriangle className="w-4 h-4"/>},
        ].map(({l,v,c,icon})=>(
          <div key={l} className="rounded-2xl p-4 border"
            style={{background:`${c}08`,borderColor:`${c}20`}}>
            <div className="mb-2 flex items-center gap-1.5" style={{color:c}}>{icon}</div>
            <div className="text-2xl font-black mb-0.5" style={{color:c}}>{v}</div>
            <div className="text-xs text-slate-500">{l}</div>
          </div>
        ))}
      </div>

      {/* Issues alert */}
      {issues>0 && (
        <div className="p-4 rounded-2xl border"
          style={{background:"rgba(239,68,68,0.07)",borderColor:"rgba(239,68,68,0.3)"}}>
          <div className="font-bold text-red-300 flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4"/>
            {issues} Active Issue{issues!==1?"s":""} — Immediate Attention Required
          </div>
          {flights.filter(f=>f.issue).map(f=>(
            <div key={f.id} className="flex items-center gap-3 text-sm py-2 border-t"
              style={{borderColor:"rgba(239,68,68,0.15)"}}>
              <span className="font-mono font-bold w-24" style={{color:AIRLINE_COLORS[f.airCode]||"#ef4444"}}>{f.flight}</span>
              <span className="text-red-400 flex-1">{f.issue}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_BADGE[f.status]}`}>{f.status}</span>
              <button className="text-xs px-3 py-1.5 rounded-lg font-semibold"
                style={{background:"rgba(239,68,68,0.2)",color:"#fca5a5"}}>
                Assign Crew →
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Live status strip */}
      <div className="grid grid-cols-5 xl:grid-cols-10 gap-2">
        {flights.slice(0,10).map(f=>{
          const c = AIRLINE_COLORS[f.airCode]||"#64748b";
          return (
            <div key={f.id}
              onClick={()=>setSel(sel?.id===f.id?null:f)}
              className="p-2.5 rounded-xl border text-center cursor-pointer hover:scale-105 transition-all"
              style={{
                background:`${c}10`,
                borderColor:sel?.id===f.id?c:`${c}25`,
              }}>
              <div className="font-mono font-black text-xs mb-1" style={{color:c}}>{f.flight.split("-")[0]}</div>
              <div className="text-xs text-white font-bold">{f.flight.split("-")[1]}</div>
              <div className="text-xs text-slate-500 mt-0.5">{f.to}</div>
              <div className="mt-1.5">
                <div className={`text-xs px-1 py-0.5 rounded text-center font-bold ${
                  f.status==="Boarding"?"text-teal-400":
                  f.status==="Delayed"?"text-yellow-400":
                  f.status==="Landed"||f.status==="Departed"?"text-green-400":
                  "text-slate-400"}`}>
                  {f.status==="Boarding"?"🟢":f.status==="Delayed"?"🟡":f.status==="Landed"?"✅":f.status==="Departed"?"🔵":"⚪"}
                  {" "}{f.status.slice(0,5)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search & filter */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 rounded-xl px-3.5 py-2.5 border flex-1 max-w-xs"
          style={{background:"rgba(255,255,255,0.04)",borderColor:"rgba(255,255,255,0.08)"}}>
          <Search className="w-4 h-4 text-slate-500"/>
          <input className="bg-transparent text-sm text-white placeholder-slate-500 outline-none w-full"
            placeholder={isAirlineUser?`Search ${airlineName} flights...`:"Search flight, airline, route, captain..."}
            value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {["All","Boarding","Scheduled","Delayed","Departed","Landed","Cancelled"].map(s=>(
            <button key={s} onClick={()=>setStatus(s)}
              className="px-3 py-2 rounded-xl text-xs font-medium border transition-all"
              style={status===s
                ?{background:isAirlineUser?airlineColor:"#0ea5e9",borderColor:isAirlineUser?airlineColor:"#0ea5e9",color:"white"}
                :{background:"transparent",borderColor:"rgba(255,255,255,0.08)",color:"#64748b"}}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Main table + detail */}
      <div className={`grid gap-5 ${sel?"xl:grid-cols-3":""}`}>
        <div className={`rounded-2xl border overflow-hidden ${sel?"xl:col-span-2":""}`}
          style={{background:"#080d18",borderColor:"#1e2d4d"}}>
          <div className="px-5 py-4 border-b flex items-center justify-between"
            style={{borderColor:"#1e2d4d"}}>
            <div className="font-bold text-white">
              ✈ Flights — {filtered.length} shown
              {isAirlineUser && <span className="ml-2 text-xs font-normal text-slate-500">({airlineName} only)</span>}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"/>Live
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{borderBottom:"1px solid #1e2d4d"}}>
                  {(isAirlineUser
                    ? ["Flight","Route","Gate","Dep","Arr","Passengers","Captain","Bags","Fuel","Crew","Status","Issues"]
                    : ["Flight","Airline","Route","Gate","Terminal","Dep","Arr","Passengers","Status"]
                  ).map(h=>(
                    <th key={h} className="px-4 py-3 text-left text-xs uppercase" style={{color:"#475569"}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(f=>{
                  const fc = AIRLINE_COLORS[f.airCode]||"#64748b";
                  return (
                    <tr key={f.id}
                      onClick={()=>setSel(sel?.id===f.id?null:f)}
                      className="cursor-pointer transition-all"
                      style={{
                        borderBottom:"1px solid rgba(30,45,77,0.5)",
                        background:sel?.id===f.id?`${fc}10`:f.issue?"rgba(239,68,68,0.03)":"",
                      }}
                      onMouseEnter={e=>{if(sel?.id!==f.id)(e.currentTarget.style.background="rgba(255,255,255,0.025)")}}
                      onMouseLeave={e=>{if(sel?.id!==f.id)(e.currentTarget.style.background=f.issue?"rgba(239,68,68,0.03)":"");}}
                    >
                      <td className="px-4 py-3.5 font-mono font-black" style={{color:fc}}>{f.flight}</td>
                      {!isAirlineUser && <td className="px-4 py-3.5 text-xs text-slate-400">{f.airline}</td>}
                      <td className="px-4 py-3.5 text-white font-medium">{f.from} → {f.to}</td>
                      <td className="px-4 py-3.5 font-mono text-slate-300">{f.gate}</td>
                      {!isAirlineUser && <td className="px-4 py-3.5 text-slate-400">{f.terminal}</td>}
                      <td className="px-4 py-3.5 font-mono text-slate-300">{f.dep}</td>
                      <td className="px-4 py-3.5 font-mono text-slate-300">{f.arr}</td>
                      <td className="px-4 py-3.5 text-slate-300">👤 {f.pax}</td>
                      {isAirlineUser && <>
                        <td className="px-4 py-3.5 text-xs text-slate-400 max-w-28 truncate">{f.captain}</td>
                        <td className="px-4 py-3.5 text-xs text-slate-400">{f.bags>0?`🧳 ${f.bags}`:"—"}</td>
                        <td className="px-4 py-3.5 text-xs">
                          <span className={f.fuel==="—"?"text-slate-600":
                            parseInt(f.fuel)>=90?"text-green-400":
                            parseInt(f.fuel)>=80?"text-yellow-400":"text-red-400"}>
                            {f.fuel!=="—"?"⛽ ":""}{f.fuel}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-slate-400">{f.gc>0?`👷 ${f.gc}`:"—"}</td>
                      </>}
                      <td className="px-4 py-3.5">
                        <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${STATUS_BADGE[f.status]||STATUS_BADGE["Scheduled"]}`}>
                          {f.status}
                        </span>
                      </td>
                      {isAirlineUser && (
                        <td className="px-4 py-3.5 text-xs text-red-400">
                          {f.issue?<span title={f.issue||""}>⚠️</span>:""}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail panel */}
        {sel && (
          <div className="rounded-2xl border p-5 space-y-4 h-fit"
            style={{background:"#080d18",borderColor:`${AIRLINE_COLORS[sel.airCode]||"#1e2d4d"}40`}}>
            <div className="flex justify-between">
              <h2 className="font-bold text-white">Flight Details</h2>
              <button onClick={()=>setSel(null)} className="text-slate-500 hover:text-white text-xl">×</button>
            </div>

            {/* Flight header */}
            <div className="rounded-2xl p-4"
              style={{background:`${AIRLINE_COLORS[sel.airCode]||"#0ea5e9"}10`,
                      border:`1px solid ${AIRLINE_COLORS[sel.airCode]||"#0ea5e9"}25`}}>
              <div className="font-black text-2xl font-mono mb-0.5"
                style={{color:AIRLINE_COLORS[sel.airCode]||"#0ea5e9"}}>{sel.flight}</div>
              <div className="text-slate-400 text-sm">{sel.airline}</div>
              <div className="flex items-center gap-2 text-lg font-bold text-white mt-2">
                {sel.from}
                <Plane className="w-5 h-5 text-sky-400"/>
                {sel.to}
              </div>
              <div className="flex gap-3 mt-2 text-xs text-slate-400">
                <span>🕐 {sel.dep} → {sel.arr}</span>
                <span className={`px-2 py-0.5 rounded-full border font-bold ${STATUS_BADGE[sel.status]||STATUS_BADGE["Scheduled"]}`}>
                  {sel.status}
                </span>
              </div>
            </div>

            {/* Details list */}
            <div className="space-y-2">
              {[
                {l:"Gate",           v:sel.gate,                 icon:"🚪"},
                {l:"Terminal",       v:sel.terminal,             icon:"🏢"},
                {l:"Aircraft",       v:sel.aircraft,             icon:"✈"},
                {l:"Captain",        v:sel.captain,              icon:"👨‍✈️"},
                {l:"Passengers",     v:`${sel.pax} boarded`,     icon:"👤"},
                {l:"Bags Loaded",    v:sel.bags>0?`${sel.bags}`:"Pre-boarding",icon:"🧳"},
                {l:"Fuel Level",     v:sel.fuel,                 icon:"⛽"},
                {l:"Ground Crew",    v:`${sel.gc} assigned`,     icon:"👷"},
              ].map(({l,v,icon})=>(
                <div key={l} className="flex items-center gap-3 p-2.5 rounded-xl"
                  style={{background:"rgba(255,255,255,0.03)"}}>
                  <span className="text-base w-6">{icon}</span>
                  <span className="text-slate-400 text-xs flex-1">{l}</span>
                  <span className="font-semibold text-white text-sm">{v}</span>
                </div>
              ))}
            </div>

            {/* Issue */}
            {sel.issue && (
              <div className="p-3.5 rounded-xl"
                style={{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.25)"}}>
                <div className="text-xs font-bold text-red-300 mb-1">⚠️ Active Issue</div>
                <div className="text-xs text-red-400">{sel.issue}</div>
              </div>
            )}

            {/* Quick actions */}
            <div className="space-y-2">
              <div className="text-xs text-slate-500 uppercase font-semibold">Quick Actions</div>
              {[
                {icon:<Users className="w-3.5 h-3.5"/>,    label:"Assign More Crew"},
                {icon:<Fuel className="w-3.5 h-3.5"/>,     label:"Request Fuel Top-up"},
                {icon:<Wrench className="w-3.5 h-3.5"/>,   label:"Flag Maintenance"},
                {icon:<TrendingUp className="w-3.5 h-3.5"/>,label:"Update Passengers"},
              ].map(({icon,label})=>(
                <button key={label}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm text-slate-300 hover:text-white transition-all"
                  style={{
                    background:`${AIRLINE_COLORS[sel.airCode]||"#0ea5e9"}06`,
                    borderColor:`${AIRLINE_COLORS[sel.airCode]||"#0ea5e9"}20`
                  }}>
                  <span style={{color:AIRLINE_COLORS[sel.airCode]||"#0ea5e9"}}>{icon}</span>
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Summary footer */}
      <div className="grid xl:grid-cols-3 gap-4">
        <div className="rounded-xl p-4 border" style={{background:"rgba(14,165,233,0.05)",borderColor:"rgba(14,165,233,0.15)"}}>
          <div className="text-xs text-slate-500 mb-1">Flights Airborne Right Now</div>
          <div className="font-black text-2xl text-sky-400">{boarding + airborne}</div>
        </div>
        <div className="rounded-xl p-4 border" style={{background:"rgba(34,197,94,0.05)",borderColor:"rgba(34,197,94,0.15)"}}>
          <div className="text-xs text-slate-500 mb-1">Flights Completed Today</div>
          <div className="font-black text-2xl text-green-400">{flights.filter(f=>f.status==="Landed"||f.status==="Departed").length}</div>
        </div>
        <div className="rounded-xl p-4 border" style={{background:"rgba(139,92,246,0.05)",borderColor:"rgba(139,92,246,0.15)"}}>
          <div className="text-xs text-slate-500 mb-1">Total Passengers Today</div>
          <div className="font-black text-2xl text-purple-400">{totalPax.toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
}
