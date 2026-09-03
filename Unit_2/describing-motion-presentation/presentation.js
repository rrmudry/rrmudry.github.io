/**
 * Describing Motion: Vectors, Scalars, Distance, and Displacement
 * Interactive Presentation & Educational Engine
 * Compliant with strict No-LaTeX policy and NGSS HS-PS2-1.
 */

// Global State
const PresentationState = {
  currentSlide: 0,
  totalSlides: 10,
  isStudyMode: false,
  soundEnabled: true,
  notesCollapsed: true,
  audioCtx: null
};

// Presenter Notes Database for Each Slide
const PRESENTER_NOTES = [
  {
    title: "Slide 1: Title & Welcome",
    cue: "Estimated Time: 2-3 mins",
    talkingPoints: [
      "Welcome the class to Kinematics! State the overarching objective: mastering the fundamental difference between scalar and vector quantities.",
      "Engage students immediately with the interactive hero canvas on screen: draw a wavy path to show how distance accumulates while the displacement arrow cuts straight across.",
      "Emphasize that motion is the heartbeat of physics: before we can explain WHY things move (forces), we must precisely describe HOW they move."
    ],
    question: "Ask the class: If an astronaut travels to the Moon and back, how far did they travel, and where did they end up?"
  },
  {
    title: "Slide 2: Scalars vs. Vectors",
    cue: "Estimated Time: 4-5 mins",
    talkingPoints: [
      "Define Scalar: only magnitude (number + unit). Direction makes zero sense (e.g., '10 seconds North' is meaningless).",
      "Define Vector: magnitude AND spatial direction. Velocity, acceleration, and force require directional specification.",
      "Invite a student to classify the sample cards on the screen by dragging or tapping."
    ],
    question: "Why is speed a scalar while velocity is a vector?"
  },
  {
    title: "Slide 3: Distance (The Scalar)",
    cue: "Estimated Time: 3-4 mins",
    talkingPoints: [
      "Distance is the total odometer reading. Every footstep counts.",
      "Crucial property: Distance is strictly non-negative (d >= 0). You can never walk 'negative 5 meters' on an odometer.",
      "Path-dependence: Taking detours around a lake drastically increases distance."
    ],
    question: "Can distance ever decrease as you continue walking? (No, it is monotonically non-decreasing)."
  },
  {
    title: "Slide 4: Displacement (The Vector)",
    cue: "Estimated Time: 4-5 mins",
    talkingPoints: [
      "Displacement is the direct 'as the crow flies' straight line from start to finish.",
      "Path-independence: It only cares about initial position (x_i) and final position (x_f).",
      "Displacement can be positive, negative, or exactly zero."
    ],
    question: "If you walk 100 miles on a winding trail and end up right back at your tent, what is your net displacement? (0 miles)."
  },
  {
    title: "Slide 5: Coordinate Reference Systems & 1D Walk",
    cue: "Estimated Time: 5-6 mins",
    talkingPoints: [
      "Establish sign conventions: + is usually Right/East/Up; - is Left/West/Down.",
      "Walk through the worked example step-by-step: 5 m East (+5m), then 3 m West (-3m).",
      "Notice how total distance is 5 + 3 = 8 m, but displacement is +5 - 3 = +2 m East."
    ],
    question: "What would happen if the person turned around and walked 7 m West instead? (Displacement = -2 m or 2 m West)."
  },
  {
    title: "Slide 6: Special Motion Cases",
    cue: "Estimated Time: 4-5 mins",
    talkingPoints: [
      "Case 1 (Round-Trip): A complete lap around a 400m track. Distance = 400m, Displacement = 0m.",
      "Case 2 (Unidirectional): Straight drag strip. Distance = |Displacement| = 400m.",
      "Key takeaway: Distance is always greater than or equal to the magnitude of displacement (d >= |Δx|)."
    ],
    question: "Under what sole condition does total distance equal the magnitude of displacement? (Motion in a straight line without reversing)."
  },
  {
    title: "Slide 7: 2D Displacement Vectors & Quadrants",
    cue: "Estimated Time: 5-6 mins",
    talkingPoints: [
      "Real life happens in 2D and 3D! We break displacement into perpendicular components: Δr = (Δx, Δy).",
      "Point out the 4 quadrants on the interactive grid: Q1 (+, +), Q2 (-, +), Q3 (-, -), Q4 (+, -).",
      "Drag the interactive endpoint to illustrate how the right triangle updates in real time."
    ],
    question: "If you move 10 paces West and 20 paces North, which quadrant are you in? (Quadrant II)."
  },
  {
    title: "Slide 8: Magnitude & Direction (Worked Example)",
    cue: "Estimated Time: 6-7 mins",
    talkingPoints: [
      "Recall the Pythagorean Theorem: hypotenuse² = leg₁² + leg₂².",
      "Walk through the 3m West, 4m South example: Δx = -3, Δy = -4. Resultant = √( (-3)² + (-4)² ) = √(9 + 16) = √25 = 5 m.",
      "Direction calculation: θ = tan⁻¹(|Δy| / |Δx|) = tan⁻¹(4/3) = 53.1° South of West (217° standard compass angle)."
    ],
    question: "Why is vector magnitude ALWAYS a positive number? (Because it represents geometric length/norm)."
  },
  {
    title: "Slide 9: Core Comparison Matrix",
    cue: "Estimated Time: 4-5 mins",
    talkingPoints: [
      "Review the master comparison matrix summarizing all 5 dimensions.",
      "Highlight the real-world metric: Delivery car odometer vs. Delivery drone straight-line vector.",
      "Reiterate: Scalars need only magnitude; Vectors require magnitude and spatial orientation."
    ],
    question: "Why can't you navigate an airplane using scalars alone?"
  },
  {
    title: "Slide 10: Audience Check & Misconception Q&A",
    cue: "Estimated Time: 5-6 mins",
    talkingPoints: [
      "Pose the audience check question: 4 laps around a 400m track.",
      "Collect student votes before revealing the answer.",
      "Celebrate mastery with confetti and walk through the FAQ misconceptions drawer."
    ],
    question: "Review: Distance = 4 * 400 m = 1600 m. Displacement = 0 m because start = finish!"
  }
];

// Audio Synthesizer (Web Audio API)
class SoundFX {
  static init() {
    if (!PresentationState.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        PresentationState.audioCtx = new AudioContext();
      }
    }
  }

  static playClick() {
    if (!PresentationState.soundEnabled) return;
    this.init();
    if (!PresentationState.audioCtx) return;
    const ctx = PresentationState.audioCtx;
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(650, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.04);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.04);
  }

  static playWhoosh() {
    if (!PresentationState.soundEnabled) return;
    this.init();
    if (!PresentationState.audioCtx) return;
    const ctx = PresentationState.audioCtx;
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.09);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.09);
  }

  static playSuccess() {
    if (!PresentationState.soundEnabled) return;
    this.init();
    if (!PresentationState.audioCtx) return;
    const ctx = PresentationState.audioCtx;
    if (ctx.state === 'suspended') ctx.resume();

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const startTime = ctx.currentTime + idx * 0.08;
      gain.gain.setValueAtTime(0.1, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.35);
    });
  }
}

