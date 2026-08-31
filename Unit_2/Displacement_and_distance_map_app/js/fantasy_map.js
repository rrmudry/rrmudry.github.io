/**
 * Fantasy Map Engine - Canvas & SVG Cartography
 * Renders parchment grids, coordinates, terrains, landmarks, and compass rose.
 */
class FantasyMap {
  constructor(canvasId, svgOverlayId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.svg = document.getElementById(svgOverlayId);

    // Scale calibration: 40 canvas pixels = 1.0 paper cm
    this.pxPerCm = 40;
    this.currentRealmKey = 'dragon_pass';
    this.scaleFactor = 10.0; // 1.0 cm = 10.0 leagues
    this.scaleUnit = 'leagues';

    // Realms Definition
    this.realms = {
      dragon_pass: {
        name: "The Dragon's Fang Pass",
        theme: "alpine",
        scaleFactor: 10.0,
        unit: "leagues",
        originPixel: { x: 120, y: 480 }, // Grid Origin (0,0) in canvas px
        landmarks: [
          { id: 'A', name: 'Oakhaven Village', type: 'village', icon: '🏡', gridX: 0, gridY: 0, desc: 'The starting home village and reference origin.' },
          { id: 'B', name: 'Misty Bog Obstacle', type: 'swamp', icon: '🌲', gridX: 6.0, gridY: -4.5, desc: 'A perilous swamp with treacherous sinkholes.' },
          { id: 'C', name: 'High Crag Pass', type: 'mountain', icon: '🏔️', gridX: 13.5, gridY: -8.0, desc: 'A narrow, snow-swept mountain waypoint.' },
          { id: 'D', name: "Dragon's Volcanic Lair", type: 'citadel', icon: '🌋', gridX: 19.5, gridY: -3.5, desc: 'The final destination holding the ancient relic.' }
        ],
        // Control points defining bezier curves for each leg
        trailLegs: [
          // Leg 1: A -> B (winding through hills)
          {
            start: 'A', end: 'B',
            points: [
              { dx: 0, dy: 0 },
              { dx: 1.5, dy: -2.0 },
              { dx: 2.5, dy: 0.5 },
              { dx: 4.2, dy: -2.5 },
              { dx: 4.8, dy: -5.5 },
              { dx: 6.0, dy: -4.5 }
            ]
          },
          // Leg 2: B -> C (climbing switchbacks)
          {
            start: 'B', end: 'C',
            points: [
              { dx: 6.0, dy: -4.5 },
              { dx: 7.2, dy: -2.8 },
              { dx: 9.0, dy: -5.0 },
              { dx: 8.5, dy: -7.5 },
              { dx: 11.2, dy: -6.5 },
              { dx: 13.5, dy: -8.0 }
            ]
          },
          // Leg 3: C -> D (canyon descent)
          {
            start: 'C', end: 'D',
            points: [
              { dx: 13.5, dy: -8.0 },
              { dx: 15.0, dy: -10.0 },
              { dx: 17.0, dy: -7.5 },
              { dx: 16.2, dy: -4.5 },
              { dx: 18.2, dy: -5.5 },
              { dx: 19.5, dy: -3.5 }
            ]
          }
        ]
      },
      swamp_citadel: {
        name: "The Sunken Bayou & Citadel",
        theme: "swamp",
        scaleFactor: 12.5,
        unit: "leagues",
        originPixel: { x: 120, y: 460 },
        landmarks: [
          { id: 'A', name: "Fisherman's Harbor", type: 'village', icon: '⛵', gridX: 0, gridY: 0, desc: 'Quiet fishing village and quest origin.' },
          { id: 'B', name: 'Whispering Mangrove', type: 'forest', icon: '🌿', gridX: 7.0, gridY: -3.0, desc: 'Impassable vines forcing winding detours.' },
          { id: 'C', name: "Sunken Watchtower", type: 'tower', icon: '🏰', gridX: 12.0, gridY: -9.0, desc: 'Ancient submerged elven tower.' },
          { id: 'D', name: "Citadel of Shadows", type: 'citadel', icon: '🏛️', gridX: 18.5, gridY: -5.0, desc: 'The fortified keep guarding the crown.' }
        ],
        trailLegs: [
          {
            start: 'A', end: 'B',
            points: [
              { dx: 0, dy: 0 },
              { dx: 2.0, dy: -1.5 },
              { dx: 3.5, dy: 1.0 },
              { dx: 5.5, dy: -1.0 },
              { dx: 7.0, dy: -3.0 }
            ]
          },
          {
            start: 'B', end: 'C',
            points: [
              { dx: 7.0, dy: -3.0 },
              { dx: 6.5, dy: -6.0 },
              { dx: 9.5, dy: -6.5 },
              { dx: 9.0, dy: -9.5 },
              { dx: 12.0, dy: -9.0 }
            ]
          },
          {
            start: 'C', end: 'D',
            points: [
              { dx: 12.0, dy: -9.0 },
              { dx: 14.5, dy: -7.0 },
              { dx: 16.0, dy: -8.5 },
              { dx: 16.8, dy: -3.5 },
              { dx: 18.5, dy: -5.0 }
            ]
          }
        ]
      },
      eldoria_isles: {
        name: "The Coast of Eldoria",
        theme: "coastal",
        scaleFactor: 8.0,
        unit: "leagues",
        originPixel: { x: 120, y: 500 },
        landmarks: [
          { id: 'A', name: "Port Pelican", type: 'village', icon: '⚓', gridX: 0, gridY: 0, desc: 'Bustling port city origin.' },
          { id: 'B', name: "Serpent's Cove", type: 'cove', icon: '🌊', gridX: 5.5, gridY: -5.5, desc: 'Treacherous rocky coastal bay.' },
          { id: 'C', name: "Gryphon Lighthouse", type: 'tower', icon: '🗼', gridX: 12.5, gridY: -7.0, desc: 'Lighthouse towering over jagged shoals.' },
          { id: 'D', name: "Forbidden Shrine", type: 'citadel', icon: '✨', gridX: 19.0, gridY: -2.0, desc: 'Gleaming stone shrine on the cliff edge.' }
        ],
        trailLegs: [
          {
            start: 'A', end: 'B',
            points: [
              { dx: 0, dy: 0 },
              { dx: 1.5, dy: -3.5 },
              { dx: 3.5, dy: -2.0 },
              { dx: 4.2, dy: -6.5 },
              { dx: 5.5, dy: -5.5 }
            ]
          },
          {
            start: 'B', end: 'C',
            points: [
              { dx: 5.5, dy: -5.5 },
              { dx: 7.5, dy: -4.0 },
              { dx: 9.0, dy: -8.0 },
              { dx: 11.0, dy: -5.5 },
              { dx: 12.5, dy: -7.0 }
            ]
          },
          {
            start: 'C', end: 'D',
            points: [
              { dx: 12.5, dy: -7.0 },
              { dx: 14.0, dy: -9.0 },
              { dx: 16.5, dy: -6.0 },
              { dx: 17.5, dy: -4.0 },
              { dx: 19.0, dy: -2.0 }
            ]
          }
        ]
      }
    };

    // Active realm state
    this.activeRealm = this.realms[this.currentRealmKey];
    this.showGrid = true;
    this.showCoordinates = true;
    this.showTerrainDecor = true;
    this.showCompass = true;

    // Hover state for interactive leg buttons (0, 1, 2, 'disp', or -1)
    this.hoveredLeg = -1;

    // Initialize user seed (deterministic per user or guest)
    this.userSeed = this.getInitialUserSeed();
    this.applyUserPath();

    // Resizing & Initialization
    this.initCanvasSize();
    window.addEventListener('resize', () => {
      this.initCanvasSize();
      this.render();
    });
  }

