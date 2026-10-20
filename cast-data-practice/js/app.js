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
  select.innerHTML = visible.map(s => {
    const gradeTag = (s.targetGrade && !s.targetGrade.startsWith("High School"))
      ? `[${s.targetGrade.split("/")[0].replace(/[^\w\s-]/g, '').trim()}] `
      : "";
    const isMulti = !!(s.graphConfig?.multiSeries);
    const count = s.graphConfig?.series?.length || s.dataTable?.columns?.filter(c => c.isY).length || 1;
    const seriesTag = (isMulti && count > 1) ? `[${count} Datasets] ` : "";
    return `
      <option value="${s.id}" ${s.id === activeScenarioId ? "selected" : ""}>
        ${gradeTag}${seriesTag}${s.disciplineBadge} ${s.title}
      </option>
    `;
  }).join("");
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

  const gradeBadge = document.getElementById("gradeBadge");
  if (gradeBadge) {
    if (scenario.targetGrade && !scenario.targetGrade.startsWith("High School")) {
      const shortName = scenario.targetGrade.split("/")[0].trim();
      gradeBadge.textContent = shortName;
      gradeBadge.style.display = "inline-flex";
    } else {
      gradeBadge.style.display = "none";
    }
  }

  const multiBadge = document.getElementById("multiSeriesBadge");
  if (multiBadge) {
    const isMulti = !!(scenario.graphConfig?.multiSeries);
    const count = scenario.graphConfig?.series?.length || scenario.dataTable?.columns?.filter(c => c.isY).length || 1;
    if (isMulti && count > 1) {
      multiBadge.textContent = `📈 ${count} Datasets`;
      multiBadge.style.display = "inline-flex";
    } else {
      multiBadge.style.display = "none";
    }
  }

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

  if (scenario.graphConfig && scenario.graphConfig.multiSeries && Array.isArray(scenario.graphConfig.series)) {
    // Multi-series rendering with dynamic X detection & adaptive palette (supports 2 to 5 series)
    const seriesColorsLight = ["#0284c7", "#ea580c", "#10b981", "#7c3aed", "#e11d48"];
    const seriesColorsDark = ["#38bdf8", "#fb923c", "#34d399", "#c084fc", "#f43f5e"];
    const seriesStyles = ["circle", "triangle", "rectRot", "cross", "star"];

    const xCol = scenario.dataTable.columns.find(c => c.isX) || scenario.dataTable.columns.find(c => !c.isText && !c.isY) || scenario.dataTable.columns[1];
    const xKey = xCol ? xCol.key : "x";
    const yCols = scenario.dataTable.columns.filter(c => c.isY);

    scenario.graphConfig.series.forEach((sConfig, idx) => {
      const color = isDark
        ? seriesColorsDark[idx % seriesColorsDark.length]
        : seriesColorsLight[idx % seriesColorsLight.length];

      const dataKey = sConfig.key || sConfig.id || (yCols[idx] ? yCols[idx].key : `y${idx + 1}`);

      const pts = scenario.dataTable.rows.map(r => {
        const xVal = typeof r[xKey] === "number" ? r[xKey] : (typeof r.x === "number" ? r.x : 0);
        const yVal = typeof r[dataKey] === "number"
          ? r[dataKey]
          : (typeof r[`y${idx + 1}`] === "number"
              ? r[`y${idx + 1}`]
              : (idx === 0 && typeof r.y === "number" ? r.y : 0));
        return { x: xVal, y: yVal };
      });

      datasets.push({
        label: sConfig.label || (yCols[idx] ? yCols[idx].label : `Dataset ${idx + 1}`),
        data: pts,
        backgroundColor: color,
        borderColor: color,
        pointBackgroundColor: color,
        pointBorderColor: isDark ? "#0f172a" : "#ffffff",
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointStyle: sConfig.pointStyle || seriesStyles[idx % seriesStyles.length],
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
  const part3Title = document.querySelector("#panelStep-2 .card-title");

  if (part3Title) {
    if (scenario.questions.quantitative.title) {
      part3Title.textContent = "🧮 " + scenario.questions.quantitative.title.replace(/^\d+\.\s*/, "");
    } else {
      part3Title.textContent = "🧮 Part 3: Calculating Rate of Change";
    }
  }

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
    const calcLabel = scenario.questions.quantitative.slopeSteps?.calcLabel 
      ? scenario.questions.quantitative.slopeSteps.calcLabel.replace(/:$/, '').toLowerCase() 
      : 'calculated value';
    fb.innerHTML = `
      <strong>✓ Calculation Verified! (+1 pt)</strong>
      <p style="margin-top:0.35rem;">Excellent data analysis. Your result matches the expected ${calcLabel} (${target} ${scenario.questions.quantitative.unit}).</p>
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

function setAiSpecialPreset(type) {
  const gradeSelect = document.getElementById("aiGradeLevelSelect");
  const datasetSelect = document.getElementById("aiDatasetsSelect");
  const reqInput = document.getElementById("aiSpecialRequestsInput");
  if (!gradeSelect || !reqInput) return;

  if (type === "clear") {
    gradeSelect.value = "High School (Grades 9-12 / Standard CAST)";
    if (datasetSelect) datasetSelect.value = "1";
    reqInput.value = "";
    return;
  }

  let presetGrade = null;
  let presetDatasets = null;
  let presetReq = "";

  switch (type) {
    case "compare-2":
      presetDatasets = "2";
      presetReq = "Include 2 comparative experimental datasets/series (e.g. Condition A vs Condition B) in the data table and graph.";
      break;
    case "compare-3":
      presetDatasets = "3";
      presetReq = "Include 3 comparative experimental datasets/series (e.g. 3 different conditions or materials) in the data table and graph.";
      break;
    case "lower-grade":
      presetGrade = "Middle School (Grades 6-8 / Accessible Vocabulary & Clean Numbers)";
      presetReq = "Lower target grade level to 7th-8th grade with clear, accessible vocabulary, concrete familiar lab tools, and clean numbers.";
      break;
    case "integers-only":
      presetReq = "Use clean, whole integer numbers for all independent and dependent data points in the table.";
      break;
    case "eld-support":
      presetGrade = "Foundations / ELD Support (Plain English & Scaffolding)";
      presetReq = "Use plain, simple English vocabulary, high visual scaffolding, and explicit sentence starters for English language learners.";
      break;
    case "kitchen-context":
      presetReq = "Use everyday household or kitchen materials for the lab apparatus instead of specialized high-tech sensors.";
      break;
    case "inverse-trend":
      presetReq = "Generate an inverse (indirect) relationship between the variables where y decreases as x increases.";
      break;
    case "honors-rigor":
      presetGrade = "Honors / AP Science (Advanced Rigor & In-Depth CER)";
      presetReq = "High rigor with advanced analytical terminology, precision laboratory sensors, and multi-step CER reasoning.";
      break;
  }

  if (presetGrade) {
    gradeSelect.value = presetGrade;
  }
  if (presetDatasets && datasetSelect) {
    datasetSelect.value = presetDatasets;
  }
  if (presetReq) {
    if (!reqInput.value.trim()) {
      reqInput.value = presetReq;
    } else if (!reqInput.value.includes(presetReq)) {
      reqInput.value = reqInput.value.trim() + " " + presetReq;
    }
  }
}

function buildAiPromptPayload({ topic, discipline = "Physics", gradeLevel = "High School (Grades 9-12 / Standard CAST)", datasetCount = 1, specialRequests = "" }) {
  const isLowerGrade = gradeLevel.includes("Middle School") || gradeLevel.includes("Elementary") || gradeLevel.includes("ELD");
  const isHonors = gradeLevel.includes("Honors") || gradeLevel.includes("AP");
  const numDatasets = parseInt(datasetCount, 10) || 1;
  const isMultiDataset = numDatasets > 1;

  const multiDatasetInstruction = isMultiDataset ? `
- MULTI-SERIES COMPARATIVE INVESTIGATION RULES (${numDatasets} Datasets):
  a) Authentic Comparative Setup: The investigation MUST test and compare ${numDatasets} distinct conditions, treatments, or materials (e.g. ${numDatasets === 2 ? 'Condition A vs Condition B, Rough vs Smooth track, Warm vs Cold solution, or Mid-Atlantic Ridge vs East Pacific Rise' : 'Low, Medium, and High concentration, or 3 distinct materials'}).
  b) Data Table Schema:
     - "columns": Include 1 trial column, 1 shared independent variable (x) column, and ${numDatasets} separate dependent variable (y) columns with "isY": true and "seriesId" matching each series:
       [
         { "key": "trial", "label": "Trial #", "isText": true },
         { "key": "x", "label": "Shared Independent Var (unit)", "isX": true, "unit": "..." },
         ${Array.from({length: numDatasets}, (_, k) => `{ "key": "y${k+1}", "label": "Condition ${k+1} Name (unit)", "isY": true, "unit": "...", "seriesId": "series${k+1}" }`).join(',\n         ')}
       ]
     - "rows": Each row object MUST contain "trial", "x", and ${Array.from({length: numDatasets}, (_, k) => `"y${k+1}": number`).join(', ')}.
  c) Graph Multi-Series Config:
     - "multiSeries": true
     - "series": [
       ${Array.from({length: numDatasets}, (_, k) => `{ "id": "series${k+1}", "key": "y${k+1}", "label": "Condition ${k+1} Name", "pointStyle": "${k === 0 ? 'circle' : (k === 1 ? 'triangle' : 'rectRot')}" }`).join(',\n       ')}
     ]
     - "equation": "State the comparative equations or rate comparison for all ${numDatasets} conditions"
     - "slopeMeaning": "Comparative rate of change between the ${numDatasets} conditions"
  d) Comparative Inquiry: Question 3 (quantitative slope/rate comparison) and Question 4 (freeResponse CER) MUST prompt students to compare or contrast the datasets across the tested conditions.
` : '';

  const systemInstruction = `You are a premier science curriculum specialist and CAST (California Science Test) assessment architect. 
Generate a complete, rigorous, standards-aligned science investigation and data analysis performance task tailored to the teacher's topic, target grade level, dataset count, and special customization requests.

CRITICAL RULES:
1. STRICT NO-LATEX & NO-RAW-HTML POLICY: Never use LaTeX syntax (no \\Delta, no \\frac, no \\vec, no $...). Never include raw HTML tags (like <strong>, <b>, <span>) inside JSON strings for independentVar, dependentVar, prompts, or options. Return clean, plain text and standard Unicode symbols: Δ, ², ³, °, °C, x₀, v₀, m/s².
2. EXPERIMENTAL INVESTIGATION SCENARIO (MANDATORY APPARATUS & PROCEDURE):
   - The background narrative MUST describe an authentic physical laboratory experiment and concrete apparatus setup.
   - Specifically detail:
     a) The physical object and materials tested (e.g. "a 0.50 kg wooden block resting on a horizontal track").
     b) Exactly how the independent variable was manipulated across trials (e.g. "stacking calibrated mass disks on top of the block across 6 trials to incrementally vary normal force").
     c) The precise instrumentation used to record the dependent variable (e.g. "a digital high-resolution force sensor pulling horizontally to measure the peak breakaway static friction force just before slip").
     d) The key controlled variables held constant (e.g. "constant contact surface area, horizontal level track verified at 0.0°, and steady pulling technique").
   - STRICT PROHIBITION: NEVER write generic textbook definitions, encyclopedic overviews, or broad statements like "Understanding friction is crucial for many real-world applications...". Focus 100% on describing the lab procedure and experimental setup.
   - Length: Strictly 55 to 80 words across 2 short, concise paragraphs. Do NOT repeat the investigation title in the background narrative.
