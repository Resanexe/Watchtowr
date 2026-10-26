import {
  UserPreferences,
  MyListItem,
  UserReview,
  UserFeedback,
  MyListStatus,
  FeedbackType,
  MediaCategory,
  ProfileAvatarColor,
} from '@/types';

const PREFS_KEY = 'watchtowr_user_preferences';
const MY_LIST_KEY = 'watchtowr_my_list';
const REVIEWS_KEY = 'watchtowr_user_reviews';
const FEEDBACK_KEY = 'watchtowr_user_feedback';
const USER_SESSION_KEY = 'watchtowr_user_session';
export const STORAGE_KEYS = {
  preferences: PREFS_KEY,
  myList: MY_LIST_KEY,
  reviews: REVIEWS_KEY,
  feedback: FEEDBACK_KEY,
  session: USER_SESSION_KEY,
};

function notifyStorageChange(key: string): void {
  if (isClient) {
    window.dispatchEvent(new CustomEvent('watchtowr:storage-change', { detail: key }));
  }
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  preferredCategories: ['movie', 'tv', 'anime', 'game'],
  preferredGenres: ['Sci-Fi', 'Action', 'Psychological'],
  dislikedGenres: [],
  preferredMoods: ['Mind-Bending', 'Adrenaline / Thrill'],
  minRating: 0,
  discoveryLevel: 0.3,
};

export function normalizePreferences(preferences: UserPreferences): UserPreferences {
  return {
    ...DEFAULT_PREFERENCES,
    ...preferences,
    minRating: preferences.minRating > 5 ? preferences.minRating / 2 : preferences.minRating,
  };
}

export interface UserSession {
  isGuest: boolean;
  userId: string;
  username: string;
  displayName: string;
  bio: string;
  avatarColor: ProfileAvatarColor;
  avatarDataUrl?: string;
}

export const GUEST_USER: UserSession = {
  isGuest: true,
  userId: 'guest-session',
  username: 'Guest Explorer',
  displayName: 'Guest Explorer',
  bio: 'Finding my next favorite story.',
  avatarColor: 'rose',
};

export const REGISTERED_DEMO_USER: UserSession = {
  isGuest: false,
  userId: 'user-siam-demo',
  username: 'siam_watchtowr',
  displayName: 'Hossain Siam',
  bio: 'Movies, anime, and games worth staying up for.',
  avatarColor: 'violet',
};

export function normalizeSession(session: Partial<UserSession>): UserSession {
  const validAvatarColors: ProfileAvatarColor[] = ['rose', 'violet', 'blue', 'emerald', 'amber'];
  return {
    ...GUEST_USER,
    ...session,
    username: typeof session.username === 'string' ? session.username : GUEST_USER.username,
    displayName: typeof session.displayName === 'string' ? session.displayName : GUEST_USER.displayName,
    bio: typeof session.bio === 'string' ? session.bio : GUEST_USER.bio,
    avatarColor: validAvatarColors.includes(session.avatarColor as ProfileAvatarColor)
      ? session.avatarColor as ProfileAvatarColor
      : GUEST_USER.avatarColor,
    avatarDataUrl: typeof session.avatarDataUrl === 'string'
      && session.avatarDataUrl.length <= 350_000
      && /^data:image\/(?:jpeg|png|webp);base64,/.test(session.avatarDataUrl)
      ? session.avatarDataUrl
      : undefined,
  };
}

// Check if running on client
const isClient = typeof window !== 'undefined';

export function getStoredSession(): UserSession {
  if (!isClient) return REGISTERED_DEMO_USER;
  try {
    const raw = localStorage.getItem(USER_SESSION_KEY);
    return raw ? normalizeSession(JSON.parse(raw) as Partial<UserSession>) : REGISTERED_DEMO_USER;
  } catch {
    return REGISTERED_DEMO_USER;
  }
}

export function saveStoredSession(session: UserSession): void {
  if (!isClient) return;
  localStorage.setItem(USER_SESSION_KEY, JSON.stringify(session));
  notifyStorageChange(USER_SESSION_KEY);
}

export function getStoredPreferences(): UserPreferences {
  if (!isClient) return DEFAULT_PREFERENCES;
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? normalizePreferences(JSON.parse(raw) as UserPreferences) : DEFAULT_PREFERENCES;
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function saveStoredPreferences(prefs: UserPreferences): void {
  if (!isClient) return;
  localStorage.setItem(PREFS_KEY, JSON.stringify(normalizePreferences(prefs)));
  notifyStorageChange(PREFS_KEY);
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
    notifyStorageChange(MY_LIST_KEY);
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
  notifyStorageChange(MY_LIST_KEY);
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
  reviewText?: string,
  genres: string[] = [],
): UserReview[] {
  if (!isClient) return [];
  const reviews = getStoredReviews();
  const now = new Date().toISOString();
  const existingIdx = reviews.findIndex(r => r.mediaId === mediaId);

  if (existingIdx >= 0) {
    reviews[existingIdx] = {
      ...reviews[existingIdx],
      rating,
      genres: genres.length ? genres : reviews[existingIdx].genres,
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
      genres,
      reviewText,
      createdAt: now,
      updatedAt: now,
    });
  }

  localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));
  notifyStorageChange(REVIEWS_KEY);
  return reviews;
}

export function deleteStoredReview(mediaId: string): UserReview[] {
  if (!isClient) return [];
  const reviews = getStoredReviews().filter(r => r.mediaId !== mediaId);
  localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));
  notifyStorageChange(REVIEWS_KEY);
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
  notifyStorageChange(FEEDBACK_KEY);
  return feedback;
}

// PRD FR-022: Reset recommendation history
export function resetRecommendationHistory(): void {
  if (!isClient) return;
  localStorage.removeItem(FEEDBACK_KEY);
  // Revert preferences to default without clearing MyList or saved reviews
  localStorage.setItem(PREFS_KEY, JSON.stringify(DEFAULT_PREFERENCES));
  notifyStorageChange(FEEDBACK_KEY);
  notifyStorageChange(PREFS_KEY);
}

// PRD FR-023: Account Deletion and Purge
export function deleteAccountData(): void {
  if (!isClient) return;
  localStorage.removeItem(USER_SESSION_KEY);
  localStorage.removeItem(PREFS_KEY);
  localStorage.removeItem(MY_LIST_KEY);
  localStorage.removeItem(REVIEWS_KEY);
  localStorage.removeItem(FEEDBACK_KEY);
  notifyStorageChange(USER_SESSION_KEY);
  notifyStorageChange(PREFS_KEY);
  notifyStorageChange(MY_LIST_KEY);
  notifyStorageChange(REVIEWS_KEY);
  notifyStorageChange(FEEDBACK_KEY);
}
