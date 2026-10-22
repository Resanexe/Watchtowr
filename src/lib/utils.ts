import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(minutes?: number, hours?: number): string {
  if (hours !== undefined && hours > 0) {
    return `${hours}h playtime`;
  }
  if (!minutes || minutes <= 0) {
    return 'Time unknown';
  }
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function formatCategory(cat: string): string {
  switch (cat) {
    case 'movie': return 'Movie';
    case 'tv': return 'TV Show';
    case 'anime': return 'Anime';
    case 'game': return 'Game';
    default: return cat;
  }
}