// Navigation & Presentation Controller
function initNavigation() {
  const prevBtn = document.getElementById('btn-prev-slide');
  const nextBtn = document.getElementById('btn-next-slide');
  const slideCounter = document.getElementById('slide-counter-badge');
  const progressBar = document.getElementById('presentation-progress-bar');
  const notesToggleBtn = document.getElementById('btn-toggle-notes');
  const notesDrawer = document.getElementById('presenter-notes-drawer');
  const soundToggleBtn = document.getElementById('btn-toggle-sound');
  const modeToggleBtn = document.getElementById('btn-toggle-mode');
  const fullscreenBtn = document.getElementById('btn-toggle-fullscreen');

  function renderSlide(index) {
    if (index < 0) index = 0;
    if (index >= PresentationState.totalSlides) index = PresentationState.totalSlides - 1;
    PresentationState.currentSlide = index;

    // Toggle active slide containers
    const slides = document.querySelectorAll('.slide-container');
    slides.forEach((slide, idx) => {
      if (idx === index) {
        slide.classList.add('active');
        slide.setAttribute('aria-hidden', 'false');
      } else {
        slide.classList.remove('active');
        slide.setAttribute('aria-hidden', 'true');
      }
    });

    // Update Progress Bar
    const percent = ((index + 1) / PresentationState.totalSlides) * 100;
    if (progressBar) progressBar.style.width = `${percent}%`;

    // Update Counter
    if (slideCounter) {
      slideCounter.textContent = `Slide ${index + 1} of ${PresentationState.totalSlides}`;
    }

    // Update Dots
    const dots = document.querySelectorAll('.slide-dot');
    dots.forEach((dot, idx) => {
      if (idx === index) {
        dot.classList.add('bg-sky-400', 'ring-2', 'ring-sky-400/50', 'w-6');
        dot.classList.remove('bg-white/20', 'w-2.5');
      } else {
        dot.classList.remove('bg-sky-400', 'ring-2', 'ring-sky-400/50', 'w-6');
        dot.classList.add('bg-white/20', 'w-2.5');
      }
    });

    // Update Prev / Next button states
    if (prevBtn) prevBtn.disabled = (index === 0);
    if (nextBtn) {
      if (index === PresentationState.totalSlides - 1) {
        nextBtn.innerHTML = `<span>Finish</span> <span>🎉</span>`;
      } else {
        nextBtn.innerHTML = `<span>Next</span> <span class="text-xs">&rarr;</span>`;
      }
    }

    // Update Presenter Notes
    updatePresenterNotes(index);

    // Refresh simulation canvases on that slide
    refreshSlideSimulations(index);

    // Scroll to top of viewport
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function updatePresenterNotes(index) {
    const notesData = PRESENTER_NOTES[index] || PRESENTER_NOTES[0];
    const notesTitle = document.getElementById('notes-slide-title');
    const notesCue = document.getElementById('notes-slide-cue');
    const notesList = document.getElementById('notes-talking-points');
    const notesQuestion = document.getElementById('notes-check-question');

    if (notesTitle) notesTitle.textContent = notesData.title;
    if (notesCue) notesCue.textContent = notesData.cue;
    if (notesList) {
      notesList.innerHTML = notesData.talkingPoints
        .map(pt => `<li class="flex items-start gap-2"><span class="text-sky-400 mt-1">&bull;</span><span>${pt}</span></li>`)
        .join('');
    }
    if (notesQuestion) {
      notesQuestion.textContent = notesData.question;
    }
  }

  // Button Listeners
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      SoundFX.playWhoosh();
      renderSlide(PresentationState.currentSlide - 1);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (PresentationState.currentSlide === PresentationState.totalSlides - 1) {
        SoundFX.playSuccess();
        triggerConfettiCelebration();
      } else {
        SoundFX.playWhoosh();
        renderSlide(PresentationState.currentSlide + 1);
      }
    });
  }

  // Notes Drawer Toggle
  if (notesToggleBtn && notesDrawer) {
    notesToggleBtn.addEventListener('click', () => {
      SoundFX.playClick();
      PresentationState.notesCollapsed = !PresentationState.notesCollapsed;
      if (PresentationState.notesCollapsed) {
        notesDrawer.classList.add('collapsed');
        notesToggleBtn.classList.remove('bg-sky-500/20', 'text-sky-300', 'border-sky-500/40');
      } else {
        notesDrawer.classList.remove('collapsed');
        notesToggleBtn.classList.add('bg-sky-500/20', 'text-sky-300', 'border-sky-500/40');
      }
    });
  }

  // Sound Toggle
  if (soundToggleBtn) {
    soundToggleBtn.addEventListener('click', () => {
      PresentationState.soundEnabled = !PresentationState.soundEnabled;
      soundToggleBtn.innerHTML = PresentationState.soundEnabled ? '🔊' : '🔇';
      soundToggleBtn.title = PresentationState.soundEnabled ? 'Mute Audio' : 'Unmute Audio';
      if (PresentationState.soundEnabled) SoundFX.playClick();
    });
  }

  // Dual Mode Toggle (Slideshow vs All-in-One Study Mode)
  if (modeToggleBtn) {
    modeToggleBtn.addEventListener('click', () => {
      PresentationState.isStudyMode = !PresentationState.isStudyMode;
      document.body.classList.toggle('study-mode', PresentationState.isStudyMode);
      modeToggleBtn.innerHTML = PresentationState.isStudyMode 
        ? '📖 <span>Study Mode (All)</span>' 
        : '📽️ <span>Slideshow Mode</span>';
      SoundFX.playClick();
      // Re-trigger canvas resizes
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 100);
    });
  }

  // Fullscreen Toggle
  if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', () => {
      SoundFX.playClick();
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
          console.warn("Fullscreen request error:", err);
        });
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
    });
  }

  // Keyboard Navigation
  window.addEventListener('keydown', (e) => {
    // Ignore keystrokes inside input fields
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

    switch (e.key) {
      case 'ArrowRight':
      case 'PageDown':
      case ' ': // Spacebar
        e.preventDefault();
        SoundFX.playWhoosh();
        renderSlide(PresentationState.currentSlide + 1);
        break;
      case 'ArrowLeft':
      case 'PageUp':
        e.preventDefault();
        SoundFX.playWhoosh();
        renderSlide(PresentationState.currentSlide - 1);
        break;
      case 'Home':
        e.preventDefault();
        SoundFX.playClick();
        renderSlide(0);
        break;
      case 'End':
        e.preventDefault();
        SoundFX.playClick();
        renderSlide(PresentationState.totalSlides - 1);
        break;
      case 'f':
      case 'F':
        if (fullscreenBtn) fullscreenBtn.click();
        break;
      case 'm':
      case 'M':
        if (soundToggleBtn) soundToggleBtn.click();
        break;
      case 'n':
      case 'N':
        if (notesToggleBtn) notesToggleBtn.click();
        break;
      case 's':
      case 'S':
        if (modeToggleBtn) modeToggleBtn.click();
        break;
    }
  });

  // Slide dot indicator click handlers
  const dotsContainer = document.getElementById('slide-dots-container');
  if (dotsContainer) {
    dotsContainer.innerHTML = Array.from({ length: PresentationState.totalSlides }).map((_, i) => `
      <button class="slide-dot h-2.5 rounded-full transition-all duration-300 bg-white/20 hover:bg-white/40" 
              data-index="${i}" 
              title="Jump to Slide ${i + 1}"></button>
    `).join('');

    dotsContainer.querySelectorAll('.slide-dot').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.getAttribute('data-index'), 10);
        SoundFX.playClick();
        renderSlide(idx);
      });
    });
  }

  // Initial render
  renderSlide(0);
}

