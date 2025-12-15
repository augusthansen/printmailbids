import { redirect } from 'next/navigation';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  // Redirect to marketplace with category filter
  redirect(`/marketplace?category=${slug}`);
}
