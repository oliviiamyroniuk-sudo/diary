'use strict';
/* own journal — живі намальовані від руки обличчя-емоції, смайлик серії та ілюстрації настрою дня */

const FACE_INK = '#2b1f1b';

/** Опис обличчя для кожної емоції: очі, брови, рот, додатки. */
const FACE_SPECS = {
  calm: { eyes: 'closed', mouth: 'small', extra: ['blush'] },
  content: { eyes: 'happyOpen', mouth: 'smile', extra: ['blush'] },
  joy: { eyes: 'happyOpen', mouth: 'openSmile', extra: ['blush', 'sparkle1'] },
  elation: { eyes: 'squeeze', mouth: 'laugh', extra: ['blushStrong', 'sparkles'] },
  tenderness: { eyes: 'closed', brows: 'soft', mouth: 'cat', extra: ['blushStrong', 'hearts'] },
  admiration: { eyes: 'shine', brows: 'raised', mouth: 'o', extra: ['blush', 'sparkles'] },
  inlove: { eyes: 'heart', mouth: 'openSmile', extra: ['blushStrong', 'hearts'] },
  relief: { eyes: 'closed', brows: 'worried', mouth: 'smile', extra: ['sweat', 'blush'] },
  confidence: { eyes: 'smug', brows: 'one', mouth: 'smirk', extra: ['sparkle1'] },
  inspiration: { eyes: 'star', brows: 'raised', mouth: 'laugh', extra: ['sparkles', 'blush'] },
  celebration: { eyes: 'happy', mouth: 'tongue', extra: ['confetti', 'blush'] },
  touched: { eyes: 'teary', brows: 'worried', mouth: 'wobble', extra: ['blushStrong'] },
  gratitude: { eyes: 'closed', brows: 'soft', mouth: 'smile', extra: ['blush', 'sparkle1'] },
  cozy: { eyes: 'closed', mouth: 'cat', extra: ['blushStrong', 'steam'] },
  hope: { eyes: 'up', brows: 'soft', mouth: 'small', extra: ['sparkles'] },
  emptiness: { eyes: 'blank', mouth: 'none', extra: ['shadow'] },
  tired: { eyes: 'lidded', mouth: 'yawn', extra: ['zzz', 'bags'] },
  thoughtful: { eyes: 'up', brows: 'one', mouth: 'smirkFlat', extra: ['dots'] },
  confused: { eyes: 'mismatch', brows: 'oneUp', mouth: 'wobble', extra: ['question'] },
  tense: { eyes: 'tiny', brows: 'worried', mouth: 'grinTeeth', extra: ['sweat'] },
  awkward: { eyes: 'side', brows: 'worried', mouth: 'wobble', extra: ['blushStrong', 'sweat'] },
  indifferent: { eyes: 'lidded', mouth: 'flat', extra: [] },
  bored: { eyes: 'lidSide', mouth: 'pout', extra: [] },
  nostalgia: { eyes: 'closed', brows: 'worried', mouth: 'small', extra: ['tear1', 'blush'] },
  anxiety: { eyes: 'tiny', brows: 'worried', mouth: 'chatter', extra: ['sweat', 'sweat2', 'shake'] },
  sad: { eyes: 'worried', brows: 'worried', mouth: 'frown', extra: ['tear1'] },
  disappointed: { eyes: 'lidded', brows: 'worried', mouth: 'smallFrown', extra: [] },
  depressed: { eyes: 'dull', brows: 'worried', mouth: 'flat', extra: ['gloom', 'shadow'] },
  anger: { eyes: 'glare', brows: 'angry', mouth: 'clench', extra: ['vein', 'blushRed'] },
  irritation: { eyes: 'glareSide', brows: 'angry', mouth: 'smirkFlat', extra: ['vein'] },
  grief: { eyes: 'crying', brows: 'worried', mouth: 'wail', extra: ['tears', 'blush'] },
  fear: { eyes: 'tiny', brows: 'worried', mouth: 'chatter', extra: ['sweat', 'shadow', 'shake'] },
  overwhelmed: { eyes: 'swirl', mouth: 'wobbleOpen', extra: ['sweat', 'sweat2', 'shake'] },
  despair: { eyes: 'teary', brows: 'worried', mouth: 'wail', extra: ['tears', 'shadow'] },
  lonely: { eyes: 'down', brows: 'soft', mouth: 'smallFrown', extra: [] },
  guilt: { eyes: 'down', brows: 'worried', mouth: 'wobble', extra: ['sweat', 'gloom'] },
};

/** Готові обличчя для власних емоцій. */
const FACE_PRESETS = Object.keys(FACE_SPECS);

function hashStr(s) { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }

function hexRGB(hex) {
  const h = String(hex || '#cccccc').replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h.slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function lighten(hex, amt) {
  const [r, g, b] = hexRGB(hex);
  const mix = (c) => Math.round(c + (255 - c) * amt);
  return `rgb(${mix(r)},${mix(g)},${mix(b)})`;
}
function darken(hex, amt) {
  const [r, g, b] = hexRGB(hex);
  const mix = (c) => Math.round(c * (1 - amt));
  return `rgb(${mix(r)},${mix(g)},${mix(b)})`;
}

/** Трішки нерівне коло — щоб виглядало намальованим від руки. */
function wobblyCircle(cx, cy, r, seed, amp = 1.1) {
  const rnd = rng(seed);
  const n = 22;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rr = r + (rnd() - 0.5) * amp * 2;
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p1 = pts[(i + 1) % n], p0 = pts[i];
    const mx = (p0[0] + p1[0]) / 2, my = (p0[1] + p1[1]) / 2;
    d += ` Q${p0[0].toFixed(1)},${p0[1].toFixed(1)} ${mx.toFixed(1)},${my.toFixed(1)}`;
  }
  return d + 'Z';
}

