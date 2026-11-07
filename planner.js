'use strict';
/* own journal — планувальник: справи, плани, зустрічі, події, нагадування */

const TASK_TYPES = [
  ['task', 'Task', '☑︎'], ['plan', 'Plan', '✎'], ['meet', 'Meeting', '☕︎'], ['event', 'Event', '✦'], ['remind', 'Reminders', '🔔'],
];
const REPEATS = [['none', 'Don’t repeat'], ['daily', 'Daily'], ['weekly', 'Weekly'], ['monthly', 'Monthly'], ['yearly', 'Yearly']];
const DEFAULT_TASK_CATS = [
  { id: 'art', name: 'art', color: '#F2A7A0' },
  { id: 'study', name: 'study', color: '#9DBEE3' },
  { id: 'work', name: 'work', color: '#8FA98A' },
  { id: 'self', name: 'personal', color: '#E8C27A' },
  { id: 'health', name: 'health', color: '#C3A6E0' },
  { id: 'travel', name: 'travel', color: '#E89A6A' },
  { id: 'people', name: 'people', color: '#7FB8B0' },
];
const PLANNER_STYLES = [['paper', 'Paper'], ['theme', 'Theme'], ['minimal', 'Minimal']];

const TS = { tasks: [] };

async function loadTasks() {
  try { TS.tasks = await DB.all('tasks'); } catch (_) { TS.tasks = []; }
}
const taskCats = () => S.settings.taskCats || DEFAULT_TASK_CATS;
const taskCat = (id) => taskCats().find((c) => c.id === id) || { id: '', name: '', color: '#B9B0A4' };

function occursOn(t, key) {
  if ((t.skip || []).includes(key)) return false;
  if (!t.repeat || t.repeat === 'none') return t.date === key;
  if (key < t.date) return false;
  if (t.until && key > t.until) return false;
  const a = D.fromKey(t.date), b = D.fromKey(key);
  if (t.repeat === 'daily') return true;
  if (t.repeat === 'weekly') return a.getDay() === b.getDay();
  if (t.repeat === 'monthly') return Math.min(a.getDate(), D.daysIn(b)) === b.getDate();
  if (t.repeat === 'yearly') return a.getMonth() === b.getMonth() && Math.min(a.getDate(), D.daysIn(b)) === b.getDate();
  return false;
}
const isDone = (t, key) => (t.repeat && t.repeat !== 'none' ? (t.doneDates || []).includes(key) : !!t.done);
function tasksOn(key) {
  return TS.tasks.filter((t) => t.type !== 'dayart' && occursOn(t, key)).sort((a, b) => (a.time || '99').localeCompare(b.time || '99') || a.createdAt - b.createdAt);
}

function upcoming(days = 14, limit = 8) {
  const out = [];
  const today = D.start(new Date());
  const nowT = D.time(new Date());
  for (let i = 0; i < days && out.length < limit; i++) {
    const key = D.key(D.addDays(today, i));
    for (const t of tasksOn(key)) {
      if (isDone(t, key)) continue;
      if (i === 0 && t.time && t.time < nowT && t.type !== 'event') continue;
      out.push({ t, key });
      if (out.length >= limit) break;
    }
  }
  return out;
}

function taskPill(t, key, compact) {
  const c = taskCat(t.cat);
  const done = isDone(t, key);
  return `<span class="tpill ${done ? 'done' : ''}" translate="no" style="--tc:${c.color}">${compact ? '' : (t.time ? `<b>${t.time}</b> ` : '')}${esc(t.title)}</span>`;
}

