import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Minus, Plus, Clock, Users, Timer, DoorOpen, Megaphone } from "lucide-react";
import { useBoard } from "../../hooks/useBoard";
import { useCollection } from "../../hooks/useCollection";
import { useAuthStore } from "../../store/authStore";
import { useAppStore } from "../../store/appStore";
import { CROWD, LANES, crowdAt, laneKey, type Zone } from "../../lib/opsEngine2";
import { fmt } from "../../lib/opsEngine";
import { Card, PageHead, Stat } from "../../components/ui/PageHead";

type LaneDoc = { key: string; lanes: number };
type Level = "ok" | "busy" | "critical";
const levelOf = (z: Zone): Level => {
  if (z.kind === "Gates") return z.people > 450 ? "critical" : z.people > 250 ? "busy" : "ok";
  const t = LANES[z.kind].target; return z.wait > t * 2 ? "critical" : z.wait > t ? "busy" : "ok";
};
const TONE: Record<Level, { box: string; chip: string; bar: string; txt: string }> = {
  ok:       { box: "border-navy-600", chip: "bg-green-500/15 text-green-300", bar: "bg-green-500", txt: "On track" },
  busy:     { box: "border-yellow-500/50", chip: "bg-yellow-500/15 text-yellow-300", bar: "bg-yellow-500", txt: "Getting busy" },
  critical: { box: "border-red-500/60", chip: "bg-red-500/15 text-red-300", bar: "bg-red-500", txt: "Needs action" },
};
const hhmm = (m: number) => fmt(m);

