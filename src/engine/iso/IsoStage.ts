import { PropInstance, SettingDefinition } from '../../types/environment';
import { CharacterDefinition, CharacterRuntimeState } from '../../types/character';
import { Direction } from '../../types/script';
import { IsoThemeAtlas } from '../../types/sprite';
import { ISO_PROP_CATALOG, ISO_THEME_ATLAS, ISO_THEME_IMAGES } from '../../data/sprites/generated/isoAtlas';
import { CharacterRenderer } from '../CharacterRenderer';
import { particleSystem } from '../ParticleSystem';
import { spriteManager } from '../SpriteManager';
import { FOOT_OFFSET_PX } from '../NavGrid';
import { ISO, applyIsoFloorTransform } from './IsoProjection';
import { IsoLighting, IsoLightSource } from './IsoLighting';
import { IsoBake, IsoMapBaker, IsoWallPiece } from './IsoMapBaker';

const T = 32;
/** Character hit box around the projected foot point (view px): half width, standing and seated height. */
const PICK_HALF_W = 11;
const PICK_H = 56;
const PICK_H_SEATED = 46;
const FLAME_COLOURS = ['#dc2626', '#f59e0b', '#fef08a'];
const FLAME_SCALE = [1, 0.66, 0.33];
/** Heights (view px above the feet) sampled to tell whether a character is hidden, head last. */
const HIDE_SAMPLES_STANDING = [8, 20, 34, 48];
/** Scratch canvas size for a hidden character's silhouette, and where its feet go on it. */
const GHOST_W = 96;
const GHOST_H = 96;
const GHOST_FOOT_Y = 78;
const GHOST_COLOUR = '#fde68a';

/** What a click in view space landed on: a character (index into the states) or a prop. */
export type IsoPick = { kind: 'character'; index: number } | { kind: 'prop'; index: number };

/** Flickering pixel flames rising from (cx, baseY), `width` px wide, for a burning prop. */
function drawFlames(ctx: CanvasRenderingContext2D, cx: number, baseY: number, width: number, time: number) {
  const x0 = Math.round(cx - width / 2);
  for (let l = 0; l < FLAME_COLOURS.length; l++) {
    ctx.fillStyle = FLAME_COLOURS[l];
    for (let col = 0; col < width; col++) {
      const middle = 1 - Math.abs(((col + 0.5) / width) * 2 - 1);
      const flicker = 0.5 * Math.sin(time / 90 + col * 1.9) + 0.5 * Math.sin(time / 53 + col * 0.7);
      const h = Math.round((4 + 14 * middle) * (0.8 + 0.25 * flicker) * FLAME_SCALE[l]);
      if (h > 0) ctx.fillRect(x0 + col, baseY - h, 1, h);
    }
  }
}
const EPS = 1e-3;
/** Screen extent of a standing character around its foot point, for overlap tests (view px). */
const CHAR_HALF_W = 14;
const CHAR_H = 60;

/**
 * Character sprites drawn for the four world facings when a character has no isometric views
 * yet. Walking uses the side profile matching the screen direction (east and north both move
 * right on screen); standing uses the front or back view.
 */
function fallbackFacing(facing: Direction, moving: boolean): Direction {
  if (moving) return facing === 'right' || facing === 'up' ? 'right' : 'left';
  return facing === 'right' || facing === 'down' ? 'down' : 'up';
}

/**
 * Draws an isometric set into the engine's world buffer, which is in view coordinates.
 *
 * Static layers (floor, back walls, wall decor, cut-away front walls) are baked once by
 * IsoMapBaker. Floor props are depth-sorted once by footprint; each frame every character is
 * slotted in after the last prop it stands in front of (or sits in), which is the ordering that
 * stays correct for large multi-tile furniture where a single sort key does not.
 */
export class IsoStage {
  private atlas: IsoThemeAtlas | null = null;
  private atlasCanvas: HTMLCanvasElement | null = null;
  private atlasPixels: ImageData | null = null;
  private loadingKey = '';
  private baked: IsoBake | null = null;
  private bakedSetting: SettingDefinition | null = null;
  private dirty = true;

