'use strict';
/* own journal — голосові записи, малювання, Face ID, експорт в архів, повна резервна копія */

/* ==========================================================================
   ГОЛОСОВІ ЗАПИСИ
   ========================================================================== */
const VoiceCache = {};
const fmtDur = (sec) => `${Math.floor(sec / 60)}:${pad(Math.floor(sec % 60))}`;

async function getVoice(id) {
  if (VoiceCache[id]) return VoiceCache[id];
  const rec = await DB.get('voices', id);
  if (rec) VoiceCache[id] = rec;
  return rec;
}

/** Малює плеєр усередині кожного блоку голосового запису. */
async function hydrateVoices(root, editable) {
  for (const el of $$('.voice[data-voice]', root)) {
    const rec = await getVoice(el.dataset.voice);
    el.contentEditable = 'false';
    el.innerHTML = rec
      ? `<button class="vplay" data-vplay="${rec.id}">${icon('play', 16)}</button>
         <div class="grow"><div class="vname">${esc(rec.name || 'Голосовий запис')}</div>
         <div class="vbar"><i></i></div></div><span class="vdur">${fmtDur(rec.duration || 0)}</span>
         ${editable ? `<button class="vmore" data-vmore="${rec.id}">${icon('more', 16)}</button>` : ''}`
      : '<span class="small muted">Запис не знайдено</span>';
  }
}

let currentAudio = null;
document.addEventListener('click', async (ev) => {
  const p = ev.target.closest('[data-vplay]');
  if (!p) return;
  ev.preventDefault();
  ev.stopPropagation();
  const id = p.dataset.vplay;
  const box = p.closest('.voice');
  if (currentAudio && currentAudio._id === id) {
    if (currentAudio.paused) { currentAudio.play(); p.innerHTML = icon('pause', 16); } else { currentAudio.pause(); p.innerHTML = icon('play', 16); }
    return;
  }
  if (currentAudio) { currentAudio.pause(); $$('[data-vplay]').forEach((b) => (b.innerHTML = icon('play', 16))); }
  const rec = await getVoice(id);
  if (!rec) return;
  const a = new Audio(blobURL('voice-' + id, rec.blob));
  a._id = id;
  currentAudio = a;
  const bar = $('.vbar i', box);
  a.ontimeupdate = () => { if (bar) bar.style.width = `${(a.currentTime / (a.duration && isFinite(a.duration) ? a.duration : rec.duration || 1)) * 100}%`; };
  a.onended = () => { p.innerHTML = icon('play', 16); if (bar) bar.style.width = '0'; currentAudio = null; };
  a.play().catch(() => toast('Не вдалося відтворити запис'));
  p.innerHTML = icon('pause', 16);
}, true);

