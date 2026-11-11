import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { ALL_AIRPORT_FLIGHTS } from "../../data/airportFlights";
import { CARBON, carbonOps } from "../../lib/opsEngine2";
import { Card, PageHead } from "../../components/ui/PageHead";

export function CarbonOps() {
  const c = useMemo(() => carbonOps(ALL_AIRPORT_FLIGHTS), []);
  return (
    <div className="space-y-6">
      <PageHead title="Carbon-aware Ops" sub="Taxi and ground-power actions that cut emissions, with a scorecard per airline."
        note={`Estimates: single-engine taxi saves ${Math.round(CARBON.singleEngineSaving * 100)}% of ${CARBON.taxiKgPerMin} kg fuel/min; APU off for ${CARBON.groundPowerMin} min at the gate saves ${CARBON.apuKgPerMin} kg/min (ground power instead); ${CARBON.co2PerKg} kg CO2 per kg of fuel. Typical planning values, not measured.`} />
      <Card><div className="text-3xl font-bold text-white">{(c.total / 1000).toFixed(1)} t CO2</div><div className="text-sm text-slate-400">potential saving today if all actions are followed</div></Card>
      <Card><div className="text-sm text-slate-300 mb-2">Airline scorecard (kg CO2 saveable)</div>
        <div className="h-56"><ResponsiveContainer width="100%" height="100%"><BarChart data={c.byAirline}><XAxis dataKey="code" tick={{ fill: "#94a3b8" }} /><YAxis tick={{ fill: "#94a3b8" }} /><Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155" }} /><Bar dataKey="co2" fill="#34d399" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></Card>
      <Card className="overflow-x-auto"><table className="w-full text-sm min-w-[520px]"><thead><tr className="text-left text-xs text-slate-400 border-b border-navy-600"><th className="p-2">Flight</th><th className="p-2">Gate</th><th className="p-2">Taxi</th><th className="p-2">Action</th><th className="p-2">CO2 saved</th></tr></thead>
        <tbody>{c.rows.sort((a, b) => b.co2 - a.co2).slice(0, 12).map(r => <tr key={r.f.id} className="border-b border-navy-700 text-slate-200"><td className="p-2 font-mono">{r.f.flight}</td><td className="p-2">{r.f.gate}</td><td className="p-2">{r.taxi} min</td><td className="p-2 text-xs">Single-engine taxi, APU off on stand</td><td className="p-2">{r.co2} kg</td></tr>)}</tbody></table></Card>
    </div>
  );
}
