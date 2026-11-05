"""MacLaren's Pub (How I Met Your Mother): a basement bar off the street. Mahogany wainscot under
old brick, a long bar with brass rail and taps, a mirrored back bar full of bottles, the gang's
red-leather booth, darts, a jukebox and framed photos everywhere."""
from __future__ import annotations

import numpy as np

from isofaces import WALL_H, Face, T, planks
from isoraster import Model, _hash, box, combine, cyl, ell, grain, panels, seams, speckle, tufts
from iso_models import framed_art, m, round_table, sign, wood_chair, wood_stool

TOP = 34.0  # bar top, 1.07 m


def pint(u, v, z0, full=True) -> list:
    out = [cyl((u, v, z0), (u + 3.5, v + 3.5, z0 + 6.5), "amber" if full else "glass", shade=0.4)]
    if full:
        out.append(cyl((u, v, z0 + 6.5), (u + 3.5, v + 3.5, z0 + 7.5), "cream", shade=1.0))
    return out


def bar_counter() -> Model:
    W, D = m(6.0), 26.0
    b = Model("bar_counter", W, D)
    b.add(box((1, 3, 0), (W - 1, D - 4, 4), "black", shade=0.4))
    b.add(box((0, 2, 4), (W, D - 3, TOP - 2), "mahogany", detail=combine(panels(24, 4, TOP - 3, 3), grain("u", 4, 0.5))))
    b.add(box((0, 0, TOP - 2), (W, D, TOP), "mahogany", shade=0.6, detail=grain("u", 5, 0.5)))
    b.add(cyl((0, D - 4, TOP - 3), (W, D, TOP + 0.5), "mahogany", axis="x", shade=0.8))
    b.add(cyl((1, D - 2.5, 4), (W - 1, D - 0.5, 6), "brass", axis="x", shade=1.0))
    for u in range(12, int(W) - 8, 36):
        b.add(box((u, D - 3.5, 0), (u + 1.5, D - 1.5, 6), "brass"))
    # Beer taps on a brass tower, handles of all colours.
    b.add(box((70, 4, TOP), (102, 9, TOP + 10), "brass", shade=0.5))
    for i, u in enumerate(range(72, 100, 4)):
        mat = ("red", "black", "art_yellow", "leaf_dark", "cream", "navy", "red")[i % 7]
        b.add(cyl((u, 8, TOP + 6), (u + 2, 10, TOP + 8), "brass", axis="y"))
        b.add(box((u, 5.5, TOP + 10), (u + 2, 7.5, TOP + 17), mat, shade=0.4))
    b.add(box((70, 9, TOP), (102, 14, TOP + 0.6), "black", detail=seams(2, "u", strength=1)))
    for u, v in ((20, 14), (28, 16), (130, 12), (152, 15), (174, 13)):
        b.prims.extend(pint(u, v, TOP))
    b.add(cyl((40, 10, TOP), (47, 17, TOP + 3), "wood_dark", shade=0.5))
    b.add(ell((40.5, 10.5, TOP + 2), (46.5, 16.5, TOP + 4.5), "pastry", detail=speckle(0.9, 3)))
    b.add(box((110, 10, TOP), (116, 15, TOP + 5), "chrome"))
    return b


