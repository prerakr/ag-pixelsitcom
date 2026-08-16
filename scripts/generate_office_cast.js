import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// Creates a valid PNG buffer from an RGBA Uint8Array
function createPNG(width, height, rgbaBuffer) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // 8 bits per channel
  ihdrData.writeUInt8(6, 9); // RGBA color type
  ihdrData.writeUInt8(0, 10); // Compression
  ihdrData.writeUInt8(0, 11); // Filter
  ihdrData.writeUInt8(0, 12); // Interlace

  const ihdrChunk = createChunk('IHDR', ihdrData);

  // Scanlines with filter byte 0
  const scanlines = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    const rowOffset = y * (width * 4 + 1);
    scanlines[rowOffset] = 0; // Filter None
    const srcOffset = y * width * 4;
    for (let x = 0; x < width * 4; x++) {
      scanlines[rowOffset + 1 + x] = rgbaBuffer[srcOffset + x];
    }
  }

  const compressedData = zlib.deflateSync(scanlines, { level: 9 });
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(len + 12);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const crc = crc32(chunk.subarray(4, len + 8));
  chunk.writeUInt32BE(crc, len + 8);
  return chunk;
}

// CRC32 table & function
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// Color parsing helper
function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  return [
    parseInt(clean.substring(0, 2), 16),
    parseInt(clean.substring(2, 4), 16),
    parseInt(clean.substring(4, 6), 16),
  ];
}

// Pixel drawing canvas simulator
class PixelCanvas {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.buffer = new Uint8Array(width * height * 4);
    // Fill with Chroma Green (#00FF00)
    for (let i = 0; i < width * height; i++) {
      this.buffer[i * 4] = 0;
      this.buffer[i * 4 + 1] = 255;
      this.buffer[i * 4 + 2] = 0;
      this.buffer[i * 4 + 3] = 255;
    }
  }

  fillRect(x, y, w, h, hex) {
    const [r, g, b] = hexToRgb(hex);
    const startX = Math.max(0, Math.floor(x));
    const startY = Math.max(0, Math.floor(y));
    const endX = Math.min(this.width, Math.floor(x + w));
    const endY = Math.min(this.height, Math.floor(y + h));

    for (let py = startY; py < endY; py++) {
      for (let px = startX; px < endX; px++) {
        const idx = (py * this.width + px) * 4;
        this.buffer[idx] = r;
        this.buffer[idx + 1] = g;
        this.buffer[idx + 2] = b;
        this.buffer[idx + 3] = 255;
      }
    }
  }

  drawOutline(x, y, w, h, hex = '#111827') {
    this.fillRect(x - 1, y - 1, w + 2, 1, hex);
    this.fillRect(x - 1, y + h, w + 2, 1, hex);
    this.fillRect(x - 1, y, 1, h, hex);
    this.fillRect(x + w, y, 1, h, hex);
  }
}

