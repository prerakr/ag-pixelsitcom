"""Build the isometric set atlases: props (all four facings), wall faces, floors and decals.

    python scripts/sprites/iso_assets.py [--preview DIR]

Each set theme lives in scripts/sprites/iso_themes/<theme>.py and exports CATALOGUE (prop id ->
(model factory, kind)), wall_faces(), FLOORS, DECALS and CAPS. Props are modelled from
real-world dimensions (1 tile = 1 m = 32 world px, heights in the same units) and rendered by
isoraster.py, so proportions and the 2:1 angle are exact by construction. Wall faces are
front-view textures that the runtime baker (src/engine/iso/IsoMapBaker.ts) shears onto walls;
floors and decals are top-down textures laid into the floor before it is projected.

Writes public/sprites/iso/iso_<theme>.png and src/data/sprites/generated/isoAtlas.ts.
"""
from __future__ import annotations

import argparse
import importlib
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).parent))
sys.path.insert(0, str(Path(__file__).parent / "iso_themes"))
from isofaces import FACE_BASE, WALL_H, WALL_T, T  # noqa: E402
from isoraster import FACINGS, render  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = ROOT / "public" / "sprites" / "iso"
TS_OUT = ROOT / "src" / "data" / "sprites" / "generated" / "isoAtlas.ts"

THEMES = ["coffee", "office", "pub", "hostel"]


def pack(images: list[tuple[str, np.ndarray]], width: int = 1024) -> tuple[np.ndarray, dict[str, tuple[int, int]]]:
    """Shelf packing, tallest first, 1 px gutter."""
    order = sorted(images, key=lambda kv: -kv[1].shape[0])
    x = y = shelf = 0
    pos: dict[str, tuple[int, int]] = {}
    for key, img in order:
        h, w = img.shape[:2]
        if x + w > width:
            x, y, shelf = 0, y + shelf + 1, 0
        pos[key] = (x, y)
        x += w + 1
        shelf = max(shelf, h)
    sheet = np.zeros((y + shelf + 1, width, 4), dtype=np.uint8)
    for key, img in images:
        px, py = pos[key]
        sheet[py:py + img.shape[0], px:px + img.shape[1]] = img
    return sheet, pos


def build_theme(theme: str):
    mod = importlib.import_module(theme)
    images: list[tuple[str, np.ndarray]] = []
    frames: dict[str, dict] = {}
    catalog: dict[str, dict] = {}
    for prop_id, (make, kind) in mod.CATALOGUE.items():
        model = make()
        height = max(p.hi[2] for p in model.prims)
        catalog[prop_id] = {"width": model.width / T, "depth": model.depth / T, "height": height, "kind": kind}
        for facing in FACINGS:
            spr = render(model, facing)
            key = f"{prop_id}:{facing}"
            images.append((key, spr.rgba))
            frames[key] = {"ox": spr.ox, "oy": spr.oy}

    face_counts: dict[str, int] = {}
    for tile, variants in mod.wall_faces().items():
        face_counts[tile] = len(variants)
        images.append((f"wall:{tile}:n", np.concatenate([f.render(FACE_BASE["n"]) for f in variants], axis=1)))
        images.append((f"wall:{tile}:w", np.concatenate([f.render(FACE_BASE["w"]) for f in variants], axis=1)))

    decals = {k: fn() for k, fn in mod.DECALS.items()}
    for k, img in decals.items():
        images.append((f"decal:{k}", img))
    floors = {k: fn() for k, fn in mod.FLOORS.items()}
    for k, img in floors.items():
        images.append((f"floor:{k}", img))

    sheet, pos = pack(images)
    sizes = {k: v.shape[:2] for k, v in images}
    for key in frames:
        x, y = pos[key]
        h, w = sizes[key]
        frames[key].update({"x": x, "y": y, "w": w, "h": h})
    walls = {
        tile: {"variants": n, "n": dict(zip("xy", pos[f"wall:{tile}:n"])), "w": dict(zip("xy", pos[f"wall:{tile}:w"]))}
        for tile, n in face_counts.items()
    }
    rect = lambda key: {"x": pos[key][0], "y": pos[key][1], "w": sizes[key][1], "h": sizes[key][0]}  # noqa: E731
    atlas = {
        "imageKey": f"iso_{theme}",
        "wallHeight": WALL_H,
        "wallThickness": WALL_T,
        "caps": mod.CAPS,
        "capsByType": getattr(mod, "CAPS_BY_TYPE", {}),
        "wallHeights": getattr(mod, "WALL_HEIGHTS", {}),
        "frames": frames,
        "walls": walls,
        "decals": {k: rect(f"decal:{k}") for k in decals},
        "floors": {k: {"x": pos[f"floor:{k}"][0], "y": pos[f"floor:{k}"][1]} for k in floors},
    }
    return sheet, atlas, catalog


