'use strict';
/* own journal — сезонні будиночки та сезонні нагороди для лісового куточка */

const SEASON_HOUSES = {
  spring: [['blossomCottage', 'Квітуча хатинка', 0], ['flowerMushroom', 'Рожевий грибочок', 8], ['greenhouse', 'Скляна оранжерея', 20]],
  summer: [['strawberry', 'Полуничний будиночок', 0], ['strawHut', 'Солом’яна хатка', 8], ['hive', 'Будиночок-вулик', 20]],
  autumn: [['pumpkinHouse', 'Гарбузовий дім', 0], ['autumnMushroom', 'Осінній грибний дім', 8], ['logCabin', 'Зруб із каміном', 20]],
  winter: [['snowCabin', 'Засніжена хатинка', 0], ['gingerbread', 'Пряниковий будиночок', 8], ['snowMushroom', 'Грибочок у гірляндах', 20]],
};

/** Сезонні нагороди: відкриваються за дні, коли ведеш щоденник саме в цю пору року. */
const SEASON_ITEMS = [
  // зима
  { id: 'xmasTree', name: 'Ялинка з іграшками', season: 'winter', at: 2, pos: [0.8, 0.8] },
  { id: 'snowman', name: 'Сніговик', season: 'winter', at: 6, pos: [0.62, 0.88] },
  { id: 'sled', name: 'Санчата', season: 'winter', at: 10, pos: [0.36, 0.92] },
  { id: 'bullfinch', name: 'Снігурі на гілці', season: 'winter', at: 16, pos: [0.12, 0.7] },
  { id: 'gifts', name: 'Подарунки', season: 'winter', at: 24, pos: [0.9, 0.93] },
  { id: 'iceRink', name: 'Ковзанка', season: 'winter', at: 34, pos: [0.2, 0.86] },
  // весна
  { id: 'tulips', name: 'Тюльпани', season: 'spring', at: 2, pos: [0.64, 0.9] },
  { id: 'blossom', name: 'Квітуча вишня', season: 'spring', at: 6, pos: [0.88, 0.66] },
  { id: 'snowdrops', name: 'Проліски', season: 'spring', at: 10, pos: [0.38, 0.92] },
  { id: 'butterflies', name: 'Метелики', season: 'spring', at: 16, pos: [0.5, 0.62] },
  { id: 'ducklings', name: 'Каченята', season: 'spring', at: 24, pos: [0.24, 0.86] },
  { id: 'flowerArch', name: 'Квіткова арка', season: 'spring', at: 34, pos: [0.14, 0.7] },
  // літо
  { id: 'sunflowers', name: 'Соняшники', season: 'summer', at: 2, pos: [0.64, 0.88] },
  { id: 'strawberries', name: 'Полуничні грядки', season: 'summer', at: 6, pos: [0.36, 0.93] },
  { id: 'hammock', name: 'Гамак', season: 'summer', at: 10, pos: [0.88, 0.74] },
  { id: 'kite', name: 'Повітряний змій', season: 'summer', at: 16, pos: [0.22, 0.6] },
  { id: 'picnic', name: 'Пікнік із кавуном', season: 'summer', at: 24, pos: [0.8, 0.94] },
  { id: 'jarFireflies', name: 'Світлячки в банці', season: 'summer', at: 34, pos: [0.08, 0.9] },
  // осінь
  { id: 'pumpkins', name: 'Гарбузи', season: 'autumn', at: 2, pos: [0.64, 0.88] },
  { id: 'maple', name: 'Червоний клен', season: 'autumn', at: 6, pos: [0.9, 0.7] },
  { id: 'leafPile', name: 'Купка листя', season: 'autumn', at: 10, pos: [0.36, 0.93] },
  { id: 'mushBasket', name: 'Кошик грибів', season: 'autumn', at: 16, pos: [0.82, 0.94] },
  { id: 'scarecrow', name: 'Опудало', season: 'autumn', at: 24, pos: [0.12, 0.72] },
  { id: 'apples', name: 'Яблука в кошику', season: 'autumn', at: 34, pos: [0.26, 0.9] },
];

/* ---------- маленькі помічники для полотна ---------- */
const W2 = {
  ell(c, x, y, rx, ry, col, rot = 0) { c.fillStyle = col; c.beginPath(); c.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, Math.PI * 2); c.fill(); },
  circ(c, x, y, r, col) { W2.ell(c, x, y, r, r, col); },
  poly(c, pts, col) { c.fillStyle = col; c.beginPath(); pts.forEach(([px, py], i) => (i ? c.lineTo(px, py) : c.moveTo(px, py))); c.closePath(); c.fill(); },
  rect(c, x, y, w, h, col, r = 0) { c.fillStyle = col; c.beginPath(); if (c.roundRect && r) c.roundRect(x, y, w, h, r); else c.rect(x, y, w, h); c.fill(); },
  line(c, pts, col, w) { c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); pts.forEach(([px, py], i) => (i ? c.lineTo(px, py) : c.moveTo(px, py))); c.stroke(); },
  win(c, x, y, w, h, s, night, round) {
    const col = night ? '#FFD27A' : '#BFE2F2';
    if (night) Art.glow(c, x + w / 2, y + h / 2, w * 1.6, 'rgba(255,200,110,.35)');
    c.fillStyle = col; c.beginPath();
    if (round) c.arc(x + w / 2, y + h / 2, w / 2, 0, Math.PI * 2); else c.rect(x, y, w, h);
    c.fill();
    c.strokeStyle = '#5A3E28'; c.lineWidth = 1.4 * s; c.stroke();
    c.beginPath(); c.moveTo(x + w / 2, y + (round ? 1 : 0)); c.lineTo(x + w / 2, y + h - (round ? 1 : 0)); c.moveTo(x, y + h / 2); c.lineTo(x + w, y + h / 2); c.stroke();
  },
  door(c, x, y, w, h, s, col = '#6B4A30') {
    c.fillStyle = col; c.beginPath(); c.moveTo(x - w / 2, y); c.lineTo(x - w / 2, y - h + w / 2); c.arc(x, y - h + w / 2, w / 2, Math.PI, 0); c.lineTo(x + w / 2, y); c.fill();
    W2.circ(c, x + w * 0.25, y - h * 0.45, 1.3 * s, '#E8B84A');
  },
  flower(c, x, y, r, petal, mid = '#F6CD4A') { for (let p = 0; p < 5; p++) { const a = (p / 5) * Math.PI * 2; W2.circ(c, x + Math.cos(a) * r, y + Math.sin(a) * r, r * 0.75, petal); } W2.circ(c, x, y, r * 0.6, mid); },
  smoke(c, x, y, s, t) { for (let i = 0; i < 3; i++) { const k = ((t || 0) * 0.3 + i / 3) % 1; c.fillStyle = `rgba(230,230,230,${0.55 * (1 - k)})`; c.beginPath(); c.arc(x + Math.sin(k * 6) * 3 * s, y - k * 30 * s, (3 + k * 5) * s, 0, Math.PI * 2); c.fill(); } },
  leaf(c, x, y, r, col, rot) { c.save(); c.translate(x, y); c.rotate(rot); W2.ell(c, 0, 0, r, r * 0.5, col); c.restore(); },
};

