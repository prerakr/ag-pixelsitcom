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
    <header className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5 bg-[#131b26] border-b-2 border-[#2a374a] text-white select-none z-20 gap-2 shrink-0">
      {/* Top Row: Brand & Quick Actions */}
      <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 sm:w-9 sm:h-9 bg-amber-500 text-slate-950 font-black rounded border-2 border-amber-300 shadow-[2px_2px_0px_rgba(0,0,0,0.6)] shrink-0">
            <Tv className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="pixel-font text-[11px] sm:text-xs md:text-sm font-bold tracking-wider text-amber-400">
                PIXEL SITCOM
              </h1>
              <span className="text-[9px] px-1 py-0.2 bg-blue-950 text-blue-300 border border-blue-700 rounded font-mono">
                v1.0
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden md:block font-mono">
              16-Bit Top-Down Visualizer & AI Episode Engine
            </p>
          </div>
        </div>

        {/* Mobile Quick Buttons */}
        <div className="flex sm:hidden items-center gap-1.5">
          <button
            onClick={onOpenScriptStudio}
            className="pixel-btn btn-primary text-[8px] px-2 py-1.5 flex items-center gap-1 glow-active"
          >
            <Sparkles className="w-3 h-3 animate-spin" style={{ animationDuration: '4s' }} />
            <span>AI PROMPT</span>
          </button>
          <button
            onClick={onToggleCastDrawer}
            className={`p-1.5 bg-[#0b0f17] border border-[#2a374a] rounded ${isCastDrawerOpen ? 'bg-amber-600 border-amber-400 text-white' : 'text-slate-300'}`}
          >
            <Users className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onToggleMute}
            className="p-1.5 bg-[#0b0f17] border border-[#2a374a] rounded text-slate-300"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-green-400" />}
          </button>
        </div>
      </div>

      {/* Selectors Row */}
      <div className="flex items-center gap-2 flex-1 sm:justify-center">
        {/* Show / Setting Selector */}
        <div className="flex items-center gap-1 bg-[#0b0f17] px-2 py-1 border border-[#2a374a] rounded flex-1 sm:flex-initial">
          <span className="text-[10px] text-amber-400 font-mono hidden lg:inline">SHOW:</span>
          <select
            value={currentSettingId}
            onChange={(e) => onSelectSetting(e.target.value)}
            aria-label="Select Sitcom Setting"
            className="bg-transparent text-[11px] sm:text-xs text-slate-200 outline-none cursor-pointer font-medium w-full sm:w-auto"
          >
            {Object.values(ALL_SETTINGS).map((s) => (
              <option key={s.id} value={s.id} className="bg-[#131b26] text-white">
                {s.showTitle} ({s.name})
              </option>
            ))}
          </select>
        </div>

        {/* Preset Episodes Selector */}
        <div className="flex items-center gap-1 bg-[#0b0f17] px-2 py-1 border border-[#2a374a] rounded flex-1 sm:flex-initial">
          <Film className="w-3 h-3 text-blue-400 shrink-0" />
          <select
            value={currentEpisodeTitle}
            onChange={(e) => onSelectEpisode(Number(e.target.value))}
            aria-label="Select Episode"
            className="bg-transparent text-[11px] sm:text-xs text-slate-200 outline-none cursor-pointer font-medium w-full sm:max-w-[190px] md:max-w-[240px] truncate"
          >
            {PRESET_EPISODES.map((ep, idx) => {
              const showName = ALL_SETTINGS[ep.settingId]?.showTitle || ep.showId || 'Sitcom';
              return (
                <option key={idx} value={idx} className="bg-[#131b26] text-white">
                  [{showName}] {ep.title}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Desktop Action Buttons */}
      <div className="hidden sm:flex items-center gap-2">
        <button
          onClick={onToggleCastDrawer}
          className={`pixel-btn text-[9px] px-2.5 py-1.5 ${isCastDrawerOpen ? 'bg-amber-600 border-amber-400 text-white' : ''}`}
          title="Inspect Characters"
        >
          <Users className="w-3.5 h-3.5" />
          <span className="hidden md:inline">CAST</span>
        </button>

        <button
          onClick={onOpenScriptStudio}
          className="pixel-btn btn-primary text-[9px] px-3 py-1.5 glow-active flex items-center gap-1.5"
          title="Open AI Prompt Builder & Script Studio"
        >
          <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />
          <span>AI PROMPT & SCRIPT</span>
        </button>

        <button
          onClick={() => soundEngine.playThemeJingle()}
          className="pixel-btn text-[9px] px-2 py-1.5 hidden xl:inline-flex"
          title="Play 8-Bit Sitcom Theme Jingle"
        >
          <Music className="w-3.5 h-3.5 text-amber-400" />
          <span>THEME</span>
        </button>

        <button
          onClick={onToggleMute}
          className="p-1.5 bg-[#0b0f17] hover:bg-[#1b2636] border border-[#2a374a] rounded text-slate-300 hover:text-white"
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-green-400" />}
        </button>

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
