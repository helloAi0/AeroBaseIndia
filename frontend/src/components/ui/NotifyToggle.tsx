import { useState } from "react";
import { BellRing, BellOff } from "lucide-react";
import { enableNotifications, notifyEnabled, notifyPermission, setNotifyPref, notifyUser } from "../../lib/notify";

export function NotifyToggle() {
  const [, force] = useState(0);
  const perm = notifyPermission();
  const on = notifyEnabled();

  if (perm === "unsupported")
    return <span className="text-xs text-slate-500">Browser notifications aren’t supported here</span>;
  if (perm === "denied")
    return <span className="text-xs text-yellow-400">Notifications are blocked — allow them in your browser’s site settings</span>;

  const click = async () => {
    if (on) setNotifyPref(false);
    else if (await enableNotifications() === "granted") notifyUser("Alerts enabled", "You’ll be notified about delays, cancellations and gate changes.");
    force(n => n + 1);
  };
  return (
    <button onClick={click}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm border ${on ? "bg-green-500/15 text-green-400 border-green-500/20" : "bg-navy-800 text-slate-300 border-navy-600 hover:text-white"}`}>
      {on ? <BellRing className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
      {on ? "Flight alerts on" : "Enable flight alerts"}
    </button>
  );
}
