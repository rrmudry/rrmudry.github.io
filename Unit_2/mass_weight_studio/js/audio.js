// Web Audio API Sound Synthesizer for the Mass, Weight & Zero-G Inertia Studio
// Zero external audio assets: every effect is generated from oscillators and noise buffers

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.noiseBuffer = null;
    this.enabled = true;
    try {
      this.enabled = localStorage.getItem('mws_sound') !== 'off';
    } catch (e) { /* storage blocked: default ON */ }
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    return !!this.ctx;
  }

  toggle() {
    this.enabled = !this.enabled;
    try {
      localStorage.setItem('mws_sound', this.enabled ? 'on' : 'off');
    } catch (e) { /* ignore */ }
    return this.enabled;
  }

  ready() {
    return this.enabled && this.init();
  }

  tone({ type = 'sine', f0, f1 = f0, dur, gain = 0.2, delay = 0, attack = 0.005 }) {
    const now = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f0, now);
    if (f1 !== f0) osc.frequency.exponentialRampToValueAtTime(Math.max(1, f1), now + dur);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(gain, now + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.connect(g);
    g.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + dur + 0.02);
  }

  noise({ dur, gain = 0.2, filter = 'bandpass', f0 = 800, f1 = f0, q = 1, delay = 0, attack = 0.01 }) {
    if (!this.noiseBuffer) {
      const len = Math.floor(this.ctx.sampleRate * 1.5);
      this.noiseBuffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    }
    const now = this.ctx.currentTime + delay;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const biq = this.ctx.createBiquadFilter();
    biq.type = filter;
    biq.Q.value = q;
    biq.frequency.setValueAtTime(f0, now);
    if (f1 !== f0) biq.frequency.exponentialRampToValueAtTime(Math.max(1, f1), now + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(gain, now + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    src.connect(biq);
    biq.connect(g);
    g.connect(this.ctx.destination);
    src.start(now);
    src.stop(now + dur + 0.02);
  }

  // Short 800 Hz sine blip for UI interactions
  playClick() {
    if (!this.ready()) return;
    this.tone({ f0: 800, dur: 0.05, gain: 0.08 });
  }

  // Low 65 Hz decaying triangle with exponential pitch drop (heavy impacts)
  playThud(intensity = 1) {
    if (!this.ready()) return;
    const k = Math.max(0.15, Math.min(1, intensity));
    this.tone({ type: 'triangle', f0: 65 * 1.8, f1: 32, dur: 0.4, gain: 0.5 * k });
    this.tone({ type: 'sine', f0: 140, f1: 50, dur: 0.18, gain: 0.25 * k });
  }

  // Filtered white-noise sweep for zero-g glides
  playWhoosh(intensity = 1) {
    if (!this.ready()) return;
    const k = Math.max(0.2, Math.min(1, intensity));
    this.noise({ dur: 0.25 + 0.4 * k, gain: 0.22 * k, filter: 'bandpass', f0: 350, f1: 2600, q: 1.4, attack: 0.05 });
  }

  // Soft cushioned bump (foam, padded wall)
  playSoftBump() {
    if (!this.ready()) return;
    this.tone({ f0: 190, f1: 90, dur: 0.14, gain: 0.16 });
    this.noise({ dur: 0.1, gain: 0.05, filter: 'lowpass', f0: 600 });
  }

  // Mechanical straining groan of the robotic arm against a massive object
  playGroan() {
    if (!this.ready()) return;
    this.tone({ type: 'sawtooth', f0: 110, f1: 55, dur: 0.75, gain: 0.12, attack: 0.04 });
    this.tone({ type: 'square', f0: 74, f1: 48, dur: 0.6, gain: 0.05, attack: 0.04 });
    this.noise({ dur: 0.5, gain: 0.06, filter: 'bandpass', f0: 300, f1: 150, q: 3 });
  }

  // Loud industrial metallic crash (heavy object buckling the barrier)
  playCrash(intensity = 1) {
    if (!this.ready()) return;
    const k = Math.max(0.3, Math.min(1, intensity));
    this.tone({ type: 'sawtooth', f0: 150, f1: 30, dur: 0.45, gain: 0.4 * k });
    this.noise({ dur: 0.45, gain: 0.35 * k, filter: 'bandpass', f0: 1200, f1: 500, q: 0.8, attack: 0.003 });
    [523, 877, 1319, 1847].forEach((f, i) => {
      this.tone({ f0: f, f1: f * 0.97, dur: 0.9 - i * 0.12, gain: 0.07 * k, delay: 0.01 });
    });
  }

  // Laser scanner sweep
  playScan() {
    if (!this.ready()) return;
    this.tone({ f0: 900, f1: 1800, dur: 0.35, gain: 0.06 });
    this.tone({ f0: 1800, f1: 900, dur: 0.35, gain: 0.05, delay: 0.4 });
    this.tone({ f0: 1400, dur: 0.08, gain: 0.08, delay: 1.35 });
  }

  // Water splash for the displacement tank
  playSplash() {
    if (!this.ready()) return;
    this.noise({ dur: 0.7, gain: 0.25, filter: 'lowpass', f0: 2200, f1: 300, attack: 0.01 });
    this.tone({ f0: 420, f1: 900, dur: 0.12, gain: 0.05, delay: 0.05 });
  }

  // Planet-hop transition hum
  playHum() {
    if (!this.ready()) return;
    this.tone({ f0: 220, f1: 330, dur: 0.35, gain: 0.06, attack: 0.05 });
    this.tone({ f0: 330, f1: 495, dur: 0.35, gain: 0.04, attack: 0.05 });
  }

  // 2-tone melodic major chord for a correct answer
  playChime() {
    if (!this.ready()) return;
    [523.25, 659.25, 783.99].forEach(f => this.tone({ f0: f, dur: 0.35, gain: 0.08 }));
    [659.25, 783.99, 1046.5].forEach(f => this.tone({ f0: f, dur: 0.5, gain: 0.08, delay: 0.16 }));
  }

  // Low descending square wave for an incorrect answer
  playBuzzer() {
    if (!this.ready()) return;
    this.tone({ type: 'square', f0: 220, f1: 110, dur: 0.45, gain: 0.08 });
  }

  // Certificate fanfare
  playFanfare() {
    if (!this.ready()) return;
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => {
      this.tone({ type: 'triangle', f0: f, dur: 0.4, gain: 0.12, delay: i * 0.1 });
    });
  }
}

window.soundFx = new SoundEngine();
