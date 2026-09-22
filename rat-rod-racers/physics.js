/**
 * Rat Rod Racers - Physics Engine
 * Non-Linear Coupled Vehicle Dynamics, Weight Transfer, Wheelspin Penalty,
 * Thermal Accumulation & Degradation, and Environmental Track Interactions.
 * Strict No-LaTeX adherence for physics explanations.
 * Real SI Units: meters (m), seconds (s), kilograms (kg), Newtons (N)
 */

class RatRodPhysics {
  constructor(config = {}) {
    this.configure(config);
    this.reset();
  }

  configure(config = {}) {
    // Mass and geometry
    this.mass = config.mass || 850;                     // kg (total mass)
    this.frontBias = config.frontBias !== undefined ? config.frontBias : 0.52; // 0.52 = 52% front, 48% rear
    this.hCG = config.hCG || 0.50;                      // m (center of gravity height: 0.30 lowboy, 0.70 gasser)
    this.wheelbase = config.wheelbase || 2.60;          // m (distance between axles)

    // Powertrain specifications
    this.peakForce = config.peakForce || 2800;           // N (engine drive force)
    this.powerBand = config.powerBand || 1.0;            // power curve factor
    this.nitroBoost = config.nitroBoost || 0;            // additional N boost
    this.nitroDuration = config.nitroDuration || 0;     // seconds

    // Quirks & engine personality
    this.blowerSurge = config.blowerSurge || false;      // ENG-02: violent wheelspin under 35 mph
    this.turboLag = config.turboLag || 0;                // ENG-04: seconds of initial turbo spool lag
    this.boostCreep = config.boostCreep || false;        // ENG-05: exponential top-end boost > 80 mph
    this.tractorChug = config.tractorChug || false;      // ENG-06: high torque at low RPM
    this.immuneToHeat = config.immuneToHeat || false;    // ENG-04: diesel immune to thermal degradation
    this.ignoreDebris = config.ignoreDebris || false;    // BOD-05: skid plate ignores rough surface drag

    // Thermal parameters
    this.ambientTemp = 85.0;                             // °F
    this.heatRate = config.heatRate || 14.0;             // °F/s at full throttle
    this.heatCapacity = config.heatCapacity || 120.0;    // thermal mass factor
    this.critTemp = config.critTemp || 225.0;            // °F threshold where power degrades
    this.radiatorArea = config.radiatorArea || 1.0;      // radiator cooling area multiplier
    this.grilleAirflow = config.grilleAirflow || 1.0;    // airflow intake multiplier

    // Suspension and chassis
    this.suspTravel = config.suspTravel !== undefined ? config.suspTravel : 0.40; // 0.0 (solid) to 0.85 (buggy)
    this.suspKappa = config.suspKappa || 0.35;           // suspension weight transfer compliance
    this.roughnessTol = config.roughnessTol || 0.50;     // rough surface tolerance

    // Tires & Aerodynamics
    this.frictionCoeff = config.mu || 0.85;              // base tire static friction coefficient
    this.tireType = config.tireType || 'steelies';       // 'slicks', 'firestones', 'knobby', 'salt', 'duallys'
    this.cdA = config.cdA || 0.35;                       // m² (drag area)
    this.rollingCoeff = config.rollingCoeff || 0.015;    // rolling resistance coefficient

    // Environmental / Track parameters
    this.gravity = 10.0;                                // m/s² (clean round numbers for physics clarity)
    this.airDensity = config.airDensity || 1.225;        // kg/m³
    this.trackLength = config.trackLength || 402.336;    // 1/4 mile in meters
    this.trackType = config.trackType || 'airfield';
    this.trackGrip = config.trackGrip !== undefined ? config.trackGrip : 1.10;
    this.trackRoughness = config.trackRoughness !== undefined ? config.trackRoughness : 0.05;
    this.trackGrade = config.trackGrade || 0.0;          // radians (uphill incline angle)
    this.tireTrackMult = config.tireTrackMult !== undefined ? config.tireTrackMult : 1.0;
  }

  setTrack(trackConfig = {}) {
    this.trackType = trackConfig.id || this.trackType;
    this.trackGrip = trackConfig.surfaceGrip !== undefined ? trackConfig.surfaceGrip : 1.0;
    this.trackRoughness = trackConfig.roughness !== undefined ? trackConfig.roughness : 0.05;
    this.trackGrade = trackConfig.gradeAngle || 0.0;
    this.airDensity = trackConfig.airDensity || 1.225;
    if (trackConfig.trackLength) {
      this.trackLength = trackConfig.trackLength;
    }

    // Determine tire compatibility on this specific track
    this.tireTrackMult = this._calcTireTrackMultiplier(this.tireType, this.trackType);
  }

