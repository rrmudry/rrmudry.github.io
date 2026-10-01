// Mass, Weight & Zero-G Inertia Studio: Test Object Database & Shared Drawing Helpers
// 4 fixed misconception-busting archetypes + 3 randomized sealed mystery crates (per student, per attempt)

window.MWS = window.MWS || {};

MWS.PLANETS = [
  { id: 'earth', name: 'Earth', icon: '🌍', g: 10 }, // class convention: g = 10 m/s² on Earth
  { id: 'moon', name: 'Moon', icon: '🌕', g: 1.6 },
  { id: 'mars', name: 'Mars', icon: '🔴', g: 3.7 },
  { id: 'jupiter', name: 'Jupiter', icon: '🪐', g: 24.8 },
  { id: 'space', name: 'Deep Space', icon: '🛰️', g: 0 }
];

MWS.planet = (id) => MWS.PLANETS.find(p => p.id === id) || MWS.PLANETS[0];

// Identical robotic shove used for every object in Station 3. Internal only: Day 24 stays
// qualitative (no F = m · a), so students only ever see the resulting drift speed.
MWS.STANDARD_PUSH = 5;
MWS.BACKPACK_CM3 = 25000;

// dims = [length, width (depth), height] in cm
MWS.BASE_OBJECTS = [
  { id: 'foam', name: 'Mega Space-Foam Block', short: 'Space-Foam', icon: '🧽', mass: 0.8, dims: [50, 40, 40], style: 'foam' },
  { id: 'tungsten', name: 'Compact Tungsten Anvil', short: 'Tungsten Anvil', icon: '⚒️', mass: 50.0, dims: [20, 6.5, 20], style: 'tungsten' },
  { id: 'toolkit', name: 'Astronaut EVA Toolkit', short: 'EVA Toolkit', icon: '🧰', mass: 12.0, dims: [50, 15, 20], style: 'toolkit' },
  { id: 'gold', name: 'Heavy Gold Relic Bar', short: 'Gold Bar', icon: '🪙', mass: 19.3, dims: [25, 10, 4], style: 'gold' }
];

MWS.volumeOf = (obj) => obj.dims[0] * obj.dims[1] * obj.dims[2];

MWS.allObjects = (crates) => MWS.BASE_OBJECTS.concat(crates || []);

MWS.shuffle = (arr) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

MWS.pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Three sealed crates whose volume ranking deliberately disagrees with their mass ranking:
// the biggest crate is never the most massive one.
MWS.generateCrates = function () {
  const Ls = [20, 25, 30, 35, 40, 45, 50];
  const Ws = [15, 20, 25, 30, 35, 40];
  const Hs = [10, 15, 20, 25, 30, 35, 40];
  const vol = d => d[0] * d[1] * d[2];

  let dimsSet = null;
  for (let tries = 0; tries < 1000 && !dimsSet; tries++) {
    const set = [0, 1, 2].map(() => [MWS.pick(Ls), MWS.pick(Ws), MWS.pick(Hs)]);
    const v = set.map(vol).sort((a, b) => b - a);
    if (v[0] / v[1] >= 1.35 && v[1] / v[2] >= 1.35 && v[2] >= 4000) dimsSet = set;
  }
  if (!dimsSet) dimsSet = [[50, 40, 30], [40, 30, 25], [25, 20, 15]];
  dimsSet.sort((a, b) => vol(b) - vol(a)); // index 0 = biggest volume

  // Adjacent pool values differ by ~1.5x so the Zero-G nudge test can tell them apart
  const pool = [4, 7, 11, 17, 26, 40, 58];
  const idx = MWS.shuffle([0, 1, 2, 3, 4, 5, 6]).slice(0, 3).sort((a, b) => a - b);
  const masses = idx.map(i => Math.round(pool[i] * (0.94 + Math.random() * 0.12) * 10) / 10); // ascending

  // perm[volumeRank] = massRank (2 = heaviest). Biggest box must NOT be the heaviest.
  const perms = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0]];
  const perm = MWS.pick(perms);
  const labels = MWS.shuffle(['A', 'B', 'C']);

  return dimsSet.map((dims, rank) => ({
    id: 'crate' + labels[rank],
    name: 'Sealed Mystery Crate ' + labels[rank],
    short: 'Crate ' + labels[rank],
    icon: '📦',
    label: labels[rank],
    mass: masses[perm[rank]],
    dims,
    style: 'crate',
    hidden: true
  })).sort((a, b) => a.label.localeCompare(b.label));
};

