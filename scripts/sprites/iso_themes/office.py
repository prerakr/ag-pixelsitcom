"""Dunder Mifflin Scranton (The Office): greige drywall, blue-grey commercial carpet, glass
partitions with blinds, paired bullpen desks and every desk dressed for its owner."""
from __future__ import annotations

import numpy as np

from isofaces import WALL_H, Face, T, blinds, carpet, checker_tiles, glass_pane
from isoraster import Model, _hash, box, combine, cyl, ell, grain, panels, seams, speckle, text_detail
from iso_models import ficus, framed_art, m, office_chair, round_table, scribbles, sign, sofa, wood_chair


# ---------------------------------------------------------------------------------------------
# Desks. The sitter is at the back (v = 0) facing +v; the monitor stands near the front edge with
# its screen facing the sitter, so a desk's facing is the direction its owner faces.

DESK_TOP = 24.0


def screen_text(seed: int, lines: str = "screen"):
    def f(u, v, z, nu, nv, nz):
        row = np.floor(z / 2)
        on = (np.mod(z, 2) < 1) & (_hash(np.floor(u / 3), row, seed) > 0.35)
        return np.where(on & (nv < -0.5), -1.3, 0.0)
    return f


def monitor(u0: float, v0: float, z0: float, width: float = 20.0, seed: int = 0) -> list:
    """Flat panel on a stand, screen facing -v (towards the sitter)."""
    cu = u0 + width / 2
    return [
        box((cu - 5, v0, z0), (cu + 5, v0 + 5, z0 + 1), "black"),
        box((cu - 1, v0 + 2, z0 + 1), (cu + 1, v0 + 3.5, z0 + 6), "black"),
        box((u0, v0 + 1.5, z0 + 5), (u0 + width, v0 + 4, z0 + 19), "black", shade=0.5),
        box((u0 + 1, v0 + 1.1, z0 + 6), (u0 + width - 1, v0 + 1.5, z0 + 18), "screen", glow=True, shade=-0.6,
            detail=screen_text(seed)),
    ]


def keyboard(u0: float, v0: float, z0: float) -> list:
    return [
        box((u0, v0, z0), (u0 + 16, v0 + 5, z0 + 1), "beige_metal", shade=0.4,
            detail=combine(seams(2, "u", strength=1.0), seams(1.6, "v", strength=1.0))),
        ell((u0 + 19, v0 + 1, z0), (u0 + 22, v0 + 4.5, z0 + 1.6), "black", shade=0.8),
    ]


def mug(u, v, mat="white", z0=DESK_TOP) -> list:
    return [cyl((u, v, z0), (u + 4, v + 4, z0 + 5), mat, shade=0.3), box((u + 3.6, v + 1.5, z0 + 1.5), (u + 5, v + 2.5, z0 + 4), mat)]


def papers(u, v, w=9, d=7, h=2, z0=DESK_TOP) -> list:
    return [box((u, v, z0), (u + w, v + d, z0 + h), "white", shade=0.4, detail=seams(0.7, "z", strength=-0.8))]


def office_desk(name: str, extras: list | None = None, laptop: bool = False, seed: int = 0) -> Model:
    W, D = m(1.5), m(0.75)
    d = Model(name, W, D)
    d.add(box((33, 1, 0), (47, D - 2, 22), "grey_metal", detail=combine(seams(7.3, "z", offset=0.6, strength=1.3),
                                                                         speckle(0.15, 3))))
    for z in (4, 11.3, 18.6):
        d.add(box((38, 0.5, z), (42, 1.2, z + 1), "chrome"))
    d.add(box((1, 1, 0), (3, D - 2, 22), "grey_metal"))
    d.add(box((3, D - 3, 4), (33, D - 1.5, 22), "grey_metal", shade=-0.4))
    d.add(box((0, 0, 22), (W, D, DESK_TOP), "laminate", detail=grain("u", 4, 0.5)))
    if laptop:
        d.add(box((14, 5, DESK_TOP), (32, 15, DESK_TOP + 1), "grey_metal", shade=0.5, detail=seams(1.5, "u", strength=1)))
        d.add(box((14, 15, DESK_TOP), (32, 16.5, DESK_TOP + 12), "grey_metal", shade=0.2))
        d.add(box((15, 14.6, DESK_TOP + 1), (31, 15, DESK_TOP + 11), "screen", glow=True, shade=-0.5, detail=screen_text(seed)))
    else:
        d.prims.extend(monitor(14, 14, DESK_TOP, seed=seed))
        d.prims.extend(keyboard(13, 4, DESK_TOP))
    d.add(box((38, 13, DESK_TOP), (46, 20, DESK_TOP + 2.5), "black", shade=0.6, detail=seams(1.5, "u", strength=1.0)))
    d.add(cyl((38, 15, DESK_TOP + 2.5), (46, 18, DESK_TOP + 4.5), "black", axis="x", shade=1.0))
    d.prims.extend(papers(2, 13, 9, 8, 3))
    for p in extras or []:
        d.add(p)
    return d


