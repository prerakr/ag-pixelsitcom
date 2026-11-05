"""Shared drawing for the isometric set themes: wall faces and floor textures.

Wall faces are front-view textures, 32 px per tile and WALL_H tall, drawn in ramp-step space
(material + offset from the face's lit base step) so the north (+y, lit) and west (+x, shaded)
faces come from one drawing. Alpha below 255 is honoured on interior walls (glass partitions);
back walls are drawn opaque.

Floors are 128x128 seamless RGBA textures (a 4x4 block of tiles) authored in the same ramps, so
floors, walls and props share one palette.
"""
from __future__ import annotations

import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).parent))
from generate_tiles import fbm, periodic_noise  # noqa: E402
from isoraster import BAYER4, N_STEPS, RAMP_RGB, _hash  # noqa: E402

T = 32
WALL_H = 96
WALL_T = 6
M = 128  # floor macro texture size

FACE_BASE = {"n": 3, "w": 2}  # lit step of the north (+y) and west (+x) faces


class Face:
    def __init__(self, base: str = "drywall", w: int = T, h: int = WALL_H):
        self.mat = np.full((h, w), base, dtype=object)
        self.off = np.zeros((h, w), dtype=np.float32)
        self.alpha = np.full((h, w), 255, dtype=np.uint8)
        self.h = h
        self.w = w

    def rows(self, z0: float, z1: float) -> slice:
        return slice(self.h - int(z1), self.h - int(z0))

    def rect(self, u0, z0, u1, z1, mat, off=0.0, alpha: int = 255):
        """Fill columns u0..u1, heights z0..z1 (z from the floor up)."""
        r, c = self.rows(z0, z1), slice(int(u0), int(u1))
        self.mat[r, c] = mat
        self.off[r, c] = off
        self.alpha[r, c] = alpha

    def shade(self, u0, z0, u1, z1, delta):
        """Shift the ramp step of an area without changing its material."""
        self.off[self.rows(z0, z1), int(u0):int(u1)] += delta

    def noise(self, z0, z1, amount=0.5, seed=0):
        r = self.rows(z0, z1)
        hh = r.stop - r.start
        yy, xx = np.mgrid[0:hh, 0:self.w]
        n = _hash(xx + seed * 31, yy + r.start, seed)
        self.off[r] += np.where(n > 1 - amount * 0.2, 0.6, np.where(n < amount * 0.2, -0.6, 0))

    def render(self, base: int) -> np.ndarray:
        idx = np.clip(np.round(self.off + base), 0, N_STEPS - 1).astype(int)
        out = np.zeros((self.h, self.w, 4), dtype=np.uint8)
        for mat in set(self.mat.ravel()):
            sel = self.mat == mat
            out[sel, :3] = RAMP_RGB[mat][idx[sel]]
        out[..., 3] = self.alpha
        return out


