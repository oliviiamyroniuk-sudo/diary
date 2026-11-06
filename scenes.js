'use strict';
/* Ілюстрації шапки, намальовані кодом: ліс, бібліотека, галявина, нічний пейзаж. */

function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const rr = (r, a, b) => a + (b - a) * r();

const Scene = {
  sky(c, w, h, colors) {
    const g = c.createLinearGradient(0, 0, 0, h);
    colors.forEach((col, i) => g.addColorStop(colors.length === 1 ? 0 : i / (colors.length - 1), col));
    c.fillStyle = g; c.fillRect(0, 0, w, h);
  },
  stars(c, w, h, count, seed, maxY = 0.65) {
    const r = rng(seed);
    for (let i = 0; i < count; i++) {
      const x = rr(r, 0, w), y = rr(r, 0, h * maxY), s = rr(r, 0.6, 1.8);
      c.globalAlpha = rr(r, 0.3, 0.9); c.fillStyle = '#fff';
      c.beginPath(); c.arc(x, y, s / 2, 0, Math.PI * 2); c.fill();
    }
    c.globalAlpha = 1;
  },
  moon(c, x, y, r, color) {
    for (let i = 4; i >= 1; i--) {
      c.globalAlpha = 0.07; c.fillStyle = color;
      c.beginPath(); c.arc(x, y, r * (1 + i * 0.6), 0, Math.PI * 2); c.fill();
    }
    c.globalAlpha = 1; c.fillStyle = color;
    c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
  },
  hill(c, w, h, baseY, amp, phase, waves) {
    c.beginPath(); c.moveTo(0, h);
    for (let i = 0; i <= 40; i++) { const x = (w * i) / 40; c.lineTo(x, baseY + Math.sin((x / w) * Math.PI * waves + phase) * amp); }
    c.lineTo(w, h); c.closePath();
  },
  pine(c, cx, base, w, h) {
    c.rect(cx - w * 0.05, base - h * 0.14, w * 0.1, h * 0.14);
    for (let t = 0; t < 3; t++) {
      const tb = base - h * 0.1 - t * h * 0.24, tw = w * (1 - t * 0.26), tt = tb - h * 0.44;
      c.moveTo(cx - tw / 2, tb); c.lineTo(cx, tt); c.lineTo(cx + tw / 2, tb); c.closePath();
    }
  },
  mushroom(c, x, y, s, cap) {
    c.fillStyle = '#E9DFC8'; c.fillRect(x - 3 * s, y - 10 * s, 6 * s, 10 * s);
    c.fillStyle = cap; c.beginPath(); c.arc(x, y - 9 * s, 9 * s, Math.PI, 0); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,255,255,.85)';
    [[-4, -13], [2, -15], [5, -11]].forEach(([dx, dy]) => { c.beginPath(); c.arc(x + dx * s, y + dy * s, 1.6 * s, 0, Math.PI * 2); c.fill(); });
  },
  cottage(c, x, y, s, wall, roof) {
    c.fillStyle = wall; c.fillRect(x - 22 * s, y - 26 * s, 44 * s, 26 * s);
    c.fillStyle = roof; c.beginPath(); c.moveTo(x - 28 * s, y - 24 * s); c.lineTo(x, y - 46 * s); c.lineTo(x + 28 * s, y - 24 * s); c.closePath(); c.fill();
    c.fillRect(x + 10 * s, y - 50 * s, 6 * s, 14 * s);
    c.fillStyle = 'rgba(255,210,122,.2)'; c.beginPath(); c.arc(x - 9 * s, y - 14 * s, 14 * s, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#FFD27A'; c.fillRect(x - 14 * s, y - 19 * s, 10 * s, 9 * s);
    c.fillStyle = roof; c.fillRect(x + 4 * s, y - 15 * s, 9 * s, 15 * s);
  },
  roundTree(c, x, y, s, color) {
    c.fillStyle = '#5A4632'; c.fillRect(x - 2 * s, y - 14 * s, 4 * s, 14 * s);
    c.fillStyle = color;
    [[0, -24, 12], [-8, -18, 9], [8, -18, 9]].forEach(([dx, dy, r]) => { c.beginPath(); c.arc(x + dx * s, y + dy * s, r * s, 0, Math.PI * 2); c.fill(); });
  },
  fog(c, w, y, color) {
    const g = c.createLinearGradient(0, y - 14, 0, y + 14);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.5, color); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.fillRect(0, y - 14, w, 28);
  },

  forest(c, w, h, t) {
    Scene.sky(c, w, h, t.sky);
    if (t.dark) Scene.stars(c, w, h, 60, 42);
    if (t.moon) Scene.moon(c, w * 0.78, h * 0.24, 18, t.moon);
    const r = rng(7), n = t.layers.length;
    t.layers.forEach((col, i) => {
      const p = i / Math.max(n - 1, 1), baseY = h * (0.62 + p * 0.26), th = h * (0.32 + p * 0.22);
      c.fillStyle = col; Scene.hill(c, w, h, baseY, 6, i * 1.7, 2); c.fill();
      c.beginPath();
      let x = rr(r, -30, 0);
      while (x < w + 30) {
        const tw = th * rr(r, 0.36, 0.5), tH = th * rr(r, 0.7, 1.1);
        if (r() > 0.12 || i === 0) Scene.pine(c, x, baseY + 4, tw, tH);
        x += tw * rr(r, 0.5, 0.9);
      }
      c.fill();
      if (i < n - 1) Scene.fog(c, w, baseY, t.dark ? 'rgba(255,255,255,.05)' : 'rgba(255,255,255,.14)');
    });
    if (t.mushrooms) { Scene.mushroom(c, w * 0.12, h - 6, 1.2, '#B5483E'); Scene.mushroom(c, w * 0.18, h - 4, 0.8, '#C25E3F'); Scene.mushroom(c, w * 0.86, h - 5, 1, '#A8423A'); }
    if (t.cottage) Scene.cottage(c, w * 0.3, h * 0.93, 0.9, '#3E3550', '#252036');
  },

  library(c, w, h, t) {
    Scene.sky(c, w, h, t.sky);
    const r = rng(21), rows = 3, sh = h / rows;
    for (let row = 0; row < rows; row++) {
      const baseY = (row + 1) * sh - 8;
      let x = 0;
      while (x < w) {
        if (r() < 0.06) { x += rr(r, 14, 30); continue; }
        const bw = rr(r, 7, 16), bh = rr(r, sh * 0.5, sh * 0.82);
        c.fillStyle = t.layers[Math.floor(r() * t.layers.length)];
        c.fillRect(x, baseY - bh, bw - 1.5, bh);
        c.fillStyle = 'rgba(216,181,106,.45)'; c.fillRect(x + 1, baseY - bh * 0.8, bw - 3.5, 1.5); c.fillRect(x + 1, baseY - bh * 0.25, bw - 3.5, 1.5);
        x += bw;
      }
      c.fillStyle = '#4A2E1C'; c.fillRect(0, baseY, w, 8);
    }
    const glow = (x, y, rad, col) => { const g = c.createRadialGradient(x, y, 0, x, y, rad); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(x - rad, y - rad, rad * 2, rad * 2); };
    glow(w * 0.22, h * 0.62, 170, 'rgba(255,200,116,.5)');
    glow(w * 0.8, h * 0.8, 90, 'rgba(255,180,94,.45)');
    c.font = '44px serif'; c.textAlign = 'center'; c.fillText('🪔', w * 0.22, h * 0.8);
    c.font = '26px serif'; c.fillText('🕯️', w * 0.8, h * 0.86);
    c.font = '22px serif'; c.fillText('☕️', w * 0.4, h * 0.92);
    c.font = '30px serif'; c.fillText('🐈', w * 0.62, h * 0.93);
  },

  meadow(c, w, h, t) {
    Scene.sky(c, w, h, t.sky);
    if (t.dark) Scene.stars(c, w, h, 45, 5, 0.5);
    if (t.moon) Scene.moon(c, w * 0.72, h * 0.3, t.dark ? 16 : 24, t.moon);
    const n = t.layers.length;
    t.layers.forEach((col, i) => {
      const p = i / Math.max(n - 1, 1), baseY = h * (0.6 + p * 0.22);
      c.fillStyle = col; Scene.hill(c, w, h, baseY, 12 - p * 4, i * 2.1, 1.6 + i * 0.4); c.fill();
      if (i === 0) { Scene.roundTree(c, w * 0.12, baseY + 4, 1.1, col); Scene.roundTree(c, w * 0.9, baseY + 2, 0.9, col); }
      if (i === 1 && (t.cottage || !t.dark)) Scene.cottage(c, w * 0.6, baseY + 6, 1, '#EADBC0', '#8B5E3C');
    });
    const r = rng(99), fc = ['#F2C6D6', '#FFF4D6', '#E7A9C0', '#F6D77A', '#C9B2E8'];
    for (let i = 0; i < 60; i++) {
      c.fillStyle = fc[Math.floor(r() * fc.length)];
      c.beginPath(); c.arc(rr(r, 0, w), rr(r, h * 0.86, h), rr(r, 1.5, 3.5), 0, Math.PI * 2); c.fill();
    }
  },

  night(c, w, h, t) {
    Scene.sky(c, w, h, t.sky);
    Scene.stars(c, w, h, 110, 13, 0.75);
    if (t.moon) {
      Scene.moon(c, w * 0.5, h * 0.32, 30, t.moon);
      c.fillStyle = t.sky[1]; c.globalAlpha = 0.93; c.beginPath(); c.arc(w * 0.5 + 8, h * 0.32 - 4, 30, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1;
    }
    const r = rng(31), n = t.layers.length;
    t.layers.forEach((col, i) => {
      const p = i / Math.max(n - 1, 1), baseY = h * (0.66 + p * 0.24), th = h * (0.34 + p * 0.24);
      c.fillStyle = col; Scene.hill(c, w, h, baseY, 5, i, 2.5); c.fill();
      c.beginPath();
      let x = -10;
      while (x < w + 20) { const tw = th * rr(r, 0.28, 0.4), tH = th * rr(r, 0.75, 1.15); Scene.pine(c, x, baseY + 4, tw, tH); x += tw * rr(r, 0.6, 1.3); }
      c.fill();
      Scene.fog(c, w, baseY, 'rgba(201,184,200,.09)');
    });
  },

  minimal(c, w, h, t) {
    Scene.sky(c, w, h, t.sky);
    c.strokeStyle = t.accent; c.globalAlpha = 0.25; c.lineWidth = 1;
    c.beginPath(); c.arc(w * 0.72, h * 0.42, 60, 0, Math.PI * 2); c.stroke();
    c.globalAlpha = 0.12; c.fillStyle = t.accent; c.beginPath(); c.arc(w * 0.72, h * 0.42, 30, 0, Math.PI * 2); c.fill();
    c.globalAlpha = 1;
  },

  particles(c, w, h, kind, time) {
    if (!kind) return;
    const r = rng(77);
    const count = kind === 'stars' ? 18 : kind === 'dust' ? 22 : 26;
    for (let i = 0; i < count; i++) {
      const bx = rr(r, 0, w), by = rr(r, 0, h), sp = rr(r, 0.3, 1), ph = rr(r, 0, Math.PI * 2), s = rr(r, 1.5, 3.2);
      if (kind === 'fireflies' || kind === 'dust') {
        const x = bx + Math.sin(time * 0.4 * sp + ph) * 14;
        const y = h * 0.35 + by * 0.65 + Math.cos(time * 0.3 * sp + ph) * 10;
        const gl = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(time * 2 * sp + ph));
        const col = kind === 'dust' ? '255,214,150' : '247,229,138';
        c.fillStyle = `rgba(${col},${0.12 * gl})`; c.beginPath(); c.arc(x, y, s * 3, 0, Math.PI * 2); c.fill();
        c.fillStyle = `rgba(255,243,176,${gl * (kind === 'dust' ? 0.5 : 1)})`; c.beginPath(); c.arc(x, y, s / 2, 0, Math.PI * 2); c.fill();
      } else if (kind === 'snow') {
        const y = (by + time * 18 * sp) % (h + 10) - 5, x = bx + Math.sin(time * 0.8 * sp + ph) * 8;
        c.fillStyle = 'rgba(255,255,255,.85)'; c.beginPath(); c.arc(x, y, s / 2, 0, Math.PI * 2); c.fill();
      } else if (kind === 'leaves' || kind === 'petals') {
        const y = (by + time * 12 * sp) % (h + 20) - 10, x = bx + Math.sin(time * 0.6 * sp + ph) * 16;
        const cols = kind === 'leaves' ? ['#D9822B', '#B5542C', '#E2B04A'] : ['#F4C7D3', '#FBE3EA', '#EBB4C6'];
        c.save(); c.translate(x, y); c.rotate(time * sp + ph); c.fillStyle = cols[i % 3];
        c.beginPath(); c.ellipse(0, 0, s * 1.6, s * 0.8, 0, 0, Math.PI * 2); c.fill(); c.restore();
      } else if (kind === 'stars') {
        const tw = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(time * 1.5 * sp + ph)), y = by * 0.6;
        c.fillStyle = `rgba(255,255,255,${tw})`;
        c.beginPath(); c.moveTo(bx, y - s * 2); c.lineTo(bx + s * 0.5, y); c.lineTo(bx, y + s * 2); c.lineTo(bx - s * 0.5, y); c.closePath(); c.fill();
      }
    }
  },
};

/** Малює сцену в canvas; повертає функцію зупинки анімації. */
function paintScene(canvas, theme, animate) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = canvas.clientWidth || canvas.parentElement.clientWidth || 360;
  const h = canvas.clientHeight || canvas.parentElement.clientHeight || 200;
  canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const base = document.createElement('canvas');
  base.width = canvas.width; base.height = canvas.height;
  const bctx = base.getContext('2d');
  bctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  (Scene[theme.scene] || Scene.minimal)(bctx, w, h, theme);
  let raf = 0, stopped = false;
  const frame = (ts) => {
    if (stopped) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(base, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    Scene.particles(ctx, w, h, theme.particles, (ts || 0) / 1000);
    if (animate && theme.particles && !document.hidden) raf = requestAnimationFrame(frame);
  };
  frame(0);
  return () => { stopped = true; cancelAnimationFrame(raf); };
}
