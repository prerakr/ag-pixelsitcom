import { SpriteAtlasManifest } from '../../../types/sprite';
import { atlasCharacters, atlasImages } from '../characterDefs';

const CAST = ['richard', 'gilfoyle', 'dinesh', 'erlich', 'jared', 'jianyang', 'bighead', 'gavin', 'monica_hall', 'laurie'];

export const SILICON_MANIFEST: SpriteAtlasManifest = {
  showId: 'silicon_valley',
  images: {
    ...atlasImages(CAST),
  },
  characters: atlasCharacters(CAST),

  props: {},
  tiles: {},
  portraits: {},
};