// Confetti Celebration Helper
function triggerConfettiCelebration() {
  if (window.confetti) {
    window.confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 }
    });
  }
}

// Refresh animations / resize canvas for active slide
function refreshSlideSimulations(slideIdx) {
  if (slideIdx === 0 && window.HeroCanvas) HeroCanvas.draw();
  if (slideIdx === 2 && window.DistanceTrailSim) DistanceTrailSim.draw();
  if (slideIdx === 3 && window.DisplacementTrailSim) DisplacementTrailSim.draw();
  if (slideIdx === 4 && window.NumberLine1D) NumberLine1D.draw();
  if (slideIdx === 5 && window.SpecialCasesSim) SpecialCasesSim.draw();
  if (slideIdx === 6 && window.Quadrant2DSim) Quadrant2DSim.draw();
  if (slideIdx === 7 && window.Vector2DCalc) Vector2DCalc.update();
  if (slideIdx === 8 && window.OdometerDroneSim) OdometerDroneSim.draw();
}

// -------------------------------------------------------------
// SLIDE 1: Hero Vector Interactive Canvas
// -------------------------------------------------------------
const HeroCanvas = {
  canvas: null,
  ctx: null,
  points: [],
  isDrawing: false,

  init() {
    this.canvas = document.getElementById('canvas-hero');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.setupListeners();
    this.loadPreset('curve');
  },

  setupListeners() {
    const canvas = this.canvas;
    const getPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: (clientX - rect.left) * (canvas.width / rect.width),
        y: (clientY - rect.top) * (canvas.height / rect.height)
      };
    };

    const startDraw = (e) => {
      e.preventDefault();
      SoundFX.playClick();
      this.isDrawing = true;
      const pos = getPos(e);
      this.points = [pos];
      this.draw();
    };

    const moveDraw = (e) => {
      if (!this.isDrawing) return;
      e.preventDefault();
      const pos = getPos(e);
      const last = this.points[this.points.length - 1];
      const dist = Math.hypot(pos.x - last.x, pos.y - last.y);
      if (dist > 6) {
        this.points.push(pos);
        this.draw();
      }
    };

    const endDraw = (e) => {
      if (this.isDrawing) {
        this.isDrawing = false;
        this.draw();
      }
    };

    canvas.addEventListener('mousedown', startDraw);
    window.addEventListener('mousemove', moveDraw);
    window.addEventListener('mouseup', endDraw);

    canvas.addEventListener('touchstart', startDraw, { passive: false });
    window.addEventListener('touchmove', moveDraw, { passive: false });
    window.addEventListener('touchend', endDraw);

    const btnClear = document.getElementById('btn-hero-clear');
    if (btnClear) {
      btnClear.addEventListener('click', () => {
        SoundFX.playClick();
        this.loadPreset('curve');
      });
    }

    const btnLoop = document.getElementById('btn-hero-loop');
    if (btnLoop) {
      btnLoop.addEventListener('click', () => {
        SoundFX.playClick();
        this.loadPreset('loop');
      });
    }
  },

  loadPreset(type) {
    const w = this.canvas.width;
    const h = this.canvas.height;
    if (type === 'curve') {
      this.points = [
        { x: w * 0.15, y: h * 0.7 },
        { x: w * 0.3, y: h * 0.25 },
        { x: w * 0.5, y: h * 0.8 },
        { x: w * 0.7, y: h * 0.3 },
        { x: w * 0.85, y: h * 0.6 }
      ];
    } else if (type === 'loop') {
      this.points = [];
      const cx = w * 0.5;
      const cy = h * 0.5;
      const r = Math.min(w, h) * 0.35;
      for (let i = 0; i <= 36; i++) {
        const rad = (i / 36) * Math.PI * 2;
        this.points.push({
          x: cx + Math.cos(rad) * r,
          y: cy + Math.sin(rad) * r
        });
      }
    }
    this.draw();
  },

  draw() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < w; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    if (this.points.length < 2) return;

    // Calculate Distance (sum of segments in scaled meters: 20px = 1m)
    const scale = 25; // 25 px = 1 meter
    let totalDistPx = 0;
    for (let i = 1; i < this.points.length; i++) {
      totalDistPx += Math.hypot(
        this.points[i].x - this.points[i - 1].x,
        this.points[i].y - this.points[i - 1].y
      );
    }
    const totalDistMeters = (totalDistPx / scale).toFixed(1);

    // Calculate Displacement (from point 0 to point N)
    const start = this.points[0];
    const end = this.points[this.points.length - 1];
    const dispPx = Math.hypot(end.x - start.x, end.y - start.y);
    const dispMeters = (dispPx / scale).toFixed(1);
    const angleRad = Math.atan2(-(end.y - start.y), end.x - start.x);
    let angleDeg = Math.round((angleRad * 180) / Math.PI);
    if (angleDeg < 0) angleDeg += 360;

    // 1. Draw Winding Path (Scalar Distance)
    ctx.beginPath();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 4;
    ctx.setLineDash([6, 6]);
    ctx.moveTo(this.points[0].x, this.points[0].y);
    for (let i = 1; i < this.points.length; i++) {
      ctx.lineTo(this.points[i].x, this.points[i].y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // 2. Draw Direct Displacement Vector Arrow
    ctx.beginPath();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 12;
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Arrowhead on displacement
    if (dispPx > 10) {
      const arrowLen = 14;
      const a = Math.atan2(end.y - start.y, end.x - start.x);
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(end.x, end.y);
      ctx.lineTo(
        end.x - arrowLen * Math.cos(a - Math.PI / 6),
        end.y - arrowLen * Math.sin(a - Math.PI / 6)
      );
      ctx.lineTo(
        end.x - arrowLen * Math.cos(a + Math.PI / 6),
        end.y - arrowLen * Math.sin(a + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fill();
    }

    // Start Pin (Green)
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(start.x, start.y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // End Pin (Red/Cyan)
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(end.x, end.y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Update Telemetry Display in DOM
    const distEl = document.getElementById('hero-val-distance');
    const dispEl = document.getElementById('hero-val-displacement');
    const angleEl = document.getElementById('hero-val-angle');
    if (distEl) distEl.textContent = `${totalDistMeters} m`;
    if (dispEl) dispEl.textContent = `${dispMeters} m`;
    if (angleEl) angleEl.textContent = `${angleDeg}°`;
  }
};

// -------------------------------------------------------------
// SLIDE 2: Scalars vs. Vectors Concept Sorting Lab
// -------------------------------------------------------------
const QuantitiesLab = {
  items: [
    { id: 'q1', text: 'Temperature (20°C)', type: 'scalar', icon: '🌡️', explanation: 'Requires only numerical magnitude and unit. No direction exists.' },
    { id: 'q2', text: 'Velocity (60 mph North)', type: 'vector', icon: '🧭', explanation: 'Specifies both speed (magnitude) and directional heading (North).' },
    { id: 'q3', text: 'Time (10 s)', type: 'scalar', icon: '⏱️', explanation: 'Flows uniformly; completely defined by magnitude in seconds.' },
    { id: 'q4', text: 'Force (10 N down)', type: 'vector', icon: '⬇️', explanation: 'A push or pull in a specific spatial direction (downward).' },
    { id: 'q5', text: 'Mass (5 kg)', type: 'scalar', icon: '⚖️', explanation: 'Quantity of matter; unchanged by spatial orientation.' },
    { id: 'q6', text: 'Acceleration (9.8 m/s² down)', type: 'vector', icon: '🎯', explanation: 'Rate of change of velocity directed toward Earth\'s center.' },
    { id: 'q7', text: 'Speed (45 mph)', type: 'scalar', icon: '🏎️', explanation: 'How fast an object moves, irrespective of which direction it points.' },
    { id: 'q8', text: 'Displacement (5 m East)', type: 'vector', icon: '➡️', explanation: 'Straight-line change in position with spatial direction (East).' }
  ],
  userPlacements: {},

  init() {
    this.render();
  },

  render() {
    const pool = document.getElementById('quantities-pool');
    const scalarZone = document.getElementById('zone-scalar');
    const vectorZone = document.getElementById('zone-vector');
    const scoreBadge = document.getElementById('quantities-score-badge');

    if (!pool || !scalarZone || !vectorZone) return;

    pool.innerHTML = '';
    scalarZone.innerHTML = '<div class="text-xs text-amber-400/60 font-mono mb-2 uppercase tracking-wider">Scalar (Magnitude Only)</div>';
    vectorZone.innerHTML = '<div class="text-xs text-sky-400/60 font-mono mb-2 uppercase tracking-wider">Vector (Magnitude + Direction)</div>';

    let correctCount = 0;
    let placedCount = 0;

    this.items.forEach(item => {
      const placement = this.userPlacements[item.id];
      const chip = document.createElement('div');
      chip.className = `quantity-chip p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between gap-2 shadow-sm ${
        placement 
          ? (placement === item.type 
              ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-200' 
              : 'bg-rose-950/70 border-rose-500/50 text-rose-200')
          : 'bg-slate-800/80 hover:bg-slate-700 border-white/10 text-slate-200'
      }`;
      chip.innerHTML = `
        <div class="flex items-center gap-1.5">
          <span>${item.icon}</span>
          <span>${item.text}</span>
        </div>
        <div class="flex items-center gap-1">
          ${!placement ? `
            <button class="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-mono" data-action="scalar" data-id="${item.id}">+Scalar</button>
            <button class="px-2 py-0.5 rounded bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 text-[10px] font-mono" data-action="vector" data-id="${item.id}">+Vector</button>
          ` : `
            <button class="text-slate-400 hover:text-white px-1.5" data-action="reset" data-id="${item.id}">&times;</button>
          `}
        </div>
      `;

      if (!placement) {
        pool.appendChild(chip);
      } else if (placement === 'scalar') {
        placedCount++;
        if (item.type === 'scalar') correctCount++;
        scalarZone.appendChild(chip);
      } else if (placement === 'vector') {
        placedCount++;
        if (item.type === 'vector') correctCount++;
        vectorZone.appendChild(chip);
      }
    });

    if (scoreBadge) {
      scoreBadge.textContent = `${correctCount} / ${this.items.length} Classified Correctly`;
      if (placedCount === this.items.length && correctCount === this.items.length) {
        scoreBadge.classList.remove('bg-sky-500/20', 'text-sky-300');
        scoreBadge.classList.add('bg-emerald-500/30', 'text-emerald-300', 'border-emerald-500/40');
      }
    }

    // Attach button actions
    const buttons = document.querySelectorAll('.quantity-chip button');
    buttons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.getAttribute('data-action');
        const id = btn.getAttribute('data-id');
        if (action === 'reset') {
          delete this.userPlacements[id];
          SoundFX.playClick();
        } else {
          this.userPlacements[id] = action;
          const matchedItem = this.items.find(i => i.id === id);
          if (matchedItem && matchedItem.type === action) {
            SoundFX.playSuccess();
          } else {
            SoundFX.playClick();
          }
        }
        this.render();
      });
    });

    // Reset All button
    const btnResetAll = document.getElementById('btn-quantities-reset');
    if (btnResetAll) {
      btnResetAll.onclick = () => {
        SoundFX.playClick();
        this.userPlacements = {};
        this.render();
      };
    }
  }
};

