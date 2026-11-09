'use strict';
/* ==========================================================================
   own journal — ядро: утиліти, дати, база даних, емоції, теми, фото, копії
   Усі дані зберігаються ЛИШЕ на телефоні (IndexedDB). Нічого не надсилається.
   ========================================================================== */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
const fold = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ё/g, 'e');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function toast(msg, ms = 2400) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove('show'), ms);
}

/* ---------- Іконки (SVG) ---------- */
const ICONS = {
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="3"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  chart: '<path d="M3 3v18h18"/><path d="m7 15 4-5 3 3 5-6"/>',
  back: '<path d="m15 18-6-6 6-6"/>',
  right: '<path d="m9 18 6-6-6-6"/>',
  left: '<path d="m15 18-6-6 6-6"/>',
  star: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>',
  starFill: '<path fill="currentColor" d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>',
  quote: '<path d="M7 7h4v4c0 3-2 5-4 5M15 7h4v4c0 3-2 5-4 5"/>',
  list: '<path d="M9 6h12M9 12h12M9 18h12"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>',
  listNum: '<path d="M10 6h11M10 12h11M10 18h11M4 4v4M3 18h3l-3 3h3M3 12c0-1 1-1.5 1.5-1.5S6 11 6 12s-3 2-3 3h3"/>',
  palette: '<circle cx="13.5" cy="6.5" r="1"/><circle cx="17.5" cy="10.5" r="1"/><circle cx="8.5" cy="7.5" r="1"/><circle cx="6.5" cy="12.5" r="1"/><path d="M12 2a10 10 0 0 0 0 20c1 0 1.7-.8 1.7-1.7 0-.5-.2-.9-.5-1.2-.3-.3-.4-.7-.4-1.2 0-.9.8-1.7 1.7-1.7h2A5.5 5.5 0 0 0 22 10.7C22 5.9 17.5 2 12 2z"/>',
  sparkle: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
  smile: '<circle cx="12" cy="12" r="9"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/><circle cx="12" cy="13" r="3"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
  keyboard: '<rect x="2" y="5" width="20" height="12" rx="2"/><path d="M6 9h.01M10 9h.01M14 9h.01M18 9h.01M7 13h10M10 21l2-2 2 2"/>',
  textSize: '<path d="M4 7V5h10v2M9 5v14M7 19h4M14 12v-1h6v1M17 11v8M15.5 19h3"/>',
  archive: '<rect x="3" y="4" width="18" height="5" rx="1"/><path d="M5 9v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9M10 13h4"/>',
  photos: '<rect x="3" y="3" width="14" height="14" rx="2"/><path d="M21 7v12a2 2 0 0 1-2 2H7"/><path d="m3 13 4-4 6 6"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>',
  brush: '<path d="M18.4 2.6a2 2 0 0 1 3 3L12 15l-3-3z"/><path d="M9 12c-2 0-4 1.5-4 4 0 1.5-1 2.5-2 3 1 1 3 2 5 2 3 0 5-2 5-5"/>',
  download: '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',
  upload: '<path d="M12 21V9M7 14l5-5 5 5M5 3h14"/>',
  flame: '<path d="M12 22c4 0 7-3 7-7 0-4-3-6-4-10-2 2-3 4-3 6-1-1-2-2-2-4-3 3-5 5-5 8 0 4 3 7 7 7z"/>',
  up: '<path d="m18 15-6-6-6 6"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  divider: '<path d="M3 12h4M17 12h4M12 8l1.5 4L12 16l-1.5-4z"/>',
  planner: '<rect x="3" y="4" width="18" height="18" rx="3"/><path d="M16 2v4M8 2v4M3 10h18M8 15l2.5 2.5L16 13"/>',
  repeat: '<path d="M17 2l4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  mic: '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 17v5M8 22h8"/>',
  pen: '<path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.6 7.6"/><circle cx="11" cy="11" r="2"/>',
  tag: '<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8z"/><circle cx="7" cy="7" r="1.5"/>',
  eyeOff: '<path d="M17.9 17.9A10 10 0 0 1 12 20c-7 0-10-8-10-8a18 18 0 0 1 5.1-5.9M9.9 4.2A9 9 0 0 1 12 4c7 0 10 8 10 8a18 18 0 0 1-2.2 3.2M1 1l22 22"/><path d="M14.1 14.1A3 3 0 1 1 9.9 9.9"/>',
  play: '<path fill="currentColor" d="M7 4v16l13-8z"/>',
  pause: '<path fill="currentColor" d="M6 4h4v16H6zM14 4h4v16h-4z"/>',
  stop: '<rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/>',
  house: '<path d="M3 11 12 3l9 8M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
};
function icon(name, size) {
  const s = size ? ` style="width:${size}px;height:${size}px"` : '';
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"${s}>${ICONS[name] || ''}</svg>`;
}

/* ---------- Дати ---------- */
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTHS_GEN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const WD = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const pad = (n) => String(n).padStart(2, '0');

