export interface AuthorInfo {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  role?: string;
  department?: string;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  role: string;
  department: string;
  updatedAt?: number;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  category: string;
  tags: string[];
  author: AuthorInfo;
  coverImage?: string;
  createdAt: number;
  updatedAt: number;
  isPinned?: boolean;
  views?: number;
  readingTimeMinutes?: number;
}

export interface ArticleCategory {
  id: string;
  name: string;
  iconName: string;
  description: string;
}

export interface ArticleComment {
  id: string;
  articleId: string;
  author: AuthorInfo;
  content: string;
  createdAt: number;
}

export interface TableOfContentsItem {
  id: string;
  text: string;
  level: number;
}

export type ThemeMode = 'light' | 'dark' | 'system';
export type ActiveTab = 'view' | 'edit' | 'new' | 'explore' | 'favorites';
