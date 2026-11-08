import { useState, useEffect } from "react";
import { Star, MessageSquare, Download,
         TrendingUp, ThumbsUp, ThumbsDown, Minus } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { FeedbackWidget, useFeedbackStore } from "../../components/ui/FeedbackWidget";
import {
  LineChart, Line, BarChart, Bar, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

const TOOLTIP = {background:"#0a0e1a",border:"1px solid #1e3a5f",borderRadius:10,fontSize:11};

// Demo feedback data (pre-populated)
const DEMO_FEEDBACK = [
  {id:1,role:"passenger",name:"Rahul S.",     context:"T3",   rating:5,category:"Check-in",      text:"Very smooth check-in process. Staff was helpful.",timestamp:"2024-04-26T08:00:00Z"},
  {id:2,role:"passenger",name:"Priya M.",     context:"T3",   rating:4,category:"F&B / Dining",  text:"Good food options but a bit expensive.",           timestamp:"2024-04-26T09:00:00Z"},
  {id:3,role:"passenger",name:"Amit K.",      context:"T2",   rating:2,category:"Baggage",        text:"Baggage took too long. 45 minutes wait.",          timestamp:"2024-04-25T14:00:00Z"},
  {id:4,role:"staff",    name:"Neha G.",      context:"Ops",  rating:4,category:"Work Conditions", text:"Good equipment, but need more staff during peak.",  timestamp:"2024-04-25T10:00:00Z"},
  {id:5,role:"pilot",    name:"Capt. Sharma", context:"AI-101",rating:5,category:"ATC Communication",text:"Excellent ATC support. Smooth landing clearance.", timestamp:"2024-04-26T06:30:00Z"},
  {id:6,role:"pilot",    name:"Capt. Singh",  context:"6E-2341",rating:3,category:"Ground Crew",  text:"Ground crew was slow in fueling. 20 min delay.",   timestamp:"2024-04-25T11:00:00Z"},
  {id:7,role:"retailer", name:"KFC DEL T2",   context:"KFC",  rating:4,category:"Sales Support",  text:"Good footfall in T2. Need more signage near gate B.",timestamp:"2024-04-24T15:00:00Z"},
  {id:8,role:"airline",  name:"IndiGo DEL",   context:"6E",   rating:3,category:"Gate Allocation", text:"Gate changes too frequent. Causes passenger confusion.",timestamp:"2024-04-24T12:00:00Z"},
  {id:9,role:"passenger",name:"Vikram N.",    context:"T3",   rating:5,category:"Cleanliness",    text:"Spotlessly clean terminals. Very impressed.",       timestamp:"2024-04-23T16:00:00Z"},
  {id:10,role:"staff",   name:"Sunita R.",    context:"Security",rating:2,category:"Equipment",   text:"Security scanners at Gate C2 keep malfunctioning.",  timestamp:"2024-04-23T09:00:00Z"},
  {id:11,role:"passenger",name:"Meera J.",    context:"T1",   rating:4,category:"Security",       text:"Quick security check. Officers were professional.",  timestamp:"2024-04-22T13:00:00Z"},
  {id:12,role:"airline", name:"Air India DEL",context:"AI",   rating:5,category:"Ground Handling","text":"Excellent coordination. Baggage loaded efficiently.", timestamp:"2024-04-22T10:00:00Z"},
];

const NPS_TREND = [
  {m:"Jan",nps:42},{m:"Feb",nps:38},{m:"Mar",nps:44},{m:"Apr",nps:41},{m:"May",nps:47},{m:"Jun",nps:52},
];

const CAT_SCORES = [
  {cat:"Check-in",score:4.2},{cat:"Security",score:3.9},{cat:"Cleanliness",score:4.4},
  {cat:"F&B",score:3.7},{cat:"Navigation",score:4.1},{cat:"Baggage",score:3.2},
];

const RADAR_DATA = [
  {m:"Check-in",v:84},{m:"Security",v:78},{m:"Cleanliness",v:88},
  {m:"Baggage",v:64},{m:"F&B",v:74},{m:"Staff",v:82},{m:"Navigation",v:82},
];

const ROLE_COLOR: Record<string,string> = {
  passenger:"#8b5cf6", staff:"#14b8a6", pilot:"#0ea5e9",
  retailer:"#f97316",  airline:"#22c55e", airport_admin:"#f59e0b",
};
const ROLE_BADGE: Record<string,string> = {
  passenger:"bg-purple-500/15 text-purple-400 border-purple-500/20",
  staff:    "bg-teal-500/15 text-teal-400 border-teal-500/20",
  pilot:    "bg-sky-500/15 text-sky-400 border-sky-500/20",
  retailer: "bg-orange-500/15 text-orange-400 border-orange-500/20",
  airline:  "bg-green-500/15 text-green-400 border-green-500/20",
  airport_admin:"bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
};

export function FeedbackPage() {
  const { user } = useAuthStore();
  const { getAll } = useFeedbackStore();
  const [roleFilter, setRoleFilter] = useState("All");
  const [ratingFilter, setRatingFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);

  // Merge demo + real feedback
  const [allFeedback, setAll] = useState<any[]>([]);
  useEffect(()=>{
    const real = getAll();
    setAll([...real, ...DEMO_FEEDBACK].sort((a,b)=>
      new Date(b.timestamp).getTime()-new Date(a.timestamp).getTime()
    ));
  },[showForm]);

  const isAdmin = user?.role==="airport_admin"||user?.role==="superadmin";

  const filtered = allFeedback.filter(f=>
    (roleFilter==="All"||f.role===roleFilter) &&
    (ratingFilter==="All"||(ratingFilter==="Positive"&&f.rating>=4)||(ratingFilter==="Negative"&&f.rating<=2)||(ratingFilter==="Neutral"&&f.rating===3))
  );

  const avgRating = (filtered.reduce((s,f)=>s+f.rating,0)/Math.max(filtered.length,1)).toFixed(1);
  const promoters  = allFeedback.filter(f=>f.rating>=4).length;
  const detractors = allFeedback.filter(f=>f.rating<=2).length;
  const passives   = allFeedback.filter(f=>f.rating===3).length;
  const nps = Math.round((promoters-detractors)/Math.max(allFeedback.length,1)*100);

  const roleKey = user?.role||"passenger";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {isAdmin ? "Customer Feedback & NPS" : "Submit Your Feedback"}
          </h1>
          <p className="text-slate-400 text-sm">
            {isAdmin ? "Passenger satisfaction & Net Promoter Score" : "Share your experience with us"}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={()=>setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white"
            style={{background:"linear-gradient(135deg,#0ea5e9,#14b8a6)"}}>
            <MessageSquare className="w-4 h-4"/>
            {showForm?"Cancel":"Give Feedback"}
          </button>
          {isAdmin && (
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-navy-600 text-slate-300 hover:text-white">
              <Download className="w-4 h-4"/>Export
            </button>
          )}
        </div>
      </div>

      {/* Feedback form */}
      {showForm && (
        <FeedbackWidget
          role={roleKey}
          name={user?.name||"User"}
          context={user?.airport||"DEL"}
          onClose={()=>setShowForm(false)}/>
      )}

      {/* Admin: full dashboard */}
      {isAdmin && !showForm && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
            {[
              {label:"NPS Score",      value:String(nps),  icon:<TrendingUp className="w-5 h-5"/>,    color:"#0ea5e9", note:nps>=50?"Excellent":nps>=30?"Good":"Needs Work"},
              {label:"Avg Rating",     value:avgRating,    icon:<Star className="w-5 h-5"/>,          color:"#f59e0b", note:"Out of 5.0"},
              {label:"Promoters",      value:String(promoters), icon:<ThumbsUp className="w-5 h-5"/>, color:"#22c55e", note:"Rating 4-5"},
              {label:"Passives",       value:String(passives),  icon:<Minus className="w-5 h-5"/>,    color:"#64748b", note:"Rating 3"},
              {label:"Detractors",     value:String(detractors),icon:<ThumbsDown className="w-5 h-5"/>,color:"#ef4444",note:"Rating 1-2"},
            ].map(({label,value,icon,color,note})=>(
              <div key={label} className="rounded-2xl p-5 border"
                style={{background:`${color}08`,borderColor:`${color}20`}}>
                <div className="mb-2" style={{color}}>{icon}</div>
                <div className="text-2xl font-black text-white mb-0.5">{value}</div>
                <div className="text-xs text-slate-400">{label}</div>
                <div className={`text-xs mt-0.5 font-semibold`} style={{color}}>{note}</div>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid xl:grid-cols-2 gap-5">
            {/* NPS trend */}
            <div className="bg-navy-800 rounded-2xl p-5 border border-navy-600">
              <h2 className="font-bold text-white mb-4">NPS Trend — 6 Months</h2>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={NPS_TREND} margin={{left:-20}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4d" vertical={false}/>
                  <XAxis dataKey="m" tick={{fill:"#475569",fontSize:11}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fill:"#475569",fontSize:11}} axisLine={false} tickLine={false}/>
                  <Tooltip contentStyle={TOOLTIP}/>
                  <Line type="monotone" dataKey="nps" stroke="#0ea5e9" strokeWidth={2.5} dot={{fill:"#0ea5e9",r:4}} name="NPS"/>
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Category scores */}
            <div className="bg-navy-800 rounded-2xl p-5 border border-navy-600">
              <h2 className="font-bold text-white mb-4">Category Scores</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={CAT_SCORES} layout="vertical" margin={{left:60}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4d" horizontal={false}/>
                  <XAxis type="number" domain={[0,5]} tick={{fill:"#475569",fontSize:11}} axisLine={false} tickLine={false}/>
                  <YAxis type="category" dataKey="cat" tick={{fill:"#94a3b8",fontSize:11}} axisLine={false} tickLine={false}/>
                  <Tooltip contentStyle={TOOLTIP}/>
                  <Bar dataKey="score" name="Score" fill="#0ea5e9" radius={[0,6,6,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Experience Radar + Reviews */}
          <div className="grid xl:grid-cols-3 gap-5">
            {/* Radar */}
            <div className="bg-navy-800 rounded-2xl p-5 border border-navy-600">
              <h2 className="font-bold text-white mb-3">Experience Radar</h2>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={RADAR_DATA}>
                  <PolarGrid stroke="#1e3a5f"/>
                  <PolarAngleAxis dataKey="m" tick={{fill:"#64748b",fontSize:10}}/>
                  <Radar dataKey="v" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.18} name="Score"/>
                  <Tooltip contentStyle={TOOLTIP}/>
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Feedback by role breakdown */}
            <div className="bg-navy-800 rounded-2xl p-5 border border-navy-600 xl:col-span-2">
              <h2 className="font-bold text-white mb-4">Feedback by Role / Department</h2>
              <div className="space-y-3">
                {Object.entries(ROLE_COLOR).map(([role,color])=>{
                  const roleItems = allFeedback.filter(f=>f.role===role);
                  if(roleItems.length===0) return null;
                  const avg = (roleItems.reduce((s,f)=>s+f.rating,0)/roleItems.length).toFixed(1);
                  return (
                    <div key={role} className="flex items-center gap-3">
                      <div className="w-20 text-xs text-slate-400 capitalize">{role}</div>
                      <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{background:"#1e2d4d"}}>
                        <div className="h-full rounded-full transition-all"
                          style={{width:`${(parseFloat(avg)/5)*100}%`,background:color}}/>
                      </div>
                      <div className="text-xs font-bold w-8 text-right" style={{color}}>{avg}</div>
                      <div className="text-xs text-slate-500 w-12">({roleItems.length})</div>
                    </div>
                  );
                }).filter(Boolean)}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Reviews list */}
      {isAdmin && !showForm && (
        <div className="bg-navy-800 rounded-2xl border border-navy-600 overflow-hidden">
          <div className="p-5 border-b border-navy-600 flex items-center justify-between flex-wrap gap-3">
            <h2 className="font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-sky-400"/>
              Recent Reviews ({filtered.length})
            </h2>
            <div className="flex gap-2 flex-wrap">
              {["All","passenger","staff","pilot","retailer","airline"].map(r=>(
                <button key={r} onClick={()=>setRoleFilter(r)}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium border transition-all capitalize"
                  style={roleFilter===r
                    ?{background:"#0ea5e9",borderColor:"#0ea5e9",color:"white"}
                    :{background:"transparent",borderColor:"rgba(255,255,255,0.08)",color:"#64748b"}}>
                  {r==="All"?"All Roles":r}
                </button>
              ))}
              <select value={ratingFilter} onChange={e=>setRatingFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl text-xs border outline-none"
                style={{background:"#0f1629",borderColor:"rgba(255,255,255,0.08)",color:"#94a3b8"}}>
                {["All","Positive","Neutral","Negative"].map(v=>(
                  <option key={v} style={{background:"#0f1629"}}>{v}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="divide-y divide-navy-700">
            {filtered.slice(0,20).map(f=>(
              <div key={f.id} className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                      style={{background:`${ROLE_COLOR[f.role]||"#64748b"}20`,color:ROLE_COLOR[f.role]||"#94a3b8"}}>
                      {(f.name||"?")[0]}
                    </div>
                    <div>
                      <div className="font-semibold text-white text-sm">{f.name}</div>
                      <div className="flex items-center gap-2 flex-wrap mt-0.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium capitalize ${ROLE_BADGE[f.role]||""}`}>
                          {f.role}
                        </span>
                        {f.context && <span className="text-xs text-slate-500">{f.context}</span>}
                        {f.category && <span className="text-xs px-2 py-0.5 rounded-full" style={{background:"rgba(14,165,233,0.1)",color:"#38bdf8"}}>{f.category}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {[1,2,3,4,5].map(s=>(
                      <Star key={s} className={`w-3.5 h-3.5 ${s<=f.rating?"fill-yellow-400 text-yellow-400":"text-slate-600"}`}/>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">{f.text}</p>
                <div className="text-xs text-slate-600 mt-2">
                  {new Date(f.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Non-admin: just show their own feedback history */}
      {!isAdmin && !showForm && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl border"
            style={{background:"rgba(14,165,233,0.06)",borderColor:"rgba(56,189,248,0.2)"}}>
            <h2 className="font-bold text-white mb-1">Your Feedback History</h2>
            <p className="text-xs text-slate-400">Reviews you have submitted</p>
          </div>
          {allFeedback.filter(f=>f.name===user?.name).length===0 ? (
            <div className="text-center py-12 text-slate-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30"/>
              <div>No feedback submitted yet.</div>
            </div>
          ) : (
            allFeedback.filter(f=>f.name===user?.name).map(f=>(
              <div key={f.id} className="bg-navy-800 rounded-2xl p-5 border border-navy-600">
                <div className="flex justify-between mb-2">
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{background:"rgba(14,165,233,0.1)",color:"#38bdf8"}}>{f.category}</span>
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(s=><Star key={s} className={`w-3.5 h-3.5 ${s<=f.rating?"fill-yellow-400 text-yellow-400":"text-slate-600"}`}/>)}
                  </div>
                </div>
                <p className="text-sm text-slate-300">{f.text}</p>
                <div className="text-xs text-slate-600 mt-2">{new Date(f.timestamp).toLocaleString()}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
