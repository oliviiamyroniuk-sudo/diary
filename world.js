'use strict';
/* own journal — маленький лісовий світ, що росте разом зі щоденником.
   Нічого не зникає: навіть якщо пропустити дні, усе відкрите лишається. */

const WORLD_ITEMS = [
  { id: 'mush1', name: 'Червоні грибочки', at: 0, pos: [0.2, 0.9] },
  { id: 'flowers1', name: 'Ромашки', at: 2, pos: [0.74, 0.93] },
  { id: 'bush', name: 'Кущик із ягодами', at: 4, pos: [0.88, 0.76] },
  { id: 'mush2', name: 'Грибна сімейка', at: 6, pos: [0.1, 0.72] },
  { id: 'fireflies', name: 'Світлячки', at: 8, pos: [0.5, 0.6] },
  { id: 'lantern', name: 'Ліхтарик', at: 10, pos: [0.33, 0.8] },
  { id: 'fence', name: 'Дерев’яний тин', at: 13, pos: [0.68, 0.79] },
  { id: 'bench', name: 'Лавочка', at: 16, pos: [0.84, 0.92] },
  { id: 'pond', name: 'Ставок із лататтям', at: 20, pos: [0.22, 0.8] },
  { id: 'bunny', name: 'Зайчик', at: 24, pos: [0.6, 0.94] },
  { id: 'lavender', name: 'Лаванда', at: 28, pos: [0.42, 0.95] },
  { id: 'swing', name: 'Гойдалка на дереві', at: 32, pos: [0.92, 0.66] },
  { id: 'garland', name: 'Гірлянда-вогники', at: 36, pos: [0.5, 0.66] },
  { id: 'guestHouse', name: 'Грибний будиночок для гостей', at: 42, pos: [0.14, 0.64] },
  { id: 'fox', name: 'Лисичка', at: 50, pos: [0.3, 0.93] },
  { id: 'birdhouse', name: 'Шпаківня', at: 58, pos: [0.78, 0.68] },
  { id: 'well', name: 'Криниця', at: 66, pos: [0.06, 0.88] },
  { id: 'glowshrooms', name: 'Світні гриби', at: 75, pos: [0.55, 0.84] },
  { id: 'owl', name: 'Сова на пеньку', at: 85, pos: [0.95, 0.86] },
];
const HOUSES = [['cottage', 'Хатинка', 0], ['mushroom', 'Грибний дім', 15], ['treehouse', 'Будиночок на дереві', 30], ['stone', 'Кам’яна вежа', 45]];
const ROOFS = ['#B5483E', '#7A5236', '#5E7A4A', '#5A6A9A', '#8E5A8E', '#C9893A', '#3E3A44'];
const SEASON_NAMES = { winter: 'зима', spring: 'весна', summer: 'літо', autumn: 'осінь' };

function currentSeason(d = new Date()) {
  const m = d.getMonth();
  return m === 11 || m <= 1 ? 'winter' : m <= 4 ? 'spring' : m <= 7 ? 'summer' : 'autumn';
}

function worldState() {
  const w = S.settings.world || (S.settings.world = { house: 'cottage', roof: ROOFS[0], pos: {}, hidden: [], seen: [] });
  w.pos = w.pos || {}; w.hidden = w.hidden || []; w.seen = w.seen || [];
  return w;
}

/** Бали росту: дні з записами чи настроєм + дні, коли щоденник відкривали. Ніколи не зменшуються. */
function worldPoints() {
  const active = new Set([...S.entries.map((e) => e.date.slice(0, 10)), ...Object.keys(S.dayMoods)]);
  const pts = active.size * 2 + (S.settings.visitCount || 0);
  if (pts > (S.settings.worldMax || 0)) S.settings.worldMax = pts;
  return S.settings.worldMax || 0;
}

function registerVisit() {
  const today = D.key(new Date());
  if (S.settings.lastVisit !== today) {
    S.settings.lastVisit = today;
    S.settings.visitCount = (S.settings.visitCount || 0) + 1;
    const sv = S.settings.seasonVisits || (S.settings.seasonVisits = {});
    const se = currentSeason();
    sv[se] = (sv[se] || 0) + 1;
    saveSettings();
  }
}

function seasonOfKey(k) { return currentSeason(new Date(+k.slice(0, 4), +k.slice(5, 7) - 1, 15)); }

/** Бали конкретної пори року: дні з записами чи настроєм у цю пору (будь-якого року) + відвідини. Не зменшуються. */
function seasonPoints(season) {
  const days = new Set([...S.entries.map((e) => e.date.slice(0, 10)), ...Object.keys(S.dayMoods)]);
  let n = 0;
  days.forEach((k) => { if (seasonOfKey(k) === season) n++; });
  const pts = n * 2 + ((S.settings.seasonVisits || {})[season] || 0);
  const mx = S.settings.seasonMax || (S.settings.seasonMax = {});
  if (pts > (mx[season] || 0)) mx[season] = pts;
  return mx[season] || 0;
}

function itemPoints(it) { return it.season ? seasonPoints(it.season) : worldPoints(); }

function unlocked(item) { return itemPoints(item) >= item.at; }

/** Видимі предмети: відкриті й не сховані (сезонні — у свій сезон або якщо закріплені «завжди»). */
function visibleItems(pts, season) {
  const w = worldState();
  return WORLD_ITEMS.filter((it) => unlocked(it) && !w.hidden.includes(it.id) && (!it.season || it.season === season || (w.pinned || []).includes(it.id)));
}

/** Найближча нагорода: звичайна або цієї пори року. */
function nextUnlock() {
  const season = currentSeason();
  const c = WORLD_ITEMS.filter((it) => (!it.season || it.season === season) && !unlocked(it))
    .map((it) => ({ item: it, steps: it.at - itemPoints(it) }))
    .sort((a, b) => a.steps - b.steps);
  return c[0] || null;
}

