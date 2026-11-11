import { useMemo, useState } from "react";
import { useBoard } from "../../hooks/useBoard";
import { capacityOf, fmt, toMin } from "../../lib/opsEngine";
import { readyAfter, tasksFor } from "../../lib/opsEngine2";
import { Card, PageHead } from "../../components/ui/PageHead";

export function Turnaround() {
  const { flights } = useBoard();
  const list = flights.filter(f => f.status === "Scheduled" || f.status === "Boarding" || f.status === "Delayed");
  const [id, setId] = useState(list[0]?.id ?? 0);
  const f = list.find(x => x.id === id) ?? list[0];
  const wide = f ? capacityOf(f) >= 300 : false;
  const tasks = useMemo(() => tasksFor(wide), [wide]);
  const [slip, setSlip] = useState<Record<string, number>>({});
  if (!f) return <div className="text-slate-400">No turnarounds in progress.</div>;
  const plan = wide ? 90 : 45;
  const onBlock = toMin(f.dep) - plan;
  const r = readyAfter(tasks, slip);
  const readyAt = onBlock + r.ready, std = toMin(f.dep), late = Math.round(readyAt - std);
  return (
    <div className="space-y-6">
      <PageHead title="Turnaround Timer" sub="Predicts when each aircraft will be ready and warns before it misses departure."
        note={`Standard times for a ${wide ? "wide" : "narrow"}-body turnaround (${plan} min planned). Enter any slip you see on the ramp; the critical path updates. Fuelling must finish before boarding completes.`} />
      <select value={f.id} onChange={e => { setId(+e.target.value); setSlip({}); }} className="bg-navy-800 border border-navy-600 rounded-lg px-3 py-2 text-white text-sm">
        {list.map(x => <option key={x.id} value={x.id}>{x.flight} · {x.dep} · gate {x.gate}</option>)}</select>
      <Card className={late > 0 ? "border-red-500/50" : "border-green-500/40"}>
        <div className="text-3xl font-bold text-white">{fmt(readyAt)} <span className="text-base text-slate-400 font-normal">ready · departure {f.dep}</span></div>
        <div className={`text-sm mt-1 ${late > 0 ? "text-red-400" : "text-green-400"}`}>{late > 0 ? `Will miss departure by ${late} min. Add crew or expedite the slowest task.` : `On track, ${-late} min spare.`}</div></Card>
      <Card className="space-y-3">{tasks.map(t => (
        <div key={t.id} className="grid grid-cols-[1fr_auto] gap-3 items-center">
          <div className="min-w-0"><div className="text-sm text-slate-200">{t.name} <span className="text-xs text-slate-500">{t.mins} min · done {fmt(onBlock + r.finish[t.id])}</span></div>
            <div className="h-2 bg-navy-900 rounded mt-1"><div className="h-2 rounded bg-sky-500" style={{ width: `${Math.min(100, ((t.mins + (slip[t.id] ?? 0)) / (plan * 0.8)) * 100)}%` }} /></div></div>
          <label className="text-xs text-slate-400 flex items-center gap-1">slip <input type="number" min={0} max={90} value={slip[t.id] ?? 0} onChange={e => setSlip(s => ({ ...s, [t.id]: Math.max(0, Math.min(90, +e.target.value || 0)) }))} className="w-16 bg-navy-900 border border-navy-600 rounded px-2 py-1 text-white" /> min</label>
        </div>))}</Card>
    </div>
  );
}
