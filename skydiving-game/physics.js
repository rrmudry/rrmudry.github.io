/**
 * Terminal Velocity: Skydive Academy
 * Aerodynamic Physics Simulation Engine
 */

class SkydivingPhysics {
  constructor(config = {}) {
    // Standard SI Constants & Skydiver Parameters
    this.mass = config.mass || 75; // kg (skydiver + rig)
    this.gravity = config.gravity !== undefined ? config.gravity : 9.81; // m/s²
    this.rho0 = config.rho0 || 1.225; // Sea-level air density (kg/m³)
    this.scaleHeight = 8500; // Atmospheric scale height (m)
    
    // Aerodynamic Drag Areas (Cd * Area in m²)
    this.dragCoefficients = {
      PENCIL_DIVE: 0.22,      // Streamlined head-down dive (~85 m/s or ~190 mph)
      NEUTRAL_ARCH: 0.55,     // Belly-to-earth standard arch (~54 m/s or ~120 mph)
      SPREAD_EAGLE: 0.88,     // High-drag flared box arch (~39 m/s or ~87 mph)
      DEPLOY_STAGE1: 2.2,     // Pilot chute deployed
      DEPLOY_STAGE2: 11.5,    // Canopy slider opening
      CANOPY_GLIDE: 25.0,     // Fully open square canopy (~5.2 m/s descent)
      CANOPY_FLARE: 35.0      // Brake toggles pulled down flare (~1.2 m/s touchdown)
    };

    // State Variables
    this.altitude = 3000; // Altitude in meters (y)
    this.x = 0;           // Horizontal offset from landing target (meters)
    this.vx = 0;          // Horizontal velocity (m/s)
    this.vy = 0;          // Vertical descent velocity (m/s, positive downwards)
    this.windX = 0;       // Crosswind speed (m/s, positive blows right)
    
    this.state = 'FREEFALL'; // 'FREEFALL', 'DEPLOYING_1', 'DEPLOYING_2', 'GLIDING', 'LANDED', 'CRASHED'
    this.posture = 'NEUTRAL_ARCH';
    this.steerInput = 0;     // -1 (Left) to +1 (Right)
    this.pitchInput = 0;     // -1 (Dive) to +1 (Spread Eagle)
    this.isFlaring = false;
    this.flareTimer = 0;     // Seconds flare is active
    
    // Physics Readouts & telemetry
    this.currentAirDensity = this.rho0;
    this.dragForce = 0;
    this.gravityForce = this.mass * this.gravity;
    this.netAcceleration = 0;
    this.gForce = 1.0;
    this.terminalVelocity = 54;
    this.touchdownSpeed = 0;
    this.timeElapsed = 0;
  }

  reset(startAltitude = 3000, startX = 0, windX = 0) {
    this.altitude = startAltitude;
    this.x = startX;
    this.vx = 0;
    this.vy = 0;
    this.windX = windX;
    this.state = 'FREEFALL';
    this.posture = 'NEUTRAL_ARCH';
    this.steerInput = 0;
    this.pitchInput = 0;
    this.isFlaring = false;
    this.flareTimer = 0;
    this.timeElapsed = 0;
    this.touchdownSpeed = 0;
  }

  // Get barometric air density at current altitude (kg/m³)
  getAirDensity(alt = this.altitude) {
    const clampedAlt = Math.max(alt, 0);
    return this.rho0 * Math.exp(-clampedAlt / this.scaleHeight);
  }

  // Calculate theoretical terminal velocity for current posture and altitude
  calcTerminalVelocity(posture = this.posture, alt = this.altitude) {
    const rho = this.getAirDensity(alt);
    const cdA = this.dragCoefficients[posture] || this.dragCoefficients.NEUTRAL_ARCH;
    return Math.sqrt((2 * this.mass * this.gravity) / (rho * cdA));
  }

