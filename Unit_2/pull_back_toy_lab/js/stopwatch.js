/**
 * PrecisionStopwatch - High-accuracy digital stopwatch engine
 * Pull-Back Toy Motion Lab
 */
class PrecisionStopwatch {
  constructor(displayId, controls = {}) {
    this.displayEl = document.getElementById(displayId);
    this.btnToggle = document.getElementById(controls.toggleBtnId || 'btn-stopwatch-toggle');
    this.btnReset = document.getElementById(controls.resetBtnId || 'btn-stopwatch-reset');
    this.btnLap = document.getElementById(controls.lapBtnId || 'btn-stopwatch-lap');
    this.lapsList = document.getElementById(controls.lapsListId || 'stopwatch-laps-list');

    this.isRunning = false;
    this.startTime = 0;
    this.elapsedTime = 0;
    this.animFrameId = null;
    this.laps = [];

    this.init();
  }

  init() {
    if (this.btnToggle) {
      this.btnToggle.addEventListener('click', () => this.toggle());
    }
    if (this.btnReset) {
      this.btnReset.addEventListener('click', () => this.reset());
    }
    if (this.btnLap) {
      this.btnLap.addEventListener('click', () => this.recordLap());
    }

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
    if (window.labSound) window.labSound.playBeep();

    if (this.btnToggle) {
      this.btnToggle.innerHTML = `<span>⏸️ Pause</span>`;
      this.btnToggle.classList.remove('bg-emerald-600', 'hover:bg-emerald-500');
      this.btnToggle.classList.add('bg-amber-600', 'hover:bg-amber-500');
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
    if (window.labSound) window.labSound.playBeep();

    if (this.btnToggle) {
      this.btnToggle.innerHTML = `<span>▶️ Resume</span>`;
      this.btnToggle.classList.remove('bg-amber-600', 'hover:bg-amber-500');
      this.btnToggle.classList.add('bg-emerald-600', 'hover:bg-emerald-500');
    }
  }

  reset() {
    this.stop();
    this.elapsedTime = 0;
    this.laps = [];
    this.updateDisplay(0);
    if (this.lapsList) this.lapsList.innerHTML = '';
    if (window.labSound) window.labSound.playClick();

    if (this.btnToggle) {
      this.btnToggle.innerHTML = `<span>▶️ Start</span>`;
      this.btnToggle.classList.remove('bg-amber-600', 'hover:bg-amber-500');
      this.btnToggle.classList.add('bg-emerald-600', 'hover:bg-emerald-500');
    }
  }

  recordLap() {
    if (this.elapsedTime === 0) return;
    const currentSeconds = (this.elapsedTime / 1000).toFixed(2);
    this.laps.push(currentSeconds);
    if (window.labSound) window.labSound.playClick();

    if (this.lapsList) {
      const lapNum = this.laps.length;
      const markerText = lapNum <= 5 ? ` [${(lapNum * 20)} cm]` : '';
      const lapEl = document.createElement('div');
      lapEl.className = 'flex justify-between items-center py-1 border-b border-white/5 font-mono text-xs';
      lapEl.innerHTML = `
        <span class="text-slate-400">Mark #${lapNum}${markerText}</span>
        <div class="flex items-center gap-2">
          <span class="font-bold text-sky-400">${currentSeconds} s</span>
          ${lapNum <= 5 ? `<button class="px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 hover:bg-sky-500/40 text-[10px]" onclick="window.labEngine.insertStopwatchTime(${lapNum}, ${currentSeconds})">Use</button>` : ''}
        </div>
      `;
      this.lapsList.prepend(lapEl);
    }
  }

  updateDisplay(ms) {
    if (!this.displayEl) return;
    const totalSec = ms / 1000;
    const minutes = Math.floor(totalSec / 60);
    const seconds = Math.floor(totalSec % 60);
    const hundredths = Math.floor((ms % 1000) / 10);

    const pad = (n) => String(n).padStart(2, '0');
    this.displayEl.textContent = `${pad(minutes)}:${pad(seconds)}.${pad(hundredths)}`;
  }
}