// Renders one character sprite in a 128x256 cell
function drawCharacterCell(canvas, cellX, cellY, charDef, facing, animFrame) {
  const cx = cellX + 64;
  const cy = cellY + 160;
  const v = charDef;

  const isWalkA = animFrame === 0;
  const isSide = facing === 'left' || facing === 'right';
  const legOffset = isWalkA ? 4 : -4;
  const armOffset = isWalkA ? -3 : 3;

  const bodyW = v.bodyType === 'large' ? 36 : v.bodyType === 'petite' ? 24 : 30;
  const bodyH = 34;
  const headW = 28;
  const headH = 26;

  // 1. Legs & Shoes
  const pantsCol = v.pantsColor;
  const shoesCol = v.shoesColor;

  if (facing === 'down' || facing === 'up') {
    // Left Leg
    canvas.fillRect(cx - bodyW / 2 + 2, cy + bodyH / 2, 10, 24 + (isWalkA ? 2 : -2), pantsCol);
    canvas.fillRect(cx - bodyW / 2, cy + bodyH / 2 + 22 + (isWalkA ? 2 : -2), 14, 8, shoesCol);

    // Right Leg
    canvas.fillRect(cx + bodyW / 2 - 12, cy + bodyH / 2, 10, 24 + (isWalkA ? -2 : 2), pantsCol);
    canvas.fillRect(cx + bodyW / 2 - 14, cy + bodyH / 2 + 22 + (isWalkA ? -2 : 2), 14, 8, shoesCol);
  } else {
    // Side View Legs
    const dirMul = facing === 'left' ? -1 : 1;
    canvas.fillRect(cx - 7 + legOffset * dirMul, cy + bodyH / 2, 14, 24, pantsCol);
    canvas.fillRect(cx - 9 + legOffset * dirMul + (dirMul > 0 ? 4 : -4), cy + bodyH / 2 + 22, 18, 8, shoesCol);
  }

  // 2. Torso
  const torsoX = cx - bodyW / 2;
  const torsoY = cy - bodyH / 2;
  canvas.fillRect(torsoX, torsoY, bodyW, bodyH, v.shirtColor);
  canvas.drawOutline(torsoX, torsoY, bodyW, bodyH, '#111827');

  // Inner blouse / tie / cardigan details
  if (v.accessory === 'cardigan') {
    canvas.fillRect(cx - 5, torsoY + 4, 10, 14, '#f8fafc'); // White inner blouse
    canvas.fillRect(torsoX, torsoY + 4, 7, bodyH - 4, v.shirtColor);
    canvas.fillRect(torsoX + bodyW - 7, torsoY + 4, 7, bodyH - 4, v.shirtColor);
  }

  if (v.tieColor && (facing === 'down' || isSide)) {
    canvas.fillRect(cx - 3, torsoY + 4, 6, 20, v.tieColor);
    canvas.fillRect(cx - 2, torsoY + 24, 4, 4, v.tieColor);
  }

  // 3. Arms
  if (facing === 'down' || facing === 'up') {
    // Left arm
    canvas.fillRect(torsoX - 8, torsoY + 2 + armOffset, 8, 22, v.shirtColor);
    canvas.fillRect(torsoX - 8, torsoY + 24 + armOffset, 8, 8, v.skinColor);

    // Right arm
    canvas.fillRect(torsoX + bodyW, torsoY + 2 - armOffset, 8, 22, v.shirtColor);
    canvas.fillRect(torsoX + bodyW, torsoY + 24 - armOffset, 8, 8, v.skinColor);
  } else {
    // Side arm
    canvas.fillRect(cx - 5, torsoY + 4 + armOffset, 10, 20, v.shirtColor);
    canvas.fillRect(cx - 5, torsoY + 24 + armOffset, 10, 8, v.skinColor);
  }

  // 4. Head
  const headX = cx - headW / 2;
  const headY = torsoY - headH + 4;
  canvas.fillRect(headX, headY, headW, headH, v.skinColor);
  canvas.drawOutline(headX, headY, headW, headH, '#111827');

  // 5. Hair
  if (facing === 'up') {
    // Full back hair
    canvas.fillRect(headX - 2, headY - 4, headW + 4, headH + 4, v.hairColor);
    if (v.hairStyle === 'tight_bun') {
      canvas.fillRect(cx - 6, headY - 14, 12, 10, v.hairColor); // Angela's bun
      canvas.drawOutline(cx - 6, headY - 14, 12, 10, '#111827');
    }
  } else {
    // Front / Side Hair
    canvas.fillRect(headX - 2, headY - 4, headW + 4, 8, v.hairColor);

    if (v.hairStyle === 'tight_bun') {
      canvas.fillRect(cx - 5, headY - 12, 10, 8, v.hairColor);
      canvas.fillRect(headX - 2, headY, 4, 12, v.hairColor);
      canvas.fillRect(headX + headW - 2, headY, 4, 12, v.hairColor);
    } else if (v.hairStyle === 'balding') {
      // Kevin's balding head - hair only on sides
      canvas.fillRect(headX - 3, headY + 4, 5, 18, v.hairColor);
      canvas.fillRect(headX + headW - 2, headY + 4, 5, 18, v.hairColor);
      canvas.fillRect(headX + 4, headY - 2, headW - 8, 4, v.skinColor); // Balding scalp
    } else if (v.hairStyle === 'curls') {
      canvas.fillRect(headX - 4, headY, 6, 22, v.hairColor);
      canvas.fillRect(headX + headW - 2, headY, 6, 22, v.hairColor);
    } else if (v.hairStyle === 'slicked' || v.hairStyle === 'short') {
      canvas.fillRect(headX - 2, headY, 4, 14, v.hairColor);
      canvas.fillRect(headX + headW - 2, headY, 4, 14, v.hairColor);
    }

    // Eyes
    if (facing === 'down') {
      canvas.fillRect(cx - 8, headY + 12, 4, 4, '#111827');
      canvas.fillRect(cx + 4, headY + 12, 4, 4, '#111827');
      if (v.facialHair === 'mustache') {
        canvas.fillRect(cx - 8, headY + 18, 16, 5, '#111827'); // Stanley's mustache
      }
      if (v.facialHair === 'stubble') {
        canvas.fillRect(cx - 6, headY + 20, 12, 3, '#475569'); // Ryan's stubble
      }
    } else if (isSide) {
      const eyeX = facing === 'left' ? cx - 8 : cx + 4;
      canvas.fillRect(eyeX, headY + 12, 4, 4, '#111827');
      if (v.facialHair === 'mustache') {
        canvas.fillRect(facing === 'left' ? cx - 10 : cx + 2, headY + 18, 10, 5, '#111827');
      }
    }
  }
}

