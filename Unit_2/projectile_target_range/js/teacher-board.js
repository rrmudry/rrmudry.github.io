// Teacher Projector Dashboard & Competition Arena Logic
// Round-Based Accuracy Scoring System: 3 Rounds (0–10 pts each, Max 30 pts) + Tie-Breaker Round 4
// Real-time synchronization via Cloud Firestore
// Strictly zero LaTeX notation

(function () {
  'use strict';

  const TEACHER_EMAILS = ['rmudry@orangeusd.org', 'ryan.mudry@gmail.com', 'ryanmudry@gmail.com'];
  const ASSIGNMENT_ID = 'unit2_projectile_target_range';

  let currentTeacher = null;
  let fbDb = null;
  let unsubscribeSubmissions = null;
  let unsubscribeConfig = null;

  let activePeriod = 0;
  let currentRound = 1; // 1, 2, 3, or 4 (Tie-Breaker)
  let roundTargets = {
    1: 110.0,
    2: 130.0,
    3: 150.0,
    4: 165.0
  };
  let tableTargets = {}; // Keyed by 'p{period}_r{round}_table_{tableNum}' or 'table_{t}'
  let tableSubmissions = {}; // Keyed by tableNumber (1-9)
  let activeScoringTable = null;
  let activeScoringRound = 1;

  // DOM Elements
  const els = {};

  function init() {
    cacheElements();
    initFirebase();
    bindEvents();
    updateRoundUI();
    renderTargetStrip();
    renderLeaderboard();
  }

  function cacheElements() {
    els.periodTabs = document.getElementById('periodTabs');
    els.roundTabs = document.getElementById('roundTabs');
    els.btnPrevRound = document.getElementById('btnPrevRound');
    els.btnNextRound = document.getElementById('btnNextRound');
    els.dispActiveRoundLabel = document.getElementById('dispActiveRoundLabel');
    els.radarRoundLabel = document.getElementById('radarRoundLabel');

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

    // Column headers
    els.thRound1 = document.getElementById('thRound1');
    els.thRound2 = document.getElementById('thRound2');
    els.thRound3 = document.getElementById('thRound3');
    els.thRound4 = document.getElementById('thRound4');

    // Score Modal
    els.scoreModal = document.getElementById('scoreModal');
    els.modalTableTitle = document.getElementById('modalTableTitle');
    els.modalTeamNames = document.getElementById('modalTeamNames');
    els.modalRoundTabs = document.getElementById('modalRoundTabs');
    els.modalTargetDist = document.getElementById('modalTargetDist');
    els.modalPredHeight = document.getElementById('modalPredHeight');
    els.modalCurrentScoreBadge = document.getElementById('modalCurrentScoreBadge');
    els.score10Grid = document.getElementById('score10Grid');
    els.inputActualDistance = document.getElementById('inputActualDistance');
    els.calcPreview = document.getElementById('calcPreview');
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

  function calculateAccuracyPoints(errorCm) {
    if (errorCm <= 1.5) return 10;
    if (errorCm <= 3.5) return 9;
    if (errorCm <= 6.0) return 8;
    if (errorCm <= 9.0) return 7;
    if (errorCm <= 12.0) return 6;
    if (errorCm <= 16.0) return 5;
    if (errorCm <= 20.0) return 4;
    if (errorCm <= 25.0) return 3;
    if (errorCm <= 30.0) return 2;
    if (errorCm <= 35.0) return 1;
    return 0;
  }

  function getShotResultClassification(points) {
    if (points >= 10) return 'swish';
    if (points >= 8) return 'rim';
    if (points >= 5) return 'inner';
    if (points >= 2) return 'outer';
    return 'miss';
  }

  function bindEvents() {
    // Period Tab Switching
    if (els.periodTabs) {
      els.periodTabs.querySelectorAll('.period-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          els.periodTabs.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          activePeriod = parseInt(btn.dataset.period);
          tableSubmissions = {};
          attachConfigListener();
          attachSubmissionsListener();
        });
      });
    }

    // Round Selector Tabs
    if (els.roundTabs) {
      els.roundTabs.querySelectorAll('.round-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const r = parseInt(btn.dataset.round);
          switchRound(r, true);
        });
      });
    }

    // Previous / Next Round Buttons
    if (els.btnPrevRound) {
      els.btnPrevRound.addEventListener('click', () => {
        if (currentRound > 1) {
          switchRound(currentRound - 1, true);
        }
      });
    }
    if (els.btnNextRound) {
      els.btnNextRound.addEventListener('click', () => {
        if (currentRound < 4) {
          switchRound(currentRound + 1, true);
        }
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
        renderTargetStrip();
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

    // Universal Round Target Set
    if (els.btnSetTarget && els.inputUniversalTarget) {
      els.btnSetTarget.addEventListener('click', () => {
        const val = parseFloat(els.inputUniversalTarget.value);
        if (val && val > 0) {
          roundTargets[currentRound] = val;
          els.dispTargetCm.textContent = `${val.toFixed(1)} cm`;
          broadcastTargetDistance(val);
        }
      });
    }

    // Randomize Target Distances for Active Round
    if (els.btnRandomizeTargets) {
      els.btnRandomizeTargets.addEventListener('click', () => {
        const rName = currentRound === 4 ? 'Tie-Breaker' : `Round ${currentRound}`;
        if (!confirm(`Assign unique, randomized target distances for Tables 1–9 for ${rName}?`)) return;
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

    // Modal Round Tabs
    if (els.modalRoundTabs) {
      els.modalRoundTabs.querySelectorAll('.modal-round-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const r = parseInt(btn.dataset.mround);
          selectModalScoringRound(r);
        });
      });
    }

    // Modal 0–10 Point Button Grid Click
    if (els.score10Grid) {
      els.score10Grid.querySelectorAll('.btn-acc-score').forEach(btn => {
        btn.addEventListener('click', () => {
          const pts = parseInt(btn.dataset.pts);
          const resultType = getShotResultClassification(pts);
          commitScore(pts, resultType, null, null);
        });
      });
    }

    // Live Calculation Preview for Exact Landing Distance Entry
    if (els.inputActualDistance) {
      els.inputActualDistance.addEventListener('input', () => {
        const actualCm = parseFloat(els.inputActualDistance.value);
        if (isNaN(actualCm) || actualCm <= 0) {
          if (els.calcPreview) els.calcPreview.textContent = '';
          return;
        }
        const targetCm = getTableTarget(activeScoringTable, activeScoringRound);
        const errorCm = Math.abs(actualCm - targetCm);
        const pts = calculateAccuracyPoints(errorCm);
        if (els.calcPreview) {
          els.calcPreview.innerHTML = `Error: <strong>Δx = ${errorCm.toFixed(1)} cm</strong> ➔ <strong>${pts} / 10 pts</strong>`;
        }
      });
    }

    // Exact Distance Measurement Entry Commit
    if (els.btnSaveExactDistance && els.inputActualDistance) {
      els.btnSaveExactDistance.addEventListener('click', () => {
        const actualCm = parseFloat(els.inputActualDistance.value);
        if (isNaN(actualCm) || actualCm <= 0) {
          alert('Please enter a valid measured floor distance in cm.');
          return;
        }
        const targetCm = getTableTarget(activeScoringTable, activeScoringRound);
        const errorCm = Math.abs(actualCm - targetCm);
        const pts = calculateAccuracyPoints(errorCm);
        const resultType = getShotResultClassification(pts);

        commitScore(pts, resultType, actualCm, errorCm);
      });
    }
  }

  function getTableTarget(tableNum, roundNum) {
    const r = roundNum || currentRound;
    const t = tableNum || 1;
    const specificKey = `p${activePeriod}_r${r}_table_${t}`;
    const roundKey = `r${r}_table_${t}`;
    const genericKey = `table_${t}`;

    if (tableTargets[specificKey] && typeof tableTargets[specificKey] === 'number') {
      return tableTargets[specificKey];
    }
    if (tableTargets[roundKey] && typeof tableTargets[roundKey] === 'number') {
      return tableTargets[roundKey];
    }
    if (r === currentRound && tableTargets[genericKey] && typeof tableTargets[genericKey] === 'number') {
      return tableTargets[genericKey];
    }
    return roundTargets[r] || 130.0;
  }

  function switchRound(roundNum, shouldBroadcast = false) {
    currentRound = Math.max(1, Math.min(4, roundNum));
    updateRoundUI();
    renderTargetStrip();
    renderLeaderboard();
    updateSummaryMetrics();

    if (shouldBroadcast && fbDb && isTeacher(currentTeacher)) {
      fbDb.collection('student_results')
        .doc(ASSIGNMENT_ID)
        .set({
          activePeriod: activePeriod,
          currentRound: currentRound,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true })
        .catch(err => console.warn('Round switch broadcast notice:', err.message));
    }
  }

  function updateRoundUI() {
    // Update round tabs
    if (els.roundTabs) {
      els.roundTabs.querySelectorAll('.round-btn').forEach(btn => {
        const r = parseInt(btn.dataset.round);
        btn.classList.toggle('active', r === currentRound);
      });
    }

    // Update labels and target inputs
    const rLabel = currentRound === 4 ? '🏆 Tie-Breaker (Round 4)' : `Round ${currentRound} (of 3)`;
    if (els.dispActiveRoundLabel) {
      els.dispActiveRoundLabel.textContent = `${rLabel} — Max 10 pts`;
    }
    if (els.radarRoundLabel) {
      els.radarRoundLabel.textContent = currentRound === 4 ? '🏆 Tie-Breaker' : `Round ${currentRound}`;
    }

    const roundTarget = roundTargets[currentRound] || 130.0;
    if (els.dispTargetCm) {
      els.dispTargetCm.textContent = `${roundTarget.toFixed(1)} cm`;
    }
    if (els.inputUniversalTarget) {
      els.inputUniversalTarget.value = roundTarget.toFixed(1);
    }

    // Update column highlights in leaderboard
    if (els.thRound1) els.thRound1.classList.toggle('col-active-round', currentRound === 1);
    if (els.thRound2) els.thRound2.classList.toggle('col-active-round', currentRound === 2);
    if (els.thRound3) els.thRound3.classList.toggle('col-active-round', currentRound === 3);
    if (els.thRound4) els.thRound4.classList.toggle('col-active-tb', currentRound === 4);
  }

  function attachSubmissionsListener() {
    if (unsubscribeSubmissions) {
      unsubscribeSubmissions();
      unsubscribeSubmissions = null;
    }

    if (!fbDb) return;

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
      console.warn('Could not attach submissions listener', e);
    }
  }

  function attachConfigListener() {
    if (!fbDb) return;
    try {
      if (unsubscribeConfig) unsubscribeConfig();
      unsubscribeConfig = fbDb.collection('student_results')
        .doc(ASSIGNMENT_ID)
        .onSnapshot(doc => {
          if (!doc.exists) return;
          const data = doc.data() || {};
          if (typeof data.currentRound === 'number' && data.currentRound >= 1 && data.currentRound <= 4) {
            currentRound = data.currentRound;
          }
          if (data.roundTargets && typeof data.roundTargets === 'object') {
            roundTargets = Object.assign(roundTargets, data.roundTargets);
          } else if (typeof data.universalTargetCm === 'number') {
            roundTargets[currentRound] = data.universalTargetCm;
          }

          const periodTargetsKey = `tableTargets_p${activePeriod}`;
          tableTargets = data[periodTargetsKey] || data.tableTargets || {};

          updateRoundUI();
          renderTargetStrip();
          renderLeaderboard();
        }, err => console.warn('Config listen notice:', err.message));
    } catch (e) {
      console.warn('Could not attach config listener', e);
    }
  }

  function broadcastTargetDistance(distanceCm) {
    if (!fbDb || !isTeacher(currentTeacher)) return;

    roundTargets[currentRound] = distanceCm;

    const payload = {
      activePeriod: activePeriod,
      currentRound: currentRound,
      roundTargets: roundTargets,
      universalTargetCm: distanceCm,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    fbDb.collection('student_results')
      .doc(ASSIGNMENT_ID)
      .set(payload, { merge: true })
      .then(() => {
        if (window.SoundFX) SoundFX.play('click');
        updateRoundUI();
      })
      .catch(e => console.warn('Broadcast target notice', e));
  }

  function assignRandomizedTableDistances() {
    // Generate distinct, clean target distances between 95 cm and 170 cm
    // Different pools for different rounds for variety
    let pool = [95.0, 105.0, 115.0, 122.0, 130.0, 138.0, 145.0, 155.0, 165.0];
    if (currentRound === 2) {
      pool = [98.0, 108.0, 118.0, 125.0, 132.0, 140.0, 148.0, 158.0, 168.0];
    } else if (currentRound === 3) {
      pool = [92.0, 102.0, 112.0, 120.0, 135.0, 142.0, 152.0, 160.0, 170.0];
    } else if (currentRound === 4) {
      pool = [100.0, 110.0, 120.0, 130.0, 140.0, 150.0, 160.0, 170.0, 175.0];
    }

    const shuffled = pool.slice().sort(() => Math.random() - 0.5);

    const periodKey = `tableTargets_p${activePeriod}`;
    const roundSpecificAssignments = {};
    for (let t = 1; t <= 9; t++) {
      const dist = shuffled[t - 1];
      tableTargets[`p${activePeriod}_r${currentRound}_table_${t}`] = dist;
      tableTargets[`r${currentRound}_table_${t}`] = dist;
      tableTargets[`table_${t}`] = dist;
      roundSpecificAssignments[`p${activePeriod}_r${currentRound}_table_${t}`] = dist;
      roundSpecificAssignments[`table_${t}`] = dist;
    }

    if (fbDb && isTeacher(currentTeacher)) {
      fbDb.collection('student_results')
        .doc(ASSIGNMENT_ID)
        .set({
          [periodKey]: tableTargets,
          tableTargets: tableTargets,
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

    Object.values(tableSubmissions).forEach(sub => {
      const rData = getRoundData(sub, currentRound);
      if (rData && rData.status === 'scored') {
        scored++;
      } else if ((rData && rData.status === 'ready_to_launch') || (sub.status === 'ready_to_launch' && (sub.currentRound === currentRound || !sub.currentRound))) {
        ready++;
      }
    });

    if (els.readyCount) els.readyCount.textContent = ready;
    if (els.scoredCount) els.scoredCount.textContent = scored;
  }

  function getRoundData(sub, roundNum) {
    if (!sub) return null;
    if (sub.rounds && sub.rounds[roundNum]) {
      return sub.rounds[roundNum];
    }
    if (sub.rounds && sub.rounds[String(roundNum)]) {
      return sub.rounds[String(roundNum)];
    }
    // Backward compatibility for single-round submissions
    if (roundNum === 1 && typeof sub.score === 'number' && sub.shotResult) {
      return {
        score: sub.score > 10 ? Math.round(sub.score / 10) : sub.score,
        shotResult: sub.shotResult,
        status: sub.status || 'scored',
        predictedReleaseHeightCm: sub.predictedReleaseHeightCm,
        actualLandingCm: sub.actualLandingCm,
        errorCm: sub.errorCm
      };
    }
    return null;
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
      const rData = getRoundData(sub, currentRound);
      if (!rData || rData.status !== 'scored') return;

      const pin = document.createElement('div');
      pin.className = `table-pin ${rData.shotResult || 'miss'}`;
      pin.textContent = `T${tblKey}`;
      pin.title = `Table ${tblKey} (${sub.teamMembers || 'Team'}): R${currentRound} = ${rData.score || 0}/10 pts`;

      let errCm = 0;
      if (typeof rData.errorCm === 'number') {
        errCm = rData.errorCm;
      } else if (rData.shotResult === 'swish' || rData.score === 10) errCm = 0;
      else if (rData.shotResult === 'rim' || rData.score >= 8) errCm = (Math.random() > 0.5 ? 1 : -1) * 3.5;
      else if (rData.shotResult === 'inner' || rData.score >= 5) errCm = (Math.random() > 0.5 ? 1 : -1) * 8.5;
      else if (rData.shotResult === 'outer' || rData.score >= 2) errCm = (Math.random() > 0.5 ? 1 : -1) * 16.0;
      else errCm = (Math.random() > 0.5 ? 1 : -1) * 26.0;

      let posPct = centerPct + (errCm * pctPerCm);
      posPct = Math.max(5, Math.min(95, posPct));
      pin.style.left = `${posPct}%`;

      pin.addEventListener('click', () => {
        openScoringModal(parseInt(tblKey), currentRound);
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
      const r1 = getRoundData(sub, 1);
      const r2 = getRoundData(sub, 2);
      const r3 = getRoundData(sub, 3);
      const r4 = getRoundData(sub, 4);

      const r1Pts = r1 && typeof r1.score === 'number' ? r1.score : null;
      const r2Pts = r2 && typeof r2.score === 'number' ? r2.score : null;
      const r3Pts = r3 && typeof r3.score === 'number' ? r3.score : null;
      const tbPts = r4 && typeof r4.score === 'number' ? r4.score : null;

      // Base total score is sum of R1, R2, R3 (max 30 pts)
      let total = 0;
      let hasAnyScore = false;
      [r1Pts, r2Pts, r3Pts].forEach(p => {
        if (p !== null) {
          total += p;
          hasAnyScore = true;
        }
      });

      // Cumulative error for tie-breaking precision
      let totalErr = 0;
      [r1, r2, r3].forEach(r => {
        if (r && typeof r.errorCm === 'number') totalErr += r.errorCm;
      });

      rows.push({
        tableNum: t,
        sub: sub,
        r1: r1,
        r2: r2,
        r3: r3,
        r4: r4,
        r1Pts: r1Pts,
        r2Pts: r2Pts,
        r3Pts: r3Pts,
        tbPts: tbPts,
        totalScore: hasAnyScore ? total : -1,
        totalError: totalErr,
        hasScore: hasAnyScore
      });
    }

    // Sort Leaderboard:
    // 1. Total Score (R1+R2+R3) descending
    // 2. Tie-Breaker score (R4) descending
    // 3. Lowest total error (closest shots)
    // 4. Table number
    rows.sort((a, b) => {
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
      const tbA = a.tbPts !== null ? a.tbPts : -1;
      const tbB = b.tbPts !== null ? b.tbPts : -1;
      if (tbB !== tbA) return tbB - tbA;
      if (a.hasScore && b.hasScore && a.totalError !== b.totalError) return a.totalError - b.totalError;
      return a.tableNum - b.tableNum;
    });

    rows.forEach((r, idx) => {
      const sub = r.sub;
      const tr = document.createElement('tr');
      const isRanked = r.totalScore >= 0;
      tr.className = `leaderboard-row ${idx === 0 && isRanked ? 'rank-1' : idx === 1 && isRanked ? 'rank-2' : idx === 2 && isRanked ? 'rank-3' : ''}`;

      const assignedTarget = getTableTarget(r.tableNum, currentRound);

      tr.innerHTML = `
        <td style="width: 50px; text-align: center;">
          <div class="rank-badge">${idx + 1}</div>
        </td>
        <td>
          <div style="font-weight: 800; font-size: 1.05rem; display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
            <span>Table ${r.tableNum}</span>
            <span style="font-size: 0.72rem; font-weight: 700; color: var(--accent-cyan); background: var(--bg-card-sub); border: 1px solid var(--border-color); padding: 0.12rem 0.4rem; border-radius: 4px;">
              🎯 R${currentRound}: ${assignedTarget.toFixed(1)} cm
            </span>
          </div>
          <div style="font-size: 0.8rem; color: var(--text-dim);">${sub && sub.teamMembers ? sub.teamMembers : 'Awaiting members...'}</div>
        </td>
        <td style="text-align: center;" class="${currentRound === 1 ? 'col-active-round' : ''}">
          ${renderRoundPill(r.r1, 1, r.tableNum)}
        </td>
        <td style="text-align: center;" class="${currentRound === 2 ? 'col-active-round' : ''}">
          ${renderRoundPill(r.r2, 2, r.tableNum)}
        </td>
        <td style="text-align: center;" class="${currentRound === 3 ? 'col-active-round' : ''}">
          ${renderRoundPill(r.r3, 3, r.tableNum)}
        </td>
        <td style="text-align: center;">
          ${r.totalScore >= 0 ? `
            <div class="total-score-box">
              <span class="total-score-num">${r.totalScore}</span>
              <span class="total-score-denom">/ 30</span>
            </div>
          ` : '<span style="color: var(--text-dim); font-size: 0.85rem;">--</span>'}
        </td>
        <td style="text-align: center;" class="${currentRound === 4 ? 'col-active-tb' : ''}">
          ${renderTieBreakerPill(r.r4, r.tableNum)}
        </td>
        <td style="width: 110px; text-align: right;">
          <button type="button" class="btn-primary btn-score-row" data-table="${r.tableNum}" style="padding: 0.4rem 0.75rem; font-size: 0.85rem;">
            🎯 Score R${currentRound}
          </button>
        </td>
      `;

      // Bind row score button
      tr.querySelector('.btn-score-row').addEventListener('click', () => {
        openScoringModal(r.tableNum, currentRound);
      });

      // Bind clicking round pills directly to open modal for that specific round
      tr.querySelectorAll('.round-score-pill').forEach(pill => {
        pill.addEventListener('click', e => {
          e.stopPropagation();
          const rNum = parseInt(pill.dataset.round);
          openScoringModal(r.tableNum, rNum);
        });
      });

      els.leaderboardBody.appendChild(tr);
    });
  }

  function renderRoundPill(rData, roundNum, tableNum) {
    if (!rData) {
      return `<span class="round-score-pill waiting" data-round="${roundNum}" title="Click to score R${roundNum}">--</span>`;
    }
    if (rData.status === 'ready_to_launch') {
      return `<span class="round-score-pill ready" data-round="${roundNum}" title="Ready to launch! Click to score.">Ready</span>`;
    }
    if (typeof rData.score === 'number') {
      const pts = rData.score;
      let colorClass = 'score-zero';
      if (pts === 10) colorClass = 'score-10';
      else if (pts >= 8) colorClass = 'score-high';
      else if (pts >= 5) colorClass = 'score-mid';
      else if (pts >= 2) colorClass = 'score-low';

      const errText = typeof rData.errorCm === 'number' ? ` (Error: ${rData.errorCm.toFixed(1)} cm)` : '';
      return `
        <span class="round-score-pill ${colorClass}" data-round="${roundNum}" style="cursor: pointer;" title="Round ${roundNum}: ${pts}/10 pts${errText}. Click to edit.">
          ${pts}
        </span>
      `;
    }
    return `<span class="round-score-pill waiting" data-round="${roundNum}">--</span>`;
  }

  function renderTieBreakerPill(rData, tableNum) {
    if (!rData) {
      return `<span class="round-score-pill waiting" data-round="4" title="Tie-Breaker: Click to score R4">--</span>`;
    }
    if (rData.status === 'ready_to_launch') {
      return `<span class="round-score-pill ready" data-round="4" title="Ready to launch!">Ready</span>`;
    }
    if (typeof rData.score === 'number') {
      const pts = rData.score;
      let colorClass = pts === 10 ? 'score-10' : pts >= 8 ? 'score-high' : pts >= 5 ? 'score-mid' : 'score-low';
      return `
        <span class="round-score-pill ${colorClass}" data-round="4" style="cursor: pointer;" title="Tie-Breaker: ${pts}/10 pts. Click to edit.">
          ${pts}
        </span>
      `;
    }
    return `<span class="round-score-pill waiting" data-round="4">--</span>`;
  }

  function openScoringModal(tableNumber, roundNumber) {
    activeScoringTable = tableNumber;
    activeScoringRound = roundNumber || currentRound;

    selectModalScoringRound(activeScoringRound);
    els.scoreModal.classList.add('active');
  }

  function selectModalScoringRound(roundNum) {
    activeScoringRound = Math.max(1, Math.min(4, roundNum));

    // Update modal round tabs
    if (els.modalRoundTabs) {
      els.modalRoundTabs.querySelectorAll('.modal-round-btn').forEach(btn => {
        const r = parseInt(btn.dataset.mround);
        btn.classList.toggle('active', r === activeScoringRound);
      });
    }

    const sub = tableSubmissions[activeScoringTable] || {};
    const rData = getRoundData(sub, activeScoringRound);
    const targetCm = getTableTarget(activeScoringTable, activeScoringRound);

    const rTitle = activeScoringRound === 4 ? '🏆 Tie-Breaker (Round 4)' : `Round ${activeScoringRound} of 3`;
    if (els.modalTableTitle) {
      els.modalTableTitle.textContent = `Score Drop: Table ${activeScoringTable} — ${rTitle}`;
    }
    if (els.modalTeamNames) {
      els.modalTeamNames.textContent = sub.teamMembers || 'Lab Team';
    }
    if (els.modalTargetDist) {
      els.modalTargetDist.textContent = `${targetCm.toFixed(1)} cm`;
    }

    let predH = '-- cm';
    if (rData && rData.predictedReleaseHeightCm) {
      predH = `${rData.predictedReleaseHeightCm} cm`;
    } else if (sub.predictedReleaseHeightCm && (activeScoringRound === currentRound || activeScoringRound === 1)) {
      predH = `${sub.predictedReleaseHeightCm} cm`;
    }
    if (els.modalPredHeight) {
      els.modalPredHeight.textContent = predH;
    }

    // Highlight existing score button if already scored
    if (els.score10Grid) {
      els.score10Grid.querySelectorAll('.btn-acc-score').forEach(btn => {
        btn.classList.remove('selected');
        if (rData && typeof rData.score === 'number' && parseInt(btn.dataset.pts) === rData.score) {
          btn.classList.add('selected');
        }
      });
    }

    if (els.modalCurrentScoreBadge) {
      if (rData && typeof rData.score === 'number') {
        els.modalCurrentScoreBadge.textContent = `Current Score: ${rData.score} / 10 pts`;
      } else {
        els.modalCurrentScoreBadge.textContent = 'Max 10 pts';
      }
    }

    if (els.inputActualDistance) {
      els.inputActualDistance.value = rData && rData.actualLandingCm ? rData.actualLandingCm : '';
    }
    if (els.calcPreview) {
      els.calcPreview.textContent = '';
    }
  }

  function commitScore(points, resultType, actualCm = null, errorCm = null) {
    if (!activeScoringTable) return;
    const tbl = activeScoringTable;
    const r = activeScoringRound;
    const sub = tableSubmissions[tbl] || { tableNumber: tbl, period: activePeriod };

    // Play appropriate sound effect
    if (window.SoundFX) {
      if (points === 10) {
        SoundFX.play('clink');
        setTimeout(() => SoundFX.play('fanfare'), 180);
      } else if (points >= 8) {
        SoundFX.play('rim');
      } else if (points <= 1) {
        SoundFX.play('buzz');
      } else {
        SoundFX.play('click');
      }
    }

    if (!sub.rounds) sub.rounds = {};
    const roundPayload = {
      targetDistCm: getTableTarget(tbl, r),
      predictedReleaseHeightCm: (sub.rounds[r] && sub.rounds[r].predictedReleaseHeightCm) || sub.predictedReleaseHeightCm || null,
      actualLandingCm: actualCm !== null ? actualCm : null,
      errorCm: errorCm !== null ? errorCm : null,
      score: points,
      shotResult: resultType,
      status: 'scored',
      scoredAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    sub.rounds[String(r)] = roundPayload;

    // Recalculate totalScore (R1 + R2 + R3, max 30)
    let newTotal = 0;
    [1, 2, 3].forEach(rd => {
      const rdData = sub.rounds[String(rd)];
      if (rdData && typeof rdData.score === 'number') {
        newTotal += rdData.score;
      }
    });
    sub.totalScore = newTotal;
    sub.score = newTotal; // for backward compatibility

    // Tie-breaker score
    if (sub.rounds['4'] && typeof sub.rounds['4'].score === 'number') {
      sub.tieBreakerScore = sub.rounds['4'].score;
    }

    sub.status = 'scored';
    sub.tableNumber = tbl;
    sub.period = activePeriod;
    tableSubmissions[tbl] = sub;

    // Update UI immediately
    updateSummaryMetrics();
    renderTargetStrip();
    renderLeaderboard();
    els.scoreModal.classList.remove('active');

    // Save to Cloud Firestore
    if (fbDb && isTeacher(currentTeacher)) {
      const docId = sub.docId ? sub.docId : `table_${tbl}_p${activePeriod}`;
      const firestorePayload = {
        tableNumber: tbl,
        period: activePeriod,
        rounds: sub.rounds,
        totalScore: newTotal,
        tieBreakerScore: sub.tieBreakerScore || 0,
        score: newTotal,
        status: 'scored',
        currentRound: r,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      fbDb.collection('student_results')
        .doc(ASSIGNMENT_ID)
        .collection('students')
        .doc(docId)
        .set(firestorePayload, { merge: true })
        .catch(err => console.error('Error committing round score to Firestore:', err));
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
