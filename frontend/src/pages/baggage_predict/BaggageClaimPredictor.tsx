import { useMemo, useState } from "react";
import { Briefcase, Clock } from "lucide-react";
import { useAirport } from "../../hooks/useAirport";

/**
 * Estimate when bags reach the carousel. A transparent additive model (every term is shown), NOT a trained ML model:
 *   first bag = taxi-in + chocks-to-door unload start + belt travel;  last bag = first bag + (bags / unload rate)
 * Airport constants are typical planning values; tune them with your own historical data.
 */
const AIRPORT_TUNING: Record<string, { taxiIn: number; belt: number }> = {
  DEL: { taxiIn: 9, belt: 7 }, BOM: { taxiIn: 8, belt: 8 }, BLR: { taxiIn: 6, belt: 6 },
};
const AIRCRAFT = [
  { id: "nb", label: "Narrow-body (A320/B737)", rate: 6, start: 7, bags: 150 },
  { id: "wb", label: "Wide-body (A350/B777)", rate: 9, start: 10, bags: 380 },
];

export function BaggageClaimPredictor() {
  const { code, name } = useAirport();
  const tune = AIRPORT_TUNING[code] ?? AIRPORT_TUNING.DEL;
  const [ac, setAc] = useState(AIRCRAFT[0]);
  const [bags, setBags] = useState(150);
  const [land, setLand] = useState(() => { const d = new Date(Date.now() + 20 * 60000); return d.toTimeString().slice(0, 5); });
  const [crew, setCrew] = useState(1);       // ramp crews (1 = normal, 2 = double staffed)
  const [bad, setBad] = useState(false);     // heavy rain / lightning stop

  const r = useMemo(() => {
    const [h, m] = land.split(":").map(Number);
    const base = new Date(); base.setHours(h, m, 0, 0);
    const rate = ac.rate * crew * (bad ? 0.6 : 1);
    const first = tune.taxiIn + ac.start + tune.belt + (bad ? 10 : 0);
    const last = first + Math.ceil(bags / rate);
    const at = (min: number) => new Date(base.getTime() + min * 60000).toTimeString().slice(0, 5);
    const conf = bad ? "Low" : crew === 1 && bags <= ac.bags * 1.2 ? "High" : "Medium";
    return { first, last, firstAt: at(first), lastAt: at(last), conf, rate, parts: [["Taxi-in", tune.taxiIn], ["Unload start", ac.start], ["Belt travel", tune.belt], ...(bad ? [["Weather hold", 10]] : []), ["Unloading (all bags)", last - first]] as [string, number][] };
  }, [land, ac, bags, crew, bad, tune]);

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-white">Baggage Claim Predictor</h1>
        <p className="text-slate-400 text-sm mt-0.5">{name} — when will bags reach the carousel?</p></div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="bg-navy-800 border border-navy-600 rounded-2xl p-5 space-y-5">
          <label className="block text-sm text-slate-300">Landing time
            <input type="time" value={land} onChange={e => setLand(e.target.value)} className="mt-1 w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-white" /></label>
          <label className="block text-sm text-slate-300">Aircraft
            <select value={ac.id} onChange={e => { const a = AIRCRAFT.find(x => x.id === e.target.value)!; setAc(a); setBags(a.bags); }}
              className="mt-1 w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-white">{AIRCRAFT.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}</select></label>
          <label className="block text-sm text-slate-300">Checked bags: <b className="text-white">{bags}</b>
            <input type="range" min={20} max={600} value={bags} onChange={e => setBags(+e.target.value)} className="w-full accent-sky-500" /></label>
          <div className="flex gap-3 text-sm">
            <label className="flex items-center gap-2 text-slate-300"><input type="checkbox" checked={crew === 2} onChange={e => setCrew(e.target.checked ? 2 : 1)} /> Double ramp crew</label>
            <label className="flex items-center gap-2 text-slate-300"><input type="checkbox" checked={bad} onChange={e => setBad(e.target.checked)} /> Heavy rain / lightning hold</label>
          </div>
        </div>
        <div className="bg-navy-800 border border-navy-600 rounded-2xl p-5">
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div className="bg-sky-500/10 border border-sky-500/20 rounded-xl p-4 text-center"><Clock className="w-5 h-5 text-sky-400 mx-auto mb-1" />
              <div className="text-3xl font-mono font-bold text-white">{r.firstAt}</div><div className="text-xs text-slate-400">First bag (+{r.first} min)</div></div>
            <div className="bg-teal-500/10 border border-teal-500/20 rounded-xl p-4 text-center"><Briefcase className="w-5 h-5 text-teal-400 mx-auto mb-1" />
              <div className="text-3xl font-mono font-bold text-white">{r.lastAt}</div><div className="text-xs text-slate-400">Last bag (+{r.last} min)</div></div>
          </div>
          <div className="text-sm text-slate-300 mb-2">Confidence: <b className={r.conf === "High" ? "text-green-400" : r.conf === "Medium" ? "text-yellow-400" : "text-red-400"}>{r.conf}</b> · unload rate {r.rate.toFixed(1)} bags/min</div>
          <ul className="text-sm space-y-1">{r.parts.map(([k, v]) => (
            <li key={k} className="flex justify-between border-b border-navy-600/50 py-1 text-slate-300"><span>{k}</span><span className="font-mono">{v} min</span></li>))}</ul>
          <p className="text-[11px] text-slate-500 mt-3">Planning estimate from a transparent additive model using typical timings, not a trained model. Calibrate the airport constants with your actual baggage-system timestamps.</p>
        </div>
      </div>
    </div>
  );
}
