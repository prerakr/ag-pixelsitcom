import { describe, expect, it } from 'vitest';
import { characterAtlasAnimations } from './atlasLayout';

describe('characterAtlasAnimations', () => {
  const anim = characterAtlasAnimations(3, { width: 48, height: 64, baseline: 60 });

  it('seats sideways-facing characters facing the camera, since the sheets have no seated side view', () => {
    expect(anim.sitting?.left).toEqual(anim.idle?.down);
    expect(anim.sitting?.right).toEqual(anim.idle?.down);
  });

  it('keeps the back view for characters sitting facing away', () => {
    expect(anim.sitting?.up).toEqual(anim.idle?.up);
  });
});
