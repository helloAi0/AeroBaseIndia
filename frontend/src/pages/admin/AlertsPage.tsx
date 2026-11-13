import { useEffect, useMemo, useState } from "react";
import { useBoard } from "../../hooks/useBoard";
import { useCollection } from "../../hooks/useCollection";
import { api } from "../../api/client";
import { API_ENABLED } from "../../config";
import { useAuthStore } from "../../store/authStore";
import { Bell, AlertTriangle, Plane, Clock, Zap, X } from "lucide-react";

type Alert = { id: string; type: string; title: string; msg: string; time: string; sev: string; read: boolean };
const READ_KEY = "aerobase.alerts.read";
const loadRead = (): string[] => { try { return JSON.parse(localStorage.getItem(READ_KEY) || "[]"); } catch { return []; } };
const saveRead = (ids: string[]) => { try { localStorage.setItem(READ_KEY, JSON.stringify(ids.slice(-500))); } catch { /* storage unavailable */ } };

const TYPE_ICON: Record<string, React.ReactNode> = {
  DELAY:    <Plane className="w-4 h-4"/>,
  SECURITY: <AlertTriangle className="w-4 h-4"/>,
  SYSTEM:   <Zap className="w-4 h-4"/>,
  BILLING:  <Clock className="w-4 h-4"/>,
};

const SEV_STYLE: Record<string,string> = {
  HIGH:    "border-l-red-500 bg-red-500/5",
  MED:     "border-l-yellow-500 bg-yellow-500/5",
  LOW:     "border-l-sky-500 bg-sky-500/5",
  INFO:    "border-l-slate-500 bg-navy-700/30",
  SUCCESS: "border-l-green-500 bg-green-500/5",
};

const SEV_ICON_COLOR: Record<string,string> = {
  HIGH:"text-red-400", MED:"text-yellow-400",
  LOW:"text-sky-400",  INFO:"text-slate-400", SUCCESS:"text-green-400",
};

