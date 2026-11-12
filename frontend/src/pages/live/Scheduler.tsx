import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useBoard } from "../../hooks/useBoard";
import { useAirport } from "../../hooks/useAirport";
import { api } from "../../api/client";
import { API_ENABLED } from "../../config";
import { useAuthStore } from "../../store/authStore";
import { Card, PageHead, Empty } from "../../components/ui/PageHead";

const today = () => new Date().toISOString().slice(0, 10);

/** Flight schedule by date, with a real "add flight" form (saved to the airport's flight table). */
export function FlightScheduler() {
  const { flights, live, refetch } = useBoard(); const ap = useAirport(); const sourceLive = API_ENABLED && useAuthStore(s => s.source) === "backend";
  const [date, setDate] = useState(today());
  const [f, setF] = useState({ flight_number: "", origin: ap.code, destination: "", dep_time: "09:00", gate: "", terminal: "T3", aircraft: "A320neo", passengers: "150" });
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null); const [busy, setBusy] = useState(false);
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => new Date(Date.now() + i * 864e5).toISOString().slice(0, 10)), []);
  const rows = flights.filter(x => ((x as any).date || today()) === date).sort((a, b) => a.dep.localeCompare(b.dep));

  const add = async (e: React.FormEvent) => {
    e.preventDefault(); setMsg(null);
    if (!sourceLive) return setMsg({ ok: false, t: "Adding flights needs the live backend." });
    setBusy(true);
    try {
      await api.post("/api/flights", { flight_number: f.flight_number.toUpperCase().trim(), origin: f.origin, destination: f.destination, departure_time: `${date} ${f.dep_time}`, gate: f.gate, terminal: f.terminal,
        aircraft: f.aircraft, airline_code: f.flight_number.split("-")[0].toUpperCase(), airline: f.flight_number.split("-")[0].toUpperCase(), passengers: Number(f.passengers) || 0 });
      setMsg({ ok: true, t: `${f.flight_number.toUpperCase()} scheduled for ${date}.` }); setF({ ...f, flight_number: "", destination: "" }); refetch();
    } catch (x: any) { setMsg({ ok: false, t: x?.response?.data?.error ?? "Could not schedule the flight" }); } finally { setBusy(false); }
  };
  const inp = "bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-white text-sm min-w-0 w-full";
  return (
    <div className="space-y-6">
      <PageHead title="Flight Scheduler" sub={`${ap.name} · ${live ? "live schedule" : "demo schedule"}`} />
      <div className="flex gap-2 flex-wrap">{days.map(d => <button key={d} onClick={() => setDate(d)} className={`px-3 py-2 rounded-xl text-xs border ${date === d ? "bg-sky-500 text-white border-sky-500" : "bg-navy-800 text-slate-300 border-navy-600"}`}>{new Date(d + "T00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}</button>)}</div>
      <Card><form onSubmit={add} className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
        <input className={inp} placeholder="Flight AI-101" value={f.flight_number} onChange={e => setF({ ...f, flight_number: e.target.value })} aria-label="Flight number" required />
        <input className={inp} placeholder="From" value={f.origin} onChange={e => setF({ ...f, origin: e.target.value })} aria-label="Origin" required maxLength={4} />
        <input className={inp} placeholder="To" value={f.destination} onChange={e => setF({ ...f, destination: e.target.value })} aria-label="Destination" required maxLength={4} />
        <input className={inp} type="time" value={f.dep_time} onChange={e => setF({ ...f, dep_time: e.target.value })} aria-label="Departure time" required />
        <input className={inp} placeholder="Gate" value={f.gate} onChange={e => setF({ ...f, gate: e.target.value })} aria-label="Gate" maxLength={10} />
        <select className={inp} value={f.terminal} onChange={e => setF({ ...f, terminal: e.target.value })} aria-label="Terminal">{["T1", "T2", "T3"].map(t => <option key={t}>{t}</option>)}</select>
        <input className={inp} placeholder="Aircraft" value={f.aircraft} onChange={e => setF({ ...f, aircraft: e.target.value })} aria-label="Aircraft" />
        <button disabled={busy} className="flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-sky-500 disabled:opacity-50 text-white text-sm font-semibold"><Plus className="w-4 h-4" />Add</button>
      </form>{msg && <div className={`mt-3 text-xs ${msg.ok ? "text-green-400" : "text-red-400"}`}>{msg.t}</div>}</Card>
      {rows.length === 0 ? <Empty>No flights scheduled for this day.</Empty> :
        <Card className="overflow-x-auto"><table className="w-full text-sm min-w-[560px]"><thead><tr className="text-left text-xs text-slate-400 border-b border-navy-600"><th className="p-2">Dep</th><th className="p-2">Flight</th><th className="p-2">Route</th><th className="p-2">Gate</th><th className="p-2">Aircraft</th><th className="p-2">Status</th></tr></thead>
          <tbody>{rows.map(x => <tr key={x.id} className="border-b border-navy-700 text-slate-200"><td className="p-2 font-mono">{x.dep}</td><td className="p-2 font-mono text-white">{x.flight}</td><td className="p-2">{x.from}→{x.to}</td><td className="p-2">{x.gate}</td><td className="p-2">{x.aircraft}</td><td className="p-2">{x.status}</td></tr>)}</tbody></table></Card>}
    </div>
  );
}