  // Generate unique randomized seed for every session/student
  getInitialUserSeed() {
    // Generate a fresh random seed on every session so no two visits/students share the same initial map
    const newSeed = Math.floor(Math.random() * 9000000) + 100000;
    try {
      sessionStorage.setItem('fantasy_map_session_seed', newSeed.toString());
      localStorage.setItem('fantasy_map_user_seed', newSeed.toString());
    } catch (e) {}
    return newSeed;
  }

  // Set seed based on authenticated student ID (e.g. s123456@orangeusd.org)
  setUserSeedFromId(studentId) {
    let hash = 0;
    const str = String(studentId || "adventurer");
    for (let i = 0; i < str.length; i++) {
      hash = Math.imul(31, hash) + str.charCodeAt(i) | 0;
    }
    this.userSeed = Math.abs(hash) || 42;
    try {
      localStorage.setItem('fantasy_map_user_seed', this.userSeed.toString());
    } catch (e) {}
    this.applyUserPath();
    this.render();
  }

  // Generate completely new random path on demand
  generateNewRandomPath() {
    this.userSeed = Math.floor(Math.random() * 9000000) + 100000;
    try {
      sessionStorage.setItem('fantasy_map_session_seed', this.userSeed.toString());
      localStorage.setItem('fantasy_map_user_seed', this.userSeed.toString());
    } catch (e) {}
    this.applyUserPath();
    this.render();
  }