function taskRow(t, key) {
  const c = taskCat(t.cat);
  const type = TASK_TYPES.find((x) => x[0] === t.type) || TASK_TYPES[0];
  const done = isDone(t, key);
  return `<div class="trow ${done ? 'done' : ''}">
    <button class="tcheck" data-act="toggleTask" data-id="${t.id}" data-key="${key}" style="--tc:${c.color}" aria-label="Done">${done ? icon('check', 16) : ''}</button>
    <button class="grow tbody" data-act="editTask" data-id="${t.id}" data-key="${key}">
      <div class="ttitle" translate="no">${type[2]} ${esc(t.title)}</div>
      <div class="small muted">${t.time ? `${icon('clock', 12)} ${t.time}${t.endTime ? '–' + t.endTime : ''} · ` : ''}${c.name ? `<span style="color:${c.color}">● ${esc(c.name)}</span>` : ''}${t.repeat && t.repeat !== 'none' ? ` · ${icon('repeat', 12)} ${REPEATS.find((r) => r[0] === t.repeat)[1].toLowerCase()}` : ''}</div>
      ${t.notes ? `<div class="small muted" translate="no" style="white-space:pre-wrap;margin-top:2px">${esc(t.notes)}</div>` : ''}
    </button>
    <button class="tdel" data-act="delTask" data-id="${t.id}" data-key="${key}" aria-label="Delete">${icon('trash', 17)}</button>
  </div>${(t.media || []).length ? `<div class="tmedia row-thumbs">${t.media.map((m) => `<button data-act="taskMedia" data-id="${t.id}" data-m="${m.id}"><img src="${taskMediaURL(m)}" alt=""></button>`).join('')}</div>` : ''}`;
}

const SEASON_DOODLE = ['☃️', '❄️', '🌷', '🌸', '🌼', '☀️', '🍓', '🌻', '🍎', '🍂', '🍄', '🎄'];

ROUTES.planner = async (v, parts, q) => {
  const st = S.settings;
  const style = st.plannerStyle || 'paper';
  const month = q.get('m') ? D.fromKey(q.get('m') + '-01') : D.monthStart(new Date());
  const mk = D.monthKey(month);
  const sel = q.get('d') || (mk === D.monthKey(new Date()) ? D.key(new Date()) : mk + '-01');
  const nav = (m, d) => go(`/planner?m=${m}&d=${d || ''}`, true);
  const first = D.monthStart(month), blanks = D.wd(first), n = D.daysIn(first);
  let grid = `<div class="pgrid">${WD.map((w) => `<div class="pwd">${w}</div>`).join('')}`;
  for (let i = 0; i < blanks; i++) grid += '<div class="pcell empty"></div>';
  for (let i = 1; i <= n; i++) {
    const key = `${mk}-${pad(i)}`;
    const list = tasksOn(key);
    const hasEntry = S.entries.some((e) => e.date.startsWith(key));
    grid += `<button class="pcell ${key === D.key(new Date()) ? 'today' : ''} ${key === sel ? 'sel' : ''}" data-pday="${key}">
      <span class="pnum">${i}${hasEntry ? '<i class="pdot"></i>' : ''}</span>
      ${dayArt(key).length ? `<img class="pthumb" src="${taskMediaURL(dayArt(key)[0])}" alt="">` : ''}
      ${list.slice(0, 3).map((t) => taskPill(t, key, true)).join('')}${list.length > 3 ? `<span class="pmore">+${list.length - 3}</span>` : ''}
    </button>`;
  }
  grid += '</div>';
  const dayTasks = tasksOn(sel);
  const up = upcoming();
  const selDate = D.fromKey(sel);
  const entriesSel = S.entries.filter((e) => e.date.startsWith(sel));

  v.innerHTML = `${topbar('Planner', `<button class="icon-btn" data-act="plannerStyle">${icon('brush')}</button>`)}
  <div class="page stack planner planner-${style}" style="${paperVars()}">
    <div class="psheet">
      <div class="phead">
        <button class="icon-btn" data-act="pPrev">${icon('left')}</button>
        <div class="grow"><div class="ptitle">${cap(MONTHS[month.getMonth()])} ${month.getFullYear()} <span class="pdoodle">${SEASON_DOODLE[month.getMonth()]}</span></div></div>
        <button class="icon-btn" data-act="pNext">${icon('right')}</button>
      </div>
      ${grid}
      ${mk !== D.monthKey(new Date()) ? '<button class="text-btn small" data-act="pToday">← to today</button>' : ''}
    </div>

    <div class="card stack">
      <div class="row"><div class="grow"><div class="serif" style="font-size:19px">${D.long(selDate)}</div>
        <div class="small muted">${dayTasks.length ? `${dayTasks.filter((t) => isDone(t, sel)).length} of ${dayTasks.length} done` : 'No plans yet'}</div></div>
        <button class="btn solid" data-act="newTask" data-key="${sel}">${icon('plus', 18)} Plan</button></div>
      ${dayTasks.map((t) => taskRow(t, sel)).join('')}
      <div class="small muted">Pictures & drawings on this day</div>
      ${dayArt(sel).length ? `<div class="tmedia">${dayArt(sel).map((m) => `<span class="tm"><img src="${taskMediaURL(m)}" alt="" data-act="dayArtView" data-key="${sel}" data-m="${m.id}"><button class="tm-x" data-act="dayArtDel" data-key="${sel}" data-m="${m.id}" aria-label="Remove">×</button></span>`).join('')}</div>` : ''}
      <div class="row" style="gap:8px"><label class="btn grow">${icon('image', 18)} Add picture<input type="file" accept="image/*" multiple id="day-photo" hidden></label>
        <button class="btn grow" data-act="dayArtDraw" data-key="${sel}">${icon('pen', 18)} Draw</button></div>
      <div class="row" style="gap:8px;flex-wrap:wrap">
        <button class="btn grow" data-go="/edit/new?day=${sel}">${icon('edit', 18)} Write about this day</button>
        ${entriesSel.length ? `<button class="btn" data-go="/day/${sel}">${icon('book', 18)} ${entriesSel.length}</button>` : ''}
      </div>
    </div>

    <div class="card stack">
      ${sectionTitle('Upcoming', 'next two weeks')}
      ${up.length ? up.map(({ t, key }) => `<div class="row small" style="gap:8px"><span class="badge" style="min-width:64px;text-align:center">${key === D.key(new Date()) ? 'today' : D.dm(D.fromKey(key))}</span>
        <span class="grow">${taskPill(t, key)}</span></div>`).join('') : '<div class="muted small">Nothing planned — just enjoy life 🌿</div>'}
    </div>
    <div class="small muted center">Reminders show here and on the home screen. A web app can’t send notifications.</div>
  </div>`;

  ACT.pPrev = () => nav(D.monthKey(D.addMonths(month, -1)));
  ACT.pNext = () => nav(D.monthKey(D.addMonths(month, 1)));
  ACT.pToday = () => nav(D.monthKey(new Date()), D.key(new Date()));
  $('.pgrid', v).addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-pday]');
    if (!b) return;
    if (b.dataset.pday === sel) openTaskEditor(null, sel); else nav(mk, b.dataset.pday);
  });
  $('#day-photo', v)?.addEventListener('change', async (e) => {
    const add = [];
    for (const f of e.target.files) { const b = await shrinkImage(f, 1600); if (b) add.push({ id: uid(), kind: 'photo', blob: b }); }
    if (add.length) { await saveDayArt(sel, [...dayArt(sel), ...add]); toast('Added ✓'); render(); }
  });
  let sx = 0;
  const sheet = $('.psheet', v);
  sheet.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; }, { passive: true });
  sheet.addEventListener('touchend', (e) => { const dx = e.changedTouches[0].clientX - sx; if (dx < -60) ACT.pNext(); else if (dx > 60) ACT.pPrev(); });
};

