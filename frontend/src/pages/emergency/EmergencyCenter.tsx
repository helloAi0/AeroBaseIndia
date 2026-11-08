import { useState, useEffect } from "react";
import { Shield, Phone, CheckCircle, Clock, Radio, Users } from "lucide-react";

const EMERGENCY_TYPES = [
  {code:"ARFF",  label:"Aircraft Fire",       color:"red",    hotline:"+91-11-2567-0001"},
  {code:"MED",   label:"Medical Emergency",   color:"pink",   hotline:"+91-11-2567-0002"},
  {code:"SEC",   label:"Security Threat",     color:"orange", hotline:"+91-11-2567-0003"},
  {code:"BOMB",  label:"Bomb Threat",         color:"red",    hotline:"+91-11-2567-0004"},
  {code:"EVAC",  label:"Evacuation",          color:"yellow", hotline:"+91-11-2567-0005"},
  {code:"FLOOD", label:"Structural/Flood",    color:"blue",   hotline:"+91-11-2567-0006"},
];

const RESPONSE_TEAMS = [
  {id:"T1",name:"ARFF Unit Alpha",  status:"Standby",  location:"Fire Station 1", members:8, eta:"2 min"},
  {id:"T2",name:"ARFF Unit Bravo",  status:"Standby",  location:"Fire Station 2", members:6, eta:"4 min"},
  {id:"T3",name:"Medical Team A",   status:"Active",   location:"T3 Medical Bay",  members:4, eta:"On site"},
  {id:"T4",name:"Security Squad 1", status:"Standby",  location:"Command Center",  members:12,eta:"3 min"},
  {id:"T5",name:"Police Unit DEL",  status:"Standby",  location:"Police Post T3",  members:8, eta:"5 min"},
  {id:"T6",name:"Bomb Disposal",    status:"Off Duty", location:"Main Gate",       members:6, eta:"15 min"},
];

const ACTIVE_LOG = [
  {time:"10:24",event:"Medical emergency reported — Passenger collapsed Gate A2",   level:"HIGH",   resolved:false},
  {time:"09:45",event:"Security alert cleared — Suspicious bag at T2 was benign",   level:"MED",    resolved:true},
  {time:"09:12",event:"Fire alarm triggered — False alarm at cargo area east wing",  level:"HIGH",   resolved:true},
  {time:"08:30",event:"Medical team dispatched — Elderly passenger T3 arrivals",    level:"MED",    resolved:true},
  {time:"07:55",event:"Security sweep completed — All clear at T1 departures",      level:"LOW",    resolved:true},
];

const CONTACTS = [
  {role:"Airport Director",        name:"Mr. Arun Sharma",  phone:"+91-98765-00001"},
  {role:"Security Chief",          name:"Ms. Rita Kapoor",  phone:"+91-98765-00002"},
  {role:"ARFF Chief",              name:"Mr. Dev Kumar",    phone:"+91-98765-00003"},
  {role:"Medical Officer",         name:"Dr. Priya Singh",  phone:"+91-98765-00004"},
  {role:"Police Liaison",          name:"SI Vikram Nair",   phone:"+91-98765-00005"},
  {role:"Operations Manager",      name:"Ms. Neha Gupta",   phone:"+91-98765-00006"},
];

