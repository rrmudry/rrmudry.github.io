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
  isHandoutOpen: false,
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

  // Initialize triangle on Slide 4 (starts with no thumbs up)
  if (slideNum === 4) {
    resetTriangleState();
  }

  // Initialize scale spotlight on Slide 8
  if (slideNum === 8) {
    selectScaleExample(currentScaleKey || 'cheetah');
  }

  // Reset Audience Check on Slide 9
  if (slideNum === 9) {
    document.querySelectorAll('.vote-card').forEach(c => {
      c.classList.remove('revealed-correct', 'revealed-wrong');
    });
    const expBox = document.getElementById('voteExplanation');
    if (expBox) {
      expBox.style.display = 'none';
      expBox.innerHTML = '';
    }
  }

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

// Student Guided Notes Handout Modal
function openHandoutModal() {
  const modal = document.getElementById('handoutModal');
  if (!modal) return;
  modal.style.display = 'flex';
  DeckState.isHandoutOpen = true;
  DeckAudio.playClick();
}

function closeHandoutModal() {
  const modal = document.getElementById('handoutModal');
  if (!modal) return;
  modal.style.display = 'none';
  DeckState.isHandoutOpen = false;
  DeckAudio.playClick();
}

function toggleHandoutModal() {
  if (DeckState.isHandoutOpen) {
    closeHandoutModal();
  } else {
    openHandoutModal();
  }
}

// Reset Formula Triangle to neutral state (no thumbs up, clean prompt)
function resetTriangleState() {
  const vars = ['d', 'v', 't'];
  vars.forEach(v => {
    const sector = document.getElementById(`sector-${v}`);
    if (sector) {
      sector.classList.remove('active-covered');
    }
    const btn = document.getElementById(`btnCover-${v}`);
    if (btn) {
      btn.classList.remove('active');
    }
  });

  const targetName = document.getElementById('triTargetName');
  const formulaBox = document.getElementById('triFormulaDisplay');
  const ruleText = document.getElementById('triRuleText');
  const heroBox = document.getElementById('triangleFormulaBox');

  if (targetName) {
    targetName.textContent = 'Choose Variable (d, v, or t)';
    targetName.style.color = 'var(--text-muted)';
  }
  if (formulaBox) {
    formulaBox.innerHTML = `<span style="font-size: clamp(1.9rem, 2.6vw, 3rem); font-weight: 600; opacity: 0.85;">👆 Click a variable to cover</span>`;
    formulaBox.style.color = 'var(--text-muted)';
  }
  if (ruleText) {
    ruleText.innerHTML = `Cover whichever variable you want to solve for. The position of the remaining two reveals the formula!`;
  }
  if (heroBox) {
    heroBox.style.borderColor = 'var(--border-color)';
  }
}

// Interactive Formula Triangle Selection (Slide 4)
function selectTriangleVar(variable) {
  const vars = ['d', 'v', 't'];
  if (!vars.includes(variable)) return;

  const currentSector = document.getElementById(`sector-${variable}`);
  const isAlreadyActive = currentSector && currentSector.classList.contains('active-covered');

  // If clicked again, deselect back to neutral (no thumbs up)
  if (isAlreadyActive) {
    resetTriangleState();
    DeckAudio.playClick();
    return;
  }

  // Update SVG sectors
  vars.forEach(v => {
    const sector = document.getElementById(`sector-${v}`);
    if (sector) {
      sector.classList.toggle('active-covered', v === variable);
    }
    const btn = document.getElementById(`btnCover-${v}`);
    if (btn) {
      btn.classList.toggle('active', v === variable);
    }
  });

  const targetName = document.getElementById('triTargetName');
  const formulaBox = document.getElementById('triFormulaDisplay');
  const ruleText = document.getElementById('triRuleText');
  const heroBox = document.getElementById('triangleFormulaBox');

  if (variable === 'd') {
    if (targetName) {
      targetName.textContent = 'Distance (d)';
      targetName.style.color = 'var(--accent-cyan)';
    }
    if (formulaBox) {
      formulaBox.innerHTML = `<span>d = v · t</span>`;
      formulaBox.style.color = 'var(--accent-cyan)';
    }
    if (ruleText) {
      ruleText.innerHTML = `Speed (<strong style="color: #c084fc;">v</strong>) and Time (<strong style="color: #10b981;">t</strong>) sit side-by-side on the bottom ➔ <strong>MULTIPLY them!</strong>`;
    }
    if (heroBox) {
      heroBox.style.borderColor = 'rgba(0, 242, 254, 0.4)';
    }
  } else if (variable === 'v') {
    if (targetName) {
      targetName.textContent = 'Speed (v)';
      targetName.style.color = 'var(--accent-purple)';
    }
    if (formulaBox) {
      formulaBox.innerHTML = `<span>v = </span><span class="math-frac"><span class="num">d</span><span class="den">t</span></span>`;
      formulaBox.style.color = 'var(--accent-purple)';
    }
    if (ruleText) {
      ruleText.innerHTML = `Distance (<strong style="color: #00f2fe;">d</strong>) is on top and Time (<strong style="color: #10b981;">t</strong>) is on the bottom ➔ <strong>DIVIDE them!</strong>`;
    }
    if (heroBox) {
      heroBox.style.borderColor = 'rgba(192, 132, 252, 0.4)';
    }
  } else if (variable === 't') {
    if (targetName) {
      targetName.textContent = 'Time (t)';
      targetName.style.color = 'var(--accent-emerald)';
    }
    if (formulaBox) {
      formulaBox.innerHTML = `<span>t = </span><span class="math-frac"><span class="num">d</span><span class="den">v</span></span>`;
      formulaBox.style.color = 'var(--accent-emerald)';
    }
    if (ruleText) {
      ruleText.innerHTML = `Distance (<strong style="color: #00f2fe;">d</strong>) is on top and Speed (<strong style="color: #c084fc;">v</strong>) is on the bottom ➔ <strong>DIVIDE them!</strong>`;
    }
    if (heroBox) {
      heroBox.style.borderColor = 'rgba(16, 185, 129, 0.4)';
    }
  }

  DeckAudio.playChime();
}

