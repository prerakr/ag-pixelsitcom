import { Direction, EmotionType } from './script';
import { TileType, PropType } from './environment';
import { CharacterState } from './character';

export interface SpriteRect {
  x: number;
  y: number;
  w: number;
  h: number;
  anchorX?: number; // Normalized pivot (0-1), default 0.5
  anchorY?: number; // Normalized pivot (0-1), default 1.0 (feet baseline)
  offsetX?: number; // Fine-tune draw offset in pixels (horizontal)
  offsetY?: number; // Fine-tune draw offset in pixels (vertical)
  flipX?: boolean;  // Horizontally mirror this sprite frame around its anchor pivot
  flipY?: boolean;  // Vertically mirror this sprite frame
}

export interface CharacterAnimationFrames {
  down: SpriteRect[];  // Walk / idle frames facing front/down
  up: SpriteRect[];    // Walk / idle frames facing back/up
  left: SpriteRect[];  // Walk / idle frames facing left
  right: SpriteRect[]; // Walk / idle frames facing right
  idle?: Partial<Record<Direction, SpriteRect | SpriteRect[]>>;
  run?: Partial<Record<Direction, SpriteRect[]>>;
  sitting?: {
    down?: SpriteRect;
    up?: SpriteRect;
    left?: SpriteRect;
    right?: SpriteRect;
  };
  actions?: Partial<Record<CharacterState | string, SpriteRect | SpriteRect[]>>;
}

export interface CharacterSpriteDef {
  characterId: string;
  imageKey: string; // Key in loaded image registry
  frameWidth: number;
  frameHeight: number;
  animations: CharacterAnimationFrames;
  scale?: number;
  offsetX?: number;
  offsetY?: number;
  enabled?: boolean; // If false, gracefully falls back to procedural without affecting others
}

export interface PropSpriteDef {
  propType: PropType | string;
  imageKey: string;
  rect: SpriteRect;
  states?: Record<string, SpriteRect>; // e.g. 'ignited', 'open', 'broken'
  scale?: number;
  offsetX?: number;
  offsetY?: number;
  enabled?: boolean; // If false, gracefully falls back to procedural
}

export interface TileSpriteDef {
  tileType: TileType | string;
  imageKey: string;
  rect: SpriteRect;
  enabled?: boolean;
}

export interface TalkingHeadPortraitDef {
  characterId: string;
  imageKey: string;
  rect?: SpriteRect;
  emotionRects?: Partial<Record<EmotionType, SpriteRect>>;
  enabled?: boolean;
}

export interface ImageManifestEntry {
  url: string;
  chromaKey?: string; // Hex color to make transparent, e.g. '#00ff00' or '#ff00ff'
  tolerance?: number; // Chroma color tolerance (0 to 120, default ~45)
}

export interface SpriteAtlasManifest {
  showId?: string;
  images: Record<string, ImageManifestEntry>;
  characters: Record<string, CharacterSpriteDef>;
  props: Record<string, PropSpriteDef>;
  tiles: Record<string, TileSpriteDef>;
  portraits: Record<string, TalkingHeadPortraitDef>;
  /** Themed tilesets used by the map baker, keyed by SettingDefinition.tileTheme. */
  tileThemes?: Record<string, TileThemeAtlas>;
}


/** A 128x128 (4x4 tile) floor texture or a 4-variant strip of wall faces in a theme tileset. */
export interface TileThemeBlock {
  x: number;
  y: number;
  cols: number;
  rows: number;
}

/** How the map baker draws the top of a wall seen from above (not part of the image). */
export interface WallCapStyle {
  fill: string;
  light: string;
  dark: string;
  thickness: number;
  core?: string;
}

export interface TileThemeAtlas {
  imageKey: string;
  tiles: Record<string, TileThemeBlock>;
  caps: Record<string, WallCapStyle>;
}

/** One prop view in an isometric atlas. (ox, oy) is the sprite pixel of the footprint's north-west floor corner. */
export interface IsoFrame {
  x: number;
  y: number;
  w: number;
  h: number;
  ox: number;
  oy: number;
}

/** A strip of wall-face variants, 32px per tile and `wallHeight` tall, lit for the north (n) and west (w) walls. */
export interface IsoWallFace {
  variants: number;
  n: { x: number; y: number };
  w: { x: number; y: number };
}

/** Isometric atlas for one set theme, built by scripts/sprites/iso_assets.py. */
export interface IsoThemeAtlas {
  imageKey: string;
  wallHeight: number;
  wallThickness: number;
  caps: IsoCap;
  /** Cap colours for tile types that differ from the theme's (a hedge's top is leaves). */
  capsByType: Record<string, IsoCap>;
  /** Wall heights (world px) for tile types shorter than `wallHeight`. */
  wallHeights: Record<string, number>;
  /** Keyed `${propType}:${facing}`. */
  frames: Record<string, IsoFrame>;
  walls: Record<string, IsoWallFace>;
  /** Top-down floor textures (rugs) laid into the floor before it is projected. */
  decals: Record<string, { x: number; y: number; w: number; h: number }>;
  /** 128x128 seamless floor textures (4x4 tiles) by tile type; others use the top-down tileset. */
  floors: Record<string, { x: number; y: number }>;
}

export interface IsoCap {
  fill: string;
  light: string;
  dark: string;
}

/**
 * Real-world size of an isometric prop, in tiles (1 tile = 1 m) for the 'down' facing; height in
 * world px. 'floor' props block their footprint, 'seat' props are sat in (a backrest facing away
 * hides the sitter), 'stool' props are backless seats, 'wall' props hang on a back wall, and
 * 'overhead' props (a roof over a patio table) are drawn above everyone under them.
 */
export interface IsoPropCatalogEntry {
  width: number;
  depth: number;
  height: number;
  kind: 'floor' | 'seat' | 'stool' | 'wall' | 'overhead';
}