const PAPER_COLORS = ['#FBF8F2', '#F3E7D3', '#E9DCC6', '#E4EAD9', '#DCE7E3', '#E3E6F0', '#EEDFE6', '#E8E0F0', '#C9B79C', '#8FA38A', '#3E4A3F', '#2B3340', '#3A2F3A', '#1F2220'];

async function setPlannerLook(style, color) {
  if (style) S.settings.plannerStyle = style;
  if (color) S.settings.plannerColor = color;
  // одразу показуємо, навіть до збереження
  const pl = $('.planner');
  if (pl) { pl.className = pl.className.replace(/planner-\w+/, 'planner-' + (S.settings.plannerStyle || 'paper')); pl.setAttribute('style', paperVars()); }
  try { await saveSettings(); } catch (e) { console.error(e); toast('Couldn’t save: ' + (e.message || e.name || e), 5000); return; }
  closeAllSheets(); render();
}
ACT.pStyle = (el) => setPlannerLook(el.dataset.v);
ACT.pColor = (el) => setPlannerLook('paper', el.dataset.v);

function paperVars(over) {
  const bg = over || S.settings.plannerColor || '#FBF8F2';
  const [r, g, b] = hexRGB(bg);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  const dark = lum < 0.55;
  return `--pbg:${bg};--pink:${dark ? '#F3EDE4' : '#4A4440'};--psub:${dark ? '#C9C0B4' : '#8A7F72'};--pmix:${dark ? '#fff' : '#000'};`;
}

