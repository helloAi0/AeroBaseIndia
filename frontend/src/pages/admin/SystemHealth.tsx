import { Database, Server, Cpu, Wifi } from "lucide-react";
import { StatusBadge } from "../../components/ui/StatusBadge";
import type { HealthStatus } from "../../types";

export function SystemHealth({ health }: { health: HealthStatus | null | undefined }) {
  const services = [
    { label:"Database",  key:"database",  icon:<Database className="w-4 h-4" /> },
    { label:"Redis",     key:"redis",     icon:<Server   className="w-4 h-4" /> },
    { label:"AI Engine", key:"ai_engine", icon:<Cpu      className="w-4 h-4" /> },
    { label:"API",       key:"status",    icon:<Wifi     className="w-4 h-4" /> },
  ];

  return (
    <div className="glass rounded-2xl p-5">
      <h2 className="font-semibold text-white mb-4">System Health</h2>
      <div className="space-y-3">
        {services.map(({ label, key, icon }) => {
          const val = health ? (health as any)[key] : null;
          const ok  = val === "UP" || val === "healthy";
          return (
            <div key={key} className="flex items-center justify-between p-3 rounded-xl bg-navy-700/50">
              <div className="flex items-center gap-2 text-slate-300">
                <span className={ok ? "text-green-400" : "text-red-400"}>{icon}</span>
                <span className="text-sm">{label}</span>
              </div>
              {val
                ? <StatusBadge status={val} />
                : <span className="text-xs text-slate-600">Connecting...</span>
              }
            </div>
          );
        })}
      </div>

      {/* Uptime */}
      <div className="mt-4 pt-4 border-t border-navy-600">
        <div className="flex justify-between text-xs text-slate-400 mb-2">
          <span>Uptime</span><span>99.9%</span>
        </div>
        <div className="h-1.5 bg-navy-700 rounded-full overflow-hidden">
          <div className="h-full w-[99.9%] bg-gradient-to-r from-teal-500 to-sky-500 rounded-full" />
        </div>
      </div>
    </div>
  );
}