const INK_ = (w = 3, c = FACE_INK) => `stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;
const LINE_ = (w = 3, c = FACE_INK) => `${INK_(w, c)} fill="none"`;
const MOUTH_DARK = '#4a1f22', TONGUE = '#f08a8f', TEAR = '#8fd0f4';

/* ---------- Очі (спільні для смайликів і героїні) ----------
   x, y — центр ока; s = -1 ліве, 1 праве; sk — колір шкіри (для повік);
   o — розміри: rx, ry, iris (колір райдужки) */
function eyeOpen(x, y, o = {}) {
  const rx = o.rx || 9.5, ry = o.ry || 11, pr = o.pr ?? 5, ink = o.ink || FACE_INK;
  const px = x + (o.px || 0), py = y + (o.py || 0) + 1;
  let h = `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#fff" ${INK_(2.2, ink)}/>`;
  if (pr > 0) {
    if (o.iris) h += `<circle cx="${px}" cy="${py}" r="${pr * 1.45}" fill="${o.iris}"/><circle cx="${px}" cy="${py + pr * 0.35}" r="${pr * 0.9}" fill="${o.iris2 || o.iris}" opacity=".6"/>`;
    h += `<circle cx="${px}" cy="${py}" r="${o.iris ? pr * 0.7 : pr}" fill="${ink}"/>`;
    if (o.hl !== false) h += `<circle cx="${px - pr * 0.42}" cy="${py - pr * 0.5}" r="${Math.max(1.1, pr * 0.38)}" fill="#fff"/><circle cx="${px + pr * 0.45}" cy="${py + pr * 0.45}" r="${Math.max(0.6, pr * 0.18)}" fill="#fff"/>`;
  }
  // верхня повіка: товста лінія з віями
  if (o.lid !== false) {
    const s = o.s || 1;
    h += `<path d="M${x - rx - 0.5},${y - 1} Q${x},${y - ry - 3.5} ${x + rx + 0.5},${y - 1}" ${LINE_(o.lw || 3.4, ink)}/>`;
    h += `<path d="M${x + s * (rx - 0.5)},${y - 3} l${s * 3.2},-3" ${LINE_(2.2, ink)}/>`;
  }
  return h;
}
/** Повіка, що прикриває око лінією від зовнішнього кута до внутрішнього. */
function eyeLid(x, y, s, oy, iy, sk, o = {}) {
  const rx = o.rx || 9.5, ry = o.ry || 11, ink = o.ink || FACE_INK;
  const outer = x + s * (rx + 1.5), inner = x - s * (rx + 1.5);
  const top = y - ry - 1.8;
  return `<path d="M${outer},${top} L${inner},${top} L${inner},${y + iy} L${outer},${y + oy} Z" fill="${sk}"/>
    <path d="M${outer - s * 1.2},${y + oy + 0.4} L${inner + s * 1.2},${y + iy + 0.4}" ${LINE_(o.lw || 3.4, ink)}/>`;
}

function eyePair(type, sk, o = {}) {
  const L = o.L || [35, 47], R = o.R || [65, 47];
  const k = o.k || 1;
  const ink = o.ink || FACE_INK;
  const both = (fn) => fn(L[0], L[1], -1) + fn(R[0], R[1], 1);
  const op = (x, y, s, extra = {}) => eyeOpen(x, y, { s, ink, rx: 9.5 * k, ry: 11 * k, pr: 5 * k, iris: o.iris, iris2: o.iris2, ...extra });
  const lidded = (oy, iy, extra = {}) => both((x, y, s) => op(x, y, s, { lid: false, ...extra }) + eyeLid(x, y, s, oy * k, iy * k, sk, { ink, rx: 9.5 * k, ry: 11 * k }));
  switch (type) {
    case 'dot': return both((x, y) => `<ellipse cx="${x}" cy="${y}" rx="${3.6 * k}" ry="${4.6 * k}" fill="${ink}"/><circle cx="${x - 1.2 * k}" cy="${y - 1.6 * k}" r="${1.1 * k}" fill="#fff"/>`);
    case 'open': return both((x, y, s) => op(x, y, s));
    case 'happyOpen': return both((x, y, s) => op(x, y, s, { py: -1.5 * k, pr: 5.2 * k }) + `<path d="M${x - 11 * k},${y + 4 * k} Q${x},${y - 2.5 * k} ${x + 11 * k},${y + 4 * k} L${x + 12 * k},${y + 13 * k} L${x - 12 * k},${y + 13 * k} Z" fill="${sk}"/><path d="M${x - 9 * k},${y + 4.2 * k} Q${x},${y - 1.2 * k} ${x + 9 * k},${y + 4.2 * k}" ${LINE_(2.6, ink)}/>`);
    case 'happy': return both((x, y) => `<path d="M${x - 8 * k},${y + 3 * k} Q${x},${y - 9 * k} ${x + 8 * k},${y + 3 * k}" ${LINE_(3.6, ink)}/>`);
    case 'closed': return both((x, y, s) => `<path d="M${x - 8 * k},${y - 1 * k} Q${x},${y + 7 * k} ${x + 8 * k},${y - 1 * k}" ${LINE_(3.4, ink)}/><path d="M${x + s * 8 * k},${y - 1 * k} l${s * 2.5},-2.5" ${LINE_(2, ink)}/>`);
    case 'squeeze': return both((x, y, s) => `<path d="M${x + s * 7 * k},${y - 7 * k} L${x - s * 6 * k},${y} L${x + s * 7 * k},${y + 7 * k}" ${LINE_(3.6, ink)}/>`);
    case 'crying': return both((x, y, s) => `<path d="M${x + s * 7 * k},${y - 6 * k} L${x - s * 6 * k},${y} L${x + s * 7 * k},${y + 5 * k}" ${LINE_(3.4, ink)}/>`);
    case 'shine': return both((x, y, s) => op(x, y, s, { pr: 6.6 * k, hl: false }) + `<path d="M${x - 2.4 * k},${y - 5.5 * k} l${1.1 * k},${2.6 * k} l${2.6 * k},${1.1 * k} l${-2.6 * k},${1.1 * k} l${-1.1 * k},${2.6 * k} l${-1.1 * k},${-2.6 * k} l${-2.6 * k},${-1.1 * k} l${2.6 * k},${-1.1 * k}z" fill="#fff"/><circle cx="${x + 3 * k}" cy="${y + 4 * k}" r="${1.6 * k}" fill="#fff"/>`);
    case 'teary': return both((x, y, s) => op(x, y, s, { pr: 6 * k, py: 0.5 * k }) + `<path d="M${x - 9 * k},${y + 2 * k} Q${x},${y + 13 * k} ${x + 9 * k},${y + 2 * k} Q${x},${y + 7 * k} ${x - 9 * k},${y + 2 * k}Z" fill="${TEAR}" opacity=".9"/><path d="M${x - 5 * k},${y + 5 * k} q${2 * k},${1.5 * k} ${4 * k},0" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round"/>`);
    case 'tiny': return both((x, y, s) => op(x, y, s, { pr: 1.9 * k, hl: false, py: 0 }));
    case 'blank': return both((x, y, s) => op(x, y, s, { pr: 1.3 * k, hl: false, lid: false }) + `<path d="M${x - 9 * k},${y - 2 * k} L${x + 9 * k},${y - 2 * k}" ${LINE_(2.6, ink)}/>` + eyeLid(x, y, s, -2 * k, -2 * k, sk, { ink, rx: 9.5 * k, ry: 11 * k }));
    case 'side': return both((x, y, s) => op(x, y, s, { px: 4.2 * k, py: -0.5 * k }));
    case 'up': return both((x, y, s) => op(x, y, s, { px: 1.5 * k, py: -4.2 * k }));
    case 'down': return lidded(-1, -1, { py: 4 * k, px: -1 * k, pr: 4.8 * k });
    case 'lidded': return lidded(-0.5, -0.5, { py: 3.2 * k, pr: 4.6 * k });
    case 'lidSide': return lidded(-0.5, -0.5, { py: 3 * k, px: 4.5 * k, pr: 4.4 * k });
    case 'smug': return lidded(-1.5, -2.5, { py: 2.6 * k, px: -3 * k, pr: 4.6 * k });
    case 'dull': return lidded(-1, -1, { py: 3.4 * k, pr: 4.6 * k, hl: false }) + both((x, y) => `<path d="M${x - 7 * k},${y + 13 * k} Q${x},${y + 16 * k} ${x + 7 * k},${y + 13 * k}" ${LINE_(1.4, ink)} opacity=".55"/>`);
    case 'glare': return lidded(-7, 1, { py: 3 * k, pr: 3.8 * k });
    case 'glareSide': return lidded(-6, 0, { py: 3 * k, px: 4 * k, pr: 3.8 * k });
    case 'worried': return lidded(1, -7, { py: 2.5 * k, pr: 5 * k });
    case 'mismatch': return op(L[0], L[1], -1, { rx: 11 * k, ry: 12.5 * k, pr: 3.4 * k }) + eyeOpen(R[0], R[1] + 1, { s: 1, ink, rx: 8 * k, ry: 8.5 * k, pr: 3 * k, iris: o.iris, lid: false }) + `<path d="M${R[0] - 9 * k},${R[1] - 5 * k} L${R[0] + 9 * k},${R[1] - 3 * k}" ${LINE_(3.2, ink)}/>`;
    case 'heart': return both((x, y) => `<path d="M${x},${y + 9 * k} C${x - 14 * k},${y - 1 * k} ${x - 7 * k},${y - 11 * k} ${x},${y - 4 * k} C${x + 7 * k},${y - 11 * k} ${x + 14 * k},${y - 1 * k} ${x},${y + 9 * k}Z" fill="#ec4f6b" ${INK_(2.2, ink)}/><ellipse cx="${x - 4 * k}" cy="${y - 3 * k}" rx="${2 * k}" ry="${1.3 * k}" fill="#fff" opacity=".8"/>`);
    case 'star': return both((x, y) => `<path d="M${x},${y - 10 * k} L${x + 3 * k},${y - 3 * k} L${x + 10 * k},${y - 2.4 * k} L${x + 4.6 * k},${y + 2.6 * k} L${x + 6.4 * k},${y + 10 * k} L${x},${y + 6 * k} L${x - 6.4 * k},${y + 10 * k} L${x - 4.6 * k},${y + 2.6 * k} L${x - 10 * k},${y - 2.4 * k} L${x - 3 * k},${y - 3 * k}Z" fill="#ffd34a" ${INK_(2.2, ink)}/><circle cx="${x - 2 * k}" cy="${y - 1 * k}" r="${1.4 * k}" fill="#fff"/>`);
    case 'swirl': return both((x, y) => `<ellipse cx="${x}" cy="${y}" rx="${9.5 * k}" ry="${11 * k}" fill="#fff" ${INK_(2.2, ink)}/><path d="M${x},${y} m-1,0 a1.5,1.5 0 1,1 3,0 a3,3 0 1,1 -6,0 a4.5,4.5 0 1,1 9,0 a6,6 0 1,1 -12,0" ${LINE_(2, ink)} transform="translate(0 0) scale(1)"/>`);
    default: return both((x, y, s) => op(x, y, s));
  }
}

