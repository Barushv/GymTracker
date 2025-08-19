const CACHE = "ht-structured-v1.4.5"; // bump para r4
const PRECACHE = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/app.js",
  "./js/ui.js",
  "./js/storage.js",
  "./data/routines.json",
  "./data/defaults_1rm.json",
  "./app.webmanifest",
];

self.addEventListener("install", (event) => {
  console.log("[SW] install");
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)));
  // No skipWaiting aquí: esperamos a que la página lo solicite
});

self.addEventListener("activate", (event) => {
  console.log("[SW] activate");
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  event.respondWith(
    caches.match(req).then(
      (cached) =>
        cached ||
        fetch(req)
          .then((resp) => {
            const copy = resp.clone();
            caches.open(CACHE).then((ca) => ca.put(req, copy));
            return resp;
          })
          .catch(() => caches.match("./index.html"))
    )
  );
});

self.addEventListener("message", (event) => {
  if (
    event.data &&
    (event.data === "SKIP_WAITING" || event.data.type === "SKIP_WAITING")
  ) {
    console.log("[SW] SKIP_WAITING recibido");
    self.skipWaiting();
  }
});
