import type { ReactNode } from "react";

interface Props {
  label:   string;
  value:   string | number;
  icon:    ReactNode;
  change?: number;
  color?:  "blue" | "teal" | "green" | "yellow" | "red";
  sub?:    string;
}

const colorMap = {
  blue:   "from-blue-500/20 to-blue-600/5 border-blue-500/20",
  teal:   "from-teal-500/20 to-teal-600/5 border-teal-500/20",
  green:  "from-green-500/20 to-green-600/5 border-green-500/20",
  yellow: "from-yellow-500/20 to-yellow-600/5 border-yellow-500/20",
  red:    "from-red-500/20 to-red-600/5 border-red-500/20",
};

const iconMap = {
  blue:   "text-blue-400",
  teal:   "text-teal-400",
  green:  "text-green-400",
  yellow: "text-yellow-400",
  red:    "text-red-400",
};

export function KpiCard({ label, value, icon, change, color = "blue", sub }: Props) {
  return (
    <div className={`glass rounded-2xl p-5 bg-gradient-to-br ${colorMap[color]} border glow-blue`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-xl bg-navy-700 ${iconMap[color]}`}>
          {icon}
        </div>
        {change !== undefined && (
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            change >= 0 ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
          }`}>
            {change >= 0 ? "▲" : "▼"} {Math.abs(change)}%
          </span>
        )}
      </div>
      <div className="metric-value text-3xl font-bold text-white mb-1">
        {value}
      </div>
      <div className="text-sm text-slate-400">{label}</div>
      {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
    </div>
  );
}