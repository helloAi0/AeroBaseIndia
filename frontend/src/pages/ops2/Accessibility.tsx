import { useState } from "react";
import { useCollection } from "../../hooks/useCollection";
import { Accessibility as Icon, UserCheck } from "lucide-react";
import { Card, PageHead } from "../../components/ui/PageHead";

interface Req { pax: string; flight: string; need: string; where: string; status: "Open" | "Assigned" | "Done"; staff?: string; eta?: number; staffName?: string }
const STAFF = [{ n: "Ravi (T3 arrivals)", at: "T3" }, { n: "Meena (T3 departures)", at: "T3" }, { n: "Imran (T2)", at: "T2" }, { n: "Kavita (T1)", at: "T1" }];
const NEEDS = ["Wheelchair", "Visually impaired escort", "Elderly assistance", "Hearing impaired support", "Stretcher"];
const WHERE = ["T1 check-in", "T2 check-in", "T3 check-in", "T3 arrivals", "T2 gates", "T3 gates"];

export function AccessibilityConcierge() {
  const col = useCollection<Req>("accessibility", [{ id: "seed-1", pax: "Mrs. Iyer", flight: "AI-101", need: "Wheelchair", where: "T3 check-in", status: "Open" }]);
  const reqs = col.items;
  const busy = new Set(reqs.filter(r => r.status === "Assigned").map(r => r.staff));
  const staff = STAFF.map(x => ({ ...x, free: !busy.has(x.n) }));
  const [f, setF] = useState({ pax: "", flight: "", need: NEEDS[0], where: WHERE[0] });

  const eta = (s: typeof STAFF[number], where: string) => (where.startsWith(s.at) ? 4 : 11) + (where.includes("gates") ? 3 : 0);
  const assign = (r: typeof reqs[number]) => {
    const pick = staff.filter(s => s.free).sort((a, b) => eta(a, r.where) - eta(b, r.where))[0];
    if (!pick) return;
    void col.update(r.id, { status: "Assigned", staff: pick.n, eta: eta(pick, r.where) });
  };
  const finish = (r: typeof reqs[number]) => { void col.update(r.id, { status: "Done" }); };
  const add = (e: React.FormEvent) => { e.preventDefault(); if (!f.pax.trim() || !f.flight.trim()) return; void col.add({ ...f, pax: f.pax.trim(), flight: f.flight.trim().toUpperCase(), status: "Open" }); setF({ ...f, pax: "", flight: "" }); };
  const inp = "bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-white text-sm min-w-0";
  return (
    <div className="space-y-6">
      <PageHead title="Accessibility Concierge" sub="Assisted-travel requests routed to the nearest free staff member, with an ETA." note={`ETA = 4 min if staff are in the same terminal, 11 min otherwise (+3 for gates). ${col.live ? "Requests are saved on the server and shared with all staff." : "Demo mode: requests stay in this browser tab."}`} />
      <Card><form onSubmit={add} className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <input className={inp} placeholder="Passenger name" value={f.pax} onChange={e => setF({ ...f, pax: e.target.value })} aria-label="Passenger name" />
        <input className={inp} placeholder="Flight e.g. AI-101" value={f.flight} onChange={e => setF({ ...f, flight: e.target.value })} aria-label="Flight" />
        <select className={inp} value={f.need} onChange={e => setF({ ...f, need: e.target.value })}>{NEEDS.map(n => <option key={n}>{n}</option>)}</select>
        <select className={inp} value={f.where} onChange={e => setF({ ...f, where: e.target.value })}>{WHERE.map(n => <option key={n}>{n}</option>)}</select>
        <button className="px-4 py-2 rounded-lg bg-sky-500 text-white text-sm font-semibold">Add request</button></form></Card>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 space-y-3">{col.error && <div className="text-xs text-red-400">{col.error}</div>}{col.loading && <div className="text-xs text-slate-400">Loading…</div>}{reqs.map(r => (
          <Card key={r.id}><div className="flex flex-wrap justify-between gap-3 items-center"><div className="min-w-0"><div className="text-white flex items-center gap-2"><Icon className="w-4 h-4 text-sky-400" />{r.pax} <span className="text-slate-400 text-sm">· {r.flight}</span></div>
            <div className="text-xs text-slate-400 mt-1">{r.need} at {r.where} {r.staff && `· ${r.staff}, ETA ${r.eta} min`}</div></div>
            <div className="flex items-center gap-2"><span className={`text-xs px-2 py-1 rounded-full border ${r.status === "Open" ? "text-yellow-400 border-yellow-500/30" : r.status === "Assigned" ? "text-sky-300 border-sky-500/30" : "text-green-400 border-green-500/30"}`}>{r.status}</span>
              {r.status === "Open" && <button onClick={() => assign(r)} className="text-xs px-3 py-2 rounded-lg bg-sky-500 text-white">Assign nearest</button>}
              {r.status === "Assigned" && <button onClick={() => finish(r)} className="text-xs px-3 py-2 rounded-lg bg-green-600 text-white">Mark done</button>}</div></div></Card>))}</div>
        <Card><div className="text-white font-semibold mb-3 flex items-center gap-2"><UserCheck className="w-4 h-4" />Assistance team</div>{staff.map(s => <div key={s.n} className="flex justify-between text-sm py-1 text-slate-300"><span>{s.n}</span><span className={s.free ? "text-green-400" : "text-yellow-400"}>{s.free ? "Free" : "Busy"}</span></div>)}</Card>
      </div>
    </div>
  );
}
