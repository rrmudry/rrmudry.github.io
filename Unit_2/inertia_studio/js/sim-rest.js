// Inertia of Rest Simulation Module: Tablecloth Pull & Coin Drop
// Accurate physics: Static vs. Kinetic friction, relative acceleration, tipping torque, and free fall

class SimRest {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.mode = 'tablecloth'; // 'tablecloth' or 'coin_beaker'

    // Physics parameters
    this.g = 9.8; // m/s^2
    this.scale = 400; // pixels per meter

    // Presets
    this.clothMaterials = {
      silk: { name: 'Smooth Silk', mu_s: 0.15, mu_k: 0.10, color: '#f43f5e' },
      linen: { name: 'Cotton Linen', mu_s: 0.35, mu_k: 0.25, color: '#e2e8f0' },
      sandpaper: { name: 'Rough Rubber', mu_s: 0.85, mu_k: 0.70, color: '#f59e0b' }
    };
    this.selectedMaterial = 'silk';

    this.dishTypes = {
      plate: { name: 'Porcelain Plate', mass: 0.60, width: 0.22, height: 0.03, cm_h: 0.015, icon: '🍽️' },
      glass: { name: 'Crystal Wine Glass', mass: 0.18, width: 0.065, height: 0.16, cm_h: 0.08, icon: '🍷', canTip: true },
      pan: { name: 'Cast Iron Skillet', mass: 2.40, width: 0.26, height: 0.05, cm_h: 0.02, icon: '🍳' },
      mug: { name: 'Ceramic Mug', mass: 0.45, width: 0.09, height: 0.10, cm_h: 0.05, icon: '☕' }
    };
    this.selectedDish = 'plate';

    // State variables
    this.pullAccel = 25.0; // m/s^2
    this.pullDirection = 1; // 1 = pull right
    this.state = 'idle'; // 'idle', 'pulling', 'settled', 'tipped', 'fallen'
    this.time = 0;
    this.dt = 1 / 60;

    // Cloth geometry & position (meters)
    this.tableX = 0.15; // left edge of table
    this.tableWidth = 1.1; // 1.1 m table
    this.tableTopY = 0.55; // fraction of canvas height
    this.drapeLen = 0.14; // ~55px hanging over table end

