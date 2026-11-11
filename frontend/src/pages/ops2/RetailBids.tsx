import { useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { ALL_AIRPORT_FLIGHTS } from "../../data/airportFlights";
import { Card, PageHead } from "../../components/ui/PageHead";

const COMMISSION = 0.12;
interface Bid { id: number; slot: string; shop: string; offer: string; amount: number; status: "Pending" | "Accepted" | "Declined" }
const SLOTS = ALL_AIRPORT_FLIGHTS.filter(f => f.status === "Scheduled" || f.status === "Boarding").sort((a, b) => b.pax - a.pax).slice(0, 6);
const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

export function RetailBids() {
  const role = useAuthStore(s => s.user?.role);
  const admin = role === "superadmin" || role === "airport_admin";
  const [bids, setBids] = useState<Bid[]>([{ id: 1, slot: "AI-819", shop: "Lounge Aurora", offer: "20% off lounge entry", amount: 18000, status: "Pending" }]);
  const [f, setF] = useState({ slot: SLOTS[0]?.flight ?? "", offer: "", amount: "" });
  const place = (e: React.FormEvent) => { e.preventDefault(); const a = Math.round(+f.amount); if (!f.offer.trim() || !(a > 0)) return;
    setBids(b => [{ id: Date.now(), slot: f.slot, shop: "My shop", offer: f.offer.trim(), amount: a, status: "Pending" }, ...b]); setF({ ...f, offer: "", amount: "" }); };
  const set = (id: number, status: Bid["status"]) => setBids(b => b.map(x => x.id === id ? { ...x, status } : x));
  const earned = bids.filter(b => b.status === "Accepted").reduce((s, b) => s + b.amount * COMMISSION, 0);
  const inp = "bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-white text-sm min-w-0 w-full";
  return (
    <div className="space-y-6">
      <PageHead title="Offer Marketplace" sub="Shops and lounges bid to put an offer in front of a flight's passengers. The airport keeps a commission."
        note={`Commission ${Math.round(COMMISSION * 100)}% of the winning bid. Bids live in this session until the marketplace API and payments are connected.`} />
      {admin && <Card><div className="text-2xl font-bold text-white">{inr(Math.round(earned))}</div><div className="text-sm text-slate-400">commission on accepted bids</div></Card>}
      <Card><div className="text-sm text-slate-300 mb-3">Biggest audiences today</div><div className="grid grid-cols-2 md:grid-cols-3 gap-3">{SLOTS.map(s => <div key={s.id} className="bg-navy-900 border border-navy-600 rounded-xl p-3 text-sm text-slate-200"><div className="font-mono text-white">{s.flight}</div><div className="text-xs text-slate-400">{s.pax} passengers · dep {s.dep}</div></div>)}</div></Card>
      {!admin && <Card><form onSubmit={place} className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <select className={inp} value={f.slot} onChange={e => setF({ ...f, slot: e.target.value })} aria-label="Flight">{SLOTS.map(s => <option key={s.id}>{s.flight}</option>)}</select>
        <input className={inp} placeholder="Offer, e.g. 15% off coffee" value={f.offer} onChange={e => setF({ ...f, offer: e.target.value })} />
        <input className={inp} type="number" min={1} placeholder="Bid (₹)" value={f.amount} onChange={e => setF({ ...f, amount: e.target.value })} />
        <button className="px-4 py-2 rounded-lg bg-sky-500 text-white text-sm font-semibold">Place bid</button></form></Card>}
      <div className="space-y-3">{bids.map(b => <Card key={b.id}><div className="flex flex-wrap justify-between gap-3 items-center"><div className="min-w-0"><div className="text-white text-sm">{b.shop}: {b.offer}</div><div className="text-xs text-slate-400">Flight {b.slot} · bid {inr(b.amount)} · airport share {inr(Math.round(b.amount * COMMISSION))}</div></div>
        <div className="flex items-center gap-2"><span className="text-xs text-slate-300">{b.status}</span>{admin && b.status === "Pending" && <><button onClick={() => set(b.id, "Accepted")} className="text-xs px-3 py-2 rounded-lg bg-green-600 text-white">Accept</button><button onClick={() => set(b.id, "Declined")} className="text-xs px-3 py-2 rounded-lg bg-navy-700 text-slate-300 border border-navy-600">Decline</button></>}</div></div></Card>)}</div>
    </div>
  );
}
