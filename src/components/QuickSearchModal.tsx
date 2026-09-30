import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, Hash, BookOpen, Clock, ArrowRight, CornerDownLeft, Filter } from 'lucide-react';
import { Article, ArticleCategory } from '../types/wiki';
import { DEFAULT_CATEGORIES } from '../data/defaultArticles';

interface QuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  articles: Article[];
  onSelectArticle: (article: Article) => void;
}

export const QuickSearchModal: React.FC<QuickSearchModalProps> = ({
  isOpen,
  onClose,
  articles,
  onSelectArticle,
}) => {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut listener (Cmd+K / Ctrl+K and ESC)
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Filter articles based on query and category
  const filteredArticles = useMemo(() => {
    const q = query.trim().toLowerCase();

    return articles.filter((article) => {
      // Category filter
      if (selectedCategory !== 'all' && article.category !== selectedCategory) {
        return false;
      }

      if (!q) return true;

      const titleMatch = article.title.toLowerCase().includes(q);
      const summaryMatch = article.summary.toLowerCase().includes(q);
      const contentMatch = article.content.toLowerCase().includes(q);
      const tagMatch = article.tags.some((t) => t.toLowerCase().includes(q));
      const authorMatch = article.author.displayName.toLowerCase().includes(q);

      return titleMatch || summaryMatch || contentMatch || tagMatch || authorMatch;
    });
  }, [articles, query, selectedCategory]);

  // Handle keyboard navigation inside results
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredArticles.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredArticles.length - 1));
    } else if (e.key === 'Enter' && filteredArticles.length > 0) {
      e.preventDefault();
      const target = filteredArticles[selectedIndex];
      if (target) {
        onSelectArticle(target);
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 pb-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div
        className="w-full max-w-2xl rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-stone-200 dark:border-stone-800 gap-3 bg-stone-50/50 dark:bg-stone-900/50">
          <Search className="w-5 h-5 text-[#e4022c] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Pesquisar em todo o Wiki ETECC (artigos, POPs, códigos, tags)..."
            className="w-full bg-transparent text-sm text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-semibold text-stone-400 bg-stone-100 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-md">
            ESC
          </kbd>
        </div>

        {/* Category Pills Filter */}
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-stone-100 dark:border-stone-800/80 overflow-x-auto text-xs bg-stone-50/30 dark:bg-stone-950/20">
          <span className="text-stone-400 flex items-center gap-1 mr-1 shrink-0">
            <Filter className="w-3 h-3" /> Filtro:
          </span>
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition ${
              selectedCategory === 'all'
                ? 'bg-[#e4022c] text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            Todos ({articles.length})
          </button>
          {DEFAULT_CATEGORIES.map((cat) => {
            const count = articles.filter((a) => a.category === cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition ${
                  selectedCategory === cat.id
                    ? 'bg-[#e4022c] text-white shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
                }`}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 divide-y divide-stone-100 dark:divide-stone-800/40">
          {filteredArticles.length === 0 ? (
            <div className="py-12 text-center text-stone-500 dark:text-stone-400">
              <BookOpen className="w-10 h-10 mx-auto text-stone-300 dark:text-stone-700 mb-2 stroke-1" />
              <p className="text-sm font-medium">Nenhum resultado encontrado para "{query}"</p>
              <p className="text-xs text-stone-400 mt-1">Tente pesquisar por palavras-chave como cultura, segurança, pop, ti ou regras.</p>
            </div>
          ) : (
            filteredArticles.map((article, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={article.id}
                  onClick={() => {
                    onSelectArticle(article);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`p-3.5 rounded-xl cursor-pointer transition flex items-start gap-3.5 ${
                    isSelected
                      ? 'bg-red-50 dark:bg-red-950/20 border-l-4 border-[#e4022c]'
                      : 'hover:bg-stone-50 dark:hover:bg-stone-800/50'
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-700 dark:text-stone-300 shrink-0 mt-0.5">
                    {article.isPinned ? (
                      <span className="text-[#e4022c] font-bold">★</span>
                    ) : (
                      <BookOpen className="w-4 h-4 text-[#e4022c]" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[11px] font-semibold text-[#e4022c] uppercase tracking-wider bg-red-100 dark:bg-red-950/60 px-2 py-0.5 rounded-md">
                        {DEFAULT_CATEGORIES.find((c) => c.id === article.category)?.name || article.category}
                      </span>
                      {article.readingTimeMinutes && (
                        <span className="flex items-center gap-1 text-[11px] text-stone-400">
                          <Clock className="w-3 h-3" /> {article.readingTimeMinutes} min
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-stone-900 dark:text-white line-clamp-1">
                      {article.title}
                    </h4>

                    <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2 mt-0.5">
                      {article.summary}
                    </p>

                    {article.tags && article.tags.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        {article.tags.slice(0, 4).map((tag, tIdx) => (
                          <span
                            key={tIdx}
                            className="inline-flex items-center gap-0.5 text-[10px] text-stone-600 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded"
                          >
                            <Hash className="w-2.5 h-2.5 text-stone-400" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="self-center hidden sm:flex items-center text-stone-400">
                    {isSelected ? (
                      <CornerDownLeft className="w-4 h-4 text-[#e4022c]" />
                    ) : (
                      <ArrowRight className="w-4 h-4 opacity-30" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="px-4 py-2.5 bg-stone-50 dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1.5 py-0.5 bg-stone-200 dark:bg-stone-800 rounded font-semibold text-[10px]">↑</kbd>{' '}
              <kbd className="px-1.5 py-0.5 bg-stone-200 dark:bg-stone-800 rounded font-semibold text-[10px]">↓</kbd> navegar
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-stone-200 dark:bg-stone-800 rounded font-semibold text-[10px]">Enter</kbd> abrir
            </span>
          </div>
          <span className="text-[#e4022c] font-semibold">ETECC Knowledge Search</span>
        </div>
      </div>
    </div>
  );
};
