// Vector Decomposition Studio — Zero-dependency Web Audio synthesizer
// Every sound is generated in code; no audio files to load or fail.
// Modeled on Unit_2/horizontal_projectile_workbench/js/audio.js.

class SoundFX {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    try {
      this.enabled = localStorage.getItem('vds_audio') !== 'off';
    } catch (e) { /* storage blocked: default ON */ }
  }

  _ensure() {
    if (!this.enabled) return null;
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  setEnabled(on) {
    this.enabled = on;
    try { localStorage.setItem('vds_audio', on ? 'on' : 'off'); } catch (e) { /* ignore */ }
  }

  _tone(freq, dur, type, vol, freqEnd, delay) {
    const ctx = this._ensure();
    if (!ctx) return;
    const t0 = ctx.currentTime + (delay || 0);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    if (freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol || 0.15, t0 + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  playClick() { this._tone(800, 0.05, 'sine', 0.10); }

  playChime() {
    [523.25, 659.25, 783.99].forEach((f, i) => this._tone(f, 0.5, 'sine', 0.14, null, i * 0.11));
  }

  playFanfare() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this._tone(f, i === 3 ? 0.9 : 0.25, 'triangle', 0.14, null, i * 0.13));
  }

  playBuzzer() { this._tone(220, 0.4, 'square', 0.07, 110); }
}

window.soundFx = new SoundFX();
