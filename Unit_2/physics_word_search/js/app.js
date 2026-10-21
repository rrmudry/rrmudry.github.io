/**
 * Physics Word Search Quest - Application Controller
 * High-Contrast Light Mode (WCAG AAA), Cosmic Dark Mode, Google Auth,
 * Touch/Pointer Drag Mechanics, Web Audio Synthesis & Firestore Grade Submission.
 */

// -----------------------------------------------------------------------------
// Constants & Configuration
// -----------------------------------------------------------------------------
const ASSIGNMENT_ID = 'unit2_day38_physics_word_search';
const LOCAL_STORAGE_PREFIX = 'phys_word_search_';

const FIREBASE_CONFIG = {
  projectId: "site-6e500",
  appId: "1:591530758858:web:1996cdca7316ffc3781a33",
  storageBucket: "site-6e500.firebasestorage.app",
  apiKey: "AIzaSyAji2nTjD2dbmzgk8gySWCy-aiQyKvR1i4",
  authDomain: "site-6e500.firebaseapp.com",
  messagingSenderId: "591530758858"
};

// -----------------------------------------------------------------------------
// Application State
// -----------------------------------------------------------------------------
const AppState = {
  activeMissionId: 'kinematics',
  clueMode: 'words', // 'words' | 'clues'
  engine: null,
  audio: null,
  missions: {}, // missionId -> { engine, grid, placedWords, foundWords: Map(word -> { colorTheme, coords }), score: 0 }
  
  // User & Auth State
  user: null,
  studentId: null,
  studentName: 'Guest Student',
  studentEmail: '',
  classPeriod: 1,
  isSubmitting: false,

  // Drag interaction state
  isDragging: false,
  dragStartCell: null,
  currentPath: [],
  hintCooldown: false
};

// -----------------------------------------------------------------------------
// Initialization
// -----------------------------------------------------------------------------
let db = null;

document.addEventListener('DOMContentLoaded', () => {
  initThemeAndFont();
  initAudioManager();
  initFirebase();
  initMissions();
  setupPointerEvents();
  setupUIEventListeners();
  renderMissionTabs();
  loadMission(AppState.activeMissionId);
  initAutoSave();
});

// -----------------------------------------------------------------------------
// 1. Theme & Font Scaling
// -----------------------------------------------------------------------------
function initThemeAndFont() {
  const savedTheme = localStorage.getItem('site_theme') || 'light';
  if (savedTheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  updateThemeButtonText();

  const savedFont = localStorage.getItem('site_font_size') || 'normal';
  setFontSize(savedFont, false);
}

function toggleTheme() {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('site_theme', isDark ? 'dark' : 'light');
  updateThemeButtonText();
}

function updateThemeButtonText() {
  const btn = document.getElementById('themeToggleBtn');
  if (btn) {
    const isDark = document.documentElement.classList.contains('dark');
    btn.innerHTML = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
  }
}

function setFontSize(size, save = true) {
  document.documentElement.classList.remove('font-normal', 'font-large', 'font-projector');
  document.documentElement.classList.add(`font-${size}`);
  
  document.querySelectorAll('.font-size-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.size === size);
  });

  if (save) {
    localStorage.setItem('site_font_size', size);
  }
}

// -----------------------------------------------------------------------------
// 2. Audio Manager Initialization
// -----------------------------------------------------------------------------
function initAudioManager() {
  AppState.audio = new PhysicsAudioManager();
  updateAudioButtonText();
}

function toggleAudio() {
  const isEnabled = AppState.audio.toggleSound();
  updateAudioButtonText();
  if (isEnabled) AppState.audio.playTick();
}

function updateAudioButtonText() {
  const btn = document.getElementById('btn-toggle-sound');
  if (btn) {
    btn.innerHTML = AppState.audio.enabled ? '🔊 Sound: ON' : '🔇 Sound: OFF';
  }
}

// -----------------------------------------------------------------------------
// 3. Firebase Authentication & Firestore
// -----------------------------------------------------------------------------
function initFirebase() {
  try {
    if (typeof firebase !== 'undefined') {
      if (!firebase.apps.length) {
        firebase.initializeApp(FIREBASE_CONFIG);
      }
      db = firebase.firestore();
      initAuthListener();
    }
  } catch (err) {
    console.warn('Firebase initialization error:', err);
  }
}

