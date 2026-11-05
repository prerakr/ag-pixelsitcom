import { Direction, EmotionType } from '../types/script';
import { TileType, PropType } from '../types/environment';
import {
  SpriteAtlasManifest,
  SpriteRect,
  CharacterSpriteDef,
  PropSpriteDef,
  TileSpriteDef,
  TalkingHeadPortraitDef,
  ImageManifestEntry,
  TileThemeAtlas,
} from '../types/sprite';

export interface CharacterAtlasIssue {
  characterId: string;
  imageKey: string;
  frame: string;
  reason: string;
}

export class SpriteManager {
  private images: Map<string, HTMLCanvasElement> = new Map();
  private rawImages: Map<string, HTMLImageElement> = new Map();
  private characters: Map<string, CharacterSpriteDef> = new Map();
  private props: Map<string, PropSpriteDef> = new Map();
  private tiles: Map<string, TileSpriteDef> = new Map();
  private portraits: Map<string, TalkingHeadPortraitDef> = new Map();
  private imageEntries: Map<string, ImageManifestEntry> = new Map();
  private tileThemes: Map<string, TileThemeAtlas> = new Map();
  private pendingLoads: Map<string, Promise<void>> = new Map();

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
    return () => {
      this.listeners.delete(listener);
    };
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
        // Pure chroma green background detection (#00ff00), compression noise & dark grid borders
        const isPureGreen = g > 140 && r < 115 && b < 115;
        const isCloseChroma = distSq < 60 * 60;
        const isGreenDominant = g > 65 && g > r * 1.35 && g > b * 1.35;
        if (isPureGreen || isCloseChroma || isGreenDominant) {
          isChroma = true;
        }
      } else if (isMagentaKey) {
        // Pure chroma magenta background detection (#ff00ff) & compression noise
        const isPureMagenta = r > 140 && b > 140 && g < 115;
        const isCloseChroma = distSq < 60 * 60;
        const isMagentaDominant = r > 65 && b > 65 && (r + b) > g * 2.4;
        if (isPureMagenta || isCloseChroma || isMagentaDominant) {
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

  private characterOverrides: Map<string, Partial<CharacterSpriteDef>> = new Map();
  private propOverrides: Map<string, Partial<PropSpriteDef>> = new Map();
  private tileOverrides: Map<string, Partial<TileSpriteDef>> = new Map();
  private assetEnabledOverrides: Map<string, boolean> = new Map();

  /**
   * Check if a specific individual asset is enabled (allows selective procedural fallback).
   */
  public isAssetEnabled(category: 'character' | 'prop' | 'tile' | 'portrait', id: string): boolean {
    const key = `${category}:${id}`;
    if (this.assetEnabledOverrides.has(key)) {
      return this.assetEnabledOverrides.get(key)!;
    }
    if (category === 'character') {
      const def = this.characters.get(id);
      return def ? def.enabled !== false : false;
    }
    if (category === 'prop') {
      const def = this.props.get(id);
      return def ? def.enabled !== false : false;
    }
    if (category === 'tile') {
      const def = this.tiles.get(id);
      return def ? def.enabled !== false : false;
    }
    if (category === 'portrait') {
      const def = this.portraits.get(id);
      return def ? def.enabled !== false : false;
    }
    return true;
  }

  /**
   * Selectively enable or disable a single asset without affecting other assets in the scene.
   */
  public setAssetEnabled(category: 'character' | 'prop' | 'tile' | 'portrait', id: string, enabled: boolean) {
    const key = `${category}:${id}`;
    this.assetEnabledOverrides.set(key, enabled);
    this.notifyListeners();
  }

  /**
   * Set live runtime calibration overrides (e.g. crop rect, scale, offset) for instant visual tuning.
   */
  public setCharacterOverride(id: string, override: Partial<CharacterSpriteDef>) {
    this.characterOverrides.set(id, { ...this.characterOverrides.get(id), ...override });
    this.notifyListeners();
  }

  public setPropOverride(propType: string, override: Partial<PropSpriteDef>) {
    this.propOverrides.set(propType, { ...this.propOverrides.get(propType), ...override });
    this.notifyListeners();
  }

  public setTileOverride(tileType: string, override: Partial<TileSpriteDef>) {
    this.tileOverrides.set(tileType, { ...this.tileOverrides.get(tileType), ...override });
    this.notifyListeners();
  }

  public clearOverrides() {
    this.characterOverrides.clear();
    this.propOverrides.clear();
    this.tileOverrides.clear();
    this.assetEnabledOverrides.clear();
    this.notifyListeners();
  }

  /**
   * Registers atlas definitions and image sources from one or more manifests.
   *
   * Only the character atlases are fetched up front (they are small and every scene needs
   * them). Prop, tile and portrait textures load the first time something asks for them, so
   * a scene only pays for the art it actually shows.
   */
  public async loadManifest(manifestOrList: SpriteAtlasManifest | SpriteAtlasManifest[]): Promise<void> {
    const manifests = Array.isArray(manifestOrList) ? manifestOrList : [manifestOrList];

    for (const manifest of manifests) {
      Object.values(manifest.characters).forEach((c) => this.characters.set(c.characterId, c));
      Object.values(manifest.props).forEach((p) => this.props.set(p.propType, p));
      Object.values(manifest.tiles).forEach((t) => this.tiles.set(t.tileType, t));
      Object.values(manifest.portraits).forEach((pt) => this.portraits.set(pt.characterId, pt));
      for (const [key, entry] of Object.entries(manifest.images)) {
        this.imageEntries.set(key, entry);
      }
      for (const [theme, atlas] of Object.entries(manifest.tileThemes || {})) {
        this.tileThemes.set(theme, atlas);
      }
    }

    const characterImages = new Set<string>();
    this.characters.forEach((def) => characterImages.add(def.imageKey));
    await Promise.all(Array.from(characterImages, (key) => this.loadImage(key)));

    this.isLoadedState = true;
    const issues = this.validateCharacterAtlas();
    if (issues.length > 0) {
      console.warn('[SpriteManager] Character atlas validation failed:', issues);
    }
    this.notifyListeners();
  }

  /** Loads every registered texture (used by the Sprite Studio, which browses them all). */
  public preloadAll(): Promise<void> {
    return Promise.all(Array.from(this.imageEntries.keys(), (key) => this.loadImage(key))).then(() => undefined);
  }

  /**
   * Returns a texture if it is ready, otherwise starts loading it and returns undefined.
   * Listeners are notified when it arrives, so callers simply fall back for a frame or two.
   */
  private ensureImage(key: string): HTMLCanvasElement | undefined {
    const canvas = this.images.get(key);
    if (canvas) return canvas;
    if (this.imageEntries.has(key)) {
      void this.loadImage(key).then(() => this.notifyListeners());
    }
    return undefined;
  }

  private loadImage(key: string): Promise<void> {
    if (this.images.has(key)) return Promise.resolve();
    const inFlight = this.pendingLoads.get(key);
    if (inFlight) return inFlight;
    const entry = this.imageEntries.get(key);
    if (!entry) return Promise.resolve();

    const promise = new Promise<void>((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        this.rawImages.set(key, img);
        if (entry.chromaKey) {
          this.images.set(key, this.processChromaKey(img, entry.chromaKey, entry.tolerance || 45));
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
        this.pendingLoads.delete(key);
        resolve();
      };
      img.onerror = () => {
        console.warn(`[SpriteManager] Failed to load image texture "${key}" from ${entry.url}`);
        this.pendingLoads.delete(key);
        resolve(); // Resolve anyway so other assets can continue
      };
      img.src = entry.url;
    });
    this.pendingLoads.set(key, promise);
    return promise;
  }

  /**
   * Checks every registered character rectangle against its loaded texture.
   * Runtime drawing still degrades gracefully, but this exposes a bad crop as
   * data to fix instead of quietly masking it with a clipped frame.
   */
  public validateCharacterAtlas(): CharacterAtlasIssue[] {
    const issues: CharacterAtlasIssue[] = [];
    const checkSequence = (
      def: CharacterSpriteDef,
      frame: string,
      rects: SpriteRect | SpriteRect[] | undefined,
      canvas: HTMLCanvasElement,
    ) => {
      if (!rects) return;
      const frames = Array.isArray(rects) ? rects : [rects];
      if (frames.length === 0) {
        issues.push({ characterId: def.characterId, imageKey: def.imageKey, frame, reason: 'Frame sequence is empty.' });
      }
      frames.forEach((rect, index) => {
        const label = frames.length > 1 ? `${frame}[${index}]` : frame;
        if (rect.w <= 0 || rect.h <= 0 || rect.x < 0 || rect.y < 0) {
          issues.push({ characterId: def.characterId, imageKey: def.imageKey, frame: label, reason: 'Frame has invalid dimensions or a negative origin.' });
        } else if (rect.x + rect.w > canvas.width || rect.y + rect.h > canvas.height) {
          issues.push({
            characterId: def.characterId,
            imageKey: def.imageKey,
            frame: label,
            reason: `Frame ${rect.x},${rect.y} ${rect.w}x${rect.h} exceeds ${canvas.width}x${canvas.height}.`,
          });
        }
      });
    };

    this.characters.forEach((def) => {
      const canvas = this.ensureImage(def.imageKey);
      if (!canvas) {
        issues.push({
          characterId: def.characterId,
          imageKey: def.imageKey,
          frame: 'image',
          reason: 'Referenced texture was not loaded.',
        });
        return;
      }

      const animation = def.animations;
      checkSequence(def, 'down', animation.down, canvas);
      checkSequence(def, 'up', animation.up, canvas);
      checkSequence(def, 'left', animation.left, canvas);
      checkSequence(def, 'right', animation.right, canvas);

      Object.entries(animation.idle || {}).forEach(([direction, rects]) =>
        checkSequence(def, `idle.${direction}`, rects, canvas),
      );
      Object.entries(animation.run || {}).forEach(([direction, rects]) =>
        checkSequence(def, `run.${direction}`, rects, canvas),
      );
      Object.entries(animation.sitting || {}).forEach(([direction, rect]) =>
        checkSequence(def, `sitting.${direction}`, rect, canvas),
      );
      Object.entries(animation.actions || {}).forEach(([action, rects]) =>
        checkSequence(def, `actions.${action}`, rects, canvas),
      );
    });

    return issues;
  }

  public updateImageTexture(imageKey: string, newCanvas: HTMLCanvasElement) {
    this.images.set(imageKey, newCanvas);
    this.notifyListeners();
  }

  public reprocessChromaKey(imageKey: string, chromaHex: string, tolerance: number = 45) {
    const rawImg = this.rawImages.get(imageKey);
    if (!rawImg) return;
    
    if (chromaHex) {
      const processed = this.processChromaKey(rawImg, chromaHex, tolerance);
      this.images.set(imageKey, processed);
    } else {
      const canvas = document.createElement('canvas');
      canvas.width = rawImg.naturalWidth || rawImg.width;
      canvas.height = rawImg.naturalHeight || rawImg.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(rawImg, 0, 0);
      }
      this.images.set(imageKey, canvas);
    }
    this.notifyListeners();
  }

  public async addLocalImage(file: File, key: string, chromaKey?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        this.rawImages.set(key, img);
        if (chromaKey) {
          const processed = this.processChromaKey(img, chromaKey, 45);
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
        this.notifyListeners();
        resolve();
      };
      img.onerror = () => {
        console.warn(`[SpriteManager] Failed to load local image for key "${key}"`);
        reject(new Error("Failed to load local image"));
      };
      img.src = objectUrl;
    });
  }

  public hasCharacter(characterId: string): boolean {
    if (this.artStyleMode === 'procedural') return false;
    if (!this.isAssetEnabled('character', characterId)) return false;
    const def = this.characters.get(characterId);
    return !!def && !!this.ensureImage(def.imageKey);
  }

  public getCharacterFrame(
    characterId: string,
    facing: Direction,
    animFrame: number,
    isMoving: boolean,
    isSitting = false,
    action?: string,
    characterState?: string
  ): { canvas: HTMLCanvasElement; rect: SpriteRect; scale: number; offsetX: number; offsetY: number } | null {
    if (this.artStyleMode === 'procedural') return null;
    if (!this.isAssetEnabled('character', characterId)) return null;

    let def = this.characters.get(characterId);
    if (!def) return null;

    const override = this.characterOverrides.get(characterId);
    if (override) {
      def = { ...def, ...override };
    }

    const canvas = this.ensureImage(def.imageKey);
    if (!canvas || canvas.width <= 0 || canvas.height <= 0) return null;

    const scale = def.scale || 1.0;
    const offsetX = def.offsetX || 0;
    const offsetY = def.offsetY || 0;

    const clampRect = (r?: SpriteRect): SpriteRect | null => {
      if (!r || r.w <= 0 || r.h <= 0 || r.x < 0 || r.y < 0) return null;
      if (r.x >= canvas.width || r.y >= canvas.height) return null;
      const w = Math.min(r.w, canvas.width - r.x);
      const h = Math.min(r.h, canvas.height - r.y);
      if (w <= 0 || h <= 0) return null;
      return w === r.w && h === r.h ? r : { ...r, w, h };
    };

    // 1. Check specific action overrides (by explicit action name or character state)
    const effectiveAction = action || characterState;
    if (effectiveAction && def.animations.actions && def.animations.actions[effectiveAction]) {
      const act = def.animations.actions[effectiveAction];
      const frameIdx = Math.floor(Math.abs(animFrame || 0)) % (Array.isArray(act) ? act.length : 1);
      const rawRect = Array.isArray(act) ? act[frameIdx] : act;
      const rect = clampRect(rawRect);
      if (rect) {
        return { canvas, rect, scale, offsetX, offsetY };
      }
    }

    // 2. Check sitting frames
    const sittingState = isSitting || characterState === 'sitting_desk' || characterState === 'sitting_couch';
    if (sittingState && def.animations.sitting) {
      const sitRaw = def.animations.sitting[facing] || def.animations.sitting.down;
      const sitRect = clampRect(sitRaw);
      if (sitRect) {
        return { canvas, rect: sitRect, scale, offsetX, offsetY };
      }
    }

    // 3. Check idle frames when stationary
    if (!isMoving && def.animations.idle) {
      const idleFrames = def.animations.idle[facing] || def.animations.idle.down;
      if (idleFrames) {
        const frameIdx = Math.floor(Math.abs(animFrame || 0)) % (Array.isArray(idleFrames) ? idleFrames.length : 1);
        const rawRect = Array.isArray(idleFrames) ? idleFrames[frameIdx] : idleFrames;
        const rect = clampRect(rawRect);
        if (rect) {
          return { canvas, rect, scale, offsetX, offsetY };
        }
      }
    }

    // 4. Check run frames when running
    if (isMoving && characterState === 'running' && def.animations.run) {
      const runFrames = def.animations.run[facing] || def.animations.run.down;
      if (runFrames && runFrames.length > 0) {
        const frameIdx = Math.floor(Math.abs(animFrame || 0)) % runFrames.length;
        const rect = clampRect(runFrames[frameIdx]);
        if (rect) {
          return { canvas, rect, scale, offsetX, offsetY };
        }
      }
    }

    // 5. Standard walk / idle frames
    let frames = def.animations[facing];
    let autoFlipX = false;

    // Automatic fallback: If facing left/right and no frames defined, mirror the opposite side
    if ((!frames || frames.length === 0) && facing === 'left' && def.animations.right) {
      frames = def.animations.right;
      autoFlipX = true;
    } else if ((!frames || frames.length === 0) && facing === 'right' && def.animations.left) {
      frames = def.animations.left;
      autoFlipX = true;
    }

    if (!frames || frames.length === 0) {
      frames = def.animations.down;
    }

    if (!frames || frames.length === 0) return null;

    // If standing still, use frame 0 (idle pose); if moving, cycle frame
    const frameIndex = isMoving ? Math.floor(Math.abs(animFrame || 0)) % frames.length : 0;
    let rawRect = frames[frameIndex] || frames[0];
    let rect = clampRect(rawRect);
    if (!rect) return null;

    if (autoFlipX && !rect.flipX) {
      rect = { ...rect, flipX: true };
    }

    return { canvas, rect, scale, offsetX, offsetY };

  }

  public hasProp(propType: PropType | string): boolean {
    if (this.artStyleMode === 'procedural') return false;
    if (!this.isAssetEnabled('prop', propType as string)) return false;
    const def = this.props.get(propType as string);
    return !!def && !!this.ensureImage(def.imageKey);
  }

  public getPropSprite(
    propType: PropType | string,
    stateName?: string
  ): { canvas: HTMLCanvasElement; rect: SpriteRect; scale?: number; offsetX: number; offsetY: number } | null {
    if (this.artStyleMode === 'procedural') return null;
    if (!this.isAssetEnabled('prop', propType as string)) return null;

    let def = this.props.get(propType as string);
    if (!def) return null;

    const override = this.propOverrides.get(propType as string);
    if (override) {
      def = { ...def, ...override };
    }

    const canvas = this.ensureImage(def.imageKey);
    if (!canvas || canvas.width <= 0 || canvas.height <= 0) return null;

    let rect = def.rect;
    if (stateName && def.states && def.states[stateName]) {
      rect = def.states[stateName];
    }
    if (!rect || rect.w <= 0 || rect.h <= 0 || rect.x < 0 || rect.y < 0) return null;
    if (rect.x + rect.w > canvas.width || rect.y + rect.h > canvas.height) return null;

    const offsetX = (def.offsetX || 0) + (rect.offsetX || 0);
    const offsetY = (def.offsetY || 0) + (rect.offsetY || 0);

    return { canvas, rect, scale: def.scale, offsetX, offsetY };
  }

  public hasTile(tileType: TileType | string): boolean {
    if (this.artStyleMode === 'procedural') return false;
    if (!this.isAssetEnabled('tile', tileType as string)) return false;
    const def = this.tiles.get(tileType as string);
    return !!def && !!this.ensureImage(def.imageKey);
  }

  public getTileSprite(
    tileType: TileType | string
  ): { canvas: HTMLCanvasElement; rect: SpriteRect } | null {
    if (this.artStyleMode === 'procedural') return null;
    if (!this.isAssetEnabled('tile', tileType as string)) return null;

    let def = this.tiles.get(tileType as string);
    if (!def) return null;

    const override = this.tileOverrides.get(tileType as string);
    if (override) {
      def = { ...def, ...override };
    }

    const canvas = this.ensureImage(def.imageKey);
    if (!canvas || canvas.width <= 0 || canvas.height <= 0) return null;

    const rect = def.rect;
    if (!rect || rect.w <= 0 || rect.h <= 0 || rect.x < 0 || rect.y < 0) return null;
    if (rect.x + rect.w > canvas.width || rect.y + rect.h > canvas.height) return null;

    return { canvas, rect };
  }

  /** True when the Sprite Studio calibrator is overriding this tile's crop. */
  public hasTileOverride(tileType: string): boolean {
    return this.tileOverrides.has(tileType);
  }

  /**
   * The themed tileset for a set (falls back to the office theme), or null while it loads or
   * when procedural art is selected.
   */
  public getTileTheme(theme: string | undefined): { canvas: HTMLCanvasElement; atlas: TileThemeAtlas } | null {
    if (this.artStyleMode === 'procedural') return null;
    const atlas = this.tileThemes.get(theme || 'office') || this.tileThemes.get('office');
    if (!atlas) return null;
    const canvas = this.ensureImage(atlas.imageKey);
    return canvas ? { canvas, atlas } : null;
  }

  public getImageKeys(): string[] {
    return Array.from(this.images.keys());
  }

  public hasPortrait(characterId: string): boolean {
    if (!this.isAssetEnabled('portrait', characterId)) return false;
    const def = this.portraits.get(characterId);
    return !!def && !!this.ensureImage(def.imageKey);
  }

  public getPortrait(
    characterId: string,
    emotion?: EmotionType
  ): { canvas: HTMLCanvasElement; rect?: SpriteRect } | null {
    if (!this.isAssetEnabled('portrait', characterId)) return null;
    const def = this.portraits.get(characterId);
    if (!def) return null;

    const canvas = this.ensureImage(def.imageKey);
    if (!canvas || canvas.width <= 0 || canvas.height <= 0) return null;

    let rect = def.rect;
    if (emotion && def.emotionRects && def.emotionRects[emotion]) {
      rect = def.emotionRects[emotion];
    }
    if (rect && (rect.w <= 0 || rect.h <= 0 || rect.x < 0 || rect.y < 0 || rect.x + rect.w > canvas.width || rect.y + rect.h > canvas.height)) {
      return null;
    }

    return { canvas, rect };
  }


  public getLoadedImages(): Map<string, HTMLCanvasElement> {
    return this.images;
  }

  public getAllCharacterDefs(): Map<string, CharacterSpriteDef> {
    return this.characters;
  }

  public getAllPropDefs(): Map<string, PropSpriteDef> {
    return this.props;
  }

  public getAllTileDefs(): Map<string, TileSpriteDef> {
    return this.tiles;
  }

  public getAllPortraitDefs(): Map<string, TalkingHeadPortraitDef> {
    return this.portraits;
  }
}

export const spriteManager = new SpriteManager();
