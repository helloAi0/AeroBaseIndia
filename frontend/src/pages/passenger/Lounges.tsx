import { useState } from "react";
import { Armchair, Crown, CheckCircle2, Clock } from "lucide-react";
import { useCollection } from "../../hooks/useCollection";
import { useAirport } from "../../hooks/useAirport";
import { COMMON_RULES, LOUNGES, METHODS, WALK_IN, type Method } from "../../data/lounges";
const rs = (n: number) => "₹" + n.toLocaleString("en-IN");
import { Card, PageHead } from "../../components/ui/PageHead";

interface Pass { type: string; status: string; date?: string; flight?: string; notes?: string }
const inp = "bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-white text-sm min-w-0 outline-none focus:border-sky-500";

/** Lounge finder, how to get in, a visit request the airport team approves, and Pro membership (10% off fares). */
export function Lounges() {
  const { code, name } = useAirport(); const col = useCollection<Pass>("passes", []); const list = col.items as (Pass & { id: string })[];
  const lounges = LOUNGES[code] ?? []; const [method, setMethod] = useState<Method>("bank"); const [msg, setMsg] = useState("");
  const [f, setF] = useState({ lounge: "", flight: "", date: new Date().toISOString().slice(0, 10) });
  const pro = list.find(p => p.type === "Pro membership" && p.status !== "Rejected");
  const rule = METHODS.find(m => m.id === method)!;
  const request = async () => { setMsg(""); if (!f.flight.trim()) return setMsg("Enter your flight number, for example AI-101.");
    const ok = await col.add({ type: "Lounge access", status: "Requested", flight: f.flight.trim().toUpperCase(), date: f.date, notes: `${f.lounge || lounges[0]?.name || "Lounge"} · ${rule.label}` } as Pass); setMsg(ok ? "Request sent. The airport team will confirm it." : ""); };
  const joinPro = async () => { const ok = await col.add({ type: "Pro membership", status: "Requested", date: new Date().toISOString().slice(0, 10), notes: "10% off fares" } as Pass); setMsg(ok ? "Pro request sent. Once approved, fares drop by 10%." : ""); };
  return (
    <div className="space-y-6">
      <PageHead title="Lounges & Pro" sub={`Lounges at ${name}, how to get in, and your membership.`} />
      <Card><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><Crown className="w-5 h-5 text-amber-300" /><div><div className="text-white font-semibold">Pro membership</div><div className="text-xs text-slate-400">10% off every ticket you book in My Trips.</div></div></div>
        {pro ? <span className={`text-xs px-3 py-1.5 rounded-full border ${pro.status === "Approved" ? "text-green-300 border-green-500/30" : "text-yellow-300 border-yellow-500/40"}`}>{pro.status === "Approved" ? "Active" : "Waiting for approval"}</span> : <button onClick={() => void joinPro()} className="text-sm px-4 py-2 rounded-lg bg-amber-500 text-black font-semibold">Request Pro</button>}</div></Card>
      <div className="grid lg:grid-cols-2 gap-4">
        <Card><div className="flex items-center gap-2 text-white font-semibold mb-3"><Armchair className="w-4 h-4" />Lounges at {code}</div>
          {lounges.length === 0 ? <div className="text-sm text-slate-400">No lounge listed for this airport yet.</div> : <div className="space-y-2">{lounges.map((l, i) => <div key={i} className="rounded-xl border border-navy-600 bg-navy-900 p-3 flex justify-between gap-2"><div><div className="text-sm text-white">{l.name}</div><div className="text-xs text-slate-400">{l.operator} · {l.terminal} · {l.zone}</div></div><div className="text-xs text-slate-500 inline-flex items-center gap-1"><Clock className="w-3 h-3" />{l.hours}</div></div>)}</div>}
          {lounges.length > 0 && <div className="text-xs text-slate-400 mt-3">Walk-in rate: {rs(WALK_IN.domestic)} domestic, {rs(WALK_IN.international)} international, for {WALK_IN.hours} hours (published operator rate; it can change).</div>}</Card>
        <Card><div className="text-white font-semibold mb-3">How will you get in?</div>
          <div className="flex flex-wrap gap-2 mb-3">{METHODS.map(m => <button key={m.id} onClick={() => setMethod(m.id)} className={`text-xs px-3 py-1.5 rounded-full border ${method === m.id ? "border-sky-500 text-sky-300 bg-sky-500/10" : "border-navy-600 text-slate-300"}`}>{m.label}</button>)}</div>
          <p className="text-sm text-slate-300">{rule.rule}</p>
          <ul className="mt-3 space-y-1">{COMMON_RULES.map(r => <li key={r} className="text-xs text-slate-400 flex gap-2"><CheckCircle2 className="w-3 h-3 mt-0.5 text-sky-400 shrink-0" />{r}</li>)}</ul>
          <div className="text-[11px] text-slate-500 mt-3">Card charges and quotas differ by bank and change. Confirm with your card issuer before you travel.</div></Card></div>
      <Card><div className="text-white font-semibold mb-3">Ask the airport team to add you to a lounge</div>
        <div className="grid sm:grid-cols-4 gap-2"><select className={inp} value={f.lounge} onChange={e => setF({ ...f, lounge: e.target.value })} aria-label="Lounge">{lounges.map((l, i) => <option key={i}>{l.name} {l.terminal}</option>)}</select>
          <input className={inp} placeholder="Flight, e.g. AI-101" value={f.flight} onChange={e => setF({ ...f, flight: e.target.value })} aria-label="Flight" /><input type="date" className={inp} value={f.date} onChange={e => setF({ ...f, date: e.target.value })} aria-label="Date" />
          <button onClick={() => void request()} className="px-4 py-2 rounded-lg bg-sky-500 text-white text-sm font-semibold">Send request</button></div>
        {msg && <div className="text-sm text-green-300 mt-2">{msg}</div>}{col.error && <div className="text-sm text-red-400 mt-2">{col.error}</div>}</Card>
      <Card><div className="text-white font-semibold mb-3">Your requests</div>{list.length === 0 ? <div className="text-sm text-slate-400">Nothing yet.</div> : <div className="space-y-2">{list.map(p => <div key={p.id} className="text-sm flex justify-between border-b border-navy-700 pb-2"><span className="text-slate-200">{p.type}{p.notes ? ` · ${p.notes}` : ""}{p.flight ? ` · ${p.flight}` : ""}</span><span className="text-slate-400">{p.status}</span></div>)}</div>}</Card>
    </div>);
}
