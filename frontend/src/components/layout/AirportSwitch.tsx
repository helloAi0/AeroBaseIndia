import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Building2, Loader2 } from "lucide-react";
import { useAirport, useAirportList } from "../../hooks/useAirport";

export function AirportSwitch() {
  const { code, canSwitch, setAirport } = useAirport();
  const list = useAirportList();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  if (!canSwitch)
    return <span className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400"><Building2 className="w-3.5 h-3.5" />{code}</span>;
  return (
    <label className="flex items-center gap-1.5 text-xs text-slate-300" title={err || "Switch the airport you are viewing"}>
      {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-400" /> : <Building2 className={`w-3.5 h-3.5 ${err ? "text-red-400" : "text-sky-400"}`} />}
      <select aria-label="Airport" value={code} disabled={busy}
        onChange={async e => { setBusy(true); setErr(""); try { await setAirport(e.target.value); await qc.invalidateQueries(); } catch (x) { setErr(x instanceof Error ? x.message : "Could not switch"); } finally { setBusy(false); } }}
        className="bg-navy-800 border border-navy-600 rounded-lg px-2 py-1 text-white outline-none max-w-[11rem]">
        {list.map(a => <option key={a.code} value={a.code}>{a.code} — {a.name}</option>)}
      </select>
    </label>
  );
}
