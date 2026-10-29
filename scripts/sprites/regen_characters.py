"""Regenerate character walk sheets through OpenRouter using each character's current art as
the likeness reference and a known-good sheet as the layout reference.

    python scripts/sprites/regen_characters.py [--only id1,id2] [--max-spend 5.0] [--workers 4]

Each result is validated with the same segmentation/labelling the atlas build uses: it must
contain exactly 8 figures labelled "d u sR sR sR sR d u". A failed sheet is retried once;
if it still fails, the character keeps its current art. Accepted sheets are written to
art/source/characters/regen/<id>.png and picked up by process_characters.py.
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).parent))
from classify import head_symmetry  # noqa: E402
from process_characters import CONFIG, label_row  # noqa: E402
from sheetlib import background_mask, extract_figures, extract_fixed_row, group_rows, load_rgb  # noqa: E402
from generate_sheet import spent  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
REGEN_DIR = ROOT / "art" / "source" / "characters" / "regen"
WORK_DIR = ROOT / "art" / "source" / "characters" / "regen" / "_work"
LAYOUT_REF = ROOT / "art" / "source" / "characters" / "layout_reference_silhouettes.png"
# Heavy-set mannequins (make_heavy_layout.py) for bodyType 'large'; the default ones are slim and
# the model copies their build.
LAYOUT_REF_HEAVY = ROOT / "art" / "source" / "characters" / "layout_reference_silhouettes_heavy.png"
REJECTED_DIR = REGEN_DIR / "_rejected"

PROMPT = """Create a pixel art character sprite sheet of {name} from the sitcom {show}, matching EXACTLY the character in the first reference image (same face, hair, skin tone, outfit and colours). Match that art style: 16-bit SNES-era RPG pixel art, top-down 3/4 view, chunky pixels, clean dark 1-pixel outlines, flat shading, no anti-aliasing, no blur.

Use EXACTLY the same sheet format, framing, figure size and spacing as the second reference image (grey mannequin silhouettes that only show pose, framing and spacing - take nothing else from it).
Layout: ONE single horizontal row of 8 full-body figures, evenly spaced, all the same size and scale, all feet on the same ground line, clear empty space between figures so no two figures touch or overlap. No text, labels, grid lines, borders, shadows or floor.
Order left to right:
1. Facing the viewer (front), standing still, arms relaxed.
2. Facing away (back view), standing still.
3. Facing RIGHT in strict side profile, walking: right leg forward, left leg back (contact pose, legs wide apart).
4. Facing RIGHT in strict side profile, walking: passing pose, legs together under the body.
5. Facing RIGHT in strict side profile, walking: left leg forward, right leg back (contact pose, legs wide apart).
6. Facing RIGHT in strict side profile, walking: passing pose, legs together under the body.
7. Facing the viewer (front), mid-step: left foot lifted slightly.
8. Facing away (back view), mid-step: right foot lifted slightly.
Every side-view figure (3-6) faces RIGHT (nose toward the right edge of the image). Arms swing opposite to the legs.
Background: flat solid pure chroma green #00FF00 everywhere.{green_note}{body_note}"""

HEAVY_NOTE = """
BODY TYPE: {name} is heavy-set - overweight, with a round belly, wide hips, thick arms and legs and a full, round face, exactly as in the first reference image. Draw that build in every pose; the grey mannequins in the second reference image show the heavy build to follow (in the side views the belly sticks out in front). Draw the figures small enough that all EIGHT fit side by side in ONE row; empty space above and below is fine. Never add a second row."""

SHOW_NAMES = {"the_office": "The Office", "friends": "Friends", "silicon_valley": "Silicon Valley", "himym": "How I Met Your Mother"}
GREEN_CLOTHES = {"meredith", "jianyang"}


def cast_info() -> dict[str, dict]:
    from process_characters import read_cast
    return read_cast()


def reference_image(char_id: str, sheet_src: str, row_index: int, overrides: dict) -> Path:
    """Front + back views of the character's current art on a green backdrop."""
    rows = group_rows(extract_figures(str(ROOT / sheet_src))[0])
    row = rows[row_index]
    labels = label_row(row, overrides.get(char_id))
    front = next(f for f, (r, _) in zip(row, labels) if r == "down")
    back = next(f for f, (r, _) in zip(row, labels) if r == "up")
    pad = 16
    h = max(front.height, back.height) + pad * 2
    w = front.rgba.shape[1] + back.rgba.shape[1] + pad * 3
    canvas = Image.new("RGBA", (w, h), (0, 255, 0, 255))
    canvas.alpha_composite(Image.fromarray(front.rgba, "RGBA"), (pad, h - pad - front.height))
    canvas.alpha_composite(Image.fromarray(back.rgba, "RGBA"), (pad * 2 + front.rgba.shape[1], h - pad - back.height))
    scale = max(1, round(420 / h))
    canvas = canvas.convert("RGB").resize((w * scale, h * scale), Image.NEAREST)
    out = WORK_DIR / f"{char_id}_ref.png"
    canvas.save(out)
    return out


def validate(path: Path) -> str | None:
    """Structural check of a generated sheet. Returns None when it is usable, else a reason.

    Labels are fixed by the requested layout, so this only checks that there are 8 similar-size
    figures, that columns 3-6 are profiles and the others are front/back views.
    """
    rows = group_rows(extract_figures(str(path))[0])
    if len(rows) != 1:
        return f"{len(rows)} rows of figures"
    figs = extract_fixed_row(str(path), 8)
    if len(figs) != 8:
        return f"{len(figs)} figures"
    heights = [f.height for f in figs]
    if min(heights) < 0.85 * max(heights):
        return f"uneven figure heights {min(heights)}..{max(heights)}"
    sym = [head_symmetry(f) for f in figs]
    side = max(sym[i] for i in range(2, 6))
    frontal = min(sym[i] for i in (0, 1, 6, 7))
    # Asymmetric hair lowers front/back scores, so compare against the profiles, not a constant.
    if side > 0.4 or frontal < side + 0.08:
        return "views not distinguishable: " + " ".join(f"{v:.2f}" for v in sym)
    return None


