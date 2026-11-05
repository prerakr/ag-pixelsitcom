import { SettingDefinition } from '../types/environment';
import { Direction } from '../types/script';
import { FOOT_OFFSET_PX } from './NavGrid';

/** Prop types people sit in or on. */
const SEAT_PROP = /chair|stool|sofa|couch|lounger|beanbag|booth_bench/;
/** How far (tiles) a sitter's feet may be outside a seat's footprint and still be in it. */
const SEAT_SLACK = 0.1;

/**
 * The seat at a world point (px), if any: a seat prop whose footprint holds the feet of someone
 * standing there. `facing` is the way its sitter faces, known on isometric sets where every prop
 * has a facing. Walking a character to a seat sits them down (see ScriptPlayer).
 */
export function seatAt(setting: SettingDefinition, x: number, y: number): { facing?: Direction } | null {
  const T = setting.tileSize;
  const iso = setting.projection === 'iso';
  const fx = x / T;
  const fy = (y + FOOT_OFFSET_PX) / T;
  for (const p of setting.props) {
    if (!SEAT_PROP.test(p.type)) continue;
    const inside =
      fx >= p.x - SEAT_SLACK && fx <= p.x + (p.width || 1) + SEAT_SLACK && fy >= p.y - SEAT_SLACK && fy <= p.y + (p.height || 1) + SEAT_SLACK;
    if (inside) return { facing: iso ? p.facing || 'down' : undefined };
  }
  return null;
}

/** The seat at a waypoint, if it is one; facing falls back to the waypoint's own. */
export function seatAtWaypoint(setting: SettingDefinition, waypointId: string): { facing?: Direction } | null {
  const wp = setting.waypoints[waypointId];
  if (!wp) return null;
  const seat = seatAt(setting, wp.x * setting.tileSize, wp.y * setting.tileSize);
  return seat && { facing: seat.facing || wp.facing };
}
