'use strict';
/* own journal — колекція казкових фонів: пори року, Mushroom Oasis, Halloween, цирк, медузи, феї, єдинороги, космос */

const Art = {
  glow(c, x, y, r, col) { const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); },
  sun(c, x, y, r, col) { Art.glow(c, x, y, r * 4, col.replace(')', ',.25)').replace('rgb', 'rgba')); c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); },
  cloud(c, x, y, s, col, a = 1) {
    c.globalAlpha = a; c.fillStyle = col;
    [[0, 0, 22], [24, -8, 26], [52, 0, 20], [28, 8, 22], [-18, 6, 16], [70, 8, 14]].forEach(([dx, dy, r]) => { c.beginPath(); c.arc(x + dx * s, y + dy * s, r * s, 0, Math.PI * 2); c.fill(); });
    c.globalAlpha = 1;
  },
  blossomTree(c, x, y, s, trunk, crown, dots) {
    c.fillStyle = trunk; c.beginPath(); c.moveTo(x - 4 * s, y); c.lineTo(x - 2 * s, y - 34 * s); c.lineTo(x + 2 * s, y - 34 * s); c.lineTo(x + 4 * s, y); c.fill();
    c.strokeStyle = trunk; c.lineWidth = 2.5 * s; c.beginPath(); c.moveTo(x, y - 24 * s); c.lineTo(x - 14 * s, y - 40 * s); c.moveTo(x, y - 28 * s); c.lineTo(x + 13 * s, y - 42 * s); c.stroke();
    c.fillStyle = crown;
    [[0, -50, 22], [-18, -42, 16], [18, -44, 17], [-8, -62, 15], [10, -60, 15]].forEach(([dx, dy, r]) => { c.beginPath(); c.arc(x + dx * s, y + dy * s, r * s, 0, Math.PI * 2); c.fill(); });
    const r = rng(Math.round(x * 7 + y));
    c.fillStyle = dots;
    for (let i = 0; i < 26; i++) { c.beginPath(); c.arc(x + (r() - 0.5) * 60 * s, y - 50 * s + (r() - 0.5) * 40 * s, (1 + r() * 1.6) * s, 0, Math.PI * 2); c.fill(); }
  },
  roundTree(c, x, y, s, trunk, cols) {
    c.fillStyle = trunk; c.fillRect(x - 3 * s, y - 26 * s, 6 * s, 26 * s);
    cols.forEach((col, i) => { c.fillStyle = col; c.beginPath(); c.arc(x + (i - 1) * 9 * s, y - (36 + (i % 2) * 8) * s, (15 - i * 2) * s, 0, Math.PI * 2); c.fill(); });
  },
  snowPine(c, x, base, w, h, col, snow) {
    c.fillStyle = col; c.beginPath(); Scene.pine(c, x, base, w, h); c.fill();
    c.fillStyle = snow;
    for (let t = 0; t < 3; t++) {
      const tb = base - h * 0.1 - t * h * 0.24, tw = w * (1 - t * 0.26), tt = tb - h * 0.44;
      c.beginPath(); c.moveTo(x, tt); c.lineTo(x - tw * 0.18, tt + h * 0.14); c.quadraticCurveTo(x, tt + h * 0.1, x + tw * 0.18, tt + h * 0.14); c.closePath(); c.fill();
    }
  },
  pumpkin(c, x, y, s, face) {
    c.fillStyle = '#E8792B'; c.strokeStyle = '#9C4416'; c.lineWidth = 1.5 * s;
    [-9, 0, 9].forEach((dx, i) => { c.beginPath(); c.ellipse(x + dx * s, y, (i === 1 ? 10 : 9) * s, 12 * s, 0, 0, Math.PI * 2); c.fill(); c.stroke(); });
    c.fillStyle = '#4F6B2A'; c.fillRect(x - 1.5 * s, y - 16 * s, 3 * s, 6 * s);
    if (face) {
      c.fillStyle = '#FFD45A'; Art.glow(c, x, y, 26 * s, 'rgba(255,190,80,.35)');
      c.fillStyle = '#FFD45A';
      c.beginPath(); c.moveTo(x - 8 * s, y - 3 * s); c.lineTo(x - 4 * s, y - 8 * s); c.lineTo(x - 2 * s, y - 2 * s); c.fill();
      c.beginPath(); c.moveTo(x + 8 * s, y - 3 * s); c.lineTo(x + 4 * s, y - 8 * s); c.lineTo(x + 2 * s, y - 2 * s); c.fill();
      c.beginPath(); c.moveTo(x - 8 * s, y + 3 * s); c.quadraticCurveTo(x, y + 12 * s, x + 8 * s, y + 3 * s); c.lineTo(x + 4 * s, y + 5 * s); c.lineTo(x, y + 3 * s); c.lineTo(x - 4 * s, y + 5 * s); c.fill();
    }
  },
  mushroomHouse(c, x, y, s, cap, stem) {
    c.fillStyle = stem; c.beginPath(); c.moveTo(x - 16 * s, y); c.quadraticCurveTo(x - 18 * s, y - 30 * s, x - 12 * s, y - 40 * s); c.lineTo(x + 12 * s, y - 40 * s); c.quadraticCurveTo(x + 18 * s, y - 30 * s, x + 16 * s, y); c.fill();
    Art.glow(c, x + 5 * s, y - 22 * s, 20 * s, 'rgba(255,214,120,.4)');
    c.fillStyle = '#FFD47A'; c.beginPath(); c.arc(x + 5 * s, y - 24 * s, 4.5 * s, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#6B4A30'; c.beginPath(); c.moveTo(x - 9 * s, y); c.lineTo(x - 9 * s, y - 12 * s); c.quadraticCurveTo(x - 4.5 * s, y - 18 * s, x, y - 12 * s); c.lineTo(x, y); c.fill();
    c.fillStyle = cap; c.beginPath(); c.moveTo(x - 32 * s, y - 36 * s); c.quadraticCurveTo(x - 30 * s, y - 76 * s, x, y - 78 * s); c.quadraticCurveTo(x + 30 * s, y - 76 * s, x + 32 * s, y - 36 * s); c.quadraticCurveTo(x, y - 30 * s, x - 32 * s, y - 36 * s); c.fill();
    c.fillStyle = 'rgba(255,245,230,.85)';
    [[-16, -56, 5], [6, -66, 6], [20, -50, 4], [-4, -46, 3]].forEach(([dx, dy, r]) => { c.beginPath(); c.ellipse(x + dx * s, y + dy * s, r * s, r * 0.75 * s, 0, 0, Math.PI * 2); c.fill(); });
  },
  smallMushroom(c, x, y, s, cap, glow) {
    if (glow) Art.glow(c, x, y - 6 * s, 14 * s, glow);
    c.fillStyle = '#EFE4CC'; c.fillRect(x - 1.6 * s, y - 7 * s, 3.2 * s, 7 * s);
    c.fillStyle = cap; c.beginPath(); c.arc(x, y - 7 * s, 6 * s, Math.PI, 0); c.closePath(); c.fill();
  },
  fern(c, x, y, s, col) {
    c.strokeStyle = col; c.lineWidth = 1.6 * s;
    for (let k = -2; k <= 2; k++) {
      c.beginPath(); c.moveTo(x, y); const ex = x + k * 9 * s, ey = y - (26 - Math.abs(k) * 4) * s; c.quadraticCurveTo(x + k * 3 * s, y - 16 * s, ex, ey); c.stroke();
      for (let i = 1; i < 6; i++) { const t = i / 6, px = x + (ex - x) * t, py = y + (ey - y) * t; c.beginPath(); c.moveTo(px, py); c.lineTo(px - 3 * s, py - 3 * s); c.moveTo(px, py); c.lineTo(px + 3 * s, py - 3 * s); c.stroke(); }
    }
  },
  ghost(c, x, y, s, a = 0.9) {
    c.globalAlpha = a; c.fillStyle = '#F6F3FF';
    c.beginPath(); c.moveTo(x - 10 * s, y + 10 * s); c.lineTo(x - 10 * s, y - 2 * s); c.arc(x, y - 2 * s, 10 * s, Math.PI, 0); c.lineTo(x + 10 * s, y + 10 * s);
    for (let i = 0; i < 4; i++) c.quadraticCurveTo(x + (7.5 - i * 5) * s, y + 6 * s, x + (5 - i * 5) * s, y + 10 * s);
    c.fill(); c.globalAlpha = 1;
    c.fillStyle = '#2B2238'; c.beginPath(); c.ellipse(x - 3.5 * s, y - 2 * s, 1.8 * s, 2.6 * s, 0, 0, Math.PI * 2); c.ellipse(x + 3.5 * s, y - 2 * s, 1.8 * s, 2.6 * s, 0, 0, Math.PI * 2); c.fill();
  },
  cat(c, x, y, s, col) {
    c.fillStyle = col;
    c.beginPath(); c.ellipse(x, y, 10 * s, 8 * s, 0, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(x + 8 * s, y - 9 * s, 6 * s, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.moveTo(x + 4 * s, y - 13 * s); c.lineTo(x + 5 * s, y - 19 * s); c.lineTo(x + 8 * s, y - 14 * s); c.moveTo(x + 9 * s, y - 14 * s); c.lineTo(x + 12 * s, y - 19 * s); c.lineTo(x + 13 * s, y - 12 * s); c.fill();
    c.strokeStyle = col; c.lineWidth = 3 * s; c.lineCap = 'round'; c.beginPath(); c.moveTo(x - 9 * s, y + 2 * s); c.quadraticCurveTo(x - 20 * s, y - 2 * s, x - 16 * s, y - 14 * s); c.stroke();
    c.fillStyle = '#F5D04A'; c.beginPath(); c.arc(x + 6 * s, y - 10 * s, 1.2 * s, 0, Math.PI * 2); c.arc(x + 10.5 * s, y - 10 * s, 1.2 * s, 0, Math.PI * 2); c.fill();
  },
  bat(c, x, y, s, col) {
    c.fillStyle = col; c.beginPath(); c.moveTo(x, y);
    c.quadraticCurveTo(x - 6 * s, y - 6 * s, x - 14 * s, y - 2 * s); c.quadraticCurveTo(x - 10 * s, y, x - 9 * s, y + 3 * s); c.quadraticCurveTo(x - 5 * s, y + 1 * s, x, y + 4 * s);
    c.quadraticCurveTo(x + 5 * s, y + 1 * s, x + 9 * s, y + 3 * s); c.quadraticCurveTo(x + 10 * s, y, x + 14 * s, y - 2 * s); c.quadraticCurveTo(x + 6 * s, y - 6 * s, x, y); c.fill();
  },
  bulbs(c, x1, y1, x2, y2, sag, cols, n) {
    c.strokeStyle = 'rgba(40,30,30,.7)'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(x1, y1); c.quadraticCurveTo((x1 + x2) / 2, Math.max(y1, y2) + sag, x2, y2); c.stroke();
    for (let i = 1; i < n; i++) {
      const t = i / n, x = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * ((x1 + x2) / 2) + t * t * x2;
      const y = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * (Math.max(y1, y2) + sag) + t * t * y2;
      const col = cols[i % cols.length];
      Art.glow(c, x, y + 3, 9, col.replace('rgb', 'rgba').replace(')', ',.45)'));
      c.fillStyle = col; c.beginPath(); c.arc(x, y + 3, 2.6, 0, Math.PI * 2); c.fill();
    }
  },
  butterfly(c, x, y, s, col, flap = 1) {
    c.fillStyle = col;
    c.beginPath(); c.ellipse(x - 4 * s * flap, y - 2 * s, 4 * s * flap, 5 * s, -0.4, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.ellipse(x + 4 * s * flap, y - 2 * s, 4 * s * flap, 5 * s, 0.4, 0, Math.PI * 2); c.fill();
    c.globalAlpha = 0.8; c.beginPath(); c.ellipse(x - 3 * s * flap, y + 3 * s, 3 * s * flap, 3.5 * s, 0.4, 0, Math.PI * 2); c.ellipse(x + 3 * s * flap, y + 3 * s, 3 * s * flap, 3.5 * s, -0.4, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1;
    c.fillStyle = '#4a3a3a'; c.fillRect(x - 0.6 * s, y - 5 * s, 1.2 * s, 10 * s);
  },
  jelly(c, x, y, s, col, t) {
    Art.glow(c, x, y, 30 * s, col.replace('rgb', 'rgba').replace(')', ',.35)'));
    const pulse = 1 + Math.sin(t * 2) * 0.06;
    c.fillStyle = col.replace('rgb', 'rgba').replace(')', ',.75)');
    c.beginPath(); c.ellipse(x, y, 14 * s * pulse, 11 * s / pulse, 0, Math.PI, 0); c.quadraticCurveTo(x + 10 * s, y + 3 * s, x, y + 2 * s); c.quadraticCurveTo(x - 10 * s, y + 3 * s, x - 14 * s * pulse, y); c.fill();
    c.fillStyle = 'rgba(255,255,255,.45)'; c.beginPath(); c.ellipse(x - 4 * s, y - 6 * s, 4 * s, 2.4 * s, -0.4, 0, Math.PI * 2); c.fill();
    c.strokeStyle = col.replace('rgb', 'rgba').replace(')', ',.6)'); c.lineWidth = 1.4 * s;
    for (let k = -2; k <= 2; k++) {
      c.beginPath(); c.moveTo(x + k * 5 * s, y + 1 * s);
      for (let j = 1; j <= 6; j++) c.lineTo(x + k * 5 * s + Math.sin(t * 2 + j + k) * 3 * s, y + j * 6 * s);
      c.stroke();
    }
  },
  fairy(c, x, y, s, wing, t) {
    const f = 0.7 + Math.abs(Math.sin(t * 6)) * 0.4;
    Art.glow(c, x, y, 22 * s, 'rgba(255,240,180,.45)');
    c.fillStyle = wing; c.globalAlpha = 0.75;
    c.beginPath(); c.ellipse(x - 6 * s, y - 4 * s, 7 * s * f, 4 * s, -0.6, 0, Math.PI * 2); c.ellipse(x + 6 * s, y - 4 * s, 7 * s * f, 4 * s, 0.6, 0, Math.PI * 2); c.fill();
    c.globalAlpha = 1; c.fillStyle = '#FFF6DA'; c.beginPath(); c.arc(x, y - 6 * s, 2.4 * s, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#F7E3F0'; c.beginPath(); c.moveTo(x, y - 4 * s); c.lineTo(x - 3 * s, y + 5 * s); c.lineTo(x + 3 * s, y + 5 * s); c.fill();
  },
  unicorn(c, x, y, s) {
    c.fillStyle = '#FFF8FC'; c.strokeStyle = '#C9A6D6'; c.lineWidth = 1.6 * s;
    c.beginPath(); c.ellipse(x, y, 22 * s, 13 * s, 0, 0, Math.PI * 2); c.fill(); c.stroke();
    [[-14, 10], [-6, 12], [8, 12], [16, 10]].forEach(([dx]) => { c.fillRect(x + dx * s - 2.5 * s, y + 6 * s, 5 * s, 15 * s); c.strokeRect(x + dx * s - 2.5 * s, y + 6 * s, 5 * s, 15 * s); });
    c.beginPath(); c.moveTo(x + 14 * s, y - 6 * s); c.quadraticCurveTo(x + 20 * s, y - 24 * s, x + 26 * s, y - 26 * s); c.lineTo(x + 34 * s, y - 18 * s); c.quadraticCurveTo(x + 28 * s, y - 10 * s, x + 22 * s, y - 2 * s); c.fill(); c.stroke();
    c.beginPath(); c.ellipse(x + 30 * s, y - 22 * s, 8 * s, 6 * s, 0.5, 0, Math.PI * 2); c.fill(); c.stroke();
    c.fillStyle = '#F6CD5A'; c.beginPath(); c.moveTo(x + 27 * s, y - 28 * s); c.lineTo(x + 30 * s, y - 44 * s); c.lineTo(x + 32 * s, y - 27 * s); c.fill();
    ['#F7A8C4', '#C9B2F2', '#9FD8F0', '#FFE08A'].forEach((col, i) => {
      c.strokeStyle = col; c.lineWidth = 3.4 * s; c.lineCap = 'round';
      c.beginPath(); c.moveTo(x + (24 - i * 2) * s, y - (26 - i * 4) * s); c.quadraticCurveTo(x + (14 - i * 3) * s, y - (16 - i * 4) * s, x + (12 - i * 2) * s, y - (4 - i * 3) * s); c.stroke();
      c.beginPath(); c.moveTo(x - 21 * s, y - (4 - i * 2) * s); c.quadraticCurveTo(x - 30 * s, y + (2 + i * 3) * s, x - 26 * s, y + (14 + i * 2) * s); c.stroke();
    });
    c.fillStyle = '#3b2b3b'; c.beginPath(); c.arc(x + 31 * s, y - 23 * s, 1.3 * s, 0, Math.PI * 2); c.fill();
  },
  planet(c, x, y, r, col1, col2, ring) {
    const g = c.createRadialGradient(x - r * 0.4, y - r * 0.4, r * 0.1, x, y, r); g.addColorStop(0, col1); g.addColorStop(1, col2);
    if (ring) { c.strokeStyle = ring; c.lineWidth = r * 0.18; c.beginPath(); c.ellipse(x, y, r * 1.8, r * 0.45, -0.3, Math.PI, Math.PI * 2); c.stroke(); }
    c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
    if (ring) { c.beginPath(); c.ellipse(x, y, r * 1.8, r * 0.45, -0.3, 0, Math.PI); c.stroke(); }
  },
  frost(c, w, h) {
    c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 1;
    const branch = (x, y, a, len, d) => {
      if (d > 4 || len < 3) return;
      const x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len;
      c.beginPath(); c.moveTo(x, y); c.lineTo(x2, y2); c.stroke();
      branch(x2, y2, a - 0.6, len * 0.6, d + 1); branch(x2, y2, a + 0.6, len * 0.6, d + 1); branch(x2, y2, a, len * 0.7, d + 1);
    };
    branch(0, 0, 0.8, 34, 0); branch(w, 0, Math.PI - 0.8, 34, 0);
  },
};

Object.assign(Scene, {
  springBloom(c, w, h, t) {
    Scene.sky(c, w, h, t.sky);
    Art.sun(c, w * 0.8, h * 0.22, 20, 'rgb(255,244,214)');
    Art.cloud(c, w * 0.1, h * 0.2, 0.8, '#fff', 0.7); Art.cloud(c, w * 0.55, h * 0.12, 0.6, '#fff', 0.6);
    t.layers.forEach((col, i) => { c.fillStyle = col; Scene.hill(c, w, h, h * (0.66 + i * 0.1), 10, i * 1.9, 1.4 + i * 0.5); c.fill(); });
    Art.blossomTree(c, w * 0.18, h * 0.8, 1.15, '#8C6A5A', '#F6C3D4', '#FFFFFF');
    Art.blossomTree(c, w * 0.78, h * 0.76, 0.95, '#8C6A5A', '#F2B2C8', '#FFF0F6');
    Art.blossomTree(c, w * 0.5, h * 0.7, 0.6, '#9C7A6A', '#F9D3E0', '#FFFFFF');
    for (let i = 0; i < 3; i++) Scene.fog(c, w, h * (0.62 + i * 0.1), 'rgba(255,255,255,.35)');
    const r = rng(4), fc = ['#F7C6D8', '#FFF6D6', '#D9C5F2', '#F9E28C'];
    for (let i = 0; i < 70; i++) { c.fillStyle = fc[i % 4]; c.beginPath(); c.arc(r() * w, h * 0.88 + r() * h * 0.12, 1.5 + r() * 2, 0, Math.PI * 2); c.fill(); }
  },
  summerMeadow(c, w, h, t) {
    Scene.sky(c, w, h, t.sky);
    Art.sun(c, w * 0.22, h * 0.25, 22, 'rgb(255,236,170)');
    Art.cloud(c, w * 0.6, h * 0.18, 0.9, '#fff', 0.85); Art.cloud(c, w * 0.05, h * 0.38, 0.5, '#fff', 0.6);
    t.layers.forEach((col, i) => { c.fillStyle = col; Scene.hill(c, w, h, h * (0.6 + i * 0.12), 12 - i * 3, i * 2.3, 1.2 + i * 0.6); c.fill(); });
    Art.roundTree(c, w * 0.85, h * 0.7, 1.1, '#6B4A30', ['#5E8F46', '#6FA052', '#4E7E3A']);
    // ягідні кущі
    [[0.1, 0.86], [0.42, 0.9], [0.66, 0.88]].forEach(([fx, fy]) => {
      c.fillStyle = '#4E7E3A'; c.beginPath(); c.arc(w * fx, h * fy, 14, 0, Math.PI * 2); c.arc(w * fx + 14, h * fy + 2, 11, 0, Math.PI * 2); c.fill();
      const r = rng(Math.round(fx * 100)); c.fillStyle = '#D9364A';
      for (let i = 0; i < 9; i++) { c.beginPath(); c.arc(w * fx - 8 + r() * 28, h * fy - 6 + r() * 12, 2.2, 0, Math.PI * 2); c.fill(); }
    });
    const r = rng(8), fc = ['#FFFFFF', '#F9E07A', '#F4A6C0', '#B9A6F2', '#FF9F6B'];
    for (let i = 0; i < 90; i++) { c.fillStyle = fc[i % 5]; c.beginPath(); c.arc(r() * w, h * 0.8 + r() * h * 0.2, 1.4 + r() * 2.2, 0, Math.PI * 2); c.fill(); }
  },
  autumnPath(c, w, h, t) {
    Scene.sky(c, w, h, t.sky);
    if (t.moon) Scene.moon(c, w * 0.8, h * 0.2, 16, t.moon);
    t.layers.forEach((col, i) => { c.fillStyle = col; Scene.hill(c, w, h, h * (0.58 + i * 0.12), 8, i * 1.4, 2); c.fill(); });
    const r = rng(12), tc = ['#D9822B', '#C2552C', '#E8A23A', '#B5442C', '#E0B04A'];
    for (let i = 0; i < 9; i++) Art.roundTree(c, w * (i / 8) + (r() - 0.5) * 20, h * (0.66 + r() * 0.06), 0.8 + r() * 0.5, '#5A3A22', [tc[i % 5], tc[(i + 2) % 5], tc[(i + 3) % 5]]);
    // стежка
    c.fillStyle = 'rgba(214,170,110,.85)'; c.beginPath(); c.moveTo(w * 0.42, h); c.quadraticCurveTo(w * 0.5, h * 0.84, w * 0.47, h * 0.72); c.lineTo(w * 0.53, h * 0.72); c.quadraticCurveTo(w * 0.62, h * 0.86, w * 0.68, h); c.fill();
    Scene.cottage(c, w * 0.5, h * 0.72, 0.75, '#7A5236', '#4A2E1C');
    Art.pumpkin(c, w * 0.22, h * 0.94, 1, false); Art.pumpkin(c, w * 0.3, h * 0.96, 0.7, false); Art.pumpkin(c, w * 0.8, h * 0.93, 0.9, false);
    Scene.mushroom(c, w * 0.9, h - 4, 1, '#B5483E'); Scene.mushroom(c, w * 0.12, h - 3, 0.8, '#C25E3F');
  },
  winterVillage(c, w, h, t) {
    Scene.sky(c, w, h, t.sky);
    if (t.dark) Scene.stars(c, w, h, 60, 21, 0.5);
    if (t.moon) Scene.moon(c, w * 0.8, h * 0.2, 16, t.moon);
    const r = rng(17);
    t.layers.forEach((col, i) => {
      const baseY = h * (0.62 + i * 0.12);
      c.fillStyle = i === t.layers.length - 1 ? '#F4F8FC' : col; Scene.hill(c, w, h, baseY, 6, i, 2); c.fill();
      if (i < t.layers.length - 1) { let x = -10; while (x < w + 20) { const tw = 24 + r() * 14 + i * 8, th = 50 + r() * 30 + i * 20; Art.snowPine(c, x, baseY + 4, tw, th, col, '#F4F8FC'); x += tw * (0.7 + r() * 0.5); } }
    });
    Scene.cottage(c, w * 0.36, h * 0.9, 1.05, '#8B5A44', '#5A3226');
    c.fillStyle = '#F4F8FC'; c.beginPath(); c.moveTo(w * 0.36 - 30, h * 0.9 - 24); c.lineTo(w * 0.36, h * 0.9 - 47); c.lineTo(w * 0.36 + 30, h * 0.9 - 24); c.lineTo(w * 0.36 + 24, h * 0.9 - 28); c.lineTo(w * 0.36, h * 0.9 - 42); c.lineTo(w * 0.36 - 24, h * 0.9 - 28); c.fill();
    Art.bulbs(c, w * 0.36 - 26, h * 0.9 - 24, w * 0.36 + 26, h * 0.9 - 24, 6, ['rgb(255,120,120)', 'rgb(255,214,110)', 'rgb(140,220,150)', 'rgb(130,190,255)'], 9);
    Scene.cottage(c, w * 0.72, h * 0.86, 0.7, '#9A6A52', '#5A3226');
    Art.frost(c, w, h);
  },
  mushroomOasis(c, w, h, t) {
    Scene.sky(c, w, h, t.sky);
    Scene.stars(c, w, h, 40, 33, 0.45);
    t.layers.forEach((col, i) => { c.fillStyle = col; Scene.hill(c, w, h, h * (0.66 + i * 0.12), 9, i * 2, 1.6); c.fill(); });
    Art.mushroomHouse(c, w * 0.28, h * 0.86, 1.25, '#C8473B', '#F1E4CC');
    Art.mushroomHouse(c, w * 0.72, h * 0.82, 0.85, '#8E6BBF', '#EEE0F2');
    Art.mushroomHouse(c, w * 0.55, h * 0.74, 0.5, '#D98E3A', '#F1E4CC');
    Art.fern(c, w * 0.06, h, 1.3, '#4E7A55'); Art.fern(c, w * 0.94, h, 1.2, '#4E7A55'); Art.fern(c, w * 0.48, h, 0.9, '#5E8A60');
    const r = rng(5), caps = ['#7FE0D0', '#B9A6FF', '#FFB0D0'];
    for (let i = 0; i < 14; i++) { const cap = caps[i % 3]; Art.smallMushroom(c, r() * w, h * 0.9 + r() * h * 0.1, 0.8 + r() * 0.6, cap, 'rgba(170,255,230,.35)'); }
  },
  halloween(c, w, h, t) {
    Scene.sky(c, w, h, t.sky);
    Scene.stars(c, w, h, 50, 66, 0.6);
    Art.glow(c, w * 0.62, h * 0.32, 120, 'rgba(255,170,80,.25)');
    c.fillStyle = '#F7C873'; c.beginPath(); c.arc(w * 0.62, h * 0.32, 42, 0, Math.PI * 2); c.fill();
    // будинок із привидами
    const hx = w * 0.62, hy = h * 0.78;
    c.fillStyle = '#1A1220';
    c.fillRect(hx - 34, hy - 50, 68, 50); c.fillRect(hx - 12, hy - 78, 24, 30);
    c.beginPath(); c.moveTo(hx - 40, hy - 50); c.lineTo(hx, hy - 76); c.lineTo(hx + 40, hy - 50); c.fill();
    c.beginPath(); c.moveTo(hx - 16, hy - 78); c.lineTo(hx, hy - 100); c.lineTo(hx + 16, hy - 78); c.fill();
    c.fillStyle = '#FFC86B'; [[-22, -36], [12, -36], [-4, -66]].forEach(([dx, dy]) => c.fillRect(hx + dx, hy + dy, 9, 11));
    // голі дерева
    const bare = (x, y, s) => { c.strokeStyle = '#140E18'; c.lineCap = 'round'; const br = (x0, y0, a, l, wd) => { if (l < 6) return; const x1 = x0 + Math.cos(a) * l, y1 = y0 + Math.sin(a) * l; c.lineWidth = wd; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); br(x1, y1, a - 0.5, l * 0.7, wd * 0.7); br(x1, y1, a + 0.4, l * 0.65, wd * 0.7); }; br(x, y, -Math.PI / 2, 40 * s, 6 * s); };
    bare(w * 0.12, h * 0.92, 1.3); bare(w * 0.92, h * 0.9, 1);
    t.layers.forEach((col, i) => { c.fillStyle = col; Scene.hill(c, w, h, h * (0.8 + i * 0.08), 5, i, 2.2); c.fill(); });
    Art.pumpkin(c, w * 0.3, h * 0.93, 1.1, true); Art.pumpkin(c, w * 0.42, h * 0.95, 0.75, true); Art.pumpkin(c, w * 0.85, h * 0.95, 0.8, true);
    Art.cat(c, w * 0.18, h * 0.84, 1, '#0D0A10');
    Art.bat(c, w * 0.3, h * 0.22, 1, '#120D16'); Art.bat(c, w * 0.42, h * 0.15, 0.7, '#120D16'); Art.bat(c, w * 0.85, h * 0.25, 0.8, '#120D16');
    Scene.fog(c, w, h * 0.86, 'rgba(200,180,220,.12)');
  },
  circus(c, w, h, t) {
    Scene.sky(c, w, h, t.sky);
    Scene.stars(c, w, h, 50, 9, 0.5);
    // намет
    const tx = w * 0.5, ty = h * 0.92, tw = 170, th = 120;
    const stripes = 10;
    for (let i = 0; i < stripes; i++) {
      c.fillStyle = i % 2 ? '#F3E6D0' : '#C33B3B';
      c.beginPath(); c.moveTo(tx, ty - th); c.lineTo(tx - tw / 2 + (tw / stripes) * i, ty - th * 0.45); c.lineTo(tx - tw / 2 + (tw / stripes) * (i + 1), ty - th * 0.45); c.fill();
      c.fillRect(tx - tw / 2 + (tw / stripes) * i, ty - th * 0.45, tw / stripes + 0.5, th * 0.45);
    }
    c.fillStyle = '#8A2222'; c.beginPath(); c.moveTo(tx - 16, ty); c.lineTo(tx - 16, ty - 34); c.quadraticCurveTo(tx, ty - 46, tx + 16, ty - 34); c.lineTo(tx + 16, ty); c.fill();
    Art.glow(c, tx, ty - 18, 40, 'rgba(255,200,110,.35)');
    c.fillStyle = '#E8B84A'; c.beginPath(); c.moveTo(tx, ty - th - 18); c.lineTo(tx + 16, ty - th - 12); c.lineTo(tx, ty - th - 6); c.fill(); c.fillRect(tx - 1, ty - th - 18, 2, 18);
    // каруселі
    const cx = w * 0.15, cy = h * 0.92;
    c.fillStyle = '#E8B84A'; c.beginPath(); c.moveTo(cx - 34, cy - 50); c.lineTo(cx, cy - 72); c.lineTo(cx + 34, cy - 50); c.fill();
    c.fillStyle = '#F3E6D0'; c.fillRect(cx - 34, cy - 52, 68, 6); c.fillStyle = '#C9B48A'; c.fillRect(cx - 30, cy - 6, 60, 6);
    [-22, -6, 10, 24].forEach((dx, i) => { c.fillStyle = '#D8C28A'; c.fillRect(cx + dx, cy - 46, 2, 40); c.fillStyle = ['#F3E6D0', '#B9A6F2', '#F7B2C4', '#9FD8F0'][i]; c.beginPath(); c.ellipse(cx + dx + 1, cy - 24 + (i % 2) * 6, 7, 4.5, 0, 0, Math.PI * 2); c.fill(); });
    // гірлянди
    Art.bulbs(c, 0, h * 0.18, w * 0.5, h * 0.12, 30, ['rgb(255,214,110)', 'rgb(255,160,120)'], 12);
    Art.bulbs(c, w * 0.5, h * 0.12, w, h * 0.2, 30, ['rgb(255,214,110)', 'rgb(255,160,120)'], 12);
    t.layers.forEach((col, i) => { c.fillStyle = col; Scene.hill(c, w, h, h * (0.92 + i * 0.04), 2, 0, 1); c.fill(); });
    // театральні куліси
    const curtain = (x, dir) => { const g = c.createLinearGradient(x, 0, x + dir * 50, 0); g.addColorStop(0, '#6E1616'); g.addColorStop(1, '#A82A2A'); c.fillStyle = g; c.beginPath(); c.moveTo(x, 0); c.lineTo(x + dir * 54, 0); c.quadraticCurveTo(x + dir * 20, h * 0.4, x + dir * 36, h * 0.7); c.lineTo(x, h * 0.75); c.fill(); };
    curtain(0, 1); curtain(w, -1);
    c.fillStyle = '#8A1E1E'; for (let i = 0; i < w; i += 30) { c.beginPath(); c.arc(i + 15, 0, 18, 0, Math.PI); c.fill(); }
  },
  jellyfish(c, w, h, t) {
    Scene.sky(c, w, h, t.sky);
    c.save(); c.globalAlpha = 0.12; c.fillStyle = '#E8F6FF';
    for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(w * (0.1 + i * 0.2), 0); c.lineTo(w * (0.18 + i * 0.2), 0); c.lineTo(w * (0.3 + i * 0.2), h); c.lineTo(w * (0.15 + i * 0.2), h); c.fill(); }
    c.restore();
    const sea = (x, col, hh) => { c.strokeStyle = col; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.moveTo(x, h); for (let j = 1; j < 8; j++) c.lineTo(x + Math.sin(j) * 6, h - j * hh / 8); c.stroke(); };
    [0.05, 0.1, 0.88, 0.94, 0.6].forEach((fx, i) => sea(w * fx, i % 2 ? '#3E6F8E' : '#5A4E9C', 50 + i * 12));
    t.layers.forEach((col, i) => { c.fillStyle = col; Scene.hill(c, w, h, h * (0.88 + i * 0.05), 5, i, 2); c.fill(); });
  },
  fairyGlade(c, w, h, t) {
    Scene.sky(c, w, h, t.sky);
    c.save(); c.globalAlpha = 0.18; c.fillStyle = '#FFF3C8';
    for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(w * (0.2 + i * 0.2), 0); c.lineTo(w * (0.28 + i * 0.2), 0); c.lineTo(w * (0.4 + i * 0.18), h); c.lineTo(w * (0.22 + i * 0.18), h); c.fill(); }
    c.restore();
    const r = rng(41);
    t.layers.forEach((col, i) => {
      const baseY = h * (0.6 + i * 0.13);
      c.fillStyle = col; Scene.hill(c, w, h, baseY, 9, i * 2.4, 1.5); c.fill();
      if (i === 0) for (let k = 0; k < 6; k++) Art.roundTree(c, w * (k / 5), baseY + 4, 0.9 + r() * 0.4, '#4A3A2A', [col, '#5E7E5A', '#6F8F5E']);
    });
    const fc = ['#F7C6E0', '#FFF6C8', '#C8B6FF', '#FFD0A8', '#BFF0D8'];
    for (let i = 0; i < 40; i++) {
      const x = r() * w, y = h * 0.84 + r() * h * 0.16, col = fc[i % 5];
      c.strokeStyle = '#5E8A60'; c.lineWidth = 1; c.beginPath(); c.moveTo(x, y + 8); c.lineTo(x, y); c.stroke();
      c.fillStyle = col; for (let p = 0; p < 5; p++) { const a = (p / 5) * Math.PI * 2; c.beginPath(); c.arc(x + Math.cos(a) * 2.6, y + Math.sin(a) * 2.6, 2, 0, Math.PI * 2); c.fill(); }
      c.fillStyle = '#FFE38A'; c.beginPath(); c.arc(x, y, 1.4, 0, Math.PI * 2); c.fill();
    }
  },
  unicornSky(c, w, h, t) {
    Scene.sky(c, w, h, t.sky);
    Scene.stars(c, w, h, 40, 77, 0.6);
    ['#F7A8C4', '#FFC9A0', '#FFE89A', '#BDECC4', '#A8D8F5', '#C9B2F2'].forEach((col, i) => {
      c.strokeStyle = col; c.globalAlpha = 0.65; c.lineWidth = 7; c.beginPath(); c.arc(w * 0.5, h * 0.95, w * 0.5 - i * 7, Math.PI, 0); c.stroke();
    });
    c.globalAlpha = 1;
    Art.cloud(c, w * 0.06, h * 0.86, 1.3, '#FFF6FB'); Art.cloud(c, w * 0.62, h * 0.9, 1.4, '#FBEFFF'); Art.cloud(c, w * 0.3, h * 0.97, 1.6, '#FFFFFF');
    Art.cloud(c, w * 0.12, h * 0.3, 0.6, '#FFFFFF', 0.8); Art.cloud(c, w * 0.72, h * 0.22, 0.5, '#FFFFFF', 0.7);
    Art.unicorn(c, w * 0.5, h * 0.72, 1.1);
  },
  space(c, w, h, t) {
    Scene.sky(c, w, h, t.sky);
    Art.glow(c, w * 0.3, h * 0.4, 160, 'rgba(160,90,200,.28)');
    Art.glow(c, w * 0.75, h * 0.6, 140, 'rgba(240,120,170,.18)');
    Art.glow(c, w * 0.55, h * 0.2, 120, 'rgba(90,140,230,.2)');
    Scene.stars(c, w, h, 170, 55, 1);
    // сузіря
    const pts = [[0.12, 0.2], [0.2, 0.14], [0.28, 0.22], [0.36, 0.16], [0.42, 0.3]];
    c.strokeStyle = 'rgba(220,230,255,.45)'; c.lineWidth = 1; c.beginPath();
    pts.forEach(([x, y], i) => (i ? c.lineTo(w * x, h * y) : c.moveTo(w * x, h * y))); c.stroke();
    c.fillStyle = '#fff'; pts.forEach(([x, y]) => { c.beginPath(); c.arc(w * x, h * y, 2.2, 0, Math.PI * 2); c.fill(); });
    Art.planet(c, w * 0.78, h * 0.32, 26, '#F6C7A0', '#B0607A', 'rgba(240,210,170,.7)');
    Art.planet(c, w * 0.2, h * 0.75, 14, '#9FD8F0', '#3E5C9C');
    Art.planet(c, w * 0.6, h * 0.82, 8, '#E0D0FF', '#7A5ABF');
    Scene.moon(c, w * 0.45, h * 0.5, 13, '#F4EEDC');
    c.fillStyle = t.sky[0]; c.beginPath(); c.arc(w * 0.45 + 6, h * 0.5 - 4, 12, 0, Math.PI * 2); c.fill();
  },
  forestGlade(c, w, h, t) {
    Scene.forest(c, w, h, t);
    // маленькі лісові створіння: їжачок і зайчик
    const hx = w * 0.7, hy = h - 10;
    c.fillStyle = '#6B4A35'; c.beginPath(); c.ellipse(hx, hy, 13, 8, 0, Math.PI, 0); c.fill();
    c.strokeStyle = '#4A3222'; c.lineWidth = 1.4; for (let i = 0; i < 9; i++) { const a = Math.PI + (i / 8) * Math.PI; c.beginPath(); c.moveTo(hx + Math.cos(a) * 9, hy + Math.sin(a) * 5); c.lineTo(hx + Math.cos(a) * 15, hy + Math.sin(a) * 10); c.stroke(); }
    c.fillStyle = '#C9A27A'; c.beginPath(); c.ellipse(hx + 13, hy - 2, 5, 3.5, 0.3, 0, Math.PI * 2); c.fill();
    const bx = w * 0.3, by = h - 8; c.fillStyle = '#D9CCBC';
    c.beginPath(); c.ellipse(bx, by - 6, 9, 7, 0, 0, Math.PI * 2); c.fill(); c.beginPath(); c.arc(bx + 8, by - 13, 5, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.ellipse(bx + 7, by - 22, 1.8, 6, -0.2, 0, Math.PI * 2); c.ellipse(bx + 10, by - 22, 1.8, 6, 0.2, 0, Math.PI * 2); c.fill();
  },
});

/* Анімовані частинки нових сцен */
const _baseParticles = Scene.particles;
Scene.particles = (c, w, h, kind, time) => {
  if (kind === 'jelly') {
    const cols = ['rgb(190,150,255)', 'rgb(140,220,255)', 'rgb(255,170,230)', 'rgb(150,255,230)'];
    const r = rng(19);
    for (let i = 0; i < 6; i++) {
      const bx = r() * w, by = r() * h * 0.8, sp = 0.3 + r() * 0.5;
      const y = ((by - time * 10 * sp) % (h + 60) + h + 60) % (h + 60) - 30;
      Art.jelly(c, bx + Math.sin(time * 0.5 + i) * 10, y, 0.7 + r() * 0.7, cols[i % 4], time + i);
    }
    for (let i = 0; i < 18; i++) { const bx = r() * w, sp = 0.4 + r(); const y = ((r() * h - time * 25 * sp) % h + h) % h; c.strokeStyle = 'rgba(220,240,255,.5)'; c.lineWidth = 1; c.beginPath(); c.arc(bx + Math.sin(time + i) * 4, y, 1.5 + r() * 2.5, 0, Math.PI * 2); c.stroke(); }
    return;
  }
  if (kind === 'fairies') {
    const r = rng(23);
    for (let i = 0; i < 4; i++) { const bx = r() * w, by = h * (0.2 + r() * 0.5); Art.fairy(c, bx + Math.sin(time * 0.6 + i) * 30, by + Math.cos(time * 0.8 + i * 2) * 14, 0.9 + r() * 0.4, ['#BDE8FF', '#FFD0F0', '#E8D8FF', '#C8FFE0'][i], time + i); }
    _baseParticles(c, w, h, 'fireflies', time);
    return;
  }
  if (kind === 'butterflies') {
    const r = rng(29);
    for (let i = 0; i < 5; i++) { const bx = r() * w, by = h * (0.3 + r() * 0.5); Art.butterfly(c, bx + Math.sin(time * 0.5 + i) * 26, by + Math.sin(time * 1.3 + i) * 12, 1 + r() * 0.5, ['#F7B2C4', '#FFE08A', '#C9B2F2', '#9FD8F0', '#FFC9A0'][i], 0.4 + Math.abs(Math.sin(time * 7 + i)) * 0.6); }
    _baseParticles(c, w, h, 'petals', time);
    return;
  }
  if (kind === 'ghosts') {
    const r = rng(31);
    for (let i = 0; i < 3; i++) { const bx = r() * w, by = h * (0.25 + r() * 0.35); Art.ghost(c, bx + Math.sin(time * 0.4 + i * 2) * 24, by + Math.sin(time * 1.1 + i) * 8, 0.9 + r() * 0.4, 0.55 + 0.3 * Math.sin(time + i)); }
    return;
  }
  if (kind === 'confetti') {
    const r = rng(37), cols = ['#F7B2C4', '#FFE08A', '#9FD8F0', '#C9B2F2', '#F3E6D0'];
    for (let i = 0; i < 26; i++) { const bx = r() * w, by = r() * h, sp = 0.3 + r() * 0.8; const y = (by + time * 16 * sp) % (h + 10) - 5; c.save(); c.translate(bx + Math.sin(time + i) * 10, y); c.rotate(time * 2 * sp + i); c.fillStyle = cols[i % 5]; c.fillRect(-2.5, -1.5, 5, 3); c.restore(); }
    return;
  }
  if (kind === 'twinkle') {
    _baseParticles(c, w, h, 'stars', time);
    const r = rng(43);
    const sx = ((time * 40) % (w * 3)) - w;
    if (sx > 0 && sx < w) { c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(sx, h * 0.12 + sx * 0.12); c.lineTo(sx - 40, h * 0.12 + (sx - 40) * 0.12 - 4); c.stroke(); }
    return;
  }
  _baseParticles(c, w, h, kind, time);
};

/* Нові теми з категоріями */
const T = (o) => Object.assign({ decor: [], orn: '· ✦ ·', corner: '' }, o);
THEMES.push(
  T({ id: 'springBloom', cat: 'season', name: 'Spring in bloom', sub: 'Sakura, butterflies, morning mist', dark: false,
    bgTop: '#F6ECEF', bgBottom: '#EEE3EA', card: '#FFFBFC', border: '#E8CFD8', accent: '#C9708E', text: '#3E2E34', subc: '#87707A',
    sky: ['#F9D9E3', '#FBE8DD', '#F4F0E4'], layers: ['#CFE2BE', '#B6D3A2', '#9FC28A'], scene: 'springBloom', particles: 'butterflies', decor: ['🌸', '🦋', '✿'], orn: '✿ · 🌸 · ✿', corner: '🌸' }),
  T({ id: 'summerMeadow', cat: 'season', name: 'Summer meadow', sub: 'Sun, meadows, berries', dark: false,
    bgTop: '#EEF4E6', bgBottom: '#E4EDD6', card: '#FCFDF7', border: '#CFDDB8', accent: '#5E9A4E', text: '#2C3A26', subc: '#6A7D5E',
    sky: ['#A9D8F2', '#D4EEF6', '#F4F6E4'], layers: ['#A9CF7E', '#8FBF62', '#78A94E'], scene: 'summerMeadow', particles: 'butterflies', decor: ['🍓', '🌼', '☀︎'], orn: '🌼 · ✦ · 🌼', corner: '🍓' }),
  T({ id: 'autumnPath', cat: 'season', name: 'Autumn path', sub: 'Leaves, pumpkins, a cottage', dark: true,
    bgTop: '#24160E', bgBottom: '#311E10', card: '#3B2615', border: '#6B4423', accent: '#E08A3A', text: '#F6E6D0', subc: '#C9A880',
    sky: ['#5A2E1A', '#B5602E', '#E8A35A'], layers: ['#7A4420', '#5A3218', '#3A200E'], scene: 'autumnPath', particles: 'leaves', moon: '#FFE0A8', decor: ['🍂', '🎃', '🍄'], orn: '🍂 · 🎃 · 🍂', corner: '🍁' }),
  T({ id: 'winterNight', cat: 'season', name: 'Christmas winter', sub: 'Snow, garlands, lights in cottages', dark: true,
    bgTop: '#0E1726', bgBottom: '#16223A', card: '#1D2A42', border: '#34476A', accent: '#E8C26A', text: '#EEF3FA', subc: '#A9B8CE',
    sky: ['#0A1222', '#1C2C4C', '#3A5078'], layers: ['#2A3A58', '#1E2B44', '#F4F8FC'], scene: 'winterVillage', particles: 'snow', moon: '#F4F6FA', dark2: true, decor: ['❄︎', '✧', '🎄'], orn: '❄︎ · 🎄 · ❄︎', corner: '❄︎' }),
  T({ id: 'winterDay', cat: 'season', name: 'Frosty morning', sub: 'Snowy forest and frost patterns', dark: false,
    bgTop: '#EEF3F9', bgBottom: '#E3EBF4', card: '#FBFDFF', border: '#CAD8E8', accent: '#5C88BA', text: '#24344A', subc: '#6A7E96',
    sky: ['#BFD6EE', '#DDE9F5', '#F3F6FA'], layers: ['#7F9CBC', '#9DB6D0', '#F4F8FC'], scene: 'winterVillage', particles: 'snow', decor: ['❄︎', '⋆'], orn: '❄︎ · ✧ · ❄︎', corner: '❄︎' }),
  T({ id: 'mushroomOasis', cat: 'fairy', name: 'Mushroom Oasis', sub: 'Mushroom houses and magic plants', dark: true,
    bgTop: '#142420', bgBottom: '#1C2E2A', card: '#22362F', border: '#3E5A4E', accent: '#E8846A', text: '#F0EAD8', subc: '#A9BCA8',
    sky: ['#1E2A44', '#3A4A6A', '#5E7A78'], layers: ['#2E4A3A', '#22382C', '#16261E'], scene: 'mushroomOasis', particles: 'fireflies', decor: ['🍄', '🌿', '✦'], orn: '🍄 · ✦ · 🍄', corner: '🍄' }),
  T({ id: 'forestGlade', cat: 'fairy', name: 'Forest mood', sub: 'Moss, fireflies, forest creatures', dark: true,
    bgTop: '#0F1A14', bgBottom: '#18271D', card: '#1D2C22', border: '#3A5241', accent: '#B8CF7A', text: '#E8E4D4', subc: '#A9B3A0',
    sky: ['#0E1A14', '#22402E', '#3E5E40'], layers: ['#1E3424', '#14241A', '#0C1610'], scene: 'forestGlade', particles: 'fireflies', moon: '#F0EAC8', mushrooms: true, decor: ['🌿', '🍄', '✦'], orn: '· 🌿 ✦ 🌿 ·', corner: '🌿' }),
  T({ id: 'halloween', cat: 'fairy', name: 'Halloween', sub: 'Pumpkins, ghosts, a black cat', dark: true,
    bgTop: '#140E18', bgBottom: '#1E1422', card: '#261A2A', border: '#4A2E4E', accent: '#F08A2E', text: '#F2E6EE', subc: '#B39AB0',
    sky: ['#0E0A16', '#2A1A38', '#5A2E46'], layers: ['#1A1220', '#120C16'], scene: 'halloween', particles: 'ghosts', decor: ['🎃', '🦇', '👻'], orn: '🦇 · 🎃 · 🦇', corner: '🎃' }),
  T({ id: 'circus', cat: 'fairy', name: 'Vintage circus', sub: 'Tent, carousels, curtains', dark: true,
    bgTop: '#1C1220', bgBottom: '#24162A', card: '#2E1C30', border: '#5A3448', accent: '#E8B84A', text: '#F6EADA', subc: '#C2A6A8',
    sky: ['#1A1430', '#3A2448', '#6A3A50'], layers: ['#3A2430'], scene: 'circus', particles: 'confetti', decor: ['🎪', '✦', '🎠'], orn: '✦ · 🎪 · ✦', corner: '🎠' }),
  T({ id: 'jellyfish', cat: 'fairy', name: 'Jellyfish', sub: 'Underwater world and glowing jellyfish', dark: true,
    bgTop: '#0C1430', bgBottom: '#141A3E', card: '#1A2248', border: '#36407A', accent: '#9FC8FF', text: '#EAF0FF', subc: '#A6B2DA',
    sky: ['#0A1A3A', '#1E2A6A', '#3A2A7A'], layers: ['#1A1E4A', '#121636'], scene: 'jellyfish', particles: 'jelly', decor: ['🫧', '✧'], orn: '◦ ✧ ◦ ✧ ◦', corner: '🫧' }),
  T({ id: 'fairyGlade', cat: 'fairy', name: 'Fairies', sub: 'Magic light and a flower meadow', dark: false,
    bgTop: '#F1EEF6', bgBottom: '#E8E2F0', card: '#FDFBFF', border: '#DCD0EA', accent: '#9A6FC2', text: '#33283E', subc: '#7D6E8C',
    sky: ['#E8D8F2', '#F6E6EE', '#FFF2DA'], layers: ['#9FC29A', '#86B080', '#6E9A6A'], scene: 'fairyGlade', particles: 'fairies', decor: ['✨', '🧚', '✿'], orn: '˚ ✧ ˚ 🧚 ˚ ✧ ˚', corner: '✨' }),
  T({ id: 'unicorns', cat: 'fairy', name: 'Unicorns', sub: 'Clouds, rainbow, pastel stars', dark: false,
    bgTop: '#F6F0FA', bgBottom: '#EEE6F6', card: '#FFFCFF', border: '#E2D2EE', accent: '#D07AB0', text: '#3A2C44', subc: '#86729A',
    sky: ['#C9C2F2', '#F2D2EA', '#FFE8E0'], layers: [], scene: 'unicornSky', particles: 'stars', decor: ['🦄', '☁︎', '✧'], orn: '☁︎ · 🦄 · ☁︎', corner: '🦄' }),
  T({ id: 'space', cat: 'fairy', name: 'Space', sub: 'Constellations, planets, the moon', dark: true,
    bgTop: '#0A0C1E', bgBottom: '#121430', card: '#181C3A', border: '#30366A', accent: '#C8A6FF', text: '#ECEAFF', subc: '#A6A6D2',
    sky: ['#06081A', '#141A40', '#2A1E4A'], layers: [], scene: 'space', particles: 'twinkle', decor: ['✦', '☾', '🪐'], orn: '✦ · 🪐 · ✦', corner: '🪐' }),
);

const THEME_CATS = [['all', 'All'], ['pictures', 'Pictures'], ['season', 'Seasons'], ['fairy', 'Fairy tale'], ['cozy', 'Cozy'], ['mine', 'My themes']];
const OLD_CATS = { darkForest: 'fairy', cozyLibrary: 'cozy', fairycore: 'fairy', cottagecore: 'cozy', gothicNature: 'fairy', minimalist: 'cozy', autumn: 'season', winter: 'season', spring: 'season', summer: 'season' };
THEMES.forEach((t) => { if (!t.cat) t.cat = OLD_CATS[t.id] || 'cozy'; });
// впорядкувати: пори року → казкові → затишні
THEMES.sort((a, b) => ['season', 'fairy', 'cozy'].indexOf(a.cat) - ['season', 'fairy', 'cozy'].indexOf(b.cat));

/* Шрифти, доступні на iPhone (з кирилицею) */
const FONTS = [
  ['olivia', 'My handwriting', '"Olivia Hand", "Caveat", cursive'],
  ['mosca', 'Mosca style (Kalnia + Prata)', '"Kalnia", "Prata", Georgia, serif'],
  ['prata', 'Prata', '"Prata", Georgia, serif'],
  ['playfair', 'Playfair Display', '"Playfair Display", Georgia, serif'],
  ['cormorant', 'Cormorant Garamond', '"Cormorant Garamond", Georgia, serif'],
  ['unicase', 'Cormorant Unicase', '"Cormorant Unicase", Georgia, serif'],
  ['yeseva', 'Yeseva One', '"Yeseva One", Georgia, serif'],
  ['lora', 'Lora', '"Lora", Georgia, serif'],
  ['philosopher', 'Philosopher', '"Philosopher", sans-serif'],
  ['comfortaa', 'Comfortaa', '"Comfortaa", ui-rounded, sans-serif'],
  ['kurale', 'Kurale', '"Kurale", Georgia, serif'],
  ['caveat', 'Caveat (handwritten)', '"Caveat", cursive'],
  ['marck', 'Marck Script (handwritten)', '"Marck Script", cursive'],
  ['neucha', 'Neucha (handwritten)', '"Neucha", cursive'],
  ['amatic', 'Amatic SC', '"Amatic SC", cursive'],
  ['lobster', 'Lobster', '"Lobster", cursive'],
  ['pacifico', 'Pacifico', '"Pacifico", cursive'],
  ['greatvibes', 'Great Vibes', '"Great Vibes", cursive'],
  ['system', 'System', '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif'],
  ['newyork', 'New York (serif)', '"New York", ui-serif, "Iowan Old Style", Georgia, serif'],
  ['georgia', 'Georgia', 'Georgia, "Times New Roman", serif'],
  ['palatino', 'Palatino', 'Palatino, "Palatino Linotype", "Book Antiqua", serif'],
  ['times', 'Times', '"Times New Roman", Times, serif'],
  ['avenir', 'Avenir Next', '"Avenir Next", Avenir, "Segoe UI", sans-serif'],
  ['rounded', 'Rounded', 'ui-rounded, "SF Pro Rounded", -apple-system, sans-serif'],
  ['typewriter', 'Typewriter', '"American Typewriter", "Courier New", Courier, monospace'],
  ['mono', 'Monospace', 'ui-monospace, Menlo, "Courier New", monospace'],
];
const fontStack = (id, fallback) => (FONTS.find((f) => f[0] === id) || FONTS.find((f) => f[0] === fallback))[2];
