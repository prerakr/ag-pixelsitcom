import React, { useState } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  Code,
  Play,
  Download,
  ClipboardPaste,
  Lightbulb,
  FileCode,
  AlertCircle,
} from 'lucide-react';
import { SitcomScript } from '../types/script';
import { SettingDefinition } from '../types/environment';
import { CharacterDefinition } from '../types/character';
import { buildSitcomPrompt } from '../ai/promptTemplates';
import { parseAndValidateScript } from '../ai/scriptValidator';
import { PRESET_EPISODES } from '../data/episodes';
import { getShowIdForSetting } from '../data/settings';

interface ScriptStudioProps {
  isOpen: boolean;
  onClose: () => void;
  currentSetting: SettingDefinition;
  characters: CharacterDefinition[];
  currentScript: SitcomScript | null;
  onLoadScript: (script: SitcomScript) => void;
}

const INSPIRATION_MAP: Record<string, string[]> = {
  the_office: [
    'Michael brings a karaoke machine and forces everyone to audition for The Scrantones.',
    'Dwight declares Schrute Farms sovereignty over the conference room and charges tolls.',
    'Jim installs a motion sensor prank under Dwight’s chair that plays airhorns.',
    'Kevin accidentally invests the entire branch budget into an artisan pretzel truck.',
    'Angela brings five new rescue cats into accounting, triggering a full bullpen allergy crisis.',
  ],
  friends: [
    'Ross claims he achieved Level 5 Unagi and challenges Joey and Chandler to a surprise ninja duel.',
    'Monica discovers a microscopic coffee stain on the orange couch and initiates DEFCON 1 cleaning.',
    'Joey auditions for a high-concept commercial where he must eat 12 meatball subs in one take.',
    'Phoebe writes a 14-verse acoustic ballad about Gunther’s mysterious hair bleached by the sun.',
    'Chandler tries to prove his job is real by presenting statistical charts to Rachel.',
  ],
  silicon_valley: [
    'Jian-Yang launches SeeFood 2.0 which detects whether Dinesh’s chain is fake gold.',
    'Gilfoyle hacks the smart fridge to mine crypto whenever Erlich mentions Aviato.',
    'Richard stresses over tabs vs spaces and rewrites the entire middle-out loop during 3 AM panic.',
    'Big Head accidentally buys a majority stake in a company that sells organic air.',
    'Jared pledges absolute allegiance to Richard by refusing to sleep until compression reaches 6.0.',
  ],
  himym: [
    'Barney attempts The Scuba Diver play at the bar booth while Marshall prepares a Slap Bet sting.',
    'Ted buys another pair of Red Cowboy Boots and claims they provide acoustic clarity for blueprints.',
    'Robin receives a platinum cassette tape containing unreleased Robin Sparkles mall demos.',
    'Lily applies Aldrin Justice to Barney by confiscating his favorite silk tie until he tells the truth.',
    'Marshall searches MacLaren’s basement for evidence of the Loch Ness Monster.',
  ],
};

