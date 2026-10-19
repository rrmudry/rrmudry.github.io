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
let allScenarios = [...SCENARIOS];
let activeScenarioId = SCENARIOS[0].id;
let activeDiscipline = "all";
let currentStepIndex = 0; // 0: Trend, 1: Quantitative, 2: Free Response, 3: Synthesis
let chartInstance = null;
let currentTheme = localStorage.getItem("cast_theme") || "light";
let currentFontSize = localStorage.getItem("cast_font_size") || "normal";
let currentStudent = null;

// Student response state keyed by scenario ID
let scenarioResponses = JSON.parse(localStorage.getItem("cast_student_responses") || "{}");

// Firebase references
let auth = null;
let db = null;

document.addEventListener("DOMContentLoaded", () => {
  initThemeAndFont();
  initFirebase();
  loadCustomScenarios();
  populateScenarioDropdown();
  setupEventListeners();
  loadScenario(activeScenarioId);
});

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
      trendAnswer: null,
      quantAnswer: "",
      frAnswer: "",
      synAnswer: null,
      scores: { trend: 0, quant: 0, fr: 0, syn: 0 },
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

  // Reset to Step 1 (Trend)
  setStep(0);

  // Render Phenomenon & Metadata
  document.getElementById("scenarioTitle").textContent = scenario.title;
  document.getElementById("disciplineBadge").className = `badge badge-${scenario.discipline.toLowerCase().replace(/[^a-z]/g, '')}`;
  document.getElementById("disciplineBadge").textContent = scenario.disciplineBadge;
  document.getElementById("ngssBadge").textContent = `${scenario.ngssCode} • ${scenario.ngssTitle}`;
  document.getElementById("sepBadge").textContent = scenario.sep;
  document.getElementById("cccBadge").textContent = scenario.ccc;
  document.getElementById("phenomenonText").innerHTML = scenario.background;

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
  // --- PART 1: TREND IDENTIFICATION ---
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

  // --- PART 2: QUANTITATIVE RATE / SLOPE ---
  const quantPrompt = document.getElementById("quantPrompt");
  const quantInput = document.getElementById("quantInput");
  const quantUnit = document.getElementById("quantUnit");
  const quantFeedback = document.getElementById("quantFeedback");

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

  // --- PART 3: FREE RESPONSE (CER) ---
  const frPrompt = document.getElementById("frPrompt");
  const frTextarea = document.getElementById("frTextarea");

  if (frPrompt) frPrompt.textContent = scenario.questions.freeResponse.prompt;
  if (frTextarea) frTextarea.value = resp.frAnswer || "";

  // Evaluate CER
  evaluateFreeResponseLive();

  // --- PART 4: SYNTHESIS ---
  const synPrompt = document.getElementById("synPrompt");
  const synOptions = document.getElementById("synOptions");
  const synFeedback = document.getElementById("synFeedback");

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
  const total = (resp.scores.trend || 0) + (resp.scores.quant || 0) + (resp.scores.fr || 0) + (resp.scores.syn || 0);
  const maxTotal = 7; // 1 (trend) + 1 (quant) + 4 (fr) + 1 (syn)

  const scoreEl = document.getElementById("totalScoreDisplay");
  if (scoreEl) scoreEl.textContent = `${total} / ${maxTotal}`;

  const pct = Math.round((total / maxTotal) * 100);
  const pctEl = document.getElementById("masteryPercentDisplay");
  if (pctEl) pctEl.textContent = `${pct}% Mastery`;

  // Update Step Tabs completed markers
  const tab0 = document.getElementById("stepTab-0");
  const tab1 = document.getElementById("stepTab-1");
  const tab2 = document.getElementById("stepTab-2");
  const tab3 = document.getElementById("stepTab-3");

  if (tab0) tab0.classList.toggle("completed", resp.scores.trend === 1);
  if (tab1) tab1.classList.toggle("completed", resp.scores.quant === 1);
  if (tab2) tab2.classList.toggle("completed", resp.scores.fr >= 3);
  if (tab3) tab3.classList.toggle("completed", resp.scores.syn === 1);

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

  const total = (resp.scores.trend || 0) + (resp.scores.quant || 0) + (resp.scores.fr || 0) + (resp.scores.syn || 0);
  const maxTotal = 7;
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
    trendAnswer: resp.trendAnswer !== undefined && resp.trendAnswer !== null ? resp.trendAnswer : null,
    quantAnswer: resp.quantAnswer || "",
    freeResponseText: resp.frAnswer || "",
    synAnswer: resp.synAnswer !== undefined && resp.synAnswer !== null ? resp.synAnswer : null,
    scores: {
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
// 8. TEACHER MODE & CUSTOM SCENARIO BUILDER
// ==========================================================================
function openTeacherModal() {
  const modal = document.getElementById("teacherModal");
  if (modal) modal.style.display = "flex";
}

function closeTeacherModal() {
  const modal = document.getElementById("teacherModal");
  if (modal) modal.style.display = "none";
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

  // Parse CSV data rows (format: label, x, y)
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
        hint: `Use ΔY / ΔX: (${rows[rows.length - 1].y} - ${rows[0].y}) / (${rows[rows.length - 1].x} - ${rows[0].x}).`
      },
      freeResponse: {
        id: "fr_q",
        type: "cer",
        prompt: frPrompt || `Construct a scientific explanation (CER) explaining the relationship between ${xLabel} and ${yLabel}. Cite at least TWO specific data points with units from the table.`,
        targetNumbers: frTargetNumbers.length > 0 ? frTargetNumbers : rows.flatMap(r => [r.x, r.y]),
        requiredUnits: [xUnit.toLowerCase(), yUnit.toLowerCase()],
        claimKeywords: ["increases", "decreases", "proportional", "direct", "rate", "linear"],
        reasoningKeywords: ["because", "due to", "mechanism", "energy", "particles", "force", "model"],
        exemplar: `As ${xLabel} changed, ${yLabel} changed proportionally based on the underlying scientific principle.`
      },
      synthesis: {
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
function syncPrintWorksheet() {
  const scenario = getCurrentScenario();
  if (!scenario) return;
  const resp = getActiveResponse();
  const total = (resp.scores.trend || 0) + (resp.scores.quant || 0) + (resp.scores.fr || 0) + (resp.scores.syn || 0);
  const maxTotal = 7;
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

  if (pStudentName) {
    pStudentName.textContent = currentStudent ? (currentStudent.displayName || currentStudent.email.split("@")[0]) : "";
  }
  if (pStudentPeriod) {
    pStudentPeriod.textContent = currentStudent && currentStudent.period ? currentStudent.period : "";
  }
  if (pCurrentDate) {
    pCurrentDate.textContent = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  if (pMasteryScore) {
    pMasteryScore.textContent = `${total} / ${maxTotal} Pts (${pct}%)`;
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

  // 5. Questions Section
  // Part 1: Trend Pattern
  const pQ1Prompt = document.getElementById("pQ1Prompt");
  const pQ1Answer = document.getElementById("pQ1Answer");
  if (pQ1Prompt) pQ1Prompt.textContent = scenario.questions.trend.prompt;
  if (pQ1Answer) {
    if (resp.trendAnswer !== null && scenario.questions.trend.options[resp.trendAnswer]) {
      const isCor = resp.scores.trend === 1;
      pQ1Answer.innerHTML = `${scenario.questions.trend.options[resp.trendAnswer]} <span style="color:${isCor ? '#15803d' : '#b91c1c'}; font-weight:700;">(${isCor ? '✓ 1/1 pt' : '0/1 pt'})</span>`;
    } else {
      pQ1Answer.innerHTML = `<span style="color:#64748b;">[ ] Linear Direct &nbsp;&nbsp; [ ] Inverse &nbsp;&nbsp; [ ] Non-Linear Growth &nbsp;&nbsp; [ ] Plateau</span>`;
    }
  }

  // Part 2: Rate of Change / Slope
  const pQ2Prompt = document.getElementById("pQ2Prompt");
  const pQ2Value = document.getElementById("pQ2Value");
  const pQ2Unit = document.getElementById("pQ2Unit");
  const pQ2Check = document.getElementById("pQ2Check");
  if (pQ2Prompt) pQ2Prompt.textContent = scenario.questions.quantitative.prompt;
  if (pQ2Value) pQ2Value.textContent = resp.quantAnswer || "__________";
  if (pQ2Unit) pQ2Unit.textContent = scenario.questions.quantitative.unit;
  if (pQ2Check) {
    if (resp.quantAnswer) {
      const isCor = resp.scores.quant === 1;
      pQ2Check.innerHTML = isCor ? `<span style="color:#15803d;">✓ Verified (+1 pt)</span>` : `<span style="color:#b91c1c;">Incorrect (Expected: ${scenario.questions.quantitative.expectedValue} ${scenario.questions.quantitative.unit})</span>`;
    } else {
      pQ2Check.textContent = "Rate Verification: _______";
    }
  }

  // Part 3: Free Response CER & 4-Point Rubric Bar
  const pQ3Prompt = document.getElementById("pQ3Prompt");
  const pCerText = document.getElementById("pCerText");
  const pRubClaim = document.getElementById("pRubClaim");
  const pRubEvidence = document.getElementById("pRubEvidence");
  const pRubUnits = document.getElementById("pRubUnits");
  const pRubReasoning = document.getElementById("pRubReasoning");
  const pRubTotal = document.getElementById("pRubTotal");

  if (pQ3Prompt) pQ3Prompt.textContent = scenario.questions.freeResponse.prompt;
  if (pCerText) {
    if (resp.frAnswer && resp.frAnswer.trim().length > 0) {
      pCerText.textContent = resp.frAnswer;
      pCerText.style.fontStyle = "normal";
    } else {
      pCerText.innerHTML = `<span style="color:#94a3b8; font-style:italic;">[Write Claim, cite 2+ numerical data points with units from table, compare rates, and provide scientific reasoning...]</span><div style="height:35px; border-bottom:1px dashed #cbd5e1; margin-top:10px;"></div>`;
    }
  }

  // Evaluate CER with EvidenceChecker
  const cerResult = EvidenceChecker.evaluate(resp.frAnswer, scenario.questions.freeResponse);
  if (pRubClaim) {
    pRubClaim.textContent = `Claim: ${cerResult.criteria[0].points}/1`;
    pRubClaim.className = `p-rub-pill ${cerResult.criteria[0].earned ? 'passed' : ''}`;
  }
  if (pRubEvidence) {
    pRubEvidence.textContent = `Evidence: ${cerResult.criteria[1].points}/1`;
    pRubEvidence.className = `p-rub-pill ${cerResult.criteria[1].earned ? 'passed' : ''}`;
  }
  if (pRubUnits) {
    pRubUnits.textContent = `Units: ${cerResult.criteria[2].points}/1`;
    pRubUnits.className = `p-rub-pill ${cerResult.criteria[2].earned ? 'passed' : ''}`;
  }
  if (pRubReasoning) {
    pRubReasoning.textContent = `Reasoning: ${cerResult.criteria[3].points}/1`;
    pRubReasoning.className = `p-rub-pill ${cerResult.criteria[3].earned ? 'passed' : ''}`;
  }
  if (pRubTotal) {
    pRubTotal.textContent = `${cerResult.score} / 4 Pts`;
    pRubTotal.style.color = cerResult.score >= 3 ? '#15803d' : '#0284c7';
  }

  // Part 4: Synthesis / Extrapolation
  const pQ4Prompt = document.getElementById("pQ4Prompt");
  const pQ4Answer = document.getElementById("pQ4Answer");
  if (pQ4Prompt) pQ4Prompt.textContent = scenario.questions.synthesis.prompt;
  if (pQ4Answer) {
    if (resp.synAnswer !== null && scenario.questions.synthesis.options[resp.synAnswer]) {
      const isCor = resp.scores.syn === 1;
      pQ4Answer.innerHTML = `${scenario.questions.synthesis.options[resp.synAnswer]} <span style="color:${isCor ? '#15803d' : '#b91c1c'}; font-weight:700;">(${isCor ? '✓ 1/1 pt' : '0/1 pt'})</span>`;
    } else {
      pQ4Answer.innerHTML = `<span style="color:#64748b;">[Student prediction or evaluation based on trend extrapolation]</span>`;
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

  // Print button with sync trigger
  const printBtn = document.getElementById("printReportBtn");
  if (printBtn) {
    printBtn.addEventListener("click", () => {
      syncPrintWorksheet();
      setTimeout(() => {
        window.print();
      }, 100);
    });
  }

  // Hook beforeprint event
  window.addEventListener("beforeprint", () => {
    syncPrintWorksheet();
  });
}
