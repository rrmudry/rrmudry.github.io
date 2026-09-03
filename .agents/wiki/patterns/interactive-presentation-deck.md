# Interactive Presentation & Educational Slide Deck Pattern

## Overview
Interactive presentation webapps serve as dual-mode instructional engines:
1. **Slideshow / Lecture Mode**: Fullscreen, keyboard-navigable (`ArrowRight`, `ArrowLeft`, `Spacebar`, `Home`, `End`), progress-tracked, high-contrast slide projector presentation with collapsible presenter notes for teachers.
2. **Interactive Study Mode**: Responsive, all-in-one scrollable learning module allowing students to explore curriculum concepts, run mini-labs, adjust simulation parameters, and verify understanding at their own pace.

## Strict No-LaTeX Standard
Under workspace rules, LaTeX math markup (`$...$`, `\vec`, `\Delta`, `\frac`) is strictly forbidden due to missing math engines and combining diacritic glyph breakage.
- **Formulas**: Format using semantic HTML tags (`<sup>`, `<sub>`, `<strong>`) and Unicode characters:
  - Delta: `Δ` (`Δx = x_f - x_i`, `Δr = (Δx, Δy)`)
  - Vectors: Bold variables (e.g., `|Δr| = √(Δx² + Δy²)`)
  - Roots: `√(...)`
  - Angles & Trig: `θ = tan⁻¹(|Δy| / |Δx|)`
  - Units & Powers: `20°C`, `10 s`, `5 kg`, `m/s²`

## Architecture & File Structure
```
Unit_X/presentation-name/
├── index.html       # Slide markup, dual-mode containers, interactive cards
├── style.css        # Glassmorphic panels, CSS custom properties, slide transitions
└── presentation.js  # Slide navigation controller, Web Audio API sound FX, physics canvases
```

## Core Implementation Features
1. **Web Audio API Sound Synthesis**:
   - Zero external audio assets required.
   - Synthesize smooth UI clicks (`650Hz` decay), slide whooshes (`220Hz` triangle sweep), and success chords (`C-E-G-C` major triad) natively.
2. **Interactive Physics Canvases**:
   - HTML5 2D Canvas with device pixel ratio scaling.
   - Real-time mouse and touch dragging for vector exploration.
3. **Presenter Notes Drawer**:
   - Collapsible drawer keyed to each slide providing timing cues, discussion questions, and pedagogical pointers.
4. **Dual-Mode Toggle**:
   - Toggling `.study-mode` on `document.body` displays all slides stacked cleanly in a structured reading layout while hiding presentation-specific controls.
