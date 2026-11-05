import { SettingDefinition } from '../../types/environment';
import { DUNDER_MIFFLIN_SCRANTON } from './dunder_mifflin';
import { CENTRAL_COFFEE } from './central_coffee';
import { HACKER_HOSTEL } from './hacker_hostel';
import { MACLARENS_PUB } from './maclarens_pub';
import { CENTRAL_PERK_ISO } from './central_perk_iso';
import { DUNDER_MIFFLIN_ISO } from './dunder_mifflin_iso';
import { MACLARENS_ISO } from './maclarens_iso';
import { HACKER_HOSTEL_ISO } from './hacker_hostel_iso';
import { loadCustomSettings } from './customStore';

export const ALL_SETTINGS: Record<string, SettingDefinition> = {
  dunder_mifflin_iso: DUNDER_MIFFLIN_ISO,
  central_perk_iso: CENTRAL_PERK_ISO,
  hacker_hostel_iso: HACKER_HOSTEL_ISO,
  maclarens_iso: MACLARENS_ISO,
  // Legacy top-down sets
  dunder_mifflin_scranton: DUNDER_MIFFLIN_SCRANTON,
  central_coffee: CENTRAL_COFFEE,
  hacker_hostel: HACKER_HOSTEL,
  maclarens_pub: MACLARENS_PUB,
};

/**
 * Each show's isometric stage and the top-down set it replaced. The iso stages are the defaults
 * and what the preset episodes name; the top-down sets stay as legacy options. Both share their
 * waypoint and prop ids, so any episode plays on either.
 */
export const STAGE_PAIRS: { iso: string; legacy: string }[] = [
  { iso: 'dunder_mifflin_iso', legacy: 'dunder_mifflin_scranton' },
  { iso: 'central_perk_iso', legacy: 'central_coffee' },
  { iso: 'maclarens_iso', legacy: 'maclarens_pub' },
  { iso: 'hacker_hostel_iso', legacy: 'hacker_hostel' },
];

export type StageStyle = 'iso' | 'legacy';

export const DEFAULT_SETTING_ID = 'dunder_mifflin_iso';

export function isLegacySetting(settingId: string): boolean {
  return STAGE_PAIRS.some((p) => p.legacy === settingId);
}

/** The same show's set in the given style; settings without a counterpart (custom sets) are returned as is. */
export function settingForStyle(settingId: string, style: StageStyle): string {
  const pair = STAGE_PAIRS.find((p) => p.iso === settingId || p.legacy === settingId);
  return pair ? pair[style] : settingId;
}

/** The id the show's music theme is keyed by (the original top-down set's id). */
export function musicThemeId(settingId: string): string {
  return settingForStyle(settingId, 'legacy');
}

const STYLE_KEY = 'pixelsitcom.stageStyle';

export function loadStageStyle(): StageStyle {
  try {
    return localStorage.getItem(STYLE_KEY) === 'legacy' ? 'legacy' : 'iso';
  } catch {
    return 'iso';
  }
}

export function saveStageStyle(style: StageStyle): void {
  try {
    localStorage.setItem(STYLE_KEY, style);
  } catch {
    // Storage unavailable: the choice just isn't remembered.
  }
}

export const SETTING_TO_SHOW_MAP: Record<string, string> = {
  dunder_mifflin_scranton: 'the_office',
  central_coffee: 'friends',
  hacker_hostel: 'silicon_valley',
  maclarens_pub: 'himym',
  central_perk_iso: 'friends',
  dunder_mifflin_iso: 'the_office',
  maclarens_iso: 'himym',
  hacker_hostel_iso: 'silicon_valley',
};

export function getMergedSettings(): Record<string, SettingDefinition> {
  const custom = loadCustomSettings();
  return { ...ALL_SETTINGS, ...custom };
}

export function getSettingById(settingId: string): SettingDefinition {
  const merged = getMergedSettings();
  return merged[settingId] || ALL_SETTINGS[DEFAULT_SETTING_ID];
}

export function getShowIdForSetting(settingId: string): string {
  if (SETTING_TO_SHOW_MAP[settingId]) {
    return SETTING_TO_SHOW_MAP[settingId];
  }
  const custom = loadCustomSettings();
  if (custom[settingId]) {
    const title = custom[settingId].showTitle?.toLowerCase() || '';
    if (title.includes('office')) return 'the_office';
    if (title.includes('friend')) return 'friends';
    if (title.includes('silicon')) return 'silicon_valley';
    if (title.includes('mother') || title.includes('himym')) return 'himym';
    return 'the_office';
  }
  return 'the_office';
}

