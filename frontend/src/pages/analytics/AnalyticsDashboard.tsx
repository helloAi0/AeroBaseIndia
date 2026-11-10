import { useState, useEffect } from "react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis
} from "recharts";
import { TrendingUp, TrendingDown, Plane, Users,
         Clock, Zap, Target, AlertTriangle, RefreshCw } from "lucide-react";

const TOOLTIP_STYLE = {
  background:"#0a0e1a",border:"1px solid #1e3a5f",borderRadius:12,
  fontSize:11,color:"#e2e8f0",padding:"8px 12px"
};

const HOURLY = [
  {h:"00",flights:3, pax:210},{h:"02",flights:2, pax:140},{h:"04",flights:4, pax:280},
  {h:"06",flights:12,pax:840},{h:"08",flights:28,pax:1960},{h:"10",flights:35,pax:2450},
  {h:"12",flights:42,pax:2940},{h:"14",flights:48,pax:3360},{h:"16",flights:45,pax:3150},
  {h:"18",flights:52,pax:3640},{h:"20",flights:38,pax:2660},{h:"22",flights:18,pax:1260},
];

const WEEKLY = [
  {d:"Mon",dom:45,intl:18,delayed:3,cancelled:1},{d:"Tue",dom:52,intl:22,delayed:5,cancelled:0},
  {d:"Wed",dom:48,intl:20,delayed:2,cancelled:1},{d:"Thu",dom:58,intl:25,delayed:7,cancelled:2},
  {d:"Fri",dom:72,intl:31,delayed:4,cancelled:0},{d:"Sat",dom:68,intl:28,delayed:6,cancelled:1},
  {d:"Sun",dom:55,intl:24,delayed:3,cancelled:0},
];

const PAXFLOW = [
  {t:"06",checkin:120,security:80, boarding:40},
  {t:"08",checkin:450,security:380,boarding:200},
  {t:"10",checkin:820,security:720,boarding:580},
  {t:"12",checkin:950,security:880,boarding:720},
  {t:"14",checkin:880,security:820,boarding:680},
  {t:"16",checkin:920,security:850,boarding:700},
  {t:"18",checkin:1050,security:980,boarding:820},
  {t:"20",checkin:780,security:720,boarding:600},
  {t:"22",checkin:320,security:280,boarding:240},
];

const ONTIME_TREND = [
  {d:"Mon",rate:94.2},{d:"Tue",rate:91.8},{d:"Wed",rate:96.1},
  {d:"Thu",rate:88.4},{d:"Fri",rate:92.7},{d:"Sat",rate:89.3},{d:"Sun",rate:93.5},
];

const TERMINAL_LOAD = [
  {name:"T1",current:2840,capacity:4000,util:71,gates:12,flights:48},
  {name:"T2",current:3120,capacity:4500,util:69,gates:15,flights:56},
  {name:"T3",current:4680,capacity:5500,util:85,gates:22,flights:89},
];

const AIRLINE_PERF = [
  {airline:"Air India",flights:42,ontime:91.2,pax:14280,delay:12},
  {airline:"IndiGo",   flights:68,ontime:93.8,pax:21760,delay:8},
  {airline:"Vistara",  flights:31,ontime:89.5,pax:8680, delay:18},
  {airline:"SpiceJet", flights:28,ontime:86.1,pax:7280, delay:24},
  {airline:"Emirates", flights:12,ontime:96.7,pax:5040, delay:5},
  {airline:"Akasa",    flights:18,ontime:92.4,pax:4320, delay:11},
];

const RADAR_DATA = [
  {m:"On-Time",value:91},{m:"Capacity",value:78},{m:"Revenue",value:84},
  {m:"Safety",value:97},{m:"Customer",value:82},{m:"Efficiency",value:88},
];

const SECURITY_DATA = [
  {t:"06",wait:3},{t:"07",wait:8},{t:"08",wait:18},{t:"09",wait:22},
  {t:"10",wait:15},{t:"11",wait:12},{t:"12",wait:14},{t:"13",wait:11},
  {t:"14",wait:13},{t:"15",wait:10},{t:"16",wait:16},{t:"17",wait:20},
  {t:"18",wait:24},{t:"19",wait:19},{t:"20",wait:12},{t:"21",wait:7},
];

