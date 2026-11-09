'use strict';
/* own journal — свої картинки для настрою дня та смайликів емоцій.
   Картинки живуть тільки на телефоні (у базі щоденника) і потрапляють у повну копію.
   S.art = { lib: { ключ: Blob }, names: {}, credits: {}, moodSets: {}, faceMap: {} }
   S.settings.artMood = { настрій: ключ }, S.settings.artEmo = { емоція: ключ } */

S.art = { lib: {}, names: {}, credits: {}, moodSets: {}, faceMap: {}, themes: [] };

async function loadArt() {
  try {
    const row = (await DB.all('kv')).find((r) => r.key === 'art');
    if (row && row.value) S.art = { lib: {}, names: {}, credits: {}, moodSets: {}, faceMap: {}, themes: [], ...row.value };
  } catch (e) { console.warn(e); }
  registerPicThemes();
}

/* ---------- теми-картинки: картинка зверху, суцільний колір нижче ---------- */
const BUILTIN_PIC_THEMES = [
  {"id": "pic_cozyCat", "name": "Cozy evening", "sub": "A sleepy cat, fireplace and snow outside", "dark": true, "bgTop": "#331508", "bgBottom": "#331508", "card": "#46200F", "border": "#7A4326", "accent": "#F0A85A", "text": "#F6E6D2", "subc": "#CDAA88", "orn": "· ✦ ·", "src": "themes/cozyCat.webp", "builtin": true},
  {"id": "pic_rainyLondon", "name": "Rainy London", "sub": "Red umbrella, lamplight, evening rain", "dark": true, "bgTop": "#071A3E", "bgBottom": "#071A3E", "card": "#10264F", "border": "#2E4A7A", "accent": "#E0574F", "text": "#EAF0FA", "subc": "#A4B4D0", "orn": "· ✦ ·", "src": "themes/rainyLondon.webp", "builtin": true},
  {"id": "pic_summerFair", "name": "Summer fair", "sub": "Ferris wheel, carousel and fireworks", "dark": true, "bgTop": "#051749", "bgBottom": "#051749", "card": "#10245E", "border": "#34408A", "accent": "#F0A8D8", "text": "#F1ECFF", "subc": "#B4B2DA", "orn": "· ✦ ·", "src": "themes/summerFair.webp", "builtin": true},
  {"id": "pic_deepSea", "name": "Deep sea", "sub": "Glowing jellyfish in sunbeams", "dark": true, "bgTop": "#05153E", "bgBottom": "#05153E", "card": "#0E2152", "border": "#2A3F86", "accent": "#8FD0FF", "text": "#E8F2FF", "subc": "#A0B6DC", "orn": "· ✦ ·", "src": "themes/deepSea.webp", "builtin": true},
  {"id": "pic_mushroomVillage", "name": "Mushroom village", "sub": "Moonlight, lanterns and a little bridge", "dark": true, "bgTop": "#031442", "bgBottom": "#031442", "card": "#0E1F55", "border": "#34397F", "accent": "#F4C46A", "text": "#EFEAFF", "subc": "#B0AAD8", "orn": "· ✦ ·", "src": "themes/mushroomVillage.webp", "builtin": true},
  {"id": "pic_hornedFriend", "name": "Horned friend", "sub": "Knitting by a warm window", "dark": true, "bgTop": "#28150C", "bgBottom": "#28150C", "card": "#3A2015", "border": "#6A3C26", "accent": "#E9854E", "text": "#F2E4CC", "subc": "#C4A88A", "orn": "· ✦ ·", "heroH": 380, "src": "themes/hornedFriend.webp", "builtin": true},
  {"id": "pic_firefly", "name": "Welcome back, firefly", "sub": "Pink and green watercolor heart", "dark": true, "bgTop": "#344737", "bgBottom": "#344737", "card": "#3F5A45", "border": "#6E8E70", "accent": "#F2A0BC", "text": "#F6F0E6", "subc": "#C8D8C4", "orn": "· ✦ ·", "heroH": 430, "src": "themes/firefly.webp", "builtin": true},
];
/** Адреса картинки теми: вбудована (файл) або своя (з бібліотеки). */
function picURL(t) { return !t || !t.img ? '' : t.src || artURL(t.img); }
function registerPicThemes() {
  for (let i = THEMES.length - 1; i >= 0; i--) if (THEMES[i].img) THEMES.splice(i, 1);
  const own = (S.art.themes || []).filter((t) => t && t.id && S.art.lib[t.img] && !BUILTIN_PIC_THEMES.some((b) => b.id === t.id));
  const list = [...BUILTIN_PIC_THEMES.map((t) => ({ ...t, img: t.src })), ...own];
  THEMES.unshift(...list.map((t) => T({ sky: [], layers: [], scene: 'minimal', particles: '', dark: true, ...t, cat: 'pictures', decor: [] })));
}
function mergePicThemes(list) {
  const cur = S.art.themes || (S.art.themes = []);
  for (const t of list || []) {
    if (!t || !t.id) continue;
    const i = cur.findIndex((x) => x.id === t.id);
    if (i >= 0) cur[i] = t; else cur.push(t);
  }
}