// -------------------------------------------------------------
// SLIDE 3 & 4: Distance vs Displacement Trail Simulators
// -------------------------------------------------------------
const DistanceTrailSim = {
  canvas: null,
  ctx: null,
  detourSlider: null,

  init() {
    this.canvas = document.getElementById('canvas-dist-sim');
    this.detourSlider = document.getElementById('slider-dist-detours');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    if (this.detourSlider) {
      this.detourSlider.addEventListener('input', () => {
        this.draw();
      });
    }
    this.draw();
  },

  draw() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    ctx.clearRect(0, 0, w, h);

    const detours = parseInt(this.detourSlider ? this.detourSlider.value : 3, 10);
    const start = { x: 50, y: h / 2 };
    const end = { x: w - 50, y: h / 2 };

    // Generate winding path with N waves
    ctx.beginPath();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 4;
    ctx.moveTo(start.x, start.y);

    let pathLengthPx = 0;
    let prevX = start.x;
    let prevY = start.y;
    const steps = 100;

    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const x = start.x + (end.x - start.x) * t;
      const amplitude = Math.sin(t * Math.PI) * (detours * 25);
      const y = h / 2 + Math.sin(t * detours * Math.PI * 2) * amplitude;
      ctx.lineTo(x, y);

      pathLengthPx += Math.hypot(x - prevX, y - prevY);
      prevX = x;
      prevY = y;
    }
    ctx.stroke();

    // Start & End markers
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(start.x, start.y, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(end.x, end.y, 6, 0, Math.PI * 2);
    ctx.fill();

    // Scale: 30px = 1 meter
    const distMeters = (pathLengthPx / 30).toFixed(1);
    const valEl = document.getElementById('dist-sim-output');
    if (valEl) valEl.textContent = `${distMeters} m`;
  }
};

