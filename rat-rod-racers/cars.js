/**
 * Rat Rod Racers - Car Definition, Customizer, Stats & Ghost Roster
 * Based on rat_rod_part_balance_synergy_design_document.md
 * 5 Canonical Slots: Powertrain, Chassis & Body, Suspension & Axles, Tires & Wheels, and Ancillary & Quirks.
 * Jalopy Points Budget (20 pts), Non-Linear Coupled Stats, Archetype Matrix, and 2D Canvas Car Drawing.
 */

class RatRodCar {
  constructor(config = {}) {
    this.name = config.name || "Rusty Rocket";
    this.driver = config.driver || "Student Driver";
    this.number = config.number || 77;

    // 5 Canonical Slots with backward-compatible fallback for legacy saves
    const legacyParts = config.parts || {};
    this.parts = {
      powertrain: legacyParts.powertrain || legacyParts.engine || 'ENG-06',
      chassis: legacyParts.chassis || 'BOD-02',
      suspension: legacyParts.suspension || 'SUS-02',
      wheels: legacyParts.wheels || 'TIR-02',
      ancillary: legacyParts.ancillary || legacyParts.exhaust || legacyParts.charm || 'ANC-03'
    };

    // Part upgrade levels (1 = stock, 2 = tuned, 3 = master)
    const legacyLevels = config.levels || {};
    this.levels = {
      powertrain: legacyLevels.powertrain || legacyLevels.engine || 1,
      chassis: legacyLevels.chassis || 1,
      suspension: legacyLevels.suspension || 1,
      wheels: legacyLevels.wheels || 1,
      ancillary: legacyLevels.ancillary || legacyLevels.exhaust || legacyLevels.charm || 1
    };

    this.recomputeStats();
  }

  // Get full part object from catalog
  getPart(slot) {
    if (slot === 'engines') slot = 'powertrain';
    if (slot === 'engine') slot = 'powertrain';
    if (slot === 'charms' || slot === 'charm' || slot === 'exhaust' || slot === 'aero') slot = 'ancillary';

    const id = this.parts[slot];
    const catalog = RAT_ROD_ASSETS[slot];
    if (catalog && catalog[id]) {
      return catalog[id];
    }

    // Default fallbacks per slot
    if (slot === 'powertrain') return RAT_ROD_ASSETS.powertrain['ENG-06'];
    if (slot === 'chassis') return RAT_ROD_ASSETS.chassis['BOD-02'];
    if (slot === 'suspension') return RAT_ROD_ASSETS.suspension['SUS-02'];
    if (slot === 'wheels') return RAT_ROD_ASSETS.wheels['TIR-02'];
    if (slot === 'ancillary') return RAT_ROD_ASSETS.ancillary['ANC-03'];

    return null;
  }

  equip(slot, partId, level = 1) {
    if (slot === 'engines' || slot === 'engine') slot = 'powertrain';
    if (slot === 'charms' || slot === 'charm' || slot === 'exhaust' || slot === 'aero') slot = 'ancillary';

    if (this.parts[slot] !== undefined) {
      this.parts[slot] = partId;
      this.levels[slot] = level;
      this.recomputeStats();
    }
  }

