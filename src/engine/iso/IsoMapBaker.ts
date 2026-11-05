import { SettingDefinition } from '../../types/environment';
import { IsoCap, IsoThemeAtlas, TileThemeAtlas } from '../../types/sprite';
import { ISO_PROP_CATALOG } from '../../data/sprites/generated/isoAtlas';
import { ISO } from './IsoProjection';

const T = 32;
const DEFAULT_FLOOR = 'floor_carpet_grey';
const FALLBACK_FLOOR: [number, number, number] = [138, 90, 51];
/** Height of the cut-away front walls (south and east), world px. */
const STUB_H = 12;
/** Interior opaque walls are cut down to this height so the rooms behind them stay visible. */
const CUT_H = 30;
/** Glass doors in interior partitions leave this much clear opening under their header. */
const DOOR_H = 74;

export interface IsoBake {
  /** Floor, back walls and wall decor: everything behind the actors. */
  back: HTMLCanvasElement;
  /** Cut-away front walls, drawn over the actors. */
  front: HTMLCanvasElement;
  /** View coordinates of both canvases' top-left pixel. */
  originX: number;
  originY: number;
  /** Interior wall runs, each depth-sorted with the props by its footprint. */
  pieces: IsoWallPiece[];
}

export interface IsoWallPiece {
  canvas: HTMLCanvasElement;
  originX: number;
  originY: number;
  /** Footprint in tiles. */
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/**
 * A wall solid. 'h' slabs run east-west and show their +y face (lit like a north wall); 'v' slabs
 * run north-south and show their +x face. `line` is the tile row ('h') or column ('v') whose tile
 * types texture it.
 */
interface Slab {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  z0: number;
  h: number;
  axis: 'h' | 'v';
  line: number;
}

function isWallLike(type: string): boolean {
  return type === '' || type.startsWith('wall_') || type.startsWith('door_') || type.startsWith('window_');
}

function isGlass(type: string): boolean {
  return type === 'wall_glass' || type === 'door_glass' || type === 'window_blinds';
}

function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Ray-box result scratch (no per-pixel allocation). A view pixel's ray is P(t) = (X0+t, Y0+t, t).
let hitT = 0;
let hitFace = 0; // 0: +x face, 1: +y face, 2: top

function castBox(s: Slab, X0: number, Y0: number): boolean {
  const tx1 = s.x1 - X0;
  const ty1 = s.y1 - Y0;
  const tmin = Math.max(s.x0 - X0, s.y0 - Y0, s.z0);
  const tmax = Math.min(tx1, ty1, s.h);
  if (tmin > tmax) return false;
  hitT = tmax;
  hitFace = tmax === tx1 ? 0 : tmax === ty1 ? 1 : 2;
  return true;
}

/** Nearest hit among `slabs`, left in hitT / hitFace; null on a miss. */
function castAll(slabs: Slab[], X0: number, Y0: number): Slab | null {
  let bestT = -1;
  let best: Slab | null = null;
  let bestFace = 0;
  for (let k = 0; k < slabs.length; k++) {
    if (castBox(slabs[k], X0, Y0) && hitT > bestT) {
      bestT = hitT;
      best = slabs[k];
      bestFace = hitFace;
    }
  }
  hitT = bestT;
  hitFace = bestFace;
  return best;
}

/**
 * Bakes an isometric set.
 *
 * - The floor: themed textures (the iso atlas's own floors, else the top-down tileset), rugs,
 *   contact shadows and window light, projected per pixel so planks and seams land on 2:1 steps.
 * - The outer ring of tiles is the shell: north and west walls at full height (or a tile type's
 *   own height, e.g. a hedge), south and east walls as low cut-away stubs on the front layer.
 * - Interior walls become pieces the stage depth-sorts with the props: glass partitions stand at
 *   full height and stay see-through (glass doors keep a header above the opening), opaque walls
 *   are cut down to CUT_H, and opaque doors are openings.
 * - Wall-hung props are drawn onto the back layer.
 */
export class IsoMapBaker {
  public static bake(
    setting: SettingDefinition,
    atlas: IsoThemeAtlas | null,
    atlasCanvas: HTMLCanvasElement | null,
    atlasPixels: ImageData | null,
    floorTheme: { canvas: HTMLCanvasElement; atlas: TileThemeAtlas } | null
  ): IsoBake {
    const gw = setting.gridWidth;
    const gh = setting.gridHeight;
    const W = gw * T;
    const H = gh * T;
    const wallH = atlas?.wallHeight ?? 96;
    const th = atlas?.wallThickness ?? 6;
    const tileAt = (tx: number, ty: number): string =>
      tx < 0 || ty < 0 || tx >= gw || ty >= gh ? '' : setting.tiles[`${tx},${ty}`] || DEFAULT_FLOOR;
    const perimeter = (tx: number, ty: number) => tx <= 0 || ty <= 0 || tx >= gw - 1 || ty >= gh - 1;
    const heightOf = (type: string) => atlas?.wallHeights?.[type] ?? wallH;

    const floorData = IsoMapBaker.bakeFloor(setting, W, H, tileAt, perimeter, atlas, atlasCanvas, floorTheme);

    // Shell: per-tile heights, grouped into runs of equal height. The far corner tile, where a
    // back wall meets a cut-away front wall, takes its neighbour's height.
    const back: Slab[] = [];
    const runs = (count: number, rawType: (i: number) => string, make: (i0: number, i1: number, h: number) => void) => {
      const typeAt = (i: number) => rawType(i === count - 1 ? count - 2 : i);
      let start = 0;
      for (let i = 1; i <= count; i++) {
        if (i === count || heightOf(typeAt(i)) !== heightOf(typeAt(start))) {
          make(start, i - 1, heightOf(typeAt(start)));
          start = i;
        }
      }
    };
    runs(gw, (i) => tileAt(i, 0), (i0, i1, h) =>
      back.push({ x0: Math.max(T - th, i0 * T), y0: T - th, x1: Math.min((gw - 1) * T + th, (i1 + 1) * T), y1: T, z0: 0, h, axis: 'h', line: 0 })
    );
    runs(gh, (i) => tileAt(0, i), (i0, i1, h) =>
      back.push({ x0: T - th, y0: Math.max(T - th, i0 * T), x1: T, y1: Math.min((gh - 1) * T + th, (i1 + 1) * T), z0: 0, h, axis: 'v', line: 0 })
    );
    const front: Slab[] = [
      { x0: T - th, y0: (gh - 1) * T, x1: (gw - 1) * T + th, y1: (gh - 1) * T + th, z0: 0, h: STUB_H, axis: 'h', line: gh - 1 },
      { x0: (gw - 1) * T, y0: T - th, x1: (gw - 1) * T + th, y1: (gh - 1) * T + th, z0: 0, h: STUB_H, axis: 'v', line: gw - 1 },
    ];

    const caps = (type: string): IsoCap => atlas?.capsByType?.[type] ?? atlas?.caps ?? { fill: '#2a1a12', light: '#4a3022', dark: '#140c08' };
    const capCache = new Map<string, [number, number, number][]>();
    const capColours = (type: string) => {
      let c = capCache.get(type);
      if (!c) {
        const cap = caps(type);
        c = [rgb(cap.fill), rgb(cap.light), rgb(cap.dark)];
        capCache.set(type, c);
      }
      return c;
    };
    const ap = atlasPixels;

    /** Writes the colour of the last hit on `s` into `out` at `o`. */
    const shade = (out: Uint8ClampedArray, o: number, s: Slab, X0: number, Y0: number, opaque: boolean) => {
      const px = X0 + hitT;
      const py = Y0 + hitT;
      const along = s.axis === 'h' ? px : py;
      const tile = Math.min(Math.max(0, Math.floor(along / T)), (s.axis === 'h' ? gw : gh) - 1);
      const type = s.axis === 'h' ? tileAt(tile, s.line) : tileAt(s.line, tile);
      const wf = atlas ? atlas.walls[type] || atlas.walls.wall_brick || atlas.walls[Object.keys(atlas.walls)[0]] : undefined;
      const roomFace = s.axis === 'h' ? 1 : 0;
      const texel = (row: number, col: number): number => {
        if (!wf || !ap) return -1;
        const strip = s.axis === 'h' ? wf.n : wf.w;
        const sx = strip.x + (tile % wf.variants) * T + col;
        return ((strip.y + row) * ap.width + sx) * 4;
      };
      let si = -1;
      let colour: [number, number, number] | null = null;
      if (hitFace === roomFace) {
        const local = Math.floor(along) - tile * T;
        // A west-facing slab is seen from the east: its south end is on the left of the screen.
        si = texel(Math.min(wallH - 1, Math.max(0, wallH - 1 - Math.floor(hitT))), s.axis === 'h' ? local : T - 1 - local);
      } else if (isGlass(type)) {
        si = texel(1, 4); // glass tops and ends take the frame colour
      } else if (hitFace === 2) {
        const [fill, light] = capColours(type);
        const edge = s.axis === 'h' ? s.y1 - py : s.x1 - px;
        colour = edge < 1.2 ? light : fill;
      } else {
        colour = capColours(type)[2];
      }
      if (colour) {
        out[o] = colour[0];
        out[o + 1] = colour[1];
        out[o + 2] = colour[2];
        out[o + 3] = 255;
      } else if (si >= 0 && ap) {
        const a = ap.data[si + 3];
        if (a === 0) return;
        out[o] = ap.data[si];
        out[o + 1] = ap.data[si + 1];
        out[o + 2] = ap.data[si + 2];
        out[o + 3] = opaque ? 255 : a;
      } else {
        out[o] = 150;
        out[o + 1] = 80;
        out[o + 2] = 60;
        out[o + 3] = 255;
      }
    };

    const b = ISO.bounds(W, H);
    const originX = Math.floor(b.x0) - 2;
    const originY = Math.floor(b.y0) - 2;
    const cw = Math.ceil(b.x1) + 2 - originX;
    const ch = Math.ceil(b.y1) + 2 - originY;
    const backCanvas = IsoMapBaker.canvas(cw, ch);
    const frontCanvas = IsoMapBaker.canvas(cw, ch);
    const bctx = backCanvas.getContext('2d')!;
    const fctx = frontCanvas.getContext('2d')!;
    const backImg = bctx.createImageData(cw, ch);
    const frontImg = fctx.createImageData(cw, ch);
    const bd = backImg.data;
    const fd = frontImg.data;

    for (let j = 0; j < ch; j++) {
      const vy = originY + j + 0.5;
      for (let i = 0; i < cw; i++) {
        const vx = originX + i + 0.5;
        const X0 = vy + vx / 2;
        const Y0 = vy - vx / 2;
        const o = (j * cw + i) * 4;
        const hit = castAll(back, X0, Y0);
        if (hit) {
          shade(bd, o, hit, X0, Y0, true);
        }
        if (bd[o + 3] === 0 && X0 >= 0 && Y0 >= 0 && X0 < W && Y0 < H && !perimeter(Math.floor(X0 / T), Math.floor(Y0 / T))) {
          const fi = (Math.floor(Y0) * W + Math.floor(X0)) * 4;
          bd[o] = floorData[fi];
          bd[o + 1] = floorData[fi + 1];
          bd[o + 2] = floorData[fi + 2];
          bd[o + 3] = 255;
        }
        const fhit = castAll(front, X0, Y0);
        if (fhit) shade(fd, o, fhit, X0, Y0, true);
      }
    }
    bctx.putImageData(backImg, 0, 0);
    fctx.putImageData(frontImg, 0, 0);

    // Wall-hung props, farthest first.
    if (atlas && atlasCanvas) {
      const decor = setting.props
        .filter((p) => ISO_PROP_CATALOG[p.type]?.kind === 'wall')
        .sort((p, q) => p.x + p.y - (q.x + q.y));
      for (const prop of decor) {
        const f = atlas.frames[`${prop.type}:${prop.facing || 'down'}`];
        if (!f) continue;
        const vx = Math.round(ISO.toViewX(prop.x * T, prop.y * T)) - f.ox - originX;
        const vy = Math.round(ISO.toViewY(prop.x * T, prop.y * T)) - f.oy - originY;
        bctx.drawImage(atlasCanvas, f.x, f.y, f.w, f.h, vx, vy, f.w, f.h);
      }
    }

    const pieces = IsoMapBaker.interiorSlabs(gw, gh, tileAt, perimeter, wallH, th).map((slabs) => {
      let x0 = Infinity;
      let y0 = Infinity;
      let x1 = -Infinity;
      let y1 = -Infinity;
      let vx0 = Infinity;
      let vy0 = Infinity;
      let vx1 = -Infinity;
      let vy1 = -Infinity;
      for (const s of slabs) {
        x0 = Math.min(x0, s.x0);
        y0 = Math.min(y0, s.y0);
        x1 = Math.max(x1, s.x1);
        y1 = Math.max(y1, s.y1);
        for (const [x, y] of [[s.x0, s.y0], [s.x1, s.y0], [s.x0, s.y1], [s.x1, s.y1]]) {
          vx0 = Math.min(vx0, ISO.toViewX(x, y));
          vx1 = Math.max(vx1, ISO.toViewX(x, y));
          vy0 = Math.min(vy0, ISO.toViewY(x, y, s.h));
          vy1 = Math.max(vy1, ISO.toViewY(x, y, s.z0));
        }
      }
      const ox = Math.floor(vx0) - 1;
      const oy = Math.floor(vy0) - 1;
      const pw = Math.ceil(vx1) + 1 - ox;
      const ph = Math.ceil(vy1) + 1 - oy;
      const canvas = IsoMapBaker.canvas(pw, ph);
      const pctx = canvas.getContext('2d')!;
      const img = pctx.createImageData(pw, ph);
      for (let j = 0; j < ph; j++) {
        const vy = oy + j + 0.5;
        for (let i = 0; i < pw; i++) {
          const vx = ox + i + 0.5;
          const X0 = vy + vx / 2;
          const Y0 = vy - vx / 2;
          const hit = castAll(slabs, X0, Y0);
          if (hit) shade(img.data, (j * pw + i) * 4, hit, X0, Y0, false);
        }
      }
      pctx.putImageData(img, 0, 0);
      return { canvas, originX: ox, originY: oy, x0: x0 / T, y0: y0 / T, x1: x1 / T, y1: y1 / T };
    });

    return { back: backCanvas, front: frontCanvas, originX, originY, pieces };
  }