const DisplacementTrailSim = {
  canvas: null,
  ctx: null,
  endXSlider: null,

  init() {
    this.canvas = document.getElementById('canvas-disp-sim');
    this.endXSlider = document.getElementById('slider-disp-position');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    if (this.endXSlider) {
      this.endXSlider.addEventListener('input', () => {
        this.draw();
      });
    }
    this.draw();
  },

  draw() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    ctx.clearRect(0, 0, w, h);

    const endXFraction = parseFloat(this.endXSlider ? this.endXSlider.value : 0.85);
    const start = { x: 50, y: h / 2 };
    const end = { x: 50 + (w - 100) * endXFraction, y: h / 2 };

    // 1. Draw Winding Path in faint amber
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
    ctx.lineWidth = 3;
    ctx.setLineDash([5, 5]);
    ctx.moveTo(start.x, start.y);
    const steps = 60;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const x = start.x + (end.x - start.x) * t;
      const y = h / 2 + Math.sin(t * 3 * Math.PI) * 35;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // 2. Draw Direct Displacement Vector Arrow
    ctx.beginPath();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4;
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();

    // Arrowhead
    const dx = end.x - start.x;
    if (Math.abs(dx) > 10) {
      const dir = dx > 0 ? 1 : -1;
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(end.x, end.y);
      ctx.lineTo(end.x - dir * 12, end.y - 6);
      ctx.lineTo(end.x - dir * 12, end.y + 6);
      ctx.closePath();
      ctx.fill();
    }

    // Markers
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(start.x, start.y, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(end.x, end.y, 6, 0, Math.PI * 2);
    ctx.fill();

    // Calculate displacement in meters (scale 30px = 1m)
    const dispMeters = ((end.x - start.x) / 30).toFixed(1);
    const dispEl = document.getElementById('disp-sim-output');
    if (dispEl) {
      const sign = dispMeters > 0 ? '+' : '';
      dispEl.textContent = `${sign}${dispMeters} m`;
    }
  }
};

// -------------------------------------------------------------
// SLIDE 5: 1D Coordinate Reference Systems & Worked Example
// -------------------------------------------------------------
const NumberLine1D = {
  canvas: null,
  ctx: null,
  leg1: 5,
  leg2: -3,
  stepProgress: 1, // 0 = start, 1 = after leg 1, 2 = after leg 2

  init() {
    this.canvas = document.getElementById('canvas-1d-walk');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.setupControls();
    this.draw();
  },

  setupControls() {
    const btnNextStep = document.getElementById('btn-1d-step');
    const btnReset = document.getElementById('btn-1d-reset');
    const inputL1 = document.getElementById('input-1d-leg1');
    const inputL2 = document.getElementById('input-1d-leg2');

    if (btnNextStep) {
      btnNextStep.addEventListener('click', () => {
        SoundFX.playClick();
        this.stepProgress = (this.stepProgress + 1) % 3;
        this.draw();
      });
    }

    if (btnReset) {
      btnReset.addEventListener('click', () => {
        SoundFX.playClick();
        this.stepProgress = 0;
        this.draw();
      });
    }

    const updateCustom = () => {
      if (inputL1) this.leg1 = parseFloat(inputL1.value) || 5;
      if (inputL2) this.leg2 = parseFloat(inputL2.value) || -3;
      this.draw();
    };

    if (inputL1) inputL1.addEventListener('input', updateCustom);
    if (inputL2) inputL2.addEventListener('input', updateCustom);
  },

  draw() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    ctx.clearRect(0, 0, w, h);

    const originX = w * 0.35;
    const scale = 36; // 36 px = 1 meter
    const lineY = h * 0.65;

    // 1. Draw Number Line Axis
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(20, lineY);
    ctx.lineTo(w - 20, lineY);
    ctx.stroke();

    // Arrows at ends of number line
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.moveTo(w - 20, lineY);
    ctx.lineTo(w - 30, lineY - 5);
    ctx.lineTo(w - 30, lineY + 5);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(20, lineY);
    ctx.lineTo(30, lineY - 5);
    ctx.lineTo(30, lineY + 5);
    ctx.fill();

    // Ticks & Labels from -3 to +8
    ctx.font = '11px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    for (let meter = -4; meter <= 9; meter++) {
      const x = originX + meter * scale;
      if (x < 30 || x > w - 30) continue;

      ctx.strokeStyle = meter === 0 ? '#38bdf8' : 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = meter === 0 ? 3 : 1;
      ctx.beginPath();
      ctx.moveTo(x, lineY - 7);
      ctx.lineTo(x, lineY + 7);
      ctx.stroke();

      ctx.fillStyle = meter === 0 ? '#38bdf8' : '#94a3b8';
      ctx.fillText(`${meter > 0 ? '+' : ''}${meter}m`, x, lineY + 22);
    }

    // Direction labels
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '12px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('← West (-)', 35, lineY - 25);
    ctx.textAlign = 'right';
    ctx.fillText('East (+) →', w - 35, lineY - 25);

    // Current coordinates
    const startX = originX;
    const leg1X = originX + this.leg1 * scale;
    const finalX = leg1X + this.leg2 * scale;

    // Draw Leg 1 vector (+5m East)
    if (this.stepProgress >= 1) {
      const leg1Y = lineY - 45;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(startX, leg1Y);
      ctx.lineTo(leg1X, leg1Y);
      ctx.stroke();

      // Arrowhead
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(leg1X, leg1Y);
      ctx.lineTo(leg1X - 10, leg1Y - 5);
      ctx.lineTo(leg1X - 10, leg1Y + 5);
      ctx.fill();

      ctx.fillStyle = '#38bdf8';
      ctx.font = '11px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`Leg 1: +${this.leg1} m (East)`, (startX + leg1X) / 2, leg1Y - 8);
    }

    // Draw Leg 2 vector (-3m West)
    if (this.stepProgress >= 2) {
      const leg2Y = lineY - 75;
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(leg1X, leg2Y);
      ctx.lineTo(finalX, leg2Y);
      ctx.stroke();

      // Arrowhead pointing left
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.moveTo(finalX, leg2Y);
      ctx.lineTo(finalX + 10, leg2Y - 5);
      ctx.lineTo(finalX + 10, leg2Y + 5);
      ctx.fill();

      ctx.fillStyle = '#f43f5e';
      ctx.font = '11px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`Leg 2: ${this.leg2} m (West)`, (leg1X + finalX) / 2, leg2Y - 8);

      // Draw Net Resultant Displacement arrow (green)
      const netY = lineY - 105;
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3.5;
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(startX, netY);
      ctx.lineTo(finalX, netY);
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.moveTo(finalX, netY);
      ctx.lineTo(finalX - 10, netY - 5);
      ctx.lineTo(finalX - 10, netY + 5);
      ctx.fill();

      ctx.font = 'bold 12px JetBrains Mono, monospace';
      ctx.fillText(`Net Displacement Δx: +${this.leg1 + this.leg2} m East`, (startX + finalX) / 2, netY - 8);
    }

    // Runner Marker
    let runnerX = startX;
    if (this.stepProgress === 1) runnerX = leg1X;
    if (this.stepProgress === 2) runnerX = finalX;

    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(runnerX, lineY, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Update Telemetry Display
    const totalDist = this.stepProgress === 0 ? 0 : (this.stepProgress === 1 ? Math.abs(this.leg1) : Math.abs(this.leg1) + Math.abs(this.leg2));
    const netDisp = this.stepProgress === 0 ? 0 : (this.stepProgress === 1 ? this.leg1 : this.leg1 + this.leg2);

    const distOut = document.getElementById('val-1d-distance');
    const dispOut = document.getElementById('val-1d-displacement');
    if (distOut) distOut.textContent = `${totalDist} m`;
    if (dispOut) {
      const sign = netDisp > 0 ? '+' : '';
      dispOut.textContent = `${sign}${netDisp} m ${netDisp >= 0 ? '(East)' : '(West)'}`;
    }
  }
};

