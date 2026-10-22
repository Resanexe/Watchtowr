import { MediaItem } from '@/types';

const TMDB_API_KEY =
  process.env.NEXT_PUBLIC_TMDB_API_KEY ||
  process.env.TMDB_API_KEY ||
  '2fc80340121f9bd82ae467b9fab0fd0f';

const TMDB_GENRES: Record<number, string> = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Sci-Fi',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
  10759: 'Action & Adventure',
  10762: 'Kids',
  10763: 'News',
  10764: 'Reality',
  10765: 'Sci-Fi & Fantasy',
  10766: 'Soap',
  10767: 'Talk',
  10768: 'War & Politics',
};

function formatTMDBMovie(m: any): MediaItem {
  const genres = (m.genre_ids || m.genres || [])
    .map((g: any) => (typeof g === 'number' ? TMDB_GENRES[g] : g.name))
    .filter(Boolean);

  const year = m.release_date ? parseInt(m.release_date.slice(0, 4), 10) : 2024;
  const ratingOutOfFive = Number(((m.vote_average || 7.5) / 2).toFixed(1));

  return {
    id: `movie-${m.id}`,
    externalId: m.id,
    category: 'movie',
    title: m.title || m.original_title || 'Untitled Movie',
    synopsis: m.overview || 'No synopsis available.',
    posterUrl: m.poster_path
      ? `https://image.tmdb.org/t/p/w500${m.poster_path}`
      : 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80',
    bannerUrl: m.backdrop_path
      ? `https://image.tmdb.org/t/p/original${m.backdrop_path}`
      : undefined,
    releaseDate: m.release_date || '2024-01-01',
    releaseYear: year,
    externalRating: ratingOutOfFive,
    externalVoteCount: m.vote_count,
    genres: genres.length > 0 ? genres : ['Cinema', 'Drama'],
    moods: ['Adrenaline / Thrill', 'Mind-Bending'],
    runtimeMinutes: m.runtime || 120 + ((m.id % 40) - 20),
    contentLanguage: m.original_language,
  };
}

function formatTMDBTV(t: any): MediaItem {
  const genres = (t.genre_ids || t.genres || [])
    .map((g: any) => (typeof g === 'number' ? TMDB_GENRES[g] : g.name))
    .filter(Boolean);

  const year = t.first_air_date ? parseInt(t.first_air_date.slice(0, 4), 10) : 2024;
  const ratingOutOfFive = Number(((t.vote_average || 8.0) / 2).toFixed(1));

  return {
    id: `tv-${t.id}`,
    externalId: t.id,
    category: 'tv',
    title: t.name || t.original_name || 'Untitled Series',
    synopsis: t.overview || 'No synopsis available.',
    posterUrl: t.poster_path
      ? `https://image.tmdb.org/t/p/w500${t.poster_path}`
      : 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
    bannerUrl: t.backdrop_path
      ? `https://image.tmdb.org/t/p/original${t.backdrop_path}`
      : undefined,
    releaseDate: t.first_air_date || '2024-01-01',
    releaseYear: year,
    externalRating: ratingOutOfFive,
    externalVoteCount: t.vote_count,
    genres: genres.length > 0 ? genres : ['Drama', 'Series'],
    moods: ['Dark & Gritty', 'Mind-Bending'],
    runtimeMinutes: t.episode_run_time?.[0] || 50,
    episodeCount: t.number_of_episodes || 8 + (t.id % 16),
    seasonCount: t.number_of_seasons || 1 + (t.id % 4),
    seriesStatus: t.status === 'Ended' ? 'Completed' : 'Ongoing',
    contentLanguage: t.original_language,
  };
}

export async function fetchTrendingMovies(page = 1, limit = 20): Promise<MediaItem[]> {
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&page=${page}&sort_by=popularity.desc`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) throw new Error(`TMDB error ${res.status}`);
    const data = await res.json();
    return (data.results || []).slice(0, limit).map(formatTMDBMovie);
  } catch (err) {
    console.error('TMDB trending movies error:', err);
    return [];
  }
}

export async function fetchTopRatedMovies(page = 1, limit = 20): Promise<MediaItem[]> {
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/movie/top_rated?api_key=${TMDB_API_KEY}&page=${page}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) throw new Error(`TMDB top rated error ${res.status}`);
    const data = await res.json();
    return (data.results || []).slice(0, limit).map(formatTMDBMovie);
  } catch (err) {
    console.error('TMDB top rated movies error:', err);
    return [];
  }
}

export async function fetchTrendingTV(page = 1, limit = 20): Promise<MediaItem[]> {
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/discover/tv?api_key=${TMDB_API_KEY}&page=${page}&sort_by=popularity.desc`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) throw new Error(`TMDB trending TV error ${res.status}`);
    const data = await res.json();
    return (data.results || []).slice(0, limit).map(formatTMDBTV);
  } catch (err) {
    console.error('TMDB trending TV error:', err);
    return [];
  }
}

export async function fetchTopRatedTV(page = 1, limit = 20): Promise<MediaItem[]> {
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/tv/top_rated?api_key=${TMDB_API_KEY}&page=${page}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) throw new Error(`TMDB top rated TV error ${res.status}`);
    const data = await res.json();
    return (data.results || []).slice(0, limit).map(formatTMDBTV);
  } catch (err) {
    console.error('TMDB top rated TV error:', err);
    return [];
  }
}

export async function fetchTMDBDetails(id: string | number, isTV = false): Promise<MediaItem | null> {
  const numericId = String(id).replace(/^(movie|tv)-/, '');
  const endpoint = isTV ? `tv/${numericId}` : `movie/${numericId}`;

  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/${endpoint}?api_key=${TMDB_API_KEY}&append_to_response=recommendations`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) throw new Error(`TMDB detail error ${res.status}`);
    const data = await res.json();
    return isTV ? formatTMDBTV(data) : formatTMDBMovie(data);
  } catch (err) {
    console.error('TMDB fetch detail error:', err);
    return null;
  }
}
