"""Isometric character views: three-quarter front and back walk cycles plus a sitting pose.

    python scripts/sprites/iso_characters.py layout
    python scripts/sprites/iso_characters.py generate --only rachel,joey|missing [--model M] [--workers 4] [--compare TAG]
    python scripts/sprites/iso_characters.py build [--preview DIR]

`layout` renders grey mannequins with isoraster.py at the exact isometric angle and writes
art/source/characters/layout_reference_iso.png (and a heavy-build version for bodyType 'large'),
the pose and framing reference for generation. `--compare TAG` writes a candidate under
art/source/characters/iso/_work/compare/ without installing it, for trying other models.
`generate` asks the image model (through generate_sheet.py, spend-capped and logged in the
ledger) for one row of 8 figures per character, using the character's regenerated walk sheet as
the likeness reference; accepted sheets go to art/source/characters/iso/<id>.png.
`build` turns accepted sheets into public/sprites/characters/characters_iso.png and
src/data/sprites/generated/isoCharacterAtlas.ts.

Sheet order: 1 front idle, 2-4 front walk (contact, passing, contact), 5 back idle,
6-7 back walk (contact, contact), 8 front sitting. "Front" is turned 45 degrees to the viewer's
right (screen south-east, world +x); "back" walks away to the upper right (north-east, world -y).
The game mirrors both for the other two diagonals.
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).parent))
from generate_sheet import spent  # noqa: E402
from isoraster import Model, box, cyl, ell, render  # noqa: E402
from process_characters import (  # noqa: E402
    CONFIG, apply_palette, build_palette, crop_to_content, downsample, mirror, place, read_cast,
)
from sheetlib import extract_figures, extract_fixed_row, group_rows  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
SRC_DIR = ROOT / "art" / "source" / "characters" / "iso"
WORK_DIR = SRC_DIR / "_work"
REGEN_DIR = ROOT / "art" / "source" / "characters" / "regen"
LAYOUT_REF = ROOT / "art" / "source" / "characters" / "layout_reference_iso.png"
LAYOUT_REF_HEAVY = ROOT / "art" / "source" / "characters" / "layout_reference_iso_heavy.png"
COMPARE_DIR = WORK_DIR / "compare"
# Nano Banana Pro held the three-quarter angle best in a bake-off against Nano Banana 2 / 2.1 and
# GPT-5.4 Image 2 (Nov 2026); ~$0.14 a sheet. Fall back to google/gemini-3.1-flash-image if a
# character keeps failing validation.
DEFAULT_MODEL = "google/gemini-3-pro-image"
ATLAS_PNG = ROOT / "public" / "sprites" / "characters" / "characters_iso.png"
TS_OUT = ROOT / "src" / "data" / "sprites" / "generated" / "isoCharacterAtlas.ts"
BASE_ATLAS = ROOT / "public" / "sprites" / "characters"

POSES = ["front_idle", "front_a", "front_pass", "front_b", "back_idle", "back_a", "back_b", "front_sit"]
COLUMNS = ["front_idle", "front_a", "front_pass", "front_b", "front_pass",
           "back_idle", "back_a", "back_idle", "back_b", "back_idle", "front_sit"]

PROMPT = """Create a pixel art character sprite sheet of {name} from the sitcom {show}, matching EXACTLY the character in the first reference image (same face, hair, skin tone, outfit, proportions and colours) and the same art style: 16-bit pixel art, chunky pixels, clean dark 1-pixel outlines, flat shading, no anti-aliasing, no blur.

The second reference image shows grey mannequins. Copy their exact poses, viewing angle, framing, figure size and spacing, and take nothing else from them. The camera looks down from an isometric game angle (from above, about 30 degrees), so every figure is seen in THREE-QUARTER view, with the body turned 45 degrees, never straight front, back or side.

