'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Footer } from '@/components/Footer';
import { Navbar } from '@/components/Navbar';
import { WatchtowrCard } from '@/components/WatchtowrCard';
import { fetchHomepageSection } from '@/lib/api-service';
import { DEFAULT_PREFERENCES, normalizePreferences, STORAGE_KEYS } from '@/lib/storage';
import { useStoredValue } from '@/lib/use-stored-value';
import { scoreAndRankRecommendations } from '@/lib/recommendation-engine';
import { CatalogSection, MediaCategory, MediaItem, MyListItem, UserFeedback, UserReview } from '@/types';

type CollectionCategory = MediaCategory | 'all';

const CATEGORIES: CollectionCategory[] = ['all', 'movie', 'tv', 'anime', 'game'];
const SECTIONS: CatalogSection[] = ['picks', 'trending', 'top-rated', 'recently-added'];
const CATEGORY_LABELS: Record<CollectionCategory, string> = {
  all: 'All',
  movie: 'Movies',
  tv: 'TV Shows',
  anime: 'Anime',
  game: 'Games',
};
const SECTION_LABELS: Record<CatalogSection, string> = {
  picks: 'Picks for You',
  trending: 'Trending Now',
  'top-rated': 'Top Rated',
  'recently-added': 'Recently Added',
};
const EMPTY_MY_LIST: MyListItem[] = [];
const EMPTY_REVIEWS: UserReview[] = [];
const EMPTY_FEEDBACK: UserFeedback[] = [];
const EMPTY_ITEMS: MediaItem[] = [];

function isCategory(value: string | null): value is CollectionCategory {
  return value !== null && CATEGORIES.includes(value as CollectionCategory);
}

function isSection(value: string | null): value is CatalogSection {
  return value !== null && SECTIONS.includes(value as CatalogSection);
}

