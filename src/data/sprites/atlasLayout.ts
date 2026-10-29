import { CharacterAnimationFrames, SpriteRect } from '../../types/sprite';

/**
 * Describes a regular atlas grid. Keep the source dimensions here rather than
 * rounding an individual cell size: 1024 does not divide evenly into 12 and
 * 2048 does not divide evenly into 6 or 10.
 */
export interface AtlasGrid {
  width: number;
  height: number;
  columns: number;
  rows: number;
}

export type SpriteRectOptions = Omit<SpriteRect, 'x' | 'y' | 'w' | 'h'>;

/**
 * Returns a cell using rounded grid edges. Adjacent cells meet exactly, every
 * cell stays in bounds, and the final cell reaches the atlas edge without
 * SpriteManager needing to crop it at runtime.
 */
export function atlasCell(
  grid: AtlasGrid,
  column: number,
  row: number,
  options: SpriteRectOptions = {},
): SpriteRect {
  if (column < 0 || column >= grid.columns || row < 0 || row >= grid.rows) {
    throw new Error(`Atlas cell (${column}, ${row}) is outside a ${grid.columns}x${grid.rows} grid.`);
  }

  const x = Math.floor((column * grid.width) / grid.columns);
  const right = Math.floor(((column + 1) * grid.width) / grid.columns);
  const y = Math.floor((row * grid.height) / grid.rows);
  const bottom = Math.floor(((row + 1) * grid.height) / grid.rows);

  return {
    x,
    y,
    w: right - x,
    h: bottom - y,
    ...options,
  };
}

/**
 * Character atlases produced by scripts/sprites/process_characters.py share one layout:
 * one row per character, 64px tall cells, and three direction blocks of five columns
 * (idle, then a four-frame walk cycle). Side views are stored facing right only; left is
 * the same frames mirrored, so the two directions can never disagree.
 */
export interface CharacterAtlasEntry {
  imageKey: string;
  row: number;
}

export const CHARACTER_ATLAS_DIRECTIONS = ['down', 'up', 'right'] as const;
export const CHARACTER_ATLAS_FRAMES_PER_DIRECTION = 5;

export function characterAtlasAnimations(
  row: number,
  cell: { width: number; height: number; baseline: number },
): CharacterAnimationFrames {
  const frame = (direction: (typeof CHARACTER_ATLAS_DIRECTIONS)[number], index: number, flipX = false): SpriteRect => {
    const column = CHARACTER_ATLAS_DIRECTIONS.indexOf(direction) * CHARACTER_ATLAS_FRAMES_PER_DIRECTION + index;
    return {
      x: column * cell.width,
      y: row * cell.height,
      w: cell.width,
      h: cell.height,
      anchorX: 0.5,
      anchorY: cell.baseline / cell.height,
      ...(flipX ? { flipX: true } : {}),
    };
  };
  const walk = (direction: (typeof CHARACTER_ATLAS_DIRECTIONS)[number], flipX = false) =>
    [1, 2, 3, 4].map((i) => frame(direction, i, flipX));

  const idle = {
    down: frame('down', 0),
    up: frame('up', 0),
    right: frame('right', 0),
    left: frame('right', 0, true),
  };

  return {
    down: walk('down'),
    up: walk('up'),
    right: walk('right'),
    left: walk('right', true),
    idle,
    sitting: idle,
  };
}
