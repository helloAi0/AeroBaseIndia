import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useBoard } from "../../hooks/useBoard";
import { useCollection } from "../../hooks/useCollection";
import { CARBON, carbonOps } from "../../lib/opsEngine2";
import { Card, PageHead, Stat, Empty } from "../../components/ui/PageHead";

const KG_PER_LITRE = 0.8;   // Jet A-1 density
export function CarbonDashboard() {
  const { flights } = useBoard();
  const fuel = useCollection<{ flight: string; loaded: number; status: string }>("fuel");
  const c = useMemo(() => carbonOps(flights), [flights]);
  const byAirline = useMemo(() => {
    const code = (fl: string) => fl.split("-")[0].toUpperCase(); const o: Record<string, number> = {};
    fuel.items.forEach(f => { o[code(f.flight)] = (o[code(f.flight)] ?? 0) + (Number(f.loaded) || 0) * KG_PER_LITRE * CARBON.co2PerKg / 1000; });
    return Object.entries(o).map(([name, t]) => ({ name, t: +t.toFixed(1) })).sort((a, b) => b.t - a.t);
  }, [fuel.items]);
  const burned = byAirline.reduce((s, x) => s + x.t, 0);
  if (!flights.length) return <Empty>No flights yet.</Empty>;
  return (
    <div className="space-y-6">
      <PageHead title="Carbon Dashboard" sub="Emissions from recorded fuel uplift, and what ground operations could save."
        note={`Emissions = litres loaded (Fuel Management) × ${KG_PER_LITRE} kg/L × ${CARBON.co2PerKg} kg CO2/kg. Savings use the planning figures on the Carbon Ops page.`} />
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4"><Stat label="Fuel orders recorded" value={fuel.items.length} /><Stat label="CO2 from recorded fuel" value={`${burned.toFixed(1)} t`} tone="text-yellow-400" />
        <Stat label="Potential ground saving today" value={`${(c.total / 1000).toFixed(1)} t`} tone="text-green-400" /><Stat label="Flights covered" value={c.rows.length} /></div>
      <Card><div className="text-sm text-slate-300 mb-2">CO2 by airline from fuel uplift (tonnes)</div>
        {byAirline.length === 0 ? <div className="text-sm text-slate-500">Record fuel orders in Fuel Management to see emissions by airline.</div> :
          <div className="h-56"><ResponsiveContainer width="100%" height="100%"><BarChart data={byAirline}><XAxis dataKey="name" tick={{ fill: "#94a3b8" }} /><YAxis tick={{ fill: "#94a3b8" }} /><Tooltip contentStyle={{ background: "#0f1629", border: "1px solid #1e2d4d" }} /><Bar dataKey="t" fill="#f59e0b" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>}</Card>
    </div>
  );
}
