import { PropInstance, PropType, SettingDefinition } from '../types/environment';
import { ISO_PROP_CATALOG } from '../data/sprites/generated/isoAtlas';

/** A character's feet sit this far below its position (CharacterRenderer's ground line). */
export const FOOT_OFFSET_PX = 14;

export interface PathPoint {
  x: number;
  y: number;
}

/** Props that never block walking: floor coverings, wall decor, seats and tabletop items. */
const NON_BLOCKING: ReadonlySet<PropType> = new Set<PropType>([
  'rug',
  'chair_office',
  'chair_conference',
  'pc_monitor',
  'dundie_trophy',
  'jello_stapler',
  'coffee_maker',
  'microwave',
  'neon_sign',
  'framed_art',
  'swords_crossed',
  'dartboard',
  'whiteboard',
  'french_horn',
  'fire_hazard',
]);

/**
 * Tall props drawn in 3/4 view: most of the sprite is the front face rising above the floor,
 * so only the lower part of its rectangle is floor contact. Everything else (desks, tables,
 * sofas, counters) is seen mostly from above and blocks nearly its whole rectangle.
 */
const UPRIGHT: ReadonlySet<PropType> = new Set<PropType>([
  'water_cooler',
  'vending_machine',
  'potted_plant',
  'filing_cabinet',
  'photocopier',
  'server_rack',
  'jukebox',
  'liquor_shelf',
  'pub_fireplace',
  'umbrella_stand',
  'trash_can',
]);
const UPRIGHT_FLOOR_SHARE = 0.45;
const FLAT_FLOOR_SHARE = 0.85;
/** Trimmed off each side of a footprint so sprite padding doesn't close narrow aisles (tiles). */
const FOOTPRINT_INSET = 0.12;

/** Sample spacing for line-of-sight checks while smoothing, as a fraction of a cell. */
const LOS_STEP = 0.25;
/** Extra clearance kept around the walker's feet on smoothed legs (px). */
const LOS_RADIUS = 3;

function blocksTile(type: string | undefined): boolean {
  // Doors are walkable; anything outside the authored grid counts as wall.
  return type === undefined || type.startsWith('wall_') || type.startsWith('window_');
}

/** Floor rectangle a prop occupies, in tile units, or null when it can be walked through. */
export function propFootprint(prop: PropInstance): { x0: number; y0: number; x1: number; y1: number } | null {
  if (NON_BLOCKING.has(prop.type)) return null;
  const w = prop.width || 1;
  const h = prop.height || 1;
  const iso = ISO_PROP_CATALOG[prop.type];
  if (iso) {
    // Isometric props are modelled at real size, so their rectangle is their floor contact.
    if (iso.kind !== 'floor') return null;
    return { x0: prop.x + FOOTPRINT_INSET, x1: prop.x + w - FOOTPRINT_INSET, y0: prop.y + FOOTPRINT_INSET, y1: prop.y + h - FOOTPRINT_INSET };
  }
  const share = UPRIGHT.has(prop.type) ? UPRIGHT_FLOOR_SHARE : FLAT_FLOOR_SHARE;
  const depth = Math.max(Math.min(h, 0.5), h * share);
  return {
    x0: prop.x + FOOTPRINT_INSET,
    x1: prop.x + w - FOOTPRINT_INSET,
    y0: prop.y + h - depth,
    y1: prop.y + h - FOOTPRINT_INSET * 0.5,
  };
}

/** Binary min-heap of cell indices keyed by a shared score array. */
class CellHeap {
  private items: number[] = [];
  constructor(private score: Float64Array) {}
  get size(): number {
    return this.items.length;
  }
  push(cell: number): void {
    const a = this.items;
    a.push(cell);
    let i = a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.score[a[p]] <= this.score[a[i]]) break;
      [a[p], a[i]] = [a[i], a[p]];
      i = p;
    }
  }
  pop(): number {
    const a = this.items;
    const top = a[0];
    const last = a.pop()!;
    if (a.length > 0) {
      a[0] = last;
      let i = 0;
      for (;;) {
        const l = i * 2 + 1;
        const r = l + 1;
        let m = i;
        if (l < a.length && this.score[a[l]] < this.score[a[m]]) m = l;
        if (r < a.length && this.score[a[r]] < this.score[a[m]]) m = r;
        if (m === i) break;
        [a[m], a[i]] = [a[i], a[m]];
        i = m;
      }
    }
    return top;
  }
}

/**
 * Walkability grid for a set, at half-tile resolution, plus A* routing over it.
 *
 * Positions passed in and returned are character positions; walkability is tested at the
 * character's feet (FOOT_OFFSET_PX below the position), which is what touches the floor.
 */