  // Aggregate physical specs and calculate Jalopy Point Budget & Archetype
  recomputeStats() {
    const powertrain = this.getPart('powertrain');
    const chassis = this.getPart('chassis');
    const suspension = this.getPart('suspension');
    const wheels = this.getPart('wheels');
    const ancillary = this.getPart('ancillary');

    // -------------------------------------------------------------
    // 1. JALOPY BUDGET CAP SYSTEM (Section 6.1: 20 Points Ceiling)
    // -------------------------------------------------------------
    this.maxBudget = 20;
    this.jalopyPoints = (powertrain.cost || 0) +
                        (chassis.cost || 0) +
                        (suspension.cost || 0) +
                        (wheels.cost || 0) +
                        (ancillary.cost || 0);
    this.isBudgetValid = (this.jalopyPoints <= this.maxBudget);
    this.budgetDeficit = Math.max(0, this.jalopyPoints - this.maxBudget);

    // -------------------------------------------------------------
    // 2. TOTAL VEHICLE MASS & WEIGHT DISTRIBUTION
    // -------------------------------------------------------------
    const chassisMassMult = 1.0 - (this.levels.chassis - 1) * 0.04;
    const engineMassMult = 1.0 - (this.levels.powertrain - 1) * 0.03;

    this.mass = Math.round(
      chassis.mass * chassisMassMult +
      powertrain.mass * engineMassMult +
      wheels.mass * 2 + // 2 axles
      (ancillary.mass || 0) +
      350 // base frame rails and driver
    );

    // Front/Rear weight bias (0.50 = 50/50 balance)
    let baseBias = 0.50 + (powertrain.frontBiasShift || 0.0) + (ancillary.frontBiasShift || 0.0);
    this.frontWeightBias = Number(Math.max(0.35, Math.min(0.72, baseBias)).toFixed(2));
    this.rearWeightBias = Number((1.0 - this.frontWeightBias).toFixed(2));

    // Center of Gravity Height (h_CG) & Wheelbase
    this.hCG = chassis.hCG || 0.50;
    this.wheelbase = 2.60;

    // -------------------------------------------------------------
    // 3. POWERTRAIN DRIVE FORCE & TUNING
    // -------------------------------------------------------------
    const engineForceMult = 1.0 + (this.levels.powertrain - 1) * 0.12;
    const ancForceMult = ancillary.forceMult || 1.0;
    this.peakForce = Math.round((powertrain.peakForce || 2000) * engineForceMult * ancForceMult);
    this.powerBand = powertrain.powerBand || 1.0;

    // Engine Quirks & Personality
    this.blowerSurge = !!powertrain.blowerSurge;
    this.turboLag = powertrain.turboLag || 0;
    this.boostCreep = !!powertrain.boostCreep;
    this.tractorChug = !!powertrain.tractorChug;
    this.immuneToHeat = !!powertrain.immuneToHeat;
    this.ignoreDebris = !!chassis.ignoreDebris;

    // -------------------------------------------------------------
    // 4. SUSPENSION COMPLIANCE & AXLE STIFFNESS
    // -------------------------------------------------------------
    this.suspTravel = suspension.suspTravel !== undefined ? suspension.suspTravel : 0.40;
    this.suspKappa = suspension.suspKappa || 0.35;
    this.roughnessTol = suspension.roughnessTol || 0.50;
    this.rollStiffness = suspension.rollStiffness || 0.50;

    // -------------------------------------------------------------
    // 5. TIRES, WHEELS & LAUNCH GRIP
    // -------------------------------------------------------------
    const tireGripMult = 1.0 + (this.levels.wheels - 1) * 0.08;
    this.mu = Number(((wheels.mu || 0.85) * tireGripMult).toFixed(2));
    this.tireType = wheels.tireType || 'firestones';

    // -------------------------------------------------------------
    // 6. AERODYNAMICS & DRAG AREA (CdA)
    // -------------------------------------------------------------
    const baseCdA = chassis.cdA || 0.38;
    const tireCdAMod = wheels.cdAMod || 0.0;
    const ancCdAMod = ancillary.cdAMod || 0.0;
    this.cdA = Math.max(0.20, Number((baseCdA + tireCdAMod + ancCdAMod).toFixed(3)));

    // -------------------------------------------------------------
    // 7. THERMAL COOLING & DISSIPATION SPECS
    // -------------------------------------------------------------
    this.heatRate = powertrain.heatRate || 14.0;
    this.critTemp = 225.0; // °F
    this.heatCapacity = 120.0;
    this.radiatorArea = Number((ancillary.radAreaMult || 1.0).toFixed(2));
    this.grilleAirflow = Number((ancillary.grilleAirflowMult || 1.0).toFixed(2));

    // -------------------------------------------------------------
    // 8. DERIVED PHYSICS BENCHMARKS FOR HUD & PEDAGOGY
    // -------------------------------------------------------------
    this.maxTheoreticalAccel = Number((this.peakForce / this.mass).toFixed(2)); // m/s²
    // Static launch grip limit: mu * W_rear * g (using g = 10 m/s²)
    this.staticGripLimitForce = Math.round(this.mu * (this.mass * this.rearWeightBias) * 10.0);
    this.burnoutRisk = this.peakForce > this.staticGripLimitForce;
    this.powerToWeight = Number((this.peakForce / this.mass).toFixed(2)); // N/kg

    // -------------------------------------------------------------
    // 9. ARCHETYPE AFFINITY MATRIX
    // -------------------------------------------------------------
    this.archetypeAffinity = this.computeArchetypeAffinity();

    // -------------------------------------------------------------
    // 10. PERFORMANCE INDEX (PI) & CLASS
    // -------------------------------------------------------------
    const piInfo = this.computePI();
    this.pi = piInfo.pi;
    this.carClass = piInfo.carClass;
    this.classLabel = piInfo.classLabel;
    this.classColor = piInfo.classColor;
  }

