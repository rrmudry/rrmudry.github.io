// Centripetal Force Lab — real subscripts and no-wrap math in the task card.
// Symbols are written in source as F_net, F_max, a_c, v_max. Adapted from Unit_2/centripetal_workshop/js/text.js.

(function () {
  const SUB_RE = /\b(F|a|v)_(net|max|c|T|f|g|N)\b/g;
  const NBSP = ' ';
  // Only text between tags is changed, so attributes stay valid.
  window.subHTML = str => String(str).split(/(<[^>]+>)/).map(part => (part.startsWith('<') ? part : part
    .replace(SUB_RE, '$1<sub>$2</sub>')
    .replace(/(\d)\s+(?=(?:m\/s²|m\/s|kg|N|m|s|times)(?![A-Za-z]))/g, '$1' + NBSP)
    .replace(/\s+([=−+×÷])\s+/g, NBSP + '$1' + NBSP)
  )).join('');
  window.SUB_RE = SUB_RE;
})();
