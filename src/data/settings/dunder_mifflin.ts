import { SettingDefinition } from '../../types/environment';

export const DUNDER_MIFFLIN_SCRANTON: SettingDefinition = {
  id: 'dunder_mifflin_scranton',
  name: 'Dunder Mifflin Scranton Branch',
  showTitle: 'The Office',
  gridWidth: 38,
  gridHeight: 24,
  tileSize: 32,
  backgroundColor: '#1a202c',
  defaultCamera: {
    x: 608, // Center of 38 * 32 = 1216px
    y: 384, // Center of 24 * 32 = 768px
    zoom: 1.15,
  },
  zones: [
    { id: 'michaels_office', name: "Michael's Office", x: 2, y: 2, w: 8, h: 7, color: '#fed7aa' },
    { id: 'reception', name: 'Reception & Entrance', x: 2, y: 9, w: 10, h: 7, color: '#fef08a' },
    { id: 'conference_room', name: 'Conference Room', x: 10, y: 2, w: 14, h: 7, color: '#bfdbfe' },
    { id: 'breakroom', name: 'Kitchen & Breakroom', x: 25, y: 2, w: 11, h: 7, color: '#fbcfe8' },
    { id: 'sales_bullpen', name: 'Sales Bullpen', x: 12, y: 9, w: 15, h: 9, color: '#bbf7d0' },
    { id: 'accounting', name: 'Accounting Nook', x: 2, y: 16, w: 10, h: 7, color: '#ddd6fe' },
    { id: 'annex', name: 'The Annex (Toby & Kelly)', x: 27, y: 9, w: 9, h: 14, color: '#e2e8f0' },
  ],
  tiles: (() => {
    const tiles: { [key: string]: any } = {};
    const W = 38;
    const H = 24;

    for (let x = 0; x < W; x++) {
      for (let y = 0; y < H; y++) {
        // 1. Outer boundary walls
        if (x === 0 || x === W - 1 || y === 0 || y === H - 1) {
          tiles[`${x},${y}`] = 'wall_office_side';
        } else if (y === 1) {
          tiles[`${x},${y}`] = 'wall_office_top';
        }
        // 2. Michael's Office Partition walls (Glass)
        else if (x === 9 && y >= 2 && y <= 8) {
          tiles[`${x},${y}`] = y === 5 ? 'door_glass' : 'wall_glass';
        } else if (y === 8 && x >= 2 && x <= 9) {
          tiles[`${x},${y}`] = 'wall_glass';
        }
        // 3. Conference Room Partition walls (Glass with blinds)
        else if (x === 10 && y >= 2 && y <= 8) {
          tiles[`${x},${y}`] = 'wall_glass';
        } else if (x === 24 && y >= 2 && y <= 8) {
          tiles[`${x},${y}`] = 'wall_glass';
        } else if (y === 8 && x >= 10 && x <= 24) {
          tiles[`${x},${y}`] = x === 17 || x === 18 ? 'door_glass' : 'wall_glass';
        }
        // 4. Kitchen / Breakroom Partition walls (Drywall)
        else if (x === 25 && y >= 2 && y <= 8) {
          tiles[`${x},${y}`] = y === 5 ? 'door_wood' : 'wall_office_side';
        } else if (y === 8 && x >= 25 && x <= 36) {
          tiles[`${x},${y}`] = 'wall_office_top';
        }
        // 5. Flooring Types
        else if (x >= 25 && x <= 36 && y >= 2 && y <= 8) {
          tiles[`${x},${y}`] = 'floor_tile_kitchen';
        } else if (x >= 10 && x <= 24 && y >= 2 && y <= 8) {
          tiles[`${x},${y}`] = 'floor_carpet_blue';
        } else if (x >= 2 && x <= 9 && y >= 2 && y <= 8) {
          tiles[`${x},${y}`] = 'floor_wood';
        } else {
          tiles[`${x},${y}`] = 'floor_carpet_grey';
        }

        // Office Exterior Windows
        if (y === 1) {
          if (
            (x >= 4 && x <= 7) ||
            (x >= 13 && x <= 21) ||
            (x >= 28 && x <= 33)
          ) {
            tiles[`${x},${y}`] = 'window_blinds';
          }
        }
      }
    }
    return tiles;
  })(),
  props: [
    // ==========================================
    // 1. MICHAEL'S OFFICE (x:2-9, y:2-8)
    //    Available floor: 7 tiles wide × 6 tiles tall
    // ==========================================
    {
      id: 'prop_michael_desk',
      type: 'desk_michael',
      x: 4.0,        // centered in office
      y: 3.5,
      width: 2.8,     // source 375x265, ratio 1.42:1
      height: 2.0,
      name: "Michael's Executive Desk",
      interactive: true,
    },
    {
      id: 'prop_michael_plant',
      type: 'potted_plant',
      x: 2.3,
      y: 2.3,
      width: 1.0,     // source 145x210, ratio 0.69:1
      height: 1.4,
      name: 'Ficus Plant',
    },
    {
      id: 'prop_michael_sofa',
      type: 'sofa_leather',
      x: 2.5,
      y: 6.0,
      width: 3.0,     // source 575x225, ratio 2.56:1
      height: 1.2,
      name: 'Office Leather Couch',
    },

    // ==========================================
    // 2. RECEPTION AREA (x:2-11, y:9-15)
    //    Available floor: 10 tiles wide × 7 tiles tall
    // ==========================================
    {
      id: 'prop_reception_desk',
      type: 'desk_reception',
      x: 7.0,
      y: 10.0,
      width: 3.0,     // source 430x245, ratio 1.76:1
      height: 1.7,
      name: "Pam's Reception Desk",
      interactive: true,
    },
    {
      id: 'prop_reception_sofa',
      type: 'sofa_leather',
      x: 3.0,
      y: 10.5,
      width: 3.0,     // source 575x225, ratio 2.56:1
      height: 1.2,
      name: 'Reception Waiting Couch',
    },
    {
      id: 'prop_reception_plant',
      type: 'potted_plant',
      x: 2.3,
      y: 14.0,
      width: 1.0,
      height: 1.4,
      name: 'Reception Fern',
    },

    // ==========================================
    // 3. CONFERENCE ROOM (x:10-24, y:2-8)
    //    Available floor: 14 tiles wide × 6 tiles tall
    // ==========================================
    {
      id: 'prop_conf_table',
      type: 'conference_table',
      x: 13.0,
      y: 3.5,
      width: 6.0,     // source 845x330, ratio 2.56:1
      height: 2.4,
      name: 'Conference Room Table',
      interactive: true,
    },
    {
      id: 'prop_conf_whiteboard',
      type: 'whiteboard',
      x: 11.0,
      y: 2.2,
      width: 2.0,
      height: 0.6,
      name: 'Presentation Whiteboard',
    },

    // ==========================================
    // 4. SALES BULLPEN (x:12-26, y:9-17)
    //    Available floor: 15 tiles wide × 9 tiles tall
    //    3 desk quads spaced evenly across the width
    // ==========================================

    // Bullpen amenities along north wall (y ~9.2)
    {
      id: 'prop_photocopier',
      type: 'photocopier',
      x: 15.0,
      y: 9.2,
      width: 1.4,     // source 220x215, ratio 1.02:1
      height: 1.4,
      name: 'Xerox Photocopier',
      interactive: true,
    },
    {
      id: 'prop_filing_cabinet',
      type: 'filing_cabinet',
      x: 19.5,
      y: 9.0,
      width: 1.0,     // source 140x265, ratio 0.53:1
      height: 1.9,
      name: 'Filing Cabinet',
    },
    {
      id: 'prop_water_cooler',
      type: 'water_cooler',
      x: 22.0,
      y: 9.0,
      width: 1.0,     // source 135x235, ratio 0.57:1
      height: 1.7,
      name: 'Bullpen Water Cooler',
      interactive: true,
    },

    // Quad 1: Jim & Dwight (facing each other)
    {
      id: 'prop_jim_desk',
      type: 'desk_wood',
      x: 13.0,
      y: 11.0,
      width: 2.0,     // source 255x275, ratio 0.93:1
      height: 2.2,
      name: "Jim's Desk",
      interactive: true,
    },
    {
      id: 'prop_dwight_desk',
      type: 'jello_stapler',
      x: 13.0,
      y: 13.5,
      width: 2.0,     // source 250x275, ratio 0.91:1
      height: 2.2,
      name: "Dwight's Desk (Stapler in Jello)",
      interactive: true,
    },

    // Quad 2: Stanley & Phyllis
    {
      id: 'prop_stanley_desk',
      type: 'desk_wood',
      x: 18.0,
      y: 11.0,
      width: 2.0,
      height: 2.2,
      name: "Stanley's Desk",
      interactive: true,
    },
    {
      id: 'prop_phyllis_desk',
      type: 'desk_wood',
      x: 18.0,
      y: 13.5,
      width: 2.0,
      height: 2.2,
      name: "Phyllis's Desk",
      interactive: true,
    },

    // Quad 3: Creed & Meredith
    {
      id: 'prop_meredith_desk',
      type: 'desk_wood',
      x: 23.0,
      y: 11.0,
      width: 2.0,
      height: 2.2,
      name: "Meredith's Desk",
    },
    {
      id: 'prop_creed_desk',
      type: 'desk_wood',
      x: 23.0,
      y: 13.5,
      width: 2.0,
      height: 2.2,
      name: "Creed's Desk",
    },

    // ==========================================
    // 5. ACCOUNTING NOOK (x:2-11, y:16-22)
    // ==========================================
    {
      id: 'prop_angela_desk',
      type: 'desk_wood',
      x: 3.5,
      y: 17.0,
      width: 2.0,
      height: 2.2,
      name: "Angela's Desk",
      interactive: true,
    },
    {
      id: 'prop_kevin_desk',
      type: 'desk_wood',
      x: 3.5,
      y: 19.5,
      width: 2.0,
      height: 2.2,
      name: "Kevin's Desk",
      interactive: true,
    },
    {
      id: 'prop_oscar_desk',
      type: 'desk_wood',
      x: 7.0,
      y: 18.0,
      width: 2.0,
      height: 2.2,
      name: "Oscar's Desk",
      interactive: true,
    },

    // ==========================================
    // 6. KITCHEN & BREAKROOM (x:25-36, y:2-8)
    //    Available floor: 11 tiles wide × 6 tiles tall
    // ==========================================
    {
      id: 'prop_kitchen_counter',
      type: 'coffee_bar',
      x: 26.0,
      y: 2.2,
      width: 2.2,     // source 265x230, ratio 1.15:1
      height: 1.9,
      name: 'Breakroom Sink & Coffee Station',
      interactive: true,
    },
    {
      id: 'prop_vending_snack',
      type: 'vending_machine',
      x: 31.5,
      y: 2.2,
      width: 1.2,     // source 195x320, ratio 0.61:1
      height: 2.0,
      name: 'Snack Vending Machine',
      interactive: true,
    },
    {
      id: 'prop_vending_soda',
      type: 'vending_machine',
      x: 33.5,
      y: 2.2,
      width: 1.2,
      height: 2.0,
      name: 'Soda Vending Machine',
      interactive: true,
    },
    {
      id: 'prop_breakroom_table',
      type: 'high_top_table',
      x: 28.5,
      y: 4.5,
      width: 2.0,     // source 305x280, ratio 1.09:1
      height: 1.8,
      name: 'Breakroom Lunch Table',
    },
    {
      id: 'prop_trash_can',
      type: 'trash_can',
      x: 26.2,
      y: 6.8,
      width: 0.7,
      height: 0.7,
      name: 'Trash Can (Fire Hazard)',
      interactive: true,
    },

    // ==========================================
    // 7. THE ANNEX (x:27-36, y:9-22)
    // ==========================================
    {
      id: 'prop_toby_desk',
      type: 'desk_wood',
      x: 29.0,
      y: 12.0,
      width: 2.0,
      height: 2.2,
      name: "Toby's HR Desk",
    },
    {
      id: 'prop_kelly_desk',
      type: 'desk_wood',
      x: 33.0,
      y: 12.0,
      width: 2.0,
      height: 2.2,
      name: "Kelly's Desk",
    },
    {
      id: 'prop_ryan_desk',
      type: 'desk_wood',
      x: 29.0,
      y: 17.0,
      width: 2.0,
      height: 2.2,
      name: "Ryan's Desk",
    },
  ],

  waypoints: {
    // Michael's Office
    michael_desk: { id: 'michael_desk', name: "Michael's Desk", x: 5.4, y: 4.5, facing: 'down', zone: 'michaels_office' },
    michael_door: { id: 'michael_door', name: "Michael's Doorway", x: 8.8, y: 5.0, facing: 'right', zone: 'michaels_office' },
    michael_window: { id: 'michael_window', name: "Michael's Window", x: 5.4, y: 2.6, facing: 'down', zone: 'michaels_office' },

    // Reception
    reception_desk: { id: 'reception_desk', name: 'Reception Front', x: 8.5, y: 12.0, facing: 'up', zone: 'reception' },
    pam_seat: { id: 'pam_seat', name: "Pam's Chair", x: 8.5, y: 9.8, facing: 'down', zone: 'reception' },
    main_entrance: { id: 'main_entrance', name: 'Office Main Entrance', x: 4.5, y: 14.5, facing: 'up', zone: 'reception' },

    // Sales Bullpen
    jim_desk: { id: 'jim_desk', name: "Jim's Desk", x: 14.0, y: 10.5, facing: 'down', zone: 'sales_bullpen' },
    dwight_desk: { id: 'dwight_desk', name: "Dwight's Desk", x: 14.0, y: 16.0, facing: 'up', zone: 'sales_bullpen' },
    stanley_desk: { id: 'stanley_desk', name: "Stanley's Desk", x: 19.0, y: 10.5, facing: 'down', zone: 'sales_bullpen' },
    phyllis_desk: { id: 'phyllis_desk', name: "Phyllis's Desk", x: 19.0, y: 16.0, facing: 'up', zone: 'sales_bullpen' },
    meredith_desk: { id: 'meredith_desk', name: "Meredith's Desk", x: 24.0, y: 10.5, facing: 'down', zone: 'sales_bullpen' },
    creed_desk: { id: 'creed_desk', name: "Creed's Desk", x: 24.0, y: 16.0, facing: 'up', zone: 'sales_bullpen' },
    bullpen_center: { id: 'bullpen_center', name: 'Bullpen Center Walkway', x: 16.5, y: 12.5, facing: 'down', zone: 'sales_bullpen' },
    water_cooler: { id: 'water_cooler', name: 'Water Cooler Spot', x: 22.5, y: 10.9, facing: 'up', zone: 'sales_bullpen' },
    photocopier: { id: 'photocopier', name: 'Photocopier Area', x: 15.7, y: 10.8, facing: 'up', zone: 'sales_bullpen' },

    // Accounting
    angela_desk: { id: 'angela_desk', name: "Angela's Desk", x: 4.5, y: 16.5, facing: 'down', zone: 'accounting' },
    kevin_desk: { id: 'kevin_desk', name: "Kevin's Desk", x: 4.5, y: 22.0, facing: 'up', zone: 'accounting' },
    oscar_desk: { id: 'oscar_desk', name: "Oscar's Desk", x: 8.0, y: 20.5, facing: 'left', zone: 'accounting' },

    // Conference Room
    conference_table_head: { id: 'conference_table_head', name: 'Conference Head (Michael)', x: 13.5, y: 4.7, facing: 'right', zone: 'conference_room' },
    conference_table_mid: { id: 'conference_table_mid', name: 'Conference Center', x: 16.0, y: 4.7, facing: 'down', zone: 'conference_room' },
    conference_door: { id: 'conference_door', name: 'Conference Doorway', x: 17.5, y: 8.5, facing: 'up', zone: 'conference_room' },

    // Breakroom
    vending_machine: { id: 'vending_machine', name: 'Vending Machines', x: 32.5, y: 4.5, facing: 'up', zone: 'breakroom' },
    kitchen_counter: { id: 'kitchen_counter', name: 'Kitchen Counter', x: 27.0, y: 4.5, facing: 'up', zone: 'breakroom' },
    trash_can: { id: 'trash_can', name: 'Trash Can (Safety Drill)', x: 26.6, y: 7.5, facing: 'up', zone: 'breakroom' },

    // Annex
    annex_toby: { id: 'annex_toby', name: "Toby's Annex Desk", x: 30.0, y: 14.5, facing: 'down', zone: 'annex' },
    annex_kelly: { id: 'annex_kelly', name: "Kelly's Annex Desk", x: 34.0, y: 14.5, facing: 'down', zone: 'annex' },
    ryan_desk: { id: 'ryan_desk', name: "Ryan's Closet Desk", x: 30.0, y: 19.5, facing: 'down', zone: 'annex' },
  },

  spawnPoints: {
    michael: { id: 'michael', name: 'Michael Spawn', x: 5.4, y: 4.5, facing: 'down' },
    dwight: { id: 'dwight', name: 'Dwight Spawn', x: 14.0, y: 16.0, facing: 'up' },
    jim: { id: 'jim', name: 'Jim Spawn', x: 14.0, y: 10.5, facing: 'down' },
    pam: { id: 'pam', name: 'Pam Spawn', x: 8.5, y: 9.8, facing: 'down' },
    angela: { id: 'angela', name: 'Angela Spawn', x: 4.5, y: 16.5, facing: 'down' },
    kevin: { id: 'kevin', name: 'Kevin Spawn', x: 4.5, y: 22.0, facing: 'up' },
    stanley: { id: 'stanley', name: 'Stanley Spawn', x: 19.0, y: 10.5, facing: 'down' },
    toby: { id: 'toby', name: 'Toby Spawn', x: 30.0, y: 14.5, facing: 'down' },
    phyllis: { id: 'phyllis', name: 'Phyllis Spawn', x: 19.0, y: 16.0, facing: 'up' },
    ryan: { id: 'ryan', name: 'Ryan Spawn', x: 30.0, y: 19.5, facing: 'down' },
    kelly: { id: 'kelly', name: 'Kelly Spawn', x: 34.0, y: 14.5, facing: 'down' },
    oscar: { id: 'oscar', name: 'Oscar Spawn', x: 8.0, y: 20.5, facing: 'left' },
    creed: { id: 'creed', name: 'Creed Spawn', x: 24.0, y: 16.0, facing: 'up' },
    meredith: { id: 'meredith', name: 'Meredith Spawn', x: 24.0, y: 10.5, facing: 'down' },
  },
};
