import React from 'react';
import {
  MousePointer,
  Paintbrush,
  Square,
  PaintBucket,
  Eraser,
  Armchair,
  MapPin,
  UserCheck,
  Maximize,
  Play,
} from 'lucide-react';

export type SoundstageTool =
  | 'select'
  | 'tile_brush'
  | 'tile_rect'
  | 'tile_bucket'
  | 'tile_eraser'
  | 'prop_stamp'
  | 'waypoint'
  | 'spawn'
  | 'zone'
  | 'director';

interface SoundstageToolbarProps {
  activeTool: SoundstageTool;
  onSelectTool: (tool: SoundstageTool) => void;
}

const TOOLS_CONFIG: Array<{
  id: SoundstageTool;
  label: string;
  hotkey: string;
  icon: React.FC<{ className?: string }>;
  colorClass: string;
  group?: string;
}> = [
  {
    id: 'select',
    label: 'Select & Move',
    hotkey: 'V',
    icon: MousePointer,
    colorClass: 'text-cyan-400 group-hover:text-cyan-300',
  },
  {
    id: 'director',
    label: 'Director Sandbox',
    hotkey: 'D',
    icon: Play,
    colorClass: 'text-emerald-400 group-hover:text-emerald-300',
  },
  {
    id: 'tile_brush',
    label: 'Tile Brush',
    hotkey: 'B',
    icon: Paintbrush,
    colorClass: 'text-amber-400 group-hover:text-amber-300',
  },
  {
    id: 'tile_rect',
    label: 'Tile Rectangle Fill',
    hotkey: 'R',
    icon: Square,
    colorClass: 'text-amber-400 group-hover:text-amber-300',
  },
  {
    id: 'tile_bucket',
    label: 'Tile Bucket Fill',
    hotkey: 'G',
    icon: PaintBucket,
    colorClass: 'text-amber-400 group-hover:text-amber-300',
  },
  {
    id: 'tile_eraser',
    label: 'Tile Eraser',
    hotkey: 'E',
    icon: Eraser,
    colorClass: 'text-rose-400 group-hover:text-rose-300',
  },
  {
    id: 'prop_stamp',
    label: 'Place Prop',
    hotkey: 'P',
    icon: Armchair,
    colorClass: 'text-purple-400 group-hover:text-purple-300',
  },
  {
    id: 'waypoint',
    label: 'Place Waypoint',
    hotkey: 'W',
    icon: MapPin,
    colorClass: 'text-pink-400 group-hover:text-pink-300',
  },
  {
    id: 'spawn',
    label: 'Place Spawn Point',
    hotkey: 'S',
    icon: UserCheck,
    colorClass: 'text-yellow-400 group-hover:text-yellow-300',
  },
  {
    id: 'zone',
    label: 'Draw Room Zone',
    hotkey: 'Z',
    icon: Maximize,
    colorClass: 'text-blue-400 group-hover:text-blue-300',
  },
];

export const SoundstageToolbar: React.FC<SoundstageToolbarProps> = ({
  activeTool,
  onSelectTool,
}) => {
  return (
    <div className="flex flex-col gap-1 p-1.5 bg-[#131b26] border-r-2 border-[#2a374a] shrink-0 select-none z-10">
      <div className="text-[9px] font-mono text-slate-500 uppercase px-1 text-center font-bold tracking-wider mb-0.5">
        Tools
      </div>

      {TOOLS_CONFIG.map((t, idx) => {
        const Icon = t.icon;
        const isActive = activeTool === t.id;

        return (
          <button
            key={t.id}
            onClick={() => onSelectTool(t.id)}
            className={`group relative flex items-center justify-center w-10 h-10 rounded-lg transition-all border ${
              isActive
                ? 'bg-amber-600/30 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.3)] text-white'
                : 'bg-[#182333] hover:bg-[#223147] border-[#2a374a] text-slate-400 hover:text-white'
            }`}
            title={`${t.label} [${t.hotkey}]`}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'text-amber-300' : t.colorClass}`} />
            
            {/* Hotkey badge */}
            <span
              className={`absolute bottom-0.5 right-1 text-[8px] font-mono font-bold leading-none ${
                isActive ? 'text-amber-200' : 'text-slate-500 group-hover:text-slate-300'
              }`}
            >
              {t.hotkey}
            </span>

            {/* Separator after Director mode */}
            {idx === 1 && (
              <div className="absolute -bottom-1.5 left-1 right-1 h-[1px] bg-[#2a374a] pointer-events-none" />
            )}
          </button>
        );
      })}
    </div>
  );
};
