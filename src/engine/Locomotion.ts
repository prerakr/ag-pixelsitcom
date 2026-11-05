import { CharacterRuntimeState } from '../types/character';

/**
 * World pixels travelled per walk-cycle frame. Tying the cycle to distance rather than time
 * keeps feet planted: a character moving twice as fast steps twice as often.
 * Characters are ~54px tall, so a full 4-frame cycle (two steps) covers about 48px.
 */
const STRIDE_PX: Record<string, number> = {
  walking: 12,
  running: 16,
  sneaking: 8,
  tiptoeing: 8,
};
const DEFAULT_STRIDE_PX = 12;

/** How much the other axis must dominate before a walker turns (avoids diagonal flicker). */
const TURN_HYSTERESIS = 1.3;

/**
 * Advances the walk cycle by the distance moved this tick. `animTimer` holds the distance
 * accumulated since the last frame change, carrying the remainder over so cadence is exact.
 */
export function advanceWalkCycle(state: CharacterRuntimeState, distance: number): void {
  const stride = (state.state && STRIDE_PX[state.state]) || DEFAULT_STRIDE_PX;
  state.animTimer += distance;
  while (state.animTimer >= stride) {
    state.animTimer -= stride;
    state.animFrame = (state.animFrame + 1) % 4;
  }
}

/**
 * Points a walker along its dominant axis of travel. It only switches between horizontal and
 * vertical facing when the new axis clearly dominates, so paths near 45 degrees hold a facing.
 */
export function faceAlong(state: CharacterRuntimeState, dx: number, dy: number): void {
  const ax = Math.abs(dx);
  const ay = Math.abs(dy);
  const horizontal = state.facing === 'left' || state.facing === 'right';
  const useHorizontal = horizontal ? ax * TURN_HYSTERESIS >= ay : ax > ay * TURN_HYSTERESIS;
  if (useHorizontal) {
    if (ax > 0) state.facing = dx > 0 ? 'right' : 'left';
  } else if (ay > 0) {
    state.facing = dy > 0 ? 'down' : 'up';
  }
}
