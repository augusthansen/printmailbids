'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Upload,
  X,
  Camera,
  Video,
  Info,
  DollarSign,
  Clock,
  Package,
  Truck,
  CreditCard,
  CheckCircle,
  Loader2,
  GripVertical,
  Pencil
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';

type Step = 1 | 2 | 3 | 4 | 5;

// Helper function to convert image to JPEG using Canvas (works for most formats including some HEIC on iOS)
async function convertToJpeg(file: File): Promise<File> {
  // If already JPEG or PNG, return as-is
  if (file.type === 'image/jpeg' || file.type === 'image/png') {
    return file;
  }

  const isHeic = file.type === 'image/heic' ||
                 file.type === 'image/heif' ||
                 file.name.toLowerCase().endsWith('.heic') ||
                 file.name.toLowerCase().endsWith('.heif');

  // Try heic2any for HEIC files
  if (isHeic) {
    try {
      const heic2any = (await import('heic2any')).default;
      const convertedBlob = await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.9,
      });
      const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
      const newFileName = file.name.replace(/\.heic$/i, '.jpg').replace(/\.heif$/i, '.jpg');
      return new File([blob], newFileName, { type: 'image/jpeg' });
    } catch (error) {
      console.warn('heic2any conversion failed, trying canvas fallback:', error);
    }
  }

  // Canvas fallback - works if browser can decode the image
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0);

      canvas.toBlob((blob) => {
        URL.revokeObjectURL(url);
        if (blob) {
          const newFileName = file.name.replace(/\.[^.]+$/, '.jpg');
          resolve(new File([blob], newFileName, { type: 'image/jpeg' }));
        } else {
          resolve(file); // Return original if conversion fails
        }
      }, 'image/jpeg', 0.9);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      console.warn('Could not convert image, using original');
      resolve(file);
    };

    img.src = url;
  });
}

const steps = [
  { number: 1, title: 'Photos & Videos' },
  { number: 2, title: 'Equipment Details' },
  { number: 3, title: 'Condition & Logistics' },
  { number: 4, title: 'Pricing & Auction' },
  { number: 5, title: 'Review & Publish' },
];

// Fallback categories if database is empty
const defaultCategories = [
  { id: 'mailing', name: 'Mailing & Fulfillment', slug: 'mailing-fulfillment' },
  { id: 'printing', name: 'Printing', slug: 'printing' },
  { id: 'bindery', name: 'Bindery & Finishing', slug: 'bindery-finishing' },
  { id: 'packaging', name: 'Packaging', slug: 'packaging' },
  { id: 'material', name: 'Material Handling', slug: 'material-handling' },
  { id: 'parts', name: 'Parts & Supplies', slug: 'parts-supplies' },
];

