---
name: create-unit-dashboard
description: Create or modify a physics unit dashboard page with NGSS standards alignment, daily lesson cards, glassmorphic theming, and the Cosmic Adventure design system.
---
# Create Unit Dashboard

## When to Use
Activate this skill when:
- Creating a new `unitN-dashboard.html` page
- Adding or modifying sections in an existing unit dashboard
- Troubleshooting dashboard layout, theming, or NGSS rendering issues

## Pre-Flight: Read Wiki Patterns
Before starting, read these wiki pattern pages:
- [dashboard-layout](../../wiki/patterns/dashboard-layout.md) — HTML structure, glass cards, nav tabs
- [ngss-integration](../../wiki/patterns/ngss-integration.md) — NGSS data attributes and re-init
- [mobile-responsive](../../wiki/patterns/mobile-responsive.md) — breakpoints, container patterns

## Steps

### 1. Scaffold from Latest Dashboard
Copy the most recent dashboard (currently `unit7-dashboard.html`) as a starting template. This ensures you inherit the latest structural patterns.

### 2. Configure Unit Theme
In the `<style>` block, define unit-specific CSS custom properties:
```css
:root {
    --accent-primary: #NEW_ACCENT_COLOR;
    --font-tech: 'Inter', sans-serif;
    --font-mono: 'Fira Code', monospace;
}
```
Follow the color palette conventions documented in `dashboard-layout.md`.

### 3. Create Decorative Background
Each dashboard has a unique `position: fixed; z-index: -1` background. Use radial gradients, dot patterns, or animated elements that match the unit's physics theme. Always include a gradient overlay `::after` to fade the bottom.

### 4. Set Up Data Include Partials
```html
<div data-include="header"></div>
<!-- ... main content ... -->
<div data-include="footer"></div>
<script src="assets/partials.js"></script>  <!-- MUST be at bottom of body -->
```

### 5. Build Content Sections
Each section uses the class `.content-section` with `scroll-margin-top: 100px`:
- **Unit Overview**: Topic introduction, Gemini AI summary, concept cards
- **Daily Lesson Log**: Cards generated from a JS data array with NGSS pill badges
- **Resources**: Links to activities, simulations, worksheets
- **Assessment**: If applicable

### 6. Wire Up NGSS Standards
- Lesson card pills: `<span data-ngss-code="HS-PS2-5">HS-PS2-5</span>`
- Detail modals: `<div data-ngss="${day.standards.join(',')}"></div>`
- After dynamic content injection: `if (window.NGSSHelper) NGSSHelper.autoInit();`

### 7. Verify
- Check mobile responsiveness at 375px width
- Verify NGSSHelper popover modals open on pill click
- Test horizontal tab scroll on mobile
- Verify glass card hover effects work

## Post-Task: Update Wiki
After completing the dashboard, update relevant wiki patterns with any new insights:
- New theme color values → `dashboard-layout.md`
- Any NGSS rendering issues → `ngss-integration.md`
- Mobile layout fixes → `mobile-responsive.md`
- Append entry to `wiki/logs.md`
