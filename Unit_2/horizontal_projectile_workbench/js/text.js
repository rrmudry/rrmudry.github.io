// Horizontal Projectile Workbench — Subscript + no-wrap text helpers
// Physics symbols are written in source as v_x, v_y, v_impact.
// subHTML() turns them into real <sub> markup; SubText draws true subscripts on a canvas.
// Adapted from Unit_2/newtons_second_law_studio/js/text.js.

(function () {
  const SUB_RE = /\b(v)_(x|y|impact)\b/g;

  // Keep math on one line: a number stays with its unit ("2.0 s"), and the spaces around
  // math symbols become non-breaking, so "√(20 ÷ 5) = 2.0 s" never wraps mid-calculation.
  const NBSP = ' ';
  // Only text between tags is changed, so attributes (aria-label, value) stay valid.
  function subHTML(str) {
    return String(str).split(/(<[^>]+>)/).map(part => part.startsWith('<') ? part : part
      .replace(SUB_RE, '$1<sub>$2</sub>')
      .replace(/(\d)\s+(?=(?:m\/s²|m\/s|m|s)(?![A-Za-z]))/g, '$1' + NBSP)
      .replace(/\s+([=−+×÷])\s+/g, NBSP + '$1' + NBSP)
    ).join('');
  }

  // Split "v_x = 8.0 m/s" into [{t:'v'}, {t:'x', sub:true}, {t:' = 8.0 m/s'}]
  function parts(text) {
    const out = [];
    let last = 0;
    String(text).replace(SUB_RE, (m, base, sub, idx) => {
      if (idx > last) out.push({ t: text.slice(last, idx) });
      out.push({ t: base });
      out.push({ t: sub, sub: true });
      last = idx + m.length;
      return m;
    });
    if (last < text.length) out.push({ t: text.slice(last) });
    return out;
  }

  function fontParts(ctx) {
    const m = ctx.font.match(/^(.*?)(\d+(?:\.\d+)?)px(.*)$/);
    return m ? { pre: m[1], size: parseFloat(m[2]), post: m[3] } : { pre: '', size: 12, post: ' sans-serif' };
  }

  const SubText = {
    measure(ctx, text) {
      const f = fontParts(ctx);
      const base = ctx.font;
      const subFont = `${f.pre}${Math.round(f.size * 0.72)}px${f.post}`;
      let w = 0;
      parts(text).forEach(p => {
        ctx.font = p.sub ? subFont : base;
        w += ctx.measureText(p.t).width + (p.sub ? 1 : 0);
      });
      ctx.font = base;
      return w;
    },

    // Honors ctx.textAlign (left / center / right) and ctx.textBaseline.
    fill(ctx, text, x, y) {
      const f = fontParts(ctx);
      const base = ctx.font;
      const align = ctx.textAlign;
      const subFont = `${f.pre}${Math.round(f.size * 0.72)}px${f.post}`;
      const w = SubText.measure(ctx, text);
      let cx = align === 'center' ? x - w / 2 : (align === 'right' || align === 'end') ? x - w : x;
      ctx.textAlign = 'left';
      parts(text).forEach(p => {
        ctx.font = p.sub ? subFont : base;
        ctx.fillText(p.t, cx, p.sub ? y + f.size * 0.3 : y);
        cx += ctx.measureText(p.t).width + (p.sub ? 1 : 0);
      });
      ctx.font = base;
      ctx.textAlign = align;
    }
  };

  window.subHTML = subHTML;
  window.SubText = SubText;
})();
