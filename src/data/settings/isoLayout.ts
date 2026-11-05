import { Direction } from '../../types/script';
import { PropInstance, PropType, TileType, Waypoint } from '../../types/environment';
import { ISO_PROP_CATALOG } from '../sprites/generated/isoAtlas';

/** A character's feet sit this far below its position, in tiles (NavGrid.FOOT_OFFSET_PX / 32). */
const FOOT = 14 / 32;
const GAP = 0.05;

/** A catalogue prop with its footprint at tile (x, y), sized from its real dimensions for `facing`. */
export function isoProp(
  id: string,
  type: PropType,
  x: number,
  y: number,
  facing: Direction = 'down',
  extra: Partial<PropInstance> = {}
): PropInstance {
  const cat = ISO_PROP_CATALOG[type];
  const turned = facing === 'left' || facing === 'right';
  return {
    id,
    type,
    x,
    y,
    width: cat ? (turned ? cat.depth : cat.width) : 1,
    height: cat ? (turned ? cat.width : cat.depth) : 1,
    facing,
    ...extra,
  };
}

/**
 * A desk (or table) used by someone facing `facing`, its chair pulled up on the user's side at
 * the knee space, and the seat as a point (character position, tiles). `knee` is where the
 * knee space is across the desk's width (0..1, in its own left-to-right frame).
 */
export function deskWithChair(
  deskId: string,
  deskType: PropType,
  chairId: string,
  chairType: PropType,
  x: number,
  y: number,
  facing: Direction,
  knee = 0.5
): { props: PropInstance[]; seat: { x: number; y: number } } {
  const desk = isoProp(deskId, deskType, x, y, facing);
  const cat = ISO_PROP_CATALOG[deskType];
  const c = ISO_PROP_CATALOG[chairType]?.width ?? 0.6;
  const W = cat?.width ?? 1;
  const D = cat?.depth ?? 1;
  const k = W * knee;
  const r = GAP + c / 2;
  const centre =
    facing === 'down' ? { x: x + k, y: y - r }
    : facing === 'up' ? { x: x + W - k, y: y + D + r }
    : facing === 'right' ? { x: x - r, y: y + W - k }
    : { x: x + D + r, y: y + k };
  const chair = isoProp(chairId, chairType, round8(centre.x - c / 2), round8(centre.y - c / 2), facing);
  return { props: [desk, chair], seat: { x: round8(centre.x), y: round8(centre.y - FOOT) } };
}

/** Snap to 1/16 tile so props land on whole view pixels (x + y must stay even in world px). */
function round8(v: number): number {
  return Math.round(v * 16) / 16;
}

export function waypoint(id: string, name: string, at: { x: number; y: number }, facing: Direction, zone?: string): Waypoint {
  return { id, name, x: at.x, y: at.y, facing, ...(zone ? { zone } : {}) };
}

/**
 * Tile grid for an isometric set: an outer ring of `wall`, `floor` inside, then the caller's
 * overrides painted on top (rooms, partitions, doors, windows).
 */
export function isoTiles(
  w: number,
  h: number,
  wall: TileType,
  floor: TileType,
  paint: (set: (x: number, y: number, t: TileType) => void, fill: (x0: number, y0: number, x1: number, y1: number, t: TileType) => void) => void
): Record<string, TileType> {
  const tiles: Record<string, TileType> = {};
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      tiles[`${x},${y}`] = x === 0 || y === 0 || x === w - 1 || y === h - 1 ? wall : floor;
    }
  }
  const set = (x: number, y: number, t: TileType) => {
    tiles[`${x},${y}`] = t;
  };
  const fill = (x0: number, y0: number, x1: number, y1: number, t: TileType) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, t);
  };
  paint(set, fill);
  return tiles;
}
