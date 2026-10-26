export interface TMDBRuntimeBounds {
  min?: number;
  max?: number;
}

export function buildTMDBDiscoverUrl(
  category: 'movie' | 'tv',
  apiKey: string,
  page: number,
  bounds?: TMDBRuntimeBounds,
): string {
  const params = new URLSearchParams({ api_key: apiKey, page: String(page), sort_by: 'popularity.desc' });
  if (bounds?.min !== undefined) params.set('with_runtime.gte', String(bounds.min));
  if (bounds?.max !== undefined) params.set('with_runtime.lte', String(bounds.max));
  return `https://api.themoviedb.org/3/discover/${category}?${params.toString()}`;
}
