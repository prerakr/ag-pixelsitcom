import { CharacterSpriteDef, ImageManifestEntry, SpriteRect } from '../../types/sprite';
import { characterAtlasAnimations } from './atlasLayout';
import { CHARACTER_ATLAS, CHARACTER_ATLAS_IMAGES, CHARACTER_CELL } from './generated/characterAtlas';
import { ISO_CHARACTER_CELL, ISO_CHARACTER_COLUMNS, ISO_CHARACTER_ROWS } from './generated/isoCharacterAtlas';

/** Character sprite definitions for the given ids, read from the generated atlas index. */
export function atlasCharacters(ids: string[]): Record<string, CharacterSpriteDef> {
  const defs: Record<string, CharacterSpriteDef> = {};
  for (const id of ids) {
    const entry = CHARACTER_ATLAS[id];
    if (!entry) {
      throw new Error(`Character "${id}" is missing from the generated atlas. Run scripts/sprites/process_characters.py.`);
    }
    defs[id] = {
      characterId: id,
      imageKey: entry.imageKey,
      frameWidth: CHARACTER_CELL.width,
      frameHeight: CHARACTER_CELL.height,
      scale: 1,
      enabled: true,
      animations: characterAtlasAnimations(entry.row, CHARACTER_CELL),
    };
  }
  return defs;
}

/** Image entries for the atlases used by the given character ids (already transparent PNGs). */
export function atlasImages(ids: string[]): Record<string, ImageManifestEntry> {
  const images: Record<string, ImageManifestEntry> = {};
  for (const id of ids) {
    const key = CHARACTER_ATLAS[id]?.imageKey;
    if (key) images[key] = { url: CHARACTER_ATLAS_IMAGES[key] };
  }
  return images;
}

/**
 * Isometric sprite sets, registered as `<id>@iso`. The sheet has three-quarter front views
 * facing south-east (world +x) and back views facing north-east (world -y); the other two
 * diagonals are the same frames mirrored. Keys are world facings, as the simulation uses them.
 */
export function isoCharacterSprites(): Record<string, CharacterSpriteDef> {
  const defs: Record<string, CharacterSpriteDef> = {};
  const cell = ISO_CHARACTER_CELL;
  for (const [id, row] of Object.entries(ISO_CHARACTER_ROWS)) {
    const frame = (column: (typeof ISO_CHARACTER_COLUMNS)[number], index: number, flipX: boolean): SpriteRect => {
      const col = ISO_CHARACTER_COLUMNS.indexOf(column) + index;
      return {
        x: col * cell.width,
        y: row * cell.height,
        w: cell.width,
        h: cell.height,
        anchorX: 0.5,
        anchorY: cell.baseline / cell.height,
        ...(flipX ? { flipX: true } : {}),
      };
    };
    const walk = (first: 'front_a' | 'back_a', flipX: boolean) => [0, 1, 2, 3].map((i) => frame(first, i, flipX));
    defs[`${id}@iso`] = {
      characterId: `${id}@iso`,
      imageKey: 'characters_iso',
      frameWidth: cell.width,
      frameHeight: cell.height,
      scale: 1,
      enabled: true,
      animations: {
        right: walk('front_a', false),
        down: walk('front_a', true),
        up: walk('back_a', false),
        left: walk('back_a', true),
        idle: {
          right: frame('front_idle', 0, false),
          down: frame('front_idle', 0, true),
          up: frame('back_idle', 0, false),
          left: frame('back_idle', 0, true),
        },
        sitting: {
          right: frame('front_sit', 0, false),
          down: frame('front_sit', 0, true),
          up: frame('back_idle', 0, false),
          left: frame('back_idle', 0, true),
        },
      },
    };
  }
  return defs;
}
