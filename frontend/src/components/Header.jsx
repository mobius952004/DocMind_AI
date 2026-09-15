import { Menu, X, Sparkles, User, LogOut } from 'lucide-react';

export default function Header({ onToggleSidebar, sidebarOpen, user, onLogout }) {
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
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 via-teal-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
          <Sparkles className="w-4 h-4 text-white" />
        </div>

        <div className="flex flex-col leading-tight">
          <span className="font-semibold text-sm text-emerald-400">DocMind AI</span>
          <span className="text-[10px] text-zinc-400">Multi-Agent Interview Assistant</span>
        </div>
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
