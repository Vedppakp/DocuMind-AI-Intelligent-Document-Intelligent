import React, { useState, useEffect } from 'react';
import {
  X,
  Key,
  Cpu,
  Sliders,
  ExternalLink,
  Check,
  ShieldCheck,
  Thermometer,
  FileText,
} from 'lucide-react';
import { useDocument } from '../context/DocumentContext';

export default function SettingsModal() {
  const {
    showSettingsModal,
    setShowSettingsModal,
    strictGrounding,
    temperature,
    responseLength,
    selectedModel,
    updateAiSettings,
    showToast,
  } = useDocument();

  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState(selectedModel || 'gemini-2.5-flash');
  const [temp, setTemp] = useState(temperature ?? 0.2);
  const [grounding, setGrounding] = useState(strictGrounding ?? true);
  const [respLength, setRespLength] = useState(responseLength || 'balanced');
  const [chunkSize, setChunkSize] = useState(700);
  const [chunkOverlap, setChunkOverlap] = useState(120);

  useEffect(() => {
    const savedKey = localStorage.getItem('documind_gemini_key') || '';
    const savedChunkSize = localStorage.getItem('documind_chunk_size') || 700;
    const savedChunkOverlap = localStorage.getItem('documind_chunk_overlap') || 120;

    setApiKey(savedKey);
    setModel(selectedModel || 'gemini-2.5-flash');
    setTemp(temperature ?? 0.2);
    setGrounding(strictGrounding ?? true);
    setRespLength(responseLength || 'balanced');
    setChunkSize(Number(savedChunkSize));
    setChunkOverlap(Number(savedChunkOverlap));
  }, [showSettingsModal, selectedModel, temperature, strictGrounding, responseLength]);

  if (!showSettingsModal) return null;

  const handleSave = () => {
    if (apiKey.trim()) {
      localStorage.setItem('documind_gemini_key', apiKey.trim());
    } else {
      localStorage.removeItem('documind_gemini_key');
    }

    updateAiSettings({
      newStrictGrounding: grounding,
      newTemp: temp,
      newLength: respLength,
      newModel: model,
    });

    localStorage.setItem('documind_chunk_size', String(chunkSize));
    localStorage.setItem('documind_chunk_overlap', String(chunkOverlap));

    showToast('AI and RAG settings saved successfully', 'success');
    setShowSettingsModal(false);
  };

  const handleClearKey = () => {
    setApiKey('');
    localStorage.removeItem('documind_gemini_key');
    showToast('Gemini API Key removed. Using Local RAG Fallback mode.', 'info');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-5 sm:p-6 relative">
        <button
          onClick={() => setShowSettingsModal(false)}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-5">
          <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Sliders className="w-5 h-5 text-brand-400" />
            AI & RAG Pipeline Controls
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Configure LLM models, strict factual grounding, temperature, and semantic retrieval parameters.
          </p>
        </div>

        <div className="space-y-4 text-xs">
          {/* API Key */}
          <div className="space-y-1.5 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                <span>Google Gemini API Key</span>
              </label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-brand-400 hover:text-brand-300 flex items-center gap-1 text-[11px]"
              >
                <span>Get Free Key</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy... (leave blank to run in Local RAG mode)"
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-brand-500 text-slate-100 font-mono text-xs outline-none"
            />
            <p className="text-[11px] text-slate-500">
              Your key remains confidential in local browser storage.
            </p>
          </div>

          {/* Strict Grounding Guard */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Strict Fact Grounding</span>
                <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                  Recommended
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                When enabled, the AI strictly refuses to answer and states <em>"I couldn't find this information in your documents"</em> rather than hallucinating when relevant chunks are absent.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setGrounding((prev) => !prev)}
              className={`w-12 h-6 rounded-full transition-colors relative shrink-0 p-0.5 ${
                grounding ? 'bg-brand-600' : 'bg-slate-800'
              }`}
            >
              <span
                className={`block w-5 h-5 rounded-full bg-white transition-transform ${
                  grounding ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Model Selection */}
          <div className="space-y-1.5 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <label className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              <span>Generation Model</span>
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 outline-none focus:border-brand-500"
            >
              <option value="gemini-2.5-flash">gemini-2.5-flash (Fast, High Reasoning, Multimodal)</option>
              <option value="gemini-2.5-pro">gemini-2.5-pro (Deep complex cross-document synthesis)</option>
            </select>
          </div>

          {/* Temperature Slider */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Thermometer className="w-3.5 h-3.5 text-rose-400" />
                <span>Creativity & Temperature:</span>
              </label>
              <span className="font-mono text-brand-300 font-bold">{temp.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={temp}
              onChange={(e) => setTemp(parseFloat(e.target.value))}
              className="w-full accent-brand-500"
            />
            <div className="flex items-center justify-between text-[10px] text-slate-500">
              <span>0.0 (Deterministic / Grounded)</span>
              <span>0.5 (Balanced)</span>
              <span>1.0 (Creative)</span>
            </div>
          </div>

          {/* Response Length & Format */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <label className="font-semibold text-slate-200 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-purple-400" />
              <span>Response Depth & Style</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'concise', label: 'Concise', desc: 'Brief key takeaways' },
                { id: 'balanced', label: 'Balanced', desc: 'Optimal depth' },
                { id: 'detailed', label: 'Exhaustive', desc: 'In-depth analysis' },
              ].map((style) => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => setRespLength(style.id)}
                  className={`p-2 rounded-xl border text-left transition-all ${
                    respLength === style.id
                      ? 'bg-brand-600/20 border-brand-500 text-brand-200 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <p className="text-xs">{style.label}</p>
                  <p className="text-[10px] opacity-70 font-normal">{style.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Chunking strategy */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-brand-400" />
              <span>RAG Spatial Chunking</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-400">Chunk Size (chars):</label>
                <input
                  type="number"
                  value={chunkSize}
                  onChange={(e) => setChunkSize(Number(e.target.value))}
                  min={300}
                  max={2000}
                  step={50}
                  className="w-full mt-1 p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400">Overlap (chars):</label>
                <input
                  type="number"
                  value={chunkOverlap}
                  onChange={(e) => setChunkOverlap(Number(e.target.value))}
                  min={50}
                  max={400}
                  step={20}
                  className="w-full mt-1 p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modal actions */}
        <div className="mt-5 flex items-center justify-between pt-3 border-t border-slate-800">
          {apiKey ? (
            <button
              onClick={handleClearKey}
              className="text-xs text-rose-400 hover:text-rose-300"
            >
              Clear API Key
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettingsModal(false)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-600/25 active:scale-95 transition-all"
            >
              Save Controls
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
