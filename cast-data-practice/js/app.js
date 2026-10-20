/**
 * CAST Data Analysis & Graphing Practice - Main Application Controller
 * 
 * Manages:
 * - Scenario selection and discipline filtering
 * - Dynamic Chart.js graphing with theme adaptation and trendlines
 * - Interactive multi-step questions with tolerant numerical validation
 * - Real-time Claim-Evidence-Reasoning (CER) rubric analysis via EvidenceChecker
 * - Teacher Mode for custom scenario creation and JSON export/import
 * - Firebase Authentication & student score sync to Firestore
 * - Classroom projector mode font scaling and print lab report formatting
 */

// Global State
let allScenarios = (typeof SCENARIOS !== "undefined") ? [...SCENARIOS] : [];
let activeScenarioId = (typeof SCENARIOS !== "undefined" && SCENARIOS.length > 0) ? SCENARIOS[0].id : "";
let activeDiscipline = "all";
let currentStepIndex = 0; // 0: Anatomy, 1: Trend, 2: Guided Slope, 3: CER, 4: Diagnostics
let chartInstance = null;
let currentTheme = (typeof localStorage !== "undefined" && localStorage.getItem("cast_theme")) || "light";
let currentFontSize = (typeof localStorage !== "undefined" && localStorage.getItem("cast_font_size")) || "normal";
let currentStudent = null;
let sentenceFramesVisible = true;

// Student response state keyed by scenario ID
let scenarioResponses = (typeof localStorage !== "undefined") ? JSON.parse(localStorage.getItem("cast_student_responses") || "{}") : {};

// Firebase references
let auth = null;
let db = null;

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    initThemeAndFont();
    initFirebase();
    loadCustomScenarios();
    populateScenarioDropdown();
    setupEventListeners();
    loadScenario(activeScenarioId);
  });
}

// ==========================================================================
// 1. THEME, ACCESSIBILITY & FONT SIZE SCALING
// ==========================================================================
function initThemeAndFont() {
  // Theme initialization
  document.documentElement.classList.toggle("dark", currentTheme === "dark");
  updateThemeButtonText();

  // Font size initialization
  document.documentElement.classList.remove("font-normal", "font-large", "font-projector");
  document.documentElement.classList.add(`font-${currentFontSize}`);
  updateFontSizeButtons();
}

function toggleTheme() {
  currentTheme = currentTheme === "dark" ? "light" : "dark";
  localStorage.setItem("cast_theme", currentTheme);
  document.documentElement.classList.toggle("dark", currentTheme === "dark");
  updateThemeButtonText();
  renderChart(); // Re-render canvas with new contrast palette
}

function updateThemeButtonText() {
  const btn = document.getElementById("themeToggleBtn");
  if (btn) {
    btn.innerHTML = currentTheme === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode";
  }
}

function setFontSize(size) {
  currentFontSize = size;
  localStorage.setItem("cast_font_size", size);
  document.documentElement.classList.remove("font-normal", "font-large", "font-projector");
  document.documentElement.classList.add(`font-${size}`);
  updateFontSizeButtons();
  if (chartInstance) {
    chartInstance.resize();
  }
}

function updateFontSizeButtons() {
  document.querySelectorAll(".font-size-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.size === currentFontSize);
  });
}

// ==========================================================================
// 2. FIREBASE AUTH & FIRESTORE SCORE SYNC
// ==========================================================================
function initFirebase() {
  const firebaseConfig = {
    projectId: "site-6e500",
    appId: "1:591530758858:web:1996cdca7316ffc3781a33",
    storageBucket: "site-6e500.firebasestorage.app",
    apiKey: "AIzaSyAji2nTjD2dbmzgk8gySWCy-aiQyKvR1i4",
    authDomain: "site-6e500.firebaseapp.com",
    messagingSenderId: "591530758858"
  };

  if (typeof firebase !== "undefined") {
    if (!firebase.apps.length) {
      try {
        firebase.initializeApp(firebaseConfig);
      } catch (err) {
        console.warn("[Firebase] Init error:", err);
      }
    }
    auth = firebase.auth ? firebase.auth() : null;
    db = firebase.firestore ? firebase.firestore() : null;

    if (auth) {
      auth.onAuthStateChanged(user => {
        currentStudent = user;
        updateAuthUI();
      });
    }
  }
}

function signInWithGoogle() {
  if (!auth) {
    alert("Firebase Auth is offline. Your work is saved locally in this browser.");
    return;
  }
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider).catch(err => {
    console.error("Auth error:", err);
    alert("Sign-in failed: " + err.message);
  });
}

function signOutUser() {
  if (auth) {
    auth.signOut().then(() => {
      currentStudent = null;
      updateAuthUI();
    });
  }
}

function updateAuthUI() {
  const authContainer = document.getElementById("authContainer");
  const studentPrintName = document.getElementById("printStudentName");

  if (!authContainer) return;

  if (currentStudent && currentStudent.email) {
    const studentId = currentStudent.email.split("@")[0];
    const displayName = currentStudent.displayName || studentId;
    authContainer.innerHTML = `
      <div style="display:flex; align-items:center; gap:0.4rem;">
        <span class="badge badge-physics" title="${currentStudent.email}">👤 ${displayName}</span>
        <button onclick="signOutUser()" class="btn btn-sm" title="Sign Out">Sign Out</button>
      </div>
    `;
    if (studentPrintName) {
      studentPrintName.textContent = `${displayName} (${currentStudent.email})`;
    }
  } else {
    authContainer.innerHTML = `
      <button onclick="signInWithGoogle()" class="btn btn-sm btn-primary">
        🔑 Sign In with Google
      </button>
    `;
    if (studentPrintName) {
      studentPrintName.textContent = "_______________________";
    }
  }
}

// ==========================================================================
// 3. SCENARIO MANAGEMENT & DISCIPLINE FILTERING
// ==========================================================================
function loadCustomScenarios() {
  const custom = localStorage.getItem("cast_custom_scenarios");
  if (custom) {
    try {
      const parsed = JSON.parse(custom);
      if (Array.isArray(parsed)) {
        allScenarios = [...SCENARIOS, ...parsed];
      }
    } catch (e) {
      console.error("Failed to parse custom scenarios:", e);
    }
  }
}

function filterDiscipline(discipline) {
  activeDiscipline = discipline;
  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.discipline === discipline);
  });
  populateScenarioDropdown();

  // Load first visible scenario
  const visible = getFilteredScenarios();
  if (visible.length > 0) {
    loadScenario(visible[0].id);
  }
}

function getFilteredScenarios() {
  if (activeDiscipline === "all") return allScenarios;
  return allScenarios.filter(s => s.discipline.toLowerCase() === activeDiscipline.toLowerCase());
}

function populateScenarioDropdown() {
  const select = document.getElementById("scenarioSelect");
  if (!select) return;

  const visible = getFilteredScenarios();
  select.innerHTML = visible.map(s => `
    <option value="${s.id}" ${s.id === activeScenarioId ? "selected" : ""}>
      ${s.disciplineBadge} ${s.title}
    </option>
  `).join("");
}

function getCurrentScenario() {
  return allScenarios.find(s => s.id === activeScenarioId) || allScenarios[0];
}

function getActiveResponse() {
  if (!scenarioResponses[activeScenarioId]) {
    scenarioResponses[activeScenarioId] = {
      anatomyLocatorAnswer: "",
      anatomyInterceptAnswer: null,
      trendAnswer: null,
      quantAnswer: "",
      frAnswer: "",
      synAnswer: null,
      diagnosticAnswer: null,
      scores: { anatomy: 0, trend: 0, quant: 0, fr: 0, syn: 0 },
      submitted: false,
      timestamp: null
    };
  }
  return scenarioResponses[activeScenarioId];
}

function saveResponsesLocally() {
  localStorage.setItem("cast_student_responses", JSON.stringify(scenarioResponses));
}

// ==========================================================================
// 4. LOAD & RENDER SCENARIO
// ==========================================================================
function loadScenario(scenarioId) {
  activeScenarioId = scenarioId;
  const select = document.getElementById("scenarioSelect");
  if (select) select.value = scenarioId;

  const scenario = getCurrentScenario();
  const resp = getActiveResponse();

  // Reset to Step 0 (Graph Anatomy)
  setStep(0);

  // Render Phenomenon & Metadata
  document.getElementById("scenarioTitle").textContent = scenario.title;
  document.getElementById("disciplineBadge").className = `badge badge-${scenario.discipline.toLowerCase().replace(/[^a-z]/g, '')}`;
  document.getElementById("disciplineBadge").textContent = scenario.disciplineBadge;
  document.getElementById("ngssBadge").textContent = `${scenario.ngssCode} • ${scenario.ngssTitle}`;
  document.getElementById("sepBadge").textContent = scenario.sep;
  document.getElementById("cccBadge").textContent = scenario.ccc;
  document.getElementById("phenomenonText").innerHTML = scenario.background;

  // Render Controlled Variables
  const cvList = document.getElementById("controlledVarsList");
  if (cvList && Array.isArray(scenario.controlledVariables)) {
    cvList.innerHTML = scenario.controlledVariables.map(v => `<li>${v}</li>`).join("");
  }

  // Print Report Header sync
  const printTitle = document.getElementById("printReportTitle");
  if (printTitle) printTitle.textContent = `${scenario.title} - Lab Analysis Report`;
  const printDate = document.getElementById("printDate");
  if (printDate) printDate.textContent = new Date().toLocaleDateString();

  // Render Data Table
  renderDataTable(scenario.dataTable);

  // Render Scientific Graph
  renderChart();

  // Render Question Forms
  renderStepQuestions(scenario, resp);

  // Update submission summary & 1-page print worksheet
  updateScoreSummary();
  syncPrintWorksheet();
}

