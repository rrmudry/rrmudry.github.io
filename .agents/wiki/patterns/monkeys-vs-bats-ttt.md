# Monkeys vs. Bats vs. Frogs vs. Bears Tic-Tac-Toe Game Pattern

> **Tags**: `game`, `tic-tac-toe`, `minimax`, `ai`, `web-audio`, `canvas-particles`, `svg-markers`, `responsive`
> **Last Updated**: 2026-11-12

Path: `monkeys-vs-bats/` (`index.html`, `style.css`, `script.js`), linked from `games.html`.

## Overview
A polished, responsive 2D Tic-Tac-Toe battle pitting the Jungle Troop (Monkeys 🐵), the Midnight Colony (Bats 🦇), the Canopy Croakers (Tree Frogs 🐸), and the Arctic Clan (Polar Bears 🐻‍❄️) against one another. Features custom Web Audio synthesizers, resolution-independent SVG avatars and markers, 3 difficulty tiers (including an unbeatable Minimax algorithm), 2-player, 3-player, and 4-player Battle Royale modes, celebration particle physics, and comprehensive keyboard/numpad navigation.

## Key Architecture & Features

### 1. Zero External Dependencies & District Web Filter Compliance
- **Zero unpkg.com & Zero In-Browser Babel**: Uses native Vanilla JavaScript (ES6+), semantic HTML5, and CSS3.
- **Self-Contained Web Audio Synthesizer**: Generates dynamic sounds using the browser's `AudioContext` (oscillators + gain nodes):
  - **Monkey Sound**: Dual-oscillator bouncy triangle wave with rising/falling harmonics simulating a playful jungle chortle.
  - **Bat Sound**: High-frequency sine wave with fast pitch modulation simulating an ultrasound sonar chirp.
  - **Frog Sound**: Deep resonant sawtooth wave with dual-pulse frequency modulation simulating a throat-sac ribbit/croak.
  - **Polar Bear Sound**: Deep low-frequency sub-bass rumble (sawtooth swept from 80 Hz to 45 Hz through a 320 Hz resonant lowpass filter) combined with a high-pitched sine chime (1046 Hz to 1318 Hz) simulating cracking glacial ice.
  - **Fanfare & Draw**: Polyphonic arpeggios tailored to each winning animal and descending draw alerts.
- **Mute / Unmute State**: Persisted in `localStorage` (`mvb_muted`) with instant UI sync.

### 2. Multi-Animal Roster & Modes
- **4 Champion Animals**:
  - 🐵 **Monkeys (Jungle Troop)**: Gold & amber glow, banana vector marker, playful chortle sound.
  - 🦇 **Bats (Midnight Colony)**: Violet & neon cyan glow, scalloped wing vector marker, sonar chirp sound.
  - 🐸 **Frogs (Canopy Croakers)**: Toxic lime & emerald glow, bulging-eyes tree frog vector marker, bubbling ribbit sound.
  - 🐻‍❄️ **Polar Bears (Arctic Clan)**: Glacial ice-blue & frost cyan glow (`#38bdf8`), glowing paw-print & snowflake vector marker, deep Arctic roar sound.
- **Game Modes**:
  - **🤖 vs AI**: Pick your animal champion, battle against smart AI (with win streak tracker `🔥 Streak: N`).
  - **👥 2 Players**: Local pass-and-play match between any pair of animals.
  - **👑 3 Players (Battle Royale)**: Three animals take turns in sequence (`Monkey` → `Bat` → `Frog`) on the grid!
  - **❄️ 4 Players (Arctic Chaos)**: All four champions take turns in sequence (`Monkey` → `Bat` → `Frog` → `Bear`) on the grid!

### 3. Minimax AI Engine with 3 Tiers
- **Easy (Fruit Bat / Tadpole)**: 75% random selection, 25% simple blocking of immediate human wins.
- **Medium (Clever Primate)**: Checks for winning moves first, blocks opponent winning moves second, and plays 45% strategic center/corners.
- **Hard (Jungle King / Unbeatable Minimax)**: Full recursive minimax evaluation with depth weighting (`10 - depth` for wins, `depth - 10` for losses). Truly unbeatable.

### 4. Visual Experience & Celebrations
- **Vector Graphics**: Resolution-independent inline SVG avatars and markers with glowing team borders.
- **Animated Strike-Through Line**: An overlay SVG with `stroke-dasharray` and `stroke-dashoffset` smoothly draws the winning line connecting the 3 winning cells in the victor's color.
- **Particle System**: An HTML5 Canvas particle engine spawns 80 floating bananas (`🍌`), water lilies (`🪷`), water drops (`💧`), bat silhouettes (`🦇`), snowflakes (`❄️`), ice cubes (`🧊`), fish (`🐟`), bear paws (`🐾`), and glowing confetti on victory with realistic gravity, rotation, and drift.

### 5. Accessibility & Controls
- **Keyboard Navigation**: Grid cells support <kbd>Arrow Keys</kbd> + <kbd>Enter</kbd>/<kbd>Space</kbd>, plus direct numpad input (<kbd>1-9</kbd>) with physical grid (7-9 top) or phone (1-3 top) layout toggles and corner key badges.
- **Responsive Layout**: Designed for small mobile screens (<520px), Chromebooks, and classroom projectors.
