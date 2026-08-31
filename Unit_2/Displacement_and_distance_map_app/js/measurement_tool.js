/**
 * MeasurementTool - Virtual String Unroller, Metric Ruler & Displacement Vector
 * Implements the digital string method used in the classroom inquiry project.
 */
class MeasurementTool {
  constructor(mapInstance, travelerInstance) {
    this.map = mapInstance;
    this.traveler = travelerInstance;

    // Measurement States
    this.activeMode = 'none'; // 'none', 'string_leg1', 'string_leg2', 'string_leg3', 'string_all', 'displacement', 'homecoming'
    this.stringUnrollProgress = 0; // 0 (curved along trail) to 1 (straightened on ruler)
    this.isUnrolling = false;

    // Displacement Vector overlay controls
    this.showVectorArrow = false;
    this.showVectorComponents = true; // Show dx (East) and dy (North) triangle
    this.showProtractor = true;

    // SVG elements
    this.svgContainer = document.getElementById('measurement-svg');

    // Bind animate loop for string straightening morph
    this.unrollStartTime = null;
    this.unrollDurationMs = 1800; // Slower, dramatic 1.8 second unroll animation
    this.animateString = this.animateString.bind(this);
    requestAnimationFrame(this.animateString);
  }

  setMode(mode) {
    this.activeMode = mode;
    this.stringUnrollProgress = 0;
    this.unrollStartTime = null;
    this.isUnrolling = false;

    if (mode.startsWith('string_')) {
      this.showVectorArrow = false;
      this.isUnrolling = true;
      if (window.soundFX) window.soundFX.playStringStretch();
    } else if (mode === 'displacement') {
      this.showVectorArrow = true;
      if (window.soundFX) window.soundFX.playVectorWhoosh();
    } else if (mode === 'homecoming') {
      this.showVectorArrow = true;
      if (window.soundFX) window.soundFX.playHomecoming();
    } else {
      this.showVectorArrow = false;
    }

    this.renderSVG();
    this.updateMeasurementReadout();
  }

  animateString(timestamp) {
    if (this.isUnrolling) {
      if (!this.unrollStartTime) this.unrollStartTime = timestamp;
      const elapsed = timestamp - this.unrollStartTime;
      const t = Math.min(1.0, elapsed / this.unrollDurationMs);
      this.stringUnrollProgress = t;
      this.renderSVG();
      if (t >= 1.0) {
        this.isUnrolling = false;
      }
    }
    requestAnimationFrame(this.animateString);
  }

  // Generate SVG elements for String & Vector
  renderSVG() {
    if (!this.svgContainer) return;
    this.svgContainer.innerHTML = '';

    if (this.activeMode.startsWith('string_')) {
      this.renderVirtualString();
    } else if (this.activeMode === 'displacement' || this.activeMode === 'homecoming') {
      this.renderDisplacementVector();
    }
  }

  // Draw the virtual measuring string hugging the trail curves, then morphing into straight ruler bar
  renderVirtualString() {
    let legIndex = -1;
    if (this.activeMode === 'string_leg1') legIndex = 0;
    if (this.activeMode === 'string_leg2') legIndex = 1;
    if (this.activeMode === 'string_leg3') legIndex = 2;

    const pts = this.map.getSampledTrailPoints(legIndex, 60);
    if (pts.length < 2) return;

    const lengthCm = this.map.calculatePathLengthCm(legIndex);
    const lengthPx = lengthCm * this.map.pxPerCm;

    // The calibrated ruler is ALWAYS 20 cm long
    const rulerTotalCm = 20.0;
    const rulerTotalPx = rulerTotalCm * this.map.pxPerCm;

    // Dynamically center the 20 cm ruler horizontally in the canvas bottom margin
    const rulerX = Math.max(16, Math.round((this.map.displayW - rulerTotalPx) / 2));
    const rulerY = Math.round(this.map.displayH - 42);

    // Linear morph between curved trail point and straight line point aligned at 0 cm mark on ruler
    const pointsPath = pts.map((p, i) => {
      const origPx = this.map.gridToPixel(p.cmX, p.cmY);
      const frac = i / (pts.length - 1);
      const straightPx = {
        x: rulerX + frac * lengthPx, // Aligns starting precisely at rulerX (0 cm mark)
        y: rulerY
      };

      const t = this.stringUnrollProgress;
      // Smooth ease-in-out cubic morph
      const ease = t < 0.5 
        ? 4 * t * t * t 
        : 1 - Math.pow(-2 * t + 2, 3) / 2;

      const currentX = origPx.x + (straightPx.x - origPx.x) * ease;
      const currentY = origPx.y + (straightPx.y - origPx.y) * ease;
      return `${currentX.toFixed(1)},${currentY.toFixed(1)}`;
    }).join(' ');

    // 1. Draw glowing golden string
    const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    polyline.setAttribute('points', pointsPath);
    polyline.setAttribute('fill', 'none');
    polyline.setAttribute('stroke', '#facc15');
    polyline.setAttribute('stroke-width', '4.5');
    polyline.setAttribute('stroke-linecap', 'round');
    polyline.setAttribute('stroke-linejoin', 'round');
    polyline.setAttribute('filter', 'drop-shadow(0 0 7px rgba(234, 179, 8, 0.9))');
    this.svgContainer.appendChild(polyline);

    // 2. Draw ALWAYS 20 CM golden metric ruler as string straightens
    if (this.stringUnrollProgress > 0.2) {
      const opacity = Math.min(1, (this.stringUnrollProgress - 0.2) * 2.0);
      this.drawMetricRulerSVG(rulerX, rulerY + 8, rulerTotalPx, rulerTotalCm, lengthCm, opacity);
    }
  }

