// ==========================================================================
// P031 Reaction Time Lab Masterclass: Interactive Engine & Grapher
// ==========================================================================

// Global renderGraph function reference for theme toggle & tab switching
let globalRenderGraph = null;

document.addEventListener('DOMContentLoaded', () => {
  initFontToggle();
  initThemeToggle();
  initTabNavigation();
  initStep1Average();
  initStep2Converter();
  initStep3Solver();
  initStep4Grapher();
});

// --------------------------------------------------------------------------
// 1. Font Size Switcher (Universal Root Font Scaling on <html>)
// --------------------------------------------------------------------------
function initFontToggle() {
  const fontBtns = document.querySelectorAll('.font-btn');
  const root = document.documentElement;

  const savedSize = localStorage.getItem('p031_font_size') || 'large';
  applyFontSize(savedSize);

  fontBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const size = btn.dataset.size;
      applyFontSize(size);
      localStorage.setItem('p031_font_size', size);
    });
  });

  function applyFontSize(size) {
    // IMPORTANT: Modify root <html> element so all rem units resize proportionally!
    root.classList.remove('font-normal', 'font-large', 'font-huge');
    root.classList.add(`font-${size}`);

    fontBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.size === size);
    });
  }
}

// --------------------------------------------------------------------------
// 2. High-Contrast Light Mode / Dark Mode Theme Switcher
// --------------------------------------------------------------------------
function initThemeToggle() {
  const toggleBtn = document.getElementById('btn-theme-toggle');
  const iconSpan = document.getElementById('theme-icon');
  const textSpan = document.getElementById('theme-text');
  const root = document.documentElement;

  const savedTheme = localStorage.getItem('p031_theme') || 'dark';
  applyTheme(savedTheme);

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const isCurrentlyLight = root.classList.contains('theme-light');
      const newTheme = isCurrentlyLight ? 'dark' : 'light';
      applyTheme(newTheme);
      localStorage.setItem('p031_theme', newTheme);

      // Re-render graph canvas with updated theme palette
      if (typeof globalRenderGraph === 'function') {
        globalRenderGraph();
      }
    });
  }

  function applyTheme(theme) {
    if (theme === 'light') {
      root.classList.add('theme-light');
      if (iconSpan) iconSpan.textContent = '🌙';
      if (textSpan) textSpan.textContent = 'Dark Mode';
    } else {
      root.classList.remove('theme-light');
      if (iconSpan) iconSpan.textContent = '☀️';
      if (textSpan) textSpan.textContent = 'Light Mode';
    }
  }
}

// --------------------------------------------------------------------------
// 3. Page-Like Slide Tab Navigation (One Step Visible at a Time)
// --------------------------------------------------------------------------
function initTabNavigation() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');
  const nextBtns = document.querySelectorAll('[data-next]');
  const prevBtns = document.querySelectorAll('[data-prev]');
  const jumpBtns = document.querySelectorAll('[data-tab-jump]');

  function switchTab(tabNumber) {
    const targetId = `pane-${tabNumber}`;

    // Update tab panes
    tabPanes.forEach(pane => {
      if (pane.id === targetId) {
        pane.classList.add('active');
      } else {
        pane.classList.remove('active');
      }
    });

    // Update tab bar buttons
    tabBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === String(tabNumber));
    });

    // Smoothly scroll back to top of the page so step buttons and header remain in full view
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // If switching to Step 4 (Grapher), redraw canvas for correct layout
    if (String(tabNumber) === '4' && typeof globalRenderGraph === 'function') {
      setTimeout(() => {
        globalRenderGraph();
      }, 50);
    }

    localStorage.setItem('p031_active_tab', String(tabNumber));
  }

  // Top tab bar clicks
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabNum = btn.dataset.tab;
      if (tabNum) switchTab(tabNum);
    });
  });

  // Next Step buttons
  nextBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const nextNum = btn.dataset.next;
      if (nextNum) switchTab(nextNum);
    });
  });

  // Previous Step buttons
  prevBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const prevNum = btn.dataset.prev;
      if (prevNum) switchTab(prevNum);
    });
  });

  // Jump buttons (e.g. Back to Step 1)
  jumpBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const jumpNum = btn.dataset.tabJump;
      if (jumpNum) switchTab(jumpNum);
    });
  });

  // Restore initial tab from hash (#step3) or localStorage
  const hash = window.location.hash.replace('#step-', '').replace('#step', '').replace('#', '');
  const savedTab = hash || localStorage.getItem('p031_active_tab') || '1';
  if (['1', '2', '3', '4', '5'].includes(savedTab) && savedTab !== '1') {
    switchTab(savedTab);
  }
}

