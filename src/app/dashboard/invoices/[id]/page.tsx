'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  ArrowLeft,
  CreditCard,
  Building2,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Download,
  Calendar,
  DollarSign,
  Package,
  Truck,
  MapPin,
  ExternalLink,
  Gavel,
  CircleDot
} from 'lucide-react';

interface Invoice {
  id: string;
  invoice_number: string;
  listing_id: string;
  seller_id: string;
  buyer_id: string;
  sale_amount: number;
  buyer_premium_percent: number;
  buyer_premium_amount: number;
  shipping_amount: number;
  tax_amount: number;
  total_amount: number;
  status: string;
  fulfillment_status: string;
  payment_due_date: string;
  paid_at: string | null;
  payment_method: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  tracking_number: string | null;
  shipping_address: {
    name?: string;
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  } | null;
  created_at: string;
  listing?: {
    id: string;
    title: string;
    images?: { url: string; is_primary: boolean }[];
  };
  seller?: {
    id: string;
    full_name: string;
    company_name: string;
    email: string;
  };
}

interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  date: string | null;
  icon: typeof CheckCircle;
  status: 'completed' | 'current' | 'upcoming';
}

export default function InvoicePage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id as string;
  const { user } = useAuth();
  const supabase = createClient();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function loadInvoice() {
      if (!user?.id) return;

      // First try with foreign key reference, fall back to separate queries if needed
      const { data, error: fetchError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .single();

      if (fetchError) {
        setError('Invoice not found');
        setLoading(false);
        return;
      }

      if (!data) {
        setError('Invoice not found');
        setLoading(false);
        return;
      }

      // Check if user is buyer or seller
      if (data.buyer_id !== user.id && data.seller_id !== user.id) {
        setError('You do not have permission to view this invoice');
        setLoading(false);
        return;
      }

      // Fetch related data separately
      const [listingResult, sellerResult] = await Promise.all([
        supabase
          .from('listings')
          .select('id, title')
          .eq('id', data.listing_id)
          .single(),
        supabase
          .from('profiles')
          .select('id, full_name, company_name, email')
          .eq('id', data.seller_id)
          .single(),
      ]);

      // Try to get listing images
      const { data: imagesData } = await supabase
        .from('listing_images')
        .select('url, is_primary')
        .eq('listing_id', data.listing_id);

      const invoiceWithDetails: Invoice = {
        ...data,
        listing: listingResult.data ? {
          ...listingResult.data,
          images: imagesData || [],
        } : undefined,
        seller: sellerResult.data || undefined,
      };

      setInvoice(invoiceWithDetails);
      setLoading(false);
    }

    loadInvoice();
  }, [invoiceId, user?.id, supabase]);

  const handlePayment = async (method: 'credit_card' | 'ach' | 'wire') => {
    if (!invoice || !user?.id) return;

    setProcessing(true);
    setError(null);

    try {
      // For now, simulate payment processing
      // In production, this would integrate with Stripe

      if (method === 'wire') {
        // Show wire transfer instructions
        setSuccess('Wire transfer instructions have been sent to your email. Please reference invoice #' + invoice.id.slice(0, 8));
        return;
      }

      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Update invoice status (in production, this would happen via Stripe webhook)
      const { error: updateError } = await supabase
        .from('invoices')
        .update({
          status: 'paid',
          fulfillment_status: 'processing',
          paid_at: new Date().toISOString(),
          payment_method: method,
        })
        .eq('id', invoice.id);

      if (updateError) throw updateError;

      // Notify seller of payment
      await supabase.from('notifications').insert({
        user_id: invoice.seller_id,
        type: 'payment_received',
        title: 'Payment received!',
        body: `Payment of $${invoice.total_amount.toLocaleString()} received for "${invoice.listing?.title}". Invoice #${invoice.id.slice(0, 8)}`,
        listing_id: invoice.listing_id,
        invoice_id: invoice.id,
      });

      setSuccess('Payment successful! The seller has been notified.');

      // Reload invoice to show updated status
      setInvoice(prev => prev ? {
        ...prev,
        status: 'paid',
        fulfillment_status: 'processing',
        paid_at: new Date().toISOString(),
        payment_method: method,
      } : null);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">Paid</span>;
      case 'pending':
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">Payment Due</span>;
      case 'overdue':
        return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">Overdue</span>;
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">{status}</span>;
    }
  };

  const getFulfillmentBadge = (status: string) => {
    switch (status) {
      case 'shipped':
        return <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium flex items-center gap-1"><Truck className="h-3 w-3" /> Shipped</span>;
      case 'delivered':
        return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Delivered</span>;
      case 'processing':
        return <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium flex items-center gap-1"><Package className="h-3 w-3" /> Processing</span>;
      case 'awaiting_payment':
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium flex items-center gap-1"><Clock className="h-3 w-3" /> Awaiting Payment</span>;
      default:
        return null;
    }
  };

  const getTimeline = (): TimelineEvent[] => {
    if (!invoice) return [];

    const events: TimelineEvent[] = [
      {
        id: 'won',
        title: 'Auction Won',
        description: `You won the auction with a bid of $${invoice.sale_amount.toLocaleString()}`,
        date: invoice.created_at,
        icon: Gavel,
        status: 'completed',
      },
      {
        id: 'paid',
        title: 'Payment Received',
        description: invoice.paid_at
          ? `Paid via ${invoice.payment_method?.replace('_', ' ') || 'card'}`
          : `Total due: $${invoice.total_amount.toLocaleString()}`,
        date: invoice.paid_at,
        icon: CreditCard,
        status: invoice.paid_at ? 'completed' : (invoice.status === 'pending' ? 'current' : 'upcoming'),
      },
      {
        id: 'processing',
        title: 'Processing',
        description: 'Seller preparing item for shipment',
        date: invoice.paid_at && !invoice.shipped_at ? invoice.paid_at : null,
        icon: Package,
        status: invoice.paid_at
          ? (invoice.shipped_at ? 'completed' : 'current')
          : 'upcoming',
      },
      {
        id: 'shipped',
        title: 'Shipped',
        description: invoice.tracking_number
          ? `Tracking: ${invoice.tracking_number}`
          : 'Item shipped to buyer',
        date: invoice.shipped_at,
        icon: Truck,
        status: invoice.shipped_at
          ? (invoice.delivered_at ? 'completed' : 'current')
          : 'upcoming',
      },
      {
        id: 'delivered',
        title: 'Delivered',
        description: 'Item received by buyer',
        date: invoice.delivered_at,
        icon: CheckCircle,
        status: invoice.delivered_at ? 'completed' : 'upcoming',
      },
    ];

    return events;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getCarrierFromTracking = (tracking: string): { name: string; url: string } | null => {
    if (!tracking) return null;

    // UPS
    if (tracking.startsWith('1Z')) {
      return { name: 'UPS', url: `https://www.ups.com/track?tracknum=${tracking}` };
    }
    // FedEx (12-34 digits)
    if (/^\d{12,34}$/.test(tracking)) {
      return { name: 'FedEx', url: `https://www.fedex.com/fedextrack/?trknbr=${tracking}` };
    }
    // USPS (various formats)
    if (/^(94|93|92|91|90|55|56)\d{18,22}$/.test(tracking)) {
      return { name: 'USPS', url: `https://tools.usps.com/go/TrackConfirmAction?tLabels=${tracking}` };
    }

    return null;
  };

  const isPastDue = invoice && new Date(invoice.payment_due_date) < new Date() && invoice.status === 'pending';
  const isBuyer = invoice && user?.id === invoice.buyer_id;
  const timeline = getTimeline();

  const handleDownloadPDF = () => {
    if (!invoice) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to download the invoice PDF');
      return;
    }

    const statusText = invoice.status === 'paid' ? 'PAID' : (isPastDue ? 'OVERDUE' : 'PENDING');
    const statusColor = invoice.status === 'paid' ? '#059669' : (isPastDue ? '#dc2626' : '#d97706');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice #${invoice.id.slice(0, 8)} - PrintMailBids</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 30px 40px; color: #1f2937; line-height: 1.4; font-size: 13px; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #e5e7eb; }
          .logo { font-size: 20px; font-weight: bold; color: #2563eb; }
          .logo-sub { font-size: 10px; color: #6b7280; }
          .invoice-title { text-align: right; }
          .invoice-title h1 { font-size: 22px; color: #1f2937; margin-bottom: 2px; }
          .invoice-number { color: #6b7280; font-size: 12px; }
          .status { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 10px; font-weight: 600; color: white; background: ${statusColor}; margin-top: 5px; }
          .info-row { display: flex; justify-content: space-between; margin-bottom: 20px; }
          .info-box { flex: 1; }
          .info-box h3 { font-size: 10px; text-transform: uppercase; color: #6b7280; margin-bottom: 4px; letter-spacing: 0.5px; }
          .info-box p { font-size: 12px; }
          .info-box .name { font-weight: 600; }
          .table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
          .table th { text-align: left; padding: 8px 10px; background: #f9fafb; border-bottom: 2px solid #e5e7eb; font-size: 10px; text-transform: uppercase; color: #6b7280; }
          .table td { padding: 10px; border-bottom: 1px solid #e5e7eb; font-size: 12px; }
          .table .item-title { font-weight: 500; }
          .table .item-desc { font-size: 10px; color: #6b7280; }
          .bottom-section { display: flex; justify-content: space-between; gap: 30px; }
          .payment-box { flex: 1; background: #f9fafb; padding: 12px; border-radius: 6px; }
          .payment-box h3 { font-size: 11px; font-weight: 600; margin-bottom: 6px; }
          .payment-box p { font-size: 11px; color: #4b5563; line-height: 1.4; }
          .totals { width: 240px; }
          .totals-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 12px; }
          .totals-row.total { border-top: 2px solid #1f2937; margin-top: 6px; padding-top: 10px; font-size: 15px; font-weight: 700; }
          .footer { margin-top: 20px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 10px; color: #6b7280; text-align: center; }
          @media print {
            body { padding: 15px 25px; }
            @page { margin: 0.5cm; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">PrintMailBids</div>
            <div class="logo-sub">Industrial Printing Equipment Marketplace</div>
          </div>
          <div class="invoice-title">
            <h1>INVOICE</h1>
            <div class="invoice-number">#${invoice.id.slice(0, 8).toUpperCase()}</div>
            <div class="status">${statusText}</div>
          </div>
        </div>

        <div class="info-row">
          <div class="info-box">
            <h3>Bill To</h3>
            <p class="name">${user?.email || 'Buyer'}</p>
          </div>
          <div class="info-box">
            <h3>Seller</h3>
            <p class="name">${invoice.seller?.company_name || invoice.seller?.full_name || 'Seller'}</p>
            <p>${invoice.seller?.email || ''}</p>
          </div>
          <div class="info-box">
            <h3>Invoice Date</h3>
            <p>${new Date(invoice.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
          </div>
          <div class="info-box">
            <h3>Payment Due</h3>
            <p>${new Date(invoice.payment_due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
          </div>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th style="width: 55%">Description</th>
              <th style="width: 25%">Type</th>
              <th style="width: 20%; text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <div class="item-title">${invoice.listing?.title || 'Auction Item'}</div>
                <div class="item-desc">Winning bid</div>
              </td>
              <td>Auction</td>
              <td style="text-align: right;">$${invoice.sale_amount?.toLocaleString() || '0'}</td>
            </tr>
            <tr>
              <td>
                <div class="item-title">Buyer Premium (${invoice.buyer_premium_percent || 5}%)</div>
              </td>
              <td>Fee</td>
              <td style="text-align: right;">$${invoice.buyer_premium_amount?.toLocaleString() || '0'}</td>
            </tr>
            ${invoice.shipping_amount > 0 ? `<tr><td>Shipping</td><td>Shipping</td><td style="text-align: right;">$${invoice.shipping_amount.toLocaleString()}</td></tr>` : ''}
            ${invoice.tax_amount > 0 ? `<tr><td>Tax</td><td>Tax</td><td style="text-align: right;">$${invoice.tax_amount.toLocaleString()}</td></tr>` : ''}
          </tbody>
        </table>

        <div class="bottom-section">
          <div class="payment-box">
            ${invoice.status === 'paid' ? `
              <h3>Payment Received</h3>
              <p>Paid on ${invoice.paid_at ? new Date(invoice.paid_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'} via ${invoice.payment_method?.replace('_', ' ') || 'card'}</p>
            ` : `
              <h3>Payment Instructions</h3>
              <p>Visit PrintMailBids.com to pay by ${new Date(invoice.payment_due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}.</p>
              <p style="margin-top: 4px;">Methods: Credit Card, ACH, Wire Transfer</p>
            `}
            ${invoice.tracking_number ? `
              <h3 style="margin-top: 10px;">Shipping</h3>
              <p>Tracking: ${invoice.tracking_number}</p>
              ${invoice.shipped_at ? `<p>Shipped: ${new Date(invoice.shipped_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>` : ''}
            ` : ''}
          </div>
          <div class="totals">
            <div class="totals-row">
              <span>Subtotal</span>
              <span>$${invoice.sale_amount?.toLocaleString() || '0'}</span>
            </div>
            <div class="totals-row">
              <span>Buyer Premium</span>
              <span>$${invoice.buyer_premium_amount?.toLocaleString() || '0'}</span>
            </div>
            ${invoice.shipping_amount > 0 ? `<div class="totals-row"><span>Shipping</span><span>$${invoice.shipping_amount.toLocaleString()}</span></div>` : ''}
            ${invoice.tax_amount > 0 ? `<div class="totals-row"><span>Tax</span><span>$${invoice.tax_amount.toLocaleString()}</span></div>` : ''}
            <div class="totals-row total">
              <span>Total Due</span>
              <span>$${invoice.total_amount?.toLocaleString() || '0'}</span>
            </div>
          </div>
        </div>

        <div class="footer">
          <p>Thank you for using PrintMailBids! Questions? Contact support@printmailbids.com</p>
        </div>

        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error && !invoice) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">Error</h1>
        <p className="text-gray-600 mb-4">{error}</p>
        <Link href="/dashboard" className="text-blue-600 hover:underline">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  if (!invoice) return null;

  const listingImage = invoice.listing?.images?.find(img => img.is_primary)?.url || invoice.listing?.images?.[0]?.url;
  const carrier = invoice.tracking_number ? getCarrierFromTracking(invoice.tracking_number) : null;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard/purchases"
          className="text-gray-500 hover:text-gray-700 flex items-center gap-1 text-sm mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Purchases
        </Link>

        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Invoice #{invoice.id.slice(0, 8)}</h1>
            <p className="text-gray-500">Created {new Date(invoice.created_at).toLocaleDateString()}</p>
          </div>
          <div className="flex items-center gap-2">
            {getFulfillmentBadge(invoice.fulfillment_status)}
            {getStatusBadge(isPastDue ? 'overdue' : invoice.status)}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          {success}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Invoice Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Timeline */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="font-semibold text-gray-900 mb-6">Order Timeline</h2>
            <div className="relative">
              {timeline.map((event, index) => {
                const Icon = event.icon;
                const isLast = index === timeline.length - 1;

                return (
                  <div key={event.id} className="flex gap-4 pb-6 last:pb-0">
                    {/* Timeline line and dot */}
                    <div className="flex flex-col items-center">
                      <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                        ${event.status === 'completed' ? 'bg-green-100 text-green-600' : ''}
                        ${event.status === 'current' ? 'bg-blue-100 text-blue-600 ring-4 ring-blue-50' : ''}
                        ${event.status === 'upcoming' ? 'bg-gray-100 text-gray-400' : ''}
                      `}>
                        <Icon className="h-5 w-5" />
                      </div>
                      {!isLast && (
                        <div className={`
                          w-0.5 flex-1 min-h-[24px] mt-2
                          ${event.status === 'completed' ? 'bg-green-200' : 'bg-gray-200'}
                        `} />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 pt-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className={`font-medium ${event.status === 'upcoming' ? 'text-gray-400' : 'text-gray-900'}`}>
                          {event.title}
                        </h3>
                        {event.date && (
                          <span className="text-xs text-gray-500">
                            {formatDate(event.date)}
                          </span>
                        )}
                      </div>
                      <p className={`text-sm mt-0.5 ${event.status === 'upcoming' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {event.description}
                      </p>

                      {/* Tracking link for shipped status */}
                      {event.id === 'shipped' && invoice.tracking_number && carrier && (
                        <a
                          href={carrier.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 mt-2 text-sm text-blue-600 hover:text-blue-700"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Track on {carrier.name}
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Shipping Details (if shipped) */}
          {(invoice.shipped_at || invoice.tracking_number) && (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Truck className="h-5 w-5 text-blue-600" />
                Shipping Details
              </h2>

              <div className="grid sm:grid-cols-2 gap-4">
                {invoice.tracking_number && (
                  <div>
                    <p className="text-sm text-gray-500">Tracking Number</p>
                    <div className="flex items-center gap-2">
                      <p className="font-mono font-medium text-gray-900">{invoice.tracking_number}</p>
                      {carrier && (
                        <a
                          href={carrier.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                    {carrier && <p className="text-xs text-gray-500 mt-1">via {carrier.name}</p>}
                  </div>
                )}

                {invoice.shipped_at && (
                  <div>
                    <p className="text-sm text-gray-500">Shipped Date</p>
                    <p className="font-medium text-gray-900">{formatDate(invoice.shipped_at)}</p>
                  </div>
                )}

                {invoice.delivered_at && (
                  <div>
                    <p className="text-sm text-gray-500">Delivered Date</p>
                    <p className="font-medium text-gray-900">{formatDate(invoice.delivered_at)}</p>
                  </div>
                )}

                {invoice.shipping_address && (
                  <div className="sm:col-span-2">
                    <p className="text-sm text-gray-500 mb-1">Shipping Address</p>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="text-gray-900">
                        {invoice.shipping_address.name && <p className="font-medium">{invoice.shipping_address.name}</p>}
                        {invoice.shipping_address.street && <p>{invoice.shipping_address.street}</p>}
                        {(invoice.shipping_address.city || invoice.shipping_address.state || invoice.shipping_address.zip) && (
                          <p>
                            {invoice.shipping_address.city}{invoice.shipping_address.city && invoice.shipping_address.state && ', '}
                            {invoice.shipping_address.state} {invoice.shipping_address.zip}
                          </p>
                        )}
                        {invoice.shipping_address.country && <p>{invoice.shipping_address.country}</p>}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Item */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Item</h2>
            <div className="flex gap-4">
              {listingImage ? (
                <img src={listingImage} alt="" className="w-24 h-24 object-cover rounded-lg" />
              ) : (
                <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Package className="h-8 w-8 text-gray-400" />
                </div>
              )}
              <div>
                <h3 className="font-medium text-gray-900">{invoice.listing?.title}</h3>
                <Link
                  href={`/listing/${invoice.listing_id}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  View Listing
                </Link>
              </div>
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Price Breakdown</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Winning Bid</span>
                <span className="font-medium">${invoice.sale_amount?.toLocaleString() || '0'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Buyer Premium ({invoice.buyer_premium_percent || 5}%)</span>
                <span className="font-medium">${invoice.buyer_premium_amount?.toLocaleString() || '0'}</span>
              </div>
              {invoice.shipping_amount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">${invoice.shipping_amount.toLocaleString()}</span>
                </div>
              )}
              {invoice.tax_amount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium">${invoice.tax_amount.toLocaleString()}</span>
                </div>
              )}
              <div className="border-t pt-3 flex justify-between">
                <span className="font-semibold text-gray-900">Total Due</span>
                <span className="font-bold text-xl text-gray-900">${invoice.total_amount?.toLocaleString() || '0'}</span>
              </div>
            </div>
          </div>

          {/* Seller Info */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Seller</h2>
            <p className="font-medium text-gray-900">
              {invoice.seller?.company_name || invoice.seller?.full_name}
            </p>
            <p className="text-gray-500 text-sm">{invoice.seller?.email}</p>
          </div>
        </div>

        {/* Payment Sidebar */}
        <div className="space-y-6">
          {/* Payment Status */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            {invoice.status === 'paid' ? (
              <div className="text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-1">Payment Complete</h3>
                <p className="text-sm text-gray-500">
                  Paid on {invoice.paid_at ? new Date(invoice.paid_at).toLocaleDateString() : 'N/A'}
                </p>
                <p className="text-sm text-gray-500">
                  via {invoice.payment_method?.replace('_', ' ')}
                </p>
              </div>
            ) : (
              <>
                <div className={`flex items-center gap-3 p-3 rounded-lg mb-4 ${isPastDue ? 'bg-red-50' : 'bg-yellow-50'}`}>
                  <Calendar className={`h-5 w-5 ${isPastDue ? 'text-red-500' : 'text-yellow-600'}`} />
                  <div>
                    <p className={`font-medium ${isPastDue ? 'text-red-700' : 'text-yellow-700'}`}>
                      {isPastDue ? 'Payment Overdue' : 'Payment Due'}
                    </p>
                    <p className={`text-sm ${isPastDue ? 'text-red-600' : 'text-yellow-600'}`}>
                      {new Date(invoice.payment_due_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="text-center mb-4">
                  <p className="text-sm text-gray-500">Amount Due</p>
                  <p className="text-3xl font-bold text-gray-900">${invoice.total_amount?.toLocaleString() || '0'}</p>
                </div>

                {isBuyer && (
                  <div className="space-y-3">
                    <button
                      onClick={() => handlePayment('credit_card')}
                      disabled={processing}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
                    >
                      {processing ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <CreditCard className="h-5 w-5" />
                      )}
                      Pay with Card
                    </button>

                    <button
                      onClick={() => handlePayment('ach')}
                      disabled={processing}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition disabled:opacity-50"
                    >
                      <Building2 className="h-5 w-5" />
                      Pay with ACH
                    </button>

                    <button
                      onClick={() => handlePayment('wire')}
                      disabled={processing}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition disabled:opacity-50"
                    >
                      <FileText className="h-5 w-5" />
                      Wire Transfer
                    </button>

                    <p className="text-xs text-gray-500 text-center">
                      Credit card: 2.9% + $0.30 fee | ACH: 0.8% fee (max $5)
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Download Invoice */}
          <button
            onClick={handleDownloadPDF}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
          >
            <Download className="h-5 w-5" />
            Download PDF
          </button>
        </div>
      </div>
    </div>
  );
}
