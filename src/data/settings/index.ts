import { SettingDefinition } from '../../types/environment';
import { DUNDER_MIFFLIN_SCRANTON } from './dunder_mifflin';
import { HACKER_HOSTEL } from './hacker_hostel';
import { CENTRAL_COFFEE } from './central_coffee';

export const ALL_SETTINGS: Record<string, SettingDefinition> = {
  dunder_mifflin_scranton: DUNDER_MIFFLIN_SCRANTON,
  hacker_hostel: HACKER_HOSTEL,
  central_coffee: CENTRAL_COFFEE,
};

export const DEFAULT_SETTING_ID = 'dunder_mifflin_scranton';
