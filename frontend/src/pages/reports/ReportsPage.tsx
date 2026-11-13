import { useState } from "react";
import { Download, FileText, Plane, CreditCard, Shield, Users, BarChart3 } from "lucide-react";
import { api } from "../../api/client";
import { useBoard } from "../../hooks/useBoard";
import { useAirport } from "../../hooks/useAirport";
import { API_ENABLED } from "../../config";
import { useAuthStore } from "../../store/authStore";
import { toCsv, downloadText } from "../../lib/csv";
import { PageHead, Card } from "../../components/ui/PageHead";

type Report = { id: string; title: string; desc: string; icon: React.ReactNode; build: () => Promise<Record<string, unknown>[]> };

/** Reports are generated from the live data on demand and downloaded as CSV (opens in Excel / Google Sheets). */
export function ReportsPage() {
  const { flights } = useBoard(); const ap = useAirport(); const live = API_ENABLED && useAuthStore(s => s.source) === "backend";
  const [busy, setBusy] = useState(""); const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null); const [made, setMade] = useState<{ name: string; rows: number; at: string }[]>([]);
  const rec = async (c: string) => live ? (await api.get(`/api/records/${c}`)).data.records as Record<string, unknown>[] : [];

  const REPORTS: Report[] = [
    { id: "flights", title: "Flight operations", desc: "Every flight today: route, gate, status, delay and cause", icon: <Plane className="w-6 h-6" />,
      build: async () => (flights as any[]).map(f => ({ flight: f.flight, airline: f.airline, from: f.from, to: f.to, departs: f.dep, gate: f.gate, terminal: f.terminal, status: f.status, passengers: f.pax, aircraft: f.aircraft, issue: f.issue ?? "" })) },
    { id: "passengers", title: "Passenger traffic", desc: "Passengers per flight and per airline", icon: <BarChart3 className="w-6 h-6" />,
      build: async () => { const m = new Map<string, { flights: number; passengers: number }>(); for (const f of flights as any[]) { const k = f.airline || f.airCode; const v = m.get(k) ?? { flights: 0, passengers: 0 }; v.flights++; v.passengers += Number(f.pax) || 0; m.set(k, v); } return [...m].map(([airline, v]) => ({ airline, ...v })); } },
    { id: "security", title: "Security & incidents", desc: "Incident log and security events", icon: <Shield className="w-6 h-6" />, build: async () => [...await rec("incidents"), ...await rec("security_events")] },
    { id: "staff", title: "Staff roster", desc: "Staff, roles, shifts and status", icon: <Users className="w-6 h-6" />, build: () => rec("staff") },
    { id: "baggage", title: "Baggage", desc: "All tracked bags and their status", icon: <FileText className="w-6 h-6" />, build: () => rec("baggage") },
    { id: "revenue", title: "Concession & bid revenue", desc: "Retail units and bids", icon: <CreditCard className="w-6 h-6" />, build: async () => [...await rec("stores"), ...await rec("bids")] },
  ];

  const generate = async (r: Report) => {
    setBusy(r.id); setMsg(null);
    try {
      const rows = await r.build(); if (!rows.length) { setMsg({ ok: false, t: `${r.title}: there is no data to export yet.` }); return; }
      const name = `${ap.code}-${r.id}-${new Date().toISOString().slice(0, 10)}.csv`; downloadText(name, toCsv(rows));
      setMade(m => [{ name, rows: rows.length, at: new Date().toLocaleTimeString() }, ...m].slice(0, 10)); setMsg({ ok: true, t: `${name} downloaded (${rows.length} rows).` });
    } catch (e: any) { setMsg({ ok: false, t: e?.response?.data?.error ?? "Could not generate the report" }); } finally { setBusy(""); }
  };

  return (
    <div className="space-y-6">
      <PageHead title="Reports & Export" sub={`${ap.name} · generated from ${live ? "live" : "demo"} data and downloaded as CSV`} />
      {msg && <div className={`text-sm ${msg.ok ? "text-green-400" : "text-yellow-400"}`}>{msg.t}</div>}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">{REPORTS.map(r => (
        <Card key={r.id}><div className="flex items-start gap-4"><div className="p-3 rounded-xl bg-sky-500/15 text-sky-400 shrink-0">{r.icon}</div>
          <div className="flex-1 min-w-0"><h3 className="font-semibold text-white">{r.title}</h3><p className="text-sm text-slate-400">{r.desc}</p></div>
          <button disabled={busy === r.id} onClick={() => void generate(r)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-sky-500/15 text-sky-300 border border-sky-500/20 disabled:opacity-50"><Download className="w-4 h-4" />{busy === r.id ? "Working…" : "Download CSV"}</button></div></Card>))}</div>
      {made.length > 0 && <Card><div className="text-sm font-semibold text-white mb-2">Downloaded this session</div><ul className="text-xs text-slate-300 space-y-1">{made.map(m => <li key={m.at + m.name}>{m.at} · {m.name} · {m.rows} rows</li>)}</ul></Card>}
    </div>
  );
}