ACT.plannerStyle = () => {
  const cur = S.settings.plannerStyle || 'paper';
  const col = S.settings.plannerColor || '#FBF8F2';
  openSheet('Calendar style', `<div class="stack">
    <div class="periods">${PLANNER_STYLES.map(([id, n]) => `<button class="pill ${cur === id ? 'on' : ''}" data-act="pStyle" data-v="${id}">${n}</button>`).join('')}</div>
    <div class="small muted">Calendar color (for the “Paper” style)</div>
    <div class="pcolors">${PAPER_COLORS.map((c) => `<button class="${c.toLowerCase() === col.toLowerCase() ? 'on' : ''}" data-act="pColor" data-v="${c}" style="background:${c}" aria-label="${c}"></button>`).join('')}
      <label style="background:conic-gradient(red,yellow,lime,cyan,blue,magenta,red)"><input type="color" id="pcol-own" value="${col}" hidden></label></div>
  </div>`, (body, close) => {
    $('#pcol-own', body).addEventListener('change', (e) => setPlannerLook('paper', e.target.value));
    $('#pcol-own', body).addEventListener('input', (e) => { $('.planner')?.setAttribute('style', paperVars(e.target.value)); });
  }, { doneText: 'Close' });
};

/* ---------- картинки й малюнки прямо в календарі ---------- */
function dayArt(key) { return (TS.tasks.find((t) => t.id === 'dayart-' + key) || {}).media || []; }
async function saveDayArt(key, media) {
  const id = 'dayart-' + key;
  if (!media.length) { await DB.del('tasks', id); TS.tasks = TS.tasks.filter((t) => t.id !== id); return; }
  const rec = { id, type: 'dayart', date: key, repeat: 'none', title: '', media, createdAt: Date.now() };
  await DB.put('tasks', rec);
  const i = TS.tasks.findIndex((t) => t.id === id);
  if (i >= 0) TS.tasks[i] = rec; else TS.tasks.push(rec);
}
ACT.dayArtDraw = (el) => openDrawing(async (b) => { if (!b) return; await saveDayArt(el.dataset.key, [...dayArt(el.dataset.key), { id: uid(), kind: 'drawing', blob: b }]); toast('Drawing added ✓'); render(); });
ACT.dayArtView = (el) => { const m = dayArt(el.dataset.key).find((x) => x.id === el.dataset.m); if (m) showTaskMedia(m); };
ACT.dayArtDel = async (el) => {
  if (!confirm('Remove this picture from the calendar?')) return;
  await saveDayArt(el.dataset.key, dayArt(el.dataset.key).filter((x) => x.id !== el.dataset.m));
  render();
};
ACT.delTask = async (el) => {
  const t = TS.tasks.find((x) => x.id === el.dataset.id);
  if (!t) return;
  let all = true;
  if (t.repeat && t.repeat !== 'none') all = confirm('Delete all repeats? (Cancel = remove only this day)');
  else if (!confirm(`Delete “${t.title}”?`)) return;
  if (all) { await DB.del('tasks', t.id); TS.tasks = TS.tasks.filter((x) => x.id !== t.id); }
  else { t.skip = [...(t.skip || []), el.dataset.key]; await DB.put('tasks', t); }
  toast('Deleted');
  const y = scrollY; await render(); scrollTo(0, y);
};
ACT.newTask = (el) => openTaskEditor(null, el.dataset.key);
ACT.editTask = (el) => openTaskEditor(TS.tasks.find((t) => t.id === el.dataset.id), el.dataset.key);
ACT.toggleTask = async (el) => {
  const t = TS.tasks.find((x) => x.id === el.dataset.id);
  if (!t) return;
  const key = el.dataset.key;
  if (t.repeat && t.repeat !== 'none') {
    const s = new Set(t.doneDates || []);
    if (s.has(key)) s.delete(key); else s.add(key);
    t.doneDates = [...s];
  } else t.done = !t.done;
  await DB.put('tasks', t);
  if (isDone(t, key)) toast('Done ✓');
  const y = scrollY; await render(); scrollTo(0, y);
};

