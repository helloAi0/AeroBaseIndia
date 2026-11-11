import { useMemo, useState } from "react";
import { useBoard } from "../../hooks/useBoard";
import { CROWD, crowdAt } from "../../lib/opsEngine2";
import { fmt } from "../../lib/opsEngine";
import { Card, PageHead } from "../../components/ui/PageHead";

const color = (l: number) => l > 0.75 ? "bg-red-500/70 border-red-400" : l > 0.45 ? "bg-yellow-500/60 border-yellow-400" : l > 0.1 ? "bg-green-500/50 border-green-400" : "bg-navy-700 border-navy-600";
const label = (l: number) => l > 0.75 ? "Crowded" : l > 0.45 ? "Busy" : l > 0.1 ? "Normal" : "Quiet";

export function CrowdHeatmap() {
  const d = new Date(); const nowDefault = Math.min(Math.max(d.getHours() * 60 + d.getMinutes(), 6 * 60), 20 * 60);
  const [now, setNow] = useState(nowDefault);
  const { flights, live } = useBoard();
  const zones = useMemo(() => crowdAt(flights, now), [flights, now]);
  const worst = zones.filter(z => z.kind !== "Gates").sort((a, b) => b.wait - a.wait)[0];
  return (
    <div className="space-y-6">
      <PageHead title="Crowd & Queue Heatmap" sub="Expected crowding at check-in, security and gates, by terminal."
        note={`${live ? "Live flight board. " : "Demo board. "}Modelled from scheduled flights, not camera counts: passengers arrive ${CROWD.checkinLeadMin} min (check-in) and ${CROWD.securityLeadMin} min (security) before departure; throughput ${CROWD.checkinPaxPerMin}/min check-in and ${CROWD.securityPaxPerMin}/min security per terminal. Feed real counts in later.`} />
      <Card><label className="block text-sm text-slate-300">Time: <b className="text-white">{fmt(now)}</b>
        <input type="range" min={360} max={1200} step={15} value={now} onChange={e => setNow(+e.target.value)} className="w-full accent-sky-500" aria-label="Time of day" /></label></Card>
      {worst && worst.wait > 0 && <div className="text-sm text-yellow-300">Longest expected wait: {worst.terminal} {worst.kind.toLowerCase()} at about {worst.wait} min.</div>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {["T1", "T2", "T3"].map(t => (
          <Card key={t}><div className="text-white font-semibold mb-3">Terminal {t.slice(1)}</div>
            <div className="space-y-3">{zones.filter(z => z.terminal === t).map(z => (
              <div key={z.kind} className={`rounded-xl border p-3 ${color(z.load)}`}>
                <div className="flex justify-between text-sm text-white"><span>{z.kind}</span><span>{label(z.load)}</span></div>
                <div className="text-xs text-slate-100/80 mt-1">{z.people} people{z.kind !== "Gates" ? ` · about ${z.wait} min wait` : ""}</div>
              </div>))}</div></Card>))}
      </div>
    </div>
  );
}