/** Вікно запису голосу: запис, пауза, продовження, прослуховування, назва. */
function openRecorder(entryId, onSaved) {
  let stream, rec, chunks = [], timer, elapsed = 0, startedAt = 0, state = 'idle', blob = null;
  const mime = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/aac'].find((m) => window.MediaRecorder && MediaRecorder.isTypeSupported?.(m)) || '';
  const now = new Date();
  const build = () => `<div class="stack center">
    <div class="rec-dot ${state === 'rec' ? 'on' : ''}">${icon('mic', 34)}</div>
    <div class="rec-time" id="rec-time">${fmtDur(elapsed)}</div>
    <div class="small muted" id="rec-state">${{ idle: 'Натисни, щоб почати запис', rec: 'Іде запис…', paused: 'Пауза', done: 'Запис готовий — послухай і збережи' }[state]}</div>
    ${state === 'done' ? `<audio controls src="${URL.createObjectURL(blob)}" style="width:100%"></audio>
      <input class="text-input" id="rec-name" value="Голосовий запис ${D.time(now)}" placeholder="Назва запису">` : ''}
    <div class="row" style="justify-content:center;gap:12px">
      ${state === 'idle' ? `<button class="btn solid" data-r="start">${icon('mic', 18)} Записати</button>` : ''}
      ${state === 'rec' ? `<button class="btn" data-r="pause">${icon('pause', 18)} Пауза</button><button class="btn solid" data-r="stop">${icon('stop', 18)} Стоп</button>` : ''}
      ${state === 'paused' ? `<button class="btn" data-r="resume">${icon('mic', 18)} Продовжити</button><button class="btn solid" data-r="stop">${icon('stop', 18)} Стоп</button>` : ''}
      ${state === 'done' ? `<button class="btn danger" data-r="discard">${icon('trash', 18)}</button><button class="btn solid" data-r="save">${icon('check', 18)} Зберегти в запис</button>` : ''}
    </div></div>`;
  const cleanup = () => { clearInterval(timer); try { stream?.getTracks().forEach((t) => t.stop()); } catch (_) { /* ok */ } };
  const close = openSheet('Голосовий запис', build(), (body, closeFn) => {
    const redraw = () => { body.innerHTML = build(); };
    const tick = () => { const el = $('#rec-time', body); if (el) el.textContent = fmtDur(elapsed + (Date.now() - startedAt) / 1000); };
    body.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-r]');
      if (!b) return;
      const a = b.dataset.r;
      try {
        if (a === 'start') {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
          chunks = [];
          rec.ondataavailable = (ev) => ev.data.size && chunks.push(ev.data);
          rec.onstop = () => { blob = new Blob(chunks, { type: rec.mimeType || mime || 'audio/mp4' }); state = 'done'; cleanup(); redraw(); };
          rec.start(1000);
          state = 'rec'; startedAt = Date.now(); timer = setInterval(tick, 250); redraw();
        } else if (a === 'pause') {
          rec.pause(); elapsed += (Date.now() - startedAt) / 1000; clearInterval(timer); state = 'paused'; redraw();
        } else if (a === 'resume') {
          rec.resume(); startedAt = Date.now(); timer = setInterval(tick, 250); state = 'rec'; redraw();
        } else if (a === 'stop') {
          if (state === 'rec') elapsed += (Date.now() - startedAt) / 1000;
          clearInterval(timer); rec.stop();
        } else if (a === 'discard') {
          blob = null; elapsed = 0; state = 'idle'; redraw();
        } else if (a === 'save') {
          const id = uid();
          const name = ($('#rec-name', body)?.value || '').trim() || 'Голосовий запис';
          const recd = { id, entryId, blob, name, duration: Math.round(elapsed), mime: blob.type, createdAt: Date.now() };
          await DB.put('voices', recd);
          VoiceCache[id] = recd;
          closeFn();
          onSaved(id);
        }
      } catch (err) {
        console.error(err);
        cleanup();
        toast('Немає доступу до мікрофона. Дозволь його в Параметрах → Safari → Мікрофон.', 4500);
      }
    });
  }, { doneText: 'Закрити', onClose: cleanup });
  return close;
}

async function voiceMenu(id, el, onChange) {
  const rec = await getVoice(id);
  if (!rec) return;
  menuSheet(rec.name || 'Голосовий запис', [
    { label: 'Перейменувати', icon: 'edit', run: async () => {
      const n = prompt('Нова назва запису:', rec.name || '');
      if (n === null) return;
      rec.name = n.trim() || rec.name; await DB.put('voices', rec); await hydrateVoices(el.parentElement, true); onChange();
    } },
    { label: 'Видалити запис', icon: 'trash', danger: true, run: () => { if (confirm('Видалити цей голосовий запис?')) { el.remove(); onChange(); } } },
  ]);
}

/* ==========================================================================
   МАЛЮВАННЯ
   ========================================================================== */
