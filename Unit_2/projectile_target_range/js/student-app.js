// Student Workbench Application Logic
// Projectile Target Range: Empirical Calibration & Student Target Calculation
// Earth gravity: g = 10 m/s², strictly zero LaTeX

(function () {
  'use strict';

  // Constants & State
  const G = 10.0; // m/s²
  const STORAGE_KEY = 'projectile_target_workbench_state';

  let state = {
    period: 0,
    tableNum: 1,
    teamMembers: '',
    tableHeightCm: 85.0, // Default typical lab table height in cm
    dataRows: [
      { h: 10, dx: 38 },
      { h: 20, dx: 54 },
      { h: 30, dx: 66 },
      { h: 40, dx: 76 }
    ],
    targetDistCm: 60.0,
    studentReleaseHeightCm: '',
    studentVx: '',
    calculationMethod: 'curve_algebra',
    elevationCm: 0.0,
    isElevated: false,
    k: null,
    r2: null
  };

  let currentUser = null;
  let fbDb = null;

  // DOM Elements Cache
  const els = {};

  function init() {
    cacheElements();
    initFirebase();
    loadLocalState();
    bindEvents();
    recalculate();
    renderPlot();
  }

  function cacheElements() {
    els.periodSelect = document.getElementById('periodSelect');
    els.tableSelect = document.getElementById('tableSelect');
    els.teamInput = document.getElementById('teamInput');
    els.inputTableHeight = document.getElementById('inputTableHeight');
    els.dispAirTime = document.getElementById('dispAirTime');

    els.tableBody = document.getElementById('calTableBody');
    els.btnAddRow = document.getElementById('btnAddRow');

    els.fitEquation = document.getElementById('fitEquation');
    els.fitR2 = document.getElementById('fitR2');

    els.inputTargetDist = document.getElementById('inputTargetDist');
    els.inputReleaseHeight = document.getElementById('inputReleaseHeight');
    els.selectMethod = document.getElementById('selectMethod');
    els.inputStudentVx = document.getElementById('inputStudentVx');

    els.chkElevation = document.getElementById('chkElevation');
    els.wrapElevation = document.getElementById('wrapElevation');
    els.inputElevation = document.getElementById('inputElevation');

    els.btnSubmitPrediction = document.getElementById('btnSubmitPrediction');
    els.submitStatus = document.getElementById('submitStatus');

    els.plotCanvas = document.getElementById('plotCanvas');
    els.themeToggle = document.getElementById('themeToggle');
    els.userBadge = document.getElementById('userBadge');
    els.btnLogin = document.getElementById('btnLogin');
  }

  function initFirebase() {
    if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
      fbDb = firebase.firestore();
      firebase.auth().onAuthStateChanged(user => {
        currentUser = user;
        updateAuthUI();
        if (user) {
          syncFromFirestore(user);
        }
      });
    }
  }

  function updateAuthUI() {
    if (currentUser) {
      const email = currentUser.email || '';
      const prefix = email.split('@')[0];
      if (els.userBadge) {
        els.userBadge.textContent = `👤 ${prefix}`;
        els.userBadge.style.display = 'inline-flex';
      }
      if (els.btnLogin) {
        els.btnLogin.textContent = 'Sign Out';
      }
    } else {
      if (els.userBadge) els.userBadge.style.display = 'none';
      if (els.btnLogin) els.btnLogin.textContent = 'Google Sign-In';
    }
  }

  function loadLocalState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        state = Object.assign(state, parsed);
      }
    } catch (e) {
      console.warn('Could not load local state', e);
    }

    // Populate UI from state
    if (els.periodSelect) els.periodSelect.value = state.period;
    if (els.tableSelect) els.tableSelect.value = state.tableNum;
    if (els.teamInput) els.teamInput.value = state.teamMembers || '';
    if (els.inputTableHeight) els.inputTableHeight.value = state.tableHeightCm;
    if (els.inputTargetDist) els.inputTargetDist.value = state.targetDistCm;
    if (els.inputReleaseHeight) els.inputReleaseHeight.value = state.studentReleaseHeightCm || '';
    if (els.selectMethod) els.selectMethod.value = state.calculationMethod || 'curve_algebra';
    if (els.inputStudentVx) els.inputStudentVx.value = state.studentVx || '';
    if (els.chkElevation) els.chkElevation.checked = state.isElevated;
    if (els.wrapElevation) els.wrapElevation.style.display = state.isElevated ? 'flex' : 'none';
    if (els.inputElevation) els.inputElevation.value = state.elevationCm;

    renderTableRows();
  }

  function saveLocalState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {}
  }

  function bindEvents() {
    if (els.periodSelect) els.periodSelect.addEventListener('change', () => {
      state.period = parseInt(els.periodSelect.value) || 0;
      saveLocalState();
    });

    if (els.tableSelect) els.tableSelect.addEventListener('change', () => {
      state.tableNum = parseInt(els.tableSelect.value) || 1;
      saveLocalState();
    });

    if (els.teamInput) els.teamInput.addEventListener('input', () => {
      state.teamMembers = els.teamInput.value;
      saveLocalState();
    });

    if (els.inputTableHeight) els.inputTableHeight.addEventListener('input', () => {
      state.tableHeightCm = Math.max(10, parseFloat(els.inputTableHeight.value) || 85.0);
      saveLocalState();
      recalculate();
    });

    if (els.btnAddRow) els.btnAddRow.addEventListener('click', () => {
      const lastH = state.dataRows.length > 0 ? state.dataRows[state.dataRows.length - 1].h : 0;
      state.dataRows.push({ h: lastH + 10, dx: '' });
      renderTableRows();
      saveLocalState();
      recalculate();
    });

    if (els.inputTargetDist) els.inputTargetDist.addEventListener('input', () => {
      state.targetDistCm = parseFloat(els.inputTargetDist.value) || 0;
      saveLocalState();
      renderPlot();
    });

    if (els.inputReleaseHeight) els.inputReleaseHeight.addEventListener('input', () => {
      state.studentReleaseHeightCm = els.inputReleaseHeight.value === '' ? '' : parseFloat(els.inputReleaseHeight.value);
      saveLocalState();
      renderPlot();
    });

    if (els.selectMethod) els.selectMethod.addEventListener('change', () => {
      state.calculationMethod = els.selectMethod.value;
      saveLocalState();
    });

    if (els.inputStudentVx) els.inputStudentVx.addEventListener('input', () => {
      state.studentVx = els.inputStudentVx.value;
      saveLocalState();
    });

    if (els.chkElevation) els.chkElevation.addEventListener('change', () => {
      state.isElevated = els.chkElevation.checked;
      els.wrapElevation.style.display = state.isElevated ? 'flex' : 'none';
      saveLocalState();
      recalculate();
    });

    if (els.inputElevation) els.inputElevation.addEventListener('input', () => {
      state.elevationCm = Math.max(0, parseFloat(els.inputElevation.value) || 0);
      saveLocalState();
      recalculate();
    });

    if (els.btnSubmitPrediction) {
      els.btnSubmitPrediction.addEventListener('click', submitPrediction);
    }

    if (els.btnLogin) {
      els.btnLogin.addEventListener('click', () => {
        if (!firebase.apps.length) return;
        if (currentUser) {
          firebase.auth().signOut();
        } else {
          const provider = new firebase.auth.GoogleAuthProvider();
          provider.setCustomParameters({ hd: 'orangeusd.org' });
          firebase.auth().signInWithPopup(provider).catch(err => {
            console.error('Sign-in error', err);
            alert('Sign-in error: ' + err.message);
          });
        }
      });
    }

    if (els.themeToggle) {
      els.themeToggle.addEventListener('click', () => {
        document.documentElement.classList.toggle('theme-dark');
        renderPlot();
      });
    }

    window.addEventListener('resize', () => {
      renderPlot();
    });
  }

  function renderTableRows() {
    if (!els.tableBody) return;
    els.tableBody.innerHTML = '';

    state.dataRows.forEach((row, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-weight: 800; color: var(--text-dim);">${idx + 1}</td>
        <td>
          <input type="number" step="0.5" min="1" max="200" class="table-input input-h" data-idx="${idx}" value="${row.h !== '' ? row.h : ''}" placeholder="cm">
        </td>
        <td>
          <input type="number" step="0.5" min="1" max="400" class="table-input input-dx" data-idx="${idx}" value="${row.dx !== '' ? row.dx : ''}" placeholder="cm">
        </td>
        <td style="text-align: center;">
          <button type="button" class="btn-remove-row" data-idx="${idx}" title="Remove trial">✕</button>
        </td>
      `;
      els.tableBody.appendChild(tr);
    });

    // Bind row input changes
    els.tableBody.querySelectorAll('.input-h').forEach(inp => {
      inp.addEventListener('input', e => {
        const i = parseInt(e.target.dataset.idx);
        const val = e.target.value === '' ? '' : parseFloat(e.target.value);
        state.dataRows[i].h = val;
        saveLocalState();
        recalculate();
      });
    });

    els.tableBody.querySelectorAll('.input-dx').forEach(inp => {
      inp.addEventListener('input', e => {
        const i = parseInt(e.target.dataset.idx);
        const val = e.target.value === '' ? '' : parseFloat(e.target.value);
        state.dataRows[i].dx = val;
        saveLocalState();
        recalculate();
      });
    });

    els.tableBody.querySelectorAll('.btn-remove-row').forEach(btn => {
      btn.addEventListener('click', e => {
        const i = parseInt(e.target.dataset.idx);
        state.dataRows.splice(i, 1);
        renderTableRows();
        saveLocalState();
        recalculate();
      });
    });
  }

  function recalculate() {
    // 1. Calculate Theoretical Free Fall Time from Table Height
    // t_air = √(2 * Δy / g) = √(Δy_meters / 5)
    const dyMeters = state.tableHeightCm / 100.0;
    const tAir = Math.sqrt((2.0 * dyMeters) / G);
    if (els.dispAirTime) {
      els.dispAirTime.textContent = `${tAir.toFixed(3)} s`;
    }

    // 2. Empirical Curve Fit: Δx = k * √h
    // Collect valid pairs (both h > 0 and dx > 0)
    const validPairs = state.dataRows.filter(r => typeof r.h === 'number' && typeof r.dx === 'number' && r.h > 0 && r.dx > 0);

    if (validPairs.length >= 2) {
      let sumSqrtH_dx = 0;
      let sumH = 0;
      let sumDx = 0;

      validPairs.forEach(p => {
        const sqrtH = Math.sqrt(p.h);
        sumSqrtH_dx += sqrtH * p.dx;
        sumH += p.h; // (sqrt(h))² = h
        sumDx += p.dx;
      });

      const k = sumH > 0 ? (sumSqrtH_dx / sumH) : 0;
      state.k = k;

      // Compute R² (coefficient of determination)
      const meanDx = sumDx / validPairs.length;
      let ssTot = 0;
      let ssRes = 0;
      validPairs.forEach(p => {
        const pred = k * Math.sqrt(p.h);
        ssTot += Math.pow(p.dx - meanDx, 2);
        ssRes += Math.pow(p.dx - pred, 2);
      });

      const r2 = ssTot > 0 ? Math.max(0, 1 - (ssRes / ssTot)) : 1.0;
      state.r2 = r2;

      if (els.fitEquation) els.fitEquation.innerHTML = `Δx = <strong>${k.toFixed(2)}</strong> × √h`;
      if (els.fitR2) els.fitR2.textContent = `R² = ${r2.toFixed(3)}`;
    } else {
      state.k = null;
      state.r2 = null;
      if (els.fitEquation) els.fitEquation.textContent = 'Enter at least 2 data points';
      if (els.fitR2) els.fitR2.textContent = 'R² = --';
    }

    renderPlot();
  }

  function renderPlot() {
    if (!els.plotCanvas) return;
    const canvas = els.plotCanvas;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    const isDark = document.documentElement.classList.contains('theme-dark');
    const colorBg = isDark ? '#151e32' : '#ffffff';
    const colorGrid = isDark ? '#334155' : '#e2e8f0';
    const colorAxis = isDark ? '#94a3b8' : '#475569';
    const colorText = isDark ? '#f8fafc' : '#0f172a';
    const colorCurve = isDark ? '#38bdf8' : '#0284c7';
    const colorPoint = '#e11d48';
    const colorTarget = isDark ? '#c084fc' : '#7c3aed';

    // Clear background
    ctx.fillStyle = colorBg;
    ctx.fillRect(0, 0, w, h);

    const padL = 60;
    const padB = 45;
    const padT = 20;
    const padR = 25;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;

    // Bounds determination
    const validPairs = state.dataRows.filter(r => typeof r.h === 'number' && typeof r.dx === 'number' && r.h > 0 && r.dx > 0);
    let maxH = 50;
    let maxDx = 100;
    validPairs.forEach(p => {
      if (p.h > maxH) maxH = p.h;
      if (p.dx > maxDx) maxDx = p.dx;
    });

    if (typeof state.studentReleaseHeightCm === 'number' && state.studentReleaseHeightCm > maxH) {
      maxH = state.studentReleaseHeightCm * 1.15;
    }
    if (state.targetDistCm > maxDx) maxDx = state.targetDistCm * 1.15;
    maxH = Math.ceil(maxH / 10) * 10 + 10;
    maxDx = Math.ceil(maxDx / 20) * 20 + 20;

    const toX = valH => padL + (valH / maxH) * plotW;
    const toY = valDx => (h - padB) - (valDx / maxDx) * plotH;

    // Draw Grid Lines
    ctx.strokeStyle = colorGrid;
    ctx.lineWidth = 1;

    // Vertical grid
    const stepH = maxH > 100 ? 20 : 10;
    for (let gh = 0; gh <= maxH; gh += stepH) {
      const gx = toX(gh);
      ctx.beginPath();
      ctx.moveTo(gx, padT);
      ctx.lineTo(gx, h - padB);
      ctx.stroke();

      ctx.fillStyle = colorAxis;
      ctx.font = '11px SFMono-Regular, Consolas, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(gh, gx, h - padB + 16);
    }

    // Horizontal grid
    const stepDx = maxDx > 150 ? 50 : 20;
    for (let gdx = 0; gdx <= maxDx; gdx += stepDx) {
      const gy = toY(gdx);
      ctx.beginPath();
      ctx.moveTo(padL, gy);
      ctx.lineTo(w - padR, gy);
      ctx.stroke();

      ctx.fillStyle = colorAxis;
      ctx.font = '11px SFMono-Regular, Consolas, monospace';
      ctx.textAlign = 'right';
      ctx.fillText(gdx, padL - 8, gy + 4);
    }

    // Axes Lines
    ctx.strokeStyle = colorAxis;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padL, padT);
    ctx.lineTo(padL, h - padB);
    ctx.lineTo(w - padR, h - padB);
    ctx.stroke();

    // Axis Labels
    ctx.fillStyle = colorText;
    ctx.font = 'bold 12px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Release Height h on Ramp (cm)', padL + plotW / 2, h - 8);

    ctx.save();
    ctx.translate(16, padT + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('Floor Landing Range Δx (cm)', 0, 0);
    ctx.restore();

    // Draw Smooth Fitted Curve: Δx = k * √h
    if (state.k && state.k > 0) {
      ctx.strokeStyle = colorCurve;
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let ch = 0; ch <= maxH; ch += 0.5) {
        const cdx = state.k * Math.sqrt(ch);
        const px = toX(ch);
        const py = toY(cdx);
        if (ch === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    // Student's Calculated Shot Prediction Pin (Visualizes their own calculation)
    const studentH = state.studentReleaseHeightCm;
    const targetX = state.targetDistCm;
    if (typeof studentH === 'number' && studentH > 0 && targetX > 0) {
      if (studentH <= maxH && targetX <= maxDx) {
        const px = toX(studentH);
        const py = toY(targetX);

        ctx.setLineDash([5, 4]);
        ctx.strokeStyle = colorTarget;
        ctx.lineWidth = 2;

        // Vertical drop line to axis
        ctx.beginPath();
        ctx.moveTo(px, h - padB);
        ctx.lineTo(px, py);
        ctx.lineTo(padL, py);
        ctx.stroke();
        ctx.setLineDash([]);

        // Target Intersection Pin
        ctx.fillStyle = colorTarget;
        ctx.beginPath();
        ctx.arc(px, py, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = colorTarget;
        ctx.font = 'bold 11px Outfit, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`YOUR SHOT: h = ${studentH.toFixed(1)} cm`, px + 10, py - 6);
      }
    }

    // Plot Measured Data Points
    validPairs.forEach((p, idx) => {
      const px = toX(p.h);
      const py = toY(p.dx);

      ctx.fillStyle = colorPoint;
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = colorText;
      ctx.font = 'bold 10px SFMono-Regular, Consolas, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`#${idx + 1}`, px, py - 9);
    });
  }

  // Firestore Sync: Send Team Prediction to Projector Board
  function submitPrediction() {
    if (!currentUser) {
      alert('Please sign in with your @orangeusd.org Google account before submitting your prediction to the class board.');
      if (els.btnLogin) els.btnLogin.click();
      return;
    }

    if (!state.k || state.k <= 0) {
      alert('Please enter at least 2 calibration data points to establish your ramp calibration curve.');
      return;
    }

    const teamNames = els.teamInput.value.trim();
    if (!teamNames) {
      alert('Please enter your team members names so you receive credit on the leaderboard.');
      els.teamInput.focus();
      return;
    }

    if (!state.studentReleaseHeightCm || state.studentReleaseHeightCm <= 0) {
      alert("Please calculate and enter your team's predicted release height (h) before submitting to the class board.");
      if (els.inputReleaseHeight) els.inputReleaseHeight.focus();
      return;
    }

    const dyMeters = state.tableHeightCm / 100.0;
    const tAir = Math.sqrt((2.0 * dyMeters) / G);
    const email = currentUser.email || '';
    const studentId = email.split('@')[0];
    const period = parseInt(els.periodSelect.value) || 0;
    const tableNum = parseInt(els.tableSelect.value) || 1;

    const payload = {
      studentId: studentId,
      studentEmail: email,
      studentName: currentUser.displayName || studentId,
      period: period,
      tableNumber: tableNum,
      teamMembers: teamNames,
      tableHeightCm: state.tableHeightCm,
      airTimeSec: tAir,
      calibrationK: state.k,
      fitR2: state.r2,
      targetDistCm: state.targetDistCm,
      predictedReleaseHeightCm: state.studentReleaseHeightCm,
      calculationMethod: state.calculationMethod || 'curve_algebra',
      studentPredictedVx: state.studentVx ? parseFloat(state.studentVx) : null,
      isElevated: state.isElevated,
      elevationCm: state.elevationCm,
      status: 'ready_to_launch',
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    els.btnSubmitPrediction.disabled = true;
    els.submitStatus.innerHTML = '<span style="color: var(--accent-cyan);">⏳ Submitting prediction to class board...</span>';

    fbDb.collection('student_results')
      .doc('unit2_projectile_target_range')
      .collection('students')
      .doc(studentId)
      .set(payload, { merge: true })
      .then(() => {
        if (window.SoundFX) SoundFX.play('click');
        els.btnSubmitPrediction.disabled = false;
        els.submitStatus.innerHTML = `
          <span style="color: var(--accent-emerald); font-weight: 800;">
            ✓ Prediction of h = ${state.studentReleaseHeightCm} cm locked in! Call the teacher to your table for your official live drop.
          </span>
        `;
      })
      .catch(err => {
        console.error('Submission error', err);
        els.btnSubmitPrediction.disabled = false;
        els.submitStatus.innerHTML = `<span style="color: var(--accent-rose);">Error submitting: ${err.message}</span>`;
      });
  }

  function syncFromFirestore(user) {
    if (!fbDb || !user) return;
    const studentId = (user.email || '').split('@')[0];

    fbDb.collection('student_results')
      .doc('unit2_projectile_target_range')
      .collection('students')
      .doc(studentId)
      .get()
      .then(doc => {
        if (doc.exists) {
          const data = doc.data();
          if (data.teamMembers && els.teamInput) els.teamInput.value = data.teamMembers;
          if (data.tableNumber && els.tableSelect) els.tableSelect.value = data.tableNumber;
          if (data.period !== undefined && els.periodSelect) els.periodSelect.value = data.period;
          if (data.predictedReleaseHeightCm && els.inputReleaseHeight) {
            els.inputReleaseHeight.value = data.predictedReleaseHeightCm;
            state.studentReleaseHeightCm = data.predictedReleaseHeightCm;
          }
          if (data.status === 'scored') {
            els.submitStatus.innerHTML = `
              <span style="color: var(--accent-purple); font-weight: 800;">
                🎯 Official Shot Logged: Score = ${data.score || 0} pts (Ranked on class board!)
              </span>
            `;
          }
        }
      })
      .catch(err => console.warn('Sync notice', err));
  }

  // Auto-init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
