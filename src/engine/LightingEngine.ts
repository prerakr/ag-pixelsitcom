import { TimeOfDay } from '../types/script';
import { SettingDefinition } from '../types/environment';

export class LightingEngine {
  public currentTime: TimeOfDay = 'day';
  public targetTime: TimeOfDay = 'day';
  public transitionProgress: number = 1.0;

  public setTimeOfDay(time: TimeOfDay) {
    this.currentTime = time;
    this.targetTime = time;
  }

  public update(dt: number) {
    if (this.currentTime !== this.targetTime) {
      this.transitionProgress += dt * 1.5;
      if (this.transitionProgress >= 1.0) {
        this.currentTime = this.targetTime;
        this.transitionProgress = 1.0;
      }
    }
  }

  // Render ambient lighting overlay and light cones
  public drawLighting(
    ctx: CanvasRenderingContext2D,
    setting: SettingDefinition,
    worldW: number,
    worldH: number
  ) {
    const now = Date.now();
    ctx.save();

    switch (this.currentTime) {
      case 'day': {
        // Subtle, elegant daylight gradient from west windows
        const windowGrad = ctx.createLinearGradient(0, 0, 240, 180);
        windowGrad.addColorStop(0, 'rgba(254, 240, 138, 0.05)');
        windowGrad.addColorStop(0.5, 'rgba(254, 240, 138, 0.018)');
        windowGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
        ctx.fillStyle = windowGrad;
        ctx.fillRect(0, 0, 280, 240);
        break;
      }

      case 'golden_hour': {
        // Soft golden hour warmth
        ctx.fillStyle = 'rgba(245, 158, 11, 0.08)';
        ctx.fillRect(0, 0, worldW, worldH);

        // Delicate, soft sunlight slats through blinds
        ctx.fillStyle = 'rgba(251, 191, 36, 0.055)';
        for (let i = 0; i < 7; i++) {
          const sy = 24 + i * 40;
          ctx.beginPath();
          ctx.moveTo(0, sy);
          ctx.lineTo(worldW * 0.55, sy + 110);
          ctx.lineTo(worldW * 0.55, sy + 122);
          ctx.lineTo(0, sy + 12);
          ctx.closePath();
          ctx.fill();
        }
        break;
      }

      case 'night': {
        // Scranton Overtime Night - Soft, comfortable late-night tint (not pitch black!)
        ctx.fillStyle = 'rgba(15, 23, 42, 0.32)';
        ctx.fillRect(0, 0, worldW, worldH);

        // Illuminating light pools around active props (CRT monitors, desk lamps, vending machine)
        ctx.globalCompositeOperation = 'lighter';

        // 1. CRT Monitor & Desk Glows
        setting.props.forEach((prop) => {
          if (prop.type.includes('desk')) {
            const px = prop.x * setting.tileSize + 16;
            const py = prop.y * setting.tileSize + 16;
            const grad = ctx.createRadialGradient(px, py, 2, px, py, 48);
            grad.addColorStop(0, 'rgba(56, 189, 248, 0.22)');
            grad.addColorStop(1, 'rgba(56, 189, 248, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(px, py, 48, 0, Math.PI * 2);
            ctx.fill();
          } else if (prop.type === 'vending_machine') {
            const px = prop.x * setting.tileSize + 32;
            const py = prop.y * setting.tileSize + 32;
            const grad = ctx.createRadialGradient(px, py, 4, px, py, 64);
            grad.addColorStop(0, 'rgba(16, 185, 129, 0.28)');
            grad.addColorStop(1, 'rgba(16, 185, 129, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(px, py, 64, 0, Math.PI * 2);
            ctx.fill();
          }
        });

        // Hallway overhead moonlight pool
        const moonGrad = ctx.createRadialGradient(
          worldW * 0.45,
          worldH * 0.45,
          10,
          worldW * 0.45,
          worldH * 0.45,
          180
        );
        moonGrad.addColorStop(0, 'rgba(147, 197, 253, 0.12)');
        moonGrad.addColorStop(1, 'rgba(147, 197, 253, 0)');
        ctx.fillStyle = moonGrad;
        ctx.beginPath();
        ctx.arc(worldW * 0.45, worldH * 0.45, 180, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalCompositeOperation = 'source-over';
        break;
      }

      case 'emergency': {
        // Red Pulsing Strobe during alarms
        const pulse = (Math.sin(now / 150) + 1) / 2; // 0 to 1 oscillation
        ctx.fillStyle = `rgba(239, 68, 68, ${0.08 + pulse * 0.2})`;
        ctx.fillRect(0, 0, worldW, worldH);
        break;
      }
    }

    ctx.restore();
  }
}

export const lightingEngine = new LightingEngine();
