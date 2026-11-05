import { TimeOfDay } from '../../types/script';
import { lightingEngine } from '../LightingEngine';
import { ISO } from './IsoProjection';

/**
 * Time-of-day moods for isometric sets. Unlike the top-down overlay, a mood darkens everything
 * on the set in view space (walls, props and characters alike) by multiplying with a tint, then
 * gives back what emits light: the glowing pixels of screens, neon and lamps (collected during
 * the depth-sorted pass so whatever stands in front still hides them), and pools of light on
 * the floor around them.
 */
export interface IsoMood {
  /** Multiplied over the set: the darker the colour and the higher the alpha, the darker the room. */
  tint: string;
  tintAlpha: number;
  /** How much of the glowing pixels' own brightness is restored (0..1). */
  glow: number;
  /** Strength of the light pools on the floor (0..1). */
  pools: number;
}

const MOODS: Record<TimeOfDay, IsoMood> = {
  day: { tint: '#ffffff', tintAlpha: 0, glow: 0, pools: 0 },
  golden_hour: { tint: '#f4b46a', tintAlpha: 0.42, glow: 0.35, pools: 0.25 },
  night: { tint: '#26305a', tintAlpha: 0.86, glow: 1, pools: 1 },
  emergency: { tint: '#5c1616', tintAlpha: 0.62, glow: 0.8, pools: 0.55 },
};

/** A light-emitting prop: where its pool lies on the floor (world px) and its halo sits in view. */
export interface IsoLightSource {
  propIndex: number;
  floorX: number;
  floorY: number;
  viewX: number;
  viewY: number;
  /** Pool radius on the floor (world px) and halo radius in view (px). */
  radius: number;
  halo: number;
  colour: string;
}

export class IsoLighting {
  /** Weights of the current and target moods (they cross-fade while the time of day changes). */
  private readonly blend = { glow: 0, pools: 0 };
  private gradients = new Map<IsoLightSource, { pool: CanvasGradient; halo: CanvasGradient }>();
  private gradientCtx: CanvasRenderingContext2D | null = null;

  /** Whether any mood other than plain day is showing, i.e. whether the glow layer is needed. */
  public active(): boolean {
    return MOODS[lightingEngine.currentTime].tintAlpha > 0 || MOODS[lightingEngine.targetTime].tintAlpha > 0;
  }

  /** Forget cached gradients (the set or its lights changed). */
  public reset() {
    this.gradients.clear();
    this.gradientCtx = null;
  }

  /**
   * Draws the mood over a set `W` x `H` world px whose back walls stand `wallH` tall and
   * `wallT` thick, then the light pools and halos, then `glowLayer` (the visible glowing
   * pixels, in buffer pixels) on top.
   */
  public draw(
    ctx: CanvasRenderingContext2D,
    W: number,
    H: number,
    wallH: number,
    wallT: number,
    lights: IsoLightSource[],
    isLit: (light: IsoLightSource) => boolean,
    glowLayer: HTMLCanvasElement | null,
    gameTime: number
  ) {
    const from = lightingEngine.currentTime;
    const to = lightingEngine.targetTime;
    const p = from === to ? 1 : Math.min(1, Math.max(0, lightingEngine.transitionProgress));
    const pulse = (Math.sin(gameTime / 150) + 1) / 2;
    this.blend.glow = 0;
    this.blend.pools = 0;
    if (from !== to && p < 1) this.tint(ctx, MOODS[from], from, 1 - p, pulse, W, H, wallH, wallT);
    this.tint(ctx, MOODS[to], to, p, pulse, W, H, wallH, wallT);
    if (this.blend.pools > 0.01) this.drawPools(ctx, lights, isLit);
    if (glowLayer && this.blend.glow > 0.01) {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = Math.min(1, this.blend.glow);
      ctx.drawImage(glowLayer, 0, 0);
      ctx.restore();
    }
  }

