import React, { useState, useEffect, useRef } from 'react';
import { 
  Bold, 
  Italic, 
  Strikethrough, 
  Heading1, 
  Heading2, 
  Heading3, 
  List, 
  ListOrdered, 
  CheckSquare, 
  Code, 
  FileCode, 
  Quote, 
  Link as LinkIcon, 
  Image as ImageIcon, 
  Table as TableIcon, 
  AlertCircle, 
  Lightbulb, 
  Eye, 
  Columns, 
  Edit3, 
  Save, 
  X, 
  Clock,
  Tag,
  Folder,
  PlusCircle,
  Maximize2
} from 'lucide-react';
import { Article, ArticleCategory, UserProfile } from '../types/wiki';
import { DEFAULT_CATEGORIES } from '../data/defaultArticles';
import { renderMarkdownToHtml, calculateReadingTime, slugify } from '../utils/markdown';
import { User } from 'firebase/auth';

interface MarkdownEditorProps {
  initialArticle?: Article | null;
  categories?: ArticleCategory[];
  onSaveCategory?: (category: ArticleCategory) => Promise<void>;
  onSave: (article: Article) => Promise<void>;
  onCancel: () => void;
  user: User | null;
  userProfile?: UserProfile | null;
  onOpenAuth: () => void;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  initialArticle,
  categories = [],
  onSaveCategory,
  onSave,
  onCancel,
  user,
  userProfile,
  onOpenAuth,
}) => {
  const [title, setTitle] = useState(initialArticle?.title || '');
  const [category, setCategory] = useState(initialArticle?.category || 'geral');
  const [summary, setSummary] = useState(initialArticle?.summary || '');
  const [tagsInput, setTagsInput] = useState(initialArticle?.tags?.join(', ') || '');
  const [coverImage, setCoverImage] = useState(initialArticle?.coverImage || '');
  const [isPinned, setIsPinned] = useState(initialArticle?.isPinned || false);

  // Dynamic category creation state
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');

  // Available categories list
  const activeCategoriesList = categories.length > 0 ? categories : DEFAULT_CATEGORIES;

  const defaultContent = `# Título da Documentação

Escreva aqui uma introdução clara sobre este processo ou diretriz corporativa da **ETECC**.

---

## 1. Visão Geral

Explique o propósito deste procedimento e quais times são impactados.

- Item 1: Planejamento inicial
- Item 2: Execução e validação técnica
- Item 3: Registro no sistema

> 💡 **Dica:** Utilize blocos de destaque para orientações críticas.

## 2. Passo a Passo

1. Primeiro passo com instruções claras.
2. Segundo passo com detalhes da operação.
`;

  const [content, setContent] = useState(initialArticle?.content || defaultContent);
  const [viewMode, setViewMode] = useState<'split' | 'edit' | 'preview'>('split');
  const [isSaving, setIsSaving] = useState(false);
  
  // Image Insertion & Resizing Modal State
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [imageWidthPreset, setImageWidthPreset] = useState<'small' | 'medium' | 'large' | 'full' | 'custom'>('medium');
  const [customImageWidth, setCustomImageWidth] = useState('450px');

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Autosave to draft
  useEffect(() => {
    if (!initialArticle) {
      const savedDraft = localStorage.getItem('etecc_wiki_editor_draft');
      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft);
          if (draft.content && !title) {
            setTitle(draft.title || '');
            setContent(draft.content || defaultContent);
            setCategory(draft.category || 'geral');
            setSummary(draft.summary || '');
          }
        } catch {
          // ignore
        }
      }
    }
  }, [initialArticle]);

  useEffect(() => {
    if (!initialArticle && title) {
      localStorage.setItem('etecc_wiki_editor_draft', JSON.stringify({
        title,
        content,
        category,
        summary,
        tagsInput,
      }));
    }
  }, [title, content, category, summary, tagsInput, initialArticle]);

  const insertText = (before: string, after: string = '', defaultSnippet: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textarea.value.substring(start, end) || defaultSnippet;

    const newContent =
      textarea.value.substring(0, start) +
      before +
      selected +
      after +
      textarea.value.substring(end);

    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selected.length
      );
    }, 10);
  };

  const computedImageWidth = 
    imageWidthPreset === 'small' ? '280px' :
    imageWidthPreset === 'medium' ? '520px' :
    imageWidthPreset === 'large' ? '800px' :
    imageWidthPreset === 'full' ? '100%' :
    customImageWidth.trim() || '500px';

  const handleInsertImage = () => {
    if (!imageUrl.trim()) return;
    const alt = imageAlt.trim() || 'Imagem do artigo';
    
    // Insert with format: ![Alt|Tamanho](url)
    insertText(`\n![${alt}|${computedImageWidth}](${imageUrl.trim()})\n`, '', '');
    setImageUrl('');
    setImageAlt('');
    setShowImageModal(false);
  };

  const handleInsertUserPhotoUrl = () => {
    if (user?.photoURL) {
      setImageUrl(user.photoURL);
      setImageAlt(`Foto de ${user.displayName || 'Colaborador'}`);
    }
  };

  const handleSaveArticle = async () => {
    if (!title.trim()) {
      alert('Por favor, informe o título do artigo.');
      return;
    }

    if (!user) {
      onOpenAuth();
      return;
    }

    // Security check: Only original author can update an existing article
    if (initialArticle && initialArticle.author.uid && initialArticle.author.uid !== user.uid) {
      alert('Ação bloqueada: Apenas o autor original que criou este artigo pode editá-lo.');
      return;
    }

    setIsSaving(true);
    try {
      let finalCategory = category;

      // Handle new dynamic category creation
      if (isCreatingCategory && newCategoryName.trim()) {
        const generatedId = slugify(newCategoryName);
        const newCategoryObj: ArticleCategory = {
          id: generatedId,
          name: newCategoryName.trim(),
          description: newCategoryDesc.trim() || `Diretrizes e publicações de ${newCategoryName.trim()}`,
          iconName: 'Folder',
          createdAt: Date.now(),
          createdBy: user.uid,
        };

        if (onSaveCategory) {
          await onSaveCategory(newCategoryObj);
        }
        finalCategory = generatedId;
      }

      const tags = tagsInput
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t.length > 0);

      const readingTimeMinutes = calculateReadingTime(content);
      const articleId = initialArticle?.id || slugify(title) + '-' + Math.floor(Math.random() * 1000);

      const articleData: Article = {
        id: articleId,
        title: title.trim(),
        slug: slugify(title),
        summary: summary.trim() || title.trim(),
        content: content,
        category: finalCategory,
        tags: tags.length > 0 ? tags : ['wiki', 'etecc'],
        author: {
          uid: user.uid,
          displayName: user.displayName || user.email?.split('@')[0] || 'Colaborador ETECC',
          email: user.email || 'colaborador@etecc.com.br',
          photoURL: user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.displayName || 'ETECC')}`,
          role: userProfile?.role || initialArticle?.author.role || 'Colaborador',
          department: userProfile?.department || initialArticle?.author.department || 'ETECC',
        },
        coverImage: coverImage.trim() || undefined,
        createdAt: initialArticle?.createdAt || Date.now(),
        updatedAt: Date.now(),
        isPinned: isPinned,
        views: initialArticle?.views || 1,
        readingTimeMinutes: readingTimeMinutes,
      };

      await onSave(articleData);
      localStorage.removeItem('etecc_wiki_editor_draft');
    } catch (err: unknown) {
      const e = err as { message?: string };
      console.error('Error saving article:', err);
      alert(e.message || 'Erro ao salvar artigo. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const readingTime = calculateReadingTime(content);

  return (
    <div className="flex-1 flex flex-col bg-stone-50 dark:bg-stone-950 min-h-screen">
      {/* Editor Top Bar - Sticky */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#e4022c]/10 text-[#e4022c] flex items-center justify-center">
            <Edit3 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-stone-900 dark:text-white">
              {initialArticle ? 'Editar Artigo' : 'Novo Artigo no Wiki'}
            </h2>
            <div className="flex items-center gap-2 text-[11px] text-stone-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> ~{readingTime} min de leitura
              </span>
              <span>•</span>
              <span>Markdown GFM ativo</span>
            </div>
          </div>
        </div>

        {/* View mode toggle (Split, Edit, Preview) */}
        <div className="flex items-center gap-1 p-1 bg-stone-100 dark:bg-stone-800 rounded-xl">
          <button
            onClick={() => setViewMode('edit')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
              viewMode === 'edit'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs'
                : 'text-stone-500 hover:text-stone-900 dark:hover:text-white'
            }`}
            title="Apenas Editor"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Editor</span>
          </button>

          <button
            onClick={() => setViewMode('split')}
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
              viewMode === 'split'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs'
                : 'text-stone-500 hover:text-stone-900 dark:hover:text-white'
            }`}
            title="Editor e Visualizador Lado a Lado"
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Lado a Lado</span>
          </button>

          <button
            onClick={() => setViewMode('preview')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
              viewMode === 'preview'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs'
                : 'text-stone-500 hover:text-stone-900 dark:hover:text-white'
            }`}
            title="Pré-visualização"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Preview</span>
          </button>
        </div>

        {/* Actions (Cancel & Publish) */}
        <div className="flex items-center gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-xs font-semibold text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition cursor-pointer"
          >
            Cancelar
          </button>

          <button
            onClick={handleSaveArticle}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#e4022c] hover:bg-[#c30024] active:scale-95 rounded-xl shadow-sm shadow-red-600/30 transition disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Publicando...' : 'Publicar no Wiki'}</span>
          </button>
        </div>
      </div>

      {/* Article Metadata Form (Title, Category, Summary, Tags) */}
      <div className="p-4 max-w-5xl mx-auto w-full space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
              Título do Artigo *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Procedimento de Backup e Restauração de Servidores..."
              className="w-full px-3.5 py-2.5 text-sm font-semibold rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#e4022c]"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
                Categoria & Setor *
              </label>
              {!isCreatingCategory ? (
                <button
                  type="button"
                  onClick={() => setIsCreatingCategory(true)}
                  className="text-[11px] text-[#e4022c] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <PlusCircle className="w-3 h-3" />
                  <span>+ Outra...</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsCreatingCategory(false)}
                  className="text-[11px] text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer"
                >
                  Cancelar
                </button>
              )}
            </div>

            {!isCreatingCategory ? (
              <select
                value={category}
                onChange={(e) => {
                  if (e.target.value === '__NEW__') {
                    setIsCreatingCategory(true);
                  } else {
                    setCategory(e.target.value);
                  }
                }}
                className="w-full px-3.5 py-2.5 text-sm font-medium rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#e4022c]"
              >
                {activeCategoriesList.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
                <option value="__NEW__" className="text-[#e4022c] font-bold">
                  + Outra categoria / Criar nova...
                </option>
              </select>
            ) : (
              <div className="p-3 rounded-xl bg-red-50/70 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 space-y-2 animate-in fade-in">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#e4022c]">
                  <Folder className="w-3.5 h-3.5" />
                  <span>Nova Categoria</span>
                </div>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Nome (ex: Financeiro, Jurídico...)"
                  className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-red-200 dark:border-red-900 bg-white dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#e4022c]"
                  autoFocus
                />
                <input
                  type="text"
                  value={newCategoryDesc}
                  onChange={(e) => setNewCategoryDesc(e.target.value)}
                  placeholder="Descrição rápida do setor (opcional)"
                  className="w-full px-2.5 py-1 text-[11px] rounded-lg border border-red-200 dark:border-red-900 bg-white dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#e4022c]"
                />
                <p className="text-[10px] text-stone-500 dark:text-stone-400">
                  Ficará salva no sistema para todos os colaboradores.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
              Resumo / Sinopse Rápida (exibido na busca e cartões)
            </label>
            <input
              type="text"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Breve descrição resumida do conteúdo abordado..."
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#e4022c]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
              Tags (separadas por vírgula)
            </label>
            <div className="relative">
              <Tag className="absolute left-3 top-2.5 w-3.5 h-3.5 text-stone-400" />
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="ex: ti, pop, segurança"
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#e4022c]"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
          <div className="flex-1 max-w-md flex items-center gap-2">
            <span className="text-stone-500 text-[11px] whitespace-nowrap">Imagem de Capa (URL opcional):</span>
            <input
              type="url"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-2.5 py-1 text-xs rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none text-stone-700 dark:text-stone-300">
            <input
              type="checkbox"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className="rounded accent-[#e4022c]"
            />
            <span className="font-semibold text-xs">Fixar Artigo no Topo do Wiki (Prioridade)</span>
          </label>
        </div>
      </div>

      {/* Markdown Toolbar - CONGELADA / STICKY ACOMPANHANDO A TELA */}
      <div className="sticky top-[57px] z-20 bg-stone-100/95 dark:bg-stone-900/95 backdrop-blur-md py-2 border-y border-stone-200/90 dark:border-stone-800/90 shadow-xs transition-all">
        <div className="max-w-5xl mx-auto w-full px-4">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700/80 overflow-x-auto shadow-2xs">
            {/* Text Styles */}
            <button
              type="button"
              onClick={() => insertText('**', '**', 'texto negrito')}
              className="p-1.5 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 transition"
              title="Negrito (**texto**)"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => insertText('*', '*', 'texto itálico')}
              className="p-1.5 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 transition"
              title="Itálico (*texto*)"
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => insertText('~~', '~~', 'texto tachado')}
              className="p-1.5 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 transition"
              title="Tachado (~~texto~~)"
            >
              <Strikethrough className="w-4 h-4" />
            </button>

            <span className="w-px h-4 bg-stone-200 dark:bg-stone-700 mx-1 shrink-0" />

            {/* Headings */}
            <button
              type="button"
              onClick={() => insertText('# ', '', 'Título 1')}
              className="p-1.5 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 font-bold text-xs"
              title="Título H1"
            >
              <Heading1 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => insertText('## ', '', 'Título 2')}
              className="p-1.5 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 font-bold text-xs"
              title="Título H2"
            >
              <Heading2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => insertText('### ', '', 'Título 3')}
              className="p-1.5 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 font-bold text-xs"
              title="Título H3"
            >
              <Heading3 className="w-4 h-4" />
            </button>

            <span className="w-px h-4 bg-stone-200 dark:bg-stone-700 mx-1 shrink-0" />

            {/* Lists */}
            <button
              type="button"
              onClick={() => insertText('- ', '', 'Item da lista')}
              className="p-1.5 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700"
              title="Lista com marcadores"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => insertText('1. ', '', 'Primeiro passo')}
              className="p-1.5 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700"
              title="Lista numerada"
            >
              <ListOrdered className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => insertText('- [ ] ', '', 'Tarefa pendente')}
              className="p-1.5 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700"
              title="Checklist / Lista de tarefas"
            >
              <CheckSquare className="w-4 h-4" />
            </button>

            <span className="w-px h-4 bg-stone-200 dark:bg-stone-700 mx-1 shrink-0" />

            {/* Code */}
            <button
              type="button"
              onClick={() => insertText('`', '`', 'código')}
              className="p-1.5 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700"
              title="Código em linha (`código`)"
            >
              <Code className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => insertText('```typescript\n', '\n```', '// Código ou comando')}
              className="p-1.5 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700"
              title="Bloco de código multilinhas"
            >
              <FileCode className="w-4 h-4" />
            </button>

            <span className="w-px h-4 bg-stone-200 dark:bg-stone-700 mx-1 shrink-0" />

            {/* Quote & Callouts */}
            <button
              type="button"
              onClick={() => insertText('> ', '', 'Citação de destaque')}
              className="p-1.5 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700"
              title="Citação (> texto)"
            >
              <Quote className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => insertText('> 💡 **Dica:** ', '', 'Dica importante para os colaboradores.')}
              className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40"
              title="Caixa de Dica"
            >
              <Lightbulb className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => insertText('> ⚠️ **Atenção:** ', '', 'Aviso crítico de segurança ou regra.')}
              className="p-1.5 rounded-lg text-[#e4022c] hover:bg-red-50 dark:hover:bg-red-950/40"
              title="Caixa de Alerta (#e4022c)"
            >
              <AlertCircle className="w-4 h-4" />
            </button>

            <span className="w-px h-4 bg-stone-200 dark:bg-stone-700 mx-1 shrink-0" />

            {/* Link, Table */}
            <button
              type="button"
              onClick={() => insertText('[', '](https://link.com)', 'Texto do link')}
              className="p-1.5 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700"
              title="Inserir Link"
            >
              <LinkIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                const tableMd = `\n| Coluna 1 | Coluna 2 | Coluna 3 |\n| :--- | :--- | :--- |\n| Dado A | Dado B | Dado C |\n| Dado D | Dado E | Dado F |\n`;
                insertText(tableMd, '', '');
              }}
              className="p-1.5 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700"
              title="Gerar Tabela"
            >
              <TableIcon className="w-4 h-4" />
            </button>

            <span className="w-px h-4 bg-stone-200 dark:bg-stone-700 mx-1 shrink-0" />

            {/* INSERIR / REDIMENSIONAR FOTO */}
            <button
              type="button"
              onClick={() => setShowImageModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-[#e4022c] bg-red-50 dark:bg-red-950/60 hover:bg-red-100 dark:hover:bg-red-900/60 transition shadow-2xs shrink-0 cursor-pointer"
              title="Inserir Foto ou Imagem com Redimensionamento"
            >
              <ImageIcon className="w-4 h-4" />
              <span>Inserir / Redimensionar Imagem</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace (Editor / Preview) */}
      <div className="flex-1 max-w-5xl mx-auto w-full px-4 pb-12 flex flex-col md:flex-row gap-4 pt-4">
        {/* Editor Pane */}
        {(viewMode === 'edit' || viewMode === 'split') && (
          <div className="flex-1 flex flex-col min-h-[500px]">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escreva a documentação em Markdown..."
              className="flex-1 w-full p-4 font-mono text-xs leading-relaxed rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#e4022c] shadow-2xs resize-y"
              style={{ minHeight: '520px' }}
            />
          </div>
        )}

        {/* Live Preview Pane */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div className="flex-1 flex flex-col min-h-[500px]">
            <div className="flex-1 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-y-auto shadow-2xs">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-100 dark:border-stone-800 text-stone-400 text-xs">
                <span className="font-semibold uppercase tracking-wider text-[10px]">
                  Pré-visualização em Tempo Real
                </span>
                <span className="text-[11px]">
                  {calculateReadingTime(content)} min de leitura
                </span>
              </div>

              <div
                className="wiki-prose dark:text-stone-200"
                dangerouslySetInnerHTML={{
                  __html: renderMarkdownToHtml(content),
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Modal de Inserção e Redimensionamento de Fotos */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-950/60 text-[#e4022c] flex items-center justify-center">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900 dark:text-white">
                    Inserir & Redimensionar Imagem
                  </h3>
                  <p className="text-[11px] text-stone-400">
                    Defina o tamanho ideal para não ocupar a tela inteira desnecessariamente.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowImageModal(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Opção de Foto de Perfil (photoURL) */}
              {user && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.displayName || 'ETECC')}`}
                      alt="User avatar"
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-[#e4022c]"
                    />
                    <div>
                      <p className="font-bold text-stone-900 dark:text-white">Minha Foto de Autor (photoURL)</p>
                      <p className="text-[11px] text-stone-500">{user.displayName || user.email}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleInsertUserPhotoUrl}
                    className="px-2.5 py-1.5 rounded-lg bg-[#e4022c] hover:bg-[#c30024] text-white font-semibold transition cursor-pointer"
                  >
                    Usar Esta
                  </button>
                </div>
              )}

              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  URL da Foto / Imagem *
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/... ou link direto da imagem"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#e4022c]"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Legenda / Texto Alternativo (Alt Text)
                </label>
                <input
                  type="text"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  placeholder="Ex: Diagrama de fluxo de aprovação de acessos"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#e4022c]"
                />
              </div>

              {/* SELETOR DE TAMANHO / REDIMENSIONAMENTO */}
              <div className="space-y-2 pt-1 border-t border-stone-100 dark:border-stone-800">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-stone-800 dark:text-stone-200">
                    Definir Tamanho da Imagem
                  </label>
                  <span className="text-[10px] text-[#e4022c] font-semibold">
                    Largura: {computedImageWidth}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setImageWidthPreset('small')}
                    className={`p-2 rounded-xl text-center border transition cursor-pointer ${
                      imageWidthPreset === 'small'
                        ? 'border-[#e4022c] bg-red-50 dark:bg-red-950/50 text-[#e4022c] font-bold shadow-2xs'
                        : 'border-stone-200 dark:border-stone-700 hover:border-stone-400 text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    <span className="block text-xs font-semibold">Pequena</span>
                    <span className="text-[10px] text-stone-400">280px</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setImageWidthPreset('medium')}
                    className={`p-2 rounded-xl text-center border transition cursor-pointer ${
                      imageWidthPreset === 'medium'
                        ? 'border-[#e4022c] bg-red-50 dark:bg-red-950/50 text-[#e4022c] font-bold shadow-2xs'
                        : 'border-stone-200 dark:border-stone-700 hover:border-stone-400 text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    <span className="block text-xs font-semibold">Média</span>
                    <span className="text-[10px] text-stone-400">520px (Padrão)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setImageWidthPreset('large')}
                    className={`p-2 rounded-xl text-center border transition cursor-pointer ${
                      imageWidthPreset === 'large'
                        ? 'border-[#e4022c] bg-red-50 dark:bg-red-950/50 text-[#e4022c] font-bold shadow-2xs'
                        : 'border-stone-200 dark:border-stone-700 hover:border-stone-400 text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    <span className="block text-xs font-semibold">Grande</span>
                    <span className="text-[10px] text-stone-400">800px</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setImageWidthPreset('full')}
                    className={`p-2 rounded-xl text-center border transition cursor-pointer ${
                      imageWidthPreset === 'full'
                        ? 'border-[#e4022c] bg-red-50 dark:bg-red-950/50 text-[#e4022c] font-bold shadow-2xs'
                        : 'border-stone-200 dark:border-stone-700 hover:border-stone-400 text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    <span className="block text-xs font-semibold">Total</span>
                    <span className="text-[10px] text-stone-400">100%</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setImageWidthPreset('custom')}
                    className={`px-2.5 py-1 text-xs rounded-lg border transition cursor-pointer ${
                      imageWidthPreset === 'custom'
                        ? 'border-[#e4022c] bg-red-50 dark:bg-red-950/50 text-[#e4022c] font-bold'
                        : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400'
                    }`}
                  >
                    Personalizar largura:
                  </button>
                  {imageWidthPreset === 'custom' && (
                    <input
                      type="text"
                      value={customImageWidth}
                      onChange={(e) => setCustomImageWidth(e.target.value)}
                      placeholder="ex: 420px ou 65%"
                      className="w-32 px-2.5 py-1 text-xs rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#e4022c]"
                    />
                  )}
                </div>
              </div>

              {/* Pré-visualização do tamanho */}
              {imageUrl.trim() && (
                <div className="p-3 rounded-xl bg-stone-100 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/60 space-y-1 text-center">
                  <span className="block text-[11px] font-semibold text-stone-500">
                    Prévia proporcional ({computedImageWidth}):
                  </span>
                  <div className="max-h-44 overflow-hidden flex justify-center py-1">
                    <img
                      src={imageUrl}
                      alt="Preview"
                      style={{
                        width: computedImageWidth,
                        maxWidth: '100%',
                        height: 'auto',
                        borderRadius: '8px',
                        objectFit: 'contain'
                      }}
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Fotos rápidas de exemplo */}
              <div>
                <span className="block text-[11px] text-stone-500 mb-1 font-medium">Ou selecione uma foto de exemplo:</span>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { alt: 'Arquitetura e Planejamento', url: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=600&q=80' },
                    { alt: 'Equipe Corporativa', url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80' },
                    { alt: 'Código e Engenharia', url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80' },
                    { alt: 'Segurança da Informação', url: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=600&q=80' },
                  ].map((preset, pIdx) => (
                    <button
                      type="button"
                      key={pIdx}
                      onClick={() => { setImageUrl(preset.url); setImageAlt(preset.alt); }}
                      className="rounded-lg overflow-hidden border border-stone-200 dark:border-stone-700 hover:border-[#e4022c] transition group aspect-video cursor-pointer"
                    >
                      <img src={preset.url} alt={preset.alt} className="w-full h-full object-cover group-hover:scale-105 transition" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowImageModal(false)}
                  className="flex-1 py-2 rounded-xl text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleInsertImage}
                  disabled={!imageUrl.trim()}
                  className="flex-1 py-2 rounded-xl bg-[#e4022c] hover:bg-[#c30024] text-white font-bold transition disabled:opacity-50 cursor-pointer"
                >
                  Inserir no Artigo ({computedImageWidth})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
