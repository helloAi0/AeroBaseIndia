import { useCallback, useEffect, useState } from "react";
import { KeyRound, Trash2, Copy } from "lucide-react";
import { api } from "../../api/client";
import { API_ENABLED } from "../../config";
import { copyText } from "../../lib/clipboard";

interface KeyRow { id: string; partner_id: string; label: string; active: boolean; created_at: string; last_used_at: string }

/** Issue and revoke airline API keys for /api/partner/* (real backend only). */
export function PartnerKeys() {
  const [rows, setRows] = useState<KeyRow[]>([]);
  const [partner, setPartner] = useState(""); const [label, setLabel] = useState("");
  const [fresh, setFresh] = useState<string | null>(null); const [msg, setMsg] = useState("");
  const load = useCallback(() => api.get("/api/partner-keys").then(r => setRows(r.data.keys ?? [])).catch(() => setMsg("Could not load keys (admin sign-in with the live backend required).")), []);
  useEffect(() => { if (API_ENABLED) void load(); }, [load]);

  if (!API_ENABLED) return <div className="bg-navy-800 border border-navy-600 rounded-2xl p-5 text-sm text-yellow-400">Partner API keys need the live backend (set VITE_API_URL). Demo mode has none.</div>;

  const create = async (e: React.FormEvent) => {
    e.preventDefault(); setMsg(""); setFresh(null);
    try { const r = await api.post("/api/partner-keys", { partner_id: partner.trim(), label: label.trim() }); setFresh(r.data.api_key); setPartner(""); setLabel(""); void load(); }
    catch (err: any) { setMsg(err?.response?.data?.error ?? "Could not create key"); }
  };
  const revoke = async (id: string) => { try { await api.delete(`/api/partner-keys/${id}`); void load(); } catch { setMsg("Could not revoke key"); } };
  const inp = "bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-white text-sm min-w-0 w-full";
  return (
    <div className="bg-navy-800 border border-navy-600 rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2 text-white font-semibold"><KeyRound className="w-4 h-4 text-sky-400" />Partner API keys</div>
      <p className="text-xs text-slate-400">Give an airline a key to push its flight schedule to <code>/api/partner/flights/sync</code> with <code>X-API-Key</code> and <code>X-Partner-Id</code> headers. Keys are stored hashed and shown once.</p>
      <form onSubmit={create} className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input className={inp} placeholder="Partner id, e.g. AI" value={partner} onChange={e => setPartner(e.target.value)} aria-label="Partner id" />
        <input className={inp} placeholder="Label (optional)" value={label} onChange={e => setLabel(e.target.value)} aria-label="Label" />
        <button className="px-4 py-2 rounded-lg bg-sky-500 text-white text-sm font-semibold">Create key</button></form>
      {fresh && <div className="p-3 rounded-xl border border-green-500/40 bg-green-500/10 text-xs break-all text-green-200">New key (copy now, it will not be shown again):<div className="font-mono mt-1 flex gap-2 items-start"><span className="min-w-0">{fresh}</span><button onClick={() => void copyText(fresh)} aria-label="Copy key"><Copy className="w-4 h-4" /></button></div></div>}
      {msg && <div className="text-xs text-red-400">{msg}</div>}
      <div className="space-y-2">{rows.map(k => <div key={k.id} className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-200 border-b border-navy-700 pb-2">
        <div className="min-w-0"><span className="font-mono text-white">{k.partner_id}</span> <span className="text-slate-400 text-xs">{k.label} · created {k.created_at} · last used {k.last_used_at || "never"}</span></div>
        {k.active ? <button onClick={() => void revoke(k.id)} className="text-xs flex items-center gap-1 text-red-400"><Trash2 className="w-3 h-3" />Revoke</button> : <span className="text-xs text-slate-500">Revoked</span>}</div>)}
        {rows.length === 0 && <div className="text-xs text-slate-500">No keys yet.</div>}</div>
    </div>
  );
}