def glass_pane(f: Face, u0, z0, u1, z1, alpha=70, streak=True):
    """Translucent glass with a diagonal reflection streak."""
    f.rect(u0, z0, u1, z1, "glass", 1.2, alpha)
    if streak:
        for k in range(int(z1 - z0)):
            u = u0 + 2 + k // 2
            z = z0 + k
            if u + 3 < u1 and (k // 6) % 3 != 2:
                f.rect(u, z, u + 2, z + 1, "glass", 2.4, alpha + 70)


def blinds(f: Face, u0, z0, u1, z1, mat="cream", pitch=3, alpha=235):
    for z in range(int(z0), int(z1)):
        if (z - int(z0)) % pitch == pitch - 1:
            f.rect(u0, z, u1, z + 1, mat, -1.0, alpha)
        else:
            f.rect(u0, z, u1, z + 1, mat, 0.6 if (z - int(z0)) % pitch == 0 else 0.0, alpha)


# ---------------------------------------------------------------------------------------------
# Floors (128x128 seamless, RGBA)


def _ramp_image(mat: np.ndarray, off: np.ndarray, base: float = 3.0) -> np.ndarray:
    idx = np.clip(np.round(off + base), 0, N_STEPS - 1).astype(int)
    out = np.zeros(mat.shape + (4,), dtype=np.uint8)
    for m in set(mat.ravel()):
        sel = mat == m
        out[sel, :3] = RAMP_RGB[m][idx[sel]]
    out[..., 3] = 255
    return out


def bayer(size: int = M) -> np.ndarray:
    return np.tile(BAYER4, (size // 4, size // 4))


def carpet(ramp: str, seed: int = 0, base: float = 2.6, fleck: float = 0.18, tiles: bool = True) -> np.ndarray:
    """Commercial loop-pile carpet: low-frequency mottling, ordered-dither grain, flecks, and faint
    carpet-tile seams every 64 px (two tiles)."""
    rng = np.random.default_rng(seed)
    n = fbm(M, rng, (4, 8, 16)) - 0.5
    off = n * 1.6 + bayer() * 0.9
    r = rng.random((M, M))
    off = off + np.where(r < fleck * 0.5, -1, 0) + np.where(r > 1 - fleck * 0.5, 1, 0)
    if tiles:
        yy, xx = np.mgrid[0:M, 0:M]
        off = off - ((xx % 64 == 0) | (yy % 64 == 0)) * 0.6
    return _ramp_image(np.full((M, M), ramp, dtype=object), off, base)


def planks(ramp: str, seed: int = 0, plank_h: int = 8, base: float = 2.8, worn: float = 0.0) -> np.ndarray:
    """Floorboards running east-west with staggered butt joints, per-board tone and grain."""
    rng = np.random.default_rng(seed)
    off = np.zeros((M, M), dtype=np.float32)
    yy, xx = np.mgrid[0:M, 0:M]
    for row in range(M // plank_h):
        y0 = row * plank_h
        joint = int(rng.integers(0, M))
        length = int(rng.choice([48, 64, 80]))
        tone_a, tone_b = rng.choice([-0.9, -0.4, 0.0, 0.4, 0.7], size=2)
        band = (yy >= y0) & (yy < y0 + plank_h)
        seg = ((xx - joint) % M) < length
        off[band & seg] = tone_a
        off[band & ~seg] = tone_b
        off[band & (((xx - joint) % M == 0) | ((xx - joint - length) % M == 0))] = -2.2
        off[yy == y0 + plank_h - 1] = -2.0
        off[(yy == y0) & band] += 0.6
    grain = periodic_noise(M, 16, rng)
    off += np.where((np.mod(yy + grain * 6, 3) < 0.8) & (rng.random((M, M)) > 0.4), -0.7, 0)
    if worn:
        wear = fbm(M, rng, (2, 4)) > 0.62
        off += wear * worn
    return _ramp_image(np.full((M, M), ramp, dtype=object), off, base)


def checker_tiles(a: str, b: str, grout: str, size: int = 16, base: float = 3.4) -> np.ndarray:
    yy, xx = np.mgrid[0:M, 0:M]
    alt = ((xx // size) + (yy // size)) % 2 == 1
    mat = np.where(alt, b, a).astype(object)
    off = np.zeros((M, M), dtype=np.float32) + bayer() * 0.5
    rng = np.random.default_rng(3)
    off += (rng.random((M // size, M // size)).repeat(size, 0).repeat(size, 1) - 0.5) * 0.6
    edge = (xx % size == 0) | (yy % size == 0)
    mat[edge] = grout
    off[edge] = -1.0
    off[(xx % size == 1) | (yy % size == 1)] += 0.5
    return _ramp_image(mat, off, base)


def stone_tiles(ramp: str, size: int = 32, seed: int = 4, base: float = 3.0, grout_off: float = -1.6) -> np.ndarray:
    rng = np.random.default_rng(seed)
    yy, xx = np.mgrid[0:M, 0:M]
    tone = (rng.random((M // size, M // size)) - 0.5) * 0.9
    off = tone.repeat(size, 0).repeat(size, 1) + (fbm(M, rng, (8, 16)) - 0.5) * 1.0
    edge = (xx % size == 0) | (yy % size == 0)
    off[edge] = grout_off
    return _ramp_image(np.full((M, M), ramp, dtype=object), off, base)


def concrete(seed: int = 5) -> np.ndarray:
    rng = np.random.default_rng(seed)
    yy, xx = np.mgrid[0:M, 0:M]
    off = (fbm(M, rng, (4, 8, 16)) - 0.5) * 1.6 + bayer() * 0.6
    off[(xx % 64 == 0) | (yy % 64 == 0)] = -1.6
    stain = fbm(M, rng, (2, 4)) > 0.66
    off -= stain * 0.7
    return _ramp_image(np.full((M, M), "stone", dtype=object), off, 2.4)


def grass(seed: int = 6) -> np.ndarray:
    rng = np.random.default_rng(seed)
    n = fbm(M, rng, (4, 8, 16))
    off = (n - 0.5) * 2.2 + bayer() * 1.1
    blades = rng.random((M, M))
    off += np.where(blades > 0.93, 1.2, 0) + np.where(blades < 0.05, -1.2, 0)
    return _ramp_image(np.full((M, M), "leaf", dtype=object), off, 3.0)


def pavers(ramp: str = "stone", seed: int = 7) -> np.ndarray:
    """Running-bond pool-deck pavers, 32x16."""
    rng = np.random.default_rng(seed)
    yy, xx = np.mgrid[0:M, 0:M]
    row = yy // 16
    shifted = (xx + (row % 2) * 16) % M
    tone = rng.random((M // 16, M // 32 + 1))
    off = (tone[row, shifted // 32] - 0.5) * 0.8 + bayer() * 0.4
    off[(yy % 16 == 0) | (shifted % 32 == 0)] = -1.4
    return _ramp_image(np.full((M, M), ramp, dtype=object), off, 3.4)