    this.reset();
  }

  reset() {
    this.state = 'idle';
    this.time = 0;

    // Cloth coordinates in meters
    this.clothLength = this.tableWidth; // covers table surface
    this.clothX = this.tableX; // starts exactly at left edge of table
    this.clothDist = 0; // meters pulled to the right
    this.clothV = 0;
    this.clothA = 0;

    // Dish coordinates in meters
    const dish = this.dishTypes[this.selectedDish];
    this.initialDishX = this.tableX + this.tableWidth * 0.50; // 0.70 m (centered on table)
    this.dishX = this.initialDishX;
    this.dishY = 0; // vertical offset relative to table top
    this.dishV = 0;
    this.dishA = 0;
    this.dishAngle = 0;
    this.dishAngularV = 0;

    // Coin & Beaker state
    this.beakerW = 100;
    this.beakerH = 145;
    this.cardW = 160;
    this.cardThick = 6;
    this.cardX = 0; // horizontal card offset from center in pixels
    this.cardV = 0;
    this.cardA = 0;

    this.coinOffsetX = 0; // horizontal coin offset from center in pixels
    this.coinY = 0; // vertical fall in pixels from top of card
    this.coinVx = 0;
    this.coinVy = 0;
    this.coinFallen = false;

    // Telemetry trace
    this.tracePoints = [];
    this.pullStarted = false;
  }

  setPullAccel(accel) {
    this.pullAccel = Math.max(1, Math.min(100, accel));
  }

  setMaterial(key) {
    if (this.clothMaterials[key]) {
      this.selectedMaterial = key;
    }
  }

  setDish(key) {
    if (this.dishTypes[key]) {
      this.selectedDish = key;
      this.reset();
    }
  }

  triggerPull() {
    this.reset();
    this.state = 'pulling';
    this.pullStarted = true;
    if (this.mode === 'tablecloth') {
      window.soundFx.playWhip();
    } else {
      window.soundFx.playSnap();
    }
  }

  update(timeStep) {
    if (this.state !== 'pulling') return;
    const dt = timeStep || this.dt;
    this.time += dt;

    if (this.mode === 'tablecloth') {
      this.updateTablecloth(dt);
    } else {
      this.updateCoinBeaker(dt);
    }
  }

  updateTablecloth(dt) {
    const mat = this.clothMaterials[this.selectedMaterial];
    const dish = this.dishTypes[this.selectedDish];

    // Accelerate the cloth to the right
    this.clothA = this.pullAccel;
    this.clothV += this.clothA * dt;
    this.clothDist += this.clothV * dt;
    this.clothX = this.tableX + Math.max(0, this.clothDist - this.drapeLen);

    // Contact check: Is dish still on top of the moving cloth?
    const clothLeft = this.clothX;
    const clothRight = this.tableX + this.clothLength + this.clothDist;
    const dishOnCloth = (this.dishX >= clothLeft && this.dishX <= clothRight);

    const normalForce = dish.mass * this.g;
    const maxStaticFriction = mat.mu_s * normalForce;
    const maxStaticAccel = mat.mu_s * this.g;

    let frictionForce = 0;

    if (dishOnCloth) {
      const vRel = this.clothV - this.dishV;

      if (Math.abs(vRel) < 0.001 && this.clothA <= maxStaticAccel) {
        // Static friction lock: dish accelerates with the cloth
        this.dishA = this.clothA;
        frictionForce = dish.mass * this.clothA;
      } else {
        // Dynamic slip: kinetic friction acts on dish in direction of cloth motion
        const kineticFriction = mat.mu_k * normalForce;
        frictionForce = kineticFriction * Math.sign(vRel || 1);
        this.dishA = frictionForce / dish.mass;

        // Check for tipping torque if dish has canTip
        if (dish.canTip && Math.abs(this.dishA) > (this.g * (dish.width / 2) / dish.cm_h)) {
          this.dishAngularV += (this.dishA * dish.cm_h - this.g * (dish.width / 2)) * 12 * dt;
          this.dishAngle += this.dishAngularV * dt;
          if (Math.abs(this.dishAngle) > 0.8) {
            this.state = 'tipped';
            window.soundFx.playThud();
          }
        }
      }
    } else {
      // Dish is no longer on the cloth! It is now on the bare table (mu_table = 0.40)
      const tableMu = 0.40;
      if (Math.abs(this.dishV) > 0.01) {
        frictionForce = -Math.sign(this.dishV) * tableMu * normalForce;
        this.dishA = frictionForce / dish.mass;
      } else {
        this.dishA = 0;
        this.dishV = 0;
        frictionForce = 0;
      }
    }

    this.dishV += this.dishA * dt;
    this.dishX += this.dishV * dt;

    // Check if dish falls off the right edge of table
    const tableRightEdge = this.tableX + this.tableWidth;
    if (this.dishX > tableRightEdge) {
      this.dishY += (0.5 * this.g * (this.dishY + 0.1) + 2) * dt;
      if (this.dishY > 0.8 && this.state !== 'fallen') {
        this.state = 'fallen';
        window.soundFx.playThud();
      }
    }

    // Stop simulation when cloth has pulled completely off screen
    if (this.clothDist > 2.5 && Math.abs(this.dishV) < 0.02) {
      this.dishV = 0;
      this.dishA = 0;
      if (this.state === 'pulling') {
        this.state = 'settled';
        if (this.dishX <= tableRightEdge && Math.abs(this.dishAngle) < 0.2) {
          window.soundFx.playSuccess();
        }
      }
    }

    // Record trace
    if (this.tracePoints.length < 300) {
      this.tracePoints.push({ x: this.dishX, y: this.dishY, t: this.time });
    }
  }

  updateCoinBeaker(dt) {
    if (this.state !== 'pulling') return;

    // Card flick acceleration to the right (scaled to pixels: 2000 px/s^2)
    this.cardA = Math.max(1600, this.pullAccel * 75);
    this.cardV += this.cardA * dt;
    this.cardX += this.cardV * dt;

    // Contact check: Card is centered at bkCenterX + this.cardX
    // Left edge of card relative to center is: this.cardX - this.cardW / 2
    // When left edge of card passes this.coinOffsetX, card is no longer under the penny!
    const cardLeftRel = this.cardX - this.cardW / 2;
    const coinOnCard = (cardLeftRel < this.coinOffsetX);

    if (coinOnCard) {
      // Penny on card: brief kinetic friction during rapid card slip
      // Tiny horizontal acceleration: mu_card * g (in px/s^2)
      const frictionA_px = 0.10 * (this.g * 20); // ~20 px/s^2
      this.coinVx += frictionA_px * dt;
      this.coinOffsetX += this.coinVx * dt;
    } else {
      // Penny is now completely unsupported: PURE VERTICAL FREE FALL!
      const g_px = this.g * 130; // gravity acceleration in px/s^2
      this.coinVy += g_px * dt;
      this.coinY += this.coinVy * dt;
      // Negligible horizontal drift (< 1.5 px total over the entire drop)
      this.coinOffsetX += this.coinVx * dt;

      // Beaker depth catch: bottom of beaker is bkH - 24
      const catchY = this.beakerH - 24;
      if (this.coinY >= catchY && !this.coinFallen) {
        this.coinY = catchY;
        this.coinVy = 0;
        this.coinVx = 0;
        this.coinFallen = true;
        this.state = 'settled';
        window.soundFx.playClink();
      }
    }

    if (this.cardX > 800 && this.coinFallen) {
      this.state = 'settled';
    }
  }

  getTelemetry() {
    const dish = this.dishTypes[this.selectedDish];
    const mat = this.clothMaterials[this.selectedMaterial];
    const normalForce = dish.mass * this.g;
    const maxStaticForce = mat.mu_s * normalForce;
    const maxStaticAccel = mat.mu_s * this.g;
    const netForce = dish.mass * Math.abs(this.dishA);

    return {
      dishName: dish.name,
      materialName: mat.name,
      pullAccel: this.pullAccel.toFixed(1),
      maxStaticAccel: maxStaticAccel.toFixed(2),
      objectMass: dish.mass.toFixed(2),
      objectAccel: Math.abs(this.dishA).toFixed(2),
      objectVel: Math.abs(this.dishV).toFixed(3),
      objectDispCm: ((this.dishX - this.initialDishX) * 100).toFixed(1),
      netForce: netForce.toFixed(2),
      isSlipping: this.pullAccel > maxStaticAccel,
      state: this.state
    };
  }

  render() {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const ctx = this.ctx;

    ctx.clearRect(0, 0, w, h);

    if (this.mode === 'tablecloth') {
      this.renderTableclothScene(w, h);
    } else {
      this.renderCoinBeakerScene(w, h);
    }
  }

  renderTableclothScene(w, h) {
    const ctx = this.ctx;
    const originY = h * this.tableTopY;

    // 1. Table Top & Legs (exact scale mapping)
    const tblLeft = w * 0.12;
    const tblWidth = w * 0.76;
    const tblRight = tblLeft + tblWidth;
    const tblThick = 24;
    const scale = tblWidth / this.tableWidth;

    // Table legs
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(tblLeft + 24, originY + tblThick, 26, h - originY - tblThick);
    ctx.fillRect(tblRight - 50, originY + tblThick, 26, h - originY - tblThick);

    // Leg floor foot caps
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(tblLeft + 20, h - 14, 34, 14);
    ctx.fillRect(tblRight - 54, h - 14, 34, 14);

    // Table Top Slab (with rounded corners)
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(tblLeft, originY, tblWidth, tblThick, [4, 4, 2, 2]);
    } else {
      ctx.rect(tblLeft, originY, tblWidth, tblThick);
    }
    ctx.fill();

    // Table surface sheen line
    const isLightTable = document.body.classList.contains('light-theme');
    ctx.strokeStyle = isLightTable ? '#0284c7' : '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(tblLeft, originY);
    ctx.lineTo(tblRight, originY);
    ctx.stroke();

    // 2. Draw Tablecloth
    const mat = this.clothMaterials[this.selectedMaterial];
    const clothThickness = 6;
    const drapePixels = this.drapeLen * scale; // ~55px hanging down

    // Remaining left drape hanging down over tblLeft
    const remainingLeftDrape = Math.max(0, (this.drapeLen - this.clothDist) * scale);

    // Left edge of horizontal cloth on tabletop
    const clothLeftPx = tblLeft + Math.max(0, (this.clothDist - this.drapeLen) * scale);

    // Right edge of horizontal cloth on tabletop or pulled beyond
    const clothRightPx = tblRight + (this.clothDist * scale);

    ctx.save();
    ctx.fillStyle = mat.color;
    ctx.strokeStyle = mat.color;
    ctx.shadowColor = mat.color;
    ctx.shadowBlur = 8;

    // Draw Left Hanging Drape (draping over the left end of the table!)
    if (remainingLeftDrape > 0) {
      ctx.beginPath();
      ctx.lineWidth = clothThickness;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(tblLeft - clothThickness / 2, originY + remainingLeftDrape);
      ctx.lineTo(tblLeft - clothThickness / 2, originY - clothThickness / 2);
      ctx.quadraticCurveTo(tblLeft - clothThickness / 2, originY - clothThickness, tblLeft + 6, originY - clothThickness / 2);
      ctx.stroke();

      // Fold hem at bottom of left drape
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.fillRect(tblLeft - clothThickness - 1, originY + remainingLeftDrape - 5, clothThickness + 2, 5);
    }

    // Draw Horizontal Cloth on Tabletop
    if (clothRightPx > clothLeftPx) {
      const flatW = clothRightPx - clothLeftPx;
      ctx.fillStyle = mat.color;
      ctx.fillRect(clothLeftPx, originY - clothThickness, flatW, clothThickness);

      // Fabric sheen highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.fillRect(clothLeftPx, originY - clothThickness, flatW, 2);
    }

    // Draw Right Hanging Drape (at rest, drapes over right end!)
    if (this.clothDist === 0) {
      ctx.beginPath();
      ctx.lineWidth = clothThickness;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(tblRight - 6, originY - clothThickness / 2);
      ctx.quadraticCurveTo(tblRight + clothThickness / 2, originY - clothThickness, tblRight + clothThickness / 2, originY - clothThickness / 2);
      ctx.lineTo(tblRight + clothThickness / 2, originY + drapePixels);
      ctx.stroke();

      // Fold hem at bottom of right drape
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.fillRect(tblRight - 1, originY + drapePixels - 5, clothThickness + 2, 5);
    }

    ctx.restore();

    // Pull arrow on cloth
    if (this.state === 'pulling' || this.state === 'idle') {
      const pullOriginX = this.clothDist === 0 ? tblRight + clothThickness / 2 : clothRightPx;
      const pullOriginY = this.clothDist === 0 ? originY + drapePixels / 2 : originY - clothThickness / 2;
      this.drawArrow(pullOriginX, pullOriginY, pullOriginX + 65, pullOriginY, '#ec4899', 'a_pull');
    }

    // 3. Draw Dish / Object
    const dish = this.dishTypes[this.selectedDish];
    const dishPxX = tblLeft + (this.dishX - this.tableX) * scale;
    const clothLeft = this.clothX;
    const clothRight = this.tableX + this.clothLength + this.clothDist;
    const dishOnCloth = (this.dishX >= clothLeft && this.dishX <= clothRight);
    const dishPxY = originY - (dishOnCloth ? clothThickness : 0) + (this.dishY * scale);

    ctx.save();
    ctx.translate(dishPxX, dishPxY);
    ctx.rotate(this.dishAngle);

    // Dish Base & Body
    const dW = dish.width * scale;
    const dH = dish.height * scale;

    ctx.fillStyle = '#e2e8f0';
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 10;

    if (this.selectedDish === 'plate') {
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.ellipse(0, -dH / 2, dW / 2, dH / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (this.selectedDish === 'glass') {
      // Wine Glass stem & bowl
      ctx.strokeStyle = '#38bdf8';
      ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.lineWidth = 3;
      // Bowl
      ctx.beginPath();
      ctx.moveTo(-dW / 2, -dH);
      ctx.quadraticCurveTo(0, -dH * 0.4, dW / 2, -dH);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Stem & Base
      ctx.beginPath();
      ctx.moveTo(0, -dH * 0.45);
      ctx.lineTo(0, 0);
      ctx.moveTo(-dW * 0.4, 0);
      ctx.lineTo(dW * 0.4, 0);
      ctx.stroke();
    } else {
      // Mug or Skillet
      ctx.fillStyle = this.selectedDish === 'pan' ? '#334155' : '#fb923c';
      ctx.fillRect(-dW / 2, -dH, dW, dH);
      ctx.strokeStyle = '#f1f5f9';
      ctx.lineWidth = 2;
      ctx.strokeRect(-dW / 2, -dH, dW, dH);
    }

    ctx.restore();

    // 4. Force Vectors on Dish
    if (this.state === 'pulling') {
      // Normal Force (Up)
      this.drawArrow(dishPxX, dishPxY - dH, dishPxX, dishPxY - dH - 45, '#10b981', 'F_N');
      // Gravity Force (Down)
      this.drawArrow(dishPxX, dishPxY, dishPxX, dishPxY + 45, '#10b981', 'F_g');
      // Friction Force on Dish
      if (Math.abs(this.dishA) > 0.05) {
        const fLen = Math.min(80, Math.max(20, this.dishA * 8));
        this.drawArrow(dishPxX, dishPxY - 8, dishPxX + fLen * Math.sign(this.dishA), dishPxY - 8, '#f59e0b', 'F_friction');
      }
      // Velocity Vector (Cyan)
      if (Math.abs(this.dishV) > 0.05) {
        const vLen = Math.min(90, Math.max(20, this.dishV * 180));
        this.drawArrow(dishPxX, dishPxY - dH / 2, dishPxX + vLen, dishPxY - dH / 2, '#06b6d4', 'v_dish');
      }
    }

    // 5. Educational Status Banner in Canvas
    this.drawStatusBanner(w, h);
  }

  renderCoinBeakerScene(w, h) {
    const ctx = this.ctx;
    const originY = h * 0.70; // table surface height

    // Table Top & Legs for Beaker setup
    const tblLeft = w * 0.20;
    const tblWidth = w * 0.60;
    const tblThick = 22;

    // Table legs
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(tblLeft + 30, originY + tblThick, 26, h - originY - tblThick);
    ctx.fillRect(tblLeft + tblWidth - 56, originY + tblThick, 26, h - originY - tblThick);

    // Table surface
    const isLightBeaker = document.body.classList.contains('light-theme');
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(tblLeft, originY, tblWidth, tblThick);
    ctx.strokeStyle = isLightBeaker ? '#0284c7' : '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(tblLeft, originY);
    ctx.lineTo(tblLeft + tblWidth, originY);
    ctx.stroke();

    // 1. Beaker Geometry (Centered on canvas)
    const bkCenterX = w * 0.50; // exact center of canvas
    const bkW = this.beakerW;
    const bkH = this.beakerH;
    const bkLeft = bkCenterX - bkW / 2;
    const bkRight = bkCenterX + bkW / 2;
    const bkTop = originY - bkH;

    // Beaker Glass Body & Water
    ctx.save();
    ctx.fillStyle = 'rgba(56, 189, 248, 0.06)';
    ctx.fillRect(bkLeft, bkTop, bkW, bkH);

    // Water in bottom of beaker
    ctx.fillStyle = 'rgba(14, 165, 233, 0.30)';
    ctx.fillRect(bkLeft + 4, originY - 45, bkW - 8, 43);

    // Graduation lines on glass (measurement marks)
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.font = '600 9px JetBrains Mono, monospace';
    ctx.fillStyle = 'rgba(56, 189, 248, 0.6)';
    for (let i = 1; i <= 3; i++) {
      const markY = originY - (bkH * i / 4);
      ctx.beginPath();
      ctx.moveTo(bkLeft + 6, markY);
      ctx.lineTo(bkLeft + 22, markY);
      ctx.stroke();
      ctx.fillText(`${i * 100}ml`, bkLeft + 26, markY + 3);
    }

    // Beaker Glass Outline (Left, Bottom, Right with lip)
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(bkLeft - 5, bkTop - 3);
    ctx.lineTo(bkLeft, bkTop);
    ctx.lineTo(bkLeft, originY);
    ctx.lineTo(bkRight, originY);
    ctx.lineTo(bkRight, bkTop);
    ctx.lineTo(bkRight + 8, bkTop - 4);
    ctx.stroke();
    ctx.restore();

    // 2. Index Card
    const cardW = this.cardW;
    const cardCenterX = bkCenterX + this.cardX;
    const cardLeft = cardCenterX - cardW / 2;
    const cardTop = bkTop - this.cardThick;

    ctx.save();
    ctx.fillStyle = '#f8fafc';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 6;
    ctx.fillRect(cardLeft, cardTop, cardW, this.cardThick);

    // Index card thin red margin line
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cardLeft + 28, cardTop);
    ctx.lineTo(cardLeft + 28, cardTop + this.cardThick);
    ctx.stroke();

    // Index card blue border
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1;
    ctx.strokeRect(cardLeft, cardTop, cardW, this.cardThick);
    ctx.restore();

    // Flick Arrow on Card
    if (this.state === 'pulling' || this.state === 'idle') {
      this.drawArrow(cardLeft + cardW, cardTop + this.cardThick / 2, cardLeft + cardW + 55, cardTop + this.cardThick / 2, '#ec4899', 'Flick');
    }

    // 3. Penny (Copper Coin)
    // EXACT ALIGNMENT: centered at bkCenterX + this.coinOffsetX!
    const coinPxX = bkCenterX + this.coinOffsetX;
    const coinRestY = cardTop - 7;
    const coinPxY = coinRestY + this.coinY;

    ctx.save();
    // Copper gradient
    const grad = ctx.createRadialGradient(coinPxX - 3, coinPxY - 2, 2, coinPxX, coinPxY, 14);
    grad.addColorStop(0, '#fbbf24');
    grad.addColorStop(0.4, '#d97706');
    grad.addColorStop(1, '#92400e');
    ctx.fillStyle = grad;
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 8;

    // Coin body
    ctx.beginPath();
    ctx.ellipse(coinPxX, coinPxY, 13, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Metallic rim & inner detail
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(coinPxX, coinPxY, 10, 5, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // 4. Force Vectors & Annotations
    if (this.state === 'pulling') {
      // Downward Gravity Vector
      this.drawArrow(coinPxX, coinPxY, coinPxX, coinPxY + 45, '#10b981', 'F_g (Straight Down)');

      // Zero Horizontal Force Annotation
      ctx.save();
      const isLightAnnotation = document.body.classList.contains('light-theme');
      ctx.fillStyle = isLightAnnotation ? '#b91c1c' : '#ef4444';
      ctx.font = '700 11px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('NO HORIZONTAL FORCE (F_x = 0 N)!', coinPxX, coinPxY - 22);
      ctx.restore();
    }

    // 5. Educational Status Banner in Canvas
    this.drawStatusBanner(w, h);
  }

  drawStatusBanner(w, h) {
    const ctx = this.ctx;
    ctx.save();
    ctx.font = '600 13px Outfit, sans-serif';

    let text = '';
    let badgeColor = '#38bdf8';

    if (this.mode === 'coin_beaker') {
      if (this.state === 'idle') {
        text = `Click '⚡ FLICK CARD' to test Inertia of Rest: Penny stays put while card is flicked out!`;
        badgeColor = '#94a3b8';
      } else if (this.coinFallen || this.state === 'settled') {
        text = `✓ SUCCESS! Penny dropped straight into beaker: Zero horizontal force = No horizontal acceleration!`;
        badgeColor = '#10b981';
      } else {
        text = `✓ INERTIA OF REST: Card flicked out! Only gravity (F_g) acts -> Penny drops straight down!`;
        badgeColor = '#10b981';
      }
    } else {
      const mat = this.clothMaterials[this.selectedMaterial];
      const maxStaticA = (mat.mu_s * this.g).toFixed(1);

      if (this.state === 'idle') {
        text = `Threshold: Pull Accel MUST exceed ${maxStaticA} m/s² to slip, or dish will move with cloth!`;
        badgeColor = '#94a3b8';
      } else if (this.state === 'tipped') {
        text = `💥 OVERTURNED! Sudden friction torque flipped the tall glass!`;
        badgeColor = '#ef4444';
      } else if (this.state === 'fallen') {
        text = `❌ FALLEN OFF TABLE! Pull was too slow—static friction carried the dish off the edge!`;
        badgeColor = '#ef4444';
      } else if (this.dishX > this.tableX + this.tableWidth) {
        text = `⚠️ ACCELERATING OFF TABLE: Static friction locked dish to cloth!`;
        badgeColor = '#f59e0b';
      } else if (this.pullAccel > mat.mu_s * this.g) {
        text = `✓ INERTIA PREVAILS: a_pull (${this.pullAccel} m/s²) > μ_s·g (${maxStaticA} m/s²) -> Cloth slipped! Dish stays at rest!`;
        badgeColor = '#10b981';
      } else {
        text = `⚠️ DANGER: a_pull (${this.pullAccel} m/s²) <= μ_s·g (${maxStaticA} m/s²) -> Static friction holds dish!`;
        badgeColor = '#f59e0b';
      }
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

window.SimRest = SimRest;