  _calcTireTrackMultiplier(tireType, trackType) {
    // Suitability matrix from design document Section 4 & 5
    if (trackType === 'dirt_oval') {
      if (tireType === 'slicks') return 0.40;       // Cheater slicks spin uselessly in mud
      if (tireType === 'knobby') return 1.40;       // Ag Mud Tires claw through dirt
      if (tireType === 'duallys') return 1.15;
      if (tireType === 'firestones') return 0.90;
      if (tireType === 'salt') return 0.50;
    } else if (trackType === 'bonneville') {
      if (tireType === 'salt') return 1.35;         // Salt disks excel on smooth hard salt
      if (tireType === 'knobby') return 0.70;       // Knobby lugs vibrate & scrub top speed
      if (tireType === 'slicks') return 0.95;
    } else if (trackType === 'quarry') {
      if (tireType === 'duallys') return 1.30;      // Commercial duallys dig into gravel
      if (tireType === 'knobby') return 1.25;
      if (tireType === 'slicks') return 0.65;
    } else if (trackType === 'airfield') {
      if (tireType === 'slicks') return 1.25;       // Cheater slicks peak hookup on rubbered asphalt
      if (tireType === 'knobby') return 0.85;       // Mud lugs drag on dry pavement
    } else if (trackType === 'mountain') {
      if (tireType === 'firestones') return 1.05;   // Skinny low rolling resistance
      if (tireType === 'duallys') return 0.85;      // Heavy rotational inertia penalty
    }
    return 1.0;
  }

  reset() {
    this.t = 0;
    this.x = 0;
    this.v = 0;
    this.a = 0;
    this.temp = this.ambientTemp; // Engine temperature starting at ambient

    this.netForce = 0;
    this.driveForce = 0;
    this.dragForce = 0;
    this.rollForce = 0;
    this.gradeForce = 0;
    this.bottomingForce = 0;
    this.gripLimit = 0;
    this.wheelspinForce = 0;
    this.powerMultiplier = 1.0;
    this.isSlipping = false;
    this.isOverheating = false;

    this.reactionTime = 0;
    this.nitroTimeLeft = this.nitroDuration;
    this.nitroActive = false;

    // Track Splits
    this.split60ft = null;    // 18.288 m
    this.split330ft = null;   // 100.584 m
    this.split660ft = null;   // 201.168 m (1/8 mile)
    this.split1000ft = null;  // 304.8 m
    this.elapsedTime = null;  // 402.336 m (1/4 mile)
    this.trapSpeed = null;    // m/s at finish line
    this.finished = false;

    // Telemetry log for graphing
    this.telemetry = [];
  }

  activateNitro() {
    if (this.nitroBoost > 0 && this.nitroTimeLeft > 0) {
      this.nitroActive = true;
    }
  }

