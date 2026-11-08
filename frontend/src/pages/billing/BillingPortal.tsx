import { useState, useEffect } from "react";
import { TrendingUp, FileText,
         CheckCircle, Clock, Plus,
         Download, Search, X, BarChart3,
         Shield } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";

const TOOLTIP = {background:"#0a0e1a",border:"1px solid #1e3a5f",borderRadius:10,fontSize:11,color:"#e2e8f0"};

const fmt = (v:number) =>
  v>=10000000?`₹${(v/10000000).toFixed(1)}Cr`:
  v>=100000?`₹${(v/100000).toFixed(1)}L`:
  v>=1000?`₹${(v/1000).toFixed(0)}K`:`₹${v}`;


// ── Invoice / subscription data ───────────────────────────────────────────────
const INVOICES = [
  {id:"INV-2024-047",plan:"Enterprise",amount:1499999,status:"Paid",    date:"2024-04-01",due:"2024-04-01",airports:"DEL,BOM,BLR",period:"April 2024"},
  {id:"INV-2024-046",plan:"Enterprise",amount:1499999,status:"Paid",    date:"2024-03-01",due:"2024-03-01",airports:"DEL,BOM,BLR",period:"March 2024"},
  {id:"INV-2024-045",plan:"Professional",amount:499999,status:"Paid",   date:"2024-04-01",due:"2024-04-01",airports:"HYD,CCU",   period:"April 2024"},
  {id:"INV-2024-044",plan:"Professional",amount:499999,status:"Paid",   date:"2024-03-01",due:"2024-03-01",airports:"HYD,CCU",   period:"March 2024"},
  {id:"INV-2024-043",plan:"Add-on: AI Module",amount:149999,status:"Paid",date:"2024-04-01",due:"2024-04-01",airports:"DEL",    period:"April 2024"},
  {id:"INV-2024-042",plan:"Add-on: DGCA Compliance",amount:99999,status:"Pending",date:"2024-04-15",due:"2024-05-01",airports:"BOM",period:"Q2 2024"},
  {id:"INV-2024-041",plan:"Enterprise",amount:1499999,status:"Paid",    date:"2024-02-01",due:"2024-02-01",airports:"DEL,BOM,BLR",period:"Feb 2024"},
  {id:"INV-2024-040",plan:"Setup Fee",  amount:250000, status:"Paid",   date:"2024-01-15",due:"2024-01-15",airports:"DEL",       period:"One-time"},
];

const SUBSCRIBERS = [
  {airport:"DEL — Delhi IGI",       plan:"Enterprise",   since:"Jan 2024",mrr:1499999,status:"Active",  users:48,flights:1240},
  {airport:"BOM — Mumbai CSI",      plan:"Enterprise",   since:"Mar 2024",mrr:1499999,status:"Active",  users:32,flights:980},
  {airport:"BLR — Bengaluru Kempegowda",plan:"Enterprise",since:"Mar 2024",mrr:1499999,status:"Active",users:28,flights:820},
  {airport:"HYD — Hyderabad RGI",   plan:"Professional", since:"Sep 2023",mrr:499999, status:"Active",  users:12,flights:420},
  {airport:"CCU — Kolkata NSI",     plan:"Professional", since:"Nov 2023",mrr:499999, status:"Trial",   users:8, flights:310},
  {airport:"MAA — Chennai Intl",    plan:"Professional", since:"Apr 2023",mrr:499999, status:"Active",  users:22,flights:680},
  {airport:"AMD — Ahmedabad SVPI",  plan:"Starter",      since:"Oct 2023",mrr:99999,  status:"Suspended",users:8,flights:280},
  {airport:"GOI — Goa Manohar",     plan:"Starter",      since:"Dec 2023",mrr:99999,  status:"Trial",   users:6, flights:190},
];

const MRR_TREND = [
  {m:"Jan",mrr:4200000,churn:0,new:4200000},
  {m:"Feb",mrr:4800000,churn:0,new:600000},
  {m:"Mar",mrr:7600000,churn:0,new:2800000},
  {m:"Apr",mrr:8200000,churn:99999,new:699999},
  {m:"May",mrr:8800000,churn:0,new:600000},
  {m:"Jun",mrr:9600000,churn:0,new:800000},
];