/** Тема з власної картинки: колір фону береться з низу картинки, акцент — найяскравіший колір. */
async function themeFromImage(file) {
  const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('Couldn’t open this picture')); i.src = URL.createObjectURL(file); });
  const W = 900, H = Math.round(img.naturalHeight * W / img.naturalWidth);
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const c = cv.getContext('2d');
  c.drawImage(img, 0, 0, W, H);
  const data = c.getImageData(0, 0, W, H).data;
  const at = (x, y) => { const i = (y * W + x) * 4; return [data[i], data[i + 1], data[i + 2]]; };
  // колір низу — медіана нижніх 6 % картинки
  const bottom = [];
  for (let y = Math.floor(H * 0.94); y < H; y += 3) for (let x = 0; x < W; x += 9) bottom.push(at(x, y));
  const med = [0, 1, 2].map((k) => { const a = bottom.map((p) => p[k]).sort((m, n) => m - n); return a[a.length >> 1]; });
  // акцент — найнасиченіший світлий колір верхньої частини
  let best = null, bs = -1;
  for (let y = 0; y < H * 0.7; y += 7) for (let x = 0; x < W; x += 7) {
    const [r, g, b] = at(x, y), mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    const score = (mx - mn) * (mx / 255) * (mx > 120 ? 1 : 0.2);
    if (score > bs) { bs = score; best = [r, g, b]; }
  }
  // плавний перехід низу картинки в колір фону
  const fade = Math.round(H * 0.08);
  for (let y = H - fade; y < H; y++) { c.fillStyle = `rgba(${med},${((y - (H - fade)) / fade) ** 1.3})`; c.fillRect(0, y, W, 1); }
  const blob = await new Promise((res) => cv.toBlob(res, 'image/jpeg', 0.86));
  const hex = (p) => '#' + p.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const mix = (p, q, k) => p.map((v, i) => v + (q[i] - v) * k);
  const bg = hex(med), dark = !isLight(bg);
  const toward = dark ? [255, 255, 255] : [0, 0, 0];
  return {
    blob,
    theme: { dark, bgTop: bg, bgBottom: bg, card: hex(mix(med, toward, dark ? 0.08 : 0.5)), border: hex(mix(med, toward, dark ? 0.22 : 0.18)),
      accent: hex(best || mix(med, toward, 0.6)), text: dark ? '#F4EEE6' : '#2E2620', subc: hex(mix(med, toward, 0.62)), orn: '· ✦ ·' },
  };
}
ACT.picThemeAdd = async () => {
  const file = await new Promise((res) => { const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*'; inp.onchange = () => res(inp.files[0] || null); inp.click(); });
  if (!file) return;
  try {
    toast('Making a theme…', 3000);
    const { blob, theme: t } = await themeFromImage(file);
    const name = prompt('Name for the new theme:', 'My picture theme');
    if (name == null) return;
    const id = 'pic_' + uid().slice(0, 8);
    S.art.lib['th:' + id] = blob;
    mergePicThemes([{ ...t, id, img: 'th:' + id, name: name.trim() || 'My picture theme', sub: 'From my picture', own: true }]);
    await saveArt();
    registerPicThemes();
    await ACT.pickTheme({ dataset: { id } });
  } catch (e) { console.error(e); toast(e.message || 'Couldn’t make the theme', 4000); }
};
ACT.picThemeDel = async (el, ev) => {
  ev && ev.stopPropagation();
  const id = el.dataset.id, t = (S.art.themes || []).find((x) => x.id === id);
  if (!t || !confirm(`Delete the theme “${t.name}”?`)) return;
  S.art.themes = S.art.themes.filter((x) => x.id !== id);
  delete S.art.lib[t.img];
  await saveArt();
  registerPicThemes();
  if (S.settings.themeId === id) { S.settings.themeId = 'darkForest'; await saveSettings(); applyTheme(); }
  render();
};
async function saveArt() { await DB.put('kv', { key: 'art', value: S.art }); }

function artURL(key) { const b = key && S.art.lib[key]; return b ? blobURL('art-' + key, b) : ''; }
function moodArtKey(mood) { return (S.settings.artMood || {})[mood] || ''; }
function emoArtKey(id) { return (S.settings.artEmo || {})[id] || ''; }

/* ---------- підміна малювання: якщо обрано картинку — показуємо її ---------- */
(function hookArt() {
  const baseSvg = Faces.svg, baseNested = Faces.nested, baseCard = moodCardSVG;
  Faces.svg = function (e) {
    const u = e && artURL(emoArtKey(e.id));
    return u ? `<img class="face-img" src="${u}" alt="" draggable="false">` : baseSvg.call(Faces, e);
  };
  Faces.nested = function (e, x, y, size) {
    const u = e && artURL(emoArtKey(e.id));
    return u ? `<image href="${u}" x="${x}" y="${y}" width="${size}" height="${size}"/>` : baseNested.call(Faces, e, x, y, size);
  };
  moodCardSVG = function (mood, id) {
    const u = artURL(moodArtKey(mood));
    return u ? `<img class="mood-art" src="${u}" alt="${esc((MOODS[mood] || {}).title || '')}" draggable="false">` : baseCard(mood, id);
  };
})();

/* ---------- імпорт набору картинок (один файл) ---------- */
async function importArtPack(file) {
  let pack;
  try { pack = JSON.parse(await file.text()); } catch { throw new Error('Wrong file — choose own-journal-pictures'); }
  if (pack.kind !== 'own-journal-art') throw new Error('This is not a picture pack for own journal');
  let n = 0;
  for (const [k, data] of Object.entries(pack.lib || {})) {
    S.art.lib[k] = await (await fetch(data)).blob();
    n++;
  }
  Object.assign(S.art.names, pack.names || {});
  Object.assign(S.art.credits, pack.credits || {});
  Object.assign(S.art.moodSets, pack.moodSets || {});
  Object.assign(S.art.faceMap, pack.faceMap || {});
  mergePicThemes(pack.themes);
  await saveArt();
  registerPicThemes();
  // якщо ще нічого не обрано — одразу ставимо набір за замовчуванням
  if (!Object.keys(S.settings.artMood || {}).length && pack.defaultMood && pack.moodSets?.[pack.defaultMood]) S.settings.artMood = { ...pack.moodSets[pack.defaultMood] };
  if (!Object.keys(S.settings.artEmo || {}).length && pack.faceMap) S.settings.artEmo = { ...pack.faceMap };
  await saveSettings();
  return n;
}

/** Своя картинка з галереї: смайлик — квадрат по центру, настрій — як є (до 420 px). */
async function pickOwnImage(kind) {
  const file = await new Promise((res) => {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = 'image/*';
    inp.onchange = () => res(inp.files[0] || null);
    inp.click();
  });
  if (!file) return null;
  const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(file); });
  const cv = document.createElement('canvas');
  const c = cv.getContext('2d');
  if (kind === 'face') {
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    cv.width = cv.height = 160;
    c.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, 160, 160);
  } else {
    const k = Math.min(1, 420 / Math.max(img.naturalWidth, img.naturalHeight));
    cv.width = Math.round(img.naturalWidth * k); cv.height = Math.round(img.naturalHeight * k);
    c.drawImage(img, 0, 0, cv.width, cv.height);
  }
  const blob = await new Promise((res) => cv.toBlob(res, kind === 'face' ? 'image/png' : 'image/jpeg', 0.9));
  const key = `own:${kind}:${uid()}`;
  S.art.lib[key] = blob;
  S.art.names[key] = 'My picture';
  await saveArt();
  return key;
}

