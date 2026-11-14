/** Weather → playbook rules. Thresholds are shown on the page so staff can see why a playbook is suggested. */
export interface Wx {
  temp: number; feels: number; humidity: number; precip: number; code: number; wind: number; gust: number; visibilityM: number;
  hours: { t: string; temp: number; pop: number; code: number; gust: number; visM: number }[];
}
export type PlaybookId = "fog" | "storm" | "rain" | "heat" | "wind" | "cold";

export const RULES: Record<PlaybookId, string> = {
  fog: "Visibility under 800 m, or fog reported",
  storm: "Thunderstorm reported, or gusts of 60 km/h or more",
  rain: "Rain of 2.5 mm/h or more, or heavy-rain showers",
  heat: "Feels-like 42 °C or higher",
  wind: "Gusts of 45 km/h or more",
  cold: "Temperature 2 °C or lower, or snow reported",
};

export const describeCode = (c: number): string =>
  c === 0 ? "Clear sky" : c <= 2 ? "Partly cloudy" : c === 3 ? "Overcast" : c === 45 || c === 48 ? "Fog" : c >= 51 && c <= 57 ? "Drizzle" : c >= 61 && c <= 67 ? "Rain" :
  c >= 71 && c <= 77 ? "Snow" : c >= 80 && c <= 82 ? "Rain showers" : c === 85 || c === 86 ? "Snow showers" : c >= 95 ? "Thunderstorm" : "Cloudy";

/** Which playbooks the given conditions call for, most urgent first. */
export function triggered(c: Pick<Wx, "temp" | "feels" | "precip" | "code" | "gust" | "visibilityM">): PlaybookId[] {
  const out: PlaybookId[] = [];
  if (c.code >= 95 || c.gust >= 60) out.push("storm");
  if (c.code === 45 || c.code === 48 || (c.visibilityM > 0 && c.visibilityM < 800)) out.push("fog");
  if (c.precip >= 2.5 || [65, 67, 81, 82].includes(c.code)) out.push("rain");
  if (c.gust >= 45 && !out.includes("storm")) out.push("wind");
  if (c.feels >= 42) out.push("heat");
  if (c.temp <= 2 || (c.code >= 71 && c.code <= 77) || c.code === 85 || c.code === 86) out.push("cold");
  return out;
}

/** Playbooks expected in the next hours (for the "coming up" strip). */
export function upcoming(w: Wx): { t: string; id: PlaybookId }[] {
  const seen = new Set<PlaybookId>(); const out: { t: string; id: PlaybookId }[] = [];
  for (const h of w.hours.slice(1, 9)) for (const id of triggered({ temp: h.temp, feels: h.temp, precip: h.pop >= 70 && h.code >= 61 ? 2.5 : 0, code: h.code, gust: h.gust, visibilityM: h.visM })) if (!seen.has(id)) { seen.add(id); out.push({ t: h.t, id }); }
  return out;
}

export function parseWx(j: any): Wx {
  const c = j.current ?? {}, h = j.hourly ?? {};
  const hours = (h.time ?? []).slice(0, 13).map((t: string, i: number) => ({ t, temp: Math.round(h.temperature_2m?.[i] ?? 0), pop: h.precipitation_probability?.[i] ?? 0, code: h.weather_code?.[i] ?? 0, gust: Math.round(h.wind_gusts_10m?.[i] ?? 0), visM: Math.round(h.visibility?.[i] ?? 10000) }));
  return { temp: Math.round(c.temperature_2m ?? 0), feels: Math.round(c.apparent_temperature ?? c.temperature_2m ?? 0), humidity: Math.round(c.relative_humidity_2m ?? 0), precip: c.precipitation ?? 0, code: c.weather_code ?? 0, wind: Math.round(c.wind_speed_10m ?? 0), gust: Math.round(c.wind_gusts_10m ?? 0), visibilityM: Math.round(c.visibility ?? 10000), hours };
}
