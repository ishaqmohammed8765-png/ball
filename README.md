# Deterministic Bouncing Balls (Phaser + Vite)

This repository is now a Phaser 3 browser game.  
All Streamlit app code was removed.

## Run Locally

```bash
cd phaser_app
npm install
npm run dev
```

## Build Static Files

```bash
cd phaser_app
npm run build
```

Vite outputs static deployable files to `phaser_app/dist`.

## Controls

- `Reset` button or `R` key: reset to the exact same initial deterministic state.
- `Fast-forward` button or `F` key: simulate at 8x fixed-step speed.
- `Determinism Test 10,000` button or `H` key: runs a headless 10,000-step simulation from reset and prints a hash.

## Determinism Guarantees

- Fixed timestep simulation (`dt = 1/120`) with time accumulation in the render loop.
- Stable ordering:
  - ball updates in ascending `id`
  - collision pairs sorted by `(minId, maxId)`
  - dead-ball removal in ascending `id`
- No randomness:
  - no `Math.random`
  - deterministic grid spawn for exactly 20 balls
  - fixed velocity list cycling by `id`
  - ability assignment by `id % abilityCount`
- Custom deterministic circle collision solver:
  - explicit circle-circle overlap checks
  - positional correction + impulse resolution
- Quantized state each step (positions, velocities, hp, timers) to reduce floating drift.

## Main Simulation Code

- `phaser_app/src/sim/state.js`: deterministic initial state and spawn.
- `phaser_app/src/sim/step.js`: fixed-step simulation, abilities, damage, removal.
- `phaser_app/src/sim/collisions.js`: deterministic collision detection/resolution.
- `phaser_app/src/sim/abilities.js`: ability logic.
- `phaser_app/src/sim/hash.js`: stable hash for determinism validation.
- `phaser_app/src/ui/render.js`: arena and ball rendering.
- `phaser_app/src/ui/hud.js`: HUD updates.
- `phaser_app/src/main.js`: Phaser setup, controls, fixed timestep loop.
