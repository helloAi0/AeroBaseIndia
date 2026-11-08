import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api, fetchFlights } from "../../api/client";
import { Zap, Brain, TrendingUp, AlertTriangle, Play, Clock, CheckCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

const TOOLTIP_STYLE = {
  background:"#0f1629",border:"1px solid #1e2d4d",borderRadius:10,fontSize:12
};

const historicalAccuracy = [
  {d:"Mon",predicted:85,actual:82},{d:"Tue",predicted:90,actual:88},
  {d:"Wed",predicted:75,actual:78},{d:"Thu",predicted:95,actual:91},
  {d:"Fri",predicted:88,actual:85},{d:"Sat",predicted:92,actual:94},
  {d:"Sun",predicted:87,actual:89},
];

const delayFactors = [
  {factor:"Weather",   impact:35},{factor:"Air Traffic", impact:28},
  {factor:"Congestion", impact:20},{factor:"Technical",   impact:10},
  {factor:"Crew",       impact:7},
];

const STAT_COLORS: Record<string, string> = {
  green: "text-green-400",
  sky: "text-sky-400",
  teal: "text-teal-400",
  yellow: "text-yellow-400"
};

const RISK_TEXT_COLORS: Record<string, string> = {
  green: "text-green-400",
  yellow: "text-yellow-400",
  orange: "text-orange-400",
  red: "text-red-400"
};

export function AIPredictions() {
  const [weather,    setWeather]    = useState(5);
  const [congestion, setCongestion] = useState(5);
  const [prediction, setPrediction] = useState<number|null>(null);

  const {data:flights=[]} = useQuery({queryKey:["flights"],queryFn:fetchFlights});
  const fl = flights as any[];

  const mut = useMutation({
    mutationFn: async () => {
      const r = await api.post("/predict/delay", {
        weather_score: weather, congestion_score: congestion
      });
      return r.data;
    },
    onSuccess: (d) => setPrediction(d.predicted_delay_minutes??0),
  });

  const getRiskLevel = (v:number) => v<=3?"Low":v<=6?"Medium":v<=8?"High":"Critical";
  const getRiskColor = (v:number) => v<=3?"green":v<=6?"yellow":v<=8?"orange":"red";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">AI Predictions</h1>
          <p className="text-slate-400 text-sm mt-0.5">ML-powered delay prediction & insights</p>
        </div>
        <div className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 px-4 py-2 rounded-xl">
          <Brain className="w-4 h-4 text-purple-400"/>
          <span className="text-sm text-purple-400 font-medium">Model Active</span>
        </div>
      </div>

      {/* Model stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          {label:"Model Accuracy", value:"91.2%",   icon:<CheckCircle className="w-5 h-5"/>, color:"green"},
          {label:"Predictions/Day",value:"156",     icon:<Zap className="w-5 h-5"/>,         color:"sky"},
          {label:"Avg Delay Saved",value:"23 min",  icon:<Clock className="w-5 h-5"/>,       color:"teal"},
          {label:"Risk Alerts",    value:"5 today", icon:<AlertTriangle className="w-5 h-5"/>,color:"yellow"},
        ].map(({label,value,icon,color})=>(
          <div key={label} className="bg-navy-800 rounded-2xl p-5 border border-navy-600">
            <div className={`${STAT_COLORS[color] || "text-slate-400"} mb-3`}>{icon}</div>
            <div className="text-2xl font-bold font-mono text-white mb-0.5">{value}</div>
            <div className="text-sm text-slate-400">{label}</div>
          </div>
        ))}
      </div>

      {/* Interactive predictor */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="bg-navy-800 rounded-2xl p-6 border border-navy-600">
          <div className="flex items-center gap-2 mb-6">
            <Brain className="w-5 h-5 text-purple-400"/>
            <h2 className="font-semibold text-white">Live Delay Predictor</h2>
          </div>

          {/* Sliders */}
          <div className="space-y-5 mb-6">
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm text-slate-300">Weather Score</label>
                <span className={`text-sm font-bold ${RISK_TEXT_COLORS[getRiskColor(weather)] || "text-slate-400"}`}>
                  {weather}/10 — {getRiskLevel(weather)} Risk
                </span>
              </div>
              <input type="range" min="1" max="10" value={weather}
                onChange={e=>setWeather(+e.target.value)}
                className="w-full accent-sky-500"/>
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>Clear skies</span><span>Severe storm</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm text-slate-300">Congestion Score</label>
                <span className={`text-sm font-bold ${RISK_TEXT_COLORS[getRiskColor(congestion)] || "text-slate-400"}`}>
                  {congestion}/10 — {getRiskLevel(congestion)} Risk
                </span>
              </div>
              <input type="range" min="1" max="10" value={congestion}
                onChange={e=>setCongestion(+e.target.value)}
                className="w-full accent-teal-500"/>
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>Light traffic</span><span>Heavy congestion</span>
              </div>
            </div>
          </div>

          <button onClick={()=>mut.mutate()}
            disabled={mut.isPending}
            className="w-full flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-600 disabled:opacity-60 text-white py-3 rounded-xl font-semibold transition-colors">
            <Play className="w-4 h-4 fill-current"/>
            {mut.isPending?"Predicting...":"Run AI Prediction"}
          </button>

          {prediction !== null && (
            <div className={`mt-5 p-5 rounded-2xl border text-center ${
              prediction<=10?"bg-green-500/10 border-green-500/20":
              prediction<=30?"bg-yellow-500/10 border-yellow-500/20":
                               "bg-red-500/10 border-red-500/20"
            }`}>
              <div className={`text-5xl font-bold font-mono mb-2 ${
                prediction<=10?"text-green-400":
                prediction<=30?"text-yellow-400":"text-red-400"
              }`}>{prediction}</div>
              <div className="text-white font-semibold">minutes predicted delay</div>
              <div className="text-sm text-slate-400 mt-1">
                {prediction<=10?"✓ Minimal impact — flight likely on time":
                 prediction<=30?"⚠ Moderate delay — notify passengers":
                               "✗ Significant delay — consider gate change"}
              </div>
            </div>
          )}
        </div>

        {/* Delay factors */}
        <div className="bg-navy-800 rounded-2xl p-5 border border-navy-600">
          <h2 className="font-semibold text-white mb-4">Delay Factor Analysis</h2>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={delayFactors} layout="vertical" margin={{left:20,right:20}}>
                <XAxis type="number" tick={{fill:"#475569",fontSize:11}} axisLine={false} tickLine={false}
                  tickFormatter={v=>`${v}%`}/>
                <YAxis dataKey="factor" type="category" tick={{fill:"#94a3b8",fontSize:11}}
                  axisLine={false} tickLine={false} width={80}/>
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v:any)=>[`${v}%`,"Impact"]}/>
                <Bar dataKey="impact" fill="#8b5cf6" radius={[0,6,6,0]} name="Impact %"/>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 space-y-2">
            {delayFactors.map(({factor,impact})=>(
              <div key={factor} className="flex items-center justify-between">
                <span className="text-sm text-slate-300">{factor}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-1.5 bg-navy-700 rounded-full">
                    <div className="h-full bg-purple-500 rounded-full"
                      style={{width:`${impact}%`}}/>
                  </div>
                  <span className="text-xs text-slate-400 w-8 text-right">{impact}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Historical accuracy */}
      <div className="bg-navy-800 rounded-2xl p-5 border border-navy-600">
        <h2 className="font-semibold text-white mb-4">Prediction Accuracy — Last 7 Days</h2>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historicalAccuracy} margin={{left:-20}}>
              <XAxis dataKey="d" tick={{fill:"#475569",fontSize:11}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:"#475569",fontSize:11}} axisLine={false} tickLine={false}
                domain={[70,100]} tickFormatter={v=>`${v}%`}/>
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v:any)=>[`${v}%`]}/>
              <Line type="monotone" dataKey="predicted" stroke="#8b5cf6" strokeWidth={2}
                strokeDasharray="5 5" dot={false} name="Predicted"/>
              <Line type="monotone" dataKey="actual"    stroke="#22c55e" strokeWidth={2}
                dot={false} name="Actual"/>
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex gap-4 mt-2 text-xs text-slate-500">  <span className="flex items-center gap-1.5">    <div className="w-4 h-px bg-purple-500 opacity-70"/>    Predicted  </span>  <span className="flex items-center gap-1.5">    <div className="w-4 h-px bg-green-500"/>    Actual  </span></div>
      </div>

      {/* Flight risk table */}
      {fl.length > 0 && (
        <div className="bg-navy-800 rounded-2xl border border-navy-600 overflow-hidden">
          <div className="p-5 border-b border-navy-600 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-sky-400"/>
            <h2 className="font-semibold text-white">Flight Risk Assessment</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-500 text-xs uppercase">
                {["Flight","Route","Status","Risk Level","Action"].map(h=>(
                  <th key={h} className="px-5 py-3 text-left border-b border-navy-700">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fl.slice(0,6).map((f:any,i:number)=>{
                const risk    = ["Low","Low","Medium","High","Low","Medium"][i]||"Low";
                const riskClr = risk==="High"?"red" : risk==="Medium"?"yellow":"green";
                const labelColorClass = riskClr === "red" ? "bg-red-500/15 text-red-400 border-red-500/20" : riskClr === "yellow" ? "bg-yellow-500/15 text-yellow-400 border-yellow-500/20" : "bg-green-500/15 text-green-400 border-green-500/20";
                
                return (
                  <tr key={f.id||i} className="border-b border-navy-700/50 hover:bg-navy-700/30">
                    <td className="px-5 py-3 font-mono font-bold text-sky-300">{f.flight_number}</td>
                    <td className="px-5 py-3 text-slate-300">{f.origin}→{f.destination}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${
                        f.status==="Delayed"?"bg-yellow-500/15 text-yellow-400 border-yellow-500/20":
                        f.status==="Boarding"?"bg-teal-500/15 text-teal-400 border-teal-500/20":
                        "bg-sky-500/15 text-sky-400 border-sky-500/20"}`}>
                        {f.status}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full border ${labelColorClass}`}>
                        {risk}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-400">
                      {risk==="High"?"Notify passengers & ops":
                       risk==="Medium"?"Monitor closely":"No action needed"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}