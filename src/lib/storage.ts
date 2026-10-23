import { SavedScrape } from '../types';

const STORAGE_KEY = 'markscraper_history_v1';

export function getSavedScrapes(): SavedScrape[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error('Failed to load history:', err);
    return [];
  }
}

export function saveScrape(scrape: Omit<SavedScrape, 'id' | 'createdAt'>): SavedScrape {
  const scrapes = getSavedScrapes();
  const newItem: SavedScrape = {
    ...scrape,
    id: 'scrape_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    createdAt: Date.now(),
  };
  // Keep up to 30 items
  const updated = [newItem, ...scrapes.filter(s => s.url !== scrape.url)].slice(0, 30);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save scrape to history:', err);
  }
  return newItem;
}

export function deleteSavedScrape(id: string): SavedScrape[] {
  const scrapes = getSavedScrapes().filter(s => s.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scrapes));
  } catch (err) {
    console.error('Failed to delete scrape:', err);
  }
  return scrapes;
}

export function updateSavedScrapeMarkdown(id: string, markdown: string): SavedScrape[] {
  const scrapes = getSavedScrapes().map(item => {
    if (item.id === id) {
      return { ...item, markdown };
    }
    return item;
  });
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scrapes));
  } catch (err) {
    console.error('Failed to update scrape:', err);
  }
  return scrapes;
}

export function clearAllHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear history:', err);
  }
}
