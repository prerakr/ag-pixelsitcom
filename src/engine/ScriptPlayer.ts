import { SettingDefinition } from '../types/environment';
import { CharacterDefinition, CharacterRuntimeState, HoldableItemType } from '../types/character';
import {
  SitcomScript,
  ScriptBeat,
  DialogueBeat,
  MovementBeat,
  InteractionBeat,
  TalkingHeadBeat,
  CameraCueBeat,
  AudioCueBeat,
  EmoteBeat,
  TimeOfDayBeat,
  GroupActionBeat,
  SfxType,
  TimeOfDay,
  Direction,
} from '../types/script';
import { advanceWalkCycle, faceAlong } from './Locomotion';
import { NavGrid, PathPoint } from './NavGrid';
import { seatAt } from './Seats';

/** Walking speed at `speed: 1`, in world pixels per second. */
export const WALK_SPEED_PX = 110;

/**
 * Everything a beat does beyond changing world state: sound, particles, camera, lighting,
 * music and the talking-head overlay. The renderer implements it; while seeking, the player
 * swaps in a silent version so replayed beats only change state.
 */
export interface StageEffects {
  sfx(sfx: SfxType, volume?: number): void;
  timeOfDay(time: TimeOfDay, instant: boolean, durationMs?: number): void;
  duckMusic(ducked: boolean): void;
  shake(duration: number, intensity: number): void;
  /** Frame a speaking character (x, y in world pixels). */
  focusSpeaker(x: number, y: number): void;
  /** A camera cue; `target` is null for the 'overview' shot. */
  cameraCue(cue: CameraCueBeat, target: PathPoint | null): void;
  paperAirplane(x: number, y: number, targetX: number, targetY: number): void;
  spillCoffee(x: number, y: number): void;
  extinguisherFoam(x: number, y: number, angle: number): void;
  talkingHead(beat: TalkingHeadBeat | null): void;
}

export interface PlayerEvents {
  onBeatChange?: (sceneIndex: number, beatIndex: number, beat: ScriptBeat | null) => void;
  onEpisodeEnd?: () => void;
}

const NO_EFFECTS: StageEffects = {
  sfx() {},
  timeOfDay() {},
  duckMusic() {},
  shake() {},
  focusSpeaker() {},
  cameraCue() {},
  paperAirplane() {},
  spillCoffee() {},
  extinguisherFoam() {},
  talkingHead() {},
};

/** Spawn waypoint names that start a character seated on top-down sets, whose desks have no chair props. */
const SEAT_WAYPOINT_HINTS = ['desk', 'seat', 'couch', 'booth', 'armchair', 'stool'];
/** Two characters closer than this (px) are on the same seat. */
const SAME_SEAT_PX = 12;

const FACING_ANGLES: Record<string, number> = {
  down: Math.PI / 2,
  up: -Math.PI / 2,
  left: Math.PI,
  right: 0,
};

/** Destination spots tried around an occupied target, nearest first (px). */
const VACANT_OFFSETS: ReadonlyArray<readonly [number, number]> = [
  [-24, 0], [24, 0], [0, 20], [0, -20],
  [-24, 20], [24, 20], [-24, -20], [24, -20],
  [-44, 0], [44, 0], [0, 36], [-44, 20], [44, 20],
];

/**
 * Plays a SitcomScript against a set: owns the timeline, every character's and prop's state,
 * and beat execution. It has no DOM, canvas or audio dependency — those go through
 * StageEffects — so it runs headless in tests.
 *
 * Seeking (jumpTo / prev) rebuilds state by resetting to the episode's opening and replaying
 * every earlier beat silently, so jumping backwards shows the world as it was at that beat.
 */
export class ScriptPlayer {
  setting: SettingDefinition;
  readonly characters: Record<string, CharacterDefinition>;
  readonly characterStates: Map<string, CharacterRuntimeState> = new Map();
  /** Same states as `characterStates`, as an array for allocation-free iteration. */
  states: CharacterRuntimeState[] = [];
  readonly propStates: Map<string, Record<string, any>> = new Map();
  script: SitcomScript | null = null;
  nav: NavGrid;

  sceneIdx = 0;
  beatIdx = 0;
  beatTimer = 0;
  beatDuration = 3000;
  activeTalkingHead: TalkingHeadBeat | null = null;

