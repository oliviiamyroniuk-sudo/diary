'use strict';
/* own journal — імпорт старого щоденника з PDF (експорт «My Diary»).
   У таких PDF українські/російські літери намальовані контурами, а не текстом,
   тому літери розпізнаються за формою контуру (таблиця GLYPHS + «навчання» нових літер).
   Файл читається шматками — навіть дуже великий PDF не завантажується в памʼять повністю. */

const PdfImport = (() => {
  let lib = null;
  async function loadLib() {
    if (lib) return lib;
    await new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'vendor/pdf.min.js'; s.onload = res; s.onerror = () => rej(new Error('Couldn’t load the PDF reader')); document.head.appendChild(s); });
    lib = window.pdfjsLib;
    lib.GlobalWorkerOptions.workerSrc = 'vendor/pdf.worker.min.js';
    return lib;
  }

  async function open(src) {
    const L = await loadLib();
    if (typeof src === 'string') return L.getDocument({ url: src }).promise;
    const file = src;
    class FileRange extends L.PDFDataRangeTransport {
      requestDataRange(b, e) { file.slice(b, e).arrayBuffer().then((buf) => this.onDataRange(b, new Uint8Array(buf))); }
    }
    const t = new FileRange(file.size, new Uint8Array(0));
    return L.getDocument({ range: t, length: file.size, disableAutoFetch: true, disableStream: true, rangeChunkSize: 1 << 20 }).promise;
  }

  const mul = (a, b) => [a[0] * b[0] + a[2] * b[1], a[1] * b[0] + a[3] * b[1], a[0] * b[2] + a[2] * b[3], a[1] * b[2] + a[3] * b[3], a[0] * b[4] + a[2] * b[5] + a[4], a[1] * b[4] + a[3] * b[5] + a[5]];
  const ap = (m, x, y) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];

  /** Розбирає одну сторінку: контури-літери, справжні символи тексту й картинки. */
  async function readPage(page) {
    const L = lib, O = L.OPS;
    const ol = await page.getOperatorList();
    const glyphs = [], texts = [], images = [];
    let ctm = [1, 0, 0, 1, 0, 0];
    const stack = [];
    let path = [];  // [opName, ...points] у координатах сторінки
    let tm = [1, 0, 0, 1, 0, 0], tlm = [1, 0, 0, 1, 0, 0], fontSize = 1, font = null;
    for (let i = 0; i < ol.fnArray.length; i++) {
      const fn = ol.fnArray[i], args = ol.argsArray[i];
      switch (fn) {
        case O.save: stack.push(ctm); break;
        case O.restore: ctm = stack.pop() || [1, 0, 0, 1, 0, 0]; break;
        case O.transform: ctm = mul(ctm, args); break;
        case O.constructPath: {
          const ops = args[0], co = args[1];
          let k = 0;
          for (const op of ops) {
            if (op === O.moveTo || op === O.lineTo) { path.push([op === O.moveTo ? 'm' : 'l', ...ap(ctm, co[k], co[k + 1])]); k += 2; }
            else if (op === O.curveTo) { path.push(['c', ...ap(ctm, co[k], co[k + 1]), ...ap(ctm, co[k + 2], co[k + 3]), ...ap(ctm, co[k + 4], co[k + 5])]); k += 6; }
            else if (op === O.curveTo2 || op === O.curveTo3) { path.push(['c', ...ap(ctm, co[k], co[k + 1]), ...ap(ctm, co[k + 2], co[k + 3])]); k += 4; }
            else if (op === O.closePath) path.push(['h']);
            else if (op === O.rectangle) { path.push(['r', ...ap(ctm, co[k], co[k + 1]), ...ap(ctm, co[k] + co[k + 2], co[k + 1] + co[k + 3])]); k += 4; }
          }
          break;
        }
        case O.fill: case O.eoFill: case O.fillStroke: case O.eoFillStroke:
          if (path.length && path[0][0] !== 'r') { const g = glyphOf(path); if (g.x1 - g.x0 < 40 && g.y1 - g.y0 < 40) glyphs.push(g); }
          path = []; break;
        case O.endPath: case O.stroke: case O.closeStroke: case O.clip: case O.eoClip: path = []; break;
        case O.beginText: tm = [1, 0, 0, 1, 0, 0]; tlm = [1, 0, 0, 1, 0, 0]; break;
        case O.setFont: font = args[0]; fontSize = args[1]; break;
        case O.setTextMatrix: tm = args.slice(); tlm = args.slice(); break;
        case O.moveText: tlm = mul(tlm, [1, 0, 0, 1, args[0], args[1]]); tm = tlm.slice(); break;
        case O.showText: case O.showSpacedText: {
          for (const g of args[0]) {
            if (typeof g === 'number') { tm = mul(tm, [1, 0, 0, 1, -g / 1000 * fontSize, 0]); continue; }
            if (!g) continue;
            const m = mul(ctm, mul(tm, [fontSize, 0, 0, fontSize, 0, 0]));
            const size = Math.hypot(m[2], m[3]);
            const [x, y] = ap(m, 0, 0);
            const w = (g.width || 500) / 1000 * size;
            if (g.unicode && g.unicode.trim()) texts.push({ real: true, ch: g.unicode, x0: x, x1: x + w, y0: y - size * 0.18, y1: y + size * 0.68, size });
            tm = mul(tm, [1, 0, 0, 1, (g.width || 500) / 1000 * fontSize, 0]);
          }
          break;
        }
        case O.paintImageXObject: case O.paintJpegXObject: {
          const [x0, y0] = ap(ctm, 0, 0), [x1, y1] = ap(ctm, 1, 1);
          images.push({ id: args[0], x0: Math.min(x0, x1), x1: Math.max(x0, x1), y0: Math.min(y0, y1), y1: Math.max(y0, y1), w: args[1], h: args[2] });
          break;
        }
      }
    }
    return { glyphs, texts, images, ops: ol };
  }

  /** Контур літери → підпис форми (не залежить від положення на сторінці). */
  function glyphOf(path) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const p of path) for (let i = 1; i < p.length; i += 2) { x0 = Math.min(x0, p[i]); x1 = Math.max(x1, p[i]); y0 = Math.min(y0, p[i + 1]); y1 = Math.max(y1, p[i + 1]); }
    const kinds = path.map((p) => p[0]).join('');
    const vec = [];
    for (const p of path) for (let i = 1; i < p.length; i += 2) vec.push(+(p[i] - x0).toFixed(2), +(p[i + 1] - y0).toFixed(2));
    return { kinds, vec, x0, x1, y0, y1, path };
  }

  /** Шукає літеру в таблиці: той самий набір команд і майже ті самі координати. */
  function matchGlyph(g, table) {
    const cands = table[g.kinds];
    if (!cands) return null;
    let best = null, bd = 0.35;
    for (const [vec, ch] of cands) {
      if (vec.length !== g.vec.length) continue;
      let d = 0;
      for (let i = 0; i < vec.length && d < bd; i++) d = Math.max(d, Math.abs(vec[i] - g.vec[i]));
      if (d < bd) { bd = d; best = ch; }
    }
    return best;
  }

  /** Складає символи сторінки в рядки тексту. unknown(g) → маркер невідомої літери. */
  function buildLines(items) {
    items.sort((a, b) => (b.y0 + b.y1) - (a.y0 + a.y1));
    const lines = [];
    for (const it of items) {
      const h = it.y1 - it.y0;
      let ln = lines.find((l) => Math.min(l.y1, it.y1) - Math.max(l.y0, it.y0) > Math.min(h, l.y1 - l.y0) * 0.45);
      if (!ln) { ln = { y0: it.y0, y1: it.y1, items: [] }; lines.push(ln); }
      ln.items.push(it); ln.y0 = Math.min(ln.y0, it.y0); ln.y1 = Math.max(ln.y1, it.y1);
    }
    lines.sort((a, b) => b.y1 - a.y1);
    for (const ln of lines) {
      ln.items.sort((a, b) => a.x0 - b.x0);
      const hs = ln.items.map((i) => i.size || (i.y1 - i.y0)).sort((a, b) => a - b);
      ln.size = hs[Math.floor(hs.length / 2)] || 10;
      let s = '', prev = null;
      for (const it of ln.items) {
        if (prev) {
          const gap = it.x0 - prev.x1;
          // між словами відстань ≥ 0.47 розміру шрифту, усередині слова ≤ 0.40 (виміряно на експорті «My Diary»)
          const k = !!prev.real !== !!it.real ? 0.3 : 0.44;
          if (gap > ln.size * k) s += ' ';
        }
        s += it.ch;
        prev = it;
      }
      ln.text = s;
    }
    return lines;
  }

  return { loadLib, open, readPage, matchGlyph, buildLines, glyphOf };
})();

