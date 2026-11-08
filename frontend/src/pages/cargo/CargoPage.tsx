import { useState } from "react";
import { useAuthStore } from "../../store/authStore";
import {
  Package, Truck, AlertTriangle, CheckCircle,
  Search, Thermometer, Shield, TrendingUp,
  DollarSign, Activity, MapPin
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from "recharts";

const T = {background:"#0a0e1a",border:"1px solid #1e3a5f",borderRadius:10,fontSize:11,color:"#e2e8f0"};
const fmt = (v:number)=>v>=10000000?`₹${(v/10000000).toFixed(1)}Cr`:v>=100000?`₹${(v/100000).toFixed(1)}L`:v>=1000?`₹${(v/1000).toFixed(0)}K`:`₹${v}`;

const AIRLINE_CODE_MAP: Record<string,string> = {
  airline_AI:"AI",airline_6E:"6E",airline_UK:"UK",airline_EK:"EK",
  airline_SG:"SG",airline_QP:"QP",airline_IX:"IX",
  pilot_captain_AI:"AI",pilot_captain_6E:"6E",
  pilot_fo_AI:"AI",pilot_fo_6E:"6E",
};
const AIRLINE_COLORS: Record<string,string> = {
  AI:"#ef4444","6E":"#0ea5e9",UK:"#8b5cf6",EK:"#f59e0b",
  SG:"#f97316",QP:"#22c55e",IX:"#dc2626",
};
const AIRLINE_NAMES: Record<string,string> = {
  AI:"Air India","6E":"IndiGo",UK:"Vistara",EK:"Emirates",
  SG:"SpiceJet",QP:"Akasa Air",IX:"Air India Express",
};

const CARGO_DATA: Record<string,{
  id:string;flight:string;type:string;weight:string;weightKg:number;
  from:string;to:string;handler:string;temp:string;priority:string;
  status:string;awb:string;shipper:string;consignee:string;
  contents:string;pieces:number;volume:string;hazmat:boolean;
  revenue:number;deliveredAt:string|null;tracking:string[];
}[]> = {
  AI:[
    {id:"C001",flight:"AI-101",type:"General",   weight:"2400kg",weightKg:2400,from:"DEL",to:"BOM",handler:"Celebi",   temp:"Ambient",priority:"Normal",  status:"In Transit",awb:"098-12345678",shipper:"Tata Steel Ltd",     consignee:"JSW Mumbai",      contents:"Steel Rods",        pieces:48, volume:"18.2m³",hazmat:false,revenue:84000,  deliveredAt:null,          tracking:["DEL Warehouse","Security Clear","Loaded AI-101","Departed DEL 10:30","In Transit"]},
    {id:"C002",flight:"AI-819",type:"Perishable",weight:"850kg", weightKg:850, from:"DEL",to:"LHR",handler:"AISATS",  temp:"2-8°C",  priority:"High",    status:"Loaded",    awb:"098-22345678",shipper:"Pusa Cold Chain",   consignee:"Tesco UK",        contents:"Alphonso Mangoes",  pieces:120,volume:"6.8m³", hazmat:false,revenue:212000, deliveredAt:null,          tracking:["Cold Storage DEL","Temp Verified","Security Clear","Loaded AI-819"]},
    {id:"C003",flight:"AI-202",type:"Valuable",  weight:"120kg", weightKg:120, from:"DEL",to:"BLR",handler:"AISATS",  temp:"Ambient",priority:"Critical", status:"Security Hold",awb:"098-32345678",shipper:"RBI Delhi",       consignee:"RBI Bangalore",   contents:"Currency Notes",    pieces:8,  volume:"0.8m³", hazmat:false,revenue:8000,   deliveredAt:null,          tracking:["DEL Warehouse","Security Review - Pending Clearance"]},
    {id:"C004",flight:"AI-303",type:"General",   weight:"1800kg",weightKg:1800,from:"DEL",to:"HYD",handler:"Celebi",  temp:"Ambient",priority:"Normal",   status:"Delivered", awb:"098-42345678",shipper:"Amazon India",     consignee:"Amazon HYD Hub",  contents:"E-commerce Goods",  pieces:312,volume:"22.4m³",hazmat:false,revenue:54000,  deliveredAt:"08:45 Today", tracking:["DEL Warehouse","Loaded AI-303","In Transit","Landed HYD","Delivered to Hub"]},
    {id:"C005",flight:"AI-101",type:"Live Animal",weight:"280kg",weightKg:280, from:"DEL",to:"BOM",handler:"AISATS",  temp:"18-22°C",priority:"High",    status:"In Transit",awb:"098-52345678",shipper:"Zoo Authority DEL",consignee:"Sanjay Gandhi NP",contents:"2x Leopard Cubs",    pieces:2,  volume:"2.1m³", hazmat:false,revenue:42000,  deliveredAt:null,          tracking:["Zoo Holding DEL","Vet Check","Loaded AI-101","In Transit"]},
    {id:"C006",flight:"AI-819",type:"Dangerous", weight:"340kg", weightKg:340, from:"DEL",to:"LHR",handler:"Celebi",  temp:"Controlled",priority:"Critical",status:"Awaiting Clearance",awb:"098-62345678",shipper:"DRDO Delhi",consignee:"MoD UK",contents:"Lab Chemicals",      pieces:24, volume:"1.8m³", hazmat:true, revenue:28000,  deliveredAt:null,          tracking:["DEL Hazmat Bay","DGCA Review","Awaiting Clearance"]},
    {id:"C007",flight:"AI-501",type:"General",   weight:"640kg", weightKg:640, from:"DEL",to:"CCU",handler:"Celebi",  temp:"Ambient",priority:"Normal",   status:"Delivered", awb:"098-72345678",shipper:"Flipkart DEL",    consignee:"Flipkart CCU Hub",contents:"Electronics",       pieces:88, volume:"5.2m³", hazmat:false,revenue:19200,  deliveredAt:"Yesterday",   tracking:["DEL Warehouse","Loaded AI-501","In Transit","Landed CCU","Delivered"]},
  ],
  "6E":[
    {id:"C008",flight:"6E-2341",type:"General",   weight:"1600kg",weightKg:1600,from:"DEL",to:"BLR",handler:"Bird",    temp:"Ambient",priority:"Normal",  status:"Loaded",    awb:"176-12345678",shipper:"Flipkart DEL",    consignee:"Flipkart BLR",    contents:"Electronics",       pieces:240,volume:"14.8m³",hazmat:false,revenue:48000,  deliveredAt:null,          tracking:["DEL Warehouse","Security Clear","Loaded 6E-2341"]},
    {id:"C009",flight:"6E-501", type:"Perishable",weight:"620kg", weightKg:620, from:"DEL",to:"HYD",handler:"Bird",    temp:"2-8°C",  priority:"High",   status:"In Transit",awb:"176-22345678",shipper:"Amul Dairy",      consignee:"Aavin HYD",       contents:"Dairy Products",    pieces:80, volume:"5.2m³", hazmat:false,revenue:31000,  deliveredAt:null,          tracking:["Cold Chain DEL","Loaded 6E-501","Departed 12:30","In Transit"]},
    {id:"C010",flight:"6E-5317",type:"Courier",   weight:"180kg", weightKg:180, from:"BLR",to:"DEL",handler:"Gati",    temp:"Ambient",priority:"Normal",  status:"Delivered", awb:"176-32345678",shipper:"FedEx BLR",      consignee:"DHL DEL Hub",     contents:"Documents",         pieces:320,volume:"1.4m³", hazmat:false,revenue:9000,   deliveredAt:"14:45 Today", tracking:["BLR Warehouse","Loaded 6E-5317","In Transit","Landed DEL","Delivered DHL Hub"]},
    {id:"C011",flight:"6E-700", type:"General",   weight:"2100kg",weightKg:2100,from:"DEL",to:"GOA",handler:"IndiGo GH",temp:"Ambient",priority:"Normal", status:"Accepted",  awb:"176-42345678",shipper:"Meesho DEL",     consignee:"Meesho GOA Hub",  contents:"Apparel",           pieces:480,volume:"28.2m³",hazmat:false,revenue:63000,  deliveredAt:null,          tracking:["DEL Warehouse","Accepted - Pending Load"]},
    {id:"C012",flight:"6E-111", type:"General",   weight:"840kg", weightKg:840, from:"CCU",to:"DEL",handler:"Bird",    temp:"Ambient",priority:"Normal",  status:"Delivered", awb:"176-52345678",shipper:"ITC Kolkata",     consignee:"ITC DEL Hub",     contents:"FMCG Goods",        pieces:144,volume:"6.8m³", hazmat:false,revenue:25200,  deliveredAt:"11:15 Today", tracking:["CCU Warehouse","Loaded 6E-111","In Transit","Landed DEL","Delivered"]},
  ],
  UK:[
    {id:"C013",flight:"UK-925",type:"Valuable",   weight:"95kg",  weightKg:95,  from:"DEL",to:"HYD",handler:"MENZIES",temp:"Ambient",priority:"High",    status:"Security Hold",awb:"220-12345678",shipper:"Tanishq Jewellers",consignee:"Tanishq HYD",  contents:"Gold Jewellery",    pieces:4,  volume:"0.3m³", hazmat:false,revenue:95000,  deliveredAt:null,          tracking:["DEL Vault","High Security Check","Awaiting Clearance"]},
    {id:"C014",flight:"UK-202",type:"Perishable", weight:"450kg", weightKg:450, from:"DEL",to:"GOI",handler:"MENZIES",temp:"4-8°C",  priority:"Normal",  status:"Accepted",  awb:"220-22345678",shipper:"Mother Dairy",    consignee:"Nandini GOA",     contents:"Fresh Produce",     pieces:60, volume:"3.8m³", hazmat:false,revenue:13500,  deliveredAt:null,          tracking:["Cold Store DEL","Accepted - Pending Load"]},
    {id:"C015",flight:"UK-555",type:"General",    weight:"720kg", weightKg:720, from:"BOM",to:"DEL",handler:"MENZIES",temp:"Ambient",priority:"Normal",  status:"Delivered", awb:"220-32345678",shipper:"Reliance BOM",   consignee:"Reliance DEL",    contents:"Textile Goods",     pieces:120,volume:"5.8m³", hazmat:false,revenue:21600,  deliveredAt:"10:10 Today", tracking:["BOM Warehouse","Loaded UK-555","In Transit","Landed DEL","Delivered"]},
  ],
  EK:[
    {id:"C016",flight:"EK-511",type:"General",    weight:"8200kg",weightKg:8200,from:"DEL",to:"DXB",handler:"Dnata",   temp:"Ambient",priority:"Normal",  status:"Loaded",    awb:"176-82345678",shipper:"Reliance Export",  consignee:"Al-Futtaim DXB",  contents:"Textile Goods",     pieces:840,volume:"68.2m³",hazmat:false,revenue:738000, deliveredAt:null,          tracking:["DEL Export Zone","Customs Clear","Loaded EK-511"]},
    {id:"C017",flight:"EK-511",type:"Perishable", weight:"2400kg",weightKg:2400,from:"DEL",to:"DXB",handler:"Dnata",   temp:"1-4°C",  priority:"High",   status:"Loaded",    awb:"176-92345678",shipper:"Basmati Exports",  consignee:"Carrefour UAE",   contents:"Basmati Rice",      pieces:240,volume:"18.4m³",hazmat:false,revenue:168000, deliveredAt:null,          tracking:["Cold Chain DEL","Export Cleared","Loaded EK-511"]},
    {id:"C018",flight:"EK-511",type:"Dangerous",  weight:"380kg", weightKg:380, from:"DEL",to:"DXB",handler:"Dnata",   temp:"Controlled",priority:"Critical",status:"Loaded",awb:"176-03345678",shipper:"Pharma Exports",  consignee:"Aster DM Health", contents:"Pharma Chemicals",  pieces:12, volume:"1.2m³", hazmat:true, revenue:57000,  deliveredAt:null,          tracking:["Hazmat Zone DEL","DGCA OK","Customs Clear","Loaded EK-511"]},
    {id:"C019",flight:"EK-512",type:"General",    weight:"5400kg",weightKg:5400,from:"DXB",to:"DEL",handler:"Dnata",   temp:"Ambient",priority:"Normal",  status:"Delivered", awb:"176-13345678",shipper:"Al-Futtaim DXB",  consignee:"Reliance DEL",    contents:"Electronics Import",pieces:480,volume:"42.8m³",hazmat:false,revenue:486000, deliveredAt:"12:30 Today", tracking:["DXB Cargo","Import Docs","Loaded EK-512","Landed DEL","Customs","Delivered"]},
  ],
  SG:[
    {id:"C020",flight:"SG-3405",type:"General",   weight:"980kg", weightKg:980, from:"DEL",to:"CCU",handler:"AISATS",  temp:"Ambient",priority:"Normal",  status:"In Transit",awb:"SG-12345678",shipper:"Amazon India",     consignee:"Amazon CCU Hub",  contents:"Mixed Goods",       pieces:156,volume:"8.4m³", hazmat:false,revenue:29400,  deliveredAt:null,          tracking:["DEL Warehouse","Loaded SG-3405","Departed 08:30","In Transit"]},
    {id:"C021",flight:"SG-2801",type:"Courier",   weight:"140kg", weightKg:140, from:"DEL",to:"MAA",handler:"AISATS",  temp:"Ambient",priority:"Normal",  status:"Accepted",  awb:"SG-22345678",shipper:"DTDC Delhi",      consignee:"DTDC Chennai",    contents:"Courier Packages",  pieces:280,volume:"1.1m³", hazmat:false,revenue:4200,   deliveredAt:null,          tracking:["DEL Courier Hub","Accepted"]},
    {id:"C022",flight:"SG-101", type:"Perishable",weight:"320kg", weightKg:320, from:"MAA",to:"DEL",handler:"AISATS",  temp:"4-8°C",  priority:"High",   status:"Delivered", awb:"SG-32345678",shipper:"Tamil Nadu Fish",  consignee:"INA Market DEL",  contents:"Fresh Seafood",     pieces:40, volume:"2.4m³", hazmat:false,revenue:19200,  deliveredAt:"13:00 Today", tracking:["MAA Cold Store","Loaded SG-101","In Transit","Landed DEL","Delivered"]},
  ],
  QP:[
    {id:"C023",flight:"QP-1401",type:"General",   weight:"560kg", weightKg:560, from:"DEL",to:"JAI",handler:"Akasa GH",temp:"Ambient",priority:"Normal",  status:"Accepted",  awb:"QP-12345678",shipper:"Meesho DEL",      consignee:"Meesho JAI Hub",  contents:"Apparel",           pieces:80, volume:"4.8m³", hazmat:false,revenue:16800,  deliveredAt:null,          tracking:["DEL Warehouse","Accepted - Awaiting Load"]},
    {id:"C024",flight:"QP-201", type:"Courier",   weight:"85kg",  weightKg:85,  from:"BOM",to:"DEL",handler:"Akasa GH",temp:"Ambient",priority:"Normal",  status:"Delivered", awb:"QP-22345678",shipper:"Blue Dart BOM",   consignee:"Blue Dart DEL",   contents:"Express Courier",   pieces:120,volume:"0.7m³", hazmat:false,revenue:2550,   deliveredAt:"12:55 Today", tracking:["BOM Courier Hub","Loaded QP-201","In Transit","Landed DEL","Delivered"]},
  ],
  IX:[
    {id:"C025",flight:"IX-611", type:"General",   weight:"720kg", weightKg:720, from:"DEL",to:"COK",handler:"AISATS",  temp:"Ambient",priority:"Normal",  status:"Accepted",  awb:"IX-12345678",shipper:"Kerala Exports",   consignee:"Cochin Commerce",contents:"Spices",             pieces:96, volume:"5.2m³", hazmat:false,revenue:21600,  deliveredAt:null,          tracking:["DEL Warehouse","Export Clear","Accepted"]},
    {id:"C026",flight:"IX-201", type:"Perishable",weight:"380kg", weightKg:380, from:"COK",to:"DEL",handler:"AISATS",  temp:"4-8°C",  priority:"High",   status:"In Transit",awb:"IX-22345678",shipper:"Kerala Seafood Co.",consignee:"Delhi Fish Market",contents:"Fresh Seafood",     pieces:48, volume:"2.8m³", hazmat:false,revenue:22800,  deliveredAt:null,          tracking:["COK Cold Store","Loaded IX-201","In Transit"]},
    {id:"C027",flight:"IX-611", type:"Courier",   weight:"95kg",  weightKg:95,  from:"DEL",to:"COK",handler:"AISATS",  temp:"Ambient",priority:"Normal",  status:"Delivered", awb:"IX-32345678",shipper:"Amazon DEL",      consignee:"Amazon COK Hub",  contents:"Courier Packages",  pieces:140,volume:"0.8m³", hazmat:false,revenue:2850,   deliveredAt:"Yesterday",   tracking:["DEL Hub","Loaded IX-611","In Transit","Landed COK","Delivered"]},
  ],
};

const MONTHLY_AI  = [{m:"Jan",v:1200},{m:"Feb",v:980},{m:"Mar",v:1540},{m:"Apr",v:1380},{m:"May",v:1820},{m:"Jun",v:2100}];
const MONTHLY_6E  = [{m:"Jan",v:980}, {m:"Feb",v:1120},{m:"Mar",v:1380},{m:"Apr",v:1680},{m:"May",v:1920},{m:"Jun",v:2240}];
const MONTHLY_DEF = [{m:"Jan",v:800}, {m:"Feb",v:920}, {m:"Mar",v:1100},{m:"Apr",v:1280},{m:"May",v:1480},{m:"Jun",v:1820}];
const MONTHLY_EK  = [{m:"Jan",v:4200},{m:"Feb",v:3800},{m:"Mar",v:5100},{m:"Apr",v:4800},{m:"May",v:5600},{m:"Jun",v:6200}];

const MONTHLY_MAP: Record<string,typeof MONTHLY_AI> = {AI:MONTHLY_AI,"6E":MONTHLY_6E,EK:MONTHLY_EK};

const REV_WEEKLY = [
  {d:"Mon",rev:284000},{d:"Tue",rev:312000},{d:"Wed",rev:198000},
  {d:"Thu",rev:425000},{d:"Fri",rev:518000},{d:"Sat",rev:346000},{d:"Sun",rev:287000},
];

const STATUS_BADGE: Record<string,string> = {
  "Loaded":             "bg-green-500/15 text-green-400 border-green-500/20",
  "In Transit":         "bg-sky-500/15 text-sky-400 border-sky-500/20",
  "Accepted":           "bg-teal-500/15 text-teal-400 border-teal-500/20",
  "Security Hold":      "bg-red-500/15 text-red-400 border-red-500/20",
  "Awaiting Clearance": "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  "In Hold":            "bg-orange-500/15 text-orange-400 border-orange-500/20",
  "Delivered":          "bg-green-600/15 text-green-300 border-green-600/20",
};

const TYPE_ICONS: Record<string,string> = {
  General:"📦",Perishable:"🌡️",Dangerous:"☢️",Valuable:"💎","Live Animal":"🐾",Courier:"📬",
};

const PIE_COLORS = ["#0ea5e9","#22c55e","#f59e0b","#ef4444","#8b5cf6","#14b8a6"];

const ALL_CARGO = Object.values(CARGO_DATA).flat();

type CargoItem = typeof ALL_CARGO[0];

const TABS = [
  {k:"live",    l:"🔴 Live Tracking"},
  {k:"all",     l:"📦 All Shipments"},
  {k:"delivered",l:"✅ Delivered"},
  {k:"revenue", l:"💰 Revenue"},
] as const;
type Tab = typeof TABS[number]["k"];

export function CargoPage() {
  const { user }   = useAuthStore();
  const [search,   setSearch] = useState("");
  const [typeF,    setTypeF]  = useState("All");
  const [tab,      setTab]    = useState<Tab>("live");
  const [selItem,  setSelItem]= useState<CargoItem|null>(null);

  const sl        = user?.staffLevel||"";
  const airCode   = AIRLINE_CODE_MAP[sl]||null;
  const isAirline = airCode!==null && user?.role!=="airport_admin" && user?.role!=="superadmin";
  const C         = isAirline?(AIRLINE_COLORS[airCode!]||"#14b8a6"):"#14b8a6";
  const alName    = isAirline?(AIRLINE_NAMES[airCode!]||""):"";

  const cargoList = isAirline ? (CARGO_DATA[airCode!]||[]) : ALL_CARGO;
  const monthly   = MONTHLY_MAP[airCode!]||MONTHLY_DEF;

  const filtered = cargoList.filter(c=>
    (typeF==="All"||c.type===typeF)&&
    (!search||c.id.toLowerCase().includes(search.toLowerCase())||
     c.flight.toLowerCase().includes(search.toLowerCase())||
     c.contents.toLowerCase().includes(search.toLowerCase())||
     c.shipper.toLowerCase().includes(search.toLowerCase())||
     c.awb.toLowerCase().includes(search.toLowerCase()))
  );

  const live       = cargoList.filter(c=>c.status==="In Transit"||c.status==="Loaded");
  const delivered  = cargoList.filter(c=>c.status==="Delivered");
  const critical   = cargoList.filter(c=>c.priority==="Critical"||c.hazmat||c.status==="Security Hold"||c.status==="Awaiting Clearance");
  const totalRev   = cargoList.reduce((s,c)=>s+c.revenue,0);
  const delivRev   = delivered.reduce((s,c)=>s+c.revenue,0);
  const totalWeight= cargoList.reduce((s,c)=>s+c.weightKg,0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {isAirline?`${alName} Cargo Operations`:"Cargo Management"}
          </h1>
          <p className="text-slate-400 text-sm">
            {isAirline
              ?`${airCode} · Your airline's cargo only · Import & Export · Live tracking`
              :"All airlines · Freight tracking · Revenue analytics"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border"
            style={{background:"rgba(34,197,94,0.06)",borderColor:"rgba(34,197,94,0.2)"}}>
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"/>
            <div className="text-xs">
              <div className="text-slate-500">Live Cargo</div>
              <div className="font-black text-green-400">{live.length} in motion</div>
            </div>
          </div>
          {isAirline && (
            <div className="px-3 py-2 rounded-xl border"
              style={{background:`${C}10`,borderColor:`${C}30`}}>
              <div className="text-xs text-slate-400">{alName}</div>
              <div className="font-black text-sm" style={{color:C}}>{cargoList.length} shipments · {fmt(totalRev)}</div>
            </div>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-6 gap-3">
        {[
          {l:"Total Shipments",  v:cargoList.length,                      c:C,         icon:<Package className="w-4 h-4"/>},
          {l:"Total Weight",     v:`${(totalWeight/1000).toFixed(1)}t`,   c:"#0ea5e9", icon:<Truck className="w-4 h-4"/>},
          {l:"Live / In Transit",v:live.length,                           c:"#22c55e", icon:<Activity className="w-4 h-4"/>},
          {l:"Delivered Today",  v:delivered.length,                      c:"#14b8a6", icon:<CheckCircle className="w-4 h-4"/>},
          {l:"Total Revenue",    v:fmt(totalRev),                         c:"#f59e0b", icon:<DollarSign className="w-4 h-4"/>},
          {l:"Alerts",           v:critical.length,                       c:critical.length>0?"#ef4444":"#22c55e",icon:<AlertTriangle className="w-4 h-4"/>},
        ].map(({l,v,c,icon})=>(
          <div key={l} className="rounded-2xl p-4 border"
            style={{background:`${c}08`,borderColor:`${c}20`}}>
            <div className="mb-1.5" style={{color:c}}>{icon}</div>
            <div className="text-xl font-black mb-0.5" style={{color:c}}>{v}</div>
            <div className="text-xs text-slate-500">{l}</div>
          </div>
        ))}
      </div>

      {/* Critical alerts */}
      {critical.length>0 && (
        <div className="p-4 rounded-2xl border"
          style={{background:"rgba(239,68,68,0.07)",borderColor:"rgba(239,68,68,0.3)"}}>
          <div className="font-bold text-red-300 flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4"/>
            {critical.length} Alert{critical.length!==1?"s":""} — Requires Attention
          </div>
          {critical.map(c=>(
            <div key={c.id} className="flex items-center gap-3 py-2 border-t text-sm"
              style={{borderColor:"rgba(239,68,68,0.15)"}}>
              <span className="text-xl">{c.hazmat?"☢️":c.status==="Security Hold"?"🔒":"⚠️"}</span>
              <div className="flex-1">
                <span className="font-mono font-bold text-white">{c.id}</span>
                <span className="text-slate-400 ml-2">{c.contents} · {c.flight}</span>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full border font-bold ${STATUS_BADGE[c.status]||""}`}>
                {c.status}
              </span>
              <button className="text-xs px-3 py-1.5 rounded-lg"
                style={{background:"rgba(239,68,68,0.2)",color:"#fca5a5"}}>
                Escalate →
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-2xl"
        style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)"}}>
        {TABS.map(({k,l})=>(
          <button key={k} onClick={()=>setTab(k)}
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all"
            style={tab===k?{background:`linear-gradient(135deg,${C},${C}bb)`,color:"white"}:{color:"#64748b"}}>
            {l}
          </button>
        ))}
      </div>

      {/* ════ LIVE TRACKING ════ */}
      {tab==="live" && (
        <div className="space-y-4">
          <h2 className="font-bold text-white">Live Cargo — {live.length} shipments in motion</h2>
          {live.length===0 ? (
            <div className="text-center py-12 text-slate-500">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-30"/>
              <div>No live cargo right now</div>
            </div>
          ) : live.map(item=>(
            <div key={item.id}
              onClick={()=>setSelItem(selItem?.id===item.id?null:item)}
              className="rounded-2xl p-5 border cursor-pointer transition-all hover:scale-[1.01]"
              style={{
                background:`${C}06`,
                borderColor:selItem?.id===item.id?`${C}50`:`${C}20`
              }}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{TYPE_ICONS[item.type]||"📦"}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-white" style={{color:C}}>{item.id}</span>
                      <span className="font-mono text-slate-400 text-sm">{item.flight}</span>
                      {item.hazmat && <span className="text-xs text-red-400 font-bold">☢️ HAZMAT</span>}
                    </div>
                    <div className="text-sm text-white font-semibold">{item.contents}</div>
                    <div className="text-xs text-slate-400">{item.shipper} → {item.consignee}</div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className={`text-xs px-2.5 py-1 rounded-full border font-bold ${STATUS_BADGE[item.status]||""}`}>
                    {item.status==="In Transit"?"🔵 ":item.status==="Loaded"?"🟢 ":""}{item.status}
                  </span>
                  <div className="text-xs text-slate-400 mt-1">{item.from} → {item.to}</div>
                </div>
              </div>

              {/* Tracking timeline */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1">
                {item.tracking.map((step,i)=>{
                  const isLast = i===item.tracking.length-1;
                  const isDone = !isLast;
                  return (
                    <div key={i} className="flex items-center gap-1 flex-shrink-0">
                      <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium ${
                        isLast
                          ?`text-white font-bold`
                          :"text-slate-400"
                      }`}
                        style={{background:isLast?`${C}25`:isDone?"rgba(34,197,94,0.1)":"rgba(255,255,255,0.04)"}}>
                        <span>{isLast?"📍":isDone?"✓":""}</span>
                        {step}
                      </div>
                      {i<item.tracking.length-1 && <span className="text-slate-600 text-xs">→</span>}
                    </div>
                  );
                })}
              </div>

              {/* Quick info */}
              <div className="grid grid-cols-4 gap-2 mt-3">
                {[
                  {l:"Weight",   v:item.weight},
                  {l:"Pieces",   v:`${item.pieces}`},
                  {l:"Temp",     v:item.temp},
                  {l:"Revenue",  v:fmt(item.revenue)},
                ].map(({l,v})=>(
                  <div key={l} className="text-center p-2 rounded-lg" style={{background:"rgba(255,255,255,0.03)"}}>
                    <div className="text-xs text-slate-500">{l}</div>
                    <div className="font-bold text-white text-sm">{v}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ════ ALL SHIPMENTS ════ */}
      {tab==="all" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 rounded-xl px-3.5 py-2.5 border flex-1 max-w-sm"
              style={{background:"rgba(255,255,255,0.04)",borderColor:"rgba(255,255,255,0.08)"}}>
              <Search className="w-4 h-4 text-slate-500"/>
              <input className="bg-transparent text-sm text-white placeholder-slate-500 outline-none w-full"
                placeholder="Search AWB, cargo ID, contents, shipper..."
                value={search} onChange={e=>setSearch(e.target.value)}/>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {["All","General","Perishable","Dangerous","Valuable","Live Animal","Courier"].map(t=>(
                <button key={t} onClick={()=>setTypeF(t)}
                  className="px-3 py-2 rounded-xl text-xs font-medium border transition-all"
                  style={typeF===t
                    ?{background:C,borderColor:C,color:"white"}
                    :{background:"transparent",borderColor:"rgba(255,255,255,0.08)",color:"#64748b"}}>
                  {TYPE_ICONS[t]||""} {t}
                </button>
              ))}
            </div>
          </div>

          <div className={`grid gap-5 ${selItem?"xl:grid-cols-3":""}`}>
            <div className={`rounded-2xl border overflow-hidden ${selItem?"xl:col-span-2":""}`}
              style={{background:"#080d18",borderColor:"#1e2d4d"}}>
              <div className="px-5 py-4 border-b flex items-center justify-between"
                style={{borderColor:"#1e2d4d"}}>
                <div className="font-bold text-white">
                  {isAirline?alName+" Shipments":""} — {filtered.length} found
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{borderBottom:"1px solid #1e2d4d"}}>
                      {["Cargo ID","Flight","Type","Weight","Route","Handler","Temp","Priority","Revenue","Status"].map(h=>(
                        <th key={h} className="px-4 py-3 text-left text-xs uppercase" style={{color:"#475569"}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(item=>(
                      <tr key={item.id}
                        onClick={()=>setSelItem(selItem?.id===item.id?null:item)}
                        className="cursor-pointer transition-all"
                        style={{
                          borderBottom:"1px solid rgba(30,45,77,0.5)",
                          background:selItem?.id===item.id?`${C}10`:
                            item.hazmat?"rgba(239,68,68,0.04)":"",
                        }}
                        onMouseEnter={e=>{if(selItem?.id!==item.id)(e.currentTarget.style.background="rgba(255,255,255,0.025)")}}
                        onMouseLeave={e=>{if(selItem?.id!==item.id)(e.currentTarget.style.background=item.hazmat?"rgba(239,68,68,0.04)":"");}}>
                        <td className="px-4 py-3.5 font-mono font-bold" style={{color:C}}>
                          {item.hazmat?"☢️ ":""}{item.id}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-slate-300">{item.flight}</td>
                        <td className="px-4 py-3.5 text-slate-300 whitespace-nowrap">
                          {TYPE_ICONS[item.type]||"📦"} {item.type}
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-white">{item.weight}</td>
                        <td className="px-4 py-3.5 text-slate-300">{item.from}→{item.to}</td>
                        <td className="px-4 py-3.5 text-slate-400">{item.handler}</td>
                        <td className="px-4 py-3.5 text-xs">
                          <span className={`flex items-center gap-1 ${
                            item.temp==="Ambient"?"text-slate-400":
                            item.temp.includes("-")?"text-sky-400":"text-orange-400"}`}>
                            <Thermometer className="w-3 h-3"/>{item.temp}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                            item.priority==="Critical"?"bg-red-500/15 text-red-400 border border-red-500/20":
                            item.priority==="High"?"bg-orange-500/15 text-orange-400 border border-orange-500/20":
                            "bg-slate-500/15 text-slate-400 border border-slate-500/20"}`}>
                            {item.priority}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-semibold" style={{color:"#f59e0b"}}>{fmt(item.revenue)}</td>
                        <td className="px-4 py-3.5">
                          <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${STATUS_BADGE[item.status]||""}`}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Detail panel */}
            {selItem && (
              <div className="rounded-2xl border p-5 space-y-4 h-fit"
                style={{background:"#080d18",borderColor:`${C}35`}}>
                <div className="flex justify-between">
                  <h2 className="font-bold text-white">Shipment Details</h2>
                  <button onClick={()=>setSelItem(null)} className="text-slate-500 hover:text-white text-xl">×</button>
                </div>
                <div className="rounded-2xl p-4" style={{background:`${C}10`,border:`1px solid ${C}25`}}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{TYPE_ICONS[selItem.type]||"📦"}</span>
                    <div>
                      <div className="font-black text-white font-mono">{selItem.id}</div>
                      <div className="text-xs text-slate-400">{selItem.type} Cargo</div>
                    </div>
                  </div>
                  <div className="font-bold text-white">{selItem.contents}</div>
                  <div className="text-xs text-slate-400">{selItem.from} → {selItem.to} · {selItem.flight}</div>
                  {selItem.hazmat && <div className="mt-1 text-xs text-red-400 font-bold">☢️ HAZMAT</div>}
                </div>
                <div className="p-3 rounded-xl" style={{background:"rgba(245,158,11,0.08)"}}>
                  <div className="text-xs text-slate-500">Revenue</div>
                  <div className="font-black text-yellow-400 text-xl">{fmt(selItem.revenue)}</div>
                </div>
                <div className="p-3 rounded-xl" style={{background:"rgba(255,255,255,0.03)"}}>
                  <div className="text-xs text-slate-500 mb-1">Air Waybill</div>
                  <div className="font-mono font-bold text-white">{selItem.awb}</div>
                </div>
                <div className="space-y-2">
                  {[
                    {l:"Shipper",v:selItem.shipper,icon:"🏭"},
                    {l:"Consignee",v:selItem.consignee,icon:"🏪"},
                    {l:"Weight",v:selItem.weight,icon:"⚖️"},
                    {l:"Pieces",v:`${selItem.pieces}`,icon:"📦"},
                    {l:"Volume",v:selItem.volume,icon:"📐"},
                    {l:"Temperature",v:selItem.temp,icon:"🌡️"},
                    {l:"Handler",v:selItem.handler,icon:"👷"},
                  ].map(({l,v,icon})=>(
                    <div key={l} className="flex items-center gap-2 p-2 rounded-xl"
                      style={{background:"rgba(255,255,255,0.03)"}}>
                      <span className="w-4 text-sm">{icon}</span>
                      <span className="text-slate-400 text-xs flex-1">{l}</span>
                      <span className="font-semibold text-white text-xs">{v}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase mb-2">Tracking History</div>
                  {selItem.tracking.map((step,i)=>{
                    const isLast=i===selItem.tracking.length-1;
                    return(
                      <div key={i} className="flex items-center gap-2 py-1.5">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isLast?"animate-pulse":""}` }
                          style={{background:isLast?C:i<selItem.tracking.length-1?"#22c55e":"#475569"}}/>
                        <span className={`text-xs ${isLast?"text-white font-bold":"text-slate-400"}`}>{step}</span>
                        {isLast&&<span className="text-xs ml-auto" style={{color:C}}>NOW</span>}
                      </div>
                    );
                  })}
                </div>
                <div className="space-y-2">
                  {[
                    {icon:<Shield className="w-3.5 h-3.5"/>,label:"Security Clearance"},
                    {icon:<Thermometer className="w-3.5 h-3.5"/>,label:"Temperature Log"},
                    {icon:<MapPin className="w-3.5 h-3.5"/>,label:"Update Location"},
                    {icon:<TrendingUp className="w-3.5 h-3.5"/>,label:"Full Tracking History"},
                  ].map(({icon,label})=>(
                    <button key={label}
                      className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm text-slate-300 hover:text-white transition-all"
                      style={{background:`${C}06`,borderColor:`${C}20`}}>
                      <span style={{color:C}}>{icon}</span>{label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════ DELIVERED ════ */}
      {tab==="delivered" && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {[
              {l:"Delivered Today",v:delivered.length,c:"#22c55e"},
              {l:"Total Weight",   v:`${(delivered.reduce((s,c)=>s+c.weightKg,0)/1000).toFixed(1)}t`,c:"#0ea5e9"},
              {l:"Revenue Earned", v:fmt(delivRev),  c:"#f59e0b"},
            ].map(({l,v,c})=>(
              <div key={l} className="rounded-2xl p-5 border text-center"
                style={{background:`${c}08`,borderColor:`${c}20`}}>
                <div className="text-2xl font-black" style={{color:c}}>{v}</div>
                <div className="text-sm text-slate-400 mt-1">{l}</div>
              </div>
            ))}
          </div>
          {delivered.map(item=>(
            <div key={item.id} className="bg-navy-800 rounded-2xl p-5 border border-navy-600">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{TYPE_ICONS[item.type]||"📦"}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold" style={{color:C}}>{item.id}</span>
                      <span className="text-slate-400 text-sm">{item.flight}</span>
                    </div>
                    <div className="font-semibold text-white">{item.contents}</div>
                    <div className="text-xs text-slate-400">{item.shipper} → {item.consignee}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs px-2.5 py-1 rounded-full border font-bold bg-green-500/15 text-green-400 border-green-500/20">
                    ✅ Delivered
                  </div>
                  <div className="text-xs text-slate-500 mt-1">{item.deliveredAt}</div>
                  <div className="font-bold text-yellow-400 mt-1">{fmt(item.revenue)}</div>
                </div>
              </div>
              <div className="flex items-center gap-1 overflow-x-auto">
                {item.tracking.map((step,i)=>(
                  <div key={i} className="flex items-center gap-1 flex-shrink-0">
                    <div className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-green-400"
                      style={{background:"rgba(34,197,94,0.1)"}}>
                      <span>✓</span>{step}
                    </div>
                    {i<item.tracking.length-1&&<span className="text-slate-600">→</span>}
                  </div>
                ))}
              </div>
            </div>
          ))}
          {delivered.length===0 && (
            <div className="text-center py-12 text-slate-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-30"/>
              <div>No deliveries yet today</div>
            </div>
          )}
        </div>
      )}

      {/* ════ REVENUE ════ */}
      {tab==="revenue" && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              {l:"Total Revenue",      v:fmt(totalRev),  c:C},
              {l:"Delivered Revenue",  v:fmt(delivRev),  c:"#22c55e"},
              {l:"Avg per Shipment",   v:fmt(Math.round(totalRev/Math.max(cargoList.length,1))), c:"#8b5cf6"},
              {l:"Pending Collection", v:fmt(totalRev-delivRev), c:"#f59e0b"},
            ].map(({l,v,c})=>(
              <div key={l} className="rounded-2xl p-5 border"
                style={{background:`${c}08`,borderColor:`${c}20`}}>
                <div className="text-2xl font-black mb-1" style={{color:c}}>{v}</div>
                <div className="text-xs text-slate-500">{l}</div>
              </div>
            ))}
          </div>

          <div className="grid xl:grid-cols-2 gap-5">
            {/* Monthly volume */}
            <div className="bg-navy-800 rounded-2xl p-5 border border-navy-600">
              <h2 className="font-bold text-white mb-4">Monthly Cargo Volume — Tonnes</h2>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={monthly} margin={{left:-20}}>
                  <defs>
                    <linearGradient id="cg2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={C} stopOpacity={0.25}/>
                      <stop offset="95%" stopColor={C} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4d" vertical={false}/>
                  <XAxis dataKey="m" tick={{fill:"#475569",fontSize:11}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fill:"#475569",fontSize:11}} axisLine={false} tickLine={false}/>
                  <Tooltip contentStyle={T}/>
                  <Area type="monotone" dataKey="v" stroke={C} fill="url(#cg2)" strokeWidth={2.5} name="Volume (kg)"/>
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Weekly revenue */}
            <div className="bg-navy-800 rounded-2xl p-5 border border-navy-600">
              <h2 className="font-bold text-white mb-4">Weekly Revenue</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={REV_WEEKLY} margin={{left:-20}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4d" vertical={false}/>
                  <XAxis dataKey="d" tick={{fill:"#475569",fontSize:11}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fill:"#475569",fontSize:11}} axisLine={false} tickLine={false}/>
                  <Tooltip contentStyle={T}/>
                  <Bar dataKey="rev" fill={C} radius={[4,4,0,0]} name="Revenue"/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Revenue per type */}
          <div className="grid xl:grid-cols-2 gap-5">
            <div className="bg-navy-800 rounded-2xl p-5 border border-navy-600">
              <h2 className="font-bold text-white mb-4">Revenue by Cargo Type</h2>
              <div className="space-y-3">
                {["General","Perishable","Dangerous","Valuable","Live Animal","Courier"].map((t,i)=>{
                  const items = cargoList.filter(c=>c.type===t);
                  if(items.length===0) return null;
                  const rev = items.reduce((s,c)=>s+c.revenue,0);
                  const pct = Math.round(rev/totalRev*100);
                  return (
                    <div key={t}>
                      <div className="flex justify-between text-xs mb-1">
                        <div className="flex items-center gap-1.5">
                          <span>{TYPE_ICONS[t]||"📦"}</span>
                          <span className="text-slate-300">{t}</span>
                        </div>
                        <span className="text-yellow-400 font-bold">{fmt(rev)}</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{background:"#1e2d4d"}}>
                        <div className="h-full rounded-full" style={{width:`${pct}%`,background:PIE_COLORS[i%PIE_COLORS.length]}}/>
                      </div>
                    </div>
                  );
                }).filter(Boolean)}
              </div>
            </div>

            {/* Top revenue shipments */}
            <div className="bg-navy-800 rounded-2xl p-5 border border-navy-600">
              <h2 className="font-bold text-white mb-4">Top Revenue Shipments</h2>
              <div className="space-y-3">
                {[...cargoList].sort((a,b)=>b.revenue-a.revenue).slice(0,6).map(item=>(
                  <div key={item.id} className="flex items-center gap-3">
                    <span className="text-lg">{TYPE_ICONS[item.type]||"📦"}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-mono font-bold" style={{color:C}}>{item.id}</div>
                      <div className="text-xs text-slate-400 truncate">{item.contents}</div>
                    </div>
                    <div className="font-bold text-yellow-400 flex-shrink-0">{fmt(item.revenue)}</div>
                    <span className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${STATUS_BADGE[item.status]||""}`}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
