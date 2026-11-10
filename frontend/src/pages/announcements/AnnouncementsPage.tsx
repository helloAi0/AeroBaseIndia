import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchFlights } from "../../api/client";
import { speak, stopSpeaking, voiceSupported } from "../../lib/voice";
import { Volume2, VolumeX, Megaphone, Clock, Play } from "lucide-react";

const ANNOUNCEMENT_TEMPLATES = [
  {id:1,type:"Boarding",    template:(f:string,g:string)=>`Attention passengers. Flight ${f} is now boarding at Gate ${g}. Please proceed to the gate immediately.`,priority:"Normal"},
  {id:2,type:"Final Call",  template:(f:string,g:string)=>`Final boarding call for flight ${f}. This is the final call for all passengers on this flight. Please proceed to Gate ${g} immediately.`,priority:"Urgent"},
  {id:3,type:"Delay",       template:(f:string,_g:string)=>`We regret to inform that flight ${f} has been delayed. The new estimated departure time will be announced shortly. We apologize for the inconvenience.`,priority:"Info"},
  {id:4,type:"Gate Change", template:(f:string,g:string)=>`Important announcement. Flight ${f} gate has been changed to Gate ${g}. Please proceed to the new gate immediately.`,priority:"Urgent"},
  {id:5,type:"Cancellation",template:(f:string,_:string)=>`We regret to announce that flight ${f} has been cancelled. Please contact the airline counter for rebooking assistance.`,priority:"Critical"},
  {id:6,type:"Security",    template:(_:string,__:string)=>`Security announcement: All passengers are requested to keep their baggage with them at all times. Report any unattended baggage to security immediately.`,priority:"Info"},
];

const LOG = [
  {id:1,time:"14:32",flight:"AI-101",type:"Boarding",   gate:"A1",lang:["EN","HI"],status:"Played"},
  {id:2,time:"14:15",flight:"6E-202",type:"Boarding",   gate:"B3",lang:["EN","HI"],status:"Played"},
  {id:3,time:"13:58",flight:"UK-303",type:"Delay",       gate:"C2",lang:["EN","HI","GU"],status:"Played"},
  {id:4,time:"13:42",flight:"SG-404",type:"Gate Change", gate:"D4",lang:["EN","HI"],status:"Played"},
  {id:5,time:"13:20",flight:"IX-505",type:"Final Call",  gate:"A2",lang:["EN"],status:"Played"},
];

const PRIORITY_STYLE: Record<string,string> = {
  Normal:  "bg-sky-500/15 text-sky-400 border-sky-500/20",
  Urgent:  "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  Info:    "bg-slate-500/15 text-slate-400 border-slate-500/20",
  Critical:"bg-red-500/15 text-red-400 border-red-500/20",
};