// ---------------------------------------------------------------------
// Number formatting (Unicode units only, no LaTeX)
// ---------------------------------------------------------------------
MWS.fmt = (n, digits = 1) =>
  Number(n).toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });

MWS.fmtMass = (obj) => (obj.hidden ? '? kg' : `${MWS.fmt(obj.mass, 1)} kg`);

// ---------------------------------------------------------------------
// Canvas helpers shared by all three stations
// ---------------------------------------------------------------------
MWS.rr = function (ctx, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
};

// Readable label "pill": always draws its own background so text stays legible over any scene
MWS.pill = function (ctx, text, x, y, o = {}) {
  const size = o.size || 13;
  const weight = o.weight || 600;
  const family = o.mono ? "'JetBrains Mono', ui-monospace, monospace" : "'Outfit', system-ui, sans-serif";
  ctx.font = `${weight} ${size}px ${family}`;
  const padX = o.padX != null ? o.padX : size * 0.6;
  const padY = o.padY != null ? o.padY : size * 0.35;
  const tw = ctx.measureText(text).width;
  const bw = tw + padX * 2;
  const bh = size + padY * 2;
  let bx = x;
  if (o.align === 'center') bx = x - bw / 2;
  else if (o.align === 'right') bx = x - bw;
  const cw = ctx.canvas.width / (ctx.getTransform().a || 1);
  bx = Math.max(4, Math.min(bx, cw - bw - 4));
  const by = y - bh / 2;
  ctx.save();
  MWS.rr(ctx, bx, by, bw, bh, o.radius != null ? o.radius : bh / 2);
  ctx.fillStyle = o.bg || 'rgba(9,13,22,0.85)';
  ctx.fill();
  if (o.border) {
    ctx.strokeStyle = o.border;
    ctx.lineWidth = o.borderWidth || 1.5;
    ctx.stroke();
  }
  ctx.fillStyle = o.fg || '#f8fafc';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, bx + padX, y + 0.5);
  ctx.restore();
  return { x: bx, y: by, w: bw, h: bh };
};

MWS.shade = function (hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v) => Math.max(0, Math.min(255, Math.round(v * f)));
  return `rgb(${ch((n >> 16) & 255)}, ${ch((n >> 8) & 255)}, ${ch(n & 255)})`;
};

MWS.baseColor = function (obj) {
  return { foam: '#facc15', tungsten: '#6b7280', toolkit: '#f97316', gold: '#f59e0b', crate: '#b7791f' }[obj.style] || '#94a3b8';
};

