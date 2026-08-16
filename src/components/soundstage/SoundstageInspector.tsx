import React from 'react';
import {
  Trash2,
  Copy,
  Sliders,
  Compass,
  Volume2,
  Sparkles,
  Maximize2,
  Layers,
  MapPin,
  UserCheck,
  Tag,
} from 'lucide-react';
import { PropInstance, PropType, Waypoint, RoomZone, SettingDefinition } from '../../types/environment';
import { Direction, SfxType } from '../../types/script';

export type SelectedItem =
  | { type: 'prop'; index: number; data: PropInstance }
  | { type: 'waypoint'; id: string; data: Waypoint }
  | { type: 'spawn'; id: string; data: Waypoint }
  | { type: 'zone'; index: number; data: RoomZone }
  | null;

interface SoundstageInspectorProps {
  selectedItem: SelectedItem;
  setting: SettingDefinition;
  onUpdateProp: (index: number, updated: Partial<PropInstance>) => void;
  onDeleteProp: (index: number) => void;
  onDuplicateProp: (index: number) => void;
  onUpdateWaypoint: (id: string, updated: Partial<Waypoint>) => void;
  onDeleteWaypoint: (id: string) => void;
  onUpdateSpawn: (id: string, updated: Partial<Waypoint>) => void;
  onDeleteSpawn: (id: string) => void;
  onUpdateZone: (index: number, updated: Partial<RoomZone>) => void;
  onDeleteZone: (index: number) => void;
  onUpdateSettingMeta: (updated: Partial<SettingDefinition>) => void;
}

const SFX_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '', label: 'None (Default)' },
  { value: 'stapler_click', label: 'Stapler Click' },
  { value: 'coffee_pour', label: 'Coffee Pour' },
  { value: 'typewriter', label: 'Typewriter Keystrokes' },
  { value: 'phone_ring', label: 'Retro Phone Ring' },
  { value: 'glass_shatter', label: 'Glass Shatter' },
  { value: 'slapstick_boing', label: 'Slapstick Boing' },
  { value: 'fire_alarm', label: 'Fire Alarm' },
];