function browPair(type, o = {}) {
  const ink = o.ink || FACE_INK;
  const L = o.L || [35, 47], R = o.R || [65, 47], k = o.k || 1;
  const st = LINE_(3.2 * Math.min(k, 1.2), ink);
  const b = (fn) => fn(L[0], L[1] - 17 * k, -1) + fn(R[0], R[1] - 17 * k, 1);
  // s = -1 ліва брова; внутрішній кінець ближче до центру
  switch (type) {
    case 'worried': return b((x, y, s) => `<path d="M${x + s * 9 * k},${y + 3 * k} Q${x},${y + 1 * k} ${x - s * 8 * k},${y - 4 * k}" ${st}/>`);
    case 'angry': return b((x, y, s) => `<path d="M${x + s * 9 * k},${y - 4 * k} L${x - s * 8 * k},${y + 4 * k}" ${st}/>`);
    case 'raised': return b((x, y, s) => `<path d="M${x - 8 * k},${y - 1 * k} Q${x},${y - 7 * k} ${x + 8 * k},${y - 1 * k}" ${st}/>`);
    case 'soft': return b((x, y) => `<path d="M${x - 7 * k},${y + 1 * k} Q${x},${y - 3 * k} ${x + 7 * k},${y + 1 * k}" ${st}/>`);
    case 'one': return `<path d="M${L[0] - 8 * k},${L[1] - 16 * k} L${L[0] + 8 * k},${L[1] - 15 * k}" ${st}/><path d="M${R[0] - 8 * k},${R[1] - 17 * k} Q${R[0]},${R[1] - 24 * k} ${R[0] + 8 * k},${R[1] - 18 * k}" ${st}/>`;
    case 'oneUp': return `<path d="M${L[0] - 8 * k},${L[1] - 19 * k} Q${L[0]},${L[1] - 25 * k} ${L[0] + 8 * k},${L[1] - 19 * k}" ${st}/><path d="M${R[0] - 8 * k},${R[1] - 13 * k} L${R[0] + 8 * k},${R[1] - 16 * k}" ${st}/>`;
    default: return '';
  }
}

