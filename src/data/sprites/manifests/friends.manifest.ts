import { SpriteAtlasManifest } from '../../../types/sprite';

const COL_W = 85;
const ROW_H = 170;

function makeCharAnimations(row: number) {
  const y = row * ROW_H;
  return {
    down: [
      { x: Math.round(0 * COL_W), y, w: COL_W, h: ROW_H, anchorX: 0.5, anchorY: 0.95 },
      { x: Math.round(6 * COL_W), y, w: COL_W, h: ROW_H, anchorX: 0.5, anchorY: 0.95 },
    ],
    up: [
      { x: Math.round(1 * COL_W), y, w: COL_W, h: ROW_H, anchorX: 0.5, anchorY: 0.95 },
      { x: Math.round(7 * COL_W), y, w: COL_W, h: ROW_H, anchorX: 0.5, anchorY: 0.95 },
    ],
    right: [
      { x: Math.round(3 * COL_W), y, w: COL_W, h: ROW_H, anchorX: 0.5, anchorY: 0.95 },
      { x: Math.round(4 * COL_W), y, w: COL_W, h: ROW_H, anchorX: 0.5, anchorY: 0.95 },
      { x: Math.round(5 * COL_W), y, w: COL_W, h: ROW_H, anchorX: 0.5, anchorY: 0.95 },
    ],
    left: [
      { x: Math.round(3 * COL_W), y, w: COL_W, h: ROW_H, anchorX: 0.5, anchorY: 0.95, flipX: true },
      { x: Math.round(4 * COL_W), y, w: COL_W, h: ROW_H, anchorX: 0.5, anchorY: 0.95, flipX: true },
      { x: Math.round(5 * COL_W), y, w: COL_W, h: ROW_H, anchorX: 0.5, anchorY: 0.95, flipX: true },
    ],
    sitting: {
      down: { x: Math.round(0 * COL_W), y, w: COL_W, h: ROW_H, anchorX: 0.5, anchorY: 0.95 },
      left: { x: Math.round(3 * COL_W), y, w: COL_W, h: ROW_H, anchorX: 0.5, anchorY: 0.95, flipX: true },
      right: { x: Math.round(3 * COL_W), y, w: COL_W, h: ROW_H, anchorX: 0.5, anchorY: 0.95 },
      up: { x: Math.round(1 * COL_W), y, w: COL_W, h: ROW_H, anchorX: 0.5, anchorY: 0.95 },
    },
  };
}

export const FRIENDS_MANIFEST: SpriteAtlasManifest = {
  showId: 'friends',
  images: {
    friends_characters: {
      url: '/sprites/friends_characters.jpg',
      chromaKey: '#00ff00',
      tolerance: 55,
    },
    friends_props: {
      url: '/sprites/friends_props.jpg',
      chromaKey: '#ff00ff',
      tolerance: 55,
    },
  },

  characters: {
    rachel: {
      characterId: 'rachel',
      imageKey: 'friends_characters',
      frameWidth: COL_W,
      frameHeight: ROW_H,
      scale: 0.28,
      enabled: true,
      animations: makeCharAnimations(0),
    },
    ross: {
      characterId: 'ross',
      imageKey: 'friends_characters',
      frameWidth: COL_W,
      frameHeight: ROW_H,
      scale: 0.29,
      enabled: true,
      animations: makeCharAnimations(1),
    },
    monica: {
      characterId: 'monica',
      imageKey: 'friends_characters',
      frameWidth: COL_W,
      frameHeight: ROW_H,
      scale: 0.28,
      enabled: true,
      animations: makeCharAnimations(2),
    },
    joey: {
      characterId: 'joey',
      imageKey: 'friends_characters',
      frameWidth: COL_W,
      frameHeight: ROW_H,
      scale: 0.285,
      enabled: true,
      animations: makeCharAnimations(3),
    },
    phoebe: {
      characterId: 'phoebe',
      imageKey: 'friends_characters',
      frameWidth: COL_W,
      frameHeight: ROW_H,
      scale: 0.28,
      enabled: true,
      animations: makeCharAnimations(4),
    },
    chandler: {
      characterId: 'chandler',
      imageKey: 'friends_characters',
      frameWidth: COL_W,
      frameHeight: ROW_H,
      scale: 0.285,
      enabled: true,
      animations: makeCharAnimations(5),
    },
  },

  props: {
    neon_sign: {
      propType: 'neon_sign',
      imageKey: 'friends_props',
      rect: { x: 650, y: 330, w: 310, h: 290, anchorX: 0.5, anchorY: 1.0 },
      enabled: true,
    },
  },

  tiles: {},

  portraits: {},
};