DESK_EXTRAS: dict[str, list] = {
    "jim": [*mug(40, 3), ell((3, 3, DESK_TOP), (8, 8, DESK_TOP + 5), "orange_velvet", shade=0.5),
            box((26, 1, DESK_TOP), (30, 3, DESK_TOP + 0.8), "white")],
    # The stapler in jello, a bobblehead and a stack of beet-farm paperwork.
    "dwight": [box((3, 2, DESK_TOP), (12, 9, DESK_TOP + 4.5), "jello", shade=0.6,
                   detail=lambda u, v, z, nu, nv, nz: np.where((u > 1.5) & (u < 7.5) & (z > 1.2) & (z < 3) & (np.abs(nu) + np.abs(nv) > 0.5), -2.0, 0.0)),
               cyl((40, 2, DESK_TOP), (44, 6, DESK_TOP + 6), "art_yellow", shade=-1),
               ell((39.5, 1.5, DESK_TOP + 5), (44.5, 6.5, DESK_TOP + 11), "cream", shade=0.3)],
    "stanley": [box((2, 2, DESK_TOP), (12, 10, DESK_TOP + 0.7), "white", shade=0.6,
                    detail=combine(seams(1.6, "u", strength=1.6), seams(1.6, "v", strength=1.6))), *mug(40, 3, "teal")],
    "phyllis": [cyl((40, 3, DESK_TOP), (44, 7, DESK_TOP + 7), "glass"),
                ell((38.5, 1.5, DESK_TOP + 6), (45.5, 8.5, DESK_TOP + 12), "neon_pink", shade=-1.0, detail=speckle(0.8, 4)),
                ell((4, 4, DESK_TOP), (9, 9, DESK_TOP + 5), "purple", detail=speckle(0.8, 6))],
    "angela": [box((40, 3, DESK_TOP), (46, 4.2, DESK_TOP + 6), "wood_light"),
               box((40.8, 2.8, DESK_TOP + 0.8), (45.2, 3.3, DESK_TOP + 5.2), "orange_velvet", shade=0.4),
               ell((4, 4, DESK_TOP), (8, 8, DESK_TOP + 4), "cream", shade=0.8), ell((5, 5, DESK_TOP + 3), (7.5, 7.5, DESK_TOP + 5.5), "cream", shade=0.8)],
    "kevin": [cyl((3.5, 3.5, DESK_TOP), (9.5, 9.5, DESK_TOP + 8), "red", detail=speckle(1.0, 8)),
              cyl((3, 3, DESK_TOP + 8), (10, 10, DESK_TOP + 9.5), "glass", shade=1.0),
              box((40, 3, DESK_TOP), (46, 9, DESK_TOP + 1.5), "beige_metal", detail=seams(1.5, "u", strength=1.2))],
    "oscar": [box((40, 2, DESK_TOP), (42, 9, DESK_TOP + 9), "navy"), box((42, 2, DESK_TOP), (44, 9, DESK_TOP + 9), "teal"),
              box((44, 2, DESK_TOP), (46, 9, DESK_TOP + 9), "red"), *mug(3, 3)],
    "creed": [cyl((3, 3, DESK_TOP), (10, 10, DESK_TOP + 3), "white"),
              ell((3.5, 3.5, DESK_TOP + 2), (9.5, 9.5, DESK_TOP + 5), "leaf", shade=0.6, detail=speckle(1.0, 9)),
              *papers(36, 2, 10, 8, 4)],
    "meredith": [box((3, 3, DESK_TOP), (11, 10, DESK_TOP + 0.8), "red", shade=0.5, detail=seams(2.5, "v", strength=-1)), *mug(40, 3, "art_blue")],
    "toby": [box((40, 2, DESK_TOP), (46, 9, DESK_TOP + 3), "beige_metal"), box((40, 2, DESK_TOP + 3), (46, 9, DESK_TOP + 6), "art_blue"),
             cyl((4, 4, DESK_TOP), (8, 8, DESK_TOP + 3), "terracotta"), cyl((5, 5, DESK_TOP + 3), (7, 7, DESK_TOP + 8), "leaf_dark")],
    "kelly": [box((3, 3, DESK_TOP), (11, 10, DESK_TOP + 0.8), "neon_pink", shade=-0.8), *mug(40, 3, "neon_pink"),
              box((32, 3, DESK_TOP), (36, 8, DESK_TOP + 1), "neon_pink", shade=-1.5)],
    "ryan": [*mug(40, 3, "black")],
    "pam_spare": [*mug(40, 3)],
}


