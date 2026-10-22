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

// Production catalog is 100% dynamic from TMDB, AniList, and RAWG APIs.
export const WATCHTOWR_CATALOG: ExtendedMediaItem[] = [];

export const INITIAL_CATALOG = WATCHTOWR_CATALOG;
