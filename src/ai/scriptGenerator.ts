import { SitcomScript } from '../types/script';
import { SettingDefinition } from '../types/environment';
import { CharacterDefinition } from '../types/character';
import { buildSitcomPrompt } from './promptTemplates';
import { parseAndValidateScript } from './scriptValidator';

export interface GenerationOptions {
  apiKey?: string;
  provider?: 'gemini' | 'openai' | 'mock';
  model?: string;
  userIdea: string;
  setting: SettingDefinition;
  characters: CharacterDefinition[];
}

export const COMEDY_PRESET_IDEAS = [
  {
    title: 'Pretzel Day Mayhem',
    showId: 'the_office',
    idea: 'It is annual Pretzel Day. Stanley is waiting in line when Michael tries to cut the queue with thirty custom toppings. Stanley drops a legendary truth bomb.',
  },
  {
    title: 'Megadesk: The Final Frontier',
    showId: 'the_office',
    idea: 'Dwight combines three sales desks to form Megadesk. Jim retaliates by building a fortress of wrapping paper. Michael demands to be crowned King of Megadesk.',
  },
  {
    title: 'Unagi Level 5 Mastery',
    showId: 'friends',
    idea: 'Ross claims he has achieved Level 5 Unagi and challenges Joey and Chandler to a surprise ninja duel at Central Perk.',
  },
  {
    title: 'DEFCON 1 Couch Cleaning',
    showId: 'friends',
    idea: 'Monica discovers a microscopic espresso smudge on the orange velvet couch and initiates an emergency chemical sanitation protocol.',
  },
  {
    title: 'Anton’s Crypto Mutiny',
    showId: 'silicon_valley',
    idea: 'Gilfoyle configures Anton to mine cryptocurrency whenever Erlich mentions Aviato, triggering a power blackout across Palo Alto.',
  },
  {
    title: 'SeeFood Gold Chain Detector',
    showId: 'silicon_valley',
    idea: 'Jian-Yang updates the SeeFood app to detect whether Dinesh’s Italian gold chain is authentic or cheap brass.',
  },
  {
    title: 'The Scuba Diver Scheme',
    showId: 'himym',
    idea: 'Barney executes The Scuba Diver play from his Playbook in the red booth while Marshall prepares an emergency Slap Bet countdown.',
  },
  {
    title: 'The Red Cowboy Boots Encore',
    showId: 'himym',
    idea: 'Ted wears his controversial red cowboy boots to MacLaren’s, insisting they project architectural confidence and masculine vigor.',
  },
];

export async function generateSitcomEpisode(options: GenerationOptions): Promise<SitcomScript> {
  const { provider = 'mock', apiKey, userIdea, setting, characters } = options;
  const prompt = buildSitcomPrompt(setting, characters, userIdea);

  if (provider === 'gemini' && apiKey) {
    return generateWithGemini(apiKey, prompt);
  } else if (provider === 'openai' && apiKey) {
    return generateWithOpenAI(apiKey, prompt, options.model);
  } else {
    // Generate intelligent procedural mock episode based on user idea and setting
    return generateProceduralMock(userIdea, setting, characters);
  }
}

async function generateWithGemini(apiKey: string, prompt: string): Promise<SitcomScript> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.8,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gemini API error: ${response.statusText}`);
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const result = parseAndValidateScript(rawText);

  if (!result.isValid || !result.script) {
    throw new Error(`Invalid script received from Gemini: ${result.errors.join(', ')}`);
  }

  return result.script;
}

async function generateWithOpenAI(
  apiKey: string,
  prompt: string,
  model = 'gpt-4o-mini'
): Promise<SitcomScript> {
  const url = 'https://api.openai.com/v1/chat/completions';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: 'You are a TV sitcom game engine script generator.' },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  const rawText = data.choices?.[0]?.message?.content || '';
  const result = parseAndValidateScript(rawText);

  if (!result.isValid || !result.script) {
    throw new Error(`Invalid script received from OpenAI: ${result.errors.join(', ')}`);
  }

  return result.script;
}

function generateProceduralMock(
  idea: string,
  setting: SettingDefinition,
  characters: CharacterDefinition[]
): Promise<SitcomScript> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const charIds = characters.map((c) => c.id);
      const mainSpeaker = charIds[0] || 'michael';
      const rivalSpeaker = charIds[1] || 'dwight';
      const bystander = charIds[2] || 'jim';

      const waypointKeys = Object.keys(setting.waypoints);
      const targetWp = waypointKeys[Math.floor(waypointKeys.length / 2)] || waypointKeys[0] || 'bullpen_center';

      const script: SitcomScript = {
        version: '1.0',
        title: idea.length > 35 ? `${idea.slice(0, 32)}...` : idea || 'Impromptu Sitcom Chaos',
        showId: characters[0]?.showId || 'the_office',
        settingId: setting.id,
        synopsis: `An AI-directed comedic scenario based on: "${idea}"`,
        author: 'PixelSitcom AI Engine',
        characters: charIds.slice(0, 5),
        scenes: [
          {
            id: 'scene_1',
            name: 'The Escalation',
            beats: [
              {
                type: 'camera_cue',
                target: mainSpeaker,
                zoom: 1.4,
                style: 'smooth_pan',
              },
              {
                type: 'dialogue',
                speaker: mainSpeaker,
                text: `Attention everyone! I have an announcement regarding: ${idea.slice(0, 45)}!`,
                emotion: 'smug',
                sfx: 'theme_jingle',
                emote: 'lightbulb',
                durationMs: 4000,
              },
              {
                type: 'movement',
                character: rivalSpeaker,
                target: targetWp,
                speed: 1.3,
                facing: 'up',
              },
              {
                type: 'dialogue',
                speaker: rivalSpeaker,
                text: 'Wait! Under official regulations, this plan is completely and utterly catastrophic!',
                emotion: 'shock',
                sfx: 'tension_sting',
                emote: 'exclamation',
                durationMs: 4200,
              },
              {
                type: 'camera_cue',
                target: bystander,
                zoom: 1.8,
                style: 'jim_stare',
              },
              {
                type: 'dialogue',
                speaker: bystander,
                text: 'I honestly did not think this situation could get weirder. I was wrong.',
                emotion: 'smirk',
                sfx: 'laugh_track',
                durationMs: 3800,
              },
              {
                type: 'talking_head',
                speaker: mainSpeaker,
                monologueText: `People say I don't think things through. But when you have pure creative genius coursing through your veins, thinking is just a bottleneck.`,
                emotion: 'proud',
                cameraLook: true,
                sfx: 'laugh_track',
                durationMs: 5500,
              },
              {
                type: 'group_action',
                actions: [
                  { type: 'emote', character: rivalSpeaker, emote: 'rage', durationMs: 2000 },
                  { type: 'emote', character: bystander, emote: 'laugh', durationMs: 2000 },
                ],
              },
              {
                type: 'dialogue',
                speaker: mainSpeaker,
                text: 'Boom! Comedy history has been made! Meeting adjourned!',
                emotion: 'happy',
                sfx: 'rimshot',
                emote: 'dundie',
                durationMs: 3600,
              },
            ],
          },
        ],
      };

      resolve(script);
    }, 600);
  });
}
