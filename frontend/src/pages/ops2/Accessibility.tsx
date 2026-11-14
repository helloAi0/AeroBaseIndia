import { useEffect, useMemo, useState } from "react";
import { Accessibility as Icon, UserCheck, Clock, CheckCircle2, Hourglass, Users, AlertTriangle } from "lucide-react";
import { useCollection } from "../../hooks/useCollection";
import { useBoard } from "../../hooks/useBoard";
import { useAuthStore } from "../../store/authStore";
import { useAppStore } from "../../store/appStore";
import { Card, PageHead, Stat } from "../../components/ui/PageHead";

interface Req { pax: string; flight: string; need: string; terminal: string; area: string; note?: string; status: "Open" | "Assigned" | "Done"; staff?: string; eta?: number; requestedAt?: string; assignedAt?: string; doneAt?: string }
interface Person { name: string; role: string; terminal: string; status: string; assist: string; shift: string }
const NEEDS = ["Wheelchair", "Visually impaired escort", "Elderly assistance", "Hearing impaired support", "Stretcher / medical", "Child travelling alone", "Other"];
const AREAS = ["Check-in", "Security", "Gates", "Arrivals", "Baggage belt", "Kerbside"];
const inp = "bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-white text-sm min-w-0 outline-none focus:border-sky-500";
const minsAgo = (iso?: string) => (iso ? Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000)) : 0);
const etaFor = (staffTerminal: string, terminal: string, area: string) => (staffTerminal === terminal ? 4 : 11) + (area === "Gates" ? 3 : 0);