/** Рот: cx, cy — центр, k — масштаб. */
function mouthShape(type, o = {}) {
  const ink = o.ink || FACE_INK, k = o.k || 1, cx = o.cx ?? 50, cy = o.cy ?? 70;
  const P = (pts) => pts.replace(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g, (_, a, b2) => `${(cx + (+a) * k).toFixed(1)},${(cy + (+b2) * k).toFixed(1)}`);
  const line = (d, w = 3.2) => `<path d="${P(d)}" ${LINE_(w * Math.min(k, 1.3), ink)}/>`;
  const fill = (d, f, w = 2.6) => `<path d="${P(d)}" fill="${f}" ${INK_(w * Math.min(k, 1.3), ink)}/>`;
  const raw = (d, f) => `<path d="${P(d)}" fill="${f}"/>`;
  switch (type) {
    case 'smile': return line('M-13,-4 Q0,10 13,-4') + line('M-15,-6 L-12,-3', 2) + line('M15,-6 L12,-3', 2);
    case 'small': return line('M-6,-2 Q0,3 6,-2', 3);
    case 'openSmile': return fill('M-13,-5 Q0,-3 13,-5 Q12,12 0,12 Q-12,12 -13,-5Z', MOUTH_DARK) + raw('M-7,8 Q0,2 7,8 Q0,12.5 -7,8Z', TONGUE) + raw('M-11.5,-4 Q0,-2.4 11.5,-4 L10.8,-1 Q0,0.6 -10.8,-1Z', '#fff');
    case 'laugh': return fill('M-17,-8 Q0,-4 17,-8 Q15,17 0,17 Q-15,17 -17,-8Z', MOUTH_DARK) + raw('M-9,11 Q0,3 9,11 Q0,17.5 -9,11Z', TONGUE) + raw('M-15.5,-7 Q0,-3.6 15.5,-7 L14.6,-3 Q0,0 -14.6,-3Z', '#fff');
    case 'tongue': return line('M-12,-4 Q0,8 12,-4') + fill('M-1,2.4 Q0,12 6,10 Q9,7 7,1.5Z', TONGUE, 2.2) + line('M3,3.5 L3.6,7.5', 1.4);
    case 'grinTeeth': return fill('M-15,-6 Q0,-9 15,-6 Q14,8 0,9 Q-14,8 -15,-6Z', '#fff') + line('M-14,1 Q0,-1 14,1', 1.8) + line('M-7,-7 L-7,8 M0,-7.6 L0,9 M7,-7 L7,8', 1.4);
    case 'clench': return fill('M-14,2 Q0,-8 14,2 L13,7 Q0,0 -13,7Z', '#fff') + line('M-13.5,4.5 Q0,-3 13.5,4.5', 1.5) + line('M-7,-2 L-6,6 M0,-4.5 L0,3.5 M7,-2 L6,6', 1.3);
    case 'chatter': return fill('M-14,-3 Q-10.5,-6.5 -7,-3 Q-3.5,0.5 0,-3 Q3.5,-6.5 7,-3 Q10.5,0.5 14,-3 L14,5 Q10.5,8.5 7,5 Q3.5,1.5 0,5 Q-3.5,8.5 -7,5 Q-10.5,1.5 -14,5 Z', '#fff') + line('M-14,1 L14,1', 1.4) + line('M-7,-3 L-7,5 M0,-3 L0,5 M7,-3 L7,5', 1.2);
    case 'wail': return fill('M-15,12 Q-14,-7 0,-7 Q14,-7 15,12 Q0,7 -15,12Z', MOUTH_DARK) + raw('M-8,11 Q0,4 8,11 Q0,10 -8,11Z', TONGUE) + raw('M-10,-5 Q0,-7.5 10,-5 L9,-2.5 Q0,-4.6 -9,-2.5Z', '#fff');
    case 'yawn': return fill('M0,-8 Q8,-8 8,3 Q8,13 0,13 Q-8,13 -8,3 Q-8,-8 0,-8Z', MOUTH_DARK) + raw('M-5,9 Q0,4 5,9 Q0,12.5 -5,9Z', TONGUE);
    case 'o': return fill('M0,-6 Q6,-6 6,1 Q6,8 0,8 Q-6,8 -6,1 Q-6,-6 0,-6Z', MOUTH_DARK) + raw('M-3.5,5 Q0,2.5 3.5,5 Q0,7.5 -3.5,5Z', TONGUE);
    case 'flat': return line('M-8,0 L8,0');
    case 'frown': return line('M-11,6 Q0,-6 11,6');
    case 'smallFrown': return line('M-6,3 Q0,-2 6,3', 3);
    case 'wobble': return line('M-12,1 Q-9,-3 -6,1 T0,1 T6,1 T12,1', 2.8);
    case 'wobbleOpen': return fill('M-13,-1 Q-9.75,-5 -6.5,-1 Q-3.25,3 0,-1 Q3.25,-5 6.5,-1 Q9.75,3 13,-1 Q13,9 0,9 Q-13,9 -13,-1Z', MOUTH_DARK) + raw('M-6,6.5 Q0,2.5 6,6.5 Q0,9 -6,6.5Z', TONGUE);
    case 'smirk': return line('M-9,1 Q3,6 11,-6') + line('M10,-7.5 L13,-5', 2);
    case 'smirkFlat': return line('M-7,2 L8,-1', 3);
    case 'cat': return line('M-10,-3 Q-5,4 0,-1 Q5,4 10,-3', 3);
    case 'pout': return line('M-4,1 Q0,-3 4,1', 3) + line('M7,-1 L10,-2', 2);
    case 'none': return '';
    default: return line('M-10,-3 Q0,6 10,-3');
  }
}

function faceExtras(list, ink = FACE_INK) {
  let h = '';
  const hatch = (x, y, c) => `<path d="M${x - 5},${y + 2} l3,-4 M${x - 1},${y + 2} l3,-4 M${x + 3},${y + 2} l3,-4" stroke="${c}" stroke-width="1.3" stroke-linecap="round"/>`;
  for (const x of list || []) {
    switch (x) {
      case 'blush': h += `<ellipse cx="24" cy="60" rx="7.5" ry="4.6" fill="#f2949a" opacity=".6"/><ellipse cx="76" cy="60" rx="7.5" ry="4.6" fill="#f2949a" opacity=".6"/>${hatch(24, 60, '#d9707c')}${hatch(76, 60, '#d9707c')}`; break;
      case 'blushStrong': h += `<ellipse cx="24" cy="60" rx="9" ry="5.6" fill="#ee7a8a" opacity=".85"/><ellipse cx="76" cy="60" rx="9" ry="5.6" fill="#ee7a8a" opacity=".85"/>${hatch(24, 60, '#c24a62')}${hatch(76, 60, '#c24a62')}`; break;
      case 'blushRed': h += '<ellipse cx="24" cy="60" rx="8" ry="5" fill="#e35a4a" opacity=".55"/><ellipse cx="76" cy="60" rx="8" ry="5" fill="#e35a4a" opacity=".55"/>'; break;
      case 'sweat': h += `<path d="M80,24 Q88,36 80,40 Q72,36 80,24Z" fill="#a9dcf7" ${INK_(1.8, ink)}/><path d="M78.5,33 q1,-3 2.5,-4" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round"/>`; break;
      case 'sweat2': h += `<path d="M19,30 Q25,39 19,42 Q13,39 19,30Z" fill="#a9dcf7" ${INK_(1.6, ink)}/>`; break;
      case 'tear1': h += `<path d="M66,57 Q71,66 66,70 Q61,66 66,57Z" fill="${TEAR}" ${INK_(1.6, ink)}/><circle cx="64.8" cy="65" r="1.1" fill="#fff"/>`; break;
      case 'tears': h += `<path d="M30,55 Q27,68 31,82 Q34,92 30,96" stroke="${TEAR}" stroke-width="7" fill="none" stroke-linecap="round" opacity=".92"/><path d="M70,55 Q73,68 69,82 Q66,92 70,96" stroke="${TEAR}" stroke-width="7" fill="none" stroke-linecap="round" opacity=".92"/><path d="M29,60 Q28,68 30,74 M71,60 Q72,68 70,74" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".8"/>`; break;
      case 'zzz': h += `<text x="70" y="25" font-size="14" font-weight="800" fill="${ink}" font-family="Georgia,serif">z</text><text x="80" y="16" font-size="10" font-weight="800" fill="${ink}" font-family="Georgia,serif">z</text>`; break;
      case 'bags': h += `<path d="M28,60 Q35,63 42,60 M58,60 Q65,63 72,60" stroke="${ink}" stroke-width="1.5" fill="none" opacity=".5" stroke-linecap="round"/>`; break;
      case 'hearts': h += '<path d="M84,20 c-4,-4.5 -10,1 -4.5,5.5 l4.5,4.5 l4.5,-4.5 c5.5,-4.5 0,-10 -4.5,-5.5z" fill="#ec4f6b" stroke="#2b1f1b" stroke-width="1.4"/><path d="M14,30 c-3,-3 -7,1 -3,4 l3,3 l3,-3 c4,-3 0,-7 -3,-4z" fill="#f28da0"/>'; break;
      case 'sparkles': h += '<path d="M84,16 l2.2,6.3 l6.3,2.2 l-6.3,2.2 l-2.2,6.3 l-2.2,-6.3 l-6.3,-2.2 l6.3,-2.2z" fill="#ffd34a" stroke="#2b1f1b" stroke-width="1.2" stroke-linejoin="round"/><path d="M15,20 l1.5,4 l4,1.5 l-4,1.5 l-1.5,4 l-1.5,-4 l-4,-1.5 l4,-1.5z" fill="#ffd34a"/>'; break;
      case 'sparkle1': h += '<path d="M83,18 l2,5.5 l5.5,2 l-5.5,2 l-2,5.5 l-2,-5.5 l-5.5,-2 l5.5,-2z" fill="#ffd34a" stroke="#2b1f1b" stroke-width="1.1" stroke-linejoin="round"/>'; break;
      case 'confetti': h += '<rect x="12" y="15" width="6" height="3.4" fill="#ec4f6b" transform="rotate(30 15 17)"/><rect x="80" y="10" width="6" height="3.4" fill="#5fb0ea" transform="rotate(-20 83 12)"/><circle cx="88" cy="30" r="2.2" fill="#ffd34a"/><circle cx="10" cy="36" r="2.2" fill="#7fcf86"/><path d="M20,8 q3,3 0,6 q-3,3 0,6" stroke="#b38ae0" stroke-width="2" fill="none" stroke-linecap="round"/>'; break;
      case 'vein': h += '<path d="M72,14 q4,6 0,8 M84,14 q-4,6 0,8 M72,30 q4,-6 0,-8 M84,30 q-4,-6 0,-8" stroke="#e0383f" stroke-width="2.8" fill="none" stroke-linecap="round"/>'; break;
      case 'gloom': h += `<path d="M34,12 L34,26 M42,9 L42,24 M50,8 L50,23 M58,9 L58,24 M66,12 L66,26" stroke="${ink}" stroke-width="2" opacity=".42" stroke-linecap="round"/>`; break;
      case 'shadow': h += `<path d="M10.5,38 A41,41 0 0 1 89.5,38 Q50,30 10.5,38Z" fill="#241a3a" opacity=".28"/>`; break;
      case 'shake': h += `<path d="M5,44 l4,3 l-4,3 M95,44 l-4,3 l4,3" ${LINE_(1.8, ink)} opacity=".7"/>`; break;
      case 'question': h += `<text x="76" y="27" font-size="22" font-weight="800" fill="${ink}" font-family="Georgia,serif">?</text>`; break;
      case 'dots': h += `<circle cx="76" cy="22" r="2.2" fill="${ink}"/><circle cx="83" cy="17" r="2.2" fill="${ink}"/><circle cx="90" cy="12" r="2.2" fill="${ink}"/>`; break;
      case 'steam': h += `<path d="M81,26 q-4,-5 0,-9 q4,-4 0,-9 M88,28 q-3,-4 0,-7 q3,-3 0,-7" stroke="${ink}" stroke-width="1.8" fill="none" opacity=".5" stroke-linecap="round"/>`; break;
    }
  }
  return h;
}

