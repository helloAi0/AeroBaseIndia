import { useState } from "react";
import { Fuel, AlertTriangle, CheckCircle, Truck, IndianRupee, X } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis,
         Tooltip, ResponsiveContainer } from "recharts";
import { useAirlineScope } from "../../hooks/useAirlineScope";
import { AIRLINES, airlineOfFlight } from "../../data/airlines";
import { DataTable } from "../../components/ui/DataTable";
import type { Column } from "../../components/ui/DataTable";

const PRICE_PER_LITRE = 95; // ₹/L ATF, demo rate

type Order = {
  flight:string; type:string; required:number; loaded:number;
  status:string; truck:string; bay:string; note?:string;
};

const INITIAL_ORDERS: Order[] = [
  {flight:"AI-101",  type:"ATF", required:18500, loaded:18700, status:"Fuelled",     truck:"T-01", bay:"Bay 3"},
  {flight:"AI-819",  type:"ATF", required:62000, loaded:41000, status:"In Progress", truck:"T-05", bay:"Bay 7"},
  {flight:"AI-303",  type:"ATF", required:9800,  loaded:0,     status:"Pending",     truck:"T-01", bay:"Bay 3", note:"Fuel top-up delayed 20 min"},
  {flight:"6E-2341", type:"ATF", required:12800, loaded:12800, status:"Fuelled",     truck:"T-02", bay:"Bay 1"},
  {flight:"6E-501",  type:"ATF", required:11200, loaded:4000,  status:"In Progress", truck:"T-02", bay:"Bay 2"},
  {flight:"6E-5317", type:"ATF", required:12100, loaded:0,     status:"Pending",     truck:"T-06", bay:"Bay 1"},
  {flight:"UK-925",  type:"ATF", required:9200,  loaded:9000,  status:"Low",         truck:"T-03", bay:"Bay 5", note:"Short by 200 L"},
  {flight:"UK-202",  type:"ATF", required:9600,  loaded:0,     status:"Pending",     truck:"T-03", bay:"Bay 5"},
  {flight:"EK-511",  type:"ATF", required:118000,loaded:96000, status:"In Progress", truck:"T-08", bay:"Bay 8"},
  {flight:"SG-3405", type:"ATF", required:15600, loaded:15600, status:"Fuelled",     truck:"T-04", bay:"Bay 4"},
  {flight:"SG-2801", type:"ATF", required:15900, loaded:0,     status:"Pending",     truck:"T-04", bay:"Bay 4"},
  {flight:"QP-1401", type:"ATF", required:8400,  loaded:0,     status:"Pending",     truck:"T-07", bay:"Bay 6"},
  {flight:"IX-611",  type:"ATF", required:22400, loaded:22400, status:"Fuelled",     truck:"T-04", bay:"Bay 3"},
  {flight:"IX-201",  type:"ATF", required:21800, loaded:19000, status:"Low",         truck:"T-04", bay:"Bay 3", note:"Short by 2,800 L"},
];

// Share of airport fuel burn per airline (used to scale the weekly chart)
const SHARE: Record<string,number> = {AI:.28,"6E":.34,UK:.12,EK:.10,SG:.09,QP:.04,IX:.03};
const DAILY = [
  {d:"Mon",used:142000},{d:"Tue",used:138000},{d:"Wed",used:155000},
  {d:"Thu",used:149000},{d:"Fri",used:168000},{d:"Sat",used:172000},
  {d:"Sun",used:161000},
];
const TANKS = [
  {id:"Tank A",capacity:500000,current:312000,type:"ATF"},
  {id:"Tank B",capacity:300000,current:89000, type:"ATF"},
  {id:"Tank C",capacity:200000,current:156000,type:"AVGAS"},
];

const STATUS_STYLE: Record<string,string> = {
  "Fuelled":     "bg-green-500/15 text-green-400 border-green-500/20",
  "Pending":     "bg-slate-500/15 text-slate-400 border-slate-500/20",
  "In Progress": "bg-sky-500/15 text-sky-400 border-sky-500/20",
  "Low":         "bg-red-500/15 text-red-400 border-red-500/20",
  "Top-up Requested":"bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
};

const fmt = (n:number) => Math.abs(n)>=1000?`${(n/1000).toFixed(1)}kL`:`${n}L`;
const inr = (n:number) => n>=10000000?`₹${(n/10000000).toFixed(2)}Cr`:n>=100000?`₹${(n/100000).toFixed(1)}L`:`₹${n.toLocaleString("en-IN")}`;
const tooltipStyle = {background:"#0f1629",border:"1px solid #1e2d4d",borderRadius:10,fontSize:12};

