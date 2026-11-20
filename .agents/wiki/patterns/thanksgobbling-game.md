# Thanksgobbling (Thanksgiving gunner game)

> `thanksgobbling/` is a seasonal 3D game linked from `games.html`. It is not a graded studio, so it has no saving, classes or Firestore.

## Concept
Students fly in the *Gravy Boat*, a cargo plane circling the town at 115 m altitude, 135 m radius. Orbit speed is a setting: Calm 8 m/s (default, one lap every 106 s), Normal 14 m/s, or Fast 22 m/s. The teacher found 22 m/s dizzying because the ground-locked view spins the town 9° per second. There is no camera bob. Turkeys walk in from the woods toward the feast hall, and the student drops cranberries (rapid fire), sweet potatoes (5 per load) or pumpkin pie (single shot, huge splat) on them. Turkeys at the tables drain the feast meter. Neighbors with blue rings carry pies to the hall, and splatting one costs points. After each wave the student picks one of three kitchen upgrades.

## Physics (class conventions)
- g = 10 m/s², 1 unit = 1 m.
- Each shot leaves at the weapon's launch speed **relative to the plane**, plus the plane's own velocity (200, 150 and 110 m/s).
- By default, the "ballistic computer" (`solveLaunch`) finds the launch direction that lands on the crosshair. It iterates t so that |(D − ½gt²)/t − v_plane| = launch speed.
- With the computer off, shots go straight down the crosshair line. An orange diamond shows where they will actually land (it is clamped to the screen edge and blinks when off screen).
- The HUD shows fall time, and how far a turkey walks in that time (3 m/s × t), so students learn to lead moving targets.
- The bank angle comes from tan θ = v²/(g r).

## Controls
The gimbal is locked to a ground point (`aim`) and the camera always looks at it, so the view stays steady as the plane orbits.
- Input moves `aimGoal`, and the crosshair (`aim`) eases toward it (rate 14/s, settles in about 0.15 s at 60 fps). The teacher found the first, direct mouse mapping too fast and jumpy.
- Base speed is 0.0012 rad/px, scaled by field of view and the Aim speed setting (Slow 0.6 / Normal 1 / Fast 1.5, `settings.sens`). Each pointer-lock event is capped at 120 px to ignore spikes.
- Desktop: pointer lock. Mouse to look, left click to fire, right click or Z to zoom, 1/2/3 or the wheel to switch food, R to reload, WASD to look with keys.
- Touch: drag to look, FIRE and ZOOM buttons. These appear on the first touch, so they also work on touchscreen Chromebooks.

## Tech
- Three.js 0.160 from jsdelivr via import map.
- `world.js` builds everything as InstancedMeshes: houses, trees, props, and the turkey and neighbor merged vertex-color geometry.
- `audio.js` synthesizes every sound (propeller drone, gobbles, splats, a folk music loop).
- If the first 5 s of play run under 28 fps, graphics auto-drop to Fast (1024 shadow map, pixel ratio 1).
- Settings are stored in `localStorage.tg_settings` and the best score in `tg_best`.
- `window.TG` exposes hooks for puppeteer play-throughs: `startGame`, `spawn`, `fireAt`, `clearWave`, `solveLaunch`.