/** Будиночок для пори року: свій вибір або перший сезонний. */
function houseFor(season) {
  const st = worldState();
  const pick = (st.houseBy || {})[season];
  if (pick) return pick;
  if (!st.houseBy && st.house && st.house !== 'cottage') return st.house;
  return SEASON_HOUSES[season][0][0];
}

/** Повідомити про нові предмети. */
function checkNewItems() {
  const season = currentSeason();
  const w = worldState();
  const fresh = WORLD_ITEMS.filter((it) => (!it.season || it.season === season) && unlocked(it) && !w.seen.includes(it.id));
  if (!fresh.length) return;
  const first = !w.seen.length;
  w.seen.push(...fresh.map((f) => f.id));
  saveSettings();
  if (!first) setTimeout(() => toast(`У твоєму куточку зʼявилося: ${fresh.map((f) => f.name.toLowerCase()).join(', ')} ✨`, 3600), 800);
}

/* ---------- Малювання ---------- */
const WD_ = {
  tree(c, x, y, s, season, kind = 0) {
    const leaf = { spring: ['#8FBF6A', '#F4B8CC'], summer: ['#4E8A3E', '#6FA052'], autumn: ['#D9822B', '#C2552C'], winter: ['#E9F0F6', '#C9D6E2'] }[season];
    if (kind === 1 || season === 'winter') {
      c.fillStyle = season === 'winter' ? '#3E5A4A' : '#3E6A3E';
      c.beginPath(); Scene.pine(c, x, y, 30 * s, 64 * s); c.fill();
      if (season === 'winter') { c.fillStyle = '#F4F8FC'; c.beginPath(); c.moveTo(x, y - 60 * s); c.lineTo(x - 6 * s, y - 50 * s); c.lineTo(x + 6 * s, y - 50 * s); c.fill(); }
      return;
    }
    c.fillStyle = '#6B4A30'; c.fillRect(x - 3 * s, y - 26 * s, 6 * s, 26 * s);
    [[0, -40, 17], [-12, -32, 13], [12, -33, 13], [0, -52, 12]].forEach(([dx, dy, r], i) => { c.fillStyle = leaf[i % 2 === 0 ? 0 : 1]; c.beginPath(); c.arc(x + dx * s, y + dy * s, r * s, 0, Math.PI * 2); c.fill(); });
    if (season === 'spring') { c.fillStyle = '#FFF'; const r = rng(Math.round(x)); for (let i = 0; i < 10; i++) { c.beginPath(); c.arc(x + (r() - 0.5) * 34 * s, y - 40 * s + (r() - 0.5) * 30 * s, 1.4 * s, 0, Math.PI * 2); c.fill(); } }
  },
  house(c, x, y, s, style, roof, night, season) {
    const win = night ? '#FFD27A' : '#BFE2F2';
    const snow = season === 'winter';
    if (night) Art.glow(c, x, y - 30 * s, 70 * s, 'rgba(255,200,110,.25)');
    if (style === 'mushroom') { Art.mushroomHouse(c, x, y, 1.5 * s, roof, '#F1E4CC'); if (snow) { c.fillStyle = '#F6FAFD'; c.beginPath(); c.ellipse(x, y - 108 * s, 30 * s, 9 * s, 0, Math.PI, 0); c.fill(); } return; }
    if (style === 'treehouse') {
      c.fillStyle = '#5A3E28'; c.fillRect(x - 9 * s, y - 70 * s, 18 * s, 70 * s);
      c.fillStyle = season === 'autumn' ? '#C9702E' : season === 'winter' ? '#DDE7EF' : '#4E8A3E';
      [[0, -110, 40], [-30, -92, 26], [30, -94, 26]].forEach(([dx, dy, r]) => { c.beginPath(); c.arc(x + dx * s, y + dy * s, r * s, 0, Math.PI * 2); c.fill(); });
      c.fillStyle = '#9A6A44'; c.fillRect(x - 24 * s, y - 84 * s, 48 * s, 26 * s);
      c.fillStyle = roof; c.beginPath(); c.moveTo(x - 30 * s, y - 82 * s); c.lineTo(x, y - 104 * s); c.lineTo(x + 30 * s, y - 82 * s); c.fill();
      c.fillStyle = win; c.fillRect(x - 14 * s, y - 78 * s, 10 * s, 10 * s); c.fillRect(x + 4 * s, y - 78 * s, 10 * s, 10 * s);
      c.strokeStyle = '#7A5A3A'; c.lineWidth = 2 * s; for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(x + 14 * s, y - 56 * s + i * 9 * s); c.lineTo(x + 24 * s, y - 56 * s + i * 9 * s); c.stroke(); }
      c.beginPath(); c.moveTo(x + 14 * s, y - 58 * s); c.lineTo(x + 14 * s, y); c.moveTo(x + 24 * s, y - 58 * s); c.lineTo(x + 24 * s, y); c.stroke();
      return;
    }
    if (style === 'stone') {
      c.fillStyle = '#A8A39A'; c.fillRect(x - 20 * s, y - 64 * s, 40 * s, 64 * s);
      c.strokeStyle = '#8A857C'; c.lineWidth = 1; for (let r = 0; r < 8; r++) for (let k = 0; k < 3; k++) c.strokeRect(x - 20 * s + k * 13.3 * s + (r % 2) * 6 * s, y - 64 * s + r * 8 * s, 13.3 * s, 8 * s);
      c.fillStyle = roof; c.beginPath(); c.moveTo(x - 26 * s, y - 62 * s); c.lineTo(x, y - 100 * s); c.lineTo(x + 26 * s, y - 62 * s); c.fill();
      if (snow) { c.fillStyle = '#F6FAFD'; c.beginPath(); c.moveTo(x - 8 * s, y - 88 * s); c.lineTo(x, y - 100 * s); c.lineTo(x + 8 * s, y - 88 * s); c.fill(); }
      c.fillStyle = win; c.beginPath(); c.arc(x, y - 44 * s, 6 * s, Math.PI, 0); c.fill(); c.fillRect(x - 6 * s, y - 44 * s, 12 * s, 8 * s);
      c.fillStyle = '#5A3E28'; c.beginPath(); c.arc(x, y - 12 * s, 8 * s, Math.PI, 0); c.fill(); c.fillRect(x - 8 * s, y - 12 * s, 16 * s, 12 * s);
      return;
    }
    // хатинка
    c.fillStyle = '#E8D6B8'; c.fillRect(x - 30 * s, y - 40 * s, 60 * s, 40 * s);
    c.strokeStyle = 'rgba(120,90,60,.35)'; c.lineWidth = 1; for (let i = 1; i < 5; i++) { c.beginPath(); c.moveTo(x - 30 * s, y - i * 8 * s); c.lineTo(x + 30 * s, y - i * 8 * s); c.stroke(); }
    c.fillStyle = roof; c.beginPath(); c.moveTo(x - 38 * s, y - 38 * s); c.lineTo(x, y - 70 * s); c.lineTo(x + 38 * s, y - 38 * s); c.fill();
    c.fillRect(x + 12 * s, y - 72 * s, 8 * s, 20 * s);
    if (snow) { c.fillStyle = '#F6FAFD'; c.beginPath(); c.moveTo(x - 38 * s, y - 38 * s); c.lineTo(x, y - 70 * s); c.lineTo(x + 38 * s, y - 38 * s); c.lineTo(x + 30 * s, y - 42 * s); c.lineTo(x, y - 64 * s); c.lineTo(x - 30 * s, y - 42 * s); c.fill(); }
    c.fillStyle = win; c.fillRect(x - 22 * s, y - 30 * s, 13 * s, 12 * s); c.fillRect(x + 9 * s, y - 30 * s, 13 * s, 12 * s);
    c.strokeStyle = '#6B4A30'; c.lineWidth = 1.5 * s; c.strokeRect(x - 22 * s, y - 30 * s, 13 * s, 12 * s); c.strokeRect(x + 9 * s, y - 30 * s, 13 * s, 12 * s);
    c.fillStyle = '#6B4A30'; c.fillRect(x - 6 * s, y - 22 * s, 12 * s, 22 * s);
    c.fillStyle = '#E8B84A'; c.beginPath(); c.arc(x + 3 * s, y - 11 * s, 1.3 * s, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(220,220,220,.5)'; [[16, -80, 4], [20, -88, 5], [15, -97, 6]].forEach(([dx, dy, r]) => { c.beginPath(); c.arc(x + dx * s, y + dy * s, r * s, 0, Math.PI * 2); c.fill(); });
  },
  item(c, id, x, y, s, season, night, t) {
    switch (id) {
      case 'mush1': [[-8, 0, 1], [4, 2, 0.8], [12, -2, 0.6]].forEach(([dx, dy, k]) => Scene.mushroom(c, x + dx * s, y + dy * s, k * s * 1.1, '#C8473B')); break;
      case 'mush2': [[-8, 0, 1], [3, 1, 0.75], [10, -1, 0.55]].forEach(([dx, dy, k]) => Scene.mushroom(c, x + dx * s, y + dy * s, k * s * 1.1, '#A8744A')); break;
      case 'flowers1': { const r = rng(3); for (let i = 0; i < 9; i++) { const fx = x + (r() - 0.5) * 34 * s, fy = y + (r() - 0.5) * 8 * s; c.strokeStyle = '#5E8A50'; c.lineWidth = 1; c.beginPath(); c.moveTo(fx, fy); c.lineTo(fx, fy - 8 * s); c.stroke(); c.fillStyle = '#FFFFFF'; for (let p = 0; p < 6; p++) { const a = p / 6 * Math.PI * 2; c.beginPath(); c.arc(fx + Math.cos(a) * 2.6 * s, fy - 8 * s + Math.sin(a) * 2.6 * s, 1.6 * s, 0, Math.PI * 2); c.fill(); } c.fillStyle = '#F6CD4A'; c.beginPath(); c.arc(fx, fy - 8 * s, 1.5 * s, 0, Math.PI * 2); c.fill(); } break; }
      case 'lavender': { for (let i = 0; i < 10; i++) { const fx = x - 18 * s + i * 4 * s, h = (12 + (i % 3) * 3) * s; c.strokeStyle = '#6E8A5A'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(fx, y); c.lineTo(fx, y - h); c.stroke(); c.fillStyle = '#9A7AD0'; for (let k = 0; k < 4; k++) { c.beginPath(); c.ellipse(fx, y - h + k * 2.5 * s, 1.6 * s, 2 * s, 0, 0, Math.PI * 2); c.fill(); } } break; }
      case 'bush': c.fillStyle = season === 'winter' ? '#C9D6E0' : season === 'autumn' ? '#B5682C' : '#4E7E3A'; c.beginPath(); c.arc(x - 8 * s, y - 8 * s, 11 * s, 0, Math.PI * 2); c.arc(x + 6 * s, y - 10 * s, 13 * s, 0, Math.PI * 2); c.arc(x + 16 * s, y - 5 * s, 8 * s, 0, Math.PI * 2); c.fill(); if (season !== 'winter') { c.fillStyle = '#D9364A'; const r = rng(9); for (let i = 0; i < 8; i++) { c.beginPath(); c.arc(x - 14 * s + r() * 32 * s, y - 18 * s + r() * 14 * s, 1.8 * s, 0, Math.PI * 2); c.fill(); } } break;
      case 'fireflies': { const r = rng(5); for (let i = 0; i < 8; i++) { const fx = x + (r() - 0.5) * 120 * s + Math.sin(t * 0.7 + i) * 8, fy = y - r() * 40 * s + Math.cos(t + i) * 5; const g = 0.4 + 0.6 * Math.abs(Math.sin(t * 2 + i)); Art.glow(c, fx, fy, 8 * s, `rgba(247,229,138,${0.25 * g})`); c.fillStyle = `rgba(255,243,176,${g})`; c.beginPath(); c.arc(fx, fy, 1.6 * s, 0, Math.PI * 2); c.fill(); } break; }
      case 'lantern': c.fillStyle = '#3E3A34'; c.fillRect(x - 1.5 * s, y - 34 * s, 3 * s, 34 * s); c.fillRect(x - 6 * s, y - 34 * s, 12 * s, 2 * s); Art.glow(c, x, y - 26 * s, (night ? 30 : 14) * s, 'rgba(255,200,110,.45)'); c.fillStyle = '#FFD27A'; c.fillRect(x - 4 * s, y - 31 * s, 8 * s, 10 * s); c.strokeStyle = '#3E3A34'; c.lineWidth = 1.4; c.strokeRect(x - 4 * s, y - 31 * s, 8 * s, 10 * s); break;
      case 'fence': c.fillStyle = '#9A7450'; for (let i = 0; i < 5; i++) { c.fillRect(x - 24 * s + i * 11 * s, y - 16 * s, 4 * s, 16 * s); c.beginPath(); c.moveTo(x - 24 * s + i * 11 * s, y - 16 * s); c.lineTo(x - 22 * s + i * 11 * s, y - 19 * s); c.lineTo(x - 20 * s + i * 11 * s, y - 16 * s); c.fill(); } c.fillRect(x - 26 * s, y - 12 * s, 52 * s, 2.5 * s); c.fillRect(x - 26 * s, y - 6 * s, 52 * s, 2.5 * s); if (season === 'winter') { c.fillStyle = '#F6FAFD'; c.fillRect(x - 26 * s, y - 13.5 * s, 52 * s, 1.6 * s); } break;
      case 'bench': c.fillStyle = '#8A6040'; c.fillRect(x - 16 * s, y - 10 * s, 32 * s, 3 * s); c.fillRect(x - 16 * s, y - 18 * s, 32 * s, 3 * s); c.fillRect(x - 14 * s, y - 10 * s, 3 * s, 10 * s); c.fillRect(x + 11 * s, y - 10 * s, 3 * s, 10 * s); c.fillRect(x - 14 * s, y - 18 * s, 2 * s, 8 * s); c.fillRect(x + 12 * s, y - 18 * s, 2 * s, 8 * s); break;
      case 'pond': c.fillStyle = season === 'winter' ? '#CFE3F0' : '#6FA8C8'; c.beginPath(); c.ellipse(x, y - 4 * s, 30 * s, 9 * s, 0, 0, Math.PI * 2); c.fill(); c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 1; c.beginPath(); c.ellipse(x - 6 * s, y - 6 * s, 10 * s, 2 * s, 0, 0, Math.PI * 2); c.stroke(); if (season !== 'winter') { c.fillStyle = '#5E9A4E'; [[-14, -3], [12, -5], [4, 0]].forEach(([dx, dy]) => { c.beginPath(); c.ellipse(x + dx * s, y + dy * s, 4 * s, 2 * s, 0, 0.3, Math.PI * 2); c.fill(); }); c.fillStyle = '#F4B8CC'; c.beginPath(); c.arc(x + 12 * s, y - 6 * s, 1.8 * s, 0, Math.PI * 2); c.fill(); } break;
      case 'bunny': c.fillStyle = '#E9E0D4'; c.beginPath(); c.ellipse(x, y - 6 * s, 8 * s, 6 * s, 0, 0, Math.PI * 2); c.fill(); c.beginPath(); c.arc(x + 7 * s, y - 12 * s, 4.5 * s, 0, Math.PI * 2); c.fill(); c.beginPath(); c.ellipse(x + 6 * s, y - 20 * s, 1.6 * s, 5 * s, -0.2, 0, Math.PI * 2); c.ellipse(x + 9 * s, y - 20 * s, 1.6 * s, 5 * s, 0.2, 0, Math.PI * 2); c.fill(); c.fillStyle = '#3B2B25'; c.beginPath(); c.arc(x + 8.5 * s, y - 13 * s, 0.9 * s, 0, Math.PI * 2); c.fill(); c.fillStyle = '#FFF'; c.beginPath(); c.arc(x - 8 * s, y - 7 * s, 2.5 * s, 0, Math.PI * 2); c.fill(); break;
      case 'swing': WD_.tree(c, x, y, 1.5 * s, season); c.strokeStyle = '#8A6A4A'; c.lineWidth = 1; const sw = Math.sin(t * 1.2) * 3 * s; c.beginPath(); c.moveTo(x + 8 * s, y - 38 * s); c.lineTo(x + 6 * s + sw, y - 10 * s); c.moveTo(x + 20 * s, y - 40 * s); c.lineTo(x + 18 * s + sw, y - 10 * s); c.stroke(); c.fillStyle = '#9A6A44'; c.fillRect(x + 4 * s + sw, y - 11 * s, 16 * s, 3 * s); break;
      case 'garland': c.fillStyle = '#5A4632'; c.fillRect(x - 60 * s, y - 34 * s, 2 * s, 34 * s); c.fillRect(x + 58 * s, y - 34 * s, 2 * s, 34 * s); Art.bulbs(c, x - 59 * s, y - 34 * s, x + 59 * s, y - 34 * s, 10 * s, ['rgb(255,214,110)', 'rgb(255,150,150)', 'rgb(150,220,170)', 'rgb(150,190,255)'], 10); break;
      case 'guestHouse': Art.mushroomHouse(c, x, y, 0.8 * s, '#8E6BBF', '#EEE0F2'); break;
      case 'fox': c.fillStyle = '#D9782E'; c.beginPath(); c.ellipse(x, y - 8 * s, 7 * s, 9 * s, 0, 0, Math.PI * 2); c.fill(); c.beginPath(); c.arc(x, y - 19 * s, 5.5 * s, 0, Math.PI * 2); c.fill(); c.beginPath(); c.moveTo(x - 5 * s, y - 22 * s); c.lineTo(x - 4 * s, y - 29 * s); c.lineTo(x - 1 * s, y - 23 * s); c.moveTo(x + 5 * s, y - 22 * s); c.lineTo(x + 4 * s, y - 29 * s); c.lineTo(x + 1 * s, y - 23 * s); c.fill(); c.beginPath(); c.ellipse(x + 10 * s, y - 4 * s, 9 * s, 3.5 * s, -0.5, 0, Math.PI * 2); c.fill(); c.fillStyle = '#FFF4E8'; c.beginPath(); c.ellipse(x, y - 16 * s, 3 * s, 2.4 * s, 0, 0, Math.PI * 2); c.fill(); c.beginPath(); c.arc(x + 16 * s, y - 7 * s, 2.4 * s, 0, Math.PI * 2); c.fill(); c.fillStyle = '#2B2420'; c.beginPath(); c.arc(x - 2 * s, y - 20 * s, 0.9 * s, 0, Math.PI * 2); c.arc(x + 2 * s, y - 20 * s, 0.9 * s, 0, Math.PI * 2); c.fill(); break;
      case 'birdhouse': c.fillStyle = '#6B4A30'; c.fillRect(x - 1.5 * s, y - 36 * s, 3 * s, 36 * s); c.fillStyle = '#C9A274'; c.fillRect(x - 7 * s, y - 48 * s, 14 * s, 12 * s); c.fillStyle = '#B5483E'; c.beginPath(); c.moveTo(x - 9 * s, y - 47 * s); c.lineTo(x, y - 55 * s); c.lineTo(x + 9 * s, y - 47 * s); c.fill(); c.fillStyle = '#3E2E22'; c.beginPath(); c.arc(x, y - 42 * s, 2.4 * s, 0, Math.PI * 2); c.fill(); break;
      case 'well': c.fillStyle = '#9A958C'; c.beginPath(); c.ellipse(x, y - 4 * s, 12 * s, 4 * s, 0, 0, Math.PI * 2); c.fill(); c.fillRect(x - 12 * s, y - 14 * s, 24 * s, 10 * s); c.fillStyle = '#6E6A62'; c.beginPath(); c.ellipse(x, y - 14 * s, 12 * s, 4 * s, 0, 0, Math.PI * 2); c.fill(); c.fillStyle = '#6B4A30'; c.fillRect(x - 11 * s, y - 32 * s, 2 * s, 18 * s); c.fillRect(x + 9 * s, y - 32 * s, 2 * s, 18 * s); c.fillStyle = '#B5483E'; c.beginPath(); c.moveTo(x - 15 * s, y - 30 * s); c.lineTo(x, y - 40 * s); c.lineTo(x + 15 * s, y - 30 * s); c.fill(); break;
      case 'glowshrooms': [[-8, 0], [0, 3], [9, -1], [16, 2]].forEach(([dx, dy], i) => Art.smallMushroom(c, x + dx * s, y + dy * s, (0.9 + (i % 2) * 0.3) * s, ['#7FE0D0', '#B9A6FF'][i % 2], `rgba(160,255,230,${night ? 0.5 : 0.25})`)); break;
      case 'owl': c.fillStyle = '#7A5A3A'; c.fillRect(x - 8 * s, y - 8 * s, 16 * s, 8 * s); c.fillStyle = '#9A7A5A'; c.beginPath(); c.ellipse(x, y - 8 * s, 8 * s, 2.5 * s, 0, 0, Math.PI * 2); c.fill(); c.fillStyle = '#8A6A4A'; c.beginPath(); c.ellipse(x, y - 18 * s, 7 * s, 9 * s, 0, 0, Math.PI * 2); c.fill(); c.fillStyle = '#F4E8D0'; c.beginPath(); c.arc(x - 3 * s, y - 21 * s, 2.8 * s, 0, Math.PI * 2); c.arc(x + 3 * s, y - 21 * s, 2.8 * s, 0, Math.PI * 2); c.fill(); c.fillStyle = '#2B2420'; const blink = Math.sin(t * 0.8) > 0.97; if (!blink) { c.beginPath(); c.arc(x - 3 * s, y - 21 * s, 1.2 * s, 0, Math.PI * 2); c.arc(x + 3 * s, y - 21 * s, 1.2 * s, 0, Math.PI * 2); c.fill(); } c.fillStyle = '#E8B84A'; c.beginPath(); c.moveTo(x - 1 * s, y - 18 * s); c.lineTo(x + 1 * s, y - 18 * s); c.lineTo(x, y - 16 * s); c.fill(); break;
      case 'snowman': c.fillStyle = '#FAFCFF'; c.strokeStyle = '#C9D6E2'; c.lineWidth = 1; [[0, -8, 9], [0, -21, 7], [0, -31, 5]].forEach(([dx, dy, r]) => { c.beginPath(); c.arc(x + dx * s, y + dy * s, r * s, 0, Math.PI * 2); c.fill(); c.stroke(); }); c.fillStyle = '#E8792B'; c.beginPath(); c.moveTo(x, y - 31 * s); c.lineTo(x + 6 * s, y - 30 * s); c.lineTo(x, y - 29 * s); c.fill(); c.fillStyle = '#C8473B'; c.fillRect(x - 6 * s, y - 27 * s, 12 * s, 2.5 * s); c.fillStyle = '#2B2420'; c.beginPath(); c.arc(x - 2 * s, y - 33 * s, 0.9 * s, 0, Math.PI * 2); c.arc(x + 2 * s, y - 33 * s, 0.9 * s, 0, Math.PI * 2); c.fill(); break;
      case 'pumpkins': Art.pumpkin(c, x - 8 * s, y - 10 * s, 0.9 * s, night); Art.pumpkin(c, x + 10 * s, y - 8 * s, 0.7 * s, false); break;
      case 'blossom': Art.blossomTree(c, x, y, 0.8 * s, '#8C6A5A', '#F6C3D4', '#FFFFFF'); break;
      case 'sunflowers': for (let i = 0; i < 3; i++) { const fx = x + (i - 1) * 9 * s, h = (26 + i * 4) * s; c.strokeStyle = '#5E8A3E'; c.lineWidth = 2 * s; c.beginPath(); c.moveTo(fx, y); c.lineTo(fx, y - h); c.stroke(); c.fillStyle = '#F6C33A'; for (let p = 0; p < 10; p++) { const a = p / 10 * Math.PI * 2; c.beginPath(); c.ellipse(fx + Math.cos(a) * 5 * s, y - h + Math.sin(a) * 5 * s, 2.6 * s, 1.4 * s, a, 0, Math.PI * 2); c.fill(); } c.fillStyle = '#6B4A30'; c.beginPath(); c.arc(fx, y - h, 3.2 * s, 0, Math.PI * 2); c.fill(); } break;
    }
  },
};

