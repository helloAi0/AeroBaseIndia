import { useCallback, useEffect, useMemo, useState } from "react";
import { Send, CheckCircle2, Radio, UserPlus, Mail } from "lucide-react";
import { useCollection } from "../../hooks/useCollection";
import { useAuthStore } from "../../store/authStore";
import { securityTeam, addTeamMember, type Officer } from "../../api/account";
import { Card, PageHead, Stat } from "../../components/ui/PageHead";

interface Dispatch { toId: string; toName: string; to: string; text: string; zone: string; priority: "High" | "Medium" | "Low"; status: "New" | "Acknowledged" | "Resolved"; from?: string; response?: string; created_at?: string }
const ZONES = ["Check-in", "Security screening", "Gates", "Arrivals", "Toilets / washrooms", "Kerbside", "Parking", "Other"];
const inp = "bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-white text-sm min-w-0 outline-none focus:border-sky-500 w-full";
const prTone = (p: string) => p === "High" ? "text-red-300 border-red-500/40" : p === "Medium" ? "text-yellow-300 border-yellow-500/40" : "text-slate-300 border-navy-600";
const stTone = (s: string) => s === "Resolved" ? "text-green-300 border-green-500/30" : s === "Acknowledged" ? "text-sky-300 border-sky-500/30" : "text-yellow-300 border-yellow-500/40";
const ago = (iso?: string) => { if (!iso) return ""; const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000)); return m < 1 ? "just now" : m < 60 ? `${m} min ago` : `${Math.round(m / 60)} h ago`; };
const genPw = () => { const c = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"; const a = new Uint32Array(12); crypto.getRandomValues(a); return Array.from(a, n => c[n % c.length]).join("") + "7"; };

export function SecurityCommand() {
  const sl = useAuthStore(s => s.user?.staffLevel); const role = useAuthStore(s => s.user?.role);
  const commander = sl === "staff_security_head" || role === "airport_admin" || role === "superadmin";
  const col = useCollection<Dispatch>("dispatch", []); const items = col.items as (Dispatch & { id: string })[];
  const [officers, setOfficers] = useState<Officer[]>([]); const [err, setErr] = useState(""); const [ok, setOk] = useState("");
  const [f, setF] = useState({ toId: "", zone: ZONES[0], priority: "Medium" as Dispatch["priority"], text: "" });
  const [np, setNp] = useState({ name: "", email: "", password: genPw() }); const [showAdd, setShowAdd] = useState(false);
  const [resp, setResp] = useState<Record<string, string>>({});
  const load = useCallback(() => { if (commander) securityTeam().then(setOfficers).catch(e => setErr(e.message)); }, [commander]);
  useEffect(() => { load(); }, [load]);
  const crew = officers.filter(o => !o.head);
  const open = (id: string) => items.filter(i => i.toId === id && i.status !== "Resolved").length;
  const count = (s: string) => items.filter(i => i.status === s).length;
  const sorted = useMemo(() => [...items].sort((a, b) => Number(a.status === "Resolved") - Number(b.status === "Resolved") || (a.priority === "High" ? -1 : 0) - (b.priority === "High" ? -1 : 0) || (b.created_at ?? "").localeCompare(a.created_at ?? "")), [items]);

  const send = async (e: React.FormEvent) => { e.preventDefault(); setErr(""); setOk(""); const o = crew.find(x => x.id === f.toId); if (!o || !f.text.trim()) return;
    const done = await col.add({ toId: o.id, toName: o.name, to: o.ref, text: f.text.trim(), zone: f.zone, priority: f.priority } as never); if (done) { setOk(`Sent to ${o.name} (${o.ref}).`); setF({ ...f, text: "" }); } };
  const addOfficer = async (e: React.FormEvent) => { e.preventDefault(); setErr(""); try { await addTeamMember({ ...np, role: "SECURITY_OFFICER" }); setOk(`${np.name} added. Share the temporary password securely.`); setNp({ name: "", email: "", password: genPw() }); load(); } catch (x) { setErr(x instanceof Error ? x.message : "Could not add"); } };

  /* ───── Officer view ───── */
  if (!commander) return (
    <div className="space-y-6 max-w-3xl">
      <PageHead title="My Instructions" sub="Tasks from your security head. Acknowledge when you start and mark resolved when done." />
      <div className="grid grid-cols-3 gap-4"><Stat label="New" value={count("New")} tone={count("New") ? "text-yellow-400" : "text-white"} /><Stat label="Acknowledged" value={count("Acknowledged")} /><Stat label="Resolved" value={count("Resolved")} tone="text-green-400" /></div>
      {col.error && <div className="text-xs text-red-400">{col.error}</div>}
      {sorted.length === 0 && <Card><div className="text-sm text-slate-400 text-center py-6"><CheckCircle2 className="w-6 h-6 text-green-400 mx-auto mb-2" />No instructions right now.</div></Card>}
      {sorted.map(i => <Card key={i.id}><div className="flex flex-wrap justify-between gap-3"><div className="min-w-0"><div className="text-white">{i.text}</div><div className="text-xs text-slate-400 mt-1">{i.zone} · from {i.from ?? "Security head"} · {ago(i.created_at)}</div>{i.response && <div className="text-xs text-sky-300 mt-1">Your note: {i.response}</div>}</div>
        <div className="flex items-center gap-2"><span className={`text-xs px-2 py-0.5 rounded-full border ${prTone(i.priority)}`}>{i.priority}</span><span className={`text-xs px-2 py-0.5 rounded-full border ${stTone(i.status)}`}>{i.status}</span></div></div>
        {i.status !== "Resolved" && <div className="flex flex-wrap gap-2 mt-3">
          {i.status === "New" && <button onClick={() => void col.update(i.id, { status: "Acknowledged" })} className="text-xs px-3 py-2 rounded-lg bg-sky-500 text-white">Acknowledge</button>}
          <input className={inp + " !w-56 text-xs"} placeholder="Add a note (optional)" value={resp[i.id] ?? ""} onChange={e => setResp({ ...resp, [i.id]: e.target.value })} aria-label="Note" maxLength={200} />
          <button onClick={() => void col.update(i.id, { status: "Resolved", response: resp[i.id] || undefined })} className="text-xs px-3 py-2 rounded-lg bg-green-600 text-white">Mark resolved</button></div>}</Card>)}
    </div>);

  /* ───── Security head / director view ───── */
  return (
    <div className="space-y-6">
      <PageHead title="Security Command" sub="Your officers by reference ID, and the instructions you have sent them." note="Every officer has a reference ID (SEC-…). Instructions reach them instantly on their own My Instructions page." />
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4"><Stat label="Officers" value={crew.length} /><Stat label="Waiting" value={count("New")} tone={count("New") ? "text-yellow-400" : "text-white"} sub="not yet acknowledged" /><Stat label="In progress" value={count("Acknowledged")} /><Stat label="Resolved" value={count("Resolved")} tone="text-green-400" /></div>
      {ok && <div className="text-sm text-green-300">{ok}</div>}{err && <div className="text-sm text-red-400">{err}</div>}
      <div className="grid xl:grid-cols-3 gap-5">
        <Card className="xl:col-span-2"><div className="text-white font-semibold mb-3 flex items-center gap-2"><Radio className="w-4 h-4" />Send an instruction</div>
          <form onSubmit={send} className="grid sm:grid-cols-3 gap-3">
            <select className={inp} value={f.toId} onChange={e => setF({ ...f, toId: e.target.value })} required aria-label="Officer"><option value="">Choose officer…</option>{crew.map(o => <option key={o.id} value={o.id}>{o.name} · {o.ref}{open(o.id) ? ` (${open(o.id)} open)` : ""}</option>)}</select>
            <select className={inp} value={f.zone} onChange={e => setF({ ...f, zone: e.target.value })} aria-label="Zone">{ZONES.map(z => <option key={z}>{z}</option>)}</select>
            <select className={inp} value={f.priority} onChange={e => setF({ ...f, priority: e.target.value as Dispatch["priority"] })} aria-label="Priority">{["High", "Medium", "Low"].map(z => <option key={z}>{z}</option>)}</select>
            <textarea className={inp + " sm:col-span-3 h-20"} placeholder="e.g. Rohan, go to the toilets near gate B4 — two passengers are arguing. Please calm things down." value={f.text} onChange={e => setF({ ...f, text: e.target.value })} required maxLength={300} aria-label="Instruction" />
            <button className="sm:col-span-3 px-4 py-2.5 rounded-xl bg-sky-500 text-white text-sm font-semibold inline-flex items-center justify-center gap-2"><Send className="w-4 h-4" />Send instruction</button></form></Card>
        <Card><div className="flex justify-between items-center mb-3"><div className="text-white font-semibold">Officers</div><button onClick={() => setShowAdd(!showAdd)} className="text-xs text-sky-400 inline-flex items-center gap-1"><UserPlus className="w-3 h-3" />Add</button></div>
          {showAdd && <form onSubmit={addOfficer} className="space-y-2 mb-3 pb-3 border-b border-navy-700"><input className={inp} placeholder="Full name" value={np.name} onChange={e => setNp({ ...np, name: e.target.value })} required aria-label="Officer name" /><input className={inp} type="email" placeholder="Email" value={np.email} onChange={e => setNp({ ...np, email: e.target.value })} required aria-label="Officer email" /><input className={inp + " font-mono"} value={np.password} onChange={e => setNp({ ...np, password: e.target.value })} aria-label="Temporary password" /><button className="w-full px-3 py-2 rounded-lg bg-sky-500 text-white text-sm">Add officer</button></form>}
          {crew.length === 0 && <div className="text-sm text-slate-400">No officers yet.</div>}
          {crew.map(o => <div key={o.id} className="py-2 border-b border-navy-700 last:border-0"><div className="flex justify-between text-sm"><span className="text-slate-200">{o.name}</span><span className={`text-xs ${open(o.id) ? "text-yellow-400" : "text-green-400"}`}>{open(o.id) ? `${open(o.id)} open` : "Free"}</span></div>
            <div className="text-[11px] text-slate-500 flex items-center gap-2"><span className="font-mono">{o.ref}</span><a href={`mailto:${o.email}`} className="inline-flex items-center gap-1 hover:text-sky-400"><Mail className="w-3 h-3" />{o.email}</a></div></div>)}</Card></div>
      <div className="space-y-3"><div className="text-white font-semibold">Instructions</div>
        {sorted.length === 0 && <Card><div className="text-sm text-slate-400">Nothing sent yet.</div></Card>}
        {sorted.map(i => <Card key={i.id}><div className="flex flex-wrap justify-between gap-3"><div className="min-w-0"><div className="text-white">{i.text}</div><div className="text-xs text-slate-400 mt-1">To {i.toName} <span className="font-mono">({i.to})</span> · {i.zone} · {ago(i.created_at)}</div>{i.response && <div className="text-xs text-sky-300 mt-1">Reply: {i.response}</div>}</div>
          <div className="flex items-start gap-2"><span className={`text-xs px-2 py-0.5 rounded-full border ${prTone(i.priority)}`}>{i.priority}</span><span className={`text-xs px-2 py-0.5 rounded-full border ${stTone(i.status)}`}>{i.status}</span></div></div></Card>)}</div>
    </div>
  );
}
