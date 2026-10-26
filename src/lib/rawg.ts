import 'server-only';
import { MediaItem } from '@/types';
import { deriveMoods } from '@/lib/media-metadata';

const RAWG_API_KEY = process.env.RAWG_API_KEY;

interface RAWGGame {
  id: number;
  name: string;
  description_raw?: string;
  background_image?: string;
  background_image_additional?: string;
  released?: string;
  rating?: number;
  ratings_count?: number;
  genres?: Array<{ name: string }>;
  tags?: Array<{ name: string }>;
  platforms?: Array<{ platform?: { name?: string } }>;
  playtime?: number;
  developers?: Array<{ name: string }>;
}

function formatRAWGGame(g: RAWGGame): MediaItem {
  const genres = (g.genres || []).map(genre => genre.name);
  const platforms = (g.platforms || [])
    .map(p => p.platform?.name)
    .filter((name): name is string => Boolean(name));

  const ratingOutOfFive = Number((g.rating || 0).toFixed(1));
  const year = g.released ? parseInt(g.released.slice(0, 4), 10) : 0;
  const genreTags = (g.tags || []).map(tag => tag.name);

  return {
    id: `game-${g.id}`,
    externalId: g.id,
    category: 'game',
    title: g.name,
    synopsis: g.description_raw || 'No synopsis available.',
    posterUrl: g.background_image || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80',
    bannerUrl: g.background_image_additional || g.background_image,
    releaseDate: g.released,
    releaseYear: year,
    externalRating: ratingOutOfFive,
    externalVoteCount: g.ratings_count,
    genres,
    genreTags,
    moods: deriveMoods([...genres, ...genreTags]),
    gamePlaytimeHours: g.playtime && g.playtime > 0 ? g.playtime : undefined,
    gamePlatforms: platforms.length > 0 ? platforms : undefined,
    gameModes: undefined,
    developerOrDirector: g.developers?.[0]?.name,
  };
}

export async function fetchTrendingGames(page = 1, limit = 24): Promise<MediaItem[]> {
  if (!RAWG_API_KEY) return [];
  try {
    const res = await fetch(
      `https://api.rawg.io/api/games?key=${RAWG_API_KEY}&page=${page}&page_size=${limit}&ordering=-added`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) throw new Error(`RAWG error ${res.status}`);
    const data = await res.json();
    return ((data.results || []) as RAWGGame[]).map(formatRAWGGame);
  } catch (err) {
    console.error('RAWG trending error:', err);
    return [];
  }
}

export async function fetchTopRatedGames(page = 1, limit = 24): Promise<MediaItem[]> {
  if (!RAWG_API_KEY) return [];
  try {
    const res = await fetch(
      `https://api.rawg.io/api/games?key=${RAWG_API_KEY}&page=${page}&page_size=${limit}&ordering=-rating`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) throw new Error(`RAWG top rated error ${res.status}`);
    const data = await res.json();
    return ((data.results || []) as RAWGGame[]).map(formatRAWGGame);
  } catch (err) {
    console.error('RAWG top rated error:', err);
    return [];
  }
}

export async function searchGames(query: string, page = 1, limit = 20): Promise<{
  items: MediaItem[];
  hasMore: boolean;
  available: boolean;
}> {
  if (!RAWG_API_KEY) return { items: [], hasMore: false, available: false };
  try {
    const params = new URLSearchParams({
      key: RAWG_API_KEY,
      search: query,
      page: String(page),
      page_size: String(limit),
    });
    const res = await fetch(`https://api.rawg.io/api/games?${params}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error(`RAWG search error ${res.status}`);
    const data = await res.json();
    return {
      items: ((data.results || []) as RAWGGame[]).map(formatRAWGGame),
      hasMore: Boolean(data.next),
      available: true,
    };
  } catch (err) {
    console.error('RAWG search error:', err);
    return { items: [], hasMore: false, available: false };
  }
}

export async function fetchGameDetails(id: string | number): Promise<MediaItem | null> {
  if (!RAWG_API_KEY) return null;
  const numericId = String(id).replace(/^game-/, '');
  try {
    const res = await fetch(
      `https://api.rawg.io/api/games/${numericId}?key=${RAWG_API_KEY}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) throw new Error(`RAWG detail error ${res.status}`);
    const data = await res.json();
    return formatRAWGGame(data as RAWGGame);
  } catch (err) {
    console.error('RAWG detail fetch error:', err);
    return null;
  }
}