/** Малює світ; повертає межі предметів для перетягування. */
function drawWorld(canvas, t, opts = {}) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = canvas.clientWidth || 340, h = canvas.clientHeight || 220;
  if (canvas.width !== Math.round(w * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); }
  const c = canvas.getContext('2d');
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  const season = opts.season || currentSeason();
  const hour = new Date().getHours();
  const night = opts.night ?? (hour >= 20 || hour < 6);
  const pts = opts.points ?? worldPoints();
  const st = worldState();
  // небо
  const sky = night ? ['#141C34', '#2A3458', '#3E4A6E'] : { spring: ['#F7D9E4', '#FCEBDD', '#EEF4E0'], summer: ['#9FD2F0', '#CFEBF6', '#F2F6E2'], autumn: ['#F0B77A', '#F6D9B0', '#F4E6CF'], winter: ['#C6D8EC', '#E2ECF6', '#F4F7FA'] }[season];
  Scene.sky(c, w, h, sky);
  if (night) { Scene.stars(c, w, h, 50, 4, 0.5); Scene.moon(c, w * 0.85, h * 0.16, 11, '#F4EEDC'); }
  else Art.sun(c, w * 0.85, h * 0.18, 13, 'rgb(255,240,200)');
  // далекі пагорби й ліс
  const hill = { spring: ['#B9D6A2', '#9DC28A'], summer: ['#86B866', '#6FA052'], autumn: ['#C99A5A', '#A8763E'], winter: ['#D6E2EC', '#E9F0F6'] }[season];
  c.fillStyle = night ? '#2A3A3A' : hill[0]; Scene.hill(c, w, h, h * 0.48, 8, 1, 2); c.fill();
  const r = rng(31);
  for (let i = 0; i < 9; i++) WD_.tree(c, (i / 8) * w + (r() - 0.5) * 20, h * (0.5 + r() * 0.04), 0.55 + r() * 0.2, season, i % 3 === 0 ? 1 : 0);
  // галявина
  const ground = night ? (season === 'winter' ? '#A9B8CC' : '#2E4A38') : { spring: '#A8CF86', summer: '#8CC06A', autumn: '#B8A060', winter: '#F2F6FA' }[season];
  c.fillStyle = ground; c.beginPath(); c.moveTo(0, h); c.lineTo(0, h * 0.6); c.quadraticCurveTo(w * 0.5, h * 0.5, w, h * 0.6); c.lineTo(w, h); c.fill();
  c.fillStyle = night ? 'rgba(255,255,255,.04)' : 'rgba(255,255,255,.18)';
  for (let i = 0; i < 40; i++) { c.beginPath(); c.arc(r() * w, h * 0.62 + r() * h * 0.38, 1 + r() * 2, 0, Math.PI * 2); c.fill(); }
  // мох і травичка
  if (season !== 'winter') { c.strokeStyle = night ? '#3E5E48' : '#5E8A4A'; c.lineWidth = 1; for (let i = 0; i < 60; i++) { const gx = r() * w, gy = h * 0.62 + r() * h * 0.38; c.beginPath(); c.moveTo(gx, gy); c.lineTo(gx - 1.5, gy - 4); c.moveTo(gx, gy); c.lineTo(gx + 1.5, gy - 4); c.stroke(); } }
  // предмети та будиночок, впорядковані за глибиною
  const scale = h / 220;
  const items = visibleItems(pts, season).map((it) => {
    const p = st.pos[it.id] || it.pos;
    return { id: it.id, x: p[0] * w, y: p[1] * h };
  });
  const things = [...items, { id: '__house', x: w * 0.5, y: h * 0.76 }].sort((a, b) => a.y - b.y);
  const boxes = [];
  const time = opts.time || 0;
  for (const th of things) {
    const sc = (0.6 + ((th.y / h - 0.55) / 0.42) * 0.55) * scale;
    if (th.id === '__house') WD_.house(c, th.x, th.y, 1.05 * scale, opts.house || houseFor(season), st.roof || ROOFS[0], night, season, time);
    else {
      WD_.item(c, th.id, th.x, th.y, sc, season, night, time);
      boxes.push({ id: th.id, x: th.x - 26 * sc, y: th.y - 42 * sc, w: 52 * sc, h: 46 * sc });
      if (opts.edit) { c.strokeStyle = 'rgba(255,255,255,.7)'; c.setLineDash([3, 3]); c.lineWidth = 1; c.strokeRect(th.x - 24 * sc, th.y - 40 * sc, 48 * sc, 44 * sc); c.setLineDash([]); }
    }
  }
  // сезонні частинки
  const pk = { winter: 'snow', autumn: 'leaves', spring: 'petals', summer: night ? 'fireflies' : '' }[season];
  if (pk && time) Scene.particles(c, w, h, pk, time);
  if (night && !pk) Scene.particles(c, w, h, 'fireflies', time);
  return boxes;
}

