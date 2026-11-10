/** Browser notifications (free; shown while the dashboard is open, even in a background tab). */
const KEY = "aerobase.notify";

export const notifySupported = () => typeof window !== "undefined" && "Notification" in window;
export const notifyPermission = (): NotificationPermission | "unsupported" =>
  notifySupported() ? Notification.permission : "unsupported";

export function notifyEnabled(): boolean {
  try { return notifyPermission() === "granted" && localStorage.getItem(KEY) !== "off"; } catch { return notifyPermission() === "granted"; }
}
export function setNotifyPref(on: boolean) { try { localStorage.setItem(KEY, on ? "on" : "off"); } catch { /* storage unavailable */ } }

export async function enableNotifications(): Promise<NotificationPermission | "unsupported"> {
  if (!notifySupported()) return "unsupported";
  const p = Notification.permission === "default" ? await Notification.requestPermission() : Notification.permission;
  setNotifyPref(p === "granted");
  return p;
}

export function notifyUser(title: string, body: string, tag?: string) {
  if (!notifyEnabled()) return;
  try { new Notification(title, { body, tag, icon: "/favicon.svg" }); } catch { /* some mobile browsers require a service worker */ }
}