const D = {
  local(d = new Date()) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`; },
  parse(s) {
    const [dp, tp = '00:00'] = String(s).split('T');
    const [y, m, d] = dp.split('-').map(Number);
    const [h, mi] = tp.split(':').map(Number);
    return new Date(y, (m || 1) - 1, d || 1, h || 0, mi || 0);
  },
  key(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; },
  fromKey(k) { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d || 1); },
  monthKey(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`; },
  start(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); },
  monthStart(d) { return new Date(d.getFullYear(), d.getMonth(), 1); },
  addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; },
  addMonths(d, n) { return new Date(d.getFullYear(), d.getMonth() + n, Math.min(d.getDate(), 28)); },
  daysIn(d) { return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(); },
  wd(d) { return (d.getDay() + 6) % 7; },
  between(a, b) { return Math.round((D.start(b) - D.start(a)) / 86400000); },
  isToday(d) { return D.key(d) === D.key(new Date()); },
  long(d) { return `${WEEKDAYS[d.getDay()]}, ${MONTHS_GEN[d.getMonth()]} ${d.getDate()}`; },
  dm(d) { return `${MONTHS_GEN[d.getMonth()]} ${d.getDate()}`; },
  dmy(d) { return `${MONTHS_GEN[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`; },
  time(d) { return `${pad(d.getHours())}:${pad(d.getMinutes())}`; },
  monthTitle(d) { return `${cap(MONTHS[d.getMonth()])} ${d.getFullYear()}`; },
  greeting() {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return 'Good morning';
    if (h >= 12 && h < 18) return 'Good afternoon';
    if (h >= 18 && h < 23) return 'Good evening';
    return 'Quiet night';
  },
};

/* ---------- База даних (IndexedDB на телефоні) ---------- */
const DB = {
  db: null,
  open() {
    return new Promise((resolve, reject) => {
      const r = indexedDB.open('my-diary', 2);
      r.onupgradeneeded = () => {
        // нові сховища додаються, старі дані не чіпаються
        const db = r.result;
        for (const [name, key] of [['entries', 'id'], ['photoMeta', 'id'], ['photoData', 'id'], ['dayMoods', 'key'], ['highlights', 'key'], ['kv', 'key'], ['tasks', 'id'], ['voices', 'id']]) {
          if (!db.objectStoreNames.contains(name)) db.createObjectStore(name, { keyPath: key });
        }
      };
      r.onsuccess = () => { DB.db = r.result; resolve(); };
      r.onerror = () => reject(r.error);
    });
  },
  req(r) { return new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); },
  store(name, mode = 'readonly') { return DB.db.transaction(name, mode).objectStore(name); },
  all(name) { return DB.req(DB.store(name).getAll()); },
  get(name, key) { return DB.req(DB.store(name).get(key)); },
  put(name, val) {
    return new Promise((res, rej) => {
      const tx = DB.db.transaction(name, 'readwrite');
      tx.objectStore(name).put(val);
      tx.oncomplete = () => res();
      tx.onerror = () => rej(tx.error);
      tx.onabort = () => rej(tx.error);
    });
  },
  del(name, key) {
    return new Promise((res, rej) => {
      const tx = DB.db.transaction(name, 'readwrite');
      tx.objectStore(name).delete(key);
      tx.oncomplete = () => res();
      tx.onerror = () => rej(tx.error);
    });
  },
};

/* ---------- Емоції ---------- */
const BUILTIN_EMOTIONS = [
  ['calm', '😐', 'Calm', 'pos', 0.8, '#9DB5A0'], ['content', '🙂', 'Content', 'pos', 1.2, '#C9B76C'],
  ['joy', '😊', 'Joy', 'pos', 1.6, '#E3B95B'], ['elation', '😁', 'Elation', 'pos', 2.0, '#E9A44C'],
  ['tenderness', '🥰', 'Tenderness', 'pos', 1.6, '#E0A3B2'], ['admiration', '😍', 'Admiration', 'pos', 1.8, '#DC8B9B'],
  ['inlove', '💗', 'In love', 'pos', 1.9, '#D47A92'], ['relief', '😌', 'Relief', 'pos', 1.2, '#A7C4A0'],
  ['confidence', '😎', 'Confidence', 'pos', 1.5, '#C79A5B'], ['inspiration', '🤩', 'Inspired', 'pos', 1.9, '#DDBE5E'],
  ['celebration', '🥳', 'Excited', 'pos', 1.9, '#D98E5F'], ['touched', '🥹', 'Touched', 'pos', 1.3, '#D2A7C6'],
  ['gratitude', '🙏', 'Gratitude', 'pos', 1.6, '#B8A36A'], ['cozy', '☕️', 'Cozy', 'pos', 1.4, '#B98B65'],
  ['hope', '🌱', 'Hope', 'pos', 1.1, '#8FAE7A'],
  ['emptiness', '😶', 'Empty', 'mix', -0.5, '#8E9199'], ['tired', '😴', 'Tired', 'mix', -0.4, '#8A8FB0'],
  ['thoughtful', '🤔', 'Thoughtful', 'mix', 0.2, '#A69A7E'], ['confused', '😕', 'Confused', 'mix', -0.5, '#A99BB8'],
  ['tense', '😬', 'Tense', 'mix', -0.8, '#B59C6E'], ['awkward', '🫣', 'Awkward', 'mix', -0.4, '#C49A9A'],
  ['indifferent', '😑', 'Indifferent', 'mix', -0.3, '#8F8A85'], ['bored', '🥱', 'Bored', 'mix', -0.3, '#9A9F8C'],
  ['nostalgia', '🥲', 'Nostalgic', 'mix', 0.3, '#B79C8F'],
  ['anxiety', '😟', 'Anxious', 'neg', -1.2, '#7C8FB0'], ['sad', '😢', 'Sad', 'neg', -1.3, '#6F8FB8'],
  ['disappointed', '😞', 'Disappointed', 'neg', -1.2, '#8A7FA6'], ['depressed', '😔', 'Depressed', 'neg', -1.6, '#5F6F8F'],
  ['anger', '😠', 'Angry', 'neg', -1.5, '#B5544F'], ['irritation', '😣', 'Irritated', 'neg', -1.1, '#C2704E'],
  ['grief', '😭', 'Grief', 'neg', -1.9, '#4E6E9E'], ['fear', '😨', 'Afraid', 'neg', -1.6, '#6B6390'],
  ['overwhelmed', '😖', 'Overwhelmed', 'neg', -1.5, '#9C5F78'], ['despair', '😫', 'Despair', 'neg', -2.0, '#7A3F55'],
  ['lonely', '🫥', 'Lonely', 'neg', -1.3, '#6E7A8C'], ['guilt', '😓', 'Guilty', 'neg', -1.2, '#8C7A6B'],
].map(([id, emoji, name, cat, score, color]) => ({ id, emoji, name, cat, score, color }));

