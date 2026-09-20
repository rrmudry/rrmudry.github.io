/**
 * Rat Rod Racers - Physics Engine
 * Real SI Units: meters (m), seconds (s), kilograms (kg), Newtons (N)
 * Strict No-LaTeX adherence for physics explanations.
 */

class RatRodPhysics {
  constructor(config = {}) {
    // Car physical properties
    this.mass = config.mass || 850;             // kg (total mass)
    this.peakForce = config.peakForce || 2800;   // N (engine drive force)
    this.frictionCoeff = config.mu || 0.85;      // mu (tire static grip coefficient)
    this.cdA = config.cdA || 0.35;               // m² (drag coefficient * frontal area)
    this.powerBand = config.powerBand || 1.0;    // power curve factor
    this.nitroBoost = config.nitroBoost || 0;    // additional N boost
    this.nitroDuration = config.nitroDuration || 0; // seconds

    // Environmental constants
    this.gravity = 9.81;                         // m/s²
    this.airDensity = 1.225;                     // kg/m³
    this.rollingCoeff = 0.015;                   // rolling resistance coefficient
    this.trackLength = 402.336;                  // 1/4 mile in meters

    // Dynamic State
    this.reset();
  }

  reset() {
    this.t = 0;
    this.x = 0;
    this.v = 0;
    this.a = 0;
    this.netForce = 0;
    this.driveForce = 0;
    this.dragForce = 0;
    this.rollForce = 0;
    this.gripLimit = 0;
    this.isSlipping = false;
    this.reactionTime = 0;
    this.nitroTimeLeft = this.nitroDuration;
    this.nitroActive = false;

    // Splits
    this.split60ft = null;    // 18.288 m
    this.split330ft = null;   // 100.584 m
    this.split660ft = null;   // 201.168 m (1/8 mile)
    this.split1000ft = null;  // 304.8 m
    this.elapsedTime = null;  // 402.336 m (1/4 mile)
    this.trapSpeed = null;    // m/s at 1/4 mile
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

    // 1. Calculate Engine Drive Force with power curve
    // Power curve: high torque at start, builds through midrange, tapers at top end
    const vMph = this.v * 2.23694;
    let driveRatio = 1.0;
    if (vMph < 20) {
      driveRatio = 0.85 + (vMph / 20) * 0.15;
    } else if (vMph < 80) {
      driveRatio = 1.0;
    } else {
      // High speed taper due to redline / gearing
      driveRatio = Math.max(0.60, 1.0 - (vMph - 80) * 0.005);
    }

    let rawDriveForce = this.peakForce * driveRatio * this.powerBand;

    // Apply Nitrous Boost if active
    if (this.nitroActive && this.nitroTimeLeft > 0) {
      rawDriveForce += this.nitroBoost;
      this.nitroTimeLeft -= dt;
      if (this.nitroTimeLeft <= 0) {
        this.nitroActive = false;
      }
    }

    // 2. Traction Limit (Newton's normal force: N = m * g)
    // Static traction limit: F_max = mu * m * g
    // With dynamic weight transfer: acceleration transfers weight to rear drive wheels (+15%)
    const normalForce = this.mass * this.gravity;
    const dynamicGripMult = 1.0 + Math.min(0.20, (this.a / this.gravity) * 0.20);
    this.gripLimit = this.frictionCoeff * normalForce * dynamicGripMult;

    // Check for tire slip
    if (rawDriveForce > this.gripLimit) {
      this.isSlipping = true;
      // Kinetic friction is slightly lower than static friction (burnout loss)
      this.driveForce = this.gripLimit * 0.88;
    } else {
      this.isSlipping = false;
      this.driveForce = rawDriveForce;
    }

    // 3. Aerodynamic Drag Force: F_drag = 0.5 * rho * CdA * v²
    this.dragForce = 0.5 * this.airDensity * this.cdA * this.v * this.v;

    // 4. Rolling Resistance: F_roll = C_rr * m * g
    this.rollForce = this.rollingCoeff * normalForce;

    // 5. Net Force and Acceleration (Newton's 2nd Law: a = F_net / m)
    this.netForce = Math.max(0, this.driveForce - this.dragForce - this.rollForce);
    this.a = this.netForce / this.mass;

    // 6. Numerical Integration (Semi-implicit Euler)
    this.v += this.a * dt;
    this.x += this.v * dt;
    this.t += dt;

    // 7. Check Track Splits
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

    // 8. Record Telemetry (subsampled for clean plotting)
    if (this.telemetry.length === 0 || this.t - this.telemetry[this.telemetry.length - 1].t >= 0.04 || this.finished) {
      this.telemetry.push({
        t: Number(this.t.toFixed(3)),
        x: Number(this.x.toFixed(2)),
        v: Number(this.v.toFixed(2)),
        vMph: Number((this.v * 2.23694).toFixed(1)),
        a: Number(this.a.toFixed(2)),
        aG: Number((this.a / 9.81).toFixed(2)),
        fNet: Number(this.netForce.toFixed(0)),
        fDrive: Number(this.driveForce.toFixed(0)),
        fDrag: Number(this.dragForce.toFixed(0)),
        isSlipping: this.isSlipping
      });
    }
  }

  // Helper: Run full theoretical simulation instantly (for opponent ghosts or prediction)
  simulateRun(timeLimit = 30) {
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
      telemetry: [...this.telemetry]
    };
  }

  // Get current state snapshot
  getState() {
    return {
      t: this.t,
      x: this.x,
      v: this.v,
      vMph: this.v * 2.23694,
      a: this.a,
      aG: this.a / 9.81,
      fNet: this.netForce,
      fDrive: this.driveForce,
      fDrag: this.dragForce,
      isSlipping: this.isSlipping,
      finished: this.finished,
      nitroActive: this.nitroActive,
      nitroTimeLeft: this.nitroTimeLeft
    };
  }
}

window.RatRodPhysics = RatRodPhysics;
