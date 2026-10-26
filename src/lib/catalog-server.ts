import 'server-only';
import { CatalogSection, FilterState, MediaCategory, MediaItem } from '@/types';
import { filterCatalog, calculateTitleTimeMinutes, compareOptionalDurations } from '@/lib/recommendation-engine';
import { WATCHTOWR_CATALOG } from '@/lib/mock-data';
import {
  fetchTrendingMovies, fetchTopRatedMovies, fetchRecentlyAddedMovies, fetchTrendingTV, fetchTopRatedTV, fetchRecentlyAddedTV,
  fetchTMDBDetails, fetchTrendingMoviesPage, fetchTrendingTVPage,
  searchTMDBMovies, searchTMDBTV,
} from '@/lib/tmdb';
import type { TMDBRuntimeBounds } from '@/lib/tmdb-query';
import { fetchTrendingAnime, fetchTopRatedAnime, fetchRecentlyAddedAnime, fetchAnimeDetails, searchAnime } from '@/lib/anilist';
import { fetchTrendingGames, fetchTopRatedGames, fetchRecentlyAddedGames, fetchGameDetails, searchGames } from '@/lib/rawg';

export const MEDIA_CATEGORIES: MediaCategory[] = ['movie', 'tv', 'anime', 'game'];

function fallbackItems(category: MediaCategory): MediaItem[] {
  return WATCHTOWR_CATALOG.filter(item => item.category === category);
}

function tmdbRuntimeBounds(filters?: FilterState): TMDBRuntimeBounds | undefined {
  if (!filters || (filters.runtimeMinMinutes === undefined && filters.runtimeMaxMinutes === undefined && !filters.maxTimeMinutes)) {
    return undefined;
  }
  const mins = [filters.runtimeMinMinutes].filter((value): value is number => value !== undefined);
  const maxes = [filters.runtimeMaxMinutes, filters.maxTimeMinutes]
    .filter((value): value is number => value !== undefined && value > 0);
  return {
    min: mins.length ? Math.max(...mins) : undefined,
    max: maxes.length ? Math.min(...maxes) : undefined,
  };
}

async function getProviderItems(category: MediaCategory, page: number, filters?: FilterState): Promise<MediaItem[]> {
  switch (category) {
    case 'movie': return fetchTrendingMovies(page, 24, tmdbRuntimeBounds(filters));
    case 'tv': return fetchTrendingTV(page, 24, tmdbRuntimeBounds(filters));
    case 'anime': return fetchTrendingAnime(page, 24);
    case 'game': return fetchTrendingGames(page, 24);
  }
}

async function getSearchProviderPage(category: MediaCategory, page: number, filters: FilterState) {
  if (category === 'movie') {
    return fetchTrendingMoviesPage(page, 24, tmdbRuntimeBounds(filters));
  }
  if (category === 'tv') {
    return fetchTrendingTVPage(page, 24, tmdbRuntimeBounds(filters));
  }
  const items = await getProviderItems(category, page);
  return { items, available: items.length > 0 };
}

const DISCOVER_PAGE_SIZE = 48;
const MAX_PROVIDER_PAGES_PER_REQUEST = 10;
const HOMEPAGE_SECTION_PAGES_PER_BATCH = 3;

export interface CatalogSearchPage {
  items: MediaItem[];
  hasMore: boolean;
  nextCursor: string | null;
  isFallback: boolean;
}

export interface GlobalCatalogSearchPage {
  items: MediaItem[];
  hasMore: boolean;
  page: number;
  unavailableCategories: MediaCategory[];
}

/** Search each provider's own full text index, independent of currently loaded catalog pages. */
export async function searchAllCatalogs(query: string, requestedPage = 1): Promise<GlobalCatalogSearchPage> {
  const normalizedQuery = query.trim().slice(0, 120);
  const page = Number.isInteger(requestedPage) ? Math.max(1, Math.min(500, requestedPage)) : 1;
  if (!normalizedQuery || requestedPage > 500) {
    return { items: [], hasMore: false, page, unavailableCategories: [] };
  }

  const results = await Promise.all([
    searchTMDBMovies(normalizedQuery, page),
    searchTMDBTV(normalizedQuery, page),
    searchAnime(normalizedQuery, page),
    searchGames(normalizedQuery, page),
  ]);
  const categories: MediaCategory[] = ['movie', 'tv', 'anime', 'game'];
  const unavailableCategories = categories.filter((_, index) => !results[index].available);
  const items: MediaItem[] = [];
  const maxResultsInAnyCategory = Math.max(0, ...results.map(result => result.items.length));

  // Interleave provider-ranked results so every category appears near the top.
  for (let index = 0; index < maxResultsInAnyCategory; index += 1) {
    for (const result of results) {
      const item = result.items[index];
      if (item) items.push(item);
    }
  }

  return {
    items: [...new Map(items.map(item => [item.id, item])).values()],
    hasMore: results.some(result => result.available && result.hasMore),
    page,
    unavailableCategories,
  };
}

