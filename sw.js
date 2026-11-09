// Зберігає файли застосунку на телефоні, щоб щоденник працював без інтернету.
// Твої записи тут НЕ зберігаються — вони лежать у базі даних телефона (IndexedDB).
const CACHE = 'own-journal-v25';
const FILES = ['./', 'index.html', 'styles.css', 'core.js', 'i18n.js', 'fonts.css', 'scenes.js', 'scenes2.js', 'faces.js', 'messages.js', 'app.js', 'planner.js', 'art.js', 'pdfglyphs.js', 'pdfimport.js', 'media.js', 'manifest.webmanifest',
  'themes/cozyCat.webp', 'themes/rainyLondon.webp', 'themes/summerFair.webp', 'themes/deepSea.webp', 'themes/mushroomVillage.webp', 'themes/hornedFriend.webp', 'themes/firefly.webp',
  'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Спершу мережа (щоб отримувати оновлення), без інтернету — збережена копія.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match('index.html')))
  );
});
