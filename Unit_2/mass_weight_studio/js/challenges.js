// Mastery Arena: "Mythbusters: Deep Space Edition"
// 5 scenario questions with randomized numbers and option order, one locked-in answer each.
// Each correct answer = 1 gradebook point (5 of the 10). 4 / 5 also unlocks the certificate.

const PASS_SCORE = 4;
const RANK_PERMS = ['ABC', 'ACB', 'BAC', 'BCA', 'CAB', 'CBA'];

class MasteryArena {
  constructor({ state, save, getCrates, getLog, switchTab, guest }) {
    this.state = state;
    this.guest = !!guest;
    this.save = save;
    this.getCrates = getCrates;
    this.getLog = getLog;
    this.switchTab = switchTab;
    this.root = document.getElementById('arenaQuestions');
    this.results = document.getElementById('arenaResults');
    this.progress = document.getElementById('arenaProgress');
    this.attemptLabel = document.getElementById('arenaAttempt');

    if (!this.state.questions) {
      this.state.questions = MasteryArena.buildQuestions(this.getCrates());
      this.save();
    }

    this.bindCertificate();
    this.render();
  }

  // ------------------------------------------------------------------
  // Question generation
  // ------------------------------------------------------------------
  static buildQuestions(crates) {
    const opts = (list) => {
      const shuffled = MWS.shuffle(list.map((text, i) => ({ id: 'o' + i, text, correct: i === 0 })));
      return { options: shuffled.map(({ id, text }) => ({ id, text })), correctId: 'o0' };
    };

    const anvil = MWS.pick([40, 50, 60]);
    const tourist = MWS.pick([55, 62, 70]);
    const sat = MWS.pick([800, 1200, 2500]);
    const ship = MWS.pick([8000, 10000, 15000]);
    const fmt = (n) => n.toLocaleString('en-US');

    const q1 = {
      id: 'q1', type: 'mc', title: 'The Soda Can Crusher',
      scenario: `An astronaut floats outside the space station, where everything is weightless (W = 0 N). They place an empty aluminum soda can between two floating ${anvil} kg tungsten anvils, then shove the anvils toward each other.`,
      prompt: 'What happens to the soda can?',
      ...opts([
        `It gets crushed. The anvils weigh 0 N, but each still has ${anvil} kg of mass. Once they're moving, their inertia resists stopping.`,
        'It stays unharmed. Weightless anvils have nothing heavy to push with.',
        'It gets only a tiny dent, because objects in space lose most of their mass.',
        'The anvils drift apart before touching it, because nothing in space can be pushed.'
      ]),
      explanation: `Crushed! Weight disappeared (0 N), but each anvil kept all ${anvil} kg of mass. Mass is inertia: once the anvils are moving they resist being stopped, so the can gets flattened just like it would on Earth.`
    };

    const q2 = {
      id: 'q2', type: 'mc', title: 'The Bathroom Scale Dilemma',
      scenario: `A ${tourist} kg space tourist packs an ordinary spring bathroom scale for a trip to the International Space Station so they can keep track of their mass.`,
      prompt: 'What does the scale read when they stand on it while floating inside the ISS?',
      ...opts([
        'Zero. The tourist and the scale are falling around Earth together, so the tourist doesn\'t press on the scale. A bathroom scale can\'t measure mass in orbit.',
        `${tourist} kg, the same as on Earth, because mass never changes.`,
        'A little less than on Earth, because the ISS is farther from Earth\'s center.',
        'A negative number, because the tourist is floating upward.'
      ]),
      explanation: 'It reads 0. A bathroom scale only measures how hard you press on it. In orbit, you and the scale fall together, so you don\'t press at all. Your mass is unchanged, though. Astronauts measure mass with an "inertia balance" that times how hard they are to shake back and forth, because mass IS inertia.'
    };

    const q3 = {
      id: 'q3', type: 'mc', title: 'The Deep-Space Satellite Kick',
      scenario: `A stranded spacewalker kicks a floating ${fmt(sat)} kg communications satellite to push it away. The satellite weighs 0 N out there.`,
      prompt: 'Why does the astronaut hurt their foot?',
      ...opts([
        `The satellite's ${fmt(sat)} kg of mass gives it huge inertia. It resists starting to move, so the foot slams into it like kicking a boulder on Earth.`,
        'Space has no air, so the satellite is locked in place and can\'t move at all.',
        'The satellite\'s engines automatically fire back against the kick.',
        'Space is so cold that the satellite\'s metal becomes extra hard.'
      ]),
      explanation: `Weight is 0 N, but inertia is all ${fmt(sat)} kg of mass. The satellite barely changes its motion when kicked, so the foot takes a brutal impact, exactly like kicking an anvil on Earth. (Being weightless does not mean it is easy to move!)`
    };

    // Q4: forensic ranking of the three sealed crates
    const byLabel = {};
    crates.forEach(c => { byLabel[c.label] = c; });
    const rank = (fn) => ['A', 'B', 'C'].sort((a, b) => fn(byLabel[b]) - fn(byLabel[a])).join('');
    const answers = {
      volume: rank(MWS.volumeOf),
      mass: rank(c => c.mass),
      mars: rank(c => c.mass * 3.7)
    };
    const biggest = answers.volume[0];
    const heaviest = answers.mass[0];
    const q4 = {
      id: 'q4', type: 'rank', title: 'Mystery Crate Forensic Ranking',
      scenario: 'Three sealed cargo crates (A, B, and C) arrived on the station. You may NOT open them. Use the three stations to investigate each crate, then record your evidence in the log.',
      prompt: 'Rank the crates from GREATEST to LEAST for each property.',
      properties: [
        { key: 'volume', label: 'Volume (space it takes up)', hint: 'Station 1' },
        { key: 'mass', label: 'Mass (inertia)', hint: 'Station 3 nudge test, or Station 2 with W = m · g' },
        { key: 'mars', label: 'Weight on Mars', hint: 'Station 2 → Mars' }
      ],
      answers,
      explanation: `Correct rankings: Volume ${answers.volume.split('').join(' > ')}, Mass ${answers.mass.split('').join(' > ')}, Weight on Mars ${answers.mars.split('').join(' > ')}. Crate ${biggest} is the BIGGEST, but Crate ${heaviest} has the MOST mass, so size does not tell you inertia. Notice that the Mars weight ranking matches the mass ranking exactly: on any one planet, W = m · g, so more mass means more weight.`
    };

    const q5 = {
      id: 'q5', type: 'mc', title: 'The Lunar Cargo Ship Paradox',
      scenario: `A ${fmt(ship)} kg cargo ship coasts from Earth toward the Moon. Halfway there, far from any planet, it fires its engines to slow down. Compare that to stopping the exact same ship, moving at the same speed, as it slides across a perfectly frictionless sheet of ice on Earth.`,
      prompt: 'Does stopping the ship in deep space take less engine burn?',
      ...opts([
        `No. It takes the same burn. Stopping depends on the ship's mass (its inertia), and the ${fmt(ship)} kg never changes.`,
        'Yes. The ship weighs 0 N in deep space, so it is much easier to stop.',
        'Yes. No burn is needed at all, because moving objects in space slow down and stop on their own.',
        'No. It takes MORE burn in space, because there is no gravity to help slow it down.'
      ]),
      explanation: `Same burn! Being weightless doesn't make the ship any less stubborn. Its ${fmt(ship)} kg of mass resists being stopped exactly the same way in deep space as on frictionless ice on Earth. And without a stopping force it would coast forever (Newton's First Law).`
    };

    return [q1, q2, q3, q4, q5];
  }