const CATS = [
  { id: 'pos', title: 'Positive', color: '#C9A95B' },
  { id: 'mix', title: 'Neutral & mixed', color: '#9A97A8' },
  { id: 'neg', title: 'Difficult', color: '#6F86AE' },
  { id: 'stk', title: 'Stickers', color: '#A99FBF' },
];

const Emo = {
  all() {
    const nm = S.settings.emoNames || {};
    const rename = (e) => (nm[e.id] ? { ...e, name: nm[e.id] } : e);
    return BUILTIN_EMOTIONS.map(rename).concat((S.settings.customEmotions || []).map(rename));
  },
  get(id) { return Emo._map()[id]; },
  _map() {
    const list = Emo.all();
    const sig = list.length + '|' + JSON.stringify(S.settings.emoNames || {});
    if (Emo._cacheLen !== sig) {
      Emo._cache = Object.fromEntries(list.map((e) => [e.id, e]));
      Emo._cacheLen = sig;
    }
    return Emo._cache;
  },
  inCat(c) { return Emo.all().filter((e) => e.cat === c); },
  badge(e, size = 32) {
    if (!e) return '';
    return `<span class="emo face" style="--c:${e.color};--s:${size}px" title="${esc(e.name)}">${Faces.svg(e)}</span>`;
  },
  stack(ids, size = 30, max = 5) {
    const list = (ids || []).map(Emo.get).filter(Boolean);
    let h = `<span class="emo-stack">${list.slice(0, max).map((e) => Emo.badge(e, size)).join('')}`;
    if (list.length > max) h += `<span class="emo-more">+${list.length - max}</span>`;
    return h + '</span>';
  },
  chip(e, star) {
    return `<span class="chip" style="--c:${e.color}">${Emo.badge(e, 24)}${esc(e.name)}${star ? ' <span style="color:var(--accent);font-size:10px">★</span>' : ''}</span>`;
  },
  moodLabel(s) {
    if (s >= 1.3) return 'Great';
    if (s >= 0.5) return 'Good';
    if (s >= -0.5) return 'Okay';
    if (s >= -1.3) return 'Not easy';
    return 'Hard';
  },
};