export function EmergencyCenter() {
  const [activeAlert, setActiveAlert] = useState<string|null>(null);
  const [drill,       setDrill]       = useState(false);
  const [ticker,      setTicker]      = useState(0);

  useEffect(()=>{
    const t = setInterval(()=>setTicker(p=>p+1), 1000);
    return ()=>clearInterval(t);
  },[]);

  const unresolvedCount = ACTIVE_LOG.filter(l=>!l.resolved).length;

  return (
    <div className="space-y-6">
      {/* Header with alert banner */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Emergency Operations Center</h1>
          <p className="text-slate-400 text-sm mt-0.5">Delhi IGI Airport — EOC Command</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={()=>setDrill(!drill)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${
              drill
                ?"bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                :"bg-navy-800 text-slate-400 border-navy-600 hover:border-navy-500"}`}>
            <Radio className="w-4 h-4"/>
            {drill?"🔴 DRILL ACTIVE":"Start Drill"}
          </button>
        </div>
      </div>

      {/* Active alert banner */}
      {unresolvedCount>0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse flex-shrink-0"/>
          <div className="flex-1">
            <div className="text-red-300 font-semibold text-sm">
              {unresolvedCount} Active Emergency — Medical emergency at Gate A2
            </div>
            <div className="text-red-400/70 text-xs">Medical Team A responding • ETA: On site</div>
          </div>
          <div className="font-mono text-red-300 text-sm">
            {Math.floor(ticker/60).toString().padStart(2,"0")}:{(ticker%60).toString().padStart(2,"0")}
          </div>
        </div>
      )}

      {/* Emergency type buttons */}
      <div>
        <h2 className="font-semibold text-white mb-3 flex items-center gap-2">
          <Radio className="w-5 h-5 text-red-400"/>Declare Emergency
        </h2>
        <div className="grid grid-cols-2 xl:grid-cols-6 gap-3">
          {EMERGENCY_TYPES.map(e=>(
            <button key={e.code}
              onClick={()=>setActiveAlert(activeAlert===e.code?null:e.code)}
              className={`p-4 rounded-2xl border text-center transition-all ${
                activeAlert===e.code
                  ?`bg-${e.color}-500/20 border-${e.color}-500/40 text-${e.color}-300`
                  :`bg-navy-800 border-navy-600 text-slate-400 hover:border-red-500/30 hover:text-white`
              }`}>
              <div className="text-lg font-bold font-mono mb-1">{e.code}</div>
              <div className="text-xs font-medium leading-tight">{e.label}</div>
            </button>
          ))}
        </div>
        {activeAlert && (
          <div className="mt-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-red-300 font-semibold">
                ⚠ {EMERGENCY_TYPES.find(e=>e.code===activeAlert)?.label} Alert Active
              </div>
              <div className="text-xs text-red-400/70 mt-0.5">
                Hotline: {EMERGENCY_TYPES.find(e=>e.code===activeAlert)?.hotline}
              </div>
            </div>
            <button onClick={()=>setActiveAlert(null)}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-medium">
              Clear Alert
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Response teams */}
        <div className="xl:col-span-2 bg-navy-800 rounded-2xl border border-navy-600 overflow-hidden">
          <div className="p-5 border-b border-navy-600 flex items-center gap-2">
            <Users className="w-5 h-5 text-sky-400"/>
            <h2 className="font-semibold text-white">Response Teams</h2>
            <span className="ml-auto text-xs text-green-400">
              {RESPONSE_TEAMS.filter(t=>t.status==="Standby").length} teams on standby
            </span>
          </div>
          <div className="table-scroll"><table className="w-full text-sm">
            <thead>
              <tr className="text-slate-500 text-xs uppercase">
                {["Team","Status","Location","Members","ETA"].map(h=>(
                  <th key={h} className="px-5 py-3 text-left border-b border-navy-700">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RESPONSE_TEAMS.map(t=>(
                <tr key={t.id} className="border-b border-navy-700/50 hover:bg-navy-700/30">
                  <td className="px-5 py-3.5">
                    <div className="font-medium text-white">{t.name}</div>
                    <div className="text-xs text-slate-500 font-mono">{t.id}</div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${
                        t.status==="Active"?"bg-red-400 animate-pulse":
                        t.status==="Standby"?"bg-green-400":"bg-slate-500"}`}/>
                      <span className={`text-xs font-medium ${
                        t.status==="Active"?"text-red-400":
                        t.status==="Standby"?"text-green-400":"text-slate-400"}`}>
                        {t.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-400">{t.location}</td>
                  <td className="px-5 py-3.5 text-slate-300">{t.members}</td>
                  <td className="px-5 py-3.5 font-mono text-xs text-sky-300">{t.eta}</td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </div>

        {/* Emergency contacts */}
        <div className="bg-navy-800 rounded-2xl border border-navy-600 overflow-hidden">
          <div className="p-5 border-b border-navy-600 flex items-center gap-2">
            <Phone className="w-5 h-5 text-green-400"/>
            <h2 className="font-semibold text-white">Emergency Contacts</h2>
          </div>
          <div className="p-4 space-y-2">
            {CONTACTS.map((c,i)=>(
              <div key={i} className="p-3 bg-navy-700/50 rounded-xl hover:bg-navy-700 transition-colors cursor-pointer">
                <div className="text-xs text-slate-500 mb-0.5">{c.role}</div>
                <div className="text-sm font-medium text-white">{c.name}</div>
                <div className="text-xs text-green-400 font-mono mt-0.5">{c.phone}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Incident log */}
      <div className="bg-navy-800 rounded-2xl border border-navy-600 overflow-hidden">
        <div className="p-5 border-b border-navy-600 flex items-center gap-2">
          <Shield className="w-5 h-5 text-sky-400"/>
          <h2 className="font-semibold text-white">Today's Incident Log</h2>
        </div>
        <div className="divide-y divide-navy-700">
          {ACTIVE_LOG.map((log,i)=>(
            <div key={i} className={`flex items-start gap-4 p-4 ${!log.resolved?"bg-red-500/5":""}`}>
              <div className="font-mono text-xs text-slate-500 w-12 flex-shrink-0 mt-0.5">{log.time}</div>
              <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                log.level==="HIGH"?"bg-red-500":
                log.level==="MED"?"bg-yellow-500":"bg-sky-500"}`}/>
              <div className="flex-1 text-sm text-slate-300">{log.event}</div>
              <div className="flex-shrink-0">
                {log.resolved
                  ?<CheckCircle className="w-4 h-4 text-green-400"/>
                  :<Clock className="w-4 h-4 text-red-400 animate-pulse"/>
                }
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
