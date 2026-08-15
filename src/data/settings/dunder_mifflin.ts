import { SettingDefinition } from '../../types/environment';

export const DUNDER_MIFFLIN_SCRANTON: SettingDefinition = {
  id: 'dunder_mifflin_scranton',
  name: 'Dunder Mifflin Scranton Branch',
  showTitle: 'The Office',
  gridWidth: 36,
  gridHeight: 22,
  tileSize: 32,
  backgroundColor: '#2d3748',
  defaultCamera: {
    x: 576, // Center of 36 * 32 = 1152px
    y: 352, // Center of 22 * 32 = 704px
    zoom: 1.15,
  },
  zones: [
    { id: 'michaels_office', name: "Michael's Office", x: 2, y: 2, w: 7, h: 7, color: '#fed7aa' },
    { id: 'reception', name: 'Reception', x: 9, y: 5, w: 5, h: 5, color: '#fef08a' },
    { id: 'conference_room', name: 'Conference Room', x: 15, y: 2, w: 11, h: 8, color: '#bfdbfe' },
    { id: 'sales_bullpen', name: 'Sales Bullpen', x: 9, y: 11, w: 13, h: 8, color: '#bbf7d0' },
    { id: 'accounting', name: 'Accounting', x: 23, y: 11, w: 6, h: 8, color: '#ddd6fe' },
    { id: 'breakroom', name: 'Kitchen & Breakroom', x: 27, y: 2, w: 8, h: 8, color: '#fbcfe8' },
    { id: 'annex', name: 'The Annex (Toby & Kelly)', x: 30, y: 11, w: 5, h: 8, color: '#e2e8f0' },
  ],
  tiles: (() => {
    const tiles: { [key: string]: any } = {};
    const W = 36;
    const H = 22;

    for (let x = 0; x < W; x++) {
      for (let y = 0; y < H; y++) {
        // Outer boundaries
        if (x === 0 || x === W - 1 || y === 0 || y === H - 1) {
          tiles[`${x},${y}`] = 'wall_office_side';
        } else if (y === 1) {
          tiles[`${x},${y}`] = 'wall_office_top';
        }
        // Michael's Office Partition walls
        else if ((x === 8 && y >= 2 && y <= 8) || (y === 8 && x >= 2 && x <= 8)) {
          tiles[`${x},${y}`] = x === 8 && y === 5 ? 'door_glass' : 'wall_glass';
        }
        // Conference Room Partition walls
        else if (
          (x === 14 && y >= 2 && y <= 9) ||
          (x === 26 && y >= 2 && y <= 9) ||
          (y === 9 && x >= 14 && x <= 26)
        ) {
          tiles[`${x},${y}`] = y === 9 && (x === 19 || x === 20) ? 'door_glass' : 'wall_glass';
        }
        // Breakroom Partition walls
        else if (x === 26 && y >= 2 && y <= 9) {
          tiles[`${x},${y}`] = y === 5 ? 'door_wood' : 'wall_office_side';
        }
        // Floor Types
        else if (x >= 27 && x <= 34 && y >= 2 && y <= 9) {
          tiles[`${x},${y}`] = 'floor_tile_kitchen'; // Breakroom tiles
        } else if (x >= 15 && x <= 25 && y >= 2 && y <= 8) {
          tiles[`${x},${y}`] = 'floor_carpet_blue'; // Conference carpet
        } else if (x >= 2 && x <= 7 && y >= 2 && y <= 7) {
          tiles[`${x},${y}`] = 'floor_wood'; // Michael's hardwood floor
        } else {
          tiles[`${x},${y}`] = 'floor_carpet_grey'; // General bullpen carpet
        }

        // Office Windows at top wall
        if (y === 1 && (x === 4 || x === 5 || x === 18 || x === 19 || x === 20 || x === 30 || x === 31)) {
          tiles[`${x},${y}`] = 'window_blinds';
        }
      }
    }
    return tiles;
  })(),
  props: [
    // Michael's Office
    {
      id: 'prop_michael_desk',
      type: 'desk_michael',
      x: 4,
      y: 4,
      width: 2,
      height: 1.5,
      name: "Michael's Executive Desk",
      interactive: true,
    },
    {
      id: 'prop_michael_chair',
      type: 'chair_office',
      x: 4.5,
      y: 3.2,
      interactive: true,
    },
    {
      id: 'prop_michael_plant',
      type: 'potted_plant',
      x: 2.2,
      y: 2.2,
    },
    {
      id: 'prop_michael_sofa',
      type: 'sofa_leather',
      x: 2.2,
      y: 6.5,
      width: 2,
      height: 1,
    },

    // Reception
    {
      id: 'prop_reception_desk',
      type: 'desk_reception',
      x: 10,
      y: 6,
      width: 2.5,
      height: 1.8,
      name: "Pam's Reception Desk",
      interactive: true,
    },
    {
      id: 'prop_reception_chair',
      type: 'chair_office',
      x: 10.8,
      y: 5.5,
    },
    {
      id: 'prop_reception_sofa',
      type: 'sofa_leather',
      x: 9.5,
      y: 9,
      width: 2,
      height: 1,
    },
    {
      id: 'prop_reception_plant',
      type: 'potted_plant',
      x: 13,
      y: 9,
    },

    // Conference Room
    {
      id: 'prop_conf_table',
      type: 'conference_table',
      x: 17,
      y: 4.5,
      width: 6,
      height: 2.2,
      name: 'Conference Room Table',
      interactive: true,
    },
    {
      id: 'prop_conf_whiteboard',
      type: 'whiteboard',
      x: 18,
      y: 2,
      width: 4,
      height: 0.8,
      name: 'Whiteboard Presentation',
    },
    {
      id: 'prop_conf_chair_1',
      type: 'chair_conference',
      x: 16.2,
      y: 5.2,
    },
    {
      id: 'prop_conf_chair_2',
      type: 'chair_conference',
      x: 18,
      y: 3.5,
    },
    {
      id: 'prop_conf_chair_3',
      type: 'chair_conference',
      x: 20,
      y: 3.5,
    },
    {
      id: 'prop_conf_chair_4',
      type: 'chair_conference',
      x: 22,
      y: 3.5,
    },
    {
      id: 'prop_conf_chair_5',
      type: 'chair_conference',
      x: 18,
      y: 7.2,
    },
    {
      id: 'prop_conf_chair_6',
      type: 'chair_conference',
      x: 20,
      y: 7.2,
    },
    {
      id: 'prop_conf_chair_7',
      type: 'chair_conference',
      x: 22,
      y: 7.2,
    },

    // Sales Clump 1: Jim & Dwight (Facing Desks)
    {
      id: 'prop_jim_desk',
      type: 'desk_wood',
      x: 11,
      y: 13,
      width: 2,
      height: 1.4,
      name: "Jim's Desk",
      interactive: true,
    },
    {
      id: 'prop_dwight_desk',
      type: 'desk_wood',
      x: 11,
      y: 15.5,
      width: 2,
      height: 1.4,
      name: "Dwight's Desk",
      interactive: true,
    },
    {
      id: 'prop_jello_stapler',
      type: 'jello_stapler',
      x: 11.5,
      y: 15.8,
      width: 0.8,
      height: 0.8,
      name: 'Stapler in Jello',
    },

    // Sales Clump 2: Stanley & Phyllis
    {
      id: 'prop_stanley_desk',
      type: 'desk_wood',
      x: 16,
      y: 13,
      width: 2,
      height: 1.4,
      name: "Stanley's Desk",
      interactive: true,
    },
    {
      id: 'prop_phyllis_desk',
      type: 'desk_wood',
      x: 16,
      y: 15.5,
      width: 2,
      height: 1.4,
      name: "Phyllis's Desk",
    },

    // Accounting Clump: Angela & Kevin
    {
      id: 'prop_angela_desk',
      type: 'desk_wood',
      x: 23,
      y: 13,
      width: 2,
      height: 1.4,
      name: "Angela's Desk",
      interactive: true,
    },
    {
      id: 'prop_kevin_desk',
      type: 'desk_wood',
      x: 23,
      y: 15.5,
      width: 2,
      height: 1.4,
      name: "Kevin's Desk",
      interactive: true,
    },

    // Corridor Props
    {
      id: 'prop_water_cooler',
      type: 'water_cooler',
      x: 8,
      y: 13,
      width: 1,
      height: 1.2,
      name: 'Water Cooler',
      interactive: true,
    },
    {
      id: 'prop_photocopier',
      type: 'photocopier',
      x: 14,
      y: 10.5,
      width: 1.5,
      height: 1.2,
      name: 'Xerox Photocopier',
      interactive: true,
    },
    {
      id: 'prop_filing_cabinet',
      type: 'filing_cabinet',
      x: 21,
      y: 10.5,
      width: 1.2,
      height: 1.2,
    },

    // Kitchen & Breakroom
    {
      id: 'prop_vending_machine',
      type: 'vending_machine',
      x: 32,
      y: 3,
      width: 2,
      height: 2,
      name: 'Snack Vending Machine',
      interactive: true,
    },
    {
      id: 'prop_kitchen_counter',
      type: 'coffee_bar',
      x: 28,
      y: 3,
      width: 3,
      height: 1.2,
      name: 'Kitchen Sink & Coffee Pot',
      interactive: true,
    },
    {
      id: 'prop_trash_can',
      type: 'trash_can',
      x: 28,
      y: 7.5,
      width: 1,
      height: 1,
      name: 'Trash Can (Fire Hazard)',
      interactive: true,
    },

    // Annex
    {
      id: 'prop_toby_desk',
      type: 'desk_wood',
      x: 31,
      y: 13,
      width: 2,
      height: 1.4,
      name: "Toby's HR Desk",
    },
  ],
  waypoints: {
    michael_desk: { id: 'michael_desk', name: "Michael's Desk", x: 4.5, y: 5.5, facing: 'up', zone: 'michaels_office' },
    michael_door: { id: 'michael_door', name: "Michael's Doorway", x: 8, y: 5, facing: 'right', zone: 'michaels_office' },
    michael_window: { id: 'michael_window', name: "Michael's Window", x: 4.5, y: 2.5, facing: 'down', zone: 'michaels_office' },
    reception_desk: { id: 'reception_desk', name: 'Reception Front', x: 10.5, y: 8, facing: 'up', zone: 'reception' },
    pam_seat: { id: 'pam_seat', name: "Pam's Chair", x: 10.8, y: 6.2, facing: 'down', zone: 'reception' },
    jim_desk: { id: 'jim_desk', name: "Jim's Desk", x: 11.5, y: 12.2, facing: 'down', zone: 'sales_bullpen' },
    dwight_desk: { id: 'dwight_desk', name: "Dwight's Desk", x: 11.5, y: 17.2, facing: 'up', zone: 'sales_bullpen' },
    stanley_desk: { id: 'stanley_desk', name: "Stanley's Desk", x: 16.5, y: 12.2, facing: 'down', zone: 'sales_bullpen' },
    angela_desk: { id: 'angela_desk', name: "Angela's Desk", x: 23.5, y: 12.2, facing: 'down', zone: 'accounting' },
    kevin_desk: { id: 'kevin_desk', name: "Kevin's Desk", x: 23.5, y: 17.2, facing: 'up', zone: 'accounting' },
    bullpen_center: { id: 'bullpen_center', name: 'Bullpen Center Walkway', x: 14, y: 14.5, facing: 'down', zone: 'sales_bullpen' },
    water_cooler: { id: 'water_cooler', name: 'Water Cooler Spot', x: 8, y: 14.5, facing: 'up', zone: 'reception' },
    photocopier: { id: 'photocopier', name: 'Photocopier Area', x: 14, y: 12, facing: 'up', zone: 'sales_bullpen' },
    conference_table_head: { id: 'conference_table_head', name: 'Conference Head (Michael)', x: 16, y: 5.5, facing: 'right', zone: 'conference_room' },
    conference_table_mid: { id: 'conference_table_mid', name: 'Conference Center', x: 20, y: 5.5, facing: 'down', zone: 'conference_room' },
    conference_door: { id: 'conference_door', name: 'Conference Door', x: 19.5, y: 9.5, facing: 'up', zone: 'conference_room' },
    vending_machine: { id: 'vending_machine', name: 'Vending Machine', x: 32, y: 5.5, facing: 'up', zone: 'breakroom' },
    kitchen_counter: { id: 'kitchen_counter', name: 'Kitchen Counter', x: 28, y: 5, facing: 'up', zone: 'breakroom' },
    trash_can: { id: 'trash_can', name: 'Trash Can (Safety Drill)', x: 28, y: 8.5, facing: 'up', zone: 'breakroom' },
    main_entrance: { id: 'main_entrance', name: 'Front Office Entrance', x: 6, y: 19, facing: 'up', zone: 'reception' },
    annex_toby: { id: 'annex_toby', name: "Toby's Annex Corner", x: 31, y: 14.5, facing: 'down', zone: 'annex' },
    phyllis_desk: { id: 'phyllis_desk', name: "Phyllis's Desk", x: 16.5, y: 17.2, facing: 'up', zone: 'sales_bullpen' },
    ryan_desk: { id: 'ryan_desk', name: "Ryan's Desk", x: 10.5, y: 14.5, facing: 'right', zone: 'sales_bullpen' },
    annex_kelly: { id: 'annex_kelly', name: "Kelly's Desk", x: 29.5, y: 16.5, facing: 'left', zone: 'annex' },
    oscar_desk: { id: 'oscar_desk', name: "Oscar's Desk", x: 25.5, y: 12.2, facing: 'down', zone: 'accounting' },
    creed_desk: { id: 'creed_desk', name: "Creed's Desk", x: 20.5, y: 17.2, facing: 'up', zone: 'sales_bullpen' },
    meredith_desk: { id: 'meredith_desk', name: "Meredith's Desk", x: 20.5, y: 12.2, facing: 'down', zone: 'sales_bullpen' },
  },
  spawnPoints: {
    michael: { id: 'michael', name: 'Michael Spawn', x: 4.5, y: 5.5, facing: 'down' },
    dwight: { id: 'dwight', name: 'Dwight Spawn', x: 11.5, y: 17.2, facing: 'up' },
    jim: { id: 'jim', name: 'Jim Spawn', x: 11.5, y: 12.2, facing: 'down' },
    pam: { id: 'pam', name: 'Pam Spawn', x: 10.8, y: 6.2, facing: 'down' },
    angela: { id: 'angela', name: 'Angela Spawn', x: 23.5, y: 12.2, facing: 'down' },
    kevin: { id: 'kevin', name: 'Kevin Spawn', x: 23.5, y: 17.2, facing: 'up' },
    stanley: { id: 'stanley', name: 'Stanley Spawn', x: 16.5, y: 12.2, facing: 'down' },
    toby: { id: 'toby', name: 'Toby Spawn', x: 31, y: 14.5, facing: 'down' },
    phyllis: { id: 'phyllis', name: 'Phyllis Spawn', x: 16.5, y: 17.2, facing: 'up' },
    ryan: { id: 'ryan', name: 'Ryan Spawn', x: 10.5, y: 14.5, facing: 'right' },
    kelly: { id: 'kelly', name: 'Kelly Spawn', x: 29.5, y: 16.5, facing: 'left' },
    oscar: { id: 'oscar', name: 'Oscar Spawn', x: 25.5, y: 12.2, facing: 'down' },
    creed: { id: 'creed', name: 'Creed Spawn', x: 20.5, y: 17.2, facing: 'up' },
    meredith: { id: 'meredith', name: 'Meredith Spawn', x: 20.5, y: 12.2, facing: 'down' },
  },
};