function animateWorld(canvas, opts = {}) {
  let raf = 0, stop = false;
  const frame = (ts) => {
    if (stop) return;
    canvas._boxes = drawWorld(canvas, theme(), { ...opts, ...(canvas._opts || {}), time: ts / 1000 || 0.01 });
    if (S.settings.animate !== false && !document.hidden) raf = requestAnimationFrame(frame);
  };
  frame(16);
  return () => { stop = true; cancelAnimationFrame(raf); };
}

/** Знімок світу раз на день для «історії» по місяцях. */
async function snapshotWorld(canvas) {
  const st = worldState();
  const today = D.key(new Date());
  if (st.snapDay === today) return;
  const mk = D.monthKey(new Date());
  canvas.toBlob(async (b) => {
    if (!b) return;
    st.snaps = { ...(st.snaps || {}), [mk]: b };
    st.snapDay = today;
    await saveSettings();
  }, 'image/jpeg', 0.8);
}

function homeWorldHTML() {
  const nx = nextUnlock();
  const season = currentSeason();
  return `<div class="card world-card" style="padding:0;overflow:hidden">
    <canvas id="world-home" style="display:block;width:100%;height:220px"></canvas>
    <a class="row" data-go="/world" style="padding:10px 14px">
      <div class="grow"><div class="serif" style="font-size:17px">Мій куточок · ${SEASON_NAMES[season]}</div>
      <div class="small muted">${nx ? `Ще ${nx.steps} ${plural(nx.steps, 'крок', 'кроки', 'кроків')} — і зʼявиться: ${nx.item.name.toLowerCase()}${nx.item.season ? ' 🍂'.replace('🍂', { winter: '❄️', spring: '🌷', summer: '☀️', autumn: '🍂' }[nx.item.season]) : ''}` : 'Твій світ розквітнув повністю 🌿'}</div></div>${icon('right')}
    </a></div>`;
}

