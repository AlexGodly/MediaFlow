/* MediaFlow v201 service worker.
   Intentionally does not intercept requests; this preserves the original network behavior
   while allowing the existing service-worker registration to succeed when hosted. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
