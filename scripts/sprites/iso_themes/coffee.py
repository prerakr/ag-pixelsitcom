"""Central Perk (Friends): brick and wainscot walls, arched street windows, the orange couch."""
from __future__ import annotations

import numpy as np

from isofaces import FACE_BASE, WALL_H, Face, T  # noqa: F401
from isoraster import BAYER4, N_STEPS, RAMP_RGB, Model, _hash, box, combine, cyl, ell, grain, panels, seams, speckle
from iso_models import armchair, bar_stool, floor_lamp, framed_art, m, potted_plant, round_table, sofa, wood_chair


def coffee_table() -> Model:
    W, D = 42.0, 22.0
    t = Model("coffee_table_low", W, D)
    for u in (2, W - 5):
        for v in (2, D - 5):
            t.add(box((u, v, 0), (u + 3, v + 3, 11), "wood_dark"))
    t.add(box((3, 3, 3), (W - 3, D - 3, 4.5), "wood_dark", shade=-0.5))
    t.add(box((1.5, 1.5, 8), (W - 1.5, D - 1.5, 11), "wood_dark", shade=-0.3))
    t.add(box((0, 0, 11), (W, D, 14), "wood_mid", detail=grain("u", 3.0)))
    t.add(cyl((7, 6, 14), (13, 12, 20), "white"))
    t.add(cyl((26, 10, 14), (32, 16, 20), "red"))
    t.add(box((15, 4, 14), (24, 12, 14.8), "art_blue", detail=seams(3, "v", strength=-1.5)))
    t.add(cyl((34, 3, 14), (38, 7, 21), "glass"))
    return t


def front_counter() -> Model:
    W, D = m(4.5), 29.0
    c = Model("cafe_counter", W, D)
    c.add(box((1, 3, 0), (W - 1, D - 3, 4), "wood_dark", shade=-0.4))
    c.add(box((0, 2, 4), (W, D - 1.5, 30), "wood_mid", detail=combine(panels(24, 4, 30, 2.5), grain("u", 4, 0.6))))
    c.add(box((0, 0, 30), (W, D, 34), "marble", detail=speckle(0.7, seed=5)))
    c.add(box((14, 6, 34), (30, 18, 39), "black", shade=0.5))
    c.add(box((17, 8, 39), (28, 12, 46), "black", shade=1.0, detail=seams(2, "z", strength=-1)))
    c.add(box((40, 3, 34), (78, 24, 36), "chrome"))
    for i, u in enumerate(range(43, 75, 7)):
        c.add(ell((u, 7 + (i % 2) * 6, 35.5), (u + 6, 13 + (i % 2) * 6, 40), "pastry"))
    for u in (40, 76.5):
        for v in (3, 22.5):
            c.add(box((u, v, 36), (u + 1.5, v + 1.5, 47), "chrome", shade=1))
    c.add(box((40, 3, 47), (78, 24, 48), "glass", shade=0.8))
    for u in (90, 98):
        c.add(cyl((u, 8, 34), (u + 6, 14, 47), "white", detail=seams(2.5, "z", strength=-1)))
    c.add(cyl((112, 10, 34), (118, 16, 42), "glass"))
    c.add(box((126, 6, 34), (134, 14, 41), "chrome"))
    return c


