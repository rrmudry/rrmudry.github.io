// Horizontal Projectile Workbench — Measuring and placing on the apparatus
// • Hover a ruler, the photogate or the flight timer → 2.5× optical loupe with a red crosshair.
//   Tap/click a ruler pins the loupe in place (for touch screens); tap again to unpin.
// • Measuring crosshair (Lab 1): click or drag it onto a ghost; its red guide lines run to both
//   rulers. Arrow keys nudge it 1 px (Shift = 10 px). There is no number readout: the student
//   still reads each ruler.
// • Drag the target bucket along the floor runway (snaps to the ruler's precision).
//   Arrow keys (Shift = ×10) and the ◀ ▶ buttons nudge it for trackpad users.
// • Every click is also reported to the app (for "click on the height ruler" style tasks).

class MeasurementTool {
  constructor(stage, { canDrag, onMove, canCross, onCross, onClick }) {
    this.stage = stage;
    this.canDrag = canDrag;
    this.onMove = onMove;
    this.canCross = canCross;
    this.onCross = onCross;
    this.onClick = onClick;
    this.dragging = null;     // 'bucket' | 'cross' | null
    this.pinned = false;
    const c = stage.canvas;

    c.addEventListener('pointermove', e => this.move(e));
    c.addEventListener('pointerdown', e => this.down(e));
    c.addEventListener('pointerup', e => this.up(e));
    c.addEventListener('pointercancel', e => this.up(e));
    c.addEventListener('pointerleave', () => { if (!this.pinned && !this.dragging) stage.loupe = null; });
    c.addEventListener('keydown', e => {
      const dirs = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] };
      const d = dirs[e.key];
      if (!d) return;
      if (this.canDrag() && d[1] === 0) {
        e.preventDefault();
        this.nudge(d[0], e.shiftKey);
      } else if (this.canCross() && stage.cfg.crosshair) {
        e.preventDefault();
        const px = (e.shiftKey ? 10 : 1) / stage.scale;
        this.setCross(stage.cfg.crosshair.x + d[0] * px, stage.cfg.crosshair.y + d[1] * px);
      }
    });
  }

  pos(e) {
    const r = this.stage.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  overBucket(p) {
    const s = this.stage;
    if (!s.cfg || s.cfg.bucketLocked || s.cfg.noBucket) return false;
    const bx = s.X(s.cfg.bucketX);
    return Math.abs(p.x - bx) <= s.bucketHalfPx() + 18 && p.y >= s.floorY - 48 * s.fs && p.y <= s.floorY + 40 * s.fs;
  }

  move(e) {
    const p = this.pos(e);
    const s = this.stage;
    if (this.dragging === 'bucket') { this.setBucket(s.worldX(p.x - this.grabOffset)); return; }
    if (this.dragging === 'cross') { this.setCross(s.worldX(p.x), s.worldY(p.y)); return; }
    const draggable = this.canDrag() && this.overBucket(p);
    const region = s.loupeRegion(p.x, p.y);
    const cross = this.canCross() && !region;
    s.canvas.style.cursor = draggable ? 'grab' : region ? 'zoom-in' : cross ? 'crosshair' : 'default';
    if (!this.pinned) s.loupe = region && !draggable ? p : null;
  }

  down(e) {
    const p = this.pos(e);
    const s = this.stage;
    if (this.canDrag() && this.overBucket(p)) {
      this.dragging = 'bucket';
      this.grabOffset = p.x - s.X(s.cfg.bucketX);
      s.canvas.setPointerCapture(e.pointerId);
      s.canvas.style.cursor = 'grabbing';
      s.loupe = null;
      this.pinned = false;
      return;
    }
    const region = s.regionAt(p.x, p.y);
    const loupeRegion = s.loupeRegion(p.x, p.y);
    if (this.canCross() && !loupeRegion) {
      this.dragging = 'cross';
      s.canvas.setPointerCapture(e.pointerId);
      this.setCross(s.worldX(p.x), s.worldY(p.y));
      s.loupe = null;
      this.pinned = false;
      return;
    }
    if (this.onClick) this.onClick(region, p);
    if (loupeRegion) {
      // Second tap near the pinned spot unpins; anywhere else on a ruler re-pins there
      const near = this.pinned && s.loupe && Math.hypot(s.loupe.x - p.x, s.loupe.y - p.y) < 12;
      this.pinned = !near;
      s.loupe = this.pinned ? p : null;
    } else {
      this.pinned = false;
      s.loupe = null;
    }
  }

  // Pin the loupe at a spot (used after a correct "click on…" so the reading is magnified)
  pinAt(p) {
    this.pinned = true;
    this.stage.loupe = p;
  }

  unpin() {
    this.pinned = false;
    this.stage.loupe = null;
  }

  up(e) {
    if (!this.dragging) return;
    const was = this.dragging;
    this.dragging = null;
    try { this.stage.canvas.releasePointerCapture(e.pointerId); } catch (err) { /* already released */ }
    this.stage.canvas.style.cursor = was === 'bucket' ? 'grab' : 'crosshair';
    window.soundFx.playClick();
  }

  nudge(dir, big) {
    const s = this.stage;
    this.setBucket(s.cfg.bucketX + dir * s.snap * (big ? 10 : 1));
  }

  setBucket(xw) {
    const s = this.stage;
    const snapped = Math.round(Math.min(Math.max(xw, 0), s.runwayShown) / s.snap) * s.snap;
    const x = Number(snapped.toFixed(2));
    if (x === s.cfg.bucketX) return;
    s.cfg.bucketX = x;
    this.onMove(x);
  }

  setCross(xw, yw) {
    const s = this.stage;
    const c = { x: Math.min(Math.max(xw, -0.2 * s.cfg.runway), s.runwayShown), y: Math.min(Math.max(yw, 0), s.worldY(0)) };
    s.cfg.crosshair = c;
    this.onCross(c);
  }
}

window.MeasurementTool = MeasurementTool;
