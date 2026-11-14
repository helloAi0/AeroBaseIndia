import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ShoppingBag, Minus, Plus, Truck, MapPin, Search, CheckCircle2 } from "lucide-react";
import { api } from "../../api/client";
import { useCollection } from "../../hooks/useCollection";
import { useBoard } from "../../hooks/useBoard";
import { useAirport } from "../../hooks/useAirport";
import { flowFor, type Order, type Product } from "../../lib/shopStats";
import { statusTone } from "../shop/OrdersQueue";
import { Card, PageHead } from "../../components/ui/PageHead";

interface Shop { name: string; category: string; terminal: string; location?: string; hours?: string; status: string; deliver?: string }
const inp = "bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-white text-sm min-w-0 outline-none focus:border-sky-500 w-full";
const rupee = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

export function ShopsAndFood() {
  const qc = useQueryClient(); const ap = useAirport(); const { flights } = useBoard();
  const shops = useCollection<Shop>("stores", []); const products = useCollection<Product & { ownerId?: string; shop?: string }>("products", []); const orders = useCollection<Order>("orders", []);
  const [open, setOpen] = useState<string | null>(null); const [q, setQ] = useState(""); const [cart, setCart] = useState<Record<string, number>>({});
  const [deliver, setDeliver] = useState<"Gate" | "Pickup">("Gate"); const terminals = useMemo(() => { const t = Array.from(new Set(flights.map(f => f.terminal).filter(x => x && x !== "—"))).sort(); return t.length ? t : ["T1"]; }, [flights]);
  const [terminal, setTerminal] = useState(""); const [gate, setGate] = useState(""); const [flight, setFlight] = useState(""); const [note, setNote] = useState(""); const [busy, setBusy] = useState(false); const [err, setErr] = useState(""); const [ok, setOk] = useState("");

  // A shop is orderable when it is open and has at least one product.
  const menu = (s: Shop & { id: string; ownerId?: string }) => products.items.filter(p => (s.ownerId ? p.ownerId === s.ownerId : !p.ownerId && p.shop === s.name) && p.available !== "No");
  const list = useMemo(() => (shops.items as (Shop & { id: string; ownerId?: string })[]).map(s => ({ s, n: menu(s).length })).filter(x => x.n > 0 && (!q || `${x.s.name} ${x.s.category}`.toLowerCase().includes(q.toLowerCase()))), // eslint-disable-next-line react-hooks/exhaustive-deps
    [shops.items, products.items, q]);
  const cur = list.find(x => x.s.id === open)?.s; const items = cur ? menu(cur) : [];
  const lines = items.filter(p => cart[p.id] > 0); const total = lines.reduce((t, p) => t + Number(p.price) * cart[p.id], 0);
  const setQty = (p: Product & { id: string }, d: number) => setCart(c => { const max = p.stock === undefined || p.stock === "" ? 20 : Math.min(20, Number(p.stock)); const v = Math.max(0, Math.min(max, (c[p.id] ?? 0) + d)); return { ...c, [p.id]: v }; });
  const flightsHere = flights.filter(f => f.status !== "Departed" && f.status !== "Cancelled").slice(0, 150);

  const place = async () => {
    setErr(""); setOk(""); setBusy(true);
    try { const r = await api.post("/api/records/orders", { shopId: open, items: lines.map(p => ({ id: p.id, qty: cart[p.id] })), deliver, terminal: terminal || terminals[0], gate: gate.trim().toUpperCase(), flight: flight.trim().toUpperCase(), note: note.trim() });
      setOk(`Order ${r.data.ref} placed. ${deliver === "Gate" ? "It will be brought to your gate." : "Collect it at the counter."}`); setCart({}); setNote(""); await qc.invalidateQueries({ queryKey: ["records"] }); }
    catch (e: any) { setErr(e?.response?.data?.error ?? "Could not place the order"); await qc.invalidateQueries({ queryKey: ["records", "products"] }); } finally { setBusy(false); }
  };
  const mine = [...(orders.items as (Order & { id: string })[])].sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));

  return (
    <div className="space-y-6">
      <PageHead title="Shops & Food" sub={`Order from ${ap.name} and get it brought to your gate, or collect it yourself.`} />
      {ok && <div className="text-sm text-green-300 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" />{ok}</div>}
      <div className="relative max-w-md"><Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" /><input className={inp + " !pl-9"} placeholder="Search shops and food" value={q} onChange={e => setQ(e.target.value)} aria-label="Search shops" /></div>
      <div className="grid xl:grid-cols-3 gap-5">
        <div className="space-y-3 xl:col-span-1">
          {list.length === 0 && <Card><div className="text-sm text-slate-400">{shops.loading ? "Loading…" : "No shops are taking orders right now."}</div></Card>}
          {list.map(({ s, n }) => <button key={s.id} onClick={() => { setOpen(s.id); setCart({}); setErr(""); setOk(""); }} className={`w-full text-left rounded-2xl border p-4 ${open === s.id ? "border-sky-500 bg-navy-700" : "border-navy-600 bg-navy-800 hover:bg-navy-700"}`}>
            <div className="text-white font-semibold">{s.name}</div><div className="text-xs text-slate-400 mt-0.5">{s.category} · {s.terminal}{s.location ? ` · ${s.location}` : ""}</div><div className="text-[11px] text-slate-500 mt-1">{n} items{s.hours ? ` · ${s.hours}` : ""}</div></button>)}
        </div>
        <div className="xl:col-span-2 space-y-4">
          {!cur ? <Card><div className="text-sm text-slate-400 text-center py-10"><ShoppingBag className="w-7 h-7 mx-auto mb-2" />Choose a shop to see its menu.</div></Card> : <>
            <Card><div className="text-white font-semibold mb-3">{cur.name}</div>
              {items.map(p => { const out = p.stock !== undefined && p.stock !== "" && Number(p.stock) <= 0;
                return <div key={p.id} className="flex items-center justify-between py-2 border-b border-navy-700 last:border-0"><div><div className="text-slate-200 text-sm">{p.name}</div><div className="text-xs text-slate-500">{rupee(Number(p.price))}{out ? " · sold out" : ""}</div></div>
                  <div className="flex items-center gap-2"><button aria-label={`Less ${p.name}`} disabled={!cart[p.id]} onClick={() => setQty(p, -1)} className="w-7 h-7 rounded-lg bg-navy-700 disabled:opacity-40 inline-flex items-center justify-center"><Minus className="w-3 h-3" /></button><span className="w-5 text-center text-sm text-white">{cart[p.id] ?? 0}</span><button aria-label={`More ${p.name}`} disabled={out} onClick={() => setQty(p, 1)} className="w-7 h-7 rounded-lg bg-sky-500 text-white disabled:opacity-40 inline-flex items-center justify-center"><Plus className="w-3 h-3" /></button></div></div>; })}</Card>
            {lines.length > 0 && <Card>
              <div className="grid grid-cols-2 gap-2 mb-3">{(["Gate", "Pickup"] as const).map(m => <button key={m} onClick={() => setDeliver(m)} disabled={m === "Gate" && cur.deliver === "No"} className={`rounded-xl border p-3 text-left text-sm disabled:opacity-40 ${deliver === m ? "border-sky-500 bg-navy-700 text-white" : "border-navy-600 text-slate-300"}`}>{m === "Gate" ? <><Truck className="w-4 h-4 mb-1" />Bring to my gate</> : <><MapPin className="w-4 h-4 mb-1" />I'll collect it</>}</button>)}</div>
              {deliver === "Gate" && <div className="grid sm:grid-cols-3 gap-3 mb-3"><select className={inp} value={terminal || terminals[0]} onChange={e => setTerminal(e.target.value)} aria-label="Terminal">{terminals.map(t => <option key={t}>{t}</option>)}</select>
                <input className={inp} placeholder="Gate e.g. B12" value={gate} onChange={e => setGate(e.target.value)} aria-label="Gate" maxLength={8} />
                <input className={inp} placeholder="Flight (optional)" list="sf-flights" value={flight} onChange={e => { setFlight(e.target.value); const f = flightsHere.find(x => x.flight === e.target.value.toUpperCase()); if (f) { if (f.gate && f.gate !== "—") setGate(f.gate); if (f.terminal && f.terminal !== "—") setTerminal(f.terminal); } }} aria-label="Flight" /><datalist id="sf-flights">{flightsHere.map(f => <option key={f.id} value={f.flight} />)}</datalist></div>}
              <input className={inp + " mb-3"} placeholder="Note for the shop (optional)" value={note} onChange={e => setNote(e.target.value)} maxLength={200} aria-label="Note" />
              {err && <div className="text-sm text-red-400 mb-2">{err}</div>}
              <button onClick={() => void place()} disabled={busy || (deliver === "Gate" && !gate.trim())} className="w-full px-4 py-3 rounded-xl bg-sky-500 text-white font-semibold disabled:opacity-50">{busy ? "Placing…" : `Place order · ${rupee(total)}`}</button>
              <div className="text-[11px] text-slate-500 mt-2">{deliver === "Gate" ? "Pay on delivery" : "Pay at the counter"} (cash, UPI or card with the shop). The final amount is calculated by the shop's current prices.</div></Card>}</>}
        </div>
      </div>
      <div className="space-y-3"><div className="text-white font-semibold">My orders</div>
        {mine.length === 0 && <Card><div className="text-sm text-slate-400">No orders yet.</div></Card>}
        {mine.map(o => { const fl = flowFor(o), i = fl.indexOf(o.status);
          return <Card key={o.id}><div className="flex flex-wrap justify-between gap-2"><div><div className="text-white"><span className="font-mono">{o.ref}</span> <span className="text-slate-400 text-sm">· {o.shopName}</span></div><div className="text-sm text-slate-300 mt-1">{o.items.map(x => `${x.qty}× ${x.name}`).join(", ")} — {rupee(o.total)}</div>
            <div className="text-xs text-slate-500 mt-1">{o.deliver === "Gate" ? `To ${o.terminal} gate ${o.gate}` : "Collect at the counter"}</div></div>
            <div className="flex items-start gap-2"><span className={`text-xs px-2 py-1 rounded-full border ${statusTone(o.status)}`}>{o.status}</span>{o.status === "New" && <button onClick={() => void orders.update(o.id, { status: "Cancelled" })} className="text-xs text-red-300">Cancel</button>}</div></div>
            {o.status !== "Cancelled" && <div className="flex gap-1 mt-3">{fl.map((s, k) => <div key={s} title={s} className={`h-1.5 flex-1 rounded-full ${k <= i ? "bg-sky-500" : "bg-navy-700"}`} />)}</div>}</Card>; })}
        {orders.error && <div className="text-xs text-red-400">{orders.error}</div>}</div>
    </div>
  );
}
