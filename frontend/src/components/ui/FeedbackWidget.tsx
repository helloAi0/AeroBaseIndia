import { useState } from "react";
import { MessageSquare, Star, X, CheckCircle } from "lucide-react";

interface Props {
  role: string;
  name: string;
  context?: string; // e.g. "AI-101" for pilot, "KFC" for retailer
  onClose?: ()=>void;
  minimal?: boolean; // compact floating button version
}

const CATEGORIES: Record<string,string[]> = {
  passenger:   ["Check-in","Security","Lounge","F&B / Dining","Baggage","Staff Behaviour","Cleanliness","Overall"],
  retailer:    ["Sales Support","Lease / Rent","Maintenance","Compliance","Airport Communication","Overall"],
  staff:       ["Work Conditions","Equipment","Management","Safety","Training","Overall"],
  pilot:       ["ATC Communication","Ground Crew","Fuel Service","Aircraft Handling","Weather Briefing","Scheduling","Overall"],
  airline:     ["Gate Allocation","Ground Handling","Check-in Counter","Baggage Handling","Passenger Support","Overall"],
  airport_admin:["Infrastructure","IT Systems","Staff Performance","Revenue","Vendors","Overall"],
};

// Global feedback store (persisted in localStorage)
export function useFeedbackStore() {
  const save = (entry: object) => {
    try {
      const all = JSON.parse(localStorage.getItem("aerobase-feedback")||"[]");
      all.unshift({...entry, id: Date.now(), timestamp: new Date().toISOString()});
      localStorage.setItem("aerobase-feedback", JSON.stringify(all.slice(0,200)));
    } catch(e){}
  };
  const getAll = () => {
    try { return JSON.parse(localStorage.getItem("aerobase-feedback")||"[]"); }
    catch(e){ return []; }
  };
  return { save, getAll };
}

export function FeedbackWidget({ role, name, context, onClose, minimal=false }: Props) {
  const [open,     setOpen]   = useState(!minimal);
  const [rating,   setRating] = useState(0);
  const [hover,    setHover]  = useState(0);
  const [category, setCat]    = useState("");
  const [text,     setText]   = useState("");
  const [done,     setDone]   = useState(false);
  const { save } = useFeedbackStore();

  const cats = CATEGORIES[role] || CATEGORIES["staff"];

  const submit = () => {
    if(!rating||!text.trim()) return;
    save({ role, name, context, rating, category, text });
    setDone(true);
    setTimeout(()=>{ setDone(false); if(onClose) onClose(); if(minimal) setOpen(false); }, 2000);
  };

  if(minimal && !open) return (
    <button onClick={()=>setOpen(true)}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold text-white shadow-2xl transition-all hover:scale-105"
      style={{background:"linear-gradient(135deg,#0ea5e9,#14b8a6)",boxShadow:"0 8px 32px rgba(14,165,233,0.4)"}}>
      <MessageSquare className="w-4 h-4"/>
      Feedback
    </button>
  );

  return (
    <div className={minimal ? "fixed inset-0 z-50 flex items-center justify-center p-4" : ""}
      style={minimal ? {background:"rgba(0,0,0,0.7)",backdropFilter:"blur(8px)"} : {}}>
      <div className="w-full max-w-md rounded-3xl border overflow-hidden"
        style={{background:"#0f1629",borderColor:"rgba(56,189,248,0.3)"}}>
        {/* Header */}
        <div className="p-5 border-b flex items-center justify-between"
          style={{background:"rgba(14,165,233,0.08)",borderColor:"rgba(56,189,248,0.15)"}}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{background:"rgba(14,165,233,0.2)"}}>
              <MessageSquare className="w-5 h-5 text-sky-400"/>
            </div>
            <div>
              <div className="font-bold text-white">Share Your Feedback</div>
              <div className="text-xs text-slate-400">Help us improve — {context||"AeroBase India"}</div>
            </div>
          </div>
          {(minimal||onClose) && (
            <button onClick={()=>{ setOpen(false); if(onClose) onClose(); }}
              className="text-slate-500 hover:text-white">
              <X className="w-4 h-4"/>
            </button>
          )}
        </div>

        {done ? (
          <div className="p-8 text-center">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3"/>
            <div className="font-bold text-white text-lg">Thank You!</div>
            <div className="text-slate-400 text-sm mt-1">Your feedback has been submitted.</div>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            {/* Rating stars */}
            <div>
              <label className="text-xs text-slate-400 font-semibold mb-2 block uppercase tracking-wider">
                Overall Rating
              </label>
              <div className="flex gap-2">
                {[1,2,3,4,5].map(s=>(
                  <button key={s}
                    onMouseEnter={()=>setHover(s)}
                    onMouseLeave={()=>setHover(0)}
                    onClick={()=>setRating(s)}
                    className="transition-transform hover:scale-110">
                    <Star className={`w-8 h-8 transition-colors ${
                      s<=(hover||rating)?"fill-yellow-400 text-yellow-400":"text-slate-600"}`}/>
                  </button>
                ))}
                {rating>0 && (
                  <span className="ml-2 text-sm self-center font-semibold"
                    style={{color:rating>=4?"#22c55e":rating===3?"#f59e0b":"#ef4444"}}>
                    {["","Poor","Fair","Good","Very Good","Excellent"][rating]}
                  </span>
                )}
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="text-xs text-slate-400 font-semibold mb-1.5 block uppercase tracking-wider">
                Category
              </label>
              <div className="flex flex-wrap gap-2">
                {cats.map(c=>(
                  <button key={c} onClick={()=>setCat(c)}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium border transition-all"
                    style={category===c
                      ?{background:"rgba(14,165,233,0.2)",borderColor:"rgba(14,165,233,0.5)",color:"#38bdf8"}
                      :{background:"rgba(255,255,255,0.03)",borderColor:"rgba(255,255,255,0.08)",color:"#64748b"}}>
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Text */}
            <div>
              <label className="text-xs text-slate-400 font-semibold mb-1.5 block uppercase tracking-wider">
                Your Comments
              </label>
              <textarea value={text} onChange={e=>setText(e.target.value)} rows={3}
                placeholder="Tell us about your experience..."
                className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none border resize-none"
                style={{background:"rgba(255,255,255,0.05)",borderColor:"rgba(255,255,255,0.1)"}}/>
            </div>

            <button onClick={submit}
              disabled={!rating||!text.trim()}
              className="w-full py-3.5 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-40"
              style={{background:"linear-gradient(135deg,#0ea5e9,#14b8a6)"}}>
              Submit Feedback
            </button>

            <div className="text-xs text-slate-600 text-center">
              Submitted by: <span className="text-slate-400">{name}</span> · {role}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
