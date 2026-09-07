/**
 * Constant Speed Presentation Engine
 * Full compliance with No-LaTeX policy and NGSS HS-PS2-1.
 * Optimized for 25-foot classroom TV projection and dual-mode instruction.
 */

// Presenter Notes Database
const PRESENTER_NOTES = [
  {
    slide: 1,
    title: "Slide 1: Title & Lab Connection",
    cue: "Pacing: 2-3 mins",
    talkingPoints: [
      "Welcome the class back from Labor Day! Acknowledge that today begins a focused 4-day mastery week on motion.",
      "Directly connect back to Friday's Wind-Up Toy Speed Lab: 'You all measured times over 20.0 cm. Today we unpack what that math actually means.'",
      "Set the cognitive anchor: Speed is a rate that connects distance and time."
    ],
    question: "Ask: 'If Toy A took 4 seconds to travel 20 cm, and Toy B took 8 seconds, which one was faster? Why?'"
  },
  {
    slide: 2,
    title: "Slide 2: What is Speed?",
    cue: "Pacing: 3-4 mins",
    talkingPoints: [
      "Define Scalar: only magnitude (amount), no direction needed.",
      "Emphasize the definition of rate: 'Distance traveled per 1 second of clock time.'",
      "Explain constant speed: every tick of the stopwatch produces an identical step along the ruler."
    ],
    question: "Ask: 'Can an object have a high speed but zero net displacement? Think back to our Fantasy Map quest!'"
  },
  {
    slide: 3,
    title: "Slide 3: Formula 1: Calculating Speed",
    cue: "Pacing: 3-4 mins",
    talkingPoints: [
      "Introduce the core equation: v = d / t.",
      "Explicitly model the units: dividing meters by seconds gives meters/second (m/s).",
      "Highlight the difference between cm/s (tabletop toys) and m/s (track & field, highway vehicles)."
    ],
    question: "Ask: 'If you double the time an object takes to cover the same distance, what happens to its speed? (Cuts in half).'"
  },
  {
    slide: 4,
    title: "Slide 4: The Formula Triangle",
    cue: "Pacing: 4-5 mins",
    talkingPoints: [
      "Show how the triangle eliminates algebra panic for students.",
      "Emphasize: Distance is ALWAYS on top because it is the numerator. Speed and time share the bottom basement.",
      "Model the 'Thumb Rule': Put your thumb over the unknown letter, and the remaining letters tell you whether to divide or multiply."
    ],
    question: "Have students draw the triangle in their notebooks right now with highlighters: blue for d, purple for v, green for t."
  },
  {
    slide: 5,
    title: "Slide 5: Solving for Distance",
    cue: "Pacing: 4-5 mins",
    talkingPoints: [
      "Cover 'd' on the triangle: v and t are side-by-side, which means MULTIPLY: d = v · t.",
      "Walk through the worked example step-by-step: (4.5 cm/s) · (6.0 s) = 27.0 cm.",
      "Show how the unit 'seconds' in the denominator cancels with the 'seconds' multiplied."
    ],
    question: "Quick mental math: 'If you walk 2 m/s for 10 seconds, how far did you go? (20 meters).'"
  },
  {
    slide: 6,
    title: "Slide 6: Solving for Time",
    cue: "Pacing: 4-5 mins",
    talkingPoints: [
      "Cover 't' on the triangle: d is on top and v is on the bottom, which means DIVIDE: t = d / v.",
      "Walk through the decimal division: 3.0 m / 0.25 m/s = 12 seconds.",
      "Help students make sense of dividing by a decimal: dividing by 0.25 is multiplying by 4."
    ],
    question: "Ask: 'If you have to drive 120 miles at 60 mph, how many hours does it take? (120 / 60 = 2 hours).'"
  },
  {
    slide: 7,
    title: "Slide 7: The GUESS Method Blueprint",
    cue: "Pacing: 4-5 mins",
    talkingPoints: [
      "Introduce the GUESS framework as an equity tool: it ensures students never stare at a blank paper during exams.",
      "G: Given (hunt for numbers and copy their units).",
      "U: Unknown (what letter is the question asking for?).",
      "E: Equation (grab the formula from the triangle).",
      "S: Substitute (put numbers in place of letters).",
      "S: Solve with Units (calculate and attach units)."
    ],
    question: "Ask: 'Why do points get deducted if you only write a number without a unit?' (Because '25' could mean meters, seconds, or elephants!)."
  },
  {
    slide: 8,
    title: "Slide 8: Real-World Constant Speed",
    cue: "Pacing: 3-4 mins",
    talkingPoints: [
      "Connect physics to the macroscopic world: cheetah sprints, acoustic pressure waves, and space exploration.",
      "Point out Voyager 1: In deep space with no friction, an object stays in constant motion at 17,000 m/s with ZERO fuel burned (previewing Newton's First Law!)."
    ],
    question: "Ask: 'Why can't a cheetah maintain 30 m/s for 10 minutes like a car can? (Biological fatigue / heat accumulation).'"
  },
  {
    slide: 9,
    title: "Slide 9: Audience Check / Whiteboard Duel",
    cue: "Pacing: 4-5 mins",
    talkingPoints: [
      "Have all students grab dry-erase boards or signal A, B, C, or D with their fingers on the count of three.",
      "Scenario: 3 m/s for 15 seconds. d = v · t = 45 meters.",
      "Tap the cards on screen to reveal the diagnosis for each answer."
    ],
    question: "Reveal answer B (45 meters) and celebrate class accuracy!"
  },
  {
    slide: 10,
    title: "Slide 10: Summary & Next Steps",
    cue: "Pacing: 2-3 mins",
    talkingPoints: [
      "Summarize the 3-part formula triad.",
      "Instruct students to open Chromebooks and launch the Speed, Distance & Time Studio.",
      "Have students complete Tier 1 and Tier 2 challenges to earn their Kinematic Mastery Certificate."
    ],
    question: "Prompt students to open Chromebooks and begin independent practice."
  }
];

