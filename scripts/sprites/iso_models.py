"""Furniture models shared between set themes. Canonical frame: footprint W x D world px
(32 px = 1 m) with the front facing +v; a seat's occupant sits at the back and faces +v, so a
prop's facing is the direction its user faces."""
from __future__ import annotations

import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).parent))
from isoraster import Model, _hash, box, combine, cyl, ell, grain, panels, seams, speckle, text_detail, tufts  # noqa: E402

T = 32


def m(metres: float) -> float:
    return metres * T


def sofa(name: str, fabric: str, dark: str, seats: int, width: float, legs: str = "wood_dark", button: bool = True,
         depth: float = 30.0, pillows: tuple[str, ...] = ()) -> Model:
    W, D = width, depth
    s = Model(name, W, D)
    for u in (2, W - 5):
        for v in (2, D - 5):
            s.add(box((u, v, 0), (u + 3, v + 3, 3), legs))
    s.add(box((0, 1, 3), (W, D, 13), fabric, shade=-0.5, detail=seams(20, "z", offset=11.5, strength=1.0)))
    arm = 8
    inner0, inner1 = arm - 1, W - arm + 1
    cw = (inner1 - inner0) / seats
    for i in range(seats):
        s.add(box((inner0 + i * cw + 0.5, 9, 13), (inner0 + (i + 1) * cw - 0.5, D - 0.5, 17.5), fabric,
                  detail=combine(speckle(0.2, seed=i), seams(1000, "u", offset=0.2))))
    s.add(box((5, 0, 13), (W - 5, 9, 28), fabric, shade=-0.2, detail=tufts(9, 6) if button else speckle(0.2, 3)))
    s.add(cyl((5, 0, 24), (W - 5, 9, 33), fabric, axis="x", shade=0.1))
    for u0 in (0, W - arm):
        s.add(box((u0, 2, 13), (u0 + arm, D, 21), fabric, shade=-0.1))
        s.add(cyl((u0, 2, 17), (u0 + arm, D, 25), fabric, axis="y"))
        s.add(box((u0 + 1, D - 0.6, 6), (u0 + arm - 1, D + 0.4, 18), dark))
    for i, mat in enumerate(pillows):
        u = 9 + i * (W - 30)
        s.add(ell((u, 6, 15), (u + 11, 13, 27), mat, shade=0.2))
    return s


def armchair(name: str, fabric: str, dark: str, legs: str = "wood_dark") -> Model:
    W, D = 30.0, 28.0
    a = Model(name, W, D)
    for u in (2, W - 5):
        for v in (2, D - 5):
            a.add(box((u, v, 0), (u + 3, v + 3, 3), legs))
    a.add(box((0, 1, 3), (W, D, 12), fabric, shade=-0.5))
    a.add(box((5, 8, 12), (W - 5, D - 0.5, 16.5), fabric, detail=speckle(0.2, seed=4)))
    a.add(box((3, 0, 12), (W - 3, 8, 30), fabric, shade=-0.2, detail=tufts(8, 6)))
    a.add(cyl((3, 0, 26), (W - 3, 8, 34), fabric, axis="x", shade=0.1))
    for u0 in (0, W - 6):
        a.add(box((u0, 2, 12), (u0 + 6, D, 19), fabric, shade=-0.1))
        a.add(cyl((u0, 2, 16), (u0 + 6, D, 22), fabric, axis="y"))
        a.add(box((u0 + 1, D - 0.6, 5), (u0 + 5, D + 0.4, 17), dark))
    return a


def round_table(name: str, top: str = "wood_dark", base: str = "black", diameter: float = 22.0, height: float = 24.0,
                items: tuple = ()) -> Model:
    t = Model(name, diameter, diameter)
    c = diameter / 2
    t.add(cyl((c - 7, c - 7, 0), (c + 7, c + 7, 2), base, shade=0.5))
    t.add(cyl((c - 1.5, c - 1.5, 2), (c + 1.5, c + 1.5, height - 2), base, shade=0.8))
    t.add(cyl((0, 0, height - 2), (diameter, diameter, height + 0.5), top, detail=grain("u", 3.5, 0.8)))
    for p in items:
        t.add(p)
    return t