// Side-view drawing of an object inside the box (x, y) → (x + w, y + h)
MWS.drawObjectSide = function (ctx, obj, x, y, w, h) {
  ctx.save();
  let grad;
  switch (obj.style) {
    case 'foam': {
      grad = ctx.createLinearGradient(x, y, x, y + h);
      grad.addColorStop(0, '#fde68a');
      grad.addColorStop(1, '#eab308');
      MWS.rr(ctx, x, y, w, h, Math.min(w, h) * 0.08);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.save();
      ctx.clip();
      ctx.fillStyle = 'rgba(161, 98, 7, 0.45)';
      const count = Math.max(6, Math.floor((w * h) / 160));
      const r = Math.max(1.2, Math.min(w, h) * 0.035);
      for (let i = 0; i < count; i++) {
        const px = x + ((i * 73.13) % 1 + ((i * 0.618) % 1)) / 2 * w;
        const py = y + ((i * 41.7) % 1 + ((i * 0.381) % 1)) / 2 * h;
        ctx.beginPath();
        ctx.arc(px, py, r * (0.6 + ((i * 7) % 5) / 6), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      ctx.strokeStyle = '#a16207';
      ctx.lineWidth = 1.5;
      MWS.rr(ctx, x, y, w, h, Math.min(w, h) * 0.08);
      ctx.stroke();
      break;
    }
    case 'tungsten': {
      grad = ctx.createLinearGradient(x, y, x + w, y + h);
      grad.addColorStop(0, '#9ca3af');
      grad.addColorStop(0.45, '#4b5563');
      grad.addColorStop(1, '#1f2937');
      MWS.rr(ctx, x, y, w, h, 2);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = '#111827';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath();
      ctx.moveTo(x + 3, y + 3);
      ctx.lineTo(x + w - 3, y + 3);
      ctx.stroke();
      if (h > 14 && w > 14) {
        ctx.fillStyle = '#e5e7eb';
        ctx.font = `800 ${Math.min(h, w) * 0.5}px 'Outfit', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('W', x + w / 2, y + h / 2 + 1);
      }
      break;
    }
    case 'toolkit': {
      grad = ctx.createLinearGradient(x, y, x, y + h);
      grad.addColorStop(0, '#fb923c');
      grad.addColorStop(1, '#c2410c');
      MWS.rr(ctx, x, y, w, h, Math.min(w, h) * 0.15);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = '#7c2d12';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(x, y + h * 0.42, w, h * 0.14);
      ctx.fillStyle = '#e5e7eb';
      ctx.fillRect(x + w * 0.2, y + h * 0.38, w * 0.07, h * 0.22);
      ctx.fillRect(x + w * 0.73, y + h * 0.38, w * 0.07, h * 0.22);
      ctx.strokeStyle = '#1f2937';
      ctx.lineWidth = Math.max(2, h * 0.08);
      ctx.beginPath();
      ctx.moveTo(x + w * 0.38, y);
      ctx.lineTo(x + w * 0.38, y - h * 0.16);
      ctx.lineTo(x + w * 0.62, y - h * 0.16);
      ctx.lineTo(x + w * 0.62, y);
      ctx.stroke();
      break;
    }
    case 'gold': {
      const inset = w * 0.1;
      grad = ctx.createLinearGradient(x, y, x, y + h);
      grad.addColorStop(0, '#fef08a');
      grad.addColorStop(0.5, '#f59e0b');
      grad.addColorStop(1, '#b45309');
      ctx.beginPath();
      ctx.moveTo(x + inset, y);
      ctx.lineTo(x + w - inset, y);
      ctx.lineTo(x + w, y + h);
      ctx.lineTo(x, y + h);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      break;
    }
    case 'crate': {
      grad = ctx.createLinearGradient(x, y, x, y + h);
      grad.addColorStop(0, '#ca8a04');
      grad.addColorStop(1, '#92400e');
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1.2;
      const planks = Math.max(2, Math.round(h / 14));
      for (let i = 1; i < planks; i++) {
        ctx.beginPath();
        ctx.moveTo(x, y + (h * i) / planks);
        ctx.lineTo(x + w, y + (h * i) / planks);
        ctx.stroke();
      }
      ctx.lineWidth = Math.max(2, Math.min(w, h) * 0.07);
      ctx.strokeRect(x, y, w, h);
      ctx.beginPath();
      ctx.moveTo(x, y + h);
      ctx.lineTo(x + w, y);
      ctx.stroke();
      if (h > 16) {
        const size = Math.min(h * 0.55, w * 0.4);
        ctx.font = `800 ${size}px 'Outfit', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#451a03';
        ctx.strokeText(obj.label + '?', x + w / 2, y + h / 2 + 1);
        ctx.fillStyle = '#fef3c7';
        ctx.fillText(obj.label + '?', x + w / 2, y + h / 2 + 1);
      }
      break;
    }
    default:
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(x, y, w, h);
  }
  ctx.restore();
};

// Deterministic starfield (normalized coordinates) shared by space scenes
MWS.STARS = Array.from({ length: 140 }, (_, i) => ({
  x: (Math.sin(i * 12.9898) * 43758.5453) % 1,
  y: (Math.sin(i * 78.233) * 12345.6789) % 1,
  r: 0.5 + ((i * 37) % 10) / 10,
  a: 0.35 + ((i * 53) % 10) / 15
})).map(s => ({ ...s, x: Math.abs(s.x), y: Math.abs(s.y) }));

MWS.drawStars = function (ctx, x, y, w, h, t = 0) {
  ctx.save();
  MWS.STARS.forEach((s, i) => {
    const tw = 0.75 + 0.25 * Math.sin(t * 1.5 + i);
    ctx.globalAlpha = Math.min(1, s.a * tw);
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(x + s.x * w, y + s.y * h, s.r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
};