/* ==========================================================================
   Імпорт: сторінка в журналі
   ========================================================================== */
const PDFI = { state: null };

const MONTH_PREFIX = [
  ['янв', 'січ', 'jan'], ['фев', 'лют', 'feb'], ['мар', 'бер', 'mar'], ['апр', 'кві', 'apr'], ['мая', 'май', 'тра', 'may'], ['июн', 'чер', 'jun'],
  ['июл', 'лип', 'jul'], ['авг', 'сер', 'aug'], ['сен', 'вер', 'sep'], ['окт', 'жов', 'oct'], ['ноя', 'лис', 'nov'], ['дек', 'гру', 'dec'],
];
function monthIndex(tok) {
  const t = String(tok || '').toLowerCase().replace(/[^a-zа-яіїєґё]/g, '');
  for (let i = 0; i < 12; i++) if (MONTH_PREFIX[i].some((p) => t.startsWith(p))) return i;
  return -1;
}

function pdfGlyphTable() {
  const t = JSON.parse(JSON.stringify(PDF_GLYPHS));
  for (const [k, list] of Object.entries(S.settings.pdfGlyphsLearned || {})) (t[k] = t[k] || []).push(...list);
  return t;
}

async function imageCanvas(page, id) {
  const store = id.startsWith('g_') ? page.commonObjs : page.objs;
  const img = await new Promise((res) => { try { store.get(id, res); } catch (e) { res(null); } });
  if (!img) return null;
  const cv = document.createElement('canvas');
  if (img.bitmap) { cv.width = img.bitmap.width; cv.height = img.bitmap.height; cv.getContext('2d').drawImage(img.bitmap, 0, 0); return cv; }
  if (!img.data) return null;
  cv.width = img.width; cv.height = img.height;
  const c = cv.getContext('2d');
  const out = c.createImageData(img.width, img.height);
  const d = img.data, o = out.data, n = img.width * img.height;
  if (d.length >= n * 4) o.set(d.subarray(0, n * 4));
  else if (d.length >= n * 3) for (let i = 0, j = 0; i < n; i++) { o[j++] = d[i * 3]; o[j++] = d[i * 3 + 1]; o[j++] = d[i * 3 + 2]; o[j++] = 255; }
  else { // 1 біт на піксель
    const rowB = (img.width + 7) >> 3;
    for (let y = 0; y < img.height; y++) for (let x = 0; x < img.width; x++) { const v = (d[y * rowB + (x >> 3)] >> (7 - (x & 7))) & 1 ? 255 : 0; const j = (y * img.width + x) * 4; o[j] = o[j + 1] = o[j + 2] = v; o[j + 3] = 255; }
  }
  c.putImageData(out, 0, 0);
  return cv;
}

