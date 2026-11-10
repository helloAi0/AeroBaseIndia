import { useMemo, useState } from "react";
import { Leaf, TreePine, Factory, Plane } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { AIRLINES } from "../../data/airlines";
import { useAirport } from "../../hooks/useAirport";

/**
 * Carbon estimates. METHOD (shown to the user): CO2 = fuel burn × 3.16 kg CO2 per kg of jet fuel (ICAO factor).
 * Fuel burn per flight is an APPROXIMATE average for the aircraft type and typical sector length — not measured data.
 */
const CO2_PER_KG_FUEL = 3.16;
const TYPES: Record<string, { name: string; fuelKgPerHour: number; seats: number }> = {
  A320: { name: "A320neo", fuelKgPerHour: 2400, seats: 180 },
  A321: { name: "A321neo", fuelKgPerHour: 2700, seats: 222 },
  B738: { name: "B737-800", fuelKgPerHour: 2500, seats: 189 },
  A359: { name: "A350-900", fuelKgPerHour: 5800, seats: 300 },
  B77W: { name: "B777-300ER", fuelKgPerHour: 7500, seats: 340 },
};
// Typical daily departures per airline at the airport (illustrative operating assumptions)
const OPS = [
  { code: "6E", type: "A320", hours: 2.1, daily: 68 }, { code: "AI", type: "A321", hours: 2.4, daily: 41 },
  { code: "UK", type: "A320", hours: 2.2, daily: 26 }, { code: "SG", type: "B738", hours: 2.0, daily: 22 },
  { code: "QP", type: "B738", hours: 2.1, daily: 14 }, { code: "IX", type: "B738", hours: 2.6, daily: 12 },
  { code: "EK", type: "B77W", hours: 3.9, daily: 4 },
];
const SCALE: Record<string, number> = { DEL: 1, BOM: 0.85, BLR: 0.6 };
const OFFSET_INR_PER_TONNE = 1200; // indicative voluntary-market price; configurable assumption

export function CarbonDashboard() {
  const { code, name } = useAirport();
  const [window_, setWindow] = useState<7 | 30>(30);

  const rows = useMemo(() => OPS.map(o => {
    const t = TYPES[o.type], fuel = t.fuelKgPerHour * o.hours * o.daily * (SCALE[code] ?? 1);
    const co2t = fuel * CO2_PER_KG_FUEL / 1000;
    const pax = t.seats * 0.82 * o.daily * (SCALE[code] ?? 1);
    return { ...o, airline: AIRLINES[o.code]?.name ?? o.code, type: t.name, co2t: Math.round(co2t), perPax: Math.round(co2t * 1000 / pax) };
  }), [code]);

  const dailyTotal = rows.reduce((a, r) => a + r.co2t, 0);
  const trend = useMemo(() => Array.from({ length: window_ }, (_, i) => {
    const d = new Date(Date.now() - (window_ - 1 - i) * 864e5);
    const wk = [0.96, 1, 1, 1.02, 1.06, 1.04, 0.92][d.getDay()];          // weekday pattern
    return { d: d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }), t: Math.round(dailyTotal * wk) };
  }), [window_, dailyTotal]);
  const period = trend.reduce((a, x) => a + x.t, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold text-white">Carbon Dashboard</h1>
          <p className="text-slate-400 text-sm mt-0.5">{name} — estimated departure emissions by airline</p></div>
        <div className="flex bg-navy-800 border border-navy-600 rounded-lg p-0.5">
          {([7, 30] as const).map(d => <button key={d} onClick={() => setWindow(d)}
            className={`px-3 py-1.5 text-sm rounded-md ${d === window_ ? "bg-green-500/20 text-green-300" : "text-slate-400"}`}>{d} days</button>)}
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { l: `CO₂ last ${window_} days`, v: `${(period / 1000).toFixed(1)} kt`, i: <Factory className="w-5 h-5" /> },
          { l: "Per day (avg)", v: `${Math.round(period / window_).toLocaleString()} t`, i: <Plane className="w-5 h-5" /> },
          { l: "Trees to offset 1 day*", v: Math.round(dailyTotal * 1000 / 21).toLocaleString(), i: <TreePine className="w-5 h-5" /> },
          { l: "Offset cost / day", v: `₹${((dailyTotal * OFFSET_INR_PER_TONNE) / 1e5).toFixed(1)} L`, i: <Leaf className="w-5 h-5" /> },
        ].map(c => (
          <div key={c.l} className="bg-navy-800 border border-navy-600 rounded-2xl p-4">
            <div className="text-green-400 mb-2">{c.i}</div>
            <div className="text-2xl font-bold font-mono text-white">{c.v}</div><div className="text-xs text-slate-400">{c.l}</div>
          </div>))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="bg-navy-800 border border-navy-600 rounded-2xl p-5">
          <h2 className="font-semibold text-white mb-4">Daily CO₂ (tonnes)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trend} margin={{ left: -15 }}>
              <XAxis dataKey="d" tick={{ fill: "#475569", fontSize: 10 }} interval={window_ > 7 ? 4 : 0} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#475569", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#0f1629", border: "1px solid #1e2d4d", borderRadius: 10, fontSize: 12 }} />
              <Area type="monotone" dataKey="t" stroke="#22c55e" fill="#22c55e22" strokeWidth={2} name="t CO₂" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-navy-800 border border-navy-600 rounded-2xl p-5">
          <h2 className="font-semibold text-white mb-4">By airline (t CO₂ / day)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={rows} layout="vertical" margin={{ left: 20 }}>
              <XAxis type="number" tick={{ fill: "#475569", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="airline" tick={{ fill: "#94a3b8", fontSize: 11 }} width={110} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#0f1629", border: "1px solid #1e2d4d", borderRadius: 10, fontSize: 12 }} />
              <Bar dataKey="co2t" fill="#22c55e" radius={[0, 6, 6, 0]} name="t CO₂/day" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-navy-800 border border-navy-600 rounded-2xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs text-slate-400 border-b border-navy-600">
            {["Airline", "Main type", "Departures/day", "t CO₂/day", "g CO₂ per passenger-trip"].map(h => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
          <tbody>{rows.map(r => (
            <tr key={r.code} className="border-b border-navy-600/50 text-slate-200">
              <td className="px-4 py-3">{r.airline}</td><td className="px-4 py-3">{r.type}</td>
              <td className="px-4 py-3 font-mono">{Math.round(r.daily * (SCALE[code] ?? 1))}</td>
              <td className="px-4 py-3 font-mono">{r.co2t}</td><td className="px-4 py-3 font-mono">{r.perPax.toLocaleString()}</td></tr>))}</tbody>
        </table>
      </div>
      <p className="text-[11px] text-slate-500">
        Estimates, not measurements: CO₂ = fuel burn × {CO2_PER_KG_FUEL} kg CO₂/kg fuel (ICAO factor), using average fuel burn per aircraft type,
        typical sector times and assumed daily departures. *Tree figure assumes ~21 kg CO₂ absorbed per tree per year. Offset price ₹{OFFSET_INR_PER_TONNE}/t is an indicative assumption.
        Replace the operating assumptions with real fuel-uplift data from the Fuel module for audited reporting.
      </p>
    </div>
  );
}
