import { useQuery } from "@tanstack/react-query";
import { fetchOrders } from "../../api/client";
import { API_ENABLED } from "../../config";
import { useBoard } from "../../hooks/useBoard";
import { useCollection } from "../../hooks/useCollection";
import { Card, PageHead, Stat, Empty } from "../../components/ui/PageHead";

const inr = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");
const COMMISSION = 0.12;

/** Revenue from recorded payments and accepted marketplace bids. Nothing is estimated or invented. */
export function Revenue() {
  const { live } = useBoard();
  const orders = useQuery({ queryKey: ["orders"], queryFn: fetchOrders, enabled: API_ENABLED && live, retry: false });
  const bids = useCollection<{ slot: string; shop: string; offer: string; amount: number; status: string }>("bids");
  const list = ((orders.data as any)?.orders ?? []) as any[];
  const paid = list.filter(o => String(o.status).toUpperCase() === "PAID");
  const paidTotal = paid.reduce((s, o) => s + (Number(o.amount) || 0), 0);
  const accepted = bids.items.filter(b => b.status === "Accepted");
  const commission = accepted.reduce((s, b) => s + (Number(b.amount) || 0) * COMMISSION, 0);
  return (
    <div className="space-y-6">
      <PageHead title="Revenue" sub="Money actually recorded: paid orders and accepted marketplace bids." note={live ? undefined : "Demo mode has no payment records. Sign in to the live backend to see real revenue."} />
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <Stat label="Paid orders" value={inr(paidTotal)} tone="text-green-400" sub={`${paid.length} of ${list.length} orders`} />
        <Stat label="Marketplace commission" value={inr(commission)} tone="text-sky-400" sub={`${accepted.length} accepted bids at ${COMMISSION * 100}%`} />
        <Stat label="Total recorded" value={inr(paidTotal + commission)} />
        <Stat label="Outstanding orders" value={inr(list.filter(o => String(o.status).toUpperCase() !== "PAID").reduce((s, o) => s + (Number(o.amount) || 0), 0))} tone="text-yellow-400" />
      </div>
      <Card className="overflow-x-auto"><div className="text-sm text-slate-300 mb-2">Payment orders</div>
        {list.length === 0 ? <Empty>No payment orders yet. Orders appear here when invoices are paid through the payment gateway.</Empty> :
          <table className="w-full text-sm min-w-[480px]"><thead><tr className="text-left text-xs text-slate-400 border-b border-navy-600"><th className="p-2">Order</th><th className="p-2">Invoice</th><th className="p-2">Amount</th><th className="p-2">Status</th></tr></thead>
            <tbody>{list.map((o, i) => <tr key={o.order_id ?? i} className="border-b border-navy-700 text-slate-200"><td className="p-2 font-mono text-xs">{o.order_id}</td><td className="p-2">{o.invoice_id}</td><td className="p-2">{inr(Number(o.amount) || 0)}</td><td className="p-2">{o.status}</td></tr>)}</tbody></table>}</Card>
      <Card className="overflow-x-auto"><div className="text-sm text-slate-300 mb-2">Accepted marketplace bids</div>
        {accepted.length === 0 ? <Empty>No accepted bids yet.</Empty> :
          <table className="w-full text-sm min-w-[480px]"><tbody>{accepted.map(b => <tr key={b.id} className="border-b border-navy-700 text-slate-200"><td className="p-2">{b.shop}</td><td className="p-2">{b.slot}</td><td className="p-2">{b.offer}</td><td className="p-2 text-right">{inr(b.amount)}</td></tr>)}</tbody></table>}</Card>
    </div>
  );
}
export const RevenueDashboard = Revenue;
