import { PropInstance, SettingDefinition } from '../../types/environment';
import { isoProp, isoTiles, waypoint } from './isoLayout';

/**
 * MacLaren's Pub as an isometric stage, 14 x 10 m inside: a basement bar reached down a short
 * flight of steps from the street door in the west wall. The bar runs along the back wall with
 * the mirrored back bar behind it (Carl works the gap between), the gang's booth sits against the
 * west wall under the painting, the Captain's booth below it, and darts and the jukebox fill the
 * far end. Waypoint ids match maclarens_pub, plus the bar_stool_1 / booth_table_center targets the
 * episodes walk to.
 */

const GW = 16;
const GH = 12;
const FOOT = 14 / 32;

const tiles = isoTiles(GW, GH, 'wall_brick', 'floor_wood', (set) => {
  set(0, 9, 'door_street');
  set(0, 10, 'window_blinds');
  set(3, 0, 'window_blinds');
  set(11, 0, 'door_wood'); // restrooms
});

const props: PropInstance[] = [
  // The bar
  isoProp('prop_liquor_shelf', 'back_bar', 4.0, 1.0, 'down', { name: 'Back Bar', interactive: true }),
  isoProp('prop_bar_counter', 'bar_counter', 4.0, 2.375, 'down', { name: "MacLaren's Bar", interactive: true }),
  ...[5.0, 6.0, 7.0, 8.0, 9.0].map((x, i) => isoProp(`prop_bar_stool_${i + 1}`, 'bar_stool_pub', x, 3.3125, 'up')),
  // The gang's booth: benches facing across the table, Barney's chair at the open end.
  isoProp('prop_gang_booth', 'booth_bench', 1.0, 3.75, 'down', { name: "The Gang's Booth", interactive: true }),
  isoProp('prop_booth_table', 'booth_table', 1.0625, 4.4375, 'down', { name: 'Booth Table', interactive: true }),
  isoProp('prop_gang_booth_2', 'booth_bench', 1.0, 5.25, 'up'),
  isoProp('prop_barney_chair', 'pub_chair', 2.5625, 4.625, 'left'),
  isoProp('prop_booth_painting', 'painting_pub', 1.0, 4.25, 'right', { name: 'The Painting' }),
  isoProp('prop_sconce_1', 'wall_sconce', 1.0, 3.5, 'right'),
  isoProp('prop_sconce_2', 'wall_sconce', 1.0, 5.75, 'right'),
  // The Captain's booth
  isoProp('prop_captain_booth', 'booth_bench', 1.0, 6.375, 'down', { name: "Captain's Booth" }),
  isoProp('prop_captain_table', 'booth_table', 1.0625, 7.0625, 'down'),
  isoProp('prop_captain_booth_2', 'booth_bench', 1.0, 7.875, 'up'),
  isoProp('prop_ducky_tie', 'ducky_tie_frame', 1.0, 7.0, 'right', { name: 'Ducky Tie' }),
  // Street entrance
  isoProp('prop_street_stairs', 'street_stairs', 1.0, 8.875, 'right', { name: 'Steps to the Street' }),
  isoProp('prop_yellow_umbrella', 'umbrella_stand', 2.5, 10.375, 'down', { name: 'The Yellow Umbrella', interactive: true }),
  isoProp('prop_coat_rack', 'coat_rack_pub', 3.0, 10.5, 'down'),
  // High tops
  ...[
    [10.75, 5.0],
    [12.5, 6.75],
    [9.5, 8.0],
  ].flatMap(([x, y], i) => [
    isoProp(`prop_high_top_${i + 1}`, 'high_top', x, y, 'down', { name: 'High Top' }),
    isoProp(`prop_high_stool_${i + 1}a`, 'bar_stool_pub', x - 0.5, y + 0.1875, 'right'),
    isoProp(`prop_high_stool_${i + 1}b`, 'bar_stool_pub', x + 0.8125, y + 0.1875, 'left'),
  ]),
  // Darts and the jukebox
  isoProp('prop_dartboard', 'dartboard', 12.0, 1.0, 'down', { name: 'Dartboard', interactive: true }),
  isoProp('prop_jukebox', 'jukebox', 13.25, 1.0, 'down', { name: 'Jukebox', interactive: true }),
  isoProp('prop_pub_neon', 'neon_beer', 13.375, 1.0, 'down'),
  isoProp('prop_neon_open', 'neon_open', 10.25, 1.0, 'down'),
  // Photos on every wall
  isoProp('prop_photos_1', 'framed_photos_a', 1.25, 1.0, 'down'),
  isoProp('prop_photos_2', 'framed_photos_b', 1.0, 1.375, 'right'),
];

/** Character position for someone sitting at a seat prop's centre. */
function seatOf(id: string): { x: number; y: number } {
  const p = props.find((q) => q.id === id)!;
  return { x: p.x + (p.width || 1) / 2, y: p.y + (p.height || 1) / 2 - FOOT };
}

