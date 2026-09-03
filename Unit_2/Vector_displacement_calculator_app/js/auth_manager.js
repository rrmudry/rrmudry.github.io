/**
 * AuthManager - Google Sign-In & Gradebook Sync for Vector Displacement Calculator
 * Restricts access to Orange USD accounts and submits highest score to Firestore.
 */
const ASSIGNMENT_ID = "Fantasy_Map_Vector_Calculations";

class AuthManager {
  constructor() {
    this.currentUser = null;
    this.studentId = null;
    this.studentName = "Adventurer";
    this.highScore = 0;

    this.initAuth();
  }

  initAuth() {
    if (typeof firebase === 'undefined' || !firebase.auth) {
      console.warn("Firebase Auth not loaded.");
      return;
    }

    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        const email = (user.email || "").toLowerCase();
        // Domain enforcement: @orangeusd.org or teacher account
        if (email.endsWith('@orangeusd.org') || email === 'ryan.mudry@gmail.com') {
          this.currentUser = user;
          this.studentId = email.split('@')[0];
          this.studentName = user.displayName || this.studentId;
          this.updateUserUI(true);
          this.loadStudentHighScore();

          // Calibrate map coordinates seed specifically for this student
          if (window.vectorMap) {
            window.vectorMap.setUserSeedFromId(this.studentId);
            if (window.vectorQuestEngine) {
              window.vectorQuestEngine.renderStep(window.vectorQuestEngine.currentStep);
            }
          }
        } else {
          alert('Access restricted. Please sign in using your official school @orangeusd.org account.');
          firebase.auth().signOut();
        }
      } else {
        this.currentUser = null;
        this.studentId = null;
        this.updateUserUI(false);
      }
    });

    const loginBtn = document.getElementById('btn-google-login');
    if (loginBtn) {
      loginBtn.addEventListener('click', () => this.signIn());
    }
  }

  signIn() {
    if (typeof firebase === 'undefined') return;
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ hd: 'orangeusd.org' });
    firebase.auth().signInWithPopup(provider).catch((err) => {
      console.error("Sign-in popup error:", err);
    });
  }

  signOut() {
    if (typeof firebase !== 'undefined') {
      firebase.auth().signOut();
    }
  }

  updateUserUI(isSignedIn) {
    const container = document.getElementById('auth-user-status');
    if (!container) return;

    if (isSignedIn) {
      container.innerHTML = `
        <div class="flex items-center gap-2">
          <div class="hidden sm:flex flex-col text-right">
            <span class="text-xs font-bold text-white">${this.studentName}</span>
            <span class="text-[10px] text-amber-400 font-mono">ID: ${this.studentId}</span>
          </div>
          <button id="btn-user-signout" title="Sign Out" class="p-1.5 rounded-lg bg-white/10 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-white/10 text-xs transition-colors">
            🚪
          </button>
        </div>
      `;
      const outBtn = document.getElementById('btn-user-signout');
      if (outBtn) outBtn.onclick = () => this.signOut();
    } else {
      container.innerHTML = `
        <button id="btn-google-login" class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-semibold text-slate-200 transition-all active:scale-95">
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" class="w-4 h-4" alt="Google">
          <span>Sign In</span>
        </button>
      `;
      const inBtn = document.getElementById('btn-google-login');
      if (inBtn) inBtn.onclick = () => this.signIn();
    }
  }

  async loadStudentHighScore() {
    if (!this.studentId || typeof firebase === 'undefined') return;
    try {
      const db = firebase.firestore();
      const scoreRef = db.collection('student_results')
                         .doc(ASSIGNMENT_ID)
                         .collection('students')
                         .doc(this.studentId);
      const doc = await scoreRef.get();
      if (doc.exists) {
        this.highScore = doc.data().score || 0;
        const elHigh = document.getElementById('badge-high-score');
        if (elHigh) elHigh.innerText = `${this.highScore}%`;
      }
    } catch (e) {
      console.warn("Could not load high score:", e);
    }
  }

  async submitScore(percentageScore, questReport = {}) {
    const rawScore = Math.max(0, Math.min(100, Math.round(percentageScore)));
    const elHigh = document.getElementById('badge-high-score');

    if (!this.currentUser || !this.studentId) {
      if (rawScore > this.highScore) {
        this.highScore = rawScore;
        if (elHigh) elHigh.innerText = `${rawScore}%`;
      }
      return { success: true, isGuest: true, score: rawScore };
    }

    try {
      const db = firebase.firestore();
      const scoreRef = db.collection('student_results')
                         .doc(ASSIGNMENT_ID)
                         .collection('students')
                         .doc(this.studentId);

      const doc = await scoreRef.get();
      const prevScore = doc.exists ? (doc.data().score || 0) : 0;

      // Ensure top-level parent doc exists so all admin tools discover this assignment
      const parentRef = db.collection('student_results').doc(ASSIGNMENT_ID);
      parentRef.set({
        assignment_name: "Fantasy Map: Vector Calculations",
        is_global_locked: false,
        updated_at: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true }).catch(e => console.warn("Parent doc set error:", e));

      if (!doc.exists || rawScore > prevScore) {
        await scoreRef.set({
          student_id: this.studentId,
          student_name: this.studentName,
          score: rawScore,
          assignment_id: ASSIGNMENT_ID,
          assignment_name: "Fantasy Map: Vector Calculations",
          quest_data: questReport,
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        this.highScore = rawScore;
        if (elHigh) elHigh.innerText = `${rawScore}%`;
        return { success: true, newHighScore: true, score: rawScore };
      } else {
        return { success: true, newHighScore: false, score: prevScore };
      }
    } catch (err) {
      console.error("Score submission error:", err);
      return { success: false, error: err.message, score: rawScore };
    }
  }
}

window.authManager = new AuthManager();