// Manufacturers by category
const manufacturersByCategory: Record<string, string[]> = {
  'mailing-fulfillment': [
    'Bell and Howell', 'Pitney Bowes', 'Neopost/Quadient', 'Hasler', 'Francotyp-Postalia (FP)',
    'Böwe Systec', 'Kern', 'CMC', 'Buskro', 'Kirk-Rudy', 'Formax', 'MCS', 'Streamfeeder',
    'Secap', 'Rena', 'Astro Machine', 'Accufast', 'JBM', 'Tritek', 'Inserco',
    'Hefter Systemform', 'Winkler+Dünnebier', 'Envelope 1', 'Window Book',
    'BlueCrest (formerly Pitney Bowes DMT)', 'Gunther', 'National Presort', 'Prolific'
  ],
  'printing': [
    // Offset
    'Heidelberg', 'Komori', 'Manroland', 'KBA (Koenig & Bauer)', 'Mitsubishi',
    'Ryobi', 'Sakurai', 'Shinohara', 'RMGT', 'Presstek', 'Akiyama',
    // Digital
    'HP Indigo', 'Xerox', 'Canon', 'Ricoh', 'Konica Minolta', 'Screen', 'EFI',
    'Kodak', 'Fujifilm', 'Epson', 'Roland DG', 'Mimaki', 'Durst', 'swissQprint',
    // Wide Format
    'HP', 'Agfa', 'Mutoh', 'Oce', 'Vutek', 'Scitex', 'NUR', 'Inca', 'Jetrix',
    // Flexo/Label
    'Mark Andy', 'Nilpeter', 'Gallus', 'MPS', 'Edale', 'Bobst', 'Omet', 'Aquaflex',
    // Screen
    'M&R', 'Anatol', 'Workhorse', 'ROQ', 'MHM', 'SPS', 'Thieme',
    // Prepress
    'Agfa', 'Screen', 'Kodak', 'Fujifilm', 'Esko', 'Presstek', 'basysPrint'
  ],
  'bindery-finishing': [
    // Folders
    'MBO', 'Stahl', 'Heidelberg', 'Horizon', 'Baum', 'Herzog+Heymann', 'GUK', 'Shoei',
    // Cutters/Trimmers
    'Polar', 'Challenge', 'Wohlenberg', 'Schneider Senator', 'Prism', 'Duplo', 'Ideal',
    'Triumph', 'MBM', 'Martin Yale', 'Dahle', 'Standard Horizon', 'Morgana', 'Kolbus',
    // Binding
    'Muller Martini', 'Kolbus', 'CP Bourg', 'Horizon', 'Duplo', 'Standard Horizon',
    'Fastbind', 'Renz', 'GBC', 'Spiral', 'Unibind', 'Coverbind', 'Powis Parker',
    // Laminating/Coating
    'GMP', 'D&K', 'Seal', 'USI', 'Ledco', 'Tamerica', 'Drytac', 'Neschen',
    'GBC/ACCO', 'Vivid', 'Autobond', 'Komfi', 'Steinemann', 'Scodix',
    // Die Cutting/Embossing
    'Bobst', 'Heidelberg', 'Kluge', 'Brausse', 'Sanwa', 'Young Shin', 'KAMA',
    // Saddle Stitching
    'Muller Martini', 'Heidelberg', 'Horizon', 'Duplo', 'Hohner', 'Nagel',
    // Perfect Binding
    'Muller Martini', 'Horizon', 'CP Bourg', 'Kolbus', 'Wohlenberg', 'Sulby',
    // Collating
    'Duplo', 'Horizon', 'Watkiss', 'CP Bourg', 'MBO', 'Theisen & Bonitz'
  ],
  'packaging': [
    // Folding Carton
    'Bobst', 'Heidelberg', 'KBA', 'Koenig & Bauer', 'Brausse', 'KAMA', 'Masterwork',
    'Sanwa', 'Young Shin', 'SBL', 'Yawa', 'Eterna',
    // Corrugated
    'Bobst', 'Fosber', 'BHS', 'Mitsubishi', 'Isowa', 'Latitude', 'SUN Automation',
    'Marquip', 'Agnati', 'Dong Fang', 'TCY', 'EMBA',
    // Flexible Packaging
    'Windmoeller & Hoelscher', 'Comexi', 'Uteco', 'Nordmeccanica', 'DCM', 'Bobst',
    'PCMC', 'Soma', 'CI Flexo', 'Bielloni', 'Giave', 'Carint',
    // Labeling
    'Krones', 'Sidel', 'P.E. Labellers', 'Sacmi', 'Kosme', 'Herma', 'Accraply',
    // Case Packing
    'Wexxar', 'Combi', 'Pearson', 'Loveshaw', '3M-Matic', 'BestPack', 'Lantech',
    // Shrink Wrap
    'Shanklin', 'Texwrap', 'Eastey', 'Conflex', 'PDC', 'Polypack', 'ULMA'
  ],
  'material-handling': [
    // Forklifts
    'Toyota', 'Crown', 'Hyster', 'Yale', 'Raymond', 'Jungheinrich', 'Linde',
    'Caterpillar', 'Komatsu', 'Mitsubishi', 'Nissan', 'TCM', 'Doosan', 'Clark',
    // Pallet Jacks
    'Crown', 'Raymond', 'Toyota', 'Hyster', 'Yale', 'Jungheinrich', 'Big Joe',
    // Conveyors
    'Hytrol', 'Dorner', 'Interroll', 'FlexLink', 'Bosch Rexroth', 'Dematic',
    'Intelligrated', 'TGW', 'Beumer', 'Vanderlande', 'Siemens', 'Honeywell',
    // Lift Tables
    'Southworth', 'Presto', 'Bishamon', 'Marco', 'Autoquip', 'Vestil',
    // Cranes/Hoists
    'Konecranes', 'Demag', 'CM', 'Yale', 'Harrington', 'Coffing', 'Budgit',
    // Racking
    'Interlake Mecalux', 'Steel King', 'Unarco', 'Ridg-U-Rak', 'Frazier', 'Husky'
  ],
  'parts-supplies': [
    'OEM Parts', 'Aftermarket', 'Rebuilt/Refurbished', 'Generic/Compatible',
    'Heidelberg', 'Komori', 'Manroland', 'Muller Martini', 'Polar', 'MBO',
    'Pitney Bowes', 'Bell and Howell', 'Bobst', 'HP', 'Xerox', 'Canon', 'Ricoh'
  ]
};

