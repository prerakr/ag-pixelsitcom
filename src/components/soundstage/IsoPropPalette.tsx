import React, { useMemo, useState } from 'react';
import { RotateCw } from 'lucide-react';
import { PropType } from '../../types/environment';
import { Direction } from '../../types/script';
import { ISO_PROP_CATALOG, ISO_THEME_ATLAS, ISO_THEME_IMAGES } from '../../data/sprites/generated/isoAtlas';
import { AtlasCanvas, useImage } from '../IsoAtlasCanvas';

const THEME_LABELS: Record<string, string> = {
  office: 'Office',
  coffee: 'Coffeehouse',
  pub: 'Pub',
  hostel: 'Hostel',
};
const FACING_ARROWS: Record<string, string> = { down: '↙', left: '↖', up: '↗', right: '↘' };

/**
 * The prop palette for isometric sets: the iso catalogue by theme (the set's own first), each
 * prop shown in the facing it will be stamped with. Q turns that facing.
 */
export const IsoPropPalette: React.FC<{
  setTheme: string;
  selectedPropType: PropType;
  onSelectPropType: (type: PropType) => void;
  stampFacing: Direction;
  onTurnStamp: () => void;
}> = ({ setTheme, selectedPropType, onSelectPropType, stampFacing, onTurnStamp }) => {
  const themes = useMemo(
    () => [setTheme, ...Object.keys(ISO_THEME_ATLAS).filter((t) => t !== setTheme)].filter((t) => ISO_THEME_ATLAS[t]),
    [setTheme]
  );
  const [theme, setTheme_] = useState(themes[0]);
  const [query, setQuery] = useState('');
  const atlas = ISO_THEME_ATLAS[theme] ?? ISO_THEME_ATLAS[themes[0]];
  const image = useImage(ISO_THEME_IMAGES[atlas.imageKey]);
  const types = useMemo(
    () =>
      [...new Set(Object.keys(atlas.frames).map((k) => k.split(':')[0]))]
        .filter((t) => t.includes(query.trim().toLowerCase()))
        .sort(),
    [atlas, query]
  );

  return (
    <div className="flex flex-col h-full gap-1.5">
      <div className="flex items-center gap-1 shrink-0">
        {themes.map((t) => (
          <button
            key={t}
            onClick={() => setTheme_(t)}
            className={`px-2 py-0.5 text-[10px] uppercase font-mono rounded border ${
              theme === t ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold' : 'bg-[#182333] text-slate-400 border-[#2a374a] hover:text-white'
            }`}
          >
            {THEME_LABELS[t] ?? t}
            {t === setTheme ? ' ★' : ''}
          </button>
        ))}
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="search"
          className="ml-1 w-28 bg-[#182333] border border-[#2a374a] rounded px-2 py-0.5 text-[10px] font-mono text-white outline-none focus:border-amber-500"
        />
        <button
          onClick={onTurnStamp}
          title="Turn the facing new props are stamped with (Q)"
          className="ml-auto flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono rounded border bg-[#182333] border-[#2a374a] text-slate-300 hover:text-white"
        >
          <RotateCw className="w-3 h-3" />
          facing {stampFacing} {FACING_ARROWS[stampFacing]} · Q
        </button>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 items-center">
        {types.map((type) => {
          const frame = atlas.frames[`${type}:${stampFacing}`] ?? atlas.frames[`${type}:down`];
          const cat = ISO_PROP_CATALOG[type];
          const selected = selectedPropType === type;
          return (
            <button
              key={type}
              onClick={() => onSelectPropType(type as PropType)}
              title={cat ? `${type}: ${cat.width.toFixed(2)} x ${cat.depth.toFixed(2)} m, ${cat.kind}` : type}
              className={`flex flex-col items-center justify-center p-1 w-24 h-[5.25rem] rounded border shrink-0 transition-all ${
                selected ? 'bg-purple-600/30 border-purple-400 ring-2 ring-purple-500/50' : 'bg-[#182333] hover:bg-[#202e42] border-[#2a374a]'
              }`}
            >
              {frame && <AtlasCanvas image={image} rect={frame} fit={52} />}
              <span className="text-[9px] font-mono truncate w-full text-center leading-tight text-slate-300">{type.replace(/_/g, ' ')}</span>
              {cat && (
                <span className="text-[8px] font-mono text-slate-500">
                  {cat.width.toFixed(1)}×{cat.depth.toFixed(1)} m
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