  /**
   * Floor props and interior wall pieces in draw order, with their footprints in tiles. An entry
   * k >= 0 is setting.props[k]; k < 0 is wall piece -k - 1.
   */
  private order: number[] = [];
  private fx0 = new Float64Array(0);
  private fy0 = new Float64Array(0);
  private fx1 = new Float64Array(0);
  private fy1 = new Float64Array(0);
  /** Whether someone inside the footprint is drawn over the prop (its front faces the camera). */
  private sitsInFront = new Uint8Array(0);
  /** Screen (view-space) bounds of each sorted item: only items that overlap on screen need ordering. */
  private sx0 = new Float64Array(0);
  private sy0 = new Float64Array(0);
  private sx1 = new Float64Array(0);
  private sy1 = new Float64Array(0);

  private charOrder: number[] = [];
  private charSlot = new Float64Array(64);
  private charDepth = new Float64Array(64);
  private readonly compareChars = (a: number, b: number) =>
    this.charSlot[a] - this.charSlot[b] || this.charDepth[a] - this.charDepth[b];

  /** What the last frame drew, in order (0 prop, 1 character), for picking the front-most thing under a click. */
  private drawnKind = new Uint8Array(256);
  private drawnIndex = new Int32Array(256);
  private drawnCount = 0;

  /** Glow-only copy of the atlas, and the per-frame layer of glowing pixels left visible. */
  private glowAtlas: HTMLImageElement | null = null;
  private glowLayer: HTMLCanvasElement | null = null;
  private glowCtx: CanvasRenderingContext2D | null = null;
  private readonly lighting = new IsoLighting();
  private lights: IsoLightSource[] = [];
  /** Wall decorations that glow (neon signs, sconces): baked into the back wall, so their glow is added separately. */
  private wallGlows: number[] = [];
  private propStates: ReadonlyMap<string, Record<string, any>> = new Map();
  private lightProps: PropInstance[] = [];
  private readonly isLightOn = (light: IsoLightSource) => !this.propStates.get(this.lightProps[light.propIndex]?.id)?.pickedUp;
  /** The world buffer's origin (view px) and scale, so the glow layer can match its transform. */
  private bufferX = 0;
  private bufferY = 0;
  private bufferScale = 1;
  private ghostCanvas: HTMLCanvasElement | null = null;
  private ghostCtx: CanvasRenderingContext2D | null = null;

  private viewState = {} as CharacterRuntimeState;
  private isoDefs = new Map<string, CharacterDefinition | null>();

  /** Tells the stage how the world buffer it draws into is placed (its view-space origin and integer scale). */
  public setBuffer(originX: number, originY: number, scale: number) {
    this.bufferX = originX;
    this.bufferY = originY;
    this.bufferScale = scale;
  }

  public invalidate() {
    this.dirty = true;
    this.isoDefs.clear();
  }

  /** Writes `state` projected into view space into a reused scratch state (feet on the projected foot point). */
  public project(state: CharacterRuntimeState): CharacterRuntimeState {
    const v = Object.assign(this.viewState, state);
    const footY = state.y + FOOT_OFFSET_PX;
    v.x = ISO.toViewX(state.x, footY);
    v.y = ISO.toViewY(state.x, footY) - FOOT_OFFSET_PX;
    return v;
  }

