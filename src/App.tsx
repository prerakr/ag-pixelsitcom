import React, { useState, useEffect, useRef, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { VisualizerEngine } from './engine/CanvasRenderer';
import { ALL_SETTINGS, DEFAULT_SETTING_ID, getShowIdForSetting } from './data/settings';
import { ALL_CHARACTERS, getCharactersForShow } from './data/characters';
import { PRESET_EPISODES } from './data/episodes';
import { SitcomScript, ScriptBeat, TalkingHeadBeat } from './types/script';
import { Header } from './components/Header';
import { Viewport } from './components/Viewport';
import { PlaybackControls } from './components/PlaybackControls';
import { TalkingHeadModal } from './components/TalkingHeadModal';
import { ScriptStudio } from './components/ScriptStudio';
import { CharacterRoster } from './components/CharacterRoster';
import { HelpModal } from './components/HelpModal';
import { soundEngine } from './engine/SoundEngine';

export function App() {
  const [settingId, setSettingId] = useState<string>(DEFAULT_SETTING_ID);
  const currentSetting = ALL_SETTINGS[settingId] || ALL_SETTINGS[DEFAULT_SETTING_ID];

  // Characters for active show
  const currentShowCharacters = useMemo(() => {
    const showId = getShowIdForSetting(settingId);
    return getCharactersForShow(showId);
  }, [settingId]);

  // Current Episode
  const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState<number>(0);
  const [activeScript, setActiveScript] = useState<SitcomScript>(PRESET_EPISODES[0]);

  // Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [currentSceneIdx, setCurrentSceneIdx] = useState<number>(0);
  const [currentBeatIdx, setCurrentBeatIdx] = useState<number>(0);
  const [currentBeat, setCurrentBeat] = useState<ScriptBeat | null>(null);
  const [talkingHead, setTalkingHead] = useState<TalkingHeadBeat | null>(null);

  // Modals & Drawers
  const [isScriptStudioOpen, setIsScriptStudioOpen] = useState<boolean>(false);
  const [isCastDrawerOpen, setIsCastDrawerOpen] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [allowCameraJumps, setAllowCameraJumps] = useState<boolean>(true);

  // Create & maintain VisualizerEngine instance
  const engine = useMemo(() => {
    return new VisualizerEngine(currentSetting, ALL_CHARACTERS, {
      onBeatChange: (sceneIdx, beatIdx, beat) => {
        setCurrentSceneIdx(sceneIdx);
        setCurrentBeatIdx(beatIdx);
        setCurrentBeat(beat);

        // Dundie Confetti trigger!
        if (
          beat &&
          ((beat.type === 'emote' && beat.emote === 'dundie') ||
            (beat.type === 'dialogue' && beat.emote === 'dundie'))
        ) {
          confetti({
            particleCount: 60,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#ffd700', '#f59e0b', '#ffffff'],
          });
        }
      },
      onTalkingHead: (data) => {
        setTalkingHead(data);
      },
      onPlaybackStateChange: (playing) => {
        setIsPlaying(playing);
      },
      onEpisodeEnd: () => {
        setIsPlaying(false);
        confetti({
          particleCount: 100,
          spread: 90,
          origin: { y: 0.5 },
        });
      },
    });
  }, []);

  // Update engine setting when show changes
  useEffect(() => {
    engine.setSetting(currentSetting);
  }, [engine, currentSetting]);

  // Load script into engine
  useEffect(() => {
    engine.loadScript(activeScript);
  }, [engine, activeScript]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger hotkeys if typing in textarea / input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        engine.togglePlay();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        engine.nextBeat();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        engine.prevBeat();
      } else if (e.code === 'Escape') {
        setIsScriptStudioOpen(false);
        setIsCastDrawerOpen(false);
        setIsHelpOpen(false);
        if (talkingHead) {
          setTalkingHead(null);
          engine.nextBeat();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [engine, talkingHead]);

  // Handler functions
  const handleSelectSetting = (id: string) => {
    setSettingId(id);
    const newSetting = ALL_SETTINGS[id];
    if (newSetting) {
      const showId = getShowIdForSetting(id);
      const matchingEp = PRESET_EPISODES.find((ep) => ep.settingId === id || ep.showId === showId);
      if (matchingEp) {
        const epIdx = PRESET_EPISODES.indexOf(matchingEp);
        if (epIdx >= 0) setCurrentEpisodeIndex(epIdx);
        setActiveScript(matchingEp);
      } else {
        const showChars = getCharactersForShow(showId);
        const adaptedScript: SitcomScript = {
          ...activeScript,
          settingId: id,
          showId: showId,
          characters: showChars.map((c) => c.id),
        };
        setActiveScript(adaptedScript);
      }
    }
  };

  const handleSelectPresetEpisode = (idx: number) => {
    setCurrentEpisodeIndex(idx);
    const ep = PRESET_EPISODES[idx];
    if (ep) {
      if (ep.settingId && ALL_SETTINGS[ep.settingId]) {
        setSettingId(ep.settingId);
      }
      setActiveScript(ep);
    }
  };

  const handleLoadCustomScript = (script: SitcomScript) => {
    if (script.settingId && ALL_SETTINGS[script.settingId]) {
      setSettingId(script.settingId);
    }
    setActiveScript(script);
  };

  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundEngine.setMuted(next);
  };

  const handleFocusCharacter = (charId: string) => {
    const state = engine.characterStates.get(charId);
    if (state) {
      engine.camera.setTarget(state.x, state.y, 1.8);
      engine.cameraMode = 'auto';
    }
  };

  return (
    <div className="flex flex-col w-full h-[100dvh] overflow-hidden bg-[#0c1017] text-white">
      {/* Top Application Header */}
      <Header
        currentSettingId={settingId}
        onSelectSetting={handleSelectSetting}
        currentEpisodeTitle={String(currentEpisodeIndex)}
        onSelectEpisode={handleSelectPresetEpisode}
        onOpenScriptStudio={() => setIsScriptStudioOpen(true)}
        onToggleCastDrawer={() => setIsCastDrawerOpen(!isCastDrawerOpen)}
        onOpenHelp={() => setIsHelpOpen(true)}
        isCastDrawerOpen={isCastDrawerOpen}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
      />

      {/* Main Top-Down Canvas Viewport */}
      <main className="flex-1 relative overflow-hidden flex">
        <Viewport
          engine={engine}
          onInspectCharacter={(char) => {
            handleFocusCharacter(char.id);
          }}
        />

        {/* Character Cast Roster Drawer */}
        <CharacterRoster
          isOpen={isCastDrawerOpen}
          onClose={() => setIsCastDrawerOpen(false)}
          characters={currentShowCharacters}
          onFocusCharacter={handleFocusCharacter}
        />
      </main>

      {/* Bottom Playback Control Deck */}
      <PlaybackControls
        script={activeScript}
        currentSceneIdx={currentSceneIdx}
        currentBeatIdx={currentBeatIdx}
        currentBeat={currentBeat}
        isPlaying={isPlaying}
        playbackSpeed={playbackSpeed}
        allowCameraJumps={allowCameraJumps}
        onToggleCameraJumps={() => {
          const next = !allowCameraJumps;
          setAllowCameraJumps(next);
          engine.setAllowCameraJumps(next);
        }}
        onTogglePlay={() => engine.togglePlay()}
        onPrevBeat={() => engine.prevBeat()}
        onNextBeat={() => engine.nextBeat()}
        onJumpToBeat={(s, b) => engine.jumpToBeat(s, b)}
        onChangeSpeed={(speed) => {
          setPlaybackSpeed(speed);
          engine.setPlaybackSpeed(speed);
        }}
        onRestartEpisode={() => {
          engine.loadScript(activeScript);
          engine.play();
        }}
      />

      {/* Mockumentary Talking Head Modal */}
      {talkingHead && (
        <TalkingHeadModal
          talkingHead={talkingHead}
          charactersMap={ALL_CHARACTERS}
          onClose={() => {
            setTalkingHead(null);
            engine.nextBeat();
          }}
        />
      )}

      {/* AI Script Studio Modal */}
      <ScriptStudio
        isOpen={isScriptStudioOpen}
        onClose={() => setIsScriptStudioOpen(false)}
        currentSetting={currentSetting}
        characters={currentShowCharacters}
        currentScript={activeScript}
        onLoadScript={handleLoadCustomScript}
      />

      {/* Help & Guide Modal */}
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
}
export default App;
