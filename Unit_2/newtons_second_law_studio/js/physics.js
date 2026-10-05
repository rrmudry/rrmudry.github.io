// Newton's 2nd Law Studio — Physics Engine
// Dual-pulley horizontal modified Atwood machine on a frictionless 2.00 m track.
// All internal physics uses MKS units; masses are stored in grams for clean token math.
// Class convention: g = 10 m/s².

const NSL = {
  G: 10,                 // gravitational field strength (m/s²)
  TRACK_LENGTH: 2.00,    // m, left pulley at x = 0, right pulley at x = 2.00
  CART_WIDTH: 0.20,      // m
  BUMPER_GAP: 0.05,      // m between cart edge and pulley at the stop
  GATE_A: 0.50,          // m
  GATE_B: 1.50,          // m
  FLAG_WIDTH: 0.050,     // m, photogate interrupter flag mounted on the cart
  START_X: 0.30,         // m, launch position (cart center)
  CHASSIS_G: 100,        // g, empty cart body
  TOKENS: [500, 200, 100, 50, 20, 10], // g, token sizes used to draw stacks
  SUBSTEPS: 10,          // Euler-Cromer substeps per frame (dt = 1/600 s)
  MAX_T: 10               // s, a run pauses here so an idle clock doesn't keep ticking
};

NSL.X_MIN = NSL.CART_WIDTH / 2 + NSL.BUMPER_GAP;
NSL.X_MAX = NSL.TRACK_LENGTH - NSL.CART_WIDTH / 2 - NSL.BUMPER_GAP;

// Greedy decomposition of a mass (g) into drawable tokens, largest first.
NSL.decompose = function (grams, sizes) {
  const list = [];
  let rest = Math.round(grams);
  for (const s of (sizes || NSL.TOKENS)) {
    while (rest >= s) { list.push(s); rest -= s; }
  }
  if (rest > 0) list.push(rest);
  return list;
};

class AtwoodPhysics {
  constructor() {
    this.mL = 100;     // g, left hanger (hanger + tokens)
    this.mR = 100;     // g, right hanger
    this.cargo = 200;  // g, tokens/bricks loaded in the cart bed
    this.listeners = {};
    this.maxT = NSL.MAX_T;  // a task may shorten this (e.g. the 5 s balance test)
    this.reset();
  }

  on(evt, fn) { (this.listeners[evt] = this.listeners[evt] || []).push(fn); }
  emit(evt, data) { (this.listeners[evt] || []).forEach(fn => fn(data)); }

  get mCart() { return NSL.CHASSIS_G + this.cargo; }
  get mTotal() { return this.mL + this.mCart + this.mR; }
  get deltaM() { return this.mR - this.mL; }

  // Instantaneous forces. While the cart is held (or parked at a bumper)
  // the hangers hang at rest, so each string tension equals that hanger's weight.
  computePhysics() {
    const g = NSL.G;
    const mL = this.mL / 1000, mR = this.mR / 1000;
    const mTotal = this.mTotal / 1000;
    const F_net = (mR - mL) * g;           // + = rightward
    const free = this.phase === 'running';
    const acceleration = free ? F_net / mTotal : 0;
    const tensionL = mL * (g + acceleration);
    const tensionR = mR * (g - acceleration);
    return { mTotal, F_net, acceleration, tensionL, tensionR, theoreticalA: F_net / mTotal };
  }

  reset(x) {
    this.x = (x === undefined) ? NSL.START_X : x;
    this.v = 0;
    this.a = 0;
    this.t = 0;
    this.phase = 'held';   // 'held' | 'running' | 'stopped'
    this.timeUp = false;   // true once a run reaches NSL.MAX_T (frozen until reset)
    this.stopSide = null;
    this.gates = { A: this._blankGate(NSL.GATE_A), B: this._blankGate(NSL.GATE_B) };
    this.history = [{ t: 0, x: this.x, v: 0, a: 0 }];
    this.emit('reset');
  }

  _blankGate(pos) {
    return { pos, blocked: false, tEnter: null, tExit: null, blockTime: null, speed: null, tMid: null };
  }

  release() {
    if (this.phase !== 'held') return;
    this.phase = 'running';
    this.emit('release');
  }

  // Instantaneous impulse that changes velocity by dv (m/s). Releases a held cart.
  nudge(dv) {
    if (this.phase === 'stopped') return false;
    if (this.phase === 'held') this.phase = 'running';
    this.v += dv;
    this.emit('nudge');
    return true;
  }

