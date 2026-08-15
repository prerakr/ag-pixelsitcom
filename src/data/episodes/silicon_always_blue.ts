import { SitcomScript } from '../../types/script';

export const SILICON_ALWAYS_BLUE_EPISODE: SitcomScript = {
  version: '1.0',
  title: 'The Always Blue Championship',
  showId: 'silicon_valley',
  settingId: 'hacker_hostel',
  synopsis:
    'Waiting for their beta release build to compile, the Pied Piper crew engages in a high-stakes, hostel-wide game of Always Blue, interrupted by Jian-Yang and Monica Hall.',
  author: 'Writer Room',
  characters: ['richard', 'erlich', 'dinesh', 'gilfoyle', 'jared', 'jianyang', 'monica_hall'],
  scenes: [
    {
      id: 'scene_1',
      name: 'Scene 1: The Incantation',
      timeOfDay: 'day',
      synopsis: 'The team gathers around the living room table tossing the color-changing ball.',
      beats: [
        {
          type: 'movement',
          character: 'erlich',
          target: 'living_room_center',
          speed: 1.0,
          facing: 'down',
        },
        {
          type: 'dialogue',
          speaker: 'erlich',
          text: 'Thirty seconds until build compilation finishes. Gentlemen, toss the orb of destiny.',
          emotion: 'smug',
          sfx: 'laugh_track',
          emote: 'lightbulb',
          durationMs: 3800,
        },
        {
          type: 'group_action',
          actions: [
            {
              type: 'dialogue',
              speaker: 'richard',
              text: 'Always blue! Always blue! Always blue!',
              emotion: 'happy',
              durationMs: 3200,
            },
            {
              type: 'dialogue',
              speaker: 'dinesh',
              text: 'Always blue! Always blue!',
              emotion: 'happy',
              durationMs: 3200,
            },
            {
              type: 'dialogue',
              speaker: 'jared',
              text: 'Always blue! Yes! Radical synergy!',
              emotion: 'happy',
              durationMs: 3200,
            },
          ],
        },
        {
          type: 'dialogue',
          speaker: 'gilfoyle',
          text: 'It is mathematically guaranteed to turn orange on Dinesh’s catch. Probability does not care about your chanting.',
          emotion: 'deadpan',
          sfx: 'rimshot',
          durationMs: 4000,
        },
      ],
    },
    {
      id: 'scene_2',
      name: 'Scene 2: Monica’s Urgent Notice',
      timeOfDay: 'night',
      synopsis: 'Monica Hall arrives with crucial metrics from Raviga Capital.',
      beats: [
        {
          type: 'time_of_day',
          time: 'night',
          durationMs: 1000,
        },
        {
          type: 'movement',
          character: 'monica_hall',
          target: 'living_room_center',
          speed: 1.3,
          facing: 'down',
        },
        {
          type: 'dialogue',
          speaker: 'monica_hall',
          text: 'Guys, Raviga’s board saw the beta numbers. You just hit half a million daily active users!',
          emotion: 'happy',
          sfx: 'cheer',
          emote: 'exclamation',
          durationMs: 4000,
        },
        {
          type: 'dialogue',
          speaker: 'richard',
          text: 'Half a million?! Jared, start hyperventilating into the paper bag, I am about to pass out!',
          emotion: 'shock',
          sfx: 'gasp',
          emote: 'panic',
          durationMs: 4200,
        },
        {
          type: 'dialogue',
          speaker: 'jianyang',
          text: 'SeeFood now has zero active users. But I am still living here for free.',
          emotion: 'deadpan',
          sfx: 'laugh_roar',
          durationMs: 3600,
        },
      ],
    },
  ],
};
