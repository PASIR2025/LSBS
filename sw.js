const CACHE_NAME = "pasir-pwa-v1";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./login.html",
  "./register.html",
  "./account.html",
  "./course.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-192-maskable.png",
  "./icons/icon-512-maskable.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) =>
        Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : Promise.resolve())))
      ),
      self.clients.claim(),
    ])
  );
});

// Cache strategy:
// - HTML navigations: network-first (fresh UI), fallback to cache if offline
// - Other same-origin GET: cache-first, then network update
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  if (req.method !== "GET") return;

  // Only handle same-origin
  if (url.origin !== self.location.origin) return;

  const isHtml = req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html");

  if (isHtml) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((c) => c || caches.match("./index.html")))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => cached);

      return cached || fetchPromise;
    })
  );
});
