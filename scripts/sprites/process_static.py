"""Convert chroma-key prop sheets into transparent PNGs so the game never keys at runtime.

    python scripts/sprites/process_static.py

Pixel coordinates are unchanged, so existing manifest rects stay valid. The key test only
removes pure key colours connected to key-coloured regions (see sheetlib), which keeps green or
magenta details inside the art intact.
"""
from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).parent))
from sheetlib import background_mask, magenta_mask  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]

SHEETS = [
    ("art/source/props/office_props_topdown.jpg", "magenta", "public/sprites/props/office_props_topdown.png"),
    ("art/source/props/bullpen_desks_topdown.jpg", "magenta", "public/sprites/props/bullpen_desks_topdown.png"),
    ("art/source/props/friends_props.jpg", "magenta", "public/sprites/props/friends_props.png"),
]


def main() -> None:
    for src, key, dst in SHEETS:
        rgb = np.asarray(Image.open(ROOT / src).convert("RGB")).astype(np.int16)
        bg = magenta_mask(rgb) if key == "magenta" else background_mask(rgb)
        rgba = np.dstack([rgb.clip(0, 255).astype(np.uint8), np.where(bg, 0, 255).astype(np.uint8)])
        rgba[bg] = 0
        out = ROOT / dst
        out.parent.mkdir(parents=True, exist_ok=True)
        Image.fromarray(rgba, "RGBA").save(out, optimize=True)
        print(f"wrote {dst} ({bg.mean() * 100:.0f}% transparent)")


if __name__ == "__main__":
    main()
