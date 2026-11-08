import { useQuery } from "@tanstack/react-query";
import { fetchFlights, fetchOrders, fetchHealth } from "../../api/client";
import { Target, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis,
         PolarRadiusAxis, ResponsiveContainer, Tooltip,
         AreaChart, Area, XAxis, YAxis } from "recharts";

const TOOLTIP = {background:"#0f1629",border:"1px solid #1e2d4d",borderRadius:10,fontSize:12};

const KPI_DATA = [
  {category:"Operations",
   kpis:[
    {name:"On-Time Departure Rate", target:92, actual:91.2, unit:"%",  trend:"down"},
    {name:"Gate Utilization",       target:85, actual:78.4, unit:"%",  trend:"down"},
    {name:"Baggage Delivery Time",  target:20, actual:18.2, unit:"min",trend:"up"},
    {name:"Passenger Throughput",   target:5000,actual:4840,unit:"/hr",trend:"down"},
   ]},
  {category:"Financial",
   kpis:[
    {name:"Revenue Per Passenger",  target:850,  actual:920,  unit:"₹",  trend:"up"},
    {name:"Cost Per Flight",        target:12000,actual:11200,unit:"₹",  trend:"up"},
    {name:"Non-Aero Revenue Share", target:35,   actual:34,   unit:"%",  trend:"down"},
    {name:"NPS Score",              target:55,   actual:54,   unit:"pts",trend:"up"},
   ]},
  {category:"Safety",
   kpis:[
    {name:"Safety Incidents",       target:0,  actual:0,  unit:"",   trend:"up"},
    {name:"Security Compliance",    target:100,actual:97, unit:"%",  trend:"down"},
    {name:"DGCA Audit Score",       target:95, actual:96, unit:"%",  trend:"up"},
    {name:"Staff Certification",    target:100,actual:94, unit:"%",  trend:"down"},
   ]},
];

const radarData = [
  {metric:"Ops",      score:88},
  {metric:"Finance",  score:82},
  {metric:"Safety",   score:96},
  {metric:"Passenger",score:78},
  {metric:"Tech",     score:91},
  {metric:"Retail",   score:75},
];

const trend12m = [
  {m:"Jan",ops:82,fin:78,safety:94},{m:"Feb",ops:85,fin:80,safety:95},
  {m:"Mar",ops:84,fin:82,safety:96},{m:"Apr",ops:88,fin:81,safety:96},
  {m:"May",ops:87,fin:84,safety:97},{m:"Jun",ops:90,fin:85,safety:97},
];

