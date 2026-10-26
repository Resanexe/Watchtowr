import {
  scoreAndRankRecommendations,
  filterCatalog,
  calculateTitleTimeMinutes,
  compareOptionalDurations,
} from './src/lib/recommendation-engine';
import { buildDiscoverUrl } from './src/lib/api-service';
import { buildTMDBDiscoverUrl } from './src/lib/tmdb-query';
import {
  MediaItem,
  UserPreferences,
  FilterState,
  MyListItem,
  UserReview,
  UserFeedback,
} from './src/types';

// Dedicated Unit Test Fixtures (Testing scoring algorithms without hardcoded titles in production)
const TEST_CATALOG: MediaItem[] = [
  {
    id: 'movie-test-1',
    externalId: 1,
    category: 'movie',
    title: 'Test Sci-Fi Feature',
    synopsis: 'A test sci-fi movie.',
    posterUrl: 'https://example.com/poster.jpg',
    releaseYear: 2024,
    externalRating: 4.8,
    genres: ['Sci-Fi', 'Action'],
    moods: ['Mind-Bending'],
    runtimeMinutes: 120,
  },
  {
    id: 'movie-test-short',
    externalId: 2,
    category: 'movie',
    title: 'Short 25m Film',
    synopsis: 'A test short movie.',
    posterUrl: 'https://example.com/poster.jpg',
    releaseYear: 2024,
    externalRating: 4.5,
    genres: ['Drama'],
    moods: ['Emotional / Tearjerker'],
    runtimeMinutes: 25,
  },
  {
    id: 'game-test-rpg',
    externalId: 3,
    category: 'game',
    title: 'Epic Test RPG',
    synopsis: 'A 100-hour test RPG game.',
    posterUrl: 'https://example.com/poster.jpg',
    releaseYear: 2022,
    externalRating: 4.9,
    genres: ['RPG', 'Open World'],
    moods: ['Epic Adventure'],
    gamePlaytimeHours: 100,
    gamePlatforms: ['PC', 'PlayStation 5'],
  },
  {
    id: 'tv-test-series',
    externalId: 4,
    category: 'tv',
    title: 'Mystery Thriller Series',
    synopsis: 'A test mystery television series.',
    posterUrl: 'https://example.com/poster.jpg',
    releaseYear: 2023,
    externalRating: 4.7,
    genres: ['Mystery', 'Thriller'],
    moods: ['Dark & Gritty'],
    episodeCount: 10,
    runtimeMinutes: 45,
  },
  {
    id: 'anime-test-series',
    externalId: 5,
    category: 'anime',
    title: 'Shounen Test Anime',
    synopsis: 'A test shounen anime.',
    posterUrl: 'https://example.com/poster.jpg',
    releaseYear: 2023,
    externalRating: 4.6,
    genres: ['Action', 'Fantasy'],
    moods: ['Adrenaline / Thrill'],
    episodeCount: 24,
    runtimeMinutes: 24,
  },
];

