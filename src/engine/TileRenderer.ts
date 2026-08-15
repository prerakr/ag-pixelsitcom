import { TileType, PropInstance } from '../types/environment';

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

    switch (type) {
      case 'floor_carpet_grey': {
        // Scranton office carpet: neutral grey with micro-weave
        ctx.fillStyle = '#838e99';
        ctx.fillRect(x, y, size, size);
        // Subtle pixel noise texture
        ctx.fillStyle = '#78828d';
        for (let i = 0; i < size; i += 4) {
          for (let j = 0; j < size; j += 4) {
            if ((i + j) % 8 === 0) {
              ctx.fillRect(x + i, y + j, 2, 2);
            }
          }
        }
        // Subtle carpet seam grid
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
        // Michael's hardwood floorboards
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
        // Beige drywall office wall with wooden baseboard
        ctx.fillStyle = '#d3cbbe';
        ctx.fillRect(x, y, size, size - 8);
        // Wall shadow/trim
        ctx.fillStyle = '#b5ac9b';
        ctx.fillRect(x, y, size, 4);
        // Baseboard
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

      case 'wall_glass': {
        // Glass wall partition (Michael's office / Conference room)
        ctx.fillStyle = 'rgba(160, 215, 245, 0.35)';
        ctx.fillRect(x, y, size, size);
        // Metal frames
        ctx.fillStyle = '#374151';
        ctx.fillRect(x, y, size, 3);
        ctx.fillRect(x, y + size - 3, size, 3);
        ctx.fillRect(x, y, 3, size);
        ctx.fillRect(x + size - 3, y, 3, size);
        // Glass sheen diagonal reflection
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
        // Iconic office window with Venetian blinds
        ctx.fillStyle = '#7dd3fc'; // Sky
        ctx.fillRect(x, y, size, size);
        ctx.fillStyle = '#f1f5f9'; // Blinds slats
        for (let i = 2; i < size; i += 4) {
          ctx.fillRect(x + 2, y + i, size - 4, 2);
        }
        // Blinds frame & center cord
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
        // Brass doorknob
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(x + size - 7, y + size / 2, 4, 4);
        break;
      }

      case 'door_glass': {
        ctx.fillStyle = 'rgba(160, 215, 245, 0.5)';
        ctx.fillRect(x, y, size, size);
        ctx.fillStyle = '#475569';
        ctx.strokeRect(x + 2, y + 2, size - 4, size - 4);
        // Silver door handle
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(x + size - 6, y + size / 2 - 4, 3, 8);
        break;
      }

      default: {
        ctx.fillStyle = '#838e99';
        ctx.fillRect(x, y, size, size);
      }
    }

    ctx.restore();
  }

  // Draw Props with handcrafted pixel detail
  public static drawProp(
    ctx: CanvasRenderingContext2D,
    prop: PropInstance,
    tileSize: number
  ) {
    const px = prop.x * tileSize;
    const py = prop.y * tileSize;
    const w = (prop.width || 1) * tileSize;
    const h = (prop.height || 1) * tileSize;
    const now = Date.now();

    ctx.save();

    switch (prop.type) {
      case 'desk_wood': {
        // Office desk with drawers, computer, and props
        ctx.fillStyle = '#8c5e34';
        ctx.fillRect(px, py + 8, w, h - 8);
        // Surface highlight
        ctx.fillStyle = '#a67242';
        ctx.fillRect(px + 2, py + 10, w - 4, 6);
        // Desk shadow
        ctx.fillStyle = '#5c3b1e';
        ctx.fillRect(px, py + h - 4, w, 4);

        // Computer Monitor with subtle pixel screen glow
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(px + w / 2 - 9, py + 2, 18, 12);
        // Glowing monitor screen (animated subtle blue flicker)
        ctx.fillStyle = (now % 2000 > 1000) ? '#38bdf8' : '#0284c7';
        ctx.fillRect(px + w / 2 - 7, py + 4, 14, 8);
        // Screen text lines
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fillRect(px + w / 2 - 5, py + 6, 8, 1);
        ctx.fillRect(px + w / 2 - 5, py + 8, 10, 1);

        // Monitor stand
        ctx.fillStyle = '#475569';
        ctx.fillRect(px + w / 2 - 3, py + 14, 6, 3);

        // Keyboard & Mouse
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(px + w / 2 - 8, py + 18, 16, 4);
        ctx.fillStyle = '#334155';
        ctx.fillRect(px + w / 2 + 10, py + 18, 3, 4); // Mouse

        // Papers, folders & colorful Post-It notes
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(px + 4, py + 14, 8, 9);
        ctx.fillStyle = '#fbbf24'; // Yellow post-it
        ctx.fillRect(px + w - 12, py + 14, 6, 6);
        ctx.fillStyle = '#f43f5e'; // Pink post-it
        ctx.fillRect(px + w - 14, py + 21, 5, 5);
        break;
      }

      case 'desk_michael': {
        // Michael Scott's Executive Mahogany Desk
        ctx.fillStyle = '#4a2c11';
        ctx.fillRect(px, py + 6, w, h - 6);
        ctx.fillStyle = '#6b401b';
        ctx.fillRect(px + 2, py + 8, w - 4, 6);

        // Laptop / Monitor
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(px + 10, py + 2, 18, 12);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(px + 12, py + 4, 14, 8);

        // "World's Best Boss" Mug
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(px + w - 16, py + 16, 7, 7);
        ctx.fillStyle = '#0284c7'; // Blue rim
        ctx.fillRect(px + w - 16, py + 16, 7, 1);
        ctx.fillStyle = '#e2e8f0'; // Handle
        ctx.fillRect(px + w - 9, py + 18, 2, 4);

        // Golden Dundie Award Statue!
        ctx.fillStyle = '#d97706';
        ctx.fillRect(px + w - 26, py + 12, 4, 8);
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(px + w - 25, py + 10, 2, 2); // Head
        ctx.fillStyle = '#0f172a'; // Marble base
        ctx.fillRect(px + w - 28, py + 20, 8, 4);

        // Nameplate: "Michael Scott - Regional Manager"
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(px + 6, py + h - 8, 22, 4);
        ctx.fillStyle = '#000000';
        ctx.fillRect(px + 8, py + h - 7, 18, 1);

        // Seyko Certificate on desk corner
        ctx.fillStyle = '#fef3c7';
        ctx.fillRect(px + 32, py + 12, 8, 6);
        break;
      }

      case 'desk_reception': {
        // L-shaped Reception Desk (Pam's desk)
        ctx.fillStyle = '#8c5e34';
        ctx.fillRect(px, py, w, h);
        // Counter top ledge
        ctx.fillStyle = '#a67242';
        ctx.fillRect(px, py, w, 8);
        ctx.fillRect(px + w - 10, py, 10, h);

        // Reception multi-line telephone with blinking light
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(px + 8, py + 14, 10, 8);
        ctx.fillStyle = now % 1000 > 500 ? '#ef4444' : '#7f1d1d';
        ctx.fillRect(px + 9, py + 15, 2, 2);

        // Reception Service Bell
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(px + w - 8, py + 16, 5, 4);

        // Candy bowl with colorful jellybeans!
        ctx.fillStyle = '#06b6d4';
        ctx.fillRect(px + 22, py + 14, 7, 6);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(px + 23, py + 15, 2, 2);
        ctx.fillStyle = '#eab308';
        ctx.fillRect(px + 26, py + 15, 2, 2);
        break;
      }

      case 'jello_stapler': {
        // Jim's lime jello stapler prank
        ctx.fillStyle = 'rgba(34, 197, 94, 0.85)';
        ctx.fillRect(px, py, 20, 18);
        ctx.strokeStyle = '#15803d';
        ctx.strokeRect(px, py, 20, 18);

        // Encased black stapler
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(px + 4, py + 6, 12, 6);
        ctx.fillStyle = '#64748b';
        ctx.fillRect(px + 4, py + 10, 4, 2);

        // Jello shimmer
        ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.fillRect(px + 2, py + 2, 4, 2);
        ctx.fillRect(px + 2, py + 4, 2, 4);
        break;
      }

      case 'dundie_trophy': {
        ctx.fillStyle = '#d97706';
        ctx.fillRect(px + 4, py + 4, 8, 14);
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(px + 6, py + 2, 4, 4);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(px + 2, py + 18, 12, 6);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(px + 4, py + 20, 8, 2);
        break;
      }

      case 'water_cooler': {
        // Water cooler with blue water bottle
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(px + 4, py + 12, 16, 20);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(px + 6, py + 16, 12, 8); // Tap recess
        // Red & Blue taps
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(px + 8, py + 18, 2, 4);
        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(px + 14, py + 18, 2, 4);

        // Inverted Blue Jug
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(px + 6, py + 2, 12, 12);
        ctx.fillStyle = '#bae6fd';
        ctx.fillRect(px + 8, py + 4, 4, 8); // Water shine
        break;
      }

      case 'vending_machine': {
        // Breakroom snack vending machine
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(px, py, w, h);
        // Glass display
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(px + 4, py + 4, w - 8, h - 22);

        // Candy bars & chip bags
        const colors = ['#ef4444', '#f59e0b', '#10b981', '#f97316', '#a855f7'];
        for (let row = 0; row < 3; row++) {
          const sy = py + 8 + row * 10;
          ctx.fillStyle = '#334155';
          ctx.fillRect(px + 6, sy + 7, w - 12, 2);
          for (let item = 0; item < 4; item++) {
            ctx.fillStyle = colors[(row + item) % colors.length];
            ctx.fillRect(px + 8 + item * 8, sy, 5, 6);
          }
        }

        // Dispenser slot & glowing keypad
        ctx.fillStyle = '#334155';
        ctx.fillRect(px + 6, py + h - 16, w - 12, 10);
        ctx.fillStyle = '#000000';
        ctx.fillRect(px + 8, py + h - 14, w - 16, 6);
        ctx.fillStyle = '#10b981';
        ctx.fillRect(px + w - 12, py + h - 14, 2, 2); // Coin light
        break;
      }

      case 'sofa_leather': {
        // Brown leather couch
        ctx.fillStyle = '#4a2c11';
        ctx.fillRect(px, py, w, h);
        // Leather cushions
        ctx.fillStyle = '#6b401b';
        ctx.fillRect(px + 4, py + 6, w / 2 - 5, h - 8);
        ctx.fillRect(px + w / 2 + 1, py + 6, w / 2 - 5, h - 8);
        // Backrest
        ctx.fillStyle = '#3d240e';
        ctx.fillRect(px, py, w, 6);
        break;
      }

      case 'conference_table': {
        // Large mahogany conference table
        ctx.fillStyle = '#5c3a1e';
        ctx.fillRect(px, py, w, h);
        ctx.fillStyle = '#7a4e2a';
        ctx.fillRect(px + 3, py + 3, w - 6, h - 6);
        // Yellow legal notepads and pens
        for (let i = 0; i < 3; i++) {
          const nx = px + 16 + i * 36;
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(nx, py + 6, 10, 14);
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(nx + 12, py + 6, 2, 12);

          ctx.fillStyle = '#fef08a';
          ctx.fillRect(nx, py + h - 20, 10, 14);
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(nx + 12, py + h - 18, 2, 12);
        }
        break;
      }

      case 'chair_office': {
        // Swivel black office chair with wheels
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(px + w / 2, py + h / 2, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#334155';
        ctx.fillRect(px + w / 2 - 7, py + 2, 14, 5); // Backrest
        break;
      }

      case 'chair_conference': {
        // Blue conference chair
        ctx.fillStyle = '#1e3a8a';
        ctx.fillRect(px + 4, py + 4, w - 8, h - 8);
        ctx.fillStyle = '#172554';
        ctx.fillRect(px + 4, py + 2, w - 8, 4);
        break;
      }

      case 'whiteboard': {
        // Conference room whiteboard with colorful marker scribbles
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
        // Green pie chart
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(px + w - 18, py + 14, 7, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'potted_plant': {
        // Terracotta pot with bushy leaves
        ctx.fillStyle = '#c2410c';
        ctx.fillRect(px + 6, py + h - 12, w - 12, 12);
        // Green leaves
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

      case 'filing_cabinet': {
        // Grey metal 4-drawer filing cabinet
        ctx.fillStyle = '#64748b';
        ctx.fillRect(px, py, w, h);
        for (let i = 0; i < 3; i++) {
          const dy = py + 4 + i * 10;
          ctx.strokeStyle = '#334155';
          ctx.strokeRect(px + 2, dy, w - 4, 8);
          ctx.fillStyle = '#cbd5e1';
          ctx.fillRect(px + w / 2 - 3, dy + 3, 6, 2); // Handle
        }
        break;
      }

      case 'photocopier': {
        // Big office Xerox copier
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(px, py, w, h);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(px + 4, py + 4, w - 14, 12); // Glass scanner bed
        ctx.fillStyle = '#475569';
        ctx.fillRect(px + w - 10, py + 4, 6, 12); // Control panel
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(px + w - 8, py + 6, 2, 2); // Green copy button
        // Paper exit tray
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(px - 4, py + 14, 6, 10);
        break;
      }

      case 'trash_can': {
        if (prop.state?.ignited) {
          // Animated Fire!
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(px, py + 10, w, h - 10);
          // Flames flickering
          const flameOffset = Math.sin(now / 100) * 2;
          ctx.fillStyle = '#f97316';
          ctx.beginPath();
          ctx.arc(px + w / 2 + flameOffset, py + 4, 9, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.arc(px + w / 2 - flameOffset, py + 6, 6, 0, Math.PI * 2);
          ctx.fill();
          // Smoke puffs
          ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
          ctx.beginPath();
          ctx.arc(px + w / 2 - 2, py - 6 + flameOffset, 7, 0, Math.PI * 2);
          ctx.arc(px + w / 2 + 4, py - 12, 9, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = '#94a3b8';
          ctx.fillRect(px + 4, py + 6, w - 8, h - 6);
          ctx.fillStyle = '#64748b';
          ctx.fillRect(px + 2, py + 4, w - 4, 3);
        }
        break;
      }

      case 'coffee_bar': {
        // Kitchen counter & coffee maker with steam!
        ctx.fillStyle = '#5c3a1e';
        ctx.fillRect(px, py, w, h);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(px + 4, py + 4, 20, 14); // Coffee machine
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(px + 8, py + 8, 12, 8); // Glass carafe (dark coffee)
        // Steam puff
        const steam = Math.sin(now / 200) * 2;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillRect(px + 13 + steam, py - 3, 2, 4);

        // Mugs on counter
        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(px + 28, py + 8, 6, 6);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(px + 36, py + 8, 6, 6);
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
