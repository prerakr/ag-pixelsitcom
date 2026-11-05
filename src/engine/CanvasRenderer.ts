import { PropInstance, SettingDefinition } from '../types/environment';
import { CharacterDefinition, CharacterRuntimeState } from '../types/character';
import { SitcomScript, ScriptBeat, TalkingHeadBeat, CameraCueBeat } from '../types/script';
import { TileRenderer } from './TileRenderer';
import { TileMapBaker } from './TileMapBaker';
import { CharacterRenderer } from './CharacterRenderer';
import { SpeechBubbleRenderer } from './SpeechBubble';
import { Camera } from './Camera';
import { soundEngine } from './SoundEngine';
import { musicEngine } from './MusicEngine';
import { particleSystem } from './ParticleSystem';
import { lightingEngine } from './LightingEngine';
import { spriteManager } from './SpriteManager';
import { ScriptPlayer, StageEffects } from './ScriptPlayer';
import { PathPoint } from './NavGrid';
import { IsoStage } from './iso/IsoStage';
import { ISO, TOPDOWN } from './iso/IsoProjection';
import { SPRITE_ATLAS_MANIFEST } from '../data/sprites/SpriteAtlas';
import { musicThemeId } from '../data/settings';

export interface VisualizerCallbacks {
  onBeatChange?: (sceneIndex: number, beatIndex: number, currentBeat: ScriptBeat | null) => void;
  onTalkingHead?: (data: TalkingHeadBeat | null) => void;
  onPlaybackStateChange?: (isPlaying: boolean) => void;
  onEpisodeEnd?: () => void;
  onSelectEntity?: (entity: { type: 'character' | 'prop'; data: any } | null) => void;
}

const RENDER_PROP = 0;
const RENDER_CHARACTER = 1;

interface RenderItem {
  kind: typeof RENDER_PROP | typeof RENDER_CHARACTER;
  index: number;
  yOrder: number;
}

function compareRenderItems(a: RenderItem, b: RenderItem): number {
  return a.yOrder - b.yOrder;
}

/**
 * Presents a ScriptPlayer: owns the canvas, camera, game loop and drawing, and turns the
 * player's stage effects into sound, particles, lighting and camera moves. All world state and
 * beat logic live in the player.
 */
export class VisualizerEngine {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animFrameId: number | null = null;
  private lastTime: number = 0;

  public readonly player: ScriptPlayer;
  public charactersMap: Record<string, CharacterDefinition>;
  public camera: Camera;

  public isPlaying: boolean = false;
  public playbackSpeed: number = 1.0;
  public gameTime: number = 0;

  // Camera tracking mode: 'auto' | 'free'
  public cameraMode: 'auto' | 'free' = 'auto';
  public allowCameraJumps: boolean = true;
  public showWaypoints: boolean = false;
  public showNameTags: boolean = true;

  private callbacks: VisualizerCallbacks = {};

  // Offscreen static tilemap cache to eliminate per-frame grid redraw overhead
  private tileCanvas: HTMLCanvasElement | null = null;
  private tileCtx: CanvasRenderingContext2D | null = null;
  private isTileMapDirty: boolean = true;

  // Cached render queue to eliminate per-frame GC allocations
  private renderQueue: RenderItem[] = [];
  private renderPool: RenderItem[] = [];
  private worldCanvas: HTMLCanvasElement | null = null;
  private worldCtx: CanvasRenderingContext2D | null = null;
  private unsubscribeSprites: (() => void) | null = null;
  private readonly isoStage = new IsoStage();