function renderDataTable(tableData) {
  const container = document.getElementById("dataTableContainer");
  const captionEl = document.getElementById("tableCaption");
  if (captionEl) captionEl.textContent = tableData.caption;

  if (!container) return;

  let html = `<table class="scientific-table"><thead><tr>`;
  tableData.columns.forEach(col => {
    html += `<th>${col.label}</th>`;
  });
  html += `</tr></thead><tbody>`;

  tableData.rows.forEach((row, rowIdx) => {
    html += `<tr data-row="${rowIdx}">`;
    tableData.columns.forEach(col => {
      const val = row[col.key];
      const formatted = typeof val === "number" ? val.toFixed(col.key === "conc" ? 2 : 1) : val;
      html += `<td>${formatted}</td>`;
    });
    html += `</tr>`;
  });

  html += `</tbody></table>`;
  container.innerHTML = html;
}

// ==========================================================================
// 5. CHART.JS GRAPHING ENGINE WITH ADAPTIVE THEME
// ==========================================================================
function renderChart(forceTheme = null) {
  const canvas = document.getElementById("scenarioChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const scenario = getCurrentScenario();
  const isDark = forceTheme !== null ? (forceTheme === "dark") : (currentTheme === "dark");

  // Palette colors based on high-contrast standard
  const textColor = isDark ? "#f8fafc" : "#0f172a";
  const gridColor = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)";
  const primaryColor = isDark ? "#38bdf8" : "#0284c7";
  const secondaryColor = isDark ? "#fbbf24" : "#ea580c";

  if (chartInstance) {
    chartInstance.destroy();
  }

  const datasets = [];

  if (scenario.graphConfig && scenario.graphConfig.multiSeries) {
    // Multi-series rendering (e.g. Atlantic vs Pacific Seafloor Spreading)
    scenario.graphConfig.series.forEach((sConfig, idx) => {
      const color = idx === 0 ? primaryColor : secondaryColor;
      const pts = scenario.dataTable.rows.map(r => ({
        x: r.distance,
        y: r[sConfig.id]
      }));

      datasets.push({
        label: sConfig.label,
        data: pts,
        backgroundColor: color,
        borderColor: color,
        pointBackgroundColor: color,
        pointBorderColor: isDark ? "#0f172a" : "#ffffff",
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointStyle: sConfig.pointStyle || "circle",
        showLine: true,
        borderWidth: 2.5
      });
    });
  } else {
    // Single-series rendering
    const xCol = scenario.dataTable.columns.find(c => c.isX);
    const yCol = scenario.dataTable.columns.find(c => c.isY);

    const pts = scenario.dataTable.rows.map(r => ({
      x: r[xCol.key],
      y: r[yCol.key]
    }));

    datasets.push({
      label: `${scenario.yAxis.label} (${scenario.yAxis.unit})`,
      data: pts,
      backgroundColor: primaryColor,
      borderColor: primaryColor,
      pointBackgroundColor: primaryColor,
      pointBorderColor: isDark ? "#0f172a" : "#ffffff",
      pointBorderWidth: 2,
      pointRadius: 6,
      pointHoverRadius: 9,
      showLine: scenario.chartType === "line",
      tension: scenario.chartType === "line" ? 0.2 : 0,
      borderWidth: 2.5
    });

    // Optional linear best-fit line
    if (scenario.graphConfig && scenario.graphConfig.slope !== undefined) {
      const minX = scenario.xAxis.min || 0;
      const maxX = scenario.xAxis.suggestedMax || Math.max(...pts.map(p => p.x));
      const m = scenario.graphConfig.slope;
      const b = scenario.graphConfig.intercept || 0;

      datasets.push({
        label: "Linear Best-Fit Trendline",
        data: [
          { x: minX, y: m * minX + b },
          { x: maxX, y: m * maxX + b }
        ],
        borderColor: isDark ? "#a855f7" : "#7c3aed",
        borderDash: [6, 6],
        borderWidth: 2,
        pointRadius: 0,
        fill: false,
        showLine: true
      });
    }
  }

  // Equation and slope meaning badges
  const eqEl = document.getElementById("graphEquationBadge");
  const meaningEl = document.getElementById("graphSlopeMeaningBadge");
  if (eqEl) eqEl.textContent = scenario.graphConfig.equation || "Non-linear Trend";
  if (meaningEl) meaningEl.textContent = scenario.graphConfig.slopeMeaning || "";

  chartInstance = new Chart(ctx, {
    type: "scatter",
    data: { datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 400 },
      plugins: {
        legend: {
          display: true,
          position: "top",
          labels: {
            color: textColor,
            font: { size: 12, weight: "700" },
            boxWidth: 14
          }
        },
        tooltip: {
          backgroundColor: isDark ? "#1e293b" : "#0f172a",
          titleColor: "#ffffff",
          bodyColor: "#f1f5f9",
          titleFont: { weight: "800" },
          padding: 10,
          cornerRadius: 8,
          callbacks: {
            label: function(ctx) {
              const xVal = ctx.parsed.x;
              const yVal = ctx.parsed.y;
              return `${ctx.dataset.label || ''}: (${xVal} ${scenario.xAxis.unit}, ${yVal} ${scenario.yAxis.unit})`;
            }
          }
        }
      },
      scales: {
        x: {
          type: "linear",
          title: {
            display: true,
            text: `${scenario.xAxis.label} [${scenario.xAxis.symbol}] (${scenario.xAxis.unit})`,
            color: textColor,
            font: { size: 13, weight: "800" }
          },
          ticks: {
            color: textColor,
            font: { weight: "600" }
          },
          grid: { color: gridColor },
          min: scenario.xAxis.min !== undefined ? scenario.xAxis.min : undefined,
          suggestedMax: scenario.xAxis.suggestedMax
        },
        y: {
          type: "linear",
          title: {
            display: true,
            text: `${scenario.yAxis.label} [${scenario.yAxis.symbol}] (${scenario.yAxis.unit})`,
            color: textColor,
            font: { size: 13, weight: "800" }
          },
          ticks: {
            color: textColor,
            font: { weight: "600" }
          },
          grid: { color: gridColor },
          min: scenario.yAxis.min !== undefined ? scenario.yAxis.min : undefined,
          suggestedMax: scenario.yAxis.suggestedMax
        }
      }
    }
  });
}

// ==========================================================================
// 6. QUESTION STEPPER & VALIDATION LOGIC
// ==========================================================================
function setStep(stepIndex) {
  currentStepIndex = stepIndex;

  // Update tabs
  document.querySelectorAll(".step-tab-btn").forEach((btn, idx) => {
    btn.classList.toggle("active", idx === stepIndex);
  });

  // Update question panels
  document.querySelectorAll(".question-panel").forEach((panel, idx) => {
    panel.classList.toggle("active", idx === stepIndex);
  });
}