3. GRADE-LEVEL ADAPTATION & RIGOR TARGET:
   - Selected Target Grade / Rigor: "${gradeLevel}"
   ${isLowerGrade ? `- LOWER GRADE LEVEL DIFFERENTIATION RULES (Grades 6-8 / Middle School / Foundations):
     a) Vocabulary & Reading Level: Use active, clear, 7th-8th grade accessible language. Avoid dense multisyllabic technical jargon or intimidating formulas.
     b) Intuitive Classroom Apparatus: Describe familiar, concrete classroom materials (e.g. spring scales, beakers, stopwatches, graduated cylinders, ramps, thermometers) rather than overly abstract electronic sensors.
     c) Clean Numbers: Keep data table numbers simple and accessible (clean integers or single decimal places like 2.0, 4.0, 6.0) that are straightforward for middle school students to plot and calculate slope (Δy / Δx) without rounding obstacles.
     d) Accessible Scaffolding: In Question 4 sentence frames, provide clear, friendly sentence starters with bracketed options (e.g., "[increased / decreased]").
     e) NGSS Alignment: Use appropriate Middle School NGSS codes when applicable (e.g. MS-PS2-2, MS-PS3-1, MS-LS1-5, MS-ESS2-2).` : (isHonors ? `- HONORS / AP RIGOR RULES:
     a) Analytical Terminology: Use rigorous college-prep scientific terminology and multi-variable precision apparatus (e.g. photogate sensors, spectrophotometers, digital force plates).
     b) In-Depth CER & Synthesis: Require students to articulate physical mechanisms and evaluate boundary limits in synthesis questions.` : `- STANDARD HIGH SCHOOL CAST PERFORMANCE RULES:
     a) Align with high school NGSS standards (9th-12th grade level).
     b) Balanced quantitative slope analysis and 4-point CER reasoning.`)}
4. NUMBER OF DATASETS & COMPARATIVE SERIES SPECIFICATION:
   - Target Series Count: ${numDatasets} dataset(s)${isMultiDataset ? ` (COMPARATIVE MULTI-SERIES REQUIRED)` : ` (Single series)`}
   ${multiDatasetInstruction}
5. SPECIAL TEACHER INSTRUCTIONS & DIFFERENTIATION:
   ${specialRequests ? `- PRIORITY REQUIREMENT: The teacher has submitted the following special customization requests:
     """${specialRequests}"""
   You MUST strictly honor and fulfill every single one of these special teacher requests across the generated narrative, data values, vocabulary, and questions while maintaining a valid JSON structure!` : `- Standard generation: Generate authentic, balanced performance task.`}