const Faces = {
  spec(e) {
    if (!e) return FACE_SPECS.calm;
    return FACE_SPECS[e.face] || FACE_SPECS[e.id] || null;
  },
  /** SVG-обличчя для емоції (рядок). */
  svg(e) {
    const spec = Faces.spec(e);
    const base = e.color || '#cccccc';
    const fill = lighten(base, 0.42);
    const body = wobblyCircle(50, 50, 43, hashStr(e.id), 1.2);
    // тінь знизу справа та відблиск — для обʼєму, як у намальованих від руки
    const shade = `<path d="M85.6,33 A39,39 0 0 1 23,79.5 A44,44 0 0 0 85.6,33Z" fill="${darken(base, 0.12)}" opacity=".35"/>`;
    const shine = '<ellipse cx="31" cy="24" rx="9" ry="4.6" transform="rotate(-32 31 24)" fill="#fff" opacity=".45"/><circle cx="22" cy="34" r="1.8" fill="#fff" opacity=".5"/>';
    let inner;
    if (spec) {
      const x = spec.extra || [];
      const under = x.filter((n) => n.startsWith('blush') || n === 'bags');
      const over = x.filter((n) => !under.includes(n));
      inner = faceExtras(under) + eyePair(spec.eyes, fill) + browPair(spec.brows) + mouthShape(spec.mouth) + faceExtras(over);
    } else inner = `<text x="50" y="63" text-anchor="middle" font-size="40">${esc(e.emoji || '🙂')}</text>`;
    const sketch = `<path d="${wobblyCircle(50.6, 49.4, 42.2, hashStr(e.id) + 7, 1.6)}" fill="none" stroke="${FACE_INK}" stroke-width="1" opacity=".45"/>`;
    return `<svg viewBox="0 0 100 100" aria-hidden="true"><path d="${body}" fill="${fill}"/>${shade}${shine}${inner}<path d="${body}" fill="none" stroke="${FACE_INK}" stroke-width="3.4"/>${sketch}</svg>`;
  },
  /** Обличчя всередині іншого SVG (для графіків). */
  nested(e, x, y, size) {
    if (!e) return '';
    return Faces.svg(e).replace('<svg viewBox="0 0 100 100" aria-hidden="true">', `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 100 100">`);
  },
  /** Смайлик серії днів: закохані очі-сердечка. */
  streak(size = 22) {
    return `<svg viewBox="0 0 100 100" style="width:${size}px;height:${size}px;vertical-align:-0.25em" aria-hidden="true">
      <path d="M18,22 c-3,-4 -9,0 -5,4 l5,5 l5,-5 c4,-4 -2,-8 -5,-4z" fill="#ef8f9b"/><path d="M84,80 c-3,-4 -8,0 -4,3 l4,4 l4,-4 c4,-3 -1,-7 -4,-3z" fill="#ef8f9b"/>
      <path d="${wobblyCircle(50, 52, 38, 9, 1.6)}" fill="#fbd98f" stroke="#c73642" stroke-width="3.2"/>
      <path d="${wobblyCircle(50, 52, 36.5, 21, 1.8)}" fill="none" stroke="#c73642" stroke-width="1.6" opacity=".7"/>
      <ellipse cx="25" cy="66" rx="9" ry="6" fill="#ec9f60" opacity=".75"/><ellipse cx="75" cy="66" rx="9" ry="6" fill="#ec9f60" opacity=".75"/>
      <circle cx="35" cy="45" r="15" fill="#f4f1f0" stroke="#c73642" stroke-width="3"/><circle cx="65" cy="45" r="15" fill="#f4f1f0" stroke="#c73642" stroke-width="3"/>
      <path d="M35,55 C22,46 27,35 35,41 C43,35 48,46 35,55Z" fill="#f07c86" stroke="#d6404e" stroke-width="1.6"/>
      <path d="M65,55 C52,46 57,35 65,41 C73,35 78,46 65,55Z" fill="#f07c86" stroke="#d6404e" stroke-width="1.6"/>
      <path d="M44,70 Q50,66 56,70 Q50,74 44,70Z" fill="#f29aa2" stroke="#d6404e" stroke-width="1.4"/><path d="M50,73 L50,78" stroke="#ef8f9b" stroke-width="2.4" stroke-linecap="round"/>
    </svg>`;
  },
};


