import { useState } from "react";
import { Calendar, Plane, Plus,
         ChevronLeft, ChevronRight } from "lucide-react";

const DAYS   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const HOURS  = Array.from({length:18},(_,i)=>i+5);

const SCHEDULE = [
  {id:1, flight:"AI-101", from:"DEL", to:"BOM", dep:"06:00", arr:"08:10", gate:"A1", days:[1,2,3,4,5],   color:"#0ea5e9"},
  {id:2, flight:"6E-202", from:"DEL", to:"BLR", dep:"07:30", arr:"09:45", gate:"B3", days:[0,1,2,3,4,5,6],color:"#14b8a6"},
  {id:3, flight:"UK-303", from:"BOM", to:"DEL", dep:"09:00", arr:"11:15", gate:"C2", days:[1,3,5],        color:"#8b5cf6"},
  {id:4, flight:"SG-404", from:"DEL", to:"HYD", dep:"10:30", arr:"12:00", gate:"D4", days:[0,2,4,6],      color:"#f59e0b"},
  {id:5, flight:"IX-505", from:"DEL", to:"CCU", dep:"14:00", arr:"16:30", gate:"A2", days:[1,2,3,4,5],    color:"#22c55e"},
  {id:6, flight:"AI-707", from:"DEL", to:"MAA", dep:"16:45", arr:"19:00", gate:"B1", days:[0,3,6],        color:"#0ea5e9"},
  {id:7, flight:"6E-808", from:"DEL", to:"PNQ", dep:"18:30", arr:"20:15", gate:"C1", days:[1,2,4,5],      color:"#14b8a6"},
  {id:8, flight:"UK-909", from:"HYD", to:"DEL", dep:"20:00", arr:"22:10", gate:"D2", days:[0,1,3,5],      color:"#8b5cf6"},
];

const depHour = (dep:string) => parseInt(dep.split(":")[0]);
const depMin  = (dep:string) => parseInt(dep.split(":")[1]);
const durH    = (dep:string,arr:string) => {
  const d = depHour(dep)*60+depMin(dep);
  const a = parseInt(arr.split(":")[0])*60+parseInt(arr.split(":")[1]);
  return Math.max(a-d,30);
};