/* ---------- Теми ---------- */
const THEMES = [
  { id: 'darkForest', name: 'Dark Forest', sub: 'Moss, mist and fireflies', dark: true,
    bgTop: '#0F1A14', bgBottom: '#18271D', card: '#1D2C22', border: '#3A5241', accent: '#9BBF84', text: '#E8E4D4', subc: '#A9B3A0',
    sky: ['#0A130F', '#1D3527', '#2E4A33'], layers: ['#1B3022', '#132219', '#0C1610'], scene: 'forest', particles: 'fireflies', moon: '#E9E3C4',
    decor: ['❦', '✦', '☾', '🍃'], orn: '· ✦ ❦ ✦ ·', corner: '🍃', mushrooms: true },
  { id: 'cozyLibrary', name: 'Cozy Library', sub: 'Bookshelves and candles', dark: true,
    bgTop: '#1C120B', bgBottom: '#2A1A11', card: '#382316', border: '#5C3D27', accent: '#D9914E', text: '#F1E3CF', subc: '#C2A88C',
    sky: ['#2A1910', '#3B2416'], layers: ['#6B3A2A', '#3E4F38', '#8A6A3B', '#5A2E3A', '#2F3D52', '#7A5232'], scene: 'library', particles: 'dust',
    decor: ['📖', '🕯️', '✧', '☕️'], orn: '— ✧ 📖 ✧ —', corner: '📖' },
  { id: 'fairycore', name: 'Fairycore', sub: 'Flowers, butterflies, magic', dark: true,
    bgTop: '#272035', bgBottom: '#352B45', card: '#41354F', border: '#6E5C86', accent: '#E3B7D9', text: '#F4ECF7', subc: '#CBB9D4',
    sky: ['#2B2140', '#5B4775', '#A07C9E'], layers: ['#4E5E4A', '#3A4A3A', '#2A382C'], scene: 'meadow', particles: 'fireflies', moon: '#F6E7F0',
    decor: ['✿', '🦋', '✧', '❀'], orn: '˚ ✿ ˚ ✧ ˚ ✿ ˚', corner: '🦋' },
  { id: 'cottagecore', name: 'Cottagecore', sub: 'Cottage, garden and linen', dark: false,
    bgTop: '#EEE5D1', bgBottom: '#E3D6BB', card: '#FBF6EA', border: '#D6C7A6', accent: '#6F8247', text: '#3B3226', subc: '#7A6B55',
    sky: ['#F3E3C3', '#EBD3A8', '#E7C79A'], layers: ['#A9B27E', '#8C9A62', '#6F8247'], scene: 'meadow', particles: 'petals', moon: '#FFF3D6', cottage: true,
    decor: ['❀', '🌿', '✿', '🍄'], orn: '~ ❀ ~ ✿ ~ ❀ ~', corner: '🌿' },
  { id: 'gothicNature', name: 'Gothic Nature', sub: 'Moon, mist, burgundy', dark: true,
    bgTop: '#110D15', bgBottom: '#1B1318', card: '#23191F', border: '#4A2C35', accent: '#B0566A', text: '#E9DFE3', subc: '#A8949C',
    sky: ['#0B0A12', '#1E1527', '#3A2033'], layers: ['#1E1720', '#151017', '#0C090D'], scene: 'night', particles: 'stars', moon: '#EFE8DA',
    decor: ['☾', '✶', '🥀', '⋆'], orn: '☾ ⋆ ✶ ⋆ ☽', corner: '🥀' },
  { id: 'minimalist', name: 'Minimalist', sub: 'Quiet, text and photos', dark: true,
    bgTop: '#161719', bgBottom: '#18191B', card: '#212226', border: '#2E3034', accent: '#C9B88A', text: '#ECECEC', subc: '#9A9A9A',
    sky: ['#1B1C1F', '#232428'], layers: ['#2A2B2F'], scene: 'minimal', particles: '', decor: [], orn: '—  ·  —', corner: '' },
  { id: 'autumn', name: 'Autumn', sub: 'Falling leaves and warm tea', dark: true,
    bgTop: '#22140C', bgBottom: '#311E0F', card: '#3B2615', border: '#6B4423', accent: '#D9822B', text: '#F3E2CC', subc: '#C6A580',
    sky: ['#3A1F10', '#7A3F1C', '#C47A3A'], layers: ['#6B3A1A', '#4A2812', '#2B170B'], scene: 'forest', particles: 'leaves', moon: '#F5C98A', mushrooms: true,
    decor: ['🍂', '🍁', '☕️', '✦'], orn: '🍂 · ✦ · 🍂', corner: '🍁' },
  { id: 'winter', name: 'Winter', sub: 'Snow, silence, little lights', dark: true,
    bgTop: '#0E1624', bgBottom: '#172236', card: '#1E2B42', border: '#34476A', accent: '#A9C8E8', text: '#E9F0F8', subc: '#A6B6CC',
    sky: ['#0B1322', '#1D2C49', '#3A4E74'], layers: ['#2C3B57', '#1D2840', '#DDE7F2'], scene: 'forest', particles: 'snow', moon: '#F2F5FA', cottage: true,
    decor: ['❄︎', '✧', '⋆'], orn: '❄︎ · ✧ · ❄︎', corner: '❄︎' },
  { id: 'spring', name: 'Spring', sub: 'Blossoms and first leaves', dark: false,
    bgTop: '#EEF3E6', bgBottom: '#E1EAD4', card: '#FAFCF5', border: '#CADBB5', accent: '#7E9C5E', text: '#2F3A28', subc: '#6E7D62',
    sky: ['#DDEBDC', '#F3E3E8', '#F7EEDC'], layers: ['#B9CF9A', '#9DBA7C', '#7E9C5E'], scene: 'meadow', particles: 'petals', moon: '#FFF7E0',
    decor: ['🌸', '🌿', '🐞', '✿'], orn: '✿ · ❀ · ✿', corner: '🌸' },
  { id: 'summer', name: 'Summer', sub: 'Warm evening and fireflies', dark: true,
    bgTop: '#1A1D2B', bgBottom: '#272834', card: '#2D303F', border: '#4B4F66', accent: '#E8B86A', text: '#F2EEE6', subc: '#B9B3A6',
    sky: ['#262848', '#6A4E6A', '#C9875A'], layers: ['#3B4A3A', '#2A3529', '#1B231B'], scene: 'meadow', particles: 'fireflies', moon: '#FFD9A0',
    decor: ['☼', '✧', '🌾'], orn: '☼ · ✦ · ☼', corner: '🌾' },
];

