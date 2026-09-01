/**
 * PRIDE Time Attendance & Behavior Tracker - Core Application Logic
 * Continuous Barcode/QR Scanning, Live Counter, Firestore Roster Sync & Realtime Bus
 */

(function () {
  'use strict';

  // ==========================================================================
  // 1. DATA MODELS & DEFAULT SEED DATA
  // ==========================================================================

  const STORAGE_KEY_STUDENTS = 'pride_tracker_students_v1';
  const STORAGE_KEY_ATTENDANCE = 'pride_tracker_attendance_v1';
  const STORAGE_KEY_BEHAVIOR = 'pride_tracker_behavior_v1';
  const STORAGE_KEY_SETTINGS = 'pride_tracker_settings_v1';

  const DEFAULT_SETTINGS = {
    roomCapacity: 35,
    soundEnabled: true,
    hapticsEnabled: true,
    autoStartCamera: true,
    cameraFacingMode: 'environment',
    selectedCameraId: null,
    schoolName: 'Orange High School',
    teacherName: 'Mr. Mudry',
    roomNumber: 'Room 930',
    syncRoomCode: 'PRIDE-930',
    prideDays: ['Tuesday', 'Wednesday', 'Thursday']
  };

  const SAMPLE_STUDENTS = [
    { id: "730001", name: "Sheldon Cooper", grade: 11, period: 1, status: "active", avatarColor: "#6366f1", restrictions: [], behaviorLogs: [], totalPrides: 4, totalInfractions: 0 },
    { id: "730002", name: "Leonard Hofstadter", grade: 11, period: 1, status: "active", avatarColor: "#8b5cf6", restrictions: [], behaviorLogs: [], totalPrides: 2, totalInfractions: 0 },
    { id: "730003", name: "Penny Hofstadter", grade: 11, period: 2, status: "active", avatarColor: "#ec4899", restrictions: [], behaviorLogs: [], totalPrides: 1, totalInfractions: 0 },
    { id: "730004", name: "Howard Wolowitz", grade: 12, period: 3, status: "restricted", avatarColor: "#ef4444", restrictions: [
      { id: "res-101", reason: "Disruptive behavior & gaming on laptop during physics tutorial", dateLogged: "2026-08-27", expiresDate: "2026-09-08", active: true, severity: "High", notes: "Must complete missing kinematics assignment in tutorial before PRIDE access is restored." }
    ], behaviorLogs: [
      { id: "beh-1", timestamp: "2026-08-27T10:15:00Z", type: "infraction", tag: "Disruptive / Gaming", note: "Refused to work on rocket lab, loud distraction to peers", severity: "High" }
    ], totalPrides: 0, totalInfractions: 2 },
    { id: "730005", name: "Raj Koothrappali", grade: 12, period: 3, status: "probation", avatarColor: "#f59e0b", restrictions: [], behaviorLogs: [
      { id: "beh-2", timestamp: "2026-08-25T10:10:00Z", type: "infraction", tag: "Phone Misuse", note: "Warning given for social media browsing during study time", severity: "Warning" }
    ], totalPrides: 1, totalInfractions: 1 },
    { id: "730006", name: "Bernadette Rostenkowski", grade: 11, period: 4, status: "active", avatarColor: "#10b981", restrictions: [], behaviorLogs: [
      { id: "beh-3", timestamp: "2026-08-25T10:30:00Z", type: "positive", tag: "Peer Tutoring", note: "Helped 3 students master projectile vector formulas", severity: "Commendation" }
    ], totalPrides: 5, totalInfractions: 0 },
    { id: "730007", name: "Amy Farrah Fowler", grade: 11, period: 4, status: "active", avatarColor: "#06b6d4", restrictions: [], behaviorLogs: [
      { id: "beh-4", timestamp: "2026-08-27T10:20:00Z", type: "positive", tag: "Lab Master", note: "Finished entropy analysis early and assisted table mates", severity: "Commendation" }
    ], totalPrides: 3, totalInfractions: 0 },
    { id: "730008", name: "Stuart Bloom", grade: 12, period: 5, status: "active", avatarColor: "#a855f7", restrictions: [], behaviorLogs: [], totalPrides: 0, totalInfractions: 0 },
    { id: "730009", name: "Barry Kripke", grade: 12, period: 6, status: "restricted", avatarColor: "#ef4444", restrictions: [
      { id: "res-102", reason: "Left PRIDE Time room without hall pass and wandered hallway", dateLogged: "2026-08-26", expiresDate: "2026-09-05", active: true, severity: "High", notes: "Referred to assistant principal office." }
    ], behaviorLogs: [
      { id: "beh-5", timestamp: "2026-08-26T10:45:00Z", type: "infraction", tag: "Left Without Pass", note: "Found wandering near quad during tutorial", severity: "High" }
    ], totalPrides: 0, totalInfractions: 3 },
    { id: "730010", name: "Leslie Winkle", grade: 11, period: 6, status: "active", avatarColor: "#3b82f6", restrictions: [], behaviorLogs: [], totalPrides: 2, totalInfractions: 0 }
  ];

  // ==========================================================================
  // 2. GLOBAL STATE & SINGLETONS
  // ==========================================================================

  const State = {
    settings: { ...DEFAULT_SETTINGS },
    students: [],
    attendanceRecords: {}, // Keyed by Date string: { "2026-09-01": [ ... ] }
    behaviorLogs: [],
    currentSessionDate: getTodayDateString(),
    scannerActive: false,
    html5QrCode: null,
    currentCameraTrack: null,
    torchActive: false,
    lastScannedId: null,
    lastScannedTime: 0,
    cooldownMs: 3500,
    selectedStudentForAction: null,
    activeTab: 'scanner',
    audioCtx: null,
    broadcastChannel: null,
    firestoreConnected: false
  };

  // ==========================================================================
  // 3. SOUND SYNTHESIZER (WEB AUDIO API)
  // ==========================================================================

  const AudioEngine = {
    init() {
      if (!State.audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          State.audioCtx = new AudioContext();
        }
      }
    },

    ensureContext() {
      if (State.audioCtx && State.audioCtx.state === 'suspended') {
        State.audioCtx.resume();
      }
    },

    playSuccess() {
      if (!State.settings.soundEnabled) return;
      try {
        this.init();
        this.ensureContext();
        if (!State.audioCtx) return;

        const now = State.audioCtx.currentTime;
        const osc1 = State.audioCtx.createOscillator();
        const osc2 = State.audioCtx.createOscillator();
        const gainNode = State.audioCtx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(587.33, now); // D5
        osc1.frequency.exponentialRampToValueAtTime(880.00, now + 0.12); // A5

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(880.00, now);
        osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.15); // D6

        gainNode.gain.setValueAtTime(0.01, now);
        gainNode.gain.linearRampToValueAtTime(0.25, now + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(State.audioCtx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.35);
        osc2.stop(now + 0.35);
      } catch (err) {
        console.warn('Audio play error:', err);
      }
    },

    playWarning() {
      if (!State.settings.soundEnabled) return;
      try {
        this.init();
        this.ensureContext();
        if (!State.audioCtx) return;

        const now = State.audioCtx.currentTime;
        const osc = State.audioCtx.createOscillator();
        const gain = State.audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(440.0, now); // A4
        osc.frequency.setValueAtTime(493.88, now + 0.08); // B4

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

        osc.connect(gain);
        gain.connect(State.audioCtx.destination);

        osc.start(now);
        osc.stop(now + 0.22);
      } catch (err) {
        console.warn('Audio play warning error:', err);
      }
    },

    playSlideTick() {
      if (!State.settings.soundEnabled) return;
      try {
        this.init();
        this.ensureContext();
        if (!State.audioCtx) return;

        const now = State.audioCtx.currentTime;
        const osc = State.audioCtx.createOscillator();
        const gain = State.audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(1046.50, now); // C6 short ping

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

        osc.connect(gain);
        gain.connect(State.audioCtx.destination);

        osc.start(now);
        osc.stop(now + 0.05);
      } catch (err) {}
    },

    playDangerAlert() {
      if (!State.settings.soundEnabled) return;
      try {
        this.init();
        this.ensureContext();
        if (!State.audioCtx) return;

        const now = State.audioCtx.currentTime;
        [0, 0.12, 0.24].forEach(offset => {
          const osc = State.audioCtx.createOscillator();
          const gain = State.audioCtx.createGain();

          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(220, now + offset);
          osc.frequency.exponentialRampToValueAtTime(140, now + offset + 0.09);

          gain.gain.setValueAtTime(0.35, now + offset);
          gain.gain.exponentialRampToValueAtTime(0.01, now + offset + 0.1);

          osc.connect(gain);
          gain.connect(State.audioCtx.destination);

          osc.start(now + offset);
          osc.stop(now + offset + 0.1);
        });
      } catch (err) {
        console.warn('Audio play alert error:', err);
      }
    }
  };

  // ==========================================================================
  // 4. HAPTIC ENGINE
  // ==========================================================================

  const HapticEngine = {
    vibrateSuccess() {
      if (State.settings.hapticsEnabled && 'vibrate' in navigator) {
        try { navigator.vibrate([40, 20, 50]); } catch (e) {}
      }
    },
    vibrateWarning() {
      if (State.settings.hapticsEnabled && 'vibrate' in navigator) {
        try { navigator.vibrate([80, 40, 80]); } catch (e) {}
      }
    },
    vibrateDanger() {
      if (State.settings.hapticsEnabled && 'vibrate' in navigator) {
        try { navigator.vibrate([180, 80, 180, 80, 260]); } catch (e) {}
      }
    }
  };

  // ==========================================================================
  // 5. FIRESTORE BRIDGE (DIRECT INTEGRATION WITH db.collection('roster'))
  // ==========================================================================

  const FirestoreBridge = {
    db: null,
    unsubscribeRoster: null,
    unsubscribeAttendance: null,
    isInitialized: false,

    init() {
      if (this.isInitialized) return;
      if (window.firebase && window.firebase.firestore) {
        try {
          this.db = window.firebase.firestore();
          this.isInitialized = true;
          this.bindRosterStream();
          this.bindAttendanceStream(State.currentSessionDate);
          console.log('[FirestoreBridge] Realtime listeners active on db.collection("roster")');
        } catch (err) {
          console.warn('[FirestoreBridge] Firestore init warning:', err);
        }
      }
    },

    bindRosterStream() {
      if (!this.db) return;
      if (this.unsubscribeRoster) this.unsubscribeRoster();

      const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#06b6d4', '#f59e0b', '#3b82f6', '#14b8a6'];

      this.unsubscribeRoster = this.db.collection('roster').onSnapshot((snapshot) => {
        if (snapshot && !snapshot.empty) {
          const firestoreStudents = snapshot.docs.map((doc, idx) => {
            const data = doc.data() || {};
            const studentId = String(data.student_id || doc.id).trim();
            const fullName = data.full_name || (data.first_name ? `${data.first_name} ${data.last_name || ''}`.trim() : `Student #${studentId}`);
            const period = data.class_period !== undefined ? data.class_period : (data.period !== undefined ? data.period : 1);
            const grade = data.grade || 11;
            const status = data.pride_status || data.status || 'active';
            const restrictions = data.pride_restrictions || data.restrictions || [];
            const behaviorLogs = data.pride_behavior_logs || data.behaviorLogs || [];
            const totalPrides = data.pride_points || (data.totalPrides || 0);
            const totalInfractions = data.pride_infractions || (data.totalInfractions || 0);

            return {
              id: studentId,
              name: fullName,
              grade: grade,
              period: period,
              status: status,
              avatarColor: colors[idx % colors.length],
              restrictions: restrictions,
              behaviorLogs: behaviorLogs,
              totalPrides: totalPrides,
              totalInfractions: totalInfractions
            };
          });

          // Sort by period, then by student name
          firestoreStudents.sort((a, b) => {
            if (a.period !== b.period) return (a.period || 0) - (b.period || 0);
            return (a.name || '').localeCompare(b.name || '');
          });

          State.students = firestoreStudents;
          State.firestoreConnected = true;
          Storage.saveStudentsLocalOnly();
          UI.renderAll();
          UI.updateCloudSyncBadge(true, firestoreStudents.length);
        } else {
          console.log('[FirestoreBridge] Firestore roster is currently empty.');
          State.firestoreConnected = true;
          UI.updateCloudSyncBadge(true, State.students.length);
        }
      }, (error) => {
        console.warn('[FirestoreBridge] Roster stream error (offline fallback active):', error);
        State.firestoreConnected = false;
        UI.updateCloudSyncBadge(false, State.students.length);
      });
    },

    bindAttendanceStream(date) {
      if (!this.db || !date) return;
      if (this.unsubscribeAttendance) this.unsubscribeAttendance();

      this.unsubscribeAttendance = this.db.collection('pride_attendance').doc(date).collection('checkins')
        .onSnapshot((snapshot) => {
          if (snapshot) {
            const checkins = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            checkins.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
            State.attendanceRecords[date] = checkins;
            Storage.saveAttendanceLocalOnly();
            UI.renderCounterHUD();
            UI.renderLiveAttendanceTable();
            UI.renderRecentScansRoll();
            UI.renderSessionStats();
          }
        }, (err) => {
          console.warn('[FirestoreBridge] Attendance stream error:', err);
        });
    },

    async pushCheckIn(record) {
      if (!this.db) return;
      try {
        const date = State.currentSessionDate;
        await this.db.collection('pride_attendance').doc(date).collection('checkins').doc(record.studentId).set(record, { merge: true });
      } catch (err) {
        console.warn('[FirestoreBridge] Error pushing checkin to Firestore:', err);
      }
    },

    async removeCheckIn(studentId) {
      if (!this.db) return;
      try {
        const date = State.currentSessionDate;
        await this.db.collection('pride_attendance').doc(date).collection('checkins').doc(studentId).delete();
      } catch (err) {
        console.warn('[FirestoreBridge] Error deleting checkin from Firestore:', err);
      }
    },

    async pushStudentRestriction(studentId, status, restrictions) {
      if (!this.db) return;
      try {
        await this.db.collection('roster').doc(studentId).set({
          pride_status: status,
          pride_restrictions: restrictions,
          updated_at: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      } catch (err) {
        console.warn('[FirestoreBridge] Error updating student restriction in Firestore:', err);
      }
    },

    async pushStudent(studentData) {
      if (!this.db) return;
      try {
        await this.db.collection('roster').doc(studentData.id).set({
          student_id: studentData.id,
          full_name: studentData.name,
          class_period: studentData.period,
          grade: studentData.grade,
          pride_status: studentData.status || 'active',
          pride_restrictions: studentData.restrictions || [],
          updated_at: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      } catch (err) {
        console.warn('[FirestoreBridge] Error saving student to Firestore:', err);
      }
    },

    async logBehavior(entry) {
      if (!this.db) return;
      try {
        await this.db.collection('pride_behavior').add({
          ...entry,
          timestamp_server: firebase.firestore.FieldValue.serverTimestamp()
        });
      } catch (err) {
        console.warn('[FirestoreBridge] Error logging behavior to Firestore:', err);
      }
    }
  };

  // ==========================================================================
  // 6. STORAGE & REPOSITORY ENGINE
  // ==========================================================================

  const Storage = {
    load() {
      try {
        const savedSettings = localStorage.getItem(STORAGE_KEY_SETTINGS);
        if (savedSettings) State.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) };

        const savedStudents = localStorage.getItem(STORAGE_KEY_STUDENTS);
        if (savedStudents) {
          State.students = JSON.parse(savedStudents);
        } else {
          State.students = [...SAMPLE_STUDENTS];
          this.saveStudents();
        }

        const savedAttendance = localStorage.getItem(STORAGE_KEY_ATTENDANCE);
        if (savedAttendance) {
          State.attendanceRecords = JSON.parse(savedAttendance);
        } else {
          State.attendanceRecords = {};
        }

        const savedBehavior = localStorage.getItem(STORAGE_KEY_BEHAVIOR);
        if (savedBehavior) {
          State.behaviorLogs = JSON.parse(savedBehavior);
        } else {
          State.behaviorLogs = State.students.flatMap(s => (s.behaviorLogs || []).map(b => ({ ...b, studentId: s.id, studentName: s.name })));
        }
      } catch (err) {
        console.error('Storage load error:', err);
        State.students = [...SAMPLE_STUDENTS];
        State.attendanceRecords = {};
      }
    },

    saveSettings() {
      try {
        localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(State.settings));
        SyncEngine.broadcast('settings-updated', State.settings);
      } catch (e) { console.error('Failed to save settings:', e); }
    },

    saveStudents() {
      try {
        localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(State.students));
        SyncEngine.broadcast('students-updated', State.students);
      } catch (e) { console.error('Failed to save students:', e); }
    },

    saveStudentsLocalOnly() {
      try {
        localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(State.students));
      } catch (e) {}
    },

    saveAttendance() {
      try {
        localStorage.setItem(STORAGE_KEY_ATTENDANCE, JSON.stringify(State.attendanceRecords));
        SyncEngine.broadcast('attendance-updated', {
          date: State.currentSessionDate,
          records: State.attendanceRecords[State.currentSessionDate] || []
        });
      } catch (e) { console.error('Failed to save attendance:', e); }
    },

    saveAttendanceLocalOnly() {
      try {
        localStorage.setItem(STORAGE_KEY_ATTENDANCE, JSON.stringify(State.attendanceRecords));
      } catch (e) {}
    },

    saveBehavior() {
      try {
        localStorage.setItem(STORAGE_KEY_BEHAVIOR, JSON.stringify(State.behaviorLogs));
        SyncEngine.broadcast('behavior-updated', State.behaviorLogs);
      } catch (e) { console.error('Failed to save behavior:', e); }
    },

    resetToDemoData() {
      State.students = JSON.parse(JSON.stringify(SAMPLE_STUDENTS));
      State.attendanceRecords = {};
      State.behaviorLogs = State.students.flatMap(s => (s.behaviorLogs || []).map(b => ({ ...b, studentId: s.id, studentName: s.name })));
      this.saveStudents();
      this.saveAttendance();
      this.saveBehavior();
      UI.renderAll();
      UI.showToast('Loaded sample roster for demonstration', 'success');
    }
  };

  // ==========================================================================
  // 7. SYNC ENGINE (BROADCASTCHANNEL DUAL-TAB SYNC)
  // ==========================================================================

  const SyncEngine = {
    init() {
      try {
        if ('BroadcastChannel' in window) {
          State.broadcastChannel = new BroadcastChannel('pride_time_channel');
          State.broadcastChannel.onmessage = (event) => {
            const { type, payload } = event.data;
            if (type === 'attendance-updated') {
              if (payload.date === State.currentSessionDate) {
                State.attendanceRecords[payload.date] = payload.records;
                UI.renderCounterHUD();
                UI.renderLiveAttendanceTable();
                UI.renderRecentScansRoll();
              }
            } else if (type === 'students-updated') {
              State.students = payload;
              UI.renderAll();
            } else if (type === 'behavior-updated') {
              State.behaviorLogs = payload;
              UI.renderBehaviorHub();
            }
          };
        }
      } catch (e) {
        console.warn('BroadcastChannel not supported:', e);
      }
    },

    broadcast(type, payload) {
      if (State.broadcastChannel) {
        try {
          State.broadcastChannel.postMessage({ type, payload });
        } catch (e) {}
      }
    }
  };

  // ==========================================================================
  // 8. 6-DIGIT STUDENT ID PARSER & NORMALIZER
  // ==========================================================================

  function extractSixDigitId(rawText) {
    if (!rawText) return '';
    const str = String(rawText).trim();

    // 1. Direct word-boundary 6 digits (e.g., "730001", "123456")
    const match6 = str.match(/\b\d{6}\b/);
    if (match6) return match6[0];

    // 2. Any consecutive 6 digits in string (e.g., "*730001*", "ID:730001", "S730001A")
    const matchAny6 = str.match(/\d{6}/);
    if (matchAny6) return matchAny6[0];

    // 3. Strip all non-digits
    const digitsOnly = str.replace(/\D/g, '');
    if (digitsOnly.length === 6) {
      return digitsOnly;
    } else if (digitsOnly.length > 6) {
      // Return 6-digit substring if present or first 6 digits
      const sub6 = digitsOnly.match(/\d{6}/);
      if (sub6) return sub6[0];
      return digitsOnly.slice(0, 6);
    } else if (digitsOnly.length === 5) {
      // Handle potential dropped leading zero
      return digitsOnly.padStart(6, '0');
    }

    // 4. Fallback: clean out Code 39 asterisks and spaces
    return str.replace(/[\*\s]/g, '');
  }

  // ==========================================================================
  // 9. BARCODE & QR CONTINUOUS CAMERA SCANNER ENGINE (1D OPTIMIZED)
  // ==========================================================================

  const ScannerEngine = {
    currentZoomIndex: 0,
    zoomLevels: [1.0, 1.5, 2.0],

    initScannerInstance(forceNew = false) {
      if (forceNew && State.html5QrCode) {
        try { State.html5QrCode.clear(); } catch (e) {}
        State.html5QrCode = null;
      }
      if (!State.html5QrCode) {
        State.html5QrCode = new Html5Qrcode('reader', {
          verbose: false,
          formatsToSupport: [
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.CODE_93,
            Html5QrcodeSupportedFormats.ITF,
            Html5QrcodeSupportedFormats.CODABAR,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.DATA_MATRIX
          ]
        });
      }
    },

    async startFromUserClick() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const testStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: State.settings.cameraFacingMode || "environment" }
          });
          testStream.getTracks().forEach(t => t.stop());
        }
      } catch (permErr) {
        console.warn('[ScannerEngine] Native permission probe:', permErr);
      }
      await this.start();
    },

    async start() {
      const readerElement = document.getElementById('reader');
      if (!readerElement) return;

      if (State.scannerActive && State.html5QrCode) {
        return;
      }

      this.initScannerInstance();

      const config = {
        fps: 20,
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          const boxWidth = Math.floor(Math.min(viewfinderWidth * 0.92, 440));
          const boxHeight = Math.floor(Math.min(viewfinderHeight * 0.44, 160));
          return { width: Math.max(boxWidth, 220), height: Math.max(boxHeight, 90) };
        },
        aspectRatio: 1.333333
      };

      const qrSuccessCallback = (decodedText, decodedResult) => {
        this.handleScanResult(decodedText, decodedResult);
      };
      const qrErrorCallback = () => {};

      // Tier 1: Try device ID or clean facing mode without strict bounds
      try {
        const cameraConfig = State.settings.selectedCameraId
          ? State.settings.selectedCameraId
          : { facingMode: State.settings.cameraFacingMode || "environment" };

        await State.html5QrCode.start(cameraConfig, config, qrSuccessCallback, qrErrorCallback);
        this.onCameraStarted();
        return;
      } catch (err1) {
        console.warn('[ScannerEngine] Primary camera start failed, trying fallback...', err1);
      }

      // Tier 2: Try discovering available cameras and choosing rear camera
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          const isRear = (d) => {
            const label = (d.label || '').toLowerCase();
            return label.includes('back') || label.includes('rear') || label.includes('environment');
          };
          const chosen = devices.find(isRear) || devices[0];
          State.settings.selectedCameraId = chosen.id;
          Storage.saveSettings();

          this.initScannerInstance(true);
          await State.html5QrCode.start(chosen.id, config, qrSuccessCallback, qrErrorCallback);
          this.onCameraStarted();
          return;
        }
      } catch (err2) {
        console.warn('[ScannerEngine] Fallback getCameras failed:', err2);
      }

      // Tier 3: Try user facing camera
      try {
        this.initScannerInstance(true);
        await State.html5QrCode.start({ facingMode: "user" }, config, qrSuccessCallback, qrErrorCallback);
        State.settings.cameraFacingMode = "user";
        Storage.saveSettings();
        this.onCameraStarted();
        return;
      } catch (err3) {
        console.error('[ScannerEngine] All camera initialization attempts failed:', err3);
        this.onCameraFailed(err3);
      }
    },

    onCameraStarted() {
      State.scannerActive = true;
      this.updateTorchState();
      this.populateCameraList();
      UI.updateScannerHUDState(true);
      const overlay = document.getElementById('camera-start-overlay');
      if (overlay) overlay.classList.add('hidden');
    },

    onCameraFailed(err) {
      State.scannerActive = false;
      const isNotAllowed = err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError' || (err.message && err.message.toLowerCase().includes('permission'));
      const isOverconstrained = err.name === 'OverconstrainedError';

      let userMsg = 'Please tap Allow when prompted for camera access.';
      let subMsg = '';

      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        subMsg = '⚠️ Note: Mobile browsers require HTTPS for camera access. Open via https://rrmudry.github.io/admin/pride_time.html';
      } else if (isNotAllowed) {
        userMsg = 'Camera permission was denied. Please allow camera access in browser site settings.';
      } else if (isOverconstrained) {
        userMsg = 'Camera resolution constraint issue. Tap below to switch camera.';
      }

      UI.updateScannerHUDState(false, err.message || 'Camera access error');
      
      const overlay = document.getElementById('camera-start-overlay');
      const titleElem = document.getElementById('cam-overlay-title');
      const msgElem = document.getElementById('cam-overlay-msg');
      const subMsgElem = document.getElementById('cam-overlay-submsg');

      if (titleElem) titleElem.textContent = isNotAllowed ? 'Camera Permission Denied' : 'Camera Access Error';
      if (msgElem) msgElem.textContent = userMsg;
      if (subMsgElem) subMsgElem.textContent = subMsg;
      if (overlay) overlay.classList.remove('hidden');
    },

    async stop() {
      if (State.html5QrCode && State.scannerActive) {
        try {
          await State.html5QrCode.stop();
        } catch (err) {
          console.warn('Error stopping scanner:', err);
        }
      }
      State.scannerActive = false;
      State.torchActive = false;
      UI.updateScannerHUDState(false);
      const overlay = document.getElementById('camera-start-overlay');
      if (overlay) overlay.classList.remove('hidden');
    },

    async flipCamera() {
      const newFacing = State.settings.cameraFacingMode === 'environment' ? 'user' : 'environment';
      State.settings.cameraFacingMode = newFacing;
      State.settings.selectedCameraId = null;
      Storage.saveSettings();

      if (State.scannerActive) {
        await this.stop();
      }
      await this.start();
    },

    async cycleZoom() {
      if (!State.scannerActive || !State.html5QrCode) {
        UI.showToast('Start camera first to adjust zoom', 'info');
        return;
      }
      try {
        this.currentZoomIndex = (this.currentZoomIndex + 1) % this.zoomLevels.length;
        const targetZoom = this.zoomLevels[this.currentZoomIndex];
        const label = document.getElementById('hud-zoom-label');
        if (label) label.textContent = `${targetZoom}x`;

        const capabilities = State.html5QrCode.getRunningTrackCapabilities();
        if (capabilities && capabilities.zoom) {
          const minZ = capabilities.zoom.min || 1;
          const maxZ = capabilities.zoom.max || 3;
          const clamped = Math.max(minZ, Math.min(maxZ, targetZoom));
          await State.html5QrCode.applyVideoConstraints({
            advanced: [{ zoom: clamped }]
          });
          UI.showToast(`🔍 Optical Zoom: ${targetZoom}x`, 'info');
        } else {
          UI.showToast(`Zoom set to ${targetZoom}x (Hold phone 4-8 inches away)`, 'info');
        }
      } catch (e) {
        console.warn('Zoom apply error:', e);
      }
    },

    async toggleTorch() {
      if (!State.scannerActive || !State.html5QrCode) return;
      try {
        const capabilities = State.html5QrCode.getRunningTrackCapabilities();
        if (capabilities && capabilities.torch) {
          State.torchActive = !State.torchActive;
          await State.html5QrCode.applyVideoConstraints({
            advanced: [{ torch: State.torchActive }]
          });
          UI.updateTorchButton(State.torchActive);
        } else {
          UI.showToast('Flashlight not available on this camera', 'warning');
        }
      } catch (err) {
        console.warn('Torch toggle failed:', err);
        UI.showToast('Could not toggle flashlight', 'warning');
      }
    },

    updateTorchState() {
      try {
        const capabilities = State.html5QrCode.getRunningTrackCapabilities();
        const btnTorch = document.getElementById('btn-torch');
        if (btnTorch) {
          if (capabilities && capabilities.torch) {
            btnTorch.classList.remove('opacity-40', 'pointer-events-none');
          } else {
            btnTorch.classList.add('opacity-40');
          }
        }
      } catch (e) {}
    },

    async populateCameraList() {
      try {
        const devices = await Html5Qrcode.getCameras();
        const select = document.getElementById('camera-select');
        if (select && devices && devices.length > 0) {
          select.innerHTML = devices.map(d => `<option value="${d.id}" ${d.id === State.settings.selectedCameraId ? 'selected' : ''}>${d.label || `Camera ${d.id.substring(0, 5)}`}</option>`).join('');
        }
      } catch (e) {
        console.warn('Could not enumerate cameras:', e);
      }
    },

    handleScanResult(rawText, decodedResult) {
      if (!rawText) return;
      const rawClean = String(rawText).trim();
      const extractedId = extractSixDigitId(rawClean);
      const query = extractedId || rawClean;
      const now = Date.now();

      // Debounce: same student within cooldownMs
      if (query === State.lastScannedId && (now - State.lastScannedTime) < State.cooldownMs) {
        return;
      }

      State.lastScannedId = query;
      State.lastScannedTime = now;

      AttendanceEngine.processCheckIn(query, false, rawClean);
    }
  };

  // ==========================================================================
  // 10. ATTENDANCE ENGINE
  // ==========================================================================

  const AttendanceEngine = {
    processCheckIn(scannedQuery, isManual = false, rawScanText = '') {
      const student = StudentDirectory.findStudent(scannedQuery);
      const sessionDate = State.currentSessionDate;
      const sessionRecords = State.attendanceRecords[sessionDate] || [];

      // Case A: Student Not Found in Roster
      if (!student) {
        AudioEngine.playWarning();
        HapticEngine.vibrateWarning();
        UI.flashScanner('warning');
        const displayQuery = extractSixDigitId(scannedQuery) || scannedQuery;
        UI.openUnregisteredStudentModal(displayQuery);
        return;
      }

      // Case B: Student Already Checked In for this session
      const alreadyCheckedIn = sessionRecords.find(r => r.studentId === student.id && !r.leftEarly);
      if (alreadyCheckedIn) {
        AudioEngine.playWarning();
        HapticEngine.vibrateWarning();
        UI.flashScanner('warning');
        UI.showToast(`⚠️ ${student.name} is already checked in (${alreadyCheckedIn.timeFormatted})`, 'warning');
        return;
      }

      // Case C: Student is RESTRICTED / BANNED
      if (student.status === 'restricted') {
        AudioEngine.playDangerAlert();
        HapticEngine.vibrateDanger();
        UI.flashScanner('danger');
        UI.openRestrictionAlertModal(student);
        return;
      }

      // Case D: Student is on PROBATION
      if (student.status === 'probation') {
        AudioEngine.playWarning();
        HapticEngine.vibrateWarning();
        UI.flashScanner('warning');
        this.recordAttendanceEntry(student, false, 'Admitted on probation (Monitor)');
        UI.showToast(`⚠️ Checked In (PROBATION): ${student.name}`, 'warning');
        return;
      }

      // Case E: Normal Check-In
      AudioEngine.playSuccess();
      HapticEngine.vibrateSuccess();
      UI.flashScanner('success');
      this.recordAttendanceEntry(student, false, '');
      UI.showToast(`✅ Checked In: ${student.name} (ID: ${student.id})`, 'success');
    },

    recordAttendanceEntry(student, overrideUsed = false, note = '') {
      const sessionDate = State.currentSessionDate;
      if (!State.attendanceRecords[sessionDate]) {
        State.attendanceRecords[sessionDate] = [];
      }

      const now = new Date();
      const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      const newRecord = {
        id: `att-${Date.now()}-${student.id}`,
        studentId: student.id,
        studentName: student.name,
        grade: student.grade,
        period: student.period,
        timestamp: now.toISOString(),
        timeFormatted: timeFormatted,
        overrideUsed: overrideUsed,
        leftEarly: false,
        note: note
      };

      State.attendanceRecords[sessionDate].unshift(newRecord);
      Storage.saveAttendance();

      // Push to Firestore Cloud
      FirestoreBridge.pushCheckIn(newRecord);

      // Update UI components
      UI.renderCounterHUD();
      UI.renderLiveAttendanceTable();
      UI.renderRecentScansRoll();
      UI.renderSessionStats();
    },

    checkoutStudent(recordId) {
      const sessionDate = State.currentSessionDate;
      const records = State.attendanceRecords[sessionDate] || [];
      const record = records.find(r => r.id === recordId);
      if (record) {
        record.leftEarly = true;
        record.leftTimestamp = new Date().toISOString();
        record.leftTimeFormatted = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        Storage.saveAttendance();
        FirestoreBridge.pushCheckIn(record);
        UI.renderCounterHUD();
        UI.renderLiveAttendanceTable();
        UI.renderRecentScansRoll();
        UI.showToast(`👋 Checked out: ${record.studentName}`, 'info');
      }
    },

    undoCheckin(recordId) {
      const sessionDate = State.currentSessionDate;
      const records = State.attendanceRecords[sessionDate] || [];
      const rec = records.find(r => r.id === recordId);
      if (rec) {
        FirestoreBridge.removeCheckIn(rec.studentId);
      }
      State.attendanceRecords[sessionDate] = records.filter(r => r.id !== recordId);
      Storage.saveAttendance();
      UI.renderCounterHUD();
      UI.renderLiveAttendanceTable();
      UI.renderRecentScansRoll();
      UI.showToast('Check-in removed', 'info');
    },

    getPresentCount(sessionDate = State.currentSessionDate) {
      const records = State.attendanceRecords[sessionDate] || [];
      return records.filter(r => !r.leftEarly).length;
    }
  };

  // ==========================================================================
  // 11. STUDENT DIRECTORY & RESTRICTION CONTROLLER (6-DIGIT MATCHING)
  // ==========================================================================

  const StudentDirectory = {
    findStudent(query) {
      if (!query) return null;
      const qRaw = String(query).trim();
      const clean = qRaw.replace(/[\*\s]/g, '').toLowerCase();
      const digits = qRaw.replace(/\D/g, '');
      const match6 = qRaw.match(/\d{6}/)?.[0] || null;

      // 1. Direct ID match
      let student = State.students.find(s => 
        String(s.id).toLowerCase() === clean || 
        String(s.id).toLowerCase() === qRaw.toLowerCase()
      );
      if (student) return student;

      // 2. 6-digit extracted match (handles Code 39 *123456*, raw prefixes, etc.)
      if (match6) {
        student = State.students.find(s => {
          const sId = String(s.id).trim();
          const sDigits = sId.replace(/\D/g, '');
          return sId === match6 || 
                 sDigits === match6 || 
                 sDigits.padStart(6, '0') === match6 || 
                 match6.padStart(6, '0') === sDigits;
        });
        if (student) return student;
      }

      // 3. Digit normalization (handles leading zeros e.g. "073001" vs "73001")
      if (digits.length >= 4) {
        student = State.students.find(s => {
          const sDigits = String(s.id).replace(/\D/g, '');
          if (!sDigits) return false;
          if (sDigits === digits) return true;
          if (sDigits.padStart(6, '0') === digits.padStart(6, '0')) return true;
          if (digits.length > 6 && (digits.includes(sDigits) || digits.startsWith(sDigits) || digits.endsWith(sDigits))) return true;
          return false;
        });
        if (student) return student;
      }

      // 4. Match by student name
      student = State.students.find(s => 
        String(s.name).toLowerCase() === clean || 
        String(s.name).toLowerCase() === qRaw.toLowerCase() ||
        String(s.name).toLowerCase().includes(clean)
      );
      return student || null;
    },

    addStudent(studentData) {
      const exists = State.students.some(s => String(s.id) === String(studentData.id));
      if (exists) {
        UI.showToast(`Student ID #${studentData.id} already exists!`, 'warning');
        return false;
      }

      const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#06b6d4', '#f59e0b', '#3b82f6'];
      const newStudent = {
        id: String(studentData.id).trim(),
        name: String(studentData.name).trim(),
        grade: parseInt(studentData.grade, 10) || 11,
        period: parseInt(studentData.period, 10) || 1,
        status: studentData.status || 'active',
        avatarColor: colors[Math.floor(Math.random() * colors.length)],
        restrictions: studentData.restrictions || [],
        behaviorLogs: [],
        totalPrides: 0,
        totalInfractions: 0
      };

      State.students.push(newStudent);
      Storage.saveStudents();

      // Push to Firestore roster
      FirestoreBridge.pushStudent(newStudent);

      UI.renderRosterTable();
      UI.renderPrintableBadges();
      return newStudent;
    },

    setStudentRestriction(studentId, restrictionData) {
      const student = State.students.find(s => String(s.id) === String(studentId));
      if (!student) return;

      const newRes = {
        id: `res-${Date.now()}`,
        reason: restrictionData.reason || 'PRIDE Time Disciplinary Restriction',
        dateLogged: getTodayDateString(),
        expiresDate: restrictionData.expiresDate || '',
        active: true,
        severity: restrictionData.severity || 'High',
        notes: restrictionData.notes || ''
      };

      student.restrictions = student.restrictions || [];
      student.restrictions.push(newRes);
      student.status = 'restricted';
      student.totalInfractions = (student.totalInfractions || 0) + 1;

      // Sync to Firestore
      FirestoreBridge.pushStudentRestriction(student.id, 'restricted', student.restrictions);

      // Also log to behavior log
      BehaviorTracker.logBehavior({
        studentId: student.id,
        studentName: student.name,
        type: 'infraction',
        tag: 'Access Restricted',
        note: `[RESTRICTION APPLIED] ${newRes.reason}. ${newRes.notes}`,
        severity: newRes.severity
      });

      Storage.saveStudents();
      UI.renderAll();
      UI.showToast(`⛔ Access restriction applied to ${student.name}`, 'warning');
    },

    liftRestriction(studentId, restrictionId) {
      const student = State.students.find(s => String(s.id) === String(studentId));
      if (!student) return;

      if (student.restrictions) {
        student.restrictions = student.restrictions.map(r => 
          (!restrictionId || r.id === restrictionId) ? { ...r, active: false } : r
        );
      }

      const hasActive = student.restrictions.some(r => r.active);
      student.status = hasActive ? 'restricted' : 'active';

      // Sync to Firestore
      FirestoreBridge.pushStudentRestriction(student.id, student.status, student.restrictions);

      Storage.saveStudents();
      UI.renderAll();
      UI.showToast(`✅ Restriction lifted for ${student.name}`, 'success');
    }
  };

  // ==========================================================================
  // 11. BEHAVIOR TRACKING ENGINE
  // ==========================================================================

  const BehaviorTracker = {
    logBehavior(entry) {
      const now = new Date();
      const newLog = {
        id: `beh-${Date.now()}`,
        studentId: entry.studentId,
        studentName: entry.studentName,
        timestamp: now.toISOString(),
        timeFormatted: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: getTodayDateString(),
        type: entry.type || 'infraction',
        tag: entry.tag || 'General',
        note: entry.note || '',
        severity: entry.severity || 'Standard',
        points: entry.type === 'positive' ? (entry.points || 1) : 0
      };

      State.behaviorLogs.unshift(newLog);
      Storage.saveBehavior();
      FirestoreBridge.logBehavior(newLog);

      const student = State.students.find(s => String(s.id) === String(entry.studentId));
      if (student) {
        student.behaviorLogs = student.behaviorLogs || [];
        student.behaviorLogs.unshift(newLog);
        if (entry.type === 'positive') {
          student.totalPrides = (student.totalPrides || 0) + 1;
        } else {
          student.totalInfractions = (student.totalInfractions || 0) + 1;
        }
        Storage.saveStudents();
      }

      UI.renderBehaviorHub();
      UI.renderLiveAttendanceTable();
      UI.showToast(`Logged behavior tag for ${entry.studentName}`, 'success');
    }
  };

  // ==========================================================================
  // 12. USER INTERFACE & RENDERING CONTROLLER
  // ==========================================================================

  const UI = {
    init() {
      this.bindEvents();
      this.renderAll();

      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab');
      if (tabParam && ['scanner', 'dashboard', 'roster', 'behavior', 'badges', 'settings'].includes(tabParam)) {
        this.switchTab(tabParam);
      } else {
        this.switchTab('scanner');
      }

      this.updatePrideDayBanner();
    },

    bindEvents() {
      // Tab Navigation
      document.querySelectorAll('.nav-tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const tabId = e.currentTarget.dataset.tab;
          if (tabId) this.switchTab(tabId);
        });
      });

      // Quick Lookup Input
      const manualInput = document.getElementById('manual-search-input');
      const manualBtn = document.getElementById('manual-search-btn');
      if (manualInput && manualBtn) {
        const doManualCheckin = () => {
          const val = manualInput.value.trim();
          if (val) {
            AttendanceEngine.processCheckIn(val, true);
            manualInput.value = '';
          }
        };
        manualBtn.addEventListener('click', doManualCheckin);
        manualInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') doManualCheckin();
        });
      }

      // Scanner Controls
      const btnToggleCamera = document.getElementById('btn-toggle-camera');
      if (btnToggleCamera) {
        btnToggleCamera.addEventListener('click', () => {
          if (State.scannerActive) {
            ScannerEngine.stop();
          } else {
            ScannerEngine.startFromUserClick();
          }
        });
      }

      const btnFlipCamera = document.getElementById('btn-flip-camera');
      if (btnFlipCamera) {
        btnFlipCamera.addEventListener('click', () => ScannerEngine.flipCamera());
      }

      const btnTorch = document.getElementById('btn-torch');
      if (btnTorch) {
        btnTorch.addEventListener('click', () => ScannerEngine.toggleTorch());
      }

      const btnSoundToggle = document.getElementById('btn-sound-toggle');
      if (btnSoundToggle) {
        btnSoundToggle.addEventListener('click', () => {
          State.settings.soundEnabled = !State.settings.soundEnabled;
          Storage.saveSettings();
          this.updateSoundButton();
          AudioEngine.init();
          if (State.settings.soundEnabled) AudioEngine.playSuccess();
        });
      }

      const btnHapticsToggle = document.getElementById('btn-haptics-toggle');
      if (btnHapticsToggle) {
        btnHapticsToggle.addEventListener('click', () => {
          State.settings.hapticsEnabled = !State.settings.hapticsEnabled;
          Storage.saveSettings();
          this.updateHapticsButton();
          if (State.settings.hapticsEnabled) HapticEngine.vibrateSuccess();
        });
      }

      // Session Date Picker
      const sessionDateInput = document.getElementById('session-date-picker');
      if (sessionDateInput) {
        sessionDateInput.value = State.currentSessionDate;
        sessionDateInput.addEventListener('change', (e) => {
          State.currentSessionDate = e.target.value;
          FirestoreBridge.bindAttendanceStream(State.currentSessionDate);
          this.updatePrideDayBanner();
          this.renderCounterHUD();
          this.renderLiveAttendanceTable();
          this.renderRecentScansRoll();
          this.renderSessionStats();
        });
      }

      // Roster CSV Upload
      const csvFileInput = document.getElementById('roster-csv-file');
      if (csvFileInput) {
        csvFileInput.addEventListener('change', (e) => this.handleCsvImport(e));
      }

      // Settings Inputs
      const capacityInput = document.getElementById('setting-room-capacity');
      if (capacityInput) {
        capacityInput.value = State.settings.roomCapacity;
        capacityInput.addEventListener('change', (e) => {
          State.settings.roomCapacity = Math.max(5, parseInt(e.target.value, 10) || 35);
          Storage.saveSettings();
          this.renderCounterHUD();
        });
      }
    },

    switchTab(tabId) {
      State.activeTab = tabId;
      document.querySelectorAll('.nav-tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabId);
      });

      document.querySelectorAll('.tab-content-panel').forEach(panel => {
        panel.classList.toggle('hidden', panel.id !== `tab-${tabId}`);
      });

      if (tabId === 'scanner') {
        if (!State.scannerActive) ScannerEngine.start();
      }

      if (tabId === 'badges') {
        this.renderPrintableBadges();
      } else if (tabId === 'behavior') {
        this.renderBehaviorHub();
      } else if (tabId === 'roster') {
        this.renderRosterTable();
      } else if (tabId === 'dashboard') {
        this.renderLiveAttendanceTable();
        this.renderSessionStats();
      }
    },

    renderAll() {
      this.renderCounterHUD();
      this.renderRecentScansRoll();
      this.renderLiveAttendanceTable();
      this.renderRosterTable();
      this.renderBehaviorHub();
      this.renderSessionStats();
      this.updateSoundButton();
      this.updateHapticsButton();
      this.updatePrideDayBanner();
    },

    renderCounterHUD() {
      const presentCount = AttendanceEngine.getPresentCount();
      const capacity = State.settings.roomCapacity || 35;
      const percentage = Math.min(100, Math.round((presentCount / capacity) * 100));

      const hudCountElem = document.getElementById('hud-counter-text');
      const hudCapacityElem = document.getElementById('hud-capacity-text');
      const hudFillElem = document.getElementById('hud-capacity-fill');
      const dashCounterElem = document.getElementById('dash-counter-big');
      const dashCapacityElem = document.getElementById('dash-capacity-max');

      if (hudCountElem) hudCountElem.textContent = presentCount;
      if (hudCapacityElem) hudCapacityElem.textContent = `/${capacity}`;
      if (dashCounterElem) dashCounterElem.textContent = presentCount;
      if (dashCapacityElem) dashCapacityElem.textContent = capacity;

      if (hudFillElem) {
        hudFillElem.style.width = `${percentage}%`;
        if (percentage >= 100) {
          hudFillElem.style.backgroundColor = '#ef4444';
        } else if (percentage >= 80) {
          hudFillElem.style.backgroundColor = '#f59e0b';
        } else {
          hudFillElem.style.backgroundColor = '#10b981';
        }
      }

      const hudAlert = document.getElementById('hud-capacity-alert');
      if (hudAlert) {
        if (presentCount >= capacity) {
          hudAlert.classList.remove('hidden');
          hudAlert.textContent = 'ROOM AT MAX CAPACITY';
        } else {
          hudAlert.classList.add('hidden');
        }
      }
    },

    renderRecentScansRoll() {
      const container = document.getElementById('recent-scans-roll');
      if (!container) return;

      const records = State.attendanceRecords[State.currentSessionDate] || [];
      const activeRecords = records.filter(r => !r.leftEarly).slice(0, 10);

      if (activeRecords.length === 0) {
        container.innerHTML = `
          <div class="p-4 text-center text-slate-500 text-xs italic w-full">
            No students scanned for today's session yet. Point camera at student ID barcode or QR code.
          </div>
        `;
        return;
      }

      container.innerHTML = activeRecords.map(rec => {
        const student = State.students.find(s => String(s.id) === String(rec.studentId)) || { avatarColor: '#6366f1' };
        return `
          <div class="scan-card-mini flex flex-col justify-between">
            <div class="flex items-center justify-between gap-2 mb-2">
              <div class="flex items-center gap-2 overflow-hidden">
                <div class="w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs text-white shrink-0" style="background-color: ${student.avatarColor || '#6366f1'}">
                  ${getInitials(rec.studentName)}
                </div>
                <div class="truncate">
                  <div class="font-bold text-xs text-slate-100 truncate">${rec.studentName}</div>
                  <div class="text-[10px] mono text-slate-400">#${rec.studentId} • P${rec.period || '-'}</div>
                </div>
              </div>
              <span class="text-[9px] mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold shrink-0">${rec.timeFormatted}</span>
            </div>
            
            <div class="flex items-center justify-between gap-1 pt-2 border-t border-white/10 mt-1">
              <button onclick="window.PRIDE.openBehaviorModal('${rec.studentId}')" class="text-[10px] text-indigo-300 hover:text-indigo-200 font-bold flex items-center gap-1 bg-indigo-500/10 px-2 py-1 rounded">
                <i data-lucide="tag" class="w-3 h-3"></i> Behavior
              </button>
              <button onclick="window.PRIDE.undoCheckin('${rec.id}')" class="text-[10px] text-rose-400 hover:text-rose-300 font-bold flex items-center gap-0.5 bg-rose-500/10 px-2 py-1 rounded" title="Undo Check-in">
                <i data-lucide="trash-2" class="w-3 h-3"></i> Undo
              </button>
            </div>
          </div>
        `;
      }).join('');

      if (window.lucide) window.lucide.createIcons();
    },

    renderLiveAttendanceTable() {
      const container = document.getElementById('live-attendance-tbody');
      if (!container) return;

      const records = State.attendanceRecords[State.currentSessionDate] || [];
      if (records.length === 0) {
        container.innerHTML = `
          <tr>
            <td colspan="6" class="p-8 text-center text-slate-500 text-sm italic">
              No students scanned for this PRIDE session yet.
            </td>
          </tr>
        `;
        return;
      }

      container.innerHTML = records.map(rec => {
        const student = State.students.find(s => String(s.id) === String(rec.studentId));
        const statusBadge = rec.leftEarly
          ? `<span class="status-badge bg-slate-800 text-slate-400 border border-slate-700">Left Early</span>`
          : rec.overrideUsed
            ? `<span class="status-badge badge-probation">Override Entry</span>`
            : `<span class="status-badge badge-allowed">Present</span>`;

        return `
          <tr class="table-row border-b border-white/5 text-xs transition-colors">
            <td class="p-3">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs text-white shrink-0" style="background-color: ${student?.avatarColor || '#6366f1'}">
                  ${getInitials(rec.studentName)}
                </div>
                <div>
                  <div class="font-bold text-slate-100">${rec.studentName}</div>
                  <div class="text-[10px] mono text-slate-400">ID: ${rec.studentId}</div>
                </div>
              </div>
            </td>
            <td class="p-3 mono text-slate-300">Period ${rec.period ?? '-'}</td>
            <td class="p-3 mono font-semibold text-emerald-400">${rec.timeFormatted}</td>
            <td class="p-3">${statusBadge}</td>
            <td class="p-3 text-slate-400 italic">${rec.note || '-'}</td>
            <td class="p-3 text-right">
              <div class="flex items-center justify-end gap-2">
                <button onclick="window.PRIDE.openBarcodeSlideshow('${rec.studentId}')" class="px-2.5 py-1 rounded-lg bg-violet-600/20 hover:bg-violet-600/40 text-violet-300 font-bold flex items-center gap-1" title="Show scannable barcode slide">
                  <i data-lucide="qr-code" class="w-3 h-3"></i> Barcode
                </button>
                <button onclick="window.PRIDE.openBehaviorModal('${rec.studentId}')" class="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 font-bold flex items-center gap-1">
                  <i data-lucide="tag" class="w-3 h-3"></i> Note
                </button>
                ${!rec.leftEarly ? `
                  <button onclick="window.PRIDE.checkoutStudent('${rec.id}')" class="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold flex items-center gap-1" title="Mark student departed">
                    <i data-lucide="log-out" class="w-3 h-3"></i> Exit
                  </button>
                ` : ''}
                <button onclick="window.PRIDE.undoCheckin('${rec.id}')" class="px-2 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/40 text-rose-400" title="Delete scan record">
                  <i data-lucide="x" class="w-3 h-3"></i>
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');

      if (window.lucide) window.lucide.createIcons();
    },

    renderRosterTable() {
      const container = document.getElementById('roster-tbody');
      if (!container) return;

      const searchInput = document.getElementById('roster-search-input');
      const searchQuery = (searchInput?.value || '').toLowerCase().trim();
      const periodFilter = document.getElementById('roster-period-filter')?.value || 'all';
      const statusFilter = document.getElementById('roster-status-filter')?.value || 'all';

      let list = [...State.students];

      if (searchQuery) {
        list = list.filter(s => s.name.toLowerCase().includes(searchQuery) || String(s.id).includes(searchQuery));
      }
      if (periodFilter !== 'all') {
        list = list.filter(s => String(s.period) === String(periodFilter));
      }
      if (statusFilter !== 'all') {
        list = list.filter(s => s.status === statusFilter);
      }

      const countElem = document.getElementById('roster-total-count');
      if (countElem) countElem.textContent = `${list.length} Students`;

      if (list.length === 0) {
        container.innerHTML = `
          <tr>
            <td colspan="6" class="p-8 text-center text-slate-500 text-sm italic">
              No students match the selected search and filter criteria.
            </td>
          </tr>
        `;
        return;
      }

      container.innerHTML = list.map(student => {
        let statusBadge = `<span class="status-badge badge-allowed">Allowed</span>`;
        if (student.status === 'restricted') {
          statusBadge = `<span class="status-badge badge-danger badge-restricted">Restricted</span>`;
        } else if (student.status === 'probation') {
          statusBadge = `<span class="status-badge badge-probation">Probation</span>`;
        }

        return `
          <tr class="table-row border-b border-white/5 text-xs transition-colors">
            <td class="p-3">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs text-white shrink-0" style="background-color: ${student.avatarColor || '#6366f1'}">
                  ${getInitials(student.name)}
                </div>
                <div>
                  <div class="font-bold text-slate-100">${student.name}</div>
                  <div class="text-[10px] text-slate-400">Grade ${student.grade || 11}</div>
                </div>
              </div>
            </td>
            <td class="p-3 mono font-bold text-indigo-300">#${student.id}</td>
            <td class="p-3 mono">Period ${student.period ?? '-'}</td>
            <td class="p-3">${statusBadge}</td>
            <td class="p-3">
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">⭐ ${student.totalPrides || 0}</span>
                <span class="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold text-[10px]">⚠️ ${student.totalInfractions || 0}</span>
              </div>
            </td>
            <td class="p-3 text-right">
              <div class="flex items-center justify-end gap-2">
                <button onclick="window.PRIDE.openBehaviorModal('${student.id}')" class="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 font-bold">
                  Log Behavior
                </button>
                ${student.status === 'restricted' ? `
                  <button onclick="window.PRIDE.liftRestriction('${student.id}')" class="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 font-bold">
                    Lift Ban
                  </button>
                ` : `
                  <button onclick="window.PRIDE.openRestrictModal('${student.id}')" class="px-2.5 py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 font-bold">
                    Restrict
                  </button>
                `}
              </div>
            </td>
          </tr>
        `;
      }).join('');

      if (window.lucide) window.lucide.createIcons();
    },

    renderBehaviorHub() {
      const activeResContainer = document.getElementById('active-restrictions-list');
      const historyContainer = document.getElementById('behavior-history-tbody');

      const restrictedStudents = State.students.filter(s => s.status === 'restricted');
      if (activeResContainer) {
        if (restrictedStudents.length === 0) {
          activeResContainer.innerHTML = `
            <div class="p-6 text-center text-slate-500 text-xs italic bg-slate-900/50 rounded-2xl border border-white/5">
              🎉 No students currently restricted from PRIDE Time! All students in good standing.
            </div>
          `;
        } else {
          activeResContainer.innerHTML = restrictedStudents.map(s => {
            const activeRes = s.restrictions?.find(r => r.active) || s.restrictions?.[0] || { reason: 'Restriction active' };
            return `
              <div class="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div class="flex items-start gap-3">
                  <div class="w-10 h-10 rounded-xl bg-rose-600/30 border border-rose-500/50 flex items-center justify-center text-rose-300 font-black shrink-0">
                    <i data-lucide="shield-alert" class="w-5 h-5"></i>
                  </div>
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="font-bold text-sm text-rose-100">${s.name}</span>
                      <span class="text-xs mono text-rose-300/80">#${s.id}</span>
                      <span class="status-badge badge-danger badge-restricted text-[10px]">Active Ban</span>
                    </div>
                    <p class="text-xs text-rose-200 mt-1 font-medium">${activeRes.reason}</p>
                    <div class="text-[10px] text-slate-400 mt-1 flex flex-wrap gap-3">
                      <span>Logged: ${activeRes.dateLogged || 'Recent'}</span>
                      ${activeRes.expiresDate ? `<span>Expires: ${activeRes.expiresDate}</span>` : ''}
                      <span>Notes: ${activeRes.notes || 'None'}</span>
                    </div>
                  </div>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                  <button onclick="window.PRIDE.liftRestriction('${s.id}')" class="touch-btn touch-btn-success text-xs py-2 px-4">
                    <i data-lucide="unlock" class="w-3.5 h-3.5 mr-1"></i> Lift Restriction
                  </button>
                </div>
              </div>
            `;
          }).join('');
        }
      }

      if (historyContainer) {
        if (State.behaviorLogs.length === 0) {
          historyContainer.innerHTML = `
            <tr>
              <td colspan="5" class="p-6 text-center text-slate-500 text-xs italic">
                No behavior incidents or commendations recorded yet.
              </td>
            </tr>
          `;
        } else {
          historyContainer.innerHTML = State.behaviorLogs.slice(0, 50).map(log => {
            const isPos = log.type === 'positive';
            const badge = isPos 
              ? `<span class="status-badge badge-allowed">⭐ ${log.tag}</span>`
              : `<span class="status-badge badge-restricted">⚠️ ${log.tag}</span>`;

            return `
              <tr class="table-row border-b border-white/5 text-xs">
                <td class="p-3 mono text-slate-400">${log.date || ''} ${log.timeFormatted || ''}</td>
                <td class="p-3 font-bold text-slate-200">${log.studentName} <span class="text-[10px] mono text-slate-400">(#${log.studentId})</span></td>
                <td class="p-3">${badge}</td>
                <td class="p-3 text-slate-300">${log.note || '-'}</td>
                <td class="p-3 mono font-semibold ${isPos ? 'text-emerald-400' : 'text-rose-400'}">${log.severity || 'Standard'}</td>
              </tr>
            `;
          }).join('');
        }
      }

      if (window.lucide) window.lucide.createIcons();
    },

    renderPrintableBadges() {
      const container = document.getElementById('badges-grid-container');
      if (!container) return;

      container.innerHTML = State.students.map(s => {
        return `
          <div class="id-card-print p-4 rounded-2xl bg-slate-900 border border-white/10 flex flex-col justify-between items-center text-center shadow-lg relative overflow-hidden">
            <div class="w-full flex items-center justify-between border-b border-white/10 pb-2 mb-3">
              <span class="text-[10px] font-black uppercase tracking-wider text-indigo-400">PRIDE Pass</span>
              <span class="text-[10px] mono text-slate-400">Period ${s.period ?? '-'}</span>
            </div>

            <div class="w-12 h-12 rounded-full flex items-center justify-center font-black text-base text-white mb-2 shadow-inner" style="background-color: ${s.avatarColor || '#6366f1'}">
              ${getInitials(s.name)}
            </div>

            <div class="font-extrabold text-sm text-slate-100 mb-0.5">${s.name}</div>
            <div class="text-[11px] mono text-indigo-300 font-bold mb-3">ID: ${s.id}</div>

            <div class="bg-white p-2 rounded-xl w-full flex items-center justify-center">
              <svg id="barcode-${s.id}" class="w-full max-h-16"></svg>
            </div>
            
            <div class="text-[8px] uppercase tracking-widest text-slate-400 mt-2">
              Orange High School • PRIDE Time
            </div>
          </div>
        `;
      }).join('');

      if (window.JsBarcode) {
        setTimeout(() => {
          State.students.forEach(s => {
            try {
              window.JsBarcode(`#barcode-${s.id}`, String(s.id), {
                format: "CODE128",
                width: 1.8,
                height: 42,
                displayValue: true,
                fontSize: 12,
                margin: 0,
                lineColor: "#000000"
              });
            } catch (err) {
              console.warn(`JsBarcode error for ID ${s.id}:`, err);
            }
          });
        }, 50);
      }
    },

    renderSessionStats() {
      const sessionDate = State.currentSessionDate;
      const records = State.attendanceRecords[sessionDate] || [];
      const presentCount = records.filter(r => !r.leftEarly).length;
      const totalScans = records.length;
      const capacity = State.settings.roomCapacity || 35;
      const capacityPct = Math.round((presentCount / capacity) * 100);

      const statPresent = document.getElementById('stat-present-count');
      const statCapacityPct = document.getElementById('stat-capacity-pct');
      const statTotalScans = document.getElementById('stat-total-scans');
      const statRestrictionsCount = document.getElementById('stat-restrictions-count');

      if (statPresent) statPresent.textContent = presentCount;
      if (statCapacityPct) statCapacityPct.textContent = `${capacityPct}%`;
      if (statTotalScans) statTotalScans.textContent = totalScans;
      if (statRestrictionsCount) statRestrictionsCount.textContent = State.students.filter(s => s.status === 'restricted').length;
    },

    updateCloudSyncBadge(isConnected, studentCount) {
      const badge = document.getElementById('firestore-sync-badge');
      if (badge) {
        if (isConnected) {
          badge.innerHTML = `
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span class="text-emerald-300 font-bold">Firestore Roster: ${studentCount} Students Active</span>
          `;
          badge.className = 'px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-950/70 text-emerald-300 border border-emerald-500/40 inline-flex items-center gap-2';
        } else {
          badge.innerHTML = `
            <span class="w-2 h-2 rounded-full bg-amber-400"></span>
            <span class="text-amber-300 font-bold">Local Roster Cache (${studentCount})</span>
          `;
          badge.className = 'px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-950/70 text-amber-300 border border-amber-500/40 inline-flex items-center gap-2';
        }
      }
    },

    flashScanner(type) {
      const container = document.getElementById('scanner-viewport-box');
      if (!container) return;
      container.classList.remove('flash-success', 'flash-warning', 'flash-danger');
      void container.offsetWidth;
      container.classList.add(`flash-${type}`);
    },

    showToast(message, type = 'info') {
      const toastContainer = document.getElementById('toast-container');
      if (!toastContainer) return;

      const toast = document.createElement('div');
      const bgClass = type === 'success' 
        ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200' 
        : type === 'warning' 
          ? 'bg-amber-950/90 border-amber-500/40 text-amber-200'
          : type === 'danger'
            ? 'bg-rose-950/90 border-rose-500/40 text-rose-200'
            : 'bg-slate-900/90 border-indigo-500/40 text-indigo-200';

      toast.className = `p-3 rounded-xl border backdrop-blur-md shadow-2xl text-xs font-bold flex items-center gap-2 transform transition-all duration-300 opacity-0 translate-y-2 ${bgClass}`;
      toast.innerHTML = message;

      toastContainer.appendChild(toast);
      requestAnimationFrame(() => {
        toast.classList.remove('opacity-0', 'translate-y-2');
      });

      setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-2');
        setTimeout(() => toast.remove(), 300);
      }, 3500);
    },

    updateScannerHUDState(isRunning, errorMsg) {
      const statusText = document.getElementById('scanner-status-text');
      const laser = document.getElementById('scan-laser-beam');
      const btnToggle = document.getElementById('btn-toggle-camera');

      if (statusText) {
        if (isRunning) {
          statusText.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping mr-2"></span> Continuous Scan Active`;
          statusText.className = 'text-[11px] font-bold text-emerald-400 flex items-center justify-center';
        } else {
          statusText.innerHTML = errorMsg ? `<span class="text-rose-400">⚠️ ${errorMsg}</span>` : `Scanner Paused`;
          statusText.className = 'text-[11px] font-bold text-slate-400 flex items-center justify-center';
        }
      }

      if (laser) {
        laser.style.display = isRunning ? 'block' : 'none';
      }

      if (btnToggle) {
        btnToggle.innerHTML = isRunning 
          ? `<i data-lucide="video-off" class="w-4 h-4 mr-1.5"></i> Pause Scanner` 
          : `<i data-lucide="video" class="w-4 h-4 mr-1.5"></i> Start Camera`;
        if (window.lucide) window.lucide.createIcons();
      }
    },

    updateSoundButton() {
      const btn = document.getElementById('btn-sound-toggle');
      if (btn) {
        btn.classList.toggle('active', State.settings.soundEnabled);
        btn.innerHTML = State.settings.soundEnabled 
          ? `<i data-lucide="volume-2" class="w-4 h-4"></i>` 
          : `<i data-lucide="volume-x" class="w-4 h-4 text-slate-400"></i>`;
        if (window.lucide) window.lucide.createIcons();
      }
    },

    updateHapticsButton() {
      const btn = document.getElementById('btn-haptics-toggle');
      if (btn) {
        btn.classList.toggle('active', State.settings.hapticsEnabled);
        btn.innerHTML = State.settings.hapticsEnabled 
          ? `<i data-lucide="smartphone" class="w-4 h-4"></i>` 
          : `<i data-lucide="smartphone-nfc" class="w-4 h-4 text-slate-400"></i>`;
        if (window.lucide) window.lucide.createIcons();
      }
    },

    updateTorchButton(isActive) {
      const btn = document.getElementById('btn-torch');
      if (btn) {
        btn.classList.toggle('active', isActive);
        btn.innerHTML = isActive 
          ? `<i data-lucide="flashlight" class="w-4 h-4 text-amber-300"></i>` 
          : `<i data-lucide="flashlight-off" class="w-4 h-4 text-slate-400"></i>`;
        if (window.lucide) window.lucide.createIcons();
      }
    },

    updatePrideDayBanner() {
      const banner = document.getElementById('pride-day-banner');
      if (!banner) return;

      const dateObj = new Date(State.currentSessionDate + 'T00:00:00');
      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
      const isPrideDay = ['Tuesday', 'Wednesday', 'Thursday'].includes(dayName);

      if (isPrideDay) {
        banner.className = 'px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5';
        banner.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> ${dayName} PRIDE Time Active`;
      } else {
        banner.className = 'px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5';
        banner.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span> ${dayName} (Non-Standard Tutorial)`;
      }
    },

    openRestrictionAlertModal(student) {
      const modal = document.getElementById('modal-restriction-alert');
      if (!modal) return;

      State.selectedStudentForAction = student;
      const activeRes = student.restrictions?.find(r => r.active) || student.restrictions?.[0] || { reason: 'Active PRIDE Access Ban' };

      document.getElementById('res-alert-student-name').textContent = student.name;
      document.getElementById('res-alert-student-id').textContent = `#${student.id} • Period ${student.period || '-'}`;
      document.getElementById('res-alert-reason').textContent = activeRes.reason;
      document.getElementById('res-alert-notes').textContent = activeRes.notes || 'No extra notes recorded.';
      document.getElementById('res-alert-date').textContent = activeRes.dateLogged || 'Recent';

      modal.classList.add('active');
    },

    closeRestrictionAlertModal() {
      const modal = document.getElementById('modal-restriction-alert');
      if (modal) modal.classList.remove('active');
      State.selectedStudentForAction = null;
    },

    denyRestrictedEntry() {
      if (State.selectedStudentForAction) {
        const student = State.selectedStudentForAction;
        BehaviorTracker.logBehavior({
          studentId: student.id,
          studentName: student.name,
          type: 'infraction',
          tag: 'Denied Inbound Attempt',
          note: `Attempted PRIDE Time check-in while access restricted. Turned away at door.`,
          severity: 'Warning'
        });
        this.showToast(`⛔ Turned away: ${student.name}`, 'warning');
      }
      this.closeRestrictionAlertModal();
    },

    overrideRestrictedEntry() {
      if (State.selectedStudentForAction) {
        const student = State.selectedStudentForAction;
        AttendanceEngine.recordAttendanceEntry(student, true, 'Teacher Override: Admitted for single session');
        this.showToast(`⚠️ Override Granted for ${student.name}`, 'warning');
      }
      this.closeRestrictionAlertModal();
    },

    openBehaviorModal(studentId) {
      const student = State.students.find(s => String(s.id) === String(studentId));
      if (!student) return;

      State.selectedStudentForAction = student;
      const modal = document.getElementById('modal-behavior-log');
      if (!modal) return;

      document.getElementById('beh-modal-student-name').textContent = student.name;
      document.getElementById('beh-modal-student-id').textContent = `#${student.id}`;
      document.getElementById('beh-modal-note').value = '';
      document.getElementById('beh-modal-restrict-toggle').checked = false;

      modal.classList.add('active');
    },

    closeBehaviorModal() {
      const modal = document.getElementById('modal-behavior-log');
      if (modal) modal.classList.remove('active');
      State.selectedStudentForAction = null;
    },

    submitBehaviorLog() {
      const student = State.selectedStudentForAction;
      if (!student) return;

      const tagSelect = document.getElementById('beh-modal-tag');
      const noteInput = document.getElementById('beh-modal-note');
      const restrictToggle = document.getElementById('beh-modal-restrict-toggle');
      const durationSelect = document.getElementById('beh-modal-duration');

      const selectedTag = tagSelect ? tagSelect.value : 'Disruptive';
      const note = noteInput ? noteInput.value.trim() : '';
      const shouldRestrict = restrictToggle ? restrictToggle.checked : false;

      const isPositive = ['Focus & Diligence', 'Peer Tutoring', 'Lab Master', 'Helpful Progress'].includes(selectedTag);

      BehaviorTracker.logBehavior({
        studentId: student.id,
        studentName: student.name,
        type: isPositive ? 'positive' : 'infraction',
        tag: selectedTag,
        note: note,
        severity: isPositive ? 'Commendation' : shouldRestrict ? 'High' : 'Warning'
      });

      if (shouldRestrict) {
        const durationDays = parseInt(durationSelect?.value || '7', 10);
        const expDate = new Date();
        expDate.setDate(expDate.getDate() + durationDays);
        const expStr = expDate.toISOString().split('T')[0];

        StudentDirectory.setStudentRestriction(student.id, {
          reason: `${selectedTag}: ${note || 'Disciplinary ban'}`,
          expiresDate: expStr,
          severity: 'High',
          notes: `Restricted for ${durationDays} days`
        });
      }

      this.closeBehaviorModal();
    },

    openRestrictModal(studentId) {
      const student = State.students.find(s => String(s.id) === String(studentId));
      if (!student) return;

      State.selectedStudentForAction = student;
      const modal = document.getElementById('modal-restrict-student');
      if (!modal) return;

      document.getElementById('restrict-modal-name').textContent = student.name;
      document.getElementById('restrict-modal-reason').value = '';
      document.getElementById('restrict-modal-notes').value = '';

      modal.classList.add('active');
    },

    closeRestrictModal() {
      const modal = document.getElementById('modal-restrict-student');
      if (modal) modal.classList.remove('active');
      State.selectedStudentForAction = null;
    },

    submitRestriction() {
      const student = State.selectedStudentForAction;
      if (!student) return;

      const reason = document.getElementById('restrict-modal-reason')?.value || 'Disruptive in PRIDE Time';
      const notes = document.getElementById('restrict-modal-notes')?.value || '';
      const duration = parseInt(document.getElementById('restrict-modal-duration')?.value || '7', 10);

      const expDate = new Date();
      expDate.setDate(expDate.getDate() + duration);

      StudentDirectory.setStudentRestriction(student.id, {
        reason: reason,
        notes: notes,
        expiresDate: expDate.toISOString().split('T')[0],
        severity: 'High'
      });

      this.closeRestrictModal();
    },

    openUnregisteredStudentModal(scannedId) {
      const modal = document.getElementById('modal-unregistered-student');
      if (!modal) return;

      document.getElementById('unreg-student-id').value = scannedId;
      document.getElementById('unreg-student-name').value = '';
      document.getElementById('unreg-student-period').value = '1';
      document.getElementById('unreg-student-grade').value = '11';

      modal.classList.add('active');
    },

    closeUnregisteredStudentModal() {
      const modal = document.getElementById('modal-unregistered-student');
      if (modal) modal.classList.remove('active');
    },

    submitUnregisteredStudent() {
      const id = document.getElementById('unreg-student-id')?.value.trim();
      const name = document.getElementById('unreg-student-name')?.value.trim();
      const period = document.getElementById('unreg-student-period')?.value;
      const grade = document.getElementById('unreg-student-grade')?.value;

      if (!id || !name) {
        this.showToast('Please enter both student ID and name', 'warning');
        return;
      }

      const newStudent = StudentDirectory.addStudent({ id, name, period, grade, status: 'active' });
      if (newStudent) {
        this.closeUnregisteredStudentModal();
        AttendanceEngine.processCheckIn(newStudent.id);
      }
    },

    openAddStudentModal() {
      const modal = document.getElementById('modal-add-student');
      if (!modal) return;
      document.getElementById('add-student-id').value = '';
      document.getElementById('add-student-name').value = '';
      modal.classList.add('active');
    },

    closeAddStudentModal() {
      const modal = document.getElementById('modal-add-student');
      if (modal) modal.classList.remove('active');
    },

    submitAddStudent() {
      const id = document.getElementById('add-student-id')?.value.trim();
      const name = document.getElementById('add-student-name')?.value.trim();
      const period = document.getElementById('add-student-period')?.value;
      const grade = document.getElementById('add-student-grade')?.value;

      if (!id || !name) {
        this.showToast('Please fill out student ID and Name', 'warning');
        return;
      }

      const added = StudentDirectory.addStudent({ id, name, period, grade });
      if (added) {
        this.closeAddStudentModal();
        this.showToast(`Added ${name} to roster!`, 'success');
      }
    },

    handleCsvImport(event) {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target.result;
          const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
          if (lines.length < 2) {
            UI.showToast('CSV file is empty or missing data rows', 'warning');
            return;
          }

          const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
          const idIdx = headers.findIndex(h => h.includes('id'));
          const nameIdx = headers.findIndex(h => h.includes('name'));
          const periodIdx = headers.findIndex(h => h.includes('period') || h.includes('class'));
          const gradeIdx = headers.findIndex(h => h.includes('grade'));

          let importedCount = 0;
          for (let i = 1; i < lines.length; i++) {
            const parts = lines[i].split(',').map(p => p.trim());
            if (parts.length < 2) continue;

            const id = idIdx !== -1 ? parts[idIdx] : parts[0];
            const name = nameIdx !== -1 ? parts[nameIdx] : (parts[2] || parts[1]);
            const period = periodIdx !== -1 ? parts[periodIdx] : (parts[1] || '1');
            const grade = gradeIdx !== -1 ? parts[gradeIdx] : '11';

            if (id && name) {
              StudentDirectory.addStudent({ id, name, period, grade });
              importedCount++;
            }
          }

          UI.renderAll();
          UI.showToast(`Imported ${importedCount} students and synced to Firestore!`, 'success');
          event.target.value = '';
        } catch (err) {
          console.error('CSV parse error:', err);
          UI.showToast('Error reading CSV file', 'danger');
        }
      };
      reader.readAsText(file);
    },

    exportAttendanceCsv() {
      const sessionDate = State.currentSessionDate;
      const records = State.attendanceRecords[sessionDate] || [];
      if (records.length === 0) {
        UI.showToast('No attendance records to export for this date', 'warning');
        return;
      }

      let csv = "Student ID,Student Name,Period,Grade,Check In Time,Status,Left Early,Notes\n";
      records.forEach(r => {
        const status = r.leftEarly ? "Left Early" : r.overrideUsed ? "Override Entry" : "Present";
        csv += `"${r.studentId}","${r.studentName}","${r.period || ''}","${r.grade || ''}","${r.timeFormatted}","${status}","${r.leftEarly ? 'Yes' : 'No'}","${r.note || ''}"\n`;
      });

      downloadFile(csv, `PRIDE_Time_Attendance_${sessionDate}.csv`, 'text/csv');
      UI.showToast('Exported attendance CSV successfully!', 'success');
    },

    exportDisciplineReportCsv() {
      if (State.behaviorLogs.length === 0) {
        UI.showToast('No behavior records to export', 'warning');
        return;
      }

      let csv = "Date,Time,Student ID,Student Name,Type,Tag,Severity,Notes\n";
      State.behaviorLogs.forEach(b => {
        csv += `"${b.date || ''}","${b.timeFormatted || ''}","${b.studentId}","${b.studentName}","${b.type}","${b.tag}","${b.severity}","${b.note || ''}"\n`;
      });

      downloadFile(csv, `PRIDE_Time_Discipline_Report_${getTodayDateString()}.csv`, 'text/csv');
      UI.showToast('Exported discipline report CSV!', 'success');
    }
  };

  // ==========================================================================
  // 13. BARCODE SLIDESHOW & OFFICIAL APP SCANNER BRIDGE
  // ==========================================================================

  const BarcodeSlideshow = {
    isOpen: false,
    currentIndex: 0,
    isPlaying: false,
    timerId: null,
    speedMs: 1800,
    filterMode: 'present',
    filteredList: [],
    scannedIds: new Set(),
    keyHandler: null,

    open(initialStudentId = null, filter = 'present') {
      this.filterMode = filter;
      const select = document.getElementById('slideshow-filter-select');
      if (select) select.value = filter;

      this.updateList();
      if (this.filteredList.length === 0) {
        UI.showToast('No students found for this filter to playback', 'warning');
        return;
      }

      if (initialStudentId) {
        const idx = this.filteredList.findIndex(s => String(s.id) === String(initialStudentId));
        this.currentIndex = idx !== -1 ? idx : 0;
      } else {
        this.currentIndex = 0;
      }

      this.isOpen = true;
      const modal = document.getElementById('modal-barcode-slideshow');
      if (modal) modal.classList.add('active');

      this.bindKeyboard();
      this.renderSlide();
      this.renderThumbnails();
      this.updatePlayButton();
    },

    close() {
      this.pause();
      this.isOpen = false;
      const modal = document.getElementById('modal-barcode-slideshow');
      if (modal) modal.classList.remove('active');
      this.unbindKeyboard();
    },

    updateList() {
      if (this.filterMode === 'present') {
        const sessionDate = State.currentSessionDate;
        const records = State.attendanceRecords[sessionDate] || [];
        const presentRecords = records.filter(r => !r.leftEarly);
        this.filteredList = presentRecords.map(r => {
          const student = State.students.find(s => String(s.id) === String(r.studentId));
          return student || { id: r.studentId, name: r.studentName, period: r.period, grade: r.grade };
        });
      } else if (this.filterMode === 'all') {
        this.filteredList = [...State.students];
      } else {
        // Filter by specific period number
        this.filteredList = State.students.filter(s => String(s.period) === String(this.filterMode));
      }
    },

    setFilter(mode) {
      this.filterMode = mode;
      this.updateList();
      this.currentIndex = 0;
      if (this.filteredList.length === 0) {
        UI.showToast('No students match this filter', 'warning');
      }
      this.renderSlide();
      this.renderThumbnails();
    },

    setSpeed(ms) {
      this.speedMs = ms;
      if (this.isPlaying) {
        this.pause();
        if (this.speedMs > 0) this.play();
      }
    },

    togglePlay() {
      if (this.isPlaying) {
        this.pause();
      } else {
        this.play();
      }
    },

    play() {
      if (this.filteredList.length === 0) return;
      if (this.speedMs <= 0) {
        UI.showToast('Select an interval timer to use Auto Play', 'info');
        return;
      }

      this.isPlaying = true;
      this.updatePlayButton();

      if (this.timerId) clearInterval(this.timerId);
      this.timerId = setInterval(() => {
        this.next();
      }, this.speedMs);
    },

    pause() {
      this.isPlaying = false;
      if (this.timerId) {
        clearInterval(this.timerId);
        this.timerId = null;
      }
      this.updatePlayButton();
    },

    updatePlayButton() {
      const btn = document.getElementById('slideshow-btn-play');
      if (btn) {
        if (this.isPlaying) {
          btn.innerHTML = `<i data-lucide="pause" class="w-4 h-4"></i> Pause`;
          btn.classList.remove('touch-btn-primary');
          btn.classList.add('bg-amber-600', 'text-white');
        } else {
          btn.innerHTML = `<i data-lucide="play" class="w-4 h-4"></i> Auto Play`;
          btn.classList.add('touch-btn-primary');
          btn.classList.remove('bg-amber-600', 'text-white');
        }
        if (window.lucide) window.lucide.createIcons();
      }
    },

    next() {
      if (this.filteredList.length === 0) return;
      if (this.currentIndex < this.filteredList.length - 1) {
        this.currentIndex++;
      } else {
        this.currentIndex = 0;
      }
      AudioEngine.playSlideTick();
      this.renderSlide();
    },

    prev() {
      if (this.filteredList.length === 0) return;
      if (this.currentIndex > 0) {
        this.currentIndex--;
      } else {
        this.currentIndex = this.filteredList.length - 1;
      }
      AudioEngine.playSlideTick();
      this.renderSlide();
    },

    jumpTo(index) {
      if (index >= 0 && index < this.filteredList.length) {
        this.currentIndex = index;
        AudioEngine.playSlideTick();
        this.renderSlide();
      }
    },

    renderSlide() {
      if (this.filteredList.length === 0) {
        const nameElem = document.getElementById('slideshow-student-name');
        const idElem = document.getElementById('slideshow-student-id-display');
        const counterBadge = document.getElementById('slideshow-counter-badge');
        if (nameElem) nameElem.textContent = 'No Students Present';
        if (idElem) idElem.textContent = 'Check in students first';
        if (counterBadge) counterBadge.textContent = '0 / 0';
        return;
      }

      const student = this.filteredList[this.currentIndex];
      this.scannedIds.add(String(student.id));

      const nameElem = document.getElementById('slideshow-student-name');
      const idElem = document.getElementById('slideshow-student-id-display');
      const periodElem = document.getElementById('slideshow-student-period');
      const counterBadge = document.getElementById('slideshow-counter-badge');
      const progressFill = document.getElementById('slideshow-progress-fill');

      if (nameElem) nameElem.textContent = student.name;
      if (idElem) idElem.textContent = `ID: ${student.id}`;
      if (periodElem) periodElem.textContent = `Period ${student.period ?? '-'}`;
      if (counterBadge) counterBadge.textContent = `${this.currentIndex + 1} / ${this.filteredList.length}`;

      const pct = Math.round(((this.currentIndex + 1) / this.filteredList.length) * 100);
      if (progressFill) progressFill.style.width = `${pct}%`;

      if (window.JsBarcode) {
        try {
          window.JsBarcode('#slideshow-barcode-svg', String(student.id), {
            format: "CODE128",
            width: 2.8,
            height: 75,
            displayValue: true,
            fontSize: 18,
            fontOptions: "bold",
            margin: 10,
            lineColor: "#000000"
          });
        } catch (err) {
          console.warn('JsBarcode slideshow error:', err);
        }
      }

      this.highlightThumbnail();
    },

    renderThumbnails() {
      const container = document.getElementById('slideshow-thumbnails-strip');
      if (!container) return;

      container.innerHTML = this.filteredList.map((s, idx) => {
        const isCurrent = idx === this.currentIndex;
        return `
          <div onclick="window.PRIDE.BarcodeSlideshow.jumpTo(${idx})" class="slideshow-thumb-card ${isCurrent ? 'active' : ''}" id="slide-thumb-${idx}">
            <div class="text-[10px] font-bold text-slate-200 truncate">${s.name.split(' ')[0]}</div>
            <div class="text-[9px] mono text-indigo-300">#${s.id}</div>
          </div>
        `;
      }).join('');
    },

    highlightThumbnail() {
      this.filteredList.forEach((_, idx) => {
        const thumb = document.getElementById(`slide-thumb-${idx}`);
        if (thumb) {
          thumb.classList.toggle('active', idx === this.currentIndex);
          if (idx === this.currentIndex) {
            thumb.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
          }
        }
      });
    },

    bindKeyboard() {
      this.keyHandler = (e) => {
        if (!this.isOpen) return;
        if (e.key === ' ' || e.code === 'Space') {
          e.preventDefault();
          this.togglePlay();
        } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
          e.preventDefault();
          this.next();
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          this.prev();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          this.close();
        }
      };
      window.addEventListener('keydown', this.keyHandler);
    },

    unbindKeyboard() {
      if (this.keyHandler) {
        window.removeEventListener('keydown', this.keyHandler);
        this.keyHandler = null;
      }
    }
  };

  // ==========================================================================
  // 14. HELPER UTILITIES
  // ==========================================================================

  function getTodayDateString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function getInitials(name) {
    if (!name) return 'ST';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function downloadFile(content, fileName, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 100);
  }

  // ==========================================================================
  // 15. PUBLIC API
  // ==========================================================================

  window.PRIDE = {
    State,
    ScannerEngine,
    AttendanceEngine,
    StudentDirectory,
    BehaviorTracker,
    UI,
    AudioEngine,
    HapticEngine,
    Storage,
    FirestoreBridge,
    BarcodeSlideshow,

    openBarcodeSlideshow: (id) => BarcodeSlideshow.open(id),
    closeBarcodeSlideshow: () => BarcodeSlideshow.close(),
    checkoutStudent: (id) => AttendanceEngine.checkoutStudent(id),
    undoCheckin: (id) => AttendanceEngine.undoCheckin(id),
    openBehaviorModal: (id) => UI.openBehaviorModal(id),
    closeBehaviorModal: () => UI.closeBehaviorModal(),
    submitBehaviorLog: () => UI.submitBehaviorLog(),
    openRestrictModal: (id) => UI.openRestrictModal(id),
    closeRestrictModal: () => UI.closeRestrictModal(),
    submitRestriction: () => UI.submitRestriction(),
    liftRestriction: (id) => StudentDirectory.liftRestriction(id),
    denyRestrictedEntry: () => UI.denyRestrictedEntry(),
    overrideRestrictedEntry: () => UI.overrideRestrictedEntry(),
    closeRestrictionAlertModal: () => UI.closeRestrictionAlertModal(),
    openUnregisteredStudentModal: (id) => UI.openUnregisteredStudentModal(id),
    closeUnregisteredStudentModal: () => UI.closeUnregisteredStudentModal(),
    submitUnregisteredStudent: () => UI.submitUnregisteredStudent(),
    openAddStudentModal: () => UI.openAddStudentModal(),
    closeAddStudentModal: () => UI.closeAddStudentModal(),
    submitAddStudent: () => UI.submitAddStudent(),
    exportAttendanceCsv: () => UI.exportAttendanceCsv(),
    exportDisciplineReportCsv: () => UI.exportDisciplineReportCsv(),
    resetToDemoData: () => Storage.resetToDemoData(),
    printBadges: () => window.print()
  };

  document.addEventListener('DOMContentLoaded', () => {
    Storage.load();
    SyncEngine.init();
    UI.init();
    setTimeout(() => {
      FirestoreBridge.init();
    }, 200);
  });

})();

