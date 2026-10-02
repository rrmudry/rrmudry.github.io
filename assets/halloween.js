/* ==========================================================================
   HALLOWEEN THEME — "Night at Orange High: The Graveyard of Dead Theories"

   Runs only in October (or with ?halloween=on to preview; ?halloween=off to hide).
   Every page with a .hero gets a moonlit scene drawn on one canvas:
     • a harvest moon, stars, drifting clouds and fog
     • bat flocks crossing the sky
     • will-o'-wisps that act like charged particles (inverse-square repulsion from the cursor)
     • a spider on a silk thread that behaves like a damped mass-on-a-spring (grab & fling it)
     • jack-o'-lanterns that launch candy along projectile arcs with g = 10 m/s²
   …above a graveyard of debunked physics theories; click a tombstone for its epitaph.

   Chromebook-friendly: one canvas per hero, DPR capped at 1.5, animation pauses when the
   hero is off-screen or the tab is hidden, and "Calm" mode / prefers-reduced-motion draws a
   still scene. Sound is OFF by default and only plays after a click.
   ========================================================================== */
(function () {
  'use strict';
  if (window.HalloweenPhysics) return;

  const params = new URLSearchParams(window.location.search);
  const preview = params.get('halloween');
  const inSeason = preview === 'on' || (preview !== 'off' && new Date().getMonth() === 9);
  const noop = () => {};
  if (!inSeason || window.self !== window.top) {
    window.HalloweenPhysics = { active: false, dropCandy: noop, summonZombie: noop };
    return;
  }

  // ------------------------------------------------------------------------
  // Preferences
  // ------------------------------------------------------------------------
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage blocked */ } }
  };
  const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const prefs = {
    theme: store.get('hw_theme') !== 'off',
    sound: store.get('hw_sound') === 'on',
    calm: store.get('hw_motion') ? store.get('hw_motion') === 'calm' : reducedMotion
  };

  // Physics scale for the scene: 100 px = 1 m, and the class convention g = 10 m/s²
  const PX_PER_M = 100;
  const G = 10 * PX_PER_M;

  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  // ------------------------------------------------------------------------
  // Sound (synthesized, click-triggered only, off by default)
  // ------------------------------------------------------------------------
  const Sound = {
    ctx: null,
    ready() {
      if (!prefs.sound) return false;
      if (!this.ctx) {
        const A = window.AudioContext || window.webkitAudioContext;
        if (!A) return false;
        this.ctx = new A();
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return true;
    },
    tone(type, f0, f1, dur, gain, delay = 0, attack = 0.01) {
      const t = this.ctx.currentTime + delay;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(f0, t);
      if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(gain, t + attack);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g);
      g.connect(this.ctx.destination);
      o.start(t);
      o.stop(t + dur + 0.05);
    },
    // A plucked silk thread; pitch rises with how hard the spider was flung
    pluck(speed) {
      if (!this.ready()) return;
      const f = 180 + Math.min(500, speed * 0.4);
      this.tone('triangle', f, f * 0.97, 0.7, 0.12);
      this.tone('sine', f * 2, f * 1.94, 0.4, 0.04);
    },
    // Low pipe-organ minor chord when a tombstone opens
    organ() {
      if (!this.ready()) return;
      [146.83, 174.61, 220, 293.66].forEach((f, i) => {
        this.tone('sine', f, f, 1.8, 0.045, i * 0.04, 0.15);
        this.tone('triangle', f * 2, f * 2, 1.4, 0.012, i * 0.04, 0.2);
      });
    },
    pop() {
      if (!this.ready()) return;
      this.tone('sine', 520, 1400, 0.12, 0.09);
      this.tone('triangle', 1200, 1900, 0.08, 0.04, 0.05);
    },
    flutter() {
      if (!this.ready()) return;
      for (let i = 0; i < 5; i++) this.tone('square', 2400, 1800, 0.03, 0.015, i * 0.05);
    }
  };

  // ------------------------------------------------------------------------
  // The Graveyard of Dead Theories (historically accurate epitaphs)
  // ------------------------------------------------------------------------
  const THEORIES = [
    {
      id: 'aristotle', stone: 'ARISTOTLE', dates: '350 BC–1638', shape: 'round',
      name: "Aristotle's Falling Bodies",
      claim: 'Heavier objects fall faster than lighter ones.',
      born: 'c. 350 BC (Aristotle)',
      died: '1638 (Galileo, Two New Sciences)',
      cause: 'Galileo timed balls rolling down ramps and showed that, without air resistance, every object falls with the same acceleration. Apollo 15 finished the job in 1971: a hammer and a feather dropped on the Moon landed together.',
      quip: 'It fell no faster than anyone else.'
    },
    {
      id: 'impetus', stone: 'IMPETUS', dates: '500–1687', shape: 'cross',
      name: 'Impetus Theory',
      claim: 'A moving object carries an "impetus" that keeps it going until it runs out.',
      born: '6th century (John Philoponus), revived c. 1350 (Jean Buridan)',
      died: "1687 (Newton's First Law, Principia)",
      cause: 'Newton showed that nothing is needed to keep an object moving. Objects slow down only because a force like friction acts on them. With no net force, motion just continues.',
      quip: 'Survived by its successor: inertia.'
    },
    {
      id: 'caloric', stone: 'CALORIC', dates: '1783–1840s', shape: 'gothic',
      name: 'The Caloric Theory of Heat',
      claim: 'Heat is an invisible, weightless fluid called "caloric" that flows from hot to cold.',
      born: '1780s (Antoine Lavoisier)',
      died: '1840s (James Joule)',
      cause: 'In 1798 Count Rumford noticed that boring out cannon barrels produced endless heat, far more than any stored fluid could explain. In the 1840s James Joule showed that doing work, like stirring water, produces heat. Heat is energy, not a substance.',
      quip: 'Gone, but its warmth lingers.'
    },
    {
      id: 'aether', stone: 'AETHER', dates: '1678–1887', shape: 'slab',
      name: 'The Luminiferous Aether',
      claim: 'Light is a wave, so it must travel through an invisible "aether" filling all of space.',
      born: '1678 (wave theory of light, Christiaan Huygens)',
      died: '1887 (Michelson–Morley experiment)',
      cause: 'Michelson and Morley compared the speed of light in different directions to detect Earth moving through the aether. They found no difference at all. In 1905 Einstein showed light needs no medium.',
      quip: 'Nobody could find it, even at the funeral.'
    },
    {
      id: 'phlogiston', stone: 'PHLOGISTON', dates: '1667–1780s', shape: 'round',
      name: 'Phlogiston',
      claim: 'Things burn by releasing a hidden substance called phlogiston.',
      born: '1667 (Johann Becher), named c. 1703 (Georg Stahl)',
      died: '1780s (Antoine Lavoisier)',
      cause: 'Lavoisier carefully weighed metals before and after burning and found they got heavier, not lighter. Burning combines a substance with oxygen from the air instead of releasing something.',
      quip: 'Went out in a blaze of oxygen.'
    },
    {
      id: 'geocentric', stone: 'GEOCENTRISM', dates: '150–1610', shape: 'gothic',
      name: 'The Earth-Centered Universe',
      claim: 'Earth sits still at the center, and the Sun, Moon, planets and stars all orbit us.',
      born: "c. 150 AD (Ptolemy's Almagest)",
      died: '1543–1610 (Copernicus, then Galileo)',
      cause: "Copernicus put the Sun at the center in 1543. In 1610 Galileo's telescope revealed moons orbiting Jupiter and the full phases of Venus, which an Earth-centered model could not explain.",
      quip: 'The universe stopped revolving around it.'
    }
  ];

  // Layout of the graveyard (x = desktop %, xm = phone %; wideOnly hides on phones)
  const STONE_LAYOUT = [
    { x: 11, xm: 12, w: 86, r: -4, b: 50 },
    { x: 22, xm: 0, w: 74, r: 3, b: 44, wideOnly: true },
    { x: 33, xm: 32, w: 80, r: -2, b: 52 },
    { x: 67, xm: 0, w: 92, r: 2, b: 50, wideOnly: true },
    { x: 78, xm: 68, w: 78, r: -5, b: 46 },
    { x: 89, xm: 89, w: 84, r: 4, b: 52 }
  ];
  const PUMPKINS = [{ x: 44, xm: 0, b: 38, wideOnly: true }, { x: 56, xm: 50, b: 40 }];

  const STONE_PATHS = {
    round: 'M10 140V52A40 40 0 0 1 90 52V140Z',
    gothic: 'M12 140V62Q12 30 50 6Q88 30 88 62V140Z',
    slab: 'M8 140V44Q8 32 20 32H80Q92 32 92 44V140Z',
    cross: 'M40 140V42H16V24H40V2H60V24H84V42H60V108H86V140H14V108H40Z'
  };

  function stoneSVG(t) {
    const id = `hwg-${t.id}`;
    const long = t.stone.length > 8;
    const isCross = t.shape === 'cross';
    const nameY = isCross ? 125 : 86;
    const ripY = isCross ? 36 : 64;
    const engrave = (txt, x, y, size, extra = '') =>
      `<text x="${x + 0.7}" y="${y + 0.9}" font-size="${size}" fill="rgba(255,255,255,0.14)" text-anchor="middle" ${extra}>${txt}</text>` +
      `<text x="${x}" y="${y}" font-size="${size}" fill="rgba(16,13,26,0.88)" text-anchor="middle" ${extra}>${txt}</text>`;
    const fit = long ? `textLength="${isCross ? 64 : 66}" lengthAdjust="spacingAndGlyphs"` : '';
    return `
      <svg viewBox="0 0 100 140" aria-hidden="true" font-family="Georgia, 'Times New Roman', serif" font-weight="700">
        <defs>
          <linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#9a97b4"/><stop offset="0.45" stop-color="#5d5a76"/><stop offset="1" stop-color="#2c2a3b"/>
          </linearGradient>
        </defs>
        <path d="${STONE_PATHS[t.shape]}" fill="url(#${id})" stroke="#1a1826" stroke-width="2"/>
        <path d="${STONE_PATHS[t.shape]}" fill="none" stroke="rgba(221,214,254,0.25)" stroke-width="1" transform="translate(1.2 1.2)"/>
        ${isCross ? '' : '<path d="M66 70l-6 9 4 6-5 10" fill="none" stroke="rgba(10,8,18,0.45)" stroke-width="1.4"/>'}
        <ellipse cx="22" cy="136" rx="14" ry="5" fill="rgba(74,94,64,0.55)"/>
        <ellipse cx="76" cy="137" rx="10" ry="4" fill="rgba(74,94,64,0.45)"/>
        ${isCross ? engrave('R.I.P.', 50, ripY, 10) : engrave('R.I.P.', 50, ripY, 13)}
        ${engrave(t.stone, 50, nameY, long ? 11 : 13, fit)}
        ${isCross ? '' : engrave(t.dates, 50, 104, 8.5, 'font-weight="400"')}
      </svg>`;
  }

  const PUMPKIN_SVG = `
    <svg viewBox="0 0 100 92" aria-hidden="true">
      <defs>
        <radialGradient id="hwg-pk" cx="0.45" cy="0.35" r="0.75">
          <stop offset="0" stop-color="#ffb347"/><stop offset="0.6" stop-color="#f06d0c"/><stop offset="1" stop-color="#8a3204"/>
        </radialGradient>
      </defs>
      <path d="M48 16q-2-10 6-14l4 3q-6 4-4 12z" fill="#4d6b2a"/>
      <ellipse cx="30" cy="54" rx="22" ry="32" fill="url(#hwg-pk)"/>
      <ellipse cx="70" cy="54" rx="22" ry="32" fill="url(#hwg-pk)"/>
      <ellipse cx="50" cy="54" rx="24" ry="35" fill="url(#hwg-pk)"/>
      <path d="M50 20v68M30 24q-8 30 0 60M70 24q8 30 0 60" stroke="rgba(110,40,4,0.45)" stroke-width="2" fill="none"/>
      <g class="hw-pk-face" fill="#ffd36b">
        <path d="M28 44l10-10 8 12z"/><path d="M72 44l-10-10-8 12z"/><path d="M47 52l3-7 3 7z"/>
        <path d="M24 62q26 18 52 0l-4 10-6-4-6 6-6-6-6 6-6-6-6 4z"/>
      </g>
    </svg>`;

  const TREE_SVG = `
    <svg viewBox="0 0 230 250" aria-hidden="true" fill="none" stroke="#07040e" stroke-linecap="round">
      <path d="M70 250C76 200 64 168 80 128C92 96 84 70 100 40" stroke-width="16"/>
      <path d="M80 140C110 120 140 118 168 92C182 80 196 78 214 70" stroke-width="8"/>
      <path d="M168 92C172 74 166 60 176 44" stroke-width="5"/>
      <path d="M190 80C200 92 214 96 226 96" stroke-width="4"/>
      <path d="M100 40C96 26 104 14 98 2" stroke-width="5"/>
      <path d="M92 70C70 56 48 58 30 42C20 34 10 34 2 30" stroke-width="7"/>
      <path d="M48 56C42 44 46 32 38 20" stroke-width="4"/>
      <path d="M74 196C52 186 36 190 18 176" stroke-width="6"/>
      <path d="M100 40C116 30 128 32 140 20" stroke-width="4"/>
      <path d="M140 108C150 124 168 128 180 142" stroke-width="4"/>
    </svg>`;

  const HILL_SVG = `
    <svg class="hw-hill" viewBox="0 0 1440 140" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 64C170 34 360 86 560 60S930 30 1120 62S1350 46 1440 56V140H0Z" fill="#06040d"/>
      <path d="M0 64C170 34 360 86 560 60S930 30 1120 62S1350 46 1440 56" fill="none" stroke="rgba(167,139,250,0.35)" stroke-width="1.5" vector-effect="non-scaling-stroke"/>
    </svg>`;

  const HUD_PUMPKIN = PUMPKIN_SVG.replace('id="hwg-pk"', 'id="hwg-pk-hud"').replace(/url\(#hwg-pk\)/g, 'url(#hwg-pk-hud)');

  // ------------------------------------------------------------------------
  // Pre-rendered sprites (drawn once, stamped every frame — cheap on Chromebooks)
  // ------------------------------------------------------------------------
  function makeCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = Math.ceil(w);
    c.height = Math.ceil(h);
    return c;
  }

  function moonSprite(r) {
    const c = makeCanvas(r * 2 + 4, r * 2 + 4);
    const x = c.getContext('2d');
    const cx = r + 2;
    const g = x.createRadialGradient(cx - r * 0.3, cx - r * 0.35, r * 0.1, cx, cx, r);
    g.addColorStop(0, '#fffaf0');
    g.addColorStop(0.55, '#ffe9c2');
    g.addColorStop(1, '#e8c98f');
    x.fillStyle = g;
    x.beginPath();
    x.arc(cx, cx, r, 0, Math.PI * 2);
    x.fill();
    x.save();
    x.clip();
    // Maria (dark "seas") and a few craters
    x.filter = `blur(${Math.max(1, r * 0.04)}px)`;
    x.fillStyle = 'rgba(160, 128, 90, 0.32)';
    [[-0.25, -0.2, 0.32, 0.24], [0.18, -0.05, 0.22, 0.3], [0.05, 0.32, 0.28, 0.16], [-0.42, 0.22, 0.14, 0.12]].forEach(([dx, dy, rx, ry]) => {
      x.beginPath();
      x.ellipse(cx + dx * r, cx + dy * r, rx * r, ry * r, 0.4, 0, Math.PI * 2);
      x.fill();
    });
    x.filter = 'none';
    x.fillStyle = 'rgba(150, 120, 85, 0.35)';
    [[0.35, 0.35, 0.07], [-0.1, -0.55, 0.05], [0.55, -0.3, 0.06], [-0.55, -0.05, 0.04]].forEach(([dx, dy, rr]) => {
      x.beginPath();
      x.arc(cx + dx * r, cx + dy * r, rr * r, 0, Math.PI * 2);
      x.fill();
    });
    // Limb darkening
    const edge = x.createRadialGradient(cx, cx, r * 0.7, cx, cx, r);
    edge.addColorStop(0, 'rgba(0,0,0,0)');
    edge.addColorStop(1, 'rgba(120, 70, 30, 0.35)');
    x.fillStyle = edge;
    x.fillRect(0, 0, c.width, c.height);
    x.restore();
    return c;
  }

  function glowSprite(radius, color) {
    const c = makeCanvas(radius * 2, radius * 2);
    const x = c.getContext('2d');
    const g = x.createRadialGradient(radius, radius, 0, radius, radius, radius);
    g.addColorStop(0, color);
    g.addColorStop(0.25, color.replace(/[\d.]+\)$/, '0.35)'));
    g.addColorStop(1, color.replace(/[\d.]+\)$/, '0)'));
    x.fillStyle = g;
    x.fillRect(0, 0, c.width, c.height);
    return c;
  }

  function fogSprite(w, h, tint) {
    const c = makeCanvas(w, h);
    const x = c.getContext('2d');
    for (let i = 0; i < 46; i++) {
      const bx = Math.random() * w;
      const by = h * rand(0.35, 0.9);
      const br = rand(h * 0.25, h * 0.6);
      [bx, bx - w, bx + w].forEach(px => {
        const g = x.createRadialGradient(px, by, 0, px, by, br);
        g.addColorStop(0, tint);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        x.fillStyle = g;
        x.beginPath();
        x.arc(px, by, br, 0, Math.PI * 2);
        x.fill();
      });
    }
    return c;
  }

  function cloudSprite(w, h) {
    const c = makeCanvas(w, h);
    const x = c.getContext('2d');
    x.filter = `blur(${h * 0.18}px)`;
    x.fillStyle = 'rgba(28, 20, 54, 0.85)';
    for (let i = 0; i < 7; i++) {
      x.beginPath();
      x.ellipse(w * rand(0.2, 0.8), h * rand(0.4, 0.6), w * rand(0.12, 0.22), h * rand(0.16, 0.26), 0, 0, Math.PI * 2);
      x.fill();
    }
    return c;
  }

  // ------------------------------------------------------------------------
  // One haunted scene per .hero
  // ------------------------------------------------------------------------
  class HauntedHero {
    constructor(hero) {
      this.hero = hero;
      this.running = false;
      this.visible = true;
      this.time = 0;
      this.pointer = { x: -1e4, y: -1e4 };
      this.bats = [];
      this.candies = [];
      this.labels = [];
      this.nextBats = 2.5;

      hero.classList.add('hw-hero');
      this.scene = document.createElement('div');
      this.scene.className = 'hw-scene';
      this.scene.setAttribute('aria-hidden', 'true');
      this.canvas = document.createElement('canvas');
      this.scene.appendChild(this.canvas);
      hero.prepend(this.scene);
      this.ctx = this.canvas.getContext('2d');

      this.buildGraveyard();
      this.buildSpiderHandle();

      this.onMove = (e) => {
        const r = this.hero.getBoundingClientRect();
        this.pointer.x = e.clientX - r.left;
        this.pointer.y = e.clientY - r.top;
      };
      this.onLeave = () => { this.pointer.x = this.pointer.y = -1e4; };
      hero.addEventListener('pointermove', this.onMove, { passive: true });
      hero.addEventListener('pointerleave', this.onLeave, { passive: true });

      this.ro = new ResizeObserver(() => this.resize());
      this.ro.observe(hero);
      this.io = new IntersectionObserver(([entry]) => {
        this.visible = entry.isIntersecting;
        this.syncLoop();
      });
      this.io.observe(hero);
      this.resize();
    }

    // ---------------- DOM: graveyard, pumpkins, epitaph ----------------
    buildGraveyard() {
      const gy = document.createElement('div');
      gy.className = 'hw-graveyard';
      gy.innerHTML = HILL_SVG + `<div class="hw-tree">${TREE_SVG}</div>`;

      THEORIES.forEach((t, i) => {
        const L = STONE_LAYOUT[i];
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'hw-stone' + (L.wideOnly ? ' hw-wide-only' : '');
        b.style.cssText = `--x:${L.x}%;--w:${L.w}px;--r:${L.r}deg;--b:${L.b}px;` + (L.xm ? `--xm:${L.xm}%;` : '');
        b.setAttribute('aria-label', `Tombstone: ${t.name}. Read its epitaph`);
        b.setAttribute('aria-haspopup', 'dialog');
        b.setAttribute('aria-expanded', 'false');
        b.innerHTML = stoneSVG(t);
        b.addEventListener('click', () => this.openEpitaph(t, b));
        gy.appendChild(b);
      });

      PUMPKINS.forEach(p => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'hw-pumpkin' + (p.wideOnly ? ' hw-wide-only' : '');
        b.style.cssText = `--x:${p.x}%;--b:${p.b}px;` + (p.xm ? `--xm:${p.xm}%;` : '');
        b.setAttribute('aria-label', "Jack-o'-lantern: launch candy (projectile motion)");
        b.title = 'Click me: projectile motion with g = 10 m/s²';
        b.innerHTML = PUMPKIN_SVG.replace('id="hwg-pk"', `id="hwg-pk-${p.x}"`).replace(/url\(#hwg-pk\)/g, `url(#hwg-pk-${p.x})`);
        b.addEventListener('click', () => {
          const r = b.getBoundingClientRect();
          const h = this.hero.getBoundingClientRect();
          this.launchCandy(r.left + r.width / 2 - h.left, r.top + r.height * 0.3 - h.top, 9);
        });
        gy.appendChild(b);
      });

      gy.insertAdjacentHTML('beforeend', '<div class="hw-fog-front"></div><p class="hw-grave-hint">The Graveyard of Dead Theories · click a tombstone</p>');
      this.hero.appendChild(gy);
      this.graveyard = gy;

      this.epitaph = document.createElement('div');
      this.epitaph.className = 'hw-epitaph';
      this.epitaph.hidden = true;
      this.epitaph.setAttribute('role', 'dialog');
      this.epitaph.setAttribute('aria-modal', 'false');
      this.hero.appendChild(this.epitaph);

      this.onDocKey = (e) => { if (e.key === 'Escape' && !this.epitaph.hidden) this.closeEpitaph(true); };
      this.onDocClick = (e) => {
        if (this.epitaph.hidden) return;
        if (this.epitaph.contains(e.target) || (this.openStone && this.openStone.contains(e.target))) return;
        this.closeEpitaph(false);
      };
      document.addEventListener('keydown', this.onDocKey);
      document.addEventListener('click', this.onDocClick);
    }

    openEpitaph(t, stone) {
      if (this.openStone === stone && !this.epitaph.hidden) {
        this.closeEpitaph(true);
        return;
      }
      if (this.openStone) this.openStone.setAttribute('aria-expanded', 'false');
      this.openStone = stone;
      stone.setAttribute('aria-expanded', 'true');
      const titleId = `hw-ep-${t.id}`;
      this.epitaph.setAttribute('aria-labelledby', titleId);
      this.epitaph.innerHTML = `
        <div class="hw-ep-top">
          <span class="hw-ep-kicker">✝ Rest in peace ✝</span>
          <button type="button" class="hw-ep-close" aria-label="Close epitaph">×</button>
        </div>
        <h3 class="hw-ep-title" id="${titleId}"><small>Here lies</small>${t.name}</h3>
        <p class="hw-ep-claim">“${t.claim}”</p>
        <dl class="hw-ep-dates"><dt>Born</dt><dd>${t.born}</dd><dt>Died</dt><dd>${t.died}</dd></dl>
        <p class="hw-ep-cause"><strong>Cause of death:</strong> ${t.cause}</p>
        <p class="hw-ep-quip">${t.quip}</p>`;
      this.epitaph.hidden = false;
      // Position above the tombstone, kept inside the hero
      const hr = this.hero.getBoundingClientRect();
      const sr = stone.getBoundingClientRect();
      const width = this.epitaph.offsetWidth;
      const center = sr.left + sr.width / 2 - hr.left;
      this.epitaph.style.left = `${Math.max(12, Math.min(hr.width - width - 12, center - width / 2))}px`;
      this.epitaph.querySelector('.hw-ep-close').addEventListener('click', () => this.closeEpitaph(true));
      this.epitaph.querySelector('.hw-ep-close').focus({ preventScroll: true });
      Sound.organ();
      // A wisp rises from the grave
      this.wisps.push(this.makeWisp(center, this.h - 120, true));
      this.syncLoop();
    }

    closeEpitaph(returnFocus) {
      this.epitaph.hidden = true;
      if (this.openStone) {
        this.openStone.setAttribute('aria-expanded', 'false');
        if (returnFocus) this.openStone.focus({ preventScroll: true });
      }
      this.openStone = null;
    }

    // ---------------- Spider on a silk spring ----------------
    buildSpiderHandle() {
      this.grab = document.createElement('div');
      this.grab.className = 'hw-spider-grab';
      this.grab.title = 'Grab me! A mass on a spring: pull down and let go';
      this.grab.setAttribute('aria-hidden', 'true');
      this.hero.appendChild(this.grab);
      this.spider = null;
      let last = null;
      const toLocal = (e) => {
        const r = this.hero.getBoundingClientRect();
        return { x: e.clientX - r.left, y: e.clientY - r.top, t: performance.now() };
      };
      this.grab.addEventListener('pointerdown', (e) => {
        if (!this.spider) return;
        e.preventDefault();
        this.grab.setPointerCapture(e.pointerId);
        this.spider.dragging = true;
        last = toLocal(e);
        this.syncLoop();
      });
      this.grab.addEventListener('pointermove', (e) => {
        if (!this.spider || !this.spider.dragging) return;
        const p = toLocal(e);
        const dt = Math.max(0.008, (p.t - last.t) / 1000);
        const s = this.spider;
        s.vx = (p.x - s.x) / dt;
        s.vy = (p.y - s.y) / dt;
        s.x = p.x;
        s.y = Math.max(s.ay + 10, p.y);
        last = p;
      });
      const release = () => {
        if (!this.spider || !this.spider.dragging) return;
        this.spider.dragging = false;
        const cap = 2400;
        this.spider.vx = Math.max(-cap, Math.min(cap, this.spider.vx));
        this.spider.vy = Math.max(-cap, Math.min(cap, this.spider.vy));
        Sound.pluck(Math.hypot(this.spider.vx, this.spider.vy));
      };
      this.grab.addEventListener('pointerup', release);
      this.grab.addEventListener('pointercancel', release);
    }

    // ---------------- Layout & sprites ----------------
    resize() {
      const w = this.hero.clientWidth;
      const h = this.hero.clientHeight;
      if (!w || !h) return;
      const dpr = Math.min(1.5, window.devicePixelRatio || 1);
      this.canvas.width = Math.round(w * dpr);
      this.canvas.height = Math.round(h * dpr);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const firstLayout = !this.w;
      const narrow = w < 760;
      this.w = w;
      this.h = h;
      this.narrow = narrow;
      this.floorY = h - (narrow ? 50 : 60);

      // Moon: upper-left on desktop (clear of the panther logo), upper-right on phones
      this.moonR = narrow ? 34 : Math.max(52, Math.min(84, w * 0.055));
      this.moonX = narrow ? w * 0.82 : w * 0.13;
      this.moonY = narrow ? 64 : this.moonR + 64;
      this.moon = moonSprite(this.moonR);
      this.moonGlow = glowSprite(this.moonR * 4, 'rgba(255, 196, 120, 0.42)');
      this.fog = [fogSprite(1200, 220, 'rgba(186, 170, 240, 0.07)'), fogSprite(1000, 200, 'rgba(150, 130, 220, 0.06)')];
      this.cloud = cloudSprite(this.moonR * 5, this.moonR * 1.2);
      if (!this.clouds) this.clouds = [0, 1].map(i => ({ x: rand(-0.4, 1) * w, y: 0, speed: rand(9, 15), off: i }));
      if (!this.wispSprites) {
        this.wispSprites = {
          green: glowSprite(22, 'rgba(141, 255, 196, 0.9)'),
          orange: glowSprite(22, 'rgba(255, 170, 80, 0.9)'),
          violet: glowSprite(22, 'rgba(196, 160, 255, 0.9)')
        };
      }
      // Stars only in the upper sky
      this.stars = Array.from({ length: Math.round(w / 14) }, () => ({
        x: Math.random() * w, y: Math.random() * h * 0.55, r: rand(0.4, 1.3), tw: rand(0, Math.PI * 2), a: rand(0.3, 0.9)
      }));
      if (firstLayout || !this.wisps) {
        this.wisps = Array.from({ length: narrow ? 7 : 14 }, () => this.makeWisp());
      }
      // Spider hangs in front of the moon (desktop only, so it never covers text on phones)
      if (!narrow) {
        const ax = this.moonX + this.moonR * 0.35;
        const L0 = this.moonY + this.moonR * 0.3;
        if (!this.spider) {
          this.spider = { ax, ay: 0, x: ax, y: 6, vx: 0, vy: 0, L: 6, L0, dragging: false, legPhase: 0 };
        } else {
          Object.assign(this.spider, { ax, L0 });
        }
        this.grab.style.display = '';
      } else {
        this.spider = null;
        this.grab.style.display = 'none';
      }
      this.syncLoop();
      if (!this.running) this.draw(0);
    }

    makeWisp(x, y, rising) {
      return {
        x: x != null ? x : rand(0, this.w || 1000),
        y: y != null ? y : rand(80, (this.h || 700) - 160),
        vx: rand(-15, 15),
        vy: rising ? -60 : rand(-15, 15),
        heading: rand(0, Math.PI * 2),
        kind: rising ? 'violet' : pick(['green', 'green', 'orange', 'violet']),
        size: rand(16, 28),
        phase: rand(0, Math.PI * 2),
        life: rising ? 6 : Infinity
      };
    }

    // ---------------- Physics toys ----------------
    launchCandy(x, y, count) {
      for (let i = 0; i < count; i++) {
        const speed = rand(4.5, 7.5) * PX_PER_M;                // 4.5–7.5 m/s
        const angle = (rand(55, 125) * Math.PI) / 180;           // up and outward
        this.candies.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: -Math.sin(angle) * speed,
          rot: rand(0, Math.PI * 2),
          spin: rand(-8, 8),
          kind: pick(['wrap', 'wrap', 'corn']),
          color: pick(['#ff8a1f', '#a855f7', '#22c55e', '#f43f5e']),
          rest: 0,
          bounces: 0
        });
      }
      if (this.candies.length > 70) this.candies.splice(0, this.candies.length - 70);
      this.labels.push({ x, y: y - 20, text: 'projectile motion · g = 10 m/s²', life: 2.2 });
      Sound.pop();
      this.syncLoop();
    }

    spawnBats() {
      const dir = Math.random() < 0.5 ? 1 : -1;
      const nearMoon = !this.narrow && Math.random() < 0.6;
      const baseY = nearMoon ? this.moonY + rand(-this.moonR, this.moonR * 0.6) : rand(this.h * 0.06, this.h * 0.32);
      const n = Math.round(rand(3, 7));
      const speed = rand(120, 190);
      for (let i = 0; i < n; i++) {
        this.bats.push({
          x: dir > 0 ? -40 - i * rand(25, 60) : this.w + 40 + i * rand(25, 60),
          y0: baseY + rand(-40, 40),
          dir,
          speed: speed * rand(0.85, 1.15),
          size: rand(9, 18),
          flap: rand(7, 10),
          phase: rand(0, Math.PI * 2),
          bob: rand(8, 22),
          t: 0
        });
      }
      Sound.flutter();
    }

    update(dt) {
      this.time += dt;
      const calm = prefs.calm;
      const W = this.w, H = this.h;

      if (!calm) {
        this.clouds.forEach(c => { c.x += c.speed * dt; if (c.x > W + 200) c.x = -this.cloud.width - 100; });

        // Bats
        this.nextBats -= dt;
        if (this.nextBats <= 0) {
          this.spawnBats();
          this.nextBats = rand(9, 18);
        }
        this.bats.forEach(b => { b.t += dt; b.x += b.dir * b.speed * dt; });
        this.bats = this.bats.filter(b => b.x > -400 && b.x < W + 400);

        // Wisps: wandering charged particles, pushed away by the cursor (F ∝ 1/r²)
        const px = this.pointer.x, py = this.pointer.y;
        this.wisps.forEach(p => {
          p.heading += rand(-2.2, 2.2) * dt;
          p.vx += Math.cos(p.heading) * 22 * dt;
          p.vy += Math.sin(p.heading) * 22 * dt;
          const dx = p.x - px, dy = p.y - py;
          const r2 = Math.max(dx * dx + dy * dy, 400);
          if (r2 < 220 * 220) {
            const r = Math.sqrt(r2);
            const a = 9e5 / r2;
            p.vx += (dx / r) * a * dt;
            p.vy += (dy / r) * a * dt;
          }
          if (p.life !== Infinity) { p.life -= dt; p.vy -= 10 * dt; }
          const drag = Math.exp(-1.1 * dt);
          p.vx *= drag;
          p.vy *= drag;
          const sp = Math.hypot(p.vx, p.vy);
          if (sp > 280) { p.vx *= 280 / sp; p.vy *= 280 / sp; }
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          if (p.life === Infinity) {
            if (p.x < 10) p.vx += 60 * dt * 10;
            if (p.x > W - 10) p.vx -= 60 * dt * 10;
            if (p.y < 60) p.vy += 60 * dt * 10;
            if (p.y > H - 140) p.vy -= 60 * dt * 10;
          }
        });
        this.wisps = this.wisps.filter(p => p.life > 0);
      }

      // Spider: damped mass on a silk spring (silk only pulls), with gravity
      const s = this.spider;
      if (s) {
        if (s.L < s.L0) s.L = Math.min(s.L0, s.L + 90 * dt);         // descends on its thread
        if (!s.dragging) {
          const steps = Math.ceil(dt / 0.004);
          const h = dt / steps;
          for (let i = 0; i < steps; i++) {
            const dx = s.x - s.ax, dy = s.y - s.ay;
            const d = Math.hypot(dx, dy) || 1;
            const stretch = d - s.L;
            let ax = 0, ay = G * 0.35;                               // a light spider drifts more gently
            if (stretch > 0) {
              const k = 26;                                          // spring constant per unit mass (1/s²)
              ax -= k * stretch * (dx / d);
              ay -= k * stretch * (dy / d);
            }
            const damp = Math.exp(-0.9 * h);
            s.vx = (s.vx + ax * h) * damp;
            s.vy = (s.vy + ay * h) * damp;
            s.x += s.vx * h;
            s.y += s.vy * h;
          }
          if (s.y < s.ay + 8) { s.y = s.ay + 8; s.vy = Math.abs(s.vy) * 0.3; }
        }
        s.legPhase += dt * (2 + Math.min(14, Math.hypot(s.vx, s.vy) / 60));
        this.grab.style.left = `${s.x}px`;
        this.grab.style.top = `${s.y}px`;
      }

      // Candy: projectile motion, bounces on the graveyard ground
      this.candies.forEach(c => {
        if (c.rest > 0) { c.rest += dt; return; }
        c.vy += G * dt;
        c.x += c.vx * dt;
        c.y += c.vy * dt;
        c.rot += c.spin * dt;
        if (c.y > this.floorY) {
          c.y = this.floorY;
          c.vy = -c.vy * 0.45;
          c.vx *= 0.7;
          c.spin *= 0.6;
          c.bounces++;
          if (Math.abs(c.vy) < 70 || c.bounces > 4) { c.vy = 0; c.rest = 0.0001; }
        }
        if (c.x < 6 || c.x > W - 6) c.vx = -c.vx * 0.6;
      });
      this.candies = this.candies.filter(c => c.rest < 5);
      this.labels.forEach(l => { l.life -= dt; l.y -= 18 * dt; });
      this.labels = this.labels.filter(l => l.life > 0);
    }

    // ---------------- Drawing ----------------
    draw() {
      const ctx = this.ctx;
      const W = this.w, H = this.h, t = this.time;
      if (!W) return;
      ctx.clearRect(0, 0, W, H);

      // Stars
      this.stars.forEach(s => {
        ctx.globalAlpha = s.a * (prefs.calm ? 1 : 0.7 + 0.3 * Math.sin(t * 1.7 + s.tw));
        ctx.fillStyle = '#f3efff';
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      // Moon, glow and passing clouds
      const mg = this.moonGlow;
      ctx.drawImage(mg, this.moonX - mg.width / 2, this.moonY - mg.height / 2);
      ctx.drawImage(this.moon, this.moonX - this.moon.width / 2, this.moonY - this.moon.height / 2);
      this.clouds.forEach((c, i) => {
        const cy = this.moonY - this.cloud.height / 2 + (i ? this.moonR * 0.55 : -this.moonR * 0.35);
        ctx.globalAlpha = 0.75;
        ctx.drawImage(this.cloud, c.x, cy);
      });
      ctx.globalAlpha = 1;

      // Bats (silhouettes)
      ctx.fillStyle = '#07040e';
      this.bats.forEach(b => this.drawBat(ctx, b));

      // Spider and its silk
      if (this.spider) this.drawSpider(ctx, this.spider);

      // Back fog drifting behind the graveyard
      const fogY = H - 250;
      this.fog.forEach((f, i) => {
        const off = prefs.calm ? 0 : ((t * (10 + i * 7)) % f.width);
        ctx.globalAlpha = 0.9;
        for (let x = -off; x < W; x += f.width) ctx.drawImage(f, x, fogY + i * 30, f.width, 220);
      });
      ctx.globalAlpha = 1;

      // Will-o'-wisps (additive glow)
      ctx.globalCompositeOperation = 'lighter';
      this.wisps.forEach(p => {
        const spr = this.wispSprites[p.kind];
        const flick = prefs.calm ? 0.8 : 0.65 + 0.35 * Math.sin(t * 5 + p.phase);
        const fade = p.life === Infinity ? 1 : Math.min(1, p.life / 2);
        ctx.globalAlpha = flick * fade;
        ctx.drawImage(spr, p.x - p.size, p.y - p.size, p.size * 2, p.size * 2);
      });
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;

      // Candy
      this.candies.forEach(c => {
        ctx.globalAlpha = c.rest > 3.5 ? Math.max(0, (5 - c.rest) / 1.5) : 1;
        this.drawCandy(ctx, c);
      });
      ctx.globalAlpha = 1;

      // Floating physics labels
      ctx.font = "700 13px system-ui, -apple-system, 'Segoe UI', sans-serif";
      ctx.textAlign = 'center';
      this.labels.forEach(l => {
        ctx.globalAlpha = Math.min(1, l.life);
        ctx.fillStyle = 'rgba(14, 10, 29, 0.8)';
        const tw = ctx.measureText(l.text).width + 16;
        ctx.fillRect(l.x - tw / 2, l.y - 14, tw, 22);
        ctx.fillStyle = '#ffd36b';
        ctx.fillText(l.text, l.x, l.y + 2);
      });
      ctx.globalAlpha = 1;
    }

    drawBat(ctx, b) {
      const y = b.y0 + Math.sin(b.t * 2 + b.phase) * b.bob;
      const f = Math.sin(b.t * b.flap * Math.PI * 2 / 3 + b.phase); // wing beat
      const s = b.size;
      ctx.save();
      ctx.translate(b.x, y);
      ctx.scale(b.dir, 1);
      ctx.beginPath();
      // left wing
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-s * 0.6, -s * 0.9 * f - s * 0.2, -s * 1.5, -s * 0.5 * f);
      ctx.quadraticCurveTo(-s * 1.1, s * 0.05, -s * 0.85, s * 0.25);
      ctx.quadraticCurveTo(-s * 0.55, s * 0.05, -s * 0.3, s * 0.3);
      // right wing
      ctx.lineTo(s * 0.3, s * 0.3);
      ctx.quadraticCurveTo(s * 0.55, s * 0.05, s * 0.85, s * 0.25);
      ctx.quadraticCurveTo(s * 1.1, s * 0.05, s * 1.5, -s * 0.5 * f);
      ctx.quadraticCurveTo(s * 0.6, -s * 0.9 * f - s * 0.2, 0, 0);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(0, s * 0.12, s * 0.22, s * 0.34, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-s * 0.15, -s * 0.15);
      ctx.lineTo(-s * 0.08, -s * 0.38);
      ctx.lineTo(0, -s * 0.18);
      ctx.lineTo(s * 0.08, -s * 0.38);
      ctx.lineTo(s * 0.15, -s * 0.15);
      ctx.fill();
      ctx.restore();
    }

    drawSpider(ctx, s) {
      // Silk thread
      ctx.strokeStyle = 'rgba(236, 232, 255, 0.55)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(s.ax, s.ay);
      ctx.lineTo(s.x, s.y - 8);
      ctx.stroke();
      const ang = Math.atan2(s.x - s.ax, s.y - s.ay);
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(-ang);
      ctx.fillStyle = '#05030a';
      ctx.strokeStyle = '#05030a';
      ctx.lineCap = 'round';
      // 8 jointed legs
      for (let side = -1; side <= 1; side += 2) {
        for (let i = 0; i < 4; i++) {
          const base = (-0.9 + i * 0.55);
          const wig = Math.sin(s.legPhase + i * 1.3 + (side > 0 ? 0.6 : 0)) * 0.18;
          const a1 = base + wig;
          const kx = side * Math.cos(a1) * 13;
          const ky = Math.sin(a1) * 9 - 6;
          const fx = kx + side * 9;
          const fy = ky + 9 + i * 1.5;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(side * 3, i * 2 - 2);
          ctx.lineTo(kx, ky);
          ctx.lineTo(fx, fy);
          ctx.stroke();
        }
      }
      ctx.beginPath();
      ctx.ellipse(0, 9, 8.5, 10.5, 0, 0, Math.PI * 2);   // abdomen
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, -3, 5.5, 0, Math.PI * 2);               // head
      ctx.fill();
      ctx.fillStyle = '#ff7a1a';                         // hourglass marking
      ctx.beginPath();
      ctx.moveTo(-2.4, 6); ctx.lineTo(2.4, 6); ctx.lineTo(0, 9.5); ctx.lineTo(2.4, 13); ctx.lineTo(-2.4, 13); ctx.lineTo(0, 9.5);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffd36b';                         // eyes catching the moonlight
      ctx.fillRect(-2.6, -5, 1.4, 1.4);
      ctx.fillRect(1.2, -5, 1.4, 1.4);
      ctx.restore();
    }

    drawCandy(ctx, c) {
      ctx.save();
      ctx.translate(c.x, c.y - 5);
      ctx.rotate(c.rot);
      if (c.kind === 'corn') {
        ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(6, 6); ctx.lineTo(-6, 6); ctx.closePath();
        ctx.fillStyle = '#fef3c7'; ctx.fill();
        ctx.beginPath(); ctx.moveTo(-3.6, 1.4); ctx.lineTo(3.6, 1.4); ctx.lineTo(6, 6); ctx.lineTo(-6, 6); ctx.closePath();
        ctx.fillStyle = '#f97316'; ctx.fill();
        ctx.beginPath(); ctx.moveTo(-5, 4.2); ctx.lineTo(5, 4.2); ctx.lineTo(6, 6); ctx.lineTo(-6, 6); ctx.closePath();
        ctx.fillStyle = '#facc15'; ctx.fill();
      } else {
        ctx.fillStyle = c.color;
        ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(-11, -5); ctx.lineTo(-11, 5); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(11, -5); ctx.lineTo(11, 5); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.ellipse(0, 0, 7, 5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.beginPath(); ctx.ellipse(-2, -1.8, 2.6, 1.3, -0.3, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }

    // ---------------- Animation loop management ----------------
    needsMotion() {
      if (!prefs.calm) return true;
      // Calm mode still animates things the student triggered on purpose
      return this.candies.length > 0 || this.labels.length > 0 || (this.spider && (this.spider.dragging || this.spider.L < this.spider.L0 ||
        Math.hypot(this.spider.vx, this.spider.vy) > 5));
    }

    syncLoop() {
      const should = this.visible && !document.hidden && this.needsMotion();
      if (should && !this.running) {
        this.running = true;
        this.last = performance.now();
        const frame = (now) => {
          if (!this.running) return;
          const dt = Math.min(0.05, (now - this.last) / 1000);
          this.last = now;
          this.update(dt);
          this.draw();
          if (!this.visible || document.hidden || !this.needsMotion()) {
            this.running = false;
            return;
          }
          this.raf = requestAnimationFrame(frame);
        };
        this.raf = requestAnimationFrame(frame);
      } else if (!should && !this.running) {
        this.draw();
      }
    }

    destroy() {
      this.running = false;
      cancelAnimationFrame(this.raf);
      this.ro.disconnect();
      this.io.disconnect();
      this.hero.removeEventListener('pointermove', this.onMove);
      this.hero.removeEventListener('pointerleave', this.onLeave);
      document.removeEventListener('keydown', this.onDocKey);
      document.removeEventListener('click', this.onDocClick);
      [this.scene, this.graveyard, this.epitaph, this.grab].forEach(el => el && el.remove());
      this.hero.classList.remove('hw-hero');
    }
  }

  // ------------------------------------------------------------------------
  // Theme on/off, footer greeting, and the Spooky Season menu
  // ------------------------------------------------------------------------
  let scenes = [];

  function mountTheme() {
    document.body.classList.add('halloween-active');
    document.body.classList.toggle('hw-calm', prefs.calm);
    scenes = Array.from(document.querySelectorAll('.hero')).map(h => new HauntedHero(h));
    const foot = document.querySelector('.site-footer .foot p');
    if (foot && !foot.querySelector('.hw-foot')) {
      foot.insertAdjacentHTML('beforeend', '<span class="hw-foot"> · 🎃 Happy haunting!</span>');
    }
  }

  function unmountTheme() {
    scenes.forEach(s => s.destroy());
    scenes = [];
    document.body.classList.remove('halloween-active', 'hw-calm');
    document.querySelectorAll('.hw-foot').forEach(el => el.remove());
  }

  function mountHUD() {
    const hud = document.createElement('div');
    hud.className = 'hw-hud' + (prefs.theme ? '' : ' is-off');
    hud.innerHTML = `
      <button type="button" class="hw-hud-btn" aria-expanded="false" aria-controls="hw-hud-panel" title="Spooky Season settings">${HUD_PUMPKIN}<span class="sr-only" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">Spooky Season settings</span></button>
      <div class="hw-hud-panel" id="hw-hud-panel" hidden>
        <p class="hw-hud-title">Spooky Season</p>
        <div class="hw-hud-row"><span>Halloween theme</span><button type="button" class="hw-hud-toggle" data-pref="theme"></button></div>
        <div class="hw-hud-row"><span>Sound effects</span><button type="button" class="hw-hud-toggle" data-pref="sound"></button></div>
        <div class="hw-hud-row"><span>Motion</span><button type="button" class="hw-hud-toggle" data-pref="calm"></button></div>
        <p class="hw-hud-note">Grab the spider, chase the wisps with your cursor, click a pumpkin for projectile candy, and read the tombstones.</p>
      </div>`;
    document.body.appendChild(hud);
    const btn = hud.querySelector('.hw-hud-btn');
    const panel = hud.querySelector('.hw-hud-panel');
    const toggles = hud.querySelectorAll('.hw-hud-toggle');
    const label = {
      theme: v => (v ? 'On' : 'Off'),
      sound: v => (v ? 'On' : 'Off'),
      calm: v => (v ? 'Calm' : 'Full')
    };
    const render = () => toggles.forEach(t => {
      const k = t.dataset.pref;
      t.textContent = label[k](prefs[k]);
      t.setAttribute('aria-pressed', String(k === 'calm' ? !prefs.calm : prefs[k]));
      t.setAttribute('aria-label', `${t.previousElementSibling.textContent}: ${label[k](prefs[k])}`);
    });
    render();
    const setOpen = (open) => {
      panel.hidden = !open;
      btn.setAttribute('aria-expanded', String(open));
    };
    btn.addEventListener('click', (e) => { e.stopPropagation(); setOpen(panel.hidden); });
    document.addEventListener('click', (e) => { if (!hud.contains(e.target)) setOpen(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !panel.hidden) { setOpen(false); btn.focus(); } });
    toggles.forEach(t => t.addEventListener('click', () => {
      const k = t.dataset.pref;
      prefs[k] = !prefs[k];
      if (k === 'theme') {
        store.set('hw_theme', prefs.theme ? 'on' : 'off');
        hud.classList.toggle('is-off', !prefs.theme);
        if (prefs.theme) mountTheme(); else unmountTheme();
      } else if (k === 'sound') {
        store.set('hw_sound', prefs.sound ? 'on' : 'off');
        if (prefs.sound) Sound.pop();
      } else {
        store.set('hw_motion', prefs.calm ? 'calm' : 'full');
        document.body.classList.toggle('hw-calm', prefs.calm);
        scenes.forEach(s => s.syncLoop());
      }
      render();
    }));
  }

  document.addEventListener('visibilitychange', () => scenes.forEach(s => s.syncLoop()));

  function init() {
    if (prefs.theme) mountTheme();
    mountHUD();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  // Public API (kept for any page that calls the previous theme's functions)
  window.HalloweenPhysics = {
    active: true,
    dropCandy(x, y, count = 9) {
      const s = scenes[0];
      if (!s) return;
      s.launchCandy(x != null ? x : s.w / 2, y != null ? y : s.h - 120, count);
    },
    summonZombie() {
      const s = scenes[0];
      if (s) { s.spawnBats(); s.syncLoop(); }
    },
    summonBats() { this.summonZombie(); }
  };
})();
