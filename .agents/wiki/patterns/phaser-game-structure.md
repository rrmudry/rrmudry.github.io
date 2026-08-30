# Physics Game / Simulation Webapp Patterns

## Canonical Game Structure
Physics games and simulations follow a modular file structure:

```
game-name/
├── index.html          # HTML shell: header, canvas viewport, HUD, modals, controls
├── style.css           # Game-specific styles, HUD layout, mobile controls
├── game.js             # Main game loop, rendering, state management, UI wiring
├── physics.js          # Physics engine class (forces, drag, gravity, collisions)
├── particles.js        # Optional: particle effects (sparks, wind, trails)
├── audio.js            # Optional: sound effects and music manager
└── assets/             # Sprites, images, sounds
```

## HTML Shell Pattern
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>[Game Title] • Mr. Mudry's Physics</title>
    <link rel="icon" type="image/png" href="../head.png">
    <link rel="stylesheet" href="../assets/theme.css">
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <!-- Game Header -->
    <header class="game-header">
        <div class="logo-group">...</div>
        <div class="header-controls">
            <button id="btn-units">📐 FT / MPH</button>  <!-- Unit toggle -->
            <button id="btn-audio">🔊 Sound</button>
            <a href="../games.html" class="icon-btn">🏠 Hub</a>
        </div>
    </header>

    <main class="main-layout">
        <!-- Canvas Viewport -->
        <div class="game-viewport-shell">
            <canvas id="gameCanvas"></canvas>
            <!-- Mobile Touch Controls -->
            <div class="mobile-controls">...</div>
            <!-- Modal (pause/results) -->
            <div id="game-modal" class="game-modal-backdrop">...</div>
        </div>

        <!-- Side Panels: HUD, instructions, NGSS standards -->
        <div class="panel-card">
            <div data-ngss="HS-PS2-1,HS-PS2-2"></div>  <!-- NGSS integration -->
        </div>
    </main>

    <!-- Scripts: order matters -->
    <script src="../assets/scoreboard.js"></script>
    <script src="audio.js"></script>
    <script src="physics.js"></script>
    <script src="particles.js"></script>
    <script src="game.js"></script>
    <script src="../assets/partials.js"></script>  <!-- MUST be last -->
</body>
```

## Physics Engine Pattern
Games use a dedicated physics class with SI units:

```javascript
class PhysicsEngine {
    constructor(config = {}) {
        this.mass = config.mass || 75;      // kg
        this.gravity = config.gravity || 9.81; // m/s²
        this.rho0 = config.rho0 || 1.225;   // air density kg/m³
        // State
        this.x = 0; this.y = 0;
        this.vx = 0; this.vy = 0;
        this.state = 'ACTIVE';
    }

    update(dt) {
        // Calculate forces → net acceleration → integrate velocity → update position
        const dragForce = 0.5 * this.rho * this.Cd * this.A * this.vy * this.vy;
        const netForce = this.mass * this.gravity - dragForce;
        const accel = netForce / this.mass;
        this.vy += accel * dt;
        this.y -= this.vy * dt;
    }
}
```

Key patterns:
- Physics uses **real SI units** (meters, m/s, kg) internally
- Display converts to imperial (feet, mph) with a unit toggle
- Separate `update(dt)` and `render()` methods
- State machine pattern: `'FREEFALL' → 'DEPLOYING' → 'GLIDING' → 'LANDED'`

## Game Loop Pattern
```javascript
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.physics = new PhysicsEngine();
        this.lastTime = 0;
        this.isRunning = false;
    }

    gameLoop(timestamp) {
        const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05); // cap dt
        this.lastTime = timestamp;
        this.update(dt);
        this.render();
        if (this.isRunning) requestAnimationFrame(t => this.gameLoop(t));
    }
}
```

## Score Integration
Games submit scores via the standard Firebase pattern (see `firebase-auth-gotchas.md`).
Alternatively, simpler games use `assets/scoreboard.js` for a lightweight leaderboard.

## NGSS Integration
Games MUST include NGSS standards alignment:
- Place `<div data-ngss="HS-PS2-1,...">` in the side panel or instructions section
- `partials.js` (loaded last) triggers `NGSSHelper.autoInit()` to render the standard badges

## Known Pitfalls
- **Canvas sizing**: Always resize canvas on window resize. Use `canvas.width = container.clientWidth` in a ResizeObserver or resize handler.
- **dt capping**: Always cap `dt` to prevent physics explosions after tab switches: `Math.min(dt, 0.05)`.
- **Script load order**: `partials.js` must load LAST because it triggers NGSSHelper which scans the DOM. If it loads before game scripts render their content, NGSS elements may be missed.
- **Touch vs keyboard**: All games must support BOTH keyboard controls AND mobile touch controls. Use `touchstart`/`touchend` events mapped to the same actions as keyboard keys.
- **Sprite assets**: Use Sprite Gen Studio (`https://rrmudry.github.io/Sprite_Gen/`) for custom character sprites when needed.

## Evidence
- File structure from `skydiving-game/` (7 files)
- Physics engine from `skydiving-game/physics.js` (211 lines, SkydivingPhysics class)
- HTML shell from `skydiving-game/index.html` (319 lines)
- Additional game dirs: `Cannon_duel/`, `Missile_command/`, `epic-ttt/`
