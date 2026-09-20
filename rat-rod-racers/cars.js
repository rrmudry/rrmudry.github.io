/**
 * Rat Rod Racers - Car Definition, Customizer, Stats & Ghost Roster
 */

class RatRodCar {
  constructor(config = {}) {
    this.name = config.name || "Rusty Rocket";
    this.driver = config.driver || "Student Driver";
    this.number = config.number || 77;

    // Equipped part IDs
    this.parts = {
      chassis: config.parts?.chassis || 'roadster_32',
      engine: config.parts?.engine || 'flathead_v8',
      wheels: config.parts?.wheels || 'rusty_steelies',
      aero: config.parts?.aero || 'clean_bobtail',
      exhaust: config.parts?.exhaust || 'rusty_pipe',
      charm: config.parts?.charm || 'fuzzy_dice'
    };

    // Part upgrade levels (1 = base, 2 = tuned, 3 = master)
    this.levels = {
      chassis: config.levels?.chassis || 1,
      engine: config.levels?.engine || 1,
      wheels: config.levels?.wheels || 1,
      aero: config.levels?.aero || 1,
      exhaust: config.levels?.exhaust || 1,
      charm: config.levels?.charm || 1
    };

    this.wheelAngle = 0;
    this.recomputeStats();
  }

  // Get full part objects from catalog
  getPart(slot) {
    if (slot === 'engines') slot = 'engine';
    if (slot === 'charms') slot = 'charm';
    const id = this.parts[slot];
    if (slot === 'chassis') return RAT_ROD_ASSETS.chassis[id] || RAT_ROD_ASSETS.chassis.roadster_32;
    if (slot === 'engine') return RAT_ROD_ASSETS.engines[id] || RAT_ROD_ASSETS.engines.flathead_v8;
    if (slot === 'wheels') return RAT_ROD_ASSETS.wheels[id] || RAT_ROD_ASSETS.wheels.rusty_steelies;
    if (slot === 'aero') return RAT_ROD_ASSETS.aero[id] || RAT_ROD_ASSETS.aero.clean_bobtail;
    if (slot === 'exhaust') return RAT_ROD_ASSETS.exhaust[id] || RAT_ROD_ASSETS.exhaust.rusty_pipe;
    if (slot === 'charm') return RAT_ROD_ASSETS.charms[id] || RAT_ROD_ASSETS.charms.fuzzy_dice;
    return null;
  }

  equip(slot, partId, level = 1) {
    if (slot === 'engines') slot = 'engine';
    if (slot === 'charms') slot = 'charm';
    if (this.parts[slot] !== undefined) {
      this.parts[slot] = partId;
      this.levels[slot] = level;
      this.recomputeStats();
    }
  }

  // Aggregate physical specs based on parts and upgrade levels
  recomputeStats() {
    const chassis = this.getPart('chassis');
    const engine = this.getPart('engine');
    const wheels = this.getPart('wheels');
    const aero = this.getPart('aero');
    const exhaust = this.getPart('exhaust');
    const charm = this.getPart('charm');

    // Mass calculation (kg)
    // Upgrades reduce chassis/engine weight slightly through lightening
    const chassisMassMult = 1.0 - (this.levels.chassis - 1) * 0.04;
    const engineMassMult = 1.0 - (this.levels.engine - 1) * 0.03;

    this.mass = Math.round(
      chassis.mass * chassisMassMult +
      engine.mass * engineMassMult +
      wheels.mass * 2 + // front & rear set
      (aero.mass || 0) +
      (exhaust.mass || 0) +
      (charm.mass || 0)
    );

    // Engine Drive Force (N)
    // Upgrades boost peak force: Level 2 (+15%), Level 3 (+30%)
    const engineForceMult = 1.0 + (this.levels.engine - 1) * 0.15;
    this.peakForce = Math.round((engine.peakForce || 2000) * engineForceMult);
    this.powerBand = engine.powerBand || 1.0;
    this.nitroBoost = (engine.nitroBoost || 0) + (exhaust.type === 'purgehorns' ? 1000 : 0);
    this.nitroDuration = (engine.nitroDuration || 0) + (exhaust.type === 'purgehorns' ? 1.5 : 0);

    // Tire Friction & Grip (mu)
    // Upgrades buff tire compound: Level 2 (+8%), Level 3 (+16%)
    const tireGripMult = 1.0 + (this.levels.wheels - 1) * 0.08;
    this.mu = Number(((wheels.mu || 0.8) * tireGripMult).toFixed(2));

    // Aerodynamic Drag Area (CdA in m²)
    // Aero wings reduce effective CdA
    const baseCdA = chassis.cdA || 0.35;
    const aeroMod = (aero.cdA || 0) * (1.0 + (this.levels.aero - 1) * 0.1);
    this.cdA = Math.max(0.20, Number((baseCdA + aeroMod).toFixed(3)));

    // Derived physics benchmarks for HUD & Student Learning
    this.maxTheoreticalAccel = Number((this.peakForce / this.mass).toFixed(2)); // m/s²
    this.staticGripLimitForce = Math.round(this.mu * this.mass * 9.81); // N
    this.burnoutRisk = this.peakForce > this.staticGripLimitForce; // Traction warning
    this.powerToWeight = Number((this.peakForce / this.mass).toFixed(2)); // N/kg

    // Performance Index (PI) & Class Classification
    const piInfo = this.computePI();
    this.pi = piInfo.pi;
    this.carClass = piInfo.carClass;
    this.classLabel = piInfo.classLabel;
    this.classColor = piInfo.classColor;
  }

  // Calculate Performance Index (200 - 1000+) based on power-to-weight, traction, aero & tuning
  computePI() {
    const levelSum = Object.values(this.levels).reduce((sum, lvl) => sum + (lvl || 1), 0);
    const ptw = this.peakForce / Math.max(100, this.mass);
    const rawPI = 100 + (ptw * 55) + (this.mu * 120) - (this.cdA * 100) + (levelSum * 15);
    const pi = Math.max(200, Math.round(rawPI));

    let carClass = 'D';
    let classLabel = 'Rookie Jalopy';
    let classColor = '#94a3b8';

    if (pi >= 900) {
      carClass = 'S';
      classLabel = 'Top Fuel Rail';
      classColor = '#ffd166';
    } else if (pi >= 750) {
      carClass = 'A';
      classLabel = 'Pro Mod Gasser';
      classColor = '#ff5400';
    } else if (pi >= 600) {
      carClass = 'B';
      classLabel = 'Hot Rod Custom';
      classColor = '#10b981';
    } else if (pi >= 450) {
      carClass = 'C';
      classLabel = 'Street Tuner';
      classColor = '#00f0ff';
    }

    return { pi, carClass, classLabel, classColor };
  }

  // Serialize car to compact, shareable string code
  toShareCode() {
    const payload = {
      n: this.name,
      d: this.driver,
      p: [
        this.parts.chassis,
        this.parts.engine,
        this.parts.wheels,
        this.parts.aero,
        this.parts.exhaust,
        this.parts.charm
      ],
      l: [
        this.levels.chassis,
        this.levels.engine,
        this.levels.wheels,
        this.levels.aero,
        this.levels.exhaust,
        this.levels.charm
      ]
    };
    try {
      const json = JSON.stringify(payload);
      return 'ROD-' + btoa(encodeURIComponent(json)).replace(/=+$/, '');
    } catch (e) {
      return 'ROD-DEFAULT';
    }
  }

