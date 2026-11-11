import { useEffect, useState } from "react";
import { CloudFog, CloudLightning, Sun, CloudRain, Check } from "lucide-react";
import { useAirport } from "../../hooks/useAirport";
import { notifyUser } from "../../lib/notify";
import { speak, voiceSupported } from "../../lib/voice";
import { Card, PageHead } from "../../components/ui/PageHead";

const BOOK = [
  { id: "fog", label: "Dense fog", icon: CloudFog, say: "Due to low visibility, some departures may be delayed. Please check your flight status and stay near your gate.",
    steps: ["Switch to low-visibility procedures (CAT III)", "Reduce runway movement rate; brief ATC", "Alert airlines to expect 30-90 min delays", "Open extra rebooking desks", "Publish delay announcement"] },
  { id: "storm", label: "Thunderstorm", icon: CloudLightning, say: "A thunderstorm is affecting the airport. Ground operations are paused for safety. Please remain inside the terminal.",
    steps: ["Stop ramp work (lightning within 8 km)", "Hold boarding at remote stands", "Move passengers away from airside windows", "Pre-position water and seating at crowded gates", "Publish hold announcement"] },
  { id: "heat", label: "Heatwave", icon: Sun, say: "High temperatures are expected today. Please stay hydrated. Free drinking water is available at all gates.",
    steps: ["Add water points at gates and kerbside", "Check terminal cooling and queue shading", "Increase ramp crew rest breaks", "Watch aircraft performance limits for departures", "Publish advisory"] },
  { id: "rain", label: "Heavy rain", icon: CloudRain, say: "Heavy rain is expected. Allow extra time to reach the terminal. Some flights may be delayed.",
    steps: ["Slow baggage loading, cover trolleys", "Check runway drainage and braking action reports", "Add kerbside umbrellas and marshals", "Warn airlines of baggage delays", "Publish advisory"] },
];
const COORDS: Record<string, [number, number]> = { DEL: [28.5562, 77.1], BOM: [19.0896, 72.8656], BLR: [13.1986, 77.7066] };
const fromWmo = (c: number) => (c === 45 || c === 48) ? "fog" : c >= 95 ? "storm" : (c >= 51 && c <= 67) || (c >= 80 && c <= 82) ? "rain" : null;

export function Playbooks() {
  const { code, name } = useAirport();
  const [sel, setSel] = useState(BOOK[0]);
  const [det, setDet] = useState<string>("Checking live weather…");
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [ran, setRan] = useState<string | null>(null);

  useEffect(() => {
    const [la, lo] = COORDS[code] ?? COORDS.DEL; const ac = new AbortController(); const t = setTimeout(() => ac.abort(), 6000);
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${la}&longitude=${lo}&current=temperature_2m,weather_code`, { signal: ac.signal })
      .then(r => r.json()).then(j => {
        const m = fromWmo(j.current.weather_code) ?? (j.current.temperature_2m >= 42 ? "heat" : null);
        const hit = BOOK.find(b => b.id === m);
        if (hit) { setSel(hit); setDet(`Live weather suggests: ${hit.label} (${j.current.temperature_2m}°C)`); } else setDet(`Live weather normal (${j.current.temperature_2m}°C). Pick a playbook manually.`);
      }).catch(() => setDet("Live weather unavailable. Pick a playbook manually.")).finally(() => clearTimeout(t));
    return () => { ac.abort(); clearTimeout(t); };
  }, [code]);

  const run = () => { setRan(sel.id); notifyUser(`${sel.label} playbook started`, `${name}: ${sel.steps.length} steps assigned`, "playbook"); if (voiceSupported()) void speak(sel.say); };
  return (
    <div className="space-y-6">
      <PageHead title="Weather Playbooks" sub="A ready response plan for each weather event. Review, tick off steps, then publish the announcement." />
      <div className="text-sm text-sky-300">{det}</div>
      <div className="flex flex-wrap gap-2">{BOOK.map(b => { const I = b.icon; return <button key={b.id} onClick={() => { setSel(b); setRan(null); }} className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm ${sel.id === b.id ? "bg-sky-500 text-white border-sky-500" : "bg-navy-800 text-slate-300 border-navy-600"}`}><I className="w-4 h-4" />{b.label}</button>; })}</div>
      <Card><div className="text-white font-semibold mb-3">{sel.label} plan for {name}</div>
        <ul className="space-y-2">{sel.steps.map((s, i) => { const k = sel.id + i; return <li key={k}><label className="flex items-start gap-3 text-sm text-slate-200"><input type="checkbox" className="mt-1" checked={!!done[k]} onChange={e => setDone(d => ({ ...d, [k]: e.target.checked }))} /><span className={done[k] ? "line-through text-slate-500" : ""}>{s}</span></label></li>; })}</ul>
        <div className="mt-4 p-3 bg-navy-900 rounded-xl border border-navy-600 text-sm text-slate-300 italic">“{sel.say}”</div>
        <button onClick={run} className="mt-4 px-4 py-2 rounded-xl bg-sky-500 text-white text-sm font-semibold">Approve and announce</button>
        {ran === sel.id && <div className="mt-3 text-xs text-green-400 flex items-center gap-1"><Check className="w-3 h-3" /> Playbook started, announcement played{voiceSupported() ? "" : " (no voice on this device)"}.</div>}</Card>
    </div>
  );
}
