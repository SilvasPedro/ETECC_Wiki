import React from 'react';
import { 
  BookOpen, 
  PlusCircle, 
  Search, 
  Bookmark, 
  Building2, 
  ShieldAlert, 
  Palette, 
  Code2, 
  Users, 
  CheckSquare, 
  ChevronRight, 
  ListTree,
  Sparkles,
  User as UserIcon,
  X,
  Folder
} from 'lucide-react';
import { Article, ArticleCategory, TableOfContentsItem, UserProfile } from '../types/wiki';
import { DEFAULT_CATEGORIES } from '../data/defaultArticles';
import { User } from 'firebase/auth';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  articles: Article[];
  categories?: ArticleCategory[];
  currentArticle: Article | null;
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string | null) => void;
  onSelectArticle: (article: Article) => void;
  onNewArticle: () => void;
  onOpenSearch: () => void;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  user: User | null;
  userProfile?: UserProfile | null;
  tocItems?: TableOfContentsItem[];
  activeHeadingId?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  articles,
  categories = [],
  currentArticle,
  selectedCategory,
  onSelectCategory,
  onSelectArticle,
  onNewArticle,
  onOpenSearch,
  onOpenAuth,
  onOpenProfile,
  user,
  userProfile,
  tocItems = [],
  activeHeadingId,
}) => {
  // Category icon mapping
  const getCategoryIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Building2': return <Building2 className="w-4 h-4" />;
      case 'ShieldAlert': return <ShieldAlert className="w-4 h-4" />;
      case 'Palette': return <Palette className="w-4 h-4" />;
      case 'Code2': return <Code2 className="w-4 h-4" />;
      case 'Users': return <Users className="w-4 h-4" />;
      case 'CheckSquare': return <CheckSquare className="w-4 h-4" />;
      case 'Folder': return <Folder className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  // Only show categories that are actually launched with articles in the system
  const launchedCategories = React.useMemo(() => {
    const activeCategoryIds = Array.from(new Set(articles.map((a) => a.category).filter(Boolean)));
    
    return activeCategoryIds.map((catId) => {
      const found = (categories || []).find((c) => c.id === catId) || DEFAULT_CATEGORIES.find((c) => c.id === catId);
      if (found) return found;
      const formattedName = catId
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      return {
        id: catId,
        name: formattedName,
        iconName: 'Folder',
        description: 'Categoria cadastrada',
      };
    });
  }, [articles, categories]);

  const pinnedArticles = articles.filter((a) => a.isPinned);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs md:hidden animate-in fade-in"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-screen w-72 md:w-64 lg:w-72 shrink-0 bg-stone-50/90 dark:bg-stone-900/90 backdrop-blur-md border-r border-stone-200 dark:border-stone-800 flex flex-col transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
          <div 
            onClick={() => { onSelectCategory(null); onClose(); }} 
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-[#e4022c] text-white flex items-center justify-center font-black text-base shadow-sm group-hover:scale-105 transition">
              E
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm tracking-tight text-stone-900 dark:text-white">
                  ETECC
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded-sm bg-[#e4022c] text-white">
                  WIKI
                </span>
              </div>
              <p className="text-[10px] text-stone-400 font-medium">Base de Conhecimento</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Actions (New Article & Quick Search) */}
        <div className="p-3 space-y-2 border-b border-stone-200 dark:border-stone-800">
          <button
            onClick={() => { onNewArticle(); onClose(); }}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#e4022c] hover:bg-[#c30024] active:scale-98 text-white font-semibold text-xs transition shadow-sm shadow-red-600/20"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Novo Artigo no Wiki</span>
          </button>

          <button
            onClick={() => { onOpenSearch(); onClose(); }}
            className="w-full flex items-center justify-between py-1.5 px-3 rounded-xl bg-white dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/60 text-stone-500 dark:text-stone-400 text-xs hover:border-[#e4022c] transition"
          >
            <span className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-[#e4022c]" />
              <span>Consulta rápida...</span>
            </span>
            <kbd className="text-[10px] font-semibold bg-stone-100 dark:bg-stone-700 px-1.5 py-0.5 rounded border border-stone-200 dark:border-stone-600">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Scrollable Navigation Area */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
          {/* Main Views */}
          <div className="space-y-1">
            <button
              onClick={() => { onSelectCategory(null); onClose(); }}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition ${
                selectedCategory === null && !currentArticle
                  ? 'bg-red-50 dark:bg-red-950/30 text-[#e4022c]'
                  : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800/60'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <BookOpen className="w-4 h-4 text-[#e4022c]" />
                <span>Todos os Artigos</span>
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                {articles.length}
              </span>
            </button>
          </div>

          {/* Table of Contents if an article is active */}
          {currentArticle && tocItems.length > 0 && (
            <div className="p-2.5 rounded-xl bg-white dark:bg-stone-800/40 border border-stone-200/80 dark:border-stone-800 space-y-1.5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-stone-900 dark:text-white mb-1 px-1">
                <ListTree className="w-3.5 h-3.5 text-[#e4022c]" />
                <span>Nesta Página (TOC)</span>
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                {tocItems.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    onClick={onClose}
                    className={`block text-xs py-1 transition line-clamp-1 ${
                      item.level === 1 ? 'font-semibold pl-1' : item.level === 2 ? 'pl-3' : 'pl-5 text-stone-500'
                    } ${
                      activeHeadingId === item.id
                        ? 'text-[#e4022c] font-bold border-l-2 border-[#e4022c]'
                        : 'text-stone-600 dark:text-stone-400 hover:text-[#e4022c] dark:hover:text-[#ff4d6a]'
                    }`}
                  >
                    {item.text}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Pinned & Priority */}
          {pinnedArticles.length > 0 && (
            <div>
              <div className="px-2 mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-stone-400">
                <Bookmark className="w-3 h-3 text-[#e4022c]" />
                <span>Fixados / Essenciais</span>
              </div>
              <div className="space-y-1">
                {pinnedArticles.map((art) => (
                  <button
                    key={art.id}
                    onClick={() => { onSelectArticle(art); onClose(); }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs transition flex items-center justify-between group ${
                      currentArticle?.id === art.id
                        ? 'bg-red-50 dark:bg-red-950/40 text-[#e4022c] font-semibold'
                        : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                    }`}
                  >
                    <span className="line-clamp-1">{art.title}</span>
                    <span className="text-[#e4022c] text-xs opacity-70 group-hover:opacity-100">★</span>
                  </button>
                ))}
              </div>
            </div>
          )}

            {/* Categories Tree */}
            <div>
              <div className="px-2 mb-1.5 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-stone-400">
                <span>Categorias & Setores</span>
                {launchedCategories.length > 0 && (
                  <span className="text-[10px] text-stone-400 font-normal">
                    {launchedCategories.length} {launchedCategories.length === 1 ? 'ativa' : 'ativas'}
                  </span>
                )}
              </div>
              {launchedCategories.length === 0 ? (
                <div className="px-3 py-3 rounded-xl bg-stone-100/50 dark:bg-stone-800/30 border border-dashed border-stone-200 dark:border-stone-800 text-center">
                  <p className="text-[11px] text-stone-400 leading-tight">Nenhuma categoria com publicações ainda.</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {launchedCategories.map((cat) => {
                    const count = articles.filter((a) => a.category === cat.id).length;
                    const isSelected = selectedCategory === cat.id && !currentArticle;

                    return (
                      <button
                        key={cat.id}
                        onClick={() => { onSelectCategory(cat.id); onClose(); }}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition ${
                          isSelected
                            ? 'bg-red-50 dark:bg-red-950/40 text-[#e4022c] font-bold'
                            : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800/60'
                        }`}
                      >
                        <span className="flex items-center gap-2.5 min-w-0">
                          <span className={isSelected ? 'text-[#e4022c]' : 'text-stone-400'}>
                            {getCategoryIcon(cat.iconName)}
                          </span>
                          <span className="truncate">{cat.name}</span>
                        </span>
                        <span className="text-[10px] text-stone-400 px-1.5 py-0.2 rounded-full bg-stone-200/60 dark:bg-stone-800">
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
        </div>

        {/* User Footer Profile & photoURL Display */}
        <div className="p-3 border-t border-stone-200 dark:border-stone-800 bg-stone-100/50 dark:bg-stone-950/50">
          {user ? (
            <div
              onClick={() => { onOpenProfile(); onClose(); }}
              className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-white dark:hover:bg-stone-800 cursor-pointer transition border border-transparent hover:border-stone-200 dark:hover:border-stone-700"
            >
              <img
                src={user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.displayName || user.email || 'ETECC')}`}
                alt={user.displayName || 'Colaborador'}
                className="w-9 h-9 rounded-full object-cover ring-2 ring-[#e4022c] shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-stone-900 dark:text-white truncate">
                  {user.displayName || 'Colaborador ETECC'}
                </p>
                {(userProfile?.role || userProfile?.department) && (
                  <p className="text-[10px] font-semibold text-[#e4022c] dark:text-[#ff4d6a] truncate">
                    {[userProfile.role, userProfile.department].filter(Boolean).join(' • ')}
                  </p>
                )}
                <p className="text-[10px] text-stone-400 truncate">{user.email}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-stone-400 shrink-0" />
            </div>
          ) : (
            <button
              onClick={() => { onOpenAuth(); onClose(); }}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-[#e4022c]/40 text-[#e4022c] hover:bg-[#e4022c] hover:text-white text-xs font-semibold transition"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Entrar no Wiki</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
