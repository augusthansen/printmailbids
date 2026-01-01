'use client';

// Scrolling banner of top print & mail equipment manufacturers
// Using text-based logos for now - can be replaced with actual logo images

const manufacturers = [
  { name: 'BlueCrest', slug: 'bluecrest' },
  { name: 'Bell + Howell', slug: 'bell-howell' },
  { name: 'Kirk-Rudy', slug: 'kirk-rudy' },
  { name: 'Pitney Bowes', slug: 'pitney-bowes' },
  { name: 'Heidelberg', slug: 'heidelberg' },
  { name: 'Kodak', slug: 'kodak' },
  { name: 'MBO', slug: 'mbo' },
  { name: 'Mailcrafters', slug: 'mailcrafters' },
  { name: 'Buskro', slug: 'buskro' },
  { name: 'Neopost', slug: 'neopost' },
  { name: 'Quadient', slug: 'quadient' },
  { name: 'Ricoh', slug: 'ricoh' },
  { name: 'Canon', slug: 'canon' },
  { name: 'Xerox', slug: 'xerox' },
  { name: 'Konica Minolta', slug: 'konica-minolta' },
  { name: 'HP Indigo', slug: 'hp-indigo' },
  { name: 'Horizon', slug: 'horizon' },
  { name: 'Duplo', slug: 'duplo' },
  { name: 'Standard Horizon', slug: 'standard-horizon' },
  { name: 'Muller Martini', slug: 'muller-martini' },
];

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
        <div className="flex animate-scroll">
          {scrollingManufacturers.map((manufacturer, index) => (
            <div
              key={`${manufacturer.slug}-${index}`}
              className="flex-shrink-0 px-8 sm:px-12"
            >
              <span className="text-xl sm:text-2xl font-bold text-slate-400 hover:text-slate-600 transition-colors whitespace-nowrap">
                {manufacturer.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
