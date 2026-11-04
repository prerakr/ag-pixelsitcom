/**
 * Maps world coordinates (x east, y south, z up, in world pixels) to the view plane the camera
 * and renderer work in. The simulation always runs in world coordinates; only presentation
 * goes through a projection.
 */
export interface ViewProjection {
  readonly kind: 'topdown' | 'iso';
  toViewX(x: number, y: number): number;
  toViewY(x: number, y: number, z?: number): number;
  /** Inverse for points on the floor (z = 0). */
  toWorldX(vx: number, vy: number): number;
  toWorldY(vx: number, vy: number): number;
  /** View-space rectangle covering a world of this size, including anything standing on it. */
  bounds(worldW: number, worldH: number): { x0: number; y0: number; x1: number; y1: number };
}

export const TOPDOWN: ViewProjection = {
  kind: 'topdown',
  toViewX: (x) => x,
  toViewY: (_x, y) => y,
  toWorldX: (vx) => vx,
  toWorldY: (_vx, vy) => vy,
  bounds: (worldW, worldH) => ({ x0: 0, y0: 0, x1: worldW, y1: worldH }),
};

/** Height of the isometric back walls (world px); the view extends this far above the floor. */
export const ISO_HEADROOM = 96;

/**
 * 2:1 isometric (dimetric) projection: one world pixel east moves one view pixel right and half
 * down, one south moves one left and half down, and height moves straight up at full scale.
 * A 1 m tile is a 64x32 diamond. The same formula is used by scripts/sprites/isoraster.py.
 */
export const ISO: ViewProjection = {
  kind: 'iso',
  toViewX: (x, y) => x - y,
  toViewY: (x, y, z = 0) => (x + y) / 2 - z,
  toWorldX: (vx, vy) => vy + vx / 2,
  toWorldY: (vx, vy) => vy - vx / 2,
  bounds: (worldW, worldH) => ({ x0: -worldH, y0: -ISO_HEADROOM, x1: worldW, y1: (worldW + worldH) / 2 }),
};

/** Canvas transform that draws world-space floor graphics (puddles, light pools) in iso view. */
export function applyIsoFloorTransform(ctx: CanvasRenderingContext2D): void {
  ctx.transform(1, 0.5, -1, 0.5, 0, 0);
}
