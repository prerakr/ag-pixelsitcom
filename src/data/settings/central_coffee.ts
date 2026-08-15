import { SettingDefinition } from '../../types/environment';

export const CENTRAL_COFFEE: SettingDefinition = {
  id: 'central_coffee',
  name: 'Central Perk Coffeehouse',
  showTitle: 'Friends',
  description: 'The Greenwich Village coffeehouse where the six friends drink oversized cappuccinos on the iconic orange sofa.',
  gridWidth: 32,
  gridHeight: 22,
  tileSize: 32,
  backgroundColor: '#1c1008',
  defaultCamera: {
    x: 500,
    y: 350,
    zoom: 1.15,
  },
  zones: [
    { id: 'couch_circle', name: 'Main Couch Lounge', x: 8, y: 8, w: 14, h: 8, color: '#fed7aa' },
    { id: 'coffee_bar', name: 'Gunther Espresso Counter', x: 2, y: 2, w: 10, h: 6, color: '#fef08a' },
    { id: 'stage', name: 'Phoebe Acoustic Corner', x: 21, y: 2, w: 9, h: 6, color: '#ddd6fe' },
    { id: 'street_seating', name: 'Street Window Tables', x: 2, y: 12, w: 6, h: 8, color: '#bbf7d0' },
    { id: 'entrance', name: 'Greenwich Village Entrance', x: 12, y: 16, w: 8, h: 5, color: '#e2e8f0' },
  ],
  tiles: {},
  props: [
    // 1. Ornate Persian Rug beneath couch circle (rendered at lowest floor layer)
    {
      id: 'prop_central_rug',
      type: 'rug',
      x: 8.5,
      y: 8.5,
      width: 13,
      height: 7,
      name: 'Central Perk Persian Rug',
      zIndexOffset: -100,
    },

    // 2. The Iconic Orange Velvet Couch
    {
      id: 'prop_orange_couch',
      type: 'sofa_leather',
      x: 11.5,
      y: 9.2,
      width: 5.5,
      height: 2.4,
      name: 'The Iconic Orange Velvet Couch',
      interactive: true,
      zIndexOffset: -10,
    },
    {
      id: 'prop_coffee_table',
      type: 'desk_wood',
      x: 13,
      y: 12.2,
      width: 2.6,
      height: 1.4,
      name: 'Central Perk Coffee Table',
      interactive: true,
    },
    {
      id: 'prop_armchair_green',
      type: 'chair_office',
      x: 9.2,
      y: 10.8,
      width: 1.5,
      height: 1.5,
      name: "Monica's Green Velvet Armchair",
      interactive: true,
      zIndexOffset: -5,
    },
    {
      id: 'prop_armchair_gold',
      type: 'chair_office',
      x: 17.8,
      y: 10.8,
      width: 1.5,
      height: 1.5,
      name: "Joey's Gold Armchair",
      interactive: true,
      zIndexOffset: -5,
    },

    // 3. Gunther's Espresso Bar & Pastry Case
    {
      id: 'prop_espresso_counter',
      type: 'coffee_bar',
      x: 3.5,
      y: 3.5,
      width: 7.5,
      height: 2.2,
      name: 'Gunther Barista Counter & Pastry Display',
      interactive: true,
    },
    {
      id: 'prop_coffee_machine',
      type: 'coffee_maker',
      x: 4.5,
      y: 3,
      width: 1.4,
      height: 1.4,
      name: 'Shiny Italian Espresso Machine',
      interactive: true,
    },
    {
      id: 'prop_chalkboard_menu',
      type: 'whiteboard',
      x: 1,
      y: 3.5,
      width: 1.8,
      height: 2.5,
      name: 'Daily Specials Chalkboard',
      interactive: true,
    },

    // 4. Phoebe's Acoustic Guitar Stage & Mic Stand
    {
      id: 'prop_guitar_stage',
      type: 'desk_wood',
      x: 23,
      y: 3.5,
      width: 4.5,
      height: 2.2,
      name: "Phoebe's Smelly Cat Stage",
      interactive: true,
    },
    {
      id: 'prop_stage_plant',
      type: 'potted_plant',
      x: 22,
      y: 3.2,
      name: 'Stage Ficus',
    },
    {
      id: 'prop_corner_plant',
      type: 'potted_plant',
      x: 29.5,
      y: 3.2,
      name: 'Corner Palm',
    },

    // 5. Street Window Bistro Seating
    {
      id: 'prop_bistro_table_1',
      type: 'desk_wood',
      x: 3.5,
      y: 13.5,
      width: 2.2,
      height: 1.5,
      name: 'Window Bistro Table',
      interactive: true,
    },
    {
      id: 'prop_coat_rack',
      type: 'potted_plant',
      x: 11,
      y: 17.5,
      name: 'Wooden Coat Rack',
    },

    // 6. Central Perk Neon Street Sign
    {
      id: 'prop_perk_neon',
      type: 'neon_sign',
      x: 12.5,
      y: 1.2,
      width: 5,
      height: 1.2,
      name: 'CENTRAL PERK',
      interactive: true,
    },
  ],
  waypoints: {
    orange_couch_left: { id: 'orange_couch_left', name: 'Orange Couch (Ross)', x: 12.2, y: 10.2, facing: 'down', zone: 'couch_circle' },
    orange_couch_center: { id: 'orange_couch_center', name: 'Orange Couch (Rachel)', x: 14.2, y: 10.2, facing: 'down', zone: 'couch_circle' },
    orange_couch_right: { id: 'orange_couch_right', name: 'Orange Couch (Chandler)', x: 16.2, y: 10.2, facing: 'down', zone: 'couch_circle' },
    armchair_left: { id: 'armchair_left', name: "Monica's Armchair", x: 9.8, y: 11.2, facing: 'right', zone: 'couch_circle' },
    armchair_right: { id: 'armchair_right', name: "Joey's Armchair", x: 18.2, y: 11.2, facing: 'left', zone: 'couch_circle' },
    coffee_table_front: { id: 'coffee_table_front', name: 'Coffee Table Center', x: 14.2, y: 14.0, facing: 'up', zone: 'couch_circle' },
    coffee_counter: { id: 'coffee_counter', name: 'Gunther Barista Post', x: 7, y: 4.2, facing: 'down', zone: 'coffee_bar' },
    order_register: { id: 'order_register', name: 'Coffee Order Line', x: 7, y: 6.5, facing: 'up', zone: 'coffee_bar' },
    guitar_stage: { id: 'guitar_stage', name: 'Phoebe Performance Rug', x: 25, y: 5.2, facing: 'down', zone: 'stage' },
    stage_piano: { id: 'stage_piano', name: 'Mike Piano Post', x: 26.5, y: 5.2, facing: 'down', zone: 'stage' },
    street_table_left: { id: 'street_table_left', name: 'Window Bistro Seat (Janice)', x: 4.5, y: 14.5, facing: 'right', zone: 'street_seating' },
    perk_entrance: { id: 'perk_entrance', name: 'Central Perk Front Door', x: 14.2, y: 18, facing: 'up', zone: 'entrance' },
  },
  spawnPoints: {
    ross: { id: 'ross', name: 'Ross Spawn', x: 12.2, y: 10.2, facing: 'down' },
    rachel: { id: 'rachel', name: 'Rachel Spawn', x: 14.2, y: 10.2, facing: 'down' },
    chandler: { id: 'chandler', name: 'Chandler Spawn', x: 16.2, y: 10.2, facing: 'down' },
    monica: { id: 'monica', name: 'Monica Spawn', x: 9.8, y: 11.2, facing: 'right' },
    joey: { id: 'joey', name: 'Joey Spawn', x: 18.2, y: 11.2, facing: 'left' },
    phoebe: { id: 'phoebe', name: 'Phoebe Spawn', x: 25, y: 5.2, facing: 'down' },
    gunther: { id: 'gunther', name: 'Gunther Spawn', x: 7, y: 4.2, facing: 'down' },
    janice: { id: 'janice', name: 'Janice Spawn', x: 4.5, y: 14.5, facing: 'right' },
    mike: { id: 'mike', name: 'Mike Spawn', x: 26.5, y: 5.2, facing: 'down' },
  },
};

// Generate Central Perk brick walls & warm hardwood flooring
for (let x = 0; x < CENTRAL_COFFEE.gridWidth; x++) {
  for (let y = 0; y < CENTRAL_COFFEE.gridHeight; y++) {
    if (y === 0 || y === 1) {
      CENTRAL_COFFEE.tiles[`${x},${y}`] = 'wall_brick';
    } else if (x === 0 || x === CENTRAL_COFFEE.gridWidth - 1) {
      CENTRAL_COFFEE.tiles[`${x},${y}`] = 'wall_brick';
    } else if (x > 8 && x < 20 && y === 1) {
      CENTRAL_COFFEE.tiles[`${x},${y}`] = 'window_blinds'; // Street Window
    } else {
      CENTRAL_COFFEE.tiles[`${x},${y}`] = 'floor_wood';
    }
  }
}