  // Mulberry32 pseudo-random number generator
  createRng(seed) {
    let s = seed >>> 0;
    return function() {
      let t = s += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  // Procedurally generate landmark positions and 5-15 cm winding spline trails
  applyUserPath() {
    const rng = this.createRng(this.userSeed);

    // Apply procedural variations across all realms
    Object.keys(this.realms).forEach((realmKey, realmIdx) => {
      const realm = this.realms[realmKey];
      // Seed offset per realm so switching realms maintains distinctive geography
      const realmRng = this.createRng(this.userSeed + realmIdx * 7777);

      // Landmark A is ALWAYS Origin (0, 0)
      const pA = { id: 'A', gridX: 0, gridY: 0 };

      // Landmark B: gridX in [4.5, 7.5], gridY in [-2.0, -5.5]
      const bX = parseFloat((4.5 + realmRng() * 2.8).toFixed(1));
      const bY = -parseFloat((2.0 + realmRng() * 3.5).toFixed(1));
      const pB = { id: 'B', gridX: bX, gridY: bY };

      // Landmark C: gridX in [10.5, 14.5], gridY in [-5.5, -9.5]
      const cX = parseFloat((10.5 + realmRng() * 3.2).toFixed(1));
      const cY = -parseFloat((5.5 + realmRng() * 3.8).toFixed(1));
      const pC = { id: 'C', gridX: cX, gridY: cY };

      // Landmark D: gridX in [16.8, 19.5], gridY in [-1.5, -5.5]
      const dX = parseFloat((16.8 + realmRng() * 2.7).toFixed(1));
      const dY = -parseFloat((1.5 + realmRng() * 4.0).toFixed(1));
      const pD = { id: 'D', gridX: dX, gridY: dY };

      realm.landmarks[0].gridX = pA.gridX;
      realm.landmarks[0].gridY = pA.gridY;
      realm.landmarks[1].gridX = pB.gridX;
      realm.landmarks[1].gridY = pB.gridY;
      realm.landmarks[2].gridX = pC.gridX;
      realm.landmarks[2].gridY = pC.gridY;
      realm.landmarks[3].gridX = pD.gridX;
      realm.landmarks[3].gridY = pD.gridY;

      // Assign distinct target length bands across the 3 legs to guarantee genuine variety across 5-15 cm:
      // Shuffle target bands so any leg can be the short, medium, or long leg!
      const targetBands = [
        5.5 + realmRng() * 2.8,   // Short band: ~5.5 - 8.3 cm
        8.5 + realmRng() * 2.8,   // Medium band: ~8.5 - 11.3 cm
        11.5 + realmRng() * 3.0   // Long winding band: ~11.5 - 14.5 cm
      ];
      // Fisher-Yates shuffle with realm RNG
      for (let s = targetBands.length - 1; s > 0; s--) {
        const j = Math.floor(realmRng() * (s + 1));
        [targetBands[s], targetBands[j]] = [targetBands[j], targetBands[s]];
      }

      // Generate trails closely matching each targeted length
      const leg1 = this.generateTargetedLeg({ dx: pA.gridX, dy: pA.gridY }, { dx: pB.gridX, dy: pB.gridY }, realmRng, targetBands[0]);
      const leg2 = this.generateTargetedLeg({ dx: pB.gridX, dy: pB.gridY }, { dx: pC.gridX, dy: pC.gridY }, realmRng, targetBands[1]);
      const leg3 = this.generateTargetedLeg({ dx: pC.gridX, dy: pC.gridY }, { dx: pD.gridX, dy: pD.gridY }, realmRng, targetBands[2]);

      realm.trailLegs = [
        { start: 'A', end: 'B', points: leg1.points },
        { start: 'B', end: 'C', points: leg2.points },
        { start: 'C', end: 'D', points: leg3.points }
      ];
    });
  }

  // Generate a meandering leg targeted to a specific distance in [5.0, 15.0] cm
  generateTargetedLeg(startPt, endPt, rng, desiredTarget) {
    const directDist = Math.hypot(endPt.dx - startPt.dx, endPt.dy - startPt.dy);
    // Target length cannot be shorter than the straight-line Euclidean distance
    const targetLength = Math.max(directDist + 0.3, Math.min(14.6, desiredTarget));

    // Choose number of bends according to desired curve ratio
    const curveRatio = targetLength / (directDist || 1);
    const numMid = curveRatio < 1.25 ? 1 : (curveRatio < 1.55 ? 2 : 3);

    let bestPoints = null;
    let bestDiff = 999;

    const chordDx = endPt.dx - startPt.dx;
    const chordDy = endPt.dy - startPt.dy;
    const normX = -chordDy / (directDist || 1);
    const normY = chordDx / (directDist || 1);

    // Amplitude scale derived from Pythagorean excess
    const excess = Math.max(0, targetLength * targetLength - directDist * directDist);
    const baseMeanderScale = Math.sqrt(excess) / (numMid + 1);

    for (let attempt = 0; attempt < 80; attempt++) {
      const points = [{ dx: startPt.dx, dy: startPt.dy }];
      const attemptScale = baseMeanderScale * (0.65 + rng() * 0.7);

      for (let m = 1; m <= numMid; m++) {
        const frac = m / (numMid + 1);
        const baseX = startPt.dx + chordDx * frac;
        const baseY = startPt.dy + chordDy * frac;

        // Alternating side meanders
        const sign = (m % 2 === 1) ? 1 : -1;
        const meander = sign * attemptScale * (0.8 + rng() * 0.4);
        const jitterAlong = (rng() - 0.5) * 0.5;

        let mx = baseX + normX * meander + (chordDx / directDist) * jitterAlong;
        let my = baseY + normY * meander + (chordDy / directDist) * jitterAlong;

        // Bounding safety
        mx = Math.max(0.2, Math.min(19.4, mx));
        my = Math.max(-9.8, Math.min(0.8, my));

        points.push({ dx: parseFloat(mx.toFixed(2)), dy: parseFloat(my.toFixed(2)) });
      }
      points.push({ dx: endPt.dx, dy: endPt.dy });

      const len = this.calcSampledPointsLength(points);
      const diff = Math.abs(len - targetLength);

      if (diff < bestDiff) {
        bestDiff = diff;
        bestPoints = points;
        if (diff < 0.25) break; // Close enough to target
      }
    }

    // Safety check: ensure strict bounds [5.0, 15.0]
    let finalLen = this.calcSampledPointsLength(bestPoints);
    if (finalLen > 15.0 || finalLen < 5.0) {
      // Direct midpoint arch fallback
      const midX = (startPt.dx + endPt.dx) / 2 + normX * 1.5;
      const midY = (startPt.dy + endPt.dy) / 2 + normY * 1.5;
      bestPoints = [
        startPt,
        { dx: parseFloat(midX.toFixed(2)), dy: parseFloat(midY.toFixed(2)) },
        endPt
      ];
      finalLen = this.calcSampledPointsLength(bestPoints);
    }

    return { points: bestPoints, len: finalLen };
  }

  // Internal helper to compute spline length from raw control points
  calcSampledPointsLength(pts) {
    let len = 0;
    let prev = null;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(pts.length - 1, i + 2)];
      for (let t = 0; t <= 1; t += 1 / 30) {
        if (i > 0 && t === 0) continue;
        const cx = this.catmullRom(p0.dx, p1.dx, p2.dx, p3.dx, t);
        const cy = this.catmullRom(p0.dy, p1.dy, p2.dy, p3.dy, t);
        if (prev) {
          len += Math.hypot(cx - prev.x, cy - prev.y);
        }
        prev = { x: cx, y: cy };
      }
    }
    return len;
  }

