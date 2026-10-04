const CACHE_NAME = 'mediaflow-v229-static-v1';
const STATIC_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./assets/js/mediaflow-v229.bundle.js",
  "./assets/css/00-foundation.css",
  "./assets/css/10-navigation-core-ui.css",
  "./assets/css/20-dashboard-personal-order.css",
  "./assets/css/30-categories-themes-navigation.css",
  "./assets/css/40-system-import-tools.css",
  "./assets/css/50-library-dashboard.css",
  "./assets/css/60-statistics.css",
  "./assets/css/70-full-style-themes.css",
  "./assets/css/80-late-control-center.css",
  "./assets/css/92-v221-settings-polish.css",
  "./assets/css/93-v222-dashboard-rendering-stability.css",
  "./assets/css/94-v224-library-sorting-actions.css",
  "./assets/css/95-v225-icons-personal-order.css",
  "./assets/css/96-v226-semantic-ui-library.css",
  "./assets/css/97-v227-ui-icon-corrections.css",
  "./assets/css/98-v228-library-priority-dynamic-row.css",
  "./assets/css/99-v229-library-choice-modals.css"
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('mediaflow-') && k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    if (response && response.ok) {
      const copy=response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
    }
    return response;
  })));
});