// -------------------------------------------------------------
// SLIDE 6: Special Motion Cases Visualizer (Round-trip vs Straight)
// -------------------------------------------------------------
const SpecialCasesSim = {
  canvas: null,
  ctx: null,
  activeCase: 'roundtrip', // 'roundtrip' or 'straight'
  t: 0,
  animId: null,

  init() {
    this.canvas = document.getElementById('canvas-special-cases');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    const btnRound = document.getElementById('btn-case-roundtrip');
    const btnStraight = document.getElementById('btn-case-straight');

    if (btnRound && btnStraight) {
      btnRound.addEventListener('click', () => {
        SoundFX.playClick();
        this.activeCase = 'roundtrip';
        btnRound.classList.add('bg-sky-500/20', 'text-sky-300', 'border-sky-500/40');
        btnStraight.classList.remove('bg-sky-500/20', 'text-sky-300', 'border-sky-500/40');
        this.t = 0;
        this.draw();
      });

      btnStraight.addEventListener('click', () => {
        SoundFX.playClick();
        this.activeCase = 'straight';
        btnStraight.classList.add('bg-sky-500/20', 'text-sky-300', 'border-sky-500/40');
        btnRound.classList.remove('bg-sky-500/20', 'text-sky-300', 'border-sky-500/40');
        this.t = 0;
        this.draw();
      });
    }

    const runAnim = () => {
      this.t = (this.t + 0.006) % 1;
      this.draw();
      this.animId = requestAnimationFrame(runAnim);
    };
    runAnim();
  },

  draw() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    ctx.clearRect(0, 0, w, h);

    if (this.activeCase === 'roundtrip') {
      // Draw 400m Oval Athletic Track
      const trackW = w * 0.65;
      const trackH = h * 0.55;
      const cx = w / 2;
      const cy = h / 2;
      const r = trackH / 2;
      const straightLen = trackW - 2 * r;

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 24;
      ctx.lineCap = 'round';
      ctx.beginPath();
      // Draw standard oval track (stadium shape)
      ctx.arc(cx - straightLen / 2, cy, r, Math.PI / 2, (3 * Math.PI) / 2);
      ctx.lineTo(cx + straightLen / 2, cy - r);
      ctx.arc(cx + straightLen / 2, cy, r, (3 * Math.PI) / 2, Math.PI / 2);
      ctx.lineTo(cx - straightLen / 2, cy + r);
      ctx.stroke();

      // Finish / Start line
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx - straightLen / 2, cy + r - 12);
      ctx.lineTo(cx - straightLen / 2, cy + r + 12);
      ctx.stroke();

      // Compute runner position along perimeter
      const perimeter = 2 * straightLen + 2 * Math.PI * r;
      const currentDistPx = this.t * perimeter;
      let runnerX, runnerY;

      const halfStraight = straightLen;
      const halfArc = Math.PI * r;

      if (currentDistPx < halfStraight) {
        // Bottom straight (left to right)
        const prog = currentDistPx / halfStraight;
        runnerX = cx - straightLen / 2 + prog * straightLen;
        runnerY = cy + r;
      } else if (currentDistPx < halfStraight + halfArc) {
        // Right turn
        const prog = (currentDistPx - halfStraight) / halfArc;
        const ang = Math.PI / 2 - prog * Math.PI;
        runnerX = cx + straightLen / 2 + Math.cos(ang) * r;
        runnerY = cy + Math.sin(ang) * r;
      } else if (currentDistPx < 2 * halfStraight + halfArc) {
        // Top straight (right to left)
        const prog = (currentDistPx - (halfStraight + halfArc)) / halfStraight;
        runnerX = cx + straightLen / 2 - prog * straightLen;
        runnerY = cy - r;
      } else {
        // Left turn
        const prog = (currentDistPx - (2 * halfStraight + halfArc)) / halfArc;
        const ang = (3 * Math.PI) / 2 - prog * Math.PI;
        runnerX = cx - straightLen / 2 + Math.cos(ang) * r;
        runnerY = cy + Math.sin(ang) * r;
      }

      // Start position (fixed)
      const startX = cx - straightLen / 2;
      const startY = cy + r;

      // Draw displacement arrow from start to current runner
      const dispPx = Math.hypot(runnerX - startX, runnerY - startY);
      if (dispPx > 4) {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(runnerX, runnerY);
        ctx.stroke();
      }

      // Runner Avatar
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(runnerX, runnerY, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Telemetry (scaled to 400m lap)
      const totalDist = Math.round(this.t * 400);
      const dispMeters = Math.round((dispPx / perimeter) * 400);

      const dEl = document.getElementById('case-val-dist');
      const pEl = document.getElementById('case-val-disp');
      if (dEl) dEl.textContent = `${totalDist} m`;
      if (pEl) pEl.textContent = `${dispMeters} m`;

    } else {
      // Case B: Straight Line Dragster
      const startX = 60;
      const endX = w - 60;
      const y = h / 2;

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
      ctx.stroke();

      const runnerX = startX + (endX - startX) * this.t;

      // Displacement & Distance arrow
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(runnerX, y);
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(runnerX, y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      const totalDist = Math.round(this.t * 400);
      const dEl = document.getElementById('case-val-dist');
      const pEl = document.getElementById('case-val-disp');
      if (dEl) dEl.textContent = `${totalDist} m`;
      if (pEl) pEl.textContent = `+${totalDist} m (Forward)`;
    }
  }
};

