'use strict';
/* own journal — намальовані від руки обличчя-емоції, смайлик серії та ілюстрації настрою дня */

const FACE_INK = '#3b2b25';

/** Опис обличчя для кожної емоції: очі, брови, рот, додатки. */
const FACE_SPECS = {
  calm: { eyes: 'closed', mouth: 'small', extra: ['blush'] },
  content: { eyes: 'dot', mouth: 'smile', extra: ['blush'] },
  joy: { eyes: 'happy', mouth: 'grin', extra: ['blush'] },
  elation: { eyes: 'happy', mouth: 'open', extra: ['blush', 'sparkles'] },
  tenderness: { eyes: 'closed', mouth: 'small', extra: ['blushStrong', 'hearts'] },
  admiration: { eyes: 'star', mouth: 'open', extra: ['sparkles'] },
  inlove: { eyes: 'heart', mouth: 'small', extra: ['blushStrong', 'hearts'] },
  relief: { eyes: 'closed', brows: 'worried', mouth: 'smile', extra: ['sweat'] },
  confidence: { eyes: 'half', brows: 'raised', mouth: 'smirk', extra: ['sparkle1'] },
  inspiration: { eyes: 'star', mouth: 'grin', extra: ['sparkles'] },
  celebration: { eyes: 'happy', mouth: 'open', extra: ['confetti', 'blush'] },
  touched: { eyes: 'teary', mouth: 'wobble', extra: ['blush'] },
  gratitude: { eyes: 'closed', mouth: 'smile', extra: ['blush', 'sparkle1'] },
  cozy: { eyes: 'closed', mouth: 'cat', extra: ['blushStrong', 'steam'] },
  hope: { eyes: 'up', mouth: 'small', extra: ['sparkles'] },
  emptiness: { eyes: 'tiny', mouth: 'none', extra: [] },
  tired: { eyes: 'sleepy', mouth: 'flat', extra: ['zzz', 'bags'] },
  thoughtful: { eyes: 'side', brows: 'one', mouth: 'smirkFlat', extra: ['dots'] },
  confused: { eyes: 'wide', brows: 'worried', mouth: 'wobble', extra: ['question'] },
  tense: { eyes: 'wide', brows: 'worried', mouth: 'teeth', extra: ['sweat'] },
  awkward: { eyes: 'side', mouth: 'wobble', extra: ['blush', 'sweat'] },
  indifferent: { eyes: 'half', mouth: 'flat', extra: [] },
  bored: { eyes: 'sleepy', mouth: 'pout', extra: [] },
  nostalgia: { eyes: 'closed', mouth: 'small', extra: ['tear1', 'blush'] },
  anxiety: { eyes: 'wideTiny', brows: 'worried', mouth: 'wobble', extra: ['sweat', 'sweat2'] },
  sad: { eyes: 'droopy', brows: 'worried', mouth: 'frown', extra: ['tear1'] },
  disappointed: { eyes: 'half', brows: 'worried', mouth: 'frown', extra: [] },
  depressed: { eyes: 'droopy', brows: 'worried', mouth: 'flat', extra: ['gloom'] },
  anger: { eyes: 'dot', brows: 'angry', mouth: 'frown', extra: ['vein'] },
  irritation: { eyes: 'squint', brows: 'angry', mouth: 'teeth', extra: ['vein'] },
  grief: { eyes: 'crying', brows: 'worried', mouth: 'cry', extra: ['tears'] },
  fear: { eyes: 'wideTiny', brows: 'worried', mouth: 'o', extra: ['sweat', 'gloom'] },
  overwhelmed: { eyes: 'swirl', mouth: 'wobble', extra: ['sweat', 'sweat2'] },
  despair: { eyes: 'teary', brows: 'worried', mouth: 'cry', extra: ['tears'] },
  lonely: { eyes: 'down', mouth: 'smallFrown', extra: [] },
  guilt: { eyes: 'down', brows: 'worried', mouth: 'wobble', extra: ['sweat'] },
};

/** Готові обличчя для власних емоцій. */
const FACE_PRESETS = Object.keys(FACE_SPECS);

