import { Star, Quote } from 'lucide-react';

// Placeholder testimonials - replace with real ones when available
const testimonials = [
  {
    id: 1,
    quote: "We sold our Heidelberg press in just 2 weeks. The process was incredibly smooth, and the 8% buyer premium meant we got more interest than on other platforms.",
    author: "Coming Soon",
    company: "Print Shop Owner",
    location: "Texas",
    equipment: "Heidelberg SM52",
    soldPrice: "$45,000",
    rating: 5,
    isPlaceholder: true,
  },
  {
    id: 2,
    quote: "The built-in messaging and shipping tracking made coordinating the sale so much easier. No more back-and-forth emails with buyers.",
    author: "Coming Soon",
    company: "Fulfillment Center",
    location: "Ohio",
    equipment: "BlueCrest Inserter",
    soldPrice: "$28,000",
    rating: 5,
    isPlaceholder: true,
  },
  {
    id: 3,
    quote: "As a buyer, I appreciate the transparent pricing. I know exactly what I'm paying upfront - no surprise fees at checkout.",
    author: "Coming Soon",
    company: "Mail Services Co.",
    location: "California",
    equipment: "Kirk-Rudy Inkjet",
    soldPrice: "$12,500",
    rating: 5,
    isPlaceholder: true,
  },
];

export function Testimonials() {
  return (
    <section className="py-20 bg-slate-900 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-6">
            Customer Stories
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Trusted by industry professionals
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            See why print and mail businesses choose PrintMailBids to buy and sell their equipment.
          </p>
        </div>

        {/* Testimonial cards */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="relative bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 lg:p-8 border border-slate-700/50 hover:border-blue-500/30 transition-all duration-300"
            >
              {/* Quote icon */}
              <Quote className="h-8 w-8 text-blue-500/30 mb-4" />

              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                ))}
              </div>

              {/* Quote */}
              <blockquote className="text-slate-300 mb-6 leading-relaxed">
                "{testimonial.quote}"
              </blockquote>

              {/* Equipment sold badge */}
              <div className="bg-slate-700/50 rounded-lg p-3 mb-6">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Equipment:</span>
                  <span className="text-white font-medium">{testimonial.equipment}</span>
                </div>
                <div className="flex justify-between items-center text-sm mt-1">
                  <span className="text-slate-400">Sold for:</span>
                  <span className="text-emerald-400 font-bold">{testimonial.soldPrice}</span>
                </div>
              </div>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                  {testimonial.isPlaceholder ? '?' : testimonial.author.charAt(0)}
                </div>
                <div>
                  <p className="text-white font-medium">
                    {testimonial.isPlaceholder ? (
                      <span className="text-slate-500 italic">Your story here</span>
                    ) : (
                      testimonial.author
                    )}
                  </p>
                  <p className="text-sm text-slate-400">
                    {testimonial.company} · {testimonial.location}
                  </p>
                </div>
              </div>

              {/* Placeholder notice */}
              {testimonial.isPlaceholder && (
                <div className="absolute top-4 right-4">
                  <span className="text-xs text-slate-500 bg-slate-700/50 px-2 py-1 rounded">
                    Example
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bottom text */}
        <p className="text-center text-slate-500 mt-10 text-sm">
          Be one of our first success stories.{' '}
          <a href="/sell" className="text-blue-400 hover:text-blue-300 underline">
            List your equipment today
          </a>
        </p>
      </div>
    </section>
  );
}