function initAuthListener() {
  firebase.auth().onAuthStateChanged(async (user) => {
    const authStatusEl = document.getElementById('auth-user-status');

    if (user) {
      const email = (user.email || '').toLowerCase();
      if (email.endsWith('@orangeusd.org') || email === 'ryan.mudry@gmail.com') {
        AppState.user = user;
        AppState.studentId = email.split('@')[0];
        AppState.studentName = user.displayName || AppState.studentId;
        AppState.studentEmail = email;

        if (authStatusEl) {
          authStatusEl.innerHTML = `
            <div style="display:flex; align-items:center; gap:0.5rem;">
              <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:var(--accent-emerald);"></span>
              <span><strong>${AppState.studentName}</strong> (${AppState.studentId})</span>
              <button type="button" id="btn-signout" class="btn btn-sm" style="padding:0.2rem 0.5rem; font-size:0.75rem;">Sign Out</button>
            </div>
          `;
          document.getElementById('btn-signout')?.addEventListener('click', () => firebase.auth().signOut());
        }

        await resolveStudentRosterPeriod(AppState.studentId, email);
        await loadPriorSubmission();
      } else {
        firebase.auth().signOut();
        alert('Please sign in with your official district Google account (@orangeusd.org).');
      }
    } else {
      AppState.user = null;
      AppState.studentId = null;
      AppState.studentName = 'Guest Student';
      AppState.studentEmail = '';

      if (authStatusEl) {
        authStatusEl.innerHTML = `
          <button type="button" id="btn-signin" class="btn btn-primary btn-sm">
            🔑 Sign In with Google (@orangeusd.org)
          </button>
        `;
        document.getElementById('btn-signin')?.addEventListener('click', signInWithGoogle);
      }
      loadLocalDraft('guest');
    }
  });
}

async function signInWithGoogle() {
  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ hd: 'orangeusd.org' });
    await firebase.auth().signInWithPopup(provider);
  } catch (err) {
    console.error('Sign-in error:', err);
    alert('Sign-in failed: ' + err.message);
  }
}

async function resolveStudentRosterPeriod(studentId, email) {
  if (!db) return;
  try {
    let snap = await db.collection('roster').doc(studentId).get();
    if (!snap.exists) {
      const qSnap = await db.collection('roster').where('email', '==', email).limit(1).get();
      if (!qSnap.empty) snap = qSnap.docs[0];
    }
    if (snap.exists) {
      const data = snap.data();
      const periodVal = data.class_period !== undefined ? data.class_period : (data.period !== undefined ? data.period : null);
      if (periodVal !== null && periodVal !== undefined) {
        AppState.classPeriod = parseInt(periodVal, 10);
        const periodSelect = document.getElementById('student-period');
        if (periodSelect) periodSelect.value = String(AppState.classPeriod);
      }
    }
  } catch (err) {
    console.warn('Roster lookup note:', err.message);
  }
}

// -----------------------------------------------------------------------------
// 4. Mission Setup & Grid Generation
// -----------------------------------------------------------------------------
function initMissions() {
  WORD_SEARCH_MISSIONS.forEach(mission => {
    const engine = new WordSearchEngine(mission.gridSize || 14);
    const result = engine.generate(mission.words);
    
    AppState.missions[mission.id] = {
      missionData: mission,
      engine: engine,
      grid: result.grid,
      placedWords: result.placedWords,
      foundWords: new Map(), // word -> { themeClass, coords }
      score: 0
    };
  });
}

function renderMissionTabs() {
  const container = document.getElementById('mission-tabs-container');
  if (!container) return;

  container.innerHTML = WORD_SEARCH_MISSIONS.map(m => {
    const activeClass = m.id === AppState.activeMissionId ? 'active' : '';
    const missionState = AppState.missions[m.id];
    const score = missionState ? missionState.foundWords.size : 0;
    const badgeText = score >= 10 ? '⭐ 10/10' : `${score}/10 pts`;

    return `
      <button class="mission-tab ${activeClass}" data-mission="${m.id}" onclick="selectMission('${m.id}')">
        <div class="mission-tab-icon">${m.icon}</div>
        <div style="flex:1;">
          <div class="mission-tab-title">${m.title}</div>
          <div class="mission-tab-sub">${m.subtitle}</div>
        </div>
        <span class="badge ${score >= 8 ? 'badge-success' : ''}">${badgeText}</span>
      </button>
    `;
  }).join('');
}