Layout: ONE single horizontal row of 8 full-body figures, evenly spaced, clear empty space between figures so no two touch. Left to right:
1. Three-quarter FRONT view: face and front of the body turned 45 degrees towards the viewer's RIGHT (we see the face, the character looks towards the lower right). Standing still, arms relaxed.
2. The same three-quarter front view, walking towards the lower right: right leg forward, left leg back (contact pose).
3. The same three-quarter front view, walking: passing pose, legs together under the body.
4. The same three-quarter front view, walking: left leg forward, right leg back (contact pose).
5. Three-quarter BACK view: turned 45 degrees away from the viewer towards the upper RIGHT (we see the back of the head and body, a little of one cheek). Standing still.
6. The same three-quarter back view, walking away towards the upper right: right leg forward.
7. The same three-quarter back view, walking away: left leg forward.
8. Three-quarter front view turned to the right, SITTING on an invisible seat: thighs horizontal, lower legs hanging straight down, hands resting on the lap.
Figures 1 to 7 are the same height with their feet on one ground line. No chair, text, labels, grid lines, borders, shadows or floor.
Background: flat solid pure chroma green #00FF00 everywhere.{green_note}{body_note}"""

HEAVY_NOTE = """
BODY TYPE: {name} is heavy-set - overweight, with a round belly, wide hips, thick arms and legs and a full, round face, exactly as in the first reference image. Draw that build in every pose; the grey mannequins in the second reference image show the heavy build to follow (the belly sticks out in front). Keep all EIGHT figures in ONE row; never add a second row."""

SHOW_NAMES = {"the_office": "The Office", "friends": "Friends", "silicon_valley": "Silicon Valley", "himym": "How I Met Your Mother"}
GREEN_CLOTHES = {"meredith", "jianyang"}


# ---------------------------------------------------------------------------------------------
# Mannequins


def mannequin(pose: str, heavy: bool = False) -> Model:
    """A 54px figure (1.7 m) in the canonical frame, facing +v; `heavy` widens it and adds a belly."""
    if heavy:
        return heavy_mannequin(pose)
    mdl = Model(pose, 20.0, 12.0)
    g, d = "white", "chrome"
    sitting = pose.endswith("sit")
    stride = {"a": 3.0, "b": -3.0}.get(pose.split("_")[-1], 0.0)
    if sitting:
        for u0 in (5.0, 11.0):
            mdl.add(box((u0, 3, 10), (u0 + 4, 16, 15), g))           # thighs
            mdl.add(box((u0, 12, 0), (u0 + 4, 16, 11), g, shade=-0.3))  # shins
        hip, chest, head0 = 15.0, 32.0, 33.0
    else:
        for u0, s in ((5.0, stride), (11.0, -stride)):
            mdl.add(box((u0, 4 + s * 0.6, 12), (u0 + 4, 8 + s * 0.6, 26), g))
            mdl.add(box((u0, 4 + s, 0), (u0 + 4, 8 + s, 13), g, shade=-0.2))
            mdl.add(box((u0 - 0.5, 4 + s, 0), (u0 + 4.5, 10 + s, 2), d))  # foot, toes forward
        hip, chest, head0 = 26.0, 43.0, 44.0
    mdl.add(box((4.5, 3.5, hip), (15.5, 8.5, chest), g))
    swing = 0.0 if sitting else -stride * 0.8
    for u0, s in ((2.0, swing), (15.5, -swing)):
        z0 = hip - 2 if not sitting else hip + 1
        mdl.add(box((u0, 4 + s, z0), (u0 + 2.5, 7.5 + s, chest - 1), g, shade=-0.1))
    mdl.add(cyl((8.5, 4.5, chest - 1), (11.5, 7.5, head0 + 1), g))
    # Face at the front of the head, dark hair over the back and top, so the facing reads.
    mdl.add(ell((6, 2.5, head0), (14, 10, head0 + 10), "cream", shade=0.3))
    mdl.add(ell((5.5, 1.0, head0 + 3), (14.5, 8.5, head0 + 11.5), "wood_dark", shade=0.5))
    return mdl


