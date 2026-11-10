// Centripetal Force Lab — stations, graphs, problem pictures and the Mastery Check table.
// A station's "link" is the thing that supplies the pull (rope, grip, gravity, wall). The app hides it by adding
// the class link-off to the picture, and shows the "unlink" drawing (ice, for example) in its place.

(function () {
  const K = window.SceneKit, FL = window.FL;
  const { W, H, ST, fmt, text, plate, arrow, frame, at, aimed, turnArrow } = K;

  // ---------- Things that go around. Drawn at the origin with +x pointing away from the center. ----------
  const THING = {
    ball: '<circle r="14" class="fl-ball"/>',
    penny: '<circle r="12" class="fl-penny"/><circle r="7" class="fl-penny-in"/>',
    car: '<rect x="-12" y="-21" width="24" height="42" rx="7" class="fl-car"/><rect x="-9" y="-13" width="18" height="9" rx="3" class="fl-glass"/>',
    Moon: '<circle r="15" class="fl-moon"/><circle cx="-4" cy="-5" r="3.5" class="fl-crater"/><circle cx="5" cy="4" r="2.5" class="fl-crater"/>',
    satellite: '<rect x="-7" y="-22" width="14" height="14" class="fl-panel"/><rect x="-7" y="8" width="14" height="14" class="fl-panel"/><rect x="-8" y="-8" width="16" height="16" rx="3" class="fl-sat"/>',
    rider: '<ellipse rx="9" ry="17" class="fl-rider-body"/><circle r="9" class="fl-rider-head"/>',
    sock: '<rect x="-7" y="-15" width="14" height="30" rx="7" class="fl-sock"/>'
  };
  const SKIN_OF = { rope: 'rope', hammer: 'rope', car: 'car', penny: 'penny', moon: 'moon', sat: 'moon', ride: 'ride', washer: 'ride' };
  const CENTER_LABEL = { rope: 'hand', hammer: 'thrower', car: 'flat road', penny: 'turntable', moon: 'Earth', sat: 'Earth', ride: 'spinning ride', washer: 'washer drum' };

  // The fixed parts of a station, behind the moving object
  function backdrop(id, cx, cy, R) {
    const skin = SKIN_OF[id];
    let s = '';
    if (skin === 'rope') s += `<circle cx="${cx}" cy="${cy}" r="${R}" class="fl-track"/><circle cx="${cx}" cy="${cy}" r="10" class="fl-hand"/>`;
    if (skin === 'car') s += `<circle cx="${cx}" cy="${cy}" r="${R}" class="fl-road"/><circle cx="${cx}" cy="${cy}" r="${R}" class="fl-road-line"/><g id="unlink"><circle cx="${cx}" cy="${cy}" r="${R}" class="fl-ice"/></g>`;
    if (skin === 'penny') s += `<circle cx="${cx}" cy="${cy}" r="${R + 30}" class="fl-turntable"/><circle cx="${cx}" cy="${cy}" r="${R}" class="fl-groove"/><circle cx="${cx}" cy="${cy}" r="6" class="fl-hole"/><g id="unlink"><circle cx="${cx}" cy="${cy}" r="${R + 30}" class="fl-ice-disc"/></g>`;
    if (skin === 'moon') s += `<circle cx="${cx}" cy="${cy}" r="${R}" class="fl-track"/><g id="link"><circle cx="${cx}" cy="${cy}" r="${R * 0.45}" class="fl-gravity"/><circle cx="${cx}" cy="${cy}" r="${R * 0.72}" class="fl-gravity"/></g><circle cx="${cx}" cy="${cy}" r="30" class="fl-earth"/><path d="M ${cx - 16} ${cy - 8} q 10 -12 20 0 q -4 14 -14 12 z" class="fl-land"/>`;
    if (skin === 'ride') s += `<circle cx="${cx}" cy="${cy}" r="${R + 22}" class="fl-floor"/><g id="link"><circle cx="${cx}" cy="${cy}" r="${R + 24}" class="fl-wall"/></g><circle cx="${cx}" cy="${cy}" r="8" class="fl-hole"/>`;
    return s;
  }
  const centerLabel = (id, cx, cy) => text(cx, cy + (SKIN_OF[id] === 'moon' ? 52 : 34), CENTER_LABEL[id], 'sv-small fl-dim');

  // o = { id, phi, off (link removed), note, aim, aimCls, showV, showF, clickable, title }
  function station(o) {
    const { cx, cy, R } = ST, def = FL.STATIONS[o.id], p = at(o.phi || 0, R, cx, cy);
    let s = backdrop(o.id, cx, cy, R) + turnArrow(cx, cy, R - 40) + centerLabel(o.id, cx, cy);
    if (SKIN_OF[o.id] === 'rope') s += `<g id="link"><line id="string" x1="${cx}" y1="${cy}" x2="${p.x}" y2="${p.y}" class="fl-string"/></g>`;
    s += `<g id="puck" transform="translate(${p.x} ${p.y}) rotate(${-(o.phi || 0)})">${THING[def.obj]}</g>`;
    if (o.showV) s += aimed(p, (o.phi || 0) + 90, 92, 'fl-vel');
    if (o.showF) s += aimed(p, (o.phi || 0) + 180, 92, 'fl-force');
    if (typeof o.aim === 'number') s += aimed(p, o.aim, 96, o.aimCls || 'fl-aim', 6);
    s += plate(cx, 28, o.title || def.title, 'fl-title');
    s += `<text x="${cx}" y="${H - 16}" class="sv-text sv-small fl-coach" text-anchor="middle" id="testNote">${K.esc(o.note || '')}</text>`;
    return frame(s, `${o.off ? 'link-off' : ''} ${o.clickable ? 'fl-click' : ''}`);
  }

  // ---------- Graphs ----------
  // o = { spec, points: [{ x, y, label, cls }], guide: { x, y }, miss: { x, y } in pixels, line: [p, q], curve: k, note, clickable, title }
  function graph(o) {
    const { spec } = o, b = spec.box, px = (x, y) => FL.toPx(spec, x, y);
    let s = `<rect x="${b.x0}" y="${b.y1}" width="${b.x1 - b.x0}" height="${b.y0 - b.y1}" class="fl-plot"/>`;
    const dec = v => (v < 1 ? 1 : 0);
    for (let i = 1; i * spec.x.minor <= spec.x.max + 1e-9; i++) {
      const v = i * spec.x.minor, major = Math.abs(v / spec.x.step - Math.round(v / spec.x.step)) < 1e-6, X = px(v, 0).x.toFixed(1);
      s += `<line x1="${X}" y1="${b.y0}" x2="${X}" y2="${b.y1}" class="${major ? 'fl-grid-major' : 'fl-grid-minor'}"/>`;
      if (major) s += text(X, b.y0 + 22, v.toFixed(dec(spec.x.step)), 'sv-small');
    }
    for (let i = 1; i * spec.y.minor <= spec.y.max + 1e-9; i++) {
      const v = i * spec.y.minor, major = v % spec.y.step === 0, Y = px(0, v).y.toFixed(1);
      s += `<line x1="${b.x0}" y1="${Y}" x2="${b.x1}" y2="${Y}" class="${major ? 'fl-grid-major' : 'fl-grid-minor'}"/>`;
      if (major) s += text(b.x0 - 10, Number(Y) + 5, String(v), 'sv-small', 'end');
    }
    s += text(b.x0 - 10, b.y0 + 22, '0', 'sv-small', 'end');
    s += `<path d="M ${b.x0} ${b.y1} V ${b.y0} H ${b.x1}" class="fl-axis"/>`;
    s += text((b.x0 + b.x1) / 2, H - 18, spec.x.label, 'fl-axis-label');
    s += `<text transform="translate(26 ${(b.y0 + b.y1) / 2}) rotate(-90)" class="sv-text fl-axis-label" text-anchor="middle">${K.esc(spec.y.label)}</text>`;
    if (o.guide) {
      const g = px(o.guide.x, o.guide.y);
      s += `<path d="M ${g.x} ${b.y0} V ${g.y} H ${b.x0}" class="fl-guide"/>`;
    }
    if (typeof o.curve === 'number') {
      const pts = [];
      for (let i = 0; i <= 60; i++) { const x = (spec.x.max * i) / 60, y = o.curve * x * x; if (y <= spec.y.max) pts.push(px(x, y)); }
      s += `<polyline points="${pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}" class="fl-fit"/>`;
    }
    if (o.line) {
      // The line through the two picked points, drawn across the whole plot
      const [p, q] = o.line, m = (q.y - p.y) / (q.x - p.x), y0 = p.y - m * p.x;
      const xa = Math.max(0, m > 0 ? -y0 / m : 0), xb = Math.min(spec.x.max, m > 0 ? (spec.y.max - y0) / m : spec.x.max);
      const A = px(xa, y0 + m * xa), B = px(xb, y0 + m * xb);
      s += `<line x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}" class="fl-fit"/>`;
    }
    (o.points || []).forEach(pt => {
      const c = px(pt.x, pt.y);
      s += `<circle cx="${c.x.toFixed(1)}" cy="${c.y.toFixed(1)}" r="${pt.cls === 'fl-pt-new' ? 9 : 7}" class="fl-pt ${pt.cls || ''}"${pt.i !== undefined ? ` data-pt="${pt.i}"` : ''}/>`;
    });
    // Labels go on last, with a halo, so a neighbouring point never hides the numbers
    (o.points || []).filter(pt => pt.label).forEach(pt => { const c = px(pt.x, pt.y); s += text(c.x + 12, c.y - 10, pt.label, 'sv-small fl-pt-label', 'start'); });
    if (o.miss) s += `<path d="M ${o.miss.x - 7} ${o.miss.y - 7} l 14 14 m 0 -14 l -14 14" class="fl-miss"/>`;
    if (o.note) s += plate(b.x0 + 14, b.y1 + 28, o.note, 'sv-small', 'start');
    return frame(s, o.clickable ? 'fl-click fl-cross' : '');
  }

  // ---------- Problem pictures: the numbers live here, not in the question ----------
  function oneCircle(sc, cx, cy, R, labels) {
    const id = sc.skin, phi = 40, p = at(phi, R, cx, cy), obj = FL.SKINS[id].obj;
    let s = backdrop(id, cx, cy, R);
    if (id === 'rope') s += `<line x1="${cx}" y1="${cy}" x2="${p.x}" y2="${p.y}" class="fl-string"/>`;
    const rEnd = at(215, R, cx, cy), rMid = at(215, R * 0.5, cx, cy);
    s += `<line x1="${cx}" y1="${cy}" x2="${rEnd.x}" y2="${rEnd.y}" class="fl-radius"/>`;
    if (labels.r) s += plate(rMid.x + 10, rMid.y + 30, labels.r, 'fl-radius-text');
    s += `<g transform="translate(${p.x} ${p.y}) rotate(${-phi})">${THING[obj]}</g>`;
    s += aimed(p, phi + 90, 84, 'fl-vel') + aimed(p, phi + 180, 84, 'fl-force');
    const vTip = at(phi + 90, 104, p.x, p.y), fTip = at(phi + 180, 70, p.x, p.y);
    s += plate(vTip.x, vTip.y, labels.v, 'fl-vel-text') + plate(fTip.x - 10, fTip.y + 34, labels.F, 'fl-force-text');
    if (labels.m) s += plate(p.x + 30, p.y + 34, labels.m, '', 'start');
    return s;
  }
  function problem(sc, solved = {}) {
    if (sc.kind === 'compare') {
      const L = oneCircle(sc, 196, 290, 104, { v: `v = ${fmt(sc.v1)} m/s`, F: `F_net = ${fmt(sc.F1)} N` });
      const Rr = oneCircle(sc, 566, 290, 104, { v: `v = ${fmt(sc.v2)} m/s`, F: solved.cnew ? `F_net = ${fmt(sc.F2)} N` : 'F_net = ?' });
      return frame(text(196, 34, 'Before', 'fl-title') + text(566, 34, 'After: same circle, faster', 'fl-title') + `<line x1="380" y1="60" x2="380" y2="${H - 30}" class="fl-divider"/>` + L + Rr);
    }
    const back = sc.kind === 'vmax';
    const s = oneCircle(sc, ST.cx - 30, ST.cy + 6, ST.R, {
      r: `r = ${fmt(sc.r)} m`, m: `m = ${fmt(sc.m)} kg`,
      v: back ? (solved.vmax ? `v_max = ${fmt(sc.v)} m/s` : 'v_max = ?') : `v = ${fmt(sc.v)} m/s`,
      F: back ? `F_max = ${fmt(sc.Fmax)} N` : (solved.fnet ? `F_net = ${fmt(sc.F)} N` : 'F_net = ?')
    });
    return frame(s);
  }

  // ---------- A small data table drawn as a picture (Mastery Check) ----------
  function dataTable(o) {
    const cols = o.head.length, cw = Math.min(200, 620 / cols), x0 = (W - cw * cols) / 2, rh = 54, y0 = 110;
    let s = text(W / 2, 62, o.title, 'fl-title');
    [o.head].concat(o.rows).forEach((row, r) => row.forEach((cell, c) => {
      s += `<rect x="${x0 + c * cw}" y="${y0 + r * rh}" width="${cw}" height="${rh}" class="${r === 0 ? 'fl-cell-head' : 'fl-cell'}"/>${text(x0 + c * cw + cw / 2, y0 + r * rh + 34, cell, r === 0 ? 'sv-small' : 'fl-value')}`;
    }));
    return frame(s);
  }

  Object.assign(window.Scene, { station, graph, problem, dataTable });
})();