/** Мініатюра будиночка для вибору. */
function drawHouseThumb(cv, style, season) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = cv.clientWidth || 140, h = cv.clientHeight || 110;
  cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
  const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
  const sky = { spring: ['#F7D9E4', '#EEF4E0'], summer: ['#9FD2F0', '#F2F6E2'], autumn: ['#F0B77A', '#F4E6CF'], winter: ['#C6D8EC', '#F4F7FA'] }[season];
  const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, sky[0]); g.addColorStop(1, sky[1]); c.fillStyle = g; c.fillRect(0, 0, w, h);
  c.fillStyle = { spring: '#A8CF86', summer: '#8CC06A', autumn: '#B8A060', winter: '#F2F6FA' }[season];
  c.beginPath(); c.moveTo(0, h); c.lineTo(0, h * 0.8); c.quadraticCurveTo(w / 2, h * 0.72, w, h * 0.8); c.lineTo(w, h); c.fill();
  WD_.house(c, w / 2, h * 0.86, h / 150, style, worldState().roof || ROOFS[0], false, season, 0);
}

function plural(n, one, few, many) {
  const a = Math.abs(n) % 100, b = a % 10;
  if (a > 10 && a < 20) return many;
  if (b > 1 && b < 5) return few;
  if (b === 1) return one;
  return many;
}

