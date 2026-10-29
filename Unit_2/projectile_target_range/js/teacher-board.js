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
  let activeConflicts = {}; // studentId -> [list of group objects]
  let orphanSubsetGroups = []; // list of groups that are strict subsets of other active groups

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
    els.btnDisbandModalGroup = document.getElementById('btnDisbandModalGroup');

    // Conflict Banner & Modal
    els.conflictAlertBanner = document.getElementById('conflictAlertBanner');
    els.conflictAlertTitle = document.getElementById('conflictAlertTitle');
    els.conflictAlertDesc = document.getElementById('conflictAlertDesc');
    els.btnAutoResolveOrphans = document.getElementById('btnAutoResolveOrphans');
    els.btnOpenConflictModal = document.getElementById('btnOpenConflictModal');
    els.conflictModal = document.getElementById('conflictModal');
    els.conflictModalPeriod = document.getElementById('conflictModalPeriod');
    els.conflictModalContent = document.getElementById('conflictModalContent');
    els.btnCloseConflictModal = document.getElementById('btnCloseConflictModal');
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

    // Conflict Banner & Modal Buttons
    if (els.btnOpenConflictModal) {
      els.btnOpenConflictModal.addEventListener('click', () => openConflictModal());
    }
    if (els.btnAutoResolveOrphans) {
      els.btnAutoResolveOrphans.addEventListener('click', autoCleanOrphanSubsets);
    }
    if (els.btnCloseConflictModal) {
      els.btnCloseConflictModal.addEventListener('click', () => {
        if (els.conflictModal) els.conflictModal.classList.remove('active');
      });
    }
    if (els.btnDisbandModalGroup) {
      els.btnDisbandModalGroup.addEventListener('click', () => {
        if (activeGroupModalTable) {
          disbandGroup(activeGroupModalTable);
        }
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
          const rawList = [];
          snapshot.forEach(doc => {
            const data = doc.data() || {};
            const hasMembers = Array.isArray(data.groupMembers) && data.groupMembers.length > 0;
            const hasData = Array.isArray(data.dataRows) && data.dataRows.some(r => r.dx !== '' && r.dx !== undefined);
            if (!hasMembers && !data.teamMembers && !data.studentName && !data.currentStep && !hasData) return;
            rawList.push(Object.assign({ docId: doc.id }, data));
          });

          consolidateSubmissions(rawList);
          broadcastClaimedStudents();
          renderApprovalQueue();
          updateSummaryMetrics();
          renderTargetStrip();
          renderLeaderboard();
          renderConflictBanner();
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

  // Consolidate submissions: Deduplicate identical rosters, absorb student subsets & detect cross-group conflicts
  function consolidateSubmissions(rawList) {
    tableSubmissions = {};
    activeConflicts = {};
    orphanSubsetGroups = [];

    // Step 1: Normalize resolved member IDs for each doc
    const prepared = rawList.map(doc => {
      const members = getResolvedGroupMembers(doc);
      const memberIds = [...new Set(members.map(m => String(m.studentId || m.name).trim().toLowerCase()))].sort();
      const rosterSig = memberIds.length > 0 ? memberIds.join('::') : String(doc.docId).toLowerCase();
      const calCount = Array.isArray(doc.calibrationData) ? doc.calibrationData.length : 0;
      const dataRowsFilled = Array.isArray(doc.dataRows) ? doc.dataRows.filter(r => r.dx !== '' && r.dx !== undefined).length : 0;
      const stepNum = Number(doc.currentStep) || 0;
      const totalScore = Math.max(Number(doc.totalScore) || 0, Number(doc.score) || 0);
      const updatedMs = doc.updatedAt && doc.updatedAt.toMillis ? doc.updatedAt.toMillis() : 0;

      return {
        doc: doc,
        members: members,
        memberIds: memberIds,
        rosterSig: rosterSig,
        stepNum: stepNum,
        calCount: calCount,
        dataRowsFilled: dataRowsFilled,
        totalScore: totalScore,
        updatedMs: updatedMs
      };
    });

    // Step 2: Merge docs with the EXACT same roster signature
    const groupsBySig = {};
    prepared.forEach(item => {
      const sig = item.rosterSig;
      if (!groupsBySig[sig]) {
        groupsBySig[sig] = {
          sig: sig,
          memberIds: item.memberIds,
          members: item.members,
          canonicalDoc: Object.assign({}, item.doc),
          linkedDocIds: [item.doc.docId],
          allDocs: [item.doc],
          mergedCount: 1,
          stepNum: item.stepNum,
          totalScore: item.totalScore
        };
      } else {
        const g = groupsBySig[sig];
        g.linkedDocIds.push(item.doc.docId);
        g.allDocs.push(item.doc);
        g.mergedCount++;

        // Select canonical doc with highest progress / most data
        const curCan = g.canonicalDoc;
        const curStep = Number(curCan.currentStep) || 0;
        const curCal = Array.isArray(curCan.calibrationData) ? curCan.calibrationData.length : 0;
        const curRows = Array.isArray(curCan.dataRows) ? curCan.dataRows.filter(r => r.dx !== '' && r.dx !== undefined).length : 0;

        const isBetter = (item.stepNum > curStep) ||
                         (item.stepNum === curStep && item.calCount > curCal) ||
                         (item.stepNum === curStep && item.dataRowsFilled > curRows) ||
                         (item.stepNum === curStep && item.updatedMs > (curCan.updatedAt?.toMillis ? curCan.updatedAt.toMillis() : 0));

        if (isBetter) {
          const s3 = g.canonicalDoc.step3Approved || item.doc.step3Approved;
          const s6 = g.canonicalDoc.step6Approved || item.doc.step6Approved;
          const rounds = Object.assign({}, g.canonicalDoc.rounds || {}, item.doc.rounds || {});
          const totalScore = Math.max(Number(g.canonicalDoc.totalScore) || 0, Number(item.doc.totalScore) || 0);

          g.canonicalDoc = Object.assign({}, item.doc, {
            step3Approved: !!s3,
            step6Approved: !!s6,
            rounds: rounds,
            totalScore: totalScore
          });
          g.members = item.members;
          g.stepNum = item.stepNum;
        } else {
          if (item.doc.step3Approved) g.canonicalDoc.step3Approved = true;
          if (item.doc.step6Approved) g.canonicalDoc.step6Approved = true;
          if (item.doc.rounds) {
            g.canonicalDoc.rounds = Object.assign({}, item.doc.rounds, g.canonicalDoc.rounds || {});
          }
          const itemScore = Number(item.doc.totalScore) || 0;
          if (itemScore > (Number(g.canonicalDoc.totalScore) || 0)) {
            g.canonicalDoc.totalScore = itemScore;
          }
        }
        g.totalScore = Math.max(g.totalScore, item.totalScore);
      }
    });

    let consolidated = Object.values(groupsBySig);

    // Step 3: Smart Subset Absorption (when a student signed in alone or with a subset of their real team)
    // Larger groups absorb smaller subsets if all subset members are contained in the larger group
    const absorbedSigs = new Set();
    consolidated.sort((a, b) => b.memberIds.length - a.memberIds.length);

    for (let i = 0; i < consolidated.length; i++) {
      const gB = consolidated[i];
      if (absorbedSigs.has(gB.sig)) continue;

      for (let j = i + 1; j < consolidated.length; j++) {
        const gA = consolidated[j];
        if (absorbedSigs.has(gA.sig)) continue;

        const isSubset = gA.memberIds.length < gB.memberIds.length &&
                         gA.memberIds.every(id => gB.memberIds.includes(id));

        if (isSubset) {
          // Absorb gA's linked devices and progress into gB
          gB.linkedDocIds = [...new Set([...gB.linkedDocIds, ...gA.linkedDocIds])];
          gB.mergedCount += gA.mergedCount;
          gB.totalScore = Math.max(gB.totalScore, gA.totalScore);

          if (gA.stepNum > gB.stepNum) {
            gB.stepNum = gA.stepNum;
            gB.canonicalDoc.currentStep = gA.stepNum;
            gB.canonicalDoc.maxUnlockedStep = Math.max(gB.canonicalDoc.maxUnlockedStep || 0, gA.canonicalDoc.maxUnlockedStep || 0);
            if (gA.canonicalDoc.rounds) {
              gB.canonicalDoc.rounds = Object.assign({}, gB.canonicalDoc.rounds || {}, gA.canonicalDoc.rounds);
            }
          }
          if (gA.canonicalDoc.step3Approved) gB.canonicalDoc.step3Approved = true;
          if (gA.canonicalDoc.step6Approved) gB.canonicalDoc.step6Approved = true;

          absorbedSigs.add(gA.sig);
        }
      }
    }

    consolidated = consolidated.filter(g => !absorbedSigs.has(g.sig));

    // Step 4: Detect Multi-Group Conflicts (Student claiming membership in >= 2 distinct non-subset groups)
    const stMap = {};
    consolidated.forEach((g, gIdx) => {
      g.memberIds.forEach(stId => {
        if (!stMap[stId]) stMap[stId] = [];
        stMap[stId].push({ group: g, slotIndex: gIdx });
      });
    });

    Object.keys(stMap).forEach(stId => {
      if (stMap[stId].length > 1) {
        activeConflicts[stId] = stMap[stId];
      }
    });

    // Step 5: Assign consolidated groups to slots
    consolidated.sort((a, b) => {
      const nameA = a.members[0] ? a.members[0].name : a.canonicalDoc.docId;
      const nameB = b.members[0] ? b.members[0].name : b.canonicalDoc.docId;
      return nameA.localeCompare(nameB);
    });

    consolidated.forEach((g, idx) => {
      const slot = idx + 1;
      tableSubmissions[slot] = Object.assign({}, g.canonicalDoc, {
        docId: g.canonicalDoc.docId,
        primaryStudentId: g.canonicalDoc.primaryStudentId || g.canonicalDoc.docId,
        groupMembers: g.members,
        linkedDocIds: g.linkedDocIds,
        mergedCount: g.mergedCount,
        tableNumber: slot
      });
    });
  }

  // Broadcast directory of claimed students for this period to the parent assignment doc
  function broadcastClaimedStudents() {
    if (!fbDb || !isTeacher(currentTeacher)) return;
    const claimed = {};
    Object.keys(tableSubmissions).forEach(tKey => {
      const sub = tableSubmissions[tKey];
      if (!sub) return;
      const members = getResolvedGroupMembers(sub);
      const leadName = members[0] ? members[0].name : (sub.studentName || 'Group ' + tKey);
      const leadId = sub.primaryStudentId || (members[0] ? members[0].studentId : sub.docId);
      const allNames = members.map(m => m.name).join(', ');
      const curStep = sub.currentStep || 1;

      members.forEach(m => {
        const sId = String(m.studentId || '').trim();
        if (sId) {
          claimed[sId] = {
            primaryStudentId: String(leadId),
            leadName: leadName,
            groupNames: allNames,
            currentStep: curStep,
            tableNum: parseInt(tKey, 10),
            docId: sub.docId
          };
        }
      });
    });

    const periodClaimedKey = 'claimedStudents_p' + activePeriod;
    fbDb.collection('student_results')
      .doc(ASSIGNMENT_ID)
      .set({ [periodClaimedKey]: claimed }, { merge: true })
      .catch(err => console.warn('Claim broadcast notice:', err.message));
  }

  // Render the top Multi-Group Conflict Banner
  function renderConflictBanner() {
    if (!els.conflictAlertBanner) return;
    const conflictStudentIds = Object.keys(activeConflicts);
    const hasConflicts = conflictStudentIds.length > 0;
    const hasOrphans = orphanSubsetGroups.length > 0;

    if (!hasConflicts && !hasOrphans) {
      els.conflictAlertBanner.style.display = 'none';
      return;
    }

    els.conflictAlertBanner.style.display = 'flex';

    if (els.conflictAlertTitle) {
      els.conflictAlertTitle.textContent = hasConflicts
        ? '⚠️ ' + conflictStudentIds.length + ' Multi-Group ' + (conflictStudentIds.length === 1 ? 'Conflict' : 'Conflicts') + ' Detected!'
        : '⚠️ ' + orphanSubsetGroups.length + ' Inactive Duplicate ' + (orphanSubsetGroups.length === 1 ? 'Group' : 'Groups') + ' Detected';
    }

    if (els.conflictAlertDesc) {
      if (hasConflicts) {
        const names = conflictStudentIds.map(id => (rosterById[id] ? rosterById[id].name : id)).slice(0, 4).join(', ');
        els.conflictAlertDesc.innerHTML = 'Students in multiple groups: <strong>' + escapeHtml(names) + '</strong>' +
          (conflictStudentIds.length > 4 ? ' + ' + (conflictStudentIds.length - 4) + ' more' : '') +
          '. Review or clean up duplicate entries below.';
      } else {
        els.conflictAlertDesc.textContent = 'Some students started an empty group before joining their main team. Clean them up with 1 click.';
      }
    }

    if (els.btnAutoResolveOrphans) {
      if (hasOrphans) {
        els.btnAutoResolveOrphans.style.display = 'inline-flex';
        els.btnAutoResolveOrphans.textContent = '⚡ Clean Up ' + orphanSubsetGroups.length + ' Inactive Duplicate' + (orphanSubsetGroups.length === 1 ? '' : 's');
      } else {
        els.btnAutoResolveOrphans.style.display = 'none';
      }
    }
  }

  // Open the Multi-Group Conflict Resolution Modal
  function openConflictModal(focusStudentId) {
    if (!els.conflictModal || !els.conflictModalContent) return;
    if (els.conflictModalPeriod) {
      els.conflictModalPeriod.textContent = String(activePeriod);
    }

    els.conflictModalContent.innerHTML = '';
    const conflictStudentIds = Object.keys(activeConflicts);

    if (conflictStudentIds.length === 0 && orphanSubsetGroups.length === 0) {
      els.conflictModalContent.innerHTML = '<div style="padding: 1.5rem; text-align: center; color: var(--accent-emerald); font-weight: 800;">✅ No multi-group conflicts in Period ' + activePeriod + '! Every student is in exactly one group.</div>';
      els.conflictModal.classList.add('active');
      return;
    }

    conflictStudentIds.forEach(stId => {
      const stName = rosterById[stId] ? rosterById[stId].name : stId;
      const groupEntries = activeConflicts[stId] || [];

      const card = document.createElement('div');
      card.className = 'conflict-card-item' + (focusStudentId === stId ? ' highlighted' : '');

      let groupsHtml = '<div style="display: flex; flex-direction: column; gap: 0.5rem; margin-top: 0.35rem;">';
      groupEntries.forEach(entry => {
        const g = entry.group;
        const membersStr = g.members.map(m => m.name).join(', ');
        const step = g.canonicalDoc.currentStep || 1;
        const pts = g.canonicalDoc.totalScore || 0;

        let tableKey = null;
        Object.keys(tableSubmissions).forEach(tk => {
          if (tableSubmissions[tk].sig === g.sig || tableSubmissions[tk].docId === g.canonicalDoc.docId) {
            tableKey = tk;
          }
        });

        groupsHtml += `
          <div style="background: var(--bg-card-sub); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 0.55rem 0.75rem; display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; flex-wrap: wrap;">
            <div>
              <div style="font-weight: 800; font-size: 0.9rem; color: var(--text-main);">
                👥 ${escapeHtml(membersStr)}
              </div>
              <div style="font-size: 0.76rem; color: var(--text-dim); display: flex; gap: 0.5rem; align-items: center; margin-top: 0.15rem;">
                <span>Step ${step} of 9</span>
                <span>&bull;</span>
                <span>Score: ${pts} / 30 pts</span>
              </div>
            </div>
            <div style="display: flex; gap: 0.35rem;">
              ${tableKey ? `
                <button type="button" class="btn-secondary btn-remove-st-grp" data-table="${tableKey}" data-stid="${escapeHtml(stId)}" style="font-size: 0.75rem; padding: 0.25rem 0.55rem; color: var(--accent-rose); border-color: var(--accent-rose);">
                  Remove ${escapeHtml(stName.split(' ')[0])}
                </button>
                <button type="button" class="btn-secondary btn-disband-conflict-grp" data-table="${tableKey}" style="font-size: 0.75rem; padding: 0.25rem 0.55rem; color: var(--text-muted);">
                  🗑️ Disband Group
                </button>
              ` : ''}
            </div>
          </div>
        `;
      });
      groupsHtml += '</div>';

      card.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div style="font-weight: 900; font-size: 1rem; color: var(--accent-rose);">
            ⚠️ ${escapeHtml(stName)} <span style="font-size: 0.78rem; color: var(--text-dim); font-family: var(--font-mono); font-weight: 700;">(ID: ${escapeHtml(stId)})</span>
          </div>
          <span style="font-size: 0.75rem; font-weight: 800; background: var(--accent-rose-bg); color: var(--accent-rose); padding: 0.15rem 0.5rem; border-radius: 999px;">
            In ${groupEntries.length} Groups
          </span>
        </div>
        ${groupsHtml}
      `;

      card.querySelectorAll('.btn-remove-st-grp').forEach(btn => {
        btn.addEventListener('click', () => {
          const t = parseInt(btn.dataset.table, 10);
          const sId = btn.dataset.stid;
          removeStudentFromTableGroup(t, sId);
          openConflictModal(sId);
        });
      });

      card.querySelectorAll('.btn-disband-conflict-grp').forEach(btn => {
        btn.addEventListener('click', () => {
          const t = parseInt(btn.dataset.table, 10);
          disbandGroup(t);
          setTimeout(() => openConflictModal(), 200);
        });
      });

      els.conflictModalContent.appendChild(card);
    });

    els.conflictModal.classList.add('active');
  }

  // 1-Click clean up inactive duplicate groups
  function autoCleanOrphanSubsets() {
    if (orphanSubsetGroups.length === 0) return;
    const titles = orphanSubsetGroups.map(g => g.members.map(m => m.name).join(', ')).join('\n• ');
    if (!confirm(`Clean up ${orphanSubsetGroups.length} inactive duplicate groups?\n\n• ${titles}\n\nThese students are already working on more advanced groups. Deleting these duplicate documents will resolve conflicts.`)) {
      return;
    }

    const batch = fbDb.batch();
    orphanSubsetGroups.forEach(g => {
      g.linkedDocIds.forEach(id => {
        if (id) {
          batch.delete(fbDb.collection('student_results').doc(ASSIGNMENT_ID).collection('students').doc(String(id)));
        }
      });
    });

    batch.commit().then(() => {
      if (window.SoundFX) SoundFX.play('fanfare');
    }).catch(err => alert('Error cleaning orphan duplicate groups: ' + err.message));
  }

  // Disband / Delete a single group document (or all linked duplicate docs for that group)
  function disbandGroup(tableNum) {
    if (!fbDb || !isTeacher(currentTeacher)) return;
    const sub = tableSubmissions[tableNum];
    if (!sub) return;

    const members = getResolvedGroupMembers(sub);
    const groupTitle = members.length > 0 ? members.map(m => m.name).join(', ') : (sub.teamMembers || 'Group ' + tableNum);

    if (!confirm(`Are you sure you want to disband and delete "${groupTitle}"?\n\nThis will remove their progress from Firestore so students can restart or join another team.`)) {
      return;
    }

    const docsToDelete = (Array.isArray(sub.linkedDocIds) && sub.linkedDocIds.length > 0)
      ? sub.linkedDocIds
      : [sub.docId || sub.primaryStudentId];

    const batch = fbDb.batch();
    docsToDelete.forEach(id => {
      if (id) {
        batch.delete(fbDb.collection('student_results').doc(ASSIGNMENT_ID).collection('students').doc(String(id)));
      }
    });

    const pKey = sub.primaryStudentId || sub.docId;
    const periodApprovalsKey = 'approvals_p' + activePeriod;
    const tableKey = 'table_' + tableNum;
    batch.set(fbDb.collection('student_results').doc(ASSIGNMENT_ID), {
      [periodApprovalsKey]: {
        [pKey]: firebase.firestore.FieldValue.delete(),
        [tableKey]: firebase.firestore.FieldValue.delete()
      }
    }, { merge: true });

    batch.commit().then(() => {
      if (window.SoundFX) SoundFX.play('buzz');
      if (els.groupModal) els.groupModal.classList.remove('active');
      delete tableSubmissions[tableNum];
      renderApprovalQueue();
      updateSummaryMetrics();
      renderTargetStrip();
      renderLeaderboard();
      renderConflictBanner();
    }).catch(err => alert('Error disbanding group: ' + err.message));
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
    const members = getResolvedGroupMembers(sub);
    const primaryKey = sub.primaryStudentId || sub.docId || null;

    if (primaryKey) {
      if (!tableApprovals[primaryKey]) tableApprovals[primaryKey] = {};
      if (stepNum === 3) tableApprovals[primaryKey].step3Approved = true;
      if (stepNum === 6) tableApprovals[primaryKey].step6Approved = true;
    }

    members.forEach(m => {
      const sId = String(m.studentId || '').trim();
      if (sId) {
        if (!tableApprovals[sId]) tableApprovals[sId] = {};
        if (stepNum === 3) tableApprovals[sId].step3Approved = true;
        if (stepNum === 6) tableApprovals[sId].step6Approved = true;
      }
    });

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

    // Target doc IDs to write: primary docId (if any) + every linkedDocId + every resolved member's studentId
    const targetDocIds = new Set();
    if (sub.docId) targetDocIds.add(sub.docId);
    if (Array.isArray(sub.linkedDocIds)) {
      sub.linkedDocIds.forEach(id => targetDocIds.add(String(id).trim()));
    }
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
        step3Approved: !!(sub.step3Approved || (primaryDriverId && tableApprovals[primaryDriverId] && tableApprovals[primaryDriverId].step3Approved)),
        step6Approved: !!(sub.step6Approved || (primaryDriverId && tableApprovals[primaryDriverId] && tableApprovals[primaryDriverId].step6Approved)),
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
      const app = (pKey && tableApprovals[pKey]) || {};
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
      const app = (pKey && tableApprovals[pKey]) || {};
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
      const app = (pKey && tableApprovals[pKey]) || {};
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
        ? `<div class="group-member-pills">` + members.map(m => {
            const hasConflict = !!(m.studentId && activeConflicts[m.studentId]);
            const conflictClass = hasConflict ? 'conflict' : (m.verified ? 'verified' : '');
            const conflictTitle = hasConflict
              ? `⚠️ Multi-Group Conflict: ${m.name} is in ${activeConflicts[m.studentId].length} groups! Click to resolve.`
              : `Student ID: ${m.studentId}`;
            const labelText = hasConflict
              ? `⚠️ ${m.name} (In ${activeConflicts[m.studentId].length} Groups)`
              : `${m.verified ? '✓' : '•'} ${m.name}`;

            return `<span class="group-member-tag ${conflictClass}" data-conflict-st="${hasConflict ? escapeHtml(m.studentId) : ''}" title="${escapeHtml(conflictTitle)}" style="${hasConflict ? 'cursor: pointer;' : ''}">${escapeHtml(labelText)}</span>`;
          }).join('') + `</div>`
        : '';

      const mergedBadgeHtml = (sub.mergedCount && sub.mergedCount > 1)
        ? `<span class="badge-merged" title="Consolidated ${sub.mergedCount} student Chromebooks for this group">⚡ ${sub.mergedCount} Devices Synced</span>`
        : '';

      tr.innerHTML = `
        <td>
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.4rem;">
            <div style="display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap;">
              <span style="font-weight: 900; font-size: 1rem; color: var(--text-main);">👥 ${escapeHtml(groupTitle)}</span>
              ${mergedBadgeHtml}
            </div>
            <div style="display: flex; align-items: center; gap: 0.3rem;">
              <button type="button" class="btn-mini-action btn-open-group" data-table="${t}" style="white-space: nowrap;">
                Roster (${members.length}) / Data (${calCount})
              </button>
              <button type="button" class="btn-disband-row" data-table="${t}" title="Disband or delete this group">
                🗑️
              </button>
            </div>
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

      // Bind Row Disband button
      const disbandBtn = tr.querySelector('.btn-disband-row');
      if (disbandBtn) {
        disbandBtn.addEventListener('click', () => {
          disbandGroup(t);
        });
      }

      // Bind clicking conflict tags to open conflict modal
      tr.querySelectorAll('[data-conflict-st]').forEach(tag => {
        const sId = tag.dataset.conflictSt;
        if (sId) {
          tag.addEventListener('click', () => {
            openConflictModal(sId);
          });
        }
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
