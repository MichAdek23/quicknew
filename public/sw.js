self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET' || !request.url.startsWith('http')) return;

  event.respondWith(
    fetch(request).catch(() => {
      return caches.match(request).then(response => {
        if (response) return response;
        if (request.mode === 'navigate') {
          return new Response(
            '<html style="background:#0f0f11;color:white;font-family:sans-serif;text-align:center;padding:2rem;"><head><title>Offline - Quick-Hedge</title></head><body><h1>You are offline</h1><p>Please check your internet connection to continue browsing the Quick-Hedge platform.</p></body></html>',
            { headers: { 'Content-Type': 'text/html' } }
          );
        }
        return new Response('', { status: 408, statusText: 'Request timeout' });
      });
    })
  );
});
