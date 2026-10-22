'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Gamepad2, Sparkles, Film, Tv, Loader2 } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { WatchtowrCard } from '@/components/WatchtowrCard';
import { fetchLiveCategoryFeed, CategoryFeed } from '@/lib/api-service';
import { MediaCategory, MediaItem } from '@/types';

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const [activeCategory, setActiveCategory] = useState<MediaCategory>('movie');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [feed, setFeed] = useState<CategoryFeed>({
    picksForYou: [],
    trendingNow: [],
    topRated: [],
    recentlyAdded: [],
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch live API titles whenever active category changes
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    fetchLiveCategoryFeed(activeCategory)
      .then(data => {
        if (isMounted) {
          setFeed(data);
          setIsLoading(false);
        }
      })
      .catch(err => {
        console.error('Failed to load category feed from APIs:', err);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeCategory]);

  // Hero Backdrop depending on active category
  const getHeroBackdrop = () => {
    switch (activeCategory) {
      case 'movie':
        return 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1800&q=80';
      case 'tv':
        return 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1800&q=80';
      case 'anime':
        return 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1800&q=80';
      case 'game':
        return 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1800&q=80';
    }
  };

  const filterBySearch = (items: MediaItem[]) => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(
      i => i.title.toLowerCase().includes(q) || i.genres.some(g => g.toLowerCase().includes(q))
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
            <WatchtowrCard key={item.id} item={item} variant="horizontal-banner" />
          ))}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {filtered.slice(0, 6).map(item => (
          <WatchtowrCard key={item.id} item={item} variant="vertical" />
        ))}
      </div>
    );
  };

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

      <main className="flex-1">
        {/* Hero Section */}
        <div className="relative w-full h-[380px] sm:h-[420px] flex items-center justify-center overflow-hidden border-b border-zinc-800/60">
          <img
            src={getHeroBackdrop()}
            alt="Hero Backdrop"
            className="absolute inset-0 h-full w-full object-cover object-center filter brightness-40 transition-all duration-700 ease-in-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0D11] via-[#0B0D11]/60 to-transparent" />
          <div className="absolute inset-0 bg-radial-gradient from-transparent to-[#0B0D11]/70" />

          {/* Hero Content */}
          <div className="relative z-10 mx-auto max-w-4xl px-4 text-center">
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-2.5">
              What are you in the mood for?
            </h1>
            <p className="text-sm sm:text-base text-zinc-300 font-normal mb-8 max-w-xl mx-auto">
              Discover games, anime, and movies matched exactly to your emotional state.
            </p>

            {/* Category Selector Pills */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              {[
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
                    className={`flex items-center gap-2 rounded-full px-5 py-2 text-xs sm:text-sm font-semibold transition-all duration-200 ${
                      isActive
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
          </div>
        </div>

        {/* Catalog Rows Container */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 space-y-12">
          {/* Section 1: Picks for You */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-bold text-white tracking-tight">Picks for You</h2>
                <span className="rounded-full bg-zinc-900 border border-zinc-800 px-2.5 py-0.5 text-[10px] font-semibold text-zinc-300">
                  Live API
                </span>
              </div>
              <Link
                href={`/discover?cat=${activeCategory}`}
                className="text-xs text-rose-500 hover:text-rose-400 font-medium transition-colors"
              >
                See All
              </Link>
            </div>
            {renderCardGrid(feed.picksForYou, 'vertical')}
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
                href={`/discover?cat=${activeCategory}`}
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
                href={`/discover?cat=${activeCategory}`}
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
                href={`/discover?cat=${activeCategory}`}
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
    </div>
  );
}
