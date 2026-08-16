import React from 'react';
import { Volume2, VolumeX, Music, Sparkles, Users, HelpCircle, Film, Tv, Radio, Palette } from 'lucide-react';
import { ALL_SETTINGS } from '../data/settings';
import { PRESET_EPISODES } from '../data/episodes';
import { soundEngine } from '../engine/SoundEngine';
import { musicEngine } from '../engine/MusicEngine';

interface HeaderProps {
  currentSettingId: string;
  onSelectSetting: (id: string) => void;
  currentEpisodeTitle: string;
  onSelectEpisode: (index: number) => void;
  onOpenScriptStudio: () => void;
  onOpenSpriteGallery: () => void;
  onToggleCastDrawer: () => void;
  onOpenHelp: () => void;
  isCastDrawerOpen: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  isBgmMuted: boolean;
  onToggleBgmMute: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentSettingId,
  onSelectSetting,
  currentEpisodeTitle,
  onSelectEpisode,
  onOpenScriptStudio,
  onOpenSpriteGallery,
  onToggleCastDrawer,
  onOpenHelp,
  isCastDrawerOpen,
  isMuted,
  onToggleMute,
  isBgmMuted,
  onToggleBgmMute,
}) => {
  const currentThemeName = musicEngine.getCurrentThemeName();

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
            onClick={onOpenSpriteGallery}
            className="p-1.5 bg-[#0b0f17] border border-emerald-500/50 rounded text-emerald-400"
            title="Sprite Studio"
          >
            <Palette className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onOpenScriptStudio}
            className="pixel-btn btn-primary text-[8px] px-2 py-1.5 flex items-center gap-1 glow-active"
          >
            <Sparkles className="w-3 h-3 animate-spin" style={{ animationDuration: '4s' }} />
            <span>AI SCRIPT</span>
          </button>
          <button
            onClick={onToggleBgmMute}
            className={`p-1.5 border rounded ${!isBgmMuted ? 'bg-amber-600/30 border-amber-400 text-amber-300' : 'bg-[#0b0f17] border-[#2a374a] text-slate-400'}`}
            title={`8-Bit Music: ${!isBgmMuted ? 'ON' : 'MUTED'}`}
          >
            <Music className={`w-3.5 h-3.5 ${!isBgmMuted ? 'text-amber-400 animate-pulse' : 'text-slate-500'}`} />
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
        {/* Procedural 8-Bit BGM Toggle */}
        <button
          onClick={onToggleBgmMute}
          className={`pixel-btn text-[9px] px-2.5 py-1.5 flex items-center gap-1.5 transition-all ${
            !isBgmMuted
              ? 'bg-amber-950/70 border-amber-500 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.25)]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title={`8-Bit Music: ${!isBgmMuted ? 'PLAYING' : 'MUTED'} (${currentThemeName})`}
        >
          <Music className={`w-3.5 h-3.5 ${!isBgmMuted ? 'text-amber-400 animate-pulse' : 'text-slate-500'}`} />
          <span className="font-mono">{!isBgmMuted ? 'BGM ON' : 'BGM OFF'}</span>
          {!isBgmMuted && (
            <span className="hidden xl:inline text-[8px] px-1 py-0.2 bg-amber-500/20 text-amber-300 rounded font-mono border border-amber-500/40 truncate max-w-[110px]">
              {currentThemeName}
            </span>
          )}
        </button>

        <button
          onClick={onOpenSpriteGallery}
          className="pixel-btn text-[9px] px-2.5 py-1.5 flex items-center gap-1.5 bg-emerald-950/70 border-emerald-500 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.2)] hover:bg-emerald-900/80"
          title="Open Sprite Studio & 16-Bit Art Pipeline"
        >
          <Palette className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden md:inline">SPRITE STUDIO</span>
        </button>

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
          <span>AI SCRIPT</span>
        </button>

        <button
          onClick={() => soundEngine.playThemeJingle()}
          className="pixel-btn text-[9px] px-2 py-1.5 hidden xl:inline-flex"
          title="Play 8-Bit Sitcom Theme Jingle"
        >
          <Radio className="w-3.5 h-3.5 text-amber-400" />
          <span>STING</span>
        </button>

        <button
          onClick={onToggleMute}
          className="p-1.5 bg-[#0b0f17] hover:bg-[#1b2636] border border-[#2a374a] rounded text-slate-300 hover:text-white"
          title={isMuted ? 'Unmute Master SFX' : 'Mute Master SFX'}
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