def contact_sheet(sheet: np.ndarray, atlas: dict, out: Path, backdrop=(126, 92, 58, 255)) -> None:
    """Every prop in its four facings, 3x."""
    props = sorted({k.split(":")[0] for k in atlas["frames"]})
    flat = []
    for prop in props:
        for facing in FACINGS:
            f = atlas["frames"][f"{prop}:{facing}"]
            flat.append(sheet[f["y"]:f["y"] + f["h"], f["x"]:f["x"] + f["w"]])
    cw = min(260, max(c.shape[1] for c in flat) + 8)
    ch = max(c.shape[0] for c in flat) + 8
    cols = 8
    rows = (len(flat) + cols - 1) // cols
    img = Image.new("RGBA", (cw * cols, ch * rows), backdrop)
    for i, c in enumerate(flat):
        x = (i % cols) * cw + max(0, (cw - c.shape[1]) // 2)
        y = (i // cols) * ch + (ch - c.shape[0]) // 2
        img.alpha_composite(Image.fromarray(c, "RGBA"), (x, y))
    img.resize((img.width * 2, img.height * 2), Image.NEAREST).save(out)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--preview")
    args = parser.parse_args()
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    atlases: dict[str, dict] = {}
    catalog: dict[str, dict] = {}
    for theme in THEMES:
        if not (Path(__file__).parent / "iso_themes" / f"{theme}.py").exists():
            continue
        sheet, atlas, cat = build_theme(theme)
        Image.fromarray(sheet, "RGBA").save(OUT_DIR / f"{atlas['imageKey']}.png")
        print(f"wrote public/sprites/iso/{atlas['imageKey']}.png {sheet.shape[1]}x{sheet.shape[0]}, {len(cat)} props")
        atlases[theme] = atlas
        for k, v in cat.items():
            if k in catalog:
                raise SystemExit(f"prop id {k} is defined by two themes")
            catalog[k] = v
        if args.preview:
            prev = Path(args.preview)
            prev.mkdir(parents=True, exist_ok=True)
            contact_sheet(sheet, atlas, prev / f"iso_{theme}_props.png")
    write_ts(atlases, catalog)


def write_ts(atlases: dict, catalog: dict) -> None:
    lines = [
        "// AUTO-GENERATED by scripts/sprites/iso_assets.py. Do not edit by hand.",
        "import { IsoPropCatalogEntry, IsoThemeAtlas } from '../../../types/sprite';",
        "",
        "export const ISO_THEME_ATLAS: Record<string, IsoThemeAtlas> = " + json.dumps(atlases, indent=2) + ";",
        "",
        "export const ISO_PROP_CATALOG: Record<string, IsoPropCatalogEntry> = " + json.dumps(catalog, indent=2) + ";",
        "",
        "/** Every isometric prop id, for PropType. */",
        "export type IsoPropType =",
        *[f"  | '{k}'" for k in sorted(catalog)[:-1]],
        f"  | '{sorted(catalog)[-1]}';",
        "",
        "export const ISO_THEME_IMAGES: Record<string, string> = {",
        *[f"  {v['imageKey']}: '/sprites/iso/{v['imageKey']}.png'," for v in atlases.values()],
        "};",
        "",
    ]
    TS_OUT.write_text("\n".join(lines), encoding="utf-8")
    print(f"wrote {TS_OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
