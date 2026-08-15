import { soundEngine } from './SoundEngine';

export interface NoteEvent {
  step: number; // 0 to totalSteps - 1 (16th notes)
  note: string | number;
  durationSteps?: number; // In 16th notes
  vol?: number;
}

export interface ChordEvent {
  step: number;
  notes: (string | number)[];
  durationSteps?: number;
  vol?: number;
}

export interface DrumEvent {
  step: number;
  type: 'kick' | 'snare' | 'hihat' | 'openhat';
  vol?: number;
}

export interface ThemeScore {
  id: string;
  name: string;
  bpm: number;
  totalSteps: number; // typically 32 (2 bars) or 64 (4 bars)
  lead: NoteEvent[];
  chords: ChordEvent[];
  bass: NoteEvent[];
  drums: DrumEvent[];
}

const NOTE_MAP: Record<string, number> = {
  C: 0,
  'C#': 1,
  DB: 1,
  D: 2,
  'D#': 3,
  EB: 3,
  E: 4,
  F: 5,
  'F#': 6,
  GB: 6,
  G: 7,
  'G#': 8,
  AB: 8,
  A: 9,
  'A#': 10,
  BB: 10,
  B: 11,
};

function noteToFreq(note: string | number): number {
  if (typeof note === 'number') return note;
  const match = note.trim().toUpperCase().match(/^([A-G][#B]?)(-?\d+)$/);
  if (!match) return 440;
  const key = match[1];
  const octave = parseInt(match[2], 10);
  const semitone = NOTE_MAP[key] ?? 9;
  const midi = (octave + 1) * 12 + semitone;
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// ---------------- SHOW THEME COMPOSITIONS ----------------

export const SHOW_THEMES: Record<string, ThemeScore> = {
  // 1. THE OFFICE (Dunder Mifflin Scranton) - Jaunty 8-bit Melodica/Piano in G Major
  dunder_mifflin_scranton: {
    id: 'dunder_mifflin_scranton',
    name: 'Scranton Paper Groove',
    bpm: 130,
    totalSteps: 64, // 4 bars
    lead: [
      // Bar 1 (G Major)
      { step: 0, note: 'G4', durationSteps: 2, vol: 0.8 },
      { step: 3, note: 'B4', durationSteps: 2, vol: 0.8 },
      { step: 6, note: 'D5', durationSteps: 3, vol: 0.9 },
      { step: 10, note: 'E5', durationSteps: 4, vol: 0.95 },
      { step: 14, note: 'D5', durationSteps: 2, vol: 0.8 },
      // Bar 2 (B Minor / C Major)
      { step: 16, note: 'B4', durationSteps: 3, vol: 0.8 },
      { step: 20, note: 'C5', durationSteps: 2, vol: 0.85 },
      { step: 24, note: 'D5', durationSteps: 4, vol: 0.9 },
      { step: 30, note: 'B4', durationSteps: 2, vol: 0.75 },
      // Bar 3 (G Major)
      { step: 32, note: 'G4', durationSteps: 2, vol: 0.8 },
      { step: 35, note: 'B4', durationSteps: 2, vol: 0.8 },
      { step: 38, note: 'D5', durationSteps: 3, vol: 0.9 },
      { step: 42, note: 'E5', durationSteps: 4, vol: 0.95 },
      { step: 46, note: 'D5', durationSteps: 2, vol: 0.8 },
      // Bar 4 (C Major / D Major turnaround)
      { step: 48, note: 'C5', durationSteps: 3, vol: 0.85 },
      { step: 52, note: 'B4', durationSteps: 2, vol: 0.8 },
      { step: 56, note: 'A4', durationSteps: 4, vol: 0.85 },
      { step: 62, note: 'G4', durationSteps: 2, vol: 0.9 },
    ],
    chords: [
      // Bar 1: G Maj (G3, B3, D4)
      { step: 0, notes: ['G3', 'B3', 'D4'], durationSteps: 3, vol: 0.45 },
      { step: 6, notes: ['G3', 'B3', 'D4'], durationSteps: 2, vol: 0.4 },
      { step: 10, notes: ['G3', 'B3', 'D4'], durationSteps: 3, vol: 0.45 },
      // Bar 2: Bm (B3, D4, F#4) -> C (C3, E3, G3)
      { step: 16, notes: ['B3', 'D4', 'F#4'], durationSteps: 3, vol: 0.45 },
      { step: 24, notes: ['C3', 'E3', 'G3'], durationSteps: 4, vol: 0.5 },
      // Bar 3: G Maj
      { step: 32, notes: ['G3', 'B3', 'D4'], durationSteps: 3, vol: 0.45 },
      { step: 38, notes: ['G3', 'B3', 'D4'], durationSteps: 2, vol: 0.4 },
      { step: 42, notes: ['G3', 'B3', 'D4'], durationSteps: 3, vol: 0.45 },
      // Bar 4: C -> D (D3, F#3, A3)
      { step: 48, notes: ['C3', 'E3', 'G3'], durationSteps: 3, vol: 0.45 },
      { step: 56, notes: ['D3', 'F#3', 'A3'], durationSteps: 6, vol: 0.5 },
    ],
    bass: [
      // Bar 1: Walking G
      { step: 0, note: 'G2', durationSteps: 3, vol: 0.7 },
      { step: 4, note: 'G2', durationSteps: 2, vol: 0.6 },
      { step: 8, note: 'B2', durationSteps: 3, vol: 0.65 },
      { step: 12, note: 'D3', durationSteps: 3, vol: 0.7 },
      // Bar 2: B -> C
      { step: 16, note: 'B2', durationSteps: 3, vol: 0.65 },
      { step: 20, note: 'D3', durationSteps: 3, vol: 0.65 },
      { step: 24, note: 'C3', durationSteps: 4, vol: 0.7 },
      { step: 28, note: 'E3', durationSteps: 3, vol: 0.65 },
      // Bar 3: G
      { step: 32, note: 'G2', durationSteps: 3, vol: 0.7 },
      { step: 36, note: 'G2', durationSteps: 2, vol: 0.6 },
      { step: 40, note: 'B2', durationSteps: 3, vol: 0.65 },
      { step: 44, note: 'D3', durationSteps: 3, vol: 0.7 },
      // Bar 4: C -> D
      { step: 48, note: 'C3', durationSteps: 3, vol: 0.7 },
      { step: 52, note: 'E3', durationSteps: 3, vol: 0.65 },
      { step: 56, note: 'D3', durationSteps: 4, vol: 0.75 },
      { step: 60, note: 'F#2', durationSteps: 3, vol: 0.65 },
    ],
    drums: [
      // Kick & Snare standard sitcom rhythm with 8th hihats
      { step: 0, type: 'kick' },
      { step: 4, type: 'snare' },
      { step: 8, type: 'kick' },
      { step: 10, type: 'kick' },
      { step: 12, type: 'snare' },
      { step: 16, type: 'kick' },
      { step: 20, type: 'snare' },
      { step: 24, type: 'kick' },
      { step: 26, type: 'kick' },
      { step: 28, type: 'snare' },
      { step: 32, type: 'kick' },
      { step: 36, type: 'snare' },
      { step: 40, type: 'kick' },
      { step: 42, type: 'kick' },
      { step: 44, type: 'snare' },
      { step: 48, type: 'kick' },
      { step: 52, type: 'snare' },
      { step: 56, type: 'kick' },
      { step: 58, type: 'kick' },
      { step: 60, type: 'snare' },
    ],
  },

  // 2. FRIENDS (Central Perk) - Breezy Coffeehouse Acoustic Pop in A Major
  central_coffee: {
    id: 'central_coffee',
    name: 'Coffeehouse Acoustic Perk',
    bpm: 118,
    totalSteps: 64,
    lead: [
      // Bar 1 (A Major)
      { step: 0, note: 'A4', durationSteps: 2, vol: 0.8 },
      { step: 2, note: 'C#5', durationSteps: 2, vol: 0.85 },
      { step: 4, note: 'E5', durationSteps: 4, vol: 0.9 },
      { step: 10, note: 'C#5', durationSteps: 3, vol: 0.8 },
      { step: 14, note: 'A4', durationSteps: 2, vol: 0.75 },
      // Bar 2 (F#m / D)
      { step: 16, note: 'F#4', durationSteps: 2, vol: 0.8 },
      { step: 18, note: 'A4', durationSteps: 2, vol: 0.85 },
      { step: 20, note: 'D5', durationSteps: 4, vol: 0.9 },
      { step: 26, note: 'C#5', durationSteps: 3, vol: 0.8 },
      { step: 30, note: 'B4', durationSteps: 2, vol: 0.75 },
      // Bar 3 (A Major)
      { step: 32, note: 'A4', durationSteps: 2, vol: 0.8 },
      { step: 34, note: 'C#5', durationSteps: 2, vol: 0.85 },
      { step: 36, note: 'E5', durationSteps: 4, vol: 0.9 },
      { step: 42, note: 'F#5', durationSteps: 4, vol: 0.95 },
      // Bar 4 (E Major turnaround with bright chord arpeggio)
      { step: 48, note: 'E5', durationSteps: 3, vol: 0.9 },
      { step: 52, note: 'D5', durationSteps: 2, vol: 0.8 },
      { step: 56, note: 'C#5', durationSteps: 3, vol: 0.85 },
      { step: 60, note: 'B4', durationSteps: 3, vol: 0.8 },
    ],
    chords: [
      { step: 0, notes: ['A3', 'C#4', 'E4'], durationSteps: 4, vol: 0.45 },
      { step: 6, notes: ['A3', 'C#4', 'E4'], durationSteps: 3, vol: 0.4 },
      { step: 12, notes: ['A3', 'C#4', 'E4'], durationSteps: 3, vol: 0.45 },
      { step: 16, notes: ['F#3', 'A3', 'C#4'], durationSteps: 4, vol: 0.45 },
      { step: 24, notes: ['D3', 'F#3', 'A3'], durationSteps: 4, vol: 0.45 },
      { step: 32, notes: ['A3', 'C#4', 'E4'], durationSteps: 4, vol: 0.45 },
      { step: 40, notes: ['A3', 'C#4', 'E4'], durationSteps: 3, vol: 0.4 },
      { step: 48, notes: ['E3', 'G#3', 'B3'], durationSteps: 6, vol: 0.5 },
      { step: 56, notes: ['E3', 'G#3', 'B3'], durationSteps: 6, vol: 0.5 },
    ],
    bass: [
      { step: 0, note: 'A2', durationSteps: 4, vol: 0.7 },
      { step: 6, note: 'C#3', durationSteps: 2, vol: 0.6 },
      { step: 8, note: 'E2', durationSteps: 4, vol: 0.65 },
      { step: 16, note: 'F#2', durationSteps: 4, vol: 0.7 },
      { step: 24, note: 'D2', durationSteps: 4, vol: 0.7 },
      { step: 32, note: 'A2', durationSteps: 4, vol: 0.7 },
      { step: 40, note: 'C#3', durationSteps: 3, vol: 0.6 },
      { step: 48, note: 'E2', durationSteps: 4, vol: 0.75 },
      { step: 56, note: 'B2', durationSteps: 4, vol: 0.7 },
    ],
    drums: [
      { step: 0, type: 'kick' },
      { step: 4, type: 'snare' },
      { step: 8, type: 'kick' },
      { step: 12, type: 'snare' },
      { step: 16, type: 'kick' },
      { step: 20, type: 'snare' },
      { step: 24, type: 'kick' },
      { step: 28, type: 'snare' },
      { step: 32, type: 'kick' },
      { step: 36, type: 'snare' },
      { step: 40, type: 'kick' },
      { step: 44, type: 'snare' },
      { step: 48, type: 'kick' },
      { step: 52, type: 'snare' },
      { step: 56, type: 'kick' },
      { step: 60, type: 'snare' },
    ],
  },

  // 3. SILICON VALLEY (Hacker Hostel) - 80s Chiptune Techno Bass & Arpeggio in D Minor
  hacker_hostel: {
    id: 'hacker_hostel',
    name: 'Pied Piper Compression Beat',
    bpm: 126,
    totalSteps: 32, // 2 fast bars
    lead: [
      // 16th-note fast synth arpeggio
      { step: 0, note: 'D4', durationSteps: 1, vol: 0.85 },
      { step: 1, note: 'F4', durationSteps: 1, vol: 0.85 },
      { step: 2, note: 'A4', durationSteps: 1, vol: 0.9 },
      { step: 3, note: 'D5', durationSteps: 1, vol: 0.95 },
      { step: 4, note: 'C5', durationSteps: 1, vol: 0.85 },
      { step: 5, note: 'A4', durationSteps: 1, vol: 0.85 },
      { step: 6, note: 'F4', durationSteps: 1, vol: 0.8 },
      { step: 7, note: 'E4', durationSteps: 1, vol: 0.8 },
      // Bar 2
      { step: 8, note: 'Bb4', durationSteps: 1, vol: 0.85 },
      { step: 9, note: 'D5', durationSteps: 1, vol: 0.9 },
      { step: 10, note: 'F5', durationSteps: 1, vol: 0.95 },
      { step: 11, note: 'D5', durationSteps: 1, vol: 0.85 },
      { step: 12, note: 'C5', durationSteps: 1, vol: 0.9 },
      { step: 13, note: 'E5', durationSteps: 1, vol: 0.95 },
      { step: 14, note: 'G5', durationSteps: 2, vol: 0.95 },
      // Loop second half
      { step: 16, note: 'D5', durationSteps: 2, vol: 0.9 },
      { step: 19, note: 'F5', durationSteps: 2, vol: 0.95 },
      { step: 22, note: 'E5', durationSteps: 2, vol: 0.85 },
      { step: 25, note: 'C5', durationSteps: 2, vol: 0.85 },
      { step: 28, note: 'A4', durationSteps: 3, vol: 0.9 },
    ],
    chords: [
      { step: 0, notes: ['D3', 'F3', 'A3'], durationSteps: 4, vol: 0.5 },
      { step: 8, notes: ['Bb2', 'D3', 'F3'], durationSteps: 4, vol: 0.5 },
      { step: 16, notes: ['C3', 'E3', 'G3'], durationSteps: 4, vol: 0.5 },
      { step: 24, notes: ['A2', 'C3', 'E3'], durationSteps: 4, vol: 0.5 },
    ],
    bass: [
      // 80s techno rolling 16th sub-bass
      { step: 0, note: 'D2', durationSteps: 1, vol: 0.9 },
      { step: 1, note: 'D2', durationSteps: 1, vol: 0.8 },
      { step: 2, note: 'F2', durationSteps: 1, vol: 0.85 },
      { step: 3, note: 'D2', durationSteps: 1, vol: 0.8 },
      { step: 4, note: 'D2', durationSteps: 1, vol: 0.9 },
      { step: 5, note: 'G2', durationSteps: 1, vol: 0.85 },
      { step: 6, note: 'D2', durationSteps: 1, vol: 0.8 },
      { step: 7, note: 'C2', durationSteps: 1, vol: 0.85 },
      { step: 8, note: 'Bb1', durationSteps: 1, vol: 0.9 },
      { step: 9, note: 'Bb1', durationSteps: 1, vol: 0.8 },
      { step: 10, note: 'D2', durationSteps: 1, vol: 0.85 },
      { step: 11, note: 'Bb1', durationSteps: 1, vol: 0.8 },
      { step: 12, note: 'C2', durationSteps: 1, vol: 0.9 },
      { step: 13, note: 'C2', durationSteps: 1, vol: 0.8 },
      { step: 14, note: 'E2', durationSteps: 1, vol: 0.85 },
      { step: 15, note: 'C2', durationSteps: 1, vol: 0.8 },
      { step: 16, note: 'D2', durationSteps: 2, vol: 0.9 },
      { step: 20, note: 'D2', durationSteps: 2, vol: 0.85 },
      { step: 24, note: 'C2', durationSteps: 2, vol: 0.9 },
      { step: 28, note: 'A1', durationSteps: 2, vol: 0.9 },
    ],
    drums: [
      // 4-on-the-floor electro punch
      { step: 0, type: 'kick' },
      { step: 2, type: 'hihat' },
      { step: 4, type: 'snare' },
      { step: 6, type: 'hihat' },
      { step: 8, type: 'kick' },
      { step: 10, type: 'hihat' },
      { step: 12, type: 'snare' },
      { step: 14, type: 'openhat' },
      { step: 16, type: 'kick' },
      { step: 18, type: 'hihat' },
      { step: 20, type: 'snare' },
      { step: 22, type: 'hihat' },
      { step: 24, type: 'kick' },
      { step: 26, type: 'hihat' },
      { step: 28, type: 'snare' },
      { step: 30, type: 'openhat' },
    ],
  },

  // 4. HOW I MET YOUR MOTHER (MacLaren's Pub) - Energetic Pop-Rock "Pa-pa-pa" Theme in E Major
  maclarens_pub: {
    id: 'maclarens_pub',
    name: 'MacLarens Pub Anthem',
    bpm: 140,
    totalSteps: 32,
    lead: [
      // Bouncy "Pa-pa-pa" motif
      { step: 0, note: 'B4', durationSteps: 2, vol: 0.85 },
      { step: 2, note: 'B4', durationSteps: 1, vol: 0.8 },
      { step: 4, note: 'G#4', durationSteps: 2, vol: 0.85 },
      { step: 6, note: 'E4', durationSteps: 2, vol: 0.8 },
      { step: 8, note: 'B4', durationSteps: 2, vol: 0.85 },
      { step: 10, note: 'B4', durationSteps: 1, vol: 0.8 },
      { step: 12, note: 'G#4', durationSteps: 2, vol: 0.85 },
      { step: 14, note: 'E4', durationSteps: 2, vol: 0.8 },
      // Turnaround
      { step: 16, note: 'C#5', durationSteps: 2, vol: 0.9 },
      { step: 18, note: 'C#5', durationSteps: 1, vol: 0.85 },
      { step: 20, note: 'A4', durationSteps: 2, vol: 0.85 },
      { step: 22, note: 'F#4', durationSteps: 2, vol: 0.8 },
      { step: 24, note: 'B4', durationSteps: 4, vol: 0.95 },
      { step: 30, note: 'G#4', durationSteps: 2, vol: 0.85 },
    ],
    chords: [
      { step: 0, notes: ['E3', 'G#3', 'B3'], durationSteps: 6, vol: 0.5 },
      { step: 8, notes: ['G#3', 'B3', 'D#4'], durationSteps: 6, vol: 0.5 },
      { step: 16, notes: ['A3', 'C#4', 'E4'], durationSteps: 6, vol: 0.5 },
      { step: 24, notes: ['B3', 'D#4', 'F#4'], durationSteps: 6, vol: 0.55 },
    ],
    bass: [
      { step: 0, note: 'E2', durationSteps: 2, vol: 0.8 },
      { step: 2, note: 'E2', durationSteps: 2, vol: 0.75 },
      { step: 4, note: 'E2', durationSteps: 2, vol: 0.8 },
      { step: 6, note: 'G#2', durationSteps: 2, vol: 0.75 },
      { step: 8, note: 'G#2', durationSteps: 2, vol: 0.8 },
      { step: 10, note: 'G#2', durationSteps: 2, vol: 0.75 },
      { step: 12, note: 'B2', durationSteps: 2, vol: 0.8 },
      { step: 14, note: 'G#2', durationSteps: 2, vol: 0.75 },
      { step: 16, note: 'A2', durationSteps: 2, vol: 0.8 },
      { step: 18, note: 'A2', durationSteps: 2, vol: 0.75 },
      { step: 20, note: 'C#3', durationSteps: 2, vol: 0.8 },
      { step: 22, note: 'A2', durationSteps: 2, vol: 0.75 },
      { step: 24, note: 'B2', durationSteps: 2, vol: 0.85 },
      { step: 26, note: 'B2', durationSteps: 2, vol: 0.8 },
      { step: 28, note: 'D#3', durationSteps: 2, vol: 0.85 },
      { step: 30, note: 'B2', durationSteps: 2, vol: 0.8 },
    ],
    drums: [
      { step: 0, type: 'kick' },
      { step: 4, type: 'snare' },
      { step: 8, type: 'kick' },
      { step: 10, type: 'kick' },
      { step: 12, type: 'snare' },
      { step: 16, type: 'kick' },
      { step: 20, type: 'snare' },
      { step: 24, type: 'kick' },
      { step: 28, type: 'snare' },
    ],
  },

  // 5. DEFAULT RETRO SITCOM VAMP in C Major
  default: {
    id: 'default',
    name: 'Retro Sitcom Theme',
    bpm: 120,
    totalSteps: 32,
    lead: [
      { step: 0, note: 'C4', durationSteps: 2, vol: 0.8 },
      { step: 2, note: 'E4', durationSteps: 2, vol: 0.85 },
      { step: 4, note: 'G4', durationSteps: 3, vol: 0.9 },
      { step: 8, note: 'A4', durationSteps: 2, vol: 0.85 },
      { step: 12, note: 'G4', durationSteps: 3, vol: 0.85 },
      { step: 16, note: 'E4', durationSteps: 2, vol: 0.8 },
      { step: 20, note: 'F4', durationSteps: 2, vol: 0.85 },
      { step: 24, note: 'D4', durationSteps: 4, vol: 0.9 },
      { step: 30, note: 'C4', durationSteps: 2, vol: 0.8 },
    ],
    chords: [
      { step: 0, notes: ['C3', 'E3', 'G3'], durationSteps: 6, vol: 0.45 },
      { step: 8, notes: ['A2', 'C3', 'E3'], durationSteps: 6, vol: 0.45 },
      { step: 16, notes: ['F2', 'A2', 'C3'], durationSteps: 6, vol: 0.45 },
      { step: 24, notes: ['G2', 'B2', 'D3'], durationSteps: 6, vol: 0.5 },
    ],
    bass: [
      { step: 0, note: 'C2', durationSteps: 3, vol: 0.75 },
      { step: 4, note: 'G2', durationSteps: 3, vol: 0.7 },
      { step: 8, note: 'A1', durationSteps: 3, vol: 0.75 },
      { step: 12, note: 'E2', durationSteps: 3, vol: 0.7 },
      { step: 16, note: 'F1', durationSteps: 3, vol: 0.75 },
      { step: 20, note: 'C2', durationSteps: 3, vol: 0.7 },
      { step: 24, note: 'G1', durationSteps: 4, vol: 0.8 },
      { step: 28, note: 'B1', durationSteps: 3, vol: 0.75 },
    ],
    drums: [
      { step: 0, type: 'kick' },
      { step: 4, type: 'snare' },
      { step: 8, type: 'kick' },
      { step: 12, type: 'snare' },
      { step: 16, type: 'kick' },
      { step: 20, type: 'snare' },
      { step: 24, type: 'kick' },
      { step: 28, type: 'snare' },
    ],
  },
};

// ---------------- MUSIC ENGINE CLASS ----------------

export class MusicEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private duckGain: GainNode | null = null;

  private isMuted: boolean = true; // Default off
  private volume: number = 0.35; // Default pleasant background volume
  private isPlaying: boolean = false;

  private currentThemeId: string = 'dunder_mifflin_scranton';
  private currentScore: ThemeScore = SHOW_THEMES.dunder_mifflin_scranton;

  // Lookahead Scheduler State
  private schedulerTimerId: number | null = null;
  private currentStep: number = 0;
  private nextStepTime: number = 0;
  private readonly lookaheadMs: number = 25; // Interval between schedule calls
  private readonly scheduleAheadSec: number = 0.12; // How far ahead to schedule Web Audio events

  constructor() {
    // Read saved mute / volume preferences from localStorage if available (default off)
    try {
      const savedMute = localStorage.getItem('bgm_muted');
      if (savedMute !== null) {
        this.isMuted = savedMute === 'true';
      } else {
        this.isMuted = true;
      }
      const savedVol = localStorage.getItem('bgm_volume');
      if (savedVol !== null) this.volume = parseFloat(savedVol) || 0.35;
    } catch {
      // Ignore localStorage errors
    }
  }

  private initNodes() {
    if (!this.ctx) {
      this.ctx = soundEngine.getAudioContext();
    }
    if (this.ctx && !this.masterGain) {
      this.masterGain = this.ctx.createGain();
      this.duckGain = this.ctx.createGain();

      this.masterGain.gain.value = this.isMuted ? 0 : this.volume;
      this.duckGain.gain.value = 1.0;

      // Routing: Synth Nodes -> duckGain -> masterGain -> ctx.destination
      this.duckGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    try {
      localStorage.setItem('bgm_muted', String(muted));
    } catch {}

    if (this.masterGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.linearRampToValueAtTime(muted ? 0 : this.volume, now + 0.15);
    }

    if (!muted && !this.isPlaying) {
      this.playTheme(this.currentThemeId);
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    try {
      localStorage.setItem('bgm_volume', String(this.volume));
    } catch {}

    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public isThemePlaying(): boolean {
    return this.isPlaying && !this.isMuted;
  }

  public getCurrentThemeId(): string {
    return this.currentThemeId;
  }

  public getCurrentThemeName(): string {
    return this.currentScore.name;
  }

  // Duck audio down during mockumentary talking heads or dialogues
  public duckAudio(duck: boolean) {
    if (!this.duckGain || !this.ctx) return;

    const now = this.ctx.currentTime;
    const target = duck ? 0.2 : 1.0; // 20% volume during dialogue
    this.duckGain.gain.setValueAtTime(this.duckGain.gain.value, now);
    this.duckGain.gain.exponentialRampToValueAtTime(Math.max(0.01, target), now + 0.35);
  }

  public playTheme(themeId: string) {
    this.initNodes();
    if (!this.ctx) return;

    const score = SHOW_THEMES[themeId] || SHOW_THEMES.default;
    this.currentThemeId = themeId;
    this.currentScore = score;

    if (!this.isPlaying) {
      this.isPlaying = true;
      this.currentStep = 0;
      this.nextStepTime = this.ctx.currentTime + 0.05;
      this.startScheduler();
    }
  }

  public stop() {
    this.isPlaying = false;
    if (this.schedulerTimerId !== null) {
      window.clearInterval(this.schedulerTimerId);
      this.schedulerTimerId = null;
    }
  }

  public togglePlay() {
    if (this.isPlaying && !this.isMuted) {
      this.setMuted(true);
    } else {
      this.setMuted(false);
      this.playTheme(this.currentThemeId);
    }
  }

  private startScheduler() {
    if (this.schedulerTimerId !== null) {
      window.clearInterval(this.schedulerTimerId);
    }
    this.schedulerTimerId = window.setInterval(() => {
      this.schedulerStep();
    }, this.lookaheadMs);
  }

  private schedulerStep() {
    if (!this.ctx || !this.isPlaying) return;

    // Schedule all notes within lookahead window
    while (this.nextStepTime < this.ctx.currentTime + this.scheduleAheadSec) {
      this.scheduleStep(this.currentStep, this.nextStepTime);
      this.advanceStep();
    }
  }

  private advanceStep() {
    const secondsPerBeat = 60.0 / this.currentScore.bpm;
    const secondsPer16th = secondsPerBeat / 4.0;
    this.nextStepTime += secondsPer16th;
    this.currentStep = (this.currentStep + 1) % this.currentScore.totalSteps;
  }

  private scheduleStep(step: number, time: number) {
    if (!this.ctx || !this.duckGain) return;
    const secondsPer16th = 60.0 / this.currentScore.bpm / 4.0;

    // 1. Lead / Melody Notes
    for (const item of this.currentScore.lead) {
      if (item.step === step) {
        const dur = (item.durationSteps || 2) * secondsPer16th;
        this.playLeadNote(noteToFreq(item.note), time, dur, item.vol || 0.8);
      }
    }

    // 2. Chords / Accompaniment
    for (const item of this.currentScore.chords) {
      if (item.step === step) {
        const dur = (item.durationSteps || 4) * secondsPer16th;
        this.playChord(item.notes.map(noteToFreq), time, dur, item.vol || 0.45);
      }
    }

    // 3. Bass Notes
    for (const item of this.currentScore.bass) {
      if (item.step === step) {
        const dur = (item.durationSteps || 2) * secondsPer16th;
        this.playBassNote(noteToFreq(item.note), time, dur, item.vol || 0.75);
      }
    }

    // 4. Percussion / Drums
    for (const item of this.currentScore.drums) {
      if (item.step === step) {
        this.playDrum(item.type, time, item.vol || 0.6);
      }
    }
  }

  // --- SYNTHESIZERS ---

  private playLeadNote(freq: number, time: number, duration: number, vol: number) {
    if (!this.ctx || !this.duckGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, time);

    // Subtle 8-bit vibrato
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.setValueAtTime(5.5, time);
    lfoGain.gain.setValueAtTime(freq * 0.015, time);
    lfo.connect(osc.frequency);
    lfo.start(time);
    lfo.stop(time + duration);

    // Envelopes: Fast attack, steady decay
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(vol * 0.18, time + 0.015);
    gain.gain.setValueAtTime(vol * 0.16, time + duration * 0.7);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(gain);
    gain.connect(this.duckGain);

    osc.start(time);
    osc.stop(time + duration + 0.02);
  }

  private playChord(freqs: number[], time: number, duration: number, vol: number) {
    if (!this.ctx || !this.duckGain) return;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1100, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime((vol * 0.12) / freqs.length, time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    filter.connect(gain);
    gain.connect(this.duckGain);

    freqs.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      osc.type = idx % 2 === 0 ? 'triangle' : 'square';
      osc.frequency.setValueAtTime(freq, time);
      osc.connect(filter);
      osc.start(time);
      osc.stop(time + duration + 0.02);
    });
  }

  private playBassNote(freq: number, time: number, duration: number, vol: number) {
    if (!this.ctx || !this.duckGain) return;

    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(380, time);

    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(vol * 0.28, time + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration * 0.95);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.duckGain);

    osc.start(time);
    osc.stop(time + duration + 0.02);
  }

  private playDrum(type: 'kick' | 'snare' | 'hihat' | 'openhat', time: number, vol: number) {
    if (!this.ctx || !this.duckGain) return;

    if (type === 'kick') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, time);
      osc.frequency.exponentialRampToValueAtTime(35, time + 0.08);

      gain.gain.setValueAtTime(vol * 0.35, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.09);

      osc.connect(gain);
      gain.connect(this.duckGain);
      osc.start(time);
      osc.stop(time + 0.1);
    } else if (type === 'snare') {
      // Noise burst + tone snap
      const osc = this.ctx.createOscillator();
      const oGain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, time);
      osc.frequency.exponentialRampToValueAtTime(80, time + 0.06);
      oGain.gain.setValueAtTime(vol * 0.2, time);
      oGain.gain.exponentialRampToValueAtTime(0.001, time + 0.06);
      osc.connect(oGain);
      oGain.connect(this.duckGain);
      osc.start(time);
      osc.stop(time + 0.07);

      // Noise component
      const noise = this.ctx.createBufferSource();
      const buf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 0.08), this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      noise.buffer = buf;

      const nFilter = this.ctx.createBiquadFilter();
      nFilter.type = 'bandpass';
      nFilter.frequency.setValueAtTime(1800, time);

      const nGain = this.ctx.createGain();
      nGain.gain.setValueAtTime(vol * 0.22, time);
      nGain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

      noise.connect(nFilter);
      nFilter.connect(nGain);
      nGain.connect(this.duckGain);
      noise.start(time);
      noise.stop(time + 0.08);
    } else {
      // Hihat
      const noise = this.ctx.createBufferSource();
      const dur = type === 'openhat' ? 0.12 : 0.04;
      const buf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * dur), this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      noise.buffer = buf;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(7500, time);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(vol * 0.12, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.duckGain);
      noise.start(time);
      noise.stop(time + dur);
    }
  }
}

export const musicEngine = new MusicEngine();
