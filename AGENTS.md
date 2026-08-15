# AGENTS.md - Pixel Art Sitcom Visualizer Developer & Agent Guide

Welcome to **ag-pixelsitcom**! This document provides a comprehensive architectural breakdown, file index, subsystem guide, data schemas, and workflow instructions for AI agents and human developers collaborating on this project.

---

## 1. Project Overview

**ag-pixelsitcom** is a 2D top-down retro pixel art sitcom visualizer and procedural storytelling engine built with **React**, **TypeScript**, **Vite**, **HTML5 2D Canvas**, and the **Web Audio API**.

The application executes scripted comedy episodes (from shows like *The Office*, *Friends*, *Silicon Valley*, *How I Met Your Mother*, and custom AI-generated scenarios) in a simulated pixel art environment.

### Core Capabilities
- **Declarative Script Engine (`SitcomScript v1.0`)**: Episodes are structured as JSON-based scenes and beats (dialogue, movements, interactions, mockumentary talking heads, camera cues, audio cues, emotes, time of day shifts, and group actions).
- **Pure Canvas Rendering (Zero External Image Sprites)**: Characters, office/pub/apartment environments, furniture, props, and animations are procedurally rendered in real-time via Canvas 2D primitives with crisp pixelated styling (`imageSmoothingEnabled = false`).
- **Synthesized Web Audio Engine (Zero External Audio Assets)**: Laugh tracks, rimshots, minor chord stings, typewriter chatter, fire alarms, retro phone rings, dramatic booms, and theme jingles are synthesized procedurally via oscillators, gain nodes, and noise buffers.
- **Dynamic Lighting & Particle Engine**: Multi-mode lighting (`day`, `golden_hour`, `night`, `emergency` alarm pulse) with point lights, accompanied by a 2D particle emitter (fire, smoke, papers, coffee splashes, hearts, sparkles, and confetti).
- **AI Script Studio**: Integrated generator supporting Google Gemini (`gemini-1.5-flash`), OpenAI (`gpt-4o-mini`), and an offline procedural fallback generator with strict schema validation.
- **Interactive Viewport & Controls**: Timeline scrubbing, speed adjustments (0.5x - 2.0x), camera follow locks, direct character/prop inspection, soundboard, CRT scanline overlay, and mobile touch gestures (pan/pinch-zoom).

---

## 2. Technology Stack & Commands

### Tech Stack
- **Framework**: React 18 (`react`, `react-dom`)
- **Language**: TypeScript 5.5 (strict type safety)
- **Bundler & Dev Server**: Vite 5.4
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`, `@tailwindcss/postcss`, `postcss`, `autoprefixer`)
- **Icons**: `lucide-react`
- **Effects**: `canvas-confetti`
- **Audio & Visuals**: HTML5 Canvas 2D Context, Web Audio API

### NPM Scripts & Commands
```bash
# Start local development server (default: http://localhost:5173)
npm run dev

# Typecheck and build for production
npm run build