// Real-World Constant Speed Scales Spotlight (Slide 8)
const SCALE_EXAMPLES = {
  cheetah: {
    id: 'cheetah',
    index: 1,
    icon: '🐆',
    scaleTag: 'Terrestrial Biology • Land Animal Speed Limit',
    accentColor: 'var(--accent-cyan)',
    borderColor: 'rgba(0, 242, 254, 0.45)',
    title: 'The Cheetah in Full Sprint',
    speedMain: '30 m/s',
    speedSub: '≈ 67 mph • 108 km/h',
    scenario: 'Sprinting across the open savanna during the final ambush chase at steady top speed.',
    timeGiven: '4 SECONDS',
    calcSubstitution: 'd = (30 m/s) · (4 s)',
    calcResult: '120 METERS',
    contextNote: '🏈 <strong>Scale Perspective:</strong> That is longer than an entire 100-yard American football field covered in just 4 heartbeats!'
  },
  sound: {
    id: 'sound',
    index: 2,
    icon: '⚡',
    scaleTag: 'Mechanical Wave Physics • Sea-Level Atmosphere',
    accentColor: 'var(--accent-emerald)',
    borderColor: 'rgba(16, 185, 129, 0.45)',
    title: 'Sound Waves in Room Air (20°C)',
    speedMain: '340 m/s',
    speedSub: '≈ 761 mph • Mach 1.0',
    scenario: 'Sound vibrations rippling through room-temperature atmospheric air at sea level.',
    timeGiven: '3 SECONDS',
    calcSubstitution: 'd = (340 m/s) · (3 s)',
    calcResult: '1,020 METERS (≈ 1 km)',
    contextNote: '🌩️ <strong>The Lightning Trick:</strong> Count seconds between lightning flash and thunder rumble. Every 3 seconds = 1 full kilometer away!'
  },
  voyager: {
    id: 'voyager',
    index: 3,
    icon: '🛰️',
    scaleTag: 'Deep Space Astrophysics • Interstellar Medium',
    accentColor: 'var(--accent-purple)',
    borderColor: 'rgba(192, 132, 252, 0.45)',
    title: 'Voyager 1 in the Interstellar Void',
    speedMain: '17,000 m/s',
    speedSub: '≈ 38,000 mph • 61,200 km/h',
    scenario: 'Cruising through the vacuum beyond our solar system with zero friction and zero engines burning.',
    timeGiven: '1 HOUR (3,600 s)',
    calcSubstitution: 'd = (17,000 m/s) · (3,600 s)',
    calcResult: '61,200,000 METERS (61,200 km)',
    contextNote: '🚀 <strong>Newton’s 1st Law in Space:</strong> In the frictionless vacuum of deep space, constant speed requires ZERO fuel or engine thrust forever!'
  }
};

let currentScaleKey = 'cheetah';
const scaleKeys = ['cheetah', 'sound', 'voyager'];

