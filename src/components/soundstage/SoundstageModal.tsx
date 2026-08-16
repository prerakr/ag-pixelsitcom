import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  SettingDefinition,
  PropInstance,
  PropType,
  TileType,
  Waypoint,
  RoomZone,
} from '../../types/environment';
import { SoundstageHeader, SnapLevel } from './SoundstageHeader';
import { SoundstageToolbar, SoundstageTool } from './SoundstageToolbar';
import { SoundstageAssetTray, AssetCategory } from './SoundstageAssetTray';
import { SoundstageInspector, SelectedItem } from './SoundstageInspector';
import { SoundstageCanvas } from './SoundstageCanvas';
import { SoundstagePrefab } from './SoundstagePrefabs';
import { useSoundstageHistory } from './useSoundstageHistory';
import { CharacterDefinition } from '../../types/character';
import {
  loadCustomSettings,
  saveCustomSetting,
  deleteCustomSetting,
  createBlankSetting,
  duplicateSetting,
  exportSettingAsTypeScript,
  exportSettingAsJSON,
  importSettingFromJSON,
} from '../../data/settings/customStore';
import { ALL_SETTINGS, DEFAULT_SETTING_ID, getMergedSettings } from '../../data/settings';
import {
  Code,
  Copy,
  Check,
  Download,
  Upload,
  X,
  FileCode,
  Sparkles,
} from 'lucide-react';
import { soundEngine } from '../../engine/SoundEngine';

interface SoundstageModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSettingId: string;
  onApplySettingToApp: (settingId: string) => void;
  characters: CharacterDefinition[];
}

