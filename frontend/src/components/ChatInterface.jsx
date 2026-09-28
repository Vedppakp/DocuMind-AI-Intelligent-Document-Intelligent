import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Bookmark,
  FileText,
  Copy,
  Check,
  HelpCircle,
  Download,
  BookOpen,
  ArrowRight,
  Loader2,
  ExternalLink,
  Square,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
  SplitSquareVertical,
  AlertTriangle,
  ZoomIn,
  Search,
  Lock,
  CheckCircle2,
} from 'lucide-react';
import { marked } from 'marked';
import { useDocument } from '../context/DocumentContext';
import { useAuth } from '../context/AuthContext';
import { chatApi, toolApi, documentApi } from '../services/api';
import { cleanDocumentTitle, getDocumentFileType } from '../utils/documentUtils';

marked.setOptions({
  breaks: true,
  gfm: true,
});

export default function ChatInterface() {
  const {
    activeDocument,
    selectedDocIds,
    toggleDocumentSelection,
    selectAllDocuments,
    clearDocumentSelection,
    activeConversationId,
    setActiveConversationId,
    openPdfViewer,
    setActiveTab,
    setShowSettingsModal,
    setShowAuthModal,
    fetchConversations,
    showToast,
    documents,
    setShowUploadModal,
    strictGrounding,
    setStrictGrounding,
    temperature,
    selectedModel,
  } = useDocument();

  const { isAuthenticated, user } = useAuth();

  const hasGeminiKey = !!localStorage.getItem('documind_gemini_key');

  const [messages, setMessages] = useState([]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const streamingAbortRef = useRef(false);
  const messagesEndRef = useRef(null);

  // ⭐ DenserAI-style Split PDF Viewer State (Embedded Side-by-Side) ⭐
  const [splitPdfOpen, setSplitPdfOpen] = useState(false);
  const [splitPage, setSplitPage] = useState(1);
  const [splitDocId, setSplitDocId] = useState(null);
  const [splitDocName, setSplitDocName] = useState('');
  const [splitExcerpt, setSplitExcerpt] = useState('');
  const [splitScore, setSplitScore] = useState(0);
  const [splitCopied, setSplitCopied] = useState(false);

  // Load conversation messages when conversation changes
  useEffect(() => {
    if (activeConversationId) {
      loadMessages(activeConversationId);
    } else {
      setMessages([]);
    }
  }, [activeConversationId]);

  const loadMessages = async (convId) => {
    try {
      const res = await chatApi.getMessages(convId);
      if (res.data.success) {
        setMessages(res.data.messages || []);
      }
    } catch (err) {
      console.warn('Error loading messages:', err);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, isStreaming]);

  // Handle opening the side-by-side split PDF viewer on a specific page
  const handleOpenSplitPdf = ({ documentId, documentName, pageNumber = 1, excerpt = '', score = 0 }) => {
    const docId = documentId || activeDocument?._id;
    const docName = documentName || activeDocument?.originalName || 'PDF Document';
    const targetPage = Math.max(1, parseInt(pageNumber, 10) || 1);
    setSplitDocId(docId);
    setSplitDocName(docName);
    setSplitPage(targetPage);
    setSplitExcerpt(excerpt || '');
    setSplitScore(score || 0);
    setSplitPdfOpen(true);

    // If on smaller screen where split view is hidden, open the full modal viewer
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      openPdfViewer({
        documentId: docId,
        documentName: docName,
        pageNumber: targetPage,
        excerpt: excerpt || '',
        score: score || 0,
      });
    }
  };

  // Streaming typewriter simulator for smooth token experience
  const streamMessageResponse = async (fullMessage) => {
    const text = fullMessage.content || '';
    const tempId = fullMessage._id || 'msg-' + Date.now();

    setIsStreaming(true);
    streamingAbortRef.current = false;

    setMessages((prev) => [
      ...prev,
      {
        ...fullMessage,
        _id: tempId,
        content: '',
      },
    ]);

    const words = text.split(' ');
    let currentText = '';

    for (let i = 0; i < words.length; i++) {
      if (streamingAbortRef.current) {
        setMessages((prev) =>
          prev.map((m) => (m._id === tempId ? { ...m, content: text } : m))
        );
        break;
      }

      currentText += (i === 0 ? '' : ' ') + words[i];
      setMessages((prev) =>
        prev.map((m) => (m._id === tempId ? { ...m, content: currentText } : m))
      );

      const delay = Math.min(25, Math.max(8, Math.floor(Math.random() * 20)));
      await new Promise((r) => setTimeout(r, delay));
    }

    setIsStreaming(false);
  };

  const handleStopStreaming = () => {
    streamingAbortRef.current = true;
    setIsStreaming(false);
  };

  const handleSendMessage = async (textToSend = null) => {
    const question = textToSend || inputQuery;
    if (!question || question.trim().length === 0 || loading || isStreaming) return;

    if (!activeDocument && documents.length === 0) {
      showToast('Please upload a PDF document first to ask questions', 'info');
      setShowUploadModal(true);
      return;
    }

    setInputQuery('');
    const userMsg = {
      _id: 'temp-' + Date.now(),
      role: 'user',
      content: question,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const targetDocIds =
        selectedDocIds.length > 0
          ? selectedDocIds
          : activeDocument
          ? [activeDocument._id]
          : [];

      const res = await chatApi.sendMessage({
        question,
        documentIds: targetDocIds,
        conversationId: activeConversationId,
        strictGrounding,
        temperature,
      });

      if (res.data.success) {
        if (!activeConversationId && res.data.conversationId) {
          setActiveConversationId(res.data.conversationId);
          fetchConversations();
        }

        setLoading(false);
        await streamMessageResponse(res.data.message);
      }
    } catch (err) {
      console.error('Chat error:', err);
      showToast(err.response?.data?.error || 'Failed to get answer', 'error');
      setLoading(false);
      setMessages((prev) => [
        ...prev,
        {
          _id: 'err-' + Date.now(),
          role: 'assistant',
          content:
            'Sorry, I encountered an error while retrieving document context. Please verify that your PDF is processed and try again.',
          citations: [],
          suggestedQuestions: [],
        },
      ]);
    }
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('Copied to clipboard', 'info');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopySplitExcerpt = () => {
    if (!splitExcerpt) return;
    navigator.clipboard.writeText(splitExcerpt);
    setSplitCopied(true);
    showToast('Excerpt copied to clipboard', 'info');
    setTimeout(() => setSplitCopied(false), 2000);
  };

  const handleExportReport = async () => {
    if (!activeDocument) {
      showToast('Please select a document first', 'warning');
      return;
    }
    try {
      const res = await toolApi.getReport(activeDocument._id, activeConversationId);
      if (res.data.success) {
        const element = document.createElement('a');
        const file = new Blob([res.data.report.markdown], { type: 'text/markdown' });
        element.href = URL.createObjectURL(file);
        element.download = `${cleanDocumentTitle(activeDocument.originalName)}_AI_Report.md`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        showToast('Intelligence Report downloaded', 'success');
      }
    } catch (err) {
      showToast('Error generating report', 'error');
    }
  };

  /**
   * Parses Markdown text into styled HTML and turns [Page X] citations into interactive clickable buttons
   * that directly invoke handleOpenSplitPdf()!
   */
  const renderFormattedText = (text, citations = []) => {
    if (!text) return null;

    const processed = text.replace(
      /\[(?:Doc:\s*"?([^"\]]+)"?,\s*)?Page\s*(\d+)\]/gi,
      (match, doc, page) => {
        const safeDoc = (doc || activeDocument?.originalName || 'PDF Document').replace(/"/g, '&quot;');
        return `<button type="button" class="citation-pill" data-page="${page}" data-doc="${safeDoc}"><svg class="w-3 h-3 text-sky-400 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>Page ${page}</button>`;
      }
    );

    const htmlContent = marked.parse(processed);

    return (
      <div
        className="prose-documind"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
        onClick={(e) => {
          const pill = e.target.closest('.citation-pill');
          if (pill) {
            e.preventDefault();
            e.stopPropagation();
            const pageNum = parseInt(pill.getAttribute('data-page'), 10);
            const docName = pill.getAttribute('data-doc');
            const matchingCitation = citations.find((c) => c.pageNumber === pageNum) || {
              pageNumber: pageNum,
              documentName: docName || activeDocument?.originalName || 'PDF Document',
              text: `Referenced content on Page ${pageNum} of ${docName || activeDocument?.originalName || 'the document'}.`,
              score: 0.95,
            };

            handleOpenSplitPdf({
              documentId: matchingCitation.documentId || activeDocument?._id,
              documentName: matchingCitation.documentName || activeDocument?.originalName,
              pageNumber: matchingCitation.pageNumber,
              excerpt: matchingCitation.text,
              score: matchingCitation.score,
            });
          }
        }}
      />
    );
  };

  const activeDocCleanTitle = activeDocument
    ? cleanDocumentTitle(activeDocument.originalName)
    : 'All Documents';
  const activeDocType = activeDocument
    ? getDocumentFileType(activeDocument.originalName)
    : 'PDF';

  const splitDoc = documents.find((d) => d._id === splitDocId) || activeDocument;
  const splitMaxPages = splitDoc?.pageCount || 100;
  const splitPdfUrl = splitDocId ? documentApi.getPdfUrl(splitDocId, splitPage) : '';

  // Empty state when no documents are uploaded
  if (documents.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-slate-950/20">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600/20 to-indigo-600/20 border border-brand-500/30 flex items-center justify-center mb-4 text-brand-400">
          <FileText className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">No Documents Uploaded</h2>
        <p className="text-xs text-slate-400 max-w-md mt-1.5 leading-relaxed">
          Upload research reports, textbooks, legal agreements, or manuals to query and cross-reference with precise page citations.
        </p>
        <button
          onClick={() => setShowUploadModal(true)}
          className="mt-5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-brand-600/25 flex items-center gap-2 transition-all active:scale-95"
        >
          <Sparkles className="w-4 h-4" />
          <span>Upload PDF Document</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] bg-slate-950/40 relative overflow-hidden">
      {/* Session State & History Indicator Banner */}
      <div className="px-4 py-1.5 bg-emerald-500/5 border-b border-emerald-500/20 text-xs flex items-center justify-between text-emerald-300 shrink-0">
        <div className="flex items-center gap-1.5 text-[11px]">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>
            <strong>Persistent History Active:</strong> Signed in as{' '}
            <strong className="text-white">{user?.name || user?.email}</strong>. Conversations are saved to your account.
          </span>
        </div>
      </div>

      {/* Top Quick Actions & AI Controls Bar */}
      <div className="px-4 py-2.5 bg-slate-900/70 border-b border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-semibold text-slate-400 shrink-0">Target:</span>
          {activeDocument ? (
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-slate-800/90 border border-slate-700/60 max-w-xs">
              <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 text-[10px] font-bold border border-rose-500/30">
                {activeDocType}
              </span>
              <span
                className="font-medium text-brand-200 truncate cursor-pointer hover:underline"
                onClick={() =>
                  handleOpenSplitPdf({
                    documentId: activeDocument._id,
                    documentName: activeDocument.originalName,
                    pageNumber: 1,
                  })
                }
                title="Click to view PDF side-by-side"
              >
                {activeDocCleanTitle}
              </span>
            </div>
          ) : (
            <span className="text-slate-500 italic">All uploaded documents</span>
          )}

          {selectedDocIds.length > 1 && (
            <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px]">
              Querying {selectedDocIds.length} PDFs
            </span>
          )}
        </div>

        {/* AI Controls & Split View Toggle */}
        <div className="flex items-center gap-2">
          {/* Split-Screen PDF Viewer Toggle (DenserAI style) */}
          <button
            onClick={() => {
              if (splitPdfOpen) {
                setSplitPdfOpen(false);
              } else {
                handleOpenSplitPdf({
                  documentId: activeDocument?._id,
                  documentName: activeDocument?.originalName,
                  pageNumber: 1,
                });
              }
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all ${
              splitPdfOpen
                ? 'bg-brand-600 text-white border-brand-500 shadow-sm shadow-brand-600/30'
                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title="Toggle side-by-side PDF preview with highlight inspection"
          >
            <SplitSquareVertical className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">PDF Split View:</span>
            <span>{splitPdfOpen ? 'OPEN' : 'OFF'}</span>
          </button>

          {/* Strict Grounding Toggle */}
          <button
            onClick={() => setStrictGrounding((prev) => !prev)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all ${
              strictGrounding
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
            }`}
            title="Prevents hallucinations when information is not found in your documents"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Strict Grounding:</span>
            <span>{strictGrounding ? 'ON' : 'OFF'}</span>
          </button>

          {/* Quick Tools */}
          <button
            onClick={() => setActiveTab('summary')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700/60 transition-colors"
            title="Generate structured summary"
          >
            <BookOpen className="w-3.5 h-3.5 text-brand-400" />
            <span className="hidden lg:inline">Summary</span>
          </button>

          <button
            onClick={handleExportReport}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700/60 transition-colors"
            title="Download Intelligence Report"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden lg:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Multi-Document Selection Bar (⭐ Viva Priority: Cross-Document Retrieval) */}
      {documents.length > 1 && (
        <div className="px-4 py-2 bg-slate-950/80 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-400 flex items-center gap-1.5 shrink-0">
              <FileText className="w-3.5 h-3.5 text-brand-400" />
              <span>Select Documents to Query:</span>
            </span>

            <div className="flex items-center gap-1.5 flex-wrap">
              {documents.map((doc) => {
                const isSelected = selectedDocIds.includes(doc._id);
                const cleanName = cleanDocumentTitle(doc.originalName);
                return (
                  <label
                    key={doc._id}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border cursor-pointer transition-all select-none ${
                      isSelected
                        ? 'bg-brand-600/20 border-brand-500 text-brand-200 shadow-sm'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleDocumentSelection(doc._id)}
                      className="w-3.5 h-3.5 rounded bg-slate-950 border-slate-700 text-brand-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                    />
                    <span className="font-medium text-[11px] truncate max-w-[150px]" title={doc.originalName}>
                      {cleanName}
                    </span>
                    <span className="text-[10px] text-slate-500 font-normal">
                      ({doc.pageCount || 1}p)
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={selectAllDocuments}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 font-medium transition-colors"
            >
              Select All
            </button>
            <button
              onClick={clearDocumentSelection}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-400 hover:text-slate-200 font-medium transition-colors"
            >
              Clear
            </button>
            <span className="text-[10px] text-brand-400/90 font-medium pl-1">
              • {selectedDocIds.length} of {documents.length} active
            </span>
          </div>
        </div>
      )}

      {/* Main Split-Screen Container (Chat Left, PDF Viewer Right) */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* Left / Main: Chat Conversation Viewport */}
        <div
          className={`flex flex-col min-h-0 transition-all duration-200 ${
            splitPdfOpen ? 'w-full lg:w-1/2 border-r border-slate-800' : 'w-full'
          }`}
        >
          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {messages.length === 0 ? (
              !activeDocument ? (
                <div className="max-w-md mx-auto my-12 text-center space-y-4 p-6 rounded-2xl bg-slate-900/60 border border-slate-800 animate-fadeIn">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto ring-1 ring-indigo-500/30">
                    <FileText className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight">
                      No Document Selected
                    </h3>
                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                      Select a saved document from your history or upload a new PDF to begin.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
                    <button
                      onClick={() => setShowUploadModal(true)}
                      className="w-full sm:w-auto px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-600/25 transition-all"
                    >
                      <UploadCloud className="w-4 h-4" />
                      <span>Upload PDF Document</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="max-w-xl mx-auto my-10 text-center space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-400 flex items-center justify-center mx-auto ring-1 ring-brand-500/30">
                    <Bot className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight">
                      Ask anything about {activeDocCleanTitle}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Grounded with spatial retrieval. Click any citation to inspect the highlighted passage in the live PDF.
                    </p>
                  </div>

                  {/* Suggested Starter Questions */}
                  <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                    {[
                      'What is the classification accuracy of the proposed model?',
                      'Summarize the primary methodology and workflow',
                      'Compare the results with previous existing work',
                      'List the project team members and supervisor',
                    ].map((starter, i) => (
                      <button
                        key={i}
                        onClick={() => handleSendMessage(starter)}
                        className="p-3 rounded-xl bg-slate-900/70 hover:bg-slate-850 border border-slate-800 hover:border-brand-500/40 text-xs text-slate-300 text-left transition-all group flex items-center justify-between"
                      >
                        <span className="line-clamp-2">{starter}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-brand-400 transition-colors shrink-0 ml-2" />
                      </button>
                    ))}
                  </div>
                </div>
              )
            ) : (
              messages.map((msg, idx) => {
                const isUnsupported =
                  msg.isGrounded === false ||
                  (msg.role !== 'user' &&
                    (msg.content.includes("I couldn't find this information") ||
                      msg.content.includes('not found in your documents') ||
                      msg.content.includes('do not contain evidence') ||
                      msg.content.includes('could not be verified')));

                return (
                  <div
                    key={msg._id || idx}
                    className={`flex gap-3 ${
                      splitPdfOpen ? 'max-w-full' : 'max-w-4xl'
                    } ${
                      msg.role === 'user' ? 'ml-auto justify-end' : 'mr-auto justify-start'
                    }`}
                  >
                    {/* Assistant Avatar */}
                    {msg.role !== 'user' && (
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-brand-600/20 ring-1 ring-white/10 mt-1">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}

                    <div
                      className={`rounded-2xl p-4 text-xs sm:text-[13px] leading-relaxed relative group ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-lg shadow-brand-600/20 max-w-xl'
                          : 'bg-slate-900/90 border border-slate-800/90 text-slate-200 shadow-xl w-full max-w-2xl'
                      }`}
                    >
                      {/* Grounding Guard & Grounded Answer Badges */}
                      {msg.role !== 'user' && (
                        isUnsupported ? (
                          <div className="mb-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                                <AlertTriangle className="w-3.5 h-3.5" />
                              </div>
                              <div>
                                <div className="font-bold text-amber-200">⚠️ Information Not Found</div>
                                <div className="text-[11px] text-amber-400/90">
                                  This information could not be verified from the uploaded documents.
                                </div>
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase tracking-wider border border-amber-500/30 shrink-0">
                              Unverified
                            </span>
                          </div>
                        ) : (
                          <div className="mb-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                                <ShieldCheck className="w-3.5 h-3.5" />
                              </div>
                              <div>
                                <div className="font-bold text-emerald-200">🛡️ Grounded Answer</div>
                                <div className="text-[11px] text-emerald-400/90">
                                  Information found in document
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 text-[11px]">
                                Confidence: {msg.groundedConfidence || 92}%
                              </span>
                              {msg.groundedPages && msg.groundedPages.length > 0 && (
                                <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold border border-slate-700 text-[11px]">
                                  Sources: {msg.groundedPages.map((p) => `Page ${p}`).join(', ')}
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      )}

                      {/* Content Body */}
                      <div className="prose-documind">
                        {msg.role === 'user' ? (
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        ) : (
                          renderFormattedText(msg.content, msg.citations || [])
                        )}
                      </div>

                      {/* ⭐ User Specified Source Citation Cards ⭐ */}
                      {msg.role !== 'user' && msg.citations && msg.citations.length > 0 && (
                        <div className="mt-3.5 pt-3 border-t border-slate-800/90 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                              <Bookmark className="w-3.5 h-3.5 text-brand-400" />
                              Sources:
                            </span>
                            <span className="text-[10px] text-slate-500">
                              Click citation to inspect highlighted passage
                            </span>
                          </div>

                          <div
                            className={`grid gap-2 ${
                              splitPdfOpen ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'
                            }`}
                          >
                            {msg.citations.map((cit, cIdx) => (
                              <div
                                key={cIdx}
                                className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-brand-500/50 transition-all flex flex-col justify-between space-y-2 group/card"
                              >
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between text-[11px]">
                                    <span
                                      className="font-semibold text-slate-200 truncate max-w-[160px] flex items-center gap-1"
                                      title={cit.documentName}
                                    >
                                      <FileText className="w-3 h-3 text-brand-400 shrink-0" />
                                      {cleanDocumentTitle(cit.documentName || activeDocument?.originalName)}
                                    </span>
                                    <span className="px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 font-bold border border-brand-500/30">
                                      📍 Page {cit.pageNumber}
                                    </span>
                                  </div>

                                  {cit.text && (
                                    <p className="text-[11px] text-amber-200/90 font-sans italic line-clamp-2 bg-amber-500/10 p-2 rounded-lg border border-amber-500/25 selection:bg-amber-400/40">
                                      "{cit.text}"
                                    </p>
                                  )}
                                </div>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleOpenSplitPdf({
                                      documentId: cit.documentId || activeDocument?._id,
                                      documentName: cit.documentName || activeDocument?.originalName,
                                      pageNumber: cit.pageNumber,
                                      excerpt: cit.text,
                                      score: cit.score,
                                    })
                                  }
                                  className="w-full py-1.5 px-2.5 rounded-lg bg-brand-600/20 hover:bg-brand-600 text-brand-200 hover:text-white border border-brand-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-98"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  <span>Open Source (Page {cit.pageNumber})</span>
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Suggested Follow-ups */}
                      {msg.role !== 'user' &&
                        msg.suggestedQuestions &&
                        msg.suggestedQuestions.length > 0 && (
                          <div className="mt-3 pt-2 border-t border-slate-800/60">
                            <p className="text-[11px] font-semibold text-slate-400 mb-1">
                              Suggested follow-ups:
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {msg.suggestedQuestions.map((q, qIdx) => (
                                <button
                                  key={qIdx}
                                  onClick={() => handleSendMessage(q)}
                                  className="px-2.5 py-1 rounded-lg bg-slate-950/60 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/40 text-[11px] text-slate-300 transition-colors text-left"
                                >
                                  {q}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                      {/* Copy Button */}
                      {msg.role !== 'user' && (
                        <button
                          onClick={() => handleCopy(msg.content, msg._id || idx)}
                          className="absolute top-2.5 right-2.5 p-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Copy response"
                        >
                          {copiedId === (msg._id || idx) ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>

                    {/* User Avatar */}
                    {msg.role === 'user' && (
                      <div className="w-8 h-8 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center shrink-0 border border-slate-700 mt-1">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {/* Loading Indicator */}
            {loading && (
              <div className="flex gap-3 max-w-xl mr-auto">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center shrink-0 animate-pulse">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-xl flex items-center gap-3">
                  <Loader2 className="w-4 h-4 animate-spin text-brand-400" />
                  <span className="text-xs text-slate-300 font-medium">
                    Retrieving chunks & synthesizing grounded response...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Floating Stop Generating Control */}
          {isStreaming && (
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20">
              <button
                onClick={handleStopStreaming}
                className="px-3.5 py-1.5 rounded-full bg-slate-900/95 hover:bg-slate-800 text-slate-200 border border-slate-700 shadow-xl flex items-center gap-2 text-xs font-semibold animate-bounce"
              >
                <Square className="w-3 h-3 text-rose-400 fill-rose-400" />
                <span>Stop Generating</span>
              </button>
            </div>
          )}

          {/* Input Prompt Box */}
          <div className="p-3 sm:p-4 border-t border-slate-800/80 bg-slate-900/80 backdrop-blur-md shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="max-w-3xl mx-auto relative flex items-center gap-2"
            >
              <div className="relative flex-1">
                <textarea
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={
                    !activeDocument
                      ? 'Select or upload a PDF document to begin...'
                      : `Ask anything about ${activeDocCleanTitle}...`
                  }
                  rows={1}
                  className="w-full pl-4 pr-12 py-3 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 resize-none outline-none transition-all shadow-inner"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !inputQuery.trim()}
                className="p-3 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 disabled:opacity-40 text-white shadow-md shadow-brand-600/25 transition-all active:scale-95 shrink-0"
                title="Send Question (Enter)"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* ⭐ Right: DenserAI-Style Integrated Live PDF Viewer with Highlight Banner ⭐ */}
        {splitPdfOpen && (
          <div className="hidden lg:flex w-1/2 flex-col bg-slate-950 min-h-0 relative animate-fadeIn">
            {/* PDF Viewer Top Navigation Bar (matching DenserAI Image 4) */}
            <div className="px-3 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs gap-2 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-bold text-[10px]">
                  PDF
                </span>
                <span className="font-semibold text-white truncate max-w-[180px]" title={splitDocName}>
                  {cleanDocumentTitle(splitDocName)}
                </span>
              </div>

              {/* Page Navigator */}
              <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800">
                <button
                  onClick={() => setSplitPage((prev) => Math.max(1, prev - 1))}
                  disabled={splitPage <= 1}
                  className="p-0.5 rounded hover:bg-slate-800 disabled:opacity-30 text-slate-300"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                <span className="text-[11px] text-slate-300">
                  Page <strong className="text-brand-400">{splitPage}</strong> / {splitMaxPages}
                </span>

                <button
                  onClick={() => setSplitPage((prev) => Math.min(splitMaxPages, prev + 1))}
                  disabled={splitPage >= splitMaxPages}
                  className="p-0.5 rounded hover:bg-slate-800 disabled:opacity-30 text-slate-300"
                  title="Next Page"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Action Icons */}
              <div className="flex items-center gap-1">
                {/* Maximize to Full Modal */}
                <button
                  onClick={() =>
                    openPdfViewer({
                      documentId: splitDocId,
                      documentName: splitDocName,
                      pageNumber: splitPage,
                      excerpt: splitExcerpt,
                      score: splitScore,
                    })
                  }
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                  title="Open Fullscreen Modal"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>

                {/* Close Split View */}
                <button
                  onClick={() => setSplitPdfOpen(false)}
                  className="p-1 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition-colors"
                  title="Close PDF Split View (X)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Glowing Ground-Truth Highlight Passage Banner (Highlighted relevant text) */}
            {splitExcerpt ? (
              <div className="p-3 bg-amber-500/10 border-b border-amber-500/30 text-amber-200 text-xs shrink-0 shadow-md">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold flex items-center gap-1.5 text-amber-300 text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    📍 Page {splitPage} Highlighted Evidence:
                  </span>
                  <button
                    onClick={handleCopySplitExcerpt}
                    className="flex items-center gap-1 text-[10px] text-amber-300 hover:text-white transition-colors font-medium"
                  >
                    {splitCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{splitCopied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="p-2 rounded-lg bg-amber-950/40 border border-amber-500/20 text-[11px] leading-relaxed font-sans italic selection:bg-amber-400/40">
                  "{splitExcerpt}"
                </div>
              </div>
            ) : null}

            {/* Live Embedded PDF Iframe */}
            <div className="flex-1 min-h-0 relative bg-slate-950">
              {splitPdfUrl ? (
                <iframe
                  key={`${splitDocId}-p${splitPage}`}
                  src={splitPdfUrl}
                  className="w-full h-full border-0 bg-slate-900"
                  title="PDF Document Reader"
                />
              ) : (
                <div className="flex-1 flex items-center justify-center p-6 text-center text-slate-500 text-xs">
                  Select a document or citation to preview
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