function openDrawing(onSave) {
  const colors = ['#3b2b25', '#6F8247', '#C8473B', '#E8A23A', '#5C88BA', '#9A6FC2', '#E0A3B2', '#FFFFFF'];
  const el = document.createElement('div');
  el.className = 'drawer';
  el.innerHTML = `<div class="dtop"><button class="text-btn" data-d="cancel">Скасувати</button><div class="grow center serif">Малюнок</div><button class="text-btn" data-d="save">Зберегти</button></div>
    <div class="dcanvas"><canvas></canvas></div>
    <div class="dtools">
      <div class="row" style="gap:6px;justify-content:center">
        <button class="pill on" data-tool="pen">✎ Олівець</button><button class="pill" data-tool="brush">🖌 Пензлик</button><button class="pill" data-tool="eraser">⌫ Гумка</button>
      </div>
      <div class="row" style="gap:6px;justify-content:center;flex-wrap:wrap">${colors.map((c, i) => `<button class="dcol ${i === 0 ? 'on' : ''}" data-col="${c}" style="background:${c}"></button>`).join('')}
        <label class="dcol" style="background:conic-gradient(red,yellow,lime,cyan,blue,magenta,red)"><input type="color" id="d-custom" hidden></label></div>
      <div class="row" style="gap:10px"><span class="small muted">Товщина</span><input type="range" id="d-size" min="1" max="30" value="4" class="grow">
        <button class="icon-btn" data-d="undo" title="Скасувати">↶</button><button class="icon-btn" data-d="redo" title="Повернути">↷</button><button class="icon-btn" data-d="clear" title="Очистити">${icon('trash', 18)}</button></div>
    </div>`;
  document.body.appendChild(el);
  const cv = $('canvas', el);
  const wrap = $('.dcanvas', el);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = wrap.clientWidth, H = Math.min(wrap.clientHeight, W * 1.25);
  cv.style.width = W + 'px'; cv.style.height = H + 'px';
  cv.width = W * dpr; cv.height = H * dpr;
  const c = cv.getContext('2d');
  c.scale(dpr, dpr);
  let tool = 'pen', color = colors[0], size = 4;
  const strokes = [], redo = [];
  let cur = null;
  const paper = () => { c.fillStyle = '#FBF8F2'; c.fillRect(0, 0, W, H); };
  const drawStroke = (s) => {
    c.save();
    c.lineCap = 'round'; c.lineJoin = 'round';
    c.strokeStyle = s.tool === 'eraser' ? '#FBF8F2' : s.color;
    c.globalAlpha = s.tool === 'brush' ? 0.55 : 1;
    c.lineWidth = s.tool === 'brush' ? s.size * 2.2 : s.tool === 'eraser' ? s.size * 3 : s.size;
    c.beginPath();
    s.pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    if (s.pts.length === 1) c.lineTo(s.pts[0][0] + 0.1, s.pts[0][1]);
    c.stroke(); c.restore();
  };
  const redraw = () => { paper(); strokes.forEach(drawStroke); };
  redraw();
  const pt = (e) => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  cv.addEventListener('pointerdown', (e) => { cv.setPointerCapture(e.pointerId); cur = { tool, color, size, pts: [pt(e)] }; redo.length = 0; e.preventDefault(); });
  cv.addEventListener('pointermove', (e) => { if (!cur) return; cur.pts.push(pt(e)); redraw(); drawStroke(cur); });
  const end = () => { if (cur) { strokes.push(cur); cur = null; redraw(); } };
  cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
  el.addEventListener('input', (e) => { if (e.target.id === 'd-size') size = +e.target.value; if (e.target.id === 'd-custom') { color = e.target.value; $$('.dcol', el).forEach((b) => b.classList.remove('on')); } });
  el.addEventListener('click', (e) => {
    const t = e.target.closest('[data-tool]'), col = e.target.closest('[data-col]'), d = e.target.closest('[data-d]');
    if (t) { tool = t.dataset.tool; $$('[data-tool]', el).forEach((b) => b.classList.toggle('on', b === t)); }
    if (col) { color = col.dataset.col; if (tool === 'eraser') { tool = 'pen'; $$('[data-tool]', el).forEach((b) => b.classList.toggle('on', b.dataset.tool === 'pen')); } $$('.dcol', el).forEach((b) => b.classList.toggle('on', b === col)); }
    if (!d) return;
    if (d.dataset.d === 'undo' && strokes.length) { redo.push(strokes.pop()); redraw(); }
    if (d.dataset.d === 'redo' && redo.length) { strokes.push(redo.pop()); redraw(); }
    if (d.dataset.d === 'clear' && strokes.length && confirm('Очистити полотно?')) { strokes.length = 0; redraw(); }
    if (d.dataset.d === 'cancel') { if (!strokes.length || confirm('Вийти без збереження малюнка?')) el.remove(); }
    if (d.dataset.d === 'save') {
      if (!strokes.length) { el.remove(); return; }
      cv.toBlob((b) => { el.remove(); onSave(b); }, 'image/png');
    }
  });
}

