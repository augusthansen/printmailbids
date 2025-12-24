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
  Pencil,
  Calendar,
  Zap
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import MakeAutocomplete from '@/components/MakeAutocomplete';
import ModelAutocomplete from '@/components/ModelAutocomplete';

type Step = 1 | 2 | 3 | 4 | 5 | 6;

// Machine capabilities options by category
const capabilitiesByCategory: Record<string, string[]> = {
  'mailing-fulfillment': [
    'Intelligent Mail Barcode (IMb)',
    'Address Quality',
    'NCOA Processing',
    'Inkjet Addressing',
    'Double Feed Detection',
    'Barcode Reading',
    'OCR/OMR',
    'Camera Verification',
    'Sorting',
    'Tabbing',
    'Stamp Affixing',
    'Metering',
    'Weighing',
  ],
  'printing': [
    'Variable Data Printing',
    'Spot Color',
    'UV Coating',
    'Aqueous Coating',
    'Perfecting (Duplex)',
    'White Ink',
    'Metallic Ink',
    'Cut Sheet',
    'Continuous Feed',
    'Web-to-Print',
    'Wide Format',
    'Label Printing',
    'Envelope Printing',
  ],
  'bindery-finishing': [
    'Saddle Stitching',
    'Perfect Binding',
    'Wire-O Binding',
    'Coil Binding',
    'Case Making',
    'Laminating',
    'UV Coating',
    'Die Cutting',
    'Embossing',
    'Foil Stamping',
    'Scoring',
    'Perforating',
    'Numbering',
    'Collating',
  ],
  'packaging': [
    'Box Making',
    'Carton Erecting',
    'Case Sealing',
    'Shrink Wrapping',
    'Stretch Wrapping',
    'Banding',
    'Labeling',
    'Palletizing',
    'Filling',
    'Capping',
  ],
  'material-handling': [
    'Lift Capacity',
    'Indoor/Outdoor',
    'Electric',
    'Propane',
    'Diesel',
    'Reach',
    'Narrow Aisle',
    'Walk Behind',
    'Rider',
    'Order Picker',
  ],
  'parts-supplies': [],
};

// Operating systems for equipment
const operatingSystems = [
  'Windows 11',
  'Windows 10',
  'Windows 7',
  'Windows XP',
  'Linux',
  'macOS',
  'Proprietary/Embedded',
  'DOS-based',
  'Other',
];

// Controller types
const controllerTypes = [
  'PC-based Controller',
  'PLC (Programmable Logic Controller)',
  'Proprietary Controller',
  'Touchscreen HMI',
  'Remote/Network Control',
  'Manual/Mechanical',
  'Other',
];

