import { SettingDefinition, PropInstance, Waypoint } from '../types/environment';
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
  TimeOfDay,
} from '../types/script';
import { TileRenderer } from './TileRenderer';
import { CharacterRenderer } from './CharacterRenderer';
import { SpeechBubbleRenderer } from './SpeechBubble';
import { Camera } from './Camera';
import { soundEngine } from './SoundEngine';
import { particleSystem } from './ParticleSystem';
import { lightingEngine } from './LightingEngine';

export interface VisualizerCallbacks {
  onBeatChange?: (sceneIndex: number, beatIndex: number, currentBeat: ScriptBeat | null) => void;
  onTalkingHead?: (data: TalkingHeadBeat | null) => void;
  onPlaybackStateChange?: (isPlaying: boolean) => void;
  onEpisodeEnd?: () => void;
  onSelectEntity?: (entity: { type: 'character' | 'prop'; data: any } | null) => void;
}

export class VisualizerEngine {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animFrameId: number | null = null;
  private lastTime: number = 0;

  // Configuration & Data
  public setting: SettingDefinition;
  public charactersMap: Record<string, CharacterDefinition>;
  public characterStates: Map<string, CharacterRuntimeState> = new Map();
  public script: SitcomScript | null = null;
  public camera: Camera;

  // Playback Timeline
  public isPlaying: boolean = false;
  public playbackSpeed: number = 1.0;
  public currentSceneIdx: number = 0;
  public currentBeatIdx: number = 0;
  public beatTimer: number = 0;
  public beatDuration: number = 3000;
  public activeTalkingHead: TalkingHeadBeat | null = null;
  public gameTime: number = 0;

  // Camera tracking mode: 'auto' | 'free'
  public cameraMode: 'auto' | 'free' = 'auto';
  public allowCameraJumps: boolean = true;
  public showWaypoints: boolean = false;
  public showNameTags: boolean = true;

  // Prop dynamic states (e.g. ignited, occupied)
  public propStates: Map<string, Record<string, any>> = new Map();

  // Callbacks
  private callbacks: VisualizerCallbacks = {};

  // Offscreen static tilemap cache to eliminate per-frame grid redraw overhead
  private tileCanvas: HTMLCanvasElement | null = null;
  private tileCtx: CanvasRenderingContext2D | null = null;
  private isTileMapDirty: boolean = true;

  // Cached render queue & character array to eliminate per-frame GC allocations
  private renderQueue: Array<{ yOrder: number; draw: () => void }> = [];
  private cachedCharStates: CharacterRuntimeState[] = [];

  constructor(
    setting: SettingDefinition,
    characters: Record<string, CharacterDefinition>,
    callbacks?: VisualizerCallbacks
  ) {
    this.setting = setting;
    this.charactersMap = characters;
    this.camera = new Camera(
      setting.defaultCamera.x,
      setting.defaultCamera.y,
      setting.defaultCamera.zoom
    );
    if (callbacks) this.callbacks = callbacks;
    this.initCharacters();
  }

  public setCanvas(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    if (this.ctx) {
      this.ctx.imageSmoothingEnabled = false; // Crisp pixel rendering
    }
  }

