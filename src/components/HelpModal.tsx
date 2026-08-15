import React from 'react';
import { HelpCircle, Keyboard, Tv, Sparkles, Smartphone } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#131b26] border-4 border-[#2a374a] shadow-2xl rounded-xl overflow-hidden flex flex-col text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-[#0b0f17] border-b-2 border-[#2a374a]">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
            <h3 className="pixel-font text-[10px] sm:text-xs text-amber-400 font-bold">
              PIXELSITCOM // GUIDE
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 px-2.5 bg-[#1e293b] hover:bg-red-600 rounded text-slate-300 hover:text-white font-mono text-xs transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[75vh] space-y-4 sm:space-y-5 text-sm">
          {/* Mobile Gestures */}
          <div>
            <h4 className="flex items-center gap-2 pixel-font text-[10px] sm:text-xs text-emerald-400 font-bold mb-2">
              <Smartphone className="w-4 h-4" />
              MOBILE & TOUCH CONTROLS
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-[#0b0f17] p-2.5 rounded border border-[#2a374a] flex justify-between">
                <span className="text-slate-400">Pan Office:</span>
                <span className="text-emerald-300 font-bold">1-FINGER DRAG</span>
              </div>
              <div className="bg-[#0b0f17] p-2.5 rounded border border-[#2a374a] flex justify-between">
                <span className="text-slate-400">Zoom In/Out:</span>
                <span className="text-emerald-300 font-bold">2-FINGER PINCH</span>
              </div>
              <div className="bg-[#0b0f17] p-2.5 rounded border border-[#2a374a] flex justify-between">
                <span className="text-slate-400">Inspect Character:</span>
                <span className="text-emerald-300 font-bold">TAP ON CHARACTER</span>
              </div>
              <div className="bg-[#0b0f17] p-2.5 rounded border border-[#2a374a] flex justify-between">
                <span className="text-slate-400">Auto-Fit Center:</span>
                <span className="text-emerald-300 font-bold">TAP MAXIMIZE (⛶)</span>
              </div>
            </div>
          </div>

          {/* Keyboard Controls */}
          <div>
            <h4 className="flex items-center gap-2 pixel-font text-[10px] sm:text-xs text-amber-300 font-bold mb-2">
              <Keyboard className="w-4 h-4" />
              KEYBOARD SHORTCUTS
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-[#0b0f17] p-2.5 rounded border border-[#2a374a] flex justify-between">
                <span className="text-slate-400">Play / Pause:</span>
                <span className="text-amber-300 font-bold">SPACEBAR</span>
              </div>
              <div className="bg-[#0b0f17] p-2.5 rounded border border-[#2a374a] flex justify-between">
                <span className="text-slate-400">Next / Prev Beat:</span>
                <span className="text-amber-300 font-bold">ARROWS ← / →</span>
              </div>
            </div>
          </div>

          {/* Section 2: Mockumentary Visualizer Features */}
          <div>
            <h4 className="flex items-center gap-2 pixel-font text-[10px] sm:text-xs text-blue-300 font-bold mb-2">
              <Tv className="w-4 h-4" />
              VISUALIZER FEATURES
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-300 leading-relaxed list-disc list-inside font-mono">
              <li>
                <strong className="text-amber-300">Y-Sorted Depth:</strong> Characters walk behind and in front of desks realistically.
              </li>
              <li>
                <strong className="text-amber-300">Talking Head Interviews:</strong> Seamless cutaway to the single-character confessional in front of office blinds.
              </li>
              <li>
                <strong className="text-amber-300">Jim's Camera Stare:</strong> Procedural head turn directly locking eyes with the viewer.
              </li>
              <li>
                <strong className="text-amber-300">Procedural 8-Bit Soundtracks:</strong> Custom synthesized sitcom chiptune themes (*The Office*, *Friends*, *Silicon Valley*, *HIMYM*) with automatic dialogue ducking.
              </li>
              <li>
                <strong className="text-amber-300">Retro SFX Synthesizer:</strong> Web Audio 8-bit typewriter chatter, laugh tracks, gasps, rimshots, and stings.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
