import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  X,
  Palette,
  Eye,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Sliders,
  RotateCcw,
  Layers,
  Crop,
  ShieldCheck,
  ShieldAlert,
  Image as ImageIcon,
  Grid,
} from 'lucide-react';
import { spriteManager } from '../engine/SpriteManager';
import { SPRITE_ATLAS_MANIFEST } from '../data/sprites/SpriteAtlas';
import { ALL_CHARACTERS } from '../data/characters';
import { ALL_SETTINGS } from '../data/settings';
import { Direction } from '../types/script';

interface SpriteGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const SHOW_LABELS: Record<string, string> = {
  the_office: 'The Office',
  friends: 'Friends',
  silicon_valley: 'Silicon Valley',
  himym: 'How I Met Your Mother',
};

const SHOW_IDS = ['the_office', 'friends', 'silicon_valley', 'himym'] as const;

function collectAllPropTypes(): Set<string> {
  const types = new Set<string>();
  Object.values(ALL_SETTINGS).forEach((s) =>
    s.props.forEach((p: any) => types.add(p.type))
  );
  return types;
}

function collectAllTileTypes(): Set<string> {
  const types = new Set<string>();
  Object.values(ALL_SETTINGS).forEach((s) => {
    Object.values(s.tiles).forEach((t: any) => {
      if (typeof t === 'string') types.add(t);
    });
  });
  return types;
}

function collectPropTypesForSetting(settingId: string): Set<string> {
  const types = new Set<string>();
  const s = ALL_SETTINGS[settingId];
  if (s) s.props.forEach((p: any) => types.add(p.type));
  return types;
}

function collectTileTypesForSetting(settingId: string): Set<string> {
  const types = new Set<string>();
  const s = ALL_SETTINGS[settingId];
  if (s) Object.values(s.tiles).forEach((t: any) => { if (typeof t === 'string') types.add(t); });
  return types;
}

// ─── Canvas-based Sprite Preview Component ──────────────────────────────────

const SpritePreview: React.FC<{
  imageKey: string;
  rect: { x: number; y: number; w: number; h: number };
  size?: number;
}> = ({ imageKey, rect, size = 80 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;

    const img = spriteManager.getLoadedImages().get(imageKey);
    if (!img) return;

    // Fit source rect into the preview canvas preserving aspect ratio
    const scale = Math.min(size / rect.w, size / rect.h);
    const dw = Math.round(rect.w * scale);
    const dh = Math.round(rect.h * scale);
    const dx = Math.round((size - dw) / 2);
    const dy = Math.round((size - dh) / 2);

    ctx.drawImage(img, rect.x, rect.y, rect.w, rect.h, dx, dy, dw, dh);
  }, [imageKey, rect, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className="bg-[#070a0f] border border-[#1e293b] rounded"
      style={{ imageRendering: 'pixelated' }}
    />
  );
};

// ─── Copy Button ────────────────────────────────────────────────────────────

const CopyButton: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className="absolute top-1.5 right-1.5 p-1 rounded bg-slate-700/60 hover:bg-slate-600 transition-colors z-10"
      title="Copy snippet"
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-emerald-400" />
      ) : (
        <Copy className="w-3.5 h-3.5 text-slate-400" />
      )}
    </button>
  );
};

// ─── Status Badge ───────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ hasSprite: boolean }> = ({ hasSprite }) =>
  hasSprite ? (
    <span className="inline-flex items-center gap-0.5 text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
      <CheckCircle2 className="w-3 h-3" /> SPRITE
    </span>
  ) : (
    <span className="inline-flex items-center gap-0.5 text-[9px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
      <AlertCircle className="w-3 h-3" /> PROCEDURAL
    </span>
  );

// ─── Main Modal ─────────────────────────────────────────────────────────────

