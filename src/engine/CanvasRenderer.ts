import { SettingDefinition, PropInstance, Waypoint } from '../types/environment';
import { CharacterDefinition, CharacterRuntimeState } from '../types/character';
import { SitcomScript, ScriptBeat, DialogueBeat, MovementBeat, InteractionBeat, TalkingHeadBeat, CameraCueBeat, AudioCueBeat, EmoteBeat, GroupActionBeat } from '../types/script';
import { TileRenderer } from './TileRenderer';
import { CharacterRenderer } from './CharacterRenderer';
import { SpeechBubbleRenderer } from './SpeechBubble';
import { Camera } from './Camera';
import { soundEngine } from './SoundEngine';

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

  // Camera tracking mode: 'auto' | 'free'
  public cameraMode: 'auto' | 'free' = 'auto';
  public showWaypoints: boolean = false;
  public showNameTags: boolean = true;

  // Prop dynamic states (e.g. ignited, occupied)
  public propStates: Map<string, Record<string, any>> = new Map();

  // Callbacks
  private callbacks: VisualizerCallbacks = {};

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

  public setSetting(setting: SettingDefinition) {
    this.setting = setting;
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

    Object.values(this.charactersMap).forEach((char) => {
      // Find spawn point or default waypoint
      const spawn = this.setting.spawnPoints[char.id] || this.setting.waypoints[char.defaultWaypoint];
      const startX = spawn ? spawn.x * tileSize : 10 * tileSize;
      const startY = spawn ? spawn.y * tileSize : 10 * tileSize;

      const isAtDesk = char.defaultWaypoint?.includes('desk') || char.defaultWaypoint?.includes('seat');

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
  }

  public loadScript(script: SitcomScript) {
    this.script = script;
    this.currentSceneIdx = 0;
    this.currentBeatIdx = 0;
    this.beatTimer = 0;
    this.activeTalkingHead = null;
    this.propStates.clear();
    this.initCharacters();

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
        const char = this.charactersMap[d.speaker];
        const state = this.characterStates.get(d.speaker);
        if (state) {
          const readingTime = Math.max(2500, d.text.length * 75);
          this.beatDuration = d.durationMs || readingTime;
          state.currentSpeech = {
            text: d.text,
            displayedText: '',
            charIndex: 0,
            timer: 0,
            emotion: d.emotion || 'neutral',
            totalDuration: this.beatDuration,
            elapsed: 0,
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
          if (this.cameraMode === 'auto' && (d.cameraFocus !== false)) {
            this.camera.setTarget(state.x, state.y, 1.4);
          }
        }
        break;
      }

      case 'movement': {
        const m = beat as MovementBeat;
        this.startCharacterMovement(m);
        this.beatDuration = 2500;
        break;
      }

      case 'interaction': {
        const inter = beat as InteractionBeat;
        const state = this.characterStates.get(inter.character);
        if (state) {
          state.currentAction = inter.action;
          if (inter.action === 'sit') state.isSitting = true;
          if (inter.action === 'stand') state.isSitting = false;
          if (inter.action === 'ignite') {
            const pState = this.propStates.get(inter.targetProp) || {};
            pState.ignited = true;
            this.propStates.set(inter.targetProp, pState);
            this.camera.shake(0.4, 8);
          }
          if (inter.sfx) soundEngine.playSfx(inter.sfx);
        }
        this.beatDuration = inter.durationMs || 2000;
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
        const zoom = cam.zoom || 1.2;
        if (cam.target === 'overview') {
          this.camera.setTarget(this.setting.defaultCamera.x, this.setting.defaultCamera.y, this.setting.defaultCamera.zoom);
        } else if (typeof cam.target === 'string') {
          const charState = this.characterStates.get(cam.target);
          const waypoint = this.setting.waypoints[cam.target];
          if (charState) {
            if (cam.style === 'jim_stare') {
              charState.currentAction = 'jim_stare';
              this.camera.shake(0.2, 4);
            }
            this.camera.setTarget(charState.x, charState.y, zoom);
          } else if (waypoint) {
            this.camera.setTarget(waypoint.x * this.setting.tileSize, waypoint.y * this.setting.tileSize, zoom);
          }
        } else if (typeof cam.target === 'object') {
          this.camera.setTarget(cam.target.x, cam.target.y, zoom);
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
        grp.actions.forEach((subAction) => {
          if (subAction.type === 'movement') this.startCharacterMovement(subAction);
          if (subAction.type === 'emote') {
            const st = this.characterStates.get(subAction.character);
            if (st) {
              st.currentEmote = {
                icon: subAction.emote,
                timer: 0,
                maxDuration: subAction.durationMs || 2500,
              };
            }
          }
          if (subAction.type === 'audio_cue') soundEngine.playSfx(subAction.sfx, subAction.volume || 1.0);
        });
        this.beatDuration = 3000;
        break;
      }

      case 'wait': {
        this.beatDuration = (beat as any).durationMs || 2000;
        break;
      }
    }
  }

  private startCharacterMovement(m: MovementBeat) {
    const state = this.characterStates.get(m.character);
    if (!state) return;

    let targetX = state.x;
    let targetY = state.y;

    if (typeof m.target === 'string') {
      const wp = this.setting.waypoints[m.target];
      if (wp) {
        targetX = wp.x * this.setting.tileSize;
        targetY = wp.y * this.setting.tileSize;
      }
    } else if (typeof m.target === 'object') {
      targetX = m.target.x * this.setting.tileSize;
      targetY = m.target.y * this.setting.tileSize;
    }

    state.targetX = targetX;
    state.targetY = targetY;
    state.isMoving = true;
    state.isSitting = false;
    state.speed = m.speed || 1.0;
    if (m.facing) state.facing = m.facing;
  }

  private updateSimulation(dt: number) {
    const scaledDt = dt * this.playbackSpeed;

    // Update Camera
    this.camera.update(scaledDt);

    // Update Characters movement & typewriter speech
    const tileSize = this.setting.tileSize;
    this.characterStates.forEach((state) => {
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

          // Walk cycle animation
          state.animTimer += scaledDt;
          if (state.animTimer > 0.16) {
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
        const charsPerMs = totalChars / (sp.totalDuration * 0.7); // Reveal in first 70% of beat duration
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
    });

    // Advance beat timeline if playing
    if (this.isPlaying && !this.activeTalkingHead) {
      this.beatTimer += scaledDt * 1000;
      if (this.beatTimer >= this.beatDuration) {
        this.nextBeat();
      }
    }
  }

  private render() {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Clear background
    ctx.fillStyle = this.setting.backgroundColor;
    ctx.fillRect(0, 0, w, h);

    // Apply Camera translation and zoom
    ctx.save();
    this.camera.applyTransform(ctx, w, h);

    const tileSize = this.setting.tileSize;

    // 1. Draw Tiles (Floor & Static Walls)
    for (let gx = 0; gx < this.setting.gridWidth; gx++) {
      for (let gy = 0; gy < this.setting.gridHeight; gy++) {
        const type = this.setting.tiles[`${gx},${gy}`] || 'floor_carpet_grey';
        TileRenderer.drawTile(ctx, type, gx * tileSize, gy * tileSize, tileSize);
      }
    }

    // 2. Collect All Renderable Entities for Depth Y-Sorting
    interface RenderEntity {
      yOrder: number;
      draw: () => void;
    }

    const renderQueue: RenderEntity[] = [];

    // Add Props to render queue
    this.setting.props.forEach((prop) => {
      const pState = this.propStates.get(prop.id);
      const runtimeProp = pState ? { ...prop, state: pState } : prop;
      const yOrder = (prop.y + (prop.height || 1) * 0.8) * tileSize + (prop.zIndexOffset || 0);

      renderQueue.push({
        yOrder,
        draw: () => TileRenderer.drawProp(ctx, runtimeProp, tileSize),
      });
    });

    // Add Characters to render queue
    this.characterStates.forEach((state) => {
      const char = this.charactersMap[state.id];
      if (!char) return;
      const yOrder = state.y + 10;

      renderQueue.push({
        yOrder,
        draw: () => CharacterRenderer.drawCharacter(ctx, char, state, this.showNameTags),
      });
    });

    // Sort by Y-coordinate (smaller Y rendered first, larger Y rendered in front)
    renderQueue.sort((a, b) => a.yOrder - b.yOrder);

    // Draw all entities in sorted depth order
    renderQueue.forEach((entity) => entity.draw());

    // 3. Draw Waypoint Markers (if enabled)
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

    // 4. Draw Speech Bubbles (Always on top of characters)
    this.characterStates.forEach((state) => {
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
    });

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
