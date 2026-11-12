import { useEffect, useMemo, useState } from "react";
import { useBoard } from "../../hooks/useBoard";
import { useAuthStore } from "../../store/authStore";
import { useAppStore } from "../../store/appStore";
import { useAirport } from "../../hooks/useAirport";
import { useCollection } from "../../hooks/useCollection";
import { api } from "../../api/client";
import { API_ENABLED } from "../../config";
import { delayMinutes } from "../../lib/opsEngine";
import { Card, PageHead, Stat, Empty } from "../../components/ui/PageHead";

const badge = (s: string) => s === "Delayed" ? "text-yellow-300 border-yellow-500/30" : s === "Cancelled" ? "text-red-300 border-red-500/30" : s === "Boarding" ? "text-teal-300 border-teal-500/30" : "text-sky-300 border-sky-500/30";
const COORDS: Record<string, [number, number]> = { DEL: [28.5562, 77.1], BOM: [19.0896, 72.8656], BLR: [13.1986, 77.7066] };

/** Airline operations: the airline's own flights (the server already limits the list to its airline). */
export function AirlinePortal() {
  const { flights, live } = useBoard(); const user = useAuthStore(s => s.user); const ap = useAirport();
  const m = useMemo(() => { const act = flights.filter(f => f.status !== "Cancelled"); const late = act.filter(f => delayMinutes(f) > 15);
    return { pax: flights.reduce((s, f) => s + f.pax, 0), late: late.length, onTime: act.length ? Math.round(100 * (act.length - late.length) / act.length) : null, issues: flights.filter(f => f.issue || f.status === "Cancelled") }; }, [flights]);
  if (!flights.length) return <Empty>No flights for your airline at {ap.name} yet. Sync your schedule with your partner API key.</Empty>;
  return (
    <div className="space-y-6">
      <PageHead title={`${user?.name ?? "Airline"} operations`} sub={`${ap.name} · ${live ? "live" : "demo"} flight data`} />
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4"><Stat label="Flights today" value={flights.length} /><Stat label="Passengers" value={m.pax.toLocaleString("en-IN")} />
        <Stat label="On-time" value={m.onTime === null ? "—" : `${m.onTime}%`} tone="text-green-400" /><Stat label="Issues" value={m.issues.length} tone={m.issues.length ? "text-yellow-400" : "text-green-400"} /></div>
      <Card className="overflow-x-auto"><table className="w-full text-sm min-w-[620px]"><thead><tr className="text-left text-xs text-slate-400 border-b border-navy-600"><th className="p-2">Flight</th><th className="p-2">Route</th><th className="p-2">Dep</th><th className="p-2">Gate</th><th className="p-2">Aircraft</th><th className="p-2">Pax</th><th className="p-2">Status</th><th className="p-2">Issue</th></tr></thead>
        <tbody>{flights.map(f => <tr key={f.id} className="border-b border-navy-700 text-slate-200"><td className="p-2 font-mono text-white">{f.flight}</td><td className="p-2">{f.from}→{f.to}</td><td className="p-2">{f.dep}</td><td className="p-2">{f.gate}</td><td className="p-2">{f.aircraft}</td><td className="p-2">{f.pax}</td>
          <td className="p-2"><span className={`text-xs px-2 py-0.5 rounded-full border ${badge(f.status)}`}>{f.status}</span></td><td className="p-2 text-xs text-slate-400">{f.issue ?? ""}</td></tr>)}</tbody></table></Card>
    </div>
  );
}