// --------------------------------------------------------------------------
// 4. Step 1: Average Drop Distance Calculator
// --------------------------------------------------------------------------
function initStep1Average() {
  const in1 = document.getElementById('s1-t1');
  const in2 = document.getElementById('s1-t2');
  const in3 = document.getElementById('s1-t3');
  const outSteps = document.getElementById('s1-steps');
  const outFinal = document.getElementById('s1-final');

  if (!in1 || !in2 || !in3) return;

  function calculate() {
    const v1 = parseFloat(in1.value) || 0;
    const v2 = parseFloat(in2.value) || 0;
    const v3 = parseFloat(in3.value) || 0;

    const sum = v1 + v2 + v3;
    const avg = sum / 3;

    outSteps.innerHTML = `
      <div class="calc-vertical-layout">
        <div class="vertical-math-stack">
          <div class="stack-row"><span class="stack-op"></span><span class="stack-val">${v1.toFixed(1)} cm</span></div>
          <div class="stack-row"><span class="stack-op">+</span><span class="stack-val">${v2.toFixed(1)} cm</span></div>
          <div class="stack-row"><span class="stack-op">+</span><span class="stack-val">${v3.toFixed(1)} cm</span></div>
          <div class="stack-divider"></div>
          <div class="stack-row"><span class="stack-op">=</span><span class="stack-total">${sum.toFixed(1)} cm</span></div>
        </div>
        <div class="math-fraction-inline">
          <span style="color:var(--text-muted); font-size:1rem; font-weight:700;">Average:</span>
          <div class="math-fraction">
            <span class="fraction-num">${sum.toFixed(1)} cm</span>
            <span class="fraction-den">3</span>
          </div>
          <span class="fraction-res">= ${avg.toFixed(1)} cm</span>
        </div>
      </div>
    `;

    outFinal.innerHTML = `
      <span>Average (<span class="var-overline">d</span>):</span>
      <span style="color: var(--accent-emerald);">${avg.toFixed(1)} cm</span>
    `;

    // Forward to Step 2 converter if user has not overridden
    const s2Input = document.getElementById('s2-cm');
    if (s2Input && !s2Input.dataset.manual) {
      s2Input.value = avg.toFixed(1);
      s2Input.dispatchEvent(new Event('input'));
    }
  }

  [in1, in2, in3].forEach(input => {
    input.addEventListener('input', calculate);
  });

  calculate();
}

// --------------------------------------------------------------------------
// 5. Step 2: Unit Converter (cm to meters)
// --------------------------------------------------------------------------
function initStep2Converter() {
  const inCm = document.getElementById('s2-cm');
  const outSteps = document.getElementById('s2-steps');
  const outFinal = document.getElementById('s2-final');

  if (!inCm) return;

  function convert() {
    const cm = parseFloat(inCm.value) || 0;
    const m = cm / 100;

    outSteps.innerHTML = `
      <div class="calc-vertical-layout">
        <div class="math-fraction-inline">
          <div class="math-fraction">
            <span class="fraction-num">${cm.toFixed(1)} cm</span>
            <span class="fraction-den">100</span>
          </div>
          <span class="fraction-res">= ${m.toFixed(3)} m</span>
        </div>
        <div style="font-size:1.05rem; color:var(--text-muted);">
          Shift decimal <strong>2 places left (← ←)</strong>
        </div>
      </div>
    `;

    outFinal.innerHTML = `
      <span>Distance in Meters (d):</span>
      <span style="color: var(--accent-emerald);">${m.toFixed(3)} m</span>
    `;

    // Forward to Step 3 solver if not manually modified
    const s3Input = document.getElementById('s3-dist');
    if (s3Input && !s3Input.dataset.manual) {
      s3Input.value = m.toFixed(3);
      s3Input.dispatchEvent(new Event('input'));
    }
  }

  inCm.addEventListener('input', () => {
    inCm.dataset.manual = 'true';
    convert();
  });

  convert();
}

