/**
 * CAST Science Data Studio - Core Engine
 */

let chartInstance = null;
let currentDataset = {
  title: "Photosynthesis Rate vs. Light Intensity",
  xAxisLabel: "Light Intensity",
  xAxisUnit: "mW/cm²",
  yAxisLabel: "Oxygen Production Rate",
  yAxisUnit: "mL/min",
  chartType: "scatter",
  showBestFit: true,
  showZero: true,
  showGrid: true,
  xMin: "",
  xMax: "",
  yMin: "",
  yMax: "",
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
    chartType: "scatter",
    showBestFit: true,
    showZero: true,
    showGrid: true,
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
      claim: "Increasing light intensity increases photosynthesis rate until a light saturation point is reached.",
      evidence: "Between 10 and 50 mW/cm², oxygen production increased from 2.1 to 12.0 mL/min. Above 50 mW/cm², the rate plateaued at ~12.4 mL/min.",
      reasoning: "Light provides energy for the light-dependent reactions of photosynthesis. Once light is abundant, another factor (such as CO₂ concentration or enzyme availability) becomes limiting."
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
  },
  tectonic: {
    title: "Plate Age vs. Distance from Mid-Ocean Ridge",
    xAxisLabel: "Distance from Ridge",
    xAxisUnit: "km",
    yAxisLabel: "Seafloor Age",
    yAxisUnit: "Million Years",
    chartType: "scatter",
    showBestFit: true,
    showZero: true,
    showGrid: true,
    data: [
      { x: 0, y: 0 },
      { x: 100, y: 5 },
      { x: 200, y: 10 },
      { x: 300, y: 15 },
      { x: 400, y: 20 },
      { x: 500, y: 25 }
    ],
    cer: {
      claim: "Seafloor age increases linearly with distance from the mid-ocean ridge.",
      evidence: "At the ridge (0 km), crust age is 0 Million Years. At 500 km, crust age is 25 Million Years, giving a spreading rate of 20 km/Ma.",
      reasoning: "New oceanic crust forms at divergent mid-ocean ridge boundaries through seafloor spreading and is continuously pushed outward as new magma cools."
    },
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
    chartType: "scatter",
    showBestFit: true,
    showZero: true,
    showGrid: true,
    data: [
      { x: 0.2, y: 0.90 },
      { x: 0.4, y: 1.27 },
      { x: 0.6, y: 1.55 },
      { x: 0.8, y: 1.79 },
      { x: 1.0, y: 2.01 }
    ],
    cer: {
      claim: "Increasing pendulum length increases oscillation period according to a square root relationship.",
      evidence: "As length increased from 0.2 m to 0.8 m (4x increase), the period increased from 0.90 s to 1.79 s (~2x increase).",
      reasoning: "Period depends on string length and gravitational acceleration (T = 2π√(L/g)). Longer pendulums traverse a larger arc, increasing swing duration."
    },
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
  thermal: {
    title: "Water Temperature during Continuous Heating",
    xAxisLabel: "Heating Time",
    xAxisUnit: "minutes",
    yAxisLabel: "Temperature",
    yAxisUnit: "°C",
    chartType: "line",
    showBestFit: false,
    showZero: false,
    showGrid: true,
    data: [
      { x: 0, y: -10 },
      { x: 2, y: 0 },
      { x: 4, y: 0 },
      { x: 6, y: 35 },
      { x: 8, y: 70 },
      { x: 10, y: 100 },
      { x: 12, y: 100 }
    ],
    cer: {
      claim: "Temperature remains constant during phase changes despite continuous heat input.",
      evidence: "From 2 to 4 minutes (melting at 0°C) and from 10 to 12 minutes (boiling at 100°C), temperature stayed flat.",
      reasoning: "During phase changes, absorbed thermal energy is converted into potential energy to break intermolecular hydrogen bonds rather than increasing kinetic energy (temperature)."
    },
    questions: [
      {
        id: "q1",
        text: "Why does the temperature line remain horizontal between minutes 2-4 and 10-12?",
        options: [
          "The heat source was turned off",
          "Thermal energy is breaking intermolecular bonds during phase changes",
          "Water reflects heat at 0°C and 100°C",
          "The thermometer reached maximum scale"
        ],
        correctIndex: 1,
        explanation: "During phase transitions, added energy disrupts intermolecular forces rather than increasing particle kinetic energy (temperature)."
      }
    ]
  }
};

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initUI();
  renderTable();
  renderChart();
  renderQuestions();
  updateCERPreview();
});