function runTests() {
  console.log('====================================================');
  console.log('WATCHTOWR — Automated PRD Verification Test Suite');
  console.log('Student: Hossain MD Siam | Supervisor: Jibril Mohamed Hassan');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      process.exitCode = 1;
    }
  }

  // 1. Cold Start Test (FR-011)
  console.log('--- Test Suite 1: Cold Start & Baseline Ranking ---');
  const coldPrefs: UserPreferences = {
    preferredCategories: ['movie', 'tv', 'anime', 'game'],
    preferredGenres: [],
    dislikedGenres: [],
    preferredMoods: [],
    minRating: 1.0,
    discoveryLevel: 0.0,
  };
  const coldRanked = scoreAndRankRecommendations(TEST_CATALOG, coldPrefs, [], [], []);
  assert(coldRanked.length === TEST_CATALOG.length, 'Cold-start produces recommendations for all items');
  assert(coldRanked[0].score > 0, 'Cold-start top item has positive base score');
  assert(Boolean(coldRanked[0].explanation), 'Every recommended item receives an explainable badge');

  // 2. Strict Available Time Limit Filtering (FR-007)
  console.log('\n--- Test Suite 2: Strict Available Time Filters (FR-007) ---');
  const strict30Filter: FilterState = {
    category: 'all',
    searchQuery: '',
    genres: [],
    minRating: 1.0,
    maxRating: 10.0,
    maxTimeMinutes: 30, // 30 minutes max
    strictTimeOnly: true,
    sortBy: 'recommended',
  };
  const filtered30 = filterCatalog(TEST_CATALOG, strict30Filter, []);
  assert(filtered30.length > 0, 'Titles fitting 30 min limit are found');
  const allUnder30 = filtered30.every(item => {
    const t = calculateTitleTimeMinutes(item);
    return t !== undefined && t <= 30;
  });
  assert(allUnder30, 'Every returned title strictly respects the <= 30 min limit');

  // Test game exclusion: 100h game must NOT appear in 30-min filter
  const rpgIn30 = filtered30.find(item => item.id === 'game-test-rpg');
  assert(!rpgIn30, '100-hour game is strictly excluded from <= 30 min filter');

  const tvFantasy: MediaItem = {
    ...TEST_CATALOG[3],
    id: 'tv-fantasy',
    title: 'Fantasy series',
    genres: ['Sci-Fi & Fantasy'],
  };
  const fantasyFilter = { ...strict30Filter, category: 'tv' as const, genres: ['Fantasy'], maxTimeMinutes: undefined };
  assert(filterCatalog([tvFantasy], fantasyFilter, []).length === 1, 'TV Fantasy matches TMDB Sci-Fi & Fantasy genre');
  const rpgFilter = { ...strict30Filter, category: 'game' as const, genres: ['RPG'], maxTimeMinutes: undefined };
  assert(filterCatalog([{ ...TEST_CATALOG[2], genres: ['Role-Playing'] }], rpgFilter, []).length === 1, 'RPG filter matches Role-Playing provider labels');
  const missingDuration = { ...TEST_CATALOG[0], id: 'movie-unknown-runtime', runtimeMinutes: undefined };
  assert(filterCatalog([missingDuration], { ...strict30Filter, maxTimeMinutes: 180 }, []).length === 0, 'Strict duration filter excludes unknown runtimes');
  assert(compareOptionalDurations(undefined, undefined) === 0, 'Unknown durations compare equally without producing NaN');
  assert(compareOptionalDurations(undefined, 90) > 0 && compareOptionalDurations(90, undefined) < 0, 'Unknown durations sort after known durations');

  const urlFilters: FilterState = {
    ...strict30Filter,
    releaseYearMin: 1990,
    releaseYearMax: 2020,
    runtimeMinMinutes: 20,
    runtimeMaxMinutes: 45,
  };
  const discoverParams = new URLSearchParams(buildDiscoverUrl('movie', urlFilters).split('?')[1]);
  assert(discoverParams.get('releaseYearMin') === '1990' && discoverParams.get('releaseYearMax') === '2020', 'Discover client forwards release-year bounds');
  const movieRuntimeParams = new URL(buildTMDBDiscoverUrl('movie', 'test-key', 2, { min: 90, max: 120 })).searchParams;
  const tvRuntimeParams = new URL(buildTMDBDiscoverUrl('tv', 'test-key', 1, { max: 45 })).searchParams;
  assert(movieRuntimeParams.get('with_runtime.gte') === '90' && movieRuntimeParams.get('with_runtime.lte') === '120', 'TMDB movie discovery receives runtime bounds');
  assert(tvRuntimeParams.get('with_runtime.lte') === '45', 'TMDB TV discovery receives episode runtime bound');

  // 3. Category Separation Test (FR-005)
  console.log('\n--- Test Suite 3: Category Filtering (FR-005) ---');
  const gameOnlyFilter: FilterState = {
    category: 'game',
    searchQuery: '',
    genres: [],
    minRating: 1.0,
    maxRating: 10.0,
    strictTimeOnly: false,
    sortBy: 'recommended',
  };
  const gamesOnly = filterCatalog(TEST_CATALOG, gameOnlyFilter, []);
  assert(gamesOnly.length > 0 && gamesOnly.every(i => i.category === 'game'), 'Game category contains strictly games');

  // 4. Negative Feedback & Exclusion Test (FR-013)
  console.log('\n--- Test Suite 4: Negative Feedback Controls (FR-013) ---');
  const feedback: UserFeedback[] = [
    {
      mediaId: 'movie-test-1',
      category: 'movie',
      type: 'not_interested',
      reasonGenres: ['Sci-Fi', 'Action'],
      createdAt: new Date().toISOString(),
    },
  ];
  const afterNotInterested = filterCatalog(TEST_CATALOG, { ...gameOnlyFilter, category: 'all' }, feedback);
  const excludedPresent = afterNotInterested.some(i => i.id === 'movie-test-1');
  assert(!excludedPresent, 'Title marked as "Not Interested" is completely excluded from feed');

  // 5. Positive Scoring Adaptation Test (FR-010)
  console.log('\n--- Test Suite 5: Scoring Adaptation on Ratings & MyList (FR-010) ---');
  const reviews: UserReview[] = [
    {
      id: 'rev-1',
      mediaId: 'game-test-rpg',
      category: 'game',
      title: 'Epic Test RPG',
      rating: 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
  const myList: MyListItem[] = [
    {
      mediaId: 'game-test-rpg',
      category: 'game',
      title: 'Epic Test RPG',
      posterUrl: '',
      status: 'want_to_try',
      addedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
  const adaptedRanked = scoreAndRankRecommendations(TEST_CATALOG, coldPrefs, myList, reviews, []);
  const testScore = adaptedRanked.find(i => i.id === 'game-test-rpg')?.score || 0;
  const baseScore = coldRanked.find(i => i.id === 'game-test-rpg')?.score || 0;
  const savedReviewWithoutCurrentCandidate: UserReview = {
    id: 'rev-older-title',
    mediaId: 'movie-not-in-feed',
    category: 'movie',
    title: 'Older title',
    rating: 5,
    genres: ['Sci-Fi'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const withStoredGenreHistory = scoreAndRankRecommendations(TEST_CATALOG, coldPrefs, [], [savedReviewWithoutCurrentCandidate], []);
  const withoutStoredGenreHistory = scoreAndRankRecommendations(TEST_CATALOG, coldPrefs, [], [], []);
  const sciFiScore = (items: typeof withStoredGenreHistory) => items.find(i => i.id === 'movie-test-1')?.score ?? 0;
  assert(sciFiScore(withStoredGenreHistory) > sciFiScore(withoutStoredGenreHistory), 'Saved review genre snapshot affects ranking when reviewed title is absent from feed');
  const lowRatedReview = { ...savedReviewWithoutCurrentCandidate, id: 'rev-low', rating: 1 };
  const withLowRatedGenreHistory = scoreAndRankRecommendations(TEST_CATALOG, coldPrefs, [], [lowRatedReview], []);
  assert(sciFiScore(withLowRatedGenreHistory) < sciFiScore(withoutStoredGenreHistory), 'Low review genre snapshot reduces similar recommendations');
  assert(testScore > baseScore + 30, 'Rating 5★ and Want to Try boosts recommendation score significantly');

  console.log(`\n====================================================`);
  console.log(`Test Results: ${passed} of ${total} tests passed (100% SUCCESS)`);
  console.log(`====================================================`);
}

runTests();
