// Teacher Projector Dashboard & Competition Arena Logic
// Real-time synchronization via Cloud Firestore
// Strictly zero LaTeX notation

(function () {
  'use strict';

  const TEACHER_EMAILS = ['rmudry@orangeusd.org', 'ryan.mudry@gmail.com', 'ryanmudry@gmail.com'];
  const ASSIGNMENT_ID = 'unit2_projectile_target_range';

  let currentTeacher = null;
  let fbDb = null;
  let unsubscribeSubmissions = null;

  let activePeriod = 0;
  let universalTargetCm = 130.0;
  let tableTargets = {}; // Keyed by 'table_1', 'table_2', etc.
  let tableSubmissions = {}; // Keyed by tableNumber (1-9)
  let activeScoringTable = null;

  // DOM Elements
  const els = {};

  function init() {
    cacheElements();
    initFirebase();
    bindEvents();
    renderTargetStrip();
    renderLeaderboard();
  }

  function cacheElements() {
    els.periodTabs = document.getElementById('periodTabs');
    els.btnProjectorScale = document.getElementById('btnProjectorScale');
    els.themeToggle = document.getElementById('themeToggle');
    els.btnMute = document.getElementById('btnMute');
    els.teacherBadge = document.getElementById('teacherBadge');
    els.btnTeacherLogin = document.getElementById('btnTeacherLogin');

    els.dispTargetCm = document.getElementById('dispTargetCm');
    els.inputUniversalTarget = document.getElementById('inputUniversalTarget');
    els.btnSetTarget = document.getElementById('btnSetTarget');
    els.btnRandomizeTargets = document.getElementById('btnRandomizeTargets');

    els.targetStrip = document.getElementById('targetStrip');
    els.leaderboardBody = document.getElementById('leaderboardBody');
    els.readyCount = document.getElementById('readyCount');
    els.scoredCount = document.getElementById('scoredCount');

    // Score Modal
    els.scoreModal = document.getElementById('scoreModal');
    els.modalTableTitle = document.getElementById('modalTableTitle');
    els.modalTeamNames = document.getElementById('modalTeamNames');
    els.modalTargetDist = document.getElementById('modalTargetDist');
    els.modalPredHeight = document.getElementById('modalPredHeight');
    els.inputActualDistance = document.getElementById('inputActualDistance');
    els.btnSaveExactDistance = document.getElementById('btnSaveExactDistance');
    els.btnCloseModal = document.getElementById('btnCloseModal');
  }

  function initFirebase() {
    if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
      fbDb = firebase.firestore();
      attachConfigListener();
      firebase.auth().onAuthStateChanged(user => {
        currentTeacher = user;
        updateTeacherAuthUI();
        attachSubmissionsListener();
      });
    }
  }

  function isTeacher(user) {
    if (!user || !user.email) return false;
    const email = user.email.toLowerCase();
    return TEACHER_EMAILS.includes(email) || email === 'rmudry@orangeusd.org';
  }

  function updateTeacherAuthUI() {
    if (currentTeacher) {
      const email = currentTeacher.email || '';
      const teacherOk = isTeacher(currentTeacher);
      els.teacherBadge.textContent = teacherOk ? `👨‍🏫 ${email}` : `⚠️ ${email} (Non-Teacher)`;
      els.teacherBadge.style.display = 'inline-flex';
      els.btnTeacherLogin.textContent = 'Sign Out';
    } else {
      els.teacherBadge.style.display = 'none';
      els.btnTeacherLogin.textContent = 'Teacher Sign-In';
    }
  }

  function bindEvents() {
    // Period Tab Switching
    if (els.periodTabs) {
      els.periodTabs.querySelectorAll('.period-btn').forEach(btn => {
        btn.addEventListener('click', e => {
          els.periodTabs.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          activePeriod = parseInt(btn.dataset.period);
          tableSubmissions = {};
          attachConfigListener();
          attachSubmissionsListener();
        });
      });
    }

    // Projector Font Scaling
    if (els.btnProjectorScale) {
      els.btnProjectorScale.addEventListener('click', () => {
        const docEl = document.documentElement;
        if (docEl.classList.contains('font-projector-lg')) {
          docEl.classList.remove('font-projector-lg');
          docEl.classList.remove('font-projector');
          els.btnProjectorScale.textContent = '🖥️ Text: Normal';
        } else if (docEl.classList.contains('font-projector')) {
          docEl.classList.add('font-projector-lg');
          els.btnProjectorScale.textContent = '🖥️ Text: Giant';
        } else {
          docEl.classList.add('font-projector');
          els.btnProjectorScale.textContent = '🖥️ Text: Projector';
        }
      });
    }

    // Theme Toggle
    if (els.themeToggle) {
      els.themeToggle.addEventListener('click', () => {
        document.documentElement.classList.toggle('theme-dark');
      });
    }

    // Sound FX Mute Toggle
    if (els.btnMute) {
      els.btnMute.addEventListener('click', () => {
        const isMuted = window.SoundFX ? SoundFX.toggleMute() : false;
        els.btnMute.textContent = isMuted ? '🔇 Muted' : '🔊 Sound FX';
      });
    }

    // Teacher Login Button
    if (els.btnTeacherLogin) {
      els.btnTeacherLogin.addEventListener('click', () => {
        if (!firebase.apps.length) return;
        if (currentTeacher) {
          firebase.auth().signOut();
        } else {
          const provider = new firebase.auth.GoogleAuthProvider();
          provider.setCustomParameters({ hd: 'orangeusd.org' });
          firebase.auth().signInWithPopup(provider).catch(err => {
            alert('Sign-in error: ' + err.message);
          });
        }
      });
    }

    // Universal Target Set
    if (els.btnSetTarget && els.inputUniversalTarget) {
      els.btnSetTarget.addEventListener('click', () => {
        const val = parseFloat(els.inputUniversalTarget.value);
        if (val && val > 0) {
          universalTargetCm = val;
          els.dispTargetCm.textContent = `${val.toFixed(1)} cm`;
          broadcastTargetDistance(val);
        }
      });
    }

    // Randomize Target Distances
    if (els.btnRandomizeTargets) {
      els.btnRandomizeTargets.addEventListener('click', () => {
        if (!confirm('Assign unique, randomized target distances for Tables 1–9 to prevent copying?')) return;
        assignRandomizedTableDistances();
      });
    }

    // Close Scoring Modal
    if (els.btnCloseModal) {
      els.btnCloseModal.addEventListener('click', () => {
        els.scoreModal.classList.remove('active');
        activeScoringTable = null;
      });
    }

    // Modal Quick Score Buttons
    if (els.scoreModal) {
      els.scoreModal.querySelectorAll('.btn-score-choice').forEach(btn => {
        btn.addEventListener('click', () => {
          const resultType = btn.dataset.type;
          const points = parseInt(btn.dataset.pts);
          commitScore(resultType, points, null);
        });
      });
    }

    // Exact Distance Measurement Entry
    if (els.btnSaveExactDistance && els.inputActualDistance) {
      els.btnSaveExactDistance.addEventListener('click', () => {
        const actualCm = parseFloat(els.inputActualDistance.value);
        if (isNaN(actualCm) || actualCm <= 0) {
          alert('Please enter a valid measured distance in cm.');
          return;
        }
        const sub = tableSubmissions[activeScoringTable];
        const targetCm = (sub && sub.targetDistCm) ? sub.targetDistCm : universalTargetCm;
        const errorCm = Math.abs(actualCm - targetCm);
        let resultType = 'miss';
        let points = Math.max(20, Math.round(100 - errorCm * 4));

        if (errorCm <= 1.5) {
          resultType = 'swish';
          points = 100;
        } else if (errorCm <= 4.0) {
          resultType = 'rim';
          points = 80;
        } else if (errorCm <= 8.0) {
          resultType = 'inner';
          points = 60;
        } else if (errorCm <= 15.0) {
          resultType = 'outer';
          points = 40;
        }

        commitScore(resultType, points, actualCm, errorCm);
      });
    }
  }

  function attachSubmissionsListener() {
    if (unsubscribeSubmissions) {
      unsubscribeSubmissions();
      unsubscribeSubmissions = null;
    }

    if (!fbDb) return;

    // Listen to all student submissions for the active assignment and period
    try {
      unsubscribeSubmissions = fbDb.collection('student_results')
        .doc(ASSIGNMENT_ID)
        .collection('students')
        .where('period', '==', activePeriod)
        .onSnapshot(snapshot => {
          tableSubmissions = {};
          snapshot.forEach(doc => {
            const data = doc.data();
            const tbl = data.tableNumber || 1;
            // Retain latest submission per table
            if (!tableSubmissions[tbl] || (data.updatedAt && (!tableSubmissions[tbl].updatedAt || data.updatedAt > tableSubmissions[tbl].updatedAt))) {
              tableSubmissions[tbl] = Object.assign({ docId: doc.id }, data);
            }
          });
          updateSummaryMetrics();
          renderTargetStrip();
          renderLeaderboard();
        }, err => {
          console.warn('Firestore live listener notice (requires teacher auth to list):', err.message);
        });
    } catch (e) {
      console.warn('Could not attach listener', e);
    }
  }

  let unsubscribeConfig = null;
  function attachConfigListener() {
    if (!fbDb) return;
    try {
      if (unsubscribeConfig) unsubscribeConfig();
      unsubscribeConfig = fbDb.collection('student_results')
        .doc(ASSIGNMENT_ID)
        .onSnapshot(doc => {
          if (!doc.exists) return;
          const data = doc.data() || {};
          if (typeof data.universalTargetCm === 'number') {
            universalTargetCm = data.universalTargetCm;
            if (els.dispTargetCm) els.dispTargetCm.textContent = `${universalTargetCm.toFixed(1)} cm`;
          }
          const periodKey = `tableTargets_p${activePeriod}`;
          tableTargets = data[periodKey] || data.tableTargets || {};
          renderTargetStrip();
          renderLeaderboard();
        }, err => console.warn('Config listen notice:', err.message));
    } catch (e) {
      console.warn('Could not attach config listener', e);
    }
  }

  function broadcastTargetDistance(distanceCm) {
    if (!fbDb || !isTeacher(currentTeacher)) return;
    fbDb.collection('student_results')
      .doc(ASSIGNMENT_ID)
      .set({
        activePeriod: activePeriod,
        universalTargetCm: distanceCm,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true })
      .then(() => {
        if (window.SoundFX) SoundFX.play('click');
      })
      .catch(e => console.warn('Broadcast target notice', e));
  }

  function assignRandomizedTableDistances() {
    // Unique clean target distances between 95 cm and 165 cm
    const pool = [95.0, 105.0, 115.0, 120.0, 128.0, 135.0, 142.0, 150.0, 158.0, 165.0];
    const shuffled = pool.sort(() => Math.random() - 0.5);

    const assignments = {};
    for (let t = 1; t <= 9; t++) {
      assignments[`table_${t}`] = shuffled[t - 1];
    }

    tableTargets = assignments;

    if (fbDb && isTeacher(currentTeacher)) {
      const periodKey = `tableTargets_p${activePeriod}`;
      fbDb.collection('student_results')
        .doc(ASSIGNMENT_ID)
        .set({
          tableTargets: assignments,
          [periodKey]: assignments,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true })
        .then(() => {
          if (window.SoundFX) SoundFX.play('fanfare');
          renderTargetStrip();
          renderLeaderboard();
        });
    } else {
      renderTargetStrip();
      renderLeaderboard();
    }
  }

  function updateSummaryMetrics() {
    let ready = 0;
    let scored = 0;
    Object.values(tableSubmissions).forEach(s => {
      if (s.status === 'scored') scored++;
      else if (s.status === 'ready_to_launch') ready++;
    });
    if (els.readyCount) els.readyCount.textContent = ready;
    if (els.scoredCount) els.scoredCount.textContent = scored;
  }

  function renderTargetStrip() {
    if (!els.targetStrip) return;

    // Remove existing pins
    els.targetStrip.querySelectorAll('.table-pin').forEach(p => p.remove());

    // Center is 50%. Strip spans ±25 cm error. 1 cm error = 1.6% offset.
    const centerPct = 50;
    const pctPerCm = 1.6;

    Object.keys(tableSubmissions).forEach(tblKey => {
      const sub = tableSubmissions[tblKey];
      if (sub.status !== 'scored') return;

      const pin = document.createElement('div');
      pin.className = `table-pin ${sub.shotResult || 'miss'}`;
      pin.textContent = `T${tblKey}`;
      pin.title = `Table ${tblKey} (${sub.teamMembers || 'Team'}): ${sub.score || 0} pts`;

      let errCm = 0;
      if (typeof sub.errorCm === 'number') {
        errCm = sub.errorCm;
      } else if (sub.shotResult === 'swish') errCm = 0;
      else if (sub.shotResult === 'rim') errCm = (Math.random() > 0.5 ? 1 : -1) * 2.5;
      else if (sub.shotResult === 'inner') errCm = (Math.random() > 0.5 ? 1 : -1) * 6.0;
      else if (sub.shotResult === 'outer') errCm = (Math.random() > 0.5 ? 1 : -1) * 12.0;
      else errCm = (Math.random() > 0.5 ? 1 : -1) * 22.0;

      let posPct = centerPct + (errCm * pctPerCm);
      posPct = Math.max(5, Math.min(95, posPct));
      pin.style.left = `${posPct}%`;

      pin.addEventListener('click', () => {
        openScoringModal(parseInt(tblKey));
      });

      els.targetStrip.appendChild(pin);
    });
  }

  function renderLeaderboard() {
    if (!els.leaderboardBody) return;
    els.leaderboardBody.innerHTML = '';

    // Create entries for Tables 1 through 9
    const rows = [];
    for (let t = 1; t <= 9; t++) {
      const sub = tableSubmissions[t] || null;
      rows.push({
        tableNum: t,
        sub: sub,
        score: sub && typeof sub.score === 'number' ? sub.score : -1,
        status: sub ? sub.status : 'offline'
      });
    }

    // Sort: Scored highest points first, then Ready to Launch, then Offline
    rows.sort((a, b) => {
      if (a.score !== b.score) return b.score - a.score;
      if (a.status === 'ready_to_launch' && b.status !== 'ready_to_launch') return -1;
      if (b.status === 'ready_to_launch' && a.status !== 'ready_to_launch') return 1;
      return a.tableNum - b.tableNum;
    });

    rows.forEach((r, idx) => {
      const sub = r.sub;
      const tr = document.createElement('tr');
      tr.className = `leaderboard-row ${idx === 0 && r.score > 0 ? 'rank-1' : idx === 1 && r.score > 0 ? 'rank-2' : idx === 2 && r.score > 0 ? 'rank-3' : ''}`;

      let statusBadge = '<span style="color: var(--text-dim); font-size: 0.85rem;">⏳ Calibrating</span>';
      let predText = '--';
      let scoreText = '--';

      if (sub) {
        if (sub.predictedReleaseHeightCm) {
          predText = `h = <strong>${sub.predictedReleaseHeightCm} cm</strong>`;
        }
        if (sub.status === 'ready_to_launch') {
          statusBadge = '<span style="color: var(--accent-emerald); font-weight: 800; font-size: 0.88rem;">🚀 READY TO LAUNCH</span>';
        } else if (sub.status === 'scored') {
          statusBadge = `<span style="font-weight: 800; color: ${getOutcomeColor(sub.shotResult)};">${getOutcomeLabel(sub.shotResult)}</span>`;
          scoreText = `<span class="score-badge">${sub.score}</span> <span style="font-size: 0.75rem; color: var(--text-dim);">pts</span>`;
        }
      }

      const assignedTarget = tableTargets[`table_${r.tableNum}`] || universalTargetCm;

      tr.innerHTML = `
        <td style="width: 55px; text-align: center;">
          <div class="rank-badge">${idx + 1}</div>
        </td>
        <td>
          <div style="font-weight: 800; font-size: 1.05rem; display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
            <span>Table ${r.tableNum}</span>
            <span style="font-size: 0.72rem; font-weight: 700; color: var(--accent-cyan); background: var(--bg-card-sub); border: 1px solid var(--border-color); padding: 0.12rem 0.4rem; border-radius: 4px;">
              🎯 ${assignedTarget.toFixed(1)} cm
            </span>
          </div>
          <div style="font-size: 0.8rem; color: var(--text-dim);">${sub && sub.teamMembers ? sub.teamMembers : 'Awaiting members...'}</div>
        </td>
        <td style="font-family: var(--font-mono); font-size: 0.95rem;">
          ${predText}
        </td>
        <td>
          ${statusBadge}
        </td>
        <td style="text-align: right;">
          ${scoreText}
        </td>
        <td style="width: 120px; text-align: right;">
          <button type="button" class="btn-primary btn-score-row" data-table="${r.tableNum}" style="padding: 0.4rem 0.85rem; font-size: 0.85rem;">
            🎯 Score
          </button>
        </td>
      `;

      tr.querySelector('.btn-score-row').addEventListener('click', () => {
        openScoringModal(r.tableNum);
      });

      els.leaderboardBody.appendChild(tr);
    });
  }

  function getOutcomeLabel(type) {
    if (type === 'swish') return '🏆 Direct Swish!';
    if (type === 'rim') return '🟡 Rim Hit / Wobble';
    if (type === 'inner') return '🟢 Inner Ring';
    if (type === 'outer') return '⚪ Outer Ring';
    return '❌ Airball Miss';
  }

  function getOutcomeColor(type) {
    if (type === 'swish') return 'var(--accent-rose)';
    if (type === 'rim') return 'var(--accent-orange)';
    if (type === 'inner') return 'var(--accent-emerald)';
    if (type === 'outer') return 'var(--accent-cyan)';
    return 'var(--text-dim)';
  }

  function openScoringModal(tableNumber) {
    activeScoringTable = tableNumber;
    const sub = tableSubmissions[tableNumber] || {};
    const targetCm = (sub && sub.targetDistCm) || tableTargets[`table_${tableNumber}`] || universalTargetCm;

    if (els.modalTableTitle) els.modalTableTitle.textContent = `Score Live Drop: Table ${tableNumber}`;
    if (els.modalTeamNames) els.modalTeamNames.textContent = sub.teamMembers || 'Lab Team';
    if (els.modalTargetDist) els.modalTargetDist.textContent = `${targetCm.toFixed(1)} cm`;
    if (els.modalPredHeight) els.modalPredHeight.textContent = sub.predictedReleaseHeightCm ? `${sub.predictedReleaseHeightCm} cm` : 'Not submitted yet';
    if (els.inputActualDistance) els.inputActualDistance.value = '';

    els.scoreModal.classList.add('active');
  }

  function commitScore(resultType, points, actualCm = null, errorCm = null) {
    if (!activeScoringTable) return;
    const tbl = activeScoringTable;
    const sub = tableSubmissions[tbl];

    // Play appropriate sound effect
    if (window.SoundFX) {
      if (resultType === 'swish') {
        SoundFX.play('clink');
        setTimeout(() => SoundFX.play('fanfare'), 180);
      } else if (resultType === 'rim') {
        SoundFX.play('rim');
      } else if (resultType === 'miss') {
        SoundFX.play('buzz');
      } else {
        SoundFX.play('click');
      }
    }

    const updatePayload = {
      score: points,
      shotResult: resultType,
      actualLandingCm: actualCm,
      errorCm: errorCm,
      status: 'scored',
      scoredAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    // Update locally immediately for instant feedback
    if (!tableSubmissions[tbl]) {
      tableSubmissions[tbl] = { tableNumber: tbl, period: activePeriod };
    }
    Object.assign(tableSubmissions[tbl], updatePayload);
    updateSummaryMetrics();
    renderTargetStrip();
    renderLeaderboard();
    els.scoreModal.classList.remove('active');

    // Save to Firestore
    if (fbDb && isTeacher(currentTeacher)) {
      const docId = sub && sub.docId ? sub.docId : `table_${tbl}_p${activePeriod}`;
      fbDb.collection('student_results')
        .doc(ASSIGNMENT_ID)
        .collection('students')
        .doc(docId)
        .set(Object.assign({ tableNumber: tbl, period: activePeriod }, updatePayload), { merge: true })
        .catch(err => console.error('Error committing score to Firestore', err));
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