export function AccessibilityConcierge() {
  const role = useAuthStore(s => s.user?.role); const setPage = useAppStore(s => s.setActivePage);
  const isPax = role === "passenger"; const isAdmin = role === "airport_admin" || role === "superadmin";
  const col = useCollection<Req>("accessibility", []); const staffCol = useCollection<Person>("staff", []);
  const { flights } = useBoard();
  const terminals = useMemo(() => { const t = Array.from(new Set(flights.map(f => f.terminal).filter(x => x && x !== "—"))).sort(); return t.length ? t : ["T1"]; }, [flights]);
  const [f, setF] = useState({ pax: "", flight: "", need: NEEDS[0], terminal: "", area: AREAS[0], note: "" });
  const [filter, setFilter] = useState<"Active" | "Done" | "All">("Active"); const [msg, setMsg] = useState("");
  useEffect(() => { if (!f.terminal && terminals[0]) setF(x => ({ ...x, terminal: terminals[0] })); }, [terminals]); // eslint-disable-line react-hooks/exhaustive-deps
  const [, tick] = useState(0); useEffect(() => { const t = setInterval(() => tick(n => n + 1), 30000); return () => clearInterval(t); }, []);

  const reqs = col.items;
  const team = useMemo(() => staffCol.items.filter(p => p.assist === "Yes"), [staffCol.items]);
  const onDuty = team.filter(p => p.status === "On duty");
  const busyWith = new Map(reqs.filter(r => r.status === "Assigned" && r.staff).map(r => [r.staff!, r]));
  const open = reqs.filter(r => r.status === "Open"), inProg = reqs.filter(r => r.status === "Assigned"), done = reqs.filter(r => r.status === "Done");
  const doneToday = done.filter(r => r.doneAt && new Date(r.doneAt).toDateString() === new Date().toDateString());
  const avgResp = doneToday.length ? Math.round(doneToday.reduce((a, r) => a + (r.assignedAt && r.requestedAt ? (new Date(r.assignedAt).getTime() - new Date(r.requestedAt).getTime()) / 60000 : 0), 0) / doneToday.length) : null;

  const add = async (e: React.FormEvent) => {
    e.preventDefault(); if (!f.pax.trim() || !f.flight.trim()) return;
    const ok = await col.add({ ...f, pax: f.pax.trim(), flight: f.flight.trim().toUpperCase(), note: f.note.trim() || undefined, status: "Open", requestedAt: new Date().toISOString() } as never);
    if (ok) { setF({ ...f, pax: isPax ? f.pax : "", flight: "", note: "" }); setMsg(isPax ? "Request sent. Airport staff will come to you." : "Request added."); }
  };
  const assign = async (r: Req & { id: string }, who?: Person) => {
    const free = onDuty.filter(p => !busyWith.has(p.name));
    const pick = who ?? [...free].sort((a, b) => etaFor(a.terminal, r.terminal, r.area) - etaFor(b.terminal, r.terminal, r.area))[0];
    if (!pick) { setMsg("No free trained staff on duty right now."); return; }
    await col.update(r.id, { status: "Assigned", staff: pick.name, eta: etaFor(pick.terminal, r.terminal, r.area), assignedAt: new Date().toISOString() });
  };
  const finish = (r: Req & { id: string }) => col.update(r.id, { status: "Done", doneAt: new Date().toISOString() });
  const flightInfo = (no: string) => flights.find(x => x.flight === no);

  /* ───── Passenger view ───── */
  if (isPax) return (
    <div className="space-y-6 max-w-2xl">
      <PageHead title="Assistance" sub="Need a wheelchair, an escort or other help? Tell us where you are and a trained team member will come to you." />
      {msg && <div className="text-sm text-green-300 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" />{msg}</div>}
      <Card><form onSubmit={add} className="grid sm:grid-cols-2 gap-3">
        <input className={inp} placeholder="Your name" value={f.pax} onChange={e => setF({ ...f, pax: e.target.value })} required aria-label="Your name" />
        <input className={inp} placeholder="Flight e.g. AI-101" list="flt" value={f.flight} onChange={e => setF({ ...f, flight: e.target.value })} required aria-label="Flight" />
        <select className={inp} value={f.need} onChange={e => setF({ ...f, need: e.target.value })} aria-label="Help needed">{NEEDS.map(n => <option key={n}>{n}</option>)}</select>
        <div className="grid grid-cols-2 gap-2"><select className={inp} value={f.terminal} onChange={e => setF({ ...f, terminal: e.target.value })} aria-label="Terminal">{terminals.map(t => <option key={t}>{t}</option>)}</select>
          <select className={inp} value={f.area} onChange={e => setF({ ...f, area: e.target.value })} aria-label="Where are you">{AREAS.map(a => <option key={a}>{a}</option>)}</select></div>
        <input className={inp + " sm:col-span-2"} placeholder="Anything else we should know (optional)" value={f.note} onChange={e => setF({ ...f, note: e.target.value })} aria-label="Note" />
        <button className="sm:col-span-2 px-4 py-2.5 rounded-xl bg-sky-500 text-white text-sm font-semibold">Request assistance</button>
        <datalist id="flt">{flights.slice(0, 200).map(x => <option key={x.id} value={x.flight} />)}</datalist></form></Card>
      <div className="space-y-3">{col.error && <div className="text-xs text-red-400">{col.error}</div>}
        {reqs.length === 0 && <Card><div className="text-sm text-slate-400">No requests yet.</div></Card>}
        {reqs.map(r => (<Card key={r.id}><div className="flex justify-between gap-3 items-center"><div><div className="text-white">{r.need} · {r.flight}</div><div className="text-xs text-slate-400 mt-1">{r.terminal} {r.area.toLowerCase()}{r.staff ? ` · ${r.staff} is on the way (about ${r.eta} min)` : r.status === "Open" ? " · waiting for a team member" : ""}</div></div>
          <span className={`text-xs px-2 py-1 rounded-full border ${r.status === "Open" ? "text-yellow-300 border-yellow-500/30" : r.status === "Assigned" ? "text-sky-300 border-sky-500/30" : "text-green-300 border-green-500/30"}`}>{r.status === "Assigned" ? "On the way" : r.status === "Done" ? "Completed" : "Requested"}</span></div></Card>))}</div>
    </div>);

  /* ───── Staff / admin view ───── */
  const list = reqs.filter(r => filter === "All" ? true : filter === "Done" ? r.status === "Done" : r.status !== "Done").sort((a, b) => (a.status === "Done" ? 1 : 0) - (b.status === "Done" ? 1 : 0) || (a.requestedAt ?? "").localeCompare(b.requestedAt ?? ""));
  return (
    <div className="space-y-6">
      <PageHead title="Accessibility Concierge" sub="Assisted-travel requests from passengers and the desk, routed to trained staff with an ETA." note="ETA = 4 min when the staff member is in the same terminal, 11 min otherwise (+3 min for gates). Requests waiting over 10 minutes turn amber, over 20 red." />
      {msg && <div className="text-sm text-green-300">{msg}</div>}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Waiting" value={open.length} sub={open.length ? `oldest ${Math.max(...open.map(r => minsAgo(r.requestedAt)))} min` : "nobody waiting"} tone={open.length ? "text-yellow-400" : "text-green-400"} />
        <Stat label="In progress" value={inProg.length} sub="staff on the way" />
        <Stat label="Completed today" value={doneToday.length} tone="text-green-400" />
        <Stat label="Avg. time to assign" value={avgResp === null ? "—" : `${avgResp} min`} sub={`${onDuty.length - busyWith.size} of ${onDuty.length} trained staff free`} />
      </div>

      <Card><div className="text-sm text-white font-semibold mb-3">Log a request from the desk</div>
        <form onSubmit={add} className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <input className={inp} placeholder="Passenger name" value={f.pax} onChange={e => setF({ ...f, pax: e.target.value })} aria-label="Passenger name" required />
          <input className={inp} placeholder="Flight e.g. AI-101" list="flt" value={f.flight} onChange={e => setF({ ...f, flight: e.target.value })} aria-label="Flight" required />
          <select className={inp} value={f.need} onChange={e => setF({ ...f, need: e.target.value })} aria-label="Help needed">{NEEDS.map(n => <option key={n}>{n}</option>)}</select>
          <select className={inp} value={f.terminal} onChange={e => setF({ ...f, terminal: e.target.value })} aria-label="Terminal">{terminals.map(t => <option key={t}>{t}</option>)}</select>
          <select className={inp} value={f.area} onChange={e => setF({ ...f, area: e.target.value })} aria-label="Area">{AREAS.map(a => <option key={a}>{a}</option>)}</select>
          <button className="px-4 py-2 rounded-lg bg-sky-500 text-white text-sm font-semibold">Add request</button>
          <datalist id="flt">{flights.slice(0, 200).map(x => <option key={x.id} value={x.flight} />)}</datalist></form></Card>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 space-y-3">
          <div className="flex gap-2">{(["Active", "Done", "All"] as const).map(x => <button key={x} onClick={() => setFilter(x)} className={`px-3 py-1.5 rounded-lg text-xs ${filter === x ? "bg-sky-500 text-white" : "bg-navy-800 border border-navy-600 text-slate-300"}`}>{x}</button>)}</div>
          {col.error && <div className="text-xs text-red-400">{col.error}</div>}{col.loading && <div className="text-xs text-slate-400">Loading…</div>}
          {!col.loading && list.length === 0 && <Card><div className="text-sm text-slate-300 text-center py-4"><CheckCircle2 className="w-6 h-6 text-green-400 mx-auto mb-2" />No {filter === "Done" ? "completed" : "active"} requests.</div></Card>}
          {list.map(r => { const wait = minsAgo(r.requestedAt), late = r.status === "Open" && wait > 20, warn = r.status === "Open" && wait > 10; const fi = flightInfo(r.flight);
            return (<Card key={r.id} className={late ? "!border-red-500/60" : warn ? "!border-yellow-500/50" : ""}>
              <div className="flex flex-wrap justify-between gap-3 items-center">
                <div className="min-w-0"><div className="text-white flex items-center gap-2"><Icon className="w-4 h-4 text-sky-400" />{r.pax} <span className="text-slate-400 text-sm font-mono">{r.flight}</span>{fi && <span className="text-xs text-slate-500">gate {fi.gate} · dep {fi.dep}</span>}</div>
                  <div className="text-xs text-slate-400 mt-1">{r.need} · {r.terminal} {r.area.toLowerCase()}{r.note ? ` · “${r.note}”` : ""}</div>
                  <div className="text-xs mt-1 flex items-center gap-3">
                    {r.requestedAt && <span className={late ? "text-red-400" : warn ? "text-yellow-400" : "text-slate-500"}><Clock className="inline w-3 h-3 mr-1" />{r.status === "Done" ? "closed" : `waiting ${wait} min`}</span>}
                    {r.staff && <span className="text-sky-300"><UserCheck className="inline w-3 h-3 mr-1" />{r.staff}{r.status === "Assigned" ? `, ETA ${r.eta} min` : ""}</span>}</div></div>
                <div className="flex items-center gap-2">
                  {r.status === "Open" && <>
                    <select aria-label="Assign to" className={inp + " text-xs !py-1.5"} defaultValue="" onChange={e => { const p = onDuty.find(x => x.name === e.target.value); if (p) void assign(r, p); }}>
                      <option value="" disabled>Choose staff…</option>{onDuty.filter(p => !busyWith.has(p.name)).map(p => <option key={p.name} value={p.name}>{p.name} ({p.terminal})</option>)}</select>
                    <button onClick={() => void assign(r)} className="text-xs px-3 py-2 rounded-lg bg-sky-500 text-white">Assign nearest</button></>}
                  {r.status === "Assigned" && <button onClick={() => void finish(r)} className="text-xs px-3 py-2 rounded-lg bg-green-600 text-white">Mark done</button>}
                  {r.status === "Done" && <span className="text-xs text-green-400">Completed</span>}
                </div></div></Card>); })}
        </div>

        <Card>
          <div className="text-white font-semibold mb-3 flex items-center gap-2"><Users className="w-4 h-4" />Assistance team</div>
          {team.length === 0 ? (
            <div className="text-sm text-slate-400"><AlertTriangle className="w-5 h-5 text-yellow-400 mb-2" />Nobody is set up for accessibility yet.
              {isAdmin ? <> Open <b>Staff Management</b> and set <b>Accessibility trained = Yes</b> on the people who should receive these requests.<button onClick={() => setPage("staff")} className="block mt-3 text-xs px-3 py-2 rounded-lg bg-sky-500 text-white">Open Staff Management</button></> : " Ask your airport director to mark trained staff in Staff Management."}</div>
          ) : (<>
            {team.map(p => { const b = busyWith.get(p.name); const on = p.status === "On duty";
              return (<div key={p.name} className="flex justify-between items-center text-sm py-2 border-b border-navy-700 last:border-0"><div><div className="text-slate-200">{p.name}</div><div className="text-[11px] text-slate-500">{p.terminal} · {p.shift}{b ? ` · with ${b.pax}` : ""}</div></div>
                <span className={`text-xs ${!on ? "text-slate-500" : b ? "text-yellow-400" : "text-green-400"}`}>{!on ? p.status : b ? <><Hourglass className="inline w-3 h-3 mr-1" />Busy</> : "Free"}</span></div>); })}
            {isAdmin && <button onClick={() => setPage("staff")} className="mt-3 text-xs text-sky-400 hover:underline">Manage who is on this team →</button>}</>)}
        </Card>
      </div>
    </div>
  );
}
