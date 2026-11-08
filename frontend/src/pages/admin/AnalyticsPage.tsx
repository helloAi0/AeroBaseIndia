import { BarChart3 } from "lucide-react";
export function AnalyticsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Revenue Analytics</h1>
        <p className="text-slate-400 text-sm">Phase 43 — In development</p>
      </div>
      <div className="glass rounded-2xl p-12 text-center">
        <BarChart3 className="w-16 h-16 mx-auto mb-4 text-sky-400 opacity-50" />
        <h2 className="text-xl font-semibold text-white mb-2">Revenue Analytics</h2>
        <p className="text-slate-400 max-w-md mx-auto">
          This module is being built in Phase 43.
          Core backend APIs are fully operational.
        </p>
        <div className="mt-6 flex flex-wrap gap-3 justify-center">
          {["API Ready","Backend Live","Data Available"].map(t => (
            <span key={t} className="text-xs bg-green-500/20 text-green-400 px-3 py-1 rounded-full border border-green-500/20">
              ✓ {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