  step(frameDt) {
    if (this.phase !== 'running' || this.timeUp) return;
    const h = frameDt / NSL.SUBSTEPS;
    const half = NSL.FLAG_WIDTH / 2;

    for (let i = 0; i < NSL.SUBSTEPS; i++) {
      if (this.t >= this.maxT - 1e-9) {
        this.t = this.maxT;
        this.timeUp = true;
        this.emit('timeUp');
        break;
      }
      const { acceleration } = this.computePhysics();
      const xOld = this.x;
      // Euler-Cromer: update velocity first, then position with the new velocity
      const vNew = this.v + acceleration * h;
      let xNew = xOld + vNew * h;

      // Photogates: detect flag edges crossing each beam, interpolating within the substep
      for (const key of ['A', 'B']) {
        const gate = this.gates[key];
        const wasBlocked = Math.abs(xOld - gate.pos) < half;
        const isBlocked = Math.abs(xNew - gate.pos) < half;
        if (wasBlocked === isBlocked || xNew === xOld) continue;
        // Cart-center position at which the edge sits exactly on the beam
        const lo = gate.pos - half, hi = gate.pos + half;
        const edgeX = ((xOld - lo) * (xNew - lo) <= 0) ? lo : hi;
        const frac = Math.min(1, Math.max(0, (edgeX - xOld) / (xNew - xOld)));
        const tCross = this.t + frac * h;
        if (isBlocked && gate.tEnter === null) {
          gate.tEnter = tCross;
          gate.blocked = true;
          this.emit('gateEnter', key);
        } else if (!isBlocked && gate.blocked) {
          gate.blocked = false;
          if (gate.tExit === null && gate.tEnter !== null) {
            gate.tExit = tCross;
            gate.blockTime = gate.tExit - gate.tEnter;
            gate.speed = NSL.FLAG_WIDTH / gate.blockTime;
            gate.tMid = (gate.tEnter + gate.tExit) / 2;
            this.emit('gateExit', key);
          }
        }
      }

      this.v = vNew;
      this.x = xNew;
      this.a = acceleration;
      this.t += h;

      // Bumper stops at either pulley
      if (this.x >= NSL.X_MAX || this.x <= NSL.X_MIN) {
        this.stopSide = this.x >= NSL.X_MAX ? 'right' : 'left';
        this.x = Math.min(NSL.X_MAX, Math.max(NSL.X_MIN, this.x));
        const impact = Math.abs(this.v);
        this.v = 0;
        this.a = 0;
        this.phase = 'stopped';
        this.history.push({ t: this.t, x: this.x, v: 0, a: 0 });
        this.emit('bumper', { side: this.stopSide, impact });
        return;
      }
    }
    this.history.push({ t: this.t, x: this.x, v: this.v, a: this.a });
    if (this.history.length > 5000) this.history.shift();
  }

  // Acceleration measured from the two photogate speeds: a = (v_B − v_A) / (t_B − t_A)
  measuredAcceleration() {
    const A = this.gates.A, B = this.gates.B;
    if (A.speed === null || B.speed === null) return null;
    return (B.speed - A.speed) / (B.tMid - A.tMid);
  }

  // ---- Token transfers (grams) ----
  // Locations: 'L', 'C' (cart bed), 'R'. Moving mass between locations never changes M_total.
  _get(loc) { return loc === 'L' ? this.mL : loc === 'R' ? this.mR : this.cargo; }
  _set(loc, val) {
    if (loc === 'L') this.mL = val; else if (loc === 'R') this.mR = val; else this.cargo = val;
  }

  transferToken(from, to, grams) {
    if (from === to) return { ok: false, reason: 'Pick two different locations.' };
    if (this._get(from) < grams) {
      return { ok: false, reason: `Not enough mass there to move ${grams} g.` };
    }
    this._set(from, this._get(from) - grams);
    this._set(to, this._get(to) + grams);
    this.reset();
    return { ok: true };
  }

  // Adds the same mass to both hangers: M_total changes, Δm (and F_net) does not.
  addPair(gramsEach) {
    if (gramsEach < 0 && (this.mL + gramsEach < 10 || this.mR + gramsEach < 10)) {
      return { ok: false, reason: 'Each hanger must keep at least 10 g.' };
    }
    this.mL += gramsEach;
    this.mR += gramsEach;
    this.reset();
    return { ok: true };
  }

  // Left hanger only (Step 1 balance task)
  addLeft(grams) {
    if (this.mL + grams < 0) return { ok: false, reason: 'The left string has no weight to remove.' };
    if (this.mL + grams > 1000) return { ok: false, reason: 'That is too much weight (1000 g max).' };
    this.mL += grams;
    this.reset();
    return { ok: true };
  }

  addCargo(grams) {
    if (this.cargo + grams < 0) return { ok: false, reason: 'The cart bed is already empty.' };
    if (this.cargo + grams > 3000) return { ok: false, reason: 'The cart bed is full (3 kg max).' };
    this.cargo += grams;
    this.reset();
    return { ok: true };
  }

  setMasses(mL, cargo, mR) {
    this.mL = mL; this.cargo = cargo; this.mR = mR;
    this.reset();
  }
}

window.NSL = NSL;
window.AtwoodPhysics = AtwoodPhysics;
