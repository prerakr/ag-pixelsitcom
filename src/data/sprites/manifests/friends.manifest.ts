import { SpriteAtlasManifest } from '../../../types/sprite';
import { atlasCharacters, atlasImages } from '../characterDefs';

const CAST = ['rachel', 'ross', 'monica', 'joey', 'phoebe', 'chandler', 'gunther', 'janice', 'mike'];

export const FRIENDS_MANIFEST: SpriteAtlasManifest = {
  showId: 'friends',
  images: {
    ...atlasImages(CAST),
    friends_props: {
      url: '/sprites/props/friends_props.png',
    },
  },

  characters: atlasCharacters(CAST),

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
