'use strict';
/* own journal — планувальник: справи, плани, зустрічі, події, нагадування */

const TASK_TYPES = [
  ['task', 'Завдання', '☑︎'], ['plan', 'План', '✎'], ['meet', 'Зустріч', '☕︎'], ['event', 'Подія', '✦'], ['remind', 'Нагадування', '🔔'],
];
const REPEATS = [['none', 'Не повторювати'], ['daily', 'Щодня'], ['weekly', 'Щотижня'], ['monthly', 'Щомісяця']];
const DEFAULT_TASK_CATS = [
  { id: 'art', name: 'творчість', color: '#F2A7A0' },
  { id: 'study', name: 'навчання', color: '#9DBEE3' },
  { id: 'work', name: 'робота', color: '#8FA98A' },
  { id: 'self', name: 'особисте', color: '#E8C27A' },
  { id: 'health', name: 'здоровʼя', color: '#C3A6E0' },
  { id: 'travel', name: 'подорожі', color: '#E89A6A' },
  { id: 'people', name: 'зустрічі', color: '#7FB8B0' },
];
const PLANNER_STYLES = [['paper', 'Паперовий'], ['theme', 'Як тема'], ['minimal', 'Мінімал']];

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
  return false;
}
const isDone = (t, key) => (t.repeat && t.repeat !== 'none' ? (t.doneDates || []).includes(key) : !!t.done);
function tasksOn(key) {
  return TS.tasks.filter((t) => occursOn(t, key)).sort((a, b) => (a.time || '99').localeCompare(b.time || '99') || a.createdAt - b.createdAt);
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
  return `<span class="tpill ${done ? 'done' : ''}" style="--tc:${c.color}">${compact ? '' : (t.time ? `<b>${t.time}</b> ` : '')}${esc(t.title)}</span>`;
}

