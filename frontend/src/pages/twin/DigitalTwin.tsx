import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchFlights } from "../../api/client";
import { lazy, Suspense } from "react";
import { Activity, Wind, Eye, Thermometer, Users } from "lucide-react";

const Twin3D = lazy(() => import("../../components/three/Twin3D").then(m => ({ default: m.Twin3D })));

const TERMINALS = [
  { id:"T1", x:60,  y:80,  w:200, h:120, gates:["A1","A2","A3","A4"], color:"#0ea5e9" },
  { id:"T2", x:300, y:80,  w:200, h:120, gates:["B1","B2","B3","B4"], color:"#14b8a6" },
  { id:"T3", x:540, y:80,  w:200, h:120, gates:["C1","C2","D1","D2"], color:"#8b5cf6" },
];

const GATE_STATUS = [
  {g:"A1",status:"occupied", flight:"AI-101"},
  {g:"A2",status:"available"},
  {g:"A3",status:"boarding",  flight:"6E-505"},
  {g:"A4",status:"delayed",   flight:"UK-303"},
  {g:"B1",status:"occupied",  flight:"SG-404"},
  {g:"B2",status:"cleaning"},
  {g:"B3",status:"occupied",  flight:"IX-202"},
  {g:"B4",status:"available"},
  {g:"C1",status:"boarding",  flight:"AI-707"},
  {g:"C2",status:"delayed",   flight:"6E-888"},
  {g:"D1",status:"available"},
  {g:"D2",status:"occupied",  flight:"SG-101"},
];

const GATE_COLOR: Record<string,string> = {
  occupied:"#0ea5e9", available:"#22c55e",
  boarding:"#2dd4bf", delayed:"#f59e0b", cleaning:"#6b7280",
};

// Fixed Tailwind compilation map for static analysis matching
const COLOR_MAP: Record<string, string> = {
  orange: "text-orange-400",
  sky: "text-sky-400",
  teal: "text-teal-400",
  purple: "text-purple-400"
};