// 10 Extended Office Characters
const EXTENDED_CAST = [
  {
    id: 'angela',
    skinColor: '#fdf2e9',
    hairColor: '#fde047',
    hairStyle: 'tight_bun',
    shirtColor: '#94a3b8',
    pantsColor: '#475569',
    shoesColor: '#1e293b',
    bodyType: 'petite',
  },
  {
    id: 'kevin',
    skinColor: '#fed7aa',
    hairColor: '#3e2723',
    hairStyle: 'balding',
    shirtColor: '#334155',
    tieColor: '#0284c7',
    pantsColor: '#1e293b',
    shoesColor: '#0f172a',
    bodyType: 'large',
  },
  {
    id: 'stanley',
    skinColor: '#8d5b4c',
    hairColor: '#1c1917',
    hairStyle: 'short',
    shirtColor: '#78350f',
    tieColor: '#dc2626',
    pantsColor: '#451a03',
    shoesColor: '#1c1917',
    facialHair: 'mustache',
    bodyType: 'normal',
  },
  {
    id: 'toby',
    skinColor: '#f7cfb2',
    hairColor: '#785428',
    hairStyle: 'short',
    shirtColor: '#a8a29e',
    tieColor: '#713f12',
    pantsColor: '#57534e',
    shoesColor: '#292524',
    bodyType: 'normal',
  },
  {
    id: 'phyllis',
    skinColor: '#f7cfb2',
    hairColor: '#785428',
    hairStyle: 'curls',
    shirtColor: '#9333ea',
    pantsColor: '#475569',
    shoesColor: '#1e293b',
    accessory: 'cardigan',
    bodyType: 'large',
  },
  {
    id: 'ryan',
    skinColor: '#fce7d2',
    hairColor: '#1e293b',
    hairStyle: 'slicked',
    shirtColor: '#0f172a',
    tieColor: '#94a3b8',
    pantsColor: '#334155',
    shoesColor: '#020617',
    facialHair: 'stubble',
    bodyType: 'normal',
  },
  {
    id: 'kelly',
    skinColor: '#8d5b4c',
    hairColor: '#09090b',
    hairStyle: 'curls',
    shirtColor: '#ec4899',
    pantsColor: '#1e293b',
    shoesColor: '#f43f5e',
    bodyType: 'petite',
  },
  {
    id: 'oscar',
    skinColor: '#d4a373',
    hairColor: '#18181b',
    hairStyle: 'short',
    shirtColor: '#3b82f6',
    tieColor: '#1e3a8a',
    pantsColor: '#1e293b',
    shoesColor: '#0f172a',
    bodyType: 'normal',
  },
  {
    id: 'creed',
    skinColor: '#f5d0b5',
    hairColor: '#e2e8f0',
    hairStyle: 'short',
    shirtColor: '#64748b',
    tieColor: '#334155',
    pantsColor: '#1e293b',
    shoesColor: '#0f172a',
    bodyType: 'normal',
  },
  {
    id: 'meredith',
    skinColor: '#fed7aa',
    hairColor: '#ef4444',
    hairStyle: 'curls',
    shirtColor: '#10b981',
    pantsColor: '#334155',
    shoesColor: '#1e293b',
    bodyType: 'normal',
  },
];

const CELL_W = 128;
const CELL_H = 256;
const SHEET_W = 8 * CELL_W; // 1024 px
const SHEET_H = EXTENDED_CAST.length * CELL_H; // 2560 px

const canvas = new PixelCanvas(SHEET_W, SHEET_H);

EXTENDED_CAST.forEach((charDef, rowIdx) => {
  const cellY = rowIdx * CELL_H;

  // Col 0: Front Stride A
  drawCharacterCell(canvas, 0 * CELL_W, cellY, charDef, 'down', 0);
  // Col 1: Back Stride A
  drawCharacterCell(canvas, 1 * CELL_W, cellY, charDef, 'up', 0);
  // Col 2: Left Stride A
  drawCharacterCell(canvas, 2 * CELL_W, cellY, charDef, 'left', 0);
  // Col 3: Right Stride A
  drawCharacterCell(canvas, 3 * CELL_W, cellY, charDef, 'right', 0);

  // Col 4: Front Stride B
  drawCharacterCell(canvas, 4 * CELL_W, cellY, charDef, 'down', 1);
  // Col 5: Back Stride B
  drawCharacterCell(canvas, 5 * CELL_W, cellY, charDef, 'up', 1);
  // Col 6: Left Stride B
  drawCharacterCell(canvas, 6 * CELL_W, cellY, charDef, 'left', 1);
  // Col 7: Right Stride B
  drawCharacterCell(canvas, 7 * CELL_W, cellY, charDef, 'right', 1);
});

const pngBuffer = createPNG(SHEET_W, SHEET_H, canvas.buffer);
const outPath = path.resolve('public/sprites/office_characters_extended.png');
fs.writeFileSync(outPath, pngBuffer);
console.log(`Successfully generated ${outPath} (${SHEET_W}x${SHEET_H} px, ${pngBuffer.length} bytes)`);
