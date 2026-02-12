from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from hashlib import sha256
from math import sqrt
from typing import Dict, List, Tuple


class AbilityType(str, Enum):
    TANK = "TANK"
    SPIKY = "SPIKY"
    VAMPIRIC = "VAMPIRIC"
    SHIELDED = "SHIELDED"
    DASH = "DASH"
    SLOW_ON_HIT = "SLOW_ON_HIT"


ABILITY_ORDER: List[AbilityType] = [
    AbilityType.TANK,
    AbilityType.SPIKY,
    AbilityType.VAMPIRIC,
    AbilityType.SHIELDED,
    AbilityType.DASH,
    AbilityType.SLOW_ON_HIT,
]

ABILITY_LABEL: Dict[AbilityType, str] = {
    AbilityType.TANK: "T",
    AbilityType.SPIKY: "S",
    AbilityType.VAMPIRIC: "V",
    AbilityType.SHIELDED: "Sh",
    AbilityType.DASH: "D",
    AbilityType.SLOW_ON_HIT: "Sl",
}


@dataclass(frozen=True)
class SimConfig:
    fixed_dt: float = 1.0 / 120.0
    arena_width: float = 920.0
    arena_height: float = 600.0
    ball_radius: float = 16.0
    base_mass: float = 1.0
    base_max_hp: float = 100.0
    base_max_speed: float = 240.0
    speed_clamp: float = 360.0
    wall_restitution: float = 1.0
    collision_restitution: float = 1.0
    base_damage: float = 8.0
    relative_damage_scale: float = 0.08
    min_damage: float = 2.0
    max_damage: float = 30.0
    damage_ramp_per_second: float = 0.02
    max_time_damage_bonus: float = 1.25
    damage_stack_gain_per_hit: float = 0.09
    max_damage_stack: float = 1.8
    damage_stack_decay_per_second: float = 0.04
    fairness_hp_gap_scale: float = 0.4
    fairness_min_multiplier: float = 0.8
    fairness_max_multiplier: float = 1.25
    shield_cooldown_seconds: float = 2.0
    dash_cooldown_seconds: float = 2.5
    dash_speed: float = 320.0
    slow_duration_seconds: float = 1.5
    slow_multiplier: float = 0.6
    tank_hp_multiplier: float = 1.5
    tank_speed_multiplier: float = 0.8
    spiky_outgoing_multiplier: float = 1.3
    spiky_incoming_multiplier: float = 1.1
    vampiric_heal_ratio: float = 0.2
    ball_count: int = 18
    ability_sequence: Tuple[AbilityType, ...] = ()


@dataclass
class Ball:
    id: int
    radius: float
    mass: float
    x: float
    y: float
    vx: float
    vy: float
    hp: float
    max_hp: float
    max_speed: float
    damage_stack: float
    ability_type: AbilityType
    cooldown: float = 0.0
    shield_timer: float = 0.0
    slow_timer: float = 0.0


QUANTIZE_FACTOR = 1_000_000.0
EPSILON = 1e-9


def quantize(value: float) -> float:
    return round(value * QUANTIZE_FACTOR) / QUANTIZE_FACTOR


def clamp(value: float, min_value: float, max_value: float) -> float:
    if value < min_value:
        return min_value
    if value > max_value:
        return max_value
    return value


def normalize(x: float, y: float) -> Tuple[float, float, float]:
    length = sqrt((x * x) + (y * y))
    if length <= EPSILON:
        return 0.0, 0.0, 0.0
    return x / length, y / length, length


def limit_velocity(ball: Ball, speed_cap: float) -> None:
    speed_sq = (ball.vx * ball.vx) + (ball.vy * ball.vy)
    if speed_sq <= speed_cap * speed_cap:
        return
    speed = sqrt(speed_sq)
    if speed <= EPSILON:
        return
    scale = speed_cap / speed
    ball.vx *= scale
    ball.vy *= scale