function iconHash(cv) {
  const s = document.createElement('canvas'); s.width = s.height = 8;
  const c = s.getContext('2d'); c.drawImage(cv, 0, 0, 8, 8);
  const d = c.getImageData(0, 0, 8, 8).data;
  let h = '';
  for (let i = 0; i < d.length; i += 4) h += ((d[i] >> 5) << 6 | (d[i + 1] >> 5) << 3 | (d[i + 2] >> 5)).toString(36).padStart(2, '0');
  return h;
}
function sameIcon(a, b) {
  let diff = 0;
  for (let i = 0; i < a.length; i += 2) if (a.slice(i, i + 2) !== b.slice(i, i + 2)) diff++;
  return diff <= 8;
}

/** Сканує сторінки з..по: збирає записи, зберігає фото, відмічає невідомі літери. */
async function pdfScan(st, onProgress) {
  const table = pdfGlyphTable();
  const pdf = st.pdf;
  for (let p = st.next; p <= st.to; p++) {
    if (st.cancel) break;
    const page = await pdf.getPage(p);
    const r = await PdfImport.readPage(page);
    const items = [];
    for (const g of r.glyphs) {
      let ch = PdfImport.matchGlyph(g, table);
      if (!ch) {
        let u = st.unknown.findIndex((s) => s.kinds === g.kinds && s.vec.length === g.vec.length && s.vec.every((v, i) => Math.abs(v - g.vec[i]) < 0.35));
        if (u < 0) { u = st.unknown.length; st.unknown.push({ kinds: g.kinds, vec: g.vec, path: g.path, x0: g.x0, y0: g.y0, w: g.x1 - g.x0, h: g.y1 - g.y0, n: 0, ctx: '' }); }
        st.unknown[u].n++;
        ch = String.fromCharCode(0xE000 + u);
      }
      items.push({ ch, x0: g.x0, x1: g.x1, y0: g.y0, y1: g.y1 });
    }
    items.push(...r.texts);
    const lines = PdfImport.buildLines(items);
    const dg = st.diag || (st.diag = { pages: 0, glyphs: 0, texts: 0, lines: 0, dates: 0, imgs: 0, skippedHead: 0, sample: [], errs: 0, err: '' });
    dg.pages++; dg.glyphs += r.glyphs.length; dg.texts += r.texts.length; dg.lines += lines.length; dg.imgs += r.images.length;
    if (dg.sample.length < 5) for (const l of lines) { if (dg.sample.length >= 5) break; dg.sample.push(`p${p} [${Math.round(l.size)}] ${l.text.trim().slice(0, 40)}`); }
    const rightEdge = Math.max(0, ...lines.map((l) => l.items[l.items.length - 1].x1));
    // картинки сторінки: фони (на всю сторінку) пропускаємо; маленька вгорі праворуч — смайлик настрою
    const blocks = lines.map((l) => ({ kind: 'line', y: l.y1, l }));
    for (const im of r.images) {
      const w = im.x1 - im.x0, h = im.y1 - im.y0;
      if (w > 500 && h > 450) continue;
      if (w < 32 && h < 32 && im.y0 > 700 && im.x0 > 400) blocks.push({ kind: 'mood', y: im.y1 + 100, im });
      else if (w >= 32 || h >= 32) blocks.push({ kind: 'img', y: im.y1, im });
    }
    blocks.sort((a, b) => b.y - a.y);
    let prevLine = null;
    for (const b of blocks) {
      if (b.kind === 'line') {
        const l = b.l, t = l.text.trim();
        const dm = l.size >= 12 && t.match(/^(\d{1,2})\s*(\S+?)\.?\s+(\d{4})$/);
        const tm = t.match(/^\((\d{1,2}):(\d{2})\)$/);
        if (dm) { dg.dates++; st.day = { d: +dm[1], mon: dm[2], y: +dm[3] }; st.cur = null; prevLine = null; st.dayMood = st.pendingMoodNext ?? null; st.pendingMoodNext = null; st.skipHead = false; st.dayPage = p; continue; }
        if (st.skipHead) { dg.skippedHead++; continue; }
        if (tm && st.day) { st.cur = newImported(st, `${pad(+tm[1])}:${tm[2]}`); prevLine = null; continue; }
        if (!st.cur) { if (!st.day && st.lastEntry) st.cur = st.lastEntry; else if (st.day) st.cur = newImported(st, '12:00'); else continue; }
        const e = st.cur;
        const gap = prevLine ? prevLine.y0 - l.y1 : 0;
        const ended = !prevLine || gap > 24 || prevLine.items[prevLine.items.length - 1].x1 < rightEdge - 45;
        if (ended || !e.paras.length || e.paras[e.paras.length - 1].img) e.paras.push({ text: t });
        else e.paras[e.paras.length - 1].text += ' ' + t;
        prevLine = l;
      } else if (b.kind === 'mood') {
        const cv = await imageCanvas(page, b.im.id);
        if (cv) {
          const h = iconHash(cv);
          let k = st.icons.findIndex((x) => sameIcon(x.hash, h));
          if (k < 0) { k = st.icons.length; st.icons.push({ hash: h, url: cv.toDataURL('image/png'), n: 0 }); }
          st.icons[k].n++;
          st.pendingMoodNext = k;
        }
      } else if (b.kind === 'img') {
        if (st.skipHead) continue;
        const e = st.cur || st.lastEntry;
        if (!e) continue;
        const cv = await imageCanvas(page, b.im.id);
        if (!cv) continue;
        const blob = await new Promise((res) => cv.toBlob(res, 'image/jpeg', 0.9));
        cv.width = cv.height = 0;
        try { const pid = await savePhoto(e.id, blob); S.photoMeta[pid].imp = 1; await DB.put('photoMeta', S.photoMeta[pid]); st.photoIds.push(pid); e.paras.push({ img: pid, small: (b.im.x1 - b.im.x0) < 120 }); } catch (err) { console.warn(err); }
        prevLine = null;
      }
    }
    page.cleanup();
    st.next = p + 1;
    await commitReady(st, false, p);
    if ((p - st.from) % 20 === 19) { try { await pdf.cleanup(); } catch (_) {} }
    onProgress && onProgress(p);
  }
}