export function AnnouncementsPage() {
  const [selectedTmpl, setTmpl]   = useState(ANNOUNCEMENT_TEMPLATES[0]);
  const [flight,       setFlight] = useState("AI-101");
  const [gate,         setGate]   = useState("A1");
  const [lang,         setLang]   = useState(["EN","HI"]);
  const [zone,         setZone]   = useState("All Terminals");
  const [playing,      setPlaying] = useState<number|null>(null);
  const [muted,        setMuted]   = useState(false);
  const [log,          setLog]     = useState(LOG);

  const {data:flights=[]} = useQuery({queryKey:["flights"],queryFn:fetchFlights});
  const fl = flights as any[];

  const preview = selectedTmpl.template(flight, gate);

  const broadcast = () => {
    setPlaying(selectedTmpl.id);
    const newEntry = {
      id: log.length+1,
      time: new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}),
      flight, type:selectedTmpl.type, gate, lang, status:"Playing",
    };
    setLog(prev=>[newEntry,...prev]);
    const done = () => { setPlaying(null); setLog(p=>p.map(e=>e.id===newEntry.id?{...e,status:"Played"}:e)); };
    if (voiceSupported()) speak(preview).then(done); else setTimeout(done, 3000);
  };

  const toggleLang = (l:string) =>
    setLang(prev=>prev.includes(l)?prev.filter(x=>x!==l):[...prev,l]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">PA System & Announcements</h1>
          <p className="text-slate-400 text-sm mt-0.5">Public address system control panel</p>
        </div>
        <button onClick={()=>{ if(!muted) stopSpeaking(); setMuted(m=>!m); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
            muted?"bg-red-500/15 text-red-400 border-red-500/20":"bg-green-500/15 text-green-400 border-green-500/20"}`}>
          {muted?<VolumeX className="w-4 h-4"/>:<Volume2 className="w-4 h-4"/>}
          {muted?"System Muted":"System Active"}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Announcement composer */}
        <div className="xl:col-span-2 space-y-5">
          {/* Template selector */}
          <div className="bg-navy-800 rounded-2xl border border-navy-600 p-5">
            <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-sky-400"/>Announcement Type
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {ANNOUNCEMENT_TEMPLATES.map(t=>(
                <button key={t.id} onClick={()=>setTmpl(t)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedTmpl.id===t.id
                      ?"border-sky-500/50 bg-sky-500/10 text-sky-300"
                      :"border-navy-600 text-slate-400 hover:border-navy-500 hover:text-white"}`}>
                  <div className="font-medium text-sm">{t.type}</div>
                  <div className={`text-xs mt-1 px-2 py-0.5 rounded-full border w-fit ${PRIORITY_STYLE[t.priority]}`}>
                    {t.priority}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Parameters */}
          <div className="bg-navy-800 rounded-2xl border border-navy-600 p-5">
            <h2 className="font-semibold text-white mb-4">Announcement Details</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Flight Number</label>
                <select value={flight} onChange={e=>setFlight(e.target.value)}
                  className="w-full bg-navy-700 border border-navy-600 focus:border-sky-500 rounded-xl px-3 py-2.5 text-sm text-white outline-none">
                  {fl.length>0
                    ? fl.map((f:any)=><option key={f.id} value={f.flight_number}>{f.flight_number}</option>)
                    : ["AI-101","6E-202","UK-303","SG-404","IX-505"].map(f=><option key={f} value={f}>{f}</option>)
                  }
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Gate / Destination</label>
                <input value={gate} onChange={e=>setGate(e.target.value)}
                  className="w-full bg-navy-700 border border-navy-600 focus:border-sky-500 rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                  placeholder="A1 / BOM"/>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Broadcast Zone</label>
                <select value={zone} onChange={e=>setZone(e.target.value)}
                  className="w-full bg-navy-700 border border-navy-600 rounded-xl px-3 py-2.5 text-sm text-white outline-none">
                  {["All Terminals","Terminal 1","Terminal 2","Terminal 3","Gates Area Only","Arrivals Only"].map(z=>(
                    <option key={z} value={z}>{z}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Language</label>
                <div className="flex flex-wrap gap-2">
                  {["EN","HI","GU","PU","TA"].map(l=>(
                    <button key={l} onClick={()=>toggleLang(l)}
                      className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all ${
                        lang.includes(l)?"bg-sky-500 text-white border-sky-500":"bg-navy-700 text-slate-400 border-navy-600"}`}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="p-4 bg-navy-900 rounded-xl border border-navy-600 mb-4">
              <div className="text-xs text-slate-500 mb-2">Announcement Preview</div>
              <div className="text-sm text-slate-200 leading-relaxed italic">"{preview}"</div>
            </div>

            <button onClick={broadcast} disabled={!!playing||muted}
              className={`w-full flex items-center justify-center gap-3 py-3.5 rounded-xl text-sm font-bold transition-all ${
                playing?"bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 cursor-wait":
                muted?"bg-slate-700 text-slate-500 cursor-not-allowed":
                "bg-sky-500 hover:bg-sky-600 text-white"}`}>
              {playing
                ?<><Volume2 className="w-5 h-5 animate-pulse"/>Broadcasting now...</>
                :<><Play className="w-5 h-5 fill-current"/>Broadcast Announcement</>
              }
            </button>
          </div>
        </div>

        {/* Broadcast log */}
        <div className="bg-navy-800 rounded-2xl border border-navy-600 overflow-hidden">
          <div className="p-4 border-b border-navy-600 flex items-center gap-2">
            <Clock className="w-4 h-4 text-sky-400"/>
            <h2 className="font-semibold text-white text-sm">Broadcast Log</h2>
          </div>
          <div className="overflow-y-auto" style={{maxHeight:"500px"}}>
            {log.map((l,i)=>(
              <div key={l.id} className={`p-4 border-b border-navy-700/50 ${i===0&&l.status==="Playing"?"bg-sky-500/5":""}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-xs text-slate-500">{l.time}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    l.status==="Playing"?"bg-sky-500/20 text-sky-400 animate-pulse":
                    "bg-green-500/15 text-green-400"}`}>
                    {l.status}
                  </span>
                </div>
                <div className="font-mono font-bold text-sky-300 text-sm">{l.flight}</div>
                <div className="text-xs text-slate-300">{l.type} • Gate {l.gate}</div>
                <div className="flex gap-1 mt-1.5">
                  {l.lang.map(lg=>(
                    <span key={lg} className="text-xs bg-navy-700 text-slate-400 px-1.5 py-0.5 rounded font-mono">
                      {lg}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