def back_bar() -> Model:
    W, D = m(6.0), 16.0
    b = Model("back_bar", W, D)
    b.add(box((0, 0, 0), (W, D, 30), "mahogany", detail=panels(24, 3, 29, 3)))
    b.add(box((0, 0, 30), (W, D, 32), "marble", shade=0.6, detail=speckle(0.6, 4)))
    for u in (0, W - 6):
        b.add(box((u, 0, 32), (u + 6, D, 86), "mahogany", shade=0.2, detail=seams(14, "z", strength=-1)))
    b.add(box((6, 0, 32), (W - 6, 2, 82), "glass", shade=1.2,
              detail=lambda u, v, z, nu, nv, nz: np.where(np.mod(u - z * 0.5, 40) < 3, 1.5, 0.0)))
    colours = ["amber", "bottle_green", "glass", "red", "amber", "brass", "bottle_green", "cream", "amber", "glass"]
    rng = np.random.default_rng(21)
    for s, z in enumerate((32, 47, 62)):
        if s:
            b.add(box((6, 0, z - 1), (W - 6, 10, z), "glass", shade=1.0))
        u = 8.0
        while u < W - 10:
            if s == 0 and W - 48 < u < W - 26:
                u += 1
                continue
            r = float(rng.choice([1.4, 1.6, 1.9]))
            h = float(rng.choice([8, 9, 10, 11]))
            mat = colours[int(rng.integers(0, len(colours)))]
            b.add(cyl((u, 3, z), (u + 2 * r, 3 + 2 * r, z + h), mat, shade=0.3))
            b.add(cyl((u + r - 0.6, 3 + r - 0.6, z + h), (u + r + 0.6, 3 + r + 0.6, z + h + 3), mat, shade=0.6))
            u += 2 * r + 0.8
    # Antique brass till
    b.add(box((W - 46, 3, 32), (W - 28, 13, 40), "brass", shade=0.4, detail=seams(3, "u", strength=1)))
    b.add(box((W - 44, 3, 40), (W - 30, 8, 46), "brass", shade=0.8))
    b.add(box((0, 0, 82), (W, D, 86), "mahogany", shade=0.7, detail=seams(1000, "z", offset=1.5, strength=-1)))
    return b


def booth_bench() -> Model:
    W, D = m(1.5), 20.0
    b = Model("booth_bench", W, D)
    b.add(box((0, 1, 0), (W, D, 12), "mahogany", detail=panels(16, 1, 11, 2)))
    b.add(box((2, 6, 12), (W - 2, D - 0.5, 16.5), "red_leather", detail=combine(speckle(0.25, 2), seams(14.6, "u", offset=1, strength=0.9))))
    b.add(box((2, 0, 12), (W - 2, 6, 38), "red_leather", shade=-0.2, detail=tufts(7, 6, 1.4)))
    b.add(box((0, 0, 38), (W, 7, 41), "mahogany", shade=0.6))
    for u in (0, W - 2):
        b.add(box((u, 0, 0), (u + 2, D, 30), "mahogany", shade=0.3))
    return b


def booth_table() -> Model:
    W, D = m(1.4), m(0.8)
    t = Model("booth_table", W, D)
    t.add(box((W / 2 - 6, D / 2 - 5, 0), (W / 2 + 6, D / 2 + 5, 2), "black"))
    t.add(box((W / 2 - 2, D / 2 - 2, 2), (W / 2 + 2, D / 2 + 2, 22), "black", shade=0.4))
    t.add(box((0, 0, 22), (W, D, 24.5), "mahogany", shade=0.4, detail=grain("u", 4, 0.6)))
    t.add(cyl((19, 9, 24.5), (25, 15, 33), "amber", shade=0.2))
    t.add(box((25, 11, 27), (27, 13, 32), "glass"))
    for u, v in ((6, 4), (34, 4), (8, 17), (36, 17)):
        t.prims.extend(pint(u, v, 24.5))
    t.add(box((12, 15, 24.5), (17, 20, 27), "chrome"))
    t.add(box((28, 16, 24.5), (34, 21, 26), "red", shade=-0.5))
    t.add(ell((28.5, 16.5, 25.5), (33.5, 20.5, 28.5), "pizza", detail=speckle(1.0, 6)))
    return t