/** Flight-crew briefing: next departures for the airline plus live weather at the airport. */
export function PilotDashboard() {
  const { flights } = useBoard(); const ap = useAirport(); const [wx, setWx] = useState("Loading weather…");
  useEffect(() => { const [la, lo] = COORDS[ap.code] ?? COORDS.DEL; const ac = new AbortController(); const t = setTimeout(() => ac.abort(), 6000);
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${la}&longitude=${lo}&current=temperature_2m,wind_speed_10m,visibility,weather_code`, { signal: ac.signal }).then(r => r.json())
      .then(j => setWx(`${j.current.temperature_2m}°C · wind ${j.current.wind_speed_10m} km/h · visibility ${Math.round((j.current.visibility ?? 0) / 100) / 10} km`)).catch(() => setWx("Weather unavailable")).finally(() => clearTimeout(t)); return () => { ac.abort(); clearTimeout(t); }; }, [ap.code]);
  const up = flights.filter(f => f.status !== "Departed" && f.status !== "Landed" && f.status !== "Cancelled").sort((a, b) => a.dep.localeCompare(b.dep));
  if (!up.length) return <Empty>No upcoming departures for your airline.</Empty>;
  const n = up[0];
  return (
    <div className="space-y-6">
      <PageHead title="Crew briefing" sub={`${ap.name} · ${wx}`} />
      <Card><div className="text-xs text-slate-400">Next departure</div><div className="text-3xl font-bold font-mono text-white">{n.flight} <span className="text-lg text-slate-300">{n.from}→{n.to}</span></div>
        <div className="text-sm text-slate-300 mt-1">Dep {n.dep} · gate {n.gate} ({n.terminal}) · {n.aircraft} · {n.pax} passengers · {n.status}{n.issue ? ` · ${n.issue}` : ""}</div></Card>
      <Card className="overflow-x-auto"><table className="w-full text-sm min-w-[480px]"><tbody>{up.map(f => <tr key={f.id} className="border-b border-navy-700 text-slate-200"><td className="p-2 font-mono">{f.flight}</td><td className="p-2">{f.from}→{f.to}</td><td className="p-2">{f.dep}</td><td className="p-2">Gate {f.gate}</td><td className="p-2"><span className={`text-xs px-2 py-0.5 rounded-full border ${badge(f.status)}`}>{f.status}</span></td></tr>)}</tbody></table></Card>
    </div>
  );
}

/** Concession owner: own bids, spend and the biggest audiences to bid on. */
export function RetailerDashboard() {
  const bids = useCollection<{ slot: string; offer: string; amount: number; status: string }>("bids"); const { flights } = useBoard(); const go = useAppStore(s => s.setActivePage);
  const mine = bids.items; const acc = mine.filter(b => b.status === "Accepted");
  const top = [...flights].filter(f => f.status === "Scheduled" || f.status === "Boarding").sort((a, b) => b.pax - a.pax).slice(0, 5);
  return (
    <div className="space-y-6">
      <PageHead title="My shop" sub="Your marketplace bids and the audiences available today." />
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4"><Stat label="Bids placed" value={mine.length} /><Stat label="Accepted" value={acc.length} tone="text-green-400" />
        <Stat label="Pending" value={mine.filter(b => b.status === "Pending").length} tone="text-yellow-400" /><Stat label="Spend on accepted" value={"₹" + acc.reduce((s, b) => s + (Number(b.amount) || 0), 0).toLocaleString("en-IN")} /></div>
      <Card><div className="text-sm text-slate-300 mb-3">Biggest audiences today</div><div className="space-y-2">{top.map(f => <div key={f.id} className="flex justify-between text-sm text-slate-200"><span className="font-mono">{f.flight} {f.from}→{f.to}</span><span className="text-slate-400">{f.pax} passengers · dep {f.dep}</span></div>)}</div>
        <button onClick={() => go("bids")} className="mt-4 px-4 py-2 rounded-xl bg-sky-500 text-white text-sm font-semibold">Place a bid</button></Card>
    </div>
  );
}

/** Passenger self-service: look up a flight, jump to the journey plan, send feedback. */
export function PassengerPortal() {
  const { flights } = useBoard(); const go = useAppStore(s => s.setActivePage); const live = API_ENABLED && useAuthStore(s => s.source) === "backend";
  const [q, setQ] = useState(""); const [rating, setRating] = useState(5); const [comment, setComment] = useState(""); const [sent, setSent] = useState(""); const [err, setErr] = useState("");
  const hit = q.trim() ? flights.filter(f => f.flight.toLowerCase().replace("-", "").includes(q.toLowerCase().replace("-", "").replace(/\s/g, ""))).slice(0, 5) : [];
  const send = async (e: React.FormEvent) => { e.preventDefault(); setErr(""); setSent("");
    if (!comment.trim()) return setErr("Please write a comment.");
    try { if (live) await api.post("/api/records/feedback", { category: "Other", rating, comment: comment.trim(), status: "New", name: "" }); setSent("Thank you for your feedback."); setComment(""); } catch (x: any) { setErr(x?.response?.data?.error ?? "Could not send feedback"); } };
  return (
    <div className="space-y-6 max-w-2xl">
      <PageHead title="Passenger services" sub="Check your flight, plan your journey, tell us how we did." />
      <Card><input value={q} onChange={e => setQ(e.target.value)} placeholder="Flight number, e.g. AI-101" aria-label="Flight number" className="w-full bg-navy-900 border border-navy-600 rounded-xl px-4 py-3 text-white text-sm" />
        <div className="mt-3 space-y-2">{hit.map(f => <div key={f.id} className="p-3 bg-navy-900 rounded-xl border border-navy-600 text-sm text-slate-200"><div className="flex justify-between"><span className="font-mono text-white">{f.flight} {f.from}→{f.to}</span><span className={`text-xs px-2 py-0.5 rounded-full border ${badge(f.status)}`}>{f.status}</span></div>
          <div className="text-xs text-slate-400 mt-1">Departs {f.dep} · gate {f.gate} · {f.terminal}{f.issue ? ` · ${f.issue}` : ""}</div></div>)}{q && hit.length === 0 && <div className="text-sm text-slate-400">No flight matches that number today.</div>}</div>
        <div className="flex gap-2 mt-4"><button onClick={() => go("journey")} className="px-4 py-2 rounded-xl bg-sky-500 text-white text-sm font-semibold">Plan my journey</button><button onClick={() => go("lostfound")} className="px-4 py-2 rounded-xl bg-navy-700 border border-navy-600 text-slate-200 text-sm">Lost &amp; found</button></div></Card>
      <Card><form onSubmit={send} className="space-y-3"><div className="text-white font-semibold text-sm">Rate your experience</div>
        <div className="flex gap-2">{[1, 2, 3, 4, 5].map(n => <button type="button" key={n} onClick={() => setRating(n)} aria-label={`${n} stars`} className={`w-10 h-10 rounded-lg border ${rating >= n ? "bg-yellow-500/20 border-yellow-500 text-yellow-300" : "bg-navy-900 border-navy-600 text-slate-500"}`}>★</button>)}</div>
        <textarea value={comment} onChange={e => setComment(e.target.value)} maxLength={1000} rows={3} placeholder="Your comment" aria-label="Comment" className="w-full bg-navy-900 border border-navy-600 rounded-xl px-3 py-2 text-white text-sm" />
        {err && <div className="text-xs text-red-400">{err}</div>}{sent && <div className="text-xs text-green-400">{sent}</div>}<button className="px-4 py-2 rounded-xl bg-sky-500 text-white text-sm font-semibold">Send feedback</button></form></Card>
    </div>
  );
}