function renderStepQuestions(scenario, resp) {
  // --- PART 1: GRAPH READING & ANATOMY ---
  const anatomy = scenario.questions.anatomy;
  const xDisplay = document.getElementById("anatomyXDisplay");
  const yDisplay = document.getElementById("anatomyYDisplay");
  const locPrompt = document.getElementById("anatomyLocatorPrompt");
  const locInput = document.getElementById("anatomyLocatorInput");
  const locUnit = document.getElementById("anatomyLocatorUnit");
  const locFeedback = document.getElementById("anatomyLocatorFeedback");
  const intPrompt = document.getElementById("anatomyInterceptPrompt");
  const intOptions = document.getElementById("anatomyInterceptOptions");
  const intFeedback = document.getElementById("anatomyInterceptFeedback");

  if (xDisplay && anatomy) xDisplay.textContent = anatomy.independentVar;
  if (yDisplay && anatomy) yDisplay.textContent = anatomy.dependentVar;
  if (locPrompt && anatomy) locPrompt.textContent = anatomy.locatorPrompt;
  if (locUnit && anatomy) locUnit.textContent = anatomy.locatorUnit;
  if (locInput) locInput.value = resp.anatomyLocatorAnswer || "";
  if (locFeedback) {
    if (resp.anatomyLocatorAnswer !== "") {
      checkLocatorCalculation(false);
    } else {
      locFeedback.className = "feedback-box";
      locFeedback.style.display = "none";
    }
  }

  if (intPrompt && anatomy) intPrompt.textContent = anatomy.interceptPrompt;
  if (intOptions && anatomy) {
    intOptions.innerHTML = anatomy.interceptOptions.map((opt, idx) => `
      <label class="mcq-label ${resp.anatomyInterceptAnswer === idx ? 'selected' : ''}" onclick="selectAnatomyInterceptOption(${idx})">
        <input type="radio" name="interceptRadio" class="mcq-radio" ${resp.anatomyInterceptAnswer === idx ? 'checked' : ''}>
        <span>${opt}</span>
      </label>
    `).join("");
  }
  if (intFeedback && anatomy) {
    if (resp.anatomyInterceptAnswer !== null) {
      showAnatomyInterceptFeedback(resp.anatomyInterceptAnswer, anatomy);
    } else {
      intFeedback.className = "feedback-box";
      intFeedback.style.display = "none";
    }
  }

  // --- PART 2: TREND IDENTIFICATION ---
  const trendPrompt = document.getElementById("trendPrompt");
  const trendOptions = document.getElementById("trendOptions");
  const trendFeedback = document.getElementById("trendFeedback");

  if (trendPrompt) trendPrompt.textContent = scenario.questions.trend.prompt;
  if (trendOptions) {
    trendOptions.innerHTML = scenario.questions.trend.options.map((opt, idx) => `
      <label class="mcq-label ${resp.trendAnswer === idx ? 'selected' : ''}" onclick="selectTrendOption(${idx})">
        <input type="radio" name="trendRadio" class="mcq-radio" ${resp.trendAnswer === idx ? 'checked' : ''}>
        <span>${opt}</span>
      </label>
    `).join("");
  }
  if (trendFeedback) {
    if (resp.trendAnswer !== null) {
      showTrendFeedback(resp.trendAnswer, scenario.questions.trend);
    } else {
      trendFeedback.className = "feedback-box";
      trendFeedback.style.display = "none";
    }
  }

  // --- PART 3: GUIDED MATHEMATICAL ANALYSIS & SLOPE ---
  const slopeSteps = scenario.questions.quantitative.slopeSteps;
  const slopeCoordDisplay = document.getElementById("slopeCoordDisplay");
  const slopeFormulaDisplay = document.getElementById("slopeFormulaDisplay");
  const slopeMeaningDisplay = document.getElementById("slopeMeaningDisplay");
  const quantPrompt = document.getElementById("quantPrompt");
  const quantInput = document.getElementById("quantInput");
  const quantUnit = document.getElementById("quantUnit");
  const quantFeedback = document.getElementById("quantFeedback");

  if (slopeSteps) {
    if (slopeCoordDisplay) slopeCoordDisplay.textContent = `${slopeSteps.point1.label}  •  ${slopeSteps.point2.label}`;
    if (slopeFormulaDisplay) slopeFormulaDisplay.textContent = slopeSteps.formulaSetup;
    if (slopeMeaningDisplay) slopeMeaningDisplay.textContent = slopeSteps.physicalMeaning;
  }

  if (quantPrompt) quantPrompt.textContent = scenario.questions.quantitative.prompt;
  if (quantUnit) quantUnit.textContent = scenario.questions.quantitative.unit;
  if (quantInput) quantInput.value = resp.quantAnswer || "";
  if (quantFeedback) {
    if (resp.quantAnswer !== "") {
      checkQuantitativeCalculation(false);
    } else {
      quantFeedback.className = "feedback-box";
      quantFeedback.style.display = "none";
    }
  }

  // --- PART 4: FREE RESPONSE (CER) & SENTENCE FRAMES ---
  const frPrompt = document.getElementById("frPrompt");
  const frTextarea = document.getElementById("frTextarea");
  const frames = scenario.questions.freeResponse.sentenceFrames;

  if (frPrompt) frPrompt.textContent = scenario.questions.freeResponse.prompt;
  if (frTextarea) frTextarea.value = resp.frAnswer || "";

  if (frames) {
    const fClaim = document.getElementById("frameClaimText");
    const fEvid = document.getElementById("frameEvidenceText");
    const fReas = document.getElementById("frameReasoningText");
    if (fClaim) fClaim.textContent = frames.claimFrame;
    if (fEvid) fEvid.textContent = frames.evidenceFrame;
    if (fReas) fReas.textContent = frames.reasoningFrame;
  }

  // Evaluate CER live
  evaluateFreeResponseLive();

  // --- PART 5: SYNTHESIS & MISCONCEPTION DIAGNOSTICS ---
  const synPrompt = document.getElementById("synPrompt");
  const synOptions = document.getElementById("synOptions");
  const synFeedback = document.getElementById("synFeedback");
  const diagPrompt = document.getElementById("diagnosticPrompt");
  const diagOptions = document.getElementById("diagnosticOptions");
  const diagFeedback = document.getElementById("diagnosticFeedback");

  if (synPrompt) synPrompt.textContent = scenario.questions.synthesis.prompt;
  if (synOptions) {
    synOptions.innerHTML = scenario.questions.synthesis.options.map((opt, idx) => `
      <label class="mcq-label ${resp.synAnswer === idx ? 'selected' : ''}" onclick="selectSynOption(${idx})">
        <input type="radio" name="synRadio" class="mcq-radio" ${resp.synAnswer === idx ? 'checked' : ''}>
        <span>${opt}</span>
      </label>
    `).join("");
  }
  if (synFeedback) {
    if (resp.synAnswer !== null) {
      showSynFeedback(resp.synAnswer, scenario.questions.synthesis);
    } else {
      synFeedback.className = "feedback-box";
      synFeedback.style.display = "none";
    }
  }

  if (diagPrompt) diagPrompt.textContent = scenario.questions.synthesis.diagnosticPrompt;
  if (diagOptions) {
    diagOptions.innerHTML = scenario.questions.synthesis.diagnosticOptions.map((opt, idx) => `
      <label class="mcq-label ${resp.diagnosticAnswer === idx ? 'selected' : ''}" onclick="selectDiagnosticOption(${idx})">
        <input type="radio" name="diagnosticRadio" class="mcq-radio" ${resp.diagnosticAnswer === idx ? 'checked' : ''}>
        <span>${opt}</span>
      </label>
    `).join("");
  }
  if (diagFeedback) {
    if (resp.diagnosticAnswer !== null) {
      showDiagnosticFeedback(resp.diagnosticAnswer, scenario.questions.synthesis);
    } else {
      diagFeedback.className = "feedback-box";
      diagFeedback.style.display = "none";
    }
  }
}

// Option selection & calculation: Anatomy Coordinate Locator
function checkLocatorCalculation(showAlert = true) {
  const scenario = getCurrentScenario();
  const resp = getActiveResponse();
  const inputEl = document.getElementById("anatomyLocatorInput");
  const fb = document.getElementById("anatomyLocatorFeedback");
  if (!inputEl || !fb || !scenario.questions.anatomy) return;

  const valStr = inputEl.value.trim();
  resp.anatomyLocatorAnswer = valStr;

  if (valStr === "") {
    if (showAlert) fb.className = "feedback-box show feedback-info";
    fb.innerHTML = "Please enter the coordinate value from the graph.";
    return;
  }

  const val = parseFloat(valStr);
  const target = scenario.questions.anatomy.expectedLocatorValue;
  const tol = scenario.questions.anatomy.locatorTolerance || 0.2;

  const isCorrect = !isNaN(val) && Math.abs(val - target) <= tol;
  recomputeAnatomyScore();
  saveResponsesLocally();

  fb.className = `feedback-box show ${isCorrect ? 'feedback-correct' : 'feedback-incorrect'}`;
  if (isCorrect) {
    fb.innerHTML = `<strong>✓ Coordinate Located Accurately!</strong><p style="margin-top:0.25rem;">You correctly located ${val} ${scenario.questions.anatomy.locatorUnit} on the dependent axis.</p>`;
  } else {
    fb.innerHTML = `<strong>⚠️ Check Axis Grid Coordinates</strong><p style="margin-top:0.25rem;">Trace the grid lines vertically from the specified value on the horizontal axis.</p>`;
  }
  updateScoreSummary();
}

function selectAnatomyInterceptOption(idx) {
  const scenario = getCurrentScenario();
  const resp = getActiveResponse();
  resp.anatomyInterceptAnswer = idx;

  const anatomy = scenario.questions.anatomy;
  const isCorrect = idx === anatomy.interceptCorrectIndex;
  recomputeAnatomyScore();
  saveResponsesLocally();

  document.querySelectorAll("#anatomyInterceptOptions .mcq-label").forEach((lbl, i) => {
    lbl.classList.toggle("selected", i === idx);
    lbl.classList.toggle("correct", i === idx && isCorrect);
    lbl.classList.toggle("incorrect", i === idx && !isCorrect);
  });

  showAnatomyInterceptFeedback(idx, anatomy);
  updateScoreSummary();
}

function showAnatomyInterceptFeedback(idx, anatomy) {
  const fb = document.getElementById("anatomyInterceptFeedback");
  if (!fb) return;

  const isCorrect = idx === anatomy.interceptCorrectIndex;
  fb.className = `feedback-box show ${isCorrect ? 'feedback-correct' : 'feedback-incorrect'}`;
  fb.innerHTML = `
    <strong>${isCorrect ? "✓ Intercept Concept Mastered!" : "⚠️ Revisit Physical Meaning of Intercept"}</strong>
    <p style="margin-top:0.35rem;">${anatomy.interceptExplanation}</p>
  `;
}

function recomputeAnatomyScore() {
  const scenario = getCurrentScenario();
  const resp = getActiveResponse();
  const anatomy = scenario.questions.anatomy;
  if (!anatomy) return;

  const val = parseFloat(resp.anatomyLocatorAnswer);
  const target = anatomy.expectedLocatorValue;
  const tol = anatomy.locatorTolerance || 0.2;
  const locCorrect = !isNaN(val) && Math.abs(val - target) <= tol;
  const intCorrect = resp.anatomyInterceptAnswer === anatomy.interceptCorrectIndex;

  // Award 1 full point if both coordinate locator and intercept conceptual questions pass
  resp.scores.anatomy = (locCorrect && intCorrect) ? 1 : 0;
}

// Option selection: Sentence Frames Toggle
function toggleSentenceFrames() {
  sentenceFramesVisible = !sentenceFramesVisible;
  const content = document.getElementById("sentenceFramesContent");
  const btn = document.getElementById("btnToggleFrames");
  if (content) content.style.display = sentenceFramesVisible ? "block" : "none";
  if (btn) btn.textContent = sentenceFramesVisible ? "Hide Guides" : "Show Guides";
}

// Option selection: Misconception Diagnostics
function selectDiagnosticOption(idx) {
  const scenario = getCurrentScenario();
  const resp = getActiveResponse();
  resp.diagnosticAnswer = idx;

  const syn = scenario.questions.synthesis;
  const isCorrect = idx === syn.diagnosticCorrectIndex;
  saveResponsesLocally();

  document.querySelectorAll("#diagnosticOptions .mcq-label").forEach((lbl, i) => {
    lbl.classList.toggle("selected", i === idx);
    lbl.classList.toggle("correct", i === idx && isCorrect);
    lbl.classList.toggle("incorrect", i === idx && !isCorrect);
  });

  showDiagnosticFeedback(idx, syn);
}

function showDiagnosticFeedback(idx, syn) {
  const fb = document.getElementById("diagnosticFeedback");
  if (!fb) return;

  const isCorrect = idx === syn.diagnosticCorrectIndex;
  fb.className = `feedback-box show ${isCorrect ? 'feedback-correct' : 'feedback-incorrect'}`;
  fb.innerHTML = `
    <strong>${isCorrect ? "✓ Misconception Successfully Debunked!" : "⚠️ Common Student Misconception"}</strong>
    <p style="margin-top:0.35rem;">${syn.diagnosticExplanation}</p>
  `;
}

