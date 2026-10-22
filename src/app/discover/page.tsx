'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { WatchtowrCard } from '@/components/WatchtowrCard';
import { fetchTrendingMovies } from '@/lib/tmdb';
import { fetchTrendingTV } from '@/lib/tmdb';
import { fetchTrendingAnime } from '@/lib/anilist';
import { fetchTrendingGames } from '@/lib/rawg';
import { MediaCategory, MediaItem } from '@/types';
import { ChevronDown, Loader2 } from 'lucide-react';

function DiscoverContent() {
  const [mounted, setMounted] = useState(false);
  const searchParams = useSearchParams();
  const initialCat = (searchParams.get('cat') as MediaCategory) || 'movie';

  useEffect(() => {
    setMounted(true);
  }, []);

  const [activeCategory, setActiveCategory] = useState<MediaCategory>(
    ['movie', 'tv', 'anime', 'game'].includes(initialCat) ? initialCat : 'movie'
  );
  const [catalog, setCatalog] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(2);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [selectedRuntime, setSelectedRuntime] = useState<string | null>(null);
  const [selectedRating, setSelectedRating] = useState<string>('Any');
  const [sortBy] = useState('Relevance');

  // Load live data from the API corresponding to activeCategory (Loads 2 full pages on initial load)
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setPage(2);
    setHasMore(true);

    async function loadCategoryData() {
      let items: MediaItem[] = [];
      try {
        switch (activeCategory) {
          case 'movie': {
            const [p1, p2] = await Promise.all([
              fetchTrendingMovies(1, 20),
              fetchTrendingMovies(2, 20),
            ]);
            items = [...p1, ...p2];
            break;
          }
          case 'tv': {
            const [p1, p2] = await Promise.all([
              fetchTrendingTV(1, 20),
              fetchTrendingTV(2, 20),
            ]);
            items = [...p1, ...p2];
            break;
          }
          case 'anime': {
            const [p1, p2] = await Promise.all([
              fetchTrendingAnime(1, 24),
              fetchTrendingAnime(2, 24),
            ]);
            items = [...p1, ...p2];
            break;
          }
          case 'game': {
            const [p1, p2] = await Promise.all([
              fetchTrendingGames(1, 24),
              fetchTrendingGames(2, 24),
            ]);
            items = [...p1, ...p2];
            break;
          }
        }
        if (isMounted) {
          const seen = new Set<string>();
          const uniqueItems = items.filter(it => {
            if (seen.has(it.id)) return false;
            seen.add(it.id);
            return true;
          });
          setCatalog(uniqueItems);
          setIsLoading(false);
        }
      } catch (e) {
        console.error('Discover live fetch error:', e);
        if (isMounted) setIsLoading(false);
      }
    }

    loadCategoryData();

    return () => {
      isMounted = false;
    };
  }, [activeCategory]);

  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    const nextPage = page + 1;

    try {
      let newItems: MediaItem[] = [];
      switch (activeCategory) {
        case 'movie':
          newItems = await fetchTrendingMovies(nextPage, 20);
          break;
        case 'tv':
          newItems = await fetchTrendingTV(nextPage, 20);
          break;
        case 'anime':
          newItems = await fetchTrendingAnime(nextPage, 24);
          break;
        case 'game':
          newItems = await fetchTrendingGames(nextPage, 24);
          break;
      }

      if (newItems.length === 0) {
        setHasMore(false);
      } else {
        setCatalog(prev => {
          const seen = new Set(prev.map(i => i.id));
          const fresh = newItems.filter(i => !seen.has(i.id));
          return [...prev, ...fresh];
        });
        setPage(nextPage);
      }
    } catch (e) {
      console.error('Failed to load more titles:', e);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Filter definition matrix per category (matching the user's design screenshots)
  const categoryFilters = useMemo(() => {
    switch (activeCategory) {
      case 'movie':
        return {
          title: 'Filters (Movies)',
          genres: ['Action', 'Romance', 'Thriller', 'Horror', 'Comedy', 'Sci-Fi', 'Documentary', 'Animation', 'Drama', 'Fantasy'],
          moods: ['Relaxed', 'Emotional', 'Thrilling', 'Feel-Good'],
          runtimeOptions: ['Under 1h30m', '1h30m–2hrs', 'Over 2hrs'],
          platforms: ['Netflix', 'Disney+', 'Prime Video', 'Cinema'],
          ratings: ['4.5+', '4.0+', '3.5+', 'Any'],
          decades: ['2020s', '2010s', '2000s', 'Classic'],
        };
      case 'tv':
        return {
          title: 'Filters (TV Shows)',
          genres: ['Drama', 'Mystery', 'Thriller', 'Sci-Fi', 'Crime', 'Fantasy', 'Comedy', 'Romance', 'Reality', 'Documentary'],
          moods: ['Relaxed', 'Gripping', 'Feel-Good', 'Dark'],
          episodeLengths: ['Under 20min', '20–45min', '45min+'],
          episodeCounts: ['Mini 1–6', 'Short 7–13', 'Medium 14–30', 'Long 30+'],
          platforms: ['Netflix', 'Disney+', 'HBO', 'Prime Video'],
          ratings: ['4.5+', '4.0+', '3.5+', 'Any'],
          networks: ['HBO', 'AMC', 'FX', 'Apple TV+', 'Showtime'],
        };
      case 'anime':
        return {
          title: 'Filters (Anime)',
          genres: ['Action', 'Romance', 'Mystery', 'Isekai', 'Fantasy', 'Slice of Life', 'Horror', 'Sci-Fi', 'Sports', 'Comedy'],
          moods: ['Relaxed', 'Emotional', 'Hype', 'Chill'],
          episodeCounts: ['Under 13', '13–26', '26–50', '50–100', '100+'],
          ratings: ['4.5+', '4.0+', '3.5+', 'Any'],
          studios: ['MAPPA', 'Ufotable', 'Bones', 'Wit Studio', 'A-1 Pictures', 'Madhouse'],
          statuses: ['Completed', 'Ongoing'],
        };
      case 'game':
        return {
          title: 'Filters (Games)',
          genres: ['Action', 'RPG', 'Mystery', 'Horror', 'Puzzle', 'Adventure', 'Strategy', 'Simulation', 'Fighting', 'Sports'],
          moods: ['Relaxed', 'Intense', 'Competitive', 'Chill'],
          gameLengths: ['Under 5hrs', '5–15hrs', '15–30hrs', '30–60hrs', '60hrs+'],
          platforms: ['PC', 'PS5', 'Xbox', 'Nintendo Switch', 'Mobile'],
          ratings: ['4.5+', '4.0+', '3.5+', 'Any'],
          artStyles: ['Pixel Art', 'Realistic', 'Anime-style', 'Stylized', 'Low-poly'],
        };
    }
  }, [activeCategory]);

  const toggleFilter = (list: string[], setList: (v: string[]) => void, item: string) => {
    if (list.includes(item)) {
      setList(list.filter(x => x !== item));
    } else {
      setList([...list, item]);
    }
  };

  // Filter items matching active category and checkboxes
  const filteredMatches = useMemo(() => {
    return catalog.filter(item => {
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchGenre = item.genres.some(g => g.toLowerCase().includes(q));
        if (!matchTitle && !matchGenre) return false;
      }

      if (selectedGenres.length > 0) {
        const hasGenre = selectedGenres.some(g =>
          item.genres.some(itemG => itemG.toLowerCase().includes(g.toLowerCase()))
        );
        if (!hasGenre) return false;
      }

      if (selectedRating === '4.5+' && item.externalRating < 4.5) return false;
      if (selectedRating === '4.0+' && item.externalRating < 4.0) return false;
      if (selectedRating === '3.5+' && item.externalRating < 3.5) return false;

      return true;
    });
  }, [catalog, searchQuery, selectedGenres, selectedRating]);

  if (!mounted) {
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
                  setActiveCategory(cat.id);
                  setSelectedGenres([]);
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

            {activeCategory === 'tv' && categoryFilters.episodeLengths && (
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
                        className="h-3.5 w-3.5 rounded border-zinc-700 bg-zinc-900 text-[#BE123C] focus:ring-0 accent-[#BE123C] cursor-pointer"
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
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
                Showing {filteredMatches.length} matches
              </h3>
              <div className="flex items-center gap-1.5 text-xs text-zinc-400 cursor-pointer hover:text-white">
                <span>Sorted by {sortBy}</span>
                <ChevronDown className="h-3.5 w-3.5" />
              </div>
            </div>

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
            ) : filteredMatches.length === 0 ? (
              <div className="py-20 text-center">
                <p className="text-sm font-semibold text-zinc-300">No titles match the selected filters.</p>
                <button
                  onClick={() => {
                    setSelectedGenres([]);
                    setSelectedMoods([]);
                    setSelectedRating('Any');
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
                    <WatchtowrCard key={item.id} item={item} variant="vertical" />
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
                      Showing {filteredMatches.length} titles from live API
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
