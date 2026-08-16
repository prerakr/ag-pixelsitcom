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
}

