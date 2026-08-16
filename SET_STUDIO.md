# Soundstage Studio - In-App Environment & Set Editor Guide

Welcome to **Soundstage Studio** (Set Studio), the visual level editor and environment director built directly into **ag-pixelsitcom**.

Soundstage Studio enables creators, writers, and developers to visually design, furnish, partition, and test 2D retro pixel art sitcom environments in real time—without writing coordinate code by hand.

---

## 1. Overview & Core Capabilities

Soundstage Studio transforms the environment authoring pipeline from manual coordinate tinkering into an interactive, real-time visual sandbox:

- **Tile Floorplan Engine**: Paint, draw rectangular rooms, flood-fill carpet/wood/tile regions, or erase tiles across customizable grid dimensions (12x12 up to 64x64).
- **Prop & Furniture Staging**: Place over 50+ procedural sitcom props (desks, conference tables, executive couches, water coolers, servers, neon signs, plants, photocopiers), resize them interactively via corner handles, rotate facing directions, and adjust layer depth z-indexing.
- **1-Click Smart Prefabs**: Stamp pre-assembled, authentic furniture arrangements (e.g. *Sales Bullpen Quad*, *Executive Office Suite*, *Conference Room*, *Breakroom Nook*, *MacLaren's Pub Lounge*, *Server Rack Room*).
- **Waypoints & Character Spawns**: Place AI navigation targets, adjust character facing orientation angles, and configure initial character spawn positions for episode scenes.
- **Acoustic & Spatial Room Zones**: Define named, color-coded room zones (e.g., `Bullpen`, `Michael's Office`, `Breakroom`, `Kitchen`, `VIP Booth`) that configure camera bounds and acoustic traits.
- **Live Director Sandbox Mode**: Test and direct pixel characters directly on the stage—command them to walk to any coordinate, inspect walk cycles, and click actors to trigger funny quotes, emote badges, and sound effects.
- **Export & Storage**: Instant LocalStorage persistence, formatted TypeScript source code generator (for permanent inclusion in `src/data/settings/`), and portable JSON file export/import.

---

## 2. Interface Layout & Tool Palette

```
+---------------------------------------------------------------------------------------------------+
|  [SET STUDIO]  Set Selector | Dimensions (32x24) | Snap: [0.5x] | Zoom: [100%] | [Undo] [Redo] [Export]  |
+---------+-----------------------------------------------------------------------------+-----------+
| TOOLBAR |                                                                             | INSPECTOR |
| [V] Sel |                                                                             |           |
| [B] Brsh|                               CANVAS VIEWPORT                               | Selected: |
| [R] Rect|                                                                             | Desk Exec |
| [G] Fill|                     - High-DPI Crisply Scaled 2D Canvas                     |           |
| [E] Eras|                     - Space+Drag / Middle Click: Pan Camera                 | X: 14.5   |
| [P] Prop|                     - Mouse Wheel: Pinch / Smooth Zoom                      | Y: 8.0    |
| [W] Wayp|                     - Click & Drag: Paint / Move / Resize                   | W: 2.5    |
| [S] Spwn|                                                                             | H: 2.0    |
| [Z] Zone|                                                                             | Facing: v |
| [D] Dirc|                                                                             | Depth: +1 |
+---------+-----------------------------------------------------------------------------+-----------+
| ASSET   | [Floor & Wall Tiles] | [Furniture & Props] | [Waypoints & Spawns] | [Room Zones] | [Prefabs]   |
| DRAWER  |  Carpet Grey | Wood Plank | Office Wall | Whiteboard | Water Cooler | Couch | Coffee Machine  |
+---------+-----------------------------------------------------------------------------------------+
```

### Top Command Header
- **Set Selector**: Switch between preset sets (*Dunder Mifflin Scranton*, *Central Perk Coffee*, *Hacker Hostel*, *MacLaren's Pub*) or your custom creations.
- **New Set / Clone Set**: Start a blank soundstage or duplicate the active set.
- **Dimensions**: Edit width and height (e.g., `36 x 24` tiles, 32px per tile).
- **Grid Snapping**: Select snap precision (`1x Tile`, `0.5x Half-Tile`, `0.25x Quarter-Tile`, `Free / Pixel`).
- **Zoom Controls**: Quick zoom out (`-`), reset (`100%`), and zoom in (`+`).
- **Grid Overlay Toggle**: Toggle visual tile grid overlay.
- **Undo (`Ctrl+Z`) / Redo (`Ctrl+Y`)**: 50-step transaction history for risk-free editing.
- **Export / Code Generator**: Export set as JSON, load JSON files, or copy production-ready TypeScript code.

---

## 3. Tool Reference & Hotkeys

| Tool | Hotkey | Icon | Description |
| :--- | :---: | :---: | :--- |
| **Select / Move** | `V` | <kbd>Pointer</kbd> | Click props, waypoints, spawns, or zones to select. Drag to move, or drag corner handles to resize. |
| **Tile Brush** | `B` | <kbd>Brush</kbd> | Click and drag on the canvas to paint the selected floor or wall tile. |
| **Tile Rectangle** | `R` | <kbd>Square</kbd> | Click and drag to fill a rectangular area with the selected tile type. |
| **Flood Fill Bucket** | `G` | <kbd>PaintBucket</kbd> | Click to flood-fill contiguous matching tiles with the selected tile type. |
| **Tile Eraser** | `E` | <kbd>Eraser</kbd> | Paint default grey carpet over any tile to reset the floor. |
| **Prop Stamp** | `P` | <kbd>Armchair</kbd> | Click anywhere on the set to place the currently selected prop from the asset tray. |
| **Waypoint Placer** | `W` | <kbd>MapPin</kbd> | Click on the set to place a navigation node for AI movement beats. |
| **Spawn Placer** | `S` | <kbd>UserPlus</kbd> | Click on the set to create a character spawn point. |
| **Room Zone Drawer** | `Z` | <kbd>LayoutGrid</kbd> | Click and drag a bounding box to create an acoustic/camera room zone. |
| **Director Sandbox** | `D` | <kbd>Clapperboard</kbd> | Spawn a live test character on the stage. Click anywhere to command movement; click the actor to hear quotes and trigger emotes. |
| **Pan Canvas** | `Space + Drag` or `Middle Click` | <kbd>Hand</kbd> | Pan the soundstage camera freely across large sets. |
| **Undo / Redo** | `Ctrl + Z` / `Ctrl + Y` | <kbd>RotateCcw</kbd> | Step backward or forward through editing history. |

---

## 4. Asset Categories & Library

### 1. Tiles (`TileType`)
- **Flooring**: `floor_carpet_grey`, `floor_carpet_blue`, `floor_carpet_red`, `floor_wood_light`, `floor_wood_dark`, `floor_tile_kitchen`, `floor_tile_bathroom`, `floor_concrete`, `floor_grass`.
- **Walls & Boundaries**: `wall_office_grey`, `wall_office_beige`, `wall_brick_red`, `wall_wood_panel`, `wall_glass_partition`, `door_wooden`, `door_glass`, `window_day`, `window_blinds`.

### 2. Props & Furniture (`PropType`)
- **Desks & Workstations**: `desk_executive`, `desk_cubicle`, `desk_reception`, `desk_corner`, `table_conference`, `table_round`, `table_coffee`.
- **Seating**: `chair_office`, `chair_leather`, `chair_barstool`, `couch_leather`, `couch_fabric`, `armchair`.
- **Electronics & Appliances**: `monitor_pc`, `server_rack`, `photocopier`, `water_cooler`, `coffee_machine`, `vending_machine`, `microwave`, `refrigerator`, `jukebox`, `neon_sign`, `tv_wall`.
- **Office Accessories & Decor**: `filing_cabinet`, `bookshelf`, `whiteboard`, `bulletin_board`, `potted_plant`, `potted_fern`, `trash_can`, `water_fountain`, `rug`, `dundie_display`.

### 3. Built-In Prefab Bundles
1-click pre-composed architectural layouts with authentic prop positioning:
- **Sales Bullpen Quad**: 4 facing desks with monitors, keyboards, office chairs, and wastebaskets.
- **Executive Office Suite**: Corner executive desk, high-back leather chair, laptop, Dundie trophy, and guest armchairs.
- **Conference Room Suite**: Long conference table, 6 executive chairs, whiteboard, and presentation flipchart.
- **Breakroom Nook**: Kitchen tile flooring, water cooler, coffee machine, round cafe table, chairs, and refrigerator.
- **MacLaren's Pub Lounge**: Brick wall, mahogany bar counter, barstools, neon sign, and jukebox.
- **Server Room**: Server racks with blinking LED lights, computer terminal, and cooling fan vents.

---

## 5. Live Director Sandbox Mode

The **Director Sandbox** (`D` hotkey) provides a live simulation environment directly inside the editor:

1. **Pathfinding & Movement**: Click on any tile to command the test character to walk there in real time. The character uses delta-time interpolation, direction calculation, and walk-cycle animations.
2. **Actor Interaction**: Click directly on the test actor's avatar to make them deliver signature sitcom catchphrases with floating speech bubbles and laugh track reactions.
3. **Collision & Sightline Testing**: Validate that furniture spacing allows comfortable walking clearance before writing episode scripts.

---

## 6. Property Inspector

When any prop, waypoint, spawn point, or room zone is selected, the right-hand **Inspector Panel** displays real-time parameters:

- **Coordinates & Dimensions**: Exact grid `X`, `Y`, `Width`, and `Height` with manual numeric inputs and snap buttons.
- **Facing Orientation**: Rotate characters and props (`down`, `up`, `left`, `right`).
- **Interactive Flags**: Toggle whether characters can sit on, drink from, or use the object during scripts.
- **SFX Triggers**: Bind synthesized sound effects (`stapler_click`, `coffee_pour`, `typewriter`, `cheer`) triggered during interactions.
- **Layer Offset (`zIndexOffset`)**: Raise or lower prop rendering priority above/below adjacent objects.
- **Zone Customization**: Set zone names, assign custom hex colors, and define ambient lighting hints.
- **Action Shortcuts**: Quick **Duplicate / Clone**, **Center in Camera**, and **Delete**.

---

## 7. Storage, Import & Code Generation

### Automatic Local Storage
All modifications are automatically saved to `localStorage` under `ag_custom_settings`. Custom sets appear in the main application's environment selector dropdown alongside preset sets.

### JSON File Portability
- **Export JSON**: Download a `.json` backup of your set definition for version control or sharing.
- **Import JSON**: Upload any valid `SettingDefinition` JSON file to instantly load it into the soundstage.

### TypeScript Production Code Generator
Click **TypeScript Code** in the export dialog to generate a production-ready TypeScript constant:

```typescript
import { SettingDefinition } from '../../types/environment';

export const MY_NEW_OFFICE: SettingDefinition = {
  id: 'my_new_office',
  name: 'My New Office',
  showId: 'the_office',
  gridWidth: 32,
  gridHeight: 24,
  tileSize: 32,
  backgroundColor: '#111827',
  tiles: {
    '0,0': 'wall_office_grey',
    '1,1': 'floor_carpet_grey',
    // ...
  },
  props: [
    {
      id: 'desk_1',
      type: 'desk_executive',
      x: 10,
      y: 8,
      width: 2.5,
      height: 2.0,
      interactive: true,
      facing: 'down',
    }
  ],
  waypoints: {
    desk_main: { id: 'desk_main', name: 'Main Desk', x: 10, y: 8, facing: 'down' },
  },
  spawnPoints: {
    spawn_michael: { id: 'spawn_michael', name: 'Michael Spawn', x: 10, y: 10, facing: 'up' },
  },
  zones: [
    { name: 'Bullpen', x: 2, y: 2, w: 20, h: 18, color: '#38bdf8' }
  ],
};
```
Copy and paste this output directly into `src/data/settings/` to make it a permanent built-in show set.

---

## 8. Technical Architecture & Engineering Notes

### High-DPI Canvas Rendering
To ensure crisp pixel art across high-DPI (Retina / 4K / Windows 125%-150% scaling) displays without blurring or offset bugs:
- Canvas bitmap buffer is scaled by `dpr = window.devicePixelRatio || 1` (`canvas.width = rect.width * dpr`).
- The 2D rendering context normalizes coordinates via `ctx.scale(dpr, dpr)` and centers the camera at `(rect.width / 2, rect.height / 2)` before applying `zoom` and translation `-camera.x, -camera.y`.
- Pixel smoothing is strictly disabled: `ctx.imageSmoothingEnabled = false`.

### Decoupled 60fps Loop
The animation loop uses synchronized mutable references (`settingRef`, `cameraRef`, `zoomRef`, `hoverGridRef`, `activeToolRef`) rather than reactive state dependencies in the `requestAnimationFrame` effect. This guarantees smooth, uninterrupted 60fps rendering without frame drops during rapid mouse movements.

### Robust Coordinate Projection
Screen-to-world and world-to-screen coordinate math cleanly accounts for viewport bounds, zoom, and camera offset:
```typescript
const mouseLogicalX = screenX - rect.left;
const mouseLogicalY = screenY - rect.top;
const cx = rect.width / 2;
const cy = rect.height / 2;
const worldX = (mouseLogicalX - cx) / zoom + camera.x;
const worldY = (mouseLogicalY - cy) / zoom + camera.y;
```
