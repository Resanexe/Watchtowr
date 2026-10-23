import { getCatalog, getCategoryFeed, getTitleDetails, MEDIA_CATEGORIES } from '@/lib/catalog-server';
import { MediaCategory } from '@/types';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('mode') || 'list';

  if (mode === 'detail') {
    const id = searchParams.get('id');
    if (!id) return Response.json({ error: 'Missing title id' }, { status: 400 });
    return Response.json(await getTitleDetails(id));
  }

  const category = searchParams.get('category');
  if (!category || !MEDIA_CATEGORIES.includes(category as MediaCategory)) {
    return Response.json({ error: 'Invalid media category' }, { status: 400 });
  }

  if (mode === 'feed') {
    return Response.json(await getCategoryFeed(category as MediaCategory));
  }
  if (mode === 'list') {
    const requestedPage = Number(searchParams.get('page') || 1);
    const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
    return Response.json(await getCatalog(category as MediaCategory, page));
  }
  return Response.json({ error: 'Invalid catalog mode' }, { status: 400 });
}
