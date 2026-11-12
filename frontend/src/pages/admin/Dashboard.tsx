import { useQuery } from "@tanstack/react-query";
import { Plane, TrendingUp, AlertTriangle, Activity,
         Clock, CheckCircle, ArrowUpRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip,
         ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { fetchHealth, fetchOrders } from "../../api/client";
import { useBoard } from "../../hooks/useBoard";
import { useAirport } from "../../hooks/useAirport";
import { API_ENABLED } from "../../config";

const STATUS_COLOR: Record<string,string> = {
  Scheduled:"#38bdf8", Boarding:"#2dd4bf", Departed:"#22c55e",
  Landed:"#16a34a", Delayed:"#f59e0b", Cancelled:"#ef4444",
};

function StatCard({label,value,sub,icon,trend,color="sky"}:{
  label:string;value:string|number;sub?:string;
  icon:React.ReactNode;trend?:number;color?:string
}) {
  const colors:Record<string,string> = {
    sky:"from-sky-500/10 to-sky-600/5 border-sky-500/20 text-sky-400",
    teal:"from-teal-500/10 to-teal-600/5 border-teal-500/20 text-teal-400",
    green:"from-green-500/10 to-green-600/5 border-green-500/20 text-green-400",
    yellow:"from-yellow-500/10 to-yellow-600/5 border-yellow-500/20 text-yellow-400",
    red:"from-red-500/10 to-red-600/5 border-red-500/20 text-red-400",
  };
  const [grad,border,ic] = colors[color].split(" ");
  return (
    <div className={`rounded-2xl p-5 bg-gradient-to-br ${grad} ${grad.replace("from","to")} border ${border} relative overflow-hidden`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2.5 rounded-xl bg-navy-800/80 ${ic}`}>{icon}</div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
            trend>=0?"bg-green-500/15 text-green-400":"bg-red-500/15 text-red-400"
          }`}>
            <ArrowUpRight className={`w-3 h-3 ${trend<0?"rotate-180":""}`}/>
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="text-3xl font-bold text-white mb-1 font-mono">{value}</div>
      <div className="text-sm font-medium text-slate-300">{label}</div>
      {sub && <div className="text-xs text-slate-500 mt-0.5">{sub}</div>}
    </div>
  );
}

export function Dashboard() {
  const board = useBoard(); const ap = useAirport();
  const {data:health}     = useQuery({queryKey:["health"], queryFn:fetchHealth, refetchInterval:8000});
  const {data:ordersData} = useQuery({queryKey:["orders"], queryFn:fetchOrders, enabled:API_ENABLED && board.live, retry:false});

  const fl = board.flights.map((f:any)=>({...f, flight_number:f.flight, origin:f.from, destination:f.to, predictedDelay:f.delay ?? 0}));
  const active   = fl.filter(f=>f.status==="Boarding"||f.status==="Departed").length;
  const delayed  = fl.filter(f=>f.status==="Delayed").length;
  const orders   = ((ordersData as any)?.orders ?? []) as any[];
  const revenue  = orders.reduce((s:number,o:any)=>s+(Number(o.amount)||0),0);
  const pax      = fl.reduce((s:number,f:any)=>s+(f.pax||0),0);
  const resolved = fl.filter((f:any)=>f.status!=="Scheduled"&&f.status!=="Boarding");
  const onTime   = resolved.length ? Math.round(100*resolved.filter((f:any)=>f.status!=="Delayed"&&f.status!=="Cancelled").length/resolved.length) : null;
  const byHour   = Array.from({length:24},(_,h)=>({h:`${String(h).padStart(2,"0")}h`,n:fl.filter((f:any)=>parseInt(String(f.dep).slice(0,2))===h).length})).filter(x=>x.n>0);

  const pieData = Object.entries(
    fl.reduce((acc:any,f:any)=>({...acc,[f.status]:(acc[f.status]||0)+1}),{})
  ).map(([name,value])=>({name,value}));


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Airport Operations</h1>
          <p className="text-slate-400 text-sm mt-0.5">{ap.name} • {board.live ? "Live data" : "Demo data"}</p>
        </div>
        <div className="flex items-center gap-2 bg-navy-700 rounded-xl px-4 py-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"/>
          <span className="text-xs text-green-400 font-medium">LIVE</span>
          <span className="text-xs text-slate-500 ml-1">{board.live ? "Auto-refresh 15s" : "Demo"}</span>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Flights" value={fl.length} icon={<Plane className="w-5 h-5"/>}
          color="sky" sub={`${pax.toLocaleString("en-IN")} passengers`}/>
        <StatCard label="Active Now" value={active} icon={<Activity className="w-5 h-5"/>}
          color="teal" sub="Boarding + Airborne"/>
        <StatCard label="Delayed" value={delayed} icon={<AlertTriangle className="w-5 h-5"/>}
          color={delayed>0?"yellow":"green"} sub={delayed>0?"Needs attention":"All on time"}/>
        <StatCard label="On-time" value={onTime===null?"—":`${onTime}%`}
          icon={<TrendingUp className="w-5 h-5"/>} color="green" sub={onTime===null?"No completed flights yet":`${resolved.length} flights completed`}/>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Departures by hour (from the real flight board) */}
        <div className="xl:col-span-2 bg-navy-800 rounded-2xl p-5 border border-navy-600">
          <div className="mb-5">
            <h2 className="font-semibold text-white">Departures by Hour</h2>
            <p className="text-xs text-slate-400">Scheduled departures today{orders.length>0?` · payments received ₹${revenue.toLocaleString("en-IN")} (${orders.length})`:""}</p>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={byHour} margin={{left:-20,right:0}}>
              <XAxis dataKey="h" tick={{fill:"#475569",fontSize:11}} axisLine={false} tickLine={false}/>
              <YAxis allowDecimals={false} tick={{fill:"#475569",fontSize:11}} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{background:"#0f1629",border:"1px solid #1e2d4d",borderRadius:12,fontSize:12}}
                labelStyle={{color:"#94a3b8"}} itemStyle={{color:"#38bdf8"}} formatter={(v:any)=>[v,"Departures"]}/>
              <Bar dataKey="n" fill="#38bdf8" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* System health */}
        <div className="bg-navy-800 rounded-2xl p-5 border border-navy-600">
          <h2 className="font-semibold text-white mb-4">System Health</h2>
          <div className="space-y-2.5">
            {[
              {k:"database", label:"PostgreSQL"},
              {k:"redis",    label:"Redis Cache"},
              {k:"ai_engine",label:"AI Engine"},
              {k:"status",   label:"API Gateway"},
            ].map(({k,label})=>{
              const val = (health as any)?.[k];
              const ok  = val==="UP"||val==="healthy";
              return (
                <div key={k} className="flex items-center justify-between p-3 bg-navy-700/60 rounded-xl">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-2 h-2 rounded-full ${ok?"bg-green-400":"bg-red-400"} ${ok?"animate-pulse":""}`}/>
                    <span className="text-sm text-slate-300">{label}</span>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    ok?"bg-green-500/15 text-green-400":"bg-red-500/15 text-red-400"
                  }`}>{val||"—"}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-navy-600 text-xs text-slate-400">
            Services up: <span className="text-green-400">{["database","redis","ai_engine","status"].filter(k=>{const v=(health as any)?.[k];return v==="UP"||v==="healthy";}).length}/4</span>
          </div>
        </div>
      </div>

      {/* Flight status breakdown + table */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Status chart */}
        <div className="bg-navy-800 rounded-2xl p-5 border border-navy-600">
          <h2 className="font-semibold text-white mb-4">Flight Status</h2>
          {pieData.length>0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                    dataKey="value" stroke="none">
                    {pieData.map((e,i)=>(
                      <Cell key={i} fill={STATUS_COLOR[e.name]||"#475569"}/>
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{background:"#0f1629",border:"1px solid #1e2d4d",borderRadius:8,fontSize:12}}/>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {pieData.map((e,i)=>(
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{background:STATUS_COLOR[e.name]||"#475569"}}/>
                      <span className="text-slate-300">{e.name}</span>
                    </div>
                    <span className="font-mono font-semibold text-white">{e.value as number}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-slate-500 text-sm">No flight data</div>
          )}
        </div>

        {/* Flights table */}
        <div className="xl:col-span-2 bg-navy-800 rounded-2xl border border-navy-600 overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-navy-600">
            <div className="flex items-center gap-2">
              <Plane className="w-5 h-5 text-sky-400"/>
              <h2 className="font-semibold text-white">Live Flights</h2>
              <span className="text-xs bg-sky-500/15 text-sky-400 px-2 py-0.5 rounded-full border border-sky-500/20 ml-1">
                {fl.length}
              </span>
            </div>
          </div>
          <div className="overflow-x-auto">
            {fl.length===0 ? (
              <div className="py-12 text-center text-slate-500">
                <Plane className="w-8 h-8 mx-auto mb-2 opacity-30"/>
                <p className="text-sm">No flights in database</p>
              </div>
            ) : (
              <div className="table-scroll"><table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-500 text-xs uppercase tracking-wider">
                    {["Flight","Route","Gate","Status","Delay"].map(h=>(
                      <th key={h} className="px-5 py-3 text-left border-b border-navy-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {fl.map((f:any,i:number)=>(
                    <tr key={f.id||i} className="border-b border-navy-700/50 hover:bg-navy-700/30 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="font-mono font-bold text-sky-300">{f.flight_number}</span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-300">
                        <span className="text-slate-400">{f.origin||"—"}</span>
                        <span className="mx-2 text-slate-600">→</span>
                        <span>{f.destination||"—"}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-xs bg-navy-700 text-slate-200 px-2 py-1 rounded-lg">
                          {f.gate||"TBD"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                          f.status==="Scheduled" ? "bg-sky-500/10 text-sky-300 border-sky-500/20":
                          f.status==="Boarding"  ? "bg-teal-500/10 text-teal-300 border-teal-500/20":
                          f.status==="Departed"  ? "bg-green-500/10 text-green-300 border-green-500/20":
                          f.status==="Landed"    ? "bg-green-600/10 text-green-400 border-green-600/20":
                          f.status==="Delayed"   ? "bg-yellow-500/10 text-yellow-300 border-yellow-500/20":
                                                   "bg-red-500/10 text-red-300 border-red-500/20"
                        }`}>{f.status}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        {f.predictedDelay>0
                          ? <span className="text-yellow-400 flex items-center gap-1 text-xs"><Clock className="w-3.5 h-3.5"/>{f.predictedDelay}m</span>
                          : <span className="text-green-400 flex items-center gap-1 text-xs"><CheckCircle className="w-3.5 h-3.5"/>On time</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