  // Draw calibrated metric centimeter ruler in SVG (ALWAYS 20 cm)
  drawMetricRulerSVG(x, y, widthPx, totalCm, stringLengthCm, opacity) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('opacity', opacity.toFixed(2));

    // Ruler Bar background plaque (20 cm)
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', x);
    rect.setAttribute('y', y);
    rect.setAttribute('width', widthPx);
    rect.setAttribute('height', '26');
    rect.setAttribute('fill', '#d4af37');
    rect.setAttribute('stroke', '#5c3915');
    rect.setAttribute('stroke-width', '1.5');
    rect.setAttribute('rx', '3');
    g.appendChild(rect);

    // Small Ruler Title
    const title = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    title.setAttribute('x', x + 6);
    title.setAttribute('y', y - 4);
    title.setAttribute('font-size', '9');
    title.setAttribute('font-family', 'Cinzel, serif');
    title.setAttribute('font-weight', 'bold');
    title.setAttribute('fill', '#fef08a');
    title.textContent = 'STANDARD 20 cm CARTOGRAPHER RULER';
    g.appendChild(title);

    // Draw millimeter (0.1 cm), half-cm (0.5 cm), and whole cm (1.0 cm) ticks for 0 to 20 cm
    for (let cm = 0; cm <= totalCm; cm++) {
      const tickX = x + cm * this.map.pxPerCm;

      // Millimeter ticks between cm marks
      if (cm < totalCm && this.map.pxPerCm > 24) {
        for (let mm = 1; mm <= 9; mm++) {
          const mmX = tickX + (mm / 10) * this.map.pxPerCm;
          const mmLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          mmLine.setAttribute('x1', mmX);
          mmLine.setAttribute('y1', y);
          mmLine.setAttribute('x2', mmX);
          mmLine.setAttribute('y2', mm === 5 ? y + 6 : y + 3.5);
          mmLine.setAttribute('stroke', mm === 5 ? '#3d250c' : '#784a1a');
          mmLine.setAttribute('stroke-width', mm === 5 ? '1' : '0.6');
          g.appendChild(mmLine);
        }
      }

      // Major centimeter tick
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', tickX);
      line.setAttribute('y1', y);
      line.setAttribute('x2', tickX);
      line.setAttribute('y2', y + 10);
      line.setAttribute('stroke', '#1a1205');
      line.setAttribute('stroke-width', '1.5');
      g.appendChild(line);

      // Centimeter Number Label
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', tickX);
      text.setAttribute('y', y + 20);
      text.setAttribute('font-size', '8.5');
      text.setAttribute('font-family', 'JetBrains Mono, monospace');
      text.setAttribute('font-weight', 'bold');
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('fill', '#1a1205');
      text.textContent = cm.toString();
      g.appendChild(text);
    }