export function FuelManagement() {
  const air = useAirlineScope();
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [selFlight, setSelFlight] = useState<string|null>(null);

  const mine = air.scope(orders, o=>o.flight);
  const selected = mine.find(o=>o.flight===selFlight) ?? null;
  const accent = air.isAirline ? air.color : "#f59e0b";

  const totalLoaded = mine.reduce((s,f)=>s+f.loaded,0);
  const pending  = mine.filter(f=>f.status==="Pending").length;
  const alerts   = mine.filter(f=>f.status==="Low"||f.status==="Top-up Requested").length;
  const fuelled  = mine.filter(f=>f.status==="Fuelled").length;
  const cost     = totalLoaded*PRICE_PER_LITRE;

  const daily = DAILY.map(d=>({d:d.d, used: Math.round(d.used*(air.code?SHARE[air.code]:1))}));

  const update = (flight:string, patch:Partial<Order>) =>
    setOrders(prev=>prev.map(o=>o.flight===flight?{...o,...patch}:o));

  const columns: Column<Order>[] = [
    {key:"flight",label:"Flight",primary:true,render:f=><span className="font-mono font-bold" style={{color:accent}}>{f.flight}</span>},
    ...(air.isAirline ? [] : [{key:"airline",label:"Airline",render:(f:Order)=><span className="text-slate-300">{AIRLINES[airlineOfFlight(f.flight)]?.name}</span>}]),
    {key:"required",label:"Required",render:f=><span className="font-mono text-slate-300">{fmt(f.required)}</span>},
    {key:"loaded",label:"Loaded",render:f=><span className="font-mono text-white font-bold">{fmt(f.loaded)}</span>},
    {key:"variance",label:"Variance",render:f=>{
      const v = f.status==="Fuelled" ? f.loaded-f.required : 0;
      return <span className={`font-mono ${v<0?"text-red-400":v>0?"text-yellow-400":"text-green-400"}`}>{v>0?"+":""}{fmt(v)}</span>;}},
    {key:"cost",label:"Cost",render:f=><span className="font-mono text-slate-300">{inr(f.loaded*PRICE_PER_LITRE)}</span>},
    {key:"truck",label:"Truck / Bay",render:f=><span className="text-slate-400 text-xs font-mono">{f.truck} · {f.bay}</span>},
    {key:"status",label:"Status",render:f=>(
      <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${STATUS_STYLE[f.status]}`}>{f.status}</span>)},
  ];

  const kpis = [
    {label:"Fuel Loaded Today", value:fmt(totalLoaded),  icon:<Fuel className="w-5 h-5"/>,          color:"#0ea5e9"},
    {label:"Fuel Cost",         value:inr(cost),         icon:<IndianRupee className="w-5 h-5"/>,   color:"#f59e0b"},
    {label:"Flights Fuelled",   value:`${fuelled}/${mine.length}`, icon:<CheckCircle className="w-5 h-5"/>, color:"#22c55e"},
    {label:"Pending",           value:pending,           icon:<Truck className="w-5 h-5"/>,         color:"#94a3b8"},
    {label:"Fuel Alerts",       value:alerts,            icon:<AlertTriangle className="w-5 h-5"/>, color:alerts>0?"#ef4444":"#22c55e"},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {air.isAirline ? `${air.name} Fuel Operations` : "Fuel Management"}
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {air.isAirline
              ? `${air.code} · Your airline's fuelling only · Rate ₹${PRICE_PER_LITRE}/L (ATF)`
              : "Aviation fuel monitoring & dispatch · All airlines"}
          </p>
        </div>
        {alerts>0 && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
            style={{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.3)",color:"#f87171"}}>
            <AlertTriangle className="w-4 h-4"/>{alerts} fuel alert{alerts!==1?"s":""}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
        {kpis.map(({label,value,icon,color})=>(
          <div key={label} className="rounded-2xl p-5 border" style={{background:`${color}0d`,borderColor:`${color}30`}}>
            <div className="mb-3" style={{color}}>{icon}</div>
            <div className="text-2xl font-bold font-mono text-white mb-0.5">{value}</div>
            <div className="text-sm text-slate-400">{label}</div>
          </div>
        ))}
      </div>

      {air.isAirline ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...new Set(mine.map(m=>m.bay))].map(bay=>{
            const bayOrders = mine.filter(m=>m.bay===bay);
            return (
              <div key={bay} className="bg-navy-800 rounded-2xl p-5 border border-navy-600">
                <div className="text-xs text-slate-500 uppercase tracking-wide">Allocated fuel bay</div>
                <div className="text-xl font-bold text-white mt-1">{bay}</div>
                <div className="text-xs text-slate-400 mt-1">{bayOrders.length} flight{bayOrders.length!==1?"s":""} · {fmt(bayOrders.reduce((s,o)=>s+o.loaded,0))} loaded</div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {TANKS.map(t=>{
            const pct = Math.round(t.current/t.capacity*100);
            return (
              <div key={t.id} className="bg-navy-800 rounded-2xl p-5 border border-navy-600">
                <div className="flex justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-white">{t.id}</h3>
                    <div className="text-xs text-slate-400">{t.type}</div>
                  </div>
                  <div className={`text-2xl font-bold font-mono ${pct<20?"text-red-400":pct<50?"text-yellow-400":"text-green-400"}`}>{pct}%</div>
                </div>
                <div className="h-4 bg-navy-700 rounded-full overflow-hidden mb-2">
                  <div className={`h-full rounded-full transition-all ${pct<20?"bg-red-500":pct<50?"bg-yellow-500":"bg-green-500"}`} style={{width:`${pct}%`}}/>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>{fmt(t.current)} current</span><span>{fmt(t.capacity)} capacity</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="bg-navy-800 rounded-2xl p-5 border border-navy-600">
          <h2 className="font-semibold text-white mb-4">Weekly Fuel Consumption{air.isAirline?` — ${air.name}`:""}</h2>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={daily} margin={{left:-20}}>
              <defs>
                <linearGradient id="fg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={accent} stopOpacity={0.25}/>
                  <stop offset="95%" stopColor={accent} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="d" tick={{fill:"#475569",fontSize:11}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:"#475569",fontSize:11}} axisLine={false} tickLine={false} tickFormatter={v=>`${Math.round(v/1000)}k`}/>
              <Tooltip contentStyle={tooltipStyle}/>
              <Area type="monotone" dataKey="used" stroke={accent} fill="url(#fg)" strokeWidth={2} name="Litres"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-navy-800 rounded-2xl p-5 border border-navy-600">
          <h2 className="font-semibold text-white mb-4">Per Flight Fuel Load</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={mine} margin={{left:-20}}>
              <XAxis dataKey="flight" tick={{fill:"#475569",fontSize:10}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:"#475569",fontSize:11}} axisLine={false} tickLine={false} tickFormatter={v=>`${Math.round(v/1000)}k`}/>
              <Tooltip contentStyle={tooltipStyle}/>
              <Bar dataKey="required" fill="#1e2d4d" radius={[4,4,0,0]} name="Required"/>
              <Bar dataKey="loaded"   fill={accent}  radius={[4,4,0,0]} name="Loaded"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-navy-800 rounded-2xl border border-navy-600 overflow-hidden">
        <div className="p-5 border-b border-navy-600 flex items-center gap-2">
          <Fuel className="w-5 h-5" style={{color:accent}}/>
          <h2 className="font-semibold text-white">Fuelling Orders</h2>
          <span className="text-xs text-slate-500 ml-1">tap a row for actions</span>
        </div>
        <DataTable<Order> rows={mine} rowKey={o=>o.flight} columns={columns}
          onRowClick={o=>setSelFlight(selFlight===o.flight?null:o.flight)}/>
      </div>

      {selected && (
        <div className="rounded-2xl border p-5" style={{background:"rgba(15,22,41,0.95)",borderColor:`${accent}50`}}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-2xl font-black font-mono text-white">{selected.flight}</div>
              <div className="text-sm text-slate-400">{AIRLINES[airlineOfFlight(selected.flight)]?.name} · {selected.bay} · truck {selected.truck}</div>
            </div>
            <button aria-label="Close" onClick={()=>setSelFlight(null)} className="text-slate-500 hover:text-white p-1"><X className="w-4 h-4"/></button>
          </div>
          <div className="mb-4">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-400">Loaded {fmt(selected.loaded)} of {fmt(selected.required)}</span>
              <span className="text-white font-bold">{Math.min(100,Math.round(selected.loaded/selected.required*100))}%</span>
            </div>
            <div className="h-3 bg-navy-700 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{width:`${Math.min(100,selected.loaded/selected.required*100)}%`,background:accent}}/>
            </div>
          </div>
          {selected.note && <div className="mb-4 p-3 rounded-xl text-sm text-yellow-300" style={{background:"rgba(245,158,11,0.08)"}}>⚠️ {selected.note}</div>}
          <div className="flex flex-wrap gap-2">
            {!air.isAirline && selected.status==="Pending" && (
              <button onClick={()=>update(selected.flight,{status:"In Progress",loaded:Math.round(selected.required*0.1)})}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{background:"#0ea5e9"}}>Dispatch truck</button>
            )}
            {!air.isAirline && selected.status==="In Progress" && (
              <button onClick={()=>update(selected.flight,{status:"Fuelled",loaded:selected.required,note:undefined})}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{background:"#22c55e"}}>Mark fuelled</button>
            )}
            {air.isAirline && selected.status!=="Top-up Requested" && selected.status!=="Pending" && (
              <button onClick={()=>update(selected.flight,{status:"Top-up Requested",note:"Top-up requested by airline ops"})}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{background:accent}}>Request top-up</button>
            )}
            {air.isAirline && selected.status==="Pending" && (
              <span className="text-xs text-slate-500 self-center">Fuelling not started yet — airport fuel ops will dispatch a truck.</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