// Audio Synthesizer (Web Audio API)
const DeckAudio = {
  ctx: null,
  enabled: true,

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    }
  },

  playClick() {
    if (!this.enabled) return;
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(550, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(280, this.ctx.currentTime + 0.04);
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.04);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.04);
  },

  playWhoosh() {
    if (!this.enabled) return;
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(260, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, this.ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  },

  playChime() {
    if (!this.enabled) return;
    this.init();
    const now = this.ctx.currentTime;
    [587.33, 880, 1174.66].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);
      gain.gain.setValueAtTime(0.15, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.06 + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.25);
    });
  }
};

// Deck Controller State
const DeckState = {
  currentSlide: 1,
  totalSlides: 10,
  isStudyMode: false,
  isTvMode: false,
  fontScale: 1.0,
  notesCollapsed: true
};

function goToSlide(slideNum) {
  if (slideNum < 1 || slideNum > DeckState.totalSlides) return;
  DeckState.currentSlide = slideNum;

  // Update slide classes
  document.querySelectorAll('.slide').forEach(s => {
    const num = parseInt(s.dataset.slide);
    s.classList.toggle('active', num === slideNum);
  });

  // Update Indicator & Progress
  document.getElementById('slideIndicator').textContent = `${slideNum} / ${DeckState.totalSlides}`;
  const pct = (slideNum / DeckState.totalSlides) * 100;
  document.getElementById('progressBar').style.width = `${pct}%`;

  // Update Presenter Notes
  updatePresenterNotes(slideNum);

  DeckAudio.playWhoosh();
}

function nextSlide() {
  if (DeckState.currentSlide < DeckState.totalSlides) {
    goToSlide(DeckState.currentSlide + 1);
  }
}

function prevSlide() {
  if (DeckState.currentSlide > 1) {
    goToSlide(DeckState.currentSlide - 1);
  }
}

