import React from 'react';
import Link from 'next/link';

export const Footer: React.FC = () => {
  return (
    <footer
      className="w-full border-t border-zinc-800/60 bg-[#0B0D11] text-xs text-zinc-400 pt-12 pb-8 mt-auto"
      suppressHydrationWarning
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-12">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-3 pr-6">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#BE123C] text-white">
                <svg
                  className="h-3.5 w-3.5"
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
              <span className="font-bold text-white text-base">Watchtowr</span>
            </div>
            <p className="text-zinc-400 text-xs leading-relaxed max-w-sm">
              Your comprehensive compass in the entertainment universe. Seamlessly discover interactive gaming,
              cinematic journeys, and dramatic storytelling, completely aligned to your emotions.
            </p>
          </div>

          {/* Discover Column */}
          <div>
            <h4 className="font-semibold text-white mb-3">Discover</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/discover?cat=game" className="hover:text-white transition-colors">
                  Games
                </Link>
              </li>
              <li>
                <Link href="/discover?cat=anime" className="hover:text-white transition-colors">
                  Anime
                </Link>
              </li>
              <li>
                <Link href="/discover?cat=movie" className="hover:text-white transition-colors">
                  Movies & Shows
                </Link>
              </li>
            </ul>
          </div>

          {/* MyList Column */}
          <div>
            <h4 className="font-semibold text-white mb-3">MyList</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/mylist" className="hover:text-white transition-colors">
                  Saved Titles
                </Link>
              </li>
              <li>
                <Link href="/profile" className="hover:text-white transition-colors">
                  Profile
                </Link>
              </li>
              <li>
                <Link href="/discover" className="hover:text-white transition-colors">
                  Recommendations
                </Link>
              </li>
              <li>
                <Link href="/mylist" className="hover:text-white transition-colors">
                  Rate & Review
                </Link>
              </li>
            </ul>
          </div>

          {/* Company & Legal */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-white mb-3">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Support</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Press Kit</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Legal</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Line */}
        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-zinc-800/80 pt-6 text-[11px] text-zinc-500 gap-4">
          <p>© 2025 Watchtowr. All rights reserved. Built for entertainment purists.</p>
          <div className="flex items-center gap-6 text-zinc-400">
            <a href="#" className="hover:text-white transition-colors">Discord</a>
            <a href="#" className="hover:text-white transition-colors">Twitter</a>
            <a href="#" className="hover:text-white transition-colors">Instagram</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
