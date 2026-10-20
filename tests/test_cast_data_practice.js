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
const { AUTHORIZED_TEACHERS, isAuthorizedTeacher, parseJsonText, buildAiPromptPayload, setAiSpecialPreset } = require('../cast-data-practice/js/app.js');

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

const rawAiOutput3 = '{"title": "Friction Investigation", "background": "Paragraph 1.\nParagraph 2.", "dataTable": {"rows": [1, 2, ], }, }';
const parsed3 = parseJsonText(rawAiOutput3);
if (!parsed3 || parsed3.title !== "Friction Investigation" || !parsed3.background.includes("Paragraph 2")) {
  console.error('FAIL: parseJsonText failed on unescaped newlines or trailing commas');
  failed = true;
} else {
  console.log('✓ parseJsonText successfully repaired trailing commas and multiline string literals.');
}

// -------------------------------------------------------------
// Test AI Prompt Payload & Special Teacher Requests / Rigor
// -------------------------------------------------------------
console.log('\n--- Testing AI Prompt Payload & Grade Level Adaptations ---');

// 1. High School Default
const hsPrompt = buildAiPromptPayload({
  topic: "Hooke's Law: Spring Extension vs. Hanging Mass",
  discipline: "Physics",
  gradeLevel: "High School (Grades 9-12 / Standard CAST)"
});
if (!hsPrompt.systemInstruction.includes("HS-PS2-1") || !hsPrompt.userPrompt.includes("High School (Grades 9-12 / Standard CAST)")) {
  console.error("FAIL: Standard High School prompt payload missing expected parameters");
  failed = true;
} else {
  console.log("✓ Standard High School prompt payload generated correctly.");
}

// 2. Middle School (Lowered Grade Level)
const msPrompt = buildAiPromptPayload({
  topic: "Density of Liquid Solutions vs Salt Mass",
  discipline: "Chemistry",
  gradeLevel: "Middle School (Grades 6-8 / Accessible Vocabulary & Clean Numbers)",
  specialRequests: "Lower grade level to 7th grade; use whole integer numbers only"
});
if (!msPrompt.systemInstruction.includes("MS-PS2-2") || 
    !msPrompt.systemInstruction.includes("LOWER GRADE LEVEL DIFFERENTIATION RULES") ||
    !msPrompt.userPrompt.includes("Lower grade level to 7th grade")) {
  console.error("FAIL: Middle school prompt payload missing lower grade differentiation rules or custom requests");
  failed = true;
} else {
  console.log("✓ Middle School lowered grade level & differentiation rules correctly applied to AI prompt.");
}

// 3. Special Requests Integration
const customReqPrompt = buildAiPromptPayload({
  topic: "Photosynthesis vs Light Wavelength",
  discipline: "Biology",
  gradeLevel: "Honors / AP Science (Advanced Rigor & In-Depth CER)",
  specialRequests: "Must use spinach leaves in sodium bicarbonate; Q3 slope must equal 0.75"
});
if (!customReqPrompt.systemInstruction.includes("HONORS / AP RIGOR RULES") ||
    !customReqPrompt.userPrompt.includes("Must use spinach leaves in sodium bicarbonate")) {
  console.error("FAIL: Special customization requests missing from prompt payload");
  failed = true;
} else {
  console.log("✓ Priority teacher special requests and Honors rigor accurately integrated into AI prompt.");
}

// 4. Multi-Dataset AI Prompt Generation (2 Datasets & 3 Datasets)
const multi2Prompt = buildAiPromptPayload({
  topic: "Kinetic Friction: Smooth Track vs Rough Track",
  discipline: "Physics",
  gradeLevel: "High School (Grades 9-12 / Standard CAST)",
  datasetCount: 2,
  specialRequests: "Compare static breakaway vs kinetic friction for two surface textures"
});
if (!multi2Prompt.systemInstruction.includes("MULTI-SERIES COMPARATIVE INVESTIGATION RULES (2 Datasets)") ||
    !multi2Prompt.systemInstruction.includes('"key": "y1"') ||
    !multi2Prompt.systemInstruction.includes('"key": "y2"') ||
    !multi2Prompt.userPrompt.includes("Number of Datasets (Series): 2")) {
  console.error("FAIL: 2-Dataset AI prompt payload missing multi-series rules or schema");
  failed = true;
} else {
  console.log("✓ 2-Dataset comparative prompt payload successfully generates multi-series schema (y1, y2) and rules.");
}

