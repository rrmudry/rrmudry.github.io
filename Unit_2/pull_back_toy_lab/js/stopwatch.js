/**
 * PrecisionStopwatch - High-accuracy digital stopwatch engine with Fullscreen HUD
 * Pull-Back Toy Motion Lab
 */
class PrecisionStopwatch {
  constructor(displayId, controls = {}) {
    this.displayEl = document.getElementById(displayId);
    this.fsDisplayEl = document.getElementById('stopwatch-fullscreen-display');
    this.fsModal = document.getElementById('stopwatch-fullscreen-modal');

    this.btnToggle = document.getElementById(controls.toggleBtnId || 'btn-stopwatch-toggle');
    this.btnReset = document.getElementById(controls.resetBtnId || 'btn-stopwatch-reset');
    this.btnExpand = document.getElementById('btn-stopwatch-expand');

    // Fullscreen controls
    this.btnFsToggle = document.getElementById('btn-fs-toggle');
    this.btnFsReset = document.getElementById('btn-fs-reset');
    this.btnFsExit = document.getElementById('btn-fs-exit');
    this.btnFsTheme = document.getElementById('btn-fs-theme');

    this.isRunning = false;
    this.startTime = 0;
    this.elapsedTime = 0;
    this.animFrameId = null;

    this.init();
  }

  init() {
    // Card buttons
    if (this.btnToggle) this.btnToggle.onclick = () => this.toggle();
    if (this.btnReset) this.btnReset.onclick = () => this.reset();
    if (this.btnExpand) this.btnExpand.onclick = () => this.openFullscreen();

    // Fullscreen buttons
    if (this.btnFsToggle) this.btnFsToggle.onclick = () => this.toggle();
    if (this.btnFsReset) this.btnFsReset.onclick = () => this.reset();
    if (this.btnFsExit) this.btnFsExit.onclick = () => this.closeFullscreen();
    if (this.btnFsTheme) {
      this.btnFsTheme.onclick = () => {
        document.documentElement.classList.toggle('light');
        if (window.labEngine) window.labEngine.renderGraph();
      };
    }

    // Spacebar to start/stop, Esc to close fullscreen
    window.addEventListener('keydown', (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      if (e.code === 'Space') {
        e.preventDefault();
        this.toggle();
      } else if (e.code === 'Escape' && this.fsModal && !this.fsModal.classList.contains('hidden')) {
        this.closeFullscreen();
      }
    });

    this.updateDisplay(0);
  }

  openFullscreen() {
    if (this.fsModal) {
      this.fsModal.classList.remove('hidden');
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
      if (window.labSound) window.labSound.playClick();
    }
  }

  closeFullscreen() {
    if (this.fsModal) {
      this.fsModal.classList.add('hidden');
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      if (window.labSound) window.labSound.playClick();
    }
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
    if (window.labSound) window.labSound.playBeep();

    this.updateToggleButtons(true);

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
    if (window.labSound) window.labSound.playBeep();

    this.updateToggleButtons(false);
  }

  reset() {
    this.stop();
    this.elapsedTime = 0;
    this.updateDisplay(0);
    this.updateToggleButtons(false);
    if (window.labSound) window.labSound.playClick();
  }

  updateToggleButtons(isRunning) {
    // Card button
    if (this.btnToggle) {
      if (isRunning) {
        this.btnToggle.innerHTML = `<span>⏸️ Pause</span>`;
        this.btnToggle.className = 'px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm transition-all shadow-sm';
      } else {
        this.btnToggle.innerHTML = `<span>▶️ ${this.elapsedTime > 0 ? 'Resume' : 'Start'}</span>`;
        this.btnToggle.className = 'px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all shadow-sm';
      }
    }

    // Fullscreen button
    if (this.btnFsToggle) {
      if (isRunning) {
        this.btnFsToggle.innerHTML = `<span>⏸️ Pause Timer</span>`;
        this.btnFsToggle.className = 'py-4 sm:py-5 px-6 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xl sm:text-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3';
      } else {
        this.btnFsToggle.innerHTML = `<span>▶️ ${this.elapsedTime > 0 ? 'Resume Timer' : 'Start Timer'}</span>`;
        this.btnFsToggle.className = 'py-4 sm:py-5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xl sm:text-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3';
      }
    }
  }

  updateDisplay(ms) {
    const totalSec = ms / 1000;
    const minutes = Math.floor(totalSec / 60);
    const seconds = Math.floor(totalSec % 60);
    const hundredths = Math.floor((ms % 1000) / 10);

    const pad = (n) => String(n).padStart(2, '0');
    const timeStr = `${pad(minutes)}:${pad(seconds)}.${pad(hundredths)}`;

    if (this.displayEl) this.displayEl.textContent = timeStr;
    if (this.fsDisplayEl) this.fsDisplayEl.textContent = timeStr;
  }
}
