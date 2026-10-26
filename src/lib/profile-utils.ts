import { ProfileAvatarColor } from '@/types';

export const PROFILE_AVATAR_COLORS: Record<ProfileAvatarColor, string> = {
  rose: 'from-rose-500 to-orange-400 ring-rose-400/30',
  violet: 'from-violet-500 to-fuchsia-400 ring-violet-400/30',
  blue: 'from-sky-500 to-cyan-400 ring-sky-400/30',
  emerald: 'from-emerald-500 to-lime-400 ring-emerald-400/30',
  amber: 'from-amber-400 to-yellow-200 ring-amber-300/30',
};

export function getProfileInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'W';
  return parts.slice(0, 2).map(part => part[0].toUpperCase()).join('');
}
