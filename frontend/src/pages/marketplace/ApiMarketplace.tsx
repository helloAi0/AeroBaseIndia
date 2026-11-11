import { useState } from "react";
import { Copy, Play, Check, Plug } from "lucide-react";
import { api } from "../../api/client";
import { API_ENABLED, API_URL } from "../../config";
import { PartnerKeys } from "./PartnerKeys";
import { useAirport } from "../../hooks/useAirport";

interface Endpoint { id: string; name: string; method: "GET" | "POST"; path: string; desc: string; auth: string; body?: object; tag: string }
const CATALOG: Endpoint[] = [
  { id: "flights", name: "Flights", method: "GET", path: "/flights", desc: "Live flights for your airport (max 100, newest first).", auth: "Bearer JWT (tenant from token)", tag: "Operations" },
  { id: "predict", name: "Delay prediction", method: "POST", path: "/predict/delay", desc: "Predicted delay in minutes from weather and congestion scores (0–10).", auth: "None (rate-limit at your gateway)", body: { weather_score: 6, congestion_score: 4 }, tag: "AI" },
  { id: "sms", name: "SMS alert", method: "POST", path: "/notify/sms", desc: "Send an SMS to up to 50 numbers. Admin only.", auth: "Bearer JWT (admin)", body: { to: ["+919876543210"], message: "Flight 6E-202 delayed 30 min" }, tag: "Notifications" },
  { id: "tg", name: "Telegram alert", method: "POST", path: "/notify/telegram", desc: "Free alerts through your Telegram bot. Admin only.", auth: "Bearer JWT (admin)", body: { to: ["123456789"], message: "Gate changed to A5" }, tag: "Notifications" },
  { id: "email", name: "Email", method: "POST", path: "/notify/email", desc: "Send an email via Brevo. Admin only.", auth: "Bearer JWT (admin)", body: { to: "ops@example.com", subject: "Test", body: "Hello" }, tag: "Notifications" },
];

export function ApiMarketplace() {
  const { code } = useAirport();
  const [sel, setSel] = useState(CATALOG[0]);
  const [out, setOut] = useState<{ status: number | string; body: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const base = API_ENABLED ? API_URL : "https://YOUR-API-HOST";
  const curl = `curl -X ${sel.method} ${base}${sel.path} \\\n  -H "Authorization: Bearer $TOKEN" \\\n  -H "X-Tenant-ID: ${code}"` + (sel.body ? ` \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify(sel.body)}'` : "");

  const run = async () => {
    setBusy(true); setOut(null);
    try {
      const r = await api.request({ method: sel.method, url: sel.path, data: sel.body, validateStatus: () => true });
      setOut({ status: r.status, body: JSON.stringify(r.data, null, 2).slice(0, 2000) });
    } catch (e) { setOut({ status: "error", body: (e as Error).message }); }
    setBusy(false);
  };
  const copy = async () => { try { await navigator.clipboard.writeText(curl); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* clipboard blocked */ } };

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-white">API Marketplace</h1>
        <p className="text-slate-400 text-sm mt-0.5">Endpoints your partners and apps can call. Try them live with your current session.</p></div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="space-y-2">{CATALOG.map(e => (
          <button key={e.id} onClick={() => { setSel(e); setOut(null); }}
            className={`w-full text-left p-4 rounded-2xl border ${sel.id === e.id ? "bg-sky-500/10 border-sky-500/40" : "bg-navy-800 border-navy-600 hover:border-navy-500"}`}>
            <div className="flex items-center justify-between"><span className="font-semibold text-white flex items-center gap-2"><Plug className="w-4 h-4 text-sky-400" />{e.name}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-navy-700 text-slate-300">{e.tag}</span></div>
            <div className="text-xs text-slate-400 mt-1">{e.desc}</div></button>))}</div>
        <div className="xl:col-span-2 bg-navy-800 border border-navy-600 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 font-mono text-sm"><span className={`px-2 py-0.5 rounded ${sel.method === "GET" ? "bg-green-500/20 text-green-300" : "bg-sky-500/20 text-sky-300"}`}>{sel.method}</span><span className="text-white">{sel.path}</span></div>
          <div className="text-xs text-slate-400">Auth: {sel.auth}</div>
          <div className="relative"><pre className="bg-navy-900 border border-navy-600 rounded-xl p-4 text-xs text-slate-200 overflow-x-auto whitespace-pre-wrap">{curl}</pre>
            <button onClick={copy} aria-label="Copy curl" className="absolute top-2 right-2 p-1.5 rounded-md bg-navy-700 text-slate-300">{copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}</button></div>
          <button onClick={run} disabled={busy || !API_ENABLED} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500 disabled:opacity-50 text-white font-semibold text-sm"><Play className="w-4 h-4" />{busy ? "Calling…" : "Try it"}</button>
          {!API_ENABLED && <p className="text-xs text-yellow-400">Demo mode: no backend configured (set VITE_API_URL), so live calls are disabled.</p>}
          {sel.method === "POST" && sel.id !== "predict" && <p className="text-xs text-slate-500">“Try it” sends the sample body above for real — use a test recipient.</p>}
          {out && <pre className="bg-navy-900 border border-navy-600 rounded-xl p-4 text-xs overflow-x-auto"><span className={typeof out.status === "number" && out.status < 300 ? "text-green-400" : "text-red-400"}>HTTP {out.status}</span>{"\n"}<span className="text-slate-300">{out.body}</span></pre>}
        </div>
      </div>
      <PartnerKeys />
    </div>
  );
}
