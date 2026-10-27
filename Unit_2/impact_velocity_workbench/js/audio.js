// Impact Velocity & Vector Angle Workbench — Web Audio Synthesizer
// Pure Web Audio API: Zero external audio assets, 100% resilient on district networks

class SoundFX {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    try {
      this.enabled = localStorage.getItem('ivw_audio') !== 'off';
    } catch (e) { /* storage blocked */ }
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
    try { localStorage.setItem('ivw_audio', on ? 'on' : 'off'); } catch (e) {}
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

  // Click for UI buttons
  playClick() { this._tone(700, 0.04, 'sine', 0.08); }

  // Photogate beep
  playBeep() { this._tone(1600, 0.05, 'square', 0.03); }

  // Pneumatic release
  playLaunch() {
    this._noiseBurst(0.35, 'bandpass', 2400, 0.40, 500);
    this._tone(150, 0.20, 'sine', 0.30, 50);
  }

  // Strobe marker ping during flight
  playStrobePing() {
    this._tone(900, 0.03, 'sine', 0.04);
  }

  // Ground Impact: A heavy impact thud + dynamic vector snap sound
  playImpact() {
    this._tone(65, 0.35, 'sine', 0.50, 30);
    this._noiseBurst(0.12, 'lowpass', 400, 0.45);
    // Subtle vector lock chime
    this._tone(587.33, 0.18, 'triangle', 0.12, null, 0.05);
  }

  // Metal target clank
  playClang() {
    [523, 1046, 1568, 2093].forEach((f, i) => this._tone(f, 0.8 - i * 0.15, 'sine', 0.12 - i * 0.02));
    this._noiseBurst(0.05, 'highpass', 3500, 0.20);
  }

  // Correct answer chime (ascending 3-chord fanfare)
  playSuccess() {
    [523.25, 659.25, 783.99, 1046.50].forEach((f, i) => this._tone(f, 0.45, 'sine', 0.15, null, i * 0.08));
  }

  // Master play dispatcher
  play(type) {
    if (!this.enabled) return;
    switch (type) {
      case 'click': this.playClick(); break;
      case 'beep': this.playBeep(); break;
      case 'launch': this.playLaunch(); break;
      case 'strobe': this.playStrobePing(); break;
      case 'impact': this.playImpact(); break;
      case 'clang': this.playClang(); break;
      case 'fanfare':
      case 'success': this.playSuccess(); break;
      case 'error': this.playError(); break;
      default: this.playClick(); break;
    }
  }

  toggleMute() {
    this.setEnabled(!this.enabled);
    return !this.enabled;
  }
}

// Singleton helper with static delegates
const soundInstance = new SoundFX();
SoundFX.play = (type) => soundInstance.play(type);
SoundFX.toggleMute = () => soundInstance.toggleMute();
SoundFX.setEnabled = (on) => soundInstance.setEnabled(on);
SoundFX.instance = soundInstance;

window.SoundFX = SoundFX;
