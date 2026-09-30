import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Eye, 
  Calendar, 
  Share2, 
  Printer, 
  Download, 
  Edit3, 
  Trash2,
  Lock,
  Star, 
  ChevronRight, 
  MessageSquare, 
  Send, 
  Check, 
  Sparkles,
  ArrowLeft,
  Tag as TagIcon,
  AlertTriangle
} from 'lucide-react';
import { Article, ArticleComment, UserProfile } from '../types/wiki';
import { DEFAULT_CATEGORIES } from '../data/defaultArticles';
import { renderMarkdownToHtml } from '../utils/markdown';
import { User } from 'firebase/auth';
import { subscribeComments, addArticleComment } from '../firebase/wikiService';

interface ArticleViewProps {
  article: Article;
  onEdit: (article: Article) => void;
  onDelete?: (articleId: string) => Promise<void>;
  onBack: () => void;
  onSelectCategory: (categoryId: string) => void;
  user: User | null;
  userProfile?: UserProfile | null;
  onOpenAuth: () => void;
  onTogglePin?: (article: Article) => void;
}

export const ArticleView: React.FC<ArticleViewProps> = ({
  article,
  onEdit,
  onDelete,
  onBack,
  onSelectCategory,
  user,
  userProfile,
  onOpenAuth,
  onTogglePin,
}) => {
  const [copied, setCopied] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Security check: Only original creator can edit or delete this post
  const isAuthor = Boolean(user && article.author.uid === user.uid);

  const [comments, setComments] = useState<ArticleComment[]>([]);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Subscribe to real comments from Firestore
  useEffect(() => {
    const unsub = subscribeComments(article.id, (loadedComments) => {
      setComments(loadedComments);
    });
    return () => unsub();
  }, [article.id]);

  const [newCommentText, setNewCommentText] = useState('');

  const categoryObj = DEFAULT_CATEGORIES.find((c) => c.id === article.category);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportMarkdown = () => {
    const blob = new Blob([article.content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${article.slug || 'artigo'}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDelete = async () => {
    if (!isAuthor || !onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(article.id);
      onBack();
    } catch (err) {
      console.error(err);
      alert('Erro ao excluir artigo.');
      setIsDeleting(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || isSubmittingComment) return;

    if (!user) {
      onOpenAuth();
      return;
    }

    setIsSubmittingComment(true);
    try {
      await addArticleComment({
        articleId: article.id,
        author: {
          uid: user.uid,
          displayName: user.displayName || user.email?.split('@')[0] || 'Colaborador ETECC',
          email: user.email || 'colaborador@etecc.com.br',
          photoURL: user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.displayName || 'Colaborador')}`,
          role: userProfile?.role || 'Colaborador',
          department: userProfile?.department || 'ETECC',
        },
        content: newCommentText.trim(),
      });
      setNewCommentText('');
    } catch (err) {
      console.error('Erro ao salvar comentário:', err);
      alert('Não foi possível registrar seu comentário. Verifique sua conexão e tente novamente.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <article className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6">
      {/* Back button & Breadcrumbs */}
      <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 font-semibold transition"
        >
          <ArrowLeft className="w-4 h-4 text-[#e4022c]" />
          <span>Voltar aos Artigos</span>
        </button>

        <div className="hidden sm:flex items-center gap-1.5 text-stone-400">
          <span>Início</span>
          <ChevronRight className="w-3 h-3" />
          <button
            onClick={() => onSelectCategory(article.category)}
            className="hover:text-[#e4022c] transition"
          >
            {categoryObj?.name || article.category}
          </button>
          <ChevronRight className="w-3 h-3" />
          <span className="text-stone-700 dark:text-stone-200 font-medium truncate max-w-[200px]">
            {article.title}
          </span>
        </div>
      </div>

      {/* Header Container */}
      <header className="space-y-4 pb-6 border-b border-stone-200 dark:border-stone-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => onSelectCategory(article.category)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold text-[#e4022c] bg-red-100 dark:bg-red-950/60 uppercase tracking-wider hover:bg-red-200/80 transition"
          >
            {categoryObj?.name || article.category}
          </button>

          <div className="flex items-center gap-1">
            {onTogglePin && (
              <button
                onClick={() => onTogglePin(article)}
                title={article.isPinned ? 'Desafixar artigo' : 'Fixar artigo no topo'}
                className={`p-2 rounded-xl border transition ${
                  article.isPinned
                    ? 'border-[#e4022c] text-[#e4022c] bg-red-50 dark:bg-red-950/40'
                    : 'border-stone-200 dark:border-stone-700 text-stone-500 hover:text-[#e4022c]'
                }`}
              >
                <Star className={`w-4 h-4 ${article.isPinned ? 'fill-[#e4022c]' : ''}`} />
              </button>
            )}

            <button
              onClick={handleCopyLink}
              title="Copiar link do artigo"
              className="p-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
            </button>

            <button
              onClick={handleExportMarkdown}
              title="Baixar arquivo Markdown (.md)"
              className="p-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={handlePrint}
              title="Imprimir ou Salvar em PDF"
              className="p-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition hidden sm:inline-flex"
            >
              <Printer className="w-4 h-4" />
            </button>

            {/* Author-only Edit & Delete Actions */}
            {isAuthor ? (
              <>
                <button
                  onClick={() => onEdit(article)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#e4022c] hover:bg-[#c30024] text-white text-xs font-bold transition shadow-sm shadow-red-500/20 active:scale-95 ml-1"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Editar</span>
                </button>

                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-bold transition active:scale-95 ml-1"
                  title="Excluir este artigo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir</span>
                </button>
              </>
            ) : (
              <span className="text-[11px] text-stone-400 px-2 py-1 bg-stone-100 dark:bg-stone-800 rounded-lg ml-1">
                Visualização
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-stone-900 dark:text-white tracking-tight leading-tight">
          {article.title}
        </h1>

        {/* Summary Lead */}
        {article.summary && (
          <p className="text-base sm:text-lg text-stone-600 dark:text-stone-300 leading-relaxed font-normal">
            {article.summary}
          </p>
        )}

        {/* Author info (photoURL, Cargo, Setor) and metadata */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 text-xs text-stone-500 dark:text-stone-400">
          <div className="flex items-center gap-3">
            <img
              src={
                article.author.photoURL ||
                `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(article.author.displayName || 'ETECC')}`
              }
              alt={article.author.displayName}
              className="w-11 h-11 rounded-full object-cover ring-2 ring-[#e4022c] shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(article.author.displayName || 'ETECC')}`;
              }}
            />
            <div>
              <p className="font-bold text-stone-900 dark:text-white text-sm">
                {article.author.displayName}
              </p>
              {/* Cargo e Setor Atual */}
              {(article.author.role || article.author.department) && (
                <p className="text-xs font-bold text-[#e4022c] dark:text-[#ff4d6a]">
                  {[article.author.role, article.author.department].filter(Boolean).join(' • ')}
                </p>
              )}
              <p className="text-[11px] text-stone-400">{article.author.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-stone-400" />
              <span>Atualizado em {formatDate(article.updatedAt)}</span>
            </div>

            {article.readingTimeMinutes && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-stone-400" />
                <span>{article.readingTimeMinutes} min de leitura</span>
              </div>
            )}

            {article.views !== undefined && (
              <div className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-stone-400" />
                <span>{article.views} visualizações</span>
              </div>
            )}
          </div>
        </div>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="flex items-center gap-1.5 pt-2 flex-wrap">
            <TagIcon className="w-3.5 h-3.5 text-stone-400 mr-1" />
            {article.tags.map((tag, idx) => (
              <span
                key={idx}
                className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* Cover Image if available */}
      {article.coverImage && (
        <div className="rounded-2xl overflow-hidden shadow-md max-h-96 w-full border border-stone-200 dark:border-stone-800">
          <img
            src={article.coverImage}
            alt={article.title}
            className="w-full h-full object-cover max-h-96"
          />
        </div>
      )}

      {/* Main Prose Content */}
      <section className="py-4">
        <div
          className="wiki-prose max-w-none"
          dangerouslySetInnerHTML={{
            __html: renderMarkdownToHtml(article.content),
          }}
        />
      </section>

      {/* Corporate Callout Footer */}
      <div className="p-4 rounded-2xl bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2 text-stone-600 dark:text-stone-300">
          <Sparkles className="w-4 h-4 text-[#e4022c]" />
          <span>Este documento faz parte das normas e procedimentos oficiais da ETECC.</span>
        </div>
        {isAuthor ? (
          <button
            onClick={() => onEdit(article)}
            className="text-[#e4022c] font-bold hover:underline shrink-0"
          >
            Editar Esta Publicação
          </button>
        ) : (
          <span className="text-stone-400 text-[11px]">Autoria protegida</span>
        )}
      </div>

      {/* Discussion / Comments Section - STRICTLY FOR LOGGED IN USERS */}
      <section className="pt-8 border-t border-stone-200 dark:border-stone-800 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#e4022c]" />
            <h3 className="text-base font-bold text-stone-900 dark:text-white">
              Comentários e Dúvidas ({user ? comments.length : 'Restrito'})
            </h3>
          </div>
        </div>

        {!user ? (
          /* Locked banner for non-logged users */
          <div className="p-8 rounded-2xl bg-stone-100/70 dark:bg-stone-900/70 border border-stone-200 dark:border-stone-800 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/50 text-[#e4022c] flex items-center justify-center mx-auto shadow-xs">
              <Lock className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-stone-900 dark:text-white">
              Aba de Comentários Restrita
            </h4>
            <p className="text-xs text-stone-500 dark:text-stone-400 max-w-md mx-auto leading-relaxed">
              As discussões, notas técnicas e esclarecimentos de dúvidas internas são visíveis apenas para colaboradores logados da ETECC.
            </p>
            <div className="pt-2">
              <button
                onClick={onOpenAuth}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#e4022c] hover:bg-[#c30024] text-white text-xs font-bold transition shadow-sm shadow-red-500/20 active:scale-98"
              >
                <span>Entrar com E-mail ou Google para Ver Comentários</span>
              </button>
            </div>
          </div>
        ) : (
          /* Full comments for logged in users */
          <>
            {/* Add comment input */}
            <form onSubmit={handleAddComment} className="space-y-3">
              <div className="flex items-start gap-3">
                <img
                  src={
                    user?.photoURL ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.displayName || 'Colaborador')}`
                  }
                  alt="Seu Avatar"
                  className="w-9 h-9 rounded-full object-cover ring-2 ring-[#e4022c] shrink-0 mt-1"
                />
                <div className="flex-1">
                  <textarea
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    placeholder="Adicione uma observação técnica, dúvida ou parecer corporativo..."
                    rows={2}
                    className="w-full p-3 text-xs rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#e4022c]"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-stone-400">
                  Comentando como <strong>{user.displayName || user.email}</strong>
                  {userProfile?.role && ` (${userProfile.role} • ${userProfile.department})`}
                </span>
                <button
                  type="submit"
                  disabled={!newCommentText.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#e4022c] hover:bg-[#c30024] text-white text-xs font-semibold transition disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Publicar Comentário</span>
                </button>
              </div>
            </form>

            {/* Comments List */}
            {comments.length === 0 ? (
              <div className="py-8 px-4 text-center rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-dashed border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 text-xs space-y-1">
                <p className="font-semibold text-stone-700 dark:text-stone-300">Nenhum comentário registrado ainda no banco de dados.</p>
                <p className="text-[11px]">Seja o primeiro colaborador a comentar ou compartilhar sugestões sobre este artigo!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {comments.map((comm) => (
                  <div
                    key={comm.id}
                    className="p-4 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex items-start gap-3 shadow-2xs"
                  >
                    <img
                      src={
                        comm.author.photoURL ||
                        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(comm.author.displayName)}`
                      }
                      alt={comm.author.displayName}
                      className="w-8 h-8 rounded-full object-cover ring-1 ring-[#e4022c] shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div>
                          <span className="text-xs font-bold text-stone-900 dark:text-white">
                            {comm.author.displayName}
                          </span>
                          {(comm.author.role || comm.author.department) && (
                            <span className="block text-[10px] font-semibold text-[#e4022c] dark:text-[#ff4d6a]">
                              {[comm.author.role, comm.author.department].filter(Boolean).join(' • ')}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-stone-400">
                          {formatDate(comm.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed mt-1">
                        {comm.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/60 text-[#e4022c] flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-stone-900 dark:text-white">Excluir Artigo Definitivamente?</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                Esta ação removerá o artigo "{article.title}" do banco de dados e não poderá ser desfeita.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2 text-xs font-semibold rounded-xl text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 py-2 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-sm"
              >
                {isDeleting ? 'Excluindo...' : 'Sim, Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
};

