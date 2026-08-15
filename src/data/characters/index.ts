import { CharacterDefinition } from '../../types/character';
import { OFFICE_CAST } from './office_cast';
import { TECH_CAST, COFFEE_CAST } from './other_casts';

export const ALL_CHARACTERS: Record<string, CharacterDefinition> = {
  ...OFFICE_CAST,
  ...TECH_CAST,
  ...COFFEE_CAST,
};

export function getCharactersForShow(showId: string): CharacterDefinition[] {
  return Object.values(ALL_CHARACTERS).filter((c) => c.showId === showId);
}

export function getCharacter(id: string): CharacterDefinition | undefined {
  return ALL_CHARACTERS[id];
}
