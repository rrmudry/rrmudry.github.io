// Newton's 2nd Law Studio — Mastery Arena
// Five core tiers for everyone (the level of Steps 1–3), one tier on screen at a time, with hints,
// the embedded Desmos calculator, and new values after a wrong answer. Get 4 of 5 to pass.
// Then two ⭐ Honors tiers: required for Honors periods, optional for everyone else (not graded).
// Grading lives in app.js (0.8 pts per core tier); the certificate prints as an ink-friendly page.

(function () {
  const ARENA_VERSION = 2;
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const shuffle = arr => arr.map(v => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
  const near = (a, b, relTol) => Math.abs(a - b) <= Math.max(0.0015, Math.abs(b) * (relTol || 0.02));
  const n = (v, d) => Number(v.toFixed(d === undefined ? 3 : d)).toString();
  const kg = g => n(g / 1000, 3);
  const sgn = (v, d) => v > 0 ? `+${n(v, d)}` : v < 0 ? `−${n(-v, d)}` : '0';
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // FNV-1a 32-bit hash for the certificate verification code
  function fnv(str) {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h.toString(16).toUpperCase().padStart(8, '0');
  }

  // ---------- Tier definitions ----------
  // gen() makes fresh random values. num tiers: text, answer, unit, hints, diagnose, explain.
  // mc tiers: text, options [{t, ok, why}] (one try).
  const TIERS = [
    {
      id: 1, title: 'Balance it', icon: '⚖️', type: 'num', unit: 'g', maxTries: 2,
      gen: () => {
        const mL = pick([120, 140, 160, 180, 230, 250, 270]);
        const gap = pick([30, 40, 50, 60, 70, 90]);
        return { mL, mR: mL - gap, cart: pick([200, 300, 400]) };
      },
      text: p => `The left weight is <strong>${p.mL} g</strong>. The right weight is <strong>${p.mR} g</strong>. The cart is ${p.cart} g.<br>
        When released, the cart speeds up to the LEFT.<br>How many grams must you <strong>add to the right weight</strong> so the cart does not move?`,
      answer: p => p.mL - p.mR,
      diagnose: (v, p) => near(v, p.mL) ? `${p.mL} g is the total the right side needs. It already has ${p.mR} g. How much do you ADD?`
        : (near(v, p.cart) || near(v, p.mL + p.cart - p.mR)) ? 'The cart\'s mass does not matter for balance. Only the two hanging weights pull.' : null,
      hints: p => [
        'Balanced means both hanging weights are the same.',
        `The right side needs to reach ${p.mL} g.`,
        `Type ${p.mL} − ${p.mR} into the calculator.`
      ],
      explain: p => `Add ${p.mL - p.mR} g. Then both sides are ${p.mL} g, the pulls are equal, and the net force is 0 N.`,
      demo: p => ({ mL: p.mL, cargo: p.cart - NSL.CHASSIS_G, mR: p.mL })
    },
    {
      id: 2, title: 'Double the force', icon: '⏩', type: 'num', unit: 'm/s²', maxTries: 2,
      gen: () => ({ a1: pick([0.2, 0.4, 0.5, 0.6, 0.8, 1.2, 1.5]) }),
      text: p => `A cart speeds up at <strong>${n(p.a1, 2)} m/s²</strong>.<br>
        Then the net force is <strong>doubled</strong>. The mass stays the same.<br>What is the new acceleration?`,
      answer: p => p.a1 * 2,
      diagnose: (v, p) => near(v, p.a1 / 2) ? 'More force means MORE acceleration, not less.'
        : near(v, p.a1) ? 'The force changed, so the acceleration changes too.'
          : near(v, p.a1 * 4) ? 'Double the force → double (× 2) the acceleration, not × 4.' : null,
      hints: p => [
        'Double the force → double the acceleration.',
        `Type ${n(p.a1, 2)} × 2 into the calculator.`
      ],
      explain: p => `${n(p.a1, 2)} × 2 = ${n(p.a1 * 2, 2)} m/s². Double the force, double the acceleration.`
    },
    {
      id: 3, title: 'Net force from weights', icon: '🏋️', type: 'num', unit: 'N', maxTries: 2,
      gen: () => {
        const opts = [50, 80, 100, 120, 150, 200, 250];
        const mL = pick(opts);
        let mR = pick(opts);
        while (mR === mL) mR = pick(opts);
        return { mL, mR };
      },
      text: p => `The left weight is <strong>${p.mL} g</strong>. The right weight is <strong>${p.mR} g</strong>.<br>
        What is the <strong>net force</strong> from the two weights?<br>
        <strong class="formula">Weight = mass × g</strong> (g = 10 m/s²)`,
      answer: p => Math.abs(p.mR - p.mL) / 100,
      diagnose: (v, p) => near(v, (p.mL + p.mR) / 100) ? 'The weights pull in opposite directions, so subtract. Do not add.'
        : near(v, Math.abs(p.mR - p.mL)) ? 'That is in grams. Change to kg (÷ 1000), then multiply by 10.'
          : near(v, Math.abs(p.mR - p.mL) / 1000) ? 'That is the mass difference in kg. Multiply by g = 10 to get newtons.' : null,
      hints: p => [
        'Find each weight in newtons: change grams to kg (÷ 1000), then × 10.',
        `Left: ${kg(p.mL)} × 10 = ${n(p.mL / 100)} N. Right: ${kg(p.mR)} × 10 = ${n(p.mR / 100)} N.`,
        '<span class="formula">Net force = bigger − smaller</span>',
        `Type ${n(Math.max(p.mL, p.mR) / 100)} − ${n(Math.min(p.mL, p.mR) / 100)} into the calculator.`
      ],
      explain: p => `${n(Math.max(p.mL, p.mR) / 100)} N − ${n(Math.min(p.mL, p.mR) / 100)} N = <strong>${n(Math.abs(p.mR - p.mL) / 100)} N</strong> toward the ${p.mR > p.mL ? 'right' : 'left'}.`
    },
    {
      id: 4, title: "Use Newton's 2nd Law", icon: '🧮', type: 'num', unit: 'm/s²', maxTries: 2,
      gen: () => ({ F: pick([0.2, 0.3, 0.4, 0.5, 0.6, 0.8, 1.2]), M: pick([0.2, 0.25, 0.4, 0.5, 0.8, 1]) }),
      text: p => `A cart system has a net force of <strong>${n(p.F, 2)} N</strong> and a total mass of <strong>${n(p.M, 2)} kg</strong>.<br>
        What is its acceleration?<br><strong class="formula">Acceleration = net force ÷ mass</strong>`,
      answer: p => p.F / p.M,
      diagnose: (v, p) => near(v, p.F * p.M) ? 'Divide the force by the mass. Do not multiply.'
        : near(v, p.M / p.F) ? 'Flip it: net force ÷ mass.' : null,
      hints: p => [
        'Divide the net force by the mass.',
        `Type ${n(p.F, 2)} ÷ ${n(p.M, 2)} into the calculator.`
      ],
      explain: p => `${n(p.F, 2)} N ÷ ${n(p.M, 2)} kg = <strong>${n(p.F / p.M, 2)} m/s²</strong>.`
    },
    {
      id: 5, title: 'Which speeds up more?', icon: '🛒', type: 'mc', maxTries: 1,
      gen: () => {
        const light = pick([0.5, 1, 1.5, 2]);
        return { F: pick([1, 2, 3]), light, heavy: light * pick([2, 3]), heavyFirst: Math.random() < 0.5, order: shuffle([0, 1, 2]) };
      },
      text: p => {
        const A = p.heavyFirst ? p.heavy : p.light, B = p.heavyFirst ? p.light : p.heavy;
        return `Two carts are pulled with the <strong>same net force</strong>: ${p.F} N.<br>
          • Cart A has a mass of <strong>${n(A, 2)} kg</strong>.<br>• Cart B has a mass of <strong>${n(B, 2)} kg</strong>.<br>
          Which cart speeds up more?`;
      },
      options: p => {
        const lightName = p.heavyFirst ? 'Cart B' : 'Cart A', heavyName = p.heavyFirst ? 'Cart A' : 'Cart B';
        return [
          { t: `${lightName}, the lighter one.`, ok: true, why: 'Right! Same force, less mass → more acceleration.' },
          { t: `${heavyName}, the heavier one.`, why: 'More mass means more inertia, so the heavier cart speeds up LESS.' },
          { t: 'They speed up the same, because the force is the same.', why: 'The force is the same, but the masses are not. Less mass → more acceleration.' }
        ];
      }
    },
    // ---------- ⭐ Honors tiers ----------
    {
      id: 6, title: 'Inertia penalty', icon: '🧱', type: 'num', unit: 'm/s²', maxTries: 2, honors: true,
      gen: () => {
        const dm = pick([40, 50, 60, 80]);
        return { dm, mL: 100, mR: 100 + dm, cart: 300 - dm, add: pick([300, 500, 750, 1500]) };
      },
      text: p => `Left weight: <strong>${p.mL} g</strong>. Cart: <strong>${p.cart} g</strong>. Right weight: <strong>${p.mR} g</strong>.<br>
        The net force is ${n(p.dm / 100, 2)} N, so the acceleration is ${n(p.dm / 100 / 0.5, 3)} m/s².<br>
        A student loads <strong>${p.add} g of cargo</strong> into the cart without touching the hanging weights. What is the new acceleration?`,
      answer: p => (p.dm / 100) / ((500 + p.add) / 1000),
      diagnose: (v, p) => near(v, (p.dm / 100) / ((p.cart + p.add) / 1000)) ? 'You divided by the cart\'s mass only. The hanging weights speed up too, so divide by the TOTAL mass.'
        : near(v, p.dm / 100 / 0.5) ? 'Same pull, more mass to move. More inertia means LESS acceleration.' : null,
      hints: p => [
        `New total mass = 0.5 kg + ${kg(p.add)} kg = ${kg(500 + p.add)} kg`,
        '<span class="formula">Acceleration = net force ÷ total mass</span>',
        `Type ${n(p.dm / 100, 2)} ÷ ${kg(500 + p.add)} into the calculator.`
      ],
      explain: p => `The net force stays ${n(p.dm / 100, 2)} N, but the total mass grows to ${kg(500 + p.add)} kg: a = <strong>${n((p.dm / 100) / ((500 + p.add) / 1000), 3)} m/s²</strong>.`
    },
    {
      id: 7, title: 'Acceleration with a sign', icon: '↔️', type: 'num', unit: 'm/s²', maxTries: 2, honors: true,
      gen: () => {
        const opts = [60, 80, 100, 120, 140, 160];
        const mL = pick(opts);
        let mR = pick(opts);
        while (mR === mL) mR = pick(opts);
        return { mL, mR, cart: pick([200, 300, 400]) };
      },
      text: p => `Predict the acceleration, <strong>with its sign</strong> (right +, left −).<br>
        • left weight: <strong>${p.mL} g</strong><br>• cart: <strong>${p.cart} g</strong><br>• right weight: <strong>${p.mR} g</strong><br>Use g = 10 m/s².`,
      answer: p => ((p.mR - p.mL) / 100) / ((p.mL + p.cart + p.mR) / 1000),
      diagnose: (v, p) => {
        const F = (p.mR - p.mL) / 100, M = (p.mL + p.cart + p.mR) / 1000;
        if (near(v, -F / M)) return 'Check the sign. Which weight is heavier? That is the direction of the net force.';
        if (near(v, F / (p.cart / 1000))) return 'Divide by the TOTAL mass: the cart and both hanging weights.';
        return null;
      },
      hints: p => {
        const F = (p.mR - p.mL) / 100, Mg = p.mL + p.cart + p.mR;
        return [
          'Net force = right weight − left weight, and weight = mass × g.',
          `<span class="formula">Net force = (${kg(p.mR)} − ${kg(p.mL)}) × 10 = ${sgn(F, 2)} N</span>`,
          `<span class="formula">Total mass = ${p.mL} + ${p.cart} + ${p.mR} = ${Mg} g = ${kg(Mg)} kg</span>`,
          `Type ${F < 0 ? '−' : ''}${n(Math.abs(F), 2)} ÷ ${kg(Mg)} into the calculator.`
        ];
      },
      explain: p => {
        const F = (p.mR - p.mL) / 100, M = (p.mL + p.cart + p.mR) / 1000;
        return `<span class="formula">a = ${sgn(F, 2)} N ÷ ${n(M, 3)} kg = ${sgn(F / M, 3)} m/s²</span>. The cart speeds up to the ${F > 0 ? 'right' : 'left'}.`;
      }
    }
  ];
  const CORE = TIERS.filter(t => !t.honors);
  const HONORS = TIERS.filter(t => t.honors);
  const tierById = id => TIERS.find(t => t.id === id);

  class MasteryArena {
    constructor(app, root) {
      this.app = app;
      this.root = root;
      this.studentName = '';   // set by the app from the signed-in Google account
      this.newSession();
    }

    newSession() {
      this.params = {};
      this.state = {};
      TIERS.forEach(t => {
        this.params[t.id] = t.gen();
        this.state[t.id] = { status: 'open', tries: 0, feedback: '', fbType: '', hints: 0, picked: null };
      });
      this.optIn = undefined;   // standard-class students choose whether to try the ⭐ Honors tiers
      this.current = 1;
      this.render();
      this._changed();
    }

    _changed() { if (this.app.changed) this.app.changed(); }

    // Saved with the student's progress so a reload can't escape a penalty or reset the arena
    exportState() {
      return { v: ARENA_VERSION, params: this.params, state: this.state, current: this.current, optIn: this.optIn };
    }

    importState(o) {
      if (!o || o.v !== ARENA_VERSION || !o.params || !o.state) return;
      this.params = o.params;
      this.state = o.state;
      this.optIn = o.optIn;
      this.current = o.current;
      this.render();
    }

    setName(name) {
      this.studentName = name;
      this.render();
    }

    // Core tiers decide the grade (4 of 5 to pass)
    get score() { return CORE.filter(t => this.state[t.id].status === 'correct').length; }
    get finished() { return CORE.every(t => this.state[t.id].status !== 'open'); }
    get honorsScore() { return HONORS.filter(t => this.state[t.id].status === 'correct').length; }
    get honorsFinished() { return HONORS.every(t => this.state[t.id].status !== 'open'); }

    _honorsRequired() { return !!(this.app.honorsRequired && this.app.honorsRequired()); }
    _honorsActive() { return this._honorsRequired() || this.optIn === true; }

    // After the current tier: next open core tier, then (if passed) the Honors choice / tiers, then done
    _nextStop() {
      const core = CORE.find(t => this.state[t.id].status === 'open');
      if (core) return core.id;
      if (this.score < 4) return 'done';
      if (!this._honorsRequired() && this.optIn === undefined) return 'optin';
      if (this._honorsActive()) {
        const h = HONORS.find(t => this.state[t.id].status === 'open');
        if (h) return h.id;
      }
      return 'done';
    }

    get certificateReady() {
      return this.finished && this.score >= 4 && this._nextStop() === 'done';
    }

    _resolve(id, correct, feedback) {
      const t = tierById(id);
      const st = this.state[id];
      st.tries++;
      if (correct) {
        st.status = 'correct';
        st.fbType = 'good';
        st.feedback = feedback;
        window.soundFx.playChime();
        if (t.demo && this.app.previewConfig) {
          const d = t.demo(this.params[id]);
          this.app.previewConfig(d.mL, d.cargo, d.mR, true);
        }
      } else {
        window.soundFx.playBuzzer();
        const left = t.maxTries - st.tries;
        if (left <= 0) {
          st.status = 'missed';
          st.fbType = 'bad';
          st.feedback = feedback + ' <strong>No tries left on this tier.</strong>';
        } else {
          // Penalty: fresh values, so the next try can't reuse the last numbers
          this.params[id] = t.gen();
          st.hints = 0;
          st.fbType = 'bad';
          st.feedback = feedback + ` <strong>🔄 New values below. ${left} more ${left > 1 ? 'tries' : 'try'}.</strong>`;
        }
      }
      this.render();
      this._changed();
    }

    submitNum(id, raw) {
      const t = tierById(id);
      const p = this.params[id];
      const v = parseFloat(String(raw).replace(',', '.').replace(/[−–]/g, '-'));
      if (!isFinite(v)) { this._flash('Type a number first.'); return; }
      if (near(v, t.answer(p))) this._resolve(id, true, '✓ ' + t.explain(p));
      else {
        const d = t.diagnose ? t.diagnose(v, p) : null;
        this._resolve(id, false, '✗ ' + (d || 'Not quite. Try the 💡 hints.'));
      }
    }

    submitMC(id, idx) {
      const t = tierById(id);
      const opt = t.options(this.params[id])[idx];
      this.state[id].picked = idx;
      this._resolve(id, !!opt.ok, (opt.ok ? '✓ ' : '✗ ') + opt.why);
    }

    _flash(msg) {
      const el = this.root.querySelector('.task-flash');
      if (el) el.textContent = msg;
      window.soundFx.playBuzzer();
    }

    _tierHTML(t) {
      const p = this.params[t.id];
      const st = this.state[t.id];
      const open = st.status === 'open';
      let body = '';
      if (t.type === 'num') {
        const all = t.hints(p);
        const shown = Math.min(st.hints || 0, all.length);
        const list = all.slice(0, shown).map((h, i) => `<li><strong>Hint ${i + 1}:</strong> ${h}</li>`).join('');
        const more = open && shown < all.length ? `<button class="btn-hint" data-arena-hint="${t.id}">💡 ${shown ? 'Next hint' : 'Show a hint'} (${all.length - shown} left)</button>` : '';
        body = `<div class="hints">${list ? `<ol class="hint-list">${list}</ol>` : ''}${more}</div>
          <div class="answer-row">
            <input id="arenaIn${t.id}" type="number" inputmode="decimal" step="any" placeholder="your answer" ${open ? '' : 'disabled'}>
            <span class="unit">${t.unit}</span>
            <button class="btn-primary" data-arena-submit="${t.id}" ${open ? '' : 'disabled'}>Check</button>
          </div>`;
      } else {
        const opts = t.options(p);
        body = `<div class="mc-options">${(p.order || opts.map((_, i) => i)).map(i => {
          const o = opts[i];
          let cls = '';
          if (!open) cls = st.picked === i ? (o.ok ? 'right' : 'wrong') : (o.ok ? 'right' : 'dim');
          return `<button class="mc-btn ${cls}" data-arena-mc="${t.id}:${i}" ${open ? '' : 'disabled'}>${o.t}</button>`;
        }).join('')}</div><p class="arena-note">One try on this tier.</p>`;
      }
      const fb = st.feedback ? `<div class="feedback ${st.fbType === 'good' ? 'good' : 'bad'}">${st.feedback}</div>` : '';
      const stop = this._nextStop();
      const nextLabel = stop === 'done' ? 'See your results →' : stop === 'optin' ? 'Continue →' : 'Next tier →';
      const pos = t.honors ? `⭐ Honors tier ${HONORS.indexOf(t) + 1} of ${HONORS.length}` : `Tier ${t.id} of ${CORE.length}`;
      // Feedback sits right under the answer; the calculator comes after it (only while the tier is open)
      return `
        <section class="tier-card ${st.status}">
          <header><span class="tier-num">${t.icon} ${pos}</span><h3>${t.title}</h3>${t.honors ? '<span class="honors-chip">⭐ Honors</span>' : ''}</header>
          <div class="prompt">${t.text(p)}</div>
          ${body}
          <p class="task-flash" aria-live="assertive"></p>
          ${fb}
          ${open ? '' : `<div class="task-actions"><button class="btn-primary" data-arena-next>${nextLabel}</button></div>`}
          ${open && t.type === 'num' ? '<div class="calc-slot" id="calcSlot"></div>' : ''}
        </section>`;
    }

    render() {
      const score = this.score;
      if (this.current === undefined || this.current === null) this.current = this._nextStop();
      if (typeof this.current === 'number' && !tierById(this.current)) this.current = this._nextStop();

      const dots = [...CORE, ...(this._honorsActive() ? HONORS : [])].map(t => {
        const st = this.state[t.id].status;
        const cls = st === 'correct' ? 'good' : st === 'missed' ? 'bad' : (t.id === this.current ? 'now' : '');
        const mark = st === 'correct' ? '✓' : st === 'missed' ? '✗' : (t.honors ? '⭐' : t.id);
        return `<span class="tier-dot ${cls}" title="${t.title}">${mark}</span>`;
      }).join('');

      let body;
      if (this.current === 'optin') {
        body = `<section class="tier-card">
            <header><span class="tier-num">⭐ Honors</span><h3>Want an extra challenge?</h3></header>
            <div class="prompt"><p>You passed the Mastery Arena with <strong>${score} of 5</strong>! There are ${HONORS.length} ⭐ Honors questions you can try. They are optional for your class and do not change your score.</p></div>
            <div class="task-actions">
              <button class="btn-primary" data-arena-optin="yes">⭐ Yes, I'll try them</button>
              <button class="btn-secondary" data-arena-optin="no">No thanks, show my certificate</button>
            </div>
          </section>`;
      } else if (this.current === 'done') {
        body = score >= 4
          ? `<div class="arena-result good">🏆 You passed with ${score} of 5${this._honorsActive() ? ` (⭐ Honors: ${this.honorsScore} of ${HONORS.length})` : ''}! <button class="btn-primary" data-arena-cert>Open Certificate</button></div>`
          : `<div class="arena-result bad">${score} of 5 correct. You need 4 of 5. Review Steps 1–3, then try a new set. <button class="btn-secondary" data-arena-new>New Set of Questions</button></div>`;
      } else {
        body = this._tierHTML(tierById(this.current));
      }

      this.root.innerHTML = subHTML(`
        <div class="arena-head">
          <p class="arena-who">${this.studentName ? `👤 ${esc(this.studentName)}` : '👤 Guest: practice only, not graded'}</p>
          <div class="tier-dots" aria-label="Arena progress">${dots}</div>
          <div class="arena-score">
            <span class="score-big">${score}<small>/5</small></span>
            <span class="score-note">Need 4 of 5</span>
          </div>
        </div>
        ${body}`);
      if (this.app.mountCalc) this.app.mountCalc(this.root, `arena-${this.current}`);
    }

    // Move to the next stop and bring it into view
    next() {
      this.current = this._nextStop();
      window.soundFx.playClick();
      this.render();
      this._changed();
      if (window.revealCard) window.revealCard(this.root.querySelector('.tier-card, .arena-result'));
    }

    bind() {
      this.root.addEventListener('click', e => {
        const b = e.target.closest('button');
        if (!b || b.disabled) return;
        if (b.dataset.arenaSubmit) {
          const id = +b.dataset.arenaSubmit;
          this.submitNum(id, this.root.querySelector(`#arenaIn${id}`).value);
        } else if (b.dataset.arenaMc) {
          const [id, idx] = b.dataset.arenaMc.split(':').map(Number);
          this.submitMC(id, idx);
        } else if (b.dataset.arenaHint) {
          const st = this.state[+b.dataset.arenaHint];
          st.hints = (st.hints || 0) + 1;
          window.soundFx.playClick();
          this.render();
          this._changed();
        } else if (b.dataset.arenaOptin) {
          this.optIn = b.dataset.arenaOptin === 'yes';
          this.next();
        } else if (b.hasAttribute('data-arena-next')) this.next();
        else if (b.hasAttribute('data-arena-cert')) this.openCertificate();
        else if (b.hasAttribute('data-arena-new')) { window.soundFx.playClick(); this.newSession(); }
      });
      this.root.addEventListener('keydown', e => {
        if (e.key !== 'Enter' || e.target.tagName !== 'INPUT') return;
        const m = e.target.id.match(/^arenaIn(\d)/);
        if (m) this.submitNum(+m[1], e.target.value);
      });
    }

    openCertificate() {
      if (!this.certificateReady) return;
      const info = this.app.certificateInfo ? this.app.certificateInfo() : {};
      const name = info.name || 'Guest';
      const date = new Date();
      const tierLine = TIERS.map(t => `T${t.id} ${this.state[t.id].status === 'correct' ? '✓' : '✗'}`).join('  ');
      const code = `NSL-${fnv([name.toLowerCase(), info.points, this.score, date.toISOString().slice(0, 10), tierLine, 'f=ma'].join('|')).replace(/(.{4})(.{4})/, '$1-$2')}`;
      if (this.app.certificate) this.app.certificate(code);
      const honors = (info.honors || []).slice();
      if (this._honorsActive() && this.honorsFinished) honors.push(`Arena (${this.honorsScore} of ${HONORS.length})`);
      const $m = id => document.getElementById(id);
      $m('certName').textContent = name;
      $m('certPoints').textContent = `${info.points} / ${info.maxPoints} points`;
      $m('certPct').textContent = ` (${Math.round(info.points / info.maxPoints * 100)}%)`;
      $m('certSteps').textContent = `${info.stepsDone} of 3 complete`;
      $m('certArena').textContent = `${this.score} of 5 tiers correct`;
      $m('certHonors').textContent = honors.length ? `Completed: ${honors.join(', ')}` : 'Not attempted';
      $m('certClass').textContent = info.classLabel || '—';
      $m('certDate').textContent = date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
      $m('certCode').textContent = code;
      $m('certSaved').textContent = info.guest
        ? 'You are a guest, so this score is NOT saved or graded. Sign in with your school account to get credit.'
        : '✅ This score is saved to your school account. There is nothing to turn in.';
      document.getElementById('certModal').hidden = false;
      window.soundFx.playChime();
    }
  }

  window.MasteryArena = MasteryArena;
})();
