import { MediaItem, PresetMood } from '@/types';

const ANILIST_API_URL = 'https://graphql.anilist.co';

function mapGenresToMoods(genres: string[]): PresetMood[] {
  const moods: PresetMood[] = [];
  const gSet = new Set(genres.map(g => g.toLowerCase()));

  if (gSet.has('action') || gSet.has('sports') || gSet.has('thriller')) {
    moods.push('Adrenaline / Thrill');
  }
  if (gSet.has('psychological') || gSet.has('mystery') || gSet.has('sci-fi')) {
    moods.push('Mind-Bending');
  }
  if (gSet.has('horror') || gSet.has('drama')) {
    moods.push('Dark & Gritty');
  }
  if (gSet.has('slice of life') || gSet.has('comedy')) {
    moods.push('Chilling / Cozy');
  }
  if (gSet.has('adventure') || gSet.has('fantasy')) {
    moods.push('Epic Adventure');
  }
  if (gSet.has('romance') || gSet.has('drama')) {
    moods.push('Emotional / Tearjerker');
  }

  return moods.length > 0 ? moods : ['Feel-Good / Uplifting'];
}

function formatAniListItem(item: any): MediaItem {
  const year = item.startDate?.year || 2024;
  const releaseDate = year && item.startDate?.month
    ? `${year}-${String(item.startDate.month).padStart(2, '0')}-${String(item.startDate.day || 1).padStart(2, '0')}`
    : `${year}-01-01`;

  const episodeDuration = item.duration || 24;
  const totalEpisodes = item.episodes || 12;
  const ratingOutOfFive = item.averageScore
    ? Number(((item.averageScore / 100) * 5).toFixed(1))
    : 4.5;

  return {
    id: `anime-${item.id}`,
    externalId: item.id,
    category: 'anime',
    title: item.title?.english || item.title?.romaji || 'Untitled Anime',
    originalTitle: item.title?.romaji,
    synopsis: (item.description || 'No synopsis available.').replace(/<[^>]*>?/gm, ''),
    posterUrl: item.coverImage?.extraLarge || item.coverImage?.large,
    bannerUrl: item.bannerImage,
    releaseDate,
    releaseYear: year,
    externalRating: ratingOutOfFive,
    genres: item.genres || ['Anime'],
    moods: mapGenresToMoods(item.genres || []),
    runtimeMinutes: episodeDuration,
    episodeCount: totalEpisodes,
    totalEstimatedTimeMinutes: episodeDuration * totalEpisodes,
    seriesStatus: item.status === 'FINISHED' ? 'Completed' : 'Ongoing',
    animationStyle: 'Japanese Animation 2D',
    developerOrDirector: item.studios?.nodes?.[0]?.name || 'Animation Studio',
    contentLanguage: 'Japanese',
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
    return (data?.data?.Page?.media || []).map(formatAniListItem);
  } catch (err) {
    console.error('AniList trending error:', err);
    return [];
  }
}

export async function fetchPopularAnime(page = 1, limit = 24): Promise<MediaItem[]> {
  const query = `
    query ($page: Int, $limit: Int) {
      Page(page: $page, perPage: $limit) {
        media(type: ANIME, sort: POPULARITY_DESC) {
          id
          title { romaji english }
          description(asHtml: false)
          coverImage { large extraLarge }
          bannerImage
          startDate { year month day }
          averageScore
          genres
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
    return (data?.data?.Page?.media || []).map(formatAniListItem);
  } catch (err) {
    console.error('AniList popular error:', err);
    return [];
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
    return formatAniListItem(data.data.Media);
  } catch (err) {
    console.error('AniList detail error:', err);
    return null;
  }
}