    // String Endpoint Mark on the Ruler (red indicator line)
    const endPx = x + stringLengthCm * this.map.pxPerCm;
    const marker = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    marker.setAttribute('x1', endPx);
    marker.setAttribute('y1', y - 6);
    marker.setAttribute('x2', endPx);
    marker.setAttribute('y2', y + 26);
    marker.setAttribute('stroke', '#dc2626');
    marker.setAttribute('stroke-width', '2');
    marker.setAttribute('stroke-dasharray', '3, 2');
    g.appendChild(marker);

    // 3. Draw Precision 2.5x Magnifying Glass Loupe above the endpoint
    this.drawMagnifierLoupeSVG(g, endPx, y, stringLengthCm, opacity);

    this.svgContainer.appendChild(g);
  }

  // Draw an optical 2.5x magnifying glass loupe showing high-precision ruler markings
  drawMagnifierLoupeSVG(parentGroup, endPx, rulerY, stringLengthCm, opacity) {
    const loupeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    loupeGroup.setAttribute('opacity', opacity.toFixed(2));

    const loupeR = 48; // Radius of magnifying lens
    // Clamp loupe center so it doesn't clip off the left or right edges of canvas
    const loupeX = Math.max(loupeR + 15, Math.min(this.map.displayW - loupeR - 15, endPx));
    const loupeY = Math.max(loupeR + 10, rulerY - loupeR - 22);

    const zoom = 2.5;
    const zoomedPxPerCm = this.map.pxPerCm * zoom;

    // Unique clip-path for circular lens
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const clipPath = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
    const clipId = 'loupe-lens-clip';
    clipPath.setAttribute('id', clipId);

    const clipCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    clipCircle.setAttribute('cx', loupeX);
    clipCircle.setAttribute('cy', loupeY);
    clipCircle.setAttribute('r', loupeR);
    clipPath.appendChild(clipCircle);
    defs.appendChild(clipPath);
    loupeGroup.appendChild(defs);

    // Connector pointer line from loupe lens down to ruler endpoint
    const pointer = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pointer.setAttribute('d', `M ${loupeX} ${loupeY + loupeR} L ${endPx} ${rulerY - 4}`);
    pointer.setAttribute('stroke', '#d4af37');
    pointer.setAttribute('stroke-width', '1.5');
    pointer.setAttribute('stroke-dasharray', '3, 2');
    loupeGroup.appendChild(pointer);

    // Drop-shadow guide dot at exact ruler contact point
    const contactDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    contactDot.setAttribute('cx', endPx);
    contactDot.setAttribute('cy', rulerY - 4);
    contactDot.setAttribute('r', '3');
    contactDot.setAttribute('fill', '#dc2626');
    contactDot.setAttribute('stroke', '#fff');
    contactDot.setAttribute('stroke-width', '1');
    loupeGroup.appendChild(contactDot);

    // --- CLIPPED CONTENTS (Magnified view of ruler) ---
    const contentGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    contentGroup.setAttribute('clip-path', `url(#${clipId})`);

    // Lens glass background
    const lensBg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    lensBg.setAttribute('cx', loupeX);
    lensBg.setAttribute('cy', loupeY);
    lensBg.setAttribute('r', loupeR);
    lensBg.setAttribute('fill', '#fefce8');
    contentGroup.appendChild(lensBg);

    // Magnified ruler bar
    const magRulerH = 34;
    const magRulerY = loupeY - 12;
    const magRuler = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    magRuler.setAttribute('x', loupeX - loupeR - 10);
    magRuler.setAttribute('y', magRulerY);
    magRuler.setAttribute('width', (loupeR + 10) * 2);
    magRuler.setAttribute('height', magRulerH);
    magRuler.setAttribute('fill', '#eab308');
    magRuler.setAttribute('stroke', '#78350f');
    magRuler.setAttribute('stroke-width', '1.5');
    contentGroup.appendChild(magRuler);

    // Calculate visible cm range in the magnifier lens
    const minVisibleCm = Math.max(0, Math.floor(stringLengthCm - (loupeR / zoomedPxPerCm) - 0.5));
    const maxVisibleCm = Math.min(20, Math.ceil(stringLengthCm + (loupeR / zoomedPxPerCm) + 0.5));

    for (let cm = minVisibleCm; cm <= maxVisibleCm; cm++) {
      // Position of cm mark relative to loupe center
      const cmOffsetPx = (cm - stringLengthCm) * zoomedPxPerCm;
      const magTickX = loupeX + cmOffsetPx;

      // Draw magnified millimeter ticks
      for (let mm = 1; mm <= 9; mm++) {
        const mmX = magTickX + (mm / 10) * zoomedPxPerCm;
        if (mmX >= loupeX - loupeR - 5 && mmX <= loupeX + loupeR + 5) {
          const isMid = mm === 5;
          const mmLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          mmLine.setAttribute('x1', mmX);
          mmLine.setAttribute('y1', magRulerY);
          mmLine.setAttribute('x2', mmX);
          mmLine.setAttribute('y2', isMid ? magRulerY + 12 : magRulerY + 7);
          mmLine.setAttribute('stroke', isMid ? '#451a03' : '#78350f');
          mmLine.setAttribute('stroke-width', isMid ? '1.5' : '1');
          contentGroup.appendChild(mmLine);
        }
      }

      // Major Centimeter Tick
      const cmLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      cmLine.setAttribute('x1', magTickX);
      cmLine.setAttribute('y1', magRulerY);
      cmLine.setAttribute('x2', magTickX);
      cmLine.setAttribute('y2', magRulerY + 18);
      cmLine.setAttribute('stroke', '#1c1917');
      cmLine.setAttribute('stroke-width', '2.5');
      contentGroup.appendChild(cmLine);

      // Centimeter Number Label
      const cmLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      cmLabel.setAttribute('x', magTickX);
      cmLabel.setAttribute('y', magRulerY + 30);
      cmLabel.setAttribute('font-size', '11');
      cmLabel.setAttribute('font-family', 'JetBrains Mono, monospace');
      cmLabel.setAttribute('font-weight', 'bold');
      cmLabel.setAttribute('text-anchor', 'middle');
      cmLabel.setAttribute('fill', '#1c1917');
      cmLabel.textContent = cm.toString();
      contentGroup.appendChild(cmLabel);
    }

    // Red Central Hairline Reticle (points to exact string end)
    const reticle = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    reticle.setAttribute('x1', loupeX);
    reticle.setAttribute('y1', loupeY - loupeR);
    reticle.setAttribute('x2', loupeX);
    reticle.setAttribute('y2', loupeY + loupeR);
    reticle.setAttribute('stroke', '#dc2626');
    reticle.setAttribute('stroke-width', '2');
    reticle.setAttribute('stroke-dasharray', '4, 2');
    contentGroup.appendChild(reticle);

    // Glass glare arc reflection
    const glare = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    glare.setAttribute('d', `M ${loupeX - loupeR * 0.7} ${loupeY - loupeR * 0.4} A ${loupeR * 0.8} ${loupeR * 0.8} 0 0 1 ${loupeX + loupeR * 0.5} ${loupeY - loupeR * 0.6}`);
    glare.setAttribute('fill', 'none');
    glare.setAttribute('stroke', 'rgba(255, 255, 255, 0.6)');
    glare.setAttribute('stroke-width', '3');
    glare.setAttribute('stroke-linecap', 'round');
    contentGroup.appendChild(glare);

    loupeGroup.appendChild(contentGroup);

    // --- OUTER BEZEL & BRASS HOUSING ---
    const bezel = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    bezel.setAttribute('cx', loupeX);
    bezel.setAttribute('cy', loupeY);
    bezel.setAttribute('r', loupeR);
    bezel.setAttribute('fill', 'none');
    bezel.setAttribute('stroke', '#d4af37');
    bezel.setAttribute('stroke-width', '5');
    bezel.setAttribute('filter', 'drop-shadow(0 4px 10px rgba(0,0,0,0.7))');
    loupeGroup.appendChild(bezel);

    const innerRing = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    innerRing.setAttribute('cx', loupeX);
    innerRing.setAttribute('cy', loupeY);
    innerRing.setAttribute('r', loupeR - 2.5);
    innerRing.setAttribute('fill', 'none');
    innerRing.setAttribute('stroke', '#92400e');
    innerRing.setAttribute('stroke-width', '1');
    loupeGroup.appendChild(innerRing);

    // Loupe Badge Title Tag
    const badge = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    badge.setAttribute('x', loupeX - 38);
    badge.setAttribute('y', loupeY - loupeR - 10);
    badge.setAttribute('width', '76');
    badge.setAttribute('height', '16');
    badge.setAttribute('rx', '4');
    badge.setAttribute('fill', '#1e293b');
    badge.setAttribute('stroke', '#d4af37');
    badge.setAttribute('stroke-width', '1');
    loupeGroup.appendChild(badge);

    const badgeText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    badgeText.setAttribute('x', loupeX);
    badgeText.setAttribute('y', loupeY - loupeR + 2);
    badgeText.setAttribute('font-size', '8.5');
    badgeText.setAttribute('font-family', 'JetBrains Mono, monospace');
    badgeText.setAttribute('font-weight', 'bold');
    badgeText.setAttribute('text-anchor', 'middle');
    badgeText.setAttribute('fill', '#fef08a');
    badgeText.textContent = '🔍 2.5x LOUPE';
    loupeGroup.appendChild(badgeText);

    parentGroup.appendChild(loupeGroup);
  }

  // Draw direct straight-line vector arrow for net displacement (A -> D)
  renderDisplacementVector() {
    const disp = this.map.calculateDisplacementVector('D');
    const pOrigin = this.map.gridToPixel(disp.origin.gridX, disp.origin.gridY);
    const pTarget = this.map.gridToPixel(disp.target.gridX, disp.target.gridY);

    if (this.activeMode === 'homecoming') {
      // Net displacement is ZERO on round-trip return!
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', pOrigin.x);
      circle.setAttribute('cy', pOrigin.y);
      circle.setAttribute('r', '24');
      circle.setAttribute('fill', 'rgba(59, 130, 246, 0.25)');
      circle.setAttribute('stroke', '#3b82f6');
      circle.setAttribute('stroke-width', '3');
      circle.setAttribute('stroke-dasharray', '4 4');
      this.svgContainer.appendChild(circle);

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', pOrigin.x);
      text.setAttribute('y', pOrigin.y + 42);
      text.setAttribute('font-size', '13');
      text.setAttribute('font-family', 'Cinzel, serif');
      text.setAttribute('font-weight', 'bold');
      text.setAttribute('fill', '#60a5fa');
      text.setAttribute('text-anchor', 'middle');
      text.textContent = 'Net Displacement Δr = 0 (Returned Home!)';
      this.svgContainer.appendChild(text);
      return;
    }

    // Normal Net Displacement Vector (A -> D)
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');

    // 1. Right Triangle Vector Components (Δx East & Δy North)
    if (this.showVectorComponents) {
      const pCorner = { x: pTarget.x, y: pOrigin.y };

      // Δx component line (East)
      const lineX = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      lineX.setAttribute('x1', pOrigin.x);
      lineX.setAttribute('y1', pOrigin.y);
      lineX.setAttribute('x2', pCorner.x);
      lineX.setAttribute('y2', pCorner.y);
      lineX.setAttribute('stroke', '#38bdf8');
      lineX.setAttribute('stroke-width', '2.5');
      lineX.setAttribute('stroke-dasharray', '5 4');
      g.appendChild(lineX);

      // Label Δx
      const textX = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      textX.setAttribute('x', (pOrigin.x + pCorner.x) / 2);
      textX.setAttribute('y', pOrigin.y + 16);
      textX.setAttribute('font-size', '11');
      textX.setAttribute('font-family', 'JetBrains Mono, monospace');
      textX.setAttribute('font-weight', 'bold');
      textX.setAttribute('fill', '#38bdf8');
      textX.setAttribute('text-anchor', 'middle');
      textX.textContent = `Δx = +${disp.deltaX.toFixed(1)} cm`;
      g.appendChild(textX);

      // Δy component line (North)
      const lineY = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      lineY.setAttribute('x1', pCorner.x);
      lineY.setAttribute('y1', pCorner.y);
      lineY.setAttribute('x2', pTarget.x);
      lineY.setAttribute('y2', pTarget.y);
      lineY.setAttribute('stroke', '#34d399');
      lineY.setAttribute('stroke-width', '2.5');
      lineY.setAttribute('stroke-dasharray', '5 4');
      g.appendChild(lineY);

      // Label Δy
      const textY = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      textY.setAttribute('x', pCorner.x + 8);
      textY.setAttribute('y', (pCorner.y + pTarget.y) / 2);
      textY.setAttribute('font-size', '11');
      textY.setAttribute('font-family', 'JetBrains Mono, monospace');
      textY.setAttribute('font-weight', 'bold');
      textY.setAttribute('fill', '#34d399');
      textY.setAttribute('text-anchor', 'left');
      textY.textContent = `Δy = +${disp.deltaY.toFixed(1)} cm`;
      g.appendChild(textY);
    }

    // 2. Main Hypotenuse Vector Arrow (Crimson / Violet with Arrowhead)
    const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    arrow.setAttribute('x1', pOrigin.x);
    arrow.setAttribute('y1', pOrigin.y);
    arrow.setAttribute('x2', pTarget.x);
    arrow.setAttribute('y2', pTarget.y);
    arrow.setAttribute('stroke', '#f43f5e');
    arrow.setAttribute('stroke-width', '4');
    arrow.setAttribute('marker-end', 'url(#crimson-arrowhead)');
    arrow.setAttribute('filter', 'drop-shadow(0 0 8px rgba(244, 63, 94, 0.8))');
    g.appendChild(arrow);

    // 3. Arrowhead marker definition
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    marker.setAttribute('id', 'crimson-arrowhead');
    marker.setAttribute('markerWidth', '10');
    marker.setAttribute('markerHeight', '10');
    marker.setAttribute('refX', '7');
    marker.setAttribute('refY', '3.5');
    marker.setAttribute('orient', 'auto');

    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', '0 0, 10 3.5, 0 7');
    polygon.setAttribute('fill', '#f43f5e');
    marker.appendChild(polygon);
    defs.appendChild(marker);
    g.appendChild(defs);

    // 4. Vector Label Tag along hypotenuse
    const midX = (pOrigin.x + pTarget.x) / 2;
    const midY = (pOrigin.y + pTarget.y) / 2 - 14;

    const labelBadge = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    labelBadge.setAttribute('x', midX);
    labelBadge.setAttribute('y', midY);
    labelBadge.setAttribute('font-size', '12');
    labelBadge.setAttribute('font-family', 'Cinzel, serif');
    labelBadge.setAttribute('font-weight', 'bold');
    labelBadge.setAttribute('fill', '#fff');
    labelBadge.setAttribute('text-anchor', 'middle');
    labelBadge.setAttribute('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.9))');
    labelBadge.textContent = `Net Displacement Vector: Δr = ${disp.magnitudeCm.toFixed(1)} cm [${disp.directionStr}]`;
    g.appendChild(labelBadge);

    this.svgContainer.appendChild(g);
  }

  // Update dynamic modal readouts and side inspector
  updateMeasurementReadout() {
    const elInspector = document.getElementById('measurement-inspector');
    if (!elInspector) return;

    if (this.activeMode.startsWith('string_')) {
      let legIndex = -1;
      let legLabel = "Entire Trail (Leg 1 + 2 + 3)";
      if (this.activeMode === 'string_leg1') { legIndex = 0; legLabel = "Leg 1: Village (A) → Obstacle (B)"; }
      if (this.activeMode === 'string_leg2') { legIndex = 1; legLabel = "Leg 2: Obstacle (B) → Waypoint (C)"; }
      if (this.activeMode === 'string_leg3') { legIndex = 2; legLabel = "Leg 3: Waypoint (C) → Destination (D)"; }

      const lengthCm = this.map.calculatePathLengthCm(legIndex);
      const realmDistance = lengthCm * this.map.scaleFactor;

      elInspector.innerHTML = `
        <div class="space-y-2">
          <div class="flex items-center justify-between text-xs font-bold text-amber-300">
            <span>📏 VIRTUAL STRING MEASUREMENT</span>
            <span class="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">${legLabel}</span>
          </div>
          <p class="text-xs text-slate-300 leading-relaxed">
            The string is pressed along every curve of the trail, then straightened against the 20 cm ruler. Inspect the <strong>🔍 2.5x Loupe</strong> to read the exact length!
          </p>
          <div class="grid grid-cols-2 gap-3 pt-2">
            <div class="p-2.5 rounded-xl bg-black/40 border border-amber-500/30 text-center">
              <span class="text-[10px] uppercase font-bold text-slate-400 block mb-1">Paper String Length</span>
              <div class="text-xs font-bold font-mono text-amber-300 bg-amber-500/10 py-1 px-2 rounded border border-amber-500/20">🔍 Read 2.5x Loupe on Ruler</div>
            </div>
            <div class="p-2.5 rounded-xl bg-black/40 border border-white/10 text-center">
              <span class="text-[10px] uppercase font-bold text-slate-400 block mb-1">Real-World Calculation</span>
              <div class="text-xs font-bold font-mono text-slate-300 bg-white/5 py-1 px-2 rounded border border-white/10">Length × ${this.map.scaleFactor} ${this.map.scaleUnit}</div>
            </div>
          </div>
        </div>
      `;
    } else if (this.activeMode === 'displacement') {
      const disp = this.map.calculateDisplacementVector('D');
      elInspector.innerHTML = `
        <div class="space-y-2">
          <div class="flex items-center justify-between text-xs font-bold text-rose-400">
            <span>🧭 NET DISPLACEMENT VECTOR (Δr)</span>
            <span class="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono">Origin (A) → Destination (D)</span>
          </div>
          <p class="text-xs text-slate-300 leading-relaxed">
            Displacement is a vector: the shortest straight arrow from Initial Position to Final Position. It ignores all trail curves!
          </p>
          <div class="grid grid-cols-3 gap-2 pt-2">
            <div class="p-2 rounded-xl bg-black/40 border border-white/10 text-center">
              <span class="text-[9px] uppercase font-bold text-slate-400">Straight cm</span>
              <div class="text-base font-black font-mono text-rose-300">${disp.magnitudeCm.toFixed(2)} cm</div>
            </div>
            <div class="p-2 rounded-xl bg-black/40 border border-white/10 text-center">
              <span class="text-[9px] uppercase font-bold text-slate-400">Realm Units</span>
              <div class="text-base font-black font-mono text-white">${disp.magnitudeRealm.toFixed(1)} ${this.map.scaleUnit}</div>
            </div>
            <div class="p-2 rounded-xl bg-black/40 border border-white/10 text-center">
              <span class="text-[9px] uppercase font-bold text-slate-400">Heading</span>
              <div class="text-xs font-bold font-mono text-emerald-300">${disp.directionStr}</div>
            </div>
          </div>
          <div class="text-[11px] font-mono text-slate-400 bg-slate-900/80 p-2 rounded-lg border border-white/5">
            Vector Notation: <strong>Δr</strong> = ${disp.magnitudeRealm.toFixed(1)} ${this.map.scaleUnit} in direction of ${disp.directionStr}
          </div>
        </div>
      `;
    } else if (this.activeMode === 'homecoming') {
      const fullTrailCm = this.map.calculatePathLengthCm(-1);
      const roundTripDist = (fullTrailCm * 2) * this.map.scaleFactor;
      elInspector.innerHTML = `
        <div class="space-y-2">
          <div class="flex items-center justify-between text-xs font-bold text-blue-400">
            <span>🌀 THE HOMECOMING PARADOX</span>
            <span class="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono">Round Trip Return</span>
          </div>
          <p class="text-xs text-slate-300 leading-relaxed">
            The adventurer walked all the way back to the Starting Village. Notice what happened to distance vs displacement!
          </p>
          <div class="grid grid-cols-2 gap-3 pt-2">
            <div class="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/30">
              <span class="text-[10px] uppercase font-bold text-amber-400">Total Distance Traveled</span>
              <div class="text-base font-black font-mono text-amber-300">2 × d = ${roundTripDist.toFixed(1)} ${this.map.scaleUnit}</div>
              <p class="text-[10px] text-slate-400 mt-1">Every step counts toward scalar distance.</p>
            </div>
            <div class="p-2.5 rounded-xl bg-blue-950/40 border border-blue-500/30">
              <span class="text-[10px] uppercase font-bold text-blue-400">Net Displacement (Δr)</span>
              <div class="text-base font-black font-mono text-cyan-300">EXACTLY 0 ${this.map.scaleUnit}</div>
              <p class="text-[10px] text-slate-400 mt-1">Δx = x_final - x_initial = 0!</p>
            </div>
          </div>
        </div>
      `;
    } else {
      elInspector.innerHTML = `
        <div class="text-center py-4 text-slate-400 text-xs">
          Select a measurement tool above to inspect string distance or displacement vectors.
        </div>
      `;
    }
  }
}

window.MeasurementTool = MeasurementTool;
