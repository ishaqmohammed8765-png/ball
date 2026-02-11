# Bouncing Balls Arena (Streamlit)

Deterministic auto-battler simulation with custom circle physics (no RNG).

## Run

1. Install deps:
   - `pip install -r requirements.txt`
2. Start app:
   - `streamlit run app.py`

## Controls

- `Reset`: reset to exact deterministic initial state.
- `Fast-forward (8x)`: run 8 fixed steps per render refresh.
- `Run 10,000-step Hash`: executes deterministic test on a fresh sim and prints hash.

## Determinism Rules

- Fixed timestep only: simulation always advances in `dt = 1/120` in `arena_sim.py`.
- Stable update order: balls are sorted by `id` before updates and before removals.
- Stable collision order: collision pairs are resolved sorted by `(minId, maxId)`.
- Deterministic collision solver: positional correction + impulse with constant parameters.
- No randomness: no RNG calls, no shuffling, no time-based seeds, no parallel nondeterministic jobs.
- Quantized state: position/velocity/HP/timers are rounded each fixed step to reduce drift.
- Deterministic abilities only: all abilities are timer/id/order-based and contain no random target choice.

## Verify Determinism

1. Run `python scripts/determinism_test.py` multiple times.
2. Confirm the printed `hash=` is identical each run on the same machine.