function switchTab(tabName) {
  const tabs = ['data', 'graph', 'math', 'cer'];
  tabs.forEach(t => {
    const el = document.getElementById(`tab-${t}`);
    const btn = document.getElementById(`tabBtn-${t}`);
    if (t === tabName) {
      if (el) el.style.display = 'flex';
      if (btn) btn.classList.add('active');
    } else {
      if (el) el.style.display = 'none';
      if (btn) btn.classList.remove('active');
    }
  });
}

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
  // Preset selector
  document.getElementById('presetSelect').addEventListener('change', (e) => {
    const key = e.target.value;
    if (key === 'custom') {
      currentDataset.questions = [];
      currentDataset.cer = { claim: "", evidence: "", reasoning: "" };
    } else if (presets[key]) {
      currentDataset = JSON.parse(JSON.stringify(presets[key]));
    }
    updateFormFields();
    renderTable();
    renderChart();
    renderQuestions();
    updateCERPreview();
  });

  // Inputs binding
  document.getElementById('graphTitleInput').addEventListener('input', (e) => {
    currentDataset.title = e.target.value;
    renderChart();
  });

  document.getElementById('xAxisLabelInput').addEventListener('input', (e) => {
    currentDataset.xAxisLabel = e.target.value;
    document.getElementById('thX').innerText = `${e.target.value} (${currentDataset.xAxisUnit})`;
    renderChart();
  });

  document.getElementById('xAxisUnitInput').addEventListener('input', (e) => {
    currentDataset.xAxisUnit = e.target.value;
    document.getElementById('thX').innerText = `${currentDataset.xAxisLabel} (${e.target.value})`;
    renderChart();
  });

  document.getElementById('yAxisLabelInput').addEventListener('input', (e) => {
    currentDataset.yAxisLabel = e.target.value;
    document.getElementById('thY').innerText = `${e.target.value} (${currentDataset.yAxisUnit})`;
    renderChart();
  });

  document.getElementById('yAxisUnitInput').addEventListener('input', (e) => {
    currentDataset.yAxisUnit = e.target.value;
    document.getElementById('thY').innerText = `${currentDataset.yAxisLabel} (${e.target.value})`;
    renderChart();
  });

  document.getElementById('chartTypeSelect').addEventListener('change', (e) => {
    currentDataset.chartType = e.target.value;
    renderTable();
    renderChart();
  });

  document.getElementById('bestFitToggle').addEventListener('change', (e) => {
    currentDataset.showBestFit = e.target.checked;
    renderChart();
  });

  document.getElementById('showZeroToggle').addEventListener('change', (e) => {
    currentDataset.showZero = e.target.checked;
    renderChart();
  });

  document.getElementById('showGridToggle').addEventListener('change', (e) => {
    currentDataset.showGrid = e.target.checked;
    renderChart();
  });

  ['xMinInput', 'xMaxInput', 'yMinInput', 'yMaxInput'].forEach(id => {
    document.getElementById(id).addEventListener('input', (e) => {
      currentDataset[id.replace('Input', '')] = e.target.value;
      renderChart();
    });
  });

  document.getElementById('addRowBtn').addEventListener('click', () => {
    const lastX = currentDataset.data.length > 0 ? currentDataset.data[currentDataset.data.length - 1].x : 0;
    const lastY = currentDataset.data.length > 0 ? currentDataset.data[currentDataset.data.length - 1].y : 0;
    const nextX = currentDataset.chartType === 'bar' ? `Category ${currentDataset.data.length + 1}` : (parseFloat(lastX) || 0) + 10;
    currentDataset.data.push({ x: nextX, y: (parseFloat(lastY) || 0) + 5 });
    renderTable();
    renderChart();
  });

  document.getElementById('sortDataBtn').addEventListener('click', () => {
    if (currentDataset.chartType !== 'bar') {
      currentDataset.data.sort((a, b) => (parseFloat(a.x) || 0) - (parseFloat(b.x) || 0));
      renderTable();
      renderChart();
    }
  });

  document.getElementById('clearDataBtn').addEventListener('click', () => {
    currentDataset.data = [];
    renderTable();
    renderChart();
  });

  // CER Inputs
  ['cerClaim', 'cerEvidence', 'cerReasoning'].forEach(id => {
    document.getElementById(id).addEventListener('input', (e) => {
      const field = id.replace('cer', '').toLowerCase();
      currentDataset.cer[field] = e.target.value;
      updateCERPreview();
    });
  });

  document.getElementById('autoEvidenceBtn').addEventListener('click', generateAutoEvidence);

  // Rate Tool Selectors
  document.getElementById('pt1Select').addEventListener('change', calculateTwoPointSlope);
  document.getElementById('pt2Select').addEventListener('change', calculateTwoPointSlope);

  // Export / Import / Print
  document.getElementById('exportPngBtn').addEventListener('click', exportChartImage);
  document.getElementById('saveJsonBtn').addEventListener('click', exportJSON);
  document.getElementById('loadJsonInput').addEventListener('change', importJSON);
  document.getElementById('printBtn').addEventListener('click', () => window.print());
}

