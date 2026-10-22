const CACHE = 'movetrack-v1.2.0-release';
const ASSETS = [
  '/', '/producao', '/logistica', '/admin', '/producao.html', '/logistica.html', '/admin.html', '/style.css', '/app.js', '/movetrack.css', '/movetrack.js', '/movetrack-mark.svg', '/movetrack-logo.svg', '/movetrack-logo-light.svg',
  '/vendor/jsQR.js', '/vendor/fontawesome-free-icons.js', '/melodia-logo.png', '/manifest.webmanifest', '/manifest-producao.webmanifest', '/manifest-logistica.webmanifest', '/manifest-admin.webmanifest',
  '/icons/icon-192.png', '/icons/icon-512.png', '/dock-animation.js', '/assets/dock-background.webp', '/assets/dock-foreground-v2.webp', '/assets/dock-truck-movetrack-v2.webp', '/assets/dock-pallet-v2.webp', '/assets/loader-pallet.webp', '/assets/loader-box.webp'
];

self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;
  event.respondWith(fetch(event.request).then(response => {
    const copy = response.clone();
    caches.open(CACHE).then(cache => cache.put(event.request, copy));
    return response;
  }).catch(() => caches.match(event.request).then(cached => cached || caches.match('/producao'))));
});
