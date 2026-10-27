// Impact Velocity & Vector Angle Workbench — Main Application Controller
// Strictly NO LaTeX syntax
// g = 10 m/s² Earth standard gravity

(function () {
  const { CalculationEngine, Scenarios, SoundFX, ImpactSimCanvas } = window;
  const { fmtExact, fmtAns, checkField } = CalculationEngine;

  class ImpactWorkbenchApp {
    constructor() {
      this.currentLevelIndex = 0;
      this.activeScenario = null;
      this.activeField = null;
      this.completedLevels = new Set();
      this.hintsUsed = 0;
      this.isSandbox = false;

      this.initDom();
      this.initSim();
      this.initCalculator();
      this.initEvents();
      this.loadLevel(0);
    }

    initDom() {
      // Inputs
      this.inputs = {
        dy: document.getElementById('inputDy'),
        t: document.getElementById('inputT'),
        vx: document.getElementById('inputVx'),
        dx: document.getElementById('inputDx'),
        vy: document.getElementById('inputVy'),
        v: document.getElementById('inputV'),
        theta: document.getElementById('inputTheta')
      };

      // Indicators
      this.indicators = {
        dy: document.getElementById('checkDy'),
        t: document.getElementById('checkT'),
        vx: document.getElementById('checkVx'),
        dx: document.getElementById('checkDx'),
        vy: document.getElementById('checkVy'),
        v: document.getElementById('checkV'),
        theta: document.getElementById('checkTheta')
      };

      // Controls & Display elements
      this.levelSelect = document.getElementById('levelSelect');
      this.levelBadge = document.getElementById('levelBadge');
      this.levelTitle = document.getElementById('levelTitle');
      this.levelDots = document.getElementById('levelDots');
      this.questionSubtitle = document.getElementById('questionSubtitle');
      this.feedbackBox = document.getElementById('feedbackBox');
      this.btnLaunch = document.getElementById('btnLaunch');
      this.btnCheck = document.getElementById('btnCheck');
      this.btnHint = document.getElementById('btnHint');
      this.btnReveal = document.getElementById('btnReveal');
      this.btnReadToMe = document.getElementById('btnReadToMe');
      this.btnTheme = document.getElementById('btnTheme');
      this.btnProjector = document.getElementById('btnProjector');
      this.btnMute = document.getElementById('btnMute');
      this.btnCalcToggle = document.getElementById('btnCalcToggle');
      this.btnCalcClose = document.getElementById('btnCalcClose');
      this.btnCalcClear = document.getElementById('btnCalcClear');
      this.calcModal = document.getElementById('calcModal');
      this.btnZoomVectors = document.getElementById('btnZoomVectors');
      this.targetPosDisplay = document.getElementById('targetPosDisplay');
      this.btnTargetMinus = document.getElementById('btnTargetMinus');
      this.btnTargetPlus = document.getElementById('btnTargetPlus');
      this.chkStrobe = document.getElementById('chkStrobe');
      this.lblStrobe = document.getElementById('lblStrobe');
      this.speedButtons = document.querySelectorAll('.speed-btn');

      // Time scrubber & PiP controls
      this.timeSlider = document.getElementById('timeSlider');
      this.timeScrubReadout = document.getElementById('timeScrubReadout');
      this.btnScrubPlay = document.getElementById('btnScrubPlay');
      this.btnScrubReset = document.getElementById('btnScrubReset');
      this.btnScrubStepBack = document.getElementById('btnScrubStepBack');
      this.btnScrubStepFwd = document.getElementById('btnScrubStepFwd');
      this.btnTogglePip = document.getElementById('btnTogglePip');

      // Sandbox sliders
      this.sliderDy = document.getElementById('sliderDy');
      this.sliderVx = document.getElementById('sliderVx');
      this.valSliderDy = document.getElementById('valSliderDy');
      this.valSliderVx = document.getElementById('valSliderVx');

      // Populate level selector
      Scenarios.PRESET_LEVELS.forEach((lvl, i) => {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = `${lvl.title} (${lvl.isHonors ? 'Honors' : 'Standard'})`;
        this.levelSelect.appendChild(opt);
      });
      const optRand = document.createElement('option');
      optRand.value = 'random';
      optRand.textContent = '⚡ Infinite Random Challenge';
      this.levelSelect.appendChild(optRand);

      const optSand = document.createElement('option');
      optSand.value = 'sandbox';
      optSand.textContent = '🔬 Interactive Vector Sandbox';
      this.levelSelect.appendChild(optSand);
    }

    initSim() {
      const canvasEl = document.getElementById('simCanvas');
      this.sim = new ImpactSimCanvas(canvasEl);
      this.sim.onTimeUpdate = (t, maxT) => {
        if (this.timeSlider) {
          this.timeSlider.value = t;
        }
        if (this.timeScrubReadout) {
          this.timeScrubReadout.textContent = `t = ${t.toFixed(2)} s / ${fmtAns(maxT)} s`;
        }
        if (this.btnScrubPlay) {
          this.btnScrubPlay.textContent = this.sim.flight && this.sim.flight.active ? '⏸ Pause' : '▶ Play';
        }
        if (t >= maxT && this.btnLaunch) {
          this.btnLaunch.disabled = false;
        }
      };
    }

    initCalculator() {
      this.desmosCalc = null;
      if (this.btnCalcClear) {
        this.btnCalcClear.addEventListener('click', () => {
          if (this.desmosCalc && this.desmosCalc.setBlank) {
            this.desmosCalc.setBlank();
          }
        });
      }
    }

    toggleCalculator(force) {
      const open = force !== undefined ? force : !this.calcModal.classList.contains('open');
      if (open) {
        this.calcModal.classList.add('open');
        const container = document.getElementById('calcContainer');
        if (!window.Desmos) {
          container.innerHTML = '<p class="calc-missing" style="padding: 1.5rem; color: var(--text-dim); font-style: italic;">The Desmos calculator did not load. Please check your network connection.</p>';
          return;
        }
        if (!this.desmosCalc) {
          try {
            this.desmosCalc = Desmos.ScientificCalculator(container, {
              degreeMode: true,
              invertedColors: document.documentElement.classList.contains('theme-dark'),
              fontSize: Desmos.FontSizes ? Desmos.FontSizes.LARGE : undefined
            });
          } catch (e) {
            console.error('Failed to mount Desmos calculator:', e);
          }
        } else if (this.desmosCalc.resize) {
          this.desmosCalc.resize();
        }
      } else {
        this.calcModal.classList.remove('open');
      }
    }

    initEvents() {
      // Input focus tracking
      Object.entries(this.inputs).forEach(([key, input]) => {
        if (!input) return;
        input.addEventListener('focus', () => {
          this.activeField = key;
        });
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            this.checkCurrentAnswers();
          }
        });
      });

      // Level select change
      this.levelSelect.addEventListener('change', (e) => {
        SoundFX.play('click');
        const val = e.target.value;
        if (val === 'random') {
          this.loadScenario(Scenarios.generateRandomScenario());
        } else if (val === 'sandbox') {
          this.enterSandboxMode();
        } else {
          this.loadLevel(parseInt(val, 10));
        }
      });

      // Launch button
      this.btnLaunch.addEventListener('click', () => {
        SoundFX.play('launch');
        this.btnLaunch.disabled = true;
        this.sim.launch(() => {
          SoundFX.play('impact');
          this.btnLaunch.disabled = false;
        });
      });

      // Check button
      this.btnCheck.addEventListener('click', () => {
        this.checkCurrentAnswers();
      });

      // Show Hint button
      this.btnHint.addEventListener('click', () => {
        this.provideHint();
      });

      // Reveal Steps button
      this.btnReveal.addEventListener('click', () => {
        this.revealWorkedSolution();
      });

      // Read to me (speech synthesis)
      this.btnReadToMe.addEventListener('click', () => {
        this.speakQuestionPrompt();
      });

      // Theme toggle
      this.btnTheme.addEventListener('click', () => {
        SoundFX.play('click');
        const isDark = document.documentElement.classList.toggle('theme-dark');
        localStorage.setItem('impact_theme', isDark ? 'dark' : 'light');
        this.sim.refreshPalette();
        if (this.desmosCalc && this.desmosCalc.updateSettings) {
          this.desmosCalc.updateSettings({ invertedColors: isDark });
        }
      });

      // Projector mode toggle
      this.btnProjector.addEventListener('click', () => {
        SoundFX.play('click');
        const isProj = document.documentElement.classList.toggle('projector');
        this.btnProjector.classList.toggle('active', isProj);
        this.sim.refreshPalette();
        if (this.desmosCalc && this.desmosCalc.resize) {
          this.desmosCalc.resize();
        }
      });

      // Mute toggle
      this.btnMute.addEventListener('click', () => {
        const muted = SoundFX.toggleMute();
        this.btnMute.textContent = muted ? '🔇 Unmute' : '🔊 Sound FX';
      });

      // Calculator toggle & close
      this.btnCalcToggle.addEventListener('click', () => {
        SoundFX.play('click');
        this.toggleCalculator();
      });
      this.btnCalcClose.addEventListener('click', () => {
        SoundFX.play('click');
        this.toggleCalculator(false);
      });

      // Magnified Vector Inspector toggle
      this.btnZoomVectors.addEventListener('click', () => {
        SoundFX.play('click');
        const active = this.sim.toggleZoom();
        this.btnZoomVectors.classList.toggle('active', active);
        this.btnZoomVectors.textContent = active ? '🔍 Exit Zoom' : '🔍 Vector Triangle Zoom';
      });

      // Time scrubber slider (real-time scrubbing)
      if (this.timeSlider) {
        this.timeSlider.addEventListener('input', (e) => {
          const tVal = parseFloat(e.target.value);
          this.sim.setTime(tVal);
        });
      }

      // Scrubber Play / Pause toggle
      if (this.btnScrubPlay) {
        this.btnScrubPlay.addEventListener('click', () => {
          SoundFX.play('click');
          const isPlaying = this.sim.togglePlay(() => {
            SoundFX.play('impact');
            this.btnLaunch.disabled = false;
          });
          this.btnScrubPlay.textContent = isPlaying ? '⏸ Pause' : '▶ Play';
        });
      }

      // Scrubber Reset to t = 0
      if (this.btnScrubReset) {
        this.btnScrubReset.addEventListener('click', () => {
          SoundFX.play('click');
          this.sim.setTime(0);
          this.btnLaunch.disabled = false;
        });
      }

      // Step Back -0.05s
      if (this.btnScrubStepBack) {
        this.btnScrubStepBack.addEventListener('click', () => {
          SoundFX.play('click');
          const curT = this.sim.flight ? this.sim.flight.t : 0;
          this.sim.setTime(curT - 0.05);
        });
      }

      // Step Forward +0.05s
      if (this.btnScrubStepFwd) {
        this.btnScrubStepFwd.addEventListener('click', () => {
          SoundFX.play('click');
          const curT = this.sim.flight ? this.sim.flight.t : 0;
          this.sim.setTime(curT + 0.05);
        });
      }

      // PiP toggle
      if (this.btnTogglePip) {
        this.btnTogglePip.addEventListener('click', () => {
          SoundFX.play('click');
          const active = this.sim.togglePip();
          this.btnTogglePip.classList.toggle('active', active);
        });
      }

      // Bucket target adjustment buttons
      this.btnTargetMinus.addEventListener('click', () => {
        this.adjustTarget(-0.1);
      });
      this.btnTargetPlus.addEventListener('click', () => {
        this.adjustTarget(0.1);
      });

      // Strobe ghosts checkbox
      this.chkStrobe.addEventListener('change', (e) => {
        this.sim.showStrobe = e.target.checked;
        this.sim.draw();
      });

      // Speed selection buttons
      this.speedButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          SoundFX.play('click');
          this.speedButtons.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.sim.playbackSpeed = parseFloat(btn.dataset.speed || '1.0');
        });
      });

      // Sandbox slider listeners
      if (this.sliderDy && this.sliderVx) {
        const updateFromSliders = () => {
          const dy = parseFloat(this.sliderDy.value);
          const vx = parseFloat(this.sliderVx.value);
          this.valSliderDy.textContent = `${dy.toFixed(1)} m`;
          this.valSliderVx.textContent = `${vx.toFixed(1)} m/s`;
          const custom = Scenarios.buildScenario({
            id: 'sandbox_custom',
            title: `Sandbox: Δy = ${dy} m, v<sub>x</sub> = ${vx} m/s`,
            subtitle: 'Real-time 2D projectile & impact vector triangle simulator.',
            dy,
            vx,
            badge: '🔬 SANDBOX'
          });
          this.loadScenario(custom, true);
        };
        this.sliderDy.addEventListener('input', updateFromSliders);
        this.sliderVx.addEventListener('input', updateFromSliders);
      }

      // Check saved theme
      if (localStorage.getItem('impact_theme') === 'dark') {
        document.documentElement.classList.add('theme-dark');
        this.sim.refreshPalette();
      }
    }

    loadLevel(index) {
      this.isSandbox = false;
      this.currentLevelIndex = index;
      this.levelSelect.value = index;
      const sc = Scenarios.PRESET_LEVELS[index];
      this.loadScenario(sc);
    }

    loadScenario(sc, isSandboxUpdate = false) {
      this.activeScenario = sc;
      this.hintsUsed = 0;
      this.btnHint.textContent = 'Show a hint (3 left)';
      this.feedbackBox.className = 'feedback-box';
      this.feedbackBox.innerHTML = '';

      // Update header
      this.levelBadge.textContent = sc.badge || (sc.isHonors ? '★ HONORS' : 'Standard');
      this.levelTitle.textContent = sc.title;
      this.questionSubtitle.textContent = sc.subtitle;

      // Render dots
      this.renderProgressDots();

      // Populate Given values
      this.inputs.dy.value = fmtExact(sc.dy);
      this.inputs.vx.value = fmtExact(sc.vx);
      this.indicators.dy.textContent = '✓';
      this.indicators.dy.className = 'check-indicator ok';
      this.indicators.vx.textContent = '✓';
      this.indicators.vx.className = 'check-indicator ok';

      // Clear student answer inputs if not sandbox
      if (!isSandboxUpdate) {
        ['t', 'dx', 'vy', 'v', 'theta'].forEach(k => {
          this.inputs[k].value = '';
          this.inputs[k].classList.remove('correct', 'incorrect');
          this.indicators[k].textContent = '?';
          this.indicators[k].className = 'check-indicator';
        });
        this.activeField = 't';
        this.inputs.t.focus();
      } else {
        // Auto-fill answers in sandbox mode for exploration
        ['t', 'dx', 'vy', 'v', 'theta'].forEach(k => {
          this.inputs[k].value = fmtAns(sc[k]);
          this.inputs[k].classList.add('correct');
          this.indicators[k].textContent = '✓';
          this.indicators[k].className = 'check-indicator ok';
        });
      }

      // Update target bucket position display
      this.targetPosDisplay.textContent = `${fmtExact(sc.dx)} m`;

      // Configure time scrubber bounds
      if (this.timeSlider) {
        this.timeSlider.min = 0;
        this.timeSlider.max = sc.t;
        this.timeSlider.step = Math.max(0.005, sc.t / 100);
        this.timeSlider.value = 0;
      }
      if (this.timeScrubReadout) {
        this.timeScrubReadout.textContent = `t = 0.00 s / ${fmtAns(sc.t)} s`;
      }
      if (this.btnScrubPlay) {
        this.btnScrubPlay.textContent = '▶ Play';
      }

      // Pass scenario to canvas
      this.sim.setScenario(sc);

      // Update strobe checkbox label with scenario dt
      if (this.lblStrobe && this.sim.strobeDt) {
        this.lblStrobe.textContent = `Strobe ghosts (Δt = ${fmtExact(this.sim.strobeDt())}s)`;
      }
    }

    enterSandboxMode() {
      this.isSandbox = true;
      const sandboxContainer = document.getElementById('sandboxPanel');
      if (sandboxContainer) {
        sandboxContainer.scrollIntoView({ behavior: 'smooth' });
      }
      const dy = parseFloat(this.sliderDy.value || '1.8');
      const vx = parseFloat(this.sliderVx.value || '4.0');
      const custom = Scenarios.buildScenario({
        id: 'sandbox_custom',
        title: `Vector Sandbox: Δy = ${dy} m, v<sub>x</sub> = ${vx} m/s`,
        subtitle: 'Drag the sliders below to see the impact vector triangle dynamically stretch and rotate.',
        dy,
        vx,
        badge: '🔬 SANDBOX'
      });
      this.loadScenario(custom, true);
    }

    renderProgressDots() {
      this.levelDots.innerHTML = '';
      Scenarios.PRESET_LEVELS.forEach((_, i) => {
        const dot = document.createElement('span');
        dot.className = 'dot';
        if (this.completedLevels.has(i)) {
          dot.classList.add('done');
        }
        if (i === this.currentLevelIndex && !this.isSandbox) {
          dot.classList.add('active');
        }
        this.levelDots.appendChild(dot);
      });
    }

    insertToActiveField(val) {
      if (!this.activeField || !this.inputs[this.activeField]) {
        // Default to first empty answer input
        const emptyKey = ['t', 'dx', 'vy', 'v', 'theta'].find(k => !this.inputs[k].value);
        if (emptyKey) {
          this.activeField = emptyKey;
        } else {
          this.activeField = 'theta';
        }
      }
      const targetInput = this.inputs[this.activeField];
      targetInput.value = val;
      targetInput.focus();
      SoundFX.play('click');
    }

    adjustTarget(delta) {
      SoundFX.play('click');
      let cur = parseFloat(this.targetPosDisplay.textContent) || this.activeScenario.dx;
      cur = Math.max(0, cur + delta);
      this.targetPosDisplay.textContent = `${cur.toFixed(2)} m`;
      // Update target position on canvas if applicable
      this.sim.targetBucketX = cur;
      this.sim.draw();
    }

    checkCurrentAnswers() {
      const sc = this.activeScenario;
      if (!sc) return;

      const fields = ['t', 'dx', 'vy', 'v', 'theta'];
      let allFilled = true;
      let allCorrect = true;
      let firstMistakeMsg = null;

      fields.forEach(field => {
        const input = this.inputs[field];
        const ind = this.indicators[field];
        const raw = input.value;

        if (!raw || !raw.trim()) {
          allFilled = false;
          input.classList.remove('correct', 'incorrect');
          ind.textContent = '?';
          ind.className = 'check-indicator';
          return;
        }

        const res = checkField(field, raw, sc);
        if (res.ok) {
          input.classList.add('correct');
          input.classList.remove('incorrect');
          ind.textContent = '✓';
          ind.className = 'check-indicator ok';
        } else {
          allCorrect = false;
          input.classList.add('incorrect');
          input.classList.remove('correct');
          ind.textContent = '✗';
          ind.className = 'check-indicator bad';
          if (!firstMistakeMsg) {
            firstMistakeMsg = res.msg;
          }
        }
      });

      if (!allFilled && allCorrect) {
        SoundFX.play('beep');
        this.showFeedback('info', 'Keep going! Enter values for all fields in the T-chart and Impact card.');
        return;
      }

      if (allCorrect) {
        SoundFX.play('fanfare');
        this.completedLevels.add(this.currentLevelIndex);
        this.renderProgressDots();
        this.showFeedback('success', `
          🎉 <strong>Spot-on accuracy!</strong> All motion variables and impact vector components verified.
          <div style="margin-top: 0.4rem;">
            Horizontal: <strong>v<sub>x</sub> = ${fmtExact(sc.vx)} m/s</strong> · Vertical: <strong>v<sub>y</sub> = ${fmtAns(sc.vy)} m/s</strong><br>
            Resultant Speed: <strong>v = ${fmtAns(sc.v)} m/s</strong> at <strong>θ = ${sc.theta.toFixed(1)}°</strong> below horizontal.
          </div>
        `);

        // Automatically launch projectile trajectory with impact celebration
        setTimeout(() => {
          this.btnLaunch.click();
        }, 350);
      } else {
        SoundFX.play('error');
        this.showFeedback('error', firstMistakeMsg || 'Double check your formulas and calculations.');
      }
    }

    showFeedback(type, html) {
      this.feedbackBox.className = `feedback-box active ${type}`;
      this.feedbackBox.innerHTML = html;
      this.feedbackBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    provideHint() {
      SoundFX.play('click');
      const sc = this.activeScenario;
      this.hintsUsed = (this.hintsUsed + 1) % 4;

      if (this.hintsUsed === 0) this.hintsUsed = 1;
      const left = 3 - this.hintsUsed;
      this.btnHint.textContent = `Show a hint (${left} left)`;

      const hints = [
        `<strong>Hint 1 (Vertical Time):</strong> Vertical motion starts with zero downward speed (v<sub>y0</sub> = 0). Use formula <code>t = √(Δy ÷ 5)</code>. Notice how horizontal speed does not affect fall time!`,
        `<strong>Hint 2 (Final Downward Speed):</strong> Gravity increases downward speed by 10 m/s each second. Use <code>v<sub>y</sub> = 10 × t</code>. Sideways speed <code>v<sub>x</sub> = ${fmtExact(sc.vx)} m/s</code> stays constant.`,
        `<strong>Hint 3 (Pythagorean Theorem & Angle):</strong> Combine horizontal and vertical speeds with <code>v = √(v<sub>x</sub>² + v<sub>y</sub>²)</code>. Then find angle <code>θ = tan⁻¹(v<sub>y</sub> ÷ v<sub>x</sub>)</code> in Degree mode!`
      ];

      this.showFeedback('info', hints[this.hintsUsed - 1]);
    }

    revealWorkedSolution() {
      SoundFX.play('beep');
      const sc = this.activeScenario;
      const html = `
        <div style="font-size: 0.95rem;">
          <strong>Worked Solutions for this Scenario:</strong>
          <ul style="margin: 0.5rem 0 0.5rem 1.2rem; display: flex; flex-direction: column; gap: 0.35rem;">
            <li><strong>Vertical Fall Time:</strong> ${CalculationEngine.work.t(sc)}</li>
            <li><strong>Horizontal Range (Δx = v<sub>x</sub> × t):</strong> ${CalculationEngine.work.dx(sc)}</li>
            <li><strong>Final Downward Speed (v<sub>y</sub>):</strong> ${CalculationEngine.work.vy(sc)}</li>
            <li><strong>Total Impact Speed (v):</strong> ${CalculationEngine.work.v(sc)}</li>
            <li><strong>Landing Angle θ:</strong> ${CalculationEngine.work.theta(sc)}</li>
          </ul>
        </div>
      `;
      this.showFeedback('info', html);
    }

    speakQuestionPrompt() {
      if (!('speechSynthesis' in window)) {
        alert('Text-to-speech is not supported by your browser.');
        return;
      }
      window.speechSynthesis.cancel();
      const sc = this.activeScenario;
      const text = `${sc.title}. Cliff height is ${sc.dy} meters. Launch speed is ${sc.vx} meters per second. Calculate fall time t, horizontal range delta x, final vertical velocity v y, resultant impact speed v, and impact angle theta below horizontal.`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  }

  // Auto-initialize when DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    window.workbenchApp = new ImpactWorkbenchApp();
  });
})();