  private fx: StageEffects;
  private readonly liveFx: StageEffects;
  private readonly events: PlayerEvents;
  private replaying = false;

  constructor(
    setting: SettingDefinition,
    characters: Record<string, CharacterDefinition>,
    effects: StageEffects = NO_EFFECTS,
    events: PlayerEvents = {}
  ) {
    this.setting = setting;
    this.characters = characters;
    this.liveFx = effects;
    this.fx = effects;
    this.events = events;
    this.nav = NavGrid.fromSetting(setting);
    this.initCharacters();
  }

  setSetting(setting: SettingDefinition) {
    this.setting = setting;
    this.nav = NavGrid.fromSetting(setting);
    this.initCharacters();
  }

  /** Places the cast at their spawn points (or default waypoints) in their resting pose. */
  initCharacters() {
    this.characterStates.clear();
    const tileSize = this.setting.tileSize;

    const activeIds = new Set<string>();
    if (this.script && Array.isArray(this.script.characters) && this.script.characters.length > 0) {
      this.script.characters.forEach((id) => activeIds.add(id));
    } else {
      Object.keys(this.setting.spawnPoints).forEach((id) => activeIds.add(id));
    }

    activeIds.forEach((charId) => {
      const char = this.characters[charId];
      if (!char) return;
      const spawn = this.setting.spawnPoints[char.id] || this.setting.waypoints[char.defaultWaypoint];
      const x = spawn ? spawn.x * tileSize : 10 * tileSize;
      const y = spawn ? spawn.y * tileSize : 10 * tileSize;
      const seat = this.setting.projection === 'iso' ? this.seatAt(x, y) : null;
      const isAtSeat = seat ? true : this.setting.projection !== 'iso' && SEAT_WAYPOINT_HINTS.some((hint) => char.defaultWaypoint?.includes(hint));
      this.characterStates.set(char.id, {
        id: char.id,
        x,
        y,
        facing: seat?.facing || spawn?.facing || char.defaultFacing || 'down',
        isMoving: false,
        speed: 1.0,
        animFrame: 0,
        animTimer: 0,
        state: isAtSeat ? 'sitting_desk' : 'idle',
        isSitting: isAtSeat,
      });
    });

    this.states = Array.from(this.characterStates.values());
  }

  load(script: SitcomScript) {
    this.script = script;
    this.resetToOpening();
    this.notifyBeatChange();
    this.executeCurrentBeat();
  }

  currentBeat(): ScriptBeat | null {
    return this.script?.scenes[this.sceneIdx]?.beats[this.beatIdx] ?? null;
  }

  next() {
    if (!this.script) return;
    const scene = this.script.scenes[this.sceneIdx];
    if (!scene) return;

    if (this.beatIdx < scene.beats.length - 1) {
      this.beatIdx++;
    } else if (this.sceneIdx < this.script.scenes.length - 1) {
      this.sceneIdx++;
      this.beatIdx = 0;
      this.enterScene();
    } else {
      this.events.onEpisodeEnd?.();
      this.notifyBeatChange();
      return;
    }
    this.beatTimer = 0;
    this.executeCurrentBeat();
    this.notifyBeatChange();
  }

  prev() {
    if (!this.script) return;
    if (this.beatIdx > 0) {
      this.jumpTo(this.sceneIdx, this.beatIdx - 1);
    } else if (this.sceneIdx > 0) {
      const prevScene = this.script.scenes[this.sceneIdx - 1];
      this.jumpTo(this.sceneIdx - 1, prevScene ? prevScene.beats.length - 1 : 0);
    } else {
      this.jumpTo(0, 0);
    }
  }