function selectMission(missionId) {
  if (AppState.activeMissionId === missionId) return;
  AppState.activeMissionId = missionId;
  AppState.audio.playTick();
  renderMissionTabs();
  loadMission(missionId);
}

function loadMission(missionId) {
  const missionObj = AppState.missions[missionId];
  if (!missionObj) return;

  // Render Mission Header Info
  const titleEl = document.getElementById('active-mission-title');
  const badgeEl = document.getElementById('active-mission-badge');
  const descEl = document.getElementById('active-mission-desc');

  if (titleEl) titleEl.textContent = missionObj.missionData.title;
  if (badgeEl) badgeEl.textContent = missionObj.missionData.badge;
  if (descEl) descEl.textContent = missionObj.missionData.description;

  // Render Print Header info
  const printTitle = document.getElementById('print-mission-title');
  if (printTitle) printTitle.textContent = `${missionObj.missionData.title} • ${missionObj.missionData.badge}`;

  // Render Grid
  renderLetterGrid(missionObj);

  // Render Word Bank / Clues
  renderWordList(missionObj);

  // Update Score & HUD
  updateProgressHUD(missionObj);
}

// -----------------------------------------------------------------------------
// 5. Letter Grid Rendering & Visuals
// -----------------------------------------------------------------------------
function renderLetterGrid(missionObj) {
  const gridContainer = document.getElementById('word-search-grid');
  if (!gridContainer) return;

  const size = missionObj.engine.size;
  gridContainer.style.gridTemplateColumns = `repeat(${size}, var(--tile-size))`;
  gridContainer.innerHTML = '';

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const letter = missionObj.grid[r][c];
      const tile = document.createElement('div');
      tile.className = 'grid-tile';
      tile.dataset.r = r;
      tile.dataset.c = c;
      tile.textContent = letter;

      // Check if tile is part of a previously found word
      for (const [foundWord, foundData] of missionObj.foundWords.entries()) {
        const isPart = foundData.coords.some(pt => pt.r === r && pt.c === c);
        if (isPart) {
          tile.classList.add('found', foundData.themeClass);
        }
      }

      gridContainer.appendChild(tile);
    }
  }
}

