import 'server-only';
import { MediaItem } from '@/types';
import { deriveMoods } from '@/lib/media-metadata';

const ANILIST_API_URL = 'https://graphql.anilist.co';

interface AniListEntry {
  id: number;
  title?: { english?: string | null; romaji?: string | null };
  description?: string | null;
  coverImage?: { extraLarge?: string | null; large?: string | null };
  bannerImage?: string | null;
  startDate?: { year?: number | null; month?: number | null; day?: number | null };
  averageScore?: number | null;
  genres?: string[] | null;
  tags?: Array<{ name: string; isAdult?: boolean; rank?: number }> | null;
  episodes?: number | null;
  duration?: number | null;
  status?: string | null;
  studios?: { nodes?: Array<{ name: string }> };
}

function formatAniListItem(item: AniListEntry): MediaItem {
  const year = item.startDate?.year || 0;
  const releaseDate = year && item.startDate?.month
    ? `${year}-${String(item.startDate.month).padStart(2, '0')}-${String(item.startDate.day || 1).padStart(2, '0')}`
    : undefined;

  const episodeDuration = item.duration || undefined;
  const totalEpisodes = item.episodes || undefined;
  const ratingOutOfFive = item.averageScore
    ? Number(((item.averageScore / 100) * 5).toFixed(1))
    : 0;
  const genres = item.genres || [];
  const genreTags = (item.tags || [])
    .filter(tag => !tag.isAdult)
    .map(tag => tag.name);

  return {
    id: `anime-${item.id}`,
    externalId: item.id,
    category: 'anime',
    title: item.title?.english || item.title?.romaji || 'Untitled Anime',
    originalTitle: item.title?.romaji || undefined,
    synopsis: (item.description || 'No synopsis available.').replace(/<[^>]*>?/gm, ''),
    posterUrl: item.coverImage?.extraLarge || item.coverImage?.large || '',
    bannerUrl: item.bannerImage || undefined,
    releaseDate,
    releaseYear: year,
    externalRating: ratingOutOfFive,
    genres,
    genreTags,
    moods: deriveMoods([...genres, ...genreTags]),
    runtimeMinutes: episodeDuration,
    episodeCount: totalEpisodes,
    totalEstimatedTimeMinutes:
      episodeDuration !== undefined && totalEpisodes !== undefined
        ? episodeDuration * totalEpisodes
        : undefined,
    seriesStatus: item.status === 'FINISHED'
      ? 'Completed'
      : ['RELEASING', 'HIATUS'].includes(item.status || '') ? 'Ongoing'
        : item.status === 'NOT_YET_RELEASED' ? 'Upcoming' : undefined,
    animationStyle: 'Japanese Animation 2D',
    developerOrDirector: item.studios?.nodes?.[0]?.name,
  };
}

export async function fetchTrendingAnime(page = 1, limit = 24): Promise<MediaItem[]> {
  const query = `
    query ($page: Int, $limit: Int) {
      Page(page: $page, perPage: $limit) {
        media(type: ANIME, sort: TRENDING_DESC) {
          id
          title { romaji english }
          description(asHtml: false)
          coverImage { large extraLarge }
          bannerImage
          startDate { year month day }
          averageScore
          genres
          tags { name isAdult rank }
          episodes
          duration
          status
          studios(isMain: true) { nodes { name } }
        }
      }
    }
  `;

  try {
    const res = await fetch(ANILIST_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ query, variables: { page, limit } }),
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error(`AniList returned status ${res.status}`);
    const data = await res.json();
    return ((data?.data?.Page?.media || []) as AniListEntry[]).map(formatAniListItem);
  } catch (err) {
    console.error('AniList trending error:', err);
    return [];
  }
}

async function fetchAnimeBySort(
  page: number,
  limit: number,
  sort: 'POPULARITY_DESC' | 'SCORE_DESC' | 'START_DATE_DESC',
  label: string,
): Promise<MediaItem[]> {
  const query = `
    query ($page: Int, $limit: Int, $sort: [MediaSort]) {
      Page(page: $page, perPage: $limit) {
        media(type: ANIME, sort: $sort) {
          id
          title { romaji english }
          description(asHtml: false)
          coverImage { large extraLarge }
          bannerImage
          startDate { year month day }
          averageScore
          genres
          tags { name isAdult rank }
          episodes
          duration
          status
          studios(isMain: true) { nodes { name } }
        }
      }
    }
  `;

  try {
    const res = await fetch(ANILIST_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ query, variables: { page, limit, sort } }),
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error(`AniList returned status ${res.status}`);
    const data = await res.json();
    return ((data?.data?.Page?.media || []) as AniListEntry[]).map(formatAniListItem);
  } catch (err) {
    console.error(`AniList ${label} error:`, err);
    return [];
  }
}

export function fetchPopularAnime(page = 1, limit = 24): Promise<MediaItem[]> {
  return fetchAnimeBySort(page, limit, 'POPULARITY_DESC', 'popular');
}

export function fetchTopRatedAnime(page = 1, limit = 24): Promise<MediaItem[]> {
  return fetchAnimeBySort(page, limit, 'SCORE_DESC', 'top rated');
}

export function fetchRecentlyAddedAnime(page = 1, limit = 24): Promise<MediaItem[]> {
  return fetchAnimeBySort(page, limit, 'START_DATE_DESC', 'recently added');
}

export async function searchAnime(query: string, page = 1, limit = 20): Promise<{
  items: MediaItem[];
  hasMore: boolean;
  available: boolean;
}> {
  const search = query.trim();
  if (!search) return { items: [], hasMore: false, available: true };

  const gql = `
    query ($search: String, $page: Int, $limit: Int) {
      Page(page: $page, perPage: $limit) {
        pageInfo { hasNextPage }
        media(search: $search, type: ANIME, sort: SEARCH_MATCH) {
          id
          title { romaji english }
          description(asHtml: false)
          coverImage { large extraLarge }
          bannerImage
          startDate { year month day }
          averageScore
          genres
          tags { name isAdult rank }
          episodes
          duration
          status
          studios(isMain: true) { nodes { name } }
        }
      }
    }
  `;

  try {
    const res = await fetch(ANILIST_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ query: gql, variables: { search, page, limit } }),
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error(`AniList search returned status ${res.status}`);
    const data = await res.json();
    const resultPage = data?.data?.Page;
    if (!resultPage) throw new Error('AniList search returned no page data');
    return {
      items: ((resultPage.media || []) as AniListEntry[]).map(formatAniListItem),
      hasMore: Boolean(resultPage.pageInfo?.hasNextPage),
      available: true,
    };
  } catch (err) {
    console.error('AniList search error:', err);
    return { items: [], hasMore: false, available: false };
  }
}

export async function fetchAnimeDetails(id: string | number): Promise<MediaItem | null> {
  const numericId = parseInt(String(id).replace(/^anime-/, ''), 10);
  const query = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        id
        title { romaji english }
        description(asHtml: false)
        coverImage { large extraLarge }
        bannerImage
        startDate { year month day }
        averageScore
        genres
        tags { name isAdult rank }
        episodes
        duration
        status
        studios(isMain: true) { nodes { name } }
      }
    }
  `;

  try {
    const res = await fetch(ANILIST_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ query, variables: { id: numericId } }),
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error(`AniList returned status ${res.status}`);
    const data = await res.json();
    if (!data?.data?.Media) return null;
    return formatAniListItem(data.data.Media as AniListEntry);
  } catch (err) {
    console.error('AniList detail error:', err);
    return null;
  }
}
