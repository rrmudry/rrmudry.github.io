// Projectile Range Studio — completion certificate, downloaded as a real PDF
// jsPDF is vendored in assets/vendor (no CDN for the district web filter to block) and only loads on click.
// The built-in PDF fonts can't show every student name (Nguyễn, for example), so the name is drawn
// on a canvas in the page's font and placed as an image. Colors stay light so it prints cheaply.
// Adapted from Unit_2/vector_decomposition_studio/js/certificate.js.

(function () {
  const LIB = '../../assets/vendor/jspdf.umd.min.js';
  const INK = '#0f172a', MUTED = '#475569', NAVY = '#0f4c81', GOLD = '#b7892b';
  const X = '#0369a1', Y = '#c2410c';

  function loadLibrary() {
    if (window.jspdf) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = LIB;
      s.onload = resolve;
      s.onerror = () => reject(new Error('Could not load the PDF library'));
      document.head.append(s);
    });
  }

  // Quick checksum so a typed-up fake code stands out; not cryptographic
  function code(id, best) {
    const text = `${id}|${best}|PRS-47`;
    let h = 5381;
    for (let i = 0; i < text.length; i++) h = ((h * 33) ^ text.charCodeAt(i)) >>> 0;
    return `MUD-PRS-${id}-${best}-${h.toString(16).toUpperCase().padStart(8, '0')}`;
  }

  async function nameImage(name, maxW) {
    const family = 'Outfit, system-ui, sans-serif';
    if (document.fonts && document.fonts.load) {
      try { await document.fonts.load('700 96px Outfit', name); } catch (e) { /* falls back to a system font */ }
    }
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    let px = 96;
    ctx.font = `700 ${px}px ${family}`;
    const want = maxW * 2.4;   // sharp in print
    const w = ctx.measureText(name).width;
    if (w > want) px = Math.floor(px * want / w);
    ctx.font = `700 ${px}px ${family}`;
    canvas.width = Math.ceil(ctx.measureText(name).width) + 8;
    canvas.height = Math.ceil(px * 1.35);
    ctx.font = `700 ${px}px ${family}`;
    ctx.fillStyle = INK;
    ctx.textBaseline = 'middle';
    ctx.fillText(name, 4, canvas.height / 2);
    return { url: canvas.toDataURL('image/png'), w: canvas.width / 2.4, h: canvas.height / 2.4 };
  }

  function loadImage(src) {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => {
        // The source image is 8000 px wide; a small copy keeps the PDF light
        const c = document.createElement('canvas');
        c.height = 320;
        c.width = Math.round(320 * img.naturalWidth / img.naturalHeight);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        resolve({ url: c.toDataURL('image/png'), ratio: img.naturalWidth / img.naturalHeight });
      };
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }

  // Letters with a real lowered subscript, since the PDF fonts have no subscript characters
  function symbol(doc, base, sub, x, y, size, color) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(color);
    doc.setFontSize(size);
    doc.text(base, x, y);
    const w = doc.getTextWidth(base);
    doc.setFontSize(size * 0.68);
    doc.text(sub, x + w + 0.5, y + size * 0.22);
  }

  function arrow(doc, x0, y0, x1, y1, color) {
    const a = Math.atan2(y1 - y0, x1 - x0), head = 9, sp = 0.42;
    doc.setDrawColor(color);
    doc.setFillColor(color);
    doc.setLineWidth(2.2);
    doc.line(x0, y0, x1 - Math.cos(a) * head * 0.8, y1 - Math.sin(a) * head * 0.8);
    doc.triangle(x1, y1, x1 - head * Math.cos(a - sp), y1 - head * Math.sin(a - sp), x1 - head * Math.cos(a + sp), y1 - head * Math.sin(a + sp), 'F');
  }

  // The lesson's flight: both arrows at launch, the path, and the range on the ground
  function emblem(doc, ox, oy, w, h) {
    doc.setDrawColor('#94a3b8');
    doc.setLineWidth(1);
    doc.line(ox - 14, oy, ox + w + 14, oy);
    doc.setDrawColor(INK);
    doc.setLineWidth(1.3);
    const n = 28;
    for (let i = 0; i < n; i++) {
      const f = i / n, g = (i + 1) / n;
      doc.line(ox + w * f, oy - 4 * h * f * (1 - f), ox + w * g, oy - 4 * h * g * (1 - g));
    }
    arrow(doc, ox, oy, ox + 50, oy, X);
    arrow(doc, ox, oy, ox, oy - 42, Y);
    doc.setFillColor(INK);
    doc.circle(ox, oy, 3, 'F');
    symbol(doc, 'v', 'ox', ox + 14, oy + 15, 13, X);
    symbol(doc, 'v', 'oy', ox - 27, oy - 24, 13, Y);
  }

  function statBox(doc, x, y, w, h, label, value) {
    doc.setDrawColor('#cbd5e1');
    doc.setLineWidth(1);
    doc.roundedRect(x, y, w, h, 5, 5, 'S');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    doc.setTextColor(MUTED);
    doc.text(label, x + w / 2, y + 16, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(INK);
    doc.text(value, x + w / 2, y + 36, { align: 'center' });
  }

  async function build(info) {
    await loadLibrary();
    const doc = new window.jspdf.jsPDF({ orientation: 'landscape', unit: 'pt', format: 'letter', compress: true });
    const W = 792, H = 612, cx = W / 2;
    doc.setProperties({ title: `Certificate of Completion: ${info.name}`, subject: 'Projectile Range Studio', creator: 'Mr. Mudry, Orange High School Physics' });

    doc.setDrawColor(NAVY); doc.setLineWidth(4); doc.rect(24, 24, W - 48, H - 48);
    doc.setDrawColor(GOLD); doc.setLineWidth(1.2); doc.rect(33, 33, W - 66, H - 66);

    const logo = await loadImage('../../OrangeHS_PantherMark.png');
    if (logo) doc.addImage(logo.url, 'PNG', cx - 24 * logo.ratio, 44, 48 * logo.ratio, 48);

    doc.setTextColor(MUTED); doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
    doc.text('ORANGE HIGH SCHOOL PHYSICS   ·   UNIT 2   ·   DAY 47', cx, 110, { align: 'center', charSpace: 0.6 });

    doc.setTextColor(NAVY); doc.setFont('times', 'bold'); doc.setFontSize(44);
    doc.text('Certificate of Completion', cx, 158, { align: 'center' });

    doc.setTextColor(MUTED); doc.setFont('helvetica', 'normal'); doc.setFontSize(14);
    doc.text('This certifies that', cx, 188, { align: 'center' });

    const maxName = W - 180;
    const nm = await nameImage(info.name || 'Student', maxName);
    const nameH = Math.min(nm.h, 48), nameW = nm.w * (nameH / nm.h);
    doc.addImage(nm.url, 'PNG', cx - nameW / 2, 246 - nameH, nameW, nameH);   // sits on the line at any size
    doc.setDrawColor(GOLD); doc.setLineWidth(1); doc.line(cx - 220, 248, cx + 220, 248);

    doc.setTextColor(INK); doc.setFont('helvetica', 'bold'); doc.setFontSize(17);
    doc.text('has completed the Projectile Range Studio', cx, 276, { align: 'center' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(12.5); doc.setTextColor(MUTED);
    doc.text('Finding how long a projectile stays in the air and how far it travels', cx, 296, { align: 'center' });
    if (info.honors) {
      doc.setFont('helvetica', 'bold'); doc.setTextColor(NAVY);
      doc.text('Completed at the Honors Physics level', cx, 314, { align: 'center' });
    }

    const when = new Date(info.earned).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const boxes = [['Mastery Check', `${info.best}%`], ['Date earned', when]];
    if (info.period) boxes.splice(1, 0, ['Class', info.period]);
    const bw = 170, gap = 14, total = boxes.length * bw + (boxes.length - 1) * gap;
    boxes.forEach(([l, v], i) => statBox(doc, cx - total / 2 + i * (bw + gap), 328, bw, 48, l, v));

    // Teacher on the left, the lesson's flight on the right
    const tx = cx - 170;
    doc.setTextColor(INK); doc.setFont('times', 'bolditalic'); doc.setFontSize(26);
    doc.text('Mr. Mudry', tx, 476, { align: 'center' });
    doc.setDrawColor(GOLD); doc.setLineWidth(1); doc.line(tx - 90, 484, tx + 90, 484);
    doc.setTextColor(MUTED); doc.setFont('helvetica', 'normal'); doc.setFontSize(11);
    doc.text('Teacher', tx, 499, { align: 'center' });

    emblem(doc, cx + 70, 498, 150, 82);

    doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(MUTED);
    doc.text(`Verification code: ${info.code}`, cx, 556, { align: 'center' });

    if (info.sample) {
      doc.setTextColor('#b91c1c'); doc.setFont('helvetica', 'bold'); doc.setFontSize(13);
      doc.text('SAMPLE: teacher preview, not an earned certificate', cx, 574, { align: 'center' });
    }
    return doc;
  }

  async function download(info) {
    const doc = await build(info);
    const safe = (info.name || 'Student').normalize('NFD').replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    doc.save(`Projectile_Range_Certificate_${safe || 'Student'}.pdf`);
    return doc;
  }

  window.Certificate = { code, build, download };
})();