  public setCallbacks(callbacks: VisualizerCallbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  public setAllowCameraJumps(allow: boolean) {
    this.allowCameraJumps = allow;
  }

  public getSafeTargetZoom(requestedZoom: number): number {
    const isMobile = this.canvas
      ? this.canvas.width / (window.devicePixelRatio || 1) < 768
      : false;
    if (isMobile) {
      // Mobile screens need wider framing so speech bubbles and surrounding context are never cut off
      return Math.max(0.6, Math.min(0.95, requestedZoom * 0.7));
    }
    // Desktop screens: clamp comfortably between 0.85 and 1.35
    return Math.max(0.85, Math.min(1.35, requestedZoom));
  }

  public setSetting(setting: SettingDefinition) {
    this.setting = setting;
    this.isTileMapDirty = true;
    this.camera.snapTo(
      setting.defaultCamera.x,
      setting.defaultCamera.y,
      setting.defaultCamera.zoom
    );
    this.initCharacters();
  }

  public initCharacters() {
    this.characterStates.clear();
    const tileSize = this.setting.tileSize;

    // Filter characters to ONLY those belonging to the active script or setting
    const activeCharIds = new Set<string>();

    if (this.script && Array.isArray(this.script.characters) && this.script.characters.length > 0) {
      this.script.characters.forEach((id) => activeCharIds.add(id));
    } else {
      Object.keys(this.setting.spawnPoints).forEach((id) => activeCharIds.add(id));
    }

    activeCharIds.forEach((charId) => {
      const char = this.charactersMap[charId];
      if (!char) return;

      // Find spawn point or default waypoint
      const spawn = this.setting.spawnPoints[char.id] || this.setting.waypoints[char.defaultWaypoint];
      const startX = spawn ? spawn.x * tileSize : 10 * tileSize;
      const startY = spawn ? spawn.y * tileSize : 10 * tileSize;

      const isAtDesk =
        char.defaultWaypoint?.includes('desk') ||
        char.defaultWaypoint?.includes('seat') ||
        char.defaultWaypoint?.includes('couch') ||
        char.defaultWaypoint?.includes('booth') ||
        char.defaultWaypoint?.includes('armchair');

      this.characterStates.set(char.id, {
        id: char.id,
        x: startX,
        y: startY,
        facing: spawn?.facing || char.defaultFacing || 'down',
        isMoving: false,
        speed: 1.0,
        animFrame: 0,
        animTimer: 0,
        isSitting: isAtDesk,
      });
    });

    this.cachedCharStates = Array.from(this.characterStates.values());
    this.isTileMapDirty = true;
  }

  public loadScript(script: SitcomScript) {
    this.script = script;
    this.currentSceneIdx = 0;
    this.currentBeatIdx = 0;
    this.beatTimer = 0;
    this.activeTalkingHead = null;
    this.propStates.clear();
    this.initCharacters();
    this.isTileMapDirty = true;

    if (script.scenes[0]?.timeOfDay) {
      lightingEngine.setTimeOfDay(script.scenes[0].timeOfDay, true);
    } else {
      lightingEngine.setTimeOfDay('day', true);
    }

    if (this.callbacks.onTalkingHead) {
      this.callbacks.onTalkingHead(null);
    }
    this.notifyBeatChange();
    this.executeCurrentBeat();
  }

  public start() {
    if (!this.animFrameId) {
      this.lastTime = performance.now();
      this.animFrameId = requestAnimationFrame(this.gameLoop.bind(this));
    }
  }

  public stop() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  public play() {
    this.isPlaying = true;
    if (this.callbacks.onPlaybackStateChange) {
      this.callbacks.onPlaybackStateChange(true);
    }
  }

  public pause() {
    this.isPlaying = false;
    if (this.callbacks.onPlaybackStateChange) {
      this.callbacks.onPlaybackStateChange(false);
    }
  }

  public togglePlay() {
    if (this.isPlaying) this.pause();
    else this.play();
  }

  public setPlaybackSpeed(speed: number) {
    this.playbackSpeed = Math.max(0.25, Math.min(4.0, speed));
  }

  public nextBeat() {
    if (!this.script) return;
    const currentScene = this.script.scenes[this.currentSceneIdx];
    if (!currentScene) return;

    if (this.currentBeatIdx < currentScene.beats.length - 1) {
      this.currentBeatIdx++;
      this.beatTimer = 0;
      this.executeCurrentBeat();
    } else if (this.currentSceneIdx < this.script.scenes.length - 1) {
      this.currentSceneIdx++;
      this.currentBeatIdx = 0;
      this.beatTimer = 0;
      this.executeCurrentBeat();
    } else {
      // Reached the end of episode
      this.pause();
      if (this.callbacks.onEpisodeEnd) {
        this.callbacks.onEpisodeEnd();
      }
    }
    this.notifyBeatChange();
  }

  public prevBeat() {
    if (!this.script) return;
    if (this.currentBeatIdx > 0) {
      this.currentBeatIdx--;
      this.beatTimer = 0;
      this.executeCurrentBeat();
    } else if (this.currentSceneIdx > 0) {
      this.currentSceneIdx--;
      const prevScene = this.script.scenes[this.currentSceneIdx];
      this.currentBeatIdx = prevScene ? Math.max(0, prevScene.beats.length - 1) : 0;
      this.beatTimer = 0;
      this.executeCurrentBeat();
    }
    this.notifyBeatChange();
  }

  public jumpToBeat(sceneIdx: number, beatIdx: number) {
    if (!this.script) return;
    this.currentSceneIdx = Math.max(0, Math.min(this.script.scenes.length - 1, sceneIdx));
    const scene = this.script.scenes[this.currentSceneIdx];
    if (scene) {
      this.currentBeatIdx = Math.max(0, Math.min(scene.beats.length - 1, beatIdx));
      this.beatTimer = 0;
      this.executeCurrentBeat();
      this.notifyBeatChange();
    }
  }

  private notifyBeatChange() {
    if (this.callbacks.onBeatChange && this.script) {
      const scene = this.script.scenes[this.currentSceneIdx];
      const beat = scene?.beats[this.currentBeatIdx] || null;
      this.callbacks.onBeatChange(this.currentSceneIdx, this.currentBeatIdx, beat);
    }
  }

  private executeCurrentBeat() {
    if (!this.script) return;
    const scene = this.script.scenes[this.currentSceneIdx];
    if (!scene) return;
    const beat = scene.beats[this.currentBeatIdx];
    if (!beat) return;

    // Reset temporary actions
    this.characterStates.forEach((state) => {
      state.currentSpeech = undefined;
      state.currentAction = undefined;
    });

    if (beat.type !== 'talking_head' && this.activeTalkingHead !== null) {
      this.activeTalkingHead = null;
      if (this.callbacks.onTalkingHead) {
        this.callbacks.onTalkingHead(null);
      }
    }

    // Default duration
    this.beatDuration = 3000;

    switch (beat.type) {
      case 'dialogue': {
        const d = beat as DialogueBeat;
        const state = this.characterStates.get(d.speaker);
        if (state) {
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
            state.currentEmote = {
              icon: d.emote,
              timer: 0,
              maxDuration: Math.min(2500, this.beatDuration),
            };
          }
          if (d.sfx) {
            soundEngine.playSfx(d.sfx);
          }
          // Only move camera if allowed and in auto director mode
          if (this.cameraMode === 'auto' && this.allowCameraJumps && d.cameraFocus !== false) {
            const zoom = this.getSafeTargetZoom(1.15);
            this.camera.setTarget(state.x, state.y - 8, zoom);
          }
        }
        break;
      }

      case 'movement': {
        const m = beat as MovementBeat;
        this.startCharacterMovement(m);
        break;
      }

      case 'interaction': {
        const inter = beat as InteractionBeat;
        const state = this.characterStates.get(inter.character);
        if (state) {
          state.currentAction = inter.action;
          if (inter.action === 'sit') state.isSitting = true;
          if (inter.action === 'stand') state.isSitting = false;

          // Pickup Item
          if (inter.action === 'pickup') {
            state.heldItem = (inter.item as HoldableItemType) || 'dundie_trophy';
            if (inter.targetProp) {
              const pState = this.propStates.get(inter.targetProp) || {};
              pState.pickedUp = true;
              this.propStates.set(inter.targetProp, pState);
            }
          }

          // Place Item
          if (inter.action === 'place') {
            state.heldItem = undefined;
            if (inter.targetProp) {
              const pState = this.propStates.get(inter.targetProp) || {};
              pState.pickedUp = false;
              this.propStates.set(inter.targetProp, pState);
            }
          }

          // Throw Paper Airplane
          if (inter.action === 'throw_plane') {
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
            particleSystem.throwPaperAirplane(state.x, state.y, tx, ty);
            state.heldItem = undefined;
          }

          // Spill Coffee
          if (inter.action === 'spill_coffee') {
            particleSystem.spillCoffee(state.x, state.y + 8);
            state.heldItem = undefined;
            this.camera.shake(0.25, 5);
          }

          // Drink / Eat
          if (inter.action === 'drink_coffee') {
            state.heldItem = 'coffee_mug';
          }
          if (inter.action === 'eat_pretzel') {
            state.heldItem = 'pretzel';
          }
          if (inter.action === 'eat_snack') {
            state.heldItem = 'pretzel';
          }

          // PC Typing
          if (inter.action === 'type_pc') {
            state.isSitting = true;
            state.heldItem = undefined;
            if (inter.sfx) soundEngine.playSfx(inter.sfx);
            else soundEngine.playSfx('typewriter', 0.4);
          }

          // Photocopier
          if (inter.action === 'use_photocopier') {
            state.heldItem = 'paper_sheet';
            if (inter.sfx) soundEngine.playSfx(inter.sfx);
            else soundEngine.playSfx('typewriter', 0.5);
          }

          // Fire Extinguisher Foam
          if (inter.action === 'extinguish') {
            const facingAngles: Record<string, number> = {
              down: Math.PI / 2,
              up: -Math.PI / 2,
              left: Math.PI,
              right: 0,
            };
            particleSystem.shootExtinguisherFoam(state.x, state.y, facingAngles[state.facing] || 0);
            if (inter.targetProp) {
              const pState = this.propStates.get(inter.targetProp) || {};
              pState.ignited = false;
              this.propStates.set(inter.targetProp, pState);
            }
          }

          // Ignite Fire
          if (inter.action === 'ignite') {
            if (inter.targetProp) {
              const pState = this.propStates.get(inter.targetProp) || {};
              pState.ignited = true;
              this.propStates.set(inter.targetProp, pState);
              this.camera.shake(0.4, 8);
            }
          }

          // Slam Desk & Kick
          if (inter.action === 'slam_desk') {
            this.camera.shake(0.35, 7);
            if (inter.sfx) soundEngine.playSfx(inter.sfx);
            else soundEngine.playSfx('dramatic_boom', 0.5);
          }
          if (inter.action === 'kick') {
            this.camera.shake(0.2, 4);
          }

          // Give Dundie
          if (inter.action === 'give_dundie') {
            state.heldItem = 'dundie_trophy';
            if (inter.sfx) soundEngine.playSfx(inter.sfx);
            else soundEngine.playSfx('theme_jingle');
          }

          if (inter.sfx) soundEngine.playSfx(inter.sfx);
        }
        this.beatDuration = inter.durationMs || 2000;
        break;
      }

      case 'time_of_day': {
        const tod = beat as TimeOfDayBeat;
        lightingEngine.setTimeOfDay(tod.time, false, tod.durationMs);
        this.beatDuration = tod.durationMs || 1500;
        break;
      }

      case 'talking_head': {
        const th = beat as TalkingHeadBeat;
        this.activeTalkingHead = th;
        this.beatDuration = th.durationMs || Math.max(4500, th.monologueText.length * 80);
        if (th.sfx) soundEngine.playSfx(th.sfx);
        if (this.callbacks.onTalkingHead) {
          this.callbacks.onTalkingHead(th);
        }
        break;
      }

      case 'camera_cue': {
        const cam = beat as CameraCueBeat;
        if (this.cameraMode === 'auto' && this.allowCameraJumps) {
          const rawZoom = cam.zoom || 1.15;
          const zoom = this.getSafeTargetZoom(rawZoom);

          if (cam.target === 'overview') {
            if (this.canvas) {
              const dpr = window.devicePixelRatio || 1;
              const rectW = this.canvas.width / dpr;
              const rectH = this.canvas.height / dpr;
              const worldW = this.setting.gridWidth * this.setting.tileSize;
              const worldH = this.setting.gridHeight * this.setting.tileSize;
              if (cam.style === 'cut') {
                const fitZoom = Math.max(this.camera.minZoom, Math.min(1.4, Math.min((rectW * 0.92) / worldW, (rectH * 0.92) / worldH)));
                this.camera.snapTo(worldW / 2, worldH / 2, fitZoom);
              } else {
                this.camera.fitToViewport(rectW, rectH, worldW, worldH);
              }
            } else {
              this.camera.setTarget(
                this.setting.defaultCamera.x,
                this.setting.defaultCamera.y,
                this.setting.defaultCamera.zoom
              );
            }
          } else if (typeof cam.target === 'string') {
            const charState = this.characterStates.get(cam.target);
            const waypoint = this.setting.waypoints[cam.target];
            const targetX = charState ? charState.x : waypoint ? waypoint.x * this.setting.tileSize : undefined;
            const targetY = charState ? charState.y - 8 : waypoint ? waypoint.y * this.setting.tileSize : undefined;

            if (targetX !== undefined && targetY !== undefined) {
              if (cam.style === 'jim_stare' && charState) {
                charState.currentAction = 'jim_stare';
                this.camera.shake(0.2, 4);
              }

              if (cam.style === 'cut') {
                this.camera.snapTo(targetX, targetY, zoom);
              } else if (cam.style === 'dramatic_zoom') {
                const dramaticZoom = Math.min(this.camera.maxZoom, zoom * 1.35);
                this.camera.setTarget(targetX, targetY, dramaticZoom);
              } else {
                this.camera.setTarget(targetX, targetY, zoom);
              }
            }
          } else if (typeof cam.target === 'object') {
            if (cam.style === 'cut') {
              this.camera.snapTo(cam.target.x, cam.target.y, zoom);
            } else {
              this.camera.setTarget(cam.target.x, cam.target.y, zoom);
            }
          }
        }
        this.beatDuration = cam.durationMs || 1800;
        break;
      }

      case 'audio_cue': {
        const audio = beat as AudioCueBeat;
        soundEngine.playSfx(audio.sfx, audio.volume || 1.0);
        this.beatDuration = 1500;
        break;
      }

      case 'emote': {
        const em = beat as EmoteBeat;
        const state = this.characterStates.get(em.character);
        if (state) {
          state.currentEmote = {
            icon: em.emote,
            timer: 0,
            maxDuration: em.durationMs || 2000,
          };
          if (em.soundEffect) soundEngine.playSfx(em.soundEffect);
        }
        this.beatDuration = em.durationMs || 2000;
        break;
      }

      case 'group_action': {
        const grp = beat as GroupActionBeat;
        let maxDur = 2500;
        grp.actions.forEach((subAction) => {
          if ('durationMs' in subAction && subAction.durationMs && subAction.durationMs > maxDur) {
            maxDur = subAction.durationMs;
          }
          if (subAction.type === 'movement') {
            this.startCharacterMovement(subAction);
          } else if (subAction.type === 'emote') {
            const st = this.characterStates.get(subAction.character);
            if (st) {
              st.currentEmote = {
                icon: subAction.emote,
                timer: 0,
                maxDuration: subAction.durationMs || 2500,
              };
              if (subAction.soundEffect) soundEngine.playSfx(subAction.soundEffect);
            }
          } else if (subAction.type === 'dialogue') {
            const char = this.charactersMap[subAction.speaker];
            const st = this.characterStates.get(subAction.speaker);
            if (char && st) {
              st.currentSpeech = {
                text: subAction.text,
                displayedText: subAction.text,
                charIndex: subAction.text.length,
                timer: 0,
                emotion: subAction.emotion || 'neutral',
                totalDuration: subAction.durationMs || 3500,
                elapsed: 0,
              };
              if (subAction.emote) {
                st.currentEmote = {
                  icon: subAction.emote,
                  timer: 0,
                  maxDuration: 2500,
                };
              }
              if (subAction.sfx) soundEngine.playSfx(subAction.sfx);
            }
          } else if (subAction.type === 'interaction') {
            const st = this.characterStates.get(subAction.character);
            if (st) {
              if (subAction.facing) st.facing = subAction.facing;
              if (subAction.action === 'sit') st.isSitting = true;
              else if (subAction.action === 'stand') st.isSitting = false;
              else if (subAction.action === 'drink_coffee') st.heldItem = 'coffee_mug';
              else if (subAction.action === 'pickup') st.heldItem = 'clipboard';
              else if (subAction.action === 'place') st.heldItem = undefined;
              else if (subAction.action === 'type_pc') { st.isSitting = true; st.heldItem = undefined; }
              else if (subAction.action === 'ignite' && subAction.targetProp) {
                this.propStates.set(subAction.targetProp, {
                  ...(this.propStates.get(subAction.targetProp) || {}),
                  ignited: true,
                });
              } else if (subAction.action === 'extinguish' && subAction.targetProp) {
                this.propStates.set(subAction.targetProp, {
                  ...(this.propStates.get(subAction.targetProp) || {}),
                  ignited: false,
                });
              }
              if (subAction.sfx) soundEngine.playSfx(subAction.sfx);
            }
          } else if (subAction.type === 'audio_cue') {
            soundEngine.playSfx(subAction.sfx, subAction.volume || 1.0);
          } else if (subAction.type === 'time_of_day') {
            lightingEngine.setTimeOfDay(subAction.time);
          }
        });
        this.beatDuration = maxDur;
        break;
      }

      case 'wait': {
        this.beatDuration = beat.durationMs || 2000;
        break;
      }
    }
  }

