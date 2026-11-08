import { useState } from "react";
import { Fuel, AlertTriangle, CheckCircle, Truck } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis,
         Tooltip, ResponsiveContainer } from "recharts";

const FUEL_DATA = [
  {flight:"AI-101", type:"ATF", required:18500, loaded:18700, remaining:200, status:"Fuelled",    truck:"T-01"},
  {flight:"6E-202", type:"ATF", required:12800, loaded:12800, remaining:0,   status:"Fuelled",    truck:"T-02"},
  {flight:"UK-303", type:"ATF", required:9200,  loaded:9000,  remaining:-200,status:"Low",        truck:"T-03"},
  {flight:"SG-404", type:"ATF", required:15600, loaded:0,     remaining:0,   status:"Pending",    truck:"T-01"},
  {flight:"IX-505", type:"ATF", required:22400, loaded:22400, remaining:0,   status:"Fuelled",    truck:"T-04"},
  {flight:"AI-707", type:"ATF", required:19800, loaded:5000,  remaining:0,   status:"In Progress",truck:"T-02"},
];

const daily = [
  {d:"Mon",used:142000},{d:"Tue",used:138000},{d:"Wed",used:155000},
  {d:"Thu",used:149000},{d:"Fri",used:168000},{d:"Sat",used:172000},
  {d:"Sun",used:161000},
];

const tanks = [
  {id:"Tank A",capacity:500000,current:312000,type:"ATF"},
  {id:"Tank B",capacity:300000,current:89000, type:"ATF"},
  {id:"Tank C",capacity:200000,current:156000,type:"AVGAS"},
];

const STATUS_STYLE: Record<string,string> = {
  "Fuelled":     "bg-green-500/15 text-green-400 border-green-500/20",
  "Pending":     "bg-slate-500/15 text-slate-400 border-slate-500/20",
  "In Progress": "bg-sky-500/15 text-sky-400 border-sky-500/20",
  "Low":         "bg-red-500/15 text-red-400 border-red-500/20",
};

const fmt = (n:number) => n>=1000?`${(n/1000).toFixed(1)}kL`:`${n}L`;

