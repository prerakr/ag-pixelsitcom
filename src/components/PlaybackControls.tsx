import React from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  FastForward,
  RotateCcw,
  Clapperboard,
  Video,
  VideoOff,
} from 'lucide-react';
import { SitcomScript, ScriptBeat } from '../types/script';

interface PlaybackControlsProps {
  script: SitcomScript | null;
  currentSceneIdx: number;
  currentBeatIdx: number;
  currentBeat: ScriptBeat | null;
  isPlaying: boolean;
  playbackSpeed: number;
  allowCameraJumps?: boolean;
  onToggleCameraJumps?: () => void;
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
  allowCameraJumps = true,
  onToggleCameraJumps,
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
    if (!currentBeat) return 'Ready to play';
    switch (currentBeat.type) {
      case 'dialogue':
        return `💬 ${(currentBeat as any).speaker.toUpperCase()}: "${(currentBeat as any).text}"`;
      case 'movement':
        return `🚶 ${(currentBeat as any).character.toUpperCase()} to ${(currentBeat as any).target}`;
      case 'interaction':
        return `⚡ ${(currentBeat as any).character.toUpperCase()} ${(currentBeat as any).action}`;
      case 'talking_head':
        return `🎬 CONFESSIONAL: ${(currentBeat as any).speaker.toUpperCase()}`;
      case 'camera_cue':
        return `🎥 Camera: ${(currentBeat as any).target}`;
      case 'emote':
        return `✨ ${(currentBeat as any).character.toUpperCase()}: ${(currentBeat as any).emote}`;
      case 'audio_cue':
        return `🔊 SFX: ${(currentBeat as any).sfx}`;
      case 'group_action':
        return `👥 Group commotion (${(currentBeat as any).actions.length} actions)`;
      default:
        return `🎬 Beat ${currentBeatIdx + 1}`;
    }
  };

  const handleScrubberClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickRatio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetBeat = Math.floor(clickRatio * totalBeats);
    onJumpToBeat(currentSceneIdx, Math.min(totalBeats - 1, targetBeat));
  };

  return (
    <div className="bg-[#131b26] border-t-2 border-[#2a374a] px-3 sm:px-4 py-2 sm:py-3 text-white select-none z-20 shadow-2xl shrink-0">
      {/* Top Banner: Episode & Beat Summary */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 sm:gap-2 mb-2">
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-hidden w-full sm:w-auto">
          <Clapperboard className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
          <span className="pixel-font text-[9px] sm:text-[10px] text-amber-300 font-bold truncate">
            {script.title}
          </span>
          <span className="text-[10px] sm:text-[11px] text-slate-400 font-mono hidden md:inline">
            • {currentScene?.name || 'Scene 1'}
          </span>
        </div>

        {/* Current Beat Info Pill */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 sm:py-1 bg-[#0b0f17] border border-[#2a374a] rounded w-full sm:w-auto sm:max-w-md truncate">
          <span className="text-[9px] sm:text-[10px] text-emerald-400 font-mono font-bold shrink-0">
            [{currentBeatIdx + 1}/{totalBeats}]
          </span>
          <span className="typewriter-font text-[12px] sm:text-[13px] text-slate-200 truncate">
            {getBeatSummary()}
          </span>
        </div>
      </div>

      {/* Interactive Timeline Scrubber */}
      <div
        onClick={handleScrubberClick}
        className="relative w-full h-5 flex items-center mb-2 group cursor-pointer"
      >
        <div className="w-full h-2.5 sm:h-2 bg-[#0c1017] rounded-full overflow-hidden border border-[#2a374a] relative">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-150"
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
      <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
        {/* Playback Transport Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={onRestartEpisode}
            className="p-1.5 sm:p-2 bg-[#1b2636] active:bg-amber-600 hover:bg-amber-600 rounded text-slate-300 hover:text-white transition-colors"
            title="Restart Episode"
          >
            <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          <button
            onClick={onPrevBeat}
            disabled={currentBeatIdx === 0 && currentSceneIdx === 0}
            className="pixel-btn text-[8px] sm:text-[9px] px-2 sm:px-2.5 py-1.5 sm:py-2 disabled:opacity-40 disabled:cursor-not-allowed"
            title="Previous Beat"
          >
            <SkipBack className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span className="hidden sm:inline">PREV</span>
          </button>

          <button
            onClick={onTogglePlay}
            className="pixel-btn btn-primary text-[10px] sm:text-xs px-3 sm:px-4 py-1.5 sm:py-2 flex items-center gap-1.5 sm:gap-2"
            title={isPlaying ? 'Pause' : 'Play Episode'}
          >
            {isPlaying ? (
              <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            ) : (
              <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white" />
            )}
            <span className="font-bold">{isPlaying ? 'PAUSE' : 'PLAY'}</span>
          </button>

          <button
            onClick={onNextBeat}
            className="pixel-btn text-[8px] sm:text-[9px] px-2 sm:px-2.5 py-1.5 sm:py-2"
            title="Next Beat"
          >
            <span className="hidden sm:inline">NEXT</span>
            <SkipForward className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>
        </div>

        {/* Right side: Camera Jump Toggle & Speed */}
        <div className="flex items-center gap-2">
          {/* Camera Jump Toggle Pill */}
          {onToggleCameraJumps && (
            <button
              onClick={onToggleCameraJumps}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[10px] sm:text-[11px] font-mono font-bold border transition-colors ${
                allowCameraJumps
                  ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300'
                  : 'bg-[#1b2636] border-[#2a374a] text-slate-400 hover:text-slate-200'
              }`}
              title={
                allowCameraJumps
                  ? 'Camera Follow: ON (Auto-director frames talking characters)'
                  : 'Camera Follow: OFF (Locked static overview)'
              }
            >
              {allowCameraJumps ? (
                <Video className="w-3.5 h-3.5 text-cyan-400" />
              ) : (
                <VideoOff className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span className="hidden xs:inline">
                {allowCameraJumps ? 'FOLLOW CAM' : 'STATIC CAM'}
              </span>
            </button>
          )}

          {/* Speed Selector */}
          <div className="flex items-center gap-0.5 sm:gap-1 bg-[#0b0f17] p-0.5 sm:p-1 border border-[#2a374a] rounded">
            <FastForward className="w-3 h-3 text-amber-400 ml-1 mr-0.5 hidden xs:inline" />
            {[0.5, 1.0, 1.5, 2.0].map((s) => (
              <button
                key={s}
                onClick={() => onChangeSpeed(s)}
                className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-[11px] font-mono font-bold rounded transition-colors ${
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
    </div>
  );
};