// --------------------------------------------------------------------------
// 6. Step 3: Reaction Time Solver: t = √(x / 5) using g = 10 m/s²
// --------------------------------------------------------------------------
function initStep3Solver() {
  const inDist = document.getElementById('s3-dist');
  const outSteps = document.getElementById('s3-steps');
  const outFinal = document.getElementById('s3-final');
  const outRating = document.getElementById('s3-rating');

  if (!inDist) return;

  function solve() {
    const x = parseFloat(inDist.value) || 0;
    // Classroom free fall formula: x = 1/2 g t^2 = 5 t^2  ==>  t = sqrt(x / 5)
    const quotient = x / 5;
    const t = Math.sqrt(Math.max(0, quotient));
    const ms = (t * 1000).toFixed(0);

    outSteps.innerHTML = `
      <div class="calc-vertical-layout">
        <div class="math-fraction-inline">
          <span style="color:var(--text-muted); font-size:1rem;">1. Divide by 5:</span>
          <div class="math-fraction">
            <span class="fraction-num">${x.toFixed(3)} m</span>
            <span class="fraction-den">5</span>
          </div>
          <span class="fraction-res">= ${quotient.toFixed(5)}</span>
        </div>
        <div class="math-fraction-inline">
          <span style="color:var(--text-muted); font-size:1rem;">2. Square root:</span>
          <div class="math-radical" style="font-size: 1.05rem;">
            <svg class="radical-symbol" viewBox="0 0 24 100" preserveAspectRatio="none" aria-hidden="true">
              <path d="M 2 54 L 6 49 L 13 94 L 24 1.5" />
            </svg>
            <div class="radical-radicand">
              <span>${quotient.toFixed(5)}</span>
            </div>
          </div>
          <span class="fraction-res" style="margin-left: 0.35rem;">= ${t.toFixed(3)} s</span>
        </div>
      </div>
    `;

    outFinal.innerHTML = `
      <span>Reaction Time (t):</span>
      <span style="color: var(--accent-emerald);">${t.toFixed(3)} s <span style="font-size: 1.15rem; color: var(--text-muted);">(${ms} ms)</span></span>
    `;

    // Benchmark classification
    let ratingText = '';
    let ratingColor = 'var(--accent-cyan)';

    if (t <= 0.05) {
      ratingText = '⚠️ Check measurement: caught too low or anticipated the release!';
      ratingColor = 'var(--accent-amber)';
    } else if (t < 0.16) {
      ratingText = '⚡ Olympic / Elite Athlete Reflexes (Under 160 ms)!';
      ratingColor = 'var(--accent-emerald)';
    } else if (t <= 0.21) {
      ratingText = '🏃 Typical Human Baseline (160 ms – 210 ms).';
      ratingColor = 'var(--accent-cyan)';
    } else if (x <= 0.30) {
      ratingText = '📱 Mild to Heavy Distraction (210 ms – 245 ms, caught near 30 cm ruler edge).';
      ratingColor = 'var(--accent-amber)';
    } else {
      ratingText = '🚨 Missed Catch: Exceeds 30 cm ruler limit (>245 ms, ruler dropped past hand)!';
      ratingColor = 'var(--accent-rose)';
    }

    outRating.innerHTML = `<span style="color: ${ratingColor}; font-weight: 700; font-size: 1.05rem;">${ratingText}</span>`;
  }

  inDist.addEventListener('input', () => {
    inDist.dataset.manual = 'true';
    solve();
  });

  solve();
}