  /**
   * Interior wall tiles as thin slabs along their wall's centre line, grouped into runs: one
   * piece per east-west or north-south run of the same kind (glass or opaque).
   */
  private static interiorSlabs(
    gw: number,
    gh: number,
    tileAt: (tx: number, ty: number) => string,
    perimeter: (tx: number, ty: number) => boolean,
    wallH: number,
    th: number
  ): Slab[][] {
    const wall = (tx: number, ty: number) => isWallLike(tileAt(tx, ty));
    const pieces: Slab[][] = [];
    const slabFor = (tx: number, ty: number, axis: 'h' | 'v'): Slab | null => {
      const type = tileAt(tx, ty);
      const glass = isGlass(type);
      const door = type.startsWith('door_');
      if (door && !glass) return null;
      const h = glass ? wallH : CUT_H;
      const z0 = door ? DOOR_H : 0;
      const cx = tx * T + T / 2;
      const cy = ty * T + T / 2;
      if (axis === 'h') {
        return {
          x0: wall(tx - 1, ty) ? tx * T : cx - th / 2,
          x1: wall(tx + 1, ty) ? (tx + 1) * T : cx + th / 2,
          y0: cy - th / 2,
          y1: cy + th / 2,
          z0,
          h,
          axis,
          line: ty,
        };
      }
      return {
        x0: cx - th / 2,
        x1: cx + th / 2,
        y0: wall(tx, ty - 1) ? ty * T : cy - th / 2,
        y1: wall(tx, ty + 1) ? (ty + 1) * T : cy + th / 2,
        z0,
        h,
        axis,
        line: tx,
      };
    };
    const orient = (tx: number, ty: number) => {
      const hasH = wall(tx - 1, ty) || wall(tx + 1, ty);
      const hasV = wall(tx, ty - 1) || wall(tx, ty + 1);
      return { h: hasH || !hasV, v: hasV };
    };
    const interior = (tx: number, ty: number) => !perimeter(tx, ty) && wall(tx, ty);
    const sweep = (outer: number, inner: number, at: (o: number, i: number) => [number, number], axis: 'h' | 'v') => {
      for (let o = 1; o < outer - 1; o++) {
        let run: Slab[] = [];
        let runGlass: boolean | null = null;
        const flush = () => {
          if (run.length) pieces.push(run);
          run = [];
          runGlass = null;
        };
        for (let i = 1; i < inner - 1; i++) {
          const [tx, ty] = at(o, i);
          if (!interior(tx, ty) || !orient(tx, ty)[axis]) {
            flush();
            continue;
          }
          const glass = isGlass(tileAt(tx, ty));
          if (runGlass !== null && glass !== runGlass) flush();
          const slab = slabFor(tx, ty, axis);
          if (!slab) {
            flush();
            continue;
          }
          runGlass = glass;
          run.push(slab);
        }
        flush();
      }
    };
    sweep(gh, gw, (o, i) => [i, o], 'h');
    sweep(gw, gh, (o, i) => [o, i], 'v');
    return pieces;
  }

