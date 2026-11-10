import { useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { useAirlineScope } from "../../hooks/useAirlineScope";
import { Package, CheckCircle, Clock, AlertTriangle,
         Plane, MapPin, Users, Search } from "lucide-react";

// ── Flight-level baggage data (for airport staff/admin) ───────────────────────
const ALL_BAGGAGE = [
  {
    flight:"AI-101",  airline:"Air India",   origin:"DEL",
    terminal:"T3",    belt:"B3",  carousel:3,
    total:187,  loaded:162, transit:18,  arrived:7,  missing:0,
    eta:"8 min",    status:"In Transit",   gate:"C3",
    dep:"10:30",    pax:346,
  },
  {
    flight:"6E-2341", airline:"IndiGo",      origin:"DEL",
    terminal:"T2",    belt:"A1",  carousel:1,
    total:132,  loaded:132, transit:0,   arrived:132, missing:0,
    eta:"Arrived",  status:"At Carousel",  gate:"B1",
    dep:"11:00",    pax:140,
  },
  {
    flight:"UK-925",  airline:"Vistara",     origin:"DEL",
    terminal:"T3",    belt:"C2",  carousel:2,
    total:98,   loaded:45,  transit:50,  arrived:3,  missing:0,
    eta:"15 min",   status:"Loading",      gate:"B2",
    dep:"09:45",    pax:104,
  },
  {
    flight:"SG-3405", airline:"SpiceJet",    origin:"DEL",
    terminal:"T1",    belt:"D1",  carousel:4,
    total:74,   loaded:74,  transit:0,   arrived:74,  missing:0,
    eta:"Collected",status:"Collected",   gate:"A4",
    dep:"08:30",    pax:125,
  },
  {
    flight:"IX-611",  airline:"Air India Express",    origin:"DEL",
    terminal:"T2",    belt:"—",   carousel:0,
    total:61,   loaded:58,  transit:2,   arrived:0,  missing:1,
    eta:"Unknown",  status:"Issue",        gate:"C2",
    dep:"14:00",    pax:130,
  },
  {
    flight:"6E-5317", airline:"IndiGo",      origin:"BLR",
    terminal:"T2",    belt:"B5",  carousel:5,
    total:88,   loaded:0,   transit:0,   arrived:0,  missing:0,
    eta:"20 min",   status:"Not Started",  gate:"B5",
    dep:"12:30",    pax:88,
  },
  {
    flight:"AI-2811", airline:"Air India",   origin:"BOM",
    terminal:"T3",    belt:"A2",  carousel:2,
    total:95,   loaded:95,  transit:0,   arrived:95,  missing:0,
    eta:"Collected",status:"Collected",   gate:"E1",
    dep:"07:00",    pax:230,
  },
  {
    flight:"EK-512",  airline:"Emirates",   origin:"DXB",
    terminal:"T3",    belt:"E1",  carousel:1,
    total:398,  loaded:398, transit:0,   arrived:352, missing:0,
    eta:"Arrived",  status:"At Carousel",  gate:"D1",
    dep:"07:30",    pax:398,
  },
  {
    flight:"EK-511",  airline:"Emirates",   origin:"DEL",
    terminal:"T3",    belt:"—",   carousel:0,
    total:520,  loaded:310, transit:210, arrived:0,  missing:0,
    eta:"Departing", status:"Loading",     gate:"D1",
    dep:"16:00",    pax:412,
  },
  {
    flight:"QP-201",  airline:"Akasa Air",  origin:"BOM",
    terminal:"T1",    belt:"B4",  carousel:4,
    total:198,  loaded:198, transit:0,   arrived:198, missing:0,
    eta:"Collected",status:"Collected",    gate:"A4",
    dep:"11:00",    pax:178,
  },
  {
    flight:"QP-1401", airline:"Akasa Air",  origin:"DEL",
    terminal:"T1",    belt:"—",   carousel:0,
    total:162,  loaded:60,  transit:102, arrived:0,  missing:0,
    eta:"Departing", status:"Loading",     gate:"A4",
    dep:"15:30",    pax:186,
  },
  {
    flight:"UK-555",  airline:"Vistara",    origin:"BOM",
    terminal:"T3",    belt:"C1",  carousel:2,
    total:156,  loaded:156, transit:0,   arrived:140, missing:1,
    eta:"Arrived",  status:"Issue",        gate:"C1",
    dep:"08:00",    pax:138,
  },
  {
    flight:"SG-2801", airline:"SpiceJet",   origin:"DEL",
    terminal:"T1",    belt:"—",   carousel:0,
    total:176,  loaded:0,   transit:0,   arrived:0,  missing:0,
    eta:"Departing", status:"Not Started", gate:"B3",
    dep:"17:00",    pax:176,
  },
  {
    flight:"IX-201",  airline:"Air India Express", origin:"COK",
    terminal:"T2",    belt:"D1",  carousel:5,
    total:172,  loaded:172, transit:0,   arrived:172, missing:0,
    eta:"Collected",status:"Collected",    gate:"D2",
    dep:"07:00",    pax:152,
  },
];

const STATUS_CFG: Record<string,{style:string;dot:string}> = {
  "In Transit":   {style:"bg-yellow-500/15 text-yellow-400 border-yellow-500/20", dot:"bg-yellow-400"},
  "At Carousel":  {style:"bg-teal-500/15 text-teal-400 border-teal-500/20",       dot:"bg-teal-400 animate-pulse"},
  "Loading":      {style:"bg-sky-500/15 text-sky-400 border-sky-500/20",          dot:"bg-sky-400"},
  "Collected":    {style:"bg-green-500/15 text-green-400 border-green-500/20",    dot:"bg-green-400"},
  "Not Started":  {style:"bg-slate-500/15 text-slate-400 border-slate-500/20",    dot:"bg-slate-500"},
  "Issue":        {style:"bg-red-500/15 text-red-400 border-red-500/20",          dot:"bg-red-400 animate-pulse"},
};

// ── Passenger baggage data (private — per booking) ────────────────────────────
const MY_BOOKING = {
  pnr:      "PAX9X4Y",
  name:     "Passenger User",
  flight:   "AI-101",
  airline:  "Air India",
  dest:     "BOM",
  dep:      "10:30",
  terminal: "T3",
  belt:     "B3",
  carousel: 3,
  eta:      "8 min",
  members: [
    {name:"Passenger User",  rel:"Self",   bags:[{id:"BAG-PAX001",weight:23,desc:"Black trolley",status:"In Transit",  eta:"8 min"}]},
    {name:"Sunita User",     rel:"Mother", bags:[{id:"BAG-PAX002",weight:18,desc:"Blue soft bag",status:"Loading",     eta:"12 min"}]},
    {name:"Raj User",        rel:"Father", bags:[{id:"BAG-PAX003",weight:25,desc:"Brown suitcase",status:"Loading",   eta:"14 min"}]},
  ],
};

const BAG_STATUS_CFG: Record<string,string> = {
  "Loading":      "bg-sky-500/15 text-sky-400 border-sky-500/20",
  "In Transit":   "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  "Loaded on Belt":"bg-teal-500/15 text-teal-400 border-teal-500/20",
  "At Carousel":  "bg-teal-600/15 text-teal-300 border-teal-600/20",
  "Collected":    "bg-green-500/15 text-green-400 border-green-500/20",
  "Missing":      "bg-red-500/15 text-red-400 border-red-500/20",
};

// ── ADMIN / STAFF VIEW ────────────────────────────────────────────────────────
function StaffBaggageView() {
  const air = useAirlineScope();
  const FLIGHT_BAGGAGE = air.scope(ALL_BAGGAGE, f=>f.flight);
  const [search,   setSearch]   = useState("");
  const [selected, setSelected] = useState<typeof ALL_BAGGAGE[0]|null>(null);

  const filtered = FLIGHT_BAGGAGE.filter(f=>
    !search ||
    f.flight.toLowerCase().includes(search.toLowerCase()) ||
    f.airline.toLowerCase().includes(search.toLowerCase()) ||
    f.terminal.toLowerCase().includes(search.toLowerCase())
  );

  const total   = FLIGHT_BAGGAGE.reduce((s,f)=>s+f.total,0);
  const transit = FLIGHT_BAGGAGE.reduce((s,f)=>s+f.transit,0);
  const arrived = FLIGHT_BAGGAGE.reduce((s,f)=>s+f.arrived,0);
  const issues  = FLIGHT_BAGGAGE.filter(f=>f.missing>0||f.status==="Issue").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {air.isAirline ? `${air.name} Baggage Operations` : "Baggage Operations"}
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {air.isAirline
              ? `${air.code} · Your airline's baggage only · Belt & carousel assignments`
              : "Flight-level baggage tracking — Belt & carousel assignments"}
          </p>
        </div>
        {issues>0 && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm animate-pulse"
            style={{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.3)",color:"#f87171"}}>
            <AlertTriangle className="w-4 h-4"/>{issues} flight with baggage issue
          </div>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          {label:"Total Bags Today",value:total,   icon:<Package className="w-5 h-5"/>,       color:"sky"},
          {label:"In Transit",      value:transit,  icon:<Clock className="w-5 h-5"/>,         color:"yellow"},
          {label:"At Carousels",    value:arrived,  icon:<CheckCircle className="w-5 h-5"/>,   color:"teal"},
          {label:"Flights w/ Issues",value:issues,  icon:<AlertTriangle className="w-5 h-5"/>, color:"red"},
        ].map(({label,value,icon,color})=>(
          <div key={label} className="bg-navy-800 rounded-2xl p-5 border border-navy-600">
            <div className={`text-${color}-400 mb-3`}>{icon}</div>
            <div className="text-2xl font-bold font-mono text-white mb-0.5">{value}</div>
            <div className="text-sm text-slate-400">{label}</div>
          </div>
        ))}
      </div>

      {/* Belt overview */}
      <div className="bg-navy-800 rounded-2xl border border-navy-600 p-5">
        <h2 className="font-semibold text-white mb-4">Belt / Carousel Status</h2>
        <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
          {[1,2,3,4,5].map(n=>{
            const flights = FLIGHT_BAGGAGE.filter(f=>f.carousel===n);
            const active  = flights.some(f=>f.status==="At Carousel"||f.status==="In Transit");
            return (
              <div key={n} className="p-4 rounded-xl border text-center transition-all"
                style={{
                  background:active?"rgba(56,189,248,0.08)":"rgba(255,255,255,0.02)",
                  borderColor:active?"rgba(56,189,248,0.3)":"rgba(255,255,255,0.06)",
                }}>
                <div className="text-xl font-black font-mono mb-1"
                  style={{color:active?"#38bdf8":"#334155"}}>
                  Belt {n}
                </div>
                {flights.map(f=>(
                  <div key={f.flight} className="text-xs font-mono mt-0.5"
                    style={{color:active?"#7dd3fc":"#475569"}}>
                    {f.flight}
                  </div>
                ))}
                {flights.length===0 && <div className="text-xs text-slate-700">Idle</div>}
                {active && (
                  <div className="text-xs font-semibold mt-1.5"
                    style={{color:"#38bdf8"}}>● Active</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-navy-800 border border-navy-600 rounded-xl px-4 py-3">
        <Search className="w-4 h-4 text-slate-500"/>
        <input className="bg-transparent text-sm text-white placeholder-slate-500 outline-none w-full"
          placeholder="Search by flight, airline, or terminal..."
          value={search} onChange={e=>setSearch(e.target.value)}/>
      </div>

      {/* Flight baggage table + detail */}
      <div className={`grid gap-5 ${selected?"xl:grid-cols-3":"xl:grid-cols-1"}`}>
        <div className={`bg-navy-800 rounded-2xl border border-navy-600 overflow-hidden ${selected?"xl:col-span-2":""}`}>
          <div className="p-4 border-b border-navy-600">
            <h2 className="font-semibold text-white">Flight Baggage Summary</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Passenger names are private — only flight-level data shown to airport staff
            </p>
          </div>
          <div className="table-scroll"><table className="w-full text-sm">
            <thead>
              <tr className="text-slate-500 text-xs uppercase">
                {["Flight","Airline","Terminal","Belt/Carousel","Total Bags","Status","ETA","Issues"].map(h=>(
                  <th key={h} className="px-4 py-3 text-left border-b border-navy-700">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(f=>{
                const cfg = STATUS_CFG[f.status]||STATUS_CFG["Not Started"];
                const pct = f.total>0 ? Math.round((f.loaded/f.total)*100) : 0;
                return (
                  <tr key={f.flight}
                    onClick={()=>setSelected(selected?.flight===f.flight?null:f)}
                    className={`border-b border-navy-700/50 cursor-pointer transition-all ${
                      selected?.flight===f.flight?"bg-sky-500/8":"hover:bg-navy-700/40"
                    } ${f.missing>0||f.status==="Issue"?"bg-red-500/3":""}`}>
                    <td className="px-4 py-3.5">
                      <div className="font-mono font-bold text-sky-300">{f.flight}</div>
                      <div className="text-xs text-slate-500">{f.dep}</div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-300 text-xs">{f.airline}</td>
                    <td className="px-4 py-3.5">
                      <div className="font-mono font-bold text-white">{f.terminal}</div>
                      <div className="text-xs text-slate-500">Gate {f.gate}</div>
                    </td>
                    <td className="px-4 py-3.5 font-mono font-bold text-white">
                      {f.belt!=="—"?`${f.belt} / C${f.carousel}`:"Not assigned"}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="text-white font-mono">{f.total}</div>
                      <div className="mt-1 h-1.5 bg-navy-700 rounded-full w-16">
                        <div className="h-full rounded-full"
                          style={{width:`${pct}%`,background:pct===100?"#22c55e":"#0ea5e9"}}/>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">{pct}% loaded</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`}/>
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${cfg.style}`}>
                          {f.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs font-medium ${
                        f.eta==="Collected"?"text-green-400":
                        f.eta==="Unknown"?"text-red-400":"text-yellow-400"}`}>
                        {f.eta}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {f.missing>0
                        ?<span className="text-xs text-red-400 font-bold flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3"/>{f.missing} missing
                          </span>
                        :<span className="text-xs text-green-400">✓ Clear</span>
                      }
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table></div>
        </div>

        {/* Flight detail panel */}
        {selected && (
          <div className="bg-navy-800 rounded-2xl border border-sky-500/30 p-5 space-y-4 h-fit">
            <div className="flex justify-between">
              <h2 className="font-semibold text-white">Baggage Detail</h2>
              <button onClick={()=>setSelected(null)} className="text-slate-500 hover:text-white text-xl">×</button>
            </div>
            <div className="p-4 rounded-xl text-center"
              style={{background:"rgba(56,189,248,0.08)",border:"1px solid rgba(56,189,248,0.2)"}}>
              <div className="text-3xl font-black font-mono text-sky-300 mb-1">{selected.flight}</div>
              <div className="text-sm text-slate-400">{selected.airline}</div>
            </div>

            {[
              {label:"Terminal",      value:selected.terminal},
              {label:"Belt",         value:selected.belt!=="—"?selected.belt:"Not assigned"},
              {label:"Carousel",     value:selected.carousel>0?`Carousel ${selected.carousel}`:"Not assigned"},
              {label:"ETA",          value:selected.eta},
              {label:"Total Bags",   value:`${selected.total}`},
              {label:"Loaded",       value:`${selected.loaded}`},
              {label:"In Transit",   value:`${selected.transit}`},
              {label:"At Carousel",  value:`${selected.arrived}`},
            ].map(({label,value})=>(
              <div key={label} className="flex justify-between p-3 bg-navy-700/40 rounded-xl">
                <span className="text-sm text-slate-400">{label}</span>
                <span className="text-sm font-mono font-medium text-white">{value}</span>
              </div>
            ))}

            {selected.missing>0 && (
              <div className="p-3 rounded-xl font-semibold text-red-300 text-sm"
                style={{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.2)"}}>
                ⚠️ {selected.missing} bag reported missing — Ground staff to investigate
              </div>
            )}

            {/* Progress bar */}
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-400">Loading progress</span>
                <span className="text-white font-bold">
                  {selected.total>0?Math.round(selected.loaded/selected.total*100):0}%
                </span>
              </div>
              <div className="h-2.5 bg-navy-700 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all"
                  style={{
                    width:`${selected.total>0?(selected.loaded/selected.total*100):0}%`,
                    background:"linear-gradient(90deg,#0ea5e9,#22c55e)"
                  }}/>
              </div>
            </div>

            <div className="text-xs text-slate-500 p-3 rounded-xl"
              style={{background:"rgba(255,255,255,0.02)"}}>
              🔒 Individual passenger names are not visible to airport staff.
              Passengers can track their own bags by logging in.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── PASSENGER VIEW ────────────────────────────────────────────────────────────
function PassengerBaggageView() {
  const [pnr, setPnr] = useState("");

  const JOURNEY_STEPS = ["Checked In","Loading","In Transit","Loaded on Belt","At Carousel","Collected"];

  const stepIdx = (status:string) => JOURNEY_STEPS.indexOf(status);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white">My Baggage Tracker</h1>
        <p className="text-slate-400 text-sm mt-1">
          Tracking bags for booking PNR: <span className="font-mono text-sky-300">{MY_BOOKING.pnr}</span>
        </p>
      </div>

      {/* Flight info */}
      <div className="p-5 rounded-2xl border"
        style={{background:"linear-gradient(135deg,rgba(14,165,233,0.12),rgba(20,184,166,0.06))",
                borderColor:"rgba(56,189,248,0.25)"}}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Plane className="w-5 h-5 text-sky-400"/>
            <div>
              <div className="font-bold text-white">{MY_BOOKING.flight} — {MY_BOOKING.airline}</div>
              <div className="text-xs text-slate-400">{MY_BOOKING.dep} → {MY_BOOKING.dest}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-400">Baggage Claim</div>
            <div className="text-2xl font-black font-mono text-sky-300">
              {MY_BOOKING.belt} / C{MY_BOOKING.carousel}
            </div>
          </div>
        </div>

        <div className="p-3 rounded-xl"
          style={{background:"rgba(56,189,248,0.08)",border:"1px solid rgba(56,189,248,0.15)"}}>
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-sky-400"/>
            <span className="text-sky-300 font-semibold text-sm">Where to collect your bags:</span>
          </div>
          <div className="text-sm text-slate-200 space-y-1">
            <div>1. Proceed to <span className="font-bold text-white">{MY_BOOKING.terminal}</span> — Baggage Claim Hall</div>
            <div>2. Go to <span className="font-bold text-white">Belt {MY_BOOKING.belt} / Carousel {MY_BOOKING.carousel}</span></div>
            <div>3. Estimated wait: <span className="font-bold text-yellow-400">{MY_BOOKING.eta}</span></div>
          </div>
        </div>
      </div>

      {/* My family members' bags */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-sky-400"/>
            Your Booking — {MY_BOOKING.members.length} Travellers
          </h2>
          <span className="text-xs text-slate-500 font-mono">PNR: {MY_BOOKING.pnr}</span>
        </div>

        <div className="space-y-4">
          {MY_BOOKING.members.map((member,mi)=>(
            <div key={mi} className="bg-navy-800 rounded-2xl border border-navy-600 overflow-hidden">
              {/* Member header */}
              <div className="flex items-center gap-3 p-4 border-b border-navy-700"
                style={{background:mi===0?"rgba(56,189,248,0.06)":"rgba(255,255,255,0.02)"}}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm"
                  style={{background:mi===0?"rgba(56,189,248,0.2)":"rgba(255,255,255,0.06)",
                          color:mi===0?"#38bdf8":"#94a3b8"}}>
                  {member.name.split(" ").map(n=>n[0]).join("")}
                </div>
                <div>
                  <div className="font-semibold text-white">{member.name}</div>
                  <div className="text-xs text-slate-400">{member.rel} · {member.bags.length} bag{member.bags.length!==1?"s":""}</div>
                </div>
                {mi===0 && <span className="ml-auto text-xs px-2 py-0.5 rounded-full"
                  style={{background:"rgba(56,189,248,0.15)",color:"#38bdf8"}}>You</span>}
              </div>

              {/* Bags */}
              <div className="p-4 space-y-4">
                {member.bags.map((bag,bi)=>{
                  const idx = stepIdx(bag.status);
                  return (
                    <div key={bi}>
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="font-mono text-xs text-slate-500">{bag.id}</div>
                          <div className="text-sm font-medium text-white">{bag.desc}</div>
                          <div className="text-xs text-slate-400">{bag.weight}kg</div>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${BAG_STATUS_CFG[bag.status]||"bg-slate-500/15 text-slate-400"}`}>
                            {bag.status}
                          </span>
                          <div className="text-xs text-yellow-400 font-medium mt-1">ETA: {bag.eta}</div>
                        </div>
                      </div>

                      {/* Journey bar */}
                      <div className="flex items-center">
                        {JOURNEY_STEPS.map((step,si)=>(
                          <div key={step} className="flex items-center flex-1 last:flex-none">
                            <div className="flex flex-col items-center">
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                                si<idx?"bg-green-500":si===idx?"bg-sky-500 animate-pulse":"bg-navy-700"}`}
                                style={{fontSize:"8px",color:"white",fontWeight:"bold"}}>
                                {si<idx?"✓":si+1}
                              </div>
                              <div className={`text-center mt-1 leading-tight hidden sm:block`}
                                style={{
                                  fontSize:"9px",
                                  maxWidth:"48px",
                                  color:si===idx?"#38bdf8":si<idx?"#4ade80":"#334155"
                                }}>
                                {step}
                              </div>
                            </div>
                            {si<JOURNEY_STEPS.length-1 && (
                              <div className="flex-1 h-0.5 mx-0.5 mb-4"
                                style={{background:si<idx?"#22c55e":si===idx?"rgba(56,189,248,0.4)":"rgba(255,255,255,0.06)"}}/>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Look up another PNR */}
      <div className="bg-navy-800 rounded-2xl border border-navy-600 p-5">
        <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
          <Search className="w-4 h-4 text-sky-400"/>Track a Different Booking
        </h3>
        <div className="flex gap-3">
          <input value={pnr} onChange={e=>setPnr(e.target.value.toUpperCase())}
            placeholder="Enter PNR / Booking reference..."
            className="flex-1 bg-navy-700 border border-navy-600 focus:border-sky-500 rounded-xl px-4 py-3 text-sm text-white font-mono outline-none"/>
          <button className="px-5 py-3 rounded-xl font-semibold text-sm text-white transition-all"
            style={{background:"linear-gradient(135deg,#0ea5e9,#14b8a6)"}}>
            Track
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Enter the PNR from your ticket to track bags for that booking
        </p>
      </div>

      {/* Help */}
      <div className="p-4 rounded-xl text-sm"
        style={{background:"rgba(239,68,68,0.06)",border:"1px solid rgba(239,68,68,0.15)"}}>
        <div className="font-semibold text-red-300 mb-1">🧳 Lost or missing bag?</div>
        <div className="text-slate-400 text-xs space-y-1">
          <div>• Go to the Airline Lost & Found counter in the arrivals hall</div>
          <div>• Air India: 1800-180-1407 · IndiGo: 0124-617-3838</div>
          <div>• Airport Lost & Found: +91-11-2567-0010</div>
        </div>
      </div>
    </div>
  );
}

// ── Main export — routes by role ──────────────────────────────────────────────
export function BaggagePage() {
  const { user } = useAuthStore();
  return user?.role==="passenger" ? <PassengerBaggageView/> : <StaffBaggageView/>;
}