  private findVacantDestination(
    movingCharId: string,
    rawTargetX: number,
    rawTargetY: number,
    isDeskWaypoint: boolean
  ): { x: number; y: number } {
    if (isDeskWaypoint) {
      return { x: rawTargetX, y: rawTargetY };
    }

    const tileSize = this.setting.tileSize;
    const minBoundX = 2 * tileSize;
    const maxBoundX = (this.setting.gridWidth - 2) * tileSize;
    const minBoundY = 2 * tileSize;
    const maxBoundY = (this.setting.gridHeight - 2) * tileSize;

    // Check if destination is occupied by another character
    const isOccupied = (tx: number, ty: number): boolean => {
      for (const [id, other] of this.characterStates.entries()) {
        if (id === movingCharId) continue;
        const otherDestX = other.targetX !== undefined ? other.targetX : other.x;
        const otherDestY = other.targetY !== undefined ? other.targetY : other.y;
        if (Math.hypot(tx - otherDestX, ty - otherDestY) < 22) {
          return true;
        }
      }
      return false;
    };

    if (!isOccupied(rawTargetX, rawTargetY)) {
      return { x: rawTargetX, y: rawTargetY };
    }

    // Spot candidate offsets arranged in surrounding clusters
    const offsets = [
      { dx: -24, dy: 0 },
      { dx: 24, dy: 0 },
      { dx: 0, dy: 20 },
      { dx: 0, dy: -20 },
      { dx: -24, dy: 20 },
      { dx: 24, dy: 20 },
      { dx: -24, dy: -20 },
      { dx: 24, dy: -20 },
      { dx: -44, dy: 0 },
      { dx: 44, dy: 0 },
      { dx: 0, dy: 36 },
      { dx: -44, dy: 20 },
      { dx: 44, dy: 20 },
    ];

    for (const offset of offsets) {
      const candidateX = Math.max(minBoundX, Math.min(maxBoundX, rawTargetX + offset.dx));
      const candidateY = Math.max(minBoundY, Math.min(maxBoundY, rawTargetY + offset.dy));

      if (!isOccupied(candidateX, candidateY)) {
        return { x: candidateX, y: candidateY };
      }
    }

    return { x: rawTargetX, y: rawTargetY };
  }