// Get all unique manufacturers for "Other" or when no category selected
const allManufacturers = [...new Set(Object.values(manufacturersByCategory).flat())].sort();

const equipmentStatuses = [
  { id: 'in_production', label: 'In Production', description: 'Currently being used' },
  { id: 'installed_idle', label: 'Installed but Idle', description: 'In place but not being used' },
  { id: 'needs_deinstall', label: 'Needs De-installation', description: 'Requires professional removal' },
  { id: 'deinstalled', label: 'De-installed', description: 'Already removed, ready to move' },
  { id: 'broken_down', label: 'Broken Down', description: 'Disassembled for transport' },
  { id: 'palletized', label: 'Palletized', description: 'On pallets, ready to ship' },
  { id: 'crated', label: 'Crated', description: 'Professionally crated for shipping' },
];

const onsiteAssistanceOptions = [
  { id: 'full_assistance', label: 'Full Assistance', description: 'We will help load with our equipment' },
  { id: 'forklift_available', label: 'Forklift Available', description: 'Forklift on-site for loading' },
  { id: 'limited_assistance', label: 'Limited Assistance', description: 'Some help available' },
  { id: 'no_assistance', label: 'No Assistance', description: 'Buyer must arrange all loading' },
];

const listingTypes = [
  { id: 'auction', label: 'Auction', description: 'Let buyers bid - 2-minute soft close' },
  { id: 'auction_buy_now', label: 'Auction + Buy Now', description: 'Auction with instant purchase option' },
  { id: 'fixed_price', label: 'Fixed Price', description: 'Set price, first buyer wins' },
  { id: 'fixed_price_offers', label: 'Fixed Price + Offers', description: 'Set price, accept offers' },
];

const auctionDurations = [
  { id: '3', label: '3 Days' },
  { id: '5', label: '5 Days' },
  { id: '7', label: '7 Days' },
  { id: '10', label: '10 Days' },
  { id: '14', label: '14 Days' },
];

