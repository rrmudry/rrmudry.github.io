// Newton's 2nd Law Studio — Zero-dependency Web Audio synthesizer
// Every sound is generated in code; no audio files to load or fail.

class SoundFX {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.roll = null;
    try {
      this.enabled = localStorage.getItem('nsl_audio') !== 'off';
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
    try { localStorage.setItem('nsl_audio', on ? 'on' : 'off'); } catch (e) { /* ignore */ }
    if (!on) this.setRollSpeed(0);
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

  _noiseBuffer(ctx, seconds) {
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  _noiseBurst(dur, filterType, freq, vol) {
    const ctx = this._ensure();
    if (!ctx) return;
    const t0 = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this._noiseBuffer(ctx, dur);
    const filter = ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = freq;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter).connect(gain).connect(ctx.destination);
    src.start(t0);
  }

  playClick() { this._tone(800, 0.06, 'sine', 0.12); }

  playNudge() {
    this._noiseBurst(0.18, 'lowpass', 600, 0.35);
    this._tone(250, 0.15, 'sine', 0.12, 140);
  }

  playClack() {
    this._tone(2400, 0.05, 'triangle', 0.10);
    this._tone(3600, 0.04, 'square', 0.03);
    this._noiseBurst(0.04, 'highpass', 3000, 0.15);
  }

  playThud() {
    this._tone(60, 0.35, 'sine', 0.5, 35);
    this._noiseBurst(0.12, 'lowpass', 250, 0.4);
  }

  playBeep() { this._tone(1500, 0.05, 'square', 0.04); }

  playChime() {
    [523.25, 659.25, 783.99].forEach((f, i) => this._tone(f, 0.5, 'sine', 0.14, null, i * 0.11));
  }

  playBuzzer() { this._tone(220, 0.4, 'square', 0.07, 110); }

  // Continuous rolling rumble: low-pass filtered noise whose loudness and
  // brightness follow the cart speed. Call every frame with the current |v|.
  setRollSpeed(speed) {
    if (!this.enabled || speed < 0.02) {
      if (this.roll) {
        const t = this.roll.ctx.currentTime;
        this.roll.gain.gain.setTargetAtTime(0, t, 0.05);
      }
      return;
    }
    const ctx = this._ensure();
    if (!ctx) return;
    if (!this.roll) {
      const src = ctx.createBufferSource();
      src.buffer = this._noiseBuffer(ctx, 2);
      src.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      const gain = ctx.createGain();
      gain.gain.value = 0;
      src.connect(filter).connect(gain).connect(ctx.destination);
      src.start();
      this.roll = { ctx, src, filter, gain };
    }
    const t = ctx.currentTime;
    const s = Math.min(speed, 3);
    this.roll.filter.frequency.setTargetAtTime(120 + s * 260, t, 0.05);
    this.roll.gain.gain.setTargetAtTime(0.04 + s * 0.06, t, 0.05);
  }

  playRoll(speed) { this.setRollSpeed(speed); }
}

window.soundFx = new SoundFX();
