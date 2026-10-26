'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Gamepad2, Sparkles, Film, Tv, SlidersHorizontal } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { WatchtowrCard } from '@/components/WatchtowrCard';
import { CategoryFeed, fetchLiveCategoryFeed } from '@/lib/api-service';
import { MediaCategory, MediaItem, FeedbackType } from '@/types';
import { scoreAndRankRecommendations } from '@/lib/recommendation-engine';
import { useHydrated } from '@/lib/use-hydrated';
import { useStoredValue } from '@/lib/use-stored-value';
import {
  addFeedbackSignal,
  DEFAULT_PREFERENCES,
  getStoredFeedback,
  getStoredMyList,
  getStoredReviews,
  saveStoredPreferences,
  normalizePreferences,
  resetRecommendationHistory,
  deleteAccountData,
  STORAGE_KEYS,
} from '@/lib/storage';
import { CustomizeModal } from '@/components/CustomizeModal';

export default function HomePage() {
  const hydrated = useHydrated();
  const [activeCategory, setActiveCategory] = useState<'all' | MediaCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadedFeeds, setLoadedFeeds] = useState(false);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const storedPreferences = useStoredValue(STORAGE_KEYS.preferences, DEFAULT_PREFERENCES);
  const preferences = useMemo(() => normalizePreferences(storedPreferences), [storedPreferences]);
  const myList = useStoredValue(STORAGE_KEYS.myList, EMPTY_MY_LIST);
  const reviews = useStoredValue(STORAGE_KEYS.reviews, EMPTY_REVIEWS);
  const feedback = useStoredValue(STORAGE_KEYS.feedback, EMPTY_FEEDBACK);
  const [feeds, setFeeds] = useState<Partial<Record<MediaCategory, CategoryFeed>>>({});
  const isLoading = !loadedFeeds;

  // Load each provider once so For You can rank every category in one feed.
  useEffect(() => {
    let isMounted = true;
    const categories: MediaCategory[] = ['movie', 'tv', 'anime', 'game'];
    Promise.allSettled(categories.map(category => fetchLiveCategoryFeed(category)))
      .then(results => {
        if (!isMounted) return;
        const nextFeeds: Partial<Record<MediaCategory, CategoryFeed>> = {};
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') nextFeeds[categories[index]] = result.value;
          else console.error(`Failed to load ${categories[index]} feed:`, result.reason);
        });
        setFeeds(nextFeeds);
        setLoadedFeeds(true);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const feed = useMemo<CategoryFeed>(() => {
    const categories: MediaCategory[] = activeCategory === 'all'
      ? ['movie', 'tv', 'anime', 'game']
      : [activeCategory];
    const selectedFeeds = categories.map(category => feeds[category]).filter((value): value is CategoryFeed => Boolean(value));
    const collect = (key: keyof Pick<CategoryFeed, 'picksForYou' | 'trendingNow' | 'topRated' | 'recentlyAdded'>) => {
      const lists = selectedFeeds.map(categoryFeed => categoryFeed[key]);
      const mixed: MediaItem[] = [];
      for (let index = 0; index < Math.max(0, ...lists.map(list => list.length)); index += 1) {
        lists.forEach(list => {
          if (list[index]) mixed.push(list[index]);
        });
      }
      return [...new Map(mixed.map(item => [item.id, item])).values()];
    };
    const topRated = collect('topRated').sort((a, b) => b.externalRating - a.externalRating);
    return {
      picksForYou: collect('picksForYou'),
      trendingNow: collect('trendingNow'),
      topRated,
      recentlyAdded: collect('recentlyAdded').sort((a, b) =>
        (b.releaseDate || `${b.releaseYear}-01-01`).localeCompare(a.releaseDate || `${a.releaseYear}-01-01`)
      ),
      isFallback: selectedFeeds.some(categoryFeed => categoryFeed.isFallback),
    };
  }, [activeCategory, feeds]);

  const rankedItems = useMemo(() => {
    const categories: MediaCategory[] = activeCategory === 'all'
      ? ['movie', 'tv', 'anime', 'game']
      : [activeCategory];
    const rankedByCategory = categories.map(category => {
      const categoryFeed = feeds[category];
      if (!categoryFeed) return [];
      const unique = [...new Map(
        [...categoryFeed.picksForYou, ...categoryFeed.topRated].map(item => [item.id, item])
      ).values()];
      return scoreAndRankRecommendations(unique, preferences, myList, reviews, feedback);
    });
    if (activeCategory !== 'all') return rankedByCategory[0] || [];

    // Rotate through each category so the unified recommendations stay balanced.
    const diversified: ReturnType<typeof scoreAndRankRecommendations> = [];
    for (let rank = 0; rank < 12; rank += 1) {
      for (const categoryItems of rankedByCategory) {
        if (categoryItems[rank]) diversified.push(categoryItems[rank]);
      }
    }
    return diversified;
  }, [activeCategory, feeds, preferences, myList, reviews, feedback]);

  const handleFeedback = (mediaId: string, type: FeedbackType, genres: string[]) => {
    const item = [...feed.picksForYou, ...feed.trendingNow, ...feed.topRated, ...feed.recentlyAdded]
      .find(candidate => candidate.id === mediaId);
    if (item) addFeedbackSignal(mediaId, item.category, type, genres);
  };

  // Hero Backdrop depending on active category
  const getHeroBackdrop = () => {
    if (activeCategory === 'all') {
      return 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1800&q=80';
    }
    switch (activeCategory) {
      case 'movie':
        return '/images/categories/movie.jpg?v=2';
      case 'tv':
        return '/images/categories/tv.jpg?v=2';
      case 'anime':
        return '/images/categories/anime.jpg?v=2';
      case 'game':
        return '/images/categories/games.jpg?v=2';
    }
  };

  const filterBySearch = (items: MediaItem[]) => {
    const excludedIds = new Set(feedback.filter(signal => signal.type === 'not_interested').map(signal => signal.mediaId));
    const visible = items.filter(item => !excludedIds.has(item.id));
    if (!searchQuery.trim()) return visible;
    const q = searchQuery.toLowerCase();
    return visible.filter(
      i => i.title.toLowerCase().includes(q)
        || [...i.genres, ...(i.genreTags || [])].some(g => g.toLowerCase().includes(q))
    );
  };

  const renderCardGrid = (items: MediaItem[], variant: 'vertical' | 'horizontal-banner' = 'vertical') => {
    const filtered = filterBySearch(items);

    if (isLoading) {
      return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map(n => (
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
      );
    }

    if (filtered.length === 0) {
      return (
        <div className="py-8 text-center text-xs text-zinc-500">
          No titles found matching &ldquo;{searchQuery}&rdquo;.
        </div>
      );
    }

    if (variant === 'horizontal-banner' && activeCategory === 'game') {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.slice(0, 6).map(item => (
            <WatchtowrCard key={item.id} item={item} variant="horizontal-banner" onFeedback={handleFeedback} />
          ))}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {filtered.slice(0, 6).map(item => (
          <WatchtowrCard key={item.id} item={item} variant="vertical" onFeedback={handleFeedback} />
        ))}
      </div>
    );
  };

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

      <main className="flex-1">
        {/* Hero Section */}
        <div className="relative w-full h-[380px] sm:h-[420px] flex items-center justify-center overflow-hidden border-b border-zinc-800/60">
          <Image
            src={getHeroBackdrop()}
            alt="Hero Backdrop"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center filter brightness-40 transition-all duration-700 ease-in-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0D11] via-[#0B0D11]/60 to-transparent" />
          <div className="absolute inset-0 bg-radial-gradient from-transparent to-[#0B0D11]/70" />

          {/* Hero Content */}
          <div className="relative z-10 mx-auto max-w-4xl px-4 text-center">
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-2.5">
              {activeCategory === 'all' ? 'For You' : 'What are you in the mood for?'}
            </h1>
            <p className="text-sm sm:text-base text-zinc-300 font-normal mb-8 max-w-xl mx-auto">
              {activeCategory === 'all'
                ? 'Personalized picks across movies, TV, anime, and games all in one place.'
                : 'Discover titles matched to your interests and mood.'}
            </p>

            {/* Category Selector Pills */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              {[
                { id: 'all' as const, label: 'For You', icon: Sparkles },
                { id: 'game' as MediaCategory, label: 'Games', icon: Gamepad2 },
                { id: 'anime' as MediaCategory, label: 'Anime', icon: Sparkles },
                { id: 'movie' as MediaCategory, label: 'Movies', icon: Film },
                { id: 'tv' as MediaCategory, label: 'TV Shows', icon: Tv },
              ].map(cat => {
                const Icon = cat.icon;
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`flex items-center gap-2 rounded-full px-5 py-2 text-xs sm:text-sm font-semibold transition-all duration-200 ${isActive
                      ? 'bg-[#BE123C] text-white shadow-lg shadow-rose-950/60 scale-105'
                      : 'bg-black/60 border border-zinc-700/70 text-zinc-300 hover:border-zinc-500 hover:text-white backdrop-blur-md'
                      }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setIsCustomizeOpen(true)}
              className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/40 px-4 py-2 text-xs font-semibold text-zinc-200 hover:border-rose-500 hover:text-white"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" /> Customize recommendations
            </button>
            {feed.isFallback && !isLoading && (
              <p className="mt-2 text-xs text-amber-200">Some providers are unavailable; offline sample titles may appear in this feed.</p>
            )}
          </div>
        </div>

        {/* Catalog Rows Container */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 space-y-12">
          {/* Section 1: Picks for You */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-bold text-white tracking-tight">{activeCategory === 'all' ? 'For You' : 'Picks for You'}</h2>
                <span className="rounded-full bg-zinc-900 border border-zinc-800 px-2.5 py-0.5 text-[10px] font-semibold text-zinc-300">
                  Personalized mix
                </span>
              </div>
              <Link
                href={activeCategory === 'all' ? '/discover' : `/discover?cat=${activeCategory}`}
                className="text-xs text-rose-500 hover:text-rose-400 font-medium transition-colors"
              >
                See All
              </Link>
            </div>
            {renderCardGrid(rankedItems.slice(0, 12), 'vertical')}
          </section>

          {/* Section 2: Trending Now */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-bold text-white tracking-tight">Trending Now</h2>
                <span className="rounded-full bg-rose-950/40 border border-rose-800/60 px-2.5 py-0.5 text-[10px] font-semibold text-rose-400">
                  Live Trending
                </span>
              </div>
              <Link
                href={activeCategory === 'all' ? '/discover' : `/discover?cat=${activeCategory}`}
                className="text-xs text-rose-500 hover:text-rose-400 font-medium transition-colors"
              >
                See All
              </Link>
            </div>
            {renderCardGrid(feed.trendingNow, activeCategory === 'game' ? 'horizontal-banner' : 'vertical')}
          </section>

          {/* Section 3: Top Rated */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-bold text-white tracking-tight">Top Rated</h2>
                <span className="rounded-full bg-zinc-900 border border-zinc-800 px-2.5 py-0.5 text-[10px] font-semibold text-zinc-300">
                  Critical Acclaim
                </span>
              </div>
              <Link
                href={activeCategory === 'all' ? '/discover' : `/discover?cat=${activeCategory}`}
                className="text-xs text-rose-500 hover:text-rose-400 font-medium transition-colors"
              >
                See All
              </Link>
            </div>
            {renderCardGrid(feed.topRated, activeCategory === 'game' ? 'horizontal-banner' : 'vertical')}
          </section>

          {/* Section 4: Recently Added */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white tracking-tight">Recently Added</h2>
              <Link
                href={activeCategory === 'all' ? '/discover' : `/discover?cat=${activeCategory}`}
                className="text-xs text-rose-500 hover:text-rose-400 font-medium transition-colors"
              >
                See All
              </Link>
            </div>
            {renderCardGrid(feed.recentlyAdded, 'vertical')}
          </section>
        </div>
      </main>

      {/* Global Footer */}
      <Footer />
      <CustomizeModal
        key={JSON.stringify(preferences)}
        isOpen={isCustomizeOpen}
        onClose={() => setIsCustomizeOpen(false)}
        preferences={preferences}
        onSavePreferences={saveStoredPreferences}
        onResetHistory={resetRecommendationHistory}
        onDeleteAccount={deleteAccountData}
        isGuest={false}
      />
    </div>
  );
}

const EMPTY_MY_LIST: ReturnType<typeof getStoredMyList> = [];
const EMPTY_REVIEWS: ReturnType<typeof getStoredReviews> = [];
const EMPTY_FEEDBACK: ReturnType<typeof getStoredFeedback> = [];