# Preview production build locally
npm run preview
```

---

## 3. Directory Layout

```
ag-pixelsitcom/
├── dist/                     # Production build output
├── index.html                # HTML entry point (canvas font preloads)
├── package.json              # Dependencies & npm scripts
├── postcss.config.js         # PostCSS configuration
├── tailwind.config.js        # Tailwind CSS config
├── tsconfig.json             # TypeScript compiler configuration
├── vite.config.ts            # Vite build configuration
├── src/
│   ├── main.tsx              # React DOM mounting entry point
│   ├── App.tsx               # Root application state & layout orchestrator
│   ├── index.css             # Global Tailwind imports & custom pixel art styles
│   │
│   ├── ai/                   # AI script generation & prompt templates
│   │   ├── promptTemplates.ts   # Structured prompt templates for LLM script generation
│   │   ├── scriptGenerator.ts   # Gemini/OpenAI API callers & offline procedural generator
│   │   └── scriptValidator.ts   # Schema parser, repairer & validator for SitcomScript
│   │
│   ├── components/           # React UI components & control overlays
│   │   ├── Header.tsx           # Top navigation bar, show/setting selector, modals toggle
│   │   ├── Viewport.tsx         # Canvas container, touch/mouse pan/zoom, CRT & lighting controls
│   │   ├── PlaybackControls.tsx # Timeline scrubber, transport controls, speed, beat info
│   │   ├── ScriptStudio.tsx     # AI generator modal, JSON script editor, validation feedback
│   │   ├── CharacterRoster.tsx  # Cast drawer with character details, quotes, & focus buttons
│   │   ├── TalkingHeadModal.tsx # Mockumentary interview portrait overlay
│   │   └── HelpModal.tsx        # Keyboard shortcuts, manual & script specifications
│   │
│   ├── data/                 # Static presets, characters, settings & episodes
│   │   ├── characters/       # Character profiles categorized by show
│   │   │   ├── office_cast.ts   # The Office (Michael, Dwight, Jim, Pam, Angela, Kevin, etc.)
│   │   │   ├── friends_cast.ts  # Friends (Ross, Rachel, Chandler, Monica, Joey, Phoebe)
│   │   │   ├── silicon_cast.ts  # Silicon Valley (Richard, Erlich, Dinesh, Gilfoyle, Jared)
│   │   │   ├── himym_cast.ts    # HIMYM (Ted, Barney, Robin, Marshall, Lily)
│   │   │   ├── other_casts.ts   # Extra guest characters & utility casts
│   │   │   └── index.ts         # Aggregated character map & lookup helpers
│   │   │
│   │   ├── settings/         # 2D tilemaps, props, waypoints & room zones
│   │   │   ├── dunder_mifflin.ts  # Scranton office floorplan
│   │   │   ├── central_coffee.ts  # Central Perk coffee shop
│   │   │   ├── hacker_hostel.ts   # Erlich Bachman's Hacker Hostel
│   │   │   ├── maclarens_pub.ts   # MacLaren's Pub
│   │   │   └── index.ts           # Settings registry & default setting ID
│   │   │
│   │   └── episodes/         # Preset episode scripts (SitcomScript format)
│   │       ├── dundies_heist.ts       # Dundie awards heist episode
│   │       ├── fire_drill.ts          # Dwight's legendary fire drill
│   │       ├── stapler_jello.ts       # Classic stapler in jello prank
│   │       ├── parkour.ts             # Hardcore parkour in the bullpen
│   │       ├── friends_pivot.ts       # Couch moving "PIVOT!" scene
│   │       ├── himym_playbook.ts      # Barney's playbook schemes
│   │       ├── silicon_not_hotdog.ts  # SeeFood demo presentation
│   │       ├── ai_revolution.ts       # Scranton AI takeover
│   │       └── index.ts               # Episodes list & default episode selector
│   │
│   ├── engine/               # Pure TypeScript canvas & sound simulation engine
│   │   ├── Camera.ts            # Dynamic camera with lerp, target tracking & bounds clamping
│   │   ├── CanvasRenderer.ts    # Core VisualizerEngine game loop & script execution
│   │   ├── CharacterRenderer.ts # Procedural pixel art character renderer
│   │   ├── LightingEngine.ts    # Atmospheric ambient lighting & point lights
│   │   ├── MusicEngine.ts       # Procedural 8-bit multi-track background music synthesizers & scheduler
│   │   ├── ParticleSystem.ts    # 2D particle emitter (sparks, fire, smoke, coffee, papers)
│   │   ├── SoundEngine.ts       # Web Audio API synthesized procedural SFX & jingles
│   │   ├── SpeechBubble.ts      # Speech bubble layout, typewriter text & tail calculations
│   │   └── TileRenderer.ts      # Procedural floor tiles, walls, doors, windows, & props
│   │
│   └── types/                # Core TypeScript definitions
│       ├── character.ts         # Character definitions, visual profiles & runtime state
│       ├── environment.ts       # Setting definition, tilemaps, props, waypoints & room zones
│       └── script.ts            # SitcomScript v1.0 specification & beat types
```

---

## 4. SitcomScript v1.0 Specification

The simulation engine is entirely driven by `SitcomScript`. Every episode follows this standardized JSON structure:

### Root Interface
```typescript
export interface SitcomScript {
  version: '1.0';
  title: string;
  showId: string;           // e.g. 'the_office', 'friends', 'silicon_valley', 'himym'
  settingId: string;        // e.g. 'dunder_mifflin_scranton', 'central_coffee', 'hacker_hostel'
  synopsis: string;
  author?: string;
  characters: string[];     // Array of character IDs present in the script
  scenes: ScriptScene[];
}

