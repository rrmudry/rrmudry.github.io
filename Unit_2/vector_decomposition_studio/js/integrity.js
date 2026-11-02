// Vector Decomposition Studio — looks for records that don't add up, for the teacher's Class Progress page.
// A flag means "worth a look," not proof: everything here comes from the browser, so a careful
// cheater could fake a consistent record. Only server-side grading would close that gap.

(function () {
  const PART_POINTS = 6, QUIZ_POINTS = 4;
  const FAST_SECONDS = 60;   // a passing Mastery Check faster than this is unusual

  function check(doc) {
    try {
      return checkRecord(doc);
    } catch (e) {
      return ['This record could not be checked. It may have been edited.'];
    }
  }

  function checkRecord(doc) {
    const PARTS = window.PARTS, Engine = window.Engine;   // the lesson's own list, whatever the host page names things
    const flags = [];
    const st = doc.studioState;
    const score = doc.score || 0;
    if (!st || typeof st !== 'object' || !st.done || !st.quiz) {
      if (score > 0) flags.push('Score on record, but no saved work.');
      return flags;
    }
    const honors = !!doc.honors_required;
    const support = [1, 2, 3].includes(Number(doc.class_period));
    const goal = support ? 4 : honors ? 6 : 5;
    const taskCount = p => p.tasks.filter(t => !(t.noSupport && support)).length;
    const required = PARTS.filter(p => p.weight > 0 && (!p.honors || honors));
    const seen = st.seen || {};
    const gym = st.gym || {};

    PARTS.filter(p => p.tasks && st.done[p.id]).forEach(p => {
      const far = seen[p.id] && seen[p.id].far;
      if (!(far >= taskCount(p))) flags.push(`${p.label} is marked finished, but its pages were not reached.`);
    });
    if (st.done.p2) {
      const rows = (st.data && st.data.rows) || [];
      if (!rows.length || rows.some(r => r.x === null || r.y === null)) flags.push('Angle Lab is marked finished, but its data table is not filled in.');
    }
    if (st.done.gym && !((gym.best || 0) >= goal)) flags.push(`Practice Gym is marked finished without a streak of ${goal}.`);
    const hon = PARTS.find(p => p.id === 'honors');
    if (st.done.honors && !(((st.honors && st.honors.i) || 0) >= hon.kinds.length)) flags.push('Honors is marked finished without the challenges solved.');

    // The score the saved work supports, worked out the same way the app does
    const total = required.reduce((a, p) => a + p.weight, 0);
    const earned = required.reduce((a, p) => {
      let share = 0;
      if (st.done[p.id]) share = 1;
      else if (p.kind === 'gym') share = Math.min(1, (gym.best || 0) / goal);
      else if (p.kind === 'honorsSet') share = Math.min(1, ((st.honors && st.honors.i) || 0) / p.kinds.length);
      else if (seen[p.id]) share = Math.min(1, seen[p.id].far / taskCount(p));
      return a + p.weight * share;
    }, 0);
    const best = st.quiz.best || 0;
    const supported = PART_POINTS * earned / total + QUIZ_POINTS * best / 100;
    if (score > supported + 0.15) flags.push(`Score of ${score} is higher than the saved work supports (about ${supported.toFixed(1)}).`);

    const attempts = st.quiz.attempts || [];
    if (doc.quiz_best !== undefined && doc.quiz_best !== best) flags.push('Mastery Check score on record does not match the saved work.');
    if (best > 0) {
      if (!attempts.length || Math.max(...attempts.map(a => a.pct)) !== best) flags.push('Best Mastery Check score does not match any attempt.');
      const last = st.quiz.last;
      if (!last || !last.qs) flags.push('Mastery Check score, but no saved questions.');
      else checkLastAttempt(doc, last, attempts[attempts.length - 1], flags);
    }
    return flags;
  }

  function checkLastAttempt(doc, last, attempt, flags) {
    const Engine = window.Engine;
    const out = Engine.gradeQuiz(last.qs, last.answers);
    if (attempt && out.pct !== attempt.pct) flags.push(`Latest Mastery Check says ${attempt.pct}%, but its saved answers grade to ${out.pct}%.`);
    if (attempt && attempt.secs !== null && attempt.secs !== undefined && attempt.secs < FAST_SECONDS && attempt.pct >= 75) {
      flags.push(`Scored ${attempt.pct}% on the Mastery Check in ${attempt.secs} second${attempt.secs === 1 ? '' : 's'}.`);
    }
    if (doc.calc_unavailable) return;
    let missing = false, mismatch = false;
    last.qs.forEach((q, i) => {
      const def = Engine.QUESTION[q.kind];
      const answer = Engine.parseNum(last.answers[i]);
      if (!def.needs || answer === null || answer === undefined) return;
      if (!q.work) { missing = true; return; }
      const asDegrees = Engine.parseCalc(q.work, true);
      const asRadians = Engine.parseCalc(q.work, false);
      const works = [asDegrees, asRadians].filter(w => w && !Engine.checkWork(w, def.needs(q)));
      if (!works.some(w => Math.abs(Math.abs(w.value) - Math.abs(answer)) < 0.01)) mismatch = true;
    });
    if (missing) flags.push('Mastery Check answers have no calculator work saved.');
    if (mismatch) flags.push('Mastery Check answers do not match the calculator work saved.');
  }

  window.Integrity = { check };
})();
