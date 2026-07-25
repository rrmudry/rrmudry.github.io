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
    data: [
      { x: 10, y: 2.1 },
      { x: 20, y: 4.5 },
      { x: 30, y: 7.2 },
      { x: 40, y: 9.8 },
      { x: 50, y: 12.0 },
      { x: 60, y: 12.3 },
      { x: 70, y: 12.4 }
    ],
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
    data: [
      { x: 0, y: 0 },
      { x: 100, y: 5 },
      { x: 200, y: 10 },
      { x: 300, y: 15 },
      { x: 400, y: 20 },
      { x: 500, y: 25 }
    ],
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
    data: [
      { x: 0.2, y: 0.90 },
      { x: 0.4, y: 1.27 },
      { x: 0.6, y: 1.55 },
      { x: 0.8, y: 1.79 },
      { x: 1.0, y: 2.01 }
    ],
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
  }
};

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
    } else if (presets[key]) {
      currentDataset = JSON.parse(JSON.stringify(presets[key]));
      document.getElementById('graphTitleInput').value = currentDataset.title;
      document.getElementById('xAxisLabelInput').value = currentDataset.xAxisLabel;
      document.getElementById('xAxisUnitInput').value = currentDataset.xAxisUnit;
      document.getElementById('yAxisLabelInput').value = currentDataset.yAxisLabel;
      document.getElementById('yAxisUnitInput').value = currentDataset.yAxisUnit;
      document.getElementById('chartTypeSelect').value = currentDataset.chartType;
      document.getElementById('bestFitToggle').checked = currentDataset.showBestFit;
    }
    renderTable();
    renderChart();
    renderQuestions();
  });

  document.getElementById('graphTitleInput').addEventListener('input', (e) => {
    currentDataset.title = e.target.value;
    renderChart();
  });

  document.getElementById('xAxisLabelInput').addEventListener('input', (e) => {
    currentDataset.xAxisLabel = e.target.value;
    renderChart();
  });

  document.getElementById('xAxisUnitInput').addEventListener('input', (e) => {
    currentDataset.xAxisUnit = e.target.value;
    renderChart();
  });

  document.getElementById('yAxisLabelInput').addEventListener('input', (e) => {
    currentDataset.yAxisLabel = e.target.value;
    renderChart();
  });

  document.getElementById('yAxisUnitInput').addEventListener('input', (e) => {
    currentDataset.yAxisUnit = e.target.value;
    renderChart();
  });

  document.getElementById('chartTypeSelect').addEventListener('change', (e) => {
    currentDataset.chartType = e.target.value;
    renderChart();
  });

  document.getElementById('bestFitToggle').addEventListener('change', (e) => {
    currentDataset.showBestFit = e.target.checked;
    renderChart();
  });

  document.getElementById('addRowBtn').addEventListener('click', () => {
    currentDataset.data.push({ x: 0, y: 0 });
    renderTable();
    renderChart();
  });

  document.getElementById('clearDataBtn').addEventListener('click', () => {
    currentDataset.data = [{ x: 0, y: 0 }];
    renderTable();
    renderChart();
  });

  document.getElementById('exportPngBtn').addEventListener('click', exportChartImage);
}

function renderTable() {
  const tbody = document.getElementById('dataTableBody');
  tbody.innerHTML = '';

  currentDataset.data.forEach((pt, index) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input type="number" step="any" value="${pt.x}" data-index="${index}" data-field="x" class="table-input"></td>
      <td><input type="number" step="any" value="${pt.y}" data-index="${index}" data-field="y" class="table-input"></td>
      <td><button class="btn btn-danger btn-sm" onclick="removeRow(${index})" style="padding:0.2rem 0.5rem; font-size:0.75rem;">✕</button></td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('.table-input').forEach(input => {
    input.addEventListener('change', (e) => {
      const idx = parseInt(e.target.getAttribute('data-index'));
      const field = e.target.getAttribute('data-field');
      const val = parseFloat(e.target.value) || 0;
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

  const datasets = [{
    label: currentDataset.title,
    data: currentDataset.data,
    backgroundColor: primaryFill,
    borderColor: primaryAccent,
    pointRadius: 6,
    pointHoverRadius: 9,
    showLine: currentDataset.chartType === 'line'
  }];

  const reg = calculateLinearRegression(currentDataset.data);
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
  } else {
    document.getElementById('slopeVal').innerText = '--';
    document.getElementById('interceptVal').innerText = '--';
  }

  chartInstance = new Chart(ctx, {
    type: currentDataset.chartType === 'bar' ? 'bar' : 'scatter',
    data: { datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: currentDataset.title,
          color: textColor,
          font: { size: 16, weight: 'bold' }
        },
        legend: {
          labels: { color: mutedColor }
        }
      },
      scales: {
        x: {
          title: { display: true, text: xTitle, color: primaryAccent },
          grid: { color: gridColor },
          ticks: { color: mutedColor }
        },
        y: {
          title: { display: true, text: yTitle, color: primaryAccent },
          grid: { color: gridColor },
          ticks: { color: mutedColor }
        }
      }
    }
  });

  document.getElementById('dataPointCount').innerText = currentDataset.data.length;
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