function pageSizeFor(category: MediaCategory): number {
  // TMDB's v3 endpoints return 20 records per page; AniList and RAWG use 24 here.
  return category === 'movie' || category === 'tv' ? 20 : 24;
}

function parseCursor(cursor?: string | null): { page: number; offset: number; fallbackOffset?: number } {
  if (!cursor) return { page: 1, offset: 0 };
  const fallbackMatch = /^fallback:(\d+)$/.exec(cursor);
  if (fallbackMatch) return { page: 1, offset: 0, fallbackOffset: Number(fallbackMatch[1]) };
  const match = /^(\d+):(\d+)$/.exec(cursor);
  if (!match) return { page: 1, offset: 0 };
  const page = Number(match[1]);
  const offset = Number(match[2]);
  return Number.isInteger(page) && page > 0 && Number.isInteger(offset) && offset >= 0
    ? { page, offset }
    : { page: 1, offset: 0 };
}

function sortCatalog(items: MediaItem[], sortBy: FilterState['sortBy']): MediaItem[] {
  return [...items].sort((a, b) => {
    if (sortBy === 'rating') return b.externalRating - a.externalRating;
    if (sortBy === 'release') return b.releaseYear - a.releaseYear;
    if (sortBy === 'title') return a.title.localeCompare(b.title);
    if (sortBy === 'shortest_time') {
      return compareOptionalDurations(calculateTitleTimeMinutes(a), calculateTitleTimeMinutes(b));
    }
    return 0;
  });
}

/**
 * Scan the provider's paginated catalog on the server and apply filters before
 * returning a page. The cursor tracks both provider page and row offset so no
 * matching records are lost between provider pages.
 */
export async function searchCatalog(
  category: MediaCategory,
  filters: FilterState,
  cursor?: string | null,
): Promise<CatalogSearchPage> {
  const parsedCursor = parseCursor(cursor);
  let page = parsedCursor.page;
  let offset = parsedCursor.offset;
  const fallbackOffset = parsedCursor.fallbackOffset;
  const providerPageSize = pageSizeFor(category);
  const matches: MediaItem[] = [];
  let pagesScanned = 0;
  const tmdbDurationFilter = category === 'movie' || category === 'tv';
  const localFilters = tmdbDurationFilter
    ? { ...filters, maxTimeMinutes: undefined, runtimeMinMinutes: undefined, runtimeMaxMinutes: undefined }
    : filters;

  if (fallbackOffset !== undefined) {
    const fallback = filterCatalog(fallbackItems(category), filters, []);
    const sortedFallback = sortCatalog(fallback, filters.sortBy);
    const items = sortedFallback.slice(fallbackOffset, fallbackOffset + DISCOVER_PAGE_SIZE);
    const nextOffset = fallbackOffset + items.length;
    const hasMore = nextOffset < fallback.length;
    return {
      items,
      hasMore,
      nextCursor: hasMore ? `fallback:${nextOffset}` : null,
      isFallback: true,
    };
  }

  while (pagesScanned < MAX_PROVIDER_PAGES_PER_REQUEST) {
    const providerPage = await getSearchProviderPage(category, page, filters);
    const providerItems = providerPage.items;

    if (!providerPage.available && page === 1 && offset === 0) {
      const fallback = filterCatalog(fallbackItems(category), filters, []);
      const sortedFallback = sortCatalog(fallback, filters.sortBy);
      return {
        items: sortedFallback.slice(0, DISCOVER_PAGE_SIZE),
        hasMore: fallback.length > DISCOVER_PAGE_SIZE,
        nextCursor: fallback.length > DISCOVER_PAGE_SIZE ? `fallback:${DISCOVER_PAGE_SIZE}` : null,
        isFallback: true,
      };
    }

    if (providerItems.length === 0) {
      return { items: sortCatalog(matches, filters.sortBy), hasMore: false, nextCursor: null, isFallback: false };
    }

    for (let index = offset; index < providerItems.length; index += 1) {
      const item = providerItems[index];
      if (filterCatalog([item], localFilters, []).length > 0) matches.push(item);

      if (matches.length >= DISCOVER_PAGE_SIZE) {
        const nextOffset = index + 1;
        const atEndOfProviderPage = nextOffset >= providerItems.length;
        const hasMore = atEndOfProviderPage
          ? providerItems.length >= providerPageSize
          : true;
        const nextPage = atEndOfProviderPage ? page + 1 : page;
        const nextRow = atEndOfProviderPage ? 0 : nextOffset;
        return {
          items: sortCatalog(matches, filters.sortBy),
          hasMore,
          nextCursor: hasMore ? `${nextPage}:${nextRow}` : null,
          isFallback: false,
        };
      }
    }

    if (providerItems.length < providerPageSize) {
      return { items: sortCatalog(matches, filters.sortBy), hasMore: false, nextCursor: null, isFallback: false };
    }

    page += 1;
    offset = 0;
    pagesScanned += 1;
  }

  return {
    items: sortCatalog(matches, filters.sortBy),
    hasMore: true,
    nextCursor: `${page}:${offset}`,
    isFallback: false,
  };
}