def exec_desk() -> Model:
    """Michael's executive desk with the World's Best Boss mug and a Dundie."""
    W, D = m(1.8), m(0.9)
    d = Model("desk_exec", W, D)
    d.add(box((1, 2, 0), (W - 1, D - 1, 3), "wood_dark", shade=-0.6))
    d.add(box((0, 1, 3), (W, D, 23), "wood_dark", detail=combine(panels(19.3, 3, 23, 2.5), grain("u", 4, 0.4))))
    d.add(box((0, 0, 23), (W, D, 25.5), "mahogany", detail=grain("u", 4, 0.6)))
    d.prims.extend(monitor(19, 18, 25.5, 22, seed=5))
    d.prims.extend(keyboard(19, 6, 25.5))
    d.prims.extend(mug(46, 4, "white", 25.5))
    d.add(cyl((5, 4, 25.5), (10, 9, 27), "black"))
    d.add(ell((5.8, 4.8, 27), (9.2, 8.2, 36), "brass", shade=1.0))
    d.add(box((22, D - 3, 25.5), (36, D - 1, 28.5), "brass", shade=0.4))
    d.add(box((44, 16, 25.5), (54, 24, 28), "black", shade=0.6, detail=seams(1.5, "u", strength=1.0)))
    d.prims.extend(papers(3, 14, 12, 9, 2, 25.5))
    return d


def reception_desk() -> Model:
    """Pam's desk: work surface behind a raised transaction ledge, the candy dish on top."""
    W, D = m(2.0), m(0.9)
    r = Model("desk_reception", W, D)
    r.add(box((2, 1, 0), (14, 19, 22), "grey_metal", detail=seams(7.3, "z", offset=0.6, strength=1.3)))
    r.add(box((0, 0, 22), (W, 20, 24), "laminate", detail=grain("u", 4, 0.4)))
    r.add(box((0, 20, 0), (W, D, 34), "wood_mid", detail=combine(panels(16, 3, 33, 2.5), grain("u", 4, 0.5))))
    r.add(box((0, 19, 34), (W, D, 36.5), "laminate", shade=0.4))
    r.add(box((W - 2, 0, 0), (W, 20, 24), "wood_mid"))
    r.add(cyl((8, 22, 36.5), (16, 28, 38.5), "glass", shade=0.6))
    r.add(ell((8.8, 22.8, 37.5), (15.2, 27.2, 40.5), "red", detail=speckle(1.0, 12)))
    r.add(cyl((50, 22, 36.5), (54, 26, 43), "glass"))
    r.add(ell((48.5, 20.5, 42), (55.5, 27.5, 48), "art_yellow", shade=-0.5, detail=speckle(0.9, 13)))
    r.add(box((34, 22, 36.5), (42, 27, 37.2), "wood_light"))
    r.prims.extend(monitor(20, 12, 24, 20, seed=2))
    r.prims.extend(keyboard(19, 3, 24))
    r.add(box((44, 3, 24), (56, 11, 27), "black", shade=0.5, detail=combine(seams(1.6, "u", strength=1.3), seams(1.6, "v", strength=1.3))))
    r.add(cyl((44, 9, 27), (56, 11, 29), "black", axis="x", shade=1.0))
    r.prims.extend(papers(2, 2, 10, 8, 2))
    return r


