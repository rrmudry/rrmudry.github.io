// Impact Velocity & Vector Angle Workbench — Floating Scientific Calculator
// Built-in degree-mode trigonometry (tan⁻¹), square roots (√), and 1-click active field insertion

class ScientificCalculator {
  constructor(containerEl, onInsertCallback) {
    this.container = containerEl;
    this.onInsert = onInsertCallback || null;
    this.expr = '';
    this.lastResult = null;
    this.render();
    this.bindEvents();
  }

  render() {
    this.container.innerHTML = `
      <div class="calc-widget">
        <div class="calc-display-wrap">
          <div class="calc-mode-indicator">MODE: DEG (Degrees) · g = 10 m/s²</div>
          <div class="calc-history" id="calcHistory"></div>
          <div class="calc-screen" id="calcScreen">0</div>
        </div>
        <div class="calc-keypad">
          <div class="calc-row">
            <button type="button" class="calc-btn btn-fn" data-op="sqrt">√</button>
            <button type="button" class="calc-btn btn-fn" data-op="sqr">x²</button>
            <button type="button" class="calc-btn btn-fn" data-op="atan">tan⁻¹</button>
            <button type="button" class="calc-btn btn-fn" data-op="c">C</button>
            <button type="button" class="calc-btn btn-fn" data-op="back">⌫</button>
          </div>
          <div class="calc-row">
            <button type="button" class="calc-btn btn-num" data-val="7">7</button>
            <button type="button" class="calc-btn btn-num" data-val="8">8</button>
            <button type="button" class="calc-btn btn-num" data-val="9">9</button>
            <button type="button" class="calc-btn btn-op" data-op="/">÷</button>
            <button type="button" class="calc-btn btn-fn" data-op="(">(</button>
          </div>
          <div class="calc-row">
            <button type="button" class="calc-btn btn-num" data-val="4">4</button>
            <button type="button" class="calc-btn btn-num" data-val="5">5</button>
            <button type="button" class="calc-btn btn-num" data-val="6">6</button>
            <button type="button" class="calc-btn btn-op" data-op="*">×</button>
            <button type="button" class="calc-btn btn-fn" data-op=")">)</button>
          </div>
          <div class="calc-row">
            <button type="button" class="calc-btn btn-num" data-val="1">1</button>
            <button type="button" class="calc-btn btn-num" data-val="2">2</button>
            <button type="button" class="calc-btn btn-num" data-val="3">3</button>
            <button type="button" class="calc-btn btn-op" data-op="-">−</button>
            <button type="button" class="calc-btn btn-insert" id="btnCalcInsert" title="Insert result into currently focused input box">⏎ Insert</button>
          </div>
          <div class="calc-row">
            <button type="button" class="calc-btn btn-num btn-zero" data-val="0">0</button>
            <button type="button" class="calc-btn btn-num" data-val=".">.</button>
            <button type="button" class="calc-btn btn-op" data-op="+">+</button>
            <button type="button" class="calc-btn btn-eval" data-op="=">=</button>
          </div>
        </div>
      </div>
    `;
    this.screenEl = this.container.querySelector('#calcScreen');
    this.historyEl = this.container.querySelector('#calcHistory');
  }

  bindEvents() {
    this.container.querySelectorAll('.calc-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        const val = btn.dataset.val;
        const op = btn.dataset.op;
        if (val !== undefined) this.appendDigit(val);
        else if (op) this.handleOp(op);
      });
    });

    const insertBtn = this.container.querySelector('#btnCalcInsert');
    if (insertBtn) {
      insertBtn.addEventListener('click', e => {
        e.preventDefault();
        this.insertResult();
      });
    }
  }

  appendDigit(d) {
    if (this.expr === '0' && d !== '.') this.expr = '';
    this.expr += d;
    this.updateScreen();
  }

  handleOp(op) {
    if (op === 'c') {
      this.expr = '';
      this.lastResult = null;
      this.historyEl.textContent = '';
      this.screenEl.textContent = '0';
      return;
    }
    if (op === 'back') {
      this.expr = this.expr.slice(0, -1);
      this.updateScreen();
      return;
    }
    if (op === '=') {
      this.evaluate();
      return;
    }
    if (op === 'sqrt') {
      // Evaluate current or wrap
      if (this.lastResult !== null && this.expr === '') {
        const v = Math.sqrt(this.lastResult);
        this.historyEl.textContent = `√(${this.lastResult})`;
        this.lastResult = v;
        this.expr = String(v);
        this.screenEl.textContent = this.formatDisplay(v);
        return;
      }
      this.expr += 'sqrt(';
      this.updateScreen();
      return;
    }
    if (op === 'sqr') {
      if (this.lastResult !== null && this.expr === '') {
        const v = this.lastResult * this.lastResult;
        this.historyEl.textContent = `(${this.lastResult})²`;
        this.lastResult = v;
        this.expr = String(v);
        this.screenEl.textContent = this.formatDisplay(v);
        return;
      }
      this.expr += '^2';
      this.updateScreen();
      return;
    }
    if (op === 'atan') {
      // arctan in degrees
      this.expr += 'atan(';
      this.updateScreen();
      return;
    }
    // Standard operators
    this.expr += op;
    this.updateScreen();
  }

  evaluate() {
    if (!this.expr) return;
    try {
      let code = this.expr
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/−/g, '-')
        .replace(/\^2/g, '**2');

      // Replace sqrt(...) with Math.sqrt(...)
      code = code.replace(/sqrt\(/g, 'Math.sqrt(');

      // Replace atan(...) with Math.atan(...) * 180 / Math.PI for DEGREES
      code = code.replace(/atan\(/g, '(180/Math.PI)*Math.atan(');

      // Sanitize: allow only numbers, math functions, operators
      if (!/^[0-9+\-*/().\s*MathsqrtanPI]+$/.test(code)) {
        throw new Error('Invalid expression');
      }

      // Safe evaluation
      const result = Function(`"use strict"; return (${code})`)();
      if (!isFinite(result)) throw new Error('Math error');

      this.historyEl.textContent = this.expr + ' =';
      this.lastResult = result;
      this.expr = '';
      this.screenEl.textContent = this.formatDisplay(result);
    } catch (err) {
      this.screenEl.textContent = 'Error';
      this.lastResult = null;
    }
  }

  updateScreen() {
    this.screenEl.textContent = this.expr || '0';
  }

  formatDisplay(v) {
    if (Math.abs(v - Math.round(v)) < 1e-7) return String(Math.round(v));
    return Number(v.toFixed(3)).toString();
  }

  insertResult() {
    if (this.lastResult === null) this.evaluate();
    if (this.lastResult !== null && this.onInsert) {
      this.onInsert(this.formatDisplay(this.lastResult));
    }
  }
}

window.ScientificCalculator = ScientificCalculator;
