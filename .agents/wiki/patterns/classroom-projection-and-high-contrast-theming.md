# Classroom Projection & High-Contrast Theming Pattern

## Context & Pedagogical Purpose
Physics classrooms present unique visual environments:
1. **Overhead Projector Washout**: Fluorescent classroom lighting and typical school projectors wash out dark backgrounds and subtle contrast gradients. What looks sleek on a modern OLED laptop becomes an unreadable muddy gray haze when projected across a bright 30-foot room.
2. **Chromebook Screen Limitations**: Low-cost student Chromebooks have TN or budget IPS panels with poor viewing angles and low maximum nit brightness.
3. **Back-Row Accessibility**: Students seated in the back row must be able to distinguish decimals, negative signs, units, graph gridlines, and mathematical fractions from 25–30 feet away.

Therefore, **High-Contrast Light Mode with Universal Root Font Scaling** is a mandatory standard across all teacher guides, calculation workbenches, interactive simulations, and unit dashboards.

---

## Architectural Requirements

### 1. Mandatory Dual-Theme Architecture (Dark Cosmic + High-Contrast Light)
Every student- or teacher-facing page must support instant theme switching via a persistent toggle button (`#btn-theme-toggle`):

```css
/* Dark Mode Palette (Default) */
:root {
  --bg-page: #070d19;
  --bg-header: rgba(7, 13, 25, 0.95);
  --bg-card: #0f172a;
  --bg-subcard: rgba(30, 41, 59, 0.7);
  --bg-input: #0b1324;
  --border-color: rgba(56, 189, 248, 0.25);
  --border-strong: rgba(56, 189, 248, 0.6);
  --border-subtle: rgba(255, 255, 255, 0.1);

  --text-main: #f8fafc;
  --text-muted: #94a3b8;
  --text-dim: #64748b;

  --accent-cyan: #38bdf8;
  --accent-emerald: #10b981;
  --accent-amber: #f59e0b;
  --accent-rose: #f43f5e;
  
  --canvas-bg: #070d19;
  --canvas-grid: #1e293b;
  --canvas-text: #cbd5e1;
}

/* HIGH-CONTRAST LIGHT THEME (Mandatory WCAG AAA Contrast) */
html.theme-light {
  --bg-page: #f1f5f9;
  --bg-header: rgba(255, 255, 255, 0.96);
  --bg-card: #ffffff;
  --bg-subcard: #f8fafc;
  --bg-input: #ffffff;
  --border-color: #cbd5e1;
  --border-strong: #0284c7;
  --border-subtle: #e2e8f0;

  /* Ink-slate text with >14:1 contrast ratio against white/light-slate */
  --text-main: #0f172a;
  --text-muted: #334155;
  --text-dim: #64748b;

  /* Darkened, high-saturation accents for white backgrounds */
  --accent-cyan: #0284c7;      /* Ocean blue instead of washed sky blue */
  --accent-emerald: #059669;   /* Forest emerald instead of light mint */
  --accent-amber: #d97706;     /* Deep amber instead of yellow-amber */
  --accent-rose: #e11d48;      /* Deep crimson */
  --accent-purple: #7c3aed;

  --shadow-card: 0 4px 16px rgba(0, 0, 0, 0.08);
  --canvas-bg: #ffffff;
  --canvas-grid: #e2e8f0;
  --canvas-text: #1e293b;
}
```

### 2. Strict Contrast Rules
- **No Washed-Out Grays**: Never use light gray (`#94a3b8` or `#cbd5e1`) for body text or labels in Light Mode. Body text must be `#0f172a` (contrast > 14:1) and secondary labels must be `#334155` (contrast > 7:1).
- **Darkened Accents in Light Mode**: A cyan that pops on dark backgrounds (`#38bdf8`) is almost invisible on white. Always override light mode accents with saturated, readable counterparts (e.g. `--accent-cyan: #0284c7;`).
- **Solid Borders**: Cards and input boxes in Light Mode must have clear, visible borders (`#cbd5e1`) so cards don't bleed into the background.

### 3. HTML5 Canvas Dynamic Theme Re-Rendering
Canvases do not automatically update CSS variables. Any page containing HTML5 graphs or simulations must wire the theme toggle to immediately re-render:

```javascript
function initThemeToggle() {
  const toggleBtn = document.getElementById('btn-theme-toggle');
  const root = document.documentElement;
  const savedTheme = localStorage.getItem('app_theme') || 'dark';
  applyTheme(savedTheme);

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const isLight = root.classList.contains('theme-light');
      const newTheme = isLight ? 'dark' : 'light';
      applyTheme(newTheme);
      localStorage.setItem('app_theme', newTheme);

      // MANDATORY: Re-render canvas graphs/simulations with updated palette
      if (typeof renderCanvas === 'function') {
        renderCanvas();
      }
    });
  }
}
```

### 4. Universal Root Font Scaling (Projector Mode)
For whole-classroom visibility, provide a font toggle group:
- `html.font-normal` (base `16px`)
- `html.font-large` (base `20px`)
- `html.font-huge` (base `25px` / 🖥️ Projector)

**Implementation Rule**: Always apply font classes to `document.documentElement` (`<html>`), NOT `<body>`. Since all layout cards, padding, math formulas, and typography use `rem` units, targeting `<html>` scales the entire application proportionally with zero layout clipping.

### 5. Sticky Navigation & Zero Horizontal Scrollbar
- Step navigation menus must be docked inside the sticky header (`position: sticky; top: 0; z-index: 100`) so buttons never scroll out of view when switching steps or scrolling down long pages.
- Navigation buttons must use responsive CSS Grid (`grid-template-columns: repeat(N, minmax(0, 1fr))`) without `overflow-x: auto` so a horizontal scrollbar is never generated, even in Projector mode.