def jukebox() -> Model:
    W, D = m(0.9), 22.0
    j = Model("jukebox", W, D)
    j.add(box((0, 2, 0), (W, D, 30), "wood_dark", shade=0.3))
    j.add(cyl((0, 2, 16), (W, D, 45), "wood_dark", axis="y", shade=0.3))
    j.add(cyl((2, 3, 18), (W - 2, D + 0.4, 43), "neon_orange", axis="y", glow=True, shade=0.6))
    j.add(cyl((4.5, 3, 20.5), (W - 4.5, D + 0.8, 40.5), "black", axis="y", shade=0.8))
    j.add(box((7, D + 0.6, 24), (W - 7, D + 1.0, 33), "glass", glow=True, shade=-1.0, detail=seams(2, "z", strength=1.4)))
    j.add(box((5, D - 0.5, 3), (W - 5, D + 0.8, 17), "chrome", detail=seams(1.8, "u", strength=-1.2)))
    for u in (2, W - 4):
        j.add(box((u, D - 0.6, 3), (u + 2, D + 0.6, 28), "neon_pink", glow=True))
    return j


def dartboard() -> Model:
    d = Model("dartboard", 20.0, 3.0)
    d.add(box((0, 0, 47), (20, 2, 69), "wood_dark", shade=0.4))

    def sectors(r: float):
        """Alternate the 20 scoring sectors around a ring whose centre is (r, r) in its local coords."""
        def f(u, v, z, nu, nv, nz):
            ang = np.arctan2(z - r, u - r)
            sector = np.floor((ang + np.pi) / (2 * np.pi / 20)).astype(int)
            return np.where((sector % 2 == 0) & (nv > 0.5), -4.0, 0.0)
        return f

    d.add(cyl((2, 0, 50), (18, 2.6, 66), "black", axis="y", shade=0.4))
    d.add(cyl((3.4, 0, 51.4), (16.6, 2.9, 64.6), "red", axis="y", shade=0.6))
    d.add(cyl((3.8, 0, 51.8), (16.2, 3.0, 64.2), "cream", axis="y", detail=sectors(6.2)))
    d.add(cyl((5.6, 0, 53.6), (14.4, 3.1, 62.4), "leaf", axis="y", shade=0.6))
    d.add(cyl((6.0, 0, 54.0), (14.0, 3.2, 62.0), "cream", axis="y", detail=sectors(4.0)))
    d.add(cyl((8.8, 0, 56.8), (11.2, 3.4, 59.2), "red", axis="y", shade=0.8))
    return d


def framed_photos(name: str, seed: int) -> Model:
    rng = np.random.default_rng(seed)
    W = 44.0
    p = Model(name, W, 2.0)
    u = 0.0
    while u < W - 8:
        w = float(rng.choice([8, 10, 12]))
        h = float(rng.choice([10, 12, 14]))
        z0 = float(rng.choice([46, 50, 56]))
        frame = str(rng.choice(["wood_dark", "black", "brass"]))
        inner = str(rng.choice(["sepia", "white", "sepia", "green_paint"]))
        p.add(box((u, 0, z0), (u + w, 1.6, z0 + h), frame, shade=0.3))
        p.add(box((u + 1.2, 0, z0 + 1.2), (u + w - 1.2, 2.0, z0 + h - 1.2), inner, shade=-0.4,
                  detail=lambda uu, v, z, nu, nv, nz, s=seed: np.where(_hash(uu / 2, z / 2, s) > 0.6, -1.0, 0.0)))
        u += w + float(rng.choice([2, 3]))
    return p


def wall_sconce() -> Model:
    s = Model("wall_sconce", 8.0, 6.0)
    s.add(box((3, 0, 52), (5, 3, 58), "brass", shade=0.4))
    s.add(cyl((1, 1.5, 56), (7, 6, 62), "lamp_shade", glow=True, shade=0.2))
    return s


def ducky_tie() -> Model:
    t = Model("ducky_tie_frame", 16.0, 2.5)
    t.add(box((0, 0, 44), (16, 2, 66), "black", shade=0.4))
    t.add(box((1.2, 0, 45.2), (14.8, 2.2, 64.8), "white", shade=0.6))
    t.add(box((6, 0, 48), (10, 2.6, 62), "leaf", shade=0.4,
              detail=lambda u, v, z, nu, nv, nz: np.where((np.mod(z, 4) < 1.5) & (np.mod(u + z, 3) < 1.5), 2.5, 0.0)))
    t.add(box((5.5, 0, 60), (10.5, 2.8, 63), "leaf", shade=0.6))
    return t