function updatePresenterNotes(slideNum) {
  const note = PRESENTER_NOTES.find(n => n.slide === slideNum);
  if (!note) return;

  document.getElementById('notesSlideTitle').textContent = note.title;
  const body = document.getElementById('notesBody');
  body.innerHTML = `
    <div style="color: var(--accent-cyan); font-weight: bold; margin-bottom: 0.35rem; font-size: 1.1rem;">⏱️ ${note.cue}</div>
    <div style="margin-bottom: 0.65rem;">
      <strong style="color: #ffffff;">Teacher Talking Points:</strong>
      <ul>${note.talkingPoints.map(tp => `<li>${tp}</li>`).join('')}</ul>
    </div>
    <div style="background: rgba(0,242,254,0.1); padding: 0.75rem 1rem; border-radius: 8px; border-left: 4px solid var(--accent-cyan); margin-top: 0.5rem;">
      <strong style="color: var(--accent-cyan);">Suggested Formative Check:</strong> ${note.question}
    </div>
  `;
}

function toggleNotesDrawer() {
  const drawer = document.getElementById('notesDrawer');
  const icon = document.getElementById('notesToggleIcon');
  DeckState.notesCollapsed = !DeckState.notesCollapsed;
  drawer.classList.toggle('collapsed', DeckState.notesCollapsed);
  icon.textContent = DeckState.notesCollapsed ? '▲ Expand Notes' : '▼ Collapse Notes';
  DeckAudio.playClick();
}