def wood_chair(name: str, seat: str = "wood_mid", frame: str = "wood_dark", cushion: str | None = None) -> Model:
    W = D = 14.0
    c = Model(name, W, D)
    for u in (0.5, W - 2):
        for v in (0.5, D - 2):
            c.add(box((u, v, 0), (u + 1.5, v + 1.5, 13), frame))
    c.add(box((0, 0, 13), (W, D, 15), seat, detail=grain("u", 3)))
    if cushion:
        c.add(box((1, 2, 15), (W - 1, D - 1, 16.5), cushion, detail=speckle(0.3, 2)))
    for u in (0.5, W - 2):
        c.add(box((u, 0.5, 15), (u + 1.5, 2, 29), frame))
    c.add(box((0.5, 0.5, 23), (W - 0.5, 2, 29), seat, shade=0.2))
    c.add(box((5, 0.8, 15), (6.5, 1.8, 23), frame))
    c.add(box((8, 0.8, 15), (9.5, 1.8, 23), frame))
    return c


def bar_stool(name: str, seat: str = "orange_dark", pole: str = "chrome", height: float = 26.0) -> Model:
    s = Model(name, 12.0, 12.0)
    s.add(cyl((2, 2, 0), (10, 10, 2), pole))
    s.add(cyl((5, 5, 2), (7, 7, height - 3), pole, shade=0.5))
    s.add(cyl((2.5, 2.5, height * 0.38), (9.5, 9.5, height * 0.38 + 1), pole))
    s.add(cyl((0, 0, height - 3), (12, 12, height), seat, shade=0.5))
    return s


def wood_stool(name: str, seat: str = "red_leather", wood: str = "mahogany", height: float = 25.0) -> Model:
    s = Model(name, 13.0, 13.0)
    for u in (1.5, 10):
        for v in (1.5, 10):
            s.add(box((u, v, 0), (u + 1.5, v + 1.5, height - 3), wood))
    s.add(box((2, 2, 8), (11, 11, 9), wood, shade=0.4))
    s.add(cyl((0, 0, height - 3), (13, 13, height - 1), wood, shade=0.3))
    s.add(cyl((0.5, 0.5, height - 1), (12.5, 12.5, height + 1.5), seat, shade=0.4, detail=speckle(0.3, 5)))
    return s


def floor_lamp(name: str = "floor_lamp", shade_mat: str = "lamp_shade") -> Model:
    lm = Model(name, 12.0, 12.0)
    lm.add(cyl((2, 2, 0), (10, 10, 2), "black", shade=0.8))
    lm.add(cyl((5.2, 5.2, 2), (6.8, 6.8, 44), "black", shade=1.2))
    lm.add(cyl((0, 0, 42), (12, 12, 54), shade_mat, glow=True, shade=0.3))
    return lm


def potted_plant(name: str, pot: str = "terracotta", size: float = 1.0) -> Model:
    k = size
    p = Model(name, 16.0 * k, 16.0 * k)
    p.add(cyl((2 * k, 2 * k, 0), (14 * k, 14 * k, 12 * k), pot, detail=seams(1000, "z", offset=9.5 * k, strength=-1)))
    p.add(ell((0, 1 * k, 9 * k), (16 * k, 15 * k, 28 * k), "leaf_dark", detail=speckle(1.0, seed=7)))
    p.add(ell((3 * k, 0, 20 * k), (13 * k, 10 * k, 40 * k), "leaf", detail=speckle(1.0, seed=8)))
    p.add(ell((5 * k, 6 * k, 26 * k), (16 * k, 16 * k, 44 * k), "leaf", shade=0.3, detail=speckle(1.0, seed=9)))
    p.add(ell((1 * k, 7 * k, 30 * k), (9 * k, 15 * k, 46 * k), "leaf_dark", shade=0.6, detail=speckle(1.0, seed=10)))
    return p


def ficus(name: str = "ficus", pot: str = "black") -> Model:
    """Office ficus: a slim trunk with a loose crown, about 1.7 m."""
    p = Model(name, 18.0, 18.0)
    p.add(cyl((3, 3, 0), (15, 15, 11), pot, shade=0.4, detail=seams(1000, "z", offset=9.0, strength=-1)))
    p.add(cyl((8, 8, 10), (10, 10, 34), "wood_mid", shade=0.3))
    for i, (u, v, z, r, mat) in enumerate([(9, 9, 30, 9, "leaf_dark"), (5, 8, 38, 6, "leaf"), (12, 6, 42, 6, "leaf"),
                                             (9, 12, 46, 6, "leaf_dark"), (9, 8, 52, 5, "leaf")]):
        p.add(ell((u - r, v - r, z - r * 0.9), (u + r, v + r, z + r * 0.9), mat, shade=0.2 * i, detail=speckle(1.0, seed=20 + i)))
    return p


