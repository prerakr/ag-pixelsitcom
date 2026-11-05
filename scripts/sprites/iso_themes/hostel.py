"""The Hacker Hostel (Silicon Valley): Erlich's Palo Alto ranch house. White plaster and oak,
the guys' desks in the living room, the scrum board, Anton humming in the garage, the smart
fridge, and the pool and palapa out back behind sliding glass doors."""
from __future__ import annotations

import numpy as np

from isofaces import WALL_H, Face, T, concrete, glass_pane, grass, pavers, planks, stone_tiles
from isoraster import Model, _hash, box, combine, cyl, ell, grain, panels, seams, speckle, text_detail
from iso_models import bar_stool, m, office_chair, potted_plant, round_table, scribbles, sign, wood_chair

from office import keyboard, monitor  # noqa: E402  (shared desk furniture)

TOP = 23.5


def tower_pc(u, v) -> list:
    return [box((u, v, 0), (u + 7, v + 14, 16), "black", shade=0.6),
            box((u + 6.6, v + 2, 3), (u + 7.2, v + 12, 4), "led_blue", glow=True)]


def coding_desk(name: str, monitors: int, screen: str, extras: list) -> Model:
    W, D = m(1.6), m(0.75)
    d = Model(name, W, D)
    for u in (1, W - 3):
        for v in (1, D - 3):
            d.add(box((u, v, 0), (u + 2, v + 2, 22), "white_plastic", shade=-0.4))
    d.add(box((0, 0, 22), (W, D, TOP), "white_plastic", shade=0.4))
    spacing = 21
    first = W / 2 - spacing * monitors / 2
    for i in range(monitors):
        parts = monitor(first + i * spacing + 1, 15, TOP, 19, seed=11 + i + len(name))
        if screen != "screen":
            parts[-1].mat = screen
        d.prims.extend(parts)
    d.prims.extend(keyboard(16, 4, TOP))
    d.prims[-2].mat = "black"
    d.prims.extend(tower_pc(W - 10, 3))
    for p in extras:
        d.add(p)
    return d


def can(u, v, mat) -> list:
    return [cyl((u, v, TOP), (u + 2.5, v + 2.5, TOP + 4.5), mat, shade=0.6)]


EXTRAS = {
    "richard": [*can(3, 3, "leaf"), box((40, 3, TOP), (48, 10, TOP + 0.8), "white", detail=seams(1.5, "z", strength=-1))],
    "gilfoyle": [*can(3, 3, "black"), *can(6, 4, "black"), ell((42, 3, TOP), (48, 9, TOP + 3), "black", shade=0.4)],
    "dinesh": [*can(3, 3, "art_blue"), ell((40, 2, TOP), (48, 10, TOP + 4), "red", shade=-0.4),
               box((42, 11, TOP), (46, 13, TOP + 1), "art_yellow")],
}


def sectional() -> Model:
    """L-shaped sectional: a 2.6 m run with a chaise returning forward on the right."""
    W, D, CH = m(2.6), 30.0, 30.0
    s = Model("sectional_sofa", W, D + CH)
    fab = "slate_fabric"
    s.add(box((0, 1, 2), (W, D, 13), fab, shade=-0.5))
    s.add(box((W - 30, D, 2), (W, D + CH, 13), fab, shade=-0.5))
    for i in range(3):
        u0 = 7 + i * (W - 37) / 3
        s.add(box((u0 + 0.5, 9, 13), (u0 + (W - 37) / 3 - 0.5, D, 17), fab, detail=speckle(0.25, i)))
    s.add(box((W - 29.5, 9, 13), (W - 7, D + CH - 0.5, 17), fab, detail=speckle(0.25, 7)))
    s.add(box((0, 0, 13), (W, 9, 30), fab, shade=-0.2))
    s.add(box((0, 2, 13), (7, D, 22), fab, shade=-0.1))
    s.add(box((W - 7, 2, 13), (W, D + CH, 22), fab, shade=-0.1))
    for u, mat in ((9, "art_yellow"), (W - 30, "teal"), (W - 20, "cream")):
        s.add(ell((u, 6, 15), (u + 11, 13, 27), mat, shade=0.2))
    for u in (2, W - 5):
        s.add(box((u, 3, 0), (u + 3, 6, 2), "black"))
    return s


