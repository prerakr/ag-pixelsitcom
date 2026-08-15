import { SfxType } from '../types/script';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterVolume: number = 0.7;

  constructor() {
    // Lazy initialize on first user interaction
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setVolume(vol: number) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
  }

  public getVolume(): number {
    return this.masterVolume;
  }

  public playSfx(type: SfxType, customVolume = 1.0) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const gain = this.ctx.createGain();
    const finalVol = this.masterVolume * customVolume;
    gain.gain.value = finalVol;
    gain.connect(this.ctx.destination);

    const now = this.ctx.currentTime;

    switch (type) {
      case 'typewriter': {
        // Crisp gentle mechanical key click / blip
        const osc = this.ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(440 + Math.random() * 200, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.04);
        
        gain.gain.setValueAtTime(finalVol * 0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        
        osc.connect(gain);
        osc.start(now);
        osc.stop(now + 0.04);
        break;
      }

      case 'laugh_track':
      case 'laugh_giggle':
      case 'laugh_roar': {
        // Multi-voice warm retro laugh effect
        const laughCount = type === 'laugh_roar' ? 14 : type === 'laugh_giggle' ? 5 : 9;
        for (let i = 0; i < laughCount; i++) {
          const delay = i * 0.06 + Math.random() * 0.08;
          const osc = this.ctx.createOscillator();
          const pGain = this.ctx.createGain();

          osc.type = i % 2 === 0 ? 'sine' : 'triangle';
          const baseFreq = 260 + (i % 4) * 80 + Math.random() * 60;
          osc.frequency.setValueAtTime(baseFreq, now + delay);
          osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.3, now + delay + 0.08);
          osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.9, now + delay + 0.18);

          pGain.gain.setValueAtTime(0, now + delay);
          pGain.gain.linearRampToValueAtTime(finalVol * 0.25, now + delay + 0.04);
          pGain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.25);

          osc.connect(pGain);
          pGain.connect(gain);
          osc.start(now + delay);
          osc.stop(now + delay + 0.25);
        }
        break;
      }

      case 'cheer': {
        // Audience cheer / applause sound
        const duration = 1.2;
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.6));
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1200;
        filter.Q.value = 2;

        gain.gain.setValueAtTime(finalVol * 0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        noise.connect(filter);
        filter.connect(gain);
        noise.start(now);
        break;
      }

      case 'tension_sting': {
        // Dramatic minor chord sting
        const freqs = [220, 261.63, 311.13, 440]; // A minor with diminished vibe
        freqs.forEach((f) => {
          const osc = this.ctx!.createOscillator();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(f, now);
          osc.frequency.exponentialRampToValueAtTime(f * 0.97, now + 0.8);

          const sGain = this.ctx!.createGain();
          sGain.gain.setValueAtTime(finalVol * 0.2, now);
          sGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

          osc.connect(sGain);
          sGain.connect(gain);
          osc.start(now);
          osc.stop(now + 0.8);
        });
        break;
      }

      case 'dramatic_boom': {
        // Low sub-bass thud
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.6);

        gain.gain.setValueAtTime(finalVol * 0.7, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

        osc.connect(gain);
        osc.start(now);
        osc.stop(now + 0.6);
        break;
      }

      case 'slapstick_boing': {
        // Cartoonish boing
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(650, now + 0.35);

        gain.gain.setValueAtTime(finalVol * 0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        osc.start(now);
        osc.stop(now + 0.35);
        break;
      }

      case 'rimshot': {
        // Ba-dum tss!
        // Hit 1: Ba
        const osc1 = this.ctx.createOscillator();
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(160, now);
        osc1.frequency.exponentialRampToValueAtTime(70, now + 0.08);
        const g1 = this.ctx.createGain();
        g1.gain.setValueAtTime(finalVol * 0.4, now);
        g1.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc1.connect(g1);
        g1.connect(gain);
        osc1.start(now);
        osc1.stop(now + 0.08);

        // Hit 2: Dum
        const osc2 = this.ctx.createOscillator();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(130, now + 0.12);
        osc2.frequency.exponentialRampToValueAtTime(50, now + 0.22);
        const g2 = this.ctx.createGain();
        g2.gain.setValueAtTime(finalVol * 0.4, now + 0.12);
        g2.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
        osc2.connect(g2);
        g2.connect(gain);
        osc2.start(now + 0.12);
        osc2.stop(now + 0.22);

        // Hit 3: Tss (Cymbal)
        const duration = 0.4;
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
        }
        const cymbal = this.ctx.createBufferSource();
        cymbal.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 6000;
        const g3 = this.ctx.createGain();
        g3.gain.setValueAtTime(finalVol * 0.35, now + 0.24);
        g3.gain.exponentialRampToValueAtTime(0.001, now + 0.24 + duration);
        cymbal.connect(filter);
        filter.connect(g3);
        g3.connect(gain);
        cymbal.start(now + 0.24);
        break;
      }

      case 'fire_alarm': {
        // Strobe alarm beep
        for (let i = 0; i < 3; i++) {
          const osc = this.ctx.createOscillator();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(880, now + i * 0.2);
          osc.frequency.setValueAtTime(659, now + i * 0.2 + 0.1);

          const aGain = this.ctx.createGain();
          aGain.gain.setValueAtTime(finalVol * 0.25, now + i * 0.2);
          aGain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.2 + 0.18);

          osc.connect(aGain);
          aGain.connect(gain);
          osc.start(now + i * 0.2);
          osc.stop(now + i * 0.2 + 0.18);
        }
        break;
      }

      case 'phone_ring': {
        // Classic retro office telephone ring
        for (let burst = 0; burst < 2; burst++) {
          const offset = burst * 0.35;
          const osc1 = this.ctx.createOscillator();
          const osc2 = this.ctx.createOscillator();
          osc1.type = 'sine';
          osc2.type = 'sine';
          osc1.frequency.setValueAtTime(700, now + offset);
          osc2.frequency.setValueAtTime(900, now + offset);

          const rGain = this.ctx.createGain();
          rGain.gain.setValueAtTime(finalVol * 0.2, now + offset);
          rGain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.25);

          osc1.connect(rGain);
          osc2.connect(rGain);
          rGain.connect(gain);

          osc1.start(now + offset);
          osc2.start(now + offset);
          osc1.stop(now + offset + 0.25);
          osc2.stop(now + offset + 0.25);
        }
        break;
      }

      case 'stapler_click': {
        const osc = this.ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1400, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);

        gain.gain.setValueAtTime(finalVol * 0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

        osc.connect(gain);
        osc.start(now);
        osc.stop(now + 0.05);
        break;
      }

      case 'parkour_leap': {
        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.15);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.3);

        gain.gain.setValueAtTime(finalVol * 0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

        osc.connect(gain);
        osc.start(now);
        osc.stop(now + 0.3);
        break;
      }

      case 'theme_jingle': {
        this.playThemeJingle();
        break;
      }

      default: {
        // Generic cheerful blip
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
        gain.gain.setValueAtTime(finalVol * 0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.connect(gain);
        osc.start(now);
        osc.stop(now + 0.1);
      }
    }
  }

  public playThemeJingle() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    // Upbeat 8-bit retro melody (inspired by The Office jaunty piano / melodrama theme chords)
    // G4 - B4 - D5 - E5 - D5 - B4 - G4 ...
    const melody: [number, number, number][] = [
      // [freq, duration, delay]
      [392.00, 0.16, 0.00], // G4
      [493.88, 0.16, 0.18], // B4
      [587.33, 0.22, 0.36], // D5
      [659.25, 0.30, 0.60], // E5
      [587.33, 0.20, 0.94], // D5
      [493.88, 0.20, 1.16], // B4
      [523.25, 0.18, 1.38], // C5
      [587.33, 0.35, 1.58], // D5
      [392.00, 0.50, 1.96], // G4 long
    ];

    const now = this.ctx.currentTime;
    melody.forEach(([freq, dur, delay]) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now + delay);

      gain.gain.setValueAtTime(0, now + delay);
      gain.gain.linearRampToValueAtTime(this.masterVolume * 0.15, now + delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + dur);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(now + delay);
      osc.stop(now + delay + dur + 0.05);
    });
  }
}

export const soundEngine = new SoundEngine();
