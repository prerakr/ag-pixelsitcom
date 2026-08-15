import { CharacterDefinition } from '../../types/character';
import { OFFICE_CAST } from './office_cast';
import { FRIENDS_CAST } from './friends_cast';
import { SILICON_CAST } from './silicon_cast';
import { HIMYM_CAST } from './himym_cast';
import { OTHER_CAST } from './other_casts';

export const ALL_CHARACTERS: Record<string, CharacterDefinition> = {
  ...OFFICE_CAST,
  ...FRIENDS_CAST,
  ...SILICON_CAST,
  ...HIMYM_CAST,
  ...OTHER_CAST,
};

export function getCharactersForShow(showId: string): CharacterDefinition[] {
  return Object.values(ALL_CHARACTERS).filter((c) => c.showId === showId);
}

export function getCharacter(id: string): CharacterDefinition | undefined {
  return ALL_CHARACTERS[id];
}
