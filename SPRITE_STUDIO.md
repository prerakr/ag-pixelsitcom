# SPRITE_STUDIO.md - Sprite Studio & Art Pipeline Guide

Welcome to the **Sprite Studio** documentation for `ag-pixelsitcom`. 

The Sprite Studio is a powerful developer and artist tool embedded directly within the visualizer (accessible via the `SpriteGalleryModal.tsx` component). It serves as the bridge between raw generated pixel art assets and the runtime rendering engine, offering interactive tools for inspecting, calibrating, and integrating sprites.

---

## 1. Core Purpose

The `ag-pixelsitcom` engine supports two primary visual rendering modes:
- **Procedural**: Native HTML5 Canvas drawing using geometric shapes (useful as a fallback).
- **Sprites**: Bitmap-based pixel art assets (the primary high-fidelity mode).

The **Sprite Studio** provides an interactive GUI to manage this hybrid rendering pipeline, allowing developers to tune sprite coordinates, test animations, and verify asset coverage across different shows and environments.

---

## 2. Key Features and Tabs

### 📊 Asset Coverage
Tracks the project's progress in replacing procedural art with final pixel art sprites.
- Displays a coverage percentage for each supported show (*The Office*, *Friends*, *Silicon Valley*, *HIMYM*).
- Breaks down completion metrics into **Characters**, **Props**, and **Tiles**.
- Uses status badges to clearly indicate if an entity has a registered sprite (`SPRITE`) or is relying on fallback code (`PROCEDURAL`).

### 🎯 Calibrator & Swapper
The most critical developer tool in the Sprite Studio. It allows real-time visual calibration of spritesheets without needing to guess pixel coordinates or refresh the browser.
- **Entity Selection**: Choose any character, prop, or tile to calibrate.
- **Source Selection**: Input or select the source image texture key.
- **Interactive Cropping & Sliders**: Click and drag directly on the texture sheet preview to define your crop box. You can enforce precision by using the **Grid Snap** tool (8px, 16px, 32px, 64px). Sliders are also available for manual tuning.
- **Auto-Fit Bounds**: Clicking `AUTO-FIT` will instantly shrink-wrap the current crop box to the nearest non-transparent pixels, saving you time when isolating sprites.
- **Live Chroma-Key Eyedropper**: Click the `KEY` tool and select any color on the texture sheet to instantly process it into a transparent alpha channel.
- **Mini Pixel-Editor**: Need to quickly erase a stray pixel or fix a color? Click `PIXEL EDIT` to use the Pencil or Eraser tools directly on the sprite sheet. These edits are strictly non-destructive and apply to an in-memory copy of the image.
- **Background Toggles**: Switch the canvas backgrounds between Dark, Light, and Checkerboard to easily spot edge bleeding or verify transparent pixels.
- **Alignment & Tuning**: Adjust Scale, X/Y Offsets, and Anchor points. A secondary preview canvas renders the entity in isolation with alignment gridlines to ensure it is centered and grounded correctly.
- **Live Override**: Click "Apply Live In-Game" to instantly update the running simulation via the `spriteManager` without modifying code.
- **TypeScript Generation**: Automatically generates the exact JSON/TypeScript manifest object needed for `SPRITE_ATLAS_MANIFEST`. You can simply copy this snippet and paste it into the codebase to save your calibration permanently.
- **Individual Toggle**: A button to selectively toggle a single asset between `SPRITE` and `PROCEDURAL` rendering to compare them side-by-side.
- **Global Drag & Drop Testing**: Drag any image file directly from your computer and drop it anywhere into the Sprite Gallery modal to immediately load it as a dynamic source texture without needing to restart the server.

### 🏃 Cast Preview
An isolated testing environment for character animations and anchor alignment.
- **Show Filters**: Quickly filter roster by show (*All (43)*, *The Office (14)*, *Friends (9)*, *Silicon Valley (10)*, *HIMYM (10)*).
- **Direction Controls**: Preview sprites across all 4 directions (Up, Down, Left, Right) with authentic stride flipping.
- **360° Auto-Rotate**: Automates periodic directional shifts (Down → Right → Up → Left) to test walking transitions and frame symmetry.
- **Ground & Center Guidelines**: Toggleable dashed crosshair overlay displaying character center-of-mass and the floor contact plane ($y=14$) to verify foot pinning and eliminate floating/sinking.
- **Idle vs. Walk Cycles**: Toggle animation states to verify frame pacing, stride lengths, and walk bobbing.

### 🪑 Props & 🧱 Tiles Galleries
Visual galleries displaying all currently integrated static assets.
- Renders each prop and tile using the exact crop coordinates from the manifest.
- Displays asset names and pixel dimensions.

### 🎥 Portraits
A gallery for the high-resolution mockumentary "Talking Head" confessional portraits used during interview cutaways.

