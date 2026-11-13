import { useState } from "react";
import { useBoard } from "../../hooks/useBoard";
import { useAirport } from "../../hooks/useAirport";
import { Search, ChevronRight, Navigation,
         ArrowRight, ArrowUp, RotateCcw } from "lucide-react";

type TKey = "T1"|"T2"|"T3";

/* ── Zone definitions per terminal ─────────────────────────────────── */
const FLOOR_LAYOUTS: Record<TKey, {
  level: string; color: string;
  zones: {id:string;label:string;icon:string;x:number;y:number;w:number;h:number;color:string}[];
  paths: {from:string;to:string;via:string[]}[];
}[]> = {
  T1:[
    { level:"Ground — Arrivals", color:"#0ea5e9",
      zones:[
        {id:"entry",    label:"Airport Entry",  icon:"🚗",x:10, y:120,w:80, h:50, color:"#475569"},
        {id:"baggage",  label:"Baggage Claim",  icon:"🧳",x:120,y:70, w:160,h:80, color:"#0ea5e9"},
        {id:"arrivals", label:"Arrival Hall",   icon:"🚶",x:120,y:165,w:160,h:60, color:"#14b8a6"},
        {id:"taxi",     label:"Taxi / Metro",   icon:"🚖",x:300,y:120,w:100,h:60, color:"#f59e0b"},
        {id:"parking1", label:"Car Park P1",    icon:"🅿",x:420,y:100,w:80, h:80, color:"#6366f1"},
      ],
      paths:[
        {from:"entry",to:"baggage",   via:["Walk straight → 50m → Baggage Claim Hall","Take carousel matching your flight number"]},
        {from:"baggage",to:"taxi",    via:["Exit Baggage Hall through sliding doors","Turn RIGHT","Walk 80m to Taxi/Metro zone"]},
        {from:"entry",to:"arrivals",  via:["Walk straight past security exit","Follow green ARRIVAL signs"]},
      ]
    },
    { level:"Level 1 — Departures", color:"#0ea5e9",
      zones:[
        {id:"checkin",  label:"Check-in A–G",   icon:"🛂",x:20, y:60, w:200,h:80, color:"#0ea5e9"},
        {id:"security", label:"Security",        icon:"🔒",x:240,y:60, w:100,h:80, color:"#ef4444"},
        {id:"food1",    label:"Food Court",      icon:"🍽",x:360,y:60, w:100,h:80, color:"#22c55e"},
        {id:"retail1",  label:"Retail",          icon:"🛍",x:360,y:155,w:100,h:60, color:"#8b5cf6"},
        {id:"lift1",    label:"Lift → Level 2",  icon:"🔼",x:240,y:155,w:100,h:60, color:"#f59e0b"},
      ],
      paths:[
        {from:"checkin",to:"security",  via:["Complete check-in at counter","Collect boarding pass","Proceed RIGHT to Security lanes","Wait time: ~15 min"]},
        {from:"security",to:"food1",    via:["After security clearance","Walk straight ahead","Food Court is on your RIGHT"]},
        {from:"security",to:"lift1",    via:["After security clearance","Walk to central area","Take Lift or Escalator to Level 2 Gates"]},
      ]
    },
    { level:"Level 2 — Gates A1–A6", color:"#0ea5e9",
      zones:[
        {id:"gateA1",   label:"Gate A1–A3",      icon:"✈",x:20, y:80, w:140,h:100,color:"#0ea5e9"},
        {id:"gateA4",   label:"Gate A4–A6",      icon:"✈",x:180,y:80, w:140,h:100,color:"#14b8a6"},
        {id:"lounge1",  label:"IndiGo Lounge",   icon:"🛋",x:340,y:80, w:100,h:60, color:"#f59e0b"},
        {id:"pharmacy", label:"Pharmacy 24hr",   icon:"💊",x:340,y:155,w:100,h:55, color:"#22c55e"},
        {id:"lift2",    label:"Lift ← Level 1",  icon:"🔽",x:20, y:195,w:80, h:45, color:"#475569"},
      ],
      paths:[
        {from:"lift2",to:"gateA1",  via:["Exit lift at Level 2","Turn RIGHT","Gates A1–A3 are straight ahead on LEFT"]},
        {from:"lift2",to:"gateA4",  via:["Exit lift at Level 2","Walk straight past A1–A3","Gates A4–A6 are at the far end"]},
        {from:"lift2",to:"lounge1", via:["Exit lift at Level 2","Turn RIGHT","Walk to end of corridor","IndiGo Lounge on RIGHT"]},
      ]
    },
  ],
  T2:[
    { level:"Ground — Arrivals", color:"#14b8a6",
      zones:[
        {id:"t2entry",  label:"T2 Entry",        icon:"🚌",x:10, y:120,w:80, h:50, color:"#475569"},
        {id:"t2bag",    label:"Baggage Claim",   icon:"🧳",x:120,y:70, w:160,h:80, color:"#14b8a6"},
        {id:"t2arr",    label:"Arrival Hall",    icon:"🚶",x:120,y:165,w:160,h:60, color:"#0ea5e9"},
        {id:"t2bus",    label:"Bus Stop",         icon:"🚌",x:300,y:100,w:100,h:80, color:"#f59e0b"},
        {id:"t2park",   label:"Car Park P2",      icon:"🅿",x:420,y:100,w:80, h:80, color:"#6366f1"},
      ],
      paths:[
        {from:"t2entry",to:"t2bag",  via:["Enter T2 through main gate","Follow BLUE baggage signs","Baggage hall straight ahead — 30m"]},
        {from:"t2bag",to:"t2bus",    via:["Exit baggage area LEFT","Follow Bus/Transport signs","Bus stop is outside Gate 2"]},
      ]
    },
    { level:"Level 1 — Departures", color:"#14b8a6",
      zones:[
        {id:"t2chk",    label:"Check-in H–N",    icon:"🛂",x:20, y:60, w:200,h:80, color:"#14b8a6"},
        {id:"t2sec",    label:"Security",         icon:"🔒",x:240,y:60, w:100,h:80, color:"#ef4444"},
        {id:"t2fnb",    label:"Food & Bev",       icon:"🍽",x:360,y:60, w:100,h:80, color:"#22c55e"},
        {id:"t2ret",    label:"Retail",           icon:"🛍",x:360,y:155,w:100,h:60, color:"#8b5cf6"},
        {id:"t2lift",   label:"Lift → Level 2",  icon:"🔼",x:240,y:155,w:100,h:60, color:"#f59e0b"},
      ],
      paths:[
        {from:"t2chk",to:"t2sec",   via:["Complete check-in","Proceed to Security — straight ahead RIGHT","Wait ~10 min"]},
        {from:"t2sec",to:"t2lift",  via:["After security","Central area → Lift to Gates Level 2"]},
      ]
    },
    { level:"Level 2 — Gates B1–B5", color:"#14b8a6",
      zones:[
        {id:"gateB1",   label:"Gates B1–B3",      icon:"✈",x:20, y:80, w:160,h:100,color:"#14b8a6"},
        {id:"gateB4",   label:"Gates B4–B5",       icon:"✈",x:200,y:80, w:120,h:100,color:"#0ea5e9"},
        {id:"t2snack",  label:"Snack Bar",          icon:"☕",x:340,y:80, w:100,h:60, color:"#f59e0b"},
        {id:"t2smk",    label:"Smoking Zone",       icon:"🚬",x:340,y:155,w:100,h:55, color:"#6b7280"},
        {id:"t2liftB",  label:"Lift ← Level 1",    icon:"🔽",x:20, y:195,w:80, h:45, color:"#475569"},
      ],
      paths:[
        {from:"t2liftB",to:"gateB1", via:["Exit lift Level 2","Straight ahead LEFT → Gates B1–B3"]},
        {from:"t2liftB",to:"gateB4", via:["Exit lift Level 2","Walk straight to END → Gates B4–B5"]},
      ]
    },
  ],
  T3:[
    { level:"Ground — Arrivals Intl", color:"#8b5cf6",
      zones:[
        {id:"t3imm",    label:"Immigration",     icon:"🛂",x:20, y:60, w:130,h:80, color:"#ef4444"},
        {id:"t3bag",    label:"Baggage Claim",   icon:"🧳",x:170,y:60, w:140,h:80, color:"#8b5cf6"},
        {id:"t3cust",   label:"Customs",          icon:"⚖",x:330,y:60, w:100,h:80, color:"#f59e0b"},
        {id:"t3arr",    label:"Arrival Hall",     icon:"🚶",x:170,y:155,w:260,h:65, color:"#14b8a6"},
        {id:"t3metro",  label:"Metro Station",    icon:"🚇",x:20, y:180,w:120,h:55, color:"#6366f1"},
      ],
      paths:[
        {from:"t3imm",to:"t3bag",   via:["After immigration clearance","Walk STRAIGHT 100m","Baggage carousels 11–18 on LEFT"]},
        {from:"t3bag",to:"t3cust",  via:["Collect all bags","Proceed to Customs","Choose GREEN channel (nothing to declare) or RED"]},
        {from:"t3arr",to:"t3metro", via:["Exit arrival hall LEFT","Follow METRO signs","Escalator DOWN to metro — Platform for New Delhi/Airport Express"]},
      ]
    },
    { level:"Level 3 — Departures", color:"#8b5cf6",
      zones:[
        {id:"t3chk",    label:"Check-in O–Z",    icon:"🛂",x:20, y:50, w:200,h:85, color:"#8b5cf6"},
        {id:"t3sec",    label:"Security",          icon:"🔒",x:240,y:50, w:110,h:85, color:"#ef4444"},
        {id:"t3df",     label:"Duty Free",         icon:"🛍",x:370,y:50, w:100,h:85, color:"#f59e0b"},
        {id:"t3food",   label:"Food Court",        icon:"🍽",x:20, y:150,w:150,h:70, color:"#22c55e"},
        {id:"t3lift3",  label:"Lift → L4/L5",     icon:"🔼",x:240,y:150,w:110,h:70, color:"#475569"},
        {id:"t3atm",    label:"ATM & Currency",    icon:"💵",x:370,y:150,w:100,h:70, color:"#14b8a6"},
      ],
      paths:[
        {from:"t3chk",to:"t3sec",   via:["Complete check-in at T3 counters O–Z","Collect boarding pass","Walk RIGHT 80m → Security entrance","~20 min wait during peak hours"]},
        {from:"t3sec",to:"t3df",    via:["After security clearance","Walk STRAIGHT ahead","Duty Free World is immediately on your RIGHT","Show boarding pass for duty-free purchases"]},
        {from:"t3sec",to:"t3lift3", via:["After security clearance","Walk to CENTRAL area","Take Lift or Escalator UP to Level 4 (Lounges) or Level 5 (Gates)"]},
        {from:"t3sec",to:"t3food",  via:["After security clearance","Turn LEFT","Food Court: Punjab Grill, Starbucks, Subway — 50m ahead"]},
      ]
    },
    { level:"Level 4 — Lounges", color:"#8b5cf6",
      zones:[
        {id:"t3mah",    label:"Maharaja Lounge", icon:"👑",x:20, y:70, w:170,h:90, color:"#f59e0b"},
        {id:"t3gvk",    label:"GVK Lounge",       icon:"🛋",x:210,y:70, w:140,h:90, color:"#8b5cf6"},
        {id:"t3cross",  label:"Crossword Books",  icon:"📚",x:370,y:70, w:100,h:90, color:"#22c55e"},
        {id:"t3beauty", label:"Forest Essentials",icon:"💆",x:20, y:175,w:200,h:60, color:"#ec4899"},
        {id:"t3lift4",  label:"Lifts L3 ↔ L5",   icon:"🔄",x:240,y:175,w:110,h:60, color:"#475569"},
        {id:"t3pray",   label:"Prayer Room",      icon:"🕌",x:370,y:175,w:100,h:60, color:"#6366f1"},
      ],
      paths:[
        {from:"t3lift4",to:"t3mah",   via:["Exit lift Level 4","Turn LEFT","Maharaja Lounge is 30m ahead — show First/Business boarding pass"]},
        {from:"t3lift4",to:"t3gvk",   via:["Exit lift Level 4","Walk STRAIGHT","GVK Lounge on RIGHT — access with lounge pass or Priority Pass"]},
        {from:"t3lift4",to:"t3cross", via:["Exit lift Level 4","Turn RIGHT","Crossword Books at far end of Level 4"]},
      ]
    },
    { level:"Level 5 — Intl Gates", color:"#8b5cf6",
      zones:[
        {id:"gateC",    label:"Gates C1–C3",      icon:"✈",x:20, y:70, w:120,h:100,color:"#8b5cf6"},
        {id:"gateD",    label:"Gates D1–D3",       icon:"✈",x:160,y:70, w:120,h:100,color:"#6366f1"},
        {id:"gateE",    label:"Gates E1–E2",       icon:"✈",x:300,y:70, w:100,h:100,color:"#0ea5e9"},
        {id:"transit",  label:"Transit Lounge",    icon:"⏱",x:420,y:70, w:80, h:100,color:"#f59e0b"},
        {id:"t3liftG",  label:"Lift ← L3/L4",     icon:"🔽",x:20, y:185,w:80, h:50, color:"#475569"},
        {id:"t3toil",   label:"Toilets",            icon:"🚻",x:160,y:185,w:80, h:50, color:"#94a3b8"},
      ],
      paths:[
        {from:"t3liftG",to:"gateC",  via:["Exit lift Level 5","Turn RIGHT","Gates C1–C3 are immediately ahead — 20m"]},
        {from:"t3liftG",to:"gateD",  via:["Exit lift Level 5","Walk STRAIGHT 60m","Gates D1–D3 on LEFT"]},
        {from:"t3liftG",to:"gateE",  via:["Exit lift Level 5","Walk to FAR END of terminal","Gates E1–E2 for wide-body aircraft"]},
        {from:"t3liftG",to:"transit",via:["Exit lift Level 5","Turn FAR RIGHT","Transit Lounge for connecting passengers ONLY — have transit boarding pass ready"]},
      ]
    },
  ],
};

