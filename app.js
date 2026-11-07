'use strict';
/* ==========================================================================
   own journal — екрани та взаємодія
   ========================================================================== */

const View = { leave: null, stop: null };
const scrollMem = {};
let navDepth = 0;
let headerURL = '';
let bgURL = '';

/* ---------- Тема ---------- */
function theme() {
  const st = S.settings;
  const base = THEMES.find((t) => t.id === st.themeId) || THEMES[0];
  const t = { ...base };
  if (st.accent) t.accent = st.accent;
  if (st.card) t.card = st.card;
  if (st.bg) { t.bgTop = st.bg; t.bgBottom = st.bg; }
  if (st.textColor) t.text = st.textColor;
  t.btn = st.btnColor || t.accent;
  return t;
}

function hexToRgba(hex, a) {
  const h = String(hex || '#888').replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h.slice(0, 6), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

function isLight(hex) {
  const h = String(hex || '#888').replace('#', '');
  const n = parseInt(h.slice(0, 6), 16);
  return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) > 150;
}

const imgURLs = {};
function blobURL(key, blob) {
  if (imgURLs[key]?.blob === blob) return imgURLs[key].url;
  if (imgURLs[key]) URL.revokeObjectURL(imgURLs[key].url);
  if (!blob) { delete imgURLs[key]; return ''; }
  imgURLs[key] = { blob, url: URL.createObjectURL(blob) };
  return imgURLs[key].url;
}

const SECTIONS = [['home', 'Home'], ['entry', 'Entries'], ['planner', 'Planner'], ['stats', 'Calendar & stats']];
function sectionOf(route) {
  if (route === '') return 'home';
  if (['entry', 'edit', 'day'].includes(route)) return 'entry';
  if (route === 'planner') return 'planner';
  if (['stats', 'calendar', 'month', 'year'].includes(route)) return 'stats';
  return 'other';
}

function applyTheme() {
  const t = theme();
  const set = S.settings;
  const st = document.documentElement.style;
  st.setProperty('--bg-top', t.bgTop);
  st.setProperty('--bg-bottom', t.bgBottom);
  st.setProperty('--card', t.card);
  const op = set.cardOpacity ?? (t.id === 'minimalist' ? 1 : 0.92);
  st.setProperty('--card-a', hexToRgba(t.card, op));
  st.setProperty('--border', t.border);
  st.setProperty('--accent', t.accent);
  st.setProperty('--btn', t.btn);
  st.setProperty('--on-btn', isLight(t.btn) ? '#1c1714' : '#ffffff');
  st.setProperty('--text', t.text);
  st.setProperty('--sub', t.subc);
  st.setProperty('--on-accent', isLight(t.accent) ? '#141414' : '#ffffff');
  st.setProperty('--radius', (set.radius ?? 22) + 'px');
  st.setProperty('--card-border', set.cardBorder === false ? '0' : '1px');
  st.setProperty('--serif', fontStack(set.fontHead || 'mosca', 'mosca'));
  st.setProperty('--hand', fontStack(set.fontHead || 'mosca', 'mosca'));
  st.setProperty('--body-font', fontStack(set.fontBody || (set.serif ? 'newyork' : 'prata'), 'prata'));
  st.setProperty('--sans', fontStack(set.fontUI || 'prata', 'prata'));
  st.setProperty('--body-size', (set.size || 17) + 'px');
  document.documentElement.style.colorScheme = t.dark ? 'dark' : 'light';
  const meta = $('meta[name="theme-color"]');
  if (meta) meta.content = t.bgTop;
  headerURL = blobURL('header', set.headerImg);
  bgURL = blobURL('bg', set.bgImg);
  applyCustomIcon();
  paintBackground();
}

/** Фон сторінки: власна картинка розділу / загальна картинка / ілюстрація теми. */
function paintBackground() {
  const t = theme();
  const set = S.settings;
  const section = sectionOf(parseHash().parts[0] || '');
  const secBlob = set.sectionBg?.[section];
  const url = secBlob ? blobURL('sec-' + section, secBlob) : bgURL;
  const key = [t.id, t.bgTop, url, set.decor, set.sceneBg !== false].join('|');
  const bg = $('#bg');
  if (bg.dataset.key === key) return;
  bg.dataset.key = key;
  let html = '';
  if (url) html += `<div class="bg-img" style="background-image:url(${url})"></div><div class="bg-fade"></div>`;
  else if (set.sceneBg !== false && t.scene !== 'minimal') html += '<canvas class="bg-scene"></canvas><div class="bg-fade strong"></div>';
  if (set.decor && t.decor.length) {
    const r = rng(11);
    for (let i = 0; i < 16; i++) {
      html += `<span class="decor" style="left:${(r() * 100).toFixed(1)}%;top:${(r() * 100).toFixed(1)}%;font-size:${Math.round(10 + r() * 12)}px;opacity:${(0.05 + r() * 0.08).toFixed(2)};transform:rotate(${Math.round(-40 + r() * 80)}deg)">${t.decor[i % t.decor.length]}</span>`;
    }
  }
  html += '<div class="grain"></div>';
  bg.innerHTML = html;
  const cv = $('.bg-scene', bg);
  if (cv) requestAnimationFrame(() => paintScene(cv, t, false));
}

/** Збереження попереднього оформлення, щоб до нього можна було повернутися. */
const LOOK_KEYS = ['themeId', 'accent', 'card', 'bg', 'btnColor', 'textColor', 'fontHead', 'fontBody', 'fontUI', 'size', 'cardOpacity', 'radius', 'cardBorder', 'headerImg', 'bgImg', 'sectionBg', 'sceneBg'];
function snapshotLook() { const o = {}; LOOK_KEYS.forEach((k) => (o[k] = S.settings[k])); return o; }
function pushLookHistory() {
  const h = S.settings.lookHistory || [];
  h.push(snapshotLook());
  S.settings.lookHistory = h.slice(-10);
}

let iconApplied = null;
function applyCustomIcon() {
  const blob = S.settings.customIcon;
  if (iconApplied === blob) return;
  iconApplied = blob;
  const link = $('link[rel="apple-touch-icon"]');
  if (!link) return;
  if (!blob) { link.href = 'apple-touch-icon.png'; return; }
  const fr = new FileReader();
  fr.onload = () => { link.href = fr.result; };
  fr.readAsDataURL(blob);
}

/* ---------- Навігація ---------- */
function parseHash() {
  const h = location.hash.slice(1) || '/';
  const [path, qs] = h.split('?');
  return { parts: path.split('/').filter(Boolean).map(decodeURIComponent), q: new URLSearchParams(qs || '') };
}
function go(path, replace) {
  if (replace) location.replace('#' + path);
  else { navDepth++; location.hash = path; }
}
function back() {
  if (navDepth > 0) { navDepth--; history.back(); } else go('/', true);
}

const ROUTES = {};

async function render() {
  if (View.leave) { const f = View.leave; View.leave = null; try { await f(); } catch (e) { console.error(e); } }
  if (View.stop) { View.stop(); View.stop = null; }
  closeAllSheets();
  const { parts, q } = parseHash();
  const name = parts[0] || '';
  const v = $('#view');
  v.innerHTML = '';
  const fn = ROUTES[name] || ROUTES[''];
  paintBackground();
  await fn(v, parts, q);
  hydrate(v);
  window.scrollTo(0, name === '' ? scrollMem.home || 0 : 0);
}

window.addEventListener('hashchange', render);
window.addEventListener('scroll', () => { if ((parseHash().parts[0] || '') === '') scrollMem.home = window.scrollY; }, { passive: true });

/* ---------- Делегування дотиків ---------- */
const ACT = {};
document.addEventListener('click', (ev) => {
  const el = ev.target.closest('[data-go],[data-act]');
  if (!el || el.closest('.viewer')) return;
  if (el.dataset.go) { ev.preventDefault(); go(el.dataset.go, !!el.dataset.replace); return; }
  const f = ACT[el.dataset.act];
  if (f) { ev.preventDefault(); f(el, ev); }
});

ACT.back = () => back();
ACT.closeMsg = () => { messageClosed = true; $('#msg-card')?.remove(); };

/* ---------- Аркуші (нижні вікна) ---------- */
function openSheet(title, html, onMount, opts = {}) {
  const root = $('#sheet-root');
  const wrap = document.createElement('div');
  wrap.innerHTML = `<div class="sheet-backdrop"></div><div class="sheet"><div class="grab"></div>
    <div class="sheet-head"><h3>${title}</h3><button class="text-btn" data-sheet="close">${opts.doneText || 'Done'}</button></div>
    <div class="sheet-body">${html}</div></div>`;
  root.appendChild(wrap);
  const close = () => { if (!wrap.parentNode) return; wrap.remove(); opts.onClose && opts.onClose(); };
  wrap.querySelector('.sheet-backdrop').addEventListener('click', close);
  wrap.querySelector('[data-sheet="close"]').addEventListener('click', close);
  if (onMount) onMount(wrap.querySelector('.sheet-body'), close);
  hydrate(wrap);
  return close;
}
function closeAllSheets() { $('#sheet-root').innerHTML = ''; }

function menuSheet(title, items) {
  const html = `<div class="menu-list">${items.map((it, i) => `<button data-i="${i}" class="${it.danger ? 'danger' : ''}">${it.icon ? icon(it.icon) : ''}<span>${esc(it.label)}</span></button>`).join('')}</div>`;
  openSheet(title, html, (body, close) => {
    body.addEventListener('click', (e) => {
      const b = e.target.closest('[data-i]');
      if (!b) return;
      close();
      items[+b.dataset.i].run();
    });
  }, { doneText: 'Close' });
}

/* ---------- Спільні шматочки інтерфейсу ---------- */
function topbar(title, right = '') {
  return `<div class="topbar solid"><button class="icon-btn" data-act="back" aria-label="Back">${icon('back')}</button>
    <div class="title">${title}</div>${right || '<span style="width:42px;flex:none"></span>'}</div>`;
}
const orn = (txt) => `<div class="ornament">${esc(txt || theme().orn)}</div>`;
const sectionTitle = (t, s) => `<div><div class="section-title">${t}</div>${s ? `<div class="section-sub">${s}</div>` : ''}</div>`;

function entryCard(e, compact = false) {
  if (e.hidden && !showHidden) return '';
  const d = D.parse(e.date);
  if (e.locked && !unlockedEntries.has(e.id)) {
    return `<a class="card entry-card ${compact ? 'compact' : ''}" data-go="/entry/${e.id}"><div class="head">
      <div class="row" style="align-items:baseline;gap:8px"><span class="day">${pad(d.getDate())}</span><div><div class="month">${MONTHS_GEN[d.getMonth()]}</div><div class="meta">${WEEKDAYS[d.getDay()]} · ${D.time(d)}</div></div></div>
      <div class="grow"></div><span style="font-size:22px">🔒</span></div><div class="preview muted">Protected entry</div></a>`;
  }
  const t = theme();
  const ph = e.photos || [];
  let thumbs = '';
  if (ph.length) {
    thumbs = '<div class="thumbs">' + [0, 1, 2, 3].map((i) => {
      const p = ph[i];
      if (!p) return '<div></div>';
      const more = i === 3 && ph.length > 4 ? `<div class="more">+${ph.length - 4}</div>` : '';
      return `<div class="thumb"><img data-pid="${p}" alt="">${more}</div>`;
    }).join('') + '</div>';
  }
  return `<a class="card entry-card ${compact ? 'compact' : ''}" data-go="/entry/${e.id}">
    <div class="head">
      <div class="row" style="align-items:baseline;gap:8px">
        <span class="day">${pad(d.getDate())}</span>
        <div><div class="month">${MONTHS_GEN[d.getMonth()]}</div><div class="meta">${WEEKDAYS[d.getDay()]} · ${D.time(d)}</div></div>
      </div>
      <div class="grow"></div>
      <div style="text-align:right">${Emo.stack(e.emotions, compact ? 26 : 32, 4)}${e.favorite ? '<div style="color:var(--accent);font-size:13px;margin-top:4px">★</div>' : ''}</div>
    </div>
    ${e.title ? `<div class="title" translate="no">${esc(e.title)}</div>` : ''}
    ${e.text ? `<div class="preview" translate="no">${esc(e.text.slice(0, 400))}</div>` : ''}
    ${thumbs}
    ${(e.voices || []).length || (e.tags || []).length ? `<div class="row small muted" style="margin-top:8px;flex-wrap:wrap;gap:6px">${(e.voices || []).length ? `<span>🎙 ${e.voices.length}</span>` : ''}${(e.tags || []).map((t) => `<span class="tag" translate="no">#${esc(t)}</span>`).join('')}</div>` : ''}
    ${t.corner && S.settings.decor ? `<span class="corner">${t.corner}</span>` : ''}
  </a>`;
}

function allPhotos() {
  const list = [];
  for (const e of S.entries) for (const p of e.photos || []) list.push({ id: p, entry: e, date: e.date });
  return list; // від нових до старих
}

/* ---------- Перегляд фото на весь екран ---------- */
function openViewer(pids, index = 0) {
  if (!pids.length) return;
  const el = document.createElement('div');
  el.className = 'viewer';
  el.innerHTML = `<div class="track">${pids.map((p) => `<div class="slide"><img data-pid="${p}" data-kind="full" alt=""></div>`).join('')}</div>
    <div class="vtop"><button class="icon-btn" data-v="close">${icon('x')}</button><span class="badge" id="v-count"></span></div>
    <div class="vbottom" id="v-info"></div>`;
  $('#sheet-root').appendChild(el);
  hydrate(el);
  const track = $('.track', el);
  let cur = index;
  const info = () => {
    const pid = pids[cur];
    const meta = S.photoMeta[pid];
    const e = meta && S.entries.find((x) => x.id === meta.entryId);
    $('#v-count', el).textContent = pids.length > 1 ? `${cur + 1} / ${pids.length}` : '';
    $('#v-info', el).innerHTML = `${meta?.caption ? `<div class="hand" style="color:#fff;font-size:17px;margin-bottom:4px">${esc(meta.caption)}</div>` : ''}
      <div class="row"><span class="small" style="opacity:.8">${e ? D.dmy(D.parse(e.date)) + ', ' + D.time(D.parse(e.date)) : ''}</span><div class="grow"></div>
      ${e ? `<button class="text-btn" data-v="open" data-id="${e.id}">Open entry</button>` : ''}</div>`;
  };
  requestAnimationFrame(() => { track.scrollLeft = index * track.clientWidth; info(); });
  track.addEventListener('scroll', () => {
    const i = Math.round(track.scrollLeft / Math.max(track.clientWidth, 1));
    if (i !== cur && i >= 0 && i < pids.length) { cur = i; info(); }
  }, { passive: true });
  let lastTap = 0;
  el.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-v]');
    if (b?.dataset.v === 'close') { el.remove(); return; }
    if (b?.dataset.v === 'open') { el.remove(); go('/entry/' + b.dataset.id); return; }
    const slide = ev.target.closest('.slide');
    if (slide) {
      const now = Date.now();
      if (now - lastTap < 320) slide.classList.toggle('zoom');
      lastTap = now;
    }
  });
}

/* ==========================================================================
   ГОЛОВНА
   ========================================================================== */
