'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { getStripe } from '@/lib/stripe/client';
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
  CircleDot,
  Edit3,
  X,
  Send,
  XCircle,
  MessageSquare,
  Upload,
  Trash2,
  Camera
} from 'lucide-react';

interface FreightContact {
  name?: string;
  phone?: string;
  email?: string;
  company?: string;
}

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
  packaging_amount: number;
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
  shipping_carrier: string | null;
  shipping_address: {
    name?: string;
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  } | null;
  created_at: string;
  // Fee workflow fields
  packaging_note: string | null;
  packaging_added_at: string | null;
  shipping_note: string | null;
  shipping_added_at: string | null;
  shipping_quote_url: string | null;
  fees_status: 'none' | 'pending_approval' | 'approved' | 'rejected' | 'disputed';
  fees_submitted_at: string | null;
  fees_responded_at: string | null;
  fees_rejection_reason: string | null;
  // Freight shipping fields
  freight_bol_number: string | null;
  freight_pro_number: string | null;
  freight_class: string | null;
  freight_weight_lbs: number | null;
  freight_pickup_date: string | null;
  freight_estimated_delivery: string | null;
  freight_pickup_contact: FreightContact | null;
  freight_delivery_contact: FreightContact | null;
  freight_special_instructions: string | null;
  // Delivery confirmation fields (buyer)
  delivery_confirmed_at: string | null;
  delivery_confirmed_by: string | null;
  delivery_condition: 'good' | 'damaged' | 'partial' | null;
  delivery_notes: string | null;
  delivery_bol_url: string | null;
  delivery_damage_photos: string[] | null;
  shipping_photos: string[] | null;
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
  buyer?: {
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
  const searchParams = useSearchParams();
  const invoiceId = params.id as string;
  const { user, loading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fee editing state
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [packagingAmount, setPackagingAmount] = useState('');
  const [packagingNote, setPackagingNote] = useState('');
  const [shippingAmount, setShippingAmount] = useState('');
  const [shippingNote, setShippingNote] = useState('');
  const [shippingQuoteUrl, setShippingQuoteUrl] = useState<string | null>(null);
  const [uploadingQuote, setUploadingQuote] = useState(false);
  const [savingFees, setSavingFees] = useState(false);
  const [feeModalSuccess, setFeeModalSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Buyer approval state
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [approvingFees, setApprovingFees] = useState(false);

  // Shipping update state (seller)
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [updatingShipping, setUpdatingShipping] = useState(false);
  // Freight shipping form state
  const [freightCarrier, setFreightCarrier] = useState('');
  const [freightBolNumber, setFreightBolNumber] = useState('');
  const [freightProNumber, setFreightProNumber] = useState('');
  const [freightClass, setFreightClass] = useState('');
  const [freightWeightLbs, setFreightWeightLbs] = useState('');
  const [freightPickupDate, setFreightPickupDate] = useState('');
  const [freightEstimatedDelivery, setFreightEstimatedDelivery] = useState('');
  const [freightPickupContact, setFreightPickupContact] = useState<FreightContact>({ name: '', phone: '', email: '', company: '' });
  const [freightDeliveryContact, setFreightDeliveryContact] = useState<FreightContact>({ name: '', phone: '', email: '', company: '' });
  const [freightSpecialInstructions, setFreightSpecialInstructions] = useState('');

  // Delivery confirmation state (buyer)
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [confirmingDelivery, setConfirmingDelivery] = useState(false);
  const [deliveryCondition, setDeliveryCondition] = useState<'good' | 'damaged' | 'partial'>('good');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [deliveryBolFile, setDeliveryBolFile] = useState<File | null>(null);
  const [deliveryBolPreview, setDeliveryBolPreview] = useState<string | null>(null);
  const [deliveryDamageFiles, setDeliveryDamageFiles] = useState<File[]>([]);
  const [deliveryDamagePreviews, setDeliveryDamagePreviews] = useState<string[]>([]);

  // BOL/Shipping photos upload modal state (buyer - before delivery confirmation)
  const [showBolModal, setShowBolModal] = useState(false);
  const [bolModalFile, setBolModalFile] = useState<File | null>(null);
  const [bolModalPreview, setBolModalPreview] = useState<string | null>(null);
  const [shippingPhotos, setShippingPhotos] = useState<File[]>([]);
  const [shippingPhotoPreviews, setShippingPhotoPreviews] = useState<string[]>([]);
  const [uploadingBolModal, setUploadingBolModal] = useState(false);

  const isSeller = user?.id === invoice?.seller_id;
  const isBuyer = user?.id === invoice?.buyer_id;

  // Initialize fee form values when invoice loads
  useEffect(() => {
    if (invoice) {
      setPackagingAmount(invoice.packaging_amount?.toString() || '');
      setPackagingNote(invoice.packaging_note || '');
      setShippingAmount(invoice.shipping_amount?.toString() || '');
      setShippingNote(invoice.shipping_note || '');
      setShippingQuoteUrl(invoice.shipping_quote_url || null);
    }
  }, [invoice]);

  // Handle saving packaging/shipping fees (seller)
  const handleSaveFees = async (submitForApproval: boolean = false) => {
    console.log('=== handleSaveFees START ===');

    if (!invoice || !user?.id) {
      console.log('handleSaveFees: Missing invoice or user', { invoice: !!invoice, userId: user?.id });
      return;
    }

    console.log('handleSaveFees called', { submitForApproval, invoiceId: invoice.id, sellerId: invoice.seller_id, userId: user.id });
    setSavingFees(true);
    setError(null);
    setSuccess(null);

    try {
      const packagingNum = parseFloat(packagingAmount) || 0;
      const shippingNum = parseFloat(shippingAmount) || 0;

      // Calculate new total
      const newTotal = invoice.sale_amount + invoice.buyer_premium_amount + packagingNum + shippingNum + (invoice.tax_amount || 0);

      const updateData: Record<string, unknown> = {
        packaging_amount: packagingNum,
        packaging_note: packagingNote || null,
        packaging_added_at: packagingNum > 0 ? new Date().toISOString() : null,
        shipping_amount: shippingNum,
        shipping_note: shippingNote || null,
        shipping_added_at: shippingNum > 0 ? new Date().toISOString() : null,
        shipping_quote_url: shippingQuoteUrl,
        total_amount: newTotal,
      };

      console.log('Updating invoice with data:', updateData);

      // If submitting for approval
      if (submitForApproval && (packagingNum > 0 || shippingNum > 0)) {
        updateData.fees_status = 'pending_approval';
        updateData.fees_submitted_at = new Date().toISOString();
      }

      const { error: updateError, data: updateResult } = await supabase
        .from('invoices')
        .update(updateData)
        .eq('id', invoice.id)
        .select();

      console.log('Update result:', { error: updateError, data: updateResult });

      if (updateError) throw updateError;

      // Send notification to buyer if submitting for approval
      if (submitForApproval && (packagingNum > 0 || shippingNum > 0)) {
        await supabase.from('notifications').insert({
          user_id: invoice.buyer_id,
          type: 'fees_added',
          title: 'Fees Added to Invoice',
          message: `The seller has added ${packagingNum > 0 ? `$${packagingNum.toLocaleString()} packaging` : ''}${packagingNum > 0 && shippingNum > 0 ? ' and ' : ''}${shippingNum > 0 ? `$${shippingNum.toLocaleString()} shipping` : ''} fees to your invoice. Please review and approve.`,
          related_type: 'invoice',
          related_id: invoice.id,
        });
      }

      // Reload invoice data
      const { data: updatedInvoice } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoice.id)
        .single();

      if (updatedInvoice) {
        setInvoice(prev => prev ? { ...prev, ...updatedInvoice, fees_status: updatedInvoice.fees_status || 'none' } : null);
      }

      // Show success in modal first
      const successMessage = submitForApproval ? 'Fees submitted for buyer approval!' : 'Fees saved as draft!';
      setFeeModalSuccess(successMessage);
      setSavingFees(false);

      // Close modal after a short delay so user sees the success message
      setTimeout(() => {
        setShowFeeModal(false);
        setFeeModalSuccess(null);
        setSuccess(successMessage);
      }, 1500);
    } catch (err) {
      console.error('=== handleSaveFees ERROR ===', err);
      setError(err instanceof Error ? err.message : 'Failed to save fees');
      setSavingFees(false);
    } finally {
      console.log('=== handleSaveFees COMPLETE ===');
    }
  };

  // Handle shipping quote PDF upload
  const handleQuoteUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('=== handleQuoteUpload START ===');
    const file = e.target.files?.[0];
    console.log('File selected:', file ? { name: file.name, type: file.type, size: file.size } : 'none');

    if (!file || !invoice) {
      console.log('No file or invoice');
      return;
    }

    // Validate file type - check both MIME type and extension
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      console.log('Not a PDF file');
      setUploadError('Please upload a PDF file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size must be less than 10MB');
      return;
    }

    setUploadingQuote(true);
    setUploadError(null);

    try {
      const fileName = `${invoice.id}-shipping-quote-${Date.now()}.pdf`;
      const filePath = `shipping-quotes/${fileName}`;

      console.log('Uploading to path:', filePath);

      // Upload to Supabase Storage
      const { error: storageError, data: uploadData } = await supabase.storage
        .from('documents')
        .upload(filePath, file, {
          upsert: true,
          contentType: 'application/pdf'
        });

      console.log('Upload response:', { error: storageError, data: uploadData });

      if (storageError) {
        console.error('Upload error details:', storageError);
        throw new Error(storageError.message || 'Storage upload failed');
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;
      console.log('Upload successful, URL:', publicUrl);

      // Set state immediately
      setShippingQuoteUrl(publicUrl);
      console.log('State updated with URL:', publicUrl);
    } catch (err) {
      console.error('Upload error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload quote';
      setUploadError(`Upload failed: ${errorMessage}`);
    } finally {
      setUploadingQuote(false);
      // Reset the input so user can upload again if needed
      e.target.value = '';
    }
  };

  // Remove shipping quote
  const handleRemoveQuote = () => {
    setShippingQuoteUrl(null);
    setUploadError(null);
  };

  // Open fee modal and reset upload error
  const openFeeModal = () => {
    setUploadError(null);
    setShowFeeModal(true);
  };

  // Handle buyer approving fees
  const handleApproveFees = async () => {
    if (!invoice || !user?.id) return;

    setApprovingFees(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('invoices')
        .update({
          fees_status: 'approved',
          fees_responded_at: new Date().toISOString(),
        })
        .eq('id', invoice.id);

      if (updateError) throw updateError;

      // Notify seller (in-app notification)
      await supabase.from('notifications').insert({
        user_id: invoice.seller_id,
        type: 'fees_approved',
        title: 'Fees Approved',
        message: `The buyer has approved the packaging/shipping fees for invoice #${invoice.id.slice(0, 8)}.`,
        related_type: 'invoice',
        related_id: invoice.id,
      });

      // Send email notification to seller
      try {
        await fetch('/api/invoices/notify-fees', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            invoiceId: invoice.id,
            type: 'approved',
          }),
        });
      } catch (emailErr) {
        console.error('Failed to send fee approval email:', emailErr);
      }

      setInvoice(prev => prev ? { ...prev, fees_status: 'approved', fees_responded_at: new Date().toISOString() } : null);
      setSuccess('Fees approved! You can now proceed with payment.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve fees');
    } finally {
      setApprovingFees(false);
    }
  };

  // Handle buyer rejecting fees
  const handleRejectFees = async () => {
    if (!invoice || !user?.id || !rejectionReason.trim()) return;

    setApprovingFees(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('invoices')
        .update({
          fees_status: 'rejected',
          fees_responded_at: new Date().toISOString(),
          fees_rejection_reason: rejectionReason.trim(),
        })
        .eq('id', invoice.id);

      if (updateError) throw updateError;

      // Notify seller (in-app notification)
      await supabase.from('notifications').insert({
        user_id: invoice.seller_id,
        type: 'fees_rejected',
        title: 'Fees Rejected',
        message: `The buyer has rejected the packaging/shipping fees for invoice #${invoice.id.slice(0, 8)}. Reason: ${rejectionReason.trim()}`,
        related_type: 'invoice',
        related_id: invoice.id,
      });

      // Send email notification to seller
      try {
        await fetch('/api/invoices/notify-fees', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            invoiceId: invoice.id,
            type: 'rejected',
            rejectionReason: rejectionReason.trim(),
          }),
        });
      } catch (emailErr) {
        console.error('Failed to send fee rejection email:', emailErr);
      }

      setInvoice(prev => prev ? {
        ...prev,
        fees_status: 'rejected',
        fees_responded_at: new Date().toISOString(),
        fees_rejection_reason: rejectionReason.trim()
      } : null);
      setShowApprovalModal(false);
      setRejectionReason('');
      setSuccess('Fees rejected. The seller has been notified.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject fees');
    } finally {
      setApprovingFees(false);
    }
  };

  // Handle seller marking item as shipped
  const handleMarkShipped = async () => {
    if (!invoice || !user?.id) return;

    setUpdatingShipping(true);
    setError(null);

    try {
      const updateData: Record<string, unknown> = {
        fulfillment_status: 'shipped',
        shipped_at: new Date().toISOString(),
      };

      // Add freight shipping details
      if (freightCarrier.trim()) updateData.shipping_carrier = freightCarrier.trim();
      if (freightBolNumber.trim()) updateData.freight_bol_number = freightBolNumber.trim();
      if (freightProNumber.trim()) {
        updateData.freight_pro_number = freightProNumber.trim();
        updateData.tracking_number = freightProNumber.trim(); // PRO number is the tracking number for freight
      }
      if (freightClass.trim()) updateData.freight_class = freightClass.trim();
      if (freightWeightLbs) updateData.freight_weight_lbs = parseInt(freightWeightLbs);
      if (freightPickupDate) updateData.freight_pickup_date = freightPickupDate;
      if (freightEstimatedDelivery) updateData.freight_estimated_delivery = freightEstimatedDelivery;
      if (freightPickupContact.name || freightPickupContact.phone) {
        updateData.freight_pickup_contact = freightPickupContact;
      }
      if (freightDeliveryContact.name || freightDeliveryContact.phone) {
        updateData.freight_delivery_contact = freightDeliveryContact;
      }
      if (freightSpecialInstructions.trim()) updateData.freight_special_instructions = freightSpecialInstructions.trim();

      const { error: updateError } = await supabase
        .from('invoices')
        .update(updateData)
        .eq('id', invoice.id);

      if (updateError) throw updateError;

      // Build notification message
      const trackingInfo = freightProNumber.trim() ? ` PRO #: ${freightProNumber.trim()}` : '';
      const carrierInfo = freightCarrier.trim() ? ` via ${freightCarrier.trim()}` : '';

      // Notify buyer
      await supabase.from('notifications').insert({
        user_id: invoice.buyer_id,
        type: 'item_shipped',
        title: 'Item Shipped',
        message: `Your item has been shipped${carrierInfo}!${trackingInfo} Check your invoice for freight details.`,
        related_type: 'invoice',
        related_id: invoice.id,
      });

      setInvoice(prev => prev ? {
        ...prev,
        fulfillment_status: 'shipped',
        shipped_at: new Date().toISOString(),
        shipping_carrier: freightCarrier.trim() || prev.shipping_carrier,
        tracking_number: freightProNumber.trim() || prev.tracking_number,
        freight_bol_number: freightBolNumber.trim() || prev.freight_bol_number,
        freight_pro_number: freightProNumber.trim() || prev.freight_pro_number,
        freight_class: freightClass.trim() || prev.freight_class,
        freight_weight_lbs: freightWeightLbs ? parseInt(freightWeightLbs) : prev.freight_weight_lbs,
        freight_pickup_date: freightPickupDate || prev.freight_pickup_date,
        freight_estimated_delivery: freightEstimatedDelivery || prev.freight_estimated_delivery,
        freight_pickup_contact: (freightPickupContact.name || freightPickupContact.phone) ? freightPickupContact : prev.freight_pickup_contact,
        freight_delivery_contact: (freightDeliveryContact.name || freightDeliveryContact.phone) ? freightDeliveryContact : prev.freight_delivery_contact,
        freight_special_instructions: freightSpecialInstructions.trim() || prev.freight_special_instructions,
      } : null);
      setShowShippingModal(false);
      resetFreightForm();
      setSuccess('Item marked as shipped! The buyer has been notified.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update shipping status');
    } finally {
      setUpdatingShipping(false);
    }
  };

  // Reset freight form
  const resetFreightForm = () => {
    setFreightCarrier('');
    setFreightBolNumber('');
    setFreightProNumber('');
    setFreightClass('');
    setFreightWeightLbs('');
    setFreightPickupDate('');
    setFreightEstimatedDelivery('');
    setFreightPickupContact({ name: '', phone: '', email: '', company: '' });
    setFreightDeliveryContact({ name: '', phone: '', email: '', company: '' });
    setFreightSpecialInstructions('');
  };

  // Initialize freight form when editing existing shipment
  const initFreightFormFromInvoice = () => {
    if (invoice) {
      setFreightCarrier(invoice.shipping_carrier || '');
      setFreightBolNumber(invoice.freight_bol_number || '');
      setFreightProNumber(invoice.freight_pro_number || invoice.tracking_number || '');
      setFreightClass(invoice.freight_class || '');
      setFreightWeightLbs(invoice.freight_weight_lbs?.toString() || '');
      setFreightPickupDate(invoice.freight_pickup_date || '');
      setFreightEstimatedDelivery(invoice.freight_estimated_delivery || '');
      setFreightPickupContact(invoice.freight_pickup_contact || { name: '', phone: '', email: '', company: '' });
      setFreightDeliveryContact(invoice.freight_delivery_contact || { name: '', phone: '', email: '', company: '' });
      setFreightSpecialInstructions(invoice.freight_special_instructions || '');
    }
  };

  // Handle seller marking item as delivered
  const handleMarkDelivered = async () => {
    if (!invoice || !user?.id) return;

    setUpdatingShipping(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('invoices')
        .update({
          fulfillment_status: 'delivered',
          delivered_at: new Date().toISOString(),
        })
        .eq('id', invoice.id);

      if (updateError) throw updateError;

      // Notify buyer
      await supabase.from('notifications').insert({
        user_id: invoice.buyer_id,
        type: 'item_delivered',
        title: 'Item Delivered',
        message: `Your item has been marked as delivered. Thank you for your purchase!`,
        related_type: 'invoice',
        related_id: invoice.id,
      });

      setInvoice(prev => prev ? {
        ...prev,
        fulfillment_status: 'delivered',
        delivered_at: new Date().toISOString(),
      } : null);
      setSuccess('Item marked as delivered!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update delivery status');
    } finally {
      setUpdatingShipping(false);
    }
  };

  // Handle BOL file selection
  const handleBolFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDeliveryBolFile(file);
      // Create preview for images, show filename for PDFs
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        setDeliveryBolPreview(url);
      } else {
        setDeliveryBolPreview(null);
      }
    }
  };

  // Handle BOL modal file selection
  const handleBolModalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBolModalFile(file);
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        setBolModalPreview(url);
      } else {
        setBolModalPreview(null);
      }
    }
  };

  // Handle shipping photos selection
  const handleShippingPhotosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setShippingPhotos(prev => [...prev, ...files]);
      const previews = files.map(file => URL.createObjectURL(file));
      setShippingPhotoPreviews(prev => [...prev, ...previews]);
    }
  };

  // Remove shipping photo
  const removeShippingPhoto = (index: number) => {
    URL.revokeObjectURL(shippingPhotoPreviews[index]);
    setShippingPhotos(prev => prev.filter((_, i) => i !== index));
    setShippingPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Close BOL modal and clean up
  const closeBolModal = () => {
    setShowBolModal(false);
    setBolModalFile(null);
    if (bolModalPreview) URL.revokeObjectURL(bolModalPreview);
    setBolModalPreview(null);
    shippingPhotoPreviews.forEach(url => URL.revokeObjectURL(url));
    setShippingPhotos([]);
    setShippingPhotoPreviews([]);
  };

  // Upload BOL and shipping photos from modal
  const handleUploadBolModal = async () => {
    if (!invoice || !user?.id) return;
    if (!bolModalFile && shippingPhotos.length === 0) return;

    setUploadingBolModal(true);
    setError(null);

    try {
      let bolUrl: string | null = invoice.delivery_bol_url || null;
      const photoUrls: string[] = invoice.shipping_photos || [];

      // Upload BOL if provided
      if (bolModalFile) {
        const fileExt = bolModalFile.name.split('.').pop();
        const fileName = `${invoice.id}/bol-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(fileName, bolModalFile);

        if (uploadError) {
          throw new Error('Failed to upload Bill of Lading');
        }

        const { data: urlData } = supabase.storage
          .from('documents')
          .getPublicUrl(fileName);
        bolUrl = urlData.publicUrl;
      }

      // Upload shipping photos
      for (let i = 0; i < shippingPhotos.length; i++) {
        const file = shippingPhotos[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${invoice.id}/shipping-${Date.now()}-${i}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(fileName, file);

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from('documents')
            .getPublicUrl(fileName);
          photoUrls.push(urlData.publicUrl);
        }
      }

      // Save to invoice
      const { error: updateError } = await supabase
        .from('invoices')
        .update({
          delivery_bol_url: bolUrl,
          shipping_photos: photoUrls.length > 0 ? photoUrls : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', invoice.id);

      if (updateError) throw updateError;

      // Refresh invoice data
      const { data: refreshedInvoice } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoice.id)
        .single();

      if (refreshedInvoice) {
        setInvoice(prev => prev ? { ...prev, ...refreshedInvoice } : prev);
      }

      closeBolModal();
      setSuccess('Documents uploaded successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload documents');
    } finally {
      setUploadingBolModal(false);
    }
  };

  // Handle damage photo selection
  const handleDamagePhotosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setDeliveryDamageFiles(prev => [...prev, ...files]);
      const previews = files.map(file => URL.createObjectURL(file));
      setDeliveryDamagePreviews(prev => [...prev, ...previews]);
    }
  };

  // Remove damage photo
  const removeDamagePhoto = (index: number) => {
    URL.revokeObjectURL(deliveryDamagePreviews[index]);
    setDeliveryDamageFiles(prev => prev.filter((_, i) => i !== index));
    setDeliveryDamagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Handle buyer confirming delivery
  const handleConfirmDelivery = async () => {
    if (!invoice || !user?.id) return;

    setConfirmingDelivery(true);
    setError(null);

    try {
      let bolUrl: string | null = null;
      const damagePhotoUrls: string[] = [];

      // Upload BOL if provided
      if (deliveryBolFile) {
        const fileExt = deliveryBolFile.name.split('.').pop();
        const fileName = `${invoice.id}/bol-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(fileName, deliveryBolFile);

        if (uploadError) {
          console.error('BOL upload error:', uploadError);
        } else {
          const { data: urlData } = supabase.storage
            .from('documents')
            .getPublicUrl(fileName);
          bolUrl = urlData.publicUrl;
        }
      }

      // Upload damage photos if any
      for (let i = 0; i < deliveryDamageFiles.length; i++) {
        const file = deliveryDamageFiles[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${invoice.id}/damage-${Date.now()}-${i}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(fileName, file);

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from('documents')
            .getPublicUrl(fileName);
          damagePhotoUrls.push(urlData.publicUrl);
        }
      }

      // Update invoice
      const updateData: Record<string, unknown> = {
        fulfillment_status: 'delivered',
        delivered_at: new Date().toISOString(),
        delivery_confirmed_at: new Date().toISOString(),
        delivery_confirmed_by: user.id,
        delivery_condition: deliveryCondition,
        delivery_notes: deliveryNotes.trim() || null,
        delivery_bol_url: bolUrl,
        delivery_damage_photos: damagePhotoUrls.length > 0 ? damagePhotoUrls : null,
      };

      const { error: updateError } = await supabase
        .from('invoices')
        .update(updateData)
        .eq('id', invoice.id);

      if (updateError) throw updateError;

      // Notify seller
      const conditionText = deliveryCondition === 'good'
        ? 'in good condition'
        : deliveryCondition === 'damaged'
          ? 'with damage reported'
          : 'partially received';

      await supabase.from('notifications').insert({
        user_id: invoice.seller_id,
        type: 'item_delivered',
        title: 'Delivery Confirmed by Buyer',
        message: `The buyer has confirmed delivery of "${invoice.listing?.title || 'your item'}" ${conditionText}.${deliveryNotes.trim() ? ` Notes: ${deliveryNotes.trim()}` : ''}`,
        related_type: 'invoice',
        related_id: invoice.id,
      });

      // Update local state
      setInvoice(prev => prev ? {
        ...prev,
        fulfillment_status: 'delivered',
        delivered_at: new Date().toISOString(),
        delivery_confirmed_at: new Date().toISOString(),
        delivery_confirmed_by: user.id,
        delivery_condition: deliveryCondition,
        delivery_notes: deliveryNotes.trim() || null,
        delivery_bol_url: bolUrl,
        delivery_damage_photos: damagePhotoUrls.length > 0 ? damagePhotoUrls : null,
      } : null);

      // Clean up
      setShowDeliveryModal(false);
      setDeliveryCondition('good');
      setDeliveryNotes('');
      setDeliveryBolFile(null);
      setDeliveryBolPreview(null);
      deliveryDamagePreviews.forEach(url => URL.revokeObjectURL(url));
      setDeliveryDamageFiles([]);
      setDeliveryDamagePreviews([]);

      setSuccess('Delivery confirmed! The seller has been notified.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm delivery');
    } finally {
      setConfirmingDelivery(false);
    }
  };

  // Check for payment success/cancel from Stripe redirect
  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    if (paymentStatus === 'success') {
      // Verify and process payment (fallback if webhook didn't fire)
      fetch('/api/stripe/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setSuccess('Payment successful! The seller has been notified.');
            // Reload invoice to get updated status
            window.location.href = `/dashboard/invoices/${invoiceId}`;
          }
        })
        .catch(err => {
          console.error('Payment verification error:', err);
          setSuccess('Payment successful! The seller has been notified.');
        });
    } else if (paymentStatus === 'cancelled') {
      setError('Payment was cancelled. You can try again when ready.');
    }
  }, [searchParams, invoiceId]);

  // Auto-open shipping modal when action=ship
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'ship' && invoice && isSeller && invoice.status === 'paid' && invoice.fulfillment_status !== 'shipped' && invoice.fulfillment_status !== 'delivered') {
      setShowShippingModal(true);
    }
  }, [searchParams, invoice, isSeller]);

  useEffect(() => {
    async function loadInvoice() {
      // Wait for auth to finish loading
      if (authLoading) return;

      // If no user after auth loaded, stop loading
      if (!user?.id) {
        setLoading(false);
        return;
      }

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
      const [listingResult, sellerResult, buyerResult] = await Promise.all([
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
        supabase
          .from('profiles')
          .select('id, full_name, company_name, email')
          .eq('id', data.buyer_id)
          .single(),
      ]);

      // Try to get listing images
      const { data: imagesData } = await supabase
        .from('listing_images')
        .select('url, is_primary')
        .eq('listing_id', data.listing_id);

      const invoiceWithDetails: Invoice = {
        ...data,
        fees_status: data.fees_status || 'none',
        listing: listingResult.data ? {
          ...listingResult.data,
          images: imagesData || [],
        } : undefined,
        seller: sellerResult.data || undefined,
        buyer: buyerResult.data || undefined,
      };

      setInvoice(invoiceWithDetails);
      setLoading(false);
    }

    loadInvoice();
  }, [invoiceId, user?.id, authLoading, supabase]);

  const handlePayment = async (method: 'credit_card' | 'ach' | 'wire') => {
    if (!invoice || !user?.id) return;

    setProcessing(true);
    setError(null);

    try {
      if (method === 'credit_card') {
        // Use Stripe Checkout for credit card payments
        const response = await fetch('/api/stripe/create-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            invoiceId: invoice.id,
            userId: user.id,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to create checkout session');
        }

        // Redirect to Stripe Checkout
        if (data.url) {
          window.location.href = data.url;
        } else if (data.sessionId) {
          const stripe = await getStripe();
          if (stripe) {
            // Type assertion for deprecated redirectToCheckout
            const stripeWithRedirect = stripe as unknown as {
              redirectToCheckout: (opts: { sessionId: string }) => Promise<{ error?: { message: string } }>
            };
            await stripeWithRedirect.redirectToCheckout({ sessionId: data.sessionId });
          }
        }
        return;
      }

      if (method === 'wire') {
        // Show wire transfer instructions
        setSuccess('Wire transfer instructions have been sent to your email. Please reference invoice #' + invoice.invoice_number);
        setProcessing(false);
        return;
      }

      if (method === 'ach') {
        // ACH payments - for now show a message, can integrate Stripe ACH later
        setSuccess('ACH payment instructions have been sent to your email. Please complete the bank transfer within 3 business days.');
        setProcessing(false);
        return;
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
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
        title: invoice.paid_at ? 'Payment Received' : 'Payment Due',
        description: invoice.paid_at
          ? `Paid via ${invoice.payment_method?.replace('_', ' ') || 'card'}`
          : `Total due: $${invoice.total_amount.toLocaleString()}`,
        date: invoice.paid_at || invoice.payment_due_date,
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
  const timeline = getTimeline();

  const handleDownloadPDF = () => {
    if (!invoice) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to download the invoice PDF');
      return;
    }

    const isReceipt = invoice.status === 'paid';
    const documentTitle = isReceipt ? 'RECEIPT' : 'INVOICE';
    const statusText = isReceipt ? 'PAID' : (isPastDue ? 'OVERDUE' : 'PENDING');
    const statusColor = isReceipt ? '#059669' : (isPastDue ? '#dc2626' : '#d97706');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${documentTitle} #${invoice.id.slice(0, 8)} - PrintMailBids</title>
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
            <h1>${documentTitle}</h1>
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
              <span>${isReceipt ? 'Total Paid' : 'Total Due'}</span>
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

      {/* Buyer Fee Approval Banner */}
      {isBuyer && invoice.fees_status === 'pending_approval' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-amber-100 rounded-lg">
              <AlertCircle className="h-6 w-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-amber-800 mb-1">Action Required: Review Additional Fees</h3>
              <p className="text-amber-700 text-sm mb-4">
                The seller has added packaging and/or shipping fees to your invoice. Please review and approve before making payment.
              </p>

              <div className="bg-white rounded-lg p-4 mb-4 space-y-3">
                {invoice.packaging_amount > 0 && (
                  <div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900 flex items-center gap-2">
                        <Package className="h-4 w-4 text-gray-500" />
                        Packaging / Crating
                      </span>
                      <span className="font-semibold text-gray-900">${invoice.packaging_amount.toLocaleString()}</span>
                    </div>
                    {invoice.packaging_note && (
                      <p className="text-sm text-gray-600 mt-1 ml-6">{invoice.packaging_note}</p>
                    )}
                  </div>
                )}
                {invoice.shipping_amount > 0 && (
                  <div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900 flex items-center gap-2">
                        <Truck className="h-4 w-4 text-gray-500" />
                        Shipping / Freight
                      </span>
                      <span className="font-semibold text-gray-900">${invoice.shipping_amount.toLocaleString()}</span>
                    </div>
                    {invoice.shipping_note && (
                      <p className="text-sm text-gray-600 mt-1 ml-6">{invoice.shipping_note}</p>
                    )}
                    {invoice.shipping_quote_url && (
                      <a
                        href={invoice.shipping_quote_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 mt-2 ml-6"
                      >
                        <FileText className="h-4 w-4" />
                        View Shipping Quote (PDF)
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                )}
                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-700">Additional Fees Total</span>
                    <span className="font-bold text-gray-900">
                      ${((invoice.packaging_amount || 0) + (invoice.shipping_amount || 0)).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleApproveFees}
                  disabled={approvingFees}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50"
                >
                  {approvingFees ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                  Approve Fees
                </button>
                <button
                  onClick={() => setShowApprovalModal(true)}
                  disabled={approvingFees}
                  className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg font-medium hover:bg-red-50 transition disabled:opacity-50"
                >
                  <XCircle className="h-4 w-4" />
                  Reject Fees
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Seller Fee Status Banner */}
      {isSeller && invoice.fees_status === 'pending_approval' && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-blue-800">Awaiting Buyer Approval</p>
              <p className="text-sm text-blue-700">The buyer is reviewing the packaging/shipping fees you submitted.</p>
              <button
                onClick={openFeeModal}
                className="mt-2 text-sm text-blue-700 underline hover:text-blue-800"
              >
                Edit fees before buyer responds
              </button>
            </div>
          </div>
        </div>
      )}

      {isSeller && invoice.fees_status === 'rejected' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-red-800">Fees Rejected by Buyer</p>
              {invoice.fees_rejection_reason && (
                <p className="text-sm text-red-700 mt-1">Reason: {invoice.fees_rejection_reason}</p>
              )}
              <button
                onClick={openFeeModal}
                className="mt-2 text-sm text-red-700 underline hover:text-red-800"
              >
                Edit and resubmit fees
              </button>
            </div>
          </div>
        </div>
      )}

      {isSeller && invoice.fees_status === 'approved' && (invoice.packaging_amount > 0 || invoice.shipping_amount > 0) && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <div>
            <p className="font-medium text-green-800">Fees Approved</p>
            <p className="text-sm text-green-700">The buyer has approved the packaging/shipping fees.</p>
          </div>
        </div>
      )}

      {/* Seller Shipping Controls - Show when invoice is paid */}
      {isSeller && invoice.status === 'paid' && invoice.fulfillment_status !== 'delivered' && (
        <div id="shipping-controls" className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6 scroll-mt-24">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Truck className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-800 mb-1">
                {invoice.fulfillment_status === 'shipped' ? 'Item Shipped' : 'Ready to Ship'}
              </h3>
              <p className="text-blue-700 text-sm mb-4">
                {invoice.fulfillment_status === 'shipped'
                  ? `Shipped on ${formatDate(invoice.shipped_at)}${invoice.tracking_number ? ` • Tracking: ${invoice.tracking_number}` : ''}`
                  : 'Payment received! Please ship the item and update the tracking information.'}
              </p>

              <div className="flex flex-wrap gap-3">
                {invoice.fulfillment_status !== 'shipped' && (
                  <button
                    onClick={() => setShowShippingModal(true)}
                    disabled={updatingShipping}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    <Truck className="h-4 w-4" />
                    Mark as Shipped
                  </button>
                )}
                {invoice.fulfillment_status === 'shipped' && (
                  <>
                    <button
                      onClick={handleMarkDelivered}
                      disabled={updatingShipping}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50"
                    >
                      {updatingShipping ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                      Mark as Delivered
                    </button>
                    <button
                      onClick={() => {
                        initFreightFormFromInvoice();
                        setShowShippingModal(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2 border border-blue-300 text-blue-700 rounded-lg font-medium hover:bg-blue-100 transition"
                    >
                      <Edit3 className="h-4 w-4" />
                      Update Freight Details
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Buyer Confirm Delivery - Show when item is shipped but not yet confirmed by buyer */}
      {isBuyer && invoice.fulfillment_status === 'shipped' && !invoice.delivery_confirmed_at && (
        <div id="delivery-confirmation" className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6 scroll-mt-24">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Package className="h-6 w-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-green-800 mb-1">
                Item Shipped - Confirm Delivery
              </h3>
              <p className="text-green-700 text-sm mb-4">
                Your item has been shipped! Once you receive it, please confirm delivery and upload the signed Bill of Lading.
              </p>

              <button
                onClick={() => setShowDeliveryModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition"
              >
                <CheckCircle className="h-4 w-4" />
                Confirm Delivery
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Freight Shipping Modal */}
      {showShippingModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 my-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {invoice.fulfillment_status === 'shipped' ? 'Update Freight Details' : 'Enter Freight Shipping Details'}
              </h3>
              <button
                onClick={() => { setShowShippingModal(false); resetFreightForm(); }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <p className="text-gray-600 text-sm mb-6">
              Enter the freight shipping details for this equipment. The buyer will be notified with this information.
            </p>

            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
              {/* Carrier & Tracking */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Carrier & Tracking</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Freight Carrier <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={freightCarrier}
                      onChange={(e) => setFreightCarrier(e.target.value)}
                      placeholder="e.g., XPO Logistics, Old Dominion, ABF"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      PRO Number (Tracking)
                    </label>
                    <input
                      type="text"
                      value={freightProNumber}
                      onChange={(e) => setFreightProNumber(e.target.value)}
                      placeholder="e.g., 123456789"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bill of Lading (BOL) Number
                    </label>
                    <input
                      type="text"
                      value={freightBolNumber}
                      onChange={(e) => setFreightBolNumber(e.target.value)}
                      placeholder="e.g., BOL-2024-12345"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Freight Class
                    </label>
                    <select
                      value={freightClass}
                      onChange={(e) => setFreightClass(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select freight class</option>
                      <option value="50">Class 50 (Clean freight)</option>
                      <option value="55">Class 55</option>
                      <option value="60">Class 60</option>
                      <option value="65">Class 65</option>
                      <option value="70">Class 70</option>
                      <option value="77.5">Class 77.5</option>
                      <option value="85">Class 85</option>
                      <option value="92.5">Class 92.5</option>
                      <option value="100">Class 100</option>
                      <option value="110">Class 110</option>
                      <option value="125">Class 125</option>
                      <option value="150">Class 150</option>
                      <option value="175">Class 175</option>
                      <option value="200">Class 200</option>
                      <option value="250">Class 250</option>
                      <option value="300">Class 300</option>
                      <option value="400">Class 400</option>
                      <option value="500">Class 500 (Low density)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Weight & Dates */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Weight & Schedule</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Weight (lbs)
                    </label>
                    <input
                      type="number"
                      value={freightWeightLbs}
                      onChange={(e) => setFreightWeightLbs(e.target.value)}
                      placeholder="e.g., 5000"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pickup Date
                    </label>
                    <input
                      type="date"
                      value={freightPickupDate}
                      onChange={(e) => setFreightPickupDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Est. Delivery Date
                    </label>
                    <input
                      type="date"
                      value={freightEstimatedDelivery}
                      onChange={(e) => setFreightEstimatedDelivery(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Pickup Contact */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Pickup Contact (Shipper)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
                    <input
                      type="text"
                      value={freightPickupContact.name || ''}
                      onChange={(e) => setFreightPickupContact(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                    <input
                      type="text"
                      value={freightPickupContact.company || ''}
                      onChange={(e) => setFreightPickupContact(prev => ({ ...prev, company: e.target.value }))}
                      placeholder="Company name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={freightPickupContact.phone || ''}
                      onChange={(e) => setFreightPickupContact(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="(555) 123-4567"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={freightPickupContact.email || ''}
                      onChange={(e) => setFreightPickupContact(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="email@company.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Delivery Contact */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Delivery Contact (Consignee)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
                    <input
                      type="text"
                      value={freightDeliveryContact.name || ''}
                      onChange={(e) => setFreightDeliveryContact(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                    <input
                      type="text"
                      value={freightDeliveryContact.company || ''}
                      onChange={(e) => setFreightDeliveryContact(prev => ({ ...prev, company: e.target.value }))}
                      placeholder="Company name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={freightDeliveryContact.phone || ''}
                      onChange={(e) => setFreightDeliveryContact(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="(555) 123-4567"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={freightDeliveryContact.email || ''}
                      onChange={(e) => setFreightDeliveryContact(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="email@company.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Special Instructions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Special Instructions / Notes
                </label>
                <textarea
                  value={freightSpecialInstructions}
                  onChange={(e) => setFreightSpecialInstructions(e.target.value)}
                  placeholder="e.g., Liftgate required, call before delivery, dock hours 8am-4pm..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t">
              <button
                onClick={() => { setShowShippingModal(false); resetFreightForm(); }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkShipped}
                disabled={updatingShipping || !freightCarrier.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {updatingShipping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />}
                {invoice.fulfillment_status === 'shipped' ? 'Update Shipment' : 'Mark as Shipped'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fee Rejection Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Reject Fees</h3>
              <button
                onClick={() => { setShowApprovalModal(false); setRejectionReason(''); }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              Please explain why you&apos;re rejecting these fees. The seller will be able to revise and resubmit.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g., Shipping cost seems too high, I'd like to arrange my own freight..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 h-24 resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { setShowApprovalModal(false); setRejectionReason(''); }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectFees}
                disabled={!rejectionReason.trim() || approvingFees}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {approvingFees ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Reject Fees
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delivery Confirmation Modal (Buyer) */}
      {showDeliveryModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 my-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Confirm Delivery</h3>
              <button
                onClick={() => {
                  setShowDeliveryModal(false);
                  setDeliveryCondition('good');
                  setDeliveryNotes('');
                  setDeliveryBolFile(null);
                  setDeliveryBolPreview(null);
                  deliveryDamagePreviews.forEach(url => URL.revokeObjectURL(url));
                  setDeliveryDamageFiles([]);
                  setDeliveryDamagePreviews([]);
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <p className="text-gray-600 text-sm mb-6">
              Confirm that you have received the item. You can upload the signed Bill of Lading and report any damage.
            </p>

            <div className="space-y-6">
              {/* Condition Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Item Condition <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setDeliveryCondition('good')}
                    className={`p-3 rounded-lg border-2 text-center transition ${
                      deliveryCondition === 'good'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <CheckCircle className={`h-6 w-6 mx-auto mb-1 ${deliveryCondition === 'good' ? 'text-green-600' : 'text-gray-400'}`} />
                    <span className="text-sm font-medium">Good</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryCondition('partial')}
                    className={`p-3 rounded-lg border-2 text-center transition ${
                      deliveryCondition === 'partial'
                        ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <AlertCircle className={`h-6 w-6 mx-auto mb-1 ${deliveryCondition === 'partial' ? 'text-yellow-600' : 'text-gray-400'}`} />
                    <span className="text-sm font-medium">Partial</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryCondition('damaged')}
                    className={`p-3 rounded-lg border-2 text-center transition ${
                      deliveryCondition === 'damaged'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <XCircle className={`h-6 w-6 mx-auto mb-1 ${deliveryCondition === 'damaged' ? 'text-red-600' : 'text-gray-400'}`} />
                    <span className="text-sm font-medium">Damaged</span>
                  </button>
                </div>
              </div>

              {/* Signed BOL Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Signed Bill of Lading (optional)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition">
                  {deliveryBolFile ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {deliveryBolPreview ? (
                          <img src={deliveryBolPreview} alt="BOL Preview" className="w-16 h-16 object-cover rounded" />
                        ) : (
                          <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                            <FileText className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                        <span className="text-sm text-gray-700">{deliveryBolFile.name}</span>
                      </div>
                      <button
                        onClick={() => {
                          setDeliveryBolFile(null);
                          if (deliveryBolPreview) URL.revokeObjectURL(deliveryBolPreview);
                          setDeliveryBolPreview(null);
                        }}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <X className="h-5 w-5 text-gray-500" />
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Click to upload or take a photo</p>
                      <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG up to 10MB</p>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleBolFileChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Damage Photos (show if damaged or partial) */}
              {(deliveryCondition === 'damaged' || deliveryCondition === 'partial') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Damage Photos (optional but recommended)
                  </label>
                  <div className="space-y-3">
                    {deliveryDamagePreviews.length > 0 && (
                      <div className="grid grid-cols-4 gap-2">
                        {deliveryDamagePreviews.map((preview, index) => (
                          <div key={index} className="relative">
                            <img src={preview} alt={`Damage ${index + 1}`} className="w-full h-20 object-cover rounded" />
                            <button
                              onClick={() => removeDamagePhoto(index)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <label className="block border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition cursor-pointer">
                      <Camera className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                      <p className="text-sm text-gray-600">Add damage photos</p>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleDamagePhotosChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes {(deliveryCondition === 'damaged' || deliveryCondition === 'partial') && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  placeholder={
                    deliveryCondition === 'good'
                      ? 'Any comments about the delivery (optional)'
                      : 'Please describe the damage or what was missing...'
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t">
              <button
                onClick={() => {
                  setShowDeliveryModal(false);
                  setDeliveryCondition('good');
                  setDeliveryNotes('');
                  setDeliveryBolFile(null);
                  setDeliveryBolPreview(null);
                  deliveryDamagePreviews.forEach(url => URL.revokeObjectURL(url));
                  setDeliveryDamageFiles([]);
                  setDeliveryDamagePreviews([]);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelivery}
                disabled={confirmingDelivery || ((deliveryCondition === 'damaged' || deliveryCondition === 'partial') && !deliveryNotes.trim())}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {confirmingDelivery ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                Confirm Delivery
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BOL & Shipping Photos Upload Modal (Buyer) */}
      {showBolModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 my-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Upload Shipping Documents</h3>
              <button
                onClick={closeBolModal}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <p className="text-gray-600 text-sm mb-6">
              Upload the signed Bill of Lading and any photos of the shipment upon arrival.
            </p>

            <div className="space-y-6">
              {/* Signed BOL Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Signed Bill of Lading
                </label>
                {invoice?.delivery_bol_url && !bolModalFile && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-sm text-green-800">BOL already uploaded</span>
                    </div>
                    <a
                      href={invoice.delivery_bol_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      View
                    </a>
                  </div>
                )}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition">
                  {bolModalFile ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {bolModalPreview ? (
                          <img src={bolModalPreview} alt="BOL Preview" className="w-16 h-16 object-cover rounded" />
                        ) : (
                          <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                            <FileText className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                        <span className="text-sm text-gray-700">{bolModalFile.name}</span>
                      </div>
                      <button
                        onClick={() => {
                          setBolModalFile(null);
                          if (bolModalPreview) URL.revokeObjectURL(bolModalPreview);
                          setBolModalPreview(null);
                        }}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <X className="h-5 w-5 text-gray-500" />
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Click to upload or take a photo</p>
                      <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG up to 10MB</p>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleBolModalFileChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Shipping Photos */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shipping Photos (optional)
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Take photos of the equipment upon arrival to document its condition before unloading.
                </p>

                {/* Existing shipping photos */}
                {invoice?.shipping_photos && invoice.shipping_photos.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-2">Previously uploaded:</p>
                    <div className="grid grid-cols-4 gap-2">
                      {invoice.shipping_photos.map((url, index) => (
                        <a
                          key={index}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <img
                            src={url}
                            alt={`Shipping ${index + 1}`}
                            className="w-full h-16 object-cover rounded border hover:opacity-80 transition"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* New photos to upload */}
                {shippingPhotoPreviews.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {shippingPhotoPreviews.map((preview, index) => (
                      <div key={index} className="relative">
                        <img src={preview} alt={`Photo ${index + 1}`} className="w-full h-16 object-cover rounded" />
                        <button
                          onClick={() => removeShippingPhoto(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <label className="block border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition cursor-pointer">
                  <Camera className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                  <p className="text-sm text-gray-600">Add shipping photos</p>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleShippingPhotosChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t">
              <button
                onClick={closeBolModal}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUploadBolModal}
                disabled={uploadingBolModal || (!bolModalFile && shippingPhotos.length === 0)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {uploadingBolModal ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Upload Documents
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fee Editing Modal (Seller) */}
      {showFeeModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
            {/* Success State */}
            {feeModalSuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feeModalSuccess}</h3>
                <p className="text-sm text-gray-500">The invoice has been updated.</p>
              </div>
            ) : (
              <>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Add Packaging & Shipping Fees</h3>
              <button
                onClick={() => {
                  console.log('Closing fee modal via X button');
                  setShowFeeModal(false);
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Packaging Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Package className="h-4 w-4 inline mr-2" />
                  Packaging / Crating Cost
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={packagingAmount}
                    onChange={(e) => setPackagingAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <textarea
                  value={packagingNote}
                  onChange={(e) => setPackagingNote(e.target.value)}
                  placeholder="Describe what's included (e.g., custom crating, palletizing, shrink wrap)..."
                  className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-20 resize-none text-sm"
                />
              </div>

              {/* Shipping Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Truck className="h-4 w-4 inline mr-2" />
                  Shipping / Freight Cost
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={shippingAmount}
                    onChange={(e) => setShippingAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <textarea
                  value={shippingNote}
                  onChange={(e) => setShippingNote(e.target.value)}
                  placeholder="Describe shipping details (e.g., LTL freight to buyer's dock, includes liftgate)..."
                  className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-20 resize-none text-sm"
                />

                {/* Shipping Quote Upload */}
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FileText className="h-4 w-4 inline mr-2" />
                    Shipping Quote (PDF)
                  </label>
                  {shippingQuoteUrl ? (
                    <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <FileText className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-green-800 truncate">
                          Shipping quote uploaded
                        </p>
                        <a
                          href={shippingQuoteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-green-600 hover:underline"
                        >
                          View PDF
                        </a>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveQuote}
                        className="p-1 text-red-500 hover:bg-red-100 rounded"
                        title="Remove quote"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition">
                      <div className="flex flex-col items-center justify-center pt-2 pb-2">
                        {uploadingQuote ? (
                          <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
                        ) : (
                          <>
                            <Upload className="h-6 w-6 text-gray-400 mb-1" />
                            <p className="text-sm text-gray-500">
                              <span className="font-medium text-blue-600">Click to upload</span> shipping quote
                            </p>
                            <p className="text-xs text-gray-400">PDF only (max 10MB)</p>
                          </>
                        )}
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,application/pdf"
                        onChange={handleQuoteUpload}
                        disabled={uploadingQuote}
                      />
                    </label>
                  )}
                  {uploadError && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-700">{uploadError}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Current invoice total</span>
                  <span>${(invoice.sale_amount + invoice.buyer_premium_amount + (invoice.tax_amount || 0)).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>+ Packaging</span>
                  <span>${(parseFloat(packagingAmount) || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>+ Shipping</span>
                  <span>${(parseFloat(shippingAmount) || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-semibold text-gray-900 pt-2 border-t">
                  <span>New Total</span>
                  <span>${(invoice.sale_amount + invoice.buyer_premium_amount + (invoice.tax_amount || 0) + (parseFloat(packagingAmount) || 0) + (parseFloat(shippingAmount) || 0)).toLocaleString()}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    console.log('Save Draft button clicked');
                    handleSaveFees(false);
                  }}
                  disabled={savingFees}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50"
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  onClick={() => {
                    console.log('Submit for Approval button clicked');
                    handleSaveFees(true);
                  }}
                  disabled={savingFees || ((parseFloat(packagingAmount) || 0) === 0 && (parseFloat(shippingAmount) || 0) === 0)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {savingFees ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Submit for Approval
                </button>
              </div>

              <p className="text-xs text-gray-500 text-center">
                The buyer will need to approve these fees before they can complete payment.
              </p>
            </div>
              </>
            )}
          </div>
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

          {/* Freight Shipping Details (if shipped) */}
          {(invoice.shipped_at || invoice.shipping_carrier || invoice.freight_bol_number) && (
            <div id="shipping-details" className="bg-white rounded-xl shadow-sm border p-6 scroll-mt-24">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Truck className="h-5 w-5 text-blue-600" />
                Freight Shipping Details
              </h2>

              <div className="space-y-6">
                {/* Carrier & Tracking Row */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {invoice.shipping_carrier && (
                    <div>
                      <p className="text-sm text-gray-500">Carrier</p>
                      <p className="font-medium text-gray-900">{invoice.shipping_carrier}</p>
                    </div>
                  )}

                  {(invoice.freight_pro_number || invoice.tracking_number) && (
                    <div>
                      <p className="text-sm text-gray-500">PRO Number</p>
                      <p className="font-mono font-medium text-gray-900">{invoice.freight_pro_number || invoice.tracking_number}</p>
                    </div>
                  )}

                  {invoice.freight_bol_number && (
                    <div>
                      <p className="text-sm text-gray-500">Bill of Lading</p>
                      <p className="font-mono font-medium text-gray-900">{invoice.freight_bol_number}</p>
                    </div>
                  )}

                  {invoice.freight_class && (
                    <div>
                      <p className="text-sm text-gray-500">Freight Class</p>
                      <p className="font-medium text-gray-900">Class {invoice.freight_class}</p>
                    </div>
                  )}
                </div>

                {/* Weight & Dates Row */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {invoice.freight_weight_lbs && (
                    <div>
                      <p className="text-sm text-gray-500">Weight</p>
                      <p className="font-medium text-gray-900">{invoice.freight_weight_lbs.toLocaleString()} lbs</p>
                    </div>
                  )}

                  {invoice.shipped_at && (
                    <div>
                      <p className="text-sm text-gray-500">Shipped Date</p>
                      <p className="font-medium text-gray-900">{formatDate(invoice.shipped_at)}</p>
                    </div>
                  )}

                  {invoice.freight_pickup_date && (
                    <div>
                      <p className="text-sm text-gray-500">Pickup Date</p>
                      <p className="font-medium text-gray-900">{formatDate(invoice.freight_pickup_date)}</p>
                    </div>
                  )}

                  {invoice.freight_estimated_delivery && (
                    <div>
                      <p className="text-sm text-gray-500">Est. Delivery</p>
                      <p className="font-medium text-gray-900">{formatDate(invoice.freight_estimated_delivery)}</p>
                    </div>
                  )}

                  {invoice.delivered_at && (
                    <div>
                      <p className="text-sm text-gray-500">Delivered Date</p>
                      <p className="font-medium text-green-600">{formatDate(invoice.delivered_at)}</p>
                    </div>
                  )}
                </div>

                {/* Contacts Row */}
                {(invoice.freight_pickup_contact || invoice.freight_delivery_contact) && (
                  <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t">
                    {invoice.freight_pickup_contact && (invoice.freight_pickup_contact.name || invoice.freight_pickup_contact.phone) && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Pickup Contact (Shipper)</p>
                        <div className="bg-gray-50 rounded-lg p-3 text-sm">
                          {invoice.freight_pickup_contact.name && (
                            <p className="font-medium text-gray-900">{invoice.freight_pickup_contact.name}</p>
                          )}
                          {invoice.freight_pickup_contact.company && (
                            <p className="text-gray-600">{invoice.freight_pickup_contact.company}</p>
                          )}
                          {invoice.freight_pickup_contact.phone && (
                            <p className="text-gray-600">
                              <a href={`tel:${invoice.freight_pickup_contact.phone}`} className="text-blue-600 hover:underline">
                                {invoice.freight_pickup_contact.phone}
                              </a>
                            </p>
                          )}
                          {invoice.freight_pickup_contact.email && (
                            <p className="text-gray-600">
                              <a href={`mailto:${invoice.freight_pickup_contact.email}`} className="text-blue-600 hover:underline">
                                {invoice.freight_pickup_contact.email}
                              </a>
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {invoice.freight_delivery_contact && (invoice.freight_delivery_contact.name || invoice.freight_delivery_contact.phone) && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Delivery Contact (Consignee)</p>
                        <div className="bg-gray-50 rounded-lg p-3 text-sm">
                          {invoice.freight_delivery_contact.name && (
                            <p className="font-medium text-gray-900">{invoice.freight_delivery_contact.name}</p>
                          )}
                          {invoice.freight_delivery_contact.company && (
                            <p className="text-gray-600">{invoice.freight_delivery_contact.company}</p>
                          )}
                          {invoice.freight_delivery_contact.phone && (
                            <p className="text-gray-600">
                              <a href={`tel:${invoice.freight_delivery_contact.phone}`} className="text-blue-600 hover:underline">
                                {invoice.freight_delivery_contact.phone}
                              </a>
                            </p>
                          )}
                          {invoice.freight_delivery_contact.email && (
                            <p className="text-gray-600">
                              <a href={`mailto:${invoice.freight_delivery_contact.email}`} className="text-blue-600 hover:underline">
                                {invoice.freight_delivery_contact.email}
                              </a>
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Special Instructions */}
                {invoice.freight_special_instructions && (
                  <div className="pt-4 border-t">
                    <p className="text-sm font-medium text-gray-700 mb-2">Special Instructions</p>
                    <p className="text-gray-600 bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
                      {invoice.freight_special_instructions}
                    </p>
                  </div>
                )}

                {/* Shipping Address */}
                {invoice.shipping_address && (
                  <div className="pt-4 border-t">
                    <p className="text-sm font-medium text-gray-700 mb-2">Delivery Address</p>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="text-gray-900 text-sm">
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

                {/* Buyer: Upload Documents & Confirm Delivery (before delivery confirmation) */}
                {isBuyer && invoice.fulfillment_status === 'shipped' && !invoice.delivery_confirmed_at && (
                  <div className="pt-4 border-t">
                    <p className="text-sm font-medium text-gray-700 mb-3">Shipment Actions</p>

                    {/* Show uploaded documents summary */}
                    {(invoice.delivery_bol_url || (invoice.shipping_photos && invoice.shipping_photos.length > 0)) && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <p className="text-sm font-medium text-blue-800 mb-2">Uploaded Documents</p>
                        <div className="flex flex-wrap gap-3">
                          {invoice.delivery_bol_url && (
                            <a
                              href={invoice.delivery_bol_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 bg-white px-3 py-1.5 rounded-lg border border-blue-200"
                            >
                              <FileText className="h-4 w-4" />
                              View Signed BOL
                            </a>
                          )}
                          {invoice.shipping_photos && invoice.shipping_photos.length > 0 && (
                            <span className="inline-flex items-center gap-1 text-sm text-blue-700 bg-white px-3 py-1.5 rounded-lg border border-blue-200">
                              <Camera className="h-4 w-4" />
                              {invoice.shipping_photos.length} Shipping Photo{invoice.shipping_photos.length > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        onClick={() => setShowBolModal(true)}
                        className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                      >
                        <Upload className="h-5 w-5" />
                        Upload BOL / Photos
                      </button>
                      <button
                        onClick={() => setShowDeliveryModal(true)}
                        className="flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
                      >
                        <CheckCircle className="h-5 w-5" />
                        Confirm Delivery
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 text-center mt-3">
                      Upload the signed BOL and any shipping photos, then confirm delivery once you&apos;ve inspected the item
                    </p>
                  </div>
                )}

                {/* Delivery Confirmation (if buyer confirmed) */}
                {invoice.delivery_confirmed_at && (
                  <div className="pt-4 border-t">
                    <p className="text-sm font-medium text-gray-700 mb-3">Buyer Delivery Confirmation</p>
                    <div className={`rounded-lg p-4 ${
                      invoice.delivery_condition === 'good'
                        ? 'bg-green-50 border border-green-200'
                        : invoice.delivery_condition === 'damaged'
                          ? 'bg-red-50 border border-red-200'
                          : 'bg-yellow-50 border border-yellow-200'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        {invoice.delivery_condition === 'good' && (
                          <>
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <span className="font-medium text-green-800">Received in Good Condition</span>
                          </>
                        )}
                        {invoice.delivery_condition === 'partial' && (
                          <>
                            <AlertCircle className="h-5 w-5 text-yellow-600" />
                            <span className="font-medium text-yellow-800">Partial Delivery</span>
                          </>
                        )}
                        {invoice.delivery_condition === 'damaged' && (
                          <>
                            <XCircle className="h-5 w-5 text-red-600" />
                            <span className="font-medium text-red-800">Damage Reported</span>
                          </>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        Confirmed on {formatDate(invoice.delivery_confirmed_at)}
                      </p>
                      {invoice.delivery_notes && (
                        <p className="text-sm text-gray-700 bg-white/50 rounded p-2 mb-3">
                          {invoice.delivery_notes}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-3">
                        {invoice.delivery_bol_url && (
                          <a
                            href={invoice.delivery_bol_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                          >
                            <FileText className="h-4 w-4" />
                            View Signed BOL
                          </a>
                        )}
                        {invoice.delivery_damage_photos && invoice.delivery_damage_photos.length > 0 && (
                          <div className="w-full">
                            <p className="text-sm font-medium text-gray-700 mb-2">Damage Photos:</p>
                            <div className="grid grid-cols-4 gap-2">
                              {invoice.delivery_damage_photos.map((url, index) => (
                                <a
                                  key={index}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block"
                                >
                                  <img
                                    src={url}
                                    alt={`Damage ${index + 1}`}
                                    className="w-full h-20 object-cover rounded border hover:opacity-80 transition"
                                  />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Price Breakdown</h2>
              {isSeller && invoice.status !== 'paid' && invoice.fees_status !== 'approved' && (
                <button
                  onClick={openFeeModal}
                  className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  <Edit3 className="h-4 w-4" />
                  {invoice.fees_status === 'pending_approval' ? 'Edit Pending Fees' : (invoice.packaging_amount > 0 || invoice.shipping_amount > 0 ? 'Edit Fees' : 'Add Fees')}
                </button>
              )}
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Winning Bid</span>
                <span className="font-medium">${invoice.sale_amount?.toLocaleString() || '0'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Buyer Premium ({invoice.buyer_premium_percent || 5}%)</span>
                <span className="font-medium">${invoice.buyer_premium_amount?.toLocaleString() || '0'}</span>
              </div>

              {/* Packaging Fee */}
              {invoice.packaging_amount > 0 && (
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 flex items-center gap-1.5">
                      <Package className="h-4 w-4" />
                      Packaging / Crating
                      {invoice.fees_status === 'pending_approval' && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Pending</span>
                      )}
                    </span>
                    <span className="font-medium">${invoice.packaging_amount.toLocaleString()}</span>
                  </div>
                  {invoice.packaging_note && (
                    <p className="text-xs text-gray-500 mt-1 ml-5">{invoice.packaging_note}</p>
                  )}
                </div>
              )}

              {/* Shipping Fee */}
              {invoice.shipping_amount > 0 && (
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 flex items-center gap-1.5">
                      <Truck className="h-4 w-4" />
                      Shipping / Freight
                      {invoice.fees_status === 'pending_approval' && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Pending</span>
                      )}
                    </span>
                    <span className="font-medium">${invoice.shipping_amount.toLocaleString()}</span>
                  </div>
                  {invoice.shipping_note && (
                    <p className="text-xs text-gray-500 mt-1 ml-5">{invoice.shipping_note}</p>
                  )}
                  {invoice.shipping_quote_url && (
                    <a
                      href={invoice.shipping_quote_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 mt-1 ml-5"
                    >
                      <FileText className="h-3 w-3" />
                      View Quote PDF
                    </a>
                  )}
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
                    {invoice.fees_status === 'pending_approval' ? (
                      <div className="text-center py-3">
                        <Clock className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                        <p className="text-sm font-medium text-amber-700">Review Required</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Please approve or reject the packaging/shipping fees above before paying.
                        </p>
                      </div>
                    ) : (
                      <>
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
                      </>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Download Invoice/Receipt */}
          <div className="space-y-2">
            <button
              onClick={handleDownloadPDF}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
            >
              <Download className="h-5 w-5" />
              Download {invoice.status === 'paid' ? 'Receipt' : 'Invoice'}
            </button>
            {invoice.status === 'paid' && (
              <p className="text-xs text-gray-500 text-center">
                A receipt was emailed to you upon payment
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