function CollectionContent() {
  const searchParams = useSearchParams();
  const requestedSection = searchParams.get('section');
  const requestedCategory = searchParams.get('category');
  const section = isSection(requestedSection) ? requestedSection : 'picks';
  const category = isCategory(requestedCategory) ? requestedCategory : 'all';
  const requestKey = `${category}:${section}`;
  const [resultState, setResultState] = useState<{
    key: string;
    items: MediaItem[];
    page: number;
    hasMore: boolean;
    isFallback: boolean;
    loadError: boolean;
  } | null>(null);
  const [loadingMoreKey, setLoadingMoreKey] = useState('');
  const [loadMoreErrorKey, setLoadMoreErrorKey] = useState('');
  const [activeFilterState, setActiveFilterState] = useState<{ key: string; category: CollectionCategory } | null>(null);
  const currentResult = resultState?.key === requestKey ? resultState : null;
  const items = currentResult?.items ?? EMPTY_ITEMS;
  const page = currentResult?.page ?? 1;
  const hasMore = currentResult?.hasMore ?? false;
  const isFallback = currentResult?.isFallback ?? false;
  const isLoading = currentResult === null;
  const loadError = currentResult?.loadError ?? false;
  const isLoadingMore = loadingMoreKey === requestKey;
  const loadMoreError = loadMoreErrorKey === requestKey;
  const activeFilter = activeFilterState?.key === requestKey ? activeFilterState.category : 'all';
  const storedPreferences = useStoredValue(STORAGE_KEYS.preferences, DEFAULT_PREFERENCES);
  const preferences = useMemo(() => normalizePreferences(storedPreferences), [storedPreferences]);
  const myList = useStoredValue(STORAGE_KEYS.myList, EMPTY_MY_LIST);
  const reviews = useStoredValue(STORAGE_KEYS.reviews, EMPTY_REVIEWS);
  const feedback = useStoredValue(STORAGE_KEYS.feedback, EMPTY_FEEDBACK);

  useEffect(() => {
    const controller = new AbortController();

    fetchHomepageSection(category, section, 1)
      .then(result => {
        if (controller.signal.aborted) return;
        setResultState({ key: requestKey, ...result, loadError: false });
      })
      .catch(error => {
        if (controller.signal.aborted) return;
        console.error('Failed to load homepage collection:', error);
        setResultState({ key: requestKey, items: [], page: 1, hasMore: false, isFallback: false, loadError: true });
      });

    return () => controller.abort();
  }, [category, requestKey, section]);

  const rankedItems = useMemo(() => {
    if (section !== 'picks') return items;
    const categories: MediaCategory[] = category === 'all'
      ? ['movie', 'tv', 'anime', 'game']
      : [category];
    const rankedByCategory = categories.map(itemCategory =>
      scoreAndRankRecommendations(
        items.filter(item => item.category === itemCategory),
        preferences,
        myList,
        reviews,
        feedback,
      )
    );
    if (category !== 'all') return rankedByCategory[0] || [];

    const diversified: MediaItem[] = [];
    for (let rank = 0; rank < Math.max(0, ...rankedByCategory.map(list => list.length)); rank += 1) {
      for (const list of rankedByCategory) {
        if (list[rank]) diversified.push(list[rank]);
      }
    }
    return diversified;
  }, [category, feedback, items, myList, preferences, reviews, section]);

  const visibleItems = useMemo(() =>
    activeFilter === 'all' ? rankedItems : rankedItems.filter(item => item.category === activeFilter),
  [activeFilter, rankedItems]);

  const loadMore = async () => {
    if (isLoadingMore || !hasMore) return;
    setLoadingMoreKey(requestKey);
    setLoadMoreErrorKey('');
    try {
      const result = await fetchHomepageSection(category, section, page + 1);
      setResultState(current => {
        if (current?.key !== requestKey) return current;
        return {
          ...current,
          items: [...new Map([...current.items, ...result.items].map(item => [item.id, item])).values()],
          page: result.page,
          hasMore: result.hasMore,
          isFallback: current.isFallback || result.isFallback,
        };
      });
    } catch (error) {
      console.error('Failed to load more homepage collection results:', error);
      setLoadMoreErrorKey(requestKey);
    } finally {
      setLoadingMoreKey(current => current === requestKey ? '' : current);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0D11] text-zinc-100 flex flex-col font-sans">
      <Navbar />
      <main className="mx-auto w-full max-w-[1760px] flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-zinc-400 transition hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to For You
        </Link>

        <div className="mb-7">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-rose-400">
            {CATEGORY_LABELS[category]} collection
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{SECTION_LABELS[section]}</h1>
          <p className="mt-2 text-sm text-zinc-400">
            {section === 'picks'
              ? 'A personalized mix ranked for your tastes.'
              : `Explore ${SECTION_LABELS[section].toLowerCase()} across ${CATEGORY_LABELS[category].toLowerCase()}.`}
          </p>
        </div>

        {category === 'all' && (
          <div className="mb-7 flex flex-wrap gap-2">
            {CATEGORIES.map(itemCategory => (
              <button
                key={itemCategory}
                type="button"
                onClick={() => setActiveFilterState({ key: requestKey, category: itemCategory })}
                className={`rounded-full border px-4 py-2 text-xs font-semibold transition-colors ${activeFilter === itemCategory
                  ? 'border-rose-700 bg-rose-700 text-white'
                  : 'border-zinc-800 bg-[#13161F] text-zinc-300 hover:border-zinc-600 hover:text-white'
                }`}
              >
                {CATEGORY_LABELS[itemCategory]}
              </button>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="flex min-h-56 items-center justify-center gap-3 text-sm text-zinc-400">
            <Loader2 className="h-5 w-5 animate-spin text-rose-400" /> Loading this collection…
          </div>
        ) : loadError ? (
          <div className="rounded-2xl border border-zinc-800 bg-[#13161F] py-12 text-center">
            <p className="text-sm font-semibold text-zinc-200">Couldn’t load this collection.</p>
            <p className="mt-2 text-xs text-zinc-500">Check your connection and try again.</p>
          </div>
        ) : visibleItems.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800 bg-[#13161F] py-12 text-center text-sm text-zinc-400">
            No titles are available in this collection right now.
          </div>
        ) : (
          <>
            {isFallback && (
              <p className="mb-4 text-xs text-amber-200">A provider is unavailable, so sample titles are shown.</p>
            )}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-7">
              {visibleItems.map(item => (
                <WatchtowrCard key={item.id} item={item} />
              ))}
            </div>
            {hasMore && (
              <div className="mt-10 flex justify-center">
                <div className="text-center">
                  <button
                    type="button"
                    onClick={loadMore}
                    disabled={isLoadingMore}
                    className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-[#13161F] px-5 py-2.5 text-xs font-semibold text-zinc-200 transition hover:border-zinc-500 hover:text-white disabled:cursor-wait disabled:opacity-60"
                  >
                    {isLoadingMore && <Loader2 className="h-4 w-4 animate-spin" />}
                    {isLoadingMore ? 'Loading more…' : 'Load more'}
                  </button>
                  {loadMoreError && <p role="alert" className="mt-2 text-xs text-rose-300">Could not load more results. Try again.</p>}
                </div>
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default function CollectionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0B0D11]" />}>
      <CollectionContent />
    </Suspense>
  );
}