const DIVIDERS = ['theme', '🌿 ❦ 🌿', '✦ ⋆ ✧ ⋆ ✦', '☾ ⋆ ☽', '✿ ❀ ✿', '· · · · ·', '─────'];
const TEXT_COLORS = [['Theme default', ''], ['Muted gold', '#C9A95B'], ['Sage', '#9BBF84'], ['Moss', '#6F8247'], ['Burgundy', '#B0566A'],
  ['Rose', '#E0A3B2'], ['Lavender', '#B9A6E0'], ['Night sky', '#7F9CCB'], ['Coffee', '#A87A55'], ['Amber', '#D9914E']];

/* ---------- Стан застосунку ---------- */
const S = {
  entries: [],          // записи (без фото-даних)
  photoMeta: {},        // id -> {id, entryId, caption}
  dayMoods: {},         // 'YYYY-MM-DD' -> [emotionId, ...] позначки настрою протягом дня
  dayTimes: {},         // 'YYYY-MM-DD' -> [час кожної позначки]
  highlights: {},       // '2026-11' | '2026' -> {key, url}
  settings: {
    name: '', themeId: 'darkForest', accent: '', card: '', bg: '', decor: true, animate: true,
    serif: false, size: 17, customEmotions: [], pinHash: '', lastBackup: 0, headerImg: null, bgImg: null,
  },
};

async function loadAll() {
  const [entries, metas, moods, kv] = await Promise.all([DB.all('entries'), DB.all('photoMeta'), DB.all('dayMoods'), DB.all('kv')]);
  S.entries = entries.sort((a, b) => b.date.localeCompare(a.date));
  S.photoMeta = Object.fromEntries(metas.map((m) => [m.id, m]));
  S.dayMoods = Object.fromEntries(moods.map((m) => [m.key, normDay(m.emotions || m.emotion)]).filter(([, v]) => v.length));
  S.dayTimes = Object.fromEntries(moods.map((m) => [m.key, m.times || []]));
  for (const row of kv) if (row.key === 'settings') Object.assign(S.settings, row.value);
  const hls = await DB.all('highlights');
  S.highlights = {};
  for (const h of hls) S.highlights[h.key] = { key: h.key, url: URL.createObjectURL(h.thumb || h.full), at: h.at };
}

/** Емоції дня завжди як масив (старі записи мали одну емоцію рядком). */
function normDay(v) {
  if (!v) return [];
  return (Array.isArray(v) ? v : [v]).filter(Boolean);
}
function dayEmotions(key) { return normDay(S.dayMoods[key]); }
/** Позначки настрою за день (одну емоцію можна позначати кілька разів). */
async function setDayEmotions(key, list, times) {
  list = normDay(list);
  if (list.length) {
    S.dayMoods[key] = list;
    S.dayTimes[key] = times || S.dayTimes[key] || [];
    await DB.put('dayMoods', { key, emotions: list, emotion: list[0], times: S.dayTimes[key] });
  } else {
    delete S.dayTimes[key];
    delete S.dayMoods[key];
    await DB.del('dayMoods', key);
  }
}

async function saveSettings() { await DB.put('kv', { key: 'settings', value: S.settings }); }

function sortEntries() { S.entries.sort((a, b) => b.date.localeCompare(a.date)); }

/* ---------- Фото ---------- */
const PhotoURL = {
  cache: {},
  async get(id, kind = 'thumb') {
    const k = id + ':' + kind;
    if (PhotoURL.cache[k]) return PhotoURL.cache[k];
    const rec = await DB.get('photoData', id);
    if (!rec) return '';
    const blob = kind === 'full' ? rec.full || rec.thumb : rec.thumb || rec.full;
    PhotoURL.cache[k] = URL.createObjectURL(blob);
    return PhotoURL.cache[k];
  },
  drop(id) {
    for (const kind of ['thumb', 'full']) {
      const k = id + ':' + kind;
      if (PhotoURL.cache[k]) { URL.revokeObjectURL(PhotoURL.cache[k]); delete PhotoURL.cache[k]; }
    }
  },
};

/** Заповнює <img data-pid> справжніми фото після рендеру. */
const loadPid = (img) => PhotoURL.get(img.dataset.pid, img.dataset.kind || 'thumb').then((u) => { if (u) img.src = u; });
// фото підвантажуються лише коли до них догортаєш — щоб iPhone не закривав сторінку через нестачу памʼяті
const HydIO = 'IntersectionObserver' in window ? new IntersectionObserver((list) => {
  for (const en of list) if (en.isIntersecting) { HydIO.unobserve(en.target); loadPid(en.target); }
}, { rootMargin: '800px 0px' }) : null;
function hydrate(root = document) {
  for (const img of $$('img[data-pid]', root)) {
    if (img.dataset.done) continue;
    img.dataset.done = '1';
    if (HydIO) HydIO.observe(img); else loadPid(img);
  }
}

