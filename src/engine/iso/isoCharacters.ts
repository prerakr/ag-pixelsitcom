import { CharacterDefinition } from '../../types/character';
import { Direction } from '../../types/script';
import { spriteManager } from '../SpriteManager';

/** The world facing whose iso sprite is the plain three-quarter front view (turned to the lower right). */
export const ISO_FRONT_FACING: Direction = 'right';

/**
 * The character drawn with its isometric sprite set (registered as `<id>@iso`), or null when it
 * has none and the top-down frames have to stand in.
 */
export function isoCharacter(def: CharacterDefinition): CharacterDefinition | null {
  const id = `${def.id}@iso`;
  return spriteManager.hasCharacter(id) ? { ...def, id } : null;
}

/** For a still portrait of a character: its iso sprite and front facing on an iso set, else its top-down front view. */
export function portraitView(def: CharacterDefinition, iso: boolean): { def: CharacterDefinition; facing: Direction } {
  const view = iso ? isoCharacter(def) : null;
  return view ? { def: view, facing: ISO_FRONT_FACING } : { def, facing: 'down' };
}
