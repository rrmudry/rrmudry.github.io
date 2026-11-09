// Centripetal Acceleration Workshop — looks for records that don't add up, for the teacher's Class Progress page.
// A flag means "worth a look," not proof: everything here comes from the browser, so a careful
// cheater could fake a consistent record. Only server-side grading would close that gap.

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
      if (!st.quiz.last || !st.quiz.last.qs || !st.quiz.last.probs) flags.push('Mastery Check score, but no saved questions.');
      else checkLast(doc, st.quiz.last, attempts[attempts.length - 1], flags);
    }
    return flags;
  }

  function checkLast(doc, last, attempt, flags) {
    const PR = window.PR;
    const graded = PR.gradeQuiz(last);
    if (attempt && graded.pct !== attempt.pct) flags.push(`Latest Mastery Check says ${attempt.pct}%, but its saved answers grade to ${graded.pct}%.`);
    if (attempt && attempt.secs !== null && attempt.secs !== undefined && attempt.secs < FAST_SECONDS && attempt.pct >= 75) {
      flags.push(`Scored ${attempt.pct}% on the Mastery Check in ${attempt.secs} seconds.`);
    }
    if (doc.calc_unavailable) return;
    let missing = false, mismatch = false;
    last.qs.forEach((q, i) => {
      if (q.kind !== 'step' || !PR.STEP[last.tier][q.k].calc) return;
      const answer = PR.parseNum(last.answers[i]);
      if (answer === null) return;
      const work = (last.work || [])[i];
      if (!work) { missing = true; return; }
      const asDegrees = window.Engine.parseCalc(work, true), asRadians = window.Engine.parseCalc(work, false);
      if (![asDegrees, asRadians].some(w => w && Math.abs(w.value - answer) < 0.01)) mismatch = true;
    });
    if (missing) flags.push('Mastery Check answers have no calculator work saved.');
    if (mismatch) flags.push('Mastery Check answers do not match the calculator work saved.');
  }

  window.Integrity = { check };
})();