ROUTES[''] = async (v) => {
  const t = theme();
  const days = buildIndex();
  const now = new Date();
  const todayKey = D.key(now);
  const mk = D.monthKey(now);
  const monthEntries = S.entries.filter((e) => e.date.startsWith(mk));
  const monthPhotos = monthEntries.reduce((a, e) => a + (e.photos || []).length, 0);
  const monthDays = new Set(monthEntries.map((e) => e.date.slice(0, 10))).size;
  const today = days[todayKey];
  const todayEmo = today?.main ? Emo.get(today.main) : null;
  const hl = S.highlights[mk];
  const autoPhoto = monthEntries.find((e) => (e.photos || []).length)?.photos[0];
  const weekStart = D.addDays(D.start(now), -D.wd(now));
  const md = todayKey.slice(5);
  const memory = S.entries.find((e) => e.date.slice(5, 10) === md && +e.date.slice(0, 4) < now.getFullYear());
  const recent = allPhotos().slice(0, 12);
  const standalone = window.navigator.standalone || matchMedia('(display-mode: standalone)').matches;
  const needBackup = S.entries.length > 0 && Date.now() - (S.settings.lastBackup || 0) > 7 * 86400000;
  const name = (S.settings.name || '').trim();

  const msgHTML = pickMessageHTML();
  // групи за місяцями
  const groups = [];
  for (const e of S.entries.slice(0, homeLimit)) {
    const k = e.date.slice(0, 7);
    if (!groups.length || groups[groups.length - 1].k !== k) groups.push({ k, items: [] });
    groups[groups.length - 1].items.push(e);
  }

  v.innerHTML = `
  <div class="topbar">
    <button class="icon-btn" data-act="homeMenu" aria-label="Menu">${icon('menu')}</button>
    <div class="grow"></div>
    <button class="icon-btn" data-go="/search" aria-label="Search">${icon('search')}</button>
    <button class="icon-btn" data-go="/settings" aria-label="Settings">${icon('gear')}</button>
  </div>
  <div class="hero">
    ${headerURL ? `<div class="hero-img" style="background-image:url(${headerURL})"></div>` : '<canvas id="hero-canvas"></canvas>'}
    <div class="fade"></div>
    <div class="greet">
      <div class="hello">${D.greeting()}${name ? ', ' + esc(name) : ''} ✦</div>
      <div class="today">${D.long(now)}</div>
      <div class="year">${now.getFullYear()}</div>
    </div>
  </div>
  <div class="stack" style="padding:0 16px">
    ${!standalone ? `<div class="card banner small"><b>Add the journal to your Home Screen</b><br>
      In Safari tap “Share” ⬆︎ → “Add to Home Screen” and open the journal from the icon.
      Entries made here in the browser and in the Home Screen app are stored separately.</div>` : ''}
    ${needBackup ? `<button class="card banner row small" data-go="/settings" style="text-align:left">${icon('download')}
      <span class="grow">It’s been a while since your last backup. Save one so your entries never get lost.</span>${icon('right')}</button>` : ''}
    ${msgHTML}
    ${moodDayCard(todayKey, days, true)}
    <div class="grid2">
      <button class="card tile" data-go="/stats">
        <span class="hand">${cap(MONTHS[now.getMonth()])}</span>
        <span><span class="big-num">${monthEntries.length}</span> <span class="muted small">entries</span></span>
        <span class="muted small">${monthDays} days · ${monthPhotos} photos</span>
        <span class="small" style="color:var(--accent);font-weight:600">${Faces.streak(20)} Streak: ${streak(days)}</span>
      </button>
      <div class="stack" style="gap:12px">
        <div class="card tight">
          <div class="hand small" style="margin-bottom:8px;font-size:14px">This week</div>
          <div class="week">${[0, 1, 2, 3, 4, 5, 6].map((i) => {
            const d = D.addDays(weekStart, i), info = days[D.key(d)], e = info?.main && Emo.get(info.main);
            return `<a data-go="/day/${D.key(d)}">${e ? Emo.badge(e, 18) : '<span class="dot-empty"></span>'}<div class="wd ${D.isToday(d) ? 'today' : ''}">${WD[i]}</div></a>`;
          }).join('')}</div>
        </div>
        <button class="card tight row" data-go="/calendar">${icon('calendar')}<span class="serif grow" style="text-align:left">Mood calendar</span>${icon('right')}</button>
      </div>
    </div>
    <div class="grid2">
      <button class="photo-card" style="height:170px" data-go="/month/${mk}">
        ${hl ? `<img src="${hl.url}" alt="">` : autoPhoto ? `<img data-pid="${autoPhoto}" alt="">` : '<div class="empty">🖼️<br>Photo of the month</div>'}
        <div class="shade"></div>
        <div class="label"><div class="t1">photo of the month</div><div class="t2">${cap(MONTHS[now.getMonth()])}</div></div>
      </button>
      ${homeUpcomingHTML()}
    </div>
    ${memory ? `${sectionTitle('On this day', `${now.getFullYear() - +memory.date.slice(0, 4)} years ago`)}${entryCard(memory, true)}` : ''}
    ${recent.length ? `<div class="row">${sectionTitle('Recent memories')}<div class="grow"></div><button class="text-btn" data-go="/photos">All</button></div>
      <div class="strip">${recent.map((p, i) => `<button class="thumb" data-act="viewRecent" data-i="${i}" style="transform:rotate(${i % 2 ? 2 : -2}deg)"><img data-pid="${p.id}" alt=""></button>`).join('')}</div>` : ''}
    ${S.entries.length ? orn() : ''}
    ${S.entries.length ? groups.map((g) => `
      <div class="month-head"><span class="name">${D.monthTitle(D.fromKey(g.k + '-01'))}</span><span class="badge">${g.items.length}</span></div>
      ${g.items.map((e) => entryCard(e)).join('')}`).join('') + (S.entries.length > homeLimit ? `<button class="btn full" data-act="homeMore">Show more entries (${S.entries.length - homeLimit})</button>` : '') : `
      <div class="card empty-state"><div class="big">📖</div><div class="section-title">Your story starts here</div>
      <div class="muted small">Tap “+” to write your first entry — add thoughts, photos and emotions.</div></div>`}
  </div>
  <div class="bottombar">
    <button class="round" data-go="/calendar" aria-label="Calendar">${icon('calendar')}</button>
    <button class="fab" data-go="/edit/new" aria-label="New entry">${icon('plus')}</button>
    <button class="round" data-go="/planner" aria-label="Planner">${icon('planner')}</button>
  </div>`;

  ACT.viewRecent = (el) => openViewer(recent.map((p) => p.id), +el.dataset.i);
  const canvas = $('#hero-canvas', v);
  const stops = [];
  if (canvas) stops.push(paintScene(canvas, t, S.settings.animate));
  View.stop = () => stops.forEach((f) => f());
};

ACT.homeMenu = () => {
  const now = new Date();
  menuSheet('Menu', [
    { label: 'Archive by year', icon: 'archive', run: () => go('/archive') },
    { label: 'Favorite memories', icon: 'star', run: () => go('/favorites') },
    { label: 'Photos', icon: 'photos', run: () => go('/photos') },
    { label: 'Month summary', icon: 'book', run: () => go('/month/' + D.monthKey(now)) },
    { label: 'Calendar', icon: 'calendar', run: () => go('/calendar') },
    { label: 'Mood stats', icon: 'chart', run: () => go('/stats') },
    { label: 'Planner', icon: 'planner', run: () => go('/planner') },
    { label: 'Themes', icon: 'brush', run: () => go('/themes') },
    { label: 'Import old diary from PDF', icon: 'download', run: () => go('/pdfimport') },
    { label: 'Settings', icon: 'gear', run: () => go('/settings') },
  ]);
};

/* ---------- Емоція дня ---------- */
ACT.dayEmotion = (el) => openDayEmotion(el.dataset.day);

function emotionGrid(list, selected, showOrder) {
  return `<div class="emo-grid">${list.map((e) => {
    const i = selected.indexOf(e.id);
    return `<button class="emo-cell ${i >= 0 ? 'on' : ''}" data-emo="${e.id}">${Emo.badge(e, 50)}
      ${showOrder && i >= 0 ? `<span class="order">${i === 0 ? '★' : i + 1}</span>` : ''}<span class="name">${esc(e.name)}</span></button>`;
  }).join('')}</div>`;
}

/* ---------- Настрій дня: позначки протягом дня та ілюстрація ---------- */
function frequentEmotions(n = 10) {
  const c = {};
  for (const v of Object.values(S.dayMoods)) normDay(v).forEach((id) => (c[id] = (c[id] || 0) + 1));
  for (const e of S.entries) (e.emotions || []).forEach((id) => (c[id] = (c[id] || 0) + 1));
  const top = Object.entries(c).sort((a, b) => b[1] - a[1]).map((x) => x[0]).filter((id) => Emo.get(id));
  const defaults = ['joy', 'calm', 'content', 'tired', 'sad', 'anxiety', 'inspiration', 'anger', 'tenderness', 'thoughtful', 'overwhelmed', 'cozy'];
  return [...new Set([...top, ...defaults])].slice(0, n);
}

function moodDayCard(key, days, withQuick) {
  const info = days[key];
  const res = dayMood(info);
  const isToday = key === D.key(new Date());
  const marks = info?.marks || [];
  const counts = {};
  marks.forEach((id) => (counts[id] = (counts[id] || 0) + 1));
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const m = res && MOODS[res.mood];
  const quick = withQuick ? `<div class="quick-row">${frequentEmotions(12).map((id) => `<button class="quick" data-act="quickMark" data-emo="${id}" data-day="${key}" title="${esc(Emo.get(id).name)}">${Emo.badge(Emo.get(id), 40)}</button>`).join('')}
      <button class="quick more" data-act="dayEmotion" data-day="${key}">${icon('plus', 18)}</button></div>` : '';
  return `<div class="card mood-day">
    <div class="row top">
      <div class="grow"><div class="hand">${isToday ? 'Mood of the day' : 'Mood ' + D.dm(D.fromKey(key))}${isToday && res ? ' · so far' : ''}</div>
        <div class="serif" style="font-size:19px">${m ? `<span ${(S.settings.moodNames || {})[res.mood] ? 'translate="no"' : ''}>${esc(moodHeadline(res.mood))}</span> <button class="text-btn" data-act="renameMood" data-m="${res.mood}" aria-label="Rename" style="padding:0 4px;vertical-align:middle">${icon('pen', 15)}</button>` : (isToday ? 'How are you feeling?' : 'No mood marks')}</div></div>
      <button class="text-btn small" data-act="dayEmotion" data-day="${key}">${marks.length ? 'Change' : 'Mark'}</button>
    </div>
    ${res ? `<div class="row top" style="gap:14px;margin-top:10px">
        <button class="mood-art-wrap" data-act="dayEmotion" data-day="${key}">${moodCardSVG(res.mood, 'm' + key)}</button>
        <div class="grow stack" style="gap:8px">
          ${top.slice(0, 5).map(([id, c]) => `<div class="row small" style="gap:8px">${Emo.badge(Emo.get(id), 26)}<span class="grow">${esc(Emo.get(id).name)}</span><b class="muted">×${c}</b></div>`).join('')}
          ${res.tie ? '<div class="small muted">A tie between emotions — the result follows the day’s average mood.</div>' : ''}
        </div></div>`
      : `<p class="small muted" style="margin:8px 0 0">${isToday ? 'Tap the smileys that match your mood during the day. The journal counts which one you picked most and shows the picture of your day.' : 'No mood was marked on this day.'}</p>`}
    ${quick}
  </div>`;
}

ACT.quickMark = async (el) => {
  const key = el.dataset.day;
  const list = dayEmotions(key);
  const times = (S.dayTimes[key] || []).slice();
  list.push(el.dataset.emo);
  times.push(D.time(new Date()));
  await setDayEmotions(key, list, times);
  toast(`${Emo.get(el.dataset.emo)?.name || ''} — marked ✓`);
  const y = scrollY;
  await render();
  scrollTo(0, y);
};

function openDayEmotion(key, onDone) {
  const date = D.fromKey(key);
  const cur = dayEmotions(key).slice();
  const times = (S.dayTimes[key] || []).slice();
  const build = () => {
    const counts = {};
    cur.forEach((id) => (counts[id] = (counts[id] || 0) + 1));
    const grid = (list) => `<div class="emo-grid">${list.map((e) => `<button class="emo-cell ${counts[e.id] ? 'on' : ''}" data-emo="${e.id}">${Emo.badge(e, 50)}
      ${counts[e.id] ? `<span class="order">${counts[e.id]}</span>` : ''}<span class="name">${esc(e.name)}</span></button>`).join('')}</div>`;
    const fake = { marks: cur.concat(S.entries.filter((e) => e.date.startsWith(key)).flatMap((e) => e.emotions || [])) };
    const res = dayMood(fake);
    return `<p class="muted small" style="margin-top:0">${D.long(date)}. Tap an emotion every time you feel it — you can mark the same one several times. The one you mark most sets the picture of the day.</p>
      ${res ? `<div class="row" style="gap:12px;margin-bottom:12px"><div style="width:96px;flex:none">${moodCardSVG(res.mood, 'sh' + key)}</div><div class="grow"><div class="serif" ${(S.settings.moodNames || {})[res.mood] ? 'translate="no"' : ''}>${esc(moodHeadline(res.mood))}</div>
        <button class="btn" style="margin-top:8px" data-act="renameMood" data-m="${res.mood}">${icon('pen', 16)} Rename this mood</button></div></div>` : ''}
      <button class="btn full" style="margin-bottom:12px" data-go="/emotions">${icon('pen', 16)} Rename emotions</button>
      ${cur.length ? `<div class="small muted">Marks (tap to remove):</div><div class="chips" style="margin:6px 0 12px;flex-wrap:wrap">${cur.map((id, i) => {
        const e = Emo.get(id);
        return e ? `<button class="chip" style="--c:${e.color}" data-rm="${i}">${Emo.badge(e, 22)}${esc(e.name)}${times[i] ? ` <span class="muted">${times[i]}</span>` : ''} ✕</button>` : '';
      }).join('')}</div>` : ''}
      ${CATS.map((c) => `<div class="card" style="margin-bottom:12px"><div class="serif" style="margin-bottom:10px">${c.title}</div>${grid(Emo.inCat(c.id))}</div>`).join('')}
      ${cur.length ? '<button class="btn danger full" data-reset="1">Clear all marks for the day</button>' : ''}`;
  };
  openSheet('Mood of the day', build(), (body, close) => {
    body.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-emo],[data-reset],[data-rm]');
      if (!b) return;
      if (b.dataset.reset) { cur.length = 0; times.length = 0; }
      else if (b.dataset.rm !== undefined) { cur.splice(+b.dataset.rm, 1); times.splice(+b.dataset.rm, 1); }
      else { cur.push(b.dataset.emo); times.push(key === D.key(new Date()) ? D.time(new Date()) : ''); }
      await setDayEmotions(key, cur, times);
      const top = body.parentElement.scrollTop;
      body.innerHTML = build();
      body.parentElement.scrollTop = top;
      if (b.dataset.reset) close();
    });
  }, { onClose: () => { if (onDone) onDone(); else render(); } });
}

/* ---------- Вибір кількох емоцій ---------- */
function openEmotionPicker(selected, onChange, title = 'Emotions', onClose) {
  const build = () => `<p class="muted small" style="margin-top:0">Pick everything you feel — several is fine. The first one (★) is shown most prominently.</p>
    ${CATS.map((c) => `<div class="card" style="margin-bottom:12px"><div class="serif" style="margin-bottom:10px">${c.title}</div>${emotionGrid(Emo.inCat(c.id), selected, true)}</div>`).join('')}
    <button class="btn full" data-add="1">${icon('plus')} Add your own emotion</button>`;
  openSheet(title, build(), (body) => {
    body.addEventListener('click', (e) => {
      if (e.target.closest('[data-add]')) { openEmotionEditor(() => { body.innerHTML = build(); }); return; }
      const b = e.target.closest('[data-emo]');
      if (!b) return;
      const id = b.dataset.emo;
      const i = selected.indexOf(id);
      if (i >= 0) selected.splice(i, 1); else selected.push(id);
      body.innerHTML = build();
      onChange(selected);
    });
  }, { onClose });
}

function openEmotionEditor(onSaved) {
  let face = 'content';
  const html = `<div class="stack">
    <div class="center" id="ee-prev"></div>
    <label class="small muted">Name<input class="text-input" id="ee-name" placeholder="For example, Dreamy"></label>
    <div class="small muted">Face</div>
    <div class="emo-grid" id="ee-faces" style="grid-template-columns:repeat(6,1fr);gap:8px"></div>
    <label class="small muted">Color <input type="color" id="ee-color" value="#C9A95B"></label>
    <label class="small muted">Group<select class="text-input" id="ee-cat">${CATS.map((c) => `<option value="${c.id}">${c.title}</option>`).join('')}</select></label>
    <label class="small muted">Mood level on the chart: <b id="ee-lvl"></b><input type="range" id="ee-score" min="-2" max="2" step="0.1" value="1" style="width:100%"></label>
    <button class="btn solid full" id="ee-save">Save</button></div>`;
  openSheet('New emotion', html, (body, close) => {
    const upd = () => {
      const color = $('#ee-color').value;
      $('#ee-prev').innerHTML = Emo.badge({ id: 'prev', face, color, name: '' }, 72);
      $('#ee-faces').innerHTML = FACE_PRESETS.map((f) => `<button class="emo-cell ${f === face ? 'on' : ''}" data-face="${f}">${Emo.badge({ id: f, face: f, color, name: '' }, 40)}</button>`).join('');
      $('#ee-lvl').textContent = Emo.moodLabel(+$('#ee-score').value);
    };
    body.addEventListener('input', upd);
    body.addEventListener('click', (ev) => { const f = ev.target.closest('[data-face]'); if (f) { face = f.dataset.face; upd(); } });
    upd();
    $('#ee-save').addEventListener('click', async () => {
      const name = $('#ee-name').value.trim();
      if (!name) { toast('Type a name for the emotion'); return; }
      S.settings.customEmotions.push({ id: 'c-' + uid().slice(0, 8), face, emoji: '', name, cat: $('#ee-cat').value, score: +$('#ee-score').value, color: $('#ee-color').value, custom: true });
      await saveSettings();
      close();
      toast('Emotion added');
      onSaved && onSaved();
    });
  }, { doneText: 'Cancel' });
}

/* ==========================================================================
   ПЕРЕГЛЯД ЗАПИСУ
   ========================================================================== */
/* ---------- гортання записів свайпом ---------- */
function entryNeighbors(e) {
  const list = S.entries.filter((x) => !x.hidden || showHidden || x.id === e.id); // від нових до старих
  const i = list.findIndex((x) => x.id === e.id);
  return { older: list[i + 1] || null, newer: i > 0 ? list[i - 1] : null };
}
function entryNavHTML(e) {
  const { older, newer } = entryNeighbors(e);
  if (!older && !newer) return '';
  const lab = (x) => esc(D.dm(D.parse(x.date)) + ' ' + x.date.slice(0, 4));
  return `<div class="row entry-nav" style="gap:10px;margin-top:6px">
    ${older ? `<button class="btn grow" data-act="entryGo" data-id="${older.id}" data-dir="right">${icon('left', 18)} <span class="small">${lab(older)}</span></button>` : '<span class="grow"></span>'}
    ${newer ? `<button class="btn grow" data-act="entryGo" data-id="${newer.id}" data-dir="left"><span class="small">${lab(newer)}</span> ${icon('right', 18)}</button>` : '<span class="grow"></span>'}
  </div>
  <div class="center small muted" style="opacity:.6">Swipe left or right to turn the page</div>`;
}
function entryTurn(id, dir) {
  const page = $('#view .page');
  if (page) { page.style.transition = 'transform .18s ease, opacity .18s ease'; page.style.transform = `translateX(${dir === 'left' ? -40 : 40}px)`; page.style.opacity = '0'; }
  setTimeout(() => { go('/entry/' + id, true); scrollTo(0, 0); }, 160);
}
ACT.entryGo = (el) => entryTurn(el.dataset.id, el.dataset.dir);
(function entrySwipe() {
  let sx = 0, sy = 0, t0 = 0, ok = false;
  document.addEventListener('touchstart', (ev) => {
    ok = location.hash.startsWith('#/entry/') && ev.touches.length === 1 && !ev.target.closest('.viewer,.sheet,.voice,audio,input,textarea,.strip,.chips');
    if (!ok) return;
    sx = ev.touches[0].clientX; sy = ev.touches[0].clientY; t0 = Date.now();
  }, { passive: true });
  document.addEventListener('touchend', (ev) => {
    if (!ok || !location.hash.startsWith('#/entry/')) return;
    const t = ev.changedTouches[0];
    const dx = t.clientX - sx, dy = t.clientY - sy;
    if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 2 || Date.now() - t0 > 800) return;
    if (sx < 24) return; // край екрана — системний жест «назад»
    if (window.getSelection && String(getSelection()).length) return;
    const e = S.entries.find((x) => x.id === location.hash.split('/')[2]);
    if (!e) return;
    const { older, newer } = entryNeighbors(e);
    if (dx < 0 && newer) entryTurn(newer.id, 'left');
    else if (dx > 0 && older) entryTurn(older.id, 'right');
    else toast(dx < 0 ? 'This is the newest entry' : 'This is the oldest entry', 1500);
  }, { passive: true });
})();

