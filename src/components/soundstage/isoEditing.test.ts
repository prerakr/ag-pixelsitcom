import { describe, expect, it } from 'vitest';
import { ALL_SETTINGS } from '../../data/settings';
import { createBlankIsoSetting } from '../../data/settings/customStore';
import { ISO_PROP_CATALOG } from '../../data/sprites/generated/isoAtlas';
import { NavGrid } from '../../engine/NavGrid';
import { faceIsoProp, isIsoProp, stampIsoProp, turnFacing } from './isoEditing';

describe('Set Studio iso editing', () => {
  it('turns through all four facings and back', () => {
    let f = turnFacing('down', 1);
    const seen = [f];
    for (let i = 0; i < 3; i++) seen.push((f = turnFacing(f, 1)));
    expect(seen).toEqual(['left', 'up', 'right', 'down']);
    expect(turnFacing('down', -1)).toBe('right');
  });

  it('stamps a prop centred on the cursor with its real footprint', () => {
    const cat = ISO_PROP_CATALOG.sofa_orange;
    const p = stampIsoProp('sofa_orange', 5, 4, 'down');
    expect(p.width).toBeCloseTo(cat.width);
    expect(p.height).toBeCloseTo(cat.depth);
    expect(p.x + p.width! / 2).toBeCloseTo(5, 1);
    expect(p.y + p.height! / 2).toBeCloseTo(4, 1);
  });

  it('swaps the footprint when turned sideways and keeps the prop centred', () => {
    const p = stampIsoProp('sofa_orange', 5, 4, 'down');
    const turned = { ...p, ...faceIsoProp(p, 'left') };
    expect(turned.width).toBeCloseTo(p.height!);
    expect(turned.height).toBeCloseTo(p.width!);
    expect(turned.x + turned.width! / 2).toBeCloseTo(p.x + p.width! / 2, 1);
    expect(turned.y + turned.height! / 2).toBeCloseTo(p.y + p.height! / 2, 1);
  });

  it('only treats catalogue props on iso sets as iso props', () => {
    expect(isIsoProp(ALL_SETTINGS.central_perk_iso, { type: 'sofa_orange' })).toBe(true);
    expect(isIsoProp(ALL_SETTINGS.central_coffee, { type: 'sofa_orange' })).toBe(false);
    expect(isIsoProp(ALL_SETTINGS.central_perk_iso, { type: 'sofa_leather' })).toBe(false);
  });

  it('makes a new iso set in the style of the current one, walkable inside', () => {
    const like = ALL_SETTINGS.maclarens_iso;
    const s = createBlankIsoSetting(like, 'Test Pub');
    expect(s.projection).toBe('iso');
    expect(s.tileTheme).toBe(like.tileTheme);
    expect(s.tiles['0,0']).toBe(like.tiles['1,0']);
    const nav = NavGrid.fromSetting(s);
    const T = s.tileSize;
    expect(nav.findPath({ x: 2 * T, y: 2 * T }, { x: s.waypoints.room_center.x * T, y: s.waypoints.room_center.y * T })).not.toBeNull();
  });
});
