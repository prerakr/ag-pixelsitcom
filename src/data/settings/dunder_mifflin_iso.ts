import { PropInstance, SettingDefinition } from '../../types/environment';
import { deskWithChair, isoProp, isoTiles, waypoint } from './isoLayout';

/**
 * Dunder Mifflin Scranton as an isometric stage, 26 x 17 m inside (1 tile = 1 m).
 *
 * North-west: Michael's office behind glass and blinds, its door beside reception; the glass
 * entrance doors are in the west wall facing Pam's desk. North: the conference room (glass onto
 * the bullpen), then the back hallway with the copier and water cooler, then the kitchen with
 * its two vending machines. East: the annex (Toby, Kelly, Ryan) through a door off the bullpen.
 * South-west: accounting behind a low partition. The bullpen desks face each other in pairs,
 * Jim across from Dwight. Waypoint ids match dunder_mifflin_scranton.
 */

const GW = 28;
const GH = 19;
const OFFICE_DESK_KNEE = 0.375; // knee space beside the drawer pedestal

const tiles = isoTiles(GW, GH, 'wall_office_side', 'floor_carpet_grey', (set, fill) => {
  // Michael's office: glass on the bullpen sides, door by reception.
  fill(7, 1, 7, 6, 'wall_glass');
  fill(1, 6, 7, 6, 'wall_glass');
  set(5, 6, 'door_glass');
  // Conference room: glass along the bullpen, drywall to the hallway.
  fill(8, 6, 14, 6, 'wall_glass');
  set(13, 6, 'door_glass');
  fill(15, 1, 15, 6, 'wall_office_side');
  fill(8, 1, 14, 5, 'floor_carpet_blue');
  // Kitchen off the back hallway, with doors to the hallway, the bullpen and the annex.
  fill(19, 1, 19, 7, 'wall_office_side');
  fill(19, 7, 26, 7, 'wall_office_side');
  set(19, 3, 'door_wood');
  set(20, 7, 'door_wood');
  set(24, 7, 'door_wood');
  fill(20, 1, 26, 6, 'floor_tile_kitchen');
  // The annex.
  fill(21, 8, 21, 17, 'wall_office_side');
  set(21, 10, 'door_wood');
  // Accounting's low partition, open at its east end.
  fill(1, 12, 5, 12, 'wall_office_side');
  // Back wall: windows, the glass entrance, the stairwell door off the hallway.
  fill(2, 0, 4, 0, 'window_blinds');
  fill(8, 0, 11, 0, 'window_blinds');
  set(17, 0, 'door_wood');
  set(0, 9, 'door_glass');
  set(0, 10, 'door_glass');
  fill(0, 15, 0, 17, 'window_blinds');
});

const seats: Record<string, { x: number; y: number }> = {};
const props: PropInstance[] = [];

function desk(owner: string, type: PropInstance['type'], x: number, y: number, facing: 'down' | 'up' | 'left' | 'right', chair: PropInstance['type'] = 'chair_office', knee = OFFICE_DESK_KNEE) {
  const d = deskWithChair(`prop_${owner}_desk`, type, `prop_${owner}_chair`, chair, x, y, facing, knee);
  props.push(...d.props);
  seats[owner] = d.seat;
}

// Bullpen pairs: one desk faces south, its partner faces north across the join.
desk('jim', 'desk_jim', 9.0, 9.0, 'down');
desk('dwight', 'desk_dwight', 9.0, 9.75, 'up');
desk('stanley', 'desk_stanley', 12.5, 9.0, 'down');
desk('phyllis', 'desk_phyllis', 12.5, 9.75, 'up');
desk('meredith', 'desk_meredith', 16.0, 9.0, 'down');
desk('creed', 'desk_creed', 16.0, 9.75, 'up');
desk('spare_a', 'desk_plain', 12.5, 13.25, 'down');
desk('spare_b', 'desk_pam_spare', 12.5, 14.0, 'up');
desk('spare_c', 'desk_plain', 16.0, 13.25, 'down');
desk('spare_d', 'desk_plain', 16.0, 14.0, 'up');
// Accounting
desk('angela', 'desk_angela', 1.5, 13.875, 'down');
desk('kevin', 'desk_kevin', 1.5, 15.625, 'up');
desk('oscar', 'desk_oscar', 4.25, 14.25, 'left');
// Annex
desk('toby', 'desk_toby', 22.5, 9.25, 'down');
desk('kelly', 'desk_kelly', 24.75, 9.25, 'down');
desk('ryan', 'desk_ryan', 23.5, 13.0, 'down');
// Michael and Pam
desk('michael', 'desk_exec', 2.375, 2.5, 'down', 'chair_exec', 0.5);
desk('pam', 'desk_reception', 3.0, 8.0, 'left', 'chair_office', 0.5);

