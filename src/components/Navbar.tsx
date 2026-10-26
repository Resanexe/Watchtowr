'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { GUEST_USER, normalizeSession, STORAGE_KEYS } from '@/lib/storage';
import { useStoredValue } from '@/lib/use-stored-value';
import { getProfileInitials, PROFILE_AVATAR_COLORS } from '@/lib/profile-utils';

interface NavbarProps {
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ searchQuery = '', onSearchChange }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const inputValue = onSearchChange ? searchQuery : localSearchQuery;
  const storedSession = useStoredValue(STORAGE_KEYS.session, GUEST_USER);
  const session = useMemo(() => normalizeSession(storedSession), [storedSession]);

  const isHome = pathname === '/' || pathname === '';
  const isDiscover = pathname.startsWith('/discover');
  const isMyList = pathname.startsWith('/mylist');

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = inputValue.trim();
    if (query) router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  const handleSearchChange = (query: string) => {
    if (onSearchChange) onSearchChange(query);
    else setLocalSearchQuery(query);
  };

  return (
    <header
      className="sticky top-0 z-50 w-full border-b border-zinc-800/80 bg-[#0B0D11]/95 backdrop-blur-md"
      suppressHydrationWarning
    >
      <div className="mx-auto flex max-w-[1760px] items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#BE123C] text-white shadow-md shadow-rose-950/50 group-hover:scale-105 transition-transform">
            {/* Custom Watchtowr beacon shield */}
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2a10 10 0 0 1 10 10c0 5.523-4.477 10-10 10S2 17.523 2 12A10 10 0 0 1 12 2Z" />
              <path d="M12 6a6 6 0 0 1 6 6" />
              <circle cx="12" cy="12" r="2" fill="currentColor" />
            </svg>
          </div>
          <span className="font-bold tracking-tight text-lg text-white">
            Watchtowr
          </span>
        </Link>

        {/* Center Navigation Links */}
        <nav className="flex items-center gap-8 text-sm">
          <Link
            href="/"
            className={`relative py-1 font-medium transition-colors ${
              isHome
                ? 'text-white font-semibold after:absolute after:bottom-[-13px] after:left-0 after:right-0 after:h-[2.5px] after:bg-[#BE123C] after:rounded-full'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            For You
          </Link>

          <Link
            href="/discover"
            className={`relative py-1 font-medium transition-colors ${
              isDiscover
                ? 'text-white font-semibold after:absolute after:bottom-[-13px] after:left-0 after:right-0 after:h-[2.5px] after:bg-[#BE123C] after:rounded-full'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Discover
          </Link>

          <Link
            href="/mylist"
            className={`relative py-1 font-medium transition-colors ${
              isMyList
                ? 'text-white font-semibold after:absolute after:bottom-[-13px] after:left-0 after:right-0 after:h-[2.5px] after:bg-[#BE123C] after:rounded-full'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            MyList
          </Link>
        </nav>

        {/* Search Bar & User Profile */}
        <div className="flex items-center gap-3">
          <form onSubmit={handleSearchSubmit} role="search" className="relative w-44 sm:w-60 md:w-64">
            <input
              type="text"
              value={inputValue}
              onChange={e => handleSearchChange(e.target.value)}
              placeholder="Search all titles..."
              aria-label="Search all movies, TV, anime, and games"
              suppressHydrationWarning
              className="w-full rounded-lg border border-zinc-800 bg-[#161922] py-1.5 pl-3 pr-9 text-xs text-zinc-200 placeholder-zinc-500 focus:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-700 transition-all"
            />
            <button
              type="submit"
              aria-label="Search provider catalogs"
              title="Search provider catalogs"
              disabled={!inputValue.trim()}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-zinc-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Search className="h-3.5 w-3.5" />
            </button>
          </form>

          {/* Profile Avatar */}
          <Link
            href="/profile"
            className={`shrink-0 rounded-full bg-gradient-to-br ${PROFILE_AVATAR_COLORS[session.avatarColor]} p-[2px] ring-1 hover:scale-105 transition-transform`}
            title={`${session.displayName}'s profile`}
            aria-label="Open profile"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#12141b] bg-cover bg-center text-[10px] font-bold text-white" style={session.avatarDataUrl ? { backgroundImage: `url("${session.avatarDataUrl}")` } : undefined}>
              {!session.avatarDataUrl && getProfileInitials(session.displayName)}
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
};
