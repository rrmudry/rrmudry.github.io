// Newton's 2nd Law Studio — Subscript text helpers
// Physics symbols are written in source as F_net, M_total, m_L, T_R, v_A …
// subHTML() turns them into real <sub> markup; SubText draws true subscripts on a canvas.

(function () {
  const SUB_RE = /\b([FMmTvta])_(net|total|cart|hang|hand|bumper|L|R|A|B|N|g)\b/g;

  // Keep math on one line: a number stays with its unit ("0.25 m/s"), and the spaces around
  // math symbols become non-breaking, so "0.05 m ÷ 0.2 s = 0.25 m/s" never wraps mid-calculation.
  // Only text between tags is touched, never tag attributes.
  const NBSP = '\u00a0';
  function glueMath(html) {
    return html.split(/(<[^>]+>)/).map(part => part.startsWith('<') ? part : part
      .replace(/(\d)\s+(?=(?:N|g|kg|m\/s²|m\/s|ms|cm|m|s)(?![A-Za-z]))/g, '$1' + NBSP)
      .replace(/\s+([=−+×÷])\s+/g, NBSP + '$1' + NBSP)
    ).join('');
  }

  function subHTML(str) {
    return glueMath(String(str).replace(SUB_RE, '$1<sub>$2</sub>'));
  }

  // Split "T_L = 0.98 N" into [{t:'T'}, {t:'L', sub:true}, {t:' = 0.98 N'}]
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