/* ---------- сторінка «Мої картинки» ---------- */
const MOOD_ORDER = ['neutral', 'happy', 'ecstatic', 'love', 'cozy', 'tired', 'sad', 'depressed', 'angry', 'afraid', 'stressed'];
const MOOD_UA = { neutral: 'Neutral', happy: 'Happy', ecstatic: 'Ecstatic', love: 'In love', cozy: 'Cozy', tired: 'Tired', sad: 'Sad', depressed: 'Depressed', angry: 'Angry', afraid: 'Afraid', stressed: 'Stressed out' };

function moodName(m) { return (S.settings.moodNames || {})[m] || MOOD_UA[m] || m; }
function moodHeadline(m) {
  const own = (S.settings.moodNames || {})[m];
  if (own) return own;
  const sub = (MOODS[m] || {}).sub || '';
  return sub.charAt(0).toUpperCase() + sub.slice(1);
}

ACT.renameMood = async (el) => {
  const m = el.dataset.m;
  const name = prompt('New name for this mood (leave empty to restore):', (S.settings.moodNames || {})[m] || moodHeadline(m));
  if (name == null) return;
  const map = { ...(S.settings.moodNames || {}) };
  if (name.trim()) map[m] = name.trim(); else delete map[m];
  S.settings.moodNames = map;
  try { await saveSettings(); } catch (e) { toast('Couldn’t save: ' + (e.message || e), 5000); return; }
  toast('Saved ✓');
  closeAllSheets(); render();
};

