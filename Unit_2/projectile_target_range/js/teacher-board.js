// firestore-audit: teacher-only
// Teacher Control & Scoring Dashboard Logic (dashboard.html)
// Strictly accessible only by Mr. Mudry (rmudry@orangeusd.org / ryan.mudry@gmail.com)
// Real-time Step 3 & Step 6 approval gates, multi-student group roster tracking, and Round 1–3 scoring fan-out
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
  let tableApprovals = {}; // Keyed by 'table_{t}' -> { step3Approved, step6Approved }
  let tableSubmissions = {}; // Keyed by tableNumber (1-9)
  let periodRoster = []; // Array of { id, name, firstName, lastName, period }
  let rosterById = {};
  let previousWaitingSignature = '';

  let activeScoringTable = null;
  let activeScoringRound = 1;
  let activeGroupModalTable = null;

  const els = {};

  function init() {
    cacheElements();
    initFirebase();
    bindEvents();
    updateRoundUI();
  }

  function cacheElements() {
    els.periodTabs = document.getElementById('periodTabs');
    els.teacherGateOverlay = document.getElementById('teacherGateOverlay');
    els.teacherGateMsg = document.getElementById('teacherGateMsg');
    els.btnGateTeacherSignIn = document.getElementById('btnGateTeacherSignIn');
    els.teacherMainContent = document.getElementById('teacherMainContent');

    els.approvalQueueBanner = document.getElementById('approvalQueueBanner');
    els.approvalQueueGrid = document.getElementById('approvalQueueGrid');
    els.btnApproveAllStep3 = document.getElementById('btnApproveAllStep3');
    els.btnApproveAllStep6 = document.getElementById('btnApproveAllStep6');

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

    els.waitingGateCount = document.getElementById('waitingGateCount');
    els.readyCount = document.getElementById('readyCount');
    els.scoredCount = document.getElementById('scoredCount');
    els.rosterLoadedBadge = document.getElementById('rosterLoadedBadge');
    els.btnClearPeriodTeams = document.getElementById('btnClearPeriodTeams');

    els.targetStrip = document.getElementById('targetStrip');
    els.leaderboardBody = document.getElementById('leaderboardBody');

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

    // Group & Calibration Modal
    els.groupModal = document.getElementById('groupModal');
    els.groupModalTitle = document.getElementById('groupModalTitle');
    els.groupModalMembersList = document.getElementById('groupModalMembersList');
    els.selectRosterStudent = document.getElementById('selectRosterStudent');
    els.btnAddRosterStudent = document.getElementById('btnAddRosterStudent');
    els.groupModalCalData = document.getElementById('groupModalCalData');
    els.btnCloseGroupModal = document.getElementById('btnCloseGroupModal');
  }

  function initFirebase() {
    if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
      fbDb = firebase.firestore();
      firebase.auth().onAuthStateChanged(user => {
        currentTeacher = user;
        updateTeacherAuthUI();
        if (isTeacher(currentTeacher)) {
          loadPeriodRoster();
          attachConfigListener();
          attachSubmissionsListener();
        } else {
          detachListeners();
        }
      });
    }
  }

  function detachListeners() {
    if (unsubscribeSubmissions) {
      unsubscribeSubmissions();
      unsubscribeSubmissions = null;
    }
    if (unsubscribeConfig) {
      unsubscribeConfig();
      unsubscribeConfig = null;
    }
  }

  function isTeacher(user) {
    if (!user || !user.email) return false;
    const email = user.email.toLowerCase();
    return TEACHER_EMAILS.includes(email);
  }

  function triggerTeacherSignIn() {
    if (!firebase.apps.length) return;
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    firebase.auth().signInWithPopup(provider).catch(err => {
      alert('Sign-in error: ' + err.message);
    });
  }

  function updateTeacherAuthUI() {
    const teacherOk = isTeacher(currentTeacher);

    if (teacherOk) {
      const email = currentTeacher.email || '';
      if (els.teacherBadge) {
        els.teacherBadge.textContent = `👨‍🏫 ${email}`;
        els.teacherBadge.style.display = 'inline-flex';
      }
      if (els.btnTeacherLogin) {
        els.btnTeacherLogin.textContent = 'Sign Out';
      }
      if (els.teacherGateOverlay) els.teacherGateOverlay.style.display = 'none';
      if (els.teacherMainContent) els.teacherMainContent.style.display = 'grid';
      if (els.periodTabs) els.periodTabs.style.display = 'flex';
    } else {
      if (els.teacherMainContent) els.teacherMainContent.style.display = 'none';
      if (els.periodTabs) els.periodTabs.style.display = 'none';
      if (els.teacherGateOverlay) els.teacherGateOverlay.style.display = 'flex';

      if (currentTeacher) {
        const email = currentTeacher.email || 'Unknown account';
        if (els.teacherBadge) {
          els.teacherBadge.textContent = `🚫 ${email} (Blocked)`;
          els.teacherBadge.style.display = 'inline-flex';
        }
        if (els.btnTeacherLogin) els.btnTeacherLogin.textContent = 'Sign Out';
        if (els.teacherGateMsg) {
          els.teacherGateMsg.innerHTML = `<span style="color: var(--accent-rose); font-weight: 800;">Access Denied for ${escapeHtml(email)}.</span><br>Students: Please return to the Step-by-Step Ramp Builder. Only Mr. Mudry (rmudry@orangeusd.org) may access this control dashboard.`;
        }
      } else {
        if (els.teacherBadge) els.teacherBadge.style.display = 'none';
        if (els.btnTeacherLogin) els.btnTeacherLogin.textContent = 'Teacher Sign-In';
        if (els.teacherGateMsg) {
          els.teacherGateMsg.innerHTML = `This dashboard is restricted to <strong>Mr. Mudry (rmudry@orangeusd.org)</strong> for approving group build steps (Steps 3 &amp; 6), managing team rosters, and recording Round 1–3 target scores.`;
        }
      }
    }
  }

  // Load period roster from Firestore `roster` collection so we can verify & match group members
  function loadPeriodRoster() {
    if (!fbDb || !isTeacher(currentTeacher)) return;
    periodRoster = [];
    rosterById = {};
    if (els.rosterLoadedBadge) els.rosterLoadedBadge.textContent = `Loading P${activePeriod} roster...`;

    fbDb.collection('roster')
      .get()
      .then(snap => {
        periodRoster = [];
        rosterById = {};
        snap.forEach(doc => {
          const d = doc.data() || {};
          const pVal = d.class_period !== undefined ? d.class_period : d.period;
          const id = String(doc.id).trim();
          const fullName = d.full_name || d.name || [d.first_name || d.firstName, d.last_name || d.lastName].filter(Boolean).join(' ') || id;
          const entry = {
            id: id,
            name: fullName,
            firstName: d.first_name || d.firstName || '',
            lastName: d.last_name || d.lastName || '',
            period: Number(pVal)
          };
          rosterById[id] = entry;
          if (Number(pVal) === Number(activePeriod)) {
            periodRoster.push(entry);
          }
        });
        periodRoster.sort((a, b) => a.name.localeCompare(b.name));
        if (els.rosterLoadedBadge) {
          els.rosterLoadedBadge.textContent = `P${activePeriod}: ${periodRoster.length} students on roster`;
        }
        populateRosterDropdown();
        renderLeaderboard();
      })
      .catch(err => {
        console.warn('Roster load notice:', err.message);
        if (els.rosterLoadedBadge) els.rosterLoadedBadge.textContent = 'Roster ready';
      });
  }

  function populateRosterDropdown() {
    if (!els.selectRosterStudent) return;
    els.selectRosterStudent.innerHTML = '<option value="">-- Select student from Period ' + activePeriod + ' roster --</option>';
    periodRoster.forEach(st => {
      const opt = document.createElement('option');
      opt.value = st.id;
      opt.textContent = `${st.name} (${st.id})`;
      els.selectRosterStudent.appendChild(opt);
    });
  }

  // Match a groupMember object ({ studentId, name, isPrimary }) against periodRoster
  function resolveRosterMember(member) {
    if (!member) return null;
    const rawId = String(member.studentId || '').trim();
    const rawName = String(member.name || '').trim();

    if (rawId && rosterById[rawId]) {
      return {
        studentId: rawId,
        name: rosterById[rawId].name,
        isPrimary: !!member.isPrimary,
        verified: true
      };
    }

    // Try matching by name (case-insensitive)
    if (rawName && periodRoster.length > 0) {
      const norm = rawName.toLowerCase();
      const exact = periodRoster.find(r => r.name.toLowerCase() === norm);
      if (exact) {
        return {
          studentId: exact.id,
          name: exact.name,
          isPrimary: !!member.isPrimary,
          verified: true
        };
      }
      // Partial match if unique first name or first+last
      const partial = periodRoster.filter(r => r.name.toLowerCase().includes(norm) || norm.includes(r.name.toLowerCase()));
      if (partial.length === 1) {
        return {
          studentId: partial[0].id,
          name: partial[0].name,
          isPrimary: !!member.isPrimary,
          verified: true
        };
      }
    }

    const isSixDigit = /^\d{5,7}$/.test(rawId);
    return {
      studentId: rawId || rawName.toLowerCase().replace(/[^a-z0-9]/g, '_'),
      name: rawName || rawId,
      isPrimary: !!member.isPrimary,
      verified: isSixDigit && !!rosterById[rawId]
    };
  }

  function getResolvedGroupMembers(sub) {
    if (!sub) return [];
    let rawList = [];
    if (Array.isArray(sub.groupMembers) && sub.groupMembers.length > 0) {
      rawList = sub.groupMembers;
    } else if (sub.studentId || sub.studentName) {
      rawList = [{
        studentId: sub.studentId || sub.docId || '',
        name: sub.studentName || sub.teamMembers || 'Student',
        isPrimary: true
      }];
    }
    const seen = new Set();
    const resolved = [];
    rawList.forEach(m => {
      const rm = resolveRosterMember(m);
      if (!rm) return;
      const key = rm.studentId || rm.name;
      if (!seen.has(key)) {
        seen.add(key);
        resolved.push(rm);
      }
    });
    return resolved;
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
          activePeriod = parseInt(btn.dataset.period, 10);
          tableSubmissions = {};
          loadPeriodRoster();
          attachConfigListener();
          attachSubmissionsListener();
        });
      });
    }

    // Teacher Login Buttons
    if (els.btnTeacherLogin) {
      els.btnTeacherLogin.addEventListener('click', () => {
        if (currentTeacher) {
          firebase.auth().signOut();
        } else {
          triggerTeacherSignIn();
        }
      });
    }
    if (els.btnGateTeacherSignIn) {
      els.btnGateTeacherSignIn.addEventListener('click', triggerTeacherSignIn);
    }

    // Approve All Step 3 / Step 6
    if (els.btnApproveAllStep3) {
      els.btnApproveAllStep3.addEventListener('click', () => {
        Object.keys(tableSubmissions).forEach(t => {
          approveTableCheckpoint(parseInt(t, 10), 3, true);
        });
      });
    }
    if (els.btnApproveAllStep6) {
      els.btnApproveAllStep6.addEventListener('click', () => {
        Object.keys(tableSubmissions).forEach(t => {
          approveTableCheckpoint(parseInt(t, 10), 6, true);
        });
      });
    }

    // Clear all teams in the active period
    if (els.btnClearPeriodTeams) {
      els.btnClearPeriodTeams.addEventListener('click', () => {
        if (!fbDb || !isTeacher(currentTeacher)) return;
        if (!confirm(`Clear all signed-in groups and reset approvals for Period ${activePeriod}?`)) return;
        fbDb.collection('student_results')
          .doc(ASSIGNMENT_ID)
          .collection('students')
          .where('period', '==', activePeriod)
          .get()
          .then(snap => {
            const batch = fbDb.batch();
            snap.forEach(doc => batch.delete(doc.ref));
            const periodApprovalsKey = `approvals_p${activePeriod}`;
            batch.set(fbDb.collection('student_results').doc(ASSIGNMENT_ID), {
              [periodApprovalsKey]: firebase.firestore.FieldValue.delete()
            }, { merge: true });
            return batch.commit();
          })
          .then(() => {
            tableSubmissions = {};
            tableApprovals = {};
            renderApprovalQueue();
            updateSummaryMetrics();
            renderTargetStrip();
            renderLeaderboard();
          })
          .catch(err => alert('Error clearing period teams: ' + err.message));
      });
    }

    // Round Selector Tabs
    if (els.roundTabs) {
      els.roundTabs.querySelectorAll('.round-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const r = parseInt(btn.dataset.round, 10);
          switchRound(r, true);
        });
      });
    }

    if (els.btnPrevRound) {
      els.btnPrevRound.addEventListener('click', () => {
        if (currentRound > 1) switchRound(currentRound - 1, true);
      });
    }
    if (els.btnNextRound) {
      els.btnNextRound.addEventListener('click', () => {
        if (currentRound < 4) switchRound(currentRound + 1, true);
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
        if (!confirm(`Assign unique, randomized target distances to all signed-in groups for ${rName}?`)) return;
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
          const r = parseInt(btn.dataset.mround, 10);
          selectModalScoringRound(r);
        });
      });
    }

    // Modal 0–10 Point Button Grid Click
    if (els.score10Grid) {
      els.score10Grid.querySelectorAll('.btn-acc-score').forEach(btn => {
        btn.addEventListener('click', () => {
          const pts = parseInt(btn.dataset.pts, 10);
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

    // Close Group Modal
    if (els.btnCloseGroupModal) {
      els.btnCloseGroupModal.addEventListener('click', () => {
        els.groupModal.classList.remove('active');
        activeGroupModalTable = null;
      });
    }

    // Add student from roster dropdown to group
    if (els.btnAddRosterStudent && els.selectRosterStudent) {
      els.btnAddRosterStudent.addEventListener('click', () => {
        if (!activeGroupModalTable) return;
        const selectedId = els.selectRosterStudent.value;
        if (!selectedId || !rosterById[selectedId]) return;
        const st = rosterById[selectedId];
        addStudentToTableGroup(activeGroupModalTable, st.id, st.name);
        els.selectRosterStudent.value = '';
      });
    }
  }

  function getTableTarget(tableNum, roundNum) {
    const r = roundNum || currentRound;
    const t = tableNum || 1;
    const sub = tableSubmissions[t];
    const rData = getRoundData(sub, r);
    // Only freeze targetDistCm from the student doc once that round has already been scored
    if (rData && rData.status === 'scored' && typeof rData.targetDistCm === 'number' && rData.targetDistCm > 0) {
      return rData.targetDistCm;
    }

    const pKey = sub ? (sub.primaryStudentId || sub.docId || '') : '';
    const groupKey = pKey ? `p${activePeriod}_r${r}_group_${pKey}` : '';
    const specificKey = `p${activePeriod}_r${r}_table_${t}`;
    const roundKey = `r${r}_table_${t}`;
    const genericKey = `table_${t}`;

    if (groupKey && typeof tableTargets[groupKey] === 'number') {
      return tableTargets[groupKey];
    }
    if (tableTargets[specificKey] && typeof tableTargets[specificKey] === 'number') {
      return tableTargets[specificKey];
    }
    if (tableTargets[roundKey] && typeof tableTargets[roundKey] === 'number') {
      return tableTargets[roundKey];
    }
    if (r === currentRound && tableTargets[genericKey] && typeof tableTargets[genericKey] === 'number') {
      return tableTargets[genericKey];
    }
    if (typeof roundTargets[r] === 'number' && roundTargets[r] > 0) {
      return roundTargets[r];
    }
    if (rData && typeof rData.targetDistCm === 'number' && rData.targetDistCm > 0) {
      return rData.targetDistCm;
    }
    return 110.0;
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
    if (els.roundTabs) {
      els.roundTabs.querySelectorAll('.round-btn').forEach(btn => {
        const r = parseInt(btn.dataset.round, 10);
        btn.classList.toggle('active', r === currentRound);
      });
    }

    const rLabel = currentRound === 4 ? '🏆 Tie-Breaker (Round 4)' : `Round ${currentRound} (of 3)`;
    if (els.dispActiveRoundLabel) {
      els.dispActiveRoundLabel.textContent = `${rLabel} — Max 10 pts`;
    }
    if (els.radarRoundLabel) {
      els.radarRoundLabel.textContent = currentRound === 4 ? '🏆 Tie-Breaker' : `Round ${currentRound}`;
    }

    const roundTarget = roundTargets[currentRound] || 110.0;
    if (els.dispTargetCm) {
      els.dispTargetCm.textContent = `${roundTarget.toFixed(1)} cm`;
    }
    if (els.inputUniversalTarget) {
      els.inputUniversalTarget.value = roundTarget.toFixed(1);
    }

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

    if (!fbDb || !isTeacher(currentTeacher)) return;

    try {
      unsubscribeSubmissions = fbDb.collection('student_results')
        .doc(ASSIGNMENT_ID)
        .collection('students')
        .where('period', '==', activePeriod)
        .onSnapshot(snapshot => {
          tableSubmissions = {};
          const byGroupKey = {};
          snapshot.forEach(doc => {
            const data = doc.data();
            const gKey = String(data.primaryStudentId || doc.id);
            const existing = byGroupKey[gKey];
            if (!existing || doc.id === gKey) {
              byGroupKey[gKey] = Object.assign({ docId: gKey, primaryStudentId: gKey }, existing || {}, data);
            }
          });
          const sortedKeys = Object.keys(byGroupKey).sort();
          sortedKeys.forEach((gKey, idx) => {
            const slot = idx + 1;
            tableSubmissions[slot] = byGroupKey[gKey];
          });
          renderApprovalQueue();
          updateSummaryMetrics();
          renderTargetStrip();
          renderLeaderboard();
          if (activeGroupModalTable) {
            renderGroupModalContent(activeGroupModalTable);
          }
        }, err => {
          console.warn('Firestore live listener notice:', err.message);
        });
    } catch (e) {
      console.warn('Could not attach submissions listener', e);
    }
  }

  function attachConfigListener() {
    if (!fbDb || !isTeacher(currentTeacher)) return;
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

          const periodApprovalsKey = `approvals_p${activePeriod}`;
          tableApprovals = data[periodApprovalsKey] || {};

          updateRoundUI();
          renderApprovalQueue();
          renderTargetStrip();
          renderLeaderboard();
        }, err => console.warn('Config listen notice:', err.message));
    } catch (e) {
      console.warn('Could not attach config listener', e);
    }
  }

  // Approve Step 3 or Step 6 for a given group and fan out to all group members
  function approveTableCheckpoint(tableNum, stepNum, silent = false) {
    if (!fbDb || !isTeacher(currentTeacher)) return;

    const sub = tableSubmissions[tableNum] || { tableNumber: tableNum, period: activePeriod };
    const primaryKey = sub.primaryStudentId || sub.docId || null;

    const tblKey = `table_${tableNum}`;
    if (!tableApprovals[tblKey]) tableApprovals[tblKey] = {};
    if (stepNum === 3) tableApprovals[tblKey].step3Approved = true;
    if (stepNum === 6) tableApprovals[tblKey].step6Approved = true;

    if (primaryKey) {
      if (!tableApprovals[primaryKey]) tableApprovals[primaryKey] = {};
      if (stepNum === 3) tableApprovals[primaryKey].step3Approved = true;
      if (stepNum === 6) tableApprovals[primaryKey].step6Approved = true;
    }

    if (stepNum === 3) {
      sub.step3Approved = true;
      sub.step3Requested = false;
      if (sub.status === 'waiting_step_3') sub.status = 'step_3_approved';
      if (!sub.currentStep || sub.currentStep <= 3) sub.currentStep = 4;
    }
    if (stepNum === 6) {
      sub.step6Approved = true;
      sub.step6Requested = false;
      if (sub.status === 'waiting_step_6') sub.status = 'step_6_approved';
      if (!sub.currentStep || sub.currentStep <= 6) sub.currentStep = 7;
    }
    tableSubmissions[tableNum] = sub;

    if (!silent && window.SoundFX) {
      SoundFX.play('clink');
    }

    // 1. Update parent config doc (`approvals_p{activePeriod}`) so the group's Chromebook unlocks immediately
    const periodApprovalsKey = `approvals_p${activePeriod}`;
    fbDb.collection('student_results')
      .doc(ASSIGNMENT_ID)
      .set({
        [periodApprovalsKey]: tableApprovals,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true })
      .catch(e => console.warn('Parent approval write notice:', e.message));

    // 2. Fan out approval to all group member docs in `student_results/unit2_projectile_target_range/students/`
    fanOutTableDataToGroupMembers(tableNum);

    renderApprovalQueue();
    updateSummaryMetrics();
    renderLeaderboard();
  }

  // Fan out group state (groupMembers, approvals, rounds, totalScore) to every student in the group
  function fanOutTableDataToGroupMembers(tableNum) {
    if (!fbDb || !isTeacher(currentTeacher)) return;
    const sub = tableSubmissions[tableNum];
    if (!sub) return;

    const members = getResolvedGroupMembers(sub);
    const teamNamesStr = members.length > 0
      ? members.map(m => m.name).join(', ')
      : (sub.teamMembers || `Group ${tableNum}`);

    const totalPts = typeof sub.totalScore === 'number' ? sub.totalScore : 0;
    const pct = Math.min(100, Math.round((totalPts / 30) * 100));
    const primaryDriverId = sub.primaryStudentId || sub.docId || (members[0] && members[0].studentId) || `group_${tableNum}_p${activePeriod}`;

    // Target doc IDs to write: primary docId (if any) + every resolved member's studentId
    const targetDocIds = new Set();
    if (sub.docId) targetDocIds.add(sub.docId);
    members.forEach(m => {
      if (m.studentId) targetDocIds.add(String(m.studentId).trim());
    });
    if (targetDocIds.size === 0) {
      targetDocIds.add(primaryDriverId);
    }

    targetDocIds.forEach(docId => {
      const matchedMember = members.find(m => String(m.studentId).trim() === docId);
      const studentName = matchedMember ? matchedMember.name : (sub.studentName || teamNamesStr);

      const payload = {
        studentId: docId,
        primaryStudentId: primaryDriverId,
        studentName: studentName,
        period: activePeriod,
        class_period: String(activePeriod),
        tableNumber: tableNum,
        teamMembers: teamNamesStr,
        groupMembers: members.map(m => ({
          studentId: m.studentId,
          name: m.name,
          isPrimary: !!m.isPrimary
        })),
        step3Approved: !!(sub.step3Approved || (tableApprovals[`table_${tableNum}`] && tableApprovals[`table_${tableNum}`].step3Approved)),
        step6Approved: !!(sub.step6Approved || (tableApprovals[`table_${tableNum}`] && tableApprovals[`table_${tableNum}`].step6Approved)),
        step3Requested: !!sub.step3Requested,
        step6Requested: !!sub.step6Requested,
        currentStep: sub.currentStep || 1,
        rounds: sub.rounds || {},
        totalScore: totalPts,
        tieBreakerScore: sub.tieBreakerScore || 0,
        score: totalPts,
        maxPoints: 30,
        percentage: pct,
        status: sub.status || 'in_progress',
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      fbDb.collection('student_results')
        .doc(ASSIGNMENT_ID)
        .collection('students')
        .doc(docId)
        .set(payload, { merge: true })
        .catch(err => console.warn(`Fan-out write notice for ${docId}:`, err.message));
    });
  }

  function renderApprovalQueue() {
    if (!els.approvalQueueGrid || !els.approvalQueueBanner) return;

    const waitingItems = [];
    const groupKeys = Object.keys(tableSubmissions).map(k => parseInt(k, 10)).sort((a, b) => a - b);
    groupKeys.forEach(t => {
      const sub = tableSubmissions[t];
      if (!sub) return;
      const pKey = sub.primaryStudentId || sub.docId || '';
      const app = (pKey && tableApprovals[pKey]) || tableApprovals[`table_${t}`] || {};
      const s3Ok = !!(sub.step3Approved || app.step3Approved);
      const s6Ok = !!(sub.step6Approved || app.step6Approved);

      const waiting3 = !s3Ok && (sub.step3Requested || sub.status === 'waiting_step_3' || sub.currentStep === 3);
      const waiting6 = !s6Ok && (sub.step6Requested || sub.status === 'waiting_step_6' || sub.currentStep === 6);

      if (waiting3) {
        waitingItems.push({ tableNum: t, stepNum: 3, sub: sub, urgent: !!(sub.step3Requested || sub.status === 'waiting_step_3') });
      }
      if (waiting6) {
        waitingItems.push({ tableNum: t, stepNum: 6, sub: sub, urgent: !!(sub.step6Requested || sub.status === 'waiting_step_6') });
      }
    });

    const sig = waitingItems.filter(i => i.urgent).map(i => `T${i.tableNum}S${i.stepNum}`).join(',');
    if (sig && sig !== previousWaitingSignature && window.SoundFX) {
      SoundFX.play('click');
    }
    previousWaitingSignature = sig;

    els.approvalQueueGrid.innerHTML = '';
    if (waitingItems.length === 0) {
      els.approvalQueueGrid.innerHTML = `
        <div style="grid-column: 1 / -1; background: var(--bg-card); border: 1.5px dashed var(--border-color); border-radius: var(--radius-md); padding: 0.75rem 1rem; color: var(--text-muted); font-size: 0.9rem; display: flex; align-items: center; justify-content: space-between;">
          <span>✅ No groups are currently waiting at Step 3 or Step 6.</span>
          <span style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--text-dim);">Live listener active</span>
        </div>
      `;
      return;
    }

    waitingItems.forEach(item => {
      const members = getResolvedGroupMembers(item.sub);
      const names = members.length > 0 ? members.map(m => m.name).join(', ') : (item.sub.teamMembers || item.sub.studentName || 'Student Group');
      const stepLabel = item.stepNum === 3 ? 'Step 3: Bottom Ramp Curve' : 'Step 6: Floor Meter Stick';

      const card = document.createElement('div');
      card.className = 'approval-request-card';
      card.innerHTML = `
        <div>
          <div style="font-weight: 900; font-size: 1rem; color: var(--text-main);">
            👥 ${escapeHtml(names)} &bull; <span style="color: var(--accent-orange);">${stepLabel}</span>
          </div>
        </div>
        <button type="button" class="btn-approve-inline" style="font-size: 0.88rem; padding: 0.5rem 0.9rem; white-space: nowrap;">
          ✅ Approve Step ${item.stepNum}
        </button>
      `;
      card.querySelector('button').addEventListener('click', () => {
        approveTableCheckpoint(item.tableNum, item.stepNum, false);
      });
      els.approvalQueueGrid.appendChild(card);
    });
  }

  function broadcastTargetDistance(distanceCm) {
    if (!fbDb || !isTeacher(currentTeacher)) return;

    roundTargets[currentRound] = distanceCm;

    // Overwrite any previously randomized per-group targets for this period & round with distanceCm
    const periodKey = `tableTargets_p${activePeriod}`;
    Object.keys(tableTargets).forEach(k => {
      if (
        k.startsWith(`p${activePeriod}_r${currentRound}_`) ||
        k.startsWith(`r${currentRound}_table_`) ||
        k.startsWith('table_')
      ) {
        tableTargets[k] = distanceCm;
      }
    });

    // Also update non-scored rounds on active groups and fan out so student Chromebooks & dashboard sync immediately
    Object.keys(tableSubmissions).forEach(tKey => {
      const t = parseInt(tKey, 10);
      const sub = tableSubmissions[t];
      if (!sub) return;
      if (!sub.rounds) sub.rounds = {};
      const rKey = String(currentRound);
      if (!sub.rounds[rKey]) sub.rounds[rKey] = {};
      if (sub.rounds[rKey].status !== 'scored') {
        sub.rounds[rKey].targetDistCm = distanceCm;
        fanOutTableDataToGroupMembers(t);
      }
    });

    const payload = {
      activePeriod: activePeriod,
      currentRound: currentRound,
      roundTargets: roundTargets,
      universalTargetCm: distanceCm,
      [periodKey]: tableTargets,
      tableTargets: tableTargets,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    fbDb.collection('student_results')
      .doc(ASSIGNMENT_ID)
      .set(payload, { merge: true })
      .then(() => {
        if (window.SoundFX) SoundFX.play('click');
        updateRoundUI();
        renderLeaderboard();
      })
      .catch(e => console.warn('Broadcast target notice', e));
  }

  function assignRandomizedTableDistances() {
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

    const groupKeys = Object.keys(tableSubmissions).map(k => parseInt(k, 10)).sort((a, b) => a - b);
    groupKeys.forEach((t, idx) => {
      const dist = shuffled[idx % shuffled.length];
      const sub = tableSubmissions[t];
      const pKey = sub ? (sub.primaryStudentId || sub.docId || '') : '';
      if (pKey) {
        tableTargets[`p${activePeriod}_r${currentRound}_group_${pKey}`] = dist;
      }
      tableTargets[`p${activePeriod}_r${currentRound}_table_${t}`] = dist;
      tableTargets[`r${currentRound}_table_${t}`] = dist;
      tableTargets[`table_${t}`] = dist;

      if (sub) {
        if (!sub.rounds) sub.rounds = {};
        const rKey = String(currentRound);
        if (!sub.rounds[rKey]) sub.rounds[rKey] = {};
        if (sub.rounds[rKey].status !== 'scored') {
          sub.rounds[rKey].targetDistCm = dist;
          fanOutTableDataToGroupMembers(t);
        }
      }
    });

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
    }
  }

  function updateSummaryMetrics() {
    let waitingGates = 0;
    let ready = 0;
    let scored = 0;

    Object.keys(tableSubmissions).forEach(tKey => {
      const sub = tableSubmissions[tKey];
      if (!sub) return;
      const pKey = sub.primaryStudentId || sub.docId || '';
      const app = (pKey && tableApprovals[pKey]) || tableApprovals[`table_${tKey}`] || {};
      const s3Ok = !!(sub.step3Approved || app.step3Approved);
      const s6Ok = !!(sub.step6Approved || app.step6Approved);

      if ((!s3Ok && (sub.step3Requested || sub.status === 'waiting_step_3')) ||
          (!s6Ok && (sub.step6Requested || sub.status === 'waiting_step_6'))) {
        waitingGates++;
      }

      const rData = getRoundData(sub, currentRound);
      if (rData && rData.status === 'scored') {
        scored++;
      } else if (rData && (rData.status === 'ready_to_launch' || rData.predictedReleaseHeightCm)) {
        ready++;
      }
    });

    if (els.waitingGateCount) els.waitingGateCount.textContent = waitingGates;
    if (els.readyCount) els.readyCount.textContent = ready;
    if (els.scoredCount) els.scoredCount.textContent = scored;
  }

  function getRoundData(sub, roundNum) {
    if (!sub || !sub.rounds) return null;
    return sub.rounds[roundNum] || sub.rounds[String(roundNum)] || null;
  }

  function renderTargetStrip() {
    if (!els.targetStrip) return;
    els.targetStrip.querySelectorAll('.table-pin').forEach(p => p.remove());

    const centerPct = 50;
    const pctPerCm = 1.6;

    Object.keys(tableSubmissions).forEach(tblKey => {
      const sub = tableSubmissions[tblKey];
      const rData = getRoundData(sub, currentRound);
      if (!rData || rData.status !== 'scored') return;

      const members = getResolvedGroupMembers(sub);
      const firstMemberFirst = members.length > 0 ? members[0].name.split(' ')[0] : `G${tblKey}`;
      const groupTitle = members.length > 0 ? members.map(m => m.name).join(', ') : (sub.teamMembers || 'Group');

      const pin = document.createElement('div');
      pin.className = `table-pin ${rData.shotResult || 'miss'}`;
      pin.textContent = firstMemberFirst.slice(0, 6);
      pin.title = `${groupTitle}: R${currentRound} = ${rData.score || 0}/10 pts`;

      let errCm = 0;
      if (typeof rData.errorCm === 'number') {
        errCm = rData.errorCm;
      } else if (rData.shotResult === 'swish' || rData.score === 10) errCm = 0;
      else if (rData.shotResult === 'rim' || rData.score >= 8) errCm = 3.5;
      else if (rData.shotResult === 'inner' || rData.score >= 5) errCm = 8.5;
      else if (rData.shotResult === 'outer' || rData.score >= 2) errCm = 16.0;
      else errCm = 26.0;

      let posPct = centerPct + (errCm * pctPerCm);
      posPct = Math.max(5, Math.min(95, posPct));
      pin.style.left = `${posPct}%`;

      pin.addEventListener('click', () => {
        openScoringModal(parseInt(tblKey, 10), currentRound);
      });

      els.targetStrip.appendChild(pin);
    });
  }

  function renderLeaderboard() {
    if (!els.leaderboardBody) return;
    els.leaderboardBody.innerHTML = '';

    const groupKeys = Object.keys(tableSubmissions).map(k => parseInt(k, 10)).sort((a, b) => a - b);
    if (groupKeys.length === 0) {
      const emptyTr = document.createElement('tr');
      emptyTr.innerHTML = `
        <td colspan="8" style="text-align: center; padding: 2.25rem 1rem; color: var(--text-muted); font-size: 0.95rem;">
          📭 No student groups have signed in for <strong>Period ${activePeriod}</strong> yet. Groups will appear here automatically as students sign in and add their partners.
        </td>
      `;
      els.leaderboardBody.appendChild(emptyTr);
      return;
    }

    groupKeys.forEach(t => {
      const sub = tableSubmissions[t];
      if (!sub) return;
      const pKey = sub.primaryStudentId || sub.docId || '';
      const app = (pKey && tableApprovals[pKey]) || tableApprovals[`table_${t}`] || {};
      const s3Ok = !!(sub && sub.step3Approved) || !!app.step3Approved;
      const s6Ok = !!(sub && sub.step6Approved) || !!app.step6Approved;

      const r1 = getRoundData(sub, 1);
      const r2 = getRoundData(sub, 2);
      const r3 = getRoundData(sub, 3);
      const r4 = getRoundData(sub, 4);

      let total = 0;
      let hasAnyScore = false;
      [r1, r2, r3].forEach(r => {
        if (r && typeof r.score === 'number') {
          total += r.score;
          hasAnyScore = true;
        }
      });

      const members = getResolvedGroupMembers(sub);
      const groupTitle = members.length > 0
        ? members.map(m => m.name).join(', ')
        : (sub.teamMembers || sub.studentName || 'Student Group');
      const calCount = sub && Array.isArray(sub.calibrationData) ? sub.calibrationData.length : 0;

      // Determine current step badge
      let stepBadgeClass = '';
      let stepBadgeText = sub && sub.currentStep ? `Step ${sub.currentStep} of 9` : 'Step 1 of 9';
      if (sub) {
        if (!s3Ok && (sub.step3Requested || sub.status === 'waiting_step_3')) {
          stepBadgeClass = 'waiting-gate';
          stepBadgeText = '🛑 Waiting Step 3';
        } else if (!s6Ok && (sub.step6Requested || sub.status === 'waiting_step_6')) {
          stepBadgeClass = 'waiting-gate';
          stepBadgeText = '🛑 Waiting Step 6';
        } else if (sub.currentStep === 9) {
          stepBadgeClass = 'step-9';
          stepBadgeText = '📈 Step 9: Graph & Rounds';
        }
      }

      const tr = document.createElement('tr');
      tr.className = 'leaderboard-row';

      const membersHtml = members.length > 0
        ? `<div class="group-member-pills">` + members.map(m => `
            <span class="group-member-tag ${m.verified ? 'verified' : ''}" title="Student ID: ${escapeHtml(m.studentId)}">
              ${m.verified ? '✓' : '•'} ${escapeHtml(m.name)}
            </span>
          `).join('') + `</div>`
        : '';

      tr.innerHTML = `
        <td>
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.4rem;">
            <span style="font-weight: 900; font-size: 1rem; color: var(--text-main);">👥 ${escapeHtml(groupTitle)}</span>
            <button type="button" class="btn-mini-action btn-open-group" data-table="${t}" style="white-space: nowrap;">
              Roster (${members.length}) / Data (${calCount})
            </button>
          </div>
          ${membersHtml}
        </td>
        <td>
          <div style="display: flex; flex-direction: column; gap: 0.4rem; align-items: flex-start;">
            <span class="step-progress-badge ${stepBadgeClass}">${stepBadgeText}</span>
            <div style="display: flex; gap: 0.35rem; flex-wrap: wrap;">
              <button type="button" class="btn-approve-inline ${s3Ok ? 'approved-done' : ''} btn-row-step3" data-table="${t}">
                ${s3Ok ? '✓ Step 3 OK' : '✅ Approve Step 3'}
              </button>
              <button type="button" class="btn-approve-inline ${s6Ok ? 'approved-done' : ''} btn-row-step6" data-table="${t}">
                ${s6Ok ? '✓ Step 6 OK' : '✅ Approve Step 6'}
              </button>
            </div>
          </div>
        </td>
        <td style="text-align: center;" class="${currentRound === 1 ? 'col-active-round' : ''}">
          ${renderRoundCell(r1, 1, t)}
        </td>
        <td style="text-align: center;" class="${currentRound === 2 ? 'col-active-round' : ''}">
          ${renderRoundCell(r2, 2, t)}
        </td>
        <td style="text-align: center;" class="${currentRound === 3 ? 'col-active-round' : ''}">
          ${renderRoundCell(r3, 3, t)}
        </td>
        <td style="text-align: center;">
          ${hasAnyScore ? `
            <div class="total-score-box">
              <span class="total-score-num">${total}</span>
              <span class="total-score-denom">/ 30</span>
            </div>
          ` : '<span style="color: var(--text-dim); font-size: 0.85rem;">--</span>'}
        </td>
        <td style="text-align: center;" class="${currentRound === 4 ? 'col-active-tb' : ''}">
          ${renderRoundCell(r4, 4, t)}
        </td>
        <td style="text-align: right;">
          <button type="button" class="btn-primary btn-score-row" data-table="${t}" style="padding: 0.45rem 0.75rem; font-size: 0.82rem;">
            🎯 Score R${currentRound}
          </button>
        </td>
      `;

      // Bind Step 3 & Step 6 Approve buttons
      tr.querySelector('.btn-row-step3').addEventListener('click', () => {
        approveTableCheckpoint(t, 3, false);
      });
      tr.querySelector('.btn-row-step6').addEventListener('click', () => {
        approveTableCheckpoint(t, 6, false);
      });

      // Bind Group / Data modal button
      tr.querySelector('.btn-open-group').addEventListener('click', () => {
        openGroupModal(t);
      });

      // Bind Score button
      tr.querySelector('.btn-score-row').addEventListener('click', () => {
        openScoringModal(t, currentRound);
      });

      // Bind clicking individual round cells to score that round
      tr.querySelectorAll('.round-cell-clickable').forEach(cell => {
        cell.addEventListener('click', () => {
          const rNum = parseInt(cell.dataset.round, 10);
          openScoringModal(t, rNum);
        });
      });

      els.leaderboardBody.appendChild(tr);
    });
  }

  function renderRoundCell(rData, roundNum, tableNum) {
    const targetCm = getTableTarget(tableNum, roundNum);
    const predCm = rData && rData.predictedReleaseHeightCm ? `${Number(rData.predictedReleaseHeightCm).toFixed(1)} cm` : '--';

    let pillHtml = `<span class="round-score-pill waiting">--</span>`;
    if (rData && typeof rData.score === 'number') {
      const pts = rData.score;
      let colorClass = 'score-zero';
      if (pts === 10) colorClass = 'score-10';
      else if (pts >= 8) colorClass = 'score-high';
      else if (pts >= 5) colorClass = 'score-mid';
      else if (pts >= 2) colorClass = 'score-low';
      pillHtml = `<span class="round-score-pill ${colorClass}">${pts} / 10</span>`;
    } else if (rData && (rData.status === 'ready_to_launch' || rData.predictedReleaseHeightCm)) {
      pillHtml = `<span class="round-score-pill ready">Ready</span>`;
    }

    return `
      <div class="round-cell-clickable" data-round="${roundNum}" style="cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 0.2rem;" title="Click to score Round ${roundNum}">
        ${pillHtml}
        <div style="font-family: var(--font-mono); font-size: 0.7rem; color: var(--text-dim); line-height: 1.2;">
          <div>🎯 ${Number(targetCm).toFixed(0)}cm</div>
          <div style="color: var(--accent-purple); font-weight: 700;">📐 ${predCm}</div>
        </div>
      </div>
    `;
  }

  // Group Roster & Calibration Data Modal
  function openGroupModal(tableNum) {
    activeGroupModalTable = tableNum;
    renderGroupModalContent(tableNum);
    if (els.groupModal) els.groupModal.classList.add('active');
  }

  function renderGroupModalContent(tableNum) {
    const sub = tableSubmissions[tableNum] || { tableNumber: tableNum, period: activePeriod, groupMembers: [] };
    const members = getResolvedGroupMembers(sub);
    const groupTitle = members.length > 0
      ? members.map(m => m.name).join(', ')
      : (sub.teamMembers || sub.studentName || 'Student Group');

    if (els.groupModalTitle) {
      els.groupModalTitle.textContent = `👥 ${groupTitle} — Group Roster & Step 8 Data`;
    }

    if (els.groupModalMembersList) {
      els.groupModalMembersList.innerHTML = '';
      if (members.length === 0) {
        els.groupModalMembersList.innerHTML = `<div style="font-size: 0.85rem; color: var(--text-dim);">No group members registered yet. Select students from the roster below to add them.</div>`;
      } else {
        members.forEach((m, idx) => {
          const item = document.createElement('div');
          item.className = 'member-chip';
          item.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span class="member-num">${idx + 1}</span>
              <span class="member-name">${escapeHtml(m.name)}</span>
              <span class="member-id">ID: ${escapeHtml(m.studentId)}</span>
            </div>
            <button type="button" class="btn-remove-member" data-id="${escapeHtml(m.studentId)}">Remove</button>
          `;
          item.querySelector('.btn-remove-member').addEventListener('click', () => {
            removeStudentFromTableGroup(tableNum, m.studentId);
          });
          els.groupModalMembersList.appendChild(item);
        });
      }
    }

    if (els.groupModalCalData) {
      const cal = sub.calibrationData;
      if (!Array.isArray(cal) || cal.length === 0) {
        els.groupModalCalData.textContent = 'No Step 8 calibration trials recorded yet.';
      } else {
        els.groupModalCalData.innerHTML = cal.map((pt, i) =>
          `<div>Trial ${i + 1}: Release Mark = <strong>${Number(pt.s).toFixed(1)} cm</strong> ➔ Floor Distance = <strong>${Number(pt.dx).toFixed(1)} cm</strong></div>`
        ).join('');
      }
    }
  }

  function addStudentToTableGroup(tableNum, studentId, studentName) {
    if (!tableSubmissions[tableNum]) {
      tableSubmissions[tableNum] = {
        tableNumber: tableNum,
        period: activePeriod,
        groupMembers: []
      };
    }
    const sub = tableSubmissions[tableNum];
    const current = getResolvedGroupMembers(sub);
    if (!current.some(m => String(m.studentId) === String(studentId))) {
      current.push({
        studentId: String(studentId),
        name: studentName,
        isPrimary: current.length === 0
      });
    }
    sub.groupMembers = current;
    sub.teamMembers = current.map(m => m.name).join(', ');
    fanOutTableDataToGroupMembers(tableNum);
    renderGroupModalContent(tableNum);
    renderLeaderboard();
  }

  function removeStudentFromTableGroup(tableNum, studentId) {
    const sub = tableSubmissions[tableNum];
    if (!sub) return;
    const current = getResolvedGroupMembers(sub).filter(m => String(m.studentId) !== String(studentId));
    sub.groupMembers = current;
    sub.teamMembers = current.map(m => m.name).join(', ');
    fanOutTableDataToGroupMembers(tableNum);
    renderGroupModalContent(tableNum);
    renderLeaderboard();
  }

  function openScoringModal(tableNumber, roundNumber) {
    activeScoringTable = tableNumber;
    activeScoringRound = roundNumber || currentRound;

    selectModalScoringRound(activeScoringRound);
    els.scoreModal.classList.add('active');
  }

  function selectModalScoringRound(roundNum) {
    activeScoringRound = Math.max(1, Math.min(4, roundNum));

    if (els.modalRoundTabs) {
      els.modalRoundTabs.querySelectorAll('.modal-round-btn').forEach(btn => {
        const r = parseInt(btn.dataset.mround, 10);
        btn.classList.toggle('active', r === activeScoringRound);
      });
    }

    const sub = tableSubmissions[activeScoringTable] || {};
    const rData = getRoundData(sub, activeScoringRound);
    const targetCm = getTableTarget(activeScoringTable, activeScoringRound);
    const members = getResolvedGroupMembers(sub);
    const groupTitle = members.length > 0 ? members.map(m => m.name).join(', ') : (sub.teamMembers || sub.studentName || 'Student Group');

    const rTitle = activeScoringRound === 4 ? '🏆 Tie-Breaker (Round 4)' : `Round ${activeScoringRound} of 3`;
    if (els.modalTableTitle) {
      els.modalTableTitle.textContent = `Score Drop — ${rTitle}`;
    }
    if (els.modalTeamNames) {
      els.modalTeamNames.textContent = `👥 ${groupTitle}`;
    }
    if (els.modalTargetDist) {
      els.modalTargetDist.textContent = `${Number(targetCm).toFixed(1)} cm`;
    }

    let predH = '-- cm';
    if (rData && rData.predictedReleaseHeightCm) {
      predH = `${Number(rData.predictedReleaseHeightCm).toFixed(1)} cm`;
    }
    if (els.modalPredHeight) {
      els.modalPredHeight.textContent = predH;
    }

    if (els.score10Grid) {
      els.score10Grid.querySelectorAll('.btn-acc-score').forEach(btn => {
        btn.classList.remove('selected');
        if (rData && typeof rData.score === 'number' && parseInt(btn.dataset.pts, 10) === rData.score) {
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
    const existingR = sub.rounds[String(r)] || {};
    const roundPayload = {
      targetDistCm: existingR.targetDistCm || getTableTarget(tbl, r),
      predictedReleaseHeightCm: existingR.predictedReleaseHeightCm || null,
      actualLandingCm: actualCm !== null ? actualCm : null,
      errorCm: errorCm !== null ? errorCm : null,
      score: points,
      shotResult: resultType,
      status: 'scored'
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
    sub.score = newTotal;

    if (sub.rounds['4'] && typeof sub.rounds['4'].score === 'number') {
      sub.tieBreakerScore = sub.rounds['4'].score;
    }

    sub.status = 'scored';
    sub.tableNumber = tbl;
    sub.period = activePeriod;
    tableSubmissions[tbl] = sub;

    updateSummaryMetrics();
    renderTargetStrip();
    renderLeaderboard();
    els.scoreModal.classList.remove('active');

    // Fan out round scores and totalScore to every participant in the group!
    fanOutTableDataToGroupMembers(tbl);
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
