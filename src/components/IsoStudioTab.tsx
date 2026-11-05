import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AtlasCanvas, useImage } from './IsoAtlasCanvas';
import { spriteManager } from '../engine/SpriteManager';
import { ALL_CHARACTERS } from '../data/characters';
import { ALL_SETTINGS } from '../data/settings';
import { ISO_PROP_CATALOG, ISO_THEME_ATLAS, ISO_THEME_IMAGES } from '../data/sprites/generated/isoAtlas';
import { ISO_CHARACTER_COLUMNS, ISO_CHARACTER_ROWS } from '../data/sprites/generated/isoCharacterAtlas';
import { Direction } from '../types/script';

/**
 * Sprite Studio's isometric section: every character's iso sheet with a live walk preview in the
 * four diagonal facings, every iso prop in all four facings (grouped by set theme), and each
 * theme's wall faces and floor textures.
 */

type IsoSection = 'cast' | 'props' | 'surfaces';

const THEMES = ['office', 'coffee', 'pub', 'hostel'] as const;
const THEME_LABELS: Record<string, string> = {
  office: 'Dunder Mifflin',
  coffee: 'Central Perk',
  pub: "MacLaren's",
  hostel: 'Hacker Hostel',
};
/** World facings in screen order: front views (lower right, lower left), then back views. */
const FACINGS: Direction[] = ['right', 'down', 'up', 'left'];
const FACING_LABELS: Record<string, string> = {
  right: 'front ↘',
  down: 'front ↙',
  up: 'back ↗',
  left: 'back ↖',
};
const SHOW_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'the_office', label: 'Office' },
  { id: 'friends', label: 'Friends' },
  { id: 'silicon_valley', label: 'Silicon' },
  { id: 'himym', label: 'HIMYM' },
];

export const IsoStudioTab: React.FC = () => {
  const [section, setSection] = useState<IsoSection>('cast');
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-1">
        {(
          [
            ['cast', '🏃 Iso cast'],
            ['props', '🪑 Iso props'],
            ['surfaces', '🧱 Walls & floors'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setSection(id)}
            className={`px-2.5 py-1 rounded font-mono text-[11px] font-semibold transition-all ${
              section === id ? 'bg-amber-500 text-slate-950 shadow' : 'bg-[#0b1017] text-slate-400 hover:text-white border border-[#2a374a]'
            }`}
          >
            {label}
          </button>
        ))}
        <span className="ml-2 text-[10px] font-mono text-slate-500">
          Built offline by scripts/sprites/iso_characters.py and iso_assets.py; generated files are read-only here.
        </span>
      </div>
      {section === 'cast' && <IsoCast />}
      {section === 'props' && <IsoProps />}
      {section === 'surfaces' && <IsoSurfaces />}
    </div>
  );
};

// ─── Cast ───────────────────────────────────────────────────────────────────