  private startCharacterMovement(m: MovementBeat) {
    const state = this.characterStates.get(m.character);
    if (!state) return;

    let targetX = state.x;
    let targetY = state.y;
    let isDesk = false;

    if (typeof m.target === 'string') {
      const wp = this.setting.waypoints[m.target];
      if (wp) {
        targetX = wp.x * this.setting.tileSize;
        targetY = wp.y * this.setting.tileSize;
        isDesk = m.target.includes('seat') || m.target.includes('desk');
      }
    } else if (typeof m.target === 'object') {
      targetX = m.target.x * this.setting.tileSize;
      targetY = m.target.y * this.setting.tileSize;
    }

    const vacantSpot = this.findVacantDestination(m.character, targetX, targetY, isDesk);

    state.targetX = vacantSpot.x;
    state.targetY = vacantSpot.y;
    state.isMoving = true;
    state.isSitting = false;

    // Movement animation state multipliers
    let animSpeedMultiplier = 1.0;
    if (m.animationState === 'run') {
      animSpeedMultiplier = 1.8;
      state.animSpeed = 0.09;
    } else if (m.animationState === 'tiptoe') {
      animSpeedMultiplier = 0.55;
      state.animSpeed = 0.25;
    } else if (m.animationState === 'sneak') {
      animSpeedMultiplier = 0.65;
      state.animSpeed = 0.22;
    } else {
      animSpeedMultiplier = 1.0;
      state.animSpeed = 0.16;
    }

    state.speed = (m.speed || 1.0) * animSpeedMultiplier;
    if (m.facing) state.facing = m.facing;

    // Dynamic duration computed from Euclidean travel distance
    const dist = Math.hypot(vacantSpot.x - state.x, vacantSpot.y - state.y);
    const speedPx = 110 * state.speed;
    const calcDuration = Math.max(1200, Math.min(5500, (dist / Math.max(20, speedPx)) * 1000 + 400));
    this.beatDuration = m.durationMs || calcDuration;
  }