function hashStr(s) { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }

function lighten(hex, amt) {
  const h = hex.replace('#', '');
  const n = parseInt(h.slice(0, 6), 16);
  const mix = (c) => Math.round(c + (255 - c) * amt);
  return `rgb(${mix((n >> 16) & 255)},${mix((n >> 8) & 255)},${mix(n & 255)})`;
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

const S_ = (w = 3) => `stroke="${FACE_INK}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" fill="none"`;

function eyePair(type, ink = FACE_INK) {
  const L = [36, 46], R = [64, 46];
  const both = (fn) => fn(L[0], L[1], -1) + fn(R[0], R[1], 1);
  const st = (w = 3) => `stroke="${ink}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" fill="none"`;
  const bigEye = (x, y, px = 0, py = 0, pr = 4, r = 9) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" ${st(2.4)}/><circle cx="${x + px}" cy="${y + py}" r="${pr}" fill="${ink}"/><circle cx="${x + px - 1.4}" cy="${y + py - 1.6}" r="1.3" fill="#fff"/>`;
  switch (type) {
    case 'dot': return both((x, y) => `<ellipse cx="${x}" cy="${y}" rx="3.3" ry="4.3" fill="${ink}"/>`);
    case 'tiny': return both((x, y) => `<circle cx="${x}" cy="${y}" r="2.2" fill="${ink}"/>`);
    case 'happy': return both((x, y) => `<path d="M${x - 7},${y + 3} Q${x},${y - 7} ${x + 7},${y + 3}" ${st(3.2)}/>`);
    case 'closed': return both((x, y) => `<path d="M${x - 7},${y - 1} Q${x},${y + 6} ${x + 7},${y - 1}" ${st(3)}/>`);
    case 'half': return both((x, y) => `<path d="M${x - 7},${y - 1} L${x + 7},${y - 1}" ${st(3)}/><path d="M${x - 5},${y} Q${x},${y + 5} ${x + 5},${y}" fill="${ink}"/>`);
    case 'sleepy': return both((x, y) => `<path d="M${x - 7},${y} L${x + 7},${y}" ${st(3)}/><path d="M${x - 5},${y + 1} Q${x},${y + 4} ${x + 5},${y + 1}" ${st(2)}/>`);
    case 'big': return both((x, y) => bigEye(x, y));
    case 'wide': return both((x, y) => bigEye(x, y, 0, 0, 2.6, 10));
    case 'wideTiny': return both((x, y) => bigEye(x, y, 0, 1, 1.8, 10));
    case 'side': return both((x, y) => bigEye(x, y, 3.5, -1.5, 3.6, 8.5));
    case 'up': return both((x, y) => bigEye(x, y, 1, -3.5, 3.8, 9));
    case 'down': return both((x, y) => bigEye(x, y, 1, 3.5, 3.4, 8.5));
    case 'teary': return both((x, y) => bigEye(x, y, 0, 1, 4.5, 9) + `<path d="M${x - 6},${y + 8} Q${x},${y + 11} ${x + 6},${y + 8}" stroke="#6fb2e6" stroke-width="3" fill="none" stroke-linecap="round"/>`);
    case 'droopy': return both((x, y, s) => `<ellipse cx="${x}" cy="${y + 1}" rx="3.4" ry="4" fill="${ink}"/><path d="M${x - 7},${y - 5 + (s < 0 ? 2 : -2)} L${x + 7},${y - 5 + (s < 0 ? -2 : 2)}" ${st(2.6)}/>`);
    case 'crying': return both((x, y) => `<path d="M${x - 7},${y + 2} Q${x},${y - 6} ${x + 7},${y + 2}" ${st(3.2)}/>`);
    case 'squint': return `<path d="M29,41 L41,46 L29,51" ${st(3.2)}/><path d="M71,41 L59,46 L71,51" ${st(3.2)}/>`;
    case 'heart': return both((x, y) => `<path d="M${x},${y + 7} C${x - 12},${y - 1} ${x - 6},${y - 9} ${x},${y - 3} C${x + 6},${y - 9} ${x + 12},${y - 1} ${x},${y + 7}Z" fill="#e2546b" stroke="${ink}" stroke-width="2"/>`);
    case 'star': return both((x, y) => `<path d="M${x},${y - 9} L${x + 2.6},${y - 2.6} L${x + 9},${y - 2} L${x + 4},${y + 2.4} L${x + 5.6},${y + 9} L${x},${y + 5.4} L${x - 5.6},${y + 9} L${x - 4},${y + 2.4} L${x - 9},${y - 2} L${x - 2.6},${y - 2.6}Z" fill="#f6cd4a" stroke="${ink}" stroke-width="2" stroke-linejoin="round"/>`);
    case 'swirl': return both((x, y) => `<path d="M${x},${y} m-1,0 a1.5,1.5 0 1,1 3,0 a3,3 0 1,1 -6,0 a4.5,4.5 0 1,1 9,0 a6,6 0 1,1 -12,0" ${st(2.2)}/>`);
    default: return both((x, y) => `<circle cx="${x}" cy="${y}" r="3.5" fill="${ink}"/>`);
  }
}

function browPair(type, ink = FACE_INK) {
  const st = `stroke="${ink}" stroke-width="3" stroke-linecap="round" fill="none"`;
  switch (type) {
    case 'worried': return `<path d="M27,35 Q34,33 42,29" ${st}/><path d="M73,35 Q66,33 58,29" ${st}/>`;
    case 'angry': return `<path d="M27,29 L43,36" ${st}/><path d="M73,29 L57,36" ${st}/>`;
    case 'raised': return `<path d="M28,32 Q35,26 43,30" ${st}/><path d="M57,30 Q65,26 72,32" ${st}/>`;
    case 'one': return `<path d="M28,34 L43,33" ${st}/><path d="M57,30 Q65,25 72,30" ${st}/>`;
    default: return '';
  }
}

function mouthShape(type, ink = FACE_INK) {
  const st = (w = 3) => `stroke="${ink}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" fill="none"`;
  const dark = '#5a2b25', tongue = '#ef8c8c';
  switch (type) {
    case 'smile': return `<path d="M38,64 Q50,76 62,64" ${st(3.2)}/>`;
    case 'small': return `<path d="M44,66 Q50,71 56,66" ${st(3)}/>`;
    case 'grin': return `<path d="M36,62 Q50,84 64,62 Z" fill="${dark}" ${st(2.6).replace('fill="none"', '')}/><path d="M43,72 Q50,79 57,72 Q50,68 43,72Z" fill="${tongue}"/>`;
    case 'open': return `<path d="M37,61 Q50,88 63,61 Q50,64 37,61Z" fill="${dark}" ${st(2.6).replace('fill="none"', '')}/><ellipse cx="50" cy="74" rx="7" ry="4.5" fill="${tongue}"/>`;
    case 'o': return `<ellipse cx="50" cy="69" rx="5" ry="6.5" fill="${dark}" ${st(2.4).replace('fill="none"', '')}/>`;
    case 'flat': return `<path d="M42,68 L58,68" ${st(3)}/>`;
    case 'frown': return `<path d="M39,73 Q50,62 61,73" ${st(3.2)}/>`;
    case 'smallFrown': return `<path d="M44,71 Q50,66 56,71" ${st(3)}/>`;
    case 'wobble': return `<path d="M38,69 Q41,65 44,69 T50,69 T56,69 T62,69" ${st(2.8)}/>`;
    case 'teeth': return `<rect x="38" y="62" width="24" height="11" rx="4" fill="#fff" ${st(2.6).replace('fill="none"', '')}/><path d="M38,67.5 L62,67.5 M44,62 L44,73 M50,62 L50,73 M56,62 L56,73" stroke="${ink}" stroke-width="1.6"/>`;
    case 'smirk': return `<path d="M41,68 Q53,73 60,62" ${st(3.2)}/>`;
    case 'smirkFlat': return `<path d="M43,69 L57,66" ${st(3)}/>`;
    case 'cry': return `<path d="M37,76 Q50,56 63,76 Q50,72 37,76Z" fill="${dark}" ${st(2.6).replace('fill="none"', '')}/>`;
    case 'cat': return `<path d="M41,65 Q45.5,71 50,66 Q54.5,71 59,65" ${st(3)}/>`;
    case 'pout': return `<path d="M46,69 Q50,65 54,69" ${st(3)}/><path d="M57,67 L61,66" ${st(2)}/>`;
    case 'none': return '';
    default: return `<path d="M40,66 Q50,74 60,66" ${st()}/>`;
  }
}

function faceExtras(list, ink = FACE_INK) {
  let h = '';
  for (const x of list || []) {
    switch (x) {
      case 'blush': h += '<ellipse cx="27" cy="58" rx="7" ry="4.5" fill="#f19a9a" opacity=".55"/><ellipse cx="73" cy="58" rx="7" ry="4.5" fill="#f19a9a" opacity=".55"/>'; break;
      case 'blushStrong': h += '<ellipse cx="27" cy="58" rx="8" ry="5" fill="#ee7f8f" opacity=".8"/><ellipse cx="73" cy="58" rx="8" ry="5" fill="#ee7f8f" opacity=".8"/><path d="M23,57 l3,-3 M27,58 l3,-3 M31,59 l3,-3 M69,57 l3,-3 M73,58 l3,-3" stroke="#c9566a" stroke-width="1.2" stroke-linecap="round"/>'; break;
      case 'sweat': h += `<path d="M79,26 Q85,36 79,39 Q73,36 79,26Z" fill="#9fd3f2" stroke="${ink}" stroke-width="1.8"/>`; break;
      case 'sweat2': h += `<path d="M21,30 Q26,38 21,41 Q16,38 21,30Z" fill="#9fd3f2" stroke="${ink}" stroke-width="1.6"/>`; break;
      case 'tear1': h += `<path d="M64,55 Q68,63 64,66 Q60,63 64,55Z" fill="#8fc8f0" stroke="${ink}" stroke-width="1.6"/>`; break;
      case 'tears': h += '<path d="M32,52 Q30,66 33,80" stroke="#7fbcea" stroke-width="5" fill="none" stroke-linecap="round" opacity=".9"/><path d="M68,52 Q70,66 67,80" stroke="#7fbcea" stroke-width="5" fill="none" stroke-linecap="round" opacity=".9"/>'; break;
      case 'zzz': h += `<text x="70" y="24" font-size="13" font-weight="700" fill="${ink}" font-family="Georgia,serif">z</text><text x="79" y="16" font-size="10" font-weight="700" fill="${ink}" font-family="Georgia,serif">z</text>`; break;
      case 'bags': h += `<path d="M30,54 Q36,57 42,54 M58,54 Q64,57 70,54" stroke="${ink}" stroke-width="1.5" fill="none" opacity=".55"/>`; break;
      case 'hearts': h += '<path d="M82,22 c-4,-4 -9,1 -4,5 l4,4 l4,-4 c5,-4 0,-9 -4,-5z" fill="#e2546b"/><path d="M15,30 c-3,-3 -7,1 -3,4 l3,3 l3,-3 c4,-3 0,-7 -3,-4z" fill="#ef7f90"/>'; break;
      case 'sparkles': h += '<path d="M83,18 l2,6 l6,2 l-6,2 l-2,6 l-2,-6 l-6,-2 l6,-2z" fill="#f6cd4a"/><path d="M16,22 l1.5,4 l4,1.5 l-4,1.5 l-1.5,4 l-1.5,-4 l-4,-1.5 l4,-1.5z" fill="#f6cd4a"/>'; break;
      case 'sparkle1': h += '<path d="M82,20 l2,5 l5,2 l-5,2 l-2,5 l-2,-5 l-5,-2 l5,-2z" fill="#f6cd4a"/>'; break;
      case 'confetti': h += '<rect x="14" y="16" width="5" height="3" fill="#e2546b" transform="rotate(30 16 17)"/><rect x="80" y="12" width="5" height="3" fill="#6fb2e6" transform="rotate(-20 82 13)"/><circle cx="86" cy="30" r="2" fill="#f6cd4a"/><circle cx="12" cy="34" r="2" fill="#8fcf8a"/>'; break;
      case 'vein': h += '<path d="M74,18 l4,4 M82,18 l-4,4 M74,26 l4,-4 M82,26 l-4,-4" stroke="#d64545" stroke-width="2.6" stroke-linecap="round"/>'; break;
      case 'gloom': h += `<path d="M34,10 L34,22 M42,8 L42,20 M50,7 L50,19 M58,8 L58,20 M66,10 L66,22" stroke="${ink}" stroke-width="2" opacity=".45" stroke-linecap="round"/>`; break;
      case 'question': h += `<text x="76" y="26" font-size="20" font-weight="700" fill="${ink}" font-family="Georgia,serif">?</text>`; break;
      case 'dots': h += `<circle cx="76" cy="22" r="2" fill="${ink}"/><circle cx="83" cy="18" r="2" fill="${ink}"/><circle cx="90" cy="14" r="2" fill="${ink}"/>`; break;
      case 'steam': h += `<path d="M80,24 q-4,-5 0,-9 q4,-4 0,-9" stroke="${ink}" stroke-width="1.8" fill="none" opacity=".5" stroke-linecap="round"/>`; break;
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
    const fill = lighten(e.color || '#cccccc', 0.32);
    const body = wobblyCircle(50, 50, 43, hashStr(e.id));
    let inner;
    if (spec) inner = browPair(spec.brows) + eyePair(spec.eyes) + mouthShape(spec.mouth) + faceExtras(spec.extra);
    else inner = `<text x="50" y="63" text-anchor="middle" font-size="40">${esc(e.emoji || '🙂')}</text>`;
    return `<svg viewBox="0 0 100 100" aria-hidden="true"><path d="${body}" fill="${fill}" stroke="${FACE_INK}" stroke-width="3.4"/>${inner}</svg>`;
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

/* ---------- Ілюстрація настрою дня (власна героїня — лісова дівчинка в капелюшку-грибочку) ---------- */
const MOODS = {
  neutral: { title: 'СПОКІЙНО', sub: 'рівний, тихий день', bg: ['#e9e6df', '#b9b4aa'], label: '#f1ede6', ink: '#3b2b25' },
  happy: { title: 'РАДІСНО', sub: 'день із теплим світлом', bg: ['#ffe27a', '#f29ac9'], label: '#fff1a8', ink: '#3b2b25' },
  ecstatic: { title: 'У ЗАХВАТІ', sub: 'день, що сяє', bg: ['#fff35c', '#ff6fb5'], label: '#fff35c', ink: '#3b2b25' },
  love: { title: 'НІЖНО', sub: 'серце сповнене любові', bg: ['#ffd3df', '#f58fae'], label: '#ffd3df', ink: '#3b2b25' },
  cozy: { title: 'ЗАТИШНО', sub: 'спокій і тепло', bg: ['#cfe7c4', '#8fbf9a'], label: '#dff3d6', ink: '#3b2b25' },
  tired: { title: 'ВТОМЛЕНО', sub: 'час відпочити', bg: ['#c8c0e8', '#6e6a9c'], label: '#ddd6ff', ink: '#2c2840' },
  sad: { title: 'СУМНО', sub: 'бережи себе сьогодні', bg: ['#7fb8f0', '#5be0e0'], label: '#a9dcff', ink: '#243448' },
  depressed: { title: 'ВАЖКО', sub: 'ти не сама, усе мине', bg: ['#2e4f8a', '#5a7fa8'], label: '#9fb7e8', ink: '#1f2a44' },
  angry: { title: 'ЗЛІСТЬ', sub: 'видихни, ти маєш право', bg: ['#ffb13b', '#f0442e'], label: '#ffc47a', ink: '#3a1a14' },
  afraid: { title: 'ТРИВОЖНО', sub: 'крок за кроком', bg: ['#9a9a9a', '#3a3a3a'], label: '#d6d6d6', ink: '#1c1c1c' },
  stressed: { title: 'ПЕРЕВАНТАЖЕНО', sub: 'забагато всього — пауза', bg: ['#555', '#151515'], label: '#e8e8e8', ink: '#111' },
};

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

function dither(id, c1, c2) {
  // точковий растр (halftone) поверх градієнта — художня текстура картки
  return `<defs>
    <linearGradient id="g-${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>
    <pattern id="p-${id}" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1.1" fill="#000" opacity=".12"/></pattern>
    <pattern id="q-${id}" width="9" height="9" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.5" fill="#fff" opacity=".22"/></pattern>
  </defs>
  <rect width="200" height="220" fill="url(#g-${id})"/><rect width="200" height="220" fill="url(#p-${id})"/><rect y="0" width="200" height="110" fill="url(#q-${id})"/>`;
}

/** Обличчя героїні для настрою. */
function heroFace(m) {
  const ink = '#2e211c';
  const st = (w = 2.6) => `stroke="${ink}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" fill="none"`;
  const eyesOpen = (py = 0, r = 4.2, white = true) => [86, 114].map((x) => white
    ? `<ellipse cx="${x}" cy="${126 + py}" rx="6.5" ry="7.5" fill="#fff" ${st(2)}/><circle cx="${x}" cy="${127 + py}" r="${r}" fill="#3d5a7a"/><circle cx="${x}" cy="${127 + py}" r="${r * 0.5}" fill="${ink}"/><circle cx="${x - 1.6}" cy="${125 + py}" r="1.3" fill="#fff"/>`
    : `<ellipse cx="${x}" cy="${127 + py}" rx="3.2" ry="4" fill="${ink}"/>`).join('');
  const arcs = (up) => [86, 114].map((x) => `<path d="M${x - 7},${127} Q${x},${up ? 119 : 134} ${x + 7},${127}" ${st(2.8)}/>`).join('');
  const blush = (o = 0.5) => `<ellipse cx="76" cy="140" rx="7" ry="4" fill="#f08c8c" opacity="${o}"/><ellipse cx="124" cy="140" rx="7" ry="4" fill="#f08c8c" opacity="${o}"/>`;
  const tears = '<path d="M84,134 Q82,150 85,162" stroke="#7fbcea" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M116,134 Q118,150 115,162" stroke="#7fbcea" stroke-width="4" fill="none" stroke-linecap="round"/>';
  switch (m) {
    case 'happy': return arcs(true) + blush(0.6) + `<path d="M90,146 Q100,158 110,146 Z" fill="#7a3530" ${st(2.2).replace('fill="none"', '')}/>`;
    case 'ecstatic': return [86, 114].map((x) => `<path d="M${x},${117} l2.6,6 l6.4,.6 l-4.9,4.3 l1.5,6.3 l-5.6,-3.4 l-5.6,3.4 l1.5,-6.3 l-4.9,-4.3 l6.4,-.6z" fill="#ffd84a" stroke="${ink}" stroke-width="1.6"/>`).join('') + blush(0.7) + `<path d="M86,144 Q100,166 114,144 Q100,147 86,144Z" fill="#7a3530" ${st(2.2).replace('fill="none"', '')}/><ellipse cx="100" cy="155" rx="7" ry="4" fill="#ef8c8c"/>`;
    case 'love': return arcs(false) + blush(0.85) + `<path d="M93,148 Q100,153 107,148" ${st()}/>` + '<path d="M146,96 c-4,-4 -10,1 -5,5 l5,5 l5,-5 c5,-4 -1,-9 -5,-5z" fill="#e2546b"/><path d="M52,106 c-3,-3 -8,1 -4,4 l4,4 l4,-4 c4,-3 -1,-7 -4,-4z" fill="#ef7f90"/>';
    case 'cozy': return arcs(false) + blush(0.5) + `<path d="M92,147 Q96,152 100,148 Q104,152 108,147" ${st()}/>`;
    case 'tired': return [86, 114].map((x) => `<path d="M${x - 7},127 L${x + 7},127" ${st(2.8)}/><path d="M${x - 5},130 Q${x},133 ${x + 5},130" ${st(1.6)}/>`).join('') + `<path d="M94,150 L106,150" ${st()}/><text x="140" y="104" font-size="16" font-weight="700" fill="${ink}" font-family="Georgia,serif">z</text><text x="151" y="92" font-size="12" font-weight="700" fill="${ink}" font-family="Georgia,serif">z</text>`;
    case 'sad': return `<path d="M78,116 L92,112 M122,116 L108,112" ${st(2.4)}/>` + eyesOpen(2, 4.4) + `<path d="M92,152 Q100,145 108,152" ${st()}/><path d="M116,134 Q119,141 116,144 Q113,141 116,134Z" fill="#8fc8f0" stroke="${ink}" stroke-width="1.4"/>`;
    case 'depressed': return `<path d="M78,118 L92,113 M122,118 L108,113" ${st(2.4)}/>` + [86, 114].map((x) => `<ellipse cx="${x}" cy="128" rx="3" ry="3.5" fill="${ink}"/><path d="M${x - 7},123 L${x + 7},123" ${st(2)}/>`).join('') + tears + `<path d="M93,152 L107,152" ${st()}/>` + `<path d="M70,84 L70,96 M84,80 L84,92 M100,79 L100,91 M116,80 L116,92 M130,84 L130,96" stroke="${ink}" stroke-width="2" opacity=".35"/>`;
    case 'angry': return `<path d="M77,113 L93,120 M123,113 L107,120" ${st(3)}/>` + eyesOpen(1, 3.4) + `<rect x="88" y="145" width="24" height="9" rx="3" fill="#fff" ${st(2).replace('fill="none"', '')}/><path d="M88,149.5 L112,149.5 M96,145 L96,154 M104,145 L104,154" stroke="${ink}" stroke-width="1.2"/>` + '<path d="M138,90 l5,5 M148,90 l-5,5 M138,100 l5,-5 M148,100 l-5,-5" stroke="#c62f2f" stroke-width="3" stroke-linecap="round"/>' + blush(0.55);
    case 'afraid': return `<path d="M78,114 Q85,110 92,111 M122,114 Q115,110 108,111" ${st(2.4)}/>` + [86, 114].map((x) => `<ellipse cx="${x}" cy="127" rx="7" ry="8" fill="#fff" ${st(2)}/><circle cx="${x}" cy="128" r="2" fill="${ink}"/>`).join('') + `<path d="M90,151 Q93,147 96,151 T102,151 T108,151" ${st(2.2)}/><path d="M138,104 Q144,114 138,117 Q132,114 138,104Z" fill="#9fd3f2" stroke="${ink}" stroke-width="1.5"/>`;
    case 'stressed': return [86, 114].map((x) => `<path d="M${x},127 m-1,0 a1.5,1.5 0 1,1 3,0 a3,3 0 1,1 -6,0 a4.5,4.5 0 1,1 9,0" ${st(1.8)}/>`).join('') + `<path d="M88,150 Q91,146 94,150 T100,150 T106,150 T112,150" ${st(2.2)}/><path d="M64,96 l6,6 M136,96 l-6,6 M58,120 l8,0 M142,120 l-8,0" ${st(2)}/>`;
    default: return eyesOpen(0, 4) + `<path d="M94,149 Q100,152 106,149" ${st()}/>` + blush(0.35);
  }
}

function moodCardSVG(moodKey, uidStr) {
  const m = MOODS[moodKey] || MOODS.neutral;
  const id = uidStr || moodKey;
  const ink = '#2e211c';
  const hair = '#6b3f2a';
  const extras = {
    ecstatic: '<path d="M28,40 l3,8 l8,3 l-8,3 l-3,8 l-3,-8 l-8,-3 l8,-3z" fill="#fff" opacity=".85"/><path d="M170,52 l2,6 l6,2 l-6,2 l-2,6 l-2,-6 l-6,-2 l6,-2z" fill="#fff" opacity=".85"/>',
    happy: '<circle cx="34" cy="44" r="3" fill="#fff" opacity=".7"/><circle cx="168" cy="58" r="2.5" fill="#fff" opacity=".7"/>',
    love: '<path d="M30,52 c-4,-4 -10,1 -5,5 l5,5 l5,-5 c5,-4 -1,-9 -5,-5z" fill="#fff" opacity=".7"/>',
    sad: '<path d="M30,30 l0,12 M42,24 l0,12 M160,34 l0,12 M172,26 l0,12" stroke="#fff" stroke-width="2" opacity=".55" stroke-linecap="round"/>',
    depressed: '<path d="M30,30 l0,14 M44,22 l0,14 M158,30 l0,14 M172,22 l0,14 M100,14 l0,10" stroke="#cfe0ff" stroke-width="2" opacity=".45" stroke-linecap="round"/>',
    stressed: Array.from({ length: 40 }, (_, i) => { const r = rng(i + 3); return `<rect x="${(r() * 200).toFixed(0)}" y="${(r() * 220).toFixed(0)}" width="2" height="2" fill="#fff" opacity="${(0.2 + r() * 0.5).toFixed(2)}"/>`; }).join(''),
    tired: '<circle cx="160" cy="40" r="12" fill="#fff6d6" opacity=".8"/><circle cx="166" cy="36" r="11" fill="#6e6a9c" opacity=".9"/>',
    cozy: '<path d="M26,190 q6,-14 12,0 M160,186 q6,-14 12,0" stroke="#5f8a5a" stroke-width="3" fill="none"/>',
  };
  return `<svg viewBox="0 0 200 220" class="mood-art" aria-label="${m.title}">${dither(id, m.bg[0], m.bg[1])}${extras[moodKey] || ''}
    <!-- плечі та сукня -->
    <path d="M44,220 Q48,176 100,172 Q152,176 156,220Z" fill="#7c8f5a" stroke="${ink}" stroke-width="3"/>
    <path d="M86,174 Q100,186 114,174" stroke="${ink}" stroke-width="2.4" fill="#f3e9d2"/>
    <!-- волосся ззаду -->
    <path d="M56,128 Q52,176 72,182 L128,182 Q148,176 144,128 Z" fill="${hair}" stroke="${ink}" stroke-width="3"/>
    <!-- обличчя -->
    <path d="M62,124 Q62,82 100,82 Q138,82 138,124 Q138,166 100,166 Q62,166 62,124Z" fill="#fbe2cc" stroke="${ink}" stroke-width="3"/>
    <!-- чубчик -->
    <path d="M62,118 Q64,90 100,88 Q136,90 138,118 Q124,104 112,110 Q104,98 94,108 Q80,100 62,118Z" fill="${hair}" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/>
    <!-- капелюшок-грибочок -->
    <path d="M42,94 Q48,46 100,42 Q152,46 158,94 Q100,104 42,94Z" fill="#c8473b" stroke="${ink}" stroke-width="3"/>
    <ellipse cx="74" cy="72" rx="7" ry="5" fill="#fff4e8"/><ellipse cx="104" cy="58" rx="8" ry="5.5" fill="#fff4e8"/><ellipse cx="132" cy="76" rx="6" ry="4.5" fill="#fff4e8"/><ellipse cx="92" cy="82" rx="4" ry="3" fill="#fff4e8"/>
    <path d="M150,88 q8,-6 12,2 q-8,6 -12,-2z" fill="#7c8f5a" stroke="${ink}" stroke-width="1.8"/>
    ${heroFace(moodKey)}
    <!-- підпис -->
    <rect x="34" y="6" width="132" height="24" rx="3" fill="#1f1714" stroke="#fff" stroke-width="2"/>
    <text x="100" y="23" text-anchor="middle" font-size="${m.title.length > 10 ? 10.5 : 13}" font-weight="700" letter-spacing="2" fill="${m.label}" font-family="Georgia,serif">${m.title}</text>
  </svg>`;
}
