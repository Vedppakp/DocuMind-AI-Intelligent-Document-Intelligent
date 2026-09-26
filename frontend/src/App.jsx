import React from 'react';
import { Loader2 } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DocumentProvider, useDocument } from './context/DocumentContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import LandingDashboardView from './components/LandingDashboardView';
import ChatInterface from './components/ChatInterface';
import DocumentSummaryView from './components/DocumentSummaryView';
import QuizGeneratorView from './components/QuizGeneratorView';
import CompareDocumentsView from './components/CompareDocumentsView';
import AdminDashboardView from './components/AdminDashboardView';
import CitationViewer from './components/CitationViewer';
import PdfDocumentViewerModal from './components/PdfDocumentViewerModal';
import DocumentUploadModal from './components/DocumentUploadModal';
import SettingsModal from './components/SettingsModal';
import AuthModal from './components/AuthModal';
import AuthScreen from './components/AuthScreen';
import ArchitectureModal from './components/ArchitectureModal';
import Toast from './components/Toast';

function MainContent() {
  const { activeTab, showArchModal, setShowArchModal } = useDocument();

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Document & Session Sidebar (Desktop) */}
      <Sidebar />

      {/* Primary Dynamic View */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {activeTab === 'dashboard' && <LandingDashboardView />}
        {activeTab === 'chat' && <ChatInterface />}
        {activeTab === 'summary' && <DocumentSummaryView />}
        {activeTab === 'quiz' && <QuizGeneratorView />}
        {activeTab === 'compare' && <CompareDocumentsView />}
        {activeTab === 'admin' && <AdminDashboardView />}

        {/* Slide-out Citation Source Excerpt Drawer */}
        <CitationViewer />
      </main>

      {/* Interactive In-App PDF Document Viewer Modal */}
      <PdfDocumentViewerModal />

      {/* Global Modals & Overlays */}
      <DocumentUploadModal />
      <SettingsModal />
      <AuthModal />
      <ArchitectureModal isOpen={showArchModal} onClose={() => setShowArchModal(false)} />
      <Toast />
    </div>
  );
}

function AppContent() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-brand-400 animate-spin">
          <Loader2 className="w-5 h-5" />
        </div>
        <p className="text-xs font-medium tracking-wide text-slate-300">Loading DocuMind AI...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <AuthScreen />
        <Toast />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-brand-500/30 selection:text-white">
      <Navbar />
      <MainContent />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DocumentProvider>
        <AppContent />
      </DocumentProvider>
    </AuthProvider>
  );
}
