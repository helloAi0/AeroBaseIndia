import { useState } from "react";
import { useAuthStore } from "../../store/authStore";
import {
  Plane, MessageSquare
} from "lucide-react";
import { AreaChart, Area, BarChart, Bar,
         XAxis, YAxis, CartesianGrid, Tooltip,
         ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { FeedbackWidget } from "../../components/ui/FeedbackWidget";

const T = {background:"#0a0e1a",border:"1px solid #1e3a5f",borderRadius:10,fontSize:11,color:"#e2e8f0"};

// ── Per-airline data ──────────────────────────────────────────────────────────
const AIRLINE_META: Record<string,{
  name:string; color:string; terminal:string;
  gates:string[]; belts:string[]; counters:string; hangar:string; fuelBay:string;
}> = {
  AI: {name:"Air India",     color:"#ef4444", terminal:"T3", gates:["A1","A2","A3","A4"],   belts:["B1","B3","B5"], counters:"A1–A8 (8 counters)", hangar:"H2",         fuelBay:"Bay 3 & Bay 7"},
  "6E":{name:"IndiGo",       color:"#0ea5e9", terminal:"T2", gates:["B1","B2","B3","B4","B5"],belts:["C1","C3"],     counters:"B1–B6 (6 counters)", hangar:"H4",         fuelBay:"Bay 1 & Bay 2"},
  UK: {name:"Vistara",       color:"#8b5cf6", terminal:"T3", gates:["C1","C2"],              belts:["B2"],           counters:"C1–C4 (4 counters)", hangar:"H3",         fuelBay:"Bay 5"},
  EK: {name:"Emirates",      color:"#f59e0b", terminal:"T3", gates:["E1","E2"],              belts:["E1"],           counters:"E1–E4 (4 counters)", hangar:"H6 (shared)",fuelBay:"Bay 8"},
  SG: {name:"SpiceJet",      color:"#f97316", terminal:"T1", gates:["A4","A5"],              belts:["A1","A2"],      counters:"A9–A12 (4 counters)",hangar:"H1",         fuelBay:"Bay 4"},
  QP: {name:"Akasa Air",     color:"#22c55e", terminal:"T1", gates:["B5","B6"],              belts:["B4"],           counters:"B7–B9 (3 counters)", hangar:"H5",         fuelBay:"Bay 6"},
  IX: {name:"Air India Express",color:"#dc2626",terminal:"T2",gates:["D1","D2"],             belts:["D1"],           counters:"D1–D3 (3 counters)", hangar:"H2 (shared)",fuelBay:"Bay 3"},
};

// ── All flights data (filtered by airline per login) ─────────────────────────
const ALL_FLIGHTS: Record<string,{
  id:string; flight:string; from:string; to:string; dep:string; arr:string;
  gate:string; status:string; pax:number; captain:string; aircraft:string;
  bags:number; fuel:string; groundCrew:number; issue:string|null;
}[]> = {
  AI:[
    {id:"F1",  flight:"AI-101", from:"DEL",to:"BOM",dep:"10:30",arr:"12:40",gate:"A1",status:"Boarding",  pax:243,captain:"Capt. Sharma",  aircraft:"VT-ANB / B787-8",bags:312,fuel:"87%",groundCrew:8, issue:null},
    {id:"F2",  flight:"AI-202", from:"DEL",to:"BLR",dep:"14:00",arr:"16:10",gate:"A2",status:"Scheduled", pax:198,captain:"Capt. Nair",    aircraft:"VT-ANC / B787-9",bags:241,fuel:"92%",groundCrew:6, issue:null},
    {id:"F3",  flight:"AI-819", from:"DEL",to:"LHR",dep:"13:45",arr:"19:15",gate:"E1",status:"Boarding",  pax:312,captain:"Capt. Verma",   aircraft:"VT-ALG / B777-200",bags:428,fuel:"94%",groundCrew:12,issue:null},
    {id:"F4",  flight:"AI-303", from:"DEL",to:"HYD",dep:"16:00",arr:"18:05",gate:"A3",status:"Scheduled", pax:167,captain:"F/O Mehta",     aircraft:"VT-PPH / A320",  bags:198,fuel:"88%",groundCrew:5, issue:"Fuel top-up delayed 20 min"},
    {id:"F5",  flight:"AI-2811",from:"BOM",to:"DEL",dep:"07:00",arr:"09:05",gate:"A4",status:"Landed",    pax:228,captain:"Capt. Das",     aircraft:"VT-SCB / B737",  bags:287,fuel:"—",  groundCrew:8, issue:null},
    {id:"F6",  flight:"AI-501", from:"DEL",to:"CCU",dep:"18:30",arr:"20:45",gate:"A2",status:"Scheduled", pax:189,captain:"TBD",           aircraft:"TBD",            bags:0,  fuel:"80%",groundCrew:0, issue:"Captain assignment pending"},
  ],
  "6E":[
    {id:"F7",  flight:"6E-2341",from:"DEL",to:"BLR",dep:"11:00",arr:"13:15",gate:"B1",status:"Boarding",  pax:186,captain:"Capt. Gupta",   aircraft:"VT-IZA / A320neo",bags:224,fuel:"91%",groundCrew:7, issue:null},
    {id:"F8",  flight:"6E-501", from:"DEL",to:"HYD",dep:"12:30",arr:"14:40",gate:"B2",status:"Scheduled", pax:172,captain:"Capt. Reddy",   aircraft:"VT-IZB / A320neo",bags:198,fuel:"89%",groundCrew:6, issue:null},
    {id:"F9",  flight:"6E-5317",from:"BLR",to:"DEL",dep:"12:30",arr:"14:45",gate:"B5",status:"Boarding",  pax:178,captain:"Capt. Ananya",  aircraft:"VT-IZC / A321neo",bags:214,fuel:"—",  groundCrew:7, issue:null},
    {id:"F10", flight:"6E-700", from:"DEL",to:"GOA",dep:"18:00",arr:"19:45",gate:"B3",status:"Scheduled", pax:186,captain:"F/O Kiran",     aircraft:"VT-IZD / A320",  bags:0,  fuel:"85%",groundCrew:0, issue:null},
    {id:"F11", flight:"6E-111", from:"CCU",to:"DEL",dep:"09:00",arr:"11:15",gate:"B4",status:"Landed",    pax:162,captain:"Capt. Singh",   aircraft:"VT-IZE / A320",  bags:188,fuel:"—",  groundCrew:6, issue:null},
  ],
  UK:[
    {id:"F12", flight:"UK-925", from:"DEL",to:"HYD",dep:"09:45",arr:"11:55",gate:"C1",status:"Delayed",   pax:142,captain:"Capt. Pillai",  aircraft:"VT-TNA / A320",  bags:167,fuel:"88%",groundCrew:5, issue:"Weather delay — 45 min"},
    {id:"F13", flight:"UK-202", from:"DEL",to:"GOA",dep:"18:30",arr:"20:15",gate:"C2",status:"Scheduled", pax:156,captain:"Capt. Rao",     aircraft:"VT-TNB / A321",  bags:0,  fuel:"82%",groundCrew:0, issue:null},
    {id:"F14", flight:"UK-555", from:"BOM",to:"DEL",dep:"08:00",arr:"10:10",gate:"C1",status:"Landed",    pax:138,captain:"Capt. Menon",   aircraft:"VT-TNC / A320",  bags:156,fuel:"—",  groundCrew:5, issue:null},
  ],
  EK:[
    {id:"F15", flight:"EK-511", from:"DEL",to:"DXB",dep:"16:00",arr:"18:30",gate:"E1",status:"Scheduled", pax:412,captain:"Capt. Al-Maktoum",aircraft:"A6-ENA / A380",bags:520,fuel:"97%",groundCrew:18,issue:null},
    {id:"F16", flight:"EK-512", from:"DXB",to:"DEL",dep:"07:30",arr:"12:30",gate:"E2",status:"Landed",    pax:398,captain:"Capt. Hassan",  aircraft:"A6-ENB / A380",  bags:498,fuel:"—",  groundCrew:18,issue:null},
  ],
  SG:[
    {id:"F17", flight:"SG-3405",from:"DEL",to:"CCU",dep:"08:30",arr:"10:45",gate:"A4",status:"Departed",  pax:168,captain:"Capt. Joshi",   aircraft:"VT-SGX / B737",  bags:192,fuel:"—",  groundCrew:5, issue:null},
    {id:"F18", flight:"SG-2801",from:"DEL",to:"MAA",dep:"17:00",arr:"19:30",gate:"A5",status:"Scheduled", pax:172,captain:"Capt. Patil",   aircraft:"VT-SGY / B737",  bags:0,  fuel:"86%",groundCrew:0, issue:null},
    {id:"F19", flight:"SG-101", from:"MAA",to:"DEL",dep:"10:30",arr:"13:00",gate:"A4",status:"Landed",    pax:154,captain:"Capt. Nanda",   aircraft:"VT-SGZ / B737",  bags:177,fuel:"—",  groundCrew:5, issue:null},
  ],
  QP:[
    {id:"F20", flight:"QP-1401",from:"DEL",to:"JAI",dep:"15:30",arr:"16:15",gate:"B5",status:"Scheduled", pax:186,captain:"Capt. Mehta",   aircraft:"VT-AKX / B737MAX",bags:0, fuel:"84%",groundCrew:4, issue:null},
    {id:"F21", flight:"QP-201", from:"BOM",to:"DEL",dep:"11:00",arr:"12:55",gate:"B6",status:"Landed",    pax:178,captain:"Capt. Singh",   aircraft:"VT-AKY / B737MAX",bags:198,fuel:"—",  groundCrew:4, issue:null},
  ],
  IX:[
    {id:"F22", flight:"IX-611", from:"DEL",to:"COK",dep:"14:00",arr:"17:00",gate:"D1",status:"Scheduled", pax:168,captain:"Capt. Thomas",  aircraft:"VT-AXT / B737",  bags:0,  fuel:"88%",groundCrew:5, issue:null},
    {id:"F23", flight:"IX-201", from:"COK",to:"DEL",dep:"07:00",arr:"10:00",gate:"D2",status:"Landed",    pax:152,captain:"Capt. Nair",    aircraft:"VT-AXU / B737",  bags:172,fuel:"—",  groundCrew:5, issue:null},
  ],
};

const PILOTS: Record<string,{name:string;rank:string;status:string;flight:string;hours:number;rating:number}[]> = {
  AI: [
    {name:"Capt. Arjun Sharma",rank:"Captain",status:"In Flight",   flight:"AI-819",hours:5640,rating:4.9},
    {name:"Capt. Priya Nair",  rank:"Captain",status:"Standby",     flight:"AI-202",hours:3640,rating:4.7},
    {name:"Capt. Sunita Verma",rank:"Captain",status:"In Flight",   flight:"AI-101",hours:4820,rating:4.8},
    {name:"F/O Rahul Mehta",   rank:"First Officer",status:"On Duty",flight:"AI-303",hours:1820,rating:4.6},
    {name:"Capt. Ananya Das",  rank:"Captain",status:"Off Duty",    flight:"Rest",   hours:4200,rating:4.7},
  ],
  "6E":[
    {name:"Capt. Vikram Gupta",rank:"Captain",status:"In Flight",   flight:"6E-2341",hours:7280,rating:4.9},
    {name:"Capt. Ananya Reddy",rank:"Captain",status:"On Duty",     flight:"6E-501", hours:4920,rating:4.8},
    {name:"F/O Kiran Das",     rank:"First Officer",status:"Standby",flight:"6E-700",hours:1560,rating:4.5},
    {name:"Capt. Preet Singh", rank:"Captain",status:"Off Duty",    flight:"Rest",   hours:5100,rating:4.7},
  ],
  UK: [
    {name:"Capt. Rajan Pillai",rank:"Captain",status:"In Flight",   flight:"UK-925", hours:4210,rating:4.8},
    {name:"Capt. Sanjay Rao",  rank:"Captain",status:"On Duty",     flight:"UK-202", hours:3870,rating:4.6},
    {name:"F/O Deepa Menon",   rank:"First Officer",status:"Standby",flight:"Standby",hours:1200,rating:4.5},
  ],
  EK: [
    {name:"Capt. Khalid Al-M", rank:"Captain",status:"In Flight",   flight:"EK-511", hours:9200,rating:5.0},
    {name:"F/O Yusuf Hassan",  rank:"First Officer",status:"In Flight",flight:"EK-511",hours:3100,rating:4.7},
    {name:"Capt. Omar Farhan", rank:"Captain",status:"Off Duty",    flight:"Rest",   hours:8100,rating:4.9},
  ],
  SG: [
    {name:"Capt. Anil Joshi",  rank:"Captain",status:"In Flight",   flight:"SG-3405",hours:3820,rating:4.6},
    {name:"Capt. Ritu Patil",  rank:"Captain",status:"On Duty",     flight:"SG-2801",hours:2940,rating:4.5},
    {name:"F/O Rajesh Nanda",  rank:"First Officer",status:"Standby",flight:"Standby",hours:980,rating:4.4},
  ],
  QP: [
    {name:"Capt. Neha Mehta",  rank:"Captain",status:"On Duty",     flight:"QP-1401",hours:2100,rating:4.7},
    {name:"Capt. Raj Singh",   rank:"Captain",status:"In Flight",   flight:"QP-201", hours:1840,rating:4.6},
  ],
  IX: [
    {name:"Capt. Roy Thomas",  rank:"Captain",status:"On Duty",     flight:"IX-611", hours:3100,rating:4.6},
    {name:"F/O Sara Nair",     rank:"First Officer",status:"Standby",flight:"Standby",hours:890,rating:4.5},
  ],
};

const FLEET: Record<string,{reg:string;type:string;seats:number;status:string;nextFlight:string;maint:string}[]> = {
  AI: [
    {reg:"VT-ANB",type:"Boeing 787-8",  seats:256,status:"In Service",  nextFlight:"AI-101 10:30",maint:"Due 2024-05-15"},
    {reg:"VT-ANC",type:"Boeing 787-9",  seats:298,status:"Maintenance", nextFlight:"AI-202 14:00",maint:"C-check ongoing"},
    {reg:"VT-ALG",type:"Boeing 777-200",seats:342,status:"In Service",  nextFlight:"AI-819 13:45",maint:"Due 2024-06-01"},
    {reg:"VT-PPH",type:"Airbus A320",   seats:180,status:"In Service",  nextFlight:"AI-303 16:00",maint:"Cleared"},
    {reg:"VT-SCB",type:"Boeing 737",    seats:162,status:"In Service",  nextFlight:"AI-501 18:30",maint:"Due 2024-05-20"},
  ],
  "6E":[
    {reg:"VT-IZA",type:"A320neo",seats:186,status:"In Service",  nextFlight:"6E-2341 11:00",maint:"Due 2024-05-20"},
    {reg:"VT-IZB",type:"A320neo",seats:186,status:"In Service",  nextFlight:"6E-501 12:30", maint:"Cleared"},
    {reg:"VT-IZC",type:"A321neo",seats:222,status:"In Service",  nextFlight:"6E-5317 12:30",maint:"Cleared"},
    {reg:"VT-IZD",type:"Airbus A320",seats:180,status:"In Service",  nextFlight:"6E-700 18:00", maint:"Cleared"},
  ],
  UK: [
    {reg:"VT-TNA",type:"Airbus A320",seats:158,status:"In Service",  nextFlight:"UK-925 09:45",maint:"Due 2024-06-10"},
    {reg:"VT-TNB",type:"Airbus A321",seats:188,status:"In Service",  nextFlight:"UK-202 18:30",maint:"Cleared"},
    {reg:"VT-TNC",type:"Airbus A320",seats:158,status:"Maintenance",  nextFlight:"Pending",    maint:"A-check in progress"},
  ],
  EK: [
    {reg:"A6-ENA",type:"Airbus A380",seats:517,status:"In Service",  nextFlight:"EK-511 16:00",maint:"Due 2024-07-01"},
    {reg:"A6-ENB",type:"Airbus A380",seats:517,status:"In Service",  nextFlight:"EK-512 07:30",maint:"Cleared"},
  ],
  SG: [
    {reg:"VT-SGX",type:"Boeing 737",seats:162,status:"In Service",  nextFlight:"SG-3405 08:30",maint:"Cleared"},
    {reg:"VT-SGY",type:"Boeing 737",seats:162,status:"In Service",  nextFlight:"SG-2801 17:00",maint:"Due 2024-05-25"},
  ],
  QP: [
    {reg:"VT-AKX",type:"B737 MAX 8",seats:189,status:"In Service",  nextFlight:"QP-1401 15:30",maint:"Cleared"},
    {reg:"VT-AKY",type:"B737 MAX 8",seats:189,status:"In Service",  nextFlight:"QP-201 11:00", maint:"Cleared"},
  ],
  IX: [
    {reg:"VT-AXT",type:"Boeing 737",seats:162,status:"In Service",  nextFlight:"IX-611 14:00",maint:"Due 2024-06-05"},
    {reg:"VT-AXU",type:"Boeing 737",seats:162,status:"Standby",     nextFlight:"IX-201 07:00", maint:"Cleared"},
  ],
};

const WEEKLY = [
  {d:"Mon",sold:1840,checkin:1780},{d:"Tue",sold:1620,checkin:1595},
  {d:"Wed",sold:2100,checkin:2040},{d:"Thu",sold:1950,checkin:1920},
  {d:"Fri",sold:2450,checkin:2410},{d:"Sat",sold:2280,checkin:2250},
  {d:"Sun",sold:1980,checkin:1940},
];

const STATUS_BADGE: Record<string,string> = {
  "Boarding":  "bg-teal-500/15 text-teal-400 border-teal-500/20",
  "Scheduled": "bg-sky-500/15 text-sky-400 border-sky-500/20",
  "Delayed":   "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  "Departed":  "bg-green-500/15 text-green-400 border-green-500/20",
  "Landed":    "bg-green-600/15 text-green-300 border-green-600/20",
  "Cancelled": "bg-red-500/15 text-red-400 border-red-500/20",
};

const PIE_COLORS = ["#22c55e","#0ea5e9","#f59e0b","#ef4444"];

const TABS = [
  {k:"overview",l:"📊 Overview"},
  {k:"flights", l:"✈ My Flights"},
  {k:"pilots",  l:"👨‍✈️ Pilots"},
  {k:"fleet",   l:"🛩 Fleet"},
  {k:"tickets", l:"🎫 Tickets"},
  {k:"ground",  l:"👥 Ground Crew"},
  {k:"feedback",l:"💬 Feedback"},
] as const;
type Tab = typeof TABS[number]["k"];

export function AirlinePortal() {
  const { user } = useAuthStore();
  const [tab, setTab]       = useState<Tab>("overview");
  const [flightSearch, setFS]= useState("");
  const [statusFilter, setSF]= useState("All");
  const [selFlight, setSelF] = useState<string|null>(null);

  // Derive airline code from staffLevel: "airline_AI" → "AI"
  const code   = (user?.staffLevel||"airline_AI").replace("airline_","").replace("pilot_captain_","").replace("pilot_fo_","");
  const airline= AIRLINE_META[code] || AIRLINE_META["AI"];
  const flights= (ALL_FLIGHTS[code]||ALL_FLIGHTS["AI"]);
  const pilots = (PILOTS[code]||PILOTS["AI"]);
  const fleet  = (FLEET[code]||FLEET["AI"]);
  const C      = airline.color;

  const filtFlights = flights.filter(f=>
    (statusFilter==="All"||f.status===statusFilter) &&
    (!flightSearch||f.flight.toLowerCase().includes(flightSearch.toLowerCase())||
     f.to.toLowerCase().includes(flightSearch.toLowerCase())||
     f.from.toLowerCase().includes(flightSearch.toLowerCase()))
  );

  const totalPax    = flights.reduce((s,f)=>s+f.pax,0);
  const activeFlights= flights.filter(f=>f.status==="Boarding"||f.status==="Departed").length;
  const issues      = flights.filter(f=>f.issue).length;
  const ontime      = flights.filter(f=>f.status!=="Delayed"&&f.status!=="Cancelled").length;
  const ontimePct   = Math.round(ontime/flights.length*100);

  const statusDist = [
    {name:"Boarding", v:flights.filter(f=>f.status==="Boarding").length},
    {name:"Scheduled",v:flights.filter(f=>f.status==="Scheduled").length},
    {name:"Landed",   v:flights.filter(f=>f.status==="Landed"||f.status==="Departed").length},
    {name:"Delayed",  v:flights.filter(f=>f.status==="Delayed"||f.status==="Cancelled").length},
  ];

  const selF = flights.find(f=>f.id===selFlight)||null;

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl font-black text-white"
              style={{background:`${C}25`,border:`2px solid ${C}50`}}>
              {code}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{airline.name} — Delhi Operations</h1>
              <p className="text-slate-400 text-sm">{code} · Airline Department Portal · Delhi IGI</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border"
            style={{background:`${C}08`,borderColor:`${C}25`}}>
            <div className="w-2 h-2 rounded-full animate-pulse" style={{background:"#22c55e"}}/>
            <div className="text-xs">
              <div className="text-slate-500">Active Right Now</div>
              <div className="font-black" style={{color:"#22c55e"}}>{activeFlights} flights airborne</div>
            </div>
          </div>
          {issues>0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border"
              style={{background:"rgba(239,68,68,0.08)",borderColor:"rgba(239,68,68,0.3)"}}>
              <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse"/>
              <div className="text-xs">
                <div className="text-slate-500">Issues</div>
                <div className="font-black text-red-400">{issues} alert{issues!==1?"s":""}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 xl:grid-cols-6 gap-3">
        {[
          {l:"Today's Flights",   v:flights.length,       c:C},
          {l:"Total Passengers",  v:totalPax.toLocaleString(), c:"#0ea5e9"},
          {l:"Pilots Active",     v:pilots.filter(p=>p.status!=="Off Duty").length, c:"#8b5cf6"},
          {l:"Aircraft Fleet",    v:fleet.length,         c:"#14b8a6"},
          {l:"On-Time %",         v:`${ontimePct}%`,      c:ontimePct>=90?"#22c55e":"#f59e0b"},
          {l:"Ground Crew",       v:flights.reduce((s,f)=>s+f.groundCrew,0), c:"#f59e0b"},
        ].map(({l,v,c})=>(
          <div key={l} className="rounded-2xl p-4 border"
            style={{background:`${c}08`,borderColor:`${c}20`}}>
            <div className="text-xl font-black mb-0.5" style={{color:c}}>{v}</div>
            <div className="text-xs text-slate-500">{l}</div>
          </div>
        ))}
      </div>

      {/* ── Alerts ── */}
      {issues>0 && (
        <div className="p-4 rounded-2xl border"
          style={{background:"rgba(239,68,68,0.07)",borderColor:"rgba(239,68,68,0.3)"}}>
          <div className="font-bold text-red-300 mb-2">⚠️ Active Operational Issues</div>
          {flights.filter(f=>f.issue).map(f=>(
            <div key={f.id} className="flex items-center gap-3 text-sm py-1.5 border-t"
              style={{borderColor:"rgba(239,68,68,0.15)"}}>
              <span className="font-mono font-bold text-white w-20">{f.flight}</span>
              <span className="text-red-400">{f.issue}</span>
              <button className="ml-auto text-xs px-3 py-1 rounded-lg font-semibold"
                style={{background:"rgba(239,68,68,0.2)",color:"#fca5a5"}}>Assign Crew →</button>
            </div>
          ))}
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="flex gap-1 p-1 rounded-2xl overflow-x-auto"
        style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)"}}>
        {TABS.map(({k,l})=>(
          <button key={k} onClick={()=>setTab(k)}
            className="flex-shrink-0 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all"
            style={tab===k?{background:`linear-gradient(135deg,${C},${C}bb)`,color:"white"}:{color:"#64748b"}}>
            {l}
          </button>
        ))}
      </div>

      {/* ════ OVERVIEW ════ */}
      {tab==="overview" && (
        <div className="space-y-5">
          <div className="grid xl:grid-cols-3 gap-5">
            {/* Weekly sales */}
            <div className="xl:col-span-2 bg-navy-800 rounded-2xl p-5 border border-navy-600">
              <div className="flex justify-between mb-4">
                <div>
                  <h2 className="font-bold text-white">Weekly Ticket Sales</h2>
                  <p className="text-xs text-slate-500">{airline.name} only · DEL base</p>
                </div>
                <div className="text-right">
                  <div className="font-black text-white">{WEEKLY.reduce((s,d)=>s+d.sold,0).toLocaleString()}</div>
                  <div className="text-xs text-green-400">+8.2% vs last week</div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={WEEKLY} margin={{left:-20}}>
                  <defs>
                    <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={C} stopOpacity={0.25}/>
                      <stop offset="95%" stopColor={C} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4d" vertical={false}/>
                  <XAxis dataKey="d" tick={{fill:"#475569",fontSize:11}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fill:"#475569",fontSize:11}} axisLine={false} tickLine={false}/>
                  <Tooltip contentStyle={T}/>
                  <Area type="monotone" dataKey="sold"   stroke={C}        fill="url(#ag)" strokeWidth={2.5} name="Tickets Sold"/>
                  <Area type="monotone" dataKey="checkin"stroke="#22c55e"  fill="none"     strokeWidth={1.5} strokeDasharray="4 2" name="Checked In"/>
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Flight status donut */}
            <div className="bg-navy-800 rounded-2xl p-5 border border-navy-600">
              <h2 className="font-bold text-white mb-3">Flight Status</h2>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={statusDist} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                    dataKey="v" stroke="none">
                    {statusDist.map((_,i)=><Cell key={i} fill={PIE_COLORS[i]}/>)}
                  </Pie>
                  <Tooltip contentStyle={T}/>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {statusDist.map(({name,v},i)=>(
                  <div key={name} className="flex justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{background:PIE_COLORS[i]}}/>
                      <span className="text-slate-400">{name}</span>
                    </div>
                    <span className="font-bold text-white">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Today's flights quick list */}
          <div className="bg-navy-800 rounded-2xl border border-navy-600 overflow-hidden">
            <div className="p-4 border-b border-navy-600 flex items-center justify-between">
              <h2 className="font-bold text-white">{airline.name} Flights Today — DEL</h2>
              <button onClick={()=>setTab("flights")}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                style={{background:`${C}15`,color:C}}>
                View all →
              </button>
            </div>
            <div className="divide-y divide-navy-700">
              {flights.slice(0,5).map(f=>(
                <div key={f.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-navy-700/30 transition-colors">
                  <div className="font-mono font-black text-white w-20" style={{color:C}}>{f.flight}</div>
                  <div className="flex items-center gap-2 flex-1">
                    <span className="font-bold text-white">{f.from}</span>
                    <Plane className="w-3 h-3 text-slate-500"/>
                    <span className="font-bold text-white">{f.to}</span>
                  </div>
                  <div className="text-sm text-slate-400 w-14">{f.dep}</div>
                  <div className="text-xs text-slate-400 w-16">👤 {f.pax}</div>
                  <div className="text-xs text-slate-500 w-28 truncate">{f.captain}</div>
                  <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${STATUS_BADGE[f.status]||STATUS_BADGE["Scheduled"]}`}>
                    {f.status}
                  </span>
                  {f.issue && <span className="text-xs text-red-400">⚠️</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Airport allocation */}
          <div className="bg-navy-800 rounded-2xl p-5 border border-navy-600">
            <h2 className="font-bold text-white mb-4">🏢 {airline.name} Airport Allocation — Delhi IGI</h2>
            <div className="grid xl:grid-cols-3 gap-3">
              {[
                {l:"Allocated Gates",  v:airline.gates.join(", "),   icon:"🚪"},
                {l:"Terminal",         v:airline.terminal,            icon:"🏢"},
                {l:"Check-in Counters",v:airline.counters,            icon:"🎫"},
                {l:"Baggage Belts",    v:airline.belts.join(", "),   icon:"🧳"},
                {l:"Fuel Bay",         v:airline.fuelBay,             icon:"⛽"},
                {l:"Maintenance Hangar",v:airline.hangar,             icon:"🔧"},
              ].map(({l,v,icon})=>(
                <div key={l} className="flex items-center gap-3 p-3.5 rounded-xl"
                  style={{background:"rgba(255,255,255,0.03)"}}>
                  <span className="text-xl">{icon}</span>
                  <div>
                    <div className="text-xs text-slate-500">{l}</div>
                    <div className="font-semibold text-white">{v}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ════ FLIGHTS ════ */}
      {tab==="flights" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2 rounded-xl px-3.5 py-2.5 border flex-1 max-w-xs"
              style={{background:"rgba(255,255,255,0.04)",borderColor:"rgba(255,255,255,0.08)"}}>
              <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              <input className="bg-transparent text-sm text-white placeholder-slate-500 outline-none w-full"
                placeholder="Search flight, route..."
                value={flightSearch} onChange={e=>setFS(e.target.value)}/>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {["All","Boarding","Scheduled","Delayed","Departed","Landed"].map(s=>(
                <button key={s} onClick={()=>setSF(s)}
                  className="px-3 py-2 rounded-xl text-xs font-medium border transition-all"
                  style={statusFilter===s
                    ?{background:C,borderColor:C,color:"white"}
                    :{background:"transparent",borderColor:"rgba(255,255,255,0.08)",color:"#64748b"}}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className={`grid gap-5 ${selF?"xl:grid-cols-3":""}`}>
            {/* Table */}
            <div className={`bg-navy-800 rounded-2xl border border-navy-600 overflow-hidden ${selF?"xl:col-span-2":""}`}>
              <div className="p-4 border-b border-navy-600 flex items-center justify-between">
                <div className="font-bold text-white">
                  {airline.name} Flights — {filtFlights.length} shown
                </div>
                <div className="text-xs text-slate-500">Only your airline's flights · No others</div>
              </div>
              <div className="table-scroll"><table className="w-full text-sm">
                <thead>
                  <tr style={{borderBottom:"1px solid #1e2d4d"}}>
                    {["Flight","Route","Gate","Dep","Passengers","Captain","Bags","Fuel","Status","Issues"].map(h=>(
                      <th key={h} className="px-4 py-3 text-left text-xs uppercase" style={{color:"#475569"}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtFlights.map(f=>(
                    <tr key={f.id}
                      onClick={()=>setSelF(selFlight===f.id?null:f.id)}
                      className="cursor-pointer transition-all"
                      style={{
                        borderBottom:"1px solid rgba(30,45,77,0.5)",
                        background:selFlight===f.id?`${C}12`:f.issue?"rgba(239,68,68,0.04)":"",
                      }}
                      onMouseEnter={e=>{if(selFlight!==f.id)(e.currentTarget.style.background="rgba(255,255,255,0.02)")}}
                      onMouseLeave={e=>{if(selFlight!==f.id)(e.currentTarget.style.background=f.issue?"rgba(239,68,68,0.04)":"");}}>
                      <td className="px-4 py-3.5 font-mono font-black" style={{color:C}}>{f.flight}</td>
                      <td className="px-4 py-3.5 text-white">{f.from} → {f.to}</td>
                      <td className="px-4 py-3.5 font-mono text-slate-300">{f.gate}</td>
                      <td className="px-4 py-3.5 font-mono text-slate-300">{f.dep}</td>
                      <td className="px-4 py-3.5 text-slate-300">👤 {f.pax}</td>
                      <td className="px-4 py-3.5 text-xs text-slate-400 max-w-32 truncate">{f.captain}</td>
                      <td className="px-4 py-3.5 text-xs text-slate-400">{f.bags>0?`🧳 ${f.bags}`:"—"}</td>
                      <td className="px-4 py-3.5 text-xs">
                        <span className={f.fuel==="—"?"text-slate-600":
                          parseInt(f.fuel)>=90?"text-green-400":
                          parseInt(f.fuel)>=80?"text-yellow-400":"text-red-400"}>
                          {f.fuel!=="—"?"⛽ ":""}{f.fuel}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${STATUS_BADGE[f.status]||STATUS_BADGE["Scheduled"]}`}>
                          {f.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-red-400">
                        {f.issue?"⚠️":""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            </div>

            {/* Flight detail panel */}
            {selF && (
              <div className="bg-navy-800 rounded-2xl border p-5 space-y-4 h-fit"
                style={{borderColor:`${C}35`}}>
                <div className="flex justify-between">
                  <h2 className="font-bold text-white">Flight Details</h2>
                  <button onClick={()=>setSelF(null)} className="text-slate-500 hover:text-white text-xl">×</button>
                </div>

                {/* Flight card */}
                <div className="rounded-2xl p-4" style={{background:`${C}10`,border:`1px solid ${C}25`}}>
                  <div className="font-black text-white text-2xl font-mono mb-1">{selF.flight}</div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-bold text-white">{selF.from}</span>
                    <Plane className="w-4 h-4 text-sky-400"/>
                    <span className="font-bold text-white">{selF.to}</span>
                  </div>
                  <div className="mt-2">
                    <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${STATUS_BADGE[selF.status]||STATUS_BADGE["Scheduled"]}`}>
                      {selF.status}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2">
                  {[
                    {l:"Gate",       v:selF.gate},
                    {l:"Departure",  v:selF.dep},
                    {l:"Arrival",    v:selF.arr},
                    {l:"Captain",    v:selF.captain},
                    {l:"Aircraft",   v:selF.aircraft},
                    {l:"Passengers", v:`${selF.pax} boarded`},
                    {l:"Bags Loaded",v:selF.bags>0?`${selF.bags} bags`:"Pre-boarding"},
                    {l:"Fuel Level", v:selF.fuel},
                    {l:"Ground Crew",v:`${selF.groundCrew} assigned`},
                  ].map(({l,v})=>(
                    <div key={l} className="flex justify-between p-2.5 rounded-xl text-sm"
                      style={{background:"rgba(255,255,255,0.03)"}}>
                      <span className="text-slate-400">{l}</span>
                      <span className="font-semibold text-white">{v}</span>
                    </div>
                  ))}
                </div>

                {/* Issue alert */}
                {selF.issue && (
                  <div className="p-3 rounded-xl" style={{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.25)"}}>
                    <div className="text-xs font-bold text-red-300 mb-1">⚠️ Active Issue</div>
                    <div className="text-xs text-red-400">{selF.issue}</div>
                  </div>
                )}

                {/* Actions */}
                <div className="space-y-2">
                  {["Assign Additional Crew","Request Fuel Top-up","Flag Maintenance","Contact ATC","Send Gate Update"].map(a=>(
                    <button key={a} className="w-full py-2.5 rounded-xl text-xs font-semibold text-left px-4 border transition-all hover:border-opacity-60"
                      style={{background:`${C}06`,borderColor:`${C}20`,color:C}}>
                      → {a}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════ PILOTS ════ */}
      {tab==="pilots" && (
        <div className="space-y-4">
          <div className="grid xl:grid-cols-2 gap-4">
            {pilots.map((p,i)=>{
              const sc: Record<string,string> = {
                "In Flight":"bg-teal-500/15 text-teal-400","On Duty":"bg-green-500/15 text-green-400",
                "Standby":"bg-yellow-500/15 text-yellow-400","Off Duty":"bg-slate-500/15 text-slate-400",
              };
              return (
                <div key={i} className="bg-navy-800 rounded-2xl p-5 border border-navy-600">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                      style={{background:`${C}20`,border:`1px solid ${C}30`}}>
                      👨‍✈️
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-white">{p.name}</div>
                      <div className="text-xs text-slate-400">{p.rank} · {p.status==="In Flight"||p.status==="On Duty"?p.flight:"Available"}</div>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${sc[p.status]||""}`}>{p.status}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[{l:"Flight Hours",v:p.hours.toLocaleString()},{l:"Flights",v:"284"},{l:"Rating",v:`${p.rating}/5`}].map(({l,v})=>(
                      <div key={l} className="text-center p-2.5 rounded-xl" style={{background:"rgba(255,255,255,0.03)"}}>
                        <div className="font-bold text-white">{v}</div>
                        <div className="text-xs text-slate-500">{l}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ════ FLEET ════ */}
      {tab==="fleet" && (
        <div className="space-y-4">
          <h2 className="font-bold text-white">{airline.name} Fleet — {fleet.length} aircraft at DEL</h2>
          <div className="grid xl:grid-cols-2 gap-4">
            {fleet.map(a=>{
              const sc: Record<string,string> = {"In Service":"#22c55e","Maintenance":"#f59e0b","Standby":"#0ea5e9"};
              return (
                <div key={a.reg} className="bg-navy-800 rounded-2xl p-5 border border-navy-600">
                  <div className="flex justify-between mb-3">
                    <div>
                      <div className="font-black text-white text-xl font-mono">{a.reg}</div>
                      <div className="text-sm text-slate-400">{a.type} · {a.seats} seats</div>
                    </div>
                    <span className="text-xs px-3 py-1.5 rounded-full font-bold h-fit"
                      style={{background:`${sc[a.status]||"#64748b"}20`,color:sc[a.status]||"#94a3b8"}}>
                      {a.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl" style={{background:"rgba(255,255,255,0.03)"}}>
                      <div className="text-slate-500">Next Flight</div>
                      <div className="font-semibold text-white font-mono">{a.nextFlight}</div>
                    </div>
                    <div className="p-2.5 rounded-xl" style={{background:"rgba(255,255,255,0.03)"}}>
                      <div className="text-slate-500">Maintenance</div>
                      <div className={`font-semibold text-xs ${a.status==="Maintenance"?"text-yellow-400":"text-slate-300"}`}>{a.maint}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ════ TICKETS ════ */}
      {tab==="tickets" && (
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-4">
            {[
              {l:"Week Tickets",v:WEEKLY.reduce((s,d)=>s+d.sold,0).toLocaleString(),c:C},
              {l:"Checked In",  v:WEEKLY.reduce((s,d)=>s+d.checkin,0).toLocaleString(),c:"#22c55e"},
              {l:"Load Factor", v:"94.2%", c:"#8b5cf6"},
            ].map(({l,v,c})=>(
              <div key={l} className="rounded-2xl p-5 border text-center"
                style={{background:`${c}08`,borderColor:`${c}20`}}>
                <div className="text-2xl font-black" style={{color:c}}>{v}</div>
                <div className="text-sm text-slate-400 mt-1">{l}</div>
              </div>
            ))}
          </div>
          <div className="bg-navy-800 rounded-2xl p-5 border border-navy-600">
            <h2 className="font-bold text-white mb-4">Ticket Sales vs Check-in</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={WEEKLY} margin={{left:-20}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4d" vertical={false}/>
                <XAxis dataKey="d" tick={{fill:"#475569",fontSize:11}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fill:"#475569",fontSize:11}} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={T}/>
                <Bar dataKey="sold"   name="Sold"       fill={C}       radius={[4,4,0,0]}/>
                <Bar dataKey="checkin"name="Checked In" fill="#22c55e" radius={[4,4,0,0]} opacity={0.8}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Per-flight ticket breakdown */}
          <div className="bg-navy-800 rounded-2xl border border-navy-600 overflow-hidden">
            <div className="p-4 border-b border-navy-600 font-bold text-white">Passengers per Flight — Today</div>
            <div className="divide-y divide-navy-700">
              {flights.filter(f=>f.pax>0).map(f=>(
                <div key={f.id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="font-mono font-bold w-20" style={{color:C}}>{f.flight}</div>
                  <div className="text-slate-300 flex-1">{f.from} → {f.to}</div>
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{background:"#1e2d4d"}}>
                    <div className="h-full rounded-full" style={{width:`${Math.min((f.pax/520)*100,100)}%`,background:C}}/>
                  </div>
                  <div className="font-bold text-white w-20 text-right">👤 {f.pax}</div>
                  <div className={`text-xs px-2 py-0.5 rounded-full ${STATUS_BADGE[f.status]||STATUS_BADGE["Scheduled"]}`}>{f.status}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ════ GROUND CREW ════ */}
      {tab==="ground" && (
        <div className="space-y-4">
          <h2 className="font-bold text-white">{airline.name} Ground Operations — DEL</h2>
          {flights.filter(f=>f.groundCrew>0).map(f=>(
            <div key={f.id} className="bg-navy-800 rounded-2xl p-5 border border-navy-600">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="font-mono font-bold text-white text-lg" style={{color:C}}>{f.flight}</div>
                  <div className="text-xs text-slate-400">{f.from} → {f.to} · Gate {f.gate} · {f.dep}</div>
                </div>
                <div className="text-right">
                  <div className="font-black text-white text-2xl">{f.groundCrew}</div>
                  <div className="text-xs text-slate-500">crew assigned</div>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2 text-xs">
                {[
                  {role:"Check-in",  n:Math.max(1,Math.floor(f.groundCrew*0.3))},
                  {role:"Baggage",   n:Math.max(1,Math.floor(f.groundCrew*0.35))},
                  {role:"Fueling",   n:Math.max(1,Math.floor(f.groundCrew*0.2))},
                  {role:"Marshalling",n:Math.max(1,Math.floor(f.groundCrew*0.15))},
                ].map(({role,n})=>(
                  <div key={role} className="p-2.5 rounded-xl text-center" style={{background:"rgba(255,255,255,0.03)"}}>
                    <div className="font-bold text-white">{n}</div>
                    <div className="text-slate-500">{role}</div>
                  </div>
                ))}
              </div>
              {f.issue && (
                <div className="mt-3 p-2.5 rounded-xl text-xs text-red-400"
                  style={{background:"rgba(239,68,68,0.08)"}}>
                  ⚠️ {f.issue}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ════ FEEDBACK ════ */}
      {tab==="feedback" && (
        <FeedbackWidget role="airline" name={user?.name||airline.name} context={code}/>
      )}

      {/* Floating feedback button */}
      {tab!=="feedback" && (
        <button onClick={()=>setTab("feedback")}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold text-white shadow-2xl hover:scale-105 transition-all"
          style={{background:`linear-gradient(135deg,${C},${C}bb)`,boxShadow:`0 8px 32px ${C}40`}}>
          <MessageSquare className="w-4 h-4"/>Feedback
        </button>
      )}
    </div>
  );
}