export function FuelManagement() {
  const [selected, setSelected] = useState<typeof FUEL_DATA[0]|null>(null);
  const totalLoaded = FUEL_DATA.reduce((s,f)=>s+f.loaded,0);
  const pending     = FUEL_DATA.filter(f=>f.status==="Pending").length;
  const alerts      = FUEL_DATA.filter(f=>f.status==="Low").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Fuel Management</h1>
        <p className="text-slate-400 text-sm mt-0.5">Aviation fuel monitoring & dispatch</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          {label:"Total Loaded Today", value:fmt(totalLoaded),   icon:<Fuel className="w-5 h-5"/>,         color:"sky"},
          {label:"Flights Fuelled",    value:FUEL_DATA.filter(f=>f.status==="Fuelled").length,
                                                                  icon:<CheckCircle className="w-5 h-5"/>,  color:"green"},
          {label:"Pending",            value:pending,             icon:<Truck className="w-5 h-5"/>,        color:"yellow"},
          {label:"Fuel Alerts",        value:alerts,              icon:<AlertTriangle className="w-5 h-5"/>,color:"red"},
        ].map(({label,value,icon,color})=>(
          <div key={label} className="bg-navy-800 rounded-2xl p-5 border border-navy-600">
            <div className={`text-${color}-400 mb-3`}>{icon}</div>
            <div className="text-2xl font-bold font-mono text-white mb-0.5">{value}</div>
            <div className="text-sm text-slate-400">{label}</div>
          </div>
        ))}
      </div>

      {/* Tank levels */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {tanks.map(t=>{
          const pct = Math.round(t.current/t.capacity*100);
          return (
            <div key={t.id} className="bg-navy-800 rounded-2xl p-5 border border-navy-600">
              <div className="flex justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-white">{t.id}</h3>
                  <div className="text-xs text-slate-400">{t.type}</div>
                </div>
                <div className={`text-2xl font-bold font-mono ${
                  pct<20?"text-red-400":pct<50?"text-yellow-400":"text-green-400"}`}>
                  {pct}%
                </div>
              </div>
              <div className="h-4 bg-navy-700 rounded-full overflow-hidden mb-2">
                <div className={`h-full rounded-full transition-all ${
                  pct<20?"bg-red-500":pct<50?"bg-yellow-500":"bg-green-500"}`}
                  style={{width:`${pct}%`}}/>
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>{fmt(t.current)} current</span>
                <span>{fmt(t.capacity)} capacity</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="bg-navy-800 rounded-2xl p-5 border border-navy-600">
          <h2 className="font-semibold text-white mb-4">Weekly Fuel Consumption</h2>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={daily} margin={{left:-20}}>
              <defs>
                <linearGradient id="fg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="d" tick={{fill:"#475569",fontSize:11}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:"#475569",fontSize:11}} axisLine={false} tickLine={false}
                tickFormatter={v=>`${v/1000}k`}/>
              <Tooltip contentStyle={{background:"#0f1629",border:"1px solid #1e2d4d",borderRadius:10,fontSize:12}}
                formatter={(v:any)=>[fmt(v),"Fuel Used"]}/>
              <Area type="monotone" dataKey="used" stroke="#f59e0b" fill="url(#fg)" strokeWidth={2} name="Litres"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-navy-800 rounded-2xl p-5 border border-navy-600">
          <h2 className="font-semibold text-white mb-4">Per Flight Fuel Load</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={FUEL_DATA} margin={{left:-20}}>
              <XAxis dataKey="flight" tick={{fill:"#475569",fontSize:10}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:"#475569",fontSize:11}} axisLine={false} tickLine={false}
                tickFormatter={v=>`${v/1000}k`}/>
              <Tooltip contentStyle={{background:"#0f1629",border:"1px solid #1e2d4d",borderRadius:10,fontSize:12}}
                formatter={(v:any)=>[fmt(v)]}/>
              <Bar dataKey="required" fill="#1e2d4d" radius={[4,4,0,0]} name="Required"/>
              <Bar dataKey="loaded"   fill="#f59e0b" radius={[4,4,0,0]} name="Loaded"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Fuel orders table */}
      <div className="bg-navy-800 rounded-2xl border border-navy-600 overflow-hidden">
        <div className="p-5 border-b border-navy-600 flex items-center gap-2">
          <Fuel className="w-5 h-5 text-yellow-400"/>
          <h2 className="font-semibold text-white">Fuelling Orders</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-500 text-xs uppercase">
              {["Flight","Type","Required","Loaded","Variance","Truck","Status"].map(h=>(
                <th key={h} className="px-5 py-3 text-left border-b border-navy-700">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FUEL_DATA.map((f,i)=>(
              <tr key={i} onClick={()=>setSelected(selected?.flight===f.flight?null:f)}
                className={`border-b border-navy-700/50 cursor-pointer transition-all ${
                  selected?.flight===f.flight?"bg-yellow-500/5":"hover:bg-navy-700/30"}`}>
                <td className="px-5 py-3 font-mono font-bold text-sky-300">{f.flight}</td>
                <td className="px-5 py-3 text-slate-300">{f.type}</td>
                <td className="px-5 py-3 font-mono text-slate-300">{fmt(f.required)}</td>
                <td className="px-5 py-3 font-mono text-white font-bold">{fmt(f.loaded)}</td>
                <td className="px-5 py-3 font-mono">
                  <span className={f.remaining<0?"text-red-400":f.remaining>0?"text-yellow-400":"text-green-400"}>
                    {f.remaining>0?"+":""}{fmt(f.remaining)}
                  </span>
                </td>
                <td className="px-5 py-3 text-slate-400 text-xs font-mono">{f.truck}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${STATUS_STYLE[f.status]}`}>
                    {f.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
