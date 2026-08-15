export interface Particle {
  id: string;
  type: 'paper_airplane' | 'coffee_droplet' | 'coffee_puddle' | 'dust_mote' | 'foam' | 'smoke' | 'confetti';
  x: number;
  y: number;
  z?: number; // Height above floor
  vx: number;
  vy: number;
  vz?: number;
  size: number;
  color: string;
  alpha: number;
  rotation?: number;
  rotationSpeed?: number;
  lifespan: number;
  age: number;
  targetX?: number;
  targetY?: number;
}

export class ParticleSystem {
  private particles: Particle[] = [];
  private puddles: { x: number; y: number; radius: number; maxRadius: number; alpha: number; age: number; lifespan: number }[] = [];

  public update(dt: number) {
    // 1. Update active flying/moving particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.age += dt;

      if (p.age >= p.lifespan) {
        // If coffee droplet hits end of life/ground, spawn a puddle
        if (p.type === 'coffee_droplet') {
          this.spawnPuddle(p.x, p.y, 7 + Math.random() * 5);
        }
        this.particles.splice(i, 1);
        continue;
      }

      // Physics & Velocity
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (p.z !== undefined && p.vz !== undefined) {
        p.z += p.vz * dt;
        p.vz -= 98 * dt; // gravity
        if (p.z <= 0) {
          p.z = 0;
          p.vz = 0;
          p.vx *= 0.4;
          p.vy *= 0.4;
        }
      }

      if (p.rotation !== undefined && p.rotationSpeed !== undefined) {
        p.rotation += p.rotationSpeed * dt;
      }

      // Particle specific behaviors
      if (p.type === 'paper_airplane') {
        // Guided gliding towards target
        if (p.targetX !== undefined && p.targetY !== undefined) {
          const dx = p.targetX - p.x;
          const dy = p.targetY - p.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 5) {
            p.vx = (dx / dist) * 120;
            p.vy = (dy / dist) * 80;
            p.rotation = Math.atan2(dy, dx);
          } else {
            p.vx *= 0.8;
            p.vy *= 0.8;
            p.z = Math.max(0, (p.z || 0) - dt * 30);
          }
        }
      } else if (p.type === 'smoke') {
        p.vy -= 12 * dt; // Smoke rises
        p.size += 4 * dt;
        p.alpha = Math.max(0, 1 - p.age / p.lifespan);
      } else if (p.type === 'foam') {
        p.vx *= 0.92;
        p.vy *= 0.92;
        p.size = Math.min(14, p.size + 8 * dt);
        p.alpha = Math.max(0, 1 - p.age / p.lifespan);
      } else if (p.type === 'dust_mote') {
        // Gentle brownian floating
        p.x += Math.sin(p.age * 2 + p.x) * 4 * dt;
        p.y += Math.cos(p.age * 1.5 + p.y) * 3 * dt;
      } else if (p.type === 'confetti') {
        p.vy += 25 * dt; // slow flutter
        p.x += Math.sin(p.age * 6) * 15 * dt;
      }
    }

    // 2. Update floor liquid puddles
    for (let i = this.puddles.length - 1; i >= 0; i--) {
      const puddle = this.puddles[i];
      puddle.age += dt;
      if (puddle.radius < puddle.maxRadius) {
        puddle.radius += dt * 6;
      }
      if (puddle.age >= puddle.lifespan) {
        puddle.alpha -= dt * 0.3;
        if (puddle.alpha <= 0) {
          this.puddles.splice(i, 1);
        }
      }
    }
  }

  // Spawn Paper Airplane
  public throwPaperAirplane(startX: number, startY: number, targetX: number, targetY: number) {
    const dx = targetX - startX;
    const dy = targetY - startY;
    const angle = Math.atan2(dy, dx);

    this.particles.push({
      id: `plane_${Date.now()}_${Math.random()}`,
      type: 'paper_airplane',
      x: startX,
      y: startY - 14,
      z: 22,
      vx: Math.cos(angle) * 130,
      vy: Math.sin(angle) * 90,
      vz: 8,
      size: 10,
      color: '#f8fafc',
      alpha: 1.0,
      rotation: angle,
      rotationSpeed: 0.2,
      lifespan: 3.5,
      age: 0,
      targetX,
      targetY,
    });
  }

  // Spawn Coffee Spill Splash
  public spillCoffee(x: number, y: number) {
    // Spawn 14 flying droplets
    for (let i = 0; i < 14; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 60;
      this.particles.push({
        id: `droplet_${Date.now()}_${i}`,
        type: 'coffee_droplet',
        x: x + (Math.random() * 6 - 3),
        y: y + (Math.random() * 6 - 3),
        z: 14 + Math.random() * 8,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        vz: 25 + Math.random() * 20,
        size: 2 + Math.random() * 2,
        color: '#451a03',
        alpha: 0.9,
        lifespan: 0.7 + Math.random() * 0.4,
        age: 0,
      });
    }

    // Spawn central puddle
    this.spawnPuddle(x, y, 14);
  }

  // Spawn Floor Puddle
  public spawnPuddle(x: number, y: number, maxRadius = 12) {
    this.puddles.push({
      x,
      y,
      radius: 2,
      maxRadius,
      alpha: 0.75,
      age: 0,
      lifespan: 12.0, // Stays for 12 seconds
    });
  }

  // Spawn Fire Extinguisher Foam Blast
  public shootExtinguisherFoam(startX: number, startY: number, facingAngle: number) {
    for (let i = 0; i < 18; i++) {
      const spread = (Math.random() - 0.5) * 0.7;
      const angle = facingAngle + spread;
      const speed = 80 + Math.random() * 90;

      this.particles.push({
        id: `foam_${Date.now()}_${i}`,
        type: 'foam',
        x: startX,
        y: startY - 8,
        z: 8 + Math.random() * 6,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        vz: Math.random() * 10 - 5,
        size: 4 + Math.random() * 4,
        color: '#f1f5f9',
        alpha: 0.85,
        lifespan: 1.5 + Math.random() * 0.8,
        age: 0,
      });
    }
  }

  // Spawn Ambient Dust Motes
  public spawnDustMotes(areaW: number, areaH: number, count = 20) {
    if (this.particles.filter((p) => p.type === 'dust_mote').length >= 35) return;
    for (let i = 0; i < count; i++) {
      this.particles.push({
        id: `dust_${Date.now()}_${i}`,
        type: 'dust_mote',
        x: Math.random() * areaW,
        y: Math.random() * areaH,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 4,
        size: 1 + Math.random() * 1.5,
        color: '#fef08a',
        alpha: 0.4 + Math.random() * 0.4,
        lifespan: 8.0 + Math.random() * 6.0,
        age: 0,
      });
    }
  }

  // Draw Floor Puddles (rendered beneath characters in the floor pass)
  public drawFloorPuddles(ctx: CanvasRenderingContext2D) {
    ctx.save();
    for (const puddle of this.puddles) {
      ctx.fillStyle = `rgba(69, 26, 3, ${puddle.alpha})`;
      ctx.beginPath();
      ctx.ellipse(puddle.x, puddle.y, puddle.radius, puddle.radius * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Draw Flying Particles (rendered in Y-sorted / upper pass)
  public drawParticles(ctx: CanvasRenderingContext2D) {
    ctx.save();

    for (const p of this.particles) {
      const renderY = p.y - (p.z || 0);

      switch (p.type) {
        case 'paper_airplane': {
          ctx.save();
          ctx.translate(p.x, renderY);
          ctx.rotate(p.rotation || 0);

          // Shadow on ground
          ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
          ctx.beginPath();
          ctx.ellipse(0, (p.z || 0), 6, 2.5, 0, 0, Math.PI * 2);
          ctx.fill();

          // Pixel Airplane Body
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.moveTo(7, 0);
          ctx.lineTo(-6, -4);
          ctx.lineTo(-3, 0);
          ctx.lineTo(-6, 4);
          ctx.closePath();
          ctx.fill();

          // Crease / Wing fold
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(7, 0);
          ctx.lineTo(-3, 0);
          ctx.stroke();

          ctx.restore();
          break;
        }

        case 'coffee_droplet': {
          ctx.fillStyle = `rgba(69, 26, 3, ${p.alpha})`;
          ctx.beginPath();
          ctx.arc(p.x, renderY, p.size, 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        case 'foam': {
          ctx.fillStyle = `rgba(241, 245, 249, ${p.alpha})`;
          ctx.beginPath();
          ctx.arc(p.x, renderY, p.size, 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        case 'dust_mote': {
          ctx.fillStyle = `rgba(254, 240, 138, ${p.alpha})`;
          ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
          break;
        }

        case 'smoke': {
          ctx.fillStyle = `rgba(148, 163, 184, ${p.alpha})`;
          ctx.beginPath();
          ctx.arc(p.x, renderY, p.size, 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        case 'confetti': {
          ctx.fillStyle = p.color;
          ctx.fillRect(Math.round(p.x), Math.round(renderY), 3, 2);
          break;
        }
      }
    }

    ctx.restore();
  }
}

export const particleSystem = new ParticleSystem();
