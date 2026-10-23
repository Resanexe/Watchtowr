'use client';

import React, { useState } from 'react';
import {
  SlidersHorizontal,
  Clock,
  Sparkles,
  Gamepad2,
  Film,
  Tv,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { FilterState, PresetMood, MediaCategory } from '@/types';
import { ALL_PRESET_MOODS } from '@/lib/mock-data';

interface FilterBarProps {
  filter: FilterState;
  onFilterChange: (newFilter: FilterState) => void;
  totalResults: number;
}

const COMMON_GENRES = [
  'Action',
  'Sci-Fi',
  'Fantasy',
  'Drama',
  'Adventure',
  'Comedy',
  'Mystery',
  'Thriller',
  'RPG',
  'Open World',
  'Souls-like',
  'Animation',
];

const GAME_PLATFORMS = ['PC', 'PlayStation 5', 'Xbox Series X/S', 'Nintendo Switch'];

export const FilterBar: React.FC<FilterBarProps> = ({
  filter,
  onFilterChange,
  totalResults,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const setCategory = (cat: 'all' | MediaCategory) => {
    onFilterChange({ ...filter, category: cat });
  };

  const toggleGenre = (genre: string) => {
    const exists = filter.genres.includes(genre);
    const updated = exists
      ? filter.genres.filter(g => g !== genre)
      : [...filter.genres, genre];
    onFilterChange({ ...filter, genres: updated });
  };

  const setMood = (mood?: PresetMood) => {
    onFilterChange({ ...filter, mood: filter.mood === mood ? undefined : mood });
  };

  const handleTimeChange = (mins: number) => {
    onFilterChange({
      ...filter,
      maxTimeMinutes: mins === 0 ? undefined : mins,
      strictTimeOnly: mins > 0,
    });
  };

  const resetFilters = () => {
    onFilterChange({
      category: 'all',
      searchQuery: '',
      genres: [],
      mood: undefined,
      minRating: 1.0,
      maxRating: 5.0,
      releaseYearMin: undefined,
      releaseYearMax: undefined,
      maxTimeMinutes: undefined,
      strictTimeOnly: false,
      platform: undefined,
      seriesStatus: undefined,
      sortBy: 'recommended',
    });
  };

  const activeFiltersCount =
    (filter.category !== 'all' ? 1 : 0) +
    filter.genres.length +
    (filter.mood ? 1 : 0) +
    (filter.maxTimeMinutes ? 1 : 0) +
    (filter.minRating > 1.0 ? 1 : 0) +
    (filter.platform ? 1 : 0) +
    (filter.seriesStatus ? 1 : 0);

  return (
    <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 backdrop-blur-md">
      {/* Category Tabs & Quick Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setCategory('all')}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
              filter.category === 'all'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            All Categories
          </button>
          <button
            onClick={() => setCategory('game')}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
              filter.category === 'game'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Gamepad2 className="h-3.5 w-3.5" />
            Games
          </button>
          <button
            onClick={() => setCategory('anime')}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
              filter.category === 'anime'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Anime
          </button>
          <button
            onClick={() => setCategory('movie')}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
              filter.category === 'movie'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Film className="h-3.5 w-3.5" />
            Movies
          </button>
          <button
            onClick={() => setCategory('tv')}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
              filter.category === 'tv'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Tv className="h-3.5 w-3.5" />
            TV Shows
          </button>
        </div>

        {/* Right side controls: Toggle deep filters & Sort */}
        <div className="flex items-center gap-2">
          {/* Sort Selector */}
          <select
            value={filter.sortBy}
            onChange={e => onFilterChange({ ...filter, sortBy: e.target.value as FilterState['sortBy'] })}
            className="rounded-xl border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="recommended">Recommended First</option>
            <option value="rating">Highest Rated</option>
            <option value="release">Newest First</option>
            <option value="title">Alphabetical (A-Z)</option>
            <option value="shortest_time">Shortest Duration</option>
          </select>

          {/* Expand Filter Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors ${
              isExpanded || activeFiltersCount > 0
                ? 'border-indigo-500/60 bg-indigo-950/40 text-indigo-300'
                : 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-750'
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                {activeFiltersCount}
              </span>
            )}
            {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>

          {activeFiltersCount > 0 && (
            <button
              onClick={resetFilters}
              className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors"
              title="Reset all filters"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Preset Mood Selector Bar */}
      <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">
          Mood:
        </span>
        {ALL_PRESET_MOODS.map(mood => {
          const isSelected = filter.mood === mood;
          return (
            <button
              key={mood}
              onClick={() => setMood(mood)}
              className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium transition-all ${
                isSelected
                  ? 'border border-violet-500 bg-violet-600/30 text-violet-200 shadow-sm'
                  : 'border border-slate-800 bg-slate-800/50 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              {mood}
            </button>
          );
        })}
      </div>

      {/* Expandable Deep Filters Panel (FR-006, FR-007) */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-4 animate-in fade-in duration-200">
          {/* Strict Available Time Filter (PRD FR-007) */}
          <div className="rounded-xl border border-indigo-900/40 bg-indigo-950/20 p-3">
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
                <Clock className="h-3.5 w-3.5 text-indigo-400" />
                Strict Available Time Limit (FR-007)
              </label>
              <span className="text-xs font-semibold text-indigo-200">
                {filter.maxTimeMinutes ? `${filter.maxTimeMinutes} minutes max` : 'No Limit'}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Any Time', value: 0 },
                { label: '≤ 30 mins (Quick ep)', value: 30 },
                { label: '≤ 60 mins (Standard ep)', value: 60 },
                { label: '≤ 120 mins (Feature movie)', value: 120 },
                { label: '≤ 180 mins (3 Hours)', value: 180 },
                { label: '≤ 10 hrs (Short Game)', value: 600 },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleTimeChange(opt.value)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium border transition-colors ${
                    (filter.maxTimeMinutes || 0) === opt.value
                      ? 'border-indigo-500 bg-indigo-600 text-white shadow-sm'
                      : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-slate-400 italic">
              *Strict constraint active: Titles missing required duration metadata or exceeding this limit are strictly excluded.
            </p>
          </div>

          {/* Genre Filter */}
          <div>
            <span className="text-xs font-bold text-slate-300 block mb-2">Genres</span>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_GENRES.map(g => {
                const active = filter.genres.includes(g);
                return (
                  <button
                    key={g}
                    onClick={() => toggleGenre(g)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                      active
                        ? 'bg-slate-200 text-slate-900 font-bold'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {g}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Rating Slider & Category Specific Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {/* Minimum External Rating */}
            <div>
              <div className="flex justify-between text-xs text-slate-300 font-bold mb-1">
                <span>Minimum External Rating</span>
                <span className="text-amber-400">{filter.minRating}★ +</span>
              </div>
              <input
                type="range"
                min="0"
                max="5"
                step="0.5"
                value={filter.minRating}
                onChange={e => onFilterChange({ ...filter, minRating: parseFloat(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Platform (if Game selected) */}
            {(filter.category === 'game' || filter.category === 'all') && (
              <div>
                <span className="text-xs font-bold text-slate-300 block mb-1">Gaming Platform</span>
                <select
                  value={filter.platform || ''}
                  onChange={e => onFilterChange({ ...filter, platform: e.target.value || undefined })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-slate-200 focus:outline-none"
                >
                  <option value="">All Platforms</option>
                  {GAME_PLATFORMS.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Series Status (if Anime or TV) */}
            {(filter.category === 'anime' || filter.category === 'tv' || filter.category === 'all') && (
              <div>
                <span className="text-xs font-bold text-slate-300 block mb-1">Series Status</span>
                <select
                  value={filter.seriesStatus || ''}
                  onChange={e => onFilterChange({ ...filter, seriesStatus: e.target.value || undefined })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-slate-200 focus:outline-none"
                >
                  <option value="">Any Status</option>
                  <option value="Completed">Completed Only</option>
                  <option value="Ongoing">Ongoing Series</option>
                </select>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Results Count bar */}
      <div className="mt-3 flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60">
        <span>
          Showing <strong className="text-slate-200">{totalResults}</strong> titles matching current criteria
        </span>
        {filter.strictTimeOnly && filter.maxTimeMinutes && (
          <span className="text-indigo-400 font-medium">
            Strict Time Limit: {filter.maxTimeMinutes}m max
          </span>
        )}
      </div>
    </div>
  );
};