  // Calculate affinity score across the 5 Core Archetypes
  computeArchetypeAffinity() {
    const scores = {
      'Blown Gasser': 0,
      'Salt Speedster': 0,
      'Mud-Runner': 0,
      'Chop Rattler': 0,
      'Diesel Bruiser': 0
    };

    const parts = [
      this.getPart('powertrain'),
      this.getPart('chassis'),
      this.getPart('suspension'),
      this.getPart('wheels'),
      this.getPart('ancillary')
    ];

    parts.forEach(p => {
      if (!p) return;
      if (p.archetype && scores[p.archetype] !== undefined) {
        scores[p.archetype] += 20;
      }
    });

    // Find highest affinity
    let primary = 'Balanced Custom';
    let highest = 0;
    for (const [arch, score] of Object.entries(scores)) {
      if (score > highest) {
        highest = score;
        primary = arch;
      }
    }

    return { primary, scores, highestPct: highest };
  }

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

  // Export share code
  toShareCode() {
    const payload = {
      n: this.name,
      d: this.driver,
      p: [
        this.parts.powertrain,
        this.parts.chassis,
        this.parts.suspension,
        this.parts.wheels,
        this.parts.ancillary
      ],
      l: [
        this.levels.powertrain,
        this.levels.chassis,
        this.levels.suspension,
        this.levels.wheels,
        this.levels.ancillary
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
          powertrain: p.p[0],
          chassis: p.p[1],
          suspension: p.p[2],
          wheels: p.p[3],
          ancillary: p.p[4]
        },
        levels: {
          powertrain: p.l ? p.l[0] : 1,
          chassis: p.l ? p.l[1] : 1,
          suspension: p.l ? p.l[2] : 1,
          wheels: p.l ? p.l[3] : 1,
          ancillary: p.l ? p.l[4] : 1
        }
      });
    } catch (e) {
      console.warn("Failed to parse car share code:", e);
      return null;
    }
  }

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
 * Built-in Classmate Ghost Roster Tailored to the 5 Core Archetypes
 */
