import { useMemo, useState } from "react";
import { Copy, KeyRound, Trash2 } from "lucide-react";
import { useCollection } from "../../hooks/useCollection";
import { useBoard } from "../../hooks/useBoard";
import { useAuthStore } from "../../store/authStore";
import { Card, PageHead, Stat } from "../../components/ui/PageHead";

interface Crew { name: string; license: string; rank: string; airline: string; aircraft?: string; flights?: string; base?: string; refId: string; status: string; claimedName?: string }
const RANKS = ["Captain", "First Officer", "Cabin crew"];
const inp = "bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-white text-sm min-w-0 outline-none focus:border-sky-500 w-full";
const tone = (s: string) => s === "Active" ? "text-green-300 border-green-500/30" : s === "Left" ? "text-slate-400 border-navy-600" : "text-yellow-300 border-yellow-500/40";

/** The airline's operations team issues crew reference IDs. The pilot verifies with name + licence + ID, and their assignment follows the record. */
export function AirlineCrew() {
  const sl = useAuthStore(s => s.user?.staffLevel) ?? ""; const code = sl.startsWith("airline_") ? sl.split("_").pop()!.toUpperCase() : "";
  const col = useCollection<Crew>("crew", []); const items = col.items as (Crew & { id: string })[]; const { flights } = useBoard();
  const types = useMemo(() => Array.from(new Set(flights.filter(f => !code || f.airCode === code).map(f => f.aircraft).filter(Boolean))).sort(), [flights, code]);
  const [f, setF] = useState({ name: "", license: "", rank: RANKS[0], aircraft: "", flights: "", base: "" }); const [copied, setCopied] = useState(false);
  const submit = async (e: React.FormEvent) => { e.preventDefault(); 
    const ok = await col.add({ ...f, name: f.name.trim(), license: f.license.trim().toUpperCase(), flights: f.flights.trim().toUpperCase(), airline: code } as never);
    if (ok) setF({ ...f, name: "", license: "", flights: "" }); };
  const latest = [...(items as (Crew & { id: string; created_at?: string })[])].sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? "")).find(i => i.status === "Unclaimed");
  const n = (s: string) => items.filter(i => i.status === s).length;
  const copy = (t: string) => { void navigator.clipboard?.writeText(t); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  return (
    <div className="space-y-6">
      <PageHead title="Crew & Reference IDs" sub={`Issue a reference ID to each pilot or crew member of ${code || "your airline"}. They use it, with their licence number, to join.`} note="A reference ID can be used once. If someone leaves, set them to Left; when they join another airline, that airline issues them a new ID and their assignment moves with it." />
      <div className="grid grid-cols-3 gap-4"><Stat label="Active crew" value={n("Active")} tone="text-green-400" /><Stat label="Waiting to join" value={n("Unclaimed")} tone={n("Unclaimed") ? "text-yellow-400" : "text-white"} /><Stat label="Left" value={n("Left")} /></div>
      <Card><div className="text-white font-semibold mb-3 flex items-center gap-2"><KeyRound className="w-4 h-4" />Issue a reference ID</div>
        <form onSubmit={submit} className="grid md:grid-cols-6 gap-3">
          <input className={inp + " md:col-span-2"} placeholder="Full name (as on licence)" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} required aria-label="Full name" />
          <input className={inp} placeholder="Licence no." value={f.license} onChange={e => setF({ ...f, license: e.target.value })} required aria-label="Licence number" />
          <select className={inp} value={f.rank} onChange={e => setF({ ...f, rank: e.target.value })} aria-label="Rank">{RANKS.map(r => <option key={r}>{r}</option>)}</select>
          <input className={inp} placeholder="Aircraft" list="ac-types" value={f.aircraft} onChange={e => setF({ ...f, aircraft: e.target.value })} aria-label="Aircraft" /><datalist id="ac-types">{types.map(t => <option key={t} value={t} />)}</datalist>
          <input className={inp} placeholder="Base e.g. DEL" value={f.base} onChange={e => setF({ ...f, base: e.target.value.toUpperCase() })} maxLength={4} aria-label="Base" />
          <input className={inp + " md:col-span-5"} placeholder="Assigned flights, comma separated (e.g. AI-101, AI-102)" value={f.flights} onChange={e => setF({ ...f, flights: e.target.value })} aria-label="Assigned flights" />
          <button className="px-4 py-2 rounded-lg bg-sky-500 text-white text-sm font-semibold">Issue ID</button></form>
        {col.error && <div className="text-xs text-red-400 mt-2">{col.error}</div>}
        {latest && <div className="mt-3 rounded-xl border border-sky-500/30 bg-sky-500/5 p-3 text-sm text-slate-200 flex flex-wrap items-center justify-between gap-2"><span>Latest ID: <b className="font-mono">{latest.refId}</b> for {latest.name}. Share it with them securely.</span><button type="button" onClick={() => copy(latest.refId)} className="text-xs text-sky-300 inline-flex items-center gap-1"><Copy className="w-3 h-3" />{copied ? "Copied" : "Copy"}</button></div>}</Card>
      <Card className="overflow-x-auto">{items.length === 0 ? <div className="text-sm text-slate-400 text-center py-6">No crew yet.</div> :
        <table className="w-full text-sm min-w-[720px]"><thead><tr className="text-left text-xs text-slate-400 border-b border-navy-600"><th className="p-2">Name</th><th className="p-2">Reference ID</th><th className="p-2">Rank</th><th className="p-2">Aircraft</th><th className="p-2">Flights</th><th className="p-2">Status</th><th className="p-2" /></tr></thead><tbody>
          {items.map(c => <tr key={c.id} className="border-b border-navy-700 text-slate-200"><td className="p-2">{c.name}<div className="text-[11px] text-slate-500">{c.license}</div></td><td className="p-2 font-mono text-xs">{c.refId}</td><td className="p-2">{c.rank}</td>
            <td className="p-2"><input className={inp + " !py-1 text-xs !w-32"} defaultValue={c.aircraft ?? ""} onBlur={e => e.target.value !== (c.aircraft ?? "") && void col.update(c.id, { aircraft: e.target.value })} aria-label={`Aircraft for ${c.name}`} /></td>
            <td className="p-2"><input className={inp + " !py-1 text-xs !w-40"} defaultValue={c.flights ?? ""} onBlur={e => e.target.value.toUpperCase() !== (c.flights ?? "") && void col.update(c.id, { flights: e.target.value.toUpperCase() })} aria-label={`Flights for ${c.name}`} /></td>
            <td className="p-2"><span className={`text-xs px-2 py-0.5 rounded-full border ${tone(c.status)}`}>{c.status}</span></td>
            <td className="p-2 text-right whitespace-nowrap">{c.status === "Active" && <button onClick={() => confirm(`Mark ${c.name} as left ${code}?`) && void col.update(c.id, { status: "Left" })} className="text-xs text-yellow-400 mr-3">Mark left</button>}
              {c.status === "Unclaimed" && <button aria-label={`Delete ${c.name}`} onClick={() => confirm(`Cancel the ID for ${c.name}?`) && void col.remove(c.id)} className="text-red-400"><Trash2 className="w-4 h-4" /></button>}</td></tr>)}</tbody></table>}</Card>
    </div>
  );
}
