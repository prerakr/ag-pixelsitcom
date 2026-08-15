import { SettingDefinition } from '../../types/environment';

export const HACKER_HOSTEL: SettingDefinition = {
  id: 'hacker_hostel',
  name: 'Pied Piper Hacker Hostel',
  showTitle: 'Silicon Valley',
  description: "Erlich Bachman's Palo Alto incubator where Richard, Gilfoyle, Dinesh, and Jared built Pied Piper.",
  gridWidth: 32,
  gridHeight: 22,
  tileSize: 32,
  backgroundColor: '#0f172a',
  defaultCamera: {
    x: 512,
    y: 350,
    zoom: 1.15,
  },
  zones: [
    { id: 'coding_area', name: 'Dev Workstations', x: 4, y: 2, w: 14, h: 6, color: '#bfdbfe' },
    { id: 'living_room', name: 'Incubator Lounge', x: 6, y: 8, w: 12, h: 8, color: '#fed7aa' },
    { id: 'server_garage', name: 'Anton Server Garage', x: 20, y: 2, w: 10, h: 8, color: '#e2e8f0' },
    { id: 'kitchen', name: 'SeeFood Kitchen', x: 19, y: 10, w: 11, h: 8, color: '#fbcfe8' },
    { id: 'patio', name: 'Palo Alto Backyard Patio', x: 1, y: 12, w: 5, h: 8, color: '#bbf7d0' },
    { id: 'entrance', name: 'Hostel Front Doorway', x: 2, y: 15, w: 5, h: 5, color: '#fef08a' },
  ],
  tiles: {},
  props: [
    // 1. Coding Desks (Richard, Gilfoyle, Dinesh)
    {
      id: 'prop_richard_desk',
      type: 'desk_modern',
      x: 5.5,
      y: 3.5,
      width: 3.2,
      height: 1.8,
      name: "Richard's Dev Desk",
      interactive: true,
      zIndexOffset: -10,
    },
    {
      id: 'prop_gilfoyle_desk',
      type: 'desk_modern',
      x: 9.8,
      y: 3.5,
      width: 3.2,
      height: 1.8,
      name: "Gilfoyle's Systems Station",
      interactive: true,
      zIndexOffset: -10,
    },
    {
      id: 'prop_dinesh_desk',
      type: 'desk_modern',
      x: 14.2,
      y: 3.5,
      width: 3.2,
      height: 1.8,
      name: "Dinesh's Java Station",
      interactive: true,
      zIndexOffset: -10,
    },

    // 2. Erlich's Living Room Couch & Always Blue Table
    {
      id: 'prop_erlich_couch',
      type: 'sofa_leather',
      x: 7.5,
      y: 9.2,
      width: 5.2,
      height: 2.2,
      name: "Erlich's Kimono Couch",
      interactive: true,
      zIndexOffset: -10,
    },
    {
      id: 'prop_living_table',
      type: 'desk_wood',
      x: 8.5,
      y: 12.2,
      width: 3.2,
      height: 1.4,
      name: 'Always Blue Coffee Table',
      interactive: true,
    },
    {
      id: 'prop_aviato_poster',
      type: 'neon_sign',
      x: 1,
      y: 3.5,
      width: 3,
      height: 1.5,
      name: 'AVIATO Founder Banner',
      interactive: true,
    },

    // 3. Anton Server Rack Garage
    {
      id: 'prop_anton_rack',
      type: 'server_rack',
      x: 23,
      y: 3.2,
      width: 3.2,
      height: 2.8,
      name: 'Anton Server Rack (Blinking LEDs)',
      interactive: true,
    },
    {
      id: 'prop_scrum_board',
      type: 'whiteboard',
      x: 6,
      y: 1.5,
      width: 6.5,
      height: 1.2,
      name: 'Scrum Sprint Burndown Chart',
      interactive: true,
    },

    // 4. Kitchen Island & Smart Fridge
    {
      id: 'prop_kitchen_counter',
      type: 'coffee_bar',
      x: 20.5,
      y: 12,
      width: 6.5,
      height: 2.2,
      name: "Jian-Yang's SeeFood Kitchen Island",
      interactive: true,
    },
    {
      id: 'prop_smart_fridge',
      type: 'vending_machine',
      x: 27.5,
      y: 11,
      width: 1.8,
      height: 2.5,
      name: "Gilfoyle's Hacked Smart Fridge",
      interactive: true,
    },

    // 5. Backyard Patio Table & Succulents
    {
      id: 'prop_palapa_table',
      type: 'desk_wood',
      x: 2,
      y: 13.5,
      width: 2.5,
      height: 1.6,
      name: 'Patio Strategy Table',
      interactive: true,
    },
    {
      id: 'prop_succulent',
      type: 'potted_plant',
      x: 1,
      y: 12,
      name: 'California Succulent',
    },
  ],
  waypoints: {
    richard_desk: { id: 'richard_desk', name: "Richard's Desk", x: 7.1, y: 5.6, facing: 'up', zone: 'coding_area' },
    gilfoyle_desk: { id: 'gilfoyle_desk', name: "Gilfoyle's Station", x: 11.4, y: 5.6, facing: 'up', zone: 'coding_area' },
    dinesh_desk: { id: 'dinesh_desk', name: "Dinesh's Station", x: 15.8, y: 5.6, facing: 'up', zone: 'coding_area' },
    erlich_sofa: { id: 'erlich_sofa', name: "Erlich's Sofa", x: 10.1, y: 10.2, facing: 'down', zone: 'living_room' },
    jared_table: { id: 'jared_table', name: "Jared's Chair", x: 13.8, y: 10.2, facing: 'left', zone: 'living_room' },
    living_room_center: { id: 'living_room_center', name: 'Living Room Center', x: 10.1, y: 14.2, facing: 'up', zone: 'living_room' },
    server_garage: { id: 'server_garage', name: 'Anton Server Garage', x: 24.5, y: 6.5, facing: 'up', zone: 'server_garage' },
    kitchen_counter: { id: 'kitchen_counter', name: 'Kitchen Island (Jian-Yang)', x: 23.5, y: 14.5, facing: 'up', zone: 'kitchen' },
    palapa_table: { id: 'palapa_table', name: 'Patio Table (Gavin Belson)', x: 3.2, y: 14.5, facing: 'down', zone: 'patio' },
    hostel_entrance: { id: 'hostel_entrance', name: 'Hostel Front Door', x: 3.5, y: 17, facing: 'up', zone: 'entrance' },
  },
  spawnPoints: {
    richard: { id: 'richard', name: 'Richard Spawn', x: 7.1, y: 5.6, facing: 'up' },
    gilfoyle: { id: 'gilfoyle', name: 'Gilfoyle Spawn', x: 11.4, y: 5.6, facing: 'up' },
    dinesh: { id: 'dinesh', name: 'Dinesh Spawn', x: 15.8, y: 5.6, facing: 'up' },
    erlich: { id: 'erlich', name: 'Erlich Spawn', x: 10.1, y: 10.2, facing: 'down' },
    jared: { id: 'jared', name: 'Jared Spawn', x: 13.8, y: 10.2, facing: 'left' },
    jianyang: { id: 'jianyang', name: 'Jian-Yang Spawn', x: 23.5, y: 14.5, facing: 'up' },
    bighead: { id: 'bighead', name: 'Big Head Spawn', x: 10.1, y: 14.2, facing: 'up' },
    gavin: { id: 'gavin', name: 'Gavin Belson Spawn', x: 3.2, y: 14.5, facing: 'down' },
    monica_hall: { id: 'monica_hall', name: 'Monica Hall Spawn', x: 10.1, y: 14.2, facing: 'down' },
    laurie: { id: 'laurie', name: 'Laurie Bream Spawn', x: 24.5, y: 6.5, facing: 'up' },
  },
};

// Generate Silicon Valley living room & server room tile layout
for (let x = 0; x < HACKER_HOSTEL.gridWidth; x++) {
  for (let y = 0; y < HACKER_HOSTEL.gridHeight; y++) {
    if (y === 0 || y === 1) {
      HACKER_HOSTEL.tiles[`${x},${y}`] = 'wall_office_top';
    } else if (x === 0 || x === HACKER_HOSTEL.gridWidth - 1) {
      HACKER_HOSTEL.tiles[`${x},${y}`] = 'wall_office_side';
    } else if (x >= 20 && y >= 2 && y <= 9) {
      HACKER_HOSTEL.tiles[`${x},${y}`] = 'floor_tile_kitchen'; // Server Garage
    } else if (x >= 19 && y >= 11) {
      HACKER_HOSTEL.tiles[`${x},${y}`] = 'floor_tile_kitchen'; // Kitchen
    } else {
      HACKER_HOSTEL.tiles[`${x},${y}`] = 'floor_wood';
    }
  }
}
