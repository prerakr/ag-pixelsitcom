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

# Run the Vitest suite (headless: nav grid, script player, validator)
npm test
```

> **Note**: Always run `npm run build` and `npm test` to verify changes. The build runs both `tsc` (strict TypeScript validation) and the Vite production packager; the tests play every preset episode headless.

### Art Pipeline Commands
```bash
# One-time: Python deps for the sprite pipeline
pip install -r scripts/sprites/requirements.txt

# Rebuild character atlases from art/source/characters (+ regen/ sheets)
python scripts/sprites/process_characters.py --preview <dir>

# Rebuild themed tilesets (floors, wall faces, doors, windows)
python scripts/sprites/generate_tiles.py --preview <dir>

# Re-key prop sheets into transparent PNGs
python scripts/sprites/process_static.py

# Standalone sprite review page (walk cycles, lineups) -> art/review/sprite_review.html
python scripts/sprites/build_review_page.py

# Isometric sets: props (modelled at real size, all 4 facings), wall faces, floors, rugs -> public/sprites/iso
# One theme module per show in scripts/sprites/iso_themes/ (coffee, office, pub, hostel)
python scripts/sprites/iso_assets.py --preview <dir>

# Isometric character views: layout (mannequin ref) | generate --only id1,id2 (paid) | build
python scripts/sprites/iso_characters.py build --preview <dir>
```
Generated outputs (`public/sprites/**`, `src/data/sprites/generated/*`) are committed; never edit them by hand.

---

## 2. Project Architecture & Stack

- **Stack**: React 18, TypeScript 5.5, Vite 5.4, Tailwind CSS v4, Lucide React, Canvas-confetti.
- **Visuals**: HTML5 Canvas 2D pixel art. Characters, props and tiles come from sprite atlases built offline by the Python art pipeline in `scripts/sprites/` (see `SPRITE_STUDIO.md`); every asset also has a procedural fallback drawn in code (`CharacterRenderer`, `TileRenderer`).
- **Audio**: Web Audio API synthesizer (`src/engine/SoundEngine.ts`) generating multi-voice laugh tracks, stings, rimshots, and jingles procedurally with zero external audio assets.
- **Data Engine**: Episodic scripts defined via `SitcomScript v1.0` JSON structure.

### Module Layout
- `src/engine/`: Pure TypeScript simulation engine (`CanvasRenderer`, `ScriptPlayer`, `NavGrid`, `CharacterRenderer`, `TileRenderer`, `SoundEngine`, `LightingEngine`, `ParticleSystem`, `Camera`, `SpeechBubble`).
  - `ScriptPlayer` owns the timeline, all character/prop state and beat execution, with no DOM or audio imports; side effects (sound, particles, camera, lighting) go through its `StageEffects` interface. Seeking resets to the episode opening and silently replays earlier beats.
  - `NavGrid` is the half-tile walkability grid (walls block, doors open, solid props block their floor footprint) with A* routing; movement beats walk its routes.
  - `VisualizerEngine` (`CanvasRenderer.ts`) only presents: canvas, camera, game loop, drawing, and the `StageEffects` implementation.
  - `iso/` draws sets with `projection: 'iso'` (2:1 cut-away stage: `central_perk_iso`, `dunder_mifflin_iso`, `maclarens_iso`, `hacker_hostel_iso`, laid out with the helpers in `src/data/settings/isoLayout.ts`). The outer ring of tiles is the shell (north/west walls full height, south/east cut away); interior walls are depth-sorted pieces: glass (`wall_glass`, `door_glass`) stays full height and see-through, opaque walls are cut down, opaque doors are openings. The simulation stays in world coordinates; `Camera` works in view space through a `ViewProjection`, so camera targets are always given in world coordinates. Iso props come from `ISO_PROP_CATALOG` (real-size footprints that `NavGrid` blocks exactly); characters with iso art are registered as `<id>@iso`, others fall back to their top-down frames.
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
- Ensure all new beat types or options are updated in `src/types/script.ts`, `src/ai/scriptValidator.ts`, and `src/engine/ScriptPlayer.ts`. Anything a beat does beyond changing state (sound, particles, camera) goes through `StageEffects` so seeking can replay it silently.

### Canvas 2D Rendering
- **One art pixel = one world pixel**: Sprites are authored at native size (characters ~54px tall in 48x64 cells, 32px tiles) and drawn at scale 1. Never scale a sprite by a fractional factor; zoom is handled only by the engine's world buffer (`VisualizerEngine.render()`), which upscales by an integer and filters the fractional remainder.
- **No Smoothing**: Maintain pixel sharpness by setting `ctx.imageSmoothingEnabled = false` whenever canvas dimensions or contexts change.
- **Text on the overlay**: Name tags and speech bubbles are drawn in the high-resolution overlay pass, not into the pixel-art world buffer.
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
3. Run `npm test`: it fails if any waypoint or spawn point can't be reached on foot (a room with no door, a waypoint boxed in by furniture). New prop types that should not block walking go in `NON_BLOCKING` in `src/engine/NavGrid.ts`.

### 4. Adding a Sound Effect
1. Add sound name to `SfxType` in `src/types/script.ts`.
2. Implement synthesizer synthesis branch in `SoundEngine.playSfx()` (`src/engine/SoundEngine.ts`).

---

## 6. Verification Checklist Before Committing Changes

1. Run `npm run build` and ensure clean exit with zero type errors.
2. Run `npm test` (covers `parseAndValidateScript()` against all `PRESET_EPISODES`, waypoint reachability, and seek consistency).
3. Verify visual playback in viewport without stutter or coordinate displacement.
