import { useMemo, useState } from "react";
import { Luggage, Search, ArrowRight, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useCollection } from "../../hooks/useCollection";
import { useBoard } from "../../hooks/useBoard";
import { useAuthStore } from "../../store/authStore";
import { Card, PageHead, Stat } from "../../components/ui/PageHead";

interface Bag { tag: string; flight: string; passenger: string; status: string; belt?: string; weight_kg?: number; ref?: string }
const FLOW = ["Checked in", "Screened", "Loaded", "In transit", "At belt", "Delivered"];
const inp = "bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-white text-sm min-w-0 outline-none focus:border-sky-500";
const tone = (s: string) => s === "Delivered" ? "text-green-300 border-green-500/30" : s === "Delayed" || s === "Lost" ? "text-red-300 border-red-500/40" : "text-sky-300 border-sky-500/30";

export function BaggagePage() {
  const role = useAuthStore(s => s.user?.role); const name = useAuthStore(s => s.user?.name) ?? "";
  const isPax = role === "passenger"; const canHandle = role === "airport_admin" || role === "superadmin" || role === "staff";
  const col = useCollection<Bag>("baggage", []); const { flights } = useBoard();
  const [q, setQ] = useState(""); const [filter, setFilter] = useState("All"); const [f, setF] = useState({ tag: "", flight: "" }); const [msg, setMsg] = useState("");
  const bags = col.items;
  const count = (s: string) => bags.filter(b => b.status === s).length;
  const shown = useMemo(() => bags.filter(b => (filter === "All" || b.status === filter) && (!q || `${b.tag ?? ""} ${b.flight ?? ""} ${b.passenger ?? ""}`.toLowerCase().includes(q.toLowerCase()))), [bags, filter, q]);
  const byFlight = useMemo(() => { const m = new Map<string, Bag[]>(); bags.forEach(b => { const k = b.flight || "—"; m.set(k, [...(m.get(k) ?? []), b]); }); return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0])); }, [bags]);
  const advance = (b: Bag & { id: string }) => { const i = FLOW.indexOf(b.status); if (i >= 0 && i < FLOW.length - 1) void col.update(b.id, { status: FLOW[i + 1] }); };

  const register = async (e: React.FormEvent) => {
    e.preventDefault(); if (!/^\d{6,12}$/.test(f.tag.trim())) { setMsg("Bag tag is the 6–12 digit number on your baggage receipt."); return; }
    const ok = await col.add({ tag: f.tag.trim(), flight: f.flight.trim().toUpperCase(), passenger: name || "Passenger" } as never);
    if (ok) { setF({ tag: "", flight: "" }); setMsg("Bag added. Its status updates as handlers scan it."); }
  };

  if (isPax) return (
    <div className="space-y-6 max-w-2xl">
      <PageHead title="My Bags" sub="Add the tag number from your baggage receipt and follow each bag from check-in to the belt." />
      {msg && <div className="text-sm text-sky-300">{msg}</div>}
      <Card><form onSubmit={register} className="grid sm:grid-cols-3 gap-3">
        <input className={inp} placeholder="Bag tag number" value={f.tag} onChange={e => setF({ ...f, tag: e.target.value })} inputMode="numeric" aria-label="Bag tag" required />
        <input className={inp} placeholder="Flight e.g. AI-101" list="bflt" value={f.flight} onChange={e => setF({ ...f, flight: e.target.value })} aria-label="Flight" required />
        <button className="px-4 py-2 rounded-lg bg-sky-500 text-white text-sm font-semibold">Add bag</button>
        <datalist id="bflt">{flights.slice(0, 200).map(x => <option key={x.id} value={x.flight} />)}</datalist></form></Card>
      {col.error && <div className="text-xs text-red-400">{col.error}</div>}
      {bags.length === 0 && <Card><div className="text-sm text-slate-400 text-center py-4"><Luggage className="w-6 h-6 mx-auto mb-2" />You haven't added any bags yet.</div></Card>}
      {bags.map(b => { const i = FLOW.indexOf(b.status); const fi = flights.find(x => x.flight === b.flight);
        return (<Card key={(b as Bag & { id: string }).id}><div className="flex justify-between items-center gap-3"><div><div className="text-white font-mono">{b.tag}</div><div className="text-xs text-slate-400">{b.flight}{fi ? ` · gate ${fi.gate}` : ""}{b.belt ? ` · ${b.belt}` : ""}</div></div><span className={`text-xs px-2 py-1 rounded-full border ${tone(b.status)}`}>{b.status}</span></div>
          <div className="flex gap-1 mt-3">{FLOW.map((s, k) => <div key={s} title={s} className={`h-1.5 flex-1 rounded-full ${k <= i ? "bg-sky-500" : "bg-navy-700"}`} />)}</div>
          {(b.status === "Delayed" || b.status === "Lost") && <div className="text-xs text-red-300 mt-2 flex gap-1 items-center"><AlertTriangle className="w-3 h-3" />Please visit the baggage service desk with your receipt.</div>}</Card>); })}
    </div>);

  return (
    <div className="space-y-6">
      <PageHead title="Baggage Handling" sub="Every bag from check-in to the belt. Handlers move a bag to its next step; anything delayed or lost is flagged here." />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Bags tracked" value={bags.length} sub={`${byFlight.length} flights`} />
        <Stat label="In handling" value={bags.length - count("Delivered") - count("Delayed") - count("Lost")} sub="before delivery" tone="text-sky-400" />
        <Stat label="Delivered" value={count("Delivered")} tone="text-green-400" />
        <Stat label="Delayed / lost" value={count("Delayed") + count("Lost")} tone={count("Delayed") + count("Lost") ? "text-red-400" : "text-slate-300"} sub={count("Delayed") + count("Lost") ? "needs follow-up" : "none"} />
      </div>
      <Card><div className="text-xs text-slate-400 mb-2">Pipeline — click a step to filter</div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">{FLOW.map(s => <button key={s} onClick={() => setFilter(filter === s ? "All" : s)} className={`rounded-lg p-3 text-left border ${filter === s ? "border-sky-500 bg-navy-700" : "border-navy-600 bg-navy-800"}`}><div className="text-xl text-white font-semibold">{count(s)}</div><div className="text-[11px] text-slate-400">{s}</div></button>)}</div>
        <div className="flex gap-2 mt-3">{["Delayed", "Lost"].map(s => <button key={s} onClick={() => setFilter(filter === s ? "All" : s)} className={`text-xs px-3 py-1.5 rounded-lg border ${filter === s ? "border-red-500 text-red-300" : "border-navy-600 text-slate-300"}`}>{s} ({count(s)})</button>)}{filter !== "All" && <button onClick={() => setFilter("All")} className="text-xs text-sky-400">Clear</button>}</div></Card>
      <div className="relative max-w-md"><Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" /><input className={inp + " w-full !pl-9"} placeholder="Search tag, flight or passenger" value={q} onChange={e => setQ(e.target.value)} aria-label="Search bags" /></div>
      {col.error && <div className="text-xs text-red-400">{col.error}</div>}
      <Card className="overflow-x-auto">
        {shown.length === 0 ? <div className="text-sm text-slate-400 text-center py-6">{bags.length === 0 ? "No bags yet. Passengers add their tags under My Bags; staff can also add bags from check-in." : "No bags match."}</div> :
          <table className="w-full text-sm min-w-[620px]"><thead><tr className="text-left text-xs text-slate-400 border-b border-navy-600"><th className="p-2">Tag</th><th className="p-2">Flight</th><th className="p-2">Passenger</th><th className="p-2">Location</th><th className="p-2">Status</th><th className="p-2" /></tr></thead>
            <tbody>{shown.slice(0, 100).map(b => { const bb = b as Bag & { id: string }; const i = FLOW.indexOf(b.status);
              return (<tr key={bb.id} className="border-b border-navy-700 text-slate-200"><td className="p-2 font-mono">{b.tag}</td><td className="p-2">{b.flight}</td><td className="p-2">{b.passenger}</td><td className="p-2 text-slate-400">{b.belt || "—"}</td>
                <td className="p-2"><span className={`text-xs px-2 py-0.5 rounded-full border ${tone(b.status)}`}>{b.status}</span></td>
                <td className="p-2 text-right whitespace-nowrap">{canHandle && i >= 0 && i < FLOW.length - 1 && <button onClick={() => advance(bb)} className="text-xs px-2.5 py-1.5 rounded-lg bg-sky-500 text-white inline-flex items-center gap-1">{FLOW[i + 1]} <ArrowRight className="w-3 h-3" /></button>}
                  {canHandle && b.status !== "Delayed" && b.status !== "Lost" && b.status !== "Delivered" && <button onClick={() => void col.update(bb.id, { status: "Delayed" })} className="text-xs ml-2 text-yellow-400">Flag delayed</button>}
                  {canHandle && (b.status === "Delayed" || b.status === "Lost") && <button onClick={() => void col.update(bb.id, { status: "Delivered" })} className="text-xs text-green-400 inline-flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Resolved</button>}</td></tr>); })}</tbody></table>}
      </Card>
      {byFlight.length > 0 && <Card><div className="text-white font-semibold mb-3">By flight</div><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{byFlight.slice(0, 12).map(([fl, list]) => { const d = list.filter(x => x.status === "Delivered").length;
        return <div key={fl} className="rounded-lg border border-navy-600 p-3"><div className="flex justify-between text-sm"><span className="font-mono text-slate-200">{fl}</span><span className="text-slate-400">{list.length} bags</span></div><div className="h-1.5 bg-navy-700 rounded-full mt-2 overflow-hidden"><div className="h-full bg-green-500" style={{ width: `${d / list.length * 100}%` }} /></div><div className="text-[11px] text-slate-500 mt-1">{d} delivered</div></div>; })}</div></Card>}
    </div>
  );
}
