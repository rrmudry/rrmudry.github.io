# NGSS Standards Integration Patterns

## Architecture Overview
The NGSS integration system consists of three files:
- **`ngss-explorer/standards-data.js`**: Master data file containing all NGSS standard objects with `code`, `title`, `pe`, `sep`, `dci`, `ccc`, `domain`, `domainCode`, `is`, and `clarification` fields.
- **`assets/ngss-helper.js`**: The cross-site helper that provides the API and auto-initialization.
- **`assets/partials.js`**: Automatically loads `ngss-helper.js` on every page that includes `<script src="assets/partials.js">`.

## Loading Chain
```
Page loads → partials.js runs → injects header/footer partials
→ calls ensureNGSSHelperLoaded() → loads ngss-helper.js
→ NGSSHelper.autoInit() scans DOM for data attributes
→ standards-data.js loaded on-demand when first needed
```

## Three Data Attributes (Declarative API)

### 1. `data-ngss="CODE1,CODE2,..."` — Renders a full Standards Banner
Place on any visible `<div>` or container. NGSSHelper will render a styled banner card with clickable pill buttons:
```html
<div data-ngss="HS-PS2-1,HS-PS2-2,HS-PS2-3"></div>
```
**Result**: A glassmorphic card with "📚 NGSS Target Standards Alignment" header and clickable standard pills.

### 2. `data-ngss-is="IS_CODE"` — Renders all standards in an Instructional Segment
```html
<div data-ngss-is="IS1"></div>
```
**Result**: Automatically looks up all standards tagged with `is: "IS1"` and renders the same banner.

### 3. `data-ngss-code="CODE"` — Makes any element a click-to-open trigger
Place on any element (button, span, badge). Clicking it opens the standard's detail modal:
```html
<span data-ngss-code="HS-PS2-5">HS-PS2-5</span>
<button data-ngss-code="SEP-4">View SEP-4</button>
```

## Dashboard Lesson Card Integration
In dashboards, lesson cards render NGSS pill badges with this JS template pattern:
```javascript
// In the card template literal:
${day.standards ? `<div class="mt-2 flex flex-wrap gap-1">
    ${day.standards.map(s => `<span class="text-[9px] bg-UNIT_COLOR-950/80 
        text-UNIT_COLOR-300 border border-UNIT_COLOR-500/40 px-1.5 py-0.5 
        rounded font-mono font-bold" data-ngss-code="${s}">${s}</span>`).join('')}
</div>` : ''}
```

The pill badge colors vary per unit theme (emerald for Unit 1, lime for Unit 2, orange for Unit 4, etc.).

When a lesson card is expanded into a detail modal, a `data-ngss` container is dynamically inserted to render the full banner:
```javascript
// In the detail modal template:
html += `<div data-ngss="${day.standards.join(',')}"></div>`;
```

After dynamically injecting `data-ngss` containers, you MUST re-call `NGSSHelper.autoInit()`:
```javascript
if (window.NGSSHelper) NGSSHelper.autoInit();
```

## Programmatic API (Advanced)
```javascript
NGSSHelper.getStandard('HS-PS2-1');           // Single standard object
NGSSHelper.getStandardsByCodes(['HS-PS2-1', 'HS-PS3-5']); // Multiple
NGSSHelper.getStandardsByIS('IS1');            // All standards in segment
NGSSHelper.getStandardsByDomain('PS');         // All Physical Science
NGSSHelper.renderStandardsBanner(['HS-PS2-1'], containerEl); // Manual render
NGSSHelper.showStandardModal('HS-PS2-1');      // Open detail modal directly
```

## Known Pitfalls
- **Template elements are invisible to autoInit()**: `data-ngss` inside `<template>` tags will NOT be scanned because NGSSHelper queries the live DOM (`document.querySelectorAll`). Content must be in the active DOM.
- **Dynamic content requires re-init**: If you inject HTML with `data-ngss` attributes after page load (e.g., opening a modal drawer, loading lesson details via JS), you MUST call `NGSSHelper.autoInit()` again after injection. Otherwise the new elements won't have click handlers.
- **Duplicate banners**: If `autoInit()` runs multiple times on the same `data-ngss` container, it will re-render the banner (replacing innerHTML). This is safe but causes a visual flash. Avoid calling autoInit unnecessarily.
- **Root path calculation**: ngss-helper.js calculates `rootPath` from the URL path depth. Apps in subdirectories (e.g., `skydiving-game/index.html`) correctly resolve to `../ngss-explorer/standards-data.js`. But apps at root level resolve to `ngss-explorer/standards-data.js`. This works correctly for the current site structure.
- **Standards data must load first**: `ensureDataLoaded()` dynamically injects a `<script>` tag for `standards-data.js`. All rendering and lookup calls wrap in the callback. Never try to access `NGSS_STANDARDS_DATA` synchronously.

## Evidence
- Full NGSSHelper source analyzed from `assets/ngss-helper.js` (252 lines)
- Partials loading chain from `assets/partials.js` (79 lines)
- Dashboard integration patterns from all 6 unit dashboards
- Standalone webapp integration from `skydiving-game/index.html`
- `data-ngss-code` button variant from `accuracy-precision-art/index.html`
