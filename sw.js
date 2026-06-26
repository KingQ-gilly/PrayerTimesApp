const CACHE = 'prayer-times-v10';

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

// ── Real push event from the Cloudflare Worker server ──────────────────────
self.addEventListener('push', e => {
  let data = {};
  try { data = e.data?.json() || {}; } catch { data = { title: 'Prayer Time 🕌', body: e.data?.text() || '' }; }

  e.waitUntil(
    self.registration.showNotification(data.title || 'Prayer Time 🕌', {
      body:     data.body || '',
      icon:     './icon-192.png',
      badge:    './icon-192.png',
      tag:      data.tag  || 'prayer',
      renotify: true,
      vibrate:  data.vibrate || [200, 100, 200],
      data:     { url: './' },
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(wins => {
      const open = wins.find(w => w.url.includes('PrayerTimesApp') || w.url.includes('localhost'));
      return open ? open.focus() : clients.openWindow('./');
    })
  );
});
