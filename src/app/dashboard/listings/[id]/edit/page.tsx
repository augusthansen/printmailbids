'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  Loader2,
  Camera,
  Package,
  DollarSign,
  FileText,
  Truck,
  AlertCircle,
  X,
  Upload,
  GripVertical,
  Video,
  Rocket,
  Clock,
  Cpu,
  Settings,
  Info,
  Calendar,
  Zap,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';

interface ListingImage {
  id: string;
  url: string;
  is_primary: boolean;
  sort_order: number;
}

interface Listing {
  id: string;
  title: string;
  description: string;
  seller_terms: string | null;
  shipping_info: string | null;
  make: string;
  model: string;
  year: number | null;
  serial_number: string;
  condition: string;
  hours_count: number | null;
  equipment_status: string;
  listing_type: string;
  starting_price: number | null;
  reserve_price: number | null;
  buy_now_price: number | null;
  fixed_price: number | null;
  accept_offers: boolean;
  auto_accept_price: number | null;
  auto_decline_price: number | null;
  onsite_assistance: string;
  weight_lbs: number | null;
  removal_deadline: string | null;
  pickup_notes: string;
  payment_due_days: number;
  accepts_credit_card: boolean;
  accepts_ach: boolean;
  accepts_wire: boolean;
  accepts_check: boolean;
  seller_id: string;
  status: string;
  primary_category_id: string | null;
  video_url: string | null;
  images?: ListingImage[];
}

const conditionOptions = [
  { value: 'excellent', label: 'Excellent - Like new' },
  { value: 'good', label: 'Good - Minor wear' },
  { value: 'fair', label: 'Fair - Shows wear' },
  { value: 'poor', label: 'Poor - Needs repair' },
  { value: 'parts', label: 'For Parts Only' },
];

const equipmentStatuses = [
  { id: 'in_production', label: 'In Production' },
  { id: 'installed_idle', label: 'Installed but Idle' },
  { id: 'needs_deinstall', label: 'Needs De-installation' },
  { id: 'deinstalled', label: 'De-installed' },
  { id: 'broken_down', label: 'Broken Down' },
  { id: 'palletized', label: 'Palletized' },
  { id: 'crated', label: 'Crated' },
];

const onsiteAssistanceOptions = [
  { id: 'full_assistance', label: 'Full Assistance' },
  { id: 'forklift_available', label: 'Forklift Available' },
  { id: 'limited_assistance', label: 'Limited Assistance' },
  { id: 'no_assistance', label: 'No Assistance' },
];