export const SpriteGalleryModal: React.FC<SpriteGalleryModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'coverage' | 'calibrator' | 'cast' | 'props' | 'tiles' | 'portraits' | 'prompts'>('coverage');
  const [selectedChar, setSelectedChar] = useState<string>('michael');
  const [selectedDirection, setSelectedDirection] = useState<Direction>('down');
  const [isWalking, setIsWalking] = useState(true);
  const [artMode, setArtMode] = useState<'sprites' | 'procedural'>(spriteManager.mode);
  const [triggerUpdate, setTriggerUpdate] = useState(0);

  // Calibrator Tab State
  const [calibCategory, setCalibCategory] = useState<'character' | 'prop' | 'tile'>('prop');
  const [calibPropId, setCalibPropId] = useState<string>('desk_michael');
  const [calibCharId, setCalibCharId] = useState<string>('michael');
  const [calibTileId, setCalibTileId] = useState<string>('floor_carpet_grey');

  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newEntityId, setNewEntityId] = useState('');
  
  const activeEntityId = isCreatingNew ? newEntityId : (calibCategory === 'prop' ? calibPropId : calibCategory === 'tile' ? calibTileId : calibCharId);

  // Interactive Calibrator Sliders & Values
  const [cropX, setCropX] = useState<number>(55);
  const [cropY, setCropY] = useState<number>(0);
  const [cropW, setCropW] = useState<number>(375);
  const [cropH, setCropH] = useState<number>(265);
  const [calibScale, setCalibScale] = useState<number>(1.0);
  const [calibOffsetX, setCalibOffsetX] = useState<number>(0);
  const [calibOffsetY, setCalibOffsetY] = useState<number>(0);
  const [calibAnchorX, setCalibAnchorX] = useState<number>(0.5);
  const [calibAnchorY, setCalibAnchorY] = useState<number>(1.0);
  const [calibImageKey, setCalibImageKey] = useState<string>('office_props_topdown');

  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const calibPreviewRef = useRef<HTMLCanvasElement | null>(null);
  const calibSheetRef = useRef<HTMLCanvasElement | null>(null);

  // New states for interactive canvas & workflow
  const [gridSnap, setGridSnap] = useState<number>(16);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  
  const [bgColorMode, setBgColorMode] = useState<'dark' | 'light' | 'checker'>('dark');
  const [isEyedropper, setIsEyedropper] = useState(false);
  const [chromaHex, setChromaHex] = useState<string>('#00ff00');
  
  const [isPixelEdit, setIsPixelEdit] = useState(false);
  const [pixelEditMode, setPixelEditMode] = useState<'pencil' | 'eraser'>('pencil');
  const [pixelColor, setPixelColor] = useState<string>('#ffffff');

  useEffect(() => {
    const unsub = spriteManager.subscribe(() => {
      setArtMode(spriteManager.mode);
      setTriggerUpdate((n) => n + 1);
    });
    return unsub;
  }, []);

  const atlasCharacters = useMemo(() => Object.keys(SPRITE_ATLAS_MANIFEST.characters), [triggerUpdate]);
  const atlasProps = useMemo(() => Object.keys(SPRITE_ATLAS_MANIFEST.props), [triggerUpdate]);
  const atlasTiles = useMemo(() => Object.keys(SPRITE_ATLAS_MANIFEST.tiles), [triggerUpdate]);
  const atlasPortraits = useMemo(() => Object.keys(SPRITE_ATLAS_MANIFEST.portraits), [triggerUpdate]);

  const allKnownImageKeys = useMemo(() => {
    const keys = new Set<string>();
    Object.keys(SPRITE_ATLAS_MANIFEST.images).forEach((k) => keys.add(k));
    spriteManager.getImageKeys().forEach((k) => keys.add(k));
    return Array.from(keys);
  }, [triggerUpdate]);

  // Sync Calibrator Inputs when selection or category changes
  useEffect(() => {
    if (calibCategory === 'prop') {
      const def = SPRITE_ATLAS_MANIFEST.props[calibPropId as any];
      if (def) {
        setCropX(def.rect.x);
        setCropY(def.rect.y);
        setCropW(def.rect.w);
        setCropH(def.rect.h);
        setCalibScale(def.scale ?? 1.0);
        setCalibOffsetX(def.offsetX ?? 0);
        setCalibOffsetY(def.offsetY ?? 0);
        setCalibAnchorX(def.rect.anchorX ?? 0.5);
        setCalibAnchorY(def.rect.anchorY ?? 1.0);
        setCalibImageKey(def.imageKey);
      }
    } else if (calibCategory === 'tile') {
      const def = SPRITE_ATLAS_MANIFEST.tiles[calibTileId as any];
      if (def) {
        setCropX(def.rect.x);
        setCropY(def.rect.y);
        setCropW(def.rect.w);
        setCropH(def.rect.h);
        setCalibScale(1.0);
        setCalibOffsetX(0);
        setCalibOffsetY(0);
        setCalibAnchorX(0.5);
        setCalibAnchorY(0.5);
        setCalibImageKey(def.imageKey);
      }
    } else {
      const def = SPRITE_ATLAS_MANIFEST.characters[calibCharId];
      if (def) {
        const frame = def.animations.down[0] || { x: 0, y: 0, w: def.frameWidth, h: def.frameHeight };
        setCropX(frame.x);
        setCropY(frame.y);
        setCropW(frame.w);
        setCropH(frame.h);
        setCalibScale(def.scale ?? 0.235);
        setCalibOffsetX(def.offsetX ?? 0);
        setCalibOffsetY(def.offsetY ?? 0);
        setCalibAnchorX(frame.anchorX ?? 0.5);
        setCalibAnchorY(frame.anchorY ?? 0.95);
        setCalibImageKey(def.imageKey);
      }
    }
  }, [calibCategory, calibPropId, calibCharId, calibTileId]);

  // ─── Interactive Handlers ──────────────────────────────────────────────────
  const getSourceCoords = (e: React.MouseEvent<HTMLCanvasElement>, canvas: HTMLCanvasElement, img: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const domX = e.clientX - rect.left;
    const domY = e.clientY - rect.top;
    const internalX = (domX / rect.width) * canvas.width;
    const internalY = (domY / rect.height) * canvas.height;
    const imgScale = canvas.width / img.width;
    return {
      x: internalX / imgScale,
      y: internalY / imgScale,
      internalX,
      internalY
    };
  };

  const handleSheetMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isEyedropper || isPixelEdit) return;
    const canvas = calibSheetRef.current;
    if (!canvas) return;
    const img = spriteManager.getLoadedImages().get(calibImageKey);
    if (!img || img.width === 0) return;
    
    const { x, y } = getSourceCoords(e, canvas, img);
    setIsDragging(true);
    const snap = gridSnap || 1;
    const startX = Math.round(x / snap) * snap;
    const startY = Math.round(y / snap) * snap;
    setDragStart({ x: startX, y: startY });
    setCropX(startX);
    setCropY(startY);
    setCropW(snap);
    setCropH(snap);
  };

  const handleSheetMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = calibSheetRef.current;
    if (!canvas) return;
    const img = spriteManager.getLoadedImages().get(calibImageKey);
    if (!img || img.width === 0) return;

    if (isDragging && dragStart) {
      const { x, y } = getSourceCoords(e, canvas, img);
      const snap = gridSnap || 1;
      let curX = Math.round(x / snap) * snap;
      let curY = Math.round(y / snap) * snap;
      
      setCropX(Math.min(dragStart.x, curX));
      setCropY(Math.min(dragStart.y, curY));
      setCropW(Math.max(Math.abs(curX - dragStart.x), snap));
      setCropH(Math.max(Math.abs(curY - dragStart.y), snap));
    }
  };

  const handleSheetMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  const handleSheetClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = calibSheetRef.current;
    if (!canvas) return;
    const img = spriteManager.getLoadedImages().get(calibImageKey);
    if (!img || img.width === 0) return;

    const { x, y, internalX, internalY } = getSourceCoords(e, canvas, img);
    const imgX = Math.floor(x);
    const imgY = Math.floor(y);

    if (isEyedropper) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const p = ctx.getImageData(internalX, internalY, 1, 1).data;
        const hex = "#" + ("000000" + ((p[0] << 16) | (p[1] << 8) | p[2]).toString(16)).slice(-6);
        setChromaHex(hex);
        spriteManager.reprocessChromaKey(calibImageKey, hex);
        setTriggerUpdate(n => n + 1);
        setIsEyedropper(false);
      }
    } else if (isPixelEdit) {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = img.width;
      tempCanvas.height = img.height;
      const tCtx = tempCanvas.getContext('2d');
      if (tCtx) {
        tCtx.imageSmoothingEnabled = false;
        tCtx.drawImage(img, 0, 0);
        
        if (pixelEditMode === 'eraser') {
          tCtx.clearRect(imgX, imgY, 1, 1);
        } else {
          tCtx.fillStyle = pixelColor;
          tCtx.fillRect(imgX, imgY, 1, 1);
        }
        spriteManager.updateImageTexture(calibImageKey, tempCanvas);
        setTriggerUpdate(n => n + 1);
      }
    }
  };

  const handleAutoFitBounds = () => {
    const img = spriteManager.getLoadedImages().get(calibImageKey);
    if (!img) return;
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(img, 0, 0);
    
    // Bounds check within current crop
    const data = ctx.getImageData(cropX, cropY, cropW, cropH).data;
    let minX = cropW, minY = cropH, maxX = 0, maxY = 0;
    let found = false;
    for (let y = 0; y < cropH; y++) {
      for (let x = 0; x < cropW; x++) {
        const alpha = data[(y * cropW + x) * 4 + 3];
        if (alpha > 0) {
          found = true;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (found) {
      setCropX(cropX + minX);
      setCropY(cropY + minY);
      setCropW(maxX - minX + 1);
      setCropH(maxY - minY + 1);
    }
  };

  // Apply Live Override
  const handleApplyOverride = () => {
    if (!activeEntityId) return;
    if (calibCategory === 'prop') {
      spriteManager.setPropOverride(activeEntityId, {
        imageKey: calibImageKey,
        scale: calibScale,
        offsetX: calibOffsetX,
        offsetY: calibOffsetY,
        rect: {
          x: cropX,
          y: cropY,
          w: cropW,
          h: cropH,
          anchorX: calibAnchorX,
          anchorY: calibAnchorY,
        },
      });
    } else if (calibCategory === 'tile') {
      spriteManager.setTileOverride(activeEntityId, {
        imageKey: calibImageKey,
        rect: {
          x: cropX,
          y: cropY,
          w: cropW,
          h: cropH,
        },
      });
    } else {
      spriteManager.setCharacterOverride(activeEntityId, {
        imageKey: calibImageKey,
        scale: calibScale,
        offsetX: calibOffsetX,
        offsetY: calibOffsetY,
      });
    }
  };

  // Reset Override
  const handleResetOverride = () => {
    spriteManager.clearOverrides();
    // Re-sync
    if (calibCategory === 'prop') {
      const def = SPRITE_ATLAS_MANIFEST.props[calibPropId as any];
      if (def) {
        setCropX(def.rect.x);
        setCropY(def.rect.y);
        setCropW(def.rect.w);
        setCropH(def.rect.h);
        setCalibScale(def.scale ?? 1.0);
        setCalibOffsetX(0);
        setCalibOffsetY(0);
        setCalibImageKey(def.imageKey);
      }
    } else if (calibCategory === 'tile') {
      const def = SPRITE_ATLAS_MANIFEST.tiles[calibTileId as any];
      if (def) {
        setCropX(def.rect.x);
        setCropY(def.rect.y);
        setCropW(def.rect.w);
        setCropH(def.rect.h);
        setCalibImageKey(def.imageKey);
      }
    }
  };

  // Animated character walk-cycle preview loop for Cast Tab
  useEffect(() => {
    if (!isOpen || activeTab !== 'cast') return;
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame = 0;
    let animTimer = 0;
    let animId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = false;

      animTimer += 16;
      if (animTimer > 180) {
        animTimer = 0;
        frame = (frame + 1) % 4;
      }

      const spriteFrame = spriteManager.getCharacterFrame(
        selectedChar,
        selectedDirection,
        frame,
        isWalking,
        false
      );

      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.beginPath();
      ctx.ellipse(canvas.width / 2, canvas.height / 2 + 58, 42, 14, 0, 0, Math.PI * 2);
      ctx.fill();

      if (spriteFrame) {
        const { canvas: sc, rect, scale: charScale, offsetX, offsetY } = spriteFrame;
        const scale = charScale * 4.5;
        const dw = Math.round(rect.w * scale);
        const dh = Math.round(rect.h * scale);
        const dx = Math.round(canvas.width / 2 - dw / 2 + (offsetX || 0));
        const dy = Math.round(canvas.height / 2 - dh / 2 + 10 + (offsetY || 0));
        ctx.drawImage(sc, rect.x, rect.y, rect.w, rect.h, dx, dy, dw, dh);
      } else {
        ctx.fillStyle = '#94a3b8';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('No sprite loaded (procedural active)', canvas.width / 2, canvas.height / 2);
      }

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [isOpen, activeTab, selectedChar, selectedDirection, isWalking, triggerUpdate]);

  // Calibrator Preview Render (Entity preview + Spritesheet crop box)
  useEffect(() => {
    if (!isOpen || activeTab !== 'calibrator') return;

    // 1. Render calibrated entity preview
    const canvas = calibPreviewRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.imageSmoothingEnabled = false;

        // Ground grid & center lines
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1;
        for (let i = 0; i < canvas.width; i += 20) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i, canvas.height);
          ctx.stroke();
        }
        for (let j = 0; j < canvas.height; j += 20) {
          ctx.beginPath();
          ctx.moveTo(0, j);
          ctx.lineTo(canvas.width, j);
          ctx.stroke();
        }

        const img = spriteManager.getLoadedImages().get(calibImageKey);

        if (calibCategory === 'tile') {
          // Render a 2x2 repeating tile grid on left and 1x1 focused tile on right
          if (img && cropW > 0 && cropH > 0) {
            const tileSize = 64;
            // 2x2 tiled pattern
            for (let r = 0; r < 2; r++) {
              for (let c = 0; c < 2; c++) {
                ctx.drawImage(
                  img,
                  cropX,
                  cropY,
                  cropW,
                  cropH,
                  20 + c * tileSize,
                  20 + r * tileSize,
                  tileSize,
                  tileSize
                );
              }
            }
            ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)';
            ctx.strokeRect(20, 20, tileSize * 2, tileSize * 2);

            // Single focused tile preview
            const bigSize = 192;
            ctx.drawImage(
              img,
              cropX,
              cropY,
              cropW,
              cropH,
              canvas.width - bigSize - 20,
              canvas.height / 2 - bigSize / 2,
              bigSize,
              bigSize
            );
            ctx.strokeRect(canvas.width - bigSize - 20, canvas.height / 2 - bigSize / 2, bigSize, bigSize);
          }
        } else {
          // Center baseline
          const baselineY = canvas.height * 0.75;
          ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
          ctx.beginPath();
          ctx.moveTo(canvas.width / 2, 0);
          ctx.lineTo(canvas.width / 2, canvas.height);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(0, baselineY);
          ctx.lineTo(canvas.width, baselineY);
          ctx.stroke();

          if (img && cropW > 0 && cropH > 0) {
            const fitScale = calibScale * 4.0;
            const dw = Math.round(cropW * fitScale);
            const dh = Math.round(cropH * fitScale);
            const dx = Math.round(canvas.width / 2 - dw / 2 + calibOffsetX);
            const dy = Math.round(baselineY - dh + calibOffsetY);

            ctx.drawImage(img, cropX, cropY, cropW, cropH, dx, dy, dw, dh);
          }
        }
      }
    }

    // 2. Render source texture sheet with crop box overlay
    const sheetCanvas = calibSheetRef.current;
    if (sheetCanvas) {
      const sCtx = sheetCanvas.getContext('2d');
      if (sCtx) {
        sCtx.clearRect(0, 0, sheetCanvas.width, sheetCanvas.height);
        sCtx.imageSmoothingEnabled = false;

        const img = spriteManager.getLoadedImages().get(calibImageKey);
        if (img && img.width > 0 && img.height > 0) {
          const scale = sheetCanvas.width / img.width;
          sCtx.drawImage(img, 0, 0, sheetCanvas.width, img.height * scale);

          // Draw highlighted red bounding box over crop
          sCtx.strokeStyle = '#ef4444';
          sCtx.lineWidth = 2;
          sCtx.strokeRect(cropX * scale, cropY * scale, cropW * scale, cropH * scale);
          sCtx.fillStyle = 'rgba(239, 68, 68, 0.25)';
          sCtx.fillRect(cropX * scale, cropY * scale, cropW * scale, cropH * scale);
        } else {
          sCtx.fillStyle = '#64748b';
          sCtx.font = '10px monospace';
          sCtx.textAlign = 'center';
          sCtx.fillText(`Image texture "${calibImageKey}" not loaded`, sheetCanvas.width / 2, sheetCanvas.height / 2);
        }
      }
    }
  }, [isOpen, activeTab, calibCategory, calibPropId, calibCharId, calibTileId, cropX, cropY, cropW, cropH, calibScale, calibOffsetX, calibOffsetY, calibImageKey, triggerUpdate]);

  if (!isOpen) return null;

  // Generated TypeScript code snippet
  const generatedSnippet =
    calibCategory === 'prop'
      ? `${activeEntityId || 'new_prop'}: {
  propType: '${activeEntityId || 'new_prop'}',
  imageKey: '${calibImageKey}',
  rect: { x: ${cropX}, y: ${cropY}, w: ${cropW}, h: ${cropH}, anchorX: ${calibAnchorX}, anchorY: ${calibAnchorY} },
  scale: ${calibScale},
  offsetX: ${calibOffsetX},
  offsetY: ${calibOffsetY},
  enabled: true,
},`
      : calibCategory === 'tile'
      ? `${calibTileId}: {
  tileType: '${calibTileId}',
  imageKey: '${calibImageKey}',
  rect: { x: ${cropX}, y: ${cropY}, w: ${cropW}, h: ${cropH} },
  enabled: true,
},`
      : `${calibCharId}: {
  characterId: '${calibCharId}',
  imageKey: '${calibImageKey}',
  frameWidth: ${cropW},
  frameHeight: ${cropH},
  scale: ${calibScale},
  offsetX: ${calibOffsetX},
  offsetY: ${calibOffsetY},
  enabled: true,
},`;

  const activeEntityEnabled =
    calibCategory === 'prop'
      ? spriteManager.isAssetEnabled('prop', calibPropId)
      : calibCategory === 'tile'
      ? spriteManager.isAssetEnabled('tile', calibTileId)
      : spriteManager.isAssetEnabled('character', calibCharId);

  const TABS = [
    { id: 'coverage' as const, label: '📊 Asset Coverage', count: null },
    { id: 'calibrator' as const, label: '🎯 Calibrator & Swapper', count: null },
    { id: 'cast' as const, label: '🏃 Cast', count: atlasCharacters.length },
    { id: 'props' as const, label: '🪑 Props', count: atlasProps.length },
    { id: 'tiles' as const, label: '🧱 Tiles', count: atlasTiles.length },
    { id: 'portraits' as const, label: '🎥 Portraits', count: atlasPortraits.length },
    { id: 'prompts' as const, label: '✨ Prompts', count: null },
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-5 animate-in fade-in duration-200"
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          const file = e.dataTransfer.files[0];
          const newKey = file.name.split('.')[0];
          spriteManager.addLocalImage(file, newKey).then(() => {
             setCalibImageKey(newKey);
             setTriggerUpdate(n => n + 1);
          });
        }
      }}
    >
      <div className="relative w-[98vw] h-[98vh] max-w-none bg-[#131b26] border-4 border-[#2a374a] shadow-2xl rounded-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#0c1017] border-b-2 border-[#2a374a]">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="pixel-font text-xs sm:text-sm font-bold text-amber-400">
                SPRITE STUDIO & ART PIPELINE
              </h2>
              <p className="text-[10px] text-slate-400 font-mono">
                Modular Manifests · Granular Overrides · Live Spritesheet Calibrator
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center bg-[#131b26] p-1 border border-[#2a374a] rounded">
              <span className="text-[10px] font-mono text-slate-400 mr-2 ml-1">GLOBAL MODE:</span>
              <button
                onClick={() => spriteManager.setMode('sprites')}
                className={`text-[9px] px-2 py-1 rounded font-mono font-bold transition-all ${
                  artMode === 'sprites'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                SPRITES
              </button>
              <button
                onClick={() => spriteManager.setMode('procedural')}
                className={`text-[9px] px-2 py-1 rounded font-mono font-bold transition-all ${
                  artMode === 'procedural'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                PROCEDURAL
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1 hover:bg-[#1f2937] rounded text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-4 py-2 bg-[#0e141d] border-b border-[#2a374a] overflow-x-auto text-xs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded font-mono text-[11px] font-semibold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}{tab.count != null ? ` (${tab.count})` : ''}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 p-4 overflow-y-auto min-h-[420px]">

          {/* ═══════════════════ CALIBRATOR & SWAPPER TAB ═══════════════════ */}
          {activeTab === 'calibrator' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Left Control Panel */}
              <div className="lg:col-span-5 flex flex-col gap-3 bg-[#0a0e14] p-3.5 rounded-lg border border-[#2a374a] text-xs font-mono">
                <div className="flex items-center justify-between pb-2 border-b border-[#2a374a]">
                  <span className="text-amber-400 font-bold flex items-center gap-1.5">
                    <Sliders className="w-4 h-4" /> ASSET CALIBRATOR
                  </span>
                  <div className="flex items-center gap-1 bg-[#131b26] p-0.5 rounded border border-[#2a374a]">
                    <button
                      onClick={() => setCalibCategory('prop')}
                      className={`px-2 py-0.5 text-[10px] rounded font-bold ${
                        calibCategory === 'prop' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
                      }`}
                    >
                      PROP
                    </button>
                    <button
                      onClick={() => setCalibCategory('character')}
                      className={`px-2 py-0.5 text-[10px] rounded font-bold ${
                        calibCategory === 'character' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
                      }`}
                    >
                      CHARACTER
                    </button>
                    <button
                      onClick={() => setCalibCategory('tile')}
                      className={`px-2 py-0.5 text-[10px] rounded font-bold ${
                        calibCategory === 'tile' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
                      }`}
                    >
                      TILE
                    </button>
                  </div>
                </div>

                {/* Target Entity Selector */}
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">
                    SELECT {calibCategory.toUpperCase()} TO CALIBRATE / OVERRIDE:
                  </label>
                  {calibCategory === 'prop' ? (
                    <select
                      value={isCreatingNew ? '--new--' : calibPropId}
                      onChange={(e) => {
                        if (e.target.value === '--new--') {
                          setIsCreatingNew(true);
                          setNewEntityId('new_prop');
                        } else {
                          setIsCreatingNew(false);
                          setCalibPropId(e.target.value);
                        }
                      }}
                      className="w-full bg-[#131b26] border border-[#2a374a] text-slate-200 p-1.5 rounded font-mono text-xs focus:outline-none focus:border-amber-400"
                    >
                      <option value="--new--">-- Create New --</option>
                      {atlasProps.map((p) => (
                        <option key={p} value={p}>
                          {p.replace(/_/g, ' ')}
                        </option>
                      ))}
                    </select>
                  ) : calibCategory === 'tile' ? (
                    <select
                      value={isCreatingNew ? '--new--' : calibTileId}
                      onChange={(e) => {
                        if (e.target.value === '--new--') {
                          setIsCreatingNew(true);
                          setNewEntityId('new_tile');
                        } else {
                          setIsCreatingNew(false);
                          setCalibTileId(e.target.value);
                        }
                      }}
                      className="w-full bg-[#131b26] border border-[#2a374a] text-slate-200 p-1.5 rounded font-mono text-xs focus:outline-none focus:border-amber-400"
                    >
                      <option value="--new--">-- Create New --</option>
                      {atlasTiles.map((t) => (
                        <option key={t} value={t}>
                          {t.replace(/_/g, ' ')}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <select
                      value={isCreatingNew ? '--new--' : calibCharId}
                      onChange={(e) => {
                        if (e.target.value === '--new--') {
                          setIsCreatingNew(true);
                          setNewEntityId('new_char');
                        } else {
                          setIsCreatingNew(false);
                          setCalibCharId(e.target.value);
                        }
                      }}
                      className="w-full bg-[#131b26] border border-[#2a374a] text-slate-200 p-1.5 rounded font-mono text-xs focus:outline-none focus:border-amber-400"
                    >
                      <option value="--new--">-- Create New --</option>
                      {atlasCharacters.map((c) => (
                        <option key={c} value={c}>
                          {c} ({ALL_CHARACTERS[c]?.name || c})
                        </option>
                      ))}
                    </select>
                  )}
                  
                  {isCreatingNew && (
                    <input 
                      type="text" 
                      value={newEntityId} 
                      onChange={e => setNewEntityId(e.target.value)} 
                      placeholder={`Enter new ${calibCategory} ID...`}
                      className="mt-2 w-full bg-[#0a0e14] border border-[#2a374a] text-amber-300 p-1.5 rounded font-mono text-xs focus:outline-none focus:border-cyan-400"
                    />
                  )}
                </div>

                {/* Sprite Sheet / Image Texture Selector */}
                <div className="p-2 rounded bg-[#131b26] border border-[#2a374a]">
                  <label className="text-[10px] text-cyan-400 font-bold flex items-center gap-1 mb-1">
                    <ImageIcon className="w-3.5 h-3.5" /> SOURCE SPRITE SHEET (IMAGE KEY):
                  </label>
                  <div className="flex gap-1.5">
                    <select
                      value={calibImageKey}
                      onChange={(e) => setCalibImageKey(e.target.value)}
                      className="flex-1 bg-[#0a0e14] border border-[#2a374a] text-slate-200 p-1 rounded font-mono text-[11px] focus:outline-none focus:border-cyan-400"
                    >
                      {allKnownImageKeys.map((k) => (
                        <option key={k} value={k}>
                          {k}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Custom key"
                      value={calibImageKey}
                      onChange={(e) => setCalibImageKey(e.target.value)}
                      className="w-32 bg-[#0a0e14] border border-[#2a374a] text-slate-200 p-1 rounded font-mono text-[11px] focus:outline-none focus:border-cyan-400"
                      title="Type or edit custom imageKey directly"
                    />
                  </div>
                </div>

                {/* Individual Asset Fallback Toggle */}
                <div className="flex items-center justify-between p-2 rounded bg-[#131b26] border border-[#2a374a]">
                  <div>
                    <span className="text-[11px] text-slate-200 font-bold block">Individual Asset Mode</span>
                    <span className="text-[9px] text-slate-400">Toggle sprite vs procedural for this asset only</span>
                  </div>
                  <button
                    onClick={() => {
                      if (calibCategory === 'prop') {
                        spriteManager.setAssetEnabled('prop', calibPropId, !activeEntityEnabled);
                      } else if (calibCategory === 'tile') {
                        spriteManager.setAssetEnabled('tile', calibTileId, !activeEntityEnabled);
                      } else {
                        spriteManager.setAssetEnabled('character', calibCharId, !activeEntityEnabled);
                      }
                      setTriggerUpdate((n) => n + 1);
                    }}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold ${
                      activeEntityEnabled
                        ? 'bg-emerald-600 text-white shadow'
                        : 'bg-amber-600 text-slate-950 shadow'
                    }`}
                  >
                    {activeEntityEnabled ? (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5" /> SPRITE ON
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="w-3.5 h-3.5" /> PROCEDURAL
                      </>
                    )}
                  </button>
                </div>

                {/* Crop & Dimension Sliders */}
                <div className="space-y-2 pt-1">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                        <span>Crop X:</span>
                        <input
                          type="number"
                          value={cropX}
                          onChange={(e) => setCropX(Number(e.target.value))}
                          className="w-14 bg-[#131b26] border border-[#2a374a] text-amber-300 px-1 py-0.5 rounded text-right"
                        />
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="2048"
                        value={cropX}
                        onChange={(e) => setCropX(Number(e.target.value))}
                        className="w-full h-1.5 bg-[#1e293b] rounded appearance-none cursor-pointer accent-amber-400"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                        <span>Crop Y:</span>
                        <input
                          type="number"
                          value={cropY}
                          onChange={(e) => setCropY(Number(e.target.value))}
                          className="w-14 bg-[#131b26] border border-[#2a374a] text-amber-300 px-1 py-0.5 rounded text-right"
                        />
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="2048"
                        value={cropY}
                        onChange={(e) => setCropY(Number(e.target.value))}
                        className="w-full h-1.5 bg-[#1e293b] rounded appearance-none cursor-pointer accent-amber-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                        <span>Width:</span>
                        <input
                          type="number"
                          value={cropW}
                          onChange={(e) => setCropW(Number(e.target.value))}
                          className="w-14 bg-[#131b26] border border-[#2a374a] text-amber-300 px-1 py-0.5 rounded text-right"
                        />
                      </div>
                      <input
                        type="range"
                        min="8"
                        max="2048"
                        value={cropW}
                        onChange={(e) => setCropW(Number(e.target.value))}
                        className="w-full h-1.5 bg-[#1e293b] rounded appearance-none cursor-pointer accent-amber-400"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                        <span>Height:</span>
                        <input
                          type="number"
                          value={cropH}
                          onChange={(e) => setCropH(Number(e.target.value))}
                          className="w-14 bg-[#131b26] border border-[#2a374a] text-amber-300 px-1 py-0.5 rounded text-right"
                        />
                      </div>
                      <input
                        type="range"
                        min="8"
                        max="2048"
                        value={cropH}
                        onChange={(e) => setCropH(Number(e.target.value))}
                        className="w-full h-1.5 bg-[#1e293b] rounded appearance-none cursor-pointer accent-amber-400"
                      />
                    </div>
                  </div>

                  {calibCategory !== 'tile' && (
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-400 block">Scale: {calibScale.toFixed(2)}</label>
                        <input
                          type="range"
                          min="0.05"
                          max="3.0"
                          step="0.005"
                          value={calibScale}
                          onChange={(e) => setCalibScale(Number(e.target.value))}
                          className="w-full h-1.5 bg-[#1e293b] rounded appearance-none cursor-pointer accent-amber-400"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block">Offset X: {calibOffsetX}px</label>
                        <input
                          type="range"
                          min="-50"
                          max="50"
                          value={calibOffsetX}
                          onChange={(e) => setCalibOffsetX(Number(e.target.value))}
                          className="w-full h-1.5 bg-[#1e293b] rounded appearance-none cursor-pointer accent-amber-400"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block">Offset Y: {calibOffsetY}px</label>
                        <input
                          type="range"
                          min="-50"
                          max="50"
                          value={calibOffsetY}
                          onChange={(e) => setCalibOffsetY(Number(e.target.value))}
                          className="w-full h-1.5 bg-[#1e293b] rounded appearance-none cursor-pointer accent-amber-400"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Workflow Tools */}
                <div className="grid grid-cols-2 gap-2 pb-2 border-b border-[#2a374a]">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-400">Grid Snap / Auto-Fit:</label>
                    <div className="flex items-center gap-1">
                      <select 
                        value={gridSnap} 
                        onChange={(e) => setGridSnap(Number(e.target.value))}
                        className="flex-1 bg-[#131b26] border border-[#2a374a] text-amber-300 px-1 py-1 rounded text-[10px]"
                      >
                        <option value={1}>No Snap</option>
                        <option value={8}>8px</option>
                        <option value={16}>16px</option>
                        <option value={32}>32px</option>
                        <option value={64}>64px</option>
                      </select>
                      <button 
                        onClick={handleAutoFitBounds}
                        className="px-2 py-1 bg-[#1e293b] hover:bg-[#2a374a] text-slate-300 rounded text-[10px] font-bold transition-colors"
                        title="Auto-Fit bounds to nearest non-transparent pixels"
                      >
                        AUTO-FIT
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-400">Live Chroma Key:</label>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { setIsEyedropper(!isEyedropper); setIsPixelEdit(false); }}
                        className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition-colors ${isEyedropper ? 'bg-cyan-600 text-white shadow' : 'bg-[#1e293b] text-slate-300 hover:bg-[#2a374a]'}`}
                        title="Pick color from image to turn transparent"
                      >
                        <Palette className="w-3 h-3" /> {isEyedropper ? 'PICKING...' : 'KEY'}
                      </button>
                      <button 
                        onClick={() => { spriteManager.reprocessChromaKey(calibImageKey, ''); setTriggerUpdate(n => n + 1); }}
                        className="px-2 py-1 bg-red-900/30 hover:bg-red-900/60 text-red-400 border border-red-900/50 rounded text-[10px] font-bold"
                        title="Remove chroma-key"
                      >
                        RESET
                      </button>
                    </div>
                  </div>

                  <div className="col-span-2 flex items-center gap-1 justify-between bg-[#131b26] p-1.5 rounded border border-[#2a374a]">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { setIsPixelEdit(!isPixelEdit); setIsEyedropper(false); }}
                        className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${isPixelEdit ? 'bg-purple-600 text-white' : 'bg-[#1e293b] text-slate-300'}`}
                      >
                        PIXEL EDIT
                      </button>
                      {isPixelEdit && (
                        <>
                          <button onClick={() => setPixelEditMode('pencil')} className={`px-1.5 py-1 rounded text-[10px] ${pixelEditMode === 'pencil' ? 'bg-slate-600 text-white' : 'text-slate-400'}`}>PENCIL</button>
                          <button onClick={() => setPixelEditMode('eraser')} className={`px-1.5 py-1 rounded text-[10px] ${pixelEditMode === 'eraser' ? 'bg-slate-600 text-white' : 'text-slate-400'}`}>ERASE</button>
                          {pixelEditMode === 'pencil' && (
                            <input type="color" value={pixelColor} onChange={e => setPixelColor(e.target.value)} className="w-5 h-5 rounded cursor-pointer border-none bg-transparent" />
                          )}
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[10px]">
                      <span className="text-slate-500 mr-1">BG:</span>
                      <button onClick={() => setBgColorMode('dark')} className={`w-4 h-4 rounded border ${bgColorMode === 'dark' ? 'border-amber-400 bg-[#070a0f]' : 'border-slate-600 bg-[#070a0f]'}`}></button>
                      <button onClick={() => setBgColorMode('light')} className={`w-4 h-4 rounded border ${bgColorMode === 'light' ? 'border-amber-400 bg-slate-200' : 'border-slate-600 bg-slate-200'}`}></button>
                      <button onClick={() => setBgColorMode('checker')} className={`w-4 h-4 rounded border relative overflow-hidden ${bgColorMode === 'checker' ? 'border-amber-400' : 'border-slate-600'}`}>
                        <div className="absolute inset-0 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAAXNSR0IArs4c6QAAACVJREFUKFNjZCASMDKgA2NjY/9Hk0FRMKoIqAWMXApGZcHoIuAAnKkI35fI/X4AAAAASUVORK5CYII=')]"></div>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleApplyOverride}
                    className="flex-1 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded text-xs transition-colors shadow"
                  >
                    Apply Live In-Game
                  </button>
                  <button
                    onClick={handleResetOverride}
                    className="p-1.5 bg-[#131b26] hover:bg-[#1a2332] text-slate-400 hover:text-white rounded border border-[#2a374a]"
                    title="Reset to manifest defaults"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Right Preview Panels */}
              <div className="lg:col-span-7 flex flex-col gap-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Calibrated In-Game Canvas */}
                  <div className="bg-[#0a0e14] p-3 rounded-lg border border-[#2a374a] flex flex-col items-center">
                    <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                      {calibCategory === 'tile' ? <Grid className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      {calibCategory === 'tile' ? 'Tile Repeat & Focus Preview' : 'Render Preview'}
                    </span>
                    <canvas
                      ref={calibPreviewRef}
                      width={600}
                      height={600}
                      className={`w-full h-auto max-h-[65vh] object-contain border border-[#1e293b] rounded shadow-inner ${
                        bgColorMode === 'dark' ? 'bg-[#070a0f]' : 
                        bgColorMode === 'light' ? 'bg-slate-200' : 
                        "bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAX0lEQVQ4T2N88+bNfwYiAOOoQoZRRYyiYIYZ/kOQc+fOsQDF+IFCBlIFBw8e/E9MGBk4ceLEf2LDSCXDOQeRiMBxVMGoQkZRMJIK8Y3/8OFDEq1iZGRkINUKRg5qGAUAx6E/RfqgUfMAAAAASUVORK5CYII=')]"
                      }`}
                      style={{ imageRendering: 'pixelated' }}
                    />
                  </div>

                  {/* Spritesheet Texture & Bounding Box */}
                  <div className="bg-[#0a0e14] p-3 rounded-lg border border-[#2a374a] flex flex-col items-center">
                    <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Crop className="w-3.5 h-3.5" /> Texture Sheet ({calibImageKey})
                    </span>
                    <canvas
                      ref={calibSheetRef}
                      width={600}
                      height={600}
                      onMouseDown={handleSheetMouseDown}
                      onMouseMove={handleSheetMouseMove}
                      onMouseUp={handleSheetMouseUp}
                      onMouseLeave={handleSheetMouseUp}
                      onClick={handleSheetClick}
                      className={`w-full h-auto max-h-[65vh] object-contain border border-[#1e293b] rounded shadow-inner ${
                        isEyedropper ? 'cursor-crosshair' : isPixelEdit ? 'cursor-cell' : 'cursor-crosshair'
                      } ${
                        bgColorMode === 'dark' ? 'bg-[#070a0f]' : 
                        bgColorMode === 'light' ? 'bg-slate-200' : 
                        "bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAX0lEQVQ4T2N88+bNfwYiAOOoQoZRRYyiYIYZ/kOQc+fOsQDF+IFCBlIFBw8e/E9MGBk4ceLEf2LDSCXDOQeRiMBxVMGoQkZRMJIK8Y3/8OFDEq1iZGRkINUKRg5qGAUAx6E/RfqgUfMAAAAASUVORK5CYII=')]"
                      }`}
                      style={{ imageRendering: 'pixelated' }}
                    />
                  </div>
                </div>

                {/* Generated Code Snippet */}
                <div className="bg-[#0a0e14] p-3 rounded-lg border border-[#2a374a] relative">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                      Export Manifest TypeScript Definition:
                    </span>
                  </div>
                  <pre className="text-[10px] text-emerald-400 bg-[#070a0f] p-2.5 rounded overflow-x-auto font-mono">
                    <code>{generatedSnippet}</code>
                  </pre>
                  <CopyButton text={generatedSnippet} />
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════ COVERAGE TAB ═══════════════════ */}
          {activeTab === 'coverage' && (
            <div className="flex flex-col gap-5">
              {SHOW_IDS.map((showId) => {
                const showLabel = SHOW_LABELS[showId] || showId;
                const chars = Object.values(ALL_CHARACTERS).filter((c) => c.showId === showId);
                const settingEntry = Object.entries(ALL_SETTINGS).find(
                  ([, s]) => s.showTitle === showLabel || s.id.includes(showId.replace('the_', ''))
                );
                const settingId = settingEntry?.[0];
                const settingDef = settingEntry?.[1];

                const settingProps = settingId ? collectPropTypesForSetting(settingId) : new Set<string>();
                const settingTiles = settingId ? collectTileTypesForSetting(settingId) : new Set<string>();

                const charsSprited = chars.filter((c) => !!SPRITE_ATLAS_MANIFEST.characters[c.id]);
                const propsSprited = [...settingProps].filter((t) => !!SPRITE_ATLAS_MANIFEST.props[t as any]);
                const tilesSprited = [...settingTiles].filter((t) => !!SPRITE_ATLAS_MANIFEST.tiles[t as any]);
                const portraitsSprited = chars.filter((c) => !!SPRITE_ATLAS_MANIFEST.portraits[c.id]);

                const totalAssets = chars.length + settingProps.size + settingTiles.size;
                const spritedAssets = charsSprited.length + propsSprited.length + tilesSprited.length;
                const coveragePct = totalAssets > 0 ? Math.round((spritedAssets / totalAssets) * 100) : 0;

                return (
                  <div key={showId} className="bg-[#0a0e14] rounded-lg border border-[#2a374a] overflow-hidden">
                    {/* Show Header */}
                    <div className="flex items-center justify-between px-4 py-2.5 bg-[#0c1117] border-b border-[#2a374a]">
                      <div>
                        <h3 className="text-sm font-bold text-white font-mono">{showLabel}</h3>
                        <p className="text-[10px] text-slate-500 font-mono">
                          Setting: {settingDef?.name || 'N/A'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                          coveragePct === 100 ? 'bg-emerald-500/20 text-emerald-400' :
                          coveragePct > 50 ? 'bg-amber-500/20 text-amber-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {coveragePct}% coverage
                        </div>
                        <span className="text-[10px] font-mono text-slate-500">
                          {spritedAssets}/{totalAssets} assets
                        </span>
                      </div>
                    </div>

                    <div className="p-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* Characters */}
                      <div>
                        <h4 className="text-[10px] font-mono text-amber-400 uppercase tracking-wider mb-1.5">
                          Characters ({charsSprited.length}/{chars.length})
                        </h4>
                        <div className="space-y-1">
                          {chars.map((c) => {
                            const hasSprite = !!SPRITE_ATLAS_MANIFEST.characters[c.id];
                            const hasPortrait = !!SPRITE_ATLAS_MANIFEST.portraits[c.id];
                            return (
                              <div key={c.id} className="flex items-center justify-between text-[11px] font-mono py-0.5 px-1.5 rounded bg-[#131b26]">
                                <span className={hasSprite ? 'text-slate-200' : 'text-slate-500'}>
                                  {c.name}
                                </span>
                                <div className="flex items-center gap-1">
                                  {hasPortrait && (
                                    <span className="text-[8px] text-blue-400 bg-blue-500/10 px-1 rounded">
                                      PORTRAIT
                                    </span>
                                  )}
                                  <StatusBadge hasSprite={hasSprite} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Props */}
                      <div>
                        <h4 className="text-[10px] font-mono text-amber-400 uppercase tracking-wider mb-1.5">
                          Props ({propsSprited.length}/{settingProps.size})
                        </h4>
                        <div className="space-y-1">
                          {[...settingProps].sort().map((t) => {
                            const hasSprite = !!SPRITE_ATLAS_MANIFEST.props[t as any];
                            return (
                              <div key={t} className="flex items-center justify-between text-[11px] font-mono py-0.5 px-1.5 rounded bg-[#131b26]">
                                <span className={hasSprite ? 'text-slate-200' : 'text-slate-500'}>
                                  {t.replace(/_/g, ' ')}
                                </span>
                                <StatusBadge hasSprite={hasSprite} />
                              </div>
                            );
                          })}
                          {settingProps.size === 0 && (
                            <p className="text-[10px] text-slate-600 italic">No props defined</p>
                          )}
                        </div>
                      </div>

                      {/* Tiles */}
                      <div>
                        <h4 className="text-[10px] font-mono text-amber-400 uppercase tracking-wider mb-1.5">
                          Tiles ({tilesSprited.length}/{settingTiles.size})
                        </h4>
                        <div className="space-y-1">
                          {[...settingTiles].sort().map((t) => {
                            const hasSprite = !!SPRITE_ATLAS_MANIFEST.tiles[t as any];
                            return (
                              <div key={t} className="flex items-center justify-between text-[11px] font-mono py-0.5 px-1.5 rounded bg-[#131b26]">
                                <span className={hasSprite ? 'text-slate-200' : 'text-slate-500'}>
                                  {t.replace(/_/g, ' ')}
                                </span>
                                <StatusBadge hasSprite={hasSprite} />
                              </div>
                            );
                          })}
                          {settingTiles.size === 0 && (
                            <p className="text-[10px] text-slate-600 italic">No tiles defined</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ═══════════════════ CAST TAB ═══════════════════ */}
          {activeTab === 'cast' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-4 flex flex-col gap-3 bg-[#0a0e14] p-3 rounded-lg border border-[#2a374a]">
                <div>
                  <label className="text-[10px] font-mono text-amber-400 uppercase tracking-wider block mb-1.5">
                    Select Character:
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {atlasCharacters.map((cId) => (
                      <button
                        key={cId}
                        onClick={() => setSelectedChar(cId)}
                        className={`px-2 py-1.5 text-xs font-mono rounded capitalize text-left transition-all ${
                          selectedChar === cId
                            ? 'bg-amber-500 text-slate-950 font-bold shadow'
                            : 'bg-[#131b26] text-slate-300 hover:bg-[#1a2332]'
                        }`}
                      >
                        {cId}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-amber-400 uppercase tracking-wider block mb-1.5">
                    Facing Direction:
                  </label>
                  <div className="grid grid-cols-4 gap-1">
                    {(['down', 'left', 'right', 'up'] as Direction[]).map((d) => (
                      <button
                        key={d}
                        onClick={() => setSelectedDirection(d)}
                        className={`py-1 text-[10px] font-mono uppercase rounded text-center transition-all ${
                          selectedDirection === d
                            ? 'bg-blue-600 text-white font-bold'
                            : 'bg-[#131b26] text-slate-400 hover:bg-[#1a2332]'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#2a374a]">
                  <span className="text-xs font-mono text-slate-300">Walk Cycle:</span>
                  <button
                    onClick={() => setIsWalking(!isWalking)}
                    className={`px-2.5 py-1 text-[10px] font-mono rounded font-bold ${
                      isWalking ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {isWalking ? 'WALKING (ON)' : 'IDLE (OFF)'}
                  </button>
                </div>
              </div>

              <div className="md:col-span-8 flex flex-col items-center justify-center bg-[#070b10] border-2 border-[#2a374a] rounded-lg p-4 relative overflow-hidden">
                <div className="absolute top-2 left-3 flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
                  <Eye className="w-3.5 h-3.5 text-amber-400" />
                  <span>PREVIEW: {selectedChar.toUpperCase()} ({selectedDirection.toUpperCase()})</span>
                </div>

                <canvas
                  ref={previewCanvasRef}
                  width={280}
                  height={280}
                  className="w-64 h-64 border border-[#1e293b] rounded bg-[#0b1017] shadow-inner"
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>
            </div>
          )}

          {/* ═══════════════════ PROPS TAB ═══════════════════ */}
          {activeTab === 'props' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {atlasProps.map((pKey) => {
                const def = SPRITE_ATLAS_MANIFEST.props[pKey as any];
                if (!def) return null;
                return (
                  <div
                    key={pKey}
                    className="flex flex-col items-center bg-[#0b1017] border border-[#2a374a] rounded p-3 text-center"
                  >
                    <div className="mb-2">
                      <SpritePreview imageKey={def.imageKey} rect={def.rect} size={80} />
                    </div>
                    <span className="text-[11px] font-mono font-bold text-amber-300 capitalize">
                      {pKey.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[9px] font-mono text-slate-500">
                      {def.rect.w}×{def.rect.h} px
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* ═══════════════════ TILES TAB ═══════════════════ */}
          {activeTab === 'tiles' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {atlasTiles.map((tKey) => {
                const def = SPRITE_ATLAS_MANIFEST.tiles[tKey as any];
                if (!def) return null;
                return (
                  <div
                    key={tKey}
                    className="flex flex-col items-center bg-[#0b1017] border border-[#2a374a] rounded p-3 text-center"
                  >
                    <div className="mb-2">
                      <SpritePreview imageKey={def.imageKey} rect={def.rect} size={80} />
                    </div>
                    <span className="text-[11px] font-mono font-bold text-amber-300 capitalize">
                      {tKey.replace(/^(floor_|wall_)/, '').replace(/_/g, ' ')}
                    </span>
                    <span className="text-[9px] font-mono text-slate-500">
                      {def.rect.w}×{def.rect.h} px
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* ═══════════════════ PORTRAITS TAB ═══════════════════ */}
          {activeTab === 'portraits' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {atlasPortraits.map((pId) => {
                const def = SPRITE_ATLAS_MANIFEST.portraits[pId];
                const imgEntry = SPRITE_ATLAS_MANIFEST.images[def.imageKey];
                return (
                  <div
                    key={pId}
                    className="flex flex-col items-center bg-[#0b1017] border border-[#2a374a] rounded p-3 text-center"
                  >
                    <div className="w-28 h-28 bg-[#070a0f] border-2 border-amber-500/40 rounded-md overflow-hidden mb-2 shadow-lg">
                      <img
                        src={imgEntry?.url}
                        alt={pId}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-xs font-mono font-bold text-amber-300 capitalize">
                      {pId}
                    </span>
                    <span className="text-[9px] font-mono text-slate-400">
                      Confessional Bust
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* ═══════════════════ PROMPTS TAB ═══════════════════ */}
          {activeTab === 'prompts' && (
            <div className="flex flex-col gap-4 font-mono text-xs text-slate-300">
              <div className="bg-[#0b1017] p-3 rounded border border-amber-500/30">
                <h3 className="text-amber-400 font-bold text-sm mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Gemini / Nano Banana Image Generation Recipes
                </h3>
                <p className="text-[11px] text-slate-400 mb-3">
                  Copy these prompts into Nano Banana or Gemini to produce compatible pixel art assets. All output must use the specified chroma-key background color for automatic transparency processing.
                </p>

                <div className="space-y-4">
                  {/* Character Spritesheet */}
                  <div className="bg-[#131b26] p-3 rounded border border-[#2a374a]">
                    <span className="text-amber-300 font-bold block mb-1.5">
                      1. 4-Direction Walk-Cycle Character Spritesheet (8-column grid)
                    </span>
                    <p className="text-[10px] text-slate-500 mb-1.5">
                      Generates an 8-column horizontal grid. Cols 0-3: stride A (front/back/left/right), Cols 4-7: stride B.
                    </p>
                    <div className="relative">
                      <code className="text-[10px] text-emerald-400 block bg-[#080d14] p-2.5 rounded whitespace-pre-wrap leading-relaxed">
{`16-bit retro pixel art sprite sheet of [CHARACTER NAME] from [SHOW], [OUTFIT DESCRIPTION]. 
Organized as a precise 8-column horizontal grid for 4-direction RPG walk cycles:

Column layout:
- Col 0: Front-facing walk stride A (left foot forward)
- Col 1: Back-facing walk stride A
- Col 2: Left-facing walk stride A
- Col 3: Left-facing walk stride B
- Col 4: Front-facing walk stride B (right foot forward)
- Col 5: Back-facing walk stride B
- Col 6: Right-facing walk stride A
- Col 7: Right-facing walk stride B

Style: Top-down 3/4 RPG view, SNES-era crisp pixel art, clean black outlines, no anti-aliasing.
Background: Solid bright green chroma-key #00FF00 filling all empty space.
Important: Each character must be centered in their cell with consistent proportions across all 8 poses.`}
                      </code>
                      <CopyButton text={`16-bit retro pixel art sprite sheet of [CHARACTER NAME] from [SHOW], [OUTFIT DESCRIPTION].\nOrganized as a precise 8-column horizontal grid for 4-direction RPG walk cycles:\n\nColumn layout:\n- Col 0: Front-facing walk stride A (left foot forward)\n- Col 1: Back-facing walk stride A\n- Col 2: Left-facing walk stride A\n- Col 3: Left-facing walk stride B\n- Col 4: Front-facing walk stride B (right foot forward)\n- Col 5: Back-facing walk stride B\n- Col 6: Right-facing walk stride A\n- Col 7: Right-facing walk stride B\n\nStyle: Top-down 3/4 RPG view, SNES-era crisp pixel art, clean black outlines, no anti-aliasing.\nBackground: Solid bright green chroma-key #00FF00 filling all empty space.\nImportant: Each character must be centered in their cell with consistent proportions across all 8 poses.`} />
                    </div>
                  </div>

                  {/* Props */}
                  <div className="bg-[#131b26] p-3 rounded border border-[#2a374a]">
                    <span className="text-amber-300 font-bold block mb-1.5">
                      2. Strictly 2D Top-Down Props & Furniture Spritesheet
                    </span>
                    <p className="text-[10px] text-slate-500 mb-1.5">
                      Generates a 1024×1024 spritesheet with props arranged in a loose grid. Each prop must be strictly orthogonal top-down (no isometric tilting).
                    </p>
                    <div className="relative">
                      <code className="text-[10px] text-emerald-400 block bg-[#080d14] p-2.5 rounded whitespace-pre-wrap leading-relaxed">
{`16-bit retro pixel art sprite sheet of office/pub/apartment furniture and props for [SHOW NAME].

Items to include (arrange in a 2-column grid, each item well-spaced):
- [Prop 1, e.g. "wooden work desk with CRT monitor, keyboard, and papers"]
- [Prop 2, e.g. "leather office chair"]
- [Prop 3, e.g. "water cooler with blue jug"]
- [Prop 4, e.g. "filing cabinet, 3 drawers"]
- [Prop 5, e.g. "Xerox photocopier machine"]
- [Prop 6, e.g. "potted fern plant in ceramic pot"]

CRITICAL PERSPECTIVE: Strictly 2D orthogonal top-down view. NO isometric diamond perspective.
All furniture must appear as if viewed from directly above at a slight 3/4 angle.
Tables and desks show flat rectangular tops. Chairs show seat from above.

Style: SNES 16-bit pixel art, crisp outlines, no anti-aliasing blur.
Background: Solid magenta chroma-key #FF00FF filling all empty space around each item.
Resolution: 1024×1024 px total sheet.`}
                      </code>
                      <CopyButton text={`16-bit retro pixel art sprite sheet of office/pub/apartment furniture and props for [SHOW NAME].\n\nItems to include (arrange in a 2-column grid, each item well-spaced):\n- [Prop 1]\n- [Prop 2]\n- [Prop 3]\n- [Prop 4]\n- [Prop 5]\n- [Prop 6]\n\nCRITICAL PERSPECTIVE: Strictly 2D orthogonal top-down view. NO isometric diamond perspective.\nAll furniture must appear as if viewed from directly above at a slight 3/4 angle.\nTables and desks show flat rectangular tops. Chairs show seat from above.\n\nStyle: SNES 16-bit pixel art, crisp outlines, no anti-aliasing blur.\nBackground: Solid magenta chroma-key #FF00FF filling all empty space around each item.\nResolution: 1024×1024 px total sheet.`} />
                    </div>
                  </div>

                  {/* Tiles */}
                  <div className="bg-[#131b26] p-3 rounded border border-[#2a374a]">
                    <span className="text-amber-300 font-bold block mb-1.5">
                      3. Environment Floor & Wall Tileset
                    </span>
                    <p className="text-[10px] text-slate-500 mb-1.5">
                      Generates seamlessly tileable floor and wall textures arranged in a grid.
                    </p>
                    <div className="relative">
                      <code className="text-[10px] text-emerald-400 block bg-[#080d14] p-2.5 rounded whitespace-pre-wrap leading-relaxed">
{`16-bit retro pixel art tileset for a [LOCATION, e.g. "Scranton office building"] environment.

Arrange tiles in a grid (1024×1024 px). Include these tile types:
- Grey office carpet (seamless repeating pattern)
- Blue executive carpet (for conference rooms)
- Kitchen/breakroom checkered linoleum floor
- Hardwood floor planks (for manager's office)
- Drywall/painted wall top section
- Glass partition wall with reflective sheen lines
- Wooden door (closed)
- Window with horizontal blinds

Each tile should be approximately 128×128 px to 256×256 px.
Style: SNES 16-bit RPG tileset, perfectly tileable edges, crisp pixel art.
Background: Solid green chroma-key #00FF00 between tiles.`}
                      </code>
                      <CopyButton text={`16-bit retro pixel art tileset for a [LOCATION] environment.\n\nArrange tiles in a grid (1024×1024 px). Include these tile types:\n- Grey office carpet\n- Blue executive carpet\n- Kitchen checkered linoleum floor\n- Hardwood floor planks\n- Drywall wall top section\n- Glass partition wall with reflective sheen\n- Wooden door (closed)\n- Window with horizontal blinds\n\nEach tile: 128-256 px. SNES 16-bit RPG tileset, perfectly tileable edges.\nBackground: Solid green chroma-key #00FF00 between tiles.`} />
                    </div>
                  </div>

                  {/* Portraits */}
                  <div className="bg-[#131b26] p-3 rounded border border-[#2a374a]">
                    <span className="text-amber-300 font-bold block mb-1.5">
                      4. Mockumentary Talking-Head Confessional Portrait
                    </span>
                    <p className="text-[10px] text-slate-500 mb-1.5">
                      Generates a single high-res 1024×1024 bust portrait for the talking head interview overlay.
                    </p>
                    <div className="relative">
                      <code className="text-[10px] text-emerald-400 block bg-[#080d14] p-2.5 rounded whitespace-pre-wrap leading-relaxed">
{`16-bit retro pixel art close-up portrait of [CHARACTER NAME] from [SHOW].
Mockumentary-style interview talking head, looking directly at camera.
Expression: [EMOTION, e.g. "deadpan exasperation" / "smug grin" / "panicked wide eyes"]
Outfit: [DESCRIPTION, e.g. "yellow dress shirt, brown mustard tie"]

Framing: Head and shoulders bust shot, centered.
Background: Office with window blinds slightly open, warm lighting.
Style: SNES adventure game dialogue portrait, high detail pixel art, 1024×1024 px.
Clean outlines, expressive eyes, visible personality.`}
                      </code>
                      <CopyButton text={`16-bit retro pixel art close-up portrait of [CHARACTER NAME] from [SHOW].\nMockumentary-style interview talking head, looking directly at camera.\nExpression: [EMOTION]\nOutfit: [DESCRIPTION]\n\nFraming: Head and shoulders bust shot, centered.\nBackground: Office with window blinds slightly open, warm lighting.\nStyle: SNES adventure game dialogue portrait, high detail pixel art, 1024×1024 px.\nClean outlines, expressive eyes, visible personality.`} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#0c1017] border-t border-[#2a374a]">
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Modular Pipeline: {atlasCharacters.length} chars · {atlasProps.length} props · {atlasTiles.length} tiles · {atlasPortraits.length} portraits</span>
          </div>
          <button
            onClick={onClose}
            className="pixel-btn btn-primary text-[10px] px-3 py-1"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
