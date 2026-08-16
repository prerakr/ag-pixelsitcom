import { Direction, EmotionType, EmoteIconType } from './script';

export type HoldableItemType =
  | 'dundie_trophy'
  | 'coffee_mug'
  | 'jello_stapler'
  | 'pizza_box'
  | 'clipboard'
  | 'fire_extinguisher'
  | 'pretzel'
  | 'paper_sheet';

export type CharacterState =
  | 'idle'
  | 'walking'
  | 'running'
  | 'sneaking'
  | 'tiptoeing'
  | 'sitting_desk'
  | 'sitting_couch'
  | 'typing'
  | 'drinking'
  | 'eating'
  | 'holding'
  | 'gesturing'
  | 'shocked'
  | 'cowering'
  | 'fallen'
  | 'camera_stare';

export type CharacterGesture =
  | 'facepalm'
  | 'shrug'
  | 'wave'
  | 'point'
  | 'cross_arms'
  | 'hands_on_hips';

export interface CharacterVisualProfile {
  skinColor: string;
  hairColor: string;
  hairStyle: 'slicked' | 'middle_part' | 'floppy' | 'curls' | 'tight_bun' | 'balding' | 'short' | 'wild';
  shirtColor: string;
  tieColor?: string;
  pantsColor: string;
  shoesColor: string;
  glasses?: boolean;
  glassesColor?: string;
  facialHair?: 'none' | 'mustache' | 'stubble' | 'beard';
  bodyType?: 'normal' | 'slim' | 'large' | 'petite';
  accessory?: 'cardigan' | 'sweater' | 'id_badge' | 'coffee_mug' | 'stapler';
  heightScale?: number; // 0.9 to 1.1
}

export interface CharacterDefinition {
  id: string;
  name: string;
  nickname?: string;
  role: string;
  showId: string;
  avatarUrl?: string;
  visual: CharacterVisualProfile;
  signatureQuotes: string[];
  personalityTraits: string[];
  defaultWaypoint: string;
  defaultFacing: Direction;
}

export interface CharacterRuntimeState {
  id: string;
  x: number; // pixel coords
  y: number; // pixel coords
  targetX?: number;
  targetY?: number;
  facing: Direction;
  targetFacing?: Direction;
  isMoving: boolean;
  speed: number;
  animFrame: number;
  animTimer: number;
  animSpeed?: number;
  state?: CharacterState;
  currentAction?: string;
  gesture?: CharacterGesture;
  actionTimer?: number;
  runLean?: number;
  isSitting?: boolean;
  heldItem?: HoldableItemType;
  currentSpeech?: {
    text: string;
    displayedText: string;
    charIndex: number;
    timer: number;
    emotion: EmotionType;
    totalDuration: number;
    elapsed: number;
    speedMultiplier?: number;
  };
  currentEmote?: {
    icon: EmoteIconType;
    timer: number;
    maxDuration: number;
  };
}

