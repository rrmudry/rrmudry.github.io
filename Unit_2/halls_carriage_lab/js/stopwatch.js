/**
 * PrecisionStopwatch - High-accuracy digital stopwatch engine with Fullscreen HUD
 * Modified Atwood Hall's Carriage Lab
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
    if (window.labSound) window.labSound.playClick();
  }

  updateToggleButtons(isRunning) {
    const text = isRunning ? '⏸️ Pause' : '▶️ Start';
    const fsText = isRunning ? '⏸️ Pause Timer' : '▶️ Start Timer';
    const bgClass = isRunning ? 'bg-amber-600 hover:bg-amber-500' : 'bg-emerald-600 hover:bg-emerald-500';

    if (this.btnToggle) {
      this.btnToggle.innerHTML = text;
      this.btnToggle.className = `px-4 py-2 rounded-xl text-white font-bold text-sm transition-all shadow-sm ${bgClass}`;
    }

    if (this.btnFsToggle) {
      this.btnFsToggle.innerHTML = `<span>${fsText}</span>`;
      this.btnFsToggle.className = `py-4 sm:py-5 px-6 rounded-2xl text-white font-bold text-xl sm:text-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 ${bgClass}`;
    }
  }

  updateDisplay(ms) {
    const totalSeconds = ms / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const hundredths = Math.floor((ms % 1000) / 10);

    const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(hundredths).padStart(2, '0')}`;

    if (this.displayEl) {
      this.displayEl.textContent = formatted;
    }
    if (this.fsDisplayEl) {
      this.fsDisplayEl.textContent = formatted;
    }
  }

  getElapsedSeconds() {
    return +(this.elapsedTime / 1000).toFixed(2);
  }
}
