"""Exact 2:1 isometric rasteriser for props modelled from boxes, cylinders and ellipsoids.

World axes: x east, y south, z up, all in world pixels (32 per metre, the size of one tile).
Screen: sx = x - y, sy = (x + y) / 2 - z, the same projection as src/engine/iso/IsoProjection.ts.

Every screen pixel is cast as a ray along (1, 1, 1), the direction that keeps (sx, sy) fixed, so
silhouettes land on clean 2:1 pixel steps and a model built from real dimensions renders at its
true size. Shading is quantised onto per-material colour ramps (classic pixel-art banding, with
ordered dithering on curved surfaces), then outlines and rim highlights are added from the
depth and primitive buffers.

Models are authored in a canonical frame: footprint W x D with the front facing +v (south, the
'down' facing). `render(model, facing)` rotates them for the other three facings, so all four
views come from one model and always agree.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Callable

import numpy as np

BAYER4 = np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]], dtype=np.float32) / 16.0 - 0.5

# Light from above and in front-left of the viewer: tops brightest, the +y (screen lower-left)
# face mid, the +x (screen lower-right) face darkest.
LIGHT = np.array([0.07, 0.43, 0.9], dtype=np.float32)
LIGHT /= np.linalg.norm(LIGHT)
AMBIENT = 0.3


def hexrgb(h: str) -> tuple[int, int, int]:
    h = h.lstrip("#")
    return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)


# Six-step ramps, dark to light. Outlines use step 0, highlights step 5.
RAMPS: dict[str, list[str]] = {
    "wood_dark": ["#21110a", "#3d2212", "#5a3319", "#7a4824", "#975e31", "#b47a45"],
    "wood_mid": ["#2e1a0c", "#4f3016", "#714720", "#90602c", "#ad7c3e", "#c99a58"],
    "wood_light": ["#4a3018", "#6e4a26", "#916636", "#b08349", "#c9a062", "#e0bd84"],
    "orange_velvet": ["#3f1707", "#6c290c", "#9b3f15", "#c75a20", "#e67b31", "#f6a154"],
    "orange_dark": ["#2a0f05", "#4a1b08", "#6f2a0e", "#923a15", "#b54d1d", "#d06428"],
    "green_velvet": ["#0f2117", "#1b3726", "#295337", "#3a704a", "#52905f", "#79b37d"],
    "gold_velvet": ["#33230a", "#57400f", "#7e5e18", "#a67f25", "#c99f3c", "#e6c46b"],
    "cream": ["#5d5444", "#857a63", "#ab9f83", "#cbc0a2", "#e4dbbf", "#f7f1de"],
    "white": ["#4c5257", "#7c8388", "#a9afb3", "#cdd2d4", "#e6e9ea", "#fbfcfc"],
    "chrome": ["#22262b", "#40464e", "#666e78", "#959da7", "#c2c9d0", "#eef2f5"],
    "black": ["#0b0b0d", "#17171b", "#232329", "#30303a", "#41414e", "#565667"],
    "marble": ["#1a1716", "#2e2a27", "#45403b", "#615a53", "#80776e", "#a1978c"],
    "red": ["#3a0c0c", "#621414", "#8c1f1d", "#b12f28", "#cf4a3a", "#e8705b"],
    "teal": ["#0b2a2c", "#124245", "#1b5d60", "#28797b", "#3d9796", "#62b6b1"],
    "purple": ["#24132e", "#3b1f4a", "#553069", "#704487", "#8d5ea3", "#ab80bf"],
    "terracotta": ["#3a1a10", "#5e2b19", "#844026", "#a65735", "#c27149", "#d99166"],
    "leaf": ["#0b1f0f", "#143619", "#1f5124", "#2f6e31", "#468c42", "#69ab5a"],
    "leaf_dark": ["#07150a", "#0e2612", "#173a1b", "#225126", "#306a32", "#438541"],
    "pastry": ["#3d220d", "#653a17", "#8e5522", "#b57232", "#d19248", "#e9b46d"],
    "chalk": ["#0d110d", "#151c16", "#1d2820", "#26352b", "#b7bdb0", "#e5e8de"],
    "glass": ["#173241", "#244e62", "#3c7189", "#5f97ae", "#8ebfd0", "#c9e7ef"],
    "lamp_shade": ["#6b4a22", "#9a6c31", "#c79446", "#e7b862", "#f8d68a", "#fff1c7"],
    "brick": ["#33130c", "#541f14", "#76301f", "#94432c", "#ad5a3f", "#c4775a"],
    "mortar": ["#3e352e", "#5b4f45", "#796b5e", "#958677", "#ab9d8d", "#c2b5a5"],
    "frame_green": ["#0c1d16", "#142f23", "#1e4533", "#2b5d46", "#3d7a5c", "#5a9a78"],
    "art_yellow": ["#4a360b", "#7a5a12", "#a8801c", "#d0a52b", "#e8c547", "#f6e27c"],
    "art_blue": ["#101b3a", "#1a2b5c", "#24407f", "#335aa0", "#4c78bd", "#7299d6"],
}
RAMPS.update({
    # Offices
    "laminate": ["#4a3a26", "#6e573a", "#93774f", "#b39365", "#ccad7e", "#e2c89c"],
    "grey_metal": ["#24272b", "#3d4249", "#5a6069", "#7a8089", "#9aa0a8", "#c0c5cb"],
    "beige_metal": ["#4a4436", "#6e6650", "#91886c", "#b0a787", "#cbc3a4", "#e3dcc2"],
    "drywall": ["#5e5849", "#827a66", "#a49b84", "#c2b9a0", "#d8d0b9", "#ebe5d2"],
    "carpet_blue": ["#1c2433", "#273248", "#33415c", "#425272", "#566887", "#6f819e"],
    "navy": ["#0d1426", "#16213d", "#21305a", "#2d4178", "#3e5697", "#5874b3"],
    "black_leather": ["#09090b", "#141417", "#1f1f24", "#2c2c33", "#3d3d47", "#62626f"],
    "screen": ["#0a1f33", "#123456", "#1d5582", "#2e7bb0", "#4fa3d6", "#8fd0f2"],
    "screen_green": ["#04140a", "#082611", "#0e3d1c", "#17592b", "#26813f", "#4cc46a"],
    "jello": ["#4a4508", "#7a720f", "#ada218", "#d6cb2a", "#ece24e", "#f8f290"],
    # Pubs
    "mahogany": ["#1a0806", "#2e0f0a", "#461811", "#602318", "#7b3022", "#984232"],
    "brass": ["#3a2a0a", "#5f4612", "#8a6a1e", "#b38f2e", "#d6b44a", "#f1d988"],
    "red_leather": ["#2a0606", "#480b0b", "#6a1210", "#8c1b16", "#ad2a20", "#cc4636"],
    "green_paint": ["#0e1a14", "#16281f", "#20392c", "#2c4c3b", "#3b614c", "#527a62"],
    "amber": ["#3a1c04", "#6b3507", "#9c520c", "#c87217", "#e8962e", "#f8c066"],
    "bottle_green": ["#06180d", "#0b2a16", "#124022", "#1b5a31", "#287744", "#3f9a5e"],
    "neon_pink": ["#4a0e2c", "#7d1749", "#b52367", "#e23b88", "#f56fae", "#ffb3d6"],
    "neon_orange": ["#4a1d04", "#7d3207", "#b54d0d", "#e2701a", "#f5994a", "#ffc890"],
    "sepia": ["#2a1f14", "#45331f", "#62492c", "#80613b", "#a07e52", "#c3a274"],
    # Houses
    "slate_fabric": ["#1d2124", "#2e3338", "#41484f", "#566068", "#6f7a83", "#8f9aa3"],
    "stainless": ["#2a2d30", "#474c51", "#6a7076", "#90969c", "#b6bbc0", "#dfe2e5"],
    "white_plastic": ["#5c6166", "#8a9095", "#b3b8bc", "#d3d7da", "#e9ebed", "#fdfdfd"],
    "stone": ["#3a3833", "#58554e", "#78746b", "#98938a", "#b5b0a6", "#d2cec5"],
    "water": ["#06263a", "#0b3d5c", "#125883", "#1d76a8", "#3a98c8", "#7cc4e6"],
    "straw": ["#3f2e12", "#64491c", "#8a6728", "#ad8536", "#c9a24c", "#e2c172"],
    "pizza": ["#5a3a14", "#86591f", "#b07a2e", "#cf9b46", "#e5bb6a", "#f4d796"],
    "led_green": ["#062a10", "#0b4a1c", "#127a2e", "#1fb047", "#4fe07a", "#b0ffc8"],
    "led_blue": ["#061a3a", "#0b2d63", "#124796", "#1f6ad0", "#4f96f0", "#b0d4ff"],
    "led_amber": ["#3a2004", "#633807", "#96560c", "#d07c17", "#f0a43e", "#ffd590"],
})
RAMP_RGB = {k: np.array([hexrgb(c) for c in v], dtype=np.uint8) for k, v in RAMPS.items()}
N_STEPS = 6

Detail = Callable[..., np.ndarray]


@dataclass
class Prim:
    """One solid in canonical coordinates: u along the width, v along the depth (front at v=D),
    z up. `lo`/`hi` bound the solid; cylinders take their radius from the bounds across `axis`."""
    shape: str  # 'box' | 'cyl' | 'ell'
    lo: tuple[float, float, float]
    hi: tuple[float, float, float]
    mat: str
    axis: str = "z"
    shade: float = 0.0
    detail: Detail | None = None
    glow: bool = False  # light-emitting (screens, neon, lamps): ignores the scene lighting


@dataclass
class Model:
    name: str
    width: float  # footprint along u, world px
    depth: float  # footprint along v, world px
    prims: list[Prim] = field(default_factory=list)

    def add(self, *prims: Prim) -> "Model":
        self.prims.extend(prims)
        return self


def box(lo, hi, mat, **kw) -> Prim:
    return Prim("box", tuple(map(float, lo)), tuple(map(float, hi)), mat, **kw)


def cyl(lo, hi, mat, axis="z", **kw) -> Prim:
    return Prim("cyl", tuple(map(float, lo)), tuple(map(float, hi)), mat, axis=axis, **kw)


def ell(lo, hi, mat, **kw) -> Prim:
    return Prim("ell", tuple(map(float, lo)), tuple(map(float, hi)), mat, **kw)


# ---------------------------------------------------------------------------------------------
# Facing rotation (canonical u, v -> world x, y)

FACINGS = ("down", "right", "up", "left")


def footprint(model: Model, facing: str) -> tuple[float, float]:
    """World footprint (x extent, y extent) of a model in a facing."""
    return (model.width, model.depth) if facing in ("down", "up") else (model.depth, model.width)


def to_world(u, v, facing: str, W: float, D: float):
    if facing == "down":
        return u, v
    if facing == "up":
        return W - u, D - v
    if facing == "right":
        return v, W - u
    return D - v, u  # left


def to_local(x, y, facing: str, W: float, D: float):
    if facing == "down":
        return x, y
    if facing == "up":
        return W - x, D - y
    if facing == "right":
        return W - y, x
    return y, D - x  # left


def vec_to_local(nx, ny, facing: str):
    if facing == "down":
        return nx, ny
    if facing == "up":
        return -nx, -ny
    if facing == "right":
        return -ny, nx
    return ny, -nx


def world_bounds(p: Prim, facing: str, W: float, D: float):
    xs, ys = [], []
    for u in (p.lo[0], p.hi[0]):
        for v in (p.lo[1], p.hi[1]):
            x, y = to_world(u, v, facing, W, D)
            xs.append(x)
            ys.append(y)
    lo = (min(xs), min(ys), p.lo[2])
    hi = (max(xs), max(ys), p.hi[2])
    axis = p.axis
    if facing in ("right", "left") and axis in ("x", "y"):
        axis = "y" if axis == "x" else "x"
    return lo, hi, axis


# ---------------------------------------------------------------------------------------------
# Ray casting. A pixel's ray is P(t) = (X0 + t, Y0 + t, t); larger t is nearer the viewer.


def _cast(shape: str, lo, hi, axis: str, X0: np.ndarray, Y0: np.ndarray):
    """Returns (t, nx, ny, nz) with t = -inf where the ray misses."""
    neg = np.full(X0.shape, -np.inf, dtype=np.float32)
    zero = np.zeros_like(X0)
    if shape == "box":
        tx0, tx1 = lo[0] - X0, hi[0] - X0
        ty0, ty1 = lo[1] - Y0, hi[1] - Y0
        tmin = np.maximum(np.maximum(tx0, ty0), lo[2])
        tmax = np.minimum(np.minimum(tx1, ty1), hi[2])
        hit = tmin <= tmax
        face = np.argmin(np.stack([tx1, ty1, np.full_like(X0, hi[2])]), axis=0)
        t = np.where(hit, tmax, neg)
        return t, (face == 0).astype(np.float32), (face == 1).astype(np.float32), (face == 2).astype(np.float32)

    if shape == "ell":
        cx, cy, cz = [(lo[i] + hi[i]) / 2 for i in range(3)]
        rx, ry, rz = [max(1e-3, (hi[i] - lo[i]) / 2) for i in range(3)]
        a, b, c = X0 - cx, Y0 - cy, -cz
        A = 1 / rx**2 + 1 / ry**2 + 1 / rz**2
        B = 2 * (a / rx**2 + b / ry**2 + c / rz**2)
        C = a**2 / rx**2 + b**2 / ry**2 + c**2 / rz**2 - 1
        disc = B * B - 4 * A * C
        hit = disc >= 0
        t = np.where(hit, (-B + np.sqrt(np.maximum(disc, 0))) / (2 * A), neg)
        nx, ny, nz = (a + t) / rx**2, (b + t) / ry**2, (c + t) / rz**2
        n = np.sqrt(nx * nx + ny * ny + nz * nz) + 1e-9
        return t, nx / n, ny / n, nz / n

    # Cylinder: circular cross-section across `axis`, capped at the high end of `axis`.
    if axis == "z":
        ca, cb = (lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2
        r = min(hi[0] - lo[0], hi[1] - lo[1]) / 2
        a, b = X0 - ca, Y0 - cb
        s0, s1 = np.full_like(X0, lo[2]), np.full_like(X0, hi[2])
    elif axis == "x":
        ca, cb = (lo[1] + hi[1]) / 2, (lo[2] + hi[2]) / 2
        r = min(hi[1] - lo[1], hi[2] - lo[2]) / 2
        a, b = Y0 - ca, zero - cb
        s0, s1 = lo[0] - X0, hi[0] - X0
    else:  # y
        ca, cb = (lo[0] + hi[0]) / 2, (lo[2] + hi[2]) / 2
        r = min(hi[0] - lo[0], hi[2] - lo[2]) / 2
        a, b = X0 - ca, zero - cb
        s0, s1 = lo[1] - Y0, hi[1] - Y0
    disc = (a + b) ** 2 - 2 * (a * a + b * b - r * r)
    sq = np.sqrt(np.maximum(disc, 0))
    r0 = (-(a + b) - sq) / 2
    r1 = (-(a + b) + sq) / 2
    tmin = np.maximum(r0, s0)
    tmax = np.minimum(r1, s1)
    hit = (disc >= 0) & (tmin <= tmax)
    t = np.where(hit, tmax, neg)
    cap = s1 < r1
    ra, rb = (a + t) / r, (b + t) / r
    if axis == "z":
        return t, np.where(cap, 0, ra), np.where(cap, 0, rb), np.where(cap, 1, 0).astype(np.float32)
    if axis == "x":
        return t, np.where(cap, 1, 0).astype(np.float32), np.where(cap, 0, ra), np.where(cap, 0, rb)
    return t, np.where(cap, 0, ra), np.where(cap, 1, 0).astype(np.float32), np.where(cap, 0, rb)


@dataclass
class Sprite:
    rgba: np.ndarray
    ox: int  # sprite pixel of the world point (0, 0, 0): the footprint's north-west floor corner
    oy: int
    glow: np.ndarray | None = None  # light-emitting pixels (screens, neon, lamps), same size as rgba


def render(model: Model, facing: str = "down", outline: bool = True) -> Sprite:
    W, D = model.width, model.depth
    placed = [(p, *world_bounds(p, facing, W, D)) for p in model.prims]
    sx_vals, sy_vals = [], []
    for _, lo, hi, _ in placed:
        for x in (lo[0], hi[0]):
            for y in (lo[1], hi[1]):
                for z in (lo[2], hi[2]):
                    sx_vals.append(x - y)
                    sy_vals.append((x + y) / 2 - z)
    sx0 = int(np.floor(min(sx_vals))) - 2
    sx1 = int(np.ceil(max(sx_vals))) + 2
    sy0 = int(np.floor(min(sy_vals))) - 2
    sy1 = int(np.ceil(max(sy_vals))) + 2
    w, h = sx1 - sx0, sy1 - sy0

    jj, ii = np.mgrid[0:h, 0:w].astype(np.float32)
    sx = sx0 + ii + 0.5
    sy = sy0 + jj + 0.5
    X0 = sy + sx / 2
    Y0 = sy - sx / 2

    best = np.full((h, w), -np.inf, dtype=np.float32)
    pid = np.full((h, w), -1, dtype=np.int32)
    nxb = np.zeros((h, w), np.float32)
    nyb = np.zeros((h, w), np.float32)
    nzb = np.zeros((h, w), np.float32)
    for k, (p, lo, hi, axis) in enumerate(placed):
        t, nx, ny, nz = _cast(p.shape, lo, hi, axis, X0, Y0)
        closer = t > best + 1e-4
        best = np.where(closer, t, best)
        pid = np.where(closer, k, pid)
        nxb = np.where(closer, nx, nxb)
        nyb = np.where(closer, ny, nyb)
        nzb = np.where(closer, nz, nzb)

    mask = pid >= 0
    tb = np.where(mask, best, 0)
    Px, Py, Pz = X0 + tb, Y0 + tb, tb
    lu, lv = to_local(Px, Py, facing, W, D)
    lnu, lnv = vec_to_local(nxb, nyb, facing)

    bright = AMBIENT + (1 - AMBIENT) * np.maximum(0, nxb * LIGHT[0] + nyb * LIGHT[1] + nzb * LIGHT[2])
    bayer = np.tile(BAYER4, (h // 4 + 1, w // 4 + 1))[:h, :w]
    idx = np.zeros((h, w), dtype=np.float32)
    mat_of = np.empty((h, w), dtype=object)
    for k, (p, *_rest) in enumerate(placed):
        sel = pid == k
        if not sel.any():
            continue
        f = (np.full(int(sel.sum()), 4.0, dtype=np.float32) if p.glow else bright[sel] * (N_STEPS - 1)) + p.shade
        if p.shape != "box" and not p.glow:
            f = f + bayer[sel] * 0.9
        if p.detail is not None:
            lo_c = p.lo
            f = f + p.detail(lu[sel] - lo_c[0], lv[sel] - lo_c[1], Pz[sel] - lo_c[2], lnu[sel], lnv[sel], nzb[sel])
        # Contact darkening just above the floor.
        f = f - (Pz[sel] < 2.5) * (np.abs(nzb[sel]) < 0.5) * 1.0
        idx[sel] = f
        mat_of[sel] = p.mat
    idx = np.round(idx)

    if outline:
        up = np.roll(pid, 1, axis=0)
        up[0] = -1
        top_face = (nzb > 0.9)
        # Rim highlight: top-face pixels sitting directly above a side face of the same solid.
        below = np.roll(pid, -1, axis=0)
        below_side = np.roll(nzb, -1, axis=0) < 0.5
        rim = mask & top_face & (below == pid) & below_side
        idx = np.where(rim, idx + 1, idx)
        # Occlusion contours: a solid drawn over a clearly farther one gets a darker edge.
        contour = np.zeros((h, w), dtype=bool)
        silhouette = np.zeros((h, w), dtype=bool)
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            npid = np.roll(np.roll(pid, dy, axis=0), dx, axis=1)
            nbest = np.roll(np.roll(best, dy, axis=0), dx, axis=1)
            silhouette |= mask & (npid < 0)
            contour |= mask & (npid >= 0) & (npid != pid) & (best - nbest > 3.0)
        idx = np.where(contour & ~silhouette, idx - 2, idx)
        idx = np.where(silhouette, 0, idx)

    glow = np.zeros((h, w), dtype=bool)
    for k, (p, *_rest) in enumerate(placed):
        if p.glow:
            glow |= pid == k
    if outline:
        glow &= ~silhouette

    idx = np.clip(idx, 0, N_STEPS - 1).astype(np.int32)
    rgba = np.zeros((h, w, 4), dtype=np.uint8)
    for mat in set(m for m in mat_of[mask]):
        sel = mask & (mat_of == mat)
        rgba[sel, :3] = RAMP_RGB[mat][idx[sel]]
        rgba[sel, 3] = 255

    # Crop to content, keeping the origin.
    ys, xs = np.nonzero(rgba[..., 3])
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    return Sprite(rgba[y0:y1, x0:x1].copy(), ox=-sx0 - int(x0), oy=-sy0 - int(y0), glow=glow[y0:y1, x0:x1].copy())


# ---------------------------------------------------------------------------------------------
# Detail helpers: (u, v, z, nu, nv, nz) in solid-local pixels -> ramp step offsets


def _hash(a: np.ndarray, b: np.ndarray, seed: int = 0) -> np.ndarray:
    n = (np.floor(a).astype(np.int64) * 73856093) ^ (np.floor(b).astype(np.int64) * 19349663) ^ (seed * 83492791)
    return ((n * 2654435761) & 0xFFFF).astype(np.float32) / 65535.0


def grain(along: str = "u", spacing: float = 3.0, strength: float = 1.0) -> Detail:
    """Wood grain: wavy dark lines along one axis, on every face."""
    def f(u, v, z, nu, nv, nz):
        across = np.where(nz > 0.5, v if along == "u" else u, z)
        along_c = u if along == "u" else v
        wave = across + np.sin(along_c * 0.21 + across * 0.7) * 0.8
        line = (np.mod(wave, spacing) < 0.9) & (_hash(along_c / 7, across, 3) > 0.35)
        return -line.astype(np.float32) * strength
    return f


def speckle(amount: float = 0.6, seed: int = 1) -> Detail:
    def f(u, v, z, nu, nv, nz):
        r = _hash(u + v * 0.37, z + v, seed)
        return np.where(r > 1 - amount * 0.25, 1.0, np.where(r < amount * 0.25, -1.0, 0.0))
    return f


def seams(every: float, axis: str = "u", offset: float = 0.0, strength: float = 1.0) -> Detail:
    """Dark lines every `every` px along an axis (cushion joins, panel gaps)."""
    def f(u, v, z, nu, nv, nz):
        c = {"u": u, "v": v, "z": z}[axis]
        return -(np.mod(c - offset, every) < 1.0).astype(np.float32) * strength
    return f


def tufts(du: float, dz: float, strength: float = 1.5) -> Detail:
    """Button tufting on a front face: dark dimples on a diamond grid."""
    def f(u, v, z, nu, nv, nz):
        row = np.floor(z / dz)
        uu = u + (np.mod(row, 2) * du / 2)
        on = (np.abs(np.mod(uu, du) - du / 2) < 0.8) & (np.abs(np.mod(z, dz) - dz / 2) < 0.8) & (nv > 0.5)
        return -on.astype(np.float32) * strength
    return f


def panels(pw: float, z0: float, z1: float, inset: float = 2.0) -> Detail:
    """Recessed wooden panels on a front face: bevelled rectangles every `pw` px."""
    def f(u, v, z, nu, nv, nz):
        front = (np.abs(nv) > 0.5) | (np.abs(nu) > 0.5)
        along = np.where(np.abs(nv) > 0.5, u, v)
        m = np.mod(along, pw)
        inside = (m > inset) & (m < pw - inset) & (z > z0 + inset) & (z < z1 - inset)
        edge_hi = inside & ((np.abs(z - (z0 + inset + 0.5)) < 0.6) | (np.abs(m - (pw - inset - 0.5)) < 0.6))
        edge_lo = inside & ((np.abs(z - (z1 - inset - 0.5)) < 0.6) | (np.abs(m - (inset + 0.5)) < 0.6))
        out = np.where(inside, -0.6, 0.0) + np.where(edge_hi, 1.4, 0.0) + np.where(edge_lo, -1.2, 0.0)
        return np.where(front, out, 0.0).astype(np.float32)
    return f


def combine(*details: Detail) -> Detail:
    def f(*args):
        total = 0.0
        for d in details:
            total = total + d(*args)
        return total
    return f


# 3x5 pixel font for signage. Rows top to bottom, '#' lit.
FONT: dict[str, list[str]] = {
    "A": ["###", "#.#", "###", "#.#", "#.#"], "B": ["##.", "#.#", "##.", "#.#", "##."],
    "C": ["###", "#..", "#..", "#..", "###"], "D": ["##.", "#.#", "#.#", "#.#", "##."],
    "E": ["###", "#..", "##.", "#..", "###"], "F": ["###", "#..", "##.", "#..", "#.."],
    "G": ["###", "#..", "#.#", "#.#", "###"], "H": ["#.#", "#.#", "###", "#.#", "#.#"],
    "I": ["###", ".#.", ".#.", ".#.", "###"], "J": ["..#", "..#", "..#", "#.#", "###"],
    "K": ["#.#", "#.#", "##.", "#.#", "#.#"], "L": ["#..", "#..", "#..", "#..", "###"],
    "M": ["#.#", "###", "###", "#.#", "#.#"], "N": ["##.", "#.#", "#.#", "#.#", "#.#"],
    "O": ["###", "#.#", "#.#", "#.#", "###"], "P": ["###", "#.#", "###", "#..", "#.."],
    "Q": ["###", "#.#", "#.#", "###", "..#"], "R": ["##.", "#.#", "##.", "#.#", "#.#"],
    "S": ["###", "#..", "###", "..#", "###"], "T": ["###", ".#.", ".#.", ".#.", ".#."],
    "U": ["#.#", "#.#", "#.#", "#.#", "###"], "V": ["#.#", "#.#", "#.#", "#.#", ".#."],
    "W": ["#.#", "#.#", "###", "###", "#.#"], "X": ["#.#", "#.#", ".#.", "#.#", "#.#"],
    "Y": ["#.#", "#.#", ".#.", ".#.", ".#."], "Z": ["###", "..#", ".#.", "#..", "###"],
    "0": ["###", "#.#", "#.#", "#.#", "###"], "1": [".#.", "##.", ".#.", ".#.", "###"],
    "2": ["###", "..#", "###", "#..", "###"], "3": ["###", "..#", "###", "..#", "###"],
    "'": [".#.", ".#.", "...", "...", "..."], "-": ["...", "...", "###", "...", "..."],
    "&": [".#.", "#.#", ".#.", "#.#", ".##"], ".": ["...", "...", "...", "...", ".#."],
    " ": ["...", "...", "...", "...", "..."],
}


def text_mask(text: str, u0: float, z_top: float, u: np.ndarray, z: np.ndarray, spacing: int = 1) -> np.ndarray:
    """Pixels of `text` (3x5 glyphs) whose left edge is at u0 and top row at z_top, on a face whose
    local coords are (u right, z up)."""
    on = np.zeros(u.shape, dtype=bool)
    col = np.floor(u - u0).astype(int)
    row = np.floor(z_top - z).astype(int)
    for i, ch in enumerate(text.upper()):
        glyph = FONT.get(ch, FONT[" "])
        gx = col - i * (3 + spacing)
        inside = (gx >= 0) & (gx < 3) & (row >= 0) & (row < 5)
        for r in range(5):
            for c in range(3):
                if glyph[r][c] == "#":
                    on |= inside & (gx == c) & (row == r)
    return on


def text_detail(text: str, u0: float, z_top: float, lift: float = 3.0, face: str = "front", spacing: int = 1) -> Detail:
    """Ramp offset that lights up `text` on a solid's front (+v) face, in solid-local pixels."""
    def f(u, v, z, nu, nv, nz):
        front = nv > 0.5 if face == "front" else nz > 0.5
        return np.where(front & text_mask(text, u0, z_top, u, z if face == "front" else -v, spacing), lift, 0.0)
    return f


def text_width(text: str, spacing: int = 1) -> int:
    return len(text) * (3 + spacing) - spacing