  private updateSimulation(dt: number) {
    const scaledDt = dt * this.playbackSpeed;

    // Update Simulation Time (game clock)
    if (this.isPlaying) {
      this.gameTime += scaledDt * 1000;
    }

    // Update Camera
    this.camera.update(scaledDt);

    // Soft separation between standing characters so they never directly overlap
    const charArray = this.cachedCharStates;
    for (let i = 0; i < charArray.length; i++) {
      for (let j = i + 1; j < charArray.length; j++) {
        const c1 = charArray[i];
        const c2 = charArray[j];
        if (c1.isMoving || c2.isMoving || c1.isSitting || c2.isSitting) continue;

        const dx = c2.x - c1.x;
        const dy = c2.y - c1.y;
        const dist = Math.hypot(dx, dy);
        const minDist = 18;

        if (dist > 0 && dist < minDist) {
          const push = (minDist - dist) * 0.5;
          const nx = dx / dist;
          const ny = dy / dist;
          c1.x -= nx * push * 0.15;
          c1.y -= ny * push * 0.15;
          c2.x += nx * push * 0.15;
          c2.y += ny * push * 0.15;
        }
      }
    }

    // Update Characters movement & typewriter speech
    for (let i = 0; i < this.cachedCharStates.length; i++) {
      const state = this.cachedCharStates[i];

      // Movement interpolation
      if (state.isMoving && state.targetX !== undefined && state.targetY !== undefined) {
        const dx = state.targetX - state.x;
        const dy = state.targetY - state.y;
        const dist = Math.hypot(dx, dy);

        // Movement speed in pixels per second
        const moveSpeed = 110 * state.speed * scaledDt;

        if (dist <= moveSpeed || dist < 2) {
          state.x = state.targetX;
          state.y = state.targetY;
          state.isMoving = false;
          state.targetX = undefined;
          state.targetY = undefined;
          state.animFrame = 0;
        } else {
          // Direction
          if (Math.abs(dx) > Math.abs(dy)) {
            state.facing = dx > 0 ? 'right' : 'left';
          } else {
            state.facing = dy > 0 ? 'down' : 'up';
          }

          state.x += (dx / dist) * moveSpeed;
          state.y += (dy / dist) * moveSpeed;

          // Walk cycle animation with custom animSpeed interval
          state.animTimer += scaledDt;
          const stepInterval = state.animSpeed || 0.16;
          if (state.animTimer > stepInterval) {
            state.animTimer = 0;
            state.animFrame = (state.animFrame + 1) % 4;
          }
        }
      }

      // Emote timer
      if (state.currentEmote) {
        state.currentEmote.timer += scaledDt * 1000;
        if (state.currentEmote.timer >= state.currentEmote.maxDuration) {
          state.currentEmote = undefined;
        }
      }

      // Typewriter Speech progression
      if (state.currentSpeech) {
        const sp = state.currentSpeech;
        sp.elapsed += scaledDt * 1000;
        const totalChars = sp.text.length;
        const mult = sp.speedMultiplier || 1.0;
        const charsPerMs = (totalChars / (sp.totalDuration * 0.7)) * mult;
        const targetChars = Math.min(totalChars, Math.floor(sp.elapsed * charsPerMs));

        if (targetChars > sp.charIndex) {
          sp.charIndex = targetChars;
          sp.displayedText = sp.text.slice(0, sp.charIndex);
          // Play subtle typewriter sound every 3 characters
          if (sp.charIndex % 3 === 0 && sp.charIndex < totalChars) {
            soundEngine.playSfx('typewriter', 0.2);
          }
        }
      }
    }

    // Update Particle System & Lighting
    particleSystem.update(scaledDt);
    lightingEngine.update(scaledDt);

    const worldW = this.setting.gridWidth * this.setting.tileSize;
    const worldH = this.setting.gridHeight * this.setting.tileSize;

    // Spawn subtle dust motes in sunbeams
    if (lightingEngine.currentTime === 'day' || lightingEngine.currentTime === 'golden_hour') {
      particleSystem.spawnDustMotes(worldW, worldH, 1);
    }

    // Advance beat timeline if playing
    if (this.isPlaying && !this.activeTalkingHead) {
      this.beatTimer += scaledDt * 1000;
      if (this.beatTimer >= this.beatDuration) {
        this.nextBeat();
      }
    }
  }

