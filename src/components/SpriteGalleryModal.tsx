import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Palette, Eye, Sparkles, CheckCircle2, AlertCircle, Copy, Check } from 'lucide-react';
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
      className="absolute top-1.5 right-1.5 p-1 rounded bg-slate-700/60 hover:bg-slate-600 transition-colors"
      title="Copy prompt"
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
  const [activeTab, setActiveTab] = useState<'cast' | 'props' | 'tiles' | 'portraits' | 'coverage' | 'prompts'>('coverage');
  const [selectedChar, setSelectedChar] = useState<string>('michael');
  const [selectedDirection, setSelectedDirection] = useState<Direction>('down');
  const [isWalking, setIsWalking] = useState(true);
  const [artMode, setArtMode] = useState<'sprites' | 'procedural'>(spriteManager.mode);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const unsub = spriteManager.subscribe(() => {
      setArtMode(spriteManager.mode);
    });
    return unsub;
  }, []);

  // Animated character walk-cycle preview loop
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
        const { canvas: sc, rect } = spriteFrame;
        const scale = 1.35;
        const dw = Math.round(rect.w * scale);
        const dh = Math.round(rect.h * scale);
        const dx = Math.round(canvas.width / 2 - dw / 2);
        const dy = Math.round(canvas.height / 2 - dh / 2 + 10);
        ctx.drawImage(sc, rect.x, rect.y, rect.w, rect.h, dx, dy, dw, dh);
      } else {
        ctx.fillStyle = '#94a3b8';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('No sprite loaded', canvas.width / 2, canvas.height / 2);
      }

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [isOpen, activeTab, selectedChar, selectedDirection, isWalking]);

  if (!isOpen) return null;

  const atlasCharacters = Object.keys(SPRITE_ATLAS_MANIFEST.characters);
  const atlasProps = Object.keys(SPRITE_ATLAS_MANIFEST.props);
  const atlasTiles = Object.keys(SPRITE_ATLAS_MANIFEST.tiles);
  const atlasPortraits = Object.keys(SPRITE_ATLAS_MANIFEST.portraits);

  // Coverage data
  const allPropTypes = collectAllPropTypes();
  const allTileTypes = collectAllTileTypes();

  const TABS = [
    { id: 'coverage' as const, label: '📊 Asset Coverage', count: null },
    { id: 'cast' as const, label: '🏃 Cast', count: atlasCharacters.length },
    { id: 'props' as const, label: '🪑 Props', count: atlasProps.length },
    { id: 'tiles' as const, label: '🧱 Tiles', count: atlasTiles.length },
    { id: 'portraits' as const, label: '🎥 Portraits', count: atlasPortraits.length },
    { id: 'prompts' as const, label: '✨ Prompts', count: null },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[92vh] bg-[#131b26] border-4 border-[#2a374a] shadow-2xl rounded-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#0c1017] border-b-2 border-[#2a374a]">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="pixel-font text-xs sm:text-sm font-bold text-amber-400">
                SPRITE STUDIO & ART PIPELINE
              </h2>
              <p className="text-[10px] text-slate-400 font-mono">
                Asset Management · Walk Cycles · Prompt Recipes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center bg-[#131b26] p-1 border border-[#2a374a] rounded">
              <span className="text-[10px] font-mono text-slate-400 mr-2 ml-1">MODE:</span>
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
        <div className="flex-1 p-4 overflow-y-auto min-h-[380px]">

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
                const charsNoSprite = chars.filter((c) => !SPRITE_ATLAS_MANIFEST.characters[c.id]);

                const propsSprited = [...settingProps].filter((t) => !!SPRITE_ATLAS_MANIFEST.props[t as any]);
                const propsNoSprite = [...settingProps].filter((t) => !SPRITE_ATLAS_MANIFEST.props[t as any]);

                const tilesSprited = [...settingTiles].filter((t) => !!SPRITE_ATLAS_MANIFEST.tiles[t as any]);
                const tilesNoSprite = [...settingTiles].filter((t) => !SPRITE_ATLAS_MANIFEST.tiles[t as any]);

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
                  Nano Banana / Gemini Image Generation Recipes
                </h3>
                <p className="text-[11px] text-slate-400 mb-3">
                  Copy these prompts into Gemini Image Generation or Nano Banana Pro to produce compatible pixel art assets. All output must use the specified chroma-key background color for automatic transparency processing.
                </p>

                <div className="space-y-4">
                  {/* Character Spritesheet */}
                  <div className="bg-[#131b26] p-3 rounded border border-[#2a374a]">
                    <span className="text-amber-300 font-bold block mb-1.5">
                      1. 4-Direction Walk-Cycle Character Spritesheet (8-column grid)
                    </span>
                    <p className="text-[10px] text-slate-500 mb-1.5">
                      Generates a 1024×256 grid: 8 columns × 1 row. Cols 0-3: stride A (front/back/left/right), Cols 4-7: stride B.
                    </p>
                    <div className="relative">
                      <code className="text-[10px] text-emerald-400 block bg-[#080d14] p-2.5 rounded whitespace-pre-wrap leading-relaxed">
{`16-bit retro pixel art sprite sheet of [CHARACTER NAME] from [SHOW], [OUTFIT DESCRIPTION]. 
Organized as a precise 8-column × 1-row grid (1024×256 px). Each cell is 128×256 px.

Column layout:
- Col 0: Front-facing walk stride A (left foot forward)
- Col 1: Back-facing walk stride A
- Col 2: Left-facing walk stride A
- Col 3: Right-facing walk stride A
- Col 4: Front-facing walk stride B (right foot forward)
- Col 5: Back-facing walk stride B
- Col 6: Left-facing walk stride B
- Col 7: Right-facing walk stride B

Style: Top-down 3/4 RPG view, SNES-era crisp pixel art, clean black outlines, no anti-aliasing.
Background: Solid bright green chroma-key #00FF00 filling all empty space.
Important: Each character must be centered in their cell with consistent proportions across all 8 poses.`}
                      </code>
                      <CopyButton text={`16-bit retro pixel art sprite sheet of [CHARACTER NAME] from [SHOW], [OUTFIT DESCRIPTION].\nOrganized as a precise 8-column × 1-row grid (1024×256 px). Each cell is 128×256 px.\n\nColumn layout:\n- Col 0: Front-facing walk stride A (left foot forward)\n- Col 1: Back-facing walk stride A\n- Col 2: Left-facing walk stride A\n- Col 3: Right-facing walk stride A\n- Col 4: Front-facing walk stride B (right foot forward)\n- Col 5: Back-facing walk stride B\n- Col 6: Left-facing walk stride B\n- Col 7: Right-facing walk stride B\n\nStyle: Top-down 3/4 RPG view, SNES-era crisp pixel art, clean black outlines, no anti-aliasing.\nBackground: Solid bright green chroma-key #00FF00 filling all empty space.\nImportant: Each character must be centered in their cell with consistent proportions across all 8 poses.`} />
                    </div>
                  </div>

                  {/* Props */}
                  <div className="bg-[#131b26] p-3 rounded border border-[#2a374a]">
                    <span className="text-amber-300 font-bold block mb-1.5">
                      2. Strictly 2D Top-Down Props & Furniture Spritesheet
                    </span>
                    <p className="text-[10px] text-slate-500 mb-1.5">
                      Generates a 1024×1024 spritesheet with 6-10 props arranged in a loose grid. Each prop must be strictly orthogonal top-down (no isometric tilting).
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
            <span>Hybrid Engine: {atlasCharacters.length} chars · {atlasProps.length} props · {atlasTiles.length} tiles · {atlasPortraits.length} portraits</span>
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
