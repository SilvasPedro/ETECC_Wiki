import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { Article, ArticleCategory, TableOfContentsItem, UserProfile } from './types/wiki';
import { 
  subscribeArticles, 
  saveArticle, 
  deleteArticle,
  incrementViews, 
  subscribeAuthState, 
  getUserProfile,
  cleanLegacyMockArticlesFromFirestore,
  subscribeCategories,
  saveCategory 
} from './firebase/wikiService';
import { extractTableOfContents } from './utils/markdown';
import { useTheme } from './hooks/useTheme';

import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { ArticleList } from './components/ArticleList';
import { ArticleView } from './components/ArticleView';
import { MarkdownEditor } from './components/MarkdownEditor';
import { QuickSearchModal } from './components/QuickSearchModal';
import { AuthModal } from './components/AuthModal';
import { UserProfileModal } from './components/UserProfileModal';
import { CompleteProfileModal } from './components/CompleteProfileModal';
import { OfflineIndicator } from './components/OfflineIndicator';

export default function App() {
  const { theme, resolvedTheme, toggleTheme } = useTheme();

  // State
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<ArticleCategory[]>([]);
  const [currentArticle, setCurrentArticle] = useState<Article | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [articleToEdit, setArticleToEdit] = useState<Article | null>(null);

  // Modals
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCompleteProfileOpen, setIsCompleteProfileOpen] = useState(false);

  // Auth User & Profile
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [tocItems, setTocItems] = useState<TableOfContentsItem[]>([]);
  const [activeHeadingId, setActiveHeadingId] = useState<string>('');

  // 1. Subscribe to Firebase Auth and check Profile (Cargo & Setor)
  useEffect(() => {
    const unsub = subscribeAuthState(async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const profile = await getUserProfile(currentUser.uid);
        if (profile && profile.role && profile.department) {
          setUserProfile(profile);
          setIsCompleteProfileOpen(false);
        } else {
          // Mandatory completion of role and department
          setUserProfile(profile);
          setIsCompleteProfileOpen(true);
        }
      } else {
        setUserProfile(null);
        setIsCompleteProfileOpen(false);
      }
    });
    return () => unsub();
  }, []);

  // 2. Subscribe to Firestore Articles & Local Cache
  useEffect(() => {
    const unsub = subscribeArticles((loadedArticles) => {
      setArticles(loadedArticles);
      // If current article is viewed, sync its updated version
      if (currentArticle) {
        const found = loadedArticles.find((a) => a.id === currentArticle.id);
        if (found) setCurrentArticle(found);
      }
    });

    // Clean any legacy mock articles from Firestore
    cleanLegacyMockArticlesFromFirestore();

    return () => unsub();
  }, [currentArticle?.id]);

  // 3. Subscribe to Firestore Categories
  useEffect(() => {
    const unsub = subscribeCategories((loadedCategories) => {
      setCategories(loadedCategories);
    });
    return () => unsub();
  }, []);

  // 4. Extract Table of Contents whenever currentArticle changes
  useEffect(() => {
    if (currentArticle) {
      const items = extractTableOfContents(currentArticle.content);
      setTocItems(items);

      // Scroll listener for heading spy
      const handleScroll = () => {
        const headings = items.map((item) => document.getElementById(item.id)).filter(Boolean);
        for (let i = headings.length - 1; i >= 0; i--) {
          const el = headings[i];
          if (el && el.getBoundingClientRect().top <= 140) {
            setActiveHeadingId(items[i].id);
            break;
          }
        }
      };

      window.addEventListener('scroll', handleScroll, { passive: true });
      return () => window.removeEventListener('scroll', handleScroll);
    } else {
      setTocItems([]);
      setActiveHeadingId('');
    }
  }, [currentArticle]);

  // 4. Keyboard Shortcut Listener for Quick Search (⌘K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Actions
  const handleSelectArticle = (article: Article) => {
    setCurrentArticle(article);
    setIsEditing(false);
    setArticleToEdit(null);
    incrementViews(article.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToList = () => {
    setCurrentArticle(null);
    setIsEditing(false);
    setArticleToEdit(null);
  };

  const handleSelectCategory = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
    setCurrentArticle(null);
    setIsEditing(false);
    setArticleToEdit(null);
  };

  const handleNewArticle = () => {
    if (!user) {
      setIsAuthOpen(true);
      return;
    }
    if (!userProfile?.role || !userProfile?.department) {
      setIsCompleteProfileOpen(true);
      return;
    }
    setArticleToEdit(null);
    setIsEditing(true);
    setCurrentArticle(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditArticle = (article: Article) => {
    if (!user) {
      setIsAuthOpen(true);
      return;
    }
    // Security check: Only author can edit
    if (article.author.uid !== user.uid) {
      alert('Ação bloqueada: Apenas o autor original que criou este artigo pode editá-lo.');
      return;
    }
    if (!userProfile?.role || !userProfile?.department) {
      setIsCompleteProfileOpen(true);
      return;
    }
    setArticleToEdit(article);
    setIsEditing(true);
    setCurrentArticle(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveArticle = async (saved: Article) => {
    await saveArticle(saved, user?.uid);
    setIsEditing(false);
    setArticleToEdit(null);
    setCurrentArticle(saved);
  };

  const handleDeleteArticle = async (articleId: string) => {
    await deleteArticle(articleId, user?.uid);
    setCurrentArticle(null);
  };

  const handleTogglePin = async (article: Article) => {
    const updated = { ...article, isPinned: !article.isPinned, updatedAt: Date.now() };
    await saveArticle(updated, user?.uid);
  };

  const handleProfileComplete = (profile: UserProfile) => {
    setUserProfile(profile);
    setIsCompleteProfileOpen(false);
  };

  return (
    <div className="min-h-screen flex bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 font-sans selection:bg-[#e4022c] selection:text-white">
      {/* Guia Lateral (Sidebar) - Pinned from top to bottom (100vh) */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        articles={articles}
        categories={categories}
        currentArticle={currentArticle}
        selectedCategory={selectedCategory}
        onSelectCategory={handleSelectCategory}
        onSelectArticle={handleSelectArticle}
        onNewArticle={handleNewArticle}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        user={user}
        userProfile={userProfile}
        tocItems={tocItems}
        activeHeadingId={activeHeadingId}
      />

      {/* Main Content Area: Sticky Navbar at top + Center Work Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Navigation */}
        <Navbar
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenAuth={() => setIsAuthOpen(true)}
          onOpenProfile={() => setIsProfileOpen(true)}
          onNewArticle={handleNewArticle}
          theme={theme}
          resolvedTheme={resolvedTheme}
          onToggleTheme={toggleTheme}
          user={user}
        />

        {/* Dynamic Center Work Area */}
        <main className="flex-1 flex flex-col min-w-0">
          {isEditing ? (
            <MarkdownEditor
              initialArticle={articleToEdit}
              categories={categories}
              onSaveCategory={saveCategory}
              onSave={handleSaveArticle}
              onCancel={handleBackToList}
              user={user}
              userProfile={userProfile}
              onOpenAuth={() => setIsAuthOpen(true)}
            />
          ) : currentArticle ? (
            <ArticleView
              article={currentArticle}
              categories={categories}
              onEdit={handleEditArticle}
              onDelete={handleDeleteArticle}
              onBack={handleBackToList}
              onSelectCategory={handleSelectCategory}
              user={user}
              userProfile={userProfile}
              onOpenAuth={() => setIsAuthOpen(true)}
              onTogglePin={handleTogglePin}
            />
          ) : (
            <ArticleList
              articles={articles}
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={handleSelectCategory}
              onSelectArticle={handleSelectArticle}
              onNewArticle={handleNewArticle}
              onOpenSearch={() => setIsSearchOpen(true)}
            />
          )}
        </main>
      </div>

      {/* Quick Search Modal (⌘K / Ctrl+K) */}
      <QuickSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        articles={articles}
        categories={categories}
        onSelectArticle={handleSelectArticle}
      />

      {/* Authentication Modal (Email + Google) */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={() => {}}
      />

      {/* User Profile Modal (photoURL, Cargo, Setor) */}
      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={user}
        onProfileUpdated={async () => {
          if (user) {
            const p = await getUserProfile(user.uid);
            setUserProfile(p);
          }
        }}
      />

      {/* Mandatory Onboarding Profile Completion Modal */}
      <CompleteProfileModal
        isOpen={isCompleteProfileOpen}
        user={user}
        onComplete={handleProfileComplete}
      />

      {/* Non-intrusive Offline Connectivity Indicator */}
      <OfflineIndicator />
    </div>
  );
}