  // Pre-render static tile grid & floor rugs to offscreen canvas
  private renderTileMapToCache() {
    const tileSize = this.setting.tileSize;
    const worldW = this.setting.gridWidth * tileSize;
    const worldH = this.setting.gridHeight * tileSize;

    if (!this.tileCanvas) {
      this.tileCanvas = document.createElement('canvas');
    }
    if (this.tileCanvas.width !== worldW || this.tileCanvas.height !== worldH) {
      this.tileCanvas.width = worldW;
      this.tileCanvas.height = worldH;
      this.tileCtx = this.tileCanvas.getContext('2d');
    }

    if (!this.tileCtx) return;
    const ctx = this.tileCtx;
    ctx.imageSmoothingEnabled = false;

    // 1. Draw floor and wall tiles
    for (let gx = 0; gx < this.setting.gridWidth; gx++) {
      for (let gy = 0; gy < this.setting.gridHeight; gy++) {
        const type = this.setting.tiles[`${gx},${gy}`] || 'floor_carpet_grey';
        TileRenderer.drawTile(ctx, type, gx * tileSize, gy * tileSize, tileSize);
      }
    }

    // 2. Draw static floor rugs
    this.setting.props
      .filter((prop) => prop.type === 'rug')
      .forEach((prop) => {
        TileRenderer.drawProp(ctx, prop, tileSize);
      });

    this.isTileMapDirty = false;
  }

