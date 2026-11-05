"""Generate the pixel-art tilesets (floors, wall faces, doors, windows) for every set theme.

    python scripts/sprites/generate_tiles.py [--preview DIR]

Everything is drawn at 1 art pixel = 1 world pixel on 32px tiles, matching the character
atlases. Floors are 128x128 seamless textures (a 4x4 block of tiles); the renderer picks the
tile by grid position modulo 4, so neighbouring tiles always join up. Wall faces, doors and
windows are 4 variants in a 128x32 strip. Wall tops (caps) are not in the image: the map
baker draws them from neighbour data, see src/engine/TileMapBaker.ts.

Writes public/sprites/tiles/tiles_<theme>.png and src/data/sprites/generated/tileAtlas.ts.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = ROOT / "public" / "sprites" / "tiles"
TS_OUT = ROOT / "src" / "data" / "sprites" / "generated" / "tileAtlas.ts"

T = 32          # tile size
M = 128         # macro texture size (4x4 tiles)
BAYER4 = np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]], dtype=np.float32) / 16.0 - 0.5


def hexrgb(h: str) -> np.ndarray:
    h = h.lstrip("#")
    return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], dtype=np.uint8)


def ramp(colors: list[str]) -> np.ndarray:
    return np.stack([hexrgb(c) for c in colors])


def periodic_noise(size: int, cells: int, rng: np.random.Generator) -> np.ndarray:
    """Smooth value noise that wraps seamlessly at `size`."""
    grid = rng.random((cells, cells), dtype=np.float32)
    coords = np.arange(size, dtype=np.float32) * cells / size
    i0 = np.floor(coords).astype(int)
    f = coords - i0
    f = f * f * (3 - 2 * f)
    i1 = (i0 + 1) % cells
    g00 = grid[np.ix_(i0, i0)]
    g10 = grid[np.ix_(i1, i0)]
    g01 = grid[np.ix_(i0, i1)]
    g11 = grid[np.ix_(i1, i1)]
    fy = f[:, None]
    fx = f[None, :]
    top = g00 * (1 - fx) + g01 * fx
    bottom = g10 * (1 - fx) + g11 * fx
    return top * (1 - fy) + bottom * fy


def fbm(size: int, rng: np.random.Generator, octaves: tuple[int, ...] = (2, 4, 8)) -> np.ndarray:
    total = np.zeros((size, size), dtype=np.float32)
    weight = 0.0
    for i, cells in enumerate(octaves):
        w = 0.5 ** i
        total += periodic_noise(size, cells, rng) * w
        weight += w
    return total / weight


def quantize(values: np.ndarray, colors: np.ndarray, dither: float = 1.0) -> np.ndarray:
    """Map 0..1 values onto a colour ramp with ordered dithering (classic pixel-art shading)."""
    h, w = values.shape
    bayer = np.tile(BAYER4, (h // 4 + 1, w // 4 + 1))[:h, :w]
    idx = values * (len(colors) - 1) + bayer * dither
    idx = np.clip(np.round(idx), 0, len(colors) - 1).astype(int)
    return colors[idx]


def ramp_around(color: str, spread: float = 0.06) -> np.ndarray:
    base = hexrgb(color)
    return np.stack([shade(base, -spread), base, shade(base, spread)])


def shade(rgb: np.ndarray, amount: float) -> np.ndarray:
    """Lighten (amount > 0) or darken (amount < 0) colours."""
    out = rgb.astype(np.float32)
    if amount >= 0:
        out = out + (255 - out) * amount
    else:
        out = out * (1 + amount)
    return np.clip(out, 0, 255).astype(np.uint8)


# ---------------------------------------------------------------------------------------------
# Floors (128x128 seamless)


def carpet(rng: np.random.Generator, colors: list[str], motif: str | None = None) -> np.ndarray:
    pal = ramp(colors)
    base = 0.35 + 0.35 * fbm(M, rng, (4, 8, 16))
    speckle = rng.random((M, M), dtype=np.float32)
    values = base + (speckle - 0.5) * 0.45
    y, x = np.mgrid[0:M, 0:M]
    # Loop-pile weave: faint diagonal rows every 4px.
    values += np.where((x + y) % 4 == 0, -0.08, 0.0)
    if motif == "dots":
        # Small repeating diamond motif (conference-room carpet).
        dx = (x % 16) - 8
        dy = (y % 16) - 8
        values += np.where(np.abs(dx) + np.abs(dy) == 2, 0.28, 0.0)
    return quantize(np.clip(values, 0, 1), pal, dither=0.6)


def linoleum(rng: np.random.Generator, a: str, b: str, grout: str) -> np.ndarray:
    y, x = np.mgrid[0:M, 0:M]
    checker = ((x // 16) + (y // 16)) % 2 == 0
    pa, pb = ramp([shade(hexrgb(a), -0.06).tobytes().hex(), a, shade(hexrgb(a), 0.06).tobytes().hex()]), \
        ramp([shade(hexrgb(b), -0.06).tobytes().hex(), b, shade(hexrgb(b), 0.06).tobytes().hex()])
    noise = 0.5 + (fbm(M, rng, (8, 16)) - 0.5) * 0.9 + (rng.random((M, M), dtype=np.float32) - 0.5) * 0.25
    img = np.where(checker[..., None], quantize(noise, pa, 0.5), quantize(noise, pb, 0.5))
    # Bevel: light top-left inner edge, grout on the bottom-right edge of each 16px square.
    img[(y % 16 == 0) | (x % 16 == 0)] = shade(hexrgb(a), 0.25)
    img[(y % 16 == 15) | (x % 16 == 15)] = hexrgb(grout)
    return img


def wood(rng: np.random.Generator, colors: list[str], gap: str, plank_h: int = 8) -> np.ndarray:
    pal = ramp(colors)
    img = np.zeros((M, M, 3), dtype=np.uint8)
    rows = M // plank_h
    y, x = np.mgrid[0:plank_h, 0:M]
    for r in range(rows):
        # Plank boundaries along this row (periodic in x).
        cuts = [int(rng.integers(0, M))]
        while True:
            nxt = cuts[-1] + int(rng.integers(36, 76))
            if nxt >= cuts[0] + M - 24:
                break
            cuts.append(nxt)
        cuts = sorted(c % M for c in cuts)
        plank_id = np.searchsorted(cuts, np.arange(M), side="right") % len(cuts)
        tones = rng.random(len(cuts), dtype=np.float32) * 0.5 + 0.25
        phase = rng.random(len(cuts), dtype=np.float32) * 6.28
        tone = tones[plank_id][None, :]
        grain = np.sin(x * 0.18 + phase[plank_id][None, :] + y * 1.7) * 0.12
        streak = np.where((y == 2 + (r % 3)) & (np.sin(x * 0.07 + r) > 0.3), -0.18, 0.0)
        values = np.clip(tone + grain + streak + (rng.random((plank_h, M), dtype=np.float32) - 0.5) * 0.12, 0, 1)
        band = quantize(values, pal, dither=0.5)
        band[0] = shade(band[0], 0.12)             # lit top edge
        band[plank_h - 1] = hexrgb(gap)            # gap between rows
        for c in cuts:                             # plank ends
            band[:, c % M] = hexrgb(gap)
            band[:plank_h - 1, (c + 1) % M] = shade(band[:plank_h - 1, (c + 1) % M], 0.1)
        img[r * plank_h:(r + 1) * plank_h] = band
    return img


def brick(rng: np.random.Generator, colors: list[str], mortar: str, size: int = M, h: int = 8, w: int = 16) -> np.ndarray:
    pal = ramp(colors)
    img = np.zeros((size, size, 3), dtype=np.uint8)
    noise = (rng.random((size, size), dtype=np.float32) - 0.5) * 0.3
    for row in range(size // h):
        offset = (w // 2) * (row % 2)
        for col in range(-1, size // w + 1):
            x0 = col * w + offset
            tone = float(rng.random()) * 0.6 + 0.2
            ys = slice(row * h, (row + 1) * h)
            for xx in range(x0, x0 + w):
                xm = xx % size
                img[ys, xm] = quantize(np.clip(tone + noise[ys, xm][:, None], 0, 1), pal, 0.4)[:, 0]
            img[row * h, [xx % size for xx in range(x0, x0 + w)]] = shade(pal[-1], 0.08)
            img[ys, x0 % size] = hexrgb(mortar)
        img[(row + 1) * h - 1] = hexrgb(mortar)
    return img


# ---------------------------------------------------------------------------------------------
# Wall faces, doors and windows (4 variants of 32x32 in a 128x32 strip)


def face_strip(draw_variant) -> np.ndarray:
    strip = np.zeros((T, M, 4), dtype=np.uint8)
    for v in range(4):
        tile = draw_variant(v)
        if tile.shape[2] == 3:
            tile = np.dstack([tile, np.full((T, T), 255, np.uint8)])
        strip[:, v * T:(v + 1) * T] = tile
    return strip


def paint_wall(rng: np.random.Generator, spec: dict, v: int) -> np.ndarray:
    """Plain wall face: trim at the top, painted or papered wall, baseboard/wainscot below."""
    tile = np.zeros((T, T, 3), dtype=np.uint8)
    y, x = np.mgrid[0:T, 0:T]
    wall = ramp(spec["wall"])
    values = 0.5 + (fbm(T * 4, rng, (8, 16))[:T, v * T // 4: v * T // 4 + T] - 0.5) * 0.5
    values += (rng.random((T, T), dtype=np.float32) - 0.5) * 0.15
    if spec.get("stripes"):
        values += np.where(x % 6 < 3, 0.15, -0.1)
    tile[:] = quantize(np.clip(values, 0, 1), wall, 0.5)
    trim = hexrgb(spec["trim"])
    tile[0:2] = shade(trim, -0.35)
    tile[2:4] = trim
    base_h = spec.get("base_h", 6)
    base = ramp(spec["base"])
    tile[T - base_h:] = base[1]
    tile[T - base_h] = base[2]
    tile[T - 1] = base[0]
    if spec.get("wainscot"):
        top = T - base_h
        tile[top:T - 1, (x[0] % 16 == 1)] = base[0]
        tile[top:T - 1, (x[0] % 16 == 2)] = base[2]
    if v == 2 and spec.get("outlet"):
        tile[T - base_h - 6:T - base_h - 2, 20:24] = hexrgb("#f1efe8")
        tile[T - base_h - 5, 21] = tile[T - base_h - 3, 21] = hexrgb("#6b6b6b")
    if v == 3 and spec.get("frame"):
        # A small framed picture.
        tile[8:18, 9:23] = hexrgb(spec["frame"])
        tile[10:16, 11:21] = hexrgb(spec.get("picture", "#6d8fb3"))
        tile[18, 9:23] = shade(hexrgb(spec["frame"]), -0.4)
    return tile


def brick_wall(rng: np.random.Generator, spec: dict, v: int) -> np.ndarray:
    tile = brick(rng, spec["brick"], spec["mortar"], size=T)
    trim = hexrgb(spec["trim"])
    tile[0:2] = shade(trim, -0.35)
    tile[2:3] = trim
    tile[T - 3:] = shade(trim, -0.2)
    tile[T - 1] = shade(trim, -0.5)
    return tile


def glass_wall(spec: dict, v: int) -> np.ndarray:
    tile = np.zeros((T, T, 3), dtype=np.uint8)
    y, x = np.mgrid[0:T, 0:T]
    glass = ramp(spec["glass"])
    grad = 0.75 - y / T * 0.5
    tile[:] = quantize(np.clip(grad, 0, 1), glass, 0.8)
    if v in (0, 2):
        streak = ((x + y) % 32 >= 10) & ((x + y) % 32 <= 11) | ((x + y) % 32 == 14)
        tile[streak] = hexrgb(spec["shine"])
    if v in (1, 3):
        # Half-lowered blinds.
        slats = y < 13
        tile[slats] = hexrgb(spec["blind"])
        tile[slats & (y % 3 == 2)] = shade(hexrgb(spec["blind"]), -0.25)
    frame = hexrgb(spec["frame"])
    tile[0:3] = frame
    tile[0] = shade(frame, -0.4)
    tile[T - 3:] = frame
    tile[T - 1] = shade(frame, -0.45)
    tile[:, 0:2] = frame
    tile[:, 0] = shade(frame, 0.25)
    return tile


def window(rng: np.random.Generator, spec: dict, v: int) -> np.ndarray:
    tile = paint_wall(rng, spec["wallspec"], 0)
    y, x = np.mgrid[0:T, 0:T]
    frame = hexrgb(spec["frame"])
    x0, x1, y0, y1 = 3, 29, 5, 24
    inner = (x >= x0) & (x < x1) & (y >= y0) & (y < y1)
    sky = ramp(spec["sky"])
    tile[inner] = quantize(np.clip(1 - (y - y0) / (y1 - y0), 0, 1), sky, 0.9)[inner]
    blind_h = y0 + [11, 8, 13, 10][v]
    slats = inner & (y < blind_h)
    tile[slats] = hexrgb(spec["blind"])
    tile[slats & ((y - y0) % 3 == 2)] = shade(hexrgb(spec["blind"]), -0.2)
    tile[y0 - 1, x0 - 1:x1 + 1] = frame
    tile[y1, x0 - 1:x1 + 1] = frame
    for xx in (x0 - 1, x1, 16):
        tile[y0:y1, xx] = frame
    tile[y1 + 1, x0 - 2:x1 + 2] = shade(frame, 0.2)   # sill highlight
    tile[y1 + 2, x0 - 2:x1 + 2] = shade(frame, -0.4)
    return tile


def door(rng: np.random.Generator, spec: dict, v: int, glass: bool) -> np.ndarray:
    tile = paint_wall(rng, spec["wallspec"], 0)
    y, x = np.mgrid[0:T, 0:T]
    frame = hexrgb(spec["frame"])
    slab = (x >= 4) & (x < 28) & (y >= 4)
    if glass:
        g = ramp(spec["glass"])
        tile[slab] = quantize(np.clip(0.8 - y / T * 0.6, 0, 1), g, 0.8)[slab]
        tile[slab & ((x + y) % 24 == 9)] = hexrgb(spec["shine"])
        tile[(y == 18) & (x >= 8) & (x < 24)] = shade(frame, 0.3)   # push bar
        tile[slab & ((x == 16))] = frame
    else:
        leaf = ramp(spec["leaf"])
        tile[slab] = quantize(np.clip(0.5 + np.sin(y * 0.9 + x * 0.05) * 0.15, 0, 1), leaf, 0.6)[slab]
        for (py0, py1) in ((7, 15), (18, 29)):
            panel = (x >= 8) & (x < 24) & (y >= py0) & (y < py1)
            edge = panel & ((x == 8) | (y == py0))
            tile[edge] = shade(leaf[0], -0.2)
            tile[panel & ((x == 23) | (y == py1 - 1))] = shade(leaf[-1], 0.15)
        tile[(y >= 16) & (y <= 18) & (x >= 23) & (x <= 25)] = hexrgb("#e3b341")   # knob
    tile[3, 3:29] = frame
    tile[3:, 3] = frame
    tile[3:, 28] = shade(frame, -0.3)
    return tile


# ---------------------------------------------------------------------------------------------
# Themes

THEMES: dict[str, dict] = {
    "office": {
        "floor_carpet_grey": lambda r: carpet(r, ["#5f6670", "#6d747e", "#7b828c", "#8a919a", "#989fa7"]),
        "floor_carpet_blue": lambda r: carpet(r, ["#1c2a45", "#233354", "#2b3d63", "#344872", "#4a5f8c"], motif="dots"),
        "floor_tile_kitchen": lambda r: linoleum(r, "#e6e1d3", "#c4c9cf", "#8f959c"),
        "floor_wood": lambda r: wood(r, ["#7a4a26", "#8b5a30", "#9a673a", "#a87545"], "#4a2c16"),
        "wall": {"wall": ["#c9c1b1", "#d3cbbc", "#ddd6c8"], "trim": "#8f877a", "base": ["#3b2a1b", "#5c4028", "#7a5638"], "outlet": True, "frame": "#3f3a33", "picture": "#7a9cbf"},
        "glass": {"glass": ["#7fb2c6", "#96c6d6", "#b1d8e4", "#cbe8f0"], "shine": "#effafd", "frame": "#8d949c", "blind": "#dfe3e6"},
        "window": {"frame": "#e9e9e6", "sky": ["#5f95c9", "#7aaad6", "#98c1e3", "#b8d7ee"], "blind": "#eef0f1"},
        "brick": {"brick": ["#6e2a20", "#80321f", "#913b27", "#a0462f"], "mortar": "#9a8a78", "trim": "#5c4028"},
        "door": {"frame": "#6b6f75", "leaf": ["#5a3a22", "#6b452a", "#7a5032"], "glass": ["#7fb2c6", "#a6d2e0", "#c7e6ef"], "shine": "#effafd"},
        "caps": {
            "wall_office_top": {"fill": "#57524b", "light": "#7a746b", "dark": "#2b2824", "thickness": 12},
            "wall_office_side": {"fill": "#57524b", "light": "#7a746b", "dark": "#2b2824", "thickness": 12},
            "wall_brick": {"fill": "#5a261d", "light": "#7d3a2c", "dark": "#2d120d", "thickness": 14},
            "wall_glass": {"fill": "#aeb4bb", "light": "#d7dde2", "dark": "#5d646c", "thickness": 6, "core": "#bfe6f0"},
        },
    },
    "coffee": {
        "floor_wood": lambda r: wood(r, ["#8a5a33", "#9c6a3d", "#ad7a48", "#bb8853"], "#503019"),
        "floor_carpet_grey": lambda r: carpet(r, ["#6b5b4e", "#79685a", "#877567", "#958375"]),
        "floor_carpet_blue": lambda r: carpet(r, ["#3d2a4f", "#48335c", "#533c69", "#5f4677"], motif="dots"),
        "floor_tile_kitchen": lambda r: linoleum(r, "#efe6d2", "#b9534a", "#7a5a45"),
        "wall": {"wall": ["#c98a4b", "#d39856", "#dca562"], "trim": "#6a3f22", "base": ["#3a2112", "#5a3520", "#774a2c"], "frame": "#3a2112", "picture": "#c75b3a"},
        "glass": {"glass": ["#89b3a8", "#a1c7bb", "#bbd9ce", "#d3ebe2"], "shine": "#f2fbf7", "frame": "#5a3520", "blind": "#e8dcc5"},
        "window": {"frame": "#4b2d19", "sky": ["#5f95c9", "#7aaad6", "#98c1e3", "#b8d7ee"], "blind": "#efe3cb"},
        "brick": {"brick": ["#7a2e22", "#8c3526", "#9c3d2b", "#aa4a31"], "mortar": "#a08b75", "trim": "#4b2d19"},
        "door": {"frame": "#4b2d19", "leaf": ["#5a3520", "#6b4128", "#7a4c30"], "glass": ["#89b3a8", "#a9cdc1", "#c9e3da"], "shine": "#f2fbf7"},
        "caps": {
            "wall_office_top": {"fill": "#6a3f22", "light": "#8a5a36", "dark": "#2e1a0d", "thickness": 12},
            "wall_office_side": {"fill": "#6a3f22", "light": "#8a5a36", "dark": "#2e1a0d", "thickness": 12},
            "wall_brick": {"fill": "#5a261d", "light": "#7d3a2c", "dark": "#2d120d", "thickness": 14},
            "wall_glass": {"fill": "#6b4128", "light": "#8a5a36", "dark": "#2e1a0d", "thickness": 6, "core": "#bbd9ce"},
        },
    },
    "hostel": {
        "floor_wood": lambda r: wood(r, ["#9b7447", "#ab8252", "#b98f5e", "#c69c6a"], "#5e4326"),
        "floor_tile_kitchen": lambda r: linoleum(r, "#ecebe6", "#cfd3d6", "#9aa0a5"),
        "floor_carpet_grey": lambda r: carpet(r, ["#77736c", "#85817a", "#938f88", "#a19d96"]),
        "floor_carpet_blue": lambda r: carpet(r, ["#2f4058", "#374a64", "#405470", "#4a5f7c"], motif="dots"),
        "wall": {"wall": ["#ddd2bd", "#e6dcc8", "#eee6d4"], "trim": "#b5a98f", "base": ["#a79d8b", "#e8e4dc", "#fbfaf7"], "outlet": True, "frame": "#2d2d2d", "picture": "#3f7f5f"},
        "glass": {"glass": ["#86b8c9", "#9dc8d7", "#b6dbe6", "#d0eaf2"], "shine": "#f2fbfd", "frame": "#e8e4dc", "blind": "#f2efe9"},
        "window": {"frame": "#f4f1ea", "sky": ["#5f95c9", "#7aaad6", "#98c1e3", "#b8d7ee"], "blind": "#f6f4ef"},
        "brick": {"brick": ["#7a3a2a", "#8a4430", "#9a4f38", "#a85b42"], "mortar": "#b3a591", "trim": "#8a7f6b"},
        "door": {"frame": "#e8e4dc", "leaf": ["#b08b5e", "#c09a6a", "#cda877"], "glass": ["#86b8c9", "#a9d0de", "#cbe6ef"], "shine": "#f2fbfd"},
        "caps": {
            "wall_office_top": {"fill": "#8f8676", "light": "#b3a996", "dark": "#4a453c", "thickness": 12},
            "wall_office_side": {"fill": "#8f8676", "light": "#b3a996", "dark": "#4a453c", "thickness": 12},
            "wall_brick": {"fill": "#5a261d", "light": "#7d3a2c", "dark": "#2d120d", "thickness": 14},
            "wall_glass": {"fill": "#d9d4ca", "light": "#f4f1ea", "dark": "#8a8478", "thickness": 6, "core": "#b6dbe6"},
        },
    },
    "pub": {
        "floor_wood": lambda r: wood(r, ["#3f2716", "#4c2f1b", "#5a3821", "#684128"], "#1f130a"),
        "floor_tile_kitchen": lambda r: linoleum(r, "#2e2a26", "#8a2f2a", "#141210"),
        "floor_carpet_grey": lambda r: carpet(r, ["#3a2a2a", "#463232", "#523b3b", "#5e4545"]),
        "floor_carpet_blue": lambda r: carpet(r, ["#1f2a24", "#26332c", "#2e3d35", "#37483f"], motif="dots"),
        "wall": {"wall": ["#23392e", "#2b4437", "#33503f"], "stripes": True, "trim": "#6a4428", "base": ["#241509", "#3d2413", "#57361f"], "base_h": 13, "wainscot": True, "frame": "#b8903f", "picture": "#6b2a2a"},
        "glass": {"glass": ["#3c5a55", "#4d6d67", "#5f807a", "#73948d"], "shine": "#b9d3cd", "frame": "#3d2413", "blind": "#6a4428"},
        "window": {"frame": "#3d2413", "sky": ["#1b2340", "#25305a", "#303e70", "#3d4d85"], "blind": "#7a5230"},
        "brick": {"brick": ["#4d2019", "#5a261d", "#672d22", "#733428"], "mortar": "#5a4a3c", "trim": "#241509"},
        "door": {"frame": "#241509", "leaf": ["#3d2413", "#4c2f1b", "#5a3821"], "glass": ["#3c5a55", "#56766f", "#708f88"], "shine": "#b9d3cd"},
        "caps": {
            "wall_office_top": {"fill": "#2e1b0e", "light": "#4c2f1b", "dark": "#120a04", "thickness": 12},
            "wall_office_side": {"fill": "#2e1b0e", "light": "#4c2f1b", "dark": "#120a04", "thickness": 12},
            "wall_brick": {"fill": "#3d1813", "light": "#5a261d", "dark": "#1a0a07", "thickness": 14},
            "wall_glass": {"fill": "#3d2413", "light": "#57361f", "dark": "#120a04", "thickness": 6, "core": "#5f807a"},
        },
    },
}

FLOORS = ["floor_carpet_grey", "floor_carpet_blue", "floor_tile_kitchen", "floor_wood"]
FACES = ["wall_office_top", "wall_office_side", "wall_brick", "wall_glass", "window_blinds", "door_wood", "door_glass"]


def build_theme(name: str, spec: dict) -> tuple[np.ndarray, dict]:
    rng = np.random.default_rng(sum(map(ord, name)))  # deterministic per theme
    floors = [f for f in FLOORS if f in spec]
    sheet_h = M * ((len(floors) + 1) // 2) + T * len(FACES)
    sheet = np.zeros((sheet_h, M * 2, 4), dtype=np.uint8)
    index: dict[str, dict] = {}

    for i, f in enumerate(floors):
        x0, y0 = (i % 2) * M, (i // 2) * M
        tex = spec[f](rng)
        sheet[y0:y0 + M, x0:x0 + M, :3] = tex
        sheet[y0:y0 + M, x0:x0 + M, 3] = 255
        index[f] = {"x": x0, "y": y0, "cols": 4, "rows": 4}

    y = M * ((len(floors) + 1) // 2)
    wallspec = spec["wall"]
    makers = {
        "wall_office_top": lambda v: paint_wall(rng, wallspec, v),
        "wall_office_side": lambda v: paint_wall(rng, wallspec, v),
        "wall_brick": lambda v: brick_wall(rng, spec["brick"], v),
        "wall_glass": lambda v: glass_wall(spec["glass"], v),
        "window_blinds": lambda v: window(rng, {**spec["window"], "wallspec": wallspec}, v),
        "door_wood": lambda v: door(rng, {**spec["door"], "wallspec": wallspec}, v, glass=False),
        "door_glass": lambda v: door(rng, {**spec["door"], "wallspec": wallspec}, v, glass=True),
    }
    for f in FACES:
        sheet[y:y + T, 0:M] = face_strip(makers[f])
        index[f] = {"x": 0, "y": y, "cols": 4, "rows": 1}
        y += T
    return sheet, index


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--preview", help="write 4x upscaled previews here")
    args = parser.parse_args()
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    atlas: dict[str, dict] = {}
    for name, spec in THEMES.items():
        sheet, index = build_theme(name, spec)
        key = f"tiles_{name}"
        Image.fromarray(sheet, "RGBA").save(OUT_DIR / f"{key}.png", optimize=True)
        atlas[name] = {"imageKey": key, "tiles": index, "caps": spec["caps"]}
        print(f"wrote public/sprites/tiles/{key}.png {sheet.shape[1]}x{sheet.shape[0]}")
        if args.preview:
            Image.fromarray(sheet, "RGBA").resize((sheet.shape[1] * 3, sheet.shape[0] * 3), Image.NEAREST).save(Path(args.preview) / f"preview_{key}.png")
    write_ts(atlas)


def write_ts(atlas: dict) -> None:
    lines = [
        "// AUTO-GENERATED by scripts/sprites/generate_tiles.py. Do not edit by hand.",
        "import { TileThemeAtlas } from '../../../types/sprite';",
        "",
        "export const TILE_THEME_ATLAS: Record<string, TileThemeAtlas> = " + json.dumps(atlas, indent=2) + ";",
        "",
        "export const TILE_THEME_IMAGES: Record<string, string> = {",
        *[f"  {v['imageKey']}: '/sprites/tiles/{v['imageKey']}.png'," for v in atlas.values()],
        "};",
        "",
    ]
    TS_OUT.write_text("\n".join(lines), encoding="utf-8")
    print(f"wrote {TS_OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