function loadImage(blob) {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => { res(img); setTimeout(() => URL.revokeObjectURL(url), 1000); };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('Could not open the photo')); };
    img.src = url;
  });
}

function resizeTo(img, max, quality) {
  const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  c.getContext('2d').drawImage(img, 0, 0, w, h);
  return new Promise((res) => c.toBlob((b) => res(b), 'image/jpeg', quality));
}

/** Фото копіюється в щоденник (оригінал у галереї можна видаляти). */
async function processPhoto(file, maxFull = 2000) {
  const img = await loadImage(file);
  const full = await resizeTo(img, maxFull, 0.85);
  const thumb = await resizeTo(img, 420, 0.75);
  return { full, thumb, w: img.naturalWidth, h: img.naturalHeight };
}

async function savePhoto(entryId, file) {
  const { full, thumb } = await processPhoto(file);
  const id = uid();
  await DB.put('photoData', { id, full, thumb });
  const meta = { id, entryId, caption: '' };
  await DB.put('photoMeta', meta);
  S.photoMeta[id] = meta;
  return id;
}

async function deletePhoto(id) {
  await DB.del('photoData', id);
  await DB.del('photoMeta', id);
  delete S.photoMeta[id];
  PhotoURL.drop(id);
}

async function setHighlight(key, blob) {
  if (S.highlights[key]) URL.revokeObjectURL(S.highlights[key].url);
  if (!blob) {
    await DB.del('highlights', key);
    delete S.highlights[key];
    return;
  }
  const img = await loadImage(blob);
  const full = await resizeTo(img, 1800, 0.85);
  const thumb = await resizeTo(img, 700, 0.8);
  await DB.put('highlights', { key, full, thumb, at: Date.now() });
  S.highlights[key] = { key, url: URL.createObjectURL(thumb), at: Date.now() };
}

async function photoBlob(id) {
  const rec = await DB.get('photoData', id);
  return rec ? rec.full || rec.thumb : null;
}

/* ---------- Похідні поля запису ---------- */
function htmlToText(html) {
  const div = document.createElement('div');
  div.innerHTML = html || '';
  $$('figure, .divider', div).forEach((n) => n.remove());
  $$('p, div, li, blockquote, br', div).forEach((n) => n.insertAdjacentText('afterend', '\n'));
  return div.textContent.replace(/\n{3,}/g, '\n\n').trim();
}

function photoIdsIn(html) {
  return Array.from(String(html || '').matchAll(/data-photo="([^"]+)"/g)).map((m) => m[1]);
}

function refreshEntry(e) {
  e.text = htmlToText(e.html);
  e.photos = photoIdsIn(e.html);
  e.voices = Array.from(String(e.html || '').matchAll(/data-voice="([^"]+)"/g)).map((m) => m[1]);
  const d = D.parse(e.date);
  const caps = e.photos.map((p) => S.photoMeta[p]?.caption || '').join(' ');
  const names = (e.emotions || []).map((id) => Emo.get(id)?.name || '').join(' ');
  const dates = [D.dmy(d), `${MONTHS[d.getMonth()]} ${d.getFullYear()}`, WEEKDAYS[d.getDay()], `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`, D.key(d)].join(' ');
  const tags = (e.tags || []).map((t) => '#' + t + ' ' + t).join(' ');
  e.search = fold([e.title, e.text, caps, names, dates, tags].join(' '));
  e.updatedAt = Date.now();
}

/* ---------- Індекс днів і статистика ---------- */
function buildIndex() {
  const days = {};
  const list = S.entries.slice().sort((a, b) => a.date.localeCompare(b.date));
  for (const e of list) {
    const k = e.date.slice(0, 10);
    const d = days[k] || (days[k] = { key: k, date: D.fromKey(k), entries: [], counts: {}, order: [], photos: 0, marks: [] });
    d.entries.push(e);
    for (const id of e.emotions || []) {
      d.counts[id] = (d.counts[id] || 0) + 1;
      d.marks.push(id);
      if (!d.order.includes(id)) d.order.push(id);
    }
    d.photos += (e.photos || []).length;
  }
  for (const [k, v] of Object.entries(S.dayMoods)) {
    const list = normDay(v);
    if (!list.length) continue;
    const d = days[k] || (days[k] = { key: k, date: D.fromKey(k), entries: [], counts: {}, order: [], photos: 0, marks: [] });
    d.dayEmotions = list;
    // кожна позначка настрою протягом дня рахується
    for (const id of list) {
      d.counts[id] = (d.counts[id] || 0) + 1;
      d.marks.push(id);
      if (!d.order.includes(id)) d.order.push(id);
    }
  }
  for (const d of Object.values(days)) {
    // головна емоція — та, яку позначали найчастіше
    d.main = d.order.slice().sort((a, b) => (d.counts[b] - d.counts[a]) || (d.order.indexOf(a) - d.order.indexOf(b)))[0] || null;
    d.dayEmotion = d.main;
    d.all = d.order.slice().sort((a, b) => (d.counts[b] - d.counts[a]) || (d.order.indexOf(a) - d.order.indexOf(b)));
    const scores = [];
    for (const [id, c] of Object.entries(d.counts)) { const em = Emo.get(id); if (em) for (let i = 0; i < c; i++) scores.push(em.score); }
    const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
    const main = d.main && Emo.get(d.main) ? Emo.get(d.main).score : null;
    d.score = main != null && avg != null ? 0.6 * main + 0.4 * avg : (main ?? avg); // немає даних = null, не «поганий день»
  }
  return days;
}

