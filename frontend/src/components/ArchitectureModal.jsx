import React from 'react';
import {
  X,
  Sparkles,
  Database,
  Cpu,
  ShieldCheck,
  FileText,
  Layers,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

export default function ArchitectureModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const pipelineStages = [
    {
      num: 1,
      title: 'PDF Upload & Validation',
      desc: 'Multipart stream validates PDF MIME-type, page count, and binary integrity.',
      badge: 'Multer / Express',
      color: 'from-blue-600 to-sky-500',
    },
    {
      num: 2,
      title: 'Text Extraction & Cleaning',
      desc: 'Extracts raw text per page and repairs broken hyphenations and joined words.',
      badge: 'pdf-parse / PyMuPDF',
      color: 'from-sky-600 to-cyan-500',
    },
    {
      num: 3,
      title: 'Page Detection & Boundary Mapping',
      desc: 'Tracks page index metadata for every paragraph, enabling exact-page grounding.',
      badge: 'Page Numbering',
      color: 'from-cyan-600 to-teal-500',
    },
    {
      num: 4,
      title: 'Recursive Chunking',
      desc: 'Splits text into 500-token chunks with 100-token sliding overlap to preserve context.',
      badge: '500 tokens / 100 overlap',
      color: 'from-teal-600 to-emerald-500',
    },
    {
      num: 5,
      title: 'Embedding Generation',
      desc: 'Generates semantic vectors using Gemini text-embedding-004 or 128d local cosine engine.',
      badge: 'text-embedding-004',
      color: 'from-emerald-600 to-indigo-500',
    },
    {
      num: 6,
      title: 'Vector Store & Similarity Search',
      desc: 'Executes cosine similarity retrieval (Top-K=6) with score thresholding (s >= 0.22).',
      badge: 'In-Memory / MongoDB',
      color: 'from-indigo-600 to-violet-500',
    },
    {
      num: 7,
      title: 'Grounding Guard & LLM Synthesis',
      desc: 'Rejects uncorroborated queries; synthesizes answers with clickable [Page X] citations.',
      badge: 'Gemini 2.5 Flash / Strict RAG',
      color: 'from-violet-600 to-brand-600',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-4xl max-h-[90vh] rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl flex flex-col overflow-hidden">
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center border border-brand-500/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white tracking-tight">
                DocuMind RAG System Architecture
              </h3>
              <p className="text-xs text-slate-400">
                End-to-End Production Document Intelligence Pipeline
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 hover:text-rose-300 text-slate-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="p-4 rounded-xl bg-brand-500/10 border border-brand-500/30 text-xs text-brand-200 leading-relaxed">
            <p className="font-semibold text-brand-300 mb-1">
              Architecture Overview for Technical Viva / Defense:
            </p>
            DocuMind AI implements a Retrieval-Augmented Generation (RAG) architecture augmented with spatial page tracking and strict grounding filters. Documents undergo PDF parsing, paragraph unwrapping, sliding-window chunking, vector embedding, and similarity retrieval, guaranteeing that every response is verifiable by jumping to the exact source page.
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-brand-400" />
              <span>7-Stage Ingestion & Retrieval Pipeline</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {pipelineStages.map((stage) => (
                <div
                  key={stage.num}
                  className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start gap-3 hover:border-brand-500/40 transition-colors"
                >
                  <div
                    className={`w-7 h-7 rounded-lg bg-gradient-to-tr ${stage.color} text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-md`}
                  >
                    {stage.num}
                  </div>
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-200 text-xs truncate">
                        {stage.title}
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 text-[10px] font-mono shrink-0">
                        {stage.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {stage.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
              <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>Zero Hallucination Guard</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Queries with top chunk similarity score &lt; 0.22 are automatically rejected as unsupported to avoid fabrication.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
              <div className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                <FileText className="w-4 h-4" />
                <span>Page-Grounded Citations</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Citations are rendered as interactive buttons ([Page X]) that open the PDF viewer side-by-side with text highlighting.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
              <div className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                <Database className="w-4 h-4" />
                <span>Dual Engine Flexibility</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Runs on Gemini API (text-embedding-004 + 2.5 Flash) with fallback to deterministic local heuristic extraction.
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>DocuMind AI Architecture v2.0</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
