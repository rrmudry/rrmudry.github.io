/**
 * Rat Rod Racers - Web Audio API Sound Synthesizer
 * Zero external audio assets required; procedural synthesis for:
 * Engine rumble, throttle revs, tire squeal, Christmas tree beeps, crate pry/pop, cash cha-ching, and fanfare.
 */

class RatRodAudio {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.initialized = false;

    this.engineOsc = null;
    this.engineGain = null;
    this.engineFilter = null;

    try {
      const saved = localStorage.getItem('rat_rod_audio_muted');
      if (saved !== null) this.muted = saved === 'true';
    } catch (e) {}
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      this.ctx = new AudioContextClass();
      this.initialized = true;
    } catch (e) {
      console.warn("Audio initialization error:", e);
    }
  }

  resume() {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.engineGain && this.ctx) {
      this.engineGain.gain.setValueAtTime(this.muted ? 0 : 0.15, this.ctx.currentTime);
    }
    try {
      localStorage.setItem('rat_rod_audio_muted', this.muted);
    } catch (e) {}
    return this.muted;
  }

  // Continuous Engine Sound (Idle / Rev)
  startEngine() {
    if (!this.ctx || this.muted) return;
    if (this.engineOsc) return;

    try {
      const t = this.ctx.currentTime;
      this.engineOsc = this.ctx.createOscillator();
      this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.setValueAtTime(38, t); // low V8 idle rumble

      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.setValueAtTime(120, t);

      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.setValueAtTime(this.muted ? 0 : 0.12, t);

      this.engineOsc.connect(this.engineFilter);
      this.engineFilter.connect(this.engineGain);
      this.engineGain.connect(this.ctx.destination);

      this.engineOsc.start(t);
    } catch (e) {}
  }

  updateEngine(rpmRatio = 0) {
    if (!this.ctx || !this.engineOsc || this.muted) return;
    try {
      const t = this.ctx.currentTime;
      // Idle at 38Hz, revs up to 160Hz
      const freq = 38 + rpmRatio * 122;
      this.engineOsc.frequency.setTargetAtTime(freq, t, 0.05);

      // Open filter as revs climb
      const filterFreq = 120 + rpmRatio * 450;
      this.engineFilter.frequency.setTargetAtTime(filterFreq, t, 0.05);
    } catch (e) {}
  }

  stopEngine(fadeDuration = 0.25) {
    if (this.engineOsc) {
      try {
        const osc = this.engineOsc;
        const gain = this.engineGain;
        const filter = this.engineFilter;
        if (gain && this.ctx) {
          const t = this.ctx.currentTime;
          gain.gain.setValueAtTime(Math.max(0.001, gain.gain.value), t);
          gain.gain.exponentialRampToValueAtTime(0.0001, t + fadeDuration);
          setTimeout(() => {
            try {
              osc.stop();
              osc.disconnect();
              if (filter) filter.disconnect();
              gain.disconnect();
            } catch (e) {}
          }, fadeDuration * 1000 + 50);
        } else {
          osc.stop();
          osc.disconnect();
        }
      } catch (e) {}
      this.engineOsc = null;
      this.engineGain = null;
      this.engineFilter = null;
    }
  }

  // Tire Burnout Squeal
  playTireSqueal(duration = 0.3) {
    if (!this.ctx || this.muted) return;
    try {
      const t = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * duration;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, t);
      filter.Q.setValueAtTime(6.0, t);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(t);
    } catch (e) {}
  }

  // Christmas Tree Beep
  playTreeBeep(isGreen = false) {
    if (!this.ctx || this.muted) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(isGreen ? 880 : 440, t); // 440 Hz for amber, 880 Hz for green

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + (isGreen ? 0.45 : 0.18));

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + (isGreen ? 0.45 : 0.18));
    } catch (e) {}
  }

  // Cash Register Cha-Ching
  playCashSound() {
    if (!this.ctx || this.muted) return;
    try {
      const t = this.ctx.currentTime;
      // High bell chimes
      [1200, 1600].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t + idx * 0.09);

        gain.gain.setValueAtTime(0.22, t + idx * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.09 + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t + idx * 0.09);
        osc.stop(t + idx * 0.09 + 0.35);
      });
    } catch (e) {}
  }

  // Crate Pry Creak & Pop
  playCratePop() {
    if (!this.ctx || this.muted) return;
    try {
      const t = this.ctx.currentTime;
      // Low wooden thud + high pop
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.exponentialRampToValueAtTime(45, t + 0.2);

      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.25);
    } catch (e) {}
  }

  // Card Reveal Twinkle
  playCardTwinkle(rarity = 'common') {
    if (!this.ctx || this.muted) return;
    try {
      const t = this.ctx.currentTime;
      const freqs = rarity === 'legendary' ? [523, 659, 784, 1046, 1318] : [523, 659, 784];

      freqs.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + idx * 0.06);

        gain.gain.setValueAtTime(0.18, t + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.06 + 0.3);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t + idx * 0.06);
        osc.stop(t + idx * 0.06 + 0.3);
      });
    } catch (e) {}
  }

  // Victory Fanfare
  playVictoryFanfare() {
    if (!this.ctx || this.muted) return;
    try {
      const t = this.ctx.currentTime;
      const notes = [
        { f: 523.25, d: 0.15, offset: 0 },
        { f: 659.25, d: 0.15, offset: 0.15 },
        { f: 783.99, d: 0.20, offset: 0.30 },
        { f: 1046.50, d: 0.50, offset: 0.50 }
      ];

      notes.forEach(note => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(note.f, t + note.offset);

        gain.gain.setValueAtTime(0.3, t + note.offset);
        gain.gain.exponentialRampToValueAtTime(0.01, t + note.offset + note.d);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t + note.offset);
        osc.stop(t + note.offset + note.d);
      });
    } catch (e) {}
  }
}

window.RatRodAudio = RatRodAudio;
