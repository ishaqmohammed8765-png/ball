from __future__ import annotations

import time

import matplotlib.pyplot as plt
import matplotlib.patches as patches
import streamlit as st

from arena_sim import ABILITY_LABEL, ArenaSimulation


st.set_page_config(page_title="Bouncing Balls Arena", layout="wide")
st.title("Bouncing Balls Arena")

if "sim" not in st.session_state:
    st.session_state.sim = ArenaSimulation()
if "fast_forward" not in st.session_state:
    st.session_state.fast_forward = False
if "last_hash" not in st.session_state:
    st.session_state.last_hash = ""

sim: ArenaSimulation = st.session_state.sim

col_reset, col_fast, col_hash = st.columns([1, 1, 1.3])

with col_reset:
    if st.button("Reset", use_container_width=True):
        sim.reset()
        st.session_state.last_hash = ""
        st.rerun()

with col_fast:
    st.session_state.fast_forward = st.checkbox(
        "Fast-forward (8x)",
        value=st.session_state.fast_forward,
    )

with col_hash:
    if st.button("Run 10,000-step Hash", use_container_width=True):
        test_sim = ArenaSimulation()
        test_sim.step_many(10_000)
        st.session_state.last_hash = test_sim.state_hash()

if st.session_state.last_hash:
    st.code(f"10,000-step hash: {st.session_state.last_hash}")

steps_per_render = 8 if st.session_state.fast_forward else 1
sim.step_many(steps_per_render)

snapshot = sim.snapshot()
st.caption(f"Step: {snapshot['step_count']} | Alive: {snapshot['alive_count']} | Mode: {'Fast' if steps_per_render == 8 else 'Normal'}")

fig, ax = plt.subplots(figsize=(10, 6.4), dpi=100)
ax.set_xlim(0, sim.config.arena_width)
ax.set_ylim(0, sim.config.arena_height)
ax.set_aspect("equal")
ax.set_facecolor("white")

for side in ["left", "right", "top", "bottom"]:
    ax.spines[side].set_color("black")
    ax.spines[side].set_linewidth(2.0)

ax.set_xticks([])
ax.set_yticks([])
ax.invert_yaxis()

palette = ["#f97316", "#16a34a", "#0ea5e9", "#dc2626", "#9333ea", "#ca8a04"]

for ball in snapshot["balls"]:
    color = palette[ball["id"] % len(palette)]

    circle = patches.Circle(
        (ball["x"], ball["y"]),
        ball["radius"],
        facecolor=color,
        edgecolor="black",
        linewidth=1.5,
    )
    ax.add_patch(circle)

    hp_pct = max(0.0, min(1.0, ball["hp"] / ball["max_hp"]))
    bar_w = ball["radius"] * 2.0
    bar_h = 4.0
    bar_x = ball["x"] - ball["radius"]
    bar_y = ball["y"] - ball["radius"] - 10.0

    bg = patches.Rectangle((bar_x, bar_y), bar_w, bar_h, facecolor="#dddddd", edgecolor="#222222", linewidth=0.8)
    fg = patches.Rectangle(
        (bar_x, bar_y),
        bar_w * hp_pct,
        bar_h,
        facecolor="#16a34a" if hp_pct > 0.4 else "#b91c1c",
        edgecolor="none",
    )
    ax.add_patch(bg)
    ax.add_patch(fg)

    ax.text(
        ball["x"],
        ball["y"],
        ABILITY_LABEL[ball["ability_type"]],
        color="black",
        ha="center",
        va="center",
        fontsize=8,
        family="monospace",
        fontweight="bold",
    )

st.pyplot(fig, clear_figure=True)

if snapshot["alive_count"] > 1:
    time.sleep(1.0 / 60.0)
    st.rerun()
else:
    st.success("Simulation complete.")
