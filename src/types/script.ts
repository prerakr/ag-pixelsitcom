// ==========================================
// SitcomScript v1.0 Standardized Specification
// ==========================================

export type CharacterId = string;
export type PropId = string;
export type WaypointId = string;

export type EmotionType =
  | 'neutral'
  | 'happy'
  | 'smirk'
  | 'deadpan'
  | 'shock'
  | 'panic'
  | 'angry'
  | 'cry'
  | 'smug'
  | 'cringe'
  | 'confused'
  | 'proud';

export type EmoteIconType =
  | 'exclamation'
  | 'question'
  | 'sweat'
  | 'panic'
  | 'rage'
  | 'heart'
  | 'laugh'
  | 'skull'
  | 'fire'
  | 'money'
  | 'dundie'
  | 'coffee'
  | 'lightbulb'
  | 'jello'
  | 'camera';

export type SfxType =
  | 'typewriter'
  | 'laugh_track'
  | 'laugh_giggle'
  | 'laugh_roar'
  | 'gasp'
  | 'cheer'
  | 'tension_sting'
  | 'dramatic_boom'
  | 'slapstick_boing'
  | 'rimshot'
  | 'phone_ring'
  | 'fire_alarm'
  | 'stapler_click'
  | 'coffee_pour'
  | 'parkour_leap'
  | 'glass_shatter'
  | 'theme_jingle';

export type Direction = 'up' | 'down' | 'left' | 'right';

export interface BaseBeat {
  id?: string;
  delayBeforeMs?: number;
}

export interface DialogueBeat extends BaseBeat {
  type: 'dialogue';
  speaker: CharacterId;
  text: string;
  emotion?: EmotionType;
  sfx?: SfxType;
  speed?: 'slow' | 'normal' | 'fast';
  durationMs?: number; // Optional override, otherwise auto-computed from text length
  emote?: EmoteIconType;
  cameraFocus?: boolean; // Whether camera should center on speaker
}

export interface MovementBeat extends BaseBeat {
  type: 'movement';
  character: CharacterId;
  target: WaypointId | { x: number; y: number };
  speed?: number; // 1 = normal, 2 = fast, 0.5 = slow
  facing?: Direction;
  animationState?: 'walk' | 'run' | 'tiptoe' | 'sneak';
}

export interface InteractionBeat extends BaseBeat {
  type: 'interaction';
  character: CharacterId;
  targetProp: PropId;
  action:
    | 'sit'
    | 'stand'
    | 'type_pc'
    | 'drink_coffee'
    | 'use_photocopier'
    | 'ignite'
    | 'inspect'
    | 'eat_snack'
    | 'kick'
    | 'slam_desk'
    | 'give_dundie';
  sfx?: SfxType;
  durationMs?: number;
  facing?: Direction;
}

export interface TalkingHeadBeat extends BaseBeat {
  type: 'talking_head';
  speaker: CharacterId;
  monologueText: string;
  emotion?: EmotionType;
  background?: 'blinds' | 'window' | 'kitchen' | 'breakroom';
  sfx?: SfxType;
  cameraLook?: boolean; // classic mockumentary gaze into camera
  durationMs?: number;
}

export interface CameraCueBeat extends BaseBeat {
  type: 'camera_cue';
  target: CharacterId | PropId | WaypointId | { x: number; y: number } | 'overview';
  zoom?: number; // 1.0 (overview), 1.5 (medium), 2.2 (dramatic close-up)
  style?: 'cut' | 'smooth_pan' | 'dramatic_zoom' | 'jim_stare';
  durationMs?: number;
}

export interface AudioCueBeat extends BaseBeat {
  type: 'audio_cue';
  sfx: SfxType;
  volume?: number; // 0.0 to 1.0
}

export interface EmoteBeat extends BaseBeat {
  type: 'emote';
  character: CharacterId;
  emote: EmoteIconType;
  durationMs?: number;
  soundEffect?: SfxType;
}

export interface GroupActionBeat extends BaseBeat {
  type: 'group_action';
  actions: Array<
    | MovementBeat
    | DialogueBeat
    | InteractionBeat
    | EmoteBeat
    | AudioCueBeat
  >;
}

export interface WaitBeat extends BaseBeat {
  type: 'wait';
  durationMs: number;
}

export type ScriptBeat =
  | DialogueBeat
  | MovementBeat
  | InteractionBeat
  | TalkingHeadBeat
  | CameraCueBeat
  | AudioCueBeat
  | EmoteBeat
  | GroupActionBeat
  | WaitBeat;

export interface Scene {
  id: string;
  name: string;
  location?: string;
  synopsis?: string;
  beats: ScriptBeat[];
}

export interface SitcomScript {
  version: '1.0';
  title: string;
  showId: string;
  settingId: string;
  synopsis: string;
  author?: string;
  characters: CharacterId[];
  scenes: Scene[];
}
