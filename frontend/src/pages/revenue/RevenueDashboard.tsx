import { useState, useEffect } from "react";
import {
  AreaChart, Area, BarChart, Bar, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, ComposedChart
} from "recharts";
import { TrendingUp, TrendingDown, DollarSign,
         Plane, ShoppingBag } from "lucide-react";

const TOOLTIP_STYLE = {
  background:"#0a0e1a",border:"1px solid #1e3a5f",borderRadius:12,
  fontSize:11,color:"#e2e8f0",padding:"8px 12px"
};

const fmt = (v:number) =>
  v>=10000000?`₹${(v/10000000).toFixed(1)}Cr`:
  v>=100000?`₹${(v/100000).toFixed(1)}L`:
  v>=1000?`₹${(v/1000).toFixed(0)}K`:`₹${v}`;

const MONTHLY = [
  {m:"Jan",aero:2800000,retail:1200000,parking:380000,cargo:620000,total:5000000},
  {m:"Feb",aero:2600000,retail:1100000,parking:340000,cargo:580000,total:4620000},
  {m:"Mar",aero:3100000,retail:1350000,parking:410000,cargo:690000,total:5550000},
  {m:"Apr",aero:2950000,retail:1280000,parking:395000,cargo:655000,total:5280000},
  {m:"May",aero:3300000,retail:1450000,parking:430000,cargo:720000,total:5900000},
  {m:"Jun",aero:3500000,retail:1580000,parking:460000,cargo:760000,total:6300000},
  {m:"Jul",aero:3800000,retail:1680000,parking:490000,cargo:830000,total:6800000},
  {m:"Aug",aero:4100000,retail:1820000,parking:520000,cargo:880000,total:7320000},
  {m:"Sep",aero:3900000,retail:1750000,parking:505000,cargo:845000,total:7000000},
  {m:"Oct",aero:4300000,retail:1950000,parking:550000,cargo:950000,total:7750000},
  {m:"Nov",aero:4600000,retail:2100000,parking:580000,cargo:1020000,total:8300000},
  {m:"Dec",aero:5200000,retail:2400000,parking:640000,cargo:1160000,total:9400000},
];

const STREAMS = [
  {name:"Landing Fees",    value:28000000,color:"#0ea5e9",pct:34.1,trend:8.2, icon:"✈"},
  {name:"Passenger Fees",  value:18500000,color:"#14b8a6",pct:22.5,trend:11.4,icon:"👤"},
  {name:"Retail Concessions",value:14200000,color:"#8b5cf6",pct:17.3,trend:15.8,icon:"🛍"},
  {name:"Parking Revenue", value:7800000, color:"#f59e0b",pct:9.5, trend:6.1, icon:"🅿"},
  {name:"Cargo Handling",  value:6900000, color:"#22c55e",pct:8.4, trend:19.2,icon:"📦"},
  {name:"Fuel Services",   value:4600000, color:"#ec4899",pct:5.6, trend:3.8, icon:"⛽"},
  {name:"F&B Revenue",     value:2200000, color:"#f97316",pct:2.7, trend:22.1,icon:"🍽"},
];

const AIRLINE_REV = [
  {airline:"Air India",  flights:42,rev:4200000,pax:14280,rpf:294},
  {airline:"IndiGo",     flights:68,rev:5100000,pax:21760,rpf:234},
  {airline:"Vistara",    flights:31,rev:3720000,pax:8680, rpf:428},
  {airline:"Emirates",   flights:12,rev:3600000,pax:5040, rpf:714},
  {airline:"SpiceJet",   flights:28,rev:2240000,pax:7280, rpf:307},
  {airline:"Akasa",      flights:18,rev:1440000,pax:4320, rpf:333},
];

const DAILY_THIS_WEEK = [
  {d:"Mon",target:780000,actual:812000},{d:"Tue",target:780000,actual:756000},
  {d:"Wed",target:800000,actual:834000},{d:"Thu",target:820000,actual:891000},
  {d:"Fri",target:850000,actual:924000},{d:"Sat",target:900000,actual:876000},
  {d:"Sun",target:860000,actual:843000},
];

const QUARTERLY = [
  {q:"Q1",actual:15170000,target:14000000,growth:8.4},
  {q:"Q2",actual:17480000,target:16000000,growth:9.3},
  {q:"Q3",actual:21120000,target:19000000,growth:11.2},
  {q:"Q4",actual:25450000,target:22000000,growth:15.7},
];

