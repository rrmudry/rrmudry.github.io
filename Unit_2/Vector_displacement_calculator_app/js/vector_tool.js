/**
 * VectorTool - Mathematical Inspector & Interactive Tool Controller
 * Displays step-by-step Cartesian deltas and Pythagorean derivations for each vector.
 */
class VectorTool {
  constructor(mapInstance) {
    this.map = mapInstance;
    this.activeMode = 'leg1'; // 'leg1', 'leg2', 'leg3', 'net', 'all'
    this.inspectorEl = document.getElementById('vector-inspector-content');

    this.initButtons();
    this.updateReadout('leg1');
  }

  initButtons() {
    const btnL1 = document.getElementById('btn-inspect-leg1');
    const btnL2 = document.getElementById('btn-inspect-leg2');
    const btnL3 = document.getElementById('btn-inspect-leg3');
    const btnNet = document.getElementById('btn-inspect-net');
    const btnAll = document.getElementById('btn-inspect-all');

    if (btnL1) btnL1.onclick = () => this.setMode('leg1');
    if (btnL2) btnL2.onclick = () => this.setMode('leg2');
    if (btnL3) btnL3.onclick = () => this.setMode('leg3');
    if (btnNet) btnNet.onclick = () => this.setMode('net');
    if (btnAll) btnAll.onclick = () => this.setMode('all');
  }

  setMode(mode) {
    this.activeMode = mode;
    this.map.setInspectedLeg(mode);
    this.updateReadout(mode);
    if (window.soundFX) window.soundFX.playVectorWhoosh();

    // Update active button state
    ['leg1', 'leg2', 'leg3', 'net', 'all'].forEach((k) => {
      const btn = document.getElementById(`btn-inspect-${k}`);
      if (btn) {
        if (k === mode) {
          btn.classList.add('ring-2', 'ring-amber-400', 'bg-amber-500/20');
        } else {
          btn.classList.remove('ring-2', 'ring-amber-400', 'bg-amber-500/20');
        }
      }
    });
  }

  updateReadout(mode) {
    if (!this.inspectorEl) return;

    if (mode === 'all') {
      const l1 = this.map.getLegData('leg1');
      const l2 = this.map.getLegData('leg2');
      const l3 = this.map.getLegData('leg3');
      const net = this.map.getLegData('net');
      const scale = this.map.activeRealm.scaleFactor;
      const unit = this.map.activeRealm.scaleUnit;

      const scalarSumCm = l1.magnitudeCm + l2.magnitudeCm + l3.magnitudeCm;
      const scalarSumRealm = scalarSumCm * scale;

      this.inspectorEl.innerHTML = `
        <div class="space-y-2 text-xs">
          <div class="flex items-center justify-between pb-1 border-b border-white/10">
            <span class="font-bold text-amber-300 font-medieval">Overall Multi-Leg Journey Synthesis</span>
            <span class="font-mono text-slate-400">Scale: 1 cm = ${scale.toFixed(1)} ${unit}</span>
          </div>
          <div class="grid grid-cols-2 gap-2 text-[11px]">
            <div class="p-2 rounded-lg bg-black/40 border border-white/10">
              <span class="text-slate-400 font-bold block">Scalar Path Sum (|Δr₁| + |Δr₂| + |Δr₃|):</span>
              <span class="text-amber-300 font-bold font-mono">${scalarSumCm.toFixed(2)} cm</span>
              <span class="text-slate-400"> (${scalarSumRealm.toFixed(1)} ${unit})</span>
            </div>
            <div class="p-2 rounded-lg bg-black/40 border border-rose-500/30">
              <span class="text-rose-400 font-bold block">Direct Net Displacement (|Δr_net|):</span>
              <span class="text-rose-300 font-bold font-mono">${net.magnitudeCm.toFixed(2)} cm</span>
              <span class="text-slate-400"> (${net.magnitudeRealm.toFixed(1)} ${unit})</span>
            </div>
          </div>
          <p class="text-[10px] text-amber-200/80 italic">
            Notice: The direct net displacement arrow is shorter than the sum of the leg lengths: ${net.magnitudeCm.toFixed(2)} cm &le; ${scalarSumCm.toFixed(2)} cm!
          </p>
        </div>
      `;
      return;
    }

    const data = this.map.getLegData(mode);
    const scale = this.map.activeRealm.scaleFactor;
    const unit = this.map.activeRealm.scaleUnit;

    const x1 = data.start.x;
    const y1 = data.start.y;
    const x2 = data.end.x;
    const y2 = data.end.y;

    const dx = data.dx;
    const dy = data.dy;
    const mag = data.magnitudeCm;
    const realMag = data.magnitudeRealm;

    const dxSq = (dx * dx).toFixed(2);
    const dySq = (dy * dy).toFixed(2);
    const sumSq = (dx * dx + dy * dy).toFixed(2);

    this.inspectorEl.innerHTML = `
      <div class="space-y-2 text-xs">
        <div class="flex items-center justify-between pb-1 border-b border-white/10">
          <span class="font-bold text-amber-300 font-medieval">${data.name}</span>
          <span class="font-mono text-slate-400">P₁: (${x1.toFixed(1)}, ${y1.toFixed(1)}) &rarr; P₂: (${x2.toFixed(1)}, ${y2.toFixed(1)})</span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
          <!-- Δx Card -->
          <div class="p-2 rounded-lg bg-amber-950/40 border border-amber-500/30">
            <span class="text-amber-400 font-bold uppercase block text-[9px]">Horizontal Component (East/West)</span>
            <div class="font-mono text-white text-xs mt-0.5">
              &Delta;x = x₂ - x₁ = ${x2.toFixed(1)} - ${x1.toFixed(1)}
            </div>
            <div class="font-mono font-bold text-amber-300 mt-0.5">
              = ${dx >= 0 ? '+' : ''}${dx.toFixed(1)} cm
            </div>
          </div>

          <!-- Δy Card -->
          <div class="p-2 rounded-lg bg-cyan-950/40 border border-cyan-500/30">
            <span class="text-cyan-400 font-bold uppercase block text-[9px]">Vertical Component (North/South)</span>
            <div class="font-mono text-white text-xs mt-0.5">
              &Delta;y = y₂ - y₁ = ${y2.toFixed(1)} - ${y1.toFixed(1)}
            </div>
            <div class="font-mono font-bold text-cyan-300 mt-0.5">
              = ${dy >= 0 ? '+' : ''}${dy.toFixed(1)} cm
            </div>
          </div>

          <!-- Pythagorean Hypotenuse Card -->
          <div class="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30">
            <span class="text-emerald-400 font-bold uppercase block text-[9px]">Pythagorean Magnitude (|Δr|)</span>
            <div class="font-mono text-white text-xs mt-0.5">
              &Delta;r = &radic;(&Delta;x&sup2; + &Delta;y&sup2;) = &radic;(${dxSq} + ${dySq})
            </div>
            <div class="font-mono font-bold text-emerald-300 mt-0.5">
              = &radic;(${sumSq}) = ${mag.toFixed(2)} cm
            </div>
          </div>
        </div>

        <div class="flex items-center justify-between pt-1 border-t border-white/10 text-[11px]">
          <span class="text-slate-300">
            Real Realm Displacement = <strong>${mag.toFixed(2)} cm &times; ${scale.toFixed(1)} ${unit}/cm</strong>:
          </span>
          <span class="font-mono font-bold text-white text-xs">
            ${realMag.toFixed(1)} ${unit}
          </span>
        </div>
      </div>
    `;
  }
}

window.VectorTool = VectorTool;
