/* ==========================================================================
   ПІДСУМОК РОКУ — «історія» з карток: цифри, емоції, найкращі дні,
   «все минає» (сумні дні й перший добрий день після них), фото року.
   ========================================================================== */

const GOOD = 0.9, SAD = -0.6; // межі «доброго» і «сумного» дня за середнім настроєм

function reviewYears() {
  return [...new Set(S.entries.map((e) => e.date.slice(0, 4)))].sort((a, b) => b - a);
}

/** Колір настрою: від синього (сумно) через сірий до теплого жовтого (радісно). */
function scoreColor(s) {
  if (s == null) return 'rgba(127,127,127,.18)';
  const t = Math.max(-1, Math.min(1, s / 1.6));
  const mix = (a, b, k) => a.map((v, i) => Math.round(v + (b[i] - v) * k));
  const c = t < 0 ? mix([150, 150, 160], [70, 110, 210], -t) : mix([150, 150, 160], [240, 190, 80], t);
  return `rgb(${c})`;
}

function daySnippet(d, n = 140) {
  const e = d.entries.find((x) => (x.text || '').trim()) || d.entries[0];
  if (!e) return '';
  const t = (e.text || e.title || '').replace(/\s+/g, ' ').trim();
  return t.length > n ? t.slice(0, n).replace(/\s\S*$/, '') + '…' : t;
}

function dayCardHTML(d, extra = '') {
  const res = dayMood(d);
  const phs = d.entries.flatMap((e) => e.photos || []);
  const ph = phs[0];
  return `<a class="card yr-day" data-go="/day/${d.key}">
    <div class="yr-day-art">${res ? moodArtHTML(res, 'yr' + d.key) : ph ? `<img data-pid="${ph}" alt="">` : ''}</div>
    <div class="grow" style="min-width:0">
      <div class="small muted">${extra}</div>
      <div class="serif" style="font-size:17px">${D.long(d.date)}</div>
      <div style="margin:4px 0">${Emo.stack(d.all.slice(0, 5), 24, 5)}</div>
      ${daySnippet(d) ? `<div class="small yr-snip" translate="no">${esc(daySnippet(d))}</div>` : ''}
      ${phs.length ? `<div class="yr-photos">${phs.slice(0, 3).map((p) => `<img data-pid="${p}" alt="">`).join('')}${phs.length > 3 ? `<span>+${phs.length - 3}</span>` : ''}</div>` : ''}
    </div></a>`;
}

/** Найкращі/найсумніші дні так, щоб не всі були з одного тижня. */
function spread(list, n, gap = 7) {
  const out = [];
  for (const d of list) {
    if (out.length >= n) break;
    if (out.every((x) => Math.abs(D.between(x.date, d.date)) >= gap)) out.push(d);
  }
  return out;
}

