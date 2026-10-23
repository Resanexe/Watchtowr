'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { WatchtowrCard } from '@/components/WatchtowrCard';
import { STORAGE_KEYS, updateMyListItem } from '@/lib/storage';
import { MyListItem, MediaCategory, MediaItem } from '@/types';
import { useHydrated } from '@/lib/use-hydrated';
import { useStoredValue } from '@/lib/use-stored-value';

export default function MyListPage() {
  const hydrated = useHydrated();
  const [activeTab, setActiveTab] = useState<'all' | MediaCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const myList = useStoredValue(STORAGE_KEYS.myList, EMPTY_MY_LIST);

  const handleRemove = (mediaId: string) => {
    updateMyListItem(mediaId, 'movie', '', '', null);
  };

  const filteredItems = myList.filter(item => {
    if (activeTab !== 'all' && item.category !== activeTab) return false;
    if (searchQuery.trim() !== '') {
      return item.title.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

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

      {/* Sub-bar Category Pills & Counter */}
      <div className="w-full border-b border-zinc-800/60 bg-[#0F1218]/90">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {[
              { id: 'all' as const, label: 'All' },
              { id: 'game' as MediaCategory, label: 'Games' },
              { id: 'anime' as MediaCategory, label: 'Anime' },
              { id: 'movie' as MediaCategory, label: 'Movies' },
              { id: 'tv' as MediaCategory, label: 'TV Shows' },
            ].map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`rounded-full px-4 py-1 text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[#BE123C] text-white shadow-sm shadow-rose-950'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <span className="text-xs text-zinc-400 font-medium">
            {myList.length} Saved Titles
          </span>
        </div>
      </div>

      {/* Main Content Area: 5-Column Grid */}
      <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-8 flex-1">
        {filteredItems.length === 0 ? (
          <div className="py-28 text-center space-y-3">
            <h3 className="text-base font-bold text-white">Your list is empty</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              Explore live movies, TV shows, anime, and games on Home or Discover and click &ldquo;Add to MyList&rdquo; to save them here.
            </p>
            <div className="pt-2">
              <Link
                href="/discover"
                className="rounded-xl bg-[#BE123C] px-5 py-2.5 text-xs font-bold text-white hover:bg-rose-700 transition-colors shadow-lg shadow-rose-950"
              >
                Browse Live Discover Catalog
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {filteredItems.map(item => {
              const mediaItem: MediaItem = {
                id: item.mediaId,
                externalId: item.mediaId,
                category: item.category,
                title: item.title,
                synopsis: '',
                posterUrl: item.posterUrl,
                releaseYear: 2024,
                externalRating: item.externalRating ?? 4.5,
                genres: [item.category === 'tv' ? 'TV Show' : item.category.charAt(0).toUpperCase() + item.category.slice(1)],
                moods: ['Adrenaline / Thrill'],
              };
              return (
                <WatchtowrCard
                  key={item.mediaId}
                  item={mediaItem}
                  variant="mylist"
                  onRemoveFromMyList={handleRemove}
                />
              );
            })}
          </div>
        )}
      </main>

      {/* Global Footer */}
      <Footer />
    </div>
  );
}

const EMPTY_MY_LIST: MyListItem[] = [];
