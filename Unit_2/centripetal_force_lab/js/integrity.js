// Centripetal Force Lab — looks for records that don't add up, for the teacher's Class Progress page.
// A flag means "worth a look," not proof: everything here comes from the browser.

(function () {
  const FAST_SECONDS = 60;   // a passing Mastery Check faster than this is unusual

  function check(doc) {
    try {
      return checkRecord(doc);
    } catch (e) {
      return ['This record could not be checked. It may have been edited.'];
    }
  }

  function checkRecord(doc) {
    const flags = [];
    const st = doc.studioState;
    const score = doc.score || 0;
    if (!st || typeof st !== 'object' || !st.parts || !st.quiz) {
      if (score > 0) flags.push('Score on record, but no saved work.');
      return flags;
    }
    const tier = ['conceptual', 'cp', 'honors'].includes(doc.track) ? doc.track : 'cp';
    const supported = window.Lesson.earnedPoints(st, tier);
    if (score > supported + 0.15) flags.push(`Score of ${score} is higher than the saved work supports (about ${supported.toFixed(1)}).`);

    const attempts = st.quiz.attempts || [];
    const best = st.quiz.best || 0;
    if (doc.quiz_best !== undefined && doc.quiz_best !== best) flags.push('Mastery Check score on record does not match the saved work.');
    if (best > 0) {
      if (!attempts.length || Math.max(...attempts.map(a => a.pct)) !== best) flags.push('Best Mastery Check score does not match any attempt.');
      const last = st.quiz.last;
      if (!last || !Array.isArray(last.items) || !Array.isArray(last.answers)) flags.push('Mastery Check score, but no saved questions.');
      else checkLast(last, attempts[attempts.length - 1], flags);
    }
    // The graph part cannot be finished without a full data table.
    const need = window.FL.TRIALS[tier];
    const graphDone = st.parts.graph && st.parts.graph.done;
    if (graphDone && (st.table || []).length < need) flags.push(`Graph part finished with ${(st.table || []).length} of ${need} trials recorded.`);
    return flags;
  }

  function checkLast(last, attempt, flags) {
    const graded = window.FL.gradeQuiz(last.items, last.answers);
    if (attempt && graded.percent !== attempt.pct) flags.push(`Latest Mastery Check says ${attempt.pct}%, but its saved answers grade to ${graded.percent}%.`);
    if (attempt && attempt.secs !== null && attempt.secs !== undefined && attempt.secs < FAST_SECONDS && attempt.pct >= 75) {
      flags.push(`Scored ${attempt.pct}% on the Mastery Check in ${attempt.secs} seconds.`);
    }
  }

  window.Integrity = { check };
})();