function newImported(st, time) {
  const e = { id: uid(), day: { ...st.day }, time, paras: [], mood: st.dayMood ?? null, startPage: st.dayPage || st.next };
  st.entries.push(e);
  st.lastEntry = e;
  return e;
}

function pdfDecode(text, st) {
  return text.replace(/[-]/g, (c) => { const u = st.unknown[c.charCodeAt(0) - 0xE000]; return u && u.ch != null ? u.ch : '□'; });
}

const figHTML = (p) => `<figure class="${p.small ? 'sz-s' : 'sz-l'} al-center" data-photo="${p.img}"><img data-pid="${p.img}" data-kind="full" alt=""><figcaption></figcaption></figure>`;
const parasHTML = (paras, st) => paras.map((p) => (p.img ? figHTML(p) : `<p>${esc(pdfDecode(p.text, st))}</p>`)).join('');

function moodFor(hash) {
  if (!hash) return null;
  const hit = Object.entries(S.settings.pdfMoodMap || {}).find(([h]) => sameIcon(h, hash));
  return hit ? hit[1] : null;
}

/** Зберігає один прочитаний запис у щоденник одразу (щоб нічого не загубилося, навіть якщо iPhone закриє сторінку). */
async function commitEntry(st, ie) {
  const R = st.result;
  try {
    if (ie.existing) { // продовження запису з попередньої частини
      if (!ie.paras.length) return;
      const ex = S.entries.find((x) => x.id === ie.existing.id);
      if (ex) { ex.html += parasHTML(ie.paras, st); refreshEntry(ex); await DB.put('entries', ex); }
      return;
    }
    const mon = monthIndex(pdfDecode(ie.day.mon, st));
    if (mon < 0 || !ie.day.y || !ie.paras.length) { R.skipped++; return; }
    const date = `${ie.day.y}-${pad(mon + 1)}-${pad(ie.day.d)}T${ie.time}`;
    const html = parasHTML(ie.paras, st);
    const key = date + '|' + fold(htmlToText(html)).slice(0, 80);
    if (st.have.has(key)) { R.skipped++; return; }
    const hash = ie.mood != null ? st.icons[ie.mood]?.hash : null;
    const emo = moodFor(hash);
    const e = { id: ie.id, date, createdAt: Date.now(), updatedAt: Date.now(), title: '', html, text: '', emotions: emo ? [emo] : [], favorite: false, photos: [], tags: ['imported'], importKey: key, importIcon: hash || undefined, search: '' };
    if (/[-]/.test(html)) e.importPUA = 1;
    refreshEntry(e);
    await DB.put('entries', e);
    S.entries.push(e);
    st.have.add(key);
    R.added++;
  } catch (err) { console.error(err); R.failed++; if (!R.firstErr) R.firstErr = (err && (err.name + ': ' + err.message)) || String(err); }
}

