/**
 * HALLOWEEN THEME • OCTOBER SPECIAL EDITION
 * Mr. Mudry's High School Physics
 * Features: Jack-O'-Lanterns, Animated Skeletons, Creeping Zombies,
 * Harvest Moon, Flying Bats, Mist, and Kinematic Physics Candy!
 */

(function () {
  'use strict';

  // Config & State
  const STORAGE_KEY_THEME = 'physics_halloween_theme_v1';
  const STORAGE_KEY_AUDIO = 'physics_halloween_sound_v1';
  
  // Default to active during October or if explicitly set
  const currentMonth = new Date().getMonth(); // 9 = October (0-indexed)
  const isOctober = currentMonth === 9 || true; // Set active for October theme request
  
  let isThemeActive = localStorage.getItem(STORAGE_KEY_THEME) !== 'disabled';
  let isAudioEnabled = localStorage.getItem(STORAGE_KEY_AUDIO) === 'enabled';
  let audioCtx = null;

  // Initialize Web Audio Context on first user interaction
  function getAudioContext() {
    if (!audioCtx && (window.AudioContext || window.webkitAudioContext)) {
      const AudioClass = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioClass();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  // Spooky Sound FX Synthesizers
  const SpookyAudio = {
    // Skeletal xylophone bone clatter
    boneRattle() {
      if (!isAudioEnabled) return;
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const pitches = [587.33, 659.25, 783.99, 880.00, 1046.50, 1174.66]; // D5, E5, G5, A5, C6, D6
      
      for (let i = 0; i < 7; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        const freq = pitches[Math.floor(Math.random() * pitches.length)] * (1 + (Math.random() * 0.04 - 0.02));
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.045);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(freq * 1.5, now + i * 0.045);
        filter.Q.setValueAtTime(6, now + i * 0.045);

        gain.gain.setValueAtTime(0.001, now + i * 0.045);
        gain.gain.exponentialRampToValueAtTime(0.18, now + i * 0.045 + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.045 + 0.07);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + i * 0.045);
        osc.stop(now + i * 0.045 + 0.08);
      }
    },

    // Zombie groaning rumble
    zombieGroan() {
      if (!isAudioEnabled) return;
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const dur = 1.1;

      const osc = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc2.type = 'sawtooth';

      // Pitch glide down
      osc.frequency.setValueAtTime(95, now);
      osc.frequency.exponentialRampToValueAtTime(65, now + dur);

      osc2.frequency.setValueAtTime(98, now);
      osc2.frequency.exponentialRampToValueAtTime(63, now + dur);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, now);
      filter.frequency.linearRampToValueAtTime(180, now + dur);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

      osc.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc2.start(now);
      osc.stop(now + dur);
      osc2.stop(now + dur);
    },

    // Jack-o'-lantern witchy laugh / flare
    pumpkinCackle() {
      if (!isAudioEnabled) return;
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const notes = [650, 520, 420, 680, 500, 390];
      
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        const start = now + idx * 0.11;
        osc.frequency.setValueAtTime(freq, start);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.75, start + 0.09);

        gain.gain.setValueAtTime(0.001, start);
        gain.gain.linearRampToValueAtTime(0.12, start + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.095);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + 0.1);
      });
    },

    // Bat high-pitched chirp
    batChirp() {
      if (!isAudioEnabled) return;
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(2200, now);
      osc.frequency.exponentialRampToValueAtTime(3400, now + 0.04);
      osc.frequency.exponentialRampToValueAtTime(1800, now + 0.09);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.1, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.1);
    },

    // Bouncy candy pop
    candyPop() {
      if (!isAudioEnabled) return;
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const base = 350 + Math.random() * 200;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(base, now);
      osc.frequency.exponentialRampToValueAtTime(base * 1.8, now + 0.06);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.14, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
    }
  };

  // SVGs for Halloween characters
  const SVG_ASSETS = {
    // Detailed Jack-o'-Lantern with glowing interior and stem
    jackOLantern: `
      <svg viewBox="0 0 100 90" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="pumpkinShade" cx="45%" cy="40%" r="60%">
            <stop offset="0%" stop-color="#ff9a3c"/>
            <stop offset="65%" stop-color="#f97316"/>
            <stop offset="100%" stop-color="#9a3412"/>
          </radialGradient>
          <linearGradient id="stemGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#4d7c0f"/>
            <stop offset="100%" stop-color="#14532d"/>
          </linearGradient>
        </defs>
        <!-- Stem -->
        <path d="M46 16 C48 6, 56 4, 62 2 C58 9, 53 14, 52 18 Z" fill="url(#stemGrad)"/>
        <!-- Pumpkin Ribs Background -->
        <ellipse cx="28" cy="52" rx="22" ry="30" fill="url(#pumpkinShade)"/>
        <ellipse cx="72" cy="52" rx="22" ry="30" fill="url(#pumpkinShade)"/>
        <ellipse cx="38" cy="53" rx="22" ry="33" fill="url(#pumpkinShade)"/>
        <ellipse cx="62" cy="53" rx="22" ry="33" fill="url(#pumpkinShade)"/>
        <ellipse cx="50" cy="54" rx="24" ry="34" fill="url(#pumpkinShade)"/>
        <!-- Carved Triangular Eyes (Flickering Candle Glow) -->
        <polygon points="32,38 42,46 30,48" class="hw-candle-glow"/>
        <polygon points="68,38 58,46 70,48" class="hw-candle-glow"/>
        <!-- Nose -->
        <polygon points="50,47 45,55 55,55" class="hw-candle-glow"/>
        <!-- Sinister Toothy Grin -->
        <path d="M26 62 Q50 78 74 62 Q68 70 60 70 L60 65 L54 65 L54 71 Q50 71 46 71 L46 65 L40 65 L40 70 Q32 70 26 62 Z" class="hw-candle-glow"/>
      </svg>
    `,

    // Vector Skeleton (Pendulum / Dancer)
    skeleton: `
      <svg viewBox="0 0 100 160" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <!-- Hanging String -->
        <line x1="50" y1="0" x2="50" y2="22" stroke="#e2e8f0" stroke-width="1.8" stroke-dasharray="2,2"/>
        <!-- Skull -->
        <circle cx="50" cy="32" r="12" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.2"/>
        <path d="M44 41 L56 41 L54 47 L46 47 Z" fill="#f8fafc" stroke="#cbd5e1"/>
        <!-- Eye Sockets with Eerie Glow -->
        <circle cx="45" cy="31" r="3.2" fill="#020617"/>
        <circle cx="55" cy="31" r="3.2" fill="#020617"/>
        <circle cx="45" cy="31" r="1.3" fill="#22c55e"/>
        <circle cx="55" cy="31" r="1.3" fill="#22c55e"/>
        <!-- Triangular Nose -->
        <polygon points="50,35 48,39 52,39" fill="#020617"/>
        <!-- Teeth lines -->
        <line x1="47" y1="44" x2="47" y2="47" stroke="#020617" stroke-width="0.8"/>
        <line x1="50" y1="44" x2="50" y2="47" stroke="#020617" stroke-width="0.8"/>
        <line x1="53" y1="44" x2="53" y2="47" stroke="#020617" stroke-width="0.8"/>
        
        <!-- Spine -->
        <line x1="50" y1="48" x2="50" y2="92" stroke="#f8fafc" stroke-width="3" stroke-linecap="round"/>
        
        <!-- Ribcage -->
        <path d="M38 56 Q50 50 62 56" fill="none" stroke="#f8fafc" stroke-width="2.2" stroke-linecap="round"/>
        <path d="M36 63 Q50 57 64 63" fill="none" stroke="#f8fafc" stroke-width="2.2" stroke-linecap="round"/>
        <path d="M37 70 Q50 64 63 70" fill="none" stroke="#f8fafc" stroke-width="2.2" stroke-linecap="round"/>
        <path d="M39 77 Q50 72 61 77" fill="none" stroke="#f8fafc" stroke-width="2.2" stroke-linecap="round"/>
        
        <!-- Pelvis -->
        <path d="M40 88 C40 83 60 83 60 88 C55 94 45 94 40 88 Z" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.2"/>

        <!-- Left Arm -->
        <path d="M38 56 L24 72 L18 64" fill="none" stroke="#f8fafc" stroke-width="2.2" stroke-linecap="round"/>
        <!-- Right Arm (Waving) -->
        <path d="M62 56 L76 68 L86 54" fill="none" stroke="#f8fafc" stroke-width="2.2" stroke-linecap="round"/>

        <!-- Left Leg -->
        <path d="M44 94 L42 120 L38 148" fill="none" stroke="#f8fafc" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M38 148 L31 150" stroke="#f8fafc" stroke-width="2.4" stroke-linecap="round"/>
        
        <!-- Right Leg -->
        <path d="M56 94 L58 120 L62 148" fill="none" stroke="#f8fafc" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M62 148 L69 150" stroke="#f8fafc" stroke-width="2.4" stroke-linecap="round"/>
      </svg>
    `,

    // Creeping Zombie Character
    zombie: `
      <svg viewBox="0 0 90 120" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="zombieSkin" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#84cc16"/>
            <stop offset="100%" stop-color="#4d7c0f"/>
          </linearGradient>
          <linearGradient id="zombieShirt" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#7e22ce"/>
            <stop offset="100%" stop-color="#581c87"/>
          </linearGradient>
        </defs>
        <!-- Legs / Ragged Pants -->
        <rect x="32" y="76" width="10" height="34" rx="3" fill="#1e293b"/>
        <rect x="48" y="76" width="10" height="34" rx="3" fill="#0f172a"/>
        <polygon points="30,105 44,105 40,114 28,114" fill="#475569"/>
        <polygon points="48,105 62,105 60,114 48,114" fill="#334155"/>
        
        <!-- Torso / Tattered Shirt -->
        <path d="M28 44 L62 44 L66 78 L58 74 L52 80 L44 74 L36 79 L24 76 Z" fill="url(#zombieShirt)"/>
        
        <!-- Exposed Rib / Bone patch -->
        <circle cx="36" cy="58" r="3" fill="#f8fafc"/>
        <line x1="33" y1="62" x2="40" y2="62" stroke="#f8fafc" stroke-width="1.5"/>

        <!-- Head -->
        <rect x="32" y="14" width="28" height="30" rx="8" fill="url(#zombieSkin)"/>
        <!-- Brain sliver / exposed skull -->
        <path d="M38 14 Q44 6 52 14" fill="#fb7185" stroke="#f43f5e" stroke-width="1.5"/>
        <!-- Stitches -->
        <line x1="42" y1="18" x2="48" y2="24" stroke="#1c1917" stroke-width="1.2"/>
        <line x1="41" y1="21" x2="45" y2="19" stroke="#1c1917" stroke-width="1.2"/>
        <line x1="45" y1="23" x2="49" y2="21" stroke="#1c1917" stroke-width="1.2"/>

        <!-- Glowing Mismatched Eyes -->
        <circle cx="39" cy="28" r="4.5" fill="#fef08a"/>
        <circle cx="39" cy="28" r="1.8" fill="#15803d"/>
        <circle cx="51" cy="27" r="3.2" fill="#fef08a"/>
        <circle cx="51" cy="27" r="1.2" fill="#15803d"/>
        
        <!-- Zombie Mouth & One Tooth -->
        <path d="M38 38 Q45 42 54 37" fill="none" stroke="#1c1917" stroke-width="2" stroke-linecap="round"/>
        <rect x="42" y="37" width="2.5" height="4" fill="#fef08a"/>

        <!-- Outstretched Zombie Arms -->
        <g class="hw-zombie-arm-lunge">
          <path d="M58 48 L78 44 L86 42" stroke="url(#zombieShirt)" stroke-width="7" stroke-linecap="round" fill="none"/>
          <circle cx="87" cy="42" r="4" fill="url(#zombieSkin)"/>
          <line x1="88" y1="40" x2="94" y2="39" stroke="url(#zombieSkin)" stroke-width="2" stroke-linecap="round"/>
          <line x1="88" y1="43" x2="95" y2="43" stroke="url(#zombieSkin)" stroke-width="2" stroke-linecap="round"/>
          <line x1="87" y1="45" x2="93" y2="46" stroke="url(#zombieSkin)" stroke-width="2" stroke-linecap="round"/>
        </g>
      </svg>
    `,

    // Zombie Hand bursting from the earth
    zombieHand: `
      <svg viewBox="0 0 80 90" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="rottingArm" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stop-color="#365314"/>
            <stop offset="50%" stop-color="#4d7c0f"/>
            <stop offset="100%" stop-color="#84cc16"/>
          </linearGradient>
        </defs>
        <!-- Grave Dirt Mound -->
        <ellipse cx="40" cy="85" rx="36" ry="12" fill="#451a03"/>
        <polygon points="12,82 18,74 24,84" fill="#78350f"/>
        <polygon points="34,80 40,71 46,82" fill="#92400e"/>
        <polygon points="56,83 62,75 68,85" fill="#78350f"/>
        
        <!-- Forearm with torn sleeve -->
        <path d="M30 85 L32 50 L48 50 L50 85 Z" fill="#6b21a8"/>
        <path d="M33 50 L35 32 L47 32 L47 50 Z" fill="url(#rottingArm)"/>
        
        <!-- Palm and grasping fingers -->
        <ellipse cx="40" cy="30" rx="9" ry="7" fill="url(#rottingArm)"/>
        <!-- Fingers with claws -->
        <path d="M33 26 L29 12 L26 13" stroke="url(#rottingArm)" stroke-width="3.2" stroke-linecap="round" fill="none"/>
        <path d="M38 25 L37 8 L35 9" stroke="url(#rottingArm)" stroke-width="3.2" stroke-linecap="round" fill="none"/>
        <path d="M43 25 L45 9 L48 10" stroke="url(#rottingArm)" stroke-width="3.2" stroke-linecap="round" fill="none"/>
        <path d="M47 27 L53 14 L55 16" stroke="url(#rottingArm)" stroke-width="3" stroke-linecap="round" fill="none"/>
        <!-- Thumb -->
        <path d="M31 31 L24 28 L23 30" stroke="url(#rottingArm)" stroke-width="3" stroke-linecap="round" fill="none"/>
      </svg>
    `,

    // Flying Silhouette Bat
    bat: `
      <svg viewBox="0 0 60 30" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <!-- Left Wing -->
        <path class="bat-wing-left" d="M30 15 C26 7, 16 4, 3 10 C8 15, 14 15, 17 21 C21 16, 26 17, 30 18 Z" fill="#0f172a"/>
        <!-- Right Wing -->
        <path class="bat-wing-right" d="M30 15 C34 7, 44 4, 57 10 C52 15, 46 15, 43 21 C39 16, 34 17, 30 18 Z" fill="#0f172a"/>
        <!-- Bat Body & Ears -->
        <ellipse cx="30" cy="15" rx="4.5" ry="7" fill="#020617"/>
        <polygon points="27,10 26,4 29,9" fill="#020617"/>
        <polygon points="33,10 34,4 31,9" fill="#020617"/>
        <!-- Tiny Glowing Eyes -->
        <circle cx="28.5" cy="12" r="0.75" fill="#f97316"/>
        <circle cx="31.5" cy="12" r="0.75" fill="#f97316"/>
      </svg>
    `,

    // Corner Cobweb
    cobweb: `
      <svg viewBox="0 0 100 100" width="85" height="85" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 0 L100 0 M0 0 L92 38 M0 0 L71 71 M0 0 L38 92 M0 0 L0 100" stroke="rgba(255,255,255,0.4)" stroke-width="1.2"/>
        <path d="M25 0 Q23 10 0 25" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="1"/>
        <path d="M50 0 Q46 20 0 50" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="1"/>
        <path d="M75 0 Q68 30 0 75" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="1"/>
        <path d="M100 0 Q90 40 0 100" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="1"/>
      </svg>
    `,

    // Witch Hat for Avatar
    witchHat: `
      <svg viewBox="0 0 80 80" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="40" cy="65" rx="36" ry="9" fill="#1e1b4b" stroke="#0f172a" stroke-width="1.5"/>
        <path d="M18 64 C26 45, 34 26, 42 8 C44 26, 52 46, 62 64 Z" fill="#1e1b4b"/>
        <!-- Orange Ribbon Band -->
        <path d="M22 57 C32 54, 48 54, 58 57 L59 62 C49 59, 31 59, 21 62 Z" fill="#f97316"/>
        <!-- Buckle -->
        <rect x="36" y="55" width="8" height="7" rx="1.5" fill="none" stroke="#fef08a" stroke-width="2"/>
      </svg>
    `
  };

  // Fun physics quotes for Halloween ghouls
  const GHOUL_QUOTES = [
    "Braaaains... and Kinematics! v = Δx / Δt!",
    "Skeleton torque: τ = I α!",
    "Zero muscle friction, 100% structural integrity!",
    "Gravitational acceleration: g = 9.8 m/s² down to the grave!",
    "Momentum is conserved: p_before = p_after!",
    "Energy cannot be destroyed... only resurrected!",
    "Watch out for terminal velocity!",
    "Spooky action at a distance? Einstein called it!"
  ];

  // Spawn Speech Bubble above an element
  function showGhoulSpeech(element, text) {
    // Remove existing bubble if any
    const existing = element.querySelector('.hw-speech-bubble');
    if (existing) existing.remove();

    const bubble = document.createElement('div');
    bubble.className = 'hw-speech-bubble';
    bubble.textContent = text || GHOUL_QUOTES[Math.floor(Math.random() * GHOUL_QUOTES.length)];
    element.appendChild(bubble);

    setTimeout(() => {
      bubble.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
      bubble.style.opacity = '0';
      bubble.style.transform = 'translateX(-50%) translateY(-10px)';
      setTimeout(() => bubble.remove(), 400);
    }, 2800);
  }

  // Interactive Kinematics Physics Candy Drop
  function dropPhysicsCandy(originX, originY, count = 8) {
    SpookyAudio.candyPop();
    const treats = ['🎃', '🍬', '🍭', '🍫', '💀', '👻', '🧪', '🦇'];
    const gravity = 980; // pixels / s^2

    for (let i = 0; i < count; i++) {
      const candy = document.createElement('div');
      candy.className = 'hw-physics-candy';
      candy.textContent = treats[Math.floor(Math.random() * treats.length)];
      candy.style.fontSize = `${1.2 + Math.random() * 0.8}rem`;

      const startX = originX !== undefined ? originX : (window.innerWidth * (0.2 + Math.random() * 0.6));
      const startY = originY !== undefined ? originY : (100 + Math.random() * 80);

      document.body.appendChild(candy);

      let x = startX;
      let y = startY;
      let vx = (Math.random() - 0.5) * 450; // px/s
      let vy = -220 - Math.random() * 320; // upward pop px/s
      let rotation = Math.random() * 360;
      let rotSpeed = (Math.random() - 0.5) * 500;
      let bounceCount = 0;
      let lastTime = performance.now();

      function updatePhysics(now) {
        const dt = Math.min((now - lastTime) / 1000, 0.05);
        lastTime = now;

        vy += gravity * dt;
        x += vx * dt;
        y += vy * dt;
        rotation += rotSpeed * dt;

        // Bottom bounce floor
        const floor = window.innerHeight - 40;
        if (y >= floor) {
          y = floor;
          vy = -vy * 0.62; // restitution
          vx = vx * 0.8;  // friction
          bounceCount++;
          if (bounceCount < 3 && Math.abs(vy) > 80) {
            SpookyAudio.candyPop();
          }
        }

        candy.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${rotation}deg)`;

        // Keep animating while active
        if (bounceCount < 5 && Math.abs(vy) > 15) {
          requestAnimationFrame(updatePhysics);
        } else {
          // Fade out and remove
          candy.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
          candy.style.opacity = '0';
          candy.style.transform += ' scale(0.6)';
          setTimeout(() => candy.remove(), 800);
        }
      }

      requestAnimationFrame(updatePhysics);
    }
  }

  // Create & mount the entire Halloween ecosystem
  function initHalloween() {
    if (!isThemeActive) return;

    document.body.classList.add('halloween-active');

    // 1. Add Blood Moon to sky
    if (!document.querySelector('.hw-harvest-moon')) {
      const moon = document.createElement('div');
      moon.className = 'hw-harvest-moon';
      moon.title = 'Harvest Blood Moon: Angular diameter θ = 0.5°';
      document.body.appendChild(moon);
    }

    // 2. Add Graveyard Mist along the bottom
    if (!document.querySelector('.hw-mist-container')) {
      const mistContainer = document.createElement('div');
      mistContainer.className = 'hw-mist-container';
      mistContainer.innerHTML = `
        <div class="hw-mist-wave"></div>
        <div class="hw-mist-wave-2"></div>
      `;
      document.body.appendChild(mistContainer);
    }

    // 3. Add Corner Cobwebs on Header & Top corners
    const header = document.querySelector('.site-header');
    if (header && !header.querySelector('.hw-cobweb-tl')) {
      const webL = document.createElement('div');
      webL.className = 'hw-cobweb hw-cobweb-tl';
      webL.innerHTML = SVG_ASSETS.cobweb;
      header.appendChild(webL);

      const webR = document.createElement('div');
      webR.className = 'hw-cobweb hw-cobweb-tr';
      webR.innerHTML = SVG_ASSETS.cobweb;
      header.appendChild(webR);

      // Add Witch Hat to Mr. Mudry's avatar
      const brand = header.querySelector('.brand');
      if (brand && !brand.querySelector('.hw-witch-hat')) {
        brand.style.position = 'relative';
        const hat = document.createElement('div');
        hat.className = 'hw-witch-hat';
        hat.innerHTML = SVG_ASSETS.witchHat;
        brand.appendChild(hat);
      }
    }

    // 4. Harmonic Pendulum Skeleton (Left side)
    if (!document.querySelector('.hw-pendulum-skeleton')) {
      const skel = document.createElement('div');
      skel.className = 'hw-pendulum-skeleton';
      skel.title = 'Harmonic Skeleton Oscillator • Click to rattle bones!';
      skel.innerHTML = SVG_ASSETS.skeleton;
      skel.addEventListener('click', (e) => {
        e.stopPropagation();
        skel.classList.add('hw-bone-rattle');
        SpookyAudio.boneRattle();
        showGhoulSpeech(skel, 'Skeleton Torque: τ = I α! Zero friction!');
        setTimeout(() => skel.classList.remove('hw-bone-rattle'), 1200);
      });
      document.body.appendChild(skel);
    }

    // 5. Zombie Hand rising from earth (Bottom Right)
    if (!document.querySelector('.hw-zombie-hand-ground')) {
      const hand = document.createElement('div');
      hand.className = 'hw-zombie-hand-ground';
      hand.title = 'Undead Hand • Click to awaken!';
      hand.innerHTML = SVG_ASSETS.zombieHand;
      hand.addEventListener('click', (e) => {
        e.stopPropagation();
        SpookyAudio.zombieGroan();
        showGhoulSpeech(hand, 'Mmm... braaaains & physics!');
        dropPhysicsCandy(e.clientX - 20, e.clientY - 60, 4);
      });
      document.body.appendChild(hand);
    }

    // 6. Interactive Jack-O'-Lanterns on Featured Cards
    decorateCardsWithPumpkins();

    // 7. Ambient Flying Bat Swarm (1-2 bats in sky)
    createFlyingBat();

    // 8. Mount Spooky Season Control HUD
    mountHalloweenHUD();
  }

  // Decorate today card / hero banner with pumpkins
  function decorateCardsWithPumpkins() {
    const targets = [
      document.querySelector('.bellringer-hero-banner'),
      document.querySelector('.today-card'),
      document.querySelector('.live-card')
    ].filter(Boolean);

    targets.forEach((card, idx) => {
      if (card.querySelector('.hw-pumpkin-perch')) return;
      card.classList.add('hw-pumpkin-card');

      const pumpkin = document.createElement('div');
      pumpkin.className = 'hw-pumpkin-perch';
      pumpkin.title = 'Interactive Jack-O-Lantern • Click for Physics Treats!';
      pumpkin.innerHTML = SVG_ASSETS.jackOLantern;
      pumpkin.addEventListener('click', (e) => {
        e.stopPropagation();
        SpookyAudio.pumpkinCackle();
        const rect = pumpkin.getBoundingClientRect();
        dropPhysicsCandy(rect.left + rect.width / 2, rect.top, 7);
      });

      card.appendChild(pumpkin);
    });

    // Add Spooky Season Hero Banner Tag
    const heroTitle = document.querySelector('.hero h1');
    if (heroTitle && !document.querySelector('.hw-october-banner')) {
      const banner = document.createElement('div');
      banner.className = 'hw-october-banner';
      banner.innerHTML = '<span>🎃</span> OCTOBER SPECIAL: GRAVITY, GHOULS &amp; SPOOKY PHYSICS <span>👻</span>';
      heroTitle.parentNode.insertBefore(banner, heroTitle);
    }
  }

  // Flying bat generator
  function createFlyingBat() {
    if (document.querySelector('.hw-bat')) return;
    const bat = document.createElement('div');
    bat.className = 'hw-bat';
    bat.style.width = '42px';
    bat.style.height = '24px';
    bat.innerHTML = SVG_ASSETS.bat;

    let posX = -60;
    let posY = 90 + Math.random() * 80;
    let speedX = 2.2 + Math.random() * 1.5;
    let angle = 0;

    bat.addEventListener('click', () => {
      SpookyAudio.batChirp();
      bat.style.transform = 'scale(1.4) rotate(360deg)';
      setTimeout(() => {
        bat.style.transform = '';
      }, 400);
    });

    document.body.appendChild(bat);

    function animateBat() {
      if (!isThemeActive || !bat.parentNode) return;
      posX += speedX;
      angle += 0.05;
      const currentY = posY + Math.sin(angle) * 28;

      bat.style.transform = `translate3d(${posX}px, ${currentY}px, 0)`;

      if (posX > window.innerWidth + 60) {
        posX = -70;
        posY = 80 + Math.random() * 120;
        speedX = 2.0 + Math.random() * 1.8;
      }
      requestAnimationFrame(animateBat);
    }

    requestAnimationFrame(animateBat);
  }

  // Summon Zombie Walking Across Viewport
  function summonZombieWalker() {
    let zombie = document.querySelector('.hw-zombie-walker');
    if (zombie) zombie.remove();

    zombie = document.createElement('div');
    zombie.className = 'hw-zombie-walker';
    zombie.innerHTML = SVG_ASSETS.zombie;
    document.body.appendChild(zombie);

    SpookyAudio.zombieGroan();
    showGhoulSpeech(zombie, 'BRAAAINS... and Δx / Δt!');

    let x = -90;
    const speed = 1.1; // m/s style creeping pace

    zombie.addEventListener('click', (e) => {
      e.stopPropagation();
      SpookyAudio.zombieGroan();
      showGhoulSpeech(zombie, GHOUL_QUOTES[Math.floor(Math.random() * GHOUL_QUOTES.length)]);
      dropPhysicsCandy(x + 40, window.innerHeight - 100, 5);
    });

    function step() {
      if (!isThemeActive || !zombie.parentNode) return;
      x += speed;
      zombie.style.transform = `translateX(${x}px)`;

      if (x < window.innerWidth + 100) {
        requestAnimationFrame(step);
      } else {
        zombie.remove();
      }
    }

    requestAnimationFrame(step);
  }

  // Spooky Control HUD
  function mountHalloweenHUD() {
    if (document.querySelector('.hw-hud')) return;

    const hud = document.createElement('div');
    hud.className = 'hw-hud';
    hud.innerHTML = `
      <div class="hw-hud-toggle-btn" id="hw-hud-btn" title="Toggle Halloween Season Settings">
        <span>🎃</span> Spooky Season
      </div>
      <div class="hw-hud-panel" id="hw-hud-panel">
        <div class="hw-hud-header">
          <div class="hw-hud-title"><span>🎃</span> October Physics</div>
          <button class="hw-hud-btn" id="hw-close-panel-btn">✕</button>
        </div>
        <div class="hw-hud-row">
          <span>Halloween Atmosphere</span>
          <button class="hw-hud-btn ${isThemeActive ? 'active' : ''}" id="hw-toggle-theme">
            ${isThemeActive ? 'ON' : 'OFF'}
          </button>
        </div>
        <div class="hw-hud-row">
          <span>Spooky Sound FX</span>
          <button class="hw-hud-btn ${isAudioEnabled ? 'active' : ''}" id="hw-toggle-audio">
            ${isAudioEnabled ? '🔊 ON' : '🔇 OFF'}
          </button>
        </div>
        <button class="hw-hud-action-btn" id="hw-drop-candy">
          🍬 Drop Physics Candy
        </button>
        <button class="hw-hud-action-btn" id="hw-summon-zombie">
          🧟 Summon Zombie
        </button>
        <button class="hw-hud-action-btn" id="hw-skeleton-dance">
          💀 Skeleton Rattle
        </button>
      </div>
    `;

    document.body.appendChild(hud);

    const toggleBtn = hud.querySelector('#hw-hud-btn');
    const panel = hud.querySelector('#hw-hud-panel');
    const closeBtn = hud.querySelector('#hw-close-panel-btn');
    const themeBtn = hud.querySelector('#hw-toggle-theme');
    const audioBtn = hud.querySelector('#hw-toggle-audio');
    const candyBtn = hud.querySelector('#hw-drop-candy');
    const zombieBtn = hud.querySelector('#hw-summon-zombie');
    const skelBtn = hud.querySelector('#hw-skeleton-dance');

    toggleBtn.addEventListener('click', () => {
      panel.classList.toggle('open');
      getAudioContext(); // user gesture unlocks audio
    });

    closeBtn.addEventListener('click', () => {
      panel.classList.remove('open');
    });

    // Theme Toggle
    themeBtn.addEventListener('click', () => {
      isThemeActive = !isThemeActive;
      localStorage.setItem(STORAGE_KEY_THEME, isThemeActive ? 'enabled' : 'disabled');
      themeBtn.textContent = isThemeActive ? 'ON' : 'OFF';
      themeBtn.classList.toggle('active', isThemeActive);

      if (isThemeActive) {
        initHalloween();
      } else {
        removeHalloweenElements();
      }
    });

    // Audio Toggle
    audioBtn.addEventListener('click', () => {
      isAudioEnabled = !isAudioEnabled;
      localStorage.setItem(STORAGE_KEY_AUDIO, isAudioEnabled ? 'enabled' : 'disabled');
      audioBtn.textContent = isAudioEnabled ? '🔊 ON' : '🔇 OFF';
      audioBtn.classList.toggle('active', isAudioEnabled);
      if (isAudioEnabled) {
        getAudioContext();
        SpookyAudio.boneRattle();
      }
    });

    // Drop Candy Action
    candyBtn.addEventListener('click', () => {
      dropPhysicsCandy(window.innerWidth / 2, 120, 12);
    });

    // Summon Zombie Action
    zombieBtn.addEventListener('click', () => {
      summonZombieWalker();
    });

    // Skeleton Dance Action
    skelBtn.addEventListener('click', () => {
      const skel = document.querySelector('.hw-pendulum-skeleton');
      if (skel) {
        skel.classList.add('hw-bone-rattle');
        SpookyAudio.boneRattle();
        showGhoulSpeech(skel, '206 Bones in Harmonic Motion!');
        setTimeout(() => skel.classList.remove('hw-bone-rattle'), 1500);
      }
    });
  }

  // Remove Halloween elements if toggled off
  function removeHalloweenElements() {
    document.body.classList.remove('halloween-active');
    const toRemove = [
      '.hw-harvest-moon',
      '.hw-mist-container',
      '.hw-cobweb',
      '.hw-pendulum-skeleton',
      '.hw-zombie-hand-ground',
      '.hw-zombie-walker',
      '.hw-bat',
      '.hw-pumpkin-perch',
      '.hw-october-banner',
      '.hw-witch-hat'
    ];
    toRemove.forEach((sel) => {
      document.querySelectorAll(sel).forEach((el) => el.remove());
    });
  }

  // Hook into lifecycle
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHalloween);
  } else {
    initHalloween();
  }

  // Expose global controller
  window.HalloweenPhysics = {
    dropCandy: dropPhysicsCandy,
    summonZombie: summonZombieWalker,
    audio: SpookyAudio,
    refreshCards: decorateCardsWithPumpkins
  };
})();
