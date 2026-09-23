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
    this.btnLap = document.getElementById(controls.lapBtnId || 'btn-stopwatch-lap');
    this.btnExpand = document.getElementById('btn-stopwatch-expand');

    // Fullscreen controls
    this.btnFsToggle = document.getElementById('btn-fs-toggle');
    this.btnFsLap = document.getElementById('btn-fs-lap');
    this.btnFsReset = document.getElementById('btn-fs-reset');
    this.btnFsExit = document.getElementById('btn-fs-exit');
    this.btnFsTheme = document.getElementById('btn-fs-theme');
    this.btnFsApply = document.getElementById('btn-fs-apply-table');
    this.fsSplitsStrip = document.getElementById('fs-splits-strip');
    this.fsLastSplitBadge = document.getElementById('fs-last-split-badge');
    this.fsLastSplitVal = document.getElementById('fs-last-split-val');

    this.lapsList = document.getElementById(controls.lapsListId || 'stopwatch-laps-list');

    this.isRunning = false;
    this.startTime = 0;
    this.elapsedTime = 0;
    this.animFrameId = null;
    this.laps = [];

    this.init();
  }

  init() {
    // Card buttons
    if (this.btnToggle) this.btnToggle.onclick = () => this.toggle();
    if (this.btnReset) this.btnReset.onclick = () => this.reset();
    if (this.btnLap) this.btnLap.onclick = () => this.recordLap();
    if (this.btnExpand) this.btnExpand.onclick = () => this.openFullscreen();

    // Fullscreen buttons
    if (this.btnFsToggle) this.btnFsToggle.onclick = () => this.toggle();
    if (this.btnFsReset) this.btnFsReset.onclick = () => this.reset();
    if (this.btnFsLap) this.btnFsLap.onclick = () => this.recordLap();
    if (this.btnFsExit) this.btnFsExit.onclick = () => this.closeFullscreen();
    if (this.btnFsApply) this.btnFsApply.onclick = () => this.applySplitsToTable();
    if (this.btnFsTheme) {
      this.btnFsTheme.onclick = () => {
        document.documentElement.classList.toggle('light');
        if (window.labEngine) window.labEngine.renderGraph();
      };
    }

    // Spacebar to start/stop
    window.addEventListener('keydown', (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      if (e.code === 'Space') {
        e.preventDefault();
        this.toggle();
      } else if (e.code === 'KeyL') {
        e.preventDefault();
        this.recordLap();
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
      this.renderFullscreenSplits();
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
    this.laps = [];
    this.updateDisplay(0);
    if (this.lapsList) this.lapsList.innerHTML = '';
    this.renderFullscreenSplits();
    if (this.fsLastSplitBadge) this.fsLastSplitBadge.classList.add('hidden');
    if (window.labSound) window.labSound.playClick();
  }

  updateToggleButtons(isRunning) {
    // Card button
    if (this.btnToggle) {
      if (isRunning) {
        this.btnToggle.innerHTML = `<span>⏸️ Pause</span>`;
        this.btnToggle.className = 'px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-all shadow-sm';
      } else {
        this.btnToggle.innerHTML = `<span>▶️ ${this.elapsedTime > 0 ? 'Resume' : 'Start'}</span>`;
        this.btnToggle.className = 'px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-sm';
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

  recordLap() {
    if (this.elapsedTime === 0) return;
    const currentSeconds = (this.elapsedTime / 1000).toFixed(2);
    this.laps.push(currentSeconds);
    if (window.labSound) window.labSound.playClick();

    const lapNum = this.laps.length;
    const markerIndex = lapNum - 1; // 0: Start(0cm), 1: 20cm, 2: 40cm, 3: 60cm, 4: 80cm, 5: 100cm
    let markerLabel = "";
    if (markerIndex === 0) markerLabel = "Start (0 cm)";
    else if (markerIndex >= 1 && markerIndex <= 5) markerLabel = `Mark ${markerIndex} (${markerIndex * 20} cm)`;
    else markerLabel = `Split #${lapNum}`;

    // Card lap list update
    if (this.lapsList) {
      const lapEl = document.createElement('div');
      lapEl.className = 'flex justify-between items-center py-1 border-b border-white/5 font-mono text-xs';
      lapEl.innerHTML = `
        <span class="text-slate-400 font-bold">${markerLabel}</span>
        <div class="flex items-center gap-2">
          <span class="font-bold text-sky-400">${currentSeconds} s</span>
          ${markerIndex <= 5 ? `<button class="px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 hover:bg-sky-500/40 text-[10px]" onclick="window.labEngine.insertStopwatchTime(${markerIndex}, ${currentSeconds})">Use</button>` : ''}
        </div>
      `;
      this.lapsList.prepend(lapEl);
    }

    // Fullscreen strip update
    this.renderFullscreenSplits();

    // Show last split badge
    if (this.fsLastSplitBadge && this.fsLastSplitVal) {
      this.fsLastSplitVal.textContent = `${currentSeconds} s (${markerLabel})`;
      this.fsLastSplitBadge.classList.remove('hidden');
    }
  }

  renderFullscreenSplits() {
    if (!this.fsSplitsStrip) return;
    if (this.laps.length === 0) {
      this.fsSplitsStrip.innerHTML = `<span class="text-slate-400 font-bold">Marks:</span> <span class="text-slate-500">No marks recorded yet. Tap "Split Mark" (or press 'L') at Start release, then at 20, 40, 60, 80, 100 cm.</span>`;
      return;
    }

    let html = `<span class="text-slate-300 font-bold mr-1">Marks:</span>`;
    this.laps.forEach((timeVal, idx) => {
      let mDist = "";
      if (idx === 0) mDist = "Start 0cm";
      else if (idx <= 5) mDist = `${idx * 20}cm`;
      else mDist = `S${idx + 1}`;
      html += `
        <span class="px-2.5 py-1 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/30 font-mono font-bold">
          ${mDist}: ${timeVal}s
        </span>
      `;
    });
    this.fsSplitsStrip.innerHTML = html;
  }

  applySplitsToTable() {
    if (this.laps.length === 0) {
      alert("No split times recorded yet! Run the timer and tap 'Split Mark' at each distance marker.");
      return;
    }

    const count = Math.min(this.laps.length, 6);
    for (let i = 0; i < count; i++) {
      window.labEngine.insertStopwatchTime(i, this.laps[i]);
    }
    if (window.labSound) window.labSound.playSuccess();
    this.closeFullscreen();
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