// -----------------------------------------------------------------------------
// 6. Word List & Concept Clue Rendering
// -----------------------------------------------------------------------------
function setClueMode(mode) {
  AppState.clueMode = mode;
  AppState.audio.playTick();

  document.querySelectorAll('.mode-toggle-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });

  const missionObj = AppState.missions[AppState.activeMissionId];
  if (missionObj) {
    renderWordList(missionObj);
  }
}

function renderWordList(missionObj) {
  const listContainer = document.getElementById('word-items-list');
  if (!listContainer) return;

  const isClueMode = AppState.clueMode === 'clues';

  listContainer.innerHTML = missionObj.missionData.words.map((item, idx) => {
    const cleanWord = item.word.toUpperCase().replace(/[^A-Z]/g, '');
    const isFound = missionObj.foundWords.has(cleanWord);
    const foundData = isFound ? missionObj.foundWords.get(cleanWord) : null;
    const themeClass = foundData ? foundData.themeClass : '';

    // In Clue Mode, mask the word until discovered
    const displayWord = (!isClueMode || isFound) ? item.word : `CLUE #${idx + 1}: [ ? ? ? ? ? ]`;
    const checkIcon = isFound ? '✓' : (idx + 1);

    return `
      <div class="word-item-card ${isFound ? 'found ' + themeClass : ''}" id="card-word-${cleanWord}">
        <div class="word-status-icon">${checkIcon}</div>
        <div class="word-content-body">
          <div class="word-term-row">
            <span class="word-term-text">${displayWord}</span>
            <span class="word-category-pill">${item.category}</span>
          </div>
          <div class="word-clue-text">${item.clue}</div>
          <div class="word-formula-tag">${item.formula}</div>
        </div>
      </div>
    `;
  }).join('');
}

// -----------------------------------------------------------------------------
// 7. Touch & Pointer Drag Word Selection
// -----------------------------------------------------------------------------
function setupPointerEvents() {
  const gridContainer = document.getElementById('word-search-grid');
  if (!gridContainer) return;

  // Pointer Down (Mouse click or finger touch start)
  gridContainer.addEventListener('pointerdown', (e) => {
    const tile = e.target.closest('.grid-tile');
    if (!tile) return;

    AppState.isDragging = true;
    AppState.dragStartCell = {
      r: parseInt(tile.dataset.r, 10),
      c: parseInt(tile.dataset.c, 10)
    };
    AppState.currentPath = [AppState.dragStartCell];

    clearTracerHighlights();
    tile.classList.add('selected');
    AppState.audio.playTick();

    // Prevent default touch gestures (pinch, scroll)
    e.preventDefault();
  });

  // Pointer Move (Mouse move or touch drag across tiles)
  window.addEventListener('pointermove', (e) => {
    if (!AppState.isDragging || !AppState.dragStartCell) return;

    // Use elementFromPoint for 100% reliable touch drag on Chromebook touchscreens
    const element = document.elementFromPoint(e.clientX, e.clientY);
    const tile = element ? element.closest('.grid-tile') : null;
    if (!tile) return;

    const currentR = parseInt(tile.dataset.r, 10);
    const currentC = parseInt(tile.dataset.c, 10);

    const missionObj = AppState.missions[AppState.activeMissionId];
    const newPath = missionObj.engine.calculateVectorPath(
      AppState.dragStartCell.r,
      AppState.dragStartCell.c,
      currentR,
      currentC
    );

    // If path changed length or direction, update visual highlights
    if (newPath.length !== AppState.currentPath.length || 
        newPath[newPath.length - 1].r !== currentR || 
        newPath[newPath.length - 1].c !== currentC) {
      
      AppState.currentPath = newPath;
      updateTracerHighlights(newPath);
      AppState.audio.playTick(500 + newPath.length * 20);
    }
  });

  // Pointer Up / Cancel (Finger lifted or mouse released)
  const finishSelection = () => {
    if (!AppState.isDragging) return;
    AppState.isDragging = false;

    const missionObj = AppState.missions[AppState.activeMissionId];
    if (AppState.currentPath.length >= 2) {
      evaluateSelectedPath(missionObj, AppState.currentPath);
    } else {
      clearTracerHighlights();
    }

    AppState.dragStartCell = null;
    AppState.currentPath = [];
  };

  window.addEventListener('pointerup', finishSelection);
  window.addEventListener('pointercancel', finishSelection);
}

function updateTracerHighlights(path) {
  clearTracerHighlights();
  const gridContainer = document.getElementById('word-search-grid');
  if (!gridContainer) return;

  path.forEach(pt => {
    const tile = gridContainer.querySelector(`.grid-tile[data-r="${pt.r}"][data-c="${pt.c}"]`);
    if (tile) tile.classList.add('selected');
  });
}

function clearTracerHighlights() {
  document.querySelectorAll('.grid-tile.selected').forEach(tile => {
    tile.classList.remove('selected');
  });
}

// -----------------------------------------------------------------------------
// 8. Word Validation & Discovery
// -----------------------------------------------------------------------------
function evaluateSelectedPath(missionObj, path) {
  // Find words in active mission not yet found
  const allMissionWords = missionObj.missionData.words.map(w => w.word.toUpperCase().replace(/[^A-Z]/g, ''));
  const unfoundWords = allMissionWords.filter(w => !missionObj.foundWords.has(w));

  const match = missionObj.engine.checkSelection(path, unfoundWords);

  if (match && match.success) {
    const word = match.word;
    const themeIndex = missionObj.foundWords.size % 10;
    const themeClass = `word-theme-${themeIndex}`;

    // Store found word
    missionObj.foundWords.set(word, {
      themeClass: themeClass,
      coords: match.coords
    });

    // Permanently style tiles
    const gridContainer = document.getElementById('word-search-grid');
    match.coords.forEach(pt => {
      const tile = gridContainer.querySelector(`.grid-tile[data-r="${pt.r}"][data-c="${pt.c}"]`);
      if (tile) {
        tile.classList.remove('selected');
        tile.classList.add('found', themeClass);
      }
    });

    // Play discovery chime
    AppState.audio.playWordFound();

    // Re-render word list to show strike-through
    renderWordList(missionObj);

    // Update HUD
    updateProgressHUD(missionObj);
    renderMissionTabs();

    // Trigger auto-save
    triggerAutoSave();

    // Check completion
    const count = missionObj.foundWords.size;
    if (count === 8) {
      showToast('🎉 Mastery Achieved (8/10 points)! Passing threshold unlocked.');
    } else if (count >= 10) {
      AppState.audio.playVictory();
      if (typeof confetti === 'function') {
        confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
      }
      openCertificateModal(missionObj);
    }
  } else {
    AppState.audio.playInvalid();
    clearTracerHighlights();
  }
}

// -----------------------------------------------------------------------------
// 9. Hint System
// -----------------------------------------------------------------------------
function useHint() {
  if (AppState.hintCooldown) return;

  const missionObj = AppState.missions[AppState.activeMissionId];
  const allMissionWords = missionObj.missionData.words.map(w => w.word.toUpperCase().replace(/[^A-Z]/g, ''));
  const unfoundWords = allMissionWords.filter(w => !missionObj.foundWords.has(w));

  if (unfoundWords.length === 0) {
    alert('All words in this mission have already been found!');
    return;
  }

  const targetWord = unfoundWords[0];
  const hint = missionObj.engine.getWordHint(targetWord);
  if (!hint) return;

  AppState.hintCooldown = true;
  AppState.audio.playHint();

  const gridContainer = document.getElementById('word-search-grid');
  const startTile = gridContainer.querySelector(`.grid-tile[data-r="${hint.start.r}"][data-c="${hint.start.c}"]`);

  if (startTile) {
    startTile.classList.add('hint-pulse');
    showToast(`💡 Hint: First letter "${hint.firstLetter}" starts at [Row ${hint.start.r + 1}, Col ${hint.start.c + 1}] (${hint.dirName})`);

    setTimeout(() => {
      startTile.classList.remove('hint-pulse');
      AppState.hintCooldown = false;
    }, 4000);
  }
}

// -----------------------------------------------------------------------------
// 10. Progress HUD & Scoring
// -----------------------------------------------------------------------------
function updateProgressHUD(missionObj) {
  const foundCount = missionObj.foundWords.size;
  const totalCount = missionObj.missionData.words.length;
  const points = foundCount; // 1 pt per word
  const pct = Math.round((foundCount / totalCount) * 100);

  const countEl = document.getElementById('hud-word-count');
  const scoreEl = document.getElementById('hud-points-score');
  const pctEl = document.getElementById('hud-pct-score');
  const fillEl = document.getElementById('hud-progress-fill');
  const submitBtn = document.getElementById('btn-submit-score');

  if (countEl) countEl.textContent = `${foundCount} / ${totalCount} Words`;
  if (scoreEl) scoreEl.textContent = `${points} / 10 Pts`;
  if (pctEl) pctEl.textContent = `${pct}%`;
  if (fillEl) fillEl.style.width = `${pct}%`;

  if (submitBtn) {
    if (points >= 8) {
      submitBtn.classList.add('ready');
      submitBtn.innerHTML = `🚀 Submit Final Grade (${points}/10 pts)`;
    } else {
      submitBtn.classList.remove('ready');
      submitBtn.innerHTML = `Submit Grade (${points}/10 pts • Need 8)`;
    }
  }
}

function showToast(message) {
  const banner = document.getElementById('toast-notification');
  if (!banner) return;
  banner.textContent = message;
  banner.style.display = 'block';
  setTimeout(() => {
    banner.style.display = 'none';
  }, 4500);
}

// -----------------------------------------------------------------------------
// 11. Firestore Gradebook Sync & Submission
// -----------------------------------------------------------------------------
function collectSubmissionData(missionObj) {
  const periodVal = parseInt(document.getElementById('student-period')?.value, 10) || AppState.classPeriod || 1;
  const points = missionObj.foundWords.size;
  const pct = points * 10;

  const foundWordsArray = Array.from(missionObj.foundWords.keys());

  return {
    student_id: AppState.studentId,
    student_name: AppState.studentName || 'Student',
    email: AppState.studentEmail || `${AppState.studentId}@orangeusd.org`,
    period: periodVal,
    class_period: periodVal,
    points: points,
    score: points,
    max_points: 10,
    maxScore: 10,
    percent: pct,
    percentage: pct,
    isCompleted: points >= 8,
    missionId: missionObj.missionData.id,
    missionTitle: missionObj.missionData.title,
    wordsFound: foundWordsArray,
    wordsFoundCount: foundWordsArray.length,
    verificationCode: generateVerificationCode(AppState.studentId, points, missionObj.missionData.id),
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    lastSavedAt: new Date().toISOString()
  };
}

function generateVerificationCode(studentId, score, missionId) {
  const seed = `${studentId}_${score}_${missionId}_DAY38_2026`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
  return `CAST-WS-${hex}-${score}PTS`;
}

function updateSaveIndicator(status, text) {
  const dot = document.getElementById('save-status-dot');
  const label = document.getElementById('save-status-text');
  if (!dot || !label) return;

  dot.className = 'save-dot ' + (status || '');
  label.textContent = text || 'Cloud Synced';
}

function saveLocalDraft(id) {
  try {
    const missionObj = AppState.missions[AppState.activeMissionId];
    const data = {
      activeMissionId: AppState.activeMissionId,
      period: AppState.classPeriod,
      missions: {}
    };

    WORD_SEARCH_MISSIONS.forEach(m => {
      const mObj = AppState.missions[m.id];
      if (mObj) {
        data.missions[m.id] = {
          foundWords: Array.from(mObj.foundWords.entries())
        };
      }
    });

    localStorage.setItem(LOCAL_STORAGE_PREFIX + (id || AppState.studentId || 'guest'), JSON.stringify(data));
  } catch (e) {
    console.warn('LocalStorage save error:', e);
  }
}

function loadLocalDraft(id) {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PREFIX + (id || AppState.studentId || 'guest'));
    if (!raw) return;
    const parsed = JSON.parse(raw);

    if (parsed.period) {
      AppState.classPeriod = parsed.period;
      const select = document.getElementById('student-period');
      if (select) select.value = String(parsed.period);
    }

    if (parsed.missions) {
      Object.keys(parsed.missions).forEach(mId => {
        const stored = parsed.missions[mId];
        const mObj = AppState.missions[mId];
        if (mObj && stored.foundWords) {
          stored.foundWords.forEach(([word, info]) => {
            mObj.foundWords.set(word, info);
          });
        }
      });
    }

    const currMission = AppState.missions[AppState.activeMissionId];
    if (currMission) {
      renderLetterGrid(currMission);
      renderWordList(currMission);
      updateProgressHUD(currMission);
      renderMissionTabs();
    }
  } catch (e) {
    console.warn('LocalStorage load draft error:', e);
  }
}

