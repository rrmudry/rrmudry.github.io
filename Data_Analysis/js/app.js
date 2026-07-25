/**
 * Data Analysis & CAST Graphing Engine
 */

let chartInstance = null;
let currentDataset = {
  title: "Photosynthesis Rate vs. Light Intensity",
  xAxisLabel: "Light Intensity",
  xAxisUnit: "mW/cm²",
  yAxisLabel: "Oxygen Production Rate",
  yAxisUnit: "mL/min",
  xMin: "",
  xMax: "",
  yMin: "",
  yMax: "",
  showZero: true,
  showGrid: true,
  chartType: "scatter",
  showBestFit: true,
  data: [
    { x: 10, y: 2.1 },
    { x: 20, y: 4.5 },
    { x: 30, y: 7.2 },
    { x: 40, y: 9.8 },
    { x: 50, y: 12.0 },
    { x: 60, y: 12.3 },
    { x: 70, y: 12.4 }
  ],
  cer: {
    claim: "",
    evidence: "",
    reasoning: ""
  },
  questions: [
    {
      id: "q1",
      text: "What pattern does the graph display between light intensity and oxygen production?",
      options: [
        "Directly proportional across the entire range",
        "Increases linearly at lower light levels, then plateaus at high intensity",
        "Inversely proportional throughout the experiment",
        "No correlation between light intensity and rate"
      ],
      correctIndex: 1,
      explanation: "Oxygen production increases steadily until light is no longer the limiting factor (around 50 mW/cm²), at which point the rate levels off."
    },
    {
      id: "q2",
      text: "Predict the expected rate of oxygen production at a light intensity of 35 mW/cm².",
      options: [
        "~5.0 mL/min",
        "~8.5 mL/min",
        "~12.0 mL/min",
        "~15.0 mL/min"
      ],
      correctIndex: 1,
      explanation: "Interpolating between 30 mW/cm² (7.2 mL/min) and 40 mW/cm² (9.8 mL/min) gives approximately 8.5 mL/min."
    }
  ]
};

