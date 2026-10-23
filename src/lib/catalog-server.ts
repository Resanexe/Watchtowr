import 'server-only';
import { MediaCategory, MediaItem } from '@/types';
import { WATCHTOWR_CATALOG } from '@/lib/mock-data';
import {
  fetchTrendingMovies, fetchTopRatedMovies, fetchTrendingTV, fetchTopRatedTV,
  fetchTMDBDetails,
} from '@/lib/tmdb';
import { fetchTrendingAnime, fetchPopularAnime, fetchAnimeDetails } from '@/lib/anilist';
import { fetchTrendingGames, fetchTopRatedGames, fetchGameDetails } from '@/lib/rawg';

export const MEDIA_CATEGORIES: MediaCategory[] = ['movie', 'tv', 'anime', 'game'];

function fallbackItems(category: MediaCategory): MediaItem[] {
  return WATCHTOWR_CATALOG.filter(item => item.category === category);
}

async function getProviderItems(category: MediaCategory, page: number): Promise<MediaItem[]> {
  switch (category) {
    case 'movie': return fetchTrendingMovies(page, 24);
    case 'tv': return fetchTrendingTV(page, 24);
    case 'anime': return fetchTrendingAnime(page, 24);
    case 'game': return fetchTrendingGames(page, 24);
  }
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

  switch (category) {
    case 'movie':
      [trending, top] = await Promise.all([fetchTrendingMovies(1, 24), fetchTopRatedMovies(1, 24)]);
      break;
    case 'tv':
      [trending, top] = await Promise.all([fetchTrendingTV(1, 24), fetchTopRatedTV(1, 24)]);
      break;
    case 'anime':
      [trending, top] = await Promise.all([fetchTrendingAnime(1, 24), fetchPopularAnime(1, 24)]);
      break;
    case 'game':
      [trending, top] = await Promise.all([fetchTrendingGames(1, 24), fetchTopRatedGames(1, 24)]);
      break;
  }

  const isFallback = trending.length === 0 && top.length === 0;
  if (isFallback) {
    trending = fallbackItems(category);
    top = trending;
  }
  const unique = (items: MediaItem[]) => [...new Map(items.map(item => [item.id, item])).values()];
  trending = unique(trending);
  top = unique(top);
  const availablePicks = trending.length ? trending : top;

  return {
    picksForYou: availablePicks,
    trendingNow: availablePicks,
    topRated: top,
    recentlyAdded: [...availablePicks].sort((a, b) =>
      (b.releaseDate || `${b.releaseYear}-01-01`).localeCompare(a.releaseDate || `${a.releaseYear}-01-01`)
    ),
    isFallback,
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
