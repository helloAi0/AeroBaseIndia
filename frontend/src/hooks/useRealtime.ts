// Backend errors silenced when offline
import { useEffect, useRef } from "react";
import { useAppStore } from "../store/appStore";
import { fetchHealth, fetchFlights } from "../api/client";

export function useRealtime(intervalMs = 10000) {
  const setHealth  = useAppStore(s => s.setHealth);
  const setFlights = useAppStore(s => s.setFlights);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const poll = async () => {
    try {
      const [health, flights] = await Promise.all([
        fetchHealth(),
        fetchFlights(),
      ]);
      setHealth(health);
      setFlights(Array.isArray(flights) ? flights : []);
    } catch {}
  };

  useEffect(() => {
    poll();
    timer.current = setInterval(poll, intervalMs);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [intervalMs]);
}
