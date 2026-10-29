import { ImageManifestEntry, SpriteAtlasManifest, TileSpriteDef } from '../../../types/sprite';
import { TILE_THEME_ATLAS, TILE_THEME_IMAGES } from '../generated/tileAtlas';

const images: Record<string, ImageManifestEntry> = {};
for (const [key, url] of Object.entries(TILE_THEME_IMAGES)) {
  images[key] = { url };
}

/**
 * Tile entries for the Sprite Studio galleries and per-tile toggles. In game, the map baker
 * draws tiles from the themed tilesets (TILE_THEME_ATLAS) with position-based variants.
 */
const tiles: Record<string, TileSpriteDef> = {};
const office = TILE_THEME_ATLAS.office;
for (const [tileType, block] of Object.entries(office.tiles)) {
  tiles[tileType] = {
    tileType,
    imageKey: office.imageKey,
    rect: { x: block.x, y: block.y, w: 32, h: 32 },
    enabled: true,
  };
}

export const COMMON_MANIFEST: SpriteAtlasManifest = {
  showId: 'common',
  images,
  characters: {},
  props: {},
  tiles,
  portraits: {},
  tileThemes: TILE_THEME_ATLAS,
};