function AirportMap({flights}:{flights:any[]}) {
  const [hover, setHover] = useState<string|null>(null);
  const [tick, setTick]   = useState(0);

  useEffect(()=>{
    const t = setInterval(()=>setTick(p=>p+1), 2000);
    return ()=>clearInterval(t);
  },[]);

  return (
    <div className="bg-navy-900 rounded-2xl border border-navy-600 overflow-hidden">
      <div className="p-4 border-b border-navy-600 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-sky-400"/>
          <h2 className="font-semibold text-white">Airport Digital Twin</h2>
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse ml-1"/>
        </div>
        <span className="text-xs text-slate-500">Live simulation</span>
      </div>

      <svg viewBox="0 0 800 340" className="w-full" style={{background:"#060b18"}}>
        {/* Runway */}
        <rect x="0" y="230" width="800" height="80" fill="#0f1629" rx="4"/>
        <line x1="0" y1="270" x2="800" y2="270" stroke="#1e2d4d" strokeWidth="2" strokeDasharray="20,15"/>
        <text x="400" y="275" fill="#1e3a5f" fontSize="11" textAnchor="middle" fontFamily="monospace">
          RUNWAY 28L/10R
        </text>

        {/* Taxiways */}
        {[120,360,590].map((x,i)=>(
          <line key={i} x1={x} y1="200" x2={x} y2="230" stroke="#1e2d4d" strokeWidth="8"/>
        ))}

        {/* Terminals */}
        {TERMINALS.map(t=>(
          <g key={t.id}>
            <rect x={t.x} y={t.y} width={t.w} height={t.h}
              fill="#0f1629" stroke={t.color} strokeWidth="1.5" rx="8" opacity="0.9"/>
            <text x={t.x+t.w/2} y={t.y+18} fill={t.color} fontSize="11"
              textAnchor="middle" fontFamily="monospace" fontWeight="bold">
              Terminal {t.id.slice(1)}
            </text>
            {/* Gates */}
            {t.gates.map((g,gi)=>{
              const gs = GATE_STATUS.find(s=>s.g===g);
              const gx = t.x + 20 + gi*45;
              const gy = t.y + 35;
              const gc = GATE_COLOR[gs?.status||"available"];
              const isHov = hover===g;
              return (
                <g key={g} onMouseEnter={()=>setHover(g)} onMouseLeave={()=>setHover(null)}
                  style={{cursor:"pointer"}}>
                  <rect x={gx} y={gy} width={36} height={55} fill={gc} opacity={isHov?0.9:0.25}
                    stroke={gc} strokeWidth={isHov?2:1} rx="5"/>
                  <text x={gx+18} y={gy+16} fill={gc} fontSize="9"
                    textAnchor="middle" fontFamily="monospace" fontWeight="bold">{g}</text>
                  {gs?.flight && (
                    <text x={gx+18} y={gy+30} fill="white" fontSize="7"
                      textAnchor="middle" fontFamily="monospace">{gs.flight}</text>
                  )}
                  {gs?.status==="boarding" && (
                    <circle cx={gx+28} cy={gy+6} r="4" fill="#2dd4bf" opacity={(tick%2===0)?1:0.3}/>
                  )}
                  {gs?.status==="delayed" && (
                    <text x={gx+18} y={gy+48} fill="#f59e0b" fontSize="7" textAnchor="middle">⚠</text>
                  )}
                </g>
              );
            })}
          </g>
        ))}

        {/* Moving aircraft on taxiway */}
        {flights.slice(0,2).map((f:any,i:number)=>{
          const xPos = 80 + ((tick*3 + i*200) % 600);
          return (
            <g key={f.id||i} transform={`translate(${xPos},215)`}>
              <polygon points="0,-6 12,0 0,6 2,0" fill="#38bdf8" opacity="0.8"/>
              <text x="14" y="4" fill="#38bdf8" fontSize="8" fontFamily="monospace">
                {f.flight_number}
              </text>
            </g>
          );
        })}

        {/* Legend */}
        {Object.entries(GATE_COLOR).map(([status,color],i)=>(
          <g key={status} transform={`translate(${10+i*120},315)`}>
            <rect width="10" height="10" fill={color} rx="2" opacity="0.7"/>
            <text x="14" y="9" fill="#475569" fontSize="9" fontFamily="monospace" >
              {status}
            </text>
          </g>
        ))}
      </svg>

      {/* Hover tooltip */}
      {hover && (()=>{
        const gs = GATE_STATUS.find(s=>s.g===hover);
        return (
          <div className="px-4 py-2 border-t border-navy-600 flex items-center gap-4 text-sm">
            <span className="font-mono font-bold text-white">Gate {hover}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs border`}
              style={{background:GATE_COLOR[gs?.status||"available"]+"20",
                      color:GATE_COLOR[gs?.status||"available"],
                      borderColor:GATE_COLOR[gs?.status||"available"]+"40"}}>
              {gs?.status||"available"}
            </span>
            {gs?.flight && <span className="font-mono text-sky-300">{gs.flight}</span>}
          </div>
        );
      })()}
    </div>
  );
}

export function DigitalTwin() {
  const {data:flights=[]} = useQuery({queryKey:["flights"],queryFn:fetchFlights,refetchInterval:8000});
  const fl = flights as any[];
  const [view, setView] = useState<"2D"|"3D">("2D");

  const [weather] = useState({temp:32, wind:14, visibility:8, humidity:65});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Digital Twin</h1>
          <p className="text-slate-400 text-sm mt-0.5">Live airport simulation — Delhi IGI</p>
        </div>
        <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-4 py-2 rounded-xl">
          <Activity className="w-4 h-4 text-green-400"/>
          <span className="text-sm text-green-400 font-medium">Simulation Active</span>
        </div>
      </div>

      {/* Environment metrics */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          {label:"Temperature", value:`${weather.temp}°C`, icon:<Thermometer className="w-5 h-5"/>, color:"orange"},
          {label:"Wind Speed",  value:`${weather.wind} km/h`, icon:<Wind className="w-5 h-5"/>,   color:"sky"},
          {label:"Visibility",  value:`${weather.visibility} km`, icon:<Eye className="w-5 h-5"/>,color:"teal"},
          {label:"Passengers",  value:"12,840", icon:<Users className="w-5 h-5"/>,                 color:"purple"},
        ].map(({label,value,icon,color})=>(
          <div key={label} className="bg-navy-800 rounded-2xl p-5 border border-navy-600">
            <div className={`${COLOR_MAP[color] || "text-slate-400"} mb-3`}>{icon}</div>
            <div className="text-2xl font-bold font-mono text-white mb-0.5">{value}</div>
            <div className="text-sm text-slate-400">{label}</div>
          </div>
        ))}
      </div>

      {/* Airport map */}
      <div className="flex justify-end gap-1 -mb-3">
        {(["2D","3D"] as const).map(v=>(
          <button key={v} onClick={()=>setView(v)} className={`px-3 py-1 text-xs rounded-md border ${view===v?"bg-sky-500/20 text-sky-300 border-sky-500/30":"text-slate-400 border-navy-600"}`}>{v}</button>))}
      </div>
      {view==="2D" ? <AirportMap flights={fl}/> : (
        <div className="bg-navy-900 rounded-2xl border border-navy-600 overflow-hidden">
          <div className="p-4 border-b border-navy-600 text-white font-semibold">3D Digital Twin <span className="text-xs text-slate-500 font-normal ml-2">drag to rotate · scroll to zoom</span></div>
          <Suspense fallback={<div className="h-[420px] animate-pulse"/>}>
            <Twin3D gates={GATE_STATUS} terminals={TERMINALS}/>
          </Suspense>
        </div>)}

      {/* Gate status grid */}
      <div className="bg-navy-800 rounded-2xl border border-navy-600 overflow-hidden">
        <div className="p-5 border-b border-navy-600">
          <h2 className="font-semibold text-white">Gate Status Summary</h2>
        </div>
        <div className="p-4 grid grid-cols-4 xl:grid-cols-6 gap-3">
          {GATE_STATUS.map(gs=>(
            <div key={gs.g} className="p-3 rounded-xl border text-center"
              style={{background:GATE_COLOR[gs.status]+"10",borderColor:GATE_COLOR[gs.status]+"30"}}>
              <div className="font-mono font-bold text-white mb-1">{gs.g}</div>
              <div className="text-xs" style={{color:GATE_COLOR[gs.status]}}>{gs.status}</div>
              {gs.flight && <div className="text-xs text-slate-500 mt-0.5 font-mono">{gs.flight}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}