const presets = {
  photosynthesis: {
    title: "Photosynthesis Rate vs. Light Intensity",
    xAxisLabel: "Light Intensity",
    xAxisUnit: "mW/cm²",
    yAxisLabel: "Oxygen Production Rate",
    yAxisUnit: "mL/min",
    xMin: "", xMax: "", yMin: "", yMax: "", showZero: true, showGrid: true,
    chartType: "scatter",
    showBestFit: true,
    data: [
      { x: 10, y: 2.1 },
      { x: 20, y: 4.5 },
      { x: 30, y: 7.2 },
      { x: 40, y: 9.8 },
      { x: 50, y: 12.0 },
      { x: 60, y: 12.3 },
      { x: 70, y: 12.4 }
    ],
    cer: { claim: "", evidence: "", reasoning: "Elodea plants increase photosynthesis under higher light until enzyme/carbon saturation occurs." },
    questions: [
      {
        id: "q1",
        text: "What pattern does the graph display between light intensity and oxygen production?",
        options: [
          "Directly proportional across the entire range",
          "Increases linearly at lower light levels, then plateaus at high intensity",
          "Inversely proportional throughout the experiment",
          "No correlation between light intensity and rate"
        ],
        correctIndex: 1,
        explanation: "Oxygen production increases steadily until light is no longer the limiting factor (around 50 mW/cm²), at which point the rate levels off."
      },
      {
        id: "q2",
        text: "Predict the expected rate of oxygen production at a light intensity of 35 mW/cm².",
        options: [
          "~5.0 mL/min",
          "~8.5 mL/min",
          "~12.0 mL/min",
          "~15.0 mL/min"
        ],
        correctIndex: 1,
        explanation: "Interpolating between 30 mW/cm² (7.2 mL/min) and 40 mW/cm² (9.8 mL/min) gives approximately 8.5 mL/min."
      }
    ]
  },
  tectonic: {
    title: "Plate Age vs. Distance from Mid-Ocean Ridge",
    xAxisLabel: "Distance from Ridge",
    xAxisUnit: "km",
    yAxisLabel: "Seafloor Age",
    yAxisUnit: "Million Years",
    xMin: "", xMax: "", yMin: "", yMax: "", showZero: true, showGrid: true,
    chartType: "scatter",
    showBestFit: true,
    data: [
      { x: 0, y: 0 },
      { x: 100, y: 5 },
      { x: 200, y: 10 },
      { x: 300, y: 15 },
      { x: 400, y: 20 },
      { x: 500, y: 25 }
    ],
    cer: { claim: "", evidence: "", reasoning: "New oceanic crust forms at mid-ocean ridge crests and moves outward as tectonic plates diverge." },
    questions: [
      {
        id: "q1",
        text: "What is the spreading rate of the oceanic crust based on the linear trend line?",
        options: [
          "10 km per million years",
          "20 km per million years",
          "50 km per million years",
          "100 km per million years"
        ],
        correctIndex: 1,
        explanation: "Slope = ΔX / ΔY = (500 - 0 km) / (25 - 0 Ma) = 20 km per million years (or 2 cm/year)."
      }
    ]
  },
  pendulum: {
    title: "Pendulum Length vs. Period of Oscillation",
    xAxisLabel: "Pendulum Length",
    xAxisUnit: "m",
    yAxisLabel: "Period (T)",
    yAxisUnit: "seconds",
    xMin: "", xMax: "", yMin: "", yMax: "", showZero: true, showGrid: true,
    chartType: "scatter",
    showBestFit: true,
    data: [
      { x: 0.2, y: 0.90 },
      { x: 0.4, y: 1.27 },
      { x: 0.6, y: 1.55 },
      { x: 0.8, y: 1.79 },
      { x: 1.0, y: 2.01 }
    ],
    cer: { claim: "", evidence: "", reasoning: "The period of a simple pendulum depends on length and gravity T = 2π√(L/g)." },
    questions: [
      {
        id: "q1",
        text: "How does quadrupling the length of a pendulum affect its oscillation period?",
        options: [
          "Quadruples the period",
          "Doubles the period",
          "Has no effect on period",
          "Halves the period"
        ],
        correctIndex: 1,
        explanation: "Because T ∝ √L, quadrupling L (from 0.2m to 0.8m) doubles T (from ~0.9s to ~1.8s)."
      }
    ]
  },
  kinematics: {
    title: "Toy Car Speed & Kinematics",
    xAxisLabel: "Time",
    xAxisUnit: "seconds (s)",
    yAxisLabel: "Distance Traveled",
    yAxisUnit: "meters (m)",
    xMin: "", xMax: "", yMin: "", yMax: "", showZero: true, showGrid: true,
    chartType: "scatter",
    showBestFit: true,
    data: [
      { x: 0, y: 0 },
      { x: 1, y: 2.5 },
      { x: 2, y: 5.1 },
      { x: 3, y: 7.4 },
      { x: 4, y: 10.2 },
      { x: 5, y: 12.6 }
    ],
    cer: { claim: "", evidence: "", reasoning: "A straight line on a distance vs. time graph indicates constant speed equal to the slope of the line." },
    questions: [
      {
        id: "q1",
        text: "What is the average velocity of the toy car between t = 0s and t = 5s?",
        options: [
          "1.25 m/s",
          "2.52 m/s",
          "5.00 m/s",
          "12.6 m/s"
        ],
        correctIndex: 1,
        explanation: "Velocity = ΔDistance / ΔTime = 12.6 m / 5 s = 2.52 m/s."
      }
    ]
  }
};

function switchTab(tabKey) {
  ['data', 'axes', 'math', 'cer'].forEach(k => {
    document.getElementById(`tabContent-${k}`).style.display = 'none';
    document.getElementById(`tabBtn-${k}`).classList.remove('active');
  });
  document.getElementById(`tabContent-${tabKey}`).style.display = 'flex';
  document.getElementById(`tabBtn-${tabKey}`).classList.add('active');
}

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initUI();
  renderTable();
  renderChart();
  renderQuestions();
});

