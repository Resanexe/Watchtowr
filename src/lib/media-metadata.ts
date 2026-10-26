import { PresetMood } from '@/types';

function normalizeMetadata(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

const MOOD_HINTS: Record<PresetMood, string[]> = {
  'Chilling / Cozy': ['slice of life', 'comedy', 'family', 'casual', 'relaxing', 'cozy', 'life simulation', 'puzzle'],
  'Adrenaline / Thrill': ['action', 'adventure', 'thriller', 'sports', 'racing', 'fighting', 'shooter'],
  'Mind-Bending': ['mystery', 'psychological', 'sci fi', 'science fiction', 'puzzle', 'strategy', 'surreal', 'time travel'],
  'Dark & Gritty': ['horror', 'crime', 'thriller', 'war', 'dark', 'survival'],
  'Feel-Good / Uplifting': ['comedy', 'family', 'romance', 'animation', 'music', 'wholesome', 'feel good'],
  'Epic Adventure': ['adventure', 'fantasy', 'action', 'rpg', 'role playing', 'open world'],
  'Emotional / Tearjerker': ['romance', 'drama', 'family', 'animation', 'emotional', 'visual novel'],
};

export function deriveMoods(genresAndTags: string[]): PresetMood[] {
  const metadata = genresAndTags.map(normalizeMetadata).filter(Boolean);
  return (Object.entries(MOOD_HINTS) as [PresetMood, string[]][])
    .filter(([, hints]) => hints.some(hint => metadata.some(value => value === hint || value.includes(hint))))
    .map(([mood]) => mood);
}

function normalizePlatform(value: string): string {
  const normalized = normalizeMetadata(value);
  if (normalized === 'xbox series s x' || normalized === 'xbox series x s') return 'xbox series';
  if (normalized === 'ps5' || normalized === 'playstation 5') return 'playstation 5';
  if (normalized === 'switch' || normalized === 'nintendo switch') return 'nintendo switch';
  return normalized;
}

export function platformMatches(selected: string, available: string[]): boolean {
  const wanted = normalizePlatform(selected);
  return available.some(platform => normalizePlatform(platform) === wanted);
}
