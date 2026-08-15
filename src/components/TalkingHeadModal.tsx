import React, { useEffect, useRef, useState } from 'react';
import { TalkingHeadBeat } from '../types/script';
import { CharacterDefinition } from '../types/character';
import { CharacterRenderer } from '../engine/CharacterRenderer';
import { soundEngine } from '../engine/SoundEngine';
import { ArrowRight, Video } from 'lucide-react';

interface TalkingHeadModalProps {
  talkingHead: TalkingHeadBeat;
  charactersMap: Record<string, CharacterDefinition>;
  onClose: () => void;
}

export const TalkingHeadModal: React.FC<TalkingHeadModalProps> = ({
  talkingHead,
  charactersMap,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [displayedText, setDisplayedText] = useState('');

  const character = charactersMap[talkingHead.speaker];
  const fullText = talkingHead.monologueText || '';

  // Typewriter effect for interview monologue
  useEffect(() => {
    setDisplayedText('');
    let idx = 0;
    const interval = setInterval(() => {
      if (idx < fullText.length) {
        idx++;
        setDisplayedText(fullText.slice(0, idx));
        if (idx % 3 === 0) {
          soundEngine.playSfx('typewriter', 0.25);
        }
      } else {
        clearInterval(interval);
      }
    }, 32);

    return () => clearInterval(interval);
  }, [talkingHead, fullText]);

  // Draw high-resolution portrait on canvas
  useEffect(() => {
    if (!canvasRef.current || !character) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = false;

      ctx.save();
      // Scale up character for intimate talking-head portrait
      ctx.scale(4.5, 4.5);
      ctx.translate(28, 38);

      const state: any = {
        id: character.id,
        x: 0,
        y: 0,
        facing: 'down',
        isMoving: false,
        speed: 1,
        animFrame: 0,
        currentAction: talkingHead.cameraLook ? 'jim_stare' : undefined,
        currentSpeech: {
          text: fullText,
          displayedText: displayedText,
          charIndex: displayedText.length,
          timer: 0,
          emotion: talkingHead.emotion || 'neutral',
          totalDuration: 5000,
          elapsed: 0,
        },
      };

      CharacterRenderer.drawCharacter(ctx, character, state, false);
      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [character, talkingHead, displayedText, fullText]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#131b26] border-4 border-[#2a374a] shadow-2xl rounded-lg overflow-hidden flex flex-col">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#0c1017] border-b-2 border-[#2a374a]">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-600 animate-ping" />
            <Video className="w-4 h-4 text-red-500" />
            <span className="pixel-font text-[10px] text-amber-400 font-bold tracking-wider">
              CONFESSIONAL // TALKING HEAD
            </span>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {character?.name || talkingHead.speaker}
          </span>
        </div>

        {/* Mockumentary Stage View */}
        <div className="relative flex flex-col md:flex-row items-center p-6 gap-6 blinds-backdrop">
          {/* Animated Pixel Portrait Frame */}
          <div className="relative w-44 h-44 bg-[#0b0f17]/90 border-4 border-[#4a5568] shadow-[4px_4px_0px_rgba(0,0,0,0.8)] rounded-md flex items-center justify-center overflow-hidden shrink-0">
            <canvas ref={canvasRef} width={220} height={220} className="w-full h-full" />
            {/* Lower third name badge */}
            <div className="absolute bottom-1 inset-x-1 bg-black/85 py-1 px-2 text-center rounded border border-white/10">
              <p className="pixel-font text-[8px] text-amber-400 truncate">
                {character?.name || talkingHead.speaker}
              </p>
              <p className="text-[9px] text-slate-300 font-mono truncate">{character?.role}</p>
            </div>
          </div>

          {/* Monologue Speech Box */}
          <div className="flex-1 bg-[#0b0f17]/90 border-2 border-amber-500/80 rounded-lg p-4 shadow-xl text-left min-h-[140px] flex flex-col justify-between">
            <p className="typewriter-font text-lg md:text-xl text-slate-100 leading-relaxed">
              "{displayedText}"
            </p>

            <div className="flex items-center justify-between pt-3 border-t border-[#2a374a] mt-3">
              <span className="text-[11px] text-amber-400/80 font-mono">
                [Mood: {talkingHead.emotion || 'deadpan'}]
              </span>
              <button
                onClick={onClose}
                className="pixel-btn btn-primary text-[10px] px-3 py-1.5 flex items-center gap-1.5"
              >
                <span>CONTINUE</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