// Helper function to convert image to JPEG using Canvas (works for most formats)
async function convertToJpeg(file: File): Promise<File> {
  // If already JPEG, return as-is
  if (file.type === 'image/jpeg') {
    return file;
  }

  const isHeic = file.type === 'image/heic' ||
                 file.type === 'image/heif' ||
                 file.name.toLowerCase().endsWith('.heic') ||
                 file.name.toLowerCase().endsWith('.heif');

  // Try heic2any for HEIC files first
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
      console.warn('heic2any conversion failed:', error);
      throw new Error('HEIC conversion failed. Please convert the image to JPEG or PNG before uploading.');
    }
  }

  // For PNG and other formats, convert to JPEG using canvas for consistency
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          URL.revokeObjectURL(url);
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Fill with white background (for transparent PNGs)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

        canvas.toBlob((blob) => {
          URL.revokeObjectURL(url);
          if (blob) {
            const newFileName = file.name.replace(/\.[^.]+$/, '.jpg');
            resolve(new File([blob], newFileName, { type: 'image/jpeg' }));
          } else {
            reject(new Error('Failed to convert image to JPEG'));
          }
        }, 'image/jpeg', 0.92);
      } catch (err) {
        URL.revokeObjectURL(url);
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Could not load image: ${file.name}. The format may not be supported.`));
    };

    img.src = url;
  });
}

const steps = [
  { number: 1, title: 'Photos & Videos' },
  { number: 2, title: 'Equipment Details' },
  { number: 3, title: 'Machine Specs' },
  { number: 4, title: 'Condition & Logistics' },
  { number: 5, title: 'Pricing & Auction' },
  { number: 6, title: 'Review & Publish' },
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
  const [savingDraft, setSavingDraft] = useState(false);
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

  // Load seller's default terms and shipping info from profile
  useEffect(() => {
    async function loadSellerDefaults() {
      if (!user?.id) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('seller_terms, default_shipping_info')
        .eq('id', user.id)
        .single();

      if (profile) {
        // Only pre-fill if the form fields are empty (don't overwrite user edits)
        setFormData(prev => ({
          ...prev,
          sellerTerms: prev.sellerTerms || profile.seller_terms || '',
          shippingInfo: prev.shippingInfo || profile.default_shipping_info || '',
        }));
      }
    }
    loadSellerDefaults();
  }, [user?.id, supabase]);

  // Form state
  const [formData, setFormData] = useState({
    // Step 1: Media
    images: [] as File[],
    videos: [] as string[],
    videoUrl: '',

    // Step 2: Details
    title: '',
    category: '',
    description: '',
    sellerTerms: '',
    shippingInfo: '',
    make: '',
    model: '',
    year: '',
    serialNumber: '',

    // Step 3: Machine Specs
    // Software & System
    softwareNa: false,
    softwareVersion: '',
    operatingSystem: '',
    controllerType: '',

    // Configuration
    configurationNa: false,
    numberOfHeads: '',
    maxSpeed: '',
    feederCount: '',
    outputStackerCount: '',

    // Capabilities
    capabilitiesNa: false,
    capabilities: [] as string[],

    // Material Specifications
    materialNa: false,
    materialTypes: '',
    maxMaterialWidth: '',
    maxMaterialLength: '',
    materialWeight: '',

    // Additional Technical
    powerRequirements: '',
    networkConnectivity: '',
    includedAccessories: '',
    maintenanceHistory: '',
    lastServiceDate: '',

    // Step 4: Condition & Logistics
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
    // Scheduling
    scheduleType: 'immediate' as 'immediate' | 'scheduled',
    scheduledStartDate: '',
    scheduledStartTime: '09:00',
    scheduledEndDate: '',
    scheduledEndTime: '15:00',
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
      setError(null);

      const errors: string[] = [];

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
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`${file.name}: ${errorMessage}`);
        }
      }

      if (errors.length > 0) {
        setError(`Failed to process some images:\n${errors.join('\n')}`);
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
    if (currentStep < 6) {
      setCurrentStep((currentStep + 1) as Step);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step);
    }
  };

  const handleSaveDraft = async () => {
    if (!user?.id) {
      setError('You must be logged in to save a draft');
      return;
    }

    setSavingDraft(true);
    setError(null);

    try {
      // Find category ID from slug
      const selectedCategory = categories.find(c => c.slug === formData.category || c.id === formData.category);
      const isValidUUID = selectedCategory?.id &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(selectedCategory.id);
      const categoryId = isValidUUID ? selectedCategory.id : null;

      // Create draft listing (no start/end time required for drafts)
      const { data: listing, error: listingError } = await supabase
        .from('listings')
        .insert({
          seller_id: user.id,
          title: formData.title || 'Untitled Draft',
          description: formData.description || null,
          seller_terms: formData.sellerTerms || null,
          shipping_info: formData.shippingInfo || null,
          primary_category_id: categoryId,
          listing_type: formData.listingType,
          status: 'draft',
          starting_price: formData.startingPrice ? parseFloat(formData.startingPrice) : null,
          reserve_price: formData.reservePrice ? parseFloat(formData.reservePrice) : null,
          buy_now_price: formData.buyNowPrice ? parseFloat(formData.buyNowPrice) : null,
          fixed_price: formData.listingType.includes('fixed') && formData.buyNowPrice ? parseFloat(formData.buyNowPrice) : null,
          accept_offers: formData.acceptOffers,
          auto_accept_price: formData.autoAcceptPrice ? parseFloat(formData.autoAcceptPrice) : null,
          auto_decline_price: formData.autoDeclinePrice ? parseFloat(formData.autoDeclinePrice) : null,
          make: formData.make || null,
          model: formData.model || null,
          year: formData.year ? parseInt(formData.year) : null,
          serial_number: formData.serialNumber || null,
          condition: formData.condition || null,
          hours_count: formData.hoursCount ? parseInt(formData.hoursCount) : null,
          equipment_status: formData.equipmentStatus || null,
          onsite_assistance: formData.onsiteAssistance,
          weight_lbs: formData.weight ? parseInt(formData.weight) : null,
          removal_deadline: formData.removalDeadline || null,
          pickup_notes: formData.pickupNotes || null,
          payment_due_days: parseInt(formData.paymentDueDays),
          accepts_credit_card: formData.acceptsCreditCard,
          accepts_ach: formData.acceptsAch,
          accepts_wire: formData.acceptsWire,
          accepts_check: formData.acceptsCheck,
          video_url: formData.videoUrl || null,
          // Machine Specs
          software_na: formData.softwareNa,
          software_version: formData.softwareVersion || null,
          operating_system: formData.operatingSystem || null,
          controller_type: formData.controllerType || null,
          configuration_na: formData.configurationNa,
          number_of_heads: formData.numberOfHeads ? parseInt(formData.numberOfHeads) : null,
          max_speed: formData.maxSpeed || null,
          feeder_count: formData.feederCount ? parseInt(formData.feederCount) : null,
          output_stacker_count: formData.outputStackerCount ? parseInt(formData.outputStackerCount) : null,
          capabilities_na: formData.capabilitiesNa,
          capabilities: formData.capabilities.length > 0 ? formData.capabilities : null,
          material_na: formData.materialNa,
          material_types: formData.materialTypes || null,
          max_material_width: formData.maxMaterialWidth || null,
          max_material_length: formData.maxMaterialLength || null,
          material_weight: formData.materialWeight || null,
          power_requirements: formData.powerRequirements || null,
          network_connectivity: formData.networkConnectivity || null,
          included_accessories: formData.includedAccessories || null,
          maintenance_history: formData.maintenanceHistory || null,
          last_service_date: formData.lastServiceDate || null,
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
            listing_id: listing.id,
            url: urlData.publicUrl,
            sort_order: i,
            is_primary: i === 0,
          });
        }
      }

      // Redirect to edit page for the draft
      router.push(`/dashboard/listings/${listing.id}/edit`);
    } catch (err: unknown) {
      console.error('Error saving draft:', err);
      if (err && typeof err === 'object') {
        const supabaseErr = err as { message?: string; details?: string; hint?: string };
        const errorMsg = supabaseErr.message || supabaseErr.details || supabaseErr.hint || 'Unknown error';
        setError(`Failed to save draft: ${errorMsg}`);
      } else {
        setError('Failed to save draft. Please try again.');
      }
    } finally {
      setSavingDraft(false);
    }
  };

  const handleSubmit = async () => {
    console.log('handleSubmit called, user:', user);
    if (!user?.id) {
      setError('You must be logged in to create a listing');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      console.log('Starting listing creation for user:', user.id);

      // Determine start and end times based on schedule type
      let startTime: Date;
      let endTime: Date;
      let listingStatus: 'active' | 'scheduled';

      if (formData.scheduleType === 'scheduled' && formData.scheduledStartDate && formData.scheduledEndDate) {
        // Scheduled listing - combine date and time
        startTime = new Date(`${formData.scheduledStartDate}T${formData.scheduledStartTime}:00`);
        endTime = new Date(`${formData.scheduledEndDate}T${formData.scheduledEndTime}:00`);

        // Validate dates
        const now = new Date();
        if (startTime <= now) {
          setError('Scheduled start time must be in the future');
          setSubmitting(false);
          return;
        }
        if (endTime <= startTime) {
          setError('End time must be after start time');
          setSubmitting(false);
          return;
        }

        listingStatus = 'scheduled';
      } else {
        // Immediate - go live now with duration-based end time
        startTime = new Date();
        endTime = new Date();
        endTime.setDate(endTime.getDate() + parseInt(formData.auctionDuration));
        listingStatus = 'active';
      }

      // Find category ID from slug
      const selectedCategory = categories.find(c => c.slug === formData.category || c.id === formData.category);

      // Check if the category ID is a valid UUID (fallback categories have non-UUID IDs)
      const isValidUUID = selectedCategory?.id &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(selectedCategory.id);
      const categoryId = isValidUUID ? selectedCategory.id : null;

      // Create the listing
      console.log('Inserting listing with data:', {
        seller_id: user.id,
        title: formData.title,
        listing_type: formData.listingType,
        primary_category_id: categoryId,
      });
      const { data: listing, error: listingError } = await supabase
        .from('listings')
        .insert({
          seller_id: user.id,
          title: formData.title,
          description: formData.description,
          seller_terms: formData.sellerTerms || null,
          shipping_info: formData.shippingInfo || null,
          primary_category_id: categoryId,
          listing_type: formData.listingType,
          status: listingStatus,
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
          video_url: formData.videoUrl || null,
          // Machine Specs
          software_na: formData.softwareNa,
          software_version: formData.softwareVersion || null,
          operating_system: formData.operatingSystem || null,
          controller_type: formData.controllerType || null,
          configuration_na: formData.configurationNa,
          number_of_heads: formData.numberOfHeads ? parseInt(formData.numberOfHeads) : null,
          max_speed: formData.maxSpeed || null,
          feeder_count: formData.feederCount ? parseInt(formData.feederCount) : null,
          output_stacker_count: formData.outputStackerCount ? parseInt(formData.outputStackerCount) : null,
          capabilities_na: formData.capabilitiesNa,
          capabilities: formData.capabilities.length > 0 ? formData.capabilities : null,
          material_na: formData.materialNa,
          material_types: formData.materialTypes || null,
          max_material_width: formData.maxMaterialWidth || null,
          max_material_length: formData.maxMaterialLength || null,
          material_weight: formData.materialWeight || null,
          power_requirements: formData.powerRequirements || null,
          network_connectivity: formData.networkConnectivity || null,
          included_accessories: formData.includedAccessories || null,
          maintenance_history: formData.maintenanceHistory || null,
          last_service_date: formData.lastServiceDate || null,
        })
        .select()
        .single();

      console.log('Supabase response - listing:', listing, 'error:', listingError);
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
      console.error('Error creating listing:', JSON.stringify(err, null, 2));
      // Show more detailed error message for Supabase errors
      if (err && typeof err === 'object') {
        const supabaseErr = err as { message?: string; details?: string; hint?: string; code?: string };
        const errorMsg = supabaseErr.message || supabaseErr.details || supabaseErr.hint || 'Unknown error';
        setError(`Failed to create listing: ${errorMsg}`);
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
            <div className="w-20" /> {/* Spacer for layout balance */}
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
                  <p className="text-xs text-gray-500 hidden sm:block">
                    Drag to reorder. First image is primary.
                  </p>
                  <p className="text-xs text-gray-500 sm:hidden">
                    Use arrows to reorder. First is primary.
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
                        relative group aspect-square bg-gray-100 rounded-lg overflow-hidden sm:cursor-move
                        ${draggedIndex === index ? 'opacity-50 scale-95' : ''}
                        ${dragOverIndex === index && draggedIndex !== index ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
                        transition-all duration-150
                      `}
                    >
                      {/* Drag handle - only on desktop */}
                      <div className="absolute top-2 left-2 p-1 bg-black/50 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 hidden sm:block">
                        <GripVertical className="h-4 w-4" />
                      </div>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-full object-cover pointer-events-none select-none"
                        draggable={false}
                      />
                      {/* Remove button - always visible on mobile, hover on desktop */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          removeImage(index);
                        }}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-20"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      {/* Move buttons - always visible on mobile, hover on desktop */}
                      <div className="absolute bottom-2 right-2 flex gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-20">
                        {index > 0 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              moveImage(index, index - 1);
                            }}
                            className="p-2 bg-black/70 text-white rounded-lg active:bg-black/90 touch-manipulation"
                            aria-label="Move left"
                          >
                            <ArrowLeft className="h-5 w-5" />
                          </button>
                        )}
                        {index < uploadedImages.length - 1 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              moveImage(index, index + 1);
                            }}
                            className="p-2 bg-black/70 text-white rounded-lg active:bg-black/90 touch-manipulation"
                            aria-label="Move right"
                          >
                            <ArrowRight className="h-5 w-5" />
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
                  <p className="text-sm text-gray-500">YouTube or Vimeo link - will be embedded on the listing page</p>
                </div>
              </div>
              <input
                type="url"
                value={formData.videoUrl}
                onChange={(e) => updateFormData('videoUrl', e.target.value)}
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
                <MakeAutocomplete
                  value={formData.make}
                  onChange={(value) => updateFormData('make', value)}
                  category={formData.category}
                  placeholder="Start typing manufacturer name..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Type to search or enter a new manufacturer
                </p>
              </div>

              {/* Model / Year */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Model *
                  </label>
                  <ModelAutocomplete
                    value={formData.model}
                    onChange={(value) => updateFormData('model', value)}
                    make={formData.make}
                    placeholder={formData.make ? `Search ${formData.make} models...` : 'Enter model...'}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.make ? `Suggestions based on other ${formData.make} listings` : 'Select a manufacturer first for suggestions'}
                  </p>
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

              {/* Seller Terms */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Seller Terms (Optional)
                </label>
                <textarea
                  value={formData.sellerTerms}
                  onChange={(e) => updateFormData('sellerTerms', e.target.value)}
                  rows={4}
                  placeholder="Enter any terms and conditions for this listing. Buyers will need to accept these before bidding."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.sellerTerms
                    ? 'Pre-filled from your profile settings. Edit as needed for this listing.'
                    : 'Set default terms in your profile settings to auto-fill this field.'}
                </p>
              </div>

              {/* Shipping Info */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Shipping Information (Optional)
                </label>
                <textarea
                  value={formData.shippingInfo}
                  onChange={(e) => updateFormData('shippingInfo', e.target.value)}
                  rows={4}
                  placeholder="Describe shipping options, packaging requirements, freight recommendations, etc."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.shippingInfo
                    ? 'Pre-filled from your profile settings. Edit as needed for this listing.'
                    : 'Set default shipping info in your profile settings to auto-fill this field.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Machine Specs */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Machine Specifications</h2>
              <p className="text-gray-600">
                Provide technical details about your equipment. Mark sections as N/A if they don&apos;t apply.
              </p>
            </div>

            {/* Software & System Section */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Info className="h-5 w-5 text-blue-600" />
                  Software & System
                </h3>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.softwareNa}
                    onChange={(e) => updateFormData('softwareNa', e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-gray-500 focus:ring-gray-400"
                  />
                  <span className="text-gray-500">N/A</span>
                </label>
              </div>
              {!formData.softwareNa && (
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Software/Firmware Version
                      </label>
                      <input
                        type="text"
                        value={formData.softwareVersion}
                        onChange={(e) => updateFormData('softwareVersion', e.target.value)}
                        placeholder="e.g., v4.2.1, Build 2024.03"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Operating System
                      </label>
                      <select
                        value={formData.operatingSystem}
                        onChange={(e) => updateFormData('operatingSystem', e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white appearance-none cursor-pointer"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
                      >
                        <option value="">Select operating system</option>
                        {operatingSystems.map((os) => (
                          <option key={os} value={os}>{os}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Controller Type
                    </label>
                    <select
                      value={formData.controllerType}
                      onChange={(e) => updateFormData('controllerType', e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white appearance-none cursor-pointer"
                      style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
                    >
                      <option value="">Select controller type</option>
                      {controllerTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Machine Configuration Section */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  Machine Configuration
                </h3>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.configurationNa}
                    onChange={(e) => updateFormData('configurationNa', e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-gray-500 focus:ring-gray-400"
                  />
                  <span className="text-gray-500">N/A</span>
                </label>
              </div>
              {!formData.configurationNa && (
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Number of Heads
                      </label>
                      <input
                        type="number"
                        value={formData.numberOfHeads}
                        onChange={(e) => updateFormData('numberOfHeads', e.target.value)}
                        placeholder="e.g., 4"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">For printers, inkjets, etc.</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Max Speed
                      </label>
                      <input
                        type="text"
                        value={formData.maxSpeed}
                        onChange={(e) => updateFormData('maxSpeed', e.target.value)}
                        placeholder="e.g., 10,000/hour"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Feeder Count
                      </label>
                      <input
                        type="number"
                        value={formData.feederCount}
                        onChange={(e) => updateFormData('feederCount', e.target.value)}
                        placeholder="e.g., 4"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Output Stacker Count
                    </label>
                    <input
                      type="number"
                      value={formData.outputStackerCount}
                      onChange={(e) => updateFormData('outputStackerCount', e.target.value)}
                      placeholder="e.g., 2"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Capabilities Section */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                  Machine Capabilities
                </h3>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.capabilitiesNa}
                    onChange={(e) => updateFormData('capabilitiesNa', e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-gray-500 focus:ring-gray-400"
                  />
                  <span className="text-gray-500">N/A</span>
                </label>
              </div>
              {!formData.capabilitiesNa && (
                <div className="p-6">
                  {formData.category && capabilitiesByCategory[formData.category]?.length > 0 ? (
                    <>
                      <p className="text-sm text-gray-600 mb-3">
                        Select all capabilities that apply to this equipment:
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {capabilitiesByCategory[formData.category]?.map((capability) => (
                          <label
                            key={capability}
                            className={`
                              flex items-center gap-2 p-2 border rounded-lg cursor-pointer transition-colors
                              ${formData.capabilities.includes(capability)
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                              }
                            `}
                          >
                            <input
                              type="checkbox"
                              checked={formData.capabilities.includes(capability)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  updateFormData('capabilities', [...formData.capabilities, capability]);
                                } else {
                                  updateFormData('capabilities', formData.capabilities.filter((c: string) => c !== capability));
                                }
                              }}
                              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm">{capability}</span>
                          </label>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-gray-500 italic">
                      {formData.category
                        ? 'No pre-defined capabilities for this category. Use the description field to detail capabilities.'
                        : 'Select a category in Equipment Details to see relevant capabilities.'}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Piece Dimensions Section */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  Material Specifications
                </h3>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.materialNa}
                    onChange={(e) => updateFormData('materialNa', e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-gray-500 focus:ring-gray-400"
                  />
                  <span className="text-gray-500">N/A</span>
                </label>
              </div>
              {!formData.materialNa && (
                <div className="p-6 space-y-4">
                  <p className="text-sm text-gray-600">
                    What types of materials can this equipment handle?
                  </p>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Material Types
                    </label>
                    <input
                      type="text"
                      value={formData.materialTypes}
                      onChange={(e) => updateFormData('materialTypes', e.target.value)}
                      placeholder="e.g., Paper, Cardstock, Envelopes, Labels, Polymailers"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">Comma-separated list of material types</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Max Material Width
                      </label>
                      <input
                        type="text"
                        value={formData.maxMaterialWidth}
                        onChange={(e) => updateFormData('maxMaterialWidth', e.target.value)}
                        placeholder='e.g., 12"'
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Max Material Length
                      </label>
                      <input
                        type="text"
                        value={formData.maxMaterialLength}
                        onChange={(e) => updateFormData('maxMaterialLength', e.target.value)}
                        placeholder='e.g., 17"'
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Max Material Weight
                      </label>
                      <input
                        type="text"
                        value={formData.materialWeight}
                        onChange={(e) => updateFormData('materialWeight', e.target.value)}
                        placeholder="e.g., 110 lb cover, 20 lb bond"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Additional Technical Details Section */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Info className="h-5 w-5 text-blue-600" />
                Additional Technical Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Power Requirements
                  </label>
                  <input
                    type="text"
                    value={formData.powerRequirements}
                    onChange={(e) => updateFormData('powerRequirements', e.target.value)}
                    placeholder="e.g., 208V 3-phase, 30A"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Network Connectivity
                  </label>
                  <input
                    type="text"
                    value={formData.networkConnectivity}
                    onChange={(e) => updateFormData('networkConnectivity', e.target.value)}
                    placeholder="e.g., Ethernet, Wi-Fi, USB"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Service Date
                  </label>
                  <input
                    type="date"
                    value={formData.lastServiceDate}
                    onChange={(e) => updateFormData('lastServiceDate', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Included Accessories
                  </label>
                  <input
                    type="text"
                    value={formData.includedAccessories}
                    onChange={(e) => updateFormData('includedAccessories', e.target.value)}
                    placeholder="e.g., Extra trays, tools, manuals"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maintenance History
                </label>
                <textarea
                  value={formData.maintenanceHistory}
                  onChange={(e) => updateFormData('maintenanceHistory', e.target.value)}
                  rows={3}
                  placeholder="Describe recent maintenance, repairs, or service history..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Condition & Logistics */}
        {currentStep === 4 && (
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

        {/* Step 5: Pricing & Auction */}
        {currentStep === 5 && (
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
                {formData.listingType === 'auction' && (
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

                {(formData.listingType === 'fixed_price' || formData.listingType === 'fixed_price_offers') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price *
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

                {formData.listingType === 'auction' && (
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
              {formData.listingType === 'fixed_price_offers' && (
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

            {/* Scheduling */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                Listing Schedule
              </h3>

              {/* Schedule Type Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  className={`
                    flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors
                    ${formData.scheduleType === 'immediate'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <input
                    type="radio"
                    name="scheduleType"
                    value="immediate"
                    checked={formData.scheduleType === 'immediate'}
                    onChange={(e) => updateFormData('scheduleType', e.target.value)}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-medium text-gray-900 flex items-center gap-2">
                      <Zap className="h-4 w-4 text-yellow-500" />
                      Go Live Immediately
                    </p>
                    <p className="text-sm text-gray-500">Listing goes live as soon as you publish</p>
                  </div>
                </label>
                <label
                  className={`
                    flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors
                    ${formData.scheduleType === 'scheduled'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <input
                    type="radio"
                    name="scheduleType"
                    value="scheduled"
                    checked={formData.scheduleType === 'scheduled'}
                    onChange={(e) => updateFormData('scheduleType', e.target.value)}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-medium text-gray-900 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-blue-500" />
                      Schedule for Later
                    </p>
                    <p className="text-sm text-gray-500">Choose when your listing goes live and ends</p>
                  </div>
                </label>
              </div>

              {/* Scheduled Date/Time Inputs */}
              {formData.scheduleType === 'scheduled' && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Start Date/Time */}
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-gray-700">Listing Goes Live</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Date</label>
                          <input
                            type="date"
                            value={formData.scheduledStartDate}
                            onChange={(e) => updateFormData('scheduledStartDate', e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Time</label>
                          <input
                            type="time"
                            value={formData.scheduledStartTime}
                            onChange={(e) => updateFormData('scheduledStartTime', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* End Date/Time */}
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-gray-700">Listing Ends</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Date</label>
                          <input
                            type="date"
                            value={formData.scheduledEndDate}
                            onChange={(e) => updateFormData('scheduledEndDate', e.target.value)}
                            min={formData.scheduledStartDate || new Date().toISOString().split('T')[0]}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Time</label>
                          <input
                            type="time"
                            value={formData.scheduledEndTime}
                            onChange={(e) => updateFormData('scheduledEndTime', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Timezone notice */}
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    All times are in your local timezone ({Intl.DateTimeFormat().resolvedOptions().timeZone})
                  </p>

                  {/* Peak times suggestion */}
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      <strong>Tip:</strong> Auctions ending on weekday afternoons (2-4 PM) or Sunday evenings often get the most activity.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 6: Review & Publish */}
        {currentStep === 6 && (
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
                {formData.sellerTerms && (
                  <div className="border-t pt-3">
                    <p className="text-gray-500 text-sm mb-1">Seller Terms</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{formData.sellerTerms}</p>
                  </div>
                )}
                {formData.shippingInfo && (
                  <div className="border-t pt-3">
                    <p className="text-gray-500 text-sm mb-1">Shipping Information</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{formData.shippingInfo}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Machine Specs Section */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Info className="h-5 w-5 text-blue-600" />
                  Machine Specifications
                </h3>
                <button
                  onClick={() => setCurrentStep(3)}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </button>
              </div>
              <div className="p-4 space-y-4">
                {/* Software & System */}
                {!formData.softwareNa && (formData.softwareVersion || formData.operatingSystem || formData.controllerType) && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Software & System</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                      {formData.softwareVersion && (
                        <div>
                          <p className="text-gray-500">Software Version</p>
                          <p className="font-medium">{formData.softwareVersion}</p>
                        </div>
                      )}
                      {formData.operatingSystem && (
                        <div>
                          <p className="text-gray-500">Operating System</p>
                          <p className="font-medium">{formData.operatingSystem}</p>
                        </div>
                      )}
                      {formData.controllerType && (
                        <div>
                          <p className="text-gray-500">Controller Type</p>
                          <p className="font-medium">{formData.controllerType}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {formData.softwareNa && (
                  <p className="text-sm text-gray-400 italic">Software & System: N/A</p>
                )}

                {/* Configuration */}
                {!formData.configurationNa && (formData.numberOfHeads || formData.maxSpeed || formData.feederCount || formData.outputStackerCount) && (
                  <div className="border-t pt-3">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Configuration</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                      {formData.numberOfHeads && (
                        <div>
                          <p className="text-gray-500">Heads</p>
                          <p className="font-medium">{formData.numberOfHeads}</p>
                        </div>
                      )}
                      {formData.maxSpeed && (
                        <div>
                          <p className="text-gray-500">Max Speed</p>
                          <p className="font-medium">{formData.maxSpeed}</p>
                        </div>
                      )}
                      {formData.feederCount && (
                        <div>
                          <p className="text-gray-500">Feeders</p>
                          <p className="font-medium">{formData.feederCount}</p>
                        </div>
                      )}
                      {formData.outputStackerCount && (
                        <div>
                          <p className="text-gray-500">Stackers</p>
                          <p className="font-medium">{formData.outputStackerCount}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {formData.configurationNa && (
                  <p className="text-sm text-gray-400 italic border-t pt-3">Configuration: N/A</p>
                )}

                {/* Capabilities */}
                {!formData.capabilitiesNa && formData.capabilities.length > 0 && (
                  <div className="border-t pt-3">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Capabilities</p>
                    <div className="flex flex-wrap gap-2">
                      {formData.capabilities.map((cap: string) => (
                        <span key={cap} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          {cap}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {formData.capabilitiesNa && (
                  <p className="text-sm text-gray-400 italic border-t pt-3">Capabilities: N/A</p>
                )}

                {/* Material Specifications */}
                {!formData.materialNa && (formData.materialTypes || formData.maxMaterialWidth || formData.maxMaterialLength || formData.materialWeight) && (
                  <div className="border-t pt-3">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Material Specifications</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                      {formData.materialTypes && (
                        <div className="col-span-2 sm:col-span-4">
                          <p className="text-gray-500">Material Types</p>
                          <p className="font-medium">{formData.materialTypes}</p>
                        </div>
                      )}
                      {formData.maxMaterialWidth && (
                        <div>
                          <p className="text-gray-500">Max Width</p>
                          <p className="font-medium">{formData.maxMaterialWidth}</p>
                        </div>
                      )}
                      {formData.maxMaterialLength && (
                        <div>
                          <p className="text-gray-500">Max Length</p>
                          <p className="font-medium">{formData.maxMaterialLength}</p>
                        </div>
                      )}
                      {formData.materialWeight && (
                        <div>
                          <p className="text-gray-500">Max Weight</p>
                          <p className="font-medium">{formData.materialWeight}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {formData.materialNa && (
                  <p className="text-sm text-gray-400 italic border-t pt-3">Material Specifications: N/A</p>
                )}

                {/* Additional Technical */}
                {(formData.powerRequirements || formData.networkConnectivity || formData.lastServiceDate || formData.includedAccessories) && (
                  <div className="border-t pt-3">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Additional Details</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                      {formData.powerRequirements && (
                        <div>
                          <p className="text-gray-500">Power</p>
                          <p className="font-medium">{formData.powerRequirements}</p>
                        </div>
                      )}
                      {formData.networkConnectivity && (
                        <div>
                          <p className="text-gray-500">Network</p>
                          <p className="font-medium">{formData.networkConnectivity}</p>
                        </div>
                      )}
                      {formData.lastServiceDate && (
                        <div>
                          <p className="text-gray-500">Last Service</p>
                          <p className="font-medium">{formData.lastServiceDate}</p>
                        </div>
                      )}
                      {formData.includedAccessories && (
                        <div className="col-span-2">
                          <p className="text-gray-500">Accessories</p>
                          <p className="font-medium">{formData.includedAccessories}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Check if no machine specs provided */}
                {formData.softwareNa && formData.configurationNa && formData.capabilitiesNa && formData.materialNa &&
                 !formData.powerRequirements && !formData.networkConnectivity && !formData.lastServiceDate && !formData.includedAccessories && (
                  <p className="text-sm text-gray-400 italic">No machine specifications provided</p>
                )}
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
                  onClick={() => setCurrentStep(4)}
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
                  onClick={() => setCurrentStep(5)}
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
                  {formData.listingType === 'auction' && (
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

                {/* Scheduling Info */}
                <div className="mt-4 pt-4 border-t">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Schedule</p>
                      <p className="font-medium flex items-center gap-1">
                        {formData.scheduleType === 'immediate' ? (
                          <><Zap className="h-4 w-4 text-yellow-500" /> Go Live Immediately</>
                        ) : (
                          <><Calendar className="h-4 w-4 text-blue-500" /> Scheduled</>
                        )}
                      </p>
                    </div>
                    {formData.scheduleType === 'scheduled' && formData.scheduledStartDate && (
                      <>
                        <div>
                          <p className="text-gray-500">Goes Live</p>
                          <p className="font-medium">
                            {new Date(`${formData.scheduledStartDate}T${formData.scheduledStartTime}`).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Ends</p>
                          <p className="font-medium">
                            {new Date(`${formData.scheduledEndDate}T${formData.scheduledEndTime}`).toLocaleString()}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
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

          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveDraft}
              disabled={savingDraft}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              {savingDraft ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Draft'
              )}
            </button>

            {currentStep < 6 ? (
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
    </div>
  );
}
