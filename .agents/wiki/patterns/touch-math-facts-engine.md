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

## 3. Name-Only Identity & Personal Bests Engine
To foster growth mindset without social comparison or leaderboard anxiety, track individual personal bests and career milestones in client-side storage partitioned by player name:
```javascript
function getRecordsStorageKey(name = state.playerName) {
  const safe = (name || 'player').trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
  return `math_facts_bests_${safe}`;
}

function recordGameRun(run) {
  const data = getPersonalBests(run.name);
  const modeData = data.modes[run.mode] || {};
  const isNewHighScore = run.score > (modeData.highScore || 0);

  if (isNewHighScore) {
    modeData.highScore = run.score;
    modeData.date = new Date().toLocaleDateString();
  }
  // Career accumulation:
  data.totalFactsSolved = (data.totalFactsSolved || 0) + run.factsSolved;
  data.gamesPlayed = (data.gamesPlayed || 0) + 1;
  data.allTimeBestStreak = Math.max(data.allTimeBestStreak || 0, run.bestStreak);
  
  savePersonalBests(data, run.name);
  return { isNewHighScore, prevHighScore: modeData.highScore };
}
```
### Pedagogical Benefits:
- **Zero Social Anxiety**: Students focus on beating their own previous scores rather than comparing themselves to faster peers.
- **Immediate Formative Feedback**: On setting a personal best, trigger celebratory confetti and a golden fanfare banner (`🌟 NEW PERSONAL BEST! +250 pts`).
- **100% Offline & Private**: No authentication or external network requests required; zero data leakage.

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

## 6. Mario Kart Course Starring Badge System (Table Mastery)
Inspired by Mario Kart's 3-star cup ranking system (`★`, `★★`, `★★★`), individual course/table focus drills reward progressive mastery that permanently records on the player's profile:
- **Mastery Rubric (`calculateTableStars`)**:
  - **★★★ (3 Stars - Grand Master)**: 100% accuracy with >= 8 facts solved and avg speed <= 2.6s (or score >= 1000), OR 95%+ accuracy with >= 16 facts solved and avg speed <= 2.0s, OR 100% accuracy with >= 12 facts solved.
  - **★★ (2 Stars - Proficient)**: >= 90% accuracy with >= 6 facts solved and avg speed <= 3.4s (or score >= 650), OR 100% accuracy with >= 5 facts solved.
  - **★ (1 Star - Competent)**: >= 80% accuracy with >= 4 facts solved, or score >= 350.
- **Monotonic Progression**: Once earned, star ratings never downgrade (`newStars = Math.max(prevStars, earnedStars)`). Upgrades trigger celebratory confetti, fanfare, and a results card banner (`⭐ NEW MASTERY RANK: 7s Table ★★★`).
- **Focus Pill Badges**: Each table button (`2s` through `12s`) renders its current 3-star badge directly below the label (`.pill-stars`), with earned stars in gold (`#fbbf24`) and unearned in dim white (`rgba(255,255,255,0.2)`). A `.has-3-stars` class confers a golden aura border.
- **Overall Mastery Counter**: A header badge tracks total course stars (e.g., `⭐ 18 / 33 Stars`), changing to `🏆 33 / 33 ALL MASTERED!` when every table achieves 3 stars.
- **Mastery Grid in Personal Bests**: The Personal Bests modal renders a full 11-table mastery matrix with perfect badges and star icons.


