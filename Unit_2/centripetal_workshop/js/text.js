// Centripetal Acceleration Workshop — real subscripts and no-wrap math in the task card.
// Symbols are written in source as a_c, v_o, X_o, X_f. Adapted from Unit_2/vector_decomposition_studio/js/text.js.

(function () {
  const SUB_RE = /\b(v|X|a)_(ox|oy|o|f|c)\b/g;
  const NBSP = ' ';
  // Only text between tags is changed, so attributes stay valid.
  window.subHTML = str => String(str).split(/(<[^>]+>)/).map(part => (part.startsWith('<') ? part : part
    .replace(SUB_RE, '$1<sub>$2</sub>')
    .replace(/(\d)\s+(?=(?:m\/s²|m\/s|m|s|times)(?![A-Za-z]))/g, '$1' + NBSP)
    .replace(/\s+([=−+×÷])\s+/g, NBSP + '$1' + NBSP)
  )).join('');
})();
