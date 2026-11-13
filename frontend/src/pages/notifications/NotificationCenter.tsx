import { useQuery } from "@tanstack/react-query";
import { AlertsPage } from "../admin/AlertsPage";
import { fetchEmailQueue } from "../../api/client";
import { API_ENABLED } from "../../config";
import { useAuthStore } from "../../store/authStore";
import { Card } from "../../components/ui/PageHead";

/** Notification centre: live alerts derived from real flight/incident/maintenance/system data, plus the real outgoing email queue. */
export function NotificationCenter() {
  const live = API_ENABLED && useAuthStore(s => s.source) === "backend";
  const { data } = useQuery({ queryKey: ["emailQueue"], queryFn: fetchEmailQueue, enabled: live, refetchInterval: 15000 });
  const q: any[] = data?.queue ?? data?.emails ?? [];
  return (
    <div className="space-y-6">
      <AlertsPage />
      {live && <Card><div className="text-sm font-semibold text-white mb-2">Outgoing email queue ({q.length})</div>
        {q.length === 0 ? <div className="text-xs text-slate-500">Nothing waiting to be sent.</div> :
          <ul className="space-y-1 text-xs text-slate-300">{q.slice(0, 20).map((e, i) => <li key={e.id ?? i}>{e.to ?? e.recipient} — {e.subject} <span className="text-slate-500">({e.status ?? "queued"})</span></li>)}</ul>}</Card>}
    </div>
  );
}