function updateFormFields() {
  document.getElementById('graphTitleInput').value = currentDataset.title || '';
  document.getElementById('xAxisLabelInput').value = currentDataset.xAxisLabel || '';
  document.getElementById('xAxisUnitInput').value = currentDataset.xAxisUnit || '';
  document.getElementById('yAxisLabelInput').value = currentDataset.yAxisLabel || '';
  document.getElementById('yAxisUnitInput').value = currentDataset.yAxisUnit || '';
  document.getElementById('chartTypeSelect').value = currentDataset.chartType || 'scatter';
  document.getElementById('bestFitToggle').checked = !!currentDataset.showBestFit;
  document.getElementById('showZeroToggle').checked = currentDataset.showZero !== false;
  document.getElementById('showGridToggle').checked = currentDataset.showGrid !== false;
  document.getElementById('xMinInput').value = currentDataset.xMin || '';
  document.getElementById('xMaxInput').value = currentDataset.xMax || '';
  document.getElementById('yMinInput').value = currentDataset.yMin || '';
  document.getElementById('yMaxInput').value = currentDataset.yMax || '';

  if (currentDataset.cer) {
    document.getElementById('cerClaim').value = currentDataset.cer.claim || '';
    document.getElementById('cerEvidence').value = currentDataset.cer.evidence || '';
    document.getElementById('cerReasoning').value = currentDataset.cer.reasoning || '';
  }

  document.getElementById('thX').innerText = `${currentDataset.xAxisLabel} (${currentDataset.xAxisUnit})`;
  document.getElementById('thY').innerText = `${currentDataset.yAxisLabel} (${currentDataset.yAxisUnit})`;
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
      <td><button class="btn btn-danger btn-sm" onclick="removeRow(${index})" style="padding:0.15rem 0.4rem; font-size:0.7rem;">✕</button></td>
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

  updatePointSelectors();
}

