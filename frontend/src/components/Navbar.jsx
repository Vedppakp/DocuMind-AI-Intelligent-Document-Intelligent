import React, { useState } from 'react';
import {
  FileText,
  MessageSquare,
  BookOpen,
  HelpCircle,
  GitCompare,
  BarChart3,
  Settings,
  User as UserIcon,
  Sparkles,
  Layers,
  Upload,
  LayoutDashboard,
  ShieldCheck,
  Menu,
  X,
} from 'lucide-react';
import { useDocument } from '../context/DocumentContext';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const {
    activeTab,
    setActiveTab,
    activeDocument,
    selectedDocIds,
    documents,
    strictGrounding,
    setShowUploadModal,
    setShowSettingsModal,
    setShowAuthModal,
    setShowArchModal,
  } = useDocument();

  const { user, isAuthenticated, logout } = useAuth();
  const hasGeminiKey = !!localStorage.getItem('documind_gemini_key');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'chat', label: 'Chat with PDF', icon: MessageSquare },
    { id: 'summary', label: 'Summary', icon: BookOpen },
    { id: 'quiz', label: 'Quiz & Test', icon: HelpCircle },
    { id: 'compare', label: 'Compare', icon: GitCompare },
    { id: 'admin', label: 'Analytics', icon: BarChart3 },
  ];

  const handleNavClick = (id) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md px-3 sm:px-4 flex items-center justify-between sticky top-0 z-30">
      {/* Brand logo & active document status */}
      <div className="flex items-center gap-3">
        <div
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center gap-2.5 cursor-pointer select-none"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-brand-500/20 ring-1 ring-white/20 shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg text-white tracking-tight">DocuMind</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30">
                RAG AI
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
              Document Intelligence Platform
            </p>
          </div>
        </div>

        {/* Active Doc Pill */}
        {activeDocument && (
          <div className="hidden xl:flex items-center gap-2 pl-4 ml-3 border-l border-slate-800">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300 max-w-[200px] truncate">
              <FileText className="w-3.5 h-3.5 text-brand-400 shrink-0" />
              <span className="truncate">{activeDocument.originalName}</span>
              {selectedDocIds.length > 1 && (
                <span className="px-1.5 py-0.2 rounded-full bg-brand-500/30 text-brand-300 text-[10px] font-bold">
                  +{selectedDocIds.length - 1}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Tabs (Desktop) */}
      <nav className="hidden lg:flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800/80">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Right Actions */}
      <div className="flex items-center gap-2">
        {/* Upload Button */}
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-brand-600/20 transition-all active:scale-95"
        >
          <Upload className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Upload PDF</span>
        </button>

        {/* Gemini / Local RAG Indicator */}
        <button
          onClick={() => setShowSettingsModal(true)}
          title={
            hasGeminiKey
              ? 'Gemini 2.5 Active • Strict Grounding Enabled'
              : 'Local RAG Mode • Click to configure Gemini API Key'
          }
          className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border transition-all ${
            hasGeminiKey
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              hasGeminiKey ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
            }`}
          />
          <span>{hasGeminiKey ? 'Gemini AI' : 'Local RAG'}</span>
        </button>

        {/* Architecture Pipeline Blueprint */}
        <button
          onClick={() => setShowArchModal(true)}
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-all text-xs font-medium"
          title="View DocuMind RAG Architecture Blueprint"
        >
          <Layers className="w-3.5 h-3.5 text-brand-400" />
          <span>Pipeline</span>
        </button>

        {/* Settings Button */}
        <button
          onClick={() => setShowSettingsModal(true)}
          className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-all"
          title="AI Settings & Models"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Auth Profile / Sign In */}
        {isAuthenticated ? (
          <div className="flex items-center gap-1.5">
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-medium truncate max-w-[120px]">{user?.name || user?.email?.split('@')[0]}</span>
            </div>
            <button
              onClick={logout}
              title={`Signed in as ${user?.email} • Click to Sign Out`}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 hover:text-rose-300 text-slate-300 text-xs border border-slate-700 transition-all font-medium"
            >
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowAuthModal(true)}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-gradient-to-r from-brand-600/90 to-indigo-600/90 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-sm transition-all"
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>Sign in with Gmail</span>
          </button>
        )}

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 lg:hidden border border-slate-700"
          title="Toggle Navigation"
        >
          {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      {/* Mobile Nav Dropdown */}
      {mobileMenuOpen && (
        <div className="absolute top-16 left-0 right-0 bg-slate-900 border-b border-slate-800 p-3 flex flex-col gap-1 lg:hidden shadow-2xl z-40">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all text-left ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-md'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}