const STUDENT_GHOST_ROSTER = [
  {
    name: "Big Al's Blown Gasser",
    driver: "Big Al (Period 1)",
    tagline: "Highboy roadster with a 6-71 blown big block and cheater slicks. Lethal on dry drag strips!",
    car: new RatRodCar({
      name: "The Gasser King",
      driver: "Big Al (Period 1)",
      number: 1,
      parts: {
        powertrain: 'ENG-02',
        chassis: 'BOD-02',
        suspension: 'SUS-01',
        wheels: 'TIR-01',
        ancillary: 'ANC-01'
      },
      levels: { powertrain: 2, chassis: 2, suspension: 2, wheels: 2, ancillary: 1 }
    })
  },
  {
    name: "Slick Sally's Salt Speedster",
    driver: "Sally (Period 2)",
    tagline: "Chopped '32 coupe with twin turbos and solid suspension. Slices through high-speed aerodynamic drag!",
    car: new RatRodCar({
      name: "Salt Slicer",
      driver: "Sally (Period 2)",
      number: 88,
      parts: {
        powertrain: 'ENG-05',
        chassis: 'BOD-01',
        suspension: 'SUS-04',
        wheels: 'TIR-04',
        ancillary: 'ANC-03'
      },
      levels: { powertrain: 2, chassis: 2, suspension: 1, wheels: 2, ancillary: 2 }
    })
  },
  {
    name: "Mud-Flap Mike's Moonshine Runner",
    driver: "Mike (Period 4)",
    tagline: "Gutted touring tub with heavy buggy springs and deep tractor mud lugs. Dominates rough dirt courses!",
    car: new RatRodCar({
      name: "Mud Brawler",
      driver: "Mike (Period 4)",
      number: 44,
      parts: {
        powertrain: 'ENG-06',
        chassis: 'BOD-05',
        suspension: 'SUS-03',
        wheels: 'TIR-03',
        ancillary: 'ANC-02'
      },
      levels: { powertrain: 2, chassis: 2, suspension: 2, wheels: 2, ancillary: 1 }
    })
  },
  {
    name: "Apex Andy's Chop-Top Rattler",
    driver: "Andy (Period 3)",
    tagline: "Z'd lowboy sedan with Screaming Slant-6 and lead rear ballast. Agile 50/50 balance slices twisty roads.",
    car: new RatRodCar({
      name: "Chop Rattler",
      driver: "Andy (Period 3)",
      number: 13,
      parts: {
        powertrain: 'ENG-03',
        chassis: 'BOD-03',
        suspension: 'SUS-02',
        wheels: 'TIR-02',
        ancillary: 'ANC-04'
      },
      levels: { powertrain: 2, chassis: 2, suspension: 1, wheels: 2, ancillary: 1 }
    })
  },
  {
    name: "Heavy Hank's Diesel Bruiser",
    driver: "Hank (Period 5)",
    tagline: "Heavy commercial delivery van packing a 5.9L turbo diesel and dual rear wheels. Crushes steep incline grades!",
    car: new RatRodCar({
      name: "Iron Mountain",
      driver: "Hank (Period 5)",
      number: 55,
      parts: {
        powertrain: 'ENG-04',
        chassis: 'BOD-04',
        suspension: 'SUS-05',
        wheels: 'TIR-05',
        ancillary: 'ANC-05'
      },
      levels: { powertrain: 2, chassis: 2, suspension: 2, wheels: 2, ancillary: 1 }
    })
  },
  {
    name: "Barn-Find Benny's Rookie Jalopy",
    driver: "Benny (Period 6)",
    tagline: "Honest starter rat rod with farm flathead and dropped I-beam. Great benchmark rival!",
    car: new RatRodCar({
      name: "Rookie Jalopy",
      driver: "Benny (Period 6)",
      number: 3,
      parts: {
        powertrain: 'ENG-06',
        chassis: 'BOD-02',
        suspension: 'SUS-02',
        wheels: 'TIR-02',
        ancillary: 'ANC-03'
      },
      levels: { powertrain: 1, chassis: 1, suspension: 1, wheels: 1, ancillary: 1 }
    })
  }
];

// Pre-calculate PI and Class on benchmark ghost rivals
STUDENT_GHOST_ROSTER.forEach(r => {
  r.pi = r.car.pi;
  r.carClass = r.car.carClass;
  r.classLabel = r.car.classLabel;
  r.classColor = r.car.classColor;
});

