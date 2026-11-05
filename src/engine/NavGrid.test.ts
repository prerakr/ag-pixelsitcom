import { describe, expect, it } from 'vitest';
import { ALL_SETTINGS } from '../data/settings';
import { SettingDefinition, TileType, PropInstance } from '../types/environment';
import { FOOT_OFFSET_PX, NavGrid, PathPoint } from './NavGrid';

/** A walled box of floor, `w` x `h` tiles, with optional extra wall cells. */
function makeSetting(w: number, h: number, walls: [number, number][] = [], props: PropInstance[] = []): SettingDefinition {
  const tiles: Record<string, TileType> = {};
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const edge = x === 0 || y === 0 || x === w - 1 || y === h - 1;
      tiles[`${x},${y}`] = edge ? 'wall_office_side' : 'floor_carpet_grey';
    }
  }
  for (const [x, y] of walls) tiles[`${x},${y}`] = 'wall_office_side';
  return {
    id: 'test',
    name: 'Test',
    showTitle: 'Test',
    gridWidth: w,
    gridHeight: h,
    tileSize: 32,
    backgroundColor: '#000',
    tiles,
    props,
    waypoints: {},
    spawnPoints: {},
    defaultCamera: { x: 0, y: 0, zoom: 1 },
  };
}

/** Tile coordinates to the character position whose feet stand in that tile's centre. */
function at(tx: number, ty: number): PathPoint {
  return { x: (tx + 0.5) * 32, y: (ty + 0.5) * 32 - FOOT_OFFSET_PX };
}

/** Asserts every leg of a route keeps the walker's feet on open floor. */
function expectClearRoute(nav: NavGrid, from: PathPoint, route: PathPoint[], skipFirst: boolean, skipLast: boolean) {
  let prev = from;
  route.forEach((p, i) => {
    const snapLeg = (i === 0 && skipFirst) || (i === route.length - 1 && skipLast);
    if (!snapLeg) {
      const steps = Math.ceil(Math.hypot(p.x - prev.x, p.y - prev.y) / 2);
      for (let s = 0; s <= steps; s++) {
        const t = steps === 0 ? 0 : s / steps;
        const x = prev.x + (p.x - prev.x) * t;
        const y = prev.y + (p.y - prev.y) * t;
        expect(nav.isWalkable(x, y), `leg ${i} crosses a blocked cell at ${x.toFixed(1)},${y.toFixed(1)}`).toBe(true);
      }
    }
    prev = p;
  });
}

describe('NavGrid', () => {
  it('walks straight across open floor', () => {
    const nav = NavGrid.fromSetting(makeSetting(10, 10));
    const route = nav.findPath(at(2, 2), at(7, 7))!;
    expect(route).toHaveLength(1);
    expect(route[0]).toEqual(at(7, 7));
  });

  it('routes through the doorway of a dividing wall', () => {
    // Wall down column 5 with a gap at row 7.
    const walls: [number, number][] = [1, 2, 3, 4, 5, 6, 8].map((y) => [5, y]);
    const nav = NavGrid.fromSetting(makeSetting(11, 10, walls));
    const from = at(2, 2);
    const route = nav.findPath(from, at(8, 2))!;
    expect(route).not.toBeNull();
    expect(Math.max(...route.map((p) => p.y))).toBeGreaterThan(6 * 32);
    expect(route[route.length - 1]).toEqual(at(8, 2));
    expectClearRoute(nav, from, route, false, false);
  });

  it('walks around a desk instead of through it', () => {
    const desk: PropInstance = { id: 'desk', type: 'desk_wood', x: 3, y: 2, width: 3, height: 5 };
    const nav = NavGrid.fromSetting(makeSetting(10, 10, [], [desk]));
    expect(nav.isWalkable(at(4, 4).x, at(4, 4).y)).toBe(false);
    const from = at(1, 4);
    const route = nav.findPath(from, at(7, 4))!;
    expect(route.length).toBeGreaterThan(1);
    expectClearRoute(nav, from, route, false, false);
  });

  it('ignores props that are walked over or sat in', () => {
    const rug: PropInstance = { id: 'rug', type: 'rug', x: 2, y: 2, width: 5, height: 5 };
    const chair: PropInstance = { id: 'chair', type: 'chair_office', x: 4, y: 4, width: 1, height: 1 };
    const nav = NavGrid.fromSetting(makeSetting(10, 10, [], [rug, chair]));
    expect(nav.isWalkable(at(4, 4).x, at(4, 4).y)).toBe(true);
  });

  it('leaves and enters furniture by the nearest open floor', () => {
    const desk: PropInstance = { id: 'desk', type: 'desk_wood', x: 3, y: 3, width: 2, height: 2 };
    const nav = NavGrid.fromSetting(makeSetting(10, 10, [], [desk]));
    const seat = at(3.5, 3.5);
    expect(nav.isWalkable(seat.x, seat.y)).toBe(false);
    const route = nav.findPath(seat, at(8, 8))!;
    expect(route).not.toBeNull();
    expect(nav.isWalkable(route[0].x, route[0].y)).toBe(true);
    expect(route[route.length - 1]).toEqual(at(8, 8));
  });

  it('returns null when the destination is sealed off', () => {
    const walls: [number, number][] = [];
    for (let y = 1; y < 9; y++) walls.push([5, y]);
    const nav = NavGrid.fromSetting(makeSetting(11, 10, walls));
    expect(nav.findPath(at(2, 2), at(8, 2))).toBeNull();
  });

  for (const setting of Object.values(ALL_SETTINGS)) {
    it(`reaches every waypoint and spawn point in ${setting.id}`, () => {
      const nav = NavGrid.fromSetting(setting);
      const T = setting.tileSize;
      const spots = [...Object.values(setting.waypoints), ...Object.values(setting.spawnPoints)];
      const origin = { x: spots[0].x * T, y: spots[0].y * T };
      const unreachable = spots.filter((w) => nav.findPath(origin, { x: w.x * T, y: w.y * T }) === null).map((w) => w.id);
      expect(unreachable).toEqual([]);
    });

    it(`keeps every route in ${setting.id} on open floor`, () => {
      const nav = NavGrid.fromSetting(setting);
      const T = setting.tileSize;
      const spots = Object.values(setting.waypoints).map((w) => ({ x: w.x * T, y: w.y * T }));
      for (let i = 0; i < spots.length; i++) {
        const from = spots[i];
        const to = spots[(i * 7 + 3) % spots.length];
        const route = nav.findPath(from, to)!;
        expectClearRoute(nav, from, route, !nav.isWalkable(from.x, from.y), !nav.isWalkable(to.x, to.y));
      }
    });
  }
});
