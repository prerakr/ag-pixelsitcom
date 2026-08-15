import { CharacterDefinition } from '../../types/character';

export const OFFICE_CAST: Record<string, CharacterDefinition> = {
  michael: {
    id: 'michael',
    name: 'Michael Scott',
    nickname: 'Michael',
    role: 'Regional Manager',
    showId: 'the_office',
    visual: {
      skinColor: '#f7cfb2',
      hairColor: '#2b231d',
      hairStyle: 'slicked',
      shirtColor: '#2b4c7e', // Navy blue suit jacket
      tieColor: '#991b1b', // Red power tie
      pantsColor: '#1e293b',
      shoesColor: '#0f172a',
      accessory: 'id_badge',
      heightScale: 1.0,
    },
    signatureQuotes: [
      "That's what she said!",
      "I am Beyoncé, always.",
      "I'm not superstitious, but I am a little stitious.",
      "Would I rather be feared or loved? Easy. Both. I want people to be afraid of how much they love me.",
      "PARKOUR!",
    ],
    personalityTraits: ['Dramatic', 'Eager to please', 'Chaos magnet', 'Misunderstands common idioms'],
    defaultWaypoint: 'michael_desk',
    defaultFacing: 'down',
  },

  dwight: {
    id: 'dwight',
    name: 'Dwight Schrute',
    nickname: 'Dwight',
    role: 'Assistant to the Regional Manager / Safety Officer',
    showId: 'the_office',
    visual: {
      skinColor: '#fadcbf',
      hairColor: '#785428',
      hairStyle: 'middle_part', // Iconic center part
      shirtColor: '#ca8a04', // Signature mustard yellow short sleeve
      tieColor: '#451a03', // Dark brown tie
      pantsColor: '#451a03', // Brown slacks
      shoesColor: '#1c1917',
      glasses: true,
      glassesColor: '#57534e',
      heightScale: 1.05,
    },
    signatureQuotes: [
      "Identity theft is not a joke, Jim! Millions of families suffer every year!",
      "Bears. Beets. Battlestar Galactica.",
      "FALSE. Black bear is best.",
      "Today, smoking is going to save lives.",
      "Whenever I'm about to do something, I think, 'Would an idiot do that?' And if they would, I do not do that thing.",
    ],
    personalityTraits: ['Vigilant', 'Beet farmer', 'Martial arts enthusiast', 'Literal-minded', 'Prank victim'],
    defaultWaypoint: 'dwight_desk',
    defaultFacing: 'up',
  },

  jim: {
    id: 'jim',
    name: 'Jim Halpert',
    nickname: 'Jim',
    role: 'Sales Representative',
    showId: 'the_office',
    visual: {
      skinColor: '#f7cfb2',
      hairColor: '#4a3728',
      hairStyle: 'floppy', // Messy floppy hair
      shirtColor: '#93c5fd', // Light blue dress shirt
      tieColor: '#1e3a8a', // Dark blue tie
      pantsColor: '#334155', // Charcoal trousers
      shoesColor: '#0f172a',
      heightScale: 1.08,
    },
    signatureQuotes: [
      "Right now, this is just a job. If I advance any higher in this company, then this would be my career. And, uh, if this were my career, I'd have to throw myself in front of a train.",
      "Question: What bear is best?",
      "I am a black belt in gift wrapping.",
      "Not a bad day.",
    ],
    personalityTraits: ['Prankster', 'Charming', 'Looks directly at the camera', 'Slacker genius'],
    defaultWaypoint: 'jim_desk',
    defaultFacing: 'down',
  },

  pam: {
    id: 'pam',
    name: 'Pam Beesly',
    nickname: 'Pam',
    role: 'Receptionist / Office Administrator',
    showId: 'the_office',
    visual: {
      skinColor: '#fce7d2',
      hairColor: '#b45309', // Curly auburn hair
      hairStyle: 'curls',
      shirtColor: '#f472b6', // Pink cardigan
      pantsColor: '#475569',
      shoesColor: '#334155',
      accessory: 'cardigan',
      bodyType: 'petite',
      heightScale: 0.95,
    },
    signatureQuotes: [
      "Dunder Mifflin, this is Pam.",
      "There's a lot of beauty in ordinary things. Isn't that kind of the point?",
      "I hate the idea that someone out there is not eating jello because of Jim.",
      "Yup.",
    ],
    personalityTraits: ['Supportive', 'Prank accomplice', 'Observant', 'Warm'],
    defaultWaypoint: 'pam_seat',
    defaultFacing: 'down',
  },

  angela: {
    id: 'angela',
    name: 'Angela Martin',
    nickname: 'Angela',
    role: 'Head of Accounting / Party Planning Committee',
    showId: 'the_office',
    visual: {
      skinColor: '#fdf2e9',
      hairColor: '#fde047', // Blonde tight hair
      hairStyle: 'tight_bun',
      shirtColor: '#94a3b8', // Strict grey turtleneck
      pantsColor: '#475569',
      shoesColor: '#1e293b',
      bodyType: 'petite',
      heightScale: 0.9,
    },
    signatureQuotes: [
      "Save Bandit!",
      "I have a lot of questions. Number one: How dare you?",
      "Poop is raining from the ceilings. POOP!",
      "I don't back down. My family has a lot of pride.",
    ],
    personalityTraits: ['Stern', 'Cat obsessed', 'Judgemental', 'Strict rules'],
    defaultWaypoint: 'angela_desk',
    defaultFacing: 'down',
  },

  kevin: {
    id: 'kevin',
    name: 'Kevin Malone',
    nickname: 'Kevin',
    role: 'Accountant / Scrantonic Drummer',
    showId: 'the_office',
    visual: {
      skinColor: '#fed7aa',
      hairColor: '#3e2723',
      hairStyle: 'balding', // Balding sides
      shirtColor: '#334155', // Dark grey suit jacket
      tieColor: '#0284c7', // Blue tie
      pantsColor: '#1e293b',
      shoesColor: '#0f172a',
      bodyType: 'large',
      heightScale: 1.02,
    },
    signatureQuotes: [
      "Why waste time say lot word when few word do trick?",
      "It's a secret. You wouldn't understand.",
      "The secret is to undercook the onions. Everybody is going to get to know each other in the pot.",
      "It's Ashton Kutcher!",
    ],
    personalityTraits: ['Chili master', 'Keleven arithmetic', 'Loves snacks', 'Slow speaker'],
    defaultWaypoint: 'kevin_desk',
    defaultFacing: 'up',
  },

  stanley: {
    id: 'stanley',
    name: 'Stanley Hudson',
    nickname: 'Stanley',
    role: 'Senior Sales Representative',
    showId: 'the_office',
    visual: {
      skinColor: '#8d5b4c',
      hairColor: '#1c1917',
      hairStyle: 'short',
      shirtColor: '#78350f', // Brown tweed suit
      tieColor: '#dc2626',
      pantsColor: '#451a03',
      shoesColor: '#1c1917',
      facialHair: 'mustache', // Signature mustache
      heightScale: 1.0,
    },
    signatureQuotes: [
      "Did I stutter?",
      "I wake up every morning in a bed that's too small, drive my daughter to a school that's too expensive, and then I go to work to a job for which I get paid too little. But on pretzel day? Well, I like pretzel day.",
      "Shove it up your butt!",
    ],
    personalityTraits: ['Pretzel enthusiast', 'Crossword puzzle master', 'Unbothered', 'Countdown to 5 PM'],
    defaultWaypoint: 'stanley_desk',
    defaultFacing: 'down',
  },

  toby: {
    id: 'toby',
    name: 'Toby Flenderson',
    nickname: 'Toby',
    role: 'HR Representative',
    showId: 'the_office',
    visual: {
      skinColor: '#f7cfb2',
      hairColor: '#785428',
      hairStyle: 'short',
      shirtColor: '#a8a29e', // Drab khaki/beige suit
      tieColor: '#713f12',
      pantsColor: '#57534e',
      shoesColor: '#292524',
      heightScale: 0.98,
    },
    signatureQuotes: [
      "We should probably take this to HR.",
      "Michael, you can't say that in a company email.",
      "I have to go back to the Annex.",
    ],
    personalityTraits: ['Soft spoken', 'Michael Scott nemesis', 'Long-suffering', 'Annex dweller'],
    defaultWaypoint: 'annex_toby',
    defaultFacing: 'down',
  },
};
