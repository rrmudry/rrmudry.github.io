// Thanksgobbling sound: everything is synthesized with Web Audio, so there are no sound files to load.
export class Sfx {
  constructor(settings) {
    this.settings = settings;
    this.ctx = null;
    this.lastGobble = 0;
    this.lastSplat = 0;
    this.musicTimer = null;
  }

  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = this.ctx = new AC();
    this.master = ctx.createGain();
    this.master.gain.value = this.settings.sound ? 0.9 : 0;
    this.master.connect(ctx.destination);
    this.sfx = ctx.createGain(); this.sfx.gain.value = 1; this.sfx.connect(this.master);
    this.music = ctx.createGain(); this.music.gain.value = this.settings.music ? 0.06 : 0; this.music.connect(this.master);

    const len = ctx.sampleRate * 2;
    this.noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;

    this._startDrone();
    this._startWind();
    this._startMusic();
  }

  setSound(on) { if (this.master) this.master.gain.setTargetAtTime(on ? 0.9 : 0, this.ctx.currentTime, 0.05); }
  setMusic(on) { if (this.music) this.music.gain.setTargetAtTime(on ? 0.06 : 0, this.ctx.currentTime, 0.1); }
  setDrone(level) { if (this.droneGain) this.droneGain.gain.setTargetAtTime(level, this.ctx.currentTime, 0.4); }

  // ---------- building blocks ----------
  tone({ type = 'sine', f0, f1 = f0, dur = 0.2, vol = 0.2, attack = 0.005, when = 0, curve = 'exp' }) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + when;
    const o = this.ctx.createOscillator(); o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (curve === 'exp') o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
    else o.frequency.linearRampToValueAtTime(f1, t + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.sfx);
    o.start(t); o.stop(t + dur + 0.05);
  }

  noise({ dur = 0.2, vol = 0.2, type = 'bandpass', f0 = 1000, f1 = f0, q = 1, when = 0, attack = 0.003 }) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + when;
    const s = this.ctx.createBufferSource(); s.buffer = this.noiseBuf;
    s.playbackRate.value = 0.8 + Math.random() * 0.4;
    const f = this.ctx.createBiquadFilter(); f.type = type; f.Q.value = q;
    f.frequency.setValueAtTime(f0, t);
    f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f).connect(g).connect(this.sfx);
    s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.05);
  }

  // ---------- ambience ----------
  _startDrone() {
    const ctx = this.ctx;
    this.droneGain = ctx.createGain(); this.droneGain.gain.value = 0.05;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 260; lp.Q.value = 2;
    [46, 47.3, 92.5].forEach((f, i) => {
      const o = ctx.createOscillator(); o.type = i === 2 ? 'square' : 'sawtooth'; o.frequency.value = f;
      const g = ctx.createGain(); g.gain.value = i === 2 ? 0.25 : 0.6;
      o.connect(g).connect(lp); o.start();
    });
    // propeller "wub"
    const lfo = ctx.createOscillator(); lfo.frequency.value = 6.5;
    const lg = ctx.createGain(); lg.gain.value = 70;
    lfo.connect(lg).connect(lp.frequency); lfo.start();
    lp.connect(this.droneGain).connect(this.sfx);
  }

  _startWind() {
    const ctx = this.ctx;
    const s = ctx.createBufferSource(); s.buffer = this.noiseBuf; s.loop = true;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 420; f.Q.value = 0.6;
    const g = ctx.createGain(); g.gain.value = 0.025;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.13;
    const lg = ctx.createGain(); lg.gain.value = 0.015;
    lfo.connect(lg).connect(g.gain); lfo.start();
    s.connect(f).connect(g).connect(this.sfx); s.start();
  }

  // A short folk loop in G major (fiddle-ish triangle over a plucked bass).
  _startMusic() {
    const ctx = this.ctx;
    const bpm = 112, eighth = 60 / bpm / 2;
    const N = { G3: 196, A3: 220, B3: 246.9, C4: 261.6, D4: 293.7, E4: 329.6, Fs4: 370, G4: 392, A4: 440, B4: 493.9, D5: 587.3, E5: 659.3, G2: 98, C3: 130.8, D3: 146.8, E3: 164.8 };
    const mel = ['G4', 'B4', 'D5', 'B4', 'A4', 'G4', 'E4', 'G4', 'A4', 'B4', 'A4', 'G4', 'E4', 'D4', 'E4', 'G4',
      'G4', 'B4', 'D5', 'E5', 'D5', 'B4', 'A4', 'G4', 'E4', 'G4', 'A4', 'B4', 'A4', 'Fs4', 'G4', null];
    const bass = ['G2', 'D3', 'G2', 'D3', 'C3', 'G3', 'C3', 'G3', 'E3', 'B3', 'E3', 'B3', 'D3', 'A3', 'D3', 'A3'];
    let step = 0, next = ctx.currentTime + 0.2;
    const play = (f, t, dur, type, vol) => {
      const o = ctx.createOscillator(); o.type = type; o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(this.music); o.start(t); o.stop(t + dur + 0.05);
    };
    this.musicTimer = setInterval(() => {
      while (next < ctx.currentTime + 0.3) {
        const m = mel[step % mel.length];
        if (m) play(N[m], next, eighth * 1.6, 'triangle', 0.5);
        if (step % 2 === 0) play(N[bass[(step / 2) % bass.length]], next, eighth * 1.8, 'sine', 0.8);
        step++; next += eighth;
      }
    }, 100);
  }

  // ---------- effects ----------
  fire(id) {
    if (id === 'cran') {
      this.tone({ f0: 520, f1: 160, dur: 0.07, vol: 0.12 });
      this.noise({ dur: 0.04, vol: 0.05, type: 'highpass', f0: 2500 });
    } else if (id === 'yam') {
      this.tone({ f0: 240, f1: 55, dur: 0.18, vol: 0.32 });
      this.noise({ dur: 0.12, vol: 0.12, type: 'lowpass', f0: 1200, f1: 300 });
    } else {
      this.tone({ f0: 150, f1: 32, dur: 0.55, vol: 0.5 });
      this.noise({ dur: 0.45, vol: 0.25, type: 'lowpass', f0: 900, f1: 80 });
    }
  }

  whistle(dur) { this.tone({ type: 'sine', f0: 1500, f1: 520, dur: Math.max(0.3, dur), vol: 0.035, attack: 0.1 }); }

  splat(id) {
    const now = this.ctx ? this.ctx.currentTime : 0;
    if (id === 'cran') {
      if (now - this.lastSplat < 0.05) return;
      this.lastSplat = now;
      this.noise({ dur: 0.09, vol: 0.09, f0: 1400, f1: 500, q: 1.5 });
    } else if (id === 'yam') {
      this.noise({ dur: 0.25, vol: 0.28, f0: 900, f1: 200, q: 1.2 });
      this.tone({ f0: 160, f1: 50, dur: 0.2, vol: 0.2 });
    } else {
      this.tone({ f0: 110, f1: 28, dur: 0.9, vol: 0.6 });
      this.noise({ dur: 0.7, vol: 0.45, type: 'lowpass', f0: 1600, f1: 120 });
      this.noise({ dur: 0.25, vol: 0.25, f0: 2200, f1: 600, q: 2, when: 0.03 });
    }
  }

  gobble(pitch = 1, vol = 0.12) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    if (t - this.lastGobble < 0.2) return;
    this.lastGobble = t;
    const ctx = this.ctx, dur = 0.42 + Math.random() * 0.15, f = 420 * pitch;
    const o = ctx.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(f * 0.95, t);
    o.frequency.linearRampToValueAtTime(f * 1.35, t + dur * 0.35);
    o.frequency.linearRampToValueAtTime(f * 0.8, t + dur);
    const lfo = ctx.createOscillator(); lfo.type = 'square'; lfo.frequency.value = 21 + Math.random() * 6;
    const lg = ctx.createGain(); lg.gain.value = f * 0.3;
    lfo.connect(lg).connect(o.frequency);
    const trem = ctx.createGain(); trem.gain.value = 0.5;
    const lfo2 = ctx.createOscillator(); lfo2.frequency.value = lfo.frequency.value;
    const lg2 = ctx.createGain(); lg2.gain.value = 0.5;
    lfo2.connect(lg2).connect(trem.gain);
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1300; bp.Q.value = 1.8;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(vol, t + 0.02);
    env.gain.setValueAtTime(vol, t + dur * 0.7);
    env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(bp).connect(trem).connect(env).connect(this.sfx);
    [o, lfo, lfo2].forEach(n => { n.start(t); n.stop(t + dur + 0.05); });
  }

  squawk() { this.gobble(1.5 + Math.random() * 0.3, 0.16); }
  munch() { for (let i = 0; i < 3; i++) this.noise({ dur: 0.06, vol: 0.07, f0: 1800, q: 3, when: i * 0.09 }); }
  reload(id) {
    const w = id === 'pie' ? [0, 0.1] : [0, 0.12];
    w.forEach((d, i) => this.noise({ dur: 0.04, vol: 0.12, type: 'highpass', f0: 2500 + i * 800, when: d }));
    if (id === 'pie') this.tone({ type: 'triangle', f0: 1568, dur: 0.5, vol: 0.12, when: 0.15 }); // oven "ding"
  }
  empty() { this.noise({ dur: 0.03, vol: 0.08, type: 'highpass', f0: 3000 }); }
  oops() {
    this.tone({ type: 'square', f0: 620, f1: 600, dur: 0.14, vol: 0.06 });
    this.tone({ type: 'square', f0: 440, f1: 400, dur: 0.22, vol: 0.06, when: 0.15 });
  }
  deliver() {
    this.tone({ type: 'triangle', f0: 880, dur: 0.15, vol: 0.1 });
    this.tone({ type: 'triangle', f0: 1320, dur: 0.3, vol: 0.1, when: 0.1 });
  }
  bell() {
    for (let i = 0; i < 3; i++) {
      this.tone({ type: 'triangle', f0: 1046, dur: 0.9, vol: 0.18, when: i * 0.28, attack: 0.002 });
      this.tone({ type: 'sine', f0: 2637, dur: 0.5, vol: 0.06, when: i * 0.28, attack: 0.002 });
    }
  }
  pick() { [523, 659, 784, 1046].forEach((f, i) => this.tone({ type: 'triangle', f0: f, dur: 0.25, vol: 0.1, when: i * 0.07 })); }
  alarm() { this.tone({ type: 'square', f0: 700, f1: 500, dur: 0.25, vol: 0.05, curve: 'lin' }); }
  sadTrombone() {
    [[392, 370], [370, 349], [349, 330], [330, 262]].forEach(([a, b], i) =>
      this.tone({ type: 'sawtooth', f0: a, f1: b, dur: i === 3 ? 1.1 : 0.4, vol: 0.12, when: i * 0.45, curve: 'lin' }));
  }
}
