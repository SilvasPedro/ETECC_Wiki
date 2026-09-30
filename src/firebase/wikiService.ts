import { 
  collection, 
  doc, 
  getDoc,
  getDocs, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  updateDoc, 
  increment 
} from 'firebase/firestore';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile, 
  signOut, 
  onAuthStateChanged, 
  GoogleAuthProvider,
  signInWithPopup,
  User 
} from 'firebase/auth';
import { db, auth } from './config';
import { Article, ArticleCategory, ArticleComment, AuthorInfo, UserProfile } from '../types/wiki';
import { DEFAULT_CATEGORIES } from '../data/defaultArticles';

const ARTICLES_COLLECTION = 'wiki_articles';
const COMMENTS_COLLECTION = 'wiki_comments';
const CATEGORIES_COLLECTION = 'wiki_categories';
const USERS_COLLECTION = 'users';
const LOCAL_STORAGE_KEY = 'etecc_wiki_articles_real_db_v2';
const USER_PROFILES_KEY = 'etecc_wiki_user_profiles_cache';

// Clear legacy mock cache if present on startup
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('etecc_wiki_articles_cache_v1');
    localStorage.removeItem('etecc_wiki_comments_onboarding-cultura-etecc');
    localStorage.removeItem('etecc_wiki_comments_politica-seguranca-acessos');
    localStorage.removeItem('etecc_wiki_comments_manual-marca-design-etecc');
    localStorage.removeItem('etecc_wiki_comments_padroes-engenharia-git-flow');
    localStorage.removeItem('etecc_wiki_comments_procedimento-gestao-incidentes-pop');
  } catch {
    // ignore
  }
}

// Get local cached articles (returns only real articles stored, never mock data)
export function getCachedArticles(): Article[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Filter out any mock articles with system-* author id
        return parsed.filter(a => !a.author?.uid?.startsWith('system-etecc-'));
      }
    }
  } catch {
    // ignore
  }
  return [];
}

// Save articles to local cache
export function setCachedArticles(articles: Article[]) {
  try {
    const sanitized = articles.filter(a => !a.author?.uid?.startsWith('system-etecc-'));
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sanitized));
  } catch {
    // ignore quota error
  }
}

// Subscribe to real articles from Firestore
export function subscribeArticles(onArticles: (articles: Article[]) => void): () => void {
  // Immediately emit whatever real articles are cached (empty if fresh)
  const cached = getCachedArticles();
  onArticles(cached);

  try {
    const q = query(collection(db, ARTICLES_COLLECTION), orderBy('updatedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: Article[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        // Ignore any legacy mock documents
        if (!data.author?.uid?.startsWith('system-etecc-') && docSnap.id !== 'onboarding-cultura-etecc') {
          items.push({ id: docSnap.id, ...(data as Omit<Article, 'id'>) });
        }
      });
      setCachedArticles(items);
      onArticles(items);
    }, (error) => {
      console.warn('Firestore articles subscription notice (using offline/local mode):', error.message);
      onArticles(getCachedArticles());
    });

    return unsubscribe;
  } catch (err) {
    console.warn('Failed to setup Firestore listener, using offline cache:', err);
    return () => {};
  }
}

// Save or Update an Article with strict author authorization check
export async function saveArticle(article: Article, currentUserId?: string): Promise<void> {
  const current = getCachedArticles();
  const existing = current.find(a => a.id === article.id);

  // Security check: Only original creator can edit existing post
  if (existing) {
    if (!currentUserId || (existing.author.uid && existing.author.uid !== currentUserId)) {
      throw new Error('Ação não autorizada: Apenas o colaborador que criou esta postagem pode editá-la.');
    }
  }

  // Update local cache first for instant feedback
  const existingIndex = current.findIndex(a => a.id === article.id);
  let updatedList: Article[];
  if (existingIndex >= 0) {
    updatedList = [...current];
    updatedList[existingIndex] = article;
  } else {
    updatedList = [article, ...current];
  }
  setCachedArticles(updatedList);

  // Sync with Firestore
  try {
    const docRef = doc(db, ARTICLES_COLLECTION, article.id);
    await setDoc(docRef, {
      title: article.title,
      slug: article.slug,
      summary: article.summary,
      content: article.content,
      category: article.category,
      tags: article.tags,
      author: article.author,
      coverImage: article.coverImage || '',
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      isPinned: !!article.isPinned,
      views: article.views || 0,
      readingTimeMinutes: article.readingTimeMinutes || 3,
    }, { merge: true });
  } catch (error) {
    console.warn('Could not sync article to Firestore (saved locally):', error);
  }
}

