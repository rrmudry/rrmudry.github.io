// Student Guided Slideshow & Target Range Application Logic
// Step-by-Step Horizontal Projectile Ramp Build with Teacher Approval Checkpoints (Steps 3 & 6)
// Single-Chromebook Group Member Tracking + Real-Time Firestore Sync
// Strictly Zero LaTeX Notation

(function () {
  'use strict';

  const ASSIGNMENT_ID = 'unit2_projectile_target_range';
  const STORAGE_KEY = 'projectile_ramp_slideshow_v2';

  let state = {
    currentStep: 0,      // 0 = Team Setup, 1..9 = Lab Steps
    maxUnlockedStep: 0,  // Highest step unlocked so far
    period: 1,
    tableNum: 1,
    groupMembers: [],    // [{ studentId: '123456', name: 'Student Name', isPrimary: true }]
    step1Checks: [false, false, false, false, false],
    step3Requested: false,
    step3Approved: false,
    step6Requested: false,
    step6Approved: false,
    dataRows: [
      { h: 10, dx: '' },
      { h: 20, dx: '' },
      { h: 30, dx: '' },
      { h: 40, dx: '' },
      { h: 50, dx: '' },
      { h: 60, dx: '' }
    ],
    activeRound: 1,      // Round currently focused on graph (1, 2, 3, 4)
    rounds: {
      1: { targetDistCm: '', studentReleaseHeightCm: '', score: null, shotResult: null, status: 'pending' },
      2: { targetDistCm: '', studentReleaseHeightCm: '', score: null, shotResult: null, status: 'pending' },
      3: { targetDistCm: '', studentReleaseHeightCm: '', score: null, shotResult: null, status: 'pending' },
      4: { targetDistCm: '', studentReleaseHeightCm: '', score: null, shotResult: null, status: 'pending' }
    },
    totalScore: 0,
    k: null
  };

  let currentUser = null;
  let fbDb = null;
  let unsubscribeStudentDoc = null;
  let unsubscribeConfigDoc = null;
  let assignmentConfigData = null;
  let hoverInspector = null;

  const els = {};

  function init() {
    cacheElements();
    loadLocalState();
    bindEvents();
    initFirebase();
    renderAll();
  }

  function cacheElements() {
    els.tableTeamPill = document.getElementById('tableTeamPill');
    els.btnFontScale = document.getElementById('btnFontScale');
    els.themeToggle = document.getElementById('themeToggle');
    els.userBadge = document.getElementById('userBadge');
    els.btnLogin = document.getElementById('btnLogin');

    els.stepRailBar = document.getElementById('stepRailBar');
    els.stepRailInner = document.getElementById('stepRailInner');

    // Slide 0: Auth & Team Builder
    els.authGatePrompt = document.getElementById('authGatePrompt');
    els.btnGateSignIn = document.getElementById('btnGateSignIn');
    els.teamBuilderPanel = document.getElementById('teamBuilderPanel');
    els.periodSelect = document.getElementById('periodSelect');
    els.rosterPeriodHint = document.getElementById('rosterPeriodHint');
    els.tableSelect = document.getElementById('tableSelect');
    els.memberCountBadge = document.getElementById('memberCountBadge');
    els.groupMembersList = document.getElementById('groupMembersList');
    els.inputTeammateName = document.getElementById('inputTeammateName');
    els.inputTeammateId = document.getElementById('inputTeammateId');
    els.btnAddTeammate = document.getElementById('btnAddTeammate');
    els.teammateLookupStatus = document.getElementById('teammateLookupStatus');
    els.btnStartStep1 = document.getElementById('btnStartStep1');

    // Step 1
    els.step1Checkboxes = document.querySelectorAll('.chk-step1');
    els.btnNextFrom1 = document.getElementById('btnNextFrom1');

    // Step 3 Gate
    els.gateBoxStep3 = document.getElementById('gateBoxStep3');
    els.iconGate3 = document.getElementById('iconGate3');
    els.titleGate3 = document.getElementById('titleGate3');
    els.descGate3 = document.getElementById('descGate3');
    els.btnRequestStep3 = document.getElementById('btnRequestStep3');
    els.btnNextFrom3 = document.getElementById('btnNextFrom3');

    // Step 6 Gate
    els.gateBoxStep6 = document.getElementById('gateBoxStep6');
    els.iconGate6 = document.getElementById('iconGate6');
    els.titleGate6 = document.getElementById('titleGate6');
    els.descGate6 = document.getElementById('descGate6');
    els.btnRequestStep6 = document.getElementById('btnRequestStep6');
    els.btnNextFrom6 = document.getElementById('btnNextFrom6');

    // Step 8 Data Table
    els.step8DataStatus = document.getElementById('step8DataStatus');
    els.btnAddRow = document.getElementById('btnAddRow');
    els.calTableBody = document.getElementById('calTableBody');
    els.btnNextFrom8 = document.getElementById('btnNextFrom8');

    // Step 9 Graph & Rounds
    els.plotCanvas = document.getElementById('plotCanvas');
    els.readoutValues = document.getElementById('readoutValues');
    els.graphFeedbackMsg = document.getElementById('graphFeedbackMsg');
    els.step9TeamSummary = document.getElementById('step9TeamSummary');
    els.studentTotalScore = document.getElementById('studentTotalScore');
  }

  function loadLocalState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          state = Object.assign(state, parsed);
        }
      }
    } catch (e) {
      console.warn('Could not load local state', e);
    }

    // Ensure valid array of dataRows without pre-filled dummy dx values
    if (!Array.isArray(state.dataRows) || state.dataRows.length === 0) {
      state.dataRows = [
        { h: 10, dx: '' },
        { h: 20, dx: '' },
        { h: 30, dx: '' },
        { h: 40, dx: '' },
        { h: 50, dx: '' },
        { h: 60, dx: '' }
      ];
    }
    if (!Array.isArray(state.step1Checks) || state.step1Checks.length !== 5) {
      state.step1Checks = [false, false, false, false, false];
    }
    if (!Array.isArray(state.groupMembers)) {
      state.groupMembers = [];
    }
    if (!state.rounds) {
      state.rounds = {
        1: { targetDistCm: '', studentReleaseHeightCm: '', score: null, shotResult: null, status: 'pending' },
        2: { targetDistCm: '', studentReleaseHeightCm: '', score: null, shotResult: null, status: 'pending' },
        3: { targetDistCm: '', studentReleaseHeightCm: '', score: null, shotResult: null, status: 'pending' },
        4: { targetDistCm: '', studentReleaseHeightCm: '', score: null, shotResult: null, status: 'pending' }
      };
    }
  }

  function saveLocalState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {}
  }

  function initFirebase() {
    if (typeof firebase === 'undefined' || !firebase.apps || !firebase.apps.length) return;
    fbDb = firebase.firestore();
    listenToAssignmentConfig();

    firebase.auth().onAuthStateChanged(user => {
      if (user) {
        const email = (user.email || '').toLowerCase();
        const isAllowed = email.endsWith('@orangeusd.org') ||
                          email === 'ryan.mudry@gmail.com' ||
                          email === 'ryanmudry@gmail.com' ||
                          email === 'rmudry@orangeusd.org';
        if (!isAllowed) {
          alert('Please sign in using your school @orangeusd.org Google account.');
          firebase.auth().signOut();
          return;
        }
        currentUser = user;
        handleUserSignedIn(user);
      } else {
        currentUser = null;
        if (unsubscribeStudentDoc) {
          unsubscribeStudentDoc();
          unsubscribeStudentDoc = null;
        }
        state.currentStep = 0;
        renderAll();
      }
    });
  }

  function triggerGoogleSignIn() {
    if (typeof firebase === 'undefined' || !firebase.apps.length) return;
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ hd: 'orangeusd.org', prompt: 'select_account' });
    firebase.auth().signInWithPopup(provider).catch(err => {
      console.error('Sign-in error:', err);
      alert('Google Sign-In error: ' + err.message);
    });
  }

  function handleUserSignedIn(user) {
    const email = (user.email || '').toLowerCase();
    const studentId = email.split('@')[0];
    const displayName = (user.displayName && !/^\d+$/.test(user.displayName)) ? user.displayName : 'Signed-In Student';

    // Ensure primary signed-in user is in groupMembers[0]
    const existingIdx = state.groupMembers.findIndex(m => String(m.studentId).toLowerCase() === studentId || m.isPrimary);
    if (existingIdx === -1) {
      state.groupMembers.unshift({
        studentId: studentId,
        name: displayName,
        isPrimary: true
      });
    } else {
      state.groupMembers[existingIdx].studentId = studentId;
      state.groupMembers[existingIdx].isPrimary = true;
      if (!state.groupMembers[existingIdx].name || /^\d+$/.test(state.groupMembers[existingIdx].name)) {
        state.groupMembers[existingIdx].name = displayName;
      }
    }

    // Look up own roster doc to auto-detect Period and official Full Name
    if (fbDb) {
      fbDb.collection('roster').doc(studentId).get().then(doc => {
        if (doc.exists) {
          const rData = doc.data() || {};
          const fullName = rData.name || rData.full_name || rData.student_name || [rData.firstName, rData.lastName].filter(Boolean).join(' ') || displayName;
          const pVal = rData.class_period !== undefined ? rData.class_period : rData.period;
          if (pVal !== undefined && pVal !== null && pVal !== 'T') {
            state.period = parseInt(pVal, 10) || 0;
            if (els.periodSelect) els.periodSelect.value = String(state.period);
            if (els.rosterPeriodHint) {
              els.rosterPeriodHint.textContent = `✓ Auto-detected Period ${state.period}`;
            }
          }
          const primary = state.groupMembers.find(m => String(m.studentId).toLowerCase() === studentId || m.isPrimary);
          if (primary && fullName) {
            primary.name = fullName;
          }
          saveLocalState();
          updateAuthHeader();
          renderHeaderBadge();
          renderGroupMembers();
          syncProgressToFirestore();
        }
      }).catch(() => {});
    }

    // Attach real-time listener to own student_results document
    attachStudentDocListener(studentId);
    saveLocalState();
    renderAll();
  }

  function attachStudentDocListener(studentId) {
    if (!fbDb || !studentId) return;
    if (unsubscribeStudentDoc) unsubscribeStudentDoc();

    unsubscribeStudentDoc = fbDb.collection('student_results')
      .doc(ASSIGNMENT_ID)
      .collection('students')
      .doc(studentId)
      .onSnapshot(doc => {
        if (!doc.exists) return;
        // Ignore local echo snapshots triggered by the student's own keystrokes
        if (doc.metadata && doc.metadata.hasPendingWrites) return;
        const data = doc.data() || {};

        if (typeof data.tableNumber === 'number') {
          state.tableNum = data.tableNumber;
          if (els.tableSelect) els.tableSelect.value = String(state.tableNum);
        }
        if (typeof data.period === 'number') {
          state.period = data.period;
          if (els.periodSelect) els.periodSelect.value = String(state.period);
        }
        if (Array.isArray(data.groupMembers) && data.groupMembers.length > 0) {
          state.groupMembers = data.groupMembers;
        }
        const isTypingInTable = els.calTableBody && els.calTableBody.contains(document.activeElement);
        if (!isTypingInTable && Array.isArray(data.dataRows) && data.dataRows.length > 0) {
          state.dataRows = data.dataRows;
          renderCalibrationTable();
          recalculateCurve();
        }

        // Check Teacher Approval Checkpoints!
        const wasStep3 = state.step3Approved;
        const wasStep6 = state.step6Approved;

        if (data.step3Approved === true) state.step3Approved = true;
        if (data.step6Approved === true) state.step6Approved = true;

        if (!wasStep3 && state.step3Approved && window.SoundFX) {
          SoundFX.play('fanfare');
        }
        if (!wasStep6 && state.step6Approved && window.SoundFX) {
          SoundFX.play('fanfare');
        }

        // Teacher can also advance or unlock a step directly
        if (typeof data.teacherUnlockedStep === 'number' && data.teacherUnlockedStep > state.maxUnlockedStep) {
          state.maxUnlockedStep = data.teacherUnlockedStep;
        }

        // Sync Round Scores & Teacher-Assigned Targets
        if (data.rounds && typeof data.rounds === 'object') {
          for (let r = 1; r <= 4; r++) {
            const incoming = data.rounds[r] || data.rounds[String(r)];
            if (incoming) {
              if (!state.rounds[r]) state.rounds[r] = {};
              if (incoming.score !== undefined && incoming.score !== null) {
                state.rounds[r].score = incoming.score;
                state.rounds[r].status = 'scored';
              }
              if (incoming.targetDistCm && state.rounds[r].status !== 'scored') {
                state.rounds[r].targetDistCm = incoming.targetDistCm;
              }
              if (incoming.predictedReleaseHeightCm && !state.rounds[r].studentReleaseHeightCm) {
                state.rounds[r].studentReleaseHeightCm = incoming.predictedReleaseHeightCm;
              }
            }
          }
        }

        saveLocalState();
        renderAll();
      }, err => console.warn('Student doc listener notice:', err.message));
  }

  function listenToAssignmentConfig() {
    if (!fbDb) return;
    if (unsubscribeConfigDoc) unsubscribeConfigDoc();

    unsubscribeConfigDoc = fbDb.collection('student_results')
      .doc(ASSIGNMENT_ID)
      .onSnapshot(doc => {
        if (!doc.exists) return;
        assignmentConfigData = doc.data() || {};
        applyConfigUpdates();
      }, err => console.warn('Config listener notice:', err.message));
  }

  function applyConfigUpdates() {
    if (!assignmentConfigData) return;

    // 1. Check group-level approvals broadcast by Teacher Dashboard
    const email = (currentUser && currentUser.email ? currentUser.email : '').toLowerCase();
    const myId = email ? email.split('@')[0] : '';
    const approvalsKey = `approvals_p${state.period}`;
    const periodApprovals = assignmentConfigData[approvalsKey] || {};
    const grpApproval = (myId && periodApprovals[myId]) || periodApprovals[`table_${state.tableNum}`] || {};

    const wasStep3 = state.step3Approved;
    const wasStep6 = state.step6Approved;

    if (grpApproval.step3 === true || grpApproval.step3Approved === true) state.step3Approved = true;
    if (grpApproval.step6 === true || grpApproval.step6Approved === true) state.step6Approved = true;

    if ((!wasStep3 && state.step3Approved) || (!wasStep6 && state.step6Approved)) {
      if (window.SoundFX) SoundFX.play('fanfare');
    }

    // 2. Check teacher-broadcast target distances for Rounds 1–4
    const periodTargetsKey = `tableTargets_p${state.period}`;
    const periodTargets = assignmentConfigData[periodTargetsKey] || assignmentConfigData.tableTargets || {};
    const roundTargets = assignmentConfigData.roundTargets || {};

    for (let r = 1; r <= 4; r++) {
      const groupKey = myId ? `p${state.period}_r${r}_group_${myId}` : '';
      const specificKey = `p${state.period}_r${r}_table_${state.tableNum}`;
      const roundKey = `r${r}_table_${state.tableNum}`;
      let assigned = null;

      if (groupKey && typeof periodTargets[groupKey] === 'number') {
        assigned = periodTargets[groupKey];
      } else if (typeof periodTargets[specificKey] === 'number') {
        assigned = periodTargets[specificKey];
      } else if (typeof periodTargets[roundKey] === 'number') {
        assigned = periodTargets[roundKey];
      } else if (typeof roundTargets[r] === 'number' || typeof roundTargets[String(r)] === 'number') {
        assigned = roundTargets[r] || roundTargets[String(r)];
      }

      if (assigned !== null && (!state.rounds[r].targetDistCm || state.rounds[r].status !== 'scored')) {
        state.rounds[r].targetDistCm = assigned;
      }
    }

    saveLocalState();
    renderAll();
  }

  function bindEvents() {
    // Sign-in buttons
    if (els.btnLogin) {
      els.btnLogin.addEventListener('click', () => {
        if (currentUser) {
          firebase.auth().signOut();
        } else {
          triggerGoogleSignIn();
        }
      });
    }
    if (els.btnGateSignIn) {
      els.btnGateSignIn.addEventListener('click', triggerGoogleSignIn);
    }

    // Theme & Font Scale
    if (els.themeToggle) {
      els.themeToggle.addEventListener('click', () => {
        document.documentElement.classList.toggle('theme-dark');
        renderPlot();
      });
    }
    if (els.btnFontScale) {
      els.btnFontScale.addEventListener('click', () => {
        const docEl = document.documentElement;
        if (docEl.classList.contains('font-projector-lg')) {
          docEl.classList.remove('font-projector-lg');
          docEl.classList.remove('font-projector');
        } else if (docEl.classList.contains('font-projector')) {
          docEl.classList.add('font-projector-lg');
        } else {
          docEl.classList.add('font-projector');
        }
        renderPlot();
      });
    }

    // Period & Table Select
    if (els.periodSelect) {
      els.periodSelect.addEventListener('change', () => {
        state.period = parseInt(els.periodSelect.value, 10) || 0;
        saveLocalState();
        applyConfigUpdates();
        syncProgressToFirestore();
      });
    }
    if (els.tableSelect) {
      els.tableSelect.addEventListener('change', () => {
        state.tableNum = parseInt(els.tableSelect.value, 10) || 1;
        saveLocalState();
        applyConfigUpdates();
        renderHeaderBadge();
        syncProgressToFirestore();
      });
    }

    // Add Teammate
    if (els.btnAddTeammate) {
      els.btnAddTeammate.addEventListener('click', addTeammateFromInputs);
    }
    if (els.inputTeammateId) {
      els.inputTeammateId.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          e.preventDefault();
          addTeammateFromInputs();
        }
      });
    }
    if (els.inputTeammateName) {
      els.inputTeammateName.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          e.preventDefault();
          addTeammateFromInputs();
        }
      });
    }

    // Start Step 1 Button
    if (els.btnStartStep1) {
      els.btnStartStep1.addEventListener('click', () => {
        if (!currentUser) {
          alert('Please sign in with your @orangeusd.org Google account first.');
          return;
        }
        if (state.groupMembers.length === 0) {
          alert('Please make sure at least 1 group member is listed.');
          return;
        }
        unlockAndGoToStep(1);
      });
    }

    // Step 1 Materials Checkboxes
    els.step1Checkboxes.forEach((chk, idx) => {
      chk.checked = !!state.step1Checks[idx];
      chk.addEventListener('change', () => {
        state.step1Checks[idx] = chk.checked;
        saveLocalState();
        updateStep1Button();
      });
    });

    if (els.btnNextFrom1) {
      els.btnNextFrom1.addEventListener('click', () => {
        if (state.step1Checks.every(Boolean)) {
          unlockAndGoToStep(2);
        }
      });
    }

    // Generic data-goto buttons
    document.querySelectorAll('[data-goto]').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetStep = parseInt(btn.getAttribute('data-goto'), 10);
        if (!isNaN(targetStep)) {
          unlockAndGoToStep(targetStep);
        }
      });
    });

    // Step 3 Teacher Approval Request
    if (els.btnRequestStep3) {
      els.btnRequestStep3.addEventListener('click', () => {
        state.step3Requested = true;
        saveLocalState();
        renderApprovalGates();
        syncProgressToFirestore('waiting_step_3');
        if (window.SoundFX) SoundFX.play('click');
      });
    }
    if (els.btnNextFrom3) {
      els.btnNextFrom3.addEventListener('click', () => {
        if (state.step3Approved) {
          unlockAndGoToStep(4);
        }
      });
    }

    // Step 6 Teacher Approval Request
    if (els.btnRequestStep6) {
      els.btnRequestStep6.addEventListener('click', () => {
        state.step6Requested = true;
        saveLocalState();
        renderApprovalGates();
        syncProgressToFirestore('waiting_step_6');
        if (window.SoundFX) SoundFX.play('click');
      });
    }
    if (els.btnNextFrom6) {
      els.btnNextFrom6.addEventListener('click', () => {
        if (state.step6Approved) {
          unlockAndGoToStep(7);
        }
      });
    }

    // Step 8 Add Row & Next Button
    if (els.btnAddRow) {
      els.btnAddRow.addEventListener('click', () => {
        const lastH = state.dataRows.length > 0 ? (Number(state.dataRows[state.dataRows.length - 1].h) || 0) : 0;
        state.dataRows.push({ h: lastH + 10, dx: '' });
        saveLocalState();
        renderCalibrationTable(true);
        recalculateCurve();
        renderStepRail();
      });
    }
    if (els.btnNextFrom8) {
      els.btnNextFrom8.addEventListener('click', () => {
        if (getValidPairs().length >= 4) {
          unlockAndGoToStep(9);
        }
      });
    }

    // Step 9 Round Inputs & Lock-In Buttons
    document.querySelectorAll('.round-entry-card').forEach(card => {
      card.addEventListener('click', () => {
        const r = parseInt(card.dataset.round, 10);
        if (r && state.activeRound !== r) {
          state.activeRound = r;
          renderStep9Rounds();
          renderPlot();
        }
      });
    });

    document.querySelectorAll('.round-target-inp').forEach(inp => {
      inp.addEventListener('focus', () => {
        const r = parseInt(inp.dataset.round, 10);
        if (r) {
          state.activeRound = r;
          renderStep9Rounds();
          renderPlot();
        }
      });
      inp.addEventListener('input', () => {
        const r = parseInt(inp.dataset.round, 10);
        const val = inp.value === '' ? '' : parseFloat(inp.value);
        state.rounds[r].targetDistCm = val;
        state.activeRound = r;
        saveLocalState();
        renderPlot();
      });
    });

    document.querySelectorAll('.round-release-inp').forEach(inp => {
      inp.addEventListener('focus', () => {
        const r = parseInt(inp.dataset.round, 10);
        if (r) {
          state.activeRound = r;
          renderStep9Rounds();
          renderPlot();
        }
      });
      inp.addEventListener('input', () => {
        const r = parseInt(inp.dataset.round, 10);
        const val = inp.value === '' ? '' : parseFloat(inp.value);
        state.rounds[r].studentReleaseHeightCm = val;
        state.activeRound = r;
        saveLocalState();
        renderPlot();
      });
    });

    document.querySelectorAll('.btn-lock-round').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const r = parseInt(btn.dataset.round, 10);
        lockInRoundPrediction(r);
      });
    });

    // Graph Canvas Pointer / Touch Tracer
    if (els.plotCanvas) {
      const handlePointer = e => {
        const rect = els.plotCanvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        updateInspectorAt(clientX - rect.left, clientY - rect.top, rect.width, rect.height);
      };
      els.plotCanvas.addEventListener('mousemove', handlePointer);
      els.plotCanvas.addEventListener('touchmove', handlePointer, { passive: true });

      const clearInspector = () => {
        hoverInspector = null;
        if (els.readoutValues) {
          els.readoutValues.textContent = 'Move cursor or finger across graph to trace values';
        }
        renderPlot();
      };
      els.plotCanvas.addEventListener('mouseleave', clearInspector);
      els.plotCanvas.addEventListener('touchend', clearInspector);
    }

    window.addEventListener('resize', () => {
      if (state.currentStep === 9) renderPlot();
    });
  }

  function getRosterCandidates() {
    if (!assignmentConfigData || !assignmentConfigData.rosterDirectory) return [];
    const dir = assignmentConfigData.rosterDirectory;
    const email = (currentUser && currentUser.email ? currentUser.email : '').toLowerCase();
    const isTeacherUser = email === 'rmudry@orangeusd.org' || email === 'ryan.mudry@gmail.com' || email === 'ryanmudry@gmail.com';

    const pKey = String(state.period);
    if (!isTeacherUser && Array.isArray(dir[pKey]) && dir[pKey].length > 0) {
      return dir[pKey];
    }
    // Fallback or teacher mode: combine all periods 0-6
    const all = [];
    Object.keys(dir).forEach(k => {
      if (Array.isArray(dir[k])) {
        dir[k].forEach(st => all.push(st));
      }
    });
    return all;
  }

  function populateClassmateSuggestions() {
    const dl = document.getElementById('classmateSuggestions');
    if (!dl) return;
    const candidates = getRosterCandidates();
    const myEmail = (currentUser && currentUser.email ? currentUser.email : '').toLowerCase();
    const myId = myEmail ? myEmail.split('@')[0] : '';

    dl.innerHTML = '';
    candidates.forEach(st => {
      if (String(st.id) === myId) return;
      if (state.groupMembers.some(m => String(m.studentId) === String(st.id) || String(m.name).toLowerCase() === String(st.name).toLowerCase())) {
        return;
      }
      const opt = document.createElement('option');
      opt.value = st.name;
      dl.appendChild(opt);
    });
  }

  function addTeammateFromInputs() {
    const rawName = (els.inputTeammateName.value || '').trim();

    if (!rawName || rawName.length < 2) {
      alert('Please enter your classmate\'s First and Last Name.');
      els.inputTeammateName.focus();
      return;
    }

    const candidates = getRosterCandidates();
    if (candidates.length === 0) {
      if (els.teammateLookupStatus) {
        els.teammateLookupStatus.innerHTML = `<span style="color: var(--accent-rose); font-weight: 800;">⏳ Loading class roster from Firestore... please try again in a moment.</span>`;
      }
      return;
    }

    const norm = rawName.toLowerCase();
    // 1. Check exact full_name match (case-insensitive)
    let matches = candidates.filter(st => String(st.name || '').trim().toLowerCase() === norm);
    // 2. If no exact match, check partial match ONLY if it contains both first & last name or uniquely identifies 1 student
    if (matches.length === 0 && norm.length >= 3) {
      matches = candidates.filter(st => String(st.name || '').trim().toLowerCase().includes(norm));
    }

    if (matches.length === 0) {
      if (els.teammateLookupStatus) {
        els.teammateLookupStatus.innerHTML = `<span style="color: var(--accent-rose); font-weight: 800;">❌ "${escapeHtml(rawName)}" was not found on the Firestore class roster. Please check the spelling or pick from the suggestions!</span>`;
      }
      els.inputTeammateName.focus();
      return;
    }

    if (matches.length > 1) {
      const namesList = matches.slice(0, 4).map(m => m.name).join(', ');
      if (els.teammateLookupStatus) {
        els.teammateLookupStatus.innerHTML = `<span style="color: var(--accent-orange); font-weight: 800;">⚠️ Multiple students match "${escapeHtml(rawName)}" (${escapeHtml(namesList)}). Please type their full First &amp; Last Name!</span>`;
      }
      els.inputTeammateName.focus();
      return;
    }

    const matched = matches[0];
    const exists = state.groupMembers.some(
      m => String(m.studentId) === String(matched.id) || String(m.name || '').trim().toLowerCase() === matched.name.toLowerCase()
    );
    if (exists) {
      if (els.teammateLookupStatus) {
        els.teammateLookupStatus.innerHTML = `<span style="color: var(--accent-orange); font-weight: 800;">ℹ️ ${escapeHtml(matched.name)} is already in your group list.</span>`;
      }
      return;
    }

    state.groupMembers.push({
      studentId: String(matched.id),
      name: matched.name,
      isPrimary: false,
      rosterVerified: true
    });

    els.inputTeammateName.value = '';
    if (els.inputTeammateId) els.inputTeammateId.value = '';
    if (els.teammateLookupStatus) {
      els.teammateLookupStatus.innerHTML = `<span style="color: var(--accent-emerald); font-weight: 800;">✓ Linked to Firestore Roster: ${escapeHtml(matched.name)}</span>`;
    }

    saveLocalState();
    populateClassmateSuggestions();
    renderGroupMembers();
    syncProgressToFirestore();
  }

  function unlockAndGoToStep(stepNum) {
    // Enforce hard teacher approval locks on Steps 3 and 6
    if (stepNum > 3 && !state.step3Approved) {
      alert('Pause! Mr. Mudry must approve your Step 3 curved ramp bottom before your group can move to Step 4.');
      stepNum = 3;
    }
    if (stepNum > 6 && !state.step6Approved) {
      alert('Pause! Mr. Mudry must approve your Step 6 ramp & taped floor meter stick before your group can move to Step 7.');
      stepNum = 6;
    }
    if (stepNum === 9 && getValidPairs().length < 4) {
      alert('Please complete at least 4 calibration trials in your Step 8 data table first.');
      stepNum = 8;
    }

    state.currentStep = stepNum;
    if (stepNum > state.maxUnlockedStep) {
      state.maxUnlockedStep = stepNum;
    }
    saveLocalState();
    renderAll();
    syncProgressToFirestore();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderAll() {
    updateAuthHeader();
    renderHeaderBadge();
    renderStepRail();
    renderSlideVisibility();
    renderGroupMembers();
    updateStep1Button();
    renderApprovalGates();
    renderCalibrationTable();
    recalculateCurve();
    renderStep9Rounds();
    if (state.currentStep === 9) {
      setTimeout(() => renderPlot(), 30);
    }
  }

  function updateAuthHeader() {
    const teacherLink = document.getElementById('btnTeacherDashLink');
    if (currentUser) {
      const email = (currentUser.email || '').toLowerCase();
      const isTeacherUser = email === 'rmudry@orangeusd.org' || email === 'ryan.mudry@gmail.com' || email === 'ryanmudry@gmail.com';
      if (teacherLink) teacherLink.style.display = isTeacherUser ? 'inline-flex' : 'none';

      const primary = state.groupMembers.find(m => m.isPrimary) || state.groupMembers[0];
      const safeName = (primary && primary.name && !/^\d+$/.test(primary.name))
        ? primary.name
        : (currentUser.displayName || 'Signed In');
      if (els.userBadge) {
        els.userBadge.textContent = `👤 ${safeName}`;
        els.userBadge.style.display = 'inline-flex';
      }
      if (els.btnLogin) els.btnLogin.textContent = 'Sign Out';
      if (els.authGatePrompt) els.authGatePrompt.style.display = 'none';
      if (els.teamBuilderPanel) els.teamBuilderPanel.style.display = 'flex';
    } else {
      if (teacherLink) teacherLink.style.display = 'none';
      if (els.userBadge) els.userBadge.style.display = 'none';
      if (els.btnLogin) els.btnLogin.textContent = 'Google Sign-In';
      if (els.authGatePrompt) els.authGatePrompt.style.display = 'flex';
      if (els.teamBuilderPanel) els.teamBuilderPanel.style.display = 'none';
    }

    if (els.periodSelect) els.periodSelect.value = String(state.period);
    if (els.tableSelect) els.tableSelect.value = String(state.tableNum);
  }

  function renderHeaderBadge() {
    if (!els.tableTeamPill) return;
    if (currentUser && state.groupMembers.length > 0) {
      const names = state.groupMembers.map(m => m.name.split(' ')[0]).join(', ');
      els.tableTeamPill.textContent = `👥 Group: ${names}`;
      els.tableTeamPill.style.display = 'inline-flex';
    } else {
      els.tableTeamPill.style.display = 'none';
    }
  }

  function renderStepRail() {
    if (!els.stepRailBar || !els.stepRailInner) return;
    if (!currentUser) {
      els.stepRailBar.style.display = 'none';
      return;
    }
    els.stepRailBar.style.display = 'block';

    const steps = [
      { num: 0, label: '👥 Team' },
      { num: 1, label: '1. Materials' },
      { num: 2, label: '2. Channel' },
      { num: 3, label: state.step3Approved ? '3. Curve ✓' : '3. Curve 🛑' },
      { num: 4, label: '4. Chair' },
      { num: 5, label: '5. Attach' },
      { num: 6, label: state.step6Approved ? '6. Meter Stick ✓' : '6. Meter Stick 🛑' },
      { num: 7, label: '7. 10cm Marks' },
      { num: 8, label: '8. Data Table' },
      { num: 9, label: '9. Graph & Rounds 🎯' }
    ];

    els.stepRailInner.innerHTML = '';
    steps.forEach(s => {
      const btn = document.createElement('button');
      btn.type = 'button';
      const isCurrent = state.currentStep === s.num;
      const isLocked = (s.num > state.maxUnlockedStep) ||
                       (s.num > 3 && !state.step3Approved) ||
                       (s.num > 6 && !state.step6Approved) ||
                       (s.num === 9 && getValidPairs().length < 4);

      btn.className = `step-pill ${isCurrent ? 'active' : ''} ${s.num < state.currentStep && !isLocked ? 'done' : ''} ${isLocked ? 'locked' : ''}`;
      btn.textContent = s.label;
      btn.disabled = isLocked;
      btn.addEventListener('click', () => {
        if (!isLocked) unlockAndGoToStep(s.num);
      });
      els.stepRailInner.appendChild(btn);
    });
  }

  function renderSlideVisibility() {
    for (let s = 0; s <= 9; s++) {
      const el = document.getElementById(`slide${s}`);
      if (el) {
        el.style.display = (state.currentStep === s) ? 'flex' : 'none';
      }
    }
  }

  function renderGroupMembers() {
    if (!els.groupMembersList) return;
    populateClassmateSuggestions();
    els.groupMembersList.innerHTML = '';

    const candidates = getRosterCandidates();
    // Automatically link or prune any unverified local entries once roster is loaded
    if (candidates.length > 0) {
      state.groupMembers = state.groupMembers.filter(m => {
        if (m.isPrimary) return true;
        const found = candidates.find(st =>
          (m.studentId && String(st.id) === String(m.studentId)) ||
          String(st.name || '').trim().toLowerCase() === String(m.name || '').trim().toLowerCase()
        );
        if (found) {
          m.studentId = String(found.id);
          m.name = found.name;
          m.rosterVerified = true;
          return true;
        }
        return false; // Remove unverified fake names
      });
    }

    state.groupMembers.forEach((m, idx) => {
      const row = document.createElement('div');
      row.className = 'member-chip';
      row.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.6rem;">
          <span class="member-num">${idx + 1}</span>
          <div>
            <div style="font-weight: 800; font-size: 0.95rem; color: var(--text-main);">
              ${escapeHtml(m.name)}
              ${m.isPrimary
                ? '<span style="font-size: 0.72rem; background: var(--accent-emerald-bg); color: var(--accent-emerald); padding: 0.1rem 0.45rem; border-radius: 999px; margin-left: 0.4rem; font-weight: 800;">✓ Signed-In &bull; Roster Linked</span>'
                : '<span style="font-size: 0.72rem; background: var(--accent-emerald-bg); color: var(--accent-emerald); padding: 0.1rem 0.45rem; border-radius: 999px; margin-left: 0.4rem; font-weight: 800;">✓ Roster Linked</span>'}
            </div>
          </div>
        </div>
        ${!m.isPrimary ? `<button type="button" class="btn-remove-row" data-midx="${idx}" title="Remove member">✕</button>` : ''}
      `;
      els.groupMembersList.appendChild(row);
    });

    els.groupMembersList.querySelectorAll('[data-midx]').forEach(btn => {
      btn.addEventListener('click', () => {
        const i = parseInt(btn.getAttribute('data-midx'), 10);
        state.groupMembers.splice(i, 1);
        saveLocalState();
        renderGroupMembers();
        syncProgressToFirestore();
      });
    });

    if (els.memberCountBadge) {
      const c = state.groupMembers.length;
      els.memberCountBadge.textContent = `${c} ${c === 1 ? 'Participant' : 'Participants'} in Group`;
    }
  }

  function updateStep1Button() {
    if (!els.btnNextFrom1) return;
    els.step1Checkboxes.forEach((chk, i) => {
      chk.checked = !!state.step1Checks[i];
    });
    const allChecked = state.step1Checks.every(Boolean);
    els.btnNextFrom1.disabled = !allChecked;
    els.btnNextFrom1.textContent = allChecked
      ? 'We Have All 5 Materials → Go to Step 2'
      : `Check All 5 Materials to Continue (${state.step1Checks.filter(Boolean).length}/5)`;
  }

  function renderApprovalGates() {
    // Step 3 Gate UI
    if (els.gateBoxStep3 && els.btnNextFrom3 && els.btnRequestStep3) {
      if (state.step3Approved) {
        els.gateBoxStep3.className = 'approval-gate-box approved';
        els.iconGate3.textContent = '✅';
        els.titleGate3.textContent = 'Step 3 Approved by Mr. Mudry!';
        els.descGate3.textContent = 'Your curved ramp bottom is approved. Click the green button below to continue to Step 4!';
        els.btnRequestStep3.style.display = 'none';
        els.btnNextFrom3.disabled = false;
        els.btnNextFrom3.textContent = '✓ Approved! Continue to Step 4 →';
      } else if (state.step3Requested) {
        els.gateBoxStep3.className = 'approval-gate-box waiting';
        els.iconGate3.textContent = '⏳';
        els.titleGate3.textContent = `Waiting for Mr. Mudry to Approve Table ${state.tableNum} (Step 3)...`;
        els.descGate3.textContent = 'Your table is flashing on Mr. Mudry\'s dashboard! Show him your gentle ramp curve—this screen will automatically unlock the moment he clicks Approve.';
        els.btnRequestStep3.textContent = '🔔 Signal Sent (Click to Ping Again)';
        els.btnRequestStep3.style.display = 'inline-flex';
        els.btnNextFrom3.disabled = true;
        els.btnNextFrom3.textContent = '🔒 Waiting for Mr. Mudry\'s Approval...';
      } else {
        els.gateBoxStep3.className = 'approval-gate-box';
        els.iconGate3.textContent = '🛑';
        els.titleGate3.textContent = 'Pause Here: Approval Required from Mr. Mudry';
        els.descGate3.textContent = 'Once your group has cut and taped the bottom of your ramp into a gentle curve, click the button on the right to signal Mr. Mudry.';
        els.btnRequestStep3.textContent = '✋ Request Mr. Mudry\'s Approval';
        els.btnRequestStep3.style.display = 'inline-flex';
        els.btnNextFrom3.disabled = true;
        els.btnNextFrom3.textContent = '🔒 Waiting for Mr. Mudry\'s Approval...';
      }
    }

    // Step 6 Gate UI
    if (els.gateBoxStep6 && els.btnNextFrom6 && els.btnRequestStep6) {
      if (state.step6Approved) {
        els.gateBoxStep6.className = 'approval-gate-box approved';
        els.iconGate6.textContent = '✅';
        els.titleGate6.textContent = 'Step 6 Approved by Mr. Mudry!';
        els.descGate6.textContent = 'Your chair ramp and taped floor meter stick are approved. Click below to continue to Step 7!';
        els.btnRequestStep6.style.display = 'none';
        els.btnNextFrom6.disabled = false;
        els.btnNextFrom6.textContent = '✓ Approved! Continue to Step 7 →';
      } else if (state.step6Requested) {
        els.gateBoxStep6.className = 'approval-gate-box waiting';
        els.iconGate6.textContent = '⏳';
        els.titleGate6.textContent = `Waiting for Mr. Mudry to Approve Table ${state.tableNum} (Step 6)...`;
        els.descGate6.textContent = 'Your table is flashing on Mr. Mudry\'s dashboard! Show him your ramp at the table edge and your taped floor meter stick.';
        els.btnRequestStep6.textContent = '🔔 Signal Sent (Click to Ping Again)';
        els.btnRequestStep6.style.display = 'inline-flex';
        els.btnNextFrom6.disabled = true;
        els.btnNextFrom6.textContent = '🔒 Waiting for Mr. Mudry\'s Approval...';
      } else {
        els.gateBoxStep6.className = 'approval-gate-box';
        els.iconGate6.textContent = '🛑';
        els.titleGate6.textContent = 'Pause Here: Approval Required from Mr. Mudry';
        els.descGate6.textContent = 'Once your ramp is attached to the chair, flat at the table edge, and your meter stick is taped to the floor starting at 0 cm under the table edge, click to call Mr. Mudry!';
        els.btnRequestStep6.textContent = '✋ Request Mr. Mudry\'s Approval';
        els.btnRequestStep6.style.display = 'inline-flex';
        els.btnNextFrom6.disabled = true;
        els.btnNextFrom6.textContent = '🔒 Waiting for Mr. Mudry\'s Approval...';
      }
    }
  }

  let tableSyncTimer = null;
  function scheduleTableSync() {
    if (tableSyncTimer) clearTimeout(tableSyncTimer);
    tableSyncTimer = setTimeout(() => {
      syncProgressToFirestore();
    }, 600);
  }

  function renderCalibrationTable(forceRebuild) {
    if (!els.calTableBody) return;
    // Never destroy focused input elements while the student is actively typing
    if (!forceRebuild && els.calTableBody.contains(document.activeElement) && els.calTableBody.children.length === state.dataRows.length) {
      return;
    }
    els.calTableBody.innerHTML = '';

    state.dataRows.forEach((row, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-weight: 800; color: var(--text-dim);">#${idx + 1}</td>
        <td>
          <div style="display: flex; align-items: center; gap: 0.4rem;">
            <input type="text" inputmode="decimal" autocomplete="off" class="table-input input-h" data-idx="${idx}" value="${row.h !== '' && row.h !== undefined && row.h !== null ? row.h : ''}" placeholder="e.g. ${(idx + 1) * 10}">
            <span style="font-weight: 700; color: var(--text-dim);">cm mark</span>
          </div>
        </td>
        <td>
          <div style="display: flex; align-items: center; gap: 0.4rem;">
            <input type="text" inputmode="decimal" autocomplete="off" class="table-input input-dx" data-idx="${idx}" value="${row.dx !== '' && row.dx !== undefined && row.dx !== null ? row.dx : ''}" placeholder="Floor cm">
            <span style="font-weight: 700; color: var(--text-dim);">cm on floor</span>
          </div>
        </td>
        <td style="text-align: center;">
          <button type="button" class="btn-remove-row" data-idx="${idx}" title="Remove row">✕</button>
        </td>
      `;
      els.calTableBody.appendChild(tr);
    });

    els.calTableBody.querySelectorAll('.input-h').forEach(inp => {
      inp.addEventListener('input', e => {
        const i = parseInt(e.target.dataset.idx, 10);
        const raw = e.target.value.trim();
        const num = parseFloat(raw);
        state.dataRows[i].h = (raw === '' || isNaN(num)) ? '' : num;
        saveLocalState();
        recalculateCurve();
        renderStepRail();
        scheduleTableSync();
      });
      inp.addEventListener('blur', () => syncProgressToFirestore());
    });

    els.calTableBody.querySelectorAll('.input-dx').forEach(inp => {
      inp.addEventListener('input', e => {
        const i = parseInt(e.target.dataset.idx, 10);
        const raw = e.target.value.trim();
        const num = parseFloat(raw);
        state.dataRows[i].dx = (raw === '' || isNaN(num)) ? '' : num;
        saveLocalState();
        recalculateCurve();
        renderStepRail();
        scheduleTableSync();
      });
      inp.addEventListener('blur', () => syncProgressToFirestore());
    });

    els.calTableBody.querySelectorAll('.btn-remove-row').forEach(btn => {
      btn.addEventListener('click', e => {
        if (state.dataRows.length <= 4) {
          alert('Keep at least 4 rows in your calibration data table.');
          return;
        }
        const i = parseInt(e.currentTarget.dataset.idx, 10);
        state.dataRows.splice(i, 1);
        saveLocalState();
        renderCalibrationTable(true);
        recalculateCurve();
        renderStepRail();
        syncProgressToFirestore();
      });
    });
  }

  function getValidPairs() {
    return state.dataRows.filter(r => typeof r.h === 'number' && !isNaN(r.h) && r.h > 0 && typeof r.dx === 'number' && !isNaN(r.dx) && r.dx > 0);
  }

  function recalculateCurve() {
    const validPairs = getValidPairs();
    if (validPairs.length >= 2) {
      let sumSqrtH_dx = 0;
      let sumH = 0;
      validPairs.forEach(p => {
        sumSqrtH_dx += Math.sqrt(p.h) * p.dx;
        sumH += p.h;
      });
      state.k = sumH > 0 ? (sumSqrtH_dx / sumH) : null;
    } else {
      state.k = null;
    }

    // Update Step 8 Status & Button
    if (els.step8DataStatus && els.btnNextFrom8) {
      if (validPairs.length >= 4) {
        els.step8DataStatus.style.color = 'var(--accent-emerald)';
        els.step8DataStatus.textContent = `✓ ${validPairs.length} calibration trials recorded! Click below to see your graph and start the 3 Target Rounds.`;
        els.btnNextFrom8.disabled = false;
        els.btnNextFrom8.textContent = `Plot Graph & Start Target Rounds (${validPairs.length} Trials) →`;
      } else {
        els.step8DataStatus.style.color = 'var(--accent-orange)';
        els.step8DataStatus.textContent = `⏳ ${validPairs.length} of 4 minimum trials entered. Release the marble from at least 4 ramp marks and record the floor distance (cm).`;
        els.btnNextFrom8.disabled = true;
        els.btnNextFrom8.textContent = `Enter At Least 4 Trials to View Your Graph (${validPairs.length}/4) →`;
      }
    }
  }

  function renderStep9Rounds() {
    if (els.step9TeamSummary) {
      const names = state.groupMembers.map(m => m.name).join(', ');
      els.step9TeamSummary.textContent = `Period ${state.period} • 👥 ${names || 'Group'}`;
    }

    let total = 0;
    for (let r = 1; r <= 4; r++) {
      const rData = state.rounds[r] || {};
      const box = document.getElementById(`roundBox${r}`);
      const targetInp = document.getElementById(`r${r}Target`);
      const releaseInp = document.getElementById(`r${r}Release`);
      const scoreTag = document.getElementById(`roundScoreTag${r}`);
      const statusMsg = document.getElementById(`r${r}StatusMsg`);

      if (box) {
        box.classList.toggle('active', state.activeRound === r);
      }
      if (targetInp && document.activeElement !== targetInp) {
        targetInp.value = rData.targetDistCm !== '' && rData.targetDistCm !== undefined ? rData.targetDistCm : '';
      }
      if (releaseInp && document.activeElement !== releaseInp) {
        releaseInp.value = rData.studentReleaseHeightCm !== '' && rData.studentReleaseHeightCm !== undefined ? rData.studentReleaseHeightCm : '';
      }

      const isScored = typeof rData.score === 'number';
      if (scoreTag) {
        if (isScored) {
          scoreTag.textContent = `✓ Score: ${rData.score} / 10 pts`;
          scoreTag.style.background = 'var(--accent-emerald-bg)';
          scoreTag.style.color = 'var(--accent-emerald)';
        } else {
          scoreTag.textContent = 'Score: -- / 10 pts';
          scoreTag.style.background = 'var(--bg-card-sub)';
          scoreTag.style.color = 'var(--text-dim)';
        }
      }

      if (statusMsg) {
        if (isScored) {
          statusMsg.innerHTML = `<span style="color: var(--accent-emerald); font-weight: 800;">🏆 Official drop scored by Mr. Mudry: ${rData.score} / 10 pts!</span>`;
        } else if (rData.status === 'ready_to_launch') {
          statusMsg.innerHTML = `<span style="color: var(--accent-cyan); font-weight: 800;">✓ Locked in (Target ${rData.targetDistCm} cm → Release at ${rData.studentReleaseHeightCm} cm)! Call Mr. Mudry for your drop.</span>`;
        } else {
          statusMsg.textContent = 'Enter target distance & release position from graph, then lock in.';
        }
      }

      if (r <= 3 && isScored) {
        total += rData.score;
      }
    }

    state.totalScore = total;
    if (els.studentTotalScore) {
      els.studentTotalScore.textContent = String(total);
    }
  }

  function lockInRoundPrediction(r) {
    if (!currentUser) {
      alert('Please sign in first.');
      return;
    }
    const rData = state.rounds[r] || {};
    const targetVal = parseFloat(rData.targetDistCm);
    const releaseVal = parseFloat(rData.studentReleaseHeightCm);

    if (isNaN(targetVal) || targetVal <= 0) {
      alert(`Please enter the Target Distance (cm) that Mr. Mudry gave you for ${r === 4 ? 'the Tie-Breaker' : 'Round ' + r}.`);
      const tInp = document.getElementById(`r${r}Target`);
      if (tInp) tInp.focus();
      return;
    }
    if (isNaN(releaseVal) || releaseVal <= 0) {
      alert(`Please use your graph on the left to determine and enter your Marble Release Position (cm) for ${r === 4 ? 'the Tie-Breaker' : 'Round ' + r}.`);
      const rInp = document.getElementById(`r${r}Release`);
      if (rInp) rInp.focus();
      return;
    }

    rData.targetDistCm = targetVal;
    rData.studentReleaseHeightCm = releaseVal;
    rData.predictedReleaseHeightCm = releaseVal;
    rData.status = 'ready_to_launch';
    state.rounds[r] = rData;
    state.activeRound = r;

    saveLocalState();
    renderStep9Rounds();
    renderPlot();
    syncProgressToFirestore('ready_to_launch', r);
    if (window.SoundFX) SoundFX.play('click');
  }

  function syncProgressToFirestore(overrideStatus, activeRoundOverride) {
    if (!fbDb || !currentUser) return;
    const email = (currentUser.email || '').toLowerCase();
    const studentId = email.split('@')[0];
    const teamNamesStr = state.groupMembers.map(m => m.name).join(', ');
    const r = activeRoundOverride || state.activeRound || 1;
    const activeRData = state.rounds[r] || {};

    let statusVal = overrideStatus || 'in_progress';
    if (!overrideStatus) {
      if (state.currentStep === 3 && state.step3Requested && !state.step3Approved) {
        statusVal = 'waiting_step_3';
      } else if (state.currentStep === 6 && state.step6Requested && !state.step6Approved) {
        statusVal = 'waiting_step_6';
      } else if (state.currentStep === 9) {
        statusVal = 'on_graph_rounds';
      }
    }

    const payload = {
      studentId: studentId,
      student_id: studentId,
      primaryStudentId: studentId,
      studentEmail: email,
      studentName: (state.groupMembers[0] && state.groupMembers[0].name) || currentUser.displayName || studentId,
      student_name: (state.groupMembers[0] && state.groupMembers[0].name) || currentUser.displayName || studentId,
      period: state.period,
      class_period: state.period,
      tableNumber: state.tableNum,
      teamMembers: teamNamesStr,
      groupMembers: state.groupMembers,
      currentStep: state.currentStep,
      maxUnlockedStep: state.maxUnlockedStep,
      step3Requested: !!state.step3Requested,
      step3Approved: !!state.step3Approved,
      step6Requested: !!state.step6Requested,
      step6Approved: !!state.step6Approved,
      dataRows: state.dataRows,
      calibrationData: getValidPairs().map(p => ({ s: p.h, dx: p.dx })),
      currentRound: r,
      rounds: state.rounds,
      targetDistCm: Number(activeRData.targetDistCm) || 0,
      predictedReleaseHeightCm: Number(activeRData.studentReleaseHeightCm) || 0,
      totalScore: state.totalScore || 0,
      score: state.totalScore || 0,
      maxPoints: 30,
      percentage: Math.round(((state.totalScore || 0) / 30) * 100),
      status: statusVal,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    fbDb.collection('student_results')
      .doc(ASSIGNMENT_ID)
      .collection('students')
      .doc(studentId)
      .set(payload, { merge: true })
      .catch(err => console.warn('Sync error:', err.message));
  }

  // =========================================================================
  // INTERACTIVE EMPIRICAL GRAPH RENDERER (STEP 9)
  // =========================================================================
  function getPlotBounds(w, h) {
    const padL = 64;
    const padB = 48;
    const padT = 24;
    const padR = 28;
    const plotW = Math.max(100, w - padL - padR);
    const plotH = Math.max(100, h - padT - padB);

    const validPairs = getValidPairs();
    let maxH = 60;
    let maxDx = 120;
    validPairs.forEach(p => {
      if (p.h > maxH) maxH = p.h;
      if (p.dx > maxDx) maxDx = p.dx;
    });

    const rData = state.rounds[state.activeRound] || {};
    const targetX = parseFloat(rData.targetDistCm) || 0;
    const studentH = parseFloat(rData.studentReleaseHeightCm) || 0;

    if (studentH > maxH) maxH = studentH * 1.15;
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

    const valH = Math.max(0, ((px - b.padL) / b.plotW) * b.maxH);
    const valDx = Math.max(0, ((h - b.padB - py) / b.plotH) * b.maxDx);

    let dxOnCurve = null;
    if (state.k && state.k > 0) {
      dxOnCurve = state.k * Math.sqrt(valH);
    }

    hoverInspector = {
      h: valH,
      dx: dxOnCurve !== null ? dxOnCurve : valDx,
      hasCurve: dxOnCurve !== null
    };

    if (els.readoutValues) {
      if (dxOnCurve !== null) {
        els.readoutValues.innerHTML = `Ramp Release Mark: <strong>${valH.toFixed(1)} cm</strong> ➔ Floor Distance on Curve: <strong>${dxOnCurve.toFixed(1)} cm</strong>`;
      } else {
        els.readoutValues.innerHTML = `Ramp Mark: ${valH.toFixed(1)} cm, Floor Distance: ${valDx.toFixed(1)} cm`;
      }
    }

    renderPlot();
  }

  function renderPlot() {
    if (!els.plotCanvas || state.currentStep !== 9) return;
    const canvas = els.plotCanvas;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    const wrap = canvas.parentElement;
    const rect = (wrap || canvas).getBoundingClientRect();
    const w = Math.floor(rect.width) || 520;
    const h = Math.floor(rect.height) || 340;

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

    ctx.fillStyle = colorBg;
    ctx.fillRect(0, 0, w, h);

    const b = getPlotBounds(w, h);
    const toX = valH => b.padL + (valH / b.maxH) * b.plotW;
    const toY = valDx => (h - b.padB) - (valDx / b.maxDx) * b.plotH;

    // Grid lines
    ctx.strokeStyle = colorGrid;
    ctx.lineWidth = 1;

    const stepH = b.maxH > 100 ? 20 : 10;
    for (let gh = 0; gh <= b.maxH; gh += stepH) {
      const gx = toX(gh);
      ctx.beginPath();
      ctx.moveTo(gx, b.padT);
      ctx.lineTo(gx, h - b.padB);
      ctx.stroke();

      ctx.fillStyle = colorAxis;
      ctx.font = 'bold 11px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(gh, gx, h - b.padB + 16);
    }

    const stepDx = b.maxDx > 160 ? 40 : 20;
    for (let gdx = 0; gdx <= b.maxDx; gdx += stepDx) {
      const gy = toY(gdx);
      ctx.beginPath();
      ctx.moveTo(b.padL, gy);
      ctx.lineTo(w - b.padR, gy);
      ctx.stroke();

      ctx.fillStyle = colorAxis;
      ctx.font = 'bold 11px JetBrains Mono, monospace';
      ctx.textAlign = 'right';
      ctx.fillText(gdx, b.padL - 8, gy + 4);
    }

    // Axes
    ctx.strokeStyle = colorAxis;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(b.padL, b.padT);
    ctx.lineTo(b.padL, h - b.padB);
    ctx.lineTo(w - b.padR, h - b.padB);
    ctx.stroke();

    // Axis titles
    ctx.fillStyle = colorText;
    ctx.font = 'bold 13px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Marble Release Mark Along Ramp (cm)', b.padL + b.plotW / 2, h - 8);

    ctx.save();
    ctx.translate(18, b.padT + b.plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('Floor Landing Distance Along Meter Stick (cm)', 0, 0);
    ctx.restore();

    // Smooth Fitted Empirical Curve
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

    // Hover/Touch Crosshairs (tracks cursor horizontally along x-axis on the curve)
    if (hoverInspector && hoverInspector.hasCurve && hoverInspector.dx <= b.maxDx) {
      const cPx = toX(hoverInspector.h);
      const cPy = toY(hoverInspector.dx);

      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = colorInspector;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(b.padL, cPy);
      ctx.lineTo(cPx, cPy);
      ctx.lineTo(cPx, h - b.padB);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = colorInspector;
      ctx.beginPath();
      ctx.arc(cPx, cPy, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Active Round Target Line & Student Pin
    const rNum = state.activeRound || 1;
    const rData = state.rounds[rNum] || {};
    const targetX = parseFloat(rData.targetDistCm) || 0;
    const studentH = parseFloat(rData.studentReleaseHeightCm) || 0;
    let expectedH = null;

    if (state.k && state.k > 0 && targetX > 0) {
      expectedH = Math.pow(targetX / state.k, 2);
    }

    if (targetX > 0 && targetX <= b.maxDx) {
      const targetY = toY(targetX);
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = colorTarget;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(b.padL, targetY);
      ctx.lineTo(w - b.padR, targetY);
      ctx.stroke();
      ctx.setLineDash([]);

      const rTag = rNum === 4 ? 'Tie-Breaker' : `Round ${rNum}`;
      ctx.fillStyle = colorTarget;
      ctx.font = 'bold 11px Outfit, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${rTag} Target = ${targetX.toFixed(1)} cm`, w - b.padR - 6, targetY - 6);

      if (expectedH !== null && expectedH <= b.maxH) {
        const cPx = toX(expectedH);
        ctx.fillStyle = colorTarget;
        ctx.beginPath();
        ctx.arc(cPx, targetY, 4.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.setLineDash([2, 4]);
        ctx.strokeStyle = colorTarget;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(cPx, targetY);
        ctx.lineTo(cPx, h - b.padB);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    if (studentH > 0 && targetX > 0 && studentH <= b.maxH && targetX <= b.maxDx) {
      const px = toX(studentH);
      const py = toY(targetX);

      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = colorTarget;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px, h - b.padB);
      ctx.lineTo(px, py);
      ctx.stroke();
      ctx.setLineDash([]);

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
      ctx.fillText(`R${rNum}: ${studentH.toFixed(1)} cm`, px + 10, py - 6);
    }

    // Update Graph Feedback Message
    if (els.graphFeedbackMsg) {
      if (studentH > 0 && targetX > 0 && expectedH !== null) {
        const diff = Math.abs(studentH - expectedH);
        if (diff <= 1.5) {
          els.graphFeedbackMsg.innerHTML = `<span style="color: var(--accent-emerald); font-weight: 800;">✓ Spot-On Graph Reading!</span> Your Round ${rNum} pin at <strong>${studentH.toFixed(1)} cm</strong> sits right on your calibration curve for a <strong>${targetX.toFixed(1)} cm</strong> target.`;
        } else if (diff <= 3.5) {
          els.graphFeedbackMsg.innerHTML = `<span style="color: var(--accent-cyan); font-weight: 800;">≈ Very Close!</span> Your pin is at <strong>${studentH.toFixed(1)} cm</strong> (your curve crosses ${targetX.toFixed(1)} cm at <strong>${expectedH.toFixed(1)} cm</strong>).`;
        } else {
          els.graphFeedbackMsg.innerHTML = `<span style="color: var(--accent-rose); font-weight: 800;">⚠️ Check Your Graph Reading:</span> Your pin at <strong>${studentH.toFixed(1)} cm</strong> is off your blue curve. Trace across from ${targetX.toFixed(1)} cm on the vertical axis to the curve, then look straight down!`;
        }
      } else {
        els.graphFeedbackMsg.innerHTML = `Type a Target Distance and your predicted Marble Release Position in Round ${rNum} on the right to see your purple shot pin on the graph!`;
      }
    }

    // Plot Student Measured Data Points
    const validPairs = getValidPairs();
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
      ctx.font = 'bold 10px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${p.h}cm`, px, py - 9);
    });
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