function KPICard({label,value,sub,trend,color,icon,live=false}:{
  label:string;value:string;sub:string;trend:number;color:string;icon:React.ReactNode;live?:boolean
}) {
  const up = trend>=0;
  return (
    <div className="relative rounded-2xl p-5 border overflow-hidden group hover:scale-[1.02] transition-all duration-200"
      style={{background:`linear-gradient(135deg,${color}12,${color}05)`,borderColor:`${color}25`}}>
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-5"
        style={{background:color,transform:"translate(30%,-30%)"}}/>
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{background:`${color}18`}}>
          <span style={{color}}>{icon}</span>
        </div>
        {live && <div className="flex items-center gap-1 text-xs" style={{color:"#4ade80"}}>
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"/>Live
        </div>}
      </div>
      <div className="text-2xl font-black text-white mb-0.5">{value}</div>
      <div className="text-xs text-slate-400 mb-2">{label}</div>
      <div className={`flex items-center gap-1 text-xs font-semibold`}
        style={{color:up?"#4ade80":"#f87171"}}>
        {up?<TrendingUp className="w-3 h-3"/>:<TrendingDown className="w-3 h-3"/>}
        {Math.abs(trend)}% {sub}
      </div>
    </div>
  );
}

export function AnalyticsDashboard() {
  const [period, setPeriod] = useState<"day"|"week"|"month">("week");
  const [liveTime, setTime] = useState(new Date());
  const [selAirline, setSelAirline] = useState<string|null>(null);

  useEffect(()=>{
    const t = setInterval(()=>setTime(new Date()),1000);
    return ()=>clearInterval(t);
  },[]);

  const totalFlights = WEEKLY.reduce((s,d)=>s+d.dom+d.intl,0);
  const totalPax     = HOURLY.reduce((s,h)=>s+h.pax,0);
  const avgOnTime    = (ONTIME_TREND.reduce((s,d)=>s+d.rate,0)/ONTIME_TREND.length).toFixed(1);
  const totalDelays  = WEEKLY.reduce((s,d)=>s+d.delayed,0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics Intelligence</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Delhi IGI Airport · Live: {liveTime.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 p-1 rounded-xl"
            style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)"}}>
            {(["day","week","month"] as const).map(p=>(
              <button key={p} onClick={()=>setPeriod(p)}
                className="px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all"
                style={period===p
                  ?{background:"linear-gradient(135deg,#0ea5e9,#14b8a6)",color:"white"}
                  :{color:"#64748b"}}>
                {p}
              </button>
            ))}
          </div>
          <button className="p-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white transition-colors">
            <RefreshCw className="w-4 h-4"/>
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 xl:grid-cols-6 gap-4">
        <KPICard label="Total Flights"    value={String(totalFlights)} sub="vs last week" trend={8.4}  color="#0ea5e9" icon={<Plane className="w-5 h-5"/>} live/>
        <KPICard label="Passengers"       value={totalPax.toLocaleString()} sub="vs yesterday" trend={12.1} color="#14b8a6" icon={<Users className="w-5 h-5"/>} live/>
        <KPICard label="On-Time Rate"     value={`${avgOnTime}%`}  sub="vs target 95%" trend={-2.8} color="#8b5cf6" icon={<Clock className="w-5 h-5"/>}/>
        <KPICard label="Delayed Flights"  value={String(totalDelays)} sub="vs last week"  trend={-15} color="#f59e0b" icon={<AlertTriangle className="w-5 h-5"/>}/>
        <KPICard label="Gate Utilization" value="78.4%"             sub="vs last month" trend={3.2}  color="#22c55e" icon={<Target className="w-5 h-5"/>}/>
        <KPICard label="AI Predictions"   value="98.2%"             sub="accuracy rate" trend={1.4}  color="#ec4899" icon={<Zap className="w-5 h-5"/>}/>
      </div>

      {/* Row 2: Flight volume + PAX flow */}
      <div className="grid xl:grid-cols-2 gap-5">
        {/* Flight volume */}
        <div className="rounded-2xl border p-5" style={{background:"#080d18",borderColor:"#1e2d4d"}}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-bold text-white">Flight Volume</h2>
              <p className="text-xs text-slate-500 mt-0.5">Domestic vs International vs Delayed</p>
            </div>
            <div className="flex gap-3 text-xs">
              {[{l:"Domestic",c:"#0ea5e9"},{l:"Intl",c:"#14b8a6"},{l:"Delayed",c:"#f59e0b"}].map(({l,c})=>(
                <div key={l} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{background:c}}/>
                  <span className="text-slate-400">{l}</span>
                </div>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={WEEKLY} margin={{left:-20}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4d" vertical={false}/>
              <XAxis dataKey="d" tick={{fill:"#475569",fontSize:11}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:"#475569",fontSize:11}} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={TOOLTIP_STYLE}/>
              <Bar dataKey="dom"     name="Domestic"  fill="#0ea5e9" radius={[4,4,0,0]} stackId="a"/>
              <Bar dataKey="intl"    name="Intl"      fill="#14b8a6" radius={[4,4,0,0]} stackId="a"/>
              <Bar dataKey="delayed" name="Delayed"   fill="#f59e0b" radius={[4,4,0,0]} stackId="b"/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Passenger flow */}
        <div className="rounded-2xl border p-5" style={{background:"#080d18",borderColor:"#1e2d4d"}}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-bold text-white">Passenger Flow</h2>
              <p className="text-xs text-slate-500 mt-0.5">Check-in → Security → Boarding (today)</p>
            </div>
            <div className="text-xs px-3 py-1 rounded-full font-semibold"
              style={{background:"rgba(56,189,248,0.12)",color:"#38bdf8",border:"1px solid rgba(56,189,248,0.2)"}}>
              Peak: 18:00
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={PAXFLOW} margin={{left:-20}}>
              <defs>
                {[["ci","#0ea5e9"],["sec","#8b5cf6"],["brd","#14b8a6"]].map(([id,c])=>(
                  <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={c} stopOpacity={0.25}/>
                    <stop offset="95%" stopColor={c} stopOpacity={0}/>
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4d" vertical={false}/>
              <XAxis dataKey="t" tick={{fill:"#475569",fontSize:11}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:"#475569",fontSize:11}} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={TOOLTIP_STYLE}/>
              <Area type="monotone" dataKey="checkin"  name="Check-in" stroke="#0ea5e9" fill="url(#ci)"  strokeWidth={2}/>
              <Area type="monotone" dataKey="security" name="Security" stroke="#8b5cf6" fill="url(#sec)" strokeWidth={2}/>
              <Area type="monotone" dataKey="boarding" name="Boarding" stroke="#14b8a6" fill="url(#brd)" strokeWidth={2}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 3: On-time trend + Security wait + Radar */}
      <div className="grid xl:grid-cols-3 gap-5">
        {/* On-time trend */}
        <div className="rounded-2xl border p-5" style={{background:"#080d18",borderColor:"#1e2d4d"}}>
          <h2 className="font-bold text-white mb-1">On-Time Performance</h2>
          <p className="text-xs text-slate-500 mb-4">Weekly trend vs 95% target</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={ONTIME_TREND} margin={{left:-20}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4d" vertical={false}/>
              <XAxis dataKey="d" tick={{fill:"#475569",fontSize:11}} axisLine={false} tickLine={false}/>
              <YAxis domain={[80,100]} tick={{fill:"#475569",fontSize:11}} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v:any)=>[`${v}%`,"On-Time"]}/>
              <Line type="monotone" dataKey="rate" stroke="#22c55e" strokeWidth={2.5} dot={{fill:"#22c55e",r:4}} name="On-Time %"/>
              {/* Target line reference */}
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-3 flex justify-between text-xs">
            <span className="text-slate-500">Target: 95%</span>
            <span className={parseFloat(avgOnTime)>=95?"text-green-400":"text-yellow-400"}>
              Avg: {avgOnTime}% {parseFloat(avgOnTime)>=95?"✓":"⚠ Below target"}
            </span>
          </div>
        </div>

        {/* Security wait times */}
        <div className="rounded-2xl border p-5" style={{background:"#080d18",borderColor:"#1e2d4d"}}>
          <h2 className="font-bold text-white mb-1">Security Wait Times</h2>
          <p className="text-xs text-slate-500 mb-4">Average minutes — today by hour</p>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={SECURITY_DATA} margin={{left:-20}}>
              <defs>
                <linearGradient id="swg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4d" vertical={false}/>
              <XAxis dataKey="t" tick={{fill:"#475569",fontSize:10}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:"#475569",fontSize:11}} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v:any)=>[`${v} min`,"Wait"]}/>
              <Area type="monotone" dataKey="wait" stroke="#ef4444" fill="url(#swg)" strokeWidth={2} name="Wait (min)"/>
            </AreaChart>
          </ResponsiveContainer>
          <div className="mt-3 flex justify-between text-xs">
            <span className="text-slate-500">Current peak: 18:00</span>
            <span className="text-red-400 font-semibold">Max: 24 min ⚠️</span>
          </div>
        </div>

        {/* Performance radar */}
        <div className="rounded-2xl border p-5" style={{background:"#080d18",borderColor:"#1e2d4d"}}>
          <h2 className="font-bold text-white mb-1">Airport Scorecard</h2>
          <p className="text-xs text-slate-500 mb-2">6-metric performance radar</p>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={RADAR_DATA}>
              <PolarGrid stroke="#1e3a5f"/>
              <PolarAngleAxis dataKey="m" tick={{fill:"#64748b",fontSize:10}}/>
              <PolarRadiusAxis angle={30} domain={[0,100]} tick={{fill:"#475569",fontSize:8}}/>
              <Radar dataKey="value" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.18} name="Score"/>
              <Tooltip contentStyle={TOOLTIP_STYLE}/>
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 4: Terminal load + Airline performance */}
      <div className="grid xl:grid-cols-2 gap-5">
        {/* Terminal utilization */}
        <div className="rounded-2xl border p-5" style={{background:"#080d18",borderColor:"#1e2d4d"}}>
          <h2 className="font-bold text-white mb-4">Terminal Utilization</h2>
          <div className="space-y-4">
            {TERMINAL_LOAD.map(t=>{
              const color = t.util>80?"#ef4444":t.util>70?"#f59e0b":"#22c55e";
              return (
                <div key={t.name}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white"
                        style={{background:`${color}18`,border:`1px solid ${color}30`}}>
                        {t.name}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">{t.current.toLocaleString()} / {t.capacity.toLocaleString()} pax</div>
                        <div className="text-xs text-slate-500">{t.gates} gates · {t.flights} flights today</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-lg" style={{color}}>{t.util}%</div>
                      <div className="text-xs" style={{color:t.util>80?"#fca5a5":"#94a3b8"}}>
                        {t.util>80?"⚠ High":t.util>70?"Moderate":"Normal"}
                      </div>
                    </div>
                  </div>
                  <div className="h-2.5 rounded-full overflow-hidden" style={{background:"#1e2d4d"}}>
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{width:`${t.util}%`,background:`linear-gradient(90deg,${color}99,${color})`}}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Airline performance table */}
        <div className="rounded-2xl border overflow-hidden" style={{background:"#080d18",borderColor:"#1e2d4d"}}>
          <div className="p-5 border-b" style={{borderColor:"#1e2d4d"}}>
            <h2 className="font-bold text-white">Airline Performance</h2>
            <p className="text-xs text-slate-500 mt-0.5">Click row for details</p>
          </div>
          <div className="table-scroll"><table className="w-full text-sm">
            <thead>
              <tr style={{borderBottom:"1px solid #1e2d4d"}}>
                {["Airline","Flights","On-Time","Pax","Avg Delay"].map(h=>(
                  <th key={h} className="px-4 py-3 text-left text-xs uppercase"
                    style={{color:"#475569"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {AIRLINE_PERF.map(a=>(
                <tr key={a.airline}
                  onClick={()=>setSelAirline(selAirline===a.airline?null:a.airline)}
                  className="cursor-pointer transition-all"
                  style={{
                    borderBottom:"1px solid #1e2d4d",
                    background:selAirline===a.airline?"rgba(14,165,233,0.08)":"transparent"
                  }}
                  onMouseEnter={e=>(e.currentTarget.style.background="rgba(255,255,255,0.03)")}
                  onMouseLeave={e=>(e.currentTarget.style.background=selAirline===a.airline?"rgba(14,165,233,0.08)":"transparent")}>
                  <td className="px-4 py-3.5 font-semibold text-white">{a.airline}</td>
                  <td className="px-4 py-3.5 font-mono text-slate-300">{a.flights}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{background:"#1e2d4d"}}>
                        <div className="h-full rounded-full"
                          style={{width:`${a.ontime}%`,background:a.ontime>=93?"#22c55e":a.ontime>=90?"#f59e0b":"#ef4444"}}/>
                      </div>
                      <span className={`text-xs font-bold ${a.ontime>=93?"text-green-400":a.ontime>=90?"text-yellow-400":"text-red-400"}`}>
                        {a.ontime}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-slate-400 text-xs">{a.pax.toLocaleString()}</td>
                  <td className="px-4 py-3.5">
                    <span className={`text-xs font-bold ${a.delay<=10?"text-green-400":a.delay<=20?"text-yellow-400":"text-red-400"}`}>
                      {a.delay} min
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </div>
      </div>

      {/* Row 5: Hourly traffic heatmap-style */}
      <div className="rounded-2xl border p-5" style={{background:"#080d18",borderColor:"#1e2d4d"}}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-bold text-white">Hourly Traffic Intelligence</h2>
            <p className="text-xs text-slate-500 mt-0.5">Flights & passengers per hour — today</p>
          </div>
          <div className="flex gap-2 text-xs">
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-sky-400"/>Flights</div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-teal-400"/>Passengers (÷100)</div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={HOURLY} margin={{left:-20}}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4d" vertical={false}/>
            <XAxis dataKey="h" tick={{fill:"#475569",fontSize:11}} axisLine={false} tickLine={false}/>
            <YAxis tick={{fill:"#475569",fontSize:11}} axisLine={false} tickLine={false}/>
            <Tooltip contentStyle={TOOLTIP_STYLE}
              formatter={(v:any)=>[v]}/>
            <Bar dataKey="flights"           name="Flights"    fill="#0ea5e9" radius={[4,4,0,0]} opacity={0.9}/>
            <Bar dataKey={(d:any)=>d.pax/100}name="Pax (÷100)"fill="#14b8a6" radius={[4,4,0,0]} opacity={0.7}/>
          </BarChart>
        </ResponsiveContainer>

        {/* Traffic heat strip */}
        <div className="mt-4">
          <div className="text-xs text-slate-500 mb-2">Traffic intensity by hour</div>
          <div className="flex gap-1">
            {HOURLY.map(({h,flights})=>{
              const intensity = flights/52;
              const r = Math.round(14 + intensity*225);
              const g = Math.round(165 + intensity*90);
              return (
                <div key={h} className="flex-1 rounded-md h-8 flex items-end justify-center pb-1 transition-all cursor-pointer"
                  style={{background:`rgba(${r},${g},233,${0.1+intensity*0.6})`}}
                  title={`${h}:00 — ${flights} flights`}>
                  <span className="text-xs font-mono" style={{color:`rgba(255,255,255,${0.4+intensity*0.6})`}}>{h}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Live alerts strip */}
      <div className="grid xl:grid-cols-3 gap-4">
        {[
          {type:"warning",title:"Gate C2 Near Capacity",  desc:"85% load · Emirates EK-511 · 428 pax",   icon:"⚠️"},
          {type:"info",   title:"Peak Traffic in 2 Hours",desc:"Predicted 52 simultaneous flights at 18:00",icon:"📊"},
          {type:"success",title:"On-Time Rate Above 90%", desc:"7 consecutive days above threshold",        icon:"✅"},
        ].map(({type,title,desc,icon})=>(
          <div key={title} className="flex items-start gap-3 p-4 rounded-xl border"
            style={{
              background:type==="warning"?"rgba(245,158,11,0.06)":type==="success"?"rgba(34,197,94,0.06)":"rgba(14,165,233,0.06)",
              borderColor:type==="warning"?"rgba(245,158,11,0.2)":type==="success"?"rgba(34,197,94,0.2)":"rgba(14,165,233,0.2)",
            }}>
            <span className="text-xl flex-shrink-0">{icon}</span>
            <div>
              <div className="font-semibold text-white text-sm">{title}</div>
              <div className="text-xs text-slate-400 mt-0.5">{desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