def back_counter() -> Model:
    W, D = m(5.0), 19.0
    c = Model("back_counter", W, D)
    c.add(box((1, 1, 0), (W - 1, D - 2, 4), "wood_dark", shade=-0.4))
    c.add(box((0, 0, 4), (W, D - 1, 28), "wood_dark", detail=panels(20, 4, 28, 2.5)))
    c.add(box((0, 0, 28), (W, D, 31), "marble", detail=speckle(0.7, seed=9)))
    c.add(box((18, 1, 31), (58, 15, 50), "chrome", detail=seams(12, "u", offset=6, strength=0.6)))
    c.add(box((19, 9, 31), (57, 16, 34), "black"))
    for u in (24, 36, 48):
        c.add(cyl((u, 12, 38), (u + 5, 17, 41), "black", axis="z"))
    for u in (22, 30, 38, 46):
        c.add(cyl((u, 4, 50), (u + 5, 9, 54), "white"))
    for u in (64, 76):
        c.add(cyl((u, 3, 31), (u + 8, 11, 42), "chrome"))
        c.add(cyl((u + 1, 4, 42), (u + 7, 10, 52), "black", shade=1.2))
    c.add(cyl((92, 6, 31), (98, 12, 38), "chrome"))
    for i, u in enumerate(range(104, 126, 4)):
        c.add(cyl((u, 4, 31), (u + 3, 7, 41), ("red", "art_yellow", "purple", "teal", "red", "art_yellow")[i]))
    c.add(ell((130, 2, 31), (146, 14, 42), "cream", detail=speckle(0.6, seed=2)))
    return c


def upright_piano() -> Model:
    W, D = 48.0, 19.0
    p = Model("upright_piano", W, D)
    p.add(box((0, 0, 0), (W, 13, 40), "black", shade=1.0, detail=panels(24, 3, 20, 3)))
    p.add(box((0, 0, 40), (W, 14, 42), "black", shade=1.5))
    p.add(box((1, 13, 22), (W - 1, 19, 25), "black", shade=0.8))
    p.add(box((3, 13, 25), (W - 3, 18, 26.2), "white", detail=seams(2, "u", strength=1.2)))
    for u in (2, W - 5):
        p.add(box((u, 13, 0), (u + 3, 18, 22), "black", shade=0.6))
    p.add(box((16, 12.5, 30), (32, 13.5, 38), "cream", detail=seams(2, "z", strength=-1)))
    return p


def menu_board() -> Model:
    W, D = m(2.0), 3.0
    b = Model("menu_board", W, D)

    def chalk_text(u, v, z, nu, nv, nz):
        row = np.floor((z - 4) / 4)
        line = (np.mod(z - 4, 4) < 1) & (z > 4) & (z < 22)
        word = _hash(np.floor(u / 5), row, 11) > 0.25
        margin = (u > 4) & (u < W - 16)
        price = (u > W - 12) & (u < W - 5) & line
        head = (z > 21) & (z < 24) & (u > W / 2 - 14) & (u < W / 2 + 14) & (np.mod(u, 3) < 2)
        return np.where((line & word & margin) | price | head, 3.0, 0.0) * (np.abs(nv) > 0.5)

    b.add(box((0, 0, 56), (W, D, 86), "wood_dark", shade=0.3))
    b.add(box((2, 0, 58), (W - 2, D + 0.5, 84), "chalk", shade=-1.2, detail=chalk_text))
    return b


def wall_shelf() -> Model:
    W, D = m(2.0), 8.0
    s = Model("wall_shelf", W, D)
    for z in (50, 66):
        s.add(box((0, 0, z), (W, D, z + 2), "wood_dark", detail=grain("u", 3)))
        for i, u in enumerate(range(3, int(W) - 6, 7)):
            mat = ("glass", "white", "terracotta", "teal", "white", "glass", "art_yellow", "white", "red")[i % 9]
            s.add(cyl((u, 1.5, z + 2), (u + 5, 6.5, z + 8 + (i % 3) * 2), mat))
    return s


