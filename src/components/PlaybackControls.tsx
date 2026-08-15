import React from 'react';
import { Play, Pause, SkipBack, SkipForward, FastForward, RotateCcw, Clapperboard, Sparkles } from 'lucide-react';
import { SitcomScript, ScriptBeat } from '../types/script';

interface PlaybackControlsProps {
  script: SitcomScript | null;
  currentSceneIdx: number;
  currentBeatIdx: number;
  currentBeat: ScriptBeat | null;
  isPlaying: boolean;
  playbackSpeed: number;
  onTogglePlay: () => void;
  onPrevBeat: () => void;
  onNextBeat: () => void;
  onJumpToBeat: (sceneIdx: number, beatIdx: number) => void;
  onChangeSpeed: (speed: number) => void;
  onRestartEpisode: () => void;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  script,
  currentSceneIdx,
  currentBeatIdx,
  currentBeat,
  isPlaying,
  playbackSpeed,
  onTogglePlay,
  onPrevBeat,
  onNextBeat,
  onJumpToBeat,
  onChangeSpeed,
  onRestartEpisode,
}) => {
  if (!script) return null;

  const currentScene = script.scenes[currentSceneIdx];
  const totalBeats = currentScene?.beats.length || 1;
  const progressPercent = totalBeats > 0 ? ((currentBeatIdx + 1) / totalBeats) * 100 : 0;

  // Format active beat description
  const getBeatSummary = () => {
    if (!currentBeat) return 'Ready to play episode';
    switch (currentBeat.type) {
      case 'dialogue':
        return `💬 ${(currentBeat as any).speaker.toUpperCase()}: "${(currentBeat as any).text}"`;
      case 'movement':
        return `🚶 ${(currentBeat as any).character.toUpperCase()} moving to ${(currentBeat as any).target}`;
      case 'interaction':
        return `⚡ ${(currentBeat as any).character.toUpperCase()} ${(currentBeat as any).action} on ${(currentBeat as any).targetProp}`;
      case 'talking_head':
        return `🎬 TALKING HEAD: ${(currentBeat as any).speaker.toUpperCase()} solo interview`;
      case 'camera_cue':
        return `🎥 Camera focusing on ${(currentBeat as any).target}`;
      case 'emote':
        return `✨ ${(currentBeat as any).character.toUpperCase()} reaction: ${(currentBeat as any).emote}`;
      case 'audio_cue':
        return `🔊 SFX: ${(currentBeat as any).sfx}`;
      case 'group_action':
        return `👥 Group commotion (${(currentBeat as any).actions.length} actions)`;
      default:
        return `🎬 Beat ${currentBeatIdx + 1}`;
    }
  };

  return (
    <div className="bg-[#131b26] border-t-2 border-[#2a374a] px-4 py-3 text-white select-none z-20 shadow-2xl">
      {/* Top Banner: Episode & Beat Summary */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 overflow-hidden">
          <Clapperboard className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="pixel-font text-[10px] text-amber-300 font-bold truncate">
            {script.title}
          </span>
          <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
            • {currentScene?.name || 'Scene 1'}
          </span>
        </div>

        {/* Current Beat Info Pill */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#0b0f17] border border-[#2a374a] rounded max-w-md truncate">
          <span className="text-[10px] text-emerald-400 font-mono font-bold">
            BEAT {currentBeatIdx + 1}/{totalBeats}:
          </span>
          <span className="typewriter-font text-[13px] text-slate-200 truncate">
            {getBeatSummary()}
          </span>
        </div>
      </div>

      {/* Interactive Timeline Scrubber */}
      <div className="relative w-full h-4 flex items-center mb-3 group cursor-pointer">
        <div className="w-full h-2 bg-[#0c1017] rounded-full overflow-hidden border border-[#2a374a] relative">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-200"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Beat tick marks */}
        <div className="absolute inset-0 flex items-center justify-between px-1 pointer-events-none">
          {currentScene?.beats.map((_, idx) => (
            <div
              key={idx}
              className={`w-1.5 h-1.5 rounded-full ${idx <= currentBeatIdx ? 'bg-amber-300' : 'bg-slate-700'}`}
            />
          ))}
        </div>
      </div>

      {/* Bottom Controls Deck */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Playback Transport Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onRestartEpisode}
            className="p-2 bg-[#1b2636] hover:bg-amber-600 rounded text-slate-300 hover:text-white transition-colors"
            title="Restart Episode"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={onPrevBeat}
            disabled={currentBeatIdx === 0 && currentSceneIdx === 0}
            className="pixel-btn text-[9px] px-2.5 py-2 disabled:opacity-40 disabled:cursor-not-allowed"
            title="Previous Beat (Left Arrow)"
          >
            <SkipBack className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">PREV</span>
          </button>

          <button
            onClick={onTogglePlay}
            className="pixel-btn btn-primary text-xs px-4 py-2 flex items-center gap-2"
            title={isPlaying ? 'Pause (Spacebar)' : 'Play Episode (Spacebar)'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
            <span className="font-bold">{isPlaying ? 'PAUSE' : 'PLAY'}</span>
          </button>

          <button
            onClick={onNextBeat}
            className="pixel-btn text-[9px] px-2.5 py-2"
            title="Next Beat (Right Arrow)"
          >
            <span className="hidden sm:inline">NEXT</span>
            <SkipForward className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Speed Selector */}
        <div className="flex items-center gap-1 bg-[#0b0f17] p-1 border border-[#2a374a] rounded">
          <FastForward className="w-3.5 h-3.5 text-amber-400 ml-1.5 mr-0.5" />
          {[0.5, 1.0, 1.5, 2.0].map((s) => (
            <button
              key={s}
              onClick={() => onChangeSpeed(s)}
              className={`px-2 py-1 text-[11px] font-mono font-bold rounded transition-colors ${
                playbackSpeed === s
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