export class NavGrid {
  readonly cellSize: number;
  readonly cols: number;
  readonly rows: number;
  private readonly blocked: Uint8Array;

  private constructor(cellSize: number, cols: number, rows: number, blocked: Uint8Array) {
    this.cellSize = cellSize;
    this.cols = cols;
    this.rows = rows;
    this.blocked = blocked;
  }

  static fromSetting(setting: SettingDefinition): NavGrid {
    const T = setting.tileSize;
    const cell = T / 2;
    const cols = setting.gridWidth * 2;
    const rows = setting.gridHeight * 2;
    const blocked = new Uint8Array(cols * rows);

    for (let cy = 0; cy < rows; cy++) {
      for (let cx = 0; cx < cols; cx++) {
        const tile = setting.tiles[`${cx >> 1},${cy >> 1}`];
        // Missing keys inside the grid default to floor, as TileMapBaker draws them.
        if (tile !== undefined && blocksTile(tile)) blocked[cy * cols + cx] = 1;
      }
    }

    for (const prop of setting.props) {
      const fp = propFootprint(prop);
      if (!fp) continue;
      // A cell is blocked when its centre falls inside the footprint.
      const cx0 = Math.max(0, Math.ceil(fp.x0 * 2 - 0.5));
      const cx1 = Math.min(cols - 1, Math.floor(fp.x1 * 2 - 0.5));
      const cy0 = Math.max(0, Math.ceil(fp.y0 * 2 - 0.5));
      const cy1 = Math.min(rows - 1, Math.floor(fp.y1 * 2 - 0.5));
      for (let cy = cy0; cy <= cy1; cy++) {
        for (let cx = cx0; cx <= cx1; cx++) blocked[cy * cols + cx] = 1;
      }
    }

    return new NavGrid(cell, cols, rows, blocked);
  }

  private cellAtFoot(fx: number, fy: number): number {
    const cx = Math.floor(fx / this.cellSize);
    const cy = Math.floor(fy / this.cellSize);
    if (cx < 0 || cy < 0 || cx >= this.cols || cy >= this.rows) return -1;
    return cy * this.cols + cx;
  }

  private footWalkable(fx: number, fy: number): boolean {
    const c = this.cellAtFoot(fx, fy);
    return c >= 0 && this.blocked[c] === 0;
  }

  /** Whether a character standing at this position has its feet on walkable floor. */
  isWalkable(x: number, y: number): boolean {
    return this.footWalkable(x, y + FOOT_OFFSET_PX);
  }

  isCellBlocked(cx: number, cy: number): boolean {
    if (cx < 0 || cy < 0 || cx >= this.cols || cy >= this.rows) return true;
    return this.blocked[cy * this.cols + cx] === 1;
  }

  /** Nearest walkable cell to `cell`, searching outward ring by ring; -1 if the grid is solid. */
  private nearestOpen(cell: number, fx: number, fy: number): number {
    if (cell >= 0 && this.blocked[cell] === 0) return cell;
    const cx = Math.min(this.cols - 1, Math.max(0, Math.floor(fx / this.cellSize)));
    const cy = Math.min(this.rows - 1, Math.max(0, Math.floor(fy / this.cellSize)));
    const maxR = Math.max(this.cols, this.rows);
    for (let r = 1; r < maxR; r++) {
      let best = -1;
      let bestD = Infinity;
      for (let y = cy - r; y <= cy + r; y++) {
        for (let x = cx - r; x <= cx + r; x++) {
          if (Math.max(Math.abs(x - cx), Math.abs(y - cy)) !== r || this.isCellBlocked(x, y)) continue;
          const d = Math.hypot((x + 0.5) * this.cellSize - fx, (y + 0.5) * this.cellSize - fy);
          if (d < bestD) {
            bestD = d;
            best = y * this.cols + x;
          }
        }
      }
      if (best >= 0) return best;
    }
    return -1;
  }

  private centre(cell: number): PathPoint {
    return {
      x: ((cell % this.cols) + 0.5) * this.cellSize,
      y: (Math.floor(cell / this.cols) + 0.5) * this.cellSize,
    };
  }