const DESTINATIONS: {label:string;icon:string;terminal:TKey;floor:number;zoneId:string;steps:string[]}[] = [
  {label:"Departure Gates",  icon:"✈", terminal:"T1",floor:2,zoneId:"gateA1",
   steps:["Enter terminal","Check-in at Level 1 counters","Clear Security (15–20 min)","Take Lift/Escalator UP to Level 2","Find your gate A1–A6"]},
  {label:"Security Check",   icon:"🔒",terminal:"T1",floor:1,zoneId:"security",
   steps:["Complete check-in first","Proceed RIGHT from check-in counters","Security lanes are clearly marked","Have boarding pass + ID ready"]},
  {label:"Food & Drinks",    icon:"🍽",terminal:"T3",floor:1,zoneId:"t3food",
   steps:["Clear Security at Level 3","Turn LEFT after security","Food Court 50m ahead","Punjab Grill • Starbucks • Subway"]},
  {label:"Duty Free T3",     icon:"🛍",terminal:"T3",floor:1,zoneId:"t3df",
   steps:["Clear Security at T3 Level 3","Walk STRAIGHT after security","Duty Free World immediately on RIGHT","Show boarding pass to shop"]},
  {label:"Baggage Claim",    icon:"🧳",terminal:"T3",floor:0,zoneId:"t3bag",
   steps:["Deboard aircraft → follow ARRIVAL signs","Proceed through Immigration (passport check)","Collect bags from carousel (check flight number)","Proceed to Customs — GREEN or RED channel"]},
  {label:"Metro Station",    icon:"🚇",terminal:"T3",floor:0,zoneId:"t3metro",
   steps:["Exit T3 Arrival Hall","Turn LEFT toward Metro signs","Escalator DOWN to underground station","Airport Express Line → New Delhi in 20 min","₹60 fare"]},
  {label:"Taxi & Pickup",    icon:"🚖",terminal:"T1",floor:0,zoneId:"taxi",
   steps:["Exit through Arrival gates","Follow TAXI / PRE-PAID signs","Pre-paid counter inside arrival hall","OLA/Uber pickup zone: Gate 3 outside"]},
  {label:"VIP Lounge T3",    icon:"👑",terminal:"T3",floor:3,zoneId:"t3mah",
   steps:["Clear Security at T3 Level 3","Take Lift UP to Level 4","Maharaja Lounge on LEFT (Air India First/Business)","GVK Lounge on RIGHT (Priority Pass accepted)"]},
  {label:"Prayer Room",      icon:"🕌",terminal:"T3",floor:3,zoneId:"t3pray",
   steps:["Clear Security at T3 Level 3","Take Lift UP to Level 4","Prayer Room at far RIGHT end of Level 4","Open 24 hours • All faiths welcome"]},
  {label:"Medical / Help",   icon:"💊",terminal:"T1",floor:2,zoneId:"pharmacy",
   steps:["Level 2 Gate area — T1","Pharmacy/Medical near Gate A6","For emergencies call: +91-11-2567-0001","Medical bay available Ground floor all terminals"]},
];