// Conference room: table with chairs down both sides and Michael's at the head.
props.push(isoProp('prop_conf_table', 'conference_table', 9.25, 2.625, 'down', { name: 'Conference Table', interactive: true }));
[9.625, 10.875, 12.125].forEach((x, i) => {
  props.push(isoProp(`prop_conf_chair_n${i}`, 'chair_conference', x, 1.9375, 'down'));
  props.push(isoProp(`prop_conf_chair_s${i}`, 'chair_conference', x, 3.875, 'up'));
});
props.push(isoProp('prop_conf_chair_head', 'chair_conference', 8.5625, 2.9375, 'right'));

props.push(
  // Michael's office
  isoProp('prop_michael_sofa', 'sofa_black', 1.0, 3.625, 'right', { name: "Michael's Couch", interactive: true }),
  isoProp('prop_michael_shelf', 'bookshelf', 5.25, 1.0, 'down', { name: 'Bookshelf' }),
  isoProp('prop_michael_plant', 'ficus', 6.25, 4.875, 'down', { name: 'Ficus' }),
  isoProp('prop_dundies', 'dundie_shelf', 1.0, 1.375, 'right', { name: 'Dundie Shelf' }),
  // Reception
  isoProp('prop_reception_sofa', 'sofa_black', 1.0, 7.0, 'right', { name: 'Waiting Couch' }),
  isoProp('prop_dm_sign', 'sign_dunder_mifflin', 1.0, 7.375, 'right', { name: 'Dunder Mifflin' }),
  isoProp('prop_dm_sign_2', 'sign_paper_company', 1.0, 10.875, 'right'),
  isoProp('prop_reception_plant', 'ficus', 6.125, 7.125, 'down'),
  isoProp('prop_coat_rack', 'coat_rack', 1.125, 11.375, 'down'),
  // Conference room wall
  isoProp('prop_conf_whiteboard', 'whiteboard', 12.375, 1.0, 'down', { name: 'Whiteboard', interactive: true }),
  isoProp('prop_conf_plant', 'ficus', 14.125, 4.75, 'down'),
  // Back hallway
  isoProp('prop_photocopier', 'photocopier', 16.0, 1.0, 'down', { name: 'Photocopier', interactive: true }),
  isoProp('prop_paper_boxes', 'paper_boxes', 17.375, 1.0, 'down', { name: 'Paper Stock' }),
  isoProp('prop_clock', 'wall_clock', 16.25, 1.0, 'down'),
  isoProp('prop_filing_cabinet', 'filing_cabinet', 16.0, 3.0, 'right', { name: 'Filing Cabinets' }),
  isoProp('prop_filing_cabinet_2', 'filing_cabinet', 16.0, 3.5, 'right'),
  isoProp('prop_water_cooler', 'water_cooler', 18.5, 4.25, 'left', { name: 'Water Cooler', interactive: true }),
  // Kitchen
  isoProp('prop_kitchen_counter', 'kitchen_counter', 20.125, 1.0, 'down', { name: 'Kitchen Counter', interactive: true }),
  isoProp('prop_fridge', 'fridge', 23.25, 1.0, 'down'),
  isoProp('prop_vending_machine', 'vending_snack', 24.125, 1.0, 'down', { name: 'Snack Machine', interactive: true }),
  isoProp('prop_vending_soda', 'vending_soda', 25.125, 1.0, 'down', { name: 'Soda Machine', interactive: true }),
  isoProp('prop_breakroom_table', 'table_break', 21.375, 3.75, 'down', { name: 'Break Table' }),
  isoProp('prop_break_chair_1', 'chair_break', 20.875, 3.875, 'right'),
  isoProp('prop_break_chair_2', 'chair_break', 22.375, 3.875, 'left'),
  isoProp('prop_breakroom_table_2', 'table_break', 24.0, 4.0, 'down'),
  isoProp('prop_break_chair_3', 'chair_break', 24.125, 3.375, 'down'),
  isoProp('prop_break_chair_4', 'chair_break', 24.125, 5.0, 'up'),
  isoProp('prop_trash_can', 'trash_can', 26.375, 5.5, 'down', { name: 'Trash Can', interactive: true }),
  // Annex
  isoProp('prop_annex_files_1', 'filing_cabinet', 22.0, 14.5, 'right'),
  isoProp('prop_annex_files_2', 'filing_cabinet', 22.0, 15.0, 'right'),
  isoProp('prop_annex_boxes', 'paper_boxes', 25.5, 15.75, 'down'),
  isoProp('prop_annex_plant', 'ficus', 25.875, 11.5, 'down'),
  // Accounting
  isoProp('prop_cork_board', 'cork_board', 1.0, 13.625, 'right'),
  isoProp('prop_accounting_plant', 'ficus', 5.75, 16.875, 'down'),
  // Bullpen
  isoProp('prop_bullpen_plant', 'ficus', 20.25, 16.875, 'down'),
  isoProp('prop_bullpen_trash', 'trash_can', 11.0, 11.25, 'down'),
  isoProp('prop_bullpen_files', 'filing_cabinet', 19.25, 8.25, 'left'),
  isoProp('prop_bullpen_files_2', 'filing_cabinet', 19.25, 8.75, 'left'),
);

