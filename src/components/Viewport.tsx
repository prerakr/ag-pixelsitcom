import React, { useEffect, useRef, useState, useCallback } from 'react';
import { VisualizerEngine } from '../engine/CanvasRenderer';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Video,
  VideoOff,
  Eye,
  MapPin,
  Tag,
  Sun,
  Sunset,
  Moon,
  Flame,
  Send,
  Coffee,
} from 'lucide-react';
import { CharacterDefinition } from '../types/character';
import { soundEngine } from '../engine/SoundEngine';
import { lightingEngine } from '../engine/LightingEngine';
import { particleSystem } from '../engine/ParticleSystem';
import { TimeOfDay } from '../types/script';

interface ViewportProps {
  engine: VisualizerEngine;
  onInspectCharacter?: (char: CharacterDefinition) => void;
}

export const Viewport: React.FC<ViewportProps> = ({ engine, onInspectCharacter }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Mouse State
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Touch State for Mobile
  const touchStartRef = useRef<{ x: number; y: number; dist: number; moved: boolean }>({
    x: 0,
    y: 0,
    dist: 0,
    moved: false,
  });

  const [allowCameraJumps, setAllowCameraJumpsState] = useState(engine.allowCameraJumps);
  const [showWaypoints, setShowWaypoints] = useState(false);
  const [showNameTags, setShowNameTags] = useState(true);
  const [crtEffect, setCrtEffect] = useState(false);
  const [timeOfDay, setTimeOfDayState] = useState<TimeOfDay>('day');
  const [selectedEntity, setSelectedEntity] = useState<any | null>(null);

  // Auto-fit camera for mobile on first mount and resize
  const autoFitCamera = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const worldW = engine.setting.gridWidth * engine.setting.tileSize;
    const worldH = engine.setting.gridHeight * engine.setting.tileSize;

    if (rect.width < 768) {
      engine.camera.fitToViewport(rect.width, rect.height, worldW, worldH);
    } else {
      engine.camera.setTarget(
        engine.setting.defaultCamera.x,
        engine.setting.defaultCamera.y,
        engine.setting.defaultCamera.zoom
      );
    }
  }, [engine]);

  // Resize canvas when container size changes
  useEffect(() => {
    const handleResize = () => {
      if (!canvasRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      canvasRef.current.width = Math.round(rect.width * dpr);
      canvasRef.current.height = Math.round(rect.height * dpr);
      canvasRef.current.style.width = `${rect.width}px`;
      canvasRef.current.style.height = `${rect.height}px`;
    };

    handleResize();
    autoFitCamera();

    const observer = new ResizeObserver(() => {
      handleResize();
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    if (canvasRef.current) {
      engine.setCanvas(canvasRef.current);
      engine.start();
    }

    return () => {
      observer.disconnect();
    };
  }, [engine, autoFitCamera]);

  // Click / Tap Handler for inspecting entities
  const handleInspectAtPoint = (screenX: number, screenY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const world = engine.camera.screenToWorld(screenX, screenY, rect.width, rect.height);
    const tileSize = engine.setting.tileSize;

    // Check characters clicked
    for (const [id, state] of engine.characterStates.entries()) {
      const dist = Math.hypot(state.x - world.x, state.y - world.y);
      if (dist < 28) {
        const char = engine.charactersMap[id];
        if (char) {
          setSelectedEntity({ type: 'character', data: char, state });
          if (onInspectCharacter) onInspectCharacter(char);
          soundEngine.playSfx('typewriter', 0.5);
          return;
        }
      }
    }

    // Check props clicked
    for (const prop of engine.setting.props) {
      const px = prop.x * tileSize;
      const py = prop.y * tileSize;
      const pw = (prop.width || 1) * tileSize;
      const ph = (prop.height || 1) * tileSize;

      if (world.x >= px && world.x <= px + pw && world.y >= py && world.y <= py + ph) {
        setSelectedEntity({ type: 'prop', data: prop });
        soundEngine.playSfx('stapler_click', 0.5);
        return;
      }
    }

    setSelectedEntity(null);
  };

  // --- MOUSE CONTROLS (DESKTOP) ---
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = (e.clientX - dragStart.x) / engine.camera.zoom;
    const dy = (e.clientY - dragStart.y) / engine.camera.zoom;

    engine.camera.x -= dx;
    engine.camera.y -= dy;
    engine.camera.targetX = engine.camera.x;
    engine.camera.targetY = engine.camera.y;
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    const dist = Math.hypot(e.clientX - dragStart.x, e.clientY - dragStart.y);
    setIsDragging(false);

    if (dist < 5 && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      handleInspectAtPoint(e.clientX - rect.left, e.clientY - rect.top);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    const newZoom = Math.max(
      engine.camera.minZoom,
      Math.min(3.5, engine.camera.targetZoom * zoomFactor)
    );
    engine.camera.targetZoom = newZoom;
  };

  // --- TOUCH CONTROLS (MOBILE & TABLET) ---
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        dist: 0,
        moved: false,
      };
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchStartRef.current = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        dist: Math.hypot(dx, dy),
        moved: true,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const dx = (touch.clientX - touchStartRef.current.x) / engine.camera.zoom;
      const dy = (touch.clientY - touchStartRef.current.y) / engine.camera.zoom;

      if (
        Math.hypot(
          touch.clientX - touchStartRef.current.x,
          touch.clientY - touchStartRef.current.y
        ) > 6
      ) {
        touchStartRef.current.moved = true;
      }

      engine.camera.x -= dx;
      engine.camera.y -= dy;
      engine.camera.targetX = engine.camera.x;
      engine.camera.targetY = engine.camera.y;

      touchStartRef.current.x = touch.clientX;
      touchStartRef.current.y = touch.clientY;
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const newDist = Math.hypot(dx, dy);

      if (touchStartRef.current.dist > 0) {
        const factor = newDist / touchStartRef.current.dist;
        const newZoom = Math.max(
          engine.camera.minZoom,
          Math.min(3.5, engine.camera.targetZoom * factor)
        );
        engine.camera.targetZoom = newZoom;
        engine.camera.zoom = newZoom;
      }
      touchStartRef.current.dist = newDist;
      touchStartRef.current.moved = true;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current.moved && containerRef.current && e.changedTouches.length > 0) {
      const rect = containerRef.current.getBoundingClientRect();
      const touch = e.changedTouches[0];
      handleInspectAtPoint(touch.clientX - rect.left, touch.clientY - rect.top);
    }
  };

  const handleZoomIn = () => {
    engine.camera.targetZoom = Math.min(3.5, engine.camera.targetZoom * 1.3);
  };

  const handleZoomOut = () => {
    engine.camera.targetZoom = Math.max(engine.camera.minZoom, engine.camera.targetZoom * 0.75);
  };

  const handleResetCamera = () => {
    autoFitCamera();
  };

  const toggleCameraJumps = () => {
    const next = !allowCameraJumps;
    setAllowCameraJumpsState(next);
    engine.setAllowCameraJumps(next);
    if (!next) {
      autoFitCamera();
    }
  };

  const cycleTimeOfDay = () => {
    const sequence: TimeOfDay[] = ['day', 'golden_hour', 'night', 'emergency'];
    const currentIdx = sequence.indexOf(timeOfDay);
    const nextTime = sequence[(currentIdx + 1) % sequence.length];
    setTimeOfDayState(nextTime);
    lightingEngine.setTimeOfDay(nextTime);
    if (nextTime === 'emergency') {
      soundEngine.playSfx('fire_alarm', 0.4);
    }
  };

  const triggerThrowPlane = () => {
    const jimState = engine.characterStates.get('jim');
    const dwightState = engine.characterStates.get('dwight');
    const sx = jimState ? jimState.x : 350;
    const sy = jimState ? jimState.y : 420;
    const tx = dwightState ? dwightState.x : 350;
    const ty = dwightState ? dwightState.y : 540;

    particleSystem.throwPaperAirplane(sx, sy, tx, ty);
    soundEngine.playSfx('stapler_click', 0.5);
  };

  const triggerCoffeeSpill = () => {
    const michael = engine.characterStates.get('michael');
    const sx = michael ? michael.x : 400;
    const sy = michael ? michael.y : 400;
    particleSystem.spillCoffee(sx, sy + 6);
    engine.camera.shake(0.25, 4);
    soundEngine.playSfx('glass_shatter', 0.6);
  };

  const toggleWaypoints = () => {
    const next = !showWaypoints;
    setShowWaypoints(next);
    engine.showWaypoints = next;
  };

  const toggleNameTags = () => {
    const next = !showNameTags;
    setShowNameTags(next);
    engine.showNameTags = next;
  };

  return (
    <div
      ref={containerRef}
      className="relative flex-1 w-full h-full overflow-hidden bg-[#0c1017] cursor-grab active:cursor-grabbing select-none touch-none"
      style={{ touchAction: 'none' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <canvas ref={canvasRef} className="block w-full h-full touch-none" />

      {/* CRT Scanline Overlay */}
      {crtEffect && <div className="crt-overlay" />}

      {/* Floating Viewport Controls */}
      <div className="absolute top-3 right-3 flex flex-col gap-1 z-10 bg-[#131b26]/90 p-1 rounded-lg border border-[#2a374a] shadow-xl backdrop-blur-md">
        <button
          onClick={handleZoomIn}
          className="p-2 bg-[#1c2738] active:bg-amber-600 hover:bg-amber-600 rounded text-slate-200 hover:text-white transition-colors"
          title="Zoom In (+)"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2 bg-[#1c2738] active:bg-amber-600 hover:bg-amber-600 rounded text-slate-200 hover:text-white transition-colors"
          title="Zoom Out (-)"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetCamera}
          className="p-2 bg-[#1c2738] active:bg-amber-600 hover:bg-amber-600 rounded text-slate-200 hover:text-white transition-colors"
          title="Fit to Screen (Center Office)"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        <div className="h-[1px] bg-[#2a374a] my-0.5" />

        {/* Time of Day Cycle Button */}
        <button
          onClick={cycleTimeOfDay}
          className={`p-2 rounded transition-colors ${
            timeOfDay === 'day'
              ? 'bg-amber-500 text-slate-950'
              : timeOfDay === 'golden_hour'
              ? 'bg-orange-600 text-white'
              : timeOfDay === 'night'
              ? 'bg-indigo-900 text-indigo-200'
              : 'bg-red-700 text-white animate-pulse'
          }`}
          title={`Lighting: ${timeOfDay.toUpperCase()} (Click to cycle)`}
        >
          {timeOfDay === 'day' ? (
            <Sun className="w-4 h-4" />
          ) : timeOfDay === 'golden_hour' ? (
            <Sunset className="w-4 h-4" />
          ) : timeOfDay === 'night' ? (
            <Moon className="w-4 h-4" />
          ) : (
            <Flame className="w-4 h-4" />
          )}
        </button>

        {/* Paper Airplane FX Button */}
        <button
          onClick={triggerThrowPlane}
          className="p-2 bg-[#1c2738] hover:bg-cyan-600 rounded text-slate-300 hover:text-white transition-colors"
          title="Throw Paper Airplane (Jim -> Dwight)"
        >
          <Send className="w-4 h-4 text-cyan-400" />
        </button>

        {/* Coffee Spill FX Button */}
        <button
          onClick={triggerCoffeeSpill}
          className="p-2 bg-[#1c2738] hover:bg-amber-700 rounded text-slate-300 hover:text-white transition-colors"
          title="Spill Coffee on Floor!"
        >
          <Coffee className="w-4 h-4 text-amber-500" />
        </button>

        <div className="h-[1px] bg-[#2a374a] my-0.5" />

        {/* Camera Jumps Toggle Button */}
        <button
          onClick={toggleCameraJumps}
          className={`p-2 rounded transition-colors ${
            allowCameraJumps ? 'bg-cyan-600 text-white' : 'bg-[#1c2738] text-slate-400'
          }`}
          title={
            allowCameraJumps
              ? 'Camera Jumps: ACTIVE (Auto-follow dialogue & scene cues)'
              : 'Camera Jumps: DISABLED (Static overview locked)'
          }
        >
          {allowCameraJumps ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
        </button>

        <button
          onClick={toggleNameTags}
          className={`p-2 rounded transition-colors ${
            showNameTags ? 'bg-amber-600 text-white' : 'bg-[#1c2738] text-slate-400'
          }`}
          title="Toggle Character Names"
        >
          <Tag className="w-4 h-4" />
        </button>
        <button
          onClick={toggleWaypoints}
          className={`p-2 rounded transition-colors ${
            showWaypoints ? 'bg-purple-600 text-white' : 'bg-[#1c2738] text-slate-400'
          }`}
          title="Toggle Waypoint Markers"
        >
          <MapPin className="w-4 h-4" />
        </button>
        <button
          onClick={() => setCrtEffect(!crtEffect)}
          className={`p-2 rounded transition-colors ${
            crtEffect ? 'bg-emerald-700 text-white' : 'bg-[#1c2738] text-slate-400'
          }`}
          title="Toggle CRT Retro Shader"
        >
          <Eye className="w-4 h-4" />
        </button>
      </div>

      {/* Floating Selected Entity Card */}
      {selectedEntity && (
        <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-sm z-10 bg-[#131b26]/95 border-2 border-amber-500/80 rounded-lg p-3 shadow-2xl backdrop-blur-md text-white animate-in fade-in slide-in-from-bottom-2">
          {selectedEntity.type === 'character' ? (
            <div>
              <div className="flex items-center justify-between gap-2 border-b border-[#2a374a] pb-1.5 mb-2">
                <div>
                  <h4 className="pixel-font text-xs text-amber-400 font-bold">
                    {selectedEntity.data.name}
                  </h4>
                  <p className="text-[11px] text-blue-300 font-mono">{selectedEntity.data.role}</p>
                </div>
                <button
                  onClick={() => setSelectedEntity(null)}
                  className="text-slate-400 hover:text-white text-xs px-2 py-1 bg-[#1e293b] rounded"
                >
                  ✕
                </button>
              </div>

              {selectedEntity.state?.heldItem && (
                <div className="mb-2 px-2 py-1 bg-amber-950/80 border border-amber-500/50 rounded flex items-center gap-1.5 text-amber-300 text-[11px] font-mono">
                  <span>Holding:</span>
                  <strong className="uppercase font-bold">{selectedEntity.state.heldItem}</strong>
                </div>
              )}

              <p className="text-xs italic text-slate-300 mb-2 typewriter-font text-[14px]">
                "{selectedEntity.data.signatureQuotes[0]}"
              </p>
              <div className="flex flex-wrap gap-1">
                {selectedEntity.data.personalityTraits.map((t: string, i: number) => (
                  <span
                    key={i}
                    className="text-[10px] px-1.5 py-0.5 bg-[#1e293b] text-amber-300 rounded font-mono"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between gap-2 border-b border-[#2a374a] pb-1.5 mb-2">
                <h4 className="pixel-font text-xs text-amber-400">
                  {selectedEntity.data.name || selectedEntity.data.type}
                </h4>
                <button
                  onClick={() => setSelectedEntity(null)}
                  className="text-slate-400 hover:text-white text-xs px-2 py-1 bg-[#1e293b] rounded"
                >
                  ✕
                </button>
              </div>
              <p className="text-[11px] text-slate-300 font-mono">
                Type: {selectedEntity.data.type}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