ROUTES.entry = async (v, parts) => {
  const e = S.entries.find((x) => x.id === parts[1]);
  if (!e) { go('/', true); return; }
  if (e.locked && !unlockedEntries.has(e.id)) {
    v.innerHTML = `${topbar('')}<div class="page"><div class="card empty-state"><div class="big">🔒</div><div class="serif">Protected entry</div>
      <button class="btn solid" data-act="unlockEntry" data-id="${e.id}">Open with password</button></div></div>`;
    return;
  }
  const d = D.parse(e.date);
  const dayList = dayEmotions(e.date.slice(0, 10)).map(Emo.get).filter(Boolean);
  const dayEmo = dayList[0];
  v.innerHTML = `${topbar('', `<button class="icon-btn" data-act="favEntry" data-id="${e.id}">${icon(e.favorite ? 'starFill' : 'star')}</button>
      <button class="icon-btn" data-go="/edit/${e.id}">${icon('edit')}</button>
      <button class="icon-btn" data-act="entryMore" data-id="${e.id}">${icon('more')}</button>`)}
    <div class="page stack">
      <div><div class="hand" style="font-size:18px">${cap(WEEKDAYS[d.getDay()])}</div>
        <div class="row" style="align-items:baseline"><h1 style="font-size:30px">${D.dm(d)}</h1><span class="muted small">${d.getFullYear()} · ${D.time(d)}</span></div></div>
      ${(e.emotions || []).length ? `<div class="chips">${e.emotions.map(Emo.get).filter(Boolean).map((x) => Emo.chip(x)).join('')}</div>` : ''}
      ${dayEmo ? `<a class="row small muted" data-go="/day/${e.date.slice(0, 10)}">${Emo.stack([...new Set(dayList.map((x) => x.id))], 22, 5)} Mood of the day ›</a>` : ''}
      ${e.title ? `<h2 style="font-size:26px" translate="no">${esc(e.title)}</h2>` : ''}
      ${(e.tags || []).length ? `<div class="chips">${e.tags.map((t) => `<a class="tag" translate="no" data-act="tagSearch" data-tag="${esc(t)}">#${esc(t)}</a>`).join('')}</div>` : ''}
      ${e.hidden || e.locked ? `<div class="small muted">${e.hidden ? '👁 hidden from the feed  ' : ''}${e.locked ? '🔒 password-protected' : ''}</div>` : ''}
      ${orn()}
      <div class="rich" id="entry-body" style="min-height:0">${e.html || ''}</div>
      <div class="center small muted" style="opacity:.7;margin-top:20px">Created ${D.dmy(new Date(e.createdAt))}, ${D.time(new Date(e.createdAt))}</div>
      ${entryNavHTML(e)}
    </div>`;
  const body = $('#entry-body', v);
  await hydrateVoices(body, false);
  $$('[contenteditable]', body).forEach((n) => n.removeAttribute('contenteditable'));
  body.addEventListener('click', (ev) => {
    const fig = ev.target.closest('figure[data-photo]');
    if (!fig) return;
    const ids = $$('figure[data-photo]', body).map((f) => f.dataset.photo);
    openViewer(ids, ids.indexOf(fig.dataset.photo));
  });
};

ACT.favEntry = async (el) => {
  const e = S.entries.find((x) => x.id === el.dataset.id);
  if (!e) return;
  e.favorite = !e.favorite;
  await DB.put('entries', e);
  el.innerHTML = icon(e.favorite ? 'starFill' : 'star');
  toast(e.favorite ? 'Added to favorites ★' : 'Removed from favorites');
};

ACT.entryMore = (el) => {
  const id = el.dataset.id;
  const e = S.entries.find((x) => x.id === id);
  menuSheet('Entry', [
    { label: 'Edit', icon: 'edit', run: () => go('/edit/' + id) },
    { label: e.hidden ? 'Show in feed' : 'Hide from feed', icon: 'eyeOff', run: () => toggleHidden(e) },
    { label: e.locked ? 'Remove password' : 'Protect with password', icon: 'lock', run: () => toggleLocked(e) },
    { label: 'Delete entry', icon: 'trash', danger: true, run: () => deleteEntry(id, true) },
  ]);
};

const unlockedEntries = new Set();
let showHidden = false;

/** Попросити пароль (або спершу створити його) і виконати дію. */
function requirePin(cb, subtitle = 'Enter your password') {
  if (!S.settings.pinHash) { toast('Set a password first'); setupPin(cb); return; }
  pinPad(async (val) => {
    if ((await sha256(val)) !== S.settings.pinHash) return 'Wrong password';
    setTimeout(cb, 50);
    return true;
  }, subtitle, true);
}
async function toggleHidden(e) {
  e.hidden = !e.hidden;
  await DB.put('entries', e);
  toast(e.hidden ? 'Entry hidden from the feed, calendar and search' : 'Entry is visible again');
  render();
}
function toggleLocked(e) {
  requirePin(async () => {
    e.locked = !e.locked;
    if (!e.locked) unlockedEntries.delete(e.id); else unlockedEntries.add(e.id);
    await DB.put('entries', e);
    toast(e.locked ? 'Entry protected with password 🔒' : 'Protection removed');
    render();
  }, e.locked ? 'Password to remove protection' : 'Password to protect the entry');
}
ACT.unlockEntry = (el) => requirePin(() => { unlockedEntries.add(el.dataset.id); render(); }, 'Entry password');
ACT.tagSearch = (el) => { Object.assign(searchState, { q: '', tags: [el.dataset.tag], emotions: [], mood: '', useDates: false, fav: false }); go('/search'); };

async function deleteEntry(id, navigate) {
  if (!confirm('Delete this entry forever? Its photos will be deleted too.')) return false;
  const e = S.entries.find((x) => x.id === id);
  for (const m of Object.values(S.photoMeta)) if (m.entryId === id) await deletePhoto(m.id);
  await DB.del('entries', id);
  S.entries = S.entries.filter((x) => x.id !== id);
  toast('Entry deleted');
  if (navigate) back();
  return !!e;
}

/* ==========================================================================
   РЕДАКТОР
   ========================================================================== */
let savedRange = null;
document.addEventListener('selectionchange', () => {
  const ed = $('#ed-body');
  if (!ed) return;
  const s = getSelection();
  if (s.rangeCount && ed.contains(s.anchorNode)) savedRange = s.getRangeAt(0).cloneRange();
});

function restoreSelection() {
  const ed = $('#ed-body');
  if (!ed) return null;
  ed.focus({ preventScroll: true });
  const s = getSelection();
  if (savedRange && ed.contains(savedRange.startContainer)) {
    s.removeAllRanges();
    s.addRange(savedRange);
  }
  return s;
}

