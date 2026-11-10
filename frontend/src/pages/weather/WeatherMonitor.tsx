import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Wind, Eye, Droplets, Gauge, AlertTriangle, RefreshCw, CloudOff } from "lucide-react";
import { Line, LineChart, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { useAirport } from "../../hooks/useAirport";

/**
 * Live weather from Open-Meteo (https://open-meteo.com): free, no API key, CORS-enabled.
 * Aviation alerts are DERIVED from the forecast using simple thresholds. They are an
 * operational aid, not an official METAR/SIGMET.
 */
const AIRPORTS = {
  DEL: { name: "Delhi IGI", lat: 28.5562, lon: 77.1 },
  BOM: { name: "Mumbai CSMIA", lat: 19.0896, lon: 72.8656 },
  BLR: { name: "Bengaluru KIA", lat: 13.1986, lon: 77.7066 },
} as const;
type Code = keyof typeof AIRPORTS;

const WMO: Record<number, [string, string]> = {
  0: ["Clear", "☀️"], 1: ["Mostly clear", "🌤️"], 2: ["Partly cloudy", "⛅"], 3: ["Overcast", "☁️"],
  45: ["Fog", "🌫️"], 48: ["Rime fog", "🌫️"], 51: ["Light drizzle", "🌦️"], 53: ["Drizzle", "🌦️"], 55: ["Heavy drizzle", "🌧️"],
  61: ["Light rain", "🌧️"], 63: ["Rain", "🌧️"], 65: ["Heavy rain", "🌧️"], 80: ["Showers", "🌦️"], 81: ["Showers", "🌧️"],
  82: ["Violent showers", "⛈️"], 95: ["Thunderstorm", "⛈️"], 96: ["Thunderstorm, hail", "⛈️"], 99: ["Severe thunderstorm", "⛈️"],
};
const wmo = (c: number) => WMO[c] ?? ["Unknown", "🌡️"];
const DIRS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
const compass = (d: number) => DIRS[Math.round(d / 45) % 8];

const RISK_STYLE: Record<string, string> = {
  High: "bg-red-500/15 text-red-400 border-red-500/20",
  Med: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  Low: "bg-green-500/15 text-green-400 border-green-500/20",
};
const TOOLTIP = { background: "#0f1629", border: "1px solid #1e2d4d", borderRadius: 10, fontSize: 12 };

interface Wx {
  cur: { temp: number; feels: number; code: number; wind: number; dir: number; gust: number; hum: number; pres: number; vis: number };
  hourly: { h: string; temp: number; wind: number; vis: number; pop: number }[];
  daily: { d: string; hi: number; lo: number; code: number; wind: number; pop: number; risk: string }[];
  alerts: { type: string; detail: string; sev: "High" | "Med" }[];
  fetchedAt: number;
}

async function fetchWx(code: Code): Promise<Wx> {
  const { lat, lon } = AIRPORTS[code];
  const q = new URLSearchParams({
    latitude: String(lat), longitude: String(lon), timezone: "Asia/Kolkata", forecast_days: "7",
    current: "temperature_2m,apparent_temperature,relative_humidity_2m,pressure_msl,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m,visibility",
    hourly: "temperature_2m,wind_speed_10m,visibility,precipitation_probability",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,wind_speed_10m_max,precipitation_probability_max",
  });
  const r = await fetch(`https://api.open-meteo.com/v1/forecast?${q}`);
  if (!r.ok) throw new Error(`Weather service returned ${r.status}`);
  const j = await r.json();
  const c = j.current;
  const now = Date.now();
  // next 24h in 3-hourly steps
  const startIdx = Math.max(0, j.hourly.time.findIndex((t: string) => new Date(t).getTime() >= now - 3600_000));
  const hourly = [];
  for (let i = startIdx; i < startIdx + 24 && i < j.hourly.time.length; i += 3) {
    hourly.push({
      h: j.hourly.time[i].slice(11, 13), temp: Math.round(j.hourly.temperature_2m[i]),
      wind: Math.round(j.hourly.wind_speed_10m[i]), vis: Math.round((j.hourly.visibility[i] ?? 10000) / 100) / 10,
      pop: j.hourly.precipitation_probability[i] ?? 0,
    });
  }
  const alerts: Wx["alerts"] = [];
  const next = j.hourly.time.map((t: string, i: number) => ({
    t, wind: j.hourly.wind_speed_10m[i], vis: (j.hourly.visibility[i] ?? 10000) / 1000, pop: j.hourly.precipitation_probability[i] ?? 0,
  })).slice(startIdx, startIdx + 12);
  const peakWind = Math.max(...next.map((n: { wind: number }) => n.wind));
  const minVis = Math.min(...next.map((n: { vis: number }) => n.vis));
  if ([95, 96, 99].includes(c.weather_code) || j.daily.weather_code[0] >= 95)
    alerts.push({ type: "Thunderstorm", detail: "Thunderstorm in current/forecast conditions today", sev: "High" });
  if (minVis < 1) alerts.push({ type: "Very low visibility", detail: `Visibility drops to ${minVis.toFixed(1)} km in the next 12h (LVP likely)`, sev: "High" });
  else if (minVis < 5) alerts.push({ type: "Reduced visibility", detail: `Visibility drops to ${minVis.toFixed(1)} km in the next 12h`, sev: "Med" });
  if (Math.max(peakWind, c.wind_gusts_10m) >= 50) alerts.push({ type: "Strong wind", detail: `Winds/gusts up to ${Math.round(Math.max(peakWind, c.wind_gusts_10m))} km/h`, sev: "High" });
  else if (Math.max(peakWind, c.wind_gusts_10m) >= 30) alerts.push({ type: "Crosswind watch", detail: `Winds/gusts up to ${Math.round(Math.max(peakWind, c.wind_gusts_10m))} km/h`, sev: "Med" });

  return {
    cur: { temp: Math.round(c.temperature_2m), feels: Math.round(c.apparent_temperature), code: c.weather_code, wind: Math.round(c.wind_speed_10m),
      dir: c.wind_direction_10m, gust: Math.round(c.wind_gusts_10m), hum: c.relative_humidity_2m, pres: Math.round(c.pressure_msl),
      vis: Math.round((c.visibility ?? 10000) / 100) / 10 },
    hourly,
    daily: j.daily.time.map((t: string, i: number) => {
      const code = j.daily.weather_code[i], wind = Math.round(j.daily.wind_speed_10m_max[i]);
      return { d: new Date(t).toLocaleDateString("en-IN", { weekday: "short" }), hi: Math.round(j.daily.temperature_2m_max[i]),
        lo: Math.round(j.daily.temperature_2m_min[i]), code, wind, pop: j.daily.precipitation_probability_max[i] ?? 0,
        risk: code >= 95 || wind >= 50 ? "High" : code >= 61 || wind >= 30 || code === 45 ? "Med" : "Low" };
    }),
    alerts, fetchedAt: now,
  };
}

export function WeatherMonitor() {
  const { code: airportCode } = useAirport();
  const [code, setCode] = useState<Code>((airportCode in AIRPORTS ? airportCode : "DEL") as Code);
  useEffect(() => { if (airportCode in AIRPORTS) setCode(airportCode as Code); }, [airportCode]);
  const [clock, setClock] = useState(new Date().toLocaleTimeString());
  useEffect(() => { const t = setInterval(() => setClock(new Date().toLocaleTimeString()), 1000); return () => clearInterval(t); }, []);

  const q = useQuery({ queryKey: ["weather", code], queryFn: () => fetchWx(code), refetchInterval: 10 * 60_000, staleTime: 5 * 60_000, retry: 1 });
  const wx = q.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Weather Monitor</h1>
          <p className="text-slate-400 text-sm mt-0.5">{AIRPORTS[code].name} — live data from Open-Meteo</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-navy-800 border border-navy-600 rounded-lg p-0.5">
            {(Object.keys(AIRPORTS) as Code[]).map(c => (
              <button key={c} onClick={() => setCode(c)}
                className={`px-3 py-1.5 text-sm rounded-md ${c === code ? "bg-sky-500/20 text-sky-300" : "text-slate-400 hover:text-white"}`}>{c}</button>
            ))}
          </div>
          <div className="text-right">
            <div className="text-lg font-mono text-sky-300">{clock}</div>
            <button onClick={() => q.refetch()} className="text-xs text-slate-500 hover:text-sky-300 inline-flex items-center gap-1">
              <RefreshCw className={`w-3 h-3 ${q.isFetching ? "animate-spin" : ""}`} />
              {wx ? `Updated ${new Date(wx.fetchedAt).toLocaleTimeString()}` : "Loading…"}
            </button>
          </div>
        </div>
      </div>

      {q.isError && !wx && (
        <div className="bg-navy-800 border border-red-500/30 rounded-2xl p-8 text-center">
          <CloudOff className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <div className="text-white font-semibold">Couldn’t load weather</div>
          <div className="text-sm text-slate-400 mt-1">{(q.error as Error).message}</div>
          <button onClick={() => q.refetch()} className="mt-4 px-4 py-2 bg-sky-500/20 text-sky-300 rounded-lg text-sm">Retry</button>
        </div>
      )}

      {q.isLoading && <div className="bg-navy-800 rounded-2xl h-48 animate-pulse border border-navy-600" />}

      {wx && (
        <>
          {q.isError && <div className="text-xs text-yellow-400">Showing last data; refresh failed.</div>}
          <div className="bg-gradient-to-br from-sky-900/40 to-navy-800 rounded-2xl p-6 border border-sky-500/20">
            <div className="grid grid-cols-2 xl:grid-cols-6 gap-6">
              <div className="col-span-2">
                <div className="text-6xl font-bold font-mono text-white mb-1">{wx.cur.temp}°C</div>
                <div className="text-slate-300 text-lg">{wmo(wx.cur.code)[1]} {wmo(wx.cur.code)[0]}</div>
                <div className="text-slate-400 text-sm mt-1">Feels like {wx.cur.feels}°C</div>
              </div>
              {[
                { label: "Wind", value: `${wx.cur.wind} km/h`, sub: `${compass(wx.cur.dir)} · gusts ${wx.cur.gust}`, icon: <Wind className="w-5 h-5" /> },
                { label: "Visibility", value: `${wx.cur.vis} km`, icon: <Eye className="w-5 h-5" /> },
                { label: "Humidity", value: `${wx.cur.hum}%`, icon: <Droplets className="w-5 h-5" /> },
                { label: "Pressure", value: `${wx.cur.pres} hPa`, icon: <Gauge className="w-5 h-5" /> },
              ].map(({ label, value, sub, icon }) => (
                <div key={label} className="bg-navy-800/60 rounded-xl p-4 border border-navy-600">
                  <div className="text-sky-400 mb-2">{icon}</div>
                  <div className="text-xl font-bold font-mono text-white">{value}</div>
                  {sub && <div className="text-xs text-sky-300">{sub}</div>}
                  <div className="text-xs text-slate-400 mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-400" /> Operational Weather Alerts
            </h2>
            {wx.alerts.length === 0 && <div className="p-4 rounded-xl border border-green-500/20 bg-green-500/10 text-green-400 text-sm">No weather alerts for the next 12 hours.</div>}
            {wx.alerts.map((a, i) => (
              <div key={i} className={`flex items-center justify-between p-4 rounded-xl border ${RISK_STYLE[a.sev]}`}>
                <div><div className="font-semibold text-sm">{a.type}</div><div className="text-xs opacity-70">{a.detail}</div></div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${RISK_STYLE[a.sev]}`}>{a.sev.toUpperCase()}</span>
              </div>
            ))}
            <div className="text-[11px] text-slate-500">Derived from forecast thresholds; not an official METAR/SIGMET.</div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <div className="bg-navy-800 rounded-2xl p-5 border border-navy-600">
              <h2 className="font-semibold text-white mb-4">Temperature — next 24h</h2>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={wx.hourly} margin={{ left: -20 }}>
                  <defs><linearGradient id="tg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} /><stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient></defs>
                  <XAxis dataKey="h" tick={{ fill: "#475569", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#475569", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}°`} />
                  <Tooltip contentStyle={TOOLTIP} />
                  <Area type="monotone" dataKey="temp" stroke="#f59e0b" fill="url(#tg)" strokeWidth={2} name="°C" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-navy-800 rounded-2xl p-5 border border-navy-600">
              <h2 className="font-semibold text-white mb-4">Wind (km/h) & Visibility (km)</h2>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={wx.hourly} margin={{ left: -20 }}>
                  <XAxis dataKey="h" tick={{ fill: "#475569", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#475569", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={TOOLTIP} />
                  <Line type="monotone" dataKey="wind" stroke="#38bdf8" strokeWidth={2} dot={false} name="Wind km/h" />
                  <Line type="monotone" dataKey="vis" stroke="#2dd4bf" strokeWidth={2} dot={false} name="Visibility km" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-navy-800 rounded-2xl border border-navy-600 overflow-hidden">
            <div className="p-5 border-b border-navy-600"><h2 className="font-semibold text-white">7-Day Forecast</h2></div>
            <div className="grid grid-cols-4 sm:grid-cols-7">
              {wx.daily.map((d, i) => (
                <div key={i} className={`p-4 text-center border-r border-b sm:border-b-0 border-navy-600 ${i === 0 ? "bg-sky-500/5" : ""}`}>
                  <div className="text-xs text-slate-500 mb-2">{i === 0 ? "Today" : d.d}</div>
                  <div className="text-lg mb-1" title={wmo(d.code)[0]}>{wmo(d.code)[1]}</div>
                  <div className="text-sm font-bold text-white">{d.hi}°</div>
                  <div className="text-xs text-slate-500">{d.lo}°</div>
                  <div className="text-[11px] text-sky-300 mt-1">{d.pop}% rain</div>
                  <div className="mt-2"><span className={`text-xs px-1.5 py-0.5 rounded-full border ${RISK_STYLE[d.risk]}`}>{d.risk}</span></div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
