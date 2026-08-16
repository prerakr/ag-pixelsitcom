import React, { useState, useMemo } from 'react';
import {
  Layers,
  Armchair,
  MapPin,
  Maximize,
  Sparkles,
  Search,
  Check,
} from 'lucide-react';
import { TileType, PropType } from '../../types/environment';
import { SOUNDSTAGE_PREFABS, SoundstagePrefab } from './SoundstagePrefabs';
import { CharacterDefinition } from '../../types/character';

export type AssetCategory = 'tiles' | 'props' | 'waypoints' | 'zones' | 'prefabs';

interface SoundstageAssetTrayProps {
  activeCategory: AssetCategory;
  onSelectCategory: (cat: AssetCategory) => void;
  selectedTileType: TileType;
  onSelectTileType: (type: TileType) => void;
  selectedPropType: PropType;
  onSelectPropType: (type: PropType) => void;
  selectedPrefab: SoundstagePrefab | null;
  onSelectPrefab: (prefab: SoundstagePrefab | null) => void;
  characters: CharacterDefinition[];
  selectedCharacterSpawn: string;
  onSelectCharacterSpawn: (charId: string) => void;
}

const FLOOR_TILES: Array<{ type: TileType; label: string; color: string; desc: string }> = [
  { type: 'floor_carpet_grey', label: 'Grey Carpet', color: '#838e99', desc: 'Standard office bullpen carpet' },
  { type: 'floor_carpet_blue', label: 'Navy Carpet', color: '#3f5263', desc: 'Executive conference room carpet' },
  { type: 'floor_tile_kitchen', label: 'Kitchen Tile', color: '#c5ccd3', desc: 'Checkered breakroom linoleum' },
  { type: 'floor_wood', label: 'Hardwood Planks', color: '#8f633a', desc: 'Warm polished wooden floorboards' },
];

const WALL_TILES: Array<{ type: TileType; label: string; color: string; desc: string }> = [
  { type: 'wall_office_top', label: 'Office Top Wall', color: '#d3cbbe', desc: 'Drywall with wood baseboard' },
  { type: 'wall_office_side', label: 'Office Side Wall', color: '#6d7580', desc: 'Vertical perimeter boundary' },
  { type: 'wall_glass', label: 'Glass Partition', color: '#88c0d0', desc: 'Executive glass wall with sheen' },
  { type: 'wall_brick', label: 'Exposed Brick', color: '#994433', desc: 'Loft & pub rustic brick wall' },
  { type: 'door_wood', label: 'Wood Door', color: '#6e4726', desc: 'Standard office timber door' },
  { type: 'door_glass', label: 'Glass Door', color: '#a3d9ff', desc: 'Conference glass entryway' },
  { type: 'window_blinds', label: 'Window Blinds', color: '#a0b0c0', desc: 'Horizontal Venetian blinds window' },
];

