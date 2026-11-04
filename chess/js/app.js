/* ==========================================================================
   Classroom Chess Arena — Main Controller (chess/js/app.js)
   Supports:
   1. Online Classmate Matchmaking (Google Auth + Firestore real-time sync)
      - 1-Click Quick Match (auto-pair queue with atomic transactions)
      - Direct Classmate Challenge (real-time invite banner)
      - Teacher Matchmaking Controls (batch-pair period + live spectating)
   2. Single Player vs. Chessbot (4 difficulty tiers)
   3. Two Players on 1 Device (Pass & Play with digital chess clocks)
   ========================================================================== */

(function () {
  'use strict';

  const TEACHER_EMAILS = [
    'rmudry@orangeusd.org',
    'ryan.mudry@gmail.com',
    'ryanmudry@gmail.com'
  ];

  const HEARTBEAT_MS = 20000;
  const ONLINE_TTL_MS = 95000;

  // Firestore collections (all covered by firestore.rules Section 13 & roster)
  const db = typeof firebase !== 'undefined' ? firebase.firestore() : null;
  const auth = typeof firebase !== 'undefined' ? firebase.auth() : null;

  // Sanitize payload before writing to Firestore (prevents undefined values)
  function sanitize(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  // Escape HTML for safe rendering of names
  function esc(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ------------------------------------------------------------------
  // DOM References
  // ------------------------------------------------------------------
  const el = {
    btnHome: document.getElementById('btnHome'),
    navModeBadge: document.getElementById('navModeBadge'),
    btnThemeToggle: document.getElementById('btn-theme-toggle'),
    btnSound: document.getElementById('btnSound'),

    // Views
    viewMenu: document.getElementById('viewMenu'),
    viewLounge: document.getElementById('viewLounge'),
    viewGame: document.getElementById('viewGame'),

    // Menu controls
    menuAuthStatus: document.getElementById('menuAuthStatus'),
    btnOpenLounge: document.getElementById('btnOpenLounge'),
    botDiffRow: document.getElementById('botDiffRow'),
    botColorRow: document.getElementById('botColorRow'),
    btnStartBot: document.getElementById('btnStartBot'),
    localTimeRow: document.getElementById('localTimeRow'),
    btnStartLocal: document.getElementById('btnStartLocal'),

    // Lounge controls
    loungeSignIn: document.getElementById('loungeSignIn'),
    btnGoogleSignIn: document.getElementById('btnGoogleSignIn'),
    authError: document.getElementById('authError'),
    loungeActive: document.getElementById('loungeActive'),
    meName: document.getElementById('meName'),
    mePeriodBadge: document.getElementById('mePeriodBadge'),
    meRecord: document.getElementById('meRecord'),
    loungePeriodFilter: document.getElementById('loungePeriodFilter'),
    btnSignOut: document.getElementById('btnSignOut'),

    incomingChallengeBanner: document.getElementById('incomingChallengeBanner'),
    challengeText: document.getElementById('challengeText'),
    btnAcceptChallenge: document.getElementById('btnAcceptChallenge'),
    btnDeclineChallenge: document.getElementById('btnDeclineChallenge'),

    teacherPanel: document.getElementById('teacherPanel'),
    btnTeacherPairAll: document.getElementById('btnTeacherPairAll'),

    onlineTimeRow: document.getElementById('onlineTimeRow'),
    btnQuickMatch: document.getElementById('btnQuickMatch'),
    btnCancelSeek: document.getElementById('btnCancelSeek'),
    seekStatusText: document.getElementById('seekStatusText'),
    onlineCount: document.getElementById('onlineCount'),
    loungePlayerList: document.getElementById('loungePlayerList'),
    liveGamesCount: document.getElementById('liveGamesCount'),
    liveMatchesList: document.getElementById('liveMatchesList'),
    loungeLeaderboard: document.getElementById('loungeLeaderboard'),

    // Game Arena controls
    barTop: document.getElementById('barTop'),
    discTop: document.getElementById('discTop'),
    nameTop: document.getElementById('nameTop'),
    trayTop: document.getElementById('trayTop'),
    clockTop: document.getElementById('clockTop'),

    boardGrid: document.getElementById('boardGrid'),

    barBottom: document.getElementById('barBottom'),
    discBottom: document.getElementById('discBottom'),
    nameBottom: document.getElementById('nameBottom'),
    trayBottom: document.getElementById('trayBottom'),
    clockBottom: document.getElementById('clockBottom'),

    gameStatusBanner: document.getElementById('gameStatusBanner'),
    drawOfferBanner: document.getElementById('drawOfferBanner'),
    btnAcceptDraw: document.getElementById('btnAcceptDraw'),
    btnDeclineDraw: document.getElementById('btnDeclineDraw'),
    moveCounter: document.getElementById('moveCounter'),
    moveLogWrap: document.getElementById('moveLogWrap'),
    moveTableBody: document.getElementById('moveTableBody'),

    btnFlipBoard: document.getElementById('btnFlipBoard'),
    btnHint: document.getElementById('btnHint'),
    btnOfferDraw: document.getElementById('btnOfferDraw'),
    btnResign: document.getElementById('btnResign'),

    postGameActions: document.getElementById('postGameActions'),
    btnRematch: document.getElementById('btnRematch'),
    btnBackToLounge: document.getElementById('btnBackToLounge'),

    promoModal: document.getElementById('promoModal'),
    promoChoices: document.getElementById('promoChoices'),
    toast: document.getElementById('toast')
  };

  // ------------------------------------------------------------------
  // Application State
  // ------------------------------------------------------------------
  let currentView = 'menu'; // 'menu' | 'lounge' | 'game'

  // Menu options
  let selectedBotDiff = 'medium';
  let selectedBotSide = 'w';
  let selectedLocalSec = 300;
  let selectedOnlineSec = 300;

  // Auth & Lounge state
  let currentUser = null;
  let myProfile = null; // { uid, studentId, name, email, period, isTeacher, wins, losses, draws }
  let myPlayerDoc = null;
  let onlinePlayers = [];
  let liveMatches = [];
  let unsubPlayers = null;
  let unsubMatches = null;
  let unsubActiveMatch = null;
  let heartbeatTimer = null;
  let lastChallengeAlertAt = 0;
  let dismissedMatchId = null;

  // Active Game state
  let gameMode = null; // 'online' | 'bot' | 'local' | 'spectate'
  let chessState = null;
  let myColor = 'w'; // 'w' | 'b'
  let boardFlipped = false; // false = White at bottom, true = Black at bottom
  let selectedSq = null; // [r, c]
  let legalTargets = []; // moves from selectedSq
  let hintMove = null; // { from: [r,c], to: [r,c] }
  let pendingPromoMove = null; // { from: [r,c], to: [r,c] }
  let botThinking = false;

  // Clocks & Online match metadata
  let activeMatchId = null;
  let activeMatchDoc = null;
  let timeControlSec = 300;
  let timeLeftMs = { w: 300000, b: 300000 };
  let turnStartedAt = 0;
  let gameEnded = false;
  let gameEndBannerText = '';
  let clockInterval = null;
  let topPlayerMeta = { name: 'Opponent', color: 'b', period: '' };
  let bottomPlayerMeta = { name: 'You', color: 'w', period: '' };

  // ------------------------------------------------------------------
  // Toast Helper
  // ------------------------------------------------------------------
  let toastTimeout = null;
  function showToast(msg, duration = 3200) {
    if (!el.toast) return;
    el.toast.textContent = msg;
    el.toast.hidden = false;
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      el.toast.hidden = true;
    }, duration);
  }

  // ------------------------------------------------------------------
  // Theme, Font Scale, and Sound Controls
  // ------------------------------------------------------------------
  function initThemeAndScale() {
    const savedTheme = localStorage.getItem('chess_theme') || 'dark';
    applyTheme(savedTheme);

    el.btnThemeToggle.addEventListener('click', () => {
      const cur = document.documentElement.getAttribute('data-theme') || 'dark';
      applyTheme(cur === 'dark' ? 'light' : 'dark');
    });

    const savedScale = localStorage.getItem('chess_scale') || 'normal';
    applyScale(savedScale);

    document.querySelectorAll('.scale-btn').forEach(btn => {
      btn.addEventListener('click', () => applyScale(btn.dataset.scale));
    });

    updateSoundButton();
    el.btnSound.addEventListener('click', () => {
      ChessAudio.toggleMute();
      updateSoundButton();
    });
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('chess_theme', theme); } catch (e) {}
    el.btnThemeToggle.textContent = theme === 'light' ? '🌙 Dark' : '☀️ Light';
  }

  function applyScale(scale) {
    document.documentElement.setAttribute('data-scale', scale);
    try { localStorage.setItem('chess_scale', scale); } catch (e) {}
    document.querySelectorAll('.scale-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.scale === scale);
    });
  }

  function updateSoundButton() {
    const muted = ChessAudio.isMuted();
    el.btnSound.textContent = muted ? '🔇 Muted' : '🔊 Sound';
  }

  // ------------------------------------------------------------------
  // View Switching
  // ------------------------------------------------------------------
  function showView(viewName) {
    currentView = viewName;
    el.viewMenu.hidden = viewName !== 'menu';
    el.viewLounge.hidden = viewName !== 'lounge';
    el.viewGame.hidden = viewName !== 'game';

    if (viewName === 'menu') {
      el.navModeBadge.textContent = 'Free-Time Arena';
    } else if (viewName === 'lounge') {
      el.navModeBadge.textContent = 'Classmate Lounge';
    }
  }

  el.btnHome.addEventListener('click', () => {
    if (currentView === 'game' && !gameEnded && gameMode === 'online') {
      showView('lounge');
      return;
    }
    stopLocalClock();
    showView('menu');
  });

  // ------------------------------------------------------------------
  // Segmented Option Rows (Menu & Lounge)
  // ------------------------------------------------------------------
  function wireSegmentedRow(container, onSelect) {
    if (!container) return;
    container.querySelectorAll('.seg-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        onSelect(btn);
      });
    });
  }

  wireSegmentedRow(el.botDiffRow, btn => { selectedBotDiff = btn.dataset.diff; });
  wireSegmentedRow(el.botColorRow, btn => { selectedBotSide = btn.dataset.side; });
  wireSegmentedRow(el.localTimeRow, btn => { selectedLocalSec = Number(btn.dataset.sec); });
  wireSegmentedRow(el.onlineTimeRow, btn => { selectedOnlineSec = Number(btn.dataset.sec); });

  el.btnOpenLounge.addEventListener('click', () => {
    showView('lounge');
    if (!currentUser) {
      el.loungeSignIn.hidden = false;
      el.loungeActive.hidden = true;
    } else {
      el.loungeSignIn.hidden = true;
      el.loungeActive.hidden = false;
    }
  });

  el.btnStartBot.addEventListener('click', () => startBotGame());
  el.btnStartLocal.addEventListener('click', () => startLocalGame());

  // ------------------------------------------------------------------
  // Google Auth & Roster Lookup
  // ------------------------------------------------------------------
  function initAuth() {
    if (!auth) return;

    el.btnGoogleSignIn.addEventListener('click', async () => {
      el.authError.hidden = true;
      try {
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.setCustomParameters({ hd: 'orangeusd.org', prompt: 'select_account' });
        await auth.signInWithPopup(provider);
      } catch (err) {
        el.authError.textContent = err.message || 'Sign-in failed. Please use your @orangeusd.org account.';
        el.authError.hidden = false;
      }
    });

    el.btnSignOut.addEventListener('click', async () => {
      await setMyOfflineStatus();
      stopLoungeListeners();
      await auth.signOut();
      showView('menu');
    });

    auth.onAuthStateChanged(async user => {
      currentUser = user;
      if (!user) {
        myProfile = null;
        el.menuAuthStatus.textContent = 'Sign in with @orangeusd.org to pair with classmates.';
        el.loungeSignIn.hidden = false;
        el.loungeActive.hidden = true;
        stopLoungeListeners();
        return;
      }

      const email = (user.email || '').toLowerCase();
      const isTeacher = TEACHER_EMAILS.includes(email);
      const isOrangeUsd = email.endsWith('@orangeusd.org');

      if (!isOrangeUsd && !isTeacher) {
        el.authError.textContent = 'Please sign in with your @orangeusd.org school Google account.';
        el.authError.hidden = false;
        await auth.signOut();
        return;
      }

      const studentId = email.split('@')[0];
      let firstName = '';
      let lastName = '';
      let period = isTeacher ? 'T' : '';

      try {
        const rosterSnap = await db.collection('roster').doc(studentId).get();
        if (rosterSnap.exists) {
          const r = rosterSnap.data();
          firstName = r.first_name || r.firstName || '';
          lastName = r.last_name || r.lastName || '';
          const rawPeriod = r.class_period !== undefined ? r.class_period : r.period;
          if (rawPeriod !== undefined && rawPeriod !== null && rawPeriod !== '') {
            period = rawPeriod;
          }
        }
      } catch (e) {
        console.warn('[Classroom Chess] Roster lookup fallback:', e);
      }

      const displayName = firstName
        ? `${firstName} ${lastName ? lastName.charAt(0) + '.' : ''}`.trim()
        : (user.displayName || studentId);

      // Load existing player record so we keep W/L/D stats
      let wins = 0, losses = 0, draws = 0, existingStatus = 'idle', existingMatchId = null;
      try {
        const pSnap = await db.collection('chess_players').doc(user.uid).get();
        if (pSnap.exists) {
          const pd = pSnap.data();
          wins = Number(pd.wins || 0);
          losses = Number(pd.losses || 0);
          draws = Number(pd.draws || 0);
          if (pd.status === 'playing' && pd.matchId) {
            existingStatus = 'playing';
            existingMatchId = pd.matchId;
          }
        }
      } catch (e) {}

      myProfile = {
        uid: user.uid,
        studentId,
        name: displayName,
        email,
        period: period !== '' ? period : 1,
        isTeacher,
        wins,
        losses,
        draws
      };

      // Update menu & lounge headers
      const periodLabel = myProfile.period === 'T' ? 'Teacher' : `Period ${myProfile.period}`;
      el.menuAuthStatus.textContent = `Signed in as ${myProfile.name} (${periodLabel})`;
      el.meName.textContent = myProfile.name;
      el.mePeriodBadge.textContent = periodLabel;
      el.meRecord.textContent = `${wins}W · ${losses}L · ${draws}D`;
      el.teacherPanel.hidden = !isTeacher;

      // Default period filter to student's own period if they are a student
      if (!isTeacher && myProfile.period !== 'T') {
        el.loungePeriodFilter.value = String(myProfile.period);
      }

      el.loungeSignIn.hidden = true;
      el.loungeActive.hidden = false;

      // Register presence in chess_players/{uid}
      await upsertMyPresence({
        status: existingStatus,
        matchId: existingMatchId,
        challengeFrom: null
      });

      startLoungeListeners();

      // Automatically enter lounge if URL has ?mock=1
      if (new URLSearchParams(location.search).has('mock') && currentView === 'menu') {
        showView('lounge');
      }
    });
  }

  async function upsertMyPresence(extra = {}) {
    if (!db || !myProfile) return;
    const ref = db.collection('chess_players').doc(myProfile.uid);
    const payload = sanitize({
      uid: myProfile.uid,
      studentId: myProfile.studentId,
      name: myProfile.name,
      period: myProfile.period,
      isTeacher: !!myProfile.isTeacher,
      wins: myProfile.wins || 0,
      losses: myProfile.losses || 0,
      draws: myProfile.draws || 0,
      lastSeen: Date.now(),
      ...extra
    });
    try {
      await ref.set(payload, { merge: true });
    } catch (e) {
      console.warn('[Classroom Chess] Presence update error:', e);
    }
  }

  async function setMyOfflineStatus() {
    if (!db || !myProfile) return;
    try {
      await db.collection('chess_players').doc(myProfile.uid).update({
        status: 'offline',
        challengeFrom: null,
        lastSeen: 0
      });
    } catch (e) {}
  }

  window.addEventListener('beforeunload', () => {
    if (db && myProfile && myPlayerDoc && myPlayerDoc.status === 'seeking') {
      db.collection('chess_players').doc(myProfile.uid).update({
        status: 'idle'
      }).catch(() => {});
    }
  });

  // ------------------------------------------------------------------
  // Lounge Real-Time Listeners & Matchmaking
  // ------------------------------------------------------------------
  function startLoungeListeners() {
    stopLoungeListeners();
    if (!db || !myProfile) return;

    // 1. Watch all chess_players
    unsubPlayers = db.collection('chess_players').onSnapshot(snap => {
      const now = Date.now();
      const all = [];
      snap.docs.forEach(d => {
        const data = d.data();
        if (!data || !data.uid) return;
        all.push(data);
        if (data.uid === myProfile.uid) {
          myPlayerDoc = data;
          myProfile.wins = Number(data.wins || 0);
          myProfile.losses = Number(data.losses || 0);
          myProfile.draws = Number(data.draws || 0);
          el.meRecord.textContent = `${myProfile.wins}W · ${myProfile.losses}L · ${myProfile.draws}D`;
        }
      });

      onlinePlayers = all.filter(p => (now - (p.lastSeen || 0)) < ONLINE_TTL_MS && p.status !== 'offline');
      renderLoungePlayers();
      renderLeaderboard(all);
      syncMyLoungeState();
    });

    // 2. Watch live chess_matches
    unsubMatches = db.collection('chess_matches').where('status', '==', 'live').onSnapshot(snap => {
      liveMatches = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      renderLiveMatches();
      checkAutoJoinMatch();
    });

    // 3. Heartbeat every 20s
    heartbeatTimer = setInterval(() => {
      if (myProfile) {
        db.collection('chess_players').doc(myProfile.uid).update({
          lastSeen: Date.now()
        }).catch(() => {});
      }
    }, HEARTBEAT_MS);
  }

  function stopLoungeListeners() {
    if (unsubPlayers) { unsubPlayers(); unsubPlayers = null; }
    if (unsubMatches) { unsubMatches(); unsubMatches = null; }
    if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null; }
  }

  el.loungePeriodFilter.addEventListener('change', () => {
    renderLoungePlayers();
    renderLiveMatches();
  });

  function syncMyLoungeState() {
    if (!myPlayerDoc) return;

    // Seek queue UI
    const isSeeking = myPlayerDoc.status === 'seeking';
    el.btnQuickMatch.hidden = isSeeking;
    el.btnCancelSeek.hidden = !isSeeking;
    el.seekStatusText.hidden = !isSeeking;

    // Incoming Direct Challenge Banner
    const chal = myPlayerDoc.challengeFrom;
    if (chal && chal.uid && (Date.now() - (chal.at || 0) < 90000)) {
      const tcLabel = chal.timeControlSec ? `${Math.round(chal.timeControlSec / 60)} min` : 'Casual';
      el.challengeText.textContent = `⚔️ ${chal.name} (Period ${chal.period}) challenged you to a ${tcLabel} game!`;
      el.incomingChallengeBanner.hidden = false;
      if (chal.at > lastChallengeAlertAt) {
        lastChallengeAlertAt = chal.at;
        ChessAudio.notify();
      }
    } else {
      el.incomingChallengeBanner.hidden = true;
    }

    checkAutoJoinMatch();
  }

  function checkAutoJoinMatch() {
    if (!myPlayerDoc || !myPlayerDoc.matchId) return;
    if (myPlayerDoc.matchId === dismissedMatchId) return;
    if (gameMode === 'online' && activeMatchId === myPlayerDoc.matchId && currentView === 'game') return;

    const live = liveMatches.find(m => m.id === myPlayerDoc.matchId);
    if (live) {
      openOnlineMatch(live.id, false);
    }
  }

  function renderLoungePlayers() {
    if (!el.loungePlayerList) return;
    const filterVal = el.loungePeriodFilter.value;
    const filtered = onlinePlayers.filter(p => {
      if (filterVal === 'all') return true;
      return String(p.period) === String(filterVal);
    });

    // Sort: seeking first, then idle, then playing, then alphabetical
    const rank = { seeking: 0, idle: 1, playing: 2 };
    filtered.sort((a, b) => {
      const ra = rank[a.status] ?? 3;
      const rb = rank[b.status] ?? 3;
      if (ra !== rb) return ra - rb;
      return String(a.name).localeCompare(String(b.name));
    });

    el.onlineCount.textContent = String(filtered.length);

    if (!filtered.length) {
      el.loungePlayerList.innerHTML = `
        <li class="player-row" style="justify-content: center; color: var(--text-muted); padding: 1.2rem;">
          No players online in this period filter yet. Switch filter to "All Periods" or invite a classmate!
        </li>`;
      return;
    }

    el.loungePlayerList.innerHTML = filtered.map(p => {
      const isMe = myProfile && p.uid === myProfile.uid;
      const dotClass = p.status === 'seeking' ? 'seeking' : p.status === 'playing' ? 'playing' : 'idle';
      const statusText = p.status === 'seeking'
        ? '🟢 Looking for Opponent'
        : p.status === 'playing'
        ? '⚔️ In a Match'
        : '🟡 In Lounge';
      const pBadge = p.period === 'T' ? 'Teacher' : `P${p.period}`;
      const record = `${p.wins || 0}W-${p.losses || 0}L-${p.draws || 0}D`;

      let actionHtml = '';
      if (isMe) {
        actionHtml = `<span style="font-size: 0.8rem; font-weight: 700; color: var(--accent-cyan);">You</span>`;
      } else if (p.status === 'playing' && p.matchId) {
        actionHtml = `<button class="btn" data-watch-match="${esc(p.matchId)}" style="padding: 0.3rem 0.65rem; font-size: 0.78rem;">👀 Watch</button>`;
      } else {
        const btnLabel = p.status === 'seeking' ? '⚡ Join Match' : '⚔️ Challenge';
        const btnClass = p.status === 'seeking' ? 'btn emerald' : 'btn';
        actionHtml = `<button class="${btnClass}" data-challenge-uid="${esc(p.uid)}" style="padding: 0.32rem 0.7rem; font-size: 0.8rem;">${btnLabel}</button>`;
      }

      return `
        <li class="player-row">
          <div class="player-meta">
            <span class="status-dot ${dotClass}"></span>
            <div>
              <div style="font-weight: 700;">
                ${esc(p.name)}
                <span class="period-badge" style="margin-left: 0.3rem;">${esc(pBadge)}</span>
              </div>
              <div style="font-size: 0.78rem; color: var(--text-muted);">
                ${statusText} · ${record}
              </div>
            </div>
          </div>
          <div>${actionHtml}</div>
        </li>`;
    }).join('');

    el.loungePlayerList.querySelectorAll('[data-challenge-uid]').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetUid = btn.getAttribute('data-challenge-uid');
        const target = onlinePlayers.find(x => x.uid === targetUid);
        if (!target) return;
        if (target.status === 'seeking') {
          pairWithSpecificSeekingPlayer(target);
        } else {
          sendDirectChallenge(target);
        }
      });
    });

    el.loungePlayerList.querySelectorAll('[data-watch-match]').forEach(btn => {
      btn.addEventListener('click', () => {
        const mId = btn.getAttribute('data-watch-match');
        if (mId) openOnlineMatch(mId, true);
      });
    });
  }

  function renderLiveMatches() {
    if (!el.liveMatchesList) return;
    const filterVal = el.loungePeriodFilter.value;
    const filtered = liveMatches.filter(m => {
      if (filterVal === 'all') return true;
      return String(m.white?.period) === String(filterVal) || String(m.black?.period) === String(filterVal);
    });

    el.liveGamesCount.textContent = String(filtered.length);

    if (!filtered.length) {
      el.liveMatchesList.innerHTML = `
        <div style="color: var(--text-muted); font-size: 0.85rem; padding: 0.6rem 0;">
          No active games right now. Click <strong>Find Opponent</strong> to start one!
        </div>`;
      return;
    }

    el.liveMatchesList.innerHTML = filtered.map(m => {
      const isMine = myProfile && (m.white?.uid === myProfile.uid || m.black?.uid === myProfile.uid);
      const moveNum = Math.floor((m.seq || 0) / 2) + 1;
      const btnText = isMine ? '▶️ Resume' : '👀 Watch';
      const btnClass = isMine ? 'btn primary' : 'btn';
      return `
        <div class="player-row">
          <div style="font-size: 0.86rem;">
            <div><strong>⬜ ${esc(m.white?.name || 'White')}</strong> vs <strong>⬛ ${esc(m.black?.name || 'Black')}</strong></div>
            <div style="font-size: 0.76rem; color: var(--text-muted);">Move ${moveNum} · ${m.turn === 'w' ? 'White' : 'Black'}'s turn</div>
          </div>
          <button class="${btnClass}" data-open-match="${esc(m.id)}" style="padding: 0.3rem 0.65rem; font-size: 0.78rem;">${btnText}</button>
        </div>`;
    }).join('');

    el.liveMatchesList.querySelectorAll('[data-open-match]').forEach(btn => {
      btn.addEventListener('click', () => {
        const mId = btn.getAttribute('data-open-match');
        const m = liveMatches.find(x => x.id === mId);
        if (!m) return;
        const isParticipant = myProfile && (m.white?.uid === myProfile.uid || m.black?.uid === myProfile.uid);
        dismissedMatchId = null;
        openOnlineMatch(mId, !isParticipant);
      });
    });
  }

  function renderLeaderboard(allPlayers) {
    if (!el.loungeLeaderboard) return;
    const active = allPlayers
      .filter(p => (p.wins || 0) + (p.losses || 0) + (p.draws || 0) > 0)
      .sort((a, b) => {
        const scoreA = (a.wins || 0) * 3 + (a.draws || 0);
        const scoreB = (b.wins || 0) * 3 + (b.draws || 0);
        if (scoreB !== scoreA) return scoreB - scoreA;
        return (b.wins || 0) - (a.wins || 0);
      })
      .slice(0, 6);

    if (!active.length) {
      el.loungeLeaderboard.innerHTML = `<div style="color: var(--text-muted);">Finish a classroom match to appear on the standings!</div>`;
      return;
    }

    el.loungeLeaderboard.innerHTML = active.map((p, idx) => {
      const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`;
      const pBadge = p.period === 'T' ? 'Teacher' : `P${p.period}`;
      return `
        <div style="display: flex; justify-content: space-between; padding: 0.3rem 0; border-bottom: 1px solid var(--border-color);">
          <span><strong>${medal} ${esc(p.name)}</strong> <span style="color: var(--text-dim); font-size: 0.78rem;">(${esc(pBadge)})</span></span>
          <span style="font-family: var(--font-mono); font-weight: 700;">${p.wins || 0}W · ${p.draws || 0}D · ${p.losses || 0}L</span>
        </div>`;
    }).join('');
  }

  // ------------------------------------------------------------------
  // Match Creation Helper
  // ------------------------------------------------------------------
  function buildNewMatchObject(p1, p2, sec) {
    const now = Date.now();
    const swap = Math.random() < 0.5;
    const wPlayer = swap ? p2 : p1;
    const bPlayer = swap ? p1 : p2;
    const timeSec = Number(sec ?? 300);
    const initialMs = timeSec > 0 ? timeSec * 1000 : 0;

    return sanitize({
      uids: [wPlayer.uid, bPlayer.uid],
      white: {
        uid: wPlayer.uid,
        studentId: wPlayer.studentId || '',
        name: wPlayer.name,
        period: wPlayer.period
      },
      black: {
        uid: bPlayer.uid,
        studentId: bPlayer.studentId || '',
        name: bPlayer.name,
        period: bPlayer.period
      },
      status: 'live',
      turn: 'w',
      seq: 0,
      moves: [],
      timeControlSec: timeSec,
      timeLeftMs: { w: initialMs, b: initialMs },
      turnStartedAt: now,
      createdAt: now,
      updatedAt: now,
      drawOfferBy: null,
      rematchId: null,
      winner: null,
      outcome: null,
      reason: null,
      statsRecorded: false
    });
  }

  // 1. Quick Match (Auto-Pair Queue)
  el.btnQuickMatch.addEventListener('click', async () => {
    if (!db || !myProfile) return;
    dismissedMatchId = null;

    // Look for an already-seeking classmate
    const now = Date.now();
    const candidates = onlinePlayers
      .filter(p => p.uid !== myProfile.uid && p.status === 'seeking' && (now - (p.lastSeen || 0)) < ONLINE_TTL_MS)
      .sort((a, b) => {
        const samePerA = String(a.period) === String(myProfile.period) ? 0 : 1;
        const samePerB = String(b.period) === String(myProfile.period) ? 0 : 1;
        if (samePerA !== samePerB) return samePerA - samePerB;
        const repeatA = myPlayerDoc?.lastOpponentUid === a.uid ? 1 : 0;
        const repeatB = myPlayerDoc?.lastOpponentUid === b.uid ? 1 : 0;
        if (repeatA !== repeatB) return repeatA - repeatB;
        return (a.seekStartedAt || 0) - (b.seekStartedAt || 0);
      });

    if (candidates.length > 0) {
      const paired = await pairWithSpecificSeekingPlayer(candidates[0]);
      if (paired) return;
    }

    // Nobody waiting yet -> enter 'seeking' state
    await db.collection('chess_players').doc(myProfile.uid).update({
      status: 'seeking',
      timeControlSec: selectedOnlineSec,
      seekStartedAt: Date.now(),
      lastSeen: Date.now()
    });
    showToast('📡 Searching for an opponent… Anyone clicking Quick Match will pair with you!');
  });

  el.btnCancelSeek.addEventListener('click', async () => {
    if (!db || !myProfile) return;
    await db.collection('chess_players').doc(myProfile.uid).update({
      status: 'idle',
      lastSeen: Date.now()
    });
  });

  async function pairWithSpecificSeekingPlayer(opp) {
    if (!db || !myProfile) return false;
    const meRef = db.collection('chess_players').doc(myProfile.uid);
    const oppRef = db.collection('chess_players').doc(opp.uid);
    const matchRef = db.collection('chess_matches').doc();

    try {
      const matchId = await db.runTransaction(async tx => {
        const [meSnap, oppSnap] = await Promise.all([tx.get(meRef), tx.get(oppRef)]);
        if (!oppSnap.exists) return null;
        const oppData = oppSnap.data();
        if (oppData.status !== 'seeking' && oppData.status !== 'idle') return null;

        const sec = oppData.timeControlSec !== undefined ? oppData.timeControlSec : selectedOnlineSec;
        const matchObj = buildNewMatchObject(myProfile, oppData, sec);
        const now = Date.now();

        tx.set(matchRef, matchObj);
        tx.update(meRef, {
          status: 'playing',
          matchId: matchRef.id,
          challengeFrom: null,
          lastOpponentUid: oppData.uid,
          lastSeen: now
        });
        tx.update(oppRef, {
          status: 'playing',
          matchId: matchRef.id,
          challengeFrom: null,
          lastOpponentUid: myProfile.uid,
          lastSeen: now
        });
        return matchRef.id;
      });

      if (matchId) {
        dismissedMatchId = null;
        openOnlineMatch(matchId, false);
        return true;
      }
    } catch (e) {
      console.warn('[Classroom Chess] Quick Match transaction retry:', e);
    }
    return false;
  }

  // 2. Direct Classmate Challenge
  async function sendDirectChallenge(target) {
    if (!db || !myProfile) return;
    try {
      await db.collection('chess_players').doc(target.uid).update({
        challengeFrom: sanitize({
          uid: myProfile.uid,
          name: myProfile.name,
          period: myProfile.period,
          timeControlSec: selectedOnlineSec,
          at: Date.now()
        })
      });
      showToast(`⚔️ Challenge sent to ${target.name}!`);
    } catch (e) {
      showToast('Could not send challenge. Please try again.');
    }
  }

  el.btnAcceptChallenge.addEventListener('click', async () => {
    if (!db || !myProfile || !myPlayerDoc?.challengeFrom) return;
    const chal = myPlayerDoc.challengeFrom;
    const meRef = db.collection('chess_players').doc(myProfile.uid);
    const oppRef = db.collection('chess_players').doc(chal.uid);
    const matchRef = db.collection('chess_matches').doc();

    try {
      const createdId = await db.runTransaction(async tx => {
        const [meSnap, oppSnap] = await Promise.all([tx.get(meRef), tx.get(oppRef)]);
        if (!oppSnap.exists) return null;
        const oppData = oppSnap.data();
        if (oppData.status === 'playing') return null;

        const matchObj = buildNewMatchObject(myProfile, oppData, chal.timeControlSec ?? 300);
        const now = Date.now();
        tx.set(matchRef, matchObj);
        tx.update(meRef, {
          status: 'playing',
          matchId: matchRef.id,
          challengeFrom: null,
          lastOpponentUid: oppData.uid,
          lastSeen: now
        });
        tx.update(oppRef, {
          status: 'playing',
          matchId: matchRef.id,
          challengeFrom: null,
          lastOpponentUid: myProfile.uid,
          lastSeen: now
        });
        return matchRef.id;
      });

      if (createdId) {
        dismissedMatchId = null;
        openOnlineMatch(createdId, false);
      } else {
        showToast('That classmate is already in another game.');
        await meRef.update({ challengeFrom: null });
      }
    } catch (e) {
      showToast('Could not start match.');
    }
  });

  el.btnDeclineChallenge.addEventListener('click', async () => {
    if (!db || !myProfile) return;
    await db.collection('chess_players').doc(myProfile.uid).update({
      challengeFrom: null
    });
  });

  // 3. Teacher Batch-Pair All Available Students
  el.btnTeacherPairAll.addEventListener('click', async () => {
    if (!db || !myProfile?.isTeacher) return;
    const filterVal = el.loungePeriodFilter.value;
    const pool = onlinePlayers.filter(p => {
      if (p.uid === myProfile.uid) return false;
      if (p.status !== 'seeking' && p.status !== 'idle') return false;
      if (filterVal !== 'all' && String(p.period) !== String(filterVal)) return false;
      return true;
    });

    if (pool.length < 2) {
      showToast('Need at least 2 available students in this view to batch-pair.');
      return;
    }

    // Shuffle pool & avoid repeat opponents
    const shuffled = pool.slice().sort(() => Math.random() - 0.5);
    const used = new Set();
    const pairs = [];

    for (let i = 0; i < shuffled.length; i++) {
      const a = shuffled[i];
      if (used.has(a.uid)) continue;
      let partnerIdx = -1;
      for (let j = i + 1; j < shuffled.length; j++) {
        const b = shuffled[j];
        if (used.has(b.uid)) continue;
        if (a.lastOpponentUid !== b.uid) { partnerIdx = j; break; }
        if (partnerIdx === -1) partnerIdx = j;
      }
      if (partnerIdx !== -1) {
        const b = shuffled[partnerIdx];
        used.add(a.uid);
        used.add(b.uid);
        pairs.push([a, b]);
      }
    }

    const batch = db.batch();
    const now = Date.now();
    pairs.forEach(([a, b]) => {
      const mRef = db.collection('chess_matches').doc();
      const mObj = buildNewMatchObject(a, b, selectedOnlineSec);
      batch.set(mRef, mObj);
      batch.update(db.collection('chess_players').doc(a.uid), {
        status: 'playing',
        matchId: mRef.id,
        challengeFrom: null,
        lastOpponentUid: b.uid,
        lastSeen: now
      });
      batch.update(db.collection('chess_players').doc(b.uid), {
        status: 'playing',
        matchId: mRef.id,
        challengeFrom: null,
        lastOpponentUid: a.uid,
        lastSeen: now
      });
    });

    await batch.commit();
    showToast(`🎲 Paired ${pairs.length * 2} students into ${pairs.length} live matches!`);
  });

  // ------------------------------------------------------------------
  // Starting Local / Bot / Online Games
  // ------------------------------------------------------------------
  function startBotGame() {
    cleanupActiveMatchListener();
    gameMode = 'bot';
    chessState = ChessEngine.createGame();
    myColor = selectedBotSide === 'random' ? (Math.random() < 0.5 ? 'w' : 'b') : selectedBotSide;
    boardFlipped = myColor === 'b';
    selectedSq = null;
    legalTargets = [];
    hintMove = null;
    botThinking = false;
    gameEnded = false;
    gameEndBannerText = '';

    timeControlSec = 0; // Casual untimed vs Bot
    timeLeftMs = { w: 0, b: 0 };
    stopLocalClock();

    const diffNames = { easy: 'Rookie', medium: 'Club', hard: 'Tactician', master: 'Master' };
    const botLabel = `🤖 Chessbot (${diffNames[selectedBotDiff] || 'Club'})`;
    const humanLabel = myProfile ? myProfile.name : 'You';

    if (myColor === 'w') {
      bottomPlayerMeta = { name: humanLabel, color: 'w' };
      topPlayerMeta = { name: botLabel, color: 'b' };
    } else {
      bottomPlayerMeta = { name: humanLabel, color: 'b' };
      topPlayerMeta = { name: botLabel, color: 'w' };
    }

    el.navModeBadge.textContent = `vs. ${botLabel}`;
    el.btnOfferDraw.hidden = true;
    el.btnHint.hidden = false;
    el.btnResign.hidden = false;
    el.drawOfferBanner.hidden = true;
    el.postGameActions.hidden = true;

    showView('game');
    renderFullArena();
    ChessAudio.notify();

    if (chessState.turn !== myColor) {
      triggerBotTurn();
    }
  }

  function startLocalGame() {
    cleanupActiveMatchListener();
    gameMode = 'local';
    chessState = ChessEngine.createGame();
    myColor = 'w';
    boardFlipped = false;
    selectedSq = null;
    legalTargets = [];
    hintMove = null;
    botThinking = false;
    gameEnded = false;
    gameEndBannerText = '';

    timeControlSec = selectedLocalSec;
    const initMs = timeControlSec > 0 ? timeControlSec * 1000 : 0;
    timeLeftMs = { w: initMs, b: initMs };
    turnStartedAt = Date.now();

    bottomPlayerMeta = { name: 'White Player', color: 'w' };
    topPlayerMeta = { name: 'Black Player', color: 'b' };

    el.navModeBadge.textContent = '2-Player Pass & Play';
    el.btnOfferDraw.hidden = false;
    el.btnHint.hidden = false;
    el.btnResign.hidden = false;
    el.drawOfferBanner.hidden = true;
    el.postGameActions.hidden = true;

    showView('game');
    renderFullArena();
    startClockLoop();
    ChessAudio.notify();
  }

  function openOnlineMatch(matchId, spectateOnly = false) {
    cleanupActiveMatchListener();
    activeMatchId = matchId;
    activeMatchDoc = null;
    gameMode = spectateOnly ? 'spectate' : 'online';
    selectedSq = null;
    legalTargets = [];
    hintMove = null;
    gameEnded = false;
    gameEndBannerText = '';

    el.btnHint.hidden = true; // Fair play in live classmate matches
    el.btnOfferDraw.hidden = spectateOnly;
    el.btnResign.hidden = spectateOnly;
    el.postGameActions.hidden = true;

    showView('game');

    unsubActiveMatch = db.collection('chess_matches').doc(matchId).onSnapshot(snap => {
      if (!snap.exists) return;
      const data = snap.data();
      const prevSeq = activeMatchDoc ? activeMatchDoc.seq : -1;
      activeMatchDoc = data;

      // Follow automatic rematch link if opponent started a rematch
      if (data.status === 'done' && data.rematchId && data.rematchId !== activeMatchId) {
        const nextId = data.rematchId;
        dismissedMatchId = null;
        openOnlineMatch(nextId, spectateOnly);
        return;
      }

      // Determine player orientation
      if (myProfile && data.black?.uid === myProfile.uid) {
        myColor = 'b';
      } else {
        myColor = 'w';
      }
      if (prevSeq === -1) {
        boardFlipped = myColor === 'b';
      }

      // Reconstruct ChessEngine state from flat moves list
      let st = ChessEngine.createGame();
      const movesArr = Array.isArray(data.moves) ? data.moves : [];
      for (const m of movesArr) {
        const fromRc = ChessEngine.parseSq(m.from);
        const toRc = ChessEngine.parseSq(m.to);
        if (fromRc && toRc) {
          const next = ChessEngine.makeMove(st, fromRc, toRc, m.promo || 'q');
          if (next) st = next;
        }
      }
      chessState = st;

      // Play move sound when sequence advances
      if (prevSeq !== -1 && data.seq > prevSeq && st.history.length > 0) {
        const last = st.history[st.history.length - 1];
        playSoundForMove(st, last);
      } else if (prevSeq === -1) {
        ChessAudio.notify();
      }

      timeControlSec = Number(data.timeControlSec || 0);
      timeLeftMs = data.timeLeftMs || { w: 0, b: 0 };
      turnStartedAt = Number(data.turnStartedAt || Date.now());

      const wLabel = `${data.white?.name || 'White'} (${data.white?.period === 'T' ? 'T' : 'P' + (data.white?.period ?? '')})`;
      const bLabel = `${data.black?.name || 'Black'} (${data.black?.period === 'T' ? 'T' : 'P' + (data.black?.period ?? '')})`;

      if (boardFlipped) {
        bottomPlayerMeta = { name: bLabel, color: 'b' };
        topPlayerMeta = { name: wLabel, color: 'w' };
      } else {
        bottomPlayerMeta = { name: wLabel, color: 'w' };
        topPlayerMeta = { name: bLabel, color: 'b' };
      }

      el.navModeBadge.textContent = spectateOnly ? '👀 Spectating Live Match' : '⚔️ Live Classmate Match';

      // Incoming draw offer banner
      if (!spectateOnly && data.status === 'live' && data.drawOfferBy && data.drawOfferBy !== myColor) {
        el.drawOfferBanner.hidden = false;
      } else {
        el.drawOfferBanner.hidden = true;
      }

      if (data.status === 'done') {
        gameEnded = true;
        gameEndBannerText = data.reason || 'Game Over.';
        el.postGameActions.hidden = false;
        el.btnOfferDraw.hidden = true;
        el.btnResign.hidden = true;
        stopLocalClock();
      } else {
        gameEnded = false;
        el.postGameActions.hidden = true;
        el.btnOfferDraw.hidden = spectateOnly;
        el.btnResign.hidden = spectateOnly;
        startClockLoop();
      }

      renderFullArena();
    });
  }

  function cleanupActiveMatchListener() {
    if (unsubActiveMatch) {
      unsubActiveMatch();
      unsubActiveMatch = null;
    }
    stopLocalClock();
  }

  // ------------------------------------------------------------------
  // Rendering the 8x8 Board, Player Bars, Clocks, and Move Log
  // ------------------------------------------------------------------
  function renderFullArena() {
    if (!chessState) return;
    renderPlayerBars();
    renderBoard();
    renderStatusAndMoveLog();
    renderClocks();
  }

  function renderPlayerBars() {
    const topColor = boardFlipped ? 'w' : 'b';
    const bottomColor = boardFlipped ? 'b' : 'w';

    const wName = gameMode === 'online' || gameMode === 'spectate'
      ? `${activeMatchDoc?.white?.name || 'White'}`
      : (myColor === 'w' ? bottomPlayerMeta.name : topPlayerMeta.name);
    const bName = gameMode === 'online' || gameMode === 'spectate'
      ? `${activeMatchDoc?.black?.name || 'Black'}`
      : (myColor === 'b' ? bottomPlayerMeta.name : topPlayerMeta.name);

    el.discTop.className = `color-disc ${topColor}`;
    el.discBottom.className = `color-disc ${bottomColor}`;
    el.nameTop.textContent = topColor === 'w' ? wName : bName;
    el.nameBottom.textContent = bottomColor === 'w' ? wName : bName;

    el.barTop.classList.toggle('active-turn', !gameEnded && chessState.turn === topColor);
    el.barBottom.classList.toggle('active-turn', !gameEnded && chessState.turn === bottomColor);

    // Captured piece trays & material advantage
    const mat = ChessEngine.materialBalance(chessState.board);
    el.trayTop.innerHTML = formatCapturedTray(topColor, mat.diff);
    el.trayBottom.innerHTML = formatCapturedTray(bottomColor, mat.diff);
  }

  function formatCapturedTray(sideColor, diff) {
    const capturedList = (chessState.captured[sideColor] || []).slice().sort((a, b) => {
      return (ChessEngine.MATERIAL_PTS[b[1]] || 0) - (ChessEngine.MATERIAL_PTS[a[1]] || 0);
    });
    const glyphs = { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛' };
    const icons = capturedList.map(code => glyphs[code[1]] || '').join('');
    const adv = sideColor === 'w' ? diff : -diff;
    const advHtml = adv > 0 ? `<span class="mat-badge">+${adv}</span>` : '';
    return `<span>${icons}</span>${advHtml}`;
  }

  function renderBoard() {
    if (!chessState || !el.boardGrid) return;
    const lastMv = chessState.history.length ? chessState.history[chessState.history.length - 1] : null;
    const inChk = ChessEngine.inCheck(chessState.board, chessState.turn);

    let html = '';
    for (let vRow = 0; vRow < 8; vRow++) {
      for (let vCol = 0; vCol < 8; vCol++) {
        const r = boardFlipped ? 7 - vRow : vRow;
        const c = boardFlipped ? 7 - vCol : vCol;
        const isLight = (r + c) % 2 === 0;
        const piece = chessState.board[r][c];

        const classes = ['sq', isLight ? 'light' : 'dark'];
        if (selectedSq && selectedSq[0] === r && selectedSq[1] === c) classes.push('selected');
        if (lastMv && ((lastMv.from[0] === r && lastMv.from[1] === c) || (lastMv.to[0] === r && lastMv.to[1] === c))) {
          classes.push('last-move');
        }
        if (hintMove && ((hintMove.from[0] === r && hintMove.from[1] === c) || (hintMove.to[0] === r && hintMove.to[1] === c))) {
          classes.push('hint-sq');
        }
        if (inChk && piece === chessState.turn + 'k') {
          classes.push('in-check');
        }

        const isTarget = legalTargets.some(m => m.to[0] === r && m.to[1] === c);
        if (isTarget) {
          classes.push(piece ? 'legal-capture' : 'legal-move');
        }

        const rankCoord = vCol === 0 ? `<span class="coord rank">${8 - r}</span>` : '';
        const fileCoord = vRow === 7 ? `<span class="coord file">${ChessEngine.FILES[c]}</span>` : '';
        const svg = piece ? ChessEngine.pieceSVG(piece) : '';

        html += `<div class="${classes.join(' ')}" data-r="${r}" data-c="${c}" role="gridcell" aria-label="${ChessEngine.sqName(r, c)}">${rankCoord}${fileCoord}${svg}</div>`;
      }
    }

    el.boardGrid.innerHTML = html;

    el.boardGrid.querySelectorAll('.sq').forEach(sqEl => {
      const r = Number(sqEl.getAttribute('data-r'));
      const c = Number(sqEl.getAttribute('data-c'));

      sqEl.addEventListener('click', () => handleSquareClick(r, c));

      // Drag and drop support
      const piece = chessState.board[r][c];
      if (piece && canControlTurn(piece[0])) {
        sqEl.setAttribute('draggable', 'true');
        sqEl.addEventListener('dragstart', () => {
          selectSquare(r, c);
        });
      }
      sqEl.addEventListener('dragover', e => e.preventDefault());
      sqEl.addEventListener('drop', e => {
        e.preventDefault();
        if (selectedSq && (selectedSq[0] !== r || selectedSq[1] !== c)) {
          handleSquareClick(r, c);
        }
      });
    });
  }

  function renderStatusAndMoveLog() {
    if (!chessState) return;

    const status = ChessEngine.evaluateStatus(chessState);
    el.gameStatusBanner.className = 'status-banner';

    if (gameEnded) {
      el.gameStatusBanner.classList.add('over');
      el.gameStatusBanner.textContent = gameEndBannerText || status.reason || 'Game Over';
    } else if (status.over) {
      gameEnded = true;
      gameEndBannerText = status.reason;
      el.gameStatusBanner.classList.add('over');
      el.gameStatusBanner.textContent = status.reason;
      el.postGameActions.hidden = false;
      stopLocalClock();
    } else {
      const sideLabel = chessState.turn === 'w' ? 'White' : 'Black';
      if (status.inCheck) {
        el.gameStatusBanner.classList.add('check');
        el.gameStatusBanner.textContent = `⚠️ ${sideLabel} is in Check! (${ sideLabel } to move)`;
      } else if (botThinking) {
        el.gameStatusBanner.textContent = '🤖 Chessbot is thinking…';
      } else {
        el.gameStatusBanner.textContent = `${sideLabel} to move`;
      }
    }

    // Move log table
    const hist = chessState.history;
    el.moveCounter.textContent = `Move ${chessState.fullMove}`;
    let rowsHtml = '';
    for (let i = 0; i < hist.length; i += 2) {
      const num = Math.floor(i / 2) + 1;
      const wSan = hist[i]?.san || '';
      const bSan = hist[i + 1]?.san || '';
      rowsHtml += `<tr><td class="num">${num}.</td><td>${esc(wSan)}</td><td>${esc(bSan)}</td></tr>`;
    }
    el.moveTableBody.innerHTML = rowsHtml;
    el.moveLogWrap.scrollTop = el.moveLogWrap.scrollHeight;
  }

  // ------------------------------------------------------------------
  // Digital Chess Clocks
  // ------------------------------------------------------------------
  function startClockLoop() {
    stopLocalClock();
    renderClocks();
    if (timeControlSec <= 0) return;
    clockInterval = setInterval(() => {
      renderClocks();
    }, 250);
  }

  function stopLocalClock() {
    if (clockInterval) {
      clearInterval(clockInterval);
      clockInterval = null;
    }
  }

  function getLiveRemainingMs() {
    if (timeControlSec <= 0) return { w: 0, b: 0 };
    const elapsed = gameEnded ? 0 : Math.max(0, Date.now() - turnStartedAt);
    return {
      w: chessState.turn === 'w' ? Math.max(0, (timeLeftMs.w || 0) - elapsed) : Math.max(0, timeLeftMs.w || 0),
      b: chessState.turn === 'b' ? Math.max(0, (timeLeftMs.b || 0) - elapsed) : Math.max(0, timeLeftMs.b || 0)
    };
  }

  function formatClockMs(ms) {
    if (timeControlSec <= 0) return '∞';
    const totalSec = Math.ceil(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function renderClocks() {
    if (!chessState) return;
    const topColor = boardFlipped ? 'w' : 'b';
    const bottomColor = boardFlipped ? 'b' : 'w';
    const rem = getLiveRemainingMs();

    el.clockTop.textContent = formatClockMs(rem[topColor]);
    el.clockBottom.textContent = formatClockMs(rem[bottomColor]);

    el.clockTop.classList.toggle('low-time', timeControlSec > 0 && rem[topColor] > 0 && rem[topColor] < 30000);
    el.clockBottom.classList.toggle('low-time', timeControlSec > 0 && rem[bottomColor] > 0 && rem[bottomColor] < 30000);

    if (!gameEnded && timeControlSec > 0) {
      if (rem.w <= 0) handleFlagTimeout('w');
      else if (rem.b <= 0) handleFlagTimeout('b');
    }
  }

  function handleFlagTimeout(flaggedSide) {
    if (gameEnded) return;
    const winner = flaggedSide === 'w' ? 'b' : 'w';
    const reason = `⏰ Time out! ${winner === 'w' ? 'White' : 'Black'} wins on time.`;
    if (gameMode === 'online') {
      finishOnlineMatch(winner, 'timeout', reason);
    } else if (gameMode === 'local') {
      gameEnded = true;
      gameEndBannerText = reason;
      el.postGameActions.hidden = false;
      stopLocalClock();
      ChessAudio.gameOver(true);
      renderFullArena();
    }
  }

  // ------------------------------------------------------------------
  // Board Interaction & Move Execution
  // ------------------------------------------------------------------
  function canControlTurn(pieceColor) {
    if (gameEnded || !chessState) return false;
    if (pieceColor !== chessState.turn) return false;
    if (gameMode === 'spectate') return false;
    if (gameMode === 'bot') return chessState.turn === myColor && !botThinking;
    if (gameMode === 'online') return chessState.turn === myColor;
    return true; // 'local'
  }

  function updateBoardSelectionClasses() {
    if (!chessState || !el.boardGrid) return;
    el.boardGrid.querySelectorAll('.sq').forEach(sqEl => {
      const r = Number(sqEl.getAttribute('data-r'));
      const c = Number(sqEl.getAttribute('data-c'));
      const piece = chessState.board[r][c];
      const isSelected = Boolean(selectedSq && selectedSq[0] === r && selectedSq[1] === c);
      const isTarget = legalTargets.some(m => m.to[0] === r && m.to[1] === c);
      const isHint = Boolean(hintMove && ((hintMove.from[0] === r && hintMove.from[1] === c) || (hintMove.to[0] === r && hintMove.to[1] === c)));
      sqEl.classList.toggle('selected', isSelected);
      sqEl.classList.toggle('legal-move', isTarget && !piece);
      sqEl.classList.toggle('legal-capture', isTarget && Boolean(piece));
      sqEl.classList.toggle('hint-sq', isHint);
    });
  }

  function selectSquare(r, c) {
    const piece = chessState.board[r][c];
    if (!piece || !canControlTurn(piece[0])) return;
    selectedSq = [r, c];
    legalTargets = ChessEngine.legalMovesFrom(chessState, r, c);
    updateBoardSelectionClasses();
  }

  function handleSquareClick(r, c) {
    if (!chessState || gameEnded) return;

    // Check if clicking a legal destination square for the currently selected piece
    if (selectedSq) {
      const matching = legalTargets.filter(m => m.to[0] === r && m.to[1] === c);
      if (matching.length > 0) {
        // Is it a pawn promotion?
        if (matching.some(m => m.promo)) {
          openPromotionModal(selectedSq, [r, c], chessState.turn);
          return;
        }
        executePlayerMove(selectedSq, [r, c], 'q');
        return;
      }
    }

    // Otherwise, select own piece if clicked
    const clickedPiece = chessState.board[r][c];
    if (clickedPiece && canControlTurn(clickedPiece[0])) {
      selectSquare(r, c);
    } else {
      selectedSq = null;
      legalTargets = [];
      updateBoardSelectionClasses();
    }
  }

  function openPromotionModal(from, to, color) {
    pendingPromoMove = { from, to };
    const choices = [
      { code: 'q', name: 'Queen' },
      { code: 'r', name: 'Rook' },
      { code: 'b', name: 'Bishop' },
      { code: 'n', name: 'Knight' }
    ];
    el.promoChoices.innerHTML = choices.map(ch => `
      <button class="promo-btn" data-promo="${ch.code}">
        ${ChessEngine.pieceSVG(color + ch.code)}
        <span>${ch.name}</span>
      </button>
    `).join('');

    el.promoModal.hidden = false;
    el.promoChoices.querySelectorAll('.promo-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const promo = btn.getAttribute('data-promo') || 'q';
        el.promoModal.hidden = true;
        if (pendingPromoMove) {
          const { from: f, to: t } = pendingPromoMove;
          pendingPromoMove = null;
          executePlayerMove(f, t, promo);
        }
      });
    });
  }

  function playSoundForMove(stateAfter, lastMove) {
    const status = ChessEngine.evaluateStatus(stateAfter);
    if (status.over) {
      const won = status.winner === myColor || gameMode === 'local';
      ChessAudio.gameOver(won);
    } else if (status.inCheck) {
      ChessAudio.check();
    } else if (lastMove.castle) {
      ChessAudio.castle();
    } else if (lastMove.captured) {
      ChessAudio.capture();
    } else {
      ChessAudio.move();
    }
  }

  function executePlayerMove(from, to, promoChoice = 'q') {
    hintMove = null;
    selectedSq = null;
    legalTargets = [];

    if (gameMode === 'online') {
      commitOnlineMove(from, to, promoChoice);
      return;
    }

    // Deduct clock time for active side in local pass-and-play
    if (gameMode === 'local' && timeControlSec > 0) {
      const now = Date.now();
      const side = chessState.turn;
      timeLeftMs[side] = Math.max(0, (timeLeftMs[side] || 0) - (now - turnStartedAt));
      turnStartedAt = now;
    }

    const next = ChessEngine.makeMove(chessState, from, to, promoChoice);
    if (!next) return;
    chessState = next;
    const last = chessState.history[chessState.history.length - 1];
    playSoundForMove(chessState, last);
    renderFullArena();

    const status = ChessEngine.evaluateStatus(chessState);
    if (status.over) {
      gameEnded = true;
      gameEndBannerText = status.reason;
      el.postGameActions.hidden = false;
      stopLocalClock();
      renderFullArena();
      return;
    }

    if (gameMode === 'bot' && chessState.turn !== myColor) {
      triggerBotTurn();
    }
  }

  function triggerBotTurn() {
    botThinking = true;
    renderStatusAndMoveLog();
    setTimeout(() => {
      if (gameEnded || gameMode !== 'bot') return;
      const mv = ChessEngine.chooseBotMove(chessState, selectedBotDiff);
      botThinking = false;
      if (!mv) return;
      const next = ChessEngine.makeMove(chessState, mv.from, mv.to, mv.promo || 'q');
      if (!next) return;
      chessState = next;
      const last = chessState.history[chessState.history.length - 1];
      playSoundForMove(chessState, last);
      renderFullArena();
    }, 320);
  }

  // ------------------------------------------------------------------
  // Online Move & Match Resolution Transactions
  // ------------------------------------------------------------------
  async function commitOnlineMove(from, to, promoChoice = 'q') {
    if (!db || !activeMatchId || !activeMatchDoc) return;
    const matchRef = db.collection('chess_matches').doc(activeMatchId);
    const wUid = activeMatchDoc.white?.uid;
    const bUid = activeMatchDoc.black?.uid;
    const wRef = wUid ? db.collection('chess_players').doc(wUid) : null;
    const bRef = bUid ? db.collection('chess_players').doc(bUid) : null;

    try {
      await db.runTransaction(async tx => {
        const reads = [tx.get(matchRef)];
        if (wRef) reads.push(tx.get(wRef));
        if (bRef) reads.push(tx.get(bRef));
        const [mSnap, wSnap, bSnap] = await Promise.all(reads);

        if (!mSnap.exists) return;
        const mData = mSnap.data();
        if (mData.status !== 'live' || mData.turn !== myColor) return;

        // Replay existing moves to verify legal move
        let st = ChessEngine.createGame();
        const prevMoves = Array.isArray(mData.moves) ? mData.moves : [];
        for (const pm of prevMoves) {
          const f = ChessEngine.parseSq(pm.from);
          const t = ChessEngine.parseSq(pm.to);
          if (f && t) {
            const nxt = ChessEngine.makeMove(st, f, t, pm.promo || 'q');
            if (nxt) st = nxt;
          }
        }

        const nextSt = ChessEngine.makeMove(st, from, to, promoChoice);
        if (!nextSt) return;

        const lastHist = nextSt.history[nextSt.history.length - 1];
        const now = Date.now();
        const updatedTimeLeft = { ...(mData.timeLeftMs || { w: 0, b: 0 }) };
        if (Number(mData.timeControlSec || 0) > 0) {
          const elapsed = Math.max(0, now - Number(mData.turnStartedAt || now));
          updatedTimeLeft[myColor] = Math.max(0, (updatedTimeLeft[myColor] || 0) - elapsed);
        }

        const newMoves = prevMoves.concat([
          sanitize({
            from: ChessEngine.sqName(from[0], from[1]),
            to: ChessEngine.sqName(to[0], to[1]),
            promo: promoChoice && lastHist.promo ? promoChoice : null,
            san: lastHist.san,
            by: myColor,
            at: now
          })
        ]);

        const stInfo = ChessEngine.evaluateStatus(nextSt);
        const matchPatch = {
          moves: newMoves,
          seq: newMoves.length,
          turn: nextSt.turn,
          timeLeftMs: updatedTimeLeft,
          turnStartedAt: now,
          updatedAt: now,
          drawOfferBy: null
        };

        if (stInfo.over) {
          matchPatch.status = 'done';
          matchPatch.winner = stInfo.winner;
          matchPatch.outcome = stInfo.outcome;
          matchPatch.reason = stInfo.reason;
          matchPatch.endedAt = now;
          matchPatch.statsRecorded = true;

          if (!mData.statsRecorded) {
            applyPlayerRecordUpdates(tx, wRef, wSnap, bRef, bSnap, stInfo.winner);
          }
        }

        tx.update(matchRef, sanitize(matchPatch));
      });
    } catch (e) {
      console.warn('[Classroom Chess] Move transaction error:', e);
      showToast('Move sync interrupted — retrying.');
    }
  }

  function applyPlayerRecordUpdates(tx, wRef, wSnap, bRef, bSnap, winner) {
    const now = Date.now();
    if (wRef && wSnap && wSnap.exists) {
      const wd = wSnap.data();
      tx.update(wRef, {
        status: 'idle',
        wins: Number(wd.wins || 0) + (winner === 'w' ? 1 : 0),
        losses: Number(wd.losses || 0) + (winner === 'b' ? 1 : 0),
        draws: Number(wd.draws || 0) + (winner === 'draw' ? 1 : 0),
        lastSeen: now
      });
    }
    if (bRef && bSnap && bSnap.exists) {
      const bd = bSnap.data();
      tx.update(bRef, {
        status: 'idle',
        wins: Number(bd.wins || 0) + (winner === 'b' ? 1 : 0),
        losses: Number(bd.losses || 0) + (winner === 'w' ? 1 : 0),
        draws: Number(bd.draws || 0) + (winner === 'draw' ? 1 : 0),
        lastSeen: now
      });
    }
  }

  async function finishOnlineMatch(winner, outcome, reason) {
    if (!db || !activeMatchId || !activeMatchDoc) return;
    const matchRef = db.collection('chess_matches').doc(activeMatchId);
    const wUid = activeMatchDoc.white?.uid;
    const bUid = activeMatchDoc.black?.uid;
    const wRef = wUid ? db.collection('chess_players').doc(wUid) : null;
    const bRef = bUid ? db.collection('chess_players').doc(bUid) : null;

    try {
      await db.runTransaction(async tx => {
        const reads = [tx.get(matchRef)];
        if (wRef) reads.push(tx.get(wRef));
        if (bRef) reads.push(tx.get(bRef));
        const [mSnap, wSnap, bSnap] = await Promise.all(reads);

        if (!mSnap.exists) return;
        const mData = mSnap.data();
        if (mData.status !== 'live') return;

        tx.update(matchRef, {
          status: 'done',
          winner,
          outcome,
          reason,
          drawOfferBy: null,
          endedAt: Date.now(),
          statsRecorded: true
        });

        if (!mData.statsRecorded) {
          applyPlayerRecordUpdates(tx, wRef, wSnap, bRef, bSnap, winner);
        }
      });
    } catch (e) {
      console.warn('[Classroom Chess] Finish match error:', e);
    }
  }

  // ------------------------------------------------------------------
  // Action Bar Buttons: Flip, Hint, Offer Draw, Resign, Rematch
  // ------------------------------------------------------------------
  el.btnFlipBoard.addEventListener('click', () => {
    boardFlipped = !boardFlipped;
    renderFullArena();
  });

  el.btnHint.addEventListener('click', () => {
    if (!chessState || gameEnded || gameMode === 'online' || gameMode === 'spectate') return;
    const best = ChessEngine.chooseBotMove(chessState, 'hard');
    if (best) {
      hintMove = { from: best.from, to: best.to };
      renderBoard();
      showToast(`💡 Suggested move: ${ChessEngine.sqName(best.from[0], best.from[1])} → ${ChessEngine.sqName(best.to[0], best.to[1])}`);
    }
  });

  el.btnOfferDraw.addEventListener('click', async () => {
    if (gameEnded) return;
    if (gameMode === 'local') {
      gameEnded = true;
      gameEndBannerText = '🤝 Draw agreed by both players.';
      el.postGameActions.hidden = false;
      stopLocalClock();
      ChessAudio.gameOver(false);
      renderFullArena();
      return;
    }
    if (gameMode === 'online' && db && activeMatchId) {
      await db.collection('chess_matches').doc(activeMatchId).update({
        drawOfferBy: myColor
      });
      showToast('🤝 Draw offer sent to your opponent.');
    }
  });

  el.btnAcceptDraw.addEventListener('click', () => {
    if (gameMode === 'online') {
      finishOnlineMatch('draw', 'draw-agreed', '🤝 Draw by mutual agreement.');
    }
  });

  el.btnDeclineDraw.addEventListener('click', async () => {
    if (gameMode === 'online' && db && activeMatchId) {
      await db.collection('chess_matches').doc(activeMatchId).update({
        drawOfferBy: null
      });
    }
  });

  el.btnResign.addEventListener('click', () => {
    if (gameEnded || !chessState) return;
    if (gameMode === 'online') {
      const winner = myColor === 'w' ? 'b' : 'w';
      const mySideName = myColor === 'w' ? 'White' : 'Black';
      const winSideName = winner === 'w' ? 'White' : 'Black';
      finishOnlineMatch(winner, 'resign', `🏳️ ${mySideName} resigned. ${winSideName} wins!`);
    } else if (gameMode === 'bot') {
      gameEnded = true;
      gameEndBannerText = '🏳️ You resigned. Chessbot wins.';
      el.postGameActions.hidden = false;
      ChessAudio.gameOver(false);
      renderFullArena();
    } else if (gameMode === 'local') {
      const loser = chessState.turn === 'w' ? 'White' : 'Black';
      const winner = chessState.turn === 'w' ? 'Black' : 'White';
      gameEnded = true;
      gameEndBannerText = `🏳️ ${loser} resigned. ${winner} wins!`;
      el.postGameActions.hidden = false;
      stopLocalClock();
      ChessAudio.gameOver(true);
      renderFullArena();
    }
  });

  el.btnRematch.addEventListener('click', async () => {
    if (gameMode === 'bot') {
      startBotGame();
      return;
    }
    if (gameMode === 'local') {
      startLocalGame();
      return;
    }
    if (gameMode === 'online' && db && activeMatchId && activeMatchDoc) {
      // Create a swapped-colors rematch and link it via rematchId so both players enter automatically
      const prevMatchRef = db.collection('chess_matches').doc(activeMatchId);
      const newMatchRef = db.collection('chess_matches').doc();
      const wUid = activeMatchDoc.white?.uid;
      const bUid = activeMatchDoc.black?.uid;
      const wRef = db.collection('chess_players').doc(wUid);
      const bRef = db.collection('chess_players').doc(bUid);

      try {
        const nextId = await db.runTransaction(async tx => {
          const mSnap = await tx.get(prevMatchRef);
          if (!mSnap.exists) return null;
          const mData = mSnap.data();
          if (mData.rematchId) return mData.rematchId;

          const now = Date.now();
          const sec = Number(mData.timeControlSec || 300);
          const initMs = sec > 0 ? sec * 1000 : 0;
          // Swap colors from previous game
          const rematchObj = sanitize({
            uids: mData.uids,
            white: mData.black,
            black: mData.white,
            status: 'live',
            turn: 'w',
            seq: 0,
            moves: [],
            timeControlSec: sec,
            timeLeftMs: { w: initMs, b: initMs },
            turnStartedAt: now,
            createdAt: now,
            updatedAt: now,
            drawOfferBy: null,
            rematchId: null,
            winner: null,
            outcome: null,
            reason: null,
            statsRecorded: false
          });

          tx.set(newMatchRef, rematchObj);
          tx.update(prevMatchRef, { rematchId: newMatchRef.id });
          tx.update(wRef, { status: 'playing', matchId: newMatchRef.id, lastSeen: now });
          tx.update(bRef, { status: 'playing', matchId: newMatchRef.id, lastSeen: now });
          return newMatchRef.id;
        });

        if (nextId) {
          dismissedMatchId = null;
          openOnlineMatch(nextId, false);
        }
      } catch (e) {
        showToast('Could not start rematch.');
      }
    }
  });

  el.btnBackToLounge.addEventListener('click', async () => {
    if (gameMode === 'online' || gameMode === 'spectate') {
      dismissedMatchId = activeMatchId;
      cleanupActiveMatchListener();
      if (db && myProfile) {
        await db.collection('chess_players').doc(myProfile.uid).update({
          status: 'idle',
          matchId: null,
          lastSeen: Date.now()
        }).catch(() => {});
      }
      showView('lounge');
    } else {
      stopLocalClock();
      showView('menu');
    }
  });

  // ------------------------------------------------------------------
  // Boot
  // ------------------------------------------------------------------
  initThemeAndScale();
  initAuth();
})();
