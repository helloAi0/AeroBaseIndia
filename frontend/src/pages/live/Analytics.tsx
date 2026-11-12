import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useBoard } from "../../hooks/useBoard";
import { delayMinutes } from "../../lib/opsEngine";
import { Card, PageHead, Stat, Empty } from "../../components/ui/PageHead";

const TT = { background: "#0f1629", border: "1px solid #1e2d4d", borderRadius: 12, fontSize: 12 };
const Chart = ({ title, data, k, color }: { title: string; data: any[]; k: string; color: string }) => (
  <Card><div className="text-sm text-slate-300 mb-2">{title}</div><div className="h-56"><ResponsiveContainer width="100%" height="100%"><BarChart data={data}><CartesianGrid stroke="#1e2a44" /><XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} interval={0} /><YAxis allowDecimals={false} tick={{ fill: "#94a3b8", fontSize: 11 }} /><Tooltip contentStyle={TT} /><Bar dataKey={k} fill={color} radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></Card>);

/** Operational analytics computed from the airport's flight board. Used by Analytics and KPI pages. */
export function Analytics({ title = "Analytics" }: { title?: string }) {
  const { flights, live } = useBoard();
  const m = useMemo(() => {
    const active = flights.filter(f => f.status !== "Cancelled");
    const delayed = active.filter(f => delayMinutes(f) > 15);
    const pax = flights.reduce((s, f) => s + f.pax, 0);
    const air: Record<string, { n: number; d: number; late: number }> = {};
    flights.forEach(f => { const a = (air[f.airCode] ??= { n: 0, d: 0, late: 0 }); a.n++; a.d += delayMinutes(f); if (delayMinutes(f) > 15) a.late++; });
    const term: Record<string, number> = {}; flights.forEach(f => { term[f.terminal] = (term[f.terminal] ?? 0) + f.pax; });
    const hour = Array.from({ length: 24 }, (_, h) => ({ name: `${String(h).padStart(2, "0")}h`, n: flights.filter(f => parseInt(f.dep.slice(0, 2)) === h).length })).filter(x => x.n);
    const routes: Record<string, { pax: number; n: number }> = {}; flights.forEach(f => { const k = `${f.from}→${f.to}`; (routes[k] ??= { pax: 0, n: 0 }); routes[k].pax += f.pax; routes[k].n++; });
    return { active, delayed, pax, cancelled: flights.length - active.length,
      onTime: active.length ? Math.round(100 * (active.length - delayed.length) / active.length) : null,
      avgDelay: delayed.length ? Math.round(delayed.reduce((s, f) => s + delayMinutes(f), 0) / delayed.length) : 0,
      airlines: Object.entries(air).map(([name, v]) => ({ name, avgDelay: v.n ? Math.round(v.d / v.n) : 0, flights: v.n, late: v.late })),
      terminals: Object.entries(term).map(([name, v]) => ({ name, pax: v })), hour,
      routes: Object.entries(routes).map(([r, v]) => ({ r, ...v })).sort((a, b) => b.pax - a.pax).slice(0, 8) };
  }, [flights]);
  if (flights.length === 0) return <Empty>No flights on the board yet. Add flights from the Flight Scheduler or ask an airline to sync its schedule.</Empty>;
  return (
    <div className="space-y-6">
      <PageHead title={title} sub={`Computed from ${flights.length} flights on today's board${live ? "" : " (demo data)"}.`} />
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
        <Stat label="Flights" value={flights.length} /><Stat label="Passengers" value={m.pax.toLocaleString("en-IN")} />
        <Stat label="On-time" value={m.onTime === null ? "—" : `${m.onTime}%`} tone="text-green-400" sub="delay 15 min or less" />
        <Stat label="Avg delay (delayed flights)" value={`${m.avgDelay} min`} tone="text-yellow-400" /><Stat label="Cancelled" value={m.cancelled} tone="text-red-400" />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Chart title="Average delay per airline (min)" data={m.airlines} k="avgDelay" color="#f59e0b" />
        <Chart title="Passengers per terminal" data={m.terminals} k="pax" color="#38bdf8" />
        <Chart title="Departures per hour" data={m.hour} k="n" color="#2dd4bf" />
        <Card className="overflow-x-auto"><div className="text-sm text-slate-300 mb-2">Busiest routes</div><table className="w-full text-sm min-w-[300px]"><tbody>{m.routes.map(r => <tr key={r.r} className="border-b border-navy-700 text-slate-200"><td className="p-2 font-mono">{r.r}</td><td className="p-2 text-slate-400">{r.n} flights</td><td className="p-2 text-right">{r.pax.toLocaleString("en-IN")} pax</td></tr>)}</tbody></table></Card>
      </div>
    </div>
  );
}
export const AnalyticsDashboard = () => <Analytics title="Analytics" />;
export const KPIDashboard = () => <Analytics title="KPI Dashboard" />;
