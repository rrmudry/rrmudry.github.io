// Vector Decomposition Studio — everything drawn on the left panel
// mode 'grid':  arrow on a grid; students count squares and read the scale key
// mode 'scene': a launch picture; the values live here, never in the question text
// mode 'graph': the student's own measured table, graphed, with a reading crosshair
// mode 'share': bars comparing one part to the whole launch speed, so no division is needed to see it
// mode 'river': a motorboat crossing a current, the concrete example for why parts don't simply add
// A 2.5× loupe follows the pointer on grids so Chromebook trackpads can read the marks.

(function () {
  const rad = d => d * Math.PI / 180;
  let canvas, ctx, spec = null, W = 0, H = 0, dpr = 1, pointer = null;
  let onAngle = null, geom = null, dragging = false;
  let riverStart = 0, riverFrame = null;

  function colors() {
    const cs = getComputedStyle(document.documentElement);
    const v = k => cs.getPropertyValue(k).trim();
    return {
      bg: v('--canvas-bg'), text: v('--canvas-text'), muted: v('--text-dim'),
      grid: v('--canvas-grid'), gridMajor: v('--canvas-grid-major'), ground: v('--canvas-ground'),
      x: v('--series-x'), y: v('--series-y'), v: v('--accent-v'), rose: v('--accent-rose'), sky: v('--canvas-sky')
    };
  }

  function font(px, weight = 700) { return `${weight} ${px}px Outfit, system-ui, sans-serif`; }

  function pill(text, x, y, color, px, c, align = 'center') {
    ctx.font = font(px, 800);
    const w = SubText.measure(ctx, text) + 12;
    const left = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
    ctx.fillStyle = c.bg;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(left, y - px * 0.75, w, px * 1.5, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = c.text;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    SubText.fill(ctx, text, left + 6, y);
  }

  function arrow(x0, y0, x1, y1, color, width = 4, dash) {
    const a = Math.atan2(y1 - y0, x1 - x0);
    const head = 10 + width * 1.5;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = width;
    ctx.setLineDash(dash || []);
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1 - Math.cos(a) * head * 0.8, y1 - Math.sin(a) * head * 0.8);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1 - head * Math.cos(a - 0.42), y1 - head * Math.sin(a - 0.42));
    ctx.lineTo(x1 - head * Math.cos(a + 0.42), y1 - head * Math.sin(a + 0.42));
    ctx.closePath();
    ctx.fill();
  }

  // Quarter-circle protractor centered on the launch point: ticks every 5°, numbers every 15°
  function protractor(ox, oy, R, c, px) {
    ctx.strokeStyle = c.text;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(ox, oy, R, -Math.PI / 2, 0);
    ctx.stroke();
    ctx.fillStyle = c.text;
    ctx.font = font(px, 700);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let d = 0; d <= 90; d += 5) {
      const major = d % 15 === 0;
      const r0 = R, r1 = R + (major ? 11 : 6);
      const cos = Math.cos(rad(d)), sin = Math.sin(rad(d));
      ctx.beginPath();
      ctx.moveTo(ox + r0 * cos, oy - r0 * sin);
      ctx.lineTo(ox + r1 * cos, oy - r1 * sin);
      ctx.stroke();
      if (major) ctx.fillText(`${d}°`, ox + (R + 26) * cos, oy - (R + 22) * sin);
    }
  }

  function angleArc(ox, oy, r, from, to, label, c, px) {
    ctx.strokeStyle = c.rose;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(ox, oy, r, -rad(to), -rad(from));
    ctx.stroke();
    if (label) {
      const mid = rad((from + to) / 2);
      ctx.fillStyle = c.rose;
      ctx.font = font(px, 800);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, ox + (r + px * 1.5) * Math.cos(mid), oy - (r + px * 1.1) * Math.sin(mid));
    }
  }

  function icon(sc, x, y, px) {
    if (sc.thing === undefined || !window.Engine) return;
    ctx.font = `${px}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#000';
    ctx.fillText(Engine.THINGS[sc.thing].icon, x, y);
  }

  // ---------- Grid ----------
  function drawGrid(s, c) {
    const sc = s.sc;
    const scale = sc.scale || 1;
    const px = Math.max(12, Math.min(16, W / 52));
    const ml = 58, mb = 52, mt = 34, mr = 26;
    const reach = s.lab ? sc.v0 * 1.22 + 1 : null;
    const nx = reach ? Math.ceil(reach) : Math.ceil(sc.x / scale) + 3;
    const ny = reach ? Math.ceil(reach) : Math.ceil(sc.y / scale) + 3;
    const cell = Math.max(6, Math.min((W - ml - mr) / nx, (H - mt - mb) / ny));
    const ox = ml, oy = H - mb;
    const cols = Math.floor((W - ml - mr) / cell), rows = Math.floor((H - mt - mb) / cell);
    geom = { ox, oy, cell, scale };

    const major = cols > 14 || rows > 14 ? 5 : 1;
    for (let i = 0; i <= cols; i++) {
      ctx.strokeStyle = i % 5 === 0 ? c.gridMajor : c.grid;
      ctx.lineWidth = i % 5 === 0 ? 1.4 : 1;
      ctx.beginPath(); ctx.moveTo(ox + i * cell, oy); ctx.lineTo(ox + i * cell, oy - rows * cell); ctx.stroke();
    }
    for (let j = 0; j <= rows; j++) {
      ctx.strokeStyle = j % 5 === 0 ? c.gridMajor : c.grid;
      ctx.lineWidth = j % 5 === 0 ? 1.4 : 1;
      ctx.beginPath(); ctx.moveTo(ox, oy - j * cell); ctx.lineTo(ox + cols * cell, oy - j * cell); ctx.stroke();
    }
    ctx.strokeStyle = c.text;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(ox, oy - rows * cell); ctx.lineTo(ox, oy); ctx.lineTo(ox + cols * cell, oy); ctx.stroke();

    ctx.fillStyle = c.text;
    ctx.font = font(px - 1, 700);
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (let i = 0; i <= cols; i += major) ctx.fillText(String(i * scale), ox + i * cell, oy + 5);
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    for (let j = major; j <= rows; j += major) ctx.fillText(String(j * scale), ox - 6, oy - j * cell);
    ctx.font = font(px, 700);
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText('sideways speed (m/s)', ox + cols * cell / 2, oy + 25);
    ctx.save();
    ctx.translate(14, oy - rows * cell / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textBaseline = 'middle';
    ctx.fillText('upward speed (m/s)', 0, 0);
    ctx.restore();

    if (s.keyLabel || s.lab) pill(`1 square = ${scale} m/s`, ox + cols * cell, 16, c.muted, px, c, 'right');

    const tx = ox + sc.x / scale * cell, ty = oy - sc.y / scale * cell;
    if (s.protractor) protractor(ox, oy, sc.v0 / scale * cell * 1.04, c, px - 2);

    // Triangle view: the upward arrow starts where the sideways arrow ends, so the three sides close
    if (s.triangle) {
      ctx.fillStyle = c.v;
      ctx.globalAlpha = 0.14;
      ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(tx, oy); ctx.lineTo(tx, ty); ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 1;
      arrow(ox, oy, tx, oy, c.x, 5);
      arrow(tx, oy, tx, ty, c.y, 5);
      const b = 14;
      ctx.strokeStyle = c.text; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(tx - b, oy); ctx.lineTo(tx - b, oy - b); ctx.lineTo(tx, oy - b); ctx.stroke();
    } else {
      if (s.showX) {
        ctx.strokeStyle = c.x; ctx.lineWidth = 2; ctx.setLineDash([7, 5]);
        ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(tx, oy); ctx.stroke(); ctx.setLineDash([]);
        if (sc.x > 0.01) arrow(ox, oy, tx, oy, c.x, 5);
      }
      if (s.showY) {
        ctx.strokeStyle = c.y; ctx.lineWidth = 2; ctx.setLineDash([7, 5]);
        ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(ox, ty); ctx.stroke(); ctx.setLineDash([]);
        if (sc.y > 0.01) arrow(ox, oy, ox, ty, c.y, 5);
      }
    }
    if (s.showArrow && sc.v0 > 0) arrow(ox, oy, tx, ty, c.v, 5);
    if (s.showValues) {
      pill(`v_0x = ${sc.x} m/s`, ox + (tx - ox) * 0.5, oy - 18, c.x, px, c);
      pill(`v_0y = ${sc.y} m/s`, tx + 10, oy + (ty - oy) * 0.5, c.y, px, c, 'left');
      pill(`v_0 = ${sc.v0} m/s`, ox + (tx - ox) * 0.5 - 16, oy + (ty - oy) * 0.5 - 24, c.v, px + 4, c, 'right');
      icon(sc, ox - 2, oy + 2, 24);
      return;
    }
    if (s.showX && sc.x / scale * cell > 44) pill('v_0x', ox + (tx - ox) * 0.45, oy - 15, c.x, px, c);
    if (s.showY && sc.y / scale * cell > 44) {
      if (s.triangle) pill('v_0y', tx + 10, oy + (ty - oy) * 0.5, c.y, px, c, 'left');
      else pill('v_0y', ox + 30, oy + (ty - oy) * 0.45, c.y, px, c);
    }
    if (s.showArrow && Math.hypot(tx - ox, ty - oy) > 70) {
      pill('v_0', ox + (tx - ox) * 0.62 - 26 * Math.sin(rad(sc.th || 45)), oy + (ty - oy) * 0.62 - 20 * Math.cos(rad(sc.th || 45)), c.v, px, c);
    }
    icon(sc, ox - 2, oy + 2, 24);
  }

  // ---------- Launch picture ----------
  function drawScene(s, c) {
    const sc = s.sc;
    const px = Math.max(14, Math.min(19, W / 40));
    const down = !!s.downward;
    ctx.fillStyle = c.sky;
    ctx.fillRect(0, 0, W, H);

    const groundY = H - 46;
    ctx.fillStyle = c.ground;
    ctx.fillRect(0, groundY, W, 46);

    const margin = 90;
    const availW = W - margin * 2, availH = groundY - 80;
    const ch = Math.cos(rad(sc.th)), sh = Math.sin(rad(sc.th));
    const L = Math.min(availW / Math.max(ch, 0.25), availH / Math.max(sh, 0.25), Math.max(availW, availH) * 0.9) * 0.92;
    const ox = margin - 10;
    const oy = down ? 70 : groundY;
    const tx = ox + L * ch;
    const ty = down ? oy + Math.min(L * sh, groundY - oy - 16) : oy - L * sh;
    const len = Math.abs(ty - oy) / Math.max(sh, 0.01);
    const tipX = down ? ox + len * ch : tx;
    const tipY = ty;
    geom = null;

    if (down) {
      ctx.fillStyle = c.ground;
      ctx.fillRect(0, oy + 22, ox + 30, groundY - oy - 22);
      ctx.strokeStyle = c.muted; ctx.lineWidth = 1.5; ctx.setLineDash([5, 5]);
      ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(W - 20, oy); ctx.stroke(); ctx.setLineDash([]);
    }

    const legY = down ? oy : oy;
    const showCornerX = tipX, showCornerY = legY;
    if (s.showX) arrow(ox, legY, showCornerX, legY, c.x, 5);
    else if (s.triangle !== false && (s.showY || s.showGuides)) {
      ctx.strokeStyle = c.muted; ctx.lineWidth = 1.5; ctx.setLineDash([5, 5]);
      ctx.beginPath(); ctx.moveTo(ox, legY); ctx.lineTo(showCornerX, legY); ctx.stroke(); ctx.setLineDash([]);
    }
    if (s.showY) arrow(showCornerX, legY, tipX, tipY, c.y, 5);
    else if (s.triangle !== false && (s.showX || s.showGuides)) {
      ctx.strokeStyle = c.muted; ctx.lineWidth = 1.5; ctx.setLineDash([5, 5]);
      ctx.beginPath(); ctx.moveTo(showCornerX, legY); ctx.lineTo(tipX, tipY); ctx.stroke(); ctx.setLineDash([]);
    }
    if ((s.showX && s.showY) || s.rightAngle) {
      const b = 13, dy = down ? 1 : -1;
      ctx.strokeStyle = c.text; ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(showCornerX - b, legY); ctx.lineTo(showCornerX - b, legY + dy * b); ctx.lineTo(showCornerX, legY + dy * b);
      ctx.stroke();
    }

    if (s.protractor) protractor(ox, oy, len * 1.04, c, px - 3);
    arrow(ox, oy, tipX, tipY, c.v, 6);

    // Angle marker. A from-vertical picture marks the angle between the arrow and straight up.
    if (s.fromVertical) {
      ctx.strokeStyle = c.muted; ctx.lineWidth = 1.5; ctx.setLineDash([5, 5]);
      ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox, 24); ctx.stroke(); ctx.setLineDash([]);
      angleArc(ox, oy, 62, sc.th, 90, `${90 - sc.th}°`, c, px);
    } else if (down) {
      ctx.strokeStyle = c.rose; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(ox, oy, 62, 0, rad(sc.th)); ctx.stroke();
      ctx.fillStyle = c.rose; ctx.font = font(px, 800); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(`${sc.th}°`, ox + 92 * Math.cos(rad(sc.th / 2)), oy + 92 * Math.sin(rad(sc.th / 2)));
    } else if (!s.protractor) {
      angleArc(ox, oy, 62, 0, sc.th, s.hideAngle ? 'θ' : `${sc.th}°`, c, px);
    }

    // Side labels: a value, a name, or "?"
    const midA = (tipY + oy) / 2;
    if (s.labelV0 !== false) {
      const nx = -sh, ny = down ? ch : -ch;
      const label = s.nameV0 || `v_0 = ${sc.v0} m/s`;
      pill(label, (ox + tipX) / 2 + nx * 58, midA + ny * 34, c.v, px, c);
    } else if (s.giveX) {
      pill('v_0 = ?', (ox + tipX) / 2 - sh * 50, midA - ch * 30, c.v, px, c);
    } else {
      pill('v_0', (ox + tipX) / 2 - sh * 40, midA - ch * 26, c.v, px, c);
    }
    if (s.showX) {
      const label = s.nameX || (s.giveX ? `v_0x = ${Engine.fmt(sc.x, 1)} m/s` : s.valX ? `v_0x = ${s.valX} m/s` : s.mark === 'x' ? 'v_0x = ?' : 'v_0x');
      pill(label, (ox + tipX) / 2 + 20, down ? legY - 22 : legY + 24, c.x, px, c);
    }
    if (s.showY) {
      const label = s.nameY || (s.valY ? `v_0y = ${s.valY} m/s` : s.mark === 'y' ? 'v_0y = ?' : 'v_0y');
      const lx = Math.min(tipX + 14, W - 8 - (SubText.measure(ctx, label) + 16));
      pill(label, lx, midA, c.y, px, c, 'left');
    }

    icon(sc, ox - 20, down ? oy : oy - 15, 34);
  }

  // ---------- Graph of the student's own table ----------
  function drawGraph(s, c) {
    const rows = s.rows;
    const px = Math.max(12, Math.min(15, W / 52));
    const ml = 64, mr = 28, mt = 44, mb = 54;
    const pw = W - ml - mr, ph = H - mt - mb;
    const top = Math.ceil((s.v0 + 2) / 5) * 5;
    const X = t => ml + t / 90 * pw;
    const Y = v => mt + ph - v / top * ph;
    geom = { graph: true, X, Y, ml, mt, pw, ph, top };

    // Graph paper: a line every 1 m/s and every 5°, darker every 5 m/s and 15°, numbered wherever they fit
    const labelEveryV = ph / top >= 15 ? 1 : 5;
    const labelEveryT = pw / 18 >= 30 ? 5 : 15;
    for (let v = 0; v <= top; v++) {
      const major = v % 5 === 0;
      ctx.strokeStyle = v === 0 ? c.text : c.gridMajor;
      ctx.globalAlpha = v === 0 || major ? 1 : 0.35;
      ctx.lineWidth = v === 0 ? 2 : major ? 1.4 : 1;
      ctx.beginPath(); ctx.moveTo(ml, Y(v)); ctx.lineTo(ml + pw, Y(v)); ctx.stroke();
      ctx.globalAlpha = 1;
      if (v % labelEveryV === 0) {
        ctx.font = font(major ? px : px - 2, major ? 800 : 500);
        ctx.fillStyle = major ? c.text : c.muted; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
        ctx.fillText(String(v), ml - 7, Y(v));
      }
    }
    for (let t = 0; t <= 90; t += 5) {
      const major = t % 15 === 0;
      ctx.strokeStyle = t === 0 ? c.text : c.gridMajor;
      ctx.globalAlpha = t === 0 || major ? 1 : 0.35;
      ctx.lineWidth = t === 0 ? 2 : major ? 1.4 : 1;
      ctx.beginPath(); ctx.moveTo(X(t), mt); ctx.lineTo(X(t), mt + ph); ctx.stroke();
      ctx.globalAlpha = 1;
      if (t % labelEveryT === 0) {
        ctx.font = font(major ? px : px - 2, major ? 800 : 500);
        ctx.fillStyle = major ? c.text : c.muted; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        ctx.fillText(`${t}°`, X(t), mt + ph + 6);
      }
    }
    ctx.fillStyle = c.text; ctx.font = font(px, 700);
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText('launch angle θ', ml + pw / 2, mt + ph + 28);
    ctx.save(); ctx.translate(16, mt + ph / 2); ctx.rotate(-Math.PI / 2); ctx.textBaseline = 'middle';
    ctx.fillText('speed of the part (m/s)', 0, 0); ctx.restore();

    const series = [
      { key: 'x', color: c.x, label: 'v_0x (sideways)', square: false },
      { key: 'y', color: c.y, label: 'v_0y (upward)', square: true }
    ];
    series.forEach(sr => {
      const pts = rows.filter(r => r[sr.key] !== null && r[sr.key] !== undefined);
      ctx.strokeStyle = sr.color; ctx.lineWidth = 2;
      ctx.beginPath();
      pts.forEach((r, i) => i ? ctx.lineTo(X(r.th), Y(r[sr.key])) : ctx.moveTo(X(r.th), Y(r[sr.key])));
      ctx.stroke();
      pts.forEach(r => {
        const x = X(r.th), y = Y(r[sr.key]);
        ctx.fillStyle = sr.color; ctx.strokeStyle = c.bg; ctx.lineWidth = 2;
        ctx.beginPath();
        if (sr.square) ctx.rect(x - 5, y - 5, 10, 10); else ctx.arc(x, y, 5.5, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
      });
    });

    // Legend above the plot (shape as well as color tells the two lines apart)
    let lx = ml;
    series.forEach(sr => {
      ctx.fillStyle = sr.color;
      ctx.beginPath();
      if (sr.square) ctx.rect(lx, 16, 11, 11); else ctx.arc(lx + 6, 21.5, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = c.text; ctx.font = font(px, 700); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      SubText.fill(ctx, sr.label, lx + 17, 22);
      lx += 30 + SubText.measure(ctx, sr.label) + 20;
    });

    if (s.markTh !== undefined) {
      ctx.strokeStyle = c.rose; ctx.lineWidth = 2; ctx.setLineDash([3, 4]);
      ctx.beginPath(); ctx.moveTo(X(s.markTh), mt); ctx.lineTo(X(s.markTh), mt + ph); ctx.stroke(); ctx.setLineDash([]);
    }

    // Reading crosshair: shows where to read each axis, but students read the number themselves
    if (pointer && pointer.x >= ml && pointer.x <= ml + pw && pointer.y >= mt && pointer.y <= mt + ph) {
      ctx.strokeStyle = c.rose; ctx.lineWidth = 1.5; ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(pointer.x, mt + ph); ctx.lineTo(pointer.x, pointer.y); ctx.lineTo(ml, pointer.y);
      ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = c.rose;
      [[pointer.x, pointer.y], [pointer.x, mt + ph], [ml, pointer.y]].forEach(([x, y]) => {
        ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
      });
    }
  }

  // ---------- River: a boat motors across at 4 m/s while the current carries it sideways at 3 m/s ----------
  // playback < 1 runs the 3-second crossing in slow motion; the dots still mark real seconds.
  const RIVER = { across: 4, current: 3, width: 12, crossTime: 3, holdTime: 3, playback: 0.6 };
  const reduceMotion = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Motorboat seen from above, as SVG path data in a 40 × 90 box with the bow pointing up
  const BOAT = {
    hull: new Path2D('M20 0 C31 13 36 29 36 46 L36 72 Q36 79 29 79 L11 79 Q4 79 4 72 L4 46 C4 29 9 13 20 0 Z'),
    deck: new Path2D('M20 9 C28 20 31 32 31 46 L31 70 Q31 74 27 74 L13 74 Q9 74 9 70 L9 46 C9 32 12 20 20 9 Z'),
    windshield: new Path2D('M10 40 Q20 32 30 40 L30 47 Q20 40 10 47 Z'),
    seat: new Path2D('M12 58 H28 V65 H12 Z'),
    motor: new Path2D('M14 76 H26 V84 H14 Z'),
    prop: new Path2D('M15 88 H25 V90 H15 Z')
  };

  function drawBoat(x, y, len, spin) {
    const k = len / 90;
    ctx.save();
    ctx.translate(x - 20 * k, y - 45 * k);
    ctx.scale(k, k);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#1e293b';
    ctx.fillStyle = '#ffffff'; ctx.fill(BOAT.hull); ctx.stroke(BOAT.hull);
    ctx.fillStyle = '#fb923c'; ctx.fill(BOAT.deck);
    ctx.fillStyle = '#7dd3fc'; ctx.fill(BOAT.windshield); ctx.stroke(BOAT.windshield);
    ctx.fillStyle = '#fef3c7'; ctx.fill(BOAT.seat); ctx.stroke(BOAT.seat);
    ctx.fillStyle = '#1e293b'; ctx.fill(BOAT.motor);
    // The propeller blurs side to side while the motor runs
    ctx.save();
    ctx.translate(20, 89);
    ctx.scale(spin, 1);
    ctx.translate(-20, -89);
    ctx.fill(BOAT.prop);
    ctx.restore();
    ctx.restore();
  }

  function drawWater(c, top, bottom) {
    ctx.fillStyle = c.x;
    ctx.globalAlpha = 0.13;
    ctx.fillRect(0, top, W, bottom - top);
    ctx.globalAlpha = 1;
  }

  // Streaks that travel with the water, at the current's real speed on this scale
  function drawCurrent(c, top, bottom, speed, seconds) {
    const rowGap = 44, gap = 150, len = 42;
    ctx.save();
    ctx.beginPath(); ctx.rect(0, top, W, bottom - top); ctx.clip();
    ctx.strokeStyle = c.x;
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    let row = 0;
    for (let y = top + 24; y < bottom - 6; y += rowGap, row++) {
      const shift = (speed * seconds + row * 67) % gap;
      for (let x = shift - gap; x < W; x += gap) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + len * 0.25, y - 6, x + len * 0.5, y);
        ctx.quadraticCurveTo(x + len * 0.75, y + 6, x + len, y);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawRiverCrossing(c) {
    const px = Math.max(13, Math.min(17, W / 44));
    const bank = 50;
    const top = bank, bottom = H - bank;
    const m = Math.min((bottom - top) / RIVER.width, (W - 230) / (RIVER.current * RIVER.crossTime));
    const sx = 90, sy = bottom;
    const X = t => sx + RIVER.current * t * m;
    const Y = t => sy - RIVER.across * t * m;
    const still = reduceMotion();
    const now = (performance.now() - riverStart) / 1000;

    ctx.fillStyle = c.ground;
    ctx.fillRect(0, 0, W, top);
    ctx.fillRect(0, bottom, W, bank);
    drawWater(c, top, bottom);
    drawCurrent(c, top, bottom, RIVER.current * m * RIVER.playback, still ? 0 : now);

    pill('Current flows this way  →', W - 130, bottom + 25, c.x, px - 1, c);

    // Where the boat points vs. where the boat really goes
    ctx.strokeStyle = c.muted; ctx.lineWidth = 2; ctx.setLineDash([7, 6]);
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx, Y(RIVER.crossTime)); ctx.stroke(); ctx.setLineDash([]);
    pill('Boat aims here', sx - 34, top - 25, c.muted, px - 1, c, 'left');

    const crossWall = RIVER.crossTime / RIVER.playback;
    const elapsed = still ? crossWall : now % (crossWall + RIVER.holdTime);
    const t = Math.min(elapsed * RIVER.playback, RIVER.crossTime);
    const moving = t < RIVER.crossTime;

    ctx.strokeStyle = c.v; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(X(t), Y(t)); ctx.stroke(); ctx.lineCap = 'butt';

    for (let k = 1; k <= RIVER.crossTime; k++) {
      if (t < k) break;
      ctx.fillStyle = c.v;
      ctx.beginPath(); ctx.arc(X(k), Y(k), 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = c.text; ctx.font = font(px - 1, 700); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      if (k < RIVER.crossTime) ctx.fillText(`${k} s`, X(k) + 12, Y(k) + 12);
    }

    // Wake: foam stays in the water, which drifts along with the boat, so it trails straight behind the stern
    const boatLen = 72;
    if (moving && !still) {
      const stern = Y(t) + boatLen / 2;
      const count = 12, life = 1.1;
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = c.x;
      ctx.lineWidth = 1;
      for (let k = 0; k < count; k++) {
        const age = ((now * 0.9 + k / count) % 1) * life;
        const dist = age * RIVER.across * m * RIVER.playback;
        const y = stern + dist;
        if (y > sy) continue;
        const side = (k % 2 ? 1 : -1) * (3 + age * 22);
        ctx.globalAlpha = Math.max(0, 0.95 - age / life);
        ctx.beginPath();
        ctx.arc(X(t) + side, y, 2.5 + age * 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    const bob = moving && !still ? Math.sin(now * 5) * 1.2 : 0;
    const spin = moving && !still ? Math.abs(Math.sin(now * 30)) * 0.8 + 0.2 : 1;
    drawBoat(X(t), Y(t) + bob, boatLen, spin);

    // The two motions ride along with the boat until the far bank
    const unit = m * 1.05;
    if (moving) {
      arrow(X(t) + 24, Y(t) + 6, X(t) + 24, Y(t) + 6 - RIVER.across * unit, c.y, 5);
      arrow(X(t) + 24, Y(t) + 6, X(t) + 24 + RIVER.current * unit, Y(t) + 6, c.x, 5);
      pill('Motor: 4 m/s', X(t) + 34, Y(t) + 6 - RIVER.across * unit * 0.6, c.y, px - 1, c, 'left');
      pill('Current: 3 m/s', X(t) + 24 + RIVER.current * unit * 0.55, Y(t) + 28, c.x, px - 1, c);
    } else {
      pill('The real path', (sx + X(t)) / 2 + 82, (sy + Y(t)) / 2 + 10, c.v, px, c);
    }
  }

  // Tip to tail in the order of the story: motor straight across (up the left), then current (along the top)
  function drawRiverTriangle(c) {
    const px = Math.max(14, Math.min(19, W / 40));
    const narrow = W < 620;
    drawWater(c, 0, H);
    const ox = narrow ? 125 : 225, oy = H - 56;
    const m = Math.min((W - ox - (narrow ? 110 : 200)) / RIVER.current, (H - 151) / RIVER.across);
    const tx = ox + RIVER.current * m, ty = oy - RIVER.across * m;

    pill('One second of the crossing', W / 2, 30, c.muted, px, c);
    ctx.fillStyle = c.v;
    ctx.globalAlpha = 0.14;
    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox, ty); ctx.lineTo(tx, ty); ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 1;
    arrow(ox, oy, ox, ty, c.y, 6);
    arrow(ox, ty, tx, ty, c.x, 6);
    arrow(ox, oy, tx, ty, c.v, 6);
    const b = 16;
    ctx.strokeStyle = c.text; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(ox + b, ty); ctx.lineTo(ox + b, ty + b); ctx.lineTo(ox, ty + b); ctx.stroke();

    pill(narrow ? 'Across 4 m' : 'Motored across 4 m', ox - 12, (oy + ty) / 2, c.y, px, c, 'right');
    pill(narrow ? 'Sideways 3 m' : 'Pushed sideways 3 m', (ox + tx) / 2, ty - 24, c.x, px, c);
    pill(narrow ? 'Path: 5 m' : 'Real path: 5 m', (ox + tx) / 2 + 22, (oy + ty) / 2 + 26, c.v, px + 5, c, 'left');
    drawBoat(ox, oy + 26, 48, 1);
  }

  function drawRiver(s, c) {
    geom = null;
    if (s.stage === 'triangle') return drawRiverTriangle(c);
    drawRiverCrossing(c);
    if (!reduceMotion()) riverFrame = requestAnimationFrame(render);
  }

  // ---------- Share of the speed: the launch, then a bar for the whole speed and a bar for the part ----------
  function drawShare(s, c) {
    geom = null;
    const px = Math.max(14, Math.min(19, W / 40));
    const up = s.kind === 'y';
    const color = up ? c.y : c.x;
    const th = s.th;

    // The launch this row came from
    const L = Math.min(W * 0.34, H * 0.3);
    const ox = 70, oy = H * 0.42;
    const tx = ox + L * Math.cos(rad(th)), ty = oy - L * Math.sin(rad(th));
    if (up) arrow(tx, oy, tx, ty, color, 5);
    else arrow(ox, oy, tx, oy, color, 5);
    ctx.strokeStyle = c.muted; ctx.lineWidth = 1.5; ctx.setLineDash([5, 5]);
    ctx.beginPath();
    if (up) { ctx.moveTo(ox, oy); ctx.lineTo(tx, oy); } else { ctx.moveTo(tx, oy); ctx.lineTo(tx, ty); }
    ctx.stroke(); ctx.setLineDash([]);
    arrow(ox, oy, tx, ty, c.v, 5);
    angleArc(ox, oy, 38, 0, th, `${th}°`, c, px);
    pill('v_0', (ox + tx) / 2 - 12, (oy + ty) / 2 - 16, c.v, px, c, 'right');
    if (up) pill('v_0y', tx + 10, (oy + ty) / 2, color, px, c, 'left');
    else pill('v_0x', (ox + tx) / 2, oy + 20, color, px, c);
    pill(`Launch at ${th}°`, Math.max(tx, ox + L * 0.6) + 60, oy - L * 0.55, c.muted, px, c, 'left');

    // The two bars share one scale from none to all
    const left = 40, right = W - 40, bw = right - left;
    const barH = Math.max(26, H * 0.06);
    const y1 = H * 0.53, y2 = y1 + barH + 42;
    const full = bw;
    const partW = Math.max(0, Math.min(1, s.part / s.v0)) * full;

    ctx.fillStyle = c.text; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom'; ctx.font = font(px, 800);
    SubText.fill(ctx, `Whole launch speed, v_0: ${s.v0} m/s`, left, y1 - 6);
    ctx.fillStyle = c.v;
    ctx.beginPath(); ctx.roundRect(left, y1, full, barH, 4); ctx.fill();

    ctx.fillStyle = c.text; ctx.textBaseline = 'bottom';
    SubText.fill(ctx, `${up ? 'Upward part, v_0y' : 'Sideways part, v_0x'}: ${s.partLabel} m/s`, left, y2 - 6);
    ctx.strokeStyle = c.gridMajor; ctx.lineWidth = 1;
    ctx.strokeRect(left, y2, full, barH);
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.roundRect(left, y2, partW, barH, 4); ctx.fill();

    if (s.pct !== null && s.pct !== undefined) pill(`${s.pct}%`, left + partW - 8, y2 + barH / 2, color, px + 5, c, 'right');

    const scaleY = y2 + barH + 10;
    ctx.font = font(px - 1, 700);
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    [[0, 'none'], [0.25, 'a quarter'], [0.5, 'half'], [0.75, 'three quarters'], [1, 'all']].forEach(([f, label]) => {
      const x = left + f * full;
      ctx.strokeStyle = c.text; ctx.lineWidth = f === 0.5 ? 2 : 1; ctx.setLineDash(f === 0 || f === 1 ? [] : [5, 4]);
      ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x, scaleY); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = c.text;
      ctx.textAlign = f === 0 ? 'left' : f === 1 ? 'right' : 'center';
      ctx.fillText(label, x, scaleY + 3);
    });
  }

  // ---------- Loupe ----------
  function drawLoupe(c) {
    if (!pointer || !spec || spec.mode !== 'grid' || dragging) return;
    const R = 62, z = 2.5;
    const snap = document.createElement('canvas');
    snap.width = canvas.width; snap.height = canvas.height;
    snap.getContext('2d').drawImage(canvas, 0, 0);
    ctx.save();
    ctx.beginPath(); ctx.arc(pointer.x, pointer.y, R, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = c.bg; ctx.fillRect(pointer.x - R, pointer.y - R, R * 2, R * 2);
    const sw = (R * 2 / z) * dpr;
    ctx.drawImage(snap, pointer.x * dpr - sw / 2, pointer.y * dpr - sw / 2, sw, sw, pointer.x - R, pointer.y - R, R * 2, R * 2);
    ctx.restore();
    ctx.strokeStyle = c.text; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(pointer.x, pointer.y, R, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(pointer.x - R, pointer.y); ctx.lineTo(pointer.x + R, pointer.y);
    ctx.moveTo(pointer.x, pointer.y - R); ctx.lineTo(pointer.x, pointer.y + R);
    ctx.stroke();
  }

  function render() {
    if (!canvas || !spec) return;
    cancelAnimationFrame(riverFrame);
    const rect = canvas.parentElement.getBoundingClientRect();
    dpr = window.devicePixelRatio || 1;
    W = rect.width; H = rect.height;
    if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const c = colors();
    ctx.fillStyle = c.bg;
    ctx.fillRect(0, 0, W, H);
    if (spec.mode === 'grid') drawGrid(spec, c);
    else if (spec.mode === 'graph') drawGraph(spec, c);
    else if (spec.mode === 'river') drawRiver(spec, c);
    else if (spec.mode === 'share') drawShare(spec, c);
    else drawScene(spec, c);
    drawLoupe(c);
  }

  function angleFromPointer() {
    if (!geom || geom.graph || !onAngle || !pointer) return;
    const a = Math.atan2(geom.oy - pointer.y, pointer.x - geom.ox) * 180 / Math.PI;
    onAngle(Math.max(0, Math.min(90, Math.round(a / 5) * 5)));
  }

  function init(el, angleCb) {
    canvas = el;
    ctx = canvas.getContext('2d');
    onAngle = angleCb;
    const pos = e => {
      const r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    canvas.addEventListener('pointermove', e => {
      pointer = pos(e);
      if (dragging) angleFromPointer();
      else render();
    });
    canvas.addEventListener('pointerleave', () => { pointer = null; dragging = false; render(); });
    canvas.addEventListener('pointerdown', e => {
      pointer = pos(e);
      if (spec && spec.lab) { dragging = true; angleFromPointer(); }
    });
    window.addEventListener('pointerup', () => { dragging = false; });
    window.addEventListener('resize', render);
  }

  window.Diagram = {
    init,
    show(s) {
      // Re-rendering the same task keeps the boat moving; a new task starts the crossing over
      if (s.mode === 'river' && !(spec && spec.mode === 'river' && spec.stage === s.stage)) riverStart = performance.now();
      spec = s;
      render();
    },
    render
  };
})();
