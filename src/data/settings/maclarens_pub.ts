import { SettingDefinition } from '../../types/environment';

export const MACLARENS_PUB: SettingDefinition = {
  id: 'maclarens_pub',
  name: "MacLaren's Pub & NYC Corner",
  showTitle: 'How I Met Your Mother',
  description: "The iconic Irish pub beneath Ted & Marshall's apartment where the gang gathers in their favorite red booth.",
  gridWidth: 36,
  gridHeight: 24,
  tileSize: 32,
  backgroundColor: '#0c0a09',
  defaultCamera: {
    x: 576,
    y: 384,
    zoom: 1.15,
  },
  tiles: {},
  props: [
    // 1. The Gang's Iconic Red Tufted Leather Booth
    {
      id: 'prop_gang_booth',
      type: 'sofa_leather',
      x: 5.5,
      y: 7.2,
      width: 5.4,
      height: 3.4,
      name: "The Gang's Red Leather Booth",
      interactive: true,
      zIndexOffset: -10,
    },
    {
      id: 'prop_booth_table',
      type: 'desk_wood',
      x: 6.8,
      y: 9.4,
      width: 2.8,
      height: 1.6,
      name: 'MacLarens Booth Table (Pitchers & Wings)',
      interactive: true,
    },

    // 2. Secondary Booth (The Captain's VIP Table)
    {
      id: 'prop_captain_booth',
      type: 'sofa_leather',
      x: 5.5,
      y: 13.2,
      width: 5.4,
      height: 3.2,
      name: "Captain's Red Leather Booth",
      interactive: true,
      zIndexOffset: -10,
    },
    {
      id: 'prop_captain_table',
      type: 'desk_wood',
      x: 6.8,
      y: 15.2,
      width: 2.8,
      height: 1.5,
      name: 'Captain Table (Scotch & Cigars)',
      interactive: true,
    },

    // 3. MacLaren's Main Bar Counter & Carl's Liquor Shelves
    {
      id: 'prop_liquor_shelf',
      type: 'liquor_shelf',
      x: 18.5,
      y: 1.5,
      width: 10,
      height: 2.2,
      name: "Carl's Mirrored Liquor Bottle Collection",
      interactive: true,
      zIndexOffset: -20,
    },
    {
      id: 'prop_bar_counter',
      type: 'coffee_bar',
      x: 18.5,
      y: 4.8,
      width: 10,
      height: 2.4,
      name: "MacLaren's Main Bar Counter (Brass Rail & Taps)",
      interactive: true,
    },
    {
      id: 'prop_bar_stool_1',
      type: 'chair_office',
      x: 19.5,
      y: 7.5,
      name: 'Bar Stool 1 (Ranjit)',
      zIndexOffset: -5,
    },
    {
      id: 'prop_bar_stool_2',
      type: 'chair_office',
      x: 22,
      y: 7.5,
      name: 'Bar Stool 2 (Robin)',
      zIndexOffset: -5,
    },
    {
      id: 'prop_bar_stool_3',
      type: 'chair_office',
      x: 24.5,
      y: 7.5,
      name: 'Bar Stool 3',
      zIndexOffset: -5,
    },
    {
      id: 'prop_bar_stool_4',
      type: 'chair_office',
      x: 27,
      y: 7.5,
      name: 'Bar Stool 4',
      zIndexOffset: -5,
    },

    // 4. High-Top Cocktail Tables & Stools
    {
      id: 'prop_high_top_1',
      type: 'high_top_table',
      x: 15.5,
      y: 13,
      width: 2,
      height: 2,
      name: 'High Top Table 1 (Candle Lantern)',
      interactive: true,
    },
    {
      id: 'prop_high_top_2',
      type: 'high_top_table',
      x: 22,
      y: 13,
      width: 2,
      height: 2,
      name: 'High Top Table 2 (Patrice)',
      interactive: true,
    },

    // 5. Warm Pub Fireplace
    {
      id: 'prop_pub_fireplace',
      type: 'pub_fireplace',
      x: 12.5,
      y: 1.5,
      width: 4,
      height: 2.2,
      name: "MacLaren's Brick Fireplace (Glowing Embers)",
      interactive: true,
    },

    // 6. Iconic HIMYM Wall Memorabilia
    {
      id: 'prop_french_horn',
      type: 'french_horn',
      x: 3.5,
      y: 1.5,
      width: 2,
      height: 1.6,
      name: 'The Blue French Horn Wall Mount',
      interactive: true,
    },
    {
      id: 'prop_swords_crossed',
      type: 'swords_crossed',
      x: 7.5,
      y: 1.5,
      width: 2.4,
      height: 2,
      name: "Ted & Marshall's Crossed Broadswords",
      interactive: true,
    },
    {
      id: 'prop_ducky_tie',
      type: 'framed_art',
      x: 10.5,
      y: 1.5,
      width: 1.8,
      height: 1.6,
      name: "Barney's Ducky Tie Shadowbox",
      interactive: true,
    },
    {
      id: 'prop_pub_neon',
      type: 'neon_sign',
      x: 29.5,
      y: 1.5,
      width: 5,
      height: 1.4,
      name: "MACLAREN'S",
      interactive: true,
    },

    // 7. Jukebox & Dartboard in Back Corner
    {
      id: 'prop_jukebox',
      type: 'jukebox',
      x: 31,
      y: 15.5,
      width: 2.5,
      height: 2.8,
      name: 'Vintage Rock Jukebox',
      interactive: true,
    },
    {
      id: 'prop_dartboard',
      type: 'dartboard',
      x: 32,
      y: 8,
      width: 2,
      height: 2,
      name: 'Championship Pub Dartboard',
      interactive: true,
    },

    // 8. Entrance Umbrella Stand & Coat Rack
    {
      id: 'prop_yellow_umbrella',
      type: 'umbrella_stand',
      x: 3.5,
      y: 18.5,
      width: 1.4,
      height: 1.5,
      name: 'The Yellow Umbrella Stand',
      interactive: true,
    },
  ],
  waypoints: {
    // Main Cast (Red Booth)
    booth_ted: { id: 'booth_ted', name: "Ted's Seat (Booth)", x: 6.2, y: 8.2, facing: 'right', zone: 'gang_booth' },
    booth_barney: { id: 'booth_barney', name: "Barney's Corner", x: 9.8, y: 8.2, facing: 'left', zone: 'gang_booth' },
    booth_marshall: { id: 'booth_marshall', name: "Marshall's Side", x: 8, y: 7.5, facing: 'down', zone: 'gang_booth' },
    booth_lily: { id: 'booth_lily', name: "Lily's Seat", x: 6.2, y: 10.2, facing: 'right', zone: 'gang_booth' },
    bar_stool_robin: { id: 'bar_stool_robin', name: "Robin's Bar Stool", x: 22, y: 8.2, facing: 'up', zone: 'bar_counter' },

    // NPC Characters
    bartender_station: { id: 'bartender_station', name: "Carl's Bartender Station", x: 23.5, y: 4.2, facing: 'down', zone: 'bar_counter' },
    ranjit_stool: { id: 'ranjit_stool', name: "Ranjit's Bar Stool", x: 19.5, y: 8.2, facing: 'up', zone: 'bar_counter' },
    waitress_station: { id: 'waitress_station', name: "Wendy Service Floor", x: 13.5, y: 9.5, facing: 'left', zone: 'main_floor' },
    high_top_patrice: { id: 'high_top_patrice', name: 'Patrice High Top', x: 21, y: 13.8, facing: 'right', zone: 'high_tops' },
    booth_captain: { id: 'booth_captain', name: "The Captain's VIP Table", x: 8, y: 14.5, facing: 'down', zone: 'vip_booth' },

    // General Pub Landmarks
    pub_floor_center: { id: 'pub_floor_center', name: 'Pub Floor Center', x: 16.5, y: 10, facing: 'down', zone: 'main_floor' },
    pub_entrance: { id: 'pub_entrance', name: 'MacLarens Front Door', x: 4, y: 20, facing: 'up', zone: 'entrance' },
    jukebox_spot: { id: 'jukebox_spot', name: 'Jukebox Dance Area', x: 30, y: 16.5, facing: 'right', zone: 'entertainment' },
    darts_line: { id: 'darts_line', name: 'Dart Throwing Line', x: 30, y: 8.5, facing: 'right', zone: 'entertainment' },
  },
  spawnPoints: {
    // Main 5
    ted: { id: 'ted', name: 'Ted Spawn', x: 6.2, y: 8.2, facing: 'right' },
    barney: { id: 'barney', name: 'Barney Spawn', x: 9.8, y: 8.2, facing: 'left' },
    marshall: { id: 'marshall', name: 'Marshall Spawn', x: 8, y: 7.5, facing: 'down' },
    lily: { id: 'lily', name: 'Lily Spawn', x: 6.2, y: 10.2, facing: 'right' },
    robin: { id: 'robin', name: 'Robin Spawn', x: 22, y: 8.2, facing: 'up' },

    // NPCs
    carl: { id: 'carl', name: 'Carl Spawn', x: 23.5, y: 4.2, facing: 'down' },
    ranjit: { id: 'ranjit', name: 'Ranjit Spawn', x: 19.5, y: 8.2, facing: 'up' },
    wendy: { id: 'wendy', name: 'Wendy Spawn', x: 13.5, y: 9.5, facing: 'left' },
    patrice: { id: 'patrice', name: 'Patrice Spawn', x: 21, y: 13.8, facing: 'right' },
    the_captain: { id: 'the_captain', name: 'The Captain Spawn', x: 8, y: 14.5, facing: 'down' },
  },
};

// Generate pub floorboards and wainscotting walls
for (let x = 0; x < MACLARENS_PUB.gridWidth; x++) {
  for (let y = 0; y < MACLARENS_PUB.gridHeight; y++) {
    if (y === 0 || y === 1) {
      MACLARENS_PUB.tiles[`${x},${y}`] = 'wall_office_top';
    } else if (x === 0 || x === MACLARENS_PUB.gridWidth - 1) {
      MACLARENS_PUB.tiles[`${x},${y}`] = 'wall_office_side';
    } else if (x > 2 && x < 8 && y === 1) {
      MACLARENS_PUB.tiles[`${x},${y}`] = 'window_blinds'; // Street view
    } else {
      MACLARENS_PUB.tiles[`${x},${y}`] = 'floor_wood';
    }
  }
}