let autoSaveTimer = null;
function triggerAutoSave() {
  saveLocalDraft();
  if (!AppState.studentId || !db) {
    updateSaveIndicator('local', AppState.studentId ? 'Saved Locally' : 'Saved Locally (Sign in to sync)');
    return;
  }

  updateSaveIndicator('syncing', 'Saving Draft...');
  if (autoSaveTimer) clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(async () => {
    await saveStudentSubmission({ isExplicitSubmit: false });
  }, 1200);
}

function initAutoSave() {
  const periodSelect = document.getElementById('student-period');
  if (periodSelect) {
    periodSelect.addEventListener('change', () => {
      AppState.classPeriod = parseInt(periodSelect.value, 10);
      triggerAutoSave();
    });
  }
}

async function loadPriorSubmission() {
  if (!db || !AppState.studentId) return;
  try {
    const docRef = db.collection('student_results')
      .doc(ASSIGNMENT_ID)
      .collection('students')
      .doc(AppState.studentId);

    const snap = await docRef.get();
    if (snap.exists) {
      const data = snap.data();
      if (data.period) {
        AppState.classPeriod = data.period;
        const select = document.getElementById('student-period');
        if (select) select.value = String(data.period);
      }
      if (data.wordsFound && data.missionId) {
        const mObj = AppState.missions[data.missionId];
        if (mObj) {
          data.wordsFound.forEach((word, idx) => {
            if (!mObj.foundWords.has(word)) {
              const themeClass = `word-theme-${idx % 10}`;
              const placed = mObj.placedWords.get(word);
              mObj.foundWords.set(word, {
                themeClass: themeClass,
                coords: placed ? placed.coords : []
              });
            }
          });
          renderLetterGrid(mObj);
          renderWordList(mObj);
          updateProgressHUD(mObj);
          renderMissionTabs();
        }
      }
      updateSaveIndicator('cloud', 'Cloud Synced');
    } else {
      loadLocalDraft(AppState.studentId);
      updateSaveIndicator('cloud', 'Cloud Ready');
    }
  } catch (err) {
    console.warn('Prior submission lookup note:', err);
    loadLocalDraft(AppState.studentId);
  }
}

