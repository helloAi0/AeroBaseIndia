import { useEffect, useMemo, useState } from "react";
import { CloudFog, CloudLightning, Sun, CloudRain, Wind, Snowflake, Check, Megaphone, ThermometerSun, Eye, Droplets, CircleCheck, Plane, XCircle, History } from "lucide-react";
import { useCollection } from "../../hooks/useCollection";
import { useAirport } from "../../hooks/useAirport";
import { useBoard } from "../../hooks/useBoard";
import { useAuthStore } from "../../store/authStore";
import { AIRPORT_COORDS } from "../../data/airportCoords";
import { speak, voiceSupported } from "../../lib/voice";
import { RULES, describeCode, parseWx, triggered, upcoming, type PlaybookId, type Wx } from "../../lib/weatherOps";
import { toMin } from "../../lib/opsEngine";
import { Card, PageHead } from "../../components/ui/PageHead";

type Step = { team: string; text: string };
interface Book { id: PlaybookId; label: string; icon: typeof Sun; tone: string; en: string; hi: string; steps: Step[] }
const BOOK: Book[] = [
  { id: "fog", label: "Dense fog", icon: CloudFog, tone: "#94a3b8", en: "Due to low visibility, some departures may be delayed. Please check your flight status and stay near your gate.", hi: "कम दृश्यता के कारण कुछ उड़ानों में देरी हो सकती है। कृपया अपनी उड़ान की स्थिति देखें और गेट के पास रहें।",
    steps: [{ team: "ATC / Airside", text: "Switch to low-visibility procedures and brief ATC" }, { team: "Airside", text: "Reduce runway movement rate; keep follow-me vehicles ready" }, { team: "Airlines", text: "Warn airlines to expect 30–90 min delays" }, { team: "Terminal", text: "Open extra rebooking and information desks" }, { team: "Communications", text: "Publish delay announcement and update flight board" }] },
  { id: "storm", label: "Thunderstorm", icon: CloudLightning, tone: "#a78bfa", en: "A thunderstorm is affecting the airport. Ground operations are paused for safety. Please remain inside the terminal.", hi: "हवाई अड्डे पर तूफ़ान है। सुरक्षा के लिए ज़मीनी संचालन रोका गया है। कृपया टर्मिनल के अंदर रहें।",
    steps: [{ team: "Ground ops", text: "Stop ramp work when lightning is within 8 km" }, { team: "Ground ops", text: "Hold boarding at remote stands" }, { team: "Terminal", text: "Move passengers away from airside windows" }, { team: "Terminal", text: "Pre-position water and seating at crowded gates" }, { team: "Communications", text: "Publish hold announcement; update delays" }] },
  { id: "rain", label: "Heavy rain", icon: CloudRain, tone: "#38bdf8", en: "Heavy rain is expected. Allow extra time to reach the terminal. Some flights may be delayed.", hi: "भारी बारिश की संभावना है। टर्मिनल तक पहुँचने के लिए अतिरिक्त समय रखें। कुछ उड़ानों में देरी हो सकती है।",
    steps: [{ team: "Ground ops", text: "Slow baggage loading and cover trolleys" }, { team: "Airside", text: "Check runway drainage and braking-action reports" }, { team: "Terminal", text: "Add kerbside umbrellas and marshals" }, { team: "Airlines", text: "Warn airlines of baggage delays" }, { team: "Communications", text: "Publish advisory" }] },
  { id: "wind", label: "Strong winds", icon: Wind, tone: "#2dd4bf", en: "Strong winds are affecting the airport. Boarding bridges may be paused and some flights delayed. Please follow staff instructions.", hi: "तेज़ हवाओं के कारण कुछ उड़ानों में देरी हो सकती है। कृपया स्टाफ़ के निर्देशों का पालन करें।",
    steps: [{ team: "Airside", text: "Check crosswind limits with ATC and airlines" }, { team: "Ground ops", text: "Secure loose equipment, GSE and baggage carts" }, { team: "Terminal", text: "Pause boarding-bridge operation above wind limits" }, { team: "Airlines", text: "Brief airlines on possible holds and diversions" }, { team: "Communications", text: "Publish advisory" }] },
  { id: "heat", label: "Heatwave", icon: Sun, tone: "#fbbf24", en: "High temperatures are expected today. Please stay hydrated. Free drinking water is available at all gates.", hi: "आज अधिक तापमान की संभावना है। कृपया पर्याप्त पानी पिएँ। सभी गेट पर पीने का पानी उपलब्ध है।",
    steps: [{ team: "Terminal", text: "Add water points at gates and kerbside" }, { team: "Terminal", text: "Check terminal cooling and queue shading" }, { team: "Ground ops", text: "Increase ramp-crew rest breaks" }, { team: "Airlines", text: "Watch aircraft performance limits for departures" }, { team: "Communications", text: "Publish advisory" }] },
  { id: "cold", label: "Cold / snow", icon: Snowflake, tone: "#e0f2fe", en: "Cold weather and possible snow are affecting the airport. De-icing may delay departures. Please check your flight status.", hi: "ठंड और बर्फ़बारी के कारण उड़ानों में देरी हो सकती है। कृपया अपनी उड़ान की स्थिति देखें।",
    steps: [{ team: "Airside", text: "Start runway and apron snow clearing; check friction reports" }, { team: "Airlines", text: "Coordinate de-icing slots with airlines" }, { team: "Terminal", text: "Open heating and blanket points for waiting passengers" }, { team: "Ground ops", text: "Protect ground-support equipment from freezing" }, { team: "Communications", text: "Publish delay advisory" }] },
];
const ICON_WX = (c: number) => (c >= 95 ? CloudLightning : c >= 61 && c < 70 ? CloudRain : c === 45 || c === 48 ? CloudFog : c >= 71 && c <= 77 ? Snowflake : Sun);