  step(dt) {
    if (this.finished) return;

    // Cap dt to prevent physics explosions on frame stutter
    dt = Math.min(dt, 0.05);

    const vMph = this.v * 2.23694;

    // -------------------------------------------------------------
    // 1. THERMAL ACCUMULATION & OVERHEAT DEGRADATION (Section 2.B)
    // -------------------------------------------------------------
    // Combustion heat rate builds with throttle and power output
    const throttleRatio = Math.min(1.0, 0.5 + (this.v / 30) * 0.5);
    const combustionHeat = this.heatRate * throttleRatio * 1.5;

    // Radiator cooling: Q_cooling = A_rad * (v + 12) * Delta_T * Phi_grille
    const deltaT = Math.max(0, this.temp - this.ambientTemp);
    const coolingAirSpeed = 10.0 + this.v; // ambient draft + vehicle forward speed
    const coolingRate = (this.radiatorArea * coolingAirSpeed * deltaT * this.grilleAirflow * 0.035);

    // Differential temperature change: dT/dt = (Heat_in - Heat_out) / Heat_Capacity
    const dTemp = ((combustionHeat - coolingRate) / (this.heatCapacity / 100)) * dt;
    this.temp = Math.max(this.ambientTemp, this.temp + dTemp);

    // Overheat Power Multiplier: Power drops when T > T_critical
    this.powerMultiplier = 1.0;
    this.isOverheating = false;

    if (!this.immuneToHeat && this.temp > this.critTemp) {
      this.isOverheating = true;
      const overDeg = this.temp - this.critTemp;
      // Multiplier = max(0.35, 1.0 - gamma * (T - T_crit)^1.5)
      this.powerMultiplier = Math.max(0.35, Number((1.0 - 0.015 * Math.pow(overDeg, 1.5)).toFixed(3)));
    }

    // -------------------------------------------------------------
    // 2. ENGINE DRIVE FORCE WITH GEARING & QUIRKS (Section 2.A & 4)
    // -------------------------------------------------------------
    let driveRatio = 1.0;
    if (vMph < 20) {
      driveRatio = 0.85 + (vMph / 20) * 0.15;
    } else if (vMph < 80) {
      driveRatio = 1.0;
    } else {
      // High speed taper due to redline / gearing
      driveRatio = Math.max(0.58, 1.0 - (vMph - 80) * 0.005);
    }

    // Engine Quirk: Tractor Chug (ENG-06) generates maximum torque at very low speed
    if (this.tractorChug && vMph < 35) {
      driveRatio *= (1.25 - (vMph / 35) * 0.20);
    }

    // Engine Quirk: Boost Creep (ENG-05) builds explosive boost past 80 mph
    if (this.boostCreep && vMph > 70) {
      const creepBonus = Math.min(0.35, (vMph - 70) * 0.007);
      driveRatio += creepBonus;
    }

    // Engine Quirk: Rolling Coal Turbo Lag (ENG-04) delays thrust off launch
    if (this.turboLag > 0 && this.t < this.turboLag) {
      const spoolProgress = this.t / this.turboLag;
      driveRatio *= (0.28 + spoolProgress * 0.72);
    }

    let rawDriveForce = this.peakForce * driveRatio * this.powerBand * this.powerMultiplier;

    // Apply Nitrous Boost if active
    if (this.nitroActive && this.nitroTimeLeft > 0) {
      rawDriveForce += this.nitroBoost;
      this.nitroTimeLeft -= dt;
      if (this.nitroTimeLeft <= 0) {
        this.nitroActive = false;
      }
    }

    // -------------------------------------------------------------
    // 3. DYNAMIC WEIGHT TRANSFER & TRACTION LIMIT (Section 2.A)
    // -------------------------------------------------------------
    // Delta W_transfer = (a_x * h_CG / L_wheelbase) * M_total
    const dynamicTransfer = (this.a * this.hCG / this.wheelbase) * this.mass;

    // Incline shifts static weight: W_rear += M_total * sin(theta)
    const inclineWeightShift = this.mass * Math.sin(this.trackGrade);

    // Static weight distribution: W_rear = M * (1 - frontBias) + Transfer
    const staticRearWeight = this.mass * (1.0 - this.frontBias);
    const dynamicRearWeight = Math.max(
      this.mass * 0.25,
      Math.min(this.mass * 0.95, staticRearWeight + dynamicTransfer + inclineWeightShift)
    );

    // Effective friction coefficient:
    // mu_eff = mu_base * C_track_surface * tire_compatibility * (1 + kappa_susp * Delta W / M)
    const transferRatio = Math.max(0, dynamicTransfer / this.mass);
    const suspBonus = 1.0 + (this.suspKappa * transferRatio);
    const effMu = this.frictionCoeff * this.trackGrip * this.tireTrackMult * suspBonus;

    // Rear Axle Normal Force and Maximum Static Traction Limit:
    // F_traction_max = mu_eff * W_rear * g
    const rearNormalForce = dynamicRearWeight * this.gravity;
    this.gripLimit = effMu * rearNormalForce;

    // -------------------------------------------------------------
    // 4. NON-LINEAR WHEELSPIN PENALTY EQUATION (Section 2.A)
    // -------------------------------------------------------------
    // If F_engine > F_traction_max:
    // Delta F_excess = F_engine - F_traction_max
    // F_wheelspin = Delta F_excess * (1 - e^(-lambda * Delta F_excess))
    // F_launch = F_traction_max - F_wheelspin
    if (rawDriveForce > this.gripLimit) {
      this.isSlipping = true;
      let deltaExcess = rawDriveForce - this.gripLimit;

      // Engine Quirk: Blower Surge (ENG-02) triggers violent wheelspin below 35 mph
      if (this.blowerSurge && vMph < 35) {
        deltaExcess *= 1.55;
      }

      // Wheelspin penalty damping factor lambda = 0.0012
      const lambda = 0.0012;
      this.wheelspinForce = deltaExcess * (1.0 - Math.exp(-lambda * deltaExcess));

      // Forward drive force drops BELOW the grip limit due to spinning tires!
      this.driveForce = Math.max(0, this.gripLimit - this.wheelspinForce);
    } else {
      this.isSlipping = false;
      this.wheelspinForce = 0;
      this.driveForce = rawDriveForce;
    }

    // -------------------------------------------------------------
    // 5. RESISTANCE FORCES: DRAG, ROLLING, INCLINE & ROUGHNESS
    // -------------------------------------------------------------
    // Aerodynamic Drag Force: F_drag = 0.5 * rho * CdA * v^2
    this.dragForce = 0.5 * this.airDensity * this.cdA * this.v * this.v;

    // Rolling Resistance: F_roll = C_rr * m * g
    this.rollForce = this.rollingCoeff * (this.mass * this.gravity);

    // Track Incline Gravity Force: F_grade = m * g * sin(theta) (positive resists forward motion uphill)
    this.gradeForce = this.mass * this.gravity * Math.sin(this.trackGrade);

    // Surface Roughness & Suspension Compliance (Section 5):
    // Zero-travel suspensions on rutted dirt bottom out violently!
    this.bottomingForce = 0;
    if (this.trackRoughness > 0.10 && !this.ignoreDebris) {
      // Bottoming deficit: how much the track ruts exceed suspension travel
      const roughnessDeficit = Math.max(0, this.trackRoughness - (this.suspTravel * 1.1));
      if (roughnessDeficit > 0) {
        // Severe chassis bottoming drag proportional to speed
        this.bottomingForce = roughnessDeficit * 1850 * Math.min(2.5, this.v / 18);
      }
    }

    // -------------------------------------------------------------
    // 6. NET FORCE & NUMERICAL INTEGRATION (Newton's 2nd Law)
    // -------------------------------------------------------------
    // F_net = F_drive - F_drag - F_roll - F_grade - F_bottoming
    const totalResistance = this.dragForce + this.rollForce + this.gradeForce + this.bottomingForce;
    this.netForce = Math.max(0, this.driveForce - totalResistance);
    this.a = this.netForce / this.mass;

    // Semi-implicit Euler integration
    this.v += this.a * dt;
    this.x += this.v * dt;
    this.t += dt;

    // -------------------------------------------------------------
    // 7. TRACK DISTANCE SPLITS & FINISH EVALUATION
    // -------------------------------------------------------------
    if (this.split60ft === null && this.x >= 18.288) {
      this.split60ft = this.t;
    }
    if (this.split330ft === null && this.x >= 100.584) {
      this.split330ft = this.t;
    }
    if (this.split660ft === null && this.x >= 201.168) {
      this.split660ft = this.t;
    }
    if (this.split1000ft === null && this.x >= 304.8) {
      this.split1000ft = this.t;
    }
    if (!this.finished && this.x >= this.trackLength) {
      this.finished = true;
      this.elapsedTime = this.t;
      this.trapSpeed = this.v;
      this.x = this.trackLength;
    }

    // -------------------------------------------------------------
    // 8. TELEMETRY LOGGING (Subsampled for high-speed graph rendering)
    // -------------------------------------------------------------
    if (this.telemetry.length === 0 || this.t - this.telemetry[this.telemetry.length - 1].t >= 0.04 || this.finished) {
      this.telemetry.push({
        t: Number(this.t.toFixed(3)),
        x: Number(this.x.toFixed(2)),
        v: Number(this.v.toFixed(2)),
        vMph: Number((this.v * 2.23694).toFixed(1)),
        a: Number(this.a.toFixed(2)),
        aG: Number((this.a / 10.0).toFixed(2)),
        temp: Number(this.temp.toFixed(1)),
        fNet: Number(this.netForce.toFixed(0)),
        fDrive: Number(this.driveForce.toFixed(0)),
        fDrag: Number(this.dragForce.toFixed(0)),
        fSpin: Number(this.wheelspinForce.toFixed(0)),
        powerMult: Number(this.powerMultiplier.toFixed(2)),
        isSlipping: this.isSlipping,
        isOverheating: this.isOverheating
      });
    }
  }

