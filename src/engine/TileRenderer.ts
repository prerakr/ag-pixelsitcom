import { TileType, PropInstance, SettingDefinition } from '../types/environment';

export class TileRenderer {
  // Tile rendering
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
        // Scranton office carpet: speckled neutral grey
        ctx.fillStyle = '#8a949e';
        ctx.fillRect(x, y, size, size);
        // Subtle pixel texture
        ctx.fillStyle = '#7d8791';
        for (let i = 0; i < size; i += 4) {
          for (let j = 0; j < size; j += 4) {
            if ((i + j) % 8 === 0) {
              ctx.fillRect(x + i, y + j, 2, 2);
            }
          }
        }
        // Very subtle grid seam
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.strokeRect(x, y, size, size);
        break;
      }

      case 'floor_carpet_blue': {
        // Conference room carpet: richer navy/slate blue
        ctx.fillStyle = '#4a5d6e';
        ctx.fillRect(x, y, size, size);
        ctx.fillStyle = '#3e4f5e';
        for (let i = 2; i < size; i += 6) {
          for (let j = 2; j < size; j += 6) {
            ctx.fillRect(x + i, y + j, 2, 2);
          }
        }
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
        ctx.strokeRect(x, y, size, size);
        break;
      }

      case 'floor_tile_kitchen': {
        // Breakroom/kitchen checkered linoleum tiles
        const half = size / 2;
        const col1 = '#c8cfd6';
        const col2 = '#e4ebf0';
        ctx.fillStyle = col1;
        ctx.fillRect(x, y, half, half);
        ctx.fillRect(x + half, y + half, half, half);
        ctx.fillStyle = col2;
        ctx.fillRect(x + half, y, half, half);
        ctx.fillRect(x, y + half, half, half);
        ctx.strokeStyle = '#a6b0b9';
        ctx.strokeRect(x, y, size, size);
        break;
      }

      case 'floor_wood': {
        // Wooden floorboards
        ctx.fillStyle = '#9c6f44';
        ctx.fillRect(x, y, size, size);
        ctx.fillStyle = '#875d35';
        for (let i = 0; i < size; i += 8) {
          ctx.fillRect(x, y + i, size, 1);
        }
        break;
      }

      case 'wall_office_top': {
        // Beige drywall office wall with wooden baseboard
        ctx.fillStyle = '#d3cbbe';
        ctx.fillRect(x, y, size, size - 8);
        // Wall shadow/trim
        ctx.fillStyle = '#b8af9f';
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
        ctx.fillStyle = 'rgba(164, 212, 238, 0.4)';
        ctx.fillRect(x, y, size, size);
        // Metal frames
        ctx.fillStyle = '#4b5563';
        ctx.fillRect(x, y, size, 4);
        ctx.fillRect(x, y + size - 4, size, 4);
        ctx.fillRect(x, y, 3, size);
        ctx.fillRect(x + size - 3, y, 3, size);
        // Reflection sheen
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.beginPath();
        ctx.moveTo(x + 4, y + size - 8);
        ctx.lineTo(x + 12, y + size - 8);
        ctx.lineTo(x + size - 6, y + 6);
        ctx.lineTo(x + size - 14, y + 6);
        ctx.closePath();
        ctx.fill();
        break;
      }

      case 'window_blinds': {
        // Iconic office window with Venetian blinds (talking head backdrop!)
        ctx.fillStyle = '#87ceeb'; // Sky
        ctx.fillRect(x, y, size, size);
        ctx.fillStyle = '#e8edf0'; // Blinds slats
        for (let i = 2; i < size; i += 4) {
          ctx.fillRect(x + 2, y + i, size - 4, 2);
        }
        // Blinds cord & frame
        ctx.fillStyle = '#374151';
        ctx.strokeRect(x + 1, y + 1, size - 2, size - 2);
        break;
      }

      case 'door_wood': {
        ctx.fillStyle = '#7a4e28';
        ctx.fillRect(x, y, size, size);
        ctx.fillStyle = '#5c3818';
        ctx.strokeRect(x + 2, y + 2, size - 4, size - 4);
        // Brass doorknob
        ctx.fillStyle = '#d4af37';
        ctx.fillRect(x + size - 8, y + size / 2, 4, 4);
        break;
      }

      default: {
        ctx.fillStyle = '#8a949e';
        ctx.fillRect(x, y, size, size);
      }
    }

    ctx.restore();
  }

  // Draw Props with crisp pixel details
  public static drawProp(
    ctx: CanvasRenderingContext2D,
    prop: PropInstance,
    tileSize: number
  ) {
    const px = prop.x * tileSize;
    const py = prop.y * tileSize;
    const w = (prop.width || 1) * tileSize;
    const h = (prop.height || 1) * tileSize;

    ctx.save();

    switch (prop.type) {
      case 'desk_wood': {
        // Office desk with computer and papers
        ctx.fillStyle = '#a0754c';
        ctx.fillRect(px, py + 8, w, h - 8);
        // Desk surface highlight
        ctx.fillStyle = '#b8895c';
        ctx.fillRect(px + 2, py + 10, w - 4, 6);
        // Desk shadow
        ctx.fillStyle = '#6e4f30';
        ctx.fillRect(px, py + h - 4, w, 4);

        // Computer monitor
        ctx.fillStyle = '#2d3748';
        ctx.fillRect(px + w / 2 - 8, py + 2, 16, 12);
        ctx.fillStyle = '#63b3ed'; // Glowing screen
        ctx.fillRect(px + w / 2 - 6, py + 4, 12, 8);
        ctx.fillStyle = '#4a5568';
        ctx.fillRect(px + w / 2 - 3, py + 14, 6, 3); // Stand

        // Keyboard & mousepad
        ctx.fillStyle = '#1a202c';
        ctx.fillRect(px + w / 2 - 7, py + 18, 14, 5);

        // Papers / folders
        ctx.fillStyle = '#f7fafc';
        ctx.fillRect(px + 4, py + 14, 8, 10);
        ctx.fillStyle = '#ecc94b'; // Yellow post-it
        ctx.fillRect(px + w - 12, py + 14, 6, 6);
        break;
      }

      case 'desk_michael': {
        // Michael Scott's executive desk
        ctx.fillStyle = '#5c3a21'; // Mahogany
        ctx.fillRect(px, py + 6, w, h - 6);
        ctx.fillStyle = '#7a4e2d';
        ctx.fillRect(px + 2, py + 8, w - 4, 6);

        // Laptop / Monitor
        ctx.fillStyle = '#1a202c';
        ctx.fillRect(px + 10, py + 2, 18, 12);
        ctx.fillStyle = '#4299e1';
        ctx.fillRect(px + 12, py + 4, 14, 8);

        // "World's Best Boss" Mug (White mug with black text pixel)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(px + w - 16, py + 16, 7, 7);
        ctx.fillStyle = '#3182ce'; // Blue rim
        ctx.fillRect(px + w - 16, py + 16, 7, 1);
        ctx.fillStyle = '#e2e8f0'; // Mug handle
        ctx.fillRect(px + w - 9, py + 18, 2, 4);

        // Golden Dundie Award!
        ctx.fillStyle = '#d4af37'; // Gold figure
        ctx.fillRect(px + w - 26, py + 12, 4, 8);
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(px + w - 25, py + 10, 2, 2); // Head
        ctx.fillStyle = '#2d3748'; // Marble base
        ctx.fillRect(px + w - 28, py + 20, 8, 4);

        // Nameplate "Michael Scott - Regional Manager"
        ctx.fillStyle = '#ecc94b';
        ctx.fillRect(px + 6, py + h - 8, 20, 4);
        break;
      }

      case 'desk_reception': {
        // L-shaped Reception Desk (Pam's desk)
        ctx.fillStyle = '#9c6f44';
        ctx.fillRect(px, py, w, h);
        // Counter top ledge
        ctx.fillStyle = '#b88a5a';
        ctx.fillRect(px, py, w, 8);
        ctx.fillRect(px + w - 10, py, 10, h);

        // Reception phone (with flashing light)
        ctx.fillStyle = '#1a202c';
        ctx.fillRect(px + 8, py + 14, 10, 8);
        ctx.fillStyle = '#e53e3e'; // Ring light
        ctx.fillRect(px + 9, py + 15, 2, 2);

        // Reception bell
        ctx.fillStyle = '#d4af37';
        ctx.fillRect(px + w - 8, py + 16, 5, 4);

        // Pen holder & candy bowl
        ctx.fillStyle = '#319795';
        ctx.fillRect(px + 22, py + 14, 6, 6);
        break;
      }

      case 'jello_stapler': {
        // Jim's famous Stapler in Jello!
        // Green translucent jello block
        ctx.fillStyle = 'rgba(72, 187, 120, 0.85)';
        ctx.fillRect(px, py, 20, 18);
        ctx.strokeStyle = '#2f855a';
        ctx.strokeRect(px, py, 20, 18);

        // Black stapler encased inside
        ctx.fillStyle = '#1a202c';
        ctx.fillRect(px + 4, py + 6, 12, 6);
        ctx.fillStyle = '#718096'; // Metal hinge
        ctx.fillRect(px + 4, py + 10, 4, 2);

        // Jello wobble highlights
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillRect(px + 2, py + 2, 4, 2);
        ctx.fillRect(px + 2, py + 4, 2, 4);
        break;
      }

      case 'dundie_trophy': {
        // Golden Dundie trophy standalone
        ctx.fillStyle = '#d4af37';
        ctx.fillRect(px + 4, py + 4, 8, 14);
        ctx.fillStyle = '#ffe066';
        ctx.fillRect(px + 6, py + 2, 4, 4); // Head
        ctx.fillStyle = '#1a202c';
        ctx.fillRect(px + 2, py + 18, 12, 6); // Base
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(px + 4, py + 20, 8, 2); // Plaque
        break;
      }

      case 'water_cooler': {
        // Water cooler with blue water bottle on top
        // Stand
        ctx.fillStyle = '#cbd5e0';
        ctx.fillRect(px + 4, py + 12, 16, 20);
        ctx.fillStyle = '#a0aec0';
        ctx.fillRect(px + 6, py + 16, 12, 8); // Tap recess
        // Red & Blue taps
        ctx.fillStyle = '#e53e3e';
        ctx.fillRect(px + 8, py + 18, 2, 4);
        ctx.fillStyle = '#3182ce';
        ctx.fillRect(px + 14, py + 18, 2, 4);

        // Water bottle (blue translucent inverted dome)
        ctx.fillStyle = '#63b3ed';
        ctx.fillRect(px + 6, py + 2, 12, 12);
        ctx.fillStyle = '#90cdf4';
        ctx.fillRect(px + 8, py + 4, 4, 8); // Water bubble reflection
        break;
      }

      case 'vending_machine': {
        // Scranton breakroom vending machine
        ctx.fillStyle = '#2d3748';
        ctx.fillRect(px, py, w, h);
        // Glass window
        ctx.fillStyle = '#1a202c';
        ctx.fillRect(px + 4, py + 4, w - 8, h - 22);

        // Snack shelves & colorful snacks
        const colors = ['#e53e3e', '#ecc94b', '#48bb78', '#ed8936', '#9f7aea'];
        for (let row = 0; row < 3; row++) {
          const sy = py + 8 + row * 10;
          ctx.fillStyle = '#4a5568';
          ctx.fillRect(px + 6, sy + 7, w - 12, 2); // Shelf
          for (let item = 0; item < 4; item++) {
            ctx.fillStyle = colors[(row + item) % colors.length];
            ctx.fillRect(px + 8 + item * 8, sy, 5, 6);
          }
        }

        // Dispenser slot & coin slot
        ctx.fillStyle = '#4a5568';
        ctx.fillRect(px + 6, py + h - 16, w - 12, 10);
        ctx.fillStyle = '#111111';
        ctx.fillRect(px + 8, py + h - 14, w - 16, 6);
        break;
      }

      case 'sofa_leather': {
        // Brown leather couch (Reception)
        ctx.fillStyle = '#5a3d28';
        ctx.fillRect(px, py, w, h);
        // Cushions
        ctx.fillStyle = '#785237';
        ctx.fillRect(px + 4, py + 6, w / 2 - 5, h - 8);
        ctx.fillRect(px + w / 2 + 1, py + 6, w / 2 - 5, h - 8);
        // Backrest
        ctx.fillStyle = '#473020';
        ctx.fillRect(px, py, w, 6);
        break;
      }

      case 'conference_table': {
        // Large mahogany conference table
        ctx.fillStyle = '#6b4423';
        ctx.fillRect(px, py, w, h);
        ctx.fillStyle = '#85562e';
        ctx.fillRect(px + 3, py + 3, w - 6, h - 6);
        // Notepads and pens for each seat
        for (let i = 0; i < 3; i++) {
          const nx = px + 16 + i * 36;
          ctx.fillStyle = '#fff9db';
          ctx.fillRect(nx, py + 6, 10, 14); // Yellow legal pad
          ctx.fillStyle = '#1a202c';
          ctx.fillRect(nx + 12, py + 6, 2, 12); // Pen

          ctx.fillStyle = '#fff9db';
          ctx.fillRect(nx, py + h - 20, 10, 14);
          ctx.fillStyle = '#1a202c';
          ctx.fillRect(nx + 12, py + h - 18, 2, 12);
        }
        break;
      }

      case 'chair_office': {
        // Black swivel office chair
        ctx.fillStyle = '#1a202c';
        ctx.beginPath();
        ctx.arc(px + w / 2, py + h / 2, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#4a5568';
        ctx.fillRect(px + w / 2 - 6, py + 2, 12, 5); // Backrest
        break;
      }

      case 'chair_conference': {
        // Blue conference chair
        ctx.fillStyle = '#2b6cb0';
        ctx.fillRect(px + 4, py + 4, w - 8, h - 8);
        ctx.fillStyle = '#1a365d';
        ctx.fillRect(px + 4, py + 2, w - 8, 4);
        break;
      }

      case 'whiteboard': {
        // Conference room whiteboard
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(px, py, w, h);
        ctx.strokeStyle = '#a0aec0';
        ctx.strokeRect(px, py, w, h);
        // Colorful marker graphs / notes
        ctx.fillStyle = '#e53e3e';
        ctx.fillRect(px + 6, py + 6, 16, 2);
        ctx.fillStyle = '#3182ce';
        ctx.beginPath();
        ctx.moveTo(px + 6, py + h - 8);
        ctx.lineTo(px + 20, py + 14);
        ctx.lineTo(px + 36, py + 20);
        ctx.lineTo(px + 50, py + 8);
        ctx.strokeStyle = '#3182ce';
        ctx.lineWidth = 2;
        ctx.stroke();
        break;
      }

      case 'potted_plant': {
        // Potted ficus plant
        ctx.fillStyle = '#c05621'; // Terracotta pot
        ctx.fillRect(px + 6, py + h - 12, w - 12, 12);
        // Bushy green leaves
        ctx.fillStyle = '#2f855a';
        ctx.beginPath();
        ctx.arc(px + w / 2, py + 10, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#48bb78';
        ctx.beginPath();
        ctx.arc(px + w / 2 - 4, py + 8, 6, 0, Math.PI * 2);
        ctx.arc(px + w / 2 + 4, py + 6, 5, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'filing_cabinet': {
        // Grey metal filing cabinet
        ctx.fillStyle = '#718096';
        ctx.fillRect(px, py, w, h);
        for (let i = 0; i < 3; i++) {
          const dy = py + 4 + i * 10;
          ctx.strokeStyle = '#4a5568';
          ctx.strokeRect(px + 2, dy, w - 4, 8);
          // Handle
          ctx.fillStyle = '#cbd5e0';
          ctx.fillRect(px + w / 2 - 3, dy + 3, 6, 2);
        }
        break;
      }

      case 'photocopier': {
        // Big office copier
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(px, py, w, h);
        ctx.fillStyle = '#2d3748';
        ctx.fillRect(px + 4, py + 4, w - 14, 12); // Glass scanner bed
        ctx.fillStyle = '#4a5568';
        ctx.fillRect(px + w - 10, py + 4, 6, 12); // Control panel
        ctx.fillStyle = '#48bb78';
        ctx.fillRect(px + w - 8, py + 6, 2, 2); // Green copy button
        // Paper exit tray
        ctx.fillStyle = '#cbd5e0';
        ctx.fillRect(px - 4, py + 14, 6, 10);
        break;
      }

      case 'trash_can': {
        // Trash bin (or fire hazard if ignited!)
        if (prop.state?.ignited) {
          // Animated Fire!
          ctx.fillStyle = '#e53e3e';
          ctx.fillRect(px, py + 10, w, h - 10);
          // Flames
          ctx.fillStyle = '#f6ad55';
          ctx.beginPath();
          ctx.arc(px + w / 2, py + 4, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ecc94b';
          ctx.beginPath();
          ctx.arc(px + w / 2, py + 6, 5, 0, Math.PI * 2);
          ctx.fill();
          // Smoke puff
          ctx.fillStyle = 'rgba(160, 174, 192, 0.7)';
          ctx.beginPath();
          ctx.arc(px + w / 2 - 2, py - 4, 6, 0, Math.PI * 2);
          ctx.arc(px + w / 2 + 3, py - 8, 8, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = '#a0aec0';
          ctx.fillRect(px + 4, py + 6, w - 8, h - 6);
          ctx.fillStyle = '#718096';
          ctx.fillRect(px + 2, py + 4, w - 4, 3); // Rim
        }
        break;
      }

      case 'server_rack': {
        // Tech server rack (for Hacker Hostel)
        ctx.fillStyle = '#171923';
        ctx.fillRect(px, py, w, h);
        ctx.strokeStyle = '#2d3748';
        ctx.strokeRect(px, py, w, h);
        // Blinking LED status lights
        const now = Date.now();
        for (let i = 0; i < 4; i++) {
          const sy = py + 6 + i * 8;
          ctx.fillStyle = '#4a5568';
          ctx.fillRect(px + 4, sy, w - 8, 6);
          ctx.fillStyle = (now + i * 200) % 600 > 300 ? '#48bb78' : '#38a169';
          ctx.fillRect(px + 6, sy + 2, 2, 2);
          ctx.fillStyle = (now + i * 400) % 800 > 400 ? '#e53e3e' : '#3182ce';
          ctx.fillRect(px + 10, sy + 2, 2, 2);
        }
        break;
      }

      case 'coffee_bar': {
        // Coffee shop espresso counter
        ctx.fillStyle = '#744210';
        ctx.fillRect(px, py, w, h);
        ctx.fillStyle = '#cbd5e0';
        ctx.fillRect(px + 4, py + 4, 20, 14); // Espresso machine
        ctx.fillStyle = '#2b6cb0';
        ctx.fillRect(px + 28, py + 8, 6, 6); // Coffee mugs
        break;
      }

      default: {
        ctx.fillStyle = '#a0aec0';
        ctx.fillRect(px, py, w, h);
      }
    }

    ctx.restore();
  }
}
