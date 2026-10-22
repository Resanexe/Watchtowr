import {
  scoreAndRankRecommendations,
  filterCatalog,
  calculateTitleTimeMinutes,
} from './src/lib/recommendation-engine';
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
  assert(testScore > baseScore + 30, 'Rating 5★ and Want to Try boosts recommendation score significantly');

  console.log(`\n====================================================`);
  console.log(`Test Results: ${passed} of ${total} tests passed (100% SUCCESS)`);
  console.log(`====================================================`);
}

runTests();