def apply_quantization(ball: Ball) -> None:
    ball.x = quantize(ball.x)
    ball.y = quantize(ball.y)
    ball.vx = quantize(ball.vx)
    ball.vy = quantize(ball.vy)
    ball.hp = quantize(ball.hp)
    ball.max_hp = quantize(ball.max_hp)
    ball.max_speed = quantize(ball.max_speed)
    ball.damage_stack = quantize(ball.damage_stack)
    ball.cooldown = quantize(ball.cooldown)
    ball.shield_timer = quantize(ball.shield_timer)
    ball.slow_timer = quantize(ball.slow_timer)


def get_initial_velocity(ball_id: int) -> Tuple[float, float]:
    velocity_table: List[Tuple[float, float]] = [
        (130.0, 90.0),
        (-110.0, 100.0),
        (95.0, -120.0),
        (-140.0, -70.0),
        (160.0, 40.0),
        (-90.0, 145.0),
        (75.0, 155.0),
        (-150.0, 50.0),
        (120.0, -95.0),
        (-105.0, -125.0),
        (145.0, -30.0),
        (-80.0, 160.0),
    ]
    return velocity_table[ball_id % len(velocity_table)]


def fallback_direction(ball_id: int) -> Tuple[float, float]:
    direction = ball_id % 4
    if direction == 0:
        return 1.0, 0.0
    if direction == 1:
        return 0.0, 1.0
    if direction == 2:
        return -1.0, 0.0
    return 0.0, -1.0


def create_ball_base(
    ball_id: int,
    x: float,
    y: float,
    vx: float,
    vy: float,
    ability: AbilityType,
    cfg: SimConfig,
) -> Ball:
    max_hp = cfg.base_max_hp
    max_speed = cfg.base_max_speed
    if ability == AbilityType.TANK:
        max_hp *= cfg.tank_hp_multiplier
        max_speed *= cfg.tank_speed_multiplier

    ball = Ball(
        id=ball_id,
        radius=cfg.ball_radius,
        mass=cfg.base_mass,
        x=x,
        y=y,
        vx=vx,
        vy=vy,
        hp=max_hp,
        max_hp=max_hp,
        max_speed=max_speed,
        damage_stack=0.0,
        ability_type=ability,
    )
    limit_velocity(ball, min(cfg.speed_clamp, ball.max_speed))
    return ball


def resolve_initial_overlaps(balls: List[Ball]) -> None:
    for _ in range(10):
        changed = False
        for i in range(len(balls)):
            for j in range(i + 1, len(balls)):
                a = balls[i]
                b = balls[j]
                dx = b.x - a.x
                dy = b.y - a.y
                nx, ny, distance = normalize(dx, dy)
                if distance <= EPSILON:
                    nx, ny = fallback_direction(min(a.id, b.id))
                    distance = 0.0
                min_distance = a.radius + b.radius
                if distance + EPSILON < min_distance:
                    overlap = min_distance - distance
                    correction_x = nx * overlap * 0.5
                    correction_y = ny * overlap * 0.5
                    a.x -= correction_x
                    a.y -= correction_y
                    b.x += correction_x
                    b.y += correction_y
                    changed = True
        if not changed:
            break


