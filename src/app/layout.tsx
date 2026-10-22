import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'WATCHTOWR — Unified Entertainment Discovery',
  description:
    'Discover Games, Anime, Movies, and TV Shows in one unified feed with strict time filters and personalized hybrid recommendations. Prepared by Hossain MD Siam for Jibril Mohamed Hassan.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full antialiased" suppressHydrationWarning>
      <body
        className="min-h-full flex flex-col bg-[#0B0D11] text-zinc-100 font-sans selection:bg-[#BE123C] selection:text-white"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