function removeRow(index) {
  currentDataset.data.splice(index, 1);
  renderTable();
  renderChart();
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
  const yTitle = currentDataset.yAxisUnit ? `${currentDataset.yAxisLabel} (${currentDataset.yAxisUnit})` : currentDataset.yAxisLabel;

  document.getElementById('printReportTitle').innerText = `${currentDataset.title} - CAST Lab Report`;

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
    document.getElementById('equationBadge').innerText = 'Categorical Bar Chart';
    document.getElementById('relationshipBadge').innerText = 'Comparison Plot';
    document.getElementById('slopeVal').innerText = '--';
    document.getElementById('interceptVal').innerText = '--';
    document.getElementById('r2Val').innerText = '--';
  } else {
    const validPoints = currentDataset.data.map(p => ({ x: parseFloat(p.x) || 0, y: parseFloat(p.y) || 0 }));
    const datasets = [{
      label: currentDataset.title,
      data: validPoints,
      backgroundColor: primaryFill,
      borderColor: primaryAccent,
      pointRadius: 6,
      pointHoverRadius: 9,
      showLine: currentDataset.chartType === 'line'
    }];

    const reg = calculateLinearRegression(validPoints);
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

      document.getElementById('equationBadge').innerText = `y = ${reg.slope.toFixed(2)}x + ${reg.intercept.toFixed(2)}`;
      document.getElementById('slopeVal').innerText = reg.slope.toFixed(3);
      document.getElementById('interceptVal').innerText = reg.intercept.toFixed(3);
      document.getElementById('r2Val').innerText = reg.r2.toFixed(3);

      const relText = reg.slope > 0 ? "Direct Positive Trend" : (reg.slope < 0 ? "Inverse / Negative Trend" : "No Linear Trend");
      document.getElementById('relationshipBadge').innerText = relText;
    } else {
      document.getElementById('equationBadge').innerText = "y = mx + b";
      document.getElementById('relationshipBadge').innerText = "Scatter Plot";
      document.getElementById('slopeVal').innerText = '--';
      document.getElementById('interceptVal').innerText = '--';
      document.getElementById('r2Val').innerText = '--';
    }
    chartDataConfig = { datasets };
  }

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
          type: isBar ? 'category' : 'linear',
          title: { display: true, text: xTitle, color: primaryAccent },
          grid: { display: currentDataset.showGrid !== false, color: gridColor },
          ticks: { color: mutedColor },
          min: (!isBar && currentDataset.xMin !== "") ? parseFloat(currentDataset.xMin) : (!isBar && currentDataset.showZero ? 0 : undefined),
          max: (!isBar && currentDataset.xMax !== "") ? parseFloat(currentDataset.xMax) : undefined
        },
        y: {
          title: { display: true, text: yTitle, color: primaryAccent },
          grid: { display: currentDataset.showGrid !== false, color: gridColor },
          ticks: { color: mutedColor },
          min: (currentDataset.yMin !== "") ? parseFloat(currentDataset.yMin) : (currentDataset.showZero ? 0 : undefined),
          max: (currentDataset.yMax !== "") ? parseFloat(currentDataset.yMax) : undefined
        }
      }
    }
  });

  document.getElementById('dataPointCount').innerText = currentDataset.data.length;
}

function updatePointSelectors() {
  const p1 = document.getElementById('pt1Select');
  const p2 = document.getElementById('pt2Select');
  if (!p1 || !p2) return;

  p1.innerHTML = ''; p2.innerHTML = '';

  currentDataset.data.forEach((pt, idx) => {
    p1.innerHTML += `<option value="${idx}">Point ${idx+1} (${pt.x}, ${pt.y})</option>`;
    p2.innerHTML += `<option value="${idx}">Point ${idx+1} (${pt.x}, ${pt.y})</option>`;
  });

  if (currentDataset.data.length >= 2) {
    p2.selectedIndex = currentDataset.data.length - 1;
  }
  calculateTwoPointSlope();
}

