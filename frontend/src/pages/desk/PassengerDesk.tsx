import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Search, ArrowRight, BadgeCheck } from "lucide-react";
import { api } from "../../api/client";
import { useCollection } from "../../hooks/useCollection";
import { useAuthStore } from "../../store/authStore";
import { STAGES, hhmm, inr, stageIndex, type Booking } from "../../lib/booking";
import { Card, PageHead, Stat } from "../../components/ui/PageHead";

const inp = "bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-white text-sm min-w-0 outline-none focus:border-sky-500 w-full";

/** Airport desk and airline view of bookings: move each traveller through check-in, bag drop, security and boarding; confirm payment. */
export function PassengerDesk() {
  const qc = useQueryClient(); const user = useAuthStore(s => s.user); const sl = user?.staffLevel ?? "";
  const airline = sl.startsWith("airline_"); const desk = !airline;   // airline staff confirm payment; airport staff run the stages
  const col = useCollection<Booking>("bookings", []); const list = col.items as Booking[];
  const [q, setQ] = useState(""); const [err, setErr] = useState("");
  const shown = useMemo(() => list.filter(b => b.status === "Confirmed" && (!q || `${b.pnr} ${b.flight} ${b.travellers.map(t => t.name).join(" ")}`.toLowerCase().includes(q.toLowerCase()))), [list, q]);
  const all = list.filter(b => b.status === "Confirmed").flatMap(b => b.travellers);
  const n = (s: string) => all.filter(t => t.stage === s).length;
  const act = async (id: string, body: object) => { setErr(""); try { await api.put(`/api/records/bookings/${id}`, body); await qc.invalidateQueries({ queryKey: ["records", "bookings"] }); } catch (e: any) { setErr(e?.response?.data?.error ?? "Could not update"); } };
  return (
    <div className="space-y-6">
      <PageHead title={airline ? "Bookings" : "Passenger Desk"} sub={airline ? "Your airline's bookings. Confirm payment once it is received." : "Move travellers through check-in, bag drop, security and boarding."} />
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4"><Stat label="Travellers" value={all.length} /><Stat label="Checked in" value={n("Checked in")} /><Stat label="Bags dropped" value={n("Bag dropped")} /><Stat label="Security cleared" value={n("Security cleared")} /><Stat label="Boarded" value={n("Boarded")} tone="text-green-400" /></div>
      <div className="relative max-w-md"><Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" /><input className={inp + " !pl-9"} placeholder="Search PNR, flight or passenger name" value={q} onChange={e => setQ(e.target.value)} aria-label="Search bookings" /></div>
      {err && <div className="text-sm text-red-400">{err}</div>}{col.error && <div className="text-xs text-red-400">{col.error}</div>}
      {shown.length === 0 && <Card><div className="text-sm text-slate-400 text-center py-6">No bookings {q ? "match" : "yet"}. They appear as passengers book from <b>My Trips</b>.</div></Card>}
      {shown.map(b => (<Card key={b.id}><div className="flex flex-wrap justify-between gap-3"><div><div className="text-white"><span className="font-mono">{b.flight}</span> · {b.origin} → {b.destination} <span className="text-slate-400 text-sm">· dep {hhmm(b.dep)} · gate {b.gate || "—"} · PNR <span className="font-mono">{b.pnr}</span></span></div>
        <div className="text-xs text-slate-400 mt-1">Booked by {b.bookedBy} · {b.travellers.length} traveller{b.travellers.length > 1 ? "s" : ""} · fare {inr(b.fare.total)}</div></div>
        <div className="flex items-center gap-2"><span className={`text-xs px-2 py-1 rounded-full border ${b.payment === "Paid" ? "text-green-300 border-green-500/30" : "text-yellow-300 border-yellow-500/40"}`}>{b.payment}</span>
          {b.payment === "Unpaid" ? <button onClick={() => void act(b.id, { action: "payment", payment: "Paid" })} className="text-xs px-3 py-2 rounded-lg bg-green-600 text-white inline-flex items-center gap-1"><BadgeCheck className="w-3 h-3" />Mark paid</button> : <button onClick={() => confirm("Mark as unpaid?") && void act(b.id, { action: "payment", payment: "Unpaid" })} className="text-xs text-slate-400">Undo</button>}</div></div>
        <div className="mt-3 grid md:grid-cols-2 gap-2">{b.travellers.map((t, i) => { const si = stageIndex(t.stage); const next = STAGES[si + 1];
          return (<div key={i} className="rounded-xl border border-navy-600 bg-navy-900 p-3 flex items-center justify-between gap-2"><div className="min-w-0"><div className="text-sm text-slate-200 truncate">{t.name}</div><div className="text-[11px] text-slate-500">Seat {t.seat} · {t.stage}</div></div>
            {desk && next && <button onClick={() => void act(b.id, { action: "stage", index: i, stage: next })} className="text-xs px-3 py-1.5 rounded-lg bg-sky-500 text-white inline-flex items-center gap-1 whitespace-nowrap">{next}<ArrowRight className="w-3 h-3" /></button>}
            {!next && <span className="text-xs text-green-400">Boarded</span>}</div>); })}</div></Card>))}
    </div>
  );
}