/* ==========================================================================
   FACE ID (через захищений ключ телефона — WebAuthn)
   ========================================================================== */
const b64 = { enc: (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))), dec: (s) => Uint8Array.from(atob(s), (ch) => ch.charCodeAt(0)) };

async function faceIdAvailable() {
  try { return !!(window.PublicKeyCredential && await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()); } catch (_) { return false; }
}

async function setupFaceId() {
  const cred = await navigator.credentials.create({ publicKey: {
    rp: { name: 'own journal', id: location.hostname },
    user: { id: crypto.getRandomValues(new Uint8Array(16)), name: 'own journal', displayName: 'own journal' },
    challenge: crypto.getRandomValues(new Uint8Array(32)),
    pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
    authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required', residentKey: 'preferred' },
    timeout: 60000,
  } });
  S.settings.webauthnId = b64.enc(cred.rawId);
  await saveSettings();
}

async function checkFaceId() {
  if (!S.settings.webauthnId) return false;
  try {
    await navigator.credentials.get({ publicKey: {
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      allowCredentials: [{ type: 'public-key', id: b64.dec(S.settings.webauthnId), transports: ['internal'] }],
      userVerification: 'required', timeout: 60000, rpId: location.hostname,
    } });
    return true;
  } catch (_) { return false; }
}

