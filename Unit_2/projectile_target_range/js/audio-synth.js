// Web Audio API Synthesizer — Zero External Asset Sound Effects
// Self-contained sound FX engine for Projectile Target Range

(function () {
  let ctx = null;
  let muted = false;

  function getAudioContext() {
    if (!ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        ctx = new AudioCtx();
      }
    }
    if (ctx && ctx.state === 'suspended') {
      ctx.resume();
    }
    return ctx;
  }

  const SoundFX = {
    isMuted() {
      return muted;
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    setMute(val) {
      muted = !!val;
    },

    play(name) {
      if (muted) return;
      const c = getAudioContext();
      if (!c) return;

      const now = c.currentTime;

      if (name === 'clink' || name === 'swish') {
        // High-pitched metallic ping / clink into a cup
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1760, now); // A6
        osc.frequency.exponentialRampToValueAtTime(2637, now + 0.08); // E7
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        osc.connect(gain);
        gain.connect(c.destination);
        osc.start(now);
        osc.stop(now + 0.65);

        // Secondary metallic overtone
        const osc2 = c.createOscillator();
        const gain2 = c.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(3520, now);
        gain2.gain.setValueAtTime(0.2, now);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc2.connect(gain2);
        gain2.connect(c.destination);
        osc2.start(now);
        osc2.stop(now + 0.4);
      } else if (name === 'rim') {
        // Double-tap hollow rim bounce
        [0, 0.08].forEach((delay, idx) => {
          const osc = c.createOscillator();
          const gain = c.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(idx === 0 ? 880 : 1174, now + delay);
          gain.gain.setValueAtTime(0.25, now + delay);
          gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.18);
          osc.connect(gain);
          gain.connect(c.destination);
          osc.start(now + delay);
          osc.stop(now + delay + 0.2);
        });
      } else if (name === 'fanfare') {
        // Triumphant 4-note victory chord: C5 -> E5 -> G5 -> C6
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, i) => {
          const osc = c.createOscillator();
          const gain = c.createGain();
          const t = now + i * 0.1;
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.25, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
          osc.connect(gain);
          gain.connect(c.destination);
          osc.start(t);
          osc.stop(t + 0.5);
        });
      } else if (name === 'click') {
        // Soft tactile UI click
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.connect(gain);
        gain.connect(c.destination);
        osc.start(now);
        osc.stop(now + 0.06);
      } else if (name === 'buzz' || name === 'miss') {
        // Low buzzer for a miss
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.linearRampToValueAtTime(120, now + 0.3);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.connect(gain);
        gain.connect(c.destination);
        osc.start(now);
        osc.stop(now + 0.38);
      }
    }
  };

  window.SoundFX = SoundFX;
})();
