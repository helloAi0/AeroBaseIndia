import { useEffect, useRef, useState } from "react";
import { Pause, Play, Radio, Trash2 } from "lucide-react";
import { api } from "../../api/client";
import { API_ENABLED } from "../../config";
import { useAuthStore } from "../../store/authStore";
import { useBoard } from "../../hooks/useBoard";
import { Card, PageHead, Empty } from "../../components/ui/PageHead";

type Ev = { id: string; type: "flight" | "security" | "system" | "account"; sev: "info" | "warning" | "error" | "success"; msg: string; at: string };
const SEV: Record<string, string> = { info: "text-sky-300", warning: "text-yellow-300", error: "text-red-300", success: "text-green-300" };

/** Live event feed built from real changes: flight status/gate/delay changes detected between board refreshes, plus the audit log. */
export function WebSocketFeed() {
  const live = API_ENABLED && useAuthStore(s => s.source) === "backend"; const { flights, live: boardLive } = useBoard();
  const [events, setEvents] = useState<Ev[]>([]); const [paused, setPaused] = useState(false); const [filter, setFilter] = useState("all");
  const prev = useRef<Map<string, string> | null>(null); const seenAudit = useRef<Set<string>>(new Set()); const pausedRef = useRef(false); pausedRef.current = paused;
  const push = (items: Ev[]) => { if (!items.length || pausedRef.current) return; setEvents(e => [...items, ...e].slice(0, 150)); };
  const now = () => new Date().toLocaleTimeString();

  useEffect(() => {
    const snap = new Map<string, string>();
    for (const f of flights as any[]) snap.set(String(f.id), `${f.flight}|${f.status}|${f.gate}|${f.delay ?? 0}`);
    if (prev.current) {
      const out: Ev[] = [];
      snap.forEach((v, id) => {
        const old = prev.current!.get(id); if (!old || old === v) return;
        const [fl, st, gate, dl] = v.split("|"); const [, ost, ogate] = old.split("|");
        if (st !== ost) out.push({ id: `${id}-${st}-${Date.now()}`, type: "flight", sev: st === "Cancelled" ? "error" : st === "Delayed" ? "warning" : "info", msg: `${fl} status ${ost} → ${st}${Number(dl) ? ` (${dl} min delay)` : ""}`, at: now() });
        if (gate !== ogate) out.push({ id: `${id}-g-${Date.now()}`, type: "flight", sev: "info", msg: `${fl} gate ${ogate || "TBA"} → ${gate || "TBA"}`, at: now() });
      });
      push(out);
    }
    prev.current = snap;
  }, [flights]);

  useEffect(() => {
    if (!live) return;
    const load = () => api.get("/audit/logs", { params: { limit: 15 } }).then(r => {
      const rows: any[] = r.data.logs ?? r.data ?? []; const first = seenAudit.current.size === 0; const out: Ev[] = [];
      for (const l of rows.slice().reverse()) {
        const k = String(l.id ?? `${l.action}${l.created_at}`); if (seenAudit.current.has(k)) continue; seenAudit.current.add(k);
        if (first) continue;   // don't replay history on first load
        const a = String(l.action ?? ""); out.push({ id: `a-${k}`, type: a.startsWith("LOGIN") ? "security" : a.includes("PASSKEY") || a.includes("BIOMETRIC") ? "security" : "system", sev: a.includes("FAILED") ? "warning" : "info", msg: `${a}${l.resource ? ` · ${l.resource}` : ""}`, at: now() });
      }
      push(out);
    }).catch(() => {});
    load(); const t = setInterval(load, 10000); return () => clearInterval(t);
  }, [live]);

  const shown = filter === "all" ? events : events.filter(e => e.type === filter);
  return (
    <div className="space-y-6">
      <PageHead title="Live Event Feed" sub={`Changes detected on the ${boardLive ? "live" : "demo"} flight board and the audit log, refreshed every 10–15 seconds.`} />
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-2 px-3 py-2 rounded-xl border border-navy-600 text-xs text-slate-300"><Radio className={`w-4 h-4 ${paused ? "text-slate-500" : "text-green-400"}`} />{paused ? "Paused" : "Listening"}</span>
        {["all", "flight", "security", "system"].map(f => <button key={f} onClick={() => setFilter(f)} className={`px-3 py-2 rounded-xl text-xs border ${filter === f ? "bg-sky-500 text-white border-sky-500" : "bg-navy-800 text-slate-400 border-navy-600"}`}>{f}</button>)}
        <button onClick={() => setPaused(p => !p)} className="px-3 py-2 rounded-xl text-xs border border-navy-600 text-slate-300 flex items-center gap-1">{paused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}{paused ? "Resume" : "Pause"}</button>
        <button onClick={() => setEvents([])} className="px-3 py-2 rounded-xl text-xs border border-navy-600 text-slate-300 flex items-center gap-1"><Trash2 className="w-3 h-3" />Clear</button>
      </div>
      {shown.length === 0 ? <Empty>Waiting for changes. Events appear here when a flight's status or gate changes, or when something is recorded in the audit log.</Empty> :
        <Card><ul className="space-y-1 font-mono text-xs max-h-[60vh] overflow-y-auto">{shown.map(e => <li key={e.id} className="flex gap-3"><span className="text-slate-500 shrink-0">{e.at}</span><span className={SEV[e.sev]}>[{e.type}] {e.msg}</span></li>)}</ul></Card>}
    </div>
  );
}
