// Student Workbench Application Logic
// Projectile Target Range: Empirical Graph Reading & Target Interpolation
// Round-Based Accuracy Scoring System: 3 Rounds (0–10 pts each, Max 30 pts) + Tie-Breaker Round 4
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
    currentActiveRound: 1, // Synced with teacher
    viewingRound: 1, // Currently viewed/edited round (1, 2, 3, or 4)
    rounds: {
      1: { targetDistCm: 110.0, studentReleaseHeightCm: '', score: null, shotResult: null, status: 'active' },
      2: { targetDistCm: 130.0, studentReleaseHeightCm: '', score: null, shotResult: null, status: 'upcoming' },
      3: { targetDistCm: 150.0, studentReleaseHeightCm: '', score: null, shotResult: null, status: 'upcoming' },
      4: { targetDistCm: 165.0, studentReleaseHeightCm: '', score: null, shotResult: null, status: 'if_needed' }
    },
    totalScore: 0,
    tieBreakerScore: null,
    elevationCm: 0.0,
    isElevated: false,
    k: null
  };

  let currentUser = null;
  let fbDb = null;
  let hoverInspector = null; // { h, dx, hCurve }
  let assignmentConfigData = null;

  // DOM Elements Cache
  const els = {};

  function init() {
    cacheElements();
    initFirebase();
    loadLocalState();
    bindEvents();
    recalculate();
    updateScorecardUI();
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
    els.graphStatusMsg = document.getElementById('graphStatusMsg');

    els.plotCanvas = document.getElementById('plotCanvas');
    els.readoutValues = document.getElementById('readoutValues');

    // Round Scorecard Elements
    els.studentActiveRoundBadge = document.getElementById('studentActiveRoundBadge');
    els.roundStatusSubtitle = document.getElementById('roundStatusSubtitle');
    els.studentTotalScore = document.getElementById('studentTotalScore');
    els.studentTbScorePill = document.getElementById('studentTbScorePill');

    els.cards = {
      1: document.getElementById('cardRound1'),
      2: document.getElementById('cardRound2'),
      3: document.getElementById('cardRound3'),
      4: document.getElementById('cardRound4')
    };

    els.scPts = {
      1: document.getElementById('scPtsR1'),
      2: document.getElementById('scPtsR2'),
      3: document.getElementById('scPtsR3'),
      4: document.getElementById('scPtsR4')
    };

    els.scTarget = {
      1: document.getElementById('scTargetR1'),
      2: document.getElementById('scTargetR2'),
      3: document.getElementById('scTargetR3'),
      4: document.getElementById('scTargetR4')
    };

    els.scPred = {
      1: document.getElementById('scPredR1'),
      2: document.getElementById('scPredR2'),
      3: document.getElementById('scPredR3'),
      4: document.getElementById('scPredR4')
    };

    els.scStatus = {
      1: document.getElementById('scStatusR1'),
      2: document.getElementById('scStatusR2'),
      3: document.getElementById('scStatusR3'),
      4: document.getElementById('scStatusR4')
    };

    // Step 4 Form Inputs
    els.labelTargetDist = document.getElementById('labelTargetDist');
    els.inputTargetDist = document.getElementById('inputTargetDist');
    els.assignedTargetBadge = document.getElementById('assignedTargetBadge');
    els.labelReleaseHeight = document.getElementById('labelReleaseHeight');
    els.inputReleaseHeight = document.getElementById('inputReleaseHeight');
    els.graphFeedbackMsg = document.getElementById('graphFeedbackMsg');

    els.chkElevation = document.getElementById('chkElevation');
    els.wrapElevation = document.getElementById('wrapElevation');
    els.inputElevation = document.getElementById('inputElevation');

    els.btnSubmitPrediction = document.getElementById('btnSubmitPrediction');
    els.submitStatus = document.getElementById('submitStatus');

    els.themeToggle = document.getElementById('themeToggle');
    els.userBadge = document.getElementById('userBadge');
    els.btnLogin = document.getElementById('btnLogin');
  }

  function initFirebase() {
    if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
      fbDb = firebase.firestore();
      listenToAssignmentConfig();
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
        if (!state.rounds) {
          state.rounds = {
            1: { targetDistCm: 110.0, studentReleaseHeightCm: '', score: null, shotResult: null, status: 'active' },
            2: { targetDistCm: 130.0, studentReleaseHeightCm: '', score: null, shotResult: null, status: 'upcoming' },
            3: { targetDistCm: 150.0, studentReleaseHeightCm: '', score: null, shotResult: null, status: 'upcoming' },
            4: { targetDistCm: 165.0, studentReleaseHeightCm: '', score: null, shotResult: null, status: 'if_needed' }
          };
        }
      }
    } catch (e) {
      console.warn('Could not load local state', e);
    }

    // Populate UI from state
    if (els.periodSelect) els.periodSelect.value = state.period;
    if (els.tableSelect) els.tableSelect.value = state.tableNum;
    if (els.teamInput) els.teamInput.value = state.teamMembers || '';
    if (els.inputTableHeight) els.inputTableHeight.value = state.tableHeightCm;
    if (els.chkElevation) els.chkElevation.checked = state.isElevated;
    if (els.wrapElevation) els.wrapElevation.style.display = state.isElevated ? 'flex' : 'none';
    if (els.inputElevation) els.inputElevation.value = state.elevationCm;

    selectViewingRound(state.viewingRound || 1);
    renderTableRows();
  }

  function saveLocalState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {}
  }

  function selectViewingRound(rNum) {
    state.viewingRound = Math.max(1, Math.min(4, rNum));
    const r = state.viewingRound;
    if (!state.rounds[r]) {
      state.rounds[r] = { targetDistCm: 120.0, studentReleaseHeightCm: '', score: null, shotResult: null, status: 'upcoming' };
    }

    const rData = state.rounds[r];

    // Update form inputs for this round
    if (els.inputTargetDist) {
      els.inputTargetDist.value = rData.targetDistCm || '';
    }
    if (els.inputReleaseHeight) {
      els.inputReleaseHeight.value = rData.studentReleaseHeightCm !== undefined && rData.studentReleaseHeightCm !== '' ? rData.studentReleaseHeightCm : '';
    }

    // Update badges and labels
    const rTitle = r === 4 ? '🏆 Tie-Breaker (Round 4)' : `Round ${r} of 3`;
    if (els.studentActiveRoundBadge) {
      els.studentActiveRoundBadge.textContent = `🎯 ${rTitle}`;
      els.studentActiveRoundBadge.className = `round-status-badge ${r === 4 ? 'round-badge-tb' : 'round-badge-active'}`;
    }

    if (els.btnSubmitPrediction) {
      const isTB = r === 4;
      els.btnSubmitPrediction.textContent = `🚀 Lock In & Submit ${isTB ? 'Tie-Breaker' : `Round ${r}`} Prediction to Class Board`;
    }

    updateScorecardUI();
    renderPlot();
  }

  function updateScorecardUI() {
    let total = 0;
    let hasAnyScore = false;

    for (let r = 1; r <= 4; r++) {
      const rData = state.rounds[r] || { targetDistCm: '--', studentReleaseHeightCm: '', score: null };
      const card = els.cards[r];
      if (!card) continue;

      card.classList.toggle('active', r === state.viewingRound);
      const isScored = typeof rData.score === 'number';
      card.classList.toggle('scored', isScored);

      // Points badge
      if (els.scPts[r]) {
        els.scPts[r].textContent = isScored ? `${rData.score} / 10` : '-- / 10';
      }

      // Target readout
      if (els.scTarget[r]) {
        const tVal = typeof rData.targetDistCm === 'number' ? `${rData.targetDistCm.toFixed(1)} cm` : '-- cm';
        els.scTarget[r].textContent = `Δx: ${tVal}`;
      }

      // Prediction readout
      if (els.scPred[r]) {
        const pVal = rData.studentReleaseHeightCm ? `${rData.studentReleaseHeightCm} cm` : '-- cm';
        els.scPred[r].textContent = `h: ${pVal}`;
      }

      // Status
      if (els.scStatus[r]) {
        if (isScored) {
          els.scStatus[r].textContent = `✓ Scored (${rData.score} pts)`;
        } else if (rData.status === 'ready_to_launch') {
          els.scStatus[r].textContent = '🚀 Ready to Launch';
        } else if (r === state.currentActiveRound) {
          els.scStatus[r].textContent = 'Active Round';
        } else if (r === 4) {
          els.scStatus[r].textContent = 'If Needed';
        } else {
          els.scStatus[r].textContent = 'Upcoming';
        }
      }

      // Tally total score (R1 + R2 + R3, max 30)
      if (r <= 3 && isScored) {
        total += rData.score;
        hasAnyScore = true;
      }
    }

    state.totalScore = total;
    if (els.studentTotalScore) {
      els.studentTotalScore.textContent = total;
    }

    // Tie-breaker pill
    if (els.studentTbScorePill) {
      const tbData = state.rounds[4];
      if (tbData && typeof tbData.score === 'number') {
        els.studentTbScorePill.textContent = `TB: ${tbData.score}/10`;
        els.studentTbScorePill.style.display = 'inline-block';
      } else {
        els.studentTbScorePill.style.display = 'none';
      }
    }

    // Update active round subtitle / scored notification
    const activeData = state.rounds[state.viewingRound];
    if (activeData && typeof activeData.score === 'number' && els.submitStatus) {
      els.submitStatus.innerHTML = `
        <span style="color: var(--accent-purple); font-weight: 800;">
          🎯 Round ${state.viewingRound === 4 ? 'Tie-Breaker' : state.viewingRound} Scored: <strong>${activeData.score} / 10 pts</strong>! Total Score: <strong>${total} / 30 pts</strong>.
        </span>
      `;
    }
  }

  function bindEvents() {
    if (els.periodSelect) els.periodSelect.addEventListener('change', () => {
      state.period = parseInt(els.periodSelect.value) || 0;
      saveLocalState();
      updateTargetFromConfig();
    });

    if (els.tableSelect) els.tableSelect.addEventListener('change', () => {
      state.tableNum = parseInt(els.tableSelect.value) || 1;
      saveLocalState();
      updateTargetFromConfig();
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

    // Scorecard Round Click Events
    for (let r = 1; r <= 4; r++) {
      const card = els.cards[r];
      if (card) {
        card.addEventListener('click', () => {
          selectViewingRound(r);
        });
      }
    }

    if (els.inputTargetDist) els.inputTargetDist.addEventListener('input', () => {
      const val = parseFloat(els.inputTargetDist.value) || 0;
      const r = state.viewingRound;
      if (!state.rounds[r]) state.rounds[r] = {};
      state.rounds[r].targetDistCm = val;
      updateScorecardUI();
      saveLocalState();
      renderPlot();
    });

    if (els.inputReleaseHeight) els.inputReleaseHeight.addEventListener('input', () => {
      const val = els.inputReleaseHeight.value === '' ? '' : parseFloat(els.inputReleaseHeight.value);
      const r = state.viewingRound;
      if (!state.rounds[r]) state.rounds[r] = {};
      state.rounds[r].studentReleaseHeightCm = val;
      updateScorecardUI();
      saveLocalState();
      renderPlot();
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

    // Interactive Graph Inspector (Pointer / Touch)
    if (els.plotCanvas) {
      const handlePointer = e => {
        const rect = els.plotCanvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        updateInspectorAt(x, y, rect.width, rect.height);
      };

      els.plotCanvas.addEventListener('mousemove', handlePointer);
      els.plotCanvas.addEventListener('touchmove', handlePointer, { passive: true });

      const clearInspector = () => {
        hoverInspector = null;
        if (els.readoutValues) {
          els.readoutValues.textContent = 'Hover or tap curve to trace values';
        }
        renderPlot();
      };

      els.plotCanvas.addEventListener('mouseleave', clearInspector);
      els.plotCanvas.addEventListener('touchend', clearInspector);
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

    // 2. Compute smooth empirical curve connecting data points
    const validPairs = state.dataRows.filter(r => typeof r.h === 'number' && typeof r.dx === 'number' && r.h > 0 && r.dx > 0);

    if (validPairs.length >= 2) {
      let sumSqrtH_dx = 0;
      let sumH = 0;

      validPairs.forEach(p => {
        const sqrtH = Math.sqrt(p.h);
        sumSqrtH_dx += sqrtH * p.dx;
        sumH += p.h; // (sqrt(h))² = h
      });

      state.k = sumH > 0 ? (sumSqrtH_dx / sumH) : 0;

      if (els.graphStatusMsg) {
        els.graphStatusMsg.innerHTML = `
          <span style="color: var(--accent-emerald);">✓ Calibration curve ready</span> (${validPairs.length} trials plotted). Trace from target distance Δx over to your curve to read release height h!
        `;
      }
    } else {
      state.k = null;
      if (els.graphStatusMsg) {
        els.graphStatusMsg.textContent = 'Enter at least 2 data points to generate your calibration curve.';
      }
    }

    renderPlot();
  }

  function getCurrentRoundTarget() {
    const r = state.viewingRound;
    const rData = state.rounds[r];
    return (rData && typeof rData.targetDistCm === 'number') ? rData.targetDistCm : 110.0;
  }

  function getCurrentRoundStudentH() {
    const r = state.viewingRound;
    const rData = state.rounds[r];
    return (rData && typeof rData.studentReleaseHeightCm === 'number') ? rData.studentReleaseHeightCm : null;
  }

  function getPlotBounds(w, h) {
    const padL = 60;
    const padB = 45;
    const padT = 20;
    const padR = 25;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;

    const validPairs = state.dataRows.filter(r => typeof r.h === 'number' && typeof r.dx === 'number' && r.h > 0 && r.dx > 0);
    let maxH = 50;
    let maxDx = 100;
    validPairs.forEach(p => {
      if (p.h > maxH) maxH = p.h;
      if (p.dx > maxDx) maxDx = p.dx;
    });

    const studentH = getCurrentRoundStudentH();
    const targetX = getCurrentRoundTarget();

    if (typeof studentH === 'number' && studentH > maxH) {
      maxH = studentH * 1.15;
    }
    if (targetX > maxDx) maxDx = targetX * 1.15;
    maxH = Math.ceil(maxH / 10) * 10 + 10;
    maxDx = Math.ceil(maxDx / 20) * 20 + 20;

    return { padL, padB, padT, padR, plotW, plotH, maxH, maxDx };
  }

  function updateInspectorAt(px, py, w, h) {
    const b = getPlotBounds(w, h);
    if (px < b.padL || px > w - b.padR || py < b.padT || py > h - b.padB) {
      hoverInspector = null;
      renderPlot();
      return;
    }

    const valH = ((px - b.padL) / b.plotW) * b.maxH;
    const valDx = ((h - b.padB - py) / b.plotH) * b.maxDx;

    let hOnCurve = null;
    if (state.k && state.k > 0) {
      hOnCurve = Math.pow(valDx / state.k, 2);
    }

    hoverInspector = {
      h: Math.max(0, valH),
      dx: Math.max(0, valDx),
      hCurve: hOnCurve
    };

    if (els.readoutValues) {
      if (hOnCurve !== null && hOnCurve > 0) {
        els.readoutValues.innerHTML = `Target Distance: <strong>Δx = ${valDx.toFixed(1)} cm</strong> ➔ Ramp Height: <strong>h ≈ ${hOnCurve.toFixed(1)} cm</strong>`;
      } else {
        els.readoutValues.innerHTML = `Cursor: h = ${valH.toFixed(1)} cm, Δx = ${valDx.toFixed(1)} cm`;
      }
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
    const colorInspector = isDark ? '#facc15' : '#d97706';

    // Clear background
    ctx.fillStyle = colorBg;
    ctx.fillRect(0, 0, w, h);

    const b = getPlotBounds(w, h);
    const toX = valH => b.padL + (valH / b.maxH) * b.plotW;
    const toY = valDx => (h - b.padB) - (valDx / b.maxDx) * b.plotH;

    // Draw Grid Lines (Crisp Graph Paper Style)
    ctx.strokeStyle = colorGrid;
    ctx.lineWidth = 1;

    // Vertical grid
    const stepH = b.maxH > 100 ? 20 : 10;
    for (let gh = 0; gh <= b.maxH; gh += stepH) {
      const gx = toX(gh);
      ctx.beginPath();
      ctx.moveTo(gx, b.padT);
      ctx.lineTo(gx, h - b.padB);
      ctx.stroke();

      ctx.fillStyle = colorAxis;
      ctx.font = '11px SFMono-Regular, Consolas, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(gh, gx, h - b.padB + 16);
    }

    // Horizontal grid
    const stepDx = b.maxDx > 150 ? 50 : 20;
    for (let gdx = 0; gdx <= b.maxDx; gdx += stepDx) {
      const gy = toY(gdx);
      ctx.beginPath();
      ctx.moveTo(b.padL, gy);
      ctx.lineTo(w - b.padR, gy);
      ctx.stroke();

      ctx.fillStyle = colorAxis;
      ctx.font = '11px SFMono-Regular, Consolas, monospace';
      ctx.textAlign = 'right';
      ctx.fillText(gdx, b.padL - 8, gy + 4);
    }

    // Axes Lines
    ctx.strokeStyle = colorAxis;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(b.padL, b.padT);
    ctx.lineTo(b.padL, h - b.padB);
    ctx.lineTo(w - b.padR, h - b.padB);
    ctx.stroke();

    // Axis Labels
    ctx.fillStyle = colorText;
    ctx.font = 'bold 12px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Ramp Release Height h (cm)', b.padL + b.plotW / 2, h - 8);

    ctx.save();
    ctx.translate(16, b.padT + b.plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('Floor Landing Range Δx (cm)', 0, 0);
    ctx.restore();

    // Draw Smooth Fitted Empirical Curve
    if (state.k && state.k > 0) {
      ctx.strokeStyle = colorCurve;
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let ch = 0; ch <= b.maxH; ch += 0.5) {
        const cdx = state.k * Math.sqrt(ch);
        const px = toX(ch);
        const py = toY(cdx);
        if (ch === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    // Interactive Hover/Touch Inspector Crosshairs
    if (hoverInspector && hoverInspector.hCurve !== null && hoverInspector.hCurve <= b.maxH) {
      const cPx = toX(hoverInspector.hCurve);
      const cPy = toY(hoverInspector.dx);

      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = colorInspector;
      ctx.lineWidth = 1.5;

      // Horizontal line from Δx axis to curve
      ctx.beginPath();
      ctx.moveTo(b.padL, cPy);
      ctx.lineTo(cPx, cPy);
      // Vertical line down to h axis
      ctx.lineTo(cPx, h - b.padB);
      ctx.stroke();
      ctx.setLineDash([]);

      // Point on curve
      ctx.fillStyle = colorInspector;
      ctx.beginPath();
      ctx.arc(cPx, cPy, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Target Distance (Δx) Horizontal Reference Line for viewingRound
    const targetX = getCurrentRoundTarget();
    let expectedH = null;
    if (state.k && state.k > 0 && targetX > 0) {
      expectedH = Math.pow(targetX / state.k, 2);
    }

    if (typeof targetX === 'number' && targetX > 0 && targetX <= b.maxDx) {
      const targetY = toY(targetX);

      // Horizontal dashed guide from Δx axis across the plot
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = colorTarget;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(b.padL, targetY);
      ctx.lineTo(w - b.padR, targetY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Label at right edge
      const rNum = state.viewingRound;
      const rTag = rNum === 4 ? 'Tie-Breaker' : `R${rNum}`;
      ctx.fillStyle = colorTarget;
      ctx.font = 'bold 11px Outfit, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${rTag} Target Δx = ${targetX.toFixed(1)} cm`, w - b.padR - 4, targetY - 6);

      // If curve intersects within bounds, draw a guide indicator on the curve
      if (expectedH !== null && expectedH <= b.maxH) {
        const cPx = toX(expectedH);
        ctx.fillStyle = colorTarget;
        ctx.beginPath();
        ctx.arc(cPx, targetY, 4, 0, Math.PI * 2);
        ctx.fill();

        // Faint drop line to h axis
        ctx.setLineDash([2, 4]);
        ctx.strokeStyle = colorTarget;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cPx, targetY);
        ctx.lineTo(cPx, h - b.padB);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // Student's Entered Release Height Prediction Pin for viewingRound
    const studentH = getCurrentRoundStudentH();
    if (typeof studentH === 'number' && studentH > 0 && targetX > 0) {
      if (studentH <= b.maxH && targetX <= b.maxDx) {
        const px = toX(studentH);
        const py = toY(targetX);

        ctx.setLineDash([5, 4]);
        ctx.strokeStyle = colorTarget;
        ctx.lineWidth = 2;

        // Vertical drop line from pin to axis
        ctx.beginPath();
        ctx.moveTo(px, h - b.padB);
        ctx.lineTo(px, py);
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

    // Dynamic Live Feedback: Verifies Student Graph Reading
    if (els.graphFeedbackMsg) {
      if (typeof studentH === 'number' && studentH > 0 && targetX > 0) {
        if (expectedH !== null) {
          const diff = Math.abs(studentH - expectedH);
          if (diff <= 1.0) {
            els.graphFeedbackMsg.innerHTML = `
              <span style="color: var(--accent-emerald); font-weight: 800;">✓ Excellent graph reading!</span>
              Your prediction pin at <strong>h = ${studentH.toFixed(1)} cm</strong> lands directly on your calibration curve for <strong>Δx = ${targetX.toFixed(1)} cm</strong>.
            `;
          } else if (diff <= 3.0) {
            els.graphFeedbackMsg.innerHTML = `
              <span style="color: var(--accent-cyan); font-weight: 800;">≈ Close alignment!</span>
              Your pin is at <strong>h = ${studentH.toFixed(1)} cm</strong> (the curve crosses Δx = ${targetX.toFixed(1)} cm at <strong>h ≈ ${expectedH.toFixed(1)} cm</strong>). Double check your grid reading before launching.
            `;
          } else {
            els.graphFeedbackMsg.innerHTML = `
              <span style="color: var(--accent-rose); font-weight: 800;">⚠️ Check your graph reading:</span>
              Your pin at <strong>h = ${studentH.toFixed(1)} cm</strong> does not sit on the curve. Tracing across from Δx = ${targetX.toFixed(1)} cm gives <strong>h ≈ ${expectedH.toFixed(1)} cm</strong>. Check your horizontal axis scale!
            `;
          }
        } else {
          els.graphFeedbackMsg.innerHTML = `
            Target: <strong>Δx = ${targetX.toFixed(1)} cm</strong>, Your Release Height: <strong>h = ${studentH.toFixed(1)} cm</strong>. Plot at least 2 calibration points to display your curve.
          `;
        }
      } else {
        els.graphFeedbackMsg.innerHTML = `
          As you type your release height, watch your graph! Your team's prediction pin will appear at <strong>(h, Δx)</strong> with dashed guide lines. If your point sits directly on your curve, your reading is accurate and ready for launch!
        `;
      }
    }

    // Plot Measured Data Points
    const validPairs = state.dataRows.filter(r => typeof r.h === 'number' && typeof r.dx === 'number' && r.h > 0 && r.dx > 0);
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

    const validPairs = state.dataRows.filter(r => typeof r.h === 'number' && typeof r.dx === 'number' && r.h > 0 && r.dx > 0);
    if (validPairs.length < 2) {
      alert('Please enter at least 2 calibration data points to plot your ramp curve.');
      return;
    }

    const teamNames = els.teamInput.value.trim();
    if (!teamNames) {
      alert('Please enter your team members names so you receive credit on the leaderboard.');
      els.teamInput.focus();
      return;
    }

    const r = state.viewingRound;
    const rData = state.rounds[r] || {};
    const predH = rData.studentReleaseHeightCm;
    const targetDist = rData.targetDistCm;

    if (!predH || predH <= 0) {
      alert(`Please read and enter your team's predicted release height (h) for Round ${r === 4 ? 'Tie-Breaker' : r} from your graph before submitting.`);
      if (els.inputReleaseHeight) els.inputReleaseHeight.focus();
      return;
    }

    const dyMeters = state.tableHeightCm / 100.0;
    const tAir = Math.sqrt((2.0 * dyMeters) / G);
    const email = currentUser.email || '';
    const studentId = email.split('@')[0];
    const period = parseInt(els.periodSelect.value) || 0;
    const tableNum = parseInt(els.tableSelect.value) || 1;

    // Update round status locally
    rData.status = 'ready_to_launch';
    state.rounds[r] = rData;
    updateScorecardUI();

    const payload = {
      studentId: studentId,
      studentEmail: email,
      studentName: currentUser.displayName || studentId,
      period: period,
      tableNumber: tableNum,
      teamMembers: teamNames,
      tableHeightCm: state.tableHeightCm,
      airTimeSec: tAir,
      currentRound: r,
      rounds: state.rounds,
      targetDistCm: targetDist,
      predictedReleaseHeightCm: predH,
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
        const rName = r === 4 ? 'Tie-Breaker' : `Round ${r}`;
        els.submitStatus.innerHTML = `
          <span style="color: var(--accent-emerald); font-weight: 800;">
            ✓ ${rName} Prediction of h = ${predH} cm locked in! Call the teacher to Table ${tableNum} for your live drop.
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
        if (!doc.exists) return;
        const data = doc.data();
        if (data.teamMembers && els.teamInput) {
          els.teamInput.value = data.teamMembers;
          state.teamMembers = data.teamMembers;
        }
        if (data.tableNumber && els.tableSelect) {
          els.tableSelect.value = data.tableNumber;
          state.tableNum = data.tableNumber;
        }
        if (data.period !== undefined && els.periodSelect) {
          els.periodSelect.value = data.period;
          state.period = data.period;
        }

        if (data.rounds && typeof data.rounds === 'object') {
          for (let r = 1; r <= 4; r++) {
            if (data.rounds[r]) {
              state.rounds[r] = Object.assign(state.rounds[r] || {}, data.rounds[r]);
            } else if (data.rounds[String(r)]) {
              state.rounds[r] = Object.assign(state.rounds[r] || {}, data.rounds[String(r)]);
            }
          }
        }

        updateScorecardUI();
        selectViewingRound(state.viewingRound || 1);
      })
      .catch(err => console.warn('Sync notice', err));
  }

  let unsubscribeConfig = null;

  function updateTargetFromConfig() {
    if (!assignmentConfigData) return;

    // Check if teacher switched active round
    if (typeof assignmentConfigData.currentRound === 'number' && assignmentConfigData.currentRound >= 1 && assignmentConfigData.currentRound <= 4) {
      if (assignmentConfigData.currentRound !== state.currentActiveRound) {
        state.currentActiveRound = assignmentConfigData.currentRound;
        selectViewingRound(state.currentActiveRound);
      }
    }

    const r = state.viewingRound;
    const roundTargets = assignmentConfigData.roundTargets || {};
    const periodTargetsKey = `tableTargets_p${state.period}`;
    const periodTargets = assignmentConfigData[periodTargetsKey] || assignmentConfigData.tableTargets || {};

    const specificKey = `p${state.period}_r${r}_table_${state.tableNum}`;
    const roundKey = `r${r}_table_${state.tableNum}`;
    const genericKey = `table_${state.tableNum}`;

    let assigned = null;
    if (typeof periodTargets[specificKey] === 'number') {
      assigned = periodTargets[specificKey];
    } else if (typeof periodTargets[roundKey] === 'number') {
      assigned = periodTargets[roundKey];
    } else if (r === state.currentActiveRound && typeof periodTargets[genericKey] === 'number') {
      assigned = periodTargets[genericKey];
    } else if (typeof roundTargets[r] === 'number') {
      assigned = roundTargets[r];
    } else if (typeof assignmentConfigData.universalTargetCm === 'number') {
      assigned = assignmentConfigData.universalTargetCm;
    }

    if (assigned !== null) {
      if (!state.rounds[r]) state.rounds[r] = {};
      state.rounds[r].targetDistCm = assigned;
      if (els.inputTargetDist) els.inputTargetDist.value = assigned;
      if (els.assignedTargetBadge) {
        const rName = r === 4 ? 'Tie-Breaker' : `R${r}`;
        els.assignedTargetBadge.textContent = `🎯 ${rName} Table ${state.tableNum} Target: ${assigned.toFixed(1)} cm`;
        els.assignedTargetBadge.style.color = 'var(--accent-emerald)';
      }
      updateScorecardUI();
      saveLocalState();
      renderPlot();
    }
  }

  function listenToAssignmentConfig() {
    if (!fbDb) return;
    try {
      if (unsubscribeConfig) unsubscribeConfig();
      unsubscribeConfig = fbDb.collection('student_results')
        .doc('unit2_projectile_target_range')
        .onSnapshot(doc => {
          if (!doc.exists) return;
          assignmentConfigData = doc.data() || {};
          updateTargetFromConfig();
        }, err => console.warn('Config listen notice', err));
    } catch (e) {
      console.warn('Error listening to assignment config', e);
    }
  }

  // Auto-init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
