import { useMemo, useState } from "react";
import { Leaf, CheckCircle2, Fuel, Plane } from "lucide-react";
import { useBoard } from "../../hooks/useBoard";
import { useCollection } from "../../hooks/useCollection";
import { useAuthStore } from "../../store/authStore";
import { CARBON, carbonOps } from "../../lib/opsEngine2";
import { Card, PageHead, Stat } from "../../components/ui/PageHead";

interface Act { kind: "carbon"; flight: string; co2: number; by?: string; at: string }
const TREE_KG_YEAR = 21, CAR_KG_KM = 0.12;
const fmt = (kg: number) => kg >= 1000 ? `${(kg / 1000).toFixed(1)} t` : `${Math.round(kg)} kg`;

export function CarbonOps() {
  const { flights } = useBoard(); const role = useAuthStore(s => s.user?.role);
  const canAct = role === "airport_admin" || role === "superadmin" || role === "staff";
  const acts = useCollection<Act & { id: string }>("actions", []);
  const c = useMemo(() => carbonOps(flights), [flights]);
  const doneSet = useMemo(() => new Set(acts.items.filter(a => a.kind === "carbon").map(a => a.flight)), [acts.items]);
  const [airline, setAirline] = useState<string>("All"); const [allAir, setAllAir] = useState(false);
  const rows = c.rows.filter(r => airline === "All" || r.f.airCode === airline).sort((a, b) => Number(doneSet.has(a.f.flight)) - Number(doneSet.has(b.f.flight)) || a.f.dep.localeCompare(b.f.dep));
  const committed = c.rows.filter(r => doneSet.has(r.f.flight)).reduce((s, r) => s + r.co2, 0);
  const pct = c.total ? Math.round(committed / c.total * 100) : 0;
  const max = Math.max(1, ...c.byAirline.map(a => a.co2));
  const fuelKg = Math.round(c.total / CARBON.co2PerKg);

  const mark = (r: typeof c.rows[number]) => acts.add({ kind: "carbon", flight: r.f.flight, co2: r.co2, at: new Date().toISOString() } as never);

  return (
    <div className="space-y-6">
      <PageHead title="Carbon-aware Ops" sub="Two ground actions per departure — taxi on one engine, run the stand on ground power instead of the APU — and how much CO₂ they save."
        note={`Planning estimates, not measurements: single-engine taxi saves ${Math.round(CARBON.singleEngineSaving * 100)}% of ${CARBON.taxiKgPerMin} kg fuel/min; ground power replaces the APU for ${CARBON.groundPowerMin} min at ${CARBON.apuKgPerMin} kg/min; ${CARBON.co2PerKg} kg CO₂ per kg of fuel.`} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Saveable today" value={fmt(c.total)} sub={`${c.rows.length} departures · ${fuelKg.toLocaleString("en-IN")} kg fuel`} tone="text-green-400" />
        <Stat label="Committed so far" value={fmt(committed)} sub={`${doneSet.size} flights actioned`} />
        <Stat label="Equivalent to" value={`${Math.round(c.total / TREE_KG_YEAR).toLocaleString("en-IN")} trees`} sub="absorbing CO₂ for a year" />
        <Stat label="Or" value={`${Math.round(c.total / CAR_KG_KM).toLocaleString("en-IN")} km`} sub="of average car driving" />
      </div>

      <Card>
        <div className="flex justify-between text-sm mb-2"><span className="text-white font-semibold flex items-center gap-2"><Leaf className="w-4 h-4 text-green-400" />Today's progress</span><span className="text-slate-400">{pct}% of potential committed</span></div>
        <div className="h-3 bg-navy-700 rounded-full overflow-hidden"><div className="h-full bg-green-500 transition-all" style={{ width: `${pct}%` }} /></div>
        <div className="text-xs text-slate-500 mt-2">Mark a flight as actioned once the ramp team has confirmed single-engine taxi and ground power for it.</div>
      </Card>

      <div className="grid xl:grid-cols-3 gap-5">
        <Card>
          <div className="text-white font-semibold mb-3 flex items-center gap-2"><Plane className="w-4 h-4" />Airline scorecard</div>
          {c.byAirline.length === 0 && <div className="text-sm text-slate-400">No departures on the board.</div>}
          <div className="space-y-3">{(allAir ? c.byAirline : c.byAirline.slice(0, 8)).map(a => {
            const done = c.rows.filter(r => r.f.airCode === a.code && doneSet.has(r.f.flight)).length;
            return (<button key={a.code} onClick={() => setAirline(airline === a.code ? "All" : a.code)} className={`w-full text-left rounded-lg p-2 ${airline === a.code ? "bg-navy-700" : "hover:bg-navy-800"}`}>
              <div className="flex justify-between text-sm"><span className="text-slate-200">{a.name}</span><span className="text-slate-400">{fmt(a.co2)}</span></div>
              <div className="h-2 bg-navy-700 rounded-full mt-1.5 overflow-hidden"><div className="h-full bg-green-500/80" style={{ width: `${a.co2 / max * 100}%` }} /></div>
              <div className="text-[11px] text-slate-500 mt-1">{done} of {a.flights} flights actioned</div></button>); })}</div>
          {c.byAirline.length > 8 && <button onClick={() => setAllAir(!allAir)} className="text-xs text-sky-400 mt-3 block">{allAir ? "Show top 8 only" : `Show all ${c.byAirline.length} airlines`}</button>}
          {airline !== "All" && <button onClick={() => setAirline("All")} className="text-xs text-sky-400 mt-2 block">Show all airlines</button>}
        </Card>

        <div className="xl:col-span-2 space-y-3">
          <div className="text-white font-semibold flex items-center gap-2"><Fuel className="w-4 h-4" />Departures to action {airline !== "All" && <span className="text-xs text-slate-400">· {airline}</span>}</div>
          {acts.error && <div className="text-xs text-red-400">{acts.error}</div>}
          {rows.length === 0 && <Card><div className="text-sm text-slate-400">Nothing to action.</div></Card>}
          {rows.slice(0, 25).map(r => { const done = doneSet.has(r.f.flight);
            return (<Card key={r.f.id} className={done ? "opacity-60" : ""}><div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0"><div className="text-white"><span className="font-mono">{r.f.flight}</span> <span className="text-slate-400 text-sm">· gate {r.f.gate} · dep {r.f.dep}</span></div>
                <div className="text-xs text-slate-400 mt-1">Taxi ~{r.taxi} min on one engine · APU off on stand, use ground power</div></div>
              <div className="flex items-center gap-3"><span className="text-green-400 text-sm font-semibold">−{r.co2} kg</span>
                {done ? <span className="text-xs text-green-400 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" />Actioned</span>
                  : canAct ? <button onClick={() => void mark(r)} className="text-xs px-3 py-2 rounded-lg bg-green-600 text-white">Mark actioned</button> : null}</div></div></Card>); })}
        </div>
      </div>
    </div>
  );
}
