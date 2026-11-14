import { ArrowRight, MapPin, Truck } from "lucide-react";
import { nextStatus, type Order } from "../../lib/shopStats";
import { Card } from "../../components/ui/PageHead";

const rupee = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");
export const statusTone = (s: string) => s === "Delivered" ? "text-green-300 border-green-500/30" : s === "Cancelled" ? "text-red-300 border-red-500/40" : s === "New" ? "text-yellow-300 border-yellow-500/40" : "text-sky-300 border-sky-500/30";
const closed = (s: string) => s === "Delivered" || s === "Cancelled";

/** Orders to prepare and deliver; used by the shop owner (their shop only) and by airport staff (every outlet). */
export function OrdersQueue({ orders, update, showShop }: { orders: (Order & { id: string })[]; update: (id: string, patch: { status: string }) => Promise<boolean>; showShop?: boolean }) {
  if (!orders.length) return <Card><div className="text-sm text-slate-400 text-center py-4">No orders yet. They appear here as passengers order from <b>Shops &amp; Food</b>.</div></Card>;
  const sorted = [...orders].sort((a, b) => Number(closed(a.status)) - Number(closed(b.status)) || (b.created_at ?? "").localeCompare(a.created_at ?? ""));
  return (<div className="space-y-3">{sorted.map(o => { const nx = nextStatus(o);
    return (<Card key={o.id}><div className="flex flex-wrap justify-between gap-3">
      <div className="min-w-0"><div className="text-white"><span className="font-mono">{o.ref}</span> <span className="text-slate-400 text-sm">· {o.passenger}{showShop ? ` · ${o.shopName}` : ""}</span> <span className={`text-xs px-2 py-0.5 rounded-full border ml-2 ${statusTone(o.status)}`}>{o.status}</span></div>
        <div className="text-sm text-slate-300 mt-1">{o.items.map(i => `${i.qty}× ${i.name}`).join(", ")} — <b>{rupee(o.total)}</b> · {o.payment}</div>
        <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">{o.deliver === "Gate" ? <><Truck className="w-3 h-3" />Deliver to {o.terminal} gate {o.gate}{o.flight ? ` (${o.flight})` : ""}</> : <><MapPin className="w-3 h-3" />Passenger collects at the counter</>}{o.note ? ` · “${o.note}”` : ""}</div></div>
      {!closed(o.status) && <div className="flex items-center gap-2">{nx && <button onClick={() => void update(o.id, { status: nx })} className="text-xs px-3 py-2 rounded-lg bg-sky-500 text-white inline-flex items-center gap-1">{nx}<ArrowRight className="w-3 h-3" /></button>}
        <button onClick={() => confirm(`Cancel ${o.ref}? Stock is returned.`) && void update(o.id, { status: "Cancelled" })} className="text-xs px-3 py-2 rounded-lg border border-navy-600 text-red-300">Cancel</button></div>}</div></Card>); })}</div>);
}