def coffee_table_modern() -> Model:
    W, D = m(1.2), m(0.6)
    t = Model("coffee_table_modern", W, D)
    t.add(box((2, 2, 0), (W - 2, D - 2, 10), "black", shade=0.3))
    t.add(box((0, 0, 10), (W, D, 13), "wood_mid", detail=grain("u", 4, 0.6)))
    t.add(box((4, 3, 13), (18, 16, 14.8), "pastry", shade=0.2, detail=seams(1000, "z", offset=1, strength=-1)))
    t.add(box((5, 4, 14.8), (17, 15, 15.2), "pastry", shade=0.8, detail=text_detail("PIZZA", 0, 10, lift=-3, face="top")))
    t.add(box((22, 5, 13), (34, 14, 14), "grey_metal", shade=0.6))
    t.add(box((22, 13, 13), (34, 14.2, 21), "grey_metal", shade=0.3))
    t.add(box((23, 12.8, 14), (33, 13.2, 20), "screen", glow=True, shade=-0.5))
    t.add(cyl((30, 3, 13), (32.5, 5.5, 17.5), "leaf", shade=0.6))
    t.add(box((6, 17, 13), (12, 20, 14.5), "black", shade=0.6))
    return t


def server_rack(name: str, seed: int) -> Model:
    """Anton: a 42U cabinet of 1U servers behind a glass door, LEDs blinking."""
    W, D, H = m(0.6), m(1.0), m(2.0)
    r = Model(name, W, D)
    r.add(box((0, 0, 0), (W, D, H), "black", detail=speckle(0.15, seed)))

    def front(u, v, z, nu, nv, nz):
        unit = np.mod(z, 3) < 0.8
        led = (_hash(np.floor(u / 2), np.floor(z / 3), seed) > 0.72) & (np.mod(u, 2) < 1) & (np.mod(z, 3) > 1.4)
        return np.where(nv > 0.5, np.where(led, 0.0, np.where(unit, -1.5, -0.6)), 0.0)

    r.add(box((1.5, D - 0.4, 4), (W - 1.5, D + 0.2, H - 4), "grey_metal", shade=-1.5, detail=front))
    rng = np.random.default_rng(seed)
    for k in range(26):
        u = float(rng.uniform(2.5, W - 4))
        z = float(rng.choice(np.arange(6, H - 6, 3)))
        mat = str(rng.choice(["led_green", "led_green", "led_blue", "led_amber"]))
        r.add(box((u, D + 0.1, z), (u + 1, D + 0.5, z + 1), mat, glow=True, shade=0.6))
    r.add(box((0, 0, H), (W, D, H + 1), "grey_metal", shade=0.2, detail=seams(3, "u", strength=-1)))
    r.add(cyl((W / 2 - 2, 4, H + 1), (W / 2 + 2, 8, H + 12), "black", shade=0.4))
    return r


def ups_box() -> Model:
    u = Model("ups_box", 14.0, 20.0)
    u.add(box((0, 0, 0), (14, 20, 16), "black", shade=0.4, detail=seams(2, "z", strength=-0.6)))
    u.add(box((3, 19.8, 11), (11, 20.4, 14), "led_green", glow=True, shade=-1.5))
    return u


def workbench() -> Model:
    W, D = m(1.8), m(0.65)
    b = Model("workbench", W, D)
    for u in (1, W - 3):
        for v in (1, D - 3):
            b.add(box((u, v, 0), (u + 2, v + 2, 27), "grey_metal"))
    b.add(box((1, 1, 6), (W - 1, D - 1, 7), "grey_metal", shade=0.4))
    b.add(box((0, 0, 27), (W, D, 29), "wood_light", detail=speckle(0.5, 5)))
    b.add(box((4, 3, 29), (16, 12, 32), "black", detail=seams(2, "u", strength=1.0)))
    b.add(box((18, 2, 29), (26, 8, 31), "art_blue"))
    b.add(cyl((30, 4, 29), (33, 7, 33), "red", shade=0.6))
    b.prims.extend(monitor(36, 12, 29, 18, seed=41))
    b.add(box((2, 1, 7), (20, 18, 15), "pastry", detail=seams(1000, "z", offset=6.5, strength=-1)))
    return b


