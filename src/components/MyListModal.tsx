'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  X,
  Bookmark,
  Gamepad2,
  Film,
  Tv,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { MyListItem, MyListStatus, MediaCategory } from '@/types';
import { formatCategory } from '@/lib/utils';

interface MyListModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: MyListItem[];
  onUpdateStatus: (mediaId: string, status: MyListStatus | null) => void;
  onSelectTitle: (mediaId: string) => void;
}

export const MyListModal: React.FC<MyListModalProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateStatus,
  onSelectTitle,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | MyListStatus>('all');

  if (!isOpen) return null;

  const filteredItems = items.filter(
    item => activeTab === 'all' || item.status === activeTab
  );

  const statusLabels: Record<MyListStatus, string> = {
    want_to_try: 'Want to try',
    in_progress: 'In progress',
    completed: 'Completed',
    dropped: 'Dropped',
  };

  const getCategoryIcon = (cat: MediaCategory) => {
    switch (cat) {
      case 'game': return <Gamepad2 className="h-3 w-3" />;
      case 'anime': return <Sparkles className="h-3 w-3" />;
      case 'movie': return <Film className="h-3 w-3" />;
      case 'tv': return <Tv className="h-3 w-3" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-3xl border border-slate-700/80 bg-slate-900 shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 p-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-white">
              <Bookmark className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">MyList (FR-014)</h2>
                <span className="rounded-full bg-violet-950 px-2 py-0.5 text-xs font-semibold text-violet-300 border border-violet-800">
                  {items.length} titles
                </span>
              </div>
              <p className="text-xs text-slate-400">Track and organize games, anime, movies, and TV shows</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex overflow-x-auto border-b border-slate-800 px-5 pt-2 gap-2 scrollbar-none">
          <button
            onClick={() => setActiveTab('all')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'all'
                ? 'border-violet-500 text-violet-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({items.length})
          </button>
          {(['want_to_try', 'in_progress', 'completed', 'dropped'] as MyListStatus[]).map(status => {
            const count = items.filter(i => i.status === status).length;
            return (
              <button
                key={status}
                onClick={() => setActiveTab(status)}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === status
                    ? 'border-violet-500 text-violet-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {statusLabels[status]} ({count})
              </button>
            );
          })}
        </div>

        {/* Content List */}
        <div className="p-5 max-h-[60vh] overflow-y-auto space-y-3">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center">
              <Bookmark className="mx-auto h-10 w-10 text-slate-600 mb-2" />
              <p className="text-sm font-medium text-slate-300">No titles in this list view</p>
              <p className="text-xs text-slate-500 mt-1">
                Browse titles on the homepage or category hubs and add them to your MyList.
              </p>
            </div>
          ) : (
            filteredItems.map(item => (
              <div
                key={item.mediaId}
                className="flex items-center justify-between gap-4 rounded-2xl border border-slate-800/80 bg-slate-950/60 p-3 hover:border-slate-700 transition-colors"
              >
                {/* Poster & Title info */}
                <div
                  onClick={() => {
                    onSelectTitle(item.mediaId);
                    onClose();
                  }}
                  className="flex items-center gap-3.5 cursor-pointer flex-1 min-w-0"
                >
                  <Image
                    src={item.posterUrl}
                    alt={item.title}
                    width={48}
                    height={64}
                    className="h-16 w-12 rounded-lg object-cover bg-slate-900 border border-slate-800 shrink-0"
                  />
                  <div className="min-w-0">
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
                      {getCategoryIcon(item.category)}
                      {formatCategory(item.category)}
                    </span>
                    <h4 className="text-sm font-bold text-white truncate hover:text-indigo-400 transition-colors">
                      {item.title}
                    </h4>
                    <span className="text-[11px] text-slate-500 block">
                      Added {new Date(item.addedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Status Switcher & Remove */}
                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={item.status}
                    onChange={e => onUpdateStatus(item.mediaId, e.target.value as MyListStatus)}
                    className="rounded-xl border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                  >
                    {(['want_to_try', 'in_progress', 'completed', 'dropped'] as MyListStatus[]).map(s => (
                      <option key={s} value={s}>{statusLabels[s]}</option>
                    ))}
                  </select>

                  <button
                    onClick={() => onUpdateStatus(item.mediaId, null)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                    title="Remove from MyList"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