def street_stairs() -> Model:
    """Steps up to the street door; the top step meets the wall at v = 0."""
    W, D = m(1.2), m(1.2)
    s = Model("street_stairs", W, D)
    steps = 4
    run = D / steps
    for i in range(steps):
        top = (steps - i) * 6.0
        s.add(box((0, i * run, 0), (W, (i + 1) * run, top - 1), "mahogany", shade=-0.3))
        s.add(box((0, i * run, top - 1), (W, (i + 1) * run, top), "wood_dark", shade=0.8))
    for i in range(steps):
        top = (steps - i) * 6.0
        s.add(box((W - 2, i * run + run / 2 - 1, top), (W - 0.5, i * run + run / 2 + 1, top + 26), "brass"))
        s.add(box((W - 2.2, i * run, top + 24), (W - 0.3, (i + 1) * run, top + 26), "brass", shade=0.6))
    return s


def umbrella_stand() -> Model:
    u = Model("umbrella_stand", 9.0, 9.0)
    u.add(cyl((0.5, 0.5, 0), (8.5, 8.5, 16), "brass", shade=0.2, detail=seams(4, "z", strength=-0.8)))
    u.add(cyl((2.5, 2.5, 4), (5, 5, 34), "art_yellow", shade=0.6))
    u.add(cyl((3.2, 3.2, 34), (4.4, 4.4, 37), "wood_dark"))
    u.add(cyl((5, 4.5, 6), (7, 6.5, 30), "black", shade=0.6))
    return u


def coat_rack() -> Model:
    c = Model("coat_rack_pub", 10.0, 10.0)
    c.add(cyl((1, 1, 0), (9, 9, 1.5), "mahogany"))
    c.add(cyl((4.2, 4.2, 1.5), (5.8, 5.8, 56), "mahogany", shade=0.4))
    c.add(ell((1, 2, 30), (8, 9, 53), "green_paint", shade=0.2))
    c.add(ell((3, 0.5, 36), (9.5, 6, 52), "sepia", shade=0.4))
    return c


CATALOGUE: dict[str, tuple] = {
    "bar_counter": (bar_counter, "floor"),
    "back_bar": (back_bar, "floor"),
    "bar_stool_pub": (lambda: wood_stool("bar_stool_pub", seat="red_leather", wood="mahogany", height=25), "stool"),
    "booth_bench": (booth_bench, "floor"),
    "booth_table": (booth_table, "floor"),
    "pub_chair": (lambda: wood_chair("pub_chair", seat="mahogany", frame="mahogany", cushion="red_leather"), "seat"),
    "high_top": (lambda: round_table("high_top", top="mahogany", base="black", diameter=24.0, height=34.0,
                                     items=(*pint(6, 8, 34.5), *pint(13, 12, 34.5, full=False))), "floor"),
    "jukebox": (jukebox, "floor"),
    "street_stairs": (street_stairs, "floor"),
    "umbrella_stand": (umbrella_stand, "floor"),
    "coat_rack_pub": (coat_rack, "floor"),
    "dartboard": (dartboard, "wall"),
    "framed_photos_a": (lambda: framed_photos("framed_photos_a", 3), "wall"),
    "framed_photos_b": (lambda: framed_photos("framed_photos_b", 8), "wall"),
    "painting_pub": (lambda: framed_art("painting_pub", ("green_paint", "art_yellow", "red"), frame="brass", z0=44, w=34, h=24), "wall"),
    "wall_sconce": (wall_sconce, "wall"),
    "ducky_tie_frame": (ducky_tie, "wall"),
    "neon_beer": (lambda: sign("neon_beer", ["BEER"], "neon_orange", 5.0, 22, 11, 62, glow=True, board_shade=-4.0), "wall"),
    "neon_open": (lambda: sign("neon_open", ["OPEN"], "neon_pink", 5.0, 22, 11, 62, glow=True, board_shade=-4.0), "wall"),
}


