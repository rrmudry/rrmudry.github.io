# Touchscreen Math Facts Engine & Open Leaderboard Pattern

## Overview
This pattern establishes architecture for touchscreen-compatible, high-cadence math facts games (such as `math-facts/index.html`) targeting elementary and middle school students who do not use school Google accounts, requiring rapid response times, streak rewards, and open Firestore leaderboard synchronization.

## 1. Zero-Lag Auto-Advance Virtual Numpad
For maximum speed and automaticity, the player should not be forced to tap "Enter" or reach across the screen after typing the correct answer:
```javascript
function handleKeypadInput(key) {
  if (key === 'backspace') {
    state.enteredDigits = state.enteredDigits.slice(0, -1);
    updateDisplay();
    return;
  }
  if (key === 'enter') {
    if (state.enteredDigits.length > 0) submitAnswer(state.enteredDigits);
    return;
  }
  
  state.enteredDigits += key;
  updateDisplay();

  const targetAnswerStr = String(state.currentQuestion.answer);
  // Auto-advance instant evaluation:
  if (state.enteredDigits === targetAnswerStr) {
    submitAnswer(state.enteredDigits); // 0ms transition!
  } else if (state.enteredDigits.length >= targetAnswerStr.length) {
    if (targetAnswerStr.length === 1 || state.enteredDigits.length > targetAnswerStr.length) {
      submitAnswer(state.enteredDigits);
    }
  }
}
```

### Critical Touch Screen CSS Rules:
- `touch-action: manipulation;` prevents the browser from delaying clicks by 300ms waiting for double-tap zoom gestures.
- `user-select: none; -webkit-user-select: none;` prevents accidental text selection on rapid button tapping.
- Viewport meta tag: `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">`

## 2. Speed & Consistency Scoring Engine
Rewarding both rapid mental recall and unbroken streaks:
- **Base Score**: 100 points per correct answer.
- **Speed Bonus Thresholds**:
  - Response time < 1.2s: `+200 pts` (⚡ LIGHTNING RECALL)
  - Response time < 2.0s: `+100 pts` (🚀 FAST)
  - Response time < 3.0s: `+50 pts` (👍 QUICK)
- **Streak Multipliers**:
  - 5–9 streak: `1.5×` (Flame active)
  - 10–19 streak: `2.0×` (Sparks active)
  - 20–29 streak: `3.0×` (Supercharged)
  - 30+ streak: `4.0×` (Max Combo)
- **Consistency Bonuses (End of Round)**:
  - 100% Accuracy: `+1,000 pts`
  - 95%+ Accuracy: `+500 pts`
  - Longest streak: `bestStreak * 50 pts`

## 3. Name-Only Identity & Cloud Firestore Synchronization
When students do not sign in with Google accounts, use a name/nickname + avatar selector with dual storage (localStorage + Cloud Firestore):
```javascript
const docRef = db.collection('student_results')
                 .doc('math_facts_leaderboard')
                 .collection('students')
                 .doc(sanitizedDocId);

const snap = await docRef.get();
if (!snap.exists || record.score > (snap.data().score || 0)) {
  await docRef.set({
    name: record.name,
    avatar: record.avatar,
    mode: record.mode,
    score: record.score,
    factsSolved: record.factsSolved,
    accuracy: record.accuracy,
    avgSpeedSec: record.avgSpeedSec,
    bestStreak: record.bestStreak,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
}
```
*Note on Firestore Rules*: Unauthenticated reads and writes are permitted under `student_results/{assignmentId}/students/{studentId}` as long as no document exists at `assessments/{assignmentId}`.

## 4. Web Audio Zero-Latency Synthesizer
Avoid external audio files (mp3/wav) that can fail to load, suffer from mobile latency, or cause network errors:
- Use standard `AudioContext` oscillators (`sine`, `triangle`, `sawtooth`).
- Modulate the pitch of the correct chime with current streak count (`baseFreq * (1 + min(streak, 20) * 0.04)`) to create an exhilarating crescendo.
- Provide a persistent mute button (`localStorage.getItem('math_facts_sound')`).

## 5. Mobile-Optimized Zero-Scroll Phone Format
Mobile viewports (e.g. 375×667 iPhone SE to 430×932 iPhone Pro Max) introduce browser navigation bars that consume vertical space. For high-speed sprint games:
- **Zero-Scroll Container**: Set `body.phone-mode { height: 100dvh; overflow: hidden; }` and `main { height: calc(100dvh - 48px); }`.
- **Thumb-Ergonomic Virtual Numpad**: Size buttons to `clamp(46px, 8vh, 58px)` and set `touch-action: manipulation;` on all keys.
- **Top HUD Condensation**: Reduce HUD padding and hide non-essential badge chips to keep card and numpad entirely visible on one screen without scrolling (`window.scrollY === 0`).
- **Auto-Detection with Manual Override**: Automatically detect mobile viewports via `window.innerWidth <= 640 || ('ontouchstart' in window && window.innerWidth <= 768)`, persist user preference in `localStorage.getItem('math_facts_phone_mode')`, and offer prominent toggle triggers in both the header (`#phone-mode-btn`) and top of the welcome card (`#phone-format-toggle-chip`).