ROUTES.review = async (v, parts) => {
  const years = reviewYears();
  const year = parts[1] || years[0] || String(new Date().getFullYear());
  const all = buildIndex();
  const days = Object.values(all).filter((d) => d.key.startsWith(year)).sort((a, b) => a.key.localeCompare(b.key));
  const entries = S.entries.filter((e) => e.date.startsWith(year));
  const photos = entries.flatMap((e) => (e.photos || []).map((p) => ({ id: p, e })));
  const words = entries.reduce((a, e) => a + ((e.text || '').match(/\S+/g) || []).length, 0);
  const written = new Set(entries.map((e) => e.date.slice(0, 10))).size;

  if (!entries.length && !days.length) {
    v.innerHTML = `${topbar('Year in review')}<div class="page stack"><div class="empty-state"><div class="big">✨</div><div class="muted">No entries in ${year} yet.</div></div></div>`;
    return;
  }

  // емоції року
  const counts = {};
  days.forEach((d) => d.marks.forEach((id) => (counts[id] = (counts[id] || 0) + 1)));
  const top = Object.entries(counts).filter(([id]) => Emo.get(id)).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const maxC = top.length ? top[0][1] : 1;
  const totalMarks = Object.values(counts).reduce((a, b) => a + b, 0);
  const posShare = totalMarks ? Math.round(100 * days.reduce((a, d) => a + d.marks.filter((id) => (Emo.get(id)?.score || 0) > 0.3).length, 0) / totalMarks) : 0;

  // настрій місяців
  const months = Array.from({ length: 12 }, (_, m) => {
    const list = days.filter((d) => +d.key.slice(5, 7) === m + 1 && d.score != null);
    return { m, n: days.filter((d) => +d.key.slice(5, 7) === m + 1).length, avg: list.length ? list.reduce((a, d) => a + d.score, 0) / list.length : null };
  });
  const brightest = months.filter((x) => x.avg != null).sort((a, b) => b.avg - a.avg)[0];

  // найкращі і сумні дні
  const scored = days.filter((d) => d.score != null);
  const best = spread(scored.filter((d) => d.score >= GOOD).sort((a, b) => b.score - a.score), 4);
  const sad = spread(scored.filter((d) => d.score <= SAD).sort((a, b) => a.score - b.score), 2, 14);
  const afterSad = sad.map((d) => {
    const next = Object.values(all).filter((x) => x.key > d.key && x.score != null && x.score >= 0.5).sort((a, b) => a.key.localeCompare(b.key))[0];
    return { d, next, gap: next ? D.between(d.date, next.date) : null };
  });
  const goodDays = scored.filter((d) => d.score >= GOOD).length;

  // фото року — по одному з кожного місяця (з улюбленого або найкращого дня)
  const yearPhotos = [];
  for (let m = 1; m <= 12; m++) {
    const mk = `${year}-${String(m).padStart(2, '0')}`;
    const list = photos.filter((p) => p.e.date.startsWith(mk));
    if (!list.length) continue;
    const pick = list.find((p) => p.e.favorite) || list.slice().sort((a, b) => (all[b.e.date.slice(0, 10)]?.score ?? -9) - (all[a.e.date.slice(0, 10)]?.score ?? -9))[0];
    yearPhotos.push(pick);
  }

  const M3 = MONTHS_SHORT;
  v.innerHTML = `${topbar('Year in review')}
  <div class="page stack yr">
    ${years.length > 1 ? `<div class="seg" style="align-self:center">${years.slice(0, 6).map((y) => `<button class="${y === year ? 'on' : ''}" data-go="/review/${y}">${y}</button>`).join('')}</div>` : ''}

    <div class="card yr-cover center">
      <div class="small muted">goodbye,</div>
      <div class="yr-year">${year}</div>
      <div class="small muted" style="margin-top:6px">let’s look back at it together one last time</div>
      <div class="grid3" style="margin-top:14px">
        <div><div class="big-num">${entries.length}</div><div class="small muted">entries</div></div>
        <div><div class="big-num">${written}</div><div class="small muted">days written</div></div>
        <div><div class="big-num">${photos.length}</div><div class="small muted">photos</div></div>
      </div>
      ${words ? `<div class="small muted" style="margin-top:10px">${words.toLocaleString('en')} words — that’s about ${Math.max(1, Math.round(words / 250))} page${Math.round(words / 250) > 1 ? "s" : ""} of your story</div>` : ''}
    </div>

    ${top.length ? `<div class="card stack">
      ${sectionTitle('Emotions of the year', posShare ? `${posShare}% of your marks were bright ones` : '')}
      ${top.map(([id, c]) => { const e = Emo.get(id); return `<div class="row" style="gap:10px">${Emo.badge(e, 40)}
        <div class="grow"><div class="row"><span class="grow">${esc(e.name)}</span><span class="small muted">×${c}</span></div>
        <div class="yr-bar"><span style="width:${Math.max(6, Math.round(100 * c / maxC))}%;background:${e.color || 'var(--accent)'}"></span></div></div></div>`; }).join('')}
    </div>` : ''}

    <div class="card stack">
      ${sectionTitle('Month by month', brightest ? `brightest month — ${MONTHS[brightest.m]}` : '')}
      <div class="yr-months">${months.map((x) => `<a class="yr-month" ${x.n ? `data-go="/month/${year}-${String(x.m + 1).padStart(2, '0')}"` : ''}>
        <span style="background:${scoreColor(x.avg)}"></span><small>${M3[x.m]}</small></a>`).join('')}</div>
      <div class="small muted center">blue — harder days · warm — brighter days</div>
    </div>

    ${best.length ? `${sectionTitle('Your best days', 'the days that shone')}${best.map((d, i) => dayCardHTML(d, ['☀️ the brightest day', '✨ another happy day', '🌼 a lovely day', '💛 a warm day'][i])).join('')}` : ''}

    ${sad.length ? `<div class="card stack yr-pass">
      ${sectionTitle('Everything passes', 'even after the hardest days, good ones came')}
      ${afterSad.map(({ d, next, gap }) => `<div class="stack" style="gap:6px">
        ${dayCardHTML(d, '🌧 a hard day')}
        <div class="yr-arrow">${next ? `↓ ${gap === 1 ? 'the very next day' : `${gap} days later`}` : '↓ and you kept going'}</div>
        ${next ? dayCardHTML(next, '☀️ and then') : ''}
      </div>`).join('<hr class="yr-hr">')}
    </div>` : ''}

    ${yearPhotos.length ? `${sectionTitle('Photos of the year', 'one from every month')}
      <div class="grid3">${yearPhotos.map((p, i) => `<button class="thumb" data-act="reviewPhoto" data-i="${i}"><img data-pid="${p.id}" alt=""></button>`).join('')}</div>` : ''}

    <div class="card center stack yr-end">
      <div style="font-size:34px">🌿</div>
      <div class="serif" style="font-size:19px">${goodDays ? `This year had ${goodDays} bright day${goodDays === 1 ? '' : 's'}.` : 'You made it through this year.'}</div>
      <div class="small muted">${sad.length ? 'Some days were heavy — and every one of them passed. ' : ''}Thank you for writing your story. 💛</div>
      <div class="serif" style="font-size:17px;margin-top:6px">Goodbye, ${year}. Hello, ${+year + 1} ✨</div>
    </div>
  </div>`;
  ACT.reviewPhoto = (el) => openViewer(yearPhotos.map((p) => p.id), +el.dataset.i);
  hydrate(v);
};
ACT.openReview = () => go('/review/' + (reviewYears()[0] || new Date().getFullYear()));

/** На Новий рік (31 грудня — 14 січня) підсумок відкривається сам — один раз. */
function maybeAutoReview() {
  const now = new Date();
  const inWindow = (now.getMonth() === 11 && now.getDate() === 31) || (now.getMonth() === 0 && now.getDate() <= 14);
  if (!inWindow) return false;
  const y = String(now.getMonth() === 11 ? now.getFullYear() : now.getFullYear() - 1);
  if ((S.settings.reviewShown || '') === y || !S.entries.some((e) => e.date.startsWith(y))) return false;
  if ((parseHash().parts[0] || '') !== '') return false;
  S.settings.reviewShown = y;
  saveSettings().catch(() => {});
  go('/review/' + y);
  return true;
}
