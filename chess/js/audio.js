// Zero-asset Web Audio API sound effects for Classroom Chess.
(function () {
  'use strict';

  let ctx = null;
  let muted = localStorage.getItem('chess_muted') === '1';

  function getCtx() {
    if (muted) return null;
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) ctx = new AC();
    }
    if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  }

  function tone(freq, dur, type = 'sine', gainVal = 0.14, delay = 0) {
    const c = getCtx();
    if (!c) return;
    const t0 = c.currentTime + delay;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(gainVal, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(g);
    g.connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  window.ChessAudio = {
    isMuted: () => muted,
    toggleMute() {
      muted = !muted;
      try { localStorage.setItem('chess_muted', muted ? '1' : '0'); } catch (e) {}
      return muted;
    },
    move() {
      tone(210, 0.065, 'triangle', 0.18, 0);
      tone(145, 0.05, 'sine', 0.12, 0.02);
    },
    capture() {
      tone(320, 0.055, 'sawtooth', 0.14, 0);
      tone(170, 0.08, 'triangle', 0.2, 0.025);
    },
    castle() {
      tone(220, 0.055, 'triangle', 0.16, 0);
      tone(260, 0.065, 'triangle', 0.16, 0.08);
    },
    check() {
      tone(587.33, 0.11, 'sawtooth', 0.14, 0);
      tone(880, 0.18, 'triangle', 0.16, 0.09);
    },
    notify() {
      tone(523.25, 0.1, 'sine', 0.14, 0);
      tone(659.25, 0.12, 'sine', 0.14, 0.09);
      tone(783.99, 0.16, 'sine', 0.15, 0.18);
    },
    gameOver(win = true) {
      if (win) {
        [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, 0.18, 'triangle', 0.15, i * 0.09));
      } else {
        [392, 349.23, 311.13, 261.63].forEach((f, i) => tone(f, 0.2, 'sine', 0.13, i * 0.1));
      }
    }
  };
})();