export function CrowdHeatmap() {
  const nowReal = (() => { const d = new Date(); return Math.min(Math.max(d.getHours() * 60 + d.getMinutes(), 5 * 60), 22 * 60); })();
  const [at, setAt] = useState(nowReal);
  const { flights, live } = useBoard();
  const role = useAuthStore(s => s.user?.role); const setPage = useAppStore(s => s.setActivePage);
  const canAct = role === "airport_admin" || role === "superadmin" || (role === "staff");
  const cfg = useCollection<LaneDoc>("lane_config", []); const actions = useCollection<any>("actions", []);
  const lanes = useMemo(() => Object.fromEntries(cfg.items.map(c => [c.key, c.lanes])), [cfg.items]);
  const terminals = useMemo(() => Array.from(new Set(flights.map(f => f.terminal).filter(t => t && t !== "—"))).sort(), [flights]);
  const zones = useMemo(() => crowdAt(flights, at, lanes, terminals), [flights, at, lanes, terminals]);
  const [note, setNote] = useState("");

  const setLanes = async (z: Zone, n: number) => {
    const key = laneKey(z.terminal, z.kind); const doc = cfg.items.find(c => c.key === key);
    const v = Math.max(1, Math.min(LANES[z.kind as "Check-in" | "Security"].max, n));
    const ok = doc ? await cfg.update(doc.id, { lanes: v }) : await cfg.add({ key, lanes: v });
    if (ok) void actions.add({ type: "crowd", text: `${z.terminal} ${z.kind}: ${v} ${z.kind === "Check-in" ? "counters" : "lanes"} open`, at: new Date().toISOString() });
  };
  const apply = async (z: Zone) => { await setLanes(z, z.recommended ?? z.lanes ?? 12); setNote(`${z.terminal} ${z.kind}: set to ${z.recommended}. Waits updated.`); };

  const queue = zones.filter(z => z.kind !== "Gates");
  const critical = zones.filter(z => levelOf(z) === "critical"), busy = zones.filter(z => levelOf(z) === "busy");
  const todo = queue.filter(z => levelOf(z) !== "ok" && (z.recommended ?? 0) > (z.lanes ?? 0)).sort((a, b) => b.wait - a.wait);
  const totalPeople = zones.reduce((a, z) => a + z.people, 0);
  const worst = [...queue].sort((a, b) => b.wait - a.wait)[0];
  const cantFix = queue.filter(z => levelOf(z) === "critical" && (z.lanes ?? 0) >= LANES[z.kind as "Check-in" | "Security"].max);

  // Rush hours: people in queues across the day, per hour, for the whole airport (current lane settings).
  const hours = useMemo(() => Array.from({ length: 17 }, (_, i) => { const m = (5 + i) * 60; const z = crowdAt(flights, m, lanes, terminals).filter(x => x.kind !== "Gates"); return { m, people: z.reduce((a, x) => a + x.people, 0), worst: Math.max(0, ...z.map(x => x.wait)) }; }), [flights, lanes, terminals]);
  const peak = Math.max(1, ...hours.map(h => h.people));

  return (
    <div className="space-y-6">
      <PageHead title="Crowd & Queue Control" sub="See where passengers will queue, then open counters and lanes before it gets crowded." />

      <Card>
        <div className="flex flex-wrap items-center gap-3">
          <Clock className="w-4 h-4 text-sky-400" /><span className="text-sm text-slate-300">Viewing</span><b className="text-white font-mono text-lg">{hhmm(at)}</b>
          {at !== nowReal && <button onClick={() => setAt(nowReal)} className="text-xs px-2.5 py-1 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/30">Back to now</button>}
          <span className="text-xs text-slate-500 ml-auto">Drag to look ahead or back</span>
        </div>
        <input type="range" min={300} max={1320} step={15} value={at} onChange={e => setAt(+e.target.value)} className="w-full accent-sky-500 mt-2" aria-label="Time of day" />
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="People in queues & gates" value={totalPeople.toLocaleString("en-IN")} sub="expected at this time" />
        <Stat label="Longest wait" value={worst && worst.wait > 0 ? `${worst.wait} min` : "—"} sub={worst && worst.wait > 0 ? `${worst.terminal} ${worst.kind.toLowerCase()}` : "no queues"} tone={worst && worst.wait > 40 ? "text-red-400" : "text-white"} />
        <Stat label="Areas needing action" value={critical.length} sub={`${busy.length} more getting busy`} tone={critical.length ? "text-red-400" : "text-green-400"} />
        <Stat label="Counters / lanes open" value={queue.reduce((a, z) => a + (z.lanes ?? 0), 0)} sub="check-in + security" />
      </div>

      {note && <div className="text-sm text-green-300 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" />{note}</div>}
      {(cfg.error || actions.error) && <div className="text-sm text-red-400">{cfg.error || actions.error}</div>}

      <Card>
        <div className="flex items-center gap-2 mb-3"><AlertTriangle className="w-4 h-4 text-yellow-400" /><h2 className="text-white font-semibold">What to do now</h2></div>
        {todo.length === 0 && cantFix.length === 0 && <div className="text-sm text-slate-300 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-400" />Queues are within target for {hhmm(at)}. Nothing to do.</div>}
        <ul className="space-y-2">
          {todo.map(z => (
            <li key={laneKey(z.terminal, z.kind)} className="flex flex-wrap items-center gap-3 rounded-xl bg-navy-900 border border-navy-600 px-4 py-3">
              <div className="flex-1 min-w-[220px]">
                <div className="text-sm text-white font-medium">Open {(z.recommended ?? 0) - (z.lanes ?? 0)} more {z.kind === "Check-in" ? "check-in counters" : "security lanes"} at {z.terminal}</div>
                <div className="text-xs text-slate-400 mt-0.5">{z.people.toLocaleString("en-IN")} people expected · wait {z.wait} min now with {z.lanes} open → about {LANES[z.kind as "Check-in" | "Security"].target} min with {z.recommended}</div>
              </div>
              <button disabled={!canAct} onClick={() => void apply(z)} className="text-xs font-semibold px-3 py-2 rounded-lg bg-sky-500 text-white disabled:opacity-40">Apply</button>
            </li>))}
          {cantFix.map(z => (
            <li key={"x" + laneKey(z.terminal, z.kind)} className="flex flex-wrap items-center gap-3 rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3">
              <div className="flex-1 min-w-[220px] text-sm text-red-200">{z.terminal} {z.kind.toLowerCase()} is at full capacity ({z.lanes} open) and still {z.wait} min. Spread the load.</div>
              <button onClick={() => setPage("announcements")} className="text-xs px-3 py-2 rounded-lg bg-navy-700 text-white border border-navy-500 flex items-center gap-1.5"><Megaphone className="w-3.5 h-3.5" />Announce</button>
              <button onClick={() => setPage("gateopt")} className="text-xs px-3 py-2 rounded-lg bg-navy-700 text-white border border-navy-500 flex items-center gap-1.5"><DoorOpen className="w-3.5 h-3.5" />Smart Gates</button>
            </li>))}
        </ul>
        {!canAct && <div className="text-xs text-slate-500 mt-3">Only airport staff can change counters.</div>}
      </Card>

      <div className={`grid gap-4 ${terminals.length >= 3 ? "lg:grid-cols-3" : terminals.length === 2 ? "lg:grid-cols-2" : ""}`}>
        {terminals.map(t => (
          <Card key={t}>
            <div className="text-white font-semibold mb-3 flex items-center gap-2"><Users className="w-4 h-4 text-sky-400" />Terminal {t.slice(1)}</div>
            <div className="space-y-3">
              {zones.filter(z => z.terminal === t).map(z => {
                const lv = levelOf(z), tone = TONE[lv], q = z.kind !== "Gates";
                return (
                  <div key={z.kind} className={`rounded-xl border bg-navy-900 p-3 ${tone.box}`}>
                    <div className="flex justify-between items-center"><span className="text-sm font-medium text-white">{z.kind}</span><span className={`text-[11px] px-2 py-0.5 rounded-full ${tone.chip}`}>{tone.txt}</span></div>
                    <div className="mt-2 h-1.5 rounded-full bg-navy-700 overflow-hidden"><div className={`h-full ${tone.bar} transition-all`} style={{ width: `${Math.max(3, Math.round(z.load * 100))}%` }} /></div>
                    <div className="flex justify-between text-xs text-slate-300 mt-2"><span>{z.people.toLocaleString("en-IN")} people</span>{q && <span className="flex items-center gap-1"><Timer className="w-3 h-3" />{z.wait} min wait</span>}</div>
                    {q && (
                      <div className="flex items-center justify-between mt-3 text-xs">
                        <span className="text-slate-400">{z.kind === "Check-in" ? "Counters" : "Lanes"} open{(z.recommended ?? 0) !== z.lanes && <span className="text-slate-500"> · suggested {z.recommended}</span>}</span>
                        <div className="flex items-center gap-1">
                          <button disabled={!canAct} aria-label="Close one" onClick={() => void setLanes(z, (z.lanes ?? 1) - 1)} className="w-7 h-7 rounded-lg bg-navy-700 text-white disabled:opacity-40 grid place-items-center"><Minus className="w-3.5 h-3.5" /></button>
                          <b className="w-8 text-center text-white font-mono">{z.lanes}</b>
                          <button disabled={!canAct} aria-label="Open one" onClick={() => void setLanes(z, (z.lanes ?? 1) + 1)} className="w-7 h-7 rounded-lg bg-navy-700 text-white disabled:opacity-40 grid place-items-center"><Plus className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>)}
                  </div>);
              })}
            </div>
          </Card>))}
      </div>

      <Card>
        <h2 className="text-white font-semibold mb-1">Rush hours today</h2>
        <p className="text-xs text-slate-400 mb-4">People expected in check-in and security queues across the whole airport, hour by hour, with today's staffing.</p>
        <div className="flex items-end gap-1 h-32" role="img" aria-label="Queue size by hour">
          {hours.map(h => (
            <button key={h.m} onClick={() => setAt(h.m)} title={`${hhmm(h.m)} · ${h.people} people · longest wait ${h.worst} min`} className="flex-1 flex flex-col items-center justify-end h-full group">
              <div className={`w-full rounded-t ${Math.abs(h.m - at) < 30 ? "bg-sky-400" : h.worst > 40 ? "bg-red-500/70" : "bg-slate-600"} group-hover:brightness-125 transition`} style={{ height: `${Math.max(2, (h.people / peak) * 100)}%` }} />
              <span className="text-[10px] text-slate-500 mt-1">{String(Math.floor(h.m / 60)).padStart(2, "0")}</span>
            </button>))}
        </div>
      </Card>

      <p className="text-xs text-slate-500">
        How this is worked out: {live ? "from today's live flight board" : "from the demo board"}, passengers are expected at check-in {CROWD.checkinLeadMin} min and at security {CROWD.securityLeadMin} min before departure. With {LANES["Check-in"].def} counters a terminal clears about {CROWD.checkinPaxPerMin} passengers a minute at check-in and {CROWD.securityPaxPerMin} at security; each counter or lane adds its share.
        Targets: check-in under {LANES["Check-in"].target} min, security under {LANES.Security.target} min. These are planning estimates, not camera counts.
      </p>
    </div>
  );
}