def garage_shelves() -> Model:
    W, D, H = m(1.2), m(0.45), m(1.8)
    s = Model("garage_shelves", W, D)
    for u in (0, W - 1.5):
        for v in (0, D - 1.5):
            s.add(box((u, v, 0), (u + 1.5, v + 1.5, H), "grey_metal", shade=0.4))
    rng = np.random.default_rng(33)
    for z in (4, 18, 32, 46):
        s.add(box((0, 0, z), (W, D, z + 1), "grey_metal", shade=0.6))
        u = 2.0
        while u < W - 8:
            w = float(rng.choice([8, 10, 12]))
            h = float(rng.choice([7, 9, 11]))
            mat = str(rng.choice(["pastry", "pastry", "black", "art_blue", "white_plastic"]))
            s.add(box((u, 1.5, z + 1), (u + w, D - 1.5, z + 1 + h), mat, shade=0.2, detail=seams(1000, "z", offset=h - 2, strength=-1)))
            u += w + 1
    return s


def smart_fridge() -> Model:
    W, D, H = m(0.9), m(0.75), m(1.8)
    f = Model("smart_fridge", W, D)
    f.add(box((0, 0, 0), (W, D, H), "stainless", detail=combine(seams(1000, "z", offset=18, strength=-1.5),
                                                               seams(1000, "u", offset=W / 2, strength=-1.5))))
    for u in (W / 2 - 3, W / 2 + 1.5):
        f.add(box((u, D - 0.2, 24), (u + 1.5, D + 1, 50), "chrome", shade=0.6))
    f.add(box((4, D - 0.2, 12), (W - 4, D + 1, 13.5), "chrome", shade=0.6))
    f.add(box((W / 2 + 4, D - 0.1, 32), (W - 3, D + 0.3, 48), "screen", glow=True, shade=-0.4,
              detail=lambda u, v, z, nu, nv, nz: np.where((np.mod(z, 3) < 1) & (u > 1) & (u < 8), 1.5, 0.0)))
    return f


def kitchen_run() -> Model:
    W, D = m(3.0), m(0.65)
    k = Model("kitchen_run", W, D)
    k.add(box((0, 2, 0), (W, D - 2, 4), "black"))
    k.add(box((0, 1, 4), (W, D - 0.5, 28), "slate_fabric", shade=-0.4, detail=panels(16, 4, 28, 1.5)))
    for u in range(4, int(W), 16):
        k.add(box((u, D - 0.6, 24), (u + 8, D + 0.2, 25), "stainless"))
    k.add(box((0, 0, 28), (W, D, 30), "white_plastic", shade=0.2, detail=speckle(0.4, 7)))
    k.add(box((10, 3, 30), (30, 17, 30.6), "black", shade=0.4,
              detail=lambda u, v, z, nu, nv, nz: np.where((np.abs(np.hypot(np.mod(u, 10) - 5, np.mod(v, 7) - 3.5) - 2.5) < 0.6), 2.0, 0.0)))
    k.add(box((8, 0, 52), (32, 12, 58), "stainless", shade=0.4))
    k.add(box((16, 0, 58), (24, 6, 72), "stainless", shade=0.2))
    k.add(box((44, 4, 29.6), (60, 15, 30.3), "stainless", shade=-1.0))
    k.add(cyl((51, 1.5, 30), (53, 3.5, 40), "chrome"))
    k.add(box((51, 2, 38), (53, 8, 40), "chrome"))
    k.add(box((70, 2, 30), (78, 10, 44), "black", shade=0.6))
    k.add(cyl((82, 3, 30), (88, 9, 38), "white", shade=0.6))
    return k


def kitchen_island() -> Model:
    W, D = m(2.0), m(0.9)
    k = Model("kitchen_island", W, D)
    k.add(box((2, 2, 0), (W - 2, D - 2, 27), "white_plastic", detail=panels(15, 3, 26, 1.5)))
    k.add(box((0, 0, 27), (W, D, 29.5), "stone", shade=1.0, detail=speckle(0.5, 9)))
    k.add(box((8, 8, 29.5), (24, 20, 30.5), "wood_light", shade=0.4))
    k.add(ell((10, 10, 30.5), (22, 18, 33.5), "stainless", shade=0.6))
    k.add(ell((19.5, 12, 30.8), (24, 16, 33), "stainless", shade=0.2))
    k.add(cyl((38, 8, 29.5), (48, 18, 32), "white", shade=0.4))
    for i, (u, v, mat) in enumerate(((39, 9, "red"), (43, 12, "art_yellow"), (40, 14, "leaf"))):
        k.add(ell((u, v, 31), (u + 4, v + 4, 35), mat, shade=0.4))
    return k