// Option selection: Trend
function selectTrendOption(idx) {
  const scenario = getCurrentScenario();
  const resp = getActiveResponse();
  resp.trendAnswer = idx;

  const isCorrect = idx === scenario.questions.trend.correctIndex;
  resp.scores.trend = isCorrect ? 1 : 0;
  saveResponsesLocally();

  // Highlight selection
  document.querySelectorAll("#trendOptions .mcq-label").forEach((lbl, i) => {
    lbl.classList.toggle("selected", i === idx);
    lbl.classList.toggle("correct", i === idx && isCorrect);
    lbl.classList.toggle("incorrect", i === idx && !isCorrect);
  });

  showTrendFeedback(idx, scenario.questions.trend);
  updateScoreSummary();
}

function showTrendFeedback(idx, trendConfig) {
  const fb = document.getElementById("trendFeedback");
  if (!fb) return;

  const isCorrect = idx === trendConfig.correctIndex;
  fb.className = `feedback-box show ${isCorrect ? 'feedback-correct' : 'feedback-incorrect'}`;
  fb.innerHTML = `
    <strong>${isCorrect ? "✓ Correct Trend Identified! (+1 pt)" : "⚠️ Incorrect Trend Selection"}</strong>
    <p style="margin-top:0.35rem;">${trendConfig.explanation}</p>
  `;
}

// Calculation check: Quantitative
function checkQuantitativeCalculation(showAlert = true) {
  const scenario = getCurrentScenario();
  const resp = getActiveResponse();
  const inputEl = document.getElementById("quantInput");
  const fb = document.getElementById("quantFeedback");
  if (!inputEl || !fb) return;

  const valStr = inputEl.value.trim();
  resp.quantAnswer = valStr;

  if (valStr === "") {
    if (showAlert) fb.className = "feedback-box show feedback-info";
    fb.innerHTML = "Please enter a calculated numerical value.";
    return;
  }

  const val = parseFloat(valStr);
  const target = scenario.questions.quantitative.expectedValue;
  const tol = scenario.questions.quantitative.tolerance || (Math.abs(target) * 0.05);

  const isCorrect = !isNaN(val) && Math.abs(val - target) <= tol;
  resp.scores.quant = isCorrect ? 1 : 0;
  saveResponsesLocally();

  fb.className = `feedback-box show ${isCorrect ? 'feedback-correct' : 'feedback-incorrect'}`;
  if (isCorrect) {
    fb.innerHTML = `
      <strong>✓ Calculation Verified! (+1 pt)</strong>
      <p style="margin-top:0.35rem;">Excellent data analysis. Your rate of change matches the calculated slope (${target} ${scenario.questions.quantitative.unit}).</p>
    `;
  } else {
    fb.innerHTML = `
      <strong>⚠️ Review Your Calculation</strong>
      <p style="margin-top:0.35rem;">${scenario.questions.quantitative.hint}</p>
    `;
  }
  updateScoreSummary();
}

// Live CER Evidence Analysis
function evaluateFreeResponseLive() {
  const scenario = getCurrentScenario();
  const resp = getActiveResponse();
  const textarea = document.getElementById("frTextarea");
  if (!textarea) return;

  const text = textarea.value;
  resp.frAnswer = text;

  // Run EvidenceChecker
  const result = EvidenceChecker.evaluate(text, scenario.questions.freeResponse);
  resp.scores.fr = result.score;
  saveResponsesLocally();

  // Render Rubric Meter
  const scoreBadge = document.getElementById("frRubricScoreBadge");
  const criteriaList = document.getElementById("frCriteriaList");
  const tipsBox = document.getElementById("frActionableTipsBox");
  const overallFeedback = document.getElementById("frOverallFeedback");

  if (scoreBadge) scoreBadge.textContent = `${result.score} / ${result.maxScore} Pts`;
  if (overallFeedback) overallFeedback.textContent = result.overallFeedback;

  if (criteriaList) {
    criteriaList.innerHTML = result.criteria.map(crit => `
      <div class="criterion-item ${crit.earned ? 'checklist-passed' : 'checklist-missing'}">
        <span class="criterion-status-icon">${crit.earned ? '✅' : '⏳'}</span>
        <div class="criterion-details">
          <div class="criterion-name">
            ${crit.name}
            <span class="badge ${crit.earned ? 'badge-physics' : ''}" style="font-size:0.65rem;">
              ${crit.points} / ${crit.maxPoints} pt
            </span>
          </div>
          <div class="criterion-feedback">${crit.feedback}</div>
        </div>
      </div>
    `).join("");
  }

  if (tipsBox) {
    if (result.actionableTips.length > 0) {
      tipsBox.style.display = "block";
      tipsBox.innerHTML = `
        <strong>💡 Next Steps to Earn Full 4/4 Points:</strong>
        <ul>
          ${result.actionableTips.map(tip => `<li>${tip}</li>`).join("")}
        </ul>
      `;
    } else {
      tipsBox.style.display = "none";
    }
  }

  // Update print preview text
  const printCERText = document.getElementById("printCERResponse");
  if (printCERText) printCERText.textContent = text || "[No written response entered]";
  const printCERScore = document.getElementById("printCERScore");
  if (printCERScore) printCERScore.textContent = `${result.score} / 4 Pts`;

  updateScoreSummary();
}

// Option selection: Synthesis
function selectSynOption(idx) {
  const scenario = getCurrentScenario();
  const resp = getActiveResponse();
  resp.synAnswer = idx;

  const isCorrect = idx === scenario.questions.synthesis.correctIndex;
  resp.scores.syn = isCorrect ? 1 : 0;
  saveResponsesLocally();

  document.querySelectorAll("#synOptions .mcq-label").forEach((lbl, i) => {
    lbl.classList.toggle("selected", i === idx);
    lbl.classList.toggle("correct", i === idx && isCorrect);
    lbl.classList.toggle("incorrect", i === idx && !isCorrect);
  });

  showSynFeedback(idx, scenario.questions.synthesis);
  updateScoreSummary();
}

function showSynFeedback(idx, synConfig) {
  const fb = document.getElementById("synFeedback");
  if (!fb) return;

  const isCorrect = idx === synConfig.correctIndex;
  fb.className = `feedback-box show ${isCorrect ? 'feedback-correct' : 'feedback-incorrect'}`;
  fb.innerHTML = `
    <strong>${isCorrect ? "✓ Extrapolation Verified! (+1 pt)" : "⚠️ Re-evaluate Extrapolation Model"}</strong>
    <p style="margin-top:0.35rem;">${synConfig.explanation}</p>
  `;
}

// Update Master Score & Checklist
function updateScoreSummary() {
  const resp = getActiveResponse();
  const total = (resp.scores.anatomy || 0) + (resp.scores.trend || 0) + (resp.scores.quant || 0) + (resp.scores.fr || 0) + (resp.scores.syn || 0);
  const maxTotal = 8; // 1 (anatomy) + 1 (trend) + 1 (quant) + 4 (fr) + 1 (syn)

  const scoreEl = document.getElementById("totalScoreDisplay");
  if (scoreEl) scoreEl.textContent = `${total} / ${maxTotal}`;

  const pct = Math.round((total / maxTotal) * 100);
  const pctEl = document.getElementById("masteryPercentDisplay");
  if (pctEl) pctEl.textContent = `${pct}% Mastery`;

  // Update Step Tabs completed markers (5 steps: 0=Anatomy, 1=Trend, 2=Slope, 3=CER, 4=Diagnostics)
  const tab0 = document.getElementById("stepTab-0");
  const tab1 = document.getElementById("stepTab-1");
  const tab2 = document.getElementById("stepTab-2");
  const tab3 = document.getElementById("stepTab-3");
  const tab4 = document.getElementById("stepTab-4");

  if (tab0) tab0.classList.toggle("completed", resp.scores.anatomy === 1);
  if (tab1) tab1.classList.toggle("completed", resp.scores.trend === 1);
  if (tab2) tab2.classList.toggle("completed", resp.scores.quant === 1);
  if (tab3) tab3.classList.toggle("completed", resp.scores.fr >= 3);
  if (tab4) tab4.classList.toggle("completed", resp.scores.syn === 1);

  // Print Report sync
  const printScore = document.getElementById("printMasteryScore");
  if (printScore) printScore.textContent = `${total} / ${maxTotal} Pts (${pct}%)`;
}

// ==========================================================================
// 7. SUBMIT WORK TO FIRESTORE (STUDENT-PERMISSION LAW COMPLIANT)
// ==========================================================================
async function submitWorkToFirestore() {
  if (!currentStudent || !currentStudent.email) {
    alert("Please sign in with your school Google account (@orangeusd.org) to submit your assignment.");
    signInWithGoogle();
    return;
  }

  if (!db) {
    alert("Firestore is currently unreachable. Your responses remain saved in this browser.");
    return;
  }

  const studentId = currentStudent.email.split("@")[0].toLowerCase();
  const scenario = getCurrentScenario();
  const resp = getActiveResponse();

  const total = (resp.scores.anatomy || 0) + (resp.scores.trend || 0) + (resp.scores.quant || 0) + (resp.scores.fr || 0) + (resp.scores.syn || 0);
  const maxTotal = 8;
  const pct = Math.round((total / maxTotal) * 100);

  const submitBtn = document.getElementById("submitToFirestoreBtn");
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "⏳ Submitting Score...";
  }

  // Construct payload with SANITIZED variables (no undefined values!)
  const payload = {
    studentId: studentId,
    studentEmail: currentStudent.email.toLowerCase(),
    studentName: currentStudent.displayName || studentId,
    scenarioId: scenario.id,
    scenarioTitle: scenario.title,
    discipline: scenario.discipline,
    ngssCode: scenario.ngssCode,
    anatomyLocatorAnswer: resp.anatomyLocatorAnswer || "",
    anatomyInterceptAnswer: resp.anatomyInterceptAnswer !== undefined && resp.anatomyInterceptAnswer !== null ? resp.anatomyInterceptAnswer : null,
    trendAnswer: resp.trendAnswer !== undefined && resp.trendAnswer !== null ? resp.trendAnswer : null,
    quantAnswer: resp.quantAnswer || "",
    freeResponseText: resp.frAnswer || "",
    synAnswer: resp.synAnswer !== undefined && resp.synAnswer !== null ? resp.synAnswer : null,
    diagnosticAnswer: resp.diagnosticAnswer !== undefined && resp.diagnosticAnswer !== null ? resp.diagnosticAnswer : null,
    scores: {
      anatomy: resp.scores.anatomy || 0,
      trend: resp.scores.trend || 0,
      quant: resp.scores.quant || 0,
      freeResponse: resp.scores.fr || 0,
      synthesis: resp.scores.syn || 0,
      total: total,
      maxPossible: maxTotal,
      percentage: pct
    },
    submittedAt: firebase.firestore.FieldValue.serverTimestamp(),
    timestampIso: new Date().toISOString()
  };

  try {
    // Follow Firestore Student-Permission Law:
    // Write directly to student subdoc under practice_results. NEVER write parent doc!
    await db.collection("practice_results")
      .doc("cast_data_practice")
      .collection("students")
      .doc(studentId)
      .set(payload, { merge: true });

    resp.submitted = true;
    resp.timestamp = new Date().toLocaleString();
    saveResponsesLocally();

    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.className = "btn btn-success";
      submitBtn.innerHTML = `✓ Submitted to Gradebook (${pct}%)`;
    }

    alert(`🎉 Success! Your response for "${scenario.title}" was submitted to the gradebook.\n\nScore: ${total} / ${maxTotal} points (${pct}%).`);
  } catch (err) {
    console.error("Firestore submission error:", err);
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "🚀 Submit to Gradebook";
    }
    alert("Submission error: " + err.message + "\nYour work is still saved locally.");
  }
}

