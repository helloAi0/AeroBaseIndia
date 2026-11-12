import { useCallback, useEffect, useState } from "react";
import { api } from "../../api/client";
import { API_ENABLED } from "../../config";
import { useAuthStore } from "../../store/authStore";
import { Card, PageHead, Stat } from "../../components/ui/PageHead";

const PLANS = [
  { id: "STARTER", price: "₹15,000/mo", flights: "Up to 100 flights/day", feat: "Flights, gates, baggage" },
  { id: "STANDARD", price: "₹45,000/mo", flights: "Up to 500 flights/day", feat: "+ analytics, AI delay prediction, notifications" },
  { id: "PREMIUM", price: "₹1,20,000/mo", flights: "Up to 1,500 flights/day", feat: "+ digital twin, API marketplace, priority support" },
  { id: "ENTERPRISE", price: "Contact us", flights: "Unlimited", feat: "+ dedicated tenancy, SLA, custom integrations" },
];

/** Subscription for this airport: the real plan from the server and real plan changes. Prices shown are list prices. */
export function BillingPortal() {
  const live = API_ENABLED && useAuthStore(s => s.source) === "backend"; const role = useAuthStore(s => s.user?.role);
  const [plan, setPlan] = useState<{ plan: string; status: string; renews_on?: string } | null>(null); const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [inv, setInv] = useState<any[] | null>(null);
  const load = useCallback(() => { api.get("/api/billing/current-plan").then(r => setPlan(r.data)).catch(() => setMsg({ ok: false, t: "Could not load your plan" })); api.get("/api/billing/invoices").then(r => setInv(r.data.invoices ?? r.data ?? [])).catch(() => setInv(null)); }, []);
  useEffect(() => { if (live) load(); }, [live, load]);
  if (!live) return <Card><div className="text-sm text-yellow-400">Billing needs the live backend.</div></Card>;
  const change = async (id: string) => {
    if (!confirm(`Switch to the ${id} plan?`)) return; setMsg(null);
    try { await api.post("/api/billing/upgrade", { plan_id: id }); setMsg({ ok: true, t: `Plan changed to ${id}.` }); load(); } catch (e: any) { setMsg({ ok: false, t: e?.response?.data?.error ?? "Plan change failed" }); }
  };
  const canChange = role === "airport_admin" || role === "superadmin";
  return (
    <div className="space-y-6">
      <PageHead title="Billing" sub="Your airport's subscription." />
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4"><Stat label="Current plan" value={plan?.plan ?? "…"} tone="text-sky-400" /><Stat label="Status" value={plan?.status ?? "…"} tone="text-green-400" /><Stat label="Renews on" value={plan?.renews_on || "—"} /></div>
      {msg && <div className={`text-sm ${msg.ok ? "text-green-400" : "text-red-400"}`}>{msg.t}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">{PLANS.map(p => <Card key={p.id} className={plan?.plan === p.id ? "border-sky-500" : ""}>
        <div className="text-white font-semibold">{p.id}</div><div className="text-xl font-bold text-sky-300 mt-1">{p.price}</div><div className="text-xs text-slate-400 mt-2">{p.flights}</div><div className="text-xs text-slate-500 mt-1">{p.feat}</div>
        <button disabled={!canChange || plan?.plan === p.id} onClick={() => void change(p.id)} className="mt-4 w-full px-3 py-2 rounded-lg bg-sky-500 disabled:bg-navy-700 disabled:text-slate-500 text-white text-xs font-semibold">{plan?.plan === p.id ? "Current plan" : canChange ? "Switch to this plan" : "Admins only"}</button></Card>)}</div>
      {inv && inv.length > 0 && <Card className="overflow-x-auto"><div className="text-sm text-slate-300 mb-2">Invoices</div><table className="w-full text-sm"><tbody>{inv.map((i: any, k: number) => <tr key={i.id ?? k} className="border-b border-navy-700 text-slate-200"><td className="p-2 font-mono text-xs">{i.id ?? i.invoice_id}</td><td className="p-2">₹{Number(i.amount ?? i.total ?? 0).toLocaleString("en-IN")}</td><td className="p-2">{i.status}</td></tr>)}</tbody></table></Card>}
    </div>
  );
}
