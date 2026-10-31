const C = 'biblia-v7';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'votd.json', 'img/header.jpg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-180.png'];
self.addEventListener('install', e => e.waitUntil(caches.open(C).then(c => c.addAll(FILES)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== C).map(x => caches.delete(x)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then(r => { const cp = r.clone(); caches.open(C).then(c => c.put(e.request, cp)); return r; }).catch(() => caches.match(e.request)));
});
// Daily "Neno la Leo" notification in the background (supported by installed apps in Chrome/Edge on Android and desktop)
async function showVotd() {
  const r = await (await caches.match('votd.json') || await fetch('votd.json')).json();
  const d = new Date(), n = Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5), it = r[n % r.length];
  return self.registration.showNotification('Neno la Leo', { body: it.text + '\n— ' + it.ref, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', tag: 'votd-' + d.toISOString().slice(0, 10), data: { hash: it.hash } });
}
self.addEventListener('periodicsync', e => { if (e.tag === 'votd') e.waitUntil(showVotd()); });
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = new URL('./' + ((e.notification.data && e.notification.data.hash) || ''), self.registration.scope).href;
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(ws => {
    for (const w of ws) { if ('focus' in w) { w.navigate(url); return w.focus(); } }
    return clients.openWindow(url);
  }));
});