  // Restore car from share code
  static fromShareCode(code) {
    try {
      if (!code || !code.startsWith('ROD-')) return null;
      const base64 = code.replace('ROD-', '');
      const json = decodeURIComponent(atob(base64));
      const p = JSON.parse(json);
      return new RatRodCar({
        name: p.n || "Guest Rod",
        driver: p.d || "Classmate",
        parts: {
          chassis: p.p[0],
          engine: p.p[1],
          wheels: p.p[2],
          aero: p.p[3],
          exhaust: p.p[4],
          charm: p.p[5]
        },
        levels: {
          chassis: p.l ? p.l[0] : 1,
          engine: p.l ? p.l[1] : 1,
          wheels: p.l ? p.l[2] : 1,
          aero: p.l ? p.l[3] : 1,
          exhaust: p.l ? p.l[4] : 1,
          charm: p.l ? p.l[5] : 1
        }
      });
    } catch (e) {
      console.warn("Failed to parse car share code:", e);
      return null;
    }
  }

  // Export JSON save object
  toJSON() {
    return {
      name: this.name,
      driver: this.driver,
      number: this.number,
      parts: { ...this.parts },
      levels: { ...this.levels }
    };
  }
}

/**
 * Built-in Classmate Ghost Roster for Offline / Independent Play
 */
const STUDENT_GHOST_ROSTER = [
  {
    name: "Rusty Sally's Torque Monster",
    driver: "Sally (Period 2)",
    tagline: "Heavy pickup with an earth-shattering blown supercharger and sticky Mickey Thoms slicks!",
    car: new RatRodCar({
      name: "Torque Monster",
      driver: "Sally (Period 2)",
      number: 88,
      parts: {
        chassis: 'scrappy_pickup',
        engine: 'blown_blower',
        wheels: 'fat_drag_slicks',
        aero: 'highway_sign',
        exhaust: 'flaming_zoomies',
        charm: 'hot_rod_flames'
      },
      levels: { chassis: 2, engine: 2, wheels: 2, aero: 1, exhaust: 2, charm: 1 }
    })
  },
  {
    name: "Speedy Sam's Featherweight Bug",
    driver: "Sam (Period 4)",
    tagline: "Chopped '63 Buggy with whistling Junkyard Turbo. Lightweight mass means explosive a = F/m!",
    car: new RatRodCar({
      name: "Featherweight Bug",
      driver: "Sam (Period 4)",
      number: 14,
      parts: {
        chassis: 'bubbly_bug',
        engine: 'junkyard_turbo',
        wheels: 'gold_racing_mags',
        aero: 'iron_ducktail',
        exhaust: 'cherry_glasspacks',
        charm: 'lucky_seven'
      },
      levels: { chassis: 1, engine: 2, wheels: 2, aero: 2, exhaust: 1, charm: 1 }
    })
  },
  {
    name: "Dr. Drag's High-Aero Rail",
    driver: "Marcus (Period 1)",
    tagline: "Minimal frontal area tube chassis with dual-blade wing. Slices through aerodynamic drag!",
    car: new RatRodCar({
      name: "Rail Rocket",
      driver: "Marcus (Period 1)",
      number: 99,
      parts: {
        chassis: 'iron_coffin',
        engine: 'nitrous_beast',
        wheels: 'fat_drag_slicks',
        aero: 'dual_blade_wing',
        exhaust: 'nitrous_purge_horns',
        charm: 'skull_mascot'
      },
      levels: { chassis: 2, engine: 3, wheels: 3, aero: 3, exhaust: 2, charm: 2 }
    })
  },
  {
    name: "Gasser Gary's Milk Express",
    driver: "Gary (Period 5)",
    tagline: "Nose-high '51 delivery van packing a Tesla Arc Spark-Plant. Instant torque off the line!",
    car: new RatRodCar({
      name: "Milk Express",
      driver: "Gary (Period 5)",
      number: 51,
      parts: {
        chassis: 'milk_truck',
        engine: 'electric_arc',
        wheels: 'whitewall_cruisers',
        aero: 'plywood_airdam',
        exhaust: 'chrome_lake_pipes',
        charm: 'rust_rivets'
      },
      levels: { chassis: 1, engine: 2, wheels: 1, aero: 1, exhaust: 1, charm: 1 }
    })
  },
  {
    name: "Barn-Find Benny's Rookie Jalopy",
    driver: "Benny (Period 3)",
    tagline: "Honest beginner rat rod with Lawnmower Twin and solid steelies. Great benchmark rival!",
    car: new RatRodCar({
      name: "Rookie Jalopy",
      driver: "Benny (Period 3)",
      number: 3,
      parts: {
        chassis: 'roadster_32',
        engine: 'lawnmower_twin',
        wheels: 'rusty_steelies',
        aero: 'clean_bobtail',
        exhaust: 'rusty_pipe',
        charm: 'fuzzy_dice'
      },
      levels: { chassis: 1, engine: 1, wheels: 1, aero: 1, exhaust: 1, charm: 1 }
    })
  }
];

// Pre-calculate PI and Class on all benchmark ghost rivals
STUDENT_GHOST_ROSTER.forEach(r => {
  r.pi = r.car.pi;
  r.carClass = r.car.carClass;
  r.classLabel = r.car.classLabel;
  r.classColor = r.car.classColor;
});

/**
 * 2D Canvas Composite Car Drawer
 * Renders the layered cute rat rod with dynamic wheel rotation, chassis squat,
 * animated exhaust flames, smoke, and supercharger intake flap response.
 */
function drawRatRodCanvas(ctx, car, x, y, state = {}, options = {}) {
  ctx.save();
  ctx.translate(x, y);

  const scale = options.scale || 1.0;
  ctx.scale(scale, scale);

  const speed = state.v || 0;
  const accel = state.a || 0;
  const wheelAngle = state.wheelAngle || 0;
  const isSlipping = state.isSlipping || false;
  const nitroActive = state.nitroActive || false;

  // Dynamic squat: car tilts back under acceleration (squat angle)
  // Max squat ~4 degrees (0.07 rad)
  const squatAngle = Math.min(0.07, Math.max(-0.03, accel * 0.007));
  
  // Idle vibration wobble
  const idleWobble = (options.idle ? Math.sin(Date.now() * 0.02) * 1.2 : 0);

  // Chassis tilt center is near rear axle (x = -45, y = 0)
  ctx.save();
  ctx.translate(-45, -25 + idleWobble);
  ctx.rotate(-squatAngle);
  ctx.translate(45, 25);

  const chassis = car.getPart('chassis');
  const engine = car.getPart('engine');
  const wheels = car.getPart('wheels');
  const aero = car.getPart('aero');
  const exhaust = car.getPart('exhaust');
  const charm = car.getPart('charm');

  // 1. Exhaust & Animated Flames (Behind body)
  _drawExhaustCanvas(ctx, exhaust, speed, accel, nitroActive);

  // 2. Rear Aero / Spoiler (Behind body)
  _drawAeroCanvas(ctx, aero);

  // 3. Chassis Body
  _drawChassisCanvas(ctx, chassis, charm);

  // 4. Engine & Exposed Blower / Turbos
  _drawEngineCanvas(ctx, engine, accel, nitroActive);

  // 5. Charms / Decals (e.g. Fuzzy dice swinging with acceleration)
  _drawCharmsCanvas(ctx, charm, accel);

  ctx.restore(); // end squat transform

  // 6. Wheels (Front and Rear axles stay grounded on track!)
  _drawWheelsCanvas(ctx, wheels, wheelAngle, isSlipping);

  // 7. Tire Burnout Smoke
  if (isSlipping && speed < 35) {
    _drawTireSmoke(ctx, -45, 0);
  }

  ctx.restore();
}