def heavy_mannequin(pose: str) -> Model:
    mdl = Model(pose, 24.0, 14.0)
    g, d = "white", "chrome"
    sitting = pose.endswith("sit")
    stride = {"a": 3.0, "b": -3.0}.get(pose.split("_")[-1], 0.0)
    if sitting:
        for u0 in (5.5, 12.5):
            mdl.add(box((u0, 3, 10), (u0 + 6, 17, 16), g))
            mdl.add(box((u0, 12, 0), (u0 + 6, 17, 11), g, shade=-0.3))
        hip, chest, head0 = 16.0, 32.0, 33.0
    else:
        for u0, s in ((5.5, stride), (12.5, -stride)):
            mdl.add(box((u0, 4 + s * 0.6, 12), (u0 + 6, 10 + s * 0.6, 26), g))
            mdl.add(box((u0, 4.5 + s, 0), (u0 + 5.5, 9.5 + s, 13), g, shade=-0.2))
            mdl.add(box((u0 - 0.5, 4.5 + s, 0), (u0 + 6, 11.5 + s, 2), d))
        hip, chest, head0 = 25.0, 42.0, 43.0
    mdl.add(box((3.5, 2.5, hip), (20.5, 11, chest), g))
    mdl.add(ell((5, 6, hip - 1), (19, 14, chest - 3), g, shade=0.1))  # belly
    swing = 0.0 if sitting else -stride * 0.8
    for u0, s in ((0.5, swing), (20.5, -swing)):
        z0 = hip - 2 if not sitting else hip + 1
        mdl.add(box((u0, 4 + s, z0), (u0 + 3.5, 8.5 + s, chest - 1), g, shade=-0.1))
    mdl.add(cyl((9, 5, chest - 1), (15, 9, head0 + 1), g))
    mdl.add(ell((6.5, 2.5, head0), (17.5, 11.5, head0 + 11), "cream", shade=0.3))
    mdl.add(ell((6.5, 1.0, head0 + 4), (17.5, 9.5, head0 + 12), "wood_dark", shade=0.5))
    return mdl


def render_layout() -> None:
    cell_w, scale, ground = 198, 6, 600
    for heavy, out in ((False, LAYOUT_REF), (True, LAYOUT_REF_HEAVY)):
        sheet = Image.new("RGB", (1584, 672), (0, 255, 0))
        for i, pose in enumerate(POSES):
            facing = "up" if pose.startswith("back") else "right"
            spr = render(mannequin(pose, heavy), facing)
            img = Image.fromarray(spr.rgba, "RGBA")
            img = img.resize((img.width * scale, img.height * scale), Image.NEAREST)
            x = i * cell_w + (cell_w - img.width) // 2
            y = ground - img.height
            sheet.paste(img, (x, y), img)
        sheet.save(out)
        print(f"wrote {out.relative_to(ROOT)}")


# ---------------------------------------------------------------------------------------------
# Generation


def validate(path: Path) -> str | None:
    rows = group_rows(extract_figures(str(path))[0])
    if len(rows) != 1:
        return f"{len(rows)} rows of figures"
    figs = extract_fixed_row(str(path), 8)
    if len(figs) != 8:
        return f"{len(figs)} figures"
    standing = [f.height for f in figs[:7]]
    if min(standing) < 0.85 * max(standing):
        return f"uneven standing heights {min(standing)}..{max(standing)}"
    # A seated figure is a little shorter and clearly wider for its height; heavy builds barely
    # lose height when they sit, so the shape is the better tell.
    aspect = [f.rgba.shape[1] / f.height for f in figs]
    if figs[7].height > 0.96 * np.median(standing) or aspect[7] < 1.12 * np.median(aspect[:7]):
        return "figure 8 is not sitting"
    return None