const ALL_PROP_TYPES: Array<{
  type: PropType;
  label: string;
  category: 'desks' | 'seating' | 'tech' | 'breakroom' | 'decor' | 'pranks';
  width: number;
  height: number;
}> = [
  // Desks
  { type: 'desk_wood', label: 'Wood Sales Desk', category: 'desks', width: 2.0, height: 2.2 },
  { type: 'desk_michael', label: "Executive Desk", category: 'desks', width: 2.8, height: 2.0 },
  { type: 'desk_reception', label: 'Pam Reception Desk', category: 'desks', width: 3.0, height: 1.7 },
  { type: 'desk_modern', label: 'Modern Dev Desk', category: 'desks', width: 2.0, height: 2.0 },
  { type: 'conference_table', label: 'Conference Table', category: 'desks', width: 5.5, height: 2.2 },
  { type: 'high_top_table', label: 'High Top Table', category: 'desks', width: 2.0, height: 1.8 },

  // Seating
  { type: 'sofa_leather', label: 'Leather Sofa', category: 'seating', width: 3.0, height: 1.2 },
  { type: 'chair_office', label: 'Office Swivel Chair', category: 'seating', width: 1.0, height: 1.0 },
  { type: 'chair_conference', label: 'Conference Chair', category: 'seating', width: 1.0, height: 1.0 },

  // Tech & Appliances
  { type: 'pc_monitor', label: 'PC CRT Monitor', category: 'tech', width: 1.0, height: 1.0 },
  { type: 'photocopier', label: 'Xerox Photocopier', category: 'tech', width: 1.4, height: 1.4 },
  { type: 'server_rack', label: 'Blinking Server Rack', category: 'tech', width: 1.2, height: 2.2 },
  { type: 'jukebox', label: 'Retro Jukebox', category: 'tech', width: 1.5, height: 2.0 },

  // Breakroom
  { type: 'water_cooler', label: 'Water Cooler', category: 'breakroom', width: 1.0, height: 1.7 },
  { type: 'vending_machine', label: 'Snack Vending Machine', category: 'breakroom', width: 1.2, height: 2.0 },
  { type: 'coffee_bar', label: 'Coffee Station & Sink', category: 'breakroom', width: 2.2, height: 1.9 },
  { type: 'coffee_maker', label: 'Espresso Maker', category: 'breakroom', width: 1.0, height: 1.0 },
  { type: 'microwave', label: 'Microwave', category: 'breakroom', width: 1.0, height: 0.8 },
  { type: 'trash_can', label: 'Waste Basket', category: 'breakroom', width: 0.8, height: 0.8 },

  // Decor
  { type: 'potted_plant', label: 'Ficus Potted Plant', category: 'decor', width: 1.0, height: 1.4 },
  { type: 'whiteboard', label: 'Presentation Board', category: 'decor', width: 2.5, height: 0.8 },
  { type: 'filing_cabinet', label: 'Filing Cabinet', category: 'decor', width: 1.0, height: 1.9 },
  { type: 'liquor_shelf', label: 'Bar Liquor Shelf', category: 'decor', width: 2.5, height: 1.5 },
  { type: 'pub_fireplace', label: 'Cozy Fireplace', category: 'decor', width: 2.4, height: 1.2 },
  { type: 'neon_sign', label: 'Neon Sign', category: 'decor', width: 2.0, height: 1.0 },
  { type: 'framed_art', label: 'Framed Art / Diploma', category: 'decor', width: 1.5, height: 1.0 },
  { type: 'umbrella_stand', label: 'Umbrella Stand', category: 'decor', width: 0.8, height: 1.0 },

  // Pranks & Special
  { type: 'jello_stapler', label: 'Stapler in Jello', category: 'pranks', width: 2.0, height: 2.2 },
  { type: 'dundie_trophy', label: 'Dundie Trophy', category: 'pranks', width: 0.8, height: 1.0 },
  { type: 'french_horn', label: 'Blue French Horn', category: 'pranks', width: 1.0, height: 1.0 },
  { type: 'fire_hazard', label: 'Fire Drill Hazard', category: 'pranks', width: 1.0, height: 1.0 },
];

