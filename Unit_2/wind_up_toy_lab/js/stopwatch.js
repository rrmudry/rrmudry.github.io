/**
 * PrecisionStopwatch - High-accuracy digital stopwatch engine
 * Wind-Up Toy Speed Lab
 * Enforces single-replication capture: each captured time can only fill ONE replication.
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
    this.hasBeenCaptured = false;

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
    this.updateRecordButtonState();
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
    this.hasBeenCaptured = false;
    this.startTime = performance.now() - this.elapsedTime;
    if (window.labSound) window.labSound.playStopwatchStart();

    if (this.btnToggle) {
      this.btnToggle.innerHTML = '<span>⏸️</span> <span>Stop (Space)</span>';
      this.btnToggle.classList.remove('bg-emerald-600', 'hover:bg-emerald-500');
      this.btnToggle.classList.add('bg-rose-600', 'hover:bg-rose-500');
    }

    this.updateRecordButtonState();

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

    this.updateRecordButtonState();
  }

  reset() {
    if (this.isRunning) {
      this.stop();
    }
    this.elapsedTime = 0;
    this.hasBeenCaptured = false;
    this.updateDisplay(0);
    this.updateRecordButtonState();
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

  updateRecordButtonState() {
    if (!this.btnRecord) return;
    if (this.hasBeenCaptured) {
      this.btnRecord.disabled = true;
      this.btnRecord.innerHTML = '<span>✓</span> <span>Recorded</span>';
      this.btnRecord.className = 'flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-slate-800 text-slate-400 text-xs font-bold transition-all border border-white/10 cursor-not-allowed flex items-center justify-center gap-1.5 opacity-60';
    } else if (this.elapsedTime <= 0) {
      this.btnRecord.disabled = true;
      this.btnRecord.innerHTML = '<span>📥</span> <span>Capture Time</span>';
      this.btnRecord.className = 'flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-slate-800 text-slate-500 text-xs font-bold transition-all border border-white/10 cursor-not-allowed flex items-center justify-center gap-1.5 opacity-50';
    } else {
      this.btnRecord.disabled = false;
      this.btnRecord.innerHTML = '<span>📥</span> <span>Capture Time</span>';
      this.btnRecord.className = 'flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer';
    }
  }

  recordCurrentTime() {
    // If still running, stop it to lock in the elapsed time
    if (this.isRunning) {
      this.stop();
    }

    const seconds = this.getSeconds();
    if (seconds <= 0) {
      alert("Please start the stopwatch and time the toy before recording!");
      return;
    }

    if (this.hasBeenCaptured) {
      alert("This measurement has already been recorded! Start or reset the stopwatch to measure your next replication.");
      return;
    }

    // Lock single-capture state
    this.hasBeenCaptured = true;
    this.updateRecordButtonState();

    if (window.labEngine) {
      window.labEngine.fillActiveTrial(seconds);
    }
  }
}

window.PrecisionStopwatch = PrecisionStopwatch;
