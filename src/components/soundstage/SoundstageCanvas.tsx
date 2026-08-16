import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  SettingDefinition,
  PropInstance,
  PropType,
  TileType,
  Waypoint,
  RoomZone,
} from '../../types/environment';
import { SoundstageTool } from './SoundstageToolbar';
import { SnapLevel } from './SoundstageHeader';
import { SelectedItem } from './SoundstageInspector';
import { TileRenderer } from '../../engine/TileRenderer';
import { CharacterRenderer } from '../../engine/CharacterRenderer';
import { CharacterDefinition, CharacterRuntimeState } from '../../types/character';
import { soundEngine } from '../../engine/SoundEngine';
import { SoundstagePrefab } from './SoundstagePrefabs';
import { Direction } from '../../types/script';

interface SoundstageCanvasProps {
  setting: SettingDefinition;
  onUpdateSetting: (updater: (prev: SettingDefinition) => SettingDefinition) => void;
  activeTool: SoundstageTool;
  selectedTileType: TileType;
  selectedPropType: PropType;
  selectedPrefab: SoundstagePrefab | null;
  onClearPrefab: () => void;
  selectedCharacterSpawn: string;
  snapLevel: SnapLevel;
  showGrid: boolean;
  selectedItem: SelectedItem;
  onSelectItem: (item: SelectedItem) => void;
  characters: CharacterDefinition[];
  zoom: number;
  onZoomChange: (z: number) => void;
}

