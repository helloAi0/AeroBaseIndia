import { useMemo, useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useBoard } from "../../hooks/useBoard";
import { api } from "../../api/client";
import { gateReview } from "../../lib/opsEngine2";
import { Card, PageHead } from "../../components/ui/PageHead";

export function GateOptimizer() {
  const { flights, live, refetch } = useBoard();
  const issues = useMemo(() => gateReview(flights), [flights]);
  const [applied, setApplied] = useState<Record<number, string>>({});
  const [err, setErr] = useState("");
  const apply = async (i: (typeof issues)[number]) => {
    setErr("");
    const bid = (i.flight as unknown as { backendId?: string }).backendId;
    try { if (live && bid) { await api.patch(`/flights/${bid}`, { gate: i.proposal }); refetch(); } setApplied(a => ({ ...a, [i.flight.id]: i.proposal! })); }
    catch (e: any) { setErr(e?.response?.data?.error ?? "Could not change the gate"); }
  };
  return (
    <div className="space-y-6">
      <PageHead title="Smart Gate Assignment" sub="Finds double-booked or mismatched gates and proposes the closest valid swap."
        note={`Rules: no two departures within 50 min on one gate; wide-body aircraft (300+ seats) use E gates; otherwise prefer the shortest walk. ${live ? "Applying a swap updates the gate for everyone and is audited." : "Demo mode: swaps change this view only."}`} />
      {err && <div className="text-xs text-red-400">{err}</div>}
      {issues.length === 0 && <Card><div className="text-center text-slate-300"><CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-2" />All gate assignments are valid.</div></Card>}
      <Card className="overflow-x-auto"><div className="text-sm text-slate-300 mb-2">Gate board today</div><table className="w-full text-sm min-w-[420px]"><tbody>
        {Array.from(new Set(flights.map(f => f.gate))).sort().map(g => <tr key={g} className="border-b border-navy-700 text-slate-200"><td className="p-2 font-mono w-14">{g}</td><td className="p-2 text-xs text-slate-400">{flights.filter(f => f.gate === g).sort((a, b) => a.dep.localeCompare(b.dep)).map(f => `${f.dep} ${f.flight}`).join("  ·  ")}</td></tr>)}</tbody></table></Card>
      <div className="space-y-3">{issues.map(i => (
        <Card key={i.flight.id}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0"><div className="font-mono font-bold text-white">{i.flight.flight} <span className="text-slate-400 font-sans font-normal text-sm">{i.flight.aircraft} · dep {i.flight.dep}</span></div>
              <ul className="text-xs text-yellow-400 mt-1 list-disc ml-4">{i.problems.map(p => <li key={p}>{p}</li>)}</ul></div>
            <div className="flex items-center gap-3 text-sm text-slate-200">
              <span className="px-2 py-1 rounded bg-navy-900 border border-navy-600">Gate {applied[i.flight.id] ? applied[i.flight.id] : i.gate}</span>
              {i.proposal && !applied[i.flight.id] && <><ArrowRight className="w-4 h-4 text-slate-500" /><span className="px-2 py-1 rounded bg-sky-500/20 border border-sky-500/40 text-sky-200">Gate {i.proposal}</span><span className="text-xs text-slate-400">{i.gain}</span>
                <button onClick={() => void apply(i)} className="text-xs font-semibold px-3 py-2 rounded-lg bg-sky-500 text-white">Apply swap</button></>}
              {applied[i.flight.id] && <span className="text-xs text-green-400">Applied</span>}
              {!i.proposal && <span className="text-xs text-red-400">No free valid gate; escalate to duty manager</span>}
            </div></div></Card>))}</div>
    </div>
  );
}
