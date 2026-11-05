import { SitcomScript, Scene, ScriptBeat } from '../types/script';
import { SettingDefinition } from '../types/environment';
import { DEFAULT_SETTING_ID, getMergedSettings } from '../data/settings';
import { ALL_CHARACTERS } from '../data/characters';

export interface ValidationResult {
  isValid: boolean;
  script?: SitcomScript;
  errors: string[];
}

export function parseAndValidateScript(rawInput: string | object): ValidationResult {
  const errors: string[] = [];

  let parsed: any;
  if (typeof rawInput === 'string') {
    let clean = rawInput.trim();
    // Remove markdown code blocks if present
    if (clean.startsWith('```json')) {
      clean = clean.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (clean.startsWith('```')) {
      clean = clean.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    try {
      parsed = JSON.parse(clean);
    } catch (e: any) {
      return {
        isValid: false,
        errors: [`JSON syntax error: ${e.message}`],
      };
    }
  } else {
    parsed = rawInput;
  }

  if (!parsed || typeof parsed !== 'object') {
    return { isValid: false, errors: ['Script must be a JSON object'] };
  }

  // Auto-fill version
  if (!parsed.version) {
    parsed.version = '1.0';
  }

  if (!parsed.title || typeof parsed.title !== 'string') {
    errors.push('Missing or invalid "title"');
  }

  if (!parsed.settingId || typeof parsed.settingId !== 'string') {
    parsed.settingId = DEFAULT_SETTING_ID;
  }

  if (!Array.isArray(parsed.scenes) || parsed.scenes.length === 0) {
    // If the LLM returned beats directly
    if (Array.isArray(parsed.beats)) {
      parsed.scenes = [
        {
          id: 'scene_1',
          name: 'Main Scene',
          beats: parsed.beats,
        },
      ];
    } else {
      errors.push('Script must contain a "scenes" array with at least one scene');
    }
  }

  const settings = getMergedSettings();
  const setting: SettingDefinition | undefined = settings[parsed.settingId];
  if (!setting) {
    errors.push(`Unknown settingId "${parsed.settingId}" (known: ${Object.keys(settings).join(', ')})`);
  }
  const cast: string[] = Array.isArray(parsed.characters) && parsed.characters.length > 0 ? parsed.characters : Object.keys(ALL_CHARACTERS);
  for (const id of cast) {
    if (!ALL_CHARACTERS[id]) errors.push(`Unknown character "${id}" in "characters"`);
  }

  // Validate beats inside scenes
  if (Array.isArray(parsed.scenes)) {
    parsed.scenes.forEach((scene: Scene, sIdx: number) => {
      if (!scene.id) scene.id = `scene_${sIdx + 1}`;
      if (!scene.name) scene.name = `Scene ${sIdx + 1}`;
      if (!Array.isArray(scene.beats)) {
        errors.push(`Scene #${sIdx + 1} (${scene.name}) missing "beats" array`);
      } else {
        scene.beats.forEach((beat: ScriptBeat, bIdx: number) => {
          if (!beat.type) {
            errors.push(`Scene ${scene.id} Beat #${bIdx + 1} is missing a "type"`);
          } else if (setting) {
            checkReferences(beat, `Scene ${scene.id} Beat #${bIdx + 1}`, setting, cast, errors);
          }
        });
      }
    });
  }

  return {
    isValid: errors.length === 0,
    script: errors.length === 0 ? (parsed as SitcomScript) : undefined,
    errors,
  };
}

/**
 * Every character and place a beat names must exist: a typo would otherwise play as a character
 * who never speaks or a walk that goes nowhere. Places are the setting's waypoints and props;
 * characters may also be walked to, thrown at or framed by the camera.
 */
function checkReferences(beat: ScriptBeat, where: string, setting: SettingDefinition, cast: string[], errors: string[]) {
  const isPlace = (id: string) => !!setting.waypoints[id] || setting.props.some((p) => p.id === id);
  const isCast = (id: string) => cast.includes(id);
  const who = (id: unknown, field: string) => {
    if (typeof id === 'string' && !isCast(id)) errors.push(`${where}: ${field} "${id}" is not in the episode's cast`);
  };
  const place = (id: unknown, field: string, alsoCast: boolean, extra: string[] = []) => {
    if (typeof id !== 'string' || extra.includes(id) || isPlace(id) || (alsoCast && isCast(id))) return;
    errors.push(`${where}: ${field} "${id}" is not a waypoint${alsoCast ? ', prop or cast member' : ' or prop'} in ${setting.name}`);
  };
  switch (beat.type) {
    case 'dialogue':
    case 'talking_head':
      who(beat.speaker, 'speaker');
      break;
    case 'movement':
      who(beat.character, 'character');
      place(beat.target, 'target', true);
      break;
    case 'interaction':
      who(beat.character, 'character');
      place(beat.targetProp, 'targetProp', true);
      break;
    case 'emote':
      who(beat.character, 'character');
      break;
    case 'camera_cue':
      place(beat.target, 'target', true, ['overview']);
      break;
    case 'group_action':
      (beat.actions || []).forEach((a, i) => checkReferences(a as ScriptBeat, `${where} action #${i + 1}`, setting, cast, errors));
      break;
  }
}