export const SoundstageCanvas: React.FC<SoundstageCanvasProps> = ({
  setting,
  onUpdateSetting,
  activeTool,
  selectedTileType,
  selectedPropType,
  selectedPrefab,
  onClearPrefab,
  selectedCharacterSpawn,
  snapLevel,
  showGrid,
  selectedItem,
  onSelectItem,
  characters,
  zoom,
  onZoomChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Camera Pan State
  const [camera, setCamera] = useState<{ x: number; y: number }>({
    x: (setting.gridWidth * setting.tileSize) / 2,
    y: (setting.gridHeight * setting.tileSize) / 2,
  });

  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Mouse Grid Coordinate Hover
  const [hoverGrid, setHoverGrid] = useState<{ x: number; y: number } | null>(null);

  // Interactive Dragging / Painting State
  const [dragAction, setDragAction] = useState<{
    type: 'move_prop' | 'resize_prop' | 'paint_tile' | 'rect_tile' | 'draw_zone' | 'move_waypoint' | 'move_spawn';
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    targetIndex?: number;
    targetId?: string;
    handle?: 'nw' | 'ne' | 'se' | 'sw';
    initialPropState?: PropInstance;
  } | null>(null);

  // Synchronized Refs to ensure 60fps render loop never stutters during state updates or mouse events
  const cameraRef = useRef(camera);
  cameraRef.current = camera;


  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;

  const settingRef = useRef(setting);
  settingRef.current = setting;

  const showGridRef = useRef(showGrid);
  showGridRef.current = showGrid;

  const selectedItemRef = useRef(selectedItem);
  selectedItemRef.current = selectedItem;

  const hoverGridRef = useRef(hoverGrid);
  hoverGridRef.current = hoverGrid;

  const dragActionRef = useRef(dragAction);
  dragActionRef.current = dragAction;

  const activeToolRef = useRef(activeTool);
  activeToolRef.current = activeTool;

  const isPanningRef = useRef(isPanning);
  isPanningRef.current = isPanning;

  // Director Sandbox Runtime State (Managed in Ref for smooth 60fps physics)
  const directorActorRef = useRef<{
    character: CharacterDefinition;
    state: CharacterRuntimeState;
    target: { x: number; y: number } | null;
    speechBubble?: { text: string; timer: number };
  } | null>(null);

  // Initialize Director Actor when entering Director mode
  useEffect(() => {
    if (activeTool === 'director' && characters.length > 0) {
      if (!directorActorRef.current) {
        const char = characters[0];
        const startX = (setting.gridWidth * setting.tileSize) / 2;
        const startY = (setting.gridHeight * setting.tileSize) / 2;
        directorActorRef.current = {
          character: char,
          state: {
            id: char.id,
            x: startX,
            y: startY,
            targetX: startX,
            targetY: startY,
            facing: 'down',
            isMoving: false,
            speed: 90,
            animFrame: 0,
            animTimer: 0,
            state: 'idle',
            isSitting: false,
          },
          target: null,
        };
      }
    }
  }, [activeTool, characters, setting]);




  // Coordinate Conversion Helpers
  const screenToWorld = useCallback(
    (screenX: number, screenY: number) => {
      if (!canvasRef.current) return { x: 0, y: 0 };
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseLogicalX = screenX - rect.left;
      const mouseLogicalY = screenY - rect.top;
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const worldX = (mouseLogicalX - cx) / zoom + camera.x;
      const worldY = (mouseLogicalY - cy) / zoom + camera.y;
      return { x: worldX, y: worldY };
    },
    [camera, zoom]
  );


  const snapCoord = useCallback(
    (val: number, snap: SnapLevel): number => {
      if (snap === 0) return Math.round(val * 100) / 100;
      return Math.round(val / snap) * snap;
    },
    []
  );

  // Flood fill algorithm for bucket tool
  const executeBucketFill = useCallback(
    (startX: number, startY: number, newTile: TileType) => {
      const W = setting.gridWidth;
      const H = setting.gridHeight;
      if (startX < 0 || startX >= W || startY < 0 || startY >= H) return;

      const targetKey = `${startX},${startY}`;
      const targetTile = setting.tiles[targetKey] || 'floor_carpet_grey';
      if (targetTile === newTile) return;

      const newTiles = { ...setting.tiles };
      const queue: Array<[number, number]> = [[startX, startY]];
      const visited = new Set<string>();

      while (queue.length > 0) {
        const [x, y] = queue.pop()!;
        const key = `${x},${y}`;
        if (visited.has(key)) continue;
        visited.add(key);

        const currentTile = newTiles[key] || 'floor_carpet_grey';
        if (currentTile === targetTile) {
          newTiles[key] = newTile;

          if (x > 0) queue.push([x - 1, y]);
          if (x < W - 1) queue.push([x + 1, y]);
          if (y > 0) queue.push([x, y - 1]);
          if (y < H - 1) queue.push([x, y + 1]);
        }
      }

      onUpdateSetting((prev) => ({ ...prev, tiles: newTiles }));
      soundEngine.playSfx('typewriter', 0.5);
    },
    [setting, onUpdateSetting]
  );

  // Main Canvas Render Loop (Continuous 60fps decoupled from React renders)
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const render = (now: number) => {
      // Clamped delta-time prevents frame stutter during rapid mouse movement or background lag
      const dt = Math.min(0.08, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.imageSmoothingEnabled = false;

      // Extract current values from synchronized refs
      const setting = settingRef.current;
      const camera = cameraRef.current;
      const zoom = zoomRef.current;
      const activeTool = activeToolRef.current;
      const selectedItem = selectedItemRef.current;
      const dragAction = dragActionRef.current;
      const hoverGrid = hoverGridRef.current;
      const showGrid = showGridRef.current;
      const isPanning = isPanningRef.current;

      // Update director actor physics
      const actor = directorActorRef.current;
      if (actor && actor.target) {
        const dx = actor.target.x - actor.state.x;
        const dy = actor.target.y - actor.state.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 4) {
          const speed = 120 * dt;
          actor.state.x += (dx / dist) * speed;
          actor.state.y += (dy / dist) * speed;
          actor.state.isMoving = true;
          actor.state.state = 'walking';
          actor.state.animTimer = (actor.state.animTimer || 0) + dt;
          if (actor.state.animTimer > 0.14) {
            actor.state.animTimer = 0;
            actor.state.animFrame = (actor.state.animFrame + 1) % 4;
          }

          if (Math.abs(dx) > Math.abs(dy)) {
            actor.state.facing = dx > 0 ? 'right' : 'left';
          } else {
            actor.state.facing = dy > 0 ? 'down' : 'up';
          }
        } else {
          actor.state.isMoving = false;
          actor.state.state = 'idle';
          actor.state.animFrame = 0;
          actor.target = null;
        }
      }

      if (actor && actor.speechBubble) {
        actor.speechBubble.timer -= dt;
        if (actor.speechBubble.timer <= 0) {
          actor.speechBubble = undefined;
        }
      }

      // Clear Canvas in physical pixels
      ctx.fillStyle = '#0a0e14';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      try {
        // High-DPI physical-to-logical coordinate normalization
        const dpr = window.devicePixelRatio || 1;
        ctx.scale(dpr, dpr);
        ctx.imageSmoothingEnabled = false;

        // Camera Transformation in logical pixels
        const rect = canvas.getBoundingClientRect();
        const cx = rect.width / 2;
        const cy = rect.height / 2;
        ctx.translate(cx, cy);
        ctx.scale(zoom, zoom);
        ctx.translate(-camera.x, -camera.y);


        const tileSize = setting.tileSize;
        const worldW = setting.gridWidth * tileSize;
        const worldH = setting.gridHeight * tileSize;

        // Draw Environment Background
        ctx.fillStyle = setting.backgroundColor || '#121824';
        ctx.fillRect(0, 0, worldW, worldH);


      // 1. Draw Floor & Wall Tiles
      for (let x = 0; x < setting.gridWidth; x++) {
        for (let y = 0; y < setting.gridHeight; y++) {
          const key = `${x},${y}`;
          const tile = setting.tiles[key] || 'floor_carpet_grey';
          TileRenderer.drawTile(ctx, tile, x * tileSize, y * tileSize, tileSize);
        }
      }

      // Preview rectangle fill if dragging
      if (dragAction?.type === 'rect_tile') {
        const x1 = Math.min(dragAction.startX, dragAction.currentX);
        const x2 = Math.max(dragAction.startX, dragAction.currentX);
        const y1 = Math.min(dragAction.startY, dragAction.currentY);
        const y2 = Math.max(dragAction.startY, dragAction.currentY);

        ctx.fillStyle = 'rgba(245, 158, 11, 0.4)';
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2 / zoom;
        const rx = x1 * tileSize;
        const ry = y1 * tileSize;
        const rw = (x2 - x1 + 1) * tileSize;
        const rh = (y2 - y1 + 1) * tileSize;
        ctx.fillRect(rx, ry, rw, rh);
        ctx.strokeRect(rx, ry, rw, rh);
      }

      // 2. Draw Room Zones
      if (setting.zones) {
        setting.zones.forEach((zone, zIdx) => {
          const zx = zone.x * tileSize;
          const zy = zone.y * tileSize;
          const zw = zone.w * tileSize;
          const zh = zone.h * tileSize;

          ctx.save();
          ctx.fillStyle = zone.color ? `${zone.color}22` : 'rgba(56, 189, 248, 0.12)';
          ctx.fillRect(zx, zy, zw, zh);
          ctx.strokeStyle = zone.color || '#38bdf8';
          ctx.lineWidth = 2 / zoom;
          ctx.setLineDash([6, 4]);
          ctx.strokeRect(zx, zy, zw, zh);

          // Zone Tag Label
          ctx.fillStyle = zone.color || '#38bdf8';
          ctx.font = 'bold 11px monospace';
          ctx.fillText(`[${zone.name}]`, zx + 6, zy + 14);

          // Zone Selection Outline
          if (selectedItem?.type === 'zone' && selectedItem.index === zIdx) {
            ctx.setLineDash([]);
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 3 / zoom;
            ctx.strokeRect(zx - 2, zy - 2, zw + 4, zh + 4);
          }
          ctx.restore();
        });
      }

      // 3. Draw Grid Lines
      if (showGrid) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1 / zoom;
        ctx.beginPath();
        for (let x = 0; x <= setting.gridWidth; x++) {
          ctx.moveTo(x * tileSize, 0);
          ctx.lineTo(x * tileSize, worldH);
        }
        for (let y = 0; y <= setting.gridHeight; y++) {
          ctx.moveTo(0, y * tileSize);
          ctx.lineTo(worldW, y * tileSize);
        }
        ctx.stroke();
      }

      // 4. Draw Props (Depth Sorted by Y Coordinate)
      const sortedProps = [...setting.props].sort((a, b) => {
        const az = (a.zIndexOffset || 0) * 1000 + (a.y + (a.height || 1));
        const bz = (b.zIndexOffset || 0) * 1000 + (b.y + (b.height || 1));
        return az - bz;
      });

      sortedProps.forEach((prop) => {
        TileRenderer.drawProp(ctx, prop, tileSize, prop.state, now);

        // Draw Selection Outline & Handles
        const pIdx = setting.props.indexOf(prop);
        if (selectedItem?.type === 'prop' && selectedItem.index === pIdx) {
          const px = prop.x * tileSize;
          const py = prop.y * tileSize;
          const pw = (prop.width || 1) * tileSize;
          const ph = (prop.height || 1) * tileSize;

          ctx.save();
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 2 / zoom;
          ctx.strokeRect(px, py, pw, ph);

          // Resize Corner Handles
          const handleSize = 7 / zoom;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(px - handleSize / 2, py - handleSize / 2, handleSize, handleSize);
          ctx.fillRect(px + pw - handleSize / 2, py - handleSize / 2, handleSize, handleSize);
          ctx.fillRect(px + pw - handleSize / 2, py + ph - handleSize / 2, handleSize, handleSize);
          ctx.fillRect(px - handleSize / 2, py + ph - handleSize / 2, handleSize, handleSize);
          ctx.restore();
        }
      });

      // 5. Draw Waypoints & Routes
      if (setting.waypoints) {
        Object.values(setting.waypoints).forEach((wp) => {
          const wx = wp.x * tileSize;
          const wy = wp.y * tileSize;
          const isSelected = selectedItem?.type === 'waypoint' && selectedItem.id === wp.id;

          ctx.save();
          // Waypoint Pin Diamond
          ctx.fillStyle = isSelected ? '#f59e0b' : '#ec4899';
          ctx.beginPath();
          ctx.moveTo(wx, wy - 8 / zoom);
          ctx.lineTo(wx + 8 / zoom, wy);
          ctx.lineTo(wx, wy + 8 / zoom);
          ctx.lineTo(wx - 8 / zoom, wy);
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5 / zoom;
          ctx.stroke();

          // Facing Direction Line
          const angle =
            wp.facing === 'left'
              ? Math.PI
              : wp.facing === 'right'
              ? 0
              : wp.facing === 'up'
              ? -Math.PI / 2
              : Math.PI / 2;
          ctx.beginPath();
          ctx.moveTo(wx, wy);
          ctx.lineTo(wx + Math.cos(angle) * (14 / zoom), wy + Math.sin(angle) * (14 / zoom));
          ctx.strokeStyle = isSelected ? '#f59e0b' : '#f472b6';
          ctx.lineWidth = 2 / zoom;
          ctx.stroke();

          // Waypoint Label
          ctx.fillStyle = isSelected ? '#fef08a' : '#fbcfe8';
          ctx.font = '10px monospace';
          ctx.fillText(wp.name, wx + 10 / zoom, wy + 4 / zoom);
          ctx.restore();
        });
      }

      // 6. Draw Spawn Points
      if (setting.spawnPoints) {
        Object.values(setting.spawnPoints).forEach((sp) => {
          const sx = sp.x * tileSize;
          const sy = sp.y * tileSize;
          const isSelected = selectedItem?.type === 'spawn' && selectedItem.id === sp.id;

          ctx.save();
          ctx.fillStyle = isSelected ? '#f59e0b' : '#eab308';
          ctx.beginPath();
          ctx.arc(sx, sy, 7 / zoom, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5 / zoom;
          ctx.stroke();

          ctx.fillStyle = '#fef08a';
          ctx.font = '10px monospace';
          ctx.fillText(`Spawn: ${sp.name}`, sx + 9 / zoom, sy + 3 / zoom);
          ctx.restore();
        });
      }

      // 7. Draw Director Actor (in Sandbox Mode)
      if (activeTool === 'director' && directorActorRef.current) {
        const actor = directorActorRef.current;
        CharacterRenderer.drawCharacter(
          ctx,
          actor.character,
          actor.state,
          true,
          now
        );

        // Director speech bubble preview
        if (actor.speechBubble) {
          ctx.save();
          ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 1.5 / zoom;
          const bx = actor.state.x - 50;
          const by = actor.state.y - 45;
          ctx.fillRect(bx, by, 100, 22);
          ctx.strokeRect(bx, by, 100, 22);
          ctx.fillStyle = '#ffffff';
          ctx.font = '10px monospace';
          ctx.fillText(actor.speechBubble.text, bx + 6, by + 14);
          ctx.restore();
        }
      }

      // 8. Hover Grid Marker
      if (hoverGrid && !isPanning) {
        const hx = hoverGrid.x * tileSize;
        const hy = hoverGrid.y * tileSize;
        ctx.strokeStyle = activeTool.startsWith('tile') ? '#f59e0b' : 'rgba(56, 189, 248, 0.8)';
        ctx.lineWidth = 1.5 / zoom;
        ctx.strokeRect(hx, hy, tileSize, tileSize);
      }
    } finally {
      ctx.restore();
    }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, []);


// Resize canvas to fill container
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

  const observer = new ResizeObserver(() => {
    handleResize();
  });
  if (containerRef.current) {
    observer.observe(containerRef.current);
  }
  window.addEventListener('resize', handleResize);
  return () => {
    observer.disconnect();
    window.removeEventListener('resize', handleResize);
  };
}, []);