  public draw(
    ctx: CanvasRenderingContext2D,
    setting: SettingDefinition,
    states: CharacterRuntimeState[],
    characters: Record<string, CharacterDefinition>,
    propStates: ReadonlyMap<string, Record<string, any>>,
    gameTime: number
  ) {
    this.ensureAtlas(setting.tileTheme || 'coffee');
    if (this.dirty || this.bakedSetting !== setting || !this.baked) this.rebuild(setting);
    const baked = this.baked!;
    const W = setting.gridWidth * T;
    const H = setting.gridHeight * T;
    this.propStates = propStates;
    // Away from plain daylight, collect what glows as it is drawn: each later item erases what it covers.
    const g = this.lighting.active() && this.glowAtlas ? this.prepareGlowLayer(ctx.canvas) : null;

    ctx.drawImage(baked.back, baked.originX, baked.originY);
    if (g && this.glowAtlas && this.atlas) {
      g.globalCompositeOperation = 'source-over';
      for (const i of this.wallGlows) {
        const prop = setting.props[i];
        const f = this.atlas.frames[`${prop.type}:${prop.facing || 'down'}`];
        const vx = Math.round(ISO.toViewX(prop.x * T, prop.y * T)) - f.ox;
        const vy = Math.round(ISO.toViewY(prop.x * T, prop.y * T)) - f.oy;
        g.drawImage(this.glowAtlas, f.x, f.y, f.w, f.h, vx, vy, f.w, f.h);
      }
    }

    ctx.save();
    applyIsoFloorTransform(ctx);
    particleSystem.drawFloorPuddles(ctx);
    ctx.restore();

    // Slot characters between the sorted props.
    const n = this.order.length;
    const order = this.charOrder;
    order.length = 0;
    if (this.charSlot.length < states.length) {
      this.charSlot = new Float64Array(states.length * 2);
      this.charDepth = new Float64Array(states.length * 2);
    }
    for (let c = 0; c < states.length; c++) {
      const s = states[c];
      if (!characters[s.id]) continue;
      const fx = s.x / T;
      const fy = (s.y + FOOT_OFFSET_PX) / T;
      const cvx = ISO.toViewX(s.x, s.y + FOOT_OFFSET_PX);
      const cvy = ISO.toViewY(s.x, s.y + FOOT_OFFSET_PX);
      // After every prop it is in front of, before every prop it is behind. Someone inside a
      // footprint (sitting) goes over a seat that faces the camera and under one that faces away,
      // so the backrest hides them.
      let after = 0;
      let before = n;
      for (let k = 0; k < n; k++) {
        if (cvx + CHAR_HALF_W < this.sx0[k] || cvx - CHAR_HALF_W > this.sx1[k] || cvy < this.sy0[k] || cvy - CHAR_H > this.sy1[k]) continue;
        const front = fx >= this.fx1[k] - EPS || fy >= this.fy1[k] - EPS;
        const behind = fx <= this.fx0[k] + EPS || fy <= this.fy0[k] + EPS;
        if (front && !behind) after = k + 1;
        else if (behind && !front) before = Math.min(before, k);
        else if (!front && !behind) {
          if (this.sitsInFront[k]) after = k + 1;
          else before = Math.min(before, k);
        }
      }
      this.charSlot[c] = Math.min(after, before);
      this.charDepth[c] = fx + fy;
      order.push(c);
    }
    order.sort(this.compareChars);

    if (this.drawnKind.length < n + order.length) {
      this.drawnKind = new Uint8Array((n + order.length) * 2);
      this.drawnIndex = new Int32Array((n + order.length) * 2);
    }
    let drawn = 0;
    let ci = 0;
    for (let k = 0; k <= n; k++) {
      while (ci < order.length && this.charSlot[order[ci]] === k) {
        const c = order[ci++];
        const s = states[c];
        this.drawCharacter(ctx, characters[s.id], s, gameTime);
        if (g) {
          g.globalCompositeOperation = 'destination-out';
          this.drawCharacter(g, characters[s.id], s, gameTime);
        }
        this.drawnKind[drawn] = 1;
        this.drawnIndex[drawn++] = c;
      }
      if (k === n) continue;
      const ref = this.order[k];
      if (ref < 0) {
        const piece = baked.pieces[-ref - 1];
        ctx.drawImage(piece.canvas, piece.originX, piece.originY);
        if (g) {
          g.globalCompositeOperation = 'destination-out';
          g.drawImage(piece.canvas, piece.originX, piece.originY);
        }
      } else {
        const prop = setting.props[ref];
        if (this.drawProp(ctx, prop, propStates.get(prop.id), gameTime, g)) {
          this.drawnKind[drawn] = 0;
          this.drawnIndex[drawn++] = ref;
        }
      }
    }
    this.drawnCount = drawn;

    ctx.drawImage(baked.front, baked.originX, baked.originY);
    if (g) {
      g.globalCompositeOperation = 'destination-out';
      g.drawImage(baked.front, baked.originX, baked.originY);
    }

    // Anyone on their feet hidden behind something tall shows through as a faint silhouette.
    // (Someone seated behind their own backrest is meant to be partly hidden.)
    for (let i = 0; i < drawn; i++) {
      if (this.drawnKind[i] !== 1) continue;
      const s = states[this.drawnIndex[i]];
      if (!s.isSitting && this.isHidden(i, s, setting)) this.drawGhost(ctx, characters[s.id], s, gameTime);
    }

    // Particles are drawn upright at their projected height; then the time-of-day mood over it all.
    particleSystem.drawParticles(ctx, true);
    if (this.atlas) {
      this.lighting.draw(ctx, W, H, this.atlas.wallHeight, this.atlas.wallThickness, this.lights, this.isLightOn, g ? this.glowLayer : null, gameTime);
    }
  }