  // Set hovered leg for interactive mouseover highlights (0, 1, 2, 'disp', or -1)
  setHoveredLeg(legIndex) {
    if (this.hoveredLeg !== legIndex) {
      this.hoveredLeg = legIndex;
      this.render();
    }
  }

  initCanvasSize() {
    const container = this.canvas.parentElement;
    const width = container.clientWidth || 960;

    // Full coordinate bounds across all realms (in cm):
    // X span: 0 cm (Origin A) to 19.5 cm (Landmark D)
    // Y span: -10.2 cm (North mountains) to +1.0 cm (South loop)
    const maxGridXCm = 19.5;
    const maxNorthCm = 10.2;
    const maxSouthCm = 1.0;
    const totalGridHeightCm = maxNorthCm + maxSouthCm; // 11.2 cm

    // Responsive padding margins:
    // Left margin accommodates Landmark A badge, "(0,0) ORIGIN" text, and Y-axis tick marks
    const leftMargin = width < 640 ? 58 : 78;
    // Right margin accommodates Landmark D badge and wide text label "Dragon's Volcanic Lair"
    const rightMargin = width < 640 ? 68 : 88;
    // Top margin accommodates mountain peaks, trail loops, and compass rose
    const topMargin = width < 640 ? 46 : 56;
    // Bottom margin accommodates X-axis numbers and the unrolled measuring ruler
    const bottomMargin = width < 640 ? 64 : 74;

    // Compute pxPerCm so all 19.5 cm fit cleanly within the available width with full right margin
    const availableWidth = Math.max(260, width - leftMargin - rightMargin);
    this.pxPerCm = availableWidth / maxGridXCm;

    // Calculate canvas display height based on vertical grid span plus top and bottom margins
    const computedHeight = Math.round(totalGridHeightCm * this.pxPerCm + topMargin + bottomMargin);
    const height = Math.max(340, Math.min(computedHeight, 720));

    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.round(width * dpr);
    this.canvas.height = Math.round(height * dpr);
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;

    if (this.ctx.resetTransform) {
      this.ctx.resetTransform();
    } else {
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    this.ctx.scale(dpr, dpr);

    this.displayW = width;
    this.displayH = height;

    // Set Origin (0,0) pixel location
    // Origin Y is placed so +maxSouthCm fits above bottomMargin, and -maxNorthCm fits below topMargin
    const realm = this.activeRealm;
    realm.originPixel.x = leftMargin;
    realm.originPixel.y = Math.round(height - bottomMargin - (maxSouthCm * this.pxPerCm));
  }

  setRealm(realmKey, forceNewRandom = true) {
    if (!this.realms[realmKey]) return;
    this.currentRealmKey = realmKey;
    this.activeRealm = this.realms[realmKey];
    this.scaleFactor = this.activeRealm.scaleFactor;
    this.scaleUnit = this.activeRealm.unit;

    // Generate a fresh unique randomized path whenever a realm is selected
    if (forceNewRandom) {
      this.userSeed = Math.floor(Math.random() * 9000000) + 100000;
      try {
        sessionStorage.setItem('fantasy_map_session_seed', this.userSeed.toString());
        localStorage.setItem('fantasy_map_user_seed', this.userSeed.toString());
      } catch (e) {}
      this.applyUserPath();
    }

    this.initCanvasSize();
    this.render();
    if (window.soundFX) window.soundFX.playParchment();
  }

  // Convert Grid (cm) to Canvas Pixels
  gridToPixel(cmX, cmY) {
    const origin = this.activeRealm.originPixel;
    return {
      x: origin.x + cmX * this.pxPerCm,
      y: origin.y + cmY * this.pxPerCm // Negative cmY moves UP north!
    };
  }

  // Convert Canvas Pixels to Grid (cm)
  pixelToGrid(pxX, pxY) {
    const origin = this.activeRealm.originPixel;
    return {
      x: (pxX - origin.x) / this.pxPerCm,
      y: (pxY - origin.y) / this.pxPerCm
    };
  }

  // Get full polyline sampled points along all trail legs
  getSampledTrailPoints(legIndex = -1, samplesPerSegment = 40) {
    const points = [];
    const legs = legIndex === -1 
      ? this.activeRealm.trailLegs 
      : [this.activeRealm.trailLegs[legIndex]];

    legs.forEach(leg => {
      const pts = leg.points;
      if (pts.length < 2) return;

      // Fit Catmull-Rom or Cardinal spline through points
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[Math.max(0, i - 1)];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = pts[Math.min(pts.length - 1, i + 2)];

        for (let t = 0; t <= 1; t += 1 / samplesPerSegment) {
          if (i > 0 && t === 0) continue; // Avoid duplicate consecutive points
          const px = this.catmullRom(p0.dx, p1.dx, p2.dx, p3.dx, t);
          const py = this.catmullRom(p0.dy, p1.dy, p2.dy, p3.dy, t);
          points.push({ cmX: px, cmY: py });
        }
      }
    });

    return points;
  }