  private static canvas(w: number, h: number): HTMLCanvasElement {
    const c = document.createElement('canvas');
    c.width = Math.max(1, w);
    c.height = Math.max(1, h);
    return c;
  }

  /** The floor as a top-down RGBA image in world pixels, with rugs, shadows and light baked in. */
  private static bakeFloor(
    setting: SettingDefinition,
    W: number,
    H: number,
    tileAt: (tx: number, ty: number) => string,
    perimeter: (tx: number, ty: number) => boolean,
    atlas: IsoThemeAtlas | null,
    atlasCanvas: HTMLCanvasElement | null,
    floorTheme: { canvas: HTMLCanvasElement; atlas: TileThemeAtlas } | null
  ): Uint8ClampedArray {
    const canvas = IsoMapBaker.canvas(W, H);
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = `rgb(${FALLBACK_FLOOR.join(',')})`;
    ctx.fillRect(0, 0, W, H);

    const gw = setting.gridWidth;
    const gh = setting.gridHeight;
    const floorUnder = (tx: number, ty: number): string => {
      const type = tileAt(tx, ty);
      if (!isWallLike(type)) return type;
      for (const [dx, dy] of [[0, 1], [1, 0], [0, -1], [-1, 0]]) {
        const n = tileAt(tx + dx, ty + dy);
        if (n && !isWallLike(n)) return n;
      }
      return DEFAULT_FLOOR;
    };
    for (let ty = 1; ty < gh - 1; ty++) {
      for (let tx = 1; tx < gw - 1; tx++) {
        const type = floorUnder(tx, ty);
        const own = atlas?.floors?.[type];
        if (own && atlasCanvas) {
          ctx.drawImage(atlasCanvas, own.x + (tx % 4) * T, own.y + (ty % 4) * T, T, T, tx * T, ty * T, T, T);
          continue;
        }
        const block = floorTheme?.atlas.tiles[type];
        if (!block || !floorTheme) continue;
        ctx.drawImage(floorTheme.canvas, block.x + (tx % block.cols) * T, block.y + (ty % block.rows) * T, T, T, tx * T, ty * T, T, T);
      }
    }

    // Rugs (top-down decals at native size).
    if (atlas && atlasCanvas) {
      const keys = Object.keys(atlas.decals);
      for (const prop of setting.props) {
        if (prop.type !== 'rug' || keys.length === 0) continue;
        const key = typeof prop.state?.decal === 'string' && atlas.decals[prop.state.decal] ? prop.state.decal : keys[0];
        const d = atlas.decals[key];
        ctx.drawImage(atlasCanvas, d.x, d.y, d.w, d.h, Math.round(prop.x * T), Math.round(prop.y * T), d.w, d.h);
      }
    }

    // Daylight falling in through the back windows, slanting into the room.
    const light = (k: number) => `rgba(255, 220, 160, ${(0.12 * (1 - k / 72)).toFixed(3)})`;
    for (let tx = 1; tx < gw - 1; tx++) {
      if (!tileAt(tx, 0).startsWith('window_')) continue;
      for (let k = 0; k < 72; k++) {
        ctx.fillStyle = light(k);
        ctx.fillRect(tx * T + 5 + Math.round(k * 0.35), T + k, 22, 1);
      }
    }
    for (let ty = 1; ty < gh - 1; ty++) {
      if (!tileAt(0, ty).startsWith('window_')) continue;
      for (let k = 0; k < 72; k++) {
        ctx.fillStyle = light(k);
        ctx.fillRect(T + k, ty * T + 5 + Math.round(k * 0.35), 1, 22);
      }
    }

    // Contact shadows under furniture, softer under roofs, and along the back walls.
    for (const prop of setting.props) {
      const kind = ISO_PROP_CATALOG[prop.type]?.kind;
      if (!kind || kind === 'wall') continue;
      const x = Math.round(prop.x * T);
      const y = Math.round(prop.y * T);
      const w = Math.round((prop.width || 1) * T);
      const h = Math.round((prop.height || 1) * T);
      ctx.fillStyle = kind === 'overhead' ? 'rgba(20, 10, 4, 0.14)' : 'rgba(20, 10, 4, 0.22)';
      if (kind === 'overhead') {
        ctx.fillRect(x + 6, y + 6, w - 12, h - 12);
        continue;
      }
      ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
      ctx.fillRect(x, y, w, h);
    }
    const ao = [0.34, 0.2, 0.1, 0.05];
    for (let k = 0; k < ao.length; k++) {
      ctx.fillStyle = `rgba(20, 10, 4, ${ao[k]})`;
      ctx.fillRect(T, T + k, W - 2 * T, 1);
      ctx.fillRect(T + k, T + ao.length, 1, H - 2 * T - ao.length);
    }
    // Interior walls throw a short shadow onto the floor in front of them.
    for (let ty = 1; ty < gh - 1; ty++) {
      for (let tx = 1; tx < gw - 1; tx++) {
        if (!isWallLike(tileAt(tx, ty)) || tileAt(tx, ty).startsWith('door_')) continue;
        ctx.fillStyle = 'rgba(20, 10, 4, 0.16)';
        ctx.fillRect(tx * T + 8, ty * T + 8, T - 16 + 6, T - 16 + 6);
      }
    }

    return ctx.getImageData(0, 0, W, H).data;
  }
}