  /** True when a walker's feet can travel the straight segment without touching a blocked cell. */
  private lineOfSight(a: PathPoint, b: PathPoint): boolean {
    const dist = Math.hypot(b.x - a.x, b.y - a.y);
    const steps = Math.max(1, Math.ceil(dist / (this.cellSize * LOS_STEP)));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = a.x + (b.x - a.x) * t;
      const y = a.y + (b.y - a.y) * t;
      if (
        !this.footWalkable(x, y) ||
        !this.footWalkable(x - LOS_RADIUS, y) ||
        !this.footWalkable(x + LOS_RADIUS, y) ||
        !this.footWalkable(x, y - LOS_RADIUS) ||
        !this.footWalkable(x, y + LOS_RADIUS)
      ) {
        return false;
      }
    }
    return true;
  }

  private astar(start: number, goal: number): number[] | null {
    const n = this.cols * this.rows;
    const g = new Float64Array(n).fill(Infinity);
    const f = new Float64Array(n).fill(Infinity);
    const from = new Int32Array(n).fill(-1);
    const closed = new Uint8Array(n);
    const gx = goal % this.cols;
    const gy = Math.floor(goal / this.cols);
    const h = (c: number) => {
      const dx = Math.abs((c % this.cols) - gx);
      const dy = Math.abs(Math.floor(c / this.cols) - gy);
      return Math.max(dx, dy) + (Math.SQRT2 - 1) * Math.min(dx, dy);
    };

    const open = new CellHeap(f);
    g[start] = 0;
    f[start] = h(start);
    open.push(start);

    while (open.size > 0) {
      const cur = open.pop();
      if (cur === goal) {
        const path: number[] = [];
        for (let c = goal; c !== -1; c = from[c]) path.push(c);
        return path.reverse();
      }
      if (closed[cur]) continue;
      closed[cur] = 1;
      const x = cur % this.cols;
      const y = Math.floor(cur / this.cols);
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (this.isCellBlocked(nx, ny)) continue;
          // No cutting corners: a diagonal step needs both orthogonal neighbours open.
          if (dx !== 0 && dy !== 0 && (this.isCellBlocked(x + dx, y) || this.isCellBlocked(x, y + dy))) continue;
          const next = ny * this.cols + nx;
          if (closed[next]) continue;
          const cost = g[cur] + (dx !== 0 && dy !== 0 ? Math.SQRT2 : 1);
          if (cost < g[next]) {
            g[next] = cost;
            f[next] = cost + h(next);
            from[next] = cur;
            open.push(next);
          }
        }
      }
    }
    return null;
  }

  /**
   * Route from one character position to another, as the points to walk through in order
   * (the start itself excluded, the exact destination last). Returns null when the two are
   * not connected, so the caller can fall back to a straight line.
   *
   * A start or destination inside furniture (sitting at a desk, a waypoint on a counter)
   * snaps to the nearest open floor; the short hop to or from the exact spot is walked
   * directly.
   */
  findPath(from: PathPoint, to: PathPoint): PathPoint[] | null {
    const a = { x: from.x, y: from.y + FOOT_OFFSET_PX };
    const b = { x: to.x, y: to.y + FOOT_OFFSET_PX };
    const rawStart = this.cellAtFoot(a.x, a.y);
    const rawGoal = this.cellAtFoot(b.x, b.y);
    const start = this.nearestOpen(rawStart, a.x, a.y);
    const goal = this.nearestOpen(rawGoal, b.x, b.y);
    if (start < 0 || goal < 0) return null;

    const cells = this.astar(start, goal);
    if (!cells) return null;

    const startOpen = start === rawStart;
    const goalOpen = goal === rawGoal;
    const nodes = cells.map((c) => this.centre(c));
    if (startOpen) nodes[0] = a;
    if (goalOpen) nodes[nodes.length - 1] = b;
    else if (nodes.length === 1) nodes.push(nodes[0]);

    // String-pull: from each anchor, jump to the furthest node still in straight sight.
    const smooth: PathPoint[] = [nodes[0]];
    let i = 0;
    while (i < nodes.length - 1) {
      let j = nodes.length - 1;
      while (j > i + 1 && !this.lineOfSight(nodes[i], nodes[j])) j--;
      smooth.push(nodes[j]);
      i = j;
    }
    if (!goalOpen) smooth.push(b);

    // Convert back to character positions; drop the start when the walker is already on it.
    const out = smooth.slice(startOpen ? 1 : 0).map((p) => ({ x: p.x, y: p.y - FOOT_OFFSET_PX }));
    // Collapse zero-length legs left by snapping.
    return out.filter((p, k) => {
      const prev = k === 0 ? from : out[k - 1];
      return k === out.length - 1 || Math.hypot(p.x - prev.x, p.y - prev.y) > 0.5;
    });
  }

  /** Length of walking `path` starting at `from`. */
  static pathLength(from: PathPoint, path: readonly PathPoint[]): number {
    let len = 0;
    let prev = from;
    for (const p of path) {
      len += Math.hypot(p.x - prev.x, p.y - prev.y);
      prev = p;
    }
    return len;
  }
}
