import React from 'react';
import { Menu, Search, Sun, Moon, Plus, Sparkles } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { User } from 'firebase/auth';

interface NavbarProps {
  onToggleSidebar: () => void;
  onOpenSearch: () => void;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  onNewArticle: () => void;
  theme: 'light' | 'dark' | 'system';
  resolvedTheme: 'light' | 'dark';
  onToggleTheme: () => void;
  user: User | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  onOpenSearch,
  onOpenAuth,
  onOpenProfile,
  onNewArticle,
  resolvedTheme,
  onToggleTheme,
  user,
}) => {
  return (
    <header className="sticky top-0 z-30 h-16 w-full bg-white/85 dark:bg-stone-900/85 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 px-4 flex items-center justify-between transition-colors">
      {/* Left: Mobile hamburger & Logo (on mobile) */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
          aria-label="Menu Lateral"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 md:hidden">
          <div className="w-7 h-7 rounded-lg bg-[#e4022c] text-white flex items-center justify-center font-black text-sm">
            E
          </div>
          <span className="font-extrabold text-stone-900 dark:text-white text-sm tracking-tight">
            ETECC WIKI
          </span>
        </div>
      </div>

      {/* Center: Search trigger (Desktop) */}
      <div className="hidden sm:flex flex-1 max-w-md mx-4">
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-3.5 py-2 text-xs text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800/80 hover:bg-stone-200/70 dark:hover:bg-stone-800 rounded-xl border border-stone-200/80 dark:border-stone-700/60 transition group"
        >
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-[#e4022c] group-hover:scale-110 transition" />
            <span>Pesquisar artigos, tags, POPs ou diretrizes...</span>
          </div>
          <kbd className="text-[10px] font-semibold bg-white dark:bg-stone-700 px-1.5 py-0.5 rounded shadow-2xs border border-stone-300 dark:border-stone-600">
            Ctrl + K
          </kbd>
        </button>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2">
        {/* Mobile Search Button */}
        <button
          onClick={onOpenSearch}
          className="sm:hidden p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
          aria-label="Buscar"
        >
          <Search className="w-5 h-5 text-[#e4022c]" />
        </button>

        {/* PWA Install Button */}
        <PWAInstallButton compact={true} />

        {/* Theme Toggle Button */}
        <button
          onClick={onToggleTheme}
          title={resolvedTheme === 'dark' ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
          className="p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
        >
          {resolvedTheme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition duration-300" />
          ) : (
            <Moon className="w-4 h-4 text-stone-600 hover:-rotate-12 transition duration-300" />
          )}
        </button>

        {/* New Article Button */}
        <button
          onClick={onNewArticle}
          className="hidden lg:flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-[#e4022c] hover:bg-[#c30024] active:scale-95 text-white font-semibold text-xs transition shadow-sm shadow-red-600/20"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Criar Artigo</span>
        </button>

        {/* User Account / Profile with photoURL */}
        {user ? (
          <button
            onClick={onOpenProfile}
            title={`Perfil de ${user.displayName || user.email}`}
            className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-[#e4022c]/50 transition"
          >
            <img
              src={user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.displayName || user.email || 'ETECC')}`}
              alt="Avatar"
              className="w-8 h-8 rounded-full object-cover ring-2 ring-[#e4022c]"
            />
          </button>
        ) : (
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-1 py-1.5 px-3 rounded-xl border border-stone-300 dark:border-stone-700 hover:border-[#e4022c] text-xs font-semibold text-stone-800 dark:text-stone-200 transition"
          >
            <span>Entrar</span>
          </button>
        )}
      </div>
    </header>
  );
};