def palapa_roof() -> Model:
    """Thatched cone over the patio table; drawn over anyone standing beneath it."""
    W = D = m(2.6)
    p = Model("palapa_roof", W, D)
    c = W / 2

    def thatch(u, v, z, nu, nv, nz):
        streak = _hash(np.floor((u + v) / 1.5), np.floor(z / 4), 2) > 0.55
        return np.where(streak, -1.0, 0.0) + np.where(np.mod(z, 6) < 1, -0.8, 0.0)

    # A fringe of hanging thatch, then a cone of thin layers so the slope reads as a roof.
    p.add(cyl((c - c, c - c, 60), (c + c, c + c, 65), "straw", shade=-0.6, detail=thatch))
    layers = 14
    for i in range(layers):
        t = i / layers
        r = c * (1 - t) * 0.97 + 1.5
        z0 = 65 + i * 2.2
        p.add(cyl((c - r, c - r, z0), (c + r, c + r, z0 + 2.6), "straw", shade=0.1 + t * 0.6, detail=thatch))
    p.add(cyl((c - 1.5, c - 1.5, 65 + layers * 2.2), (c + 1.5, c + 1.5, 65 + layers * 2.2 + 5), "wood_dark"))
    return p


def palapa_post() -> Model:
    p = Model("palapa_post", 4.0, 4.0)
    p.add(box((0, 0, 0), (4, 4, 64), "wood_dark", detail=grain("v", 3, 0.6)))
    return p


def pool() -> Model:
    W, D = m(4.0), m(2.5)
    p = Model("pool", W, D)
    for lo, hi in (((0, 0, 0), (W, 4, 2)), ((0, D - 4, 0), (W, D, 2)), ((0, 4, 0), (4, D - 4, 2)), ((W - 4, 4, 0), (W, D - 4, 2))):
        p.add(box(lo, hi, "stone", shade=0.8, detail=seams(8, "u", strength=-0.8)))

    def ripples(u, v, z, nu, nv, nz):
        wave = np.sin(u * 0.35 + np.sin(v * 0.25) * 2.0) + np.sin(v * 0.5 - u * 0.12)
        return np.where(wave > 1.4, 1.6, np.where(wave < -1.5, -0.8, 0.0))

    p.add(box((4, 4, 0), (W - 4, D - 4, 0.6), "water", glow=True, shade=-1.6, detail=ripples))
    for u in (W - 16, W - 10):
        p.add(box((u, 2, 2), (u + 1.2, 4, 14), "chrome", shade=0.6))
    p.add(box((W - 16, 2, 13), (W - 8.8, 4, 14), "chrome", shade=0.8))
    return p


def lounger() -> Model:
    W, D = m(0.65), m(1.9)
    l = Model("lounger", W, D)
    for u in (1, W - 2.5):
        l.add(box((u, 2, 0), (u + 1.5, D - 2, 2), "white_plastic", shade=-0.3))
    l.add(box((1, 18, 6), (W - 1, D - 1, 8), "white_plastic", detail=seams(3, "v", strength=-0.8)))
    for i in range(5):
        l.add(box((1, 2 + i * 3, 8 + i * 3), (W - 1, 5 + i * 3, 10 + i * 3), "white_plastic", shade=0.2))
    l.add(box((3, 30, 8), (W - 3, 52, 9), "teal", shade=0.4))
    return l


def scrum_board() -> Model:
    W, D = m(2.2), 3.0
    w = Model("scrum_board", W, D)
    w.add(box((0, 0, 30), (W, D, 68), "grey_metal", shade=0.6))
    w.add(box((1.5, 0, 31.5), (W - 1.5, D + 0.3, 66.5), "white", shade=0.8,
              detail=combine(text_detail("PIED PIPER", 5, 33, lift=-4), scribbles(9, 0.1, -2.5),
                             seams(23, "u", offset=1, strength=-1.5))))
    rng = np.random.default_rng(17)
    for col in range(3):
        for k in range(4):
            if rng.random() < 0.8:
                u = 4 + col * 23 + float(rng.uniform(0, 10))
                z = 34 + k * 6
                w.add(box((u, D + 0.2, z), (u + 5, D + 0.5, z + 4.5), str(rng.choice(["art_yellow", "neon_pink", "led_blue", "leaf"])), shade=0.2))
    return w