export function AirportMap() {
  const [activeT,   setActiveT]   = useState<TKey>("T3");
  const [activeF,   setActiveF]   = useState(1);
  const [hoveredZ,  setHoveredZ]  = useState<string|null>(null);
  const [search,    setSearch]    = useState("");
  const [directions,setDirections] = useState<typeof DESTINATIONS[0]|null>(null);
  const [selectedZ, setSelectedZ] = useState<string|null>(null);

  const { flights, live } = useBoard(); const ap = useAirport();
  const [fq, setFq] = useState("");
  const hits = fq.trim().length >= 2 ? flights.filter(f => f.flight.toLowerCase().includes(fq.trim().toLowerCase()) || f.to.toLowerCase().includes(fq.trim().toLowerCase())).slice(0, 5) : [];
  const gateNow = flights.filter(f => f.gate && ["Boarding", "Scheduled", "Delayed"].includes(f.status)).sort((a, b) => a.dep.localeCompare(b.dep)).slice(0, 8);
  const showFlight = (t: string) => { if (t === "T1" || t === "T2" || t === "T3") { setActiveT(t); setActiveF(t === "T3" ? 4 : 1); } };

  const terminal = FLOOR_LAYOUTS[activeT];
  const floor    = terminal[activeF] || terminal[0];

  const handleQuickFind = (dest: typeof DESTINATIONS[0]) => {
    setDirections(dest);
    setActiveT(dest.terminal);
    setActiveF(dest.floor);
    setSelectedZ(dest.zoneId);
    setHoveredZ(dest.zoneId);
  };

  const searchResults = search.length > 1
    ? DESTINATIONS.filter(d=>
        d.label.toLowerCase().includes(search.toLowerCase())||
        d.steps.some(s=>s.toLowerCase().includes(search.toLowerCase()))
      )
    : [];

  const tColor = {T1:"#0ea5e9",T2:"#14b8a6",T3:"#8b5cf6"};

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-white">Airport Wayfinding Map</h1>
        <p className="text-slate-400 text-sm">{ap.name} ({ap.code}) — live gate finder and step-by-step directions. Floor plans below are the Delhi (DEL) terminals.</p>
      </div>

      <div className="bg-navy-800 border border-navy-600 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2"><div className="text-sm font-semibold text-white">Find your flight</div><div className="text-[11px] text-slate-500">{live ? "Live board" : "Demo board"}</div></div>
        <input value={fq} onChange={e => setFq(e.target.value)} placeholder="Flight number or destination, e.g. AI-101 or BOM" aria-label="Find your flight" className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-sm text-white" />
        {hits.length > 0 && <ul className="mt-2 space-y-1">{hits.map(f => <li key={f.id}><button onClick={() => showFlight(f.terminal)} className="w-full text-left text-sm bg-navy-900 hover:bg-navy-700 rounded-lg px-3 py-2 text-slate-200"><span className="font-mono text-white">{f.flight}</span> → {f.to} · departs {f.dep} · <span className="text-sky-300">Gate {f.gate || "TBA"}, {f.terminal}</span> · {f.status}</button></li>)}</ul>}
        {fq.trim().length >= 2 && hits.length === 0 && <div className="mt-2 text-xs text-slate-500">No matching flight today.</div>}
        {gateNow.length > 0 && <div className="mt-3 flex gap-2 overflow-x-auto pb-1">{gateNow.map(f => <div key={f.id} className="shrink-0 text-xs bg-navy-900 border border-navy-600 rounded-lg px-3 py-2"><div className="text-sky-300 font-semibold">Gate {f.gate}</div><div className="text-slate-300">{f.flight} · {f.dep}</div><div className="text-slate-500">{f.status}</div></div>)}</div>}
      </div>

      {/* Search */}
      <div className="relative">
        <div className="flex items-center gap-3 bg-navy-800 border border-navy-600
          focus-within:border-sky-500 rounded-2xl px-4 py-4 transition-colors">
          <Search className="w-5 h-5 text-slate-400"/>
          <input
            className="bg-transparent text-white placeholder-slate-400 outline-none w-full text-base"
            placeholder="Where do you want to go? (gate, lounge, food, metro, duty free...)"
            value={search} onChange={e=>setSearch(e.target.value)}/>
          {search && <button onClick={()=>setSearch("")} className="text-slate-500 hover:text-white text-xl">×</button>}
        </div>
        {searchResults.length>0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-navy-700 border border-navy-600 rounded-2xl overflow-hidden z-20 shadow-2xl">
            {searchResults.map((d,i)=>(
              <button key={i} onClick={()=>{handleQuickFind(d);setSearch("");}}
                className="w-full flex items-center gap-4 px-4 py-4 hover:bg-navy-600 border-b border-navy-700/50 last:border-0 text-left">
                <div className="text-3xl">{d.icon}</div>
                <div>
                  <div className="text-sm font-bold text-white">{d.label}</div>
                  <div className="text-xs text-slate-400">{d.terminal} • {d.steps[0]}</div>
                </div>
                <Navigation className="w-5 h-5 text-sky-400 ml-auto"/>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Directions panel */}
      {directions && (
        <div className="bg-navy-800 rounded-2xl border border-sky-500/30 p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="text-3xl">{directions.icon}</div>
              <div>
                <h2 className="font-bold text-white text-lg">How to reach: {directions.label}</h2>
                <div className="text-xs text-slate-400">{directions.terminal} — Floor {directions.floor}</div>
              </div>
            </div>
            <button onClick={()=>{setDirections(null);setSelectedZ(null);setHoveredZ(null);}}
              className="text-slate-500 hover:text-white text-2xl leading-none">×</button>
          </div>
          <div className="space-y-2">
            {directions.steps.map((step,i)=>(
              <div key={i} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400 text-xs font-bold flex-shrink-0 mt-0.5">
                  {i+1}
                </div>
                <div className="flex-1 pt-1">
                  <div className="text-sm text-slate-200 leading-relaxed">{step}</div>
                  {i < directions.steps.length-1 && (
                    <div className="flex items-center gap-1 text-sky-500/40 mt-1">
                      <ArrowUp className="w-3 h-3"/>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
            <div className="text-xs text-green-400 flex items-center gap-2">
              <span className="text-base">✅</span>
              You can now see the highlighted zone on the map below
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Map */}
        <div className="xl:col-span-2 space-y-3">
          {/* Terminal tabs */}
          <div className="grid grid-cols-3 gap-2">
            {(["T1","T2","T3"] as TKey[]).map(t=>(
              <button key={t} onClick={()=>{setActiveT(t);setActiveF(0);setSelectedZ(null);setHoveredZ(null);setDirections(null);}}
                className={`p-3.5 rounded-xl border transition-all text-left`}
                style={activeT===t
                  ?{background:tColor[t]+"20",borderColor:tColor[t]+"60"}
                  :{background:"#0f1629",borderColor:"#1e2d4d"}}>
                <div className="font-bold text-xl" style={activeT===t?{color:tColor[t]}:{color:"#94a3b8"}}>{t}</div>
                <div className="text-xs text-slate-300 font-medium mt-0.5">
                  {t==="T1"?"Terminal 1":t==="T2"?"Terminal 2":"Terminal 3"}
                </div>
                <div className="text-xs text-slate-500">
                  {t==="T3"?"International":"Domestic"}
                </div>
              </button>
            ))}
          </div>

          {/* Floor tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {terminal.map((f,i)=>(
              <button key={i} onClick={()=>{setActiveF(i);setSelectedZ(null);setHoveredZ(null);}}
                className="flex-shrink-0 px-4 py-2.5 rounded-xl border text-sm transition-all"
                style={activeF===i
                  ?{background:tColor[activeT]+"20",borderColor:tColor[activeT]+"60",color:tColor[activeT]}
                  :{background:"#0f1629",borderColor:"#1e2d4d",color:"#94a3b8"}}>
                <div className="font-bold text-xs">{f.level.split("—")[0].trim()}</div>
                <div className="text-xs opacity-70">{f.level.split("—")[1]?.trim()}</div>
              </button>
            ))}
          </div>

          {/* SVG Floor Map */}
          <div className="bg-navy-900 rounded-2xl border overflow-hidden"
            style={{borderColor:tColor[activeT]+"40"}}>
            <div className="px-5 py-3 border-b flex items-center justify-between"
              style={{borderColor:tColor[activeT]+"30",background:tColor[activeT]+"10"}}>
              <div>
                <span className="font-bold text-white">{activeT} — {floor.level}</span>
                {selectedZ && <span className="ml-3 text-xs text-sky-400 animate-pulse">● Destination highlighted</span>}
              </div>
              {selectedZ && (
                <button onClick={()=>{setSelectedZ(null);setHoveredZ(null);}}
                  className="text-xs flex items-center gap-1 text-slate-400 hover:text-white">
                  <RotateCcw className="w-3 h-3"/>Clear
                </button>
              )}
            </div>

            <svg viewBox="0 0 520 260" className="w-full" style={{background:"#060b18",minHeight:"200px"}}>
              {/* Grid lines */}
              {[130,260,390].map(x=>(
                <line key={x} x1={x} y1="0" x2={x} y2="260" stroke="#0f1629" strokeWidth="1"/>
              ))}
              {[65,130,195].map(y=>(
                <line key={y} x1="0" y1={y} x2="520" y2={y} stroke="#0f1629" strokeWidth="1"/>
              ))}

              {/* Terminal outline */}
              <rect x="5" y="5" width="510" height="250" rx="12"
                fill="none" stroke={tColor[activeT]} strokeWidth="1.5" opacity="0.4"/>

              {/* Floor label */}
              <text x="260" y="22" fill={tColor[activeT]} fontSize="10"
                textAnchor="middle" fontFamily="monospace" opacity="0.6">
                {activeT} — {floor.level}
              </text>

              {/* Zones */}
              {floor.zones.map(z=>{
                const isSelected = selectedZ===z.id || hoveredZ===z.id;
                const isTarget   = selectedZ===z.id;
                return (
                  <g key={z.id}
                    onClick={()=>{ setSelectedZ(z.id); setHoveredZ(z.id); }}
                    onMouseEnter={()=>setHoveredZ(z.id)}
                    onMouseLeave={()=>{ if(selectedZ!==z.id) setHoveredZ(null); }}
                    style={{cursor:"pointer"}}>
                    <rect
                      x={z.x} y={z.y} width={z.w} height={z.h}
                      rx="8"
                      fill={isTarget?z.color+"40":isSelected?z.color+"25":z.color+"12"}
                      stroke={z.color}
                      strokeWidth={isTarget?2.5:isSelected?2:1}
                      opacity={isTarget?1:0.85}
                    />
                    {isTarget && (
                      <rect x={z.x-3} y={z.y-3} width={z.w+6} height={z.h+6} rx="10"
                        fill="none" stroke={z.color} strokeWidth="1.5" strokeDasharray="6,3" opacity="0.6">
                        <animate attributeName="stroke-dashoffset" values="0;-18" dur="1s" repeatCount="indefinite"/>
                      </rect>
                    )}
                    {/* Icon */}
                    <text x={z.x+z.w/2} y={z.y+z.h/2-8} fontSize="18"
                      textAnchor="middle" dominantBaseline="middle">{z.icon}</text>
                    {/* Label */}
                    <text x={z.x+z.w/2} y={z.y+z.h/2+12} fill={isSelected?z.color:"white"}
                      fontSize="8.5" textAnchor="middle" fontFamily="sans-serif" fontWeight={isSelected?"bold":"normal"}>
                      {z.label}
                    </text>
                    {isTarget && (
                      <text x={z.x+z.w/2} y={z.y+z.h/2+24} fill={z.color}
                        fontSize="7" textAnchor="middle" fontFamily="monospace">
                        ← YOU ARE GOING HERE →
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Path arrows between connected zones */}
              {hoveredZ && floor.paths?.filter(p=>p.from===hoveredZ||p.to===hoveredZ).map((path,pi)=>{
                const fromZ = floor.zones.find(z=>z.id===path.from);
                const toZ   = floor.zones.find(z=>z.id===path.to);
                if(!fromZ||!toZ) return null;
                const x1 = fromZ.x + fromZ.w/2;
                const y1 = fromZ.y + fromZ.h/2;
                const x2 = toZ.x + toZ.w/2;
                const y2 = toZ.y + toZ.h/2;
                return (
                  <line key={pi} x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="5,4"
                    markerEnd="url(#arrow)" opacity="0.7"/>
                );
              })}

              {/* Arrow marker */}
              <defs>
                <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L8,3 z" fill="#38bdf8"/>
                </marker>
              </defs>

              {/* Compass */}
              <text x="495" y="248" fill="#1e2d4d" fontSize="9" textAnchor="middle" fontFamily="monospace">N↑</text>
            </svg>

            {/* Zone detail on click */}
            {hoveredZ && (()=>{
              const z = floor.zones.find(z=>z.id===hoveredZ);
              const paths = floor.paths?.filter(p=>p.from===hoveredZ);
              if(!z) return null;
              return (
                <div className="px-5 py-4 border-t" style={{borderColor:tColor[activeT]+"30"}}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{z.icon}</span>
                    <div>
                      <div className="font-bold text-white">{z.label}</div>
                      <div className="text-xs text-slate-400">{activeT} • {floor.level}</div>
                    </div>
                    {selectedZ===z.id && (
                      <span className="ml-auto text-xs bg-sky-500/20 text-sky-400 px-3 py-1 rounded-full border border-sky-500/30">
                        📍 Destination
                      </span>
                    )}
                  </div>
                  {paths && paths.length>0 && (
                    <div>
                      <div className="text-xs text-slate-500 mb-2 uppercase tracking-wider">Paths from here:</div>
                      <div className="space-y-2">
                        {paths.slice(0,2).map((p,i)=>{
                          const dest = floor.zones.find(z=>z.id===p.to);
                          return (
                            <button key={i} onClick={()=>{setSelectedZ(p.to);setHoveredZ(p.to);}}
                              className="w-full flex items-start gap-3 p-3 bg-navy-700/50 rounded-xl hover:bg-navy-700 transition-colors text-left">
                              <ArrowRight className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5"/>
                              <div>
                                <div className="text-sm font-medium text-white">
                                  → {dest?.icon} {dest?.label}
                                </div>
                                <div className="text-xs text-slate-400 mt-0.5">{p.via[0]}</div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          {/* Quick Find */}
          <div className="bg-navy-800 rounded-2xl border border-navy-600 overflow-hidden">
            <div className="p-4 border-b border-navy-600">
              <h2 className="font-semibold text-white">Quick Navigation</h2>
              <p className="text-xs text-slate-400 mt-0.5">Tap to get step-by-step directions</p>
            </div>
            <div className="divide-y divide-navy-700">
              {DESTINATIONS.map((d,i)=>(
                <button key={i} onClick={()=>handleQuickFind(d)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 transition-all text-left group ${
                    directions?.label===d.label?"bg-sky-500/10":"hover:bg-navy-700"}`}>
                  <span className="text-xl flex-shrink-0">{d.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium transition-colors ${
                      directions?.label===d.label?"text-sky-300":"text-white group-hover:text-sky-300"}`}>
                      {d.label}
                    </div>
                    <div className="text-xs text-slate-500">{d.terminal} • {d.steps.length} steps</div>
                  </div>
                  <ChevronRight className={`w-4 h-4 flex-shrink-0 transition-colors ${
                    directions?.label===d.label?"text-sky-400":"text-slate-600 group-hover:text-sky-400"}`}/>
                </button>
              ))}
            </div>
          </div>

          {/* Inter-terminal */}
          <div className="bg-navy-800 rounded-2xl border border-navy-600 p-4">
            <h2 className="font-semibold text-white mb-3">Inter-Terminal Transport</h2>
            <div className="space-y-2">
              {[
                {route:"T1/T2 → T3",  mode:"Free Bus 🚌",  time:"15 min",   freq:"Every 20 min"},
                {route:"T3 → T1/T2",  mode:"Free Bus 🚌",  time:"15 min",   freq:"Every 20 min"},
                {route:"Any → Delhi", mode:"Metro 🚇",      time:"20 min",   freq:"Every 10 min"},
                {route:"Any → City",  mode:"Taxi/OLA 🚖",   time:"30–60 min",freq:"On demand"},
              ].map(({route,mode,time,freq})=>(
                <div key={route} className="p-3 bg-navy-700/50 rounded-xl">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-xs text-slate-400">{route}</div>
                      <div className="text-sm font-medium text-white">{mode}</div>
                      <div className="text-xs text-slate-500">{freq}</div>
                    </div>
                    <div className="text-sm font-mono font-bold text-sky-300">{time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Emergency */}
          <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4">
            <h2 className="font-semibold text-white mb-2">Emergency & Help</h2>
            {[
              ["Airport Control","+91-11-2567-0000"],
              ["Medical","+91-11-2567-0001"],
              ["Lost & Found","+91-11-2567-0010"],
              ["Customer Care","1800-180-1407"],
            ].map(([l,n])=>(
              <div key={l} className="flex justify-between text-xs py-1.5 border-b border-red-500/10 last:border-0">
                <span className="text-slate-400">{l}</span>
                <span className="font-mono text-sky-300">{n}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
