export type ScrapeMode = 'ai_structured' | 'documentation' | 'article' | 'cheatsheet' | 'raw';

export interface ScrapeOptions {
  includeFrontmatter: boolean;
  includeTableOfContents: boolean;
  extractImages: boolean;
  extractLinks: boolean;
  includeMetadata: boolean;
  customPrompt?: string;
}

export interface ScrapeRequest {
  url: string;
  mode: ScrapeMode;
  options: ScrapeOptions;
}

export interface PageMetadata {
  title: string;
  description: string;
  author?: string;
  publishedTime?: string;
  ogImage?: string;
  siteName?: string;
  domain: string;
  wordCount: number;
  readingTimeMinutes: number;
}

export interface ScrapeResponse {
  success: boolean;
  url: string;
  markdown: string;
  metadata: PageMetadata;
  extractedLinks?: { text: string; url: string }[];
  extractedImages?: { alt: string; url: string }[];
  error?: string;
}

export interface SavedScrape {
  id: string;
  url: string;
  title: string;
  domain: string;
  markdown: string;
  metadata: PageMetadata;
  mode: ScrapeMode;
  createdAt: number;
}
