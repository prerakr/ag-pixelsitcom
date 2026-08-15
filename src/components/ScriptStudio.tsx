import React, { useState } from 'react';
import { Sparkles, Copy, Check, Code, Play, Download, Upload, Lightbulb, Key, AlertCircle } from 'lucide-react';
import { SitcomScript } from '../types/script';
import { SettingDefinition } from '../types/environment';
import { CharacterDefinition } from '../types/character';
import { COMEDY_PRESET_IDEAS, generateSitcomEpisode } from '../ai/scriptGenerator';
import { buildSitcomPrompt } from '../ai/promptTemplates';
import { parseAndValidateScript } from '../ai/scriptValidator';

interface ScriptStudioProps {
  isOpen: boolean;
  onClose: () => void;
  currentSetting: SettingDefinition;
  characters: CharacterDefinition[];
  currentScript: SitcomScript | null;
  onLoadScript: (script: SitcomScript) => void;
}

export const ScriptStudio: React.FC<ScriptStudioProps> = ({
  isOpen,
  onClose,
  currentSetting,
  characters,
  currentScript,
  onLoadScript,
}) => {
  const [activeTab, setActiveTab] = useState<'generator' | 'prompt' | 'editor'>('generator');

  // Generator State
  const [userIdea, setUserIdea] = useState(
    'Michael brings a karaoke machine to the office and forces everyone to audition for The Scrantones.'
  );
  const [provider, setProvider] = useState<'mock' | 'gemini' | 'openai'>('mock');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('pixelsitcom_api_key') || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  // Prompt Builder State
  const [copied, setCopied] = useState(false);

  // Editor State
  const [jsonCode, setJsonCode] = useState(() =>
    currentScript ? JSON.stringify(currentScript, null, 2) : ''
  );
  const [editorError, setEditorError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('pixelsitcom_api_key', key);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenError(null);

    try {
      const generated = await generateSitcomEpisode({
        provider,
        apiKey,
        userIdea,
        setting: currentSetting,
        characters,
      });

      onLoadScript(generated);
      setJsonCode(JSON.stringify(generated, null, 2));
      onClose();
    } catch (err: any) {
      setGenError(err.message || 'Failed to generate episode script');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyPrompt = () => {
    const prompt = buildSitcomPrompt(currentSetting, characters, userIdea);
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRunJson = () => {
    setEditorError(null);
    const result = parseAndValidateScript(jsonCode);
    if (!result.isValid || !result.script) {
      setEditorError(result.errors.join('\n'));
      return;
    }

    onLoadScript(result.script);
    onClose();
  };

  const handleDownload = () => {
    const blob = new Blob([jsonCode], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentScript?.title?.replace(/\s+/g, '_').toLowerCase() || 'episode'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      setJsonCode(content);
      const result = parseAndValidateScript(content);
      if (result.isValid && result.script) {
        onLoadScript(result.script);
        setEditorError(null);
      } else {
        setEditorError(result.errors.join('\n'));
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#131b26] border-4 border-[#2a374a] shadow-2xl rounded-xl overflow-hidden flex flex-col text-white">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-[#0b0f17] border-b-2 border-[#2a374a]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500 text-slate-950 rounded border border-amber-300 font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="pixel-font text-sm text-amber-400 font-bold">
                AI SCRIPT STUDIO & GENERATOR
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Generate new comedic episodes, export prompts, or customize SitcomScript JSON
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 px-3 bg-[#1e293b] hover:bg-red-600 rounded text-slate-300 hover:text-white font-mono text-sm transition-colors"
          >
            ✕ CLOSE
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#2a374a] bg-[#0c1017] px-6">
          <button
            onClick={() => setActiveTab('generator')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-mono font-bold border-b-2 transition-colors ${
              activeTab === 'generator'
                ? 'border-amber-400 text-amber-400 bg-[#131b26]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>AI GENERATOR</span>
          </button>

          <button
            onClick={() => setActiveTab('prompt')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-mono font-bold border-b-2 transition-colors ${
              activeTab === 'prompt'
                ? 'border-amber-400 text-amber-400 bg-[#131b26]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Copy className="w-4 h-4" />
            <span>REUSABLE LLM PROMPT</span>
          </button>

          <button
            onClick={() => setActiveTab('editor')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-mono font-bold border-b-2 transition-colors ${
              activeTab === 'editor'
                ? 'border-amber-400 text-amber-400 bg-[#131b26]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code className="w-4 h-4" />
            <span>JSON SCRIPT EDITOR</span>
          </button>
        </div>

        {/* Modal Body Tabs */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#131b26]">
          {/* TAB 1: AI GENERATOR */}
          {activeTab === 'generator' && (
            <div className="space-y-5">
              {/* Preset Idea Inspiration Pills */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-mono text-amber-300 font-bold mb-2">
                  <Lightbulb className="w-3.5 h-3.5" />
                  PRESET COMEDY PREMISES (CLICK TO USE):
                </label>
                <div className="flex flex-wrap gap-2">
                  {COMEDY_PRESET_IDEAS.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => setUserIdea(item.idea)}
                      className="text-xs px-3 py-1.5 bg-[#1e293b] hover:bg-amber-600/80 hover:text-white border border-[#2a374a] rounded text-slate-300 transition-colors text-left"
                    >
                      {item.title}
                    </button>
                  ))}
                </div>
              </div>

              {/* User Idea Input */}
              <div>
                <label className="block text-xs font-mono text-slate-300 font-bold mb-2">
                  EPISODE PREMISE / SCENARIO:
                </label>
                <textarea
                  value={userIdea}
                  onChange={(e) => setUserIdea(e.target.value)}
                  rows={3}
                  className="w-full bg-[#0b0f17] border-2 border-[#2a374a] rounded-lg p-3 text-sm text-slate-100 font-mono focus:border-amber-500 outline-none"
                  placeholder="Describe your comedy premise (e.g. Jim puts Dwight's desk in the elevator, Michael discovers TikTok...)"
                />
              </div>

              {/* Provider Selection & API Key */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#0b0f17] p-4 rounded-lg border border-[#2a374a]">
                <div>
                  <label className="block text-xs font-mono text-slate-300 font-bold mb-2">
                    GENERATION ENGINE:
                  </label>
                  <select
                    value={provider}
                    onChange={(e) => setProvider(e.target.value as any)}
                    className="w-full bg-[#131b26] border border-[#2a374a] rounded p-2 text-xs text-slate-200 outline-none font-mono"
                  >
                    <option value="mock">⚡ Instant Procedural AI (No Key Needed)</option>
                    <option value="gemini">✨ Google Gemini 1.5 Flash (API Key)</option>
                    <option value="openai">🤖 OpenAI GPT-4o-mini (API Key)</option>
                  </select>
                </div>

                {provider !== 'mock' && (
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-mono text-slate-300 font-bold mb-2">
                      <Key className="w-3.5 h-3.5 text-amber-400" />
                      API KEY:
                    </label>
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => handleSaveApiKey(e.target.value)}
                      placeholder={`Enter ${provider === 'gemini' ? 'Gemini' : 'OpenAI'} API Key`}
                      className="w-full bg-[#131b26] border border-[#2a374a] rounded p-2 text-xs text-slate-200 outline-none font-mono focus:border-amber-500"
                    />
                  </div>
                )}
              </div>

              {/* Error Box */}
              {genError && (
                <div className="flex items-start gap-2 bg-red-950/80 border border-red-500 rounded p-3 text-xs text-red-200">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{genError}</span>
                </div>
              )}

              {/* Generate Button */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !userIdea.trim()}
                  className="pixel-btn btn-primary text-xs px-6 py-3 flex items-center gap-2 disabled:opacity-50"
                >
                  <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                  <span>{isGenerating ? 'GENERATING EPISODE...' : 'GENERATE & PLAY'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: REUSABLE PROMPT BUILDER */}
          {activeTab === 'prompt' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-mono text-amber-300 font-bold">
                    UNIVERSAL SITCOM MASTER PROMPT
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Copy this prompt into ChatGPT, Claude, Gemini, or local LLMs to generate valid episode scripts.
                  </p>
                </div>
                <button
                  onClick={handleCopyPrompt}
                  className="pixel-btn btn-primary text-[10px] px-3 py-2 flex items-center gap-1.5"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'COPIED!' : 'COPY PROMPT'}</span>
                </button>
              </div>

              <textarea
                readOnly
                value={buildSitcomPrompt(currentSetting, characters, userIdea)}
                rows={14}
                className="w-full bg-[#0b0f17] border-2 border-[#2a374a] rounded-lg p-3 text-xs text-slate-300 font-mono leading-relaxed select-all"
              />
            </div>
          )}

          {/* TAB 3: SCRIPT JSON EDITOR */}
          {activeTab === 'editor' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRunJson}
                    className="pixel-btn btn-primary text-[10px] px-3 py-1.5 flex items-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>LOAD & PLAY</span>
                  </button>

                  <button
                    onClick={handleDownload}
                    className="pixel-btn text-[10px] px-3 py-1.5 flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>DOWNLOAD JSON</span>
                  </button>

                  <label className="pixel-btn text-[10px] px-3 py-1.5 flex items-center gap-1.5 cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>IMPORT FILE</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <span className="text-[11px] font-mono text-slate-400">
                  Schema: SitcomScript v1.0
                </span>
              </div>

              {editorError && (
                <div className="bg-red-950/80 border border-red-500 rounded p-2.5 text-xs text-red-200 font-mono whitespace-pre-wrap">
                  {editorError}
                </div>
              )}

              <textarea
                value={jsonCode}
                onChange={(e) => setJsonCode(e.target.value)}
                rows={16}
                className="w-full bg-[#0b0f17] border-2 border-[#2a374a] rounded-lg p-3 text-xs text-amber-200/90 font-mono leading-relaxed focus:border-amber-500 outline-none"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
