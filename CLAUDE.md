# CLAUDE.md - AI Development Guide for Pixel Art Sitcom Visualizer

This guide contains essential commands, architecture patterns, code styles, and modification workflows for working on the **ag-pixelsitcom** codebase.

---

## 1. Quick Reference & Commands

### Development Commands
```bash
# Start Vite development server
npm run dev

# Run TypeScript typecheck and compile Vite production bundle
npm run build

# Preview production build locally
npm run preview
```

> **Note**: Always run `npm run build` to verify changes, as it runs both `tsc` (strict TypeScript validation) and the Vite production packager.

---

## 2. Project Architecture & Stack

- **Stack**: React 18, TypeScript 5.5, Vite 5.4, Tailwind CSS v4, Lucide React, Canvas-confetti.
- **Visuals**: Pure HTML5 Canvas 2D (`imageSmoothingEnabled = false`) with zero external image files. All tiles, furniture, character sprites, hair styles, and emotes are procedurally drawn.
- **Audio**: Web Audio API synthesizer (`src/engine/SoundEngine.ts`) generating multi-voice laugh tracks, stings, rimshots, and jingles procedurally with zero external audio assets.
- **Data Engine**: Episodic scripts defined via `SitcomScript v1.0` JSON structure.

### Module Layout
- `src/engine/`: Pure TypeScript simulation engine (`CanvasRenderer`, `CharacterRenderer`, `TileRenderer`, `SoundEngine`, `LightingEngine`, `ParticleSystem`, `Camera`, `SpeechBubble`).
- `src/types/`: Core type definitions (`script.ts`, `character.ts`, `environment.ts`).
- `src/data/`: Static registries for characters (`characters/`), show settings (`settings/`), and episodes (`episodes/`).
- `src/ai/`: AI script generation via Gemini/OpenAI APIs, prompt templates, and schema validator.
- `src/components/`: React UI overlays (`Viewport`, `PlaybackControls`, `ScriptStudio`, `Header`, `CharacterRoster`, `TalkingHeadModal`, `HelpModal`).

---

## 3. SitcomScript v1.0 Quick Reference

Episodes are structured as `SitcomScript` objects with `ScriptScene` arrays containing `ScriptBeat` items:

### Beat Types & Payloads
```typescript
// 1. Dialogue
{ type: 'dialogue', speaker: 'michael', text: "That's what she said!", emotion: 'smug', sfx: 'rimshot', emote: 'dundie', durationMs: 3500 }

// 2. Movement
{ type: 'movement', character: 'dwight', target: 'desk_michael', speed: 1.2, facing: 'up', animationState: 'walk' }

// 3. Interaction
{ type: 'interaction', character: 'jim', targetProp: 'water_cooler', action: 'drink_coffee', sfx: 'coffee_pour', durationMs: 2500 }

// 4. Mockumentary Talking Head
{ type: 'talking_head', speaker: 'pam', monologueText: "I knew it was going to happen...", emotion: 'deadpan', cameraLook: true, durationMs: 4500 }

// 5. Camera Cue
{ type: 'camera_cue', target: 'jim', zoom: 2.0, style: 'jim_stare', durationMs: 2000 }

// 6. Audio Cue
{ type: 'audio_cue', sfx: 'laugh_track', volume: 0.8 }

// 7. Emote
{ type: 'emote', character: 'stanley', emote: 'panic', durationMs: 2000, soundEffect: 'gasp' }

// 8. Time of Day
{ type: 'time_of_day', time: 'emergency', durationMs: 5000 }

// 9. Group Action (Parallel execution)
{ type: 'group_action', actions: [{ type: 'emote', character: 'dwight', emote: 'rage' }, { type: 'dialogue', speaker: 'michael', text: "Calm down!" }] }

// 10. Wait
{ type: 'wait', durationMs: 1500 }
```

### Key Enums
- **Emotions**: `neutral`, `happy`, `smirk`, `deadpan`, `shock`, `panic`, `angry`, `cry`, `smug`, `cringe`, `confused`, `proud`
- **Emote Icons**: `exclamation`, `question`, `sweat`, `panic`, `rage`, `heart`, `laugh`, `skull`, `fire`, `money`, `dundie`, `coffee`, `lightbulb`, `jello`, `camera`
- **SFX Types**: `typewriter`, `laugh_track`, `laugh_giggle`, `laugh_roar`, `gasp`, `cheer`, `tension_sting`, `dramatic_boom`, `slapstick_boing`, `rimshot`, `phone_ring`, `fire_alarm`, `stapler_click`, `coffee_pour`, `parkour_leap`, `glass_shatter`, `theme_jingle`
- **Directions**: `up`, `down`, `left`, `right`
- **Time of Day**: `day`, `golden_hour`, `night`, `emergency`

---

## 4. Code Style & Development Conventions

### TypeScript & Typing
- Maintain strict typing throughout the project. Avoid using `any` when defining beats, settings, or character state.
- Ensure all new beat types or options are updated in `src/types/script.ts`, `src/ai/scriptValidator.ts`, and `src/engine/CanvasRenderer.ts`.

### Canvas 2D Rendering
- **No Smoothing**: Maintain pixel sharpness by setting `ctx.imageSmoothingEnabled = false` whenever canvas dimensions or contexts change.
- **Integer Coordinates**: Floor or round screen-space coordinates (`Math.floor(x)`) in `CharacterRenderer` and `TileRenderer` to avoid fuzzy sub-pixel anti-aliasing.
- **Zero Allocations in Render Loop**: Avoid allocating temporary arrays or objects inside `VisualizerEngine.render()` or `TileRenderer.render()` to prevent garbage collection frame drops.

### Web Audio Synthesis
- Always trigger audio initialization inside or after a user interaction (click/touch/keypress) to satisfy browser autoplay restrictions.
- Use exponential ramps (`exponentialRampToValueAtTime`) rather than abrupt stops when scheduling oscillator cutoff to avoid clicks/pops.

### Coordinate Systems
- **World Coordinates**: Expressed in pixels (`x`, `y`).
- **Grid Coordinates**: Expressed in tile cells (`col * tileSize`, `row * tileSize`), standard tile size is `32px`.
- **Screen to World Conversion**: Use `camera.screenToWorld(screenX, screenY, viewportWidth, viewportHeight)` for raycasting mouse/touch clicks to world space.

---

## 5. Extension Workflows

### 1. Adding a Character
1. Add profile in `src/data/characters/<show>_cast.ts` matching `CharacterDefinition`.
2. Ensure `defaultWaypoint` exists in target setting(s).
3. Export from `src/data/characters/index.ts`.

### 2. Adding an Episode
1. Create `src/data/episodes/<episode_name>.ts` with valid `SitcomScript`.
2. Register it in `PRESET_EPISODES` array in `src/data/episodes/index.ts`.

### 3. Adding a New Setting
1. Create `src/data/settings/<setting_name>.ts` with `gridWidth`, `gridHeight`, `tiles`, `props`, and `waypoints`.
2. Register in `ALL_SETTINGS` in `src/data/settings/index.ts`.

### 4. Adding a Sound Effect
1. Add sound name to `SfxType` in `src/types/script.ts`.
2. Implement synthesizer synthesis branch in `SoundEngine.playSfx()` (`src/engine/SoundEngine.ts`).

---

## 6. Verification Checklist Before Committing Changes

1. Run `npm run build` and ensure clean exit with zero type errors.
2. Verify visual playback in viewport without stutter or coordinate displacement.
3. If changing scripts or validation rules, check that `parseAndValidateScript()` passes against all `PRESET_EPISODES`.