function calculateTwoPointSlope() {
  const p1Val = document.getElementById('pt1Select').value;
  const p2Val = document.getElementById('pt2Select').value;
  const res = document.getElementById('twoPointResult');
  if (!res) return;

  if (p1Val === "" || p2Val === "" || p1Val === p2Val || !currentDataset.data[p1Val] || !currentDataset.data[p2Val]) {
    res.innerText = "Select two distinct points above.";
    return;
  }

  const pt1 = currentDataset.data[p1Val];
  const pt2 = currentDataset.data[p2Val];

  const dx = (parseFloat(pt2.x) || 0) - (parseFloat(pt1.x) || 0);
  const dy = (parseFloat(pt2.y) || 0) - (parseFloat(pt1.y) || 0);

  if (dx === 0) {
    res.innerText = "Undefined rate (ΔX = 0).";
    return;
  }

  const slope = dy / dx;
  const xUnit = currentDataset.xAxisUnit || 'X units';
  const yUnit = currentDataset.yAxisUnit || 'Y units';

  res.innerHTML = `
    Rate of Change: <strong>${slope.toFixed(3)}</strong> ${yUnit} per ${xUnit}<br>
    <span style="font-size:0.75rem; color:var(--text-muted);">ΔY = ${dy.toFixed(2)}, ΔX = ${dx.toFixed(2)}</span>
  `;
}

function updateCERPreview() {
  const claimText = document.getElementById('cerClaim').value.trim();
  const evidenceText = document.getElementById('cerEvidence').value.trim();
  const reasoningText = document.getElementById('cerReasoning').value.trim();

  document.getElementById('previewClaim').innerText = claimText || "No claim entered yet.";
  document.getElementById('previewEvidence').innerText = evidenceText || "No evidence cited yet.";
  document.getElementById('previewReasoning').innerText = reasoningText || "No scientific reasoning provided yet.";
}

function generateAutoEvidence() {
  if (currentDataset.data.length < 2) return;
  const sorted = [...currentDataset.data].sort((a, b) => (parseFloat(a.x) || 0) - (parseFloat(b.x) || 0));
  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  const xName = currentDataset.xAxisLabel;
  const xUnit = currentDataset.xAxisUnit;
  const yName = currentDataset.yAxisLabel;
  const yUnit = currentDataset.yAxisUnit;

  const autoSentence = `Based on the graph, as ${xName} increased from ${first.x} ${xUnit} to ${last.x} ${xUnit}, ${yName} changed from ${first.y} ${yUnit} to ${last.y} ${yUnit}.`;
  
  const field = document.getElementById('cerEvidence');
  field.value = autoSentence + " " + field.value;
  currentDataset.cer.evidence = field.value;
  updateCERPreview();
}

function renderQuestions() {
  const container = document.getElementById('questionsContainer');
  container.innerHTML = '';

  if (!currentDataset.questions || currentDataset.questions.length === 0) {
    container.innerHTML = '<p style="color:var(--text-muted); font-size:0.85rem;">No preset practice questions for this dataset. Use the CER Studio tab to document your own findings!</p>';
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
      <div id="exp-${q.id}" class="explanation-box" style="display:none; font-size:0.85rem; padding:0.5rem; background:rgba(2,132,199,0.1); border-left:3px solid var(--accent-blue); margin-top:0.5rem;">
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

function exportJSON() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentDataset, null, 2));
  const link = document.createElement('a');
  link.download = `CAST_Lab_${currentDataset.title.replace(/\s+/g, '_')}.json`;
  link.href = dataStr;
  link.click();
}

function importJSON(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(evt) {
    try {
      const imported = JSON.parse(evt.target.result);
      if (imported.title) currentDataset = imported;
      updateFormFields();
      renderTable();
      renderChart();
      renderQuestions();
      updateCERPreview();
    } catch (err) {
      console.error("Invalid JSON file:", err);
    }
  };
  reader.readAsText(file);
}
