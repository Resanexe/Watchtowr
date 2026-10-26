'use client';

import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  Bookmark,
  Camera,
  Check,
  ChevronRight,
  Clapperboard,
  Gamepad2,
  Heart,
  Pencil,
  Settings2,
  Sparkles,
  Star,
  Tv,
  X,
} from 'lucide-react';
import { CustomizeModal } from '@/components/CustomizeModal';
import { Footer } from '@/components/Footer';
import { Navbar } from '@/components/Navbar';
import { DEFAULT_PREFERENCES, GUEST_USER, STORAGE_KEYS, UserSession, deleteAccountData, normalizePreferences, normalizeSession, resetRecommendationHistory, saveStoredPreferences, saveStoredSession } from '@/lib/storage';
import { getProfileInitials, PROFILE_AVATAR_COLORS } from '@/lib/profile-utils';
import { useHydrated } from '@/lib/use-hydrated';
import { useStoredValue } from '@/lib/use-stored-value';
import { MediaCategory, MyListItem, PresetMood, UserFeedback, UserReview } from '@/types';

const EMPTY_LIST: MyListItem[] = [];
const EMPTY_REVIEWS: UserReview[] = [];
const EMPTY_FEEDBACK: UserFeedback[] = [];
const CATEGORY_LABELS: Record<MediaCategory, string> = {
  movie: 'Movies',
  tv: 'TV shows',
  anime: 'Anime',
  game: 'Games',
};
const CATEGORY_ICONS = {
  movie: Clapperboard,
  tv: Tv,
  anime: Sparkles,
  game: Gamepad2,
} satisfies Record<MediaCategory, React.ComponentType<{ className?: string }>>;

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}

function titleLink(review: UserReview): string {
  return `/title/${encodeURIComponent(review.mediaId)}`;
}

function resizeAvatarImage(file: File): Promise<string> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    return Promise.reject(new Error('Choose a JPG, PNG, or WebP image.'));
  }
  if (file.size > 10 * 1024 * 1024) {
    return Promise.reject(new Error('Choose an image smaller than 10 MB.'));
  }

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new window.Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const size = 256;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext('2d');
      if (!context) {
        reject(new Error('This browser could not process the image.'));
        return;
      }
      const scale = Math.max(size / image.naturalWidth, size / image.naturalHeight);
      const width = image.naturalWidth * scale;
      const height = image.naturalHeight * scale;
      try {
        context.drawImage(image, (size - width) / 2, (size - height) / 2, width, height);
        let quality = 0.82;
        let resized = canvas.toDataURL('image/jpeg', quality);
        while (resized.length > 340_000 && quality > 0.5) {
          quality -= 0.1;
          resized = canvas.toDataURL('image/jpeg', quality);
        }
        if (resized.length > 340_000) {
          reject(new Error('This image is too detailed to store. Try a simpler or smaller picture.'));
          return;
        }
        resolve(resized);
      } catch {
        reject(new Error('This image could not be saved. Try another one.'));
      }
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('This image could not be opened. Try another one.'));
    };
    image.src = objectUrl;
  });
}