export const DUNDER_MIFFLIN_ISO: SettingDefinition = {
  id: 'dunder_mifflin_iso',
  name: 'Dunder Mifflin Scranton (Isometric)',
  showTitle: 'The Office',
  description: 'The Scranton branch at true scale: Michael\'s glass office, reception, the bullpen pairs, accounting, the annex and the kitchen.',
  gridWidth: GW,
  gridHeight: GH,
  tileSize: 32,
  backgroundColor: '#14161a',
  tileTheme: 'office',
  projection: 'iso',
  defaultCamera: { x: 12.5 * 32, y: 9.5 * 32, zoom: 1.15 },
  zones: [
    { id: 'michaels_office', name: "Michael's Office", x: 1, y: 1, w: 6, h: 5, color: '#fed7aa' },
    { id: 'reception', name: 'Reception & Entrance', x: 1, y: 7, w: 6, h: 5, color: '#fef08a' },
    { id: 'conference_room', name: 'Conference Room', x: 8, y: 1, w: 7, h: 5, color: '#bfdbfe' },
    { id: 'breakroom', name: 'Kitchen & Breakroom', x: 20, y: 1, w: 7, h: 6, color: '#fbcfe8' },
    { id: 'sales_bullpen', name: 'Sales Bullpen', x: 7, y: 7, w: 14, h: 11, color: '#bbf7d0' },
    { id: 'accounting', name: 'Accounting', x: 1, y: 13, w: 6, h: 5, color: '#ddd6fe' },
    { id: 'annex', name: 'The Annex', x: 22, y: 8, w: 5, h: 10, color: '#e2e8f0' },
  ],
  tiles,
  props,
  waypoints: {
    michael_desk: waypoint('michael_desk', "Michael's Desk", seats.michael, 'down', 'michaels_office'),
    michael_door: waypoint('michael_door', "Michael's Doorway", { x: 5.5, y: 5.2 }, 'down', 'michaels_office'),
    michael_window: waypoint('michael_window', "Michael's Window", { x: 4.5, y: 1.25 }, 'up', 'michaels_office'),
    reception_desk: waypoint('reception_desk', 'Reception Front', { x: 2.375, y: 8.625 }, 'right', 'reception'),
    pam_seat: waypoint('pam_seat', "Pam's Chair", seats.pam, 'left', 'reception'),
    main_entrance: waypoint('main_entrance', 'Office Main Entrance', { x: 1.5, y: 9.625 }, 'right', 'reception'),
    jim_desk: waypoint('jim_desk', "Jim's Desk", seats.jim, 'down', 'sales_bullpen'),
    dwight_desk: waypoint('dwight_desk', "Dwight's Desk", seats.dwight, 'up', 'sales_bullpen'),
    stanley_desk: waypoint('stanley_desk', "Stanley's Desk", seats.stanley, 'down', 'sales_bullpen'),
    phyllis_desk: waypoint('phyllis_desk', "Phyllis's Desk", seats.phyllis, 'up', 'sales_bullpen'),
    meredith_desk: waypoint('meredith_desk', "Meredith's Desk", seats.meredith, 'down', 'sales_bullpen'),
    creed_desk: waypoint('creed_desk', "Creed's Desk", seats.creed, 'up', 'sales_bullpen'),
    bullpen_center: waypoint('bullpen_center', 'Bullpen Center Walkway', { x: 14.75, y: 11.75 }, 'down', 'sales_bullpen'),
    water_cooler: waypoint('water_cooler', 'Water Cooler Spot', { x: 17.875, y: 4.0 }, 'right', 'sales_bullpen'),
    photocopier: waypoint('photocopier', 'Photocopier Area', { x: 16.5, y: 1.875 }, 'up', 'sales_bullpen'),
    angela_desk: waypoint('angela_desk', "Angela's Desk", seats.angela, 'down', 'accounting'),
    kevin_desk: waypoint('kevin_desk', "Kevin's Desk", seats.kevin, 'up', 'accounting'),
    oscar_desk: waypoint('oscar_desk', "Oscar's Desk", seats.oscar, 'left', 'accounting'),
    conference_table_head: waypoint('conference_table_head', 'Conference Head (Michael)', { x: 8.875, y: 2.8125 }, 'right', 'conference_room'),
    conference_table_mid: waypoint('conference_table_mid', 'Conference Center', { x: 11.1875, y: 3.7375 }, 'up', 'conference_room'),
    conference_door: waypoint('conference_door', 'Conference Doorway', { x: 13.5, y: 6.0 }, 'up', 'conference_room'),
    vending_machine: waypoint('vending_machine', 'Vending Machines', { x: 24.625, y: 1.9375 }, 'up', 'breakroom'),
    kitchen_counter: waypoint('kitchen_counter', 'Kitchen Counter', { x: 21.5, y: 1.75 }, 'up', 'breakroom'),
    trash_can: waypoint('trash_can', 'Trash Can (Safety Drill)', { x: 25.875, y: 5.25 }, 'right', 'breakroom'),
    annex_toby: waypoint('annex_toby', "Toby's Annex Desk", seats.toby, 'down', 'annex'),
    annex_kelly: waypoint('annex_kelly', "Kelly's Annex Desk", seats.kelly, 'down', 'annex'),
    ryan_desk: waypoint('ryan_desk', "Ryan's Desk", seats.ryan, 'down', 'annex'),
  },
  spawnPoints: {
    michael: waypoint('michael', 'Michael Spawn', seats.michael, 'down'),
    dwight: waypoint('dwight', 'Dwight Spawn', seats.dwight, 'up'),
    jim: waypoint('jim', 'Jim Spawn', seats.jim, 'down'),
    pam: waypoint('pam', 'Pam Spawn', seats.pam, 'left'),
    angela: waypoint('angela', 'Angela Spawn', seats.angela, 'down'),
    kevin: waypoint('kevin', 'Kevin Spawn', seats.kevin, 'up'),
    stanley: waypoint('stanley', 'Stanley Spawn', seats.stanley, 'down'),
    toby: waypoint('toby', 'Toby Spawn', seats.toby, 'down'),
    phyllis: waypoint('phyllis', 'Phyllis Spawn', seats.phyllis, 'up'),
    ryan: waypoint('ryan', 'Ryan Spawn', seats.ryan, 'down'),
    kelly: waypoint('kelly', 'Kelly Spawn', seats.kelly, 'down'),
    oscar: waypoint('oscar', 'Oscar Spawn', seats.oscar, 'left'),
    creed: waypoint('creed', 'Creed Spawn', seats.creed, 'up'),
    meredith: waypoint('meredith', 'Meredith Spawn', seats.meredith, 'down'),
  },
};
