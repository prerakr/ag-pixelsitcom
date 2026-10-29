"""Heuristics that label AI-generated figures as front / back / side and detect side facing.

Every row of every sheet was generated with a different column order, so labels are derived
from the pixels. Results are always printed and can be overridden per character in the
sheet config when a heuristic gets one wrong.

All tests look at the head only: props (briefcases), arm swing and stride make bodies
asymmetric, but a head is symmetric from the front and back and clearly one-sided in profile.
"""
from __future__ import annotations

import numpy as np

from sheetlib import Figure


def _mask(fig: Figure) -> np.ndarray:
    return fig.rgba[..., 3] > 0


def head_rows(fig: Figure) -> int:
    """Height of the head: down to the narrowest row (the neck) in the upper 45% of the figure."""
    return neck_row(_mask(fig))


def neck_row(m: np.ndarray) -> int:
    """Row of the neck in a silhouette mask (narrowest row between 15% and 45% of the height)."""
    h = m.shape[0]
    widths = m.sum(axis=1)
    lo, hi = int(h * 0.15), int(h * 0.45)
    neck = lo + int(np.argmin(widths[lo:hi]))
    return max(8, neck)


def torso_width_ratio(fig: Figure) -> float:
    """Build metric: median silhouette width across the upper torso (arms included) / height.

    Comparable between figures of different resolutions, so it measures how heavy-set a
    character is drawn independent of the sheet's pixel size.
    """
    m = _mask(fig)
    h = m.shape[0]
    neck = neck_row(m)
    body = h - neck
    rows = m[neck + int(body * 0.10): neck + int(body * 0.40)]
    widths = []
    for row in rows:
        xs = np.nonzero(row)[0]
        if len(xs):
            widths.append(xs.max() - xs.min() + 1)
    return float(np.median(widths)) / h if widths else 0.0


def head(fig: Figure) -> tuple[np.ndarray, np.ndarray]:
    """(mask, rgb) of the head cropped to its horizontal extent."""
    hr = head_rows(fig)
    m = _mask(fig)[:hr]
    xs = np.nonzero(m.any(axis=0))[0]
    x0, x1 = xs.min(), xs.max() + 1
    return m[:, x0:x1], fig.rgba[:hr, x0:x1, :3].astype(np.float32)


def head_symmetry(fig: Figure) -> float:
    """Colour-aware mirror similarity of the head (1 = perfectly symmetric)."""
    m, rgb = head(fig)
    mm, mrgb = m[:, ::-1], rgb[:, ::-1]
    both = m & mm
    union = (m | mm).sum()
    if union == 0:
        return 1.0
    shape = both.sum() / union
    diff = np.abs(rgb - mrgb).sum(axis=2)[both]
    colour = 1.0 - min(1.0, float(diff.mean()) / 180.0) if len(diff) else 0.0
    return float(shape * colour)


def face_zone(fig: Figure) -> np.ndarray:
    """Mean colour of the lower-middle of the head (face on a front view, hair on a back view)."""
    m, rgb = head(fig)
    hh, hw = m.shape
    zone = (slice(int(hh * 0.5), int(hh * 0.85)), slice(int(hw * 0.3), int(hw * 0.7)))
    sel = m[zone]
    if sel.sum() == 0:
        return np.zeros(3, dtype=np.float32)
    return rgb[zone][sel].mean(axis=0)


def estimate_skin(front: Figure) -> np.ndarray:
    m, rgb = head(front)
    hh, hw = m.shape
    zone = (slice(int(hh * 0.5), int(hh * 0.85)), slice(int(hw * 0.35), int(hw * 0.65)))
    return np.median(rgb[zone][m[zone]].reshape(-1, 3), axis=0)


def facing_score(fig: Figure, skin: np.ndarray, tol: float = 48.0) -> float:
    """Positive when the figure faces right, negative when it faces left.

    In profile the face sits at the front of the head and the hair at the back, so the skin
    centroid of the head is offset toward the facing direction.
    """
    m, rgb = head(fig)
    sk = (np.sqrt(((rgb - skin) ** 2).sum(axis=2)) < tol) & m
    if sk.sum() < 4:
        return 0.0
    _, hx = np.nonzero(m)
    _, sx = np.nonzero(sk)
    return float((sx.mean() - hx.mean()) / max(1, m.shape[1]))


def classify_row(row: list[Figure]) -> tuple[list[str], list[dict]]:
    """Return a role per figure ('down' | 'up' | 'side') plus debug metrics.

    Column 0 is always a front view in these sheets: it seeds the skin colour and is the
    reference for telling front from back.
    """
    ref_face = face_zone(row[0])
    skin = estimate_skin(row[0])
    metrics = []
    roles = []
    for fig in row:
        sym = head_symmetry(fig)
        face_diff = float(np.abs(face_zone(fig) - ref_face).sum())
        if sym < 0.35:
            role = "side"
        elif face_diff < 65:
            role = "down"
        else:
            role = "up"
        roles.append(role)
        metrics.append({"sym": round(sym, 2), "face_diff": round(face_diff), "facing": round(facing_score(fig, skin), 3)})
    return roles, metrics
