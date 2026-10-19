const { SCENARIOS } = require('../cast-data-practice/js/scenarios.js');
const { EvidenceChecker } = require('../cast-data-practice/js/evidence-checker.js');

console.log('--- Testing CAST Scenarios & EvidenceChecker ---');
console.log('Total Scenarios loaded:', SCENARIOS.length);

let failed = false;

SCENARIOS.forEach((s, idx) => {
  console.log(`[Scenario ${idx + 1}] ${s.disciplineBadge} ${s.title}`);
  if (!s.questions || !s.questions.trend || !s.questions.quantitative || !s.questions.freeResponse || !s.questions.synthesis) {
    console.error(`  FAIL: Missing questions in ${s.id}`);
    failed = true;
    return;
  }
  
  // Test that quantitative expectedValue is a number
  if (typeof s.questions.quantitative.expectedValue !== 'number') {
    console.error(`  FAIL: Quantitative expectedValue is not a number in ${s.id}`);
    failed = true;
  }

  // Test that exemplar scores 4/4 on EvidenceChecker
  const exemplarResult = EvidenceChecker.evaluate(s.questions.freeResponse.exemplar, s.questions.freeResponse);
  if (exemplarResult.score < 4) {
    console.error(`  FAIL: Exemplar scored ${exemplarResult.score}/4 in ${s.id}`);
    console.error('  Criteria:', exemplarResult.criteria);
    console.error('  Tips:', exemplarResult.actionableTips);
    failed = true;
  } else {
    console.log(`  ✓ Exemplar scored 4/4 full mastery.`);
  }

  // Test empty response scores 0
  const emptyResult = EvidenceChecker.evaluate('', s.questions.freeResponse);
  if (emptyResult.score !== 0) {
    console.error(`  FAIL: Empty response scored ${emptyResult.score} instead of 0 in ${s.id}`);
    failed = true;
  }
});

// Test vague response (no numbers or units)
const testP1 = SCENARIOS[0];
const vagueResp = "The acceleration increases when force is bigger because of newtons law.";
const vagueResult = EvidenceChecker.evaluate(vagueResp, testP1.questions.freeResponse);
console.log('\nVague response score:', vagueResult.score, 'of 4 (expected <= 2)');
console.log('Vague tips:', vagueResult.actionableTips);
if (vagueResult.score > 2) {
  console.error('FAIL: Vague response received too much credit!');
  failed = true;
} else {
  console.log('✓ Vague response correctly flagged for missing numerical evidence and units.');
}

if (failed) {
  process.exit(1);
} else {
  console.log('\n🎉 ALL SCENARIO AND EVIDENCE CHECKER TESTS PASSED WITH 100% ACCURACY!');
}
