import React from 'react';
import { Volume2, VolumeX, Music, Sparkles, Users, HelpCircle, Film, Tv } from 'lucide-react';
import { ALL_SETTINGS } from '../data/settings';
import { PRESET_EPISODES } from '../data/episodes';
import { soundEngine } from '../engine/SoundEngine';

interface HeaderProps {
  currentSettingId: string;
  onSelectSetting: (id: string) => void;
  currentEpisodeTitle: string;
  onSelectEpisode: (index: number) => void;
  onOpenScriptStudio: () => void;
  onToggleCastDrawer: () => void;
  onOpenHelp: () => void;
  isCastDrawerOpen: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentSettingId,
  onSelectSetting,
  currentEpisodeTitle,
  onSelectEpisode,
  onOpenScriptStudio,
  onToggleCastDrawer,
  onOpenHelp,
  isCastDrawerOpen,
  isMuted,
  onToggleMute,
}) => {
  return (
    <header className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-[#131b26] border-b-2 border-[#2a374a] text-white select-none z-20">
      {/* Brand Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 bg-amber-500 text-slate-950 font-black rounded border-2 border-amber-300 shadow-[2px_2px_0px_rgba(0,0,0,0.6)]">
          <Tv className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="pixel-font text-xs md:text-sm font-bold tracking-wider text-amber-400">
              PIXEL SITCOM
            </h1>
            <span className="text-[10px] px-1.5 py-0.5 bg-blue-950 text-blue-300 border border-blue-700 rounded font-mono">
              v1.0
            </span>
          </div>
          <p className="text-[11px] text-slate-400 hidden sm:block font-mono">
            16-Bit Top-Down Visualizer & AI Episode Engine
          </p>
        </div>
      </div>

      {/* Center Setting & Episode Selectors */}
      <div className="flex items-center gap-2 my-1 sm:my-0">
        {/* Show / Setting Selector */}
        <div className="flex items-center gap-1.5 bg-[#0b0f17] px-2.5 py-1.5 border border-[#2a374a] rounded">
          <span className="text-[11px] text-amber-400 font-mono hidden md:inline">SHOW:</span>
          <select
            value={currentSettingId}
            onChange={(e) => onSelectSetting(e.target.value)}
            aria-label="Select Sitcom Setting"
            className="bg-transparent text-xs text-slate-200 outline-none cursor-pointer font-medium"
          >
            {Object.values(ALL_SETTINGS).map((s) => (
              <option key={s.id} value={s.id} className="bg-[#131b26] text-white">
                {s.showTitle} ({s.name})
              </option>
            ))}
          </select>
        </div>

        {/* Preset Episodes Selector */}
        <div className="flex items-center gap-1.5 bg-[#0b0f17] px-2.5 py-1.5 border border-[#2a374a] rounded">
          <Film className="w-3.5 h-3.5 text-blue-400" />
          <select
            value={currentEpisodeTitle}
            onChange={(e) => onSelectEpisode(Number(e.target.value))}
            aria-label="Select Episode"
            className="bg-transparent text-xs text-slate-200 outline-none cursor-pointer font-medium max-w-[140px] sm:max-w-[200px] truncate"
          >
            {PRESET_EPISODES.map((ep, idx) => (
              <option key={idx} value={idx} className="bg-[#131b26] text-white">
                {ep.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        {/* Cast Roster Button */}
        <button
          onClick={onToggleCastDrawer}
          className={`pixel-btn text-[9px] px-2.5 py-1.5 ${isCastDrawerOpen ? 'bg-amber-600 border-amber-400 text-white' : ''}`}
          title="Inspect Characters"
        >
          <Users className="w-3.5 h-3.5" />
          <span className="hidden md:inline">CAST</span>
        </button>

        {/* AI Script Studio Button */}
        <button
          onClick={onOpenScriptStudio}
          className="pixel-btn btn-primary text-[9px] px-3 py-1.5 glow-active flex items-center gap-1.5"
          title="Open AI Script Studio & Generator"
        >
          <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />
          <span>AI SCRIPT STUDIO</span>
        </button>

        {/* 8-Bit Theme Jingle */}
        <button
          onClick={() => soundEngine.playThemeJingle()}
          className="pixel-btn text-[9px] px-2 py-1.5 hidden lg:inline-flex"
          title="Play 8-Bit Sitcom Theme Jingle"
        >
          <Music className="w-3.5 h-3.5 text-amber-400" />
          <span>THEME</span>
        </button>

        {/* Audio Mute */}
        <button
          onClick={onToggleMute}
          className="p-1.5 bg-[#0b0f17] hover:bg-[#1b2636] border border-[#2a374a] rounded text-slate-300 hover:text-white"
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-green-400" />}
        </button>

        {/* Help */}
        <button
          onClick={onOpenHelp}
          className="p-1.5 bg-[#0b0f17] hover:bg-[#1b2636] border border-[#2a374a] rounded text-slate-300 hover:text-white"
          title="Visualizer Guide & Schema"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
