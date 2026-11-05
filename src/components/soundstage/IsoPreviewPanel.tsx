import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { SettingDefinition } from '../../types/environment';
import { CharacterRuntimeState } from '../../types/character';
import { ALL_CHARACTERS } from '../../data/characters';
import { IsoStage } from '../../engine/iso/IsoStage';
import { ISO } from '../../engine/iso/IsoProjection';
import { seatAt } from '../../engine/Seats';

/** How often the preview redraws while the set is changing (ms); edits re-bake the stage. */
const REDRAW_MS = 200;
/** Redraw now and then even when nothing changed, so late-loading atlases appear. */
const IDLE_REDRAW_MS = 1000;
const PANEL_W = 420;
const PANEL_H = 280;

/**
 * A live isometric preview of the set being edited, drawn with the same IsoStage the visualizer
 * uses, the cast standing (or sitting) at their spawn points.
 */
export const IsoPreviewPanel: React.FC<{ setting: SettingDefinition }> = ({ setting }) => {
  const [open, setOpen] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const settingRef = useRef(setting);
  settingRef.current = setting;
  const stage = useMemo(() => new IsoStage(), []);

  useEffect(() => {
    if (!open) return;
    const world = document.createElement('canvas');
    const wctx = world.getContext('2d');
    const noProps = new Map<string, Record<string, any>>();
    let drawn: SettingDefinition | null = null;
    let lastDraw = 0;
    let raf = 0;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const s = settingRef.current;
      const due = s !== drawn ? now - lastDraw >= REDRAW_MS : now - lastDraw >= IDLE_REDRAW_MS;
      const out = canvasRef.current?.getContext('2d');
      if (!due || !wctx || !out || !canvasRef.current) return;
      drawn = s;
      lastDraw = now;

      const T = s.tileSize;
      const b = ISO.bounds(s.gridWidth * T, s.gridHeight * T);
      const pad = 12;
      const x0 = Math.floor(b.x0) - pad;
      const y0 = Math.floor(b.y0) - pad;
      const w = Math.ceil(b.x1 - b.x0) + pad * 2;
      const h = Math.ceil(b.y1 - b.y0) + pad * 2;
      if (world.width !== w || world.height !== h) {
        world.width = w;
        world.height = h;
      }
      wctx.setTransform(1, 0, 0, 1, 0, 0);
      wctx.fillStyle = s.backgroundColor || '#14161a';
      wctx.fillRect(0, 0, w, h);
      wctx.setTransform(1, 0, 0, 1, -x0, -y0);
      wctx.imageSmoothingEnabled = false;
      stage.setBuffer(x0, y0, 1);
      stage.draw(wctx, s, castAtSpawns(s), ALL_CHARACTERS, noProps, now);

      const c = canvasRef.current;
      const k = Math.min(c.width / w, c.height / h);
      out.setTransform(1, 0, 0, 1, 0, 0);
      out.fillStyle = '#0a0e14';
      out.fillRect(0, 0, c.width, c.height);
      out.imageSmoothingEnabled = k < 1;
      out.imageSmoothingQuality = 'high';
      out.drawImage(world, Math.round((c.width - w * k) / 2), Math.round((c.height - h * k) / 2), Math.round(w * k), Math.round(h * k));
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [open, stage]);

  return (
    <div className="absolute right-3 bottom-3 z-20 flex flex-col bg-[#0d141e]/95 border-2 border-[#2a374a] rounded-lg shadow-2xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-mono font-bold text-amber-400 hover:text-amber-300 bg-[#0a0e14] border-b border-[#2a374a]"
        title={open ? 'Hide the isometric preview' : 'Show the isometric preview'}
      >
        {open ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
        ISO PREVIEW {open ? '' : '(hidden)'}
      </button>
      {open && <canvas ref={canvasRef} width={PANEL_W} height={PANEL_H} className="block" />}
    </div>
  );
};

/** The cast at their spawn points, seated where a spawn is in a seat. */
function castAtSpawns(setting: SettingDefinition): CharacterRuntimeState[] {
  const T = setting.tileSize;
  const out: CharacterRuntimeState[] = [];
  for (const [id, sp] of Object.entries(setting.spawnPoints || {})) {
    if (!ALL_CHARACTERS[id]) continue;
    const x = sp.x * T;
    const y = sp.y * T;
    const seat = seatAt(setting, x, y);
    out.push({
      id,
      x,
      y,
      facing: seat?.facing || sp.facing || 'down',
      isMoving: false,
      speed: 1,
      animFrame: 0,
      animTimer: 0,
      isSitting: !!seat,
      state: seat ? 'sitting_desk' : 'idle',
    });
  }
  return out;
}
