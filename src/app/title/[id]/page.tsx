'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Star,
  Clock,
  Shield,
  Bookmark,
  BookmarkCheck,
  ArrowLeft,
  X,
  Loader2,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { WatchtowrCard } from '@/components/WatchtowrCard';
import { fetchLiveDetails, fetchLiveCategoryFeed } from '@/lib/api-service';
import { MediaItem } from '@/types';
import { DetailedReview } from '@/lib/mock-data';
import {
  getStoredMyList,
  updateMyListItem,
  getStoredReviews,
  saveStoredReview,
} from '@/lib/storage';
import { useHydrated } from '@/lib/use-hydrated';

interface TitlePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function TitleDetailPage({ params }: TitlePageProps) {
  const hydrated = useHydrated();
  const resolvedParams = use(params);
  const mediaId = resolvedParams.id;

  const [item, setItem] = useState<MediaItem | null>(null);
  const [similarTitles, setSimilarTitles] = useState<MediaItem[]>([]);
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const isLoading = loadedId !== mediaId;
  const [isSaved, setIsSaved] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [userRating, setUserRating] = useState<number>(5);
  const [reviewText, setReviewText] = useState(
    'Incredible atmosphere, great pacing, and intense storytelling. Definitely one of the best in its genre.'
  );

  const [reviewsList, setReviewsList] = useState<DetailedReview[]>([
    {
      username: 'aeris_clouds',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
      rating: 5.0,
      text: 'The atmosphere is incredible. The pacing and character development keep things genuinely thrilling throughout.',
    },
    {
      username: 'retroQuest',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
      rating: 4.0,
      text: 'Really enjoyed the balance between action and story. Highly recommended.',
    },
  ]);