// ==========================================================================
// 8. TEACHER MODE, AUTHENTICATION & AI SCENARIO GENERATOR
// ==========================================================================
const AUTHORIZED_TEACHERS = [
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

function isAuthorizedTeacher(email) {
  if (!email || typeof email !== "string") return false;
  return AUTHORIZED_TEACHERS.includes(email.toLowerCase().trim());
}

async function openTeacherModal() {
  if (!auth) {
    alert("Firebase Auth is offline. Please check your network connection.");
    return;
  }

  // 1. Enforce Google Sign-In if not already authenticated
  if (!currentStudent || !currentStudent.email) {
    const shouldSignIn = confirm(
      "🛠️ Teacher Mode & Scenario Studio is restricted to authorized science department faculty.\n\n" +
      "Click OK to sign in with your district Google account (@orangeusd.org)."
    );
    if (!shouldSignIn) return;

    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      const result = await auth.signInWithPopup(provider);
      currentStudent = result.user;
      updateAuthUI();
    } catch (err) {
      console.warn("Teacher sign-in error:", err);
      alert("Sign-in was cancelled or encountered an error: " + err.message);
      return;
    }
  }

  // 2. Validate against authorized teacher whitelist
  const teacherEmail = (currentStudent.email || "").toLowerCase().trim();
  if (!isAuthorizedTeacher(teacherEmail)) {
    alert(
      `🚫 Access Restricted\n\n` +
      `Teacher Mode is reserved exclusively for authorized science department faculty.\n\n` +
      `Signed in as: ${teacherEmail}\n\n` +
      `If you are an OUSD science instructor, please contact Mr. Mudry (rmudry@orangeusd.org) for access.`
    );
    return;
  }

  // 3. Update verified faculty status in modal
  const authStatusEl = document.getElementById("teacherAuthStatus");
  if (authStatusEl) {
    authStatusEl.innerHTML = `Signed in as: <strong style="color:var(--text-main);">${teacherEmail}</strong> <span class="badge badge-physics" style="font-size:0.7rem; margin-left:0.35rem;">✓ Verified Faculty</span>`;
  }

  const modal = document.getElementById("teacherModal");
  if (modal) modal.style.display = "flex";
}

function closeTeacherModal() {
  const modal = document.getElementById("teacherModal");
  if (modal) modal.style.display = "none";
}

function setAiTopicExample(topic, discipline) {
  const topicInput = document.getElementById("aiTopicInput");
  const discSelect = document.getElementById("aiDisciplineSelect");
  if (topicInput) topicInput.value = topic;
  if (discSelect && discipline) discSelect.value = discipline;
}

// Helper to extract valid JSON from Gemini AI text output
function parseJsonText(rawText) {
  if (!rawText) return null;
  try {
    let cleaned = rawText.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    }
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace > -1 && lastBrace > -1) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("Error parsing AI JSON:", e, rawText);
    return null;
  }
}

let isGeneratingAi = false;

