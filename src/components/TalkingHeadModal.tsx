import React, { useEffect, useRef, useState } from 'react';
import { TalkingHeadBeat } from '../types/script';
import { CharacterDefinition, CharacterRuntimeState } from '../types/character';
import { CharacterRenderer } from '../engine/CharacterRenderer';
import { soundEngine } from '../engine/SoundEngine';
import { spriteManager } from '../engine/SpriteManager';
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
    let index = 0;
    setDisplayedText('');

    const interval = setInterval(() => {
      index++;
      setDisplayedText(fullText.slice(0, index));

      // Play soft typewriter SFX periodically
      if (index % 3 === 0) {
        soundEngine.playSfx('typewriter', 0.25);
      }

      if (index >= fullText.length) {
        clearInterval(interval);
      }
    }, 32);

    return () => clearInterval(interval);
  }, [fullText]);

  // Render high-res zoomed character portrait on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !character) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = false;

      const portrait = spriteManager.getPortrait(character.id, talkingHead.emotion);

      if (portrait) {
        // High-res pixel art bust portrait
        const { canvas: pCanvas, rect } = portrait;
        const now = Date.now();
        const breathe = Math.sin(now / 450) * 1.5;

        const srcX = rect ? rect.x : 0;
        const srcY = rect ? rect.y : 0;
        const srcW = rect ? rect.w : pCanvas.width;
        const srcH = rect ? rect.h : pCanvas.height;

        ctx.save();
        // Draw subtle vignette background
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw portrait fitted to canvas with subtle breathing
        const pad = 4;
        ctx.drawImage(
          pCanvas,
          srcX,
          srcY,
          srcW,
          srcH,
          pad,
          pad + breathe,
          canvas.width - pad * 2,
          canvas.height - pad * 2
        );

        // Overlay scanlines
        ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
        for (let y = 0; y < canvas.height; y += 4) {
          ctx.fillRect(0, y, canvas.width, 2);
        }
        ctx.restore();
      } else {
        ctx.save();
        // Scale up character for intimate talking-head portrait
        ctx.scale(4.5, 4.5);
        ctx.translate(28, 38);

        const state: CharacterRuntimeState = {
          id: character.id,
          x: 0,
          y: 0,
          facing: 'down',
          isMoving: false,
          speed: 1,
          animFrame: 0,
          animTimer: 0,
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
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [character, talkingHead, displayedText, fullText]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-[#131b26] border-4 border-[#2a374a] shadow-2xl rounded-lg overflow-hidden flex flex-col">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-3 sm:px-4 py-2 bg-[#0c1017] border-b-2 border-[#2a374a]">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
            <Video className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500" />
            <span className="pixel-font text-[9px] sm:text-[10px] text-amber-400 font-bold tracking-wider">
              CONFESSIONAL // TALKING HEAD
            </span>
          </div>
          <span className="text-[11px] sm:text-xs font-mono text-slate-400">
            {character?.name || talkingHead.speaker}
          </span>
        </div>

        {/* Mockumentary Stage View */}
        <div className="relative flex flex-col sm:flex-row items-center p-4 sm:p-6 gap-4 sm:gap-6 blinds-backdrop overflow-y-auto">
          {/* Animated Pixel Portrait Frame */}
          <div className="relative w-32 h-32 sm:w-44 sm:h-44 bg-[#0b0f17]/90 border-4 border-[#4a5568] shadow-[4px_4px_0px_rgba(0,0,0,0.8)] rounded-md flex items-center justify-center overflow-hidden shrink-0">
            <canvas ref={canvasRef} width={220} height={220} className="w-full h-full" />
            {/* Lower third name badge */}
            <div className="absolute bottom-1 inset-x-1 bg-black/85 py-0.5 sm:py-1 px-1 sm:px-2 text-center rounded border border-white/10">
              <p className="pixel-font text-[7px] sm:text-[8px] text-amber-400 truncate">
                {character?.name || talkingHead.speaker}
              </p>
              <p className="text-[8px] sm:text-[9px] text-slate-300 font-mono truncate">{character?.role}</p>
            </div>
          </div>

          {/* Monologue Speech Box */}
          <div className="flex-1 w-full bg-[#0b0f17]/90 border-2 border-amber-500/80 rounded-lg p-3 sm:p-4 shadow-xl text-left min-h-[120px] sm:min-h-[140px] flex flex-col justify-between">
            <p className="typewriter-font text-base sm:text-lg md:text-xl text-slate-100 leading-relaxed">
              "{displayedText}"
            </p>

            <div className="flex items-center justify-between pt-2 sm:pt-3 border-t border-[#2a374a] mt-2 sm:mt-3">
              <span className="text-[10px] sm:text-[11px] text-amber-400/80 font-mono">
                [{talkingHead.emotion || 'deadpan'}]
              </span>
              <button
                onClick={onClose}
                className="pixel-btn btn-primary text-[9px] sm:text-[10px] px-3 py-1.5 flex items-center gap-1.5"
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
