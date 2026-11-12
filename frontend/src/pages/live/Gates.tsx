import { useMemo, useState } from "react";
import { useBoard } from "../../hooks/useBoard";
import { api } from "../../api/client";
import { gateReview, gateWide } from "../../lib/opsEngine2";
import { fmt, toMin } from "../../lib/opsEngine";
import { Card, PageHead, Stat, Empty } from "../../components/ui/PageHead";

const DAY_MIN = 18 * 60;   // utilisation measured over an 18-hour operating day

export function GatesDashboard() {
  const { flights, live, refetch } = useBoard();
  const [err, setErr] = useState("");
  const gates = useMemo(() => {
    const names = Array.from(new Set(flights.map(f => f.gate).filter(g => g && g !== "—"))).sort();
    const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
    return names.map(g => {
      const fs = flights.filter(f => f.gate === g).sort((a, b) => toMin(a.dep) - toMin(b.dep));
      const busy = fs.reduce((s, f) => s + (f.pax >= 300 ? 90 : 45), 0);
      const nxt = fs.find(f => toMin(f.dep) >= nowMin - 20 && f.status !== "Departed") ?? fs[fs.length - 1];
      return { g, fs, util: Math.min(100, Math.round(100 * busy / DAY_MIN)), nxt, boarding: fs.some(f => f.status === "Boarding") };
    });
  }, [flights]);
  const issues = useMemo(() => gateReview(flights), [flights]);
  const change = async (f: any, gate: string) => {
    setErr(""); if (!live || !f.backendId) return setErr("Gate changes need the live backend.");
    try { await api.patch(`/flights/${f.backendId}`, { gate }); refetch(); } catch (e: any) { setErr(e?.response?.data?.error ?? "Could not change gate"); }
  };
  if (!gates.length) return <Empty>No gate assignments yet.</Empty>;
  return (
    <div className="space-y-6">
      <PageHead title="Gates" sub="Live gate occupancy from the flight board." note="Utilisation = scheduled turnaround time (45 min narrow-body, 90 min wide-body) over an 18-hour day." />
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4"><Stat label="Gates in use" value={gates.length} /><Stat label="Boarding now" value={gates.filter(x => x.boarding).length} tone="text-teal-400" />
        <Stat label="Avg utilisation" value={`${Math.round(gates.reduce((s, x) => s + x.util, 0) / gates.length)}%`} /><Stat label="Assignment problems" value={issues.length} tone={issues.length ? "text-red-400" : "text-green-400"} /></div>
      {err && <div className="text-sm text-red-400">{err}</div>}
      <Card className="overflow-x-auto"><table className="w-full text-sm min-w-[640px]"><thead><tr className="text-left text-xs text-slate-400 border-b border-navy-600"><th className="p-2">Gate</th><th className="p-2">Type</th><th className="p-2">Next flight</th><th className="p-2">Utilisation</th><th className="p-2">Schedule</th><th className="p-2">Move next flight to</th></tr></thead>
        <tbody>{gates.map(x => <tr key={x.g} className="border-b border-navy-700 text-slate-200 align-top">
          <td className="p-2 font-mono text-white">{x.g}{x.boarding && <span className="ml-2 text-[10px] text-teal-300">BOARDING</span>}</td><td className="p-2 text-xs text-slate-400">{gateWide(x.g) ? "Wide-body" : "Narrow-body"}</td>
          <td className="p-2">{x.nxt ? `${x.nxt.flight} · ${x.nxt.dep}` : "—"}</td>
          <td className="p-2 w-40"><div className="h-2 bg-navy-900 rounded"><div className="h-2 rounded bg-sky-500" style={{ width: `${x.util}%` }} /></div><div className="text-[11px] text-slate-500 mt-1">{x.util}%</div></td>
          <td className="p-2 text-xs text-slate-400">{x.fs.map(f => `${fmt(toMin(f.dep))} ${f.flight}`).join(" · ")}</td>
          <td className="p-2">{x.nxt && <select aria-label={`Move ${x.nxt.flight}`} className="bg-navy-900 border border-navy-600 rounded px-2 py-1 text-xs text-white" value="" onChange={e => e.target.value && void change(x.nxt, e.target.value)}><option value="">Move…</option>{gates.filter(o => o.g !== x.g).map(o => <option key={o.g}>{o.g}</option>)}</select>}</td></tr>)}</tbody></table></Card>
    </div>
  );
}
export const GatesPage = GatesDashboard;
