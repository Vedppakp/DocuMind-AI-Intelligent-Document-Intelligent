import React, { useState, useRef } from 'react';
import {
  X,
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Cpu,
  Layers,
  Sparkles,
  ArrowRight,
  Database,
} from 'lucide-react';
import { useDocument } from '../context/DocumentContext';
import { documentApi } from '../services/api';

const PIPELINE_STEPS = [
  { id: 1, title: 'Uploading PDF', desc: 'Validating binary & transfer to secure server' },
  { id: 2, title: 'Extracting text', desc: 'Spatial coordinate OCR & noise filtering' },
  { id: 3, title: 'Detecting pages', desc: 'Structuring page hierarchy & metadata' },
  { id: 4, title: 'Creating chunks', desc: 'Whole-word boundary sliding window' },
  { id: 5, title: 'Generating embeddings', desc: 'Dense vector representation' },
  { id: 6, title: 'Storing vectors', desc: 'Indexing chunks into MongoDB' },
  { id: 7, title: 'Document Ready', desc: 'Grounded retrieval pipeline active' },
];

export default function DocumentUploadModal() {
  const {
    showUploadModal,
    setShowUploadModal,
    fetchDocuments,
    showToast,
    selectDocument,
    setActiveTab,
  } = useDocument();

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isComplete, setIsComplete] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef(null);

  if (!showUploadModal) return null;

  const handleFiles = (files) => {
    setErrorMessage('');
    const validPdfs = Array.from(files).filter(
      (file) => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    );

    if (validPdfs.length === 0) {
      setErrorMessage('Please upload valid PDF files only.');
      return;
    }

    const oversized = validPdfs.filter((f) => f.size > 50 * 1024 * 1024);
    if (oversized.length > 0) {
      setErrorMessage('Some files exceed the 50MB limit.');
      return;
    }

    setSelectedFiles((prev) => [...prev, ...validPdfs]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    setUploading(true);
    setCurrentStep(1);
    setIsComplete(false);

    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append('pdfs', file);
      });

      // Animated progression through pipeline steps during actual ingestion
      const advanceTimer1 = setTimeout(() => setCurrentStep(2), 350);
      const advanceTimer2 = setTimeout(() => setCurrentStep(3), 750);
      const advanceTimer3 = setTimeout(() => setCurrentStep(4), 1150);
      const advanceTimer4 = setTimeout(() => setCurrentStep(5), 1600);
      const advanceTimer5 = setTimeout(() => setCurrentStep(6), 2100);

      const res = await documentApi.upload(formData);

      clearTimeout(advanceTimer1);
      clearTimeout(advanceTimer2);
      clearTimeout(advanceTimer3);
      clearTimeout(advanceTimer4);
      clearTimeout(advanceTimer5);

      if (res.data.success) {
        setCurrentStep(7);
        setIsComplete(true);
        await fetchDocuments();
        if (res.data.documents && res.data.documents.length > 0) {
          selectDocument(res.data.documents[0]);
        }
      } else {
        setErrorMessage(res.data.error || 'Upload failed');
        setUploading(false);
      }
    } catch (err) {
      console.error('Upload failed:', err);
      setErrorMessage(err.response?.data?.error || err.message || 'Upload error');
      setUploading(false);
    }
  };

  const handleFinish = () => {
    setShowUploadModal(false);
    setSelectedFiles([]);
    setUploading(false);
    setIsComplete(false);
    setCurrentStep(1);
    setActiveTab('chat');
    showToast('Document indexed and ready for grounded Q&A!', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-5 sm:p-6 relative overflow-hidden">
        {/* Close button */}
        {!uploading && (
          <button
            onClick={() => setShowUploadModal(false)}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* ⭐ Step 5 Review: Visual Document Processing Pipeline Stepper ⭐ */}
        {uploading ? (
          <div className="py-2 space-y-5 animate-fadeIn">
            <div className="text-center space-y-1">
              <div className="w-10 h-10 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center mx-auto mb-2">
                <Cpu className="w-5 h-5 animate-pulse" />
              </div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Document Processing Pipeline
              </h3>
              <p className="text-xs text-slate-400">
                Indexing {selectedFiles.length} PDF(s) into MongoDB Vector Store
              </p>
            </div>

            {/* Stepper Pipeline Flow */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
              {PIPELINE_STEPS.map((step, idx) => {
                const isDone = currentStep > step.id || (isComplete && step.id === 7);
                const isCurrent = currentStep === step.id && !isComplete;
                const isPending = currentStep < step.id;

                return (
                  <div key={step.id} className="relative flex items-start gap-3">
                    {/* Stepper line */}
                    {idx < PIPELINE_STEPS.length - 1 && (
                      <div
                        className={`absolute left-3 top-6 w-0.5 h-6 transition-colors ${
                          isDone ? 'bg-emerald-500/60' : 'bg-slate-800'
                        }`}
                      />
                    )}

                    {/* Step Icon Indicator */}
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold transition-all z-10 ${
                        isDone
                          ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/50'
                          : isCurrent
                          ? 'bg-brand-500/20 text-brand-300 ring-1 ring-brand-500 animate-pulse'
                          : 'bg-slate-900 text-slate-600 ring-1 ring-slate-800'
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : isCurrent ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-400" />
                      ) : (
                        <span>{step.id}</span>
                      )}
                    </div>

                    {/* Step Details */}
                    <div className="flex-1 min-w-0 flex items-center justify-between">
                      <div>
                        <p
                          className={`text-xs font-semibold ${
                            isDone
                              ? 'text-slate-200'
                              : isCurrent
                              ? 'text-brand-300 font-bold'
                              : 'text-slate-500'
                          }`}
                        >
                          {step.title}
                        </p>
                        <p className="text-[10px] text-slate-500">{step.desc}</p>
                      </div>

                      {isDone && (
                        <span className="text-[11px] font-bold text-emerald-400">✓</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Completion CTA */}
            {isComplete ? (
              <button
                onClick={handleFinish}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all active:scale-98 animate-bounce"
              >
                <span>Document Ready — Start Chatting Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="text-center text-[11px] text-slate-400 flex items-center justify-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-400" />
                <span>Running multi-stage spatial chunking & embedding...</span>
              </div>
            )}
          </div>
        ) : (
          /* Normal Upload Form */
          <>
            {/* Modal Header */}
            <div className="mb-4">
              <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-brand-400" />
                Upload PDF Documents
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Upload single or multiple research papers, reports, or manuals for deep RAG analysis.
              </p>
            </div>

            {/* Dropzone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-brand-400 bg-brand-500/10'
                  : 'border-slate-700/80 bg-slate-950/40 hover:border-brand-500/50 hover:bg-slate-950/70'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => e.target.files && handleFiles(e.target.files)}
                multiple
                accept=".pdf,application/pdf"
                className="hidden"
              />

              <div className="w-12 h-12 rounded-full bg-brand-500/10 text-brand-400 flex items-center justify-center mx-auto mb-3">
                <UploadCloud className="w-6 h-6" />
              </div>

              <p className="text-sm font-medium text-slate-200">
                Click to upload or drag & drop PDFs
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Supports multi-PDF uploads up to 50 MB each
              </p>
            </div>

            {/* Error message */}
            {errorMessage && (
              <div className="mt-3 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Selected Files List */}
            {selectedFiles.length > 0 && (
              <div className="mt-4 max-h-36 overflow-y-auto space-y-1.5 pr-1">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Ready to process ({selectedFiles.length})
                </div>
                {selectedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800 text-xs text-slate-300"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-brand-400 shrink-0" />
                      <span className="truncate font-medium">{file.name}</span>
                      <span className="text-[10px] text-slate-500 shrink-0">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(idx);
                      }}
                      className="text-slate-500 hover:text-rose-400 p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Modal Actions */}
            <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpload}
                disabled={selectedFiles.length === 0}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 disabled:opacity-50 text-white shadow-lg shadow-brand-600/25 flex items-center gap-2 transition-all active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Process & Ingest ({selectedFiles.length})</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
