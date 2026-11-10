/* AeroBase service worker: caches the app shell so the dashboard opens offline.
   API calls are never cached (stale flight data would be dangerous); only same-origin GETs for the app itself. */
const CACHE = "aerobase-shell-v1";
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(["/", "/favicon.svg"]).catch(() => {}))); self.skipWaiting(); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== "GET" || u.origin !== location.origin) return;
  if (r.mode === "navigate") {                       // network first, fall back to cached shell
    e.respondWith(fetch(r).then(res => { const c = res.clone(); caches.open(CACHE).then(x => x.put("/", c)); return res; }).catch(() => caches.match("/")));
    return;
  }
  if (u.pathname.startsWith("/assets/") || u.pathname === "/favicon.svg") {   // hashed build assets: cache first
    e.respondWith(caches.match(r).then(hit => hit || fetch(r).then(res => { const c = res.clone(); caches.open(CACHE).then(x => x.put(r, c)); return res; })));
  }
});
