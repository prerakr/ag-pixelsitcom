import { Direction } from './script';

export type TileType =
  | 'floor_carpet_grey'
  | 'floor_carpet_blue'
  | 'floor_tile_kitchen'
  | 'floor_wood'
  | 'wall_office_top'
  | 'wall_office_side'
  | 'wall_glass'
  | 'wall_brick'
  | 'door_wood'
  | 'door_glass'
  | 'window_blinds';

export type PropType =
  | 'desk_wood'
  | 'desk_reception'
  | 'desk_michael'
  | 'chair_office'
  | 'chair_conference'
  | 'pc_monitor'
  | 'water_cooler'
  | 'vending_machine'
  | 'sofa_leather'
  | 'conference_table'
  | 'whiteboard'
  | 'potted_plant'
  | 'filing_cabinet'
  | 'photocopier'
  | 'kitchen_counter'
  | 'microwave'
  | 'trash_can'
  | 'dundie_trophy'
  | 'jello_stapler'
  | 'server_rack'
  | 'coffee_bar'
  | 'fire_hazard';

export interface PropInstance {
  id: string;
  type: PropType;
  x: number; // grid or pixel coords
  y: number;
  width?: number; // in grid cells (default 1)
  height?: number; // in grid cells (default 1)
  interactive?: boolean;
  name?: string;
  state?: Record<string, any>;
  facing?: Direction;
  zIndexOffset?: number;
}

export interface Waypoint {
  id: string;
  name: string;
  x: number; // grid coordinates (e.g. 0 to 40)
  y: number;
  facing?: Direction;
  zone?: string;
}

export interface RoomZone {
  id: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color?: string;
}

export interface SettingDefinition {
  id: string;
  name: string;
  showTitle: string;
  gridWidth: number; // e.g. 36 cells
  gridHeight: number; // e.g. 24 cells
  tileSize: number; // e.g. 32px
  backgroundColor: string;
  zones: RoomZone[];
  tiles: { [key: string]: TileType }; // "x,y" => TileType
  props: PropInstance[];
  waypoints: Record<string, Waypoint>;
  spawnPoints: Record<string, Waypoint>;
  defaultCamera: {
    x: number;
    y: number;
    zoom: number;
  };
}