// Delete an Article with strict author authorization check
export async function deleteArticle(articleId: string, currentUserId?: string): Promise<void> {
  const current = getCachedArticles();
  const existing = current.find(a => a.id === articleId);

  // Security check: Only original creator can delete post
  if (existing) {
    if (!currentUserId || (existing.author.uid && existing.author.uid !== currentUserId)) {
      throw new Error('Ação não autorizada: Apenas o colaborador que criou esta postagem pode excluí-la.');
    }
  }

  const filtered = current.filter(a => a.id !== articleId);
  setCachedArticles(filtered);

  try {
    const docRef = doc(db, ARTICLES_COLLECTION, articleId);
    await deleteDoc(docRef);
  } catch (error) {
    console.warn('Could not delete from Firestore (deleted locally):', error);
  }
}

// Increment article view counter
export async function incrementViews(articleId: string): Promise<void> {
  try {
    const docRef = doc(db, ARTICLES_COLLECTION, articleId);
    await updateDoc(docRef, {
      views: increment(1),
    });
  } catch {
    const current = getCachedArticles();
    const item = current.find(a => a.id === articleId);
    if (item) {
      item.views = (item.views || 0) + 1;
      setCachedArticles([...current]);
    }
  }
}

// Clean any legacy mock articles from Firestore
export async function cleanLegacyMockArticlesFromFirestore() {
  try {
    const snap = await getDocs(collection(db, ARTICLES_COLLECTION));
    const legacyIds = [
      'onboarding-cultura-etecc',
      'politica-seguranca-acessos',
      'manual-marca-design-etecc',
      'padroes-engenharia-git-flow',
      'procedimento-gestao-incidentes-pop'
    ];
    snap.forEach(async (docSnap) => {
      const data = docSnap.data();
      if (
        data.author?.uid?.startsWith('system-etecc-') || 
        legacyIds.includes(docSnap.id)
      ) {
        try {
          await deleteDoc(doc(db, ARTICLES_COLLECTION, docSnap.id));
        } catch {
          // ignore
        }
      }
    });
  } catch (e) {
    console.log('Clean legacy check:', e);
  }
}

// Subscribe to real comments from Firestore for a specific article
export function subscribeComments(articleId: string, onComments: (comments: ArticleComment[]) => void): () => void {
  try {
    const q = query(
      collection(db, COMMENTS_COLLECTION),
      orderBy('createdAt', 'asc')
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const items: ArticleComment[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Omit<ArticleComment, 'id'>;
        if (data.articleId === articleId && !data.author?.uid?.startsWith('system-')) {
          items.push({ id: docSnap.id, ...data });
        }
      });
      onComments(items);
    }, (error) => {
      console.warn('Comments query note:', error.message);
      onComments([]);
    });
    return unsub;
  } catch (err) {
    console.warn('Failed to listen to comments:', err);
    onComments([]);
    return () => {};
  }
}

// Add a real comment to Firestore
export async function addArticleComment(comment: {
  articleId: string;
  author: AuthorInfo;
  content: string;
}): Promise<string> {
  const commentRef = doc(collection(db, COMMENTS_COLLECTION));
  await setDoc(commentRef, {
    articleId: comment.articleId,
    author: comment.author,
    content: comment.content,
    createdAt: Date.now(),
  });
  return commentRef.id;
}

