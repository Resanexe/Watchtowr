'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, X, ThumbsDown, EyeOff } from 'lucide-react';
import { FeedbackType } from '@/types';
import { ExtendedMediaItem } from '@/lib/mock-data';

interface WatchtowrCardProps {
  item: ExtendedMediaItem;
  variant?: 'vertical' | 'horizontal-banner' | 'mylist';
  onRemoveFromMyList?: (id: string) => void;
  onFeedback?: (id: string, type: FeedbackType, genres: string[]) => void;
}

export const WatchtowrCard: React.FC<WatchtowrCardProps> = ({
  item,
  variant = 'vertical',
  onRemoveFromMyList,
  onFeedback,
}) => {
  const durationText = (() => {
    if (item.category === 'game' && item.gamePlaytimeHours) {
      return `${item.gamePlaytimeHours}h Playtime`;
    }
    if (item.category === 'movie' && item.runtimeMinutes) {
      const h = Math.floor(item.runtimeMinutes / 60);
      const m = item.runtimeMinutes % 60;
      return `${h}h ${m < 10 ? '0' : ''}${m}m`;
    }
    if ((item.category === 'tv' || item.category === 'anime') && item.episodeCount) {
      return `${item.episodeCount} Episodes`;
    }
    return '';
  })();

  const genreText = item.genres.slice(0, 2).join(' / ');

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalf = rating - fullStars >= 0.5;

    return (
      <div className="flex items-center gap-1 text-[#FACC15]">
        <div className="flex items-center text-xs">
          {[1, 2, 3, 4, 5].map(starIndex => (
            <Star
              key={starIndex}
              className={`h-3 w-3 ${
                starIndex <= fullStars
                  ? 'fill-[#FACC15] text-[#FACC15]'
                  : starIndex === fullStars + 1 && hasHalf
                  ? 'fill-[#FACC15]/60 text-[#FACC15]'
                  : 'text-zinc-600'
              }`}
            />
          ))}
        </div>
        <span className="text-[11px] font-bold text-[#FACC15] ml-0.5">
          {rating.toFixed(1)}
        </span>
      </div>
    );
  };

  // Horizontal Widescreen Banner Card (Used in Games Trending & Top Rated)
  if (variant === 'horizontal-banner') {
    return (
      <div className="group relative flex flex-col rounded-2xl bg-[#13161F] p-3 border border-zinc-800/70 hover:border-zinc-700 transition-all shadow-md">
        <Link href={`/title/${item.id}`} className="block">
          <div className="relative aspect-[16/7] w-full overflow-hidden rounded-xl bg-zinc-900">
            <Image
              src={item.bannerUrl || item.posterUrl}
              alt={item.title}
              fill
              sizes="(max-width: 1024px) 50vw, 33vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
          <div className="mt-2.5">
            <h4 className="font-semibold text-white text-sm truncate group-hover:text-rose-400 transition-colors">
              {item.title}
            </h4>
            <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-1">
              <span className="truncate max-w-[65%]">{genreText}</span>
              {durationText && <span className="shrink-0 text-zinc-400 font-medium">{durationText}</span>}
            </div>
            <div className="mt-1">{renderStars(item.externalRating)}</div>
          </div>
        </Link>
        {onFeedback && <FeedbackControls item={item} onFeedback={onFeedback} />}
      </div>
    );
  }

  // MyList Card Variant (Matching MyList Figma Screenshot)
  if (variant === 'mylist') {
    return (
      <div className="group relative flex flex-col rounded-2xl bg-[#13161F] p-2.5 border border-zinc-800/70 hover:border-zinc-700 transition-all shadow-md">
        <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-zinc-900">
          <Link href={`/title/${item.id}`} className="block h-full w-full">
            <Image
              src={item.posterUrl}
              alt={item.title}
              fill
              sizes="(max-width: 768px) 50vw, 20vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </Link>

          {/* Top-left category badge */}
          <div className="absolute top-2 left-2 pointer-events-none">
            <span className="rounded bg-black/85 backdrop-blur-md px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-white border border-white/10">
              {item.category === 'tv' ? 'TV SHOW' : item.category.toUpperCase()}
            </span>
          </div>

          {/* Top-right remove button */}
          {onRemoveFromMyList && (
            <button
              onClick={e => {
                e.stopPropagation();
                onRemoveFromMyList(item.id);
              }}
              className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-black/80 text-zinc-400 hover:text-white hover:bg-rose-900/90 backdrop-blur-md transition-colors"
              title="Remove from MyList"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        <div className="mt-2.5 px-0.5">
          <Link href={`/title/${item.id}`}>
            <h4 className="font-semibold text-white text-xs sm:text-sm truncate group-hover:text-rose-400 transition-colors">
              {item.title}
            </h4>
          </Link>
          <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-1">
            <span className="capitalize text-zinc-400">{item.category === 'tv' ? 'TV Show' : item.category}</span>
            <span className="text-[10px] text-zinc-500">User rating</span>
          </div>
          <div className="mt-1">{renderStars(item.externalRating)}</div>
        </div>
      </div>
    );
  }

  // Default Vertical Card (Used on Home & Discover - matching exact Figma style)
  return (
    <div className="group relative flex flex-col rounded-2xl bg-[#13161F] p-2.5 border border-zinc-800/70 hover:border-zinc-700 transition-all shadow-md">
      <Link href={`/title/${item.id}`} className="block">
        <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-zinc-900">
          <Image
            src={item.posterUrl}
            alt={item.title}
            fill
            sizes="(max-width: 768px) 50vw, 20vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <div className="mt-2.5 px-0.5">
          <h4 className="font-semibold text-white text-xs sm:text-sm truncate group-hover:text-rose-400 transition-colors">
            {item.title}
          </h4>
          <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-1">
            <span className="truncate max-w-[65%]">{genreText}</span>
            {durationText && <span className="shrink-0 text-zinc-400 font-medium">{durationText}</span>}
          </div>
          <div className="mt-1">{renderStars(item.externalRating)}</div>
        </div>
      </Link>
      {onFeedback && <FeedbackControls item={item} onFeedback={onFeedback} />}
    </div>
  );
};

function FeedbackControls({
  item,
  onFeedback,
}: {
  item: ExtendedMediaItem;
  onFeedback: (id: string, type: FeedbackType, genres: string[]) => void;
}) {
  return (
    <div className="absolute right-4 top-4 z-10 flex gap-1 rounded-lg bg-black/75 p-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
      <button
        type="button"
        aria-label="Show me fewer titles like this"
        title="Show me less like this"
        onClick={() => onFeedback(item.id, 'show_less_like_this', [...item.genres, ...(item.genreTags || [])])}
        className="rounded-md p-1.5 text-white hover:bg-amber-500/30 hover:text-amber-200"
      >
        <ThumbsDown className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        aria-label="Not interested in this title"
        title="Not interested"
        onClick={() => onFeedback(item.id, 'not_interested', [...item.genres, ...(item.genreTags || [])])}
        className="rounded-md p-1.5 text-white hover:bg-rose-500/30 hover:text-rose-200"
      >
        <EyeOff className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
