# Dashboard Layout Patterns

## Canonical Dashboard Structure
All unit dashboards (`unit1-dashboard.html` through `unit7-dashboard.html`) follow this structure:

```
DOCTYPE html
html (lang="en" class="dark-theme")
├── head
│   ├── meta charset, viewport
│   ├── title: "Unit N Dashboard: [Topic Name]"
│   ├── favicon: assets/unitN-favicon.svg (or .png)
│   ├── TailwindCSS CDN: https://cdn.tailwindcss.com
│   ├── Chart.js CDN: https://cdn.jsdelivr.net/npm/chart.js
│   ├── Google Fonts: Inter + Fira Code (+ optional display font)
│   ├── theme.css: assets/theme.css
│   └── <style> block with unit-specific CSS variables & custom classes
├── body
│   ├── Decorative background layer (fixed, z-index: -1)
│   ├── <div data-include="header">  ← partials.js injects site header
│   ├── #app-container (max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12)
│   │   ├── <header> with unit badge, title, subtitle
│   │   ├── Navigation tabs (nav-btn buttons, horizontal scroll on mobile)
│   │   ├── Content sections (.content-section with scroll-margin-top: 100px)
│   │   │   ├── Unit Overview section (Gemini AI summary, topic cards)
│   │   │   ├── Daily Lesson Log section (cards with NGSS pill badges)
│   │   │   ├── Resources section (linked materials)
│   │   │   └── Assessment section (if applicable)
│   │   └── Modals (lesson detail drawers, NGSS popovers)
│   ├── <div data-include="footer">  ← partials.js injects site footer
│   └── <script src="assets/partials.js">
```

## Unit-Specific Theming Pattern
Each dashboard customizes CSS variables in a `:root` or `<style>` block to give a unique visual identity:

| Unit | Theme | Accent Colors | Background |
|------|-------|---------------|------------|
| Unit 1 (Intro) | Emerald/Science | `--accent`: emerald-500 | #020617 |
| Unit 2 (Kinematics) | Volt Lime/Speed | `--accent-volt: #ccff00` | #040804 |
| Unit 4 (Momentum) | Orange/Impact | orange-500 tones | #020617 |
| Unit 5 (Thermo) | Red/Heat | `--accent-flame` reds | Dark charcoal |
| Unit 6 (Waves) | Indigo/Cyan | cyan/indigo gradient | #020617 |
| Unit 7 (E&M) | Amber/Blue/Spark | `--accent-spark: #fbbf24` | #020617 |

## Glass Card Pattern (Critical)
Every dashboard uses the `.glass-card` class with this exact pattern:

```css
.glass-card {
    background: rgba(15, 23, 42, 0.6);   /* varies per unit */
    backdrop-filter: blur(16px);
    border: 1px solid rgba(ACCENT, 0.2);
    border-radius: 16px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
}

.glass-card:hover {
    transform: translateY(-5px);
    border-color: var(--accent);
    box-shadow: 0 15px 40px rgba(ACCENT, 0.2), inset 0 0 20px rgba(ACCENT, 0.15);
}
```

## Navigation Tab Pattern
Dashboards use horizontal tab navigation with a glowing underline indicator:

```css
.nav-btn.active::after {
    content: "";
    position: absolute; bottom: 0; left: 0; width: 100%; height: 2px;
    background: var(--accent);
    box-shadow: 0 0 10px var(--accent);
}
```

## Daily Lesson Card & Modal Tiering Pattern (Graded vs Learning vs Practice)
Lesson cards and detail modal popups (`openLessonModal`) must clearly distinguish between graded assignments, reference resources, and practice sandboxes to eliminate student confusion:
- **At-a-glance pacing badges**: Rendered on the pacing card header:
  - `📝 GRADED WORK` (Amber/gold) if the day includes an assignment requiring submission or automated gradebook logging.
  - `📖 LESSON & NOTES` (Indigo/slate) if the day focuses on instructional slides and notes.
  - `🧪 PRACTICE` (Cyan/teal) if the day is an ungraded interactive sandbox.
- **Categorized Modal Tiers (`renderCategorizedLinksHtml` / `categorizeLessonLinks`)**:
  1. **🎯 Graded Assignments & Required Coursework**: Amber/gold glowing card with `SUBMISSION REQUIRED` badge, submission type tag (`Cloud Auto-Saved ✓`, `Canvas LMS`, etc.), point value hint, and actionable button.
  2. **📖 Learning Resources & Slide Decks**: Slate/indigo card with `STUDY & REFERENCE ONLY · NO TURN-IN NEEDED` badge, file type indicator (PPTX, DOCX, Slides), and preview link.
  3. **🧪 Practice Tools & Simulation Sandboxes**: Cyan/teal card with `OPTIONAL · UNGRADED` badge and launch button.
- **Backwards Compatibility**: The `categorizeLessonLinks(day)` function automatically categorizes legacy flat `links: { "Label": "url" }` objects via keyword and URL regex heuristics, while supporting explicit `assignments: []`, `resources: []`, and `practice: []` data arrays.
- **Absent Makeup Integration**: `missing-work.html` uses the same three-tier categorization so absent students instantly see what must be submitted to earn credit versus what slides to review.

Clicking a lesson card opens a detail drawer/modal containing expanded details, categorized links, and a `data-ngss` container for the full NGSS banner.

## Known Pitfalls
- **TailwindCSS CDN + custom CSS**: Dashboards use BOTH `cdn.tailwindcss.com` AND a `<style>` block. Tailwind utility classes and custom CSS coexist — don't use `@apply` since there's no build step.
- **Partials load order**: `partials.js` must be loaded AFTER the main content DOM. Place it at the bottom of `<body>`. It auto-loads `ngss-helper.js` which runs `autoInit()`.
- **Scroll margin**: Content sections need `scroll-margin-top: 100px` to account for the sticky header when using anchor navigation.
- **Decorative backgrounds**: Each unit has a unique fixed background (dot grids, speed lines, breadboard patterns). These use `position: fixed; z-index: -1` and MUST include a gradient overlay `::after` to fade the bottom.

## Evidence
- Patterns extracted from all 6 existing dashboards (unit1 through unit7, no unit3)
- Glass card pattern confirmed consistent across all dashboards
- Navigation tab pattern consistent across all dashboards