  /**
   * Moves the playhead to a beat with the world in the state it would have reached by playing
   * there: everything before it is replayed silently with walks completed instantly.
   */
  jumpTo(sceneIdx: number, beatIdx: number) {
    if (!this.script || this.script.scenes.length === 0) return;
    const targetScene = Math.max(0, Math.min(this.script.scenes.length - 1, sceneIdx));
    const scene = this.script.scenes[targetScene];
    const targetBeat = Math.max(0, Math.min(Math.max(0, scene.beats.length - 1), beatIdx));

    this.resetToOpening();
    this.replaying = true;
    this.fx = {
      ...NO_EFFECTS,
      timeOfDay: (time) => this.liveFx.timeOfDay(time, true),
    };
    try {
      for (let s = 0; s <= targetScene; s++) {
        this.sceneIdx = s;
        if (s > 0) this.enterScene();
        const beats = this.script.scenes[s].beats;
        const end = s === targetScene ? targetBeat : beats.length;
        for (let b = 0; b < end; b++) {
          this.beatIdx = b;
          this.executeCurrentBeat();
          this.completeMovement();
        }
      }
      // Transient overlays from replayed beats would not still be showing.
      for (const state of this.states) {
        state.currentEmote = undefined;
        state.currentSpeech = undefined;
      }
      this.activeTalkingHead = null;
    } finally {
      this.replaying = false;
      this.fx = this.liveFx;
    }

    this.sceneIdx = targetScene;
    this.beatIdx = targetBeat;
    this.beatTimer = 0;
    this.executeCurrentBeat();
    this.notifyBeatChange();
  }

  /** Advances walking, emotes, speech and (when `advanceTimeline`) the beat clock. */
  update(dtMs: number, advanceTimeline: boolean) {
    const dt = dtMs / 1000;
    this.separateStandingCharacters();

    for (let i = 0; i < this.states.length; i++) {
      const state = this.states[i];
      if (state.isMoving) this.walk(state, WALK_SPEED_PX * state.speed * dt);

      if (state.currentEmote) {
        state.currentEmote.timer += dtMs;
        if (state.currentEmote.timer >= state.currentEmote.maxDuration) state.currentEmote = undefined;
      }

      if (state.currentSpeech) {
        const sp = state.currentSpeech;
        sp.elapsed += dtMs;
        const totalChars = sp.text.length;
        const charsPerMs = (totalChars / (sp.totalDuration * 0.7)) * (sp.speedMultiplier || 1.0);
        const targetChars = Math.min(totalChars, Math.floor(sp.elapsed * charsPerMs));
        if (targetChars > sp.charIndex) {
          sp.charIndex = targetChars;
          sp.displayedText = sp.text.slice(0, sp.charIndex);
          if (sp.charIndex % 3 === 0 && sp.charIndex < totalChars) this.fx.sfx('typewriter', 0.2);
        }
      }
    }

    if (advanceTimeline && !this.activeTalkingHead) {
      this.beatTimer += dtMs;
      if (this.beatTimer >= this.beatDuration) this.next();
    }
  }

  private resetToOpening() {
    this.sceneIdx = 0;
    this.beatIdx = 0;
    this.beatTimer = 0;
    this.propStates.clear();
    this.initCharacters();
    this.fx.timeOfDay(this.script?.scenes[0]?.timeOfDay || 'day', true);
    if (this.activeTalkingHead) this.fx.duckMusic(false);
    this.activeTalkingHead = null;
    this.fx.talkingHead(null);
  }

  private enterScene() {
    const tod = this.script?.scenes[this.sceneIdx]?.timeOfDay;
    if (tod) this.fx.timeOfDay(tod, false);
  }

  private notifyBeatChange() {
    if (this.script) this.events.onBeatChange?.(this.sceneIdx, this.beatIdx, this.currentBeat());
  }

  /** Snaps every walker to its destination (used while replaying). */
  private completeMovement() {
    for (const state of this.states) {
      if (state.isMoving) this.walk(state, Infinity);
    }
  }

  /**
   * Moves a walker `budget` pixels along its route, carrying leftover distance across
   * corners so speed stays constant, and settles it on arrival.
   */
  private walk(state: CharacterRuntimeState, budget: number) {
    const route = state.route;
    let idx = state.routeIndex ?? 0;
    if (!route || idx >= route.length) {
      this.arrive(state);
      return;
    }
    let travelled = 0;
    let lastDx = 0;
    let lastDy = 0;
    while (idx < route.length && budget > 0) {
      const p = route[idx];
      const dx = p.x - state.x;
      const dy = p.y - state.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 0) {
        lastDx = dx;
        lastDy = dy;
      }
      if (dist <= budget) {
        state.x = p.x;
        state.y = p.y;
        budget -= dist;
        travelled += dist;
        idx++;
      } else {
        state.x += (dx / dist) * budget;
        state.y += (dy / dist) * budget;
        travelled += budget;
        budget = 0;
      }
    }
    state.routeIndex = idx;