interface Run { id?: string; type: "playbook"; playbook: PlaybookId; label: string; status: "active" | "closed"; steps_done: number[]; started_by: string; started_at: string; closed_at?: string; message: string }

export function Playbooks() {
  const { code, name } = useAirport();
  const { flights } = useBoard();
  const user = useAuthStore(s => s.user);
  const canAct = user?.role === "airport_admin" || user?.role === "superadmin" || user?.role === "staff";
  const actions = useCollection<Run & { id: string }>("actions", []);
  const ann = useCollection<any>("announcements", []);
  const [wx, setWx] = useState<Wx | null>(null); const [wxErr, setWxErr] = useState(false);
  const [sel, setSel] = useState<PlaybookId | null>(null);
  const [lang, setLang] = useState<"en" | "hi">("en");
  const [msg, setMsg] = useState(""); const [toast, setToast] = useState("");

  useEffect(() => {
    const [la, lo] = AIRPORT_COORDS[code] ?? AIRPORT_COORDS.DEL; const ac = new AbortController(); const t = setTimeout(() => ac.abort(), 8000); setWx(null); setWxErr(false);
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${la}&longitude=${lo}&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,wind_gusts_10m,visibility&hourly=temperature_2m,precipitation_probability,weather_code,wind_gusts_10m,visibility&forecast_hours=13&timezone=auto`, { signal: ac.signal })
      .then(r => r.json()).then(j => setWx(parseWx(j))).catch(() => setWxErr(true)).finally(() => clearTimeout(t));
    return () => { ac.abort(); clearTimeout(t); };
  }, [code]);

  const runs = useMemo(() => actions.items.filter(a => a.type === "playbook").sort((a, b) => (b.started_at ?? "").localeCompare(a.started_at ?? "")), [actions.items]);
  const active = runs.find(r => r.status === "active");
  const suggested = wx ? triggered(wx) : [];
  const soon = wx ? upcoming(wx).filter(u => !suggested.includes(u.id)) : [];
  const shown = BOOK.find(b => b.id === (active?.playbook ?? sel ?? suggested[0] ?? "rain"))!;
  useEffect(() => { setMsg(lang === "en" ? shown.en : shown.hi); }, [shown.id, lang]); // eslint-disable-line react-hooks/exhaustive-deps

  const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
  const exposed = flights.filter(f => f.status !== "Cancelled" && f.status !== "Departed" && f.status !== "Landed" && (() => { const d = toMin(f.dep) - nowMin; return d >= 0 && d <= 360; })());
  const done = new Set(active?.steps_done ?? []);

  const activate = async () => {
    if (active) return;
    const ok = await actions.add({ type: "playbook", playbook: shown.id, label: shown.label, status: "active", steps_done: [], started_by: user?.name ?? "Staff", started_at: new Date().toISOString(), message: "" } as never);
    if (ok) setToast(`${shown.label} playbook is now active for ${name}. Everyone on shift can see and tick off steps.`);
  };
  const toggle = async (i: number) => { if (!active || !canAct) return; const next = done.has(i) ? [...done].filter(x => x !== i) : [...done, i]; await actions.update(active.id, { steps_done: next }); };
  const publish = async () => {
    if (!active) return;
    await ann.add({ time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), flight: "ALL", type: "Weather", gate: "—", lang: [lang.toUpperCase()], status: "Played", text: msg });
    await actions.update(active.id, { message: msg });
    setToast("Announcement published and added to the announcement log."); if (voiceSupported()) void speak(msg, lang === "hi" ? "hi" : "en");
  };
  const close = async () => { if (active) { await actions.update(active.id, { status: "closed", closed_at: new Date().toISOString() }); setToast("Playbook closed and logged."); } };

  const Ic = shown.icon;
  return (
    <div className="space-y-6">
      <PageHead title="Weather Playbooks" sub={`Live weather for ${name}, the right response plan, and a shared checklist the whole shift can work through.`} />
      {(actions.error || ann.error) && <div className="text-sm text-red-400">{actions.error || ann.error}</div>}
      {toast && <div role="status" className="text-sm text-green-300 flex items-center gap-2"><CircleCheck className="w-4 h-4" />{toast}</div>}

      {/* Live weather */}
      <Card>
        {!wx && !wxErr && <div className="text-sm text-slate-400">Loading live weather for {code}…</div>}
        {wxErr && <div className="text-sm text-yellow-300">Live weather could not be loaded. You can still pick a playbook below.</div>}
        {wx && (<>
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
            <div className="flex items-center gap-3">{(() => { const I = ICON_WX(wx.code); return <I className="w-10 h-10 text-sky-300" />; })()}<div><div className="text-3xl font-bold text-white">{wx.temp}°C</div><div className="text-sm text-slate-400">{describeCode(wx.code)} · feels {wx.feels}°</div></div></div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-2 text-sm">
              <div className="flex items-center gap-2 text-slate-300"><Wind className="w-4 h-4 text-slate-500" />{wx.wind} km/h <span className="text-slate-500">gusts {wx.gust}</span></div>
              <div className="flex items-center gap-2 text-slate-300"><Eye className="w-4 h-4 text-slate-500" />{(wx.visibilityM / 1000).toFixed(1)} km</div>
              <div className="flex items-center gap-2 text-slate-300"><Droplets className="w-4 h-4 text-slate-500" />{wx.humidity}% <span className="text-slate-500">rain {wx.precip} mm</span></div>
              <div className="flex items-center gap-2 text-slate-300"><ThermometerSun className="w-4 h-4 text-slate-500" />{wx.feels}° feels</div>
            </div>
          </div>
          <div className="mt-4 flex items-end gap-1 h-14" aria-label="Next 12 hours">
            {wx.hours.slice(0, 13).map((h, i) => { const I = ICON_WX(h.code); return (<div key={h.t} className="flex-1 flex flex-col items-center text-[10px] text-slate-500"><I className="w-3.5 h-3.5 text-slate-400" /><span className="text-slate-300">{h.temp}°</span><span>{i === 0 ? "now" : h.t.slice(11, 13)}</span></div>); })}
          </div>
          <div className={`mt-4 rounded-xl px-4 py-3 text-sm border ${suggested.length ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-100" : "bg-green-500/10 border-green-500/30 text-green-200"}`}>
            {suggested.length ? <>Conditions now call for: <b>{suggested.map(id => BOOK.find(b => b.id === id)!.label).join(", ")}</b>. <span className="text-yellow-300/80">{RULES[suggested[0]]}.</span></> : "No weather playbook is needed right now."}
            {soon.length > 0 && <div className="mt-1 text-slate-300">Coming up: {soon.map(u => `${BOOK.find(b => b.id === u.id)!.label} around ${u.t.slice(11, 16)}`).join(" · ")}</div>}
          </div>
        </>)}
      </Card>

      {/* Playbook chooser */}
      <div className="flex flex-wrap gap-2">
        {BOOK.map(b => { const I = b.icon, on = shown.id === b.id, rec = suggested.includes(b.id), lock = !!active && active.playbook !== b.id;
          return (<button key={b.id} disabled={!!active} onClick={() => setSel(b.id)} aria-pressed={on}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm border transition disabled:cursor-default ${on ? "bg-sky-500 text-white border-sky-400" : "bg-navy-800 border-navy-600 text-slate-300 hover:text-white"} ${lock ? "opacity-40" : ""}`}>
            <I className="w-4 h-4" />{b.label}{rec && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-400 text-navy-900 font-bold">NOW</span>}</button>); })}
      </div>

      {/* Plan */}
      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-4">
        <Card>
          <div className="flex items-start justify-between gap-3 mb-1">
            <div className="flex items-center gap-3"><Ic className="w-7 h-7" style={{ color: shown.tone }} /><div><div className="text-white font-semibold text-lg">{shown.label} plan</div><div className="text-xs text-slate-400">Suggested when: {RULES[shown.id]}</div></div></div>
            {active && <span className="text-[11px] px-2 py-1 rounded-full bg-green-500/15 text-green-300 border border-green-500/30 whitespace-nowrap">ACTIVE · started by {active.started_by}</span>}
          </div>
          {active && <div className="mt-3"><div className="h-1.5 rounded-full bg-navy-700 overflow-hidden"><div className="h-full bg-green-500 transition-all" style={{ width: `${(done.size / shown.steps.length) * 100}%` }} /></div><div className="text-xs text-slate-400 mt-1">{done.size} of {shown.steps.length} steps done</div></div>}
          <ul className="mt-4 space-y-2">
            {shown.steps.map((s, i) => (
              <li key={i}><label className={`flex items-start gap-3 rounded-xl px-3 py-2.5 border text-sm ${active ? "cursor-pointer" : "cursor-default"} ${done.has(i) ? "bg-green-500/10 border-green-500/30 text-slate-300" : "bg-navy-900 border-navy-600 text-slate-200"}`}>
                <input type="checkbox" className="mt-1 accent-green-500" checked={done.has(i)} disabled={!active || !canAct} onChange={() => void toggle(i)} />
                <span className="flex-1"><span className={done.has(i) ? "line-through" : ""}>{s.text}</span><span className="block text-[11px] text-slate-500 mt-0.5">{s.team}</span></span></label></li>))}
          </ul>
          {!active && <div className="mt-4 flex flex-wrap items-center gap-3"><button onClick={() => void activate()} disabled={!canAct} className="px-4 py-2 rounded-xl bg-sky-500 text-white text-sm font-semibold disabled:opacity-40">Activate this playbook</button><span className="text-xs text-slate-500">{canAct ? "Starts a shared checklist and logs who started it." : "Only airport staff can activate playbooks."}</span></div>}
          {active && canAct && <button onClick={() => void close()} className="mt-4 px-4 py-2 rounded-xl bg-navy-700 border border-navy-500 text-white text-sm flex items-center gap-2"><XCircle className="w-4 h-4" />Close playbook</button>}
        </Card>

        <div className="space-y-4">
          <Card>
            <div className="flex items-center gap-2 text-white font-semibold mb-2"><Plane className="w-4 h-4 text-sky-400" />Flights that could be affected</div>
            <div className="text-3xl font-bold text-white">{exposed.length}</div>
            <div className="text-xs text-slate-400">departures in the next 6 hours{exposed.length ? ` across ${new Set(exposed.map(f => f.airCode)).size} airlines` : ""}</div>
            {exposed.slice(0, 5).map(f => <div key={f.id} className="flex justify-between text-xs text-slate-300 mt-2"><span className="font-mono">{f.flight}</span><span>{f.dep} · {f.to}</span></div>)}
          </Card>
          <Card>
            <div className="flex items-center gap-2 text-white font-semibold mb-2"><Megaphone className="w-4 h-4 text-sky-400" />Passenger announcement</div>
            <div className="flex gap-1 mb-2">{(["en", "hi"] as const).map(l => <button key={l} onClick={() => setLang(l)} className={`px-3 py-1 rounded-lg text-xs ${lang === l ? "bg-sky-500 text-white" : "bg-navy-700 text-slate-300"}`}>{l === "en" ? "English" : "हिन्दी"}</button>)}</div>
            <textarea value={msg} onChange={e => setMsg(e.target.value)} rows={4} className="w-full rounded-xl bg-navy-900 border border-navy-600 p-3 text-sm text-slate-200 outline-none focus:border-sky-500" aria-label="Announcement text" />
            <button onClick={() => void publish()} disabled={!active || !canAct || !msg.trim()} className="mt-2 w-full px-4 py-2 rounded-xl bg-sky-500 text-white text-sm font-semibold disabled:opacity-40">Publish announcement</button>
            {!active && <div className="text-[11px] text-slate-500 mt-1">Activate a playbook first.</div>}
          </Card>
        </div>
      </div>

      {/* History */}
      <Card>
        <div className="flex items-center gap-2 text-white font-semibold mb-3"><History className="w-4 h-4 text-slate-400" />Activation history</div>
        {runs.length === 0 ? <div className="text-sm text-slate-400">No playbooks have been run at {name} yet.</div> : (
          <ul className="divide-y divide-navy-700">{runs.slice(0, 8).map(r => (
            <li key={r.id} className="py-2 flex flex-wrap justify-between gap-2 text-sm"><span className="text-slate-200"><Check className="inline w-3.5 h-3.5 text-green-400 mr-1" />{r.label} <span className="text-slate-500">· {(r.steps_done ?? []).length}/5 steps · by {r.started_by}</span></span>
              <span className="text-xs text-slate-500">{new Date(r.started_at).toLocaleString([], { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}{r.status === "active" ? " · active" : ""}</span></li>))}</ul>)}
      </Card>
    </div>
  );
}