### ✨ Prompts (GenAI Recipes)
A collection of pre-engineered prompt templates designed for generating compatible assets using AI image generators (like Gemini or Nano Banana).
- **Characters**: Prompts for an 8-column horizontal grid ensuring correct 4-direction RPG walk cycles.
- **Props**: Prompts enforcing strictly orthogonal 2D top-down perspectives (avoiding isometric tilting).
- **Tiles**: Prompts for seamlessly tileable 128x128 textures.
- **Portraits**: Prompts for high-res expressive character busts.
- **Technical Specs**: Enforces strict SNES-style 16-bit pixel art guidelines, clean black outlines, no anti-aliasing, and specific solid chroma-key background colors (Green `#00FF00` or Magenta `#FF00FF`) for transparent background processing.

---

## 3. Architecture & Integration

The Sprite Studio interacts with the core engine primarily through the **`SpriteManager`** (`src/engine/SpriteManager.ts`).

1. **Manifest Driven**: The tool reads the baseline configurations from `SPRITE_ATLAS_MANIFEST` (`src/data/sprites/SpriteAtlas.ts`).
2. **Live Overrides**: When tuning an asset in the Calibrator, it sets temporary override objects inside the `SpriteManager`.
3. **Render Loop Injection**: The `CharacterRenderer` and `TileRenderer` query the `SpriteManager` every frame. If an override exists for a specific entity, it uses the calibrated dimensions and offsets instead of the default manifest, allowing for instant visual feedback in the active sitcom scene.

---

## 4. Typical Artist Workflow

1. Use a template from the **✨ Prompts** tab to generate a spritesheet.
2. Add the raw image to the project and register its ImageKey.
3. Open the **Sprite Studio** -> **🎯 Calibrator**.
4. Select the target prop/character, and assign your new ImageKey.
5. Use the sliders to dial in the crop box and center the anchor point on the grid.
6. Click **Apply Live In-Game** to verify it looks correct in the scene.
7. Copy the generated TypeScript snippet and paste it into `SPRITE_ATLAS_MANIFEST` to finalize the asset.

---

## 5. Offline Art Pipeline (`scripts/sprites/`)

Raw AI-generated sheets are never loaded by the game. They live in `art/source/` and are turned
into clean, native-resolution atlases by Python scripts (`pip install -r scripts/sprites/requirements.txt`).

| Script | Input | Output |
|---|---|---|
| `process_characters.py` | `art/source/characters/*` + `regen/<id>.png`, config in `character_sheets.json` | `public/sprites/characters/characters_<show>.png`, `src/data/sprites/generated/characterAtlas.ts` |
| `generate_tiles.py` | palettes defined in the script, per set theme | `public/sprites/tiles/tiles_<theme>.png`, `src/data/sprites/generated/tileAtlas.ts` |
| `process_static.py` | `art/source/props/*.jpg` | `public/sprites/props/*.png` (transparent, same coordinates) |
| `build_review_page.py` | generated atlases + cast data | `art/review/sprite_review.html`: a standalone, self-contained model sheet (lineups per show, walk cycles in all four directions, frame strips). Open it straight from disk |
| `regen_characters.py` | current art as likeness reference | `art/source/characters/regen/<id>.png` via OpenRouter, spend capped and logged in `art/source/generation_ledger.jsonl` |

### Characters
- Figures are found by segmentation, not grid maths, so uneven AI layouts are fine.
- Each figure is labelled front / back / side from head symmetry and face colour; side facing is detected from where the face sits in the head. Every side view is mirrored to face **right**, and the game mirrors right for left, so the two directions can never disagree.
- Frames are downsampled once per character (area filter, shared palette) to ~54px tall, scaled by `visual.heightScale`, then pinned to one feet baseline and torso centre line.
- Atlas layout: one 64px row per character; columns = `down`, `up`, `right` blocks of `[idle, walk0..3]` in 48px cells. `characterAtlasAnimations()` in `atlasLayout.ts` turns a row into animation frames.
- Wrong labels are fixed with `overrides` in `character_sheets.json` (`d u sL sR x` per detected figure). Run with `--preview <dir>` and check the contact sheets after any change.
- The walk cycle advances by distance travelled (`src/engine/Locomotion.ts`), about 12px per frame.
- Builds: regenerated sheets tend to share one body shape, so the build step widens bodies (below the neck) to each character's build in their original art, relative to the rest of that sheet. `bodyType: 'large'` characters are regenerated against heavy mannequins (`make_heavy_layout.py` -> `layout_reference_silhouettes_heavy.png`) and never narrowed. Tune with `buildBase` / `buildScale` in `character_sheets.json`.
- Generated sheets are validated (one row, 8 figures, profiles in columns 3-6). When the model repeats the figures in a second row, the top row is salvaged instead of paying for a retry.

### Tiles
- Floors are 128x128 seamless textures (4x4 tiles); the map baker picks the tile by grid position modulo 4.
- Wall faces, doors and windows are 4-variant strips. Wall tops ("caps"), doorways and contact shadows are drawn by `src/engine/TileMapBaker.ts` from each tile's neighbours: walls with floor to the south show their face, others are seen from above.
- Each set chooses a palette with `tileTheme` (`office`, `coffee`, `hostel`, `pub`).