function taskRow(t, key) {
  const c = taskCat(t.cat);
  const type = TASK_TYPES.find((x) => x[0] === t.type) || TASK_TYPES[0];
  const done = isDone(t, key);
  return `<div class="trow ${done ? 'done' : ''}">
    <button class="tcheck" data-act="toggleTask" data-id="${t.id}" data-key="${key}" style="--tc:${c.color}" aria-label="Виконано">${done ? icon('check', 16) : ''}</button>
    <button class="grow tbody" data-act="editTask" data-id="${t.id}" data-key="${key}">
      <div class="ttitle">${type[2]} ${esc(t.title)}</div>
      <div class="small muted">${t.time ? `${icon('clock', 12)} ${t.time}${t.endTime ? '–' + t.endTime : ''} · ` : ''}${c.name ? `<span style="color:${c.color}">● ${esc(c.name)}</span>` : ''}${t.repeat && t.repeat !== 'none' ? ` · ${icon('repeat', 12)} ${REPEATS.find((r) => r[0] === t.repeat)[1].toLowerCase()}` : ''}</div>
      ${t.notes ? `<div class="small muted" style="white-space:pre-wrap;margin-top:2px">${esc(t.notes)}</div>` : ''}
    </button>
  </div>`;
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
      ${list.slice(0, 3).map((t) => taskPill(t, key, true)).join('')}${list.length > 3 ? `<span class="pmore">+${list.length - 3}</span>` : ''}
    </button>`;
  }
  grid += '</div>';
  const dayTasks = tasksOn(sel);
  const up = upcoming();
  const selDate = D.fromKey(sel);
  const entriesSel = S.entries.filter((e) => e.date.startsWith(sel));

  v.innerHTML = `${topbar('Планувальник', `<button class="icon-btn" data-act="plannerStyle">${icon('brush')}</button>`)}
  <div class="page stack planner planner-${style}">
    <div class="psheet">
      <div class="phead">
        <button class="icon-btn" data-act="pPrev">${icon('left')}</button>
        <div class="grow"><div class="ptitle">${cap(MONTHS[month.getMonth()])} ${month.getFullYear()} <span class="pdoodle">${SEASON_DOODLE[month.getMonth()]}</span></div></div>
        <button class="icon-btn" data-act="pNext">${icon('right')}</button>
      </div>
      ${grid}
      ${mk !== D.monthKey(new Date()) ? '<button class="text-btn small" data-act="pToday">← до сьогодні</button>' : ''}
    </div>

    <div class="card stack">
      <div class="row"><div class="grow"><div class="serif" style="font-size:19px">${D.long(selDate)}</div>
        <div class="small muted">${dayTasks.length ? `${dayTasks.filter((t) => isDone(t, sel)).length} з ${dayTasks.length} виконано` : 'Справ ще немає'}</div></div>
        <button class="btn solid" data-act="newTask" data-key="${sel}">${icon('plus', 18)} Справа</button></div>
      ${dayTasks.map((t) => taskRow(t, sel)).join('')}
      <div class="row" style="gap:8px;flex-wrap:wrap">
        <button class="btn grow" data-go="/edit/new?day=${sel}">${icon('edit', 18)} Написати про цей день</button>
        ${entriesSel.length ? `<button class="btn" data-go="/day/${sel}">${icon('book', 18)} ${entriesSel.length}</button>` : ''}
      </div>
    </div>

    <div class="card stack">
      ${sectionTitle('Найближчі справи', 'на два тижні вперед')}
      ${up.length ? up.map(({ t, key }) => `<div class="row small" style="gap:8px"><span class="badge" style="min-width:64px;text-align:center">${key === D.key(new Date()) ? 'сьогодні' : D.dm(D.fromKey(key))}</span>
        <span class="grow">${taskPill(t, key)}</span></div>`).join('') : '<div class="muted small">Нічого не заплановано — можна просто жити 🌿</div>'}
    </div>
    <div class="small muted center">Нагадування видно тут і на головній. Сповіщень веб-застосунок надсилати не може.</div>
  </div>`;

  ACT.pPrev = () => nav(D.monthKey(D.addMonths(month, -1)));
  ACT.pNext = () => nav(D.monthKey(D.addMonths(month, 1)));
  ACT.pToday = () => nav(D.monthKey(new Date()), D.key(new Date()));
  $('.pgrid', v).addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-pday]');
    if (!b) return;
    if (b.dataset.pday === sel) openTaskEditor(null, sel); else nav(mk, b.dataset.pday);
  });
  let sx = 0;
  const sheet = $('.psheet', v);
  sheet.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; }, { passive: true });
  sheet.addEventListener('touchend', (e) => { const dx = e.changedTouches[0].clientX - sx; if (dx < -60) ACT.pNext(); else if (dx > 60) ACT.pPrev(); });
};

ACT.plannerStyle = () => menuSheet('Стиль календаря', PLANNER_STYLES.map(([id, n]) => ({
  label: (S.settings.plannerStyle || 'paper') === id ? `✓ ${n}` : n,
  run: async () => { S.settings.plannerStyle = id; await saveSettings(); render(); },
})));
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
  if (isDone(t, key)) toast('Виконано ✓');
  const y = scrollY; await render(); scrollTo(0, y);
};

function openTaskEditor(task, key) {
  const isNew = !task;
  const t = task ? { ...task } : { id: uid(), title: '', type: 'task', date: key, time: '', endTime: '', cat: '', repeat: 'none', until: '', notes: '', done: false, doneDates: [], skip: [], createdAt: Date.now() };
  const build = () => `<div class="stack">
    <input class="text-input" id="t-title" placeholder="Що потрібно зробити?" value="${esc(t.title)}">
    <div class="periods">${TASK_TYPES.map(([id, n, ic]) => `<button class="pill ${t.type === id ? 'on' : ''}" data-type="${id}">${ic} ${n}</button>`).join('')}</div>
    <div class="row"><label class="grow small muted">Дата<input type="date" class="date-input" style="width:100%" id="t-date" value="${t.date}"></label></div>
    <div class="row"><label class="grow small muted">Час<input type="time" class="date-input" style="width:100%" id="t-time" value="${t.time || ''}"></label>
      <label class="grow small muted">До<input type="time" class="date-input" style="width:100%" id="t-end" value="${t.endTime || ''}"></label></div>
    <div class="small muted">Категорія</div>
    <div class="periods" style="flex-wrap:wrap">${taskCats().map((c) => `<button class="pill ${t.cat === c.id ? 'on' : ''}" data-cat="${c.id}" style="border-color:${c.color}"><span style="color:${c.color}">●</span> ${esc(c.name)}</button>`).join('')}
      <button class="pill" data-newcat="1">＋ категорія</button></div>
    <label class="small muted">Повторювати<select class="text-input" id="t-rep">${REPEATS.map(([id, n]) => `<option value="${id}" ${t.repeat === id ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
    ${t.repeat !== 'none' ? `<label class="small muted">Повторювати до (необовʼязково)<input type="date" class="date-input" style="width:100%" id="t-until" value="${t.until || ''}"></label>` : ''}
    <textarea class="text-input" id="t-notes" rows="3" placeholder="Нотатки…">${esc(t.notes || '')}</textarea>
    <button class="btn solid full" id="t-save">${icon('check', 18)} Зберегти</button>
    ${isNew ? '' : `<button class="btn danger full" id="t-del">${icon('trash', 18)} Видалити</button>`}
  </div>`;
  openSheet(isNew ? 'Нова справа' : 'Справа', build(), (body, close) => {
    const sync = () => {
      t.title = $('#t-title', body).value; t.date = $('#t-date', body).value || t.date; t.time = $('#t-time', body).value;
      t.endTime = $('#t-end', body).value; t.repeat = $('#t-rep', body).value; t.notes = $('#t-notes', body).value;
      if ($('#t-until', body)) t.until = $('#t-until', body).value;
    };
    body.addEventListener('change', (e) => { if (e.target.id === 't-rep') { sync(); body.innerHTML = build(); } });
    body.addEventListener('click', async (e) => {
      const ty = e.target.closest('[data-type]'), ca = e.target.closest('[data-cat]');
      if (ty) { sync(); t.type = ty.dataset.type; body.innerHTML = build(); return; }
      if (ca) { sync(); t.cat = t.cat === ca.dataset.cat ? '' : ca.dataset.cat; body.innerHTML = build(); return; }
      if (e.target.closest('[data-newcat]')) {
        sync();
        const name = prompt('Назва категорії:');
        if (!name) return;
        const palette = ['#F2A7A0', '#9DBEE3', '#8FA98A', '#E8C27A', '#C3A6E0', '#E89A6A', '#7FB8B0', '#E8A0C8', '#A8C98A'];
        const cat = { id: 'c' + uid().slice(0, 6), name: name.trim().toLowerCase(), color: palette[taskCats().length % palette.length] };
        S.settings.taskCats = [...taskCats(), cat];
        await saveSettings();
        t.cat = cat.id; body.innerHTML = build(); return;
      }
      if (e.target.closest('#t-save')) {
        sync();
        if (!t.title.trim()) { toast('Напиши назву справи'); return; }
        t.title = t.title.trim();
        await DB.put('tasks', t);
        const i = TS.tasks.findIndex((x) => x.id === t.id);
        if (i >= 0) TS.tasks[i] = t; else TS.tasks.push(t);
        close(); toast('Збережено ✓'); render();
        return;
      }
      if (e.target.closest('#t-del')) {
        let all = true;
        if (t.repeat !== 'none') all = confirm('Видалити всі повторення? (Скасувати — прибрати лише цей день)');
        else if (!confirm('Видалити цю справу?')) return;
        if (all) { await DB.del('tasks', t.id); TS.tasks = TS.tasks.filter((x) => x.id !== t.id); }
        else { const orig = TS.tasks.find((x) => x.id === t.id); orig.skip = [...(orig.skip || []), key]; await DB.put('tasks', orig); }
        close(); render();
      }
    });
    if (isNew) setTimeout(() => $('#t-title', body)?.focus(), 250);
  }, { doneText: 'Закрити' });
}

function homeUpcomingHTML() {
  const up = upcoming(7, 3);
  return `<button class="card tight stack" data-go="/planner" style="gap:8px;text-align:left;width:100%;color:var(--text)">
    <div class="row"><span class="hand grow" style="font-size:15px">Найближчі справи</span>${icon('planner', 18)}</div>
    ${up.length ? up.map(({ t, key }) => `<div class="small" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
      <span class="muted">${key === D.key(new Date()) ? (t.time || 'сьогодні') : D.dm(D.fromKey(key))}</span> ${taskPill(t, key, true)}</div>`).join('')
      : '<div class="small muted">Поки нічого не заплановано.</div>'}
  </button>`;
}
