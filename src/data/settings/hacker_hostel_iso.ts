import { PropInstance, SettingDefinition } from '../../types/environment';
import { deskWithChair, isoProp, isoTiles, waypoint } from './isoLayout';

/**
 * The Hacker Hostel as an isometric stage, 16 x 12 m inside. The guys code at a row of desks
 * along the west wall, screens facing into the room; the kitchen with its island and the smart
 * fridge sits under the north window; Anton hums in the cinder-block garage in the north-east;
 * Erlich holds court from the sectional in the living room; and the patio, behind sliding glass,
 * has the pool and the palapa against the back hedge. Waypoint ids match hacker_hostel.
 */

const GW = 18;
const GH = 14;
const FOOT = 14 / 32;

const tiles = isoTiles(GW, GH, 'wall_office_side', 'floor_wood', (set, fill) => {
  // Garage
  fill(11, 1, 11, 6, 'wall_brick');
  fill(11, 6, 16, 6, 'wall_brick');
  set(11, 3, 'door_wood');
  fill(12, 0, 16, 0, 'wall_brick');
  fill(12, 1, 16, 5, 'floor_concrete');
  // Kitchen floor
  fill(6, 1, 10, 4, 'floor_tile_kitchen');
  // Patio behind sliding glass, against the hedge.
  fill(1, 7, 8, 7, 'wall_glass');
  fill(8, 7, 8, 12, 'wall_glass');
  set(3, 7, 'door_glass');
  set(8, 9, 'door_glass');
  fill(1, 8, 7, 12, 'floor_deck');
  fill(5, 8, 7, 12, 'floor_grass');
  fill(0, 8, 0, 12, 'wall_hedge');
  // Back wall: front door, windows over the desks and the kitchen sink.
  set(5, 0, 'door_wood');
  fill(7, 0, 8, 0, 'window_blinds');
  set(0, 2, 'window_blinds');
  set(0, 5, 'window_blinds');
});

const seats: Record<string, { x: number; y: number }> = {};
const props: PropInstance[] = [];

// The coding desks, screens facing into the room.
(
  [
    ['richard', 1.25],
    ['gilfoyle', 3.0],
    ['dinesh', 4.75],
  ] as const
).forEach(([who, y]) => {
  const d = deskWithChair(`prop_${who}_desk`, `desk_${who}`, `prop_${who}_chair`, 'chair_mesh', 1.0, y, 'left');
  props.push(...d.props);
  seats[who] = d.seat;
});

// Jared's place at the dining table.
const dining = deskWithChair('prop_dining_table', 'patio_table', 'prop_jared_chair', 'dining_chair', 13.5, 8.25, 'left');
props.push(...dining.props, isoProp('prop_dining_chair_2', 'dining_chair', 12.9375, 8.5, 'right'));
seats.jared = dining.seat;

// Gavin's seat under the palapa.
const palapa = deskWithChair('prop_palapa_table', 'patio_table', 'prop_palapa_chair', 'dining_chair', 6.125, 8.875, 'right');
props.push(...palapa.props, isoProp('prop_palapa_chair_2', 'dining_chair', 7.25, 9.125, 'left'));
seats.gavin = palapa.seat;

props.push(
  isoProp('prop_scrum_board', 'scrum_board', 2.0, 1.0, 'down', { name: 'Scrum Board', interactive: true }),
  isoProp('prop_aviato_poster', 'sign_aviato', 1.0, 3.25, 'right', { name: 'Aviato', interactive: true }),
  // Kitchen
  isoProp('prop_kitchen_counter', 'kitchen_run', 6.0, 1.0, 'down', { name: 'Kitchen', interactive: true }),
  isoProp('prop_smart_fridge', 'smart_fridge', 9.0625, 1.0, 'down', { name: 'Smart Fridge', interactive: true }),
  isoProp('prop_kitchen_island', 'kitchen_island', 7.0, 3.0, 'down', { name: 'Kitchen Island', interactive: true }),
  isoProp('prop_island_stool_1', 'stool_island', 7.25, 4.0, 'up'),
  isoProp('prop_island_stool_2', 'stool_island', 8.25, 4.0, 'up'),
  // Garage
  isoProp('prop_anton_rack', 'server_rack', 12.375, 1.0, 'down', { name: 'Anton', interactive: true }),
  isoProp('prop_anton_rack_2', 'server_rack_b', 13.0625, 1.0, 'down', { name: 'Server Rack' }),
  isoProp('prop_ups', 'ups_box', 13.75, 1.0, 'down'),
  isoProp('prop_garage_shelves', 'garage_shelves', 14.5, 1.0, 'down'),
  isoProp('prop_workbench', 'workbench', 12.5, 4.625, 'down', { name: 'Workbench' }),
  // Living room
  isoProp('prop_erlich_couch', 'sectional_sofa', 9.5, 7.375, 'down', { name: "Erlich's Sectional", interactive: true }),
  isoProp('prop_living_table', 'coffee_table_modern', 9.875, 9.75, 'down', { name: 'Coffee Table', interactive: true }),
  isoProp('prop_beanbag', 'beanbag', 12.75, 10.5, 'down'),
  isoProp('prop_succulent', 'succulent', 15.875, 7.125, 'down'),
  isoProp('prop_living_plant', 'succulent', 10.25, 4.875, 'down'),
  // Patio
  isoProp('prop_pool', 'pool', 1.25, 10.25, 'down', { name: 'Pool' }),
  isoProp('prop_lounger_1', 'lounger', 1.25, 8.125, 'right'),
  isoProp('prop_palapa', 'palapa_roof', 5.25, 7.875, 'down', { name: 'The Palapa' }),
  ...[
    [5.75, 8.375],
    [7.375, 8.375],
    [5.75, 10.0],
    [7.375, 10.0],
  ].map(([x, y], i) => isoProp(`prop_palapa_post_${i}`, 'palapa_post', x, y, 'down')),
  isoProp('prop_shrub_1', 'shrub', 1.125, 9.0, 'down'),
  isoProp('prop_shrub_2', 'shrub', 4.125, 8.0, 'down'),
);

