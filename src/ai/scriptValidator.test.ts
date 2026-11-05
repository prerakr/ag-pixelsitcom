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

  it('rejects beats that name a place or character the setting does not have', () => {
    const ep = PRESET_EPISODES[0];
    const broken = {
      ...ep,
      scenes: [
        {
          id: 's',
          name: 's',
          beats: [
            { type: 'movement', character: ep.characters[0], target: 'nowhere_at_all' },
            { type: 'dialogue', speaker: 'not_a_character', text: 'Hi' },
            { type: 'group_action', actions: [{ type: 'interaction', character: ep.characters[0], action: 'kick', targetProp: 'prop_missing' }] },
          ],
        },
      ],
    };
    const result = parseAndValidateScript(JSON.stringify(broken));
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(3);
    expect(result.errors[0]).toMatch(/"nowhere_at_all" is not a waypoint/);
    expect(result.errors[1]).toMatch(/"not_a_character" is not in the episode's cast/);
    expect(result.errors[2]).toMatch(/action #1: targetProp "prop_missing"/);
  });

  it('rejects an unknown setting', () => {
    const result = parseAndValidateScript(JSON.stringify({ ...PRESET_EPISODES[0], settingId: 'the_moon' }));
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toMatch(/Unknown settingId "the_moon"/);
  });

  it('rejects malformed JSON with a syntax error', () => {
    const result = parseAndValidateScript('{ "title": ');
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toMatch(/JSON syntax error/);
  });
});
