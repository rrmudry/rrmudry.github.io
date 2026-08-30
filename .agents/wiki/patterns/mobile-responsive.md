# Mobile Responsive Patterns

## Global Responsive Framework
The site uses a hybrid approach: **TailwindCSS CDN utilities** for layout (in dashboards) combined with **vanilla CSS** media queries (in `assets/theme.css` and app-specific stylesheets).

## Breakpoints Used

### From `assets/theme.css` (global)
| Breakpoint | Target |
|---|---|
| `@media (max-width: 900px)` | Tablet: header nav stacks vertically, brand shrinks |
| `@media (max-width: 640px)` | Mobile: menu, hero, footer all stack column |
| `@media (prefers-reduced-motion: reduce)` | Accessibility: disables all animations |

### From Tailwind utilities (dashboards)
Dashboards use Tailwind's responsive prefixes inline:
```html
<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
<span class="hidden md:flex ...">  <!-- Hide on mobile -->
```

## Known Working Patterns

### Container Pattern
```html
<!-- Dashboard pages -->
<div id="app-container" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

<!-- Theme.css pages -->
<div class="container">  <!-- uses var(--max-width): min(1080px, 92vw) -->
```

### Card Grid (Responsive)
```html
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <!-- Cards auto-stack on mobile -->
</div>
```

### Mobile Touch Controls (Games)
The skydiving game includes dedicated mobile touch controls that ONLY display on small screens:
```html
<div class="mobile-controls">  <!-- shown via CSS on small screens -->
    <div class="touch-dpad">
        <button class="touch-btn">▲</button>
        <!-- D-pad layout -->
    </div>
    <div class="touch-actions">
        <button class="touch-btn deploy-btn">PULL CHUTE</button>
    </div>
</div>
```
Games should always provide touch controls for mobile alongside keyboard controls.

### Viewport Meta Tag
All pages MUST include the standard viewport meta. Games that want to prevent pinch-zoom add `maximum-scale=1.0, user-scalable=no`:
```html
<!-- Standard pages -->
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<!-- Games (prevent zoom interference) -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
```

### Navigation Tabs on Mobile
Dashboard nav tabs use `overflow-x: auto` for horizontal scrolling on small screens:
```html
<nav class="flex gap-2 border-b border-white/10 overflow-x-auto">
    <button class="nav-btn">Overview</button>
    <button class="nav-btn">Lessons</button>
    <!-- ... -->
</nav>
```

## Known Pitfalls
- **Tailwind + vanilla CSS conflicts**: Dashboard pages load `cdn.tailwindcss.com` AND `assets/theme.css`. Tailwind's reset can override theme.css styles. If a dashboard element looks different from the main site, check for Tailwind specificity conflicts.
- **Font size on mobile**: Never set `font-size` below `11px` for body text or `9px` for badges — anything smaller is illegible on student phones.
- **Fixed backgrounds on iOS**: `position: fixed` backgrounds (`background-attachment: fixed`) can cause severe scroll jank on iOS Safari. Use `position: fixed` on a separate overlay `<div>` with `z-index: -1` instead (this is the pattern all dashboards use).
- **Glass card backdrop-filter on old Android**: `backdrop-filter: blur()` is not supported on some older Android Chrome versions. The cards still look fine because they have a solid-ish `background` color as fallback.
- **Modal max-height**: Detail modals use `max-height: 85vh; overflow-y: auto` to prevent overflow on short mobile screens.

## Evidence
- Global breakpoints from `assets/theme.css` (lines 457-518)
- Dashboard responsive utilities from `unit2-dashboard.html`, `unit7-dashboard.html`
- Mobile touch controls from `skydiving-game/index.html` (lines 38-54)
- Reduced-motion support from `assets/theme.css` (line 508)
