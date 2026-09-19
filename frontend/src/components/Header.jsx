import { Menu, X, Sparkles, LogOut, MessageSquare, Target } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function Header({ onToggleSidebar, sidebarOpen, user, onLogout }) {
  const location = useLocation();

  return (
    <header className="glass flex fixed items-center justify-between px-5 py-3 z-30 border-b border-white/[0.06] shrink-0 w-full bg-zinc-950/80 backdrop-blur-md">
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
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 via-teal-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-semibold text-sm text-emerald-400">DocMind AI</span>
            <span className="text-[10px] text-zinc-400">Multi-Agent Assistant</span>
          </div>
        </Link>
      </div>

      {/* Navigation Modes */}
      <div className="flex items-center gap-1.5 bg-zinc-900/80 p-1 rounded-xl border border-white/10">
        <Link
          to="/"
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            location.pathname === '/'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Chat Mode</span>
        </Link>
        <Link
          to="/Mock"
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            location.pathname === '/Mock'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
          }`}
        >
          <Target className="w-3.5 h-3.5" />
          <span>Mock Mode</span>
        </Link>
      </div>

      {/* Right – user badge + logout */}
      <div className="flex items-center gap-3">
        {user && (
          <div className="flex items-center gap-2 text-xs text-zinc-300 bg-zinc-900 border border-emerald-500/20 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium text-emerald-300">{user.username}</span>
          </div>
        )}

        {onLogout && (
          <button
            onClick={onLogout}
            title="Sign Out"
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-red-400 hover:bg-red-500/10 px-3 py-1.5 rounded-xl border border-zinc-800 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        )}
      </div>
    </header>
  );
}
