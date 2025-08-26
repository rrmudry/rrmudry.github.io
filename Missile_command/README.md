# Physics Defense

A simple Missile Command-style game built with HTML5 Canvas and vanilla JavaScript.

## Controls

-   **A:** Fire from the left base (Distance)
-   **S:** Fire from the center base (Speed)
-   **D:** Fire from the right base (Time)
-   **P:** Pause the game
-   **R:** Restart the game
-   **M:** Mute the game

## How to Host

To run the game, you need a simple static file server. You can use the built-in Python server:

`python -m http.server`

Or use a tool like `live-server` for automatic reloading:

`npx live-server`

## Tuning Constants

The game's difficulty and feel can be tuned by modifying the `levels.js` file. This file contains an array of level data, including:

-   `spawnRateMs`: The time between meteor spawns in milliseconds.
-   `wave`: The number of meteors in the level.
-   `gravity`: The acceleration of the meteors.
-   `baseCooldownMs`: The cooldown time for firing missiles.
-   `explosionRadius`: The maximum radius of an explosion.
-   `splitLimit`: The maximum number of times a meteor can split.
-   `mix`: The ratio of different meteor types.
