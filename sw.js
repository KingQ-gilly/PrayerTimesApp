const CACHE = 'prayer-times-v4';

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});

let scheduledTimers = [];

self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SCHEDULE_PRAYERS') {
    scheduledTimers.forEach(t => clearTimeout(t));
    scheduledTimers = [];
    const now = Date.now();
    e.data.prayers.forEach(p => {
      const delay = p.time - now;
      if (delay > 0 && delay < 86400000) {
        const t = setTimeout(() => {
          self.registration.showNotification(p.name + ' Prayer Time', {
            body: 'It is time for ' + p.name + ' (' + p.arabic + ')',
            icon: 'icon-192.png',
            tag: 'prayer-' + p.name,
            renotify: true,
            vibrate: [200, 100, 200],
          });
        }, delay);
        scheduledTimers.push(t);
      }
    });
  }
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow('./'));
});
