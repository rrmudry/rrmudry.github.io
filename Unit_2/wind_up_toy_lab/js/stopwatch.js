/**
 * PrecisionStopwatch - High-accuracy digital stopwatch engine
 * Wind-Up Toy Speed Lab
 */
class PrecisionStopwatch {
  constructor(displayId, controls = {}) {
    this.displayEl = document.getElementById(displayId);
    this.btnToggle = document.getElementById(controls.toggleBtnId || 'btn-stopwatch-toggle');
    this.btnReset = document.getElementById(controls.resetBtnId || 'btn-stopwatch-reset');
    this.btnRecord = document.getElementById(controls.recordBtnId || 'btn-stopwatch-record');

    this.isRunning = false;
    this.startTime = 0;
    this.elapsedTime = 0;
    this.animFrameId = null;

    this.init();
  }

  init() {
    if (this.btnToggle) {
      this.btnToggle.addEventListener('click', () => this.toggle());
    }
    if (this.btnReset) {
      this.btnReset.addEventListener('click', () => this.reset());
    }
    if (this.btnRecord) {
      this.btnRecord.addEventListener('click', () => this.recordCurrentTime());
    }

    // Spacebar shortcut to Start/Stop stopwatch
    window.addEventListener('keydown', (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      if (e.code === 'Space') {
        e.preventDefault();
        this.toggle();
      }
    });

    this.updateDisplay(0);
  }

  toggle() {
    if (this.isRunning) {
      this.stop();
    } else {
      this.start();
    }
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.startTime = performance.now() - this.elapsedTime;
    if (window.labSound) window.labSound.playStopwatchStart();

    if (this.btnToggle) {
      this.btnToggle.innerHTML = '<span>⏸️</span> <span>Stop (Space)</span>';
      this.btnToggle.classList.remove('bg-emerald-600', 'hover:bg-emerald-500');
      this.btnToggle.classList.add('bg-rose-600', 'hover:bg-rose-500');
    }

    const tick = () => {
      if (!this.isRunning) return;
      this.elapsedTime = performance.now() - this.startTime;
      this.updateDisplay(this.elapsedTime);
      this.animFrameId = requestAnimationFrame(tick);
    };
    this.animFrameId = requestAnimationFrame(tick);
  }

  stop() {
    if (!this.isRunning) return;
    this.isRunning = false;
    cancelAnimationFrame(this.animFrameId);
    if (window.labSound) window.labSound.playStopwatchStop();

    if (this.btnToggle) {
      this.btnToggle.innerHTML = '<span>▶️</span> <span>Start (Space)</span>';
      this.btnToggle.classList.remove('bg-rose-600', 'hover:bg-rose-500');
      this.btnToggle.classList.add('bg-emerald-600', 'hover:bg-emerald-500');
    }
  }

  reset() {
    this.stop();
    this.elapsedTime = 0;
    this.updateDisplay(0);
    if (window.labSound) window.labSound.playClick();
  }

  updateDisplay(ms) {
    if (!this.displayEl) return;
    const totalSeconds = ms / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const hundredths = Math.floor((ms % 1000) / 10);

    const minStr = String(minutes).padStart(2, '0');
    const secStr = String(seconds).padStart(2, '0');
    const hunStr = String(hundredths).padStart(2, '0');

    this.displayEl.textContent = `${minStr}:${secStr}.${hunStr}`;
  }

  getSeconds() {
    return parseFloat((this.elapsedTime / 1000).toFixed(2));
  }

  recordCurrentTime() {
    const seconds = this.getSeconds();
    if (seconds <= 0) {
      alert("Please start and time the toy before recording!");
      return;
    }
    if (window.labEngine) {
      window.labEngine.fillActiveTrial(seconds);
    }
  }
}

window.PrecisionStopwatch = PrecisionStopwatch;