export interface ScriptScene {
  id: string;
  name: string;
  synopsis?: string;
  timeOfDay?: 'day' | 'golden_hour' | 'night' | 'emergency';
  beats: ScriptBeat[];
}
```

### Beat Types Reference

| Beat Type | Description | Key Properties |
| :--- | :--- | :--- |
| `dialogue` | Character speaks text with typewriter bubble & optional emote/sfx | `speaker`, `text`, `emotion`, `sfx`, `emote`, `speed`, `durationMs`, `cameraFocus` |
| `movement` | Character walks/runs to a waypoint or grid coord | `character`, `target` (waypoint ID or `{x, y}`), `speed`, `facing`, `animationState` |
| `interaction`| Character interacts with a prop (sit, drink coffee, use PC, etc.) | `character`, `targetProp`, `action`, `sfx`, `durationMs`, `facing` |
| `talking_head`| Mockumentary interview portrait takeover | `speaker`, `monologueText`, `emotion`, `background`, `cameraLook`, `durationMs`, `sfx` |
| `camera_cue` | Directs the camera position and zoom | `target` (character, prop, waypoint, or `'overview'`), `zoom`, `style`, `durationMs` |
| `audio_cue`  | Plays an explicit synthesized sound effect | `sfx`, `volume` |
| `emote`      | Pops an emote badge above a character's head | `character`, `emote`, `durationMs`, `soundEffect` |
| `time_of_day`| Alters the environmental lighting mood | `time` (`day`, `golden_hour`, `night`, `emergency`), `durationMs` |
| `group_action`| Executes multiple beats simultaneously in parallel | `actions` (`Array<Movement \| Dialogue \| Interaction \| Emote \| AudioCue>`) |
| `wait`       | Pauses timeline for dramatic timing | `durationMs` |

### Enums & Valid Values

- **Emotions (`EmotionType`)**: `'neutral' | 'happy' | 'smirk' | 'deadpan' | 'shock' | 'panic' | 'angry' | 'cry' | 'smug' | 'cringe' | 'confused' | 'proud'`
- **Emote Icons (`EmoteIconType`)**: `'exclamation' | 'question' | 'sweat' | 'panic' | 'rage' | 'heart' | 'laugh' | 'skull' | 'fire' | 'money' | 'dundie' | 'coffee' | 'lightbulb' | 'jello' | 'camera'`
- **Sound Effects (`SfxType`)**: `'typewriter' | 'laugh_track' | 'laugh_giggle' | 'laugh_roar' | 'gasp' | 'cheer' | 'tension_sting' | 'dramatic_boom' | 'slapstick_boing' | 'rimshot' | 'phone_ring' | 'fire_alarm' | 'stapler_click' | 'coffee_pour' | 'parkour_leap' | 'glass_shatter' | 'theme_jingle'`
- **Interaction Actions**: `'sit' | 'stand' | 'pickup' | 'place' | 'throw_plane' | 'spill_coffee' | 'drink_coffee' | 'eat_snack' | 'eat_pretzel' | 'type_pc' | 'use_photocopier' | 'ignite' | 'extinguish' | 'inspect' | 'kick' | 'slam_desk' | 'give_dundie'`
- **Directions (`Direction`)**: `'up' | 'down' | 'left' | 'right'`

---

## 5. Engine Architecture & Subsystems

### 1. `VisualizerEngine` ([src/engine/CanvasRenderer.ts](file:///d:/dev/antigravity/ag-pixelsitcom/src/engine/CanvasRenderer.ts))
- Orchestrates the game loop via `requestAnimationFrame`.
- Updates character movement (interpolating towards waypoints using delta time).
- Manages beat lifecycle: triggers callbacks when beats begin/end, computes automatic duration based on character dialogue length, advances to next beat.
- Maintains z-index sorting: entities (characters, interactive props) are depth-sorted by `y` coordinate to handle occlusion correctly.

### 2. `CharacterRenderer` ([src/engine/CharacterRenderer.ts](file:///d:/dev/antigravity/ag-pixelsitcom/src/engine/CharacterRenderer.ts))
- Draws 16x24 to 20x30 procedural pixel sprites without external bitmap assets.
- Handles walk cycle animations (legs alternating offset, arm sway, bobbing head).
- Draws custom hairstyles, skin tones, suits, cardigans, ties, glasses, facial hair, sitting postures, and held items (`dundie_trophy`, `coffee_mug`, `jello_stapler`, `pizza_box`, `clipboard`, `fire_extinguisher`, `pretzel`, `paper_sheet`).
- Renders animated emote badges above heads.

### 3. `TileRenderer` ([src/engine/TileRenderer.ts](file:///d:/dev/antigravity/ag-pixelsitcom/src/engine/TileRenderer.ts))
- Renders the 2D grid world:
  - Floor tiles: Carpet tiles, wood planks, kitchen tiles.
  - Walls & Partitions: Brick, glass partitions with sheen lines, office drywall, doors, window blinds.
  - Props: Desks (with monitors, keyboards, papers), conference tables, couches, water coolers (with bubbly water), photocopiers, neon signs, jukeboxes, coffee machines, server racks with blinking LEDs, filing cabinets, and potted plants.

### 4. `SoundEngine` ([src/engine/SoundEngine.ts](file:///d:/dev/antigravity/ag-pixelsitcom/src/engine/SoundEngine.ts))
- Lazy initializes `AudioContext` on the first user click/interaction.
- Synthesizes realistic sitcom audio in pure Web Audio:
  - Laugh tracks: Polyphonic multi-voice resonant formant synthesis.
  - Applause/cheer: Bandpass-filtered shaped noise buffer.
  - Rimshot: Kick drum pitch drops + noise-burst cymbal envelope.
  - Tension sting: Sawtooth minor chord with exponential release.
  - Theme jingle: Arpeggiated jaunty 8-bit square-wave progression.

### 5. `LightingEngine` & `ParticleSystem`
- **Lighting** ([src/engine/LightingEngine.ts](file:///d:/dev/antigravity/ag-pixelsitcom/src/engine/LightingEngine.ts)): Overlays color tints and handles emergency red strobe sweeps via Canvas compositing (`multiply` / `source-over`).
- **Particles** ([src/engine/ParticleSystem.ts](file:///d:/dev/antigravity/ag-pixelsitcom/src/engine/ParticleSystem.ts)): Updates and renders physics-based 2D particles (gravity, velocity decay, alpha fade).

### 6. `Camera` ([src/engine/Camera.ts](file:///d:/dev/antigravity/ag-pixelsitcom/src/engine/Camera.ts))
- Smooth target interpolation with damping (`lerp`).
- Viewport bounds clamping preventing black borders when zoomed in.
- Automatic mobile viewport fitting (`fitToViewport`).

---

## 6. Development & Contribution Guidelines

### Adding a New Character
1. Open the appropriate file in `src/data/characters/` (or create a new cast file).
2. Define the character using `CharacterDefinition` ([src/types/character.ts](file:///d:/dev/antigravity/ag-pixelsitcom/src/types/character.ts)):
   ```typescript
   export const MY_CHARACTER: CharacterDefinition = {
     id: 'my_character_id',
     name: 'Full Name',
     role: 'Job Title',
     showId: 'the_office',
     visual: {
       skinColor: '#f5c6a5',
       hairColor: '#3a2010',
       hairStyle: 'short',
       shirtColor: '#2b5c8f',
       pantsColor: '#1a202c',
       shoesColor: '#111827',
       glasses: true,
     },
     signatureQuotes: ['Catchphrase 1', 'Catchphrase 2'],
     personalityTraits: ['Quirky', 'Diligent'],
     defaultWaypoint: 'bullpen_center',
     defaultFacing: 'down',
   };
   ```
3. Export and register it in `src/data/characters/index.ts`.

### Adding a New Setting / Room
1. Create a definition file in `src/data/settings/`.
2. Construct the `SettingDefinition` object specifying:
   - `gridWidth` & `gridHeight` (e.g. 36 x 24).
   - `tileSize` (standard: 32px).
   - `tiles`: Coordinate map of tile types `"x,y": "floor_carpet_grey"`.
   - `props`: Array of `PropInstance` with coordinates and interactive states.
   - `waypoints`: Target destinations for character movement beats (e.g. `desk_michael`, `water_cooler`).
   - `spawnPoints`: Initial character placement coordinates.
3. Register the setting in `src/data/settings/index.ts`.

### Adding a New Preset Episode
1. Create `src/data/episodes/my_episode.ts` complying with `SitcomScript`.
2. Ensure character IDs and waypoint IDs match the chosen `settingId`.
3. Add the episode to `PRESET_EPISODES` in `src/data/episodes/index.ts`.

---

## 7. Key Best Practices & Gotchas for AI Agents

1. **Pixel Art Rendering Constraints**:
   - Always ensure `ctx.imageSmoothingEnabled = false` when rendering pixel graphics on the canvas.
   - Coordinates in `CharacterRenderer` and `TileRenderer` should be integer-snapped (`Math.floor` or `Math.round`) to prevent sub-pixel blurring.
2. **Audio Context Autoplay Policy**:
   - Web browsers block audio playback until user interaction. All calls to `soundEngine` must safely check context state or rely on user-initiated events.
3. **Responsive Coordinate Transformations**:
   - Viewport click/touch handlers must convert client screen coordinates (`e.clientX`, `e.clientY`) into world coordinates using `camera.screenToWorld(screenX, screenY, viewportWidth, viewportHeight)`.
4. **Script Validation**:
   - When modifying or generating scripts, test them with `parseAndValidateScript(scriptJson)` from `src/ai/scriptValidator.ts` to ensure beat structure integrity.
5. **Strict Typing**:
   - Always run `npm run build` (`tsc && vite build`) to verify that all TypeScript types, beat unions, and props compile cleanly with zero errors.