// --------------------------------------------------------------------------
// 7. Step 4: Grouped Column Graph Engine (Canvas Rendering)
// --------------------------------------------------------------------------
function initStep4Grapher() {
  const canvas = document.getElementById('groupedGraphCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const btnRender = document.getElementById('btnRenderGraph');
  const btnSample = document.getElementById('btnSampleData');
  const metricSelect = document.getElementById('graphMetricSelect');
  const btnDownload = document.getElementById('btnDownloadGraph');

  // Sample data within standard 30 cm ruler limit
  const sampleData = [
    { name: 'Person 1', undis: 19.5, dist: 27.5 },
    { name: 'Person 2', undis: 14.5, dist: 22.0 },
    { name: 'Person 3', undis: 18.0, dist: 29.0 },
    { name: 'Person 4', undis: 16.0, dist: 25.0 }
  ];

  function loadSample() {
    sampleData.forEach((p, i) => {
      const idx = i + 1;
      const elUndis = document.getElementById(`g-p${idx}-undis`);
      const elDist = document.getElementById(`g-p${idx}-dist`);
      if (elUndis) elUndis.value = p.undis.toFixed(1);
      if (elDist) elDist.value = p.dist.toFixed(1);
    });
    renderGraph();
  }

  function getGroupData() {
    const isTime = metricSelect.value === 'time';
    const groups = [];

    for (let i = 1; i <= 4; i++) {
      const elUndis = document.getElementById(`g-p${i}-undis`);
      const elDist = document.getElementById(`g-p${i}-dist`);
      const name = `Person ${i}`;

      const cmUndis = parseFloat(elUndis ? elUndis.value : 0) || 0;
      const cmDist = parseFloat(elDist ? elDist.value : 0) || 0;

      if (isTime) {
        // Classroom free fall: t = sqrt(x / 5) where x = cm / 100 (g = 10 m/s^2)
        const mUndis = cmUndis / 100;
        const mDist = cmDist / 100;
        const tUndis = Math.sqrt(Math.max(0, mUndis / 5));
        const tDist = Math.sqrt(Math.max(0, mDist / 5));
        groups.push({
          name: name,
          undis: tUndis,
          dist: tDist,
          unit: 's'
        });
      } else {
        groups.push({
          name: name,
          undis: cmUndis,
          dist: cmDist,
          unit: 'cm'
        });
      }
    }
    return groups;
  }

  function renderGraph() {
    const isLight = document.documentElement.classList.contains('theme-light');

    // Canvas dimensions & High-DPI support
    const dpr = window.devicePixelRatio || 1;
    const displayWidth = 840;
    const displayHeight = 520;

    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;

    ctx.save();
    ctx.scale(dpr, dpr);

    const w = displayWidth;
    const h = displayHeight;

    // Palette selection based on active theme
    const bgFill = isLight ? '#ffffff' : '#070d19';
    const textTitle = isLight ? '#0f172a' : '#ffffff';
    const textSub = isLight ? '#475569' : '#94a3b8';
    const gridLineColor = isLight ? '#e2e8f0' : '#1e293b';
    const axisTickColor = isLight ? '#334155' : '#94a3b8';
    const axisBaseColor = isLight ? '#64748b' : '#64748b';
    const groupNameColor = isLight ? '#0f172a' : '#ffffff';

    const barUndisTop = isLight ? '#0284c7' : '#38bdf8';
    const barUndisBot = isLight ? '#0369a1' : '#0284c7';
    const barDistTop = isLight ? '#d97706' : '#fbbf24';
    const barDistBot = isLight ? '#b45309' : '#d97706';

    // Clear background
    ctx.fillStyle = bgFill;
    ctx.fillRect(0, 0, w, h);

    const groups = getGroupData();
    const isTime = metricSelect.value === 'time';

    // Margins
    const margin = { top: 85, right: 40, bottom: 85, left: 90 };
    const chartW = w - margin.left - margin.right;
    const chartH = h - margin.top - margin.bottom;

    // Max value calculation
    let maxVal = 0;
    groups.forEach(g => {
      maxVal = Math.max(maxVal, g.undis, g.dist);
    });

    let yMax = 0;
    let yStep = 0;

    if (isTime) {
      // Typically 0.00 to 0.30 s (max on 30cm ruler is 0.245 s)
      yMax = Math.max(0.30, Math.ceil(maxVal * 1.15 * 20) / 20);
      yStep = 0.05;
    } else {
      // Standard 30 cm metric classroom ruler scale
      yMax = Math.max(30, Math.ceil(maxVal * 1.05 / 5) * 5);
      yStep = 5;
    }

    // 1. Draw Title
    ctx.fillStyle = textTitle;
    ctx.font = '800 20px Outfit, sans-serif';
    ctx.textAlign = 'center';
    const titleText = isTime
      ? 'Reaction Time: Undistracted vs. Distracted (P031 Lab)'
      : 'Average Drop Distance: Undistracted vs. Distracted (P031 Lab)';
    ctx.fillText(titleText, w / 2, 38);

    ctx.fillStyle = textSub;
    ctx.font = '600 13px Outfit, sans-serif';
    ctx.fillText('Grouped Column Graph: Comparing Neural Reaction Lag Across Sensory Conditions', w / 2, 60);

    // 2. Gridlines & Y-Axis Scale
    ctx.lineWidth = 1;
    ctx.strokeStyle = gridLineColor;
    ctx.fillStyle = axisTickColor;
    ctx.font = '700 13px JetBrains Mono, monospace';
    ctx.textAlign = 'right';

    const numTicks = Math.round(yMax / yStep);
    for (let i = 0; i <= numTicks; i++) {
      const val = i * yStep;
      if (val > yMax * 1.02) break;

      const yPos = margin.top + chartH - (val / yMax) * chartH;

      ctx.beginPath();
      ctx.moveTo(margin.left, yPos);
      ctx.lineTo(margin.left + chartW, yPos);
      ctx.stroke();

      const tickLabel = isTime ? val.toFixed(2) + ' s' : val.toFixed(0) + ' cm';
      ctx.fillText(tickLabel, margin.left - 12, yPos + 4);
    }

    // Y-Axis Title
    ctx.save();
    ctx.translate(28, margin.top + chartH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillStyle = isLight ? '#0284c7' : '#38bdf8';
    ctx.font = '800 15px Outfit, sans-serif';
    ctx.fillText(isTime ? 'Reaction Time (seconds)' : 'Drop Distance (cm)', 0, 0);
    ctx.restore();

    // 3. Draw Columns
    const groupCount = groups.length;
    const groupWidth = chartW / groupCount;
    const barWidth = Math.min(38, groupWidth * 0.32);
    const barGap = 6;

    groups.forEach((g, idx) => {
      const groupCenterX = margin.left + idx * groupWidth + groupWidth / 2;

      const xUndis = groupCenterX - barWidth - barGap / 2;
      const xDist = groupCenterX + barGap / 2;

      const hUndis = (g.undis / yMax) * chartH;
      const hDist = (g.dist / yMax) * chartH;

      const yUndis = margin.top + chartH - hUndis;
      const yDist = margin.top + chartH - hDist;

      // Bar 1: Undistracted
      const gradUndis = ctx.createLinearGradient(xUndis, yUndis, xUndis, yUndis + hUndis);
      gradUndis.addColorStop(0, barUndisTop);
      gradUndis.addColorStop(1, barUndisBot);
      ctx.fillStyle = gradUndis;
      ctx.fillRect(xUndis, yUndis, barWidth, hUndis);

      // Bar 2: Distracted
      const gradDist = ctx.createLinearGradient(xDist, yDist, xDist, yDist + hDist);
      gradDist.addColorStop(0, barDistTop);
      gradDist.addColorStop(1, barDistBot);
      ctx.fillStyle = gradDist;
      ctx.fillRect(xDist, yDist, barWidth, hDist);

      // Value text on top of bars
      ctx.font = '700 12px JetBrains Mono, monospace';
      ctx.textAlign = 'center';

      ctx.fillStyle = barUndisTop;
      const txtUndis = isTime ? g.undis.toFixed(3) : g.undis.toFixed(1);
      ctx.fillText(txtUndis, xUndis + barWidth / 2, yUndis - 7);

      ctx.fillStyle = barDistTop;
      const txtDist = isTime ? g.dist.toFixed(3) : g.dist.toFixed(1);
      ctx.fillText(txtDist, xDist + barWidth / 2, yDist - 7);

      // Group X-Axis Label
      ctx.fillStyle = groupNameColor;
      ctx.font = '800 14px Outfit, sans-serif';
      ctx.fillText(g.name, groupCenterX, margin.top + chartH + 26);
    });

    // 4. Baseline Axes
    ctx.lineWidth = 2;
    ctx.strokeStyle = axisBaseColor;
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, margin.top + chartH);
    ctx.lineTo(margin.left + chartW, margin.top + chartH);
    ctx.stroke();

    // 5. Legend
    const legendX = margin.left + chartW / 2 - 130;
    const legendY = margin.top + chartH + 54;

    // Undistracted Box
    ctx.fillStyle = barUndisTop;
    ctx.fillRect(legendX, legendY - 11, 16, 16);
    ctx.strokeStyle = barUndisBot;
    ctx.strokeRect(legendX, legendY - 11, 16, 16);

    ctx.fillStyle = textTitle;
    ctx.font = '700 13px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Undistracted (Baseline)', legendX + 24, legendY + 2);

    // Distracted Box
    const leg2X = legendX + 175;
    ctx.fillStyle = barDistTop;
    ctx.fillRect(leg2X, legendY - 11, 16, 16);
    ctx.strokeStyle = barDistBot;
    ctx.strokeRect(leg2X, legendY - 11, 16, 16);

    ctx.fillStyle = textTitle;
    ctx.fillText('Distracted (Phone/Talking)', leg2X + 24, legendY + 2);

    ctx.restore();
  }

  // Assign to global reference so theme toggle can refresh canvas
  globalRenderGraph = renderGraph;

  // Event Listeners
  btnRender.addEventListener('click', renderGraph);
  metricSelect.addEventListener('change', renderGraph);
  btnSample.addEventListener('click', loadSample);

  document.querySelectorAll('.graph-input').forEach(inp => {
    inp.addEventListener('input', renderGraph);
  });

  // Download Graph Image
  if (btnDownload) {
    btnDownload.addEventListener('click', () => {
      const link = document.createElement('a');
      link.download = `P031_Reaction_Time_Grouped_Graph_${metricSelect.value}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    });
  }

  // Initial load
  loadSample();
}