// -------------------------------------------------------------
// SLIDE 7: 2D Displacement Vectors & Quadrants
// -------------------------------------------------------------
const Quadrant2DSim = {
  canvas: null,
  ctx: null,
  point: { x: 3, y: 4 }, // in grid units
  isDragging: false,

  init() {
    this.canvas = document.getElementById('canvas-2d-quadrant');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.setupListeners();
    this.draw();
  },

  setupListeners() {
    const canvas = this.canvas;
    const getGridPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const px = (clientX - rect.left) * (canvas.width / rect.width);
      const py = (clientY - rect.top) * (canvas.height / rect.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const scale = 26; // 26 px per grid unit
      return {
        x: Math.round((px - cx) / scale),
        y: Math.round(-(py - cy) / scale)
      };
    };

    const startDrag = (e) => {
      e.preventDefault();
      SoundFX.playClick();
      this.isDragging = true;
      const g = getGridPos(e);
      this.point = { x: Math.max(-6, Math.min(6, g.x)), y: Math.max(-5, Math.min(5, g.y)) };
      this.draw();
    };

    const moveDrag = (e) => {
      if (!this.isDragging) return;
      e.preventDefault();
      const g = getGridPos(e);
      this.point = { x: Math.max(-6, Math.min(6, g.x)), y: Math.max(-5, Math.min(5, g.y)) };
      this.draw();
    };

    const endDrag = () => {
      this.isDragging = false;
    };

    canvas.addEventListener('mousedown', startDrag);
    window.addEventListener('mousemove', moveDrag);
    window.addEventListener('mouseup', endDrag);

    canvas.addEventListener('touchstart', startDrag, { passive: false });
    window.addEventListener('touchmove', moveDrag, { passive: false });
    window.addEventListener('touchend', endDrag);
  },

  draw() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    ctx.clearRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;
    const scale = 26;

    // Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
    ctx.lineWidth = 1;
    for (let x = -8; x <= 8; x++) {
      ctx.beginPath();
      ctx.moveTo(cx + x * scale, 0);
      ctx.lineTo(cx + x * scale, h);
      ctx.stroke();
    }
    for (let y = -6; y <= 6; y++) {
      ctx.beginPath();
      ctx.moveTo(0, cy + y * scale);
      ctx.lineTo(w, cy + y * scale);
      ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    // X Axis
    ctx.beginPath();
    ctx.moveTo(0, cy);
    ctx.lineTo(w, cy);
    ctx.stroke();
    // Y Axis
    ctx.beginPath();
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, h);
    ctx.stroke();

    // Quadrant Watermarks
    ctx.font = 'bold 16px Outfit, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.textAlign = 'center';
    ctx.fillText('Quadrant I (+, +)', cx + w * 0.25, cy - h * 0.25);
    ctx.fillText('Quadrant II (-, +)', cx - w * 0.25, cy - h * 0.25);
    ctx.fillText('Quadrant III (-, -)', cx - w * 0.25, cy + h * 0.25);
    ctx.fillText('Quadrant IV (+, -)', cx + w * 0.25, cy + h * 0.25);

    const targetPx = {
      x: cx + this.point.x * scale,
      y: cy - this.point.y * scale
    };

    // Draw Δx horizontal leg (Amber)
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(targetPx.x, cy);
    ctx.stroke();

    // Draw Δy vertical leg (Emerald)
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(targetPx.x, cy);
    ctx.lineTo(targetPx.x, targetPx.y);
    ctx.stroke();

    // Draw Resultant Displacement Vector Δr (Cyan)
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(targetPx.x, targetPx.y);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Arrowhead on Δr
    const lenPx = Math.hypot(targetPx.x - cx, targetPx.y - cy);
    if (lenPx > 10) {
      const a = Math.atan2(targetPx.y - cy, targetPx.x - cx);
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(targetPx.x, targetPx.y);
      ctx.lineTo(targetPx.x - 12 * Math.cos(a - Math.PI / 6), targetPx.y - 12 * Math.sin(a - Math.PI / 6));
      ctx.lineTo(targetPx.x - 12 * Math.cos(a + Math.PI / 6), targetPx.y - 12 * Math.sin(a + Math.PI / 6));
      ctx.closePath();
      ctx.fill();
    }

    // Draggable Point Handle
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(targetPx.x, targetPx.y, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Origin Pin
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fill();

    // Identify Quadrant
    let quad = 'On Axis';
    if (this.point.x > 0 && this.point.y > 0) quad = 'Quadrant I (Δx > 0, Δy > 0)';
    else if (this.point.x < 0 && this.point.y > 0) quad = 'Quadrant II (Δx < 0, Δy > 0)';
    else if (this.point.x < 0 && this.point.y < 0) quad = 'Quadrant III (Δx < 0, Δy < 0)';
    else if (this.point.x > 0 && this.point.y < 0) quad = 'Quadrant IV (Δx > 0, Δy < 0)';

    // Update Telemetry
    const dxEl = document.getElementById('quad-dx-val');
    const dyEl = document.getElementById('quad-dy-val');
    const qBadge = document.getElementById('quad-active-badge');

    if (dxEl) dxEl.textContent = `${this.point.x > 0 ? '+' : ''}${this.point.x} m`;
    if (dyEl) dyEl.textContent = `${this.point.y > 0 ? '+' : ''}${this.point.y} m`;
    if (qBadge) qBadge.textContent = quad;
  }
};

// -------------------------------------------------------------
// SLIDE 8: Magnitude & Direction Calculator (Pythagorean & Trig)
// -------------------------------------------------------------
const Vector2DCalc = {
  dx: -3,
  dy: -4,

  init() {
    const inputX = document.getElementById('input-calc-dx');
    const inputY = document.getElementById('input-calc-dy');
    const btnPresetExample = document.getElementById('btn-calc-preset-example');

    if (inputX) {
      inputX.addEventListener('input', () => {
        this.dx = parseFloat(inputX.value) || 0;
        this.update();
      });
    }

    if (inputY) {
      inputY.addEventListener('input', () => {
        this.dy = parseFloat(inputY.value) || 0;
        this.update();
      });
    }

    if (btnPresetExample) {
      btnPresetExample.addEventListener('click', () => {
        SoundFX.playClick();
        this.dx = -3;
        this.dy = -4;
        if (inputX) inputX.value = -3;
        if (inputY) inputY.value = -4;
        this.update();
      });
    }

    this.update();
  },

  update() {
    // 1. Magnitude calculation: |Δr| = √(Δx² + Δy²)
    const mag = Math.hypot(this.dx, this.dy).toFixed(2);
    const dxSq = (this.dx * this.dx).toFixed(1);
    const dySq = (this.dy * this.dy).toFixed(1);
    const sumSq = (this.dx * this.dx + this.dy * this.dy).toFixed(1);

    // 2. Reference Angle θ_ref = tan⁻¹(|Δy| / |Δx|)
    let refDeg = 0;
    if (Math.abs(this.dx) > 0.0001) {
      refDeg = (Math.atan(Math.abs(this.dy) / Math.abs(this.dx)) * 180 / Math.PI).toFixed(1);
    } else {
      refDeg = 90.0;
    }

    // 3. Standard Compass / Cartesian Angle (0° to 360°)
    let standardAngle = (Math.atan2(this.dy, this.dx) * 180 / Math.PI);
    if (standardAngle < 0) standardAngle += 360;
    standardAngle = standardAngle.toFixed(0);

    // 4. Direction Description
    let dirDesc = '';
    if (this.dx < 0 && this.dy < 0) {
      dirDesc = `${refDeg}° South of West (${standardAngle}° standard)`;
    } else if (this.dx > 0 && this.dy > 0) {
      dirDesc = `${refDeg}° North of East (${standardAngle}° standard)`;
    } else if (this.dx < 0 && this.dy > 0) {
      dirDesc = `${refDeg}° North of West (${standardAngle}° standard)`;
    } else if (this.dx > 0 && this.dy < 0) {
      dirDesc = `${refDeg}° South of East (${standardAngle}° standard)`;
    } else if (this.dx === 0 && this.dy > 0) {
      dirDesc = `Due North (90°)`;
    } else if (this.dx === 0 && this.dy < 0) {
      dirDesc = `Due South (270°)`;
    } else if (this.dy === 0 && this.dx > 0) {
      dirDesc = `Due East (0°)`;
    } else if (this.dy === 0 && this.dx < 0) {
      dirDesc = `Due West (180°)`;
    }

    // Update DOM Math steps
    const elMagResult = document.getElementById('calc-output-mag');
    const elDirResult = document.getElementById('calc-output-dir');
    const elStepSq = document.getElementById('calc-step-sumsq');
    const elStepRef = document.getElementById('calc-step-ref');

    if (elMagResult) elMagResult.textContent = `${mag} m`;
    if (elDirResult) elDirResult.textContent = dirDesc;
    if (elStepSq) elStepSq.textContent = `√(${this.dx}² + ${this.dy}²) = √(${dxSq} + ${dySq}) = √${sumSq} = ${mag} m`;
    if (elStepRef) elStepRef.textContent = `tan⁻¹(|${this.dy}| / |${this.dx}|) = tan⁻¹(${Math.abs(this.dy)} / ${Math.abs(this.dx)}) = ${refDeg}°`;
  }
};

