import { SettingDefinition } from '../../types/environment';
import { IsoThemeAtlas, TileThemeAtlas } from '../../types/sprite';
import { ISO_PROP_CATALOG } from '../../data/sprites/generated/isoAtlas';
import { ISO } from './IsoProjection';

const T = 32;
const DEFAULT_FLOOR = 'floor_carpet_grey';
const FALLBACK_FLOOR: [number, number, number] = [138, 90, 51];
/** Height of the cut-away front walls (south and east), world px. */
const STUB_H = 12;

export interface IsoBake {
  /** Floor, back walls and wall decor: everything behind the actors. */
  back: HTMLCanvasElement;
  /** Cut-away front walls, drawn over the actors. */
  front: HTMLCanvasElement;
  /** View coordinates of both canvases' top-left pixel. */
  originX: number;
  originY: number;
}

interface Slab {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  h: number;
  /** Which wall-face lighting its visible side uses. */
  face: 'n' | 'w';
  /** The tile row/column the texture is looked up in. */
  line: number;
}

function isWallLike(type: string): boolean {
  return type === '' || type.startsWith('wall_') || type.startsWith('door_') || type.startsWith('window_');
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
  const tmin = Math.max(s.x0 - X0, s.y0 - Y0, 0);
  const tmax = Math.min(tx1, ty1, s.h);
  if (tmin > tmax) return false;
  hitT = tmax;
  hitFace = tmax === tx1 ? 0 : tmax === ty1 ? 1 : 2;
  return true;
}

