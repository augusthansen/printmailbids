'use client';

import { useState } from 'react';
import Link from 'next/link';
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
  CheckCircle
} from 'lucide-react';

type Step = 1 | 2 | 3 | 4 | 5;

const steps = [
  { number: 1, title: 'Photos & Videos' },
  { number: 2, title: 'Equipment Details' },
  { number: 3, title: 'Condition & Logistics' },
  { number: 4, title: 'Pricing & Auction' },
  { number: 5, title: 'Review & Publish' },
];

const categories = [
  { id: 'mailing-fulfillment', name: 'Mailing & Fulfillment' },
  { id: 'printing', name: 'Printing' },
  { id: 'bindery-finishing', name: 'Bindery & Finishing' },
  { id: 'packaging', name: 'Packaging' },
  { id: 'material-handling', name: 'Material Handling' },
  { id: 'prepress', name: 'Prepress' },
  { id: 'parts-supplies', name: 'Parts & Supplies' },
];

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
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      // Create preview URLs
      const newImages = Array.from(files).map(file => URL.createObjectURL(file));
      setUploadedImages(prev => [...prev, ...newImages]);
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
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

  const handleSubmit = () => {
    // TODO: Submit to API
    console.log('Submitting listing:', formData);
    alert('Listing created! (This would submit to the API)');
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
              </div>
            </div>

            {/* Uploaded images grid */}
            {uploadedImages.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Uploaded Photos ({uploadedImages.length})
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {uploadedImages.map((img, index) => (
                    <div key={index} className="relative group aspect-square">
                      <img
                        src={img}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      {index === 0 && (
                        <span className="absolute bottom-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                          Primary
                        </span>
                      )}
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Make / Model / Year */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Make / Manufacturer *
                  </label>
                  <input
                    type="text"
                    value={formData.make}
                    onChange={(e) => updateFormData('make', e.target.value)}
                    placeholder="e.g., Pitney Bowes"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Model *
                  </label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => updateFormData('model', e.target.value)}
                    placeholder="e.g., DI950"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                Review your listing details before publishing.
              </p>
            </div>

            {/* Summary Card */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* Images preview */}
              <div className="aspect-video bg-gray-100 flex items-center justify-center">
                {uploadedImages.length > 0 ? (
                  <img
                    src={uploadedImages[0]}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Camera className="h-12 w-12 text-gray-300" />
                )}
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <span className="text-sm text-blue-600 font-medium">
                    {categories.find(c => c.id === formData.category)?.name || 'Category'}
                  </span>
                  <h3 className="text-xl font-bold text-gray-900 mt-1">
                    {formData.title || 'Listing Title'}
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
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
                    <p className="text-gray-500">Condition</p>
                    <p className="font-medium capitalize">{formData.condition || '—'}</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <p className="text-gray-500 text-sm">Listing Type</p>
                  <p className="font-medium capitalize">
                    {listingTypes.find(t => t.id === formData.listingType)?.label}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {formData.startingPrice && (
                    <div>
                      <p className="text-gray-500 text-sm">Starting Price</p>
                      <p className="text-xl font-bold text-green-600">
                        ${parseInt(formData.startingPrice).toLocaleString()}
                      </p>
                    </div>
                  )}
                  {formData.buyNowPrice && (
                    <div>
                      <p className="text-gray-500 text-sm">
                        {formData.listingType.includes('fixed') ? 'Price' : 'Buy Now'}
                      </p>
                      <p className="text-xl font-bold text-green-600">
                        ${parseInt(formData.buyNowPrice).toLocaleString()}
                      </p>
                    </div>
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
              className="flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700"
            >
              <CheckCircle className="h-5 w-5" />
              Publish Listing
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
