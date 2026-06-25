const CACHE = 'prayer-times-v6';

self.addEventListener('install', e => { self.skipWaiting(); });

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});

let timers = [];

self.addEventListener('message', e => {
  if (!e.data || e.data.type !== 'SCHEDULE_PRAYERS') return;

  timers.forEach(t => clearTimeout(t));
  timers = [];

  const now = Date.now();

  // prayer notifications
  e.data.prayers.forEach(p => {
    const delay = p.time - now;
    if (delay > 0 && delay < 86400000) {
      timers.push(setTimeout(() => {
        self.registration.showNotification(p.name + ' Prayer Time', {
          body: 'It is time for ' + p.name + ' — ' + p.arabic,
          icon: 'icon-192.png',
          badge: 'icon-192.png',
          tag: 'prayer-' + p.name,
          renotify: true,
          vibrate: [200, 100, 200],
        });
      }, delay));
    }
  });

  // daily quote notification at Fajr
  if (e.data.quote) {
    const q = e.data.quote;
    const delay = q.time - now;
    if (delay > 0 && delay < 86400000) {
      timers.push(setTimeout(() => {
        self.registration.showNotification('✨ Daily Reminder', {
          body: '“' + q.text + '” — ' + q.source,
          icon: 'icon-192.png',
          badge: 'icon-192.png',
          tag: 'daily-quote',
          renotify: true,
          vibrate: [100, 50, 100],
        });
      }, delay));
    }
  }
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow('./'));
});
