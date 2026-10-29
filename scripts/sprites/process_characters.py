"""Build clean, native-resolution character atlases from the AI-generated source sheets.

    python scripts/sprites/process_characters.py [--preview DIR]

For every character this:
  1. segments the figures out of the source sheet (no grid assumptions),
  2. labels each figure front / back / side and detects which way side views face,
  3. mirrors every side view to face right, so one consistent set drives both directions,
  4. downsamples with one scale per character to the in-game pixel size and a shared palette,
  5. pins every frame to the same feet baseline and torso centre,
  6. builds 4-frame walk cycles (synthesising leg lifts for front/back views, which the
     generator only ever drew standing still),
and writes public/sprites/characters/<atlas>.png plus src/data/sprites/generated/characterAtlas.ts.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(__file__).parent))
from classify import classify_row, facing_score, estimate_skin, neck_row, torso_width_ratio  # noqa: E402
from sheetlib import Figure, extract_figures, extract_fixed_row, group_rows  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
CONFIG = Path(__file__).with_name("character_sheets.json")
OUT_DIR = ROOT / "public" / "sprites" / "characters"
# Regenerated sheets (scripts/sprites/regen_characters.py) replace a character's original row.
# Their columns follow a fixed order: front, back, 4 right-facing walk poses
# (contact, passing, contact, passing), front step, back step.
REGEN_DIR = ROOT / "art" / "source" / "characters" / "regen"
REGEN_LAYOUT = "d u sR sR sR sR d u"
TS_OUT = ROOT / "src" / "data" / "sprites" / "generated" / "characterAtlas.ts"

# Atlas column layout. Must match CHARACTER_ATLAS_COLUMNS in src/data/sprites/atlasLayout.ts.
DIRECTIONS = ["down", "up", "right"]
FRAMES_PER_DIRECTION = 5  # idle + 4 walk frames
PALETTE_COLORS = 40


def read_cast() -> dict[str, dict]:
    """name, heightScale and bodyType per character id from src/data/characters/*_cast.ts."""
    cast: dict[str, dict] = {}
    for path in (ROOT / "src" / "data" / "characters").glob("*_cast.ts"):
        text = path.read_text(encoding="utf-8")
        ids = list(re.finditer(r"\bid:\s*'([a-z_]+)'", text))
        for i, match in enumerate(ids):
            block = text[match.end(): ids[i + 1].start() if i + 1 < len(ids) else len(text)]
            hs = re.search(r"heightScale:\s*([\d.]+)", block)
            bt = re.search(r"bodyType:\s*'([a-z]+)'", block)
            name = re.search(r"\bname:\s*(['\"])(.+?)\1", block)
            cast[match.group(1)] = {
                "name": name.group(2) if name else match.group(1),
                "heightScale": float(hs.group(1)) if hs else 1.0,
                "bodyType": bt.group(1) if bt else "normal",
            }
    if not cast:
        raise RuntimeError("No characters parsed from src/data/characters/*_cast.ts")
    return cast


# Builds a bodyType must reach relative to its sheet's typical figure (see build_factor).
BODY_TYPE_LIMITS = {"large": (1.25, 9.0), "petite": (0.0, 0.94), "slim": (0.0, 0.95)}


# --------------------------------------------------------------------------------------------
# Labelling


def label_row(row: list[Figure], override: str | None) -> list[tuple[str, bool]]:
    """Return (role, faces_right) per figure. role is down | up | side | skip."""
    if override:
        tokens = override.split()
        if len(tokens) != len(row):
            raise ValueError(f"override has {len(tokens)} tokens but row has {len(row)} figures")
        mapping = {"d": ("down", False), "u": ("up", False), "sL": ("side", False), "sR": ("side", True), "x": ("skip", False)}
        return [mapping[t] for t in tokens]

    roles, metrics = classify_row(row)
    skin = estimate_skin(row[0])
    labels = []
    for role, fig in zip(roles, row):
        labels.append((role, facing_score(fig, skin) > 0))
    return labels


def describe(labels: list[tuple[str, bool]]) -> str:
    out = []
    for role, right in labels:
        out.append({"down": "d", "up": "u", "skip": "x"}.get(role, "sR" if right else "sL"))
    return " ".join(out)


# --------------------------------------------------------------------------------------------
# Pixel processing


def downsample(rgba: np.ndarray, scale: float) -> np.ndarray:
    """Area-average downsample with premultiplied alpha, then a hard alpha cut."""
    img = rgba.astype(np.float32) / 255.0
    alpha = img[..., 3:4]
    premult = np.concatenate([img[..., :3] * alpha, alpha], axis=2)
    h, w = rgba.shape[:2]
    nw, nh = max(1, round(w * scale)), max(1, round(h * scale))
    channels = [
        np.asarray(Image.fromarray(premult[..., c]).resize((nw, nh), Image.BOX), dtype=np.float32)
        for c in range(4)
    ]
    out_a = channels[3]
    safe = np.maximum(out_a, 1e-6)
    rgb = np.stack([channels[c] / safe for c in range(3)], axis=2)
    result = np.zeros((nh, nw, 4), dtype=np.uint8)
    result[..., :3] = np.clip(rgb * 255 + 0.5, 0, 255).astype(np.uint8)
    result[..., 3] = np.where(out_a >= 0.5, 255, 0).astype(np.uint8)
    return result


def build_palette(frames: list[np.ndarray]) -> Image.Image:
    opaque = np.concatenate([f[..., :3][f[..., 3] > 0] for f in frames], axis=0)
    strip = Image.fromarray(opaque.reshape(1, -1, 3).astype(np.uint8), "RGB")
    return strip.quantize(colors=PALETTE_COLORS, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)


def apply_palette(frame: np.ndarray, palette: Image.Image) -> np.ndarray:
    rgb = Image.fromarray(frame[..., :3], "RGB").quantize(palette=palette, dither=Image.Dither.NONE).convert("RGB")
    out = frame.copy()
    out[..., :3] = np.asarray(rgb)
    out[out[..., 3] == 0] = 0
    return out


def crop_to_content(frame: np.ndarray) -> np.ndarray:
    ys, xs = np.nonzero(frame[..., 3])
    return frame[ys.min():ys.max() + 1, xs.min():xs.max() + 1]


def torso_center_x(frame: np.ndarray) -> float:
    """Horizontal anchor: centre of the torso band, which stays put while legs and arms swing."""
    h = frame.shape[0]
    band = frame[int(h * 0.25): int(h * 0.55), :, 3] > 0
    _, xs = np.nonzero(band)
    if len(xs) == 0:
        return frame.shape[1] / 2
    return (xs.min() + xs.max()) / 2


def leg_spread(frame: np.ndarray) -> int:
    h = frame.shape[0]
    feet = frame[int(h * 0.85):, :, 3] > 0
    _, xs = np.nonzero(feet)
    return int(xs.max() - xs.min()) if len(xs) else 0


def lift_leg(frame: np.ndarray, side: str, lift: int) -> np.ndarray:
    """Raise one leg of a front/back view by `lift` pixels to fake a stepping pose."""
    out = frame.copy()
    h, w = frame.shape[:2]
    hip = int(h * 0.74)
    cx = int(round(torso_center_x(frame)))
    cols = slice(0, cx) if side == "left" else slice(cx, w)
    region = frame[hip:, cols].copy()
    shifted = np.zeros_like(region)
    shifted[: region.shape[0] - lift] = region[lift:]
    out[hip:, cols] = shifted
    return out


def widen_body(
    rgba: np.ndarray,
    factor: float,
    side_view: bool,
    heavy: bool = False,
    faces_right: bool = True,
) -> np.ndarray:
    """Widen everything below the neck by `factor`, leaving the head untouched.

    Front/back views widen the torso fully and the legs a little less; profiles widen the torso
    (belly/chest depth) but barely the legs, so a heavier character does not get a longer stride.
    `heavy` shapes the widening to carry the weight at the belly instead of the shoulders; in
    profile it also grows forward from near the back, so the belly leads rather than the back.
    Works at source resolution, before the area downsample, so no pixel doubling shows.
    """
    if abs(factor - 1.0) < 0.02:
        return rgba
    mask = rgba[..., 3] > 0
    h, w = mask.shape
    neck = neck_row(mask)
    body = h - neck
    hip = neck + int(body * 0.55)
    blend = max(2, int(h * 0.04))
    leg_weight = 0.35 if side_view else 0.75
    rows = np.arange(h, dtype=np.float32)
    t = (rows - neck) / max(1, body)  # 0 at the neck, 1 at the feet
    if heavy:
        # Narrower shoulders, fullest at the belly, easing into the hips and legs.
        weight = np.interp(t, [0.0, 0.15, 0.4, 0.55, 0.65, 1.0], [0.7, 0.85, 1.2, 1.1, leg_weight, leg_weight])
    else:
        weight = np.interp(t, [0.0, 0.55, 0.65, 1.0], [1.0, 1.0, leg_weight, leg_weight])
    shoulders = np.clip((rows - neck) / blend, 0, 1)  # no change above the neck
    scale = 1 + (factor - 1) * weight * shoulders

    band = mask[neck + int(body * 0.1): hip]
    xs = np.nonzero(band.any(axis=0))[0]
    x0, x1 = (xs.min(), xs.max()) if len(xs) else (0, w - 1)
    anchor_frac = 0.5
    if side_view and heavy:
        anchor_frac = 0.25 if faces_right else 0.75  # near the back edge
    anchor = x0 + (x1 - x0) * anchor_frac
    smax = max(float(scale.max()), 1.0)
    out_anchor = anchor * smax + 1
    out_w = int(np.ceil(out_anchor + (w - anchor) * smax)) + 1
    X = np.arange(out_w, dtype=np.float32)[None, :]
    src_x = np.round(anchor + (X - out_anchor) / scale[:, None]).astype(int)
    valid = (src_x >= 0) & (src_x < w)
    src_x = np.clip(src_x, 0, w - 1)
    out = rgba[np.arange(h)[:, None], src_x]
    out[~valid] = 0
    return out


def mirror(frame: np.ndarray) -> np.ndarray:
    return frame[:, ::-1].copy()


def frame_distance(a: np.ndarray, b: np.ndarray) -> float:
    h = max(a.shape[0], b.shape[0])
    w = max(a.shape[1], b.shape[1])
    pa = np.zeros((h, w), dtype=bool)
    pb = np.zeros((h, w), dtype=bool)
    pa[h - a.shape[0]:, :a.shape[1]] = a[..., 3] > 0
    pb[h - b.shape[0]:, :b.shape[1]] = b[..., 3] > 0
    return float((pa ^ pb).sum())


def place(frame: np.ndarray, cell_w: int, cell_h: int, baseline: int) -> np.ndarray:
    """Place a frame in a cell with its feet on the baseline and torso on the centre line."""
    cell = np.zeros((cell_h, cell_w, 4), dtype=np.uint8)
    fh, fw = frame.shape[:2]
    x0 = int(round(cell_w / 2 - torso_center_x(frame)))
    y0 = baseline - fh
    sx0, sy0 = max(0, -x0), max(0, -y0)
    dx0, dy0 = max(0, x0), max(0, y0)
    cw = min(fw - sx0, cell_w - dx0)
    ch = min(fh - sy0, cell_h - dy0)
    if cw <= 0 or ch <= 0:
        raise ValueError("frame does not fit in cell")
    if x0 < 0 or x0 + fw > cell_w or y0 < 0:
        print(f"    warning: frame {fw}x{fh} clipped by cell")
    cell[dy0:dy0 + ch, dx0:dx0 + cw] = frame[sy0:sy0 + ch, sx0:sx0 + cw]
    return cell


# --------------------------------------------------------------------------------------------
# Cycle construction


def front_cycle(frames: list[np.ndarray]) -> list[np.ndarray]:
    """idle, step, idle, opposite step for a front or back view.

    Uses a genuinely different stepping frame when the sheet has one (mirrored for the other
    foot); otherwise fakes the step by lifting one leg, since most generated sheets only drew
    these views standing still.
    """
    idle = frames[0]
    if len(frames) > 1:
        step = max(frames[1:], key=lambda f: frame_distance(idle, f))
        if frame_distance(idle, step) > 0.06 * (idle[..., 3] > 0).sum():
            return [idle, step, idle, mirror(step)]
    return [idle, lift_leg(idle, "left", 2), idle, lift_leg(idle, "right", 2)]


def side_cycle(frames: list[np.ndarray]) -> tuple[np.ndarray, list[np.ndarray]]:
    """Return (idle, walk[4]) for right-facing side frames."""
    spreads = [leg_spread(f) for f in frames]
    order = sorted(range(len(frames)), key=lambda i: spreads[i])
    narrow = frames[order[0]]
    if len(frames) == 1:
        return narrow, [narrow] * 4
    passing = [frames[i] for i in order if spreads[i] < 0.75 * spreads[order[-1]]]
    contacts = [frames[i] for i in order[::-1] if spreads[i] >= 0.75 * spreads[order[-1]]]
    a = contacts[0]
    b = max(contacts[1:], key=lambda f: frame_distance(a, f)) if len(contacts) > 1 else a
    if len(passing) >= 2:
        return narrow, [a, passing[0], b, passing[1]]
    if passing:
        return narrow, [a, passing[0], b, passing[0]]
    # No passing pose was drawn: alternate the two most different strides.
    return narrow, [a, b, a, b]


# --------------------------------------------------------------------------------------------


def process_character(
    char_id: str,
    row: list[Figure],
    labels: list[tuple[str, bool]],
    height_scale: float,
    cfg: dict,
    ordered: bool = False,
    build: float = 1.0,
    heavy: bool = False,
) -> list[np.ndarray]:
    groups: dict[str, list[np.ndarray]] = {"down": [], "up": [], "right": []}
    fronts = [fig for fig, (role, _) in zip(row, labels) if role == "down"]
    if not fronts:
        raise ValueError(f"{char_id}: no front-facing frame detected")
    ref_height = float(np.median([f.height for f in fronts]))
    target = cfg["baseFigureHeight"] * height_scale
    scale = target / ref_height

    small: list[tuple[str, bool, np.ndarray]] = []
    for fig, (role, right) in zip(row, labels):
        if role == "skip":
            continue
        source = widen_body(fig.rgba, build, side_view=role == "side", heavy=heavy, faces_right=right)
        small.append((role, right, crop_to_content(downsample(source, scale))))

    palette = build_palette([f for _, _, f in small])
    for role, right, frame in small:
        frame = apply_palette(frame, palette)
        if role == "side":
            groups["right"].append(frame if right else mirror(frame))
        else:
            groups[role].append(frame)

    if not groups["up"]:
        raise ValueError(f"{char_id}: no back-facing frame detected")
    if not groups["right"]:
        raise ValueError(f"{char_id}: no side frame detected")

    cells: list[np.ndarray] = []
    cw, ch, base = cfg["cell"]["width"], cfg["cell"]["height"], cfg["cell"]["baseline"]
    for direction in DIRECTIONS:
        frames = groups[direction]
        if direction == "right" and ordered and len(frames) == 4:
            # Keep the drawn contact / passing / contact / passing order; idle on a passing pose.
            idle, walk = frames[1], frames
        elif direction == "right":
            idle, walk = side_cycle(frames)
        else:
            idle, walk = frames[0], front_cycle(frames)
        for f in [idle, *walk]:
            cells.append(place(f, cw, ch, base))
    return cells


def build_factor(
    char_id: str,
    regen_front: Figure,
    original_builds: dict[str, float],
    sheet_typical: float,
    cast: dict[str, dict],
    cfg: dict,
) -> float:
    """Horizontal body scale that gives a regenerated figure the build of its original art.

    relative = original torso width / the original sheet's typical width (cancels per-sheet
    style), clamped by the character's bodyType; target = buildBase * relative.
    `buildScale` in the config multiplies the result for hand tuning.
    """
    relative = 1.0
    if char_id in original_builds and sheet_typical > 0:
        relative = original_builds[char_id] / sheet_typical
    lo, hi = BODY_TYPE_LIMITS.get(cast.get(char_id, {}).get("bodyType", "normal"), (0.0, 9.0))
    relative = min(max(relative, lo), hi)
    target = cfg.get("buildBase", 0.36) * relative
    current = torso_width_ratio(regen_front)
    factor = target / current if current > 0 else 1.0
    if cast.get(char_id, {}).get("bodyType") == "large":
        # Sheets regenerated against the heavy mannequins already carry the right build (and
        # a matching round face); only widen when the model still drew them slim.
        factor = max(factor, 1.0)
    factor *= cfg.get("buildScale", {}).get(char_id, 1.0)
    return float(min(max(factor, 0.85), 1.6))


def contact_sheet(path: Path, entries: list[tuple[str, str, list[np.ndarray]]], cell_w: int, cell_h: int) -> None:
    zoom = 3
    label_w = 150
    cols = len(DIRECTIONS) * FRAMES_PER_DIRECTION
    img = Image.new("RGBA", (label_w + cols * cell_w * zoom, len(entries) * cell_h * zoom), (46, 52, 64, 255))
    draw = ImageDraw.Draw(img)
    for r, (char_id, labels, cells) in enumerate(entries):
        draw.text((4, r * cell_h * zoom + 4), char_id, fill=(255, 255, 0, 255))
        draw.text((4, r * cell_h * zoom + 20), labels, fill=(200, 200, 200, 255))
        for c, cell in enumerate(cells):
            tile = Image.fromarray(cell, "RGBA").resize((cell_w * zoom, cell_h * zoom), Image.NEAREST)
            img.alpha_composite(tile, (label_w + c * cell_w * zoom, r * cell_h * zoom))
    img.save(path)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--preview", help="directory for labelled contact sheets")
    parser.add_argument("--only", help="comma separated show ids to process")
    args = parser.parse_args()

    cfg = json.loads(CONFIG.read_text(encoding="utf-8"))
    overrides: dict[str, str] = cfg.get("overrides", {})
    cast = read_cast()
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    cw, ch = cfg["cell"]["width"], cfg["cell"]["height"]

    atlas_entries: dict[str, dict] = {}
    for show_id, show in cfg["shows"].items():
        if args.only and show_id not in args.only.split(","):
            continue
        entries: list[tuple[str, str, list[np.ndarray]]] = []
        for sheet in show["sheets"]:
            figures, _ = extract_figures(str(ROOT / sheet["src"]))
            rows = group_rows(figures)
            # Build of each character's original front view, relative to the sheet's typical
            # figure. Regenerated sheets all came out with one body shape; this restores who
            # is heavy-set or petite without importing the sheet's overall art style.
            original_builds: dict[str, float] = {}
            for row, char_id in zip(rows, sheet["rows"]):
                if char_id is None:
                    continue
                try:
                    labels = label_row(row, overrides.get(char_id))
                    front = next(f for f, (r, _) in zip(row, labels) if r == "down")
                    original_builds[char_id] = torso_width_ratio(front)
                except (StopIteration, ValueError):
                    pass
            sheet_typical = float(np.median(list(original_builds.values()))) if original_builds else 0.0
            if len(rows) != len(sheet["rows"]):
                print(f"  {sheet['src']}: detected {len(rows)} rows, config lists {len(sheet['rows'])}")
            for row, char_id in zip(rows, sheet["rows"]):
                if char_id is None:
                    continue
                source = "original"
                ordered = False
                override = overrides.get(char_id)
                regen = REGEN_DIR / f"{char_id}.png"
                build = 1.0
                if regen.exists():
                    regen_row = extract_fixed_row(str(regen), 8)
                    if len(regen_row) == 8:
                        row, ordered, source = regen_row, True, "regen"
                        # The generation prompt fixes the layout, so labels are known.
                        override = cfg.get("regenOverrides", {}).get(char_id, REGEN_LAYOUT)
                        build = build_factor(char_id, row[0], original_builds, sheet_typical, cast, cfg)
                labels = label_row(row, override)
                desc = describe(labels)
                info = cast.get(char_id, {})
                print(
                    f"  {char_id:12s} {desc}  ({source}{', override' if override else ''})"
                    f"  height x{info.get('heightScale', 1.0):.2f}  build x{build:.2f}  {info.get('bodyType', '?')}"
                )
                cells = process_character(
                    char_id, row, labels, info.get("heightScale", 1.0), cfg, ordered, build,
                    heavy=info.get("bodyType") == "large",
                )
                entries.append((char_id, desc, cells))

        atlas = np.zeros((len(entries) * ch, len(DIRECTIONS) * FRAMES_PER_DIRECTION * cw, 4), dtype=np.uint8)
        for r, (char_id, _, cells) in enumerate(entries):
            for c, cell in enumerate(cells):
                atlas[r * ch:(r + 1) * ch, c * cw:(c + 1) * cw] = cell
            atlas_entries[char_id] = {"imageKey": show["atlas"], "row": r}
        out_png = OUT_DIR / f"{show['atlas']}.png"
        Image.fromarray(atlas, "RGBA").save(out_png, optimize=True)
        print(f"wrote {out_png.relative_to(ROOT)} ({len(entries)} characters)")
        if args.preview:
            contact_sheet(Path(args.preview) / f"preview_{show['atlas']}.png", entries, cw, ch)

    if not args.only:
        write_ts(atlas_entries, cfg)


def write_ts(entries: dict[str, dict], cfg: dict) -> None:
    TS_OUT.parent.mkdir(parents=True, exist_ok=True)
    images = sorted({e["imageKey"] for e in entries.values()})
    lines = [
        "// AUTO-GENERATED by scripts/sprites/process_characters.py. Do not edit by hand.",
        "import { CharacterAtlasEntry } from '../atlasLayout';",
        "",
        f"export const CHARACTER_CELL = {{ width: {cfg['cell']['width']}, height: {cfg['cell']['height']}, baseline: {cfg['cell']['baseline']} }} as const;",
        "",
        "export const CHARACTER_ATLAS_IMAGES: Record<string, string> = {",
        *[f"  {k}: '/sprites/characters/{k}.png'," for k in images],
        "};",
        "",
        "export const CHARACTER_ATLAS: Record<string, CharacterAtlasEntry> = {",
        *[f"  {cid}: {{ imageKey: '{e['imageKey']}', row: {e['row']} }}," for cid, e in entries.items()],
        "};",
        "",
    ]
    TS_OUT.write_text("\n".join(lines), encoding="utf-8")
    print(f"wrote {TS_OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