// --- MOUSE HANDLERS ---

const handleMouseDown = (e: React.MouseEvent) => {
  // Middle click or Space+Click triggers pan
  if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
    setIsPanning(true);
    setPanStart({ x: e.clientX, y: e.clientY });
    return;
  }

  if (e.button !== 0) return;

  const world = screenToWorld(e.clientX, e.clientY);
  const tileSize = setting.tileSize;
  const gridX = world.x / tileSize;
  const gridY = world.y / tileSize;
  const cellX = Math.floor(gridX);
  const cellY = Math.floor(gridY);

  // 1. DIRECTOR MODE ACTIONS
  if (activeTool === 'director') {
    const actor = directorActorRef.current;
    if (actor) {
      // Check if user clicked directly on the actor to trigger a funny quote bubble
      const distToActor = Math.hypot(actor.state.x - world.x, actor.state.y - world.y);
      if (distToActor < 28) {
        const quotes = actor.character.signatureQuotes;
        const quote = quotes && quotes.length > 0 ? quotes[Math.floor(Math.random() * quotes.length)] : "That's what she said!";
        actor.speechBubble = { text: quote, timer: 3.5 };
        actor.state.currentEmote = { icon: 'laugh', timer: 0, maxDuration: 1800 };
        soundEngine.playSfx('laugh_giggle', 0.5);
        return;
      }

      // Walk to clicked location
      actor.target = { x: world.x, y: world.y };
      soundEngine.playSfx('typewriter', 0.3);
    }
    return;
  }


    // 2. TILE BRUSH / ERASER TOOL
    if (activeTool === 'tile_brush' || activeTool === 'tile_eraser') {
      const tileToApply = activeTool === 'tile_eraser' ? 'floor_carpet_grey' : selectedTileType;
      setDragAction({
        type: 'paint_tile',
        startX: cellX,
        startY: cellY,
        currentX: cellX,
        currentY: cellY,
      });

      onUpdateSetting((prev) => {
        const nextTiles = { ...prev.tiles };
        nextTiles[`${cellX},${cellY}`] = tileToApply;
        return { ...prev, tiles: nextTiles };
      });
      soundEngine.playSfx('stapler_click', 0.3);
      return;
    }

    // 3. TILE RECTANGLE TOOL
    if (activeTool === 'tile_rect') {
      setDragAction({
        type: 'rect_tile',
        startX: cellX,
        startY: cellY,
        currentX: cellX,
        currentY: cellY,
      });
      return;
    }

    // 4. TILE BUCKET FILL TOOL
    if (activeTool === 'tile_bucket') {
      executeBucketFill(cellX, cellY, selectedTileType);
      return;
    }

    // 5. PROP STAMP TOOL
    if (activeTool === 'prop_stamp') {
      const snappedX = snapCoord(gridX, snapLevel);
      const snappedY = snapCoord(gridY, snapLevel);
      const newProp: PropInstance = {
        id: `prop_${selectedPropType}_${Date.now().toString(36)}`,
        type: selectedPropType,
        x: snappedX,
        y: snappedY,
        width: 2.0,
        height: 2.0,
        interactive: true,
        facing: 'down',
      };

      onUpdateSetting((prev) => ({
        ...prev,
        props: [...prev.props, newProp],
      }));
      onSelectItem({ type: 'prop', index: setting.props.length, data: newProp });
      soundEngine.playSfx('stapler_click', 0.5);
      return;
    }

    // 6. 1-CLICK PREFAB STAMP
    if (selectedPrefab) {
      const snappedX = snapCoord(gridX, snapLevel);
      const snappedY = snapCoord(gridY, snapLevel);
      const stampedProps: PropInstance[] = selectedPrefab.props.map((p, idx) => ({
        id: `prop_${p.type}_${Date.now().toString(36)}_${idx}`,
        type: p.type,
        x: snappedX + p.relX,
        y: snappedY + p.relY,
        width: p.width,
        height: p.height,
        interactive: p.interactive,
        facing: p.facing,
        name: p.nameSuffix ? `${selectedPrefab.name} ${p.nameSuffix}` : undefined,
      }));

      onUpdateSetting((prev) => ({
        ...prev,
        props: [...prev.props, ...stampedProps],
      }));
      onClearPrefab();
      soundEngine.playSfx('cheer', 0.4);
      return;
    }

    // 7. WAYPOINT PLACER
    if (activeTool === 'waypoint') {
      const snappedX = snapCoord(gridX, 0.5);
      const snappedY = snapCoord(gridY, 0.5);
      const wpId = `wp_${Date.now().toString(36)}`;
      const newWp: Waypoint = {
        id: wpId,
        name: `Waypoint ${Object.keys(setting.waypoints || {}).length + 1}`,
        x: snappedX,
        y: snappedY,
        facing: 'down',
      };

      onUpdateSetting((prev) => ({
        ...prev,
        waypoints: { ...prev.waypoints, [wpId]: newWp },
      }));
      onSelectItem({ type: 'waypoint', id: wpId, data: newWp });
      soundEngine.playSfx('stapler_click', 0.4);
      return;
    }

    // 8. SPAWN POINT PLACER
    if (activeTool === 'spawn') {
      const snappedX = snapCoord(gridX, 0.5);
      const snappedY = snapCoord(gridY, 0.5);
      const newSpawn: Waypoint = {
        id: selectedCharacterSpawn,
        name: `${selectedCharacterSpawn.toUpperCase()} Spawn`,
        x: snappedX,
        y: snappedY,
        facing: 'down',
      };

      onUpdateSetting((prev) => ({
        ...prev,
        spawnPoints: { ...prev.spawnPoints, [selectedCharacterSpawn]: newSpawn },
      }));
      onSelectItem({ type: 'spawn', id: selectedCharacterSpawn, data: newSpawn });
      soundEngine.playSfx('stapler_click', 0.4);
      return;
    }

    // 9. ROOM ZONE MARQUEE
    if (activeTool === 'zone') {
      setDragAction({
        type: 'draw_zone',
        startX: cellX,
        startY: cellY,
        currentX: cellX,
        currentY: cellY,
      });
      return;
    }

    // 10. SELECT & TRANSFORM TOOL
    if (activeTool === 'select') {
      // Check Waypoint Hits
      if (setting.waypoints) {
        for (const [id, wp] of Object.entries(setting.waypoints)) {
          const dist = Math.hypot(wp.x * tileSize - world.x, wp.y * tileSize - world.y);
          if (dist < 14) {
            onSelectItem({ type: 'waypoint', id, data: wp });
            setDragAction({
              type: 'move_waypoint',
              targetId: id,
              startX: wp.x,
              startY: wp.y,
              currentX: wp.x,
              currentY: wp.y,
            });
            soundEngine.playSfx('typewriter', 0.4);
            return;
          }
        }
      }

      // Check Spawn Hits
      if (setting.spawnPoints) {
        for (const [id, sp] of Object.entries(setting.spawnPoints)) {
          const dist = Math.hypot(sp.x * tileSize - world.x, sp.y * tileSize - world.y);
          if (dist < 14) {
            onSelectItem({ type: 'spawn', id, data: sp });
            setDragAction({
              type: 'move_spawn',
              targetId: id,
              startX: sp.x,
              startY: sp.y,
              currentX: sp.x,
              currentY: sp.y,
            });
            soundEngine.playSfx('typewriter', 0.4);
            return;
          }
        }
      }

      // Check Prop Hits (Topmost to Bottommost)
      for (let i = setting.props.length - 1; i >= 0; i--) {
        const prop = setting.props[i];
        const px = prop.x * tileSize;
        const py = prop.y * tileSize;
        const pw = (prop.width || 1) * tileSize;
        const ph = (prop.height || 1) * tileSize;

        if (world.x >= px && world.x <= px + pw && world.y >= py && world.y <= py + ph) {
          onSelectItem({ type: 'prop', index: i, data: prop });
          setDragAction({
            type: 'move_prop',
            targetIndex: i,
            startX: gridX - prop.x,
            startY: gridY - prop.y,
            currentX: prop.x,
            currentY: prop.y,
            initialPropState: { ...prop },
          });
          soundEngine.playSfx('stapler_click', 0.4);
          return;
        }
      }

      // Check Room Zone Hits
      if (setting.zones) {
        for (let i = setting.zones.length - 1; i >= 0; i--) {
          const z = setting.zones[i];
          if (cellX >= z.x && cellX < z.x + z.w && cellY >= z.y && cellY < z.y + z.h) {
            onSelectItem({ type: 'zone', index: i, data: z });
            soundEngine.playSfx('typewriter', 0.3);
            return;
          }
        }
      }

      // Empty click deselects
      onSelectItem(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      const dx = (e.clientX - panStart.x) / zoom;
      const dy = (e.clientY - panStart.y) / zoom;
      setCamera((prev) => ({ x: prev.x - dx, y: prev.y - dy }));
      setPanStart({ x: e.clientX, y: e.clientY });
      return;
    }

    const world = screenToWorld(e.clientX, e.clientY);
    const tileSize = setting.tileSize;
    const gridX = world.x / tileSize;
    const gridY = world.y / tileSize;
    const cellX = Math.floor(gridX);
    const cellY = Math.floor(gridY);
    hoverGridRef.current = { x: cellX, y: cellY };

    if (!hoverGrid || hoverGrid.x !== cellX || hoverGrid.y !== cellY) {
      setHoverGrid({ x: cellX, y: cellY });
    }



    if (!dragAction) return;

    // Continuous Tile Painting
    if (dragAction.type === 'paint_tile') {
      const tileToApply = activeTool === 'tile_eraser' ? 'floor_carpet_grey' : selectedTileType;
      onUpdateSetting((prev) => {
        const nextTiles = { ...prev.tiles };
        nextTiles[`${cellX},${cellY}`] = tileToApply;
        return { ...prev, tiles: nextTiles };
      });
    }

    // Drag Rectangle Tile Update
    if (dragAction.type === 'rect_tile' || dragAction.type === 'draw_zone') {
      setDragAction((prev) => (prev ? { ...prev, currentX: cellX, currentY: cellY } : null));
    }

    // Move Prop
    if (dragAction.type === 'move_prop' && dragAction.targetIndex !== undefined) {
      const rawX = gridX - dragAction.startX;
      const rawY = gridY - dragAction.startY;
      const snappedX = snapCoord(rawX, snapLevel);
      const snappedY = snapCoord(rawY, snapLevel);

      onUpdateSetting((prev) => {
        const nextProps = [...prev.props];
        nextProps[dragAction.targetIndex!] = {
          ...nextProps[dragAction.targetIndex!],
          x: snappedX,
          y: snappedY,
        };
        return { ...prev, props: nextProps };
      });
    }

    // Move Waypoint
    if (dragAction.type === 'move_waypoint' && dragAction.targetId) {
      const snappedX = snapCoord(gridX, 0.5);
      const snappedY = snapCoord(gridY, 0.5);

      onUpdateSetting((prev) => ({
        ...prev,
        waypoints: {
          ...prev.waypoints,
          [dragAction.targetId!]: {
            ...prev.waypoints[dragAction.targetId!],
            x: snappedX,
            y: snappedY,
          },
        },
      }));
    }

    // Move Spawn Point
    if (dragAction.type === 'move_spawn' && dragAction.targetId) {
      const snappedX = snapCoord(gridX, 0.5);
      const snappedY = snapCoord(gridY, 0.5);

      onUpdateSetting((prev) => ({
        ...prev,
        spawnPoints: {
          ...prev.spawnPoints,
          [dragAction.targetId!]: {
            ...prev.spawnPoints[dragAction.targetId!],
            x: snappedX,
            y: snappedY,
          },
        },
      }));
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);

    if (dragAction?.type === 'rect_tile') {
      const x1 = Math.min(dragAction.startX, dragAction.currentX);
      const x2 = Math.max(dragAction.startX, dragAction.currentX);
      const y1 = Math.min(dragAction.startY, dragAction.currentY);
      const y2 = Math.max(dragAction.startY, dragAction.currentY);

      onUpdateSetting((prev) => {
        const nextTiles = { ...prev.tiles };
        for (let x = x1; x <= x2; x++) {
          for (let y = y1; y <= y2; y++) {
            nextTiles[`${x},${y}`] = selectedTileType;
          }
        }
        return { ...prev, tiles: nextTiles };
      });
      soundEngine.playSfx('stapler_click', 0.5);
    }

    if (dragAction?.type === 'draw_zone') {
      const x1 = Math.min(dragAction.startX, dragAction.currentX);
      const x2 = Math.max(dragAction.startX, dragAction.currentX);
      const y1 = Math.min(dragAction.startY, dragAction.currentY);
      const y2 = Math.max(dragAction.startY, dragAction.currentY);

      const zoneId = `zone_${Date.now().toString(36)}`;
      const newZone: RoomZone = {
        id: zoneId,
        name: `Room Zone ${(setting.zones?.length || 0) + 1}`,
        x: x1,
        y: y1,
        w: x2 - x1 + 1,
        h: y2 - y1 + 1,
        color: '#38bdf8',
      };

      onUpdateSetting((prev) => ({
        ...prev,
        zones: [...(prev.zones || []), newZone],
      }));
      onSelectItem({ type: 'zone', index: setting.zones?.length || 0, data: newZone });
      soundEngine.playSfx('cheer', 0.4);
    }

    setDragAction(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    const newZoom = Math.max(0.4, Math.min(3.0, zoom * zoomFactor));
    onZoomChange(newZoom);
  };

  return (
    <div
      ref={containerRef}
      className="relative flex-1 w-full h-full bg-[#0a0e14] overflow-hidden cursor-crosshair select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      onContextMenu={(e) => e.preventDefault()}
    >
      <canvas ref={canvasRef} className="block w-full h-full" />

      {/* Floating HUD: Coordinates & Status */}
      <div className="absolute bottom-2 left-2 flex items-center gap-2 px-2.5 py-1 bg-[#131b26]/90 border border-[#2a374a] rounded shadow backdrop-blur-sm text-[10px] font-mono text-slate-300 pointer-events-none">
        <span>X: <strong className="text-amber-400">{hoverGrid ? hoverGrid.x : 0}</strong></span>
        <span>Y: <strong className="text-amber-400">{hoverGrid ? hoverGrid.y : 0}</strong></span>
        <span className="text-slate-500">|</span>
        <span>Zoom: <strong className="text-white">{Math.round(zoom * 100)}%</strong></span>
        <span className="text-slate-500">|</span>
        <span className="text-emerald-400 font-bold uppercase">{activeTool.replace('_', ' ')}</span>
      </div>
    </div>
  );
};