function streak(days) {
  let d = D.start(new Date());
  if (!days[D.key(d)]?.entries.length) d = D.addDays(d, -1);
  let n = 0;
  while (days[D.key(d)]?.entries.length) { n++; d = D.addDays(d, -1); }
  return n;
}

const PERIODS = [
  ['week', '7 days'], ['d30', '30 days'], ['month', 'Month'], ['m3', '3 months'],
  ['m6', '6 months'], ['m12', '12 months'], ['year', 'Year'], ['all', 'All time'],
];

function periodRange(p, anchor) {
  const today = D.start(new Date());
  switch (p) {
    case 'week': return [D.addDays(today, -6), today];
    case 'd30': return [D.addDays(today, -29), today];
    case 'm3': return [D.addDays(D.addMonths(today, -3), 1), today];
    case 'm6': return [D.addDays(D.addMonths(today, -6), 1), today];
    case 'm12': return [D.addDays(D.addMonths(today, -12), 1), today];
    case 'month': { const s = D.monthStart(anchor); return [s, new Date(s.getFullYear(), s.getMonth(), D.daysIn(s))]; }
    case 'year': return [new Date(anchor.getFullYear(), 0, 1), new Date(anchor.getFullYear(), 11, 31)];
    default: {
      const first = S.entries.length ? D.start(D.parse(S.entries[S.entries.length - 1].date)) : D.addDays(today, -29);
      return [first < today ? first : D.addDays(today, -29), today];
    }
  }
}

function computeStats(days, start, end) {
  const today = D.start(new Date());
  const n = D.between(start, end) + 1;
  const all = [];
  for (let i = 0; i < n; i++) all.push(D.addDays(start, i));
  const infos = all.map((d) => days[D.key(d)]).filter(Boolean);
  const scored = infos.filter((d) => d.score != null && d.date <= today);
  const st = { start, end, all, infos, scored };
  st.entryCount = infos.reduce((a, d) => a + d.entries.length, 0);
  st.photoCount = infos.reduce((a, d) => a + d.photos, 0);
  st.daysWithData = scored.length;
  st.noData = Math.max(0, all.filter((d) => d <= today).length - scored.length);
  const counts = {}, pairs = {}, mains = {};
  for (const d of infos) {
    (d.dayEmotions || []).forEach((id) => (counts[id] = (counts[id] || 0) + 1));
    for (const e of d.entries) {
      const ids = [...new Set(e.emotions || [])];
      ids.forEach((id) => (counts[id] = (counts[id] || 0) + 1));
      for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
        const k = [ids[i], ids[j]].sort().join('|');
        pairs[k] = (pairs[k] || 0) + 1;
      }
    }
  }
  for (const d of scored) if (d.main) mains[d.main] = (mains[d.main] || 0) + 1;
  st.counts = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  st.total = st.counts.reduce((a, c) => a + c[1], 0);
  st.cats = { pos: 0, mix: 0, neg: 0, stk: 0 };
  for (const [id, c] of st.counts) { const e = Emo.get(id); if (e) st.cats[e.cat] = (st.cats[e.cat] || 0) + c; }
  st.pairs = Object.entries(pairs).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, c]) => [...k.split('|'), c]);
  st.mains = Object.entries(mains).sort((a, b) => b[1] - a[1]);
  const byScore = scored.slice().sort((a, b) => b.score - a.score);
  st.best = byScore.filter((d) => d.score > 0).slice(0, 3);
  st.hardest = byScore.slice().reverse().filter((d) => d.score < 0).slice(0, 3);
  st.avg = scored.length ? scored.reduce((a, d) => a + d.score, 0) / scored.length : null;
  const wd = [[], [], [], [], [], [], []];
  for (const d of scored) wd[D.wd(d.date)].push(d.score);
  st.weekdays = wd.map((v) => (v.length ? v.reduce((a, b) => a + b, 0) / v.length : null));
  // точки графіка (розриви там, де немає даних)
  st.bucket = n <= 92 ? 'day' : n <= 400 ? 'week' : 'month';
  const bStart = (d) => st.bucket === 'day' ? D.key(d) : st.bucket === 'week' ? D.key(D.addDays(d, -D.wd(d))) : D.monthKey(d) + '-01';
  const buckets = [];
  const map = {};
  for (const d of all) {
    if (d > today) break;
    const k = bStart(d);
    if (!map[k]) { map[k] = []; buckets.push(k); }
    const info = days[D.key(d)];
    if (info && info.score != null) map[k].push(info);
  }
  let seg = 0;
  st.points = [];
  buckets.forEach((k, i) => {
    const list = map[k];
    if (!list.length) { seg++; return; }
    const mc = {};
    list.forEach((x) => x.main && (mc[x.main] = (mc[x.main] || 0) + 1));
    const main = Object.entries(mc).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
    st.points.push({ i, key: k, date: D.fromKey(k), score: list.reduce((a, x) => a + x.score, 0) / list.length, main, seg });
  });
  st.bucketCount = buckets.length;
  return st;
}