const USAGE_DATA = [
  {name:"DEL",flights:1240,api:84200,storage:"82GB",staff:48},
  {name:"BOM",flights:980, api:62000,storage:"65GB",staff:32},
  {name:"BLR",flights:820, api:54000,storage:"58GB",staff:28},
  {name:"HYD",flights:420, api:28000,storage:"31GB",staff:12},
  {name:"CCU",flights:310, api:18000,storage:"22GB",staff:8},
];

const ADD_ONS = [
  {name:"AI Delay Prediction Module",price:149999,desc:"ML-based flight delay predictions",subscribed:3},
  {name:"DGCA Compliance Suite",     price:99999, desc:"Automated DGCA reporting & audit",subscribed:1},
  {name:"Digital Twin Simulation",   price:249999,desc:"Real-time airport digital twin",  subscribed:2},
  {name:"White-label Branding",      price:79999, desc:"Custom airport branding & domain",subscribed:4},
  {name:"Premium API Access",        price:49999, desc:"Higher rate limits + GraphQL",     subscribed:5},
  {name:"SMS Notification Pack",     price:29999, desc:"10,000 SMS credits/month",        subscribed:6},
];

// ── Passenger Plan Manager (airport-specific) ────────────────────────────────
const DEFAULT_PASSENGER_PLANS = [
  {
    id:"classic", name:"Classic", icon:"⭐", color:"#0ea5e9",
    monthly:999, annual:9990, active:true,
    perks:["Gate food delivery","2× Fast-track security","1× Lounge pass/month","10% duty-free discount","Real-time gate alerts"],
  },
  {
    id:"group", name:"Friends & Group", icon:"👥", color:"#14b8a6",
    monthly:2499, annual:24990, active:true,
    perks:["Group food ordering (4 pax)","4× Fast-track passes/month","Discounted group lounge","Adjacent parking spots","15% group discount"],
  },
  {
    id:"family", name:"Family", icon:"👪", color:"#22c55e",
    monthly:3999, annual:39990, active:true,
    perks:["Priority family food delivery","Unlimited family fast-track","Family lounge access","Free home luggage pickup","Kids play area access"],
  },
  {
    id:"elite", name:"Elite Executive", icon:"👑", color:"#f59e0b",
    monthly:9999, annual:99990, active:false,
    perks:["Tarmac VIP transfer (BMW/Mercedes)","Biometric zero-wait security","Business class upgrade lottery","Unlimited global lounge","24/7 dedicated concierge"],
  },
];