/* ==========================================================================
   ЕКСПОРТ В АРХІВ (.zip): читабельна сторінка + фото + голосові
   ========================================================================== */
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(u8) { let c = 0xFFFFFFFF; for (let i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }

async function makeZip(files) {
  const enc = new TextEncoder();
  const parts = [], central = [];
  let offset = 0;
  const dt = new Date();
  const dosTime = (dt.getHours() << 11) | (dt.getMinutes() << 5) | (dt.getSeconds() >> 1);
  const dosDate = ((dt.getFullYear() - 1980) << 9) | ((dt.getMonth() + 1) << 5) | dt.getDate();
  for (const f of files) {
    const name = enc.encode(f.name);
    const data = f.data instanceof Blob ? new Uint8Array(await f.data.arrayBuffer()) : enc.encode(f.data);
    const crc = crc32(data);
    const head = new DataView(new ArrayBuffer(30));
    head.setUint32(0, 0x04034b50, true); head.setUint16(4, 20, true); head.setUint16(6, 0x0800, true); head.setUint16(8, 0, true);
    head.setUint16(10, dosTime, true); head.setUint16(12, dosDate, true); head.setUint32(14, crc, true);
    head.setUint32(18, data.length, true); head.setUint32(22, data.length, true); head.setUint16(26, name.length, true); head.setUint16(28, 0, true);
    parts.push(head.buffer, name, data);
    const cd = new DataView(new ArrayBuffer(46));
    cd.setUint32(0, 0x02014b50, true); cd.setUint16(4, 20, true); cd.setUint16(6, 20, true); cd.setUint16(8, 0x0800, true); cd.setUint16(10, 0, true);
    cd.setUint16(12, dosTime, true); cd.setUint16(14, dosDate, true); cd.setUint32(16, crc, true); cd.setUint32(20, data.length, true); cd.setUint32(24, data.length, true);
    cd.setUint16(28, name.length, true); cd.setUint32(42, offset, true);
    central.push(cd.buffer, name);
    offset += 30 + name.length + data.length;
  }
  const cdSize = central.reduce((a, p) => a + (p.byteLength ?? p.length), 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true);
  end.setUint32(12, cdSize, true); end.setUint32(16, offset, true);
  return new Blob([...parts, ...central, end.buffer], { type: 'application/zip' });
}

async function exportArchive() {
  const files = [];
  const exportDoc = document.implementation.createHTMLDocument('export');
  const entries = S.entries.slice().sort((a, b) => a.date.localeCompare(b.date));
  const ext = (t) => (t || '').includes('webm') ? 'webm' : (t || '').includes('aac') ? 'aac' : 'm4a';
  let html = `<!DOCTYPE html><html lang="uk"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>own journal — архів</title>
    <style>body{font-family:Georgia,serif;max-width:720px;margin:auto;padding:20px;background:#FBF8F2;color:#3b2b25}article{border-bottom:1px dashed #c9b9a6;padding:18px 0}
    h1{font-style:italic}h2{margin:.2em 0}.meta{color:#8a7a6a;font-size:14px}img{max-width:100%;border-radius:12px}figure{margin:12px 0}figcaption{font-style:italic;color:#8a7a6a}
    .tags span{background:#efe6d6;border-radius:10px;padding:2px 8px;margin-right:4px;font-size:13px}</style></head><body><h1>own journal</h1><p class="meta">Експорт від ${D.dmy(new Date())} · записів: ${entries.length}</p>`;
  for (const e of entries) {
    const d = D.parse(e.date);
    const div = exportDoc.createElement('div'); // окремий документ — щоб браузер не завантажував картинки
    div.innerHTML = e.html || '';
    Array.from(div.querySelectorAll('figure[data-photo]')).forEach((f) => { const img = f.querySelector('img'); if (img) { img.removeAttribute('data-pid'); img.removeAttribute('data-kind'); img.src = `фото/${f.dataset.photo}.jpg`; } f.removeAttribute('contenteditable'); });
    for (const v of Array.from(div.querySelectorAll('.voice[data-voice]'))) {
      const rec = await getVoice(v.dataset.voice);
      v.outerHTML = rec ? `<p>🎙 <a href="голос/${rec.id}.${ext(rec.mime)}">${esc(rec.name)}</a> (${fmtDur(rec.duration || 0)})</p>` : '';
    }
    Array.from(div.querySelectorAll('[contenteditable]')).forEach((n) => n.removeAttribute('contenteditable'));
    html += `<article><div class="meta">${D.long(d)} ${d.getFullYear()}, ${D.time(d)}${e.emotions?.length ? ' · ' + e.emotions.map((id) => Emo.get(id)?.name).filter(Boolean).join(', ') : ''}</div>
      ${e.title ? `<h2>${esc(e.title)}</h2>` : ''}${e.tags?.length ? `<p class="tags">${e.tags.map((t) => `<span>#${esc(t)}</span>`).join('')}</p>` : ''}${div.innerHTML}</article>`;
  }
  html += '</body></html>';
  files.push({ name: 'own-journal/записи.html', data: html });
  files.push({ name: 'own-journal/записи.json', data: JSON.stringify(entries, null, 1) });
  files.push({ name: 'own-journal/справи.json', data: JSON.stringify(TS.tasks, null, 1) });
  files.push({ name: 'own-journal/настрій.json', data: JSON.stringify({ marks: S.dayMoods, times: S.dayTimes }, null, 1) });
  for (const id of Object.keys(S.photoMeta)) {
    const rec = await DB.get('photoData', id);
    if (rec?.full || rec?.thumb) files.push({ name: `own-journal/фото/${id}.jpg`, data: rec.full || rec.thumb });
  }
  for (const v of await DB.all('voices')) if (v.blob) files.push({ name: `own-journal/голос/${v.id}.${ext(v.mime)}`, data: v.blob });
  const zip = await makeZip(files);
  return new File([zip], `own-journal-архів-${D.key(new Date())}.zip`, { type: 'application/zip' });
}

async function shareFile(file) {
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: file.name }); return true; } catch (err) { if (err.name === 'AbortError') return false; }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(file); a.download = file.name;
  document.body.appendChild(a); a.click(); a.remove();
  return true;
}

/* ==========================================================================
   ПОВНА РЕЗЕРВНА КОПІЯ v2 — усе: записи, фото, голос, малюнки, справи, теми, картинки
   ========================================================================== */
const BACKUP_STORES = ['entries', 'photoMeta', 'photoData', 'dayMoods', 'highlights', 'tasks', 'voices'];

