import { SpriteAtlasManifest } from '../../types/sprite';

export const SPRITE_ATLAS_MANIFEST: SpriteAtlasManifest = {
  images: {
    office_characters: {
      url: '/sprites/office_characters.jpg',
      chromaKey: '#00ff00',
      tolerance: 55,
    },
    office_props_topdown: {
      url: '/sprites/office_props_topdown.jpg',
      chromaKey: '#ff00ff',
      tolerance: 55,
    },
    bullpen_desks_topdown: {
      url: '/sprites/bullpen_desks_topdown.jpg',
      chromaKey: '#ff00ff',
      tolerance: 55,
    },
    office_tiles: {
      url: '/sprites/office_tiles.jpg',
      chromaKey: '#00ff00',
      tolerance: 55,
    },
    friends_props: {
      url: '/sprites/friends_props.jpg',
      chromaKey: '#ff00ff',
      tolerance: 55,
    },
    michael_portrait: {
      url: '/sprites/michael_portrait.jpg',
    },
    dwight_portrait: {
      url: '/sprites/dwight_portrait.jpg',
    },
    jim_portrait: {
      url: '/sprites/jim_portrait.jpg',
    },
    pam_portrait: {
      url: '/sprites/pam_portrait.jpg',
    },
  },

  characters: {
    michael: {
      characterId: 'michael',
      imageKey: 'office_characters',
      frameWidth: 128,
      frameHeight: 256,
      scale: 0.235, // Increased character scale for better proportions
      animations: {
        down: [
          { x: 0 * 128, y: 0 * 256, w: 128, h: 256, anchorX: 0.5, anchorY: 0.95 },
          { x: 4 * 128, y: 0 * 256, w: 128, h: 256, anchorX: 0.5, anchorY: 0.95 },
        ],
        up: [
          { x: 1 * 128, y: 0 * 256, w: 128, h: 256, anchorX: 0.5, anchorY: 0.95 },
          { x: 5 * 128, y: 0 * 256, w: 128, h: 256, anchorX: 0.5, anchorY: 0.95 },
        ],
        left: [
          { x: 2 * 128, y: 0 * 256, w: 128, h: 256, anchorX: 0.5, anchorY: 0.95 },
          { x: 6 * 128, y: 0 * 256, w: 128, h: 256, anchorX: 0.5, anchorY: 0.95 },
        ],
        right: [
          { x: 3 * 128, y: 0 * 256, w: 128, h: 256, anchorX: 0.5, anchorY: 0.95 },
          { x: 7 * 128, y: 0 * 256, w: 128, h: 256, anchorX: 0.5, anchorY: 0.95 },
        ],
        sitting: {
          down: { x: 0 * 128, y: 0 * 256, w: 128, h: 256, anchorX: 0.5, anchorY: 0.95 },
          left: { x: 2 * 128, y: 0 * 256, w: 128, h: 256, anchorX: 0.5, anchorY: 0.95 },
          right: { x: 3 * 128, y: 0 * 256, w: 128, h: 256, anchorX: 0.5, anchorY: 0.95 },
          up: { x: 1 * 128, y: 0 * 256, w: 128, h: 256, anchorX: 0.5, anchorY: 0.95 },
        },
      },
    },

    dwight: {
      characterId: 'dwight',
      imageKey: 'office_characters',
      frameWidth: 128,
      frameHeight: 256,
      scale: 0.235,
      animations: {
        down: [
          { x: 0 * 128, y: 1 * 256, w: 128, h: 256, anchorX: 0.5, anchorY: 0.95 },
          { x: 4 * 128, y: 1 * 256, w: 128, h: 256, anchorX: 0.5, anchorY: 0.95 },
        ],
        up: [
          { x: 1 * 128, y: 1 * 256, w: 128, h: 256, anchorX: 0.5, anchorY: 0.95 },
          { x: 5 * 128, y: 1 * 256, w: 128, h: 256, anchorX: 0.5, anchorY: 0.95 },
        ],
        left: [
          { x: 2 * 128, y: 1 * 256, w: 128, h: 256, anchorX: 0.5, anchorY: 0.95 },
          { x: 6 * 128, y: 1 * 256, w: 128, h: 256, anchorX: 0.5, anchorY: 0.95 },
        ],
        right: [
          { x: 3 * 128, y: 1 * 256, w: 128, h: 256, anchorX: 0.5, anchorY: 0.95 },
          { x: 7 * 128, y: 1 * 256, w: 128, h: 256, anchorX: 0.5, anchorY: 0.95 },
        ],
        sitting: {
          down: { x: 0 * 128, y: 1 * 256, w: 128, h: 256, anchorX: 0.5, anchorY: 0.95 },
          left: { x: 2 * 128, y: 1 * 256, w: 128, h: 256, anchorX: 0.5, anchorY: 0.95 },
          right: { x: 3 * 128, y: 1 * 256, w: 128, h: 256, anchorX: 0.5, anchorY: 0.95 },
          up: { x: 1 * 128, y: 1 * 256, w: 128, h: 256, anchorX: 0.5, anchorY: 0.95 },
        },
      },
    },

    jim: {
      characterId: 'jim',
      imageKey: 'office_characters',
      frameWidth: 128,
      frameHeight: 256,
      scale: 0.235,
      animations: {
        down: [
          { x: 0 * 128, y: 2 * 256, w: 128, h: 256, anchorX: 0.5, anchorY: 0.95 },
          { x: 4 * 128, y: 2 * 256, w: 128, h: 256, anchorX: 0.5, anchorY: 0.95 },
        ],
        up: [
          { x: 1 * 128, y: 2 * 256, w: 128, h: 256, anchorX: 0.5, anchorY: 0.95 },
          { x: 5 * 128, y: 2 * 256, w: 128, h: 256, anchorX: 0.5, anchorY: 0.95 },
        ],
        left: [
          { x: 2 * 128, y: 2 * 256, w: 128, h: 256, anchorX: 0.5, anchorY: 0.95 },
          { x: 6 * 128, y: 2 * 256, w: 128, h: 256, anchorX: 0.5, anchorY: 0.95 },
        ],
        right: [
          { x: 3 * 128, y: 2 * 256, w: 128, h: 256, anchorX: 0.5, anchorY: 0.95 },
          { x: 7 * 128, y: 2 * 256, w: 128, h: 256, anchorX: 0.5, anchorY: 0.95 },
        ],
        sitting: {
          down: { x: 0 * 128, y: 2 * 256, w: 128, h: 256, anchorX: 0.5, anchorY: 0.95 },
          left: { x: 2 * 128, y: 2 * 256, w: 128, h: 256, anchorX: 0.5, anchorY: 0.95 },
          right: { x: 3 * 128, y: 2 * 256, w: 128, h: 256, anchorX: 0.5, anchorY: 0.95 },
          up: { x: 1 * 128, y: 2 * 256, w: 128, h: 256, anchorX: 0.5, anchorY: 0.95 },
        },
        actions: {
          jim_stare: { x: 0 * 128, y: 2 * 256, w: 128, h: 256, anchorX: 0.5, anchorY: 0.95 },
        },
      },
    },

    pam: {
      characterId: 'pam',
      imageKey: 'office_characters',
      frameWidth: 128,
      frameHeight: 256,
      scale: 0.235,
      animations: {
        down: [
          { x: 0 * 128, y: 3 * 256, w: 128, h: 256, anchorX: 0.5, anchorY: 0.95 },
          { x: 4 * 128, y: 3 * 256, w: 128, h: 256, anchorX: 0.5, anchorY: 0.95 },
        ],
        up: [
          { x: 1 * 128, y: 3 * 256, w: 128, h: 256, anchorX: 0.5, anchorY: 0.95 },
          { x: 5 * 128, y: 3 * 256, w: 128, h: 256, anchorX: 0.5, anchorY: 0.95 },
        ],
        left: [
          { x: 2 * 128, y: 3 * 256, w: 128, h: 256, anchorX: 0.5, anchorY: 0.95 },
          { x: 6 * 128, y: 3 * 256, w: 128, h: 256, anchorX: 0.5, anchorY: 0.95 },
        ],
        right: [
          { x: 3 * 128, y: 3 * 256, w: 128, h: 256, anchorX: 0.5, anchorY: 0.95 },
          { x: 7 * 128, y: 3 * 256, w: 128, h: 256, anchorX: 0.5, anchorY: 0.95 },
        ],
        sitting: {
          down: { x: 0 * 128, y: 3 * 256, w: 128, h: 256, anchorX: 0.5, anchorY: 0.95 },
          left: { x: 2 * 128, y: 3 * 256, w: 128, h: 256, anchorX: 0.5, anchorY: 0.95 },
          right: { x: 3 * 128, y: 3 * 256, w: 128, h: 256, anchorX: 0.5, anchorY: 0.95 },
          up: { x: 1 * 128, y: 3 * 256, w: 128, h: 256, anchorX: 0.5, anchorY: 0.95 },
        },
      },
    },
  },

  props: {
    // Top-Down Executive & Reception Furniture (Padded Bounding Boxes to avoid clipping)
    desk_michael: {
      propType: 'desk_michael',
      imageKey: 'office_props_topdown',
      rect: { x: 55, y: 0, w: 375, h: 265, anchorX: 0.5, anchorY: 1.0 },
    },
    desk_reception: {
      propType: 'desk_reception',
      imageKey: 'office_props_topdown',
      rect: { x: 535, y: 15, w: 430, h: 245, anchorX: 0.5, anchorY: 1.0 },
    },
    sofa_leather: {
      propType: 'sofa_leather',
      imageKey: 'office_props_topdown',
      rect: { x: 65, y: 265, w: 575, h: 225, anchorX: 0.5, anchorY: 1.0 },
    },
    water_cooler: {
      propType: 'water_cooler',
      imageKey: 'office_props_topdown',
      rect: { x: 70, y: 475, w: 135, h: 235, anchorX: 0.5, anchorY: 1.0 },
    },
    filing_cabinet: {
      propType: 'filing_cabinet',
      imageKey: 'office_props_topdown',
      rect: { x: 795, y: 245, w: 140, h: 265, anchorX: 0.5, anchorY: 1.0 },
    },
    conference_table: {
      propType: 'conference_table',
      imageKey: 'office_props_topdown',
      rect: { x: 80, y: 685, w: 845, h: 330, anchorX: 0.5, anchorY: 1.0 },
    },
    photocopier: {
      propType: 'photocopier',
      imageKey: 'office_props_topdown',
      rect: { x: 395, y: 495, w: 220, h: 215, anchorX: 0.5, anchorY: 1.0 },
    },
    potted_plant: {
      propType: 'potted_plant',
      imageKey: 'office_props_topdown',
      rect: { x: 795, y: 500, w: 145, h: 210, anchorX: 0.5, anchorY: 1.0 },
    },

    // Bullpen Desks & Breakroom Furniture
    desk_wood: {
      propType: 'desk_wood',
      imageKey: 'bullpen_desks_topdown',
      rect: { x: 245, y: 25, w: 255, h: 275, anchorX: 0.5, anchorY: 1.0 },
    },
    jello_stapler: {
      propType: 'jello_stapler',
      imageKey: 'bullpen_desks_topdown',
      rect: { x: 0, y: 25, w: 250, h: 275, anchorX: 0.5, anchorY: 1.0 },
    },
    vending_machine: {
      propType: 'vending_machine',
      imageKey: 'bullpen_desks_topdown',
      rect: { x: 10, y: 665, w: 195, h: 320, anchorX: 0.5, anchorY: 1.0 },
    },
    coffee_bar: {
      propType: 'coffee_bar',
      imageKey: 'bullpen_desks_topdown',
      rect: { x: 745, y: 700, w: 265, h: 230, anchorX: 0.5, anchorY: 1.0 },
    },
    high_top_table: {
      propType: 'high_top_table',
      imageKey: 'bullpen_desks_topdown',
      rect: { x: 430, y: 680, w: 305, h: 280, anchorX: 0.5, anchorY: 1.0 },
    },
    neon_sign: {
      propType: 'neon_sign',
      imageKey: 'friends_props',
      rect: { x: 650, y: 330, w: 310, h: 290, anchorX: 0.5, anchorY: 1.0 },
    },
  },

  tiles: {
    floor_carpet_grey: {
      tileType: 'floor_carpet_grey',
      imageKey: 'office_tiles',
      rect: { x: 0, y: 750, w: 195, h: 274 },
    },
    floor_carpet_blue: {
      tileType: 'floor_carpet_blue',
      imageKey: 'office_tiles',
      rect: { x: 190, y: 625, w: 180, h: 395 },
    },
    floor_tile_kitchen: {
      tileType: 'floor_tile_kitchen',
      imageKey: 'office_tiles',
      rect: { x: 375, y: 750, w: 250, h: 274 },
    },
    floor_wood: {
      tileType: 'floor_wood',
      imageKey: 'office_tiles',
      rect: { x: 625, y: 750, w: 175, h: 274 },
    },
    wall_office_top: {
      tileType: 'wall_office_top',
      imageKey: 'office_tiles',
      rect: { x: 0, y: 0, w: 375, h: 250 },
    },
    wall_glass: {
      tileType: 'wall_glass',
      imageKey: 'office_tiles',
      rect: { x: 375, y: 0, w: 275, h: 750 },
    },
    door_wood: {
      tileType: 'door_wood',
      imageKey: 'office_tiles',
      rect: { x: 650, y: 0, w: 150, h: 750 },
    },
    window_blinds: {
      tileType: 'window_blinds',
      imageKey: 'office_tiles',
      rect: { x: 800, y: 0, w: 224, h: 1024 },
    },
  },

  portraits: {
    michael: {
      characterId: 'michael',
      imageKey: 'michael_portrait',
    },
    dwight: {
      characterId: 'dwight',
      imageKey: 'dwight_portrait',
    },
    jim: {
      characterId: 'jim',
      imageKey: 'jim_portrait',
    },
    pam: {
      characterId: 'pam',
      imageKey: 'pam_portrait',
    },
  },
};
