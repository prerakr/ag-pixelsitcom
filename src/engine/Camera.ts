export class Camera {
  public x: number = 0;
  public y: number = 0;
  public targetX: number = 0;
  public targetY: number = 0;
  public zoom: number = 1.0;
  public targetZoom: number = 1.0;
  public minZoom: number = 0.5;
  public maxZoom: number = 3.0;
  public lerpSpeed: number = 0.08;

  public shakeTimer: number = 0;
  public shakeIntensity: number = 0;

  constructor(initialX = 0, initialY = 0, initialZoom = 1.0) {
    this.x = initialX;
    this.y = initialY;
    this.targetX = initialX;
    this.targetY = initialY;
    this.zoom = initialZoom;
    this.targetZoom = initialZoom;
  }

  public update(dt: number) {
    // Smooth lerp towards target position
    this.x += (this.targetX - this.x) * this.lerpSpeed;
    this.y += (this.targetY - this.y) * this.lerpSpeed;
    this.zoom += (this.targetZoom - this.zoom) * this.lerpSpeed;

    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
      if (this.shakeTimer <= 0) {
        this.shakeIntensity = 0;
      }
    }
  }

  public shake(duration = 0.3, intensity = 6) {
    this.shakeTimer = duration;
    this.shakeIntensity = intensity;
  }

  public setTarget(x: number, y: number, zoom?: number) {
    this.targetX = x;
    this.targetY = y;
    if (zoom !== undefined) {
      this.targetZoom = Math.max(this.minZoom, Math.min(this.maxZoom, zoom));
    }
  }

  public snapTo(x: number, y: number, zoom?: number) {
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.targetY = y;
    if (zoom !== undefined) {
      this.zoom = zoom;
      this.targetZoom = zoom;
    }
  }

  public screenToWorld(
    screenX: number,
    screenY: number,
    viewportW: number,
    viewportH: number
  ): { x: number; y: number } {
    const cx = viewportW / 2;
    const cy = viewportH / 2;
    const worldX = (screenX - cx) / this.zoom + this.x;
    const worldY = (screenY - cy) / this.zoom + this.y;
    return { x: worldX, y: worldY };
  }

  public worldToScreen(
    worldX: number,
    worldY: number,
    viewportW: number,
    viewportH: number
  ): { x: number; y: number } {
    const cx = viewportW / 2;
    const cy = viewportH / 2;
    const screenX = (worldX - this.x) * this.zoom + cx;
    const screenY = (worldY - this.y) * this.zoom + cy;
    return { x: screenX, y: screenY };
  }

  public applyTransform(ctx: CanvasRenderingContext2D, viewportW: number, viewportH: number) {
    const cx = viewportW / 2;
    const cy = viewportH / 2;

    let offsetX = 0;
    let offsetY = 0;
    if (this.shakeTimer > 0) {
      offsetX = (Math.random() * 2 - 1) * this.shakeIntensity;
      offsetY = (Math.random() * 2 - 1) * this.shakeIntensity;
    }

    ctx.translate(cx + offsetX, cy + offsetY);
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-this.x, -this.y);
  }
}
