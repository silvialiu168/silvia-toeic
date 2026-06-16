const CACHE_NAME = "family-english-trainer-v34-mobile-fast";
const APP_FILES = [
  "./",
  "./index.html",
  "./style.css?v=34",
  "./app.js?v=34",
  "./manifest.webmanifest",
  "./icon.svg",
  "./icon-192.png",
  "./icon-512.png",
  "./data/users.json",
  "./data/knowledge_common.json",
  "./data/knowledge_toeic.json",
  "./data/knowledge_gsat.json",
  "./data/knowledge_junior.json",
  "./data/knowledge_junior_past.json",
  "./data/questions_toeic.json",
  "./data/questions_gsat.json",
  "./data/questions_junior.json",
  "./data/vocab_toeic.json",
  "./data/knowledge_tree.json",
  "./data/reading_toeic.json",
  "./data/reading_gsat.json",
  "./data/reading_junior.json"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_FILES)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
  ));
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request)
      .then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request).then(cached => cached || caches.match("./index.html")))
  );
});
