import { sendDailyDigestEmail } from '../src/lib/email/index.js';

// Sample data for the digest email
const sampleFeaturedListings = [
  {
    id: 'sample-1',
    title: '2019 Heidelberg Speedmaster XL 106-8P+L',
    category: 'Offset Presses',
    imageUrl: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=600',
    currentPrice: 485000,
    bidCount: 12,
    endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    listingType: 'auction' as const,
    location: 'Chicago, IL',
  },
  {
    id: 'sample-2',
    title: 'Komori Lithrone G40 - 6 Color',
    category: 'Offset Presses',
    imageUrl: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600',
    currentPrice: 325000,
    bidCount: 8,
    endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    listingType: 'auction' as const,
    location: 'Dallas, TX',
  },
];

const sampleEndingSoonListings = [
  {
    id: 'sample-3',
    title: 'Pitney Bowes DI950 FastPac Inserter',
    category: 'Inserters',
    imageUrl: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=600',
    currentPrice: 28500,
    bidCount: 15,
    endTime: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
    listingType: 'auction' as const,
    location: 'Atlanta, GA',
  },
  {
    id: 'sample-4',
    title: 'Duplo DC-646 Slitter/Cutter/Creaser',
    category: 'Finishing Equipment',
    imageUrl: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=600',
    currentPrice: 12750,
    bidCount: 7,
    endTime: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours from now
    listingType: 'auction' as const,
    location: 'Phoenix, AZ',
  },
  {
    id: 'sample-5',
    title: 'Bell & Howell 6 Station Mailstar 400',
    category: 'Mailing Equipment',
    imageUrl: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=600',
    currentPrice: 8900,
    bidCount: 4,
    endTime: new Date(Date.now() + 12 * 60 * 60 * 1000),
    listingType: 'auction' as const,
    location: 'Denver, CO',
  },
  {
    id: 'sample-6',
    title: 'Neopost DS-200 Folder Inserter',
    category: 'Inserters',
    imageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600',
    currentPrice: 4200,
    bidCount: 9,
    endTime: new Date(Date.now() + 18 * 60 * 60 * 1000),
    listingType: 'auction' as const,
    location: 'Seattle, WA',
  },
];

const sampleNewListings = [
  {
    id: 'sample-7',
    title: 'Canon imagePRESS C10010VP - Low Meter',
    category: 'Digital Presses',
    imageUrl: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=600',
    currentPrice: 89500,
    listingType: 'fixed_price' as const,
    location: 'Los Angeles, CA',
  },
  {
    id: 'sample-8',
    title: 'Xerox Versant 180 Press',
    category: 'Digital Presses',
    imageUrl: 'https://images.unsplash.com/photo-1560264280-88b68371db39?w=600',
    currentPrice: 45000,
    bidCount: 0,
    endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    listingType: 'auction' as const,
    location: 'Miami, FL',
  },
  {
    id: 'sample-9',
    title: 'MBO K800 Folder with Right Angle',
    category: 'Folding Equipment',
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600',
    currentPrice: 18500,
    listingType: 'fixed_price' as const,
    location: 'Boston, MA',
  },
  {
    id: 'sample-10',
    title: 'Polar 115 XT Paper Cutter',
    category: 'Cutting Equipment',
    imageUrl: 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=600',
    currentPrice: 22000,
    bidCount: 2,
    endTime: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
    listingType: 'auction' as const,
    location: 'Portland, OR',
  },
];

async function main() {
  console.log('Sending sample daily digest email...\n');

  const result = await sendDailyDigestEmail({
    to: 'august@megaboxsupply.com',
    userName: 'August',
    featuredListings: sampleFeaturedListings,
    endingSoonListings: sampleEndingSoonListings,
    newListings: sampleNewListings,
    totalActiveListings: 347,
  });

  if (result.success) {
    console.log('✅ Email sent successfully!');
    console.log('   ID:', result.id);
  } else {
    console.log('❌ Failed to send email');
    console.log('   Error:', result.error);
  }
}

main().catch(console.error);