def conference_table() -> Model:
    W, D = m(3.6), m(1.2)
    t = Model("conference_table", W, D)
    for u0 in (20, W - 36):
        t.add(box((u0, 12, 0), (u0 + 16, D - 12, 3), "black", shade=0.4))
        t.add(box((u0 + 4, 15, 3), (u0 + 12, D - 15, 21), "black", shade=0.6))
    t.add(box((2, 2, 20), (W - 2, D - 2, 22), "wood_dark", shade=-0.4))
    t.add(box((0, 0, 22), (W, D, 24.5), "mahogany", detail=grain("u", 5, 0.6)))
    t.add(box((W / 2 - 6, D / 2 - 4, 24.5), (W / 2 + 6, D / 2 + 4, 26), "black", shade=0.8))
    for i, u in enumerate((14, 40, 66, 92)):
        for v in (3, D - 10):
            if (i + (v > 10)) % 2 == 0:
                t.add(box((u, v, 24.5), (u + 7, v + 7, 25.2), "art_yellow", shade=0.6, detail=seams(1.5, "v", strength=-1)))
            else:
                t.add(cyl((u + 2, v + 2, 24.5), (u + 5, v + 5, 31), "glass", shade=0.6))
    return t


def filing_cabinet() -> Model:
    W, D, H = 15.0, 20.0, 42.0
    f = Model("filing_cabinet", W, D)
    f.add(box((0, 0, 0), (W, D, H), "beige_metal", detail=combine(seams(10.5, "z", offset=0.6, strength=1.4), speckle(0.15, 7))))
    for i in range(4):
        z = 4 + i * 10.5
        f.add(box((4, D - 0.2, z), (11, D + 0.6, z + 1.5), "chrome"))
        f.add(box((5.5, D - 0.2, z + 3), (9.5, D + 0.3, z + 5), "white"))
    f.add(box((0, 0, H), (W, D, H + 1), "beige_metal", shade=0.6))
    return f


def photocopier() -> Model:
    W, D = m(1.1), m(0.7)
    c = Model("photocopier", W, D)
    c.add(box((0, 2, 0), (W, D, 24), "beige_metal", detail=combine(seams(8, "z", offset=0.5, strength=1.4), speckle(0.15, 9))))
    for z in (5, 13):
        c.add(box((10, D - 0.2, z), (25, D + 0.6, z + 1.5), "black", shade=0.6))
    c.add(box((2, 2, 24), (W - 2, D - 2, 32), "white", shade=-0.2))
    c.add(box((4, 3, 32), (W - 8, D - 3, 34), "grey_metal", shade=0.6))
    c.add(box((W - 8, D - 9, 31), (W - 1, D - 1, 35), "black", shade=0.5))
    c.add(box((W - 7, D - 1.2, 32), (W - 3, D - 0.8, 34.5), "screen", glow=True))
    c.add(box((0, 6, 18), (3, D - 6, 20), "grey_metal"))
    c.add(box((0.5, 7, 20), (3, D - 7, 22), "white", shade=0.6))
    return c


def water_cooler() -> Model:
    W = D = 11.0
    w = Model("water_cooler", W, D)
    w.add(box((1, 1, 0), (10, 10, 27), "white", detail=seams(20, "z", offset=2, strength=-1)))
    w.add(box((2.5, 9.6, 16), (8.5, 10.3, 24), "grey_metal", shade=-0.8))
    w.add(cyl((3, 9.2, 20), (5, 11, 22), "red", axis="y", shade=0.6))
    w.add(cyl((6, 9.2, 20), (8, 11, 22), "art_blue", axis="y", shade=0.6))
    w.add(cyl((1.5, 1.5, 27), (9.5, 9.5, 30), "water", shade=0.4))
    w.add(cyl((1.8, 1.8, 30), (9.2, 9.2, 41), "water", shade=1.0))
    w.add(cyl((0, 3, 12), (2, 5, 22), "white", shade=0.6))
    return w


