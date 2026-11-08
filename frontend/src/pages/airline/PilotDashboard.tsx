import { useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { Plane, Clock, Wind, Thermometer, AlertTriangle, MapPin } from "lucide-react";
import { FeedbackWidget } from "../../components/ui/FeedbackWidget";

const SCHEDULES = [
  {flight:"AI-101",from:"DEL",to:"BOM",dep:"10:30",arr:"12:40",gate:"A1",status:"Boarding",aircraft:"VT-ANB / Boeing 787-8",crew:"F/O Mehta"},
  {flight:"AI-202",from:"BOM",to:"DEL",dep:"14:00",arr:"16:10",gate:"B2",status:"Scheduled",aircraft:"VT-ANC / Boeing 787-9",crew:"F/O Singh"},
  {flight:"AI-819",from:"DEL",to:"LHR",dep:"13:45",arr:"19:15",gate:"E1",status:"Tomorrow",  aircraft:"VT-ALG / Boeing 777-200",crew:"F/O Das"},
];

const WEATHER = [
  {airport:"DEL",condition:"Clear",temp:32,wind:12,visibility:10,ceiling:"Clear",icao:"VIDP"},
  {airport:"BOM",condition:"Partly Cloudy",temp:29,wind:18,visibility:8,ceiling:"2500ft",icao:"VABB"},
  {airport:"LHR",condition:"Overcast",temp:14,wind:24,visibility:6,ceiling:"1200ft",icao:"EGLL"},
];

const NOTAMS = [
  {id:"A1234/24",airport:"DEL",type:"Runway",text:"RWY 28 closed 0200-0600 UTC for maintenance. Use RWY 10/28L.",expires:"2024-05-01"},
  {id:"A1235/24",airport:"DEL",type:"ILS",  text:"ILS RWY 28 unreliable. VOR approaches in effect.",       expires:"2024-04-30"},
  {id:"A1236/24",airport:"BOM",type:"Taxiway",text:"TWY B closed at B4. Use alternate routing via TWY C.", expires:"2024-04-29"},
];

export function PilotDashboard() {
  const { user } = useAuthStore();
  const [tab, setTab] = useState<"schedule"|"weather"|"notams"|"feedback">("schedule");

  const today = SCHEDULES[0];

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Pilot Operations Portal</h1>
          <p className="text-slate-400 text-sm">{user?.name} · {user?.staffLevel?.toUpperCase()} · Delhi IGI Base</p>
        </div>
        <div className="px-4 py-2 rounded-xl font-bold text-sm"
          style={{background:"rgba(14,165,233,0.12)",color:"#38bdf8",border:"1px solid rgba(56,189,248,0.25)"}}>
          👨‍✈️ {user?.staffLevel?.includes("captain")?"Captain":"First Officer"}
        </div>
      </div>

      {/* Today's flight highlight */}
      <div className="rounded-3xl overflow-hidden border"
        style={{background:"linear-gradient(135deg,rgba(14,165,233,0.15),rgba(20,184,166,0.08))",borderColor:"rgba(56,189,248,0.35)"}}>
        <div className="p-6">
          <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">Today's Flight</div>
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-3xl font-black text-white mb-1">{today.flight}</div>
              <div className="text-slate-400 text-sm">{today.aircraft}</div>
            </div>
            <span className="text-sm px-3 py-1.5 rounded-xl font-bold"
              style={{background:"rgba(45,212,191,0.2)",color:"#2dd4bf"}}>
              {today.status}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-center">
              <div className="text-4xl font-black text-white">{today.from}</div>
              <div className="text-slate-400 text-sm">{today.dep} STD</div>
              <div className="text-xs text-slate-500">Delhi IGI</div>
            </div>
            <div className="flex flex-col items-center">
              <Plane className="w-6 h-6 text-sky-400 mb-1"/>
              <div className="text-xs text-slate-500">2h 10m</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black text-white">{today.to}</div>
              <div className="text-slate-400 text-sm">{today.arr} STA</div>
              <div className="text-xs text-slate-500">Mumbai CSI</div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 border-t" style={{borderColor:"rgba(56,189,248,0.12)"}}>
          {[{l:"Gate",v:today.gate},{l:"F/O",v:today.crew},{l:"Dept",v:today.dep}].map(({l,v})=>(
            <div key={l} className="p-4 text-center border-r last:border-0" style={{borderColor:"rgba(56,189,248,0.08)"}}>
              <div className="text-xs text-slate-500">{l}</div>
              <div className="font-black text-white font-mono">{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-2xl"
        style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)"}}>
        {[
          {k:"schedule",l:"📅 Schedule"},
          {k:"weather", l:"🌤 Weather"},
          {k:"notams",  l:"⚠️ NOTAMs"},
          {k:"feedback",l:"💬 Feedback"},
        ].map(({k,l})=>(
          <button key={k} onClick={()=>setTab(k as any)}
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all"
            style={tab===k?{background:"linear-gradient(135deg,#0ea5e9,#14b8a6)",color:"white"}:{color:"#64748b"}}>
            {l}
          </button>
        ))}
      </div>

      {tab==="schedule" && (
        <div className="space-y-4">
          <h2 className="font-bold text-white">Your Flight Schedule — Next 7 Days</h2>
          {SCHEDULES.map((s,i)=>{
            const sc: Record<string,string> = {
              "Boarding":"bg-teal-500/15 text-teal-400","Scheduled":"bg-sky-500/15 text-sky-400",
              "Tomorrow":"bg-slate-500/15 text-slate-400",
            };
            return (
              <div key={i} className="bg-navy-800 rounded-2xl p-5 border border-navy-600">
                <div className="flex justify-between mb-3">
                  <span className="font-mono font-black text-white text-xl">{s.flight}</span>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${sc[s.status]}`}>{s.status}</span>
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <div><div className="text-2xl font-black text-white">{s.from}</div><div className="text-xs text-slate-400">{s.dep}</div></div>
                  <Plane className="w-5 h-5 text-sky-400"/>
                  <div><div className="text-2xl font-black text-white">{s.to}</div><div className="text-xs text-slate-400">{s.arr}</div></div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl" style={{background:"rgba(255,255,255,0.03)"}}>
                    <div className="text-slate-500">Aircraft</div>
                    <div className="font-semibold text-white">{s.aircraft}</div>
                  </div>
                  <div className="p-2.5 rounded-xl" style={{background:"rgba(255,255,255,0.03)"}}>
                    <div className="text-slate-500">First Officer</div>
                    <div className="font-semibold text-white">{s.crew}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab==="weather" && (
        <div className="space-y-4">
          <h2 className="font-bold text-white">Route Weather Briefing</h2>
          {WEATHER.map(w=>(
            <div key={w.airport} className="bg-navy-800 rounded-2xl p-5 border border-navy-600">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="font-bold text-white text-lg">{w.airport} — {w.icao}</div>
                  <div className="text-slate-400 text-sm">{w.condition}</div>
                </div>
                <div className="text-3xl">
                  {w.condition.includes("Clear")?"☀️":w.condition.includes("Cloud")?"⛅":"🌧️"}
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {[
                  {l:"Temperature",v:`${w.temp}°C`,  icon:<Thermometer className="w-4 h-4 text-orange-400"/>},
                  {l:"Wind",       v:`${w.wind}kts`,  icon:<Wind className="w-4 h-4 text-sky-400"/>},
                  {l:"Visibility", v:`${w.visibility}km`,icon:<MapPin className="w-4 h-4 text-green-400"/>},
                  {l:"Ceiling",    v:w.ceiling,       icon:<Clock className="w-4 h-4 text-purple-400"/>},
                ].map(({l,v,icon})=>(
                  <div key={l} className="p-3 rounded-xl text-center" style={{background:"rgba(255,255,255,0.03)"}}>
                    <div className="flex justify-center mb-1">{icon}</div>
                    <div className="font-bold text-white text-sm">{v}</div>
                    <div className="text-xs text-slate-500">{l}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab==="notams" && (
        <div className="space-y-4">
          <h2 className="font-bold text-white">NOTAMs — Active Notices</h2>
          {NOTAMS.map(n=>(
            <div key={n.id} className="bg-navy-800 rounded-2xl p-5 border border-navy-600">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5"/>
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-mono font-bold text-yellow-300">{n.id}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-400">{n.airport}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400">{n.type}</span>
                  </div>
                  <p className="text-sm text-slate-200">{n.text}</p>
                  <div className="text-xs text-slate-500 mt-1">Expires: {n.expires}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab==="feedback" && (
        <FeedbackWidget
          role="pilot"
          name={user?.name||"Pilot"}
          context={today.flight}/>
      )}
    </div>
  );
}
