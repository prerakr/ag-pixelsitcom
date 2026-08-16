import { SettingDefinition, PropInstance, Waypoint, RoomZone, TileType } from '../../types/environment';

const STORAGE_KEY = 'ag_pixelsitcom_custom_sets_v1';

/**
 * Load all user-saved custom settings from localStorage
 */
export function loadCustomSettings(): Record<string, SettingDefinition> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed;
    }
  } catch (err) {
    console.error('Failed to parse custom settings from localStorage:', err);
  }
  return {};
}

/**
 * Save a custom setting to localStorage
 */
export function saveCustomSetting(setting: SettingDefinition): void {
  if (typeof window === 'undefined') return;
  try {
    const current = loadCustomSettings();
    current[setting.id] = setting;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch (err) {
    console.error('Failed to save custom setting to localStorage:', err);
  }
}

/**
 * Delete a custom setting by ID
 */
export function deleteCustomSetting(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const current = loadCustomSettings();
    if (current[id]) {
      delete current[id];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    }
  } catch (err) {
    console.error('Failed to delete custom setting from localStorage:', err);
  }
}

/**
 * Creates a fresh blank setting with outer boundary walls and neutral carpet
 */
export function createBlankSetting(
  name: string = 'New Custom Soundstage',
  showTitle: string = 'The Office',
  gridWidth: number = 32,
  gridHeight: number = 20,
  tileSize: number = 32
): SettingDefinition {
  const cleanId = 'custom_' + name.toLowerCase().replace(/[^a-z0-9]+/g, '_') + '_' + Date.now().toString(36);
  const tiles: Record<string, TileType> = {};

  for (let x = 0; x < gridWidth; x++) {
    for (let y = 0; y < gridHeight; y++) {
      if (x === 0 || x === gridWidth - 1 || y === 0 || y === gridHeight - 1) {
        tiles[`${x},${y}`] = 'wall_office_side';
      } else if (y === 1) {
        tiles[`${x},${y}`] = 'wall_office_top';
      } else {
        tiles[`${x},${y}`] = 'floor_carpet_grey';
      }
    }
  }

  const defaultProps: PropInstance[] = [
    {
      id: 'prop_main_desk',
      type: 'desk_wood',
      x: Math.floor(gridWidth / 2) - 1,
      y: Math.floor(gridHeight / 2) - 1,
      width: 2.0,
      height: 2.2,
      name: 'Main Executive Desk',
      interactive: true,
      facing: 'down',
    },
    {
      id: 'prop_water_cooler',
      type: 'water_cooler',
      x: gridWidth - 4,
      y: 2.5,
      width: 1.0,
      height: 1.7,
      name: 'Water Cooler',
      interactive: true,
    },
    {
      id: 'prop_plant',
      type: 'potted_plant',
      x: 2.2,
      y: 2.2,
      width: 1.0,
      height: 1.4,
      name: 'Potted Ficus',
    },
  ];

  const defaultWaypoints: Record<string, Waypoint> = {
    room_center: {
      id: 'room_center',
      name: 'Room Center',
      x: Math.floor(gridWidth / 2),
      y: Math.floor(gridHeight / 2) + 2,
      facing: 'down',
      zone: 'main_hall',
    },
    desk_spot: {
      id: 'desk_spot',
      name: 'Desk Workstation',
      x: Math.floor(gridWidth / 2),
      y: Math.floor(gridHeight / 2) - 1.5,
      facing: 'down',
      zone: 'main_hall',
    },
    water_cooler_spot: {
      id: 'water_cooler_spot',
      name: 'Water Cooler Corner',
      x: gridWidth - 4,
      y: 4.2,
      facing: 'up',
      zone: 'main_hall',
    },
  };

  const defaultSpawnPoints: Record<string, Waypoint> = {
    main_spawn: {
      id: 'main_spawn',
      name: 'Main Character Spawn',
      x: Math.floor(gridWidth / 2),
      y: Math.floor(gridHeight / 2) + 2,
      facing: 'down',
    },
  };

  const defaultZones: RoomZone[] = [
    {
      id: 'main_hall',
      name: 'Main Stage Area',
      x: 1,
      y: 1,
      w: gridWidth - 2,
      h: gridHeight - 2,
      color: '#38bdf8',
    },
  ];

  return {
    id: cleanId,
    name,
    showTitle,
    description: 'Custom user-designed soundstage environment',
    gridWidth,
    gridHeight,
    tileSize,
    backgroundColor: '#121824',
    defaultCamera: {
      x: (gridWidth * tileSize) / 2,
      y: (gridHeight * tileSize) / 2,
      zoom: 1.2,
    },
    zones: defaultZones,
    tiles,
    props: defaultProps,
    waypoints: defaultWaypoints,
    spawnPoints: defaultSpawnPoints,
  };
}

/**
 * Deep clones an existing setting with a new unique ID and name
 */
export function duplicateSetting(source: SettingDefinition, newName?: string): SettingDefinition {
  const name = newName || `${source.name} (Copy)`;
  const cleanId = 'custom_' + name.toLowerCase().replace(/[^a-z0-9]+/g, '_') + '_' + Date.now().toString(36);

  return {
    ...JSON.parse(JSON.stringify(source)),
    id: cleanId,
    name,
    description: `Cloned from ${source.name}`,
  };
}

/**
 * Formats a SettingDefinition into clean, production-ready TypeScript code
 */
export function exportSettingAsTypeScript(setting: SettingDefinition): string {
  const varName = setting.id.toUpperCase().replace(/[^A-Z0-9_]/g, '_');
  return `import { SettingDefinition } from '../../types/environment';

export const ${varName}: SettingDefinition = ${JSON.stringify(setting, null, 2)};
`;
}

/**
 * Serializes setting to JSON
 */
export function exportSettingAsJSON(setting: SettingDefinition): string {
  return JSON.stringify(setting, null, 2);
}

/**
 * Validates and imports a setting from raw JSON
 */
export function importSettingFromJSON(jsonStr: string): SettingDefinition | null {
  try {
    const parsed = JSON.parse(jsonStr);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      parsed.gridWidth &&
      parsed.gridHeight &&
      parsed.tiles &&
      Array.isArray(parsed.props)
    ) {
      if (!parsed.id) {
        parsed.id = 'custom_' + Date.now().toString(36);
      }
      if (!parsed.waypoints) parsed.waypoints = {};
      if (!parsed.spawnPoints) parsed.spawnPoints = {};
      if (!parsed.defaultCamera) {
        parsed.defaultCamera = {
          x: (parsed.gridWidth * (parsed.tileSize || 32)) / 2,
          y: (parsed.gridHeight * (parsed.tileSize || 32)) / 2,
          zoom: 1.2,
        };
      }
      return parsed as SettingDefinition;
    }
  } catch (e) {
    console.error('Invalid JSON provided for SettingDefinition import:', e);
  }
  return null;
}
