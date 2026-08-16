import { Direction, EmotionType } from '../types/script';
import { TileType, PropType } from '../types/environment';
import {
  SpriteAtlasManifest,
  SpriteRect,
  CharacterSpriteDef,
  PropSpriteDef,
  TileSpriteDef,
  TalkingHeadPortraitDef,
} from '../types/sprite';

export class SpriteManager {
  private images: Map<string, HTMLCanvasElement> = new Map();
  private characters: Map<string, CharacterSpriteDef> = new Map();
  private props: Map<string, PropSpriteDef> = new Map();
  private tiles: Map<string, TileSpriteDef> = new Map();
  private portraits: Map<string, TalkingHeadPortraitDef> = new Map();

  private isLoadedState = false;
  private loadPromise: Promise<void> | null = null;
  private artStyleMode: 'sprites' | 'procedural' = 'sprites';
  private listeners: Set<() => void> = new Set();

  public get isLoaded(): boolean {
    return this.isLoadedState;
  }

  public get mode(): 'sprites' | 'procedural' {
    return this.artStyleMode;
  }

  public setMode(mode: 'sprites' | 'procedural') {
    this.artStyleMode = mode;
    this.notifyListeners();
  }

  public toggleMode() {
    this.setMode(this.artStyleMode === 'sprites' ? 'procedural' : 'sprites');
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach((l) => l());
  }