def vending(name: str, body: str, kind: str) -> Model:
    W, D, H = m(0.9), m(0.78), m(1.8)
    v = Model(name, W, D)
    v.add(box((0, 0, 0), (W, D, H), body, detail=speckle(0.1, 4)))
    v.add(box((0, 0, H - 4), (W, D, H), body, shade=0.8))
    if kind == "snack":
        v.add(box((2, D - 0.4, 14), (20, D + 0.2, 54), "glass", shade=-2.0))
        colours = ["art_yellow", "red", "teal", "orange_velvet", "purple", "leaf", "white", "neon_pink"]
        for r in range(5):
            for c in range(4):
                mat = colours[(r * 3 + c) % len(colours)]
                v.add(box((3 + c * 4.2, D - 0.1, 17 + r * 7.5), (6 + c * 4.2, D + 0.5, 21 + r * 7.5), mat, shade=0.4))
            v.add(box((2, D - 0.1, 16 + r * 7.5), (20, D + 0.3, 16.6 + r * 7.5), "chrome"))
        v.add(box((3, D - 0.4, 4), (19, D + 0.4, 11), "black"))
    else:
        v.add(box((2, D - 0.4, 22), (20, D + 0.3, 52), "white", glow=True, shade=-0.6,
                  detail=text_detail("SODA", 1.5, 21, lift=-3.5)))
        for i in range(6):
            v.add(box((22, D - 0.2, 24 + i * 4.5), (26, D + 0.5, 27 + i * 4.5), "white", shade=0.4))
        v.add(box((3, D - 0.4, 4), (19, D + 0.4, 12), "black"))
    v.add(box((22, D - 0.3, 46), (27, D + 0.4, 52), "black"))
    v.add(box((22.5, D + 0.3, 49), (26.5, D + 0.5, 51), "led_green", glow=True))
    return v


def fridge() -> Model:
    W, D, H = m(0.75), m(0.7), m(1.75)
    f = Model("fridge", W, D)
    f.add(box((0, 0, 0), (W, D, H), "white", detail=combine(seams(1000, "z", offset=40, strength=-1.5), speckle(0.1, 6))))
    for z0, z1 in ((10, 36), (44, 52)):
        f.add(box((W - 4, D - 0.2, z0), (W - 2.5, D + 1, z1), "chrome"))
    for i, (u, z, mat) in enumerate(((5, 30, "art_yellow"), (9, 22, "white"), (6, 18, "neon_pink"), (12, 33, "art_blue"))):
        f.add(box((u, D - 0.1, z), (u + 4, D + 0.3, z + 5), mat, shade=0.4))
    return f


def kitchen_counter() -> Model:
    W, D = m(3.0), m(0.62)
    k = Model("kitchen_counter", W, D)
    k.add(box((0, 2, 0), (W, D - 2, 4), "black", shade=0.3))
    k.add(box((0, 1, 4), (W, D - 0.5, 28), "white", detail=panels(16, 4, 28, 2)))
    for u in range(6, int(W), 16):
        k.add(box((u, D - 0.6, 22), (u + 4, D + 0.2, 23.5), "chrome"))
    k.add(box((0, 0, 28), (W, D, 30), "stone", detail=speckle(0.6, 11)))
    k.add(box((30, 4, 29.6), (46, 15, 30.3), "stainless", shade=-1.2))
    k.add(cyl((37, 1.5, 30), (39, 3.5, 38), "chrome"))
    k.add(box((37, 2, 36), (39, 7, 38), "chrome"))
    k.add(box((56, 1, 30), (74, 13, 41), "white", shade=0.2))
    k.add(box((58, 12.8, 32), (68, 13.4, 39), "black", shade=0.5))
    k.add(box((70, 12.8, 32), (73, 13.4, 39), "grey_metal", detail=seams(1.5, "z", strength=1)))
    k.add(box((80, 2, 30), (88, 11, 45), "black", shade=0.5))
    k.add(cyl((81, 6, 30), (87, 12, 37), "amber", shade=-0.5))
    k.add(cyl((89, 4, 30), (93, 8, 39), "white", shade=0.6))
    k.add(box((0, 0, 48), (W, 10, 72), "white", detail=panels(16, 48, 72, 2)))
    k.add(box((0, 0, 47), (W, 10, 48), "white", shade=-1.0))
    return k


def trash_can() -> Model:
    t = Model("trash_can", 10.0, 10.0)
    t.add(cyl((0.5, 0.5, 0), (9.5, 9.5, 15), "grey_metal", detail=seams(3, "z", strength=0.5)))
    t.add(cyl((0, 0, 15), (10, 10, 17), "white", shade=0.5))
    return t