/* ---------- мої фото як фони й заставки ---------- */
function myBgKeys() { return Object.keys(S.art.lib).filter((k) => k.startsWith('bg:')).sort().reverse(); }
function myBackgroundsCard() {
  const keys = myBgKeys();
  const st = S.settings;
  const custom = st.headerImg || st.bgImg || st.coverImg || Object.keys(st.sectionBg || {}).length;
  return `<div class="card stack">
    <div class="row"><div class="grow"><div class="serif" style="font-size:18px">My photos as backgrounds</div>
      <div class="small muted">Add photos from your library and use them as the home picture, background or lock screen.</div></div></div>
    <div class="mybg-grid">
      <label class="mybg add">${icon('plus', 22)}<span class="small">Add photos</span><input type="file" accept="image/*" multiple hidden onchange="addMyBackgrounds(this)"></label>
      ${keys.map((k) => `<button class="mybg" data-act="myBgMenu" data-k="${k}"><img src="${artURL(k)}" alt="" loading="lazy"></button>`).join('')}
    </div>
    ${custom ? `<button class="btn full" data-act="myBgReset">${icon('back', 16)} Use the theme’s own pictures again</button>` : ''}
  </div>`;
}
async function addMyBackgrounds(inp) {
  const files = Array.from(inp.files || []);
  if (!files.length) return;
  toast('Adding photo…', 3000);
  let n = 0;
  for (const f of files) { const b = await shrinkImage(f, 2000); if (b) { S.art.lib['bg:' + Date.now().toString(36) + uid().slice(0, 4)] = b; n++; } }
  await saveArt();
  toast(n ? 'Photo added 📷' : 'Couldn’t add one of the photos');
  render();
}
ACT.myBgMenu = (el) => {
  const k = el.dataset.k;
  const use = (fn, msg) => async () => {
    pushLookHistory(); fn(S.art.lib[k]);
    try { await saveSettings(); } catch (e) { toast('Couldn’t save: ' + (e.message || e), 5000); return; }
    applyTheme(); toast(msg || 'Saved ✓'); render();
  };
  menuSheet('My photo', [
    { label: 'Use as home screen picture', icon: 'image', run: use((b) => { S.settings.headerImg = b; }) },
    { label: 'Use as background everywhere', icon: 'image', run: use((b) => { S.settings.bgImg = b; }) },
    ...SECTIONS.map(([sec, n]) => ({ label: `Use as background: ${n}`, icon: 'image', run: use((b) => { S.settings.sectionBg = { ...(S.settings.sectionBg || {}), [sec]: b }; }) })),
    { label: 'Use as lock screen cover', icon: 'lock', run: use((b) => { S.settings.coverImg = b; }) },
    { label: 'Delete this photo', icon: 'trash', danger: true, run: async () => { if (!confirm('Delete this photo from your backgrounds?')) return; delete S.art.lib[k]; await saveArt(); render(); } },
  ]);
};
ACT.myBgReset = async () => {
  pushLookHistory();
  Object.assign(S.settings, { headerImg: null, bgImg: null, coverImg: null, sectionBg: {} });
  try { await saveSettings(); } catch (e) { toast('Couldn’t save: ' + (e.message || e), 5000); return; }
  applyTheme(); toast('Saved ✓'); render();
};

