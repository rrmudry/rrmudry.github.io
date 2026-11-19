// Work & Simple Machines Practice — real subscripts and no-wrap math in the task card.
// Symbols are written in source as F_in, F_out, F_g, F_f, F_pull, W_in, W_out, W_f, W_A, W_B, d_ramp, d_pull, d_B, d_2, h_1, h_2.
// Adapted from Unit_3/work_studio/js/text.js.

(function () {
  const SUB_RE = /\b(F|W|d|h)_(in|out|g|f|pull|ramp|A|B|1|2)\b/g;
  const NBSP = '\u00A0';
  // Only text between tags is changed, so attributes stay valid.
  window.subHTML = str => String(str).split(/(<[^>]+>)/).map(part => (part.startsWith('<') ? part : part
    .replace(SUB_RE, '$1<sub>$2</sub>')
    .replace(/(\d)\s+(?=(?:m\/s²|kg|N|m|s|J|times)(?![A-Za-z]))/g, '$1' + NBSP)
    .replace(/\s+([=−+×÷])\s+/g, NBSP + '$1' + NBSP)
  )).join('');
  window.SUB_RE = SUB_RE;
})();
