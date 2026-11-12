import { useCallback, useEffect, useState } from "react";
import { Building2, Plus } from "lucide-react";
import { api } from "../../api/client";
import { API_ENABLED } from "../../config";
import { useAuthStore } from "../../store/authStore";

interface T { id: string; code: string; name: string; plan: string; users: number; flights: number; created_at: string }
const PLANS = ["STARTER", "BASIC", "STANDARD", "PREMIUM", "ENTERPRISE"];

/** Platform owner view: every airport (tenant) on the platform, with live counts, and onboarding of new airports. */
export function TenantManager() {
  const live = API_ENABLED && useAuthStore(s => s.source) === "backend";
  const [rows, setRows] = useState<T[]>([]); const [err, setErr] = useState(""); const [ok, setOk] = useState("");
  const [f, setF] = useState({ airport_name: "", airport_code: "", plan: "STANDARD" });
  const load = useCallback(() => api.get("/api/tenants").then(r => setRows(r.data.tenants ?? [])).catch(e => setErr(e?.response?.data?.error ?? "Could not load airports")), []);
  useEffect(() => { if (live) void load(); }, [live, load]);
  if (!live) return <div className="bg-navy-800 border border-navy-600 rounded-2xl p-6 text-sm text-yellow-400">Airport management needs the live backend and a platform-owner sign-in.</div>;
  const create = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(""); setOk("");
    try { await api.post("/api/tenants", { ...f, airport_code: f.airport_code.toUpperCase().trim(), airport_name: f.airport_name.trim() }); setOk(`${f.airport_code.toUpperCase()} added.`); setF({ airport_name: "", airport_code: "", plan: "STANDARD" }); void load(); }
    catch (x: any) { setErr(x?.response?.data?.error ?? "Could not add airport"); }
  };
  const inp = "bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-white text-sm min-w-0 w-full";
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-white">Airports on the platform</h1><p className="text-slate-400 text-sm mt-0.5">Each airport is an isolated tenant with its own users, flights and data.</p></div>
      <form onSubmit={create} className="bg-navy-800 border border-navy-600 rounded-2xl p-5 grid grid-cols-1 md:grid-cols-4 gap-3">
        <input className={inp} placeholder="Airport name" value={f.airport_name} onChange={e => setF({ ...f, airport_name: e.target.value })} aria-label="Airport name" />
        <input className={inp} placeholder="Code e.g. HYD" maxLength={4} value={f.airport_code} onChange={e => setF({ ...f, airport_code: e.target.value })} aria-label="Airport code" />
        <select className={inp} value={f.plan} onChange={e => setF({ ...f, plan: e.target.value })}>{PLANS.map(p => <option key={p}>{p}</option>)}</select>
        <button className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-sky-500 text-white text-sm font-semibold"><Plus className="w-4 h-4" />Add airport</button>
      </form>
      {err && <div className="text-sm text-red-400">{err}</div>}{ok && <div className="text-sm text-green-400">{ok}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{rows.map(t => (
        <div key={t.id} className="bg-navy-800 border border-navy-600 rounded-2xl p-5">
          <div className="flex items-center gap-2 text-white font-semibold"><Building2 className="w-4 h-4 text-sky-400" />{t.code}<span className="text-xs text-slate-400 font-normal">{t.plan}</span></div>
          <div className="text-sm text-slate-300 mt-1 break-words">{t.name}</div>
          <div className="text-xs text-slate-400 mt-3">{t.users} users · {t.flights} flights · since {t.created_at || "—"}</div></div>))}</div>
    </div>
  );
}