CATALOGUE: dict[str, tuple] = {
    "sofa_orange": (lambda: sofa("sofa_orange", "orange_velvet", "orange_dark", 3, m(2.3125)), "floor"),
    "armchair_green": (lambda: armchair("armchair_green", "green_velvet", "leaf_dark"), "floor"),
    "armchair_gold": (lambda: armchair("armchair_gold", "gold_velvet", "wood_dark"), "floor"),
    "coffee_table_low": (coffee_table, "floor"),
    "cafe_counter": (front_counter, "floor"),
    "back_counter": (back_counter, "floor"),
    "cafe_table_round": (lambda: round_table("cafe_table_round", items=(cyl((8, 7, 24.5), (13, 12, 29), "white"),)), "floor"),
    "cafe_chair": (lambda: wood_chair("cafe_chair"), "seat"),
    "bar_stool": (lambda: bar_stool("bar_stool"), "stool"),
    "floor_lamp": (floor_lamp, "floor"),
    "plant_tall": (lambda: potted_plant("plant_tall"), "floor"),
    "upright_piano": (upright_piano, "floor"),
    "menu_board": (menu_board, "wall"),
    "wall_shelf": (wall_shelf, "wall"),
    "framed_art_warm": (lambda: framed_art("framed_art_warm", ("art_yellow", "red", "teal")), "wall"),
    "framed_art_cool": (lambda: framed_art("framed_art_cool", ("art_blue", "art_yellow", "purple")), "wall"),
}


def wainscot(f: Face, top: int = 30):
    f.rect(0, 0, T, 6, "wood_dark", -0.5)
    f.rect(0, 5, T, 6, "wood_dark", 1)
    f.rect(0, 6, T, top, "wood_mid", 0)
    f.rect(3, 9, 29, top - 3, "wood_mid", -0.7)
    f.rect(3, top - 4, 29, top - 3, "wood_mid", -1.6)
    f.rect(28, 9, 29, top - 3, "wood_mid", -1.4)
    f.rect(3, 9, 4, top - 3, "wood_mid", 0.8)
    f.rect(3, 9, 29, 10, "wood_mid", 0.8)
    f.rect(0, top, T, top + 4, "wood_dark", 0)
    f.rect(0, top + 3, T, top + 4, "wood_dark", 1.2)


def brick_face(variant: int) -> Face:
    f = Face("brick")
    rng = np.random.default_rng(100 + variant)
    for row, z in enumerate(range(34, WALL_H - 6, 6)):
        shift = 8 if row % 2 else 0
        f.rect(0, z, T, z + 1, "mortar", -0.5)
        for u in range(-shift, T, 16):
            tone = rng.choice([-1.0, -0.4, 0.0, 0.0, 0.4, 0.8])
            u0, u1 = max(0, u), min(T, u + 15)
            if u1 > u0:
                f.rect(u0, z + 1, u1, z + 6, "brick", tone)
                f.rect(u0, z + 5, u1, z + 6, "brick", tone + 0.8)
            if 0 <= u + 15 < T:
                f.rect(u + 15, z + 1, u + 16, z + 6, "mortar", -0.5)
    f.rect(0, WALL_H - 7, T, WALL_H, "wood_dark", 0)
    f.rect(0, WALL_H - 7, T, WALL_H - 6, "wood_dark", -1.5)
    f.rect(0, WALL_H - 3, T, WALL_H - 2, "wood_dark", 1.2)
    wainscot(f)
    return f


def window_face(variant: int) -> Face:
    f = brick_face(variant)
    f.rect(0, 6, T, 20, "wood_mid", 0)
    f.rect(3, 9, 29, 18, "wood_mid", -0.7)
    f.rect(0, 0, T, 6, "wood_dark", -0.5)
    f.rect(2, 20, 30, 86, "frame_green", 0)
    f.rect(1, 19, 31, 21, "wood_dark", 1)
    for z in range(22, 82):
        r = WALL_H - z - 1
        sky = 1.6 if z > 60 else (1.0 if z > 44 else 0.3)
        f.mat[r, 4:28] = "glass"
        f.off[r, 4:28] = sky - 2 + BAYER4[r % 4, np.arange(4, 28) % 4] * 0.9
    f.rect(4, 22, 28, 40, "brick", -1.6)
    for u in range(6, 26, 6):
        f.rect(u, 30, u + 3, 36, "art_yellow", -0.5)
    for z in range(76, 86):
        r = WALL_H - z - 1
        dz = z - 76
        half = int(round(np.sqrt(max(0, 13**2 - dz**2))))
        f.mat[r, 4:28] = "frame_green"
        f.off[r, 4:28] = 0
        if dz < 9:
            f.mat[r, 16 - half + 2:16 + half - 2] = "glass"
            f.off[r, 16 - half + 2:16 + half - 2] = 0.9
    f.rect(15, 22, 17, 84, "frame_green", 0.6)
    f.rect(4, 50, 28, 52, "frame_green", 0.6)
    for k in range(0, 18):
        z = 26 + k * 3
        u = 6 + k
        if 4 <= u < 27 and z < 80:
            f.rect(u, z, u + 2, z + 3, "glass", 2.2)
    return f


