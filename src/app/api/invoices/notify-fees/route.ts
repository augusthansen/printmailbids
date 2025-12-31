import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendFeesApprovedEmail, sendFeesRejectedEmail } from '@/lib/email';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { invoiceId, type, rejectionReason } = body;

    if (!invoiceId || !type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (type !== 'approved' && type !== 'rejected') {
      return NextResponse.json(
        { error: 'Invalid type. Must be "approved" or "rejected"' },
        { status: 400 }
      );
    }

    // Fetch invoice with related data
    const { data: invoice, error: fetchError } = await supabaseAdmin
      .from('invoices')
      .select(`
        *,
        listing:listings(id, title),
        buyer:profiles!invoices_buyer_id_fkey(id, full_name, email),
        seller:profiles!invoices_seller_id_fkey(id, full_name, email)
      `)
      .eq('id', invoiceId)
      .single();

    if (fetchError || !invoice) {
      console.error('Error fetching invoice:', fetchError);
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    const listingTitle = invoice.listing?.title || 'Item';
    const sellerEmail = invoice.seller?.email;
    const sellerName = invoice.seller?.full_name || '';
    const buyerName = invoice.buyer?.full_name || 'Buyer';

    if (!sellerEmail) {
      return NextResponse.json(
        { error: 'Seller email not found' },
        { status: 400 }
      );
    }

    if (type === 'approved') {
      await sendFeesApprovedEmail({
        to: sellerEmail,
        userName: sellerName,
        listingTitle,
        invoiceId,
        packagingAmount: invoice.packaging_amount || 0,
        shippingAmount: invoice.shipping_amount || 0,
        buyerName,
      });
    } else if (type === 'rejected') {
      if (!rejectionReason) {
        return NextResponse.json(
          { error: 'Rejection reason is required' },
          { status: 400 }
        );
      }

      await sendFeesRejectedEmail({
        to: sellerEmail,
        userName: sellerName,
        listingTitle,
        invoiceId,
        packagingAmount: invoice.packaging_amount || 0,
        shippingAmount: invoice.shipping_amount || 0,
        rejectionReason,
        buyerName,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending fee notification:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}
