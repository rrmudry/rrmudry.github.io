/**
 * CAST Science Data Studio - Complete Bug-Free Application Engine
 */

let chartInstance = null;

let currentDataset = {
  title: "Photosynthesis Rate vs. Light Intensity",
  xAxisLabel: "Light Intensity",
  xAxisUnit: "mW/cm²",
  chartType: "scatter",
  showBestFit: true,
  showZero: true,
  showGrid: true,
  xMin: "",
  xMax: "",
  yMin: "",
  yMax: "",
  xValues: [10, 20, 30, 40, 50, 60, 70],
  series: [
    {
      id: "y1",
      label: "Oxygen Production Rate",
      unit: "mL/min",
      color: "#0284c7",
      pointStyle: "circle",
      pointRadius: 6,
      values: [2.1, 4.5, 7.2, 9.8, 12.0, 12.3, 12.4]
    }
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
    chartType: "scatter",
    showBestFit: true,
    showZero: true,
    showGrid: true,
    xValues: [10, 20, 30, 40, 50, 60, 70],
    series: [
      {
        id: "y1",
        label: "Oxygen Production Rate",
        unit: "mL/min",
        color: "#0284c7",
        pointStyle: "circle",
        pointRadius: 6,
        values: [2.1, 4.5, 7.2, 9.8, 12.0, 12.3, 12.4]
      }
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
      }
    ]
  },
  tectonic: {
    title: "Seafloor Age Comparison: Atlantic vs. Pacific Ocean",
    xAxisLabel: "Distance from Ridge",
    xAxisUnit: "km",
    chartType: "scatter",
    showBestFit: true,
    showZero: true,
    showGrid: true,
    xValues: [0, 100, 200, 300, 400, 500],
    series: [
      {
        id: "y1",
        label: "Mid-Atlantic Ridge Crust Age",
        unit: "Ma",
        color: "#0284c7",
        pointStyle: "circle",
        pointRadius: 6,
        values: [0, 5, 10, 15, 20, 25]
      },
      {
        id: "y2",
        label: "East Pacific Rise Crust Age",
        unit: "Ma",
        color: "#ea580c",
        pointStyle: "triangle",
        pointRadius: 7,
        values: [0, 1.5, 3.0, 4.5, 6.0, 7.5]
      }
    ],
    cer: {
      claim: "The East Pacific Rise has a significantly faster seafloor spreading rate than the Mid-Atlantic Ridge.",
      evidence: "At 500 km from the ridge, Atlantic crust is 25 Million Years old (20 km/Ma), while Pacific crust is only 7.5 Million Years old (66.7 km/Ma).",
      reasoning: "Divergent boundaries spread at different speeds based on mantle convection rates and subduction slab pull forces."
    },
    questions: [
      {
        id: "q1",
        text: "Which oceanic ridge system exhibits faster seafloor spreading?",
        options: [
          "Mid-Atlantic Ridge",
          "East Pacific Rise",
          "Both spread at identical rates",
          "Neither system produces new crust"
        ],
        correctIndex: 1,
        explanation: "The East Pacific Rise creates 500 km of new crust in only 7.5 Ma, compared to 25 Ma for the Atlantic."
      }
    ]
  },
  pendulum: {
    title: "Pendulum Length vs. Period",
    xAxisLabel: "Pendulum Length",
    xAxisUnit: "m",
    chartType: "scatter",
    showBestFit: true,
    showZero: true,
    showGrid: true,
    xValues: [0.2, 0.4, 0.6, 0.8, 1.0],
    series: [
      {
        id: "y1",
        label: "Period (Earth g=9.8 m/s²)",
        unit: "s",
        color: "#0284c7",
        pointStyle: "circle",
        pointRadius: 6,
        values: [0.90, 1.27, 1.55, 1.79, 2.01]
      },
      {
        id: "y2",
        label: "Period (Moon g=1.6 m/s²)",
        unit: "s",
        color: "#9333ea",
        pointStyle: "rect",
        pointRadius: 7,
        values: [2.22, 3.14, 3.85, 4.44, 4.97]
      }
    ],
    cer: {
      claim: "Lower gravitational acceleration increases the oscillation period of a pendulum.",
      evidence: "For a 1.0 m pendulum, the period on Earth is 2.01 seconds, compared to 4.97 seconds on the Moon.",
      reasoning: "Because T = 2π√(L/g), a smaller gravitational acceleration g in the denominator yields a larger period T."
    },
    questions: []
  },
  thermal: {
    title: "Water Temperature during Continuous Heating",
    xAxisLabel: "Heating Time",
    xAxisUnit: "minutes",
    chartType: "line",
    showBestFit: false,
    showZero: false,
    showGrid: true,
    xValues: [0, 2, 4, 6, 8, 10, 12],
    series: [
      {
        id: "y1",
        label: "Water Temperature",
        unit: "°C",
        color: "#059669",
        pointStyle: "circle",
        pointRadius: 6,
        values: [-10, 0, 0, 35, 70, 100, 100]
      }
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
  updateFormFields();
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
  if (!toggleBtn) return;

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

  document.getElementById('graphTitleInput').addEventListener('input', (e) => {
    currentDataset.title = e.target.value;
    renderChart();
  });

  document.getElementById('xAxisLabelInput').addEventListener('input', (e) => {
    currentDataset.xAxisLabel = e.target.value;
    renderTable();
    renderChart();
  });

  document.getElementById('xAxisUnitInput').addEventListener('input', (e) => {
    currentDataset.xAxisUnit = e.target.value;
    renderTable();
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

  // Series Plot Styling Handlers
  document.getElementById('seriesStyleSelect').addEventListener('change', updateSeriesStyleForm);

  document.getElementById('seriesColorInput').addEventListener('change', (e) => {
    const sId = document.getElementById('seriesStyleSelect').value;
    const s = currentDataset.series.find(s => s.id === sId);
    if (s) { s.color = e.target.value; renderChart(); }
  });

  document.getElementById('pointShapeSelect').addEventListener('change', (e) => {
    const sId = document.getElementById('seriesStyleSelect').value;
    const s = currentDataset.series.find(s => s.id === sId);
    if (s) { s.pointStyle = e.target.value; renderChart(); }
  });

  document.getElementById('pointSizeInput').addEventListener('input', (e) => {
    const sId = document.getElementById('seriesStyleSelect').value;
    const s = currentDataset.series.find(s => s.id === sId);
    if (s) { s.pointRadius = parseInt(e.target.value) || 6; renderChart(); }
  });

  // Series Addition
  const addSeriesHandler = () => {
    const newIdx = currentDataset.series.length + 1;
    const colors = ["#0284c7", "#ea580c", "#9333ea", "#059669", "#dc2626"];
    const shapes = ["circle", "triangle", "rect", "star", "crossRot"];
    currentDataset.series.push({
      id: `y${Date.now()}`,
      label: `Series ${newIdx} Variable`,
      unit: "units",
      color: colors[(newIdx - 1) % colors.length],
      pointStyle: shapes[(newIdx - 1) % shapes.length],
      pointRadius: 6,
      values: currentDataset.xValues.map(() => 0)
    });
    updateSeriesStyleSelector();
    renderTable();
    renderChart();
  };

  document.getElementById('addSeriesBtn').addEventListener('click', addSeriesHandler);
  document.getElementById('modalAddSeriesBtn').addEventListener('click', addSeriesHandler);

  // Row Addition
  const addRowHandler = () => {
    const lastX = currentDataset.xValues.length > 0 ? currentDataset.xValues[currentDataset.xValues.length - 1] : 0;
    const nextX = currentDataset.chartType === 'bar' ? `Category ${currentDataset.xValues.length + 1}` : (parseFloat(lastX) || 0) + 10;
    currentDataset.xValues.push(nextX);
    currentDataset.series.forEach(s => s.values.push(0));
    renderTable();
    renderChart();
  };

  document.getElementById('addRowBtn').addEventListener('click', addRowHandler);
  document.getElementById('modalAddRowBtn').addEventListener('click', addRowHandler);

  // Sort
  const sortHandler = () => {
    if (currentDataset.chartType !== 'bar') {
      const combined = currentDataset.xValues.map((x, i) => {
        const item = { x: parseFloat(x) || 0 };
        currentDataset.series.forEach(s => item[s.id] = s.values[i]);
        return item;
      });
      combined.sort((a, b) => a.x - b.x);
      currentDataset.xValues = combined.map(c => c.x);
      currentDataset.series.forEach(s => {
        s.values = combined.map(c => c[s.id]);
      });
      renderTable();
      renderChart();
    }
  };

  document.getElementById('sortDataBtn').addEventListener('click', sortHandler);
  document.getElementById('modalSortBtn').addEventListener('click', sortHandler);

  // Clear
  const clearHandler = () => {
    currentDataset.xValues = [];
    currentDataset.series.forEach(s => s.values = []);
    renderTable();
    renderChart();
  };

  document.getElementById('clearDataBtn').addEventListener('click', clearHandler);
  document.getElementById('modalClearBtn').addEventListener('click', clearHandler);

  // Table Modal Open & Close
  document.getElementById('openTableModalBtn').addEventListener('click', () => {
    document.getElementById('tableModal').style.display = 'flex';
  });

  document.getElementById('closeTableModalBtn').addEventListener('click', () => {
    document.getElementById('tableModal').style.display = 'none';
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
  document.getElementById('exportPngBtn').addEventListener('click', exportChartImage);
  document.getElementById('saveJsonBtn').addEventListener('click', exportJSON);
  document.getElementById('loadJsonInput').addEventListener('change', importJSON);
  document.getElementById('printBtn').addEventListener('click', () => window.print());
}

function updateFormFields() {
  document.getElementById('graphTitleInput').value = currentDataset.title || '';
  document.getElementById('xAxisLabelInput').value = currentDataset.xAxisLabel || '';
  document.getElementById('xAxisUnitInput').value = currentDataset.xAxisUnit || '';
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

  updateSeriesStyleSelector();
}

function updateSeriesStyleSelector() {
  const sel = document.getElementById('seriesStyleSelect');
  if (!sel) return;
  sel.innerHTML = '';
  currentDataset.series.forEach(s => {
    sel.innerHTML += `<option value="${s.id}">${s.label} (${s.unit})</option>`;
  });
  updateSeriesStyleForm();
}

function updateSeriesStyleForm() {
  const sel = document.getElementById('seriesStyleSelect');
  if (!sel || !sel.value) return;
  const sId = sel.value;
  const s = currentDataset.series.find(s => s.id === sId);
  if (!s) return;

  document.getElementById('seriesColorInput').value = s.color || "#0284c7";
  document.getElementById('pointShapeSelect').value = s.pointStyle || "circle";
  document.getElementById('pointSizeInput').value = s.pointRadius || 6;
}

function renderTable() {
  renderTableContainer('dataTableHead', 'dataTableBody');
  renderTableContainer('modalDataTableHead', 'modalDataTableBody');
}

function renderTableContainer(headId, bodyId) {
  const thead = document.getElementById(headId);
  const tbody = document.getElementById(bodyId);
  if (!thead || !tbody) return;

  const isBar = currentDataset.chartType === 'bar';
  const xTitle = currentDataset.xAxisUnit ? `${currentDataset.xAxisLabel} (${currentDataset.xAxisUnit})` : currentDataset.xAxisLabel;

  let headHtml = `<tr><th>${xTitle}</th>`;
  currentDataset.series.forEach((s, sIdx) => {
    headHtml += `
      <th>
        <div style="display:flex; flex-direction:column; gap:0.2rem;">
          <input type="text" value="${s.label}" onchange="updateSeriesMeta(${sIdx}, 'label', this.value)" style="font-weight:bold; font-size:0.75rem; padding:0.15rem;">
          <div style="display:flex; gap:0.2rem; align-items:center;">
            <span style="font-size:0.7rem; color:var(--text-muted);">Unit:</span>
            <input type="text" value="${s.unit}" onchange="updateSeriesMeta(${sIdx}, 'unit', this.value)" style="font-size:0.7rem; padding:0.15rem;">
            ${currentDataset.series.length > 1 ? `<button onclick="removeSeries(${sIdx})" class="btn btn-danger btn-sm" style="padding:0.1rem 0.3rem; font-size:0.65rem;" title="Delete Series">✕</button>` : ''}
          </div>
        </div>
      </th>
    `;
  });
  headHtml += `<th style="width:36px;">Del</th></tr>`;
  thead.innerHTML = headHtml;

  tbody.innerHTML = '';
  currentDataset.xValues.forEach((xVal, rIdx) => {
    const tr = document.createElement('tr');
    const xInputType = isBar ? 'text' : 'number';
    let rowHtml = `<td><input type="${xInputType}" step="any" value="${xVal}" onchange="updateXVal(${rIdx}, this.value)"></td>`;

    currentDataset.series.forEach((s, sIdx) => {
      const yVal = s.values[rIdx] !== undefined ? s.values[rIdx] : 0;
      rowHtml += `<td><input type="number" step="any" value="${yVal}" onchange="updateYVal(${sIdx}, ${rIdx}, this.value)"></td>`;
    });

    rowHtml += `<td><button class="btn btn-danger btn-sm" onclick="removeRow(${rIdx})" style="padding:0.15rem 0.4rem; font-size:0.7rem;">✕</button></td>`;
    tr.innerHTML = rowHtml;
    tbody.appendChild(tr);
  });
}

function updateSeriesMeta(sIdx, field, val) {
  if (currentDataset.series[sIdx]) {
    currentDataset.series[sIdx][field] = val;
    updateSeriesStyleSelector();
    renderTable();
    renderChart();
  }
}

function updateXVal(rIdx, val) {
  const isBar = currentDataset.chartType === 'bar';
  currentDataset.xValues[rIdx] = isBar ? val : (parseFloat(val) || 0);
  renderChart();
}

function updateYVal(sIdx, rIdx, val) {
  if (currentDataset.series[sIdx]) {
    currentDataset.series[sIdx].values[rIdx] = parseFloat(val) || 0;
    renderChart();
  }
}

function removeSeries(sIdx) {
  if (currentDataset.series.length > 1) {
    currentDataset.series.splice(sIdx, 1);
    updateSeriesStyleSelector();
    renderTable();
    renderChart();
  }
}

function removeRow(index) {
  currentDataset.xValues.splice(index, 1);
  currentDataset.series.forEach(s => s.values.splice(index, 1));
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
  if (!ctx) return;
  
  if (chartInstance) {
    chartInstance.destroy();
  }

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const textColor = isDark ? '#f8fafc' : '#0f172a';
  const mutedColor = isDark ? '#94a3b8' : '#475569';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

  const xTitle = currentDataset.xAxisUnit ? `${currentDataset.xAxisLabel} (${currentDataset.xAxisUnit})` : currentDataset.xAxisLabel;
  const isBar = currentDataset.chartType === 'bar';

  document.getElementById('printReportTitle').innerText = `${currentDataset.title} - CAST Lab Report`;

  const chartDatasets = [];

  currentDataset.series.forEach(s => {
    const sColor = s.color || "#0284c7";
    const pStyle = s.pointStyle || "circle";
    const pRadius = s.pointRadius || 6;
    const yLabel = s.unit ? `${s.label} (${s.unit})` : s.label;

    if (isBar) {
      chartDatasets.push({
        label: yLabel,
        data: s.values.map(v => parseFloat(v) || 0),
        backgroundColor: sColor,
        borderColor: sColor,
        borderWidth: 1
      });
    } else {
      const pts = currentDataset.xValues.map((x, idx) => ({
        x: parseFloat(x) || 0,
        y: parseFloat(s.values[idx]) || 0
      }));

      chartDatasets.push({
        label: yLabel,
        data: pts,
        backgroundColor: sColor,
        borderColor: sColor,
        pointStyle: pStyle,
        pointRadius: pRadius,
        pointHoverRadius: pRadius + 3,
        showLine: currentDataset.chartType === 'line'
      });

      const reg = calculateLinearRegression(pts);
      if (currentDataset.showBestFit && reg && !isNaN(reg.slope)) {
        chartDatasets.push({
          label: `${s.label} Trend (y = ${reg.slope.toFixed(2)}x + ${reg.intercept.toFixed(2)})`,
          data: reg.trendlineData,
          type: 'line',
          borderColor: sColor,
          borderWidth: 2,
          borderDash: [6, 6],
          pointRadius: 0,
          fill: false
        });
      }
    }
  });

  const firstSeriesPts = currentDataset.xValues.map((x, idx) => ({
    x: parseFloat(x) || 0,
    y: parseFloat(currentDataset.series[0]?.values[idx]) || 0
  }));
  const regPrimary = calculateLinearRegression(firstSeriesPts);
  if (!isBar && regPrimary && !isNaN(regPrimary.slope)) {
    document.getElementById('equationBadge').innerText = `y = ${regPrimary.slope.toFixed(2)}x + ${regPrimary.intercept.toFixed(2)}`;
    document.getElementById('slopeVal').innerText = regPrimary.slope.toFixed(3);
    document.getElementById('interceptVal').innerText = regPrimary.intercept.toFixed(3);
    document.getElementById('r2Val').innerText = regPrimary.r2.toFixed(3);

    const relText = regPrimary.slope > 0 ? "Direct Positive Trend" : (regPrimary.slope < 0 ? "Inverse / Negative Trend" : "No Linear Trend");
    document.getElementById('relationshipBadge').innerText = relText;
  } else {
    document.getElementById('equationBadge').innerText = isBar ? "Bar Chart" : "Scatter Plot";
    document.getElementById('relationshipBadge').innerText = isBar ? "Categorical" : "Custom Plot";
    document.getElementById('slopeVal').innerText = '--';
    document.getElementById('interceptVal').innerText = '--';
    document.getElementById('r2Val').innerText = '--';
  }

  // Calculate exact scale min and max so negative numbers (-100, -5) never display
  let calcXMin = undefined, calcXMax = undefined;
  let calcYMin = undefined, calcYMax = undefined;

  if (!isBar && currentDataset.xValues.length > 0) {
    const numX = currentDataset.xValues.map(v => parseFloat(v) || 0);
    const minX = Math.min(...numX);
    const maxX = Math.max(...numX);
    const spanX = maxX - minX || 1;

    if (currentDataset.xMin !== "") {
      calcXMin = parseFloat(currentDataset.xMin);
    } else if (currentDataset.showZero || minX >= 0) {
      calcXMin = 0;
    } else {
      calcXMin = minX;
    }

    if (currentDataset.xMax !== "") {
      calcXMax = parseFloat(currentDataset.xMax);
    } else {
      calcXMax = maxX + spanX * 0.05;
    }
  }

  // Y axis min/max calculation
  let allYValues = [];
  currentDataset.series.forEach(s => {
    s.values.forEach(v => allYValues.push(parseFloat(v) || 0));
  });

  if (allYValues.length > 0) {
    const minY = Math.min(...allYValues);
    const maxY = Math.max(...allYValues);
    const spanY = maxY - minY || 1;

    if (currentDataset.yMin !== "") {
      calcYMin = parseFloat(currentDataset.yMin);
    } else if (currentDataset.showZero || minY >= 0) {
      calcYMin = 0;
    } else {
      calcYMin = minY;
    }

    if (currentDataset.yMax !== "") {
      calcYMax = parseFloat(currentDataset.yMax);
    } else {
      calcYMax = maxY + spanY * 0.08;
    }
  }

  chartInstance = new Chart(ctx, {
    type: isBar ? 'bar' : 'scatter',
    data: {
      labels: isBar ? currentDataset.xValues : undefined,
      datasets: chartDatasets.map(ds => ({ ...ds, clip: false }))
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          left: 15,
          right: 35,
          top: 20,
          bottom: 10
        }
      },
      plugins: {
        title: {
          display: true,
          text: currentDataset.title,
          color: textColor,
          font: { size: 15, weight: 'bold' }
        },
        legend: {
          labels: { color: mutedColor, usePointStyle: true }
        }
      },
      scales: {
        x: {
          type: isBar ? 'category' : 'linear',
          title: { display: true, text: xTitle, color: textColor, font: { weight: 'bold' } },
          grid: { display: currentDataset.showGrid !== false, color: gridColor },
          ticks: {
            display: true,
            autoSkip: false,
            color: mutedColor,
            font: { size: 11 }
          },
          min: calcXMin,
          max: calcXMax
        },
        y: {
          title: { display: true, text: currentDataset.series[0]?.unit ? `Y Axis (${currentDataset.series[0].unit})` : 'Y Axis', color: textColor, font: { weight: 'bold' } },
          grid: { display: currentDataset.showGrid !== false, color: gridColor },
          ticks: {
            display: true,
            autoSkip: false,
            padding: 8,
            color: mutedColor,
            font: { size: 11 }
          },
          min: calcYMin,
          max: calcYMax
        }
      }
    }
  });

  document.getElementById('dataPointCount').innerText = currentDataset.xValues.length;
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
  if (currentDataset.xValues.length < 2) return;
  const sortedIndices = currentDataset.xValues.map((x, i) => ({ x: parseFloat(x) || 0, i })).sort((a, b) => a.x - b.x);
  const firstIdx = sortedIndices[0].i;
  const lastIdx = sortedIndices[sortedIndices.length - 1].i;

  const firstX = currentDataset.xValues[firstIdx];
  const lastX = currentDataset.xValues[lastIdx];
  const xName = currentDataset.xAxisLabel;
  const xUnit = currentDataset.xAxisUnit;
  const firstY = currentDataset.series[0]?.values[firstIdx] || 0;
  const lastY = currentDataset.series[0]?.values[lastIdx] || 0;
  const yName = currentDataset.series[0]?.label || "Y Variable";
  const yUnit = currentDataset.series[0]?.unit || "";

  const autoSentence = `Based on the graph, as ${xName} increased from ${firstX} ${xUnit} to ${lastX} ${xUnit}, ${yName} changed from ${firstY} ${yUnit} to ${lastY} ${yUnit}.`;
  
  const field = document.getElementById('cerEvidence');
  field.value = autoSentence + " " + field.value;
  currentDataset.cer.evidence = field.value;
  updateCERPreview();
}

function renderQuestions() {
  const container = document.getElementById('questionsContainer');
  if (!container) return;
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

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const bgColor = isDark ? '#0f172a' : '#ffffff';

  const sourceCanvas = chartInstance.canvas;
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = sourceCanvas.width;
  tempCanvas.height = sourceCanvas.height;

  const tempCtx = tempCanvas.getContext('2d');
  tempCtx.fillStyle = bgColor;
  tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
  tempCtx.drawImage(sourceCanvas, 0, 0);

  const link = document.createElement('a');
  link.download = `${currentDataset.title.replace(/\s+/g, '_')}_graph.png`;
  link.href = tempCanvas.toDataURL('image/png');
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
