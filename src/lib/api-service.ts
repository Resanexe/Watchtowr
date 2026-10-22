import { MediaItem, MediaCategory } from '@/types';
import {
  fetchTrendingMovies,
  fetchTopRatedMovies,
  fetchTrendingTV,
  fetchTopRatedTV,
  fetchTMDBDetails,
} from './tmdb';
import {
  fetchTrendingAnime,
  fetchPopularAnime,
  fetchAnimeDetails,
} from './anilist';
import {
  fetchTrendingGames,
  fetchTopRatedGames,
  fetchGameDetails,
} from './rawg';

export interface CategoryFeed {
  picksForYou: MediaItem[];
  trendingNow: MediaItem[];
  topRated: MediaItem[];
  recentlyAdded: MediaItem[];
}

export async function fetchLiveCategoryFeed(category: MediaCategory): Promise<CategoryFeed> {
  let trending: MediaItem[] = [];
  let top: MediaItem[] = [];

  switch (category) {
    case 'movie':
      [trending, top] = await Promise.all([
        fetchTrendingMovies(1, 24),
        fetchTopRatedMovies(1, 24),
      ]);
      break;
    case 'tv':
      [trending, top] = await Promise.all([
        fetchTrendingTV(1, 24),
        fetchTopRatedTV(1, 24),
      ]);
      break;
    case 'anime':
      [trending, top] = await Promise.all([
        fetchTrendingAnime(1, 24),
        fetchPopularAnime(1, 24),
      ]);
      break;
    case 'game':
      [trending, top] = await Promise.all([
        fetchTrendingGames(1, 24),
        fetchTopRatedGames(1, 24),
      ]);
      break;
  }

  const picksForYou = trending.slice(0, 6);
  const trendingNow = trending.slice(6, 12).length >= 6 ? trending.slice(6, 12) : trending.slice(0, 6);
  const topRated = top.slice(0, 6);
  const recentlyAdded = trending.slice(12, 18).length >= 6 ? trending.slice(12, 18) : top.slice(6, 12);

  return {
    picksForYou,
    trendingNow,
    topRated,
    recentlyAdded,
  };
}

export async function fetchLiveDetails(id: string): Promise<MediaItem | null> {
  if (id.startsWith('movie-')) {
    return fetchTMDBDetails(id, false);
  }
  if (id.startsWith('tv-')) {
    return fetchTMDBDetails(id, true);
  }
  if (id.startsWith('anime-')) {
    return fetchAnimeDetails(id);
  }
  if (id.startsWith('game-')) {
    return fetchGameDetails(id);
  }
  return null;
}