function initTheme() {
  const toggleBtn = document.getElementById('themeToggleBtn');
  const savedTheme = localStorage.getItem('data_analysis_theme') || 'light';
  
  if (savedTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    toggleBtn.innerText = '☀️ Light Mode';
  } else {
    document.documentElement.removeAttribute('data-theme');
    toggleBtn.innerText = '🌙 Dark Mode';
  }

  toggleBtn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    if (current === 'dark') {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('data_analysis_theme', 'light');
      toggleBtn.innerText = '🌙 Dark Mode';
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('data_analysis_theme', 'dark');
      toggleBtn.innerText = '☀️ Light Mode';
    }
    renderChart();
  });
}

function initUI() {
  document.getElementById('presetSelect').addEventListener('change', (e) => {
    const key = e.target.value;
    if (key === 'custom') {
      currentDataset.questions = [];
      currentDataset.data = [{ x: 0, y: 0 }];
    } else if (presets[key]) {
      currentDataset = JSON.parse(JSON.stringify(presets[key]));
    }
    syncInputsFromState();
    renderTable();
    renderChart();
    renderQuestions();
    updateCERPreview();
    updatePointSelectors();
  });

  // Inputs sync back to currentDataset
  ['graphTitleInput', 'xAxisLabelInput', 'xAxisUnitInput', 'yAxisLabelInput', 'yAxisUnitInput', 'xMinInput', 'xMaxInput', 'yMinInput', 'yMaxInput'].forEach(id => {
    document.getElementById(id).addEventListener('input', () => {
      syncStateFromInputs();
      renderChart();
    });
  });

  document.getElementById('chartTypeSelect').addEventListener('change', () => {
    syncStateFromInputs();
    renderTable();
    renderChart();
  });

  ['bestFitToggle', 'showZeroToggle', 'showGridToggle'].forEach(id => {
    document.getElementById(id).addEventListener('change', () => {
      syncStateFromInputs();
      renderChart();
    });
  });

  document.getElementById('addRowBtn').addEventListener('click', () => {
    const last = currentDataset.data[currentDataset.data.length - 1] || { x: 0, y: 0 };
    currentDataset.data.push({ x: Number(last.x) + 1, y: Number(last.y) + 1 });
    renderTable();
    renderChart();
    updatePointSelectors();
  });

  document.getElementById('clearDataBtn').addEventListener('click', () => {
    currentDataset.data = [{ x: 0, y: 0 }];
    renderTable();
    renderChart();
    updatePointSelectors();
  });

  document.getElementById('exportPngBtn').addEventListener('click', exportChartImage);
  document.getElementById('saveJsonBtn').addEventListener('click', exportDataJSON);
  document.getElementById('loadJsonInput').addEventListener('change', importDataJSON);
  document.getElementById('autoEvidenceBtn').addEventListener('click', insertAutoEvidence);

  // CER Listeners
  ['cerClaim', 'cerEvidence', 'cerReasoning'].forEach(id => {
    document.getElementById(id).addEventListener('input', () => {
      currentDataset.cer = {
        claim: document.getElementById('cerClaim').value,
        evidence: document.getElementById('cerEvidence').value,
        reasoning: document.getElementById('cerReasoning').value
      };
      updateCERPreview();
    });
  });

  document.getElementById('pt1Select').addEventListener('change', calculateTwoPointSlope);
  document.getElementById('pt2Select').addEventListener('change', calculateTwoPointSlope);

  syncInputsFromState();
  updateCERPreview();
  updatePointSelectors();
}

