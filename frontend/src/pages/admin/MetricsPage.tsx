import { useQuery } from "@tanstack/react-query";
import { Activity } from "lucide-react";
import { fetchMetrics, fetchTraces } from "../../api/client";

export function MetricsPage() {
  const { data: raw }    = useQuery({ queryKey:["metrics"], queryFn:fetchMetrics, refetchInterval:5000 });
  const { data: traces } = useQuery({ queryKey:["traces"],  queryFn:fetchTraces,  refetchInterval:5000 });

  const lines = (raw as string || "").split("\n").filter(l => l && !l.startsWith("#"));
  const spans = Array.isArray(traces) ? traces : [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Observability</h1>
        <p className="text-slate-400 text-sm">Prometheus metrics + distributed traces</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Metrics */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-teal-400" />
            <h2 className="font-semibold text-white">Live Metrics</h2>
          </div>
          <div className="space-y-2 font-mono text-xs">
            {lines.length === 0
              ? <p className="text-slate-500">Hit some endpoints to generate metrics...</p>
              : lines.map((l, i) => (
                <div key={i} className="flex justify-between items-center p-2 bg-navy-700/50 rounded-lg">
                  <span className="text-sky-300 truncate max-w-[70%]">
                    {l.split(" ")[0]}
                  </span>
                  <span className="text-green-400 font-semibold">
                    {l.split(" ")[1]}
                  </span>
                </div>
              ))
            }
          </div>
        </div>

        {/* Traces */}
        <div className="glass rounded-2xl p-5">
          <h2 className="font-semibold text-white mb-4">Recent Traces ({spans.length})</h2>
          <div className="space-y-2">
            {spans.length === 0
              ? <p className="text-slate-500 text-sm">No traces yet...</p>
              : spans.slice(-10).reverse().map((s: any, i: number) => (
                <div key={i} className="p-3 bg-navy-700/50 rounded-xl">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-sky-300">{s.operation}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      s.status === 200 ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                    }`}>{s.status}</span>
                  </div>
                  <div className="flex gap-4 mt-1 text-xs text-slate-500">
                    <span>{s.durationMs}ms</span>
                    <span className="font-mono truncate max-w-[200px]">{s.traceId?.substring(0,16)}...</span>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  );
}
