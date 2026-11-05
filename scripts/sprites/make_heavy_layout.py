"""Build the heavy-set mannequin layout reference used when regenerating large characters.

    python scripts/sprites/make_heavy_layout.py

Takes art/source/characters/layout_reference_silhouettes.png (8 grey mannequins in the regen
pose order) and widens each body with the same belly-weighted transform the atlas build uses,
so the image model sees a heavy-set build to follow instead of the default slim one.
"""
from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

sys.path.insert(0, str(Path(__file__).parent))
from process_characters import widen_body  # noqa: E402
from sheetlib import extract_fixed_row, load_rgb  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "art" / "source" / "characters" / "layout_reference_silhouettes.png"
DST = ROOT / "art" / "source" / "characters" / "layout_reference_silhouettes_heavy.png"
FACTOR = 1.5
SIDE_COLUMNS = {2, 3, 4, 5}


GAP = 40  # px of empty background between neighbouring mannequins


def main() -> None:
    h, _, _ = load_rgb(str(SRC)).shape
    figures = extract_fixed_row(str(SRC), 8)
    masks = []
    for i, fig in enumerate(figures):
        wide = widen_body(fig.rgba, FACTOR, side_view=i in SIDE_COLUMNS, heavy=True, faces_right=True)
        masks.append((wide[..., 3] > 0, fig.y1))
    cell = max(m.shape[1] for m, _ in masks) + GAP
    out_w = cell * len(masks)
    solid = np.zeros((h, out_w), dtype=bool)
    for i, (mask, foot) in enumerate(masks):
        x0 = int(i * cell + (cell - mask.shape[1]) / 2)
        y0 = foot - mask.shape[0]
        solid[y0:foot, x0:x0 + mask.shape[1]] |= mask
    # Redraw as flat mannequins with an even outline (stretching distorted the original one).
    solid = ndimage.binary_closing(solid, structure=np.ones((5, 5)))
    out = np.zeros((h, out_w, 3), dtype=np.uint8)
    out[:] = (0, 255, 0)
    out[solid] = (150, 150, 158)
    out[solid & ~ndimage.binary_erosion(solid, iterations=4)] = (40, 40, 48)
    # Pad to the 21:9 frame the model renders into; a wider reference makes it wrap the
    # figures onto a second row.
    target_h = int(round(out_w * 9 / 21))
    framed = np.zeros((max(h, target_h), out_w, 3), dtype=np.uint8)
    framed[:] = (0, 255, 0)
    top = (framed.shape[0] - h) // 2
    framed[top:top + h] = out
    Image.fromarray(framed).save(DST)
    print(f"wrote {DST.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
