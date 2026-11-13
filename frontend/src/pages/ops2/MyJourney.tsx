import { useEffect, useMemo, useState } from "react";
import { Share2, Download } from "lucide-react";
import { useBoard } from "../../hooks/useBoard";
import { crowdAt } from "../../lib/opsEngine2";
import { fmt, toMin } from "../../lib/opsEngine";
import { copyText } from "../../lib/clipboard";
import { Card, PageHead } from "../../components/ui/PageHead";

export function MyJourney() {
  const fleet = useBoard().flights;
  const flights = fleet.filter(f => f.status === "Scheduled" || f.status === "Boarding" || f.status === "Delayed");
  const [id, setId] = useState<string | number>(flights[0]?.id ?? 0);
  const [tick, setTick] = useState(0); const [msg, setMsg] = useState("");
  const [bip, setBip] = useState<any>(null);
  useEffect(() => { const t = setInterval(() => setTick(x => x + 1), 30000); return () => clearInterval(t); }, []);
  useEffect(() => { const h = (e: Event) => { e.preventDefault(); setBip(e); }; window.addEventListener("beforeinstallprompt", h); return () => window.removeEventListener("beforeinstallprompt", h); }, []);
  const f = flights.find(x => String(x.id) === String(id)) ?? flights[0];
  const steps = useMemo(() => {
    if (!f) return [];
    const dep = toMin(f.dep), z = crowdAt(fleet, dep - 120).filter(q => q.terminal === f.terminal);
    const secWait = Math.max(5, z.find(q => q.kind === "Security")?.wait ?? 10), ciWait = Math.max(5, z.find(q => q.kind === "Check-in")?.wait ?? 8);
    const walk = 5 + Math.round((f.gate.charCodeAt(0) - 65) * 2);
    const board = dep - 40, gate = board - 10, sec = gate - walk - secWait, bag = sec - 10, arrive = bag - ciWait - 5;
    return [["Reach the terminal", arrive, f.terminal], ["Check-in / bag drop", arrive + 5, `about ${ciWait} min queue`], ["Security", sec, `about ${secWait} min queue`],
      ["Walk to gate " + f.gate, gate - walk, `${walk} min walk`], ["Be at the gate", gate, ""], ["Boarding starts", board, ""], ["Departure", dep, f.flight]] as [string, number, string][];
  }, [f, fleet]);
  if (!f) return <div className="space-y-6 max-w-2xl"><PageHead title="My Journey" sub="Your door-to-gate plan." /><Card><div className="text-sm text-slate-400">No upcoming departures right now. Check back when the next flights are scheduled.</div></Card></div>;
  void tick; const d = new Date(); const now = d.getHours() * 60 + d.getMinutes();
  const board = toMin(f.dep) - 40, left = board - now;
  const summary = `My trip: ${f.flight} ${f.from}→${f.to}, departs ${f.dep} from gate ${f.gate} (${f.terminal}). Be at security by ${fmt(steps[2][1])}.`;
  const share = async () => { try { if (navigator.share) await navigator.share({ text: summary }); else { await copyText(summary); setMsg("Copied to clipboard."); } } catch { setMsg(""); } };
  return (
    <div className="space-y-6 max-w-2xl">
      <PageHead title="My Journey" sub="Your door-to-gate plan: when to arrive, queue times, walking time and boarding countdown."
        note="Times use the airport's expected queues for your terminal and a fixed walking estimate. Always follow the live gate display." />
      <select value={f.id} onChange={e => setId(e.target.value)} className="w-full bg-navy-800 border border-navy-600 rounded-lg px-3 py-2 text-white text-sm" aria-label="Choose your flight">
        {flights.map(x => <option key={x.id} value={x.id}>{x.flight} · {x.from}→{x.to} · {x.dep}</option>)}</select>
      <Card><div className="text-sm text-slate-400">Boarding starts at {fmt(board)}</div>
        <div className="text-3xl font-bold text-white">{left > 0 ? `${Math.floor(left / 60)}h ${left % 60}m left` : left > -40 ? "Boarding now" : "Boarding closed"}</div></Card>
      <Card><ol className="space-y-4">{steps.map(([n, t, sub], i) => <li key={n} className="flex gap-3"><div className="w-14 shrink-0 font-mono text-sky-300">{fmt(t)}</div><div className="min-w-0 border-l border-navy-600 pl-3"><div className="text-white text-sm">{i + 1}. {n}</div>{sub && <div className="text-xs text-slate-400">{sub}</div>}</div></li>)}</ol></Card>
      <div className="flex flex-wrap gap-3 items-center">
        <button onClick={() => void share()} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500 text-white text-sm font-semibold"><Share2 className="w-4 h-4" />Share plan</button>
        {bip && <button onClick={() => { void bip.prompt(); setBip(null); }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-navy-700 border border-navy-600 text-slate-200 text-sm"><Download className="w-4 h-4" />Install app</button>}
        {msg && <span className="text-xs text-green-400">{msg}</span>}</div>
    </div>
  );
}
