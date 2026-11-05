import { TileType, PropInstance } from '../types/environment';
import { spriteManager } from './SpriteManager';

export class TileRenderer {
  // Tile rendering with rich texture and depth
  public static drawTile(
    ctx: CanvasRenderingContext2D,
    type: TileType,
    x: number,
    y: number,
    size: number
  ) {
    ctx.save();

    // Check if rich sprite asset is available from SpriteManager
    const tileSprite = spriteManager.getTileSprite(type);
    if (tileSprite) {
      const { canvas, rect } = tileSprite;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(canvas, rect.x, rect.y, rect.w, rect.h, x, y, size, size);
      ctx.restore();
      return;
    }

    switch (type) {
      case 'floor_carpet_grey': {
        // Scranton office carpet: neutral grey with micro-weave
        ctx.fillStyle = '#838e99';
        ctx.fillRect(x, y, size, size);
        ctx.fillStyle = '#78828d';
        for (let i = 0; i < size; i += 4) {
          for (let j = 0; j < size; j += 4) {
            if ((i + j) % 8 === 0) {
              ctx.fillRect(x + i, y + j, 2, 2);
            }
          }
        }
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.06)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, size, size);
        break;
      }

      case 'floor_carpet_blue': {
        // Conference room carpet: executive navy/slate blue
        ctx.fillStyle = '#3f5263';
        ctx.fillRect(x, y, size, size);
        ctx.fillStyle = '#344554';
        for (let i = 2; i < size; i += 6) {
          for (let j = 2; j < size; j += 6) {
            ctx.fillRect(x + i, y + j, 2, 2);
          }
        }
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.strokeRect(x, y, size, size);
        break;
      }