makeBackup = async function makeBackupV2() {
  const blobs = [];
  let offset = 0;
  const enc = (v) => {
    if (v instanceof Blob) { const ref = { __blob: [offset, v.size, v.type] }; blobs.push(v); offset += v.size; return ref; }
    if (Array.isArray(v)) return v.map(enc);
    if (v && typeof v === 'object') { const o = {}; for (const k of Object.keys(v)) o[k] = enc(v[k]); return o; }
    return v;
  };
  const stores = {};
  for (const name of BACKUP_STORES) stores[name] = enc(await DB.all(name));
  const settings = enc({ ...S.settings, webauthnId: '' });
  const art = enc(S.art || {});
  const manifest = { app: 'MyDiary', version: 2, createdAt: Date.now(), stores, settings, art };
  const json = new TextEncoder().encode(JSON.stringify(manifest));
  const header = 'MYDIARY2' + String(json.length).padStart(12, '0');
  return new File([header, json, ...blobs], `own-journal-копія-${D.key(new Date())}.diary`, { type: 'application/octet-stream' });
};

const restoreV1 = restoreBackup;
restoreBackup = async function restoreBackupV2(file) {
  const head = await file.slice(0, 20).text();
  if (head.startsWith('MYDIARY1')) return restoreV1(file);
  if (!head.startsWith('MYDIARY2')) throw new Error('Це не файл резервної копії щоденника');
  const len = parseInt(head.slice(8, 20), 10);
  const manifest = JSON.parse(await file.slice(20, 20 + len).text());
  const base = 20 + len;
  const dec = async (v) => {
    if (v && typeof v === 'object' && Array.isArray(v.__blob)) {
      const [o, n, type] = v.__blob;
      return new Blob([await file.slice(base + o, base + o + n).arrayBuffer()], { type: type || 'application/octet-stream' });
    }
    if (Array.isArray(v)) { const out = []; for (const x of v) out.push(await dec(x)); return out; }
    if (v && typeof v === 'object') { const o = {}; for (const k of Object.keys(v)) o[k] = await dec(v[k]); return o; }
    return v;
  };
  const wasEmpty = S.entries.length === 0;
  const keyOf = { entries: 'id', photoMeta: 'id', photoData: 'id', dayMoods: 'key', highlights: 'key', tasks: 'id', voices: 'id' };
  let added = 0;
  for (const name of BACKUP_STORES) {
    const existing = new Set((await DB.all(name)).map((r) => r[keyOf[name]]));
    for (const raw of manifest.stores[name] || []) {
      if (existing.has(raw[keyOf[name]])) continue;
      const rec = await dec(raw);
      await DB.put(name, rec);
      if (name === 'entries') added++;
    }
  }
  const st = await dec(manifest.settings || {});
  if (wasEmpty) {
    // новий телефон — переносимо все оформлення, теми, картинки і налаштування
    const keep = { lastVisit: S.settings.lastVisit };
    Object.assign(S.settings, st, keep, { webauthnId: '' });
  } else {
    const mergeList = (k, idKey) => { const have = new Set((S.settings[k] || []).map((x) => (idKey ? x[idKey] : JSON.stringify(x)))); for (const x of st[k] || []) if (!have.has(idKey ? x[idKey] : JSON.stringify(x))) (S.settings[k] = S.settings[k] || []).push(x); };
    mergeList('customEmotions', 'id'); mergeList('taskCats', 'id'); mergeList('savedThemes', 'name'); mergeList('customMessages', 'text');
    if (!Object.keys(S.settings.artMood || {}).length && st.artMood) S.settings.artMood = st.artMood;
    if (!Object.keys(S.settings.artEmo || {}).length && st.artEmo) S.settings.artEmo = st.artEmo;
  }
  if (manifest.art) {
    const art = await dec(manifest.art);
    for (const f of ['lib', 'names', 'credits', 'moodSets', 'faceMap']) S.art[f] = { ...(art[f] || {}), ...(S.art[f] || {}) };
    await saveArt();
  }
  await saveSettings();
  await loadAll();
  await loadTasks();
  await loadArt();
  Object.keys(VoiceCache).forEach((k) => delete VoiceCache[k]);
  return added;
};
