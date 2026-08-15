import { SettingDefinition } from '../types/environment';
import { CharacterDefinition } from '../types/character';

export function buildSitcomPrompt(
  setting: SettingDefinition,
  characters: CharacterDefinition[],
  userIdea: string
): string {
  const waypointList = Object.entries(setting.waypoints)
    .map(([id, wp]) => `- "${id}": ${wp.name} (${wp.zone || 'area'})`)
    .join('\n');

  const propList = setting.props
    .map((p) => `- "${p.id}": ${p.name || p.type}`)
    .join('\n');

  const characterList = characters
    .map(
      (c) =>
        `- "${c.id}": ${c.name} (${c.role}) - Personality: ${c.personalityTraits.join(', ')}. Signature: "${c.signatureQuotes[0]}"`
    )
    .join('\n');

  return `You are an expert comedy sitcom TV writer and game director specializing in the mockumentary sitcom format (like The Office).

Your goal is to write a hilarious, dynamic 1-2 minute episodic scene in the strict "SitcomScript v1.0" JSON format.

### SETTING INFORMATION:
Show: ${setting.showTitle}
Location: ${setting.name} (settingId: "${setting.id}")

Available Waypoints to navigate characters:
${waypointList}

Available Interactive Props:
${propList}

Available Characters:
${characterList}

### USER SCENARIO / EPISODE PREMISE:
"${userIdea}"

---

### SITCOMSCRIPT v1.0 JSON SPECIFICATION:
Respond ONLY with a single valid, raw JSON object (no markdown wrapping, no extra conversational text).

Format:
{
  "version": "1.0",
  "title": "Episode Title",
  "showId": "${characters[0]?.showId || 'the_office'}",
  "settingId": "${setting.id}",
  "synopsis": "Short 1-2 sentence description of the comedic disaster.",
  "author": "AI Director",
  "characters": ["${characters.slice(0, 4).map(c => c.id).join('", "')}"],
  "scenes": [
    {
      "id": "scene_1",
      "name": "Scene Name",
      "beats": [
        // Array of sequential beats
      ]
    }
  ]
}

### SUPPORTED BEAT TYPES:
1. DIALOGUE:
   { "type": "dialogue", "speaker": "character_id", "text": "Speech line", "emotion": "smirk" | "happy" | "angry" | "shock" | "panic" | "deadpan" | "cringe" | "smug", "sfx": "laugh_track" | "tension_sting" | "rimshot" | "typewriter" | "slapstick_boing", "emote": "exclamation" | "question" | "sweat" | "rage" | "fire" | "dundie" | "jello" | "coffee", "durationMs": 3500 }

2. MOVEMENT:
   { "type": "movement", "character": "character_id", "target": "waypoint_id", "speed": 1.0 (normal) or 1.8 (running), "facing": "up" | "down" | "left" | "right" }

3. INTERACTION:
   { "type": "interaction", "character": "character_id", "targetProp": "prop_id", "action": "sit" | "type_pc" | "drink_coffee" | "ignite" | "inspect" | "kick" | "give_dundie", "sfx": "sfx_name", "durationMs": 1500 }

4. TALKING_HEAD (Mockumentary Solo Interview):
   { "type": "talking_head", "speaker": "character_id", "monologueText": "Inner monologue to camera...", "emotion": "deadpan", "cameraLook": true, "sfx": "laugh_track", "durationMs": 5000 }

5. CAMERA_CUE:
   { "type": "camera_cue", "target": "character_id" | "waypoint_id" | "overview", "zoom": 1.0 (wide) to 2.0 (dramatic zoom), "style": "smooth_pan" | "cut" | "jim_stare" }

6. AUDIO_CUE:
   { "type": "audio_cue", "sfx": "laugh_track" | "gasp" | "cheer" | "tension_sting" | "dramatic_boom" | "slapstick_boing" | "fire_alarm" | "glass_shatter", "volume": 0.8 }

7. EMOTE:
   { "type": "emote", "character": "character_id", "emote": "exclamation" | "question" | "sweat" | "rage" | "heart" | "laugh" | "skull" | "fire" | "dundie" | "jello", "durationMs": 1500 }

8. GROUP_ACTION (Parallel movements/emotes):
   { "type": "group_action", "actions": [ ...array of movements/emotes... ] }

### WRITING RULES:
- Keep the dialogue snappy, in-character, and comedic.
- Use talking_head beats for mockumentary interviews (e.g. Jim explaining why he did something, or Michael justifying a bizarre decision).
- Include appropriate sfx (like laugh_track after punchlines, tension_sting for dramatic reveals, fire_alarm or slapstick_boing for physical comedy).
- Ensure character movements use only valid waypoints from the list.
- Return ONLY the JSON object.`;
}