function libKeys(kind) {
  return Object.keys(S.art.lib).filter((k) => (kind === 'face' ? k.startsWith('f:') || k.startsWith('own:face') : /^m\d:/.test(k) || k.startsWith('own:mood'))).sort();
}

ROUTES.art = async (v) => {
  const haveLib = Object.keys(S.art.lib).length > 0;
  const am = S.settings.artMood || {}, ae = S.settings.artEmo || {};
  const sets = Object.keys(S.art.moodSets || {});
  const credits = Object.values(S.art.credits || {}).filter(Boolean);
  const curSet = S.settings.artSetName ?? (Object.keys(am).length ? (sets.find((k) => JSON.stringify(S.art.moodSets[k]) === JSON.stringify(am)) || null) : '');
  v.innerHTML = `${topbar('My pictures')}
  <div class="page stack">
    <div class="card stack">
      <div class="small muted">Here you can use your own pictures instead of the drawn ones: for the mood of the day and for each smiley. Pictures are stored only on this phone and are included in the full backup.</div>
      <button class="btn full solid" data-act="artImport">${icon('download')} Import picture pack</button>
      ${haveLib ? `<div class="small muted">In the library: ${libKeys('mood').length} mood pictures, ${libKeys('face').length} smileys.${credits.length ? ` Artists: ${credits.map(esc).join(', ')}.` : ''}</div>` : ''}
    </div>
    <div class="card stack">
      <div class="serif" style="font-size:18px">Mood of the day</div>
      ${sets.length ? `<div class="row" style="flex-wrap:wrap;gap:6px">${sets.map((k, i) => `<button class="pill ${curSet === k ? 'on' : ''}" data-act="artSet" data-set="${k}">Set ${i + 1}</button>`).join('')}<button class="pill ${curSet === '' ? 'on' : ''}" data-act="artSet" data-set="">Drawn</button></div>` : ''}
      <div class="art-mood-grid">${MOOD_ORDER.map((m) => `<button class="art-mood" data-act="artMood" data-m="${m}">${moodCardSVG(m, 'am' + m)}<span class="small">${esc(moodName(m))}</span></button>`).join('')}</div>
    </div>
    <div class="card stack">
      <div class="serif" style="font-size:18px">Emotion smileys</div>
      ${Object.keys(S.art.faceMap || {}).length ? `<div class="row" style="flex-wrap:wrap;gap:6px"><button class="pill" data-act="artFaces" data-v="pack">From pack</button><button class="pill" data-act="artFaces" data-v="">Drawn</button></div>` : ''}
      <div class="art-face-grid">${Emo.all().map((e) => `<button class="art-face" data-act="artEmo" data-id="${e.id}"><span class="emo face" style="--s:52px">${Faces.svg(e)}</span><span class="small">${esc(e.name)}</span></button>`).join('')}</div>
    </div>
  </div>`;
};

