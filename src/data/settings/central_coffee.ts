import { SettingDefinition } from '../../types/environment';

export const CENTRAL_COFFEE: SettingDefinition = {
  id: 'central_coffee',
  name: 'Central Perk Coffeehouse',
  showTitle: 'Friends & Sitcoms',
  gridWidth: 30,
  gridHeight: 20,
  tileSize: 32,
  backgroundColor: '#2c1810',
  defaultCamera: {
    x: 480,
    y: 320,
    zoom: 1.25,
  },
  zones: [
    { id: 'main_couch', name: 'The Iconic Orange Couch Area', x: 8, y: 6, w: 14, h: 8, color: '#fed7aa' },
    { id: 'coffee_bar', name: 'Barista Counter', x: 2, y: 2, w: 12, h: 6, color: '#fef08a' },
    { id: 'stage', name: 'Acoustic Guitar Stage (Phoebe)', x: 22, y: 2, w: 7, h: 5, color: '#fbcfe8' },
  ],
  tiles: (() => {
    const tiles: { [key: string]: any } = {};
    const W = 30;
    const H = 20;
    for (let x = 0; x < W; x++) {
      for (let y = 0; y < H; y++) {
        if (x === 0 || x === W - 1 || y === 0 || y === H - 1) {
          tiles[`${x},${y}`] = 'wall_brick';
        } else if (y === 1) {
          tiles[`${x},${y}`] = 'wall_office_top';
        } else {
          tiles[`${x},${y}`] = 'floor_wood';
        }
      }
    }
    return tiles;
  })(),
  props: [
    {
      id: 'prop_coffee_couch',
      type: 'sofa_leather',
      x: 12,
      y: 9,
      width: 4,
      height: 2,
      name: 'The Orange Velvet Couch',
      interactive: true,
    },
    {
      id: 'prop_espresso_counter',
      type: 'coffee_bar',
      x: 4,
      y: 3,
      width: 5,
      height: 1.5,
      name: 'Espresso Bar & Pastry Display',
    },
  ],
  waypoints: {
    couch_center: { id: 'couch_center', name: 'Orange Couch', x: 14, y: 12, facing: 'up', zone: 'main_couch' },
    counter: { id: 'counter', name: 'Gunther Barista Counter', x: 6, y: 5.5, facing: 'up', zone: 'coffee_bar' },
    stage: { id: 'stage', name: 'Smelly Cat Stage', x: 24, y: 4, facing: 'down', zone: 'stage' },
  },
  spawnPoints: {
    ross: { id: 'ross', name: 'Ross Spawn', x: 13, y: 12, facing: 'up' },
    rachel: { id: 'rachel', name: 'Rachel Spawn', x: 15, y: 12, facing: 'up' },
    chandler: { id: 'chandler', name: 'Chandler Spawn', x: 11, y: 12, facing: 'up' },
    joey: { id: 'joey', name: 'Joey Spawn', x: 6, y: 5.5, facing: 'up' },
  },
};
