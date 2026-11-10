import { useQueryClient } from "@tanstack/react-query";
import { Building2 } from "lucide-react";
import { AIRPORT_LIST, useAirport } from "../../hooks/useAirport";

export function AirportSwitch() {
  const { code, canSwitch, setAirport } = useAirport();
  const qc = useQueryClient();
  if (!canSwitch)
    return <span className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400"><Building2 className="w-3.5 h-3.5" />{code}</span>;
  return (
    <label className="flex items-center gap-1.5 text-xs text-slate-300">
      <Building2 className="w-3.5 h-3.5 text-sky-400" />
      <select aria-label="Airport" value={code}
        onChange={e => { setAirport(e.target.value); qc.invalidateQueries(); }}
        className="bg-navy-800 border border-navy-600 rounded-lg px-2 py-1 text-white outline-none">
        {AIRPORT_LIST.map(a => <option key={a.code} value={a.code}>{a.code} — {a.name}</option>)}
      </select>
    </label>
  );
}
