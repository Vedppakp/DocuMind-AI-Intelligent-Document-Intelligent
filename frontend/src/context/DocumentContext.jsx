import React, { createContext, useContext, useState, useEffect } from 'react';
import { documentApi, chatApi } from '../services/api';
import { useAuth } from './AuthContext';

const DocumentContext = createContext();

export function DocumentProvider({ children }) {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [activeDocument, setActiveDocument] = useState(null);
  const [selectedDocIds, setSelectedDocIds] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'chat' | 'summary' | 'quiz' | 'compare' | 'admin'
  const [activeCitation, setActiveCitation] = useState(null);

  // Folder & Project Organization
  const [folders, setFolders] = useState(['General']);
  const [selectedFolder, setSelectedFolder] = useState(null); // null = All Folders

  // Interactive PDF Viewer Modal State (⭐ Key feature)
  const [activePdfViewer, setActivePdfViewer] = useState({
    isOpen: false,
    documentId: null,
    documentName: '',
    pageNumber: 1,
    excerpt: '',
    score: 0,
  });

  // AI & RAG Controls State
  const [strictGrounding, setStrictGrounding] = useState(() => {
    const saved = localStorage.getItem('documind_strict_grounding');
    return saved !== null ? saved === 'true' : true;
  });
  const [temperature, setTemperature] = useState(() => {
    const saved = localStorage.getItem('documind_temperature');
    return saved !== null ? parseFloat(saved) : 0.2;
  });
  const [responseLength, setResponseLength] = useState(() => {
    return localStorage.getItem('documind_response_length') || 'balanced';
  });
  const [selectedModel, setSelectedModel] = useState(() => {
    return localStorage.getItem('documind_model') || 'gemini-2.5-flash';
  });

  // Modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showArchModal, setShowArchModal] = useState(false);

  // Toast notifications
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  useEffect(() => {
    if (user) {
      fetchDocuments();
      fetchConversations();
      fetchFolders();
    }
  }, [user]);

  // Save AI settings to localStorage
  const updateAiSettings = ({ newStrictGrounding, newTemp, newLength, newModel }) => {
    if (newStrictGrounding !== undefined) {
      setStrictGrounding(newStrictGrounding);
      localStorage.setItem('documind_strict_grounding', String(newStrictGrounding));
    }
    if (newTemp !== undefined) {
      setTemperature(newTemp);
      localStorage.setItem('documind_temperature', String(newTemp));
    }
    if (newLength !== undefined) {
      setResponseLength(newLength);
      localStorage.setItem('documind_response_length', newLength);
    }
    if (newModel !== undefined) {
      setSelectedModel(newModel);
      localStorage.setItem('documind_model', newModel);
    }
  };

  // Automatically poll document status every 2 seconds if any document is processing
  useEffect(() => {
    const hasProcessing = documents.some((d) => d.status === 'processing');
    if (!hasProcessing) return;

    const interval = setInterval(() => {
      fetchDocuments();
    }, 2000);

    return () => clearInterval(interval);
  }, [documents]);

  const fetchFolders = async () => {
    try {
      const res = await documentApi.getFolders();
      if (res.data.success && res.data.folders) {
        const names = res.data.folders.map((f) => (typeof f === 'string' ? f : f.name)).filter(Boolean);
        if (!names.includes('General')) {
          names.unshift('General');
        }
        setFolders(names);
      }
    } catch (err) {
      console.warn('Fetch folders error:', err.message);
    }
  };

  const updateDocumentFolder = async (docId, folder) => {
    try {
      const res = await documentApi.updateFolder(docId, folder);
      if (res.data.success) {
        showToast(`Document moved to "${folder}"`, 'success');
        setDocuments((prev) =>
          prev.map((d) => (d._id === docId ? { ...d, folder } : d))
        );
        fetchFolders();
      }
    } catch (err) {
      showToast('Failed to update folder', 'error');
    }
  };

  const createFolder = (folderName) => {
    if (!folderName || !folderName.trim()) return;
    const clean = folderName.trim();
    if (!folders.includes(clean)) {
      setFolders((prev) => [...prev, clean]);
      showToast(`Folder "${clean}" created`, 'success');
    }
  };

  const openPdfViewer = ({ documentId, documentName, pageNumber = 1, excerpt = '', score = 0 }) => {
    const targetDoc = documents.find((d) => d._id === documentId) || activeDocument;
    setActivePdfViewer({
      isOpen: true,
      documentId: documentId || targetDoc?._id,
      documentName: documentName || targetDoc?.originalName || 'PDF Document',
      pageNumber: Math.max(1, parseInt(pageNumber, 10) || 1),
      excerpt: excerpt || '',
      score: score || 0,
    });
  };

  const closePdfViewer = () => {
    setActivePdfViewer((prev) => ({ ...prev, isOpen: false }));
  };

  const fetchDocuments = async () => {
    try {
      const res = await documentApi.list();
      if (res.data.success) {
        const docs = res.data.documents || [];
        setDocuments(docs);

        if (docs.length === 0) {
          setActiveDocument(null);
          setSelectedDocIds([]);
        } else if (!activeDocument || !docs.some((d) => d._id === activeDocument._id)) {
          setActiveDocument(docs[0]);
          setSelectedDocIds([docs[0]._id]);
        } else {
          // Keep activeDocument synchronized with fresh status and chunk counts
          const updatedActive = docs.find((d) => d._id === activeDocument._id);
          if (updatedActive) {
            setActiveDocument(updatedActive);
          }
        }
      }
    } catch (err) {
      console.warn('Fetch documents error:', err.message);
    }
  };

  const fetchConversations = async () => {
    try {
      const res = await chatApi.getConversations();
      if (res.data.success) {
        setConversations(res.data.conversations || []);
      }
    } catch (err) {
      console.warn('Fetch conversations error:', err.message);
    }
  };

  const selectDocument = (doc) => {
    setActiveDocument(doc);
    if (doc) {
      setSelectedDocIds([doc._id]);
    } else {
      setSelectedDocIds([]);
    }
  };

  const toggleDocumentSelection = (docId) => {
    setSelectedDocIds((prev) => {
      if (prev.includes(docId)) {
        const filtered = prev.filter((id) => id !== docId);
        if (filtered.length > 0) {
          const nextActive = documents.find((d) => d._id === filtered[0]);
          setActiveDocument(nextActive || null);
        } else {
          setActiveDocument(null);
        }
        return filtered;
      } else {
        const updated = [...prev, docId];
        const current = documents.find((d) => d._id === docId);
        setActiveDocument(current || activeDocument);
        return updated;
      }
    });
  };

  const selectAllDocuments = () => {
    const allIds = documents.map((d) => d._id);
    setSelectedDocIds(allIds);
    if (documents.length > 0 && !activeDocument) {
      setActiveDocument(documents[0]);
    }
  };

  const clearDocumentSelection = () => {
    if (documents.length > 0) {
      setSelectedDocIds([documents[0]._id]);
      setActiveDocument(documents[0]);
    } else {
      setSelectedDocIds([]);
      setActiveDocument(null);
    }
  };

  const deleteDocument = async (id) => {
    try {
      const res = await documentApi.delete(id);
      if (res.data.success) {
        showToast('Document deleted successfully', 'success');
        setDocuments((prev) => {
          const remaining = prev.filter((d) => d._id !== id);
          if (activeDocument?._id === id) {
            setActiveDocument(remaining[0] || null);
            setSelectedDocIds(remaining[0] ? [remaining[0]._id] : []);
          }
          return remaining;
        });
        fetchFolders();
      } else {
        showToast(res.data.error || 'Failed to delete document', 'error');
      }
    } catch (err) {
      console.error('Delete document failed:', err);
      const errorMsg =
        err.response?.data?.error ||
        err.message ||
        'Failed to delete document';
      showToast(errorMsg, 'error');

      if (err.response?.status === 401) {
        showToast('Your session has expired. Please sign in again.', 'error');
      }
    }
  };

  // Workspace Statistics
  const stats = {
    totalDocuments: documents.length,
    totalChunks: documents.reduce((acc, d) => acc + (d.chunkCount || 0), 0),
    totalPages: documents.reduce((acc, d) => acc + (d.pageCount || 1), 0),
    totalReadingTimeMinutes: documents.reduce(
      (acc, d) => acc + (d.readingTimeMinutes || Math.ceil((d.pageCount || 1) * 1.5)),
      0
    ),
    totalConversations: conversations.length,
    foldersCount: folders.length,
  };

  return (
    <DocumentContext.Provider
      value={{
        documents,
        activeDocument,
        selectedDocIds,
        conversations,
        activeConversationId,
        activeTab,
        activeCitation,
        folders,
        selectedFolder,
        activePdfViewer,
        strictGrounding,
        temperature,
        responseLength,
        selectedModel,
        stats,
        showUploadModal,
        showAuthModal,
        showSettingsModal,
        toast,
        setActiveDocument,
        selectDocument,
        toggleDocumentSelection,
        selectAllDocuments,
        clearDocumentSelection,
        setSelectedDocIds,
        setActiveConversationId,
        setActiveTab,
        setActiveCitation,
        setSelectedFolder,
        fetchFolders,
        updateDocumentFolder,
        createFolder,
        openPdfViewer,
        closePdfViewer,
        setStrictGrounding,
        setTemperature,
        setResponseLength,
        setSelectedModel,
        updateAiSettings,
        setShowUploadModal,
        setShowAuthModal,
        setShowSettingsModal,
        showArchModal,
        setShowArchModal,
        fetchDocuments,
        fetchConversations,
        deleteDocument,
        showToast,
      }}
    >
      {children}
    </DocumentContext.Provider>
  );
}

export function useDocument() {
  return useContext(DocumentContext);
}
