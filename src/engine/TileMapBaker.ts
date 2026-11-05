import { SettingDefinition, TileType } from '../types/environment';
import { TileThemeAtlas, WallCapStyle } from '../types/sprite';
import { spriteManager } from './SpriteManager';
import { TileRenderer } from './TileRenderer';

const ART_TILE = 32; // pixel size of one tile in the themed tilesets
const DEFAULT_FLOOR: TileType = 'floor_carpet_grey';
const OUTSIDE = '';

const SHADOW_ALPHA = [72, 40, 18]; // contact shadow rows below walls (light comes from above)

function isWallLike(type: string): boolean {
  return type === OUTSIDE || type.startsWith('wall_') || type.startsWith('door_') || type.startsWith('window_');
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

type WallMode = 'face' | 'cap' | 'doorway';

/**
 * Bakes a set's tile grid into the static map layer.
 *
 * Floors use the themed 4x4 seamless textures, picked by grid position so neighbouring tiles
 * always join. Walls use a small 3/4-view autotile rule:
 * - a wall with open floor to its south shows its front face,
 * - any other wall is seen from above as a "cap" whose shape follows its wall neighbours, so a
 *   partition running north-south is a thin strip over the floor instead of a solid block,
 * - a door inside a north-south wall becomes an open doorway with frame posts.
 * Walls then cast a short contact shadow onto the floor below them.
 *
 * Tiles fall back to the procedural TileRenderer while the tileset loads, when procedural art
 * is selected, when a tile is toggled off in the Sprite Studio, or when it is being calibrated.
 */
export class TileMapBaker {
  public static bake(ctx: CanvasRenderingContext2D, setting: SettingDefinition): void {
    const T = setting.tileSize;
    const W = setting.gridWidth;
    const H = setting.gridHeight;
    const themed = T === ART_TILE ? spriteManager.getTileTheme(setting.tileTheme) : null;

    const grid: string[] = new Array(W * H);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        grid[y * W + x] = setting.tiles[`${x},${y}`] || DEFAULT_FLOOR;
      }
    }
    const at = (x: number, y: number): string => (x < 0 || y < 0 || x >= W || y >= H ? OUTSIDE : grid[y * W + x]);
    const wallAt = (x: number, y: number) => isWallLike(at(x, y));

    if (!themed) {
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) TileRenderer.drawTile(ctx, at(x, y) as TileType, x * T, y * T, T);
      }
      return;
    }
    const { canvas, atlas } = themed;
    const usesSprite = (type: string) =>
      !!atlas.tiles[type] && spriteManager.isAssetEnabled('tile', type) && !spriteManager.hasTileOverride(type);

    const wallMode = (x: number, y: number): WallMode => {
      const type = at(x, y);
      const north = wallAt(x, y - 1);
      const south = wallAt(x, y + 1);
      if (type.startsWith('door_') && north && south && !(wallAt(x - 1, y) && wallAt(x + 1, y))) return 'doorway';
      if (!south || type === 'window_blinds') return 'face';
      return 'cap';
    };
    const floorUnder = (x: number, y: number): string => {
      const candidates = [at(x - 1, y), at(x + 1, y), at(x, y - 1), at(x, y + 1)];
      return candidates.find((t) => !isWallLike(t)) || DEFAULT_FLOOR;
    };
    const blit = (type: string, x: number, y: number) => {
      const block = atlas.tiles[type];
      const sx = block.x + (x % block.cols) * ART_TILE;
      const sy = block.y + (y % block.rows) * ART_TILE;
      ctx.drawImage(canvas, sx, sy, ART_TILE, ART_TILE, x * T, y * T, T, T);
    };
    const drawFloor = (type: string, x: number, y: number) => {
      if (usesSprite(type)) blit(type, x, y);
      else TileRenderer.drawTile(ctx, type as TileType, x * T, y * T, T);
    };

    // Pass 1: floors and wall faces. Cap cells get the neighbouring floor underneath.
    const modes: (WallMode | null)[] = new Array(W * H).fill(null);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const type = at(x, y);
        if (!isWallLike(type)) {
          drawFloor(type, x, y);
          continue;
        }
        if (!usesSprite(type)) {
          TileRenderer.drawTile(ctx, type as TileType, x * T, y * T, T);
          continue;
        }
        const mode = wallMode(x, y);
        modes[y * W + x] = mode;
        if (mode === 'face') blit(type, x, y);
        else drawFloor(floorUnder(x, y), x, y);
      }
    }

    // Pass 2: caps, doorway posts and contact shadows, shaded across tile boundaries.
    TileMapBaker.drawCapsAndShadows(ctx, atlas, W, H, T, at, wallAt, modes);
  }

  private static drawCapsAndShadows(
    ctx: CanvasRenderingContext2D,
    atlas: TileThemeAtlas,
    W: number,
    H: number,
    T: number,
    at: (x: number, y: number) => string,
    wallAt: (x: number, y: number) => boolean,
    modes: (WallMode | null)[]
  ) {
    const pw = W * T;
    const ph = H * T;
    // 0 = open floor, 1 = wall face, 2+ = cap style index + 2
    const solid = new Uint8Array(pw * ph);
    const styles: WallCapStyle[] = [];
    const styleIndex = new Map<string, number>();
    const fallbackStyle = atlas.caps.wall_office_side || Object.values(atlas.caps)[0];

    const fillRect = (x0: number, y0: number, w: number, h: number, value: number) => {
      for (let y = y0; y < y0 + h; y++) {
        const row = y * pw;
        for (let x = x0; x < x0 + w; x++) solid[row + x] = value;
      }
    };

    for (let gy = 0; gy < H; gy++) {
      for (let gx = 0; gx < W; gx++) {
        const mode = modes[gy * W + gx];
        if (!mode) continue;
        const ox = gx * T;
        const oy = gy * T;
        if (mode === 'face') {
          fillRect(ox, oy, T, T, 1);
          continue;
        }
        const type = at(gx, gy);
        const capType = type.startsWith('door_') || type.startsWith('window_') ? 'wall_office_side' : type;
        const style = atlas.caps[capType] || fallbackStyle;
        let idx = styleIndex.get(capType);
        if (idx === undefined) {
          idx = styles.length;
          styles.push(style);
          styleIndex.set(capType, idx);
        }
        const v = idx + 2;
        const t = Math.min(T, Math.round((style.thickness * T) / ART_TILE));
        const c = Math.floor((T - t) / 2);
        const n = wallAt(gx, gy - 1);
        const s = wallAt(gx, gy + 1);
        const w = wallAt(gx - 1, gy);
        const e = wallAt(gx + 1, gy);

        if (mode === 'doorway') {
          const post = Math.max(2, Math.round(T / 8));
          if (n) fillRect(ox + c, oy, t, post, v);
          if (s) fillRect(ox + c, oy + T - post, t, post, v);
          continue;
        }

        fillRect(ox + c, oy + c, t, t, v);
        if (n) fillRect(ox + c, oy, t, c, v);
        if (s) fillRect(ox + c, oy + c + t, t, T - c - t, v);
        if (w) fillRect(ox, oy + c, c, t, v);
        if (e) fillRect(ox + c + t, oy + c, T - c - t, t, v);
        if (n && w && wallAt(gx - 1, gy - 1)) fillRect(ox, oy, c, c, v);
        if (n && e && wallAt(gx + 1, gy - 1)) fillRect(ox + c + t, oy, T - c - t, c, v);
        if (s && w && wallAt(gx - 1, gy + 1)) fillRect(ox, oy + c + t, c, T - c - t, v);
        if (s && e && wallAt(gx + 1, gy + 1)) fillRect(ox + c + t, oy + c + t, T - c - t, T - c - t, v);
      }
    }

    const colours = styles.map((st) => ({
      fill: hexToRgb(st.fill),
      light: hexToRgb(st.light),
      dark: hexToRgb(st.dark),
      core: st.core ? hexToRgb(st.core) : null,
    }));
    const image = ctx.createImageData(pw, ph);
    const data = image.data;
    const isSolid = (x: number, y: number) => x < 0 || y < 0 || x >= pw || y >= ph || solid[y * pw + x] !== 0;
    const isCap = (x: number, y: number) => x < 0 || y < 0 || x >= pw || y >= ph || solid[y * pw + x] >= 2;

    for (let y = 0; y < ph; y++) {
      for (let x = 0; x < pw; x++) {
        const i = y * pw + x;
        const value = solid[i];
        const o = i * 4;
        if (value >= 2) {
          const col = colours[value - 2];
          let rgb = col.fill;
          if (!isCap(x, y + 1) && !isSolid(x, y + 1)) rgb = col.dark;
          else if (!isCap(x, y - 1)) rgb = col.light;
          else if (!isCap(x + 1, y)) rgb = col.dark;
          else if (!isCap(x - 1, y)) rgb = col.light;
          else if (col.core && isCap(x - 2, y) && isCap(x + 2, y) && isCap(x, y - 2) && isCap(x, y + 2)) rgb = col.core;
          data[o] = rgb[0];
          data[o + 1] = rgb[1];
          data[o + 2] = rgb[2];
          data[o + 3] = 255;
        } else if (value === 0) {
          for (let d = 1; d <= SHADOW_ALPHA.length; d++) {
            if (y - d >= 0 && solid[(y - d) * pw + x] !== 0) {
              data[o + 3] = SHADOW_ALPHA[d - 1];
              break;
            }
          }
        }
      }
    }

    const layer = document.createElement('canvas');
    layer.width = pw;
    layer.height = ph;
    layer.getContext('2d')?.putImageData(image, 0, 0);
    ctx.drawImage(layer, 0, 0);
  }
}