const multi3Prompt = buildAiPromptPayload({
  topic: "Enzyme Catalase Activity Across Three Substrate Concentrations",
  discipline: "Biology",
  gradeLevel: "High School (Grades 9-12 / Standard CAST)",
  datasetCount: 3
});
if (!multi3Prompt.systemInstruction.includes("MULTI-SERIES COMPARATIVE INVESTIGATION RULES (3 Datasets)") ||
    !multi3Prompt.systemInstruction.includes('"key": "y3"') ||
    !multi3Prompt.userPrompt.includes("Number of Datasets (Series): 3")) {
  console.error("FAIL: 3-Dataset AI prompt payload missing 3-series rules or y3 schema");
  failed = true;
} else {
  console.log("✓ 3-Dataset comparative prompt payload successfully includes 3 distinct condition series (y1, y2, y3).");
}

// 5. Test Preset Helper (setAiSpecialPreset)
global.document = {
  getElementById: (id) => {
    if (!global._testElements) global._testElements = {};
    if (!global._testElements[id]) global._testElements[id] = { value: "" };
    return global._testElements[id];
  }
};

setAiSpecialPreset('compare-2');
const datasetVal2 = global.document.getElementById('aiDatasetsSelect').value;
const reqValCompare2 = global.document.getElementById('aiSpecialRequestsInput').value;
if (datasetVal2 !== '2' || !reqValCompare2.includes('2 comparative experimental datasets')) {
  console.error("FAIL: setAiSpecialPreset('compare-2') failed:", { datasetVal2, reqValCompare2 });
  failed = true;
} else {
  console.log("✓ setAiSpecialPreset('compare-2') correctly sets 2 Datasets and comparative prompt note.");
}

setAiSpecialPreset('compare-3');
const datasetVal3 = global.document.getElementById('aiDatasetsSelect').value;
const reqValCompare3 = global.document.getElementById('aiSpecialRequestsInput').value;
if (datasetVal3 !== '3' || !reqValCompare3.includes('3 comparative experimental datasets')) {
  console.error("FAIL: setAiSpecialPreset('compare-3') failed:", { datasetVal3, reqValCompare3 });
  failed = true;
} else {
  console.log("✓ setAiSpecialPreset('compare-3') correctly sets 3 Datasets and comparative prompt note.");
}

setAiSpecialPreset('lower-grade');
const gradeVal = global.document.getElementById('aiGradeLevelSelect').value;
const reqVal = global.document.getElementById('aiSpecialRequestsInput').value;
if (!gradeVal.includes('Middle School') || !reqVal.includes('7th-8th grade')) {
  console.error("FAIL: setAiSpecialPreset('lower-grade') failed:", { gradeVal, reqVal });
  failed = true;
} else {
  console.log("✓ setAiSpecialPreset('lower-grade') correctly sets Middle School target and request notes.");
}

setAiSpecialPreset('integers-only');
const reqVal2 = global.document.getElementById('aiSpecialRequestsInput').value;
if (!reqVal2.includes('whole integer numbers')) {
  console.error("FAIL: setAiSpecialPreset('integers-only') did not append instruction");
  failed = true;
} else {
  console.log("✓ setAiSpecialPreset('integers-only') successfully appends integer constraint.");
}

setAiSpecialPreset('clear');
if (global.document.getElementById('aiGradeLevelSelect').value !== 'High School (Grades 9-12 / Standard CAST)' ||
    global.document.getElementById('aiDatasetsSelect').value !== '1' ||
    global.document.getElementById('aiSpecialRequestsInput').value !== '') {
  console.error("FAIL: setAiSpecialPreset('clear') did not reset fields", {
    grade: global.document.getElementById('aiGradeLevelSelect').value,
    datasets: global.document.getElementById('aiDatasetsSelect').value,
    req: global.document.getElementById('aiSpecialRequestsInput').value
  });
  failed = true;
} else {
  console.log("✓ setAiSpecialPreset('clear') properly resets grade level, dataset count to 1, and special requests.");
}

if (failed) {
  process.exit(1);
} else {
  console.log('\n🎉 ALL SCENARIO, EVIDENCE CHECKER, AND TEACHER AUTH TESTS PASSED WITH 100% ACCURACY!');
}

