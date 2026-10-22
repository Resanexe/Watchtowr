import {
  UserPreferences,
  MyListItem,
  UserReview,
  UserFeedback,
  MyListStatus,
  FeedbackType,
  MediaCategory,
} from '@/types';

const PREFS_KEY = 'watchtowr_user_preferences';
const MY_LIST_KEY = 'watchtowr_my_list';
const REVIEWS_KEY = 'watchtowr_user_reviews';
const FEEDBACK_KEY = 'watchtowr_user_feedback';
const USER_SESSION_KEY = 'watchtowr_user_session';

export const DEFAULT_PREFERENCES: UserPreferences = {
  preferredCategories: ['movie', 'tv', 'anime', 'game'],
  preferredGenres: ['Sci-Fi', 'Action', 'Psychological'],
  dislikedGenres: [],
  preferredMoods: ['Mind-Bending', 'Adrenaline / Thrill'],
  minRating: 7.0,
  discoveryLevel: 0.3,
};

export interface UserSession {
  isGuest: boolean;
  userId: string;
  username: string;
  displayName: string;
}

export const GUEST_USER: UserSession = {
  isGuest: true,
  userId: 'guest-session',
  username: 'Guest Explorer',
  displayName: 'Guest Explorer',
};

export const REGISTERED_DEMO_USER: UserSession = {
  isGuest: false,
  userId: 'user-siam-demo',
  username: 'siam_watchtowr',
  displayName: 'Hossain Siam',
};

// Check if running on client
const isClient = typeof window !== 'undefined';

export function getStoredSession(): UserSession {
  if (!isClient) return REGISTERED_DEMO_USER;
  try {
    const raw = localStorage.getItem(USER_SESSION_KEY);
    return raw ? JSON.parse(raw) : REGISTERED_DEMO_USER;
  } catch {
    return REGISTERED_DEMO_USER;
  }
}

export function saveStoredSession(session: UserSession): void {
  if (!isClient) return;
  localStorage.setItem(USER_SESSION_KEY, JSON.stringify(session));
}

export function getStoredPreferences(): UserPreferences {
  if (!isClient) return DEFAULT_PREFERENCES;
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_PREFERENCES;
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function saveStoredPreferences(prefs: UserPreferences): void {
  if (!isClient) return;
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

export function getStoredMyList(): MyListItem[] {
  if (!isClient) return [];
  try {
    const raw = localStorage.getItem(MY_LIST_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function updateMyListItem(
  mediaId: string,
  category: MediaCategory,
  title: string,
  posterUrl: string,
  status: MyListStatus | null,
  externalRating?: number
): MyListItem[] {
  if (!isClient) return [];
  const list = getStoredMyList();
  const existingIndex = list.findIndex(item => item.mediaId === mediaId);

  if (status === null) {
    // Remove from list
    const updated = list.filter(item => item.mediaId !== mediaId);
    localStorage.setItem(MY_LIST_KEY, JSON.stringify(updated));
    return updated;
  }

  const now = new Date().toISOString();
  if (existingIndex >= 0) {
    list[existingIndex] = {
      ...list[existingIndex],
      status,
      updatedAt: now,
      ...(externalRating !== undefined ? { externalRating } : {}),
    };
  } else {
    list.unshift({
      mediaId,
      category,
      title,
      posterUrl,
      externalRating,
      status,
      addedAt: now,
      updatedAt: now,
    });
  }

  localStorage.setItem(MY_LIST_KEY, JSON.stringify(list));
  return list;
}

export function getStoredReviews(): UserReview[] {
  if (!isClient) return [];
  try {
    const raw = localStorage.getItem(REVIEWS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveStoredReview(
  mediaId: string,
  category: MediaCategory,
  title: string,
  rating: number,
  reviewText?: string
): UserReview[] {
  if (!isClient) return [];
  const reviews = getStoredReviews();
  const now = new Date().toISOString();
  const existingIdx = reviews.findIndex(r => r.mediaId === mediaId);

  if (existingIdx >= 0) {
    reviews[existingIdx] = {
      ...reviews[existingIdx],
      rating,
      reviewText,
      updatedAt: now,
    };
  } else {
    reviews.unshift({
      id: `rev-${Date.now()}`,
      mediaId,
      category,
      title,
      rating,
      reviewText,
      createdAt: now,
      updatedAt: now,
    });
  }

  localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));
  return reviews;
}

export function deleteStoredReview(mediaId: string): UserReview[] {
  if (!isClient) return [];
  const reviews = getStoredReviews().filter(r => r.mediaId !== mediaId);
  localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));
  return reviews;
}

export function getStoredFeedback(): UserFeedback[] {
  if (!isClient) return [];
  try {
    const raw = localStorage.getItem(FEEDBACK_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addFeedbackSignal(
  mediaId: string,
  category: MediaCategory,
  type: FeedbackType,
  reasonGenres: string[]
): UserFeedback[] {
  if (!isClient) return [];
  const feedback = getStoredFeedback();
  feedback.push({
    mediaId,
    category,
    type,
    reasonGenres,
    createdAt: new Date().toISOString(),
  });
  localStorage.setItem(FEEDBACK_KEY, JSON.stringify(feedback));
  return feedback;
}

// PRD FR-022: Reset recommendation history
export function resetRecommendationHistory(): void {
  if (!isClient) return;
  localStorage.removeItem(FEEDBACK_KEY);
  // Revert preferences to default without clearing MyList or saved reviews
  localStorage.setItem(PREFS_KEY, JSON.stringify(DEFAULT_PREFERENCES));
}

// PRD FR-023: Account Deletion and Purge
export function deleteAccountData(): void {
  if (!isClient) return;
  localStorage.removeItem(USER_SESSION_KEY);
  localStorage.removeItem(PREFS_KEY);
  localStorage.removeItem(MY_LIST_KEY);
  localStorage.removeItem(REVIEWS_KEY);
  localStorage.removeItem(FEEDBACK_KEY);
}
