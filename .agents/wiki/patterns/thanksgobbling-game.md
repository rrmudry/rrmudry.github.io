# Thanksgobbling (Thanksgiving gunner game)

> `thanksgobbling/` is a seasonal 3D game linked from `games.html`. It is not a graded studio, so it has no saving, classes or Firestore.

## Concept
Students fly in the *Gravy Boat*, a cargo plane circling the town at 115 m altitude, 135 m radius. Orbit speed is a setting: Calm 8 m/s (default, one lap every 106 s), Normal 14 m/s, or Fast 22 m/s. The teacher found 22 m/s dizzying because the ground-locked view spins the town 9° per second. There is no camera bob. Turkeys walk in from the woods along the streets toward the feast hall on the town green, and the student drops cranberries (rapid fire), sweet potatoes (5 per load) or pumpkin pie (single shot, huge splat) on them. Turkeys at the tables drain the feast meter. Neighbors with blue rings carry pies to the hall, and splatting one costs points. After each wave the student picks one of three kitchen upgrades.

## Paez (VIP neighbor)
- Requested by the teacher. Paez wears an orange baseball cap and a white jersey with an orange stripe, and carries the big pie (`paezGeometry` in `world.js`). He has his own mesh, a pulsing gold ring, a floating "⭐ PAEZ" name tag (`#paezTag`), and a gold square on the radar.
- One Paez per wave, 6–16 s after the wave starts (`paezTimer`). He walks a bit faster than other neighbors (2.4 m/s).
- Delivering him to the feast earns +500 (`PAEZ_BONUS`). Splatting him costs 750 (`PAEZ_PENALTY`, score floors at 0), and he runs home. The game-over screen shows "Paez made it: X of Y".
- Like the other humans, he is someone to protect, never a target.

## Town layout (Gobbleville)
- Built on a street grid with lines at x, z = ±25, ±75 and ±125 (`GRID` in `world.js`). The middle square is the green, with the feast hall, its tables, and two diagonal footpaths.
- **Downtown** is the 8 blocks around the square. Brick storefronts (2–3 floors, flat gravel roofs, awnings, lit shop windows) line the square's streets (±25). On the middle blocks the row facing the green runs full length; on corner blocks the east–west row does, and the other rows stop short at the corner. There are sidewalks, lamp posts, curbside cars and parking lots behind the shops. The church with its steeple faces the green from the north block.
- **Neighborhoods** are the outer 16 blocks: 3 houses per side on two opposite sides of each block, with driveways, some garages and cars, porch pumpkins, and street and yard trees. The school (with flagpole and ball field) is on block (4,1), and the GOBBLEVILLE water tower is on block (0,3).
- **Outskirts:** one farm pattern (barn, silo, farmhouse, and corn/pumpkin/plowed/hay fields) is turned to each of the four sides. Two paved country roads and one dirt lane per side run out to the woods (radius ≥ 212).
- **Movement:** turkeys spawn on the 12 country roads and lanes inside the woods. They walk the street grid one block at a time toward the square (`route`, random when two directions both get closer), then cross the green to a point on the feast ring. Neighbors walk door → curb → nearest crossing → square, and a splatted neighbor retraces its path home. Every path was checked against building boxes; none cross a building.
- **Speed:** base turkey speeds rose about 20% (turkey 3.6, runner 7, Big Tom 2.3 m/s) because street routes are longer than the old straight spokes.

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
