import { describe, expect, it } from 'vitest';
import { ALL_CHARACTERS } from '../data/characters';
import { ALL_SETTINGS, settingForStyle } from '../data/settings';
import { PRESET_EPISODES } from '../data/episodes';
import { ScriptBeat, SitcomScript } from '../types/script';
import { ScriptPlayer, StageEffects } from './ScriptPlayer';

const OFFICE = ALL_SETTINGS.dunder_mifflin_scranton;
const T = OFFICE.tileSize;

/** Effects that record what was asked of the stage. */
function recorder() {
  const calls: string[] = [];
  const fx: StageEffects = {
    sfx: (s) => calls.push(`sfx:${s}`),
    timeOfDay: (t, instant) => calls.push(`tod:${t}:${instant ? 'instant' : 'fade'}`),
    duckMusic: (d) => calls.push(`duck:${d}`),
    shake: () => calls.push('shake'),
    focusSpeaker: () => calls.push('focus'),
    cameraCue: () => calls.push('camera'),
    paperAirplane: () => calls.push('plane'),
    spillCoffee: () => calls.push('spill'),
    extinguisherFoam: () => calls.push('foam'),
    talkingHead: (b) => calls.push(`th:${b ? 'on' : 'off'}`),
  };
  return { fx, calls };
}

/** World state that seeking must reproduce, rounded so float noise doesn't matter. */
function snapshot(player: ScriptPlayer) {
  const chars = player.states.map((s) => ({
    id: s.id,
    x: Math.round(s.x),
    y: Math.round(s.y),
    facing: s.facing,
    sitting: !!s.isSitting,
    held: s.heldItem ?? null,
    state: s.state,
  }));
  const props = Object.fromEntries([...player.propStates.entries()].sort());
  return { chars, props };
}

/** Plays from the current beat until the playhead reaches (scene, beat), at 60 fps. */
function playUntil(player: ScriptPlayer, scene: number, beat: number) {
  for (let i = 0; i < 200000; i++) {
    if (player.sceneIdx === scene && player.beatIdx === beat) return;
    if (player.activeTalkingHead) player.next();
    else player.update(1000 / 60, true);
  }
  throw new Error(`never reached ${scene}:${beat}`);
}

/** Lets in-flight walks finish without advancing the timeline. */
function settle(player: ScriptPlayer) {
  for (let i = 0; i < 2000 && player.states.some((s) => s.isMoving); i++) player.update(1000 / 60, false);
}

const WALK_SCRIPT: SitcomScript = {
  version: '1.0',
  title: 'Walk test',
  showId: 'the_office',
  settingId: OFFICE.id,
  synopsis: '',
  characters: ['jim', 'dwight', 'pam'],
  scenes: [
    {
      id: 's1',
      name: 'One',
      beats: [
        { type: 'dialogue', speaker: 'jim', text: 'Morning.' },
        { type: 'movement', character: 'jim', target: 'photocopier' },
        { type: 'interaction', character: 'jim', action: 'pickup', item: 'paper_sheet', targetProp: 'prop_photocopier' },
        { type: 'movement', character: 'dwight', target: 'bullpen_center' },
        { type: 'audio_cue', sfx: 'rimshot' },
      ],
    },
    {
      id: 's2',
      name: 'Two',
      timeOfDay: 'night',
      beats: [
        { type: 'movement', character: 'pam', target: 'reception_desk' },
        { type: 'dialogue', speaker: 'pam', text: 'Goodnight.' },
      ],
    },
  ],
};