async function generateAiScenario() {
  if (isGeneratingAi) return;

  const topicInput = document.getElementById("aiTopicInput");
  const discSelect = document.getElementById("aiDisciplineSelect");
  const topic = topicInput ? topicInput.value.trim() : "";
  const discipline = discSelect ? discSelect.value : "Physics";

  if (!topic) {
    alert("Please enter an investigation topic, lab experiment, or phenomenon first.");
    if (topicInput) topicInput.focus();
    return;
  }

  const generateBtn = document.getElementById("btnAiGenerate");
  const statusContainer = document.getElementById("aiStatusContainer");
  const statusText = document.getElementById("aiStatusText");
  const successBanner = document.getElementById("aiSuccessBanner");

  if (generateBtn) generateBtn.disabled = true;
  if (statusContainer) statusContainer.style.display = "inline-flex";
  if (statusText) statusText.textContent = "Connecting to Gemini AI...";
  if (successBanner) successBanner.style.display = "none";
  isGeneratingAi = true;

  try {
    // Option B: Retrieve chatProxyUrl from Firestore system_config/chat_config or localStorage
    let proxyUrl = localStorage.getItem("gemini_proxy_url") || "";
    const apiKey = localStorage.getItem("gemini_api_key") || "";

    if (!proxyUrl && !apiKey && db) {
      if (statusText) statusText.textContent = "Locating AI proxy config...";
      try {
        const configDoc = await db.collection("system_config").doc("chat_config").get();
        if (configDoc.exists && configDoc.data().chatProxyUrl) {
          proxyUrl = configDoc.data().chatProxyUrl;
        }
      } catch (err) {
        console.warn("Could not load chat_config doc from Firestore:", err);
      }
    }

    if (!proxyUrl && !apiKey) {
      const customKey = prompt(
        "AI Proxy URL not found in system_config/chat_config.\n\n" +
        "Please enter your Gemini API Key or Custom Proxy URL to generate this scenario:"
      );
      if (!customKey) {
        if (generateBtn) generateBtn.disabled = false;
        if (statusContainer) statusContainer.style.display = "none";
        isGeneratingAi = false;
        return;
      }
      if (customKey.startsWith("http")) {
        proxyUrl = customKey.trim();
        localStorage.setItem("gemini_proxy_url", proxyUrl);
      } else {
        localStorage.setItem("gemini_api_key", customKey.trim());
      }
    }

    if (statusText) statusText.textContent = "Synthesizing CAST data & 5-part inquiry...";

    const systemInstruction = `You are a premier high school science curriculum specialist and CAST (California Science Test) assessment architect. 
Generate a complete, rigorous, standards-aligned science investigation and data analysis performance task based on the user's topic.

CRITICAL RULES:
1. STRICT NO-LATEX POLICY: Never use LaTeX syntax (e.g. no \\Delta, no \\frac, no \\vec, no $...$). Use standard plain text and Unicode symbols: Δ, ², ³, °, °C, x₀, v₀, m/s², and HTML <strong> for bold variables.
2. CAST 5-PART ARCHITECTURE: Return a single valid JSON object containing:
   - title: Engaging scientific title
   - discipline: "${discipline}"
   - disciplineBadge: "${discipline === "Physics" ? "⚛️ Physics" : (discipline === "Biology" ? "🌿 Biology" : (discipline === "Chemistry" ? "🧪 Chemistry" : "🌋 Earth & Space"))}"
   - ngssCode: Relevant NGSS PE Code (e.g. HS-PS2-1, HS-LS1-5, HS-PS1-5, HS-ESS2-2)
   - ngssTitle: NGSS Core Topic Title
   - sep: "SEP-4: Analyzing and Interpreting Data"
   - ccc: "CCC-1: Patterns"
   - chartType: "scatter"
   - xAxis: { label: string, symbol: string, unit: string, min: 0, suggestedMax: number }
   - yAxis: { label: string, symbol: string, unit: string, min: 0, suggestedMax: number }
   - background: 2 paragraphs explaining experimental context, procedure, and apparatus.
   - controlledVariables: Array of 3-4 strings detailing specific controlled variables.
   - calibratedInstrumentation: Array of 2-3 strings detailing precision sensors/instruments.
   - dataTable: {
       caption: "Table 1: Measured ...",
       columns: [
         { key: "trial", label: "Trial #", isText: true },
         { key: "x", label: "...", isX: true, unit: "..." },
         { key: "y", label: "...", isY: true, unit: "..." }
       ],
       rows: [
         5 to 6 data rows with { trial: "Trial 1", x: number, y: number }
       ]
     }
   - graphConfig: {
       showBestFitDefault: true,
       beginAtZero: true,
       slope: number,
       intercept: number,
       r2: number (between 0.95 and 1.0),
       equation: string (e.g. "y = m x + b"),
       slopeMeaning: string explaining physical rate of change
     }
   - questions: {
       anatomy: {
         id: "anatomy_q",
         independentVar: string,
         dependentVar: string,
         locatorPrompt: string asking to find a specific X value and read the corresponding Y value,
         expectedLocatorValue: number (the Y value corresponding to that X),
         locatorTolerance: number (e.g. 0.1 or 0.2),
         locatorUnit: string,
         interceptPrompt: string asking about the physical meaning of the intercept,
         interceptOptions: [4 plausible multiple choice options],
         interceptCorrectIndex: integer (0 to 3),
         interceptExplanation: string
       },
       trend: {
         id: "trend_q",
         type: "multiple_choice",
         prompt: string asking what mathematical pattern connects the variables,
         options: [4 options such as direct linear, inverse, quadratic, no correlation],
         correctIndex: integer (0 to 3),
         explanation: string
       },
       quantitative: {
         id: "quant_q",
         type: "calculation",
         prompt: string asking to calculate the rate of change / slope between two specific trials,
         expectedValue: number (slope value),
         tolerance: number (e.g. 0.05 or 0.1),
         unit: string (e.g. "(unit_y) / (unit_x)"),
         hint: string showing slope formula calculation,
         slopeSteps: {
           point1: { x: number, y: number, label: string },
           point2: { x: number, y: number, label: string },
           formulaSetup: string,
           calculatedSlope: number,
           slopeUnit: string,
           physicalMeaning: string
         }
       },
       freeResponse: {
         id: "fr_q",
         type: "cer",
         prompt: "Construct a scientific explanation (Claim-Evidence-Reasoning) explaining the relationship between the variables. You must: (1) State a clear claim, (2) Cite at least TWO specific data points with units from the table or graph, (3) Compare values to show the rate of change, and (4) Explain the underlying scientific mechanism.",
         targetNumbers: [array of numbers from the data table trials],
         requiredUnits: [array of relevant lowercase unit strings],
         claimKeywords: [array of 6-8 relevant claim words],
         reasoningKeywords: [array of 6-8 relevant scientific mechanism words],
         exemplar: string providing a 4/4 exemplary Claim-Evidence-Reasoning paragraph,
         sentenceFrames: {
           claimFrame: string,
           evidenceFrame: string,
           reasoningFrame: string
         }
       },
       synthesis: {
         id: "syn_q",
         type: "multiple_choice",
         prompt: string asking for an extrapolated prediction beyond the measured range,
         options: [4 options],
         correctIndex: integer (0 to 3),
         explanation: string,
         diagnosticPrompt: string presenting a common student misconception about this topic,
         diagnosticOptions: [4 options],
         diagnosticCorrectIndex: integer (0 to 3),
         diagnosticExplanation: string
       }
     }
3. OUTPUT FORMAT: Return ONLY the raw JSON object. No markdown code blocks, backticks, or preamble text.`;

    const userPrompt = `Topic: "${topic}"\nDiscipline: "${discipline}"\nTarget: High School NGSS CAST Performance Task\nGenerate the complete JSON scenario object now.`;

    let rawText = "";
    if (proxyUrl) {
      const response = await fetch(proxyUrl, {
        method: "POST",
        mode: "cors",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: `${systemInstruction}\n\n${userPrompt}` }] }],
          systemInstruction: systemInstruction
        })
      });

      if (!response.ok) {
        throw new Error(`Proxy error: ${response.status} ${response.statusText}`);
      }

      const resJson = await response.json();
      if (resJson.candidates && resJson.candidates[0]?.content?.parts?.[0]?.text) {
        rawText = resJson.candidates[0].content.parts[0].text;
      } else if (resJson.text) {
        rawText = resJson.text;
      } else if (typeof resJson === "string") {
        rawText = resJson;
      }
    } else {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: userPrompt }] }],
          systemInstruction: { parts: [{ text: systemInstruction }] },
          generationConfig: { responseMimeType: "application/json" }
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${errText}`);
      }

      const resJson = await response.json();
      rawText = resJson.candidates[0]?.content?.parts?.[0]?.text || "";
    }

    const scenario = parseJsonText(rawText);
    if (!scenario || !scenario.title || !scenario.dataTable || !Array.isArray(scenario.dataTable.rows)) {
      throw new Error("AI returned an incomplete or invalid scenario structure. Please try again.");
    }

    // 3. Normalize & calibrate scenario properties
    const customId = `custom-ai-${Date.now()}`;
    scenario.id = customId;
    if (!scenario.discipline) scenario.discipline = discipline;
    if (!scenario.disciplineBadge) {
      scenario.disciplineBadge = scenario.discipline === "Physics" ? "⚛️ Physics" : 
        (scenario.discipline === "Biology" ? "🌿 Biology" : 
        (scenario.discipline === "Chemistry" ? "🧪 Chemistry" : "🌋 Earth & Space"));
    }
    if (!scenario.ngssCode) scenario.ngssCode = "HS-PS2-1";
    if (!scenario.sep) scenario.sep = "SEP-4: Analyzing and Interpreting Data";
    if (!scenario.ccc) scenario.ccc = "CCC-1: Patterns";

    if (!scenario.xAxis) scenario.xAxis = { label: "Independent Variable", unit: "units", min: 0 };
    if (!scenario.yAxis) scenario.yAxis = { label: "Dependent Variable", unit: "units", min: 0 };

    scenario.dataTable.rows = scenario.dataTable.rows.map((r, i) => {
      const row = { trial: r.trial || `Trial ${i + 1}` };
      const keys = Object.keys(r);
      if (typeof r.x === "number") row.x = r.x;
      else if (keys[1] && typeof r[keys[1]] === "number") row.x = r[keys[1]];
      else row.x = (i + 1) * 5;

      if (typeof r.y === "number") row.y = r.y;
      else if (keys[2] && typeof r[keys[2]] === "number") row.y = r[keys[2]];
      else row.y = (i + 1) * 2;
      return row;
    });

    if (!scenario.dataTable.columns || scenario.dataTable.columns.length < 3) {
      scenario.dataTable.columns = [
        { key: "trial", label: "Trial #", isText: true },
        { key: "x", label: `${scenario.xAxis.label} (${scenario.xAxis.unit})`, isX: true, unit: scenario.xAxis.unit },
        { key: "y", label: `${scenario.yAxis.label} (${scenario.yAxis.unit})`, isY: true, unit: scenario.yAxis.unit }
      ];
    }

    // Populate manual builder form inputs
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val;
    };
    setVal("teacherTitleInput", scenario.title || "");
    setVal("teacherDisciplineSelect", scenario.discipline || "Physics");
    setVal("teacherNgssCodeInput", scenario.ngssCode || "");
    setVal("teacherBgTextarea", scenario.background || "");
    setVal("teacherXLabelInput", scenario.xAxis.label || "");
    setVal("teacherXUnitInput", scenario.xAxis.unit || "");
    setVal("teacherYLabelInput", scenario.yAxis.label || "");
    setVal("teacherYUnitInput", scenario.yAxis.unit || "");
    setVal("teacherDataRowsInput", scenario.dataTable.rows.map(r => `${r.x}, ${r.y}`).join("\n"));
    setVal("teacherQuantExpectedInput", scenario.questions?.quantitative?.expectedValue ?? "");
    setVal("teacherTrendPromptInput", scenario.questions?.trend?.prompt || "");
    setVal("teacherFrPromptInput", scenario.questions?.freeResponse?.prompt || "");
    setVal("teacherFrNumbersInput", (scenario.questions?.freeResponse?.targetNumbers || []).join(", "));

    // Save scenario to custom scenarios list and active bank
    const savedCustom = JSON.parse(localStorage.getItem("cast_custom_scenarios") || "[]");
    savedCustom.push(scenario);
    localStorage.setItem("cast_custom_scenarios", JSON.stringify(savedCustom));

    allScenarios.push(scenario);
    populateScenarioDropdown();
    loadScenario(customId);

    // Show success feedback banner
    if (successBanner) {
      successBanner.style.display = "block";
      const titleEl = document.getElementById("aiSuccessTitle");
      if (titleEl) titleEl.textContent = `"${scenario.title}"`;
    }

  } catch (err) {
    console.error("AI Generation error:", err);
    alert("AI Generation failed: " + err.message + "\nPlease verify proxy settings or try a different topic.");
  } finally {
    if (generateBtn) generateBtn.disabled = false;
    if (statusContainer) statusContainer.style.display = "none";
    isGeneratingAi = false;
  }
}

function saveCustomScenarioFromForm() {
  const title = document.getElementById("teacherTitleInput").value.trim();
  const discipline = document.getElementById("teacherDisciplineSelect").value;
  const ngssCode = document.getElementById("teacherNgssCodeInput").value.trim() || "HS-PS2-1";
  const bg = document.getElementById("teacherBgTextarea").value.trim();

  const xLabel = document.getElementById("teacherXLabelInput").value.trim() || "Independent Variable";
  const xUnit = document.getElementById("teacherXUnitInput").value.trim() || "units";
  const yLabel = document.getElementById("teacherYLabelInput").value.trim() || "Dependent Variable";
  const yUnit = document.getElementById("teacherYUnitInput").value.trim() || "units";

  const rawData = document.getElementById("teacherDataRowsInput").value.trim();
  const trendPrompt = document.getElementById("teacherTrendPromptInput").value.trim();
  const quantExpected = parseFloat(document.getElementById("teacherQuantExpectedInput").value);
  const frPrompt = document.getElementById("teacherFrPromptInput").value.trim();
  const frTargetNumbers = document.getElementById("teacherFrNumbersInput").value
    .split(",")
    .map(n => parseFloat(n.trim()))
    .filter(n => !isNaN(n));

  if (!title || !bg || !rawData) {
    alert("Please enter at least Title, Background Narrative, and Data Rows.");
    return;
  }

  // Parse CSV data rows (format: x, y per line)
  const rows = [];
  rawData.split("\n").forEach((line, idx) => {
    const parts = line.split(",").map(p => p.trim());
    if (parts.length >= 2) {
      const x = parseFloat(parts[0]);
      const y = parseFloat(parts[1]);
      if (!isNaN(x) && !isNaN(y)) {
        rows.push({
          trial: `Trial ${idx + 1}`,
          x: x,
          y: y
        });
      }
    }
  });

  if (rows.length === 0) {
    alert("No valid numerical data pairs found in Data Rows. Use format: X, Y (one per line).");
    return;
  }

  // If activeScenario was just generated or custom, inherit rich 5-part architecture defaults
  const baseQuestions = (activeScenario && activeScenario.questions) ? activeScenario.questions : {};

  const customId = `custom-${Date.now()}`;
  const customScenario = {
    id: customId,
    title: title,
    discipline: discipline,
    disciplineBadge: discipline === "Physics" ? "⚛️ Physics" : (discipline === "Biology" ? "🌿 Biology" : (discipline === "Chemistry" ? "🧪 Chemistry" : "🌋 Earth & Space")),
    ngssCode: ngssCode,
    ngssTitle: "Department Inquiry Performance Task",
    sep: "SEP-4: Analyzing and Interpreting Data",
    ccc: "CCC-1: Patterns",
    chartType: "scatter",
    xAxis: {
      label: xLabel,
      symbol: "X",
      unit: xUnit,
      min: 0,
      suggestedMax: Math.max(...rows.map(r => r.x)) * 1.15
    },
    yAxis: {
      label: yLabel,
      symbol: "Y",
      unit: yUnit,
      min: 0,
      suggestedMax: Math.max(...rows.map(r => r.y)) * 1.15
    },
    background: bg,
    controlledVariables: (activeScenario && activeScenario.controlledVariables) || [
      `Fixed constant system factors across all trials`,
      `Calibrated experimental timing and measurements`
    ],
    calibratedInstrumentation: (activeScenario && activeScenario.calibratedInstrumentation) || [
      `Standard laboratory precision measurement sensors`
    ],
    dataTable: {
      caption: `Table: ${title}`,
      columns: [
        { key: "trial", label: "Trial #", isText: true },
        { key: "x", label: `${xLabel} (${xUnit})`, isX: true, unit: xUnit },
        { key: "y", label: `${yLabel} (${yUnit})`, isY: true, unit: yUnit }
      ],
      rows: rows
    },
    graphConfig: {
      showBestFitDefault: true,
      beginAtZero: true,
      equation: "Custom Teacher Model"
    },
    questions: {
      anatomy: baseQuestions.anatomy || {
        id: "anatomy_q",
        independentVar: `${xLabel} (${xUnit})`,
        dependentVar: `${yLabel} (${yUnit})`,
        locatorPrompt: `What is the measured ${yLabel} for the first trial?`,
        expectedLocatorValue: rows[0].y,
        locatorTolerance: 0.2,
        locatorUnit: yUnit,
        interceptPrompt: `What is the expected physical behavior when ${xLabel} is zero?`,
        interceptOptions: [
          `The dependent variable starts from the physical baseline/zero`,
          `The experimental sensors become inactive`,
          `The system accelerates infinitely`,
          `No data can be gathered`
        ],
        interceptCorrectIndex: 0,
        interceptExplanation: `At zero independent input, the physical response reflects baseline equilibrium.`
      },
      trend: {
        id: "trend_q",
        type: "multiple_choice",
        prompt: trendPrompt || "What is the primary relationship demonstrated by the data?",
        options: [
          "Direct linear relationship (as X increases, Y increases proportionally)",
          "Inverse relationship (as X increases, Y decreases)",
          "Non-linear plateau (rate levels off at higher values)",
          "No correlation observed"
        ],
        correctIndex: 0,
        explanation: "Based on the plotted data points, a direct trend connects the variables."
      },
      quantitative: {
        id: "quant_q",
        type: "calculation",
        prompt: `Calculate the rate of change (slope ΔY / ΔX) between the first and last data points in ${yUnit} per ${xUnit}.`,
        expectedValue: !isNaN(quantExpected) ? quantExpected : ((rows[rows.length - 1].y - rows[0].y) / (rows[rows.length - 1].x - rows[0].x)),
        tolerance: 0.1,
        unit: `(${yUnit}) / (${xUnit})`,
        hint: `Use ΔY / ΔX: (${rows[rows.length - 1].y} - ${rows[0].y}) / (${rows[rows.length - 1].x} - ${rows[0].x}).`,
        slopeSteps: baseQuestions.quantitative?.slopeSteps || {
          point1: { x: rows[0].x, y: rows[0].y, label: `Trial 1 (${rows[0].x} ${xUnit}, ${rows[0].y} ${yUnit})` },
          point2: { x: rows[rows.length - 1].x, y: rows[rows.length - 1].y, label: `Trial ${rows.length} (${rows[rows.length - 1].x} ${xUnit}, ${rows[rows.length - 1].y} ${yUnit})` },
          formulaSetup: `Slope = (${rows[rows.length - 1].y} - ${rows[0].y}) / (${rows[rows.length - 1].x} - ${rows[0].x})`,
          calculatedSlope: !isNaN(quantExpected) ? quantExpected : ((rows[rows.length - 1].y - rows[0].y) / (rows[rows.length - 1].x - rows[0].x)),
          slopeUnit: `(${yUnit}) / (${xUnit})`,
          physicalMeaning: `Rate of change of ${yLabel} with respect to ${xLabel}`
        }
      },
      freeResponse: {
        id: "fr_q",
        type: "cer",
        prompt: frPrompt || `Construct a scientific explanation (CER) explaining the relationship between ${xLabel} and ${yLabel}. Cite at least TWO specific data points with units from the table.`,
        targetNumbers: frTargetNumbers.length > 0 ? frTargetNumbers : rows.flatMap(r => [r.x, r.y]),
        requiredUnits: [xUnit.toLowerCase(), yUnit.toLowerCase()],
        claimKeywords: ["increases", "decreases", "proportional", "direct", "rate", "linear"],
        reasoningKeywords: ["because", "due to", "mechanism", "energy", "particles", "force", "model"],
        exemplar: baseQuestions.freeResponse?.exemplar || `As ${xLabel} changed, ${yLabel} changed proportionally based on the underlying scientific principle.`,
        sentenceFrames: baseQuestions.freeResponse?.sentenceFrames || {
          claimFrame: `The relationship between ${xLabel} and ${yLabel} is [directly proportional / inversely proportional].`,
          evidenceFrame: `In Trial 1, when ${xLabel} was ${rows[0].x} ${xUnit}, ${yLabel} was ${rows[0].y} ${yUnit}. As ${xLabel} increased to ${rows[rows.length - 1].x} ${xUnit}, ${yLabel} reached ${rows[rows.length - 1].y} ${yUnit}.`,
          reasoningFrame: `This occurs because the underlying physical mechanism scales with the independent variable.`
        }
      },
      synthesis: baseQuestions.synthesis || {
        id: "syn_q",
        type: "multiple_choice",
        prompt: "Based on this dataset, what would you predict happens if the independent variable increases beyond the tested range?",
        options: [
          "The trend will continue at the same rate",
          "The dependent variable will drop immediately to zero",
          "The variable will plateau due to system limitations",
          "Cannot be determined without further investigation"
        ],
        correctIndex: 0,
        explanation: "Extending the linear model predicts continued proportional behavior within reasonable limits."
      }
    }
  };

  // Save to custom scenarios
  const savedCustom = JSON.parse(localStorage.getItem("cast_custom_scenarios") || "[]");
  savedCustom.push(customScenario);
  localStorage.setItem("cast_custom_scenarios", JSON.stringify(savedCustom));

  allScenarios.push(customScenario);
  populateScenarioDropdown();
  loadScenario(customId);
  closeTeacherModal();

  alert(`Custom scenario "${title}" has been saved and loaded!`);
}

function exportCustomScenariosJson() {
  const saved = localStorage.getItem("cast_custom_scenarios") || "[]";
  const blob = new Blob([saved], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `cast_custom_scenarios_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// ==========================================================================