  /**
   * Converts solid background (e.g. Chroma green #00ff00 or magenta #ff00ff) to alpha transparency
   * with advanced defringing and edge decontamination to eliminate colored halo borders.
   */
  public processChromaKey(
    img: HTMLImageElement,
    chromaHex: string,
    tolerance = 55
  ): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    const width = img.naturalWidth || img.width;
    const height = img.naturalHeight || img.height;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return canvas;

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, 0, 0);

    const hex = chromaHex.replace('#', '').toLowerCase();
    const tr = parseInt(hex.substring(0, 2), 16);
    const tg = parseInt(hex.substring(2, 4), 16);
    const tb = parseInt(hex.substring(4, 6), 16);

    const isGreenKey = tg > tr && tg > tb;
    const isMagentaKey = tr > tg && tb > tg;

    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    const tolSq = tolerance * tolerance;

    // PASS 1: Identify and clear key background pixels
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      const dr = r - tr;
      const dg = g - tg;
      const db = b - tb;
      const distSq = dr * dr + dg * dg + db * db;

      let isChroma = false;

      if (isGreenKey) {
        // Pure chroma green background detection (#00ff00): high green with low red and blue
        const isPureGreen = g > 150 && r < 100 && b < 100;
        const isCloseChroma = distSq < 55 * 55;
        if (isPureGreen || isCloseChroma) {
          isChroma = true;
        }
      } else if (isMagentaKey) {
        // Pure chroma magenta background detection (#ff00ff): high red and blue with low green
        const isPureMagenta = r > 150 && b > 150 && g < 100;
        const isCloseChroma = distSq < 55 * 55;
        if (isPureMagenta || isCloseChroma) {
          isChroma = true;
        }
      } else if (distSq < tolSq) {
        isChroma = true;
      }

      if (isChroma) {
        data[i + 3] = 0; // Transparent
      }
    }

    // PASS 2: Edge Decontamination & Defringing
    // Removes green/magenta color spill on outline border pixels bordering transparent regions
    const copyData = new Uint8ClampedArray(data);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const a = copyData[idx + 3];
        if (a === 0) continue;

        // Check if this pixel borders transparent background
        let hasTransNeighbor = false;
        const neighbors = [
          [-1, 0],
          [1, 0],
          [0, -1],
          [0, 1],
          [-1, -1],
          [1, 1],
          [-1, 1],
          [1, -1],
        ];

        for (const [dx, dy] of neighbors) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const nIdx = (ny * width + nx) * 4;
            if (copyData[nIdx + 3] === 0) {
              hasTransNeighbor = true;
              break;
            }
          } else {
            hasTransNeighbor = true;
            break;
          }
        }

        if (hasTransNeighbor) {
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];

          if (isGreenKey) {
            // If border pixel has leftover green tint, suppress green to dark clean outline
            if (g > r * 0.95 || g > b * 0.95) {
              const maxOther = Math.max(r, b);
              if (g > maxOther) {
                data[idx + 1] = Math.round(maxOther * 0.7); // Clamped green
              }
              // Darken edge to crisp pixel-art outline
              data[idx] = Math.round(data[idx] * 0.65);
              data[idx + 1] = Math.round(data[idx + 1] * 0.65);
              data[idx + 2] = Math.round(data[idx + 2] * 0.65);
            }
          } else if (isMagentaKey) {
            // If border pixel has leftover magenta tint, suppress magenta
            if (r > g * 1.05 && b > g * 1.05) {
              data[idx] = Math.round(g * 0.85);
              data[idx + 2] = Math.round(g * 0.85);
              data[idx] = Math.round(data[idx] * 0.65);
              data[idx + 1] = Math.round(data[idx + 1] * 0.65);
              data[idx + 2] = Math.round(data[idx + 2] * 0.65);
            }
          }
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
    return canvas;
  }

  /**
   * Loads all images and atlas definitions in a manifest.
   */
  public async loadManifest(manifest: SpriteAtlasManifest): Promise<void> {
    const loadPromises: Promise<void>[] = [];

    // Register definitions
    Object.values(manifest.characters).forEach((c) => this.characters.set(c.characterId, c));
    Object.values(manifest.props).forEach((p) => this.props.set(p.propType, p));
    Object.values(manifest.tiles).forEach((t) => this.tiles.set(t.tileType, t));
    Object.values(manifest.portraits).forEach((pt) => this.portraits.set(pt.characterId, pt));

    // Load and process image textures
    for (const [key, entry] of Object.entries(manifest.images)) {
      const p = new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          if (entry.chromaKey) {
            const processed = this.processChromaKey(img, entry.chromaKey, entry.tolerance || 45);
            this.images.set(key, processed);
          } else {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth || img.width;
            canvas.height = img.naturalHeight || img.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.imageSmoothingEnabled = false;
              ctx.drawImage(img, 0, 0);
            }
            this.images.set(key, canvas);
          }
          resolve();
        };
        img.onerror = () => {
          console.warn(`[SpriteManager] Failed to load image texture "${key}" from ${entry.url}`);
          resolve(); // Resolve anyway so other assets can continue
        };
        img.src = entry.url;
      });
      loadPromises.push(p);
    }

    await Promise.all(loadPromises);
    this.isLoadedState = true;
    this.notifyListeners();
  }

  public hasCharacter(characterId: string): boolean {
    if (this.artStyleMode === 'procedural') return false;
    const def = this.characters.get(characterId);
    return !!def && this.images.has(def.imageKey);
  }

  public getCharacterFrame(
    characterId: string,
    facing: Direction,
    animFrame: number,
    isMoving: boolean,
    isSitting = false,
    action?: string
  ): { canvas: HTMLCanvasElement; rect: SpriteRect; scale: number } | null {
    if (this.artStyleMode === 'procedural') return null;
    const def = this.characters.get(characterId);
    if (!def) return null;

    const canvas = this.images.get(def.imageKey);
    if (!canvas) return null;

    // Check specific action overrides
    if (action && def.animations.actions && def.animations.actions[action]) {
      const act = def.animations.actions[action];
      const rect = Array.isArray(act) ? act[animFrame % act.length] : act;
      return { canvas, rect, scale: def.scale || 1.0 };
    }

    // Check sitting frames
    if (isSitting && def.animations.sitting) {
      const sitRect = def.animations.sitting[facing] || def.animations.sitting.down;
      if (sitRect) {
        return { canvas, rect: sitRect, scale: def.scale || 1.0 };
      }
    }

    // Standard walk / idle frames
    const frames = def.animations[facing] || def.animations.down;
    if (!frames || frames.length === 0) return null;

    // If standing still, use frame 0 (idle pose); if moving, cycle frame
    const frameIndex = isMoving ? animFrame % frames.length : 0;
    const rect = frames[frameIndex];

    return { canvas, rect, scale: def.scale || 1.0 };
  }

  public hasProp(propType: PropType | string): boolean {
    if (this.artStyleMode === 'procedural') return false;
    const def = this.props.get(propType as PropType);
    return !!def && this.images.has(def.imageKey);
  }

  public getPropSprite(
    propType: PropType | string,
    stateName?: string
  ): { canvas: HTMLCanvasElement; rect: SpriteRect; scale?: number } | null {
    if (this.artStyleMode === 'procedural') return null;
    const def = this.props.get(propType as PropType);
    if (!def) return null;

    const canvas = this.images.get(def.imageKey);
    if (!canvas) return null;

    let rect = def.rect;
    if (stateName && def.states && def.states[stateName]) {
      rect = def.states[stateName];
    }

    return { canvas, rect, scale: def.scale };
  }

  public hasTile(tileType: TileType | string): boolean {
    if (this.artStyleMode === 'procedural') return false;
    const def = this.tiles.get(tileType as TileType);
    return !!def && this.images.has(def.imageKey);
  }

  public getTileSprite(
    tileType: TileType | string
  ): { canvas: HTMLCanvasElement; rect: SpriteRect } | null {
    if (this.artStyleMode === 'procedural') return null;
    const def = this.tiles.get(tileType as TileType);
    if (!def) return null;

    const canvas = this.images.get(def.imageKey);
    if (!canvas) return null;

    return { canvas, rect: def.rect };
  }

  public hasPortrait(characterId: string): boolean {
    const def = this.portraits.get(characterId);
    return !!def && this.images.has(def.imageKey);
  }

  public getPortrait(
    characterId: string,
    emotion?: EmotionType
  ): { canvas: HTMLCanvasElement; rect?: SpriteRect } | null {
    const def = this.portraits.get(characterId);
    if (!def) return null;

    const canvas = this.images.get(def.imageKey);
    if (!canvas) return null;

    let rect = def.rect;
    if (emotion && def.emotionRects && def.emotionRects[emotion]) {
      rect = def.emotionRects[emotion];
    }

    return { canvas, rect };
  }

  public getLoadedImages(): Map<string, HTMLCanvasElement> {
    return this.images;
  }
}

export const spriteManager = new SpriteManager();
