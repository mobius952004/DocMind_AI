import { Menu, X, Sparkles, User } from 'lucide-react';

/**
 * Header component with logo, title, and sidebar toggle button.
 * Props:
 *   onToggleSidebar – called when the menu icon is clicked
 *   sidebarOpen     – boolean, whether sidebar is currently open
 */
export default function Header({ onToggleSidebar, sidebarOpen }) {
  return (
    <header className="glass flex items-center justify-between px-5 py-3 z-30 border-b border-white/[0.06] shrink-0">
      {/* Left – sidebar toggle + brand */}
      <div className="flex items-center gap-3">
        <button
          id="sidebar-toggle-btn"
          onClick={onToggleSidebar}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors duration-200 cursor-pointer text-slate-300 hover:text-white"
          aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        >
          {sidebarOpen ? (
            <X className="w-5 h-5 transition-transform duration-300" />
          ) : (
            <Menu className="w-5 h-5 transition-transform duration-300" />
          )}
        </button>

        {/* Logo mark */}
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <Sparkles className="w-4 h-4 text-white" />
        </div>

        <div className="flex flex-col leading-tight">
          <span className="font-semibold text-sm gradient-text">DocMind AI</span>
          <span className="text-[10px] text-slate-500">RAG-powered document assistant</span>
        </div>
      </div>

      {/* Right – status pill */}
      <div className="flex items-center gap-2">
        <span className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          Ready
        </span>
        <button
          className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/30 cursor-pointer"
          aria-label="User profile"
        >
          <User className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
