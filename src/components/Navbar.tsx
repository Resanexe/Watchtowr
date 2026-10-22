'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search } from 'lucide-react';

interface NavbarProps {
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ searchQuery = '', onSearchChange }) => {
  const pathname = usePathname();

  const isHome = pathname === '/' || pathname === '';
  const isDiscover = pathname.startsWith('/discover');
  const isMyList = pathname.startsWith('/mylist');

  return (
    <header
      className="sticky top-0 z-50 w-full border-b border-zinc-800/80 bg-[#0B0D11]/95 backdrop-blur-md"
      suppressHydrationWarning
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
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
            Home
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
          <div className="relative w-44 sm:w-60 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => onSearchChange?.(e.target.value)}
              placeholder="Search titles..."
              suppressHydrationWarning
              className="w-full rounded-lg border border-zinc-800 bg-[#161922] py-1.5 pl-8 pr-3 text-xs text-zinc-200 placeholder-zinc-500 focus:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-700 transition-all"
            />
          </div>

          {/* Profile Avatar */}
          <Link href="/mylist" className="shrink-0" title="Profile & Saved Lists">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80"
              alt="User Avatar"
              className="h-8 w-8 rounded-full object-cover border border-amber-600/60 ring-1 ring-amber-500/30 hover:scale-105 transition-transform"
            />
          </Link>
        </div>
      </div>
    </header>
  );
};
