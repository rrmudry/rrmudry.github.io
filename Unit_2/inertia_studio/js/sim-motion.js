// Inertia of Motion Simulation Module: Vehicular Crash & Seatbelt Physics
// Accurate physics: Uniform velocity, seat friction limit, zero forward force, seatbelt restraint, continuous flight trajectory

class SimMotion {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // Physics parameters
    this.g = 9.8; // m/s^2
    this.scale = 30; // pixels per meter

    // Configurable controls
    this.initialVelocity = 18.0; // m/s (~40 mph)
    this.passengerMass = 70.0; // kg
    this.hasSeatbelt = false;
    this.hasAirbag = false;
    this.stopType = 'barrier'; // 'barrier' (hard wall crash) or 'brake' (moderate)

    // State
    this.state = 'idle'; // 'idle', 'running', 'stopped'
    this.time = 0;
    this.dt = 1 / 60;

    this.reset();
  }

  reset() {
    this.state = 'idle';
    this.time = 0;

    // Track coordinates (meters)
    this.trackLength = 50.0; // meters
    this.carLength = 3.2; // car length in meters
    this.carX = 2.0; // rear bumper position
    this.carV = this.initialVelocity;
    this.carA = 0;
    this.carCrumple = 0; // visual crumple depth on impact

    // Trigger point / barrier position
    this.barrierX = 18.0; // front face of barrier (meters)
    this.impactOccurred = false;

    // Passenger / Dummy coordinates
    this.passengerAbsX = this.carX + 1.1; // sitting in driver seat
    this.passengerAbsY = 0; // vertical offset (negative = airborne)
    this.passengerAbsV = this.initialVelocity;
    this.passengerVy = 0;
    this.dummyAngle = 0;
    this.interiorImpact = false;
    this.windshieldCracked = false;
    this.ejected = false;
    this.landed = false;

    this.traceCar = [];
    this.tracePassenger = [];
  }

  setInitialVelocity(v) {
    this.initialVelocity = Math.max(5, Math.min(30, v));
    this.reset();
  }

  setSeatbelt(bool) {
    this.hasSeatbelt = bool;
    this.reset();
  }

  setAirbag(bool) {
    this.hasAirbag = bool;
    this.reset();
  }

  setStopType(type) {
    this.stopType = type;
    this.reset();
  }

  triggerRun() {
    // Always start fresh on click
    this.reset();
    this.state = 'running';
    window.soundFx.playClick();
  }

  update(timeStep) {
    if (this.state !== 'running') return;
    const dt = timeStep || this.dt;
    this.time += dt;

    const carFrontX = this.carX + this.carLength;

    // 1. Vehicle Motion & Collision Detection
    if (this.stopType === 'barrier') {
      if (!this.impactOccurred) {
        if (carFrontX >= this.barrierX) {
          // BUMPER HITS BARRIER FACE!
          this.impactOccurred = true;
          this.carX = this.barrierX - this.carLength; // stop bumper right at barrier face
          this.carV = 0;
          this.carA = -150.0;
          this.carCrumple = 0.35;
          window.soundFx.playCrash();
        } else {
          // Cruising at constant speed
          this.carA = 0;
          this.carV = this.initialVelocity;
          this.carX += this.carV * dt;
        }
      } else {
        // Car is completely stopped against barrier
        this.carV = 0;
        this.carA = 0;
      }
    } else {
      // Emergency ABS braking mode
      if (carFrontX >= this.barrierX) {
        if (this.carV > 0.05) {
          this.carA = -10.5;
          this.carV += this.carA * dt;
          if (this.carV < 0) this.carV = 0;
          this.carX += this.carV * dt;
          if (!this.impactOccurred) {
            this.impactOccurred = true;
            window.soundFx.playScreech();
          }
        } else {
          this.carV = 0;
          this.carA = 0;
        }
      } else {
        this.carA = 0;
        this.carV = this.initialVelocity;
        this.carX += this.carV * dt;
      }
    }

    // 2. Passenger / Dummy Physics (Newton's 1st Law!)
    if (this.hasSeatbelt) {
      // SEATBELT BUCKLED: Passenger restrained to vehicle
      if (!this.impactOccurred) {
        this.passengerAbsX = this.carX + 1.1;
        this.passengerAbsV = this.carV;
      } else {
        const maxStretch = this.stopType === 'barrier' ? 0.12 : 0.07;
        const stretch = this.carV > 0 ? maxStretch * (this.carV / this.initialVelocity) : 0;
        this.passengerAbsX = this.carX + 1.1 + stretch;
        this.passengerAbsV = this.carV;

        if (this.carV <= 0.01) {
          this.state = 'stopped';
          window.soundFx.playSuccess();
        }
      }
    } else {
      // UNBELTED: Zero forward force! Dummy continues forward at velocity v0 by inertia
      if (!this.impactOccurred) {
        this.passengerAbsX = this.carX + 1.1;
        this.passengerAbsV = this.carV;
      } else {
        const canEject = (this.stopType === 'barrier' && this.initialVelocity >= 22.0);

        if (canEject) {
          // HIGH-SPEED BARRIER COLLISION (v0 >= 22 m/s / ~50+ mph):
          // Extreme kinetic energy shatters windshield and ejects dummy
          if (!this.ejected) {
            const windshieldX = this.carX + 2.3;
            this.passengerAbsX += this.passengerAbsV * dt;

            if (this.passengerAbsX >= windshieldX) {
              this.ejected = true;
              this.windshieldCracked = true;
              this.passengerVy = -3.5; // launch upward over barrier
              window.soundFx.playThud();
            }
          } else {
            // AIRBORNE & TUMBLE PHASE: Flying over barrier and sliding onto pavement
            this.passengerAbsX += this.passengerAbsV * dt;

            if (!this.landed) {
              this.passengerVy += this.g * dt;
              this.passengerAbsY += this.passengerVy * dt;
              this.dummyAngle += 7.5 * dt;

              // Ground impact check
              if (this.passengerAbsY >= 0) {
                this.passengerAbsY = 0;
                this.passengerVy = 0;
                this.landed = true;
                this.dummyAngle = Math.PI / 2; // resting horizontal
                window.soundFx.playThud();
              }
            } else {
              // Sliding along the pavement ahead of the barrier
              const roadFrictionDecel = 6.0; // m/s^2
              this.passengerAbsV = Math.max(0, this.passengerAbsV - roadFrictionDecel * dt);

              if (this.passengerAbsV <= 0.05 && this.carV <= 0.01) {
                this.passengerAbsV = 0;
                this.state = 'stopped';
              }
            }
          }
        } else if (this.stopType === 'barrier') {
          // MODERATE SPEED BARRIER CRASH (v0 < 22 m/s / <50 mph):
          // Car stops dead. Dummy slides forward into steering wheel & windshield.
          // Laminated safety glass and steering wheel contain occupant inside the cabin!
          if (!this.interiorImpact) {
            this.passengerAbsX += this.passengerAbsV * dt;
            const cabinLimitX = this.carX + 2.15;

            if (this.passengerAbsX >= cabinLimitX) {
              this.passengerAbsX = cabinLimitX;
              this.passengerAbsV = 0;
              this.interiorImpact = true;
              this.windshieldCracked = true;
              this.state = 'stopped';
              window.soundFx.playThud();
            }
          } else {
            this.passengerAbsX = this.carX + 2.15;
            this.passengerAbsV = 0;
          }
        } else {
          // EMERGENCY ABS BRAKING (stopType === 'brake'):
          // Car is decelerating. Dummy slides forward across seat until contacting steering wheel & dashboard.
          // Occupant stays inside cabin, pinned against dashboard while car skids to a stop.
          const cabinLimitX = this.carX + 2.15;

          if (!this.interiorImpact) {
            this.passengerAbsX += this.passengerAbsV * dt;

            if (this.passengerAbsX >= cabinLimitX) {
              this.passengerAbsX = cabinLimitX;
              this.passengerAbsV = this.carV;
              this.interiorImpact = true;
              window.soundFx.playThud();
            }
          } else {
            // Pinned against dashboard; decelerates with vehicle
            this.passengerAbsX = cabinLimitX;
            this.passengerAbsV = this.carV;
          }

          if (this.carV <= 0.01) {
            this.carV = 0;
            this.passengerAbsV = 0;
            this.state = 'stopped';
          }
        }
      }
    }

    // Save trace points
    if (this.traceCar.length < 300) {
      this.traceCar.push({ x: this.carX, v: this.carV, t: this.time });
      this.tracePassenger.push({ x: this.passengerAbsX, v: this.passengerAbsV, t: this.time });
    }
  }

  getTelemetry() {
    const stoppingDist = Math.max(0, (this.carX + this.carLength) - this.barrierX);
    const speedMph = (this.initialVelocity * 2.237).toFixed(0);

    // Forces acting on passenger
    let forwardForce = 0; // ALWAYS ZERO! (Newton's 1st Law)
    let restraintForce = 0;

    if (this.impactOccurred) {
      if (this.hasSeatbelt) {
        restraintForce = this.passengerMass * Math.abs(this.carA);
      } else if (this.interiorImpact) {
        // High normal contact force from dashboard / steering wheel / windshield
        restraintForce = this.stopType === 'barrier' ? 2450 : 735;
      } else if (this.ejected && this.landed) {
        restraintForce = this.passengerMass * 6.0; // pavement friction
      } else {
        restraintForce = 0; // sliding across seat or flying through air
      }
    }

    return {
      speedMph: speedMph,
      carVel: Math.max(0, this.carV).toFixed(1),
      passengerVel: Math.max(0, this.passengerAbsV).toFixed(1),
      carAccel: this.carA.toFixed(1),
      forwardForce: forwardForce.toFixed(0), // ALWAYS 0 N
      restraintForce: restraintForce.toFixed(0),
      stoppingDist: stoppingDist.toFixed(1),
      relDisplacement: Math.max(0, this.passengerAbsX - (this.carX + 1.1)).toFixed(2),
      state: this.state,
      hasSeatbelt: this.hasSeatbelt,
      interiorImpact: this.interiorImpact,
      ejected: this.ejected
    };
  }

  render() {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const ctx = this.ctx;

    ctx.clearRect(0, 0, w, h);

    const groundY = h * 0.72;
    const scale = this.scale;

    // Camera track offset: keeps car and flying dummy both in view
    let focusX = this.carX;
    if (this.ejected) {
      focusX = this.carX * 0.45 + this.passengerAbsX * 0.55;
    }
    const camX = Math.max(0, focusX - 6.0);
    const worldToScreen = (xMeters) => (xMeters - camX) * scale + w * 0.15;

    // 1. Draw Road & Ground
    const isLightRoad = document.body.classList.contains('light-theme');
    ctx.fillStyle = isLightRoad ? '#1e293b' : '#0f172a';
    ctx.fillRect(0, groundY, w, h - groundY);

    // Road dashed stripes
    ctx.strokeStyle = isLightRoad ? '#64748b' : '#334155';
    ctx.lineWidth = 3;
    ctx.setLineDash([20, 15]);
    ctx.beginPath();
    ctx.moveTo(0, groundY + 22);
    ctx.lineTo(w, groundY + 22);
    ctx.stroke();
    ctx.setLineDash([]);

    // 2. Draw Trigger Line / Barrier
    const barrierPx = worldToScreen(this.barrierX);

    if (this.stopType === 'brake') {
      // Braking zone line
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(barrierPx, groundY - 80);
      ctx.lineTo(barrierPx, groundY + 40);
      ctx.stroke();

      ctx.fillStyle = '#f59e0b';
      ctx.font = '700 12px JetBrains Mono, monospace';
      ctx.fillText('🛑 BRAKING POINT', barrierPx + 8, groundY - 60);
    } else {
      // Concrete Crash Barrier (front face exactly at barrierPx)
      const wallW = 38;
      const wallH = 105;

      // Barrier shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(barrierPx + 6, groundY - wallH + 10, wallW, wallH);

      // Solid concrete block
      ctx.fillStyle = '#475569';
      ctx.fillRect(barrierPx, groundY - wallH, wallW, wallH);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      ctx.strokeRect(barrierPx, groundY - wallH, wallW, wallH);

      // Warning stripes on barrier
      ctx.fillStyle = '#facc15';
      ctx.fillRect(barrierPx + 6, groundY - wallH + 10, wallW - 12, 14);
      ctx.fillRect(barrierPx + 6, groundY - wallH + 38, wallW - 12, 14);
      ctx.fillRect(barrierPx + 6, groundY - wallH + 66, wallW - 12, 14);

      ctx.fillStyle = '#ef4444';
      ctx.font = '700 11px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('BARRIER', barrierPx + wallW / 2, groundY - wallH - 8);
    }

    // 3. Draw Vehicle
    const carPxX = worldToScreen(this.carX);
    const carW = this.carLength * scale;
    const carH = 1.35 * scale;

    ctx.save();
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2.5;

    // Rounded vehicle chassis
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(carPxX, groundY - carH - 12, carW, carH, [10, 16, 4, 4]);
    } else {
      ctx.rect(carPxX, groundY - carH - 12, carW, carH);
    }
    ctx.fill();
    ctx.stroke();

    // Front crumple deformation on barrier impact
    if (this.carCrumple > 0) {
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(carPxX + carW - 16, groundY - carH - 10);
      ctx.lineTo(carPxX + carW - 4, groundY - carH / 2);
      ctx.lineTo(carPxX + carW - 16, groundY - 14);
      ctx.stroke();
    }

    // Steering Column & Wheel inside cabin
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(carPxX + carW * 0.64, groundY - 14);
    ctx.lineTo(carPxX + carW * 0.58, groundY - carH * 0.58);
    ctx.stroke();

    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(carPxX + carW * 0.57, groundY - carH * 0.60, 4, 10, Math.PI / 6, 0, Math.PI * 2);
    ctx.stroke();

    // Windshield
    ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(carPxX + carW * 0.48, groundY - carH - 10);
    ctx.lineTo(carPxX + carW * 0.72, groundY - carH + 12);
    ctx.lineTo(carPxX + carW * 0.48, groundY - carH + 12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Spiderweb cracks on windshield if shattered/cracked
    if (this.windshieldCracked) {
      ctx.save();
      const wx = carPxX + carW * 0.60;
      const wy = groundY - carH + 2;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = 1.5;
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
        ctx.beginPath();
        ctx.moveTo(wx, wy);
        ctx.lineTo(wx + Math.cos(a) * 14, wy + Math.sin(a) * 10);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(wx, wy, 5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(wx, wy, 11, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Wheels
    ctx.fillStyle = '#020617';
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(carPxX + carW * 0.20, groundY - 6, 14, 0, Math.PI * 2);
    ctx.arc(carPxX + carW * 0.78, groundY - 6, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // 4. Draw Passenger / Test Dummy
    const passPxX = worldToScreen(this.passengerAbsX);
    const passBaseY = groundY - carH * 0.55;
    const passPxY = passBaseY + (this.passengerAbsY * scale);

    ctx.save();
    ctx.translate(passPxX, passPxY);
    if (this.ejected) {
      ctx.rotate(this.dummyAngle);
    } else if (this.interiorImpact) {
      ctx.rotate(0.38); // Slumped/braced forward into dashboard and steering wheel
    }

    const dummyColor = this.hasSeatbelt ? '#10b981' : (this.interiorImpact || this.ejected ? '#ef4444' : '#f59e0b');
    ctx.fillStyle = dummyColor;
    ctx.strokeStyle = dummyColor;
    ctx.shadowColor = dummyColor;
    ctx.shadowBlur = 6;

    // Head
    ctx.beginPath();
    ctx.arc(0, -22, 9, 0, Math.PI * 2);
    ctx.fill();

    // Torso
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(0, -13);
    ctx.lineTo(0, 10);
    ctx.stroke();

    // Arms & Legs
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    if (!this.ejected) {
      if (this.interiorImpact) {
        // Braced or collapsed forward against steering wheel
        ctx.moveTo(0, -6);
        ctx.lineTo(14, 2);
        ctx.moveTo(0, 10);
        ctx.lineTo(10, 14);
      } else {
        // Normal sitting posture
        ctx.moveTo(0, -6);
        ctx.lineTo(12, -2);
        ctx.moveTo(0, 10);
        ctx.lineTo(12, 16);
      }
    } else {
      // Airborne tumble posture
      ctx.moveTo(0, -6);
      ctx.lineTo(14, -12);
      ctx.moveTo(0, -6);
      ctx.lineTo(-14, 2);
      ctx.moveTo(0, 10);
      ctx.lineTo(12, 20);
      ctx.moveTo(0, 10);
      ctx.lineTo(-10, 18);
    }
    ctx.stroke();

    // Seatbelt harness across chest (if strapped)
    if (this.hasSeatbelt && !this.ejected) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(-10, -18);
      ctx.lineTo(8, 10);
      ctx.stroke();
    }

    ctx.restore();

    // 5. Draw Force & Velocity Vectors
    if (this.state === 'running' || this.state === 'stopped') {
      // Velocity Vector on Passenger (Cyan)
      if (this.passengerAbsV > 0.5) {
        const vLen = Math.min(100, this.passengerAbsV * 3.2);
        this.drawArrow(passPxX, passPxY - 38, passPxX + vLen, passPxY - 38, '#06b6d4', `v_dummy = ${this.passengerAbsV.toFixed(1)} m/s`);
      }

      // Restraint Force or Zero Force Callout
      if (this.impactOccurred) {
        if (this.hasSeatbelt) {
          const fLen = Math.min(90, Math.abs(this.carA) * 1.2);
          this.drawArrow(passPxX, passPxY - 8, passPxX - fLen, passPxY - 8, '#f59e0b', 'F_seatbelt (Backward)');
        } else if (this.interiorImpact) {
          const isLightImpact = document.body.classList.contains('light-theme');
          ctx.save();
          ctx.fillStyle = isLightImpact ? '#b91c1c' : '#ef4444';
          ctx.font = '700 12px JetBrains Mono, monospace';
          ctx.textAlign = 'center';
          const impactLabel = this.stopType === 'brake' ? 'DASHBOARD CONTACT FORCE!' : 'INTERIOR IMPACT (Contained by Safety Glass)!';
          ctx.fillText(impactLabel, passPxX, passPxY - 55);
          ctx.fillStyle = isLightImpact ? '#334155' : '#94a3b8';
          ctx.font = '500 11px Outfit, sans-serif';
          ctx.fillText('Inertia moved dummy forward until stopped by interior surfaces.', passPxX, passPxY - 70);
          ctx.restore();
        } else if (this.ejected) {
          const isLightEject = document.body.classList.contains('light-theme');
          ctx.save();
          ctx.fillStyle = isLightEject ? '#b91c1c' : '#ef4444';
          ctx.font = '700 12px JetBrains Mono, monospace';
          ctx.textAlign = 'center';
          ctx.fillText('NO FORWARD FORCE (F_fwd = 0 N)!', passPxX + 30, passPxY - 55);
          ctx.fillStyle = isLightEject ? '#334155' : '#94a3b8';
          ctx.font = '500 11px Outfit, sans-serif';
          ctx.fillText('Extreme momentum broke windshield; inertia keeps dummy flying!', passPxX + 30, passPxY - 70);
          ctx.restore();
        } else {
          const isLightSlide = document.body.classList.contains('light-theme');
          ctx.save();
          ctx.fillStyle = isLightSlide ? '#b45309' : '#f59e0b';
          ctx.font = '700 12px JetBrains Mono, monospace';
          ctx.textAlign = 'center';
          ctx.fillText('SLIDING FORWARD BY INERTIA (F_fwd = 0 N)', passPxX + 30, passPxY - 55);
          ctx.restore();
        }
      }
    }

    // 6. Educational Status Banner in Canvas
    this.drawStatusBanner(w, h);
  }

  drawStatusBanner(w, h) {
    const ctx = this.ctx;
    ctx.save();
    ctx.font = '600 13px Outfit, sans-serif';

    let text = '';
    let badgeColor = '#38bdf8';

    if (this.state === 'idle') {
      text = `Preset: v₀ = ${this.initialVelocity} m/s (~${(this.initialVelocity * 2.24).toFixed(0)} mph) | Seatbelt: ${this.hasSeatbelt ? 'BUCKLED ✓' : 'UNBELTED ❌'} | Mode: ${this.stopType === 'barrier' ? 'Barrier Crash' : 'Emergency Braking'}`;
      badgeColor = '#94a3b8';
    } else if (this.hasSeatbelt && this.impactOccurred) {
      text = `✓ SEATBELT INERTIA RESTRAINT: Belt applies backward force (F = ma) to decelerate passenger with car!`;
      badgeColor = '#10b981';
    } else if (this.ejected) {
      if (this.state === 'stopped') {
        text = `💥 HIGH-SPEED EJECTION! At ${(this.initialVelocity * 2.24).toFixed(0)} mph, extreme momentum shattered windshield; dummy ejected by inertia!`;
        badgeColor = '#ef4444';
      } else {
        text = `💥 HIGH-SPEED EJECTION! Extreme momentum shattered windshield; dummy flies forward by inertia (0 N forward force)!`;
        badgeColor = '#ef4444';
      }
    } else if (this.interiorImpact) {
      if (this.stopType === 'brake') {
        text = `⚠️ SLAMMED INTO DASHBOARD! Unbelted passenger slid forward by inertia until stopped by the interior dashboard!`;
        badgeColor = '#f59e0b';
      } else {
        text = `💥 CONTAINED IN CABIN: Laminated safety glass held, but unbelted dummy slammed into wheel & windshield!`;
        badgeColor = '#ef4444';
      }
    } else if (!this.impactOccurred) {
      text = `Cruising at constant speed: Zero net force on car or passenger (Newton's 1st Law)!`;
      badgeColor = '#38bdf8';
    } else {
      text = `Vehicle decelerating, but UNBELTED passenger slides forward at initial velocity (Newton's 1st Law)!`;
      badgeColor = '#f59e0b';
    }

    const isLight = document.body.classList.contains('light-theme');
    let effectiveStroke = badgeColor;
    let effectiveText = badgeColor;
    if (isLight) {
      if (badgeColor === '#10b981') { effectiveStroke = '#047857'; effectiveText = '#047857'; }
      else if (badgeColor === '#ef4444') { effectiveStroke = '#b91c1c'; effectiveText = '#b91c1c'; }
      else if (badgeColor === '#f59e0b') { effectiveStroke = '#b45309'; effectiveText = '#b45309'; }
      else if (badgeColor === '#38bdf8') { effectiveStroke = '#0284c7'; effectiveText = '#0284c7'; }
      else if (badgeColor === '#94a3b8') { effectiveStroke = '#475569'; effectiveText = '#334155'; }
    }

    ctx.fillStyle = isLight ? 'rgba(255, 255, 255, 0.96)' : 'rgba(15, 23, 42, 0.88)';
    ctx.strokeStyle = effectiveStroke;
    ctx.lineWidth = 1.5;
    const bw = ctx.measureText(text).width + 30;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(w / 2 - bw / 2, 16, bw, 32, 8);
    } else {
      ctx.rect(w / 2 - bw / 2, 16, bw, 32);
    }
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = effectiveText;
    ctx.textAlign = 'center';
    ctx.fillText(text, w / 2, 36);
    ctx.restore();
  }

  drawArrow(fromX, fromY, toX, toY, color, label) {
    const ctx = this.ctx;
    const headLen = 9;
    const angle = Math.atan2(toY - fromY, toX - fromX);

    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLen * Math.cos(angle - Math.PI / 6), toY - headLen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - headLen * Math.cos(angle + Math.PI / 6), toY - headLen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();

    if (label) {
      ctx.font = '600 11px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(label, (fromX + toX) / 2, Math.min(fromY, toY) - 6);
    }
    ctx.restore();
  }
}

window.SimMotion = SimMotion;