  // Step physics simulation by deltaTime (seconds)
  update(dt) {
    if (this.state === 'LANDED' || this.state === 'CRASHED') return;

    this.timeElapsed += dt;
    this.currentAirDensity = this.getAirDensity();

    // Determine active drag coefficient (Cd * A)
    let cdA = this.dragCoefficients.NEUTRAL_ARCH;

    if (this.state === 'FREEFALL') {
      if (this.pitchInput < -0.2) {
        this.posture = 'PENCIL_DIVE';
        cdA = this.dragCoefficients.PENCIL_DIVE;
      } else if (this.pitchInput > 0.2) {
        this.posture = 'SPREAD_EAGLE';
        cdA = this.dragCoefficients.SPREAD_EAGLE;
      } else {
        this.posture = 'NEUTRAL_ARCH';
        cdA = this.dragCoefficients.NEUTRAL_ARCH;
      }
    } else if (this.state === 'DEPLOYING_1') {
      this.posture = 'DEPLOY_STAGE1';
      cdA = this.dragCoefficients.DEPLOY_STAGE1;
    } else if (this.state === 'DEPLOYING_2') {
      this.posture = 'DEPLOY_STAGE2';
      cdA = this.dragCoefficients.DEPLOY_STAGE2;
    } else if (this.state === 'GLIDING') {
      if (this.isFlaring) {
        this.posture = 'CANOPY_FLARE';
        this.flareTimer += dt;
        // Flare has max effective duration (~2.5s) before stall
        const flareEffectiveness = Math.max(0, 1 - (this.flareTimer / 2.5));
        cdA = this.dragCoefficients.CANOPY_GLIDE + 
              (this.dragCoefficients.CANOPY_FLARE - this.dragCoefficients.CANOPY_GLIDE) * flareEffectiveness;
      } else {
        this.posture = 'CANOPY_GLIDE';
        this.flareTimer = Math.max(0, this.flareTimer - dt * 2);
        cdA = this.dragCoefficients.CANOPY_GLIDE;
      }
    }

    this.terminalVelocity = this.calcTerminalVelocity(this.posture, this.altitude);

    // Compute relative airspeed with crosswind
    const relVx = this.vx - this.windX;
    const relVy = this.vy;
    const speed = Math.sqrt(relVx * relVx + relVy * relVy);

    // Aerodynamic Drag Force vector: Fd = 0.5 * rho * v^2 * CdA
    const totalDrag = 0.5 * this.currentAirDensity * speed * speed * cdA;
    this.dragForce = totalDrag;

    let dragFx = 0;
    let dragFy = 0;
    if (speed > 0.001) {
      dragFx = -totalDrag * (relVx / speed);
      dragFy = -totalDrag * (relVy / speed);
    }

    // Aerodynamic Lift & Steering Forces
    let liftFx = 0;
    let liftFy = 0;

    if (this.state === 'FREEFALL') {
      // Lateral tracking during freefall (skydiver tracks sideways)
      const trackingSpeed = 18.0; // Max horizontal track speed (m/s)
      const steerForce = this.steerInput * 180; // N
      liftFx = steerForce;
    } else if (this.state === 'GLIDING') {
      // Canopy forward glide + banking lift
      const forwardDrive = 9.0; // Parachute nominal forward airspeed (m/s)
      const steerTorque = this.steerInput * 7.5; // Turn authority
      
      // Aerodynamic lift counteracting gravity when flaring
      if (this.isFlaring && this.flareTimer < 2.5) {
        const flareLift = (1 - (this.flareTimer / 2.5)) * this.mass * this.gravity * 0.75;
        liftFy -= flareLift;
      }
      
      liftFx = steerTorque * 25;
    }

    // Sum Net Forces (Fnet = Fg + Fd + Flift)
    this.gravityForce = this.mass * this.gravity;
    const fNetX = dragFx + liftFx;
    const fNetY = this.gravityForce + dragFy + liftFy;

    // Acceleration (a = F / m)
    const ax = fNetX / this.mass;
    const ay = fNetY / this.mass;
    this.netAcceleration = Math.sqrt(ax * ax + ay * ay);

    // Calculate Felt G-Force
    // Net force felt in skydiver harness (Drag + Lift) / (m * g)
    const feltForceY = -dragFy - liftFy;
    const feltForceX = -dragFx - liftFx;
    this.gForce = Math.sqrt(feltForceX * feltForceX + feltForceY * feltForceY) / (this.mass * this.gravity);

    // Semi-implicit Euler integration
    this.vx += ax * dt;
    this.vy += ay * dt;

    // Prevent negative descent (unless extreme updraft)
    if (this.vy < -2.0) this.vy = -2.0;

    // Update Positions
    this.x += this.vx * dt;
    this.altitude -= this.vy * dt; // Altitude drops as vy is positive downwards

    // Ground Touchdown Detection
    if (this.altitude <= 0) {
      this.altitude = 0;
      this.touchdownSpeed = this.vy;
      this.vx = 0;
      this.vy = 0;

      // Grade landing safety
      if (this.state === 'FREEFALL' || this.state === 'DEPLOYING_1') {
        this.state = 'CRASHED'; // Terminal velocity impact
      } else if (this.touchdownSpeed < 3.2) {
        this.state = 'LANDED'; // Soft standup landing!
      } else if (this.touchdownSpeed < 6.5) {
        this.state = 'LANDED'; // Rough PLF landing
      } else {
        this.state = 'CRASHED'; // Canopy slam impact
      }
    }
  }
}

window.SkydivingPhysics = SkydivingPhysics;
