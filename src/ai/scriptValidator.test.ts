import { describe, expect, it } from 'vitest';
import { PRESET_EPISODES } from '../data/episodes';
import { parseAndValidateScript } from './scriptValidator';

describe('parseAndValidateScript', () => {
  for (const episode of PRESET_EPISODES) {
    it(`accepts the preset episode "${episode.title}"`, () => {
      const result = parseAndValidateScript(JSON.stringify(episode));
      expect(result.errors).toEqual([]);
      expect(result.isValid).toBe(true);
    });
  }

  it('accepts JSON wrapped in a markdown fence', () => {
    const fenced = '```json\n' + JSON.stringify(PRESET_EPISODES[0]) + '\n```';
    expect(parseAndValidateScript(fenced).isValid).toBe(true);
  });

  it('rejects malformed JSON with a syntax error', () => {
    const result = parseAndValidateScript('{ "title": ');
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toMatch(/JSON syntax error/);
  });
});
