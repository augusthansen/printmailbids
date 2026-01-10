'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ChevronRight, ChevronLeft, Printer } from 'lucide-react';

interface FeaturedListing {
  id: string;
  title: string;
  starting_price: number | null;
  current_price: number | null;
  listing_type: string;
  status: string;
  end_time: string | null;
  images: { url: string; is_primary: boolean }[];
}

interface FeaturedCarouselProps {
  listings: FeaturedListing[];
}

export function FeaturedCarousel({ listings }: FeaturedCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % listings.length);
  }, [listings.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + listings.length) % listings.length);
  }, [listings.length]);

  // Auto-advance slides
  useEffect(() => {
    if (!isAutoPlaying || listings.length <= 1) return;

    const interval = setInterval(() => {
      nextSlide();
    }, 5000); // 5 seconds per slide

    return () => clearInterval(interval);
  }, [isAutoPlaying, nextSlide, listings.length]);

  // Pause auto-play on hover
  const handleMouseEnter = () => setIsAutoPlaying(false);
  const handleMouseLeave = () => setIsAutoPlaying(true);

  if (listings.length === 0) {
    // Fallback when no featured listings
    return (
      <div className="relative bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-xl sm:rounded-2xl p-0.5 sm:p-1 shadow-xl sm:shadow-2xl">
        <div className="bg-slate-900 rounded-lg sm:rounded-xl overflow-hidden">
          <div className="aspect-[16/9] sm:aspect-[4/3] bg-gradient-to-br from-slate-700 to-slate-800 relative overflow-hidden">
            <div className="w-full h-full flex items-center justify-center">
              <Printer className="h-12 w-12 sm:h-16 sm:w-16 text-slate-500" />
            </div>
          </div>
          <div className="p-4 sm:p-6">
            <div className="flex items-start justify-between gap-4 mb-3 sm:mb-4">
              <div>
                <p className="text-blue-400 text-xs sm:text-sm font-medium mb-1">Featured Listing</p>
                <h3 className="text-base sm:text-lg font-semibold text-white">Browse Our Listings</h3>
                <p className="text-slate-400 text-xs sm:text-sm">Premium Equipment Available</p>
              </div>
            </div>
            <Link
              href="/marketplace"
              className="mt-4 sm:mt-6 w-full inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 sm:py-3 rounded-lg font-medium transition-colors text-sm sm:text-base"
            >
              View Marketplace
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentListing = listings[currentIndex];
  const currentImage = currentListing?.images?.find(img => img.is_primary)?.url || currentListing?.images?.[0]?.url;
  const currentPrice = currentListing?.current_price || currentListing?.starting_price || 0;

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Decorative elements - hidden on mobile for cleaner look */}
      <div className="hidden sm:block absolute -top-4 -right-4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />
      <div className="hidden sm:block absolute -bottom-8 -left-8 w-48 h-48 bg-slate-700/50 rounded-full blur-2xl" />

      {/* Card */}
      <div className="relative bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-xl sm:rounded-2xl p-0.5 sm:p-1 shadow-xl sm:shadow-2xl">
        <div className="bg-slate-900 rounded-lg sm:rounded-xl overflow-hidden">
          {/* Image with transition - 16:9 on mobile, 4:3 on desktop */}
          <div className="aspect-[16/9] sm:aspect-[4/3] bg-gradient-to-br from-slate-700 to-slate-800 relative overflow-hidden">
            {currentImage ? (
              <img
                key={currentListing.id}
                src={currentImage}
                alt={currentListing?.title || 'Featured Listing'}
                className="w-full h-full object-cover transition-opacity duration-500"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Printer className="h-12 w-12 sm:h-16 sm:w-16 text-slate-500" />
              </div>
            )}

            {/* Live badge */}
            <div className="absolute top-2 sm:top-4 left-2 sm:left-4 flex items-center gap-1.5 sm:gap-2 bg-red-500/90 backdrop-blur px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-white text-[10px] sm:text-xs font-semibold">
              <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-white animate-pulse" />
              LIVE
            </div>

            {/* Navigation arrows (show only if multiple listings) */}
            {listings.length > 1 && (
              <>
                <button
                  onClick={prevSlide}
                  className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                  aria-label="Previous listing"
                >
                  <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                  aria-label="Next listing"
                >
                  <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              </>
            )}

            {/* Slide indicators */}
            {listings.length > 1 && (
              <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 sm:gap-2">
                {listings.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
                      index === currentIndex
                        ? 'bg-white w-4 sm:w-6'
                        : 'bg-white/50 hover:bg-white/75 w-1.5 sm:w-2'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Card content */}
          <div className="p-4 sm:p-6">
            <div className="flex items-start justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
              <div className="min-w-0 flex-1">
                <p className="text-blue-400 text-xs sm:text-sm font-medium mb-0.5 sm:mb-1">
                  Featured {listings.length > 1 ? `(${currentIndex + 1}/${listings.length})` : ''}
                </p>
                <h3 className="text-sm sm:text-lg font-semibold text-white line-clamp-2 sm:truncate">{currentListing?.title || 'Browse Our Listings'}</h3>
              </div>
            </div>

            <div className="flex items-end justify-between pt-3 sm:pt-4 border-t border-slate-700/50">
              <div>
                <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider mb-0.5 sm:mb-1">Price</p>
                <p className="text-xl sm:text-3xl font-bold text-emerald-400">${currentPrice.toLocaleString()}</p>
              </div>
              <Link
                href={`/listing/${currentListing.id}`}
                className="inline-flex items-center gap-1.5 sm:gap-2 bg-blue-600 hover:bg-blue-500 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg font-medium transition-colors text-xs sm:text-sm"
              >
                View
                <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Progress bar for auto-advance */}
      {listings.length > 1 && isAutoPlaying && (
        <div className="absolute -bottom-1 sm:-bottom-2 left-0 right-0 h-0.5 sm:h-1 bg-slate-700/50 rounded-full overflow-hidden">
          <div
            key={currentIndex}
            className="h-full bg-blue-500 animate-progress-bar"
            style={{ animationDuration: '5s' }}
          />
        </div>
      )}
    </div>
  );
}