/** Зберігає всі завершені записи; останній (який ще може тривати на наступній сторінці) лишає, якщо не force. */
async function commitReady(st, force, page) {
  const keep = force ? null : st.lastEntry;
  const ready = st.entries.filter((x) => x !== keep);
  if (st.cont && (force || st.lastEntry !== st.cont)) { await commitEntry(st, st.cont); st.cont = null; }
  for (const ie of ready) await commitEntry(st, ie);
  st.entries = keep && st.entries.includes(keep) ? [keep] : [];
  if (ready.length) sortEntries();
  // звідки продовжити після збою: з початку незавершеного запису
  const open = !force && keep ? keep.startPage : null;
  const done = force ? st.to : open ? open - 1 : page;
  S.settings.pdfImportLast = { name: st.name, size: st.size, pages: st.pages, done: Math.max(st.from - 1, done), skipHead: !!open && !keep.existing };
  try { await saveSettings(); } catch (_) {}
}

async function pdfFinish(st) {
  await commitReady(st, true);
  // настрої для записів, у яких смайлик ще не мав емоції
  for (const e of S.entries) {
    if (!e.importIcon || (e.emotions || []).length) continue;
    const emo = moodFor(e.importIcon);
    if (emo) { e.emotions = [emo]; refreshEntry(e); try { await DB.put('entries', e); } catch (_) {} }
  }
  // літери, яких навчили в кінці
  for (const e of S.entries) {
    if (!e.importPUA) continue;
    e.html = e.html.replace(/[-]/g, (c) => { const u = st.unknown[c.charCodeAt(0) - 0xE000]; return u && u.ch ? esc(u.ch) : '□'; });
    delete e.importPUA; refreshEntry(e); try { await DB.put('entries', e); } catch (_) {}
  }
  sortEntries();
  return st.result;
}

function drawGlyph(u, size = 64) {
  const cv = document.createElement('canvas');
  cv.width = cv.height = size * 2;
  const c = cv.getContext('2d');
  c.fillStyle = '#fff'; c.fillRect(0, 0, cv.width, cv.height);
  const k = Math.min(10, (size * 2 - 24) / Math.max(u.w, u.h, 1));
  c.translate((size * 2 - u.w * k) / 2, size * 2 - (size * 2 - u.h * k) / 2);
  c.scale(k, -k); c.translate(-u.x0, -u.y0);
  c.beginPath();
  for (const p of u.path) { if (p[0] === 'm') c.moveTo(p[1], p[2]); else if (p[0] === 'l') c.lineTo(p[1], p[2]); else if (p[0] === 'c') c.bezierCurveTo(p[1], p[2], p[3], p[4], p[5], p[6]); else if (p[0] === 'h') c.closePath(); }
  c.fillStyle = '#111'; c.fill('evenodd');
  return cv.toDataURL('image/png');
}

