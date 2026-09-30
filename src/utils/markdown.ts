import { marked } from 'marked';
import { TableOfContentsItem } from '../types/wiki';

// Add slugified IDs to headings for Table of Contents navigation
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

export function extractTableOfContents(markdown: string): TableOfContentsItem[] {
  const items: TableOfContentsItem[] = [];
  const headingRegex = /^(#{1,3})\s+(.+)$/gm;
  let match;

  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length;
    const rawText = match[2].trim().replace(/\*\*|\*|_|`|\[.*?\]\(.*?\)/g, '');
    const id = slugify(rawText);
    items.push({ id, text: rawText, level });
  }

  return items;
}

export function calculateReadingTime(text: string): number {
  const wordsPerMinute = 200;
  const wordCount = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}

// Configure marked with custom image sizing and heading IDs
marked.use({
  gfm: true,
  breaks: true,
  renderer: {
    heading(item: any) {
      const text = item.text || '';
      const depth = item.depth || 1;
      const cleanText = text.replace(/<[^>]*>?/gm, '');
      const id = slugify(cleanText);
      return `<h${depth} id="${id}">${text}</h${depth}>\n`;
    },
    image(item: any) {
      const href = item.href || '';
      const title = item.title ? ` title="${item.title}"` : '';
      let text = item.text || '';
      let width = '';

      // Support syntax: ![Legenda da Foto|350px](url) or ![Legenda|50%](url) or ![Legenda|medio](url)
      if (text.includes('|')) {
        const parts = text.split('|');
        text = parts[0].trim();
        const sizeParam = parts[1].trim().toLowerCase();
        if (sizeParam === 'small' || sizeParam === 'pequeno' || sizeParam === 'p') {
          width = '280px';
        } else if (sizeParam === 'medium' || sizeParam === 'medio' || sizeParam === 'm') {
          width = '520px';
        } else if (sizeParam === 'large' || sizeParam === 'grande' || sizeParam === 'g') {
          width = '800px';
        } else if (/^\d+(px|%)?$/.test(sizeParam)) {
          width = sizeParam.endsWith('%') || sizeParam.endsWith('px') ? sizeParam : `${sizeParam}px`;
        }
      }

      const widthAttr = width ? ` width="${width}"` : '';
      const styleAttr = width 
        ? `style="max-width: 100%; width: ${width}; height: auto; border-radius: 0.75rem; margin: 1.25rem auto; display: block;"` 
        : `style="max-width: 100%; height: auto; border-radius: 0.75rem; margin: 1.25rem auto; display: block;"`;

      return `<img src="${href}" alt="${text}"${title}${widthAttr} ${styleAttr} loading="lazy" class="wiki-image-resizable" />`;
    }
  }
});

export function renderMarkdownToHtml(markdown: string): string {
  try {
    return marked.parse(markdown) as string;
  } catch (err) {
    console.error('Markdown parse error:', err);
    return markdown;
  }
}