export default function EditListingPage() {
  const params = useParams();
  const router = useRouter();
  const listingId = params.id as string;
  const { user } = useAuth();
  const supabase = createClient();

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('details');
  const [auctionDuration, setAuctionDuration] = useState('7');
  const [scheduleType, setScheduleType] = useState<'immediate' | 'scheduled'>('immediate');
  const [scheduledStartDate, setScheduledStartDate] = useState('');
  const [scheduledStartTime, setScheduledStartTime] = useState('09:00');
  const [scheduledEndDate, setScheduledEndDate] = useState('');
  const [scheduledEndTime, setScheduledEndTime] = useState('15:00');
  const [showScheduleOptions, setShowScheduleOptions] = useState(false);

  // Image management
  const [existingImages, setExistingImages] = useState<ListingImage[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [deletedImageIds, setDeletedImageIds] = useState<string[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    seller_terms: '',
    shipping_info: '',
    make: '',
    model: '',
    year: '',
    serial_number: '',
    condition: '',
    hours_count: '',
    equipment_status: '',
    onsite_assistance: 'no_assistance',
    weight_lbs: '',
    removal_deadline: '',
    pickup_notes: '',
    pickup_hours: '',
    starting_price: '',
    reserve_price: '',
    buy_now_price: '',
    accept_offers: false,
    auto_accept_price: '',
    auto_decline_price: '',
    payment_due_days: '7',
    accepts_credit_card: true,
    accepts_ach: true,
    accepts_wire: true,
    accepts_check: false,
    video_url: '',
    // Machine Specs - Software & System
    software_na: false,
    software_version: '',
    operating_system: '',
    controller_type: '',
    // Machine Specs - Configuration
    configuration_na: false,
    number_of_heads: '',
    max_speed: '',
    feeder_count: '',
    output_stacker_count: '',
    // Machine Specs - Material Specifications
    material_na: false,
    material_types: '',
    max_material_width: '',
    max_material_length: '',
    material_weight: '',
    // Machine Specs - Additional Technical
    power_requirements: '',
    network_connectivity: '',
    included_accessories: '',
    maintenance_history: '',
    last_service_date: '',
    // Dimensions
    length_inches: '',
    width_inches: '',
    height_inches: '',
    electrical_requirements: '',
    air_requirements_psi: '',
    // Deinstall
    deinstall_responsibility: 'buyer',
    deinstall_fee: '',
  });

  useEffect(() => {
    async function loadListing() {
      if (!listingId || !user?.id) return;

      const { data, error } = await supabase
        .from('listings')
        .select(`
          *,
          images:listing_images(id, url, is_primary, sort_order)
        `)
        .eq('id', listingId)
        .single();

      if (error || !data) {
        setError('Listing not found');
        setLoading(false);
        return;
      }

      // Check ownership
      if (data.seller_id !== user.id) {
        setError('You do not have permission to edit this listing');
        setLoading(false);
        return;
      }

      setListing(data);
      setExistingImages(data.images || []);

      // Populate form
      setFormData({
        title: data.title || '',
        description: data.description || '',
        seller_terms: data.seller_terms || '',
        shipping_info: data.shipping_info || '',
        make: data.make || '',
        model: data.model || '',
        year: data.year?.toString() || '',
        serial_number: data.serial_number || '',
        condition: data.condition || '',
        hours_count: data.hours_count?.toString() || '',
        equipment_status: data.equipment_status || '',
        onsite_assistance: data.onsite_assistance || 'no_assistance',
        weight_lbs: data.weight_lbs?.toString() || '',
        removal_deadline: data.removal_deadline?.split('T')[0] || '',
        pickup_notes: data.pickup_notes || '',
        pickup_hours: data.pickup_hours || '',
        starting_price: data.starting_price?.toString() || '',
        reserve_price: data.reserve_price?.toString() || '',
        buy_now_price: data.buy_now_price?.toString() || data.fixed_price?.toString() || '',
        accept_offers: data.accept_offers || false,
        auto_accept_price: data.auto_accept_price?.toString() || '',
        auto_decline_price: data.auto_decline_price?.toString() || '',
        payment_due_days: data.payment_due_days?.toString() || '7',
        accepts_credit_card: data.accepts_credit_card ?? true,
        accepts_ach: data.accepts_ach ?? true,
        accepts_wire: data.accepts_wire ?? true,
        accepts_check: data.accepts_check ?? false,
        video_url: data.video_url || '',
        // Machine Specs
        software_na: data.software_na || false,
        software_version: data.software_version || '',
        operating_system: data.operating_system || '',
        controller_type: data.controller_type || '',
        configuration_na: data.configuration_na || false,
        number_of_heads: data.number_of_heads?.toString() || '',
        max_speed: data.max_speed || '',
        feeder_count: data.feeder_count?.toString() || '',
        output_stacker_count: data.output_stacker_count?.toString() || '',
        material_na: data.material_na || false,
        material_types: data.material_types || '',
        max_material_width: data.max_material_width || '',
        max_material_length: data.max_material_length || '',
        material_weight: data.material_weight || '',
        power_requirements: data.power_requirements || '',
        network_connectivity: data.network_connectivity || '',
        included_accessories: data.included_accessories || '',
        maintenance_history: data.maintenance_history || '',
        last_service_date: data.last_service_date?.split('T')[0] || '',
        // Dimensions
        length_inches: data.length_inches?.toString() || '',
        width_inches: data.width_inches?.toString() || '',
        height_inches: data.height_inches?.toString() || '',
        electrical_requirements: data.electrical_requirements || '',
        air_requirements_psi: data.air_requirements_psi?.toString() || '',
        // Deinstall
        deinstall_responsibility: data.deinstall_responsibility || 'buyer',
        deinstall_fee: data.deinstall_fee?.toString() || '',
      });

      setLoading(false);
    }

    loadListing();
  }, [listingId, user?.id, supabase]);

  const updateFormData = (field: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileArray = Array.from(files);
      setNewImageFiles(prev => [...prev, ...fileArray]);

      // Create previews
      fileArray.forEach(file => {
        const reader = new FileReader();
        reader.onload = () => {
          setNewImagePreviews(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeExistingImage = (imageId: string) => {
    setDeletedImageIds(prev => [...prev, imageId]);
    setExistingImages(prev => prev.filter(img => img.id !== imageId));
  };

  const removeNewImage = (index: number) => {
    setNewImageFiles(prev => prev.filter((_, i) => i !== index));
    setNewImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!user?.id || !listing) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Update listing
      const { error: updateError } = await supabase
        .from('listings')
        .update({
          title: formData.title,
          description: formData.description,
          seller_terms: formData.seller_terms || null,
          shipping_info: formData.shipping_info || null,
          make: formData.make,
          model: formData.model,
          year: formData.year ? parseInt(formData.year) : null,
          serial_number: formData.serial_number,
          condition: formData.condition,
          hours_count: formData.hours_count ? parseInt(formData.hours_count) : null,
          equipment_status: formData.equipment_status || null,
          onsite_assistance: formData.onsite_assistance,
          weight_lbs: formData.weight_lbs ? parseInt(formData.weight_lbs) : null,
          removal_deadline: formData.removal_deadline || null,
          pickup_notes: formData.pickup_notes,
          pickup_hours: formData.pickup_hours || null,
          starting_price: formData.starting_price ? parseFloat(formData.starting_price) : null,
          reserve_price: formData.reserve_price ? parseFloat(formData.reserve_price) : null,
          buy_now_price: formData.buy_now_price ? parseFloat(formData.buy_now_price) : null,
          fixed_price: listing.listing_type.includes('fixed') && formData.buy_now_price
            ? parseFloat(formData.buy_now_price) : null,
          accept_offers: formData.accept_offers,
          auto_accept_price: formData.auto_accept_price ? parseFloat(formData.auto_accept_price) : null,
          auto_decline_price: formData.auto_decline_price ? parseFloat(formData.auto_decline_price) : null,
          payment_due_days: parseInt(formData.payment_due_days),
          accepts_credit_card: formData.accepts_credit_card,
          accepts_ach: formData.accepts_ach,
          accepts_wire: formData.accepts_wire,
          accepts_check: formData.accepts_check,
          video_url: formData.video_url || null,
          // Machine Specs
          software_na: formData.software_na,
          software_version: formData.software_version || null,
          operating_system: formData.operating_system || null,
          controller_type: formData.controller_type || null,
          configuration_na: formData.configuration_na,
          number_of_heads: formData.number_of_heads ? parseInt(formData.number_of_heads) : null,
          max_speed: formData.max_speed || null,
          feeder_count: formData.feeder_count ? parseInt(formData.feeder_count) : null,
          output_stacker_count: formData.output_stacker_count ? parseInt(formData.output_stacker_count) : null,
          material_na: formData.material_na,
          material_types: formData.material_types || null,
          max_material_width: formData.max_material_width || null,
          max_material_length: formData.max_material_length || null,
          material_weight: formData.material_weight || null,
          power_requirements: formData.power_requirements || null,
          network_connectivity: formData.network_connectivity || null,
          included_accessories: formData.included_accessories || null,
          maintenance_history: formData.maintenance_history || null,
          last_service_date: formData.last_service_date || null,
          // Dimensions
          length_inches: formData.length_inches ? parseInt(formData.length_inches) : null,
          width_inches: formData.width_inches ? parseInt(formData.width_inches) : null,
          height_inches: formData.height_inches ? parseInt(formData.height_inches) : null,
          electrical_requirements: formData.electrical_requirements || null,
          air_requirements_psi: formData.air_requirements_psi ? parseInt(formData.air_requirements_psi) : null,
          // Deinstall
          deinstall_responsibility: formData.deinstall_responsibility || 'buyer',
          deinstall_fee: formData.deinstall_fee ? parseFloat(formData.deinstall_fee) : null,
        })
        .eq('id', listingId);

      if (updateError) throw updateError;

      // Delete removed images
      if (deletedImageIds.length > 0) {
        await supabase
          .from('listing_images')
          .delete()
          .in('id', deletedImageIds);
      }

      // Upload new images
      if (newImageFiles.length > 0) {
        const currentMaxOrder = existingImages.length > 0
          ? Math.max(...existingImages.map(img => img.sort_order))
          : -1;

        for (let i = 0; i < newImageFiles.length; i++) {
          const file = newImageFiles[i];
          const fileExt = file.name.split('.').pop();
          const fileName = `${listingId}/${Date.now()}-${i}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('listing-images')
            .upload(fileName, file);

          if (uploadError) {
            console.error('Image upload error:', uploadError);
            continue;
          }

          const { data: urlData } = supabase.storage
            .from('listing-images')
            .getPublicUrl(fileName);

          await supabase.from('listing_images').insert({
            listing_id: listingId,
            url: urlData.publicUrl,
            sort_order: currentMaxOrder + 1 + i,
            is_primary: existingImages.length === 0 && i === 0,
          });
        }
      }

      setSuccess('Listing updated successfully!');
      setNewImageFiles([]);
      setNewImagePreviews([]);
      setDeletedImageIds([]);

      // Reload images
      const { data: updatedImages } = await supabase
        .from('listing_images')
        .select('*')
        .eq('listing_id', listingId)
        .order('sort_order');

      if (updatedImages) {
        setExistingImages(updatedImages);
      }

    } catch (err) {
      console.error('Error updating listing:', err);
      setError('Failed to update listing. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!user?.id || !listing) return;

    // Validate required fields
    if (!formData.title) {
      setError('Title is required to publish');
      return;
    }
    if (!formData.description) {
      setError('Description is required to publish');
      return;
    }
    if ((listing.listing_type === 'auction' || listing.listing_type === 'auction_buy_now') && !formData.starting_price) {
      setError('Starting price is required for auctions');
      return;
    }
    if ((listing.listing_type === 'fixed_price' || listing.listing_type === 'fixed_price_offers') && !formData.buy_now_price) {
      setError('Price is required for fixed price listings');
      return;
    }

    setPublishing(true);
    setError(null);

    try {
      // First save any pending changes
      await handleSave();

      // Determine start and end times based on schedule type
      let startTime: Date;
      let endTime: Date;
      let listingStatus: 'active' | 'scheduled';

      if (scheduleType === 'scheduled' && scheduledStartDate && scheduledEndDate) {
        // Scheduled listing - combine date and time
        startTime = new Date(`${scheduledStartDate}T${scheduledStartTime}:00`);
        endTime = new Date(`${scheduledEndDate}T${scheduledEndTime}:00`);

        // Validate dates
        const now = new Date();
        if (startTime <= now) {
          setError('Scheduled start time must be in the future');
          setPublishing(false);
          return;
        }
        if (endTime <= startTime) {
          setError('End time must be after start time');
          setPublishing(false);
          return;
        }

        listingStatus = 'scheduled';
      } else {
        // Immediate - go live now with duration-based end time
        startTime = new Date();
        endTime = new Date();
        endTime.setDate(endTime.getDate() + parseInt(auctionDuration));
        listingStatus = 'active';
      }

      // Update listing with times and status
      const { error: publishError } = await supabase
        .from('listings')
        .update({
          status: listingStatus,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          original_end_time: endTime.toISOString(),
        })
        .eq('id', listingId);

      if (publishError) throw publishError;

      const successMessage = listingStatus === 'scheduled'
        ? `Listing scheduled! Goes live ${startTime.toLocaleString()}`
        : 'Listing published successfully!';
      setSuccess(successMessage);

      // Update local state
      setListing(prev => prev ? { ...prev, status: listingStatus } : null);

      // Redirect to listing page after short delay
      setTimeout(() => {
        router.push(`/listing/${listingId}`);
      }, 1500);

    } catch (err) {
      console.error('Error publishing listing:', err);
      setError('Failed to publish listing. Please try again.');
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error && !listing) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-red-900 mb-2">{error}</h2>
          <Link
            href="/dashboard/listings"
            className="text-blue-600 hover:underline"
          >
            Back to My Listings
          </Link>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'details', label: 'Details', icon: Package },
    { id: 'photos', label: 'Photos', icon: Camera },
    { id: 'specs', label: 'Machine Specs', icon: Cpu },
    { id: 'terms', label: 'Terms & Shipping', icon: FileText },
    { id: 'pricing', label: 'Pricing', icon: DollarSign },
    { id: 'logistics', label: 'Logistics', icon: Truck },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard/listings"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to My Listings
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Listing</h1>
            <p className="text-gray-600 mt-1">{listing?.title}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/listing/${listingId}`}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              View Listing
            </Link>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Changes
            </button>
          </div>
        </div>
      </div>

      {/* Status messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
          {success}
        </div>
      )}

      {/* Listing Status Banner */}
      {listing?.status !== 'active' && (
        <div className={`mb-6 p-4 rounded-lg ${
          listing?.status === 'sold' ? 'bg-green-50 border border-green-200' :
          listing?.status === 'ended' ? 'bg-gray-50 border border-gray-200' :
          listing?.status === 'draft' ? 'bg-blue-50 border border-blue-200' :
          'bg-yellow-50 border border-yellow-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">
                Status: <span className="capitalize">{listing?.status}</span>
              </p>
              {listing?.status === 'sold' && (
                <p className="text-sm mt-1">This listing has been sold. Some fields cannot be edited.</p>
              )}
              {listing?.status === 'draft' && (
                <p className="text-sm text-blue-700 mt-1">This is a draft listing. Complete the details and publish when ready.</p>
              )}
            </div>
            {listing?.status === 'draft' && (
              <div className="flex flex-col gap-3">
                {/* Scheduling Options Toggle */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowScheduleOptions(!showScheduleOptions)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <Calendar className="h-4 w-4 text-gray-500" />
                    {scheduleType === 'immediate' ? 'Go Live Now' : 'Scheduled'}
                    <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${showScheduleOptions ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Duration selector - only show for immediate */}
                  {scheduleType === 'immediate' && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <select
                        value={auctionDuration}
                        onChange={(e) => setAuctionDuration(e.target.value)}
                        className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="3">3 Days</option>
                        <option value="5">5 Days</option>
                        <option value="7">7 Days</option>
                        <option value="10">10 Days</option>
                        <option value="14">14 Days</option>
                      </select>
                    </div>
                  )}

                  <button
                    onClick={handlePublish}
                    disabled={publishing || (scheduleType === 'scheduled' && (!scheduledStartDate || !scheduledEndDate))}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
                  >
                    {publishing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : scheduleType === 'scheduled' ? (
                      <Calendar className="h-4 w-4" />
                    ) : (
                      <Rocket className="h-4 w-4" />
                    )}
                    {scheduleType === 'scheduled' ? 'Schedule Listing' : 'Publish Now'}
                  </button>
                </div>

                {/* Expanded Scheduling Options */}
                {showScheduleOptions && (
                  <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-lg">
                    <div className="flex gap-4 mb-4">
                      <label className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer flex-1 ${scheduleType === 'immediate' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                        <input
                          type="radio"
                          name="scheduleType"
                          checked={scheduleType === 'immediate'}
                          onChange={() => setScheduleType('immediate')}
                        />
                        <Zap className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm font-medium">Go Live Immediately</span>
                      </label>
                      <label className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer flex-1 ${scheduleType === 'scheduled' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                        <input
                          type="radio"
                          name="scheduleType"
                          checked={scheduleType === 'scheduled'}
                          onChange={() => setScheduleType('scheduled')}
                        />
                        <Calendar className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium">Schedule for Later</span>
                      </label>
                    </div>

                    {scheduleType === 'scheduled' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Goes Live - Date</label>
                            <input
                              type="date"
                              value={scheduledStartDate}
                              onChange={(e) => setScheduledStartDate(e.target.value)}
                              min={new Date().toISOString().split('T')[0]}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Time</label>
                            <input
                              type="time"
                              value={scheduledStartTime}
                              onChange={(e) => setScheduledStartTime(e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Ends - Date</label>
                            <input
                              type="date"
                              value={scheduledEndDate}
                              onChange={(e) => setScheduledEndDate(e.target.value)}
                              min={scheduledStartDate || new Date().toISOString().split('T')[0]}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Time</label>
                            <input
                              type="time"
                              value={scheduledEndTime}
                              onChange={(e) => setScheduledEndTime(e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          All times in your local timezone ({Intl.DateTimeFormat().resolvedOptions().timeZone})
                        </p>
                        <div className="bg-blue-50 rounded-lg p-2">
                          <p className="text-xs text-blue-700">
                            <strong>Tip:</strong> Auctions ending on weekday afternoons (2-4 PM) often get the most activity.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-3 border-b-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {/* Details Tab */}
        {activeTab === 'details' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => updateFormData('title', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Make / Manufacturer
                </label>
                <input
                  type="text"
                  value={formData.make}
                  onChange={(e) => updateFormData('make', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Model
                </label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => updateFormData('model', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Year
                </label>
                <input
                  type="number"
                  value={formData.year}
                  onChange={(e) => updateFormData('year', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Serial Number
                </label>
                <input
                  type="text"
                  value={formData.serial_number}
                  onChange={(e) => updateFormData('serial_number', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Condition
                </label>
                <select
                  value={formData.condition}
                  onChange={(e) => updateFormData('condition', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select condition</option>
                  {conditionOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hours / Impressions
                </label>
                <input
                  type="number"
                  value={formData.hours_count}
                  onChange={(e) => updateFormData('hours_count', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => updateFormData('description', e.target.value)}
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        )}

        {/* Photos Tab */}
        {activeTab === 'photos' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Current Photos</h3>
              {existingImages.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {existingImages.map((img, index) => (
                    <div key={img.id} className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={img.url}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => removeExistingImage(img.id)}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      {img.is_primary && (
                        <span className="absolute bottom-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                          Primary
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No photos uploaded</p>
              )}
            </div>

            {/* New photos */}
            {newImagePreviews.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">New Photos (not saved yet)</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {newImagePreviews.map((preview, index) => (
                    <div key={index} className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={preview}
                        alt={`New photo ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => removeNewImage(index)}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <span className="absolute bottom-2 left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded">
                        New
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload button */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">Add more photos</p>
              <label className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 cursor-pointer">
                <Upload className="h-5 w-5" />
                Upload Photos
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </label>
            </div>

            {/* Video URL */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <Video className="h-5 w-5" />
                Video
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  YouTube or Vimeo URL
                </label>
                <input
                  type="url"
                  value={formData.video_url}
                  onChange={(e) => updateFormData('video_url', e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Add a YouTube or Vimeo video URL to show on the listing page
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Machine Specs Tab */}
        {activeTab === 'specs' && (
          <div className="space-y-8">
            {/* Software & System Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Software & System
                </h3>
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={formData.software_na}
                    onChange={(e) => updateFormData('software_na', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600"
                  />
                  N/A for this equipment
                </label>
              </div>
              {!formData.software_na && (
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Software Version</label>
                    <input
                      type="text"
                      value={formData.software_version}
                      onChange={(e) => updateFormData('software_version', e.target.value)}
                      placeholder="e.g., 4.2.1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Operating System</label>
                    <input
                      type="text"
                      value={formData.operating_system}
                      onChange={(e) => updateFormData('operating_system', e.target.value)}
                      placeholder="e.g., Windows 10"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Controller Type</label>
                    <input
                      type="text"
                      value={formData.controller_type}
                      onChange={(e) => updateFormData('controller_type', e.target.value)}
                      placeholder="e.g., PLC, PC-based"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Configuration Section */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                  <Cpu className="h-5 w-5" />
                  Configuration
                </h3>
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={formData.configuration_na}
                    onChange={(e) => updateFormData('configuration_na', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600"
                  />
                  N/A for this equipment
                </label>
              </div>
              {!formData.configuration_na && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Number of Heads</label>
                    <input
                      type="number"
                      value={formData.number_of_heads}
                      onChange={(e) => updateFormData('number_of_heads', e.target.value)}
                      placeholder="e.g., 4"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Speed</label>
                    <input
                      type="text"
                      value={formData.max_speed}
                      onChange={(e) => updateFormData('max_speed', e.target.value)}
                      placeholder="e.g., 10,000 pieces/hour"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Feeder Count</label>
                    <input
                      type="number"
                      value={formData.feeder_count}
                      onChange={(e) => updateFormData('feeder_count', e.target.value)}
                      placeholder="e.g., 6"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Cycle Count</label>
                    <input
                      type="number"
                      value={formData.output_stacker_count}
                      onChange={(e) => updateFormData('output_stacker_count', e.target.value)}
                      placeholder="e.g., 500000"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Material Specifications Section */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Material Specifications
                </h3>
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={formData.material_na}
                    onChange={(e) => updateFormData('material_na', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600"
                  />
                  N/A for this equipment
                </label>
              </div>
              {!formData.material_na && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Material Specifications</label>
                    <textarea
                      value={formData.material_types}
                      onChange={(e) => updateFormData('material_types', e.target.value)}
                      placeholder="e.g., Handles paper up to 12&quot; x 17&quot;, cardstock up to 110 lb cover, envelopes #10 through 6x9, labels, polymailers..."
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Additional Technical Section */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <Info className="h-5 w-5" />
                Additional Technical Details
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Power Requirements</label>
                    <input
                      type="text"
                      value={formData.power_requirements}
                      onChange={(e) => updateFormData('power_requirements', e.target.value)}
                      placeholder="e.g., 208V/30A/3Ph"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Network Connectivity</label>
                    <input
                      type="text"
                      value={formData.network_connectivity}
                      onChange={(e) => updateFormData('network_connectivity', e.target.value)}
                      placeholder="e.g., Ethernet, Wi-Fi, Serial"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Included Accessories</label>
                  <textarea
                    value={formData.included_accessories}
                    onChange={(e) => updateFormData('included_accessories', e.target.value)}
                    rows={3}
                    placeholder="List any included accessories, manuals, spare parts, etc."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Maintenance History</label>
                  <textarea
                    value={formData.maintenance_history}
                    onChange={(e) => updateFormData('maintenance_history', e.target.value)}
                    rows={3}
                    placeholder="Describe maintenance history, recent repairs, known issues..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="w-1/2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Service Date</label>
                  <input
                    type="date"
                    value={formData.last_service_date}
                    onChange={(e) => updateFormData('last_service_date', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Terms & Shipping Tab */}
        {activeTab === 'terms' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Seller Terms
              </label>
              <textarea
                value={formData.seller_terms}
                onChange={(e) => updateFormData('seller_terms', e.target.value)}
                rows={8}
                placeholder="Enter terms and conditions for this listing..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave blank to use your default seller terms from profile settings
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Shipping Information
              </label>
              <textarea
                value={formData.shipping_info}
                onChange={(e) => updateFormData('shipping_info', e.target.value)}
                rows={6}
                placeholder="Describe shipping options, pickup details, etc..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        )}

        {/* Pricing Tab */}
        {activeTab === 'pricing' && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-700">
                <strong>Listing Type:</strong> {listing?.listing_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Listing type cannot be changed after creation.
              </p>
            </div>

            {(listing?.listing_type === 'auction' || listing?.listing_type === 'auction_buy_now') && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Starting Price
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={formData.starting_price}
                      onChange={(e) => updateFormData('starting_price', e.target.value)}
                      className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reserve Price
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={formData.reserve_price}
                      onChange={(e) => updateFormData('reserve_price', e.target.value)}
                      className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            )}

            {(listing?.listing_type === 'auction_buy_now' || listing?.listing_type === 'fixed_price' || listing?.listing_type === 'fixed_price_offers') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {listing?.listing_type.includes('fixed') ? 'Price' : 'Buy Now Price'}
                </label>
                <div className="relative w-1/2">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={formData.buy_now_price}
                    onChange={(e) => updateFormData('buy_now_price', e.target.value)}
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}

            {/* Offers */}
            <div className="border-t pt-6">
              <label className="flex items-center gap-3 cursor-pointer mb-4">
                <input
                  type="checkbox"
                  checked={formData.accept_offers}
                  onChange={(e) => updateFormData('accept_offers', e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <p className="font-medium text-gray-900">Accept Offers</p>
                  <p className="text-sm text-gray-500">Allow buyers to make offers</p>
                </div>
              </label>

              {formData.accept_offers && (
                <div className="grid grid-cols-2 gap-4 pl-8">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Auto-Accept Price
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        value={formData.auto_accept_price}
                        onChange={(e) => updateFormData('auto_accept_price', e.target.value)}
                        placeholder="Optional"
                        className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Auto-accept offers at or above</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Auto-Decline Price
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        value={formData.auto_decline_price}
                        onChange={(e) => updateFormData('auto_decline_price', e.target.value)}
                        placeholder="Optional"
                        className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Auto-decline offers below</p>
                  </div>
                </div>
              )}
            </div>

            {/* Payment Methods */}
            <div className="border-t pt-6">
              <h3 className="font-medium text-gray-900 mb-4">Accepted Payment Methods</h3>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.accepts_credit_card}
                    onChange={(e) => updateFormData('accepts_credit_card', e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Credit Card</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.accepts_ach}
                    onChange={(e) => updateFormData('accepts_ach', e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>ACH</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.accepts_wire}
                    onChange={(e) => updateFormData('accepts_wire', e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Wire Transfer</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.accepts_check}
                    onChange={(e) => updateFormData('accepts_check', e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Check</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Due (Days)
              </label>
              <select
                value={formData.payment_due_days}
                onChange={(e) => updateFormData('payment_due_days', e.target.value)}
                className="w-48 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="3">3 Days</option>
                <option value="5">5 Days</option>
                <option value="7">7 Days</option>
                <option value="10">10 Days</option>
                <option value="14">14 Days</option>
              </select>
            </div>
          </div>
        )}

        {/* Logistics Tab */}
        {activeTab === 'logistics' && (
          <div className="space-y-6">
            {/* Info Box */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Truck className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Logistics & Pickup Information</p>
                  <p className="text-xs text-amber-700 mt-1">
                    Help buyers understand equipment availability and pickup requirements.
                  </p>
                </div>
              </div>
            </div>

            {/* Equipment Status Section */}
            <div>
              <h3 className="font-medium text-gray-900 mb-4">Equipment Status</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Status
                  </label>
                  <select
                    value={formData.equipment_status}
                    onChange={(e) => updateFormData('equipment_status', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select status</option>
                    {equipmentStatuses.map(status => (
                      <option key={status.id} value={status.id}>{status.label}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Current state of the equipment</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    On-site Assistance
                  </label>
                  <select
                    value={formData.onsite_assistance}
                    onChange={(e) => updateFormData('onsite_assistance', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {onsiteAssistanceOptions.map(opt => (
                      <option key={opt.id} value={opt.id}>{opt.label}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Help available during pickup</p>
                </div>
              </div>
            </div>

            {/* De-installation Section */}
            <div className="border-t pt-6">
              <h3 className="font-medium text-gray-900 mb-4">De-installation</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    De-installation Responsibility
                  </label>
                  <select
                    value={formData.deinstall_responsibility}
                    onChange={(e) => updateFormData('deinstall_responsibility', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="buyer">Buyer Responsible</option>
                    <option value="seller">Seller Will De-install</option>
                    <option value="seller_for_fee">Seller For Additional Fee</option>
                  </select>
                </div>
                {formData.deinstall_responsibility === 'seller_for_fee' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      De-installation Fee
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        value={formData.deinstall_fee}
                        onChange={(e) => updateFormData('deinstall_fee', e.target.value)}
                        placeholder="0"
                        className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Physical Details Section */}
            <div className="border-t pt-6">
              <h3 className="font-medium text-gray-900 mb-4">Physical Details</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Weight (lbs)
                  </label>
                  <input
                    type="number"
                    value={formData.weight_lbs}
                    onChange={(e) => updateFormData('weight_lbs', e.target.value)}
                    placeholder="e.g., 5000"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Approximate equipment weight</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Removal Deadline
                  </label>
                  <input
                    type="date"
                    value={formData.removal_deadline}
                    onChange={(e) => updateFormData('removal_deadline', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Latest date for pickup</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Length (inches)</label>
                  <input
                    type="number"
                    value={formData.length_inches}
                    onChange={(e) => updateFormData('length_inches', e.target.value)}
                    placeholder="e.g., 120"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Width (inches)</label>
                  <input
                    type="number"
                    value={formData.width_inches}
                    onChange={(e) => updateFormData('width_inches', e.target.value)}
                    placeholder="e.g., 60"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Height (inches)</label>
                  <input
                    type="number"
                    value={formData.height_inches}
                    onChange={(e) => updateFormData('height_inches', e.target.value)}
                    placeholder="e.g., 72"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Electrical Requirements</label>
                  <input
                    type="text"
                    value={formData.electrical_requirements}
                    onChange={(e) => updateFormData('electrical_requirements', e.target.value)}
                    placeholder="e.g., 208V/30A/3Ph"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Air Requirements (PSI)</label>
                  <input
                    type="number"
                    value={formData.air_requirements_psi}
                    onChange={(e) => updateFormData('air_requirements_psi', e.target.value)}
                    placeholder="e.g., 100"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Pickup Instructions Section */}
            <div className="border-t pt-6">
              <h3 className="font-medium text-gray-900 mb-4">Pickup Instructions</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pickup Hours
                  </label>
                  <input
                    type="text"
                    value={formData.pickup_hours}
                    onChange={(e) => updateFormData('pickup_hours', e.target.value)}
                    placeholder="e.g., Mon-Fri 8am-5pm"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pickup Notes
                  </label>
                  <textarea
                    value={formData.pickup_notes}
                    onChange={(e) => updateFormData('pickup_notes', e.target.value)}
                    rows={4}
                    placeholder="Dock access, loading requirements, contact person, special equipment needed..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Include dock access, loading requirements, and any special instructions
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Save Button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Changes
        </button>
      </div>
    </div>
  );
}
