// Зберігає файли застосунку на телефоні, щоб щоденник працював без інтернету.
// Твої записи тут НЕ зберігаються — вони лежать у базі даних телефона (IndexedDB).
const CACHE = 'own-journal-v51';
const FILES = ['./', 'index.html', 'styles.css', 'core.js', 'i18n.js', 'fonts.css', 'scenes.js', 'scenes2.js', 'faces.js', 'messages.js', 'app.js', 'planner.js', 'art.js', 'year.js', 'pdfglyphs.js', 'pdfimport.js', 'media.js', 'manifest.webmanifest',
  'themes/cozyCat.webp', 'themes/rainyLondon.webp', 'themes/summerFair.webp', 'themes/deepSea.webp', 'themes/mushroomVillage.webp', 'themes/hornedFriend.webp', 'themes/firefly.webp', 'themes/forestFriend.webp', 'themes/hoodedOrder.webp', 'themes/summerNight.webp',
  'icon-192.png', 'icon-512.png', 'apple-touch-icon.png', 'vendor/pdf.min.js', 'vendor/pdf.worker.min.js',
  'fonts/amatic-b.woff', 'fonts/olivia-hand.woff', 'fonts/olivia-hand-bold.woff', 'fonts/amatic.woff', 'fonts/caveat.woff', 'fonts/comfortaa.woff', 'fonts/cormorant-i.woff', 'fonts/cormorant.woff', 'fonts/greatvibes.woff', 'fonts/kalnia.woff', 'fonts/kurale.woff', 'fonts/lobster.woff', 'fonts/lora-i.woff', 'fonts/lora.woff', 'fonts/marck.woff', 'fonts/neucha.woff', 'fonts/pacifico.woff', 'fonts/philosopher-b.woff', 'fonts/philosopher.woff', 'fonts/playfair-i.woff', 'fonts/playfair.woff', 'fonts/prata.woff', 'fonts/unicase.woff', 'fonts/yeseva.woff'];

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
    fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' })
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        }
        // сайт недоступний (помилка сервера, сайт видалено) — працюємо зі збереженої копії
        return caches.match(req, { ignoreSearch: true }).then((r) => r || res);
      })
      .catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match('index.html')))
  );
});
