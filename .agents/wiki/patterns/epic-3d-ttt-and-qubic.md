# 3D Tic-Tac-Toe & 4×4×4 Qubic Spatial Engine Pattern

## Context & Pedagogical Purpose
Traditional 2D Tic-Tac-Toe has a very small state space (9 cells, 8 winning lines) and easily devolves into forced draws. In contrast, **3D Tic-Tac-Toe** extends the grid into three dimensions:
1. **3×3×3 Classic (27 cells)**: 49 winning lines across 3 floors. However, taking the center cell (Floor 2, Row 2, Col 2) controls 13 lines and guarantees a first-player win.
2. **4×4×4 Qubic (64 cells)**: 76 winning lines (48 orthogonal, 24 planar diagonals, 4 space diagonals). Because there is no single central cell, corners and internal cells share identical intersection weights (7 lines each), making it a deeply tactical, chess-like game with rich counterplay and unblockable combination attacks.

---

## Architecture & Core Features

### 1. Mathematical Line Generation
Any line of length $N$ in 3D space is determined by start coordinate $(x, y, z)$ and directional step $(dx, dy, dz)$ where $dx, dy, dz \in \{-1, 0, 1\}$, normalized so the first non-zero component is positive:
- **1D Orthogonal Lines** (rows, columns, pillars): Exactly 1 non-zero component.
  - $N=3$: 27 lines
  - $N=4$: 48 lines
- **2D Planar Diagonals** (lying on horizontal floors or vertical walls): Exactly 2 non-zero components.
  - $N=3$: 18 lines
  - $N=4$: 24 lines
- **3D Space Diagonals** (cutting corner-to-corner through the 3D cube): All 3 components non-zero.
  - $N=3$: 4 lines
  - $N=4$: 4 lines
- **Total**: 49 lines for $N=3$; 76 lines for $N=4$.

### 2. Dual-View Interface Architecture
- **3D Hologram Cube**:
  - Rendered with CSS 3D transforms (`transform-style: preserve-3d; perspective: 1200px`).
  - Smooth mouse drag and touch swipe rotation via Pointer Events (`pointerdown`, `pointermove`, `pointerup`).
  - Layer elevation slider (`Layer Gap`) that separates floating decks along the Z axis, preventing lower floors from being occluded.
  - Camera presets (Isometric, Front, Top-Down, Reset) and toggleable ambient Auto-Spin.
- **Exploded 2D Layer Slices**:
  - Horizontal or grid display of each floor (Floor 1 to Floor $N$).
  - Full 1:1 state and hover synchronization: hovering over a cell in 2D lights up the 3D cell simultaneously, and vice versa.
  - Real-time coordinate HUD inspector (`Floor Z, Row Y, Col X`).

### 3. Cyber-Master AI Engine
- **Rookie (Easy)**: 55% random choices, takes obvious winning lines.
- **Tactician (Medium)**: Always takes immediate wins, blocks opponent wins, evaluates multi-line intersections.
- **Cyber-Master (Hard / Unbeatable)**:
  - Immediate win & immediate block detection.
  - Fork detection: evaluates moves that create $\ge 2$ unblockable winning threats.
  - For $N=3$: Alpha-beta minimax lookahead with threat ordering (<15ms).
  - For $N=4$: Smart 2-ply candidate search with threat extension (<25ms).

### 4. Educational Scaffolding: Threat Radar
- Toggleable **Threat Radar**: Scans all 49 or 76 lines in real time.
- Any line with $N-1$ marks of any player and 1 open cell triggers a flashing alert banner and highlights the threatened cells with animated pulsing borders.
- Trains students to spot 3D diagonals and spatial vectors.

### 5. Accessibility, Web Filter & Audio
- **Zero unpkg.com & Zero in-browser Babel**: Native Vanilla JS and CSS.
- **Web Audio API**: Self-contained polyphonic sound synthesis (sine, square, triangle, sawtooth, resonant frequency slides) requiring zero external audio assets.
- **WCAG AAA High-Contrast Light Mode**: `#btn-theme-toggle` switching between Cyberpunk Dark and high-contrast Light mode ($\ge 14:1$ contrast ratio for classroom projectors).
- **Universal Root Font Scaling**: `html.font-normal` (16px), `html.font-large` (19px), `html.font-huge` (23px / Projector Mode).