function RevKPI({label,value,sub,trend,color,icon}:{
  label:string;value:string;sub:string;trend:number;color:string;icon:React.ReactNode
}) {
  const up = trend>=0;
  return (
    <div className="relative rounded-2xl p-5 border overflow-hidden hover:scale-[1.02] transition-all duration-200"
      style={{background:`linear-gradient(135deg,${color}10,#080d18)`,borderColor:`${color}20`}}>
      <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full opacity-6"
        style={{background:color}}/>
      <div className="flex items-center justify-between mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{background:`${color}18`}}>
          <span style={{color}}>{icon}</span>
        </div>
        <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full`}
          style={{background:up?"rgba(34,197,94,0.12)":"rgba(248,113,113,0.12)",color:up?"#4ade80":"#f87171"}}>
          {up?<TrendingUp className="w-3 h-3"/>:<TrendingDown className="w-3 h-3"/>}
          {Math.abs(trend)}%
        </div>
      </div>
      <div className="text-2xl font-black text-white mb-0.5">{value}</div>
      <div className="text-xs text-slate-400">{label}</div>
      <div className="text-xs text-slate-600 mt-0.5">{sub}</div>
    </div>
  );
}

export function RevenueDashboard() {
  const [view,     setView]     = useState<"monthly"|"streams"|"airlines">("monthly");
  const [liveRev,  setLiveRev]  = useState(8247832);
  const [selStream,setStream]   = useState<string|null>(null);

  // Live revenue ticker
  useEffect(()=>{
    const t = setInterval(()=>{
      setLiveRev(prev=>prev+Math.floor(Math.random()*850+150));
    },2000);
    return ()=>clearInterval(t);
  },[]);

  const annualTotal = MONTHLY.reduce((s,m)=>s+m.total,0);
  const thisMonth   = MONTHLY[MONTHLY.length-1].total;
  const aeroRev     = MONTHLY.reduce((s,m)=>s+m.aero,0);
  const nonAero     = annualTotal-aeroRev;
  const todayRev    = DAILY_THIS_WEEK[4].actual;
  const weekRev     = DAILY_THIS_WEEK.reduce((s,d)=>s+d.actual,0);
  const onTrack     = DAILY_THIS_WEEK.filter(d=>d.actual>=d.target).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Revenue Intelligence</h1>
          <p className="text-slate-400 text-sm mt-0.5">Financial performance — Delhi IGI Airport · FY 2024</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Live revenue counter */}
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border"
            style={{background:"rgba(34,197,94,0.06)",borderColor:"rgba(34,197,94,0.2)"}}>
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"/>
            <div>
              <div className="text-xs text-slate-500">Live Today</div>
              <div className="font-black font-mono text-green-400">{fmt(liveRev)}</div>
            </div>
          </div>
          <div className="flex gap-1 p-1 max-w-full overflow-x-auto rounded-xl"
            style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)"}}>
            {(["monthly","streams","airlines"] as const).map(v=>(
              <button key={v} onClick={()=>setView(v)}
                className="px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all"
                style={view===v
                  ?{background:"linear-gradient(135deg,#0ea5e9,#14b8a6)",color:"white"}
                  :{color:"#64748b"}}>
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <RevKPI label="Annual Revenue"  value={fmt(annualTotal)} sub="FY 2024 total"     trend={19.4} color="#0ea5e9" icon={<DollarSign className="w-4 h-4"/>}/>
        <RevKPI label="This Month"      value={fmt(thisMonth)}  sub="December"           trend={13.5} color="#14b8a6" icon={<TrendingUp className="w-4 h-4"/>}/>
        <RevKPI label="Aeronautical"    value={fmt(aeroRev)}    sub="58% of total"       trend={8.1}  color="#8b5cf6" icon={<Plane className="w-4 h-4"/>}/>
        <RevKPI label="Non-Aero"        value={fmt(nonAero)}    sub="42% of total"       trend={24.6} color="#f59e0b" icon={<ShoppingBag className="w-4 h-4"/>}/>
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-4 gap-3">
        {[
          {label:"Today's Revenue",  value:fmt(todayRev),  color:"#22c55e",note:"vs ₹8.5L target"},
          {label:"This Week",        value:fmt(weekRev),   color:"#0ea5e9", note:`${onTrack}/7 days on target`},
          {label:"Rev per Pax",      value:"₹642",         color:"#ec4899", note:"↑ from ₹598 last month"},
          {label:"Rev per Flight",   value:"₹2.84L",       color:"#f97316", note:"Best this year"},
        ].map(({label,value,color,note})=>(
          <div key={label} className="rounded-xl p-4 border"
            style={{background:`${color}08`,borderColor:`${color}20`}}>
            <div className="text-xs text-slate-500 mb-1">{label}</div>
            <div className="text-xl font-black" style={{color}}>{value}</div>
            <div className="text-xs text-slate-600 mt-0.5">{note}</div>
          </div>
        ))}
      </div>

      {/* MONTHLY VIEW */}
      {view==="monthly" && (
        <div className="space-y-5">
          {/* Annual trend — big area chart */}
          <div className="rounded-2xl border p-6" style={{background:"#080d18",borderColor:"#1e2d4d"}}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-bold text-white text-lg">Annual Revenue Trend 2024</h2>
                <p className="text-xs text-slate-500">Monthly breakdown by revenue stream</p>
              </div>
              <div className="flex gap-3 text-xs">
                {[{l:"Aeronautical",c:"#0ea5e9"},{l:"Retail",c:"#8b5cf6"},{l:"Parking",c:"#f59e0b"},{l:"Cargo",c:"#22c55e"}].map(({l,c})=>(
                  <div key={l} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{background:c}}/>
                    <span className="text-slate-400">{l}</span>
                  </div>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={MONTHLY} margin={{left:10}}>
                <defs>
                  {[["ag","#0ea5e9"],["rg","#8b5cf6"],["pg","#f59e0b"],["cg","#22c55e"]].map(([id,c])=>(
                    <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={c} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={c} stopOpacity={0}/>
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4d" vertical={false}/>
                <XAxis dataKey="m" tick={{fill:"#475569",fontSize:11}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fill:"#475569",fontSize:11}} axisLine={false} tickLine={false} tickFormatter={fmt}/>
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v:any)=>[fmt(v)]}/>
                <Area type="monotone" dataKey="aero"    name="Aeronautical" stroke="#0ea5e9" fill="url(#ag)" strokeWidth={2}/>
                <Area type="monotone" dataKey="retail"  name="Retail"       stroke="#8b5cf6" fill="url(#rg)" strokeWidth={2}/>
                <Area type="monotone" dataKey="parking" name="Parking"      stroke="#f59e0b" fill="url(#pg)" strokeWidth={2}/>
                <Area type="monotone" dataKey="cargo"   name="Cargo"        stroke="#22c55e" fill="url(#cg)" strokeWidth={2}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Daily vs target + Quarterly */}
          <div className="grid xl:grid-cols-2 gap-5">
            {/* Daily this week */}
            <div className="rounded-2xl border p-5" style={{background:"#080d18",borderColor:"#1e2d4d"}}>
              <h2 className="font-bold text-white mb-1">This Week — Daily vs Target</h2>
              <p className="text-xs text-slate-500 mb-4">{onTrack}/7 days on or above target</p>
              <ResponsiveContainer width="100%" height={200}>
                <ComposedChart data={DAILY_THIS_WEEK} margin={{left:-10}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4d" vertical={false}/>
                  <XAxis dataKey="d" tick={{fill:"#475569",fontSize:11}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fill:"#475569",fontSize:11}} axisLine={false} tickLine={false} tickFormatter={fmt}/>
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v:any)=>[fmt(v)]}/>
                  <Bar dataKey="actual" name="Actual" fill="#0ea5e9" radius={[4,4,0,0]} opacity={0.85}/>
                  <Line type="monotone" dataKey="target" name="Target" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 3" dot={false}/>
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Quarterly comparison */}
            <div className="rounded-2xl border p-5" style={{background:"#080d18",borderColor:"#1e2d4d"}}>
              <h2 className="font-bold text-white mb-1">Quarterly Performance</h2>
              <p className="text-xs text-slate-500 mb-4">Actual vs target + growth rate</p>
              <div className="space-y-3">
                {QUARTERLY.map(q=>(
                  <div key={q.q}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-white w-8">{q.q}</span>
                        <span className="text-xs text-slate-400">{fmt(q.actual)} actual</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">target: {fmt(q.target)}</span>
                        <span className="text-xs font-bold text-green-400">+{q.growth}%</span>
                      </div>
                    </div>
                    <div className="relative h-3 rounded-full overflow-hidden" style={{background:"#1e2d4d"}}>
                      <div className="absolute h-full rounded-full transition-all"
                        style={{width:`${(q.target/q.actual*100)*0.8}%`,background:"#334155"}}/>
                      <div className="absolute h-full rounded-full transition-all"
                        style={{width:`${Math.min((q.actual/35000000)*100,100)}%`,
                                background:`linear-gradient(90deg,#0ea5e9,#14b8a6)`}}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STREAMS VIEW */}
      {view==="streams" && (
        <div className="space-y-5">
          <div className="grid xl:grid-cols-2 gap-5">
            {/* Pie chart */}
            <div className="rounded-2xl border p-5" style={{background:"#080d18",borderColor:"#1e2d4d"}}>
              <h2 className="font-bold text-white mb-4">Revenue Breakdown by Stream</h2>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={STREAMS} cx="50%" cy="50%"
                    innerRadius={60} outerRadius={110}
                    dataKey="value" stroke="none"
                    paddingAngle={2}>
                    {STREAMS.map((s,i)=>(
                      <Cell key={i} fill={s.color}
                        opacity={selStream===null||selStream===s.name?1:0.3}
                        onClick={()=>setStream(selStream===s.name?null:s.name)}
                        style={{cursor:"pointer"}}/>
                    ))}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v:any)=>[fmt(v)]}/>
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Stream list */}
            <div className="space-y-2.5">
              {STREAMS.map(s=>(
                <div key={s.name}
                  onClick={()=>setStream(selStream===s.name?null:s.name)}
                  className="flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all hover:scale-[1.01]"
                  style={{
                    background:selStream===s.name?`${s.color}12`:"rgba(255,255,255,0.02)",
                    borderColor:selStream===s.name?`${s.color}40`:"#1e2d4d"
                  }}>
                  <div className="text-2xl flex-shrink-0">{s.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-white text-sm">{s.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-green-400">+{s.trend}%</span>
                        <span className="font-mono font-bold text-white">{fmt(s.value)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{background:"#1e2d4d"}}>
                        <div className="h-full rounded-full transition-all"
                          style={{width:`${s.pct*2.5}%`,background:s.color}}/>
                      </div>
                      <span className="text-xs text-slate-400 w-10 text-right">{s.pct}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly stacked bar */}
          <div className="rounded-2xl border p-5" style={{background:"#080d18",borderColor:"#1e2d4d"}}>
            <h2 className="font-bold text-white mb-4">Monthly Revenue by Stream</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={MONTHLY} margin={{left:10}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4d" vertical={false}/>
                <XAxis dataKey="m" tick={{fill:"#475569",fontSize:11}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fill:"#475569",fontSize:11}} axisLine={false} tickLine={false} tickFormatter={fmt}/>
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v:any)=>[fmt(v)]}/>
                <Bar dataKey="aero"    name="Aeronautical" fill="#0ea5e9" stackId="a" radius={[0,0,0,0]}/>
                <Bar dataKey="retail"  name="Retail"       fill="#8b5cf6" stackId="a"/>
                <Bar dataKey="parking" name="Parking"      fill="#f59e0b" stackId="a"/>
                <Bar dataKey="cargo"   name="Cargo"        fill="#22c55e" stackId="a" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* AIRLINES VIEW */}
      {view==="airlines" && (
        <div className="space-y-5">
          {/* Bar chart */}
          <div className="rounded-2xl border p-5" style={{background:"#080d18",borderColor:"#1e2d4d"}}>
            <h2 className="font-bold text-white mb-1">Revenue by Airline</h2>
            <p className="text-xs text-slate-500 mb-4">Landing fees + passenger charges + services</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={AIRLINE_REV} layout="vertical" margin={{left:80,right:20}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4d" horizontal={false}/>
                <XAxis type="number" tick={{fill:"#475569",fontSize:11}} axisLine={false} tickLine={false} tickFormatter={fmt}/>
                <YAxis type="category" dataKey="airline" tick={{fill:"#94a3b8",fontSize:11}} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v:any)=>[fmt(v)]}/>
                <Bar dataKey="rev" name="Revenue" radius={[0,6,6,0]}>
                  {AIRLINE_REV.map((_,i)=>(
                    <Cell key={i} fill={["#0ea5e9","#14b8a6","#8b5cf6","#f59e0b","#22c55e","#ec4899"][i]}/>
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Airline table */}
          <div className="rounded-2xl border overflow-hidden" style={{background:"#080d18",borderColor:"#1e2d4d"}}>
            <div className="p-5 border-b" style={{borderColor:"#1e2d4d"}}>
              <h2 className="font-bold text-white">Airline Revenue Detail</h2>
            </div>
            <div className="table-scroll"><table className="w-full text-sm">
              <thead>
                <tr style={{borderBottom:"1px solid #1e2d4d"}}>
                  {["Airline","Flights","Revenue","Passengers","Rev/Flight","Rev/Pax"].map(h=>(
                    <th key={h} className="px-5 py-3 text-left text-xs uppercase" style={{color:"#475569"}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {AIRLINE_REV.map((a,i)=>{
                  const colors=["#0ea5e9","#14b8a6","#8b5cf6","#f59e0b","#22c55e","#ec4899"];
                  const c = colors[i];
                  const revPerFlight = a.rev/a.flights;
                  const revPerPax    = a.rev/a.pax;
                  return (
                    <tr key={a.airline} style={{borderBottom:"1px solid #1e2d4d"}}
                      onMouseEnter={e=>(e.currentTarget.style.background="rgba(255,255,255,0.02)")}
                      onMouseLeave={e=>(e.currentTarget.style.background="")}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{background:c}}/>
                          <span className="font-semibold text-white">{a.airline}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-mono text-slate-300">{a.flights}</td>
                      <td className="px-5 py-4">
                        <span className="font-black font-mono" style={{color:c}}>{fmt(a.rev)}</span>
                      </td>
                      <td className="px-5 py-4 text-slate-400">{a.pax.toLocaleString()}</td>
                      <td className="px-5 py-4 font-mono text-slate-300">{fmt(revPerFlight)}</td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-bold ${revPerPax>500?"text-green-400":revPerPax>300?"text-yellow-400":"text-slate-400"}`}>
                          ₹{Math.round(revPerPax)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{borderTop:"1px solid #1e2d4d",background:"rgba(14,165,233,0.05)"}}>
                  <td className="px-5 py-4 font-bold text-white">Total</td>
                  <td className="px-5 py-4 font-mono font-bold text-white">{AIRLINE_REV.reduce((s,a)=>s+a.flights,0)}</td>
                  <td className="px-5 py-4 font-black text-sky-300">{fmt(AIRLINE_REV.reduce((s,a)=>s+a.rev,0))}</td>
                  <td className="px-5 py-4 text-white font-bold">{AIRLINE_REV.reduce((s,a)=>s+a.pax,0).toLocaleString()}</td>
                  <td colSpan={2} className="px-5 py-4 text-slate-500 text-xs">FY 2024 cumulative</td>
                </tr>
              </tfoot>
            </table></div>
          </div>
        </div>
      )}

      {/* Insights strip */}
      <div className="grid xl:grid-cols-3 gap-4">
        {[
          {icon:"📈",title:"Non-Aero Revenue Up 24.6%",   desc:"F&B +22% · Retail +15.8% driven by T3 expansion",color:"#22c55e"},
          {icon:"✈", title:"Emirates Highest Rev/Pax ₹714",desc:"Wide-body traffic generating 2.4x domestic average",color:"#0ea5e9"},
          {icon:"🎯",title:"Q4 Exceeding Target by 15.7%", desc:"Festive season surge · Holiday travel peak",       color:"#f59e0b"},
        ].map(({icon,title,desc,color})=>(
          <div key={title} className="flex items-start gap-3 p-4 rounded-xl border"
            style={{background:`${color}06`,borderColor:`${color}20`}}>
            <span className="text-2xl flex-shrink-0">{icon}</span>
            <div>
              <div className="font-semibold text-white text-sm">{title}</div>
              <div className="text-xs text-slate-400 mt-0.5 leading-relaxed">{desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
