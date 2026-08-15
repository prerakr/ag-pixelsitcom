import { SettingDefinition } from '../../types/environment';

export const HACKER_HOSTEL: SettingDefinition = {
  id: 'hacker_hostel',
  name: 'Pied Piper Hacker Hostel',
  showTitle: 'Silicon Valley',
  gridWidth: 32,
  gridHeight: 20,
  tileSize: 32,
  backgroundColor: '#1a202c',
  defaultCamera: {
    x: 512,
    y: 320,
    zoom: 1.2,
  },
  zones: [
    { id: 'living_room', name: 'Dev Living Room', x: 2, y: 2, w: 16, h: 10, color: '#fed7aa' },
    { id: 'server_room', name: 'Server Garage', x: 19, y: 2, w: 11, h: 8, color: '#bfdbfe' },
    { id: 'kitchen', name: 'Hostel Kitchen Island', x: 2, y: 13, w: 14, h: 6, color: '#fbcfe8' },
    { id: 'erlich_backyard', name: 'Aviato Patio', x: 18, y: 11, w: 12, h: 8, color: '#bbf7d0' },
  ],
  tiles: (() => {
    const tiles: { [key: string]: any } = {};
    const W = 32;
    const H = 20;
    for (let x = 0; x < W; x++) {
      for (let y = 0; y < H; y++) {
        if (x === 0 || x === W - 1 || y === 0 || y === H - 1) {
          tiles[`${x},${y}`] = 'wall_office_side';
        } else if (y === 1) {
          tiles[`${x},${y}`] = 'wall_office_top';
        } else if (x >= 19 && x <= 29 && y >= 2 && y <= 9) {
          tiles[`${x},${y}`] = 'floor_tile_kitchen'; // Server room tile
        } else {
          tiles[`${x},${y}`] = 'floor_wood'; // Hardwood living room
        }
      }
    }
    return tiles;
  })(),
  props: [
    {
      id: 'prop_hostel_couch',
      type: 'sofa_leather',
      x: 6,
      y: 6,
      width: 4,
      height: 1.5,
      name: 'Pied Piper Coding Couch',
      interactive: true,
    },
    {
      id: 'prop_hostel_whiteboard',
      type: 'whiteboard',
      x: 5,
      y: 2,
      width: 5,
      height: 0.8,
      name: 'Scrum Architecture Whiteboard',
    },
    {
      id: 'prop_server_1',
      type: 'server_rack',
      x: 21,
      y: 3,
      width: 2,
      height: 2,
      name: 'Anton Server Rack #1',
    },
    {
      id: 'prop_server_2',
      type: 'server_rack',
      x: 25,
      y: 3,
      width: 2,
      height: 2,
      name: 'Anton Server Rack #2',
    },
    {
      id: 'prop_hostel_kitchen',
      type: 'coffee_bar',
      x: 4,
      y: 14,
      width: 3,
      height: 1.5,
      name: 'Kitchen & Red Bull Station',
    },
  ],
  waypoints: {
    couch_center: { id: 'couch_center', name: 'Hostel Couch', x: 8, y: 8, facing: 'up', zone: 'living_room' },
    whiteboard: { id: 'whiteboard', name: 'Scrum Board', x: 7, y: 3.5, facing: 'up', zone: 'living_room' },
    server_rack: { id: 'server_rack', name: 'Anton Server Front', x: 23, y: 6, facing: 'up', zone: 'server_room' },
    kitchen: { id: 'kitchen', name: 'Kitchen Counter', x: 5, y: 16, facing: 'up', zone: 'kitchen' },
    doorway: { id: 'doorway', name: 'Front Entrance', x: 15, y: 18, facing: 'up', zone: 'living_room' },
  },
  spawnPoints: {
    richard: { id: 'richard', name: 'Richard Spawn', x: 7, y: 8, facing: 'up' },
    gilfoyle: { id: 'gilfoyle', name: 'Gilfoyle Spawn', x: 23, y: 6, facing: 'up' },
    dinesh: { id: 'dinesh', name: 'Dinesh Spawn', x: 9, y: 8, facing: 'up' },
    erlich: { id: 'erlich', name: 'Erlich Spawn', x: 5, y: 16, facing: 'down' },
  },
};