  constructor(
    setting: SettingDefinition,
    characters: Record<string, CharacterDefinition>,
    callbacks?: VisualizerCallbacks
  ) {
    this.charactersMap = characters;
    this.camera = new Camera(setting.defaultCamera.x, setting.defaultCamera.y, setting.defaultCamera.zoom);
    this.camera.projection = setting.projection === 'iso' ? ISO : TOPDOWN;
    this.camera.snapTo(setting.defaultCamera.x, setting.defaultCamera.y, setting.defaultCamera.zoom);
    if (callbacks) this.callbacks = callbacks;
    this.player = new ScriptPlayer(setting, characters, this.createEffects(), {
      onBeatChange: (scene, beat, current) => this.callbacks.onBeatChange?.(scene, beat, current),
      onEpisodeEnd: () => {
        this.pause();
        this.callbacks.onEpisodeEnd?.();
      },
    });

    // Initialize SpriteManager & listen for asset load / mode updates
    spriteManager.loadManifest(SPRITE_ATLAS_MANIFEST).catch(console.error);
    this.unsubscribeSprites = spriteManager.subscribe(() => {
      this.isTileMapDirty = true;
    });
  }

  // World state lives in the player; these keep the engine's long-standing public surface.
  public get setting(): SettingDefinition {
    return this.player.setting;
  }
  public get characterStates(): Map<string, CharacterRuntimeState> {
    return this.player.characterStates;
  }
  /**
   * What is under a screen point on an isometric set: the front-most character or prop as drawn,
   * so clicking a character's head or a tall prop's top finds it. Null on top-down sets, where
   * the floor point under the click is accurate enough.
   */
  public pickAt(screenX: number, screenY: number, viewportW: number, viewportH: number):
    | { type: 'character'; id: string }
    | { type: 'prop'; prop: PropInstance }
    | null {
    if (this.setting.projection !== 'iso') return null;
    const v = this.camera.screenToView(screenX, screenY, viewportW, viewportH);
    const hit = this.isoStage.pick(v.x, v.y, this.setting, this.player.states);
    if (!hit) return null;
    if (hit.kind === 'character') return { type: 'character', id: this.player.states[hit.index].id };
    return { type: 'prop', prop: this.setting.props[hit.index] };
  }

  public get propStates(): Map<string, Record<string, any>> {
    return this.player.propStates;
  }
  public get script(): SitcomScript | null {
    return this.player.script;
  }
  public get currentSceneIdx(): number {
    return this.player.sceneIdx;
  }
  public get currentBeatIdx(): number {
    return this.player.beatIdx;
  }
  public get activeTalkingHead(): TalkingHeadBeat | null {
    return this.player.activeTalkingHead;
  }

  /** Turns the player's stage directions into sound, particles, lighting and camera work. */
  private createEffects(): StageEffects {
    return {
      sfx: (sfx, volume) => soundEngine.playSfx(sfx, volume),
      timeOfDay: (time, instant, durationMs) => lightingEngine.setTimeOfDay(time, instant, durationMs),
      duckMusic: (ducked) => musicEngine.duckAudio(ducked),
      shake: (duration, intensity) => this.camera.shake(duration, intensity),
      focusSpeaker: (x, y) => {
        if (this.cameraMode === 'auto' && this.allowCameraJumps) {
          this.camera.setTarget(x, y, this.getSafeTargetZoom(1.15));
        }
      },
      cameraCue: (cue, target) => this.runCameraCue(cue, target),
      paperAirplane: (x, y, tx, ty) => particleSystem.throwPaperAirplane(x, y, tx, ty),
      spillCoffee: (x, y) => particleSystem.spillCoffee(x, y),
      extinguisherFoam: (x, y, angle) => particleSystem.shootExtinguisherFoam(x, y, angle),
      talkingHead: (beat) => this.callbacks.onTalkingHead?.(beat),
    };
  }