def salvage_top_row(path: Path) -> Path | None:
    """The model sometimes repeats the figures (often headless) in a second row underneath.
    If so, crop at the emptiest horizontal line between the first two rows and return that
    file when the top row validates on its own."""
    rows = group_rows(extract_figures(str(path))[0])
    if len(rows) < 2:
        return None
    rgb = load_rgb(str(path))
    occupancy = (~background_mask(rgb)).sum(axis=1)
    lo = int(np.median([f.cy for f in rows[0]]))
    hi = int(np.median([f.cy for f in rows[1]]))
    if hi <= lo:
        return None
    cut = lo + int(np.argmin(occupancy[lo:hi]))
    img = Image.open(path).convert("RGB")
    cropped = path.with_name(path.stem + "_toprow.png")
    img.crop((0, 0, img.width, cut)).save(cropped)
    return cropped if validate(cropped) is None else None


def accept_candidate(path: Path) -> Path | None:
    """`path` itself if it validates, else a salvaged crop of it, else None."""
    if validate(path) is None:
        return path
    return salvage_top_row(path)


def regen(char_id: str, name: str, show: str, ref: Path, max_spend: float, heavy: bool = False) -> tuple[str, str]:
    # Reuse an earlier attempt that passes validation before paying for a new one.
    for previous in sorted(WORK_DIR.glob(f"{char_id}_try*.png")):
        if previous.stem.endswith("_toprow"):
            continue
        good = accept_candidate(previous)
        if good is not None:
            (REGEN_DIR / f"{char_id}.png").write_bytes(good.read_bytes())
            return char_id, f"ok (reused {good.name})"
    for attempt in (1, 2):
        if spent() > max_spend:
            return char_id, "skipped: budget"
        prompt = PROMPT.format(
            name=name,
            show=show,
            green_note=" The character wears green clothing: keep those greens clearly darker/bluer than the #00FF00 background." if char_id in GREEN_CLOTHES else " Do not use any green in the character.",
            body_note=HEAVY_NOTE.format(name=name) if heavy else "",
        )
        layout = LAYOUT_REF_HEAVY if heavy else LAYOUT_REF
        prompt_file = WORK_DIR / f"{char_id}_prompt.txt"
        prompt_file.write_text(prompt, encoding="utf-8")
        n = len([p for p in WORK_DIR.glob(f"{char_id}_try*.png") if not p.stem.endswith('_toprow')]) + 1
        out = WORK_DIR / f"{char_id}_try{n}.png"
        proc = subprocess.run(
            [sys.executable, str(Path(__file__).with_name("generate_sheet.py")), "--prompt-file", str(prompt_file),
             "--out", str(out.relative_to(ROOT)), "--ref", str(ref), "--ref", str(layout), "--aspect", "21:9"],
            capture_output=True, text=True, cwd=ROOT,
        )
        if proc.returncode != 0 or not out.exists():
            last = (proc.stdout + proc.stderr).strip().splitlines()[-1:] or ["?"]
            print(f"  {char_id} attempt {attempt} failed: {last[0][:200]}", flush=True)
            continue
        good = accept_candidate(out)
        if good is not None:
            (REGEN_DIR / f"{char_id}.png").write_bytes(good.read_bytes())
            return char_id, f"ok (attempt {attempt}{', top row' if good != out else ''})"
        print(f"  {char_id} attempt {attempt} rejected: {validate(out)}", flush=True)
    return char_id, "kept original"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--only")
    parser.add_argument("--max-spend", type=float, default=5.0)
    parser.add_argument("--workers", type=int, default=4)
    parser.add_argument("--replace", action="store_true",
                        help="regenerate characters that already have a sheet (old sheet and attempts move to regen/_rejected)")
    args = parser.parse_args()
    WORK_DIR.mkdir(parents=True, exist_ok=True)

    cfg = json.loads(CONFIG.read_text(encoding="utf-8"))
    overrides = cfg.get("overrides", {})
    cast = cast_info()
    jobs = []
    for show_id, show in cfg["shows"].items():
        for sheet in show["sheets"]:
            for row_index, char_id in enumerate(sheet["rows"]):
                if char_id is None or sheet["src"].endswith("_regen.png"):
                    continue
                if args.only and char_id not in args.only.split(","):
                    continue
                existing = REGEN_DIR / f"{char_id}.png"
                if existing.exists():
                    if not args.replace:
                        continue
                    REJECTED_DIR.mkdir(parents=True, exist_ok=True)
                    stamp = time.strftime("%Y%m%d%H%M%S")
                    for old in [existing, *WORK_DIR.glob(f"{char_id}_try*.png")]:
                        old.rename(REJECTED_DIR / f"{old.stem}_{stamp}{old.suffix}")
                ref = reference_image(char_id, sheet["src"], row_index, overrides)
                info = cast.get(char_id, {})
                heavy = info.get("bodyType") == "large"
                jobs.append((char_id, info.get("name", char_id), SHOW_NAMES[show_id], ref, heavy))

    print(f"{len(jobs)} characters to regenerate; spent so far ${spent():.2f}", flush=True)
    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        for char_id, result in pool.map(lambda j: regen(*j[:4], args.max_spend, heavy=j[4]), jobs):
            print(f"{char_id:12s} {result}", flush=True)
    print(f"total spent ${spent():.2f}", flush=True)


if __name__ == "__main__":
    main()
