import React, { useEffect, useRef } from 'react';
import { CharacterDefinition, CharacterRuntimeState } from '../types/character';
import { CharacterRenderer } from '../engine/CharacterRenderer';
import { Users, Crosshair } from 'lucide-react';
import { soundEngine } from '../engine/SoundEngine';
import { portraitView } from '../engine/iso/isoCharacters';

interface CharacterRosterProps {
  isOpen: boolean;
  onClose: () => void;
  characters: CharacterDefinition[];
  onFocusCharacter: (charId: string) => void;
  /** The current set is isometric: show the cast's iso sprites. */
  isoView?: boolean;
}

/** World pixels across the head-and-shoulders crop shown in a cast thumbnail. */
const BUST_SRC_W = 22;

const CharacterAvatarPreview: React.FC<{ character: CharacterDefinition; isoView: boolean }> = ({ character, isoView }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;

    // Draw the whole figure offscreen at native size, then frame its head and shoulders, starting
    // just above the top of the head so tall and short characters crop the same way.
    const off = document.createElement('canvas');
    off.width = BUST_SRC_W * 3;
    off.height = 96;
    const octx = off.getContext('2d');
    if (!octx) return;
    octx.imageSmoothingEnabled = false;
    octx.translate(off.width / 2, 80);
    const view = portraitView(character, isoView);
    const dummyState: CharacterRuntimeState = {
      id: view.def.id,
      x: 0,
      y: 0,
      facing: view.facing,
      isMoving: false,
      speed: 1,
      animFrame: 0,
      animTimer: 0,
    };
    CharacterRenderer.drawCharacter(octx, view.def, dummyState, false);

    const pixels = octx.getImageData(0, 0, off.width, off.height).data;
    let top = 0;
    scan: for (; top < off.height; top++) {
      for (let x = 0; x < off.width; x++) if (pixels[(top * off.width + x) * 4 + 3] > 0) break scan;
    }
    const srcH = Math.round((BUST_SRC_W * canvas.height) / canvas.width);
    ctx.drawImage(off, (off.width - BUST_SRC_W) / 2, Math.max(0, top - 1), BUST_SRC_W, srcH, 0, 0, canvas.width, canvas.height);
  }, [character, isoView]);

  return (
    <canvas
      ref={canvasRef}
      width={48}
      height={52}
      className="w-12 h-13 rounded bg-[#070a0f] border border-[#2a374a] shrink-0"
    />
  );
};

export const CharacterRoster: React.FC<CharacterRosterProps> = ({
  isOpen,
  onClose,
  characters,
  onFocusCharacter,
  isoView = false,
}) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop overlay */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 z-30 animate-in fade-in duration-150"
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-40 w-full max-w-sm bg-[#131b26] border-l-4 border-[#2a374a] shadow-2xl flex flex-col text-white animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#0b0f17] border-b-2 border-[#2a374a]">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-400" />
            <h3 className="pixel-font text-xs text-amber-400 font-bold">
              SHOW CAST ROSTER ({characters.length})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 px-2 bg-[#1e293b] hover:bg-red-600 rounded text-slate-300 hover:text-white font-mono text-xs transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Characters List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {characters.map((char) => (
            <div
              key={char.id}
              className="bg-[#0b0f17] border border-[#2a374a] hover:border-amber-500/60 rounded-lg p-3.5 transition-all shadow-md"
            >
              <div className="flex items-center gap-3 mb-2.5">
                <CharacterAvatarPreview character={char} isoView={isoView} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="pixel-font text-xs text-amber-300 font-bold truncate">
                      {char.name}
                    </h4>
                    <button
                      onClick={() => {
                        onFocusCharacter(char.id);
                        soundEngine.playSfx('typewriter');
                      }}
                      className="pixel-btn text-[8px] px-2 py-1 flex items-center gap-1 shrink-0"
                      title="Center Camera on Character"
                    >
                      <Crosshair className="w-3 h-3 text-amber-400" />
                      <span>TRACK</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-blue-300 font-mono truncate">{char.role}</p>
                </div>
              </div>

              {/* Signature Quote */}
              <div className="bg-[#131b26] p-2 rounded border border-[#1f293d] mb-2.5">
                <p className="typewriter-font text-[13px] text-slate-200 italic">
                  "{char.signatureQuotes[0]}"
                </p>
              </div>

              {/* Traits */}
              <div className="flex flex-wrap gap-1">
                {char.personalityTraits.map((t, idx) => (
                  <span
                    key={idx}
                    className="text-[9px] px-1.5 py-0.5 bg-[#1b2636] text-amber-300/90 rounded font-mono"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};
