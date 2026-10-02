# Seasonal Theming Architecture: "Night at Orange High" Halloween Theme

> Pattern for an immersive seasonal theme that sets a mood across the site without touching instructional content, readability, or the standalone lab tools.

## Design Principles (learned from the first version)
The first Halloween theme (Oct 1, 2026) stacked many unrelated decorations (neon geometric webs, nav spiders, zombie hand, skeleton, Creepster on every card title) on top of the unchanged site. It read as stickers, made card text hard to read, and dimmed the Bell-Ringer card. The rewrite follows these rules:
1. **One atmosphere, one big idea.** A moonlit night scene plus a single signature concept, the *Graveyard of Dead Theories*, rather than many gimmicks.
2. **Readability is sacred.** The display font (`Jolly Lodger`) is used only for the hero `h1`, section headings, and epitaph titles. Card titles, body text, and buttons keep the site fonts and contrast. Nothing dims or covers the Bell-Ringer.
3. **Toys run real physics, at class conventions.** Scale: 100 px = 1 m, g = 10 m/s². Use Unicode, never LaTeX.
4. **Self-expiring.** It runs only in October. No hard-coded Halloween markup in shared partials.

## Files
| File | Role |
|---|---|
| `assets/halloween.css` | All styles, scoped under `body.halloween-active` (plus `.hw-*` elements the script creates). |
| `assets/halloween.js` | Scene engine, graveyard, Spooky Season menu, `window.HalloweenPhysics`. |
| `assets/partials.js` → `ensureHalloweenLoaded()` | Injects both files on every page that uses the shared header/footer, **only in October** and never inside iframes. Standalone studios and labs don't use partials, so they stay untouched. |

## Season Gate
- Active when `new Date().getMonth() === 9` (October), checked in both `partials.js` and `halloween.js`.
- Preview at any time with `?halloween=on`; force off with `?halloween=off`.
- Out of season, nothing is loaded (no CSS, no font, no menu).

## What Each `.hero` Gets (`HauntedHero` class)
- **One canvas** (`.hw-scene`, behind the hero content) draws: stars, a harvest moon with glow (pre-rendered sprites), clouds drifting across the moon, bat flocks, back fog, will-o'-wisps, candy, and floating labels.
- **Will-o'-wisps** wander and are pushed away from the cursor with inverse-square repulsion (a ∝ 1/r²), like charged particles.
- **Spider on a silk spring.** Desktop only, hanging in front of the moon. Damped mass-on-a-spring with gravity; the silk only pulls (`stretch > 0`). An invisible `.hw-spider-grab` handle lets students drag and fling it. The pluck sound's pitch scales with the release speed.
- **Graveyard of Dead Theories** (`.hw-graveyard`, DOM so it's accessible): six tombstone `<button>`s (Aristotle's falling bodies, impetus, caloric, luminiferous aether, phlogiston, geocentrism) open an epitaph popover (`role="dialog"`) with the claim, born/died, cause of death, and a quip. Focus moves to the close button; Esc or clicking outside closes it and returns focus. Two jack-o'-lantern buttons launch candy along projectile arcs (4.5–7.5 m/s, 55–125°) that bounce with restitution 0.45.
- Phones (< 760 px): no spider, smaller moon, 4 tombstones + 1 pumpkin (`hw-wide-only` hides the rest).
- The theme adds `margin-top` to the section after the hero, because some pages pull that section up with a negative margin over the graveyard.

## Performance & Accessibility
- DPR capped at 1.5; sprites pre-rendered once per resize.
- The rAF loop stops when the hero is off-screen (IntersectionObserver) or the tab is hidden.
- **Calm mode** (menu, or the default when `prefers-reduced-motion`): a still scene. The loop only runs for things a student triggered (candy, dragging the spider).
- **Sound is off by default**, synthesized with Web Audio, and only plays after a click.
- Menu (`.hw-hud`, bottom-right pumpkin) toggles Theme / Sound / Motion, persisted in `localStorage` keys `hw_theme`, `hw_sound`, `hw_motion`. Turning the theme off removes every element and listener (`destroy()`).

## Public API
`window.HalloweenPhysics = { active, dropCandy(x?, y?, count?), summonZombie(), summonBats() }`. `summonZombie` is kept for backward compatibility and now launches a bat flock.

## Reusing for Other Seasons
Copy the pattern: a month-gated loader in `partials.js`, one scoped stylesheet, and one script that adds a single scene per `.hero` plus one signature, curriculum-tied idea. Keep shared partials free of seasonal markup.
