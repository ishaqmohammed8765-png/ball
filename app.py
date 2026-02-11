from __future__ import annotations

from pathlib import Path

import streamlit as st
import streamlit.components.v1 as components


ROOT = Path(__file__).resolve().parent


def _bundle_frontend() -> str:
    styles = (ROOT / "styles.css").read_text(encoding="utf-8")
    sim_js = (ROOT / "src" / "sim.js").read_text(encoding="utf-8")
    main_js = (ROOT / "src" / "main.js").read_text(encoding="utf-8")

    # Inline ES module by removing module exports/imports while preserving logic.
    sim_js = sim_js.replace("export const ", "const ")
    sim_js = sim_js.replace("export class ", "class ")
    main_js = main_js.replace('import { ArenaSimulation, ABILITY_LABEL } from "./sim.js";\n\n', "")
    main_js = main_js.replace('import { ArenaSimulation, ABILITY_ORDER, ABILITY_LABEL, CLASS_PROFILE } from "./sim.js";\n\n', "")

    return f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Bouncing Balls Arena</title>
    <style>
{styles}
    html, body {{
      margin: 0;
      padding: 0;
      background: transparent;
    }}
    .app {{
      margin: 0 auto;
      width: min(1080px, 98vw);
    }}
    </style>
  </head>
  <body>
    <main class="app">
      <h1>Bouncing Balls Arena</h1>
      <div class="toolbar">
        <button id="resetBtn" type="button">Reset</button>
        <label class="number-control" for="ballCountInput">
          Balls
          <input id="ballCountInput" type="number" min="1" max="30" step="1" value="18" />
        </label>
        <label class="checkbox">
          <input id="fastForwardToggle" type="checkbox" />
          Fast-forward (8x)
        </label>
        <button id="determinismBtn" type="button">Run 10,000-step Hash</button>
      </div>
      <canvas id="arenaCanvas" width="920" height="600"></canvas>
      <p id="statusLine">Ready</p>
      <div id="classLegend" class="class-legend" aria-live="polite"></div>
      <p class="hint">Keyboard: <code>R</code> reset, <code>F</code> fast-forward toggle, <code>H</code> hash test.</p>
    </main>
    <script type="module">
{sim_js}

{main_js}
    </script>
  </body>
</html>
"""


st.set_page_config(page_title="Bouncing Balls Arena", layout="wide")
st.title("Bouncing Balls Arena")
st.caption("Realtime canvas mode enabled for smoother animation and lower stutter.")

html = _bundle_frontend()
components.html(html, height=840, scrolling=False)
