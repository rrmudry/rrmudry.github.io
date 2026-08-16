# Rule: No LaTeX Math Notation (Use Plain Text & Unicode)

## Context & Rationale
The site (`rrmudry.github.io`) is built using vanilla HTML/JS/CSS and does not include client-side LaTeX rendering engines (such as MathJax or KaTeX). Writing raw LaTeX notation (such as `$v = x/t$` or `$\vec{v}$`) causes raw dollar signs, backslashes, or broken missing-glyph boxes ("tofu" / `[?]`) to appear in the student interface. Combining diacritical arrow marks (`\u20D7` / `⃗`) also fail to render consistently in system fonts.

## Mandatory Rules for Formulas & Math

1. **Never use LaTeX delimiters or commands**:
   - ❌ **Forbidden**: `$v = \Delta x / \Delta t$`, `$\vec{v}$`, `$x_0$`, `$\frac{1}{2}at^2$`, `\( ... \)`.

2. **Use Clean Plain Text, Unicode Symbols, or HTML Tags**:
   - ✅ **Delta**: Use standard Unicode delta `Δ` (e.g., `Δx / Δt`, `Δy / Δx`).
   - ✅ **Subscripts & Superscripts**: Use Unicode numerals/superscripts (e.g., `x₀`, `v₀`, `m/s²`, `½`) or HTML tags (`x<sub>0</sub>`, `m/s<sup>2</sup>`).
   - ✅ **Fractions & Rates**: Use inline slash notation (e.g., `v = x / t`, `m = Δy / Δx`, `a = Δv / Δt`).
   - ✅ **Vectors**: Use standard bold typography (e.g., `<strong>v</strong> = Δ<strong>x</strong> / Δt`) or descriptive labels (`(velocity with direction)`) rather than combining arrow diacritics (`⃗`).
