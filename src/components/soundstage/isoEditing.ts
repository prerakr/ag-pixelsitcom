import { PropInstance, PropType, SettingDefinition } from '../../types/environment';
import { Direction } from '../../types/script';
import { ISO_PROP_CATALOG, ISO_THEME_ATLAS } from '../../data/sprites/generated/isoAtlas';
import { isoProp } from '../../data/settings/isoLayout';

/**
 * Set Studio helpers for isometric sets. Their props are modelled at real size, so a prop's
 * footprint comes from the catalogue and only turns with its facing; it is never stretched.
 */

export function isIsoSet(setting: SettingDefinition): boolean {
  return setting.projection === 'iso';
}

/** Whether a prop is drawn from the isometric catalogue (fixed footprint, four facings). */
export function isIsoProp(setting: SettingDefinition, prop: { type: string }): boolean {
  return isIsoSet(setting) && !!ISO_PROP_CATALOG[prop.type];
}

/** Facings in clockwise order as seen on screen: lower left, upper left, upper right, lower right. */
const TURN_ORDER: Direction[] = ['down', 'left', 'up', 'right'];

export function turnFacing(facing: Direction | undefined, step: 1 | -1): Direction {
  const i = TURN_ORDER.indexOf(facing || 'down');
  return TURN_ORDER[(i + step + TURN_ORDER.length) % TURN_ORDER.length];
}

/** Snap to 1/16 tile, the grid iso props sit on (whole view pixels). */
function snap16(v: number): number {
  return Math.round(v * 16) / 16;
}

/** The changes that turn an iso prop to `facing` about its centre, its footprint following. */
export function faceIsoProp(prop: PropInstance, facing: Direction): Partial<PropInstance> {
  const turned = isoProp(prop.id, prop.type, 0, 0, facing);
  const cx = prop.x + (prop.width || 1) / 2;
  const cy = prop.y + (prop.height || 1) / 2;
  return {
    facing,
    width: turned.width,
    height: turned.height,
    x: snap16(cx - (turned.width || 1) / 2),
    y: snap16(cy - (turned.height || 1) / 2),
  };
}

/** A new iso prop centred on (x, y) tiles. */
export function stampIsoProp(type: PropType, x: number, y: number, facing: Direction): PropInstance {
  const shaped = isoProp('', type, 0, 0, facing);
  const id = `prop_${type}_${Date.now().toString(36)}`;
  return isoProp(id, type, snap16(x - (shaped.width || 1) / 2), snap16(y - (shaped.height || 1) / 2), facing, {
    name: type.replace(/_/g, ' '),
  });
}

/** Which theme atlases draw each iso prop (a prop can appear in several). */
export function isoPropThemes(): Map<string, string[]> {
  const out = new Map<string, string[]>();
  for (const [theme, atlas] of Object.entries(ISO_THEME_ATLAS)) {
    for (const key of Object.keys(atlas.frames)) {
      const type = key.split(':')[0];
      const list = out.get(type) ?? [];
      if (!list.includes(theme)) list.push(theme);
      out.set(type, list);
    }
  }
  return out;
}

/** Plan-view colours for iso props by kind. */
export const ISO_KIND_COLOURS: Record<string, { fill: string; edge: string }> = {
  floor: { fill: 'rgba(56, 189, 248, 0.22)', edge: '#38bdf8' },
  seat: { fill: 'rgba(167, 139, 250, 0.3)', edge: '#a78bfa' },
  stool: { fill: 'rgba(167, 139, 250, 0.3)', edge: '#a78bfa' },
  wall: { fill: 'rgba(250, 204, 21, 0.25)', edge: '#facc15' },
  overhead: { fill: 'rgba(148, 163, 184, 0.12)', edge: '#94a3b8' },
};

/**
 * Draws an iso prop in plan view on the editor grid: its real footprint, coloured by kind, an
 * arrow along the side it faces, and its type when there is room.
 */
export function drawIsoBlueprint(ctx: CanvasRenderingContext2D, prop: PropInstance, tileSize: number, zoom: number) {
  const kind = ISO_PROP_CATALOG[prop.type]?.kind ?? 'floor';
  const colours = ISO_KIND_COLOURS[kind] ?? ISO_KIND_COLOURS.floor;
  const x = prop.x * tileSize;
  const y = prop.y * tileSize;
  const w = (prop.width || 1) * tileSize;
  const h = (prop.height || 1) * tileSize;
  ctx.save();
  ctx.fillStyle = colours.fill;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = colours.edge;
  ctx.lineWidth = 1.5 / zoom;
  ctx.setLineDash(kind === 'overhead' ? [4 / zoom, 3 / zoom] : []);
  ctx.strokeRect(x, y, w, h);
  ctx.setLineDash([]);

  // Front edge and an arrow pointing out of it.
  const facing = prop.facing || 'down';
  const cx = x + w / 2;
  const cy = y + h / 2;
  const [fx, fy, ex0, ey0, ex1, ey1] =
    facing === 'down' ? [0, 1, x, y + h, x + w, y + h]
    : facing === 'up' ? [0, -1, x, y, x + w, y]
    : facing === 'right' ? [1, 0, x + w, y, x + w, y + h]
    : [-1, 0, x, y, x, y + h];
  ctx.strokeStyle = colours.edge;
  ctx.lineWidth = 3 / zoom;
  ctx.beginPath();
  ctx.moveTo(ex0, ey0);
  ctx.lineTo(ex1, ey1);
  ctx.stroke();
  const len = Math.min(w, h) * 0.35;
  const tipX = cx + fx * len;
  const tipY = cy + fy * len;
  const size = Math.max(3, Math.min(w, h) * 0.18);
  ctx.fillStyle = colours.edge;
  ctx.beginPath();
  ctx.moveTo(tipX + fx * size, tipY + fy * size);
  ctx.lineTo(tipX - fy * size, tipY + fx * size);
  ctx.lineTo(tipX + fy * size, tipY - fx * size);
  ctx.closePath();
  ctx.fill();

  const label = prop.type.replace(/_/g, ' ');
  const fontPx = 9 / zoom;
  ctx.font = `${fontPx}px monospace`;
  if (ctx.measureText(label).width < w - 4 / zoom && h > fontPx * 1.6) {
    ctx.fillStyle = '#e2e8f0';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(label, cx, y + 2 / zoom);
  }
  ctx.restore();
}
