const CACHE = 'prayer-times-v3';
const ASSETS = ['/', '/index.html', '/adhan.min.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.url.includes('index.html') || e.request.url.endsWith('/')) {
    e.respondWith(
      fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});

const ICONS = { Fajr:'🌄', Dhuhr:'☀️', Asr:'🌅', Maghrib:'🌆', Isha:'🌙' };
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
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            tag: 'prayer-' + p.name,
            renotify: true,
            vibrate: [200, 100, 200],
            data: { prayer: p.name }
          });
        }, delay);
        scheduledTimers.push(t);
      }
    });
  }
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow('/'));
});
