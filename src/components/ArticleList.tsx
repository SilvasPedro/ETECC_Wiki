import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  Clock, 
  Eye, 
  Star, 
  Search, 
  Plus, 
  Sparkles, 
  ArrowRight, 
  Building2, 
  ShieldAlert, 
  Palette, 
  Code2, 
  Users, 
  CheckSquare,
  Bookmark,
  Calendar,
  Folder
} from 'lucide-react';
import { Article, ArticleCategory } from '../types/wiki';
import { DEFAULT_CATEGORIES } from '../data/defaultArticles';

interface ArticleListProps {
  articles: Article[];
  categories?: ArticleCategory[];
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string | null) => void;
  onSelectArticle: (article: Article) => void;
  onNewArticle: () => void;
  onOpenSearch: () => void;
}

export const ArticleList: React.FC<ArticleListProps> = ({
  articles,
  categories = [],
  selectedCategory,
  onSelectCategory,
  onSelectArticle,
  onNewArticle,
  onOpenSearch,
}) => {
  const [filterTab, setFilterTab] = useState<'all' | 'pinned' | 'popular' | 'recent'>('all');
  const [searchFilter, setSearchFilter] = useState('');

  const categoryMap = useMemo(() => {
    const map = new Map<string, ArticleCategory>();
    const list = categories.length > 0 ? categories : DEFAULT_CATEGORIES;
    list.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

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

  const filteredArticles = useMemo(() => {
    let result = articles;

    // Category filter
    if (selectedCategory) {
      result = result.filter((a) => a.category === selectedCategory);
    }

    // Search query filter
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.summary.toLowerCase().includes(q) ||
          a.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Tab filter
    if (filterTab === 'pinned') {
      result = result.filter((a) => a.isPinned);
    } else if (filterTab === 'popular') {
      result = [...result].sort((a, b) => (b.views || 0) - (a.views || 0));
    } else if (filterTab === 'recent') {
      result = [...result].sort((a, b) => b.updatedAt - a.updatedAt);
    }

    return result;
  }, [articles, selectedCategory, searchFilter, filterTab]);

  const activeCategoryObj = selectedCategory ? categoryMap.get(selectedCategory) : null;

  return (
    <div className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6">
      {/* Corporate Hero Banner */}
      {!selectedCategory && (
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-stone-900 via-stone-950 to-stone-900 border border-stone-800 p-6 sm:p-8 text-white shadow-xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#e4022c]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e4022c]/20 border border-[#e4022c]/40 text-[#ff4d6a] text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-[#e4022c] animate-pulse" />
              <span>Base de Conhecimento Oficial ETECC</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              Wiki Corporativo & Hub de Procedimentos
            </h1>

            <p className="text-sm text-stone-300 leading-relaxed">
              Consulte diretrizes, manuais técnicos, políticas de RH e padrões operacionais.
              Adicione fotos e artigos através do editor Markdown integrado com sincronização Firebase.
            </p>

            {/* Quick action buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={onOpenSearch}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-stone-900 text-xs font-bold hover:bg-stone-100 transition shadow-sm"
              >
                <Search className="w-4 h-4 text-[#e4022c]" />
                <span>Consulta Rápida (Ctrl+K)</span>
              </button>

              <button
                onClick={onNewArticle}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#e4022c] hover:bg-[#c30024] text-white text-xs font-bold transition shadow-sm shadow-red-600/30"
              >
                <Plus className="w-4 h-4" />
                <span>Criar Novo Artigo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category header if filtered by category */}
      {selectedCategory && activeCategoryObj && (
        <div className="flex items-center justify-between p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/60 text-[#e4022c] flex items-center justify-center font-bold">
              {getCategoryIcon(activeCategoryObj.iconName)}
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900 dark:text-white">
                {activeCategoryObj.name}
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {activeCategoryObj.description}
              </p>
            </div>
          </div>

          <button
            onClick={() => onSelectCategory(null)}
            className="text-xs text-[#e4022c] font-semibold hover:underline"
          >
            Ver Todas as Categorias
          </button>
        </div>
      )}

      {/* Filter Tabs & Quick Inline Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 bg-stone-100 dark:bg-stone-900 rounded-xl overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
              filterTab === 'all'
                ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-xs'
                : 'text-stone-500 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            Todos ({articles.length})
          </button>

          <button
            onClick={() => setFilterTab('pinned')}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap flex items-center gap-1 ${
              filterTab === 'pinned'
                ? 'bg-white dark:bg-stone-800 text-[#e4022c] shadow-xs'
                : 'text-stone-500 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <Star className="w-3.5 h-3.5 fill-[#e4022c] text-[#e4022c]" />
            <span>Fixados</span>
          </button>

          <button
            onClick={() => setFilterTab('popular')}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
              filterTab === 'popular'
                ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-xs'
                : 'text-stone-500 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            Mais Acessados
          </button>

          <button
            onClick={() => setFilterTab('recent')}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
              filterTab === 'recent'
                ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-xs'
                : 'text-stone-500 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            Atualizados Recentemente
          </button>
        </div>

        {/* Local Filter Input */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-stone-400" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Filtrar nesta lista..."
            className="w-full sm:w-56 pl-8 pr-3 py-1.5 text-xs rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#e4022c]"
          />
        </div>
      </div>

      {/* Articles Grid */}
      {articles.length === 0 ? (
        <div className="py-20 px-4 text-center rounded-3xl bg-white dark:bg-stone-900 border border-dashed border-stone-200 dark:border-stone-800 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-950/60 text-[#e4022c] flex items-center justify-center mx-auto shadow-inner">
            <BookOpen className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-lg font-bold text-stone-900 dark:text-white">
              Nenhum artigo publicado no banco de dados
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
              Todos os dados mockados foram removidos. O Wiki está conectado diretamente ao Firebase Firestore em tempo real. Crie a primeira documentação oficial da empresa!
            </p>
          </div>
          <button
            onClick={onNewArticle}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#e4022c] hover:bg-[#c30024] active:scale-98 text-white text-xs font-bold shadow-md shadow-red-600/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Publicar Primeiro Artigo</span>
          </button>
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-white dark:bg-stone-900 border border-dashed border-stone-200 dark:border-stone-800">
          <BookOpen className="w-12 h-12 mx-auto text-stone-300 dark:text-stone-700 mb-3" />
          <h3 className="text-base font-bold text-stone-900 dark:text-white">
            Nenhum artigo encontrado
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto mt-1 mb-4">
            Não há publicações correspondentes aos filtros selecionados.
          </p>
          <button
            onClick={onNewArticle}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#e4022c] text-white text-xs font-bold shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Criar Artigo</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredArticles.map((article) => {
            const cat = categoryMap.get(article.category);

            return (
              <div
                key={article.id}
                onClick={() => onSelectArticle(article)}
                className="group flex flex-col justify-between rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 hover:border-[#e4022c]/50 dark:hover:border-[#e4022c]/50 shadow-2xs hover:shadow-md transition duration-200 cursor-pointer overflow-hidden"
              >
                {/* Optional Top Thumbnail or Category Accent Bar */}
                {article.coverImage ? (
                  <div className="h-36 w-full overflow-hidden relative">
                    <img
                      src={article.coverImage}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <span className="absolute bottom-2 left-3 text-[10px] font-bold text-white uppercase tracking-wider bg-[#e4022c] px-2 py-0.5 rounded-md">
                      {cat?.name || article.category}
                    </span>
                    {article.isPinned && (
                      <span className="absolute top-2 right-2 text-xs text-amber-400 bg-stone-900/80 px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold">
                        ★ Fixado
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="h-2 w-full bg-gradient-to-r from-[#e4022c] to-[#b30020]" />
                )}

                {/* Card Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    {!article.coverImage && (
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-[#e4022c] uppercase tracking-wider bg-red-50 dark:bg-red-950/60 px-2 py-0.5 rounded-md">
                          {cat?.name || article.category}
                        </span>
                        {article.isPinned && (
                          <span className="text-amber-500 text-xs font-bold flex items-center gap-1">
                            ★ Fixado
                          </span>
                        )}
                      </div>
                    )}

                    <h3 className="text-base font-bold text-stone-900 dark:text-white group-hover:text-[#e4022c] transition leading-snug line-clamp-2">
                      {article.title}
                    </h3>

                    <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-3 leading-relaxed">
                      {article.summary}
                    </p>
                  </div>

                  {/* Tags */}
                  {article.tags && article.tags.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap pt-1">
                      {article.tags.slice(0, 3).map((tag, tIdx) => (
                        <span
                          key={tIdx}
                          className="text-[10px] font-medium text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Author Profile with photoURL, role, department & Read stats */}
                  <div className="pt-3 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={
                          article.author.photoURL ||
                          `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(article.author.displayName)}`
                        }
                        alt={article.author.displayName}
                        className="w-7 h-7 rounded-full object-cover ring-1 ring-[#e4022c] shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="block truncate font-bold text-stone-700 dark:text-stone-300 text-[11px]">
                          {article.author.displayName}
                        </span>
                        {(article.author.role || article.author.department) && (
                          <span className="block truncate text-[10px] font-semibold text-[#e4022c] dark:text-[#ff4d6a]">
                            {[article.author.role, article.author.department].filter(Boolean).join(' • ')}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 text-[11px]">
                      {article.readingTimeMinutes && (
                        <span className="flex items-center gap-0.5">
                          <Clock className="w-3 h-3" /> {article.readingTimeMinutes}m
                        </span>
                      )}
                      {article.views !== undefined && (
                        <span className="flex items-center gap-0.5">
                          <Eye className="w-3 h-3" /> {article.views}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
