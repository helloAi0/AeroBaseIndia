import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAppStore } from "../store/appStore";
import { fetchHealth } from "../api/client";
import { API_ENABLED } from "../config";
import { useFlightsQuery } from "./useLiveFlights";

/**
 * Polls /health and /flights and mirrors them into the app store.
 * With no VITE_API_URL it does nothing (no network calls → no console errors).
 * When the backend is down it backs off to one probe a minute instead of every 10s.
 */
export function useRealtime(intervalMs = 10000) {
  const health = useQuery({
    queryKey: ["health"],
    queryFn: fetchHealth,
    enabled: API_ENABLED,
    retry: false,
    refetchInterval: q => (q.state.status === "error" ? 60_000 : intervalMs),
    refetchIntervalInBackground: false,
  });
  const flights = useFlightsQuery();

  useEffect(() => {
    if (health.data) useAppStore.getState().setHealth(health.data);
    else if (health.isError) useAppStore.setState({ health: null });
  }, [health.data, health.isError]);

  useEffect(() => {
    if (flights.data) useAppStore.getState().setFlights(flights.data);
  }, [flights.data]);
}
