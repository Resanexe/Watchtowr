import { MediaCategory, MediaItem } from '@/types';

export interface CategoryFeed {
  picksForYou: MediaItem[];
  trendingNow: MediaItem[];
  topRated: MediaItem[];
  recentlyAdded: MediaItem[];
  isFallback?: boolean;
}

async function requestJSON<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Catalog request failed (${response.status})`);
  return response.json() as Promise<T>;
}

export function fetchLiveCategoryFeed(category: MediaCategory): Promise<CategoryFeed> {
  return requestJSON<CategoryFeed>(`/api/catalog?mode=feed&category=${category}`);
}

export function fetchLiveCatalog(category: MediaCategory, page = 1): Promise<{ items: MediaItem[]; isFallback: boolean }> {
  return requestJSON(`/api/catalog?mode=list&category=${category}&page=${page}`);
}

export function fetchLiveDetails(id: string): Promise<MediaItem | null> {
  return requestJSON<MediaItem | null>(`/api/catalog?mode=detail&id=${encodeURIComponent(id)}`);
}
