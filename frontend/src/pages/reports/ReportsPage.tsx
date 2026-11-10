import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchFlights, fetchOrders } from "../../api/client";
import { FileText, Download, BarChart3, Plane,
         CreditCard, Shield, CheckCircle, Clock } from "lucide-react";

const REPORT_TYPES = [
  {
    id:"flight-ops",    icon:<Plane className="w-6 h-6"/>,
    title:"Flight Operations Report",
    desc:"Daily/weekly flight summary with delays, gates, routes",
    color:"sky",     format:"PDF / CSV",   time:"~2s",
  },
  {
    id:"revenue",       icon:<CreditCard className="w-6 h-6"/>,
    title:"Revenue Report",
    desc:"Airline fees, retail, cargo, and non-aero revenue breakdown",
    color:"green",   format:"PDF / Excel", time:"~3s",
  },
  {
    id:"passenger",     icon:<BarChart3 className="w-6 h-6"/>,
    title:"Passenger Traffic Report",
    desc:"Terminal-wise passenger volume and peak hour analysis",
    color:"teal",    format:"PDF / CSV",   time:"~2s",
  },
  {
    id:"security",      icon:<Shield className="w-6 h-6"/>,
    title:"Security & Compliance Report",
    desc:"Incident log, audit trail, and DGCA compliance summary",
    color:"red",     format:"PDF",         time:"~4s",
  },
  {
    id:"staff",         icon:<FileText className="w-6 h-6"/>,
    title:"Staff Performance Report",
    desc:"Duty hours, certifications, shift coverage analysis",
    color:"purple",  format:"PDF / Excel", time:"~2s",
  },
  {
    id:"billing",       icon:<CreditCard className="w-6 h-6"/>,
    title:"Billing & Invoice Report",
    desc:"All payment orders, invoice status, gateway summary",
    color:"yellow",  format:"PDF / CSV",   time:"~2s",
  },
];

const RECENT = [
  {name:"Flight Ops — Apr 2024",       date:"Apr 30",size:"2.4 MB",type:"PDF"},
  {name:"Revenue Report — Q1 2024",    date:"Mar 31",size:"3.8 MB",type:"Excel"},
  {name:"Passenger Traffic — Apr 2024",date:"Apr 30",size:"1.9 MB",type:"CSV"},
  {name:"Security Report — Apr 2024",  date:"Apr 30",size:"4.2 MB",type:"PDF"},
];

export function ReportsPage() {
  const [generating, setGenerating] = useState<string|null>(null);
  const [done, setDone]             = useState<string[]>([]);
  const [period, setPeriod]         = useState("monthly");

  const {data:flights=[]} = useQuery({queryKey:["flights"],queryFn:fetchFlights});
  const {data:ordersData} = useQuery({queryKey:["orders"], queryFn:fetchOrders});
  const fl     = flights as any[];
  const orders = (ordersData as any)?.orders??[];

  const generate = (id:string, time:string) => {
    setGenerating(id);
    const ms = parseInt(time.replace(/[^0-9]/g,''))*1000;
    setTimeout(()=>{ setGenerating(null); setDone(p=>[...p,id]); }, ms);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Reports & Export</h1>
          <p className="text-slate-400 text-sm mt-0.5">Generate and download airport reports</p>
        </div>
        <div className="flex gap-1.5 bg-navy-800 p-1 rounded-xl border border-navy-600">
          {["daily","weekly","monthly","quarterly"].map(p=>(
            <button key={p} onClick={()=>setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                period===p?"bg-sky-500 text-white":"text-slate-400 hover:text-white"}`}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Live data summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {label:"Flights in DB",   value:fl.length,    color:"sky"},
          {label:"Payment Orders",  value:orders.length, color:"green"},
          {label:"Data Period",     value:period.charAt(0).toUpperCase()+period.slice(1), color:"purple"},
        ].map(({label,value,color})=>(
          <div key={label} className="bg-navy-800 rounded-2xl p-4 border border-navy-600 text-center">
            <div className={`text-2xl font-bold font-mono text-${color}-400 mb-1`}>{value}</div>
            <div className="text-sm text-slate-400">{label}</div>
          </div>
        ))}
      </div>

      {/* Report cards */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {REPORT_TYPES.map(r=>{
          const isGen  = generating===r.id;
          const isDone = done.includes(r.id);
          return (
            <div key={r.id}
              className={`bg-navy-800 rounded-2xl p-5 border transition-all ${
                isDone?"border-green-500/30":"border-navy-600 hover:border-navy-500"
              }`}>
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl bg-${r.color}-500/15 text-${r.color}-400 flex-shrink-0`}>
                  {r.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white mb-1">{r.title}</h3>
                  <p className="text-sm text-slate-400 mb-3">{r.desc}</p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs bg-navy-700 text-slate-400 px-2.5 py-1 rounded-full">
                      {r.format}
                    </span>
                    <span className="text-xs text-slate-500">Gen time: {r.time}</span>
                    {isDone && (
                      <span className="text-xs text-green-400 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5"/>Ready
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={()=>generate(r.id, r.time)}
                  disabled={isGen}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex-shrink-0 ${
                    isDone
                      ?"bg-green-500/15 text-green-400 border border-green-500/20 hover:bg-green-500/25"
                      :isGen
                        ?"bg-navy-700 text-slate-400 cursor-wait"
                        :`bg-${r.color}-500/15 text-${r.color}-400 border border-${r.color}-500/20 hover:bg-${r.color}-500/25`
                  }`}>
                  {isGen
                    ?<><Clock className="w-4 h-4 animate-spin"/>Generating...</>
                    :isDone
                      ?<><Download className="w-4 h-4"/>Download</>
                      :<><BarChart3 className="w-4 h-4"/>Generate</>
                  }
                </button>
              </div>
              {isGen && (
                <div className="mt-3 h-1.5 bg-navy-700 rounded-full overflow-hidden">
                  <div className={`h-full bg-${r.color}-500 rounded-full animate-pulse`} style={{width:"60%"}}/>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Recent reports */}
      <div className="bg-navy-800 rounded-2xl border border-navy-600 overflow-hidden">
        <div className="p-5 border-b border-navy-600 flex items-center gap-2">
          <FileText className="w-5 h-5 text-sky-400"/>
          <h2 className="font-semibold text-white">Recent Reports</h2>
        </div>
        <div className="table-scroll"><table className="w-full text-sm">
          <thead>
            <tr className="text-slate-500 text-xs uppercase">
              {["Report Name","Generated","Size","Format","Action"].map(h=>(
                <th key={h} className="px-5 py-3 text-left border-b border-navy-700">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {RECENT.map((r,i)=>(
              <tr key={i} className="border-b border-navy-700/50 hover:bg-navy-700/30">
                <td className="px-5 py-3.5 text-slate-200 font-medium">{r.name}</td>
                <td className="px-5 py-3.5 text-slate-400">{r.date}</td>
                <td className="px-5 py-3.5 text-slate-400 font-mono text-xs">{r.size}</td>
                <td className="px-5 py-3.5">
                  <span className="text-xs bg-navy-700 text-slate-300 px-2 py-0.5 rounded font-mono">
                    {r.type}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <button className="flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 transition-colors">
                    <Download className="w-3.5 h-3.5"/>Download
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>
    </div>
  );
}