/* ---------- сезонні будиночки ---------- */
const HOUSE_ART = {
  blossomCottage(c, x, y, s, roof, night, season, t) {
    WD_.house(c, x, y, s, 'cottage', roof, night, season);
    // квіткові ящики під вікнами і квітуча гілка вздовж стіни
    [[-22, 13], [9, 13]].forEach(([dx, w]) => { W2.rect(c, x + (dx - 1) * s, y - 18 * s, (w + 2) * s, 4 * s, '#8A6040'); for (let i = 0; i < 4; i++) W2.flower(c, x + (dx + 2 + i * 3.2) * s, y - 19 * s, 1.3 * s, i % 2 ? '#F6A3C0' : '#FFFFFF'); });
    const r = rng(12);
    for (let i = 0; i < 16; i++) { const a = i / 15; W2.circ(c, x + (-36 + a * 20) * s + (r() - 0.5) * 4 * s, y + (-38 - a * 26) * s + (r() - 0.5) * 3 * s, (1.6 + r() * 1.2) * s, i % 3 ? '#F6C3D4' : '#FFFFFF'); }
    W2.line(c, [[x - 30 * s, y - 2 * s], [x - 34 * s, y - 20 * s], [x - 33 * s, y - 38 * s]], '#7A5A3A', 1.4 * s);
    for (let i = 0; i < 10; i++) W2.circ(c, x + (-34 + (r() - 0.5) * 6) * s, y - (4 + i * 3.6) * s, 1.8 * s, i % 2 ? '#F6C3D4' : '#9CC77A');
  },
  flowerMushroom(c, x, y, s, roof, night) {
    Art.mushroomHouse(c, x, y, 1.5 * s, '#F4A6C0', '#FFF2E6');
    const r = rng(4);
    for (let i = 0; i < 9; i++) W2.flower(c, x + (-44 + r() * 88) * s, y - r() * 4 * s, (1.6 + r()) * s, ['#FFFFFF', '#F6CD4A', '#B9A6FF'][i % 3], '#F08A5A');
    W2.flower(c, x - 10 * s, y - 110 * s, 3 * s, '#FFFFFF'); W2.flower(c, x + 14 * s, y - 104 * s, 2.4 * s, '#FFF6B0', '#F08A9A');
  },
  greenhouse(c, x, y, s, roof, night) {
    const w = 64 * s, h = 40 * s;
    if (night) Art.glow(c, x, y - 30 * s, 60 * s, 'rgba(255,220,140,.3)');
    W2.rect(c, x - w / 2, y - h, w, h, night ? 'rgba(255,230,170,.55)' : 'rgba(205,236,244,.75)');
    W2.poly(c, [[x - w / 2 - 3 * s, y - h], [x, y - h - 26 * s], [x + w / 2 + 3 * s, y - h]], night ? 'rgba(255,230,170,.5)' : 'rgba(215,240,248,.8)');
    // рослини всередині
    const r = rng(8);
    for (let i = 0; i < 9; i++) W2.circ(c, x + (-26 + i * 6.5) * s, y - (8 + r() * 14) * s, (5 + r() * 3) * s, i % 2 ? '#6FA052' : '#8FBF6A');
    [[-18, '#F4A6C0'], [-2, '#F6CD4A'], [16, '#E2546B']].forEach(([dx, col]) => W2.flower(c, x + dx * s, y - 22 * s, 2.2 * s, col));
    c.strokeStyle = '#F4F4EE'; c.lineWidth = 2.2 * s;
    c.strokeRect(x - w / 2, y - h, w, h);
    for (let i = 1; i < 4; i++) { c.beginPath(); c.moveTo(x - w / 2 + (w / 4) * i, y); c.lineTo(x - w / 2 + (w / 4) * i, y - h); c.stroke(); }
    c.beginPath(); c.moveTo(x - w / 2, y - h / 2); c.lineTo(x + w / 2, y - h / 2); c.stroke();
    c.beginPath(); c.moveTo(x - w / 2 - 3 * s, y - h); c.lineTo(x, y - h - 26 * s); c.lineTo(x + w / 2 + 3 * s, y - h); c.moveTo(x, y - h - 26 * s); c.lineTo(x, y - h); c.stroke();
    W2.rect(c, x - 6 * s, y - 20 * s, 12 * s, 20 * s, 'rgba(255,255,255,.35)'); c.strokeRect(x - 6 * s, y - 20 * s, 12 * s, 20 * s);
    W2.rect(c, x - w / 2 - 4 * s, y - 3 * s, w + 8 * s, 3 * s, '#8A6040');
  },
  strawberry(c, x, y, s, roof, night) {
    if (night) Art.glow(c, x, y - 40 * s, 70 * s, 'rgba(255,200,110,.25)');
    c.fillStyle = '#E2434B'; c.beginPath();
    c.moveTo(x, y); c.bezierCurveTo(x - 30 * s, y - 4 * s, x - 46 * s, y - 50 * s, x - 30 * s, y - 70 * s);
    c.bezierCurveTo(x - 16 * s, y - 84 * s, x + 16 * s, y - 84 * s, x + 30 * s, y - 70 * s);
    c.bezierCurveTo(x + 46 * s, y - 50 * s, x + 30 * s, y - 4 * s, x, y); c.fill();
    W2.ell(c, x - 14 * s, y - 60 * s, 8 * s, 14 * s, 'rgba(255,255,255,.18)', 0.4);
    const r = rng(6);
    for (let i = 0; i < 26; i++) { const a = r() * Math.PI * 2, d = r(); const px = x + Math.cos(a) * d * 30 * s, py = y - 42 * s + Math.sin(a) * d * 30 * s; W2.ell(c, px, py, 1.3 * s, 2 * s, '#F8D86A'); }
    // зелена корона з хвостиком-димарем
    for (let i = 0; i < 7; i++) { const a = Math.PI + (i / 6) * Math.PI; W2.leaf(c, x + Math.cos(a) * 20 * s, y - 76 * s + Math.sin(a) * 8 * s, 12 * s, i % 2 ? '#4E8A3E' : '#6FA052', a + Math.PI / 2 * 0); }
    W2.rect(c, x - 2.5 * s, y - 98 * s, 5 * s, 16 * s, '#5E8A3E', 2 * s);
    W2.win(c, x - 22 * s, y - 52 * s, 13 * s, 13 * s, s, night, true);
    W2.win(c, x + 9 * s, y - 52 * s, 13 * s, 13 * s, s, night, true);
    W2.door(c, x, y, 14 * s, 24 * s, s, '#7A4A30');
  },
  strawHut(c, x, y, s, roof, night, season, t) {
    if (night) Art.glow(c, x, y - 30 * s, 70 * s, 'rgba(255,200,110,.25)');
    W2.rect(c, x - 30 * s, y - 34 * s, 60 * s, 34 * s, '#EADCB8', 6 * s);
    c.fillStyle = '#D9B45A'; c.beginPath(); c.moveTo(x - 42 * s, y - 30 * s); c.quadraticCurveTo(x - 30 * s, y - 70 * s, x, y - 82 * s); c.quadraticCurveTo(x + 30 * s, y - 70 * s, x + 42 * s, y - 30 * s); c.quadraticCurveTo(x, y - 36 * s, x - 42 * s, y - 30 * s); c.fill();
    c.strokeStyle = '#B48A3A'; c.lineWidth = 1.2 * s;
    for (let i = 0; i < 9; i++) { const k = i / 8; c.beginPath(); c.moveTo(x + (-36 + k * 72) * s, y - 33 * s); c.lineTo(x + (-10 + k * 20) * s, y - 72 * s); c.stroke(); }
    W2.win(c, x - 22 * s, y - 24 * s, 12 * s, 11 * s, s, night);
    W2.win(c, x + 10 * s, y - 24 * s, 12 * s, 11 * s, s, night);
    W2.door(c, x, y, 13 * s, 22 * s, s);
    for (let i = 0; i < 2; i++) { const fx = x + (38 + i * 8) * s, h2 = (30 + i * 6) * s; W2.line(c, [[fx, y], [fx, y - h2]], '#5E8A3E', 2 * s); for (let p = 0; p < 10; p++) { const a = (p / 10) * Math.PI * 2; W2.ell(c, fx + Math.cos(a) * 5 * s, y - h2 + Math.sin(a) * 5 * s, 2.6 * s, 1.4 * s, '#F6C33A', a); } W2.circ(c, fx, y - h2, 3.2 * s, '#6B4A30'); }
  },
  hive(c, x, y, s, roof, night, season, t) {
    if (night) Art.glow(c, x, y - 40 * s, 70 * s, 'rgba(255,200,110,.3)');
    const bands = [[36, 0], [33, -16], [28, -31], [21, -45], [13, -57]];
    bands.forEach(([rw, dy], i) => W2.ell(c, x, y + (dy - 8) * s, rw * s, 10 * s, i % 2 ? '#E9A83A' : '#F6C65A'));
    W2.ell(c, x, y - 70 * s, 7 * s, 5 * s, '#E9A83A');
    W2.door(c, x, y, 16 * s, 22 * s, s, '#5A3A1E');
    W2.win(c, x - 22 * s, y - 34 * s, 10 * s, 10 * s, s, night, true);
    W2.win(c, x + 12 * s, y - 34 * s, 10 * s, 10 * s, s, night, true);
    for (let i = 0; i < 3; i++) {
      const bx = x + Math.cos((t || 0) * 1.4 + i * 2) * 40 * s, by = y - 60 * s + Math.sin((t || 0) * 2 + i) * 12 * s;
      W2.ell(c, bx, by, 3.4 * s, 2.4 * s, '#F6C65A'); W2.line(c, [[bx - 1 * s, by - 2.4 * s], [bx - 1 * s, by + 2.4 * s]], '#2B2420', 1 * s);
      W2.ell(c, bx, by - 3 * s, 2.4 * s, 1.6 * s, 'rgba(255,255,255,.8)');
    }
  },
  pumpkinHouse(c, x, y, s, roof, night) {
    if (night) Art.glow(c, x, y - 36 * s, 80 * s, 'rgba(255,170,80,.3)');
    [[-26, 22, '#D9692A'], [26, 22, '#D9692A'], [-13, 28, '#E8822E'], [13, 28, '#E8822E'], [0, 30, '#F0913A']].forEach(([dx, rw, col]) => W2.ell(c, x + dx * s, y - 34 * s, rw * s, 34 * s, col));
    W2.ell(c, x - 10 * s, y - 52 * s, 5 * s, 12 * s, 'rgba(255,255,255,.15)', 0.2);
    W2.rect(c, x - 4 * s, y - 80 * s, 8 * s, 14 * s, '#5E7A3A', 2 * s);
    c.strokeStyle = '#5E7A3A'; c.lineWidth = 2 * s; c.beginPath(); c.moveTo(x + 4 * s, y - 72 * s); c.quadraticCurveTo(x + 18 * s, y - 80 * s, x + 14 * s, y - 66 * s); c.stroke();
    W2.win(c, x - 26 * s, y - 46 * s, 12 * s, 12 * s, s, night, true);
    W2.win(c, x + 14 * s, y - 46 * s, 12 * s, 12 * s, s, night, true);
    W2.door(c, x, y, 16 * s, 28 * s, s, '#6B3E22');
  },
  autumnMushroom(c, x, y, s, roof, night, season, t) {
    Art.mushroomHouse(c, x, y, 1.5 * s, '#B5552E', '#F1E4CC');
    const r = rng(14);
    for (let i = 0; i < 7; i++) W2.leaf(c, x + (-36 + r() * 72) * s, y - (86 + r() * 26) * s, 4 * s, ['#E8822E', '#C9432E', '#F2B33A'][i % 3], r() * 3);
    for (let i = 0; i < 8; i++) W2.leaf(c, x + (-48 + r() * 96) * s, y - r() * 3 * s, 4 * s, ['#E8822E', '#C9432E', '#F2B33A'][i % 3], r() * 3);
  },
  logCabin(c, x, y, s, roof, night, season, t) {
    if (night) Art.glow(c, x, y - 30 * s, 70 * s, 'rgba(255,190,100,.3)');
    W2.rect(c, x + 16 * s, y - 80 * s, 12 * s, 40 * s, '#8E8A82');
    for (let i = 0; i < 6; i++) W2.rect(c, x - 34 * s, y - (i + 1) * 7 * s, 68 * s, 7 * s, i % 2 ? '#8A5A36' : '#9A6A42', 3.5 * s);
    for (let i = 0; i < 6; i++) { W2.circ(c, x - 34 * s, y - (i + 0.5) * 7 * s, 3.4 * s, '#C9985E'); W2.circ(c, x + 34 * s, y - (i + 0.5) * 7 * s, 3.4 * s, '#C9985E'); }
    W2.poly(c, [[x - 42 * s, y - 40 * s], [x, y - 72 * s], [x + 42 * s, y - 40 * s]], roof);
    W2.poly(c, [[x - 42 * s, y - 40 * s], [x, y - 72 * s], [x + 42 * s, y - 40 * s], [x + 42 * s, y - 37 * s], [x, y - 68 * s], [x - 42 * s, y - 37 * s]], 'rgba(0,0,0,.2)');
    W2.smoke(c, x + 22 * s, y - 84 * s, s, t);
    W2.win(c, x - 26 * s, y - 30 * s, 14 * s, 12 * s, s, night);
    W2.win(c, x + 12 * s, y - 30 * s, 14 * s, 12 * s, s, night);
    W2.door(c, x, y, 13 * s, 24 * s, s, '#5A3A20');
    // ліхтарик біля дверей
    W2.rect(c, x + 8 * s, y - 22 * s, 4 * s, 6 * s, '#FFD27A'); if (night) Art.glow(c, x + 10 * s, y - 19 * s, 16 * s, 'rgba(255,200,110,.5)');
  },
  snowCabin(c, x, y, s, roof, night, season, t) {
    HOUSE_ART.logCabin(c, x, y, s, roof, night, season, t);
    c.fillStyle = '#F6FAFD'; c.beginPath(); c.moveTo(x - 46 * s, y - 38 * s); c.quadraticCurveTo(x - 20 * s, y - 64 * s, x, y - 76 * s); c.quadraticCurveTo(x + 20 * s, y - 64 * s, x + 46 * s, y - 38 * s); c.quadraticCurveTo(x + 40 * s, y - 44 * s, x + 30 * s, y - 42 * s); c.lineTo(x, y - 64 * s); c.lineTo(x - 30 * s, y - 42 * s); c.quadraticCurveTo(x - 40 * s, y - 44 * s, x - 46 * s, y - 38 * s); c.fill();
    W2.ell(c, x + 22 * s, y - 80 * s, 8 * s, 3 * s, '#F6FAFD');
    c.fillStyle = '#DCEFFA'; for (let i = 0; i < 8; i++) { const ix = x + (-38 + i * 10) * s, iy = y - 40 * s + Math.abs(i - 3.5) * 0.4 * s; c.beginPath(); c.moveTo(ix - 2 * s, iy); c.lineTo(ix, iy + (5 + (i % 3) * 2) * s); c.lineTo(ix + 2 * s, iy); c.fill(); }
    c.strokeStyle = '#3E7A4A'; c.lineWidth = 3 * s; c.beginPath(); c.arc(x, y - 17 * s, 5 * s, 0, Math.PI * 2); c.stroke(); W2.circ(c, x, y - 12 * s, 1.6 * s, '#D9364A');
    W2.rect(c, x - 40 * s, y - 3 * s, 80 * s, 4 * s, '#F6FAFD', 2 * s);
  },
  gingerbread(c, x, y, s, roof, night) {
    if (night) Art.glow(c, x, y - 30 * s, 70 * s, 'rgba(255,200,110,.3)');
    W2.rect(c, x - 30 * s, y - 40 * s, 60 * s, 40 * s, '#B5733E', 3 * s);
    W2.poly(c, [[x - 40 * s, y - 38 * s], [x, y - 74 * s], [x + 40 * s, y - 38 * s]], '#9A5A2E');
    c.strokeStyle = '#FFFFFF'; c.lineWidth = 3 * s; c.lineCap = 'round';
    c.beginPath(); for (let i = 0; i <= 10; i++) { const k = i / 10; const px = x - 40 * s + k * 40 * s, py = y - 38 * s - k * 36 * s; i ? c.lineTo(px + (i % 2 ? 2 : -2) * s, py + (i % 2 ? 3 : 0) * s) : c.moveTo(px, py); } c.stroke();
    c.beginPath(); for (let i = 0; i <= 10; i++) { const k = i / 10; const px = x + k * 40 * s, py = y - 74 * s + k * 36 * s; i ? c.lineTo(px + (i % 2 ? -2 : 2) * s, py + (i % 2 ? 3 : 0) * s) : c.moveTo(px, py); } c.stroke();
    c.beginPath(); for (let i = 0; i <= 12; i++) { const px = x - 30 * s + i * 5 * s; i ? c.quadraticCurveTo(px - 2.5 * s, y - 34 * s, px, y - 40 * s) : c.moveTo(px, y - 40 * s); } c.stroke();
    [['#E2434B', -32], ['#6FB2E6', -20], ['#F6CD4A', -8], ['#8FCF8A', 8], ['#E2434B', 20], ['#F6A3C0', 32]].forEach(([col, dx], i) => W2.circ(c, x + dx * 0.9 * s, y - (44 + Math.abs(dx) * -0.0 + (36 - Math.abs(dx)) * 0.7) * s, 2.6 * s, col));
    W2.win(c, x - 24 * s, y - 30 * s, 12 * s, 11 * s, s, night);
    W2.win(c, x + 12 * s, y - 30 * s, 12 * s, 11 * s, s, night);
    W2.door(c, x, y, 13 * s, 22 * s, s, '#7A3E1E');
    // льодяник біля дверей
    c.lineWidth = 3 * s; c.strokeStyle = '#FFFFFF'; c.beginPath(); c.moveTo(x + 22 * s, y); c.lineTo(x + 22 * s, y - 16 * s); c.arc(x + 26 * s, y - 16 * s, 4 * s, Math.PI, 0); c.stroke();
    c.strokeStyle = '#E2434B'; c.lineWidth = 1.4 * s; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(x + 20.5 * s, y - (2 + i * 4) * s); c.lineTo(x + 23.5 * s, y - (4 + i * 4) * s); c.stroke(); }
  },
  snowMushroom(c, x, y, s, roof, night, season, t) {
    Art.mushroomHouse(c, x, y, 1.5 * s, '#C8473B', '#F1E4CC');
    c.fillStyle = '#F6FAFD'; c.beginPath(); c.moveTo(x - 42 * s, y - 80 * s); c.quadraticCurveTo(x - 36 * s, y - 113 * s, x, y - 118 * s); c.quadraticCurveTo(x + 36 * s, y - 113 * s, x + 42 * s, y - 80 * s); c.quadraticCurveTo(x + 30 * s, y - 90 * s, x + 18 * s, y - 86 * s); c.quadraticCurveTo(x + 4 * s, y - 97 * s, x - 12 * s, y - 87 * s); c.quadraticCurveTo(x - 28 * s, y - 92 * s, x - 42 * s, y - 80 * s); c.fill();
    Art.bulbs(c, x - 46 * s, y - 56 * s, x + 46 * s, y - 56 * s, 12 * s, ['rgb(255,214,110)', 'rgb(255,150,150)', 'rgb(150,220,170)', 'rgb(150,190,255)'], 9);
  },
};