export function KPIDashboard() {
  const {data:flights=[]} = useQuery({queryKey:["flights"],queryFn:fetchFlights});
  const {data:ordersData} = useQuery({queryKey:["orders"],queryFn:fetchOrders});
  const {data:health}     = useQuery({queryKey:["health"],queryFn:fetchHealth,refetchInterval:10000});

  const fl     = flights as any[];
  const orders = (ordersData as any)?.orders??[];
  const revenue = orders.reduce((s:number,o:any)=>s+o.amount,0)+149999;

  const overallScore = Math.round(
    KPI_DATA.flatMap(c=>c.kpis).reduce((s,k)=>
      s+(k.trend==="up"?100:k.actual/k.target*100),0) /
    KPI_DATA.flatMap(c=>c.kpis).length
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">KPI Dashboard</h1>
          <p className="text-slate-400 text-sm mt-0.5">Key performance indicators — Delhi IGI Airport</p>
        </div>
        <div className="text-center bg-navy-800 rounded-2xl px-6 py-3 border border-navy-600">
          <div className={`text-3xl font-bold font-mono ${
            overallScore>=90?"text-green-400":overallScore>=75?"text-yellow-400":"text-red-400"}`}>
            {overallScore}
          </div>
          <div className="text-xs text-slate-400">Overall Score</div>
        </div>
      </div>

      {/* Live metrics from backend */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          {label:"Live Flights",   value:fl.length,                                    ok:fl.length>0},
          {label:"System Health",  value:(health as any)?.status==="healthy"?"UP":"DOWN",ok:(health as any)?.status==="healthy"},
          {label:"Revenue",        value:`₹${(revenue/1000).toFixed(0)}K`,              ok:revenue>0},
          {label:"Orders Today",   value:orders.length,                                 ok:orders.length>=0},
        ].map(({label,value,ok})=>(
          <div key={label} className="bg-navy-800 rounded-2xl p-5 border border-navy-600">
            <div className={`w-2 h-2 rounded-full mb-3 ${ok?"bg-green-400 animate-pulse":"bg-red-400"}`}/>
            <div className="text-2xl font-bold font-mono text-white mb-0.5">{value}</div>
            <div className="text-sm text-slate-400">{label}</div>
          </div>
        ))}
      </div>

      {/* Radar + trend */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="bg-navy-800 rounded-2xl p-5 border border-navy-600">
          <h2 className="font-semibold text-white mb-2">Performance Radar</h2>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#1e2d4d"/>
              <PolarAngleAxis dataKey="metric" tick={{fill:"#475569",fontSize:11}}/>
              <PolarRadiusAxis angle={30} domain={[0,100]} tick={{fill:"#475569",fontSize:9}}/>
              <Radar dataKey="score" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.15} name="Score"/>
              <Tooltip contentStyle={TOOLTIP}/>
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-navy-800 rounded-2xl p-5 border border-navy-600">
          <h2 className="font-semibold text-white mb-4">KPI Trend — 6 Months</h2>
          <ResponsiveContainer width="100%" height={230}>
            <AreaChart data={trend12m} margin={{left:-20}}>
              <defs>
                {[["og","#0ea5e9"],["fg","#22c55e"],["sg","#8b5cf6"]].map(([id,c])=>(
                  <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={c} stopOpacity={0.2}/>
                    <stop offset="95%" stopColor={c} stopOpacity={0}/>
                  </linearGradient>
                ))}
              </defs>
              <XAxis dataKey="m" tick={{fill:"#475569",fontSize:11}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:"#475569",fontSize:11}} axisLine={false} tickLine={false} domain={[70,100]}/>
              <Tooltip contentStyle={TOOLTIP}/>
              <Area type="monotone" dataKey="ops"    stroke="#0ea5e9" fill="url(#og)" strokeWidth={2} name="Operations"/>
              <Area type="monotone" dataKey="fin"    stroke="#22c55e" fill="url(#fg)" strokeWidth={2} name="Financial"/>
              <Area type="monotone" dataKey="safety" stroke="#8b5cf6" fill="url(#sg)" strokeWidth={2} name="Safety"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* KPI cards per category */}
      {KPI_DATA.map(({category,kpis})=>(
        <div key={category} className="bg-navy-800 rounded-2xl border border-navy-600 overflow-hidden">
          <div className="p-5 border-b border-navy-600 flex items-center gap-2">
            <Target className="w-5 h-5 text-sky-400"/>
            <h2 className="font-semibold text-white">{category} KPIs</h2>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 p-4">
            {kpis.map(k=>{
              const pct = Math.min((k.actual/Math.max(k.target,1))*100,100);
              const met = k.trend==="up" ? k.actual>=k.target : k.actual<=k.target;
              return (
                <div key={k.name} className={`p-4 rounded-xl border ${
                  met?"border-green-500/20 bg-green-500/5":"border-red-500/20 bg-red-500/5"}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white">{k.name}</span>
                    {met
                      ? <TrendingUp className="w-4 h-4 text-green-400"/>
                      : k.trend==="up"
                        ? <TrendingDown className="w-4 h-4 text-red-400"/>
                        : <Minus className="w-4 h-4 text-yellow-400"/>
                    }
                  </div>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className={`text-2xl font-bold font-mono ${met?"text-green-400":"text-red-400"}`}>
                      {k.actual}{k.unit}
                    </span>
                    <span className="text-xs text-slate-500">target: {k.target}{k.unit}</span>
                  </div>
                  <div className="h-1.5 bg-navy-700 rounded-full">
                    <div className={`h-full rounded-full ${met?"bg-green-500":"bg-red-500"}`}
                      style={{width:`${pct}%`}}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