export const SoundstageInspector: React.FC<SoundstageInspectorProps> = ({
  selectedItem,
  setting,
  onUpdateProp,
  onDeleteProp,
  onDuplicateProp,
  onUpdateWaypoint,
  onDeleteWaypoint,
  onUpdateSpawn,
  onDeleteSpawn,
  onUpdateZone,
  onDeleteZone,
  onUpdateSettingMeta,
}) => {
  return (
    <div className="flex flex-col w-64 bg-[#111823] border-l-2 border-[#2a374a] text-white shrink-0 select-none overflow-y-auto z-10">
      {/* Inspector Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#0d141e] border-b border-[#243042]">
        <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-400">
          <Sliders className="w-3.5 h-3.5" />
          <span>INSPECTOR</span>
        </div>
        <span className="text-[10px] font-mono text-slate-500 uppercase">
          {selectedItem ? selectedItem.type : 'Environment'}
        </span>
      </div>

      <div className="p-3 flex flex-col gap-3 text-xs">
        {/* CASE 1: PROP SELECTED */}
        {selectedItem?.type === 'prop' && (
          <div className="flex flex-col gap-2.5">
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Name / Label</label>
              <input
                type="text"
                value={selectedItem.data.name || ''}
                onChange={(e) => onUpdateProp(selectedItem.index, { name: e.target.value })}
                placeholder="Prop name"
                className="w-full bg-[#182333] border border-[#2a374a] rounded px-2 py-1 text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Grid X</label>
                <input
                  type="number"
                  step="0.25"
                  value={selectedItem.data.x}
                  onChange={(e) => onUpdateProp(selectedItem.index, { x: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#182333] border border-[#2a374a] rounded px-2 py-1 text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Grid Y</label>
                <input
                  type="number"
                  step="0.25"
                  value={selectedItem.data.y}
                  onChange={(e) => onUpdateProp(selectedItem.index, { y: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#182333] border border-[#2a374a] rounded px-2 py-1 text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Width (Cells)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.4"
                  max="12"
                  value={selectedItem.data.width || 1}
                  onChange={(e) => onUpdateProp(selectedItem.index, { width: parseFloat(e.target.value) || 1 })}
                  className="w-full bg-[#182333] border border-[#2a374a] rounded px-2 py-1 text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Height (Cells)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.4"
                  max="12"
                  value={selectedItem.data.height || 1}
                  onChange={(e) => onUpdateProp(selectedItem.index, { height: parseFloat(e.target.value) || 1 })}
                  className="w-full bg-[#182333] border border-[#2a374a] rounded px-2 py-1 text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Facing Direction</label>
              <select
                value={selectedItem.data.facing || 'down'}
                onChange={(e) => onUpdateProp(selectedItem.index, { facing: e.target.value as Direction })}
                className="w-full bg-[#182333] border border-[#2a374a] rounded px-2 py-1 text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
              >
                <option value="down">Down (Front Face)</option>
                <option value="up">Up (Back Face)</option>
                <option value="left">Left</option>
                <option value="right">Right</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-2 bg-[#182333] border border-[#2a374a] rounded">
              <label className="text-xs font-mono text-slate-300">Interactive Object</label>
              <input
                type="checkbox"
                checked={!!selectedItem.data.interactive}
                onChange={(e) => onUpdateProp(selectedItem.index, { interactive: e.target.checked })}
                className="w-4 h-4 accent-amber-500 rounded"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Z-Index Offset</label>
                <input
                  type="number"
                  value={selectedItem.data.zIndexOffset || 0}
                  onChange={(e) => onUpdateProp(selectedItem.index, { zIndexOffset: parseInt(e.target.value) || 0 })}
                  className="w-full bg-[#182333] border border-[#2a374a] rounded px-2 py-1 text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Click SFX</label>
                <select
                  value={selectedItem.data.state?.sfx || ''}
                  onChange={(e) =>
                    onUpdateProp(selectedItem.index, {
                      state: { ...selectedItem.data.state, sfx: e.target.value },
                    })
                  }
                  className="w-full bg-[#182333] border border-[#2a374a] rounded px-1.5 py-1 text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
                >
                  {SFX_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t border-[#243042]">
              <button
                onClick={() => onDuplicateProp(selectedItem.index)}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-[#1e293b] hover:bg-[#2e3e57] text-slate-300 rounded font-mono text-xs transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Clone</span>
              </button>
              <button
                onClick={() => onDeleteProp(selectedItem.index)}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 rounded font-mono text-xs transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        )}

        {/* CASE 2: WAYPOINT SELECTED */}
        {selectedItem?.type === 'waypoint' && (
          <div className="flex flex-col gap-2.5">
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Waypoint ID</label>
              <input
                type="text"
                value={selectedItem.data.id}
                disabled
                className="w-full bg-[#0d141e] border border-[#2a374a] rounded px-2 py-1 text-xs text-slate-400 font-mono"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Display Label</label>
              <input
                type="text"
                value={selectedItem.data.name}
                onChange={(e) => onUpdateWaypoint(selectedItem.id, { name: e.target.value })}
                className="w-full bg-[#182333] border border-[#2a374a] rounded px-2 py-1 text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Grid X</label>
                <input
                  type="number"
                  step="0.5"
                  value={selectedItem.data.x}
                  onChange={(e) => onUpdateWaypoint(selectedItem.id, { x: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#182333] border border-[#2a374a] rounded px-2 py-1 text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Grid Y</label>
                <input
                  type="number"
                  step="0.5"
                  value={selectedItem.data.y}
                  onChange={(e) => onUpdateWaypoint(selectedItem.id, { y: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#182333] border border-[#2a374a] rounded px-2 py-1 text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Arrival Facing Direction</label>
              <select
                value={selectedItem.data.facing || 'down'}
                onChange={(e) => onUpdateWaypoint(selectedItem.id, { facing: e.target.value as Direction })}
                className="w-full bg-[#182333] border border-[#2a374a] rounded px-2 py-1 text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
              >
                <option value="down">Down (Front)</option>
                <option value="up">Up (Back)</option>
                <option value="left">Left</option>
                <option value="right">Right</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Assigned Room Zone</label>
              <select
                value={selectedItem.data.zone || ''}
                onChange={(e) => onUpdateWaypoint(selectedItem.id, { zone: e.target.value })}
                className="w-full bg-[#182333] border border-[#2a374a] rounded px-2 py-1 text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
              >
                <option value="">No Zone</option>
                {setting.zones?.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => onDeleteWaypoint(selectedItem.id)}
              className="mt-2 flex items-center justify-center gap-1 py-1.5 bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 rounded font-mono text-xs transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Waypoint</span>
            </button>
          </div>
        )}

        {/* CASE 3: SPAWN POINT SELECTED */}
        {selectedItem?.type === 'spawn' && (
          <div className="flex flex-col gap-2.5">
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Character ID</label>
              <input
                type="text"
                value={selectedItem.id}
                disabled
                className="w-full bg-[#0d141e] border border-[#2a374a] rounded px-2 py-1 text-xs text-slate-400 font-mono"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Spawn Label</label>
              <input
                type="text"
                value={selectedItem.data.name}
                onChange={(e) => onUpdateSpawn(selectedItem.id, { name: e.target.value })}
                className="w-full bg-[#182333] border border-[#2a374a] rounded px-2 py-1 text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Grid X</label>
                <input
                  type="number"
                  step="0.5"
                  value={selectedItem.data.x}
                  onChange={(e) => onUpdateSpawn(selectedItem.id, { x: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#182333] border border-[#2a374a] rounded px-2 py-1 text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Grid Y</label>
                <input
                  type="number"
                  step="0.5"
                  value={selectedItem.data.y}
                  onChange={(e) => onUpdateSpawn(selectedItem.id, { y: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#182333] border border-[#2a374a] rounded px-2 py-1 text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              onClick={() => onDeleteSpawn(selectedItem.id)}
              className="mt-2 flex items-center justify-center gap-1 py-1.5 bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 rounded font-mono text-xs transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Spawn</span>
            </button>
          </div>
        )}

        {/* CASE 4: ROOM ZONE SELECTED */}
        {selectedItem?.type === 'zone' && (
          <div className="flex flex-col gap-2.5">
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Zone Name</label>
              <input
                type="text"
                value={selectedItem.data.name}
                onChange={(e) => onUpdateZone(selectedItem.index, { name: e.target.value })}
                className="w-full bg-[#182333] border border-[#2a374a] rounded px-2 py-1 text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Color Tint</label>
                <input
                  type="color"
                  value={selectedItem.data.color || '#38bdf8'}
                  onChange={(e) => onUpdateZone(selectedItem.index, { color: e.target.value })}
                  className="w-full h-8 bg-[#182333] border border-[#2a374a] rounded p-0.5 cursor-pointer"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Zone ID</label>
                <input
                  type="text"
                  value={selectedItem.data.id}
                  disabled
                  className="w-full bg-[#0d141e] border border-[#2a374a] rounded px-2 py-1 text-xs text-slate-400 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">X, Y</label>
                <div className="flex gap-1">
                  <input
                    type="number"
                    value={selectedItem.data.x}
                    onChange={(e) => onUpdateZone(selectedItem.index, { x: parseInt(e.target.value) || 0 })}
                    className="w-1/2 bg-[#182333] border border-[#2a374a] rounded px-1.5 py-1 text-xs text-white font-mono"
                  />
                  <input
                    type="number"
                    value={selectedItem.data.y}
                    onChange={(e) => onUpdateZone(selectedItem.index, { y: parseInt(e.target.value) || 0 })}
                    className="w-1/2 bg-[#182333] border border-[#2a374a] rounded px-1.5 py-1 text-xs text-white font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Width, Height</label>
                <div className="flex gap-1">
                  <input
                    type="number"
                    value={selectedItem.data.w}
                    onChange={(e) => onUpdateZone(selectedItem.index, { w: parseInt(e.target.value) || 1 })}
                    className="w-1/2 bg-[#182333] border border-[#2a374a] rounded px-1.5 py-1 text-xs text-white font-mono"
                  />
                  <input
                    type="number"
                    value={selectedItem.data.h}
                    onChange={(e) => onUpdateZone(selectedItem.index, { h: parseInt(e.target.value) || 1 })}
                    className="w-1/2 bg-[#182333] border border-[#2a374a] rounded px-1.5 py-1 text-xs text-white font-mono"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={() => onDeleteZone(selectedItem.index)}
              className="mt-2 flex items-center justify-center gap-1 py-1.5 bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 rounded font-mono text-xs transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Zone</span>
            </button>
          </div>
        )}

        {/* CASE 5: NO SELECTION (ENVIRONMENT PROPERTIES) */}
        {!selectedItem && (
          <div className="flex flex-col gap-2.5">
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Stage Name</label>
              <input
                type="text"
                value={setting.name}
                onChange={(e) => onUpdateSettingMeta({ name: e.target.value })}
                className="w-full bg-[#182333] border border-[#2a374a] rounded px-2 py-1 text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Show Affiliation</label>
              <select
                value={setting.showTitle}
                onChange={(e) => onUpdateSettingMeta({ showTitle: e.target.value })}
                className="w-full bg-[#182333] border border-[#2a374a] rounded px-2 py-1 text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
              >
                <option value="The Office">The Office</option>
                <option value="Friends">Friends</option>
                <option value="Silicon Valley">Silicon Valley</option>
                <option value="How I Met Your Mother">How I Met Your Mother</option>
                <option value="Custom Comedy">Custom Comedy</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Grid Width</label>
                <input
                  type="number"
                  value={setting.gridWidth}
                  onChange={(e) => onUpdateSettingMeta({ gridWidth: Math.max(12, parseInt(e.target.value) || 20) })}
                  className="w-full bg-[#182333] border border-[#2a374a] rounded px-2 py-1 text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Grid Height</label>
                <input
                  type="number"
                  value={setting.gridHeight}
                  onChange={(e) => onUpdateSettingMeta({ gridHeight: Math.max(10, parseInt(e.target.value) || 16) })}
                  className="w-full bg-[#182333] border border-[#2a374a] rounded px-2 py-1 text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="p-2.5 bg-[#182333] border border-[#2a374a] rounded flex flex-col gap-1.5 mt-2">
              <span className="text-[10px] font-mono uppercase text-amber-400 font-bold">Stage Summary</span>
              <div className="flex justify-between text-slate-300 font-mono text-[11px]">
                <span>Props on Stage:</span>
                <strong className="text-white">{setting.props.length}</strong>
              </div>
              <div className="flex justify-between text-slate-300 font-mono text-[11px]">
                <span>Waypoints:</span>
                <strong className="text-pink-400">{Object.keys(setting.waypoints || {}).length}</strong>
              </div>
              <div className="flex justify-between text-slate-300 font-mono text-[11px]">
                <span>Spawn Points:</span>
                <strong className="text-yellow-400">{Object.keys(setting.spawnPoints || {}).length}</strong>
              </div>
              <div className="flex justify-between text-slate-300 font-mono text-[11px]">
                <span>Room Zones:</span>
                <strong className="text-blue-400">{setting.zones?.length || 0}</strong>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
