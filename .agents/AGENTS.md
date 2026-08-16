# Workspace Rules & Guidelines

## 📚 Standard Practice: Automatic & Daily NGSS Standards Alignment
Whenever creating, modifying, or updating unit dashboards, lesson plans, daily activities, assignments, or student webapps across `rrmudry.github.io`:

1. **Daily Lesson Standards Tagging (Mandatory)**:
   - Every daily lesson entry in `assets/lessons-data.js` or unit lesson JSON files MUST include an explicit `standards` array (e.g. `standards: ["HS-PS2-5", "HS-PS3-5"]`).
   - Daily lesson cards on dashboards must render standard pill badges (`<span data-ngss-code="HS-PS2-5">HS-PS2-5</span>`).

2. **Declarative HTML Standards Alignment**:
   - Unit overview sections and modal drawers MUST include container elements with `data-ngss` attributes (e.g. `<div data-ngss="HS-PS2-1,HS-PS2-2"></div>`) or `data-ngss-is` attributes (e.g. `<div data-ngss-is="IS1"></div>`).

3. **Automatic Script Execution**:
   - Because `assets/partials.js` automatically loads `assets/ngss-helper.js` on every page, calling `NGSSHelper.autoInit()` scans the DOM and converts standard tags into interactive, click-to-open popover modals containing full 3D components (SEPs, DCIs, CCCs) and clarification boundaries.

## 🚫 No LaTeX Math Notation (Strict Policy)
Never use LaTeX syntax (e.g. `$v = x/t$`, `\Delta`, `\vec{v}`, `\frac{}{}`) in HTML, lesson descriptions, dashboard overviews, or UI labels.
- **Why**: The site does not use MathJax/KaTeX, and combining diacritics (`⃗`) render as broken missing-glyph boxes.
- **Required**: Use standard plain text, Unicode symbols, and HTML tags:
  - Delta: `Δ` (e.g. `Δx / Δt`, `Δy / Δx`)
  - Subscripts/Superscripts: `x₀`, `v₀`, `m/s²`, `½`, or HTML `<sub>`/`<sup>`
  - Fractions/Formulas: `v = x / t`, `x(t) = x₀ + vt + ½at²`
  - Vectors: Bold variables (e.g. `<strong>v</strong> = Δ<strong>x</strong> / Δt`) instead of combining arrow characters (`⃗`)