  // ------------------------------------------------------------------
  // State helpers
  // ------------------------------------------------------------------
  get answers() {
    if (!this.state.answers) this.state.answers = {};
    return this.state.answers;
  }

  score() {
    return Object.values(this.answers).filter(a => a.correct).length;
  }

  answeredCount() {
    return Object.keys(this.answers).length;
  }

  isComplete() {
    return this.answeredCount() === 5;
  }

  // ------------------------------------------------------------------
  // Rendering
  // ------------------------------------------------------------------
  render() {
    const qs = this.state.questions;
    this.attemptLabel.textContent = `Attempt #${this.state.attempt}`;
    this.root.innerHTML = '';
    qs.forEach((q, i) => this.root.appendChild(q.type === 'rank' ? this.renderRank(q, i) : this.renderMC(q, i)));
    this.renderProgress();
    this.renderResults();
  }

  renderProgress() {
    const qs = this.state.questions;
    this.progress.innerHTML = qs.map((q, i) => {
      const a = this.answers[q.id];
      const cls = a ? (a.correct ? 'pip correct' : 'pip wrong') : 'pip';
      const sym = a ? (a.correct ? '✓' : '✗') : i + 1;
      return `<span class="${cls}" title="Question ${i + 1}">${sym}</span>`;
    }).join('') + `<span class="pip-score">${this.score()} / 5</span>`;
  }

