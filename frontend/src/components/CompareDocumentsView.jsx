import React, { useState, useRef, useEffect } from 'react';
import {
  GitCompare,
  Sparkles,
  ArrowRightLeft,
  CheckCircle2,
  AlertCircle,
  FileText,
  Loader2,
  Layers,
  Scale,
  UploadCloud,
  Eye,
  RotateCw,
  Plus,
  ChevronDown,
  ArrowRight,
  BookOpen,
  Split,
  FileCheck,
} from 'lucide-react';
import { useDocument } from '../context/DocumentContext';
import { toolApi, documentApi } from '../services/api';
import { cleanDocumentTitle, getDocumentFileType, formatFileSize } from '../utils/documentUtils';

export default function CompareDocumentsView() {
  const { documents, showToast, openPdfViewer, fetchDocuments } = useDocument();

  // Selected document IDs for Slot A and Slot B
  const [doc1Id, setDoc1Id] = useState(documents[0]?._id || '');
  const [doc2Id, setDoc2Id] = useState(documents[1]?._id || '');

  // Comparison result & state
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('insights'); // 'insights' | 'side-by-side'

  // Uploading state for slots
  const [uploadingSlot, setUploadingSlot] = useState(null); // 'A' | 'B' | null
  const [dragOverSlot, setDragOverSlot] = useState(null); // 'A' | 'B' | null

  // Chunks for side-by-side text view
  const [chunks1, setChunks1] = useState([]);
  const [chunks2, setChunks2] = useState([]);
  const [loadingChunks, setLoadingChunks] = useState(false);

  // Hidden file inputs
  const fileInputRefA = useRef(null);
  const fileInputRefB = useRef(null);

  // Keep doc IDs updated if documents change
  useEffect(() => {
    if (documents.length > 0) {
      if (!doc1Id || !documents.some((d) => d._id === doc1Id)) {
        setDoc1Id(documents[0]._id);
      }
      if (documents.length > 1 && (!doc2Id || !documents.some((d) => d._id === doc2Id) || doc2Id === doc1Id)) {
        const other = documents.find((d) => d._id !== doc1Id);
        if (other) setDoc2Id(other._id);
      }
    }
  }, [documents]);

  const doc1 = documents.find((d) => d._id === doc1Id);
  const doc2 = documents.find((d) => d._id === doc2Id);

  // Load preview chunks when both documents are selected
  useEffect(() => {
    if (doc1Id && doc2Id && viewMode === 'side-by-side') {
      loadSideBySideChunks();
    }
  }, [doc1Id, doc2Id, viewMode]);

  const loadSideBySideChunks = async () => {
    setLoadingChunks(true);
    try {
      const [res1, res2] = await Promise.all([
        documentApi.getChunks(doc1Id),
        documentApi.getChunks(doc2Id),
      ]);
      if (res1.data.success) setChunks1(res1.data.chunks || []);
      if (res2.data.success) setChunks2(res2.data.chunks || []);
    } catch (e) {
      console.warn('Error loading side-by-side chunks:', e);
    } finally {
      setLoadingChunks(false);
    }
  };

  // Direct file upload handler for Slot A or Slot B
  const handleUploadFile = async (files, slot) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      showToast('Please upload a valid PDF document', 'error');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      showToast('File size exceeds the 50MB limit', 'error');
      return;
    }

    setUploadingSlot(slot);
    try {
      const formData = new FormData();
      formData.append('pdfs', file);

      const res = await documentApi.upload(formData);
      if (res.data.success && res.data.documents?.length > 0) {
        const newDoc = res.data.documents[0];
        await fetchDocuments();

        if (slot === 'A') {
          setDoc1Id(newDoc._id);
        } else {
          setDoc2Id(newDoc._id);
        }

        showToast(`"${file.name}" uploaded & indexed for comparison!`, 'success');
      }
    } catch (err) {
      console.error('Slot upload error:', err);
      showToast(err.response?.data?.error || 'Failed to upload document', 'error');
    } finally {
      setUploadingSlot(null);
    }
  };

  // Quick load sample comparison document into Slot B
  const handleLoadSample = async () => {
    setUploadingSlot('B');
    try {
      const res = await documentApi.loadSample();
      if (res.data.success && res.data.document) {
        await fetchDocuments();
        setDoc2Id(res.data.document._id);
        showToast('Sample comparison document loaded successfully!', 'success');
      }
    } catch (err) {
      console.error('Load sample error:', err);
      showToast(err.response?.data?.error || 'Failed to load sample document', 'error');
    } finally {
      setUploadingSlot(null);
    }
  };

  const handleCompare = async () => {
    if (!doc1Id || !doc2Id) {
      showToast('Please select or upload two documents to compare', 'warning');
      return;
    }
    if (doc1Id === doc2Id) {
      showToast('Please select two different documents to compare', 'warning');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await toolApi.compare(doc1Id, doc2Id);
      if (res.data.success) {
        setComparison(res.data.comparison);
        showToast('Comparative analysis complete!', 'success');
      }
    } catch (err) {
      console.error('Compare error:', err);
      setError(err.response?.data?.error || 'Failed to compare documents');
    } finally {
      setLoading(false);
    }
  };

  const canCompare = doc1Id && doc2Id && doc1Id !== doc2Id;

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Hidden File Inputs for Slots */}
      <input
        type="file"
        ref={fileInputRefA}
        className="hidden"
        accept="application/pdf"
        onChange={(e) => handleUploadFile(e.target.files, 'A')}
      />
      <input
        type="file"
        ref={fileInputRefB}
        className="hidden"
        accept="application/pdf"
        onChange={(e) => handleUploadFile(e.target.files, 'B')}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-brand-500/20">
            <GitCompare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight">
                Cross-Document Comparative Analysis
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 font-bold text-[10px] border border-brand-500/30">
                Side-by-Side RAG
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Upload or pick two PDF documents to contrast methodologies, common ground, and core discrepancies
            </p>
          </div>
        </div>

        {/* View Switcher if comparison is available */}
        {comparison && (
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode('insights')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                viewMode === 'insights'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Insights</span>
            </button>
            <button
              onClick={() => {
                setViewMode('side-by-side');
                loadSideBySideChunks();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                viewMode === 'side-by-side'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Split className="w-3.5 h-3.5" />
              <span>Side-by-Side Content</span>
            </button>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* SIDE-BY-SIDE DUAL UPLOAD / SELECTION STAGING SLOTS        */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
        {/* SLOT A: DOCUMENT 1 (BASELINE) */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOverSlot('A');
          }}
          onDragLeave={() => setDragOverSlot(null)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOverSlot(null);
            handleUploadFile(e.dataTransfer.files, 'A');
          }}
          className={`rounded-2xl border transition-all p-5 space-y-4 ${
            dragOverSlot === 'A'
              ? 'bg-brand-950/40 border-brand-400 ring-2 ring-brand-500/30'
              : 'bg-slate-900/90 border-slate-800 shadow-xl'
          }`}
        >
          {/* Slot Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-brand-500/20 text-brand-300 font-bold text-xs flex items-center justify-center border border-brand-500/30">
                A
              </span>
              <h3 className="text-sm font-bold text-white tracking-tight">Document A (Baseline)</h3>
            </div>
            {doc1 && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Ready for Analysis
              </span>
            )}
          </div>

          {/* If Document A is selected, render Document Card */}
          {doc1 ? (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/20">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-white truncate" title={doc1.originalName}>
                      {cleanDocumentTitle(doc1.originalName)}
                    </h4>
                    <p className="text-[11px] text-slate-400 truncate">
                      {doc1.originalName} • {formatFileSize(doc1.fileSize)}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-indigo-300 bg-indigo-500/10 px-1.5 py-0.5 rounded font-medium">
                        {doc1.pageCount || 1} {doc1.pageCount === 1 ? 'Page' : 'Pages'}
                      </span>
                      <span className="text-[10px] text-teal-300 bg-teal-500/10 px-1.5 py-0.5 rounded font-medium">
                        {doc1.chunkCount || 0} Chunks
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-900 gap-2">
                  <button
                    onClick={() =>
                      openPdfViewer({
                        documentId: doc1._id,
                        documentName: doc1.originalName,
                        pageNumber: 1,
                      })
                    }
                    className="inline-flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 font-medium py-1 px-2 rounded-lg hover:bg-slate-900 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Preview in PDF Viewer</span>
                  </button>

                  <button
                    onClick={() => fileInputRefA.current?.click()}
                    className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 py-1 px-2 rounded-lg hover:bg-slate-900 transition-colors"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Replace PDF</span>
                  </button>
                </div>
              </div>

              {/* Document Library Dropdown Selector */}
              {documents.length > 1 && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400 text-[11px]">Switch File:</span>
                  <select
                    value={doc1Id}
                    onChange={(e) => setDoc1Id(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-brand-500 truncate"
                  >
                    {documents.map((d) => (
                      <option key={d._id} value={d._id}>
                        {cleanDocumentTitle(d.originalName)} ({d.pageCount || 1}p)
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          ) : (
            /* Upload Dropzone Menu for Slot A */
            <div
              onClick={() => fileInputRefA.current?.click()}
              className="border-2 border-dashed border-slate-700 hover:border-brand-500/80 rounded-xl p-6 text-center cursor-pointer transition-colors bg-slate-950/40 hover:bg-slate-950/70 space-y-2.5"
            >
              <div className="w-10 h-10 rounded-full bg-brand-500/10 text-brand-400 flex items-center justify-center mx-auto">
                {uploadingSlot === 'A' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <UploadCloud className="w-5 h-5" />
                )}
              </div>
              <div>
                <p className="text-xs font-bold text-white">
                  {uploadingSlot === 'A' ? 'Uploading & Indexing PDF...' : 'Click to Upload Document A'}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  or drag and drop your first PDF document here
                </p>
              </div>
            </div>
          )}
        </div>

        {/* SLOT B: DOCUMENT 2 (COMPARISON TARGET) */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOverSlot('B');
          }}
          onDragLeave={() => setDragOverSlot(null)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOverSlot(null);
            handleUploadFile(e.dataTransfer.files, 'B');
          }}
          className={`rounded-2xl border transition-all p-5 space-y-4 ${
            dragOverSlot === 'B'
              ? 'bg-indigo-950/40 border-indigo-400 ring-2 ring-indigo-500/30'
              : 'bg-slate-900/90 border-slate-800 shadow-xl'
          }`}
        >
          {/* Slot Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-300 font-bold text-xs flex items-center justify-center border border-indigo-500/30">
                B
              </span>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Document B (Comparison Target)
              </h3>
            </div>
            {doc2 && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Ready for Analysis
              </span>
            )}
          </div>

          {/* If Document B is selected, render Document Card */}
          {doc2 ? (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-white truncate" title={doc2.originalName}>
                      {cleanDocumentTitle(doc2.originalName)}
                    </h4>
                    <p className="text-[11px] text-slate-400 truncate">
                      {doc2.originalName} • {formatFileSize(doc2.fileSize)}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-indigo-300 bg-indigo-500/10 px-1.5 py-0.5 rounded font-medium">
                        {doc2.pageCount || 1} {doc2.pageCount === 1 ? 'Page' : 'Pages'}
                      </span>
                      <span className="text-[10px] text-teal-300 bg-teal-500/10 px-1.5 py-0.5 rounded font-medium">
                        {doc2.chunkCount || 0} Chunks
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-900 gap-2">
                  <button
                    onClick={() =>
                      openPdfViewer({
                        documentId: doc2._id,
                        documentName: doc2.originalName,
                        pageNumber: 1,
                      })
                    }
                    className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium py-1 px-2 rounded-lg hover:bg-slate-900 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Preview in PDF Viewer</span>
                  </button>

                  <button
                    onClick={() => fileInputRefB.current?.click()}
                    className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 py-1 px-2 rounded-lg hover:bg-slate-900 transition-colors"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Replace PDF</span>
                  </button>
                </div>
              </div>

              {/* Document Library Dropdown Selector */}
              {documents.length > 1 && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400 text-[11px]">Switch File:</span>
                  <select
                    value={doc2Id}
                    onChange={(e) => setDoc2Id(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-indigo-500 truncate"
                  >
                    {documents.map((d) => (
                      <option key={d._id} value={d._id}>
                        {cleanDocumentTitle(d.originalName)} ({d.pageCount || 1}p)
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          ) : (
            /* Upload Dropzone Menu for Slot B (⭐ Solves user issue when only 1 doc is uploaded!) */
            <div className="space-y-3">
              <div
                onClick={() => fileInputRefB.current?.click()}
                className="border-2 border-dashed border-indigo-700/60 hover:border-indigo-500 rounded-xl p-6 text-center cursor-pointer transition-colors bg-indigo-950/20 hover:bg-indigo-950/40 space-y-2.5"
              >
                <div className="w-10 h-10 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto">
                  {uploadingSlot === 'B' ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <UploadCloud className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-white">
                    {uploadingSlot === 'B' ? 'Uploading & Indexing PDF...' : 'Upload 2nd PDF to Compare'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Drag & drop file here or click to browse
                  </p>
                </div>
              </div>

              {/* Quick-load sample PDF option */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs">
                <span className="text-slate-400 text-[11px]">No second document on hand?</span>
                <button
                  onClick={handleLoadSample}
                  disabled={uploadingSlot === 'B'}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 font-semibold text-[11px] border border-indigo-500/30 transition-colors"
                >
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                  <span>⚡ Load Sample Comparison PDF</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* COMPARISON ACTION TRIGGER BAR                             */}
      {/* ========================================================= */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-xs space-y-0.5">
          <div className="font-semibold text-white flex items-center gap-2">
            <span>Comparison Status:</span>
            {canCompare ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Ready to Compare
              </span>
            ) : doc1Id === doc2Id && doc1Id ? (
              <span className="text-amber-400 font-medium">Please pick two different documents</span>
            ) : (
              <span className="text-slate-400">Please upload or select Document B above</span>
            )}
          </div>
          <p className="text-slate-400 text-[11px]">
            {canCompare
              ? `Ready to cross-examine "${cleanDocumentTitle(doc1?.originalName)}" against "${cleanDocumentTitle(doc2?.originalName)}".`
              : 'DocuMind requires two documents to generate a cross-reference matrix.'}
          </p>
        </div>

        <button
          onClick={handleCompare}
          disabled={!canCompare || loading}
          className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 hover:from-brand-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-brand-600/25 transition-all active:scale-95 shrink-0"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Analyzing Documents...</span>
            </>
          ) : (
            <>
              <ArrowRightLeft className="w-4 h-4" />
              <span>Run Comparative Analysis</span>
            </>
          )}
        </button>
      </div>

      {/* Loading state indicator */}
      {loading && (
        <div className="py-16 text-center space-y-3 bg-slate-900/40 rounded-2xl border border-slate-800">
          <Loader2 className="w-8 h-8 animate-spin text-brand-400 mx-auto" />
          <p className="text-sm font-semibold text-white">Cross-Referencing Multi-Document Matrices...</p>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Extracting core claims, evaluating methodologies, and identifying conflicting or corroborating evidence across both PDFs.
          </p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODE 1: AI COMPARATIVE INSIGHTS RESULTS                   */}
      {/* ========================================================= */}
      {!loading && comparison && viewMode === 'insights' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Executive Comparative Overview */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-400" />
              Executive Comparative Synthesis
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {comparison.overview}
            </p>
          </div>

          {/* Common Ground & Shared Principles */}
          {comparison.sharedPoints && comparison.sharedPoints.length > 0 && (
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3">
              <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Common Ground & Shared Principles</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {comparison.sharedPoints.map((pt, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300 flex items-start gap-2.5"
                  >
                    <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold">
                      ✓
                    </span>
                    <span>{pt}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Side-by-Side Discrepancies & Contrast */}
          {comparison.differences && comparison.differences.length > 0 && (
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                  <Scale className="w-4 h-4" />
                  <span>Key Discrepancies & Contrasting Approaches</span>
                </h3>
                <span className="text-[11px] text-slate-400">
                  {comparison.differences.length} comparative dimensions analyzed
                </span>
              </div>

              <div className="space-y-3">
                {comparison.differences.map((diff, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/90 space-y-3"
                  >
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded bg-amber-500/10 text-amber-300 font-bold text-xs border border-amber-500/20">
                        {diff.aspect}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      {/* Document A's perspective */}
                      <div className="p-3 rounded-lg bg-brand-950/20 border border-brand-500/20 text-slate-300 space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-brand-300 text-[11px] uppercase tracking-wider">
                          <span className="w-2 h-2 rounded-full bg-brand-400" />
                          <span>{doc1 ? cleanDocumentTitle(doc1.originalName) : 'Document A'}:</span>
                        </div>
                        <p className="leading-relaxed">{diff.doc1}</p>
                      </div>

                      {/* Document B's perspective */}
                      <div className="p-3 rounded-lg bg-indigo-950/20 border border-indigo-500/20 text-slate-300 space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-indigo-300 text-[11px] uppercase tracking-wider">
                          <span className="w-2 h-2 rounded-full bg-indigo-400" />
                          <span>{doc2 ? cleanDocumentTitle(doc2.originalName) : 'Document B'}:</span>
                        </div>
                        <p className="leading-relaxed">{diff.doc2}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Unique Contributions Side-by-Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-brand-300 uppercase tracking-wider truncate">
                  Unique to {doc1 ? cleanDocumentTitle(doc1.originalName) : 'Doc A'}
                </h4>
                <span className="w-2 h-2 rounded-full bg-brand-400" />
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                {(comparison.uniqueToDoc1 || []).map((u, i) => (
                  <li key={i} className="flex items-start gap-2 bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/60">
                    <span className="text-brand-400 mt-0.5">•</span>
                    <span>{u}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider truncate">
                  Unique to {doc2 ? cleanDocumentTitle(doc2.originalName) : 'Doc B'}
                </h4>
                <span className="w-2 h-2 rounded-full bg-indigo-400" />
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                {(comparison.uniqueToDoc2 || []).map((u, i) => (
                  <li key={i} className="flex items-start gap-2 bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/60">
                    <span className="text-indigo-400 mt-0.5">•</span>
                    <span>{u}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Final Synthesis */}
          {comparison.synthesis && (
            <div className="p-6 rounded-2xl bg-gradient-to-r from-brand-950/40 via-slate-900 to-indigo-950/40 border border-brand-500/30 text-xs sm:text-sm text-slate-200 leading-relaxed space-y-2">
              <div className="font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-400" />
                Strategic Synthesis & Viva Presentation Takeaway
              </div>
              <p>{comparison.synthesis}</p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODE 2: SIDE-BY-SIDE RAW CONTENT & CHUNKS COMPARISON      */}
      {/* ========================================================= */}
      {!loading && viewMode === 'side-by-side' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium">
              Side-by-side chunk and content inspection
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={() =>
                  openPdfViewer({
                    documentId: doc1._id,
                    documentName: doc1.originalName,
                    pageNumber: 1,
                  })
                }
                className="text-brand-400 hover:underline flex items-center gap-1"
              >
                <Eye className="w-3.5 h-3.5" /> Open Doc A in Viewer
              </button>
              <button
                onClick={() =>
                  openPdfViewer({
                    documentId: doc2._id,
                    documentName: doc2.originalName,
                    pageNumber: 1,
                  })
                }
                className="text-indigo-400 hover:underline flex items-center gap-1"
              >
                <Eye className="w-3.5 h-3.5" /> Open Doc B in Viewer
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Column A Chunks */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs text-brand-300">
                  {doc1 ? cleanDocumentTitle(doc1.originalName) : 'Document A'} Chunks ({chunks1.length})
                </h4>
              </div>
              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                {chunks1.map((c) => (
                  <div key={c._id || c.chunkIndex} className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] space-y-1 font-mono">
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span className="text-brand-400 font-bold">Chunk #{c.chunkIndex}</span>
                      <span>Page {c.pageNumber}</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed line-clamp-4">{c.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Column B Chunks */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs text-indigo-300">
                  {doc2 ? cleanDocumentTitle(doc2.originalName) : 'Document B'} Chunks ({chunks2.length})
                </h4>
              </div>
              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                {chunks2.map((c) => (
                  <div key={c._id || c.chunkIndex} className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] space-y-1 font-mono">
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span className="text-indigo-400 font-bold">Chunk #{c.chunkIndex}</span>
                      <span>Page {c.pageNumber}</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed line-clamp-4">{c.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
