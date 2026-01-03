'use client';

import Image from 'next/image';
import { useState } from 'react';

// Scrolling banner of top print & mail equipment manufacturers
// Uses logo images from public/logos folder with text fallback

const manufacturers = [
  { name: 'BlueCrest', slug: 'bluecrest', domain: 'bluecrestinc.com' },
  { name: 'Bell + Howell', slug: 'bell-howell', domain: 'bellhowell.net' },
  { name: 'Kirk-Rudy', slug: 'kirk-rudy', domain: 'kirkrudy.com' },
  { name: 'Pitney Bowes', slug: 'pitney-bowes', domain: 'pitneybowes.com' },
  { name: 'Heidelberg', slug: 'heidelberg', domain: 'heidelberg.com' },
  { name: 'Kodak', slug: 'kodak', domain: 'kodak.com' },
  { name: 'MBO', slug: 'mbo', domain: 'mbo-folder.com' },
  { name: 'Mailcrafters', slug: 'mailcrafters', domain: 'mailcrafters.com' },
  { name: 'Buskro', slug: 'buskro', domain: 'buskro.com' },
  { name: 'Neopost', slug: 'neopost', domain: 'neopost.com' },
  { name: 'Quadient', slug: 'quadient', domain: 'quadient.com' },
  { name: 'Ricoh', slug: 'ricoh', domain: 'ricoh.com' },
  { name: 'Canon', slug: 'canon', domain: 'canon.com' },
  { name: 'Xerox', slug: 'xerox', domain: 'xerox.com' },
  { name: 'Konica Minolta', slug: 'konica-minolta', domain: 'konicaminolta.com' },
  { name: 'HP Indigo', slug: 'hp-indigo', domain: 'hp.com' },
  { name: 'Horizon', slug: 'horizon', domain: 'horizonintl.com' },
  { name: 'Duplo', slug: 'duplo', domain: 'duplousa.com' },
  { name: 'Standard Horizon', slug: 'standard-horizon', domain: 'standardhorizon.com' },
  { name: 'Muller Martini', slug: 'muller-martini', domain: 'mullermartini.com' },
];

function ManufacturerLogo({ name, slug, domain }: { name: string; slug: string; domain: string }) {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="flex items-center gap-3 group">
      {!imageError && (
        <Image
          src={`/logos/${slug}.png`}
          alt={name}
          width={48}
          height={48}
          className="h-10 w-10 sm:h-12 sm:w-12 object-contain rounded grayscale"
          onError={() => setImageError(true)}
        />
      )}
      <span className="text-lg sm:text-xl font-bold text-slate-400 whitespace-nowrap">
        {name}
      </span>
    </div>
  );
}

export function ManufacturerBanner() {
  // Double the array for seamless infinite scroll
  const scrollingManufacturers = [...manufacturers, ...manufacturers];

  return (
    <section className="py-8 bg-white border-y border-stone-200 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <p className="text-center text-sm font-medium text-slate-500 uppercase tracking-wider">
          Equipment from the brands you trust
        </p>
      </div>

      <div className="relative">
        {/* Gradient fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-white to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white to-transparent z-10" />

        {/* Scrolling container */}
        <div className="flex items-center animate-scroll">
          {scrollingManufacturers.map((manufacturer, index) => (
            <div
              key={`${manufacturer.slug}-${index}`}
              className="flex-shrink-0 px-8 sm:px-12 flex items-center justify-center h-12"
            >
              <ManufacturerLogo
                name={manufacturer.name}
                slug={manufacturer.slug}
                domain={manufacturer.domain}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