/* ---------- сезонні предмети ---------- */
const ITEM_ART = {
  xmasTree(c, x, y, s, season, night, t) {
    W2.rect(c, x - 3 * s, y - 8 * s, 6 * s, 8 * s, '#6B4A30');
    [[0, 40, 26], [0, 30, 20], [0, 20, 14]].forEach(([, h, w], i) => W2.poly(c, [[x - w * s, y - (8 + i * 12) * s], [x, y - (8 + i * 12 + 22) * s], [x + w * s, y - (8 + i * 12) * s]], i % 2 ? '#3E7A4A' : '#2E6A40'));
    c.fillStyle = 'rgba(246,250,253,.85)'; [[0], [1], [2]].forEach(([i]) => { c.beginPath(); c.ellipse(x, y - (9 + i * 12) * s, (24 - i * 6) * s, 2 * s, 0, 0, Math.PI * 2); c.fill(); });
    const cols = ['#E2434B', '#F6CD4A', '#6FB2E6', '#F6A3C0'];
    const r = rng(2);
    for (let i = 0; i < 10; i++) { const lv = i % 3, k = r() - 0.5; const bx = x + k * (36 - lv * 12) * s, by = y - (14 + lv * 12 + r() * 6) * s; const blink = 0.6 + 0.4 * Math.sin((t || 0) * 3 + i); if (night) Art.glow(c, bx, by, 6 * s, `rgba(255,220,140,${0.35 * blink})`); W2.circ(c, bx, by, 2.2 * s, cols[i % 4]); }
    c.fillStyle = '#F6CD4A'; c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i / 10) * Math.PI * 2, rr = (i % 2 ? 2.4 : 5.5) * s; const px = x + Math.cos(a) * rr, py = y - 54 * s + Math.sin(a) * rr; i ? c.lineTo(px, py) : c.moveTo(px, py); } c.fill();
  },
  sled(c, x, y, s) {
    W2.rect(c, x - 16 * s, y - 12 * s, 32 * s, 5 * s, '#C8473B', 2 * s);
    W2.rect(c, x - 14 * s, y - 17 * s, 28 * s, 4 * s, '#B5383A', 2 * s);
    c.strokeStyle = '#6B4A30'; c.lineWidth = 2 * s; c.beginPath(); c.moveTo(x - 18 * s, y - 2 * s); c.lineTo(x + 14 * s, y - 2 * s); c.quadraticCurveTo(x + 22 * s, y - 2 * s, x + 20 * s, y - 9 * s); c.stroke();
    [[-10], [8]].forEach(([dx]) => W2.line(c, [[x + dx * s, y - 7 * s], [x + dx * s, y - 2 * s]], '#6B4A30', 2 * s));
    W2.line(c, [[x - 16 * s, y - 10 * s], [x - 26 * s, y - 20 * s]], '#E9D9B8', 1.2 * s);
  },
  bullfinch(c, x, y, s, season, night, t) {
    W2.line(c, [[x - 26 * s, y - 30 * s], [x - 4 * s, y - 26 * s], [x + 22 * s, y - 34 * s]], '#5A3E28', 2.4 * s);
    W2.line(c, [[x - 26 * s, y - 31.5 * s], [x + 22 * s, y - 35.5 * s]], '#F6FAFD', 1.4 * s);
    [[-12, 0], [8, 1]].forEach(([dx, k]) => {
      const bx = x + dx * s, by = y - 34 * s - k * 3 * s + Math.sin((t || 0) * 2 + k) * 0.6 * s;
      W2.ell(c, bx, by - 3 * s, 5 * s, 4.6 * s, '#E2543E'); W2.ell(c, bx + 1 * s, by - 7 * s, 3.6 * s, 3.2 * s, '#2B2420');
      W2.ell(c, bx - 2.5 * s, by - 4 * s, 3.6 * s, 3 * s, '#5E6A7A', 0.3); W2.poly(c, [[bx + 4 * s, by - 7 * s], [bx + 6.5 * s, by - 6.5 * s], [bx + 4 * s, by - 5.6 * s]], '#3A3A3A');
      W2.circ(c, bx + 1.8 * s, by - 7.6 * s, 0.6 * s, '#FFF');
    });
    [[-20, -32], [16, -33]].forEach(([dx, dy]) => W2.circ(c, x + dx * s, y + dy * s, 1.6 * s, '#D9364A'));
  },
  gifts(c, x, y, s) {
    [[-10, 14, 12, '#E2434B', '#F6CD4A'], [6, 12, 16, '#6FB2E6', '#FFFFFF'], [-1, 8, 8, '#8FCF8A', '#E2434B']].forEach(([dx, w, h, col, rib], i) => {
      const bx = x + dx * s - (w / 2) * s, by = y - h * s - (i === 2 ? 0 : 0);
      W2.rect(c, bx, by, w * s, h * s, col, 1 * s); W2.rect(c, bx + (w / 2 - 1) * s, by, 2 * s, h * s, rib); W2.rect(c, bx, by + (h / 2 - 1) * s, w * s, 2 * s, rib);
      W2.ell(c, bx + (w / 2 - 2) * s, by - 1 * s, 2.4 * s, 1.6 * s, rib, -0.4); W2.ell(c, bx + (w / 2 + 2) * s, by - 1 * s, 2.4 * s, 1.6 * s, rib, 0.4);
    });
  },
  iceRink(c, x, y, s, season) {
    W2.ell(c, x, y - 5 * s, 32 * s, 9 * s, season === 'winter' ? '#BFE0F0' : '#9FC8E0');
    c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 1 * s; c.beginPath(); c.ellipse(x - 4 * s, y - 6 * s, 16 * s, 3 * s, 0.1, 0.2, 2.6); c.stroke(); c.beginPath(); c.ellipse(x + 8 * s, y - 4 * s, 10 * s, 2 * s, -0.1, 3.4, 5.8); c.stroke();
    // ковзани
    W2.rect(c, x + 18 * s, y - 16 * s, 6 * s, 8 * s, '#FFFFFF', 1.5 * s); W2.rect(c, x + 18 * s, y - 9 * s, 9 * s, 2.4 * s, '#FFFFFF', 1 * s); W2.line(c, [[x + 17 * s, y - 5.6 * s], [x + 28 * s, y - 5.6 * s]], '#9AA4AE', 1.2 * s);
  },
  tulips(c, x, y, s) {
    const cols = ['#E2434B', '#F6A3C0', '#F6CD4A', '#B9A6FF', '#F08A5A'];
    for (let i = 0; i < 7; i++) {
      const fx = x + (i - 3) * 5 * s, h = (14 + (i % 3) * 4) * s;
      W2.line(c, [[fx, y], [fx, y - h]], '#5E8A3E', 1.6 * s);
      W2.leaf(c, fx + 2 * s, y - 4 * s, 4 * s, '#6FA052', -1.2);
      c.fillStyle = cols[i % 5]; c.beginPath(); c.moveTo(fx - 3 * s, y - h); c.quadraticCurveTo(fx - 3.4 * s, y - h - 7 * s, fx - 1.5 * s, y - h - 7 * s); c.lineTo(fx, y - h - 4.5 * s); c.lineTo(fx + 1.5 * s, y - h - 7 * s); c.quadraticCurveTo(fx + 3.4 * s, y - h - 7 * s, fx + 3 * s, y - h); c.quadraticCurveTo(fx, y - h + 2 * s, fx - 3 * s, y - h); c.fill();
    }
  },
  snowdrops(c, x, y, s) {
    for (let i = 0; i < 6; i++) {
      const fx = x + (i - 2.5) * 5 * s, h = (10 + (i % 2) * 3) * s;
      c.strokeStyle = '#6FA052'; c.lineWidth = 1.2 * s; c.beginPath(); c.moveTo(fx, y); c.quadraticCurveTo(fx, y - h, fx + 3 * s, y - h - 1 * s); c.stroke();
      W2.ell(c, fx + 3 * s, y - h + 2.5 * s, 1.9 * s, 3 * s, '#FFFFFF'); W2.ell(c, fx + 1.7 * s, y - h + 2.6 * s, 1.2 * s, 2.6 * s, '#F2F6F0', 0.3);
      W2.leaf(c, fx - 1.5 * s, y - 3 * s, 4 * s, '#7FAE6A', -1.3);
    }
  },
  butterflies(c, x, y, s, season, night, t) {
    const cols = ['#F6A3C0', '#F6CD4A', '#9AC8F0', '#B9A6FF'];
    for (let i = 0; i < 4; i++) {
      const bx = x + Math.sin((t || 0) * 0.6 + i * 1.7) * 60 * s, by = y - 20 * s + Math.cos((t || 0) * 0.9 + i) * 14 * s;
      Art.butterfly(c, bx, by, 0.7 * s, cols[i], Math.abs(Math.sin((t || 0) * 8 + i)));
    }
  },
  ducklings(c, x, y, s, season, night, t) {
    W2.ell(c, x, y - 3 * s, 26 * s, 6 * s, '#7FB8D8');
    const duck = (dx, k) => { const bx = x + dx * s, by = y - 6 * s + Math.sin((t || 0) * 2 + dx) * 0.6 * s; W2.ell(c, bx, by, 5.5 * k * s, 4 * k * s, '#F6D24A'); W2.circ(c, bx + 4 * k * s, by - 4.6 * k * s, 3.2 * k * s, '#F6D24A'); W2.poly(c, [[bx + 6.6 * k * s, by - 5 * k * s], [bx + 9.5 * k * s, by - 4.2 * k * s], [bx + 6.6 * k * s, by - 3.4 * k * s]], '#F08A3A'); W2.circ(c, bx + 4.8 * k * s, by - 5.4 * k * s, 0.7 * s, '#2B2420'); };
    duck(-14, 1.15); duck(-2, 0.8); duck(8, 0.8); duck(17, 0.8);
  },
  flowerArch(c, x, y, s) {
    c.strokeStyle = '#8A6040'; c.lineWidth = 3 * s; c.beginPath(); c.moveTo(x - 18 * s, y); c.lineTo(x - 18 * s, y - 30 * s); c.arc(x, y - 30 * s, 18 * s, Math.PI, 0); c.lineTo(x + 18 * s, y); c.stroke();
    const r = rng(21);
    for (let i = 0; i < 26; i++) {
      const k = i / 25; let px, py;
      if (k < 0.3) { px = x - 18 * s; py = y - (k / 0.3) * 30 * s; } else if (k > 0.7) { px = x + 18 * s; py = y - ((1 - k) / 0.3) * 30 * s; } else { const a = Math.PI + ((k - 0.3) / 0.4) * Math.PI; px = x + Math.cos(a) * 18 * s; py = y - 30 * s + Math.sin(a) * 18 * s; }
      if (i % 2) W2.leaf(c, px + (r() - 0.5) * 4 * s, py, 3 * s, '#6FA052', r() * 3); else W2.flower(c, px + (r() - 0.5) * 3 * s, py, 1.5 * s, ['#F6A3C0', '#FFFFFF', '#B9A6FF'][i % 3]);
    }
  },
  strawberries(c, x, y, s) {
    for (let row = 0; row < 2; row++) {
      W2.ell(c, x, y - 2 * s - row * 7 * s, 26 * s, 3.6 * s, '#7A5236');
      for (let i = 0; i < 5; i++) {
        const fx = x + (i - 2) * 10 * s + row * 4 * s, fy = y - 5 * s - row * 7 * s;
        [[-3, 0], [3, 0], [0, -3]].forEach(([dx, dy]) => W2.leaf(c, fx + dx * s, fy + dy * s, 3.6 * s, '#4E8A3E', dx * 0.5));
        c.fillStyle = '#E2434B'; c.beginPath(); c.moveTo(fx + 2 * s, fy); c.quadraticCurveTo(fx + 5 * s, fy + 1 * s, fx + 3.5 * s, fy + 4.5 * s); c.quadraticCurveTo(fx + 2 * s, fy + 5.5 * s, fx + 0.5 * s, fy + 4.5 * s); c.quadraticCurveTo(fx - 1 * s, fy + 1 * s, fx + 2 * s, fy); c.fill();
      }
    }
  },
  hammock(c, x, y, s, season, night, t) {
    WD_.tree(c, x - 22 * s, y, 1.2 * s, season); WD_.tree(c, x + 22 * s, y, 1.2 * s, season);
    const sw = Math.sin((t || 0) * 1.1) * 1.6 * s;
    c.fillStyle = '#F0E0C0'; c.beginPath(); c.moveTo(x - 19 * s, y - 22 * s); c.quadraticCurveTo(x + sw, y - 4 * s, x + 19 * s, y - 22 * s); c.quadraticCurveTo(x + sw, y - 10 * s, x - 19 * s, y - 22 * s); c.fill();
    c.strokeStyle = '#E2834B'; c.lineWidth = 1.2 * s; for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(x + i * 6 * s + sw, y - 14 * s); c.lineTo(x + i * 6 * s + sw, y - 9 * s + Math.abs(i) * -2 * s); c.stroke(); }
  },
  kite(c, x, y, s, season, night, t) {
    const kx = x + Math.sin((t || 0) * 0.8) * 6 * s, ky = y - 70 * s + Math.cos((t || 0) * 1.1) * 4 * s;
    c.strokeStyle = 'rgba(80,60,40,.6)'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(x + 10 * s, y); c.quadraticCurveTo(x + 20 * s, y - 40 * s, kx, ky + 10 * s); c.stroke();
    W2.poly(c, [[kx, ky - 12 * s], [kx + 9 * s, ky], [kx, ky + 12 * s], [kx - 9 * s, ky]], '#E2434B');
    W2.poly(c, [[kx, ky - 12 * s], [kx + 9 * s, ky], [kx, ky]], '#F6CD4A'); W2.poly(c, [[kx, ky + 12 * s], [kx - 9 * s, ky], [kx, ky]], '#F6CD4A');
    c.strokeStyle = '#6FB2E6'; c.lineWidth = 1.2 * s; c.beginPath(); c.moveTo(kx, ky + 12 * s); for (let i = 1; i < 6; i++) c.lineTo(kx + Math.sin((t || 0) * 3 + i) * 3 * s, ky + (12 + i * 5) * s); c.stroke();
    for (let i = 1; i < 4; i++) W2.ell(c, kx + Math.sin((t || 0) * 3 + i * 1.6) * 3 * s, ky + (14 + i * 7) * s, 2 * s, 1.2 * s, ['#F6A3C0', '#8FCF8A', '#F6CD4A'][i - 1]);
  },
  picnic(c, x, y, s) {
    c.save(); c.translate(x, y - 5 * s); c.scale(1, 0.4); c.rotate(0.3);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) W2.rect(c, (-20 + i * 10) * s, (-20 + j * 10) * s, 10 * s, 10 * s, (i + j) % 2 ? '#E2434B' : '#FFF4EC');
    c.restore();
    // скибочки кавуна
    [[-6, 0.3], [5, -0.2]].forEach(([dx, rot]) => { c.save(); c.translate(x + dx * s, y - 8 * s); c.rotate(rot); c.fillStyle = '#4E8A3E'; c.beginPath(); c.arc(0, 0, 7 * s, 0, Math.PI); c.fill(); c.fillStyle = '#F2586A'; c.beginPath(); c.arc(0, 0, 5.6 * s, 0, Math.PI); c.fill(); c.fillStyle = '#2B2420'; [[-2, 2], [1, 3], [3, 1.5]].forEach(([px, py]) => { c.beginPath(); c.arc(px * s, py * s, 0.6 * s, 0, Math.PI * 2); c.fill(); }); c.restore(); });
    W2.rect(c, x + 12 * s, y - 14 * s, 9 * s, 9 * s, '#C9985E', 2 * s); W2.line(c, [[x + 13 * s, y - 14 * s], [x + 16.5 * s, y - 19 * s], [x + 20 * s, y - 14 * s]], '#8A6040', 1.4 * s);
  },
  jarFireflies(c, x, y, s, season, night, t) {
    if (night) Art.glow(c, x, y - 10 * s, 24 * s, 'rgba(250,240,150,.45)');
    W2.rect(c, x - 7 * s, y - 20 * s, 14 * s, 20 * s, 'rgba(220,240,240,.55)', 4 * s);
    W2.rect(c, x - 6 * s, y - 23 * s, 12 * s, 4 * s, '#8A6040', 1 * s);
    for (let i = 0; i < 5; i++) { const g = 0.5 + 0.5 * Math.sin((t || 0) * 3 + i * 1.3); W2.circ(c, x + Math.sin(i * 2.1 + (t || 0)) * 4 * s, y - (5 + i * 3) * s, 1.4 * s, `rgba(255,240,140,${0.4 + g * 0.6})`); }
  },
  maple(c, x, y, s, season, night, t) {
    W2.rect(c, x - 3 * s, y - 30 * s, 6 * s, 30 * s, '#6B4A30');
    [[0, -46, 20, '#C9432E'], [-14, -36, 14, '#E06A32'], [14, -36, 14, '#D9532E'], [0, -60, 13, '#E8822E']].forEach(([dx, dy, r, col]) => W2.circ(c, x + dx * s, y + dy * s, r * s, col));
    for (let i = 0; i < 4; i++) { const k = (((t || 0) * 0.15 + i / 4) % 1); W2.leaf(c, x + (-20 + i * 14) * s + Math.sin(k * 8) * 6 * s, y - 40 * s + k * 40 * s, 3 * s, '#E06A32', k * 6); }
  },
  leafPile(c, x, y, s) {
    const r = rng(17);
    for (let i = 0; i < 38; i++) { const a = r() * Math.PI, d = r(); W2.leaf(c, x + Math.cos(a) * d * 22 * s, y - Math.sin(a) * d * 12 * s, 3.4 * s, ['#E8822E', '#C9432E', '#F2B33A', '#A8532E'][i % 4], r() * 6); }
  },
  mushBasket(c, x, y, s) {
    c.strokeStyle = '#8A6040'; c.lineWidth = 2 * s; c.beginPath(); c.arc(x, y - 12 * s, 11 * s, Math.PI, 0); c.stroke();
    [[-6, '#C8473B'], [0, '#A8744A'], [6, '#C8473B']].forEach(([dx, cap]) => Art.smallMushroom(c, x + dx * s, y - 9 * s, 0.9 * s, cap));
    c.fillStyle = '#B5844E'; c.beginPath(); c.moveTo(x - 12 * s, y - 11 * s); c.lineTo(x + 12 * s, y - 11 * s); c.lineTo(x + 9 * s, y); c.lineTo(x - 9 * s, y); c.fill();
    c.strokeStyle = '#8A6040'; c.lineWidth = 1 * s; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(x - 11 * s + i * 0.6 * s, y - 8 * s + i * 3 * s); c.lineTo(x + 11 * s - i * 0.6 * s, y - 8 * s + i * 3 * s); c.stroke(); }
  },
  scarecrow(c, x, y, s, season, night, t) {
    W2.rect(c, x - 1.5 * s, y - 40 * s, 3 * s, 40 * s, '#7A5236');
    W2.rect(c, x - 18 * s, y - 32 * s, 36 * s, 3 * s, '#7A5236');
    W2.poly(c, [[x - 11 * s, y - 34 * s], [x + 11 * s, y - 34 * s], [x + 9 * s, y - 14 * s], [x - 9 * s, y - 14 * s]], '#6F8FB8');
    W2.rect(c, x - 5 * s, y - 30 * s, 4 * s, 4 * s, '#E8822E');
    [[-18, -31], [18, -31]].forEach(([dx, dy]) => { for (let i = 0; i < 3; i++) W2.line(c, [[x + dx * s, y + dy * s], [x + (dx + (dx > 0 ? 3 : -3)) * s, y + (dy + (i - 1) * 2.4) * s]], '#E2B85A', 1 * s); });
    W2.circ(c, x, y - 42 * s, 6.5 * s, '#EAD9A8');
    W2.circ(c, x - 2.2 * s, y - 43 * s, 0.9 * s, '#2B2420'); W2.circ(c, x + 2.2 * s, y - 43 * s, 0.9 * s, '#2B2420');
    W2.line(c, [[x - 2 * s, y - 39.5 * s], [x, y - 38.8 * s], [x + 2 * s, y - 39.5 * s]], '#2B2420', 0.8 * s);
    W2.ell(c, x, y - 47 * s, 11 * s, 2.4 * s, '#8A6A3A'); W2.poly(c, [[x - 6 * s, y - 47 * s], [x - 4 * s, y - 55 * s], [x + 4 * s, y - 55 * s], [x + 6 * s, y - 47 * s]], '#8A6A3A');
    // ворона
    const bx = x + 15 * s, by = y - 36 * s + Math.sin((t || 0) * 1.5) * 0.5 * s;
    W2.ell(c, bx, by, 3.6 * s, 2.6 * s, '#2B2420'); W2.circ(c, bx + 2.6 * s, by - 2 * s, 1.8 * s, '#2B2420'); W2.poly(c, [[bx + 4 * s, by - 2.4 * s], [bx + 6 * s, by - 1.8 * s], [bx + 4 * s, by - 1.2 * s]], '#E8B84A');
  },
  apples(c, x, y, s) {
    c.fillStyle = '#B5844E'; c.beginPath(); c.moveTo(x - 13 * s, y - 12 * s); c.lineTo(x + 13 * s, y - 12 * s); c.lineTo(x + 10 * s, y); c.lineTo(x - 10 * s, y); c.fill();
    [[-7, -13], [0, -15], [7, -13], [-3, -18], [4, -19]].forEach(([dx, dy], i) => { W2.circ(c, x + dx * s, y + dy * s, 4 * s, i % 2 ? '#E2434B' : '#C8373B'); W2.circ(c, x + (dx - 1.4) * s, y + (dy - 1.4) * s, 1 * s, 'rgba(255,255,255,.5)'); });
    W2.circ(c, x + 17 * s, y - 3 * s, 3.6 * s, '#8FBF4A'); W2.circ(c, x - 17 * s, y - 3 * s, 3.4 * s, '#E2434B');
    c.strokeStyle = '#8A6040'; c.lineWidth = 1 * s; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(x - 12 * s + i * 0.7 * s, y - 9 * s + i * 3 * s); c.lineTo(x + 12 * s - i * 0.7 * s, y - 9 * s + i * 3 * s); c.stroke(); }
  },
};

// розширюємо малювання світу новими будиночками й предметами
(function extendWorldArt() {
  const baseHouse = WD_.house, baseItem = WD_.item;
  WD_.house = function (c, x, y, s, style, roof, night, season, t) {
    if (HOUSE_ART[style]) return HOUSE_ART[style](c, x, y, s, roof, night, season, t);
    return baseHouse.call(WD_, c, x, y, s, style, roof, night, season);
  };
  WD_.item = function (c, id, x, y, s, season, night, t) {
    if (ITEM_ART[id]) return ITEM_ART[id](c, x, y, s, season, night, t);
    return baseItem.call(WD_, c, id, x, y, s, season, night, t);
  };
})();

WORLD_ITEMS.push(...SEASON_ITEMS);
