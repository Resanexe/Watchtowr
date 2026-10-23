'use client';

import React, { useState } from 'react';
import { X, SlidersHorizontal, Compass, RotateCcw, Trash2, Check } from 'lucide-react';
import { UserPreferences, MediaCategory, PresetMood } from '@/types';
import { ALL_PRESET_MOODS } from '@/lib/mock-data';

interface CustomizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: UserPreferences;
  onSavePreferences: (prefs: UserPreferences) => void;
  onResetHistory: () => void;
  onDeleteAccount: () => void;
  isGuest: boolean;
}

const ALL_GENRES = [
  'Action',
  'Sci-Fi',
  'Drama',
  'Comedy',
  'Fantasy',
  'Adventure',
  'Mystery',
  'Thriller',
  'Psychological',
  'RPG',
  'Open World',
  'Souls-like',
  'Simulation',
  'Puzzle',
  'Animation',
  'Crime',
];

export const CustomizeModal: React.FC<CustomizeModalProps> = ({
  isOpen,
  onClose,
  preferences,
  onSavePreferences,
  onResetHistory,
  onDeleteAccount,
  isGuest,
}) => {
  const [form, setForm] = useState<UserPreferences>({ ...preferences });
  const [activeTab, setActiveTab] = useState<'preferences' | 'privacy'>('preferences');

  if (!isOpen) return null;

  const toggleCategory = (cat: MediaCategory) => {
    const exists = form.preferredCategories.includes(cat);
    const updated = exists
      ? form.preferredCategories.filter(c => c !== cat)
      : [...form.preferredCategories, cat];
    setForm({ ...form, preferredCategories: updated.length > 0 ? updated : [cat] });
  };

  const toggleGenre = (genre: string, type: 'preferred' | 'disliked') => {
    if (type === 'preferred') {
      const exists = form.preferredGenres.includes(genre);
      const updated = exists
        ? form.preferredGenres.filter(g => g !== genre)
        : [...form.preferredGenres, genre];
      setForm({
        ...form,
        preferredGenres: updated,
        dislikedGenres: form.dislikedGenres.filter(g => g !== genre),
      });
    } else {
      const exists = form.dislikedGenres.includes(genre);
      const updated = exists
        ? form.dislikedGenres.filter(g => g !== genre)
        : [...form.dislikedGenres, genre];
      setForm({
        ...form,
        dislikedGenres: updated,
        preferredGenres: form.preferredGenres.filter(g => g !== genre),
      });
    }
  };

  const toggleMood = (mood: PresetMood) => {
    const exists = form.preferredMoods.includes(mood);
    const updated = exists
      ? form.preferredMoods.filter(m => m !== mood)
      : [...form.preferredMoods, mood];
    setForm({ ...form, preferredMoods: updated });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isGuest) {
      alert('Guests cannot persist custom preferences across sessions. Preferences will apply for this session only.');
    }
    onSavePreferences(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl border border-slate-700/80 bg-slate-900 shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 p-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <SlidersHorizontal className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Customize Recommendations</h2>
              <p className="text-xs text-slate-400">Personalize scoring weights, moods, and time limits</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="flex border-b border-slate-800 px-5 pt-2">
          <button
            onClick={() => setActiveTab('preferences')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'preferences'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Preference Profile (FR-008)
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'privacy'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Privacy & Reset Controls (FR-022, FR-023)
          </button>
        </div>

        {/* Body */}
        {activeTab === 'preferences' ? (
          <form onSubmit={handleSubmit} className="p-5 space-y-5 max-h-[65vh] overflow-y-auto">
            {/* Preferred Categories */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-2">
                Preferred Categories for Your Feed
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['game', 'anime', 'movie', 'tv'] as MediaCategory[]).map(cat => {
                  const selected = form.preferredCategories.includes(cat);
                  return (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => toggleCategory(cat)}
                      className={`flex items-center justify-between rounded-xl p-2.5 text-xs font-bold border transition-colors capitalize ${
                        selected
                          ? 'border-indigo-500 bg-indigo-950/40 text-indigo-200'
                          : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span>{cat === 'tv' ? 'TV Shows' : cat}</span>
                      {selected && <Check className="h-3.5 w-3.5 text-indigo-400" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Preferred Moods */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-2">
                Preset Moods You Enjoy
              </label>
              <div className="flex flex-wrap gap-1.5">
                {ALL_PRESET_MOODS.map(mood => {
                  const selected = form.preferredMoods.includes(mood);
                  return (
                    <button
                      type="button"
                      key={mood}
                      onClick={() => toggleMood(mood)}
                      className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                        selected
                          ? 'border-violet-500 bg-violet-600/30 text-violet-200 font-bold'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {mood}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Preferred Genres */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Favorite Genres (+Boost scoring)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {ALL_GENRES.map(g => {
                  const selected = form.preferredGenres.includes(g);
                  return (
                    <button
                      type="button"
                      key={g}
                      onClick={() => toggleGenre(g, 'preferred')}
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium border transition-colors ${
                        selected
                          ? 'border-emerald-500 bg-emerald-950/50 text-emerald-300 font-bold'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      + {g}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Disliked Genres */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Disliked Genres (-Downrank in scoring)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {ALL_GENRES.map(g => {
                  const selected = form.dislikedGenres.includes(g);
                  return (
                    <button
                      type="button"
                      key={g}
                      onClick={() => toggleGenre(g, 'disliked')}
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium border transition-colors ${
                        selected
                          ? 'border-rose-500 bg-rose-950/50 text-rose-300 font-bold'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      - {g}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Discovery Level (Serendipity vs Exact Match) */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="minimum-rating" className="text-xs font-bold text-slate-200">Minimum External Rating</label>
                <span className="text-xs text-amber-400 font-bold">{form.minRating.toFixed(1)} / 5</span>
              </div>
              <input
                id="minimum-rating"
                type="range"
                min="0"
                max="5"
                step="0.5"
                value={form.minRating}
                onChange={e => setForm({ ...form, minRating: Number(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Discovery Level (Serendipity vs Exact Match) */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                  <Compass className="h-4 w-4 text-indigo-400" />
                  Discovery Level ({Math.round(form.discoveryLevel * 100)}%)
                </label>
                <span className="text-xs text-indigo-400 font-bold">
                  {form.discoveryLevel <= 0.2
                    ? 'Strict Preference Match'
                    : form.discoveryLevel >= 0.7
                    ? 'High Serendipity & Variety'
                    : 'Balanced Discovery'}
                </span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.1"
                value={form.discoveryLevel}
                onChange={e => setForm({ ...form, discoveryLevel: parseFloat(e.target.value) })}
                className="w-full accent-indigo-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>0% Familiar Only</span>
                <span>50% Balanced</span>
                <span>100% Adventurous Discovery</span>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/30"
              >
                Save Preferences
              </button>
            </div>
          </form>
        ) : (
          <div className="p-5 space-y-6 max-h-[65vh] overflow-y-auto">
            {/* Reset History (FR-022) */}
            <div className="rounded-2xl border border-amber-900/40 bg-amber-950/20 p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-amber-900/50 text-amber-300">
                  <RotateCcw className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-200">Reset Recommendation History (FR-022)</h4>
                  <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                    Clears your negative feedback signals (Not Interested and Show Less Like This) and resets preference weights to default. Your saved MyList titles and written reviews will remain safe.
                  </p>
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to reset your recommendation history?')) {
                        onResetHistory();
                        onClose();
                      }
                    }}
                    className="mt-3 rounded-xl border border-amber-600/60 bg-amber-900/40 px-3.5 py-1.5 text-xs font-bold text-amber-200 hover:bg-amber-800/50 transition-colors"
                  >
                    Reset Recommendation Signals
                  </button>
                </div>
              </div>
            </div>

            {/* Account & Data Deletion (FR-023) */}
            <div className="rounded-2xl border border-rose-900/40 bg-rose-950/20 p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-rose-900/50 text-rose-300">
                  <Trash2 className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-rose-200">Delete Account & Clear All Data (FR-023)</h4>
                  <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                    Permanently purges all your profile information, MyList entries, ratings, reviews, and recommendation history from this device, satisfying academic privacy requirements.
                  </p>
                  <button
                    onClick={() => {
                      if (confirm('Warning: This will delete ALL your saved titles, reviews, and account data. Proceed?')) {
                        onDeleteAccount();
                        onClose();
                      }
                    }}
                    className="mt-3 rounded-xl border border-rose-600/60 bg-rose-900/40 px-3.5 py-1.5 text-xs font-bold text-rose-200 hover:bg-rose-800/50 transition-colors"
                  >
                    Purge All Account Data
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