export const ScriptStudio: React.FC<ScriptStudioProps> = ({
  isOpen,
  onClose,
  currentSetting,
  characters,
  currentScript,
  onLoadScript,
}) => {
  // First tab is always Master Reusable Prompt
  const [activeTab, setActiveTab] = useState<'prompt' | 'editor'>('prompt');

  const showKey = getShowIdForSetting(currentSetting.id);
  const inspirationList = INSPIRATION_MAP[showKey] || INSPIRATION_MAP.the_office;

  // Prompt Builder State
  const [userIdea, setUserIdea] = useState(() => inspirationList[0]);
  const [copied, setCopied] = useState(false);

  // Editor State
  const [jsonCode, setJsonCode] = useState(() =>
    currentScript ? JSON.stringify(currentScript, null, 2) : ''
  );
  const [editorError, setEditorError] = useState<string | null>(null);
  const [editorSuccess, setEditorSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentPrompt = buildSitcomPrompt(currentSetting, characters, userIdea);

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(currentPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setJsonCode(text);
      validateAndPreview(text);
    } catch {
      // Fallback if clipboard API restricted
    }
  };

  const validateAndPreview = (code: string) => {
    setEditorError(null);
    setEditorSuccess(false);
    const result = parseAndValidateScript(code);
    if (!result.isValid || !result.script) {
      setEditorError(result.errors.join('\n'));
      return null;
    }
    setEditorSuccess(true);
    return result.script;
  };

  const handleRunJson = () => {
    const validScript = validateAndPreview(jsonCode);
    if (validScript) {
      onLoadScript(validScript);
      onClose();
    }
  };

  const handleLoadSample = (sampleIdx: number) => {
    const sample = PRESET_EPISODES[sampleIdx];
    if (sample) {
      const code = JSON.stringify(sample, null, 2);
      setJsonCode(code);
      validateAndPreview(code);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([jsonCode], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pixelsitcom_${currentSetting.id}_script.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-[#131b26] border-4 border-[#2a374a] shadow-2xl rounded-xl overflow-hidden flex flex-col text-white max-h-[92vh]">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-[#0b0f17] border-b-2 border-[#2a374a] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-amber-500 rounded text-slate-950 font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="pixel-font text-xs sm:text-sm text-amber-400 font-bold">
                AI SCRIPT STUDIO
              </h3>
              <p className="text-[10px] text-slate-400 font-mono hidden sm:block">
                Generate scripts with any LLM & play them instantly
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 px-3 bg-[#1e293b] hover:bg-red-600 rounded text-slate-300 hover:text-white font-mono text-xs transition-colors"
            >
              ✕ CLOSE
            </button>
          </div>
        </div>

        {/* Studio Navigation Tabs (Prompt is Tab #1) */}
        <div className="flex items-center bg-[#0e1520] border-b border-[#2a374a] px-3 sm:px-6 shrink-0">
          <button
            onClick={() => setActiveTab('prompt')}
            className={`flex items-center gap-2 py-2.5 px-4 font-mono text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'prompt'
                ? 'border-amber-400 text-amber-400 bg-[#16202e]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <span>1. MASTER AI PROMPT</span>
          </button>

          <button
            onClick={() => setActiveTab('editor')}
            className={`flex items-center gap-2 py-2.5 px-4 font-mono text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'editor'
                ? 'border-emerald-400 text-emerald-400 bg-[#16202e]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code className="w-4 h-4 text-emerald-400" />
            <span>2. LOAD & PLAY SCRIPT</span>
          </button>
        </div>

        {/* TAB 1: MASTER REUSABLE AI PROMPT */}
        {activeTab === 'prompt' && (
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
            {/* Quick 3-Step Guide */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 bg-[#0b0f17] p-3 rounded-lg border border-[#2a374a] text-xs font-mono">
              <div className="flex items-center gap-2 text-amber-300">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center font-bold text-amber-400 shrink-0">
                  1
                </span>
                <span>Type or pick episode premise</span>
              </div>
              <div className="flex items-center gap-2 text-blue-300">
                <span className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center font-bold text-blue-400 shrink-0">
                  2
                </span>
                <span>Copy prompt to ChatGPT/Claude</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-300">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center font-bold text-emerald-400 shrink-0">
                  3
                </span>
                <span>Paste JSON in Tab 2 & hit Play</span>
              </div>
            </div>

            {/* Premise Input & Inspiration Ideas */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-mono text-amber-400 font-bold">
                  EPISODE PREMISE / IDEA:
                </label>
                <span className="text-[10px] text-slate-400 font-mono">
                  Setting: {currentSetting.showTitle} ({currentSetting.name})
                </span>
              </div>
              <textarea
                value={userIdea}
                onChange={(e) => setUserIdea(e.target.value)}
                rows={2}
                className="w-full bg-[#0b0f17] border border-[#2a374a] focus:border-amber-500 rounded-lg p-2.5 text-xs text-slate-200 outline-none font-mono resize-none shadow-inner"
                placeholder="What happens in this episode? (e.g. Dwight brings a petting zoo into the bullpen...)"
              />

              {/* Quick Inspiration Chips */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-[10px] font-mono text-slate-400">Try Ideas:</span>
                {inspirationList.map((idea, idx) => (
                  <button
                    key={idx}
                    onClick={() => setUserIdea(idea)}
                    className="text-[10px] px-2 py-0.5 bg-[#1b2636] hover:bg-amber-600 hover:text-white text-slate-300 rounded font-mono truncate max-w-[260px] transition-colors"
                  >
                    "{idea}"
                  </button>
                ))}
              </div>
            </div>

            {/* Generated LLM Master Prompt Box */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-mono text-slate-300 font-bold">
                    STANDARDIZED PROMPT FOR ANY LLM
                  </span>
                </div>

                <button
                  onClick={handleCopyPrompt}
                  className={`pixel-btn text-[9px] px-3.5 py-1.5 flex items-center gap-1.5 ${
                    copied ? 'bg-emerald-600 text-white' : 'btn-primary'
                  }`}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'COPIED TO CLIPBOARD!' : 'COPY PROMPT'}</span>
                </button>
              </div>

              <div className="relative">
                <textarea
                  readOnly
                  value={currentPrompt}
                  rows={9}
                  className="w-full bg-[#090d14] border border-[#2a374a] rounded-lg p-3 text-[11px] font-mono text-slate-300 leading-relaxed outline-none resize-none select-all"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <p className="text-[11px] text-slate-400 font-mono">
                  Compatible with <strong>ChatGPT (GPT-4o)</strong>, <strong>Claude 3.5</strong>, <strong>Gemini 2.0</strong>, <strong>DeepSeek</strong>, and local LLMs.
                </p>

                <button
                  onClick={() => setActiveTab('editor')}
                  className="pixel-btn text-[9px] px-3 py-1.5 bg-[#1c283a] text-emerald-400 hover:text-white flex items-center gap-1"
                >
                  <span>GO TO SCRIPT LOADER</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: LOAD & PLAY SCRIPT */}
        {activeTab === 'editor' && (
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex flex-col space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-mono text-slate-200 font-bold">
                  PASTE EPISODE JSON SCRIPT:
                </span>
                {editorSuccess && (
                  <span className="text-[10px] px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-600 rounded font-mono flex items-center gap-1">
                    <Check className="w-3 h-3" /> Valid Script
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Sample scripts quick loader */}
                <select
                  onChange={(e) => handleLoadSample(Number(e.target.value))}
                  defaultValue=""
                  aria-label="Load Preset Sample Episode"
                  className="bg-[#0b0f17] border border-[#2a374a] text-[11px] font-mono text-slate-300 px-2 py-1 rounded cursor-pointer outline-none"
                >
                  <option value="" disabled>
                    Load Sample Script...
                  </option>
                  {PRESET_EPISODES.map((ep, idx) => (
                    <option key={idx} value={idx}>
                      {ep.title}
                    </option>
                  ))}
                </select>

                <button
                  onClick={handlePasteClipboard}
                  className="pixel-btn text-[9px] px-2.5 py-1 flex items-center gap-1 bg-[#1b2636]"
                  title="Paste directly from clipboard"
                >
                  <ClipboardPaste className="w-3 h-3 text-cyan-400" />
                  <span>PASTE</span>
                </button>

                <button
                  onClick={handleDownload}
                  className="pixel-btn text-[9px] px-2.5 py-1 flex items-center gap-1 bg-[#1b2636]"
                  title="Download JSON File"
                >
                  <Download className="w-3 h-3 text-amber-400" />
                  <span>EXPORT</span>
                </button>
              </div>
            </div>

            {/* Code Editor Box */}
            <div className="flex-1 min-h-[220px] flex flex-col">
              <textarea
                value={jsonCode}
                onChange={(e) => {
                  setJsonCode(e.target.value);
                  validateAndPreview(e.target.value);
                }}
                className="flex-1 w-full bg-[#080c12] border border-[#2a374a] focus:border-emerald-500 rounded-lg p-3 font-mono text-xs text-emerald-300 leading-relaxed outline-none resize-none shadow-inner"
                placeholder='Paste generated SitcomScript JSON here (e.g. { "version": "1.0", "title": "My Episode", "scenes": [...] })'
              />
            </div>

            {/* Error Message if JSON Invalid */}
            {editorError && (
              <div className="p-3 bg-red-950/80 border border-red-500 rounded-lg text-xs font-mono text-red-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div className="overflow-x-auto">
                  <p className="font-bold">Script Validation Error:</p>
                  <pre className="text-[11px] whitespace-pre-wrap">{editorError}</pre>
                </div>
              </div>
            )}

            {/* Run Button Bar */}
            <div className="flex items-center justify-between pt-2 border-t border-[#2a374a]">
              <span className="text-[11px] text-slate-400 font-mono">
                Click Play to load this script into the top-down visualizer!
              </span>

              <button
                onClick={handleRunJson}
                className="pixel-btn btn-primary text-xs px-5 py-2.5 flex items-center gap-2 glow-active"
              >
                <Play className="w-4 h-4 fill-white" />
                <span className="font-bold">LOAD & PLAY EPISODE NOW</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
