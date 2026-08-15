import { SettingDefinition } from '../../types/environment';
import { DUNDER_MIFFLIN_SCRANTON } from './dunder_mifflin';
import { CENTRAL_COFFEE } from './central_coffee';
import { HACKER_HOSTEL } from './hacker_hostel';
import { MACLARENS_PUB } from './maclarens_pub';

export const ALL_SETTINGS: Record<string, SettingDefinition> = {
  dunder_mifflin_scranton: DUNDER_MIFFLIN_SCRANTON,
  central_coffee: CENTRAL_COFFEE,
  hacker_hostel: HACKER_HOSTEL,
  maclarens_pub: MACLARENS_PUB,
};

export const DEFAULT_SETTING_ID = 'dunder_mifflin_scranton';

export const SETTING_TO_SHOW_MAP: Record<string, string> = {
  dunder_mifflin_scranton: 'the_office',
  central_coffee: 'friends',
  hacker_hostel: 'silicon_valley',
  maclarens_pub: 'himym',
};

export function getShowIdForSetting(settingId: string): string {
  return SETTING_TO_SHOW_MAP[settingId] || 'the_office';
}
