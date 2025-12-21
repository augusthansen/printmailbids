import Link from 'next/link';
import { Home, Search, ArrowLeft } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="min-h-[60vh] bg-stone-50 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full text-center">
          <div className="text-8xl font-bold text-slate-200 mb-4">404</div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Page Not Found</h1>
          <p className="text-slate-600 mb-8">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
            >
              <Home className="h-4 w-4" />
              Go Home
            </Link>
            <Link
              href="/marketplace"
              className="inline-flex items-center justify-center gap-2 bg-slate-200 text-slate-700 px-6 py-3 rounded-xl font-medium hover:bg-slate-300 transition-colors"
            >
              <Search className="h-4 w-4" />
              Browse Listings
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
