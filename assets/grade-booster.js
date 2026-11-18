/**
 * Grade Booster & Thanksgiving Make-Up Planner
 * Pulls live Google Classroom coursework & submissions via OAuth + enriches with Firestore
 * assignment_registry and student_results/physics_labs so students know exactly what to do.
 */
(function () {
  'use strict';

  const firebaseConfig = {
    projectId: "site-6e500",
    appId: "1:591530758858:web:1996cdca7316ffc3781a33",
    storageBucket: "site-6e500.firebasestorage.app",
    apiKey: "AIzaSyAji2nTjD2dbmzgk8gySWCy-aiQyKvR1i4",
    authDomain: "site-6e500.firebaseapp.com",
    messagingSenderId: "591530758858"
  };

  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  const db = firebase.firestore();
  const auth = firebase.auth();

  const ALLOWED_TEST_EMAILS = ['rmudry@orangeusd.org', 'ryan.mudry@gmail.com', 'ryanmudry@gmail.com'];
  const CLASSROOM_SCOPES = [
    'https://www.googleapis.com/auth/classroom.courses.readonly',
    'https://www.googleapis.com/auth/classroom.coursework.me.readonly'
  ];
  const TOKEN_KEY = 'gb_classroom_access_token';
  const TOKEN_EXP_KEY = 'gb_classroom_token_exp';

  // State
  const state = {
    user: null,
    studentId: null,
    roster: null,
    accessToken: null,
    courses: [],
    selectedCourseId: null,
    registry: [],          // assignment_registry docs
    firestoreScores: {},   // assignmentId -> { score, timestamp }
    physicsLabs: null,     // physics_labs/{studentId}
    items: [],             // normalized assignments for current view
    selectedIds: new Set(),// checked for Break Plan simulator
    simulateTarget: 1.0,   // 1.0 = 100%, 0.8 = 80%
    activeFilter: 'actionable', // 'actionable' | 'missing' | 'low' | 'apps' | 'pending' | 'done' | 'all'
    classroomError: null,
    classroomConnected: false
  };

  // DOM helpers
  const $ = (id) => document.getElementById(id);

  function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function isAuthorizedEmail(email) {
    if (!email) return false;
    const lower = email.toLowerCase();
    return lower.endsWith('@orangeusd.org') || ALLOWED_TEST_EMAILS.includes(lower);
  }

  function getCachedToken() {
    const tok = sessionStorage.getItem(TOKEN_KEY);
    const exp = Number(sessionStorage.getItem(TOKEN_EXP_KEY) || 0);
    if (tok && exp > Date.now() + 60000) return tok;
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_EXP_KEY);
    return null;
  }

  function setCachedToken(tok) {
    if (!tok) return;
    sessionStorage.setItem(TOKEN_KEY, tok);
    // Google OAuth access tokens last 3600s; treat as 50 mins
    sessionStorage.setItem(TOKEN_EXP_KEY, String(Date.now() + 50 * 60 * 1000));
  }

  function clearCachedToken() {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_EXP_KEY);
  }

  // Theme & Font Size (High-Contrast Light Mode + Projector Mode)
  function initAccessibilityControls() {
    const savedTheme = localStorage.getItem('gb_theme') || 'dark';
    applyTheme(savedTheme);

    const savedSize = localStorage.getItem('gb_font_size') || '16';
    applyFontSize(savedSize);

    const themeBtn = $('btn-theme-toggle');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const next = document.documentElement.classList.contains('light-mode') ? 'dark' : 'light';
        applyTheme(next);
        localStorage.setItem('gb_theme', next);
      });
    }

    document.querySelectorAll('[data-font-size]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const sz = btn.getAttribute('data-font-size');
        applyFontSize(sz);
        localStorage.setItem('gb_font_size', sz);
      });
    });
  }

  function applyTheme(mode) {
    const isLight = mode === 'light';
    document.documentElement.classList.toggle('light-mode', isLight);
    const btn = $('btn-theme-toggle');
    if (btn) {
      btn.textContent = isLight ? '🌙 Dark Mode' : '☀️ High-Contrast Light';
      btn.setAttribute('aria-pressed', String(isLight));
    }
  }

  function applyFontSize(px) {
    document.documentElement.style.fontSize = `${px}px`;
    document.querySelectorAll('[data-font-size]').forEach((btn) => {
      const active = btn.getAttribute('data-font-size') === String(px);
      btn.classList.toggle('active-size', active);
      btn.setAttribute('aria-pressed', String(active));
    });
  }

  // Build GoogleAuthProvider
  function buildProvider(withClassroomScopes) {
    const provider = new firebase.auth.GoogleAuthProvider();
    if (withClassroomScopes) {
      CLASSROOM_SCOPES.forEach((s) => provider.addScope(s));
    }
    provider.setCustomParameters({
      hd: 'orangeusd.org',
      prompt: 'select_account'
    });
    return provider;
  }

  async function signInWithClassroom() {
    setLoginBusy(true, 'Connecting Google Account & Classroom...');
    state.classroomError = null;
    try {
      const provider = buildProvider(true);
      const result = await auth.signInWithPopup(provider);
      const token = result && result.credential ? result.credential.accessToken : null;
      if (token) {
        state.accessToken = token;
        setCachedToken(token);
      }
    } catch (err) {
      console.warn('Classroom-scoped sign-in failed, checking fallback:', err);
      if (err && (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request')) {
        setLoginBusy(false);
        return;
      }
      // Fallback to basic Google sign-in if Classroom scope was blocked
      try {
        const basicProvider = buildProvider(false);
        await auth.signInWithPopup(basicProvider);
        state.classroomError = 'Google Classroom API access was not granted or is restricted. Showing your Physics Site interactive labs below.';
      } catch (err2) {
        console.error('Basic sign-in failed:', err2);
        showStatusBanner(`Sign-in error: ${err2.message || 'Could not complete Google sign-in.'}`, 'error');
        setLoginBusy(false);
      }
    }
  }

  async function connectClassroomOnly() {
    const btn = $('btn-connect-classroom');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Connecting Classroom...';
    }
    state.classroomError = null;
    try {
      const provider = buildProvider(true);
      if (state.user && state.user.email) {
        provider.setCustomParameters({
          login_hint: state.user.email,
          hd: 'orangeusd.org'
        });
      }
      const result = await auth.signInWithPopup(provider);
      const token = result && result.credential ? result.credential.accessToken : null;
      if (token) {
        state.accessToken = token;
        setCachedToken(token);
        await loadClassroomData();
      } else {
        state.classroomError = 'Google did not return a Classroom access token. Please try again and allow Classroom read access.';
        renderAll();
      }
    } catch (err) {
      console.warn('Classroom connect failed:', err);
      state.classroomError = `Could not connect Google Classroom (${err.code || err.message}). Showing your Physics Site interactive labs below.`;
      renderAll();
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Connect Google Classroom';
      }
    }
  }

  function setLoginBusy(busy, label) {
    const btn = $('btn-google-login');
    if (!btn) return;
    btn.disabled = busy;
    btn.textContent = busy ? (label || 'Signing in...') : 'Sign in with School Google Account (@orangeusd.org)';
  }

  // Classroom API fetch helper with pagination
  async function classroomFetchAll(urlBase, listKey) {
    const results = [];
    let pageToken = '';
    do {
      const sep = urlBase.includes('?') ? '&' : '?';
      const url = pageToken ? `${urlBase}${sep}pageToken=${encodeURIComponent(pageToken)}` : urlBase;
      const resp = await fetch(url, {
        headers: { Authorization: `Bearer ${state.accessToken}` }
      });
      if (resp.status === 401) {
        clearCachedToken();
        state.accessToken = null;
        throw new Error('TOKEN_EXPIRED');
      }
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`Classroom API ${resp.status}: ${text.slice(0, 180)}`);
      }
      const data = await resp.json();
      if (Array.isArray(data[listKey])) {
        results.push(...data[listKey]);
      }
      pageToken = data.nextPageToken || '';
    } while (pageToken);
    return results;
  }

  // Load Firestore metadata & student's own lab scores
  async function loadFirestoreData() {
    const sid = state.studentId;
    if (!sid) return;

    // 1. Roster (for period & name)
    try {
      const rDoc = await db.collection('roster').doc(sid).get();
      if (rDoc.exists) {
        state.roster = rDoc.data();
      }
    } catch (e) {
      console.warn('Roster lookup skipped:', e.message);
    }

    // 2. Assignment Registry (catalog of interactive webapps)
    try {
      const regSnap = await db.collection('assignment_registry').get();
      state.registry = [];
      regSnap.forEach((doc) => {
        state.registry.push({ id: doc.id, ...doc.data() });
      });
    } catch (e) {
      console.warn('Assignment registry read error:', e.message);
    }

    // 3. Physics Labs doc
    try {
      const plDoc = await db.collection('physics_labs').doc(sid).get();
      state.physicsLabs = plDoc.exists ? plDoc.data() : null;
    } catch (e) {
      console.warn('physics_labs read error:', e.message);
    }

    // 4. Check student_results/{id}/students/{sid} for registered webapps
    const checks = state.registry
      .filter((r) => !r.firestorePath || r.firestorePath === 'student_results')
      .map(async (r) => {
        try {
          const doc = await db.collection('student_results').doc(r.id).collection('students').doc(sid).get();
          if (doc.exists) {
            state.firestoreScores[r.id] = doc.data();
          }
        } catch (e) {
          // Ignore individual read failures
        }
      });
    await Promise.all(checks);
  }

  // Load Google Classroom courses, coursework, and submissions
  async function loadClassroomData() {
    if (!state.accessToken) return;
    showLoadingState(true, 'Pulling your assignments & grades from Google Classroom...');
    try {
      const courses = await classroomFetchAll(
        'https://classroom.googleapis.com/v1/courses?studentId=me&courseStates=ACTIVE&pageSize=100',
        'courses'
      );
      state.courses = courses;
      state.classroomConnected = true;

      if (courses.length === 0) {
        state.items = [];
        showLoadingState(false);
        renderAll();
        return;
      }

      // Auto-select Physics course
      if (!state.selectedCourseId || !courses.some((c) => c.id === state.selectedCourseId)) {
        state.selectedCourseId = pickBestPhysicsCourse(courses);
      }

      await loadSelectedCourseWork();
    } catch (err) {
      console.error('Classroom load error:', err);
      if (err.message === 'TOKEN_EXPIRED') {
        state.classroomError = 'Your Google Classroom session expired. Click "Connect Google Classroom" to refresh your live grades.';
      } else {
        state.classroomError = `Could not read Google Classroom (${err.message}). Showing your Physics Site interactive labs below.`;
      }
      state.classroomConnected = false;
      buildFallbackItemsFromRegistry();
      showLoadingState(false);
      renderAll();
    }
  }

  function pickBestPhysicsCourse(courses) {
    // 1. Exact match against assignment_registry coursework map
    const knownCourseIds = new Set();
    state.registry.forEach((r) => {
      if (r.coursework && typeof r.coursework === 'object') {
        Object.keys(r.coursework).forEach((cid) => knownCourseIds.add(cid));
      }
    });
    const registryMatch = courses.find((c) => knownCourseIds.has(c.id));
    if (registryMatch) return registryMatch.id;

    // 2. Name/section mentions Physics or Mudry
    const physicsMatch = courses.find((c) => /physics|mudry/i.test(`${c.name || ''} ${c.section || ''}`));
    if (physicsMatch) return physicsMatch.id;

    return courses[0].id;
  }

  async function loadSelectedCourseWork() {
    const courseId = state.selectedCourseId;
    if (!courseId || !state.accessToken) return;

    showLoadingState(true, 'Analyzing missing & improvable assignments...');
    const [courseWork, submissions] = await Promise.all([
      classroomFetchAll(
        `https://classroom.googleapis.com/v1/courses/${encodeURIComponent(courseId)}/courseWork?courseWorkStates=PUBLISHED&pageSize=100`,
        'courseWork'
      ),
      classroomFetchAll(
        `https://classroom.googleapis.com/v1/courses/${encodeURIComponent(courseId)}/courseWork/-/studentSubmissions?userId=me&pageSize=100`,
        'studentSubmissions'
      )
    ]);

    const subMap = new Map();
    submissions.forEach((s) => subMap.set(s.courseWorkId, s));

    // Index assignment_registry by courseworkId for this course
    const regByCwId = new Map();
    const regByTitle = new Map();
    state.registry.forEach((r) => {
      if (r.coursework && r.coursework[courseId]) {
        regByCwId.set(String(r.coursework[courseId]), r);
      }
      if (r.title) {
        regByTitle.set(normalizeTitle(r.title), r);
      }
    });

    const now = new Date();
    const items = [];

    courseWork.forEach((cw) => {
      const maxPoints = Number(cw.maxPoints || 0);
      if (maxPoints <= 0) return; // Ungraded announcements/materials don't affect grade

      const sub = subMap.get(cw.id) || {};
      const assignedGrade = sub.assignedGrade !== undefined && sub.assignedGrade !== null ? Number(sub.assignedGrade) : null;
      const draftGrade = sub.draftGrade !== undefined && sub.draftGrade !== null ? Number(sub.draftGrade) : null;
      const subState = sub.state || 'NEW';

      const due = parseDueDate(cw.dueDate, cw.dueTime);
      const isPastDue = due ? due < now : false;

      // Match interactive app URL from registry or materials
      const reg = regByCwId.get(String(cw.id)) || regByTitle.get(normalizeTitle(cw.title));
      const appUrl = findAppUrl(cw, reg);
      const appScoreData = reg ? getAppScorePct(reg) : null;
      const bellRinger = isBellRingerItem(cw.title, reg, appUrl);

      // Classify status (Bell-Ringers are timed in-class warm-ups and cannot be made up)
      let category = 'done';
      if (bellRinger) {
        category = 'non_makeup';
      } else if (subState === 'TURNED_IN' && assignedGrade === null) {
        category = 'pending';
      } else if (assignedGrade === null) {
        // Not graded yet and not turned in
        category = 'missing';
      } else if (assignedGrade === 0) {
        category = 'missing';
      } else if (assignedGrade < maxPoints * 0.75) {
        category = 'low';
      } else if (assignedGrade < maxPoints) {
        category = 'polish';
      } else {
        category = 'done';
      }

      const floorPts = Number((maxPoints * 0.5).toFixed(2));
      const rawPts = assignedGrade !== null ? assignedGrade : 0;
      const currentPts = Math.max(rawPts, floorPts);
      const floorApplied = rawPts < floorPts;
      const potentialGain = bellRinger ? 0 : Math.max(0, Number((maxPoints - currentPts).toFixed(2)));
      // Counts in current grade denominator if graded OR past due
      const inCurrentGrade = assignedGrade !== null || isPastDue;

      items.push({
        id: cw.id,
        title: cw.title || 'Untitled Assignment',
        maxPoints,
        rawPts,
        currentPts,
        floorPts,
        floorApplied,
        assignedGrade,
        draftGrade,
        potentialGain,
        isBellRinger: bellRinger,
        subState,
        late: Boolean(sub.late),
        due,
        isPastDue,
        inCurrentGrade,
        category,
        classroomUrl: sub.alternateLink || cw.alternateLink || 'https://classroom.google.com',
        appUrl,
        appScoreData,
        unit: (reg && reg.unit) || '',
        description: cw.description || ''
      });
    });

    // Sort: highest potentialGain first, then missing/low, then most recent due date
    items.sort((a, b) => {
      if (b.potentialGain !== a.potentialGain) return b.potentialGain - a.potentialGain;
      const at = a.due ? a.due.getTime() : 0;
      const bt = b.due ? b.due.getTime() : 0;
      return bt - at;
    });

    state.items = items;

    // Auto-select top 3 highest-impact actionable items in Break Plan if nothing selected yet
    if (state.selectedIds.size === 0) {
      items
        .filter((i) => i.category === 'missing' || i.category === 'low')
        .slice(0, 3)
        .forEach((i) => state.selectedIds.add(i.id));
    }

    showLoadingState(false);
    renderAll();
  }

  function buildFallbackItemsFromRegistry() {
    // When Classroom API isn't connected yet, show interactive apps from assignment_registry + Firestore
    const items = state.registry
      .filter((r) => r.activityUrl && r.title && !isBellRingerItem(r.title, r, r.activityUrl))
      .map((r) => {
        const maxPoints = Number(r.maxPoints || 10);
        const floorPts = Number((maxPoints * 0.5).toFixed(2));
        const appScoreData = getAppScorePct(r);
        const pct = appScoreData ? appScoreData.pct : null;
        const rawPts = pct !== null ? Number(((pct / 100) * maxPoints).toFixed(2)) : 0;
        const currentPts = Math.max(rawPts, floorPts);
        const floorApplied = rawPts < floorPts;
        const potentialGain = Math.max(0, Number((maxPoints - currentPts).toFixed(2)));

        let category = 'missing';
        if (pct !== null && pct >= 99) category = 'done';
        else if (pct !== null && pct >= 75) category = 'polish';
        else if (pct !== null && pct > 0) category = 'low';

        return {
          id: r.id,
          title: r.title,
          maxPoints,
          rawPts,
          currentPts,
          floorPts,
          floorApplied,
          assignedGrade: pct !== null ? rawPts : null,
          draftGrade: null,
          potentialGain,
          subState: pct !== null ? 'RETURNED' : 'NEW',
          late: false,
          due: null,
          isPastDue: true,
          inCurrentGrade: true,
          category,
          classroomUrl: 'https://classroom.google.com',
          appUrl: r.activityUrl,
          appScoreData,
          unit: r.unit || '',
          description: r.description || ''
        };
      });

    items.sort((a, b) => b.potentialGain - a.potentialGain);
    state.items = items;
  }

  function isBellRingerItem(title, reg, appUrl) {
    if (reg && (reg.type === 'bell_ringer' || String(reg.id || '').startsWith('bell_ringer'))) return true;
    if (/bell[\s-]*ringer/i.test(title || '')) return true;
    if (appUrl && /Bell-Ringer/i.test(appUrl)) return true;
    return false;
  }

  function normalizeTitle(t) {
    return String(t || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  }

  function parseDueDate(dueDate, dueTime) {
    if (!dueDate || !dueDate.year) return null;
    const h = dueTime && dueTime.hours ? dueTime.hours : 23;
    const m = dueTime && dueTime.minutes ? dueTime.minutes : 59;
    return new Date(Date.UTC(dueDate.year, (dueDate.month || 1) - 1, dueDate.day || 1, h, m));
  }

  function findAppUrl(cw, reg) {
    if (reg && reg.activityUrl) return reg.activityUrl;
    if (Array.isArray(cw.materials)) {
      for (const m of cw.materials) {
        if (m.link && m.link.url && m.link.url.includes('rrmudry.github.io')) {
          return m.link.url;
        }
      }
    }
    return null;
  }

  function getAppScorePct(reg) {
    if (!reg) return null;
    const fsData = state.firestoreScores[reg.id];
    if (fsData && fsData.score !== undefined && fsData.score !== null) {
      const raw = Number(fsData.score);
      const max = Number(fsData.maxScore || 0);
      const pct = max > 0 && raw <= max ? Math.round((raw / max) * 100) : Math.round(raw);
      return { pct: Math.min(100, Math.max(0, pct)), source: 'Interactive App' };
    }
    // Check physics_labs if applicable
    if (state.physicsLabs && reg.firestorePath === 'physics_labs') {
      const pl = state.physicsLabs;
      if (typeof pl.score === 'number') {
        return { pct: Math.min(100, Math.max(0, Math.round(pl.score))), source: 'Physics Lab' };
      }
    }
    return null;
  }

  function getLetterGrade(pct) {
    if (pct >= 90) return { letter: 'A', cls: 'grade-a' };
    if (pct >= 80) return { letter: 'B', cls: 'grade-b' };
    if (pct >= 70) return { letter: 'C', cls: 'grade-c' };
    if (pct >= 60) return { letter: 'D', cls: 'grade-d' };
    return { letter: 'F', cls: 'grade-f' };
  }

  function computeGradeSummary() {
    let earned = 0;
    let possible = 0;
    let projectedAdded = 0;
    let totalMissingPts = 0;

    state.items.forEach((item) => {
      if (item.inCurrentGrade) {
        possible += item.maxPoints;
        earned += item.currentPts;
      }
      if (item.category === 'missing' || item.category === 'low') {
        totalMissingPts += item.potentialGain;
      }
      if (state.selectedIds.has(item.id)) {
        const targetPts = item.maxPoints * state.simulateTarget;
        const gain = Math.max(0, targetPts - item.currentPts);
        // If assignment wasn't in current denominator yet (future/ungraded), include it in projected denominator
        if (!item.inCurrentGrade) {
          possible += item.maxPoints;
        }
        projectedAdded += gain;
      }
    });

    // Recompute currentPossible cleanly (separate from ungraded selected)
    let curPossible = 0;
    let curEarned = 0;
    let projPossible = 0;
    let projEarned = 0;

    state.items.forEach((item) => {
      if (item.inCurrentGrade) {
        curPossible += item.maxPoints;
        curEarned += item.currentPts;
        projPossible += item.maxPoints;
        if (state.selectedIds.has(item.id)) {
          const targetPts = item.maxPoints * state.simulateTarget;
          projEarned += Math.max(item.currentPts, targetPts);
        } else {
          projEarned += item.currentPts;
        }
      } else if (state.selectedIds.has(item.id)) {
        projPossible += item.maxPoints;
        projEarned += item.maxPoints * state.simulateTarget;
      }
    });

    const curPct = curPossible > 0 ? (curEarned / curPossible) * 100 : 0;
    const projPct = projPossible > 0 ? (projEarned / projPossible) * 100 : 0;
    const boostPct = projPct - curPct;

    // Points needed for next threshold (60, 70, 80, 90)
    const thresholds = [60, 70, 80, 90];
    const nextThresh = thresholds.find((t) => projPct < t) || null;
    let ptsToNext = null;
    if (nextThresh !== null && projPossible > 0) {
      ptsToNext = Math.max(0, Math.ceil((nextThresh / 100) * projPossible - projEarned));
    }

    return {
      curEarned: Number(curEarned.toFixed(1)),
      curPossible: Number(curPossible.toFixed(1)),
      curPct,
      projEarned: Number(projEarned.toFixed(1)),
      projPossible: Number(projPossible.toFixed(1)),
      projPct,
      boostPct,
      totalMissingPts: Number(totalMissingPts.toFixed(1)),
      nextThresh,
      ptsToNext
    };
  }

  // Rendering
  function renderAll() {
    renderHeaderProfile();
    renderCourseBar();
    renderClassroomBanner();
    renderSummaryMeter();
    renderFilterTabs();
    renderAssignmentsList();
  }

  function renderHeaderProfile() {
    const el = $('student-profile-pill');
    if (!el || !state.user) return;
    const periodText = state.roster && state.roster.class_period !== undefined && state.roster.class_period !== null
      ? `Period ${state.roster.class_period}`
      : 'OUSD Student';
    const name = (state.roster && state.roster.name) || state.user.displayName || state.user.email;
    el.innerHTML = `
      <span class="pill-name">${escapeHtml(name)}</span>
      <span class="pill-sep">•</span>
      <span class="pill-period">${escapeHtml(periodText)}</span>
    `;
    el.classList.remove('hidden');
  }

  function renderCourseBar() {
    const wrap = $('course-selector-wrap');
    const sel = $('course-select');
    if (!wrap || !sel) return;
    if (!state.classroomConnected || state.courses.length === 0) {
      wrap.classList.add('hidden');
      return;
    }
    wrap.classList.remove('hidden');
    sel.innerHTML = state.courses
      .map((c) => {
        const label = c.section ? `${c.name} (${c.section})` : c.name;
        const selected = c.id === state.selectedCourseId ? 'selected' : '';
        return `<option value="${escapeHtml(c.id)}" ${selected}>${escapeHtml(label)}</option>`;
      })
      .join('');
  }

  function renderClassroomBanner() {
    const banner = $('classroom-connect-banner');
    if (!banner) return;
    if (state.classroomConnected) {
      banner.classList.add('hidden');
      return;
    }
    banner.classList.remove('hidden');
    const msgEl = $('classroom-banner-msg');
    if (msgEl) {
      msgEl.textContent = state.classroomError
        ? state.classroomError
        : 'Connect your Google Classroom account to pull every missing assignment, quiz, and lab grade automatically.';
    }
  }

  function renderSummaryMeter() {
    const summary = computeGradeSummary();
    const curGrade = getLetterGrade(summary.curPct);
    const projGrade = getLetterGrade(summary.projPct);

    $('cur-pct').textContent = summary.curPossible > 0 ? `${summary.curPct.toFixed(1)}%` : '--';
    $('cur-letter').textContent = summary.curPossible > 0 ? curGrade.letter : '-';
    $('cur-letter').className = `grade-letter ${curGrade.cls}`;
    $('cur-pts').textContent = `${summary.curEarned} / ${summary.curPossible} pts`;

    $('proj-pct').textContent = summary.projPossible > 0 ? `${summary.projPct.toFixed(1)}%` : '--';
    $('proj-letter').textContent = summary.projPossible > 0 ? projGrade.letter : '-';
    $('proj-letter').className = `grade-letter ${projGrade.cls}`;
    $('proj-pts').textContent = `${summary.projEarned} / ${summary.projPossible} pts`;

    const boostEl = $('boost-delta');
    if (summary.boostPct > 0.05) {
      boostEl.textContent = `+${summary.boostPct.toFixed(1)}% boost (${state.selectedIds.size} selected)`;
      boostEl.classList.add('positive');
    } else {
      boostEl.textContent = 'Check assignments below to simulate your grade boost';
      boostEl.classList.remove('positive');
    }

    const goalEl = $('goal-hint');
    if (summary.nextThresh !== null && summary.ptsToNext !== null) {
      const targetLetter = getLetterGrade(summary.nextThresh).letter;
      goalEl.textContent = `Need +${summary.ptsToNext} more pts to reach a ${targetLetter} (${summary.nextThresh}%).`;
    } else if (summary.projPossible > 0) {
      goalEl.textContent = 'You are in the A range — keep it up!';
    } else {
      goalEl.textContent = 'Connect Google Classroom to see your live point targets.';
    }

    const bar = $('proj-progress-fill');
    if (bar) {
      bar.style.width = `${Math.min(100, Math.max(0, summary.projPct))}%`;
    }
  }

  function renderFilterTabs() {
    const counts = {
      actionable: 0,
      missing: 0,
      low: 0,
      apps: 0,
      pending: 0,
      done: 0,
      all: state.items.length
    };
    state.items.forEach((i) => {
      if (i.category === 'missing') counts.missing++;
      if (i.category === 'low' || i.category === 'polish') counts.low++;
      if (i.category === 'missing' || i.category === 'low' || i.category === 'polish') counts.actionable++;
      if (i.appUrl && (i.category === 'missing' || i.category === 'low' || i.category === 'polish')) counts.apps++;
      if (i.category === 'pending') counts.pending++;
      if (i.category === 'done') counts.done++;
    });

    document.querySelectorAll('[data-filter]').forEach((btn) => {
      const f = btn.getAttribute('data-filter');
      const countSpan = btn.querySelector('.tab-count');
      if (countSpan) countSpan.textContent = counts[f] ?? 0;
      btn.classList.toggle('active', state.activeFilter === f);
    });
  }

  function renderAssignmentsList() {
    const container = $('assignments-list');
    if (!container) return;

    const filtered = state.items.filter((item) => {
      switch (state.activeFilter) {
        case 'actionable':
          return item.category === 'missing' || item.category === 'low' || item.category === 'polish';
        case 'missing':
          return item.category === 'missing';
        case 'low':
          return item.category === 'low' || item.category === 'polish';
        case 'apps':
          return Boolean(item.appUrl) && (item.category === 'missing' || item.category === 'low' || item.category === 'polish');
        case 'pending':
          return item.category === 'pending';
        case 'done':
          return item.category === 'done';
        default:
          return true;
      }
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🎉</div>
          <h3>Nothing in this filter!</h3>
          <p>${state.activeFilter === 'actionable'
            ? 'Awesome job — you have no missing or low-score assignments right now.'
            : 'Try switching tabs above to view other assignments.'}</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map((item) => renderAssignmentCard(item)).join('');

    // Wire checkboxes
    container.querySelectorAll('.plan-checkbox').forEach((cb) => {
      cb.addEventListener('change', (e) => {
        const id = e.target.getAttribute('data-id');
        if (e.target.checked) state.selectedIds.add(id);
        else state.selectedIds.delete(id);
        renderSummaryMeter();
        const card = e.target.closest('.assignment-card');
        if (card) card.classList.toggle('in-plan', e.target.checked);
      });
    });
  }

  function renderAssignmentCard(item) {
    const canSimulate = item.category === 'missing' || item.category === 'low' || item.category === 'polish';
    const checked = state.selectedIds.has(item.id);
    const badgeInfo = getCategoryBadge(item);
    const dueStr = item.due ? item.due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No due date';
    const rawScoreStr = item.assignedGrade !== null ? `${item.assignedGrade} / ${item.maxPoints} pts` : `0 / ${item.maxPoints} pts`;
    const scoreStr = item.floorApplied
      ? `${rawScoreStr} (50% min → ${item.currentPts} pts)`
      : rawScoreStr;

    const appSyncNote = (item.appScoreData && item.appScoreData.pct > ((item.rawPts ?? item.currentPts) / item.maxPoints) * 100)
      ? `<span class="sync-hint">✓ App score saved (${item.appScoreData.pct}%) — awaiting Classroom sync</span>`
      : '';

    return `
      <article class="assignment-card cat-${item.category} ${checked ? 'in-plan' : ''}">
        <div class="card-top">
          <div class="card-badges">
            <span class="cat-badge ${badgeInfo.cls}">${badgeInfo.label}</span>
            ${item.unit ? `<span class="unit-badge">${escapeHtml(item.unit)}</span>` : ''}
            ${item.potentialGain > 0 ? `<span class="gain-badge">+${item.potentialGain} pts possible</span>` : ''}
          </div>
          <div class="card-score">${escapeHtml(scoreStr)}</div>
        </div>

        <h3 class="card-title">${escapeHtml(item.title)}</h3>

        <div class="card-meta">
          <span>Due: ${escapeHtml(dueStr)}</span>
          ${appSyncNote}
        </div>

        <div class="card-actions">
          ${canSimulate ? `
            <label class="plan-toggle">
              <input type="checkbox" class="plan-checkbox" data-id="${escapeHtml(item.id)}" ${checked ? 'checked' : ''}>
              <span>Add to Break Plan</span>
            </label>
          ` : '<span></span>'}

          <div class="action-buttons">
            ${item.appUrl ? `
              <a href="${escapeHtml(item.appUrl)}" target="_blank" rel="noopener" class="btn-launch-app">
                🚀 Open Interactive App
              </a>
            ` : ''}
            <a href="${escapeHtml(item.classroomUrl)}" target="_blank" rel="noopener" class="btn-classroom">
              📚 Open in Classroom
            </a>
          </div>
        </div>
      </article>
    `;
  }

  function getCategoryBadge(item) {
    switch (item.category) {
      case 'missing':
        return { label: 'Missing / 0 pts', cls: 'badge-missing' };
      case 'low':
        return { label: 'Low Score (<75%)', cls: 'badge-low' };
      case 'polish':
        return { label: 'Can Improve', cls: 'badge-polish' };
      case 'pending':
        return { label: 'Turned In (Pending Grade)', cls: 'badge-pending' };
      default:
        return { label: 'Completed', cls: 'badge-done' };
    }
  }

  function showLoadingState(show, msg) {
    const el = $('loading-panel');
    const main = $('dashboard-content');
    if (el) {
      el.classList.toggle('hidden', !show);
      const t = $('loading-msg');
      if (t && msg) t.textContent = msg;
    }
    if (main) {
      main.classList.toggle('hidden', show);
    }
  }

  function showStatusBanner(msg, type) {
    const el = $('status-banner');
    if (!el) return;
    if (!msg) {
      el.classList.add('hidden');
      return;
    }
    el.textContent = msg;
    el.className = `status-banner ${type || 'info'}`;
    el.classList.remove('hidden');
  }

  // Quick plan actions
  function wirePlanControls() {
    $('btn-select-top3')?.addEventListener('click', () => {
      state.selectedIds.clear();
      state.items
        .filter((i) => i.category === 'missing' || i.category === 'low')
        .slice(0, 3)
        .forEach((i) => state.selectedIds.add(i.id));
      renderAll();
    });

    $('btn-select-missing')?.addEventListener('click', () => {
      state.items
        .filter((i) => i.category === 'missing')
        .forEach((i) => state.selectedIds.add(i.id));
      renderAll();
    });

    $('btn-clear-plan')?.addEventListener('click', () => {
      state.selectedIds.clear();
      renderAll();
    });

    $('btn-print-plan')?.addEventListener('click', () => {
      window.print();
    });

    $('target-score-select')?.addEventListener('change', (e) => {
      state.simulateTarget = Number(e.target.value) || 1.0;
      renderSummaryMeter();
    });

    $('course-select')?.addEventListener('change', async (e) => {
      state.selectedCourseId = e.target.value;
      state.selectedIds.clear();
      await loadSelectedCourseWork();
    });

    document.querySelectorAll('[data-filter]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.activeFilter = btn.getAttribute('data-filter');
        renderFilterTabs();
        renderAssignmentsList();
      });
    });

    $('btn-google-login')?.addEventListener('click', signInWithClassroom);
    $('btn-connect-classroom')?.addEventListener('click', connectClassroomOnly);
    $('btn-sign-out')?.addEventListener('click', () => {
      clearCachedToken();
      state.accessToken = null;
      state.classroomConnected = false;
      auth.signOut();
    });
  }

  // Auth listener
  function initAuth() {
    auth.onAuthStateChanged(async (user) => {
      if (!user) {
        state.user = null;
        $('auth-gate').classList.remove('hidden');
        $('dashboard-shell').classList.add('hidden');
        setLoginBusy(false);
        return;
      }

      if (!isAuthorizedEmail(user.email)) {
        alert(`Access restricted to @orangeusd.org school accounts. Signed in as: ${user.email}`);
        clearCachedToken();
        await auth.signOut();
        return;
      }

      state.user = user;
      state.studentId = user.email.toLowerCase().split('@')[0];
      if (!state.accessToken) {
        state.accessToken = getCachedToken();
      }

      $('auth-gate').classList.add('hidden');
      $('dashboard-shell').classList.remove('hidden');
      showLoadingState(true, 'Loading your Physics profile...');

      await loadFirestoreData();

      if (state.accessToken) {
        await loadClassroomData();
      } else {
        buildFallbackItemsFromRegistry();
        showLoadingState(false);
        renderAll();
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initAccessibilityControls();
    wirePlanControls();
    initAuth();
  });
})();
