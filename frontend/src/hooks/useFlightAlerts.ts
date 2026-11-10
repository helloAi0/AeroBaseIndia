import { useEffect, useRef } from "react";
import { useFlightsQuery } from "./useLiveFlights";
import { notifyUser } from "../lib/notify";

/** Fires a browser notification when a live flight becomes Delayed/Cancelled/Boarding or changes gate. */
export function useFlightAlerts() {
  const { data } = useFlightsQuery();
  const prev = useRef<Map<string, { status: string; gate: string }> | null>(null);

  useEffect(() => {
    if (!data) return;
    const next = new Map(data.map(f => [f.id, { status: f.status, gate: f.gate }]));
    if (prev.current) {                       // skip the first load so we don't alert on existing state
      for (const f of data) {
        const old = prev.current.get(f.id);
        if (!old) continue;
        if (old.status !== f.status && ["Delayed", "Cancelled", "Boarding"].includes(f.status))
          notifyUser(`Flight ${f.flightNumber} ${f.status.toLowerCase()}`, `${f.origin} → ${f.destination} · Gate ${f.gate}`, `st-${f.id}`);
        else if (old.gate !== f.gate && f.gate !== "—")
          notifyUser(`Gate change: ${f.flightNumber}`, `Now at Gate ${f.gate} (was ${old.gate})`, `gt-${f.id}`);
      }
    }
    prev.current = next;
  }, [data]);
}
