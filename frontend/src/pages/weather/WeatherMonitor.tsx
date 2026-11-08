import { useState, useEffect } from "react";
import { Wind, Eye, Droplets, Thermometer, AlertTriangle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip,
         ResponsiveContainer, AreaChart, Area } from "recharts";

const HOURLY = [
  {h:"00",temp:24,wind:12,vis:9,rain:0},  {h:"03",temp:22,wind:10,vis:10,rain:0},
  {h:"06",temp:26,wind:15,vis:8,rain:2},  {h:"09",temp:31,wind:18,vis:7,rain:5},
  {h:"12",temp:35,wind:22,vis:6,rain:8},  {h:"15",temp:34,wind:25,vis:5,rain:12},
  {h:"18",temp:30,wind:20,vis:7,rain:4},  {h:"21",temp:27,wind:14,vis:9,rain:1},
];

const WEEKLY = [
  {d:"Mon",high:35,low:24,condition:"Partly Cloudy",wind:18,risk:"Low"},
  {d:"Tue",high:33,low:23,condition:"Thunderstorm",  wind:35,risk:"High"},
  {d:"Wed",high:28,low:21,condition:"Rainy",          wind:28,risk:"Med"},
  {d:"Thu",high:32,low:22,condition:"Partly Cloudy",  wind:15,risk:"Low"},
  {d:"Fri",high:36,low:25,condition:"Sunny",           wind:12,risk:"Low"},
  {d:"Sat",high:34,low:24,condition:"Hazy",            wind:10,risk:"Low"},
  {d:"Sun",high:31,low:22,condition:"Partly Cloudy",   wind:16,risk:"Low"},
];

const ALERTS = [
  {type:"Thunderstorm Warning", area:"Approach path 28L", time:"14:00-16:00", sev:"HIGH"},
  {type:"Low Visibility",       area:"All runways",       time:"09:00-11:00", sev:"MED"},
  {type:"Strong Crosswind",     area:"Runway 10R",        time:"13:00-15:00", sev:"MED"},
];

const RISK_STYLE: Record<string,string> = {
  High:"bg-red-500/15 text-red-400 border-red-500/20",
  Med: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  Low: "bg-green-500/15 text-green-400 border-green-500/20",
};

const TOOLTIP = {background:"#0f1629",border:"1px solid #1e2d4d",borderRadius:10,fontSize:12};

