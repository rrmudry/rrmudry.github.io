// Horizontal Projectile Workbench — Zero-dependency Web Audio synthesizer
// Every sound is generated in code; no audio files to load or fail.
// Modeled on Unit_2/newtons_second_law_studio/js/audio.js.

class SoundFX {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    try {
      this.enabled = localStorage.getItem('hpw_audio') !== 'off';
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
    try { localStorage.setItem('hpw_audio', on ? 'on' : 'off'); } catch (e) { /* ignore */ }
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

  _noiseBurst(dur, filterType, freq, vol, freqEnd) {
    const ctx = this._ensure();
    if (!ctx) return;
    const t0 = ctx.currentTime;
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.setValueAtTime(freq, t0);
    if (freqEnd) filter.frequency.exponentialRampToValueAtTime(freqEnd, t0 + dur);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter).connect(gain).connect(ctx.destination);
    src.start(t0);
  }

  // Mechanical click (buttons, bucket snap)
  playClick() { this._tone(800, 0.05, 'sine', 0.10); }

  // Photogate beep as the ball crosses the beam
  playBeep() { this._tone(1500, 0.06, 'square', 0.04); }

  // Pneumatic launch: a hiss of air plus a low thump
  playLaunch() {
    this._noiseBurst(0.35, 'bandpass', 2500, 0.45, 600);
    this._tone(140, 0.18, 'sine', 0.35, 55);
  }

  // Metal bucket clang: inharmonic partials that ring and decay
  playClang() {
    [523, 1187, 1873, 2649].forEach((f, i) => this._tone(f, 0.9 - i * 0.15, 'sine', 0.13 - i * 0.02));
    this._noiseBurst(0.05, 'highpass', 4000, 0.25);
  }

  // Rim shot: a short metal tick
  playRim() {
    this._tone(1900, 0.12, 'triangle', 0.10);
    this._tone(2900, 0.08, 'sine', 0.05);
  }

  // Ball hits the floor
  playThud() {
    this._tone(70, 0.3, 'sine', 0.5, 35);
    this._noiseBurst(0.1, 'lowpass', 300, 0.4);
  }

  playChime() {
    [523.25, 659.25, 783.99].forEach((f, i) => this._tone(f, 0.5, 'sine', 0.14, null, i * 0.11));
  }

  playFanfare() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this._tone(f, i === 3 ? 0.9 : 0.25, 'triangle', 0.14, null, i * 0.13));
  }

  playBuzzer() { this._tone(220, 0.4, 'square', 0.07, 110); }
}

window.soundFx = new SoundFX();
