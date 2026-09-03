/**
 * VectorMap - Coordinate Grid & Right-Triangle Vector Engine
 * Focuses on computing displacement vector magnitudes using (x, y) coordinates & Pythagorean theorem.
 */

// Simple seeded PRNG (mulberry32)
function mulberry32(a) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

class VectorMap {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;

    // Grid Dimensions in Paper Centimeters
    this.maxGridXCm = 20.0;
    this.maxGridYCm = 15.0;
    this.pxPerCm = 36;
    this.displayW = 800;
    this.displayH = 600;

    // Visual options
    this.showGrid = true;
    this.showCompass = true;
    this.activeInspectedLeg = 'leg1'; // 'leg1', 'leg2', 'leg3', 'net', 'all'
    this.hoveredLeg = -1;

    // Supported Realms with authentic Cartographic themes
    this.realms = {
      dragon_pass: {
        key: 'dragon_pass',
        name: "⛰️ The Dragon's Fang Pass",
        scaleFactor: 10.0,
        scaleUnit: 'leagues',
        landmarkNames: [
          "Origin Citadel",
          "Frostbite Cavern",
          "Wyrm Ridge Pass",
          "Dragon's Peak Shrine"
        ]
      },
      swamp_citadel: {
        key: 'swamp_citadel',
        name: "🌲 The Sunken Bayou & Citadel",
        scaleFactor: 12.5,
        scaleUnit: 'leagues',
        landmarkNames: [
          "Rikterell Hamlet",
          "Misty Mangrove",
          "Submerged Obelisk",
          "Citadel of the Gem"
        ]
      },
      eldoria_isles: {
        key: 'eldoria_isles',
        name: "⛵ The Coast of Eldoria",
        scaleFactor: 8.0,
        scaleUnit: 'leagues',
        landmarkNames: [
          "Harbor of Eldor",
          "Mermaid's Shoal",
          "Obsidian Lighthouse",
          "Storm Citadel"
        ]
      }
    };

    this.currentRealmKey = 'dragon_pass';
    this.activeRealm = this.realms.dragon_pass;
    this.userSeed = Math.floor(Math.random() * 9000000 + 100000);
    this.rng = mulberry32(this.userSeed);

    // Landmarks array
    this.landmarks = [];

    this.initCanvasSize();
    this.generateRealmCoordinates();

