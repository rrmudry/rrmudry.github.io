// Work & Simple Machines Practice — completion certificate, downloaded as a real PDF.
// jsPDF is vendored in assets/vendor (no CDN for the district web filter to block) and only loads on click.
// Adapted from Unit_3/tradeoff_lab/js/certificate.js.

(function () {
  const LIB = '../../assets/vendor/jspdf.umd.min.js';
  const INK = '#0f172a', MUTED = '#475569', NAVY = '#0f4c81', GOLD = '#b7892b';
  const CYAN = '#0e7490', AMBER = '#b45309';

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

  function code(id, best) {
    const text = `${id}|${best}|SMP-U3`;
    let h = 5381;
    for (let i = 0; i < text.length; i++) h = ((h * 33) ^ text.charCodeAt(i)) >>> 0;
    return `MUD-SMP-${id}-${best}-${h.toString(16).toUpperCase().padStart(8, '0')}`;
  }

  async function nameImage(name, maxW) {
    const family = 'Outfit, system-ui, sans-serif';
    if (document.fonts && document.fonts.load) {
      try { await document.fonts.load('700 96px Outfit', name); } catch (e) { /* fallback */ }
    }
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    let px = 96;
    ctx.font = `700 ${px}px ${family}`;
    const want = maxW * 2.4;
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

  // Ramp + pulley trade-off emblem
  function emblem(doc, ox, oy, w) {
    const base = oy - 12;
    doc.setDrawColor('#64748b'); doc.setLineWidth(1.5);
    doc.triangle(ox + 12, base, ox + 112, base, ox + 112, base - 46, 'S');
    doc.setDrawColor(INK); doc.setFillColor('#fde68a');
    doc.rect(ox + 48, base - 38, 22, 16, 'FD');
    doc.setDrawColor(CYAN); doc.setLineWidth(2.4);
    doc.line(ox + 34, base - 26, ox + 76, base - 45);
    doc.setDrawColor(AMBER); doc.setLineWidth(1.6);
    doc.line(ox + 120, base, ox + 120, base - 46);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(INK);
    doc.text('W = F x d', ox + w / 2, oy + 4, { align: 'center' });
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
    doc.setProperties({ title: `Certificate of Completion: ${info.name}`, subject: 'Work & Simple Machines Practice', creator: 'Mr. Mudry, Orange High School Physics' });

    doc.setDrawColor(NAVY); doc.setLineWidth(4); doc.rect(24, 24, W - 48, H - 48);
    doc.setDrawColor(GOLD); doc.setLineWidth(1.2); doc.rect(33, 33, W - 66, H - 66);

    const logo = await loadImage('../../OrangeHS_PantherMark.png');
    if (logo) doc.addImage(logo.url, 'PNG', cx - 24 * logo.ratio, 44, 48 * logo.ratio, 48);

    doc.setTextColor(MUTED); doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
    doc.text('ORANGE HIGH SCHOOL PHYSICS   ·   UNIT 3', cx, 110, { align: 'center', charSpace: 0.6 });

    doc.setTextColor(NAVY); doc.setFont('times', 'bold'); doc.setFontSize(44);
    doc.text('Certificate of Completion', cx, 158, { align: 'center' });

    doc.setTextColor(MUTED); doc.setFont('helvetica', 'normal'); doc.setFontSize(14);
    doc.text('This certifies that', cx, 188, { align: 'center' });

    const maxName = W - 180;
    const nm = await nameImage(info.name || 'Student', maxName);
    const nameH = Math.min(nm.h, 48), nameW = nm.w * (nameH / nm.h);
    doc.addImage(nm.url, 'PNG', cx - nameW / 2, 246 - nameH, nameW, nameH);
    doc.setDrawColor(GOLD); doc.setLineWidth(1); doc.line(cx - 220, 248, cx + 220, 248);

    doc.setTextColor(INK); doc.setFont('helvetica', 'bold'); doc.setFontSize(17);
    doc.text('has completed Work & Simple Machines Practice', cx, 276, { align: 'center' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(12.5); doc.setTextColor(MUTED);
    doc.text('Solving pulley, ramp, mechanical advantage, and friction work problems with the GUESS method', cx, 296, { align: 'center' });
    if (info.honors) {
      doc.setFont('helvetica', 'bold'); doc.setTextColor(NAVY);
      doc.text('Completed at the Honors Physics level', cx, 314, { align: 'center' });
    }

    const when = new Date(info.earned).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const boxes = [['Mastery Check', `${info.best}%`], ['Date earned', when]];
    if (info.period) boxes.splice(1, 0, ['Class', info.period]);
    const bw = 170, gap = 14, total = boxes.length * bw + (boxes.length - 1) * gap;
    boxes.forEach(([l, v], i) => statBox(doc, cx - total / 2 + i * (bw + gap), 328, bw, 48, l, v));

    const tx = cx - 170;
    doc.setTextColor(INK); doc.setFont('times', 'bolditalic'); doc.setFontSize(26);
    doc.text('Mr. Mudry', tx, 476, { align: 'center' });
    doc.setDrawColor(GOLD); doc.setLineWidth(1); doc.line(tx - 90, 484, tx + 90, 484);
    doc.setTextColor(MUTED); doc.setFont('helvetica', 'normal'); doc.setFontSize(11);
    doc.text('Teacher', tx, 499, { align: 'center' });

    emblem(doc, cx + 70, 498, 150);

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
    doc.save(`Work_Simple_Machines_Certificate_${safe || 'Student'}.pdf`);
    return doc;
  }

  window.Certificate = { code, build, download };
})();