/**
 * Bakes an isometric set: the floor (themed top-down textures, rugs, contact shadows and window
 * light, projected per pixel so planks and seams land on clean 2:1 steps), the north and west
 * walls at full height with their faces textured from the iso atlas, and the south and east walls
 * as low cut-away stubs on a separate front layer. Wall-hung props are drawn onto the back layer.
 *
 * The set's outer ring of tiles is its walls; interior partitions are not supported yet.
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

    const floorData = IsoMapBaker.bakeFloor(setting, W, H, tileAt, atlas, atlasCanvas, floorTheme);

    const back: Slab[] = [
      { x0: T - th, y0: T - th, x1: (gw - 1) * T + th, y1: T, h: wallH, face: 'n', line: 0 },
      { x0: T - th, y0: T - th, x1: T, y1: (gh - 1) * T + th, h: wallH, face: 'w', line: 0 },
    ];
    const front: Slab[] = [
      { x0: T - th, y0: (gh - 1) * T, x1: (gw - 1) * T + th, y1: (gh - 1) * T + th, h: STUB_H, face: 'n', line: gh - 1 },
      { x0: (gw - 1) * T, y0: T - th, x1: (gw - 1) * T + th, y1: (gh - 1) * T + th, h: STUB_H, face: 'w', line: gw - 1 },
    ];

    const b = ISO.bounds(W, H);
    const originX = Math.floor(b.x0) - 2;
    const originY = Math.floor(b.y0) - 2;
    const cw = Math.ceil(b.x1) + 2 - originX;
    const ch = Math.ceil(b.y1) + 2 - originY;

    const backCanvas = document.createElement('canvas');
    backCanvas.width = cw;
    backCanvas.height = ch;
    const frontCanvas = document.createElement('canvas');
    frontCanvas.width = cw;
    frontCanvas.height = ch;
    const bctx = backCanvas.getContext('2d')!;
    const fctx = frontCanvas.getContext('2d')!;
    const backImg = bctx.createImageData(cw, ch);
    const frontImg = fctx.createImageData(cw, ch);

    const cap = atlas ? atlas.caps : { fill: '#2a1a12', light: '#4a3022', dark: '#140c08' };
    const capFill = rgb(cap.fill);
    const capLight = rgb(cap.light);
    const capDark = rgb(cap.dark);
    const ap = atlasPixels;

    const shadeWall = (out: Uint8ClampedArray, o: number, s: Slab, px: number, py: number, z: number) => {
      const isNorth = s.face === 'n';
      const along = isNorth ? px : py;
      const tile = Math.max(0, Math.floor(along / T));
      const type = isNorth ? tileAt(tile, s.line) : tileAt(s.line, tile);
      const wf = atlas ? atlas.walls[type] || atlas.walls['wall_brick'] : undefined;
      if (!wf || !ap) {
        out[o] = 150;
        out[o + 1] = 80;
        out[o + 2] = 60;
        out[o + 3] = 255;
        return;
      }
      const strip = isNorth ? wf.n : wf.w;
      const local = Math.floor(along) - tile * T;
      // The west face is seen from the east: its south end is on the left of the screen.
      const col = isNorth ? local : T - 1 - local;
      const row = Math.min(wallH - 1, Math.max(0, wallH - 1 - Math.floor(z)));
      const sx = strip.x + (tile % wf.variants) * T + col;
      const si = ((strip.y + row) * ap.width + sx) * 4;
      out[o] = ap.data[si];
      out[o + 1] = ap.data[si + 1];
      out[o + 2] = ap.data[si + 2];
      out[o + 3] = 255;
    };

    const put = (out: Uint8ClampedArray, o: number, c: [number, number, number]) => {
      out[o] = c[0];
      out[o + 1] = c[1];
      out[o + 2] = c[2];
      out[o + 3] = 255;
    };

    const shadeSlab = (out: Uint8ClampedArray, o: number, s: Slab, X0: number, Y0: number) => {
      const px = X0 + hitT;
      const py = Y0 + hitT;
      const roomFace = s.face === 'n' ? 1 : 0;
      if (hitFace === 2) {
        // Wall top: a light edge where it meets the room-side face.
        const edge = s.face === 'n' ? s.y1 - py : s.x1 - px;
        put(out, o, edge < 1.2 ? capLight : capFill);
      } else if (hitFace === roomFace) {
        shadeWall(out, o, s, px, py, hitT);
      } else {
        put(out, o, capDark); // cut end of a wall run
      }
    };

    const bd = backImg.data;
    const fd = frontImg.data;
    for (let j = 0; j < ch; j++) {
      const vy = originY + j + 0.5;
      for (let i = 0; i < cw; i++) {
        const vx = originX + i + 0.5;
        const X0 = vy + vx / 2;
        const Y0 = vy - vx / 2;
        const o = (j * cw + i) * 4;

        let bestT = -1;
        let best: Slab | null = null;
        let bestFace = 0;
        for (let k = 0; k < back.length; k++) {
          if (castBox(back[k], X0, Y0) && hitT > bestT) {
            bestT = hitT;
            best = back[k];
            bestFace = hitFace;
          }
        }
        if (best) {
          hitT = bestT;
          hitFace = bestFace;
          shadeSlab(bd, o, best, X0, Y0);
        } else if (X0 >= 0 && Y0 >= 0 && X0 < W && Y0 < H && !isWallLike(tileAt(Math.floor(X0 / T), Math.floor(Y0 / T)))) {
          const fi = (Math.floor(Y0) * W + Math.floor(X0)) * 4;
          bd[o] = floorData[fi];
          bd[o + 1] = floorData[fi + 1];
          bd[o + 2] = floorData[fi + 2];
          bd[o + 3] = 255;
        }

        let frontT = -1;
        let fbest: Slab | null = null;
        let fFace = 0;
        for (let k = 0; k < front.length; k++) {
          if (castBox(front[k], X0, Y0) && hitT > frontT) {
            frontT = hitT;
            fbest = front[k];
            fFace = hitFace;
          }
        }
        if (fbest) {
          hitT = frontT;
          hitFace = fFace;
          shadeSlab(fd, o, fbest, X0, Y0);
        }
      }
    }
    bctx.putImageData(backImg, 0, 0);
    fctx.putImageData(frontImg, 0, 0);

    // Wall-hung props, farthest first.
    if (atlas && atlasCanvas) {
      bctx.imageSmoothingEnabled = false;
      const decor = setting.props
        .filter((p) => ISO_PROP_CATALOG[p.type]?.kind === 'wall')
        .sort((a, b2) => a.x + a.y - (b2.x + b2.y));
      for (const prop of decor) {
        const f = atlas.frames[`${prop.type}:${prop.facing || 'down'}`];
        if (!f) continue;
        const vx = Math.round(ISO.toViewX(prop.x * T, prop.y * T)) - f.ox - originX;
        const vy = Math.round(ISO.toViewY(prop.x * T, prop.y * T)) - f.oy - originY;
        bctx.drawImage(atlasCanvas, f.x, f.y, f.w, f.h, vx, vy, f.w, f.h);
      }
    }

    return { back: backCanvas, front: frontCanvas, originX, originY };
  }

  /** The floor as a top-down RGBA image in world pixels, with rugs, shadows and light baked in. */
  private static bakeFloor(
    setting: SettingDefinition,
    W: number,
    H: number,
    tileAt: (tx: number, ty: number) => string,
    atlas: IsoThemeAtlas | null,
    atlasCanvas: HTMLCanvasElement | null,
    floorTheme: { canvas: HTMLCanvasElement; atlas: TileThemeAtlas } | null
  ): Uint8ClampedArray {
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = `rgb(${FALLBACK_FLOOR.join(',')})`;
    ctx.fillRect(0, 0, W, H);

    const gw = setting.gridWidth;
    const gh = setting.gridHeight;
    for (let ty = 0; ty < gh; ty++) {
      for (let tx = 0; tx < gw; tx++) {
        const type = tileAt(tx, ty);
        const block = floorTheme?.atlas.tiles[type];
        if (isWallLike(type) || !block || !floorTheme) continue;
        const sx = block.x + (tx % block.cols) * T;
        const sy = block.y + (ty % block.rows) * T;
        ctx.drawImage(floorTheme.canvas, sx, sy, T, T, tx * T, ty * T, T, T);
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

    // Light falling in through the north windows, slanting into the room.
    for (let tx = 0; tx < gw; tx++) {
      if (!tileAt(tx, 0).startsWith('window_')) continue;
      for (let k = 0; k < 72; k += 1) {
        const a = 0.13 * (1 - k / 72);
        ctx.fillStyle = `rgba(255, 216, 150, ${a.toFixed(3)})`;
        ctx.fillRect(tx * T + 5 + Math.round(k * 0.35), T + k, 22, 1);
      }
    }

    // Contact shadows under furniture and along the back walls.
    ctx.fillStyle = 'rgba(20, 10, 4, 0.22)';
    for (const prop of setting.props) {
      const kind = ISO_PROP_CATALOG[prop.type]?.kind;
      if (kind !== 'floor' && kind !== 'seat') continue;
      const x = Math.round(prop.x * T);
      const y = Math.round(prop.y * T);
      const w = Math.round((prop.width || 1) * T);
      const h = Math.round((prop.height || 1) * T);
      ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
      ctx.fillRect(x, y, w, h);
    }
    const ao = [0.34, 0.2, 0.1, 0.05];
    for (let k = 0; k < ao.length; k++) {
      ctx.fillStyle = `rgba(20, 10, 4, ${ao[k]})`;
      ctx.fillRect(T, T + k, W - 2 * T, 1);
      ctx.fillRect(T + k, T + ao.length, 1, H - 2 * T - ao.length);
    }

    return ctx.getImageData(0, 0, W, H).data;
  }
}
