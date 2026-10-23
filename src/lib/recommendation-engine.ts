import {
  MediaItem,
  UserPreferences,
  MyListItem,
  UserReview,
  UserFeedback,
  ScoredMediaItem,
  FilterState,
} from '@/types';

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
      const matchGenre = item.genres.some(g => g.toLowerCase().includes(q));
      if (!matchTitle && !matchSynopsis && !matchCreator && !matchGenre) {
        return false;
      }
    }

    // 4. Genre filtering
    if (filter.genres.length > 0) {
      const hasMatchingGenre = filter.genres.some(g =>
        item.genres.some(itemGenre => itemGenre.toLowerCase() === g.toLowerCase())
      );
      if (!hasMatchingGenre) return false;
    }

    // 5. Preset mood filter
    if (filter.mood && !item.moods.includes(filter.mood)) {
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

    // 9. Game platform filter
    if (filter.platform && item.category === 'game') {
      if (!item.gamePlatforms?.includes(filter.platform)) {
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
    if (reviewedItem) {
      if (r.rating >= 4) {
        reviewedItem.genres.forEach(g => highRatedGenres.add(g.toLowerCase()));
      } else if (r.rating <= 2) {
        reviewedItem.genres.forEach(g => lowRatedGenres.add(g.toLowerCase()));
      }
    }
  });

  // Find genres penalized by 'show_less_like_this'
  const penalizedGenres = new Set<string>();
  feedback
    .filter(f => f.type === 'show_less_like_this')
    .forEach(f => f.reasonGenres.forEach(rg => penalizedGenres.add(rg.toLowerCase())));

  const scoredItems: ScoredMediaItem[] = items
    .filter(item => item.externalRating >= preferences.minRating)
    .map(item => {
    let score = 50; // base score
    const explanations: string[] = [];

    // --- Signal 1: Category Preference ---
    if (preferences.preferredCategories.includes(item.category)) {
      score += 10;
    }

    // --- Signal 2: Explicit Genre Matching ---
    const matchingPreferredGenres = item.genres.filter(g =>
      preferences.preferredGenres.some(pg => pg.toLowerCase() === g.toLowerCase())
    );
    if (matchingPreferredGenres.length > 0) {
      const boost = matchingPreferredGenres.length * 8;
      score += boost;
      explanations.push(`Matches preferred genre (${matchingPreferredGenres.slice(0, 2).join(', ')})`);
    }

    // Disliked genre penalty
    const matchingDislikedGenres = item.genres.filter(g =>
      preferences.dislikedGenres.some(dg => dg.toLowerCase() === g.toLowerCase())
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
    const overlapWithHighRated = item.genres.filter(g => highRatedGenres.has(g.toLowerCase()));
    if (overlapWithHighRated.length > 0) {
      score += overlapWithHighRated.length * 4;
      if (explanations.length < 2) {
        explanations.push(`Similar to titles you rated highly`);
      }
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
    const matchingPenalized = item.genres.filter(g => penalizedGenres.has(g.toLowerCase()));
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