function syncInputsFromState() {
  document.getElementById('graphTitleInput').value = currentDataset.title || '';
  document.getElementById('xAxisLabelInput').value = currentDataset.xAxisLabel || '';
  document.getElementById('xAxisUnitInput').value = currentDataset.xAxisUnit || '';
  document.getElementById('yAxisLabelInput').value = currentDataset.yAxisLabel || '';
  document.getElementById('yAxisUnitInput').value = currentDataset.yAxisUnit || '';
  document.getElementById('xMinInput').value = currentDataset.xMin || '';
  document.getElementById('xMaxInput').value = currentDataset.xMax || '';
  document.getElementById('yMinInput').value = currentDataset.yMin || '';
  document.getElementById('yMaxInput').value = currentDataset.yMax || '';
  document.getElementById('chartTypeSelect').value = currentDataset.chartType || 'scatter';
  document.getElementById('bestFitToggle').checked = currentDataset.showBestFit !== false;
  document.getElementById('showZeroToggle').checked = currentDataset.showZero !== false;
  document.getElementById('showGridToggle').checked = currentDataset.showGrid !== false;

  if (currentDataset.cer) {
    document.getElementById('cerClaim').value = currentDataset.cer.claim || '';
    document.getElementById('cerEvidence').value = currentDataset.cer.evidence || '';
    document.getElementById('cerReasoning').value = currentDataset.cer.reasoning || '';
  }
}

function syncStateFromInputs() {
  currentDataset.title = document.getElementById('graphTitleInput').value;
  currentDataset.xAxisLabel = document.getElementById('xAxisLabelInput').value;
  currentDataset.xAxisUnit = document.getElementById('xAxisUnitInput').value;
  currentDataset.yAxisLabel = document.getElementById('yAxisLabelInput').value;
  currentDataset.yAxisUnit = document.getElementById('yAxisUnitInput').value;
  currentDataset.xMin = document.getElementById('xMinInput').value;
  currentDataset.xMax = document.getElementById('xMaxInput').value;
  currentDataset.yMin = document.getElementById('yMinInput').value;
  currentDataset.yMax = document.getElementById('yMaxInput').value;
  currentDataset.chartType = document.getElementById('chartTypeSelect').value;
  currentDataset.showBestFit = document.getElementById('bestFitToggle').checked;
  currentDataset.showZero = document.getElementById('showZeroToggle').checked;
  currentDataset.showGrid = document.getElementById('showGridToggle').checked;
}

