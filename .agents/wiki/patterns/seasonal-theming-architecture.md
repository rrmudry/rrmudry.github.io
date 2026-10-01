# Seasonal Theming Architecture: Spooky Physics & Interactive Halloween Elements

> Pattern for adding immersive, high-performance holiday/seasonal themes to the educational platform while strictly preserving core learning functionality, accessibility, and zero-audio intrusion.

## 🎃 Context & Architectural Goals
High school students and teachers frequently appreciate seasonal celebrations (such as October Halloween). However, classroom websites have strict requirements:
1. **Zero Interference with Instructional Mission**: Bell-ringers, lesson cards, grade sync, links, and lab tools must continue working flawlessly.
2. **Classroom-Safe Audio (No Unsolicited Noise)**: Web Audio API sound effects must NEVER autoplay; they must require user interaction, support a one-click mute/toggle, and persist preferences in `localStorage`.
3. **No External Asset Dependencies**: Avoid large PNG/GIF or MP3 downloads that cause network latency or broken image links on school networks. Everything uses inline, crisp SVG vectors and real-time Web Audio oscillators.
4. **Authentic Physics Integrations**: Turn holiday tropes into physics teachable moments:
   - **Jack-O'-Lanterns**: Free-fall projectiles, candy kinematics ($x = x_0 + v_x t$, $y = y_0 + v_y t + \frac{1}{2}gt^2$, coefficient of restitution $e \approx 0.62$).
   - **Skeletons**: Simple harmonic motion ($x(t) = A \cos(\omega t)$) and rotational torque ($\tau = I \alpha$).
   - **Zombies**: Constant velocity kinematics ($v = \Delta x / \Delta t$).

---

## 🛠️ System Components

### 1. Style Module (`assets/halloween.css`)
- **Theme Activation**: Controlled by the `.halloween-active` class on `<body>`.
- **Spooky Typography & Text Effects**:
  - Imported Google Font `Creepster` (`font-family: 'Creepster', cursive, sans-serif`).
  - Flaming ember text gradient (`linear-gradient(180deg, #ffffff, #fed7aa, #ff781f, #c2410c)`).
  - Layered spectral glows (`drop-shadow(0 0 15px rgba(249, 115, 22, 0.9)) drop-shadow(0 0 35px rgba(168, 85, 247, 0.75))`).
  - Animated dripping spectral slime banner (`@keyframes hw-slime-flow`).
  - Section headers adorned with crawling spiders.
- **Giant Viewport & Card Spider Webs**:
  - Giant top-corner catenary webs (`.hw-viewport-corner-web`) rendered with SVG tension arcs, silk radials, and dewdrop reflections.
  - Dangling orb weaver spiders (`.hw-hanging-spider`) on suspended silk threads with 8 jointed legs and red hourglass marks.
  - Interactive web plucking: clicking or hovering webs/spiders triggers elastic vibrations (`hw-web-shiver`), web strum sounds, and candy drops.
  - Corner cobwebs draped on featured classroom cards (`.hw-card-web`).
- **Eerie Atmosphere**:
  - Deep midnight radial gradients (`#030712`, `#ff781f`, `#9333ea`).
  - Atmospheric Harvest Moon with animated glow, lunar crater topography, and orbiting silhouette bats.
  - Graveyard mist drifting along the viewport bottom using CSS keyframe transforms (`hw-mist-drift`).
  - Candlelight flicker animations (`@keyframes hw-flicker`) for carved pumpkin eyes and sinister grins.
  - Harmonic pendulum skeleton with anchor-point top rotation (`@keyframes hw-pendulum-swing`).

### 2. Interactive Engine (`assets/halloween.js`)
- **Global Controller (`window.HalloweenPhysics`)**:
  - `dropCandy(x, y, count)`: Spawns kinematic treats with real-time gravity ($g = 980\text{ px/s}^2$), ground collision detection, restitution bounces, and rotational momentum.
  - `summonZombie()`: Spawns a creeping zombie walking across the bottom edge of the screen who speaks physics equations when tapped.
  - `audio`: Synthesizes spooky theremins, bone rattles, zombie groans, and candy pops using native `AudioContext` oscillators and bandpass filters.
- **Floating HUD (`.hw-hud`)**:
  - Pill button in the lower corner allowing students and teachers to toggle:
    - Spooky Season (ON / OFF)
    - Sound FX (🔊 ON / 🔇 OFF)
    - Drop Physics Candy
    - Summon Zombie
    - Skeleton Rattle
  - Remembers user choice across sessions via `localStorage`.

### 3. Partial Integration (`assets/partials.js`)
- `ensureHalloweenLoaded()` dynamically injects `assets/halloween.css` and `assets/halloween.js` on pages using the common partial header/footer chain, ensuring seamless presentation across the site without breaking iframes or standalone tools.

---

## ⚠️ Known Pitfalls & Scaffolding Rules

| Pitfall | Impact | Prevention Strategy |
|---|---|---|
| **Audio Autoplay Lockout** | Modern browsers block audio without gesture | All `AudioContext` nodes are suspended until the student clicks a button or interacts with the HUD. |
| **Z-index Collisions** | Holiday overlays blocking dropdowns or modals | Modal overlays are $z = 10000$. Mist and background moon are $z \le 10$, character elements are $z = 20\text{–}30$, and HUD is $z = 9995$. |
| **High CPU on Low-Spec Chromebooks** | Heavy DOM manipulation or multiple canvas loops | Physics candy uses single-interval `requestAnimationFrame` with fast auto-cleanup once candy settles. Mist and moon animations run via GPU-accelerated CSS `transform`. |
| **LaTeX Policy Violation** | Using LaTeX math syntax in quote bubbles or labels | Strictly use standard plain text and Unicode: `Δx / Δt`, `g = 9.8 m/s²`, `τ = I α`. |
