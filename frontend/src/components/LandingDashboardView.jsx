import React, { useState } from 'react';
import {
  FileText,
  MessageSquare,
  BookOpen,
  HelpCircle,
  GitCompare,
  UploadCloud,
  Folder,
  FolderPlus,
  Sparkles,
  Layers,
  CheckCircle2,
  Trash2,
  Search,
  ExternalLink,
  ArrowRight,
} from 'lucide-react';
import { useDocument } from '../context/DocumentContext';
import { useAuth } from '../context/AuthContext';
import { cleanDocumentTitle, getDocumentFileType, formatFileSize } from '../utils/documentUtils';

export default function LandingDashboardView() {
  const {
    documents,
    folders,
    selectedFolder,
    setSelectedFolder,
    createFolder,
    updateDocumentFolder,
    selectDocument,
    deleteDocument,
    openPdfViewer,
    setActiveTab,
    setShowUploadModal,
    setShowSettingsModal,
  } = useDocument();

  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);

  const filteredDocs = documents.filter((doc) => {
    const matchesFolder = selectedFolder ? doc.folder === selectedFolder : true;
    const matchesSearch = doc.originalName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFolder && matchesSearch;
  });

  const handleCreateFolder = (e) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      createFolder(newFolderName.trim());
      setNewFolderName('');
      setShowNewFolderInput(false);
    }
  };

  const handleAction = (doc, tab) => {
    selectDocument(doc);
    setActiveTab(tab);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950/60 p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Executive Welcome Hero */}
      <div className="relative rounded-3xl bg-gradient-to-r from-brand-900/40 via-indigo-900/30 to-slate-900/60 border border-brand-500/20 p-6 sm:p-8 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 border border-brand-500/30 text-brand-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Next-Gen RAG Intelligence</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
              Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}!
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Upload research reports, textbooks, legal agreements, or technical manuals. DocuMind indexes chunks with whole-word spatial snapping and delivers factual answers grounded with exact page citations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-brand-600/30 flex items-center gap-2 transition-all active:scale-95"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload PDF Document</span>
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className="px-4 py-3 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4 text-brand-400" />
              <span>Go to Chat</span>
            </button>
          </div>
        </div>
      </div>

      {/* AI Intelligence Tools Hub */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-400" />
            <span>AI Document Intelligence Tools</span>
          </h2>
          <span className="text-xs text-slate-400">Select any tool to begin exploring</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Tool 1: Chat with PDF */}
          <div
            onClick={() => setActiveTab('chat')}
            className="group p-5 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-brand-500/50 cursor-pointer transition-all shadow-md hover:shadow-brand-500/10 flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-white group-hover:text-brand-300 transition-colors">
                Chat & Grounded Citations
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Converse naturally with single or multiple PDFs. Get answers with highlighted page citations and ground-truth verification.
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-brand-400 group-hover:translate-x-1 transition-transform">
              <span>Start Chatting</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Tool 2: Summary */}
          <div
            onClick={() => setActiveTab('summary')}
            className="group p-5 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-indigo-500/50 cursor-pointer transition-all shadow-md hover:shadow-indigo-500/10 flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-white group-hover:text-indigo-300 transition-colors">
                Executive Auto-Summary
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Synthesize structured executive summaries, methodologies, core insights, and key conclusions with one click.
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-indigo-400 group-hover:translate-x-1 transition-transform">
              <span>Generate Summary</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Tool 3: Quiz */}
          <div
            onClick={() => setActiveTab('quiz')}
            className="group p-5 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-purple-500/50 cursor-pointer transition-all shadow-md hover:shadow-purple-500/10 flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <HelpCircle className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-white group-hover:text-purple-300 transition-colors">
                Comprehension Quiz
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Test understanding with automated multiple-choice tests, instant scoring, answer explanations, and citations.
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-purple-400 group-hover:translate-x-1 transition-transform">
              <span>Generate Quiz</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Tool 4: Compare */}
          <div
            onClick={() => setActiveTab('compare')}
            className="group p-5 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-emerald-500/50 cursor-pointer transition-all shadow-md hover:shadow-emerald-500/10 flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <GitCompare className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-white group-hover:text-emerald-300 transition-colors">
                Cross-Doc Comparison
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Compare two PDF documents side-by-side to identify conceptual parallels, methodology variations, and distinct insights.
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-emerald-400 group-hover:translate-x-1 transition-transform">
              <span>Compare Documents</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Documents Workspace & Projects */}
      <div className="space-y-4">
        {/* Section Header with Project Folder Pills and Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Document Workspace
            </h2>
            <p className="text-xs text-slate-400">
              Manage your PDF library, organize by project folders, and launch document actions.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none focus:border-brand-500"
            />
          </div>
        </div>

        {/* Project Folders Filter Bar */}
        <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-xl bg-slate-900/50 border border-slate-800/80">
          <button
            onClick={() => setSelectedFolder(null)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              selectedFolder === null
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Documents ({documents.length})</span>
          </button>

          {folders.map((fName) => {
            const count = documents.filter((d) => d.folder === fName).length;
            const isSelected = selectedFolder === fName;
            return (
              <button
                key={fName}
                onClick={() => setSelectedFolder(fName)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Folder className="w-3.5 h-3.5" />
                <span>{fName} ({count})</span>
              </button>
            );
          })}

          {showNewFolderInput ? (
            <form onSubmit={handleCreateFolder} className="flex items-center gap-1.5">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name..."
                autoFocus
                className="px-2.5 py-1 rounded-lg bg-slate-950 border border-indigo-500 text-xs text-white outline-none w-32"
              />
              <button
                type="submit"
                className="px-2 py-1 rounded-lg bg-indigo-600 text-white text-xs font-medium"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setShowNewFolderInput(false)}
                className="px-2 py-1 rounded-lg bg-slate-800 text-slate-400 text-xs hover:text-white"
              >
                Cancel
              </button>
            </form>
          ) : (
            <button
              onClick={() => setShowNewFolderInput(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-indigo-300 hover:bg-slate-800/60 transition-colors"
              title="Create new project folder"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>+ New Folder</span>
            </button>
          )}
        </div>

        {/* Documents Grid / Table */}
        {filteredDocs.length === 0 ? (
          <div className="p-10 rounded-2xl border border-dashed border-slate-800 text-center bg-slate-900/30 space-y-3">
            <FileText className="w-12 h-12 text-slate-600 mx-auto" />
            <div className="max-w-sm mx-auto">
              <h3 className="font-bold text-sm text-slate-200">
                {documents.length === 0 ? 'No documents uploaded yet' : 'No documents matching filter'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {documents.length === 0
                  ? 'Upload your first PDF document to start querying and generating grounded citations.'
                  : 'Try selecting another folder or clearing your search filter.'}
              </p>
            </div>
            {documents.length === 0 && (
              <button
                onClick={() => setShowUploadModal(true)}
                className="mt-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md shadow-brand-600/20 inline-flex items-center gap-1.5 transition-all"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Upload PDF</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocs.map((doc) => (
              <div
                key={doc._id}
                className="group rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-brand-500/50 p-4 transition-all shadow-md flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Top Bar: Icon + Title + Delete */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 text-[10px] font-bold border border-rose-500/30 shrink-0">
                            {getDocumentFileType(doc.originalName)}
                          </span>
                          <h4
                            className="font-bold text-xs text-white truncate max-w-[170px]"
                            title={doc.originalName}
                          >
                            {cleanDocumentTitle(doc.originalName)}
                          </h4>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px] text-slate-400">
                            {doc.pageCount || 1} {doc.pageCount === 1 ? 'page' : 'pages'}
                          </span>
                          <span className="text-slate-600">•</span>
                          <span className="text-[11px] text-slate-400">
                            {doc.chunkCount || 0} chunks
                          </span>
                          <span className="text-slate-600">•</span>
                          <span className="text-[11px] text-slate-500">
                            {formatFileSize(doc.fileSize)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`Delete "${doc.originalName}"?`)) {
                          deleteDocument(doc._id);
                        }
                      }}
                      className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete document"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Folder Selector Dropdown */}
                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span className="text-slate-500">Folder:</span>
                    <select
                      value={doc.folder || 'General'}
                      onChange={(e) => updateDocumentFolder(doc._id, e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-0.5 text-slate-300 text-[11px] outline-none hover:border-slate-700"
                    >
                      {folders.map((f) => (
                        <option key={f} value={f}>
                          📁 {f}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="pt-3 border-t border-slate-800/80 grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => handleAction(doc, 'chat')}
                    className="py-1.5 px-2 rounded-lg bg-brand-600/20 hover:bg-brand-600/30 text-brand-300 border border-brand-500/30 text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors"
                    title="Open Chat"
                  >
                    <MessageSquare className="w-3 h-3" />
                    <span>Chat</span>
                  </button>

                  <button
                    onClick={() =>
                      openPdfViewer({
                        documentId: doc._id,
                        documentName: doc.originalName,
                        pageNumber: 1,
                      })
                    }
                    className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-medium flex items-center justify-center gap-1 transition-colors"
                    title="Open PDF Viewer"
                  >
                    <FileText className="w-3 h-3 text-rose-400" />
                    <span>View PDF</span>
                  </button>

                  <button
                    onClick={() => handleAction(doc, 'summary')}
                    className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-medium flex items-center justify-center gap-1 transition-colors"
                    title="Auto Summary"
                  >
                    <BookOpen className="w-3 h-3 text-indigo-400" />
                    <span>Summary</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