export const SoundstageModal: React.FC<SoundstageModalProps> = ({
  isOpen,
  onClose,
  initialSettingId,
  onApplySettingToApp,
  characters,
}) => {
  // All Settings (Built-in Presets + Custom Sets)
  const [allSettingsMap, setAllSettingsMap] = useState<Record<string, SettingDefinition>>(() =>
    getMergedSettings()
  );

  const initialSetting =
    allSettingsMap[initialSettingId] ||
    allSettingsMap[DEFAULT_SETTING_ID] ||
    ALL_SETTINGS[DEFAULT_SETTING_ID];

  // History & Setting Reducer
  const {
    setting,
    setSetting,
    undo,
    redo,
    canUndo,
    canRedo,
    resetSetting,
  } = useSoundstageHistory(initialSetting);

  // Active Tool & Selection State
  const [activeTool, setActiveTool] = useState<SoundstageTool>('select');
  const [activeAssetCategory, setActiveAssetCategory] = useState<AssetCategory>('tiles');
  const [selectedTileType, setSelectedTileType] = useState<TileType>('floor_wood');
  const [selectedPropType, setSelectedPropType] = useState<PropType>('desk_wood');
  const [selectedPrefab, setSelectedPrefab] = useState<SoundstagePrefab | null>(null);
  const [selectedCharacterSpawn, setSelectedCharacterSpawn] = useState<string>(
    characters[0]?.id || 'michael'
  );
  const [snapLevel, setSnapLevel] = useState<SnapLevel>(0.5);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [zoom, setZoom] = useState<number>(1.2);
  const [selectedItem, setSelectedItem] = useState<SelectedItem>(null);

  // Export & Import Modal State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'typescript' | 'json'>('typescript');
  const [importJsonText, setImportJsonText] = useState('');
  const [copied, setCopied] = useState(false);

  // Refresh settings map whenever localStorage updates
  const refreshSettingsList = useCallback(() => {
    setAllSettingsMap(getMergedSettings());
  }, []);

  // Update selection on setting switch
  const handleSelectSetting = (id: string) => {
    const next = allSettingsMap[id];
    if (next) {
      resetSetting(next);
      setSelectedItem(null);
      soundEngine.playSfx('stapler_click', 0.5);
    }
  };

  const handleCreateNewSetting = () => {
    const newSet = createBlankSetting(`Soundstage ${Object.keys(allSettingsMap).length + 1}`);
    saveCustomSetting(newSet);
    refreshSettingsList();
    resetSetting(newSet);
    setSelectedItem(null);
    soundEngine.playSfx('cheer', 0.5);
  };

  const handleDuplicateSetting = () => {
    const cloned = duplicateSetting(setting);
    saveCustomSetting(cloned);
    refreshSettingsList();
    resetSetting(cloned);
    setSelectedItem(null);
    soundEngine.playSfx('cheer', 0.5);
  };

  const handleDeleteCurrentSetting = () => {
    if (!setting.id.startsWith('custom_')) return;
    if (confirm(`Are you sure you want to delete "${setting.name}"?`)) {
      deleteCustomSetting(setting.id);
      refreshSettingsList();
      resetSetting(ALL_SETTINGS[DEFAULT_SETTING_ID]);
      setSelectedItem(null);
      soundEngine.playSfx('stapler_click', 0.5);
    }
  };

  // Inspector Mutation Handlers
  const handleUpdateProp = (index: number, updated: Partial<PropInstance>) => {
    setSetting((prev) => {
      const nextProps = [...prev.props];
      nextProps[index] = { ...nextProps[index], ...updated };
      return { ...prev, props: nextProps };
    });
    if (selectedItem?.type === 'prop' && selectedItem.index === index) {
      setSelectedItem((prev) =>
        prev && prev.type === 'prop' ? { ...prev, data: { ...prev.data, ...updated } } : prev
      );
    }
  };

  const handleDeleteProp = (index: number) => {
    setSetting((prev) => {
      const nextProps = prev.props.filter((_, i) => i !== index);
      return { ...prev, props: nextProps };
    });
    setSelectedItem(null);
    soundEngine.playSfx('stapler_click', 0.4);
  };

  const handleDuplicateProp = (index: number) => {
    const original = setting.props[index];
    if (!original) return;
    const cloned: PropInstance = {
      ...original,
      id: `prop_${original.type}_${Date.now().toString(36)}`,
      x: original.x + 1,
      y: original.y + 1,
    };
    setSetting((prev) => ({
      ...prev,
      props: [...prev.props, cloned],
    }));
    setSelectedItem({ type: 'prop', index: setting.props.length, data: cloned });
    soundEngine.playSfx('stapler_click', 0.5);
  };

  const handleUpdateWaypoint = (id: string, updated: Partial<Waypoint>) => {
    setSetting((prev) => ({
      ...prev,
      waypoints: {
        ...prev.waypoints,
        [id]: { ...prev.waypoints[id], ...updated },
      },
    }));
    if (selectedItem?.type === 'waypoint' && selectedItem.id === id) {
      setSelectedItem((prev) =>
        prev && prev.type === 'waypoint' ? { ...prev, data: { ...prev.data, ...updated } } : prev
      );
    }
  };

  const handleDeleteWaypoint = (id: string) => {
    setSetting((prev) => {
      const next = { ...prev.waypoints };
      delete next[id];
      return { ...prev, waypoints: next };
    });
    setSelectedItem(null);
    soundEngine.playSfx('stapler_click', 0.4);
  };

  const handleUpdateSpawn = (id: string, updated: Partial<Waypoint>) => {
    setSetting((prev) => ({
      ...prev,
      spawnPoints: {
        ...prev.spawnPoints,
        [id]: { ...prev.spawnPoints[id], ...updated },
      },
    }));
  };

  const handleDeleteSpawn = (id: string) => {
    setSetting((prev) => {
      const next = { ...prev.spawnPoints };
      delete next[id];
      return { ...prev, spawnPoints: next };
    });
    setSelectedItem(null);
  };

  const handleUpdateZone = (index: number, updated: Partial<RoomZone>) => {
    setSetting((prev) => {
      const nextZones = [...(prev.zones || [])];
      nextZones[index] = { ...nextZones[index], ...updated };
      return { ...prev, zones: nextZones };
    });
    if (selectedItem?.type === 'zone' && selectedItem.index === index) {
      setSelectedItem((prev) =>
        prev && prev.type === 'zone' ? { ...prev, data: { ...prev.data, ...updated } } : prev
      );
    }
  };

  const handleDeleteZone = (index: number) => {
    setSetting((prev) => {
      const nextZones = (prev.zones || []).filter((_, i) => i !== index);
      return { ...prev, zones: nextZones };
    });
    setSelectedItem(null);
  };

  const handleUpdateSettingMeta = (updated: Partial<SettingDefinition>) => {
    setSetting((prev) => ({ ...prev, ...updated }));
  };

  // Global Keyboard Shortcuts for Soundstage Studio
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyZ') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if ((e.ctrlKey || e.metaKey) && e.code === 'KeyY') {
        e.preventDefault();
        redo();
      } else if (e.code === 'KeyV') {
        setActiveTool('select');
      } else if (e.code === 'KeyD') {
        setActiveTool('director');
      } else if (e.code === 'KeyB') {
        setActiveTool('tile_brush');
        setActiveAssetCategory('tiles');
      } else if (e.code === 'KeyR') {
        setActiveTool('tile_rect');
        setActiveAssetCategory('tiles');
      } else if (e.code === 'KeyG') {
        setActiveTool('tile_bucket');
        setActiveAssetCategory('tiles');
      } else if (e.code === 'KeyE') {
        setActiveTool('tile_eraser');
        setActiveAssetCategory('tiles');
      } else if (e.code === 'KeyP') {
        setActiveTool('prop_stamp');
        setActiveAssetCategory('props');
      } else if (e.code === 'KeyW') {
        setActiveTool('waypoint');
        setActiveAssetCategory('waypoints');
      } else if (e.code === 'KeyS') {
        setActiveTool('spawn');
        setActiveAssetCategory('waypoints');
      } else if (e.code === 'KeyZ') {
        setActiveTool('zone');
        setActiveAssetCategory('zones');
      } else if (e.code === 'Delete' || e.code === 'Backspace') {
        if (selectedItem?.type === 'prop') {
          handleDeleteProp(selectedItem.index);
        } else if (selectedItem?.type === 'waypoint') {
          handleDeleteWaypoint(selectedItem.id);
        } else if (selectedItem?.type === 'zone') {
          handleDeleteZone(selectedItem.index);
        }
      } else if (e.code === 'Escape') {
        if (selectedItem) setSelectedItem(null);
        else onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedItem, undo, redo, onClose]);

  // Export String Generation
  const exportCode = useMemo(() => {
    return exportFormat === 'typescript'
      ? exportSettingAsTypeScript(setting)
      : exportSettingAsJSON(setting);
  }, [setting, exportFormat]);

  const handleCopyExport = () => {
    navigator.clipboard.writeText(exportCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    const ext = exportFormat === 'typescript' ? 'ts' : 'json';
    const filename = `${setting.id}.${ext}`;
    const blob = new Blob([exportCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = () => {
    const imported = importSettingFromJSON(importJsonText);
    if (imported) {
      saveCustomSetting(imported);
      refreshSettingsList();
      resetSetting(imported);
      setIsExportModalOpen(false);
      soundEngine.playSfx('cheer', 0.5);
    } else {
      alert('Invalid SettingDefinition JSON format. Please ensure gridWidth, gridHeight, tiles, and props are defined.');
    }
  };

  const handleLaunchInVisualizer = () => {
    saveCustomSetting(setting);
    refreshSettingsList();
    onApplySettingToApp(setting.id);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col w-full h-full bg-[#0a0e14] text-white select-none animate-in fade-in duration-200">
      {/* Top Soundstage Command Header */}
      <SoundstageHeader
        currentSetting={setting}
        allSettings={allSettingsMap}
        onSelectSetting={handleSelectSetting}
        onCreateNewSetting={handleCreateNewSetting}
        onDuplicateSetting={handleDuplicateSetting}
        onDeleteCurrentSetting={handleDeleteCurrentSetting}
        isCustomSetting={setting.id.startsWith('custom_')}
        snapLevel={snapLevel}
        onChangeSnapLevel={setSnapLevel}
        showGrid={showGrid}
        onToggleShowGrid={() => setShowGrid(!showGrid)}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        onZoomIn={() => setZoom((z) => Math.min(3.0, z * 1.25))}
        onZoomOut={() => setZoom((z) => Math.max(0.4, z * 0.8))}
        onResetZoom={() => setZoom(1.2)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onCloseStudio={onClose}
        onLaunchVisualizer={handleLaunchInVisualizer}
      />

      {/* Main Workspace Row: Toolbar + Canvas + Inspector */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Floating Tools */}
        <SoundstageToolbar
          activeTool={activeTool}
          onSelectTool={(tool) => {
            setActiveTool(tool);
            if (tool.startsWith('tile')) setActiveAssetCategory('tiles');
            else if (tool === 'prop_stamp') setActiveAssetCategory('props');
            else if (tool === 'waypoint' || tool === 'spawn') setActiveAssetCategory('waypoints');
            else if (tool === 'zone') setActiveAssetCategory('zones');
          }}
        />

        {/* Center Canvas */}
        <SoundstageCanvas
          setting={setting}
          onUpdateSetting={setSetting}
          activeTool={activeTool}
          selectedTileType={selectedTileType}
          selectedPropType={selectedPropType}
          selectedPrefab={selectedPrefab}
          onClearPrefab={() => setSelectedPrefab(null)}
          selectedCharacterSpawn={selectedCharacterSpawn}
          snapLevel={snapLevel}
          showGrid={showGrid}
          selectedItem={selectedItem}
          onSelectItem={setSelectedItem}
          characters={characters}
          zoom={zoom}
          onZoomChange={setZoom}
        />

        {/* Right Properties Inspector */}
        <SoundstageInspector
          selectedItem={selectedItem}
          setting={setting}
          onUpdateProp={handleUpdateProp}
          onDeleteProp={handleDeleteProp}
          onDuplicateProp={handleDuplicateProp}
          onUpdateWaypoint={handleUpdateWaypoint}
          onDeleteWaypoint={handleDeleteWaypoint}
          onUpdateSpawn={handleUpdateSpawn}
          onDeleteSpawn={handleDeleteSpawn}
          onUpdateZone={handleUpdateZone}
          onDeleteZone={handleDeleteZone}
          onUpdateSettingMeta={handleUpdateSettingMeta}
        />
      </div>

      {/* Bottom Asset Drawer & Palette */}
      <SoundstageAssetTray
        activeCategory={activeAssetCategory}
        onSelectCategory={setActiveAssetCategory}
        selectedTileType={selectedTileType}
        onSelectTileType={(type) => {
          setSelectedTileType(type);
          if (activeTool === 'select') setActiveTool('tile_brush');
        }}
        selectedPropType={selectedPropType}
        onSelectPropType={(type) => {
          setSelectedPropType(type);
          if (activeTool === 'select') setActiveTool('prop_stamp');
        }}
        selectedPrefab={selectedPrefab}
        onSelectPrefab={(prefab) => {
          setSelectedPrefab(prefab);
          if (prefab) setActiveTool('select');
        }}
        characters={characters}
        selectedCharacterSpawn={selectedCharacterSpawn}
        onSelectCharacterSpawn={(charId) => {
          setSelectedCharacterSpawn(charId);
          setActiveTool('spawn');
        }}
      />

      {/* Export / Import Modal Overlay */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="flex flex-col w-full max-w-2xl max-h-[85vh] bg-[#111823] border-2 border-amber-500/80 rounded-xl shadow-2xl overflow-hidden text-white">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#0d141e] border-b border-[#243042]">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-amber-400" />
                <h3 className="pixel-font text-xs font-bold text-amber-400">
                  EXPORT / IMPORT ENVIRONMENT DEFINITION
                </h3>
              </div>
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-3">
              <div className="flex items-center justify-between">
                {/* Format Toggle */}
                <div className="flex bg-[#182333] border border-[#2a374a] rounded p-0.5">
                  <button
                    onClick={() => setExportFormat('typescript')}
                    className={`px-3 py-1 text-xs font-mono rounded ${
                      exportFormat === 'typescript'
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    TypeScript Code (.ts)
                  </button>
                  <button
                    onClick={() => setExportFormat('json')}
                    className={`px-3 py-1 text-xs font-mono rounded ${
                      exportFormat === 'json'
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Raw JSON (.json)
                  </button>
                </div>

                {/* Copy / Download Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={handleCopyExport}
                    className="flex items-center gap-1.5 px-3 py-1 bg-[#1e293b] hover:bg-[#2c3c54] border border-[#3b4c66] text-amber-300 rounded font-mono text-xs transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'COPIED!' : 'COPY CODE'}</span>
                  </button>
                  <button
                    onClick={handleDownloadFile}
                    className="flex items-center gap-1.5 px-3 py-1 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded font-mono text-xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>DOWNLOAD</span>
                  </button>
                </div>
              </div>

              {/* Code Display Area */}
              <div className="relative">
                <textarea
                  readOnly
                  value={exportCode}
                  className="w-full h-64 bg-[#080c12] border border-[#243042] rounded p-3 font-mono text-xs text-slate-300 focus:outline-none resize-none leading-relaxed select-text"
                />
              </div>

              {/* Import from JSON section */}
              <div className="p-3 bg-[#182333] border border-[#2a374a] rounded flex flex-col gap-2">
                <span className="text-xs font-mono text-amber-400 font-bold flex items-center gap-1">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Import Custom Setting from JSON</span>
                </span>
                <textarea
                  placeholder="Paste SettingDefinition JSON here..."
                  value={importJsonText}
                  onChange={(e) => setImportJsonText(e.target.value)}
                  className="w-full h-20 bg-[#0d141e] border border-[#2a374a] rounded p-2 font-mono text-[11px] text-white focus:outline-none focus:border-amber-500 resize-none"
                />
                <button
                  onClick={handleImportJson}
                  disabled={!importJsonText.trim()}
                  className="self-end px-3 py-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-mono text-xs font-bold rounded transition-colors"
                >
                  Import & Load Setting
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