ROUTES.edit = async (v, parts, q) => {
  let e;
  let isNew = false;
  if (parts[1] === 'new') {
    isNew = true;
    const now = new Date();
    let d = now;
    if (q.get('day')) { const dd = D.fromKey(q.get('day')); d = new Date(dd.getFullYear(), dd.getMonth(), dd.getDate(), now.getHours(), now.getMinutes()); }
    e = { id: uid(), date: D.local(d), createdAt: Date.now(), updatedAt: Date.now(), title: '', html: '', text: '', emotions: [], favorite: false, photos: [], search: '' };
  } else {
    e = S.entries.find((x) => x.id === parts[1]);
    if (!e) { go('/', true); return; }
  }
  savedRange = null;
  const t = theme();
  const dayEmoHTML = () => {
    const list = dayEmotions(e.date.slice(0, 10));
    return list.length ? `${Emo.stack([...new Set(list)], 22, 3)} Mood of the day` : `☀︎ Mood of the day`;
  };

  v.innerHTML = `
  <div class="topbar solid">
    <button class="icon-btn" data-act="edDone" aria-label="Done">${icon('check')}</button>
    <div class="title">${isNew ? 'New entry' : 'Editing'}<div class="saved" id="ed-saved"></div></div>
    <button class="icon-btn" id="ed-fav">${icon(e.favorite ? 'starFill' : 'star')}</button>
    <button class="icon-btn" id="ed-more">${icon('more')}</button>
  </div>
  <div class="editor-page editing">
    <div class="row">
      <input type="datetime-local" class="date-input" id="ed-date" value="${e.date}">
      <div class="grow"></div>
      <button class="dashed" id="ed-dayemo">${dayEmoHTML()}</button>
    </div>
    <div class="chips" id="ed-emos" style="margin:12px 0 6px"></div>
    <div class="chips" id="ed-tags" style="margin:0 0 6px;flex-wrap:wrap"></div>
    <textarea class="title-input" id="ed-title" rows="1" placeholder="Title">${esc(e.title)}</textarea>
    ${orn()}
    <div class="rich" id="ed-body" contenteditable="true" data-placeholder="What happened today?…">${e.html || ''}</div>
  </div>
  <div class="toolbar" id="ed-tools">
    <button class="tool" data-cmd="size" aria-label="Size">${icon('textSize')}</button>
    <button class="tool" data-cmd="bold" aria-label="Bold"><b>B</b></button>
    <button class="tool" data-cmd="italic" aria-label="Italic"><i>I</i></button>
    <button class="tool" data-cmd="underline" aria-label="Underline"><u>U</u></button>
    <button class="tool" data-cmd="color" aria-label="Color">${icon('palette')}</button>
    <button class="tool" data-cmd="font" aria-label="Font"><span style="font-family:Kalnia,Prata,serif;font-size:17px">Aa</span></button>
    <button class="tool" data-cmd="ul" aria-label="List">${icon('list')}</button>
    <button class="tool" data-cmd="ol" aria-label="Numbered list">${icon('listNum')}</button>
    <span class="tool sep"></span>
    <button class="tool" data-cmd="photo" aria-label="Photo">${icon('image')}</button>
    <button class="tool" data-cmd="voice" aria-label="Voice note">${icon('mic')}</button>
    <button class="tool" data-cmd="draw" aria-label="Drawing">${icon('pen')}</button>
    <button class="tool" data-cmd="quote" aria-label="Quote">${icon('quote')}</button>
    <button class="tool" data-cmd="divider" aria-label="Divider">${icon('sparkle')}</button>
    <button class="tool" data-cmd="emotions" aria-label="Emotions">${icon('smile')}</button>
    <button class="tool" data-cmd="hide" aria-label="Hide keyboard">${icon('keyboard')}</button>
  </div>
  <input type="file" id="ed-file" accept="image/*" multiple hidden>`;

  const ed = $('#ed-body', v);
  const title = $('#ed-title', v);
  try { document.execCommand('defaultParagraphSeparator', false, 'p'); } catch (_) { /* ok */ }
  if (!ed.innerHTML.trim()) ed.innerHTML = '<p><br></p>';
  // голий текст на початку обгортаємо в абзац
  ed.addEventListener('input', () => {
    const n = ed.firstChild;
    if (n && n.nodeType === 3 && n.textContent.trim()) {
      const sel = getSelection();
      const atNode = sel.anchorNode === n ? sel.anchorOffset : -1;
      const p = document.createElement('p');
      n.replaceWith(p); p.appendChild(n);
      if (atNode >= 0) { const r = document.createRange(); r.setStart(n, atNode); r.collapse(true); sel.removeAllRanges(); sel.addRange(r); }
    }
  });
  const dateIn = $('#ed-date', v);
  const tools = $('#ed-tools', v);
  hydrate(ed);
  $$('figure[data-photo]', ed).forEach((f) => { f.contentEditable = 'false'; const c = $('figcaption', f); if (c) c.contentEditable = 'true'; });

  const autoGrow = () => { title.style.height = 'auto'; title.style.height = title.scrollHeight + 'px'; };
  autoGrow();
  const updateEmpty = () => ed.classList.toggle('is-empty', !ed.textContent.trim() && !ed.querySelector('figure,.divider,img,li'));
  updateEmpty();

  const renderEmos = () => {
    $('#ed-emos').innerHTML = (e.emotions || []).map(Emo.get).filter(Boolean).map((x, i) => Emo.chip(x, i === 0 && e.emotions.length > 1)).join('')
      + `<button class="dashed" id="ed-addemo">${icon('smile', 16)} ${e.emotions.length ? 'More' : 'How are you feeling?'}</button>`;
  };
  renderEmos();
  e.tags = e.tags || [];
  const renderTags = () => {
    const all = [...new Set(S.entries.flatMap((x) => x.tags || []))].filter((t) => !e.tags.includes(t)).slice(0, 8);
    $('#ed-tags').innerHTML = e.tags.map((t, i) => `<button class="tag on" data-rmtag="${i}">#${esc(t)} ✕</button>`).join('')
      + `<input class="tag-input" id="ed-tagin" placeholder="${e.tags.length ? '+ tag' : '+ tag (e.g. art)'}" list="tag-list"><datalist id="tag-list">${all.map((t) => `<option value="${esc(t)}">`).join('')}</datalist>`;
  };
  renderTags();
  const addTag = (raw) => {
    const t = raw.replace(/^#/, '').trim().toLowerCase();
    if (t && !e.tags.includes(t)) { e.tags.push(t); schedule(); }
    renderTags();
    setTimeout(() => $('#ed-tagin')?.focus(), 30);
  };
  $('#ed-tags').addEventListener('click', (ev) => { const b = ev.target.closest('[data-rmtag]'); if (b) { e.tags.splice(+b.dataset.rmtag, 1); renderTags(); schedule(); } });
  $('#ed-tags').addEventListener('keydown', (ev) => { if (ev.target.id === 'ed-tagin' && (ev.key === 'Enter' || ev.key === ',')) { ev.preventDefault(); addTag(ev.target.value); } });
  $('#ed-tags').addEventListener('change', (ev) => { if (ev.target.id === 'ed-tagin' && ev.target.value.trim()) addTag(ev.target.value); });
  hydrateVoices(ed, true);
  const pickEmotions = () => openEmotionPicker(e.emotions, () => { renderEmos(); schedule(); });
  $('#ed-emos').addEventListener('click', pickEmotions);
  $('#ed-dayemo').addEventListener('click', () => openDayEmotion(e.date.slice(0, 10), () => { $('#ed-dayemo').innerHTML = dayEmoHTML(); }));

  // ---- збереження ----
  let timer = 0;
  let stored = !isNew;
  const hasContent = () => !!(e.title.trim() || e.text.trim() || (e.photos || []).length || (e.voices || []).length || (e.emotions || []).length);
  const cleanHTML = () => {
    const c = ed.cloneNode(true);
    $$('img', c).forEach((i) => { i.removeAttribute('src'); i.removeAttribute('data-done'); });
    $$('figure', c).forEach((f) => f.classList.remove('selected'));
    $$('.voice', c).forEach((n) => { n.innerHTML = ''; });
    return c.innerHTML.trim();
  };
  const save = async () => {
    clearTimeout(timer);
    e.title = title.value.trim();
    if (dateIn.value) e.date = dateIn.value.slice(0, 16);
    e.html = cleanHTML();
    for (const f of $$('figure[data-photo]', ed)) {
      const m = S.photoMeta[f.dataset.photo];
      const capTxt = ($('figcaption', f)?.textContent || '').trim();
      if (m && m.caption !== capTxt) { m.caption = capTxt; await DB.put('photoMeta', m); }
    }
    refreshEntry(e);
    if (!hasContent()) return;
    await DB.put('entries', e);
    if (!stored) { S.entries.push(e); stored = true; navigator.storage?.persist?.(); }
    sortEntries();
    const s = $('#ed-saved');
    if (s) s.textContent = 'saved ✓';
  };
  const schedule = () => {
    updateEmpty();
    const s = $('#ed-saved');
    if (s) s.textContent = '…';
    clearTimeout(timer);
    timer = setTimeout(save, 700);
  };
  ed.addEventListener('input', schedule);
  title.addEventListener('input', () => { autoGrow(); schedule(); });
  dateIn.addEventListener('change', () => { schedule(); $('#ed-dayemo').innerHTML = dayEmoHTML(); });

  View.leave = async () => {
    await save();
    const ids = new Set(e.photos || []);
    for (const m of Object.values(S.photoMeta)) if (m.entryId === e.id && !ids.has(m.id)) await deletePhoto(m.id);
    const vids = new Set(e.voices || []);
    for (const vr of await DB.all('voices')) if (vr.entryId === e.id && !vids.has(vr.id)) await DB.del('voices', vr.id);
    if (stored && !hasContent()) {
      await DB.del('entries', e.id);
      S.entries = S.entries.filter((x) => x.id !== e.id);
    }
    window.visualViewport?.removeEventListener('resize', place);
    window.visualViewport?.removeEventListener('scroll', place);
  };
  ACT.edDone = () => back();

  $('#ed-fav').addEventListener('click', () => { e.favorite = !e.favorite; $('#ed-fav').innerHTML = icon(e.favorite ? 'starFill' : 'star'); schedule(); });
  $('#ed-more').addEventListener('click', () => menuSheet('Entry', [
    { label: 'Delete entry', icon: 'trash', danger: true, run: async () => {
      if (!confirm('Delete this entry forever?')) return;
      View.leave = null;
      for (const m of Object.values(S.photoMeta)) if (m.entryId === e.id) await deletePhoto(m.id);
      await DB.del('entries', e.id);
      S.entries = S.entries.filter((x) => x.id !== e.id);
      toast('Entry deleted');
      go('/', true);
    } },
  ]));

  // ---- панель над клавіатурою ----
  const place = () => {
    const vv = window.visualViewport;
    if (!vv) return;
    const kb = Math.max(0, window.innerHeight - (vv.height + vv.offsetTop));
    tools.style.bottom = kb > 50 ? `${kb + 6}px` : '';
  };
  window.visualViewport?.addEventListener('resize', place);
  window.visualViewport?.addEventListener('scroll', place);

  // ---- вставка блоків у місце курсора ----
  const ensureTail = () => {
    const last = ed.lastElementChild;
    if (!last || last.matches('figure,.divider,.voice,blockquote,ul,ol')) ed.insertAdjacentHTML('beforeend', '<p><br></p>');
  };
  const caretTo = (node) => {
    if (!node) return;
    const r = document.createRange();
    r.setStart(node, 0);
    r.collapse(true);
    const s = getSelection();
    s.removeAllRanges(); s.addRange(r);
    savedRange = r.cloneRange();
  };
  const insertBlock = (node) => {
    const range = savedRange && ed.contains(savedRange.startContainer) ? savedRange : null;
    if (!range) {
      ed.appendChild(node);
    } else {
      let blk = range.startContainer;
      if (blk === ed) {
        ed.insertBefore(node, ed.childNodes[range.startOffset] || null);
      } else {
        while (blk.parentNode !== ed) blk = blk.parentNode;
        if (blk.nodeType === 1 && blk.matches('figure,.divider,.voice')) {
          blk.after(node);
          ensureTail();
          caretTo(node.nextSibling || node);
          updateEmpty();
          return;
        }
        const tail = document.createRange();
        tail.setStart(range.startContainer, range.startOffset);
        if (blk.nodeType === 3) tail.setEnd(blk, blk.length); else tail.setEnd(blk, blk.childNodes.length);
        const frag = tail.extractContents();
        const tmp = document.createElement('div');
        tmp.appendChild(frag.cloneNode(true));
        const hasTail = tmp.textContent.trim() || tmp.querySelector('img,figure');
        blk.after(node);
        if (hasTail) {
          const nb = blk.nodeType === 1 ? document.createElement(blk.tagName === 'LI' ? 'P' : blk.tagName) : document.createElement('p');
          nb.appendChild(frag);
          node.after(nb);
        }
        const blkEmpty = blk.nodeType === 3 ? !blk.textContent.trim() : !blk.textContent.trim() && !blk.querySelector?.('img,figure');
        if (blkEmpty && blk.nodeType === 1 && !blk.matches('ul,ol,blockquote')) blk.remove();
      }
    }
    ensureTail();
    let next = node.nextSibling;
    while (next && next.nodeType === 1 && next.matches('figure,.divider,.voice')) next = next.nextSibling;
    caretTo(next || node);
    updateEmpty();
  };

  const figure = (pid) => {
    const f = document.createElement('figure');
    f.className = 'sz-l al-center';
    f.dataset.photo = pid;
    f.contentEditable = 'false';
    f.innerHTML = `<img data-pid="${pid}" data-kind="full" alt=""><figcaption contenteditable="true"></figcaption>`;
    return f;
  };

  const fileIn = $('#ed-file', v);
  fileIn.addEventListener('change', async () => {
    const files = Array.from(fileIn.files || []);
    fileIn.value = '';
    if (!files.length) return;
    toast(files.length > 1 ? `Adding ${files.length} photos…` : 'Adding photo…', 4000);
    for (const f of files) {
      try {
        const pid = await savePhoto(e.id, f);
        const fig = figure(pid);
        if (files.length > 1) fig.className = 'sz-m al-center';
        insertBlock(fig);
        hydrate(fig);
      } catch (err) {
        console.error(err);
        toast('Couldn’t add one of the photos');
      }
    }
    await save();
    toast('Photo added 📷');
  });

  // ---- форматування ----
  const exec = (cmd, val) => { restoreSelection(); document.execCommand(cmd, false, val); schedule(); };
  let sizeClass = '';
  const convertFonts = () => {
    $$('font[size="7"]', ed).forEach((fnt) => {
      const sp = document.createElement('span');
      if (sizeClass) sp.className = sizeClass;
      while (fnt.firstChild) sp.appendChild(fnt.firstChild);
      fnt.replaceWith(sp);
    });
  };
  ed.addEventListener('input', convertFonts);
  const applySize = (cls) => {
    sizeClass = cls;
    restoreSelection();
    document.execCommand('styleWithCSS', false, false);
    document.execCommand('fontSize', false, '7');
    convertFonts();
    schedule();
  };
  const applyColor = (hex) => {
    restoreSelection();
    document.execCommand('styleWithCSS', false, true);
    document.execCommand('foreColor', false, hex || '#010203');
    if (!hex) {
      $$('[style]', ed).forEach((n) => { if (/rgb\(1,\s*2,\s*3\)|#010203/i.test(n.getAttribute('style'))) n.style.color = ''; });
      $$('font[color]', ed).forEach((n) => { if (n.getAttribute('color').toLowerCase() === '#010203') n.removeAttribute('color'); });
    }
    schedule();
  };
  const applyFont = (stack) => {
    restoreSelection();
    document.execCommand('styleWithCSS', false, true);
    document.execCommand('fontName', false, stack || 'inherit');
    if (!stack) $$('[style]', ed).forEach((n) => { if (/font-family:\s*inherit/i.test(n.getAttribute('style'))) n.style.fontFamily = ''; });
    $$('font[face]', ed).forEach((n) => { const sp = document.createElement('span'); if (stack) sp.style.fontFamily = n.getAttribute('face'); while (n.firstChild) sp.appendChild(n.firstChild); n.replaceWith(sp); });
    schedule();
  };
  const insideQuote = () => { const s = getSelection(); return s.rangeCount && s.anchorNode && (s.anchorNode.nodeType === 1 ? s.anchorNode : s.anchorNode.parentElement)?.closest('blockquote'); };

  const runCmd = (cmd) => {
    switch (cmd) {
      case 'bold': case 'italic': case 'underline': exec(cmd); break;
      case 'ul': exec('insertUnorderedList'); break;
      case 'ol': exec('insertOrderedList'); break;
      case 'quote': restoreSelection(); exec('formatBlock', insideQuote() ? 'p' : 'blockquote'); break;
      case 'size': menuSheet('Text size', [
        { label: 'Small', run: () => applySize('sz-s') },
        { label: 'Normal', run: () => applySize('') },
        { label: 'Larger', run: () => applySize('sz-l') },
        { label: 'Title', run: () => applySize('sz-xl') },
      ]); break;
      case 'font': menuSheet('Text font', [{ label: 'Default font', run: () => applyFont('') }, ...FONTS.map(([id, n, stack]) => ({ label: n, run: () => applyFont(stack) }))]);
        setTimeout(() => { $$('.sheet .menu-list button span').forEach((sp, i) => { if (i > 0 && FONTS[i - 1]) sp.style.fontFamily = FONTS[i - 1][2]; sp.style.fontSize = '18px'; }); }, 0); break;
      case 'color': menuSheet('Text color', TEXT_COLORS.map(([n, hex]) => ({
        label: (hex ? '● ' : '○ ') + n, run: () => applyColor(hex),
      }))); setTimeout(() => {
        $$('.sheet .menu-list button span').forEach((sp, i) => { const hx = TEXT_COLORS[i]?.[1]; if (hx) sp.style.color = hx; });
      }, 0); break;
      case 'divider': {
        const div = document.createElement('div');
        div.className = 'divider';
        div.contentEditable = 'false';
        div.dataset.orn = theme().orn;
        insertBlock(div);
        schedule();
        break;
      }
      case 'photo': fileIn.click(); break;
      case 'voice': openRecorder(e.id, (vid) => {
        const box = document.createElement('div');
        box.className = 'voice'; box.contentEditable = 'false'; box.dataset.voice = vid;
        insertBlock(box); hydrateVoices(ed, true); save(); toast('Voice note added 🎙');
      }); break;
      case 'draw': openDrawing(async (blob) => {
        try {
          const pid = await savePhoto(e.id, blob);
          S.photoMeta[pid].drawing = true; await DB.put('photoMeta', S.photoMeta[pid]);
          const fig = figure(pid); fig.classList.add('drawing');
          insertBlock(fig); hydrate(fig); await save(); toast('Drawing added 🎨');
        } catch (err) { console.error(err); toast('Couldn’t save the drawing'); }
      }); break;
      case 'emotions': pickEmotions(); break;
      case 'hide': ed.blur(); title.blur(); document.activeElement?.blur?.(); break;
    }
  };
  tools.addEventListener('pointerdown', (ev) => { if (ev.target.closest('[data-cmd]')) ev.preventDefault(); });
  tools.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-cmd]');
    if (b) { ev.preventDefault(); runCmd(b.dataset.cmd); }
  });

  // ---- дії з фото та розділювачами в тексті ----
  ed.addEventListener('click', (ev) => {
    const vm = ev.target.closest('[data-vmore]');
    if (vm) { ev.preventDefault(); voiceMenu(vm.dataset.vmore, vm.closest('.voice'), schedule); return; }
    if (ev.target.closest('.voice')) return;
    const div = ev.target.closest('.divider');
    if (div) {
      menuSheet('Divider', [
        ...DIVIDERS.map((dv) => ({ label: dv === 'theme' ? theme().orn + '  (theme default)' : dv, run: () => { div.dataset.orn = dv === 'theme' ? theme().orn : dv; schedule(); } })),
        { label: 'Delete', icon: 'trash', danger: true, run: () => { div.remove(); schedule(); } },
      ]);
      return;
    }
    const fig = ev.target.closest('figure[data-photo]');
    if (!fig || ev.target.closest('figcaption')) return;
    const pid = fig.dataset.photo;
    const setCls = (re, cls) => { fig.className = fig.className.replace(re, '').trim() + ' ' + cls; schedule(); };
    menuSheet('Photo', [
      { label: 'View', icon: 'image', run: () => openViewer([pid]) },
      { label: 'Small', run: () => setCls(/sz-\w/g, 'sz-s') },
      { label: 'Medium', run: () => setCls(/sz-\w/g, 'sz-m') },
      { label: 'Large', run: () => setCls(/sz-\w/g, 'sz-l') },
      { label: 'Full width', run: () => setCls(/sz-\w/g, 'sz-f') },
      { label: 'Left', run: () => setCls(/al-\w+/g, 'al-left') },
      { label: 'Center', run: () => setCls(/al-\w+/g, 'al-center') },
      { label: 'Right', run: () => setCls(/al-\w+/g, 'al-right') },
      { label: 'Move up', icon: 'up', run: () => { const p = fig.previousElementSibling; if (p) { p.before(fig); schedule(); } } },
      { label: 'Move down', icon: 'down', run: () => { const n = fig.nextElementSibling; if (n) { n.after(fig); schedule(); } } },
      { label: 'Make photo of the month', icon: 'calendar', run: async () => { await setHighlight(e.date.slice(0, 7), await photoBlob(pid)); toast('Photo of the month saved ✨'); } },
      { label: 'Make photo of the year', icon: 'sparkle', run: async () => { await setHighlight(e.date.slice(0, 4), await photoBlob(pid)); toast('Photo of the year saved ✨'); } },
      { label: 'Delete photo', icon: 'trash', danger: true, run: () => { fig.remove(); ensureTail(); schedule(); } },
    ]);
  });
  // підпис фото: Enter не створює нових рядків
  ed.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter' && ev.target.closest && document.activeElement?.closest?.('figcaption')) ev.preventDefault();
  });

  if (isNew) setTimeout(() => ed.focus(), 300);
};

/* ==========================================================================
   КАЛЕНДАР і ДЕНЬ
   ========================================================================== */
function monthGrid(month, days, selKey, compact) {
  const first = D.monthStart(month);
  const blanks = D.wd(first);
  const n = D.daysIn(first);
  let h = `<div class="cal-grid ${compact ? 'compact' : ''}">${WD.map((w) => `<div class="cal-wd">${w}</div>`).join('')}`;
  for (let i = 0; i < blanks; i++) h += '<div></div>';
  for (let i = 1; i <= n; i++) {
    const d = new Date(first.getFullYear(), first.getMonth(), i);
    const k = D.key(d);
    const info = days[k];
    const main = info?.main && Emo.get(info.main);
    const others = (info?.all || []).slice(1, 4).map(Emo.get).filter(Boolean);
    const size = compact ? 18 : 26;
    const bg = main ? `background:${hexToRgba(main.color, 0.16)}` : '';
    h += `<button class="cal-day ${D.isToday(d) ? 'today' : ''} ${selKey === k ? 'sel' : ''}" data-day="${k}" style="${bg}">
      <span class="n">${i}</span>
      ${main ? Emo.badge(main, size) : `<span class="dot-empty" style="--s:${size}px;${info?.entries.length ? 'opacity:2' : ''}">${info?.entries.length ? '<small style="font-size:9px;opacity:.7">✎</small>' : ''}</span>`}
      ${compact ? '' : `<span class="dots">${others.map((o) => `<i style="background:${o.color}"></i>`).join('')}${info?.photos ? '📷' : ''}</span>`}
    </button>`;
  }
  return h + '</div>';
}

function dayPanel(key, days) {
  const d = D.fromKey(key);
  const info = days[key];
  return `${moodDayCard(key, days, key === D.key(new Date()))}
  <div class="card stack">
    <div class="serif" style="font-size:19px">${D.long(d)}</div>
    ${info?.entries.length ? info.entries.map((e) => entryCard(e, true)).join('') : '<div class="muted small">No entries on this day.</div>'}
    <button class="btn full" data-go="/edit/new?day=${key}">${icon('plus')} New entry for this day</button>
  </div>`;
}

/** Настрій місяця: настрій, який найчастіше був настроєм дня за цей місяць. */
function monthMood(month, days) {
  const mk = D.monthKey(month);
  const list = Object.values(days).filter((d) => d.key.startsWith(mk) && d.marks.length);
  if (!list.length) return null;
  const votes = {}, emo = {};
  for (const d of list) {
    const r = dayMood(d);
    if (r) votes[r.mood] = (votes[r.mood] || 0) + 1;
    d.marks.forEach((id) => (emo[id] = (emo[id] || 0) + 1));
  }
  const max = Math.max(...Object.values(votes));
  const top = Object.keys(votes).filter((m) => votes[m] === max);
  const mood = top.length === 1 ? top[0] : (dayMood({ marks: list.flatMap((d) => d.marks) }) || { mood: top[0] }).mood;
  return { mood, days: list.length, moodDays: votes[mood] || 0, emo: Object.entries(emo).sort((a, b) => b[1] - a[1]) };
}

function monthMoodCard(month, days) {
  const r = monthMood(month, days);
  const title = `Mood of ${cap(MONTHS[month.getMonth()])}`;
  if (!r) return `<div class="card"><div class="hand">${title}</div><p class="small muted" style="margin:6px 0 0">No mood marks this month yet.</p></div>`;
  const own = (S.settings.moodNames || {})[r.mood];
  return `<div class="card mood-day">
    <div class="row top"><div class="grow"><div class="hand">${title}</div>
      <div class="serif" style="font-size:19px"><span ${own ? 'translate="no"' : ''}>${esc(moodHeadline(r.mood))}</span> <button class="text-btn" data-act="renameMood" data-m="${r.mood}" aria-label="Rename" style="padding:0 4px;vertical-align:middle">${icon('pen', 15)}</button></div></div></div>
    <div class="row top" style="gap:14px;margin-top:10px">
      <div class="mood-art-wrap">${moodCardSVG(r.mood, 'mm' + D.monthKey(month))}</div>
      <div class="grow stack" style="gap:8px">
        ${r.emo.slice(0, 5).map(([id, c]) => Emo.get(id) ? `<div class="row small" style="gap:8px">${Emo.badge(Emo.get(id), 26)}<span class="grow">${esc(Emo.get(id).name)}</span><b class="muted">×${c}</b></div>` : '').join('')}
        <div class="small muted">${r.moodDays} of ${r.days} days</div>
      </div></div>
  </div>`;
}