// -------------------------------------------------------------
// SLIDE 9: Delivery Van vs GPS Drone Simulation
// -------------------------------------------------------------
const OdometerDroneSim = {
  canvas: null,
  ctx: null,
  t: 0,
  animId: null,

  init() {
    this.canvas = document.getElementById('canvas-odometer-drone');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    const run = () => {
      this.t = (this.t + 0.005) % 1;
      this.draw();
      this.animId = requestAnimationFrame(run);
    };
    run();
  },

  draw() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    ctx.clearRect(0, 0, w, h);

    const start = { x: 60, y: h - 60 };
    const end = { x: w - 60, y: 60 };

    // City grid streets
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 14;
    ctx.strokeRect(60, 60, w - 120, h - 120);

    // Grid blocks inside
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 2;
    const midX = w / 2;
    const midY = h / 2;
    ctx.strokeRect(60, 60, midX - 60, midY - 60);
    ctx.strokeRect(midX, 60, midX - 60, midY - 60);
    ctx.strokeRect(60, midY, midX - 60, midY - 60);
    ctx.strokeRect(midX, midY, midX - 60, midY - 60);

    // 1. Delivery Drone Straight-Line Path (Displacement)
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Drone current position
    const droneX = start.x + (end.x - start.x) * this.t;
    const droneY = start.y + (end.y - start.y) * this.t;
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(droneX, droneY, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = '10px Outfit, sans-serif';
    ctx.fillText('Drone (Displacement)', droneX - 30, droneY - 12);

    // 2. Delivery Van Path along Streets (East then North: Manhattan distance)
    const cornerX = end.x;
    const cornerY = start.y;
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.8)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(cornerX, cornerY);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();

    // Van current position
    let vanX, vanY;
    if (this.t < 0.5) {
      const p = this.t / 0.5;
      vanX = start.x + (cornerX - start.x) * p;
      vanY = start.y;
    } else {
      const p = (this.t - 0.5) / 0.5;
      vanX = cornerX;
      vanY = cornerY + (end.y - cornerY) * p;
    }

    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(vanX, vanY, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillText('Van (Odometer)', vanX - 25, vanY + 18);

    // Depot & Destination Markers
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(start.x, start.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillText('Depot', start.x - 12, start.y + 18);

    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(end.x, end.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillText('Delivery', end.x - 15, end.y - 12);
  }
};

// -------------------------------------------------------------
// SLIDE 10: Interactive Problem & Audience Q&A
// -------------------------------------------------------------
const AudienceCheck = {
  init() {
    const form = document.getElementById('audience-check-form');
    const resultBox = document.getElementById('audience-check-result');
    if (!form || !resultBox) return;

    form.addEventListener('change', (e) => {
      const selected = form.querySelector('input[name="lap-answer"]:checked');
      if (!selected) return;

      const val = selected.value;
      if (val === 'correct') {
        SoundFX.playSuccess();
        triggerConfettiCelebration();
        resultBox.className = 'mt-4 p-4 rounded-xl border border-emerald-500/40 bg-emerald-950/60 text-emerald-200 text-xs leading-relaxed';
        resultBox.innerHTML = `
          <div class="font-bold text-sm text-emerald-300 flex items-center gap-1.5 mb-1">
            <span>🎉</span> <span>Outstanding! That is 100% Correct!</span>
          </div>
          <p><strong>Total Distance:</strong> 4 laps &times; 400 m = <strong>1600 m</strong> (every single meter walked is tracked on the odometer).</p>
          <p class="mt-1"><strong>Net Displacement:</strong> <strong>0 m</strong> because after exactly 4 full laps, the runner returns to the exact starting line (initial position = final position, so &Delta;x = x_f - x_i = 0).</p>
        `;
      } else {
        SoundFX.playClick();
        resultBox.className = 'mt-4 p-4 rounded-xl border border-rose-500/40 bg-rose-950/60 text-rose-200 text-xs leading-relaxed';
        resultBox.innerHTML = `
          <div class="font-bold text-sm text-rose-300 flex items-center gap-1.5 mb-1">
            <span>❌</span> <span>Not quite — review the definitions:</span>
          </div>
          <p>Remember that <strong>distance</strong> accumulates for every turn and lap (4 &times; 400 m = 1600 m). But <strong>displacement</strong> depends <em>only</em> on the straight line from starting point to ending point. Since the runner finished where they started, net displacement is 0 m!</p>
        `;
      }
    });

    // Misconceptions Accordion
    const faqButtons = document.querySelectorAll('.faq-accordion-toggle');
    faqButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        SoundFX.playClick();
        const content = btn.nextElementSibling;
        const icon = btn.querySelector('.faq-icon');
        if (content) {
          const isHidden = content.classList.toggle('hidden');
          if (icon) icon.textContent = isHidden ? '+' : '&minus;';
        }
      });
    });
  }
};

// Run everything on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  HeroCanvas.init();
  QuantitiesLab.init();
  DistanceTrailSim.init();
  DisplacementTrailSim.init();
  NumberLine1D.init();
  SpecialCasesSim.init();
  Quadrant2DSim.init();
  Vector2DCalc.init();
  OdometerDroneSim.init();
  AudienceCheck.init();
});
