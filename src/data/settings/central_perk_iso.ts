import { SettingDefinition, TileType } from '../../types/environment';
import { isoProp as prop } from './isoLayout';

/**
 * Central Perk as a 2:1 isometric stage (projection test). One tile is one metre: the room is
 * 12 x 9 m inside, the street windows run along the north wall behind the couch, the counter
 * runs down the west wall, and the south and east walls are cut away towards the camera.
 *
 * Waypoint and spawn ids match central_coffee so the Friends episodes play here unchanged.
 */

const GW = 14;
const GH = 11;

function buildTiles(): Record<string, TileType> {
  const tiles: Record<string, TileType> = {};
  for (let y = 0; y < GH; y++) {
    for (let x = 0; x < GW; x++) {
      const edge = x === 0 || y === 0 || x === GW - 1 || y === GH - 1;
      tiles[`${x},${y}`] = edge ? 'wall_brick' : 'floor_wood';
    }
  }
  for (let x = 2; x <= 8; x++) tiles[`${x},0`] = 'window_blinds';
  tiles['12,0'] = 'door_wood';
  tiles['0,8'] = 'door_wood'; // to the restrooms
  return tiles;
}

export const CENTRAL_PERK_ISO: SettingDefinition = {
  id: 'central_perk_iso',
  name: 'Central Perk (Isometric Test)',
  showTitle: 'Friends',
  description: 'Projection test: Central Perk rebuilt at true scale as a cut-away isometric stage.',
  gridWidth: GW,
  gridHeight: GH,
  tileSize: 32,
  backgroundColor: '#140c08',
  tileTheme: 'coffee',
  projection: 'iso',
  defaultCamera: { x: 6.8 * 32, y: 4.6 * 32, zoom: 1.6 },
  zones: [
    { id: 'couch_circle', name: 'Main Couch Lounge', x: 4, y: 2.5, w: 6, h: 4, color: '#fed7aa' },
    { id: 'coffee_bar', name: 'Gunther Espresso Counter', x: 1, y: 1, w: 3.5, h: 6, color: '#fef08a' },
    { id: 'stage', name: 'Phoebe Acoustic Corner', x: 9, y: 1, w: 4, h: 3, color: '#ddd6fe' },
    { id: 'street_seating', name: 'Window Tables', x: 8.5, y: 5.5, w: 4.5, h: 4, color: '#bbf7d0' },
    { id: 'entrance', name: 'Front Door', x: 11, y: 1, w: 2, h: 2, color: '#e2e8f0' },
  ],
  tiles: buildTiles(),
  props: [
    prop('prop_central_rug', 'rug', 4.5, 2.75, 'down', { width: 4, height: 3, state: { decal: 'rug_persian' } }),

    // Couch circle
    prop('prop_orange_couch', 'sofa_orange', 5.5, 3.0, 'down', { name: 'The Orange Couch', interactive: true }),
    prop('prop_coffee_table', 'coffee_table_low', 6.0, 4.75, 'down', { name: 'Coffee Table', interactive: true }),
    prop('prop_armchair_green', 'armchair_green', 4.25, 4.25, 'right', { name: 'Green Armchair', interactive: true }),
    prop('prop_armchair_gold', 'armchair_gold', 8.25, 4.25, 'left', { name: 'Gold Armchair', interactive: true }),
    prop('prop_couch_lamp', 'floor_lamp', 8.25, 3.0, 'down', { name: 'Floor Lamp' }),

    // Counter along the west wall
    prop('prop_back_counter', 'back_counter', 1.0, 1.5, 'right', { name: 'Espresso Bar', interactive: true }),
    prop('prop_espresso_counter', 'cafe_counter', 2.5, 1.75, 'right', { name: 'Front Counter & Pastry Case', interactive: true }),
    prop('prop_stool_1', 'bar_stool', 3.625, 2.25, 'down'),
    prop('prop_stool_2', 'bar_stool', 3.625, 5.0, 'down'),
    prop('prop_chalkboard_menu', 'menu_board', 1.0, 1.75, 'right', { name: 'Menu Board' }),
    prop('prop_wall_shelf', 'wall_shelf', 1.0, 4.25, 'right', { name: 'Mug Shelf' }),

    // Stage corner
    prop('prop_piano', 'upright_piano', 9.5, 1.0, 'down', { name: 'Upright Piano', interactive: true }),
    prop('prop_piano_stool', 'bar_stool', 10.0, 1.875, 'down'),
    prop('prop_art_1', 'framed_art_warm', 9.25, 1.0, 'down', { name: 'Gallery Wall' }),
    prop('prop_art_2', 'framed_art_cool', 10.375, 1.0, 'down', { name: 'Gallery Wall' }),
    prop('prop_corner_plant', 'plant_tall', 12.25, 3.25, 'down'),
    prop('prop_window_plant', 'plant_tall', 1.25, 8.5, 'down'),

    // Tables
    prop('prop_table_a', 'cafe_table_round', 9.75, 6.0),
    prop('prop_chair_a1', 'cafe_chair', 9.875, 5.375, 'down'),
    prop('prop_chair_a2', 'cafe_chair', 9.875, 6.75, 'up'),
    prop('prop_table_b', 'cafe_table_round', 11.25, 7.75),
    prop('prop_chair_b1', 'cafe_chair', 11.375, 7.125, 'down'),
    prop('prop_chair_b2', 'cafe_chair', 11.375, 8.5, 'up'),
    prop('prop_bistro_table_1', 'cafe_table_round', 5.0, 7.75, 'down', { name: 'Bistro Table', interactive: true }),
    prop('prop_chair_c1', 'cafe_chair', 4.375, 7.875, 'right'),
    prop('prop_chair_c2', 'cafe_chair', 5.75, 7.875, 'left'),
  ],
  waypoints: {
    orange_couch_left: { id: 'orange_couch_left', name: 'Orange Couch (Ross)', x: 6.0, y: 3.2, facing: 'down', zone: 'couch_circle' },
    orange_couch_center: { id: 'orange_couch_center', name: 'Orange Couch (Rachel)', x: 6.65, y: 3.2, facing: 'down', zone: 'couch_circle' },
    orange_couch_right: { id: 'orange_couch_right', name: 'Orange Couch (Chandler)', x: 7.3, y: 3.2, facing: 'down', zone: 'couch_circle' },
    armchair_left: { id: 'armchair_left', name: "Monica's Armchair", x: 4.75, y: 4.3, facing: 'right', zone: 'couch_circle' },
    armchair_right: { id: 'armchair_right', name: "Joey's Armchair", x: 8.65, y: 4.3, facing: 'left', zone: 'couch_circle' },
    coffee_table_front: { id: 'coffee_table_front', name: 'Coffee Table Center', x: 6.65, y: 5.6, facing: 'up', zone: 'couch_circle' },
    coffee_counter: { id: 'coffee_counter', name: 'Gunther Barista Post', x: 2.0, y: 3.4, facing: 'right', zone: 'coffee_bar' },
    order_register: { id: 'order_register', name: 'Coffee Order Line', x: 3.9, y: 3.3, facing: 'left', zone: 'coffee_bar' },
    guitar_stage: { id: 'guitar_stage', name: 'Phoebe Performance Spot', x: 11.3, y: 2.3, facing: 'down', zone: 'stage' },
    stage_piano: { id: 'stage_piano', name: 'Piano Bench', x: 10.2, y: 1.7, facing: 'up', zone: 'stage' },
    street_table_left: { id: 'street_table_left', name: 'Bistro Seat (Janice)', x: 4.6, y: 7.7, facing: 'right', zone: 'street_seating' },
    perk_entrance: { id: 'perk_entrance', name: 'Central Perk Front Door', x: 12.5, y: 1.3, facing: 'down', zone: 'entrance' },
  },
  spawnPoints: {
    ross: { id: 'ross', name: 'Ross Spawn', x: 6.0, y: 3.2, facing: 'down' },
    rachel: { id: 'rachel', name: 'Rachel Spawn', x: 6.65, y: 3.2, facing: 'down' },
    chandler: { id: 'chandler', name: 'Chandler Spawn', x: 7.3, y: 3.2, facing: 'down' },
    monica: { id: 'monica', name: 'Monica Spawn', x: 4.75, y: 4.3, facing: 'right' },
    joey: { id: 'joey', name: 'Joey Spawn', x: 8.65, y: 4.3, facing: 'left' },
    phoebe: { id: 'phoebe', name: 'Phoebe Spawn', x: 11.3, y: 2.3, facing: 'down' },
    gunther: { id: 'gunther', name: 'Gunther Spawn', x: 2.0, y: 3.4, facing: 'right' },
    janice: { id: 'janice', name: 'Janice Spawn', x: 4.6, y: 7.7, facing: 'right' },
    mike: { id: 'mike', name: 'Mike Spawn', x: 10.2, y: 1.7, facing: 'up' },
  },
};
