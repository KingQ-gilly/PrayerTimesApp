const CACHE = 'prayer-times-v19';
const PRECACHE = [
  './',
  './index.html',
  './anime.min.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

// Precache all static assets on install for instant offline + repeat loads
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Cache-first with background network refresh (stale-while-revalidate)
// → repeat visits are instant; cache stays fresh in the background
self.addEventListener('fetch', e => {
  // Only handle GET requests for same-origin/precached assets
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // Pass through push-server API calls
  if (url.hostname.includes('workers.dev')) return;

  e.respondWith(
    caches.open(CACHE).then(async cache => {
      const cached = await cache.match(e.request);
      const networkFetch = fetch(e.request).then(res => {
        if (res.ok) cache.put(e.request, res.clone());
        return res;
      }).catch(() => null);

      // Serve cache immediately; refresh in background
      return cached || networkFetch;
    })
  );
});

// ── Push notifications from Cloudflare Worker ──────────────────────────────
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