export function AlertsPage() {
  const [filter, setFilter] = useState("ALL");
  const { flights } = useBoard(); const live = API_ENABLED && useAuthStore(x => x.source) === "backend";
  const incidents = useCollection<any>("incidents", []).items ?? []; const maint = useCollection<any>("maintenance", []).items ?? [];
  const [health, setHealth] = useState<any>(null); const [failed, setFailed] = useState<any[]>([]); const [readIds, setReadIds] = useState<string[]>(loadRead);
  useEffect(() => {
    if (!live) return; const load = () => { api.get("/health").then(r => setHealth(r.data)).catch(() => setHealth({ status: "UNREACHABLE" })); api.get("/audit/logs", { params: { action: "LOGIN_FAILED", limit: 10 } }).then(r => setFailed(r.data.logs ?? r.data ?? [])).catch(() => setFailed([])); };
    load(); const t = setInterval(load, 30000); return () => clearInterval(t);
  }, [live]);

  const alerts: Alert[] = useMemo(() => {
    const out: Omit<Alert, "read">[] = [];
    for (const f of flights as any[]) {
      if (f.status === "Delayed" || f.status === "Cancelled") out.push({ id: `fl-${f.id}-${f.status}`, type: "DELAY", title: `${f.flight} ${f.status.toLowerCase()}${f.delay ? ` by ${f.delay} min` : ""}`, msg: `${f.from}→${f.to}, gate ${f.gate || "TBA"}${f.issue ? ` · ${f.issue}` : ""}`, time: f.dep, sev: f.status === "Cancelled" || (f.delay ?? 0) >= 45 ? "HIGH" : "MED" });
      else if (f.status === "Boarding") out.push({ id: `fl-${f.id}-boarding`, type: "DELAY", title: `${f.flight} boarding`, msg: `Gate ${f.gate || "TBA"} · ${f.to}`, time: f.dep, sev: "INFO" });
    }
    for (const i of incidents) if (i.status !== "Resolved" && (i.severity === "CRIT" || i.severity === "HIGH")) out.push({ id: `inc-${i.id}`, type: "SECURITY", title: i.title ?? "Incident", msg: `${i.location ?? ""} · ${i.status}`, time: (i.created_at ?? "").slice(0, 16).replace("T", " "), sev: "HIGH" });
    for (const m of maint) if (m.status !== "Completed" && m.type === "AOG") out.push({ id: `mx-${m.id}`, type: "SYSTEM", title: `AOG: ${m.aircraft ?? "aircraft"}`, msg: m.desc ?? "", time: (m.created_at ?? "").slice(0, 16).replace("T", " "), sev: "HIGH" });
    if (health) for (const k of ["database", "redis", "ai_engine"]) if (health[k] === "DOWN") out.push({ id: `sys-${k}`, type: "SYSTEM", title: `${k.replace("_", " ")} is down`, msg: k === "database" ? "The API cannot serve data" : "Dependent features run in degraded mode", time: "now", sev: k === "database" ? "HIGH" : "MED" });
    for (const l of failed) out.push({ id: `sec-${l.id ?? l.created_at}`, type: "SECURITY", title: "Failed login attempt", msg: `${l.ip_address ?? l.ip ?? "unknown IP"}`, time: String(l.created_at ?? "").slice(0, 16).replace("T", " "), sev: "LOW" });
    const seen = new Set<string>(); return out.filter(a => !seen.has(a.id) && seen.add(a.id)).map(a => ({ ...a, read: readIds.includes(a.id) }));
  }, [flights, incidents, maint, health, failed, readIds]);

  const filtered = filter==="ALL" ? alerts : alerts.filter(a=>a.type===filter);
  const unread   = alerts.filter(a=>!a.read).length;

  const markRead = (id:string) => setReadIds(prev => { const n = [...prev, id]; saveRead(n); return n; });
  const markAllRead = () => setReadIds(prev => { const n = [...prev, ...alerts.map(a => a.id)]; saveRead(n); return n; });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Alerts & Notifications</h1>
          <p className="text-slate-400 text-sm mt-0.5">Live alerts from flights, incidents, maintenance and system health</p>
        </div>
        <div className="flex items-center gap-3">
          {unread>0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              {unread} new
            </span>
          )}
          <button onClick={markAllRead}
            className="text-xs text-sky-400 hover:text-sky-300 transition-colors">
            Mark all read
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {["ALL","DELAY","SECURITY","SYSTEM"].map(f=>(
          <button key={f} onClick={()=>setFilter(f)}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all border ${
              filter===f
                ?"bg-sky-500 text-white border-sky-500"
                :"bg-navy-800 text-slate-400 border-navy-600 hover:border-navy-500 hover:text-white"
            }`}>{f}</button>
        ))}
      </div>

      {/* Alert list */}
      <div className="space-y-2">
        {filtered.map(alert=>(
          <div key={alert.id}
            className={`border-l-4 ${SEV_STYLE[alert.sev]} rounded-r-2xl p-4 flex items-start gap-4
              ${!alert.read?"ring-1 ring-inset ring-white/5":""} transition-all`}>
            <div className={`mt-0.5 flex-shrink-0 ${SEV_ICON_COLOR[alert.sev]}`}>
              {TYPE_ICON[alert.type]||<Bell className="w-4 h-4"/>}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className={`text-sm font-medium ${!alert.read?"text-white":"text-slate-300"}`}>
                  {alert.title}
                  {!alert.read && <span className="ml-2 w-1.5 h-1.5 bg-sky-400 rounded-full inline-block"/>}
                </p>
                <span className="text-xs text-slate-500 flex-shrink-0">{alert.time}</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{alert.msg}</p>
            </div>
            {!alert.read && (
              <button onClick={()=>markRead(alert.id)}
                className="flex-shrink-0 p-1 hover:bg-navy-600 rounded-lg text-slate-500 hover:text-white transition-colors">
                <X className="w-3.5 h-3.5"/>
              </button>
            )}
          </div>
        ))}
        {filtered.length===0 && (
          <div className="text-center py-12 text-slate-500">
            <Bell className="w-10 h-10 mx-auto mb-3 opacity-30"/>
            <p>No alerts in this category</p>
          </div>
        )}
      </div>
    </div>
  );
}
