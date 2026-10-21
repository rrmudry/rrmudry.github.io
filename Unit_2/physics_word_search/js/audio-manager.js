/**
 * Physics Word Search - Web Audio Synthesizer
 * Zero external audio assets; synthesized using Web Audio API oscillators and gain envelopes.
 */

class PhysicsAudioManager {
  constructor() {
    this.ctx = null;
    this.enabled = localStorage.getItem('ws_sound_enabled') !== 'false';
  }

  _initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  toggleSound() {
    this.enabled = !this.enabled;
    localStorage.setItem('ws_sound_enabled', String(this.enabled));
    return this.enabled;
  }

  playTick(frequency = 520) {
    if (!this.enabled) return;
    this._initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, now);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch (e) {
      // Audio autoplay policy guard
    }
  }

  playWordFound() {
    if (!this.enabled) return;
    this._initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Melodic major triad: C5 (523.25), E5 (659.25), G5 (783.99), C6 (1046.5)
      const notes = [523.25, 659.25, 783.99, 1046.50];

      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);

        const startTime = now + idx * 0.06;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.12, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.4);
      });
    } catch (e) {
      console.warn('Audio play notice:', e);
    }
  }

  playInvalid() {
    if (!this.enabled) return;
    this._initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(90, now + 0.16);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.2);
    } catch (e) {}
  }

  playHint() {
    if (!this.enabled) return;
    this._initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now); // A5
      osc.frequency.exponentialRampToValueAtTime(1174.66, now + 0.2); // D6

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.28);
    } catch (e) {}
  }

  playVictory() {
    if (!this.enabled) return;
    this._initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Grand victory arpeggio: C5, E5, G5, C6, E6, G6
      const fanfare = [
        { f: 523.25, t: 0.00, d: 0.2 },
        { f: 659.25, t: 0.12, d: 0.2 },
        { f: 783.99, t: 0.24, d: 0.2 },
        { f: 1046.50, t: 0.36, d: 0.6 },
        { f: 1318.51, t: 0.50, d: 0.8 }
      ];

      fanfare.forEach(note => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(note.f, now + note.t);

        const startTime = now + note.t;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.18, startTime + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + note.d);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + note.d + 0.05);
      });
    } catch (e) {}
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PhysicsAudioManager };
}
