const { SCENARIOS } = require('../cast-data-practice/js/scenarios.js');
const { EvidenceChecker } = require('../cast-data-practice/js/evidence-checker.js');

console.log('--- Testing CAST Scenarios & EvidenceChecker ---');
console.log('Total Scenarios loaded:', SCENARIOS.length);

let failed = false;

SCENARIOS.forEach((s, idx) => {
  console.log(`[Scenario ${idx + 1}] ${s.disciplineBadge} ${s.title}`);
  if (!s.questions || !s.questions.trend || !s.questions.quantitative || !s.questions.freeResponse || !s.questions.synthesis) {
    console.error(`  FAIL: Missing core questions in ${s.id}`);
    failed = true;
    return;
  }

  // 1. Validate Controlled Variables & Instrumentation
  if (!Array.isArray(s.controlledVariables) || s.controlledVariables.length === 0) {
    console.error(`  FAIL: Missing controlledVariables in ${s.id}`);
    failed = true;
  }
  if (!Array.isArray(s.calibratedInstrumentation) || s.calibratedInstrumentation.length === 0) {
    console.error(`  FAIL: Missing calibratedInstrumentation in ${s.id}`);
    failed = true;
  }

  // 2. Validate Graph Anatomy & Decoding
  const anatomy = s.questions.anatomy;
  if (!anatomy || !anatomy.independentVar || !anatomy.dependentVar || typeof anatomy.expectedLocatorValue !== 'number' || !anatomy.interceptPrompt) {
    console.error(`  FAIL: Incomplete anatomy question configuration in ${s.id}`);
    failed = true;
  }

  // 3. Validate Step-by-Step Slope Setup
  const slopeSteps = s.questions.quantitative.slopeSteps;
  if (!slopeSteps || !slopeSteps.point1 || !slopeSteps.point2 || !slopeSteps.formulaSetup || !slopeSteps.physicalMeaning) {
    console.error(`  FAIL: Incomplete slopeSteps in ${s.id}`);
    failed = true;
  }

  // 4. Validate Scaffolded Sentence Frames
  const frames = s.questions.freeResponse.sentenceFrames;
  if (!frames || !frames.claimFrame || !frames.evidenceFrame || !frames.reasoningFrame) {
    console.error(`  FAIL: Incomplete sentenceFrames in ${s.id}`);
    failed = true;
  }

  // 5. Validate Diagnostic Misconception Prompt
  const syn = s.questions.synthesis;
  if (!syn.diagnosticPrompt || !Array.isArray(syn.diagnosticOptions) || typeof syn.diagnosticCorrectIndex !== 'number') {
    console.error(`  FAIL: Incomplete diagnostic misconception question in ${s.id}`);
    failed = true;
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

// -------------------------------------------------------------
// Test Teacher Whitelist and Authorization Logic
// -------------------------------------------------------------
console.log('\n--- Testing Teacher Mode Whitelist & Auth Logic ---');
const { AUTHORIZED_TEACHERS, isAuthorizedTeacher, parseJsonText } = require('../cast-data-practice/js/app.js');

const EXPECTED_TEACHERS = [
  "cchurney@orangeusd.org",
  "ashue@orangeusd.org",
  "avelasquez@orangeusd.org",
  "egerbasi@orangeusd.org",
  "jricupito@orangeusd.org",
  "jbowling@orangeusd.org",
  "lluna@orangeusd.org",
  "oroot@orangeusd.org",
  "scourtney@orangeusd.org",
  "rmudry@orangeusd.org"
];

if (AUTHORIZED_TEACHERS.length !== 10) {
  console.error(`FAIL: Expected 10 authorized teachers, got ${AUTHORIZED_TEACHERS.length}`);
  failed = true;
}

EXPECTED_TEACHERS.forEach(email => {
  if (!isAuthorizedTeacher(email)) {
    console.error(`FAIL: Teacher ${email} failed isAuthorizedTeacher check`);
    failed = true;
  }
  // Test case-insensitivity
  if (!isAuthorizedTeacher(email.toUpperCase())) {
    console.error(`FAIL: Teacher uppercase ${email.toUpperCase()} failed isAuthorizedTeacher check`);
    failed = true;
  }
  // Test leading/trailing spaces
  if (!isAuthorizedTeacher(`  ${email}  `)) {
    console.error(`FAIL: Teacher trimmed ${email} failed isAuthorizedTeacher check`);
    failed = true;
  }
});

// Unauthorized checks
const unauthorizedEmails = [
  "student123@orangeusd.org",
  "rmudry@gmail.com",
  "random@example.com",
  "",
  null,
  undefined
];

unauthorizedEmails.forEach(email => {
  if (isAuthorizedTeacher(email)) {
    console.error(`FAIL: Unauthorized email ${email} passed isAuthorizedTeacher!`);
    failed = true;
  }
});
console.log(`✓ All 10 teachers authorized, unauthorized emails properly blocked.`);

// -------------------------------------------------------------
// Test AI JSON Parser Helper
// -------------------------------------------------------------
console.log('\n--- Testing AI JSON Parser ---');
const rawAiOutput1 = '```json\n{"title": "Sample Investigation", "dataTable": {"rows": [1,2,3]}}\n```';
const parsed1 = parseJsonText(rawAiOutput1);
if (!parsed1 || parsed1.title !== "Sample Investigation") {
  console.error('FAIL: parseJsonText failed on markdown-wrapped JSON');
  failed = true;
} else {
  console.log('✓ parseJsonText successfully parsed markdown code fenced JSON.');
}

const rawAiOutput2 = 'Here is your CAST scenario:\n{"title": "Ocean pH", "val": 42}\nHope this helps!';
const parsed2 = parseJsonText(rawAiOutput2);
if (!parsed2 || parsed2.title !== "Ocean pH" || parsed2.val !== 42) {
  console.error('FAIL: parseJsonText failed on text-surrounded JSON');
  failed = true;
} else {
  console.log('✓ parseJsonText successfully extracted embedded JSON from conversational AI output.');
}

if (failed) {
  process.exit(1);
} else {
  console.log('\n🎉 ALL SCENARIO, EVIDENCE CHECKER, AND TEACHER AUTH TESTS PASSED WITH 100% ACCURACY!');
}

