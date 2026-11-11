import { useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { ALL_AIRPORT_FLIGHTS } from "../../data/airportFlights";
import { ASSUME, fmt, simulate, summarise, toMin, type Scenario } from "../../lib/opsEngine";

const PRESETS: { label: string; sc: Scenario }[] = [
  { label: "Runway closed 40 min", sc: { closeStart: 14 * 60, closeMin: 40, capacityPct: 100, extraDelay: 0 } },
  { label: "Low visibility (50% capacity)", sc: { closeStart: 0, closeMin: 0, capacityPct: 50, extraDelay: 0 } },
  { label: "Thunderstorm hold 60 min", sc: { closeStart: 16 * 60, closeMin: 60, capacityPct: 100, extraDelay: 0 } },
];

export function WhatIf() {
  const [sc, setSc] = useState<Scenario>(PRESETS[0].sc);
  const base = useMemo(() => summarise(simulate(ALL_AIRPORT_FLIGHTS, { closeStart: 0, closeMin: 0, capacityPct: 100, extraDelay: 0 })), []);
  const rows = useMemo(() => simulate(ALL_AIRPORT_FLIGHTS, sc), [sc]);
  const s = useMemo(() => summarise(rows), [rows]);
  const set = (k: keyof Scenario, v: number) => setSc(p => ({ ...p, [k]: v }));
  const data = rows.map(r => ({ name: r.flight.flight, delay: r.delay }));

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-white">What-if Simulator</h1>
        <p className="text-slate-400 text-sm mt-0.5">Close a runway or cut capacity and see the knock-on delay for every Delhi departure.</p></div>
      <div className="text-xs text-slate-500 bg-navy-800 border border-navy-600 rounded-xl px-4 py-3">Single-runway queue model at {ASSUME.runwayPerHour} movements/hour (planning figure) over today's board. It shows relative impact for decisions, not a forecast of exact times.</div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="bg-navy-800 border border-navy-600 rounded-2xl p-5 space-y-4">
          <div className="flex flex-wrap gap-2">{PRESETS.map(p => <button key={p.label} onClick={() => setSc(p.sc)} className="text-xs px-3 py-2 rounded-lg bg-navy-700 text-slate-200 border border-navy-600 hover:border-sky-500">{p.label}</button>)}</div>
          <label className="block text-sm text-slate-300">Closure starts at <b className="text-white">{fmt(sc.closeStart)}</b>
            <input type="range" min={0} max={1380} step={15} value={sc.closeStart} onChange={e => set("closeStart", +e.target.value)} className="w-full accent-sky-500" /></label>
          <label className="block text-sm text-slate-300">Closure length: <b className="text-white">{sc.closeMin} min</b>
            <input type="range" min={0} max={180} step={5} value={sc.closeMin} onChange={e => set("closeMin", +e.target.value)} className="w-full accent-sky-500" /></label>
          <label className="block text-sm text-slate-300">Runway capacity: <b className="text-white">{sc.capacityPct}%</b>
            <input type="range" min={20} max={100} step={5} value={sc.capacityPct} onChange={e => set("capacityPct", +e.target.value)} className="w-full accent-sky-500" /></label>
          <label className="block text-sm text-slate-300">Extra delay on every flight: <b className="text-white">{sc.extraDelay} min</b>
            <input type="range" min={0} max={60} step={5} value={sc.extraDelay} onChange={e => set("extraDelay", +e.target.value)} className="w-full accent-sky-500" /></label>
        </div>
        <div className="xl:col-span-2 space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[["Flights over 15 min late", s.affected, base.affected], ["Passengers affected", s.pax, base.pax], ["Average delay (min)", s.avg, base.avg], ["Worst delay (min)", s.worst?.delay ?? 0, base.worst?.delay ?? 0]].map(([l, v, b]) => (
              <div key={String(l)} className="bg-navy-800 border border-navy-600 rounded-xl p-4"><div className="text-2xl font-bold text-white">{v}</div><div className="text-xs text-slate-400">{l}</div><div className="text-[11px] text-slate-500 mt-1">normal day: {b}</div></div>))}
          </div>
          <div className="bg-navy-800 border border-navy-600 rounded-2xl p-4">
            <div className="text-sm text-slate-300 mb-2">Delay per departure (min){s.worst && <span className="text-slate-500"> · worst: {s.worst.flight.flight} +{s.worst.delay} min</span>}</div>
            <div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={data}><CartesianGrid stroke="#1e2a44" /><XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10 }} interval={0} angle={-40} textAnchor="end" height={60} /><YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} /><Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155" }} /><Bar dataKey="delay" fill="#38bdf8" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
          </div>
          <div className="bg-navy-800 border border-navy-600 rounded-2xl overflow-x-auto"><table className="w-full text-sm min-w-[480px]"><thead><tr className="text-left text-xs text-slate-400 border-b border-navy-600"><th className="p-3">Flight</th><th className="p-3">Planned</th><th className="p-3">New</th><th className="p-3">Delay</th><th className="p-3">Pax</th></tr></thead>
            <tbody>{rows.map(r => <tr key={r.flight.id} className="border-b border-navy-700 text-slate-200"><td className="p-3 font-mono">{r.flight.flight}</td><td className="p-3">{fmt(toMin(r.flight.dep))}</td><td className="p-3">{fmt(r.actual)}</td><td className={`p-3 ${r.delay > 15 ? "text-yellow-400" : "text-slate-400"}`}>+{r.delay}</td><td className="p-3">{r.flight.pax}</td></tr>)}</tbody></table></div>
        </div>
      </div>
    </div>
  );
}