async function saveStudentSubmission({ isExplicitSubmit = false } = {}) {
  if (AppState.isSubmitting) return;

  const missionObj = AppState.missions[AppState.activeMissionId];
  if (!missionObj) return;

  if (!AppState.user || !AppState.studentId) {
    saveLocalDraft();
    updateSaveIndicator('local', 'Saved Locally (Sign in to sync)');
    if (isExplicitSubmit) {
      alert('Please click "🔑 Sign In with Google (@orangeusd.org)" at the top before submitting your grade!');
    }
    return;
  }

  AppState.isSubmitting = true;
  updateSaveIndicator('syncing', isExplicitSubmit ? 'Saving Grade...' : 'Saving Draft...');

  try {
    const studentRef = db.collection('student_results')
      .doc(ASSIGNMENT_ID)
      .collection('students')
      .doc(AppState.studentId);

    // Read previous grade to guarantee Rule B (higher score wins)
    const existingSnap = await studentRef.get();
    const existingScore = existingSnap.exists ? (existingSnap.data().points || 0) : 0;
    const currentPoints = missionObj.foundWords.size;
    const finalScore = Math.max(currentPoints, existingScore);

    const payload = collectSubmissionData(missionObj);
    payload.points = finalScore;
    payload.score = finalScore;
    payload.percent = finalScore * 10;
    payload.percentage = finalScore * 10;
    payload.isCompleted = finalScore >= 8;

    // Deep sanitizer to eliminate undefined
    function sanitize(obj) {
      if (!obj || typeof obj !== 'object') return;
      Object.keys(obj).forEach(k => {
        if (obj[k] === undefined) {
          obj[k] = null;
        } else if (obj[k] && typeof obj[k] === 'object' && !(obj[k] instanceof Date) && !('nanoseconds' in obj[k])) {
          sanitize(obj[k]);
        }
      });
    }
    sanitize(payload);

    await studentRef.set(payload, { merge: true });

    saveLocalDraft();
    updateSaveIndicator('cloud', isExplicitSubmit ? 'Grade Recorded' : 'Cloud Synced');

    if (isExplicitSubmit) {
      openCertificateModal(missionObj, payload);
    }
  } catch (err) {
    console.error('Save submission error:', err);
    updateSaveIndicator('error', 'Sync Error');
    if (isExplicitSubmit) {
      alert('Could not submit grade: ' + err.message);
    }
  } finally {
    AppState.isSubmitting = false;
  }
}

