import { MediaItem, PresetMood } from '@/types';

export const ALL_PRESET_MOODS: PresetMood[] = [
  'Chilling / Cozy',
  'Adrenaline / Thrill',
  'Mind-Bending',
  'Dark & Gritty',
  'Feel-Good / Uplifting',
  'Epic Adventure',
  'Emotional / Tearjerker',
];

export interface DetailedReview {
  username: string;
  avatarUrl: string;
  rating: number;
  text: string;
  date?: string;
}

export interface ExtendedMediaItem extends MediaItem {
  publisher?: string;
  curatedReviews?: DetailedReview[];
  isHorizontalBanner?: boolean;
}

// Small, clearly identified examples keep the interface usable when providers
// are unavailable. Their durations are known example values, not provider data.
export const WATCHTOWR_CATALOG: ExtendedMediaItem[] = [
  {
    id: 'movie-offline-sample', externalId: 'offline-sample', category: 'movie',
    title: 'Offline Sample Film', synopsis: 'Sample catalog entry shown when movie data is unavailable.',
    posterUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80',
    releaseYear: 2024, externalRating: 0, genres: ['Drama'], moods: ['Mind-Bending'], runtimeMinutes: 110,
  },
  {
    id: 'tv-offline-sample', externalId: 'offline-sample', category: 'tv',
    title: 'Offline Sample Series', synopsis: 'Sample catalog entry shown when TV data is unavailable.',
    posterUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
    releaseYear: 2024, externalRating: 0, genres: ['Mystery'], moods: ['Mind-Bending'], runtimeMinutes: 45,
    episodeCount: 8, seriesStatus: 'Completed',
  },
  {
    id: 'anime-offline-sample', externalId: 'offline-sample', category: 'anime',
    title: 'Offline Sample Anime', synopsis: 'Sample catalog entry shown when anime data is unavailable.',
    posterUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80',
    releaseYear: 2024, externalRating: 0, genres: ['Adventure'], moods: ['Epic Adventure'], runtimeMinutes: 24,
    episodeCount: 12, seriesStatus: 'Completed',
  },
  {
    id: 'game-offline-sample', externalId: 'offline-sample', category: 'game',
    title: 'Offline Sample Game', synopsis: 'Sample catalog entry shown when game data is unavailable.',
    posterUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80',
    releaseYear: 2024, externalRating: 0, genres: ['Adventure'], moods: ['Epic Adventure'],
    gamePlatforms: ['PC'],
  },
];

export const INITIAL_CATALOG = WATCHTOWR_CATALOG;