def generate(char_id: str, name: str, show: str, max_spend: float, heavy: bool = False,
             model: str = DEFAULT_MODEL, compare: str | None = None) -> str:
    SRC_DIR.mkdir(parents=True, exist_ok=True)
    COMPARE_DIR.mkdir(parents=True, exist_ok=True)
    if compare is None:
        for previous in sorted(WORK_DIR.glob(f"{char_id}_try*.png")):
            if validate(previous) is None:
                (SRC_DIR / f"{char_id}.png").write_bytes(previous.read_bytes())
                return f"ok (reused {previous.name})"
    ref = REGEN_DIR / f"{char_id}.png"
    if not ref.exists():
        return "no regenerated walk sheet to use as likeness reference"
    if spent() > max_spend:
        return "skipped: budget"
    prompt = PROMPT.format(
        name=name,
        show=show,
        green_note=" The character wears green clothing: keep those greens clearly darker/bluer than the background." if char_id in GREEN_CLOTHES else " Do not use any green in the character.",
        body_note=HEAVY_NOTE.format(name=name) if heavy else "",
    )
    prompt_file = WORK_DIR / f"{char_id}_prompt.txt"
    prompt_file.write_text(prompt, encoding="utf-8")
    if compare:
        out = COMPARE_DIR / f"{char_id}_{compare}.png"
    else:
        n = len(list(WORK_DIR.glob(f"{char_id}_try*.png"))) + 1
        out = WORK_DIR / f"{char_id}_try{n}.png"
    proc = subprocess.run(
        [sys.executable, str(Path(__file__).with_name("generate_sheet.py")), "--prompt-file", str(prompt_file),
         "--out", str(out.relative_to(ROOT)), "--ref", str(ref), "--ref", str(LAYOUT_REF_HEAVY if heavy else LAYOUT_REF),
         "--aspect", "21:9", "--model", model],
        capture_output=True, text=True, cwd=ROOT,
    )
    if proc.returncode != 0 or not out.exists():
        return "failed: " + ((proc.stdout + proc.stderr).strip().splitlines() or ["?"])[-1][:200]
    reason = validate(out)
    if reason:
        return f"rejected ({out.name}): {reason}"
    if not compare:
        (SRC_DIR / f"{char_id}.png").write_bytes(out.read_bytes())
    return f"ok ({out.name})"


# ---------------------------------------------------------------------------------------------
# Atlas build


def base_height(char_id: str, cfg: dict) -> int:
    """Height of the character's front idle frame in its existing atlas, so both views match."""
    atlas_ts = (ROOT / "src" / "data" / "sprites" / "generated" / "characterAtlas.ts").read_text(encoding="utf-8")
    import re
    m = re.search(rf"\b{char_id}: {{ imageKey: '(\w+)', row: (\d+) }}", atlas_ts)
    if not m:
        return cfg["baseFigureHeight"]
    img = np.asarray(Image.open(BASE_ATLAS / f"{m.group(1)}.png").convert("RGBA"))
    ch, cw = cfg["cell"]["height"], cfg["cell"]["width"]
    row = int(m.group(2))
    cell = img[row * ch:(row + 1) * ch, 0:cw, 3]
    ys = np.nonzero(cell.any(axis=1))[0]
    return int(ys.max() - ys.min() + 1) if len(ys) else cfg["baseFigureHeight"]


