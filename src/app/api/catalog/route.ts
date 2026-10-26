import { getCatalog, getCategoryFeed, getTitleDetails, MEDIA_CATEGORIES, searchAllCatalogs, searchCatalog } from '@/lib/catalog-server';
import { FilterState, MediaCategory, PresetMood } from '@/types';
import { ALL_PRESET_MOODS } from '@/lib/mock-data';

function numberParam(params: URLSearchParams, key: string): number | undefined {
  const raw = params.get(key);
  if (!raw) return undefined;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : undefined;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('mode') || 'list';

  if (mode === 'detail') {
    const id = searchParams.get('id');
    if (!id) return Response.json({ error: 'Missing title id' }, { status: 400 });
    return Response.json(await getTitleDetails(id));
  }

  if (mode === 'search') {
    const query = (searchParams.get('q') || '').trim().slice(0, 120);
    const requestedPage = Number(searchParams.get('page') || 1);
    const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
    return Response.json(await searchAllCatalogs(query, page));
  }

  const category = searchParams.get('category');
  if (!category || !MEDIA_CATEGORIES.includes(category as MediaCategory)) {
    return Response.json({ error: 'Invalid media category' }, { status: 400 });
  }

  if (mode === 'feed') {
    return Response.json(await getCategoryFeed(category as MediaCategory));
  }
  if (mode === 'discover') {
    const moods = (searchParams.get('moods') || '')
      .split(',')
      .filter((mood): mood is PresetMood => ALL_PRESET_MOODS.includes(mood as PresetMood));
    const acceptedSorts: FilterState['sortBy'][] = ['recommended', 'rating', 'release', 'title', 'shortest_time'];
    const requestedSort = searchParams.get('sortBy') as FilterState['sortBy'] | null;
    const filters: FilterState = {
      category: category as MediaCategory,
      searchQuery: (searchParams.get('q') || '').slice(0, 120),
      genres: (searchParams.get('genres') || '').split(',').filter(Boolean).slice(0, 10),
      moods,
      minRating: Math.min(5, numberParam(searchParams, 'minRating') ?? 0),
      maxRating: 5,
      releaseYearMin: numberParam(searchParams, 'releaseYearMin'),
      releaseYearMax: numberParam(searchParams, 'releaseYearMax'),
      maxTimeMinutes: numberParam(searchParams, 'maxTimeMinutes'),
      runtimeMinMinutes: numberParam(searchParams, 'runtimeMinMinutes'),
      runtimeMaxMinutes: numberParam(searchParams, 'runtimeMaxMinutes'),
      strictTimeOnly: true,
      platform: (searchParams.get('platform') || '').slice(0, 80) || undefined,
      seriesStatus: (searchParams.get('seriesStatus') || '').slice(0, 40) || undefined,
      sortBy: requestedSort && acceptedSorts.includes(requestedSort) ? requestedSort : 'recommended',
    };
    return Response.json(await searchCatalog(category as MediaCategory, filters, searchParams.get('cursor')));
  }
  if (mode === 'list') {
    const requestedPage = Number(searchParams.get('page') || 1);
    const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
    return Response.json(await getCatalog(category as MediaCategory, page));
  }
  return Response.json({ error: 'Invalid catalog mode' }, { status: 400 });
}