ROUTES.pdfimport = async (v) => {
  const st = PDFI.state;
  let body = '';
  if (!st) {
    const last = S.settings.pdfImportLast;
    body = `<div class="card stack">
      <div class="small muted">Import your old diary from a PDF (for example, the “My Diary” export): all days with their dates, times, texts and photos become entries here. Entries that are already imported are skipped.</div>
      <label class="btn full solid">${icon('download')} Choose PDF file<input type="file" accept="application/pdf,.pdf" id="pdf-file" hidden></label>
      ${last ? `<div class="small muted">Last import: “${esc(last.name)}”, pages 1–${last.done} of ${last.pages}.</div>` : ''}
      ${S.entries.some((e) => e.importKey) ? `<button class="btn full" data-act="pdfWipe">${icon('trash', 16)} Delete imported entries and start over</button>` : ''}
      <div class="small muted">Big files are fine — the PDF is read piece by piece. Keep the screen on and the journal open while it works. You can import in parts: choose the pages to import.</div>
    </div>`;
  } else if (st.phase === 'range') {
    body = `<div class="card stack">
      <div class="serif" style="font-size:18px" translate="no">${esc(st.name)}</div>
      <div class="small muted">${st.pages} pages</div>
      <div class="row" style="gap:8px"><label class="grow small muted">From page<input type="number" class="text-input" id="pi-from" min="1" max="${st.pages}" value="${st.from}"></label>
        <label class="grow small muted">To page<input type="number" class="text-input" id="pi-to" min="1" max="${st.pages}" value="${st.to}"></label></div>
      ${st.pages > 100 ? `<div class="small muted">Big diary: it’s safest to import about 100 pages at a time. Entries are saved as they are read, so nothing is lost if the page closes. When a part is done (or if it stopped), choose the same file again — it continues by itself.</div>` : ''}
      <button class="btn full solid" data-act="pdfStart">${icon('check')} Start import</button>
      <button class="btn full" data-act="pdfCancel">Cancel</button>
    </div>`;
  } else if (st.phase === 'scan') {
    const pct = Math.round(((st.next - st.from) / (st.to - st.from + 1)) * 100);
    body = `<div class="card stack">
      <div class="serif" style="font-size:18px">Reading the PDF…</div>
      <div class="pbar"><i style="width:${pct}%"></i></div>
      <div class="small muted" id="pi-prog">Page ${Math.min(st.next, st.to)} of ${st.to} · ${st.result.added + st.entries.length} entries · ${st.photoIds.length} photos</div>
      <div class="small muted">Keep the screen on and the journal open.</div>
      <button class="btn full" data-act="pdfStop">Stop here (the read part will be imported)</button>
    </div>`;
  } else if (st.phase === 'learn') {
    const todo = st.unknown.filter((u) => u.ch == null);
    body = `<div class="card stack">
      <div class="serif" style="font-size:18px">Teach me a few letters</div>
      <div class="small muted">These letters appear in your PDF, but I haven’t seen them before. Type what each one is (one letter or sign). I’ll remember them for next time. Leave empty if you’re not sure.</div>
      ${todo.map((u) => `<div class="row" style="gap:12px"><img src="${drawGlyph(u)}" style="width:64px;height:64px;border-radius:10px;flex:none" alt="">
        <div class="grow"><div class="small muted">used ${u.n}×</div><input class="text-input" maxlength="2" data-glyph="${st.unknown.indexOf(u)}" style="font-size:22px;width:80px;text-align:center" autocomplete="off" autocapitalize="off"></div></div>`).join('')}
      <button class="btn full solid" data-act="pdfLearned">${icon('check')} Continue</button>
    </div>`;
  } else if (st.phase === 'moods') {
    const emoOpts = Emo.all().map((e) => `<option value="${e.id}">${esc(e.name)}</option>`).join('');
    body = `<div class="card stack">
      <div class="serif" style="font-size:18px">Moods from your old diary</div>
      <div class="small muted">Which emotion does each icon mean? It will be added to those entries.</div>
      ${st.icons.map((ic, i) => `<div class="row" style="gap:12px"><img src="${ic.url}" style="width:48px;height:48px;flex:none" alt="">
        <select class="text-input grow" data-icon="${i}"><option value="">— no emotion —</option>${emoOpts}</select><span class="small muted">${ic.n}×</span></div>`).join('')}
      <button class="btn full solid" data-act="pdfMoodsDone">${icon('check')} Finish import</button>
    </div>`;
  } else if (st.phase === 'saving') {
    body = `<div class="card stack center"><div class="serif" style="font-size:18px" id="pi-save">Saving entries…</div><div class="small muted">Keep the screen on and the journal open.</div></div>`;
  } else if (st.phase === 'error') {
    body = `<div class="card stack">
      <div class="serif" style="font-size:18px">Something went wrong while saving</div>
      <div class="small muted" translate="no" style="word-break:break-word">${esc(st.error || '')}</div>
      <div class="small muted">The PDF is already read — tap “Try again” to save the entries without reading it again. Please send a screenshot of this screen to Claude.</div>
      <button class="btn full solid" data-act="pdfRetry">${icon('check')} Try again</button>
      <button class="btn full" data-act="pdfCancel">Cancel</button>
    </div>`;
  } else if (st.phase === 'done') {
    body = `<div class="card stack center">
      <div style="font-size:42px">🌿</div>
      <div class="serif" style="font-size:20px">Imported ${st.result.added} entries</div>
      ${st.result.skipped ? `<div class="small muted">Skipped: ${st.result.skipped} (already imported or without a date)</div>` : ''}
      ${st.result.failed ? `<div class="small muted" translate="no">Not saved: ${st.result.failed} — ${esc(st.result.firstErr || '')}</div>` : ''}
      ${!st.result.added && st.diag ? `<div class="card small" style="text-align:left" translate="no"><b>Details for Claude</b><br>
        pages ${st.diag.pages} · glyphs ${st.diag.glyphs} · texts ${st.diag.texts} · lines ${st.diag.lines} · dates ${st.diag.dates} · images ${st.diag.imgs} · skipped ${st.diag.skippedHead} · resume ${st.skipHeadStart ? 'yes' : 'no'}<br>
        ${st.diag.sample.map(esc).join('<br>') || 'no text found'}</div>
        <div class="small muted">Nothing was imported from these pages. Please send a screenshot of this screen to Claude. You can also read these pages again:</div>
        <button class="btn full" data-act="pdfRedoPart" data-from="${st.from}">Read pages ${st.from}–${st.to} again</button>` : ''}
      ${st.to < st.pages ? `<div class="small muted">Pages ${st.from}–${st.to} of ${st.pages} are done. Choose the same file again to continue from page ${st.to + 1}.</div>` : ''}
      <button class="btn full solid" data-act="pdfClose">Open my journal</button>
    </div>`;
  }
  v.innerHTML = `${topbar('Import from PDF')}<div class="page stack">${body}</div>`;
  const fi = $('#pdf-file', v);
  if (fi) fi.addEventListener('change', async () => {
    const file = fi.files[0];
    if (!file) return;
    toast('Opening…', 2500);
    try {
      // фото з попередньої незавершеної спроби імпорту, які не потрапили в жоден запис
      const used = new Set(S.entries.flatMap((e) => e.photos || []));
      for (const m of Object.values(S.photoMeta)) if (m.imp && !used.has(m.id)) { try { await deletePhoto(m.id); } catch (_) {} }
      const pdf = await PdfImport.open(file);
      const last = S.settings.pdfImportLast;
      const from = last && last.name === file.name && last.size === file.size && last.done < pdf.numPages ? last.done + 1 : 1;
      PDFI.state = { phase: 'range', pdf, name: file.name, size: file.size, pages: pdf.numPages, from, to: Math.min(pdf.numPages, from + 99), next: from, entries: [], unknown: [], icons: [], photoIds: [], lastEntry: null, day: null, cur: null, result: { added: 0, skipped: 0, failed: 0, firstErr: '' }, have: new Set(S.entries.map((e) => e.importKey).filter(Boolean)), skipHead: !!(last && last.name === file.name && last.size === file.size && last.skipHead && from === last.done + 1) };
      render();
    } catch (e) { console.error(e); toast('Couldn’t open this PDF: ' + (e.message || e), 5000); }
  });
  if (st && st.phase === 'scan' && !st.running) {
    st.running = true;
    try {
      await pdfScan(st, (p) => {
        const el = $('#pi-prog');
        if (el) { const dg = st.diag || {}; el.textContent = `Page ${p} of ${st.to} · ${st.result.added + st.entries.length} entries · ${st.photoIds.length} photos · read: ${dg.lines || 0} lines, ${dg.dates || 0} dates${st.result.skipped ? ` · already in journal: ${st.result.skipped}` : ''}`; }
        const bar = $('.pbar i'); if (bar) bar.style.width = Math.round(((p - st.from + 1) / (st.to - st.from + 1)) * 100) + '%';
      });
    } catch (e) { console.error(e); toast('Stopped: ' + (e.message || e), 6000); }
    st.running = false;
    st.to = Math.min(st.to, st.next - 1);
    st.phase = st.unknown.some((u) => u.ch == null) ? 'learn' : st.icons.some((ic) => !moodFor(ic.hash)) ? 'moods' : 'finish';
    if (st.phase === 'finish') await pdfFinalize(st);
    render();
  }
};