/* ---------- Ілюстрація настрою дня: картка-портрет власної героїні ----------
   Дівчинка з каштановим бобом і заколкою-грибочком; рамка з підписом,
   градієнт із точковим растром і різні вирази обличчя. */
const MOODS = {
  neutral: { title: 'NEUTRAL', sub: 'a calm, quiet day', bg: ['#ffffff', '#1d1d1f'], label: '#ffffff' },
  happy: { title: 'HAPPY', sub: 'a day full of warm light', bg: ['#fff04a', '#ff5fc8'], label: '#fff7a8' },
  ecstatic: { title: 'ECSTATIC', sub: 'a day that shines', bg: ['#fff23a', '#ff2fa8'], label: '#fff25a' },
  love: { title: 'IN LOVE', sub: 'a heart full of love', bg: ['#ffe0ec', '#ff6f9f'], label: '#ffc2d6' },
  cozy: { title: 'COZY', sub: 'calm and warmth', bg: ['#fff1c9', '#7fc08e'], label: '#d8f3c9' },
  tired: { title: 'TIRED', sub: 'time to rest', bg: ['#d8d0ff', '#4a4486'], label: '#d6ceff' },
  sad: { title: 'SAD', sub: 'be gentle with yourself today', bg: ['#2f5fe0', '#52f0e6'], label: '#8fd6ff' },
  depressed: { title: 'DEPRESSED', sub: 'you’re not alone, this will pass', bg: ['#1b2a6e', '#3fb3c4'], label: '#7fa6ff' },
  angry: { title: 'ANGRY', sub: 'breathe out, you’re allowed to feel this', bg: ['#ffd23a', '#f0231e'], label: '#ff8a7a' },
  afraid: { title: 'AFRAID', sub: 'step by step', bg: ['#4a4a4a', '#0e0e0e'], label: '#e6e6e6' },
  stressed: { title: 'STRESSED OUT', sub: 'too much at once — take a pause', bg: ['#262626', '#050505'], label: '#f0f0f0' },
};

/** Градієнт, що переходить точковим растром (дизерингом) — як у картках емоцій. */
function halftoneBG(id, c1, c2, seed) {
  const step = 5;
  let d = '';
  for (let y = 0; y <= 220; y += step) {
    const t = (y - 40) / 150; // 0 → 1 зверху вниз
    if (t <= 0 || t >= 1.05) continue;
    const r = Math.min(step * 0.72, Math.pow(t, 1.15) * step * 0.74);
    if (r < 0.35) continue;
    const off = (y / step) % 2 ? step / 2 : 0;
    for (let x = -off; x <= 205; x += step) d += `M${(x - r).toFixed(1)},${y}a${r.toFixed(2)},${r.toFixed(2)} 0 1,0 ${(2 * r).toFixed(2)},0a${r.toFixed(2)},${r.toFixed(2)} 0 1,0 ${(-2 * r).toFixed(2)},0`;
  }
  // дрібний шум згори
  const rnd = rng(seed);
  let n = '';
  for (let i = 0; i < 90; i++) n += `M${(rnd() * 200).toFixed(0)},${(rnd() * 70).toFixed(0)}h1.6v1.6h-1.6z`;
  return `<rect width="200" height="220" fill="${c1}"/><rect y="186" width="200" height="34" fill="${c2}"/>
    <path d="${d}" fill="${c2}"/><path d="${n}" fill="${c2}" opacity=".35"/>`;
}

const HERO = { skin: '#fde4d2', skinSh: '#f3c3ab', hair: '#5b3326', hairSh: '#3c2019', hairHl: '#8d5a3f', iris: '#2f9c8e', iris2: '#1f6f66', shirt: '#9fbf93', ink: '#2a1d18' };

function heroExpression(m, sk) {
  const ink = HERO.ink;
  const eo = { L: [83, 123], R: [117, 123], k: 1.02, ink, iris: HERO.iris, iris2: HERO.iris2 };
  const mo = (t) => mouthShape(t, { cx: 100, cy: 151, k: 0.82, ink });
  const brows = (t) => browPair(t, { L: [83, 123], R: [117, 123], k: 0.92, ink });
  const blush = (o = 0.55, c = '#f28c94') => `<ellipse cx="75" cy="141" rx="8" ry="4.6" fill="${c}" opacity="${o}"/><ellipse cx="125" cy="141" rx="8" ry="4.6" fill="${c}" opacity="${o}"/>
    <path d="M70,143 l3,-4 M74,143 l3,-4 M78,143 l3,-4 M120,143 l3,-4 M124,143 l3,-4 M128,143 l3,-4" stroke="#d66a78" stroke-width="1.2" stroke-linecap="round" opacity="${Math.min(1, o + 0.2)}"/>`;
  const tearStreams = `<path d="M80,134 Q77,150 81,164" stroke="${TEAR}" stroke-width="5" fill="none" stroke-linecap="round" opacity=".9"/><path d="M120,134 Q123,150 119,164" stroke="${TEAR}" stroke-width="5" fill="none" stroke-linecap="round" opacity=".9"/>`;
  switch (m) {
    case 'happy': return blush(0.6) + eyePair('happyOpen', sk, eo) + brows('soft') + mo('openSmile');
    case 'ecstatic': return blush(0.85, '#f07a8c') + eyePair('star', sk, eo) + brows('raised') + mo('laugh');
    case 'love': return blush(0.9, '#ef7a90') + eyePair('heart', sk, eo) + mo('cat');
    case 'cozy': return blush(0.6) + eyePair('closed', sk, eo) + brows('soft') + mo('small');
    case 'tired': return eyePair('lidded', sk, eo) + `<path d="M74,138 Q83,141 92,138 M108,138 Q117,141 126,138" stroke="${ink}" stroke-width="1.4" fill="none" opacity=".45" stroke-linecap="round"/>` + mo('yawn');
    case 'sad': return blush(0.35) + eyePair('teary', sk, eo) + brows('worried') + mo('smallFrown') + `<path d="M121,134 Q125,142 121,145 Q117,142 121,134Z" fill="${TEAR}" stroke="${ink}" stroke-width="1.3"/>`;
    case 'depressed': return eyePair('dull', sk, eo) + brows('worried') + tearStreams + mo('flat');
    case 'angry': return blush(0.55, '#e85a4a') + eyePair('glare', sk, eo) + brows('angry') + mo('clench') + '<path d="M140,86 q4,6 0,8 M152,86 q-4,6 0,8 M140,102 q4,-6 0,-8 M152,102 q-4,-6 0,-8" stroke="#e0383f" stroke-width="2.8" fill="none" stroke-linecap="round"/>';
    case 'afraid': return eyePair('tiny', sk, eo) + brows('worried') + mo('chatter') + `<path d="M140,106 Q147,117 140,121 Q133,117 140,106Z" fill="#a9dcf7" stroke="${ink}" stroke-width="1.5"/><path d="M62,112 Q67,120 62,123 Q57,120 62,112Z" fill="#a9dcf7" stroke="${ink}" stroke-width="1.3"/>`;
    case 'stressed': return eyePair('swirl', sk, eo) + mo('wobbleOpen') + `<path d="M140,106 Q147,117 140,121 Q133,117 140,106Z" fill="#a9dcf7" stroke="${ink}" stroke-width="1.5"/><path d="M52,96 l7,5 M148,96 l-7,5 M46,118 l8,0 M154,118 l-8,0" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>`;
    default: return blush(0.35) + eyePair('open', sk, eo) + mo('small');
  }
}

