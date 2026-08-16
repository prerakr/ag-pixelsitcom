import React, { useState } from 'react';
import {
  LayoutGrid,
  Plus,
  Copy,
  Trash2,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Code,
  FileCode,
  Check,
  X,
  Play,
  Grid,
} from 'lucide-react';
import { SettingDefinition } from '../../types/environment';

export type SnapLevel = 1.0 | 0.5 | 0.25 | 0;

interface SoundstageHeaderProps {
  currentSetting: SettingDefinition;
  allSettings: Record<string, SettingDefinition>;
  onSelectSetting: (id: string) => void;
  onCreateNewSetting: () => void;
  onDuplicateSetting: () => void;
  onDeleteCurrentSetting: () => void;
  isCustomSetting: boolean;
  snapLevel: SnapLevel;
  onChangeSnapLevel: (snap: SnapLevel) => void;
  showGrid: boolean;
  onToggleShowGrid: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onOpenExportModal: () => void;
  onCloseStudio: () => void;
  onLaunchVisualizer: () => void;
}

export const SoundstageHeader: React.FC<SoundstageHeaderProps> = ({
  currentSetting,
  allSettings,
  onSelectSetting,
  onCreateNewSetting,
  onDuplicateSetting,
  onDeleteCurrentSetting,
  isCustomSetting,
  snapLevel,
  onChangeSnapLevel,
  showGrid,
  onToggleShowGrid,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onOpenExportModal,
  onCloseStudio,
  onLaunchVisualizer,
}) => {
  return (
    <div className="flex items-center justify-between px-3 py-2 bg-[#131b26] border-b-2 border-[#2a374a] text-white shrink-0 select-none z-20 gap-2">
      {/* Left: Brand & Set Selector */}
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-1.5">
          <div className="flex items-center justify-center w-7 h-7 bg-amber-500 text-slate-950 font-black rounded border border-amber-300 shadow">
            <LayoutGrid className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="pixel-font text-xs font-bold text-amber-400">SOUNDSTAGE</h2>
              <span className="text-[9px] px-1 py-0.2 bg-amber-950 text-amber-300 border border-amber-600 rounded font-mono">
                STUDIO
              </span>
            </div>
          </div>
        </div>

        <div className="h-5 w-[1px] bg-[#2a374a] mx-1" />

        {/* Set Selector Dropdown */}
        <select
          value={currentSetting.id}
          onChange={(e) => onSelectSetting(e.target.value)}
          className="bg-[#182333] border border-[#2a374a] hover:border-amber-500 rounded px-2.5 py-1 text-xs text-white font-mono focus:outline-none max-w-[200px] truncate"
        >
          {Object.values(allSettings).map((s) => (
            <option key={s.id} value={s.id}>
              {s.id.startsWith('custom_') ? '★ ' : ''}
              {s.name} ({s.showTitle})
            </option>
          ))}
        </select>

        {/* Set Management Actions */}
        <button
          onClick={onCreateNewSetting}
          className="p-1.5 bg-[#182333] hover:bg-amber-600/30 border border-[#2a374a] hover:border-amber-500 text-slate-300 hover:text-amber-300 rounded transition-colors"
          title="Create New Blank Set"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onDuplicateSetting}
          className="p-1.5 bg-[#182333] hover:bg-[#202e42] border border-[#2a374a] text-slate-300 hover:text-white rounded transition-colors"
          title="Clone Current Set"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>

        {isCustomSetting && (
          <button
            onClick={onDeleteCurrentSetting}
            className="p-1.5 bg-rose-950/40 hover:bg-rose-900 border border-rose-800 text-rose-300 rounded transition-colors"
            title="Delete Custom Set"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Center: Grid Snapping & History Controls */}
      <div className="hidden md:flex items-center gap-2">
        {/* Undo / Redo */}
        <div className="flex items-center bg-[#0e1622] border border-[#2a374a] rounded p-0.5">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`p-1 rounded ${
              canUndo ? 'text-slate-200 hover:bg-[#1e2c40]' : 'text-slate-600 cursor-not-allowed'
            }`}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`p-1 rounded ${
              canRedo ? 'text-slate-200 hover:bg-[#1e2c40]' : 'text-slate-600 cursor-not-allowed'
            }`}
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Snap Selector */}
        <div className="flex items-center gap-1 bg-[#0e1622] border border-[#2a374a] rounded px-2 py-1">
          <span className="text-[10px] font-mono text-slate-400">Snap:</span>
          {[
            { val: 1.0, label: '1x' },
            { val: 0.5, label: '0.5x' },
            { val: 0.25, label: '0.25x' },
            { val: 0, label: 'Free' },
          ].map((sn) => (
            <button
              key={sn.label}
              onClick={() => onChangeSnapLevel(sn.val as SnapLevel)}
              className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                snapLevel === sn.val
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {sn.label}
            </button>
          ))}
        </div>

        {/* Grid Line Toggle */}
        <button
          onClick={onToggleShowGrid}
          className={`p-1.5 rounded border transition-colors ${
            showGrid
              ? 'bg-amber-600/30 border-amber-400 text-amber-300'
              : 'bg-[#182333] border-[#2a374a] text-slate-400'
          }`}
          title="Toggle Grid Lines"
        >
          <Grid className="w-3.5 h-3.5" />
        </button>

        {/* Zoom Controls */}
        <div className="flex items-center bg-[#0e1622] border border-[#2a374a] rounded p-0.5">
          <button
            onClick={onZoomIn}
            className="p-1 text-slate-300 hover:text-white hover:bg-[#1e2c40] rounded"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onZoomOut}
            className="p-1 text-slate-300 hover:text-white hover:bg-[#1e2c40] rounded"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onResetZoom}
            className="p-1 text-slate-300 hover:text-white hover:bg-[#1e2c40] rounded"
            title="Fit to Screen"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Right: Code Export & Launch */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenExportModal}
          className="flex items-center gap-1 px-2.5 py-1 bg-[#1e293b] hover:bg-[#2c3c54] border border-[#3b4c66] text-amber-300 rounded font-mono text-xs transition-colors"
          title="Export TypeScript or JSON definition"
        >
          <Code className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Export Code</span>
        </button>

        <button
          onClick={onLaunchVisualizer}
          className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded shadow-md text-xs font-mono transition-all"
          title="Launch Live Visualizer on this Set"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>RUN ON SET</span>
        </button>

        <button
          onClick={onCloseStudio}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-[#1e293b] rounded transition-colors"
          title="Close Studio"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
