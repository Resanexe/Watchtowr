import { CatalogSection, FilterState, MediaCategory, MediaItem } from '@/types';

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

export interface DiscoverPage {
  items: MediaItem[];
  hasMore: boolean;
  nextCursor: string | null;
  isFallback: boolean;
}

export interface GlobalSearchPage {
  items: MediaItem[];
  hasMore: boolean;
  page: number;
  unavailableCategories: MediaCategory[];
}

export interface HomepageSectionPage {
  items: MediaItem[];
  hasMore: boolean;
  page: number;
  isFallback: boolean;
}

export function fetchHomepageSection(
  category: 'all' | MediaCategory,
  section: CatalogSection,
  page = 1,
): Promise<HomepageSectionPage> {
  const params = new URLSearchParams({ mode: 'section', category, section, page: String(page) });
  return requestJSON<HomepageSectionPage>(`/api/catalog?${params.toString()}`);
}

export function fetchGlobalSearch(query: string, page = 1): Promise<GlobalSearchPage> {
  const params = new URLSearchParams({ mode: 'search', q: query, page: String(page) });
  return requestJSON<GlobalSearchPage>(`/api/catalog?${params.toString()}`);
}

export function buildDiscoverUrl(
  category: MediaCategory,
  filters: FilterState,
  cursor?: string | null,
): string {
  const params = new URLSearchParams({ mode: 'discover', category });
  if (filters.searchQuery) params.set('q', filters.searchQuery);
  if (filters.genres.length) params.set('genres', filters.genres.join(','));
  if (filters.moods?.length) params.set('moods', filters.moods.join(','));
  if (filters.minRating > 0) params.set('minRating', String(filters.minRating));
  if (filters.releaseYearMin !== undefined) params.set('releaseYearMin', String(filters.releaseYearMin));
  if (filters.releaseYearMax !== undefined) params.set('releaseYearMax', String(filters.releaseYearMax));
  if (filters.maxTimeMinutes !== undefined) params.set('maxTimeMinutes', String(filters.maxTimeMinutes));
  if (filters.runtimeMinMinutes !== undefined) params.set('runtimeMinMinutes', String(filters.runtimeMinMinutes));
  if (filters.runtimeMaxMinutes !== undefined) params.set('runtimeMaxMinutes', String(filters.runtimeMaxMinutes));
  if (filters.platform) params.set('platform', filters.platform);
  if (filters.seriesStatus) params.set('seriesStatus', filters.seriesStatus);
  params.set('sortBy', filters.sortBy);
  if (cursor) params.set('cursor', cursor);
  return `/api/catalog?${params.toString()}`;
}

export function fetchLiveDiscover(
  category: MediaCategory,
  filters: FilterState,
  cursor?: string | null,
): Promise<DiscoverPage> {
  return requestJSON<DiscoverPage>(buildDiscoverUrl(category, filters, cursor));
}

export function fetchLiveDetails(id: string): Promise<MediaItem | null> {
  return requestJSON<MediaItem | null>(`/api/catalog?mode=detail&id=${encodeURIComponent(id)}`);
}