  cardShell(q, i) {
    const a = this.answers[q.id];
    const card = document.createElement('article');
    card.className = 'q-card' + (a ? (a.correct ? ' is-correct' : ' is-wrong') : '');
    card.id = `card-${q.id}`;
    card.innerHTML = `
      <header class="q-head">
        <span class="q-num">Q${i + 1}</span>
        <h3 class="q-title">${q.title}</h3>
        <span class="q-status">${a ? (a.correct ? '✓ Correct' : '✗ Incorrect') : 'Not answered'}</span>
      </header>
      <p class="q-scenario">${q.scenario}</p>
      <p class="q-prompt">${q.prompt}</p>`;
    return card;
  }

  feedbackEl(q) {
    const a = this.answers[q.id];
    const fb = document.createElement('div');
    fb.className = 'feedback-box' + (a ? (a.correct ? ' success' : ' error') : '');
    fb.setAttribute('aria-live', 'polite');
    if (a) fb.innerHTML = `<strong>${a.correct ? '✓ Myth busted!' : '✗ Not quite.'}</strong> ${q.explanation}`;
    return fb;
  }

  renderMC(q, i) {
    const a = this.answers[q.id];
    const card = this.cardShell(q, i);
    const list = document.createElement('div');
    list.className = 'q-options';
    list.setAttribute('role', 'radiogroup');
    q.options.forEach((opt, k) => {
      const label = document.createElement('label');
      label.className = 'q-option';
      if (a) {
        if (opt.id === q.correctId) label.classList.add('opt-correct');
        else if (opt.id === a.choice) label.classList.add('opt-wrong');
      }
      label.innerHTML = `
        <input type="radio" name="${q.id}" value="${opt.id}" ${a ? 'disabled' : ''} ${a && a.choice === opt.id ? 'checked' : ''}>
        <span class="opt-letter">${'ABCD'[k]}</span>
        <span class="opt-text">${opt.text}</span>`;
      list.appendChild(label);
    });
    card.appendChild(list);

    if (!a) {
      const btn = document.createElement('button');
      btn.className = 'btn-primary q-submit';
      btn.textContent = '🔒 Lock In Answer';
      btn.addEventListener('click', () => {
        const sel = card.querySelector(`input[name="${q.id}"]:checked`);
        if (!sel) {
          window.soundFx.playBuzzer();
          btn.textContent = 'Pick an answer first';
          setTimeout(() => { btn.textContent = '🔒 Lock In Answer'; }, 1400);
          return;
        }
        this.submit(q, { choice: sel.value, correct: sel.value === q.correctId });
      });
      card.appendChild(btn);
    }
    card.appendChild(this.feedbackEl(q));
    return card;
  }