def build(preview: str | None) -> None:
    cfg = json.loads(CONFIG.read_text(encoding="utf-8"))
    cw, ch, base = cfg["cell"]["width"], cfg["cell"]["height"], cfg["cell"]["baseline"]
    sheets = sorted(SRC_DIR.glob("*.png"))
    rows: list[np.ndarray] = []
    ids: list[str] = []
    for path in sheets:
        char_id = path.stem
        figs = extract_fixed_row(str(path), 8)
        if len(figs) != 8:
            print(f"  {char_id}: {len(figs)} figures, skipped")
            continue
        target = base_height(char_id, cfg)
        scale = target / float(np.median([f.height for f in figs[:7]]))
        small = [crop_to_content(downsample(f.rgba, scale)) for f in figs]
        palette = build_palette(small)
        frames = dict(zip(POSES, [apply_palette(f, palette) for f in small]))
        cells = []
        for col in COLUMNS:
            frame = frames[col]
            # Sitting frames rest their seat on the baseline the game lowers seated characters to.
            cells.append(place(frame, cw, ch, base))
        rows.append(np.concatenate(cells, axis=1))
        ids.append(char_id)
        print(f"  {char_id}: target {target}px, scale {scale:.3f}")
    if not rows:
        print("no accepted sheets")
        return
    atlas = np.concatenate(rows, axis=0)
    ATLAS_PNG.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(atlas, "RGBA").save(ATLAS_PNG)
    print(f"wrote {ATLAS_PNG.relative_to(ROOT)} {atlas.shape[1]}x{atlas.shape[0]}")
    if preview:
        out = Path(preview)
        out.mkdir(parents=True, exist_ok=True)
        bg = Image.new("RGBA", (atlas.shape[1], atlas.shape[0]), (126, 92, 58, 255))
        bg.alpha_composite(Image.fromarray(atlas, "RGBA"))
        bg.resize((bg.width * 4, bg.height * 4), Image.NEAREST).save(out / "characters_iso.png")
    write_ts(ids, cw, ch, base)


def write_ts(ids: list[str], cw: int, ch: int, base: int) -> None:
    lines = [
        "// AUTO-GENERATED by scripts/sprites/iso_characters.py. Do not edit by hand.",
        "",
        f"export const ISO_CHARACTER_CELL = {{ width: {cw}, height: {ch}, baseline: {base} }};",
        "",
        "/** Atlas row per character; columns follow ISO_CHARACTER_COLUMNS. */",
        "export const ISO_CHARACTER_ROWS: Record<string, number> = {",
        *[f"  {cid}: {i}," for i, cid in enumerate(ids)],
        "};",
        "",
        "export const ISO_CHARACTER_COLUMNS = " + json.dumps(COLUMNS) + " as const;",
        "",
        "export const ISO_CHARACTER_IMAGE = '/sprites/characters/characters_iso.png';",
        "",
    ]
    TS_OUT.write_text("\n".join(lines), encoding="utf-8")
    print(f"wrote {TS_OUT.relative_to(ROOT)}")


def main() -> None:
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest="cmd", required=True)
    sub.add_parser("layout")
    g = sub.add_parser("generate")
    g.add_argument("--only", required=True, help="comma-separated ids, or 'missing' for every character without a sheet")
    g.add_argument("--max-spend", type=float, default=17.0)
    g.add_argument("--model", default=DEFAULT_MODEL)
    g.add_argument("--compare", help="write candidates to _work/compare/<id>_<TAG>.png without installing them")
    g.add_argument("--workers", type=int, default=1)
    b = sub.add_parser("build")
    b.add_argument("--preview")
    args = parser.parse_args()
    if args.cmd == "layout":
        render_layout()
    elif args.cmd == "generate":
        cast = read_cast()
        cfg = json.loads(CONFIG.read_text(encoding="utf-8"))
        show_of = {cid: show for show, s in cfg["shows"].items() for sh in s["sheets"] for cid in sh["rows"] if cid}
        ids = [c for c in show_of if not (SRC_DIR / f"{c}.png").exists()] if args.only == "missing" else args.only.split(",")

        def job(cid: str) -> tuple[str, str]:
            info = cast.get(cid, {})
            return cid, generate(cid, info.get("name", cid), SHOW_NAMES.get(show_of.get(cid, ""), "a sitcom"), args.max_spend,
                                 heavy=info.get("bodyType") == "large", model=args.model, compare=args.compare)

        print(f"{len(ids)} characters; spent so far ${spent():.2f}", flush=True)
        with ThreadPoolExecutor(max_workers=max(1, args.workers)) as pool:
            for cid, result in pool.map(job, ids):
                print(f"{cid:12s} {result}  (spent ${spent():.2f})", flush=True)
    else:
        build(args.preview)


if __name__ == "__main__":
    main()
