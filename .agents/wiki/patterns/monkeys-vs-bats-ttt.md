# Monkeys vs. Bats Tic-Tac-Toe Game Pattern

> **Tags**: `game`, `tic-tac-toe`, `minimax`, `ai`, `web-audio`, `canvas-particles`, `svg-markers`, `responsive`
> **Last Updated**: 2026-11-12

Path: `monkeys-vs-bats/` (`index.html`, `style.css`, `script.js`), linked from `games.html`.

## Overview
A polished, responsive 2D Tic-Tac-Toe battle pitting the Jungle Troop (Monkeys 🐵) against the Midnight Colony (Bats 🦇). Features custom Web Audio synthesizers, SVG avatars and markers, 3 difficulty tiers (including an unbeatable Minimax algorithm), local 2-player pass-and-play, celebration particle physics, and keyboard navigation.

## Key Architecture & Features

### 1. Zero External Dependencies & District Web Filter Compliance
- **Zero unpkg.com & Zero In-Browser Babel**: Uses native Vanilla JavaScript (ES6+), semantic HTML5, and CSS3.
- **Self-Contained Web Audio Synthesizer**: Generates dynamic sounds using the browser's `AudioContext` (oscillators + gain nodes):
  - **Monkey Sound**: Dual-oscillator bouncy triangle wave with rising/falling harmonics simulating a playful jungle chortle.
  - **Bat Sound**: High-frequency sine wave with fast pitch modulation simulating an ultrasound sonar chirp.
  - **Fanfare & Draw**: Polyphonic arpeggios and descending draw alerts.
- **Mute / Unmute State**: Persisted in `localStorage` (`mvb_muted`) with instant UI sync.

### 2. Minimax AI Engine with 3 Tiers
- **Easy (Chimp / Fruit Bat Pup)**: 75% random selection, 25% simple blocking of immediate human wins.
- **Medium (Clever Primate / Night Stalker)**: Checks for winning moves first, blocks opponent winning moves second, and plays 45% strategic center/corners.
- **Hard (Jungle King / Vampire Overlord)**: Full recursive minimax evaluation with depth weighting (`10 - depth` for wins, `depth - 10` for losses). Truly unbeatable.

### 3. Visual Experience & Celebrations
- **Vector Graphics**: Resolution-independent inline SVG avatars and markers for Monkeys (banana accents, warm amber/emerald glow) and Bats (scalloped wings, midnight violet/neon cyan glow).
- **Animated Strike-Through Line**: An overlay SVG with `stroke-dasharray` and `stroke-dashoffset` smoothly draws the winning line connecting the 3 winning cells.
- **Particle System**: An HTML5 Canvas particle engine spawns 75 floating bananas, leaves, bat silhouettes, and glowing confetti on victory with realistic gravity, rotation, and drift.

### 4. Accessibility & Controls
- **Keyboard Navigation**: Grid cells support <kbd>Arrow Keys</kbd> + <kbd>Enter</kbd>/<kbd>Space</kbd>, plus direct numpad input (<kbd>1-9</kbd>).
- **Responsive Layout**: Designed for small mobile screens (<480px), Chromebooks, and classroom projectors.