// Subscribe to dynamic categories from Firestore
export function subscribeCategories(onCategories: (categories: ArticleCategory[]) => void): () => void {
  try {
    const q = query(collection(db, CATEGORIES_COLLECTION), orderBy('name', 'asc'));
    const unsub = onSnapshot(q, async (snapshot) => {
      if (snapshot.empty) {
        onCategories(DEFAULT_CATEGORIES);
        // Persist initial default categories to Firestore
        try {
          for (const cat of DEFAULT_CATEGORIES) {
            await setDoc(doc(db, CATEGORIES_COLLECTION, cat.id), cat);
          }
        } catch (e) {
          // ignore if unauthenticated initially
        }
      } else {
        const items: ArticleCategory[] = [];
        snapshot.forEach((docSnap) => {
          items.push({ id: docSnap.id, ...(docSnap.data() as Omit<ArticleCategory, 'id'>) });
        });
        onCategories(items);
      }
    }, (error) => {
      console.warn('Categories query note:', error.message);
      onCategories(DEFAULT_CATEGORIES);
    });

    return unsub;
  } catch (err) {
    console.warn('Failed to listen to categories:', err);
    onCategories(DEFAULT_CATEGORIES);
    return () => {};
  }
}

// Save or create a new category in Firestore
export async function saveCategory(category: ArticleCategory): Promise<void> {
  const catRef = doc(db, CATEGORIES_COLLECTION, category.id);
  await setDoc(catRef, {
    id: category.id,
    name: category.name,
    iconName: category.iconName || 'Folder',
    description: category.description || '',
    createdAt: category.createdAt || Date.now(),
    createdBy: category.createdBy || '',
  }, { merge: true });
}

// User Profile (Cargo & Setor) Management in Firestore & Cache
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  // Check local cache first
  try {
    const cachedMap = JSON.parse(localStorage.getItem(USER_PROFILES_KEY) || '{}');
    if (cachedMap[uid]) {
      return cachedMap[uid];
    }
  } catch {
    // ignore
  }

  // Fetch from Firestore
  try {
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, uid));
    if (userDoc.exists()) {
      const data = userDoc.data() as UserProfile;
      // update cache
      const cachedMap = JSON.parse(localStorage.getItem(USER_PROFILES_KEY) || '{}');
      cachedMap[uid] = data;
      localStorage.setItem(USER_PROFILES_KEY, JSON.stringify(cachedMap));
      return data;
    }
  } catch (err) {
    console.warn('Could not fetch user profile from Firestore:', err);
  }

  return null;
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  // Save to local cache
  try {
    const cachedMap = JSON.parse(localStorage.getItem(USER_PROFILES_KEY) || '{}');
    cachedMap[profile.uid] = profile;
    localStorage.setItem(USER_PROFILES_KEY, JSON.stringify(cachedMap));
  } catch {
    // ignore
  }

  // Save to Firestore
  try {
    await setDoc(doc(db, USERS_COLLECTION, profile.uid), {
      ...profile,
      updatedAt: Date.now(),
    }, { merge: true });
  } catch (err) {
    console.warn('Could not save user profile to Firestore (saved locally):', err);
  }
}

// Authentication Helpers
export function subscribeAuthState(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function loginWithEmail(email: string, pass: string) {
  return await signInWithEmailAndPassword(auth, email, pass);
}

export async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

export async function registerWithEmail(
  email: string, 
  pass: string, 
  displayName: string, 
  photoURL?: string,
  role?: string,
  department?: string
) {
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  if (cred.user) {
    const photo = photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName || email)}`;
    await updateProfile(cred.user, {
      displayName: displayName || email.split('@')[0],
      photoURL: photo,
    });

    if (role && department) {
      await saveUserProfile({
        uid: cred.user.uid,
        displayName: displayName || email.split('@')[0],
        email: cred.user.email || email,
        photoURL: photo,
        role: role.trim(),
        department: department.trim(),
        updatedAt: Date.now(),
      });
    }
  }
  return cred.user;
}

export async function updateUserPhotoAndName(displayName: string, photoURL: string, role?: string, department?: string) {
  if (!auth.currentUser) throw new Error('Nenhum usuário logado.');
  await updateProfile(auth.currentUser, {
    displayName,
    photoURL,
  });

  if (role && department) {
    await saveUserProfile({
      uid: auth.currentUser.uid,
      displayName,
      email: auth.currentUser.email || '',
      photoURL,
      role: role.trim(),
      department: department.trim(),
      updatedAt: Date.now(),
    });
  }

  return auth.currentUser;
}

export async function logoutUser() {
  return await signOut(auth);
}