  /** Clears the glow layer (resized to the world buffer) and gives it the buffer's transform. */
  private prepareGlowLayer(target: HTMLCanvasElement): CanvasRenderingContext2D | null {
    if (!this.glowLayer) {
      this.glowLayer = document.createElement('canvas');
      this.glowCtx = this.glowLayer.getContext('2d');
    }
    const g = this.glowCtx;
    if (!g) return null;
    if (this.glowLayer.width !== target.width || this.glowLayer.height !== target.height) {
      this.glowLayer.width = target.width;
      this.glowLayer.height = target.height;
    }
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalCompositeOperation = 'source-over';
    g.clearRect(0, 0, this.glowLayer.width, this.glowLayer.height);
    const k = this.bufferScale;
    g.setTransform(k, 0, 0, k, -this.bufferX * k, -this.bufferY * k);
    g.imageSmoothingEnabled = false;
    return g;
  }

  /** Whether a standing character drawn at position `i` of the last frame is hidden: head and most of the body under later props. */
  private isHidden(i: number, s: CharacterRuntimeState, setting: SettingDefinition): boolean {
    const fx = ISO.toViewX(s.x, s.y + FOOT_OFFSET_PX);
    const fy = ISO.toViewY(s.x, s.y + FOOT_OFFSET_PX);
    const samples = HIDE_SAMPLES_STANDING;
    let covered = 0;
    for (let k = 0; k < samples.length; k++) {
      const vy = fy - samples[k];
      let hit = false;
      for (let j = i + 1; j < this.drawnCount && !hit; j++) {
        if (this.drawnKind[j] === 0) hit = this.propHit(setting.props[this.drawnIndex[j]], fx, vy);
      }
      if (hit) covered++;
      else if (k === samples.length - 1) return false; // the head shows
    }
    return covered >= samples.length - 1;
  }

  /** Draws a character as a flat translucent silhouette over everything. */
  private drawGhost(ctx: CanvasRenderingContext2D, def: CharacterDefinition, state: CharacterRuntimeState, gameTime: number) {
    if (!this.ghostCanvas) {
      this.ghostCanvas = document.createElement('canvas');
      this.ghostCanvas.width = GHOST_W;
      this.ghostCanvas.height = GHOST_H;
      this.ghostCtx = this.ghostCanvas.getContext('2d');
    }
    const gc = this.ghostCtx;
    if (!gc) return;
    const vx = Math.round(ISO.toViewX(state.x, state.y + FOOT_OFFSET_PX));
    const vy = Math.round(ISO.toViewY(state.x, state.y + FOOT_OFFSET_PX));
    gc.setTransform(1, 0, 0, 1, 0, 0);
    gc.globalCompositeOperation = 'source-over';
    gc.clearRect(0, 0, GHOST_W, GHOST_H);
    gc.imageSmoothingEnabled = false;
    gc.setTransform(1, 0, 0, 1, GHOST_W / 2 - vx, GHOST_FOOT_Y - vy);
    this.drawCharacter(gc, def, state, gameTime);
    gc.setTransform(1, 0, 0, 1, 0, 0);
    gc.globalCompositeOperation = 'source-in';
    gc.fillStyle = GHOST_COLOUR;
    gc.fillRect(0, 0, GHOST_W, GHOST_H);
    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.drawImage(this.ghostCanvas, vx - GHOST_W / 2, vy - GHOST_FOOT_Y);
    ctx.restore();
  }