    window.addEventListener('resize', () => {
      this.initCanvasSize();
      this.render();
    });
  }

  setUserSeedFromId(studentId) {
    let numericSeed = 0;
    for (let i = 0; i < studentId.length; i++) {
      numericSeed = (numericSeed * 31 + studentId.charCodeAt(i)) % 99999999;
    }
    this.userSeed = numericSeed || 1234567;
    this.rng = mulberry32(this.userSeed);
    this.generateRealmCoordinates();
    this.render();
  }

  generateNewRandomPath() {
    this.userSeed = Math.floor(Math.random() * 9000000 + 100000);
    this.rng = mulberry32(this.userSeed);
    this.generateRealmCoordinates();
    this.render();
  }

  setRealm(key, regenerate = true) {
    if (this.realms[key]) {
      this.currentRealmKey = key;
      this.activeRealm = this.realms[key];
      if (regenerate) {
        this.generateNewRandomPath();
      }
      this.render();
    }
  }

  initCanvasSize() {
    if (!this.canvas) return;
    const container = this.canvas.parentElement;
    const availableWidth = container ? container.clientWidth : 720;

    // Dynamic grid scaling based on container width
    this.pxPerCm = Math.max(22, Math.min(42, Math.floor(availableWidth / (this.maxGridXCm + 1.2))));
    this.displayW = Math.round(this.pxPerCm * (this.maxGridXCm + 0.8));
    this.displayH = Math.round(this.pxPerCm * (this.maxGridYCm + 0.8));

    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = this.displayW * dpr;
    this.canvas.height = this.displayH * dpr;
    this.canvas.style.width = `${this.displayW}px`;
    this.canvas.style.height = `${this.displayH}px`;

    this.ctx = this.canvas.getContext('2d');
    this.ctx.scale(dpr, dpr);
  }

  // Generate 4 landmarks with clean, pedagogically friendly 0.5 cm or whole integer coordinates
  generateRealmCoordinates() {
    const rng = this.rng;

    // Helper: round to nearest 0.5 or 1.0 cm
    const roundHalf = (val) => Math.round(val * 2) / 2;

    // Landmark A: Origin is always (0.0, 0.0)
    const ptA = { x: 0.0, y: 0.0, name: this.activeRealm.landmarkNames[0], code: 'A' };

    // Landmark B: First stop (East + North) -> e.g. x in [4.0, 8.0], y in [3.0, 7.0]
    const xB = roundHalf(4.5 + rng() * 3.5); // 4.5 to 8.0 cm
    const yB = roundHalf(3.0 + rng() * 4.0); // 3.0 to 7.0 cm
    const ptB = { x: xB, y: yB, name: this.activeRealm.landmarkNames[1], code: 'B' };

    // Landmark C: Second stop (moves further East or slightly West, higher North)
    const xC = roundHalf(xB + (rng() > 0.4 ? (3.0 + rng() * 3.5) : -(1.5 + rng() * 2.0)));
    const yC = roundHalf(yB + (2.5 + rng() * 4.0));
    // Keep within bounds
    const clampedXC = Math.max(2.0, Math.min(18.0, xC));
    const clampedYC = Math.max(2.0, Math.min(13.5, yC));
    const ptC = { x: clampedXC, y: clampedYC, name: this.activeRealm.landmarkNames[2], code: 'C' };

    // Landmark D: Final Destination (Citadel / Shrine)
    const xD = roundHalf(clampedXC + (rng() > 0.3 ? (3.0 + rng() * 4.0) : -(1.5 + rng() * 2.5)));
    const yD = roundHalf(clampedYC + (rng() > 0.5 ? (1.5 + rng() * 2.5) : -(1.0 + rng() * 2.0)));
    const clampedXD = Math.max(3.0, Math.min(18.5, xD));
    const clampedYD = Math.max(3.0, Math.min(14.0, yD));
    const ptD = { x: clampedXD, y: clampedYD, name: this.activeRealm.landmarkNames[3], code: 'D' };

    this.landmarks = [ptA, ptB, ptC, ptD];
  }

  // Convert coordinate (cmX, cmY) to screen canvas pixel coordinates
  // (0,0) Origin is placed with margin from bottom-left
  gridToPixel(cmX, cmY) {
    const marginX = this.pxPerCm * 1.5;
    const marginY = this.displayH - this.pxPerCm * 1.6; // Y=0 at bottom, increasing upwards

    const pxX = marginX + cmX * this.pxPerCm;
    const pxY = marginY - cmY * this.pxPerCm; // Invert Y so positive Y is North (upwards)
    return { x: pxX, y: pxY };
  }

  getLegData(legKey) {
    if (legKey === 'leg1') {
      const p1 = this.landmarks[0];
      const p2 = this.landmarks[1];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const magCm = Math.sqrt(dx * dx + dy * dy);
      return {
        key: 'leg1',
        name: `Leg 1: ${p1.code} → ${p2.code}`,
        start: p1,
        end: p2,
        dx,
        dy,
        magnitudeCm: magCm,
        magnitudeRealm: magCm * this.activeRealm.scaleFactor,
        color: '#10b981' // Emerald
      };
    } else if (legKey === 'leg2') {
      const p1 = this.landmarks[1];
      const p2 = this.landmarks[2];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const magCm = Math.sqrt(dx * dx + dy * dy);
      return {
        key: 'leg2',
        name: `Leg 2: ${p1.code} → ${p2.code}`,
        start: p1,
        end: p2,
        dx,
        dy,
        magnitudeCm: magCm,
        magnitudeRealm: magCm * this.activeRealm.scaleFactor,
        color: '#f59e0b' // Amber
      };
    } else if (legKey === 'leg3') {
      const p1 = this.landmarks[2];
      const p2 = this.landmarks[3];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const magCm = Math.sqrt(dx * dx + dy * dy);
      return {
        key: 'leg3',
        name: `Leg 3: ${p1.code} → ${p2.code}`,
        start: p1,
        end: p2,
        dx,
        dy,
        magnitudeCm: magCm,
        magnitudeRealm: magCm * this.activeRealm.scaleFactor,
        color: '#8b5cf6' // Purple
      };
    } else { // 'net'
      const p1 = this.landmarks[0];
      const p2 = this.landmarks[3];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const magCm = Math.sqrt(dx * dx + dy * dy);
      return {
        key: 'net',
        name: `Net Resultant: ${p1.code} → ${p2.code}`,
        start: p1,
        end: p2,
        dx,
        dy,
        magnitudeCm: magCm,
        magnitudeRealm: magCm * this.activeRealm.scaleFactor,
        color: '#f43f5e' // Rose
      };
    }
  }

  setInspectedLeg(legKey) {
    this.activeInspectedLeg = legKey;
    this.render();
  }

  setHoveredLeg(legIndex) {
    this.hoveredLeg = legIndex;
    this.render();
  }

  render() {
    if (!this.ctx) return;
    const ctx = this.ctx;

    // 1. Clear & Background Parchment
    ctx.clearRect(0, 0, this.displayW, this.displayH);

    // 2. Draw 1 cm Grid
    if (this.showGrid) {
      this.drawGrid(ctx);
    }

    // 3. Draw All Vector Displacement Paths
    this.drawVectors(ctx);

    // 4. Draw Right-Triangle Component Projections (Δx, Δy, right-angle symbol)
    if (this.activeInspectedLeg !== 'all') {
      this.drawComponentTriangle(ctx, this.activeInspectedLeg);
    } else {
      // If 'all', show net triangle faintly
      this.drawComponentTriangle(ctx, 'net', true);
    }

    // 5. Draw Landmarks & Coordinate Badges
    this.drawLandmarks(ctx);

    // 6. Draw Compass Rose & Map Scale Key
    if (this.showCompass) {
      this.drawCompassRose(ctx);
    }
    this.drawScaleKey(ctx);
  }

  drawGrid(ctx) {
    ctx.save();
    ctx.lineWidth = 1;

    const origin = this.gridToPixel(0, 0);

    // Minor lines (every 1 cm)
    for (let cmX = 0; cmX <= this.maxGridXCm; cmX++) {
      const pTop = this.gridToPixel(cmX, this.maxGridYCm);
      const pBottom = this.gridToPixel(cmX, 0);

      ctx.strokeStyle = cmX === 0 ? 'rgba(158, 42, 43, 0.6)' : 'rgba(90, 70, 50, 0.18)';
      ctx.beginPath();
      ctx.moveTo(pTop.x, pTop.y);
      ctx.lineTo(pBottom.x, pBottom.y);
      ctx.stroke();

      // Axis labels (every 2 cm)
      if (cmX > 0 && cmX % 2 === 0) {
        ctx.fillStyle = '#4a3728';
        ctx.font = 'bold 9px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${cmX}cm`, pBottom.x, origin.y + 14);
      }
    }

    for (let cmY = 0; cmY <= this.maxGridYCm; cmY++) {
      const pLeft = this.gridToPixel(0, cmY);
      const pRight = this.gridToPixel(this.maxGridXCm, cmY);

      ctx.strokeStyle = cmY === 0 ? 'rgba(158, 42, 43, 0.6)' : 'rgba(90, 70, 50, 0.18)';
      ctx.beginPath();
      ctx.moveTo(pLeft.x, pLeft.y);
      ctx.lineTo(pRight.x, pRight.y);
      ctx.stroke();

      // Axis labels (every 2 cm)
      if (cmY > 0 && cmY % 2 === 0) {
        ctx.fillStyle = '#4a3728';
        ctx.font = 'bold 9px "JetBrains Mono", monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`${cmY}cm`, origin.x - 6, pLeft.y + 3);
      }
    }

    // Origin label (0,0)
    ctx.fillStyle = '#7c2d12';
    ctx.font = 'bold 10px "Cinzel", serif';
    ctx.textAlign = 'right';
    ctx.fillText('ORIGIN (0,0)', origin.x - 6, origin.y + 16);

    ctx.restore();
  }

  drawVectors(ctx) {
    ctx.save();

    const legs = ['leg1', 'leg2', 'leg3'];
    legs.forEach((key, idx) => {
      const leg = this.getLegData(key);
      const p1 = this.gridToPixel(leg.start.x, leg.start.y);
      const p2 = this.gridToPixel(leg.end.x, leg.end.y);

      const isInspected = this.activeInspectedLeg === key;
      const isHovered = this.hoveredLeg === idx;

      ctx.strokeStyle = leg.color;
      ctx.lineWidth = isInspected ? 4 : (isHovered ? 4.5 : 2.5);

      if (isInspected || isHovered) {
        ctx.shadowColor = leg.color;
        ctx.shadowBlur = 10;
      } else {
        ctx.shadowBlur = 0;
      }

      this.drawArrow(ctx, p1.x, p1.y, p2.x, p2.y, isInspected ? 14 : 10);
    });

    // Net Resultant Vector (A to D)
    const net = this.getLegData('net');
    const pA = this.gridToPixel(net.start.x, net.start.y);
    const pD = this.gridToPixel(net.end.x, net.end.y);

    const isNetInspected = this.activeInspectedLeg === 'net';
    const isNetHovered = this.hoveredLeg === 'net';

    ctx.strokeStyle = '#f43f5e'; // Rose
    ctx.lineWidth = isNetInspected ? 4.5 : (isNetHovered ? 5 : 2.5);
    ctx.setLineDash([8, 4]);

    if (isNetInspected || isNetHovered) {
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 12;
    } else {
      ctx.shadowBlur = 0;
    }

    this.drawArrow(ctx, pA.x, pA.y, pD.x, pD.y, isNetInspected ? 16 : 12);
    ctx.setLineDash([]);

    ctx.restore();
  }

  // Draw the right triangle components: Δx (horizontal), Δy (vertical), and right-angle box
  drawComponentTriangle(ctx, legKey, isSubtle = false) {
    const leg = this.getLegData(legKey);
    const p1 = this.gridToPixel(leg.start.x, leg.start.y); // (x1, y1)
    const p2 = this.gridToPixel(leg.end.x, leg.end.y);     // (x2, y2)

    // Vertex corner point for right angle: (x2, y1)
    const pCorner = this.gridToPixel(leg.end.x, leg.start.y);

    ctx.save();
    ctx.lineWidth = isSubtle ? 1.5 : 2.5;

    // 1. Horizontal Component (Δx)
    ctx.strokeStyle = isSubtle ? 'rgba(245, 158, 11, 0.4)' : '#f59e0b'; // Amber
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(pCorner.x, pCorner.y);
    ctx.stroke();

    // 2. Vertical Component (Δy)
    ctx.strokeStyle = isSubtle ? 'rgba(6, 182, 212, 0.4)' : '#06b6d4'; // Cyan
    ctx.beginPath();
    ctx.moveTo(pCorner.x, pCorner.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // 3. Right-Angle Symbol ⦜
    const boxSize = 10;
    const signX = leg.dx >= 0 ? -1 : 1;
    const signY = leg.dy >= 0 ? 1 : -1;

    ctx.strokeStyle = 'rgba(90, 70, 50, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(pCorner.x + signX * boxSize, pCorner.y);
    ctx.lineTo(pCorner.x + signX * boxSize, pCorner.y + signY * boxSize);
    ctx.lineTo(pCorner.x, pCorner.y + signY * boxSize);
    ctx.stroke();

    if (!isSubtle) {
      // 4. Component Text Badges
      // Δx badge
      const midX = (p1.x + pCorner.x) / 2;
      const midY = p1.y;
      this.drawPillBadge(
        ctx,
        midX,
        midY + (leg.dy >= 0 ? 14 : -14),
        `Δx = ${leg.dx >= 0 ? '+' : ''}${leg.dx.toFixed(1)} cm`,
        '#78350f',
        '#fef3c7'
      );

      // Δy badge
      const vertMidX = pCorner.x;
      const vertMidY = (pCorner.y + p2.y) / 2;
      this.drawPillBadge(
        ctx,
        vertMidX + (leg.dx >= 0 ? 32 : -32),
        vertMidY,
        `Δy = ${leg.dy >= 0 ? '+' : ''}${leg.dy.toFixed(1)} cm`,
        '#164e63',
        '#cffafe'
      );

      // Hypotenuse magnitude badge
      const hypMidX = (p1.x + p2.x) / 2;
      const hypMidY = (p1.y + p2.y) / 2;
      this.drawPillBadge(
        ctx,
        hypMidX,
        hypMidY - 14,
        `|Δr| = ${leg.magnitudeCm.toFixed(2)} cm`,
        '#064e3b',
        '#d1fae5'
      );
    }

    ctx.restore();
  }

  drawPillBadge(ctx, x, y, text, bgColor, textColor) {
    ctx.save();
    ctx.font = 'bold 10px "JetBrains Mono", monospace';
    const paddingX = 7;
    const paddingY = 3.5;
    const textMetrics = ctx.measureText(text);
    const boxW = textMetrics.width + paddingX * 2;
    const boxH = 18;

    ctx.fillStyle = bgColor;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.roundRect(x - boxW / 2, y - boxH / 2, boxW, boxH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  drawLandmarks(ctx) {
    ctx.save();

    this.landmarks.forEach((lm) => {
      const pos = this.gridToPixel(lm.x, lm.y);

      // Landmark Outer Ring
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = lm.code === 'A' ? '#b91c1c' : (lm.code === 'D' ? '#047857' : '#92400e');
      ctx.fill();
      ctx.strokeStyle = '#fef3c7';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Inner center dot
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      // Label Tag with Coordinate (x, y)
      const coordText = `${lm.code} (${lm.x.toFixed(1)}, ${lm.y.toFixed(1)})`;
      ctx.font = 'bold 11px "JetBrains Mono", monospace';
      const textW = ctx.measureText(coordText).width;

      const tagX = pos.x;
      const tagY = pos.y - 18;

      ctx.fillStyle = 'rgba(20, 15, 10, 0.85)';
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(tagX - textW / 2 - 6, tagY - 8, textW + 12, 18, 5);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fef08a';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(coordText, tagX, tagY);

      // Landmark Subtitle (e.g. Village, Cavern)
      ctx.font = '10px "Cinzel", serif';
      ctx.fillStyle = '#2a1b0e';
      ctx.fillText(lm.name, pos.x, pos.y + 18);
    });

    ctx.restore();
  }

  drawArrow(ctx, fromX, fromY, toX, toY, headLength = 12) {
    const dx = toX - fromX;
    const dy = toY - fromY;
    const angle = Math.atan2(dy, dx);

    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fill();
  }

  drawScaleKey(ctx) {
    ctx.save();
    const scale = this.activeRealm.scaleFactor;
    const unit = this.activeRealm.scaleUnit;
    const barCm = 2.0; // 2 cm bar
    const barPx = barCm * this.pxPerCm;

    const x = 16;
    const y = 20;

    // Background pill
    ctx.fillStyle = 'rgba(20, 14, 8, 0.88)';
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(x, y, barPx + 100, 36, 8);
    ctx.fill();
    ctx.stroke();

    // Scale bar line
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x + 12, y + 18);
    ctx.lineTo(x + 12 + barPx, y + 18);
    ctx.stroke();

    // End caps
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 12, y + 12);
    ctx.lineTo(x + 12, y + 24);
    ctx.moveTo(x + 12 + barPx, y + 12);
    ctx.lineTo(x + 12 + barPx, y + 24);
    ctx.stroke();

    // Text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${barCm.toFixed(1)} cm = ${(barCm * scale).toFixed(1)} ${unit}`, x + 20 + barPx, y + 17);
    ctx.fillStyle = '#d4af37';
    ctx.font = '9px "Outfit", sans-serif';
    ctx.fillText(`Scale: 1.0 cm = ${scale.toFixed(1)} ${unit}`, x + 20 + barPx, y + 28);

    ctx.restore();
  }

  drawCompassRose(ctx) {
    ctx.save();
    const x = this.displayW - 40;
    const y = 40;
    const radius = 22;

    // Outer circle
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();

    // North Needle
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.moveTo(x, y - radius + 2);
    ctx.lineTo(x + 5, y);
    ctx.lineTo(x - 5, y);
    ctx.closePath();
    ctx.fill();

    // South Needle
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.moveTo(x, y + radius - 2);
    ctx.lineTo(x + 5, y);
    ctx.lineTo(x - 5, y);
    ctx.closePath();
    ctx.fill();

    // Direction Letters
    ctx.fillStyle = '#7c2d12';
    ctx.font = 'bold 10px "Cinzel", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('N', x, y - radius - 2);
    ctx.textBaseline = 'top';
    ctx.fillText('S', x, y + radius + 2);
    ctx.textBaseline = 'middle';
    ctx.fillText('E', x + radius + 7, y);
    ctx.fillText('W', x - radius - 7, y);

    ctx.restore();
  }
}

window.VectorMap = VectorMap;
