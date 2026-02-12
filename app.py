from __future__ import annotations

from pathlib import Path
import re

import streamlit as st
import streamlit.components.v1 as components


ROOT = Path(__file__).resolve().parent


def _bundle_frontend() -> str:
    index_html = (ROOT / "index.html").read_text(encoding="utf-8")
    styles = (ROOT / "styles.css").read_text(encoding="utf-8")
    sim_js = (ROOT / "src" / "sim.js").read_text(encoding="utf-8")
    main_js = (ROOT / "src" / "main.js").read_text(encoding="utf-8")

    inline_styles = (
        "<style>\n"
        f"{styles}\n"
        "html, body {\n"
        "  margin: 0;\n"
        "  padding: 0;\n"
        "  background: transparent;\n"
        "}\n"
        ".app {\n"
        "  margin: 0 auto;\n"
        "  width: min(1080px, 98vw);\n"
        "}\n"
        "</style>"
    )

    bundled = index_html
    bundled = bundled.replace('<link rel="stylesheet" href="styles.css" />', inline_styles)
    bundled = re.sub(
        r'<script type="module" src="src/sim.js"></script>',
        f"<script type=\"module\">\n{sim_js}\n</script>",
        bundled,
        count=1,
    )
    bundled = re.sub(
        r'<script type="module" src="src/main.js"></script>',
        f"<script type=\"module\">\n{main_js}\n</script>",
        bundled,
        count=1,
    )
    return bundled


st.set_page_config(page_title="Bouncing Balls Arena", layout="wide")
st.title("Bouncing Balls Arena")
st.caption("Realtime canvas mode enabled for smoother animation and lower stutter.")

html = _bundle_frontend()
components.html(html, height=1040, scrolling=False)
