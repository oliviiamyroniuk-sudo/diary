'use strict';
/* own journal — свої картинки для настрою дня та смайликів емоцій.
   Картинки живуть тільки на телефоні (у базі щоденника) і потрапляють у повну копію.
   S.art = { lib: { ключ: Blob }, names: {}, credits: {}, moodSets: {}, faceMap: {} }
   S.settings.artMood = { настрій: ключ }, S.settings.artEmo = { емоція: ключ } */

S.art = { lib: {}, names: {}, credits: {}, moodSets: {}, faceMap: {} };

async function loadArt() {
  try {
    const row = (await DB.all('kv')).find((r) => r.key === 'art');
    if (row && row.value) S.art = { lib: {}, names: {}, credits: {}, moodSets: {}, faceMap: {}, ...row.value };
  } catch (e) { console.warn(e); }
}
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
  await saveArt();
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

function libKeys(kind) {
  return Object.keys(S.art.lib).filter((k) => (kind === 'face' ? k.startsWith('f:') || k.startsWith('own:face') : k.startsWith('m') || k.startsWith('own:mood'))).sort();
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
    const n = await importArtPack(file);
    toast(`Pictures added: ${n} ✨`);
    render();
  } catch (e) { console.error(e); toast(e.message || 'Couldn’t import the pack', 3500); }
};