def office_chair(name: str, fabric: str = "black", base: str = "black", back_h: float = 34.0, arms: bool = True) -> Model:
    """Swivel chair: five-star base, gas lift, seat, backrest. The sitter faces +v."""
    W = D = 19.0
    c = Model(name, W, D)
    c.add(box((2, 8.5, 1), (17, 10.5, 2.5), base, shade=0.6))
    c.add(box((8.5, 2, 1), (10.5, 17, 2.5), base, shade=0.6))
    for u, v in ((2, 9), (16, 9), (9, 2), (9, 16)):
        c.add(cyl((u - 1, v - 1, 0), (u + 2, v + 2, 1.5), base))
    c.add(cyl((8.3, 8.3, 2.5), (10.7, 10.7, 12), "chrome"))
    c.add(box((2.5, 3, 12), (16.5, 18, 15.5), fabric, shade=0.2, detail=speckle(0.25, 1)))
    c.add(box((8.5, 1.5, 15.5), (10.5, 3, 20), base))
    c.add(box((3, 0.5, 18), (16, 3.5, back_h), fabric, shade=-0.1, detail=seams(5, "z", offset=2, strength=0.6)))
    c.add(cyl((3, 0.5, back_h - 3), (16, 3.5, back_h + 1), fabric, axis="x", shade=0.2))
    if arms:
        for u0 in (1.5, 15.5):
            c.add(box((u0 + 0.5, 6, 15.5), (u0 + 1.5, 8, 21), base))
            c.add(box((u0, 5, 21), (u0 + 2, 13, 22.5), base, shade=0.6))
    return c


def framed_art(name: str, colours: tuple[str, str, str], frame: str = "wood_light", z0: float = 42.0, w: float = 26.0,
               h: float = 32.0) -> Model:
    a = Model(name, w, 2.0)
    a.add(box((0, 0, z0), (w, 2, z0 + h), frame, shade=0.3))
    a.add(box((2.5, 0, z0 + 2.5), (w - 2.5, 2.4, z0 + h - 2.5), colours[0]))
    a.add(ell((w * 0.2, 0, z0 + h * 0.25), (w * 0.65, 3.2, z0 + h * 0.7), colours[1], shade=0.5))
    a.add(box((w * 0.45, 0, z0 + h * 0.15), (w * 0.8, 2.8, z0 + h * 0.5), colours[2], shade=0.3))
    return a


def sign(name: str, lines: list[str], board: str, ink_lift: float, w: float, h: float, z0: float, frame: str | None = None,
         glow: bool = False, depth: float = 2.0, board_shade: float = 0.0) -> Model:
    """A wall sign with centred lines of 3x5 pixel text."""
    s = Model(name, w, depth)
    if frame:
        s.add(box((0, 0, z0), (w, depth, z0 + h), frame, shade=0.3))
    inset = 1.5 if frame else 0
    details = []
    line_h = 7
    top = z0 + h / 2 + len(lines) * line_h / 2 - 1
    for i, line in enumerate(lines):
        width = len(line) * 4 - 1
        details.append(text_detail(line, (w - 2 * inset - width) / 2, top - i * line_h - (z0 + inset), lift=ink_lift))
    s.add(box((inset, 0, z0 + inset), (w - inset, depth + 0.4, z0 + h - inset), board, glow=glow, shade=board_shade,
              detail=combine(*details)))
    return s


def scribbles(seed: int, density: float = 0.12, lift: float = -2.5):
    """Marker writing on a whiteboard: short horizontal strokes in rows."""
    def f(u, v, z, nu, nv, nz):
        row = np.floor(z / 4)
        word = _hash(np.floor(u / 6) + seed, row, seed) < density * 4
        line = np.mod(z, 4) < 1
        return np.where(word & line & (nv > 0.5), lift, 0.0)
    return f
