import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchFlights } from "../../api/client";
import { Plane, TrendingUp, Clock, Key, RefreshCw, CheckCircle } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid
} from "recharts";

const AIRLINES = [
  {code:"AI",  name:"Air India",      color:"#DC2626", flights:4},
  {code:"6E",  name:"IndiGo",         color:"#2563EB", flights:3},
  {code:"UK",  name:"Vistara",        color:"#7C3AED", flights:2},
  {code:"SG",  name:"SpiceJet",       color:"#EA580C", flights:3},
  {code:"IX",  name:"Air Asia India", color:"#DC2626", flights:2},
];

const perf = [
  {d:"Mon",ontime:92,delayed:8},{d:"Tue",ontime:88,delayed:12},
  {d:"Wed",ontime:95,delayed:5},{d:"Thu",ontime:90,delayed:10},
  {d:"Fri",ontime:85,delayed:15},{d:"Sat",ontime:93,delayed:7},
  {d:"Sun",ontime:97,delayed:3},
];

const turnaround = [
  {airline:"AI",avg:42},{airline:"6E",avg:35},{airline:"UK",avg:38},
  {airline:"SG",avg:45},{airline:"IX",avg:40},
];

export function PartnerPortal() {
  const [active,setActive] = useState("AI");
  const {data:flights=[]} = useQuery({queryKey:["flights"],queryFn:fetchFlights,refetchInterval:15000});
  const fl = flights as any[];
  const airline = AIRLINES.find(a=>a.code===active)??AIRLINES[0];
  const airlineFlights = fl.filter(f=>f.flight_number?.startsWith(active));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Airline Partner Portal</h1>
          <p className="text-slate-400 text-sm mt-0.5">Performance, slots & API integration</p>
        </div>
        <div className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-slate-500"/>
          <span className="text-xs text-slate-500">Live</span>
        </div>
      </div>

      {/* Airline selector */}
      <div className="flex gap-2 flex-wrap">
        {AIRLINES.map(a=>(
          <button key={a.code} onClick={()=>setActive(a.code)}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${
              active===a.code
                ?"bg-navy-700 border-sky-500/40 text-white"
                :"bg-navy-800 border-navy-600 text-slate-400 hover:border-navy-500 hover:text-slate-200"
            }`}>
            <div className="w-2.5 h-2.5 rounded-full" style={{background:a.color}}/>
            <span>{a.code}</span>
            {active===a.code && <span className="text-xs text-slate-400">— {a.name}</span>}
          </button>
        ))}
      </div>

      {/* Airline KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          {label:"Active Flights", value:airlineFlights.length||airline.flights,
           icon:<Plane className="w-5 h-5"/>, color:"sky"},
          {label:"On-Time Rate",   value:"91%",
           icon:<CheckCircle className="w-5 h-5"/>, color:"green"},
          {label:"Avg Turnaround", value:"38 min",
           icon:<Clock className="w-5 h-5"/>, color:"teal"},
          {label:"Revenue Share",  value:"₹2.4Cr",
           icon:<TrendingUp className="w-5 h-5"/>, color:"yellow"},
        ].map(({label,value,icon,color})=>(
          <div key={label} className={`bg-navy-800 border rounded-2xl p-5 border-navy-600`}>
            <div className={`text-${color}-400 mb-3`}>{icon}</div>
            <div className="text-2xl font-bold font-mono text-white mb-0.5">{value}</div>
            <div className="text-sm text-slate-400">{label}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* On-time performance */}
        <div className="bg-navy-800 rounded-2xl p-5 border border-navy-600">
          <h2 className="font-semibold text-white mb-4">Weekly Performance</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={perf} margin={{left:-20}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a2540"/>
              <XAxis dataKey="d" tick={{fill:"#475569",fontSize:11}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:"#475569",fontSize:11}} axisLine={false} tickLine={false} tickFormatter={v=>`${v}%`}/>
              <Tooltip contentStyle={{background:"#0f1629",border:"1px solid #1e2d4d",borderRadius:10,fontSize:12}}
                labelStyle={{color:"#94a3b8"}}/>
              <Line type="monotone" dataKey="ontime" stroke="#22c55e" strokeWidth={2} dot={false} name="On Time %"/>
              <Line type="monotone" dataKey="delayed" stroke="#f59e0b" strokeWidth={2} dot={false} name="Delayed %"/>
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Turnaround comparison */}
        <div className="bg-navy-800 rounded-2xl p-5 border border-navy-600">
          <h2 className="font-semibold text-white mb-4">Avg Turnaround (min)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={turnaround} margin={{left:-20}}>
              <XAxis dataKey="airline" tick={{fill:"#475569",fontSize:11}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:"#475569",fontSize:11}} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{background:"#0f1629",border:"1px solid #1e2d4d",borderRadius:10,fontSize:12}}
                labelStyle={{color:"#94a3b8"}}/>
              <Bar dataKey="avg" fill="#38bdf8" radius={[6,6,0,0]} name="Avg min"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Flights for this airline */}
      <div className="bg-navy-800 rounded-2xl border border-navy-600 overflow-hidden">
        <div className="p-5 border-b border-navy-600 flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{background:airline.color}}/>
          <h2 className="font-semibold text-white">{airline.name} Flights</h2>
          <span className="text-xs bg-navy-700 text-slate-400 px-2 py-0.5 rounded-full ml-1">
            {airlineFlights.length} active
          </span>
        </div>
        {airlineFlights.length===0 ? (
          <div className="py-10 text-center text-slate-500 text-sm">
            <Plane className="w-8 h-8 mx-auto mb-2 opacity-30"/>
            No flights found for {airline.name} today
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-500 text-xs uppercase">
                {["Flight","Route","Gate","Status"].map(h=>(
                  <th key={h} className="px-5 py-3 text-left border-b border-navy-700">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {airlineFlights.map((f:any,i:number)=>(
                <tr key={i} className="border-b border-navy-700/50 hover:bg-navy-700/30">
                  <td className="px-5 py-3 font-mono font-bold text-sky-300">{f.flight_number}</td>
                  <td className="px-5 py-3 text-slate-300">{f.origin}→{f.destination}</td>
                  <td className="px-5 py-3 font-mono text-xs bg-navy-700 text-slate-200 rounded">{f.gate||"TBD"}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      f.status==="Delayed"?"bg-yellow-500/15 text-yellow-400":
                      f.status==="Boarding"?"bg-teal-500/15 text-teal-400":
                      "bg-sky-500/15 text-sky-400"}`}>{f.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* API Key section */}
      <div className="bg-navy-800 rounded-2xl p-5 border border-navy-600">
        <div className="flex items-center gap-2 mb-4">
          <Key className="w-5 h-5 text-sky-400"/>
          <h2 className="font-semibold text-white">API Integration</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            {label:"Partner API Key", value:"pk_live_DEL_"+airline.code+"_••••••••••••", copy:true},
            {label:"Webhook URL", value:"https://api.aerobase.in/webhooks/"+airline.code.toLowerCase(), copy:true},
            {label:"Rate Limit", value:"1000 req/min"},
            {label:"SLA Uptime", value:"99.9% guaranteed"},
          ].map(({label,value,copy})=>(
            <div key={label} className="p-3.5 bg-navy-700/60 rounded-xl">
              <div className="text-xs text-slate-500 mb-1">{label}</div>
              <div className="font-mono text-sm text-slate-200 flex items-center justify-between">
                <span className="truncate">{value}</span>
                {copy && <button className="text-xs text-sky-400 hover:text-sky-300 ml-2 flex-shrink-0">Copy</button>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
