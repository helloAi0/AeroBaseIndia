import { useCallback, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import { API_ENABLED } from "../config";
import { useAuthStore } from "../store/authStore";
import { useAirport } from "./useAirport";

export type Rec<T> = T & { id: string; created_at?: string };

/**
 * A persisted list backed by /api/records/{name} when signed in to the live backend (shared by every user
 * of the airport, role-checked on the server); a local in-memory list seeded with `seed` in demo mode.
 */
export function useCollection<T extends object>(name: string, seed: Rec<T>[] = [], opts: { skip?: boolean } = {}) {
  const tenant = useAirport().code;
  const loggedIn = useAuthStore(s => s.isLoggedIn);
  const live = !opts.skip && API_ENABLED && loggedIn && useAuthStore(s => s.source) === "backend";
  const qc = useQueryClient();
  const key = ["records", name, tenant];
  const q = useQuery({ queryKey: key, enabled: live, retry: false, refetchInterval: 20_000, refetchIntervalInBackground: false,
    queryFn: () => api.get(`/api/records/${name}`).then(r => (r.data.records ?? []) as Rec<T>[]) });
  const [local, setLocal] = useState<Rec<T>[]>(seed);
  const [err, setErr] = useState("");

  const wrap = useCallback(async (fn: () => Promise<unknown>) => {
    setErr("");
    try { await fn(); await qc.invalidateQueries({ queryKey: key }); return true; }
    catch (e: any) { setErr(e?.response?.data?.error ?? e?.message ?? "Request failed"); return false; }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qc, name, tenant]);

  const add = useMutation({ mutationFn: async (d: T) => { if (!live) { setLocal(l => [{ ...d, id: String(Date.now() + Math.random()) } as Rec<T>, ...l]); return; } await api.post(`/api/records/${name}`, d); } });
  const upd = useMutation({ mutationFn: async (a: { id: string; patch: Partial<T> }) => { if (!live) { setLocal(l => l.map(r => r.id === a.id ? { ...r, ...a.patch } : r)); return; } await api.put(`/api/records/${name}/${a.id}`, a.patch); } });
  const del = useMutation({ mutationFn: async (id: string) => { if (!live) { setLocal(l => l.filter(r => r.id !== id)); return; } await api.delete(`/api/records/${name}/${id}`); } });

  return {
    items: live ? (q.data ?? []) : local, live, loading: live && q.isLoading, error: err || (live && q.isError ? "Could not load from the server" : ""),
    add: (d: T) => wrap(() => add.mutateAsync(d)), update: (id: string, patch: Partial<T>) => wrap(() => upd.mutateAsync({ id, patch })), remove: (id: string) => wrap(() => del.mutateAsync(id)),
  };
}