ROUTES.calendar = async (v, parts, q) => {
  const days = buildIndex();
  const month = q.get('m') ? D.fromKey(q.get('m') + '-01') : D.monthStart(new Date());
  const sel = q.get('d') || (D.monthKey(month) === D.monthKey(new Date()) ? D.key(new Date()) : D.key(month));
  const mk = D.monthKey(month);
  const nav = (m, d) => go(`/calendar?m=${m}&d=${d || ''}`, true);
  v.innerHTML = `${topbar('Calendar', `<button class="icon-btn" data-go="/edit/new?day=${sel}">${icon('edit')}</button>`)}
  <div class="page stack">
    <div class="card stack" id="cal-card">
      <div class="cal-head">
        <button class="icon-btn" data-act="calPrev">${icon('left')}</button>
        <button data-act="calPick"><div class="m">${cap(MONTHS[month.getMonth()])}</div><div class="y">${month.getFullYear()}</div></button>
        <button class="icon-btn" data-act="calNext">${icon('right')}</button>
      </div>
      ${monthGrid(month, days, sel)}
      <div class="legend"><span>📷 photos</span><span><span class="dot-empty" style="--s:10px;vertical-align:middle"></span> no data</span><span><i style="display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--accent)"></i> other emotions</span>
      ${mk !== D.monthKey(new Date()) ? '<button class="text-btn small" data-act="calToday" style="padding:0">Today</button>' : ''}</div>
    </div>
    ${monthMoodCard(month, days)}
    ${dayPanel(sel, days)}
    <button class="card tight row" data-go="/month/${mk}">${icon('book')}<span class="serif grow" style="text-align:left">Summary: ${D.monthTitle(month)}</span>${icon('right')}</button>
  </div>`;
  ACT.calPrev = () => nav(D.monthKey(D.addMonths(month, -1)));
  ACT.calNext = () => nav(D.monthKey(D.addMonths(month, 1)));
  ACT.calToday = () => nav(D.monthKey(new Date()), D.key(new Date()));
  ACT.calPick = () => {
    const y = month.getFullYear();
    const years = [y + 1, y, y - 1, y - 2, y - 3, y - 4, y - 5];
    openSheet('Choose a month', `<div class="seg" id="yp">${years.map((yy) => `<button data-y="${yy}" class="${yy === y ? 'on' : ''}">${yy}</button>`).join('')}</div>
      <div class="grid3" style="margin-top:14px" id="mp">${MONTHS.map((m, i) => `<button class="pill" data-m="${i}">${cap(m)}</button>`).join('')}</div>`, (body, close) => {
      let yy = y;
      body.addEventListener('click', (ev) => {
        const yb = ev.target.closest('[data-y]');
        if (yb) { yy = +yb.dataset.y; $$('[data-y]', body).forEach((b) => b.classList.toggle('on', b === yb)); return; }
        const mb = ev.target.closest('[data-m]');
        if (mb) { close(); nav(`${yy}-${pad(+mb.dataset.m + 1)}`); }
      });
    });
  };
  const card = $('#cal-card', v);
  card.addEventListener('click', (ev) => {
    const b = ev.target.closest('.cal-day');
    if (b) nav(mk, b.dataset.day);
  });
  let sx = 0;
  card.addEventListener('touchstart', (ev) => { sx = ev.touches[0].clientX; }, { passive: true });
  card.addEventListener('touchend', (ev) => {
    const dx = ev.changedTouches[0].clientX - sx;
    if (dx < -60) ACT.calNext(); else if (dx > 60) ACT.calPrev();
  });
};

ROUTES.day = async (v, parts) => {
  const key = parts[1];
  const days = buildIndex();
  v.innerHTML = `${topbar(D.dmy(D.fromKey(key)))}<div class="page">${dayPanel(key, days)}</div>`;
};

/* ==========================================================================
   СТАТИСТИКА
   ========================================================================== */
const statState = { p: 'd30', anchor: new Date(), sel: null, allEmo: false, donutEmo: false };

function smoothPath(pts) {
  if (pts.length < 2) return '';
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}