  /** Draws a prop in its current state (hidden while carried, alight when ignited); false when nothing was drawn. */
  private drawProp(
    ctx: CanvasRenderingContext2D,
    prop: PropInstance,
    state: Record<string, any> | undefined,
    gameTime: number,
    glow: CanvasRenderingContext2D | null
  ): boolean {
    const atlas = this.atlas;
    if (!atlas || !this.atlasCanvas || state?.pickedUp) return false;
    const f = atlas.frames[`${prop.type}:${prop.facing || 'down'}`];
    if (!f) return false;
    const vx = Math.round(ISO.toViewX(prop.x * T, prop.y * T)) - f.ox;
    const vy = Math.round(ISO.toViewY(prop.x * T, prop.y * T)) - f.oy;
    ctx.drawImage(this.atlasCanvas, f.x, f.y, f.w, f.h, vx, vy, f.w, f.h);
    if (glow) {
      glow.globalCompositeOperation = 'destination-out';
      glow.drawImage(this.atlasCanvas, f.x, f.y, f.w, f.h, vx, vy, f.w, f.h);
      glow.globalCompositeOperation = 'source-over';
      if (f.glow && this.glowAtlas) glow.drawImage(this.glowAtlas, f.x, f.y, f.w, f.h, vx, vy, f.w, f.h);
    }
    if (state?.ignited) {
      drawFlames(ctx, vx + f.w / 2, vy + 5, Math.max(12, f.w + 2), gameTime);
      if (glow) drawFlames(glow, vx + f.w / 2, vy + 5, Math.max(12, f.w + 2), gameTime);
    }
    return true;
  }

  /**
   * The front-most character or prop at a view-space point, from the last frame drawn. Props are
   * tested against their sprite's opaque pixels, characters against a box around the figure; wall
   * decorations, baked into the back wall, come last.
   */
  public pick(vx: number, vy: number, setting: SettingDefinition, states: CharacterRuntimeState[]): IsoPick | null {
    for (let i = this.drawnCount - 1; i >= 0; i--) {
      const index = this.drawnIndex[i];
      if (this.drawnKind[i] === 1) {
        const s = states[index];
        if (!s) continue;
        const fx = ISO.toViewX(s.x, s.y + FOOT_OFFSET_PX);
        const fy = ISO.toViewY(s.x, s.y + FOOT_OFFSET_PX);
        const h = s.isSitting ? PICK_H_SEATED : PICK_H;
        if (vx >= fx - PICK_HALF_W && vx <= fx + PICK_HALF_W && vy >= fy - h && vy <= fy) return { kind: 'character', index };
      } else if (this.propHit(setting.props[index], vx, vy)) {
        return { kind: 'prop', index };
      }
    }
    for (let i = 0; i < setting.props.length; i++) {
      if (ISO_PROP_CATALOG[setting.props[i].type]?.kind === 'wall' && this.propHit(setting.props[i], vx, vy)) {
        return { kind: 'prop', index: i };
      }
    }
    return null;
  }

  /** Whether the prop's sprite has an opaque pixel at the view-space point. */
  private propHit(prop: PropInstance, vx: number, vy: number): boolean {
    const f = this.atlas?.frames[`${prop.type}:${prop.facing || 'down'}`];
    const pixels = this.atlasPixels;
    if (!f || !pixels) return false;
    const px = Math.floor(vx - (Math.round(ISO.toViewX(prop.x * T, prop.y * T)) - f.ox));
    const py = Math.floor(vy - (Math.round(ISO.toViewY(prop.x * T, prop.y * T)) - f.oy));
    if (px < 0 || py < 0 || px >= f.w || py >= f.h) return false;
    return pixels.data[((f.y + py) * pixels.width + f.x + px) * 4 + 3] > 0;
  }

  private drawCharacter(ctx: CanvasRenderingContext2D, def: CharacterDefinition, state: CharacterRuntimeState, gameTime: number) {
    const view = this.project(state);
    const iso = this.isoDefinition(def);
    if (iso) {
      CharacterRenderer.drawCharacter(ctx, iso, view, false, gameTime);
    } else {
      view.facing = fallbackFacing(state.facing, state.isMoving);
      CharacterRenderer.drawCharacter(ctx, def, view, false, gameTime);
    }
  }

  /** The character's isometric sprite set (registered as `<id>@iso`), if it has one. */
  public isoDefinition(def: CharacterDefinition): CharacterDefinition | null {
    let iso = this.isoDefs.get(def.id);
    if (iso === undefined) {
      const id = `${def.id}@iso`;
      iso = spriteManager.hasCharacter(id) ? { ...def, id } : null;
      this.isoDefs.set(def.id, iso);
    }
    return iso;
  }

