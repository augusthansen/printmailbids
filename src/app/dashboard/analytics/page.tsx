'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  BarChart3,
  Eye,
  Play,
  Heart,
  Gavel,
  DollarSign,
  Share2,
  TrendingUp,
  Loader2,
  Package,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import Link from 'next/link';

interface ListingAnalytics {
  id: string;
  title: string;
  status: string;
  views: number;
  video_plays: number;
  watchlist_adds: number;
  bid_clicks: number;
  offer_clicks: number;
  shares: number;
  created_at: string;
}

interface OverallStats {
  total_views: number;
  total_video_plays: number;
  total_watchlist_adds: number;
  total_bid_clicks: number;
  total_offer_clicks: number;
  total_shares: number;
  views_last_7_days: number;
  views_previous_7_days: number;
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [listingAnalytics, setListingAnalytics] = useState<ListingAnalytics[]>([]);
  const [overallStats, setOverallStats] = useState<OverallStats | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('30d');

  useEffect(() => {
    async function loadAnalytics() {
      if (!user?.id) return;

      setLoading(true);

      try {
        // Get all listings for this seller
        const { data: listings } = await supabase
          .from('listings')
          .select('id, title, status, created_at')
          .eq('seller_id', user.id)
          .order('created_at', { ascending: false });

        if (!listings || listings.length === 0) {
          setLoading(false);
          return;
        }

        const listingIds = listings.map((l: { id: string }) => l.id);

        // Calculate date range
        const now = new Date();
        let startDate: Date | null = null;
        if (timeRange === '7d') {
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        } else if (timeRange === '30d') {
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }

        // Get events for all listings
        let eventsQuery = supabase
          .from('listing_events')
          .select('listing_id, event_type, created_at')
          .in('listing_id', listingIds);

        if (startDate) {
          eventsQuery = eventsQuery.gte('created_at', startDate.toISOString());
        }

        const { data: events } = await eventsQuery;

        // Calculate per-listing stats
        const statsMap = new Map<string, {
          views: number;
          video_plays: number;
          watchlist_adds: number;
          bid_clicks: number;
          offer_clicks: number;
          shares: number;
        }>();

        // Initialize all listings with zero counts
        listingIds.forEach((id: string) => {
          statsMap.set(id, {
            views: 0,
            video_plays: 0,
            watchlist_adds: 0,
            bid_clicks: 0,
            offer_clicks: 0,
            shares: 0,
          });
        });

        // Count events
        events?.forEach((event: { listing_id: string; event_type: string }) => {
          const stats = statsMap.get(event.listing_id);
          if (stats) {
            switch (event.event_type) {
              case 'view':
                stats.views++;
                break;
              case 'video_play':
                stats.video_plays++;
                break;
              case 'watchlist_add':
                stats.watchlist_adds++;
                break;
              case 'bid_click':
                stats.bid_clicks++;
                break;
              case 'offer_click':
                stats.offer_clicks++;
                break;
              case 'share':
                stats.shares++;
                break;
            }
          }
        });

        // Combine with listing info
        const analyticsData: ListingAnalytics[] = listings.map((listing: { id: string; title: string; status: string; created_at: string }) => {
          const stats = statsMap.get(listing.id)!;
          return {
            id: listing.id,
            title: listing.title,
            status: listing.status,
            created_at: listing.created_at,
            ...stats,
          };
        });

        setListingAnalytics(analyticsData);

        // Calculate overall stats
        const totals = analyticsData.reduce(
          (acc, listing) => ({
            total_views: acc.total_views + listing.views,
            total_video_plays: acc.total_video_plays + listing.video_plays,
            total_watchlist_adds: acc.total_watchlist_adds + listing.watchlist_adds,
            total_bid_clicks: acc.total_bid_clicks + listing.bid_clicks,
            total_offer_clicks: acc.total_offer_clicks + listing.offer_clicks,
            total_shares: acc.total_shares + listing.shares,
          }),
          {
            total_views: 0,
            total_video_plays: 0,
            total_watchlist_adds: 0,
            total_bid_clicks: 0,
            total_offer_clicks: 0,
            total_shares: 0,
          }
        );

        // Get views for last 7 days vs previous 7 days for trend
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

        const { data: recentViews } = await supabase
          .from('listing_events')
          .select('id')
          .in('listing_id', listingIds)
          .eq('event_type', 'view')
          .gte('created_at', sevenDaysAgo.toISOString());

        const { data: previousViews } = await supabase
          .from('listing_events')
          .select('id')
          .in('listing_id', listingIds)
          .eq('event_type', 'view')
          .gte('created_at', fourteenDaysAgo.toISOString())
          .lt('created_at', sevenDaysAgo.toISOString());

        setOverallStats({
          ...totals,
          views_last_7_days: recentViews?.length || 0,
          views_previous_7_days: previousViews?.length || 0,
        });
      } catch (error) {
        console.error('Error loading analytics:', error);
      } finally {
        setLoading(false);
      }
    }

    loadAnalytics();
  }, [user?.id, supabase, timeRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const viewsTrend = overallStats
    ? overallStats.views_previous_7_days > 0
      ? ((overallStats.views_last_7_days - overallStats.views_previous_7_days) / overallStats.views_previous_7_days) * 100
      : overallStats.views_last_7_days > 0
        ? 100
        : 0
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500">Track how your listings are performing</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | 'all')}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="all">All time</option>
          </select>
        </div>
      </div>

      {/* Overall Stats Cards */}
      {overallStats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <Eye className="h-4 w-4" />
              Views
            </div>
            <p className="text-2xl font-bold text-gray-900">{overallStats.total_views.toLocaleString()}</p>
            {viewsTrend !== 0 && (
              <div className={`flex items-center gap-1 text-xs mt-1 ${viewsTrend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {viewsTrend > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {Math.abs(viewsTrend).toFixed(0)}% vs last week
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <Play className="h-4 w-4" />
              Video Plays
            </div>
            <p className="text-2xl font-bold text-gray-900">{overallStats.total_video_plays.toLocaleString()}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <Heart className="h-4 w-4" />
              Watchlist Adds
            </div>
            <p className="text-2xl font-bold text-gray-900">{overallStats.total_watchlist_adds.toLocaleString()}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <Gavel className="h-4 w-4" />
              Bid Clicks
            </div>
            <p className="text-2xl font-bold text-gray-900">{overallStats.total_bid_clicks.toLocaleString()}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <DollarSign className="h-4 w-4" />
              Offer Clicks
            </div>
            <p className="text-2xl font-bold text-gray-900">{overallStats.total_offer_clicks.toLocaleString()}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <Share2 className="h-4 w-4" />
              Shares
            </div>
            <p className="text-2xl font-bold text-gray-900">{overallStats.total_shares.toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Listings Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Listing Performance
          </h2>
        </div>

        {listingAnalytics.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No listings yet</h3>
            <p className="text-gray-500 mb-4">Create your first listing to start tracking analytics</p>
            <Link
              href="/dashboard/listings/new"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Create Listing
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 text-left text-sm text-gray-500">
                <tr>
                  <th className="px-6 py-3 font-medium">Listing</th>
                  <th className="px-4 py-3 font-medium text-center" title="Views">
                    <Eye className="h-4 w-4 mx-auto" />
                  </th>
                  <th className="px-4 py-3 font-medium text-center" title="Video Plays">
                    <Play className="h-4 w-4 mx-auto" />
                  </th>
                  <th className="px-4 py-3 font-medium text-center" title="Watchlist Adds">
                    <Heart className="h-4 w-4 mx-auto" />
                  </th>
                  <th className="px-4 py-3 font-medium text-center" title="Bid Clicks">
                    <Gavel className="h-4 w-4 mx-auto" />
                  </th>
                  <th className="px-4 py-3 font-medium text-center" title="Offer Clicks">
                    <DollarSign className="h-4 w-4 mx-auto" />
                  </th>
                  <th className="px-4 py-3 font-medium text-center" title="Shares">
                    <Share2 className="h-4 w-4 mx-auto" />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {listingAnalytics.map((listing) => (
                  <tr key={listing.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Link
                        href={`/listing/${listing.id}`}
                        className="font-medium text-gray-900 hover:text-blue-600 line-clamp-1"
                      >
                        {listing.title}
                      </Link>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          listing.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : listing.status === 'sold'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-600'
                        }`}>
                          {listing.status}
                        </span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(listing.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center font-medium">{listing.views}</td>
                    <td className="px-4 py-4 text-center font-medium">{listing.video_plays}</td>
                    <td className="px-4 py-4 text-center font-medium">{listing.watchlist_adds}</td>
                    <td className="px-4 py-4 text-center font-medium">{listing.bid_clicks}</td>
                    <td className="px-4 py-4 text-center font-medium">{listing.offer_clicks}</td>
                    <td className="px-4 py-4 text-center font-medium">{listing.shares}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Engagement Tips */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Tips to Improve Engagement
        </h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start gap-2">
            <span className="text-blue-500">•</span>
            Add high-quality photos from multiple angles to increase views
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500">•</span>
            Include a video walkthrough to showcase equipment operation
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500">•</span>
            Write detailed descriptions with specifications buyers care about
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500">•</span>
            Set competitive starting prices to attract more bids
          </li>
        </ul>
      </div>
    </div>
  );
}
