import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Verify user is admin
async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const adminClient = createAdminClient();
  const { data: profile } = await adminClient
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) {
    return null;
  }

  return user;
}

export async function GET(request: NextRequest) {
  const user = await verifyAdmin();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const status = searchParams.get('status');
  const listingType = searchParams.get('listingType');
  const search = searchParams.get('search');
  const role = searchParams.get('role');

  const adminClient = createAdminClient();
  const offset = (page - 1) * limit;

  try {
    switch (type) {
      case 'listings': {
        let query = adminClient
          .from('listings')
          .select(`
            id,
            title,
            listing_type,
            status,
            starting_price,
            current_price,
            fixed_price,
            buy_now_price,
            bid_count,
            view_count,
            created_at,
            end_time,
            is_featured,
            seller:profiles!listings_seller_id_fkey(email, full_name)
          `, { count: 'exact' });

        if (status && status !== 'all') {
          query = query.eq('status', status);
        }
        if (listingType && listingType !== 'all') {
          query = query.eq('listing_type', listingType);
        }
        if (search) {
          query = query.ilike('title', `%${search}%`);
        }

        const { data, count, error } = await query
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (error) throw error;
        return NextResponse.json({ data, count });
      }

      case 'users': {
        let query = adminClient
          .from('profiles')
          .select('*', { count: 'exact' });

        if (role === 'admin') {
          query = query.eq('is_admin', true);
        } else if (role === 'seller') {
          query = query.eq('is_seller', true);
        } else if (role === 'buyer') {
          query = query.eq('is_seller', false);
        }

        if (search) {
          query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%,company_name.ilike.%${search}%`);
        }

        const { data, count, error } = await query
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (error) throw error;
        return NextResponse.json({ data, count });
      }

      case 'sales': {
        let query = adminClient
          .from('invoices')
          .select(`
            *,
            listing:listings(title),
            buyer:profiles!invoices_buyer_id_fkey(email, full_name),
            seller:profiles!invoices_seller_id_fkey(email, full_name)
          `, { count: 'exact' });

        if (status && status !== 'all') {
          query = query.eq('status', status);
        }

        const { data, count, error } = await query
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (error) throw error;

        // Also get stats
        const { data: allInvoices } = await adminClient
          .from('invoices')
          .select('sale_amount, buyer_premium_amount, seller_commission_amount, total_amount, status');

        const paidInvoices = allInvoices?.filter(i => i.status === 'paid') || [];
        const pendingInvoices = allInvoices?.filter(i => i.status === 'pending') || [];

        const stats = {
          totalSales: allInvoices?.length || 0,
          totalRevenue: allInvoices?.reduce((sum, i) => sum + Number(i.total_amount || 0), 0) || 0,
          totalBuyerPremiums: paidInvoices.reduce((sum, i) => sum + Number(i.buyer_premium_amount || 0), 0),
          totalSellerCommissions: paidInvoices.reduce((sum, i) => sum + Number(i.seller_commission_amount || 0), 0),
          platformEarnings: paidInvoices.reduce((sum, i) =>
            sum + Number(i.buyer_premium_amount || 0) + Number(i.seller_commission_amount || 0), 0),
          pendingRevenue: pendingInvoices.reduce((sum, i) => sum + Number(i.total_amount || 0), 0),
          paidRevenue: paidInvoices.reduce((sum, i) => sum + Number(i.total_amount || 0), 0),
        };

        return NextResponse.json({ data, count, stats });
      }

      case 'bids': {
        let query = adminClient
          .from('bids')
          .select(`
            *,
            listing:listings(title, status),
            bidder:profiles!bids_bidder_id_fkey(email, full_name)
          `, { count: 'exact' });

        if (status && status !== 'all') {
          query = query.eq('status', status);
        }

        const { data, count, error } = await query
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (error) throw error;
        return NextResponse.json({ data, count });
      }

      case 'offers': {
        let query = adminClient
          .from('offers')
          .select(`
            *,
            listing:listings(title),
            buyer:profiles!offers_buyer_id_fkey(email, full_name),
            seller:profiles!offers_seller_id_fkey(email, full_name)
          `, { count: 'exact' });

        if (status && status !== 'all') {
          query = query.eq('status', status);
        }

        const { data, count, error } = await query
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (error) throw error;
        return NextResponse.json({ data, count });
      }

      case 'messages': {
        const { data, count, error } = await adminClient
          .from('conversations')
          .select(`
            *,
            listing:listings(title),
            buyer:profiles!conversations_buyer_id_fkey(email, full_name),
            seller:profiles!conversations_seller_id_fkey(email, full_name),
            messages(id, content, created_at)
          `, { count: 'exact' })
          .order('last_message_at', { ascending: false, nullsFirst: false })
          .range(offset, offset + limit - 1);

        if (error) throw error;
        return NextResponse.json({ data, count });
      }

      case 'conversation_messages':
      case 'conversation-messages': {
        const conversationId = searchParams.get('conversationId');
        if (!conversationId) {
          return NextResponse.json({ error: 'Missing conversationId' }, { status: 400 });
        }

        const { data, error } = await adminClient
          .from('messages')
          .select(`
            *,
            sender:profiles!messages_sender_id_fkey(email, full_name)
          `)
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        return NextResponse.json({ data });
      }

      case 'dashboard': {
        const [
          usersResult,
          sellersResult,
          listingsResult,
          activeListingsResult,
          invoicesResult,
          paidInvoicesResult,
          pendingInvoicesResult,
          bidsResult,
          offersResult,
          pendingOffersResult,
          recentSignupsResult,
          recentSalesResult,
          recentUsersResult,
        ] = await Promise.all([
          adminClient.from('profiles').select('id', { count: 'exact', head: true }),
          adminClient.from('profiles').select('id', { count: 'exact', head: true }).eq('is_seller', true),
          adminClient.from('listings').select('id', { count: 'exact', head: true }),
          adminClient.from('listings').select('id', { count: 'exact', head: true }).eq('status', 'active'),
          adminClient.from('invoices').select('id, total_amount, buyer_premium_amount, seller_commission_amount'),
          adminClient.from('invoices').select('id, total_amount, buyer_premium_amount, seller_commission_amount').eq('status', 'paid'),
          adminClient.from('invoices').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
          adminClient.from('bids').select('id', { count: 'exact', head: true }),
          adminClient.from('offers').select('id', { count: 'exact', head: true }),
          adminClient.from('offers').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
          adminClient.from('profiles').select('id', { count: 'exact', head: true })
            .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
          adminClient.from('invoices')
            .select(`
              id,
              invoice_number,
              total_amount,
              buyer_premium_amount,
              seller_commission_amount,
              status,
              created_at,
              listing:listings(title),
              buyer:profiles!invoices_buyer_id_fkey(email, full_name),
              seller:profiles!invoices_seller_id_fkey(email, full_name)
            `)
            .order('created_at', { ascending: false })
            .limit(5),
          adminClient.from('profiles')
            .select('id, email, full_name, is_seller, is_admin, created_at')
            .order('created_at', { ascending: false })
            .limit(5),
        ]);

        const allInvoices = invoicesResult.data || [];
        const paidInvoices = paidInvoicesResult.data || [];

        const totalRevenue = allInvoices.reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0);
        const platformEarnings = paidInvoices.reduce((sum, inv) =>
          sum + Number(inv.buyer_premium_amount || 0) + Number(inv.seller_commission_amount || 0), 0);

        return NextResponse.json({
          stats: {
            totalUsers: usersResult.count || 0,
            totalSellers: sellersResult.count || 0,
            totalListings: listingsResult.count || 0,
            activeListings: activeListingsResult.count || 0,
            totalSales: allInvoices.length,
            totalRevenue,
            platformEarnings,
            pendingPayments: pendingInvoicesResult.count || 0,
            totalBids: bidsResult.count || 0,
            totalOffers: offersResult.count || 0,
            pendingOffers: pendingOffersResult.count || 0,
            recentSignups: recentSignupsResult.count || 0,
          },
          recentSales: recentSalesResult.data || [],
          recentUsers: recentUsersResult.data || [],
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }
  } catch (error) {
    console.error('Admin API error:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

// For updating user roles and settings
export async function POST(request: NextRequest) {
  const user = await verifyAdmin();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { action, userId, value, listingId, status, custom_buyer_premium_percent, custom_seller_commission_percent } = body;
  const adminClient = createAdminClient();

  try {
    switch (action) {
      case 'toggleAdmin': {
        const { error } = await adminClient
          .from('profiles')
          .update({ is_admin: value })
          .eq('id', userId);
        if (error) throw error;
        return NextResponse.json({ success: true });
      }

      case 'toggleSeller': {
        const { error } = await adminClient
          .from('profiles')
          .update({
            is_seller: value,
            seller_approved_at: value ? new Date().toISOString() : null
          })
          .eq('id', userId);
        if (error) throw error;
        return NextResponse.json({ success: true });
      }

      case 'toggleVerified': {
        const { error } = await adminClient
          .from('profiles')
          .update({
            is_verified: value,
            verified_at: value ? new Date().toISOString() : null
          })
          .eq('id', userId);
        if (error) throw error;
        return NextResponse.json({ success: true });
      }

      case 'updateListingStatus': {
        const { error } = await adminClient
          .from('listings')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('id', listingId);
        if (error) throw error;
        return NextResponse.json({ success: true });
      }

      case 'toggleFeatured': {
        const { error } = await adminClient
          .from('listings')
          .update({
            is_featured: value,
            featured_at: value ? new Date().toISOString() : null,
            updated_at: new Date().toISOString()
          })
          .eq('id', listingId);
        if (error) throw error;
        return NextResponse.json({ success: true });
      }

      case 'updateCommissionRates': {
        const { error } = await adminClient
          .from('profiles')
          .update({
            custom_buyer_premium_percent: custom_buyer_premium_percent,
            custom_seller_commission_percent: custom_seller_commission_percent,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);
        if (error) throw error;
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Admin API error:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