def bookshelf() -> Model:
    W, D, H = m(0.9), m(0.35), m(1.8)
    b = Model("bookshelf", W, D)
    b.add(box((0, 0, 0), (W, 1.5, H), "wood_dark"))
    for u in (0, W - 1.5):
        b.add(box((u, 0, 0), (u + 1.5, D, H), "wood_dark", shade=0.3))
    colours = ["navy", "red", "leaf_dark", "art_yellow", "teal", "purple", "cream", "wood_light", "black"]
    for s, z in enumerate((0, 14, 28, 42)):
        b.add(box((1.5, 0, z), (W - 1.5, D, z + 1.5), "wood_dark", shade=0.5))
        u = 2.0
        i = s * 3
        while u < W - 4:
            w = 1.5 + (i % 3) * 0.6
            h = 9 + (i * 7) % 4
            if s == 2 and 10 < u < 18:
                b.add(cyl((u, 3, z + 1.5), (u + 4, 7, z + 3), "black"))
                b.add(ell((u + 0.5, 3.5, z + 3), (u + 3.5, 6.5, z + 11), "brass", shade=1.0))
                u += 6
                continue
            b.add(box((u, 2, z + 1.5), (u + w, D - 1, z + 1.5 + h), colours[i % len(colours)], shade=0.3))
            u += w + 0.3
            i += 1
    b.add(box((0, 0, H), (W, D, H + 1.5), "wood_dark", shade=0.6))
    return b


def paper_boxes() -> Model:
    """Dunder Mifflin copy-paper cartons, stacked."""
    b = Model("paper_boxes", 14.0, 10.0)
    for i, (u, v, z) in enumerate(((0, 0, 0), (0, 0, 9), (0.5, 0.5, 18))):
        b.add(box((u, v, z), (u + 13.5, v + 9.5, z + 9), "white", shade=0.3, detail=text_detail("DM", 4, 7, lift=-4)))
        b.add(box((u, v, z + 7.5), (u + 13.5, v + 9.5, z + 9), "navy", shade=0.4))
    return b


def dundie_shelf() -> Model:
    W, D = m(1.4), 6.0
    s = Model("dundie_shelf", W, D)
    s.add(box((0, 0, 54), (W, D, 56), "wood_dark"))
    for i, u in enumerate(range(3, int(W) - 4, 7)):
        s.add(cyl((u, 1.5, 56), (u + 4, 5, 57.5), "black"))
        s.add(ell((u + 0.6, 2, 57.5), (u + 3.4, 4.6, 65 + (i % 2)), "brass", shade=1.0))
    return s


def cork_board() -> Model:
    W, D = m(1.2), 2.0
    c = Model("cork_board", W, D)
    c.add(box((0, 0, 40), (W, D, 66), "wood_light", shade=0.3))
    c.add(box((1.5, 0, 41.5), (W - 1.5, D + 0.3, 64.5), "pastry", shade=-0.6, detail=speckle(0.8, 14)))
    for i, (u, z, mat) in enumerate(((4, 52, "white"), (13, 46, "art_yellow"), (22, 55, "white"), (30, 44, "neon_pink"), (9, 58, "art_blue"))):
        c.add(box((u, D + 0.2, z), (u + 7, D + 0.6, z + 8), mat, shade=0.4, detail=seams(1.5, "z", strength=-0.8)))
    return c


def wall_clock() -> Model:
    c = Model("wall_clock", 12.0, 2.0)

    def hands(u, v, z, nu, nv, nz):
        cu, cz = u - 5, z - 5
        hour = (np.abs(cu) < 0.6) & (cz > 0) & (cz < 3.5)
        minute = (np.abs(cz) < 0.6) & (cu > 0) & (cu < 4.5)
        ticks = (np.hypot(cu, cz) > 4) & ((np.abs(cu) < 0.6) | (np.abs(cz) < 0.6))
        return np.where((hour | minute | ticks) & (nv > 0.5), -4.0, 0.0)

    c.add(cyl((0, 0, 60), (12, 2, 72), "black", axis="y", shade=0.5))
    c.add(cyl((1, 0, 61), (11, 2.4, 71), "white", axis="y", shade=0.6, detail=hands))
    return c