function openTaskEditor(task, key) {
  const isNew = !task;
  const t = task ? { ...task } : { id: uid(), title: '', type: 'task', date: key, time: '', endTime: '', cat: '', repeat: 'none', until: '', notes: '', done: false, doneDates: [], skip: [], createdAt: Date.now() };
  const build = () => `<div class="stack">
    <input class="text-input" id="t-title" placeholder="What needs to be done?" value="${esc(t.title)}">
    <div class="periods">${TASK_TYPES.map(([id, n, ic]) => `<button class="pill ${t.type === id ? 'on' : ''}" data-type="${id}">${ic} ${n}</button>`).join('')}</div>
    <div class="row"><label class="grow small muted">Date<input type="date" class="date-input" style="width:100%" id="t-date" value="${t.date}"></label></div>
    <div class="row"><label class="grow small muted">Time<input type="time" class="date-input" style="width:100%" id="t-time" value="${t.time || ''}"></label>
      <label class="grow small muted">Until<input type="time" class="date-input" style="width:100%" id="t-end" value="${t.endTime || ''}"></label></div>
    <div class="small muted">Category</div>
    <div class="periods" style="flex-wrap:wrap">${taskCats().map((c) => `<button class="pill ${t.cat === c.id ? 'on' : ''}" data-cat="${c.id}" style="border-color:${c.color}"><span style="color:${c.color}">●</span> ${esc(c.name)}</button>`).join('')}
      <button class="pill" data-newcat="1">＋ category</button></div>
    <label class="small muted">Repeat<select class="text-input" id="t-rep">${REPEATS.map(([id, n]) => `<option value="${id}" ${t.repeat === id ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
    ${t.repeat !== 'none' ? `<label class="small muted">Repeat until (optional)<input type="date" class="date-input" style="width:100%" id="t-until" value="${t.until || ''}"></label>` : ''}
    <textarea class="text-input" id="t-notes" rows="3" placeholder="Notes…">${esc(t.notes || '')}</textarea>
    <div class="small muted">Pictures & drawings</div>
    ${(t.media || []).length ? `<div class="tmedia">${t.media.map((m) => `<span class="tm"><img src="${taskMediaURL(m)}" alt="" data-tview="${m.id}"><button class="tm-x" data-tdel="${m.id}" aria-label="Remove">×</button></span>`).join('')}</div>` : ''}
    <div class="row" style="gap:8px"><label class="btn grow">${icon('image', 18)} Add photo<input type="file" accept="image/*" multiple id="t-photo" hidden></label>
      <button class="btn grow" id="t-draw">${icon('pen', 18)} Draw</button></div>
    <button class="btn solid full" id="t-save">${icon('check', 18)} Save</button>
    ${isNew ? '' : `<button class="btn danger full" id="t-del">${icon('trash', 18)} Delete</button>`}
  </div>`;
  openSheet(isNew ? 'New plan' : 'Plan', build(), (body, close) => {
    const sync = () => {
      t.title = $('#t-title', body).value; t.date = $('#t-date', body).value || t.date; t.time = $('#t-time', body).value;
      t.endTime = $('#t-end', body).value; t.repeat = $('#t-rep', body).value; t.notes = $('#t-notes', body).value;
      if ($('#t-until', body)) t.until = $('#t-until', body).value;
    };
    body.addEventListener('change', async (e) => {
      if (e.target.id === 't-rep') { sync(); body.innerHTML = build(); }
      if (e.target.id === 't-photo') {
        sync();
        for (const f of e.target.files) { const b = await shrinkImage(f, 1600); if (b) t.media = [...(t.media || []), { id: uid(), kind: 'photo', blob: b }]; }
        body.innerHTML = build();
      }
    });
    body.addEventListener('click', async (e) => {
      const ty = e.target.closest('[data-type]'), ca = e.target.closest('[data-cat]');
      if (ty) { sync(); t.type = ty.dataset.type; body.innerHTML = build(); return; }
      if (ca) { sync(); t.cat = t.cat === ca.dataset.cat ? '' : ca.dataset.cat; body.innerHTML = build(); return; }
      const td = e.target.closest('[data-tdel]'), tv = e.target.closest('[data-tview]');
      if (td) { sync(); t.media = (t.media || []).filter((m) => m.id !== td.dataset.tdel); body.innerHTML = build(); return; }
      if (tv) { const m = (t.media || []).find((x) => x.id === tv.dataset.tview); if (m) showTaskMedia(m); return; }
      if (e.target.closest('#t-draw')) { sync(); openDrawing((b) => { if (b) { t.media = [...(t.media || []), { id: uid(), kind: 'drawing', blob: b }]; body.innerHTML = build(); } }); return; }
      if (e.target.closest('[data-newcat]')) {
        sync();
        const name = prompt('Category name:');
        if (!name) return;
        const palette = ['#F2A7A0', '#9DBEE3', '#8FA98A', '#E8C27A', '#C3A6E0', '#E89A6A', '#7FB8B0', '#E8A0C8', '#A8C98A'];
        const cat = { id: 'c' + uid().slice(0, 6), name: name.trim().toLowerCase(), color: palette[taskCats().length % palette.length] };
        S.settings.taskCats = [...taskCats(), cat];
        await saveSettings();
        t.cat = cat.id; body.innerHTML = build(); return;
      }
      if (e.target.closest('#t-save')) {
        sync();
        if (!t.title.trim()) { toast('Type a name for the plan'); return; }
        t.title = t.title.trim();
        await DB.put('tasks', t);
        const i = TS.tasks.findIndex((x) => x.id === t.id);
        if (i >= 0) TS.tasks[i] = t; else TS.tasks.push(t);
        close(); toast('Saved ✓'); render();
        return;
      }
      if (e.target.closest('#t-del')) {
        let all = true;
        if (t.repeat !== 'none') all = confirm('Delete all repeats? (Cancel = remove only this day)');
        else if (!confirm('Delete this plan?')) return;
        if (all) { await DB.del('tasks', t.id); TS.tasks = TS.tasks.filter((x) => x.id !== t.id); }
        else { const orig = TS.tasks.find((x) => x.id === t.id); orig.skip = [...(orig.skip || []), key]; await DB.put('tasks', orig); }
        close(); render();
      }
    });
    if (isNew) setTimeout(() => $('#t-title', body)?.focus(), 250);
  }, { doneText: 'Close' });
}

function homeUpcomingHTML() {
  const up = upcoming(7, 3);
  return `<button class="card tight stack" data-go="/planner" style="gap:8px;text-align:left;width:100%;color:var(--text)">
    <div class="row"><span class="hand grow" style="font-size:15px">Upcoming</span>${icon('planner', 18)}</div>
    ${up.length ? up.map(({ t, key }) => `<div class="small" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
      <span class="muted">${key === D.key(new Date()) ? (t.time || 'today') : D.dm(D.fromKey(key))}</span> ${taskPill(t, key, true)}</div>`).join('')
      : '<div class="small muted">Nothing planned yet.</div>'}
  </button>`;
}

/* ---------- картинки й малюнки в справах ---------- */
function taskMediaURL(m) { return blobURL('tm-' + m.id, m.blob); }

async function shrinkImage(file, max) {
  try {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(file); });
    const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const cv = document.createElement('canvas');
    cv.width = Math.round(img.naturalWidth * k); cv.height = Math.round(img.naturalHeight * k);
    cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
    URL.revokeObjectURL(img.src);
    return await new Promise((res) => cv.toBlob(res, 'image/jpeg', 0.88));
  } catch (e) { console.warn(e); return null; }
}

function showTaskMedia(m) {
  const el = document.createElement('div');
  el.className = 'viewer';
  el.innerHTML = `<div class="slide" style="width:100vw;height:100%;display:grid;place-items:center;${m.kind === 'drawing' ? 'background:#fbf7ef' : ''}"><img src="${taskMediaURL(m)}" alt="" style="max-width:100vw;max-height:100%;object-fit:contain"></div>
    <div class="vtop"><button class="icon-btn" aria-label="Close">${icon('x')}</button><span></span></div>`;
  el.addEventListener('click', () => el.remove());
  document.body.appendChild(el);
}

ACT.taskMedia = (el) => {
  const t = TS.tasks.find((x) => x.id === el.dataset.id);
  const m = t && (t.media || []).find((x) => x.id === el.dataset.m);
  if (m) showTaskMedia(m);
};