/**
 * 2D Canvas Composite Car Drawer
 * Renders the assembled rat rod with dynamic wheel rotation, acceleration squat,
 * animated radiator steam (overheating), and tire smoke (wheelspin).
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
  const isOverheating = state.isOverheating || false;

  // Dynamic squat: car tilts back under acceleration
  const squatAngle = Math.min(0.08, (accel / 12.0) * 0.08);

  ctx.save();
  ctx.rotate(squatAngle);

  const chassis = car.getPart('chassis');
  const powertrain = car.getPart('powertrain');
  const suspension = car.getPart('suspension');
  const wheels = car.getPart('wheels');
  const ancillary = car.getPart('ancillary');

  // 1. Draw Frame Rails & Underbody Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse(0, 18, 55, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Steel Chassis Ladder Frame
  ctx.fillStyle = '#1c1f26';
  ctx.strokeStyle = '#12121c';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.roundRect(-48, 6, 96, 6, 2);
  ctx.fill();
  ctx.stroke();

  // 2. Draw Suspension Components
  _drawSuspensionCanvas(ctx, suspension);

  // 3. Draw Engine Block & Induction
  _drawPowertrainCanvas(ctx, powertrain, state);

  // 4. Draw Chassis Body
  _drawChassisCanvas(ctx, chassis, car);

  // 5. Draw Ancillary Components (Beer keg, Radiator, Pipes, Ballast, Siren)
  _drawAncillaryCanvas(ctx, ancillary);

  // 6. Draw Wheels & Tires (Front and Rear)
  // Rear axle is at x = -32, y = 10
  // Front axle is at x = 32, y = 10
  _drawWheelCanvas(ctx, wheels, -32, 10, wheelAngle, 1.15); // larger rear drag wheel
  _drawWheelCanvas(ctx, wheels, 32, 10, wheelAngle, 0.95);  // slightly smaller front wheel

  ctx.restore(); // restore squat

  // 7. Dynamic Visual Effects: Tire Smoke & Radiator Steam
  if (isSlipping) {
    _drawTireSmokeCanvas(ctx, -32, 12);
  }
  if (isOverheating) {
    _drawOverheatSteamCanvas(ctx, 42, -18);
  }

  ctx.restore();
}

function _drawChassisCanvas(ctx, chassis, car) {
  const col = chassis.color || '#a04822';
  const type = chassis.renderType || 'roadster29';

  ctx.save();
  ctx.fillStyle = col;
  ctx.strokeStyle = '#12121c';
  ctx.lineWidth = 2.4;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  if (type === 'custom_image' || chassis.dataUrl) {
    // Custom user-drawn body from Designer Studio
    if (!chassis._cachedImg && chassis.dataUrl) {
      chassis._cachedImg = new Image();
      chassis._cachedImg.src = chassis.dataUrl;
    }
    if (chassis._cachedImg && chassis._cachedImg.complete) {
      ctx.save();
      // Studio canvas is 800x400 with origin at (400, 230) and scale 5.2
      ctx.scale(1.0 / 5.2, 1.0 / 5.2);
      ctx.drawImage(chassis._cachedImg, -400, -230);
      ctx.restore();
    }
  } else if (type === 'coupe32') {
    // Channeled '32 5-window coupe with chopped top
    ctx.beginPath();
    ctx.moveTo(-45, 8);
    ctx.lineTo(-26, 8);
    ctx.lineTo(-20, -18);
    ctx.lineTo(15, -18);
    ctx.lineTo(26, -2);
    ctx.lineTo(44, 2);
    ctx.lineTo(44, 8);
    ctx.lineTo(-45, 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Chopped Roof
    ctx.fillStyle = '#161925';
    ctx.beginPath();
    ctx.moveTo(-18, -18);
    ctx.lineTo(-12, -32);
    ctx.lineTo(12, -32);
    ctx.lineTo(16, -18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Tinted Cockpit Window
    ctx.fillStyle = '#00f0ff';
    ctx.globalAlpha = 0.45;
    ctx.fillRect(-8, -30, 18, 10);
    ctx.globalAlpha = 1.0;

  } else if (type === 'sedan') {
    // Z'd & Channeled Lowboy 2-door sedan
    ctx.beginPath();
    ctx.moveTo(-46, 8);
    ctx.lineTo(-24, 8);
    ctx.lineTo(-20, -22);
    ctx.lineTo(24, -22);
    ctx.lineTo(30, 2);
    ctx.lineTo(45, 4);
    ctx.lineTo(45, 8);
    ctx.lineTo(-46, 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Sedan Side Windows
    ctx.fillStyle = '#1a1c23';
    ctx.fillRect(-16, -20, 16, 12);
    ctx.fillRect(4, -20, 16, 12);
    ctx.strokeRect(-16, -20, 16, 12);
    ctx.strokeRect(4, -20, 16, 12);

  } else if (type === 'deliveryvan') {
    // Reinforced Delivery Van
    ctx.beginPath();
    ctx.moveTo(-46, 8);
    ctx.lineTo(-46, -28);
    ctx.lineTo(10, -28);
    ctx.lineTo(24, -8);
    ctx.lineTo(44, -4);
    ctx.lineTo(44, 8);
    ctx.lineTo(-46, 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Windshield
    ctx.fillStyle = '#00f0ff';
    ctx.globalAlpha = 0.45;
    ctx.beginPath();
    ctx.moveTo(11, -26);
    ctx.lineTo(22, -9);
    ctx.lineTo(11, -9);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1.0;

  } else if (type === 'touringtub') {
    // Gutted Touring Tub
    ctx.beginPath();
    ctx.moveTo(-44, 8);
    ctx.lineTo(-22, 8);
    ctx.lineTo(-18, -12);
    ctx.lineTo(18, -12);
    ctx.lineTo(26, 2);
    ctx.lineTo(44, 2);
    ctx.lineTo(44, 8);
    ctx.lineTo(-44, 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Aluminum Skid Pan along bottom
    ctx.fillStyle = '#ced4da';
    ctx.fillRect(-44, 8, 88, 3);
    ctx.strokeRect(-44, 8, 88, 3);

  } else {
    // Highboy '29 Model A Roadster
    ctx.beginPath();
    ctx.moveTo(-44, 8);
    ctx.lineTo(-20, 8);
    ctx.lineTo(-14, -14);
    ctx.lineTo(16, -14);
    ctx.lineTo(26, 0);
    ctx.lineTo(44, 2);
    ctx.lineTo(44, 8);
    ctx.lineTo(-44, 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Windshield frame
    ctx.strokeStyle = '#ced4da';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(14, -14);
    ctx.lineTo(20, -25);
    ctx.stroke();
  }

  // Two-Tone Cel Shading Upper Contour Highlight
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-35, -4);
  ctx.quadraticCurveTo(0, -18, 35, 0);
  ctx.stroke();

  // Racing number on door
  ctx.fillStyle = '#f8f9fa';
  ctx.beginPath();
  ctx.arc(0, -4, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#12121c';
  ctx.lineWidth = 1.8;
  ctx.stroke();

  ctx.fillStyle = '#d90429';
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(car.number || 77), 0, -4);

  ctx.restore();
}

function _drawPowertrainCanvas(ctx, powertrain, state) {
  const type = powertrain.type || 'stroker';
  ctx.save();
  ctx.translate(22, -4);

  ctx.strokeStyle = '#12121c';
  ctx.lineWidth = 2.4;
  ctx.lineJoin = 'round';

  if (type === 'blower') {
    // Roots Blower with red scoop
    ctx.fillStyle = '#a82828';
    ctx.fillRect(-10, -6, 20, 14);
    ctx.strokeRect(-10, -6, 20, 14);

    // Chrome blower casing
    ctx.fillStyle = '#ced4da';
    ctx.fillRect(-12, -18, 24, 12);
    ctx.strokeRect(-12, -18, 24, 12);

    // Red butterfly scoop
    ctx.fillStyle = '#e63946';
    ctx.beginPath();
    ctx.moveTo(-10, -18);
    ctx.lineTo(-4, -28);
    ctx.lineTo(14, -28);
    ctx.lineTo(10, -18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Butterfly valve circles
    ctx.fillStyle = '#12121c';
    ctx.beginPath(); ctx.arc(-1, -23, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(4, -23, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(9, -23, 2, 0, Math.PI * 2); ctx.fill();

  } else if (type === 'diesel') {
    // Cummins Turbo Diesel Block with twin vertical stacks
    ctx.fillStyle = '#2b2d42';
    ctx.fillRect(-12, -8, 24, 16);
    ctx.strokeRect(-12, -8, 24, 16);

    // Turbo snail
    ctx.fillStyle = '#ced4da';
    ctx.beginPath(); ctx.arc(10, -8, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    // Twin black vertical stacks
    ctx.fillStyle = '#111';
    ctx.fillRect(-8, -26, 4, 18);
    ctx.strokeRect(-8, -26, 4, 18);
    ctx.fillRect(-1, -26, 4, 18);
    ctx.strokeRect(-1, -26, 4, 18);

  } else if (type === 'twinturbo') {
    // Twin Turbo with polished crossover pipe
    ctx.fillStyle = '#c94a29';
    ctx.fillRect(-10, -6, 20, 14);
    ctx.strokeRect(-10, -6, 20, 14);

    ctx.fillStyle = '#ced4da';
    ctx.beginPath(); ctx.arc(-8, -10, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(8, -10, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-8, -14); ctx.quadraticCurveTo(0, -22, 8, -14); ctx.stroke();

  } else if (type === 'slant6') {
    // Leaning Slant-6 with Weber trumpets
    ctx.fillStyle = '#4a5568';
    ctx.beginPath();
    ctx.moveTo(-10, 8); ctx.lineTo(-2, -14); ctx.lineTo(14, -14); ctx.lineTo(6, 8);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#ffbe0b';
    ctx.beginPath(); ctx.arc(0, -18, 3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(6, -18, 3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(12, -18, 3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

  } else {
    // Farm truck or Stroker V8
    ctx.fillStyle = '#3b5a45';
    ctx.fillRect(-10, -4, 20, 12);
    ctx.strokeRect(-10, -4, 20, 12);

    ctx.fillStyle = '#ced4da';
    ctx.beginPath(); ctx.arc(0, -10, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }

  ctx.restore();
}

function _drawSuspensionCanvas(ctx, suspension) {
  const type = suspension.type || 'dropped_ibeam';
  ctx.save();
  ctx.strokeStyle = '#12121c';
  ctx.lineWidth = 2.4;

  if (type === 'suicide_leaf') {
    // Leaf spring mounted forward of frame
    ctx.fillStyle = '#495057';
    ctx.beginPath();
    ctx.moveTo(34, 10); ctx.quadraticCurveTo(46, 2, 52, 10);
    ctx.stroke();
    ctx.fillRect(48, 4, 6, 8);
    ctx.strokeRect(48, 4, 6, 8);

  } else if (type === 'buggy_springs') {
    // High-arch transverse buggy leaf
    ctx.strokeStyle = '#ffbe0b';
    ctx.beginPath();
    ctx.moveTo(-34, 10); ctx.quadraticCurveTo(-34, -4, -20, 4);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(34, 10); ctx.quadraticCurveTo(34, -4, 20, 4);
    ctx.stroke();

  } else if (type === 'solid_rig') {
    // Rigid solid steel plates
    ctx.fillStyle = '#ced4da';
    ctx.fillRect(-35, 4, 6, 8); ctx.strokeRect(-35, 4, 6, 8);
    ctx.fillRect(29, 4, 6, 8); ctx.strokeRect(29, 4, 6, 8);

  } else {
    // Dropped I-beam front axle
    ctx.strokeStyle = '#6c757d';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(24, 10); ctx.lineTo(38, 10);
    ctx.stroke();
  }

  ctx.restore();
}

function _drawWheelCanvas(ctx, wheels, x, y, angle, scale = 1.0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.rotate(angle);

  const type = wheels.type || 'slicks';

  // Tire Rubber Outer
  ctx.fillStyle = '#1c1f26';
  ctx.strokeStyle = '#12121c';
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.arc(0, 0, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  if (type === 'slicks') {
    // Pie crust drag slick with yellow rim
    ctx.fillStyle = '#ffbe0b';
    ctx.beginPath();
    ctx.arc(0, 0, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Center lug hub
    ctx.fillStyle = '#12121c';
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    // White wrinkle sidewall marks
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, 13, 0, Math.PI * 0.4);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 13, Math.PI, Math.PI * 1.4);
    ctx.stroke();

  } else if (type === 'knobby') {
    // Tractor tire with lugs
    ctx.fillStyle = '#495057';
    ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#ffbe0b';
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
      const lx = Math.cos(a) * 14;
      const ly = Math.sin(a) * 14;
      ctx.fillRect(lx - 2, ly - 2, 4, 4);
    }

  } else if (type === 'salt') {
    // Polished moon disk
    ctx.fillStyle = '#e9ecef';
    ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#adb5bd';
    ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2); ctx.fill();

  } else if (type === 'duallys') {
    // Commercial duals rim
    ctx.fillStyle = '#343a40';
    ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffbe0b';
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 3) {
      ctx.beginPath();
      ctx.arc(Math.cos(a) * 6, Math.sin(a) * 6, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }

  } else {
    // Skinny Firestone with red rim
    ctx.fillStyle = '#d90429';
    ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ced4da';
    ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2); ctx.fill();
  }

  ctx.restore();
}

function _drawAncillaryCanvas(ctx, ancillary) {
  const type = ancillary.type || 'lakester_pipes';
  ctx.save();
  ctx.strokeStyle = '#12121c';
  ctx.lineWidth = 2.2;

  if (type === 'beerkeg') {
    // Beer-keg fuel tank mounted ahead of grille
    ctx.translate(45, -2);
    ctx.fillStyle = '#ced4da';
    ctx.fillRect(0, -6, 10, 14);
    ctx.strokeRect(0, -6, 10, 14);
    ctx.fillStyle = '#ffbe0b';
    ctx.beginPath(); ctx.arc(5, 1, 2.5, 0, Math.PI * 2); ctx.fill();

  } else if (type === 'tractor_rad') {
    // Chopped tractor radiator
    ctx.translate(41, -12);
    ctx.fillStyle = '#3b5a45';
    ctx.fillRect(0, 0, 8, 20);
    ctx.strokeRect(0, 0, 8, 20);
    ctx.fillStyle = '#d4a373';
    ctx.fillRect(1, 3, 6, 14);

  } else if (type === 'lakester_pipes') {
    // Swept lakester exhaust pipe shooting sparks
    ctx.translate(-15, 6);
    ctx.strokeStyle = '#ced4da';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(24, 0); ctx.lineTo(34, -4);
    ctx.stroke();

  } else if (type === 'lead_ballast') {
    // Lead ballast weight block in rear
    ctx.translate(-42, 0);
    ctx.fillStyle = '#495057';
    ctx.fillRect(0, 0, 12, 8);
    ctx.strokeRect(0, 0, 12, 8);
    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 6px monospace';
    ctx.fillText("PB", 2, 6);

  } else if (type === 'belt_siren') {
    // Belt drive siren horn
    ctx.translate(34, -14);
    ctx.fillStyle = '#d90429';
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(8, -4); ctx.lineTo(8, 4);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
  }

  ctx.restore();
}

function _drawTireSmokeCanvas(ctx, x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = 'rgba(235, 235, 245, 0.50)';
  for (let i = 0; i < 4; i++) {
    const ox = -i * 15 - Math.random() * 8;
    const oy = -Math.random() * 12;
    const r = 8 + i * 5 + Math.random() * 5;
    ctx.beginPath();
    ctx.arc(ox, oy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function _drawOverheatSteamCanvas(ctx, x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
  for (let i = 0; i < 3; i++) {
    const ox = (Math.random() - 0.5) * 8 - (i * 8);
    const oy = -i * 12 - Math.random() * 6;
    const r = 5 + i * 4;
    ctx.beginPath();
    ctx.arc(ox, oy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

window.RatRodCar = RatRodCar;
window.STUDENT_GHOST_ROSTER = STUDENT_GHOST_ROSTER;
window.drawRatRodCanvas = drawRatRodCanvas;
