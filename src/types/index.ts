export type MediaCategory = 'movie' | 'tv' | 'anime' | 'game';

export type CatalogSection = 'picks' | 'trending' | 'top-rated' | 'recently-added';

export type MyListStatus = 'want_to_try' | 'in_progress' | 'completed' | 'dropped';

export type FeedbackType = 'not_interested' | 'show_less_like_this';

export type ProfileAvatarColor = 'rose' | 'violet' | 'blue' | 'emerald' | 'amber';

export type PresetMood = 
  | 'Chilling / Cozy'
  | 'Adrenaline / Thrill'
  | 'Mind-Bending'
  | 'Dark & Gritty'
  | 'Feel-Good / Uplifting'
  | 'Epic Adventure'
  | 'Emotional / Tearjerker';

export interface MediaItem {
  id: string; // e.g. "movie-550", "anime-1", "game-3498"
  externalId: string | number;
  category: MediaCategory;
  title: string;
  originalTitle?: string;
  tagline?: string;
  synopsis: string;
  posterUrl: string;
  bannerUrl?: string;
  releaseDate?: string; // YYYY-MM-DD
  releaseYear: number;
  externalRating: number; // 0.0 to 5.0 scale
  externalVoteCount?: number;
  genres: string[];
  /** Additional provider tags that can be used by discovery genre filters. */
  genreTags?: string[];
  moods: PresetMood[];

  // Strict Time & Length Fields (PRD FR-007)
  runtimeMinutes?: number;              // Movies & per-episode runtime for TV/Anime
  episodeCount?: number;                // Total episodes for TV/Anime
  seasonCount?: number;                 // Season count for TV
  totalEstimatedTimeMinutes?: number;   // Calculated total watch time
  gamePlaytimeHours?: number;           // Estimated hours to complete game

  // Category-Specific Metadata (PRD FR-006)
  gamePlatforms?: string[];             // PC, PS5, Xbox Series X, Nintendo Switch, etc.
  gameModes?: string[];                 // Single-player, Multiplayer, Co-op
  gamePerspectives?: string[];          // First-person, Third-person, Isometric
  seriesStatus?: 'Ongoing' | 'Completed' | 'Upcoming';
  animationStyle?: string;              // 2D, 3D CGI, Hand-drawn
  contentLanguage?: string;
  developerOrDirector?: string;
  similarMediaIds?: string[];           // Related recommendations
}

export interface UserPreferences {
  preferredCategories: MediaCategory[];
  preferredGenres: string[];
  dislikedGenres: string[];
  preferredMoods: PresetMood[];
  minRating: number;                    // 0.0 to 5.0
  maxAvailableTimeMinutes?: number;     // e.g. 30, 60, 120, or undefined for no limit
  discoveryLevel: number;               // 0.0 (strict matching) to 1.0 (high serendipity / variety)
}

export interface MyListItem {
  mediaId: string;
  category: MediaCategory;
  title: string;
  posterUrl: string;
  externalRating?: number;
  status: MyListStatus;
  addedAt: string;
  updatedAt: string;
}

export interface UserReview {
  id: string;
  mediaId: string;
  category: MediaCategory;
  title: string;
  rating: number; // 1 to 5 stars
  /** Genre snapshot used to personalize recommendations even when the title is not in the current feed. */
  genres?: string[];
  reviewText?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserFeedback {
  mediaId: string;
  category: MediaCategory;
  type: FeedbackType;
  reasonGenres: string[];
  createdAt: string;
}

export interface FilterState {
  category: 'all' | MediaCategory;
  searchQuery: string;
  genres: string[];
  mood?: PresetMood;
  moods?: PresetMood[];
  minRating: number;
  maxRating: number;
  releaseYearMin?: number;
  releaseYearMax?: number;
  maxTimeMinutes?: number;      // Strict time filter (runtime or episode or game playtime in mins)
  runtimeMinMinutes?: number;
  runtimeMaxMinutes?: number;
  strictTimeOnly: boolean;      // If true, discard titles where required time data is unknown
  platform?: string;            // Games
  seriesStatus?: string;        // TV / Anime
  sortBy: 'recommended' | 'rating' | 'release' | 'title' | 'shortest_time';
}

export interface ScoredMediaItem extends MediaItem {
  score: number;
  explanation?: string;
  matchedSignals?: string[];
}
