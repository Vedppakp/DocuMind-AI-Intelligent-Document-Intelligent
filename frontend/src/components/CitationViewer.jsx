import React from 'react';
import { X, Bookmark, Copy, Check, ExternalLink, FileText } from 'lucide-react';
import { useDocument } from '../context/DocumentContext';

export default function CitationViewer() {
  const { activeCitation, setActiveCitation, showToast } = useDocument();
  const [copied, setCopied] = React.useState(false);

  if (!activeCitation) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(activeCitation.text);
    setCopied(true);
    showToast('Excerpt copied to clipboard', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-96 bg-slate-900/95 backdrop-blur-md border-l border-slate-800 shadow-2xl flex flex-col animate-slideLeft">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-500/20 text-brand-400 flex items-center justify-center">
            <Bookmark className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white tracking-tight">Source Citation</h4>
            <p className="text-[11px] text-slate-400">Verified ground-truth chunk</p>
          </div>
        </div>
        <button
          onClick={() => setActiveCitation(null)}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Meta tags */}
      <div className="p-4 bg-slate-950/40 border-b border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">Document:</span>
          <span className="font-semibold text-slate-200 truncate max-w-[200px]" title={activeCitation.documentName}>
            {activeCitation.documentName || 'Active Document'}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">Source Location:</span>
          <span className="px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 font-bold border border-brand-500/30">
            Page {activeCitation.pageNumber}
          </span>
        </div>
        {activeCitation.score !== undefined && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Semantic Relevance:</span>
            <span className="font-semibold text-emerald-400">
              {(activeCitation.score * 100).toFixed(1)}%
            </span>
          </div>
        )}
      </div>

      {/* Excerpt Body */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Exact PDF Text Excerpt
          </span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-brand-300 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-wrap selection:bg-brand-500/40">
          {activeCitation.text}
        </div>

        <div className="p-3 rounded-lg bg-brand-950/30 border border-brand-800/40 text-[11px] text-slate-400 flex items-start gap-2">
          <FileText className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
          <span>
            This excerpt was extracted directly from Page {activeCitation.pageNumber} of the PDF and used by the RAG model to formulate the answer.
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40 flex justify-end">
        <button
          onClick={() => setActiveCitation(null)}
          className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition-colors"
        >
          Close Inspector
        </button>
      </div>
    </div>
  );
}