function moodCardSVG(moodKey, uidStr) {
  const m = MOODS[moodKey] || MOODS.neutral;
  const id = String(uidStr || moodKey).replace(/[^a-zA-Z0-9_-]/g, '');
  const H = HERO, ink = H.ink;
  const sk = moodKey === 'afraid' || moodKey === 'stressed' ? '#e9dfd9' : moodKey === 'depressed' ? '#e6d7d6' : H.skin;
  const face = 'M64,116 C64,86 80,72 100,72 C120,72 136,86 136,116 C136,142 121,163 100,168 C79,163 64,142 64,116Z';
  // атмосферні дрібниці на тлі
  const bgExtra = {
    happy: '<circle cx="30" cy="54" r="3" fill="#fff" opacity=".8"/><circle cx="172" cy="66" r="2.4" fill="#fff" opacity=".8"/><circle cx="160" cy="44" r="1.6" fill="#fff" opacity=".8"/>',
    ecstatic: '<path d="M28,52 l3,8 l8,3 l-8,3 l-3,8 l-3,-8 l-8,-3 l8,-3z" fill="#fff"/><path d="M172,62 l2,6 l6,2 l-6,2 l-2,6 l-2,-6 l-6,-2 l6,-2z" fill="#fff"/><path d="M160,40 l1.4,4 l4,1.4 l-4,1.4 l-1.4,4 l-1.4,-4 l-4,-1.4 l4,-1.4z" fill="#fff"/>',
    love: '<path d="M30,60 c-5,-5 -12,1 -6,6 l6,6 l6,-6 c6,-5 -1,-11 -6,-6z" fill="#fff" opacity=".85"/><path d="M168,52 c-4,-4 -9,1 -4.5,4.5 l4.5,4.5 l4.5,-4.5 c4.5,-3.5 -1,-8.5 -4.5,-4.5z" fill="#ec4f6b"/>',
    cozy: '<path d="M30,62 q-4,-6 0,-11 q4,-5 0,-11 M38,64 q-3,-5 0,-9 q3,-4 0,-9" stroke="#fff" stroke-width="2.2" fill="none" opacity=".8" stroke-linecap="round"/>',
    tired: '<circle cx="164" cy="56" r="13" fill="#fff8d8"/><circle cx="171" cy="51" r="12" fill="#bfb5f0"/><text x="30" y="70" font-size="18" font-weight="800" fill="#fff" font-family="Georgia,serif">z</text><text x="42" y="56" font-size="13" font-weight="800" fill="#fff" font-family="Georgia,serif">z</text>',
    sad: '<path d="M26,44 l0,14 M38,38 l0,14 M162,44 l0,14 M174,38 l0,14" stroke="#fff" stroke-width="2" opacity=".6" stroke-linecap="round"/>',
    depressed: '<path d="M24,44 l0,16 M38,36 l0,16 M162,40 l0,16 M176,34 l0,16 M150,58 l0,12" stroke="#bcd0ff" stroke-width="2" opacity=".55" stroke-linecap="round"/>',
    stressed: Array.from({ length: 140 }, (_, i) => { const r = rng(i * 7 + 3); return `<rect x="${(r() * 200).toFixed(0)}" y="${(30 + r() * 190).toFixed(0)}" width="${r() > 0.8 ? 3 : 1.6}" height="1.6" fill="#fff" opacity="${(0.25 + r() * 0.6).toFixed(2)}"/>`; }).join(''),
    afraid: Array.from({ length: 50 }, (_, i) => { const r = rng(i * 5 + 1); return `<rect x="${(r() * 200).toFixed(0)}" y="${(30 + r() * 190).toFixed(0)}" width="1.6" height="1.6" fill="#fff" opacity="${(0.2 + r() * 0.4).toFixed(2)}"/>`; }).join(''),
  };
  // тінь на обличчі для важких настроїв
  const faceShade = {
    depressed: `<path d="${face}" fill="url(#fs-${id})" opacity=".55"/>`,
    stressed: `<path d="${face}" fill="url(#fs-${id})" opacity=".75"/>`,
    afraid: `<path d="${face}" fill="#6a6f86" opacity=".18"/>`,
  }[moodKey] || '';
  const cozyMug = moodKey === 'cozy' ? `<g><path d="M84,186 L84,206 Q84,214 92,214 L108,214 Q116,214 116,206 L116,186Z" fill="#f4f0e6" stroke="${ink}" stroke-width="2.4"/><path d="M116,192 q9,0 9,7 q0,7 -9,7" fill="none" stroke="${ink}" stroke-width="2.4"/><path d="M90,196 c-3,-3 -7,1 -3,4 l3,3 l3,-3 c4,-3 0,-7 -3,-4z" fill="#ec7a8a"/>
    <path d="M76,214 Q78,196 86,190 L90,200 Z M124,214 Q122,196 114,190 L110,200Z" fill="${sk}" stroke="${ink}" stroke-width="2.2" stroke-linejoin="round"/></g>` : '';
  const t = ((S.settings.moodNames || {})[moodKey] || '').toUpperCase() || m.title;
  const fs = t.length > 11 ? 10 : t.length > 8 ? 12 : 14;
  const label = (dx, dy, c, o) => `<text x="${100 + dx}" y="${24 + dy}" text-anchor="middle" font-size="${fs}" font-weight="700" letter-spacing="1.5" fill="${c}" opacity="${o}" font-family="'Courier New',ui-monospace,monospace">${t}</text>`;
  return `<svg viewBox="0 0 200 220" class="mood-art" aria-label="${t}">
    <defs>
      <linearGradient id="fs-${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#14122a"/><stop offset=".55" stop-color="#14122a" stop-opacity=".6"/><stop offset="1" stop-color="#14122a" stop-opacity="0"/></linearGradient>
    </defs>
    ${halftoneBG(id, m.bg[0], m.bg[1], hashStr(moodKey))}
    ${bgExtra[moodKey] || ''}
    <!-- волосся ззаду: боб, що закручується назовні біля плечей -->
    <path d="M54,112 C50,72 72,56 100,56 C128,56 150,72 146,112 C146,136 152,152 160,166 C152,176 140,176 134,170 C138,158 136,148 132,140 L68,140 C64,148 62,158 66,170 C60,176 48,176 40,166 C48,152 54,136 54,112Z" fill="${H.hair}" stroke="${ink}" stroke-width="2.6" stroke-linejoin="round"/>
    <path d="M68,140 C66,150 66,160 70,168 L84,170 L84,150Z M132,140 C134,150 134,160 130,168 L116,170 L116,150Z" fill="${H.hairSh}"/>
    <!-- плечі, сорочка з комірцем -->
    <path d="M26,222 Q30,190 66,182 L134,182 Q170,190 174,222Z" fill="${H.shirt}" stroke="${ink}" stroke-width="2.6"/>
    <path d="M70,186 Q72,200 70,222 M130,186 Q128,200 130,222" stroke="${ink}" stroke-width="1.4" opacity=".35" fill="none"/>
    <!-- шия -->
    <path d="M89,150 L89,184 Q100,192 111,184 L111,150Z" fill="${sk}" stroke="${ink}" stroke-width="2.4"/>
    <path d="M89,158 Q100,170 111,158 L111,168 Q100,176 89,168Z" fill="${H.skinSh}" opacity=".8"/>
    <path d="M82,180 L100,194 L92,204 L74,188Z M118,180 L100,194 L108,204 L126,188Z" fill="#fffaf0" stroke="${ink}" stroke-width="2.2" stroke-linejoin="round"/>
    <!-- вушка -->
    <ellipse cx="64" cy="126" rx="6" ry="8.5" fill="${sk}" stroke="${ink}" stroke-width="2.4"/><ellipse cx="136" cy="126" rx="6" ry="8.5" fill="${sk}" stroke="${ink}" stroke-width="2.4"/>
    <!-- обличчя -->
    <path d="${face}" fill="${sk}" stroke="${ink}" stroke-width="2.6"/>
    <path d="M99,135 q-1.6,3 0.6,3.6" stroke="${ink}" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".7"/>
    <!-- чубчик і пасма -->
    <path d="M54,124 C50,80 72,60 100,60 C128,60 150,80 146,124 L140,126 C139,112 134,102 128,96 C127,104 124,110 120,113 C118,104 113,98 106,95 C105,102 102,108 97,111 C96,103 91,97 84,95 C83,102 79,108 74,110 C73,104 70,100 67,99 C63,106 61,116 61,126Z" fill="${H.hair}" stroke="${ink}" stroke-width="2.6" stroke-linejoin="round"/>
    <path d="M61,122 C58,138 61,150 70,158 C67,146 66,134 68,124Z M139,122 C142,138 139,150 130,158 C133,146 134,134 132,124Z" fill="${H.hair}" stroke="${ink}" stroke-width="2.2" stroke-linejoin="round"/>
    <path d="M74,72 Q88,63 104,64 M80,80 Q90,74 100,74" stroke="${H.hairHl}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    <path d="M118,74 Q126,78 131,86" stroke="${H.hairHl}" stroke-width="2" fill="none" stroke-linecap="round"/>
    ${heroExpression(moodKey, sk)}
    ${faceShade}
    <!-- заколка-грибочок -->
    <g transform="translate(130 84) rotate(18)">
      <path d="M-3,0 L-3,8 Q0,10 3,8 L3,0Z" fill="#fff6e4" stroke="${ink}" stroke-width="1.8"/>
      <path d="M-11,1 Q-10,-11 0,-11 Q10,-11 11,1 Q0,4 -11,1Z" fill="#e04a3c" stroke="${ink}" stroke-width="2"/>
      <circle cx="-5" cy="-5" r="1.9" fill="#fff"/><circle cx="3" cy="-7" r="1.6" fill="#fff"/><circle cx="6" cy="-2" r="1.3" fill="#fff"/>
    </g>
    ${moodKey === 'depressed' || moodKey === 'stressed' ? `<path d="M64,100 Q100,92 136,100 L136,116 Q100,112 64,116Z" fill="#14122a" opacity="${moodKey === 'stressed' ? 0.25 : 0.15}"/>` : ''}
    ${cozyMug}
    <!-- підпис у чорній рамці -->
    <rect x="3" y="3" width="194" height="214" fill="none" stroke="#fff" stroke-width="2.4"/>
    <rect x="${100 - Math.max(46, t.length * fs * 0.42)}" y="8" width="${2 * Math.max(46, t.length * fs * 0.42)}" height="24" fill="#0d0b0b" stroke="#fff" stroke-width="2"/>
    ${label(-1.2, 0.6, '#ff3b5c', 0.7)}${label(1.2, -0.4, '#3be8ff', 0.6)}${label(0, 0, m.label, 1)}
  </svg>`;
}