function _drawChassisCanvas(ctx, chassis, charm) {
  const col = chassis.color || '#a04822';
  const acc = chassis.accent || '#d48834';

  ctx.save();
  ctx.translate(-70, -65);

  // Helper for comic ink outline
  const ink = (w = 2.6) => {
    ctx.strokeStyle = '#12121c';
    ctx.lineWidth = w;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  // Helper to get darker shade for cel-shading
  const getDarker = (hex, factor = 0.72) => {
    if (!hex || !hex.startsWith('#')) return '#1a1a24';
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    const num = parseInt(c, 16);
    const r = Math.max(0, Math.floor(((num >> 16) & 255) * factor));
    const g = Math.max(0, Math.floor(((num >> 8) & 255) * factor));
    const b = Math.max(0, Math.floor((num & 255) * factor));
    return `rgb(${r},${g},${b})`;
  };

  const darkCol = getDarker(col, 0.68);
  const darkAcc = getDarker(acc, 0.72);

  // 1. Heavy Boxed Stamped Steel Frame Rails with Lightening Holes
  ctx.fillStyle = '#22232e';
  ctx.fillRect(4, 52, 134, 10);
  // Lower shadow on frame rail
  ctx.fillStyle = '#14141d';
  ctx.fillRect(4, 58, 134, 4);
  ink(2.4);
  ctx.strokeRect(4, 52, 134, 10);

  // Round lightening holes in frame
  [30, 65, 100].forEach(hx => {
    ctx.fillStyle = '#0e0f14';
    ctx.beginPath();
    ctx.arc(hx, 57, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#495057';
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  switch (chassis.renderType) {
    case 'pickup': {
      // '48 Scrappy Pickup: Heavy chopped cab & wooden stake bed
      // Cab Body Main
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(34, 52);
      ctx.lineTo(34, 20);
      ctx.quadraticCurveTo(45, 6, 76, 6);
      ctx.lineTo(84, 6);
      ctx.quadraticCurveTo(90, 6, 94, 22);
      ctx.lineTo(98, 52);
      ctx.closePath();
      ctx.fill();

      // Cel-shading lower cab shadow
      ctx.fillStyle = darkCol;
      ctx.beginPath();
      ctx.moveTo(34, 52);
      ctx.lineTo(34, 38);
      ctx.quadraticCurveTo(65, 42, 98, 40);
      ctx.lineTo(98, 52);
      ctx.closePath();
      ctx.fill();

      // Top gloss highlight streak
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 2.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(46, 9);
      ctx.lineTo(76, 9);
      ctx.stroke();

      // Cab Ink Outline
      ink(2.8);
      ctx.beginPath();
      ctx.moveTo(34, 52);
      ctx.lineTo(34, 20);
      ctx.quadraticCurveTo(45, 6, 76, 6);
      ctx.lineTo(84, 6);
      ctx.quadraticCurveTo(90, 6, 94, 22);
      ctx.lineTo(98, 52);
      ctx.closePath();
      ctx.stroke();

      // Sun Visor Brow over Windshield
      ctx.fillStyle = darkAcc;
      ctx.beginPath();
      ctx.moveTo(68, 8);
      ctx.lineTo(88, 8);
      ctx.lineTo(86, 12);
      ctx.lineTo(68, 12);
      ctx.closePath();
      ctx.fill();
      ink(1.8);
      ctx.stroke();

      // Chopped Windshield with Comic Glare Slashes
      ctx.fillStyle = '#12121c';
      ctx.fillRect(40, 16, 38, 14); // rubber gasket
      ctx.fillStyle = '#a2d2ff';
      ctx.fillRect(42, 17, 34, 12);
      // Glare lines
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(47, 27); ctx.lineTo(55, 18);
      ctx.moveTo(58, 27); ctx.lineTo(66, 18);
      ctx.stroke();

      // Wooden Slat Stake Bed
      ctx.fillStyle = '#8a5a36'; // wood base
      ctx.fillRect(8, 30, 26, 22);
      ctx.fillStyle = '#653e20'; // wood lower shadow
      ctx.fillRect(8, 42, 26, 10);
      // Wood grain slats
      ctx.strokeStyle = '#3e2411';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(8, 37); ctx.lineTo(34, 37);
      ctx.moveTo(8, 44); ctx.lineTo(34, 44);
      ctx.stroke();
      // Bed top metal cap with bolts
      ctx.fillStyle = acc;
      ctx.fillRect(6, 24, 29, 6);
      ink(2.4);
      ctx.strokeRect(6, 24, 29, 6);
      ctx.strokeRect(8, 30, 26, 22);
      // Carriage bolts
      ctx.fillStyle = '#ced4da';
      [10, 18, 26, 32].forEach(bx => {
        ctx.beginPath(); ctx.arc(bx, 27, 1.2, 0, Math.PI * 2); ctx.fill();
      });

      // Front Hood & Radiator
      ctx.fillStyle = col;
      ctx.fillRect(96, 28, 30, 24);
      ctx.fillStyle = darkCol;
      ctx.fillRect(96, 42, 30, 10);
      ink(2.6);
      ctx.strokeRect(96, 28, 30, 24);

      // Radiator Shell
      ctx.fillStyle = '#ced4da';
      ctx.fillRect(124, 24, 8, 28);
      ctx.fillStyle = '#12121c';
      ctx.fillRect(126, 28, 4, 22);
      ink(2.2);
      ctx.strokeRect(124, 24, 8, 28);

      // Bullet Headlamp with warm glowing lens & glint
      ctx.fillStyle = '#ced4da';
      ctx.beginPath();
      ctx.arc(128, 22, 6, 0, Math.PI * 2);
      ctx.fill();
      ink(2.0);
      ctx.stroke();
      ctx.fillStyle = '#ffea79';
      ctx.beginPath();
      ctx.arc(128, 22, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(126, 20, 1.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'buggy': {
      // '63 Bubbly Buggy: Exaggerated curved beetle roof & bug-eyes
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(18, 52);
      ctx.quadraticCurveTo(28, 8, 72, 8);
      ctx.quadraticCurveTo(116, 8, 128, 52);
      ctx.closePath();
      ctx.fill();

      // Lower cel-shade
      ctx.fillStyle = darkCol;
      ctx.beginPath();
      ctx.moveTo(18, 52);
      ctx.quadraticCurveTo(50, 36, 128, 52);
      ctx.closePath();
      ctx.fill();

      // Top gloss highlight
      ctx.strokeStyle = 'rgba(255,255,255,0.75)';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(45, 12);
      ctx.quadraticCurveTo(72, 10, 95, 12);
      ctx.stroke();

      // Outer ink stroke
      ink(2.8);
      ctx.beginPath();
      ctx.moveTo(18, 52);
      ctx.quadraticCurveTo(28, 8, 72, 8);
      ctx.quadraticCurveTo(116, 8, 128, 52);
      ctx.closePath();
      ctx.stroke();

      // Split Bubble Windows with Comic Glare
      const drawBugWindow = (cx, cy, r) => {
        ctx.fillStyle = '#12121c';
        ctx.beginPath(); ctx.arc(cx, cy, r + 1.5, Math.PI, 0); ctx.fill();
        ctx.fillStyle = '#a2d2ff';
        ctx.beginPath(); ctx.arc(cx, cy, r, Math.PI, 0); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.85)';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(cx - r + 3, cy); ctx.lineTo(cx, cy - r + 3);
        ctx.stroke();
      };
      drawBugWindow(56, 26, 12);
      drawBugWindow(84, 26, 12);

      // Cut Fenders & Big Chrome Bug-Eyes
      ctx.fillStyle = '#ced4da';
      ctx.beginPath();
      ctx.arc(126, 36, 7, 0, Math.PI * 2);
      ctx.fill();
      ink(2.2);
      ctx.stroke();
      ctx.fillStyle = '#ffea79';
      ctx.beginPath();
      ctx.arc(126, 36, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(124, 34, 1.8, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'dragster': {
      // Iron Coffin Dragster: Ultra-low slingshot tubular rail
      // Tubular cage diagonals
      ctx.strokeStyle = '#fca311';
      ctx.lineWidth = 4.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(6, 54); ctx.lineTo(134, 54);
      ctx.stroke();
      ink(1.8);
      ctx.stroke();

      // Slingshot Cockpit Roll Cage
      ctx.strokeStyle = '#e0e1dd';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(18, 52);
      ctx.lineTo(28, 16);
      ctx.lineTo(46, 16);
      ctx.lineTo(54, 52);
      ctx.stroke();
      ink(1.8);
      ctx.stroke();

      // Aluminum Seat & Steering Butterfly
      ctx.fillStyle = '#343a40';
      ctx.fillRect(28, 30, 16, 22);
      ctx.fillStyle = '#dc3545';
      ctx.beginPath();
      ctx.arc(36, 26, 4, 0, Math.PI * 2); // helmet preview
      ctx.fill();
      ink(1.5);
      ctx.stroke();

      // Pointed Alloy Nose Cone with Heat Bluing
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(105, 46);
      ctx.lineTo(138, 54);
      ctx.lineTo(105, 58);
      ctx.closePath();
      ctx.fill();
      // Heat tint gradient
      ctx.fillStyle = 'rgba(13, 110, 253, 0.45)';
      ctx.beginPath();
      ctx.moveTo(125, 51);
      ctx.lineTo(138, 54);
      ctx.lineTo(125, 56);
      ctx.closePath();
      ctx.fill();
      ink(2.4);
      ctx.beginPath();
      ctx.moveTo(105, 46);
      ctx.lineTo(138, 54);
      ctx.lineTo(105, 58);
      ctx.closePath();
      ctx.stroke();
      break;
    }

    case 'milktruck': {
      // '51 Milk Truck: Boxy nose-high Gasser delivery cab
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(12, 52);
      ctx.lineTo(12, 12);
      ctx.quadraticCurveTo(12, 6, 22, 6);
      ctx.lineTo(84, 6);
      ctx.lineTo(92, 30);
      ctx.lineTo(122, 34);
      ctx.lineTo(125, 52);
      ctx.closePath();
      ctx.fill();

      // Cel-shading lower half
      ctx.fillStyle = darkCol;
      ctx.fillRect(12, 36, 113, 16);

      // Top gloss highlight
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(24, 9); ctx.lineTo(82, 9);
      ctx.stroke();

      ink(2.8);
      ctx.beginPath();
      ctx.moveTo(12, 52);
      ctx.lineTo(12, 12);
      ctx.quadraticCurveTo(12, 6, 22, 6);
      ctx.lineTo(84, 6);
      ctx.lineTo(92, 30);
      ctx.lineTo(122, 34);
      ctx.lineTo(125, 52);
      ctx.closePath();
      ctx.stroke();

      // Chopped Gasser Windshield
      ctx.fillStyle = '#12121c';
      ctx.fillRect(78, 12, 14, 18);
      ctx.fillStyle = '#a2d2ff';
      ctx.fillRect(80, 14, 10, 14);
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(82, 26); ctx.lineTo(88, 16);
      ctx.stroke();

      // Sun Visor
      ctx.fillStyle = acc;
      ctx.fillRect(72, 10, 22, 4);
      ink(1.8);
      ctx.strokeRect(72, 10, 22, 4);

      // Side Cargo Panel with Vintage Milk Bottle Emblem
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(48, 24, 8, 0, Math.PI * 2);
      ctx.fill();
      ink(1.5);
      ctx.stroke();
      ctx.fillStyle = '#0d6efd';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('MILK', 48, 27);

      // Gasser Nose & Grille
      ctx.fillStyle = '#ced4da';
      ctx.fillRect(121, 32, 6, 20);
      ink(2.0);
      ctx.strokeRect(121, 32, 6, 20);
      break;
    }

    case 'boneshaker': {
      // Bone Shaker Coupe: Radical chopped roof & Menacing Skull Grille
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(22, 52);
      ctx.lineTo(22, 28);
      ctx.lineTo(50, 12);
      ctx.lineTo(84, 12);
      ctx.lineTo(92, 32);
      ctx.lineTo(120, 36);
      ctx.lineTo(122, 52);
      ctx.closePath();
      ctx.fill();

      // Lower cel shade
      ctx.fillStyle = darkCol;
      ctx.fillRect(22, 38, 100, 14);

      // Gloss streak
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(52, 14); ctx.lineTo(82, 14);
      ctx.stroke();

      ink(2.8);
      ctx.beginPath();
      ctx.moveTo(22, 52);
      ctx.lineTo(22, 28);
      ctx.lineTo(50, 12);
      ctx.lineTo(84, 12);
      ctx.lineTo(92, 32);
      ctx.lineTo(120, 36);
      ctx.lineTo(122, 52);
      ctx.closePath();
      ctx.stroke();

      // Narrow Slit Chopped Amber Windows
      ctx.fillStyle = '#12121c';
      ctx.beginPath();
      ctx.moveTo(52, 18); ctx.lineTo(80, 18); ctx.lineTo(84, 28); ctx.lineTo(52, 28);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffbe0b';
      ctx.beginPath();
      ctx.moveTo(54, 20); ctx.lineTo(78, 20); ctx.lineTo(82, 26); ctx.lineTo(54, 26);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(58, 25); ctx.lineTo(65, 21); ctx.stroke();

      // Brass Rivets across the chopped roofline
      ctx.fillStyle = '#fca311';
      [28, 40, 52, 64, 76].forEach(rx => {
        ctx.beginPath(); ctx.arc(rx, 15, 1.3, 0, Math.PI * 2); ctx.fill();
      });

      // Menacing 3D Cartoon Skull Radiator Grille
      ctx.fillStyle = '#f8f9fa';
      ctx.beginPath();
      ctx.arc(122, 40, 8, 0, Math.PI * 2);
      ctx.fill();
      // Jaw
      ctx.fillRect(118, 44, 8, 6);
      ink(2.2);
      ctx.beginPath(); ctx.arc(122, 40, 8, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeRect(118, 44, 8, 6);
      // Dark Eye Sockets
      ctx.fillStyle = '#12121c';
      ctx.beginPath();
      ctx.arc(120, 39, 2.2, 0, Math.PI * 2);
      ctx.arc(125, 39, 2.2, 0, Math.PI * 2);
      ctx.fill();
      // Teeth
      ctx.fillStyle = '#fff';
      ctx.fillRect(119, 45, 1.8, 4);
      ctx.fillRect(122, 45, 1.8, 4);
      ctx.fillRect(125, 45, 1.8, 4);
      break;
    }

    default: { // roadster_32
      // Chopped '32 Highboy Roadster
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(24, 52);
      ctx.lineTo(24, 28);
      ctx.quadraticCurveTo(34, 16, 66, 16);
      ctx.lineTo(76, 16);
      ctx.quadraticCurveTo(84, 16, 90, 30);
      ctx.lineTo(120, 32);
      ctx.lineTo(122, 52);
      ctx.closePath();
      ctx.fill();

      // Cel-shading lower body
      ctx.fillStyle = darkCol;
      ctx.beginPath();
      ctx.moveTo(24, 52);
      ctx.lineTo(24, 38);
      ctx.quadraticCurveTo(65, 40, 122, 42);
      ctx.lineTo(122, 52);
      ctx.closePath();
      ctx.fill();

      // Top gloss highlight
      ctx.strokeStyle = 'rgba(255,255,255,0.75)';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(38, 18);
      ctx.quadraticCurveTo(60, 16, 75, 17);
      ctx.stroke();

      // Ink outline
      ink(2.8);
      ctx.beginPath();
      ctx.moveTo(24, 52);
      ctx.lineTo(24, 28);
      ctx.quadraticCurveTo(34, 16, 66, 16);
      ctx.lineTo(76, 16);
      ctx.quadraticCurveTo(84, 16, 90, 30);
      ctx.lineTo(120, 32);
      ctx.lineTo(122, 52);
      ctx.closePath();
      ctx.stroke();

      // Chopped Framed Windshield
      ctx.fillStyle = '#12121c';
      ctx.beginPath();
      ctx.moveTo(74, 16); ctx.lineTo(84, 2); ctx.lineTo(89, 2); ctx.lineTo(87, 16);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#a2d2ff';
      ctx.beginPath();
      ctx.moveTo(76, 15); ctx.lineTo(84, 4); ctx.lineTo(87, 4); ctx.lineTo(85, 15);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(78, 13); ctx.lineTo(84, 5); ctx.stroke();

      // Chrome Radiator Shell with Louvers
      ctx.fillStyle = '#ced4da';
      ctx.fillRect(118, 26, 8, 26);
      ink(2.2);
      ctx.strokeRect(118, 26, 8, 26);
      ctx.strokeStyle = '#12121c';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(120, 31); ctx.lineTo(124, 31);
      ctx.moveTo(120, 37); ctx.lineTo(124, 37);
      ctx.moveTo(120, 43); ctx.lineTo(124, 43);
      ctx.stroke();

      // Radiator cap with star glint
      ctx.fillStyle = '#f8f9fa';
      ctx.beginPath();
      ctx.arc(122, 24, 2.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
  }

  // Radiator Smiling Teeth if Shark charm is equipped
  if (charm && charm.type === 'shark') {
    ctx.fillStyle = '#dc3545';
    ctx.fillRect(115, 40, 8, 10);
    ink(1.8);
    ctx.strokeRect(115, 40, 8, 10);
    ctx.fillStyle = '#ffffff';
    // Top & bottom sharp white teeth
    ctx.beginPath();
    ctx.moveTo(116, 40); ctx.lineTo(118, 44); ctx.lineTo(120, 40); ctx.lineTo(122, 44);
    ctx.moveTo(116, 50); ctx.lineTo(118, 46); ctx.lineTo(120, 50); ctx.lineTo(122, 46);
    ctx.fill();
  }

  ctx.restore();
}

function _drawEngineCanvas(ctx, engine, accel, nitroActive) {
  ctx.save();
  ctx.translate(15, -42);

  const ink = (w = 2.4) => {
    ctx.strokeStyle = '#12121c';
    ctx.lineWidth = w;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  switch (engine.type) {
    case 'blower': {
      // 6-71 Supercharger: Ribbed aluminum casing, Gilmer belt & dynamic butterfly flaps
      // Supercharger block
      ctx.fillStyle = '#d0d5dd';
      ctx.fillRect(-2, 0, 36, 18);
      // Cooling ribs
      ctx.fillStyle = '#98a2b3';
      ctx.fillRect(-2, 4, 36, 2.5);
      ctx.fillRect(-2, 10, 36, 2.5);
      ink(2.4);
      ctx.strokeRect(-2, 0, 36, 18);

      // Gilmer toothed drive belt & pulleys
      ctx.fillStyle = '#14141d'; // toothed belt
      ctx.fillRect(30, 2, 7, 24);
      // Pulleys
      ctx.fillStyle = '#ced4da';
      ctx.beginPath(); ctx.arc(33, 5, 6, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(33, 22, 7.5, 0, Math.PI * 2); ctx.fill();
      ink(2.0);
      ctx.beginPath(); ctx.arc(33, 5, 6, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(33, 22, 7.5, 0, Math.PI * 2); ctx.stroke();

      // Big Aggressive Red Scoop
      ctx.fillStyle = '#e63946';
      ctx.beginPath();
      ctx.moveTo(-6, 0);
      ctx.lineTo(-12, -16);
      ctx.lineTo(28, -16);
      ctx.lineTo(24, 0);
      ctx.closePath();
      ctx.fill();
      // Scoop mouth interior shadow
      ctx.fillStyle = '#12121c';
      ctx.fillRect(-10, -15, 36, 6);
      ink(2.6);
      ctx.beginPath();
      ctx.moveTo(-6, 0);
      ctx.lineTo(-12, -16);
      ctx.lineTo(28, -16);
      ctx.lineTo(24, 0);
      ctx.closePath();
      ctx.stroke();

      // Dual Gold Butterfly Flaps that dynamically pivot open with acceleration!
      const flapOpen = Math.min(1.0, Math.max(0.18, accel / 4.5));
      const drawButterfly = (bx) => {
        ctx.save();
        ctx.translate(bx, -12);
        ctx.scale(1.0 - flapOpen * 0.75, 1.0);
        ctx.fillStyle = '#ffbe0b';
        ctx.beginPath(); ctx.arc(0, 0, 4.2, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#d48834'; ctx.lineWidth = 1.2; ctx.stroke();
        ctx.restore();
      };
      drawButterfly(2);
      drawButterfly(14);
      break;
    }

    case 'turbo': {
      // Whistling Junkyard Turbo: Snail compressor & big blue cone filter
      ctx.fillStyle = '#343a40';
      ctx.fillRect(0, 4, 28, 16);
      ink(2.4);
      ctx.strokeRect(0, 4, 28, 16);

      // Snail housing
      ctx.fillStyle = '#ced4da';
      ctx.beginPath();
      ctx.arc(20, -1, 9, 0, Math.PI * 2);
      ctx.fill();
      ink(2.4);
      ctx.stroke();
      // Turbo spiral inking
      ctx.strokeStyle = '#495057';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.arc(20, -1, 5, 0, Math.PI * 1.5);
      ctx.stroke();

      // Big High-Flow Blue Cone Filter
      ctx.fillStyle = '#0d6efd';
      ctx.beginPath();
      ctx.moveTo(28, -6);
      ctx.lineTo(40, -14);
      ctx.lineTo(40, 4);
      ctx.closePath();
      ctx.fill();
      // Filter pleats
      ctx.strokeStyle = '#0a58ca';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(31, -4); ctx.lineTo(39, -10);
      ctx.moveTo(31, 0); ctx.lineTo(39, -2);
      ctx.stroke();
      ink(2.4);
      ctx.beginPath();
      ctx.moveTo(28, -6);
      ctx.lineTo(40, -14);
      ctx.lineTo(40, 4);
      ctx.closePath();
      ctx.stroke();
      break;
    }

    case 'electric': {
      // Tesla Arc Spark-Plant: Battery block with crackling cyan comic lightning
      ctx.fillStyle = '#1b263b';
      ctx.fillRect(-2, -2, 34, 22);
      // Hazard warning chevrons
      ctx.fillStyle = '#ffbe0b';
      ctx.fillRect(2, 14, 26, 4);
      ink(2.4);
      ctx.strokeRect(-2, -2, 34, 22);

      // Copper Bus Bars
      ctx.fillStyle = '#b87333';
      ctx.fillRect(4, -10, 6, 8);
      ctx.fillRect(16, -10, 6, 8);
      ink(2.0);
      ctx.strokeRect(4, -10, 6, 8);
      ctx.strokeRect(16, -10, 6, 8);

      // Animated Crackling Cyan Comic Lightning Arcs
      const boltPhase = Date.now() * 0.015;
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2.4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(7, -10);
      ctx.lineTo(10 + Math.sin(boltPhase) * 3, -15);
      ctx.lineTo(13 + Math.cos(boltPhase) * 3, -8);
      ctx.lineTo(19, -10);
      ctx.stroke();
      // Lightning core glint
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      break;
    }

    case 'nitrous': {
      // Nitrous Beast: Triple gold velocity stacks & blue NOS bottle
      ctx.fillStyle = '#212529';
      ctx.fillRect(0, 0, 32, 20);
      ink(2.4);
      ctx.strokeRect(0, 0, 32, 20);

      // Triple High-Rise Gold Velocity Stacks
      const drawStack = (sx) => {
        ctx.fillStyle = '#ffbe0b';
        ctx.beginPath();
        ctx.moveTo(sx, 0);
        ctx.lineTo(sx - 2, -15);
        ctx.lineTo(sx + 6, -15);
        ctx.lineTo(sx + 4, 0);
        ctx.closePath();
        ctx.fill();
        // Red throat interior
        ctx.fillStyle = '#dc3545';
        ctx.beginPath(); ctx.ellipse(sx + 2, -15, 3.5, 1.5, 0, 0, Math.PI * 2); ctx.fill();
        ink(2.0);
        ctx.beginPath();
        ctx.moveTo(sx, 0); ctx.lineTo(sx - 2, -15); ctx.lineTo(sx + 6, -15); ctx.lineTo(sx + 4, 0);
        ctx.closePath(); ctx.stroke();
      };
      drawStack(4);
      drawStack(13);
      drawStack(22);

      // Glossy Blue Nitrous Bottle with silver valve
      ctx.fillStyle = '#0077b6';
      ctx.fillRect(-18, -4, 12, 24);
      ctx.fillStyle = '#ced4da'; // chrome valve
      ctx.fillRect(-15, -8, 6, 4);
      ink(2.2);
      ctx.strokeRect(-18, -4, 12, 24);
      break;
    }

    case 'twin': {
      // Lawnmower Twin: Exposed V-twin with cooling fins & round air cleaner
      ctx.fillStyle = '#495057';
      ctx.fillRect(0, 4, 28, 16);
      ink(2.4);
      ctx.strokeRect(0, 4, 28, 16);
      // Cooling fins
      ctx.strokeStyle = '#ced4da';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(2, 8); ctx.lineTo(26, 8);
      ctx.moveTo(2, 12); ctx.lineTo(26, 12);
      ctx.stroke();
      // Round teardrop air cleaner
      ctx.fillStyle = '#ced4da';
      ctx.beginPath(); ctx.arc(14, -2, 7, 0, Math.PI * 2); ctx.fill();
      ink(2.2);
      ctx.beginPath(); ctx.arc(14, -2, 7, 0, Math.PI * 2); ctx.stroke();
      break;
    }

    default: { // flathead_v8
      // Flathead V8: Finned Edelbrock heads & twin Stromberg 97 carbs
      ctx.fillStyle = '#6c584c';
      ctx.fillRect(0, 4, 30, 16);
      ink(2.4);
      ctx.strokeRect(0, 4, 30, 16);
      // Finned aluminum cylinder head
      ctx.fillStyle = '#ced4da';
      ctx.fillRect(2, -2, 26, 6);
      ink(1.8);
      ctx.strokeRect(2, -2, 26, 6);
      // Twin Stromberg 97 Carbs with brass velocity horns
      const drawStromberg = (cx) => {
        ctx.fillStyle = '#adc178';
        ctx.fillRect(cx, -10, 7, 8);
        ctx.fillStyle = '#ffd166';
        ctx.beginPath(); ctx.arc(cx + 3.5, -12, 3.5, 0, Math.PI * 2); ctx.fill();
        ink(1.8);
        ctx.strokeRect(cx, -10, 7, 8);
        ctx.beginPath(); ctx.arc(cx + 3.5, -12, 3.5, 0, Math.PI * 2); ctx.stroke();
      };
      drawStromberg(6);
      drawStromberg(17);
      break;
    }
  }

  ctx.restore();
}

function _drawWheelsCanvas(ctx, wheels, wheelAngle, isSlipping) {
  // Classic Hot Rod Rake:
  // Rear Fat Drag Wheel at (-45, 0), radius 27
  ctx.save();
  ctx.translate(-45, 0);
  _drawSingleWheel(ctx, wheels, 27, wheelAngle, true);
  ctx.restore();

  // Front Skinny Wheel at (48, 4), radius 18
  ctx.save();
  ctx.translate(48, 4);
  _drawSingleWheel(ctx, wheels, 18, wheelAngle * 1.5, false);
  ctx.restore();
}

function _drawSingleWheel(ctx, wheels, radius, angle, isRear) {
  ctx.save();

  const ink = (w = 2.6) => {
    ctx.strokeStyle = '#12121c';
    ctx.lineWidth = w;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  // 1. Chunky Comic Black Rubber Tire
  ctx.fillStyle = '#161722';
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();

  // 2. Visible Comic Tread Notches along tire perimeter
  ctx.save();
  ctx.rotate(angle);
  const numLugs = isRear ? 14 : 10;
  ctx.fillStyle = '#0d0e14';
  for (let i = 0; i < numLugs; i++) {
    const th = (i / numLugs) * Math.PI * 2;
    const lx = Math.cos(th) * (radius - 2);
    const ly = Math.sin(th) * (radius - 2);
    ctx.fillRect(lx - 2, ly - 2, 4, 3);
  }
  ctx.restore();

  // Outer tire ink outline
  ink(2.8);
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.stroke();

  // 3. Whitewall Ring or White Sidewall Lettering
  if (wheels.type === 'whitewalls') {
    // Brilliant white rubber ring
    ctx.fillStyle = '#f8f9fa';
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.78, 0, Math.PI * 2);
    ctx.fill();
    ink(1.8);
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.78, 0, Math.PI * 2);
    ctx.stroke();
  } else if (isRear && wheels.type === 'slicks') {
    // Mickey / Rat Rod Curved White Sidewall Lettering
    ctx.save();
    ctx.rotate(angle);
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.72, -0.6, 0.6);
    ctx.stroke();
    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 5px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('RAT ROD', 0, -radius * 0.62);
    ctx.restore();
  }

  // 4. Deep-Dish Rim with Interior Drop Shadow
  const rimRadius = radius * 0.52;
  // Deep-dish inner shadow
  ctx.fillStyle = '#101118';
  ctx.beginPath();
  ctx.arc(0, 0, rimRadius + 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Rim face color
  let rimColor = '#495057'; // default steel
  if (wheels.type === 'goldmags') rimColor = '#d4a373';
  else if (wheels.type === 'whitewalls') rimColor = '#dc3545'; // candy red steelie
  else if (wheels.type === 'spokes') rimColor = '#ced4da'; // chrome

  ctx.fillStyle = rimColor;
  ctx.beginPath();
  ctx.arc(0, 0, rimRadius, 0, Math.PI * 2);
  ctx.fill();
  ink(2.2);
  ctx.beginPath();
  ctx.arc(0, 0, rimRadius, 0, Math.PI * 2);
  ctx.stroke();

  // 5. Spokes / Mag Pattern (Rotates with angle!)
  ctx.save();
  ctx.rotate(angle);

  if (wheels.type === 'goldmags') {
    // 5-Spoke Gold Racing Mag with chrome lip
    ctx.fillStyle = '#e9c46a';
    for (let sp = 0; sp < 5; sp++) {
      ctx.save();
      ctx.rotate((sp / 5) * Math.PI * 2);
      ctx.fillRect(-2, -rimRadius + 2, 4, rimRadius - 4);
      ctx.restore();
    }
  } else if (wheels.type === 'spokes') {
    // Wire Spoke Cross Pattern
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (let s = 0; s < 8; s++) {
      const sa = (s / 8) * Math.PI * 2;
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(sa) * rimRadius, Math.sin(sa) * rimRadius);
    }
    ctx.stroke();
  } else {
    // Steelie / Slicks Lug Pattern
    ctx.fillStyle = '#ced4da';
    for (let lg = 0; lg < 5; lg++) {
      const la = (lg / 5) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(Math.cos(la) * (rimRadius * 0.6), Math.sin(la) * (rimRadius * 0.6), 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 6. Chrome Bullet Knock-Off Center Cap with Star Glint
  ctx.fillStyle = '#f8f9fa';
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.22, 0, Math.PI * 2);
  ctx.fill();
  ink(1.8);
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.22, 0, Math.PI * 2);
  ctx.stroke();

  // Glint
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(-1, -1, 1.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore(); // end rotating spokes
  ctx.restore(); // end wheel
}

function _drawExhaustCanvas(ctx, exhaust, speed, accel, nitroActive) {
  ctx.save();
  ctx.translate(-68, -32);

  const ink = (w = 2.4) => {
    ctx.strokeStyle = '#12121c';
    ctx.lineWidth = w;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const throttle = Math.min(1.0, Math.max(0.2, accel / 4.0));
  const flameLength = throttle * (nitroActive ? 52 : 28) + Math.random() * 8;

  switch (exhaust.type) {
    case 'zoomies': {
      // 4 Swept Zoomie headers with heat-wrap tape banding
      for (let p = 0; p < 4; p++) {
        const ox = p * 6;
        ctx.strokeStyle = '#ced4da';
        ctx.lineWidth = 4.2;
        ctx.beginPath();
        ctx.moveTo(12 + ox, 6);
        ctx.lineTo(-2 + ox, -16);
        ctx.stroke();
        ink(2.0);
        ctx.stroke();
      }

      // Dynamic Layered Cartoon Flames spit upward and backward!
      if (throttle > 0.25 || nitroActive) {
        const fx = -2;
        const fy = -16;
        // Outer Roaring Crimson Flame
        ctx.fillStyle = nitroActive ? '#0077b6' : '#d90429';
        ctx.beginPath();
        ctx.moveTo(fx, fy);
        ctx.lineTo(fx - flameLength * 0.8, fy - flameLength * 0.7);
        ctx.lineTo(fx + 6, fy - flameLength * 0.4);
        ctx.closePath();
        ctx.fill();
        ink(2.0);
        ctx.stroke();

        // Mid Vivid Neon Yellow Flame
        ctx.fillStyle = nitroActive ? '#00f0ff' : '#ffb703';
        ctx.beginPath();
        ctx.moveTo(fx + 1, fy - 2);
        ctx.lineTo(fx - flameLength * 0.55, fy - flameLength * 0.5);
        ctx.lineTo(fx + 4, fy - flameLength * 0.3);
        ctx.closePath();
        ctx.fill();

        // Inner White-Hot Core Spike
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(fx + 2, fy - 4);
        ctx.lineTo(fx - flameLength * 0.3, fy - flameLength * 0.3);
        ctx.lineTo(fx + 3, fy - flameLength * 0.2);
        ctx.closePath();
        ctx.fill();

        // Flying Cartoon Ember Sparks!
        ctx.fillStyle = nitroActive ? '#90e0ef' : '#ffd166';
        for (let sp = 0; sp < 3; sp++) {
          ctx.beginPath();
          ctx.arc(fx - flameLength * 0.9 - Math.random() * 8, fy - flameLength * 0.8 - Math.random() * 8, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      break;
    }

    case 'flappers': {
      // Vertical Tractor Stacks with Animated Bouncing Rain Caps & Smoke Rings
      ctx.fillStyle = '#343a40';
      ctx.fillRect(8, -26, 5, 32);
      ink(2.2);
      ctx.strokeRect(8, -26, 5, 32);

      // Rain cap angle clatters & bounces dynamically with engine throttle!
      const capBounce = -0.18 - throttle * 0.65 + Math.sin(Date.now() * 0.04) * (throttle * 0.25);
      ctx.save();
      ctx.translate(10, -26);
      ctx.rotate(capBounce);
      ctx.fillStyle = '#e63946';
      ctx.fillRect(-2, -3, 11, 4);
      ink(1.8);
      ctx.strokeRect(-2, -3, 11, 4);
      ctx.restore();

      // Cute Cartoon Smoke Ring puffing out
      if (throttle > 0.3) {
        ctx.strokeStyle = 'rgba(220, 225, 230, 0.6)';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(10, -32 - Math.random() * 4, 4 + Math.random() * 2, 0, Math.PI * 2);
        ctx.stroke();
      }
      break;
    }

    case 'purgehorns': {
      // Twin Cowl Nitrous Purge Nozzles
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(15, 0); ctx.lineTo(10, -18);
      ctx.stroke();
      ink(2.0); ctx.stroke();

      if (nitroActive || throttle > 0.4) {
        // Frosty Blue & White Comic Vapor Plume
        ctx.fillStyle = 'rgba(0, 240, 255, 0.65)';
        ctx.beginPath();
        ctx.ellipse(8, -26, 6, 12, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.beginPath();
        ctx.ellipse(8, -26, 3, 8, -0.2, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    default: { // straight rusty pipe or lake pipes
      ctx.fillStyle = '#6c584c';
      ctx.fillRect(-12, 6, 24, 6);
      ink(2.2);
      ctx.strokeRect(-12, 6, 24, 6);
      if (throttle > 0.35) {
        ctx.fillStyle = '#ff7b00';
        ctx.beginPath();
        ctx.arc(-14, 9, 4 + Math.random() * 3, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
  }

  ctx.restore();
}

function _drawAeroCanvas(ctx, aero) {
  if (aero.type === 'none') return;
  ctx.save();
  ctx.translate(-62, -50);

  const ink = (w = 2.4) => {
    ctx.strokeStyle = '#12121c';
    ctx.lineWidth = w;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  switch (aero.type) {
    case 'highwaysign': {
      // Bent Yellow Highway "25 MPH" Speed Limit Sign Wing
      ctx.strokeStyle = '#ced4da';
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.moveTo(10, 26); ctx.lineTo(5, -6);
      ctx.stroke();
      ink(2.0); ctx.stroke();

      // Yellow diamond sign
      ctx.fillStyle = '#ffd166';
      ctx.fillRect(-10, -18, 28, 16);
      ink(2.4);
      ctx.strokeRect(-10, -18, 28, 16);
      // Comic text
      ctx.fillStyle = '#12121c';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('25', 4, -7);
      break;
    }

    case 'dragwing': {
      // Aluminum Sprint-Car Dual Blade Wing with Endplates
      ctx.strokeStyle = '#6c757d';
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.moveTo(12, 26); ctx.lineTo(0, -10);
      ctx.stroke();
      ink(2.0); ctx.stroke();

      // Curved spill endplate
      ctx.fillStyle = '#ced4da';
      ctx.fillRect(-14, -16, 30, 8);
      ink(2.4);
      ctx.strokeRect(-14, -16, 30, 8);
      // Yellow accent stripe
      ctx.fillStyle = '#ffbe0b';
      ctx.fillRect(-12, -14, 26, 2.5);
      break;
    }

    case 'roofwing': {
      // Massive sprint car roof wing
      ctx.fillStyle = '#0077b6';
      ctx.fillRect(-10, -32, 46, 16);
      ink(2.6);
      ctx.strokeRect(-10, -32, 46, 16);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('HOT ROD', 13, -21);
      // Mounting struts
      ctx.strokeStyle = '#ced4da';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(0, -16); ctx.lineTo(0, 10);
      ctx.moveTo(26, -16); ctx.lineTo(26, 10);
      ctx.stroke();
      ink(1.8);
      ctx.stroke();
      break;
    }

    default: { // ducktail
      ctx.fillStyle = '#6c584c';
      ctx.fillRect(-10, 4, 14, 6);
      ink(2.2);
      ctx.strokeRect(-10, 4, 14, 6);
      // Brass rivets
      ctx.fillStyle = '#fca311';
      ctx.beginPath(); ctx.arc(-6, 7, 1.2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(-2, 7, 1.2, 0, Math.PI * 2); ctx.fill();
      break;
    }
  }

  ctx.restore();
}

function _drawCharmsCanvas(ctx, charm, accel) {
  if (!charm) return;
  ctx.save();

  const ink = (w = 2.0) => {
    ctx.strokeStyle = '#12121c';
    ctx.lineWidth = w;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  if (charm.type === 'dice') {
    // Fuzzy dice swinging backward dynamically with acceleration g-force!
    const swingAngle = Math.min(0.65, Math.max(-0.25, accel * 0.07));
    ctx.translate(18, -48);
    ctx.rotate(swingAngle);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(4, 15);
    ctx.stroke();

    // White plush dice with black comic pips
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(1, 15, 8, 8);
    ink(1.8);
    ctx.strokeRect(1, 15, 8, 8);
    ctx.fillStyle = '#dc3545'; // red pips
    ctx.fillRect(4, 18, 2, 2);
  } else if (charm.type === 'skull') {
    // Perched chrome skull mascot on radiator
    ctx.translate(52, -45);
    ctx.fillStyle = '#f8f9fa';
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fill();
    ink(2.0);
    ctx.stroke();
    // Glowing yellow eye sockets
    ctx.fillStyle = '#ffbe0b';
    ctx.fillRect(-2, -1, 1.8, 1.8);
    ctx.fillRect(1, -1, 1.8, 1.8);
  } else if (charm.type === 'flames') {
    // Sunset Hot Rod Flames across the cab side
    ctx.translate(-22, -42);
    ctx.fillStyle = '#ff7b00';
    ctx.beginPath();
    ctx.moveTo(0, 16);
    ctx.quadraticCurveTo(18, 6, 32, 14);
    ctx.quadraticCurveTo(42, 2, 60, 12);
    ctx.quadraticCurveTo(48, 20, 32, 18);
    ctx.quadraticCurveTo(18, 22, 0, 16);
    ctx.closePath();
    ctx.fill();
    ink(1.8);
    ctx.stroke();
    // Inner yellow tongue
    ctx.fillStyle = '#ffd000';
    ctx.beginPath();
    ctx.moveTo(0, 16);
    ctx.quadraticCurveTo(14, 8, 25, 14);
    ctx.quadraticCurveTo(32, 6, 44, 13);
    ctx.quadraticCurveTo(35, 18, 25, 17);
    ctx.quadraticCurveTo(14, 20, 0, 16);
    ctx.closePath();
    ctx.fill();
  } else if (charm.type === 'seven') {
    // Lucky No. 7 Race Roundel on the cab door
    ctx.translate(-5, -34);
    ctx.fillStyle = '#f8f9fa';
    ctx.beginPath();
    ctx.arc(0, 0, 9, 0, Math.PI * 2);
    ctx.fill();
    ink(2.2);
    ctx.stroke();
    ctx.fillStyle = '#dc3545';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('7', 0, 1);
  } else if (charm.type === 'rivets') {
    // Patchwork Rust & Brass Rivets plate
    ctx.translate(-24, -38);
    ctx.fillStyle = '#8b5a2b';
    ctx.fillRect(0, 8, 28, 10);
    ink(1.8);
    ctx.strokeRect(0, 8, 28, 10);
    ctx.fillStyle = '#ffd166';
    for (let rx = 3; rx <= 25; rx += 5) {
      ctx.beginPath(); ctx.arc(rx, 10, 1.2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(rx, 16, 1.2, 0, Math.PI * 2); ctx.fill();
    }
  } else if (charm.type === 'shark') {
    // Flying Tiger Shark Mouth on nose
    ctx.translate(24, -34);
    ctx.fillStyle = '#dc3545';
    ctx.beginPath();
    ctx.ellipse(0, 0, 16, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ink(2.0);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    for (let tx = -12; tx <= 12; tx += 4) {
      ctx.moveTo(tx, 0); ctx.lineTo(tx + 2, -4); ctx.lineTo(tx + 4, 0);
      ctx.moveTo(tx, 0); ctx.lineTo(tx + 2, 4); ctx.lineTo(tx + 4, 0);
    }
    ctx.fill();
  }

  ctx.restore();
}

function _drawTireSmoke(ctx, x, y) {
  ctx.save();
  ctx.translate(x, y + 8);
  ctx.fillStyle = 'rgba(230, 230, 240, 0.45)';
  for (let i = 0; i < 4; i++) {
    const ox = -i * 14 - Math.random() * 6;
    const oy = -Math.random() * 12;
    const r = 8 + i * 5 + Math.random() * 4;
    ctx.beginPath();
    ctx.arc(ox, oy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

window.RatRodCar = RatRodCar;
window.STUDENT_GHOST_ROSTER = STUDENT_GHOST_ROSTER;
window.drawRatRodCanvas = drawRatRodCanvas;