  // Fetch real title details from API by ID
  useEffect(() => {
    let isMounted = true;
    fetchLiveDetails(mediaId)
      .then(data => {
        if (!isMounted) return;
        setItem(data);
        if (data) {
          // ✅ Check if already saved in MyList (from localStorage)
          const myList = getStoredMyList();
          setIsSaved(myList.some(m => m.mediaId === mediaId));

          // ✅ Load persisted user reviews for this title
          const storedReviews = getStoredReviews();
          const myReview = storedReviews.find(r => r.mediaId === mediaId);
          if (myReview) {
            setUserRating(myReview.rating);
            setReviewText(myReview.reviewText || '');
            // Add "your" review to the top of reviewsList
            setReviewsList(prev => [
              {
                username: 'you',
                avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
                rating: myReview.rating,
                text: myReview.reviewText || '',
              },
              ...prev.filter(r => r.username !== 'you'),
            ]);
          }

          // Fetch similar titles from the same category
          fetchLiveCategoryFeed(data.category).then(feed => {
            if (isMounted) {
              setSimilarTitles(feed.trendingNow.filter(t => t.id !== data.id).slice(0, 6));
            }
          });
        }
        setLoadedId(mediaId);
      })
      .catch(err => {
        console.error('Failed to fetch title detail:', err);
        if (isMounted) {
          setItem(null);
          setLoadedId(mediaId);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [mediaId]);

  // ✅ Persist review to localStorage and update local UI list
  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewText.trim() || !item) return;

    saveStoredReview(mediaId, item.category, item.title, userRating, reviewText);

    setReviewsList(prev => [
      {
        username: 'you',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
        rating: userRating,
        text: reviewText,
      },
      ...prev.filter(r => r.username !== 'you'),
    ]);

    setIsReviewModalOpen(false);
  };

  // ✅ Toggle MyList save/unsave with localStorage persistence
  const handleToggleMyList = () => {
    if (!item) return;
    if (isSaved) {
      updateMyListItem(item.id, item.category, item.title, item.posterUrl, null);
      setIsSaved(false);
    } else {
      updateMyListItem(item.id, item.category, item.title, item.posterUrl, 'want_to_try', item.externalRating);
      setIsSaved(true);
    }
  };

  if (!hydrated || isLoading) {
    return (
      <div
        className="min-h-screen bg-[#0B0D11] text-zinc-100 flex flex-col font-sans"
        suppressHydrationWarning
      >
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center py-32 space-y-3">
          <Loader2 className="h-8 w-8 text-rose-500 animate-spin" />
          <p className="text-xs text-zinc-400">Loading title details from API...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!item) {
    return (
      <div
        className="min-h-screen bg-[#0B0D11] text-zinc-100 flex flex-col font-sans"
        suppressHydrationWarning
      >
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center py-32 space-y-4">
          <h2 className="text-lg font-bold text-white">Title not found</h2>
          <Link href="/discover" className="rounded-xl bg-[#BE123C] px-4 py-2 text-xs font-bold text-white">
            Return to Discover
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#0B0D11] text-zinc-100 flex flex-col font-sans selection:bg-[#BE123C] selection:text-white"
      suppressHydrationWarning
    >
      {/* Top Navbar */}
      <Navbar />

      <main className="flex-1 pb-16">
        {/* Full-Width Cinematic Banner */}
        <div className="relative w-full h-[360px] sm:h-[460px] bg-black overflow-hidden border-b border-zinc-800/60">
          <Image
            src={item.bannerUrl || item.posterUrl}
            alt={item.title}
            fill
            priority
            sizes="100vw"
            className="object-cover object-top opacity-60 filter brightness-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0D11] via-[#0B0D11]/30 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B0D11]/90 via-transparent to-transparent" />

          {/* Banner Title overlay */}
          <div className="absolute bottom-8 left-4 sm:left-12 max-w-xl">
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight drop-shadow-2xl font-serif">
              {item.title}
            </h1>
          </div>
        </div>

        {/* 2-Column Detail Layout */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Left 2 Columns: Title Info, Synopsis, Metadata */}
            <div className="lg:col-span-2 space-y-6">
              {/* Title & Tags */}
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {item.title}
                </h2>

                {/* Genre & Platform Badges */}
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  {item.genres.map(g => (
                    <span
                      key={g}
                      className="rounded-md bg-zinc-800/80 px-2.5 py-0.5 text-xs font-medium text-zinc-300"
                    >
                      {g}
                    </span>
                  ))}
                  {item.gamePlatforms && (
                    <span className="rounded-md border border-amber-500/80 bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-300">
                      {item.gamePlatforms.join(' / ')}
                    </span>
                  )}
                </div>

                {/* Meta details row: Stars, Playtime/Duration, Mood */}
                <div className="mt-3.5 flex flex-wrap items-center gap-3 text-xs text-zinc-400">
                  <div className="flex items-center gap-1 text-[#FACC15] font-bold">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star
                          key={s}
                          className={`h-3.5 w-3.5 ${
                            s <= Math.floor(item.externalRating)
                              ? 'fill-[#FACC15] text-[#FACC15]'
                              : 'text-zinc-600'
                          }`}
                        />
                      ))}
                    </div>
                    <span>{item.externalRating.toFixed(1)}</span>
                  </div>

                  <span className="text-zinc-600">|</span>

                  <div className="flex items-center gap-1 text-zinc-300 font-medium">
                    <Clock className="h-3.5 w-3.5 text-zinc-400" />
                    <span>
                      {item.category === 'game'
                        ? `${item.gamePlaytimeHours || 25}h Playtime`
                        : item.runtimeMinutes
                        ? `${item.runtimeMinutes}m Duration`
                        : `${item.episodeCount || 12} Episodes`}
                    </span>
                  </div>

                  <span className="text-zinc-600">|</span>

                  <div className="flex items-center gap-1 text-zinc-300 font-medium">
                    <Shield className="h-3.5 w-3.5 text-rose-400" />
                    <span>{item.moods[0] || 'Intense/Thrilling'}</span>
                  </div>
                </div>
              </div>

              {/* Synopsis */}
              <div className="space-y-2 pt-2">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Synopsis
                </h3>
                <p className="text-sm text-zinc-300 leading-relaxed font-normal">
                  {item.synopsis}
                </p>
              </div>

              {/* Metadata Table */}
              <div className="space-y-3 pt-2">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Metadata
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between max-w-md py-1 border-b border-zinc-800/60">
                    <span className="text-zinc-400">
                      {item.category === 'game' ? 'Developer' : 'Creator / Studio'}
                    </span>
                    <span className="text-zinc-200 font-semibold">
                      {item.developerOrDirector || 'Official Release'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between max-w-md py-1 border-b border-zinc-800/60">
                    <span className="text-zinc-400">Release Date</span>
                    <span className="text-zinc-200 font-semibold">
                      {item.releaseDate || item.releaseYear || '2024'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Actions & User Reviews */}
            <div className="space-y-6">
              {/* Add to MyList Button */}
              <button
                onClick={handleToggleMyList}
                className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all shadow-lg ${
                  isSaved
                    ? 'bg-emerald-700 text-white shadow-emerald-950/60'
                    : 'bg-[#BE123C] text-white hover:bg-rose-700 shadow-rose-950/60'
                }`}
              >
                {isSaved ? (
                  <>
                    <BookmarkCheck className="h-4 w-4" />
                    <span>Saved in MyList</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="h-4 w-4" />
                    <span>Add to MyList</span>
                  </>
                )}
              </button>

              {/* User Reviews Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white tracking-tight">
                  User Reviews
                </h3>

                <div className="space-y-3">
                  {reviewsList.map((rev, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-zinc-800/80 bg-[#14171F] p-3.5 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Image
                            src={rev.avatarUrl}
                            alt={rev.username}
                            width={24}
                            height={24}
                            className="h-6 w-6 rounded-full object-cover border border-zinc-700"
                          />
                          <span className="text-xs font-semibold text-zinc-200">{rev.username}</span>
                        </div>
                        <div className="flex items-center gap-0.5 text-xs text-[#FACC15]">
                          <Star className="h-3 w-3 fill-[#FACC15]" />
                          <span className="font-bold text-[11px]">{rev.rating.toFixed(1)}</span>
                        </div>
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed font-normal">
                        {rev.text}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Write a Review Button */}
                <button
                  onClick={() => setIsReviewModalOpen(true)}
                  className="w-full rounded-xl border border-rose-900/60 bg-transparent py-2.5 text-xs font-bold text-rose-400 hover:bg-rose-950/30 hover:border-rose-700 transition-colors"
                >
                  Write a Review
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Section: You Might Also Like */}
          {similarTitles.length > 0 && (
            <div className="mt-14 pt-8 border-t border-zinc-800/80">
              <h3 className="text-base font-bold text-white tracking-tight mb-5">
                You Might Also Like
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {similarTitles.map(sim => (
                  <WatchtowrCard key={sim.id} item={sim} variant="vertical" />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Rate & Review Modal (Matching user's screenshot exactly!) */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl border border-zinc-800 bg-[#161922] p-6 shadow-2xl space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setIsReviewModalOpen(false)}
                className="flex items-center gap-1.5 text-xs font-bold text-zinc-300 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Review & Rate</span>
              </button>
              <button
                onClick={() => setIsReviewModalOpen(false)}
                className="text-zinc-500 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Selected Title Preview Box */}
            <div className="flex items-center gap-3.5 rounded-xl bg-[#0B0D11] p-3 border border-zinc-800/80">
              <Image
                src={item.posterUrl}
                alt={item.title}
                width={44}
                height={56}
                className="h-14 w-11 rounded-lg object-cover border border-zinc-800 shrink-0"
              />
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-white truncate">{item.title}</h4>
                <p className="text-xs text-zinc-400 mt-0.5 truncate">{item.genres.join(' / ')}</p>
              </div>
            </div>

            {/* Interactive Stars */}
            <div className="text-center space-y-2">
              <span className="text-[10px] font-bold tracking-widest uppercase text-zinc-400 block">
                TAP TO RATE
              </span>
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setUserRating(star)}
                    className="p-1 hover:scale-125 transition-transform"
                  >
                    <Star
                      className={`h-7 w-7 ${
                        star <= userRating
                          ? 'fill-[#FACC15] text-[#FACC15]'
                          : 'text-zinc-600'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Review Textarea */}
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold text-zinc-400">
                  <label>YOUR REVIEW</label>
                  <span className="text-[11px] text-zinc-500">{reviewText.length} / 200</span>
                </div>
                <textarea
                  value={reviewText}
                  maxLength={200}
                  onChange={e => setReviewText(e.target.value)}
                  placeholder="Share your thoughts on this title..."
                  className="w-full rounded-xl border border-zinc-800 bg-[#0B0D11] p-3 text-xs text-zinc-200 placeholder-zinc-500 focus:border-zinc-700 focus:outline-none"
                  rows={4}
                />
              </div>

              {/* Submit Review Button */}
              <button
                type="submit"
                className="w-full rounded-xl bg-[#BE123C] py-3 text-xs font-bold text-white hover:bg-rose-700 transition-colors shadow-lg shadow-rose-950/60"
              >
                Submit Review
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Global Footer */}
      <Footer />
    </div>
  );
}
