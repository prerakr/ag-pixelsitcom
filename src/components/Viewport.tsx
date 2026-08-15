import React, { useEffect, useRef, useState } from 'react';
import { VisualizerEngine } from '../engine/CanvasRenderer';
import { ZoomIn, ZoomOut, Maximize2, Video, Eye, MapPin, Tag } from 'lucide-react';
import { CharacterDefinition } from '../types/character';
import { soundEngine } from '../engine/SoundEngine';

interface ViewportProps {
  engine: VisualizerEngine;
  onInspectCharacter?: (char: CharacterDefinition) => void;
}

export const Viewport: React.FC<ViewportProps> = ({ engine, onInspectCharacter }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [camMode, setCamMode] = useState<'auto' | 'free'>('auto');
  const [showWaypoints, setShowWaypoints] = useState(false);
  const [showNameTags, setShowNameTags] = useState(true);
  const [crtEffect, setCrtEffect] = useState(true);
  const [selectedEntity, setSelectedEntity] = useState<any | null>(null);

  // Resize canvas when container size changes
  useEffect(() => {
    const handleResize = () => {
      if (!canvasRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      canvasRef.current.width = rect.width * dpr;
      canvasRef.current.height = rect.height * dpr;
      canvasRef.current.style.width = `${rect.width}px`;
      canvasRef.current.style.height = `${rect.height}px`;

      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
        ctx.imageSmoothingEnabled = false;
      }
    };

    handleResize();
    const observer = new ResizeObserver(handleResize);
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
  }, [engine]);

  // Mouse drag to pan
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      // Left click
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

    if (camMode !== 'free') {
      setCamMode('free');
      engine.cameraMode = 'free';
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    const newZoom = Math.max(0.5, Math.min(3.0, engine.camera.targetZoom * zoomFactor));
    engine.camera.targetZoom = newZoom;
  };

  // Click on Canvas to inspect characters or props
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    const world = engine.camera.screenToWorld(screenX, screenY, rect.width, rect.height);
    const tileSize = engine.setting.tileSize;

    // Check characters clicked
    for (const [id, state] of engine.characterStates.entries()) {
      const dist = Math.hypot(state.x - world.x, state.y - world.y);
      if (dist < 24) {
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

  const handleZoomIn = () => {
    engine.camera.targetZoom = Math.min(3.0, engine.camera.targetZoom * 1.25);
  };

  const handleZoomOut = () => {
    engine.camera.targetZoom = Math.max(0.5, engine.camera.targetZoom * 0.8);
  };

  const handleResetCamera = () => {
    engine.camera.setTarget(
      engine.setting.defaultCamera.x,
      engine.setting.defaultCamera.y,
      engine.setting.defaultCamera.zoom
    );
    setCamMode('auto');
    engine.cameraMode = 'auto';
  };

  const toggleCamMode = () => {
    const next = camMode === 'auto' ? 'free' : 'auto';
    setCamMode(next);
    engine.cameraMode = next;
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
      className="relative flex-1 w-full h-full overflow-hidden bg-[#0c1017] cursor-grab active:cursor-grabbing select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      onClick={handleCanvasClick}
    >
      <canvas ref={canvasRef} className="block w-full h-full" />

      {/* CRT Scanline Overlay */}
      {crtEffect && <div className="crt-overlay" />}

      {/* Floating Viewport Overlay Controls */}
      <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-10 bg-[#131b26]/90 p-1.5 rounded-lg border border-[#2a374a] shadow-lg backdrop-blur-sm">
        <button
          onClick={handleZoomIn}
          className="p-2 bg-[#1c2738] hover:bg-amber-600 rounded text-slate-200 hover:text-white transition-colors"
          title="Zoom In (+)"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2 bg-[#1c2738] hover:bg-amber-600 rounded text-slate-200 hover:text-white transition-colors"
          title="Zoom Out (-)"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetCamera}
          className="p-2 bg-[#1c2738] hover:bg-amber-600 rounded text-slate-200 hover:text-white transition-colors"
          title="Reset Camera Center"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        <div className="h-[1px] bg-[#2a374a] my-0.5" />

        <button
          onClick={toggleCamMode}
          className={`p-2 rounded transition-colors ${camMode === 'auto' ? 'bg-blue-600 text-white' : 'bg-[#1c2738] text-slate-400'}`}
          title={camMode === 'auto' ? 'Auto-Director Tracking: ON' : 'Free Camera Pan: ON'}
        >
          <Video className="w-4 h-4" />
        </button>
        <button
          onClick={toggleNameTags}
          className={`p-2 rounded transition-colors ${showNameTags ? 'bg-amber-600 text-white' : 'bg-[#1c2738] text-slate-400'}`}
          title="Toggle Character Name Badges"
        >
          <Tag className="w-4 h-4" />
        </button>
        <button
          onClick={toggleWaypoints}
          className={`p-2 rounded transition-colors ${showWaypoints ? 'bg-purple-600 text-white' : 'bg-[#1c2738] text-slate-400'}`}
          title="Toggle Navigation Waypoint Markers"
        >
          <MapPin className="w-4 h-4" />
        </button>
        <button
          onClick={() => setCrtEffect(!crtEffect)}
          className={`p-2 rounded transition-colors ${crtEffect ? 'bg-emerald-700 text-white' : 'bg-[#1c2738] text-slate-400'}`}
          title="Toggle CRT Scanline Shader"
        >
          <Eye className="w-4 h-4" />
        </button>
      </div>

      {/* Floating Selected Entity Card */}
      {selectedEntity && (
        <div className="absolute bottom-4 left-4 z-10 max-w-sm bg-[#131b26]/95 border-2 border-amber-500/80 rounded-lg p-3 shadow-2xl backdrop-blur-md text-white animate-in fade-in slide-in-from-bottom-2">
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
                  className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5"
                >
                  ✕
                </button>
              </div>
              <p className="text-xs italic text-slate-300 mb-2 typewriter-font text-[14px]">
                "{selectedEntity.data.signatureQuotes[0]}"
              </p>
              <div className="flex flex-wrap gap-1">
                {selectedEntity.data.personalityTraits.map((t: string, i: number) => (
                  <span key={i} className="text-[10px] px-1.5 py-0.5 bg-[#1e293b] text-amber-300 rounded font-mono">
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
                  className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5"
                >
                  ✕
                </button>
              </div>
              <p className="text-[11px] text-slate-300 font-mono">
                Type: {selectedEntity.data.type}
              </p>
              <p className="text-[10px] text-slate-400 font-mono">
                Grid: [{selectedEntity.data.x}, {selectedEntity.data.y}]
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