export default function ProfilePage() {
  const hydrated = useHydrated();
  const storedSession = useStoredValue(STORAGE_KEYS.session, GUEST_USER);
  const session = useMemo(() => normalizeSession(storedSession), [storedSession]);
  const storedPreferences = useStoredValue(STORAGE_KEYS.preferences, DEFAULT_PREFERENCES);
  const preferences = useMemo(() => normalizePreferences(storedPreferences), [storedPreferences]);
  const myList = useStoredValue(STORAGE_KEYS.myList, EMPTY_LIST);
  const reviews = useStoredValue(STORAGE_KEYS.reviews, EMPTY_REVIEWS);
  const feedback = useStoredValue(STORAGE_KEYS.feedback, EMPTY_FEEDBACK);
  const [isEditing, setIsEditing] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [displayName, setDisplayName] = useState(session.displayName);
  const [username, setUsername] = useState(session.username);
  const [bio, setBio] = useState(session.bio);
  const [avatarColor, setAvatarColor] = useState(session.avatarColor);
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | undefined>(session.avatarDataUrl);

  useEffect(() => {
    setDisplayName(session.displayName);
    setUsername(session.username);
    setBio(session.bio);
    setAvatarColor(session.avatarColor);
    setAvatarDataUrl(session.avatarDataUrl);
  }, [session]);

  const sortedReviews = useMemo(
    () => [...reviews].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [reviews],
  );
  const counts = useMemo(() => ({
    saved: myList.length,
    completed: myList.filter(item => item.status === 'completed').length,
    inProgress: myList.filter(item => item.status === 'in_progress').length,
    reviews: reviews.length,
    feedback: feedback.length,
  }), [feedback.length, myList, reviews.length]);

  const categoryCounts = useMemo(() => myList.reduce<Record<MediaCategory, number>>((result, item) => {
    result[item.category] += 1;
    return result;
  }, { movie: 0, tv: 0, anime: 0, game: 0 }), [myList]);

  const handleSaveProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanName = displayName.trim();
    const cleanUsername = username.trim().replace(/^@+/, '').replace(/\s+/g, '_');
    if (!cleanName || !cleanUsername) {
      setSaveError('Add a display name and username to save your profile.');
      return;
    }
    const updatedSession: UserSession = {
      ...session,
      displayName: cleanName,
      username: cleanUsername,
      bio: bio.trim(),
      avatarColor,
      avatarDataUrl,
    };
    try {
      saveStoredSession(updatedSession);
      setSaveError('');
      setIsEditing(false);
    } catch {
      setSaveError('Could not save this profile picture. Try a smaller image or remove the picture.');
    }
  };

  const handleAvatarFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const resized = await resizeAvatarImage(file);
      setAvatarDataUrl(resized);
      setSaveError('');
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'This image could not be opened.');
    }
  };

  const handleResetHistory = () => {
    resetRecommendationHistory();
  };

  const handleDeleteLocalData = () => {
    deleteAccountData();
    setIsPreferencesOpen(false);
    setIsEditing(false);
  };

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-[#0B0D11] text-zinc-100 flex flex-col">
        <div className="flex-1 animate-pulse" />
      </div>
    );
  }

  const avatarClass = PROFILE_AVATAR_COLORS[session.avatarColor];
  const initials = getProfileInitials(session.displayName);

  return (
    <div className="min-h-screen bg-[#0B0D11] text-zinc-100 flex flex-col selection:bg-[#BE123C] selection:text-white">
      <Navbar />
      <main className="mx-auto w-full max-w-[1760px] flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-6 flex items-center gap-2 text-xs text-zinc-500">
          <Link href="/" className="hover:text-zinc-200">Home</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-zinc-300">Profile</span>
        </div>

        <section className="relative overflow-hidden rounded-[28px] border border-zinc-800 bg-[#11141c]">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(190,18,60,0.24),_transparent_48%)]" />
          <div className="relative flex flex-col gap-7 p-6 sm:p-9 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
              <div className={`flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatarClass} p-[3px] ring-1`}>
                <span role="img" aria-label={`${session.displayName} profile picture`} className="flex h-full w-full items-center justify-center rounded-full bg-[#11141c] bg-cover bg-center text-2xl font-bold tracking-wide text-white" style={session.avatarDataUrl ? { backgroundImage: `url("${session.avatarDataUrl}")` } : undefined}>
                  {!session.avatarDataUrl && initials}
                </span>
              </div>
              <div>
                <p className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-rose-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-400" /> Your Watchtowr profile
                </p>
                <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">{session.displayName}</h1>
                <p className="mt-1 text-sm text-zinc-400">@{session.username}</p>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-300">
                  {session.bio || 'Add a little note about what you love watching and playing.'}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px]">
                  <span className="rounded-full border border-zinc-700 bg-zinc-900/70 px-3 py-1.5 text-zinc-300">
                    {session.isGuest ? 'Guest profile' : 'Local demo profile'}
                  </span>
                  <span className="rounded-full border border-zinc-700 bg-zinc-900/70 px-3 py-1.5 text-zinc-400">Saved in this browser</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsEditing(value => !value)}
              className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-zinc-700 bg-zinc-900/70 px-4 py-2.5 text-xs font-semibold text-zinc-200 transition hover:border-zinc-500 hover:text-white lg:self-auto"
            >
              {isEditing ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
              {isEditing ? 'Close editor' : 'Edit profile'}
            </button>
          </div>
        </section>

        {isEditing && (
          <form onSubmit={handleSaveProfile} className="mt-5 rounded-2xl border border-zinc-800 bg-[#11141c] p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-white">Edit your profile</h2>
                <p className="mt-1 text-xs text-zinc-500">These details are stored locally in this browser.</p>
              </div>
              <button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-[#BE123C] px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-700">
                <Check className="h-4 w-4" /> Save changes
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5 text-xs text-zinc-400">
                Display name
                <input value={displayName} onChange={event => setDisplayName(event.target.value)} maxLength={48} className="w-full rounded-lg border border-zinc-700 bg-[#0b0d11] px-3 py-2.5 text-sm text-white outline-none focus:border-rose-500" />
              </label>
              <label className="space-y-1.5 text-xs text-zinc-400">
                Username
                <input value={username} onChange={event => setUsername(event.target.value)} maxLength={30} className="w-full rounded-lg border border-zinc-700 bg-[#0b0d11] px-3 py-2.5 text-sm text-white outline-none focus:border-rose-500" />
              </label>
              <label className="space-y-1.5 text-xs text-zinc-400 sm:col-span-2">
                Bio
                <textarea value={bio} onChange={event => setBio(event.target.value)} maxLength={160} rows={3} placeholder="What do you love watching or playing?" className="w-full resize-y rounded-lg border border-zinc-700 bg-[#0b0d11] px-3 py-2.5 text-sm text-white outline-none focus:border-rose-500" />
                <span className="block text-right text-[10px] text-zinc-600">{bio.length}/160</span>
              </label>
            </div>
            <div className="mt-4">
              <p className="mb-2 text-xs text-zinc-400">Profile picture</p>
              <div className="flex flex-wrap items-center gap-3">
                <div className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${PROFILE_AVATAR_COLORS[avatarColor]} p-[2px] ring-1`}>
                  <span className="flex h-full w-full items-center justify-center rounded-full bg-[#11141c] bg-cover bg-center text-sm font-bold text-white" style={avatarDataUrl ? { backgroundImage: `url("${avatarDataUrl}")` } : undefined}>
                    {!avatarDataUrl && getProfileInitials(displayName || session.displayName)}
                  </span>
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-200 transition hover:border-zinc-500 hover:text-white">
                  <Camera className="h-3.5 w-3.5" /> Choose picture
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarFile} className="sr-only" />
                </label>
                {avatarDataUrl && <button type="button" onClick={() => setAvatarDataUrl(undefined)} className="text-xs text-zinc-400 underline decoration-zinc-700 underline-offset-4 hover:text-white">Remove picture</button>}
                <span className="text-[10px] text-zinc-600">JPG, PNG or WebP · max 10 MB</span>
              </div>
              <p className="mb-2 mt-4 text-xs text-zinc-400">Or pick an avatar color</p>
              <div className="flex gap-2">
                {(Object.keys(PROFILE_AVATAR_COLORS) as (keyof typeof PROFILE_AVATAR_COLORS)[]).map(color => (
                  <button key={color} type="button" onClick={() => setAvatarColor(color)} aria-label={`${color} avatar`} aria-pressed={avatarColor === color} className={`h-8 w-8 rounded-full bg-gradient-to-br ${PROFILE_AVATAR_COLORS[color]} ring-1 transition ${avatarColor === color ? 'scale-110 ring-2 ring-white' : 'opacity-70 hover:opacity-100'}`} />
                ))}
              </div>
            </div>
            {saveError && <p role="alert" className="mt-3 text-xs text-rose-300">{saveError}</p>}
          </form>
        )}

        <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: 'Saved titles', value: counts.saved, icon: Bookmark, accent: 'text-rose-300 bg-rose-500/10' },
            { label: 'Completed', value: counts.completed, icon: Check, accent: 'text-emerald-300 bg-emerald-500/10' },
            { label: 'In progress', value: counts.inProgress, icon: Activity, accent: 'text-sky-300 bg-sky-500/10' },
            { label: 'Reviews', value: counts.reviews, icon: Star, accent: 'text-amber-300 bg-amber-500/10' },
          ].map(stat => (
            <div key={stat.label} className="rounded-2xl border border-zinc-800 bg-[#11141c] p-4 sm:p-5">
              <div className={`mb-4 flex h-9 w-9 items-center justify-center rounded-xl ${stat.accent}`}><stat.icon className="h-4 w-4" /></div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="mt-1 text-xs text-zinc-500">{stat.label}</p>
            </div>
          ))}
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-2xl border border-zinc-800 bg-[#11141c] p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Your collection</p>
                <h2 className="mt-1 text-lg font-bold text-white">MyList by category</h2>
              </div>
              <Link href="/mylist" className="inline-flex items-center gap-1 text-xs font-semibold text-rose-300 hover:text-rose-200">Open MyList <ArrowRight className="h-3.5 w-3.5" /></Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {(['movie', 'tv', 'anime', 'game'] as MediaCategory[]).map(category => {
                const Icon = CATEGORY_ICONS[category];
                return (
                  <Link key={category} href={`/mylist?category=${category}`} className="group flex items-center justify-between rounded-xl border border-zinc-800 bg-[#0c0f15] p-4 transition hover:border-zinc-600">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-800/80 text-zinc-300"><Icon className="h-4 w-4" /></span>
                      <span className="text-xs font-medium text-zinc-300">{CATEGORY_LABELS[category]}</span>
                    </div>
                    <span className="text-sm font-bold text-white group-hover:text-rose-200">{categoryCounts[category]}</span>
                  </Link>
                );
              })}
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-zinc-800 pt-4 text-xs">
              <span className="text-zinc-500">{counts.feedback} feedback signals shaping your feed</span>
              <button type="button" onClick={() => setIsPreferencesOpen(true)} className="inline-flex items-center gap-1.5 font-semibold text-zinc-300 hover:text-white"><Settings2 className="h-3.5 w-3.5" /> Preferences</button>
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-800 bg-[#11141c] p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Recommendation profile</p>
                <h2 className="mt-1 text-lg font-bold text-white">Your taste</h2>
              </div>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300"><Heart className="h-4 w-4" /></span>
            </div>
            <div className="space-y-4">
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">Favorite genres</p>
                <div className="flex flex-wrap gap-1.5">
                  {preferences.preferredGenres.length ? preferences.preferredGenres.slice(0, 8).map(genre => <span key={genre} className="rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-[10px] text-zinc-300">{genre}</span>) : <span className="text-xs text-zinc-500">No genres selected yet</span>}
                </div>
              </div>
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">Favorite moods</p>
                <div className="flex flex-wrap gap-1.5">
                  {preferences.preferredMoods.length ? preferences.preferredMoods.map((mood: PresetMood) => <span key={mood} className="rounded-full border border-rose-900/60 bg-rose-950/40 px-2.5 py-1 text-[10px] text-rose-200">{mood}</span>) : <span className="text-xs text-zinc-500">No moods selected yet</span>}
                </div>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-[#0c0f15] px-3.5 py-3 text-xs">
                <span className="text-zinc-400">Minimum rating</span>
                <span className="inline-flex items-center gap-1 font-semibold text-white"><Star className="h-3.5 w-3.5 fill-amber-300 text-amber-300" /> {preferences.minRating.toFixed(1)} / 5</span>
              </div>
              <button type="button" onClick={() => setIsPreferencesOpen(true)} className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 px-4 py-2.5 text-xs font-semibold text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-900">
                Tune recommendations <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </section>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-zinc-800 bg-[#11141c] p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Keep your place</p>
                <h2 className="mt-1 text-lg font-bold text-white">Continue watching & playing</h2>
              </div>
              <Link href="/mylist" aria-label="View all saved titles" className="text-zinc-400 hover:text-white"><ArrowRight className="h-4 w-4" /></Link>
            </div>
            {myList.filter(item => item.status === 'in_progress').length ? (
              <div className="space-y-2">
                {myList.filter(item => item.status === 'in_progress').slice(0, 5).map(item => (
                  <Link key={item.mediaId} href={`/title/${encodeURIComponent(item.mediaId)}`} className="flex items-center justify-between rounded-xl border border-zinc-800 bg-[#0c0f15] px-4 py-3 transition hover:border-zinc-600">
                    <span className="truncate pr-4 text-sm font-medium text-zinc-200">{item.title}</span>
                    <span className="shrink-0 rounded-full bg-sky-500/10 px-2.5 py-1 text-[10px] font-semibold text-sky-200">{CATEGORY_LABELS[item.category]}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-zinc-800 px-4 py-8 text-center">
                <p className="text-sm font-medium text-zinc-300">Nothing in progress yet</p>
                <p className="mt-1 text-xs text-zinc-500">Move a saved title to In Progress to keep it handy here.</p>
                <Link href="/mylist" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-rose-300 hover:text-rose-200">Go to MyList <ArrowRight className="h-3.5 w-3.5" /></Link>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-zinc-800 bg-[#11141c] p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Your notes</p>
                <h2 className="mt-1 text-lg font-bold text-white">Recent reviews</h2>
              </div>
              <span className="text-xs text-zinc-500">{reviews.length} total</span>
            </div>
            {sortedReviews.length ? (
              <div className="space-y-3">
                {sortedReviews.slice(0, 3).map(review => (
                  <Link key={review.id} href={titleLink(review)} className="block rounded-xl border border-zinc-800 bg-[#0c0f15] p-4 transition hover:border-zinc-600">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">{review.title}</p>
                        <p className="mt-1 text-[10px] text-zinc-500">{CATEGORY_LABELS[review.category]} · {formatDate(review.updatedAt)}</p>
                      </div>
                      <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-amber-200"><Star className="h-3.5 w-3.5 fill-amber-300 text-amber-300" /> {review.rating.toFixed(1)}</span>
                    </div>
                    {review.reviewText && <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-zinc-400">{review.reviewText}</p>}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-zinc-800 px-4 py-8 text-center">
                <p className="text-sm font-medium text-zinc-300">Your reviews will show up here</p>
                <p className="mt-1 text-xs text-zinc-500">Rate a title and leave a note to start building your review history.</p>
                <Link href="/discover" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-rose-300 hover:text-rose-200">Find something to review <ArrowRight className="h-3.5 w-3.5" /></Link>
              </div>
            )}
          </section>
        </div>

        <p className="mt-7 text-center text-[11px] leading-relaxed text-zinc-600">
          Profile details and activity stay in this browser. Watchtowr does not currently provide account sign-in or sync across devices.
        </p>
      </main>
      <Footer />
      <CustomizeModal
        key={JSON.stringify(preferences)}
        isOpen={isPreferencesOpen}
        onClose={() => setIsPreferencesOpen(false)}
        preferences={preferences}
        onSavePreferences={saveStoredPreferences}
        onResetHistory={handleResetHistory}
        onDeleteAccount={handleDeleteLocalData}
        isGuest={session.isGuest}
      />
    </div>
  );
}
