import { PropInstance, PropType } from '../../types/environment';

export interface SoundstagePrefab {
  id: string;
  name: string;
  category: string;
  description: string;
  width: number;
  height: number;
  props: Array<Omit<PropInstance, 'id' | 'x' | 'y'> & { relX: number; relY: number; nameSuffix?: string }>;
}



export const SOUNDSTAGE_PREFABS: SoundstagePrefab[] = [
  {
    id: 'prefab_bullpen_quad',
    name: 'Sales Bullpen Quad',
    category: 'Workstations',
    description: 'Two facing sales desks with PC monitors and wastebasket',
    width: 3.5,
    height: 4.5,
    props: [
      {
        type: 'desk_wood' as PropType,
        relX: 0,
        relY: 0,
        width: 2.0,
        height: 2.0,
        interactive: true,
        facing: 'down',
        nameSuffix: 'North Desk',
      },
      {
        type: 'desk_wood' as PropType,
        relX: 0,
        relY: 2.2,
        width: 2.0,
        height: 2.0,
        interactive: true,
        facing: 'up',
        nameSuffix: 'South Desk',
      },
      {
        type: 'trash_can' as PropType,
        relX: 2.2,
        relY: 1.5,
        width: 0.8,
        height: 0.8,
        nameSuffix: 'Can',
      },
    ],
  },
  {
    id: 'prefab_exec_suite',
    name: 'Executive Office Suite',
    category: 'Offices',
    description: 'Executive desk with leather sofa, ficus plant, and awards shelf',
    width: 6.0,
    height: 4.5,
    props: [
      {
        type: 'desk_michael' as PropType,
        relX: 1.5,
        relY: 0.5,
        width: 2.8,
        height: 2.0,
        interactive: true,
        facing: 'down',
        nameSuffix: 'Exec Desk',
      },
      {
        type: 'sofa_leather' as PropType,
        relX: 0,
        relY: 3.0,
        width: 3.0,
        height: 1.2,
        interactive: true,
        facing: 'down',
        nameSuffix: 'Leather Sofa',
      },
      {
        type: 'potted_plant' as PropType,
        relX: 0,
        relY: 0.2,
        width: 1.0,
        height: 1.4,
        nameSuffix: 'Ficus',
      },
    ],
  },
  {
    id: 'prefab_conference_suite',
    name: 'Conference Room Suite',
    category: 'Meeting Rooms',
    description: 'Large conference table with presentation whiteboard',
    width: 6.5,
    height: 3.5,
    props: [
      {
        type: 'conference_table' as PropType,
        relX: 0.5,
        relY: 1.0,
        width: 5.5,
        height: 2.2,
        interactive: true,
        nameSuffix: 'Conf Table',
      },
      {
        type: 'whiteboard' as PropType,
        relX: 0,
        relY: 0,
        width: 2.5,
        height: 0.8,
        nameSuffix: 'Whiteboard',
      },
    ],
  },
  {
    id: 'prefab_breakroom_corner',
    name: 'Breakroom & Kitchen Nook',
    category: 'Kitchen',
    description: 'Coffee counter, snack vending machine, and water cooler',
    width: 5.5,
    height: 3.0,
    props: [
      {
        type: 'coffee_bar' as PropType,
        relX: 0,
        relY: 0,
        width: 2.2,
        height: 1.9,
        interactive: true,
        nameSuffix: 'Coffee Bar',
      },
      {
        type: 'vending_machine' as PropType,
        relX: 2.5,
        relY: 0,
        width: 1.2,
        height: 2.0,
        interactive: true,
        nameSuffix: 'Snack Vendor',
      },
      {
        type: 'water_cooler' as PropType,
        relX: 4.0,
        relY: 0,
        width: 1.0,
        height: 1.7,
        interactive: true,
        nameSuffix: 'Cooler',
      },
    ],
  },
  {
    id: 'prefab_lounge_pub',
    name: 'Pub Booth & Jukebox Lounge',
    category: 'Lounge & Bar',
    description: 'High-top pub table with jukebox and fireplace',
    width: 5.0,
    height: 3.5,
    props: [
      {
        type: 'high_top_table' as PropType,
        relX: 0.5,
        relY: 1.5,
        width: 2.0,
        height: 1.8,
        nameSuffix: 'Pub Table',
      },
      {
        type: 'jukebox' as PropType,
        relX: 3.0,
        relY: 0,
        width: 1.5,
        height: 2.0,
        interactive: true,
        nameSuffix: 'Jukebox',
      },
      {
        type: 'pub_fireplace' as PropType,
        relX: 0,
        relY: 0,
        width: 2.4,
        height: 1.2,
        nameSuffix: 'Fireplace',
      },
    ],
  },
  {
    id: 'prefab_server_station',
    name: 'Server Room & Tech Station',
    category: 'Tech Garage',
    description: 'Dual server rack with modern tech desk and photocopier',
    width: 5.5,
    height: 3.5,
    props: [
      {
        type: 'server_rack' as PropType,
        relX: 0,
        relY: 0,
        width: 1.2,
        height: 2.2,
        nameSuffix: 'Server 1',
      },
      {
        type: 'server_rack' as PropType,
        relX: 1.4,
        relY: 0,
        width: 1.2,
        height: 2.2,
        nameSuffix: 'Server 2',
      },
      {
        type: 'desk_modern' as PropType,
        relX: 3.0,
        relY: 0.8,
        width: 2.0,
        height: 2.0,
        interactive: true,
        nameSuffix: 'Dev Desk',
      },
    ],
  },
];
