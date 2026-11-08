import { useState, useEffect } from "react";
import { useAppStore } from "../../store/appStore";
import { useAuthStore } from "../../store/authStore";
import {
  Star, AlertTriangle,
  CheckCircle, TrendingUp, TrendingDown,
  Plus, MessageSquare, Shield,
  Download, ChevronRight, Plane,
  ArrowRight, Bell
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";

const TOOLTIP = {background:"#0a0e1a",border:"1px solid #1e3a5f",borderRadius:10,fontSize:11,color:"#e2e8f0"};
const fmt = (v:number) => v>=100000?`₹${(v/100000).toFixed(1)}L`:v>=1000?`₹${(v/1000).toFixed(0)}K`:`₹${v}`;

const STORE_BY_EMAIL: Record<string,{
  id:string;name:string;cat:string;terminal:string;loc:string;
  status:string;rating:number;sq:number;lease:number;leaseExpiry:string;
  warnings:number;contact:string;email:string;gstin:string;openHours:string;staff:number;
}> = {
  "retailer@del.aerobase.in":{
    id:"R010",name:"Aqua Blue Water Bar",cat:"F&B",terminal:"T2",loc:"Departures Level 1",
    status:"Warning",rating:2.1,sq:40,lease:40000,leaseExpiry:"2024-06",
    warnings:3,contact:"9876543219",email:"owner@aquablue.in",gstin:"07JABCL0123N0Z4",
    openHours:"05:00–23:00",staff:3,
  },
  "starbucks@del.aerobase.in":{
    id:"R002",name:"Starbucks DEL T3",cat:"F&B",terminal:"T3",loc:"Level 3",
    status:"Open",rating:4.5,sq:120,lease:120000,leaseExpiry:"2026-03",
    warnings:0,contact:"9876543211",email:"del@starbucks.in",gstin:"07BAACD2345F2Z6",
    openHours:"04:30–23:59",staff:8,
  },
  "kfc@del.aerobase.in":{
    id:"R015",name:"KFC Terminal 2",cat:"F&B",terminal:"T2",loc:"Arrivals Hall",
    status:"Open",rating:4.0,sq:150,lease:150000,leaseExpiry:"2025-12",
    warnings:0,contact:"9876543225",email:"franchisee@kfc.in",gstin:"07KABCM1234O1Z5",
    openHours:"06:00–23:00",staff:12,
  },
};
const DEFAULT_STORE = STORE_BY_EMAIL["retailer@del.aerobase.in"];

const REVENUE_DAILY = [
  {d:"Mon",sales:8200,orders:48},{d:"Tue",sales:7400,orders:43},
  {d:"Wed",sales:9100,orders:54},{d:"Thu",sales:8800,orders:51},
  {d:"Fri",sales:11200,orders:66},{d:"Sat",sales:9600,orders:57},
  {d:"Sun",sales:7800,orders:46},
];
const MONTHLY_REV = [
  {m:"Jan",rev:182000,exp:95000},{m:"Feb",rev:168000,exp:88000},
  {m:"Mar",rev:214000,exp:102000},{m:"Apr",rev:198000,exp:98000},
  {m:"May",rev:228000,exp:110000},{m:"Jun",rev:245000,exp:115000},
];
const CAT_PIE = [
  {name:"Hot Beverages",value:35,color:"#f59e0b"},
  {name:"Cold Drinks",  value:28,color:"#0ea5e9"},
  {name:"Food",         value:22,color:"#22c55e"},
  {name:"Merchandise",  value:15,color:"#8b5cf6"},
];
const TOP_ITEMS = [
  {name:"Caramel Macchiato",sold:312,revenue:120120,trend:"up"},
  {name:"Cold Brew",        sold:248,revenue:85560, trend:"up"},
  {name:"Frappuccino",      sold:196,revenue:71540, trend:"down"},
  {name:"Croissant",        sold:432,revenue:79920, trend:"up"},
  {name:"Chicken Sandwich", sold:168,revenue:49560, trend:"down"},
];
const EXPENSES = [
  {cat:"Monthly Rent",     amount:120000,due:"2024-05-01",status:"Paid",    icon:"🏢"},
  {cat:"Staff Salaries",   amount:85000, due:"2024-04-30",status:"Paid",    icon:"👥"},
  {cat:"Raw Materials",    amount:42000, due:"2024-04-25",status:"Paid",    icon:"📦"},
  {cat:"Electricity Bill", amount:8200,  due:"2024-05-05",status:"Pending", icon:"⚡"},
  {cat:"Airport Levy (2%)",amount:4900,  due:"2024-05-01",status:"Pending", icon:"🏛"},
  {cat:"Cleaning Service", amount:3500,  due:"2024-05-03",status:"Pending", icon:"🧹"},
  {cat:"POS Maintenance",  amount:2000,  due:"2024-05-10",status:"Paid",    icon:"💻"},
  {cat:"Insurance",        amount:5500,  due:"2024-05-15",status:"Upcoming",icon:"🛡"},
];
const STAFF_DATA = [
  {name:"Priya Sharma",role:"Shift Manager",shift:"06:00–14:00",status:"On Duty", salary:28000,rating:4.8,attendance:"97%"},
  {name:"Amit Kumar",  role:"Barista",      shift:"06:00–14:00",status:"On Duty", salary:20000,rating:4.6,attendance:"94%"},
  {name:"Neha Singh",  role:"Barista",      shift:"14:00–22:00",status:"Off Duty",salary:20000,rating:4.5,attendance:"91%"},
  {name:"Raj Patel",   role:"Cashier",      shift:"14:00–22:00",status:"Off Duty",salary:18000,rating:4.3,attendance:"88%"},
  {name:"Sunita Roy",  role:"Cleaner",      shift:"22:00–06:00",status:"Off Duty",salary:14000,rating:4.2,attendance:"95%"},
];
const INVENTORY = [
  {item:"Coffee Beans",    unit:"kg",stock:42, min:20,status:"OK"},
  {item:"Milk (Full Fat)", unit:"L", stock:28, min:30,status:"Low"},
  {item:"Croissants",      unit:"pcs",stock:15,min:20,status:"Low"},
  {item:"Paper Cups 12oz", unit:"pcs",stock:420,min:200,status:"OK"},
  {item:"Syrups (Caramel)",unit:"bot",stock:4, min:5, status:"Low"},
  {item:"Napkins",         unit:"pck",stock:22,min:15,status:"OK"},
];
const COMPLIANCE = [
  {doc:"FSSAI License",      expiry:"2025-03-31",status:"Valid",    daysLeft:340},
  {doc:"GST Registration",   expiry:"Permanent",  status:"Valid",   daysLeft:9999},
  {doc:"Fire Safety NOC",    expiry:"2024-09-30", status:"Expiring",daysLeft:163},
  {doc:"Health Trade License",expiry:"2024-06-30",status:"Expiring",daysLeft:71},
  {doc:"Shop & Est. Act",    expiry:"2024-12-31", status:"Valid",   daysLeft:254},
];
const NOTICES = [
  {id:"N001",date:"2024-04-22",type:"Warning",  msg:"Customer complaints exceeded threshold. Improve service quality within 7 days.",read:false},
  {id:"N002",date:"2024-04-18",type:"Warning",  msg:"Rating 2.1/5 below minimum 3.0. Immediate action required.",read:false},
  {id:"N003",date:"2024-04-10",type:"Info",     msg:"Airport quarterly inspection on 2024-05-05. Ensure all certifications ready.",read:true},
  {id:"N004",date:"2024-04-01",type:"Reminder", msg:"GST Q1 filing due 2024-04-15.",read:true},
];
const RETAILER_PERKS = [
  {icon:"✈", title:"Discounted Flights",       desc:"30% off on all domestic flights for you & 1 companion",    cta:"Book Now",     color:"#0ea5e9"},
  {icon:"🛋", title:"VIP Lounge Access",        desc:"Complimentary T3 Maharaja Lounge access — 2 passes/month", cta:"Use Now",      color:"#8b5cf6"},
  {icon:"🎫", title:"Priority Check-in",        desc:"Skip queue — dedicated retailer check-in counter at T3",   cta:"Learn More",   color:"#14b8a6"},
  {icon:"🎁", title:"Festival Gift Vouchers",   desc:"₹5,000 airport shopping vouchers every quarter",           cta:"Claim",        color:"#f59e0b"},
  {icon:"🅿", title:"Free Parking — P3",        desc:"Complimentary parking spot in P3 (value ₹8,000/mo)",       cta:"Register Car", color:"#22c55e"},
  {icon:"🏥", title:"Airport Medical Priority", desc:"Priority access to airport medical bay for you & staff",   cta:"Register",     color:"#ec4899"},
];
const AVAILABLE_FLIGHTS = [
  {id:"F1",flight:"AI-101",airline:"Air India",from:"DEL",to:"BOM",dep:"10:30",arr:"12:40",
   original:4299,retailer:2999,seats:6,aircraft:"Boeing 787"},
  {id:"F2",flight:"6E-2341",airline:"IndiGo",from:"DEL",to:"BLR",dep:"11:00",arr:"13:15",
   original:3199,retailer:2249,seats:4,aircraft:"A320neo"},
  {id:"F3",flight:"EK-511",airline:"Emirates",from:"DEL",to:"DXB",dep:"16:00",arr:"18:30",
   original:18999,retailer:13999,seats:2,aircraft:"A380"},
];
const REVIEWS = [
  {name:"Rahul S.",rating:5,comment:"Best coffee in airport! Very friendly staff.",    date:"2 days ago",replied:true},
  {name:"Priya M.",rating:4,comment:"Good but a bit expensive. Long queue sometimes.", date:"3 days ago",replied:false},
  {name:"Anil K.", rating:2,comment:"Warm water, slow service. Needs improvement.",   date:"5 days ago",replied:false},
  {name:"Meera J.",rating:1,comment:"Order was wrong. Very disappointed.",             date:"1 week ago",replied:false},
];
const ORDERS_LIVE = [
  {id:"ORD-4421",item:"Caramel Macchiato × 2",gate:"A1",time:"2 min ago",status:"Preparing"},
  {id:"ORD-4420",item:"Croissant + Cold Brew", gate:"B3",time:"5 min ago",status:"Delivered"},
  {id:"ORD-4419",item:"Frappuccino × 3",       gate:"C2",time:"8 min ago",status:"Out for delivery"},
];

const TABS = [
  {k:"overview",    l:"📊 Dashboard"},
  {k:"financials",  l:"💰 Financials"},
  {k:"staff",       l:"👥 Staff"},
  {k:"inventory",   l:"📦 Inventory"},
  {k:"orders",      l:"🛍 Live Orders"},
  {k:"reviews",     l:"⭐ Reviews"},
  {k:"compliance",  l:"📋 Compliance"},
  {k:"notices",     l:"🔔 Notices"},
  {k:"perks",       l:"🎁 My Perks"},
  {k:"flights",     l:"✈ Book Flight"},
  {k:"expand",      l:"📐 Apply/Expand"},
] as const;
type Tab = typeof TABS[number]["k"];

export function RetailerDashboard() {
  const { user }          = useAuthStore();
  const { setActivePage } = useAppStore();
  const [tab,       setTab]     = useState<Tab>("overview");
  const [notices,   setNotices] = useState(NOTICES);
  const [applied,   setApplied] = useState(false);
  const [bookFlight,setBookFlight]= useState<typeof AVAILABLE_FLIGHTS[0]|null>(null);
  const [bookDone,  setBookDone]= useState(false);
  const [showReply, setShowReply]= useState<string|null>(null);
  const [replyText, setReplyText]= useState("");
  const [liveOrders,setLiveOrd] = useState(ORDERS_LIVE);
  const [applyForm, setApplyForm]= useState({type:"Expand Current Space",sqft:"",terminal:"T3",reason:"",budget:"",timeline:""});

  const email = user?.email||"retailer@del.aerobase.in";
  const store  = STORE_BY_EMAIL[email]||DEFAULT_STORE;
  const stColor= store.status==="Open"?"#22c55e":store.status==="Warning"?"#f59e0b":"#ef4444";

  useEffect(()=>{
    const t = setInterval(()=>{
      setLiveOrd(prev=>[{
        id:`ORD-${4422+Math.floor(Math.random()*100)}`,
        item:["Caramel Latte","Cold Brew","Muffin + Juice","Frappuccino × 2"][Math.floor(Math.random()*4)],
        gate:["A1","B3","C2","D1"][Math.floor(Math.random()*4)],
        time:"just now",status:"Preparing"
      },...prev.slice(0,4)]);
    },8000);
    return ()=>clearInterval(t);
  },[]);

  const weekRev    = REVENUE_DAILY.reduce((s,d)=>s+d.sales,0);
  const weekOrders = REVENUE_DAILY.reduce((s,d)=>s+d.orders,0);
  const monthExp   = EXPENSES.reduce((s,e)=>s+e.amount,0);
  const pendingExp = EXPENSES.filter(e=>e.status==="Pending").reduce((s,e)=>s+e.amount,0);
  const lowStock   = INVENTORY.filter(i=>i.status==="Low").length;
  const expiring   = COMPLIANCE.filter(c=>c.status==="Expiring").length;
  const unread     = notices.filter(n=>!n.read).length;

  const markRead = (id:string) => setNotices(prev=>prev.map(n=>n.id===id?{...n,read:true}:n));

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏪</span>
            <div>
              <h1 className="text-2xl font-bold text-white">{store.name}</h1>
              <p className="text-slate-400 text-sm">{store.terminal} · {store.loc} · {store.id}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border"
            style={{background:"rgba(34,197,94,0.06)",borderColor:"rgba(34,197,94,0.2)"}}>
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"/>
            <div className="text-xs">
              <div className="text-slate-500">Live Orders</div>
              <div className="font-black text-green-400">{liveOrders.filter(o=>o.status==="Preparing").length} active</div>
            </div>
          </div>
          <div className="px-4 py-2 rounded-xl border text-sm font-bold"
            style={{background:`${stColor}10`,borderColor:`${stColor}30`,color:stColor}}>
            {store.status==="Warning"?"⚠️ Warning":store.status==="Open"?"✓ Open":"✗ Closed"}
          </div>
          {unread>0 && (
            <button onClick={()=>setTab("notices")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold"
              style={{background:"rgba(239,68,68,0.1)",borderColor:"rgba(239,68,68,0.3)",color:"#f87171"}}>
              <Bell className="w-3.5 h-3.5"/>{unread} new notice{unread!==1?"s":""}
            </button>
          )}
        </div>
      </div>

      {/* ── Warning banner ── */}
      {store.warnings>0 && (
        <div className="p-5 rounded-2xl border"
          style={{background:"rgba(239,68,68,0.07)",borderColor:"rgba(239,68,68,0.3)"}}>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-400"/>
            <span className="font-bold text-red-300">{store.warnings} Airport Authority Warning{store.warnings!==1?"s":""}</span>
          </div>
          <div className="text-sm text-red-400/80 space-y-1">
            <div>• Customer complaint threshold exceeded — address quality issues immediately</div>
            <div>• Rating {store.rating}/5 is below minimum requirement of 3.0</div>
            {store.warnings>=3 && (
              <div className="font-bold text-red-300">
                ⛔ FINAL WARNING: Next violation = immediate suspension
              </div>
            )}
          </div>
          <button onClick={()=>setTab("notices")}
            className="mt-3 text-xs px-3 py-1.5 rounded-lg font-semibold"
            style={{background:"rgba(239,68,68,0.15)",color:"#fca5a5"}}>
            View all notices →
          </button>
        </div>
      )}

      {/* ── KPI strip ── */}
      <div className="grid grid-cols-3 xl:grid-cols-6 gap-3">
        {[
          {l:"Week Revenue",    v:fmt(weekRev),    color:"#f97316",note:"+8.2%"},
          {l:"Orders",         v:weekOrders,       color:"#0ea5e9",note:`${Math.round(weekOrders/7)}/day avg`},
          {l:"Rating",         v:`${store.rating}/5`,color:store.rating<3?"#ef4444":"#22c55e",note:store.rating<3?"Below min":"Good"},
          {l:"Pending Bills",  v:fmt(pendingExp),  color:"#f59e0b",note:`${EXPENSES.filter(e=>e.status==="Pending").length} bills`},
          {l:"Low Stock",      v:lowStock,          color:lowStock>0?"#f59e0b":"#22c55e",note:lowStock>0?"Reorder":"All OK"},
          {l:"Docs Expiring",  v:expiring,          color:expiring>0?"#ef4444":"#22c55e",note:expiring>0?"Action!":"All valid"},
        ].map(({l,v,color,note})=>(
          <div key={l} className="rounded-2xl p-4 border"
            style={{background:`${color}08`,borderColor:`${color}20`}}>
            <div className="text-xl font-black mb-0.5" style={{color}}>{v}</div>
            <div className="text-xs text-slate-500">{l}</div>
            <div className="text-xs mt-0.5" style={{color}}>{note}</div>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 p-1 rounded-2xl overflow-x-auto"
        style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)"}}>
        {TABS.map(({k,l})=>(
          <button key={k} onClick={()=>setTab(k)}
            className="flex-shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all relative"
            style={tab===k
              ?{background:"linear-gradient(135deg,#f97316,#ea580c)",color:"white"}
              :{color:"#64748b"}}>
            {l}
            {k==="notices"&&unread>0&&(
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                {unread}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ════ OVERVIEW ════ */}
      {tab==="overview" && (
        <div className="space-y-5">
          {/* Quick nav */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
            {[
              {l:"Airport Map",      icon:"🗺",  action:()=>setActivePage("map"),    color:"#0ea5e9"},
              {l:"Live Flights",     icon:"✈",   action:()=>setActivePage("flights"),color:"#14b8a6"},
              {l:"Book Flight",      icon:"🎫",  action:()=>setTab("flights"),       color:"#f97316"},
              {l:"My Retailer Perks",icon:"🎁",  action:()=>setTab("perks"),         color:"#8b5cf6"},
            ].map(({l,icon,action,color})=>(
              <button key={l} onClick={action}
                className="flex items-center gap-3 p-4 rounded-2xl border text-left hover:scale-[1.01] transition-all"
                style={{background:`${color}08`,borderColor:`${color}20`}}>
                <span className="text-3xl">{icon}</span>
                <div>
                  <div className="font-bold text-white text-sm">{l}</div>
                  <ChevronRight className="w-3 h-3 text-slate-600 mt-0.5"/>
                </div>
              </button>
            ))}
          </div>

          {/* Revenue + live orders */}
          <div className="grid xl:grid-cols-3 gap-5">
            <div className="xl:col-span-2 bg-navy-800 rounded-2xl p-5 border border-navy-600">
              <div className="flex justify-between mb-3">
                <h2 className="font-bold text-white">Daily Sales This Week</h2>
                <div className="text-right">
                  <div className="font-black text-white">{fmt(weekRev)}</div>
                  <div className="text-xs text-green-400 flex items-center gap-1 justify-end">
                    <TrendingUp className="w-3 h-3"/>+8.2%
                  </div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={REVENUE_DAILY} margin={{left:-20}}>
                  <defs>
                    <linearGradient id="og" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#f97316" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4d" vertical={false}/>
                  <XAxis dataKey="d" tick={{fill:"#475569",fontSize:11}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fill:"#475569",fontSize:11}} axisLine={false} tickLine={false}/>
                  <Tooltip contentStyle={TOOLTIP} formatter={(v:any)=>[fmt(v)]}/>
                  <Area type="monotone" dataKey="sales" stroke="#f97316" fill="url(#og)" strokeWidth={2.5} name="Sales"/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-navy-800 rounded-2xl p-5 border border-navy-600">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"/>
                <h2 className="font-bold text-white text-sm">Live Orders</h2>
              </div>
              <div className="space-y-3">
                {liveOrders.slice(0,4).map((o,i)=>(
                  <div key={i} className="p-3 rounded-xl border"
                    style={{
                      background:o.status==="Preparing"?"rgba(249,115,22,0.08)":"rgba(255,255,255,0.02)",
                      borderColor:o.status==="Preparing"?"rgba(249,115,22,0.3)":"rgba(255,255,255,0.06)"
                    }}>
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="font-mono font-bold text-orange-300">{o.id}</span>
                      <span className="text-slate-500">{o.time}</span>
                    </div>
                    <div className="text-sm font-medium text-white truncate">{o.item}</div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-slate-400">Gate {o.gate}</span>
                      <span className={`text-xs font-semibold ${o.status==="Preparing"?"text-orange-400":o.status==="Delivered"?"text-green-400":"text-sky-400"}`}>
                        {o.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top items + category split */}
          <div className="grid xl:grid-cols-2 gap-5">
            <div className="bg-navy-800 rounded-2xl p-5 border border-navy-600">
              <h2 className="font-bold text-white mb-4">Top Selling Items</h2>
              <div className="space-y-3">
                {TOP_ITEMS.map((item,i)=>(
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-6 text-xs text-slate-600 font-bold">{i+1}.</div>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-200">{item.name}</span>
                        <div className="flex items-center gap-2">
                          {item.trend==="up"
                            ?<TrendingUp className="w-3 h-3 text-green-400"/>
                            :<TrendingDown className="w-3 h-3 text-red-400"/>}
                          <span className="font-bold text-white">{fmt(item.revenue)}</span>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{background:"#1e2d4d"}}>
                        <div className="h-full rounded-full" style={{
                          width:`${(item.sold/432)*100}%`,
                          background:"linear-gradient(90deg,#f97316,#fb923c)"
                        }}/>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-navy-800 rounded-2xl p-5 border border-navy-600">
              <h2 className="font-bold text-white mb-2">Sales by Category</h2>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={CAT_PIE} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                    dataKey="value" stroke="none">
                    {CAT_PIE.map((e,i)=><Cell key={i} fill={e.color}/>)}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP} formatter={(v:any)=>[`${v}%`]}/>
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-1.5 mt-2">
                {CAT_PIE.map(({name,value,color})=>(
                  <div key={name} className="flex items-center gap-1.5 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{background:color}}/>
                    <span className="text-slate-400">{name}</span>
                    <span className="font-bold text-white ml-auto">{value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Store info */}
          <div className="bg-navy-800 rounded-2xl p-5 border border-navy-600">
            <h2 className="font-bold text-white mb-4">Store Details</h2>
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
              {[
                {l:"Monthly Rent",v:fmt(store.lease)},{l:"Lease Expiry",v:store.leaseExpiry},
                {l:"Floor Area",  v:`${store.sq} m²`},{l:"GSTIN",v:store.gstin},
                {l:"Hours",v:store.openHours},{l:"Category",v:store.cat},
                {l:"Terminal",v:store.terminal},{l:"Phone",v:store.contact},
              ].map(({l,v})=>(
                <div key={l} className="p-3 rounded-xl" style={{background:"rgba(255,255,255,0.03)"}}>
                  <div className="text-xs text-slate-500 mb-0.5">{l}</div>
                  <div className="font-bold text-white text-sm">{v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ════ FINANCIALS ════ */}
      {tab==="financials" && (
        <div className="space-y-5">
          {/* P&L summary */}
          <div className="grid grid-cols-3 gap-4">
            {[
              {l:"Monthly Revenue",  v:fmt(MONTHLY_REV[5].rev),  color:"#22c55e",note:"June 2024"},
              {l:"Monthly Expenses", v:fmt(monthExp),             color:"#ef4444",note:"All costs"},
              {l:"Net Profit",       v:fmt(MONTHLY_REV[5].rev-monthExp),color:MONTHLY_REV[5].rev>monthExp?"#22c55e":"#ef4444",note:"This month"},
            ].map(({l,v,color,note})=>(
              <div key={l} className="rounded-2xl p-5 border text-center"
                style={{background:`${color}06`,borderColor:`${color}20`}}>
                <div className="text-2xl font-black mb-0.5" style={{color}}>{v}</div>
                <div className="text-sm font-semibold text-white">{l}</div>
                <div className="text-xs text-slate-500 mt-0.5">{note}</div>
              </div>
            ))}
          </div>

          {/* Revenue vs Expenses chart */}
          <div className="bg-navy-800 rounded-2xl p-5 border border-navy-600">
            <h2 className="font-bold text-white mb-4">Revenue vs Expenses — 6 Months</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={MONTHLY_REV} margin={{left:10}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4d" vertical={false}/>
                <XAxis dataKey="m" tick={{fill:"#475569",fontSize:11}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fill:"#475569",fontSize:11}} axisLine={false} tickLine={false} tickFormatter={fmt}/>
                <Tooltip contentStyle={TOOLTIP} formatter={(v:any)=>[fmt(v)]}/>
                <Bar dataKey="rev" name="Revenue"  fill="#22c55e" radius={[4,4,0,0]}/>
                <Bar dataKey="exp" name="Expenses" fill="#ef4444" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Expense list */}
          <div className="bg-navy-800 rounded-2xl border border-navy-600 overflow-hidden">
            <div className="p-5 border-b border-navy-600 flex justify-between">
              <h2 className="font-bold text-white">Bills & Expenses</h2>
              {pendingExp>0 && (
                <span className="text-xs px-3 py-1 rounded-full font-bold"
                  style={{background:"rgba(245,158,11,0.15)",color:"#fbbf24"}}>
                  {fmt(pendingExp)} pending payment
                </span>
              )}
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr style={{borderBottom:"1px solid #1e2d4d"}}>
                  {["Category","Amount","Due Date","Status","Action"].map(h=>(
                    <th key={h} className="px-5 py-3 text-left text-xs uppercase" style={{color:"#475569"}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {EXPENSES.map((e,i)=>(
                  <tr key={i} className={e.status==="Pending"?"bg-yellow-500/3":""}
                    style={{borderBottom:"1px solid rgba(30,45,77,0.5)"}}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{e.icon}</span>
                        <span className="font-semibold text-white">{e.cat}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-black font-mono text-white">{fmt(e.amount)}</td>
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-400">{e.due}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                        e.status==="Paid"?"bg-green-500/15 text-green-400":
                        e.status==="Pending"?"bg-yellow-500/15 text-yellow-400":
                        "bg-sky-500/15 text-sky-400"}`}>
                        {e.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {e.status==="Pending" && (
                        <button className="text-xs bg-sky-500/15 text-sky-400 border border-sky-500/20 px-3 py-1.5 rounded-lg hover:bg-sky-500/25 transition-colors">
                          Pay Now
                        </button>
                      )}
                      {e.status==="Paid" && (
                        <button className="flex items-center gap-1 text-xs text-slate-400 hover:text-white">
                          <Download className="w-3 h-3"/>Receipt
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{borderTop:"1px solid #1e2d4d",background:"rgba(249,115,22,0.04)"}}>
                  <td className="px-5 py-4 font-bold text-white">Total Monthly</td>
                  <td className="px-5 py-4 font-black text-orange-400 text-lg">{fmt(monthExp)}</td>
                  <td colSpan={3}/>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ════ STAFF ════ */}
      {tab==="staff" && (
        <div className="space-y-4">
          <div className="flex justify-between">
            <h2 className="font-bold text-white">Staff Roster — {store.staff} employees</h2>
            <button className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl font-semibold text-white"
              style={{background:"linear-gradient(135deg,#f97316,#ea580c)"}}>
              <Plus className="w-4 h-4"/>Add Staff
            </button>
          </div>
          <div className="grid xl:grid-cols-2 gap-3">
            {STAFF_DATA.map((s,i)=>(
              <div key={i} className="bg-navy-800 rounded-2xl p-4 border border-navy-600">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center font-black text-white"
                    style={{background:"rgba(249,115,22,0.2)"}}>
                    {s.name.split(" ").map(n=>n[0]).join("")}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-white">{s.name}</div>
                    <div className="text-xs text-slate-400">{s.role}</div>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                    s.status==="On Duty"?"bg-green-500/15 text-green-400":"bg-slate-500/15 text-slate-400"}`}>
                    {s.status}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    {l:"Salary",   v:`₹${(s.salary/1000).toFixed(0)}K`},
                    {l:"Attendance",v:s.attendance},
                    {l:"Shift",    v:s.shift.split("–")[0]},
                  ].map(({l,v})=>(
                    <div key={l} className="p-2 rounded-xl" style={{background:"rgba(255,255,255,0.03)"}}>
                      <div className="text-xs text-slate-500">{l}</div>
                      <div className="font-bold text-white text-sm">{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="bg-navy-800 rounded-2xl p-4 border border-navy-600">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Total Monthly Payroll</span>
              <span className="font-black text-white">{fmt(STAFF_DATA.reduce((s,st)=>s+st.salary,0))}</span>
            </div>
          </div>
        </div>
      )}

      {/* ════ INVENTORY ════ */}
      {tab==="inventory" && (
        <div className="space-y-4">
          {lowStock>0 && (
            <div className="p-4 rounded-2xl border flex items-center gap-3"
              style={{background:"rgba(245,158,11,0.08)",borderColor:"rgba(245,158,11,0.25)"}}>
              <AlertTriangle className="w-5 h-5 text-yellow-400"/>
              <div>
                <div className="font-semibold text-yellow-300">{lowStock} items need reorder</div>
                <div className="text-xs text-yellow-400/70">Contact your suppliers immediately</div>
              </div>
            </div>
          )}
          <div className="bg-navy-800 rounded-2xl border border-navy-600 overflow-hidden">
            <div className="p-5 border-b border-navy-600 flex justify-between">
              <h2 className="font-bold text-white">Stock Levels</h2>
              <button className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold"
                style={{background:"rgba(249,115,22,0.12)",color:"#fb923c"}}>
                <Download className="w-3 h-3"/>Export
              </button>
            </div>
            <div className="divide-y divide-navy-700">
              {INVENTORY.map((item,i)=>(
                <div key={i} className={`flex items-center gap-4 px-5 py-4 ${item.status==="Low"?"bg-yellow-500/3":""}`}>
                  <div className="flex-1">
                    <div className="font-semibold text-white">{item.item}</div>
                    <div className="text-xs text-slate-500">Min: {item.min} {item.unit}</div>
                  </div>
                  <div className="text-center w-24">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{background:"#1e2d4d"}}>
                        <div className="h-full rounded-full" style={{
                          width:`${Math.min(item.stock/item.min*100,100)}%`,
                          background:item.stock<item.min?"#ef4444":"#22c55e"
                        }}/>
                      </div>
                    </div>
                    <div className="text-xs text-slate-400">{item.stock} / {item.min} {item.unit}</div>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold w-24 text-center ${
                    item.status==="Low"?"bg-yellow-500/15 text-yellow-400":"bg-green-500/15 text-green-400"}`}>
                    {item.status==="Low"?"⚠ Reorder":"✓ OK"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ════ LIVE ORDERS ════ */}
      {tab==="orders" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"/>
            <h2 className="font-bold text-white">Live Order Feed</h2>
          </div>
          <div className="space-y-3">
            {liveOrders.map((o,i)=>(
              <div key={i} className="rounded-2xl border p-4 transition-all"
                style={{
                  background:o.status==="Preparing"?"rgba(249,115,22,0.08)":"rgba(15,22,41,0.8)",
                  borderColor:o.status==="Preparing"?"rgba(249,115,22,0.3)":"rgba(255,255,255,0.06)"
                }}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono font-bold text-orange-300 text-sm">{o.id}</span>
                      <span className="text-xs text-slate-500">{o.time}</span>
                    </div>
                    <div className="font-semibold text-white">{o.item}</div>
                    <div className="text-xs text-slate-400 mt-0.5">Deliver to Gate {o.gate}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${
                      o.status==="Preparing"?"text-orange-400":
                      o.status==="Delivered"?"text-green-400":"text-sky-400"}`}>
                      {o.status==="Preparing"?"🔥":o.status==="Delivered"?"✅":"🚶"} {o.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ════ REVIEWS ════ */}
      {tab==="reviews" && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl border text-center"
              style={{
                background:store.rating<3?"rgba(239,68,68,0.06)":"rgba(34,197,94,0.06)",
                borderColor:store.rating<3?"rgba(239,68,68,0.2)":"rgba(34,197,94,0.2)"
              }}>
              <div className="text-3xl font-black" style={{color:store.rating<3?"#ef4444":"#22c55e"}}>
                {store.rating}
              </div>
              <div className="text-xs text-slate-400">/ 5.0</div>
              <div className="flex gap-0.5 mt-1 justify-center">
                {[1,2,3,4,5].map(s=>(
                  <Star key={s} className={`w-3.5 h-3.5 ${s<=Math.round(store.rating)?"fill-yellow-400 text-yellow-400":"text-slate-600"}`}/>
                ))}
              </div>
            </div>
            {store.rating<3 && (
              <div className="flex-1 p-4 rounded-xl" style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)"}}>
                <div className="font-bold text-red-300 mb-1">⚠️ Rating Below Airport Minimum (3.0)</div>
                <div className="text-xs text-red-400/80">
                  Reply to all negative reviews and take visible corrective action.
                  You have 2 weeks before possible suspension.
                </div>
              </div>
            )}
          </div>
          <div className="space-y-3">
            {REVIEWS.map((r,i)=>(
              <div key={i} className="bg-navy-800 rounded-2xl p-5 border border-navy-600">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center font-bold text-orange-300 text-xs">
                      {r.name[0]}
                    </div>
                    <div>
                      <div className="font-semibold text-white text-sm">{r.name}</div>
                      <div className="text-xs text-slate-500">{r.date}</div>
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(s=>(
                      <Star key={s} className={`w-3.5 h-3.5 ${s<=r.rating?"fill-yellow-400 text-yellow-400":"text-slate-600"}`}/>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-slate-300 mb-3">{r.comment}</p>
                {r.replied
                  ? <div className="text-xs text-green-400 flex items-center gap-1"><CheckCircle className="w-3 h-3"/>Replied</div>
                  : showReply===String(i)
                    ? <div className="space-y-2">
                        <textarea value={replyText} onChange={e=>setReplyText(e.target.value)} rows={2}
                          placeholder="Write a professional response..."
                          className="w-full rounded-xl px-3 py-2 text-xs text-white outline-none border resize-none"
                          style={{background:"rgba(255,255,255,0.05)",borderColor:"rgba(249,115,22,0.3)"}}/>
                        <div className="flex gap-2">
                          <button onClick={()=>{setShowReply(null);setReplyText("");}}
                            className="text-xs px-3 py-1.5 rounded-lg text-white font-semibold"
                            style={{background:"linear-gradient(135deg,#f97316,#ea580c)"}}>
                            Post Reply
                          </button>
                          <button onClick={()=>setShowReply(null)} className="text-xs text-slate-400">Cancel</button>
                        </div>
                      </div>
                    : <button onClick={()=>setShowReply(String(i))}
                        className="text-xs flex items-center gap-1 text-orange-400 hover:text-orange-300">
                        <MessageSquare className="w-3 h-3"/>Reply
                      </button>
                }
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ════ COMPLIANCE ════ */}
      {tab==="compliance" && (
        <div className="space-y-4">
          {expiring>0 && (
            <div className="p-4 rounded-2xl border flex items-center gap-3"
              style={{background:"rgba(239,68,68,0.08)",borderColor:"rgba(239,68,68,0.25)"}}>
              <Shield className="w-5 h-5 text-red-400 flex-shrink-0"/>
              <div>
                <div className="font-semibold text-red-300">{expiring} document{expiring!==1?"s":""} expiring soon</div>
                <div className="text-xs text-red-400/70">Renew before expiry to avoid shop closure by airport authority</div>
              </div>
            </div>
          )}
          <div className="space-y-3">
            {COMPLIANCE.map((c,i)=>(
              <div key={i} className="bg-navy-800 rounded-2xl p-4 border border-navy-600 flex items-center gap-4">
                <div className="flex-1">
                  <div className="font-semibold text-white">{c.doc}</div>
                  <div className="text-xs text-slate-400 mt-0.5">Expiry: {c.expiry}</div>
                </div>
                <div className="text-center">
                  <div className={`font-bold text-sm ${c.daysLeft<180?"text-red-400":c.daysLeft<365?"text-yellow-400":"text-green-400"}`}>
                    {c.daysLeft===9999?"Permanent":`${c.daysLeft}d`}
                  </div>
                  <div className="text-xs text-slate-500">left</div>
                </div>
                <span className={`text-xs px-3 py-1.5 rounded-full font-semibold ${
                  c.status==="Valid"?"bg-green-500/15 text-green-400":"bg-red-500/15 text-red-400"}`}>
                  {c.status}
                </span>
                <button className="text-xs flex items-center gap-1 text-sky-400 hover:text-sky-300">
                  <Download className="w-3 h-3"/>
                  {c.status==="Expiring"?"Renew":"Download"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ════ NOTICES ════ */}
      {tab==="notices" && (
        <div className="space-y-3">
          <h2 className="font-bold text-white">Airport Authority Notices & Emails</h2>
          {notices.map(n=>(
            <div key={n.id} onClick={()=>markRead(n.id)}
              className="rounded-2xl border p-5 cursor-pointer transition-all"
              style={{
                borderColor:!n.read?n.type==="Warning"?"rgba(239,68,68,0.4)":"rgba(56,189,248,0.3)":"rgba(255,255,255,0.06)",
                background:!n.read?n.type==="Warning"?"rgba(239,68,68,0.05)":"rgba(14,165,233,0.04)":"rgba(15,22,41,0.5)"
              }}>
              <div className="flex items-start gap-3">
                <div className="text-2xl">{n.type==="Warning"?"⚠️":n.type==="Reminder"?"🔔":"ℹ️"}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                      n.type==="Warning"?"bg-red-500/20 text-red-400":
                      n.type==="Reminder"?"bg-yellow-500/20 text-yellow-400":
                      "bg-sky-500/20 text-sky-400"}`}>{n.type}</span>
                    <span className="text-xs text-slate-500">{n.date}</span>
                    {!n.read && <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-bold">NEW</span>}
                  </div>
                  <p className={`text-sm ${n.read?"text-slate-400":"text-slate-200"}`}>{n.msg}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ════ PERKS ════ */}
      {tab==="perks" && (
        <div className="space-y-5">
          <div className="p-5 rounded-2xl border"
            style={{background:"linear-gradient(135deg,rgba(249,115,22,0.12),rgba(234,88,12,0.06))",borderColor:"rgba(249,115,22,0.3)"}}>
            <h2 className="font-black text-white text-xl mb-1">🎁 Your Retailer Privileges</h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              As a valued airport retailer, you and your staff receive exclusive perks.
              These are our way of saying thank you for being part of Delhi IGI Airport's family.
            </p>
          </div>
          <div className="grid xl:grid-cols-2 gap-4">
            {RETAILER_PERKS.map(({icon,title,desc,cta,color})=>(
              <div key={title} className="rounded-2xl border p-5 flex items-start gap-4 hover:scale-[1.01] transition-all"
                style={{background:`${color}08`,borderColor:`${color}20`}}>
                <div className="text-4xl flex-shrink-0">{icon}</div>
                <div className="flex-1">
                  <div className="font-bold text-white mb-1">{title}</div>
                  <div className="text-xs text-slate-400 mb-3 leading-relaxed">{desc}</div>
                  <button className="text-xs px-4 py-2 rounded-xl font-bold transition-all"
                    style={{background:`${color}18`,color,border:`1px solid ${color}30`}}>
                    {cta} →
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Retailer flight booking */}
          <div className="bg-navy-800 rounded-2xl p-5 border border-orange-500/20">
            <h2 className="font-bold text-white mb-1 flex items-center gap-2">
              ✈ Exclusive Retailer Flight Prices
              <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-bold">30% OFF</span>
            </h2>
            <p className="text-xs text-slate-400 mb-4">Book below — exclusive prices for airport retailers only</p>
            <div className="space-y-3">
              {AVAILABLE_FLIGHTS.map(f=>(
                <div key={f.id} className="flex items-center justify-between p-4 rounded-xl border"
                  style={{background:"rgba(255,255,255,0.02)",borderColor:"rgba(255,255,255,0.06)"}}>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono font-bold text-sky-300">{f.flight}</span>
                      <span className="text-xs text-slate-400">{f.airline}</span>
                    </div>
                    <div className="text-sm text-white">{f.from} → {f.to} · {f.dep}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs line-through text-slate-500">₹{f.original.toLocaleString()}</div>
                    <div className="font-black text-orange-400">₹{f.retailer.toLocaleString()}</div>
                    <button onClick={()=>setTab("flights")}
                      className="text-xs px-3 py-1.5 rounded-lg mt-1 font-semibold text-white"
                      style={{background:"linear-gradient(135deg,#f97316,#ea580c)"}}>
                      Book →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ════ FLIGHTS ════ */}
      {tab==="flights" && !bookFlight && !bookDone && (
        <div className="space-y-5">
          <div className="p-4 rounded-2xl border"
            style={{background:"rgba(249,115,22,0.06)",borderColor:"rgba(249,115,22,0.2)"}}>
            <h2 className="font-bold text-orange-300 mb-1">✈ Book Flight — Retailer Rate (30% OFF)</h2>
            <p className="text-xs text-slate-400">Exclusive discounted fares for you and your family/staff</p>
          </div>
          <div className="space-y-3">
            {AVAILABLE_FLIGHTS.map(f=>(
              <div key={f.id} className="bg-navy-800 rounded-2xl p-5 border border-navy-600">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono font-bold text-sky-300 text-xl">{f.flight}</span>
                      <span className="text-slate-400 text-sm">{f.airline}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="font-bold text-white">{f.from}</span>
                      <Plane className="w-4 h-4 text-sky-400"/>
                      <span className="font-bold text-white">{f.to}</span>
                      <span className="text-slate-400">· {f.dep} → {f.arr}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">{f.aircraft} · {f.seats} retailer seats left</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs line-through text-slate-500">₹{f.original.toLocaleString()}</div>
                    <div className="text-2xl font-black text-orange-400">₹{f.retailer.toLocaleString()}</div>
                    <div className="text-xs text-green-400 mb-2">Save ₹{(f.original-f.retailer).toLocaleString()}</div>
                    <button onClick={()=>setBookFlight(f)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                      style={{background:"linear-gradient(135deg,#f97316,#ea580c)"}}>
                      Book <ArrowRight className="w-4 h-4"/>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab==="flights" && bookFlight && !bookDone && (
        <div className="space-y-4">
          <button onClick={()=>setBookFlight(null)} className="text-orange-400 text-sm hover:text-orange-300">← Back</button>
          <div className="p-4 rounded-2xl border" style={{background:"rgba(249,115,22,0.08)",borderColor:"rgba(249,115,22,0.3)"}}>
            <div className="font-bold text-white text-lg">{bookFlight.flight} — {bookFlight.airline}</div>
            <div className="text-slate-400 text-sm">{bookFlight.from} → {bookFlight.to} · {bookFlight.dep}</div>
            <div className="mt-2">
              <span className="text-xs line-through text-slate-500 mr-2">₹{bookFlight.original.toLocaleString()}</span>
              <span className="font-black text-orange-400 text-xl">₹{bookFlight.retailer.toLocaleString()}</span>
              <span className="text-xs text-green-400 ml-2">Retailer rate</span>
            </div>
          </div>
          <div className="bg-navy-800 rounded-2xl p-5 border border-navy-600 space-y-3">
            <h3 className="font-semibold text-white">Passenger Details</h3>
            <div className="grid grid-cols-2 gap-3">
              {["Full Name","ID / Passport","Phone",`Retailer ID (${user?.id||"u010"})`].map(ph=>(
                <div key={ph}>
                  <label className="text-xs text-slate-400 mb-1 block">{ph}</label>
                  <input placeholder={ph}
                    className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none border"
                    style={{background:"rgba(255,255,255,0.05)",borderColor:"rgba(255,255,255,0.1)"}}/>
                </div>
              ))}
            </div>
            {["UPI / PhonePe","Credit / Debit Card","Net Banking"].map(m=>(
              <label key={m} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer"
                style={{background:"rgba(255,255,255,0.02)"}}>
                <input type="radio" name="rp" className="accent-orange-500"/>
                <span className="text-sm text-slate-200">{m}</span>
              </label>
            ))}
            <button onClick={()=>setBookDone(true)}
              className="w-full py-4 rounded-xl font-black text-white"
              style={{background:"linear-gradient(135deg,#f97316,#ea580c)"}}>
              💳 Pay ₹{bookFlight.retailer.toLocaleString()} & Confirm Booking
            </button>
          </div>
        </div>
      )}

      {tab==="flights" && bookDone && (
        <div className="text-center space-y-4 py-8">
          <div className="w-20 h-20 rounded-full bg-orange-500/20 flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-orange-400"/>
          </div>
          <h2 className="text-2xl font-bold text-white">Flight Booked! ✈</h2>
          <p className="text-slate-400">E-ticket sent to {user?.email}</p>
          <div className="p-4 rounded-2xl border inline-block" style={{background:"rgba(249,115,22,0.08)",borderColor:"rgba(249,115,22,0.25)"}}>
            <div className="font-mono font-black text-2xl text-orange-300">
              RET{Date.now().toString().slice(-6)}
            </div>
            <div className="text-xs text-slate-400 mt-1">Booking Reference</div>
          </div>
          <button onClick={()=>{setBookDone(false);setBookFlight(null);}}
            className="block mx-auto px-6 py-2.5 rounded-xl border border-slate-700 text-slate-400 text-sm">
            Book Another
          </button>
        </div>
      )}

      {/* ════ EXPAND / APPLY ════ */}
      {tab==="expand" && !applied && (
        <div className="space-y-5">
          <div className="p-4 rounded-2xl border"
            style={{background:"rgba(249,115,22,0.05)",borderColor:"rgba(249,115,22,0.2)"}}>
            <h2 className="font-bold text-orange-300 mb-1">📐 Space Application</h2>
            <p className="text-xs text-slate-400">Request expansion, new outlet, or relocation. Reviewed in 3-5 business days.</p>
          </div>
          <div className="bg-navy-800 rounded-2xl p-6 border border-navy-600 space-y-4">
            <div className="grid xl:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block font-medium">Request Type</label>
                <select value={applyForm.type} onChange={e=>setApplyForm({...applyForm,type:e.target.value})}
                  className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none border"
                  style={{background:"#0f1629",borderColor:"rgba(255,255,255,0.1)"}}>
                  {["Expand Current Space","New Outlet","Temporary Kiosk","Seasonal Pop-up","Relocate"].map(o=>(
                    <option key={o} style={{background:"#0f1629"}}>{o}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block font-medium">Preferred Terminal</label>
                <select value={applyForm.terminal} onChange={e=>setApplyForm({...applyForm,terminal:e.target.value})}
                  className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none border"
                  style={{background:"#0f1629",borderColor:"rgba(255,255,255,0.1)"}}>
                  {["T1","T2","T3","Any Available"].map(o=>(
                    <option key={o} style={{background:"#0f1629"}}>{o}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block font-medium">Area Required (sq ft)</label>
                <input value={applyForm.sqft} onChange={e=>setApplyForm({...applyForm,sqft:e.target.value})}
                  placeholder="e.g. 200"
                  className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none border"
                  style={{background:"rgba(255,255,255,0.05)",borderColor:"rgba(255,255,255,0.1)"}}/>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block font-medium">Monthly Budget (₹)</label>
                <input value={applyForm.budget} onChange={e=>setApplyForm({...applyForm,budget:e.target.value})}
                  placeholder="e.g. 200000"
                  className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none border"
                  style={{background:"rgba(255,255,255,0.05)",borderColor:"rgba(255,255,255,0.1)"}}/>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block font-medium">Timeline</label>
                <input value={applyForm.timeline} onChange={e=>setApplyForm({...applyForm,timeline:e.target.value})}
                  placeholder="e.g. June 2024"
                  className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none border"
                  style={{background:"rgba(255,255,255,0.05)",borderColor:"rgba(255,255,255,0.1)"}}/>
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block font-medium">Business Proposal</label>
              <textarea value={applyForm.reason} onChange={e=>setApplyForm({...applyForm,reason:e.target.value})}
                rows={4} placeholder="Describe your business plan, expected footfall, why this location..."
                className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none border resize-none"
                style={{background:"rgba(255,255,255,0.05)",borderColor:"rgba(255,255,255,0.1)"}}/>
            </div>
            <button onClick={()=>setApplied(true)}
              className="w-full py-4 rounded-xl font-black text-white"
              style={{background:"linear-gradient(135deg,#f97316,#ea580c)"}}>
              📋 Submit Application to Airport Authority
            </button>
          </div>
        </div>
      )}

            {tab==="expand" && applied && (
        <div className="text-center py-12 space-y-4">
          <div className="w-20 h-20 rounded-full bg-orange-500/20 flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-orange-400"/>
          </div>
          <h2 className="text-2xl font-bold text-white">Application Submitted!</h2>
          <p className="text-slate-400">Airport authority will review within 3-5 business days.</p>
          <div className="p-4 rounded-2xl border inline-block" style={{background:"rgba(249,115,22,0.08)",borderColor:"rgba(249,115,22,0.25)"}}>
            <div className="font-mono font-black text-orange-300">APP-{Date.now().toString().slice(-6)}</div>
          </div>
          <button onClick={()=>setApplied(false)}
            className="block mx-auto px-6 py-2.5 rounded-xl border border-slate-700 text-slate-400 text-sm">
            Submit Another
          </button>
        </div>
      )}
    </div>
  );
}