6. DATA TABLE COLUMNS WITH UNITS: Column labels in dataTable MUST explicitly include their scientific units in parentheses, e.g. "Normal Force (N)" and "Kinetic Friction Force (N)".
7. GRAPH EQUATION: Write clean math notation (e.g. "F_k = 0.402 · F_N" or "y = 0.402 x + 0.005") without programming asterisks '*' or unformatted computer syntax.
8. COMPLETE TOP-LEVEL JSON SCHEMA: Return a single valid JSON object containing ALL of the following top-level keys:
   - "title": "Engaging Scientific Title"
   - "discipline": "${discipline}"
   - "disciplineBadge": "${discipline === "Physics" ? "⚛️ Physics" : (discipline === "Biology" ? "🌿 Biology" : (discipline === "Chemistry" ? "🧪 Chemistry" : "🌋 Earth & Space"))}"
   - "targetGrade": "${gradeLevel}"
   - "ngssCode": "${isLowerGrade ? "MS-PS2-2" : "HS-PS2-1"}"
   - "ngssTitle": "NGSS Topic Name"
   - "sep": "SEP-4: Analyzing and Interpreting Data"
   - "ccc": "CCC-1: Patterns"
   - "chartType": "scatter"
   - "xAxis": { "label": string, "symbol": string, "unit": string, "min": 0, "suggestedMax": number }
   - "yAxis": { "label": string, "symbol": string, "unit": string, "min": 0, "suggestedMax": number }
   - "background": string (concise 55-80 words narrative describing apparatus & procedure)
   - "controlledVariables": [ "Controlled variable 1", "Controlled variable 2", "Controlled variable 3" ]
   - "calibratedInstrumentation": [ "Precision sensor 1", "Precision sensor 2" ]
   - "dataTable": {
       "caption": "Table 1: Measured ...",
       "columns": [
         { "key": "trial", "label": "Trial #", "isText": true },
         { "key": "x", "label": "Independent Var Name (unit)", "isX": true, "unit": "unit" },
         ${isMultiDataset ? Array.from({length: numDatasets}, (_, k) => `{ "key": "y${k+1}", "label": "Condition ${k+1} Name (unit)", "isY": true, "unit": "unit", "seriesId": "series${k+1}" }`).join(',\n         ') : '{ "key": "y", "label": "Dependent Var Name (unit)", "isY": true, "unit": "unit" }'}
       ],
       "rows": [
         { "trial": "Trial 1", "x": number, ${isMultiDataset ? Array.from({length: numDatasets}, (_, k) => `"y${k+1}": number`).join(', ') : '"y": number'} },
         { "trial": "Trial 2", "x": number, ${isMultiDataset ? Array.from({length: numDatasets}, (_, k) => `"y${k+1}": number`).join(', ') : '"y": number'} },
         { "trial": "Trial 3", "x": number, ${isMultiDataset ? Array.from({length: numDatasets}, (_, k) => `"y${k+1}": number`).join(', ') : '"y": number'} },
         { "trial": "Trial 4", "x": number, ${isMultiDataset ? Array.from({length: numDatasets}, (_, k) => `"y${k+1}": number`).join(', ') : '"y": number'} },
         { "trial": "Trial 5", "x": number, ${isMultiDataset ? Array.from({length: numDatasets}, (_, k) => `"y${k+1}": number`).join(', ') : '"y": number'} },
         { "trial": "Trial 6", "x": number, ${isMultiDataset ? Array.from({length: numDatasets}, (_, k) => `"y${k+1}": number`).join(', ') : '"y": number'} }
       ]
     }
   - "graphConfig": {
       ${isMultiDataset ? `"multiSeries": true,
       "series": [
         ${Array.from({length: numDatasets}, (_, k) => `{ "id": "series${k+1}", "key": "y${k+1}", "label": "Condition ${k+1} Name", "pointStyle": "${k === 0 ? 'circle' : (k === 1 ? 'triangle' : 'rectRot')}" }`).join(',\n         ')}
       ],` : ''}
       "showBestFitDefault": true,
       "beginAtZero": true,
       "slope": number,
       "intercept": number,
       "r2": number (between 0.95 and 1.0),
       "equation": string,
       "slopeMeaning": string
     }
   - "questions": {
       "anatomy": {
         "id": "anatomy_q",
         "independentVar": string,
         "dependentVar": string,
         "locatorPrompt": string,
         "expectedLocatorValue": number,
         "locatorTolerance": number,
         "locatorUnit": string,
         "interceptPrompt": string,
         "interceptOptions": [ "Option A", "Option B", "Option C", "Option D" ],
         "interceptCorrectIndex": integer 0-3,
         "interceptExplanation": string
       },
       "trend": {
         "id": "trend_q",
         "type": "multiple_choice",
         "prompt": string,
         "options": [ "Direct Linear", "Inverse", "Quadratic Non-Linear", "Plateau Saturation" ],
         "correctIndex": integer 0-3,
         "explanation": string
       },
       "quantitative": {
         "id": "quant_q",
         "type": "calculation",
         "title": "3. Calculating Rate of Change (Slope):",
         "prompt": "Using the slope formula (Δy / Δx), calculate the rate of change (slope) of the best-fit line connecting the variables.",
         "expectedValue": number (the slope value of the line, Δy / Δx),
         "tolerance": number,
         "unit": string,
         "hint": string,
         "slopeSteps": {
           "point1": { "x": number, "y": number, "label": string },
           "point2": { "x": number, "y": number, "label": string },
           "formulaSetup": string,
           "blankSetupWork": string,
           "calculatedSlope": number,
           "slopeUnit": string,
           "calcLabel": string,
           "physicalMeaning": string
         }
       },
       "freeResponse": {
         "id": "fr_q",
         "type": "cer",
         "prompt": string,
         "targetNumbers": [ number, number ],
         "requiredUnits": [ string ],
         "claimKeywords": [ string ],
         "reasoningKeywords": [ string ],
         "exemplar": string,
         "sentenceFrames": {
           "claimFrame": string,
           "evidenceFrame": string,
           "reasoningFrame": string
         }
       },
       "synthesis": {
         "id": "syn_q",
         "type": "multiple_choice",
         "prompt": string,
         "options": [ "Option A with units", "Option B with units", "Option C with units", "Option D with units" ],
         "correctIndex": integer 0-3,
         "explanation": string,
         "diagnosticPrompt": string,
         "diagnosticOptions": [ "Option A", "Option B", "Option C", "Option D" ],
         "diagnosticCorrectIndex": integer 0-3,
         "diagnosticExplanation": string
       }
     }
9. OUTPUT FORMAT: Return ONLY the raw JSON object. No markdown code blocks, backticks, or preamble text.`;

  const userPrompt = `Topic: "${topic}"