function PassengerPlanManager() {
  const [plans, setPlans]    = useState(DEFAULT_PASSENGER_PLANS.map(p=>({...p})));
  const [editing, setEditing]= useState<string|null>(null);
  const [saved,   setSaved]  = useState(false);
  const [editPerk,setEditPerk]= useState<{planId:string;idx:number}|null>(null);
  const [perkVal, setPerkVal]= useState("");

  const togglePlan = (id:string) =>
    setPlans(prev=>prev.map(p=>p.id===id?{...p,active:!p.active}:p));

  const updatePrice = (id:string,field:"monthly"|"annual",val:string) =>
    setPlans(prev=>prev.map(p=>p.id===id?{...p,[field]:parseInt(val)||0}:p));

  const updateName = (id:string,val:string) =>
    setPlans(prev=>prev.map(p=>p.id===id?{...p,name:val}:p));

  const startPerkEdit = (planId:string,idx:number,current:string) => {
    setEditPerk({planId,idx}); setPerkVal(current);
  };

  const savePerk = () => {
    if(!editPerk) return;
    setPlans(prev=>prev.map(p=>p.id===editPerk.planId?{
      ...p, perks:p.perks.map((pk,i)=>i===editPerk.idx?perkVal:pk)
    }:p));
    setEditPerk(null); setPerkVal("");
  };

  const addPerk = (planId:string) =>
    setPlans(prev=>prev.map(p=>p.id===planId?{...p,perks:[...p.perks,"New perk — click to edit"]}:p));

  const removePerk = (planId:string,idx:number) =>
    setPlans(prev=>prev.map(p=>p.id===planId?{...p,perks:p.perks.filter((_,i)=>i!==idx)}:p));

  const saveChanges = () => { setSaved(true); setTimeout(()=>setSaved(false),2500); };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-white text-lg">Passenger Subscription Plans</h2>
          <p className="text-slate-400 text-sm mt-0.5">
            Customize what plans your airport's passengers see when they log in.
            Changes apply only to your airport.
          </p>
        </div>
        <button onClick={saveChanges}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-all"
          style={{background:saved?"rgba(34,197,94,0.3)":"linear-gradient(135deg,#0ea5e9,#14b8a6)"}}>
          {saved?"✓ Saved!":"Save Changes"}
        </button>
      </div>

      <div className="p-4 rounded-2xl border text-sm"
        style={{background:"rgba(14,165,233,0.05)",borderColor:"rgba(56,189,248,0.2)"}}>
        <div className="font-semibold text-sky-300 mb-1">🏢 Airport-Specific Control</div>
        <div className="text-slate-400 leading-relaxed">
          As the airport admin, you control which subscription plans are visible to passengers
          logging into <strong className="text-white">your airport</strong>. You can enable/disable
          plans, adjust pricing, and rename plans to match your airport's branding.
          Passengers at other airports see their own airport's configuration.
        </div>
      </div>

      <div className="grid xl:grid-cols-2 gap-5">
        {plans.map(plan=>(
          <div key={plan.id} className="rounded-2xl border overflow-hidden transition-all"
            style={{
              borderColor:plan.active?`${plan.color}40`:"rgba(255,255,255,0.08)",
              background:plan.active?`${plan.color}05`:"rgba(15,22,41,0.5)",
              opacity:plan.active?1:0.65
            }}>
            {/* Plan header */}
            <div className="p-5 border-b" style={{borderColor:"rgba(255,255,255,0.06)"}}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{plan.icon}</span>
                  {editing===plan.id ? (
                    <input value={plan.name} onChange={e=>updateName(plan.id,e.target.value)}
                      className="bg-transparent border-b-2 text-white font-bold text-lg outline-none"
                      style={{borderColor:plan.color}}/>
                  ) : (
                    <span className="font-bold text-white text-lg">{plan.name}</span>
                  )}
                </div>
                {/* Toggle active */}
                <div className="flex items-center gap-3">
                  <button onClick={()=>setEditing(editing===plan.id?null:plan.id)}
                    className="text-xs px-2.5 py-1 rounded-lg border transition-all"
                    style={{
                      borderColor:`${plan.color}40`,
                      color:plan.color,
                      background:editing===plan.id?`${plan.color}20`:"transparent"
                    }}>
                    {editing===plan.id?"Done":"Edit"}
                  </button>
                  <button onClick={()=>togglePlan(plan.id)}
                    className="relative w-12 h-6 rounded-full transition-all flex-shrink-0"
                    style={{background:plan.active?plan.color:"#334155"}}>
                    <div className="w-4 h-4 rounded-full bg-white absolute top-1 transition-all"
                      style={{left:plan.active?"calc(100% - 20px)":"4px"}}/>
                  </button>
                </div>
              </div>

              {/* Status badge */}
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                  plan.active
                    ?"bg-green-500/15 text-green-400 border border-green-500/20"
                    :"bg-slate-500/15 text-slate-400 border border-slate-500/20"}`}>
                  {plan.active?"✓ Visible to passengers":"Hidden from passengers"}
                </span>
              </div>
            </div>

            {/* Pricing */}
            <div className="p-5">
              <div className="text-xs text-slate-500 font-semibold uppercase mb-3">Pricing</div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[{l:"Monthly Price (₹)",f:"monthly"},{l:"Annual Price (₹)",f:"annual"}].map(({l,f})=>(
                  <div key={f}>
                    <label className="text-xs text-slate-400 mb-1.5 block">{l}</label>
                    {editing===plan.id ? (
                      <input type="number"
                        value={(plan as any)[f]}
                        onChange={e=>updatePrice(plan.id,f as "monthly"|"annual",e.target.value)}
                        className="w-full rounded-xl px-3 py-2.5 text-sm text-white font-mono font-bold outline-none border"
                        style={{background:"rgba(255,255,255,0.06)",borderColor:`${plan.color}40`}}/>
                    ) : (
                      <div className="text-xl font-black" style={{color:plan.color}}>
                        ₹{(plan as any)[f].toLocaleString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Perks — editable */}
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-slate-500 font-semibold uppercase">Included Perks</div>
                {editing===plan.id && (
                  <button onClick={()=>addPerk(plan.id)}
                    className="text-xs px-2 py-0.5 rounded-lg"
                    style={{background:`${plan.color}20`,color:plan.color}}>+ Add perk</button>
                )}
              </div>
              <div className="space-y-1.5">
                {plan.perks.map((perk,i)=>(
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" style={{color:plan.color}}/>
                    {editPerk?.planId===plan.id && editPerk?.idx===i ? (
                      <div className="flex gap-1.5 flex-1">
                        <input value={perkVal} onChange={e=>setPerkVal(e.target.value)}
                          className="flex-1 text-xs bg-transparent border-b outline-none text-white"
                          style={{borderColor:plan.color}}
                          onKeyDown={e=>e.key==="Enter"&&savePerk()} autoFocus/>
                        <button onClick={savePerk} className="text-xs text-green-400">✓</button>
                        <button onClick={()=>setEditPerk(null)} className="text-xs text-slate-500">✗</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 flex-1">
                        <span className="text-slate-300 text-xs flex-1">{perk}</span>
                        {editing===plan.id && (
                          <>
                            <button onClick={()=>startPerkEdit(plan.id,i,perk)}
                              className="text-xs text-slate-500 hover:text-sky-400">✎</button>
                            <button onClick={()=>removePerk(plan.id,i)}
                              className="text-xs text-slate-500 hover:text-red-400">×</button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {plan.active && (
                <div className="mt-4 pt-3 border-t text-xs text-slate-500"
                  style={{borderColor:"rgba(255,255,255,0.06)"}}>
                  Passengers at your airport will see this plan in their subscription page
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Preview */}
      <div className="rounded-2xl border p-5"
        style={{background:"rgba(15,22,41,0.5)",borderColor:"rgba(255,255,255,0.06)"}}>
        <h3 className="font-semibold text-white mb-3">
          Preview — What passengers at your airport will see:
        </h3>
        <div className="flex gap-3 flex-wrap">
          {plans.filter(p=>p.active).map(p=>(
            <div key={p.id} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border"
              style={{background:`${p.color}10`,borderColor:`${p.color}30`}}>
              <span className="text-lg">{p.icon}</span>
              <div>
                <div className="font-bold text-white text-sm">{p.name}</div>
                <div className="text-xs" style={{color:p.color}}>₹{p.monthly.toLocaleString()}/mo</div>
              </div>
            </div>
          ))}
          {plans.filter(p=>p.active).length===0 && (
            <div className="text-slate-500 text-sm">No plans enabled — passengers won't see any subscription options.</div>
          )}
        </div>
      </div>
    </div>
  );
}

export function BillingPortal() {
  const [tab,      setTab]     = useState<"overview"|"invoices"|"plans"|"subscribers"|"addons">("overview");
  const [search,   setSearch]  = useState("");
  const [showNew,  setShowNew] = useState(false);
  const [newInv,   setNewInv]  = useState({airport:"DEL",plan:"Enterprise",amount:"",period:"",notes:""});
  const [liveArr,  setLiveArr] = useState(8200000);


  useEffect(()=>{
    const t = setInterval(()=>setLiveArr(p=>p+Math.floor(Math.random()*12000+3000)),3000);
    return ()=>clearInterval(t);
  },[]);

  const totalMRR   = SUBSCRIBERS.filter(s=>s.status==="Active").reduce((s,sub)=>s+sub.mrr,0);
  const totalARR   = totalMRR*12;
  const activeApts = SUBSCRIBERS.filter(s=>s.status==="Active").length;
  const trialApts  = SUBSCRIBERS.filter(s=>s.status==="Trial").length;
  const totalInv   = INVOICES.reduce((s,i)=>s+i.amount,0);
  const outstanding= INVOICES.filter(i=>i.status==="Pending").reduce((s,i)=>s+i.amount,0);

  const planBreak = [
    {name:"Enterprise",  value:SUBSCRIBERS.filter(s=>s.plan==="Enterprise").length,   color:"#8b5cf6"},
    {name:"Professional",value:SUBSCRIBERS.filter(s=>s.plan==="Professional").length, color:"#0ea5e9"},
    {name:"Starter",     value:SUBSCRIBERS.filter(s=>s.plan==="Starter").length,      color:"#64748b"},
  ];

  const STATUS_CFG: Record<string,string> = {
    "Paid":    "bg-green-500/15 text-green-400 border-green-500/20",
    "Pending": "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
    "Overdue": "bg-red-500/15 text-red-400 border-red-500/20",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Billing & Revenue</h1>
          <p className="text-slate-400 text-sm">SaaS subscriptions, invoices & airport accounts</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Live ARR ticker */}
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border"
            style={{background:"rgba(34,197,94,0.06)",borderColor:"rgba(34,197,94,0.2)"}}>
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"/>
            <div>
              <div className="text-xs text-slate-500">Live MRR</div>
              <div className="font-black font-mono text-green-400">{fmt(liveArr)}</div>
            </div>
          </div>
          <button onClick={()=>setShowNew(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white"
            style={{background:"linear-gradient(135deg,#0ea5e9,#14b8a6)"}}>
            <Plus className="w-4 h-4"/>New Invoice
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
        {[
          {label:"Monthly Recurring",value:fmt(totalMRR),  color:"#0ea5e9",icon:<TrendingUp className="w-5 h-5"/>,sub:"+12% MoM"},
          {label:"Annual Run Rate",  value:fmt(totalARR),  color:"#22c55e",icon:<BarChart3 className="w-5 h-5"/>,sub:"Projected ARR"},
          {label:"Active Airports",  value:String(activeApts),color:"#14b8a6",icon:<Shield className="w-5 h-5"/>,sub:`${trialApts} on trial`},
          {label:"Outstanding",      value:fmt(outstanding),color:outstanding>0?"#f59e0b":"#22c55e",icon:<Clock className="w-5 h-5"/>,sub:"Pending invoices"},
          {label:"Total Invoiced",   value:fmt(totalInv),  color:"#8b5cf6",icon:<FileText className="w-5 h-5"/>,sub:"All time"},
        ].map(({label,value,color,icon,sub})=>(
          <div key={label} className="rounded-2xl p-5 border"
            style={{background:`${color}08`,borderColor:`${color}20`}}>
            <div className="mb-3" style={{color}}>{icon}</div>
            <div className="text-2xl font-black text-white mb-0.5">{value}</div>
            <div className="text-xs text-slate-400">{label}</div>
            <div className="text-xs text-slate-600 mt-0.5">{sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-2xl w-fit"
        style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)"}}>
        {([
          {k:"overview",    l:"📊 Overview"},
          {k:"invoices",    l:"🧾 Invoices"},
          {k:"subscribers", l:"🏢 Airports"},
          {k:"plans",       l:"🎫 Passenger Plans"},
          {k:"addons",      l:"🔧 Add-ons"},
        ] as const).map(({k,l})=>(
          <button key={k} onClick={()=>setTab(k)}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={tab===k?{background:"linear-gradient(135deg,#0ea5e9,#14b8a6)",color:"white"}:{color:"#64748b"}}>
            {l}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab==="overview" && (
        <div className="space-y-5">
          <div className="grid xl:grid-cols-3 gap-5">
            {/* MRR trend */}
            <div className="xl:col-span-2 rounded-2xl border p-5" style={{background:"#080d18",borderColor:"#1e2d4d"}}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-bold text-white">MRR Growth</h2>
                  <p className="text-xs text-slate-500">Monthly recurring revenue trend</p>
                </div>
                <div className="text-xs px-3 py-1 rounded-full font-bold"
                  style={{background:"rgba(34,197,94,0.12)",color:"#4ade80"}}>
                  +{Math.round((MRR_TREND[5].mrr-MRR_TREND[0].mrr)/MRR_TREND[0].mrr*100)}% since Jan
                </div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={MRR_TREND} margin={{left:10}}>
                  <defs>
                    <linearGradient id="mg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#0ea5e9" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4d" vertical={false}/>
                  <XAxis dataKey="m" tick={{fill:"#475569",fontSize:11}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fill:"#475569",fontSize:11}} axisLine={false} tickLine={false} tickFormatter={fmt}/>
                  <Tooltip contentStyle={TOOLTIP} formatter={(v:any)=>[fmt(v)]}/>
                  <Area type="monotone" dataKey="mrr" name="MRR" stroke="#0ea5e9" fill="url(#mg)" strokeWidth={2.5}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Plan breakdown donut */}
            <div className="rounded-2xl border p-5 flex flex-col" style={{background:"#080d18",borderColor:"#1e2d4d"}}>
              <h2 className="font-bold text-white mb-1">Plan Distribution</h2>
              <p className="text-xs text-slate-500 mb-3">{SUBSCRIBERS.length} total airports</p>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={planBreak} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                    dataKey="value" stroke="none" paddingAngle={3}>
                    {planBreak.map((p,i)=><Cell key={i} fill={p.color}/>)}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP}/>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {planBreak.map(p=>(
                  <div key={p.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{background:p.color}}/>
                      <span className="text-slate-300">{p.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold">{p.value}</span>
                      <span className="text-xs text-slate-500">airports</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* New vs churned */}
          <div className="rounded-2xl border p-5" style={{background:"#080d18",borderColor:"#1e2d4d"}}>
            <h2 className="font-bold text-white mb-4">New Revenue vs Churn</h2>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={MRR_TREND} margin={{left:10}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4d" vertical={false}/>
                <XAxis dataKey="m" tick={{fill:"#475569",fontSize:11}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fill:"#475569",fontSize:11}} axisLine={false} tickLine={false} tickFormatter={fmt}/>
                <Tooltip contentStyle={TOOLTIP} formatter={(v:any)=>[fmt(v)]}/>
                <Bar dataKey="new"   name="New Revenue" fill="#22c55e" radius={[4,4,0,0]}/>
                <Bar dataKey="churn" name="Churn"       fill="#ef4444" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Health metrics */}
          <div className="grid xl:grid-cols-4 gap-4">
            {[
              {label:"Net Revenue Retention",value:"118%",  color:"#22c55e",note:"Industry avg: 105%"},
              {label:"Avg Revenue / Airport", value:fmt(totalMRR/activeApts),color:"#0ea5e9",note:"Per active account"},
              {label:"Churn Rate",            value:"1.2%", color:"#f59e0b",note:"Monthly · Target <2%"},
              {label:"Expansion MRR",         value:fmt(800000),color:"#8b5cf6",note:"Upgrades this month"},
            ].map(({label,value,color,note})=>(
              <div key={label} className="rounded-2xl border p-5"
                style={{background:`${color}06`,borderColor:`${color}18`}}>
                <div className="text-2xl font-black mb-1" style={{color}}>{value}</div>
                <div className="text-sm font-semibold text-white">{label}</div>
                <div className="text-xs text-slate-500 mt-1">{note}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── INVOICES ── */}
      {tab==="invoices" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 rounded-xl px-3.5 py-2.5 border max-w-sm"
            style={{background:"rgba(255,255,255,0.03)",borderColor:"rgba(255,255,255,0.08)"}}>
            <Search className="w-4 h-4 text-slate-500"/>
            <input className="bg-transparent text-sm text-white placeholder-slate-500 outline-none w-full"
              placeholder="Search invoices..."
              value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>

          <div className="rounded-2xl border overflow-hidden" style={{background:"#080d18",borderColor:"#1e2d4d"}}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{borderBottom:"1px solid #1e2d4d"}}>
                  {["Invoice #","Plan","Airports","Period","Amount","Date","Status","Actions"].map(h=>(
                    <th key={h} className="px-5 py-3.5 text-left text-xs uppercase" style={{color:"#475569"}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {INVOICES.filter(i=>!search||i.id.includes(search)||i.plan.toLowerCase().includes(search.toLowerCase())).map(inv=>(
                  <tr key={inv.id} style={{borderBottom:"1px solid rgba(30,45,77,0.5)"}}
                    onMouseEnter={e=>(e.currentTarget.style.background="rgba(255,255,255,0.02)")}
                    onMouseLeave={e=>(e.currentTarget.style.background="")}>
                    <td className="px-5 py-3.5 font-mono font-bold text-sky-300 text-xs">{inv.id}</td>
                    <td className="px-5 py-3.5 text-white font-semibold">{inv.plan}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-400 font-mono">{inv.airports}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-400">{inv.period}</td>
                    <td className="px-5 py-3.5 font-black text-white font-mono">{fmt(inv.amount)}</td>
                    <td className="px-5 py-3.5 text-xs font-mono text-slate-400">{inv.date}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${STATUS_CFG[inv.status]||STATUS_CFG["Pending"]}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-2">
                        <button className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors">
                          <Download className="w-3 h-3"/>PDF
                        </button>
                        {inv.status==="Pending" && (
                          <button className="text-xs bg-sky-500/15 text-sky-400 border border-sky-500/20 px-2.5 py-1 rounded-lg">
                            Pay
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{borderTop:"1px solid #1e2d4d",background:"rgba(14,165,233,0.04)"}}>
                  <td colSpan={4} className="px-5 py-4 font-bold text-white">Total Invoiced</td>
                  <td className="px-5 py-4 font-black text-sky-300 text-lg">{fmt(totalInv)}</td>
                  <td colSpan={3}/>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ── SUBSCRIBERS ── */}
      {tab==="subscribers" && (
        <div className="space-y-5">
          <div className="rounded-2xl border overflow-hidden" style={{background:"#080d18",borderColor:"#1e2d4d"}}>
            <div className="p-5 border-b" style={{borderColor:"#1e2d4d"}}>
              <h2 className="font-bold text-white">Airport Accounts</h2>
              <p className="text-xs text-slate-500">{SUBSCRIBERS.length} airports · {fmt(totalMRR)} total MRR</p>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr style={{borderBottom:"1px solid #1e2d4d"}}>
                  {["Airport","Plan","Since","MRR","Users","Flights/mo","Status"].map(h=>(
                    <th key={h} className="px-5 py-3 text-left text-xs uppercase" style={{color:"#475569"}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SUBSCRIBERS.map(s=>{
                  const planColor = s.plan==="Enterprise"?"#8b5cf6":s.plan==="Professional"?"#0ea5e9":"#64748b";
                  const statusColor = s.status==="Active"?"#22c55e":s.status==="Trial"?"#f59e0b":"#ef4444";
                  return (
                    <tr key={s.airport} style={{borderBottom:"1px solid rgba(30,45,77,0.5)"}}
                      onMouseEnter={e=>(e.currentTarget.style.background="rgba(255,255,255,0.02)")}
                      onMouseLeave={e=>(e.currentTarget.style.background="")}>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-white">{s.airport}</div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs px-2.5 py-1 rounded-full font-bold"
                          style={{background:`${planColor}20`,color:planColor}}>
                          {s.plan}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-400">{s.since}</td>
                      <td className="px-5 py-4 font-black font-mono" style={{color:planColor}}>{fmt(s.mrr)}</td>
                      <td className="px-5 py-4 text-slate-300">{s.users}</td>
                      <td className="px-5 py-4 text-slate-300">{s.flights.toLocaleString()}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full" style={{background:statusColor}}/>
                          <span className="text-xs font-semibold" style={{color:statusColor}}>{s.status}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Usage bars */}
          <div className="rounded-2xl border p-5" style={{background:"#080d18",borderColor:"#1e2d4d"}}>
            <h2 className="font-bold text-white mb-4">Platform Usage by Airport</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={USAGE_DATA} layout="vertical" margin={{left:60,right:20}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4d" horizontal={false}/>
                <XAxis type="number" tick={{fill:"#475569",fontSize:11}} axisLine={false} tickLine={false}/>
                <YAxis type="category" dataKey="name" tick={{fill:"#94a3b8",fontSize:11}} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={TOOLTIP}/>
                <Bar dataKey="flights" name="Flights/mo" fill="#0ea5e9" radius={[0,4,4,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── PASSENGER PLANS MANAGER ── */}
      {tab==="plans" && <PassengerPlanManager/>}

      {/* ── ADD-ONS ── */}
      {tab==="addons" && (
        <div className="space-y-4">
          <div className="grid xl:grid-cols-2 gap-4">
            {ADD_ONS.map(a=>(
              <div key={a.name} className="rounded-2xl border p-5"
                style={{background:"rgba(15,22,41,0.8)",borderColor:"rgba(255,255,255,0.06)"}}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-bold text-white">{a.name}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{a.desc}</div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <div className="font-black text-sky-300">{fmt(a.price)}</div>
                    <div className="text-xs text-slate-500">/month</div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="text-xs text-slate-500">
                    <span className="font-bold text-white">{a.subscribed}</span> airports subscribed
                    <span className="text-green-400 ml-2 font-bold">({fmt(a.price*a.subscribed)}/mo)</span>
                  </div>
                  <button className="text-xs px-3 py-1.5 rounded-lg font-semibold"
                    style={{background:"rgba(14,165,233,0.12)",color:"#38bdf8",border:"1px solid rgba(14,165,233,0.25)"}}>
                    Manage →
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 rounded-2xl border flex justify-between items-center"
            style={{background:"rgba(139,92,246,0.06)",borderColor:"rgba(139,92,246,0.2)"}}>
            <div>
              <div className="font-bold text-white">Total Add-on MRR</div>
              <div className="text-xs text-slate-400">From {ADD_ONS.reduce((s,a)=>s+a.subscribed,0)} subscriptions</div>
            </div>
            <div className="font-black text-2xl text-purple-400">
              {fmt(ADD_ONS.reduce((s,a)=>s+a.price*a.subscribed,0))}
            </div>
          </div>
        </div>
      )}

      {/* New invoice modal */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{background:"rgba(0,0,0,0.8)",backdropFilter:"blur(8px)"}}>
          <div className="w-full max-w-md rounded-3xl p-6 border"
            style={{background:"#0f1629",borderColor:"rgba(14,165,233,0.3)"}}>
            <div className="flex justify-between mb-5">
              <h2 className="font-bold text-white text-lg">Create New Invoice</h2>
              <button onClick={()=>setShowNew(false)}><X className="w-5 h-5 text-slate-500"/></button>
            </div>
            <div className="space-y-3">
              {[
                {l:"Airport IATA Code",k:"airport",ph:"DEL, BOM, BLR..."},
                {l:"Plan / Service",   k:"plan",   ph:"Enterprise, Add-on..."},
                {l:"Amount (₹)",       k:"amount", ph:"e.g. 1499999"},
                {l:"Billing Period",   k:"period", ph:"April 2024, Q1 2024..."},
                {l:"Notes",            k:"notes",  ph:"Optional notes..."},
              ].map(({l,k,ph})=>(
                <div key={k}>
                  <label className="text-xs text-slate-400 mb-1 block font-medium">{l}</label>
                  <input value={(newInv as any)[k]} onChange={e=>setNewInv({...newInv,[k]:e.target.value})}
                    placeholder={ph}
                    className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none border"
                    style={{background:"rgba(255,255,255,0.05)",borderColor:"rgba(255,255,255,0.1)"}}/>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 mt-5">
              <button onClick={()=>setShowNew(false)}
                className="py-3 rounded-xl font-bold text-sm text-white"
                style={{background:"linear-gradient(135deg,#0ea5e9,#14b8a6)"}}>
                ✓ Generate Invoice
              </button>
              <button onClick={()=>setShowNew(false)}
                className="py-3 rounded-xl text-sm text-slate-400 border border-slate-700">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