  private runCameraCue(cam: CameraCueBeat, target: PathPoint | null) {
    if (this.cameraMode !== 'auto' || !this.allowCameraJumps) return;
    const zoom = this.getSafeTargetZoom(cam.zoom || 1.15);

    if (!target) {
      if (this.canvas) {
        const dpr = window.devicePixelRatio || 1;
        const rectW = this.canvas.width / dpr;
        const rectH = this.canvas.height / dpr;
        const worldW = this.setting.gridWidth * this.setting.tileSize;
        const worldH = this.setting.gridHeight * this.setting.tileSize;
        if (cam.style === 'cut') {
          const b = this.camera.projection.bounds(worldW, worldH);
          const fitZoom = Math.max(
            this.camera.minZoom,
            Math.min(1.4, Math.min((rectW * 0.92) / (b.x1 - b.x0), (rectH * 0.92) / (b.y1 - b.y0)))
          );
          this.camera.snapToView((b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2, fitZoom);
        } else {
          this.camera.fitToViewport(rectW, rectH, worldW, worldH);
        }
      } else {
        const cam0 = this.setting.defaultCamera;
        this.camera.setTarget(cam0.x, cam0.y, cam0.zoom);
      }
      return;
    }

    if (cam.style === 'jim_stare') this.camera.shake(0.2, 4);
    if (cam.style === 'cut') {
      this.camera.snapTo(target.x, target.y, zoom);
    } else if (cam.style === 'dramatic_zoom') {
      this.camera.setTarget(target.x, target.y, Math.min(this.camera.maxZoom, zoom * 1.35));
    } else {
      this.camera.setTarget(target.x, target.y, zoom);
    }
  }

  /** Stops the loop and releases global subscriptions. The engine is unusable afterwards. */
  public destroy() {
    this.stop();
    this.unsubscribeSprites?.();
    this.unsubscribeSprites = null;
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
    this.isTileMapDirty = true;
    this.camera.projection = setting.projection === 'iso' ? ISO : TOPDOWN;
    this.camera.snapTo(setting.defaultCamera.x, setting.defaultCamera.y, setting.defaultCamera.zoom);
    this.player.setSetting(setting);
    musicEngine.playTheme(musicThemeId(setting.id));
  }

  public initCharacters() {
    this.player.initCharacters();
    this.isTileMapDirty = true;
  }

  public loadScript(script: SitcomScript) {
    this.isTileMapDirty = true;
    this.player.load(script);
    musicEngine.playTheme(musicThemeId(script.settingId || this.setting.id));
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
    this.start();
    this.callbacks.onPlaybackStateChange?.(true);
  }

  public pause() {
    this.isPlaying = false;
    this.callbacks.onPlaybackStateChange?.(false);
  }

  public togglePlay() {
    if (this.isPlaying) this.pause();
    else this.play();
  }

  public setPlaybackSpeed(speed: number) {
    this.playbackSpeed = Math.max(0.25, Math.min(4.0, speed));
  }

  public nextBeat() {
    this.player.next();
  }

  /** Steps back one beat, rebuilding the world as it was at that point. */
  public prevBeat() {
    particleSystem.clear();
    this.player.prev();
  }

  /** Jumps to a beat, rebuilding the world as it was at that point. */
  public jumpToBeat(sceneIdx: number, beatIdx: number) {
    particleSystem.clear();
    this.player.jumpTo(sceneIdx, beatIdx);
  }

  private updateSimulation(dt: number) {
    const scaledDt = dt * this.playbackSpeed;
    if (this.isPlaying) this.gameTime += scaledDt * 1000;

    this.camera.update(scaledDt);
    this.player.update(scaledDt * 1000, this.isPlaying);

    particleSystem.update(scaledDt);
    lightingEngine.update(scaledDt);

    // Spawn subtle dust motes in sunbeams
    if (lightingEngine.currentTime === 'day' || lightingEngine.currentTime === 'golden_hour') {
      particleSystem.spawnDustMotes(this.setting.gridWidth * this.setting.tileSize, this.setting.gridHeight * this.setting.tileSize, 1);
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

    // 1. Draw floor and wall tiles (themed tileset + wall autotiling)
    TileMapBaker.bake(ctx, this.setting);

    // 2. Draw static floor rugs
    this.setting.props
      .filter((prop) => prop.type === 'rug')
      .forEach((prop) => {
        TileRenderer.drawProp(ctx, prop, tileSize);
      });

    this.isTileMapDirty = false;
  }

  /**
   * Draws a frame in two passes:
   *
   * 1. The pixel-art world is drawn into an offscreen buffer at an integer multiple of its
   *    native resolution, with the camera snapped to whole world pixels. Sprites therefore
   *    always land on the pixel grid and every art pixel is the same size.
   * 2. That buffer is scaled onto the screen canvas. Only the remaining fractional part of
   *    the zoom (and the sub-pixel camera offset) is handled by bilinear filtering, which
   *    keeps pixels uniform while zooming and removes the shimmer seen when panning a
   *    nearest-neighbour image by fractional amounts.
   *
   * Text (name tags, speech bubbles) is drawn afterwards straight onto the screen canvas so it
   * stays crisp at any zoom.
   */
  private render() {
    if (!this.ctx || !this.canvas) return;
    const screen = this.ctx;
    const dpr = window.devicePixelRatio || 1;
    const logicalW = this.canvas.width / dpr;
    const logicalH = this.canvas.height / dpr;

    const zoom = this.camera.zoom;
    const screenScale = zoom * dpr; // physical screen pixels per world pixel
    const prescale = Math.max(1, Math.floor(screenScale));

    const viewW = logicalW / zoom;
    const viewH = logicalH / zoom;
    const left = this.camera.x - viewW / 2 - this.camera.shakeOffsetX / zoom;
    const top = this.camera.y - viewH / 2 - this.camera.shakeOffsetY / zoom;
    const originX = Math.floor(left);
    const originY = Math.floor(top);
    const bufferWorldW = Math.ceil(viewW) + 2;
    const bufferWorldH = Math.ceil(viewH) + 2;

    const ctx = this.ensureWorldBuffer(bufferWorldW * prescale, bufferWorldH * prescale);
    if (!ctx || !this.worldCanvas) return;

    ctx.setTransform(prescale, 0, 0, prescale, -originX * prescale, -originY * prescale);
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = this.setting.backgroundColor;
    ctx.fillRect(originX, originY, bufferWorldW, bufferWorldH);

    const tileSize = this.setting.tileSize;
    const worldW = this.setting.gridWidth * tileSize;
    const worldH = this.setting.gridHeight * tileSize;

    ctx.save();
    try {
      if (this.setting.projection === 'iso') {
        if (this.isTileMapDirty) {
          this.isoStage.invalidate();
          this.isTileMapDirty = false;
        }
        this.isoStage.draw(ctx, this.setting, this.player.states, this.charactersMap, this.player.propStates, this.gameTime);
      } else {
        // 1. Draw Cached Static Tilemap & Floor Rugs (zero per-frame string formatting)
        if (this.isTileMapDirty || !this.tileCanvas) {
          this.renderTileMapToCache();
        }
        if (this.tileCanvas) {
          ctx.drawImage(this.tileCanvas, 0, 0);
        }

        // 2. Draw Floor Liquid Puddles & Coffee Stains
        particleSystem.drawFloorPuddles(ctx);

        // 3. Collect props and characters into the reused render queue, sorted by baseline
        let queued = 0;
        for (let i = 0; i < this.setting.props.length; i++) {
          const prop = this.setting.props[i];
          if (prop.type === 'rug') continue;
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
          const item = this.renderItem(queued++);
          item.kind = RENDER_PROP;
          item.index = i;
          item.yOrder = (prop.y + propH * baseFactor) * tileSize + (prop.zIndexOffset || 0);
        }
        for (let i = 0; i < this.player.states.length; i++) {
          const state = this.player.states[i];
          if (!this.charactersMap[state.id]) continue;
          const item = this.renderItem(queued++);
          item.kind = RENDER_CHARACTER;
          item.index = i;
          item.yOrder = state.y + 8;
        }
        const queue = this.renderQueue;
        queue.length = queued;
        queue.sort(compareRenderItems);

        for (let i = 0; i < queued; i++) {
          const item = queue[i];
          if (item.kind === RENDER_PROP) {
            const prop = this.setting.props[item.index];
            TileRenderer.drawProp(ctx, prop, tileSize, this.player.propStates.get(prop.id), this.gameTime);
          } else {
            const state = this.player.states[item.index];
            CharacterRenderer.drawCharacter(ctx, this.charactersMap[state.id], state, false, this.gameTime);
          }
        }

        // 4. Draw Airborne Flying Particles (Paper Airplanes, Foam, Coffee Droplets, Confetti)
        particleSystem.drawParticles(ctx, false);

        // 5. Dynamic Ambient Lighting & Light Rays
        lightingEngine.drawLighting(ctx, this.setting, worldW, worldH, this.gameTime);
      }
    } finally {
      ctx.restore();
    }

    // Composite the world onto the screen.
    screen.setTransform(1, 0, 0, 1, 0, 0);
    const blit = screenScale / prescale;
    screen.imageSmoothingEnabled = blit !== 1;
    screen.imageSmoothingQuality = 'low';
    screen.drawImage(
      this.worldCanvas,
      0,
      0,
      bufferWorldW * prescale,
      bufferWorldH * prescale,
      -(left - originX) * screenScale,
      -(top - originY) * screenScale,
      bufferWorldW * prescale * blit,
      bufferWorldH * prescale * blit
    );

    // High-resolution overlay: text and debug markers in world coordinates.
    screen.save();
    try {
      screen.setTransform(dpr, 0, 0, dpr, 0, 0);
      screen.imageSmoothingEnabled = false;
      this.camera.applyTransform(screen, logicalW, logicalH);
      const iso = this.setting.projection === 'iso';
      const proj = this.camera.projection;

      if (this.showWaypoints) {
        for (const id in this.setting.waypoints) {
          const wp = this.setting.waypoints[id];
          const wx = proj.toViewX(wp.x * tileSize, wp.y * tileSize);
          const wy = proj.toViewY(wp.x * tileSize, wp.y * tileSize);
          screen.fillStyle = 'rgba(239, 68, 68, 0.4)';
          screen.beginPath();
          screen.arc(wx, wy, 6, 0, Math.PI * 2);
          screen.fill();
          screen.fillStyle = '#ffffff';
          screen.font = '8px monospace';
          screen.fillText(id, wx + 8, wy);
        }
      }

      if (this.showNameTags) {
        for (let i = 0; i < this.player.states.length; i++) {
          const state = this.player.states[i];
          const char = this.charactersMap[state.id];
          if (char) CharacterRenderer.drawNameTag(screen, char, iso ? this.isoStage.project(state) : state);
        }
      }

      // Speech bubbles always sit on top of everything else
      for (let i = 0; i < this.player.states.length; i++) {
        const state = this.player.states[i];
        if (state.currentSpeech && state.currentSpeech.displayedText.length > 0) {
          const char = this.charactersMap[state.id];
          const view = iso ? this.isoStage.project(state) : state;
          SpeechBubbleRenderer.drawBubble(screen, {
            speakerName: char?.nickname || char?.name || state.id,
            text: state.currentSpeech.text,
            displayedText: state.currentSpeech.displayedText,
            x: view.x,
            y: view.y,
            emotion: state.currentSpeech.emotion,
            maxWidth: 240,
          });
        }
      }
    } finally {
      screen.restore();
    }
  }

  private ensureWorldBuffer(width: number, height: number): CanvasRenderingContext2D | null {
    if (!this.worldCanvas) {
      this.worldCanvas = document.createElement('canvas');
    }
    if (this.worldCanvas.width !== width || this.worldCanvas.height !== height || !this.worldCtx) {
      this.worldCanvas.width = width;
      this.worldCanvas.height = height;
      this.worldCtx = this.worldCanvas.getContext('2d');
    }
    return this.worldCtx;
  }

  private renderItem(i: number): RenderItem {
    let item = this.renderPool[i];
    if (!item) {
      item = { kind: RENDER_PROP, index: 0, yOrder: 0 };
      this.renderPool[i] = item;
    }
    this.renderQueue[i] = item;
    return item;
  }

  private gameLoop(timestamp: number) {
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
    this.lastTime = timestamp;

    try {
      this.updateSimulation(dt);
      this.render();
    } catch (err) {
      console.error('[VisualizerEngine] Simulation/render error in gameLoop:', err);
    }

    this.animFrameId = requestAnimationFrame(this.gameLoop.bind(this));
  }

}