function toggleStudyMode() {
  DeckState.isStudyMode = !DeckState.isStudyMode;
  document.body.classList.toggle('study-mode', DeckState.isStudyMode);

  const icon = document.getElementById('studyIcon');
  const text = document.getElementById('studyText');
  const btn = document.getElementById('btnStudyMode');

  if (icon) icon.textContent = DeckState.isStudyMode ? '📽️' : '📖';
  if (text) text.textContent = DeckState.isStudyMode ? 'Slide Mode' : 'Study Mode';
  if (btn) {
    btn.classList.toggle('active-toggle', DeckState.isStudyMode);
    btn.title = DeckState.isStudyMode ? 'Return to Slide Presentation (Hotkey: Esc or S)' : 'Toggle Scrollable Study Mode (Hotkey: S)';
  }

  // When returning to slide mode, smooth scroll back to current active slide
  if (!DeckState.isStudyMode) {
    const activeSlide = document.querySelector(`.slide[data-slide="${DeckState.currentSlide}"]`);
    if (activeSlide) {
      activeSlide.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  DeckAudio.playClick();
}

// 25-Foot Classroom TV Mode
function toggleTvMode() {
  DeckState.isTvMode = !DeckState.isTvMode;
  document.body.classList.toggle('tv-mode', DeckState.isTvMode);
  const btn = document.getElementById('btnTvMode');
  if (btn) btn.classList.toggle('active-toggle', DeckState.isTvMode);
  const icon = document.getElementById('tvIcon');
  if (icon) icon.textContent = DeckState.isTvMode ? '📺✓' : '📺';

  try {
    localStorage.setItem('presentation_tv_mode', DeckState.isTvMode ? '1' : '0');
  } catch (e) {}

  DeckAudio.playClick();
}

// Text Scale Zoom Controls
function adjustFontSize(delta) {
  DeckState.fontScale = Math.min(1.8, Math.max(0.85, DeckState.fontScale + delta));
  document.documentElement.style.setProperty('--font-scale', DeckState.fontScale.toFixed(2));
  DeckAudio.playClick();
}

function resetFontSize() {
  DeckState.fontScale = 1.0;
  document.documentElement.style.setProperty('--font-scale', '1.0');
  DeckAudio.playClick();
}

// Fullscreen API
function toggleFullscreen() {
  const fsIcon = document.getElementById('fsIcon');
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().then(() => {
      if (fsIcon) fsIcon.textContent = '✕';
    }).catch(err => {
      console.warn('Fullscreen error:', err);
    });
  } else {
    document.exitFullscreen().then(() => {
      if (fsIcon) fsIcon.textContent = '⛶';
    }).catch(err => {
      console.warn('Exit fullscreen error:', err);
    });
  }
}

// Interactive Audience Check
function revealVote(cardEl, isCorrect, explanation) {
  const expBox = document.getElementById('voteExplanation');
  document.querySelectorAll('.vote-card').forEach(c => {
    c.classList.remove('revealed-correct', 'revealed-wrong');
  });

  if (isCorrect) {
    cardEl.classList.add('revealed-correct');
    expBox.style.display = 'block';
    expBox.innerHTML = `🎉 <strong>Correct!</strong> ${explanation}`;
    DeckAudio.playChime();
  } else {
    cardEl.classList.add('revealed-wrong');
    expBox.style.display = 'block';
    expBox.innerHTML = `❌ <strong>Try again!</strong> ${explanation}`;
    DeckAudio.playClick();
  }
}

// Global Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  // Navigation buttons
  document.getElementById('btnNext').addEventListener('click', nextSlide);
  document.getElementById('btnPrev').addEventListener('click', prevSlide);
  document.getElementById('btnStudyMode').addEventListener('click', toggleStudyMode);

  // Floating Study Mode exit button
  const exitBtnFloating = document.getElementById('btnExitStudyFloating');
  if (exitBtnFloating) {
    exitBtnFloating.addEventListener('click', toggleStudyMode);
  }

  // Classroom TV & Display controls
  document.getElementById('btnTvMode').addEventListener('click', toggleTvMode);
  document.getElementById('btnFontDown').addEventListener('click', () => adjustFontSize(-0.08));
  document.getElementById('btnFontUp').addEventListener('click', () => adjustFontSize(0.08));
  document.getElementById('btnFullscreen').addEventListener('click', toggleFullscreen);

  document.addEventListener('fullscreenchange', () => {
    const fsIcon = document.getElementById('fsIcon');
    if (fsIcon) {
      fsIcon.textContent = document.fullscreenElement ? '✕' : '⛶';
    }
  });

  // Sound toggle
  document.getElementById('btnSound').addEventListener('click', () => {
    DeckAudio.enabled = !DeckAudio.enabled;
    document.getElementById('soundIcon').textContent = DeckAudio.enabled ? '🔊' : '🔇';
    if (DeckAudio.enabled) DeckAudio.playClick();
  });

  // Keyboard navigation & shortcuts
  document.addEventListener('keydown', (e) => {
    // If in Study Mode, pressing Escape or S exits study mode
    if (DeckState.isStudyMode) {
      if (e.key === 'Escape' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        toggleStudyMode();
      }
      return;
    }

    // Toggle Study Mode with S key
    if (e.key === 's' || e.key === 'S') {
      e.preventDefault();
      toggleStudyMode();
      return;
    }

    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
      e.preventDefault();
      nextSlide();
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      e.preventDefault();
      prevSlide();
    } else if (e.key === 'Home') {
      e.preventDefault();
      goToSlide(1);
    } else if (e.key === 'End') {
      e.preventDefault();
      goToSlide(DeckState.totalSlides);
    } else if (e.key === 't' || e.key === 'T') {
      toggleTvMode();
    } else if (e.key === 'f' || e.key === 'F') {
      toggleFullscreen();
    } else if (e.key === '+' || e.key === '=') {
      adjustFontSize(0.08);
    } else if (e.key === '-' || e.key === '_') {
      adjustFontSize(-0.08);
    } else if (e.key === '0') {
      resetFontSize();
    }
  });

  // Restore saved TV mode preference if set
  try {
    if (localStorage.getItem('presentation_tv_mode') === '1') {
      toggleTvMode();
    }
  } catch (e) {}

  // Initial load
  goToSlide(1);
});