def whiteboard() -> Model:
    W, D = m(2.0), 3.0
    w = Model("whiteboard", W, D)
    w.add(box((0, 0, 32), (W, D, 66), "grey_metal", shade=0.6))
    w.add(box((1.5, 0, 33.5), (W - 1.5, D + 0.3, 64.5), "white", shade=0.8,
              detail=combine(scribbles(3, 0.16, -2.5), text_detail("SALES", 6, 28, lift=-4))))
    w.add(box((4, 0, 30), (W - 4, 5, 32), "grey_metal", shade=0.4))
    w.add(box((10, 2, 32), (14, 3.5, 33), "art_blue"))
    w.add(box((16, 2, 32), (20, 3.5, 33), "red"))
    return w


def coat_rack() -> Model:
    c = Model("coat_rack", 10.0, 10.0)
    c.add(cyl((1, 1, 0), (9, 9, 1.5), "black"))
    c.add(cyl((4.2, 4.2, 1.5), (5.8, 5.8, 54), "wood_dark"))
    c.add(ell((1, 2, 30), (8, 9, 52), "navy", shade=-0.4))
    c.add(ell((3, 0.5, 34), (9.5, 6, 50), "cream", shade=-0.6))
    return c


CATALOGUE: dict[str, tuple] = {
    **{f"desk_{who}": ((lambda who=who, i=i: office_desk(f"desk_{who}", DESK_EXTRAS[who], laptop=who == "ryan", seed=i)), "floor")
       for i, who in enumerate(DESK_EXTRAS)},
    "desk_plain": (lambda: office_desk("desk_plain", [], seed=31), "floor"),
    "desk_exec": (exec_desk, "floor"),
    "desk_reception": (reception_desk, "floor"),
    "chair_office": (lambda: office_chair("chair_office", "black"), "seat"),
    "chair_exec": (lambda: office_chair("chair_exec", "black_leather", back_h=40), "seat"),
    "chair_conference": (lambda: office_chair("chair_conference", "slate_fabric", back_h=34), "seat"),
    "chair_break": (lambda: wood_chair("chair_break", seat="navy", frame="chrome"), "seat"),
    "sofa_black": (lambda: sofa("sofa_black", "black_leather", "black", 3, m(2.0), legs="chrome", button=False), "floor"),
    "conference_table": (conference_table, "floor"),
    "table_break": (lambda: round_table("table_break", top="laminate", base="grey_metal", diameter=29.0,
                                        items=(cyl((8, 9, 24.5), (12, 13, 29), "white"), box((16, 14, 24.5), (21, 18, 28), "red"))), "floor"),
    "filing_cabinet": (filing_cabinet, "floor"),
    "photocopier": (photocopier, "floor"),
    "water_cooler": (water_cooler, "floor"),
    "vending_snack": (lambda: vending("vending_snack", "navy", "snack"), "floor"),
    "vending_soda": (lambda: vending("vending_soda", "red", "soda"), "floor"),
    "fridge": (fridge, "floor"),
    "kitchen_counter": (kitchen_counter, "floor"),
    "trash_can": (trash_can, "floor"),
    "ficus": (ficus, "floor"),
    "bookshelf": (bookshelf, "floor"),
    "paper_boxes": (paper_boxes, "floor"),
    "coat_rack": (coat_rack, "floor"),
    "dundie_shelf": (dundie_shelf, "wall"),
    "cork_board": (cork_board, "wall"),
    "wall_clock": (wall_clock, "wall"),
    "whiteboard": (whiteboard, "wall"),
    "sign_dunder_mifflin": (lambda: sign("sign_dunder_mifflin", ["DUNDER", "MIFFLIN"], "white", -4.0, 40, 22, 48, frame="grey_metal"), "wall"),
    "sign_paper_company": (lambda: sign("sign_paper_company", ["PAPER CO."], "navy", 3.5, 44, 10, 62), "wall"),
    "poster_teamwork": (lambda: framed_art("poster_teamwork", ("art_blue", "white", "leaf_dark"), frame="black"), "wall"),
}


# ---------------------------------------------------------------------------------------------
# Walls


