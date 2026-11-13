import { useEffect, useState } from "react";
import { CheckCircle2, CircleDashed, RefreshCw } from "lucide-react";
import { api } from "../../api/client";
import { API_ENABLED } from "../../config";
import { useAuthStore } from "../../store/authStore";
import { Card, PageHead } from "../../components/ui/PageHead";

type Status = Partial<Record<"whatsapp" | "sms" | "email" | "razorpay" | "stripe" | "redis" | "ml", boolean>>;
const ITEMS: { id: keyof Status; name: string; what: string; env: string; hook?: string }[] = [
  { id: "razorpay", name: "Razorpay", what: "Card/UPI payments in India", env: "RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET", hook: "/payments/webhook/razorpay" },
  { id: "stripe", name: "Stripe", what: "International card payments", env: "STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET", hook: "/payments/webhook/stripe" },
  { id: "whatsapp", name: "WhatsApp Cloud API", what: "Passenger flight-status assistant", env: "WHATSAPP_VERIFY_TOKEN, WHATSAPP_APP_SECRET, WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID", hook: "/webhooks/whatsapp" },
  { id: "sms", name: "SMS", what: "Delay and gate-change texts", env: "SMS_PROVIDER and the provider's credentials" },
  { id: "email", name: "Email", what: "Notifications and invoices", env: "Brevo / SMTP credentials" },
  { id: "redis", name: "Redis", what: "Caching, rate limits and partner-key checks", env: "REDIS_HOST, REDIS_PORT, REDIS_PASSWORD" },
  { id: "ml", name: "ML prediction service", what: "Delay and cascade predictions", env: "ML_SERVICE_URL" },
];

/** What is actually connected on this server (reported by the backend from its own configuration; no secrets are shown). */
export function IntegrationsHub() {
  const live = API_ENABLED && useAuthStore(s => s.source) === "backend";
  const [st, setSt] = useState<Status | null>(null); const [err, setErr] = useState("");
  const load = () => { setErr(""); api.get("/api/integrations/status").then(r => setSt(r.data)).catch(e => setErr(e?.response?.status === 403 ? "Only airport administrators can view integrations." : "Could not read integration status")); };
  useEffect(() => { if (live) load(); }, [live]);
  if (!live) return <Card><div className="text-sm text-yellow-400">Integration status needs the live backend.</div></Card>;
  return (
    <div className="space-y-6">
      <PageHead title="Integrations" sub="Connections configured on this server" />
      <div className="flex items-center gap-3"><button onClick={load} className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs border border-navy-600 text-slate-300"><RefreshCw className="w-3 h-3" />Refresh</button>{err && <span className="text-xs text-red-400">{err}</span>}</div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">{ITEMS.map(i => { const on = st?.[i.id]; return (
        <Card key={i.id}><div className="flex items-start justify-between gap-3"><div><div className="text-white font-semibold">{i.name}</div><div className="text-xs text-slate-400">{i.what}</div></div>
          <span className={`flex items-center gap-1 text-xs ${on ? "text-green-400" : "text-yellow-400"}`}>{on ? <CheckCircle2 className="w-4 h-4" /> : <CircleDashed className="w-4 h-4" />}{st == null ? "…" : on ? "Connected" : "Not configured"}</span></div>
          {!on && st != null && <div className="mt-3 text-[11px] text-slate-500">Set: <span className="font-mono text-slate-400">{i.env}</span></div>}
          {i.hook && <div className="mt-1 text-[11px] text-slate-500">Webhook: <span className="font-mono text-slate-400">{i.hook}</span></div>}</Card>); })}</div>
    </div>
  );
}
