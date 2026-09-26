import React, { useState } from 'react';
import {
  FileText,
  Trash2,
  Plus,
  MessageSquare,
  UploadCloud,
  CheckSquare,
  Square,
  Folder,
  FolderPlus,
  Layers,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Lock,
} from 'lucide-react';
import { useDocument } from '../context/DocumentContext';
import { useAuth } from '../context/AuthContext';
import { chatApi } from '../services/api';
import { cleanDocumentTitle, getDocumentFileType } from '../utils/documentUtils';

export default function Sidebar() {
  const {
    documents,
    activeDocument,
    selectDocument,
    selectedDocIds,
    toggleDocumentSelection,
    deleteDocument,
    conversations,
    activeConversationId,
    setActiveConversationId,
    setShowUploadModal,
    fetchConversations,
    openPdfViewer,
    folders,
    selectedFolder,
    setSelectedFolder,
    createFolder,
    updateDocumentFolder,
    showToast,
    setShowAuthModal,
  } = useDocument();

  const { isAuthenticated, user } = useAuth();

  const [showFolderInput, setShowFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const handleCreateNewChat = async () => {
    try {
      const res = await chatApi.createConversation({
        title: 'New Research Chat',
        documentIds: selectedDocIds,
      });
      if (res.data.success) {
        await fetchConversations();
        setActiveConversationId(res.data.conversation._id);
        showToast('Started new chat session', 'info');
      }
    } catch (err) {
      showToast('Error starting new chat', 'error');
    }
  };

  const handleDeleteConversation = async (e, convId) => {
    e.stopPropagation();
    try {
      await chatApi.deleteConversation(convId);
      await fetchConversations();
      if (activeConversationId === convId) {
        setActiveConversationId(null);
      }
      showToast('Conversation deleted', 'info');
    } catch (err) {
      showToast('Error deleting conversation', 'error');
    }
  };

  const handleCreateFolder = (e) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      createFolder(newFolderName.trim());
      setNewFolderName('');
      setShowFolderInput(false);
    }
  };

  const displayedDocs = documents.filter((d) =>
    selectedFolder ? d.folder === selectedFolder : true
  );

  return (
    <aside className="w-80 h-[calc(100vh-4rem)] border-r border-slate-800/80 bg-slate-900/70 flex flex-col shrink-0 hidden md:flex">
      {/* Top Action Bar */}
      <div className="p-3 border-b border-slate-800/80 space-y-2">
        <button
          onClick={() => setShowUploadModal(true)}
          className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-lg shadow-brand-600/20 transition-all active:scale-98"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload PDF Document</span>
        </button>

        {/* Project Folders Scroller */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] no-scrollbar">
          <button
            onClick={() => setSelectedFolder(null)}
            className={`px-2 py-0.5 rounded-md shrink-0 font-medium transition-colors ${
              selectedFolder === null
                ? 'bg-brand-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            All ({documents.length})
          </button>

          {folders.map((f) => {
            const count = documents.filter((d) => d.folder === f).length;
            const isSelected = selectedFolder === f;
            return (
              <button
                key={f}
                onClick={() => setSelectedFolder(f)}
                className={`px-2 py-0.5 rounded-md shrink-0 font-medium transition-colors flex items-center gap-1 ${
                  isSelected
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <span>{f}</span>
                <span className="text-[10px] opacity-70">({count})</span>
              </button>
            );
          })}

          <button
            onClick={() => setShowFolderInput((prev) => !prev)}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-indigo-400 shrink-0"
            title="Create Project Folder"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>

        {/* Folder Creator Input */}
        {showFolderInput && (
          <form onSubmit={handleCreateFolder} className="flex items-center gap-1 pt-1">
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="New folder..."
              autoFocus
              className="flex-1 px-2 py-1 rounded bg-slate-950 border border-indigo-500 text-xs text-white outline-none"
            />
            <button
              type="submit"
              className="px-2 py-1 rounded bg-indigo-600 text-white text-xs font-semibold"
            >
              Add
            </button>
          </form>
        )}
      </div>

      {/* Scrollable Document & Conversation Lists */}
      <div className="flex-1 overflow-y-auto p-3 space-y-5">
        {/* Documents Section */}
        <div>
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-brand-400" />
              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                Documents ({displayedDocs.length})
              </span>
            </div>
            {selectedDocIds.length > 1 ? (
              <span className="text-[10px] text-brand-300 font-semibold bg-brand-500/20 px-1.5 py-0.5 rounded border border-brand-500/30">
                {selectedDocIds.length} Selected
              </span>
            ) : (
              <span className="text-[10px] text-emerald-400 font-medium bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                Saved to Account
              </span>
            )}
          </div>

          {displayedDocs.length === 0 ? (
            <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center bg-slate-950/30 space-y-2">
              <FileText className="w-8 h-8 text-slate-600 mx-auto opacity-60" />
              <div>
                <p className="text-xs text-slate-300 font-medium">No saved documents yet</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Upload a PDF to start analyzing and chatting</p>
              </div>
              <button
                onClick={() => setShowUploadModal(true)}
                className="mt-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors inline-flex items-center gap-1.5 shadow-sm"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                Upload PDF
              </button>
            </div>
          ) : (
            <div className="space-y-1.5">
              {displayedDocs.map((doc) => {
                const isActive = activeDocument?._id === doc._id;
                const isChecked = selectedDocIds.includes(doc._id);

                return (
                  <div
                    key={doc._id}
                    onClick={() => selectDocument(doc)}
                    className={`group relative flex items-start gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      isActive
                        ? 'bg-brand-950/40 border-brand-500/50 shadow-sm'
                        : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700 hover:bg-slate-850/50'
                    }`}
                  >
                    {/* Multi-doc Checkbox */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleDocumentSelection(doc._id);
                      }}
                      title={isChecked ? 'Selected for querying' : 'Click to select for multi-doc search'}
                      className="mt-0.5 text-slate-400 hover:text-brand-400 shrink-0"
                    >
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-brand-400" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-600" />
                      )}
                    </button>

                    {/* Doc Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="px-1 py-0.2 rounded bg-rose-500/20 text-rose-300 font-bold text-[9px] shrink-0">
                            {getDocumentFileType(doc.originalName)}
                          </span>
                          <p
                            className={`font-medium truncate ${
                              isActive ? 'text-brand-200' : 'text-slate-200'
                            }`}
                            title={doc.originalName}
                          >
                            {cleanDocumentTitle(doc.originalName)}
                          </p>
                        </div>

                        {/* Actions Group */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {/* Open in PDF Viewer Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openPdfViewer({
                                documentId: doc._id,
                                documentName: doc.originalName,
                                pageNumber: 1,
                              });
                            }}
                            className="p-1 hover:text-brand-300 text-slate-400 transition-colors"
                            title="Open in PDF Viewer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm(`Delete "${doc.originalName}"?`)) {
                                deleteDocument(doc._id);
                              }
                            }}
                            className="p-1 hover:text-rose-400 text-slate-500 transition-colors"
                            title="Delete PDF"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-400">
                        <span>{doc.pageCount || 1}p</span>
                        <span>•</span>
                        <span>{doc.chunkCount || 0} chunks</span>
                        <span>•</span>
                        <span className="text-slate-500 truncate max-w-[60px]">
                          📁 {doc.folder || 'General'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Conversations Section */}
        <div>
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                Chat History ({conversations.length})
              </span>
            </div>
            <button
              onClick={handleCreateNewChat}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Start New Chat"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {conversations.length === 0 ? (
            <div className="p-3 rounded-xl border border-slate-800/80 bg-slate-950/20 text-center">
              <p className="text-xs text-slate-500">No previous chat sessions</p>
              <button
                onClick={handleCreateNewChat}
                className="mt-2 text-[11px] text-brand-400 hover:underline inline-block"
              >
                + Start your first chat
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              {conversations.map((conv) => {
                const isSelected = activeConversationId === conv._id;
                return (
                  <div
                    key={conv._id}
                    onClick={() => setActiveConversationId(conv._id)}
                    className={`group flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-slate-800 text-white font-medium shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <MessageSquare className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{conv.title || 'Chat'}</span>
                    </div>
                    <button
                      onClick={(e) => handleDeleteConversation(e, conv._id)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-rose-400 text-slate-500 transition-opacity"
                      title="Delete chat"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 text-[11px] text-slate-500 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-brand-400" />
          <span>DocuMind Grounded RAG</span>
        </div>
        <span className="text-emerald-400 font-medium">Ready</span>
      </div>
    </aside>
  );
}
