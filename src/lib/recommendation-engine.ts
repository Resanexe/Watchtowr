import {
  MediaItem,
  UserPreferences,
  MyListItem,
  UserReview,
  UserFeedback,
  ScoredMediaItem,
  FilterState,
} from '@/types';
import { platformMatches } from '@/lib/media-metadata';

export function calculateTitleTimeMinutes(item: MediaItem): number | undefined {
  if (item.category === 'movie' && item.runtimeMinutes !== undefined) {
    return item.runtimeMinutes;
  }
  if ((item.category === 'anime' || item.category === 'tv') && item.runtimeMinutes !== undefined) {
    return item.runtimeMinutes; // per-episode length
  }
  if (item.category === 'game' && item.gamePlaytimeHours !== undefined) {
    return item.gamePlaytimeHours * 60;
  }
  return undefined;
}

export function compareOptionalDurations(a: number | undefined, b: number | undefined): number {
  if (a === undefined) return b === undefined ? 0 : 1;
  if (b === undefined) return -1;
  return a - b;
}

function normalizeGenre(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function genreMatches(selectedGenre: string, itemGenres: string[]): boolean {
  const selected = normalizeGenre(selectedGenre);
  const normalizedGenres = itemGenres.map(normalizeGenre);
  if (normalizedGenres.includes(selected)) return true;

  // TMDB's TV taxonomy combines sci-fi with fantasy while the UI uses the
  // shorter, familiar label.
  if (selected === 'sci fi' || selected === 'fantasy') {
    return normalizedGenres.includes('sci fi fantasy');
  }
  if (selected === 'sci fi fantasy') {
    return normalizedGenres.includes('sci fi') || normalizedGenres.includes('fantasy');
  }
  if (selected === 'rpg') {
    return normalizedGenres.includes('role playing') || normalizedGenres.includes('role playing games rpg');
  }
  if (selected === 'role playing') {
    return normalizedGenres.some(genre => genre === 'rpg' || genre === 'role playing games rpg');
  }
  return false;
}

export function filterCatalog<T extends MediaItem>(
  items: T[],
  filter: FilterState,
  feedback: UserFeedback[]
): T[] {
  // Collect excluded media IDs from 'not_interested' feedback
  const notInterestedIds = new Set(
    feedback.filter(f => f.type === 'not_interested').map(f => f.mediaId)
  );

  return items.filter(item => {
    // 1. Exclude titles marked as 'not_interested'
    if (notInterestedIds.has(item.id)) {
      return false;
    }

    // 2. Category filter
    if (filter.category !== 'all' && item.category !== filter.category) {
      return false;
    }

    // 3. Search query match (title, synopsis, director)
    if (filter.searchQuery.trim() !== '') {
      const q = filter.searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchSynopsis = item.synopsis.toLowerCase().includes(q);
      const matchCreator = item.developerOrDirector?.toLowerCase().includes(q);
      const matchGenre = [...item.genres, ...(item.genreTags || [])].some(g => g.toLowerCase().includes(q));
      if (!matchTitle && !matchSynopsis && !matchCreator && !matchGenre) {
        return false;
      }
    }

    // 4. Genre filtering
    if (filter.genres.length > 0) {
      const hasMatchingGenre = filter.genres.some(g =>
        genreMatches(g, [...item.genres, ...(item.genreTags || [])])
      );
      if (!hasMatchingGenre) return false;
    }

    // 5. Preset mood filter (multi-select uses OR semantics)
    const selectedMoods = filter.moods?.length ? filter.moods : filter.mood ? [filter.mood] : [];
    if (selectedMoods.length > 0 && !selectedMoods.some(mood => item.moods.includes(mood))) {
      return false;
    }

    // 6. Rating limits
    if (item.externalRating < filter.minRating || item.externalRating > filter.maxRating) {
      return false;
    }

    // 7. Release year limits
    if (filter.releaseYearMin && item.releaseYear < filter.releaseYearMin) {
      return false;
    }
    if (filter.releaseYearMax && item.releaseYear > filter.releaseYearMax) {
      return false;
    }

    // 8. Strict Available Time Limits (PRD FR-007)
    if (filter.maxTimeMinutes && filter.maxTimeMinutes > 0) {
      const itemTime = calculateTitleTimeMinutes(item);
      if (itemTime === undefined) {
        // Unknown required time data -> exclude from strict time filter
        return false;
      }
      if (itemTime > filter.maxTimeMinutes) {
        return false;
      }
    }

    // 8b. Category-specific duration bands also require known duration data.
    if (filter.runtimeMinMinutes !== undefined || filter.runtimeMaxMinutes !== undefined) {
      const itemTime = calculateTitleTimeMinutes(item);
      if (itemTime === undefined) return false;
      if (filter.runtimeMinMinutes !== undefined && itemTime < filter.runtimeMinMinutes) return false;
      if (filter.runtimeMaxMinutes !== undefined && itemTime > filter.runtimeMaxMinutes) return false;
    }

    // 9. Game platform filter
    if (filter.platform && item.category === 'game') {
      if (!item.gamePlatforms || !platformMatches(filter.platform, item.gamePlatforms)) {
        return false;
      }
    }

    // 10. Series status filter
    if (filter.seriesStatus && (item.category === 'anime' || item.category === 'tv')) {
      if (item.seriesStatus !== filter.seriesStatus) {
        return false;
      }
    }

    return true;
  });
}

export function scoreAndRankRecommendations(
  items: MediaItem[],
  preferences: UserPreferences,
  myList: MyListItem[],
  reviews: UserReview[],
  feedback: UserFeedback[]
): ScoredMediaItem[] {
  // Aggregate user interaction profiles
  const myListMap = new Map<string, MyListItem>();
  myList.forEach(m => myListMap.set(m.mediaId, m));

  const reviewMap = new Map<string, UserReview>();
  reviews.forEach(r => reviewMap.set(r.mediaId, r));

  // Find genres from titles the user rated highly (4 or 5 stars)
  const highRatedGenres = new Set<string>();
  const lowRatedGenres = new Set<string>();

  reviews.forEach(r => {
    const reviewedItem = items.find(i => i.id === r.mediaId);
    const reviewedGenres = r.genres?.length ? r.genres : reviewedItem?.genres;
    if (reviewedGenres) {
      if (r.rating >= 4) {
        reviewedGenres.forEach(g => highRatedGenres.add(normalizeGenre(g)));
      } else if (r.rating <= 2) {
        reviewedGenres.forEach(g => lowRatedGenres.add(normalizeGenre(g)));
      }
    }
  });

  // Find genres penalized by 'show_less_like_this'
  const penalizedGenres = new Set<string>();
  feedback
    .filter(f => f.type === 'show_less_like_this')
    .forEach(f => f.reasonGenres.forEach(rg => penalizedGenres.add(normalizeGenre(rg))));

  const scoredItems: ScoredMediaItem[] = items
    .filter(item => item.externalRating >= preferences.minRating)
    .map(item => {
    let score = 50; // base score
    const explanations: string[] = [];
    const itemGenres = [...new Map(
      [...item.genres, ...(item.genreTags || [])].map(genre => [normalizeGenre(genre), genre])
    ).values()];

    // --- Signal 1: Category Preference ---
    if (preferences.preferredCategories.includes(item.category)) {
      score += 10;
    }

    // --- Signal 2: Explicit Genre Matching ---
    const matchingPreferredGenres = itemGenres.filter(g =>
      preferences.preferredGenres.some(pg => genreMatches(pg, [g]))
    );
    if (matchingPreferredGenres.length > 0) {
      const boost = matchingPreferredGenres.length * 8;
      score += boost;
      explanations.push(`Matches preferred genre (${matchingPreferredGenres.slice(0, 2).join(', ')})`);
    }

    // Disliked genre penalty
    const matchingDislikedGenres = itemGenres.filter(g =>
      preferences.dislikedGenres.some(dg => genreMatches(dg, [g]))
    );
    if (matchingDislikedGenres.length > 0) {
      score -= matchingDislikedGenres.length * 20;
    }

    // --- Signal 3: Preset Mood Matching ---
    const matchingMoods = item.moods.filter(m => preferences.preferredMoods.includes(m));
    if (matchingMoods.length > 0) {
      score += 12 * matchingMoods.length;
      explanations.push(`Fits your ${matchingMoods[0]} mood`);
    }

    // --- Signal 4: Interaction Ratings ---
    const userRating = reviewMap.get(item.id)?.rating;
    if (userRating) {
      if (userRating >= 4) {
        score += 25;
      } else if (userRating <= 2) {
        score -= 40;
      }
    }

    // Implicit similarity to high-rated titles
    const overlapWithHighRated = itemGenres.filter(g => highRatedGenres.has(normalizeGenre(g)));
    if (overlapWithHighRated.length > 0) {
      score += overlapWithHighRated.length * 4;
      if (explanations.length < 2) {
        explanations.push(`Similar to titles you rated highly`);
      }
    }

    const overlapWithLowRated = itemGenres.filter(g => lowRatedGenres.has(normalizeGenre(g)));
    if (overlapWithLowRated.length > 0) {
      score -= overlapWithLowRated.length * 4;
    }

    // --- Signal 5: MyList Status ---
    const listEntry = myListMap.get(item.id);
    if (listEntry) {
      if (listEntry.status === 'want_to_try') {
        score += 15;
        explanations.push(`In your Want to Try list`);
      } else if (listEntry.status === 'in_progress') {
        score += 8;
      } else if (listEntry.status === 'completed') {
        score -= 10;
      } else if (listEntry.status === 'dropped') {
        score -= 35;
      }
    }

    // --- Signal 6: Negative Feedback (Show less like this) ---
    const matchingPenalized = itemGenres.filter(g => penalizedGenres.has(normalizeGenre(g)));
    if (matchingPenalized.length > 0) {
      score -= matchingPenalized.length * 15;
    }

    // --- Signal 7: External Rating & Quality ---
    score += (item.externalRating / 5) * 15;

    // --- Signal 8: Available Time Constraint ---
    if (preferences.maxAvailableTimeMinutes) {
      const itemTime = calculateTitleTimeMinutes(item);
      if (itemTime !== undefined && itemTime <= preferences.maxAvailableTimeMinutes) {
        score += 12;
        explanations.push(`Fits within your ${preferences.maxAvailableTimeMinutes}m time window`);
      }
    }

    // --- Discovery Level (Diversity factor) ---
    const discovery = preferences.discoveryLevel;
    const explorationJitter = (Math.sin(item.id.length * 17) * 20) * discovery;
    score = score * (1 - discovery * 0.4) + explorationJitter;

    const explanation = explanations.length > 0
      ? explanations.slice(0, 2).join(' • ')
      : `Popular in ${item.category.toUpperCase()} (${item.externalRating}★)`;

    return {
      ...item,
      score: Math.round(score * 10) / 10,
      explanation,
      matchedSignals: explanations,
    };
    });

  return scoredItems.sort((a, b) => b.score - a.score);
}
