import { CharacterSpriteDef, ImageManifestEntry } from '../../types/sprite';
import { characterAtlasAnimations } from './atlasLayout';
import { CHARACTER_ATLAS, CHARACTER_ATLAS_IMAGES, CHARACTER_CELL } from './generated/characterAtlas';

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