  renderRank(q, i) {
    const a = this.answers[q.id];
    const card = this.cardShell(q, i);

    // Evidence status from the shared log
    const log = this.getLog();
    const crates = this.getCrates();
    const have = (key) => crates.filter(c => log[c.id] && log[c.id][key] != null).length;
    const ev = document.createElement('div');
    ev.className = 'evidence-status';
    ev.innerHTML = `
      <span class="ev-title">Your evidence so far:</span>
      <span class="ev-chip ${have('volume') === 3 ? 'done' : ''}">📐 Volume ${have('volume')}/3</span>
      <span class="ev-chip ${have('mars') === 3 ? 'done' : ''}">🔴 Mars weight ${have('mars')}/3</span>
      <span class="ev-chip ${have('nudge') === 3 ? 'done' : ''}">✋ Nudge speed ${have('nudge')}/3</span>
      <span class="ev-go">
        <button type="button" class="btn-mini" data-go="volume">Station 1</button>
        <button type="button" class="btn-mini" data-go="weight">Station 2</button>
        <button type="button" class="btn-mini" data-go="inertia">Station 3</button>
      </span>`;
    ev.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => this.switchTab(b.dataset.go, 'crateA')));
    card.appendChild(ev);

    const grid = document.createElement('div');
    grid.className = 'rank-grid';
    q.properties.forEach(p => {
      const row = document.createElement('div');
      row.className = 'rank-row';
      const chosen = a ? a.choice[p.key] : '';
      const right = a ? chosen === q.answers[p.key] : null;
      row.innerHTML = `
        <label class="rank-label" for="rank-${p.key}">
          <strong>${p.label}</strong>
          <small>${p.hint}</small>
        </label>
        <select id="rank-${p.key}" class="select-input ${a ? (right ? 'sel-correct' : 'sel-wrong') : ''}" ${a ? 'disabled' : ''}>
          <option value="">Greatest → least…</option>
          ${RANK_PERMS.map(r => `<option value="${r}" ${chosen === r ? 'selected' : ''}>${r.split('').join(' > ')}</option>`).join('')}
        </select>`;
      grid.appendChild(row);
    });
    card.appendChild(grid);

    if (!a) {
      const btn = document.createElement('button');
      btn.className = 'btn-primary q-submit';
      btn.textContent = '🔒 Lock In Rankings';
      btn.addEventListener('click', () => {
        const choice = {};
        let missing = false;
        q.properties.forEach(p => {
          choice[p.key] = card.querySelector(`#rank-${p.key}`).value;
          if (!choice[p.key]) missing = true;
        });
        if (missing) {
          window.soundFx.playBuzzer();
          btn.textContent = 'Rank all three properties first';
          setTimeout(() => { btn.textContent = '🔒 Lock In Rankings'; }, 1600);
          return;
        }
        const correct = q.properties.every(p => choice[p.key] === q.answers[p.key]);
        this.submit(q, { choice, correct });
      });
      card.appendChild(btn);
    }
    card.appendChild(this.feedbackEl(q));
    return card;
  }

  refreshEvidence() {
    if (this.answers.q4) return;
    const q4 = this.state.questions.find(q => q.id === 'q4');
    const old = document.getElementById('card-q4');
    if (!q4 || !old) return;
    // Preserve in-progress selections across re-render
    const keep = {};
    q4.properties.forEach(p => {
      const el = old.querySelector(`#rank-${p.key}`);
      if (el) keep[p.key] = el.value;
    });
    const fresh = this.renderRank(q4, this.state.questions.indexOf(q4));
    q4.properties.forEach(p => {
      const el = fresh.querySelector(`#rank-${p.key}`);
      if (el && keep[p.key]) el.value = keep[p.key];
    });
    old.replaceWith(fresh);
  }

  async submit(q, result) {
    this.answers[q.id] = result;
    if (result.correct) window.soundFx.playChime();
    else window.soundFx.playBuzzer();
    if (this.isComplete() && !this.state.completedAt) {
      this.state.completedAt = new Date().toISOString();
      this.state.code = await MasteryArena.verificationCode(this.certPayload());
    }
    this.save();
    const y = window.scrollY;
    this.render();
    window.scrollTo({ top: y });
  }

  renderResults() {
    if (!this.isComplete()) {
      const left = 5 - this.answeredCount();
      this.results.className = 'arena-results';
      this.results.innerHTML = `<p class="results-pending">${left} question${left === 1 ? '' : 's'} left. Score at least <strong>4 / 5</strong> to earn your certificate.</p>`;
      return;
    }
    const sc = this.score();
    const passed = sc >= PASS_SCORE;
    this.results.className = 'arena-results ' + (passed ? 'passed' : 'failed');
    this.results.innerHTML = `
      <div class="results-score">${sc} / 5 <span>(${sc * 20}%)</span></div>
      <p class="results-msg">${passed
        ? (this.guest
          ? '🏆 <strong>Deep Space Dynamics Specialist!</strong> You busted the myths. <em>Guest mode:</em> this score is NOT in the gradebook. Press "Sign in for credit" at the top to save it to your account.'
          : '🏆 <strong>Deep Space Dynamics Specialist!</strong> You busted the myths, and your score is saved to your school account automatically.')
        : '🚧 <strong>Not quite a certificate yet</strong> (that takes 4 / 5). Your best question score counts toward your grade. Review the explanations, revisit the stations, then retake with brand-new scenarios and crates.'}</p>
      <div class="results-actions">
        ${passed ? '<button type="button" id="btnOpenCert" class="btn-cert">🎓 View Certificate</button>' : ''}
        <button type="button" id="btnRetake" class="btn-secondary">🔁 Retake with New Scenarios</button>
      </div>`;
    const open = document.getElementById('btnOpenCert');
    if (open) open.addEventListener('click', () => this.openCertificate());
    document.getElementById('btnRetake').addEventListener('click', () => this.retake());
  }

  retake() {
    const msg = `Start attempt #${this.state.attempt + 1}? You'll get new questions and three NEW mystery crates to measure. Your best score so far is kept. Retaking can only raise it.`;
    if (!window.confirm(msg)) return;
    if (this.onRetake) this.onRetake();
    this.state.questions = MasteryArena.buildQuestions(this.getCrates());
    this.state.answers = {};
    this.state.completedAt = null;
    this.state.code = null;
    this.save();
    this.render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ------------------------------------------------------------------
  // Certificate & submission summary
  // ------------------------------------------------------------------
  certPayload() {
    const marks = this.state.questions.map(q => (this.answers[q.id] && this.answers[q.id].correct ? '1' : '0')).join('');
    const crates = this.getCrates().map(c => `${c.label}${c.mass}`).join('');
    return `MWS-D24|${this.state.name}|${this.score()}|${marks}|${this.state.attempt}|${this.state.completedAt}|${crates}`;
  }

  static async verificationCode(str) {
    let hex = '';
    try {
      if (window.crypto && crypto.subtle && window.TextEncoder) {
        const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
        hex = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
      }
    } catch (e) { hex = ''; }
    if (!hex) {
      // FNV-1a fallback (e.g. pages opened from file:// where SubtleCrypto is unavailable)
      const fnv = (seed) => {
        let h = seed >>> 0;
        for (let i = 0; i < str.length; i++) {
          h ^= str.charCodeAt(i);
          h = Math.imul(h, 16777619) >>> 0;
        }
        return h.toString(16).padStart(8, '0');
      };
      hex = fnv(2166136261) + fnv(0x9e3779b9);
    }
    const c = hex.slice(0, 12).toUpperCase();
    return `${c.slice(0, 4)}-${c.slice(4, 8)}-${c.slice(8, 12)}`;
  }

  completedLabel() {
    return new Date(this.state.completedAt).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
    });
  }

  summaryText() {
    const sc = this.score();
    const marks = this.state.questions.map((q, i) => `Q${i + 1} ${this.answers[q.id] && this.answers[q.id].correct ? '✔' : '✘'}`).join('  ');
    return [
      'Mass, Weight & Zero-G Inertia Studio: Mythbusters Deep Space Edition (Unit 2, Day 24)',
      `Student: ${this.state.name}`,
      `Score: ${sc} / 5 (${sc * 20}%)${sc >= PASS_SCORE ? ' PASSED' : ''}`,
      `Completed: ${this.completedLabel()}`,
      `Attempt: ${this.state.attempt}`,
      `Verification: ${this.state.code}`,
      marks
    ].join('\n');
  }

  bindCertificate() {
    this.modal = document.getElementById('modalCert');
    document.getElementById('btnCloseCert').addEventListener('click', () => this.closeCertificate());
    this.modal.addEventListener('click', (e) => { if (e.target === this.modal) this.closeCertificate(); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal.classList.contains('open')) this.closeCertificate();
    });
    document.getElementById('btnPrintCert').addEventListener('click', () => window.print());
    document.getElementById('btnCopySummary').addEventListener('click', () => this.copySummary());
  }

  openCertificate() {
    if (!this.isComplete() || this.score() < PASS_SCORE) return;
    const sc = this.score();
    document.getElementById('certName').textContent = this.state.name;
    document.getElementById('certScore').textContent = `${sc} / 5 (${sc * 20}%)`;
    document.getElementById('certDate').textContent = this.completedLabel();
    document.getElementById('certAttempt').textContent = `#${this.state.attempt}`;
    document.getElementById('certCode').textContent = this.state.code;
    document.getElementById('copyStatus').textContent = '';
    this.modal.classList.add('open');
    document.body.classList.add('modal-open');
    document.getElementById('btnCopySummary').focus();
    window.soundFx.playFanfare();
  }

  closeCertificate() {
    this.modal.classList.remove('open');
    document.body.classList.remove('modal-open');
  }

  async copySummary() {
    const text = this.summaryText();
    const status = document.getElementById('copyStatus');
    let ok = false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        ok = true;
      }
    } catch (e) { ok = false; }
    if (!ok) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      ta.remove();
    }
    status.textContent = ok
      ? '✓ Copied! (Your grade already syncs automatically. Paste this only if your teacher asks.)'
      : 'Copy was blocked. Select the summary below and copy it by hand:\n\n' + text;
    window.soundFx.playClick();
  }
}
