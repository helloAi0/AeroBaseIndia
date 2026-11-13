import { useEffect, useState } from "react";
import { useAirport } from "./useAirport";

export const AIRPORT_COORDS: Record<string, [number, number]> = { DEL: [28.5562, 77.1], BOM: [19.0896, 72.8656], BLR: [13.1979, 77.7063] };
export type Weather = { temp: number; wind: number; visibility: number; humidity: number } | null;

/** Current conditions at the airport from Open-Meteo (free, no key). null while loading or if unreachable. */
export function useWeather(): Weather {
  const code = useAirport().code; const [wx, setWx] = useState<Weather>(null);
  useEffect(() => {
    const [la, lo] = AIRPORT_COORDS[code] ?? AIRPORT_COORDS.DEL; const ac = new AbortController(); const t = setTimeout(() => ac.abort(), 6000); let alive = true;
    const load = () => fetch(`https://api.open-meteo.com/v1/forecast?latitude=${la}&longitude=${lo}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,visibility`, { signal: ac.signal }).then(r => r.json())
      .then(j => { if (alive && j.current) setWx({ temp: Math.round(j.current.temperature_2m), wind: Math.round(j.current.wind_speed_10m), visibility: Math.round((j.current.visibility ?? 0) / 100) / 10, humidity: Math.round(j.current.relative_humidity_2m) }); }).catch(() => { if (alive) setWx(null); }).finally(() => clearTimeout(t));
    void load(); return () => { alive = false; ac.abort(); clearTimeout(t); };
  }, [code]);
  return wx;
}