function lineChart(st) {
  const t = theme();
  const W = 340, H = 210, L = 28, R = 10, T = 10, B = 26, iw = W - L - R, ih = H - T - B;
  const n = Math.max(st.bucketCount - 1, 1);
  const X = (i) => L + iw * (i / n);
  const Y = (s) => T + ih * (1 - (s + 2.3) / 4.6);
  const segs = {};
  st.points.forEach((p) => (segs[p.seg] = segs[p.seg] || []).push(p));
  const labels = { 2: 'elation', 1: 'content', 0: 'thoughtful', '-1': 'disappointed', '-2': 'grief' };
  let svg = `<svg viewBox="0 0 ${W} ${H}"><defs><linearGradient id="mg" gradientUnits="userSpaceOnUse" x1="0" y1="${Y(-2.3)}" x2="0" y2="${Y(2.3)}">
    <stop offset="0" stop-color="#6F86AE"/><stop offset=".5" stop-color="#9A97A8"/><stop offset="1" stop-color="${t.accent}"/></linearGradient></defs>`;
  for (const v of [-2, -1, 0, 1, 2]) {
    svg += `<line x1="${L}" x2="${W - R}" y1="${Y(v)}" y2="${Y(v)}" stroke="${t.border}" stroke-opacity=".45" stroke-dasharray="${v === 0 ? '' : '3 4'}"/>`;
    svg += Faces.nested(Emo.get(labels[v]), 2, Y(v) - 9, 18);
  }
  for (const pts of Object.values(segs)) {
    if (pts.length > 1) svg += `<path d="${smoothPath(pts.map((p) => [X(p.i), Y(p.score)]))}" fill="none" stroke="url(#mg)" stroke-width="3" stroke-linecap="round"/>`;
  }
  const big = st.points.length <= 60;
  for (const p of st.points) {
    const c = Emo.get(p.main)?.color || t.accent;
    const on = statState.sel === p.key;
    svg += `<circle cx="${X(p.i)}" cy="${Y(p.score)}" r="${on ? 7 : big ? 4.5 : 2.5}" fill="${c}" stroke="${on ? t.text : t.bgTop}" stroke-width="${on ? 2 : 1}"/>`;
    svg += `<circle cx="${X(p.i)}" cy="${Y(p.score)}" r="12" fill="transparent" data-act="statPoint" data-key="${p.key}"/>`;
  }
  const fmt = (d) => st.bucket === 'month' ? `${MONTHS_SHORT[d.getMonth()]} ${String(d.getFullYear()).slice(2)}` : `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
  svg += `<text x="${L}" y="${H - 6}" font-size="10" fill="${t.subc}">${fmt(st.start)}</text>`;
  svg += `<text x="${W - R}" y="${H - 6}" font-size="10" fill="${t.subc}" text-anchor="end">${fmt(st.end > new Date() ? new Date() : st.end)}</text>`;
  return svg + '</svg>';
}

function donut(slices) {
  const total = slices.reduce((a, s) => a + s.count, 0) || 1;
  const R = 52, C = 2 * Math.PI * R;
  let off = 0;
  const arcs = slices.map((s) => {
    const len = (C * s.count) / total;
    const a = `<circle r="${R}" cx="70" cy="70" fill="none" stroke="${s.color}" stroke-width="22" stroke-dasharray="${Math.max(len - 2, 0.5)} ${C}" stroke-dashoffset="${-off}" transform="rotate(-90 70 70)"/>`;
    off += len;
    return a;
  }).join('');
  return `<svg viewBox="0 0 140 140" style="width:140px;height:140px;flex:none">${arcs}
    <text x="70" y="70" text-anchor="middle" font-size="20" font-weight="700" fill="var(--text)" font-family="Georgia,serif">${total}</text>
    <text x="70" y="86" text-anchor="middle" font-size="9" fill="var(--sub)">marks</text></svg>`;
}

const pct = (v, t) => (t ? Math.round((v / t) * 100) : 0) + '%';

ROUTES.stats = async (v) => {
  const t = theme();
  const days = buildIndex();
  const [start, end] = periodRange(statState.p, statState.anchor);
  const st = computeStats(days, start, end);
  const pn = D.between(start, end) + 1;
  const prev = computeStats(days, D.addDays(start, -pn), D.addDays(start, -1));
  const today = D.start(new Date());

  // календар настрою
  const pStart = D.addDays(start, -D.wd(start));
  const weeks = Math.max(1, Math.ceil((D.between(pStart, end) + 1) / 7));
  const cell = weeks <= 6 ? 34 : weeks <= 14 ? 18 : 12;
  let pixels = `<div class="pixels"><div class="col">${WD.map((w) => `<div class="px small muted" style="width:16px;height:${cell}px;font-size:8px">${w}</div>`).join('')}</div>`;
  for (let w = 0; w < weeks; w++) {
    pixels += '<div class="col">';
    for (let i = 0; i < 7; i++) {
      const d = D.addDays(pStart, w * 7 + i);
      const inR = d >= start && d <= end && d <= today;
      const info = days[D.key(d)];
      const e = info?.main && Emo.get(info.main);
      if (!inR) pixels += `<div class="px" style="width:${cell}px;height:${cell}px"></div>`;
      else if (e) pixels += `<a class="px" data-go="/day/${D.key(d)}" style="width:${cell}px;height:${cell}px;background:${cell >= 30 ? 'transparent' : e.color}">${cell >= 30 ? Emo.badge(e, cell) : ''}</a>`;
      else pixels += `<div class="px none" style="width:${cell}px;height:${cell}px"></div>`;
    }
    pixels += '</div>';
  }
  pixels += '</div>';

  const maxC = st.counts[0]?.[1] || 1;
  const list = statState.allEmo ? st.counts : st.counts.slice(0, 8);
  const slices = statState.donutEmo
    ? st.counts.slice(0, 7).map(([id, c]) => { const e = Emo.get(id); return e && { name: e.name, count: c, color: e.color }; }).filter(Boolean)
    : CATS.map((c) => ({ name: c.title, count: st.cats[c.id], color: c.color })).filter((s) => s.count > 0);
  const sTotal = slices.reduce((a, s) => a + s.count, 0);
  const wdData = st.weekdays.map((a, i) => ({ i, a })).filter((x) => x.a != null);
  const bestWd = wdData.slice().sort((a, b) => b.a - a.a)[0];
  const sp = statState.sel && st.points.find((p) => p.key === statState.sel);

  const dayRow = (d) => {
    const e = d.main && Emo.get(d.main);
    const first = d.entries[0];
    return `<a class="row" data-go="/day/${d.key}">${e ? Emo.badge(e, 32) : ''}<div class="grow"><div style="font-size:14px;font-weight:500">${D.long(d.date)}</div>
      <div class="small muted" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(first ? first.title || first.text.slice(0, 80) : '')}</div></div>${icon('right')}</a>`;
  };
  const cmp = (label, a, b) => {
    const diff = a - b;
    return `<div class="row"><span class="grow">${label}</span><span class="muted small">${b} → ${a}</span>
      <b style="color:${diff >= 0 ? 'var(--accent)' : 'var(--sub)'};min-width:34px;text-align:right">${diff === 0 ? '=' : diff > 0 ? '+' + diff : diff}</b></div>`;
  };
  const topNow = st.mains[0] && Emo.get(st.mains[0][0]);
  const topPrev = prev.mains[0] && Emo.get(prev.mains[0][0]);

  v.innerHTML = `${topbar('Mood stats')}
  <div class="page stack">
    <div class="periods">${PERIODS.map(([id, n]) => `<button class="pill ${statState.p === id ? 'on' : ''}" data-act="statPeriod" data-p="${id}">${n}</button>`).join('')}</div>
    ${statState.p === 'month' || statState.p === 'year' ? `<div class="row"><button class="icon-btn" data-act="statShift" data-d="-1">${icon('left')}</button>
      <div class="grow center serif" style="font-size:18px">${statState.p === 'month' ? D.monthTitle(statState.anchor) : statState.anchor.getFullYear()}</div>
      <button class="icon-btn" data-act="statShift" data-d="1">${icon('right')}</button></div>` : ''}
    <div class="grid2">
      <div class="card tight tile-stat">${icon('book')}<span class="v">${st.entryCount}</span><span class="small muted">entries</span></div>
      <div class="card tight tile-stat">${icon('calendar')}<span class="v">${st.daysWithData}</span><span class="small muted">days with emotions</span></div>
      <div class="card tight tile-stat">${icon('image')}<span class="v">${st.photoCount}</span><span class="small muted">photos</span></div>
      <div class="card tight tile-stat">${icon('smile')}<span class="v">${st.avg != null ? Emo.moodLabel(st.avg) : '—'}</span><span class="small muted">average mood</span></div>
    </div>

    <div class="card stack">
      ${sectionTitle('Mood line', st.bucket === 'day' ? 'each dot is a day' : st.bucket === 'week' ? 'weekly average' : 'monthly average')}
      ${st.points.length ? `<div class="chart">${lineChart(st)}</div>
        ${sp ? `<a class="sel-box row" data-go="${st.bucket === 'month' ? '/month/' + sp.key.slice(0, 7) : '/day/' + sp.key}">${sp.main ? Emo.badge(Emo.get(sp.main), 30) : ''}
            <div class="grow"><b style="font-size:14px">${st.bucket === 'day' ? D.long(sp.date) : st.bucket === 'week' ? 'Week of ' + D.dm(sp.date) : D.monthTitle(sp.date)}</b>
            <div class="small muted">${Emo.moodLabel(sp.score)}</div></div><span style="color:var(--accent);font-weight:600" class="small">Open ›</span></a>`
          : '<div class="small muted">Tap a dot to open the day. Gaps are days without entries (not a bad mood).</div>'}`
        : '<div class="muted small">A chart will appear here once you pick emotions in your entries.</div>'}
      ${st.noData ? `<div class="small muted">◌ Days without data: ${st.noData}</div>` : ''}
    </div>

    <div class="card stack">${sectionTitle('Mood calendar', 'color = main emotion of the day')}${pixels}</div>

    <div class="card stack">
      ${sectionTitle('Top emotions', 'how many times and what percent')}
      ${list.length ? list.map(([id, c]) => {
        const e = Emo.get(id);
        if (!e) return '';
        return `<div class="bar-row">${Emo.badge(e, 28)}<div class="grow"><div class="row" style="margin-bottom:4px"><span class="grow" style="font-size:14px">${esc(e.name)}</span>
          <span class="small muted">${c} · ${pct(c, st.total)}</span></div><div class="bar"><i style="width:${(c / maxC) * 100}%;background:${e.color}"></i></div></div></div>`;
      }).join('') : '<div class="muted small">No emotions for this period yet.</div>'}
      ${st.counts.length > 8 ? `<button class="text-btn small" data-act="statAll">${statState.allEmo ? 'Collapse' : `Show all (${st.counts.length})`}</button>` : ''}
    </div>

    <div class="card stack">
      <div class="row">${sectionTitle('Mood in percent')}<div class="grow"></div>
        <div class="seg" style="width:150px"><button class="${statState.donutEmo ? '' : 'on'}" data-act="statDonut" data-v="0">Groups</button><button class="${statState.donutEmo ? 'on' : ''}" data-act="statDonut" data-v="1">Emotions</button></div></div>
      ${slices.length ? `<div class="row" style="gap:16px">${donut(slices)}<div class="grow stack" style="gap:8px">${slices.map((s) => `<div class="row small" style="gap:6px">
        <i style="width:9px;height:9px;border-radius:50%;background:${s.color};flex:none"></i><span class="grow" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(s.name)}</span><span class="muted">${pct(s.count, sTotal)}</span></div>`).join('')}</div></div>`
        : '<div class="muted small">No data for this period.</div>'}
      ${st.noData ? `<div class="small muted">Days without entries (${st.noData}) are not counted and aren’t considered bad.</div>` : ''}
    </div>

    <div class="card stack">
      ${sectionTitle('Mood by weekday', bestWd ? 'best — ' + WD[bestWd.i] : '')}
      ${wdData.length ? `<svg viewBox="0 0 340 150" style="width:100%">${WD.map((w, i) => {
        const a = st.weekdays[i], x = 20 + i * 46, mid = 70;
        const h = a == null ? 0 : (Math.abs(a) / 2) * 60;
        const y = a == null ? mid : a >= 0 ? mid - h : mid;
        return `${a != null ? `<rect x="${x}" y="${y}" width="30" height="${Math.max(h, 2)}" rx="5" fill="${a >= 0 ? t.accent : '#6F86AE'}"/>` : ''}
          <text x="${x + 15}" y="146" font-size="11" text-anchor="middle" fill="${t.subc}">${w}</text>`;
      }).join('')}<line x1="10" x2="335" y1="70" y2="70" stroke="${t.border}"/></svg>` : '<div class="muted small">Not enough data.</div>'}
    </div>

    <div class="card stack">
      ${sectionTitle('Emotions that come together')}
      ${st.pairs.length ? st.pairs.map(([a, b, c]) => {
        const ea = Emo.get(a), eb = Emo.get(b);
        if (!ea || !eb) return '';
        return `<div class="row">${Emo.badge(ea, 28)}<span class="muted small">+</span>${Emo.badge(eb, 28)}
          <span class="grow small" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(ea.name)} & ${esc(eb.name.toLowerCase())}</span><b style="color:var(--accent)">×${c}</b></div>`;
      }).join('') : '<div class="muted small">Pick several emotions in an entry and pairs will show up here.</div>'}
    </div>

    <div class="card stack">
      ${sectionTitle('Brightest days')}
      ${st.best.length ? st.best.map(dayRow).join('') : '<div class="muted small">None yet.</div>'}
      ${orn()}
      ${sectionTitle('Hardest days', 'take care of yourself 🤍')}
      ${st.hardest.length ? st.hardest.map(dayRow).join('') : '<div class="muted small">No hard days.</div>'}
    </div>

    <div class="card stack">
      ${sectionTitle('Compared with the previous period')}
      ${cmp('Entries', st.entryCount, prev.entryCount)}
      ${cmp('Days with emotions', st.daysWithData, prev.daysWithData)}
      ${st.avg != null && prev.avg != null ? `<div class="row"><span class="grow">Mood</span><span class="muted small">${Emo.moodLabel(prev.avg)} → ${Emo.moodLabel(st.avg)}</span>
        <b style="color:${st.avg >= prev.avg ? 'var(--accent)' : 'var(--sub)'};min-width:34px;text-align:right">${st.avg > prev.avg + 0.1 ? '↗' : st.avg < prev.avg - 0.1 ? '↘' : '→'}</b></div>` : ''}
      ${topNow ? `<div class="row"><span class="grow">Most frequent emotion of the day</span>${topPrev ? Emo.badge(topPrev, 22) + ' → ' : ''}${Emo.badge(topNow, 26)}</div>` : ''}
    </div>
  </div>`;
};

ACT.statPeriod = (el) => { statState.p = el.dataset.p; statState.sel = null; if (['month', 'year'].includes(statState.p)) statState.anchor = new Date(); render(); };
ACT.statShift = (el) => {
  const d = +el.dataset.d;
  statState.anchor = statState.p === 'month' ? D.addMonths(statState.anchor, d) : new Date(statState.anchor.getFullYear() + d, 0, 1);
  statState.sel = null;
  render();
};
ACT.statPoint = (el) => { statState.sel = statState.sel === el.dataset.key ? null : el.dataset.key; const y = scrollY; render().then(() => scrollTo(0, y)); };
ACT.statAll = () => { statState.allEmo = !statState.allEmo; const y = scrollY; render().then(() => scrollTo(0, y)); };
ACT.statDonut = (el) => { statState.donutEmo = el.dataset.v === '1'; const y = scrollY; render().then(() => scrollTo(0, y)); };

/* ==========================================================================
   ФОТО, МІСЯЦЬ, РІК, АРХІВ, ОБРАНЕ
   ========================================================================== */
function highlightPicker(key, title, candidates) {
  openSheet(title, `<div class="stack">
      <label class="btn full">${icon('image')} Choose from your photo library<input type="file" accept="image/*" id="hl-file" hidden></label>
      ${candidates.length ? `<div class="serif">Suggestions from your entries</div>
        <div class="grid3">${candidates.map((p) => `<button class="thumb" data-pid-pick="${p}"><img data-pid="${p}" alt=""></button>`).join('')}</div>`
        : '<div class="muted small">No photos in entries for this period yet.</div>'}
      ${S.highlights[key] ? '<button class="btn danger full" data-hl-remove="1">Remove photo</button>' : ''}
    </div>`, (body, close) => {
    $('#hl-file', body).addEventListener('change', async (ev) => {
      const f = ev.target.files?.[0];
      if (!f) return;
      await setHighlight(key, f);
      close(); toast('Saved ✨'); render();
    });
    body.addEventListener('click', async (ev) => {
      const b = ev.target.closest('[data-pid-pick]');
      if (b) { await setHighlight(key, await photoBlob(b.dataset.pidPick)); close(); toast('Saved ✨'); render(); return; }
      if (ev.target.closest('[data-hl-remove]')) { await setHighlight(key, null); close(); render(); }
    });
  });
}

function monthsGallery(year, photos) {
  const yk = String(year);
  const yearHl = S.highlights[yk];
  const cards = MONTHS.map((m, i) => {
    const key = `${year}-${pad(i + 1)}`;
    const hl = S.highlights[key];
    const auto = photos.filter((p) => p.date.startsWith(key)).slice(-1)[0];
    return `<a class="month-card" data-go="/month/${key}"><div class="img">${hl ? `<img src="${hl.url}" alt="">` : auto ? `<img data-pid="${auto.id}" alt="">` : '<span class="ph">🌿</span>'}</div>
      <div class="nm"><span>${cap(m)}</span>${hl ? '<span style="color:var(--accent)">★</span>' : ''}</div></a>`;
  }).join('');
  return `<button class="photo-card" style="height:200px" data-act="pickHl" data-key="${yk}">
      ${yearHl ? `<img src="${yearHl.url}" alt="">` : `<div class="empty">✨<br>Choose a photo that sums up ${year}</div>`}
      <div class="shade"></div><div class="label"><div class="t1">photo of the year</div><div class="t2">${year}</div></div></button>
    <div class="month-cards">${cards}</div>
    <div class="small muted">The photo of the month is chosen on the month page. If none is chosen, a photo from your entries is shown.</div>`;
}

ACT.pickHl = (el) => {
  const key = el.dataset.key;
  const cands = allPhotos().filter((p) => p.date.startsWith(key)).map((p) => p.id);
  highlightPicker(key, key.length === 4 ? `Photo of ${key}` : 'Photo of the month', cands);
};

ROUTES.photos = async (v, parts, q) => {
  const all = allPhotos();
  const nowY = new Date().getFullYear();
  const years = [...new Set([nowY, ...all.map((p) => +p.date.slice(0, 4))])].sort((a, b) => b - a);
  const year = +(q.get('y') || nowY);
  const mode = q.get('mode') || 'months';
  const list = all.filter((p) => p.date.startsWith(String(year)));
  let content = '';
  if (mode === 'months') content = monthsGallery(year, list);
  else {
    const groups = [];
    list.forEach((p, i) => {
      const k = p.date.slice(0, 7);
      if (!groups.length || groups[groups.length - 1].k !== k) groups.push({ k, items: [] });
      groups[groups.length - 1].items.push([p, i]);
    });
    content = list.length ? groups.map((g) => `<div class="hand" style="font-size:22px;color:var(--text)">${cap(MONTHS[+g.k.slice(5) - 1])}</div>
      <div class="grid3">${g.items.map(([p, i]) => `<button class="thumb" data-act="photoOpen" data-i="${i}"><img data-pid="${p.id}" alt=""></button>`).join('')}</div>`).join('')
      : '<div class="muted">No photos this year yet.</div>';
  }
  v.innerHTML = `${topbar('Photos')}
  <div class="page stack">
    <div class="seg"><button class="${mode === 'months' ? 'on' : ''}" data-replace="1" data-go="/photos?y=${year}&mode=months">Months</button><button class="${mode === 'all' ? 'on' : ''}" data-replace="1" data-go="/photos?y=${year}&mode=all">All photos</button></div>
    <div class="periods">${years.map((y) => `<button class="pill ${y === year ? 'on' : ''}" data-replace="1" data-go="/photos?y=${y}&mode=${mode}">${y}</button>`).join('')}</div>
    <div class="muted small">${list.length} photos</div>
    ${content}
  </div>`;
  ACT.photoOpen = (el) => openViewer(list.map((p) => p.id), +el.dataset.i);
};

ROUTES.month = async (v, parts) => {
  const key = parts[1];
  const first = D.fromKey(key + '-01');
  const days = buildIndex();
  const st = computeStats(days, first, new Date(first.getFullYear(), first.getMonth(), D.daysIn(first)));
  const entries = S.entries.filter((e) => e.date.startsWith(key));
  const photos = allPhotos().filter((p) => p.date.startsWith(key));
  const hl = S.highlights[key];
  const fav = entries.filter((e) => e.favorite);
  const bright = st.best.flatMap((d) => d.entries).filter((e) => !e.favorite);
  const moments = [...fav, ...bright].slice(0, 4);
  v.innerHTML = `${topbar(D.monthTitle(first))}
  <div class="page stack">
    <button class="photo-card" style="height:240px" data-act="pickHl" data-key="${key}">
      ${hl ? `<img src="${hl.url}" alt="">` : photos[0] ? `<img data-pid="${photos[photos.length - 1].id}" alt="">` : '<div class="empty">🖼️</div>'}
      <div class="shade"></div><div class="label"><div class="t1">${hl ? 'photo of the month' : 'tap to choose the photo of the month'}</div><div class="t2">${D.monthTitle(first)}</div></div>
    </button>
    <div class="grid3">
      <div class="card tight center"><div class="big-num">${entries.length}</div><div class="small muted">entries</div></div>
      <div class="card tight center"><div class="big-num">${photos.length}</div><div class="small muted">photos</div></div>
      <div class="card tight center"><div class="big-num">${new Set(entries.map((e) => e.date.slice(0, 10))).size}</div><div class="small muted">days</div></div>
    </div>
    <div class="card stack">
      ${sectionTitle('Emotions of the month', st.avg != null ? 'overall — ' + Emo.moodLabel(st.avg).toLowerCase() : '')}
      ${st.counts.length ? `<div class="chips">${st.counts.slice(0, 8).map(([id, c]) => { const e = Emo.get(id); return e ? `<div class="center" style="width:64px;flex:none">${Emo.badge(e, 42)}<div style="font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(e.name)}</div><div class="small muted" style="font-size:10px">×${c}</div></div>` : ''; }).join('')}</div>` : '<div class="muted small">No emotion marks.</div>'}
      <div id="mgrid">${monthGrid(first, days, null, true)}</div>
    </div>
    ${moments.length ? `${sectionTitle('Brightest moments')}${moments.map((e) => entryCard(e, true)).join('')}` : ''}
    ${photos.length ? `${sectionTitle('Photos of the month')}<div class="grid4">${photos.map((p, i) => `<button class="thumb" data-act="monthPhoto" data-i="${i}"><img data-pid="${p.id}" alt=""></button>`).join('')}</div>` : ''}
    ${entries.length ? `${sectionTitle('All entries')}${entries.map((e) => entryCard(e, true)).join('')}` : ''}
  </div>`;
  ACT.monthPhoto = (el) => openViewer(photos.map((p) => p.id), +el.dataset.i);
  $('#mgrid', v).addEventListener('click', (ev) => { const b = ev.target.closest('.cal-day'); if (b) go('/day/' + b.dataset.day); });
};

ROUTES.year = async (v, parts) => {
  const year = +parts[1];
  const days = buildIndex();
  const st = computeStats(days, new Date(year, 0, 1), new Date(year, 11, 31));
  const entries = S.entries.filter((e) => e.date.startsWith(String(year)));
  const photos = allPhotos().filter((p) => p.date.startsWith(String(year)));
  v.innerHTML = `${topbar(String(year))}
  <div class="page stack">
    ${monthsGallery(year, photos)}
    <div class="card stack">
      ${sectionTitle(`Summary ${year} `)}
      <div class="grid3"><div><div class="big-num">${entries.length}</div><div class="small muted">entries</div></div>
        <div><div class="big-num">${photos.length}</div><div class="small muted">photos</div></div>
        <div><div class="big-num">${st.daysWithData}</div><div class="small muted">days with emotions</div></div></div>
      ${st.counts.length ? `<div class="hand">Most frequent emotions</div><div class="chips">${st.counts.slice(0, 6).map(([id, c]) => { const e = Emo.get(id); return e ? `<div class="center" style="flex:none">${Emo.badge(e, 40)}<div class="small muted">${c}</div></div>` : ''; }).join('')}</div>` : ''}
      <button class="btn full" data-act="yearStats" data-y="${year}">${icon('chart')} Year stats</button>
    </div>
    ${entries.filter((e) => e.favorite).length ? `${sectionTitle('Favorite moments of the year')}${entries.filter((e) => e.favorite).slice(0, 5).map((e) => entryCard(e, true)).join('')}` : ''}
  </div>`;
};
ACT.yearStats = (el) => { statState.p = 'year'; statState.anchor = new Date(+el.dataset.y, 0, 1); statState.sel = null; go('/stats'); };

ROUTES.archive = async (v) => {
  const years = {};
  for (const e of S.entries) (years[e.date.slice(0, 4)] = years[e.date.slice(0, 4)] || []).push(e);
  const ys = Object.keys(years).sort((a, b) => b - a);
  v.innerHTML = `${topbar('Archive')}
  <div class="page stack">
    ${ys.length ? '' : '<div class="muted center">The archive will appear once you have entries.</div>'}
    ${ys.map((y) => {
      const list = years[y];
      const hl = S.highlights[y];
      const ph = list.find((e) => (e.photos || []).length)?.photos[0];
      const counts = {};
      list.forEach((e) => (e.emotions || []).forEach((id) => (counts[id] = (counts[id] || 0) + 1)));
      const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 4).map((x) => x[0]);
      return `<a class="photo-card" style="height:170px" data-go="/year/${y}">
        ${hl ? `<img src="${hl.url}" alt="">` : ph ? `<img data-pid="${ph}" alt="">` : ''}
        <div class="shade" style="background:linear-gradient(180deg,transparent,rgba(0,0,0,.7))"></div>
        <div class="label"><div class="t2" style="font-size:34px">${y}</div><div class="small" style="opacity:.85">${list.length} entries · ${list.reduce((a, e) => a + (e.photos || []).length, 0)} photos</div></div>
        <div style="position:absolute;right:14px;bottom:14px">${Emo.stack(top, 30, 4)}</div></a>`;
    }).join('')}
    <button class="card tight row" data-go="/favorites"><span style="color:var(--accent)">★</span><span class="serif grow" style="text-align:left">Favorite memories</span>
      <span class="muted">${S.entries.filter((e) => e.favorite).length}</span>${icon('right')}</button>
  </div>`;
};

ROUTES.favorites = async (v) => {
  const fav = S.entries.filter((e) => e.favorite);
  v.innerHTML = `${topbar('Favorite memories')}<div class="page stack">
    ${fav.length ? fav.map((e) => entryCard(e)).join('') : '<div class="empty-state"><div class="big">★</div><div class="muted">Star important entries — they’ll gather here.</div></div>'}</div>`;
};

/* ==========================================================================
   ПОШУК
   ========================================================================== */
const searchState = { q: '', scope: 'entries', emotions: [], tags: [], mood: '', useDates: false, from: '', to: '', fav: false };

function allTags() {
  const c = {};
  S.entries.forEach((e) => (e.tags || []).forEach((t) => (c[t] = (c[t] || 0) + 1)));
  return Object.entries(c).sort((a, b) => b[1] - a[1]).map((x) => x[0]);
}

function searchResults() {
  const s = searchState;
  const tokens = fold(s.q).split(/\s+/).filter(Boolean);
  const active = tokens.length || s.emotions.length || s.tags.length || s.mood || s.useDates || s.fav;
  if (!active) return { active, tokens, entries: [], photos: [] };
  const from = s.from || '0000', to = (s.to || '9999') + 'T99';
  const days = s.mood ? buildIndex() : null;
  const entries = S.entries.filter((e) => {
    if (e.hidden && !showHidden) return false;
    if (e.locked && !unlockedEntries.has(e.id) && tokens.length) return false;
    if (s.fav && !e.favorite) return false;
    if (s.tags.length && !s.tags.every((t) => (e.tags || []).includes(t))) return false;
    if (s.mood && dayMood(days[e.date.slice(0, 10)])?.mood !== s.mood) return false;
    if (s.useDates && (e.date < from || e.date > to)) return false;
    if (s.emotions.length && !s.emotions.every((id) => (e.emotions || []).includes(id))) return false;
    if (tokens.length && !tokens.every((t) => (e.search || '').includes(t))) return false;
    return true;
  });
  const photos = [];
  for (const e of entries) {
    const ids = e.photos || [];
    const byCap = tokens.length ? ids.filter((id) => tokens.every((t) => fold(S.photoMeta[id]?.caption).includes(t))) : [];
    (byCap.length ? byCap : ids).forEach((id) => photos.push({ id, date: e.date }));
  }
  return { active, tokens, entries, photos };
}

function snippet(e, tokens) {
  if (!tokens.length) return '';
  const text = (e.text + ' ' + (e.photos || []).map((p) => S.photoMeta[p]?.caption || '').join(' ')).replace(/\s+/g, ' ');
  const f = fold(text);
  const at = f.indexOf(tokens[0]);
  if (at < 0) return '';
  const s = Math.max(0, at - 50), en = Math.min(text.length, at + 110);
  let piece = esc(text.slice(s, en));
  for (const t of tokens) {
    const re = new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    piece = piece.replace(re, (m) => `<b style="color:var(--accent)">${m}</b>`);
  }
  return `<div class="small muted" style="padding:0 12px">${s > 0 ? '…' : ''}${piece}${en < text.length ? '…' : ''}</div>`;
}

ROUTES.search = async (v) => {
  const s = searchState;
  v.innerHTML = `${topbar('Search')}
  <div class="page stack">
    <input class="text-input" id="sq" type="search" placeholder="Words, a person, an event, “July”, “March 12”…" value="${esc(s.q)}" autocomplete="off">
    <div class="seg"><button data-sc="entries" class="${s.scope === 'entries' ? 'on' : ''}">Entries</button><button data-sc="photos" class="${s.scope === 'photos' ? 'on' : ''}">Photo</button></div>
    <div class="periods">
      <button class="pill ${s.emotions.length ? 'on' : ''}" id="s-emo">${s.emotions.length ? `Emotions: ${s.emotions.length}` : '☺︎ Emotions'}</button>
      <button class="pill ${s.useDates ? 'on' : ''}" id="s-dates">📅 Period</button>
      <button class="pill ${s.fav ? 'on' : ''}" id="s-fav">★ Favorites</button>
      <button class="pill ${s.mood ? 'on' : ''}" id="s-mood">${s.mood ? 'Mood: ' + moodName(s.mood).toLowerCase() : '☁︎ Mood of the day'}</button>
      <button class="pill" id="s-reset">Reset</button>
    </div>
    ${s.emotions.length ? Emo.stack(s.emotions, 26, 10) : ''}
    ${allTags().length ? `<div class="chips" style="flex-wrap:wrap">${allTags().map((t) => `<button class="tag ${s.tags.includes(t) ? 'on' : ''}" data-stag="${esc(t)}">#${esc(t)}</button>`).join('')}</div>` : ''}
    ${s.useDates ? `<div class="row"><input type="date" class="date-input grow" id="s-from" value="${s.from}"><span class="muted">—</span><input type="date" class="date-input grow" id="s-to" value="${s.to}"></div>` : ''}
    <div id="sres" class="stack"></div>
  </div>`;
  const out = $('#sres', v);
  const draw = () => {
    const r = searchResults();
    if (!r.active) {
      out.innerHTML = `<div class="empty-state"><div class="big">🔎</div><div class="muted small">Type a word, a name, an event, a month or a date. You can also search by emotions and photo captions.</div></div>`;
      return;
    }
    if (s.scope === 'entries') {
      out.innerHTML = `<div class="hand">${r.entries.length ? 'Found: ' + r.entries.length : 'Nothing found'}</div>`
        + r.entries.slice(0, 200).map((e) => `<div class="stack" style="gap:6px">${entryCard(e, true)}${snippet(e, r.tokens)}</div>`).join('');
    } else {
      out.innerHTML = `<div class="hand">${r.photos.length ? 'Photo: ' + r.photos.length : 'No photos found'}</div>
        <div class="grid3">${r.photos.map((p, i) => `<button class="thumb" data-act="searchPhoto" data-i="${i}"><img data-pid="${p.id}" alt="">
          <span class="badge" style="position:absolute;left:4px;bottom:4px;background:rgba(0,0,0,.5);color:#fff;font-size:9px">${p.date.slice(8, 10)}.${p.date.slice(5, 7)}.${p.date.slice(2, 4)}</span></button>`).join('')}</div>`;
      ACT.searchPhoto = (el) => openViewer(r.photos.map((p) => p.id), +el.dataset.i);
    }
    hydrate(out);
  };
  draw();
  const qIn = $('#sq', v);
  qIn.addEventListener('input', () => { s.q = qIn.value; draw(); });
  if (!s.q) setTimeout(() => qIn.focus(), 200);
  $$('[data-sc]', v).forEach((b) => b.addEventListener('click', () => { s.scope = b.dataset.sc; render(); }));
  $('#s-emo', v).addEventListener('click', () => openEmotionPicker(s.emotions, () => {}, 'Search by emotions', () => render()));
  $('#s-dates', v).addEventListener('click', () => {
    s.useDates = !s.useDates;
    if (s.useDates && !s.from) { s.to = D.key(new Date()); s.from = D.key(D.addMonths(new Date(), -1)); }
    render();
  });
  $('#s-fav', v).addEventListener('click', () => { s.fav = !s.fav; render(); });
  $('#s-reset', v).addEventListener('click', () => { Object.assign(s, { q: '', emotions: [], tags: [], mood: '', useDates: false, fav: false }); render(); });
  $$('[data-stag]', v).forEach((b) => b.addEventListener('click', () => { const t = b.dataset.stag; s.tags = s.tags.includes(t) ? s.tags.filter((x) => x !== t) : [...s.tags, t]; render(); }));
  $('#s-mood', v).addEventListener('click', () => menuSheet('Days when the mood was mostly', [
    { label: 'Any', run: () => { s.mood = ''; render(); } },
    ...Object.entries(MOODS).map(([k, m]) => ({ label: `${moodName(k)} — ${m.sub}`, run: () => { s.mood = k; render(); } })),
  ]));
  $('#s-from', v)?.addEventListener('change', (e) => { s.from = e.target.value; draw(); });
  $('#s-to', v)?.addEventListener('change', (e) => { s.to = e.target.value; draw(); });
};

/* ==========================================================================
   НАЛАШТУВАННЯ
   ========================================================================== */
let preparedBackup = null;

ROUTES.settings = async (v) => {
  const st = S.settings;
  const totalPhotos = S.entries.reduce((a, e) => a + (e.photos || []).length, 0);
  let usage = '';
  try {
    const est = await navigator.storage?.estimate?.();
    if (est) usage = `${(est.usage / 1048576).toFixed(1)} MB`;
  } catch (_) { /* немає даних */ }
  const faceOK = await faceIdAvailable();
  let persisted = false;
  try { persisted = navigator.storage?.persisted ? await navigator.storage.persisted() : false; } catch (_) { persisted = false; }
  const sw = (id, on, label) => `<div class="form-row"><label for="${id}">${label}</label><span class="switch"><input type="checkbox" id="${id}" ${on ? 'checked' : ''}><span></span></span></div>`;
  const last = st.lastBackup ? D.dmy(new Date(st.lastBackup)) : 'never';

  v.innerHTML = `${topbar('Settings')}
  <div class="page stack">
    <div class="card">
      <div class="section-title" style="font-size:17px;margin-bottom:8px">About me</div>
      <input class="text-input" id="set-name" placeholder="What should I call you?" value="${esc(st.name)}">
    </div>
    <div class="card stack">
      <div class="section-title" style="font-size:17px;margin-bottom:4px">Language</div>
      <div class="periods">${LANGS.map(([c, n]) => `<button class="pill ${LANG === c ? 'on' : ''}" data-act="setLang" data-lang="${c}" translate="no">${n}</button>`).join('')}</div>
    </div>

    <div class="card">
      <div class="section-title" style="font-size:17px">Appearance</div>
      <button class="link-row" data-go="/themes" style="padding:12px 0">${icon('brush')}<span class="grow">Theme library</span><span class="muted small">${esc(theme().name)}</span>${icon('right')}</button>
      <button class="link-row" data-go="/style" style="padding:12px 0">${icon('sparkle')}<span class="grow">My style: colors, background, header</span>${icon('right')}</button>
      <button class="link-row" data-go="/art" style="padding:12px 0">${icon('photos')}<span class="grow">My pictures: mood of the day & smileys</span>${icon('right')}</button>
      ${sw('set-decor', st.decor, 'Decorative details')}
      ${sw('set-anim', st.animate, 'Header animation (fireflies, snow…)')}
      ${sw('set-serif', st.serif, 'Serif font for entries')}
      <div class="form-row"><label>Text size: <b id="sz-lbl">${st.size}</b></label><input type="range" id="set-size" min="14" max="24" step="1" value="${st.size}" style="width:45%"></div>
    </div>

    <div class="card">
      <div class="section-title" style="font-size:17px">Emotions</div>
      <button class="link-row" data-go="/emotions" style="padding:12px 0">${icon('smile')}<span class="grow">Emotion library (${Emo.all().length})</span>${icon('right')}</button>
    </div>

    <div class="card stack">
      <div class="section-title" style="font-size:17px">Backup & new phone</div>
      <div class="small muted">Everything is stored only on this phone. A backup is <b>one file</b> with your whole journal: entries with dates, photos, voice notes, drawings, tags, mood, plans, themes, style and your pictures. Save it to “Files” → iCloud Drive. On a new phone: install own journal → “Restore from backup” — and everything will be back.</div>
      <div class="small">Last backup: <b>${last}</b></div>
      <button class="btn solid full" id="bk-make">${icon('download')} Create full backup</button>
      <button class="btn full hidden" id="bk-share">${icon('upload')} Save / share file</button>
      <label class="btn full">${icon('upload')} Restore from backup<input type="file" id="bk-restore" hidden></label>
      <button class="btn full" data-go="/pdfimport">${icon('download')} Import old diary from PDF</button>
      <button class="btn full" id="zip-make">${icon('archive')} Export to archive (.zip): entries, photos, voice</button>
      <div class="small muted">The archive opens on any computer: a page with all entries + folders with photos and voice notes.</div>
    </div>

    <div class="card stack">
      <div class="section-title" style="font-size:17px">Privacy</div>
      <div class="small muted">${st.pinHash ? 'The journal opens only with your password.' : 'You can set a 4-digit password — it will be asked when opening.'}</div>
      <button class="btn full" id="pin-set">${icon('lock')} ${st.pinHash ? 'Change password' : 'Set password'}</button>
      ${st.pinHash ? '<button class="btn danger full" id="pin-del">Remove password</button>' : ''}
      ${st.pinHash && faceOK ? `<div class="form-row"><label for="set-faceid">Open with Face ID</label><span class="switch"><input type="checkbox" id="set-faceid" ${st.webauthnId ? 'checked' : ''}><span></span></span></div>` : ''}
      <div class="form-row"><label for="set-showhidden">Show hidden entries</label><span class="switch"><input type="checkbox" id="set-showhidden" ${showHidden ? 'checked' : ''}><span></span></span></div>
      <div class="small muted">Single entries can be hidden from the feed or password-protected — in the entry menu (⋯). If you forget the password, the entries can’t be opened, so make backups.</div>
    </div>

    <div class="card stack">
      <div class="section-title" style="font-size:17px">Home Screen icon</div>
      <div class="small muted">You can use your own picture as the icon of own journal. iPhone takes the icon at the moment you add it to the Home Screen, so a new icon appears after adding it again.</div>
      <div class="row">${st.customIcon ? `<img src="${blobURL('icon', st.customIcon)}" style="width:60px;height:60px;border-radius:14px">` : '<img src="apple-touch-icon.png" style="width:60px;height:60px;border-radius:14px">'}
        <label class="btn grow">${icon('image')} Choose picture<input type="file" accept="image/*" id="icon-file" hidden></label></div>
      ${st.customIcon ? '<button class="btn danger full" id="icon-del">Restore default icon</button>' : ''}
      <div class="small muted">To change the icon of an installed journal: 1) create a full backup; 2) delete the icon from the screen; 3) open the address in Safari and choose a picture here; 4) “Share → Add to Home Screen”; 5) “Restore from backup”.</div>
    </div>

    <div class="card stack">
      <div class="section-title" style="font-size:17px">Little messages</div>
      <div class="small muted">Sometimes a quote, a wish or a question for yourself appears when you open the journal. There are ${allMessages().length} messages, and they don’t repeat until almost all have been shown.</div>
      <select class="text-input" id="msg-freq">${MSG_FREQ.map(([v, n]) => `<option value="${v}" ${(st.msgFreq || 'sometimes') === v ? 'selected' : ''}>${n}</option>`).join('')}</select>
      <textarea class="text-input" id="msg-new" rows="2" placeholder="Add your own message…"></textarea>
      <button class="btn full" id="msg-add">${icon('plus')} Add message</button>
      ${(st.customMessages || []).map((m, i) => `<div class="row small"><span class="grow">${esc(m.text)}</span><button class="text-btn" data-delmsg="${i}">${icon('trash', 16)}</button></div>`).join('')}
    </div>

    <div class="card stack">
      <div class="section-title" style="font-size:17px">Reminders</div>
      <div class="small muted">A web app can’t send daily notifications by itself. The easiest way: open “Reminders” on iPhone → new reminder “Write in my journal” → daily at the time you like.</div>
    </div>

    <div class="card">
      <div class="section-title" style="font-size:17px">About the journal</div>
      <div class="form-row"><span class="grow">Entries</span><b>${S.entries.length}</b></div>
      <div class="form-row"><span class="grow">Photo</span><b>${totalPhotos}</b></div>
      ${usage ? `<div class="form-row"><span class="grow">Space used on phone</span><b>${usage}</b></div>` : ''}
      <div class="form-row"><span class="grow">Protected storage</span><b>${persisted ? 'yes ✓' : 'standard'}</b></div>
    </div>
  </div>`;

  $('#set-name', v).addEventListener('change', async (e) => { st.name = e.target.value.trim(); await saveSettings(); toast('Saved'); });
  const toggle = (id, key) => $('#' + id, v).addEventListener('change', async (e) => { st[key] = e.target.checked; await saveSettings(); applyTheme(); });
  toggle('set-decor', 'decor'); toggle('set-anim', 'animate'); toggle('set-serif', 'serif');
  $('#set-size', v).addEventListener('input', async (e) => { st.size = +e.target.value; $('#sz-lbl').textContent = st.size; applyTheme(); await saveSettings(); });

  $('#bk-make', v).addEventListener('click', async () => {
    const btn = $('#bk-make');
    btn.disabled = true;
    btn.textContent = 'Preparing backup…';
    try {
      preparedBackup = await makeBackup();
      $('#bk-share').classList.remove('hidden');
      btn.innerHTML = `${icon('check')} Backup ready (${(preparedBackup.size / 1048576).toFixed(1)} MB)`;
      toast('Now tap “Save / share file”');
    } catch (err) {
      console.error(err);
      btn.textContent = 'Didn’t work. Try again';
    }
    btn.disabled = false;
  });
  $('#bk-share', v).addEventListener('click', async () => {
    if (!preparedBackup) return;
    const done = async () => { st.lastBackup = Date.now(); await saveSettings(); toast('Backup saved ✓'); };
    if (navigator.canShare && navigator.canShare({ files: [preparedBackup] })) {
      try { await navigator.share({ files: [preparedBackup], title: preparedBackup.name }); await done(); }
      catch (err) { if (err.name !== 'AbortError') toast('Couldn’t share the file'); }
    } else {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(preparedBackup);
      a.download = preparedBackup.name;
      document.body.appendChild(a); a.click(); a.remove();
      await done();
    }
  });
  $('#bk-restore', v).addEventListener('change', async (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    toast('Restoring…', 8000);
    try {
      const n = await restoreBackup(f);
      applyTheme();
      toast(n ? `Entries restored: ${n} 🌿` : 'No new entries in the backup (all are already here)', 4000);
      render();
    } catch (err) {
      console.error(err);
      toast('Couldn’t read the file. Choose a journal backup file (.diary)', 4000);
    }
  });
  $('#pin-set', v).addEventListener('click', () => setupPin());
  $('#set-faceid', v)?.addEventListener('change', async (e) => {
    if (e.target.checked) {
      try { await setupFaceId(); toast('Face ID enabled'); } catch (err) { e.target.checked = false; toast('Couldn’t enable Face ID'); }
    } else { st.webauthnId = ''; await saveSettings(); }
  });
  $('#set-showhidden', v).addEventListener('change', (e) => {
    if (e.target.checked && st.pinHash) { e.target.checked = false; requirePin(() => { showHidden = true; render(); }, 'Password to show hidden entries'); }
    else { showHidden = e.target.checked; }
  });
  let zipFile = null;
  $('#zip-make', v).addEventListener('click', async () => {
    const btn = $('#zip-make');
    if (zipFile) { shareFile(zipFile); return; }
    btn.disabled = true; btn.textContent = 'Building archive…';
    try { zipFile = await exportArchive(); btn.innerHTML = `${icon('upload')} Archive ready (${(zipFile.size / 1048576).toFixed(1)} MB) — save`; }
    catch (err) { console.error(err); btn.textContent = 'Didn’t work. Try again'; }
    btn.disabled = false;
  });
  $('#icon-file', v).addEventListener('change', async (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    const im = await loadImage(f);
    const side = Math.min(im.naturalWidth, im.naturalHeight);
    const c = document.createElement('canvas'); c.width = c.height = 512;
    c.getContext('2d').drawImage(im, (im.naturalWidth - side) / 2, (im.naturalHeight - side) / 2, side, side, 0, 0, 512, 512);
    st.customIcon = await new Promise((r) => c.toBlob(r, 'image/png'));
    await saveSettings(); applyTheme(); render(); toast('Icon saved. Add the journal to the Home Screen again to see it');
  });
  $('#icon-del', v)?.addEventListener('click', async () => { st.customIcon = null; await saveSettings(); applyTheme(); render(); });
  $('#msg-freq', v).addEventListener('change', async (e) => { st.msgFreq = e.target.value; await saveSettings(); toast('Saved'); });
  $('#msg-add', v).addEventListener('click', async () => {
    const t = $('#msg-new').value.trim();
    if (!t) return;
    st.customMessages = [...(st.customMessages || []), { kind: 'k', text: t }];
    await saveSettings(); render(); toast('Message added ✉︎');
  });
  $$('[data-delmsg]', v).forEach((b) => b.addEventListener('click', async () => {
    st.customMessages.splice(+b.dataset.delmsg, 1); await saveSettings(); render();
  }));
  $('#pin-del', v)?.addEventListener('click', async () => { if (confirm('Remove password?')) { st.pinHash = ''; await saveSettings(); render(); } });
};

/* ---------- Теми ---------- */
function themePreview(t, h, selected, imgURL) {
  const btn = t.btn || t.accent;
  return `<div class="theme-prev ${selected ? 'sel' : ''}" style="background:linear-gradient(${t.bgTop},${t.bgBottom})">
    ${imgURL ? `<div style="height:${h}px;background:url(${imgURL}) center/cover"></div>` : `<canvas data-theme="${t.id}" style="height:${h}px"></canvas>`}
    <div class="mock">${[0, 1].map((i) => `<div class="mc" style="background:${t.card}">
      <div style="display:flex;gap:5px;align-items:center"><i style="width:18px;height:9px;background:${t.text};opacity:.7"></i><i style="width:26px;background:${t.subc};opacity:.5"></i>
      <span style="flex:1"></span><i style="width:10px;height:10px;border-radius:50%;background:${CATS[i].color}"></i></div>
      <i style="background:${t.text};opacity:.25"></i><i style="width:60%;background:${t.text};opacity:.18"></i>
      ${i ? `<div style="display:flex;gap:3px">${[0, 1, 2, 3].map(() => `<i style="flex:1;height:14px;background:${t.border};border-radius:3px"></i>`).join('')}</div>` : ''}</div>`).join('')}
      <div style="display:flex;justify-content:center;gap:14px;align-items:center"><i style="width:11px;height:11px;border-radius:50%;background:${t.card}"></i>
      <i style="width:18px;height:18px;border-radius:50%;background:${btn}"></i><i style="width:11px;height:11px;border-radius:50%;background:${t.card}"></i></div></div>
    ${selected ? `<span class="check" style="background:${t.accent};color:${isLight(t.accent) ? '#111' : '#fff'}">✓</span>` : ''}</div>`;
}

function paintPreviews(root) {
  for (const c of $$('canvas[data-theme]', root)) {
    const t = THEMES.find((x) => x.id === c.dataset.theme);
    if (t) paintScene(c, t, false);
  }
}

let themeCat = 'all';
ROUTES.themes = async (v) => {
  const st = S.settings;
  const mine = st.savedThemes || [];
  const list = themeCat === 'all' ? THEMES : THEMES.filter((t) => t.cat === themeCat);
  const cols = [[], []];
  let tiles = [];
  if (themeCat === 'mine') {
    tiles = mine.map((m, i) => {
      const base = THEMES.find((x) => x.id === m.themeId) || THEMES[0];
      const t = { ...base, accent: m.accent || base.accent, card: m.card || base.card, bgTop: m.bg || base.bgTop, bgBottom: m.bg || base.bgBottom, btn: m.btnColor || m.accent || base.accent };
      return `<button class="theme-tile" data-act="applyMine" data-i="${i}">${themePreview(t, i % 2 ? 90 : 130, false, m.headerImg ? blobURL('mine-' + i, m.headerImg) : '')}
        <div class="row"><div class="grow"><div class="serif" style="font-size:15px;margin-top:8px">${esc(m.name)}</div><div class="small muted">based on “${esc(base.name)}”</div></div>
        <span class="text-btn" data-act="delMine" data-i="${i}">${icon('trash', 16)}</span></div></button>`;
    });
  } else {
    tiles = list.map((t, i) => `<button class="theme-tile" data-act="pickTheme" data-id="${t.id}">
      ${themePreview(t, (Math.floor(i / 2) + i) % 2 === 0 ? 130 : 90, st.themeId === t.id)}<div class="serif" style="font-size:15px;margin-top:8px">${t.name}</div><div class="small muted">${t.sub}</div></button>`);
  }
  tiles.forEach((h, i) => cols[i % 2].push(h));
  const canUndo = (st.lookHistory || []).length > 0;
  v.innerHTML = `${topbar('Themes', canUndo ? `<button class="icon-btn" data-act="undoLook" title="Undo">↩︎</button>` : '')}
  <div class="page stack">
    ${myBackgroundsCard()}
    <div class="periods">${THEME_CATS.map(([id, n]) => `<button class="pill ${themeCat === id ? 'on' : ''}" data-act="themeCat" data-c="${id}">${n}${id === 'mine' && mine.length ? ' · ' + mine.length : ''}</button>`).join('')}</div>
    ${canUndo ? `<button class="btn full" data-act="undoLook">↩︎ Restore previous look</button>` : ''}
    ${themeCat === 'mine' && !mine.length ? '<div class="card small muted">Your own themes will appear here. Set colors, fonts and pictures in “My style” and tap “Save as my theme”.</div>' : ''}
    <div class="masonry">${cols.map((c) => `<div class="col">${c.join('')}</div>`).join('')}</div>
    <button class="btn full" data-go="/style">${icon('sparkle')} My style: colors, fonts, pictures</button>
  </div>`;
  requestAnimationFrame(() => paintPreviews(v));
};
ACT.themeCat = (el) => { themeCat = el.dataset.c; render(); };
ACT.pickTheme = async (el) => {
  if (S.settings.themeId === el.dataset.id && !S.settings.accent && !S.settings.card && !S.settings.bg) return;
  pushLookHistory();
  Object.assign(S.settings, { themeId: el.dataset.id, accent: '', card: '', bg: '', btnColor: '', textColor: '' });
  await saveSettings();
  applyTheme();
  const y = scrollY;
  await render();
  scrollTo(0, y);
  toast('Theme changed ✨ (you can undo ↩︎)');
};
ACT.undoLook = async () => {
  const h = S.settings.lookHistory || [];
  const prev = h.pop();
  if (!prev) return;
  Object.assign(S.settings, prev);
  S.settings.lookHistory = h;
  await saveSettings();
  applyTheme();
  await render();
  toast('Previous look restored');
};
ACT.applyMine = async (el, ev) => {
  if (ev.target.closest('[data-act="delMine"]')) return;
  const m = (S.settings.savedThemes || [])[+el.dataset.i];
  if (!m) return;
  pushLookHistory();
  LOOK_KEYS.forEach((k) => { if (k in m) S.settings[k] = m[k]; });
  await saveSettings();
  applyTheme();
  await render();
  toast(`Theme “${m.name}” ✨`);
};
ACT.delMine = async (el) => {
  if (!confirm('Delete this theme?')) return;
  S.settings.savedThemes.splice(+el.dataset.i, 1);
  await saveSettings();
  render();
};

ROUTES.style = async (v) => {
  const t = theme();
  const st = S.settings;
  const fontSel = (id, cur) => `<select class="text-input" id="${id}">${FONTS.map(([fid, n, stack]) => `<option value="${fid}" ${cur === fid ? 'selected' : ''} style="font-family:${stack.replace(/"/g, "'")}">${n}</option>`).join('')}</select>`;
  const colorRow = (id, label, val) => `<div class="form-row"><label>${label}</label><input type="color" id="${id}" value="${val}"></div>`;
  const imgRow = (id, label, has) => `<div class="row" style="gap:8px"><label class="btn grow">${icon('image')} ${label}${has ? ' ✓' : ''}<input type="file" accept="image/*" data-img="${id}" hidden></label>
    ${has ? `<button class="btn danger" data-imgdel="${id}" aria-label="Remove">${icon('x', 16)}</button>` : ''}</div>`;
  v.innerHTML = `${topbar('My style')}
  <div class="page stack">
    <div style="width:200px;margin:0 auto">${themePreview(t, 110, false, headerURL)}</div>
    <button class="btn solid full" id="save-mine">${icon('star')} Save as my theme</button>

    <div class="card">
      <div class="section-title" style="font-size:17px">Base</div>
      <button class="link-row" data-go="/themes" style="padding:10px 0"><span class="grow">Theme</span><span class="muted">${esc(t.name)}</span>${icon('right')}</button>
      <div class="form-row"><label>Theme illustration as full background</label><span class="switch"><input type="checkbox" id="scene-bg" ${st.sceneBg !== false ? 'checked' : ''}><span></span></span></div>
    </div>

    <div class="card">
      <div class="section-title" style="font-size:17px">Fonts</div>
      <div class="small muted" style="margin:6px 0">Headings</div>${fontSel('f-head', st.fontHead || 'mosca')}
      <div class="small muted" style="margin:10px 0 6px">Entry text</div>${fontSel('f-body', st.fontBody || (st.serif ? 'newyork' : 'prata'))}
      <div class="small muted" style="margin:10px 0 6px">Buttons & menus</div>${fontSel('f-ui', st.fontUI || 'prata')}
      <div class="form-row"><label>Text size: <b id="sz2">${st.size || 17}</b></label><input type="range" id="f-size" min="14" max="24" step="1" value="${st.size || 17}" style="width:45%"></div>
      <div class="card tight" style="margin-top:8px"><div style="font-family:var(--serif);font-size:20px;font-weight:600">Entry title</div><div style="font-family:var(--body-font);font-size:var(--body-size)">This is how regular text will look in your journal.</div></div>
    </div>

    <div class="card">
      <div class="section-title" style="font-size:17px">Colors</div>
      ${colorRow('c-accent', 'Accent (lines, marks)', t.accent)}
      ${colorRow('c-btn', 'Buttons', t.btn)}
      ${colorRow('c-card', 'Blocks & cards', t.card)}
      ${colorRow('c-text', 'Text', t.text)}
      ${colorRow('c-bg', 'Background', t.bgTop)}
    </div>

    <div class="card">
      <div class="section-title" style="font-size:17px">Block style</div>
      <div class="form-row"><label>Card transparency</label><input type="range" id="b-op" min="0.45" max="1" step="0.05" value="${st.cardOpacity ?? 0.92}" style="width:45%"></div>
      <div class="form-row"><label>Corner rounding</label><input type="range" id="b-rad" min="6" max="32" step="1" value="${st.radius ?? 22}" style="width:45%"></div>
      <div class="form-row"><label>Border around blocks</label><span class="switch"><input type="checkbox" id="b-border" ${st.cardBorder !== false ? 'checked' : ''}><span></span></span></div>
    </div>

    <div class="card stack">
      <div class="section-title" style="font-size:17px">Your own pictures</div>
      <div class="small muted">Any photos or illustrations from your library. Each section can have its own.</div>
      ${imgRow('headerImg', 'Home screen picture', !!st.headerImg)}
      ${imgRow('bgImg', 'Journal background (general)', !!st.bgImg)}
      ${SECTIONS.map(([k, n]) => imgRow('sec:' + k, 'Background: ' + n, !!st.sectionBg?.[k])).join('')}
      ${imgRow('coverImg', 'Cover (lock screen)', !!st.coverImg)}
    </div>
    ${(st.lookHistory || []).length ? '<button class="btn full" data-act="undoLook">↩︎ Restore previous look</button>' : ''}
  </div>`;
  requestAnimationFrame(() => paintPreviews(v));
  const save = async (fn, rerender = true) => { pushLookHistory(); fn(); await saveSettings(); applyTheme(); if (rerender) { const y = scrollY; await render(); scrollTo(0, y); } };
  const color = (id, key) => $('#' + id, v).addEventListener('change', (e) => save(() => { st[key] = e.target.value; }));
  color('c-accent', 'accent'); color('c-btn', 'btnColor'); color('c-card', 'card'); color('c-bg', 'bg'); color('c-text', 'textColor');
  $('#f-head', v).addEventListener('change', (e) => save(() => { st.fontHead = e.target.value; }));
  $('#f-body', v).addEventListener('change', (e) => save(() => { st.fontBody = e.target.value; }));
  $('#f-ui', v).addEventListener('change', (e) => save(() => { st.fontUI = e.target.value; }));
  $('#f-size', v).addEventListener('input', (e) => { st.size = +e.target.value; $('#sz2').textContent = st.size; applyTheme(); saveSettings(); });
  $('#b-op', v).addEventListener('input', (e) => { st.cardOpacity = +e.target.value; applyTheme(); saveSettings(); });
  $('#b-rad', v).addEventListener('input', (e) => { st.radius = +e.target.value; applyTheme(); saveSettings(); });
  $('#b-border', v).addEventListener('change', (e) => save(() => { st.cardBorder = e.target.checked; }, false));
  $('#scene-bg', v).addEventListener('change', (e) => save(() => { st.sceneBg = e.target.checked; }, false));
  $$('[data-img]', v).forEach((inp) => inp.addEventListener('change', async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const im = await loadImage(f);
    const blob = await resizeTo(im, 1800, 0.85);
    const key = inp.dataset.img;
    save(() => { if (key.startsWith('sec:')) { st.sectionBg = { ...(st.sectionBg || {}), [key.slice(4)]: blob }; } else st[key] = blob; });
    toast('Done ✨');
  }));
  $$('[data-imgdel]', v).forEach((b) => b.addEventListener('click', () => {
    const key = b.dataset.imgdel;
    save(() => { if (key.startsWith('sec:')) { const o = { ...(st.sectionBg || {}) }; delete o[key.slice(4)]; st.sectionBg = o; } else st[key] = null; });
  }));
  $('#save-mine', v).addEventListener('click', async () => {
    const name = prompt('Name of your theme:', 'My theme ' + ((st.savedThemes || []).length + 1));
    if (!name) return;
    st.savedThemes = [...(st.savedThemes || []), { name: name.trim(), ...snapshotLook() }];
    await saveSettings();
    toast('Theme saved to “My themes” ⭐');
  });
};

ROUTES.emotions = async (v) => {
  v.innerHTML = `${topbar('Emotions', `<button class="icon-btn" data-act="addEmotion">${icon('plus')}</button>`)}
  <div class="page stack">
    <div class="small muted">${Emo.all().length} emotions. Tap any emotion to rename it; your own emotions can also be deleted.</div>
    ${CATS.map((c) => `<div class="card"><div class="serif" style="margin-bottom:10px">${c.title}</div>
      <div class="emo-grid">${Emo.inCat(c.id).map((e) => `<button class="emo-cell" data-act="emoMenu" data-id="${e.id}">${Emo.badge(e, 46)}<span class="name">${esc(e.name)}</span></button>`).join('')}</div></div>`).join('')}
    <button class="btn full" data-act="addEmotion">${icon('plus')} Add your own emotion</button>
  </div>`;
};
let homeLimit = 30;
ACT.homeMore = async () => { const y = scrollY; homeLimit += 30; await render(); scrollTo(0, y); };
ACT.setLang = (el) => { if (el.dataset.lang !== LANG) setLanguage(el.dataset.lang); };
ACT.addEmotion = () => openEmotionEditor(() => render());
ACT.emoMenu = (el) => {
  const e = Emo.get(el.dataset.id);
  if (!e) return;
  const items = [{ label: 'Rename', icon: 'pen', run: async () => {
    const name = prompt('New name for this emotion:', e.name);
    if (name == null || !name.trim()) return;
    S.settings.emoNames = { ...(S.settings.emoNames || {}), [e.id]: name.trim() };
    await saveSettings(); render();
  } }];
  if ((S.settings.emoNames || {})[e.id]) items.push({ label: 'Restore original name', icon: 'back', run: async () => { const n = { ...S.settings.emoNames }; delete n[e.id]; S.settings.emoNames = n; await saveSettings(); render(); } });
  if (e.custom) items.push({ label: 'Delete emotion', icon: 'trash', danger: true, run: () => ACT.delEmotion(el) });
  menuSheet(esc(e.name), items);
};
ACT.delEmotion = async (el) => {
  if (!confirm('Delete this emotion from the library? It will disappear from old entries.')) return;
  S.settings.customEmotions = S.settings.customEmotions.filter((e) => e.id !== el.dataset.id);
  await saveSettings();
  render();
};

/* ==========================================================================
   ПАРОЛЬ
   ========================================================================== */
function pinPad(onDone, subtitle, cancellable, extraHTML = '') {
  const el = document.createElement('div');
  el.className = 'lock';
  const cover = S.settings.coverImg ? blobURL('cover', S.settings.coverImg) : headerURL;
  el.innerHTML = `<div class="hero" style="height:calc(250px + var(--safe-top))">${cover ? `<div class="hero-img" style="background-image:url(${cover})"></div>` : '<canvas></canvas>'}<div class="fade"></div>
      <div class="greet" style="text-align:center"><div style="color:var(--accent)">${icon('lock', 22)}</div><div class="today" style="font-style:italic">own journal</div><div class="hello" id="pin-sub">${subtitle}</div></div></div>
    <div class="pin-dots" id="pin-dots"><i></i><i></i><i></i><i></i></div>
    <div class="pinpad">${['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((k) => `<button class="${k === '' || k === '⌫' ? 'ghost' : ''}" data-k="${k}">${k}</button>`).join('')}</div>
    ${extraHTML}
    ${cancellable ? '<button class="text-btn" data-k-cancel="1">Cancel</button>' : ''}
    <div style="height:30px"></div>`;
  document.body.appendChild(el);
  const cv = $('canvas', el);
  const stop = cv ? paintScene(cv, theme(), false) : null;
  let pin = '';
  const dots = $('#pin-dots', el);
  const draw = () => $$('i', dots).forEach((d, i) => d.classList.toggle('f', i < pin.length));
  el._close = () => { stop && stop(); el.remove(); };
  el.addEventListener('click', async (ev) => {
    if (ev.target.closest('[data-k-cancel]')) { el._close(); return; }
    const b = ev.target.closest('[data-k]');
    if (!b || !b.dataset.k) return;
    if (b.dataset.k === '⌫') pin = pin.slice(0, -1);
    else if (pin.length < 4) pin += b.dataset.k;
    draw();
    if (pin.length === 4) {
      const val = pin;
      await sleep(120);
      const res = await onDone(val, el);
      if (res === true) el._close();
      else { dots.classList.add('shake'); setTimeout(() => dots.classList.remove('shake'), 400); if (typeof res === 'string') $('#pin-sub', el).textContent = res; }
      pin = '';
      draw();
    }
  });
  return el;
}

function setupPin(after) {
  let first = null;
  pinPad(async (val, root) => {
    if (!first) { first = val; $('#pin-sub', root).textContent = 'Repeat password'; return 'Repeat password'; }
    if (first !== val) { first = null; return 'Doesn’t match. Choose a password again'; }
    S.settings.pinHash = await sha256(val);
    await saveSettings();
    toast('Password set 🔒');
    if (typeof after === 'function') setTimeout(after, 50); else render();
    return true;
  }, 'Choose a 4-digit password', true);
}

let locked = false;
function lockScreen() {
  if (!S.settings.pinHash || locked) return;
  locked = true;
  const fid = S.settings.webauthnId ? `<button class="btn" data-faceid="1" style="margin-top:14px">${icon('lock', 18)} Open with Face ID</button>` : '';
  const el = pinPad(async (val) => {
    if ((await sha256(val)) === S.settings.pinHash) { locked = false; return true; }
    return 'Wrong password';
  }, 'your memories live here', false, fid);
  const btn = $('[data-faceid]', el);
  if (btn) btn.addEventListener('click', async () => {
    if (await checkFaceId()) { locked = false; el._close(); } else toast('Didn’t work. Enter your password');
  });
}

let hiddenAt = 0;
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { hiddenAt = Date.now(); return; }
  if (S.settings.pinHash && hiddenAt && Date.now() - hiddenAt > 60000) lockScreen();
  if ((parseHash().parts[0] || '') === '' && !$('#ed-body')) render();
});

/* ==========================================================================
   ЗАПУСК
   ========================================================================== */
async function start() {
  try {
    await DB.open();
    await loadAll();
    await loadTasks();
    await loadArt();
    for (const k of ['world', 'worldMax', 'seasonMax', 'seasonVisits', 'visitCount', 'lastVisit', 'showWorld']) delete S.settings[k];
    try {
      if (S.settings.lang && S.settings.lang !== LANG) {
        localStorage.setItem('oj-lang', S.settings.lang);
        if (localStorage.getItem('oj-lang') === S.settings.lang && !sessionStorage.getItem('oj-lang-sync')) { sessionStorage.setItem('oj-lang-sync', '1'); location.reload(); return; }
      }
    } catch (_) {}
  } catch (err) {
    console.error(err);
    $('#view').innerHTML = `<div class="page"><div class="card">Couldn’t open the journal storage. Check that Safari is not in Private Browsing mode, and restart.<br><small class="muted">${esc(err.message)}</small></div></div>`;
    return;
  }
  applyTheme();
  if (S.settings.pinHash) lockScreen();
  if (location.hash && location.hash !== '#/' && location.hash !== '#') location.replace('#/');
  else await render();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
  if (S.entries.length) navigator.storage?.persist?.();
}

document.addEventListener('DOMContentLoaded', start);