def drywall(variant: int = 0) -> Face:
    f = Face("drywall")
    f.noise(4, WALL_H, 0.4, seed=variant)
    f.rect(0, 0, T, 5, "grey_metal", -1.4)
    f.rect(0, 4, T, 5, "grey_metal", -0.6)
    f.shade(0, WALL_H - 4, T, WALL_H, -0.7)
    if variant == 1:
        f.rect(14, 10, 18, 14, "white", 1.0)
        f.rect(15, 11, 17, 13, "white", -0.6)
    elif variant == 2:
        f.rect(22, 38, 26, 45, "white", 1.0)
        f.rect(23.5, 40, 24.5, 43, "white", -1.0)
    elif variant == 3:
        f.rect(8, 46, 14, 54, "beige_metal", 0.6)
        f.rect(9, 49, 13, 52, "screen", 0.5)
    return f


def window_face(variant: int) -> Face:
    f = drywall(0)
    f.rect(2, 28, 30, 88, "grey_metal", 0.6)
    f.rect(1, 27, 31, 29, "white", 1.0)
    for z in range(30, 86):
        sky = 1.2 if z > 60 else 0.6
        f.rect(4, z, 28, z + 1, "white", sky - 1.0 + ((z * 7) % 3) * 0.2)
    f.rect(4, 30, 28, 46, "brick", -1.0)
    for u in range(6, 27, 5):
        f.rect(u, 36, u + 2, 42, "black", 0.5)
    f.rect(4, 46, 28, 47, "brick", -1.8)
    blinds(f, 4, 62 if variant == 0 else 50, 28, 86, "cream", 3)
    f.rect(15.5, 30, 16.5, 86, "grey_metal", 0.6)
    f.rect(24, 44, 25, 62, "white", 0.0)
    return f


def wood_door() -> Face:
    f = drywall(0)
    f.rect(4, 0, 28, 76, "grey_metal", 0.4)
    f.rect(6, 0, 26, 73, "wood_light", 0)
    for z in range(2, 72, 5):
        f.rect(7, z, 25, z + 1, "wood_light", -0.5)
    f.rect(21, 34, 25, 36, "chrome", 1.0)
    f.rect(6, 0, 26, 6, "grey_metal", 0.8)
    return f


def glass_door() -> Face:
    f = drywall(0)
    f.rect(1, 0, 31, 80, "grey_metal", 0.6)
    glass_pane(f, 3, 3, 15, 76, 70)
    glass_pane(f, 17, 3, 29, 76, 70)
    f.rect(15, 0, 17, 80, "grey_metal", 0.3)
    f.rect(4, 34, 14, 36, "chrome", 1.2)
    f.rect(18, 34, 28, 36, "chrome", 1.2)
    f.rect(1, 78, 31, 80, "grey_metal", -0.4)
    return f


def glass_partition(variant: int) -> Face:
    f = Face("grey_metal")
    f.rect(0, 0, T, WALL_H, "grey_metal", 0.0, 0)
    glass_pane(f, 1, 4, 31, 92, 60)
    f.rect(0, 0, T, 4, "grey_metal", 0.2)
    f.rect(0, 92, T, WALL_H, "grey_metal", 0.4)
    f.rect(0, 0, 1, WALL_H, "grey_metal", 0.6)
    f.rect(31, 0, 32, WALL_H, "grey_metal", -0.4)
    if variant == 1:
        blinds(f, 1, 56, 31, 92, "cream", 3, 225)
    elif variant == 2:
        blinds(f, 1, 8, 31, 92, "cream", 3, 225)
    return f


def wall_faces() -> dict[str, list[Face]]:
    return {
        "wall_office_side": [drywall(v) for v in range(4)],
        "wall_office_top": [drywall(0), drywall(2), drywall(0), drywall(1)],
        "window_blinds": [window_face(0), window_face(1)],
        "door_wood": [wood_door()],
        "door_glass": [glass_door()],
        "wall_glass": [glass_partition(0), glass_partition(1), glass_partition(1), glass_partition(0)],
    }


FLOORS = {
    "floor_carpet_grey": lambda: carpet("slate_fabric", seed=1, base=3.0),
    "floor_carpet_blue": lambda: carpet("carpet_blue", seed=2, base=3.0, tiles=False),
    "floor_tile_kitchen": lambda: checker_tiles("cream", "drywall", "grey_metal", 16, 3.4),
}
DECALS: dict = {}
CAPS = {"fill": "#8f8a80", "light": "#c4bfb3", "dark": "#4a4640"}