export function FlightScheduler() {
  const [view,      setView]    = useState<"week"|"day">("week");
  const [activeDay, setActiveDay] = useState(new Date().getDay());
  const [showNew,   setShowNew] = useState(false);
  const [selected,  setSelected] = useState<typeof SCHEDULE[0]|null>(null);

  const todayFlights = SCHEDULE.filter(f=>f.days.includes(activeDay));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Flight Scheduler</h1>
          <p className="text-slate-400 text-sm mt-0.5">Weekly schedule management</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 bg-navy-800 p-1 rounded-xl border border-navy-600">
            {(["week","day"] as const).map(v=>(
              <button key={v} onClick={()=>setView(v)}
                className={`px-4 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                  view===v?"bg-sky-500 text-white":"text-slate-400 hover:text-white"}`}>
                {v}
              </button>
            ))}
          </div>
          <button onClick={()=>setShowNew(true)}
            className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors">
            <Plus className="w-4 h-4"/>Add Flight
          </button>
        </div>
      </div>

      {/* Add flight form */}
      {showNew && (
        <div className="bg-navy-800 rounded-2xl p-6 border border-sky-500/30 space-y-4">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Plane className="w-5 h-5 text-sky-400"/>Schedule New Flight
          </h3>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              {label:"Flight Number",    placeholder:"AI-101"},
              {label:"Departure (IATA)", placeholder:"DEL"},
              {label:"Arrival (IATA)",   placeholder:"BOM"},
              {label:"Gate",             placeholder:"A1"},
              {label:"Departure Time",   placeholder:"06:00"},
              {label:"Arrival Time",     placeholder:"08:10"},
            ].map(({label,placeholder})=>(
              <div key={label}>
                <label className="text-xs text-slate-400 mb-1.5 block">{label}</label>
                <input placeholder={placeholder}
                  className="w-full bg-navy-700 border border-navy-600 focus:border-sky-500 rounded-xl px-3 py-2.5 text-sm text-white outline-none"/>
              </div>
            ))}
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Operating Days</label>
              <div className="flex gap-1.5 flex-wrap">
                {DAYS.map((d)=>(
                  <button key={d}
                    className="w-8 h-8 rounded-lg text-xs font-medium bg-navy-700 text-slate-400 hover:bg-sky-500 hover:text-white transition-colors">
                    {d[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={()=>setShowNew(false)}
              className="bg-sky-500 hover:bg-sky-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium">
              Add to Schedule
            </button>
            <button onClick={()=>setShowNew(false)}
              className="bg-navy-700 text-slate-400 px-5 py-2.5 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Day selector */}
      <div className="flex gap-2">
        <button onClick={()=>setActiveDay((activeDay+6)%7)}
          className="p-2.5 bg-navy-800 border border-navy-600 rounded-xl text-slate-400 hover:text-white">
          <ChevronLeft className="w-4 h-4"/>
        </button>
        <div className="flex gap-2 flex-1 overflow-x-auto">
          {DAYS.map((d,idx)=>{
            const cnt = SCHEDULE.filter(f=>f.days.includes(idx)).length;
            return (
              <button key={d} onClick={()=>setActiveDay(idx)}
                className={`flex-1 min-w-16 py-2.5 px-3 rounded-xl text-sm font-medium transition-all border ${
                  activeDay===idx
                    ?"bg-sky-500/15 border-sky-500/40 text-sky-300"
                    :"bg-navy-800 border-navy-600 text-slate-400 hover:border-navy-500"}`}>
                <div>{d}</div>
                <div className="text-xs mt-0.5 font-mono">{cnt} flights</div>
              </button>
            );
          })}
        </div>
        <button onClick={()=>setActiveDay((activeDay+1)%7)}
          className="p-2.5 bg-navy-800 border border-navy-600 rounded-xl text-slate-400 hover:text-white">
          <ChevronRight className="w-4 h-4"/>
        </button>
      </div>

      {/* Timeline */}
      <div className="bg-navy-800 rounded-2xl border border-navy-600 overflow-hidden">
        <div className="p-4 border-b border-navy-600 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-sky-400"/>
          <h2 className="font-semibold text-white">{DAYS[activeDay]} — {todayFlights.length} flights</h2>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[700px] p-4">
            {/* Hour labels */}
            <div className="flex mb-2 ml-20">
              {HOURS.map(h=>(
                <div key={h} className="flex-1 text-center text-xs text-slate-600 font-mono">
                  {h.toString().padStart(2,"0")}:00
                </div>
              ))}
            </div>
            {/* Flight bars */}
            <div className="space-y-3">
              {todayFlights.map(f=>{
                const startPct = ((depHour(f.dep)-5)*60+depMin(f.dep))/(18*60)*100;
                const widthPct = durH(f.dep,f.arr)/(18*60)*100;
                return (
                  <div key={f.id} className="flex items-center gap-3">
                    <div className="w-20 text-xs font-mono text-slate-400 text-right flex-shrink-0">
                      {f.flight}
                    </div>
                    <div className="flex-1 h-10 bg-navy-700 rounded-xl relative overflow-hidden cursor-pointer"
                      onClick={()=>setSelected(selected?.id===f.id?null:f)}>
                      <div className="absolute top-0 bottom-0 rounded-xl flex items-center px-3 text-white text-xs font-medium"
                        style={{left:`${startPct}%`,width:`${widthPct}%`,background:f.color+"40",
                                border:`1px solid ${f.color}60`}}>
                        <div className="w-2 h-2 rounded-full mr-2 flex-shrink-0" style={{background:f.color}}/>
                        <span className="truncate">{f.from}→{f.to}</span>
                        <span className="ml-auto text-xs opacity-70">{f.dep}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Selected flight detail */}
      {selected && (
        <div className="bg-navy-800 rounded-2xl p-5 border border-sky-500/30 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white">Flight Details</h2>
            <button onClick={()=>setSelected(null)} className="text-slate-500 hover:text-white text-xl">×</button>
          </div>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              {label:"Flight",    value:selected.flight},
              {label:"Route",     value:`${selected.from} → ${selected.to}`},
              {label:"Departure", value:selected.dep},
              {label:"Arrival",   value:selected.arr},
              {label:"Gate",      value:selected.gate},
              {label:"Duration",  value:`${Math.floor(durH(selected.dep,selected.arr)/60)}h ${durH(selected.dep,selected.arr)%60}m`},
            ].map(({label,value})=>(
              <div key={label} className="p-3 bg-navy-700/50 rounded-xl">
                <div className="text-xs text-slate-400 mb-1">{label}</div>
                <div className="font-mono font-bold text-white">{value}</div>
              </div>
            ))}
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-2">Operating Days</div>
            <div className="flex gap-2">
              {DAYS.map((d)=>(
                <span key={d} className={`w-8 h-8 rounded-lg text-xs font-medium flex items-center justify-center ${
                  selected.days.includes(DAYS.indexOf(d))
                    ?"text-white":"bg-navy-700 text-slate-600"
                }`} style={selected.days.includes(DAYS.indexOf(d))?{background:selected.color}:{}}>
                  {d[0]}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}