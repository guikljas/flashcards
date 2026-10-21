const CACHE = 'mente-em-dia-v3';
const ASSETS = ['/manifest.webmanifest', '/icon.svg'];
self.addEventListener('install', (event) => { event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS))); self.skipWaiting(); });
self.addEventListener('activate', (event) => event.waitUntil(
  caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
    .then(() => self.clients.claim())
));
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    const copy = response.clone(); caches.open(CACHE).then(cache => cache.put(event.request, copy)); return response;
  }).catch(() => caches.match('/'))));
});
self.addEventListener('push', (event) => {
  const data = event.data?.json() || { title: 'Hora de revisar', body: 'Voc� tem cart�es esperando.' };
  event.waitUntil(self.registration.showNotification(data.title, { body: data.body, icon: '/icon.svg', badge: '/icon.svg' }));
});
self.addEventListener('notificationclick', event => { event.notification.close(); event.waitUntil(clients.openWindow('/?estudar=1')); });