export default function CreateListingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategoriesData] = useState<{id: string, name: string, slug: string}[]>([]);

  // Load categories from database with fallback
  useEffect(() => {
    async function loadCategories() {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug')
        .eq('is_active', true)
        .order('sort_order');
      if (data && data.length > 0 && !error) {
        setCategoriesData(data);
      } else {
        // Use fallback categories if database is empty or errors
        setCategoriesData(defaultCategories);
      }
    }
    loadCategories();
  }, [supabase]);

  // Form state
  const [formData, setFormData] = useState({
    // Step 1: Media
    images: [] as File[],
    videos: [] as string[],

    // Step 2: Details
    title: '',
    category: '',
    description: '',
    make: '',
    model: '',
    year: '',
    serialNumber: '',

    // Step 3: Condition & Logistics
    condition: '',
    hoursCount: '',
    equipmentStatus: '',
    deinstallResponsibility: 'buyer',
    deinstallFee: '',
    onsiteAssistance: 'no_assistance',
    weight: '',
    dimensions: { length: '', width: '', height: '' },
    electricalRequirements: '',
    airRequirements: '',
    location: '',
    removalDeadline: '',
    pickupHours: '',
    pickupNotes: '',

    // Step 4: Pricing
    listingType: 'auction',
    startingPrice: '',
    reservePrice: '',
    buyNowPrice: '',
    auctionDuration: '7',
    acceptOffers: false,
    autoAcceptPrice: '',
    autoDeclinePrice: '',
    paymentDueDays: '7',
    acceptsCreditCard: true,
    acceptsAch: true,
    acceptsWire: true,
    acceptsCheck: false,
  });

  const updateFormData = (field: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const [processingImages, setProcessingImages] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileArray = Array.from(files);
      setProcessingImages(true);

      // Convert all images to JPEG for browser compatibility
      for (const file of fileArray) {
        try {
          const processedFile = await convertToJpeg(file);
          setImageFiles(prev => [...prev, processedFile]);

          // Convert to data URL for preview
          const reader = new FileReader();
          reader.onload = () => {
            setUploadedImages(prev => [...prev, reader.result as string]);
          };
          reader.readAsDataURL(processedFile);
        } catch (error) {
          console.error('Error processing image:', error);
        }
      }

      setProcessingImages(false);
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      // Reorder images
      const newImages = [...uploadedImages];
      const newFiles = [...imageFiles];

      const [draggedImage] = newImages.splice(draggedIndex, 1);
      const [draggedFile] = newFiles.splice(draggedIndex, 1);

      newImages.splice(dragOverIndex, 0, draggedImage);
      newFiles.splice(dragOverIndex, 0, draggedFile);

      setUploadedImages(newImages);
      setImageFiles(newFiles);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= uploadedImages.length) return;

    const newImages = [...uploadedImages];
    const newFiles = [...imageFiles];

    const [movedImage] = newImages.splice(fromIndex, 1);
    const [movedFile] = newFiles.splice(fromIndex, 1);

    newImages.splice(toIndex, 0, movedImage);
    newFiles.splice(toIndex, 0, movedFile);

    setUploadedImages(newImages);
    setImageFiles(newFiles);
  };

  const nextStep = () => {
    if (currentStep < 5) {
      setCurrentStep((currentStep + 1) as Step);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step);
    }
  };

  const handleSubmit = async () => {
    if (!user?.id) {
      setError('You must be logged in to create a listing');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Calculate end time based on auction duration
      const startTime = new Date();
      const endTime = new Date();
      endTime.setDate(endTime.getDate() + parseInt(formData.auctionDuration));

      // Find category ID from slug
      const selectedCategory = categories.find(c => c.slug === formData.category || c.id === formData.category);

      // Check if the category ID is a valid UUID (fallback categories have non-UUID IDs)
      const isValidUUID = selectedCategory?.id &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(selectedCategory.id);
      const categoryId = isValidUUID ? selectedCategory.id : null;

      // Create the listing
      const { data: listing, error: listingError } = await supabase
        .from('listings')
        .insert({
          seller_id: user.id,
          title: formData.title,
          description: formData.description,
          primary_category_id: categoryId,
          listing_type: formData.listingType,
          status: 'active',
          starting_price: formData.startingPrice ? parseFloat(formData.startingPrice) : null,
          reserve_price: formData.reservePrice ? parseFloat(formData.reservePrice) : null,
          buy_now_price: formData.buyNowPrice ? parseFloat(formData.buyNowPrice) : null,
          fixed_price: formData.listingType.includes('fixed') ? parseFloat(formData.buyNowPrice) : null,
          accept_offers: formData.acceptOffers,
          auto_accept_price: formData.autoAcceptPrice ? parseFloat(formData.autoAcceptPrice) : null,
          auto_decline_price: formData.autoDeclinePrice ? parseFloat(formData.autoDeclinePrice) : null,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          original_end_time: endTime.toISOString(),
          make: formData.make,
          model: formData.model,
          year: formData.year ? parseInt(formData.year) : null,
          serial_number: formData.serialNumber,
          condition: formData.condition,
          hours_count: formData.hoursCount ? parseInt(formData.hoursCount) : null,
          equipment_status: formData.equipmentStatus || null,
          onsite_assistance: formData.onsiteAssistance,
          weight_lbs: formData.weight ? parseInt(formData.weight) : null,
          removal_deadline: formData.removalDeadline || null,
          pickup_notes: formData.pickupNotes,
          payment_due_days: parseInt(formData.paymentDueDays),
          accepts_credit_card: formData.acceptsCreditCard,
          accepts_ach: formData.acceptsAch,
          accepts_wire: formData.acceptsWire,
          accepts_check: formData.acceptsCheck,
        })
        .select()
        .single();

      if (listingError) {
        throw listingError;
      }

      // Upload images if any
      if (imageFiles.length > 0 && listing) {
        for (let i = 0; i < imageFiles.length; i++) {
          const file = imageFiles[i];
          const fileExt = file.name.split('.').pop();
          const fileName = `${listing.id}/${Date.now()}-${i}.${fileExt}`;

          // Upload to Supabase Storage
          const { error: uploadError } = await supabase.storage
            .from('listing-images')
            .upload(fileName, file);

          if (uploadError) {
            console.error('Image upload error:', uploadError);
            continue;
          }

          // Get public URL
          const { data: urlData } = supabase.storage
            .from('listing-images')
            .getPublicUrl(fileName);

          console.log('Image uploaded, public URL:', urlData.publicUrl);

          // Save image record
          const { error: insertError } = await supabase.from('listing_images').insert({
            listing_id: listing.id,
            url: urlData.publicUrl,
            sort_order: i,
            is_primary: i === 0,
          });

          if (insertError) {
            console.error('Error saving image record:', insertError);
          }
        }
      }

      // Redirect to the listing page
      router.push(`/listing/${listing.id}`);
    } catch (err: unknown) {
      console.error('Error creating listing:', err);
      // Show more detailed error message
      if (err && typeof err === 'object' && 'message' in err) {
        setError(`Failed to create listing: ${(err as { message: string }).message}`);
      } else if (err && typeof err === 'object' && 'details' in err) {
        setError(`Failed to create listing: ${(err as { details: string }).details}`);
      } else {
        setError('Failed to create listing. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="hidden sm:inline">Back to Dashboard</span>
            </Link>
            <h1 className="text-xl font-bold text-gray-900">Create Listing</h1>
            <button className="text-gray-600 hover:text-gray-900">
              Save Draft
            </button>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                      ${currentStep >= step.number
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-500'
                      }
                    `}
                  >
                    {currentStep > step.number ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      step.number
                    )}
                  </div>
                  <span className={`
                    text-xs mt-1 hidden sm:block
                    ${currentStep >= step.number ? 'text-blue-600' : 'text-gray-500'}
                  `}>
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`
                    w-12 sm:w-24 h-0.5 mx-2
                    ${currentStep > step.number ? 'bg-blue-600' : 'bg-gray-200'}
                  `} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Step 1: Photos & Videos */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Photos & Videos</h2>
              <p className="text-gray-600">
                High-quality photos help your equipment sell faster. Add at least 5 photos.
              </p>
            </div>

            {/* Upload area */}
            <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-8">
              <div className="text-center">
                {processingImages ? (
                  <>
                    <Loader2 className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
                    <p className="text-lg font-medium text-gray-900 mb-2">
                      Processing images...
                    </p>
                    <p className="text-sm text-gray-500">
                      Converting to web-compatible format
                    </p>
                  </>
                ) : (
                  <>
                    <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-900 mb-2">
                      Drop photos here or click to upload
                    </p>
                    <p className="text-sm text-gray-500 mb-4">
                      JPG, PNG or HEIC. Max 10MB per image.
                    </p>
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
                  </>
                )}
              </div>
            </div>

            {/* Uploaded images grid */}
            {uploadedImages.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-700">
                    Uploaded Photos ({uploadedImages.length})
                  </p>
                  <p className="text-xs text-gray-500">
                    Drag to reorder. First image is primary.
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {uploadedImages.map((img, index) => (
                    <div
                      key={index}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      className={`
                        relative group aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-move
                        ${draggedIndex === index ? 'opacity-50 scale-95' : ''}
                        ${dragOverIndex === index && draggedIndex !== index ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
                        transition-all duration-150
                      `}
                    >
                      {/* Drag handle */}
                      <div className="absolute top-2 left-2 p-1 bg-black/50 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <GripVertical className="h-4 w-4" />
                      </div>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-full object-cover pointer-events-none"
                      />
                      {/* Remove button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage(index);
                        }}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      {/* Move buttons for mobile/accessibility */}
                      <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        {index > 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              moveImage(index, index - 1);
                            }}
                            className="p-1 bg-black/50 text-white rounded text-xs hover:bg-black/70"
                          >
                            <ArrowLeft className="h-3 w-3" />
                          </button>
                        )}
                        {index < uploadedImages.length - 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              moveImage(index, index + 1);
                            }}
                            className="p-1 bg-black/50 text-white rounded text-xs hover:bg-black/70"
                          >
                            <ArrowRight className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                      {/* Primary badge */}
                      {index === 0 && (
                        <span className="absolute bottom-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded z-10">
                          Primary
                        </span>
                      )}
                      {/* Position number */}
                      <span className="absolute top-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-2 py-0.5 rounded">
                        {index + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Video section */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Video className="h-6 w-6 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">Add Video (Optional)</p>
                  <p className="text-sm text-gray-500">YouTube or Vimeo link</p>
                </div>
              </div>
              <input
                type="url"
                placeholder="https://youtube.com/watch?v=..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        )}

        {/* Step 2: Equipment Details */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Equipment Details</h2>
              <p className="text-gray-600">
                Provide accurate details to help buyers find your equipment.
              </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => updateFormData('title', e.target.value)}
                  placeholder="e.g., 2019 Pitney Bowes DI950 6-Station Inserter"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Include year, make, model, and key features
                </p>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => updateFormData('category', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white appearance-none cursor-pointer"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.slug}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Make / Manufacturer */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Make / Manufacturer *
                </label>
                <select
                  value={formData.make}
                  onChange={(e) => updateFormData('make', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white appearance-none cursor-pointer"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
                >
                  <option value="">Select manufacturer</option>
                  {(formData.category
                    ? [...new Set(manufacturersByCategory[formData.category] || [])].sort()
                    : allManufacturers
                  ).map((manufacturer) => (
                    <option key={manufacturer} value={manufacturer}>{manufacturer}</option>
                  ))}
                  <option value="other">Other (type below)</option>
                </select>
                {formData.make === 'other' && (
                  <input
                    type="text"
                    placeholder="Enter manufacturer name"
                    className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onChange={(e) => updateFormData('make', e.target.value)}
                  />
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {formData.category ? 'Showing manufacturers for selected category' : 'Select a category to see relevant manufacturers'}
                </p>
              </div>

              {/* Model / Year */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Model *
                  </label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => updateFormData('model', e.target.value)}
                    placeholder="e.g., DI950"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Year
                  </label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => updateFormData('year', e.target.value)}
                    placeholder="e.g., 2019"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Serial Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Serial Number
                </label>
                <input
                  type="text"
                  value={formData.serialNumber}
                  onChange={(e) => updateFormData('serialNumber', e.target.value)}
                  placeholder="Equipment serial number"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateFormData('description', e.target.value)}
                  rows={6}
                  placeholder="Describe your equipment in detail. Include specifications, features, history, and any issues or repairs."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Condition & Logistics */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Condition & Logistics</h2>
              <p className="text-gray-600">
                Help buyers understand the equipment condition and pickup requirements.
              </p>
            </div>

            {/* Condition */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                Equipment Condition
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Condition *
                  </label>
                  <select
                    value={formData.condition}
                    onChange={(e) => updateFormData('condition', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white appearance-none cursor-pointer"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
                  >
                    <option value="">Select condition</option>
                    <option value="excellent">Excellent - Like new</option>
                    <option value="good">Good - Minor wear</option>
                    <option value="fair">Fair - Shows wear</option>
                    <option value="poor">Poor - Needs repair</option>
                    <option value="parts">For Parts Only</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hours / Impressions Count
                  </label>
                  <input
                    type="number"
                    value={formData.hoursCount}
                    onChange={(e) => updateFormData('hoursCount', e.target.value)}
                    placeholder="e.g., 125000"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Equipment Status *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {equipmentStatuses.map((status) => (
                    <label
                      key={status.id}
                      className={`
                        flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors
                        ${formData.equipmentStatus === status.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                        }
                      `}
                    >
                      <input
                        type="radio"
                        name="equipmentStatus"
                        value={status.id}
                        checked={formData.equipmentStatus === status.id}
                        onChange={(e) => updateFormData('equipmentStatus', e.target.value)}
                        className="mt-1"
                      />
                      <div>
                        <p className="font-medium text-gray-900">{status.label}</p>
                        <p className="text-sm text-gray-500">{status.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Logistics */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Truck className="h-5 w-5 text-blue-600" />
                Pickup & Logistics
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  On-site Assistance *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {onsiteAssistanceOptions.map((option) => (
                    <label
                      key={option.id}
                      className={`
                        flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors
                        ${formData.onsiteAssistance === option.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                        }
                      `}
                    >
                      <input
                        type="radio"
                        name="onsiteAssistance"
                        value={option.id}
                        checked={formData.onsiteAssistance === option.id}
                        onChange={(e) => updateFormData('onsiteAssistance', e.target.value)}
                        className="mt-1"
                      />
                      <div>
                        <p className="font-medium text-gray-900">{option.label}</p>
                        <p className="text-sm text-gray-500">{option.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Weight (lbs)
                  </label>
                  <input
                    type="number"
                    value={formData.weight}
                    onChange={(e) => updateFormData('weight', e.target.value)}
                    placeholder="e.g., 2500"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Removal Deadline
                  </label>
                  <input
                    type="date"
                    value={formData.removalDeadline}
                    onChange={(e) => updateFormData('removalDeadline', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pickup Notes
                </label>
                <textarea
                  value={formData.pickupNotes}
                  onChange={(e) => updateFormData('pickupNotes', e.target.value)}
                  rows={3}
                  placeholder="Any special instructions for pickup (dock height, access restrictions, etc.)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Pricing & Auction */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Pricing & Auction</h2>
              <p className="text-gray-600">
                Set your listing type and pricing strategy.
              </p>
            </div>

            {/* Listing Type */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-blue-600" />
                Listing Type
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {listingTypes.map((type) => (
                  <label
                    key={type.id}
                    className={`
                      flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors
                      ${formData.listingType === type.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <input
                      type="radio"
                      name="listingType"
                      value={type.id}
                      checked={formData.listingType === type.id}
                      onChange={(e) => updateFormData('listingType', e.target.value)}
                      className="mt-1"
                    />
                    <div>
                      <p className="font-medium text-gray-900">{type.label}</p>
                      <p className="text-sm text-gray-500">{type.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                Pricing
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(formData.listingType === 'auction' || formData.listingType === 'auction_buy_now') && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Starting Price *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                        <input
                          type="number"
                          value={formData.startingPrice}
                          onChange={(e) => updateFormData('startingPrice', e.target.value)}
                          placeholder="0.00"
                          className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Reserve Price (Optional)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                        <input
                          type="number"
                          value={formData.reservePrice}
                          onChange={(e) => updateFormData('reservePrice', e.target.value)}
                          placeholder="Hidden minimum"
                          className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Item won&apos;t sell below this price
                      </p>
                    </div>
                  </>
                )}

                {(formData.listingType === 'auction_buy_now' || formData.listingType === 'fixed_price' || formData.listingType === 'fixed_price_offers') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {formData.listingType.includes('fixed') ? 'Price *' : 'Buy Now Price'}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        value={formData.buyNowPrice}
                        onChange={(e) => updateFormData('buyNowPrice', e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                )}

                {(formData.listingType === 'auction' || formData.listingType === 'auction_buy_now') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Auction Duration
                    </label>
                    <select
                      value={formData.auctionDuration}
                      onChange={(e) => updateFormData('auctionDuration', e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white appearance-none cursor-pointer"
                      style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
                    >
                      {auctionDurations.map((d) => (
                        <option key={d.id} value={d.id}>{d.label}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Accept Offers */}
              {(formData.listingType === 'fixed_price_offers' || formData.listingType === 'auction_buy_now') && (
                <div className="border-t pt-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.acceptOffers}
                      onChange={(e) => updateFormData('acceptOffers', e.target.checked)}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <p className="font-medium text-gray-900">Accept Offers</p>
                      <p className="text-sm text-gray-500">Allow buyers to make offers below listed price</p>
                    </div>
                  </label>
                </div>
              )}
            </div>

            {/* Payment Methods */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-blue-600" />
                Accepted Payment Methods
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.acceptsCreditCard}
                    onChange={(e) => updateFormData('acceptsCreditCard', e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Credit Card (2.9% + $0.30)</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.acceptsAch}
                    onChange={(e) => updateFormData('acceptsAch', e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>ACH (0.8%, max $5)</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.acceptsWire}
                    onChange={(e) => updateFormData('acceptsWire', e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Wire Transfer</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.acceptsCheck}
                    onChange={(e) => updateFormData('acceptsCheck', e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Check</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Review & Publish */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Review & Publish</h2>
              <p className="text-gray-600">
                Review your listing details before publishing. Click &quot;Edit&quot; on any section to make changes.
              </p>
            </div>

            {/* Photos & Videos Section */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Camera className="h-5 w-5 text-blue-600" />
                  Photos & Videos
                </h3>
                <button
                  onClick={() => setCurrentStep(1)}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </button>
              </div>
              <div className="p-4">
                {uploadedImages.length > 0 ? (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {uploadedImages.map((img, index) => (
                      <div key={index} className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative">
                        <img src={img} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                        {index === 0 && (
                          <span className="absolute bottom-1 left-1 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded">
                            Primary
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No photos uploaded</p>
                )}
                {formData.videos.length > 0 && (
                  <p className="text-sm text-gray-600 mt-2">Videos: {formData.videos.length} uploaded</p>
                )}
              </div>
            </div>

            {/* Equipment Details Section */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  Equipment Details
                </h3>
                <button
                  onClick={() => setCurrentStep(2)}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <span className="text-sm text-blue-600 font-medium">
                    {categories.find(c => c.slug === formData.category)?.name || formData.category || 'No category'}
                  </span>
                  <h4 className="text-lg font-bold text-gray-900 mt-1">
                    {formData.title || 'No title'}
                  </h4>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Make</p>
                    <p className="font-medium">{formData.make || '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Model</p>
                    <p className="font-medium">{formData.model || '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Year</p>
                    <p className="font-medium">{formData.year || '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Serial #</p>
                    <p className="font-medium">{formData.serialNumber || '—'}</p>
                  </div>
                </div>
                <div className="border-t pt-3">
                  <p className="text-gray-500 text-sm mb-1">Description</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {formData.description || <span className="italic text-gray-400">No description provided</span>}
                  </p>
                </div>
              </div>
            </div>

            {/* Condition & Logistics Section */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Truck className="h-5 w-5 text-blue-600" />
                  Condition & Logistics
                </h3>
                <button
                  onClick={() => setCurrentStep(3)}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </button>
              </div>
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Condition</p>
                    <p className="font-medium capitalize">{formData.condition || '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Equipment Status</p>
                    <p className="font-medium">
                      {equipmentStatuses.find(s => s.id === formData.equipmentStatus)?.label || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">On-site Assistance</p>
                    <p className="font-medium">
                      {onsiteAssistanceOptions.find(o => o.id === formData.onsiteAssistance)?.label || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Weight</p>
                    <p className="font-medium">{formData.weight ? `${formData.weight} lbs` : '—'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Location</p>
                    <p className="font-medium">{formData.location || '—'}</p>
                  </div>
                  {formData.removalDeadline && (
                    <div>
                      <p className="text-gray-500">Removal Deadline</p>
                      <p className="font-medium">{formData.removalDeadline}</p>
                    </div>
                  )}
                </div>
                {formData.pickupNotes && (
                  <div className="border-t pt-3">
                    <p className="text-gray-500 text-sm mb-1">Pickup Notes</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{formData.pickupNotes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Pricing & Auction Section */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                  Pricing & Auction
                </h3>
                <button
                  onClick={() => setCurrentStep(4)}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </button>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Listing Type</p>
                    <p className="font-medium">
                      {listingTypes.find(t => t.id === formData.listingType)?.label || '—'}
                    </p>
                  </div>
                  {formData.startingPrice && (
                    <div>
                      <p className="text-gray-500">Starting Price</p>
                      <p className="font-medium text-green-600">
                        ${parseInt(formData.startingPrice).toLocaleString()}
                      </p>
                    </div>
                  )}
                  {formData.buyNowPrice && (
                    <div>
                      <p className="text-gray-500">
                        {formData.listingType.includes('fixed') ? 'Price' : 'Buy Now Price'}
                      </p>
                      <p className="font-medium text-green-600">
                        ${parseInt(formData.buyNowPrice).toLocaleString()}
                      </p>
                    </div>
                  )}
                  {formData.reservePrice && (
                    <div>
                      <p className="text-gray-500">Reserve Price</p>
                      <p className="font-medium">${parseInt(formData.reservePrice).toLocaleString()}</p>
                    </div>
                  )}
                  {(formData.listingType === 'auction' || formData.listingType === 'auction_buy_now') && (
                    <div>
                      <p className="text-gray-500">Duration</p>
                      <p className="font-medium">
                        {auctionDurations.find(d => d.id === formData.auctionDuration)?.label || '—'}
                      </p>
                    </div>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {formData.acceptsCreditCard && (
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">Credit Card</span>
                  )}
                  {formData.acceptsAch && (
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">ACH</span>
                  )}
                  {formData.acceptsWire && (
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">Wire Transfer</span>
                  )}
                  {formData.acceptsCheck && (
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">Check</span>
                  )}
                </div>
              </div>
            </div>

            {/* Fee Summary */}
            <div className="bg-blue-50 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900">Fee Summary</p>
                  <ul className="text-sm text-blue-700 mt-2 space-y-1">
                    <li>• Buyer Premium: 5% (paid by buyer)</li>
                    <li>• Seller Commission: 8-12% of sale price</li>
                    <li>• Payment processing fees passed to buyer</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Terms Agreement */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="w-5 h-5 mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600">
                I agree to the <Link href="/terms" className="text-blue-600 hover:underline">Terms of Service</Link> and
                confirm that this listing is accurate and I have the right to sell this equipment.
              </span>
            </label>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t">
          {currentStep > 1 ? (
            <button
              onClick={prevStep}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium"
            >
              <ArrowLeft className="h-5 w-5" />
              Previous
            </button>
          ) : (
            <div />
          )}

          {currentStep < 5 ? (
            <button
              onClick={nextStep}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700"
            >
              Next
              <ArrowRight className="h-5 w-5" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5" />
                  Publish Listing
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
