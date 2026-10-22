import { redirect } from 'next/navigation';

interface CategoryPageProps {
  params: Promise<{
    category: string;
  }>;
}

const CATEGORY_MAP: Record<string, string> = {
  games: 'game',
  anime: 'anime',
  movies: 'movie',
  tv: 'tv',
};

export default async function CategoryRedirectPage({ params }: CategoryPageProps) {
  const resolvedParams = await params;
  const cat = resolvedParams.category.toLowerCase();

  if (CATEGORY_MAP[cat]) {
    redirect(`/discover?cat=${CATEGORY_MAP[cat]}`);
  }

  redirect('/');
}