  private ensureAtlas(theme: string) {
    const atlas = ISO_THEME_ATLAS[theme] || ISO_THEME_ATLAS.coffee;
    if (!atlas || this.loadingKey === atlas.imageKey) return;
    this.loadingKey = atlas.imageKey;
    this.atlas = atlas;
    this.atlasCanvas = null;
    this.atlasPixels = null;
    this.glowAtlas = null;
    const glowImg = new Image();
    glowImg.onload = () => {
      if (this.loadingKey === atlas.imageKey) this.glowAtlas = glowImg;
    };
    glowImg.src = ISO_THEME_IMAGES[atlas.glowImageKey];
    const img = new Image();
    img.onload = () => {
      if (this.loadingKey !== atlas.imageKey) return;
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const c = canvas.getContext('2d');
      if (!c) return;
      c.drawImage(img, 0, 0);
      this.atlasCanvas = canvas;
      this.atlasPixels = c.getImageData(0, 0, canvas.width, canvas.height);
      this.dirty = true;
    };
    img.src = ISO_THEME_IMAGES[atlas.imageKey];
  }

  private rebuild(setting: SettingDefinition) {
    this.baked = IsoMapBaker.bake(
      setting,
      this.atlas,
      this.atlasCanvas,
      this.atlasPixels,
      spriteManager.getTileTheme(setting.tileTheme)
    );
    this.bakedSetting = setting;
    this.dirty = false;
    this.sortProps(setting, this.baked.pieces);
    this.findLights(setting);
  }

  /** The props that emit light, with where their pool falls on the floor and their halo hangs in view. */
  private findLights(setting: SettingDefinition) {
    this.lights = [];
    this.wallGlows = [];
    this.lightProps = setting.props;
    this.lighting.reset();
    setting.props.forEach((prop, i) => {
      const f = this.atlas?.frames[`${prop.type}:${prop.facing || 'down'}`];
      if (!f?.glow) return;
      if (ISO_PROP_CATALOG[prop.type]?.kind === 'wall') this.wallGlows.push(i);
      const size = Math.sqrt(f.glow.n);
      this.lights.push({
        propIndex: i,
        floorX: (prop.x + (prop.width || 1) / 2) * T,
        floorY: (prop.y + (prop.height || 1) / 2) * T,
        viewX: Math.round(ISO.toViewX(prop.x * T, prop.y * T)) - f.ox + f.glow.x,
        viewY: Math.round(ISO.toViewY(prop.x * T, prop.y * T)) - f.oy + f.glow.y,
        radius: Math.max(26, Math.min(84, 18 + size * 3.2)),
        halo: Math.max(8, Math.min(26, 4 + size * 1.4)),
        colour: `${f.glow.r}, ${f.glow.g}, ${f.glow.b}`,
      });
    });
  }