const booth = props.find((p) => p.id === 'prop_gang_booth')!;
const booth2 = props.find((p) => p.id === 'prop_gang_booth_2')!;
const captain = props.find((p) => p.id === 'prop_captain_booth')!;
const benchSeat = (b: PropInstance, along: number) => ({ x: b.x + along, y: b.y + (b.height || 1) / 2 - FOOT });

export const MACLARENS_ISO: SettingDefinition = {
  id: 'maclarens_iso',
  name: "MacLaren's Pub",
  showTitle: 'How I Met Your Mother',
  description: "The gang's basement bar at true scale: the long bar, the booth, darts and the jukebox.",
  gridWidth: GW,
  gridHeight: GH,
  tileSize: 32,
  backgroundColor: '#0c0706',
  tileTheme: 'pub',
  projection: 'iso',
  defaultCamera: { x: 6.5 * 32, y: 5.0 * 32, zoom: 1.6 },
  zones: [
    { id: 'main_floor', name: 'Main Floor', x: 4, y: 4, w: 8, h: 6, color: '#fed7aa' },
    { id: 'the_booth', name: "The Gang's Booth", x: 1, y: 3, w: 3, h: 3, color: '#fecaca' },
    { id: 'bar', name: 'The Bar', x: 4, y: 1, w: 7, h: 3, color: '#fef08a' },
    { id: 'entertainment', name: 'Darts & Jukebox', x: 11, y: 1, w: 4, h: 4, color: '#ddd6fe' },
  ],
  tiles,
  props,
  waypoints: {
    booth_ted: waypoint('booth_ted', "Ted's Seat (Booth)", benchSeat(booth, 0.4375), 'down', 'the_booth'),
    booth_marshall: waypoint('booth_marshall', "Marshall's Side", benchSeat(booth, 1.0625), 'down', 'the_booth'),
    booth_lily: waypoint('booth_lily', "Lily's Seat", benchSeat(booth2, 1.0625), 'up', 'the_booth'),
    booth_robin: waypoint('booth_robin', "Robin's Booth Seat", benchSeat(booth2, 0.4375), 'up', 'the_booth'),
    booth_barney: waypoint('booth_barney', "Barney's Corner", seatOf('prop_barney_chair'), 'left', 'the_booth'),
    booth_table_center: waypoint('booth_table_center', 'Booth Table End', { x: 3.4375, y: 4.375 }, 'left', 'the_booth'),
    bar_stool_robin: waypoint('bar_stool_robin', "Robin's Bar Stool", seatOf('prop_bar_stool_4'), 'up', 'bar'),
    ranjit_stool: waypoint('ranjit_stool', "Ranjit's Bar Stool", seatOf('prop_bar_stool_2'), 'up', 'bar'),
    bar_stool_1: waypoint('bar_stool_1', 'Bar Stool', seatOf('prop_bar_stool_1'), 'up', 'bar'),
    bartender_station: waypoint('bartender_station', "Carl's Bartender Station", { x: 7.0, y: 1.5 }, 'down', 'bar'),
    waitress_station: waypoint('waitress_station', 'Wendy Service Floor', { x: 10.625, y: 3.25 }, 'left', 'bar'),
    high_top_patrice: waypoint('high_top_patrice', 'Patrice High Top', seatOf('prop_high_stool_2a'), 'right', 'main_floor'),
    booth_captain: waypoint('booth_captain', "The Captain's VIP Table", benchSeat(captain, 0.75), 'down', 'the_booth'),
    pub_floor_center: waypoint('pub_floor_center', 'Pub Floor Center', { x: 7.0, y: 6.0 }, 'down', 'main_floor'),
    pub_entrance: waypoint('pub_entrance', "MacLaren's Front Door", { x: 2.6875, y: 9.0 }, 'right', 'main_floor'),
    jukebox_spot: waypoint('jukebox_spot', 'Jukebox Dance Area', { x: 13.75, y: 2.0 }, 'up', 'entertainment'),
    darts_line: waypoint('darts_line', 'Dart Throwing Line', { x: 12.3125, y: 3.25 }, 'up', 'entertainment'),
  },
  spawnPoints: {
    ted: waypoint('ted', 'Ted Spawn', benchSeat(booth, 0.4375), 'down'),
    barney: waypoint('barney', 'Barney Spawn', seatOf('prop_barney_chair'), 'left'),
    marshall: waypoint('marshall', 'Marshall Spawn', benchSeat(booth, 1.0625), 'down'),
    lily: waypoint('lily', 'Lily Spawn', benchSeat(booth2, 1.0625), 'up'),
    robin: waypoint('robin', 'Robin Spawn', seatOf('prop_bar_stool_4'), 'up'),
    carl: waypoint('carl', 'Carl Spawn', { x: 7.0, y: 1.5 }, 'down'),
    ranjit: waypoint('ranjit', 'Ranjit Spawn', seatOf('prop_bar_stool_2'), 'up'),
    wendy: waypoint('wendy', 'Wendy Spawn', { x: 10.625, y: 3.25 }, 'left'),
    patrice: waypoint('patrice', 'Patrice Spawn', seatOf('prop_high_stool_2a'), 'right'),
    the_captain: waypoint('the_captain', 'Captain Spawn', benchSeat(captain, 0.75), 'down'),
  },
};