export const SoundstageAssetTray: React.FC<SoundstageAssetTrayProps> = ({
  activeCategory,
  onSelectCategory,
  selectedTileType,
  onSelectTileType,
  selectedPropType,
  onSelectPropType,
  selectedPrefab,
  onSelectPrefab,
  characters,
  selectedCharacterSpawn,
  onSelectCharacterSpawn,
}) => {
  const [propSubCat, setPropSubCat] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredProps = useMemo(() => {
    return ALL_PROP_TYPES.filter((p) => {
      const matchCat = propSubCat === 'all' || p.category === propSubCat;
      const matchSearch =
        !searchQuery ||
        p.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.type.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [propSubCat, searchQuery]);

  return (
    <div className="flex flex-col h-44 bg-[#111823] border-t-2 border-[#2a374a] text-white shrink-0 select-none z-10">
      {/* Category Tabs */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#0d141e] border-b border-[#243042]">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          <button
            onClick={() => onSelectCategory('tiles')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-mono font-bold rounded-t border-b-2 transition-colors ${
              activeCategory === 'tiles'
                ? 'bg-[#182333] border-amber-500 text-amber-400'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Tiles & Walls</span>
          </button>

          <button
            onClick={() => onSelectCategory('props')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-mono font-bold rounded-t border-b-2 transition-colors ${
              activeCategory === 'props'
                ? 'bg-[#182333] border-amber-500 text-amber-400'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <Armchair className="w-3.5 h-3.5" />
            <span>Props & Furniture</span>
          </button>

          <button
            onClick={() => onSelectCategory('prefabs')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-mono font-bold rounded-t border-b-2 transition-colors ${
              activeCategory === 'prefabs'
                ? 'bg-[#182333] border-amber-500 text-amber-400'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>1-Click Prefabs</span>
          </button>

          <button
            onClick={() => onSelectCategory('waypoints')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-mono font-bold rounded-t border-b-2 transition-colors ${
              activeCategory === 'waypoints'
                ? 'bg-[#182333] border-amber-500 text-amber-400'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-pink-400" />
            <span>Waypoints & Spawns</span>
          </button>

          <button
            onClick={() => onSelectCategory('zones')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-mono font-bold rounded-t border-b-2 transition-colors ${
              activeCategory === 'zones'
                ? 'bg-[#182333] border-amber-500 text-amber-400'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <Maximize className="w-3.5 h-3.5 text-blue-400" />
            <span>Room Zones</span>
          </button>
        </div>

        {/* Search for Props */}
        {activeCategory === 'props' && (
          <div className="relative w-48">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
            <input
              type="text"
              placeholder="Search props..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#182333] border border-[#2a374a] rounded pl-7 pr-2 py-1 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>
        )}
      </div>

      {/* Asset Content Container */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-2">
        {/* TAB 1: TILES & WALLS */}
        {activeCategory === 'tiles' && (
          <div className="flex gap-4 items-center h-full">
            <div className="flex flex-col gap-1 shrink-0">
              <span className="text-[10px] uppercase font-mono text-slate-400 font-bold">Flooring</span>
              <div className="flex gap-1.5">
                {FLOOR_TILES.map((t) => (
                  <button
                    key={t.type}
                    onClick={() => onSelectTileType(t.type)}
                    className={`flex flex-col items-center justify-center p-1.5 w-20 h-20 rounded border transition-all ${
                      selectedTileType === t.type
                        ? 'bg-amber-600/30 border-amber-400 text-amber-300 ring-2 ring-amber-500/50'
                        : 'bg-[#182333] hover:bg-[#202e42] border-[#2a374a] text-slate-300'
                    }`}
                    title={t.desc}
                  >
                    <div
                      className="w-8 h-8 rounded border border-slate-900 shadow-inner mb-1"
                      style={{ backgroundColor: t.color }}
                    />
                    <span className="text-[10px] font-mono truncate w-full text-center">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="w-[1px] h-20 bg-[#2a374a] shrink-0" />

            <div className="flex flex-col gap-1 shrink-0">
              <span className="text-[10px] uppercase font-mono text-slate-400 font-bold">Walls & Doors</span>
              <div className="flex gap-1.5">
                {WALL_TILES.map((t) => (
                  <button
                    key={t.type}
                    onClick={() => onSelectTileType(t.type)}
                    className={`flex flex-col items-center justify-center p-1.5 w-20 h-20 rounded border transition-all ${
                      selectedTileType === t.type
                        ? 'bg-amber-600/30 border-amber-400 text-amber-300 ring-2 ring-amber-500/50'
                        : 'bg-[#182333] hover:bg-[#202e42] border-[#2a374a] text-slate-300'
                    }`}
                    title={t.desc}
                  >
                    <div
                      className="w-8 h-8 rounded border border-slate-900 shadow-inner mb-1"
                      style={{ backgroundColor: t.color }}
                    />
                    <span className="text-[10px] font-mono truncate w-full text-center">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PROPS & FURNITURE */}
        {activeCategory === 'props' && (
          <div className="flex flex-col h-full gap-1.5">
            {/* Filter Sub-categories */}
            <div className="flex gap-1 shrink-0">
              {['all', 'desks', 'seating', 'tech', 'breakroom', 'decor', 'pranks'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setPropSubCat(cat)}
                  className={`px-2 py-0.5 text-[10px] uppercase font-mono rounded border ${
                    propSubCat === cat
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                      : 'bg-[#182333] text-slate-400 border-[#2a374a] hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Props Grid / Horizontal Scroller */}
            <div className="flex gap-2 overflow-x-auto pb-1 items-center">
              {filteredProps.map((p) => {
                const isSelected = selectedPropType === p.type;
                return (
                  <button
                    key={p.type}
                    onClick={() => {
                      onSelectPropType(p.type);
                      onSelectPrefab(null);
                    }}
                    className={`flex flex-col items-center justify-center p-2 w-24 h-20 rounded border shrink-0 transition-all ${
                      isSelected
                        ? 'bg-purple-600/30 border-purple-400 text-purple-300 ring-2 ring-purple-500/50'
                        : 'bg-[#182333] hover:bg-[#202e42] border-[#2a374a] text-slate-300'
                    }`}
                    title={`${p.label} (${p.width}x${p.height} tiles)`}
                  >
                    <Armchair className={`w-6 h-6 mb-1 ${isSelected ? 'text-purple-300' : 'text-slate-400'}`} />
                    <span className="text-[10px] font-mono truncate w-full text-center leading-tight">
                      {p.label}
                    </span>
                    <span className="text-[9px] font-mono text-slate-500">
                      {p.width}x{p.height}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: 1-CLICK PREFABS */}
        {activeCategory === 'prefabs' && (
          <div className="flex gap-3 items-center h-full">
            {SOUNDSTAGE_PREFABS.map((prefab) => {
              const isSelected = selectedPrefab?.id === prefab.id;
              return (
                <button
                  key={prefab.id}
                  onClick={() => onSelectPrefab(isSelected ? null : prefab)}
                  className={`flex flex-col justify-between p-2 w-48 h-24 rounded-lg border text-left shrink-0 transition-all ${
                    isSelected
                      ? 'bg-amber-600/30 border-amber-400 text-amber-200 ring-2 ring-amber-500/50'
                      : 'bg-[#182333] hover:bg-[#202e42] border-[#2a374a] text-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-xs font-bold text-amber-400 truncate">{prefab.name}</span>
                      <span className="text-[9px] px-1 py-0.5 bg-[#0e1622] rounded font-mono text-slate-400">
                        {prefab.props.length} props
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-2 leading-tight">
                      {prefab.description}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 mt-1">
                    <span>{prefab.category}</span>
                    <span className="text-amber-400 font-bold">{isSelected ? '✓ READY TO STAMP' : 'Click to Stamp'}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* TAB 4: WAYPOINTS & SPAWNS */}
        {activeCategory === 'waypoints' && (
          <div className="flex gap-4 items-center h-full">
            <div className="flex flex-col gap-1 shrink-0">
              <span className="text-[10px] uppercase font-mono text-pink-400 font-bold">Action Waypoint</span>
              <div className="flex items-center gap-2 p-2 bg-[#182333] border border-[#2a374a] rounded w-48 h-20">
                <MapPin className="w-8 h-8 text-pink-400 shrink-0" />
                <div className="text-xs">
                  <div className="font-bold text-pink-300">Navigation Node</div>
                  <div className="text-[10px] text-slate-400">Target for walk/interact beats</div>
                </div>
              </div>
            </div>

            <div className="w-[1px] h-20 bg-[#2a374a] shrink-0" />

            <div className="flex flex-col gap-1 shrink-0">
              <span className="text-[10px] uppercase font-mono text-yellow-400 font-bold">Character Spawn Points</span>
              <div className="flex gap-1.5 overflow-x-auto max-w-xl">
                {characters.map((c) => {
                  const isSelected = selectedCharacterSpawn === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => onSelectCharacterSpawn(c.id)}
                      className={`flex flex-col items-center justify-center p-1.5 w-20 h-20 rounded border shrink-0 transition-all ${
                        isSelected
                          ? 'bg-yellow-500/30 border-yellow-400 text-yellow-300 ring-2 ring-yellow-500/50'
                          : 'bg-[#182333] hover:bg-[#202e42] border-[#2a374a] text-slate-300'
                      }`}
                    >
                      <div
                        className="w-7 h-7 rounded-full border border-slate-800 shadow mb-1 flex items-center justify-center text-[10px] font-bold text-slate-950"
                        style={{ backgroundColor: c.visual.shirtColor }}
                      >
                        {c.name.charAt(0)}
                      </div>
                      <span className="text-[10px] font-mono truncate w-full text-center">{c.name.split(' ')[0]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: ROOM ZONES */}
        {activeCategory === 'zones' && (
          <div className="flex gap-3 items-center h-full">
            {[
              { id: 'office_zone', name: "Executive Office", color: '#fed7aa', desc: 'Private management office' },
              { id: 'bullpen_zone', name: "Sales Bullpen", color: '#bbf7d0', desc: 'Open workspace desks' },
              { id: 'conf_zone', name: "Conference Room", color: '#bfdbfe', desc: 'Meeting & presentation zone' },
              { id: 'break_zone', name: "Breakroom & Kitchen", color: '#fbcfe8', desc: 'Coffee & snack dining area' },
              { id: 'annex_zone', name: "The Annex", color: '#e2e8f0', desc: 'HR, Customer Service & Quiet zone' },
              { id: 'pub_zone', name: "Pub & Bar Floor", color: '#fde047', desc: 'Tavern booths and drinks' },
            ].map((z) => (
              <div
                key={z.id}
                className="flex flex-col justify-between p-2 w-44 h-24 rounded border border-[#2a374a] bg-[#182333] shrink-0"
              >
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-3.5 h-3.5 rounded border border-slate-900" style={{ backgroundColor: z.color }} />
                    <span className="text-xs font-bold text-white truncate">{z.name}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">{z.desc}</p>
                </div>
                <span className="text-[9px] font-mono text-blue-400">Use [Z] tool to draw box</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