  private tint(
    ctx: CanvasRenderingContext2D,
    mood: IsoMood,
    time: TimeOfDay,
    weight: number,
    pulse: number,
    W: number,
    H: number,
    wallH: number,
    wallT: number
  ) {
    if (weight <= 0.001) return;
    this.blend.glow += mood.glow * weight;
    this.blend.pools += mood.pools * weight;
    if (mood.tintAlpha <= 0) return;
    const alpha = time === 'emergency' ? mood.tintAlpha * (0.65 + 0.35 * pulse) : mood.tintAlpha;
    ctx.save();
    traceSet(ctx, W, H, wallH, wallT);
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = alpha * weight;
    ctx.fillStyle = mood.tint;
    ctx.fill();
    if (time === 'emergency') {
      // The strobe itself: a red flash that lights walls and floor alike.
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.16 * pulse * weight;
      ctx.fillStyle = '#ff2a2a';
      ctx.fill();
    } else if (time === 'golden_hour') {
      // Low sun through the west windows: warmth that fades across the room.
      ctx.globalCompositeOperation = 'soft-light';
      ctx.globalAlpha = 0.5 * weight;
      const sun = ctx.createLinearGradient(ISO.toViewX(0, H / 2), 0, ISO.toViewX(W, H / 2), 0);
      sun.addColorStop(0, 'rgba(255, 214, 140, 1)');
      sun.addColorStop(1, 'rgba(255, 214, 140, 0)');
      ctx.fillStyle = sun;
      ctx.fill();
    }
    ctx.restore();
  }

  private drawPools(ctx: CanvasRenderingContext2D, lights: IsoLightSource[], isLit: (light: IsoLightSource) => boolean) {
    if (this.gradientCtx !== ctx) {
      this.gradients.clear();
      this.gradientCtx = ctx;
    }
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = Math.min(1, this.blend.pools);
    for (const light of lights) {
      if (!isLit(light)) continue;
      let g = this.gradients.get(light);
      if (!g) {
        g = { pool: radial(ctx, light.floorX, light.floorY, light.radius, light.colour, 0.34), halo: radial(ctx, light.viewX, light.viewY, light.halo, light.colour, 0.3) };
        this.gradients.set(light, g);
      }
      // The pool lies on the floor; the halo hangs around the glowing part itself.
      ctx.save();
      ctx.transform(1, 0.5, -1, 0.5, 0, 0);
      ctx.fillStyle = g.pool;
      ctx.beginPath();
      ctx.arc(light.floorX, light.floorY, light.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = g.halo;
      ctx.beginPath();
      ctx.arc(light.viewX, light.viewY, light.halo, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

function radial(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, colour: string, alpha: number): CanvasGradient {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${colour}, ${alpha})`);
  g.addColorStop(0.55, `rgba(${colour}, ${alpha * 0.4})`);
  g.addColorStop(1, `rgba(${colour}, 0)`);
  return g;
}

/** Outline of the set in view space: the floor diamond plus the north and west walls standing on it. */
function traceSet(ctx: CanvasRenderingContext2D, W: number, H: number, wallH: number, wallT: number) {
  const top = wallH + 4;
  ctx.beginPath();
  ctx.moveTo(ISO.toViewX(-wallT, H), ISO.toViewY(-wallT, H, top));
  ctx.lineTo(ISO.toViewX(-wallT, -wallT), ISO.toViewY(-wallT, -wallT, top));
  ctx.lineTo(ISO.toViewX(W, -wallT), ISO.toViewY(W, -wallT, top));
  ctx.lineTo(ISO.toViewX(W, -wallT), ISO.toViewY(W, -wallT, 0));
  ctx.lineTo(ISO.toViewX(W, 0), ISO.toViewY(W, 0) + wallT);
  ctx.lineTo(ISO.toViewX(W, H), ISO.toViewY(W, H) + wallT);
  ctx.lineTo(ISO.toViewX(0, H), ISO.toViewY(0, H) + wallT);
  ctx.lineTo(ISO.toViewX(-wallT, H), ISO.toViewY(-wallT, H) + wallT);
  ctx.closePath();
}
