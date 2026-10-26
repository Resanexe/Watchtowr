'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, Search } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { WatchtowrCard } from '@/components/WatchtowrCard';
import { fetchGlobalSearch, GlobalSearchPage } from '@/lib/api-service';
import { MediaCategory, MediaItem } from '@/types';

type SearchCategory = MediaCategory | 'all';

const CATEGORY_LABELS: Record<SearchCategory, string> = {
  all: 'All',
  movie: 'Movies',
  tv: 'TV Shows',
  anime: 'Anime',
  game: 'Games',
};

function SearchContent() {
  const searchParams = useSearchParams();
  const query = (searchParams.get('q') || '').trim();
  const [searchInput, setSearchInput] = useState(query);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [unavailableCategories, setUnavailableCategories] = useState<MediaCategory[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(query));
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [activeCategory, setActiveCategory] = useState<SearchCategory>('all');

  useEffect(() => setSearchInput(query), [query]);

  useEffect(() => {
    const controller = new AbortController();
    setItems([]);
    setPage(1);
    setHasMore(false);
    setUnavailableCategories([]);
    setLoadError(false);

    if (!query) {
      setIsLoading(false);
      return () => controller.abort();
    }

    setIsLoading(true);
    fetchGlobalSearch(query, 1)
      .then((result: GlobalSearchPage) => {
        if (controller.signal.aborted) return;
        setItems(result.items);
        setPage(result.page);
        setHasMore(result.hasMore);
        setUnavailableCategories(result.unavailableCategories);
      })
      .catch(error => {
        if (controller.signal.aborted) return;
        console.error('Global catalog search failed:', error);
        setLoadError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [query]);

  const visibleItems = useMemo(
    () => activeCategory === 'all' ? items : items.filter(item => item.category === activeCategory),
    [activeCategory, items],
  );

  const loadMore = async () => {
    if (isLoadingMore || !hasMore || !query) return;
    setIsLoadingMore(true);
    try {
      const result = await fetchGlobalSearch(query, page + 1);
      setItems(current => [...new Map([...current, ...result.items].map(item => [item.id, item])).values()]);
      setPage(result.page);
      setHasMore(result.hasMore);
      setUnavailableCategories(current => [...new Set([...current, ...result.unavailableCategories])]);
    } catch (error) {
      console.error('Failed to load more global search results:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0D11] text-zinc-100 flex flex-col font-sans">
      <Navbar searchQuery={searchInput} onSearchChange={setSearchInput} />

      <main className="mx-auto w-full max-w-[1760px] flex-1 px-4 py-10 sm:px-6">
        <div className="mb-7">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-rose-400">Provider search</p>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {query ? `Results for “${query}”` : 'Search every catalog'}
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Search movies, TV shows, anime, and games directly from their source databases.
          </p>
        </div>

        {query && (
          <div className="mb-7 flex flex-wrap gap-2">
            {(Object.keys(CATEGORY_LABELS) as SearchCategory[]).map(category => {
              const selected = activeCategory === category;
              const count = category === 'all' ? items.length : items.filter(item => item.category === category).length;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  className={`rounded-full border px-4 py-2 text-xs font-semibold transition-colors ${selected
                    ? 'border-rose-700 bg-rose-700 text-white'
                    : 'border-zinc-800 bg-[#13161F] text-zinc-300 hover:border-zinc-600 hover:text-white'
                  }`}
                >
                  {CATEGORY_LABELS[category]} <span className="ml-1 opacity-70">{count}</span>
                </button>
              );
            })}
          </div>
        )}

        {isLoading ? (
          <div className="flex min-h-48 items-center justify-center gap-3 text-sm text-zinc-400">
            <Loader2 className="h-5 w-5 animate-spin text-rose-400" /> Searching provider databases…
          </div>
        ) : loadError ? (
          <div className="rounded-2xl border border-zinc-800 bg-[#13161F] py-12 text-center">
            <p className="text-sm font-semibold text-zinc-200">Search couldn’t reach the catalogs.</p>
            <p className="mt-2 text-xs text-zinc-500">Check your connection and submit the search again.</p>
          </div>
        ) : !query ? (
          <div className="rounded-2xl border border-zinc-800 bg-[#13161F] py-12 text-center text-sm text-zinc-400">
            <Search className="mx-auto mb-3 h-5 w-5 text-zinc-500" />
            Enter a title in the search bar and press Enter to search all sources.
          </div>
        ) : visibleItems.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800 bg-[#13161F] py-12 text-center">
            <p className="text-sm font-semibold text-zinc-200">No matches found for “{query}”.</p>
            <p className="mt-2 text-xs text-zinc-500">Try another title or check a different category.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-7">
              {visibleItems.map(item => (
                <div key={item.id} className="relative">
                  <span className="absolute left-3 top-3 z-10 rounded bg-black/80 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-white">
                    {CATEGORY_LABELS[item.category]}
                  </span>
                  <WatchtowrCard item={item} />
                </div>
              ))}
            </div>
            {hasMore && (
              <div className="mt-10 flex justify-center">
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={isLoadingMore}
                  className="inline-flex items-center gap-2 rounded-full bg-[#13161F] px-6 py-3 text-xs font-semibold text-zinc-200 border border-zinc-700/60 transition-colors hover:border-rose-700 hover:bg-rose-700 disabled:opacity-50"
                >
                  {isLoadingMore && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isLoadingMore ? 'Searching more results…' : 'Load more results'}
                </button>
              </div>
            )}
          </>
        )}

        {unavailableCategories.length > 0 && !isLoading && (
          <p className="mt-6 text-center text-xs text-amber-300">
            Some sources are unavailable right now: {unavailableCategories.map(category => CATEGORY_LABELS[category]).join(', ')}.
          </p>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0B0D11] text-zinc-400 flex items-center justify-center">Loading search…</div>}>
      <SearchContent />
    </Suspense>
  );
}