export const HACKER_HOSTEL_ISO: SettingDefinition = {
  id: 'hacker_hostel_iso',
  name: 'Pied Piper Hacker Hostel (Isometric)',
  showTitle: 'Silicon Valley',
  description: "Erlich's Palo Alto incubator at true scale: the desks, the kitchen, Anton in the garage, the pool and the palapa.",
  gridWidth: GW,
  gridHeight: GH,
  tileSize: 32,
  backgroundColor: '#10161a',
  tileTheme: 'hostel',
  projection: 'iso',
  defaultCamera: { x: 8.5 * 32, y: 6.5 * 32, zoom: 1.35 },
  zones: [
    { id: 'coding_area', name: 'Coding Desks', x: 1, y: 1, w: 3, h: 6, color: '#bfdbfe' },
    { id: 'kitchen', name: 'Kitchen', x: 6, y: 1, w: 5, h: 4, color: '#fbcfe8' },
    { id: 'server_garage', name: 'Garage (Anton)', x: 12, y: 1, w: 5, h: 5, color: '#e2e8f0' },
    { id: 'living_room', name: 'Living Room', x: 9, y: 7, w: 8, h: 6, color: '#fed7aa' },
    { id: 'patio', name: 'Patio & Pool', x: 1, y: 8, w: 7, h: 5, color: '#bbf7d0' },
    { id: 'entrance', name: 'Front Door', x: 4, y: 1, w: 2, h: 2, color: '#fef08a' },
  ],
  tiles,
  props,
  waypoints: {
    richard_desk: waypoint('richard_desk', "Richard's Desk", seats.richard, 'left', 'coding_area'),
    gilfoyle_desk: waypoint('gilfoyle_desk', "Gilfoyle's Station", seats.gilfoyle, 'left', 'coding_area'),
    dinesh_desk: waypoint('dinesh_desk', "Dinesh's Station", seats.dinesh, 'left', 'coding_area'),
    erlich_sofa: waypoint('erlich_sofa', "Erlich's Sofa", { x: 10.625, y: 7.875 - FOOT + 0.25 }, 'down', 'living_room'),
    jared_table: waypoint('jared_table', "Jared's Chair", seats.jared, 'left', 'living_room'),
    living_room_center: waypoint('living_room_center', 'Living Room Center', { x: 11.5, y: 11.0 }, 'up', 'living_room'),
    server_garage: waypoint('server_garage', 'Anton Server Garage', { x: 13.0, y: 2.25 }, 'up', 'server_garage'),
    kitchen_counter: waypoint('kitchen_counter', 'Kitchen Island (Jian-Yang)', { x: 8.0, y: 2.0 }, 'down', 'kitchen'),
    palapa_table: waypoint('palapa_table', 'Palapa Table (Gavin Belson)', seats.gavin, 'right', 'patio'),
    hostel_entrance: waypoint('hostel_entrance', 'Hostel Front Door', { x: 5.5, y: 1.25 }, 'down', 'entrance'),
  },
  spawnPoints: {
    richard: waypoint('richard', 'Richard Spawn', seats.richard, 'left'),
    gilfoyle: waypoint('gilfoyle', 'Gilfoyle Spawn', seats.gilfoyle, 'left'),
    dinesh: waypoint('dinesh', 'Dinesh Spawn', seats.dinesh, 'left'),
    erlich: waypoint('erlich', 'Erlich Spawn', { x: 10.625, y: 7.875 - FOOT + 0.25 }, 'down'),
    jared: waypoint('jared', 'Jared Spawn', seats.jared, 'left'),
    jianyang: waypoint('jianyang', 'Jian-Yang Spawn', { x: 8.0, y: 2.0 }, 'down'),
    bighead: waypoint('bighead', 'Big Head Spawn', { x: 11.5, y: 11.0 }, 'up'),
    gavin: waypoint('gavin', 'Gavin Spawn', seats.gavin, 'right'),
    monica_hall: waypoint('monica_hall', 'Monica Spawn', { x: 12.25, y: 11.25 }, 'left'),
    laurie: waypoint('laurie', 'Laurie Spawn', { x: 13.0, y: 2.25 }, 'up'),
  },
};
