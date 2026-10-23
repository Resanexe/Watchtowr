'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  X,
  Star,
  Clock,
  Calendar,
  Gamepad2,
  Film,
  Tv,
  Sparkles,
  Trash2,
  Send,
} from 'lucide-react';
import { ScoredMediaItem, MyListStatus, UserReview, MediaItem } from '@/types';
import { formatCategory } from '@/lib/utils';

interface TitleDetailModalProps {
  item: ScoredMediaItem | null;
  onClose: () => void;
  myListStatus?: MyListStatus;
  userReview?: UserReview;
  onUpdateMyList: (mediaId: string, status: MyListStatus | null) => void;
  onSaveReview: (rating: number, text?: string) => void;
  onDeleteReview: () => void;
  similarTitles: MediaItem[];
  onSelectSimilar: (item: MediaItem) => void;
  isGuest: boolean;
}

export const TitleDetailModal: React.FC<TitleDetailModalProps> = ({
  item,
  onClose,
  myListStatus,
  userReview,
  onUpdateMyList,
  onSaveReview,
  onDeleteReview,
  similarTitles,
  onSelectSimilar,
  isGuest,
}) => {
  const [ratingInput, setRatingInput] = useState<number>(userReview?.rating || 5);
  const [reviewInput, setReviewInput] = useState<string>(userReview?.reviewText || '');
  const [isEditingReview, setIsEditingReview] = useState<boolean>(!userReview);

  if (!item) return null;

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (isGuest) {
      alert('Guests cannot submit persistent reviews. Please toggle to a Registered User account in the top bar.');
      return;
    }
    onSaveReview(ratingInput, reviewInput);
    setIsEditingReview(false);
  };

  const getCategoryIcon = () => {
    switch (item.category) {
      case 'game': return <Gamepad2 className="h-4 w-4" />;
      case 'anime': return <Sparkles className="h-4 w-4" />;
      case 'movie': return <Film className="h-4 w-4" />;
      case 'tv': return <Tv className="h-4 w-4" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-3xl border border-slate-700/80 bg-slate-900 shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-slate-950/70 text-slate-300 backdrop-blur-md hover:bg-slate-800 hover:text-white transition-colors"
          title="Close dialog"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Hero Banner / Poster Header */}
        <div className="relative h-48 sm:h-64 w-full bg-slate-950">
          <Image
            src={item.bannerUrl || item.posterUrl}
            alt={item.title}
            fill
            sizes="(max-width: 768px) 100vw, 75vw"
            className="object-cover object-center opacity-40 blur-xs"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />

          {/* Floating poster and main info */}
          <div className="absolute bottom-4 left-6 right-6 flex items-end gap-5">
            <Image
              src={item.posterUrl}
              alt={item.title}
              width={96}
              height={144}
              className="h-28 w-20 sm:h-36 sm:w-24 shrink-0 rounded-xl object-cover shadow-2xl border border-slate-700"
            />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1 rounded-md bg-indigo-500/20 border border-indigo-500/30 px-2 py-0.5 text-xs font-bold text-indigo-300">
                  {getCategoryIcon()}
                  {formatCategory(item.category)}
                </span>
                <span className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-slate-950/80 px-2 py-0.5 rounded-md border border-amber-500/20">
                  <Star className="h-3.5 w-3.5 fill-amber-400" />
                  {item.externalRating.toFixed(1)} / 5
                </span>
                {item.releaseYear && (
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <Calendar className="h-3 w-3" />
                    {item.releaseYear}
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white truncate">{item.title}</h2>
              {item.tagline && (
                <p className="text-xs sm:text-sm text-slate-300 italic truncate">{item.tagline}</p>
              )}
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-2xl bg-slate-950/50 p-3 border border-slate-800 text-xs">
            {/* Time / Duration info */}
            <div>
              <span className="text-slate-400 block font-medium">Time / Length</span>
              <span className="text-slate-200 font-bold flex items-center gap-1 mt-0.5">
                <Clock className="h-3.5 w-3.5 text-indigo-400" />
                {item.category === 'game'
                  ? `${item.gamePlaytimeHours || 'Unknown'} hrs`
                  : item.runtimeMinutes
                  ? `${item.runtimeMinutes} mins`
                  : 'N/A'}
              </span>
            </div>

            {/* Episodes or Total Duration */}
            {(item.category === 'tv' || item.category === 'anime') && (
              <div>
                <span className="text-slate-400 block font-medium">Episodes</span>
                <span className="text-slate-200 font-bold mt-0.5 block">
                  {item.episodeCount ? `${item.episodeCount} eps` : 'Ongoing'}
                  {item.seasonCount ? ` (${item.seasonCount} seasons)` : ''}
                </span>
              </div>
            )}

            {/* Platform for Games */}
            {item.category === 'game' && item.gamePlatforms && (
              <div className="col-span-2">
                <span className="text-slate-400 block font-medium">Platforms</span>
                <span className="text-slate-200 font-bold mt-0.5 truncate block">
                  {item.gamePlatforms.join(', ')}
                </span>
              </div>
            )}

            {/* Creator / Director */}
            {item.developerOrDirector && (
              <div>
                <span className="text-slate-400 block font-medium">
                  {item.category === 'game' ? 'Developer' : 'Director / Creator'}
                </span>
                <span className="text-slate-200 font-bold mt-0.5 truncate block">
                  {item.developerOrDirector}
                </span>
              </div>
            )}

            {/* Language */}
            {item.contentLanguage && (
              <div>
                <span className="text-slate-400 block font-medium">Language</span>
                <span className="text-slate-200 font-bold mt-0.5 capitalize block">
                  {item.contentLanguage}
                </span>
              </div>
            )}
          </div>

          {/* Synopsis */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Synopsis</h4>
            <p className="text-sm text-slate-300 leading-relaxed">{item.synopsis}</p>
          </div>

          {/* Genres & Moods */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Genres & Moods</h4>
            <div className="flex flex-wrap gap-1.5">
              {item.genres.map(g => (
                <span key={g} className="rounded-lg bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-300">
                  {g}
                </span>
              ))}
              {item.moods.map(m => (
                <span key={m} className="rounded-lg bg-violet-950/60 border border-violet-800/40 px-2.5 py-1 text-xs font-medium text-violet-300">
                  {m}
                </span>
              ))}
            </div>
          </div>

          {/* MyList Quick Controls */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
              MyList Status (FR-014)
            </h4>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Want to try', value: 'want_to_try' as MyListStatus },
                { label: 'In progress', value: 'in_progress' as MyListStatus },
                { label: 'Completed', value: 'completed' as MyListStatus },
                { label: 'Dropped', value: 'dropped' as MyListStatus },
              ].map(statusOpt => (
                <button
                  key={statusOpt.value}
                  onClick={() => {
                    if (isGuest) {
                      alert('Guests cannot save persistent list entries. Please switch to a Registered User account in the top right.');
                      return;
                    }
                    onUpdateMyList(item.id, myListStatus === statusOpt.value ? null : statusOpt.value);
                  }}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                    myListStatus === statusOpt.value
                      ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
                  }`}
                >
                  {statusOpt.label}
                </button>
              ))}
              {myListStatus && (
                <button
                  onClick={() => onUpdateMyList(item.id, null)}
                  className="rounded-xl px-2.5 py-1.5 text-xs text-rose-400 hover:bg-rose-950/40"
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          {/* User Rating & Written Review (FR-015, FR-016) */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Your Rating & Review (FR-015, FR-016)
              </h4>
              {userReview && !isEditingReview && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsEditingReview(true)}
                    className="text-xs text-indigo-400 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={onDeleteReview}
                    className="text-xs text-rose-400 hover:underline flex items-center gap-0.5"
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </button>
                </div>
              )}
            </div>

            {userReview && !isEditingReview ? (
              <div className="space-y-2">
                <div className="flex items-center gap-1 text-amber-400">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${star <= userReview.rating ? 'fill-amber-400' : 'text-slate-600'}`}
                    />
                  ))}
                  <span className="text-xs font-bold ml-1">{userReview.rating} / 5 Stars</span>
                </div>
                {userReview.reviewText && (
                  <p className="text-xs text-slate-300 italic bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    &ldquo;{userReview.reviewText}&rdquo;
                  </p>
                )}
                <span className="text-[10px] text-slate-400 block">
                  Last updated {new Date(userReview.updatedAt).toLocaleDateString()}
                </span>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-3">
                {/* 5-Star interactive selector */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Score:</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRatingInput(star)}
                        className="p-1 transition-transform hover:scale-125"
                      >
                        <Star
                          className={`h-5 w-5 ${
                            star <= ratingInput
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-600 hover:text-amber-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <span className="text-xs font-bold text-amber-400">{ratingInput} Stars</span>
                </div>

                {/* Review Textarea */}
                <textarea
                  value={reviewInput}
                  onChange={e => setReviewInput(e.target.value)}
                  placeholder="Share your thoughts or critique on this title..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 p-3 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  rows={3}
                />

                <div className="flex items-center justify-end gap-2">
                  {userReview && (
                    <button
                      type="button"
                      onClick={() => setIsEditingReview(false)}
                      className="px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/30"
                  >
                    <Send className="h-3 w-3" />
                    Save Review
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Similar Titles (FR-017) */}
          {similarTitles.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                Similar Titles You Might Like (FR-017)
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {similarTitles.map(sim => (
                  <div
                    key={sim.id}
                    onClick={() => onSelectSimilar(sim)}
                    className="group cursor-pointer rounded-xl border border-slate-800 bg-slate-950 p-2 hover:border-slate-700 transition-colors"
                  >
                  <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-slate-900 mb-1.5">
                      <Image
                        src={sim.posterUrl}
                        alt={sim.title}
                        fill
                        sizes="(max-width: 640px) 50vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-200 group-hover:text-indigo-400 line-clamp-1 block">
                      {sim.title}
                    </span>
                    <span className="text-[10px] text-slate-400 capitalize block">
                      {sim.category} • {sim.externalRating}★
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