export function WeatherMonitor() {
  const [time, setTime] = useState(new Date().toLocaleTimeString());
  useEffect(()=>{
    const t = setInterval(()=>setTime(new Date().toLocaleTimeString()), 1000);
    return ()=>clearInterval(t);
  },[]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Weather Monitor</h1>
          <p className="text-slate-400 text-sm mt-0.5">Delhi IGI Airport — Live weather data</p>
        </div>
        <div className="text-right">
          <div className="text-xl font-mono text-sky-300">{time}</div>
          <div className="text-xs text-slate-500">Last updated: live</div>
        </div>
      </div>

      {/* Current conditions */}
      <div className="bg-gradient-to-br from-sky-900/40 to-navy-800 rounded-2xl p-6 border border-sky-500/20">
        <div className="grid grid-cols-2 xl:grid-cols-5 gap-6">
          <div className="xl:col-span-2">
            <div className="text-6xl font-bold font-mono text-white mb-1">32°C</div>
            <div className="text-slate-300 text-lg">Partly Cloudy</div>
            <div className="text-slate-400 text-sm mt-1">Feels like 38°C</div>
          </div>
          {[
            {label:"Wind",       value:"22 km/h",  dir:"NE", icon:<Wind className="w-5 h-5"/>},
            {label:"Visibility", value:"6 km",              icon:<Eye className="w-5 h-5"/>},
            {label:"Humidity",   value:"68%",               icon:<Droplets className="w-5 h-5"/>},
            {label:"Pressure",   value:"1012 hPa",          icon:<Thermometer className="w-5 h-5"/>},
          ].map(({label,value,dir,icon})=>(
            <div key={label} className="bg-navy-800/60 rounded-xl p-4 border border-navy-600">
              <div className="text-sky-400 mb-2">{icon}</div>
              <div className="text-xl font-bold font-mono text-white">{value}</div>
              {dir && <div className="text-xs text-sky-300">{dir}</div>}
              <div className="text-xs text-slate-400 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Active alerts */}
      {ALERTS.length>0 && (
        <div className="space-y-2">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400"/>
            Active Aviation Alerts
          </h2>
          {ALERTS.map((a,i)=>(
            <div key={i} className={`flex items-center justify-between p-4 rounded-xl border ${RISK_STYLE[a.sev]}`}>
              <div>
                <div className="font-semibold text-sm">{a.type}</div>
                <div className="text-xs opacity-70">{a.area} • {a.time}</div>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${RISK_STYLE[a.sev]}`}>
                {a.sev}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="bg-navy-800 rounded-2xl p-5 border border-navy-600">
          <h2 className="font-semibold text-white mb-4">Hourly Temperature</h2>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={HOURLY} margin={{left:-20}}>
              <defs>
                <linearGradient id="tg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="h" tick={{fill:"#475569",fontSize:11}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:"#475569",fontSize:11}} axisLine={false} tickLine={false} tickFormatter={v=>`${v}°`}/>
              <Tooltip contentStyle={TOOLTIP} formatter={(v:any)=>[`${v}°C`,"Temp"]}/>
              <Area type="monotone" dataKey="temp" stroke="#f59e0b" fill="url(#tg)" strokeWidth={2} name="°C"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-navy-800 rounded-2xl p-5 border border-navy-600">
          <h2 className="font-semibold text-white mb-4">Wind Speed & Visibility</h2>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={HOURLY} margin={{left:-20}}>
              <XAxis dataKey="h" tick={{fill:"#475569",fontSize:11}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:"#475569",fontSize:11}} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={TOOLTIP}/>
              <Line type="monotone" dataKey="wind" stroke="#38bdf8" strokeWidth={2} dot={false} name="Wind km/h"/>
              <Line type="monotone" dataKey="vis"  stroke="#2dd4bf" strokeWidth={2} dot={false} name="Visibility km"/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 7-day forecast */}
      <div className="bg-navy-800 rounded-2xl border border-navy-600 overflow-hidden">
        <div className="p-5 border-b border-navy-600">
          <h2 className="font-semibold text-white">7-Day Forecast</h2>
        </div>
        <div className="grid grid-cols-7">
          {WEEKLY.map((d,i)=>(
            <div key={i} className={`p-4 text-center border-r border-navy-600 last:border-0 ${
              i===0?"bg-sky-500/5":""}`}>
              <div className="text-xs text-slate-500 mb-2">{d.d}</div>
              <div className="text-lg mb-1">
                {d.condition==="Sunny"?"☀️":
                 d.condition==="Rainy"?"🌧️":
                 d.condition==="Thunderstorm"?"⛈️":
                 d.condition==="Hazy"?"🌫️":"⛅"}
              </div>
              <div className="text-sm font-bold text-white">{d.high}°</div>
              <div className="text-xs text-slate-500">{d.low}°</div>
              <div className="mt-2">
                <span className={`text-xs px-1.5 py-0.5 rounded-full border ${RISK_STYLE[d.risk]}`}>
                  {d.risk}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* METAR / ATIS */}
      <div className="bg-navy-900 rounded-2xl p-5 border border-navy-600 font-mono">
        <div className="text-xs text-slate-500 mb-2">METAR VIDP</div>
        <div className="text-sm text-green-300 leading-relaxed">
          VIDP 250830Z 05012KT 6000 FEW020 SCT035 32/22 Q1012 NOSIG=
        </div>
        <div className="text-xs text-slate-500 mt-3 mb-1">ATIS Information KILO</div>
        <div className="text-xs text-slate-400 leading-relaxed">
          DELHI INFORMATION KILO 0830Z. WIND 050 DEGREES 12 KNOTS.
          VISIBILITY 6 KILOMETERS. FEW CLOUDS 2000 FEET. TEMPERATURE
          32 DEW POINT 22. QNH 1012. EXPECT ILS APPROACH RUNWAY 28.
          ADVISE ON INITIAL CONTACT YOU HAVE INFORMATION KILO.
        </div>
      </div>
    </div>
  );
}
