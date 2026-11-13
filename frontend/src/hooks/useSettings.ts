import { useEffect, useRef, useState } from "react";
import { useCollection } from "./useCollection";

/**
 * Per-airport settings persisted on the server (records collection "settings", one document per key, admin only).
 * Returns the current values, a setter, `save()` (writes to the server) and `saved`/`error` state.
 * Offline/demo mode keeps the values in memory only.
 */
export function useSettings<T extends Record<string, unknown>>(key: string, defaults: T) {
  const col = useCollection<any>("settings", []);
  const doc = col.items.find((r: any) => r.key === key);
  const [values, setValues] = useState<T>(defaults); const [saved, setSaved] = useState(false); const loaded = useRef<string>("");
  useEffect(() => { if (doc && loaded.current !== doc.id + (doc.updated_at ?? "")) { loaded.current = doc.id + (doc.updated_at ?? ""); const { id: _i, key: _k, created_at: _c, updated_at: _u, ...rest } = doc; setValues({ ...defaults, ...rest } as T); } /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [doc]);
  const save = async () => {
    const body = { key, ...values } as any;
    const ok = doc ? await col.update(doc.id, body) : await col.add(body);
    if (ok) { setSaved(true); setTimeout(() => setSaved(false), 2000); }
    return ok;
  };
  return { values, setValues, save, saved, error: col.error, live: col.live };
}