  private render() {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const dpr = window.devicePixelRatio || 1;
    const logicalW = this.canvas.width / dpr;
    const logicalH = this.canvas.height / dpr;

    ctx.save();
    // High-DPI physical-to-logical coordinate normalization
    ctx.scale(dpr, dpr);
    ctx.imageSmoothingEnabled = false;

    // Clear background in logical pixels
    ctx.fillStyle = this.setting.backgroundColor;
    ctx.fillRect(0, 0, logicalW, logicalH);

    // Apply Camera translation and zoom in logical coordinates
    this.camera.applyTransform(ctx, logicalW, logicalH);

    const tileSize = this.setting.tileSize;
    const worldW = this.setting.gridWidth * tileSize;
    const worldH = this.setting.gridHeight * tileSize;

    // 1. Draw Cached Static Tilemap & Floor Rugs (zero per-frame string formatting)
    if (this.isTileMapDirty || !this.tileCanvas) {
      this.renderTileMapToCache();
    }
    if (this.tileCanvas) {
      ctx.drawImage(this.tileCanvas, 0, 0);
    }

    // 2. Draw Floor Liquid Puddles & Coffee Stains
    particleSystem.drawFloorPuddles(ctx);

    // 3. Collect All Renderable Entities (Props & Characters) into Reused Render Queue
    this.renderQueue.length = 0;

    // Add standing/raised props to render queue with category-aware baseline sorting
    for (let i = 0; i < this.setting.props.length; i++) {
      const prop = this.setting.props[i];
      if (prop.type === 'rug') continue;

      const pState = this.propStates.get(prop.id);
      const runtimeProp = pState ? { ...prop, state: pState } : prop;
      const propH = prop.height || 1;

      // Base depth offset:
      // - Couches and chairs: 0.2 (sort near backrest so sitting characters are drawn in front)
      // - Flat low tables / coffee tables: 0.35
      // - Tall desks / counters: 0.75
      let baseFactor = 0.75;
      if (prop.type === 'sofa_leather' || prop.type === 'chair_office' || prop.type === 'chair_conference') {
        baseFactor = 0.2;
      } else if (prop.type === 'desk_wood' && prop.name?.toLowerCase().includes('coffee')) {
        baseFactor = 0.35;
      } else if (prop.type === 'trash_can' || prop.type === 'potted_plant') {
        baseFactor = 0.7;
      }

      const yOrder = (prop.y + propH * baseFactor) * tileSize + (prop.zIndexOffset || 0);

      this.renderQueue.push({
        yOrder,
        draw: () =>
          TileRenderer.drawProp(
            ctx,
            runtimeProp,
            tileSize,
            this.propStates.get(prop.id),
            this.gameTime
          ),
      });
    }

    // Add Characters to render queue (sorted by feet baseline)
    for (let i = 0; i < this.cachedCharStates.length; i++) {
      const state = this.cachedCharStates[i];
      const char = this.charactersMap[state.id];
      if (!char) continue;
      const yOrder = state.y + 8;

      this.renderQueue.push({
        yOrder,
        draw: () =>
          CharacterRenderer.drawCharacter(
            ctx,
            char,
            state,
            this.showNameTags,
            this.gameTime
          ),
      });
    }

    // Sort by Y-coordinate (smaller Y rendered first, larger Y rendered in front)
    this.renderQueue.sort((a, b) => a.yOrder - b.yOrder);

    // Draw all entities in sorted depth order
    for (let i = 0; i < this.renderQueue.length; i++) {
      this.renderQueue[i].draw();
    }

    // 4. Draw Airborne Flying Particles (Paper Airplanes, Foam, Coffee Droplets, Confetti)
    particleSystem.drawParticles(ctx);

    // 5. Draw Waypoint Markers (if enabled)
    if (this.showWaypoints) {
      Object.entries(this.setting.waypoints).forEach(([id, wp]) => {
        const wx = wp.x * tileSize;
        const wy = wp.y * tileSize;
        ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
        ctx.beginPath();
        ctx.arc(wx, wy, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = '8px monospace';
        ctx.fillText(id, wx + 8, wy);
      });
    }

    // 6. Draw Speech Bubbles (Always on top of characters)
    for (let i = 0; i < this.cachedCharStates.length; i++) {
      const state = this.cachedCharStates[i];
      if (state.currentSpeech && state.currentSpeech.displayedText.length > 0) {
        const char = this.charactersMap[state.id];
        SpeechBubbleRenderer.drawBubble(ctx, {
          speakerName: char?.nickname || char?.name || state.id,
          text: state.currentSpeech.text,
          displayedText: state.currentSpeech.displayedText,
          x: state.x,
          y: state.y,
          emotion: state.currentSpeech.emotion,
          maxWidth: 240,
        });
      }
    }

    // 7. Dynamic Ambient Lighting & Light Rays
    lightingEngine.drawLighting(ctx, this.setting, worldW, worldH, this.gameTime);

    ctx.restore();
  }

  private gameLoop(timestamp: number) {
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
    this.lastTime = timestamp;

    this.updateSimulation(dt);
    this.render();

    this.animFrameId = requestAnimationFrame(this.gameLoop.bind(this));
  }
}