  catmullRom(p0, p1, p2, p3, t) {
    const v0 = (p2 - p0) * 0.5;
    const v1 = (p3 - p1) * 0.5;
    const t2 = t * t;
    const t3 = t * t2;
    return (2 * p1 - 2 * p2 + v0 + v1) * t3 +
           (-3 * p1 + 3 * p2 - 2 * v0 - v1) * t2 +
           v0 * t + p1;
  }

  // Calculate actual curved path length in paper cm for a specific leg (0, 1, 2) or all (-1)
  calculatePathLengthCm(legIndex = -1) {
    const pts = this.getSampledTrailPoints(legIndex, 60);
    let totalLength = 0;
    for (let i = 1; i < pts.length; i++) {
      const dx = pts[i].cmX - pts[i - 1].cmX;
      const dy = pts[i].cmY - pts[i - 1].cmY;
      totalLength += Math.hypot(dx, dy);
    }
    return totalLength;
  }

  // Calculate net displacement vector from Origin A to any landmark (default Landmark D)
  calculateDisplacementVector(targetLandmarkId = 'D') {
    const originLandmark = this.activeRealm.landmarks[0]; // A
    const targetLandmark = this.activeRealm.landmarks.find(l => l.id === targetLandmarkId) || this.activeRealm.landmarks[3];

    // Grid coordinates (cm)
    const deltaX = targetLandmark.gridX - originLandmark.gridX; // East(+) / West(-)
    const deltaY = -(targetLandmark.gridY - originLandmark.gridY); // Convert screen Y to Cartesian Y (North is +)

    const magnitudeCm = Math.hypot(deltaX, deltaY);
    const magnitudeRealm = magnitudeCm * this.scaleFactor;

    // Angle in degrees from East (counter-clockwise)
    let angleRad = Math.atan2(deltaY, deltaX);
    let angleDeg = (angleRad * 180 / Math.PI);
    if (angleDeg < 0) angleDeg += 360;

    // Compass direction description
    let directionStr = "";
    if (Math.abs(deltaY) < 0.1) {
      directionStr = deltaX >= 0 ? "Directly East" : "Directly West";
    } else if (Math.abs(deltaX) < 0.1) {
      directionStr = deltaY >= 0 ? "Directly North" : "Directly South";
    } else {
      const cardinalY = deltaY > 0 ? "North" : "South";
      const cardinalX = deltaX > 0 ? "East" : "West";
      const acuteAngle = Math.abs(Math.atan2(deltaY, deltaX) * 180 / Math.PI);
      const angleFormatted = (acuteAngle > 90 ? 180 - acuteAngle : acuteAngle).toFixed(1);
      directionStr = `${angleFormatted}° ${cardinalY} of ${cardinalX}`;
    }

    return {
      deltaX,
      deltaY,
      magnitudeCm,
      magnitudeRealm,
      angleDeg,
      directionStr,
      origin: originLandmark,
      target: targetLandmark
    };
  }