async function saveSafe() {
  try { await saveSettings(); return true; } catch (e) { console.error(e); toast('Couldn’t save: ' + (e.message || e.name || e), 5000); return false; }
}
ACT.artSet = async (el) => {
  const k = el.dataset.set;
  S.settings.artMood = k ? { ...S.art.moodSets[k] } : {};
  S.settings.artSetName = k;
  if (await saveSafe()) { toast(k ? `${el.textContent.trim()} ✓` : 'Drawn ✓'); render(); }
};
ACT.artFaces = async (el) => {
  S.settings.artEmo = el.dataset.v ? { ...S.art.faceMap } : {};
  if (await saveSafe()) render();
};
ACT.artMood = (el) => chooseArt('mood', el.dataset.m);
ACT.artEmo = (el) => chooseArt('face', el.dataset.id);

function chooseArt(kind, slot) {
  const keys = libKeys(kind);
  const cur = kind === 'face' ? emoArtKey(slot) : moodArtKey(slot);
  const title = kind === 'face' ? esc(Emo.get(slot)?.name || '') : esc(moodName(slot));
  const html = `<div class="row" style="gap:8px;flex-wrap:wrap;margin-bottom:10px">
      <button class="btn" data-pick="__own">${icon('photos', 18)} From photos</button>
      <button class="btn" data-pick="__none">Drawn</button>
      <button class="btn" data-pick="__rename">${icon('pen', 18)} Rename</button></div>
    ${keys.length ? `<div class="${kind === 'face' ? 'art-pick-faces' : 'art-pick-moods'}">${keys.map((k) => `<button class="art-pick ${k === cur ? 'on' : ''}" data-pick="${k}"><img src="${artURL(k)}" alt="" loading="lazy"></button>`).join('')}</div>`
      : '<div class="small muted">The library is empty — import a pack or add your own picture from photos.</div>'}`;
  openSheet(title, html, (body, close) => {
    body.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-pick]');
      if (!b) return;
      let key = b.dataset.pick;
      if (key === '__rename') {
        const isFace = kind === 'face';
        const cur = isFace ? Emo.get(slot)?.name : moodName(slot);
        const name = prompt(isFace ? 'New name for this emotion:' : 'New name for this mood:', cur || '');
        if (name == null) return;
        const field = isFace ? 'emoNames' : 'moodNames';
        const map = { ...(S.settings[field] || {}) };
        if (name.trim()) map[slot] = name.trim(); else delete map[slot];
        S.settings[field] = map;
        await saveSettings(); close(); render(); return;
      }
      if (key === '__own') { key = await pickOwnImage(kind); if (!key) return; }
      const field = kind === 'face' ? 'artEmo' : 'artMood';
      const map = { ...(S.settings[field] || {}) };
      if (key === '__none') delete map[slot]; else map[slot] = key;
      S.settings[field] = map;
      await saveSettings();
      close(); render();
    });
  }, { doneText: 'Close' });
}

ACT.artImport = async () => {
  const file = await new Promise((res) => {
    const inp = document.createElement('input');
    inp.type = 'file'; // без обмеження типу: iPhone інколи не дає вибрати .json
    inp.onchange = () => res(inp.files[0] || null);
    inp.click();
  });
  if (!file) return;
  try {
    toast('Importing pictures…', 1500);
    const before = (S.art.themes || []).length;
    const n = await importArtPack(file);
    const nt = (S.art.themes || []).length - before;
    toast(nt > 0 ? `New themes: ${nt} ✨ — see Themes → Pictures` : `Pictures added: ${n} ✨`, 3500);
    render();
  } catch (e) { console.error(e); toast(e.message || 'Couldn’t import the pack', 3500); }
};
registerPicThemes();
