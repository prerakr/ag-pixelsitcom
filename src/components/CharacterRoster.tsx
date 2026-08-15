import React from 'react';
import { CharacterDefinition } from '../types/character';
import { Users, Crosshair, Sparkles } from 'lucide-react';
import { soundEngine } from '../engine/SoundEngine';

interface CharacterRosterProps {
  isOpen: boolean;
  onClose: () => void;
  characters: CharacterDefinition[];
  onFocusCharacter: (charId: string) => void;
}

export const CharacterRoster: React.FC<CharacterRosterProps> = ({
  isOpen,
  onClose,
  characters,
  onFocusCharacter,
}) => {
  if (!isOpen) return null;

  return (
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
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="pixel-font text-xs text-amber-300 font-bold">{char.name}</h4>
                <p className="text-[11px] text-blue-300 font-mono">{char.role}</p>
              </div>

              <button
                onClick={() => {
                  onFocusCharacter(char.id);
                  soundEngine.playSfx('typewriter');
                }}
                className="pixel-btn text-[8px] px-2 py-1 flex items-center gap-1"
                title="Center Camera on Character"
              >
                <Crosshair className="w-3 h-3 text-amber-400" />
                <span>TRACK</span>
              </button>
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
  );
};
