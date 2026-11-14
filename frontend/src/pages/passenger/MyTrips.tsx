import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plane, Plus, X, Users, Copy, CheckCircle2, ChevronDown } from "lucide-react";
import { api } from "../../api/client";
import { useCollection } from "../../hooks/useCollection";
import { useBoard } from "../../hooks/useBoard";
import { useAuthStore } from "../../store/authStore";
import { useAirport } from "../../hooks/useAirport";
import { STAGES, boardingTime, hhmm, inr, paxRef, stageIndex, type Booking, type Fare } from "../../lib/booking";
import { Card, PageHead } from "../../components/ui/PageHead";

const inp = "bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-white text-sm min-w-0 outline-none focus:border-sky-500 w-full";
interface T { name: string; email: string; ref: string }

export function MyTrips() {
  const me = useAuthStore(s => s.user); const qc = useQueryClient(); const { flights: board } = useBoard(); const apc = useAirport().code;
  const flights = useMemo(() => board.map(f => ({ ...f, key: (f as unknown as { backendId?: string }).backendId ?? "", date: (f as unknown as { date?: string }).date ?? "" })).filter(f => f.key), [board]);
  const col = useCollection<Booking>("bookings", []); const trips = col.items as Booking[];
  const [q, setQ] = useState(""); const [sel, setSel] = useState<string | null>(null); const [tr, setTr] = useState<T[]>([{ name: me?.name ?? "", email: me?.email ?? "", ref: "" }]);
  const [quote, setQuote] = useState<Fare | null>(null); const [err, setErr] = useState(""); const [ok, setOk] = useState(""); const [busy, setBusy] = useState(false); const [copied, setCopied] = useState(false);
  const mine = paxRef(me?.id);
  const bookable = useMemo(() => flights.filter(f => !["Departed", "Landed", "Cancelled"].includes(f.status) && f.from === apc && f.date >= new Date().toISOString().slice(0, 10)).filter(f => !q || `${f.flight} ${f.to} ${f.airline}`.toLowerCase().includes(q.toLowerCase())).sort((a, b) => (a.date + a.dep).localeCompare(b.date + b.dep)).slice(0, 12), [flights, q, apc]);
  const flight = flights.find(f => f.key === sel);
  const clean = tr.filter(t => t.name.trim() || t.ref.trim()).map(t => ({ name: t.name.trim(), email: t.email.trim() || undefined, ref: t.ref.trim() || undefined }));
  useEffect(() => { setQuote(null); if (!sel || !clean.length) return; const h = setTimeout(() => { api.post("/api/records/bookings", { flightId: sel, travellers: clean, quote: true }).then(r => { setQuote(r.data); setErr(""); }).catch(e => setErr(e?.response?.data?.error ?? "")); }, 350); return () => clearTimeout(h); }, [sel, JSON.stringify(clean)]); // eslint-disable-line react-hooks/exhaustive-deps

  const book = async () => { setErr(""); setOk(""); setBusy(true);
    try { const r = await api.post("/api/records/bookings", { flightId: sel, travellers: clean }); setOk(`Booked. PNR ${r.data.pnr}.`); setSel(null); setTr([{ name: me?.name ?? "", email: me?.email ?? "", ref: "" }]); await qc.invalidateQueries({ queryKey: ["records", "bookings"] }); }
    catch (e: any) { setErr(e?.response?.data?.error ?? "Could not book"); } finally { setBusy(false); } };
  const act = async (id: string, body: object) => { setErr(""); try { await api.put(`/api/records/bookings/${id}`, body); await qc.invalidateQueries({ queryKey: ["records", "bookings"] }); } catch (e: any) { setErr(e?.response?.data?.error ?? "Could not update"); } };

  return (
    <div className="space-y-6">
      <PageHead title="My Trips" sub="Book for yourself, family or friends. Everyone on a booking sees their own boarding pass when they sign in." />
      <Card><div className="flex flex-wrap items-center justify-between gap-3"><div><div className="text-xs text-slate-400">Your passenger ID — share it so others can add you to their booking</div><div className="text-xl font-mono text-white tracking-wider">{mine}</div></div>
        <button onClick={() => { void navigator.clipboard?.writeText(mine); setCopied(true); setTimeout(() => setCopied(false), 1500); }} className="text-xs px-3 py-2 rounded-lg border border-navy-600 text-slate-300 inline-flex items-center gap-1"><Copy className="w-3 h-3" />{copied ? "Copied" : "Copy"}</button></div></Card>
      {ok && <div className="text-sm text-green-300 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" />{ok}</div>}{err && <div className="text-sm text-red-400">{err}</div>}

      <div className="grid xl:grid-cols-2 gap-5">
        <Card><div className="text-white font-semibold mb-3 flex items-center gap-2"><Plane className="w-4 h-4" />Book a flight</div>
          <input className={inp + " mb-3"} placeholder="Search destination, airline or flight number" value={q} onChange={e => setQ(e.target.value)} aria-label="Search flights" />
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">{bookable.length === 0 && <div className="text-sm text-slate-400">No flights to show.</div>}
            {bookable.map(f => <button key={f.key} onClick={() => setSel(f.key)} className={`w-full text-left rounded-xl border p-3 ${sel === f.key ? "border-sky-500 bg-navy-700" : "border-navy-600 bg-navy-800 hover:bg-navy-700"}`}>
              <div className="flex justify-between text-sm"><span className="text-white"><span className="font-mono">{f.flight}</span> · {f.from} → {f.to}</span><span className="text-slate-300">{f.date.slice(5)} {hhmm(f.dep)}</span></div><div className="text-xs text-slate-500">{f.airline} · gate {f.gate} · {f.status}</div></button>)}</div></Card>
        <Card><div className="text-white font-semibold mb-3 flex items-center gap-2"><Users className="w-4 h-4" />Travellers</div>
          {!flight ? <div className="text-sm text-slate-400 py-6 text-center">Choose a flight to add travellers.</div> : <>
            <div className="text-xs text-slate-400 mb-3">{flight.flight} · {flight.from} → {flight.to} · {hhmm(flight.dep)}</div>
            <div className="space-y-2">{tr.map((t, i) => <div key={i} className="grid grid-cols-12 gap-2 items-center"><input className={inp + " col-span-4"} placeholder="Full name" value={t.name} onChange={e => setTr(tr.map((x, k) => k === i ? { ...x, name: e.target.value } : x))} aria-label={`Traveller ${i + 1} name`} />
              <input className={inp + " col-span-4"} placeholder="Email (optional)" value={t.email} onChange={e => setTr(tr.map((x, k) => k === i ? { ...x, email: e.target.value } : x))} aria-label={`Traveller ${i + 1} email`} />
              <input className={inp + " col-span-3 font-mono"} placeholder="PAX-ID" value={t.ref} onChange={e => setTr(tr.map((x, k) => k === i ? { ...x, ref: e.target.value } : x))} aria-label={`Traveller ${i + 1} passenger ID`} />
              {i > 0 ? <button onClick={() => setTr(tr.filter((_, k) => k !== i))} aria-label="Remove traveller" className="col-span-1 text-slate-500"><X className="w-4 h-4" /></button> : <span className="col-span-1" />}</div>)}</div>
            {tr.length < 9 && <button onClick={() => setTr([...tr, { name: "", email: "", ref: "" }])} className="text-xs text-sky-400 mt-2 inline-flex items-center gap-1"><Plus className="w-3 h-3" />Add traveller</button>}
            <div className="text-[11px] text-slate-500 mt-2">If a traveller has an AeroBase account, add their email or passenger ID and the trip appears in their account too.</div>
            {quote && <div className="mt-4 rounded-xl bg-navy-900 border border-navy-600 p-3 text-sm"><div className="flex justify-between text-slate-300"><span>{quote.travellers} × {inr(quote.perTraveller)}</span><span className="text-white font-semibold">{inr(quote.total)}</span></div>
              <div className="text-[11px] text-slate-500 mt-1">Indicative fare for {quote.distanceKm} km (base {inr(quote.base)} + taxes and fees {inr(quote.fees)} each){quote.pro ? " · Pro member price applied" : ""}. {quote.seatsLeft} seats left. Payment is confirmed at the airline counter.</div></div>}
            <button onClick={() => void book()} disabled={busy || !quote || clean.length === 0} className="mt-4 w-full px-4 py-3 rounded-xl bg-sky-500 text-white font-semibold disabled:opacity-50">{busy ? "Booking…" : "Confirm booking"}</button></>}</Card>
      </div>

      <div className="space-y-4"><div className="text-white font-semibold">Your trips</div>
        {trips.length === 0 && <Card><div className="text-sm text-slate-400">No trips yet.</div></Card>}
        {trips.map(b => { const mineBooked = (b.bookedByEmail ?? "").toLowerCase() === (me?.email ?? "").toLowerCase(); const canCancel = mineBooked && b.status === "Confirmed" && b.travellers.every(t => t.stage === "Booked");
          return (<Card key={b.id} className={b.status === "Cancelled" ? "opacity-60" : ""}>
            <div className="flex flex-wrap justify-between gap-3"><div><div className="text-white text-lg"><span className="font-mono">{b.flight}</span> · {b.origin} → {b.destination}</div>
              <div className="text-xs text-slate-400 mt-0.5">{b.airlineName || b.airline} · dep {hhmm(b.dep)} · {b.terminal ? `${b.terminal} · ` : ""}gate {b.gate || "—"} · PNR <span className="font-mono text-slate-200">{b.pnr}</span>{!mineBooked && b.bookedBy ? ` · booked for you by ${b.bookedBy}` : ""}</div></div>
              <div className="flex items-start gap-2"><span className={`text-xs px-2 py-1 rounded-full border ${b.payment === "Paid" ? "text-green-300 border-green-500/30" : "text-yellow-300 border-yellow-500/40"}`}>{b.status === "Cancelled" ? "Cancelled" : b.payment === "Paid" ? "Paid" : "Pay at airline counter"}</span>
                {canCancel && <button onClick={() => confirm(`Cancel booking ${b.pnr}?`) && void act(b.id, { action: "cancel" })} className="text-xs text-red-300">Cancel</button>}</div></div>
            <div className="mt-3 grid md:grid-cols-2 gap-3">{b.travellers.map((t, i) => { const si = stageIndex(t.stage); const own = t.userId === me?.id || (mineBooked);
              return (<div key={i} className="rounded-xl border border-navy-600 bg-navy-900 p-3"><div className="flex justify-between"><div><div className="text-slate-200 text-sm">{t.name}{t.userId === me?.id ? " (you)" : ""}</div><div className="text-[11px] text-slate-500">Seat {t.seat} · boarding {boardingTime(b.dep)}</div></div>
                {t.stage === "Booked" && b.status === "Confirmed" && own && <button onClick={() => void act(b.id, { action: "stage", index: i, stage: "Checked in" })} className="text-xs px-3 py-1.5 rounded-lg bg-sky-500 text-white h-fit">Web check-in</button>}</div>
                <div className="flex gap-1 mt-3">{STAGES.map((s, k) => <div key={s} title={s} className={`h-1.5 flex-1 rounded-full ${k <= si ? "bg-sky-500" : "bg-navy-700"}`} />)}</div><div className="text-[11px] text-slate-400 mt-1">{t.stage}</div></div>); })}</div>
            {b.status === "Confirmed" && <details className="mt-3 text-xs text-slate-400"><summary className="cursor-pointer inline-flex items-center gap-1 text-slate-300"><ChevronDown className="w-3 h-3" />Before you travel</summary><ul className="list-disc pl-5 mt-2 space-y-1"><li>Carry a government photo ID that matches the name on the ticket.</li><li>Web check-in here, then drop checked bags at the airline desk, then go through security.</li><li>Keep liquids in your cabin bag in containers of 100 ml or less; power banks stay in the cabin.</li><li>Boarding closes 40 minutes before departure ({boardingTime(b.dep)} is when it opens).</li></ul></details>}</Card>); })}</div>
    </div>
  );
}
