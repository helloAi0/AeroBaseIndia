const cfg: Record<string, string> = {
  Scheduled: "bg-blue-500/20 text-blue-300 border border-blue-500/30",
  Boarding:  "bg-teal-500/20 text-teal-300 border border-teal-500/30",
  Departed:  "bg-green-500/20 text-green-300 border border-green-500/30",
  Landed:    "bg-green-600/20 text-green-400 border border-green-600/30",
  Delayed:   "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30",
  Cancelled: "bg-red-500/20 text-red-300 border border-red-500/30",
  UP:        "bg-green-500/20 text-green-300",
  DOWN:      "bg-red-500/20 text-red-300",
  healthy:   "bg-green-500/20 text-green-300",
  degraded:  "bg-yellow-500/20 text-yellow-300",
  CREATED:   "bg-blue-500/20 text-blue-300",
  PAID:      "bg-green-500/20 text-green-300",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cfg[status] ?? "bg-slate-500/20 text-slate-300"}`}>
      {status}
    </span>
  );
}