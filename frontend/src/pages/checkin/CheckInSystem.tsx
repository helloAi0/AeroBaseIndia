import { useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { DataTable } from "../../components/ui/DataTable";
import {
  Users, CheckCircle, Clock, AlertTriangle, Search,
  Phone, MessageSquare, Activity
} from "lucide-react";

const AIRLINE_CODE_MAP: Record<string,string> = {
  airline_AI:"AI", airline_6E:"6E", airline_UK:"UK", airline_EK:"EK",
  airline_SG:"SG", airline_QP:"QP", airline_IX:"IX",
  pilot_captain_AI:"AI", pilot_captain_6E:"6E",
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

// All flights per airline
const CHECKIN_FLIGHTS: Record<string, {
  id:string; flight:string; from:string; to:string;
  dep:string; gate:string; terminal:string; status:string;
  pax:{id:string;name:string;seat:string;class:string;bags:number;
       checkin:boolean;boarded:boolean;wristband:string;special:string|null;
       phone:string}[];
}[]> = {
  AI:[
    {id:"F1",flight:"AI-101",from:"DEL",to:"BOM",dep:"10:30",gate:"A1",terminal:"T3",status:"Boarding",pax:[
      {id:"P001",name:"Rohit Sharma",    seat:"12A",class:"Business",bags:2,checkin:true, boarded:true, wristband:"WB-001",special:null,         phone:"+91-9810001001"},
      {id:"P002",name:"Priya Nair",      seat:"14B",class:"Economy", bags:1,checkin:true, boarded:false,wristband:"WB-002",special:"Wheelchair",  phone:"+91-9810001002"},
      {id:"P003",name:"Amit Verma",      seat:"22C",class:"Economy", bags:1,checkin:true, boarded:true, wristband:"WB-003",special:null,         phone:"+91-9810001003"},
      {id:"P004",name:"Sunita Kapoor",   seat:"5D", class:"Business",bags:3,checkin:false,boarded:false,wristband:"—",     special:null,         phone:"+91-9810001004"},
      {id:"P005",name:"Kiran Patel",     seat:"31E",class:"Economy", bags:2,checkin:false,boarded:false,wristband:"—",     special:"Infant",     phone:"+91-9810001005"},
    ]},
    {id:"F2",flight:"AI-202",from:"DEL",to:"BLR",dep:"14:00",gate:"A2",terminal:"T3",status:"Scheduled",pax:[
      {id:"P006",name:"Vikram Singh",    seat:"8A", class:"Business",bags:2,checkin:true, boarded:false,wristband:"WB-006",special:null,         phone:"+91-9810001006"},
      {id:"P007",name:"Meera Reddy",     seat:"15C",class:"Economy", bags:1,checkin:true, boarded:false,wristband:"WB-007",special:null,         phone:"+91-9810001007"},
      {id:"P008",name:"Arjun Mehta",     seat:"24D",class:"Economy", bags:2,checkin:false,boarded:false,wristband:"—",     special:null,         phone:"+91-9810001008"},
    ]},
    {id:"F3",flight:"AI-819",from:"DEL",to:"LHR",dep:"13:45",gate:"E1",terminal:"T3",status:"Boarding",pax:[
      {id:"P009",name:"Anjali Sharma",   seat:"2A", class:"Business",bags:3,checkin:true, boarded:true, wristband:"WB-009",special:"VVIP",       phone:"+91-9810001009"},
      {id:"P010",name:"Deepak Gupta",    seat:"10B",class:"Economy", bags:2,checkin:true, boarded:true, wristband:"WB-010",special:null,         phone:"+91-9810001010"},
      {id:"P011",name:"Ritu Agarwal",    seat:"18F",class:"Economy", bags:1,checkin:false,boarded:false,wristband:"—",     special:"Unaccomp. Minor",phone:"+91-9810001011"},
      {id:"P012",name:"Suresh Kumar",    seat:"25E",class:"Economy", bags:2,checkin:true, boarded:false,wristband:"WB-012",special:null,         phone:"+91-9810001012"},
    ]},
  ],
  "6E":[
    {id:"F4",flight:"6E-2341",from:"DEL",to:"BLR",dep:"11:00",gate:"B1",terminal:"T2",status:"Boarding",pax:[
      {id:"P013",name:"Neha Joshi",      seat:"3A", class:"Business",bags:2,checkin:true, boarded:true, wristband:"WB-013",special:null,         phone:"+91-9820001001"},
      {id:"P014",name:"Raj Malhotra",    seat:"11C",class:"Economy", bags:1,checkin:true, boarded:false,wristband:"WB-014",special:null,         phone:"+91-9820001002"},
      {id:"P015",name:"Pooja Singh",     seat:"19D",class:"Economy", bags:2,checkin:false,boarded:false,wristband:"—",     special:"Wheelchair", phone:"+91-9820001003"},
      {id:"P016",name:"Arun Kumar",      seat:"26B",class:"Economy", bags:1,checkin:false,boarded:false,wristband:"—",     special:null,         phone:"+91-9820001004"},
    ]},
    {id:"F5",flight:"6E-501",from:"DEL",to:"HYD",dep:"12:30",gate:"B2",terminal:"T2",status:"Scheduled",pax:[
      {id:"P017",name:"Kavita Rao",      seat:"6A", class:"Business",bags:2,checkin:true, boarded:false,wristband:"WB-017",special:null,         phone:"+91-9820001005"},
      {id:"P018",name:"Manish Tiwari",   seat:"14E",class:"Economy", bags:1,checkin:true, boarded:false,wristband:"WB-018",special:null,         phone:"+91-9820001006"},
      {id:"P019",name:"Sana Shaikh",     seat:"22F",class:"Economy", bags:2,checkin:false,boarded:false,wristband:"—",     special:null,         phone:"+91-9820001007"},
    ]},
    {id:"F6",flight:"6E-5317",from:"BLR",to:"DEL",dep:"12:30",gate:"B5",terminal:"T2",status:"Boarding",pax:[
      {id:"P020",name:"Rahul Das",       seat:"4B", class:"Economy", bags:1,checkin:true, boarded:true, wristband:"WB-020",special:null,         phone:"+91-9820001008"},
      {id:"P021",name:"Sneha Patil",     seat:"12A",class:"Economy", bags:2,checkin:true, boarded:false,wristband:"WB-021",special:null,         phone:"+91-9820001009"},
    ]},
  ],
  UK:[
    {id:"F7",flight:"UK-925",from:"DEL",to:"HYD",dep:"09:45",gate:"C1",terminal:"T3",status:"Delayed",pax:[
      {id:"P022",name:"Aisha Kapoor",    seat:"1A", class:"Business",bags:3,checkin:true, boarded:false,wristband:"WB-022",special:"VVIP",       phone:"+91-9830001001"},
      {id:"P023",name:"Sanjay Menon",    seat:"9C", class:"Economy", bags:1,checkin:true, boarded:false,wristband:"WB-023",special:null,         phone:"+91-9830001002"},
      {id:"P024",name:"Divya Krishnan",  seat:"17D",class:"Economy", bags:2,checkin:false,boarded:false,wristband:"—",     special:null,         phone:"+91-9830001003"},
    ]},
    {id:"F8",flight:"UK-202",from:"DEL",to:"GOI",dep:"18:30",gate:"C2",terminal:"T2",status:"Scheduled",pax:[
      {id:"P025",name:"Karthik Nair",    seat:"5B", class:"Business",bags:2,checkin:true, boarded:false,wristband:"WB-025",special:null,         phone:"+91-9830001004"},
      {id:"P026",name:"Lakshmi Iyer",    seat:"13F",class:"Economy", bags:1,checkin:false,boarded:false,wristband:"—",     special:null,         phone:"+91-9830001005"},
    ]},
  ],
  EK:[
    {id:"F9",flight:"EK-511",from:"DEL",to:"DXB",dep:"16:00",gate:"E1",terminal:"T3",status:"Scheduled",pax:[
      {id:"P027",name:"Rajan Pillai",    seat:"1K", class:"First",   bags:4,checkin:true, boarded:false,wristband:"WB-027",special:"VVIP",       phone:"+91-9840001001"},
      {id:"P028",name:"Fatima Al-Rashid",seat:"4A", class:"Business",bags:2,checkin:true, boarded:false,wristband:"WB-028",special:null,         phone:"+91-9840001002"},
      {id:"P029",name:"Michael Stevens", seat:"24C",class:"Economy", bags:1,checkin:true, boarded:false,wristband:"WB-029",special:null,         phone:"+971-501001001"},
      {id:"P030",name:"Yasmin Hasan",    seat:"38E",class:"Economy", bags:2,checkin:false,boarded:false,wristband:"—",     special:null,         phone:"+971-501001002"},
    ]},
  ],
  SG:[
    {id:"F10",flight:"SG-3405",from:"DEL",to:"CCU",dep:"08:30",gate:"A4",terminal:"T1",status:"Departed",pax:[
      {id:"P031",name:"Anuj Sharma",     seat:"7A", class:"Economy", bags:1,checkin:true, boarded:true, wristband:"WB-031",special:null,         phone:"+91-9850001001"},
      {id:"P032",name:"Priti Gupta",     seat:"15B",class:"Economy", bags:2,checkin:true, boarded:true, wristband:"WB-032",special:null,         phone:"+91-9850001002"},
      {id:"P033",name:"Mohit Khanna",    seat:"22D",class:"Economy", bags:1,checkin:true, boarded:false,wristband:"WB-033",special:"Wheelchair", phone:"+91-9850001003"},
    ]},
    {id:"F11",flight:"SG-2801",from:"DEL",to:"MAA",dep:"17:00",gate:"A5",terminal:"T1",status:"Scheduled",pax:[
      {id:"P034",name:"Kavya Reddy",     seat:"4C", class:"Economy", bags:2,checkin:true, boarded:false,wristband:"WB-034",special:null,         phone:"+91-9850001004"},
      {id:"P035",name:"Ravi Shankar",    seat:"12A",class:"Economy", bags:1,checkin:false,boarded:false,wristband:"—",     special:null,         phone:"+91-9850001005"},
    ]},
  ],
  QP:[
    {id:"F12",flight:"QP-1401",from:"DEL",to:"JAI",dep:"15:30",gate:"B5",terminal:"T1",status:"Scheduled",pax:[
      {id:"P036",name:"Harsh Vardhan",   seat:"2A", class:"Business",bags:2,checkin:true, boarded:false,wristband:"WB-036",special:null,         phone:"+91-9860001001"},
      {id:"P037",name:"Nisha Agarwal",   seat:"10C",class:"Economy", bags:1,checkin:true, boarded:false,wristband:"WB-037",special:null,         phone:"+91-9860001002"},
      {id:"P038",name:"Tarun Khanna",    seat:"18D",class:"Economy", bags:2,checkin:false,boarded:false,wristband:"—",     special:null,         phone:"+91-9860001003"},
    ]},
  ],
  IX:[
    {id:"F13",flight:"IX-611",from:"DEL",to:"COK",dep:"14:00",gate:"D1",terminal:"T2",status:"Scheduled",pax:[
      {id:"P039",name:"Sreeraj Thomas",  seat:"5A", class:"Economy", bags:2,checkin:true, boarded:false,wristband:"WB-039",special:null,         phone:"+91-9870001001"},
      {id:"P040",name:"Mary Jose",       seat:"13B",class:"Economy", bags:1,checkin:false,boarded:false,wristband:"—",     special:null,         phone:"+91-9870001002"},
      {id:"P041",name:"Binu Varghese",   seat:"21C",class:"Economy", bags:1,checkin:false,boarded:false,wristband:"—",     special:"Infant",     phone:"+91-9870001003"},
    ]},
  ],
};

// Airport admin sees all (merged)
const ALL_FLIGHTS = Object.values(CHECKIN_FLIGHTS).flat();

const STATUS_BADGE: Record<string,string> = {
  Boarding:"bg-teal-500/15 text-teal-400 border-teal-500/20",
  Scheduled:"bg-sky-500/15 text-sky-400 border-sky-500/20",
  Delayed:"bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  Departed:"bg-green-500/15 text-green-400 border-green-500/20",
  Landed:"bg-green-600/15 text-green-300 border-green-600/20",
};

type Pax = typeof ALL_FLIGHTS[0]["pax"][0];
type Flight = typeof ALL_FLIGHTS[0];

export function CheckInSystem() {
  const { user } = useAuthStore();
  const [tab,      setTab]    = useState<"flights"|"tracker"|"alerts">("flights");
  const [search,   setSearch] = useState("");
  const [selPax,   setSelPax] = useState<Pax|null>(null);
  const [selFlight,setSFlight]= useState<string|null>(null);

  const sl          = user?.staffLevel||"";
  const airCode     = AIRLINE_CODE_MAP[sl]||null;
  const isAirline   = airCode!==null && user?.role!=="airport_admin" && user?.role!=="superadmin";
  const color       = isAirline ? (AIRLINE_COLORS[airCode!]||"#0ea5e9") : "#0ea5e9";
  const alName      = isAirline ? (AIRLINE_NAMES[airCode!]||"") : "";

  const flights: Flight[] = isAirline
    ? (CHECKIN_FLIGHTS[airCode!]||[])
    : ALL_FLIGHTS;

  const allPax   = flights.flatMap(f=>f.pax);
  const checkedIn= allPax.filter(p=>p.checkin).length;
  const boarded  = allPax.filter(p=>p.boarded).length;
  const pending  = allPax.filter(p=>!p.checkin).length;
  const wbActive = allPax.filter(p=>p.wristband!=="—").length;
  const alerts   = flights.filter(f=>f.status==="Boarding"&&f.pax.some(p=>!p.checkin)).length
    + allPax.filter(p=>p.special).length;

  const filtPax  = allPax.filter(p=>
    !search||p.name.toLowerCase().includes(search.toLowerCase())||
    p.wristband.toLowerCase().includes(search.toLowerCase())||
    p.seat.toLowerCase().includes(search.toLowerCase())
  );


  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {isAirline ? `${alName} Check-in & Boarding` : "Check-in & Passenger Tracking"}
          </h1>
          <p className="text-slate-400 text-sm">
            {isAirline
              ? `${airCode} · Your airline's flights only · Real-time boarding status`
              : "All flights · Real-time passenger status · Wristband tracking"}
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl border"
          style={{background:"rgba(34,197,94,0.06)",borderColor:"rgba(34,197,94,0.2)"}}>
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"/>
          <span className="text-xs text-green-400 font-bold">Live · Updated just now</span>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-6 gap-3">
        {[
          {l:"Total Flights",  v:flights.length,  c:color,      icon:<Activity className="w-4 h-4"/>},
          {l:"Total Pax",      v:allPax.length,   c:"#0ea5e9",  icon:<Users className="w-4 h-4"/>},
          {l:"Checked In",     v:checkedIn,        c:"#22c55e",  icon:<CheckCircle className="w-4 h-4"/>},
          {l:"Boarded",        v:boarded,          c:"#14b8a6",  icon:<CheckCircle className="w-4 h-4"/>},
          {l:"Pending",        v:pending,          c:pending>0?"#f59e0b":"#22c55e", icon:<Clock className="w-4 h-4"/>},
          {l:"Alerts",         v:alerts,           c:alerts>0?"#ef4444":"#22c55e",  icon:<AlertTriangle className="w-4 h-4"/>},
        ].map(({l,v,c,icon})=>(
          <div key={l} className="rounded-2xl p-4 border"
            style={{background:`${c}08`,borderColor:`${c}20`}}>
            <div className="mb-1.5" style={{color:c}}>{icon}</div>
            <div className="text-2xl font-black mb-0.5" style={{color:c}}>{v}</div>
            <div className="text-xs text-slate-500">{l}</div>
          </div>
        ))}
      </div>

      {/* Alerts banner */}
      {alerts>0 && (
        <div className="p-4 rounded-2xl border flex items-center justify-between"
          style={{background:"rgba(239,68,68,0.07)",borderColor:"rgba(239,68,68,0.3)"}}>
          <div>
            <div className="font-bold text-red-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4"/>{alerts} urgent alert{alerts!==1?"s":""}
            </div>
            <div className="text-xs text-red-400 mt-0.5">
              {flights.filter(f=>f.status==="Boarding"&&f.pax.some(p=>!p.checkin)).length} boarding flights with unchecked passengers ·
              {" "}{allPax.filter(p=>p.special).length} special assistance required
            </div>
          </div>
          <button onClick={()=>setTab("alerts")}
            className="text-xs px-4 py-2 rounded-xl font-bold text-red-300 border border-red-500/30"
            style={{background:"rgba(239,68,68,0.15)"}}>
            View Alerts →
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-2xl"
        style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)"}}>
        {[
          {k:"flights", l:`✈ ${isAirline?alName+" ":""}Flights (${flights.length})`},
          {k:"tracker", l:`📍 Passenger Tracker (${filtPax.length})`},
          {k:"alerts",  l:`⚠️ Alerts (${alerts})`},
        ].map(({k,l})=>(
          <button key={k} onClick={()=>setTab(k as any)}
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all"
            style={tab===k?{background:`linear-gradient(135deg,${color},${color}bb)`,color:"white"}:{color:"#64748b"}}>
            {l}
          </button>
        ))}
      </div>

      {/* ══ FLIGHTS TAB ══ */}
      {tab==="flights" && (
        <div className="space-y-4">
          {/* Overall progress */}
          <div className="bg-navy-800 rounded-2xl p-5 border border-navy-600">
            <div className="flex justify-between mb-3">
              <div className="font-bold text-white">Overall Check-in Progress</div>
              <div className="font-black text-2xl" style={{color}}>
                {allPax.length>0?Math.round(checkedIn/allPax.length*100):0}%
              </div>
            </div>
            <div className="h-3 rounded-full overflow-hidden mb-2" style={{background:"#1e2d4d"}}>
              <div className="h-full rounded-full transition-all" style={{
                width:`${allPax.length>0?(checkedIn/allPax.length*100):0}%`,
                background:`linear-gradient(90deg,${color},${color}cc)`
              }}/>
            </div>
            <div className="flex justify-between text-xs text-slate-400">
              <span>{checkedIn} checked in</span>
              <span>{boarded} boarded</span>
              <span>{pending} pending</span>
              <span>{wbActive} wristbands active</span>
            </div>
          </div>

          {/* Flight cards */}
          <div className="grid xl:grid-cols-2 gap-4">
            {flights.map(f=>{
              const fc    = isAirline ? color : "#0ea5e9";
              const fpax  = f.pax;
              const fChk  = fpax.filter(p=>p.checkin).length;
              const fBrd  = fpax.filter(p=>p.boarded).length;
              const fPend = fpax.filter(p=>!p.checkin).length;
              const pct   = fpax.length>0?Math.round(fChk/fpax.length*100):0;
              const hasIssue = f.status==="Boarding"&&fPend>0;
              return (
                <div key={f.id}
                  onClick={()=>setSFlight(selFlight===f.id?null:f.id)}
                  className="rounded-2xl p-5 border cursor-pointer transition-all hover:scale-[1.01]"
                  style={{
                    background:hasIssue?"rgba(239,68,68,0.05)":
                      selFlight===f.id?`${fc}08`:"rgba(255,255,255,0.02)",
                    borderColor:hasIssue?"rgba(239,68,68,0.3)":
                      selFlight===f.id?`${fc}35`:"rgba(255,255,255,0.06)"
                  }}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-white text-lg" style={{color:fc}}>{f.flight}</span>
                        {!isAirline && <span className="text-xs text-slate-500">{AIRLINE_NAMES[f.flight.split("-")[0].replace(/\d/g,"")]||""}</span>}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {f.from} → {f.to} · {f.dep} · Gate {f.gate} · {f.terminal}
                      </div>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${STATUS_BADGE[f.status]||STATUS_BADGE["Scheduled"]}`}>
                      {f.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {[
                      {l:"Checked In",v:fChk,   c:"#22c55e"},
                      {l:"Boarded",   v:fBrd,   c:"#14b8a6"},
                      {l:"Pending",   v:fPend,  c:fPend>0?"#f59e0b":"#22c55e"},
                      {l:"Total",     v:fpax.length,c:"#94a3b8"},
                    ].map(({l,v,c})=>(
                      <div key={l} className="text-center p-2 rounded-xl" style={{background:"rgba(255,255,255,0.04)"}}>
                        <div className="font-black text-xl" style={{color:c}}>{v}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{l}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mb-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">Check-in progress</span>
                      <span style={{color:pct===100?"#22c55e":pct>=70?"#f59e0b":fc}}>{pct}%</span>
                    </div>
                    <div className="h-2.5 rounded-full overflow-hidden" style={{background:"#1e2d4d"}}>
                      <div className="h-full rounded-full transition-all"
                        style={{width:`${pct}%`,background:pct===100?"#22c55e":fc}}/>
                    </div>
                  </div>
                  {hasIssue && (
                    <div className="flex items-center gap-2 text-xs text-red-400 mt-2">
                      <AlertTriangle className="w-3.5 h-3.5"/>
                      {fPend} not arrived — BOARDING ACTIVE
                    </div>
                  )}
                  {/* Expanded passenger list */}
                  {selFlight===f.id && (
                    <div className="mt-4 space-y-2 border-t pt-4" style={{borderColor:"rgba(255,255,255,0.08)"}}>
                      <div className="text-xs font-bold text-slate-400 uppercase mb-2">Passenger Manifest</div>
                      {fpax.map(p=>(
                        <div key={p.id}
                          onClick={e=>{e.stopPropagation();setSelPax(selPax?.id===p.id?null:p)}}
                          className="flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all"
                          style={{
                            background:selPax?.id===p.id?`${fc}10`:"rgba(255,255,255,0.02)",
                            borderColor:selPax?.id===p.id?`${fc}30`:"rgba(255,255,255,0.04)"
                          }}>
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{background:`${p.boarded?"#22c55e":p.checkin?"#0ea5e9":"#475569"}20`,
                                    color:p.boarded?"#22c55e":p.checkin?"#0ea5e9":"#94a3b8"}}>
                            {p.name[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-white text-xs truncate">{p.name}</div>
                            <div className="text-xs text-slate-500">Seat {p.seat} · {p.class}</div>
                          </div>
                          {p.special && (
                            <span className="text-xs px-1.5 py-0.5 rounded text-orange-400 border border-orange-400/20 bg-orange-400/10 flex-shrink-0">
                              {p.special}
                            </span>
                          )}
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {p.boarded
                              ? <span className="text-xs text-green-400 font-bold">✅ Boarded</span>
                              : p.checkin
                                ? <span className="text-xs text-sky-400 font-bold">✓ Checked</span>
                                : <span className="text-xs text-yellow-400 font-bold">⏳ Pending</span>
                            }
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <button onClick={e=>{e.stopPropagation();}}
                              className="p-1.5 rounded-lg hover:bg-sky-500/20 text-slate-500 hover:text-sky-400 transition-colors">
                              <Phone className="w-3 h-3"/>
                            </button>
                            <button onClick={e=>{e.stopPropagation();}}
                              className="p-1.5 rounded-lg hover:bg-teal-500/20 text-slate-500 hover:text-teal-400 transition-colors">
                              <MessageSquare className="w-3 h-3"/>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══ PASSENGER TRACKER ══ */}
      {tab==="tracker" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-xl px-4 py-3 border"
            style={{background:"rgba(255,255,255,0.04)",borderColor:"rgba(255,255,255,0.08)"}}>
            <Search className="w-4 h-4 text-slate-500"/>
            <input className="bg-transparent text-sm text-white placeholder-slate-500 outline-none flex-1"
              placeholder="Search name, wristband ID, seat..."
              value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
          <div className="bg-navy-800 rounded-2xl border border-navy-600 overflow-hidden">
            <div className="p-4 border-b border-navy-600 font-bold text-white">
              Passengers — {filtPax.length} found
            </div>
            <DataTable<Pax>
              rows={filtPax}
              rowKey={p=>p.id}
              columns={[
                {key:"name",label:"Passenger",primary:true,render:p=><span>{p.name} <span className="text-xs text-slate-500">{p.id}</span></span>},
                {key:"flight",label:"Flight",render:p=><span className="font-mono">{flights.find(f=>f.pax.some(px=>px.id===p.id))?.flight||"—"}</span>},
                {key:"seat",label:"Seat",render:p=><span className="font-mono">{p.seat}</span>},
                {key:"class",label:"Class",render:p=>p.class},
                {key:"bags",label:"Bags",render:p=>`🧳 ${p.bags}`},
                {key:"wb",label:"Wristband",render:p=><span className="font-mono">{p.wristband}</span>},
                {key:"special",label:"Special",render:p=>p.special
                  ?<span className="text-xs px-2 py-0.5 rounded-full border border-orange-400/20 bg-orange-400/10 text-orange-400">{p.special}</span>
                  :<span className="text-slate-600">—</span>},
                {key:"status",label:"Status",render:p=>p.boarded
                  ?<span className="text-xs text-green-400 font-bold">✅ Boarded</span>
                  :p.checkin
                    ?<span className="text-xs text-sky-400 font-bold">✓ Checked In</span>
                    :<span className="text-xs text-yellow-400 font-bold">⏳ Not Arrived</span>},
                {key:"actions",label:"Actions",render:()=>(
                  <div className="flex gap-1.5">
                    <button aria-label="Call" className="p-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400"><Phone className="w-3.5 h-3.5"/></button>
                    <button aria-label="Message" className="p-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-400"><MessageSquare className="w-3.5 h-3.5"/></button>
                  </div>)},
              ]}/>
          </div>
        </div>
      )}

      {/* ══ ALERTS ══ */}
      {tab==="alerts" && (
        <div className="space-y-4">
          <div className="font-bold text-white">Active Alerts — {alerts} total</div>

          {/* Boarding flights with unchecked pax */}
          {flights.filter(f=>f.status==="Boarding"&&f.pax.some(p=>!p.checkin)).map(f=>(
            <div key={f.id} className="rounded-2xl p-5 border"
              style={{background:"rgba(239,68,68,0.06)",borderColor:"rgba(239,68,68,0.25)"}}>
              <div className="flex items-center gap-3 mb-3">
                <AlertTriangle className="w-5 h-5 text-red-400"/>
                <div>
                  <div className="font-bold text-red-300">{f.flight} — Boarding but passengers not checked in</div>
                  <div className="text-xs text-slate-400">{f.from} → {f.to} · Gate {f.gate} · Boarding now</div>
                </div>
              </div>
              {f.pax.filter(p=>!p.checkin).map(p=>(
                <div key={p.id} className="flex items-center justify-between py-2 border-t"
                  style={{borderColor:"rgba(239,68,68,0.15)"}}>
                  <div className="text-sm text-red-300">{p.name} — Seat {p.seat}</div>
                  <div className="flex gap-2">
                    <button className="text-xs px-3 py-1.5 rounded-lg font-semibold"
                      style={{background:"rgba(14,165,233,0.15)",color:"#38bdf8"}}>
                      📞 Call
                    </button>
                    <button className="text-xs px-3 py-1.5 rounded-lg font-semibold"
                      style={{background:"rgba(239,68,68,0.2)",color:"#fca5a5"}}>
                      Mark No-show
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))}

          {/* Special assistance */}
          {allPax.filter(p=>p.special).map(p=>{
            const pf = flights.find(f=>f.pax.some(px=>px.id===p.id));
            return (
              <div key={p.id} className="rounded-2xl p-4 border"
                style={{background:"rgba(245,158,11,0.06)",borderColor:"rgba(245,158,11,0.25)"}}>
                <div className="flex items-center gap-3">
                  <div className="text-2xl">
                    {p.special==="Wheelchair"?"♿":p.special==="Infant"?"👶":p.special==="VVIP"?"⭐":p.special==="Unaccomp. Minor"?"👦":"⚠️"}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-yellow-300">{p.name}</div>
                    <div className="text-xs text-slate-400">
                      {pf?.flight} · Seat {p.seat} · {p.special} assistance required
                    </div>
                  </div>
                  <button className="text-xs px-3 py-1.5 rounded-lg font-semibold"
                    style={{background:"rgba(245,158,11,0.2)",color:"#fde68a"}}>
                    Assign Staff
                  </button>
                </div>
              </div>
            );
          })}

          {alerts===0 && (
            <div className="text-center py-12 text-slate-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-400 opacity-50"/>
              <div className="font-semibold">No active alerts</div>
              <div className="text-xs mt-1">All passengers are checked in</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
