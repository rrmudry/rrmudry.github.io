---
name: create-physics-game
description: Build a physics simulation or game webapp with canvas rendering, real-physics engine, Firebase auth, score submission, mobile touch controls, and NGSS standards alignment.
---
# Create Physics Game

## When to Use
Activate this skill when:
- Building a new physics simulation, game, or interactive lab
- Creating any webapp that uses HTML5 Canvas for rendering
- Building anything requiring animated sprites or real-time physics

## Pre-Flight: Read Wiki Patterns
Before starting, read these wiki pattern pages:
- [phaser-game-structure](../../wiki/patterns/phaser-game-structure.md) — file structure, physics engine, game loop
- [firebase-auth-gotchas](../../wiki/patterns/firebase-auth-gotchas.md) — auth gateway, score submission
- [ngss-integration](../../wiki/patterns/ngss-integration.md) — standards badges in side panels
- [mobile-responsive](../../wiki/patterns/mobile-responsive.md) — touch controls, viewport meta

## Steps

### 1. Create Directory Structure
```
game-name/
├── index.html       # HTML shell
├── style.css        # Game-specific styles
├── game.js          # Main game loop and rendering
├── physics.js       # Physics engine class
└── assets/          # Sprites, images, sounds
```
Optionally add `particles.js` and `audio.js` for effects.

### 2. Set Up HTML Shell
- Use the canonical structure from `phaser-game-structure.md`
- Include `../assets/theme.css` for base styles
- Add mobile viewport meta: `maximum-scale=1.0, user-scalable=no`
- Include mobile touch controls alongside keyboard controls

### 3. Build Physics Engine
- Use **real SI units** internally (meters, m/s, kg, N)
- Provide imperial/metric display toggle for students
- Implement state machine: `'ACTIVE' → 'PAUSED' → 'COMPLETED'`
- Cap `dt` at 0.05s to prevent physics explosions

### 4. Implement Game Loop
```javascript
gameLoop(timestamp) {
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05);
    this.lastTime = timestamp;
    this.update(dt);
    this.render();
    if (this.isRunning) requestAnimationFrame(t => this.gameLoop(t));
}
```

### 5. Wire Firebase Auth & Scoring (if graded)
Follow the patterns in `firebase-auth-gotchas.md`:
- Firebase compat CDN imports
- Domain-restricted Google Sign-In
- Percentage-based score submission with highest-score retention
- Unique `ASSIGNMENT_ID`

### 6. Add NGSS Standards
Place `<div data-ngss="HS-PS2-1,...">` in the instructions/side panel.
Load `partials.js` as the LAST script in the HTML.

### 7. Generate Sprite Assets (if needed)
Use [Sprite Gen Studio](https://rrmudry.github.io/Sprite_Gen/) for custom character sprites.

### 8. Verify
- Test keyboard AND touch controls
- Verify canvas resizes on window resize
- Check physics accuracy with known values
- Test Firebase score submission flow
- Verify NGSS popover modals work
- Test on mobile (375px width)

## Post-Task: Update Wiki
After completing the game, update relevant wiki patterns:
- New game architecture decisions → `phaser-game-structure.md`
- Any auth/scoring issues → `firebase-auth-gotchas.md`
- Mobile control patterns → `mobile-responsive.md`
- Append entry to `wiki/logs.md`
