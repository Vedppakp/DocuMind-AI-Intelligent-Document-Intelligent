import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Sparkles,
  CheckCircle2,
  ListTodo,
  Tag,
  Download,
  RotateCw,
  FileText,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Copy,
  Check,
  Cpu,
  Layers,
  BarChart2,
} from 'lucide-react';
import { useDocument } from '../context/DocumentContext';
import { toolApi } from '../services/api';
import { cleanDocumentTitle, getDocumentFileType } from '../utils/documentUtils';

export default function DocumentSummaryView() {
  const { activeDocument, setActiveTab, showToast } = useDocument();
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copiedSection, setCopiedSection] = useState(null);

  // Accordion open states
  const [openSections, setOpenSections] = useState({
    overview: true,
    findings: true,
    methodology: true,
    recommendations: true,
    topics: true,
  });

  useEffect(() => {
    if (activeDocument) {
      if (activeDocument.summary && activeDocument.summary.executive) {
        setSummaryData(activeDocument.summary);
      } else {
        loadSummary();
      }
    }
  }, [activeDocument]);

  const loadSummary = async (regenerate = false) => {
    if (!activeDocument) return;
    setLoading(true);
    setError(null);
    try {
      const res = await toolApi.summarize(activeDocument._id, regenerate);
      if (res.data.success) {
        setSummaryData(res.data.summary);
        if (regenerate) {
          showToast('Executive summary regenerated successfully', 'success');
        }
      }
    } catch (err) {
      console.error('Summary error:', err);
      setError(err.response?.data?.error || 'Failed to generate summary');
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (key) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleAll = (expand) => {
    setOpenSections({
      overview: expand,
      findings: expand,
      methodology: expand,
      recommendations: expand,
      topics: expand,
    });
  };

  const handleCopySection = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(key);
    showToast('Copied section to clipboard', 'info');
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const handleDownloadReport = async () => {
    if (!activeDocument) return;
    try {
      const res = await toolApi.getReport(activeDocument._id);
      if (res.data.success) {
        const element = document.createElement('a');
        const file = new Blob([res.data.report.markdown], { type: 'text/markdown' });
        element.href = URL.createObjectURL(file);
        element.download = `${cleanDocumentTitle(activeDocument.originalName)}_Executive_Brief.md`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        showToast('Report downloaded', 'success');
      }
    } catch (err) {
      showToast('Error downloading report', 'error');
    }
  };

  if (!activeDocument) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-950/20">
        <FileText className="w-12 h-12 text-slate-600 mb-2" />
        <h3 className="text-base font-bold text-white">No Document Selected</h3>
        <p className="text-xs text-slate-400 mt-1">Please select an uploaded PDF to view its executive briefing.</p>
      </div>
    );
  }

  const cleanTitle = cleanDocumentTitle(activeDocument.originalName);
  const fileType = getDocumentFileType(activeDocument.originalName);

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Executive Briefing Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 text-xs font-semibold border border-brand-500/30">
              AI Executive Briefing
            </span>
            <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 text-[10px] font-bold border border-rose-500/30">
              {fileType}
            </span>
            <span className="text-xs text-slate-400">• {activeDocument.pageCount || 1} Pages</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight mt-1.5 truncate max-w-xl">
            {cleanTitle}
          </h2>
        </div>

        {/* Global Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => toggleAll(true)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-medium text-slate-300 border border-slate-800 transition-colors"
          >
            Expand All
          </button>
          <button
            onClick={() => toggleAll(false)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-medium text-slate-300 border border-slate-800 transition-colors"
          >
            Collapse All
          </button>
          <button
            onClick={() => loadSummary(true)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 border border-slate-700 transition-colors disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Regenerate</span>
          </button>
          <button
            onClick={handleDownloadReport}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-xs font-semibold text-white shadow-md shadow-brand-600/20 transition-all active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Brief</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-400 mx-auto" />
          <p className="text-sm font-medium text-slate-300">Synthesizing executive briefing from document chunks...</p>
          <p className="text-xs text-slate-500">Formulating concise takeaways, methodologies, and recommendations</p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : summaryData ? (
        <div className="space-y-4">
          {/* Section 1: Executive Overview (Scannable & Concise) */}
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl overflow-hidden transition-all">
            <div
              onClick={() => toggleSection('overview')}
              className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-slate-850/40 select-none border-b border-slate-800/60"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-brand-500/20 text-brand-400 flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Executive Overview</h3>
                  <p className="text-[11px] text-slate-400">High-level synthesis & primary thesis</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopySection(summaryData.executive, 'overview');
                  }}
                  className="p-1 text-slate-400 hover:text-white"
                  title="Copy overview"
                >
                  {copiedSection === 'overview' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
                {openSections.overview ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </div>

            {openSections.overview && (
              <div className="p-5 sm:p-6 space-y-3 bg-slate-950/30">
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line font-sans">
                  {summaryData.executive}
                </p>
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => setActiveTab('chat')}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-400 hover:text-brand-300 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Ask question about overview in Chat →</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Critical Findings & Key Results (Visual Grid Cards) */}
          {summaryData.keyPoints && summaryData.keyPoints.length > 0 && (
            <div className="rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl overflow-hidden transition-all">
              <div
                onClick={() => toggleSection('findings')}
                className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-slate-850/40 select-none border-b border-slate-800/60"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                    <BarChart2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">Critical Findings & Results</h3>
                    <p className="text-[11px] text-slate-400">
                      {summaryData.keyPoints.length} core takeaways extracted from document
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold">
                    {summaryData.keyPoints.length} Insights
                  </span>
                  {openSections.findings ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>

              {openSections.findings && (
                <div className="p-5 sm:p-6 bg-slate-950/30">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {summaryData.keyPoints.map((point, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 text-xs text-slate-200 leading-relaxed flex items-start gap-3 transition-all"
                      >
                        <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span>{point}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section 3: Action Items & Recommendations (Checklist Style) */}
          {summaryData.actionItems && summaryData.actionItems.length > 0 && (
            <div className="rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl overflow-hidden transition-all">
              <div
                onClick={() => toggleSection('recommendations')}
                className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-slate-850/40 select-none border-b border-slate-800/60"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <ListTodo className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">Recommendations & Next Steps</h3>
                    <p className="text-[11px] text-slate-400">Actionable guidance and research implications</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                    {summaryData.actionItems.length} Actions
                  </span>
                  {openSections.recommendations ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>

              {openSections.recommendations && (
                <div className="p-5 sm:p-6 bg-slate-950/30 space-y-2.5">
                  {summaryData.actionItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 flex items-center gap-3"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Section 4: Key Concepts & Semantic Tags */}
          {summaryData.topics && summaryData.topics.length > 0 && (
            <div className="rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl overflow-hidden transition-all">
              <div
                onClick={() => toggleSection('topics')}
                className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-slate-850/40 select-none border-b border-slate-800/60"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                    <Tag className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">Extracted Key Themes & Entities</h3>
                    <p className="text-[11px] text-slate-400">Core domain keywords mapped by RAG</p>
                  </div>
                </div>
                {openSections.topics ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </div>

              {openSections.topics && (
                <div className="p-5 sm:p-6 bg-slate-950/30">
                  <div className="flex flex-wrap gap-2">
                    {summaryData.topics.map((t, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-purple-500/50 text-xs font-medium text-slate-200 transition-colors"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