const MOOD_OF = {
  calm: 'cozy', content: 'happy', joy: 'happy', elation: 'ecstatic', tenderness: 'love', admiration: 'ecstatic', inlove: 'love',
  relief: 'cozy', confidence: 'happy', inspiration: 'ecstatic', celebration: 'ecstatic', touched: 'love', gratitude: 'love',
  cozy: 'cozy', hope: 'happy', emptiness: 'neutral', tired: 'tired', thoughtful: 'neutral', confused: 'afraid', tense: 'stressed',
  awkward: 'neutral', indifferent: 'neutral', bored: 'tired', nostalgia: 'sad', anxiety: 'afraid', sad: 'sad', disappointed: 'sad',
  depressed: 'depressed', anger: 'angry', irritation: 'angry', grief: 'depressed', fear: 'afraid', overwhelmed: 'stressed',
  despair: 'depressed', lonely: 'sad', guilt: 'sad',
};

function moodForEmotion(e) {
  if (!e) return 'neutral';
  if (MOOD_OF[e.face || e.id]) return MOOD_OF[e.face || e.id];
  if (e.score >= 1.5) return 'ecstatic';
  if (e.score >= 0.6) return 'happy';
  if (e.score > -0.5) return 'neutral';
  if (e.score > -1.4) return 'sad';
  return 'depressed';
}

/** Визначає настрій дня за кількістю позначок; при рівності — за середнім настроєм або нейтрально. */
function dayMood(day) {
  if (!day || !day.marks || !day.marks.length) return null;
  const counts = {};
  day.marks.forEach((id) => (counts[id] = (counts[id] || 0) + 1));
  const max = Math.max(...Object.values(counts));
  const top = Object.keys(counts).filter((id) => counts[id] === max);
  const fams = [...new Set(top.map((id) => moodForEmotion(Emo.get(id))))];
  if (fams.length === 1) return { mood: fams[0], emotion: top.length === 1 ? top[0] : null, tie: top.length > 1 };
  // рівна кількість різних емоцій — вирішує середній настрій дня
  const avg = day.marks.reduce((a, id) => a + (Emo.get(id)?.score || 0), 0) / day.marks.length;
  let mood = 'neutral';
  if (avg >= 1.3) mood = 'happy';
  else if (avg <= -1.3) mood = 'sad';
  return { mood, emotion: null, tie: true };
}

