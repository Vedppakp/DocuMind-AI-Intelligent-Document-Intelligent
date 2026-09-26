import React, { useState, useEffect } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Copy,
  Check,
  FileText,
  Bookmark,
  Sparkles,
  Maximize2,
  ZoomIn,
  MessageSquare,
} from 'lucide-react';
import { useDocument } from '../context/DocumentContext';
import { cleanDocumentTitle } from '../utils/documentUtils';

export default function PdfDocumentViewerModal() {
  const {
    activePdfViewer,
    closePdfViewer,
    documents,
    setActiveTab,
    showToast,
  } = useDocument();

  const [currentPage, setCurrentPage] = useState(1);
  const [copied, setCopied] = useState(false);

  // Synchronize internal page state with active citation target page
  useEffect(() => {
    if (activePdfViewer.isOpen) {
      setCurrentPage(activePdfViewer.pageNumber || 1);
    }
  }, [activePdfViewer.isOpen, activePdfViewer.pageNumber, activePdfViewer.documentId]);

  // Handle keyboard navigation (Escape to close, arrows for pages)
  useEffect(() => {
    if (!activePdfViewer.isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closePdfViewer();
      } else if (e.key === 'ArrowLeft' && e.altKey) {
        handlePrevPage();
      } else if (e.key === 'ArrowRight' && e.altKey) {
        handleNextPage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePdfViewer.isOpen, currentPage]);

  if (!activePdfViewer.isOpen || !activePdfViewer.documentId) {
    return null;
  }

  const doc = documents.find((d) => d._id === activePdfViewer.documentId);
  const maxPages = doc?.pageCount || 100;
  const pdfUrl = `/api/documents/${activePdfViewer.documentId}/pdf#page=${currentPage}`;

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(maxPages, prev + 1));
  };

  const handleCopyExcerpt = () => {
    if (!activePdfViewer.excerpt) return;
    navigator.clipboard.writeText(activePdfViewer.excerpt);
    setCopied(true);
    showToast('Excerpt copied to clipboard', 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAskAboutPage = () => {
    closePdfViewer();
    setActiveTab('chat');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full h-full max-w-7xl max-h-[95vh] rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl flex flex-col overflow-hidden">
        {/* Top Control Bar */}
        <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs gap-3">
          {/* Document Title & Badge */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-white truncate max-w-xs sm:max-w-md">
                {cleanDocumentTitle(activePdfViewer.documentName || doc?.originalName || 'PDF Document')}
              </p>
              <p className="text-[11px] text-slate-400">
                Grounded Source Viewer • {doc?.pageCount || 1} total pages
              </p>
            </div>
          </div>

          {/* Page Navigation Controls */}
          <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-800">
            <button
              onClick={handlePrevPage}
              disabled={currentPage <= 1}
              className="p-1 rounded hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent text-slate-300"
              title="Previous Page (Alt + Left)"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-slate-300 font-medium px-1">
              Page <span className="font-bold text-brand-400">{currentPage}</span> of {maxPages}
            </span>

            <button
              onClick={handleNextPage}
              disabled={currentPage >= maxPages}
              className="p-1 rounded hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent text-slate-300"
              title="Next Page (Alt + Right)"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2">
            <a
              href={pdfUrl}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
              title="Open full PDF in browser tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Full Tab</span>
            </a>

            <button
              onClick={closePdfViewer}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 hover:text-rose-300 text-slate-400 transition-colors"
              title="Close Viewer (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Split Screen Workspace: PDF Viewer (Left) + Citation Passage Card (Right) */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 bg-slate-950">
          {/* Main Embedded PDF Viewport */}
          <div className="flex-1 min-h-[350px] md:min-h-0 relative bg-slate-950 flex flex-col">
            <iframe
              key={`${activePdfViewer.documentId}-p${currentPage}`}
              src={pdfUrl}
              className="w-full h-full border-0 bg-slate-900"
              title="Interactive PDF Viewer"
            />
          </div>

          {/* Ground-Truth Citation Inspector Panel */}
          <div className="w-full md:w-96 border-t md:border-t-0 md:border-l border-slate-800 bg-slate-900/95 flex flex-col shrink-0 overflow-y-auto">
            {/* Panel Header */}
            <div className="p-4 border-b border-slate-800 bg-slate-950/40">
              <div className="flex items-center gap-2 text-brand-400">
                <Bookmark className="w-4 h-4" />
                <span className="font-bold text-xs uppercase tracking-wider text-slate-300">
                  Grounded Citation Details
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Verified ground-truth passage retrieved from Page {currentPage}.
              </p>
            </div>

            {/* Badges & Metadata */}
            <div className="p-4 border-b border-slate-800/80 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Target Page:</span>
                <span className="px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 font-bold border border-brand-500/40">
                  📍 Page {currentPage}
                </span>
              </div>

              {activePdfViewer.score > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Semantic Relevance:</span>
                  <span className="font-semibold text-emerald-400 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    {(activePdfViewer.score * 100).toFixed(1)}% Match
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Document:</span>
                <span className="font-medium text-slate-200 truncate max-w-[180px]" title={activePdfViewer.documentName}>
                  {cleanDocumentTitle(activePdfViewer.documentName || doc?.originalName || 'PDF Document')}
                </span>
              </div>
            </div>

            {/* Highlighted Cited Passage */}
            <div className="p-4 flex-1 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  Exact Cited Passage
                </span>
                {activePdfViewer.excerpt && (
                  <button
                    onClick={handleCopyExcerpt}
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition-colors"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                )}
              </div>

              {activePdfViewer.excerpt ? (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-100 text-xs leading-relaxed font-sans relative shadow-inner">
                  <div className="absolute top-2 right-2 text-amber-500/40 select-none text-2xl font-serif leading-none">
                    “
                  </div>
                  <p className="relative z-10 whitespace-pre-wrap selection:bg-amber-400/40">
                    {activePdfViewer.excerpt}
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 text-center text-xs text-slate-400">
                  <p>Displaying Page {currentPage} in the viewer.</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Navigate pages using the controls above or scroll the document.
                  </p>
                </div>
              )}

              {/* RAG Verification Explainer */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 space-y-1.5">
                <div className="font-semibold text-slate-300 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-brand-400" />
                  <span>How DocuMind RAG Grounding Works:</span>
                </div>
                <p className="leading-relaxed">
                  Every answer from DocuMind is synthesized directly from these verified chunks. If information isn't grounded on these pages, strict grounding prevents fabricated facts.
                </p>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/40 space-y-2">
              <button
                onClick={handleAskAboutPage}
                className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-brand-600/20 flex items-center justify-center gap-2 transition-all active:scale-98"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Ask Question About This Page</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
