import { CharacterDefinition } from '../../types/character';

export const HIMYM_CAST: Record<string, CharacterDefinition> = {
  ted: {
    id: 'ted',
    name: 'Ted Mosby',
    nickname: 'Ted',
    role: 'Architect & Romantic',
    showId: 'himym',
    visual: {
      skinColor: '#fce7d2',
      hairColor: '#451a03',
      hairStyle: 'slicked',
      shirtColor: '#991b1b', // Red hoodie / burgundy jacket
      pantsColor: '#1e293b',
      shoesColor: '#991b1b', // Red cowboy boots!
      heightScale: 1.0,
    },
    signatureQuotes: [
      'Kids, let me tell you the story of how I met your mother.',
      'Pulling. Them. Off. (Red Cowboy Boots)',
    ],
    personalityTraits: ['Hopeless romantic', 'Overthinks everything', 'Corrects grammar'],
    defaultWaypoint: 'booth_ted',
    defaultFacing: 'right',
  },
  barney: {
    id: 'barney',
    name: 'Barney Stinson',
    nickname: 'Barney',
    role: 'P.L.E.A.S.E. / Playbook Master',
    showId: 'himym',
    visual: {
      skinColor: '#fed7aa',
      hairColor: '#d97706',
      hairStyle: 'slicked',
      shirtColor: '#0f172a', // Sharp black tailored suit
      tieColor: '#f59e0b', // Silk yellow tie
      pantsColor: '#0f172a',
      shoesColor: '#000000',
      heightScale: 1.02,
    },
    signatureQuotes: [
      'Suit up! It is going to be Legend—wait for it—dary!',
      'Challenge Accepted!',
    ],
    personalityTraits: ['High-fives everyone', 'Wears suits exclusively', 'The Playbook genius'],
    defaultWaypoint: 'booth_barney',
    defaultFacing: 'left',
  },
  marshall: {
    id: 'marshall',
    name: 'Marshall Eriksen',
    nickname: 'Marshall',
    role: 'Environmental Lawyer',
    showId: 'himym',
    visual: {
      skinColor: '#fed7aa',
      hairColor: '#78350f',
      hairStyle: 'short',
      shirtColor: '#0369a1', // Flannel / casual blue shirt
      pantsColor: '#334155',
      shoesColor: '#1e293b',
      bodyType: 'large',
      heightScale: 1.15,
    },
    signatureQuotes: [
      'Lawyered!',
      'That was the best burger in New York City.',
    ],
    personalityTraits: ['Big gentle giant', 'Slap Bet Commissioner', 'Loves Nessie'],
    defaultWaypoint: 'booth_marshall',
    defaultFacing: 'down',
  },
  lily: {
    id: 'lily',
    name: 'Lily Aldrin',
    nickname: 'Lily',
    role: 'Kindergarten Teacher / Art Consultant',
    showId: 'himym',
    visual: {
      skinColor: '#fce7d2',
      hairColor: '#b91c1c', // Auburn red hair
      hairStyle: 'curls',
      shirtColor: '#ec4899', // Bright pink top
      pantsColor: '#1e1b4b',
      shoesColor: '#be185d',
      bodyType: 'petite',
      heightScale: 0.92,
    },
    signatureQuotes: [
      'You son of a beach!',
      'Where is the poop, Robin?',
    ],
    personalityTraits: ['Aldrin Justice', 'Master manipulator', 'Shopaholic'],
    defaultWaypoint: 'booth_lily',
    defaultFacing: 'right',
  },
  robin: {
    id: 'robin',
    name: 'Robin Scherbatsky',
    nickname: 'Robin',
    role: 'World Wide News Anchor / Robin Sparkles',
    showId: 'himym',
    visual: {
      skinColor: '#fce7d2',
      hairColor: '#292524',
      hairStyle: 'floppy',
      shirtColor: '#475569', // Leather jacket / chic blazer
      pantsColor: '#18181b',
      shoesColor: '#09090b',
      heightScale: 1.03,
    },
    signatureQuotes: [
      'Let’s go to the Mall, today!',
      'Nobody asked you, Patrice!',
    ],
    personalityTraits: ['Canadian pride', 'Gun enthusiast', 'Scotch drinker'],
    defaultWaypoint: 'bar_stool_robin',
    defaultFacing: 'up',
  },
  carl: {
    id: 'carl',
    name: 'Carl the Bartender',
    nickname: 'Carl',
    role: "MacLaren's Head Bartender & Proprietor",
    showId: 'himym',
    visual: {
      skinColor: '#fed7aa',
      hairColor: '#451a03',
      hairStyle: 'short',
      shirtColor: '#ffffff', // White button-up + black vest
      tieColor: '#1e293b',
      pantsColor: '#0f172a',
      shoesColor: '#000000',
      facialHair: 'stubble',
      heightScale: 1.04,
    },
    signatureQuotes: [
      "Here's your pitcher of Wharmpess, guys.",
      "Barney, you can't run a bachelor auction at table 4.",
    ],
    personalityTraits: ['Pub owner', 'Keeps the peace', 'Never forgets a tab'],
    defaultWaypoint: 'bartender_station',
    defaultFacing: 'down',
  },
  ranjit: {
    id: 'ranjit',
    name: 'Ranjit',
    nickname: 'Ranjit',
    role: 'NYC Cab & Limo Driver',
    showId: 'himym',
    visual: {
      skinColor: '#a16207',
      hairColor: '#18181b',
      hairStyle: 'slicked',
      shirtColor: '#eab308', // Yellow cabbie blazer
      tieColor: '#1e293b',
      pantsColor: '#334155',
      shoesColor: '#0f172a',
      facialHair: 'mustache',
      heightScale: 0.98,
    },
    signatureQuotes: [
      'Hello! To MacLaren’s Pub!',
      'Mr. Barney, where are we driving tonight?!',
    ],
    personalityTraits: ['Eternal optimism', 'Best cabbie in NYC', 'Always says Hello'],
    defaultWaypoint: 'ranjit_stool',
    defaultFacing: 'up',
  },
  wendy: {
    id: 'wendy',
    name: 'Wendy the Waitress',
    nickname: 'Wendy',
    role: "MacLaren's Waitress",
    showId: 'himym',
    visual: {
      skinColor: '#fce7d2',
      hairColor: '#ca8a04',
      hairStyle: 'floppy',
      shirtColor: '#1e293b', // Black MacLaren's tee
      pantsColor: '#475569',
      shoesColor: '#0f172a',
      bodyType: 'petite',
      heightScale: 0.96,
    },
    signatureQuotes: [
      'One basket of buffalo wings and five pints coming right up!',
      'Barney, is this another fake bet?',
    ],
    personalityTraits: ['Cheerful server', 'Friendly smile', 'Dated Barney once'],
    defaultWaypoint: 'waitress_station',
    defaultFacing: 'left',
  },
  patrice: {
    id: 'patrice',
    name: 'Patrice',
    nickname: 'Patrice',
    role: 'World Wide News Producer / Robin’s Friend',
    showId: 'himym',
    visual: {
      skinColor: '#fed7aa',
      hairColor: '#451a03',
      hairStyle: 'curls',
      shirtColor: '#f43f5e', // Pink cardigan with floral brooch
      pantsColor: '#4c0519',
      shoesColor: '#881337',
      bodyType: 'large',
      heightScale: 1.0,
    },
    signatureQuotes: [
      'Robin! I baked fresh snickerdoodles for everyone in the bullpen!',
      'Nobody asked you, Patrice! (imitating Robin)',
    ],
    personalityTraits: ['Incurably kind', 'Bakes treats', 'Endures Robin yelling'],
    defaultWaypoint: 'high_top_patrice',
    defaultFacing: 'right',
  },
  the_captain: {
    id: 'the_captain',
    name: 'The Captain',
    nickname: 'The Captain',
    role: 'George Van Smoot / Seafaring Millionaire',
    showId: 'himym',
    visual: {
      skinColor: '#fdf2e9',
      hairColor: '#cbd5e1', // Silver white distinguished hair
      hairStyle: 'slicked',
      shirtColor: '#1e3a8a', // Nautical navy captain blazer with gold buttons
      tieColor: '#dc2626', // Red cravat
      pantsColor: '#f8fafc', // Crisp white trousers
      shoesColor: '#78350f',
      heightScale: 1.08,
    },
    signatureQuotes: [
      'Ahoy! Have you seen my yacht, the Oceanic?',
      'My eyes are smiling, but my mouth is furious!',
    ],
    personalityTraits: ['Nautical obsession', 'Bizarre stare', 'Old money billionaire'],
    defaultWaypoint: 'booth_captain',
    defaultFacing: 'down',
  },
};