  /**
   * Topological depth sort of the floor props and interior wall pieces by footprint, with the
   * nearest-corner depth as tie-break.
   */
  private sortProps(setting: SettingDefinition, pieces: IsoWallPiece[]) {
    const ids: number[] = [];
    setting.props.forEach((p, i) => {
      const kind = ISO_PROP_CATALOG[p.type]?.kind;
      if (kind && kind !== 'wall') ids.push(i);
    });
    pieces.forEach((_, i) => ids.push(-i - 1));
    const m = ids.length;
    const rect = (ref: number) => {
      if (ref < 0) return pieces[-ref - 1];
      const p = setting.props[ref];
      return { x0: p.x, y0: p.y, x1: p.x + (p.width || 1), y1: p.y + (p.height || 1) };
    };
    const rects = ids.map(rect);
    const x0 = rects.map((r) => r.x0);
    const y0 = rects.map((r) => r.y0);
    const x1 = rects.map((r) => r.x1);
    const y1 = rects.map((r) => r.y1);
    const depth = (a: number) => x1[a] + y1[a];
    const screen = ids.map((ref, i) => this.screenRect(setting, pieces, ref, rects[i]));
    const overlaps = (a: number, b: number) =>
      screen[a].x0 < screen[b].x1 && screen[b].x0 < screen[a].x1 && screen[a].y0 < screen[b].y1 && screen[b].y0 < screen[a].y1;
    // a must be drawn before b when it lies wholly north or west of b and not also south / east.
    // Only pairs that overlap on screen are ordered: long thin walls would otherwise chain far-apart
    // items into cycles.
    const before = (a: number, b: number) => {
      if (!overlaps(a, b)) return false;
      const ab = x1[a] <= x0[b] + EPS || y1[a] <= y0[b] + EPS;
      const ba = x1[b] <= x0[a] + EPS || y1[b] <= y0[a] + EPS;
      if (ab && !ba) return true;
      if (ba && !ab) return false;
      return depth(a) < depth(b);
    };
    const indeg = new Array(m).fill(0);
    const edges: number[][] = ids.map(() => []);
    for (let a = 0; a < m; a++) {
      for (let b = 0; b < m; b++) {
        if (a !== b && before(a, b)) {
          edges[a].push(b);
          indeg[b]++;
        }
      }
    }
    const out: number[] = [];
    const ready = new Set<number>();
    for (let a = 0; a < m; a++) if (indeg[a] === 0) ready.add(a);
    while (out.length < m) {
      let pick = -1;
      for (const a of ready) if (pick < 0 || depth(a) < depth(pick)) pick = a;
      if (pick < 0) {
        // A cycle: break it at the remaining item with the fewest unmet constraints.
        for (let a = 0; a < m; a++) {
          if (out.includes(a)) continue;
          if (pick < 0 || indeg[a] < indeg[pick] || (indeg[a] === indeg[pick] && depth(a) < depth(pick))) pick = a;
        }
      }
      ready.delete(pick);
      out.push(pick);
      for (const b of edges[pick]) if (--indeg[b] === 0 && !out.includes(b)) ready.add(b);
    }
    this.order = out.map((a) => ids[a]);
    this.fx0 = Float64Array.from(out.map((a) => x0[a]));
    this.fy0 = Float64Array.from(out.map((a) => y0[a]));
    this.fx1 = Float64Array.from(out.map((a) => x1[a]));
    this.fy1 = Float64Array.from(out.map((a) => y1[a]));
    this.sx0 = Float64Array.from(out.map((a) => screen[a].x0));
    this.sy0 = Float64Array.from(out.map((a) => screen[a].y0));
    this.sx1 = Float64Array.from(out.map((a) => screen[a].x1));
    this.sy1 = Float64Array.from(out.map((a) => screen[a].y1));
    this.sitsInFront = Uint8Array.from(out.map((a) => {
      if (ids[a] < 0) return 1;
      const kind = ISO_PROP_CATALOG[setting.props[ids[a]].type]?.kind;
      if (kind === 'stool') return 1;
      if (kind === 'overhead') return 0; // anyone under a roof is drawn before it
      const facing = setting.props[ids[a]].facing || 'down';
      return facing === 'down' || facing === 'right' ? 1 : 0;
    }));
  }

  /** View-space bounds of a sortable item: its sprite, or its footprint raised to a nominal height. */
  private screenRect(
    setting: SettingDefinition,
    pieces: IsoWallPiece[],
    ref: number,
    fp: { x0: number; y0: number; x1: number; y1: number }
  ): { x0: number; y0: number; x1: number; y1: number } {
    if (ref < 0) {
      const p = pieces[-ref - 1];
      return { x0: p.originX, y0: p.originY, x1: p.originX + p.canvas.width, y1: p.originY + p.canvas.height };
    }
    const prop = setting.props[ref];
    const f = this.atlas?.frames[`${prop.type}:${prop.facing || 'down'}`];
    if (f) {
      const vx = Math.round(ISO.toViewX(prop.x * T, prop.y * T)) - f.ox;
      const vy = Math.round(ISO.toViewY(prop.x * T, prop.y * T)) - f.oy;
      return { x0: vx, y0: vy, x1: vx + f.w, y1: vy + f.h };
    }
    const height = ISO_PROP_CATALOG[prop.type]?.height ?? 32;
    return {
      x0: ISO.toViewX(fp.x0 * T, fp.y1 * T),
      x1: ISO.toViewX(fp.x1 * T, fp.y0 * T),
      y0: ISO.toViewY(fp.x0 * T, fp.y0 * T, height),
      y1: ISO.toViewY(fp.x1 * T, fp.y1 * T),
    };
  }
}
