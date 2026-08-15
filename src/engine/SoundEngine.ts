import { SfxType } from '../types/script';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterVolume: number = 0.7;
  private cachedBuffers: Map<string, AudioBuffer> = new Map();

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
    if (this.ctx && this.cachedBuffers.size === 0) {
      this.precomputeBuffers();
    }
  }

  private precomputeBuffers() {
    if (!this.ctx) return;
    const sampleRate = this.ctx.sampleRate;

    // 1. Cheer buffer (1.2s decaying noise)
    const cheerLen = Math.floor(sampleRate * 1.2);
    const cheerBuf = this.ctx.createBuffer(1, cheerLen, sampleRate);
    const cheerData = cheerBuf.getChannelData(0);
    for (let i = 0; i < cheerLen; i++) {
      cheerData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (cheerLen * 0.6));
    }
    this.cachedBuffers.set('cheer', cheerBuf);

    // 2. Gasp buffer (0.35s envelope shaped noise)
    const gaspLen = Math.floor(sampleRate * 0.35);
    const gaspBuf = this.ctx.createBuffer(1, gaspLen, sampleRate);
    const gaspData = gaspBuf.getChannelData(0);
    for (let i = 0; i < gaspLen; i++) {
      const env = Math.sin((i / gaspLen) * Math.PI * 0.85);
      gaspData[i] = (Math.random() * 2 - 1) * env;
    }
    this.cachedBuffers.set('gasp', gaspBuf);

    // 3. Glass shatter buffer (0.45s sharp crash burst)
    const shatterLen = Math.floor(sampleRate * 0.45);
    const shatterBuf = this.ctx.createBuffer(1, shatterLen, sampleRate);
    const shatterData = shatterBuf.getChannelData(0);
    for (let i = 0; i < shatterLen; i++) {
      shatterData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (shatterLen * 0.2));
    }
    this.cachedBuffers.set('glass_shatter', shatterBuf);

    // 4. Coffee pour buffer (0.7s trickle noise)
    const pourLen = Math.floor(sampleRate * 0.7);
    const pourBuf = this.ctx.createBuffer(1, pourLen, sampleRate);
    const pourData = pourBuf.getChannelData(0);
    for (let i = 0; i < pourLen; i++) {
      pourData[i] = (Math.random() * 2 - 1) * 0.5;
    }
    this.cachedBuffers.set('coffee_pour', pourBuf);

    // 5. Rimshot cymbal buffer (0.4s tss decay)
    const cymbalLen = Math.floor(sampleRate * 0.4);
    const cymbalBuf = this.ctx.createBuffer(1, cymbalLen, sampleRate);
    const cymbalData = cymbalBuf.getChannelData(0);
    for (let i = 0; i < cymbalLen; i++) {
      cymbalData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (cymbalLen * 0.3));
    }
    this.cachedBuffers.set('rimshot_cymbal', cymbalBuf);
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

  public getAudioContext(): AudioContext | null {
    this.initCtx();
    return this.ctx;
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
        // Audience cheer / applause sound using cached buffer
        const buffer = this.cachedBuffers.get('cheer');
        if (!buffer) break;
        const duration = 1.2;

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
        noise.stop(now + duration + 0.05);
        break;
      }

      case 'gasp': {
        // Sudden sharp inhalation / shock gasp using cached buffer
        const buffer = this.cachedBuffers.get('gasp');
        if (!buffer) break;
        const duration = 0.35;

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(450, now);
        filter.frequency.exponentialRampToValueAtTime(1600, now + duration * 0.8);
        filter.Q.value = 3.0;

        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(finalVol * 0.45, now + duration * 0.7);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        noise.connect(filter);
        filter.connect(gain);
        noise.start(now);
        noise.stop(now + duration + 0.05);
        break;
      }

      case 'glass_shatter': {
        // High-frequency crash + metallic clinks using cached buffer
        const buffer = this.cachedBuffers.get('glass_shatter');
        if (!buffer) break;
        const duration = 0.45;

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 3500;

        const nGain = this.ctx.createGain();
        nGain.gain.setValueAtTime(finalVol * 0.5, now);
        nGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        noise.connect(filter);
        filter.connect(nGain);
        nGain.connect(gain);
        noise.start(now);
        noise.stop(now + duration + 0.05);

        // High metallic chime ringtones
        [2600, 3900, 5200].forEach((freq, idx) => {
          const osc = this.ctx!.createOscillator();
          const oGain = this.ctx!.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.03);
          osc.frequency.exponentialRampToValueAtTime(freq * 0.7, now + idx * 0.03 + 0.3);

          oGain.gain.setValueAtTime(finalVol * 0.2, now + idx * 0.03);
          oGain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.03 + 0.3);

          osc.connect(oGain);
          oGain.connect(gain);
          osc.start(now + idx * 0.03);
          osc.stop(now + idx * 0.03 + 0.3);
        });
        break;
      }

      case 'coffee_pour': {
        // Liquid trickling & bubbling using cached buffer
        const buffer = this.cachedBuffers.get('coffee_pour');
        if (!buffer) break;
        const duration = 0.7;

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(550, now);
        filter.frequency.linearRampToValueAtTime(850, now + duration);
        filter.Q.value = 5.0;

        const pGain = this.ctx.createGain();
        pGain.gain.setValueAtTime(finalVol * 0.35, now);
        pGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        noise.connect(filter);
        filter.connect(pGain);
        pGain.connect(gain);
        noise.start(now);
        noise.stop(now + duration + 0.05);

        // Gentle bubble droplets
        for (let b = 0; b < 4; b++) {
          const bDelay = b * 0.14 + Math.random() * 0.04;
          const osc = this.ctx.createOscillator();
          const bGain = this.ctx.createGain();
          osc.type = 'sine';
          const bFreq = 600 + Math.random() * 400;
          osc.frequency.setValueAtTime(bFreq, now + bDelay);
          osc.frequency.exponentialRampToValueAtTime(bFreq * 1.5, now + bDelay + 0.05);

          bGain.gain.setValueAtTime(finalVol * 0.15, now + bDelay);
          bGain.gain.exponentialRampToValueAtTime(0.001, now + bDelay + 0.05);

          osc.connect(bGain);
          bGain.connect(gain);
          osc.start(now + bDelay);
          osc.stop(now + bDelay + 0.06);
        }
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

        // Hit 3: Tss (Cymbal) using cached buffer
        const buffer = this.cachedBuffers.get('rimshot_cymbal');
        if (buffer) {
          const duration = 0.4;
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
        }
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

    // Master node for jingle
    const masterJingleGain = this.ctx.createGain();
    masterJingleGain.gain.value = this.masterVolume;
    masterJingleGain.connect(this.ctx.destination);

    // Upbeat 8-bit retro melody (inspired by The Office jaunty piano / melodrama theme chords)
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
      gain.gain.linearRampToValueAtTime(0.15, now + delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + dur);

      osc.connect(gain);
      gain.connect(masterJingleGain);

      osc.start(now + delay);
      osc.stop(now + delay + dur + 0.05);
    });
  }
}

export const soundEngine = new SoundEngine();
