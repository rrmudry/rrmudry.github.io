# Velocity-Time Graph Studio Pattern

> Pattern for interactive velocity vs. time ($v\text{-}t$) graphing environments, piecewise acceleration modeling, integral area shading (displacement), 1D vehicle motion visualizer, and strobe/oil-drop trails.

## 🎯 Pedagogical Goals
- **Slope is Acceleration**: $a = \frac{\Delta v}{\Delta t}$. A horizontal line means $a = 0$ (constant speed). A tilted straight line means uniform acceleration.
- **Area under $v\text{-}t$ is Displacement**: Shaded area between the curve and the horizontal $v = 0$ axis yields $\Delta x$.
  - Region above $v = 0$: positive forward displacement ($+ \Delta x$).
  - Region below $v = 0$: negative backward displacement ($- \Delta x$).
  - Crossing $v = 0$ indicates a turnaround point / instantaneous stop.
- **Strobe / Oil-Drop Trails**: Visual proof of acceleration. Equal spacing = constant speed; widening spacing = speeding up; narrowing spacing = slowing down.

## 🛠️ Key Implementation Architecture

### 1. Piecewise Dynamic Kinematic Integrator
Given keyframes $P_i(t_i, v_i)$ sorted by $t$:
- Segment acceleration: $a_i = \frac{v_{i+1} - v_i}{t_{i+1} - t_i}$
- Instantaneous velocity: $v(t) = v_i + a_i(t - t_i)$
- Segment displacement: $\Delta x_i = v_i \Delta t + \frac{1}{2} a_i (\Delta t)^2$
- Segment crossover at $v = 0$: $t_c = t_i + \frac{|v_i|}{|a_i|}$ (split into positive & negative area polygons).

### 2. Dual-Canvas Synchronized View
- **Top Canvas (`#vtCanvas`)**: Interactive $v\text{-}t$ coordinate grid with draggable waypoints, live playhead line, slope badges, and colored area fills.
- **Bottom Canvas (`#trackCanvas`)**: 1D highway track with scaled metric ruler, origin flag, vehicle with direction-aware orientation, velocity/acceleration vector arrows, and real-time oil-drop trail markers.
- **Collapsible Drawer (`#xtCanvas`)**: Optional synchronized position-time curve showing parabolic arcs during acceleration and linear segments during constant speed.

### 3. Mobile / iPad Touch Compliance
- Apply `touch-action: none;` on all interactive canvas elements.
- Use the unified Pointer Events API (`pointerdown`, `pointermove`, `pointerup`, `pointercancel`) with `setPointerCapture`.
- Use `getBoundingClientRect()` for client-to-canvas coordinate mapping (avoid CSS zoom division drift).
- Include an elevated optical loupe callout (offset $-80\text{px}$ vertically) so student fingers do not obscure coordinates.

### 4. No LaTeX Compliance
- Never output `$...$` or `\Delta` or `\vec{v}`.
- Use plain HTML / Unicode: `Δv / Δt`, `v(t) = v₀ + at`, `m/s²`, `m/s`, `m`, `½at²`.
