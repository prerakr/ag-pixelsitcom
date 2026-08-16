import { Direction, EmotionType } from './script';
import { TileType, PropType } from './environment';

export interface SpriteRect {
  x: number;
  y: number;
  w: number;
  h: number;
  anchorX?: number; // Normalized pivot (0-1), default 0.5
  anchorY?: number; // Normalized pivot (0-1), default 1.0 (feet baseline)
}

export interface CharacterAnimationFrames {
  down: SpriteRect[];  // Walk / idle frames facing front/down
  up: SpriteRect[];    // Walk / idle frames facing back/up
  left: SpriteRect[];  // Walk / idle frames facing left
  right: SpriteRect[]; // Walk / idle frames facing right
  sitting?: {
    down?: SpriteRect;
    up?: SpriteRect;
    left?: SpriteRect;
    right?: SpriteRect;
  };
  actions?: Record<string, SpriteRect | SpriteRect[]>; // e.g. 'jim_stare', 'drink_coffee'
}

export interface CharacterSpriteDef {
  characterId: string;
  imageKey: string; // Key in loaded image registry
  frameWidth: number;
  frameHeight: number;
  animations: CharacterAnimationFrames;
  scale?: number;
}

export interface PropSpriteDef {
  propType: PropType;
  imageKey: string;
  rect: SpriteRect;
  states?: Record<string, SpriteRect>; // e.g. 'ignited', 'open', 'broken'
  scale?: number;
}

export interface TileSpriteDef {
  tileType: TileType;
  imageKey: string;
  rect: SpriteRect;
}

export interface TalkingHeadPortraitDef {
  characterId: string;
  imageKey: string;
  rect?: SpriteRect;
  emotionRects?: Partial<Record<EmotionType, SpriteRect>>;
}

export interface SpriteAtlasManifest {
  images: Record<string, {
    url: string;
    chromaKey?: string; // Hex color to make transparent, e.g. '#00ff00' or '#ff00ff'
    tolerance?: number; // Chroma color tolerance (0 to 120, default ~45)
  }>;
  characters: Record<string, CharacterSpriteDef>;
  props: Record<string, PropSpriteDef>;
  tiles: Record<string, TileSpriteDef>;
  portraits: Record<string, TalkingHeadPortraitDef>;
}
