import { TOPDOWN, ViewProjection } from './iso/IsoProjection';

/**
 * Follows the action in view space. Targets are given in world coordinates and projected, so
 * the same calls work for top-down and isometric sets; `x`/`y` themselves are view coordinates.
 */
export class Camera {
  public projection: ViewProjection = TOPDOWN;
  public x: number = 0;
  public y: number = 0;
  public targetX: number = 0;
  public targetY: number = 0;
  public zoom: number = 1.0;
  public targetZoom: number = 1.0;
  public minZoom: number = 0.3;
  public maxZoom: number = 3.5;
  public lerpSpeed: number = 0.1;

  public shakeTimer: number = 0;
  public shakeIntensity: number = 0;
  /** Screen-space shake offset for the current frame, shared by every render pass. */
  public shakeOffsetX: number = 0;
  public shakeOffsetY: number = 0;

  constructor(initialX = 0, initialY = 0, initialZoom = 1.0) {
    this.x = initialX;
    this.y = initialY;
    this.targetX = initialX;
    this.targetY = initialY;
    this.zoom = initialZoom;
    this.targetZoom = initialZoom;
  }

  public update(dt: number) {
    // Frame-rate independent exponential decay lerp towards target position and zoom
    const factor = 1 - Math.pow(1 - Math.min(0.95, this.lerpSpeed), Math.max(0.001, dt * 60));
    this.x += (this.targetX - this.x) * factor;
    this.y += (this.targetY - this.y) * factor;
    this.zoom += (this.targetZoom - this.zoom) * factor;

    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
      if (this.shakeTimer <= 0) {
        this.shakeIntensity = 0;
      }
    }
    if (this.shakeTimer > 0) {
      this.shakeOffsetX = (Math.random() * 2 - 1) * this.shakeIntensity;
      this.shakeOffsetY = (Math.random() * 2 - 1) * this.shakeIntensity;
    } else {
      this.shakeOffsetX = 0;
      this.shakeOffsetY = 0;
    }
  }

  public shake(duration = 0.3, intensity = 6) {
    this.shakeTimer = duration;
    this.shakeIntensity = intensity;
  }

  public setTarget(x: number, y: number, zoom?: number) {
    this.targetX = this.projection.toViewX(x, y);
    this.targetY = this.projection.toViewY(x, y);
    if (zoom !== undefined) {
      this.targetZoom = Math.max(this.minZoom, Math.min(this.maxZoom, zoom));
    }
  }

  public snapTo(x: number, y: number, zoom?: number) {
    this.snapToView(this.projection.toViewX(x, y), this.projection.toViewY(x, y), zoom);
  }

  /** Like snapTo, but for a point already in view coordinates. */
  public snapToView(x: number, y: number, zoom?: number) {
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.targetY = y;
    if (zoom !== undefined) {
      this.zoom = zoom;
      this.targetZoom = zoom;
    }
  }

  public fitToViewport(
    viewportW: number,
    viewportH: number,
    worldW: number,
    worldH: number
  ) {
    const b = this.projection.bounds(worldW, worldH);
    const scaleX = (viewportW * 0.92) / (b.x1 - b.x0);
    const scaleY = (viewportH * 0.92) / (b.y1 - b.y0);
    const fitZoom = Math.max(this.minZoom, Math.min(1.4, Math.min(scaleX, scaleY)));

    this.targetX = (b.x0 + b.x1) / 2;
    this.targetY = (b.y0 + b.y1) / 2;
    this.targetZoom = fitZoom;
  }

  /** A screen point in view coordinates (before the projection is undone). */
  public screenToView(
    screenX: number,
    screenY: number,
    viewportW: number,
    viewportH: number
  ): { x: number; y: number } {
    return { x: (screenX - viewportW / 2) / this.zoom + this.x, y: (screenY - viewportH / 2) / this.zoom + this.y };
  }

  /** A screen point on the floor, in world coordinates. */
  public screenToWorld(
    screenX: number,
    screenY: number,
    viewportW: number,
    viewportH: number
  ): { x: number; y: number } {
    const v = this.screenToView(screenX, screenY, viewportW, viewportH);
    return { x: this.projection.toWorldX(v.x, v.y), y: this.projection.toWorldY(v.x, v.y) };
  }

  public worldToScreen(
    worldX: number,
    worldY: number,
    viewportW: number,
    viewportH: number
  ): { x: number; y: number } {
    const cx = viewportW / 2;
    const cy = viewportH / 2;
    const screenX = (this.projection.toViewX(worldX, worldY) - this.x) * this.zoom + cx;
    const screenY = (this.projection.toViewY(worldX, worldY) - this.y) * this.zoom + cy;
    return { x: screenX, y: screenY };
  }

  public applyTransform(ctx: CanvasRenderingContext2D, viewportW: number, viewportH: number) {
    const cx = viewportW / 2;
    const cy = viewportH / 2;

    ctx.translate(cx + this.shakeOffsetX, cy + this.shakeOffsetY);
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-this.x, -this.y);
  }
}