export async function getCatalog(category: MediaCategory, page = 1) {
  const items = await getProviderItems(category, page);
  if (items.length > 0) return { items, isFallback: false };
  if (page > 1) return { items: [], isFallback: false };
  return { items: fallbackItems(category), isFallback: true };
}

export async function getCategoryFeed(category: MediaCategory) {
  let trending: MediaItem[] = [];
  let top: MediaItem[] = [];
  let recent: MediaItem[] = [];

  switch (category) {
    case 'movie':
      [trending, top, recent] = await Promise.all([fetchTrendingMovies(1, 24), fetchTopRatedMovies(1, 24), fetchRecentlyAddedMovies(1, 24)]);
      break;
    case 'tv':
      [trending, top, recent] = await Promise.all([fetchTrendingTV(1, 24), fetchTopRatedTV(1, 24), fetchRecentlyAddedTV(1, 24)]);
      break;
    case 'anime':
      [trending, top, recent] = await Promise.all([fetchTrendingAnime(1, 24), fetchTopRatedAnime(1, 24), fetchRecentlyAddedAnime(1, 24)]);
      break;
    case 'game':
      [trending, top, recent] = await Promise.all([fetchTrendingGames(1, 24), fetchTopRatedGames(1, 24), fetchRecentlyAddedGames(1, 24)]);
      break;
  }

  const isFallback = trending.length === 0 && top.length === 0;
  if (isFallback) {
    trending = fallbackItems(category);
    top = trending;
    recent = trending;
  }
  const unique = (items: MediaItem[]) => [...new Map(items.map(item => [item.id, item])).values()];
  trending = unique(trending);
  top = unique(top);
  const availablePicks = trending.length ? trending : top;

  return {
    picksForYou: availablePicks,
    trendingNow: availablePicks,
    topRated: top,
    recentlyAdded: [...recent].sort((a, b) =>
      (b.releaseDate || `${b.releaseYear}-01-01`).localeCompare(a.releaseDate || `${a.releaseYear}-01-01`)
    ),
    isFallback,
  };
}

export interface HomepageSectionPage {
  items: MediaItem[];
  hasMore: boolean;
  page: number;
  isFallback: boolean;
}

async function fetchTopRatedItems(category: MediaCategory, page: number): Promise<MediaItem[]> {
  switch (category) {
    case 'movie': return fetchTopRatedMovies(page, 24);
    case 'tv': return fetchTopRatedTV(page, 24);
    case 'anime': return fetchTopRatedAnime(page, 24);
    case 'game': return fetchTopRatedGames(page, 24);
  }
}

async function fetchRecentlyAddedItems(category: MediaCategory, page: number): Promise<MediaItem[]> {
  switch (category) {
    case 'movie': return fetchRecentlyAddedMovies(page, 24);
    case 'tv': return fetchRecentlyAddedTV(page, 24);
    case 'anime': return fetchRecentlyAddedAnime(page, 24);
    case 'game': return fetchRecentlyAddedGames(page, 24);
  }
}

