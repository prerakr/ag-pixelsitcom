import { SpriteAtlasManifest } from '../../../types/sprite';

const ROW_H = Math.round(2048 / 6); // ~341px
const COL_W = Math.round(2048 / 10); // ~205px

function makeHimymAnim(row: number) {
  const y = row * ROW_H;
  return {
    down: [
      { x: 0 * COL_W, y, w: COL_W, h: ROW_H, anchorX: 0.5, anchorY: 0.92 },
      { x: 5 * COL_W, y, w: COL_W, h: ROW_H, anchorX: 0.5, anchorY: 0.92 },
    ],
    up: [
      { x: 1 * COL_W, y, w: COL_W, h: ROW_H, anchorX: 0.5, anchorY: 0.92 },
      { x: 6 * COL_W, y, w: COL_W, h: ROW_H, anchorX: 0.5, anchorY: 0.92 },
    ],
    right: [
      { x: 2 * COL_W, y, w: COL_W, h: ROW_H, anchorX: 0.5, anchorY: 0.92 },
      { x: 3 * COL_W, y, w: COL_W, h: ROW_H, anchorX: 0.5, anchorY: 0.92 },
      { x: 4 * COL_W, y, w: COL_W, h: ROW_H, anchorX: 0.5, anchorY: 0.92 },
      { x: 7 * COL_W, y, w: COL_W, h: ROW_H, anchorX: 0.5, anchorY: 0.92 },
      { x: 8 * COL_W, y, w: COL_W, h: ROW_H, anchorX: 0.5, anchorY: 0.92 },
      { x: 9 * COL_W, y, w: COL_W, h: ROW_H, anchorX: 0.5, anchorY: 0.92 },
    ],
    left: [
      { x: 2 * COL_W, y, w: COL_W, h: ROW_H, anchorX: 0.5, anchorY: 0.92, flipX: true },
      { x: 3 * COL_W, y, w: COL_W, h: ROW_H, anchorX: 0.5, anchorY: 0.92, flipX: true },
      { x: 4 * COL_W, y, w: COL_W, h: ROW_H, anchorX: 0.5, anchorY: 0.92, flipX: true },
      { x: 7 * COL_W, y, w: COL_W, h: ROW_H, anchorX: 0.5, anchorY: 0.92, flipX: true },
      { x: 8 * COL_W, y, w: COL_W, h: ROW_H, anchorX: 0.5, anchorY: 0.92, flipX: true },
      { x: 9 * COL_W, y, w: COL_W, h: ROW_H, anchorX: 0.5, anchorY: 0.92, flipX: true },
    ],
    sitting: {
      down: { x: 0 * COL_W, y, w: COL_W, h: ROW_H, anchorX: 0.5, anchorY: 0.92 },
      left: { x: 2 * COL_W, y, w: COL_W, h: ROW_H, anchorX: 0.5, anchorY: 0.92, flipX: true },
      right: { x: 2 * COL_W, y, w: COL_W, h: ROW_H, anchorX: 0.5, anchorY: 0.92 },
      up: { x: 1 * COL_W, y, w: COL_W, h: ROW_H, anchorX: 0.5, anchorY: 0.92 },
    },
  };
}

export const HIMYM_MANIFEST: SpriteAtlasManifest = {
  showId: 'himym',
  images: {
    himym_characters: {
      url: '/sprites/himym_characters.png',
      chromaKey: '#00ff00',
      tolerance: 55,
    },
  },
  characters: {
    ted: {
      characterId: 'ted',
      imageKey: 'himym_characters',
      frameWidth: COL_W,
      frameHeight: ROW_H,
      scale: 0.175,
      enabled: true,
      animations: makeHimymAnim(0),
    },
    barney: {
      characterId: 'barney',
      imageKey: 'himym_characters',
      frameWidth: COL_W,
      frameHeight: ROW_H,
      scale: 0.178,
      enabled: true,
      animations: makeHimymAnim(1),
    },
    marshall: {
      characterId: 'marshall',
      imageKey: 'himym_characters',
      frameWidth: COL_W,
      frameHeight: ROW_H,
      scale: 0.19,
      enabled: true,
      animations: makeHimymAnim(2),
    },
    lily: {
      characterId: 'lily',
      imageKey: 'himym_characters',
      frameWidth: COL_W,
      frameHeight: ROW_H,
      scale: 0.165,
      enabled: true,
      animations: makeHimymAnim(3),
    },
    robin: {
      characterId: 'robin',
      imageKey: 'himym_characters',
      frameWidth: COL_W,
      frameHeight: ROW_H,
      scale: 0.175,
      enabled: true,
      animations: makeHimymAnim(4),
    },
    carl: {
      characterId: 'carl',
      imageKey: 'himym_characters',
      frameWidth: COL_W,
      frameHeight: ROW_H,
      scale: 0.18,
      enabled: true,
      animations: makeHimymAnim(5),
    },
  },
  props: {},
  tiles: {},
  portraits: {},
};
