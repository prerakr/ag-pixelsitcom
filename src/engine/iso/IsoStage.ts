import { SettingDefinition } from '../../types/environment';
import { CharacterDefinition, CharacterRuntimeState } from '../../types/character';
import { Direction } from '../../types/script';
import { IsoThemeAtlas } from '../../types/sprite';
import { ISO_PROP_CATALOG, ISO_THEME_ATLAS, ISO_THEME_IMAGES } from '../../data/sprites/generated/isoAtlas';
import { CharacterRenderer } from '../CharacterRenderer';
import { particleSystem } from '../ParticleSystem';
import { lightingEngine } from '../LightingEngine';
import { spriteManager } from '../SpriteManager';
import { FOOT_OFFSET_PX } from '../NavGrid';
import { ISO, applyIsoFloorTransform } from './IsoProjection';
import { IsoBake, IsoMapBaker } from './IsoMapBaker';

const T = 32;
const EPS = 1e-3;

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

  /** Floor props in draw order, with their footprints in tiles. */
  private order: number[] = [];
  private fx0 = new Float64Array(0);
  private fy0 = new Float64Array(0);
  private fx1 = new Float64Array(0);
  private fy1 = new Float64Array(0);
  /** Whether someone inside the footprint is drawn over the prop (its front faces the camera). */
  private sitsInFront = new Uint8Array(0);

  private charOrder: number[] = [];
  private charSlot = new Float64Array(64);
  private charDepth = new Float64Array(64);
  private readonly compareChars = (a: number, b: number) =>
    this.charSlot[a] - this.charSlot[b] || this.charDepth[a] - this.charDepth[b];

  private viewState = {} as CharacterRuntimeState;
  private isoDefs = new Map<string, CharacterDefinition | null>();

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
    gameTime: number
  ) {
    this.ensureAtlas(setting.tileTheme || 'coffee');
    if (this.dirty || this.bakedSetting !== setting || !this.baked) this.rebuild(setting);
    const baked = this.baked!;
    const W = setting.gridWidth * T;
    const H = setting.gridHeight * T;

    ctx.drawImage(baked.back, baked.originX, baked.originY);

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
      // After every prop it is in front of, before every prop it is behind. Someone inside a
      // footprint (sitting) goes over a seat that faces the camera and under one that faces away,
      // so the backrest hides them.
      let after = 0;
      let before = n;
      for (let k = 0; k < n; k++) {
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

    const atlas = this.atlas;
    let ci = 0;
    for (let k = 0; k <= n; k++) {
      while (ci < order.length && this.charSlot[order[ci]] === k) {
        const s = states[order[ci++]];
        this.drawCharacter(ctx, characters[s.id], s, gameTime);
      }
      if (k === n || !atlas || !this.atlasCanvas) continue;
      const prop = setting.props[this.order[k]];
      const f = atlas.frames[`${prop.type}:${prop.facing || 'down'}`];
      if (!f) continue;
      const vx = Math.round(ISO.toViewX(prop.x * T, prop.y * T)) - f.ox;
      const vy = Math.round(ISO.toViewY(prop.x * T, prop.y * T)) - f.oy;
      ctx.drawImage(this.atlasCanvas, f.x, f.y, f.w, f.h, vx, vy, f.w, f.h);
    }

    ctx.drawImage(baked.front, baked.originX, baked.originY);

    ctx.save();
    applyIsoFloorTransform(ctx);
    particleSystem.drawParticles(ctx);
    // Lighting moods paint world-sized shapes; keep them on the set.
    ctx.beginPath();
    ctx.rect(0, 0, W, H);
    ctx.clip();
    lightingEngine.drawLighting(ctx, setting, W, H, gameTime);
    ctx.restore();
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
    this.sortProps(setting);
  }

  /** Topological depth sort of the floor props by footprint, nearest-corner depth as tie-break. */
  private sortProps(setting: SettingDefinition) {
    const ids: number[] = [];
    setting.props.forEach((p, i) => {
      const kind = ISO_PROP_CATALOG[p.type]?.kind;
      if (kind === 'floor' || kind === 'seat') ids.push(i);
    });
    const m = ids.length;
    const x0 = ids.map((i) => setting.props[i].x);
    const y0 = ids.map((i) => setting.props[i].y);
    const x1 = ids.map((i) => setting.props[i].x + (setting.props[i].width || 1));
    const y1 = ids.map((i) => setting.props[i].y + (setting.props[i].height || 1));
    const depth = (a: number) => x1[a] + y1[a];
    // a must be drawn before b when it lies wholly north or west of b and not also south / east.
    const before = (a: number, b: number) => {
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
        // Cycle (overlapping footprints): fall back to the shallowest remaining prop.
        for (let a = 0; a < m; a++) if (!out.includes(a) && (pick < 0 || depth(a) < depth(pick))) pick = a;
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
    this.sitsInFront = Uint8Array.from(out.map((a) => {
      const facing = setting.props[ids[a]].facing || 'down';
      return facing === 'down' || facing === 'right' ? 1 : 0;
    }));
  }
}