def shrub(name: str, seed: int) -> Model:
    s = Model(name, 22.0, 22.0)
    for i, (u, v, z, r) in enumerate(((11, 11, 10, 10), (7, 9, 14, 7), (15, 12, 15, 7), (11, 14, 19, 6))):
        s.add(ell((u - r, v - r, z - r), (u + r, v + r, z + r), "leaf" if i % 2 else "leaf_dark", shade=0.3 * i, detail=speckle(1.0, seed + i)))
    return s


CATALOGUE: dict[str, tuple] = {
    "desk_richard": (lambda: coding_desk("desk_richard", 1, "screen", EXTRAS["richard"]), "floor"),
    "desk_gilfoyle": (lambda: coding_desk("desk_gilfoyle", 2, "screen_green", EXTRAS["gilfoyle"]), "floor"),
    "desk_dinesh": (lambda: coding_desk("desk_dinesh", 2, "screen", EXTRAS["dinesh"]), "floor"),
    "chair_mesh": (lambda: office_chair("chair_mesh", "slate_fabric", back_h=38), "seat"),
    "sectional_sofa": (sectional, "floor"),
    "coffee_table_modern": (coffee_table_modern, "floor"),
    "beanbag": (lambda: Model("beanbag", 22.0, 22.0).add(ell((0, 0, 0), (22, 22, 16), "red", shade=0.2, detail=speckle(0.3, 3)),
                                                         ell((3, 2, 8), (19, 14, 22), "red", shade=0.4)), "seat"),
    "server_rack": (lambda: server_rack("server_rack", 4), "floor"),
    "server_rack_b": (lambda: server_rack("server_rack_b", 9), "floor"),
    "ups_box": (ups_box, "floor"),
    "workbench": (workbench, "floor"),
    "garage_shelves": (garage_shelves, "floor"),
    "smart_fridge": (smart_fridge, "floor"),
    "kitchen_run": (kitchen_run, "floor"),
    "kitchen_island": (kitchen_island, "floor"),
    "stool_island": (lambda: bar_stool("stool_island", seat="black", pole="stainless", height=24), "stool"),
    "dining_chair": (lambda: wood_chair("dining_chair", seat="wood_light", frame="black"), "seat"),
    "patio_table": (lambda: round_table("patio_table", top="wood_light", base="black", diameter=32.0,
                                        items=(cyl((12, 13, 24.5), (16, 17, 31), "leaf"), cyl((19, 10, 24.5), (22, 13, 29), "glass"))), "floor"),
    "palapa_roof": (palapa_roof, "overhead"),
    "palapa_post": (palapa_post, "floor"),
    "pool": (pool, "floor"),
    "lounger": (lounger, "seat"),
    "shrub": (lambda: shrub("shrub", 30), "floor"),
    "succulent": (lambda: potted_plant("succulent", pot="white_plastic", size=0.7), "floor"),
    "scrum_board": (scrum_board, "wall"),
    "sign_aviato": (lambda: sign("sign_aviato", ["AVIATO"], "art_blue", 4.5, 34, 14, 52, frame="black"), "wall"),
}


# ---------------------------------------------------------------------------------------------
# Walls


def plaster(variant: int) -> Face:
    f = Face("cream")
    f.shade(0, 0, T, WALL_H, 1.0)
    f.noise(6, WALL_H, 0.3, seed=variant + 40)
    f.rect(0, 0, T, 6, "white_plastic", 0.6)
    f.rect(0, 6, T, 7, "white_plastic", -0.8)
    f.shade(0, WALL_H - 3, T, WALL_H, -0.6)
    if variant == 1:
        f.rect(13, 11, 17, 15, "white_plastic", 1.0)
    elif variant == 2:
        f.rect(22, 38, 26, 45, "white_plastic", 1.0)
    return f