def door_face() -> Face:
    f = brick_face(2)
    f.rect(3, 0, 29, 74, "wood_dark", 1)
    f.rect(5, 0, 27, 71, "wood_mid", 0)
    f.rect(8, 40, 24, 66, "glass", -0.5)
    f.rect(8, 58, 24, 66, "glass", 0.6)
    f.rect(9, 44, 11, 54, "glass", 2)
    f.rect(15, 40, 17, 66, "wood_mid", 0.4)
    f.rect(8, 8, 24, 34, "wood_mid", -0.8)
    f.rect(8, 33, 24, 34, "wood_mid", -1.6)
    f.rect(22, 34, 25, 37, "art_yellow", 0.8)
    f.rect(3, 74, 29, 78, "wood_dark", 0.5)
    return f


def wall_faces() -> dict[str, list[Face]]:
    return {
        "wall_brick": [brick_face(v) for v in range(4)],
        "window_blinds": [window_face(0), window_face(1)],
        "door_wood": [door_face()],
    }


def rug_persian(w: int = 128, h: int = 96) -> np.ndarray:
    yy, xx = np.mgrid[0:h, 0:w]
    edge = np.minimum(np.minimum(xx, w - 1 - xx), np.minimum(yy, h - 1 - yy))
    mat = np.full((h, w), "red", dtype=object)
    off = np.zeros((h, w), dtype=np.float32)
    band = (edge >= 4) & (edge < 12)
    mat[band] = "art_blue"
    off[band] = -0.5
    zig = band & (np.mod(xx + yy, 6) < 2)
    mat[zig] = "cream"
    off[zig] = -1
    mat[edge < 4] = "cream"
    off[edge < 4] = -0.6
    fringe = ((xx < 2) | (xx > w - 3)) & (np.mod(yy, 2) == 0)
    off[fringe] = 1
    cx, cy = w / 2, h / 2
    d = np.abs(xx - cx) / (w * 0.30) + np.abs(yy - cy) / (h * 0.30)
    med = (d < 1) & (edge >= 12)
    mat[med] = "art_yellow"
    off[med] = -1.2
    inner = (d < 0.62) & (edge >= 12)
    mat[inner] = "art_blue"
    off[inner] = -0.8
    core = d < 0.25
    mat[core] = "red"
    off[core] = 0.5
    field = (edge >= 12) & ~med
    dots = field & (np.mod(xx, 8) == 4) & (np.mod(yy, 8) == 4)
    mat[dots] = "art_yellow"
    off[dots] = -1
    bayer = np.tile(BAYER4, (h // 4 + 1, w // 4 + 1))[:h, :w]
    off += np.where(_hash(xx / 3, yy / 3, 4) > 0.75, -0.5 + bayer, 0)
    idx = np.clip(np.round(off + 3), 0, N_STEPS - 1).astype(int)
    out = np.zeros((h, w, 4), dtype=np.uint8)
    for mt in set(mat.ravel()):
        sel = mat == mt
        out[sel, :3] = RAMP_RGB[mt][idx[sel]]
    out[..., 3] = 255
    return out


DECALS = {"rug_persian": rug_persian}
FLOORS: dict = {}  # Central Perk uses the top-down 'coffee' tileset floors
CAPS = {"fill": "#2a1a12", "light": "#4a3022", "dark": "#140c08"}