const IsoCast: React.FC = () => {
  const ids = useMemo(() => Object.keys(ISO_CHARACTER_ROWS).sort(), []);
  const [selected, setSelected] = useState('michael');
  const [show, setShow] = useState('all');
  const [walking, setWalking] = useState(true);
  const [seated, setSeated] = useState(false);
  const sheet = spriteManager.getLoadedImages().get('characters_iso') ?? null;
  const row = ISO_CHARACTER_ROWS[selected];

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
      <div className="md:col-span-4 flex flex-col gap-2 bg-[#0a0e14] p-3 rounded-lg border border-[#2a374a]">
        <div className="flex flex-wrap gap-1">
          {SHOW_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setShow(f.id)}
              className={`px-2 py-0.5 text-[10px] font-mono rounded font-semibold ${
                show === f.id ? 'bg-amber-500 text-slate-950' : 'bg-[#131b26] text-slate-400 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-[60vh] overflow-y-auto pr-1">
          {ids
            .filter((id) => show === 'all' || ALL_CHARACTERS[id]?.showId === show)
            .map((id) => (
              <button
                key={id}
                onClick={() => setSelected(id)}
                className={`px-2 py-1 text-[11px] font-mono rounded text-left truncate ${
                  selected === id ? 'bg-amber-500/25 text-amber-200 border border-amber-500/60' : 'bg-[#131b26] text-slate-300 hover:text-white'
                }`}
              >
                {ALL_CHARACTERS[id]?.name ?? id}
              </button>
            ))}
        </div>
      </div>

      <div className="md:col-span-8 flex flex-col gap-3">
        <div className="flex items-center gap-3 bg-[#0a0e14] p-3 rounded-lg border border-[#2a374a]">
          <span className="text-xs font-mono font-bold text-amber-300">{ALL_CHARACTERS[selected]?.name ?? selected}</span>
          <label className="flex items-center gap-1 text-[11px] font-mono text-slate-300">
            <input type="checkbox" checked={walking && !seated} disabled={seated} onChange={(e) => setWalking(e.target.checked)} />
            walking
          </label>
          <label className="flex items-center gap-1 text-[11px] font-mono text-slate-300">
            <input type="checkbox" checked={seated} onChange={(e) => setSeated(e.target.checked)} />
            seated
          </label>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {FACINGS.map((facing) => (
            <div key={facing} className="flex flex-col items-center bg-[#0b1017] border border-[#2a374a] rounded p-2">
              <IsoCharacterPreview id={selected} facing={facing} walking={walking && !seated} seated={seated} />
              <span className="text-[10px] font-mono text-slate-400 mt-1">
                {facing} · {FACING_LABELS[facing]}
              </span>
            </div>
          ))}
        </div>

        <div className="bg-[#0b1017] border border-[#2a374a] rounded p-2">
          <div className="text-[10px] font-mono text-slate-400 mb-1">Atlas row {row} (48×64 cells)</div>
          <div className="flex flex-wrap gap-1">
            {ISO_CHARACTER_COLUMNS.map((col, i) => (
              <div key={i} className="flex flex-col items-center">
                <AtlasCanvas image={sheet} rect={{ x: i * 48, y: row * 64, w: 48, h: 64 }} scale={2} className="bg-[#5a4330] rounded-sm" />
                <span className="text-[8px] font-mono text-slate-500">{col.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
          {!sheet && <div className="text-[10px] font-mono text-red-400 mt-1">characters_iso image not loaded yet</div>}
        </div>
      </div>
    </div>
  );
};

/** One facing of an iso character, animated through its walk cycle on a floor-coloured tile. */
const IsoCharacterPreview: React.FC<{ id: string; facing: Direction; walking: boolean; seated: boolean }> = ({ id, facing, walking, seated }) => {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const zoom = 3;
    let frame = 0;
    let last = 0;
    let raf = 0;
    const draw = (t: number) => {
      if (t - last > 160) {
        last = t;
        frame = (frame + 1) % 4;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = false;
      const cx = canvas.width / 2;
      const ground = canvas.height - 18;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.ellipse(cx, ground, 13 * zoom, 4.5 * zoom, 0, 0, Math.PI * 2);
      ctx.fill();
      const f = spriteManager.getCharacterFrame(`${id}@iso`, facing, walking ? frame : 0, walking, seated);
      if (f) {
        const { canvas: src, rect } = f;
        const w = rect.w * zoom;
        const h = rect.h * zoom;
        const y = Math.round(ground - (rect.anchorY ?? 0.95) * h);
        ctx.save();
        ctx.translate(cx, 0);
        if (rect.flipX) ctx.scale(-1, 1);
        ctx.drawImage(src, rect.x, rect.y, rect.w, rect.h, Math.round(-(rect.anchorX ?? 0.5) * w), y, w, h);
        ctx.restore();
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [id, facing, walking, seated]);
  return <canvas ref={ref} width={160} height={210} className="bg-[#5a4330] rounded" style={{ imageRendering: 'pixelated' }} />;
};

// ─── Props ──────────────────────────────────────────────────────────────────

/** Which iso sets place each prop type, for the "used in" line. */
function setsUsing(): Map<string, string[]> {
  const out = new Map<string, string[]>();
  for (const s of Object.values(ALL_SETTINGS)) {
    if (s.projection !== 'iso') continue;
    for (const p of s.props) {
      const list = out.get(p.type) ?? [];
      if (!list.includes(s.name)) list.push(s.name);
      out.set(p.type, list);
    }
  }
  return out;
}

const IsoProps: React.FC = () => {
  const [theme, setTheme] = useState<(typeof THEMES)[number]>('office');
  const [query, setQuery] = useState('');
  const atlas = ISO_THEME_ATLAS[theme];
  const image = useImage(ISO_THEME_IMAGES[atlas.imageKey]);
  const usage = useMemo(setsUsing, []);
  const types = useMemo(
    () => [...new Set(Object.keys(atlas.frames).map((k) => k.split(':')[0]))].sort(),
    [atlas]
  );
  const shown = types.filter((t) => t.includes(query.trim().toLowerCase()));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {THEMES.map((t) => (
          <button
            key={t}
            onClick={() => setTheme(t)}
            className={`px-2 py-1 text-[11px] font-mono rounded font-semibold ${
              theme === t ? 'bg-amber-500 text-slate-950' : 'bg-[#131b26] text-slate-400 hover:text-white'
            }`}
          >
            {THEME_LABELS[t]}
          </button>
        ))}
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="filter props"
          className="bg-[#0b1017] border border-[#2a374a] rounded px-2 py-1 text-[11px] font-mono text-slate-200 outline-none"
        />
        <span className="text-[10px] font-mono text-slate-500">
          {shown.length} of {types.length} props · modelled at real size, 32 px per metre
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {shown.map((type) => {
          const cat = ISO_PROP_CATALOG[type];
          const glows = FACINGS.some((f) => atlas.frames[`${type}:${f}`]?.glow);
          const used = usage.get(type);
          return (
            <div key={type} className="bg-[#0b1017] border border-[#2a374a] rounded p-2.5 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold text-amber-300">{type}</span>
                {cat && <span className="text-[9px] font-mono px-1.5 rounded bg-[#131b26] text-slate-400">{cat.kind}</span>}
                {glows && <span className="text-[9px] font-mono px-1.5 rounded bg-sky-900/60 text-sky-300">glows at night</span>}
              </div>
              <div className="flex items-end gap-2 overflow-x-auto">
                {FACINGS.map((f) => {
                  const fr = atlas.frames[`${type}:${f}`];
                  if (!fr) return null;
                  const scale = fr.w > 90 || fr.h > 90 ? 1 : 2;
                  return (
                    <div key={f} className="flex flex-col items-center shrink-0">
                      <AtlasCanvas image={image} rect={fr} scale={scale} />
                      <span className="text-[8px] font-mono text-slate-500">{f}</span>
                    </div>
                  );
                })}
              </div>
              {cat && (
                <div className="text-[9px] font-mono text-slate-500">
                  {cat.width.toFixed(2)} × {cat.depth.toFixed(2)} m footprint · {Math.round(cat.height)} px tall
                  {used ? ` · in ${used.join(', ')}` : ' · not placed in any set'}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Walls & floors ─────────────────────────────────────────────────────────

const IsoSurfaces: React.FC = () => {
  const [theme, setTheme] = useState<(typeof THEMES)[number]>('office');
  const atlas = ISO_THEME_ATLAS[theme];
  const image = useImage(ISO_THEME_IMAGES[atlas.imageKey]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {THEMES.map((t) => (
          <button
            key={t}
            onClick={() => setTheme(t)}
            className={`px-2 py-1 text-[11px] font-mono rounded font-semibold ${
              theme === t ? 'bg-amber-500 text-slate-950' : 'bg-[#131b26] text-slate-400 hover:text-white'
            }`}
          >
            {THEME_LABELS[t]}
          </button>
        ))}
        <span className="text-[10px] font-mono text-slate-500">
          Wall faces are {atlas.wallHeight} px tall, 32 px per tile, lit for the north (n) and west (w) walls before projection.
        </span>
      </div>

      <h3 className="text-[11px] font-mono font-bold text-amber-400 uppercase">Wall faces</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {Object.entries(atlas.walls).map(([tile, face]) => (
          <div key={tile} className="bg-[#0b1017] border border-[#2a374a] rounded p-2.5">
            <div className="text-[11px] font-mono font-bold text-amber-300 mb-1">
              {tile} <span className="text-slate-500 font-normal">· {face.variants} variant{face.variants === 1 ? '' : 's'}</span>
            </div>
            <div className="flex flex-col gap-1 overflow-x-auto">
              {(['n', 'w'] as const).map((side) => (
                <div key={side} className="flex items-center gap-2">
                  <span className="text-[9px] font-mono text-slate-500 w-3">{side}</span>
                  <AtlasCanvas
                    image={image}
                    rect={{ x: face[side].x, y: face[side].y, w: 32 * face.variants, h: atlas.wallHeights[tile] ?? atlas.wallHeight }}
                    scale={1}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <h3 className="text-[11px] font-mono font-bold text-amber-400 uppercase">Floors (4×4 tile seamless textures)</h3>
      <div className="flex flex-wrap gap-3">
        {Object.entries(atlas.floors).map(([tile, pos]) => (
          <div key={tile} className="flex flex-col items-center bg-[#0b1017] border border-[#2a374a] rounded p-2">
            <AtlasCanvas image={image} rect={{ x: pos.x, y: pos.y, w: 128, h: 128 }} scale={1} />
            <span className="text-[10px] font-mono text-slate-400 mt-1">{tile}</span>
          </div>
        ))}
      </div>

      {Object.keys(atlas.decals).length > 0 && (
        <>
          <h3 className="text-[11px] font-mono font-bold text-amber-400 uppercase">Rugs & floor decals</h3>
          <div className="flex flex-wrap gap-3">
            {Object.entries(atlas.decals).map(([key, rect]) => (
              <div key={key} className="flex flex-col items-center bg-[#0b1017] border border-[#2a374a] rounded p-2">
                <AtlasCanvas image={image} rect={rect} scale={1} />
                <span className="text-[10px] font-mono text-slate-400 mt-1">{key}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