function selectScaleExample(key) {
  if (!SCALE_EXAMPLES[key]) return;
  currentScaleKey = key;
  const data = SCALE_EXAMPLES[key];

  // Update tabs
  scaleKeys.forEach(k => {
    const tab = document.getElementById(`tabScale-${k}`);
    if (tab) {
      const isActive = k === key;
      tab.classList.toggle('active', isActive);
      tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
    }
  });

  // Update Showcase Hero
  const heroBox = document.getElementById('scaleShowcaseHero');
  if (heroBox) {
    heroBox.style.borderColor = data.borderColor;
    heroBox.style.boxShadow = `0 10px 36px ${data.borderColor.replace('0.45', '0.25')}`;
  }

  const tagEl = document.getElementById('scaleHeroTag');
  if (tagEl) tagEl.style.color = data.accentColor;

  const iconEl = document.getElementById('scaleHeroIcon');
  if (iconEl) iconEl.textContent = data.icon;

  const tagText = document.getElementById('scaleHeroTagText');
  if (tagText) tagText.textContent = data.scaleTag;

  const titleEl = document.getElementById('scaleHeroTitle');
  if (titleEl) titleEl.textContent = data.title;

  const speedBanner = document.getElementById('scaleSpeedBanner');
  if (speedBanner) speedBanner.style.borderColor = data.borderColor;

  const speedVal = document.getElementById('scaleSpeedVal');
  if (speedVal) {
    speedVal.textContent = data.speedMain;
    speedVal.style.color = data.accentColor;
  }

  const speedEquiv = document.getElementById('scaleSpeedEquiv');
  if (speedEquiv) speedEquiv.textContent = data.speedSub;

  const scenarioText = document.getElementById('scaleScenarioText');
  if (scenarioText) scenarioText.textContent = data.scenario;

  const calcBox = document.getElementById('scaleCalcBox');
  if (calcBox) calcBox.style.borderColor = data.borderColor;

  const calcHeader = document.getElementById('scaleCalcHeaderTitle');
  if (calcHeader) calcHeader.textContent = `DISTANCE TRAVELED IN ${data.timeGiven}:`;

  const stepSub = document.getElementById('scaleStepSub');
  if (stepSub) stepSub.textContent = data.calcSubstitution;

  const stepRes = document.getElementById('scaleStepRes');
  if (stepRes) {
    stepRes.textContent = `➔ ${data.calcResult}`;
    stepRes.style.color = data.accentColor;
  }

  const contextNote = document.getElementById('scaleContextNote');
  if (contextNote) contextNote.innerHTML = data.contextNote;

  const stepIndicator = document.getElementById('scaleStepIndicator');
  if (stepIndicator) stepIndicator.textContent = `Scale ${data.index} of 3 (Hotkeys: Press 1, 2, or 3)`;

  DeckAudio.playChime();
}

function stepScaleExample(delta) {
  const currentIndex = scaleKeys.indexOf(currentScaleKey);
  let nextIndex = (currentIndex + delta + scaleKeys.length) % scaleKeys.length;
  selectScaleExample(scaleKeys[nextIndex]);
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

  // Student Handout Modal controls
  const btnHandout = document.getElementById('btnHandout');
  if (btnHandout) btnHandout.addEventListener('click', toggleHandoutModal);

  const btnCloseHandout = document.getElementById('btnCloseHandout');
  if (btnCloseHandout) btnCloseHandout.addEventListener('click', closeHandoutModal);

  const btnPrintHandout = document.getElementById('btnPrintHandout');
  if (btnPrintHandout) {
    btnPrintHandout.addEventListener('click', () => {
      window.print();
    });
  }

  const handoutModal = document.getElementById('handoutModal');
  if (handoutModal) {
    handoutModal.addEventListener('click', (e) => {
      if (e.target === handoutModal) {
        closeHandoutModal();
      }
    });
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
    // If Handout modal is open, Escape closes it
    if (DeckState.isHandoutOpen) {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeHandoutModal();
      }
      return;
    }

    // Hotkey H or P toggles Student Handout
    if (e.key === 'h' || e.key === 'H' || e.key === 'p' || e.key === 'P') {
      // Don't trigger if modifier keys like Ctrl/Cmd are held (allow Ctrl+P standard print)
      if (!e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        toggleHandoutModal();
        return;
      }
    }

    // Slide 4 interactive triangle shortcuts (1/D: Distance, 2/V: Speed, 3: Time)
    if (DeckState.currentSlide === 4) {
      if (e.key === '1' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        selectTriangleVar('d');
        return;
      } else if (e.key === '2' || e.key === 'v' || e.key === 'V') {
        e.preventDefault();
        selectTriangleVar('v');
        return;
      } else if (e.key === '3') {
        e.preventDefault();
        selectTriangleVar('t');
        return;
      }
    }

    // Slide 8 interactive real-world scale shortcuts (1: Cheetah, 2: Sound, 3: Voyager)
    if (DeckState.currentSlide === 8) {
      if (e.key === '1') {
        e.preventDefault();
        selectScaleExample('cheetah');
        return;
      } else if (e.key === '2') {
        e.preventDefault();
        selectScaleExample('sound');
        return;
      } else if (e.key === '3') {
        e.preventDefault();
        selectScaleExample('voyager');
        return;
      }
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
