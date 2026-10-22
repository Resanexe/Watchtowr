import { MediaItem } from '@/types';

const RAWG_API_KEY =
  process.env.NEXT_PUBLIC_RAWG_API_KEY ||
  process.env.RAWG_API_KEY ||
  'f0a6d9de26254506ac56b81ee48add86';

function formatRAWGGame(g: any): MediaItem {
  const genres = (g.genres || []).map((genre: any) => genre.name);
  const platforms = (g.platforms || [])
    .map((p: any) => p.platform?.name)
    .filter(Boolean);

  const ratingOutOfFive = Number((g.rating || 4.5).toFixed(1));
  const year = g.released ? parseInt(g.released.slice(0, 4), 10) : 2023;

  return {
    id: `game-${g.id}`,
    externalId: g.id,
    category: 'game',
    title: g.name,
    synopsis: g.description_raw || `Play ${g.name}, critically acclaimed across platforms with immersive gameplay and storyline.`,
    posterUrl: g.background_image || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80',
    bannerUrl: g.background_image_additional || g.background_image,
    releaseDate: g.released || '2023-01-01',
    releaseYear: year,
    externalRating: ratingOutOfFive,
    externalVoteCount: g.ratings_count,
    genres: genres.length > 0 ? genres : ['Action', 'Adventure'],
    moods: ['Epic Adventure', 'Adrenaline / Thrill'],
    gamePlaytimeHours: g.playtime && g.playtime > 0 ? g.playtime : 25,
    gamePlatforms: platforms.length > 0 ? platforms.slice(0, 4) : ['PC', 'PlayStation 5', 'Xbox Series X'],
    gameModes: ['Single-player'],
    developerOrDirector: g.developers?.[0]?.name || 'Game Studio',
  };
}

export async function fetchTrendingGames(page = 1, limit = 24): Promise<MediaItem[]> {
  try {
    const res = await fetch(
      `https://api.rawg.io/api/games?key=${RAWG_API_KEY}&page=${page}&page_size=${limit}&ordering=-added`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) throw new Error(`RAWG error ${res.status}`);
    const data = await res.json();
    return (data.results || []).map(formatRAWGGame);
  } catch (err) {
    console.error('RAWG trending error:', err);
    return [];
  }
}

export async function fetchTopRatedGames(page = 1, limit = 24): Promise<MediaItem[]> {
  try {
    const res = await fetch(
      `https://api.rawg.io/api/games?key=${RAWG_API_KEY}&page=${page}&page_size=${limit}&ordering=-rating`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) throw new Error(`RAWG top rated error ${res.status}`);
    const data = await res.json();
    return (data.results || []).map(formatRAWGGame);
  } catch (err) {
    console.error('RAWG top rated error:', err);
    return [];
  }
}

export async function fetchGameDetails(id: string | number): Promise<MediaItem | null> {
  const numericId = String(id).replace(/^game-/, '');
  try {
    const res = await fetch(
      `https://api.rawg.io/api/games/${numericId}?key=${RAWG_API_KEY}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) throw new Error(`RAWG detail error ${res.status}`);
    const data = await res.json();
    return formatRAWGGame(data);
  } catch (err) {
    console.error('RAWG detail fetch error:', err);
    return null;
  }
}
