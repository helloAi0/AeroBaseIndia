import { StatusBadge } from "../../components/ui/StatusBadge";
import type { Flight } from "../../types";
import { Plane, Clock } from "lucide-react";

export function FlightsTable({ flights }: { flights: Flight[] }) {
  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between p-5 border-b border-navy-600">
        <div className="flex items-center gap-2">
          <Plane className="w-5 h-5 text-sky-400" />
          <h2 className="font-semibold text-white">Live Flights</h2>
          <span className="text-xs bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded-full ml-2">
            {flights.length} total
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          Auto-refreshing
        </div>
      </div>

      <div className="overflow-x-auto">
        {flights.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <Plane className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No flights yet — add one via POST /flights</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-400 text-xs uppercase tracking-wider border-b border-navy-600">
                {["Flight","Origin","Destination","Gate","Status","Delay Risk"].map(h => (
                  <th key={h} className="px-5 py-3 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-600">
              {flights.map((f: Flight) => (
                <tr key={f.id} className="hover:bg-navy-700/50 transition-colors group">
                  <td className="px-5 py-3.5 font-mono font-semibold text-sky-300">
                    {f.flightNumber}
                  </td>
                  <td className="px-5 py-3.5 text-slate-300">{f.origin || "—"}</td>
                  <td className="px-5 py-3.5 text-slate-300">{f.destination || "—"}</td>
                  <td className="px-5 py-3.5">
                    <span className="bg-navy-700 text-slate-200 px-2 py-1 rounded-lg text-xs font-mono">
                      {f.gate || "TBD"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={f.status} />
                  </td>
                  <td className="px-5 py-3.5">
                    {f.predictedDelay != null && f.predictedDelay > 0 ? (
                      <div className="flex items-center gap-1 text-yellow-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="text-xs">{f.predictedDelay} min</span>
                      </div>
                    ) : (
                      <span className="text-xs text-green-400">On time</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}