describe('ScriptPlayer', () => {
  it('routes walks around furniture rather than in a straight line', () => {
    const player = new ScriptPlayer(OFFICE, ALL_CHARACTERS);
    player.load({
      ...WALK_SCRIPT,
      scenes: [{ id: 's', name: 's', beats: [{ type: 'movement', character: 'jim', target: 'water_cooler' }] }],
    });
    const jim = player.characterStates.get('jim')!;
    expect(jim.isMoving).toBe(true);
    for (const p of jim.route!) expect(player.nav.isWalkable(p.x, p.y)).toBe(true);
    settle(player);
    const wp = OFFICE.waypoints.water_cooler;
    expect(Math.round(jim.x)).toBe(Math.round(wp.x * T));
    expect(Math.round(jim.y)).toBe(Math.round(wp.y * T));
    expect(jim.isMoving).toBe(false);
  });

  it('sits a character who walks to a free seat, facing the way the seat faces', () => {
    const pub = ALL_SETTINGS.maclarens_iso;
    const player = new ScriptPlayer(pub, ALL_CHARACTERS);
    player.load({
      ...WALK_SCRIPT,
      showId: 'himym',
      settingId: pub.id,
      characters: ['barney', 'ted'],
      scenes: [{ id: 's', name: 's', beats: [{ type: 'movement', character: 'barney', target: 'bar_stool_1', facing: 'left' }] }],
    });
    settle(player);
    const barney = player.characterStates.get('barney')!;
    expect(barney.isSitting).toBe(true);
    expect(barney.facing).toBe(pub.props.find((p) => p.id === 'prop_bar_stool_1')!.facing);
  });

  it('leaves a second walker standing beside a seat someone already has', () => {
    const pub = ALL_SETTINGS.maclarens_iso;
    const player = new ScriptPlayer(pub, ALL_CHARACTERS);
    player.load({
      ...WALK_SCRIPT,
      showId: 'himym',
      settingId: pub.id,
      characters: ['barney', 'ted'],
      scenes: [{ id: 's', name: 's', beats: [{ type: 'movement', character: 'ted', target: 'booth_barney' }] }],
    });
    settle(player);
    const barney = player.characterStates.get('barney')!;
    const ted = player.characterStates.get('ted')!;
    expect(barney.isSitting).toBe(true);
    expect(ted.isSitting).toBe(false);
    expect(Math.hypot(ted.x - barney.x, ted.y - barney.y)).toBeGreaterThan(12);
  });

  it('restores earlier positions and props when stepping back', () => {
    const player = new ScriptPlayer(OFFICE, ALL_CHARACTERS);
    player.load(WALK_SCRIPT);
    const opening = snapshot(player);
    playUntil(player, 0, 4);
    settle(player);
    expect(player.characterStates.get('jim')!.heldItem).toBe('paper_sheet');

    player.jumpTo(0, 0);
    expect(snapshot(player)).toEqual(opening);
    expect(player.propStates.size).toBe(0);
  });

  it('seeking to a beat matches playing up to it', () => {
    const played = new ScriptPlayer(OFFICE, ALL_CHARACTERS);
    played.load(WALK_SCRIPT);
    playUntil(played, 1, 0);
    // The target beat starts the same way in both; let its walk finish before comparing.
    settle(played);

    const sought = new ScriptPlayer(OFFICE, ALL_CHARACTERS);
    sought.load(WALK_SCRIPT);
    sought.jumpTo(1, 0);
    settle(sought);
    expect(snapshot(sought)).toEqual(snapshot(played));
  });

  it('replays silently and lights the target scene instantly', () => {
    const { fx, calls } = recorder();
    const player = new ScriptPlayer(OFFICE, ALL_CHARACTERS, fx);
    player.load(WALK_SCRIPT);
    calls.length = 0;
    player.jumpTo(1, 1);
    expect(calls).not.toContain('sfx:rimshot');
    expect(calls).toContain('tod:night:instant');
    // Only the target beat itself performs: Pam's line frames her.
    expect(calls.filter((c) => c === 'focus')).toHaveLength(1);
  });

  it("applies a scene's time of day when playback enters it", () => {
    const { fx, calls } = recorder();
    const player = new ScriptPlayer(OFFICE, ALL_CHARACTERS, fx);
    player.load(WALK_SCRIPT);
    playUntil(player, 1, 0);
    expect(calls).toContain('tod:night:fade');
  });

  // Every preset plays on its show's isometric stage (the default) and on the legacy top-down set.
  for (const episode of PRESET_EPISODES) for (const style of ['iso', 'legacy'] as const) {
    const settingId = settingForStyle(episode.settingId, style);

    it(`finds every place "${episode.title}" names in ${settingId}`, () => {
      const setting = ALL_SETTINGS[settingId];
      const places = new Set([...Object.keys(setting.waypoints), ...setting.props.map((p) => p.id), ...episode.characters, 'overview']);
      const missing = new Set<string>();
      const visit = (b: ScriptBeat) => {
        if (b.type === 'group_action') b.actions.forEach(visit);
        else if (b.type === 'movement' && typeof b.target === 'string' && !places.has(b.target)) missing.add(b.target);
        else if (b.type === 'interaction' && b.targetProp && !places.has(b.targetProp)) missing.add(b.targetProp);
        else if (b.type === 'camera_cue' && typeof b.target === 'string' && !places.has(b.target)) missing.add(b.target);
      };
      episode.scenes.forEach((sc) => sc.beats.forEach(visit));
      for (const id of episode.characters) {
        const c = ALL_CHARACTERS[id];
        if (c && !setting.spawnPoints[id] && !setting.waypoints[c.defaultWaypoint]) missing.add(`spawn of ${id}`);
      }
      expect([...missing]).toEqual([]);
    });

    it(`plays "${episode.title}" in ${settingId} to the end and seeks consistently`, () => {
      const setting = ALL_SETTINGS[settingId];
      expect(setting, `unknown setting ${settingId}`).toBeDefined();

      let ended = false;
      const player = new ScriptPlayer(setting, ALL_CHARACTERS, undefined, { onEpisodeEnd: () => (ended = true) });
      player.load(episode);
      for (let i = 0; i < 400000 && !ended; i++) {
        if (player.activeTalkingHead) player.next();
        else player.update(1000 / 30, true);
      }
      expect(ended).toBe(true);

      // Landing on a beat gives the same world however you got there.
      const lastScene = episode.scenes.length - 1;
      const mid = Math.floor(episode.scenes.length / 2);
      const midBeat = Math.floor(episode.scenes[mid].beats.length / 2);
      player.jumpTo(mid, midBeat);
      const direct = snapshot(player);
      player.jumpTo(lastScene, episode.scenes[lastScene].beats.length - 1);
      player.jumpTo(0, 0);
      player.jumpTo(mid, midBeat);
      expect(snapshot(player)).toEqual(direct);
    });
  }
});