async function pdfFinalize(st) {
  st.phase = 'saving'; render();
  await new Promise((r) => setTimeout(r, 50));
  try { st.result = await pdfFinish(st); }
  catch (e) { console.error(e); st.error = (e && (e.name + ': ' + e.message)) || String(e); st.phase = 'error'; render(); return; }
  if (!st.result.added && st.result.failed) { st.error = st.result.firstErr; st.phase = 'error'; render(); return; }
  try { await saveSettings(); } catch (_) {}
  try { st.pdf.destroy(); } catch (_) {}
  st.phase = 'done';
}

ACT.pdfStart = () => {
  const st = PDFI.state;
  st.from = Math.max(1, Math.min(st.pages, +$('#pi-from').value || 1));
  st.to = Math.max(st.from, Math.min(st.pages, +$('#pi-to').value || st.pages));
  st.next = st.from;
  // продовження з середини: перший текст без дати дописуємо до останнього імпортованого запису
  if (st.from > 1) {
    const lastImp = S.entries.filter((e) => e.importKey).sort((a, b) => a.createdAt - b.createdAt).pop();
    if (lastImp && !st.skipHead) {
      st.cont = { id: lastImp.id, paras: [], existing: lastImp, startPage: st.from };
      st.lastEntry = st.cont;
      st.cur = st.cont;
      // день попереднього запису — щоб новий запис того ж дня (лише з часом) не злився з ним
      const d = D.parse(lastImp.date);
      st.day = { d: d.getDate(), mon: MONTH_PREFIX[d.getMonth()][0], y: d.getFullYear() };
      st.dayPage = st.from;
    }
  }
  // пропуск початку потрібен лише при точному продовженні після збою
  const last = S.settings.pdfImportLast;
  if (st.skipHead && !(last && st.from === last.done + 1)) st.skipHead = false;
  st.skipHeadStart = !!st.skipHead;
  st.phase = 'scan';
  render();
};
ACT.pdfRedoPart = async (el) => {
  const from = +el.dataset.from || 1;
  const last = S.settings.pdfImportLast;
  if (last) { last.done = from - 1; last.skipHead = false; }
  await saveSettings();
  PDFI.state = null;
  toast(`Choose the same file — it will start from page ${from}`, 4000);
  render();
};
ACT.pdfStop = () => { if (PDFI.state) PDFI.state.cancel = true; };
ACT.pdfCancel = () => { try { PDFI.state?.pdf?.destroy(); } catch (_) {} PDFI.state = null; render(); };
ACT.pdfClose = () => { PDFI.state = null; go('/'); };
ACT.pdfLearned = async () => {
  const st = PDFI.state;
  const learned = { ...(S.settings.pdfGlyphsLearned || {}) };
  for (const inp of $$('[data-glyph]')) {
    const u = st.unknown[+inp.dataset.glyph];
    const ch = inp.value.trim();
    u.ch = ch;
    if (ch) (learned[u.kinds] = learned[u.kinds] || []).push([u.vec, ch]);
  }
  S.settings.pdfGlyphsLearned = learned;
  await saveSettings();
  st.phase = st.icons.some((ic) => !moodFor(ic.hash)) ? 'moods' : 'finish';
  if (st.phase === 'finish') await pdfFinalize(st);
  render();
};
ACT.pdfMoodsDone = async () => {
  const st = PDFI.state;
  const map = { ...(S.settings.pdfMoodMap || {}) };
  for (const sel of $$('[data-icon]')) { const ic = st.icons[+sel.dataset.icon]; if (sel.value) map[ic.hash] = sel.value; }
  S.settings.pdfMoodMap = map;
  await pdfFinalize(st);
  render();
};
ACT.pdfWipe = async () => {
  const list = S.entries.filter((e) => e.importKey);
  if (!confirm(`Delete all ${list.length} imported entries (with their photos)? Your own entries stay. Then you can import the PDF again from page 1.`)) return;
  toast('Deleting…', 4000);
  for (const e of list) {
    for (const pid of e.photos || []) { try { await deletePhoto(pid); } catch (_) {} }
    try { await DB.del('entries', e.id); } catch (_) {}
  }
  S.entries = S.entries.filter((e) => !e.importKey);
  for (const m of Object.values(S.photoMeta)) if (m.imp) { try { await deletePhoto(m.id); } catch (_) {} }
  delete S.settings.pdfImportLast;
  await saveSettings();
  toast(`Deleted: ${list.length}`);
  render();
};
ACT.pdfRetry = async () => { const st = PDFI.state; if (st) { await pdfFinalize(st); render(); } };

// будь-яка неочікувана помилка — показуємо, а не мовчимо
window.addEventListener('unhandledrejection', (e) => { const r = e.reason; try { toast('Error: ' + ((r && (r.message || r.name)) || r), 6000); } catch (_) {} });
