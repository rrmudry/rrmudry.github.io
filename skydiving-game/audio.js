/**
 * Terminal Velocity: Skydive Academy
 * Web Audio API Sound Synthesizer Engine
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.masterGain = null;
    this.windNode = null;
    this.windGain = null;
    this.windFilter = null;
    this.alarmOsc = null;
    this.alarmGain = null;
    this.alarmTimer = null;
    this.initialized = false;
    
    // Check saved audio preference
    try {
      const savedMute = localStorage.getItem('terminal_velocity_muted');
      if (savedMute !== null) this.muted = savedMute === 'true';
    } catch (e) {}
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.muted ? 0 : 0.7;
      this.masterGain.connect(this.ctx.destination);
      
      this._initWindEngine();
      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio initialization failed:', e);
    }
  }

  resume() {
    if (!this.ctx) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.muted ? 0 : 0.7, this.ctx.currentTime, 0.05);
    }
    try {
      localStorage.setItem('terminal_velocity_muted', this.muted);
    } catch (e) {}
    return this.muted;
  }

  // --- Procedural Continuous Wind Rush ---
  _initWindEngine() {
    if (!this.ctx) return;
    
    // Generate 2 seconds of pink/brown noise
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.1;
      b6 = white * 0.115926;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    this.windFilter = this.ctx.createBiquadFilter();
    this.windFilter.type = 'lowpass';
    this.windFilter.frequency.value = 250;
    this.windFilter.Q.value = 1.8;

    this.windGain = this.ctx.createGain();
    this.windGain.gain.value = 0.0;

    whiteNoise.connect(this.windFilter);
    this.windFilter.connect(this.windGain);
    this.windGain.connect(this.masterGain);

    whiteNoise.start(0);
    this.windNode = whiteNoise;
  }

  updateWind(speed, maxSpeed = 80, inFreefall = true) {
    if (!this.ctx || !this.windGain || !this.windFilter) return;
    const normSpeed = Math.min(Math.max(speed / maxSpeed, 0), 1.6);
    const targetFreq = inFreefall ? 180 + normSpeed * 1400 : 120 + normSpeed * 400;
    const targetGain = inFreefall ? Math.min(normSpeed * 0.55, 0.6) : Math.min(normSpeed * 0.25, 0.3);

    const now = this.ctx.currentTime;
    this.windFilter.frequency.setTargetAtTime(targetFreq, now, 0.1);
    this.windGain.gain.setTargetAtTime(targetGain, now, 0.1);
  }

  stopWind() {
    if (!this.ctx || !this.windGain) return;
    this.windGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.15);
  }

  // --- Sound FX ---

  // Jump from plane whoosh
  playJump() {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(380, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.6);
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.6);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.6);
  }

  // Parachute deployment snap & canopy pop
  playDeploy() {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    
    // Ripcord snap
    const snapOsc = this.ctx.createOscillator();
    const snapGain = this.ctx.createGain();
    snapOsc.type = 'triangle';
    snapOsc.frequency.setValueAtTime(900, now);
    snapOsc.frequency.exponentialRampToValueAtTime(150, now + 0.15);
    snapGain.gain.setValueAtTime(0.5, now);
    snapGain.gain.linearRampToValueAtTime(0.01, now + 0.15);
    snapOsc.connect(snapGain);
    snapGain.connect(this.masterGain);
    snapOsc.start(now);
    snapOsc.stop(now + 0.15);

    // Canopy inflate whoosh (burst of noise)
    const bufLen = this.ctx.sampleRate * 0.5;
    const buf = this.ctx.createBuffer(1, bufLen, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(300, now + 0.05);
    filter.frequency.exponentialRampToValueAtTime(120, now + 0.5);
    filter.Q.value = 2.5;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.01, now);
    noiseGain.gain.linearRampToValueAtTime(0.7, now + 0.12);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.55);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    noise.start(now);
    noise.stop(now + 0.55);
  }

  // Ring collection chime with combo pitch scaling
  playRing(combo = 1) {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const notes = [440, 493.88, 554.37, 659.25, 739.99, 880, 987.77, 1108.73, 1318.5]; // Pentatonic scale
    const baseFreq = notes[Math.min(combo - 1, notes.length - 1)];

    // Primary bell tone
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(baseFreq, now);
    osc1.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.25);
    gain1.gain.setValueAtTime(0.35, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc1.connect(gain1);
    gain1.connect(this.masterGain);
    osc1.start(now);
    osc1.stop(now + 0.4);

    // Harmonic sparkle
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(baseFreq * 2, now + 0.04);
    gain2.gain.setValueAtTime(0.2, now + 0.04);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc2.connect(gain2);
    gain2.connect(this.masterGain);
    osc2.start(now + 0.04);
    osc2.stop(now + 0.35);
  }

  // Star / Super Gem Pickup
  playGem() {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      const t = now + idx * 0.06;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.25);
    });
  }

  // Canopy brake / Flare whoosh
  playFlare() {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(260, now + 0.25);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.5);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.5);
  }

  // Altimeter Danger Beep
  playBeep(isUrgent = false) {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = isUrgent ? 'sawtooth' : 'sine';
    osc.frequency.setValueAtTime(isUrgent ? 1200 : 880, now);
    gain.gain.setValueAtTime(isUrgent ? 0.35 : 0.2, now);
    gain.gain.linearRampToValueAtTime(0.01, now + (isUrgent ? 0.08 : 0.12));
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + (isUrgent ? 0.08 : 0.12));
  }

  // Successful Touchdown & Fanfare
  playTouchdown(accuracy = 100) {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    
    // Soft thud
    const thudOsc = this.ctx.createOscillator();
    const thudGain = this.ctx.createGain();
    thudOsc.type = 'triangle';
    thudOsc.frequency.setValueAtTime(90, now);
    thudOsc.frequency.exponentialRampToValueAtTime(30, now + 0.25);
    thudGain.gain.setValueAtTime(0.6, now);
    thudGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    thudOsc.connect(thudGain);
    thudGain.connect(this.masterGain);
    thudOsc.start(now);
    thudOsc.stop(now + 0.3);

    // Triumphant fanfare
    const chords = [
      [523.25, 659.25, 783.99], // C
      [587.33, 739.99, 880.00], // D
      [659.25, 830.61, 987.77], // E
      [783.99, 987.77, 1174.66, 1567.98] // G chord resolution
    ];

    chords.forEach((chord, step) => {
      const stepTime = now + 0.2 + step * 0.15;
      chord.forEach(freq => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, stepTime);
        gain.gain.setValueAtTime(0.18, stepTime);
        gain.gain.exponentialRampToValueAtTime(0.001, stepTime + (step === chords.length - 1 ? 0.8 : 0.22));
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(stepTime);
        osc.stop(stepTime + (step === chords.length - 1 ? 0.8 : 0.22));
      });
    });
  }

  // Crash / Hard Impact
  playCrash() {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    
    // Low rumble + harsh crunch
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(20, now + 0.6);
    gain.gain.setValueAtTime(0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.7);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.7);
  }
}

window.soundEngine = new SoundEngine();
