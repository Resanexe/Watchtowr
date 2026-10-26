'use client';

import React, { useState, useMemo, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { WatchtowrCard } from '@/components/WatchtowrCard';
import { fetchLiveDiscover } from '@/lib/api-service';
import { FilterState, MediaCategory, MediaItem, PresetMood, UserFeedback } from '@/types';
import { ChevronDown, Loader2 } from 'lucide-react';
import { ALL_PRESET_MOODS } from '@/lib/mock-data';
import { useHydrated } from '@/lib/use-hydrated';
import { addFeedbackSignal, STORAGE_KEYS } from '@/lib/storage';
import { useStoredValue } from '@/lib/use-stored-value';
import { compareOptionalDurations } from '@/lib/recommendation-engine';

interface CategoryFilters {
  title: string;
  genres: string[];
  moods: PresetMood[];
  runtimeOptions?: string[];
  episodeLengths?: string[];
  gameLengths?: string[];
  platforms?: string[];
}

const EMPTY_FEEDBACK: UserFeedback[] = [];

function DiscoverContent() {
  const hydrated = useHydrated();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCat = (searchParams.get('cat') as MediaCategory) || 'movie';
  const activeCategory: MediaCategory = ['movie', 'tv', 'anime', 'game'].includes(initialCat) ? initialCat : 'movie';
  const [catalog, setCatalog] = useState<MediaItem[]>([]);
  const [loadedQueryKey, setLoadedQueryKey] = useState('');
  const [isFallback, setIsFallback] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [retryToken, setRetryToken] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedMoods, setSelectedMoods] = useState<PresetMood[]>([]);
  const [selectedRuntime, setSelectedRuntime] = useState<string | null>(null);
  const [maxTimeMinutes, setMaxTimeMinutes] = useState<number | undefined>();
  const [selectedRating, setSelectedRating] = useState<string>('Any');
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [sortBy, setSortBy] = useState('Relevance');
  const feedback = useStoredValue(STORAGE_KEYS.feedback, EMPTY_FEEDBACK);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearchQuery(searchQuery.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  const runtimeRange = useMemo((): { min?: number; max?: number } => {
    if (!selectedRuntime) return {};
    if (activeCategory === 'movie') {
      if (selectedRuntime === 'Under 1h30m') return { max: 89 };
      if (selectedRuntime === '1h30m to 2h') return { min: 90, max: 120 };
      return { min: 121 };
    }
    if (activeCategory === 'game') {
      if (selectedRuntime === 'Under 5hrs') return { max: 299 };
      if (selectedRuntime === '5 to 15hrs') return { min: 300, max: 899 };
      if (selectedRuntime === '15 to 30hrs') return { min: 900, max: 1799 };
      if (selectedRuntime === '30 to 60hrs') return { min: 1800, max: 3599 };
      return { min: 3600 };
    }
    if (selectedRuntime === 'Under 20min') return { max: 19 };
    if (selectedRuntime === '20 to 45min') return { min: 20, max: 45 };
    return { min: 45 };
  }, [activeCategory, selectedRuntime]);

  const queryFilters = useMemo<FilterState>(() => ({
    category: activeCategory,
    searchQuery: debouncedSearchQuery,
    genres: selectedGenres,
    moods: selectedMoods,
    minRating: selectedRating === 'Any' ? 0 : Number(selectedRating.replace('+', '')),
    maxRating: 5,
    maxTimeMinutes,
    runtimeMinMinutes: runtimeRange.min,
    runtimeMaxMinutes: runtimeRange.max,
    strictTimeOnly: true,
    platform: selectedPlatform || undefined,
    seriesStatus: selectedStatus || undefined,
    sortBy: sortBy === 'Rating' ? 'rating'
      : sortBy === 'Newest' ? 'release'
        : sortBy === 'Title' ? 'title'
          : sortBy === 'Shortest' ? 'shortest_time' : 'recommended',
  }), [activeCategory, debouncedSearchQuery, maxTimeMinutes, runtimeRange, selectedGenres, selectedMoods, selectedPlatform, selectedRating, selectedStatus, sortBy]);
  const queryKey = JSON.stringify(queryFilters);
  const queryKeyRef = useRef(queryKey);
  const isLoading = loadedQueryKey !== queryKey;

  // Ask the server for matching titles; filtering happens across provider pages there.
  useEffect(() => {
    let isMounted = true;
    queryKeyRef.current = queryKey;
    async function loadCategoryData() {
      setCatalog([]);
      setIsFallback(false);
      setLoadError(false);
      setHasMore(false);
      setNextCursor(null);
      setLoadedQueryKey('');
      try {
        const result = await fetchLiveDiscover(activeCategory, queryFilters);
        if (isMounted) {
          setCatalog(result.items);
          setIsFallback(result.isFallback);
          setHasMore(result.hasMore);
          setNextCursor(result.nextCursor);
          setLoadedQueryKey(queryKey);
        }
      } catch (e) {
        console.error('Discover live fetch error:', e);
        if (isMounted) {
          setCatalog([]);
          setLoadError(true);
          setLoadedQueryKey(queryKey);
        }
      }
    }

    loadCategoryData();

    return () => {
      isMounted = false;
    };
  }, [activeCategory, queryFilters, queryKey, retryToken]);

  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMore || !nextCursor) return;
    const requestQueryKey = queryKey;
    setIsLoadingMore(true);

    try {
      const result = await fetchLiveDiscover(activeCategory, queryFilters, nextCursor);
      if (queryKeyRef.current !== requestQueryKey) return;

      if (result.items.length > 0) {
        setCatalog(prev => {
          const seen = new Set(prev.map(i => i.id));
          const fresh = result.items.filter(i => !seen.has(i.id));
          return [...prev, ...fresh];
        });
      }
      setIsFallback(result.isFallback);
      setHasMore(result.hasMore);
      setNextCursor(result.nextCursor);
    } catch (e) {
      console.error('Failed to load more titles:', e);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Filter definition matrix per category (matching the user's design screenshots)
  const categoryFilters = useMemo<CategoryFilters>(() => {
    switch (activeCategory) {
      case 'movie':
        return {
          title: 'Filters (Movies)',
          genres: ['Action', 'Romance', 'Thriller', 'Horror', 'Comedy', 'Sci-Fi', 'Documentary', 'Animation', 'Drama', 'Fantasy'],
          moods: ALL_PRESET_MOODS,
          runtimeOptions: ['Under 1h30m', '1h30m to 2h', 'Over 2h'],
        };
      case 'tv':
        return {
          title: 'Filters (TV Shows)',
          genres: ['Action & Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary', 'Drama', 'Family', 'Fantasy', 'Mystery', 'Reality', 'Romance', 'Sci-Fi'],
          moods: ALL_PRESET_MOODS,
          episodeLengths: ['Under 20min', '20 to 45min', '45min+'],
        };
      case 'anime':
        return {
          title: 'Filters (Anime)',
          genres: ['Action', 'Romance', 'Mystery', 'Isekai', 'Fantasy', 'Slice of Life', 'Horror', 'Sci-Fi', 'Sports', 'Comedy'],
          moods: ALL_PRESET_MOODS,
          episodeLengths: ['Under 20min', '20 to 45min', '45min+'],
        };
      case 'game':
        return {
          title: 'Filters (Games)',
          genres: ['Action', 'RPG', 'Mystery', 'Horror', 'Puzzle', 'Adventure', 'Strategy', 'Simulation', 'Fighting', 'Sports'],
          moods: ALL_PRESET_MOODS,
          gameLengths: ['Under 5hrs', '5 to 15hrs', '15 to 30hrs', '30 to 60hrs', '60hrs+'],
          platforms: ['PC', 'PlayStation 5', 'Xbox Series X/S', 'Nintendo Switch'],
        };
    }
  }, [activeCategory]);

  const toggleFilter = <T extends string>(list: T[], setList: (v: T[]) => void, item: T) => {
    if (list.includes(item)) {
      setList(list.filter(x => x !== item));
    } else {
      setList([...list, item]);
    }
  };

  // Provider filters are applied on the server before results are paginated.
  // This local step only hides titles the user marked Not Interested.
  const filteredMatches = useMemo(() => {
    const excludedIds = new Set(feedback.filter(signal => signal.type === 'not_interested').map(signal => signal.mediaId));
    const filtered = catalog.filter(item => !excludedIds.has(item.id));
    return [...filtered].sort((a, b) => {
      if (sortBy === 'Rating') return b.externalRating - a.externalRating;
      if (sortBy === 'Newest') return b.releaseYear - a.releaseYear;
      if (sortBy === 'Title') return a.title.localeCompare(b.title);
      if (sortBy === 'Shortest') {
        const runtime = (item: MediaItem): number | undefined => item.category === 'game'
          ? (item.gamePlaytimeHours === undefined ? undefined : item.gamePlaytimeHours * 60)
          : item.runtimeMinutes;
        return compareOptionalDurations(runtime(a), runtime(b));
      }
      return 0;
    });
  }, [catalog, feedback, sortBy]);

  if (!hydrated) {
    return (
      <div
        className="min-h-screen bg-[#0B0D11] text-zinc-100 flex flex-col font-sans"
        suppressHydrationWarning
      >
        <div className="flex-1 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#BE123C] border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#0B0D11] text-zinc-100 flex flex-col font-sans selection:bg-[#BE123C] selection:text-white"
      suppressHydrationWarning
    >
      {/* Top Navbar */}
      <Navbar searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      {/* Sub-bar Category Pills */}
      <div className="w-full border-b border-zinc-800/60 bg-[#0F1218]/90">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 flex items-center gap-3">
          {[
            { id: 'game' as MediaCategory, label: 'Games' },
            { id: 'anime' as MediaCategory, label: 'Anime' },
            { id: 'movie' as MediaCategory, label: 'Movies' },
            { id: 'tv' as MediaCategory, label: 'TV Shows' },
          ].map(cat => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  router.replace(`/discover?cat=${cat.id}`);
                  setHasMore(true);
                  setSelectedGenres([]);
                  setSelectedMoods([]);
                  setSelectedRuntime(null);
                  setMaxTimeMinutes(undefined);
                  setSelectedPlatform('');
                  setSelectedStatus('');
                }}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                  isActive
                    ? 'border border-[#BE123C] bg-[#BE123C]/20 text-white shadow-sm shadow-rose-950'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Discover Layout (2 Columns) */}
      <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-8 flex-1">
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-8">
          {/* Left Column: Category Sidebar Filters */}
          <aside className="md:col-span-1 border-r border-zinc-800/80 pr-6 space-y-6">
            <h2 className="text-sm font-bold text-white tracking-tight">
              {categoryFilters.title}
            </h2>

            <div className="space-y-2 pt-2 border-t border-zinc-800/60">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">AVAILABLE TIME LIMIT</h3>
              <select
                value={maxTimeMinutes ?? ''}
                onChange={event => setMaxTimeMinutes(event.target.value ? Number(event.target.value) : undefined)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-200"
              >
                <option value="">No limit</option>
                <option value="30">Up to 30 minutes</option>
                <option value="60">Up to 1 hour</option>
                <option value="120">Up to 2 hours</option>
                <option value="180">Up to 3 hours</option>
                <option value="600">Up to 10 hours</option>
              </select>
              <p className="text-[10px] text-zinc-500">Uses episode length, movie runtime, or estimated game playtime. Unknown durations are excluded.</p>
            </div>

            {/* GENRE */}
            <div className="space-y-2">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                GENRE
              </h3>
              <div className="space-y-1.5">
                {categoryFilters.genres.map(genre => {
                  const isChecked = selectedGenres.includes(genre);
                  return (
                    <label
                      key={genre}
                      className="flex items-center gap-2.5 text-xs text-zinc-300 hover:text-white cursor-pointer select-none"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleFilter(selectedGenres, setSelectedGenres, genre)}
                        className="h-3.5 w-3.5 rounded border-zinc-700 bg-zinc-900 text-[#BE123C] focus:ring-0 focus:ring-offset-0 accent-[#BE123C] cursor-pointer"
                      />
                      <span>{genre}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* MOOD */}
            {categoryFilters.moods && (
              <div className="space-y-2 pt-2 border-t border-zinc-800/60">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  MOOD
                </h3>
                <div className="space-y-1.5">
                  {categoryFilters.moods.map(mood => {
                    const isChecked = selectedMoods.includes(mood);
                    return (
                      <label
                        key={mood}
                        className="flex items-center gap-2.5 text-xs text-zinc-300 hover:text-white cursor-pointer select-none"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleFilter(selectedMoods, setSelectedMoods, mood)}
                          className="h-3.5 w-3.5 rounded border-zinc-700 bg-zinc-900 text-[#BE123C] focus:ring-0 focus:ring-offset-0 accent-[#BE123C] cursor-pointer"
                        />
                        <span>{mood}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* RUNTIME / EPISODE LENGTH / GAME LENGTH */}
            {activeCategory === 'movie' && categoryFilters.runtimeOptions && (
              <div className="space-y-2 pt-2 border-t border-zinc-800/60">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  RUNTIME
                </h3>
                <div className="space-y-1.5">
                  {categoryFilters.runtimeOptions.map(opt => (
                    <label
                      key={opt}
                      className="flex items-center gap-2.5 text-xs text-zinc-300 hover:text-white cursor-pointer select-none"
                    >
                      <input
                        type="checkbox"
                        checked={selectedRuntime === opt}
                        onChange={() => setSelectedRuntime(selectedRuntime === opt ? null : opt)}
                        className="h-3.5 w-3.5 rounded border-zinc-700 bg-zinc-900 text-[#BE123C] focus:ring-0 accent-[#BE123C] cursor-pointer"
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {(activeCategory === 'tv' || activeCategory === 'anime') && categoryFilters.episodeLengths && (
              <div className="space-y-2 pt-2 border-t border-zinc-800/60">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  EPISODE LENGTH
                </h3>
                <div className="space-y-1.5">
                  {categoryFilters.episodeLengths.map(opt => (
                    <label
                      key={opt}
                      className="flex items-center gap-2.5 text-xs text-zinc-300 hover:text-white cursor-pointer select-none"
                    >
                      <input
                        type="checkbox"
                        checked={selectedRuntime === opt}
                        onChange={() => setSelectedRuntime(selectedRuntime === opt ? null : opt)}
                        className="h-3.5 w-3.5 rounded border-zinc-700 bg-zinc-900 text-[#BE123C] focus:ring-0 accent-[#BE123C] cursor-pointer"
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {activeCategory === 'game' && categoryFilters.gameLengths && (
              <div className="space-y-2 pt-2 border-t border-zinc-800/60">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  GAME LENGTH
                </h3>
                <div className="space-y-1.5">
                  {categoryFilters.gameLengths.map(opt => (
                    <label
                      key={opt}
                      className="flex items-center gap-2.5 text-xs text-zinc-300 hover:text-white cursor-pointer select-none"
                    >
                      <input
                        type="checkbox"
                        checked={selectedRuntime === opt}
                        onChange={() => setSelectedRuntime(selectedRuntime === opt ? null : opt)}
                        className="h-3.5 w-3.5 rounded border-zinc-700 bg-zinc-900 text-[#BE123C] focus:ring-0 accent-[#BE123C] cursor-pointer"
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {activeCategory === 'game' && categoryFilters.platforms && (
              <div className="space-y-2 pt-2 border-t border-zinc-800/60">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">PLATFORM</h3>
                <select value={selectedPlatform} onChange={event => setSelectedPlatform(event.target.value)} className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-200">
                  <option value="">All platforms</option>
                  {categoryFilters.platforms.map(platform => <option key={platform} value={platform}>{platform}</option>)}
                </select>
              </div>
            )}

            {(activeCategory === 'tv' || activeCategory === 'anime') && (
              <div className="space-y-2 pt-2 border-t border-zinc-800/60">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">SERIES STATUS</h3>
                <select value={selectedStatus} onChange={event => setSelectedStatus(event.target.value)} className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-200">
                  <option value="">Any status</option>
                  <option value="Completed">Completed</option>
                  <option value="Ongoing">Ongoing</option>
                  <option value="Upcoming">Upcoming</option>
                </select>
              </div>
            )}

            {/* RATING */}
            <div className="space-y-2 pt-2 border-t border-zinc-800/60">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                RATING
              </h3>
              <div className="space-y-1.5">
                {['4.5+', '4.0+', '3.5+', 'Any'].map(ratingOpt => (
                  <label
                    key={ratingOpt}
                    className="flex items-center gap-2.5 text-xs text-zinc-300 hover:text-white cursor-pointer select-none"
                  >
                    <input
                      type="radio"
                      name="ratingFilter"
                      checked={selectedRating === ratingOpt}
                      onChange={() => setSelectedRating(ratingOpt)}
                      className="h-3.5 w-3.5 border-zinc-700 bg-zinc-900 text-[#BE123C] focus:ring-0 accent-[#BE123C] cursor-pointer"
                    />
                    <span>{ratingOpt}</span>
                  </label>
                ))}
              </div>
            </div>
          </aside>

          {/* Right Column: Results Header & 4-Column Poster Grid */}
          <section className="md:col-span-3 lg:col-span-4">
            <div className="flex items-center justify-between mb-6 pb-2 border-b border-zinc-800/60">
              <h3 className="text-sm font-bold text-white">
                Showing {filteredMatches.length} loaded matches
              </h3>
              <label className="flex items-center gap-1.5 text-xs text-zinc-400">
                Sorted by
                <select value={sortBy} onChange={event => setSortBy(event.target.value)} className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-200">
                  {['Relevance', 'Rating', 'Newest', 'Title', 'Shortest'].map(value => <option key={value}>{value}</option>)}
                </select>
              </label>
            </div>
            {isFallback && !isLoading && (
              <p className="mb-4 text-xs text-amber-200">Live providers are unavailable. Showing offline sample data.</p>
            )}

            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                  <div
                    key={n}
                    className="rounded-2xl bg-[#13161F]/80 p-2.5 border border-zinc-800/40 animate-pulse h-64 flex flex-col justify-between"
                  >
                    <div className="aspect-[2/3] w-full rounded-xl bg-zinc-800/60" />
                    <div className="space-y-1.5 mt-2">
                      <div className="h-3 w-3/4 rounded bg-zinc-800/60" />
                      <div className="h-2 w-1/2 rounded bg-zinc-800/40" />
                    </div>
                  </div>
                ))}
              </div>
            ) : loadError ? (
              <div className="py-20 text-center">
                <p className="text-sm font-semibold text-zinc-300">Couldn&apos;t load the catalog.</p>
                <p className="mt-2 text-xs text-zinc-500">Check your connection and try again.</p>
                <button
                  onClick={() => setRetryToken(value => value + 1)}
                  className="mt-4 rounded-full bg-[#BE123C] px-5 py-2 text-xs font-semibold text-white"
                >
                  Retry
                </button>
              </div>
            ) : filteredMatches.length === 0 ? (
              <div className="py-20 text-center">
                <p className="text-sm font-semibold text-zinc-300">
                  {hasMore ? 'No matches in this batch. More of the catalog is still being searched.' : 'No titles match the selected filters.'}
                </p>
                {hasMore && (
                  <button
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    className="mt-3 rounded-full bg-[#BE123C] px-5 py-2 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    {isLoadingMore ? 'Searching more titles...' : 'Continue searching'}
                  </button>
                )}
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedGenres([]);
                    setSelectedMoods([]);
                    setSelectedRating('Any');
                    setSelectedRuntime(null);
                    setMaxTimeMinutes(undefined);
                    setSelectedPlatform('');
                    setSelectedStatus('');
                  }}
                  className="mt-3 text-xs text-rose-500 hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                  {filteredMatches.map(item => (
                    <WatchtowrCard
                      key={item.id}
                      item={item}
                      variant="vertical"
                      onFeedback={(id, type, genres) => addFeedbackSignal(id, item.category, type, genres)}
                    />
                  ))}
                </div>

                {/* Load More Titles Button */}
                {hasMore && (
                  <div className="mt-12 flex flex-col items-center justify-center pb-8">
                    <button
                      onClick={handleLoadMore}
                      disabled={isLoadingMore}
                      className="group flex items-center gap-2.5 rounded-full bg-[#13161F] hover:bg-[#BE123C] text-zinc-200 hover:text-white px-7 py-3 text-xs font-semibold tracking-wide border border-zinc-700/60 hover:border-[#BE123C] transition-all shadow-lg active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      {isLoadingMore ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin text-rose-400" />
                          <span>Loading More Titles...</span>
                        </>
                      ) : (
                        <>
                          <span>Load More {activeCategory === 'movie' ? 'Movies' : activeCategory === 'tv' ? 'TV Shows' : activeCategory === 'anime' ? 'Anime' : 'Games'}</span>
                          <ChevronDown className="h-4 w-4 text-zinc-400 group-hover:text-white transition-transform group-hover:translate-y-0.5" />
                        </>
                      )}
                    </button>
                    <p className="mt-2 text-[11px] text-zinc-500">
                      {isFallback ? 'Offline sample catalog' : 'Filters search through provider pages as you load more'}
                    </p>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </main>

      {/* Global Footer */}
      <Footer />
    </div>
  );
}

export default function DiscoverPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0B0D11] text-zinc-400 flex items-center justify-center">
          Loading Discover...
        </div>
      }
    >
      <DiscoverContent />
    </Suspense>
  );
}
