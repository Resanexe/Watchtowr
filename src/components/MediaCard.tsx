'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  Star,
  Clock,
  Gamepad2,
  Film,
  Tv,
  Sparkles,
  Bookmark,
  BookmarkCheck,
  ThumbsDown,
  EyeOff,
  ChevronDown,
  Check,
} from 'lucide-react';
import { ScoredMediaItem, MyListStatus, FeedbackType } from '@/types';
import { formatDuration, formatCategory } from '@/lib/utils';

interface MediaCardProps {
  item: ScoredMediaItem;
  myListStatus?: MyListStatus;
  userRating?: number;
  onSelectTitle: (item: ScoredMediaItem) => void;
  onUpdateMyList: (mediaId: string, status: MyListStatus | null) => void;
  onFeedback: (mediaId: string, type: FeedbackType, genres: string[]) => void;
  isGuest: boolean;
}

export const MediaCard: React.FC<MediaCardProps> = ({
  item,
  myListStatus,
  userRating,
  onSelectTitle,
  onUpdateMyList,
  onFeedback,
  isGuest,
}) => {
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  const getCategoryIcon = () => {
    switch (item.category) {
      case 'game': return <Gamepad2 className="h-3 w-3" />;
      case 'anime': return <Sparkles className="h-3 w-3" />;
      case 'movie': return <Film className="h-3 w-3" />;
      case 'tv': return <Tv className="h-3 w-3" />;
    }
  };

  const getCategoryColor = () => {
    switch (item.category) {
      case 'game': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'anime': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'movie': return 'bg-sky-500/20 text-sky-300 border-sky-500/30';
      case 'tv': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    }
  };

  const timeString = (() => {
    if (item.category === 'game') {
      return formatDuration(undefined, item.gamePlaytimeHours);
    }
    if (item.category === 'movie') {
      return formatDuration(item.runtimeMinutes);
    }
    if (item.episodeCount && item.runtimeMinutes) {
      return `${item.episodeCount} eps • ${item.runtimeMinutes}m`;
    }
    if (item.runtimeMinutes) {
      return `${item.runtimeMinutes}m / ep`;
    }
    return null;
  })();

  const statusLabels: Record<MyListStatus, string> = {
    want_to_try: 'Want to try',
    in_progress: 'In progress',
    completed: 'Completed',
    dropped: 'Dropped',
  };

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/60 transition-all duration-300 hover:-translate-y-1 hover:border-slate-700 hover:bg-slate-900/90 hover:shadow-xl hover:shadow-indigo-500/5">
      {/* Poster / Artwork Header */}
      <div
        onClick={() => onSelectTitle(item)}
        className="relative aspect-[16/10] w-full overflow-hidden bg-slate-950 cursor-pointer"
      >
        <Image
          src={item.posterUrl}
          alt={item.title}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
          <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold border backdrop-blur-md ${getCategoryColor()}`}>
            {getCategoryIcon()}
            {formatCategory(item.category)}
          </span>
          {item.releaseYear && (
            <span className="rounded-md bg-slate-950/70 backdrop-blur-md px-1.5 py-0.5 text-[10px] font-medium text-slate-300 border border-slate-800">
              {item.releaseYear}
            </span>
          )}
        </div>

        {/* Rating Badge */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 rounded-md bg-slate-950/80 backdrop-blur-md px-2 py-0.5 text-xs font-bold text-amber-400 border border-amber-500/20 shadow-md">
          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
          <span>{item.externalRating.toFixed(1)}</span>
        </div>

        {/* Time / Duration pill */}
        {timeString && (
          <div className="absolute bottom-2 left-2.5 flex items-center gap-1 rounded-md bg-slate-950/80 backdrop-blur-md px-2 py-0.5 text-[11px] font-medium text-slate-300 border border-slate-800">
            <Clock className="h-3 w-3 text-slate-400" />
            <span>{timeString}</span>
          </div>
        )}
      </div>

      {/* Content Body */}
      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          {/* Recommendation Explanation (FR-012) */}
          {item.explanation && (
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-indigo-950/70 border border-indigo-800/50 px-2.5 py-0.5 text-[10px] font-medium text-indigo-300 max-w-full truncate">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 shrink-0" />
              <span className="truncate">{item.explanation}</span>
            </div>
          )}

          {/* Title */}
          <h3
            onClick={() => onSelectTitle(item)}
            className="font-bold text-slate-100 text-base leading-snug hover:text-indigo-400 cursor-pointer transition-colors line-clamp-1"
            title={item.title}
          >
            {item.title}
          </h3>

          {/* Tagline or Synopsis preview */}
          <p className="mt-1 text-xs text-slate-400 line-clamp-2 leading-relaxed">
            {item.tagline || item.synopsis}
          </p>

          {/* Genre & Mood Pills */}
          <div className="mt-3 flex flex-wrap gap-1">
            {item.genres.slice(0, 3).map(g => (
              <span
                key={g}
                className="rounded bg-slate-800/80 px-1.5 py-0.5 text-[10px] font-medium text-slate-300"
              >
                {g}
              </span>
            ))}
            {item.moods.slice(0, 1).map(m => (
              <span
                key={m}
                className="rounded bg-violet-950/60 border border-violet-800/40 px-1.5 py-0.5 text-[10px] font-medium text-violet-300"
              >
                {m}
              </span>
            ))}
          </div>
        </div>

        {/* Action Controls Footer */}
        <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between gap-2">
          {/* MyList Dropdown / Button (FR-014) */}
          <div className="relative">
            <button
              onClick={() => {
                if (isGuest) {
                  alert('Please sign in or switch from Guest mode to save items to MyList.');
                  return;
                }
                setShowStatusMenu(!showStatusMenu);
              }}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium border transition-colors ${
                myListStatus
                  ? 'border-violet-500/50 bg-violet-950/50 text-violet-200 hover:bg-violet-900/50'
                  : 'border-slate-700 bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {myListStatus ? (
                <>
                  <BookmarkCheck className="h-3.5 w-3.5 text-violet-400" />
                  <span>{statusLabels[myListStatus]}</span>
                </>
              ) : (
                <>
                  <Bookmark className="h-3.5 w-3.5" />
                  <span>Add to List</span>
                </>
              )}
              <ChevronDown className="h-3 w-3 opacity-60" />
            </button>

            {/* Status Menu Popover */}
            {showStatusMenu && (
              <div className="absolute left-0 bottom-full mb-1 z-30 w-36 rounded-xl border border-slate-700 bg-slate-900 p-1 shadow-2xl backdrop-blur-md">
                {(['want_to_try', 'in_progress', 'completed', 'dropped'] as MyListStatus[]).map(status => (
                  <button
                    key={status}
                    onClick={() => {
                      onUpdateMyList(item.id, status);
                      setShowStatusMenu(false);
                    }}
                    className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-xs text-slate-200 hover:bg-slate-800 transition-colors text-left"
                  >
                    <span>{statusLabels[status]}</span>
                    {myListStatus === status && <Check className="h-3.5 w-3.5 text-violet-400" />}
                  </button>
                ))}
                {myListStatus && (
                  <button
                    onClick={() => {
                      onUpdateMyList(item.id, null);
                      setShowStatusMenu(false);
                    }}
                    className="flex w-full items-center rounded-lg px-2 py-1 text-[11px] text-rose-400 hover:bg-rose-950/40 border-t border-slate-800 mt-1"
                  >
                    Remove from List
                  </button>
                )}
              </div>
            )}
          </div>

          {/* User Rating Display or Action */}
          {userRating && (
            <div className="flex items-center gap-0.5 text-xs text-amber-400 font-bold" title={`You rated this ${userRating} stars`}>
              <span>{userRating}</span>
              <Star className="h-3 w-3 fill-amber-400" />
            </div>
          )}

          {/* Feedback Buttons: Not Interested & Show Less Like This (FR-013) */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onFeedback(item.id, 'show_less_like_this', item.genres)}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-amber-400 transition-colors"
              title="Show me less like this (penalizes these genres in future scoring)"
            >
              <ThumbsDown className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onFeedback(item.id, 'not_interested', item.genres)}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-rose-400 transition-colors"
              title="Not interested (completely removes this title from feed)"
            >
              <EyeOff className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
