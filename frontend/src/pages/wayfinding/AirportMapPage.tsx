import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { api } from "../../api/client";
import { API_ENABLED } from "../../config";
import { useAuthStore } from "../../store/authStore";
import { useBoard } from "../../hooks/useBoard";
import { useAirport } from "../../hooks/useAirport";
import { AIRPORT_COORDS } from "../../hooks/useWeather";
import { Card, PageHead, Stat } from "../../components/ui/PageHead";

const DelhiFloorPlans = lazy(() => import("./AirportMap").then(m => ({ default: m.AirportMap })));
type Facts = { name?: string; icao?: string; elevation_ft?: number; runways?: number; longest_runway_m?: number };

/** Real map of the airport (OpenStreetMap), real airport facts (OurAirports), and a gate board built from the live flights. */
export function AirportMapPage() {
  const ap = useAirport(); const { flights, live } = useBoard(); const backend = API_ENABLED && useAuthStore(s => s.source) === "backend";
  const [facts, setFacts] = useState<Facts>({}); const [q, setQ] = useState(""); const [terminal, setTerminal] = useState("ALL");
  useEffect(() => { if (!backend) return; api.get("/api/reference/airports").then(r => setFacts((r.data.airports ?? []).find((a: any) => a.iata === ap.code) ?? {})).catch(() => {}); }, [backend, ap.code]);
  const [la, lo] = AIRPORT_COORDS[ap.code] ?? AIRPORT_COORDS.DEL; const d = 0.03;
  const osm = `https://www.openstreetmap.org/export/embed.html?bbox=${lo - d * 1.6},${la - d},${lo + d * 1.6},${la + d}&layer=mapnik&marker=${la},${lo}`;

  const upcoming = useMemo(() => (flights as any[]).filter(f => f.gate && f.status !== "Departed" && f.status !== "Cancelled").sort((a, b) => String(a.dep).localeCompare(String(b.dep))), [flights]);
  const terminals = useMemo(() => ["ALL", ...Array.from(new Set(upcoming.map(f => f.terminal).filter(Boolean))).sort()], [upcoming]);
  const shown = upcoming.filter(f => (terminal === "ALL" || f.terminal === terminal) && (!q.trim() || `${f.flight} ${f.to} ${f.gate}`.toLowerCase().includes(q.trim().toLowerCase())));
  const piers = useMemo(() => { const m = new Map<string, any[]>(); for (const f of shown) { const k = `${f.terminal} · Pier ${String(f.gate)[0]}`; (m.get(k) ?? m.set(k, []).get(k)!).push(f); } return [...m].sort(([a], [b]) => a.localeCompare(b)); }, [shown]);

  return (
    <div className="space-y-6">
      <PageHead title="Airport Map" sub={`${ap.name} (${ap.code}) · real map, live gates${live ? "" : " (demo board)"}`} />
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4"><Stat label="ICAO" value={facts.icao ?? "–"} /><Stat label="Runways" value={facts.runways ?? "–"} /><Stat label="Longest runway" value={facts.longest_runway_m ? `${facts.longest_runway_m.toLocaleString("en-IN")} m` : "–"} /><Stat label="Elevation" value={facts.elevation_ft != null ? `${facts.elevation_ft} ft` : "–"} /></div>
      <Card className="p-0 overflow-hidden"><iframe title={`${ap.name} map`} src={osm} className="w-full h-[360px] border-0" loading="lazy" referrerPolicy="no-referrer" />
        <div className="px-4 py-2 text-[11px] text-slate-500">Map © OpenStreetMap contributors · airport facts from OurAirports</div></Card>
      <Card>
        <div className="flex flex-wrap items-center gap-2 mb-3"><div className="text-sm font-semibold text-white mr-2">Live gate board</div>
          {terminals.map(t => <button key={t} onClick={() => setTerminal(t)} className={`px-3 py-1.5 rounded-lg text-xs border ${terminal === t ? "bg-sky-500 text-white border-sky-500" : "bg-navy-900 text-slate-300 border-navy-600"}`}>{t === "ALL" ? "All terminals" : t}</button>)}
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Flight, city or gate" aria-label="Search gates" className="ml-auto bg-navy-900 border border-navy-600 rounded-lg px-3 py-1.5 text-xs text-white" /></div>
        {piers.length === 0 ? <div className="text-xs text-slate-500">No matching departures.</div> :
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">{piers.map(([k, fs]) => <div key={k}><div className="text-xs font-semibold text-sky-300 mb-1">{k}</div>
            <div className="flex flex-wrap gap-2">{fs.slice(0, 24).map(f => <div key={f.id} className={`text-[11px] rounded-lg border px-2 py-1.5 ${f.status === "Boarding" ? "border-green-500/50 bg-green-500/10" : f.status === "Delayed" ? "border-yellow-500/50 bg-yellow-500/10" : "border-navy-600 bg-navy-900"}`}><div className="font-mono text-white">{f.gate} · {f.flight}</div><div className="text-slate-400">{f.dep} → {f.to}</div></div>)}</div></div>)}</div>}
      </Card>
      {ap.code === "DEL" && <Suspense fallback={null}><div className="text-sm font-semibold text-white">Delhi terminal floor plans &amp; directions</div><DelhiFloorPlans /></Suspense>}
    </div>
  );
}
