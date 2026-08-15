import { SitcomScript, Scene, ScriptBeat } from '../types/script';

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
    parsed.settingId = 'dunder_mifflin_scranton';
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
