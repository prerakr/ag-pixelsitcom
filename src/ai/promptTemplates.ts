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

  return `You are an expert comedy sitcom TV writer and game director specializing in episodic comedy and mockumentary sitcoms (like The Office, Friends, Silicon Valley, How I Met Your Mother).

Your goal is to write a hilarious, dynamic 1-3 scene episode script in the strict "SitcomScript v1.0" JSON format.

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
Respond ONLY with a single valid, raw JSON object (no markdown wrapping, no conversational explanation).

Format:
{
  "version": "1.0",
  "title": "Episode Title",
  "showId": "${characters[0]?.showId || 'the_office'}",
  "settingId": "${setting.id}",
  "synopsis": "Short 1-2 sentence description of the comedic disaster.",
  "author": "AI Director",
  "characters": [${characters.map((c) => `"${c.id}"`).join(', ')}],
  "scenes": [
    {
      "id": "scene_1",
      "name": "Scene Name",
      "timeOfDay": "day", // "day" | "golden_hour" | "night" | "emergency"
      "beats": [
        // Array of sequential beats
      ]
    }
  ]
}

### SUPPORTED BEAT TYPES & ALLOWED VALUES:

1. DIALOGUE:
   {
     "type": "dialogue",
     "speaker": "character_id",
     "text": "Dialogue line text here...",
     "emotion": "neutral" | "happy" | "smirk" | "deadpan" | "shock" | "panic" | "angry" | "cry" | "smug" | "cringe" | "confused" | "proud",
     "sfx": "typewriter" | "laugh_track" | "laugh_giggle" | "laugh_roar" | "gasp" | "cheer" | "tension_sting" | "dramatic_boom" | "slapstick_boing" | "rimshot" | "phone_ring" | "fire_alarm" | "stapler_click" | "coffee_pour" | "parkour_leap" | "glass_shatter" | "theme_jingle",
     "emote": "exclamation" | "question" | "sweat" | "panic" | "rage" | "heart" | "laugh" | "skull" | "fire" | "money" | "dundie" | "coffee" | "lightbulb" | "jello" | "camera",
     "durationMs": 3800
   }

2. MOVEMENT:
   {
     "type": "movement",
     "character": "character_id",
     "target": "waypoint_id",
     "speed": 1.0 (normal walk) to 1.8 (running / panic),
     "facing": "up" | "down" | "left" | "right"
   }

3. INTERACTION:
   {
     "type": "interaction",
     "character": "character_id",
     "targetProp": "prop_id",
     "action": "sit" | "stand" | "pickup" | "place" | "throw_plane" | "spill_coffee" | "drink_coffee" | "eat_snack" | "eat_pretzel" | "type_pc" | "use_photocopier" | "ignite" | "extinguish" | "inspect" | "kick" | "slam_desk" | "give_dundie",
     "sfx": "stapler_click" | "coffee_pour" | "glass_shatter" | "laugh_track",
     "durationMs": 1500,
     "facing": "up" | "down" | "left" | "right"
   }

4. TALKING_HEAD (Mockumentary Solo Confessional):
   {
     "type": "talking_head",
     "speaker": "character_id",
     "monologueText": "Inner monologue directly to the documentary camera...",
     "emotion": "deadpan" | "smirk" | "smug" | "cringe" | "shock" | "happy",
     "cameraLook": true,
     "sfx": "laugh_track",
     "durationMs": 5500
   }

5. CAMERA_CUE:
   {
     "type": "camera_cue",
     "target": "character_id" | "waypoint_id" | "overview",
     "zoom": 1.0 (wide bullpen) to 2.0 (tight reaction zoom),
     "style": "smooth_pan" | "cut" | "jim_stare",
     "durationMs": 1200
   }

6. AUDIO_CUE:
   {
     "type": "audio_cue",
     "sfx": "laugh_track" | "laugh_roar" | "gasp" | "cheer" | "tension_sting" | "dramatic_boom" | "slapstick_boing" | "rimshot" | "fire_alarm" | "glass_shatter" | "theme_jingle",
     "volume": 0.8
   }

7. EMOTE:
   {
     "type": "emote",
     "character": "character_id",
     "emote": "exclamation" | "question" | "sweat" | "panic" | "rage" | "heart" | "laugh" | "skull" | "fire" | "money" | "dundie" | "coffee" | "lightbulb" | "jello" | "camera",
     "durationMs": 2000
   }

8. TIME_OF_DAY:
   {
     "type": "time_of_day",
     "time": "day" | "golden_hour" | "night" | "emergency",
     "durationMs": 1000
   }

9. WAIT:
   {
     "type": "wait",
     "durationMs": 1500
   }

10. GROUP_ACTION (Parallel movements, emotes, or interactions executed at once):
   {
     "type": "group_action",
     "actions": [
       { "type": "movement", "character": "character_1", "target": "waypoint_1", "speed": 1.4 },
       { "type": "emote", "character": "character_2", "emote": "panic" },
       { "type": "audio_cue", "sfx": "fire_alarm" }
     ]
   }

### WRITING RULES:
- Keep the dialogue snappy, in-character, and comedy-first.
- Use mockumentary talking_head confessional interviews between major comedic beats.
- Ensure characters move to valid waypoint IDs defined in the setting.
- Use sound effects (laugh_track, tension_sting, rimshot, gasp, glass_shatter) for comedic timing.
- Return ONLY the JSON object.`;
}