Discipline: "${discipline}"
Target Grade / Rigor: "${gradeLevel}"
Number of Datasets (Series): ${numDatasets} ${isMultiDataset ? `(Generate ${numDatasets} comparative series columns and graph series)` : `(Single series)`}
${specialRequests ? `Special Teacher Customization Requests: "${specialRequests}"\n(CRITICAL REQUIREMENT: Strictly adjust vocabulary, apparatus, numbers, and prompts to honor these requests!)` : ""}
Generate the complete JSON scenario object now. Remember: The background narrative MUST describe the experimental apparatus, sensor, and procedure (NOT textbook background definitions). Question 3 MUST be a slope / rate of change calculation (not an extrapolation problem).`;

  return { systemInstruction, userPrompt };
}

// Helper to strip HTML tags from strings for clean printing and display
function stripHtml(str) {
  if (!str || typeof str !== "string") return str || "";
  return str.replace(/<[^>]*>/g, "").trim();
}

// Helper to sanitize literal newlines and control characters inside JSON string literals
function sanitizeJsonString(str) {
  let result = "";
  let inString = false;
  let isEscaped = false;
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (ch === '"' && !isEscaped) {
      inString = !inString;
      result += ch;
    } else if (inString) {
      if (ch === '\\') {
        isEscaped = !isEscaped;
        result += ch;
      } else {
        isEscaped = false;
        if (ch === '\n') {
          result += '\\n';
        } else if (ch === '\r') {
          result += '\\r';
        } else if (ch === '\t') {
          result += '\\t';
        } else {
          result += ch;
        }
      }
    } else {
      isEscaped = false;
      result += ch;
    }
  }
  return result;
}

// Helper to extract valid JSON from Gemini AI text output with multi-stage recovery
function parseJsonText(rawText) {
  if (!rawText) return null;
  let cleaned = rawText.trim();
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace > -1 && lastBrace > -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  // Attempt 1: Direct JSON.parse
  try {
    return JSON.parse(cleaned);
  } catch (e1) {
    // Attempt 2: Trailing comma repair (e.g. [1, 2,] or {"a": 1,})
    try {
      const fixedCommas = cleaned.replace(/,\s*([}\]])/g, "$1");
      return JSON.parse(fixedCommas);
    } catch (e2) {
      // Attempt 3: Trailing commas + sanitize literal newlines/tabs inside quotes
      try {
        const fixedCommas = cleaned.replace(/,\s*([}\]])/g, "$1");
        const sanitized = sanitizeJsonString(fixedCommas);
        return JSON.parse(sanitized);
      } catch (e3) {
        console.error("Error parsing AI JSON:", e1.message, e3.message, rawText);
        return null;
      }
    }
  }
}

let isGeneratingAi = false;

async function generateAiScenario() {
  if (isGeneratingAi) return;

  const topicInput = document.getElementById("aiTopicInput");
  const discSelect = document.getElementById("aiDisciplineSelect");
  const gradeSelect = document.getElementById("aiGradeLevelSelect");
  const datasetSelect = document.getElementById("aiDatasetsSelect");
  const reqInput = document.getElementById("aiSpecialRequestsInput");

  const topic = topicInput ? topicInput.value.trim() : "";
  const discipline = discSelect ? discSelect.value : "Physics";
  const gradeLevel = gradeSelect ? gradeSelect.value : "High School (Grades 9-12 / Standard CAST)";
  const datasetCount = parseInt(datasetSelect ? datasetSelect.value : "1", 10) || 1;
  const specialRequests = reqInput ? reqInput.value.trim() : "";

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

const { systemInstruction, userPrompt } = buildAiPromptPayload({
      topic,
      discipline,
      gradeLevel,
      datasetCount,
      specialRequests
    });

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
      if (resJson.error) {
        throw new Error(`Proxy AI error: ${resJson.error.message || JSON.stringify(resJson.error)}`);
      }
      if (resJson.candidates && resJson.candidates[0]?.content?.parts?.[0]?.text) {
        rawText = resJson.candidates[0].content.parts[0].text;
      } else if (resJson.text) {
        rawText = resJson.text;
      } else if (typeof resJson === "string") {
        rawText = resJson;
      }

      if (!rawText || rawText.trim().length === 0) {
        const reason = resJson.candidates?.[0]?.finishReason || "UNKNOWN";
        throw new Error(`AI returned an empty response (finishReason: ${reason}). Please check your prompt or proxy settings.`);
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
      if (resJson.error) {
        throw new Error(`Gemini API error: ${resJson.error.message || JSON.stringify(resJson.error)}`);
      }
      rawText = resJson.candidates?.[0]?.content?.parts?.[0]?.text || "";
      if (!rawText || rawText.trim().length === 0) {
        const reason = resJson.candidates?.[0]?.finishReason || "UNKNOWN";
        throw new Error(`Gemini returned an empty response (finishReason: ${reason}).`);
      }
    }

    const scenario = parseJsonText(rawText);
    if (!scenario || typeof scenario !== "object") {
      console.error("AI output could not be parsed into object. Raw output:", rawText);
      throw new Error("AI output could not be parsed as valid JSON. Please try again.");
    }

    // Defensive fallback for title
    if (!scenario.title) {
      scenario.title = `${topic}: Empirical Investigation & Modeling`;
    }

    // Defensive fallback for questions wrapper if questions were placed at root
    if (!scenario.questions || typeof scenario.questions !== "object") {
      scenario.questions = {};
    }
    if (!scenario.questions.anatomy && scenario.anatomy) scenario.questions.anatomy = scenario.anatomy;
    if (!scenario.questions.trend && scenario.trend) scenario.questions.trend = scenario.trend;
    if (!scenario.questions.quantitative && scenario.quantitative) scenario.questions.quantitative = scenario.quantitative;
    if (!scenario.questions.freeResponse && scenario.freeResponse) scenario.questions.freeResponse = scenario.freeResponse;
    if (!scenario.questions.synthesis && scenario.synthesis) scenario.questions.synthesis = scenario.synthesis;

    // Defensive fallback for dataTable
    if (!scenario.dataTable && scenario.table) scenario.dataTable = scenario.table;
    if (!scenario.dataTable && scenario.data) scenario.dataTable = scenario.data;
    if (!scenario.dataTable && Array.isArray(scenario.rows)) {
      scenario.dataTable = { caption: `Table 1: Measured Data for ${scenario.title}`, columns: [], rows: scenario.rows };
    }
    if (!scenario.dataTable || typeof scenario.dataTable !== "object") {
      scenario.dataTable = {
        caption: `Table 1: Measured Data for ${scenario.title}`,
        columns: [],
        rows: []
      };
    }
    if (!Array.isArray(scenario.dataTable.rows) || scenario.dataTable.rows.length === 0) {
      scenario.dataTable.rows = [
        { trial: "Trial 1", x: 5, y: 2 },
        { trial: "Trial 2", x: 10, y: 4 },
        { trial: "Trial 3", x: 15, y: 6 },
        { trial: "Trial 4", x: 20, y: 8 },
        { trial: "Trial 5", x: 25, y: 10 },
        { trial: "Trial 6", x: 30, y: 12 }
      ];
    }

    // 3. Normalize & calibrate scenario properties
    const customId = `custom-ai-${Date.now()}`;
    scenario.id = customId;
    scenario.title = stripHtml(scenario.title);
    scenario.targetGrade = gradeLevel;
    if (specialRequests) scenario.specialRequests = specialRequests;
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
    scenario.xAxis.label = stripHtml(scenario.xAxis.label || "Independent Variable");
    scenario.yAxis.label = stripHtml(scenario.yAxis.label || "Dependent Variable");

    if (!Array.isArray(scenario.controlledVariables) || scenario.controlledVariables.length === 0) {
      scenario.controlledVariables = [
        "Identical laboratory environmental conditions",
        "Calibrated measurement apparatus throughout all trials",
        "Consistent release point and testing surface"
      ];
    }
    if (!Array.isArray(scenario.calibratedInstrumentation) || scenario.calibratedInstrumentation.length === 0) {
      scenario.calibratedInstrumentation = [
        "Calibrated digital laboratory sensor array",
        "High-precision electronic data logger"
      ];
    }

    // Strip duplicated title from background if AI prepended it
    if (scenario.background) {
      let bg = scenario.background;
      const titleClean = scenario.title;
      if (bg.toLowerCase().startsWith(titleClean.toLowerCase())) {
        bg = bg.slice(titleClean.length).replace(/^[:\s—–.-]+/, "");
      }
      bg = bg.replace(/^(?:[A-Z\s&]+INVESTIGATION\s*:\s*)?[A-Z\s,:—–-]+\.\s+/i, (match) => {
        if (match.toLowerCase().includes("investigation") || (scenario.title && match.toLowerCase().includes(scenario.title.toLowerCase().slice(0, 15)))) {
          return "";
        }
        return match;
      });
      scenario.background = bg.trim();
    } else {
      scenario.background = `Students conducted a controlled scientific investigation to examine the empirical relationship between ${scenario.xAxis.label} and ${scenario.yAxis.label}. Controlled variables were held constant across all consecutive trials to ensure scientific rigor and isolation of the primary variables.`;
    }

    // Clean equation syntax
    if (scenario.graphConfig?.equation) {
      scenario.graphConfig.equation = scenario.graphConfig.equation.replace(/\s*\*\s*/g, " · ");
    } else {
      scenario.graphConfig = {
        showBestFitDefault: true,
        beginAtZero: true,
        slope: 0.40,
        intercept: 0.0,
        r2: 0.99,
        equation: "y = 0.40 · x",
        slopeMeaning: `Rate of change of ${scenario.yAxis.label} per unit ${scenario.xAxis.label}`
      };
    }

    // Ensure Question 1 (anatomy) exists
    if (!scenario.questions.anatomy) {
      scenario.questions.anatomy = {
        id: "anatomy_q",
        independentVar: scenario.xAxis.label,
        dependentVar: scenario.yAxis.label,
        locatorPrompt: `Find a data point on the horizontal axis (${scenario.xAxis.label}). What is the corresponding value on the vertical axis?`,
        expectedLocatorValue: scenario.dataTable.rows[0]?.y ?? 2,
        locatorTolerance: 0.2,
        locatorUnit: scenario.yAxis.unit,
        interceptPrompt: `What is the physical meaning of the intercept when ${scenario.xAxis.label} is zero?`,
        interceptOptions: [
          "Without an applied input, the system remains at zero baseline output",
          "The system increases automatically without input",
          "The mass of the apparatus drops to zero",
          "The sensors are completely uncalibrated"
        ],
        interceptCorrectIndex: 0,
        interceptExplanation: "At zero independent variable, the system output stays at baseline."
      };
    }

    // Ensure Question 2 (trend) exists
    if (!scenario.questions.trend) {
      scenario.questions.trend = {
        id: "trend_q",
        type: "multiple_choice",
        prompt: `What mathematical pattern best connects ${scenario.xAxis.label} and ${scenario.yAxis.label}?`,
        options: [
          "Direct Linear Relationship",
          "Inverse Relationship",
          "Quadratic Non-Linear Growth",
          "Plateau / Saturation Curve"
        ],
        correctIndex: 0,
        explanation: "The data demonstrates a clear, proportional direct relationship across trials."
      };
    }

    // Ensure Question 3 (quantitative) exists
    if (!scenario.questions.quantitative) {
      const r0 = scenario.dataTable.rows[0] || { x: 5, y: 2 };
      const rLast = scenario.dataTable.rows[scenario.dataTable.rows.length - 1] || { x: 30, y: 12 };
      const dx = (rLast.x - r0.x) || 1;
      const dy = (rLast.y - r0.y) || 1;
      const calcRate = parseFloat((dy / dx).toFixed(3));
      scenario.questions.quantitative = {
        id: "quant_q",
        type: "calculation",
        prompt: `Calculate the rate of change (slope) of ${scenario.yAxis.label} with respect to ${scenario.xAxis.label}.`,
        expectedValue: calcRate,
        tolerance: 0.1,
        unit: `${scenario.yAxis.unit} / ${scenario.xAxis.unit}`,
        hint: `Slope = Δy / Δx = (${rLast.y} - ${r0.y}) / (${rLast.x} - ${r0.x})`,
        slopeSteps: {
          point1: { x: r0.x, y: r0.y, label: "Trial 1" },
          point2: { x: rLast.x, y: rLast.y, label: `Trial ${scenario.dataTable.rows.length}` },
          formulaSetup: `Δy / Δx = (${rLast.y} - ${r0.y}) / (${rLast.x} - ${r0.x})`,
          calculatedSlope: calcRate,
          slopeUnit: `${scenario.yAxis.unit} / ${scenario.xAxis.unit}`,
          physicalMeaning: `Rate of change of ${scenario.yAxis.label} per unit ${scenario.xAxis.label}`
        }
      };
    }

    // Ensure Question 4 (freeResponse) exists
    if (!scenario.questions.freeResponse) {
      const r0 = scenario.dataTable.rows[0] || { x: 5, y: 2 };
      const rLast = scenario.dataTable.rows[scenario.dataTable.rows.length - 1] || { x: 30, y: 12 };
      scenario.questions.freeResponse = {
        id: "fr_q",
        type: "cer",
        prompt: `Write a scientific argument (Claim-Evidence-Reasoning) explaining how changes in ${scenario.xAxis.label} affect ${scenario.yAxis.label}.`,
        targetNumbers: [r0.x, r0.y, rLast.x, rLast.y],
        requiredUnits: [scenario.xAxis.unit, scenario.yAxis.unit],
        claimKeywords: ["increases", "proportional", "direct"],
        reasoningKeywords: ["because", "due to", "causes", "relationship"],
        exemplar: `As ${scenario.xAxis.label} increases, ${scenario.yAxis.label} increases proportionally. In Trial 1, when ${scenario.xAxis.label} was ${r0.x} ${scenario.xAxis.unit}, ${scenario.yAxis.label} was ${r0.y} ${scenario.yAxis.unit}. In Trial ${scenario.dataTable.rows.length}, it reached ${rLast.y} ${scenario.yAxis.unit}. This relationship occurs because of fundamental physical interactions.`,
        sentenceFrames: {
          claimFrame: `As ${scenario.xAxis.label} increases, ${scenario.yAxis.label} [increases/decreases].`,
          evidenceFrame: `When ${scenario.xAxis.label} was [X1] ${scenario.xAxis.unit}, ${scenario.yAxis.label} was [Y1] ${scenario.yAxis.unit}, and when it changed to [X2], it reached [Y2].`,
          reasoningFrame: `This pattern occurs because [scientific mechanism connecting variables].`
        }
      };
    }

    // Ensure Question 5 (synthesis) exists
    if (!scenario.questions.synthesis) {
      scenario.questions.synthesis = {
        id: "syn_q",
        type: "multiple_choice",
        prompt: `Based on the mathematical model, predict what happens if ${scenario.xAxis.label} is increased beyond the tested range.`,
        options: [
          `The ${scenario.yAxis.label} continues to increase following the linear model`,
          `The ${scenario.yAxis.label} immediately drops to zero`,
          `The measured relationship reverses direction unpredictably`,
          `The physical apparatus stops functioning altogether`
        ],
        correctIndex: 0,
        explanation: "Empirical best-fit models allow scientific extrapolation within physical boundaries.",
        diagnosticPrompt: `A student claims that indefinitely increasing ${scenario.xAxis.label} will produce infinite ${scenario.yAxis.label}. Why is this reasoning flawed?`,
        diagnosticOptions: [
          "Real-world physical systems have physical boundary limits (saturation, friction, or structural thresholds)",
          "The mathematical formula forbids values larger than 100",
          "Graphs cannot be extended past the tested points under any circumstance",
          "Calculations are only valid for integers"
        ],
        diagnosticCorrectIndex: 0,
        diagnosticExplanation: "All empirical models operate within physical boundary constraints."
      };
    }

    // Clean questions strings of raw HTML tags
    if (scenario.questions?.anatomy) {
      scenario.questions.anatomy.independentVar = stripHtml(scenario.questions.anatomy.independentVar);
      scenario.questions.anatomy.dependentVar = stripHtml(scenario.questions.anatomy.dependentVar);
      scenario.questions.anatomy.locatorPrompt = stripHtml(scenario.questions.anatomy.locatorPrompt);
    }
    if (scenario.questions?.trend) {
      scenario.questions.trend.prompt = stripHtml(scenario.questions.trend.prompt);
      if (Array.isArray(scenario.questions.trend.options)) {
        scenario.questions.trend.options = scenario.questions.trend.options.map(opt => stripHtml(opt));
      }
    }
    if (scenario.questions?.quantitative) {
      scenario.questions.quantitative.prompt = stripHtml(scenario.questions.quantitative.prompt);
    }
    if (scenario.questions?.freeResponse) {
      scenario.questions.freeResponse.prompt = stripHtml(scenario.questions.freeResponse.prompt);
    }
    if (scenario.questions?.synthesis) {
      scenario.questions.synthesis.prompt = stripHtml(scenario.questions.synthesis.prompt);
      if (Array.isArray(scenario.questions.synthesis.options)) {
        scenario.questions.synthesis.options = scenario.questions.synthesis.options.map(opt => stripHtml(opt));
      }
    }

    scenario.dataTable.rows = scenario.dataTable.rows.map((r, i) => {
      const row = { trial: r.trial || `Trial ${i + 1}` };
      
      // Determine X value
      if (typeof r.x === "number") {
        row.x = r.x;
      } else {
        const xKey = Object.keys(r).find(k => k === "x" || k === "distance" || k === "time" || k === "conc" || k === "temp");
        if (xKey && typeof r[xKey] === "number") row.x = r[xKey];
        else row.x = (i + 1) * 5;
      }

      // Preserve all numeric properties from r (including y, y1, y2, y3, or custom series keys)
      Object.keys(r).forEach(k => {
        if (k !== "trial" && typeof r[k] === "number") {
          row[k] = r[k];
        }
      });

      // Ensure fallback y exists if single series
      if (typeof row.y !== "number" && typeof row.y1 === "number") {
        row.y = row.y1;
      } else if (typeof row.y !== "number" && typeof row.y1 !== "number") {
        row.y = (i + 1) * 2;
      }

      return row;
    });

    // Ensure multi-series graphConfig is set if datasetCount > 1
    if (datasetCount > 1) {
      if (!scenario.graphConfig) scenario.graphConfig = {};
      scenario.graphConfig.multiSeries = true;
      if (!Array.isArray(scenario.graphConfig.series) || scenario.graphConfig.series.length < datasetCount) {
        const yCols = scenario.dataTable.columns.filter(c => c.isY);
        scenario.graphConfig.series = Array.from({ length: datasetCount }, (_, k) => {
          const col = yCols[k];
          const colKey = col ? col.key : `y${k + 1}`;
          const colLabel = col ? col.label.replace(/\s*\([^)]*\)/, "") : `Condition ${k + 1}`;
          return {
            id: `series${k + 1}`,
            key: colKey,
            label: colLabel,
            pointStyle: k === 0 ? "circle" : (k === 1 ? "triangle" : "rectRot")
          };
        });
      }
    }

    if (!scenario.dataTable.columns || scenario.dataTable.columns.length < 3) {
      scenario.dataTable.columns = [
        { key: "trial", label: "Trial #", isText: true },
        { key: "x", label: `${scenario.xAxis.label} (${scenario.xAxis.unit})`, isX: true, unit: scenario.xAxis.unit },
        { key: "y", label: `${scenario.yAxis.label} (${scenario.yAxis.unit})`, isY: true, unit: scenario.yAxis.unit }
      ];
    } else {
      // Ensure existing columns explicitly display scientific units in parentheses
      scenario.dataTable.columns = scenario.dataTable.columns.map(col => {
        let lbl = stripHtml(col.label || "");
        if (col.isX && scenario.xAxis?.unit && !lbl.includes("(") && !lbl.toLowerCase().includes(scenario.xAxis.unit.toLowerCase())) {
          lbl = `${lbl} (${scenario.xAxis.unit})`;
        } else if (col.isY && scenario.yAxis?.unit && !lbl.includes("(") && !lbl.toLowerCase().includes(scenario.yAxis.unit.toLowerCase())) {
          lbl = `${lbl} (${scenario.yAxis.unit})`;
        }
        return { ...col, label: lbl };
      });
    }

    // Populate manual builder form inputs
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val;
    };
    setVal("teacherTitleInput", scenario.title || "");
    setVal("teacherDisciplineSelect", scenario.discipline || "Physics");
    setVal("teacherGradeLevelSelect", scenario.targetGrade || "High School (Grades 9-12 / Standard CAST)");
    setVal("teacherNgssCodeInput", scenario.ngssCode || "");
    setVal("teacherBgTextarea", scenario.background || "");
    setVal("teacherXLabelInput", scenario.xAxis.label || "");
    setVal("teacherXUnitInput", scenario.xAxis.unit || "");
    setVal("teacherYLabelInput", scenario.yAxis.label || "");
    setVal("teacherYUnitInput", scenario.yAxis.unit || "");

    const detectedDatasets = scenario.graphConfig?.multiSeries 
      ? (scenario.graphConfig.series?.length || 2)
      : (scenario.dataTable.columns.filter(c => c.isY).length || 1);
    setVal("teacherDatasetsSelect", String(detectedDatasets > 1 ? (detectedDatasets >= 3 ? 3 : 2) : 1));

    const yCols = scenario.dataTable.columns.filter(c => c.isY);
    if (detectedDatasets > 1 && yCols.length > 1) {
      setVal("teacherDataRowsInput", scenario.dataTable.rows.map(r => {
        const yVals = yCols.map(c => r[c.key] !== undefined ? r[c.key] : (r[c.seriesId] !== undefined ? r[c.seriesId] : 0));
        return `${r.x}, ${yVals.join(", ")}`;
      }).join("\n"));
    } else {
      setVal("teacherDataRowsInput", scenario.dataTable.rows.map(r => `${r.x}, ${r.y}`).join("\n"));
    }
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

  const datasetSelect = document.getElementById("teacherDatasetsSelect");
  const numDatasets = parseInt(datasetSelect ? datasetSelect.value : "1", 10) || 1;

  if (!title || !bg || !rawData) {
    alert("Please enter at least Title, Background Narrative, and Data Rows.");
    return;
  }

  // Parse CSV data rows (format: x, y per line for 1 series; x, y1, y2 for 2 series; x, y1, y2, y3 for 3 series)
  const rows = [];
  rawData.split("\n").forEach((line, idx) => {
    const parts = line.split(",").map(p => p.trim());
    if (parts.length >= (numDatasets + 1)) {
      const x = parseFloat(parts[0]);
      if (!isNaN(x)) {
        const row = {
          trial: `Trial ${idx + 1}`,
          x: x
        };
        let allValid = true;
        for (let k = 1; k <= numDatasets; k++) {
          const val = parseFloat(parts[k]);
          if (isNaN(val)) {
            allValid = false;
            break;
          }
          if (numDatasets === 1) {
            row.y = val;
          } else {
            row[`y${k}`] = val;
            if (k === 1) row.y = val;
          }
        }
        if (allValid) {
          rows.push(row);
        }
      }
    } else if (parts.length >= 2 && numDatasets === 1) {
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
    const formatHelp = numDatasets === 1 ? "X, Y" : (numDatasets === 2 ? "X, Y1, Y2" : "X, Y1, Y2, Y3");
    alert(`No valid numerical data pairs found in Data Rows. For ${numDatasets} dataset(s), use format: ${formatHelp} (one per line).`);
    return;
  }

  // If activeScenario was just generated or custom, inherit rich 5-part architecture defaults
  const baseQuestions = (activeScenario && activeScenario.questions) ? activeScenario.questions : {};

  const gradeLevel = document.getElementById("teacherGradeLevelSelect") ? document.getElementById("teacherGradeLevelSelect").value : "High School (Grades 9-12 / Standard CAST)";

  const customId = `custom-${Date.now()}`;
  const customScenario = {
    id: customId,
    title: title,
    discipline: discipline,
    disciplineBadge: discipline === "Physics" ? "⚛️ Physics" : (discipline === "Biology" ? "🌿 Biology" : (discipline === "Chemistry" ? "🧪 Chemistry" : "🌋 Earth & Space")),
    targetGrade: gradeLevel,
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
      columns: numDatasets === 1 ? [
        { key: "trial", label: "Trial #", isText: true },
        { key: "x", label: `${xLabel} (${xUnit})`, isX: true, unit: xUnit },
        { key: "y", label: `${yLabel} (${yUnit})`, isY: true, unit: yUnit }
      ] : [
        { key: "trial", label: "Trial #", isText: true },
        { key: "x", label: `${xLabel} (${xUnit})`, isX: true, unit: xUnit },
        ...Array.from({ length: numDatasets }, (_, k) => ({
          key: `y${k + 1}`,
          label: `${yLabel} - Condition ${String.fromCharCode(65 + k)} (${yUnit})`,
          isY: true,
          unit: yUnit,
          seriesId: `cond${String.fromCharCode(65 + k)}`
        }))
      ],
      rows: rows
    },
    graphConfig: numDatasets === 1 ? {
      showBestFitDefault: true,
      beginAtZero: true,
      equation: "Custom Teacher Model"
    } : {
      multiSeries: true,
      series: Array.from({ length: numDatasets }, (_, k) => ({
        id: `cond${String.fromCharCode(65 + k)}`,
        key: `y${k + 1}`,
        label: `${yLabel} - Condition ${String.fromCharCode(65 + k)}`,
        pointStyle: k === 0 ? "circle" : (k === 1 ? "triangle" : "rectRot")
      })),
      showBestFitDefault: true,
      beginAtZero: true,
      equation: `Comparative Model (${numDatasets} Conditions)`
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
  let sub = `${scenario.disciplineBadge} Investigation • ${scenario.ngssTitle} (${scenario.ngssCode})`;
  if (scenario.targetGrade && !scenario.targetGrade.startsWith("High School")) {
    sub += ` • ${scenario.targetGrade.split("/")[0].trim()}`;
  }
  if (pHeaderSub) pHeaderSub.textContent = sub;
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
  if (pScenarioTitle) pScenarioTitle.textContent = "INVESTIGATION PROCEDURE & EXPERIMENTAL SETUP";
  if (pScenarioText) {
    let cleanBg = stripHtml(scenario.background || "");
    const titleClean = stripHtml(scenario.title || "");
    if (cleanBg.toLowerCase().startsWith(titleClean.toLowerCase())) {
      cleanBg = cleanBg.slice(titleClean.length).replace(/^[:\s—–.-]+/, "");
    }
    cleanBg = cleanBg.replace(/^(?:[A-Z\s&]+INVESTIGATION\s*:\s*)?[A-Z\s,:—–-]+\.\s+/i, (match) => {
      if (match.toLowerCase().includes("investigation") || (scenario.title && match.toLowerCase().includes(scenario.title.toLowerCase().slice(0, 15)))) {
        return "";
      }
      return match;
    });
    pScenarioText.textContent = cleanBg;
  }

  // 3. Experimental Data Table
  const pTableCaption = document.getElementById("pTableCaption");
  const pTableWrapper = document.getElementById("pTableWrapper");
  if (pTableCaption) pTableCaption.textContent = stripHtml(scenario.dataTable.caption);
  if (pTableWrapper) {
    let tHtml = `<table class="p-table"><thead><tr>`;
    scenario.dataTable.columns.forEach(col => {
      let colLabel = col.label;
      if (col.isX && scenario.xAxis?.unit && !colLabel.includes("(") && !colLabel.toLowerCase().includes(scenario.xAxis.unit.toLowerCase())) {
        colLabel = `${colLabel} (${scenario.xAxis.unit})`;
      } else if (col.isY && scenario.yAxis?.unit && !colLabel.includes("(") && !colLabel.toLowerCase().includes(scenario.yAxis.unit.toLowerCase())) {
        colLabel = `${colLabel} (${scenario.yAxis.unit})`;
      }
      tHtml += `<th>${stripHtml(colLabel)}</th>`;
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
  if (pGraphModelBadge) {
    let eq = scenario.graphConfig.equation || "Model";
    eq = eq.replace(/\s*\*\s*/g, " · ");
    pGraphModelBadge.textContent = eq;
  }

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

  if (pQ0Prompt && anatomy) pQ0Prompt.textContent = stripHtml(anatomy.locatorPrompt);
  if (pQ0X && anatomy) pQ0X.textContent = stripHtml(anatomy.independentVar);
  if (pQ0Y && anatomy) pQ0Y.textContent = stripHtml(anatomy.dependentVar);
  if (pQ0Value) pQ0Value.textContent = (!isBlank && resp.anatomyLocatorAnswer) ? resp.anatomyLocatorAnswer : "";
  if (pQ0Unit && anatomy) pQ0Unit.textContent = stripHtml(anatomy.locatorUnit);

  // Part 2: Trend Pattern
  const pQ1Prompt = document.getElementById("pQ1Prompt");
  const pQ1Answer = document.getElementById("pQ1Answer");
  if (pQ1Prompt) pQ1Prompt.textContent = stripHtml(scenario.questions.trend.prompt);
  if (pQ1Answer) {
    if (!isBlank && resp.trendAnswer !== null && scenario.questions.trend.options[resp.trendAnswer]) {
      const isCor = resp.scores.trend === 1;
      pQ1Answer.innerHTML = `<span style="font-weight:400; color:#1e293b;">Selected Trend: <strong>${stripHtml(scenario.questions.trend.options[resp.trendAnswer])}</strong></span> <span style="color:${isCor ? '#15803d' : '#b91c1c'}; font-weight:700;">(${isCor ? '✓ 1/1 pt' : '0/1 pt'})</span>`;
    } else {
      // Clean options: each on its own line, unbolded normal text, clear checkbox
      const optionsHtml = scenario.questions.trend.options.map(opt => `
        <div class="p-mc-option">
          <span class="p-mc-checkbox">[ &nbsp; ]</span>
          <span class="p-mc-text">${stripHtml(opt)}</span>
        </div>
      `).join("");
      pQ1Answer.innerHTML = `<div class="p-mc-options-list">${optionsHtml}</div>`;
    }
  }

  // Part 3: Rate of Change / Quantitative Calculation with Setup Work
  const pQ2Header = document.getElementById("pQ2Header");
  const pQ2Prompt = document.getElementById("pQ2Prompt");
  const pQ2Value = document.getElementById("pQ2Value");
  const pQ2Unit = document.getElementById("pQ2Unit");
  const pQ2Work = document.getElementById("pQ2Work");
  const pQ2Label = document.getElementById("pQ2Label");
  const quantQ = scenario.questions.quantitative;

  if (pQ2Header) {
    pQ2Header.textContent = quantQ.title || "3. Calculating Rate of Change (Slope):";
  }
  if (pQ2Prompt) pQ2Prompt.textContent = stripHtml(quantQ.prompt);
  if (pQ2Value) pQ2Value.textContent = (!isBlank && resp.quantAnswer) ? resp.quantAnswer : "";
  if (pQ2Unit) pQ2Unit.textContent = stripHtml(quantQ.unit);
  if (pQ2Label) {
    pQ2Label.textContent = quantQ.slopeSteps?.calcLabel || "Calculated Rate (Slope):";
  }
  if (pQ2Work) {
    if (!isBlank && quantQ.slopeSteps?.formulaSetup) {
      pQ2Work.textContent = quantQ.slopeSteps.formulaSetup;
    } else if (quantQ.slopeSteps?.blankSetupWork) {
      pQ2Work.textContent = quantQ.slopeSteps.blankSetupWork;
    } else {
      pQ2Work.textContent = "Δy / Δx = ( _____ − _____ ) / ( _____ − _____ )";
    }
  }

  // Part 4: Free Response CER & 4-Point Rubric Bar
  const pQ3Prompt = document.getElementById("pQ3Prompt");
  const pCerText = document.getElementById("pCerText");
  const pRubClaim = document.getElementById("pRubClaim");
  const pRubEvidence = document.getElementById("pRubEvidence");
  const pRubUnits = document.getElementById("pRubUnits");
  const pRubReasoning = document.getElementById("pRubReasoning");
  const pRubTotal = document.getElementById("pRubTotal");

  if (pQ3Prompt) pQ3Prompt.textContent = stripHtml(scenario.questions.freeResponse.prompt);
  if (pCerText) {
    if (!isBlank && resp.frAnswer && resp.frAnswer.trim().length > 0) {
      pCerText.textContent = resp.frAnswer;
      pCerText.style.fontStyle = "normal";
      pCerText.style.color = "#0f172a";
    } else {
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
    pRubTotal.textContent = !isBlank ? `[ ${cerResult.score} / 4 Pts ]` : `[ ____ / 4 Pts ]`;
    pRubTotal.style.color = (!isBlank && cerResult.score >= 3) ? '#15803d' : '#0284c7';
  }

  // Part 5: Prediction & Real-World Application
  const pQ4Prompt = document.getElementById("pQ4Prompt");
  const pQ4Answer = document.getElementById("pQ4Answer");
  if (pQ4Prompt) pQ4Prompt.textContent = stripHtml(scenario.questions.synthesis.prompt);
  if (pQ4Answer) {
    if (!isBlank && resp.synAnswer !== null && scenario.questions.synthesis.options[resp.synAnswer]) {
      const isCor = resp.scores.syn === 1;
      pQ4Answer.innerHTML = `<span style="font-weight:400; color:#1e293b;">Selected Prediction: <strong>${stripHtml(scenario.questions.synthesis.options[resp.synAnswer])}</strong></span> <span style="color:${isCor ? '#15803d' : '#b91c1c'}; font-weight:700;">(${isCor ? '✓ 1/1 pt' : '0/1 pt'})</span>`;
    } else {
      const synOpts = (scenario.questions.synthesis && Array.isArray(scenario.questions.synthesis.options)) ? scenario.questions.synthesis.options : [];
      if (synOpts.length > 0) {
        const avgLen = synOpts.reduce((sum, o) => sum + o.length, 0) / synOpts.length;
        if (avgLen <= 18) {
          const synHtml = synOpts.map(opt => `
            <span class="p-mc-option" style="display:inline-flex; margin-right:16px;">
              <span class="p-mc-checkbox">[ &nbsp; ]</span>
              <span class="p-mc-text">${stripHtml(opt)}</span>
            </span>
          `).join("");
          pQ4Answer.innerHTML = `<div style="margin-top:2px;">${synHtml}</div>`;
        } else {
          const synHtml = synOpts.map(opt => `
            <div class="p-mc-option">
              <span class="p-mc-checkbox">[ &nbsp; ]</span>
              <span class="p-mc-text">${stripHtml(opt)}</span>
            </div>
          `).join("");
          pQ4Answer.innerHTML = `<div class="p-mc-options-list">${synHtml}</div>`;
        }
      } else {
        pQ4Answer.innerHTML = `<span style="color:#475569; font-size:7.4pt; font-weight:400;">Prediction: _________________________________________________</span>`;
      }
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
    parseJsonText,
    buildAiPromptPayload,
    setAiSpecialPreset
  };
}