    if (idx >= route.length) {
      if (lastDx !== 0 || lastDy !== 0) faceAlong(state, lastDx, lastDy);
      this.arrive(state);
      return;
    }
    if (lastDx !== 0 || lastDy !== 0) faceAlong(state, lastDx, lastDy);
    if (Number.isFinite(travelled)) advanceWalkCycle(state, travelled);
  }

  private arrive(state: CharacterRuntimeState) {
    state.isMoving = false;
    state.route = undefined;
    state.routeIndex = undefined;
    state.targetX = undefined;
    state.targetY = undefined;
    state.animFrame = 0;
    state.animTimer = 0;
    if (state.targetFacing) {
      state.facing = state.targetFacing;
      state.targetFacing = undefined;
    }
    if (state.sitOnArrival) {
      state.isSitting = true;
      state.sitOnArrival = undefined;
    }
    state.state = state.isSitting ? 'sitting_desk' : 'idle';
  }

  /** Gently pushes apart idle characters standing on top of each other, never into walls. */
  private separateStandingCharacters() {
    const chars = this.states;
    for (let i = 0; i < chars.length; i++) {
      for (let j = i + 1; j < chars.length; j++) {
        const c1 = chars[i];
        const c2 = chars[j];
        if (c1.isMoving || c2.isMoving || c1.isSitting || c2.isSitting) continue;
        const dx = c2.x - c1.x;
        const dy = c2.y - c1.y;
        const dist = Math.hypot(dx, dy);
        const minDist = 18;
        if (dist > 0 && dist < minDist) {
          const push = (minDist - dist) * 0.5 * 0.15;
          const nx = (dx / dist) * push;
          const ny = (dy / dist) * push;
          if (this.nav.isWalkable(c1.x - nx, c1.y - ny)) {
            c1.x -= nx;
            c1.y -= ny;
          }
          if (this.nav.isWalkable(c2.x + nx, c2.y + ny)) {
            c2.x += nx;
            c2.y += ny;
          }
        }
      }
    }
  }

  private executeCurrentBeat() {
    const beat = this.currentBeat();
    if (!beat) return;

    for (const state of this.states) {
      state.currentSpeech = undefined;
      state.currentAction = undefined;
    }

    if (beat.type !== 'talking_head' && this.activeTalkingHead !== null) {
      this.activeTalkingHead = null;
      this.fx.duckMusic(false);
      this.fx.talkingHead(null);
    }

    this.beatDuration = 3000;

    switch (beat.type) {
      case 'dialogue':
        this.runDialogue(beat as DialogueBeat);
        break;
      case 'movement':
        this.beatDuration = this.startMovement(beat as MovementBeat);
        break;
      case 'interaction': {
        const inter = beat as InteractionBeat;
        this.runInteraction(inter);
        this.beatDuration = inter.durationMs || 2000;
        break;
      }
      case 'time_of_day': {
        const tod = beat as TimeOfDayBeat;
        this.fx.timeOfDay(tod.time, false, tod.durationMs);
        this.beatDuration = tod.durationMs || 1500;
        break;
      }
      case 'talking_head': {
        const th = beat as TalkingHeadBeat;
        this.beatDuration = th.durationMs || Math.max(4500, th.monologueText.length * 80);
        // A replayed talking head is already over; only a live one takes the screen.
        if (!this.replaying) {
          this.activeTalkingHead = th;
          this.fx.duckMusic(true);
          if (th.sfx) this.fx.sfx(th.sfx);
          this.fx.talkingHead(th);
        }
        break;
      }
      case 'camera_cue':
        this.runCameraCue(beat as CameraCueBeat);
        break;
      case 'audio_cue': {
        const audio = beat as AudioCueBeat;
        this.fx.sfx(audio.sfx, audio.volume || 1.0);
        this.beatDuration = 1500;
        break;
      }
      case 'emote': {
        const em = beat as EmoteBeat;
        const state = this.characterStates.get(em.character);
        if (state) {
          state.currentEmote = { icon: em.emote, timer: 0, maxDuration: em.durationMs || 2000 };
          if (em.soundEffect) this.fx.sfx(em.soundEffect);
        }
        this.beatDuration = em.durationMs || 2000;
        break;
      }
      case 'group_action':
        this.beatDuration = this.runGroupAction(beat as GroupActionBeat);
        break;
      case 'wait':
        this.beatDuration = beat.durationMs || 2000;
        break;
    }
  }

  private runDialogue(d: DialogueBeat) {
    const state = this.characterStates.get(d.speaker);
    if (!state) return;
    const speedMultiplier = d.speed === 'slow' ? 0.6 : d.speed === 'fast' ? 1.8 : 1.0;
    const readingTime = Math.max(2000, Math.floor((d.text.length * 75) / speedMultiplier));
    this.beatDuration = d.durationMs || readingTime;
    state.currentSpeech = {
      text: d.text,
      displayedText: '',
      charIndex: 0,
      timer: 0,
      emotion: d.emotion || 'neutral',
      totalDuration: this.beatDuration,
      elapsed: 0,
      speedMultiplier,
    };
    if (d.emote) {
      state.currentEmote = { icon: d.emote, timer: 0, maxDuration: Math.min(2500, this.beatDuration) };
    }
    if (d.sfx) this.fx.sfx(d.sfx);
    if (d.cameraFocus !== false) this.fx.focusSpeaker(state.x, state.y - 8);
  }

  private runInteraction(inter: InteractionBeat) {
    const state = this.characterStates.get(inter.character);
    if (!state) return;
    state.currentAction = inter.action;
    if (inter.facing) state.facing = inter.facing;

    switch (inter.action) {
      case 'sit':
        state.isSitting = true;
        state.state = 'sitting_desk';
        break;
      case 'stand':
        state.isSitting = false;
        state.state = 'idle';
        break;
      case 'pickup':
        state.heldItem = (inter.item as HoldableItemType) || 'dundie_trophy';
        state.state = 'holding';
        if (inter.targetProp) this.setPropState(inter.targetProp, { pickedUp: true });
        break;
      case 'place':
        state.heldItem = undefined;
        state.state = 'idle';
        if (inter.targetProp) this.setPropState(inter.targetProp, { pickedUp: false });
        break;
      case 'throw_plane': {
        let tx = state.x + (state.facing === 'left' ? -130 : 130);
        let ty = state.y;
        if (inter.targetProp) {
          const targetChar = this.characterStates.get(inter.targetProp);
          const targetWp = this.setting.waypoints[inter.targetProp];
          if (targetChar) {
            tx = targetChar.x;
            ty = targetChar.y;
          } else if (targetWp) {
            tx = targetWp.x * this.setting.tileSize;
            ty = targetWp.y * this.setting.tileSize;
          }
        }
        this.fx.paperAirplane(state.x, state.y, tx, ty);
        state.heldItem = undefined;
        break;
      }
      case 'spill_coffee':
        this.fx.spillCoffee(state.x, state.y + 8);
        state.heldItem = undefined;
        state.state = 'shocked';
        this.fx.shake(0.25, 5);
        break;
      case 'drink_coffee':
        state.heldItem = 'coffee_mug';
        state.state = 'drinking';
        break;
      case 'eat_pretzel':
      case 'eat_snack':
        state.heldItem = 'pretzel';
        state.state = 'eating';
        break;
      case 'type_pc':
        state.isSitting = true;
        state.state = 'typing';
        state.heldItem = undefined;
        if (!inter.sfx) this.fx.sfx('typewriter', 0.4);
        break;
      case 'use_photocopier':
        state.heldItem = 'paper_sheet';
        state.state = 'holding';
        if (!inter.sfx) this.fx.sfx('typewriter', 0.5);
        break;
      case 'extinguish':
        this.fx.extinguisherFoam(state.x, state.y, FACING_ANGLES[state.facing] || 0);
        if (inter.targetProp) this.setPropState(inter.targetProp, { ignited: false });
        break;
      case 'ignite':
        if (inter.targetProp) {
          this.setPropState(inter.targetProp, { ignited: true });
          this.fx.shake(0.4, 8);
        }
        break;
      case 'slam_desk':
        this.fx.shake(0.35, 7);
        if (!inter.sfx) this.fx.sfx('dramatic_boom', 0.5);
        break;
      case 'kick':
        this.fx.shake(0.2, 4);
        break;
      case 'give_dundie':
        state.heldItem = 'dundie_trophy';
        if (!inter.sfx) this.fx.sfx('theme_jingle');
        break;
    }

    if (inter.sfx) this.fx.sfx(inter.sfx);
  }

  private runCameraCue(cam: CameraCueBeat) {
    this.beatDuration = cam.durationMs || 1800;
    if (cam.target === 'overview') {
      this.fx.cameraCue(cam, null);
      return;
    }
    if (typeof cam.target === 'object') {
      this.fx.cameraCue(cam, cam.target);
      return;
    }
    const charState = this.characterStates.get(cam.target);
    const waypoint = this.setting.waypoints[cam.target];
    if (charState) {
      if (cam.style === 'jim_stare') {
        charState.currentAction = 'jim_stare';
        charState.state = 'camera_stare';
      }
      this.fx.cameraCue(cam, { x: charState.x, y: charState.y - 8 });
    } else if (waypoint) {
      this.fx.cameraCue(cam, { x: waypoint.x * this.setting.tileSize, y: waypoint.y * this.setting.tileSize });
    }
  }

  private runGroupAction(grp: GroupActionBeat): number {
    let maxDur = grp.durationMs || 2500;
    for (const sub of grp.actions) {
      if ('durationMs' in sub && sub.durationMs && sub.durationMs > maxDur) maxDur = sub.durationMs;

      if (sub.type === 'movement') {
        maxDur = Math.max(maxDur, this.startMovement(sub));
      } else if (sub.type === 'emote') {
        const st = this.characterStates.get(sub.character);
        if (st) {
          st.currentEmote = { icon: sub.emote, timer: 0, maxDuration: sub.durationMs || 2500 };
          if (sub.soundEffect) this.fx.sfx(sub.soundEffect);
        }
      } else if (sub.type === 'dialogue') {
        const st = this.characterStates.get(sub.speaker);
        if (this.characters[sub.speaker] && st) {
          st.currentSpeech = {
            text: sub.text,
            displayedText: sub.text,
            charIndex: sub.text.length,
            timer: 0,
            emotion: sub.emotion || 'neutral',
            totalDuration: sub.durationMs || 3500,
            elapsed: 0,
          };
          if (sub.emote) st.currentEmote = { icon: sub.emote, timer: 0, maxDuration: 2500 };
          if (sub.sfx) this.fx.sfx(sub.sfx);
        }
      } else if (sub.type === 'interaction') {
        const st = this.characterStates.get(sub.character);
        if (st) {
          if (sub.facing) st.facing = sub.facing;
          if (sub.action === 'sit') st.isSitting = true;
          else if (sub.action === 'stand') st.isSitting = false;
          else if (sub.action === 'drink_coffee') st.heldItem = 'coffee_mug';
          else if (sub.action === 'pickup') st.heldItem = 'clipboard';
          else if (sub.action === 'place') st.heldItem = undefined;
          else if (sub.action === 'type_pc') {
            st.isSitting = true;
            st.heldItem = undefined;
          } else if (sub.action === 'ignite' && sub.targetProp) this.setPropState(sub.targetProp, { ignited: true });
          else if (sub.action === 'extinguish' && sub.targetProp) this.setPropState(sub.targetProp, { ignited: false });
          if (sub.sfx) this.fx.sfx(sub.sfx);
        }
      } else if (sub.type === 'audio_cue') {
        this.fx.sfx(sub.sfx, sub.volume || 1.0);
      } else if (sub.type === 'time_of_day') {
        this.fx.timeOfDay(sub.time, false);
      }
    }
    return maxDur;
  }

  private setPropState(propId: string, patch: Record<string, any>) {
    this.propStates.set(propId, { ...(this.propStates.get(propId) || {}), ...patch });
  }

  /**
   * Resolves a movement target to world pixels, and the seat there if it is one: walking to a
   * seat ends sitting in it, facing the way it faces.
   */
  private resolveTarget(
    m: MovementBeat,
    state: CharacterRuntimeState
  ): { x: number; y: number; seat: { facing?: Direction } | null } {
    const T = this.setting.tileSize;
    if (typeof m.target === 'object' && m.target !== null) {
      const x = m.target.x * T;
      const y = m.target.y * T;
      return { x, y, seat: this.seatAt(x, y) };
    }
    if (typeof m.target === 'string') {
      const wp = this.setting.waypoints[m.target];
      if (wp) {
        const x = wp.x * T;
        const y = wp.y * T;
        const seat = this.seatAt(x, y);
        // Top-down props carry no facing: sit the way the waypoint (or the beat) says.
        return { x, y, seat: seat && { facing: seat.facing || m.facing || wp.facing } };
      }
      const targetChar = this.characterStates.get(m.target);
      if (targetChar) return { x: targetChar.x, y: targetChar.y, seat: null };
      const prop = this.setting.props.find((p) => p.id === m.target);
      if (prop) {
        return { x: (prop.x + (prop.width || 1) * 0.5) * T, y: (prop.y + (prop.height || 1) * 0.5) * T, seat: null };
      }
    }
    return { x: state.x, y: state.y, seat: null };
  }

  private seatAt(x: number, y: number): { facing?: Direction } | null {
    return seatAt(this.setting, x, y);
  }

  /** Whether someone else is sitting at (or walking to sit at) this spot. */
  private seatTaken(movingId: string, x: number, y: number): boolean {
    for (const other of this.states) {
      if (other.id === movingId) continue;
      const ox = other.sitOnArrival && other.targetX !== undefined ? other.targetX : other.x;
      const oy = other.sitOnArrival && other.targetY !== undefined ? other.targetY : other.y;
      if ((other.isSitting || other.sitOnArrival) && Math.hypot(x - ox, y - oy) < SAME_SEAT_PX) return true;
    }
    return false;
  }

  /** Picks a free spot at or near the target so two characters don't end up stacked. */
  private findVacantDestination(movingId: string, x: number, y: number, isSeat: boolean): PathPoint {
    if (isSeat) return { x, y };
    const T = this.setting.tileSize;
    const minX = 2 * T;
    const maxX = (this.setting.gridWidth - 2) * T;
    const minY = 2 * T;
    const maxY = (this.setting.gridHeight - 2) * T;

    const isOccupied = (tx: number, ty: number): boolean => {
      for (const other of this.states) {
        if (other.id === movingId) continue;
        const ox = other.targetX !== undefined ? other.targetX : other.x;
        const oy = other.targetY !== undefined ? other.targetY : other.y;
        if (Math.hypot(tx - ox, ty - oy) < 22) return true;
      }
      return false;
    };

    if (!isOccupied(x, y)) return { x, y };
    for (const [dx, dy] of VACANT_OFFSETS) {
      const cx = Math.max(minX, Math.min(maxX, x + dx));
      const cy = Math.max(minY, Math.min(maxY, y + dy));
      // Prefer spots on open floor so the walker doesn't end inside furniture.
      if (!isOccupied(cx, cy) && this.nav.isWalkable(cx, cy)) return { x: cx, y: cy };
    }
    return { x, y };
  }

  /** Starts a walk along a routed path; returns the beat duration it implies. */
  private startMovement(m: MovementBeat): number {
    const state = this.characterStates.get(m.character);
    if (!state) return m.durationMs || 1200;

    const target = this.resolveTarget(m, state);
    const seat = target.seat && !this.seatTaken(m.character, target.x, target.y) ? target.seat : null;
    const dest = this.findVacantDestination(m.character, target.x, target.y, seat !== null);
    const route = this.nav.findPath(state, dest) ?? [dest];

    state.targetX = dest.x;
    state.targetY = dest.y;
    state.route = route;
    state.routeIndex = 0;
    state.isMoving = true;
    state.isSitting = false;
    state.sitOnArrival = seat !== null;
    state.targetFacing = seat?.facing || m.facing;

    let gait = 1.0;
    if (m.animationState === 'run') {
      gait = 1.8;
      state.animSpeed = 0.09;
      state.state = 'running';
    } else if (m.animationState === 'tiptoe') {
      gait = 0.55;
      state.animSpeed = 0.25;
      state.state = 'tiptoeing';
    } else if (m.animationState === 'sneak') {
      gait = 0.65;
      state.animSpeed = 0.22;
      state.state = 'sneaking';
    } else {
      state.animSpeed = 0.16;
      state.state = 'walking';
    }
    state.speed = (m.speed || 1.0) * gait;
    if (m.facing) state.facing = m.facing;

    // Beat length follows the routed distance, not the straight line.
    const dist = NavGrid.pathLength(state, route);
    const speedPx = WALK_SPEED_PX * state.speed;
    const calc = Math.max(1200, Math.min(5500, (dist / Math.max(20, speedPx)) * 1000 + 400));
    return m.durationMs || calc;
  }
}