// 9. SYNCHRONIZE 1-PAGE HONORS PRINT WORKSHEET
// ==========================================================================
let currentPrintMode = "blank"; // "blank" (student worksheet) or "report" (graded submission)

function printBlankWorksheet() {
  currentPrintMode = "blank";
  syncPrintWorksheet("blank");
  setTimeout(() => {
    window.print();
  }, 100);
}

function printCompletedReport() {
  currentPrintMode = "report";
  syncPrintWorksheet("report");
  setTimeout(() => {
    window.print();
  }, 100);
}

function syncPrintWorksheet(mode = currentPrintMode) {
  const scenario = getCurrentScenario();
  if (!scenario) return;
  const resp = getActiveResponse();
  const isBlank = mode === "blank";

  const total = (resp.scores.anatomy || 0) + (resp.scores.trend || 0) + (resp.scores.quant || 0) + (resp.scores.fr || 0) + (resp.scores.syn || 0);
  const maxTotal = 8;
  const pct = Math.round((total / maxTotal) * 100);

  // 1. Header Block
  const pHeaderTitle = document.getElementById("pHeaderTitle");
  const pHeaderSub = document.getElementById("pHeaderSub");
  const pHeaderNgss = document.getElementById("pHeaderNgss");
  const pStudentName = document.getElementById("pStudentName");
  const pStudentPeriod = document.getElementById("pStudentPeriod");
  const pCurrentDate = document.getElementById("pCurrentDate");
  const pMasteryScore = document.getElementById("pMasteryScore");

  if (pHeaderTitle) pHeaderTitle.textContent = scenario.title;
  if (pHeaderSub) pHeaderSub.textContent = `${scenario.disciplineBadge} Investigation • ${scenario.ngssTitle} (${scenario.ngssCode})`;
  if (pHeaderNgss) pHeaderNgss.textContent = `${scenario.ngssCode} • SEP-4 • SEP-7`;

  const pScoreMaxLabel = document.getElementById("pScoreMaxLabel");

  if (pStudentName) {
    pStudentName.textContent = (!isBlank && currentStudent) ? (currentStudent.displayName || currentStudent.email.split("@")[0]) : "";
  }
  if (pStudentPeriod) {
    pStudentPeriod.textContent = (!isBlank && currentStudent && currentStudent.period) ? currentStudent.period : "";
  }
  if (pCurrentDate) {
    pCurrentDate.textContent = !isBlank ? new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "";
  }
  if (pMasteryScore) {
    pMasteryScore.textContent = !isBlank ? `${total}` : "";
  }
  if (pScoreMaxLabel) {
    pScoreMaxLabel.textContent = !isBlank ? `/ ${maxTotal} Pts (${pct}%)` : `/ ${maxTotal} Pts`;
  }

  // 2. Scenario Narrative
  const pScenarioTitle = document.getElementById("pScenarioTitle");
  const pScenarioText = document.getElementById("pScenarioText");
  if (pScenarioTitle) pScenarioTitle.textContent = `${scenario.discipline.toUpperCase()} INVESTIGATION: ${scenario.title.toUpperCase()}`;
  if (pScenarioText) pScenarioText.innerHTML = scenario.background;

  // 3. Experimental Data Table
  const pTableCaption = document.getElementById("pTableCaption");
  const pTableWrapper = document.getElementById("pTableWrapper");
  if (pTableCaption) pTableCaption.textContent = scenario.dataTable.caption;
  if (pTableWrapper) {
    let tHtml = `<table class="p-table"><thead><tr>`;
    scenario.dataTable.columns.forEach(col => {
      tHtml += `<th>${col.label}</th>`;
    });
    tHtml += `</tr></thead><tbody>`;
    scenario.dataTable.rows.forEach(r => {
      tHtml += `<tr>`;
      scenario.dataTable.columns.forEach(col => {
        const val = r[col.key];
        const formatted = typeof val === "number" ? val.toFixed(col.key === "conc" ? 2 : 1) : val;
        tHtml += `<td>${formatted}</td>`;
      });
      tHtml += `</tr>`;
    });
    tHtml += `</tbody></table>`;
    pTableWrapper.innerHTML = tHtml;
  }

  // 4. Plotted Graph Image Snapshot
  const pGraphModelBadge = document.getElementById("pGraphModelBadge");
  const pGraphImg = document.getElementById("pGraphImg");
  if (pGraphModelBadge) pGraphModelBadge.textContent = scenario.graphConfig.equation || "Model";

  if (chartInstance && pGraphImg) {
    const wasDark = currentTheme === "dark";
    if (wasDark) {
      renderChart("light");
    }
    const dataUrl = chartInstance.toBase64Image("image/png", 1.0);
    pGraphImg.src = dataUrl;
    if (wasDark) {
      renderChart("dark");
    }
  }

  // 5. Questions Section (5-Part Pedagogical Structure)
  // Part 1: Graph Reading & Decoding
  const anatomy = scenario.questions.anatomy;
  const pQ0Prompt = document.getElementById("pQ0Prompt");
  const pQ0X = document.getElementById("pQ0X");
  const pQ0Y = document.getElementById("pQ0Y");
  const pQ0Value = document.getElementById("pQ0Value");
  const pQ0Unit = document.getElementById("pQ0Unit");

  if (pQ0Prompt && anatomy) pQ0Prompt.textContent = anatomy.locatorPrompt;
  if (pQ0X && anatomy) pQ0X.textContent = anatomy.independentVar;
  if (pQ0Y && anatomy) pQ0Y.textContent = anatomy.dependentVar;
  if (pQ0Value) pQ0Value.textContent = (!isBlank && resp.anatomyLocatorAnswer) ? resp.anatomyLocatorAnswer : "";
  if (pQ0Unit && anatomy) pQ0Unit.textContent = anatomy.locatorUnit;

  // Part 2: Trend Pattern
  const pQ1Prompt = document.getElementById("pQ1Prompt");
  const pQ1Answer = document.getElementById("pQ1Answer");
  if (pQ1Prompt) pQ1Prompt.textContent = scenario.questions.trend.prompt;
  if (pQ1Answer) {
    if (!isBlank && resp.trendAnswer !== null && scenario.questions.trend.options[resp.trendAnswer]) {
      const isCor = resp.scores.trend === 1;
      pQ1Answer.innerHTML = `${scenario.questions.trend.options[resp.trendAnswer]} <span style="color:${isCor ? '#15803d' : '#b91c1c'}; font-weight:700;">(${isCor ? '✓ 1/1 pt' : '0/1 pt'})</span>`;
    } else {
      // Clean standalone checkboxes for paper completion
      const optionsHtml = scenario.questions.trend.options.map(opt => `[ ] ${opt}`).join("&nbsp;&nbsp;&nbsp;&nbsp;");
      pQ1Answer.innerHTML = `<span style="color:#475569; font-size:7.5pt;">${optionsHtml}</span>`;
    }
  }

  // Part 3: Rate of Change / Slope
  const pQ2Prompt = document.getElementById("pQ2Prompt");
  const pQ2Value = document.getElementById("pQ2Value");
  const pQ2Unit = document.getElementById("pQ2Unit");
  if (pQ2Prompt) pQ2Prompt.textContent = scenario.questions.quantitative.prompt;
  if (pQ2Value) pQ2Value.textContent = (!isBlank && resp.quantAnswer) ? resp.quantAnswer : "";
  if (pQ2Unit) pQ2Unit.textContent = scenario.questions.quantitative.unit;

  // Part 4: Free Response CER & 4-Point Rubric Bar
  const pQ3Prompt = document.getElementById("pQ3Prompt");
  const pCerText = document.getElementById("pCerText");
  const pRubClaim = document.getElementById("pRubClaim");
  const pRubEvidence = document.getElementById("pRubEvidence");
  const pRubUnits = document.getElementById("pRubUnits");
  const pRubReasoning = document.getElementById("pRubReasoning");
  const pRubTotal = document.getElementById("pRubTotal");

  if (pQ3Prompt) pQ3Prompt.textContent = scenario.questions.freeResponse.prompt;
  if (pCerText) {
    if (!isBlank && resp.frAnswer && resp.frAnswer.trim().length > 0) {
      pCerText.textContent = resp.frAnswer;
      pCerText.style.fontStyle = "normal";
      pCerText.style.color = "#0f172a";
    } else {
      // Standalone blank worksheet: provide clean open writing box
      pCerText.innerHTML = "";
    }
  }

  // Evaluate CER with EvidenceChecker (or show blank grading criteria for paper)
  const cerResult = EvidenceChecker.evaluate(resp.frAnswer, scenario.questions.freeResponse);
  if (pRubClaim) {
    pRubClaim.textContent = !isBlank ? `Claim: ${cerResult.criteria[0].points}/1` : `Claim: [ 1 pt ]`;
    pRubClaim.className = `p-rub-pill ${(!isBlank && cerResult.criteria[0].earned) ? 'passed' : ''}`;
  }
  if (pRubEvidence) {
    pRubEvidence.textContent = !isBlank ? `Evidence: ${cerResult.criteria[1].points}/1` : `Evidence (2+ pts & units): [ 1 pt ]`;
    pRubEvidence.className = `p-rub-pill ${(!isBlank && cerResult.criteria[1].earned) ? 'passed' : ''}`;
  }
  if (pRubUnits) {
    pRubUnits.textContent = !isBlank ? `Units: ${cerResult.criteria[2].points}/1` : `Units: [ 1 pt ]`;
    pRubUnits.className = `p-rub-pill ${(!isBlank && cerResult.criteria[2].earned) ? 'passed' : ''}`;
  }
  if (pRubReasoning) {
    pRubReasoning.textContent = !isBlank ? `Reasoning: ${cerResult.criteria[3].points}/1` : `Reasoning: [ 1 pt ]`;
    pRubReasoning.className = `p-rub-pill ${(!isBlank && cerResult.criteria[3].earned) ? 'passed' : ''}`;
  }
  if (pRubTotal) {
    pRubTotal.textContent = !isBlank ? `${cerResult.score} / 4 Pts` : `Rubric: ____ / 4 Pts`;
    pRubTotal.style.color = (!isBlank && cerResult.score >= 3) ? '#15803d' : '#0284c7';
  }

  // Part 5: Prediction & Real-World Application
  const pQ4Prompt = document.getElementById("pQ4Prompt");
  const pQ4Answer = document.getElementById("pQ4Answer");
  if (pQ4Prompt) pQ4Prompt.textContent = scenario.questions.synthesis.prompt;
  if (pQ4Answer) {
    if (!isBlank && resp.synAnswer !== null && scenario.questions.synthesis.options[resp.synAnswer]) {
      const isCor = resp.scores.syn === 1;
      pQ4Answer.innerHTML = `${scenario.questions.synthesis.options[resp.synAnswer]} <span style="color:${isCor ? '#15803d' : '#b91c1c'}; font-weight:700;">(${isCor ? '✓ 1/1 pt' : '0/1 pt'})</span>`;
    } else {
      // Standalone blank checkboxes for paper completion
      const synHtml = scenario.questions.synthesis.options.map(opt => `[ ] ${opt}`).join("&nbsp;&nbsp;&nbsp;&nbsp;");
      pQ4Answer.innerHTML = `<span style="color:#475569; font-size:7.5pt;">${synHtml}</span>`;
    }
  }

  // 6. Footer Bar
  const pFooterNgss = document.getElementById("pFooterNgss");
  if (pFooterNgss) pFooterNgss.textContent = `${scenario.ngssCode} • ${scenario.sep} • ${scenario.ccc}`;
}