def big_window(variant: int) -> Face:
    f = plaster(0)
    f.rect(2, 16, 30, 88, "white_plastic", 0.8)
    for z in range(18, 86):
        f.rect(4, z, 28, z + 1, "glass", 1.6 if z > 50 else 1.0)
    rng = np.random.default_rng(50 + variant)
    for _ in range(6):
        cu, cz, r = rng.uniform(4, 28), rng.uniform(30, 60), rng.uniform(4, 8)
        for z in range(int(cz - r), int(cz + r)):
            half = np.sqrt(max(0, r * r - (z - cz) ** 2))
            u0, u1 = max(4, int(cu - half)), min(28, int(cu + half))
            if u1 > u0 and 18 <= z < 86:
                f.rect(u0, z, u1, z + 1, "leaf", float(rng.choice([-0.5, 0, 0.5])))
    f.rect(4, 18, 28, 26, "leaf_dark", 0.0)
    f.rect(15.5, 18, 16.5, 86, "white_plastic", 0.6)
    f.rect(1, 15, 31, 17, "white_plastic", 1.2)
    return f


def front_door() -> Face:
    f = plaster(0)
    f.rect(3, 0, 29, 76, "white_plastic", 1.0)
    f.rect(5, 0, 27, 74, "white_plastic", 0.4)
    f.rect(8, 40, 24, 68, "white_plastic", -0.4)
    f.rect(8, 8, 24, 34, "white_plastic", -0.4)
    f.rect(22, 34, 25, 37, "brass", 0.8)
    return f


def sliding_glass(variant: int) -> Face:
    f = Face("black")
    f.rect(0, 0, T, WALL_H, "black", 0.0, 0)
    glass_pane(f, 1, 3, 31, 88, 55)
    f.rect(0, 0, T, 3, "black", 0.8)
    f.rect(0, 88, T, WALL_H, "cream", 1.0)
    f.rect(0, 88, T, 89, "black", 0.6)
    f.rect(0, 0, 1, 88, "black", 0.8)
    if variant == 1:
        f.rect(15, 0, 17, 88, "black", 0.8)
        f.rect(13, 36, 14, 46, "chrome", 1.0)
    return f


def hedge(variant: int) -> Face:
    f = Face("leaf")
    rng = np.random.default_rng(60 + variant)
    yy, xx = np.mgrid[0:WALL_H, 0:T]
    n = _hash(xx / 2 + variant * 7, yy / 2, 61)
    f.off[:] = (n - 0.5) * 2.4 - 0.4
    f.mat[(WALL_H - yy) < 10] = "leaf_dark"
    for u in range(0, T, 3):
        top = 58 + int(rng.integers(0, 6))
        f.alpha[: WALL_H - top, u:u + 3] = 0
    return f


def cinder_block(variant: int) -> Face:
    f = Face("stone")
    for row, z in enumerate(range(0, WALL_H, 8)):
        shift = 8 if row % 2 else 0
        f.rect(0, z, T, z + 1, "stone", -1.4)
        for u in range(-shift, T, 16):
            if 0 <= u + 15 < T:
                f.rect(u + 15, z, u + 16, z + 8, "stone", -1.4)
    f.noise(0, WALL_H, 0.5, seed=variant + 70)
    f.shade(0, 0, T, WALL_H, -0.4)
    return f


def wall_faces() -> dict[str, list[Face]]:
    return {
        "wall_office_side": [plaster(v) for v in (0, 1, 0, 2)],
        "window_blinds": [big_window(0), big_window(1)],
        "door_wood": [front_door()],
        "wall_glass": [sliding_glass(0), sliding_glass(1)],
        "door_glass": [sliding_glass(0)],
        "wall_hedge": [hedge(v) for v in range(4)],
        "wall_brick": [cinder_block(v) for v in range(4)],
    }


FLOORS = {
    "floor_wood": lambda: planks("wood_light", seed=9, plank_h=6, base=3.2),
    "floor_tile_kitchen": lambda: stone_tiles("stone", 32, base=3.7, grout_off=-1.2),
    "floor_concrete": concrete,
    "floor_grass": grass,
    "floor_deck": pavers,
}
DECALS: dict = {}
CAPS = {"fill": "#cfc8bb", "light": "#efe9de", "dark": "#8a8378"}
# Walls shorter than the 3 m standard, by tile type (the back hedge), and their caps.
WALL_HEIGHTS = {"wall_hedge": 58}
CAPS_BY_TYPE = {"wall_hedge": {"fill": "#2f6e31", "light": "#468c42", "dark": "#143619"}}
