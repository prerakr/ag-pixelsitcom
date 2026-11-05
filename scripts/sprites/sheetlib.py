"""Shared helpers for turning AI-generated chroma-key sprite sheets into clean RGBA figures.

The generators do not respect the grid they are asked for: rows use different column orders,
cells are unevenly spaced, some sheets have baked-in grid lines and the green key is also used
for clothing. Everything here works on the pixels rather than on assumed cell coordinates.
"""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from PIL import Image
from scipy import ndimage


def load_rgb(path: str) -> np.ndarray:
    return np.asarray(Image.open(path).convert("RGB")).astype(np.int16)


def magenta_mask(rgb: np.ndarray) -> np.ndarray:
    """True where a pixel is chroma magenta (#FF00FF) background or its JPEG halo."""
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    lo = np.minimum(r, b)
    pure = (lo > 90) & (g < lo * 0.45)
    near = (lo > 50) & (g < lo * 0.6)
    return ndimage.binary_propagation(pure, mask=pure | near)


def background_mask(rgb: np.ndarray) -> np.ndarray:
    """True where a pixel is chroma green (background, grid lines or JPEG halo).

    Key green is a pure hue (red and blue near zero). Clothing greens such as Jian-Yang's
    jacket or a glass tint carry real blue/red, so they fail the ratio test and survive.
    """
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    pure = (g > 90) & (r < g * 0.45) & (b < g * 0.38)
    # Dark desaturated green grid lines and JPEG ringing that sit next to the key colour.
    near = (g > 50) & (r < g * 0.6) & (b < g * 0.5)
    grown = ndimage.binary_propagation(pure, mask=pure | near)
    return grown


def _bands(indices: np.ndarray) -> list[tuple[int, int]]:
    """Group sorted indices into contiguous inclusive [start, end] bands."""
    bands: list[tuple[int, int]] = []
    for i in indices.tolist():
        if bands and i == bands[-1][1] + 1:
            bands[-1] = (bands[-1][0], i)
        else:
            bands.append((i, i))
    return bands