def create_initial_balls(cfg: SimConfig) -> List[Ball]:
    balls: List[Ball] = []
    ability_sequence = []
    for ability in cfg.ability_sequence:
        if isinstance(ability, AbilityType):
            ability_sequence.append(ability)
            continue
        try:
            ability_sequence.append(AbilityType(str(ability)))
        except ValueError:
            continue
    if len(ability_sequence) == 0:
        ability_sequence = list(ABILITY_ORDER)
    padding = cfg.ball_radius + 24.0
    usable_width = max(0.0, cfg.arena_width - (padding * 2.0))
    usable_height = max(0.0, cfg.arena_height - (padding * 2.0))
    aspect = cfg.arena_width / max(1.0, cfg.arena_height)
    columns = max(1, int((cfg.ball_count * aspect) ** 0.5))
    while columns * columns < cfg.ball_count * aspect:
        columns += 1
    rows = max(1, (cfg.ball_count + columns - 1) // columns)
    spacing_x = (usable_width / (columns - 1)) if columns > 1 else 0.0
    spacing_y = (usable_height / (rows - 1)) if rows > 1 else 0.0
    start_x = padding
    start_y = padding

    for ball_id in range(cfg.ball_count):
        row = ball_id // columns
        col = ball_id % columns
        x = start_x + (col * spacing_x)
        y = start_y + (row * spacing_y)
        vx, vy = get_initial_velocity(ball_id)
        ability = ability_sequence[ball_id % len(ability_sequence)]
        balls.append(create_ball_base(ball_id, x, y, vx, vy, ability, cfg))

    resolve_initial_overlaps(balls)
    balls.sort(key=lambda b: b.id)
    for ball in balls:
        apply_quantization(ball)
    return balls


class ArenaSimulation:
    def __init__(self, config: SimConfig | None = None):
        self.config = config or SimConfig()
        self.reset()

    def reset(self) -> None:
        self.step_count = 0
        self.time = 0.0
        self.balls = create_initial_balls(self.config)

    def _apply_dash(self, ball: Ball) -> None:
        cfg = self.config
        if ball.ability_type != AbilityType.DASH:
            return
        if ball.cooldown > 0.0:
            return

        dx, dy, length = normalize(ball.vx, ball.vy)
        if length <= EPSILON:
            dx, dy = fallback_direction(ball.id)

        ball.vx = dx * cfg.dash_speed
        ball.vy = dy * cfg.dash_speed
        ball.cooldown = cfg.dash_cooldown_seconds

    def _apply_wall_collision(self, ball: Ball) -> None:
        cfg = self.config
        left = ball.radius
        right = cfg.arena_width - ball.radius
        top = ball.radius
        bottom = cfg.arena_height - ball.radius

        if ball.x < left:
            ball.x = left
            ball.vx = abs(ball.vx) * cfg.wall_restitution
        elif ball.x > right:
            ball.x = right
            ball.vx = -abs(ball.vx) * cfg.wall_restitution

        if ball.y < top:
            ball.y = top
            ball.vy = abs(ball.vy) * cfg.wall_restitution
        elif ball.y > bottom:
            ball.y = bottom
            ball.vy = -abs(ball.vy) * cfg.wall_restitution

    def _base_collision_damage(self, a: Ball, b: Ball, nx: float, ny: float) -> float:
        cfg = self.config
        rvx = a.vx - b.vx
        rvy = a.vy - b.vy
        relative_speed_along_normal = max(0.0, (rvx * nx) + (rvy * ny))
        return cfg.base_damage + (cfg.relative_damage_scale * relative_speed_along_normal)

    def _time_damage_multiplier(self) -> float:
        cfg = self.config
        return 1.0 + min(cfg.max_time_damage_bonus, cfg.damage_ramp_per_second * self.time)

    def _fairness_multiplier(self, attacker: Ball, defender: Ball) -> float:
        cfg = self.config
        attacker_hp_pct = attacker.hp / attacker.max_hp if attacker.max_hp > EPSILON else 0.0
        defender_hp_pct = defender.hp / defender.max_hp if defender.max_hp > EPSILON else 0.0
        hp_gap = defender_hp_pct - attacker_hp_pct
        raw = 1.0 + (hp_gap * cfg.fairness_hp_gap_scale)
        return clamp(raw, cfg.fairness_min_multiplier, cfg.fairness_max_multiplier)

    def _damage_stack_multiplier(self, ball: Ball) -> float:
        return 1.0 + clamp(ball.damage_stack, 0.0, self.config.max_damage_stack)

    def _gain_damage_stack(self, ball: Ball, dealt_damage: float) -> None:
        if dealt_damage <= EPSILON:
            return
        cfg = self.config
        gain = cfg.damage_stack_gain_per_hit * (dealt_damage / max(cfg.base_damage, EPSILON))
        ball.damage_stack = clamp(ball.damage_stack + gain, 0.0, cfg.max_damage_stack)

    def _decay_damage_stack(self, ball: Ball, dt: float) -> None:
        if ball.damage_stack <= EPSILON:
            return
        ball.damage_stack = max(0.0, ball.damage_stack - (self.config.damage_stack_decay_per_second * dt))

    def _outgoing_multiplier(self, ball: Ball) -> float:
        if ball.ability_type == AbilityType.SPIKY:
            return self.config.spiky_outgoing_multiplier
        return 1.0

    def _incoming_multiplier(self, ball: Ball) -> float:
        if ball.ability_type == AbilityType.SPIKY:
            return self.config.spiky_incoming_multiplier
        return 1.0

    def _apply_shield(self, ball: Ball, damage: float) -> float:
        cfg = self.config
        if ball.ability_type != AbilityType.SHIELDED:
            return damage
        if ball.shield_timer <= 0.0:
            ball.shield_timer = cfg.shield_cooldown_seconds
            return 0.0
        return damage

    def _apply_slow_on_hit(self, attacker: Ball, defender: Ball) -> None:
        if attacker.ability_type != AbilityType.SLOW_ON_HIT:
            return
        cfg = self.config
        defender.slow_timer = max(defender.slow_timer, cfg.slow_duration_seconds)
        defender.vx *= cfg.slow_multiplier
        defender.vy *= cfg.slow_multiplier

    def _apply_vampiric(self, ball: Ball, dealt_damage: float) -> None:
        if ball.ability_type != AbilityType.VAMPIRIC:
            return
        if dealt_damage <= 0.0:
            return
        heal = dealt_damage * self.config.vampiric_heal_ratio
        ball.hp = min(ball.max_hp, ball.hp + heal)

    def _apply_collision_damage(self, a: Ball, b: Ball, nx: float, ny: float) -> None:
        time_multiplier = self._time_damage_multiplier()
        raw = self._base_collision_damage(a, b, nx, ny)
        scaled = raw * time_multiplier
        base = clamp(scaled, self.config.min_damage, self.config.max_damage * time_multiplier)

        damage_to_b = (
            base
            * self._outgoing_multiplier(a)
            * self._incoming_multiplier(b)
            * self._damage_stack_multiplier(a)
            * self._fairness_multiplier(a, b)
        )
        damage_to_a = (
            base
            * self._outgoing_multiplier(b)
            * self._incoming_multiplier(a)
            * self._damage_stack_multiplier(b)
            * self._fairness_multiplier(b, a)
        )

        damage_to_b = self._apply_shield(b, damage_to_b)
        damage_to_a = self._apply_shield(a, damage_to_a)

        a.hp -= damage_to_a
        b.hp -= damage_to_b

        self._apply_vampiric(a, damage_to_b)
        self._apply_vampiric(b, damage_to_a)
        self._gain_damage_stack(a, damage_to_b)
        self._gain_damage_stack(b, damage_to_a)

        self._apply_slow_on_hit(a, b)
        self._apply_slow_on_hit(b, a)

    def _resolve_collision_pair(self, a: Ball, b: Ball) -> None:
        cfg = self.config
        dx = b.x - a.x
        dy = b.y - a.y
        nx, ny, distance = normalize(dx, dy)
        had_degenerate_distance = False
        min_distance = a.radius + b.radius

        if distance <= EPSILON:
            nx, ny = fallback_direction(min(a.id, b.id))
            distance = min_distance
            had_degenerate_distance = True

        overlap = min_distance - distance
        if overlap > 0.0:
            total_mass = a.mass + b.mass
            correction = overlap + 1e-6
            move_a = correction * (b.mass / total_mass)
            move_b = correction * (a.mass / total_mass)
            a.x -= nx * move_a
            a.y -= ny * move_a
            b.x += nx * move_b
            b.y += ny * move_b

        rvx = b.vx - a.vx
        rvy = b.vy - a.vy
        vel_along_normal = (rvx * nx) + (rvy * ny)

        if vel_along_normal < 0.0:
            inv_mass_a = 1.0 / a.mass
            inv_mass_b = 1.0 / b.mass
            impulse_mag = -(1.0 + cfg.collision_restitution) * vel_along_normal / (inv_mass_a + inv_mass_b)
            impulse_x = impulse_mag * nx
            impulse_y = impulse_mag * ny

            a.vx -= impulse_x * inv_mass_a
            a.vy -= impulse_y * inv_mass_a
            b.vx += impulse_x * inv_mass_b
            b.vy += impulse_y * inv_mass_b

        is_impact = had_degenerate_distance or overlap > EPSILON or vel_along_normal < -EPSILON
        if is_impact:
            self._apply_collision_damage(a, b, nx, ny)

    def step(self) -> None:
        cfg = self.config
        dt = cfg.fixed_dt

        # Determinism: stable update order before each step.
        self.balls.sort(key=lambda b: b.id)

        for ball in self.balls:
            if ball.cooldown > 0.0:
                ball.cooldown = max(0.0, ball.cooldown - dt)
            if ball.shield_timer > 0.0:
                ball.shield_timer = max(0.0, ball.shield_timer - dt)
            if ball.slow_timer > 0.0:
                ball.slow_timer = max(0.0, ball.slow_timer - dt)
            self._decay_damage_stack(ball, dt)

            self._apply_dash(ball)

            slow_factor = cfg.slow_multiplier if ball.slow_timer > 0.0 else 1.0
            speed_cap = min(cfg.speed_clamp, ball.max_speed * slow_factor)
            limit_velocity(ball, speed_cap)

            ball.x += ball.vx * dt
            ball.y += ball.vy * dt

            self._apply_wall_collision(ball)
            limit_velocity(ball, speed_cap)

        pairs: List[Tuple[int, int]] = []
        for i in range(len(self.balls)):
            for j in range(i + 1, len(self.balls)):
                a = self.balls[i]
                b = self.balls[j]
                dx = b.x - a.x
                dy = b.y - a.y
                min_distance = a.radius + b.radius
                if (dx * dx) + (dy * dy) <= (min_distance * min_distance):
                    pairs.append((i, j))

        for index_a, index_b in pairs:
            a = self.balls[index_a]
            b = self.balls[index_b]
            if a.hp <= 0.0 or b.hp <= 0.0:
                continue
            self._resolve_collision_pair(a, b)

        self.balls = [ball for ball in self.balls if ball.hp > 0.0]

        for ball in self.balls:
            slow_factor = cfg.slow_multiplier if ball.slow_timer > 0.0 else 1.0
            speed_cap = min(cfg.speed_clamp, ball.max_speed * slow_factor)
            limit_velocity(ball, speed_cap)
            # Determinism: quantize mutable state every fixed step.
            apply_quantization(ball)

        self.step_count += 1
        self.time = quantize(self.time + dt)

    def step_many(self, count: int) -> None:
        for _ in range(count):
            self.step()

    def snapshot(self) -> Dict[str, object]:
        return {
            "step_count": self.step_count,
            "alive_count": len(self.balls),
            "balls": [
                {
                    "id": ball.id,
                    "x": ball.x,
                    "y": ball.y,
                    "vx": ball.vx,
                    "vy": ball.vy,
                    "hp": ball.hp,
                    "max_hp": ball.max_hp,
                    "damage_stack": ball.damage_stack,
                    "radius": ball.radius,
                    "ability_type": ball.ability_type,
                }
                for ball in self.balls
            ],
        }

    def state_hash(self) -> str:
        digest = sha256()
        digest.update(f"step:{self.step_count}\n".encode("ascii"))

        for ball in sorted(self.balls, key=lambda b: b.id):
            digest.update(
                (
                    f"{ball.id}|{ball.x:.6f}|{ball.y:.6f}|{ball.vx:.6f}|{ball.vy:.6f}|{ball.hp:.6f}|"
                    f"{ball.max_hp:.6f}|{ball.damage_stack:.6f}\n"
                ).encode("ascii")
            )

        return digest.hexdigest()