function renderTable() {
  const tbody = document.getElementById('dataTableBody');
  tbody.innerHTML = '';
  const isBar = currentDataset.chartType === 'bar';

  currentDataset.data.forEach((pt, index) => {
    const tr = document.createElement('tr');
    const xInputType = isBar ? 'text' : 'number';
    tr.innerHTML = `
      <td><input type="${xInputType}" step="any" value="${pt.x}" data-index="${index}" data-field="x" class="table-input"></td>
      <td><input type="number" step="any" value="${pt.y}" data-index="${index}" data-field="y" class="table-input"></td>
      <td><button class="btn btn-danger btn-sm" onclick="removeRow(${index})" style="padding:0.2rem 0.5rem; font-size:0.75rem;">✕</button></td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('.table-input').forEach(input => {
    input.addEventListener('change', (e) => {
      const idx = parseInt(e.target.getAttribute('data-index'));
      const field = e.target.getAttribute('data-field');
      let val = e.target.value;
      if (field === 'y' || (field === 'x' && !isBar)) {
        val = parseFloat(val) || 0;
      }
      currentDataset.data[idx][field] = val;
      renderChart();
    });
  });
}

function removeRow(index) {
  if (currentDataset.data.length > 1) {
    currentDataset.data.splice(index, 1);
    renderTable();
    renderChart();
  }
}

function calculateLinearRegression(points) {
  const n = points.length;
  if (n < 2) return null;

  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  points.forEach(p => {
    sumX += p.x;
    sumY += p.y;
    sumXY += p.x * p.y;
    sumXX += p.x * p.x;
  });

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  const minX = Math.min(...points.map(p => p.x));
  const maxX = Math.max(...points.map(p => p.x));

  return {
    slope,
    intercept,
    trendlineData: [
      { x: minX, y: slope * minX + intercept },
      { x: maxX, y: slope * maxX + intercept }
    ]
  };
}

function renderChart() {
  const ctx = document.getElementById('mainChart').getContext('2d');
  
  if (chartInstance) {
    chartInstance.destroy();
  }

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const textColor = isDark ? '#f8fafc' : '#0f172a';
  const mutedColor = isDark ? '#94a3b8' : '#475569';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
  const primaryAccent = isDark ? '#38bdf8' : '#0284c7';
  const primaryFill = isDark ? 'rgba(56, 189, 248, 0.7)' : 'rgba(2, 132, 199, 0.8)';
  const trendlineColor = isDark ? '#a855f7' : '#9333ea';

  const xTitle = currentDataset.xAxisUnit ? `${currentDataset.xAxisLabel} (${currentDataset.xAxisUnit})` : currentDataset.xAxisLabel;
  const yTitle = currentDataset.yAxisUnit ? `${currentDataset.yAxisLabel} (${currentDataset.yAxisUnit})` : currentDataset.yAxisUnit;

  const isBar = currentDataset.chartType === 'bar';
  
  let chartDataConfig = {};
  if (isBar) {
    chartDataConfig = {
      labels: currentDataset.data.map(p => p.x),
      datasets: [{
        label: currentDataset.title,
        data: currentDataset.data.map(p => parseFloat(p.y) || 0),
        backgroundColor: primaryFill,
        borderColor: primaryAccent,
        borderWidth: 1
      }]
    };
  } else {
    const datasets = [{
      label: currentDataset.title,
      data: currentDataset.data.map(p => ({ x: parseFloat(p.x) || 0, y: parseFloat(p.y) || 0 })),
      backgroundColor: primaryFill,
      borderColor: primaryAccent,
      pointRadius: 6,
      pointHoverRadius: 9,
      showLine: currentDataset.chartType === 'line'
    }];

    const reg = calculateLinearRegression(currentDataset.data.map(p => ({ x: parseFloat(p.x) || 0, y: parseFloat(p.y) || 0 })));
    if (currentDataset.showBestFit && reg && !isNaN(reg.slope)) {
      datasets.push({
        label: `Linear Trendline (y = ${reg.slope.toFixed(2)}x + ${reg.intercept.toFixed(2)})`,
        data: reg.trendlineData,
        type: 'line',
        borderColor: trendlineColor,
        borderWidth: 2,
        borderDash: [6, 6],
        pointRadius: 0,
        fill: false
      });

      document.getElementById('slopeVal').innerText = reg.slope.toFixed(3);
      document.getElementById('interceptVal').innerText = reg.intercept.toFixed(3);
      document.getElementById('r2Val').innerText = reg.r2 !== undefined ? reg.r2.toFixed(3) : '--';
    } else {
      document.getElementById('slopeVal').innerText = '--';
      document.getElementById('interceptVal').innerText = '--';
      document.getElementById('r2Val').innerText = '--';
    }
    chartDataConfig = { datasets };
  }

  const xMinVal = currentDataset.xMin !== "" ? parseFloat(currentDataset.xMin) : (currentDataset.showZero ? 0 : undefined);
  const xMaxVal = currentDataset.xMax !== "" ? parseFloat(currentDataset.xMax) : undefined;
  const yMinVal = currentDataset.yMin !== "" ? parseFloat(currentDataset.yMin) : (currentDataset.showZero ? 0 : undefined);
  const yMaxVal = currentDataset.yMax !== "" ? parseFloat(currentDataset.yMax) : undefined;

  chartInstance = new Chart(ctx, {
    type: isBar ? 'bar' : 'scatter',
    data: chartDataConfig,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: currentDataset.title,
          color: textColor,
          font: { size: 15, weight: 'bold' }
        },
        legend: {
          labels: { color: mutedColor }
        }
      },
      scales: {
        x: {
          title: { display: true, text: xTitle, color: primaryAccent },
          grid: { display: currentDataset.showGrid !== false, color: gridColor },
          ticks: { color: mutedColor },
          min: xMinVal,
          max: xMaxVal
        },
        y: {
          title: { display: true, text: yTitle, color: primaryAccent },
          grid: { display: currentDataset.showGrid !== false, color: gridColor },
          ticks: { color: mutedColor },
          min: yMinVal,
          max: yMaxVal
        }
      }
    }
  });

  document.getElementById('dataPointCount').innerText = currentDataset.data.length;
  document.getElementById('thXLabel').innerText = currentDataset.xAxisUnit ? `X: ${currentDataset.xAxisLabel} (${currentDataset.xAxisUnit})` : `X: ${currentDataset.xAxisLabel}`;
  document.getElementById('thYLabel').innerText = currentDataset.yAxisUnit ? `Y: ${currentDataset.yAxisLabel} (${currentDataset.yAxisUnit})` : `Y: ${currentDataset.yAxisLabel}`;
  document.getElementById('printReportTitle').innerText = `${currentDataset.title} - CAST Science Lab Report`;
}

function calculateLinearRegression(points) {
  const n = points.length;
  if (n < 2) return null;

  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0, sumYY = 0;
  points.forEach(p => {
    sumX += p.x;
    sumY += p.y;
    sumXY += p.x * p.y;
    sumXX += p.x * p.x;
    sumYY += p.y * p.y;
  });

  const denom = (n * sumXX - sumX * sumX);
  if (denom === 0) return null;

  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;

  const numR = (n * sumXY - sumX * sumY);
  const denR = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
  const r2 = denR === 0 ? 0 : Math.pow(numR / denR, 2);

  const minX = Math.min(...points.map(p => p.x));
  const maxX = Math.max(...points.map(p => p.x));

  return {
    slope,
    intercept,
    r2,
    trendlineData: [
      { x: minX, y: slope * minX + intercept },
      { x: maxX, y: slope * maxX + intercept }
    ]
  };
}

function updatePointSelectors() {
  const p1 = document.getElementById('pt1Select');
  const p2 = document.getElementById('pt2Select');
  if (!p1 || !p2) return;
  
  p1.innerHTML = ''; p2.innerHTML = '';

  currentDataset.data.forEach((pt, idx) => {
    p1.innerHTML += `<option value="${idx}">Pt ${idx+1} (${pt.x}, ${pt.y})</option>`;
    p2.innerHTML += `<option value="${idx}">Pt ${idx+1} (${pt.x}, ${pt.y})</option>`;
  });

  if (currentDataset.data.length >= 2) {
    p2.selectedIndex = currentDataset.data.length - 1;
  }
  calculateTwoPointSlope();
}

function calculateTwoPointSlope() {
  const idx1 = document.getElementById('pt1Select').value;
  const idx2 = document.getElementById('pt2Select').value;
  const resultBox = document.getElementById('twoPointResult');
  if (!resultBox) return;

  if (idx1 === "" || idx2 === "" || idx1 === idx2 || !currentDataset.data[idx1] || !currentDataset.data[idx2]) {
    resultBox.innerText = "Select two distinct points above.";
    return;
  }

  const pt1 = currentDataset.data[idx1];
  const pt2 = currentDataset.data[idx2];
  const dx = parseFloat(pt2.x) - parseFloat(pt1.x);
  const dy = parseFloat(pt2.y) - parseFloat(pt1.y);

  if (isNaN(dx) || isNaN(dy)) {
    resultBox.innerText = "Numeric coordinates required for slope.";
    return;
  }

  if (dx === 0) {
    resultBox.innerText = "Undefined slope (Vertical line ΔX = 0).";
    return;
  }

  const slope = dy / dx;
  const xUnit = currentDataset.xAxisUnit || 'X units';
  const yUnit = currentDataset.yAxisUnit || 'Y units';

  resultBox.innerHTML = `
    Average Rate ($\Delta Y / \Delta X$): <strong>${slope.toFixed(3)}</strong> ${yUnit} / ${xUnit}<br>
    <span style="font-size:0.75rem; color:var(--text-muted);">ΔY = ${dy.toFixed(2)}, ΔX = ${dx.toFixed(2)}</span>
  `;
}

function updateCERPreview() {
  const claim = document.getElementById('cerClaim').value || currentDataset.cer?.claim;
  const evidence = document.getElementById('cerEvidence').value || currentDataset.cer?.evidence;
  const reasoning = document.getElementById('cerReasoning').value || currentDataset.cer?.reasoning;

  document.getElementById('previewClaim').innerText = claim || "No claim entered yet.";
  document.getElementById('previewEvidence').innerText = evidence || "No evidence cited yet.";
  document.getElementById('previewReasoning').innerText = reasoning || "No scientific reasoning provided yet.";
}

function insertAutoEvidence() {
  if (!currentDataset.data || currentDataset.data.length < 2) return;
  const sorted = [...currentDataset.data].sort((a, b) => (parseFloat(a.x)||0) - (parseFloat(b.x)||0));
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const xName = currentDataset.xAxisLabel || "independent variable";
  const xUnit = currentDataset.xAxisUnit || "";
  const yName = currentDataset.yAxisLabel || "dependent variable";
  const yUnit = currentDataset.yAxisUnit || "";

  const autoText = `Based on the graph, as the ${xName} increased from ${first.x} ${xUnit} to ${last.x} ${xUnit}, the ${yName} changed from ${first.y} ${yUnit} to ${last.y} ${yUnit}.`;
  
  const field = document.getElementById('cerEvidence');
  field.value = autoText + (field.value ? " " + field.value : "");
  if (!currentDataset.cer) currentDataset.cer = {};
  currentDataset.cer.evidence = field.value;
  updateCERPreview();
}

function renderQuestions() {
  const container = document.getElementById('questionsContainer');
  container.innerHTML = '';

  if (!currentDataset.questions || currentDataset.questions.length === 0) {
    container.innerHTML = '<p style="color:var(--text-muted); font-size:0.9rem;">No practice questions loaded for this dataset. Use a CAST preset above or create your own custom analysis notes below!</p>';
    return;
  }

  currentDataset.questions.forEach((q, qIndex) => {
    const div = document.createElement('div');
    div.className = 'question-block';
    
    let optionsHtml = q.options.map((opt, oIdx) => `
      <button class="option-btn" onclick="checkAnswer('${q.id}', ${oIdx}, ${q.correctIndex}, this)">
        ${String.fromCharCode(65 + oIdx)}. ${opt}
      </button>
    `).join('');

    div.innerHTML = `
      <div class="question-text">Q${qIndex + 1}: ${q.text}</div>
      <div class="options-grid">${optionsHtml}</div>
      <div id="exp-${q.id}" class="explanation-box" style="display:none; font-size:0.85rem; padding:0.5rem; background:rgba(56,189,248,0.1); border-left:3px solid var(--accent-blue); margin-top:0.5rem;">
        ${q.explanation}
      </div>
    `;
    container.appendChild(div);
  });
}

function checkAnswer(qId, selectedIdx, correctIdx, btnEl) {
  const parentGrid = btnEl.parentElement;
  const buttons = parentGrid.querySelectorAll('.option-btn');
  buttons.forEach(b => b.classList.remove('correct', 'incorrect'));

  if (selectedIdx === correctIdx) {
    btnEl.classList.add('correct');
  } else {
    btnEl.classList.add('incorrect');
    buttons[correctIdx].classList.add('correct');
  }

  const expBox = document.getElementById(`exp-${qId}`);
  if (expBox) expBox.style.display = 'block';
}

function exportChartImage() {
  if (!chartInstance) return;
  const link = document.createElement('a');
  link.download = `${currentDataset.title.replace(/\s+/g, '_')}_graph.png`;
  link.href = chartInstance.toBase64Image();
  link.click();
}
