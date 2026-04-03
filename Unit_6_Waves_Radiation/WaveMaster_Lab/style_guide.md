# Design & Style Guide: WaveMaster Lab

This guide documents the design system and UI/UX patterns implemented in **WaveMaster Lab**. Use these standards to maintain consistency across future interactive physics modules.

---

## 📐 Target Constraints (Student Hardware)

To ensure maximum compatibility with student Chromebooks and laptops, modules are optimized for the following viewport:

- **Standard Resolution**: 1280 x 720 (720p).
- **Vertical Strategy**: Keep the primary interactive canvas "Above the Fold." 
  - Minimize header height (`py-2.5`).
  - Use secondary canvas heights (e.g., 160px) to prevent excessive scrolling.
  - Limit main container padding to `p-4` or `p-3` on mobile/small-screen profiles.

---

## 🎨 Color Palette

The project uses a curated **Electric Cyan** (`physics`) and **Slate Gray** palette to provide a technical, high-contrast look suitable for scientific simulations.

| Scale | Hex Code | Usage |
| :--- | :--- | :--- |
| **Physics 50** | `#f0f9ff` | Backgrounds for success cards / highlights |
| **Physics 500** | `#0ea5e9` | Primary Brand Color / Main UI actions |
| **Physics 600** | `#0284c7` | Hover states / Darker text on lights |
| **Slate 50** | `#f8fafc` | Page body background |
| **Slate 200** | `#e2e8f0` | Subtle borders / Grid lines |
| **Slate 900** | `#0f172a` | Primary text |
| **Orange 500** | `#f97316` | **Scaffolding / Alerts**: "Guidance Node" and warnings |
| **Indigo 900** | `#312e81` | **Metrics Panels**: High-contrast dark backgrounds for overlays |
| **Emerald 500** | `#10b981` | **Success / Mastery**: Feedback for completed objectives |

---

## Typography

Modern, legible fonts selected for clear hierarchy and scientific readability.

- **Headings**: `Outfit` (sans-serif)
  - Used for Page titles, Card headers, and Module tabs.
  - *Weights*: 600 (Semibold), 700 (Bold).
- **Body UI**: `Inter` (sans-serif)
  - Used for instructions, descriptions, and labels.
  - *Weights*: 400 (Regular), 500 (Medium).
- **Technical/Timing**: `JetBrains Mono` (monospace)
  - Used for stopwatches, cycle counts, and equation displays.

---

## 🏛️ Layout Architecture

### 1. The Multi-Column Grid
The layout uses a 3-column responsive grid:
- **Left Column (`lg:col-span-2`)**: Primary interactive canvas area.
- **Right Column (`lg:col-span-1`)**: Controls and Knowledge Check stack.
- **Inner Padding**: `p-4` or `p-5` for cards; `gap-6` for main layout.

### 2. The Glassmorphism Overlay
Used for floating metrics (`#mod2-overlay`) to provide depth without obscuring the simulation.
```css
.glass-panel {
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.07);
}
```

---

## 🧪 Simulation Standards (HTML5 Canvas)

### 1. "Energy" Glow Effect
Physics-based objects should feel "alive." Use `shadowBlur` to represent energy.
```javascript
ctx.shadowBlur = 12;
ctx.shadowColor = '#0ea5e9'; // Match main color
ctx.lineWidth = 4;
```

### 2. Measurement Brackets
Brackets for wavelength/amplitude should use a high-contrast red (`#ef4444`) with a background pill behind text for readability.
- **Text Style**: `bold 12px Outfit, sans-serif`
- **Tick Style**: 6px perpendicular lines at endpoints.

---

## 🛠️ Tailwind Theme Configuration
Include this in the `<head>` of new modules to inherit the theme:
```javascript
tailwind.config = {
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                heading: ['Outfit', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            },
            colors: {
                physics: {
                    50: '#f0f9ff', 100: '#e0f2fe', 200: '#bae6fd', 
                    300: '#7dd3fc', 400: '#38bdf8', 500: '#0ea5e9', 
                    600: '#0284c7', 700: '#0369a1', 800: '#075985', 
                    900: '#0c4a6e', 950: '#082f49'
                }
            }
        }
    }
}
```

---

## 🚀 UX Polish Checklist
- [ ] **Tab Transitions**: Use `cubic-bezier(0.4, 0, 0.2, 1)` for smooth module switching.
- [ ] **Slider Feedback**: Place value labels closer to the runner (`-top-5`).
- [ ] **Mobile First**: Use `w-full h-auto` on canvases for responsive scaling.
- [ ] **Interactivity Builders**: Use visual countdowns (3-2-1) for race/timed events.
