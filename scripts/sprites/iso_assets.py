"""Build the isometric set atlases: props (all four facings), wall face textures and floor decals.

    python scripts/sprites/iso_assets.py [--preview DIR]

Props are modelled from real-world dimensions (1 tile = 1 m = 32 world px, heights in the same
units) and rendered by isoraster.py, so proportions and the 2:1 angle are exact by construction.
Wall faces are front-view textures, WALL_H px tall and 32 px per tile, that the runtime baker
(src/engine/iso/IsoMapBaker.ts) shears onto the back walls. Decals are top-down textures the baker
lays into the floor before projecting it.

Writes public/sprites/iso/iso_<theme>.png and src/data/sprites/generated/isoAtlas.ts.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).parent))
from isoraster import (  # noqa: E402
    BAYER4, FACINGS, N_STEPS, RAMP_RGB, Model, _hash, box, combine, cyl, ell, footprint, grain, panels, render,
    seams, speckle, tufts,
)

ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = ROOT / "public" / "sprites" / "iso"
TS_OUT = ROOT / "src" / "data" / "sprites" / "generated" / "isoAtlas.ts"

T = 32           # world px per tile (= 1 m)
WALL_H = 96      # 3 m back walls
WALL_T = 6       # wall thickness, world px


def m(metres: float) -> float:
    return metres * T


# ---------------------------------------------------------------------------------------------
# Prop models (canonical frame: footprint W x D, front facing +v)


def sofa(name: str, fabric: str, dark: str, seats: int, width: float) -> Model:
    W, D = width, 30.0
    s = Model(name, W, D)
    for u in (2, W - 5):
        for v in (2, D - 5):
            s.add(box((u, v, 0), (u + 3, v + 3, 3), "wood_dark"))
    s.add(box((0, 1, 3), (W, D, 13), fabric, shade=-0.5, detail=seams(20, "z", offset=11.5, strength=1.0)))
    arm = 8
    inner0, inner1 = arm - 1, W - arm + 1
    cw = (inner1 - inner0) / seats
    for i in range(seats):
        s.add(box((inner0 + i * cw + 0.5, 9, 13), (inner0 + (i + 1) * cw - 0.5, D - 0.5, 17.5), fabric,
                  detail=combine(speckle(0.2, seed=i), seams(1000, "u", offset=0.2))))
    s.add(box((5, 0, 13), (W - 5, 9, 28), fabric, shade=-0.2, detail=tufts(9, 6)))
    s.add(cyl((5, 0, 24), (W - 5, 9, 33), fabric, axis="x", shade=0.1))
    for u0 in (0, W - arm):
        s.add(box((u0, 2, 13), (u0 + arm, D, 21), fabric, shade=-0.1))
        s.add(cyl((u0, 2, 17), (u0 + arm, D, 25), fabric, axis="y", detail=seams(1000, "v", offset=D - 2.4, strength=-1)))
        s.add(box((u0 + 1, D - 0.6, 6), (u0 + arm - 1, D + 0.4, 18), dark))
    return s


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
    # Register
    c.add(box((14, 6, 34), (30, 18, 39), "black", shade=0.5))
    c.add(box((17, 8, 39), (28, 12, 46), "black", shade=1.0, detail=seams(2, "z", strength=-1)))
    # Pastry case: chrome tray, pastries, glass lid on posts
    c.add(box((40, 3, 34), (78, 24, 36), "chrome"))
    for i, u in enumerate(range(43, 75, 7)):
        c.add(ell((u, 7 + (i % 2) * 6, 35.5), (u + 6, 13 + (i % 2) * 6, 40), "pastry"))
    for u in (40, 76.5):
        for v in (3, 22.5):
            c.add(box((u, v, 36), (u + 1.5, v + 1.5, 47), "chrome", shade=1))
    c.add(box((40, 3, 47), (78, 24, 48), "glass", shade=0.8))
    # Cup stacks and a tip jar
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
    # Espresso machine: chrome body, black drip tray, group heads, cups on top
    c.add(box((18, 1, 31), (58, 15, 50), "chrome", detail=seams(12, "u", offset=6, strength=0.6)))
    c.add(box((19, 9, 31), (57, 16, 34), "black"))
    for u in (24, 36, 48):
        c.add(cyl((u, 12, 38), (u + 5, 17, 41), "black", axis="z"))
    for u in (22, 30, 38, 46):
        c.add(cyl((u, 4, 50), (u + 5, 9, 54), "white"))
    # Grinders
    for u in (64, 76):
        c.add(cyl((u, 3, 31), (u + 8, 11, 42), "chrome"))
        c.add(cyl((u + 1, 4, 42), (u + 7, 10, 52), "black", shade=1.2))
    # Milk jugs, a syrup row and bean sacks
    c.add(cyl((92, 6, 31), (98, 12, 38), "chrome"))
    for i, u in enumerate(range(104, 126, 4)):
        c.add(cyl((u, 4, 31), (u + 3, 7, 41), ("red", "art_yellow", "purple", "teal", "red", "art_yellow")[i]))
    c.add(ell((130, 2, 31), (146, 14, 42), "cream", detail=speckle(0.6, seed=2)))
    return c


def armchair(name: str, fabric: str, dark: str) -> Model:
    W, D = 30.0, 28.0
    a = Model(name, W, D)
    for u in (2, W - 5):
        for v in (2, D - 5):
            a.add(box((u, v, 0), (u + 3, v + 3, 3), "wood_dark"))
    a.add(box((0, 1, 3), (W, D, 12), fabric, shade=-0.5))
    a.add(box((5, 8, 12), (W - 5, D - 0.5, 16.5), fabric, detail=speckle(0.2, seed=4)))
    a.add(box((3, 0, 12), (W - 3, 8, 30), fabric, shade=-0.2, detail=tufts(8, 6)))
    a.add(cyl((3, 0, 26), (W - 3, 8, 34), fabric, axis="x", shade=0.1))
    for u0 in (0, W - 6):
        a.add(box((u0, 2, 12), (u0 + 6, D, 19), fabric, shade=-0.1))
        a.add(cyl((u0, 2, 16), (u0 + 6, D, 22), fabric, axis="y"))
        a.add(box((u0 + 1, D - 0.6, 5), (u0 + 5, D + 0.4, 17), dark))
    return a


def cafe_table() -> Model:
    t = Model("cafe_table_round", 22.0, 22.0)
    t.add(cyl((4, 4, 0), (18, 18, 2), "black", shade=0.5))
    t.add(cyl((9.5, 9.5, 2), (12.5, 12.5, 22), "black", shade=0.8))
    t.add(cyl((0, 0, 22), (22, 22, 24.5), "wood_dark", detail=grain("u", 3.5, 0.8)))
    t.add(cyl((8, 7, 24.5), (13, 12, 29), "white"))
    return t


def cafe_chair() -> Model:
    W = D = 14.0
    c = Model("cafe_chair", W, D)
    for u in (0.5, W - 2):
        for v in (0.5, D - 2):
            c.add(box((u, v, 0), (u + 1.5, v + 1.5, 13), "wood_dark"))
    c.add(box((0, 0, 13), (W, D, 15), "wood_mid", detail=grain("u", 3)))
    for u in (0.5, W - 2):
        c.add(box((u, 0.5, 15), (u + 1.5, 2, 29), "wood_dark"))
    c.add(box((0.5, 0.5, 23), (W - 0.5, 2, 29), "wood_mid", shade=0.2))
    c.add(box((5, 0.8, 15), (6.5, 1.8, 23), "wood_dark"))
    c.add(box((8, 0.8, 15), (9.5, 1.8, 23), "wood_dark"))
    return c


def bar_stool() -> Model:
    s = Model("bar_stool", 12.0, 12.0)
    s.add(cyl((2, 2, 0), (10, 10, 2), "chrome"))
    s.add(cyl((5, 5, 2), (7, 7, 23), "chrome", shade=0.5))
    s.add(cyl((2.5, 2.5, 9), (9.5, 9.5, 10), "chrome"))
    s.add(cyl((0, 0, 23), (12, 12, 26), "orange_dark", shade=0.5))
    return s


def floor_lamp() -> Model:
    l = Model("floor_lamp", 12.0, 12.0)
    l.add(cyl((2, 2, 0), (10, 10, 2), "black", shade=0.8))
    l.add(cyl((5.2, 5.2, 2), (6.8, 6.8, 44), "black", shade=1.2))
    l.add(cyl((0, 0, 42), (12, 12, 54), "lamp_shade", shade=1.0))
    return l


def plant_tall() -> Model:
    p = Model("plant_tall", 16.0, 16.0)
    p.add(cyl((2, 2, 0), (14, 14, 12), "terracotta", detail=seams(1000, "z", offset=9.5, strength=-1)))
    p.add(ell((0, 1, 9), (16, 15, 28), "leaf_dark", detail=speckle(1.0, seed=7)))
    p.add(ell((3, 0, 20), (13, 10, 40), "leaf", detail=speckle(1.0, seed=8)))
    p.add(ell((5, 6, 26), (16, 16, 44), "leaf", shade=0.3, detail=speckle(1.0, seed=9)))
    p.add(ell((1, 7, 30), (9, 15, 46), "leaf_dark", shade=0.6, detail=speckle(1.0, seed=10)))
    return p


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


def framed_art(name: str, colours: tuple[str, str, str]) -> Model:
    W, D = 26.0, 2.0
    a = Model(name, W, D)
    a.add(box((0, 0, 42), (W, D, 74), "wood_light", shade=0.3))
    a.add(box((2.5, 0, 44.5), (W - 2.5, D + 0.4, 71.5), colours[0]))
    a.add(ell((5, 0, 50), (17, D + 1.2, 64), colours[1], shade=0.5))
    a.add(box((12, 0, 47), (21, D + 0.8, 58), colours[2], shade=0.3))
    return a


# kind: 'floor' props stand on the floor and block walking; 'wall' props hang on a back wall and
# are baked with it; 'seat' props are sat in and never block.
CATALOGUE: dict[str, dict] = {
    "coffee": {
        "sofa_orange": (lambda: sofa("sofa_orange", "orange_velvet", "orange_dark", 3, m(2.3125)), "floor"),
        "armchair_green": (lambda: armchair("armchair_green", "green_velvet", "leaf_dark"), "floor"),
        "armchair_gold": (lambda: armchair("armchair_gold", "gold_velvet", "wood_dark"), "floor"),
        "coffee_table_low": (coffee_table, "floor"),
        "cafe_counter": (front_counter, "floor"),
        "back_counter": (back_counter, "floor"),
        "cafe_table_round": (cafe_table, "floor"),
        "cafe_chair": (cafe_chair, "seat"),
        "bar_stool": (bar_stool, "seat"),
        "floor_lamp": (floor_lamp, "floor"),
        "plant_tall": (plant_tall, "floor"),
        "upright_piano": (upright_piano, "floor"),
        "menu_board": (menu_board, "wall"),
        "wall_shelf": (wall_shelf, "wall"),
        "framed_art_warm": (lambda: framed_art("framed_art_warm", ("art_yellow", "red", "teal")), "wall"),
        "framed_art_cool": (lambda: framed_art("framed_art_cool", ("art_blue", "art_yellow", "purple")), "wall"),
    },
}


# ---------------------------------------------------------------------------------------------
# Wall faces: front-view textures, 32 px per tile, WALL_H tall, row 0 = top of the wall.
# Authored as (ramp, step offset from the face's lit base step) so the north (+y, lit) and west
# (+x, shaded) faces come from one drawing.


class Face:
    def __init__(self, w: int = T, h: int = WALL_H):
        self.mat = np.full((h, w), "brick", dtype=object)
        self.off = np.zeros((h, w), dtype=np.float32)
        self.h = h
        self.w = w

    def rect(self, u0, z0, u1, z1, mat, off=0.0):
        """Fill columns u0..u1, heights z0..z1 (z from the floor up)."""
        r0, r1 = self.h - int(z1), self.h - int(z0)
        self.mat[r0:r1, int(u0):int(u1)] = mat
        self.off[r0:r1, int(u0):int(u1)] = off

    def render(self, base: int) -> np.ndarray:
        idx = np.clip(np.round(self.off + base), 0, N_STEPS - 1).astype(int)
        out = np.zeros((self.h, self.w, 4), dtype=np.uint8)
        for mat in set(self.mat.ravel()):
            sel = self.mat == mat
            out[sel, :3] = RAMP_RGB[mat][idx[sel]]
        out[..., 3] = 255
        return out


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
    f = Face()
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
    # Frame, glass with sky and street, mullions
    f.rect(2, 20, 30, 86, "frame_green", 0)
    f.rect(1, 19, 31, 21, "wood_dark", 1)
    jj = np.arange(WALL_H)
    for z in range(22, 82):
        r = WALL_H - z - 1
        sky = 1.6 if z > 60 else (1.0 if z > 44 else 0.3)
        f.mat[r, 4:28] = "glass"
        f.off[r, 4:28] = sky - 2 + BAYER4[r % 4, np.arange(4, 28) % 4] * 0.9
    # A building across the street, lower half of the glass
    f.rect(4, 22, 28, 40, "brick", -1.6)
    for u in range(6, 26, 6):
        f.rect(u, 30, u + 3, 36, "art_yellow", -0.5)
    # Arch top
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
    # Reflection streak
    for k in range(0, 18):
        z = 26 + k * 3
        u = 6 + k
        if 4 <= u < 27 and z < 80:
            f.rect(u, z, u + 2, z + 3, "glass", 2.2)
    del jj
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


FACE_BASE = {"n": 3, "w": 2}  # lit step of the north (+y) and west (+x) faces


def wall_faces() -> dict[str, list[Face]]:
    return {
        "wall_brick": [brick_face(v) for v in range(4)],
        "window_blinds": [window_face(0), window_face(1)],
        "door_wood": [door_face()],
    }


# ---------------------------------------------------------------------------------------------
# Decals (top-down, in world pixels)


def rug_persian(w: int = 128, h: int = 96) -> np.ndarray:
    yy, xx = np.mgrid[0:h, 0:w]
    edge = np.minimum(np.minimum(xx, w - 1 - xx), np.minimum(yy, h - 1 - yy))
    mat = np.full((h, w), "red", dtype=object)
    off = np.zeros((h, w), dtype=np.float32)
    off[:] = 0
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
    core = (d < 0.25)
    mat[core] = "red"
    off[core] = 0.5
    field = (edge >= 12) & ~med
    dots = field & (np.mod(xx, 8) == 4) & (np.mod(yy, 8) == 4)
    mat[dots] = "art_yellow"
    off[dots] = -1
    # Wear: dither some pixels a step down
    bayer = np.tile(BAYER4, (h // 4 + 1, w // 4 + 1))[:h, :w]
    off += np.where(_hash(xx / 3, yy / 3, 4) > 0.75, -0.5 + bayer, 0)
    idx = np.clip(np.round(off + 3), 0, N_STEPS - 1).astype(int)
    out = np.zeros((h, w, 4), dtype=np.uint8)
    for mt in set(mat.ravel()):
        sel = mat == mt
        out[sel, :3] = RAMP_RGB[mt][idx[sel]]
    out[..., 3] = 255
    return out


DECALS = {"coffee": {"rug_persian": rug_persian}}

CAPS = {"coffee": {"fill": "#2a1a12", "light": "#4a3022", "dark": "#140c08"}}


# ---------------------------------------------------------------------------------------------
# Packing and output


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
    images: list[tuple[str, np.ndarray]] = []
    frames: dict[str, dict] = {}
    catalog: dict[str, dict] = {}
    for prop_id, (make, kind) in CATALOGUE[theme].items():
        model = make()
        height = max(p.hi[2] for p in model.prims)
        catalog[prop_id] = {
            "width": model.width / T,
            "depth": model.depth / T,
            "height": height,
            "kind": kind,
        }
        for facing in FACINGS:
            spr = render(model, facing)
            key = f"{prop_id}:{facing}"
            images.append((key, spr.rgba))
            frames[key] = {"ox": spr.ox, "oy": spr.oy}

    faces = wall_faces()
    face_keys: dict[str, int] = {}
    for tile, variants in faces.items():
        face_keys[tile] = len(variants)
        strip_n = np.concatenate([f.render(FACE_BASE["n"]) for f in variants], axis=1)
        strip_w = np.concatenate([f.render(FACE_BASE["w"]) for f in variants], axis=1)
        images.append((f"wall:{tile}:n", strip_n))
        images.append((f"wall:{tile}:w", strip_w))

    decals = {k: fn() for k, fn in DECALS[theme].items()}
    for k, img in decals.items():
        images.append((f"decal:{k}", img))

    sheet, pos = pack(images)
    sizes = {k: v.shape[:2] for k, v in images}
    for key in frames:
        x, y = pos[key]
        h, w = sizes[key]
        frames[key].update({"x": x, "y": y, "w": w, "h": h})
    walls = {}
    for tile, count in face_keys.items():
        walls[tile] = {
            "variants": count,
            "n": {"x": pos[f"wall:{tile}:n"][0], "y": pos[f"wall:{tile}:n"][1]},
            "w": {"x": pos[f"wall:{tile}:w"][0], "y": pos[f"wall:{tile}:w"][1]},
        }
    decal_rects = {}
    for k in decals:
        x, y = pos[f"decal:{k}"]
        h, w = sizes[f"decal:{k}"]
        decal_rects[k] = {"x": x, "y": y, "w": w, "h": h}

    atlas = {
        "imageKey": f"iso_{theme}",
        "wallHeight": WALL_H,
        "wallThickness": WALL_T,
        "caps": CAPS[theme],
        "frames": frames,
        "walls": walls,
        "decals": decal_rects,
    }
    return sheet, atlas, catalog


def contact_sheet(sheet: np.ndarray, atlas: dict, out: Path) -> None:
    """Every prop in its four facings on a floor-coloured backdrop, 3x."""
    props = sorted({k.split(":")[0] for k in atlas["frames"]})
    cells = []
    for prop in props:
        row = []
        for facing in FACINGS:
            f = atlas["frames"][f"{prop}:{facing}"]
            row.append(sheet[f["y"]:f["y"] + f["h"], f["x"]:f["x"] + f["w"]])
        cells.append(row)
    cw = max(c.shape[1] for r in cells for c in r) + 8
    ch = max(c.shape[0] for r in cells for c in r) + 8
    cols = 8
    rows = (len(cells) * 4 + cols - 1) // cols
    img = Image.new("RGBA", (cw * cols, ch * rows), (126, 92, 58, 255))
    flat = [c for r in cells for c in r]
    for i, c in enumerate(flat):
        x = (i % cols) * cw + (cw - c.shape[1]) // 2
        y = (i // cols) * ch + (ch - c.shape[0]) // 2
        img.alpha_composite(Image.fromarray(c, "RGBA"), (x, y))
    img.resize((img.width * 3, img.height * 3), Image.NEAREST).save(out)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--preview")
    args = parser.parse_args()
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    atlases: dict[str, dict] = {}
    catalog: dict[str, dict] = {}
    for theme in CATALOGUE:
        sheet, atlas, cat = build_theme(theme)
        Image.fromarray(sheet, "RGBA").save(OUT_DIR / f"{atlas['imageKey']}.png")
        print(f"wrote public/sprites/iso/{atlas['imageKey']}.png {sheet.shape[1]}x{sheet.shape[0]}")
        atlases[theme] = atlas
        catalog.update(cat)
        if args.preview:
            prev = Path(args.preview)
            prev.mkdir(parents=True, exist_ok=True)
            contact_sheet(sheet, atlas, prev / f"iso_{theme}_props.png")
            Image.fromarray(sheet, "RGBA").resize((sheet.shape[1] * 2, sheet.shape[0] * 2), Image.NEAREST).save(
                prev / f"iso_{theme}_sheet.png")
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
        "export const ISO_THEME_IMAGES: Record<string, string> = {",
        *[f"  {v['imageKey']}: '/sprites/iso/{v['imageKey']}.png'," for v in atlases.values()],
        "};",
        "",
    ]
    TS_OUT.write_text("\n".join(lines), encoding="utf-8")
    print(f"wrote {TS_OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
