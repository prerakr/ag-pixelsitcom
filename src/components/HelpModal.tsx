import React from 'react';
import { HelpCircle, Keyboard, Tv, Sparkles } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#131b26] border-4 border-[#2a374a] shadow-2xl rounded-xl overflow-hidden flex flex-col text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-[#0b0f17] border-b-2 border-[#2a374a]">
          <div className="flex items-center gap-2.5">
            <HelpCircle className="w-5 h-5 text-amber-400" />
            <h3 className="pixel-font text-xs text-amber-400 font-bold">
              PIXELSITCOM // USER GUIDE
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 px-3 bg-[#1e293b] hover:bg-red-600 rounded text-slate-300 hover:text-white font-mono text-xs transition-colors"
          >
            ✕ CLOSE
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[75vh] space-y-5 text-sm">
          {/* Section 1: Keyboard & Mouse Shortcuts */}
          <div>
            <h4 className="flex items-center gap-2 pixel-font text-xs text-amber-300 font-bold mb-2">
              <Keyboard className="w-4 h-4" />
              KEYBOARD & NAVIGATION CONTROLS
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-[#0b0f17] p-2.5 rounded border border-[#2a374a] flex justify-between">
                <span className="text-slate-400">Play / Pause:</span>
                <span className="text-amber-300 font-bold">SPACEBAR</span>
              </div>
              <div className="bg-[#0b0f17] p-2.5 rounded border border-[#2a374a] flex justify-between">
                <span className="text-slate-400">Next / Prev Beat:</span>
                <span className="text-amber-300 font-bold">ARROW KEYS ← / →</span>
              </div>
              <div className="bg-[#0b0f17] p-2.5 rounded border border-[#2a374a] flex justify-between">
                <span className="text-slate-400">Pan Viewport:</span>
                <span className="text-amber-300 font-bold">CLICK & DRAG</span>
              </div>
              <div className="bg-[#0b0f17] p-2.5 rounded border border-[#2a374a] flex justify-between">
                <span className="text-slate-400">Zoom In / Out:</span>
                <span className="text-amber-300 font-bold">MOUSE SCROLL WHEEL</span>
              </div>
            </div>
          </div>

          {/* Section 2: Mockumentary Visualizer Features */}
          <div>
            <h4 className="flex items-center gap-2 pixel-font text-xs text-blue-300 font-bold mb-2">
              <Tv className="w-4 h-4" />
              VISUALIZER FEATURES
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-300 leading-relaxed list-disc list-inside font-mono">
              <li>
                <strong className="text-amber-300">Y-Sorted 2.5D Depth:</strong> Characters walk behind and in front of desks realistically.
              </li>
              <li>
                <strong className="text-amber-300">Talking Head Interviews:</strong> Seamless cutaway to the single-character confessional in front of office blinds.
              </li>
              <li>
                <strong className="text-amber-300">Jim's Camera Gaze:</strong> Signature fourth-wall breaking stare into the mockumentary camera.
              </li>
              <li>
                <strong className="text-amber-300">Interactive Props & Characters:</strong> Click any character or furniture to inspect details and signature quotes.
              </li>
            </ul>
          </div>

          {/* Section 3: AI Script Generation */}
          <div>
            <h4 className="flex items-center gap-2 pixel-font text-xs text-emerald-300 font-bold mb-2">
              <Sparkles className="w-4 h-4" />
              AI SCRIPT STUDIO & LLM INTEGRATION
            </h4>
            <p className="text-xs text-slate-300 font-mono leading-relaxed mb-2">
              Use the built-in <strong>AI Script Studio</strong> to prompt any premise or copy the <strong>Universal Master Prompt</strong> into ChatGPT, Claude, or Gemini to get a 100% compliant episode script in seconds.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