async function getCategorySectionPage(
  category: MediaCategory,
  section: CatalogSection,
  page: number,
): Promise<HomepageSectionPage> {
  const providerPageSize = category === 'movie' || category === 'tv' ? 20 : 24;
  let items: MediaItem[];
  let hasMore = false;

  if (section === 'picks') {
    const [trending, topRated] = await Promise.all([
      getProviderItems(category, page),
      fetchTopRatedItems(category, page),
    ]);
    items = [...new Map([...trending, ...topRated].map(item => [item.id, item])).values()];
    hasMore = trending.length >= providerPageSize || topRated.length >= providerPageSize;
  } else {
    items = section === 'top-rated'
      ? await fetchTopRatedItems(category, page)
      : section === 'recently-added'
        ? await fetchRecentlyAddedItems(category, page)
        : await getProviderItems(category, page);
    hasMore = items.length >= providerPageSize;
  }

  if (section === 'recently-added') {
    items = [...items].sort((a, b) =>
      (b.releaseDate || `${b.releaseYear}-01-01`).localeCompare(a.releaseDate || `${a.releaseYear}-01-01`)
    );
  }
  if (section === 'top-rated') {
    items = [...items].sort((a, b) => b.externalRating - a.externalRating);
  }

  if (items.length === 0 && page === 1) {
    const fallback = fallbackItems(category);
    items = section === 'top-rated'
      ? [...fallback].sort((a, b) => b.externalRating - a.externalRating)
      : section === 'recently-added'
        ? [...fallback].sort((a, b) => (b.releaseDate || `${b.releaseYear}-01-01`).localeCompare(a.releaseDate || `${a.releaseYear}-01-01`))
        : fallback;
    return { items, hasMore: false, page, isFallback: items.length > 0 };
  }

  return { items, hasMore, page, isFallback: false };
}

export async function getHomepageSectionPage(
  category: 'all' | MediaCategory,
  section: CatalogSection,
  requestedPage = 1,
): Promise<HomepageSectionPage> {
  const page = Number.isInteger(requestedPage) ? Math.max(1, Math.min(500, requestedPage)) : 1;
  if (requestedPage > 500) return { items: [], hasMore: false, page, isFallback: false };
  const lastPage = Math.min(500, page + HOMEPAGE_SECTION_PAGES_PER_BATCH - 1);
  const providerPages = Array.from({ length: lastPage - page + 1 }, (_, index) => page + index);
  const getCategoryBatch = async (itemCategory: MediaCategory): Promise<HomepageSectionPage> => {
    const pages = await Promise.all(providerPages.map(providerPage =>
      getCategorySectionPage(itemCategory, section, providerPage)
    ));
    const items = [...new Map(pages.flatMap(result => result.items).map(item => [item.id, item])).values()];
    if (section === 'top-rated') items.sort((a, b) => b.externalRating - a.externalRating);
    if (section === 'recently-added') {
      items.sort((a, b) => (b.releaseDate || `${b.releaseYear}-01-01`).localeCompare(a.releaseDate || `${a.releaseYear}-01-01`));
    }
    return {
      items,
      hasMore: pages.at(-1)?.hasMore ?? false,
      page: lastPage,
      isFallback: pages.some(result => result.isFallback),
    };
  };

  if (category !== 'all') return getCategoryBatch(category);

  const categories: MediaCategory[] = ['movie', 'tv', 'anime', 'game'];
  const pages = await Promise.all(categories.map(getCategoryBatch));
  const allItems = pages.flatMap(result => result.items);
  let items: MediaItem[];

  if (section === 'top-rated') {
    items = allItems.sort((a, b) => b.externalRating - a.externalRating);
  } else if (section === 'recently-added') {
    items = allItems.sort((a, b) =>
      (b.releaseDate || `${b.releaseYear}-01-01`).localeCompare(a.releaseDate || `${a.releaseYear}-01-01`)
    );
  } else {
    items = [];
    for (let index = 0; index < Math.max(0, ...pages.map(result => result.items.length)); index += 1) {
      for (const result of pages) {
        if (result.items[index]) items.push(result.items[index]);
      }
    }
  }

  return {
    items: [...new Map(items.map(item => [item.id, item])).values()],
    hasMore: pages.some(result => result.hasMore),
    page: lastPage,
    isFallback: pages.some(result => result.isFallback),
  };
}

export async function getTitleDetails(id: string): Promise<MediaItem | null> {
  let item: MediaItem | null = null;
  if (id.startsWith('movie-')) item = await fetchTMDBDetails(id, false);
  else if (id.startsWith('tv-')) item = await fetchTMDBDetails(id, true);
  else if (id.startsWith('anime-')) item = await fetchAnimeDetails(id);
  else if (id.startsWith('game-')) item = await fetchGameDetails(id);
  return item || WATCHTOWR_CATALOG.find(fallback => fallback.id === id) || null;
}