let worldTab = 'items';
let worldEdit = false;
let worldHouseSeason = null;
ROUTES.world = async (v) => {
  const pts = worldPoints();
  const season = currentSeason();
  const st = worldState();
  let tab = '';
  const SEASON_ICON = { winter: '❄️', spring: '🌷', summer: '☀️', autumn: '🍂' };
  const itemRow = (it) => {
    const open = unlocked(it);
    const shown = open && !st.hidden.includes(it.id);
    const left = it.at - itemPoints(it);
    return `<div class="row" style="padding:6px 0;opacity:${open ? 1 : 0.55}">
      <span class="grow">${open ? '' : '🔒 '}${esc(it.name)}
      ${open ? '' : `<div class="small muted">ще ${left} ${plural(left, 'крок', 'кроки', 'кроків')}${it.season && it.season !== season ? ` — коли настане ${SEASON_NAMES[it.season]}` : ''}</div>`}</span>
      ${open ? `<span class="switch"><input type="checkbox" data-wtoggle="${it.id}" ${shown ? 'checked' : ''}><span></span></span>` : ''}
      ${open && it.season && it.season !== season ? `<button class="pill ${(st.pinned || []).includes(it.id) ? 'on' : ''}" data-wpin="${it.id}">завжди</button>` : ''}
    </div>`;
  };
  if (worldTab === 'items') {
    const order = ['winter', 'spring', 'summer', 'autumn'];
    const others = order.slice(order.indexOf(season) + 1).concat(order.slice(0, order.indexOf(season)));
    tab = `<div class="small muted">Предмети відкриваються, коли ти заходиш у щоденник і робиш записи. Сезонні нагороди ростуть від днів, коли ти ведеш щоденник саме в цю пору року, і повертаються щороку. Нічого не зникає.</div>
      <div class="serif" style="font-size:17px;margin-top:6px">${SEASON_ICON[season]} ${cap(SEASON_NAMES[season])} · ${seasonPoints(season)} ${plural(seasonPoints(season), 'крок', 'кроки', 'кроків')}</div>
      ${WORLD_ITEMS.filter((it) => it.season === season).map(itemRow).join('')}
      <div class="serif" style="font-size:17px;margin-top:10px">🌿 Завжди в куточку</div>
      ${WORLD_ITEMS.filter((it) => !it.season).map(itemRow).join('')}
      ${others.map((se) => `<div class="serif" style="font-size:17px;margin-top:10px">${SEASON_ICON[se]} ${cap(SEASON_NAMES[se])} · ${seasonPoints(se)} ${plural(seasonPoints(se), 'крок', 'кроки', 'кроків')}</div>
        ${WORLD_ITEMS.filter((it) => it.season === se).map(itemRow).join('')}`).join('')}`;
  } else if (worldTab === 'house') {
    const hs = worldHouseSeason || season;
    const cur = houseFor(hs);
    const sp = seasonPoints(hs);
    const opt = (id, n, at, pts2) => { const lock = pts2 < at; return `<button class="house-opt ${cur === id ? 'on' : ''}" data-whouse="${id}" ${lock ? 'disabled' : ''}>
        <canvas data-hthumb="${id}" style="width:100%;height:100px;display:block;border-radius:10px;${lock ? 'filter:grayscale(.8) opacity(.5)' : ''}"></canvas>
        <span class="small">${lock ? '🔒 ' : ''}${n}${lock ? `<br><span class="muted">ще ${at - pts2} ${plural(at - pts2, 'крок', 'кроки', 'кроків')}</span>` : ''}</span></button>`; };
    tab = `<div class="small muted">Для кожної пори року можна вибрати свій будиночок — він сам зміниться, коли настане сезон.</div>
      <div class="seg">${['winter', 'spring', 'summer', 'autumn'].map((se) => `<button class="${hs === se ? 'on' : ''}" data-whs="${se}">${SEASON_ICON[se]} ${SEASON_NAMES[se]}</button>`).join('')}</div>
      <div class="small muted">${cap(SEASON_NAMES[hs])}: ${sp} ${plural(sp, 'крок', 'кроки', 'кроків')}</div>
      <div class="grid2">${SEASON_HOUSES[hs].map(([id, n, at]) => opt(id, n, at, sp)).join('')}</div>
      <div class="small muted" style="margin-top:8px">Будь-якої пори</div>
      <div class="grid2">${HOUSES.map(([id, n, at]) => opt(id, n, at, pts)).join('')}</div>
      <div class="small muted" style="margin-top:10px">Колір даху</div>
      <div class="row" style="flex-wrap:wrap">${ROOFS.map((c) => `<button data-wroof="${c}" style="width:34px;height:34px;border-radius:50%;background:${c};border:3px solid ${st.roof === c ? 'var(--text)' : 'transparent'}"></button>`).join('')}</div>`;
  } else {
    const snaps = Object.entries(st.snaps || {}).sort((a, b) => b[0].localeCompare(a[0]));
    tab = snaps.length ? `<div class="grid2">${snaps.map(([k, b]) => `<div><img src="${blobURL('snap-' + k, b)}" style="width:100%;border-radius:12px"><div class="small muted center">${D.monthTitle(D.fromKey(k + '-01'))}</div></div>`).join('')}</div>`
      : '<div class="small muted">Тут щомісяця зберігатиметься, як виглядав твій куточок.</div>';
  }
  v.innerHTML = `${topbar('Мій куточок')}
  <div class="page stack">
    <div class="card" style="padding:0;overflow:hidden;touch-action:${worldEdit ? 'none' : 'auto'}"><canvas id="world-big" style="display:block;width:100%;height:340px"></canvas></div>
    <div class="row"><span class="small muted grow">${cap(SEASON_NAMES[season])} · ${pts} ${plural(pts, 'крок', 'кроки', 'кроків')} росту</span>
      <button class="btn ${worldEdit ? 'solid' : ''}" data-act="worldEdit">${icon('house', 18)} ${worldEdit ? 'Готово' : 'Розставити'}</button></div>
    ${worldEdit ? '<div class="small muted center">Перетягуй предмети пальцем, щоб розставити їх на галявині.</div>' : ''}
    <div class="seg">${[['items', 'Колекція'], ['house', 'Будиночок'], ['history', 'Історія']].map(([id, n]) => `<button class="${worldTab === id ? 'on' : ''}" data-wtab="${id}">${n}</button>`).join('')}</div>
    <div class="card stack">${tab}</div>
  </div>`;
  const cv = $('#world-big', v);
  cv._opts = { edit: worldEdit };
  if (worldTab === 'house') $$('[data-hthumb]', v).forEach((t) => drawHouseThumb(t, t.dataset.hthumb, worldHouseSeason || season));
  View.stop = animateWorld(cv);
  // перетягування предметів
  let drag = null;
  const pos = (e) => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top, r.width, r.height]; };
  cv.addEventListener('pointerdown', (e) => {
    if (!worldEdit) return;
    const [x, y] = pos(e);
    const hit = (cv._boxes || []).slice().reverse().find((b) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h);
    if (hit) { drag = hit.id; cv.setPointerCapture(e.pointerId); e.preventDefault(); }
  });
  cv.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const [x, y, w, h] = pos(e);
    st.pos[drag] = [Math.min(0.97, Math.max(0.03, x / w)), Math.min(0.98, Math.max(0.6, (y + 18) / h))];
  });
  const end = async () => { if (drag) { drag = null; await saveSettings(); } };
  cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);

  v.addEventListener('click', async (e) => {
    const tb = e.target.closest('[data-wtab]'), hs = e.target.closest('[data-whouse]'), rf = e.target.closest('[data-wroof]'), pn = e.target.closest('[data-wpin]');
    if (tb) { worldTab = tb.dataset.wtab; render(); }
    else if (hs) { st.houseBy = { ...(st.houseBy || {}), [worldHouseSeason || season]: hs.dataset.whouse }; await saveSettings(); render(); }
    else if (e.target.closest('[data-whs]')) { worldHouseSeason = e.target.closest('[data-whs]').dataset.whs; render(); }
    else if (rf) { st.roof = rf.dataset.wroof; await saveSettings(); render(); }
    else if (pn) { const s2 = new Set(st.pinned || []); s2.has(pn.dataset.wpin) ? s2.delete(pn.dataset.wpin) : s2.add(pn.dataset.wpin); st.pinned = [...s2]; await saveSettings(); render(); }
  });
  v.addEventListener('change', async (e) => {
    const tg = e.target.closest('[data-wtoggle]');
    if (!tg) return;
    const id = tg.dataset.wtoggle;
    st.hidden = tg.checked ? st.hidden.filter((x) => x !== id) : [...st.hidden, id];
    await saveSettings();
  });
};
ACT.worldEdit = () => { worldEdit = !worldEdit; render(); };