// -----------------------------------------------------------------------------
// 12. Certificate Modal & Print
// -----------------------------------------------------------------------------
function openCertificateModal(missionObj, payloadData) {
  const modal = document.getElementById('certificate-modal');
  if (!modal) return;

  const points = payloadData ? payloadData.points : missionObj.foundWords.size;
  const pct = points * 10;
  const code = payloadData ? payloadData.verificationCode : generateVerificationCode(AppState.studentId || 'guest', points, missionObj.missionData.id);

  document.getElementById('cert-student-name').textContent = AppState.studentName || 'Student';
  document.getElementById('cert-student-id').textContent = AppState.studentId || 'Guest';
  document.getElementById('cert-period').textContent = `Period ${AppState.classPeriod}`;
  document.getElementById('cert-mission-name').textContent = missionObj.missionData.title;
  document.getElementById('cert-score-text').textContent = `${points} / 10`;
  document.getElementById('cert-pct-text').textContent = `${pct}%`;
  document.getElementById('cert-timestamp').textContent = new Date().toLocaleString();
  document.getElementById('cert-verification-code').textContent = code;

  modal.classList.add('open');
}

function closeCertificateModal() {
  const modal = document.getElementById('certificate-modal');
  if (modal) modal.classList.remove('open');
}

function printBlankWorksheet() {
  const missionObj = AppState.missions[AppState.activeMissionId];
  if (!missionObj) return;

  document.title = `Physics_Word_Search_${missionObj.missionData.id}_Worksheet`;
  window.print();
}

// -----------------------------------------------------------------------------
// 13. UI Event Listeners Hookup
// -----------------------------------------------------------------------------
function setupUIEventListeners() {
  document.getElementById('btn-toggle-sound')?.addEventListener('click', toggleAudio);
  document.getElementById('btn-use-hint')?.addEventListener('click', useHint);
  document.getElementById('btn-submit-score')?.addEventListener('click', () => {
    saveStudentSubmission({ isExplicitSubmit: true });
  });
  document.getElementById('btn-print-worksheet')?.addEventListener('click', printBlankWorksheet);
  document.getElementById('btn-close-cert')?.addEventListener('click', closeCertificateModal);
}