  // Master Render Method
  render() {
    const ctx = this.ctx;
    const w = this.displayW;
    const h = this.displayH;
    ctx.clearRect(0, 0, w, h);

    this.drawTerrainBase(ctx, w, h);
    if (this.showGrid) this.drawCoordinateGrid(ctx, w, h);
    if (this.showTerrainDecor) this.drawTerrainDecorations(ctx);
    this.drawWindingTrails(ctx);
    this.drawLandmarks(ctx);
    if (this.showCompass) this.drawCompassRose(ctx);
    this.drawMapScaleKey(ctx);
  }

  // Draw antique parchment background texture details
  drawTerrainBase(ctx, w, h) {
    // Soft topographic contour lines
    ctx.save();
    ctx.strokeStyle = 'rgba(120, 80, 40, 0.08)';
    ctx.lineWidth = 1.5;
    for (let r = 80; r < w; r += 90) {
      ctx.beginPath();
      ctx.ellipse(w * 0.5, h * 0.45, r, r * 0.55, 0.1, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Draw calibrated 1.0 cm grid lines
  drawCoordinateGrid(ctx, w, h) {
    const origin = this.activeRealm.originPixel;
    const px = this.pxPerCm;

    ctx.save();
    ctx.lineWidth = 1;

    // Sub-grid lines (light tan)
    ctx.strokeStyle = 'rgba(100, 70, 40, 0.18)';
    
    // Vertical grid lines
    for (let x = origin.x % px; x < w; x += px) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    // Horizontal grid lines
    for (let y = origin.y % px; y < h; y += px) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Highlight Origin Axes (0,0) with bolder crimson line
    ctx.strokeStyle = 'rgba(158, 42, 43, 0.55)';
    ctx.lineWidth = 2;

    // X-Axis (East/West)
    ctx.beginPath();
    ctx.moveTo(0, origin.y);
    ctx.lineTo(w, origin.y);
    ctx.stroke();

    // Y-Axis (North/South)
    ctx.beginPath();
    ctx.moveTo(origin.x, 0);
    ctx.lineTo(origin.x, h);
    ctx.stroke();

    // Grid Numbers in cm along axes
    if (this.showCoordinates) {
      ctx.fillStyle = 'rgba(70, 45, 20, 0.85)';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      // X-Axis numbers (East/West) - Start from 2 cm so 0 cm doesn't collide with Landmark A (0,0) origin
      for (let cm = 2; cm <= 24; cm += 2) {
        const posX = origin.x + cm * px;
        if (posX > 0 && posX < w) {
          ctx.fillText(`${cm} cm`, posX, origin.y + 4);
        }
      }

      // Y-Axis numbers (North/South) - inverted because up is North (+)
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      for (let cm = 2; cm <= 14; cm += 2) {
        const posY = origin.y - cm * px;
        if (posY > 0 && posY < h) {
          ctx.fillText(`+${cm}`, origin.x - 8, posY);
        }
      }

      // Origin Tag (neatly tucked to the bottom-left of origin)
      ctx.fillStyle = '#9e2a2b';
      ctx.font = 'bold 10px "Cinzel", serif';
      ctx.textAlign = 'right';
      ctx.fillText('(0, 0) Origin', origin.x - 10, origin.y + 16);
    }

    ctx.restore();
  }

  // Draw hand-drawn fantasy terrain features (trees, mountain ridges, bogs)
  drawTerrainDecorations(ctx) {
    const origin = this.activeRealm.originPixel;
    const px = this.pxPerCm;

    ctx.save();
    ctx.font = '18px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Mountain Range between B and C
    const mountainCoords = [
      { x: origin.x + 8.5 * px, y: origin.y - 7.0 * px },
      { x: origin.x + 10.0 * px, y: origin.y - 8.5 * px },
      { x: origin.x + 11.5 * px, y: origin.y - 9.5 * px },
      { x: origin.x + 14.5 * px, y: origin.y - 10.5 * px }
    ];
    mountainCoords.forEach(m => {
      ctx.fillText('⛰️', m.x, m.y);
    });

    // Forest clusters
    const forestCoords = [
      { x: origin.x + 3.0 * px, y: origin.y - 1.5 * px },
      { x: origin.x + 4.5 * px, y: origin.y - 3.0 * px },
      { x: origin.x + 7.5 * px, y: origin.y - 1.5 * px },
      { x: origin.x + 16.5 * px, y: origin.y - 2.5 * px }
    ];
    forestCoords.forEach(f => {
      ctx.fillText('🌲', f.x, f.y);
    });

    // Winding River
    ctx.strokeStyle = 'rgba(40, 100, 160, 0.35)';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(origin.x + 4 * px, 0);
    ctx.bezierCurveTo(origin.x + 6 * px, origin.y - 6 * px, origin.x + 2 * px, origin.y - 2 * px, origin.x + 5 * px, this.displayH);
    ctx.stroke();

    ctx.restore();
  }

  // Draw the meandering dashed traveler trail (with glowing highlights on hover)
  drawWindingTrails(ctx) {
    const pts = this.getSampledTrailPoints(-1, 50);
    if (pts.length < 2) return;

    ctx.save();

    // Soft glow shadow under base trail
    ctx.strokeStyle = 'rgba(70, 40, 10, 0.2)';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    const pStart = this.gridToPixel(pts[0].cmX, pts[0].cmY);
    ctx.moveTo(pStart.x, pStart.y);
    for (let i = 1; i < pts.length; i++) {
      const p = this.gridToPixel(pts[i].cmX, pts[i].cmY);
      ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();

    // Dotted / Dashed traveler trail
    ctx.strokeStyle = '#6b3e18';
    ctx.lineWidth = 3;
    ctx.setLineDash([7, 6]);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Hover Leg Highlight Halo
    if (typeof this.hoveredLeg === 'number' && this.hoveredLeg >= 0 && this.hoveredLeg <= 2) {
      const legPts = this.getSampledTrailPoints(this.hoveredLeg, 50);
      if (legPts.length >= 2) {
        ctx.save();
        ctx.setLineDash([]);
        // Golden outer glow
        ctx.strokeStyle = 'rgba(250, 204, 21, 0.85)';
        ctx.shadowColor = '#eab308';
        ctx.shadowBlur = 14;
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        const lp0 = this.gridToPixel(legPts[0].cmX, legPts[0].cmY);
        ctx.moveTo(lp0.x, lp0.y);
        for (let i = 1; i < legPts.length; i++) {
          const lp = this.gridToPixel(legPts[i].cmX, legPts[i].cmY);
          ctx.lineTo(lp.x, lp.y);
        }
        ctx.stroke();

        // Bright white-gold core line
        ctx.strokeStyle = '#fffbeb';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.restore();
      }
    } else if (this.hoveredLeg === 'disp') {
      // If hovering over Direct Vector button, show a gentle crimson guide dashed line
      const pA = this.gridToPixel(0, 0);
      const target = this.activeRealm.landmarks[3];
      const pD = this.gridToPixel(target.gridX, target.gridY);
      ctx.save();
      ctx.strokeStyle = 'rgba(244, 63, 94, 0.8)';
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 10;
      ctx.lineWidth = 3.5;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.moveTo(pA.x, pA.y);
      ctx.lineTo(pD.x, pD.y);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }

  // Draw the 4 Required Quest Landmarks A, B, C, D
  drawLandmarks(ctx) {
    const landmarks = this.activeRealm.landmarks;

    ctx.save();
    landmarks.forEach((lm) => {
      const pos = this.gridToPixel(lm.gridX, lm.gridY);
      const isStart = lm.id === 'A';
      const isEnd = lm.id === 'D';

      if (isStart) {
        // High-visibility START beacon: dual emerald glowing aura rings
        const pulseTime = Date.now() / 600;
        const pulseR = 24 + Math.sin(pulseTime) * 4;
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.7)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, pulseR, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(52, 211, 153, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, pulseR + 6, 0, Math.PI * 2);
        ctx.stroke();

        // Pulsing emerald "START HERE (0,0)" banner tag above
        ctx.save();
        ctx.fillStyle = '#064e3b';
        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 1.5;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 4;
        const tagW = 128;
        const tagH = 18;
        const tagX = pos.x - tagW / 2;
        const tagY = pos.y - 58;
        ctx.beginPath();
        ctx.roundRect(tagX, tagY, tagW, tagH, 5);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#6ee7b7';
        ctx.font = 'bold 9px "Cinzel", serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🚩 START HERE (0,0)', pos.x, tagY + tagH / 2);
        ctx.restore();
      } else if (isEnd) {
        // Subtle crimson beacon for Landmark D (Destination)
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 22, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Gold parchment badge backing
      ctx.fillStyle = isStart ? '#ecfdf5' : '#fbf3d5';
      ctx.strokeStyle = isStart ? '#059669' : (isEnd ? '#dc2626' : '#7c5025');
      ctx.lineWidth = isStart ? 3.0 : 2.5;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Landmark Letter Badge (A, B, C, D)
      ctx.fillStyle = isStart ? '#047857' : (isEnd ? '#991b1b' : '#9e2a2b');
      ctx.font = 'bold 14px "Cinzel", serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(lm.id, pos.x, pos.y);

      // Landmark Name Banner with parchment pill backing for crisp readability
      const nameText = lm.name;
      ctx.font = isStart ? 'bold 11.5px "Cinzel", serif' : 'bold 11px "Cinzel", serif';
      const nameMetrics = ctx.measureText(nameText);
      const nameY = pos.y - (isStart ? 30 : 24);
      
      ctx.fillStyle = 'rgba(251, 243, 213, 0.88)';
      ctx.fillRect(pos.x - nameMetrics.width / 2 - 4, nameY - 7, nameMetrics.width + 8, 14);
      
      ctx.fillStyle = isStart ? '#064e3b' : '#2a1b0e';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(nameText, pos.x, nameY);

      // Coordinates Banner with parchment pill backing
      const coordText = `(${lm.gridX.toFixed(1)}, ${(-lm.gridY).toFixed(1)}) cm`;
      ctx.font = '9px "JetBrains Mono", monospace';
      const coordMetrics = ctx.measureText(coordText);
      const coordY = pos.y + (isStart ? 28 : 25);
      
      ctx.fillStyle = 'rgba(251, 243, 213, 0.88)';
      ctx.fillRect(pos.x - coordMetrics.width / 2 - 3, coordY - 6, coordMetrics.width + 6, 12);

      ctx.fillStyle = isStart ? '#047857' : '#5a4632';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(coordText, pos.x, coordY);
    });

    ctx.restore();
  }

  // Draw vintage Compass Rose in upper right
  drawCompassRose(ctx) {
    const cx = Math.max(120, this.displayW - 65);
    const cy = 60;
    const r = 32;

    ctx.save();
    ctx.translate(cx, cy);

    // Outer Compass Ring
    ctx.strokeStyle = '#7c5025';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(124, 80, 37, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, r - 5, 0, Math.PI * 2);
    ctx.stroke();

    // North Needle (Crimson)
    ctx.fillStyle = '#9e2a2b';
    ctx.beginPath();
    ctx.moveTo(0, -r + 3);
    ctx.lineTo(6, 0);
    ctx.lineTo(-6, 0);
    ctx.closePath();
    ctx.fill();

    // South Needle (Faded Tan)
    ctx.fillStyle = '#c5a368';
    ctx.beginPath();
    ctx.moveTo(0, r - 3);
    ctx.lineTo(6, 0);
    ctx.lineTo(-6, 0);
    ctx.closePath();
    ctx.fill();

    // East / West points
    ctx.fillStyle = '#8f6738';
    ctx.beginPath();
    ctx.moveTo(r - 3, 0);
    ctx.lineTo(0, -5);
    ctx.lineTo(0, 5);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-r + 3, 0);
    ctx.lineTo(0, -5);
    ctx.lineTo(0, 5);
    ctx.closePath();
    ctx.fill();

    // Labels N, S, E, W
    ctx.fillStyle = '#2a1b0e';
    ctx.font = 'bold 10px "Cinzel", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('N', 0, -r - 8);
    ctx.fillText('S', 0, r + 8);
    ctx.fillText('E', r + 9, 0);
    ctx.fillText('W', -r - 9, 0);

    ctx.restore();
  }

  // Draw Map Scale conversion key in top-left corner (unobstructed by measuring tools)
  drawMapScaleKey(ctx) {
    const x = 18;
    const y = 32;
    const barLengthCm = 2.0;
    const barLengthPx = Math.round(barLengthCm * this.pxPerCm);
    const realmUnits = barLengthCm * this.scaleFactor;
    const totalPlaqueW = Math.max(160, barLengthPx + 130);

    ctx.save();
    // Scale Bar Background Plaque
    ctx.fillStyle = 'rgba(251, 243, 213, 0.92)';
    ctx.strokeStyle = '#7c5025';
    ctx.lineWidth = 1.5;
    ctx.fillRect(x, y - 18, totalPlaqueW, 32);
    ctx.strokeRect(x, y - 18, totalPlaqueW, 32);

    // Alternating Black & White scale segments
    const half = barLengthPx / 2;
    ctx.fillStyle = '#2a1b0e';
    ctx.fillRect(x + 6, y - 4, half, 7);
    ctx.fillStyle = '#fff';
    ctx.fillRect(x + 6 + half, y - 4, half, 7);
    ctx.strokeRect(x + 6, y - 4, barLengthPx, 7);

    // Scale Text Legend
    ctx.fillStyle = '#2a1b0e';
    ctx.font = 'bold 9.5px "Cinzel", serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`1.0 cm = ${this.scaleFactor.toFixed(1)} ${this.scaleUnit}`, x + barLengthPx + 14, y - 3);

    ctx.font = '8.5px "JetBrains Mono", monospace';
    ctx.fillStyle = '#5a4632';
    ctx.fillText(`(Bar = ${realmUnits.toFixed(0)} ${this.scaleUnit})`, x + barLengthPx + 14, y + 7);

    ctx.restore();
  }
}

window.FantasyMap = FantasyMap;
