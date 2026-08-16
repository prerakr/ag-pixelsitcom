import { SpriteAtlasManifest } from '../../types/sprite';
import { OFFICE_MANIFEST } from './manifests/office.manifest';
import { FRIENDS_MANIFEST } from './manifests/friends.manifest';
import { SILICON_MANIFEST } from './manifests/silicon.manifest';
import { HIMYM_MANIFEST } from './manifests/himym.manifest';
import { COMMON_MANIFEST } from './manifests/common.manifest';

export const ALL_MANIFESTS: SpriteAtlasManifest[] = [
  OFFICE_MANIFEST,
  FRIENDS_MANIFEST,
  SILICON_MANIFEST,
  HIMYM_MANIFEST,
  COMMON_MANIFEST,
];

export function mergeManifests(manifests: SpriteAtlasManifest[]): SpriteAtlasManifest {
  const merged: SpriteAtlasManifest = {
    images: {},
    characters: {},
    props: {},
    tiles: {},
    portraits: {},
  };

  for (const m of manifests) {
    Object.assign(merged.images, m.images);
    Object.assign(merged.characters, m.characters);
    Object.assign(merged.props, m.props);
    Object.assign(merged.tiles, m.tiles);
    Object.assign(merged.portraits, m.portraits);
  }

  return merged;
}

export const SPRITE_ATLAS_MANIFEST: SpriteAtlasManifest = mergeManifests(ALL_MANIFESTS);

export {
  OFFICE_MANIFEST,
  FRIENDS_MANIFEST,
  SILICON_MANIFEST,
  HIMYM_MANIFEST,
  COMMON_MANIFEST,
};
