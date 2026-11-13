import { useCallback, useEffect, useState } from "react";
import { CreditCard, RefreshCw } from "lucide-react";
import { api } from "../../api/client";
import { API_ENABLED } from "../../config";
import { useAuthStore } from "../../store/authStore";
import { Card, PageHead, Stat, Empty } from "../../components/ui/PageHead";

type Order = { order_id: string; invoice_id: string; amount: number; currency: string; status: string; gateway: string; gateway_ref: string };
declare global { interface Window { Razorpay?: new (o: Record<string, unknown>) => { open: () => void; on: (e: string, cb: (r: any) => void) => void } } }
const loadCheckout = () => new Promise<void>((res, rej) => {
  if (window.Razorpay) return res();
  const s = document.createElement("script"); s.src = "https://checkout.razorpay.com/v1/checkout.js"; s.onload = () => res(); s.onerror = () => rej(new Error("Could not load Razorpay Checkout")); document.head.appendChild(s);
});

/** Real payments: orders are created with Razorpay / Stripe through the backend, and status changes arrive through signed webhooks. */
export function PaymentsPage() {
  const live = API_ENABLED && useAuthStore(s => s.source) === "backend"; const role = useAuthStore(s => s.user?.role);
  const [orders, setOrders] = useState<Order[]>([]); const [cfg, setCfg] = useState<{ razorpay: boolean; razorpay_key_id: string | null; stripe: boolean } | null>(null);
  const [f, setF] = useState({ invoice_id: "", amount: "", gateway: "razorpay" }); const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null); const [busy, setBusy] = useState(false); const [denied, setDenied] = useState(false);
  const load = useCallback(() => {
    api.get("/payments/orders").then(r => setOrders(r.data.orders ?? [])).catch(e => { if (e?.response?.status === 403) setDenied(true); });
    api.get("/payments/config").then(r => setCfg(r.data)).catch(() => {});
  }, []);
  useEffect(() => { if (live) load(); }, [live, load]);
  if (!live) return <Card><div className="text-sm text-yellow-400">Payments need the live backend.</div></Card>;
  if (denied || (role && role !== "airport_admin" && role !== "superadmin")) return <div className="space-y-6"><PageHead title="Payments" sub="Orders and gateway status" /><Card><div className="text-sm text-slate-300">Payments are managed by your airport's administrators.</div></Card></div>;

  const gatewayOk = f.gateway === "stripe" ? cfg?.stripe : cfg?.razorpay;
  const create = async (e: React.FormEvent) => {
    e.preventDefault(); setMsg(null); setBusy(true);
    try {
      const o = (await api.post("/payments/order", { invoice_id: f.invoice_id.trim(), amount: Number(f.amount), currency: "INR", gateway: f.gateway })).data;
      setMsg({ ok: true, t: `Order ${o.gateway_ref || o.order_id} created.` }); setF({ ...f, invoice_id: "", amount: "" }); load();
      if (o.gateway === "razorpay" && o.key_id) {
        await loadCheckout();
        const rz = new window.Razorpay!({ key: o.key_id, amount: Math.round(o.amount * 100), currency: o.currency, order_id: o.gateway_ref, name: "AeroBase India", description: o.invoice_id, handler: () => { setMsg({ ok: true, t: "Payment submitted. Status updates when the gateway confirms." }); setTimeout(load, 3000); } });
        rz.on("payment.failed", (r: any) => setMsg({ ok: false, t: r?.error?.description ?? "Payment failed" })); rz.open();
      }
    } catch (x: any) { setMsg({ ok: false, t: x?.response?.data?.error ?? x?.message ?? "Could not create the order" }); } finally { setBusy(false); }
  };
  const paid = orders.filter(o => o.status === "PAID"); const inp = "bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-white text-sm w-full";
  return (
    <div className="space-y-6">
      <PageHead title="Payments" sub="Orders created through your payment gateway" />
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4"><Stat label="Orders" value={orders.length} /><Stat label="Paid" value={paid.length} tone="text-green-400" />
        <Stat label="Collected" value={"₹" + paid.reduce((s, o) => s + o.amount, 0).toLocaleString("en-IN")} /><Stat label="Gateway" value={cfg ? (cfg.razorpay || cfg.stripe ? "Connected" : "Not configured") : "…"} tone={cfg?.razorpay || cfg?.stripe ? "text-green-400" : "text-yellow-400"} /></div>
      {cfg && !cfg.razorpay && !cfg.stripe && <Card><div className="text-sm text-yellow-400">No gateway keys are set on the server. Set RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET (or STRIPE_SECRET_KEY) to take payments.</div></Card>}
      <Card><form onSubmit={create} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
        <label className="text-xs text-slate-400">Invoice / reference<input className={inp} value={f.invoice_id} onChange={e => setF({ ...f, invoice_id: e.target.value })} maxLength={40} required /></label>
        <label className="text-xs text-slate-400">Amount (₹)<input className={inp} type="number" min="1" max="100000000" step="0.01" value={f.amount} onChange={e => setF({ ...f, amount: e.target.value })} required /></label>
        <label className="text-xs text-slate-400">Gateway<select className={inp} value={f.gateway} onChange={e => setF({ ...f, gateway: e.target.value })}><option value="razorpay">Razorpay</option><option value="stripe">Stripe</option></select></label>
        <button disabled={busy || !gatewayOk} className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-sky-500 disabled:opacity-50 text-white text-sm font-semibold"><CreditCard className="w-4 h-4" />Create order</button></form>
        {msg && <div className={`mt-3 text-xs ${msg.ok ? "text-green-400" : "text-red-400"}`}>{msg.t}</div>}</Card>
      <Card className="overflow-x-auto"><div className="flex items-center justify-between mb-2"><div className="text-sm text-slate-300">Orders</div><button onClick={load} aria-label="Refresh" className="text-slate-400"><RefreshCw className="w-4 h-4" /></button></div>
        {orders.length === 0 ? <Empty>No orders yet.</Empty> : <table className="w-full text-sm min-w-[560px]"><thead><tr className="text-left text-xs text-slate-400 border-b border-navy-600"><th className="p-2">Invoice</th><th className="p-2">Amount</th><th className="p-2">Gateway</th><th className="p-2">Status</th><th className="p-2">Gateway ref</th></tr></thead>
          <tbody>{orders.map(o => <tr key={o.order_id} className="border-b border-navy-700 text-slate-200"><td className="p-2">{o.invoice_id}</td><td className="p-2">₹{o.amount.toLocaleString("en-IN")}</td><td className="p-2">{o.gateway}</td><td className="p-2">{o.status}</td><td className="p-2 font-mono text-xs">{o.gateway_ref}</td></tr>)}</tbody></table>}</Card>
    </div>
  );
}