// ==========================================================================
// 10. EVENT LISTENERS SETUP
// ==========================================================================
function setupEventListeners() {
  // Scenario Dropdown Change
  const scenarioSelect = document.getElementById("scenarioSelect");
  if (scenarioSelect) {
    scenarioSelect.addEventListener("change", (e) => {
      loadScenario(e.target.value);
    });
  }

  // Free response typing live update
  const frTextarea = document.getElementById("frTextarea");
  if (frTextarea) {
    let debounceTimer = null;
    frTextarea.addEventListener("input", () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        evaluateFreeResponseLive();
        syncPrintWorksheet();
      }, 350);
    });
  }

  // Print Blank Worksheet Button
  const printWorksheetBtn = document.getElementById("printWorksheetBtn");
  if (printWorksheetBtn) {
    printWorksheetBtn.addEventListener("click", () => {
      printBlankWorksheet();
    });
  }

  // Print Completed Report button
  const printReportBtn = document.getElementById("printReportBtn");
  if (printReportBtn) {
    printReportBtn.addEventListener("click", () => {
      printCompletedReport();
    });
  }

  // Hook beforeprint event
  window.addEventListener("beforeprint", () => {
    syncPrintWorksheet(currentPrintMode);
  });
}

// Node.js module exports for unit testing
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    AUTHORIZED_TEACHERS,
    isAuthorizedTeacher,
    parseJsonText
  };
}