      case 'floor_tile_kitchen': {
        // Breakroom/kitchen checkered linoleum tiles
        const half = size / 2;
        const col1 = '#c5ccd3';
        const col2 = '#e1e8ed';
        ctx.fillStyle = col1;
        ctx.fillRect(x, y, half, half);
        ctx.fillRect(x + half, y + half, half, half);
        ctx.fillStyle = col2;
        ctx.fillRect(x + half, y, half, half);
        ctx.fillRect(x, y + half, half, half);
        ctx.strokeStyle = '#9ca8b3';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, size, size);
        break;
      }

      case 'floor_wood': {
        // Warm hardwood floorboards with wood grain
        ctx.fillStyle = '#8f633a';
        ctx.fillRect(x, y, size, size);
        ctx.fillStyle = '#7a512c';
        for (let i = 0; i < size; i += 8) {
          ctx.fillRect(x, y + i, size, 1);
        }
        // Wood plank nails
        ctx.fillStyle = '#5c3d20';
        ctx.fillRect(x + 2, y + 2, 1, 1);
        ctx.fillRect(x + size - 3, y + 6, 1, 1);
        break;
      }

      case 'wall_office_top': {
        // Drywall office wall with wooden baseboard
        ctx.fillStyle = '#d3cbbe';
        ctx.fillRect(x, y, size, size - 8);
        ctx.fillStyle = '#b5ac9b';
        ctx.fillRect(x, y, size, 4);
        ctx.fillStyle = '#5c4028';
        ctx.fillRect(x, y + size - 8, size, 8);
        ctx.fillStyle = '#3d2b1a';
        ctx.fillRect(x, y + size - 2, size, 2);
        break;
      }

      case 'wall_office_side': {
        ctx.fillStyle = '#beb6a8';
        ctx.fillRect(x, y, size, size);
        ctx.fillStyle = '#5c4028';
        ctx.fillRect(x, y + size - 8, size, 8);
        break;
      }

      case 'wall_brick': {
        // Greenwich Village exposed red brick texture
        ctx.fillStyle = '#991b1b';
        ctx.fillRect(x, y, size, size);
        // Brick mortar lines
        ctx.fillStyle = '#7f1d1d';
        ctx.fillRect(x, y + 7, size, 1.5);
        ctx.fillRect(x, y + 15, size, 1.5);
        ctx.fillRect(x, y + 23, size, 1.5);
        ctx.fillRect(x, y + 31, size, 1.5);
        // Vertical mortar joints
        ctx.fillRect(x + 8, y, 1.5, 7);
        ctx.fillRect(x + 24, y, 1.5, 7);
        ctx.fillRect(x + 16, y + 8, 1.5, 7);
        ctx.fillRect(x + 8, y + 16, 1.5, 7);
        ctx.fillRect(x + 24, y + 16, 1.5, 7);
        ctx.fillRect(x + 16, y + 24, 1.5, 7);
        // Mortar highlight
        ctx.fillStyle = '#d6d3d1';
        ctx.fillRect(x, y + 8, size, 0.8);
        ctx.fillRect(x, y + 24, size, 0.8);
        break;
      }

      case 'wall_glass': {
        // Glass wall partitions with metallic frame
        ctx.fillStyle = 'rgba(186, 230, 253, 0.45)';
        ctx.fillRect(x, y, size, size);
        ctx.fillStyle = '#374151';
        ctx.fillRect(x, y, size, 3);
        ctx.fillRect(x, y + size - 3, size, 3);
        ctx.fillRect(x, y, 3, size);
        ctx.fillRect(x + size - 3, y, 3, size);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.moveTo(x + 4, y + size - 6);
        ctx.lineTo(x + 12, y + size - 6);
        ctx.lineTo(x + size - 6, y + 6);
        ctx.lineTo(x + size - 14, y + 6);
        ctx.closePath();
        ctx.fill();
        break;
      }

      case 'window_blinds': {
        // Large Street Window with Venetian blinds
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(x, y, size, size);
        ctx.fillStyle = '#f8fafc';
        for (let i = 2; i < size; i += 4) {
          ctx.fillRect(x + 2, y + i, size - 4, 2);
        }
        ctx.fillStyle = '#334155';
        ctx.strokeRect(x + 1, y + 1, size - 2, size - 2);
        ctx.fillStyle = '#64748b';
        ctx.fillRect(x + size / 2, y + 2, 1, size - 4);
        break;
      }

      case 'door_wood': {
        ctx.fillStyle = '#7a4e28';
        ctx.fillRect(x, y, size, size);
        ctx.fillStyle = '#5c3818';
        ctx.strokeRect(x + 2, y + 2, size - 4, size - 4);
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(x + size - 7, y + size / 2, 4, 4);
        break;
      }

      case 'door_glass': {
        ctx.fillStyle = 'rgba(160, 215, 245, 0.5)';
        ctx.fillRect(x, y, size, size);
        ctx.fillStyle = '#475569';
        ctx.strokeRect(x + 2, y + 2, size - 4, size - 4);
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(x + size - 6, y + size / 2 - 4, 3, 8);
        break;
      }
    }

    ctx.restore();
  }

  // Draw Props & Interactive Objects with Rich Details
  public static drawProp(
    ctx: CanvasRenderingContext2D,
    prop: PropInstance,
    tileSize: number,
    state?: Record<string, any>,
    gameTime?: number
  ) {
    const px = prop.x * tileSize;
    const py = prop.y * tileSize;
    const w = (prop.width || 1) * tileSize;
    const h = (prop.height || 1) * tileSize;
    const now = gameTime !== undefined ? gameTime : Date.now();
    const propName = prop.name?.toLowerCase() || '';

    ctx.save();

    // Check if rich sprite asset is available from SpriteManager
    const propSprite = spriteManager.getPropSprite(
      prop.type,
      state?.ignited ? 'ignited' : undefined
    );

    if (propSprite) {
      const { canvas, rect, scale: customScale, offsetX, offsetY } = propSprite;
      ctx.imageSmoothingEnabled = false;

      // Uniform aspect ratio scaling: fit within the allocated grid box without distortion
      // Only use customScale if explicitly defined on the prop; otherwise fit to grid box
      const fitScale = (customScale != null) ? customScale : Math.min(w / rect.w, h / rect.h);
      const drawW = Math.round(rect.w * fitScale);
      const drawH = Math.round(rect.h * fitScale);

      // Center horizontally in the grid footprint and align to bottom ground line + custom offsets
      const drawX = Math.round(px + (w - drawW) / 2 + (offsetX || 0));
      const drawY = Math.round(py + (h - drawH) + (offsetY || 0));

      ctx.drawImage(
        canvas,
        rect.x,
        rect.y,
        rect.w,
        rect.h,
        drawX,
        drawY,
        drawW,
        drawH
      );
      ctx.restore();
      return;
    }

    switch (prop.type) {
      case 'desk_wood': {
        // Check if it's a coffee table vs work desk
        if (propName.includes('coffee') || propName.includes('booth')) {
          // Low wood coffee table with ceramic mugs / glasses
          ctx.fillStyle = '#5c3a1e';
          ctx.fillRect(px, py + 4, w, h - 4);
          ctx.fillStyle = '#7a4e28';
          ctx.fillRect(px + 2, py + 6, w - 4, h - 8);

          // Big ceramic mugs / glasses on table
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(px + 8, py + 10, 6, 6);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(px + 8, py + 10, 6, 1);
          // Steam puff
          const steam = Math.sin(now / 220) * 1.5;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.fillRect(px + 10 + steam, py + 5, 2, 3);

          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(px + w - 16, py + 10, 6, 6);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(px + w - 16, py + 10, 6, 1);

          // Coasters & Napkins
          ctx.fillStyle = '#fed7aa';
          ctx.fillRect(px + w / 2 - 5, py + 12, 10, 6);
          break;
        }

        // Standard wood desk with monitor and post-its
        ctx.fillStyle = '#8c5e34';
        ctx.fillRect(px, py + 8, w, h - 8);
        ctx.fillStyle = '#a67242';
        ctx.fillRect(px + 2, py + 10, w - 4, 6);

        // Computer Monitor
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(px + w / 2 - 9, py + 2, 18, 12);
        ctx.fillStyle = (now % 2000 > 1000) ? '#38bdf8' : '#0284c7';
        ctx.fillRect(px + w / 2 - 7, py + 4, 14, 8);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fillRect(px + w / 2 - 5, py + 6, 8, 1);
        ctx.fillRect(px + w / 2 - 5, py + 8, 10, 1);

        ctx.fillStyle = '#475569';
        ctx.fillRect(px + w / 2 - 3, py + 14, 6, 3);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(px + w / 2 - 8, py + 18, 16, 4);

        // Post-it notes
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(px + w - 12, py + 14, 6, 6);
        ctx.fillStyle = '#f43f5e';
        ctx.fillRect(px + w - 14, py + 21, 5, 5);
        break;
      }

      case 'desk_modern': {
        // Tech Startup Workstation with dual widescreen monitors
        ctx.fillStyle = '#334155';
        ctx.fillRect(px, py + 6, w, h - 6);
        ctx.fillStyle = '#475569';
        ctx.fillRect(px + 2, py + 8, w - 4, 4);

        // Widescreen monitor with glowing code IDE
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(px + w / 2 - 16, py + 2, 32, 15);
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(px + w / 2 - 14, py + 4, 28, 11);
        // Code lines (green & amber syntax highlighting)
        ctx.fillStyle = '#4ade80';
        ctx.fillRect(px + w / 2 - 12, py + 6, 14, 1);
        ctx.fillRect(px + w / 2 - 12, py + 8, 18, 1);
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(px + w / 2 - 12, py + 10, 12, 1);

        // Keyboard & Energy drink can
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(px + w / 2 - 8, py + 20, 16, 4);
        ctx.fillStyle = '#10b981';
        ctx.fillRect(px + w - 10, py + 14, 4, 8);
        break;
      }

      case 'coffee_maker': {
        // Italian Espresso Machine with steaming spouts
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(px + 4, py + 4, w - 8, h - 8);
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(px + 6, py + 6, w - 12, 6);
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(px + w / 2 - 2, py + 8, 4, 4);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(px + w / 2 - 4, py + 16, 8, 3);

        const steamBob = Math.sin(now / 200) * 2;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillRect(px + w / 2 - 2, py - 2 + steamBob, 4, 4);
        break;
      }

      case 'sofa_leather': {
        // Check Show-Specific Couch Theme
        if (propName.includes('orange') || propName.includes('velvet')) {
          // 1. Friends Iconic Orange Velvet Couch
          ctx.fillStyle = '#c2410c'; // Base orange
          ctx.fillRect(px, py + 2, w, h - 2);

          // Plush orange velvet cushions
          ctx.fillStyle = '#ea580c';
          const cushW = (w - 12) / 3;
          for (let i = 0; i < 3; i++) {
            ctx.fillRect(px + 6 + i * cushW, py + 8, cushW - 2, h - 14);
            // Tufted buttons
            ctx.fillStyle = '#9a3412';
            ctx.fillRect(px + 10 + i * cushW, py + 14, 2, 2);
            ctx.fillRect(px + 18 + i * cushW, py + 14, 2, 2);
            ctx.fillStyle = '#ea580c';
          }

          // Gold Fringe Tassels along bottom edge!
          ctx.fillStyle = '#eab308';
          for (let i = 4; i < w - 4; i += 4) {
            ctx.fillRect(px + i, py + h - 4, 2, 4);
          }

          // Rounded velvet armrests
          ctx.fillStyle = '#9a3412';
          ctx.fillRect(px, py + 4, 6, h - 6);
          ctx.fillRect(px + w - 6, py + 4, 6, h - 6);
          ctx.fillStyle = '#ea580c';
          ctx.fillRect(px + 1, py + 6, 4, h - 10);
          ctx.fillRect(px + w - 5, py + 6, 4, h - 10);
          break;
        }

        if (propName.includes('red') || propName.includes('booth')) {
          // 2. HIMYM MacLaren's Red Leather Corner Booth
          ctx.fillStyle = '#451a03'; // Mahogany wood border frame
          ctx.fillRect(px, py, w, h);

          // Deep Red Leather Cushions
          ctx.fillStyle = '#991b1b';
          ctx.fillRect(px + 4, py + 6, w - 8, h - 8);

          // Tufted diamond buttons & brass studs
          ctx.fillStyle = '#7f1d1d';
          for (let row = 0; row < 2; row++) {
            for (let col = 0; col < 6; col++) {
              ctx.fillRect(px + 10 + col * 18, py + 10 + row * 16, 3, 3);
              ctx.fillStyle = '#fbbf24'; // Brass button
              ctx.fillRect(px + 11 + col * 18, py + 11 + row * 16, 1, 1);
              ctx.fillStyle = '#7f1d1d';
            }
          }

          // Crimson backrest ledge
          ctx.fillStyle = '#dc2626';
          ctx.fillRect(px + 4, py + 2, w - 8, 4);
          break;
        }

        if (propName.includes('erlich') || propName.includes('kimono')) {
          // 3. Silicon Valley Erlich's Living Room Couch
          ctx.fillStyle = '#57534e';
          ctx.fillRect(px, py, w, h);
          ctx.fillStyle = '#78716c';
          ctx.fillRect(px + 4, py + 6, w - 8, h - 8);

          // Patterned Throw Pillows (Yellow & Blue)
          ctx.fillStyle = '#ca8a04';
          ctx.fillRect(px + 6, py + 8, 12, 12);
          ctx.fillStyle = '#0284c7';
          ctx.fillRect(px + w - 18, py + 8, 12, 12);
          break;
        }

        // Default brown office leather sofa
        ctx.fillStyle = '#4a2c11';
        ctx.fillRect(px, py, w, h);
        ctx.fillStyle = '#6b401b';
        ctx.fillRect(px + 4, py + 6, w / 2 - 5, h - 8);
        ctx.fillRect(px + w / 2 + 1, py + 6, w / 2 - 5, h - 8);
        break;
      }

      case 'coffee_bar': {
        // Check Show-Specific Bar Counter
        if (propName.includes('espresso') || propName.includes('pastry') || propName.includes('gunther')) {
          // Central Perk Barista Counter with Pastry Glass Display
          ctx.fillStyle = '#5c3a1e';
          ctx.fillRect(px, py, w, h);
          ctx.fillStyle = '#f8fafc'; // Marble counter slab
          ctx.fillRect(px, py, w, 6);

          // Glass Pastry Display Case
          ctx.fillStyle = 'rgba(186, 230, 253, 0.6)';
          ctx.fillRect(px + 8, py + 8, 36, 18);
          ctx.strokeStyle = '#64748b';
          ctx.strokeRect(px + 8, py + 8, 36, 18);
          // Croissants & Muffins inside
          ctx.fillStyle = '#d97706';
          ctx.fillRect(px + 12, py + 18, 8, 5); // Croissant
          ctx.fillStyle = '#3b82f6';
          ctx.fillRect(px + 24, py + 16, 6, 7); // Blueberry muffin

          // Tip jar with dollar bills
          ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.fillRect(px + w - 24, py + 8, 8, 12);
          ctx.fillStyle = '#10b981';
          ctx.fillRect(px + w - 22, py + 12, 4, 6);

          // Gunther's register
          ctx.fillStyle = '#334155';
          ctx.fillRect(px + w - 44, py + 8, 14, 12);
          ctx.fillStyle = '#22c55e';
          ctx.fillRect(px + w - 42, py + 10, 4, 3);
          break;
        }

        if (propName.includes('maclaren') || propName.includes('bar counter')) {
          // MacLaren's Irish Pub Bar with Brass Footrail & Beer Taps
          ctx.fillStyle = '#3b1c0a'; // Dark Irish pub mahogany
          ctx.fillRect(px, py, w, h);
          ctx.fillStyle = '#5c2b0e'; // Countertop shine
          ctx.fillRect(px, py + 2, w, 8);

          // Shiny Brass Footrail
          ctx.fillStyle = '#fbbf24';
          ctx.fillRect(px + 4, py + h - 4, w - 8, 3);

          // 3 Chrome Draft Beer Taps with handles
          for (let i = 0; i < 3; i++) {
            const tapX = px + 24 + i * 22;
            ctx.fillStyle = '#94a3b8';
            ctx.fillRect(tapX, py - 4, 4, 12);
            ctx.fillStyle = '#b45309'; // Wood tap handle
            ctx.fillRect(tapX + 1, py - 10, 2, 6);
          }

          // Foaming Pint Glasses on bar napkins
          ctx.fillStyle = '#fed7aa'; // Napkin
          ctx.fillRect(px + w - 36, py + 6, 12, 10);
          ctx.fillStyle = '#f59e0b'; // Amber beer
          ctx.fillRect(px + w - 34, py + 6, 8, 10);
          ctx.fillStyle = '#ffffff'; // White foam head
          ctx.fillRect(px + w - 34, py + 4, 8, 3);
          break;
        }

        // Default kitchen counter
        ctx.fillStyle = '#5c3a1e';
        ctx.fillRect(px, py, w, h);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(px + 4, py + 4, 20, 14);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(px + 8, py + 8, 12, 8);
        break;
      }

      case 'server_rack': {
        // Anton DIY Server Rack with animated status LEDs
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(px, py, w, h);
        ctx.strokeStyle = '#334155';
        ctx.strokeRect(px, py, w, h);

        // Server blades with blinking LEDs
        for (let row = 0; row < 5; row++) {
          const sy = py + 6 + row * 12;
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(px + 4, sy, w - 8, 8);

          // Blinking LED status lights
          const ledIndex = (row + Math.floor(now / 150)) % 4;
          ctx.fillStyle = ledIndex === 0 ? '#22c55e' : ledIndex === 1 ? '#06b6d4' : '#f59e0b';
          ctx.fillRect(px + 8, sy + 3, 3, 3);
          ctx.fillRect(px + 14, sy + 3, 3, 3);
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(px + 20, sy + 3, 3, 3);

          // Blade handles
          ctx.fillStyle = '#64748b';
          ctx.fillRect(px + w - 12, sy + 2, 4, 4);
        }
        break;
      }

      case 'rug': {
        // Ornate Persian / Oriental Rug under Central Perk / Pub
        ctx.fillStyle = '#881337'; // Deep burgundy
        ctx.fillRect(px, py, w, h);

        // Ornate navy border
        ctx.strokeStyle = '#1e3a8a';
        ctx.lineWidth = 3;
        ctx.strokeRect(px + 4, py + 4, w - 8, h - 8);

        // Gold center floral medallion
        ctx.fillStyle = '#d97706';
        ctx.beginPath();
        ctx.ellipse(px + w / 2, py + h / 2, w / 4, h / 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // White / cream fringe edges
        ctx.fillStyle = '#fef3c7';
        for (let i = 2; i < w - 2; i += 3) {
          ctx.fillRect(px + i, py - 2, 1.5, 3);
          ctx.fillRect(px + i, py + h - 1, 1.5, 3);
        }
        break;
      }

      case 'french_horn': {
        // The Blue French Horn Wall Trophy Mount
        ctx.fillStyle = '#5c3a1e'; // Wood plaque
        ctx.fillRect(px, py, w, h);
        ctx.fillStyle = '#fbbf24'; // Brass plate
        ctx.fillRect(px + 2, py + h - 4, w - 4, 3);

        // Metallic Blue French Horn Coils & Bell
        ctx.fillStyle = '#1d4ed8';
        ctx.beginPath();
        ctx.arc(px + w / 2 - 2, py + h / 2 - 2, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#3b82f6'; // Flared horn bell
        ctx.beginPath();
        ctx.moveTo(px + w - 6, py + 4);
        ctx.lineTo(px + w, py + h / 2 + 2);
        ctx.lineTo(px + w - 4, py + h / 2 + 6);
        ctx.closePath();
        ctx.fill();
        break;
      }

      case 'umbrella_stand': {
        // Antique Brass Stand with The Yellow Umbrella
        ctx.fillStyle = '#b45309'; // Brass stand
        ctx.fillRect(px + 4, py + 8, w - 8, h - 8);
        ctx.fillStyle = '#fbbf24';
        ctx.strokeRect(px + 4, py + 8, w - 8, h - 8);

        // The Bright Yellow Umbrella
        ctx.fillStyle = '#facc15';
        ctx.fillRect(px + 8, py - 4, 6, 16);
        // Wooden curved handle
        ctx.fillStyle = '#78350f';
        ctx.fillRect(px + 8, py - 8, 3, 5);
        ctx.fillRect(px + 5, py - 10, 6, 3);
        break;
      }

      case 'jukebox': {
        // Vintage Rock Jukebox with Glowing Neon Arches
        ctx.fillStyle = '#451a03';
        ctx.fillRect(px, py, w, h);

        // Glowing Rainbow Neon Arch
        const neonColors = ['#ef4444', '#facc15', '#22c55e', '#38bdf8', '#ec4899'];
        const neonCol = neonColors[Math.floor(now / 200) % neonColors.length];
        ctx.strokeStyle = neonCol;
        ctx.lineWidth = 3;
        ctx.strokeRect(px + 4, py + 4, w - 8, h - 12);

        // Record selection window
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(px + 8, py + 10, w - 16, 12);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(px + 12, py + 14, 8, 4);
        break;
      }

      case 'neon_sign': {
        // Glowing Neon Wall Sign
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(px, py, w, h);
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 2;
        ctx.strokeRect(px, py, w, h);
        ctx.fillStyle = '#4ade80';
        ctx.font = 'bold 9px monospace';
        ctx.fillText(prop.name || 'NEON', px + 4, py + h / 2 + 3);
        break;
      }

      case 'swords_crossed': {
        // Ted & Marshall's Apartment Crossed Broadswords Mount!
        ctx.fillStyle = '#7f1d1d'; // Crimson velvet shield
        ctx.beginPath();
        ctx.moveTo(px + w / 2, py + 2);
        ctx.lineTo(px + w - 4, py + 8);
        ctx.lineTo(px + w - 6, py + h - 6);
        ctx.lineTo(px + w / 2, py + h - 2);
        ctx.lineTo(px + 6, py + h - 6);
        ctx.lineTo(px + 4, py + 8);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#fbbf24'; // Gold trim
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Diagonal Sword 1 (\)
        ctx.strokeStyle = '#f1f5f9';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(px + 6, py + 6);
        ctx.lineTo(px + w - 6, py + h - 6);
        ctx.stroke();
        // Crossguard & Pommel 1
        ctx.fillStyle = '#d97706';
        ctx.fillRect(px + 4, py + 9, 8, 3);
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(px + 3, py + 3, 4, 4);

        // Diagonal Sword 2 (/)
        ctx.strokeStyle = '#f1f5f9';
        ctx.beginPath();
        ctx.moveTo(px + w - 6, py + 6);
        ctx.lineTo(px + 6, py + h - 6);
        ctx.stroke();
        // Crossguard & Pommel 2
        ctx.fillStyle = '#d97706';
        ctx.fillRect(px + w - 12, py + 9, 8, 3);
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(px + w - 7, py + 3, 4, 4);
        break;
      }

      case 'dartboard': {
        // Classic Cork Dartboard with concentric scoring rings
        ctx.fillStyle = '#1c1917'; // Outer backboard
        ctx.beginPath();
        ctx.arc(px + w / 2, py + h / 2, Math.min(w, h) / 2 - 2, 0, Math.PI * 2);
        ctx.fill();

        // Green & Red Double Rings
        ctx.strokeStyle = '#15803d';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(px + w / 2, py + h / 2, Math.min(w, h) / 2 - 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(px + w / 2, py + h / 2, Math.min(w, h) / 2 - 10, 0, Math.PI * 2);
        ctx.stroke();

        // Center Red Bullseye
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(px + w / 2, py + h / 2, 3, 0, Math.PI * 2);
        ctx.fill();

        // 3 Darts sticking in board
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(px + w / 2 + 1, py + h / 2 - 4, 6, 1.5);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(px + w / 2 - 5, py + h / 2 + 2, 5, 1.5);
        break;
      }

      case 'high_top_table': {
        // Round High-Top Pub Table with Candle Lamp & Beers
        ctx.fillStyle = '#3b1c0a'; // Pedestal foot
        ctx.fillRect(px + w / 2 - 3, py + h - 4, 6, 4);
        ctx.fillStyle = '#1e293b'; // Pole
        ctx.fillRect(px + w / 2 - 1.5, py + 8, 3, h - 12);

        // Round Mahogany Tabletop
        ctx.fillStyle = '#5c2b0e';
        ctx.beginPath();
        ctx.ellipse(px + w / 2, py + 8, w / 2 - 2, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#271206';
        ctx.stroke();

        // Candle Lantern with flickering warm flame
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(px + w / 2 - 2, py + 2, 4, 5);
        const candleFlicker = (Math.sin(now / 120) + 1) * 0.5;
        ctx.fillStyle = candleFlicker > 0.4 ? '#f59e0b' : '#fbbf24';
        ctx.fillRect(px + w / 2 - 1, py, 2, 3);
        break;
      }

      case 'liquor_shelf': {
        // Multi-Tiered Mirrored Liquor Shelves behind Bar
        ctx.fillStyle = '#1e293b'; // Dark background
        ctx.fillRect(px, py, w, h);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)'; // Mirror sheen
        ctx.fillRect(px + 2, py + 2, w - 4, h - 4);

        // 3 Glass Shelves with illuminated bottles
        const bottleColors = ['#b45309', '#38bdf8', '#10b981', '#ef4444', '#ca8a04', '#ec4899', '#facc15'];
        for (let shelf = 0; shelf < 3; shelf++) {
          const sy = py + 6 + shelf * 12;
          ctx.fillStyle = '#94a3b8'; // Glass shelf line
          ctx.fillRect(px + 4, sy + 8, w - 8, 2);

          // Bottles on shelf
          for (let b = 0; b < 6; b++) {
            const bx = px + 6 + b * 9;
            ctx.fillStyle = bottleColors[(shelf * 2 + b) % bottleColors.length];
            ctx.fillRect(bx, sy, 5, 8);
            ctx.fillStyle = '#ffffff'; // Cork / neck
            ctx.fillRect(bx + 1.5, sy - 2, 2, 2);
          }
        }
        break;
      }

      case 'pub_fireplace': {
        // MacLaren's / NYC Apartment Brick Fireplace
        ctx.fillStyle = '#7f1d1d'; // Brick hearth
        ctx.fillRect(px, py, w, h);
        ctx.fillStyle = '#451a03'; // Heavy wood mantel
        ctx.fillRect(px, py, w, 6);

        // Cast-Iron Firebox
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(px + 6, py + 8, w - 12, h - 8);

        // Glowing Embers & Animated Fire Flames
        const flameBob = Math.sin(now / 150) * 2;
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(px + 10, py + h - 8, w - 20, 6);
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(px + w / 2 + flameBob, py + h - 6, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(px + w / 2 - flameBob, py + h - 4, 4, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'framed_art': {
        // Gold Framed Art / Ducky Tie Shadowbox
        ctx.fillStyle = '#b45309'; // Gold frame
        ctx.fillRect(px, py, w, h);
        ctx.fillStyle = '#1e1b4b'; // Navy matting
        ctx.fillRect(px + 2, py + 2, w - 4, h - 4);

        if (propName.includes('ducky') || propName.includes('tie')) {
          // Barney's Ducky Tie!
          ctx.fillStyle = '#38bdf8'; // Blue tie body
          ctx.fillRect(px + w / 2 - 2, py + 4, 4, h - 7);
          ctx.fillStyle = '#facc15'; // Little Yellow Ducks!
          ctx.fillRect(px + w / 2 - 1, py + 6, 2, 2);
          ctx.fillRect(px + w / 2 - 1, py + 10, 2, 2);
        } else {
          // NYC Skyline sketch
          ctx.fillStyle = '#e2e8f0';
          ctx.fillRect(px + 4, py + 4, w - 8, h - 8);
          ctx.fillStyle = '#334155';
          ctx.fillRect(px + 6, py + 8, 4, 10);
          ctx.fillRect(px + 12, py + 5, 5, 13);
          ctx.fillRect(px + 19, py + 10, 4, 8);
        }
        break;
      }

      case 'whiteboard': {
        // Scrum board with sprint burndown chart
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(px, py, w, h);
        ctx.strokeStyle = '#94a3b8';
        ctx.strokeRect(px, py, w, h);
        // Red headline marker
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(px + 6, py + 5, 20, 2);
        // Blue graph line
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(px + 6, py + h - 6);
        ctx.lineTo(px + 24, py + 14);
        ctx.lineTo(px + 40, py + 18);
        ctx.lineTo(px + 56, py + 7);
        ctx.stroke();
        // Colorful Post-it notes
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(px + w - 24, py + 6, 8, 8);
        ctx.fillStyle = '#ec4899';
        ctx.fillRect(px + w - 14, py + 6, 8, 8);
        break;
      }

      case 'potted_plant': {
        ctx.fillStyle = '#c2410c';
        ctx.fillRect(px + 6, py + h - 12, w - 12, 12);
        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.arc(px + w / 2, py + 10, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(px + w / 2 - 4, py + 8, 7, 0, Math.PI * 2);
        ctx.arc(px + w / 2 + 4, py + 6, 6, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'chair_office': {
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(px + w / 2, py + h / 2, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#334155';
        ctx.fillRect(px + w / 2 - 7, py + 2, 14, 5);
        break;
      }

      case 'chair_conference': {
        ctx.fillStyle = '#1e3a8a';
        ctx.fillRect(px + 4, py + 4, w - 8, h - 8);
        ctx.fillStyle = '#172554';
        ctx.fillRect(px + 4, py + 2, w - 8, 4);
        break;
      }

      case 'trash_can': {
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(px + 4, py + 6, w - 8, h - 6);
        ctx.fillStyle = '#64748b';
        ctx.fillRect(px + 2, py + 4, w - 4, 3);
        if (state?.ignited) {
          // Animated flames rising from trash can
          const fBob = Math.sin(now / 100) * 2;
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(px + 4, py - 4 + fBob, w - 8, 8);
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(px + 6, py - 6 + fBob * 1.2, w - 12, 6);
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(px + 8, py - 8 + fBob * 0.8, w - 16, 4);
        }
        break;
      }

      case 'conference_table': {
        // Large executive conference table with mahogany finish, papers & pens
        ctx.fillStyle = '#451a03'; // Table border
        ctx.fillRect(px, py + 2, w, h - 4);
        ctx.fillStyle = '#78350f'; // Table surface
        ctx.fillRect(px + 3, py + 5, w - 6, h - 10);
        ctx.fillStyle = '#9a3412'; // Surface wood shine
        ctx.fillRect(px + 6, py + 8, w - 12, 3);

        // White paper folders and legal pads on table
        const padCount = Math.max(2, Math.floor(w / 40));
        for (let p = 0; p < padCount; p++) {
          const padX = px + 14 + p * 38;
          ctx.fillStyle = '#fef08a'; // Yellow legal pad
          ctx.fillRect(padX, py + 10, 10, 12);
          ctx.fillStyle = '#ef4444'; // Red pen
          ctx.fillRect(padX + 12, py + 11, 2, 8);
          // White paper
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(padX + 20, py + 9, 12, 13);
          ctx.fillStyle = '#3b82f6';
          ctx.fillRect(padX + 22, py + 12, 8, 1);
        }

        // Central speakerphone unit
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(px + w / 2 - 8, py + h / 2 - 5, 16, 10);
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(px + w / 2 - 2, py + h / 2 - 2, 4, 3);
        break;
      }

      case 'water_cooler': {
        // Breakroom Water Cooler with bubbly jug & paper cone dispenser
        // Stand base
        ctx.fillStyle = '#475569';
        ctx.fillRect(px + 4, py + 16, w - 8, h - 16);
        ctx.fillStyle = '#64748b';
        ctx.fillRect(px + 6, py + 18, w - 12, 8);

        // Spigots (blue cold, red hot)
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(px + 8, py + 20, 3, 4);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(px + w - 11, py + 20, 3, 4);

        // Inverted Blue Water Bottle Jug
        ctx.fillStyle = 'rgba(56, 189, 248, 0.75)';
        ctx.beginPath();
        ctx.ellipse(px + w / 2, py + 8, 8, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(px + w / 2 - 3, py + 15, 6, 2); // Jug neck

        // Animated Water Bubbles
        const bubbleY = (now / 180) % 10;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fillRect(px + w / 2 - 2, py + 12 - bubbleY, 2, 2);
        ctx.fillRect(px + w / 2 + 2, py + 10 - ((bubbleY + 5) % 10), 2, 2);

        // Side cone cup dispenser
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(px + w - 4, py + 8, 4, 16);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(px + w - 3, py + 22, 2, 3);
        break;
      }

      case 'photocopier': {
        // Office Photocopier / Multi-function Printer
        ctx.fillStyle = '#334155'; // Main body
        ctx.fillRect(px + 2, py + 6, w - 4, h - 6);
        ctx.fillStyle = '#475569';
        ctx.fillRect(px + 4, py + 8, w - 8, 12);

        // Top document scanner lid
        ctx.fillStyle = '#64748b';
        ctx.fillRect(px + 4, py + 2, w - 8, 5);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(px + 6, py + 3, w - 12, 3);

        // Touch control panel & status LED
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(px + w - 12, py + 3, 8, 6);
        ctx.fillStyle = (Math.floor(now / 400) % 2 === 0) ? '#22c55e' : '#10b981';
        ctx.fillRect(px + w - 10, py + 4, 3, 2); // Green power LED

        // Output paper tray with sheets of paper
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(px + 6, py + 20, 16, 6);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(px + 7, py + 21, 14, 4);
        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(px + 9, py + 22, 8, 1);
        break;
      }

      case 'desk_reception': {
        // Pam's Wooden L-Shaped / curved reception counter
        ctx.fillStyle = '#5c3a1e';
        ctx.fillRect(px, py + 4, w, h - 4);
        ctx.fillStyle = '#7a4e28';
        ctx.fillRect(px + 2, py + 6, w - 4, 8);

        // Receptionist gold nameplate
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(px + 6, py + 2, 14, 4);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(px + 8, py + 3, 10, 1);

        // Candy jellybean dish
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.arc(px + 26, py + 8, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(px + 24, py + 7, 2, 2);
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(px + 26, py + 6, 2, 2);

        // Desktop phone & computer
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(px + w - 16, py + 2, 12, 8); // Monitor
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(px + w - 14, py + 4, 8, 5);
        ctx.fillStyle = '#475569';
        ctx.fillRect(px + w - 24, py + 6, 6, 6); // Phone handset
        break;
      }

      case 'desk_michael': {
        // Michael Scott's Executive Walnut Desk
        ctx.fillStyle = '#3b1c0a'; // Dark walnut
        ctx.fillRect(px, py + 4, w, h - 4);
        ctx.fillStyle = '#5c2b0e';
        ctx.fillRect(px + 2, py + 6, w - 4, 8);

        // Leather desk blotter
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(px + w / 2 - 12, py + 6, 24, 10);

        // World's Best Boss Coffee Mug
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(px + 8, py + 7, 5, 5);
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(px + 8, py + 7, 5, 1);

        // Golden Dundie statuette on desk
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(px + w - 12, py + 3, 4, 9);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(px + w - 14, py + 11, 8, 3);

        // Executive phone & in-tray
        ctx.fillStyle = '#475569';
        ctx.fillRect(px + 16, py + 6, 7, 6);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(px + w - 24, py + 7, 8, 6); // In-tray paper
        break;
      }

      case 'filing_cabinet': {
        // Multi-drawer metallic office filing cabinet
        ctx.fillStyle = '#475569';
        ctx.fillRect(px + 2, py + 2, w - 4, h - 4);
        ctx.fillStyle = '#64748b';
        // 3 Drawers
        const drawH = Math.floor((h - 8) / 3);
        for (let d = 0; d < 3; d++) {
          const dy = py + 4 + d * drawH;
          ctx.strokeRect(px + 4, dy, w - 8, drawH - 2);
          ctx.fillStyle = '#94a3b8';
          ctx.fillRect(px + w / 2 - 3, dy + drawH / 2 - 1, 6, 2); // Metal handle
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(px + 6, dy + 2, 4, 3); // White label
        }
        break;
      }

      case 'microwave': {
        // Kitchen Microwave
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(px + 2, py + 4, w - 4, h - 6);
        ctx.fillStyle = '#38bdf8'; // Glowing door window
        ctx.fillRect(px + 4, py + 6, w - 14, h - 10);
        ctx.fillStyle = '#22c55e'; // Green digital clock
        ctx.fillRect(px + w - 8, py + 6, 4, 2);
        break;
      }

      case 'pc_monitor': {
        // Standalone computer monitor
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(px + 4, py + 2, w - 8, h - 8);
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(px + 6, py + 4, w - 12, h - 12);
        ctx.fillStyle = '#475569';
        ctx.fillRect(px + w / 2 - 2, py + h - 6, 4, 4);
        break;
      }

      case 'fire_hazard': {
        // Fire Hazard marker / ignited box
        ctx.fillStyle = '#ea580c';
        ctx.fillRect(px + 2, py + 4, w - 4, h - 6);
        ctx.fillStyle = '#fef08a';
        ctx.font = 'bold 9px monospace';
        ctx.fillText('⚠', px + 4, py + h / 2 + 2);
        break;
      }

      case 'jello_stapler': {
        // Classic Stapler encased in green Jello
        ctx.fillStyle = 'rgba(34, 197, 94, 0.85)';
        ctx.fillRect(px + 4, py + 4, w - 8, h - 8);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(px + 8, py + 8, w - 16, 4);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(px + 10, py + 7, 4, 2);
        break;
      }

      default: {
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(px, py, w, h);
      }
    }

    ctx.restore();
  }
}