def repair_gridlines(rgb: np.ndarray, bg: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """Remove baked-in cell borders, including where they were drawn across a figure.

    Returns (rgb, bg) with line pixels either keyed out or, when a figure continues on both
    sides of the line, filled from the neighbouring figure pixels so the figure is not cut.
    """
    rgb = rgb.copy()
    bg = bg.copy()
    dark = rgb.sum(axis=2) < 150
    line_like = dark | bg
    h, w = bg.shape

    def fix(axis: int) -> None:
        # Lines span (nearly) the whole sheet and are dark or key-coloured along their length,
        # with a large share that is not bright key green (which is just empty background).
        bright_key = (rgb[..., 1] > 200) & bg
        coverage = line_like.mean(axis=axis)
        solid = (line_like & ~bright_key).mean(axis=axis)
        indices = np.nonzero((coverage > 0.9) & (solid > 0.35))[0]
        for start, end in _bands(indices):
            if end - start > 8:
                continue  # Too thick to be a border.
            before, after = start - 1, end + 1
            if before < 0 or after >= (w if axis == 0 else h):
                if axis == 0:
                    bg[:, start:end + 1] = True
                else:
                    bg[start:end + 1, :] = True
                continue
            if axis == 1:  # horizontal line: compare pixels above and below
                keep = ~bg[before, :] & ~bg[after, :]
                mid = (start + end) // 2
                for y in range(start, end + 1):
                    src = before if y <= mid else after
                    rgb[y, keep] = rgb[src, keep]
                    bg[y, keep] = False
                    bg[y, ~keep] = True
            else:  # vertical line
                keep = ~bg[:, before] & ~bg[:, after]
                mid = (start + end) // 2
                for x in range(start, end + 1):
                    src = before if x <= mid else after
                    rgb[keep, x] = rgb[keep, src]
                    bg[keep, x] = False
                    bg[~keep, x] = True

    fix(axis=1)
    fix(axis=0)
    return rgb, bg


@dataclass
class Figure:
    x0: int
    y0: int
    x1: int
    y1: int
    rgba: np.ndarray  # cropped RGBA uint8

    @property
    def cx(self) -> float:
        return (self.x0 + self.x1) / 2

    @property
    def cy(self) -> float:
        return (self.y0 + self.y1) / 2

    @property
    def height(self) -> int:
        return self.y1 - self.y0


def extract_figures(path: str, min_height_frac: float = 0.06, merge_px: int = 6) -> tuple[list[Figure], tuple[int, int]]:
    rgb = load_rgb(path)
    h, w, _ = rgb.shape
    bg = background_mask(rgb)
    rgb, bg = repair_gridlines(rgb, bg)
    fg = ~bg
    # Remove thin line remnants (1-3px wide) left from grid borders.
    fg = ndimage.binary_opening(fg, structure=np.ones((3, 3)))

    merged = ndimage.binary_dilation(fg, structure=np.ones((merge_px, merge_px)))
    labels, count = ndimage.label(merged)
    figures: list[Figure] = []
    min_h = h * min_height_frac
    for idx, sl in enumerate(ndimage.find_objects(labels), start=1):
        if sl is None:
            continue
        ys, xs = sl
        if ys.stop - ys.start < min_h:
            continue
        region = (labels[sl] == idx) & fg[sl]
        bbox_area = (ys.stop - ys.start) * (xs.stop - xs.start)
        if region.sum() < 400 or (xs.stop - xs.start) < h * 0.02 or region.sum() < bbox_area * 0.15:
            continue
        # Tighten to the real (undilated) pixels.
        ry, rx = np.nonzero(region)
        y0, y1 = ys.start + ry.min(), ys.start + ry.max() + 1
        x0, x1 = xs.start + rx.min(), xs.start + rx.max() + 1
        sub_mask = region[ry.min():ry.max() + 1, rx.min():rx.max() + 1]
        sub_rgb = rgb[y0:y1, x0:x1].clip(0, 255).astype(np.uint8)
        rgba = np.dstack([sub_rgb, (sub_mask * 255).astype(np.uint8)])
        figures.append(Figure(x0, y0, x1, y1, despill(rgba)))
    return figures, (w, h)


def despill(rgba: np.ndarray) -> np.ndarray:
    """Pull residual key green out of pixels that border the background."""
    out = rgba.copy()
    alpha = out[..., 3] > 0
    edge = alpha & ndimage.binary_dilation(~alpha, iterations=2)
    r = out[..., 0].astype(np.int16)
    g = out[..., 1].astype(np.int16)
    b = out[..., 2].astype(np.int16)
    spill = edge & (g > np.maximum(r, b))
    out[..., 1] = np.where(spill, np.maximum(r, b), g).astype(np.uint8)
    return out


def group_rows(figures: list[Figure], tolerance_frac: float = 0.5) -> list[list[Figure]]:
    """Cluster figures into rows by vertical centre, each row sorted left to right."""
    figs = sorted(figures, key=lambda f: f.cy)
    rows: list[list[Figure]] = []
    for f in figs:
        if rows:
            last = rows[-1]
            mean_cy = sum(x.cy for x in last) / len(last)
            mean_h = sum(x.height for x in last) / len(last)
            if abs(f.cy - mean_cy) < mean_h * tolerance_frac:
                last.append(f)
                continue
        rows.append([f])
    return [split_wide(sorted(r, key=lambda f: f.cx)) for r in rows]


def split_wide(row: list[Figure], factor: float = 1.45) -> list[Figure]:
    """Split blobs where neighbouring figures touch (e.g. a stride foot meeting the next figure).

    A blob much wider than the row's typical figure is cut at its emptiest column.
    """
    widths = sorted(f.x1 - f.x0 for f in row)
    typical = widths[len(widths) // 2]
    out: list[Figure] = []
    for f in row:
        w = f.x1 - f.x0
        if w <= typical * factor:
            out.append(f)
            continue
        alpha = f.rgba[..., 3] > 0
        occupancy = alpha.sum(axis=0)
        lo, hi = int(w * 0.25), int(w * 0.75)
        cut = lo + int(np.argmin(occupancy[lo:hi]))
        for part_x0, part_x1 in ((0, cut), (cut, w)):
            sub = f.rgba[:, part_x0:part_x1]
            ys, xs = np.nonzero(sub[..., 3])
            if len(xs) == 0:
                continue
            tight = sub[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
            out.append(Figure(f.x0 + part_x0 + xs.min(), f.y0 + ys.min(), f.x0 + part_x0 + xs.max() + 1, f.y0 + ys.max() + 1, tight))
    return sorted(out, key=lambda f: f.cx)


def extract_fixed_row(path: str, count: int) -> list[Figure]:
    """Split a single-row sheet with a known number of evenly spaced figures.

    Generated figures often touch their neighbours (a stride foot meets the next figure), so
    instead of connected components the row is cut at the emptiest column near each expected
    boundary.
    """
    rgb = load_rgb(path)
    h, w, _ = rgb.shape
    fg = ~background_mask(rgb)
    fg = ndimage.binary_opening(fg, structure=np.ones((3, 3)))
    occupancy = fg.sum(axis=0).astype(np.float32)
    cuts = [0]
    window = w // (count * 3)
    for i in range(1, count):
        expected = i * w // count
        lo, hi = max(1, expected - window), min(w - 1, expected + window)
        cuts.append(lo + int(np.argmin(occupancy[lo:hi])))
    cuts.append(w)

    figures: list[Figure] = []
    for x0, x1 in zip(cuts[:-1], cuts[1:]):
        region = fg[:, x0:x1]
        labels, n = ndimage.label(ndimage.binary_dilation(region, structure=np.ones((5, 5))))
        if n == 0:
            continue
        # Keep the largest blob (the figure) and anything overlapping it; drop stray specks.
        sizes = ndimage.sum(region, labels, index=range(1, n + 1))
        keep = labels == (int(np.argmax(sizes)) + 1)
        mask = region & keep
        ys, xs = np.nonzero(mask)
        if len(xs) == 0:
            continue
        fy0, fy1, fx0, fx1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        sub = mask[fy0:fy1, fx0:fx1]
        crop = rgb[fy0:fy1, x0 + fx0:x0 + fx1].clip(0, 255).astype(np.uint8)
        rgba = np.dstack([crop, (sub * 255).astype(np.uint8)])
        figures.append(Figure(x0 + fx0, fy0, x0 + fx1, fy1, despill(rgba)))
    return figures
