import { SpriteAtlasManifest } from '../../../types/sprite';
import { atlasCharacters, atlasImages } from '../characterDefs';

const CAST = ['michael', 'dwight', 'jim', 'pam', 'angela', 'kevin', 'stanley', 'ryan', 'kelly', 'oscar', 'toby', 'phyllis', 'meredith', 'creed'];

export const OFFICE_MANIFEST: SpriteAtlasManifest = {
  showId: 'the_office',
  images: {
    ...atlasImages(CAST),
    office_props_topdown: {
      url: '/sprites/props/office_props_topdown.png',
    },
    bullpen_desks_topdown: {
      url: '/sprites/props/bullpen_desks_topdown.png',
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

  characters: atlasCharacters(CAST),

  props: {
    desk_michael: {
      propType: 'desk_michael',
      imageKey: 'office_props_topdown',
      rect: { x: 55, y: 0, w: 375, h: 265, anchorX: 0.5, anchorY: 1.0 },
      enabled: true,
    },
    desk_reception: {
      propType: 'desk_reception',
      imageKey: 'office_props_topdown',
      rect: { x: 535, y: 15, w: 430, h: 245, anchorX: 0.5, anchorY: 1.0 },
      enabled: true,
    },
    sofa_leather: {
      propType: 'sofa_leather',
      imageKey: 'office_props_topdown',
      rect: { x: 65, y: 265, w: 575, h: 225, anchorX: 0.5, anchorY: 1.0 },
      enabled: true,
    },
    water_cooler: {
      propType: 'water_cooler',
      imageKey: 'office_props_topdown',
      rect: { x: 70, y: 475, w: 135, h: 235, anchorX: 0.5, anchorY: 1.0 },
      enabled: true,
    },
    filing_cabinet: {
      propType: 'filing_cabinet',
      imageKey: 'office_props_topdown',
      rect: { x: 795, y: 245, w: 140, h: 265, anchorX: 0.5, anchorY: 1.0 },
      enabled: true,
    },
    conference_table: {
      propType: 'conference_table',
      imageKey: 'office_props_topdown',
      rect: { x: 80, y: 685, w: 845, h: 330, anchorX: 0.5, anchorY: 1.0 },
      enabled: true,
    },
    photocopier: {
      propType: 'photocopier',
      imageKey: 'office_props_topdown',
      rect: { x: 395, y: 495, w: 220, h: 215, anchorX: 0.5, anchorY: 1.0 },
      enabled: true,
    },
    potted_plant: {
      propType: 'potted_plant',
      imageKey: 'office_props_topdown',
      rect: { x: 795, y: 500, w: 145, h: 210, anchorX: 0.5, anchorY: 1.0 },
      enabled: true,
    },
    desk_wood: {
      propType: 'desk_wood',
      imageKey: 'bullpen_desks_topdown',
      rect: { x: 245, y: 25, w: 255, h: 275, anchorX: 0.5, anchorY: 1.0 },
      enabled: true,
    },
    jello_stapler: {
      propType: 'jello_stapler',
      imageKey: 'bullpen_desks_topdown',
      rect: { x: 0, y: 25, w: 250, h: 275, anchorX: 0.5, anchorY: 1.0 },
      enabled: true,
    },
    vending_machine: {
      propType: 'vending_machine',
      imageKey: 'bullpen_desks_topdown',
      rect: { x: 10, y: 665, w: 195, h: 320, anchorX: 0.5, anchorY: 1.0 },
      enabled: true,
    },
    coffee_bar: {
      propType: 'coffee_bar',
      imageKey: 'bullpen_desks_topdown',
      rect: { x: 745, y: 700, w: 265, h: 230, anchorX: 0.5, anchorY: 1.0 },
      enabled: true,
    },
    high_top_table: {
      propType: 'high_top_table',
      imageKey: 'bullpen_desks_topdown',
      rect: { x: 430, y: 680, w: 305, h: 280, anchorX: 0.5, anchorY: 1.0 },
      enabled: true,
    },
  },

  tiles: {},

  portraits: {
    michael: {
      characterId: 'michael',
      imageKey: 'michael_portrait',
      enabled: true,
    },
    dwight: {
      characterId: 'dwight',
      imageKey: 'dwight_portrait',
      enabled: true,
    },
    jim: {
      characterId: 'jim',
      imageKey: 'jim_portrait',
      enabled: true,
    },
    pam: {
      characterId: 'pam',
      imageKey: 'pam_portrait',
      enabled: true,
    },
  },
};
