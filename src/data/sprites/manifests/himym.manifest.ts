import { SpriteAtlasManifest } from '../../../types/sprite';
import { atlasCharacters, atlasImages } from '../characterDefs';

const CAST = ['ted', 'barney', 'marshall', 'lily', 'robin', 'carl', 'ranjit', 'wendy', 'patrice', 'the_captain'];

export const HIMYM_MANIFEST: SpriteAtlasManifest = {
  showId: 'himym',
  images: {
    ...atlasImages(CAST),
  },
  characters: atlasCharacters(CAST),

  props: {},
  tiles: {},
  portraits: {},
};
