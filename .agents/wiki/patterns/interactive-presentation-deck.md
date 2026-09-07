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
4. **Printable Student Guided Notes & Handout (`#handoutModal`)**:
   - Rather than stacking slides in an awkward full-page scroll, provide a dedicated **Printable Student Handout** modal.
   - Formatted specifically for standard 8.5" × 11" paper (or interactive science notebooks): includes student metadata blanks, core conceptual definitions, the formula triangle diagram with the 3 equation derivations, the 5-step GUESS protocol grid, and guided/scaffolded practice problems.
   - Includes a one-click **🖨️ Print / Save PDF** trigger (`window.print()`) with clean `@media print` CSS that isolates the handout sheet, applies pure black-and-white high-contrast text, and suppresses all slide projector UI and headers.
   - Supported via hotkey `H` (or `Escape` to close).

## 📺 Classroom TV Projection & 25-Foot Legibility Standards
When slides are projected onto large classroom TVs (e.g. dual 65"–85" screens) where students are seated 20–25+ feet away:
1. **Typography Hierarchy for 25-Foot Legibility**:
   - **Slide Titles**: `clamp(2.4rem, 3.4vw, 3.8rem)` bold, high-contrast `#ffffff`.
   - **Body Text & Bullet Points**: `clamp(1.35rem, 1.6vw, 1.75rem)` with color `#f1f5f9` (never dark gray or low-contrast muted text).
   - **Core Formulas**: `clamp(4.2rem, 5.8vw, 6.2rem)` with glowing text-shadow (`0 0 30px rgba(0, 242, 254, 0.55)`).
   - **Worked Examples & Cards**: Minimum `1.25rem`–`1.45rem` font sizes; inline math blocks at `1.3rem`–`1.4rem`.
   - **Interactive Vote/Quiz Choices**: `1.5rem`–`1.75rem` bold with 48px circular option badges (`A`, `B`, `C`, `D`).
2. **Widescreen Stage Utilization**:
   - Stage container must scale to `min(1560px, 94vw)` to eliminate dead horizontal black bars on 16:9 1080p and 4K TVs.
3. **Dedicated TV Mode & Hotkeys**:
   - Add `.tv-mode` on `body` (toggled via button or `T` key) that scales container to `min(1760px, 96vw)` and boosts `--font-scale` by 15–20%.
   - Support `F` for Fullscreen toggle (`requestFullscreen()`), `+`/`-` for dynamic zoom, and `0` for zoom reset.