/* ---------- Резервна копія (один файл з усім) ----------
   Формат: "MYDIARY1" + 12 цифр довжини + JSON-опис + сирі байти фото.
   Так навіть сотні фото не перевантажують памʼять телефона. */
async function makeBackup() {
  const photoIds = Object.keys(S.photoMeta);
  const blobs = [];
  let offset = 0;
  const photos = [];
  for (const id of photoIds) {
    const rec = await DB.get('photoData', id);
    if (!rec) continue;
    const item = { ...S.photoMeta[id] };
    if (rec.full) { item.full = [offset, rec.full.size]; blobs.push(rec.full); offset += rec.full.size; }
    if (rec.thumb) { item.thumb = [offset, rec.thumb.size]; blobs.push(rec.thumb); offset += rec.thumb.size; }
    photos.push(item);
  }
  const hls = [];
  for (const h of await DB.all('highlights')) {
    const item = { key: h.key, at: h.at };
    if (h.full) { item.full = [offset, h.full.size]; blobs.push(h.full); offset += h.full.size; }
    if (h.thumb) { item.thumb = [offset, h.thumb.size]; blobs.push(h.thumb); offset += h.thumb.size; }
    hls.push(item);
  }
  const settings = { ...S.settings, headerImg: null, bgImg: null, pinHash: '' };
  const manifest = { app: 'MyDiary', version: 1, createdAt: Date.now(), entries: S.entries, photos, dayMoods: S.dayMoods, highlights: hls, settings };
  const json = new TextEncoder().encode(JSON.stringify(manifest));
  const header = 'MYDIARY1' + String(json.length).padStart(12, '0');
  const d = new Date();
  const name = `own-journal-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.diary`;
  return new File([header, json, ...blobs], name, { type: 'application/octet-stream' });
}

async function restoreBackup(file) {
  const head = await file.slice(0, 20).text();
  if (!head.startsWith('MYDIARY1')) throw new Error('This is not a journal backup file');
  const len = parseInt(head.slice(8, 20), 10);
  const manifest = JSON.parse(await file.slice(20, 20 + len).text());
  const base = 20 + len;
  const part = (r) => (r ? file.slice(base + r[0], base + r[0] + r[1], 'image/jpeg') : null);
  const toBlob = async (r) => (r ? new Blob([await part(r).arrayBuffer()], { type: 'image/jpeg' }) : null);

  const existing = new Set(S.entries.map((e) => e.id));
  let added = 0;
  const newEntryIds = new Set();
  for (const e of manifest.entries || []) {
    if (existing.has(e.id)) continue;
    await DB.put('entries', e);
    S.entries.push(e);
    newEntryIds.add(e.id);
    added++;
  }
  for (const p of manifest.photos || []) {
    if (S.photoMeta[p.id]) continue;
    if (!newEntryIds.has(p.entryId) && existing.has(p.entryId)) continue;
    const full = await toBlob(p.full);
    const thumb = await toBlob(p.thumb);
    await DB.put('photoData', { id: p.id, full, thumb });
    const meta = { id: p.id, entryId: p.entryId, caption: p.caption || '' };
    await DB.put('photoMeta', meta);
    S.photoMeta[p.id] = meta;
  }
  for (const [k, v] of Object.entries(manifest.dayMoods || {})) {
    if (!dayEmotions(k).length && normDay(v).length) await setDayEmotions(k, v);
  }
  for (const h of manifest.highlights || []) {
    if (S.highlights[h.key]) continue;
    const full = await toBlob(h.full);
    const thumb = await toBlob(h.thumb);
    await DB.put('highlights', { key: h.key, full, thumb, at: h.at || Date.now() });
    S.highlights[h.key] = { key: h.key, url: URL.createObjectURL(thumb || full), at: h.at };
  }
  const st = manifest.settings || {};
  const known = new Set((S.settings.customEmotions || []).map((e) => e.id));
  for (const e of st.customEmotions || []) if (!known.has(e.id)) S.settings.customEmotions.push(e);
  if (!S.entries.length || added === S.entries.length) {
    // новий телефон: забираємо й оформлення
    for (const k of ['name', 'themeId', 'accent', 'card', 'bg', 'decor', 'animate', 'serif', 'size']) if (st[k] !== undefined) S.settings[k] = st[k];
  }
  await saveSettings();
  sortEntries();
  return added;
}

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('my-diary::' + text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}
