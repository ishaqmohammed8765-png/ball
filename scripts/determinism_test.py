from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from arena_sim import ArenaSimulation


def main() -> None:
    sim = ArenaSimulation()
    sim.step_many(10_000)
    print(f"steps=10000")
    print(f"alive={len(sim.balls)}")
    print(f"hash={sim.state_hash()}")


if __name__ == "__main__":
    main()