  // Fast forward simulate an entire run (for AI ghosts or predictive modeling)
  simulateRun(timeLimit = 35) {
    this.reset();
    const dt = 0.02;
    while (!this.finished && this.t < timeLimit) {
      this.step(dt);
    }
    return {
      elapsedTime: this.elapsedTime || this.t,
      trapSpeed: this.trapSpeed || this.v,
      trapSpeedMph: (this.trapSpeed || this.v) * 2.23694,
      split60ft: this.split60ft,
      split330ft: this.split330ft,
      split660ft: this.split660ft,
      finalTemp: this.temp,
      telemetry: [...this.telemetry]
    };
  }

  // Current real-time state snapshot
  getState() {
    return {
      t: this.t,
      x: this.x,
      v: this.v,
      vMph: this.v * 2.23694,
      a: this.a,
      aG: this.a / 10.0,
      temp: this.temp,
      fNet: this.netForce,
      fDrive: this.driveForce,
      fDrag: this.dragForce,
      fSpin: this.wheelspinForce,
      powerMultiplier: this.powerMultiplier,
      isSlipping: this.isSlipping,
      isOverheating: this.isOverheating,
      finished: this.finished,
      nitroActive: this.nitroActive,
      nitroTimeLeft: this.nitroTimeLeft
    };
  }
}

window.RatRodPhysics = RatRodPhysics;