# ---------------------------------------------------------------------------------------------
# Walls


def pub_wall(variant: int) -> Face:
    f = Face("brick")
    rng = np.random.default_rng(300 + variant)
    for row, z in enumerate(range(40, WALL_H - 6, 6)):
        shift = 8 if row % 2 else 0
        f.rect(0, z, T, z + 1, "mortar", -1.2)
        for u in range(-shift, T, 16):
            tone = float(rng.choice([-1.4, -1.0, -0.6, -0.6, -0.2, 0.2]))
            u0, u1 = max(0, u), min(T, u + 15)
            if u1 > u0:
                f.rect(u0, z + 1, u1, z + 6, "brick", tone)
                f.rect(u0, z + 5, u1, z + 6, "brick", tone + 0.6)
            if 0 <= u + 15 < T:
                f.rect(u + 15, z + 1, u + 16, z + 6, "mortar", -1.2)
    f.noise(40, WALL_H - 6, 0.5, seed=variant)
    f.rect(0, 0, T, 5, "black", 0.5)
    f.rect(0, 5, T, 38, "mahogany", 0.2)
    f.rect(3, 8, 29, 35, "mahogany", -0.6)
    f.rect(3, 34, 29, 35, "mahogany", -1.4)
    f.rect(3, 8, 4, 35, "mahogany", 0.8)
    f.rect(3, 8, 29, 9, "mahogany", 0.8)
    f.rect(0, 38, T, 41, "mahogany", 0.9)
    f.rect(0, 40, T, 41, "brass", 0.4)
    f.rect(0, WALL_H - 6, T, WALL_H, "mahogany", 0.5)
    f.rect(0, WALL_H - 6, T, WALL_H - 5, "mahogany", -1.0)
    return f


def street_door() -> Face:
    """The door at the top of the steps, its sill at the top-step height."""
    f = pub_wall(1)
    f.rect(3, 24, 29, 90, "mahogany", 1.0)
    f.rect(5, 24, 27, 88, "mahogany", 0.0)
    f.rect(8, 60, 24, 84, "glass", 0.4)
    f.rect(9, 64, 11, 80, "glass", 1.8)
    f.rect(8, 30, 24, 54, "mahogany", -0.8)
    f.rect(22, 54, 25, 58, "brass", 0.8)
    return f


def restroom_door() -> Face:
    f = pub_wall(2)
    f.rect(4, 0, 28, 74, "mahogany", 1.0)
    f.rect(6, 0, 26, 72, "green_paint", 0.0)
    f.rect(9, 40, 23, 48, "brass", 0.4)
    f.rect(21, 32, 24, 35, "brass", 0.8)
    return f


def street_window(variant: int) -> Face:
    """A high basement window at pavement level: railings and passing feet."""
    f = pub_wall(variant)
    f.rect(2, 60, 30, 90, "wood_dark", 0.4)
    f.rect(4, 62, 28, 88, "glass", -0.8)
    f.rect(4, 62, 28, 70, "stone", -0.6)
    for u in (8, 19) if variant == 0 else (12,):
        f.rect(u, 70, u + 2, 82, "black", 0.2)
        f.rect(u - 1, 70, u + 2, 72, "black", 0.8)
    for u in range(5, 28, 4):
        f.rect(u, 62, u + 1, 88, "black", 0.6)
    f.rect(4, 74, 28, 75, "black", 0.6)
    return f


def wall_faces() -> dict[str, list[Face]]:
    return {
        "wall_brick": [pub_wall(v) for v in range(4)],
        "door_street": [street_door()],
        "door_wood": [restroom_door()],
        "window_blinds": [street_window(0), street_window(1)],
    }


FLOORS = {"floor_wood": lambda: planks("wood_dark", seed=8, plank_h=8, base=2.7, worn=0.7)}
DECALS: dict = {}
CAPS = {"fill": "#24120c", "light": "#4a2a1c", "dark": "#100806"}
