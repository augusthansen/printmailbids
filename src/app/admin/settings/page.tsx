'use client';

import { useState, useEffect } from 'react';
import { Settings, Save, Percent, Clock, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

interface PlatformSettings {
  id: string;
  default_buyer_premium_percent: number;
  default_seller_commission_percent: number;
  auction_extension_minutes: number;
  offer_expiry_hours: number;
  updated_at: string;
}

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [settings, setSettings] = useState<PlatformSettings | null>(null);

  // Form state
  const [buyerPremium, setBuyerPremium] = useState('8.0');
  const [sellerCommission, setSellerCommission] = useState('8.0');
  const [auctionExtension, setAuctionExtension] = useState('2');
  const [offerExpiry, setOfferExpiry] = useState('48');

  // Track if there are unsaved changes
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (settings) {
      const changed =
        parseFloat(buyerPremium) !== settings.default_buyer_premium_percent ||
        parseFloat(sellerCommission) !== settings.default_seller_commission_percent ||
        parseInt(auctionExtension) !== settings.auction_extension_minutes ||
        parseInt(offerExpiry) !== settings.offer_expiry_hours;
      setHasChanges(changed);
    }
  }, [buyerPremium, sellerCommission, auctionExtension, offerExpiry, settings]);

  async function fetchSettings() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/settings');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch settings');
      }

      const s = data.settings;
      setSettings(s);
      setBuyerPremium(s.default_buyer_premium_percent.toString());
      setSellerCommission(s.default_seller_commission_percent.toString());
      setAuctionExtension(s.auction_extension_minutes.toString());
      setOfferExpiry(s.offer_expiry_hours.toString());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          default_buyer_premium_percent: parseFloat(buyerPremium),
          default_seller_commission_percent: parseFloat(sellerCommission),
          auction_extension_minutes: parseInt(auctionExtension),
          offer_expiry_hours: parseInt(offerExpiry),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save settings');
      }

      setSettings(data.settings);
      setSuccess(true);
      setHasChanges(false);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 text-slate-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Platform Settings</h1>
        <p className="text-slate-400 mt-1">Configure global platform settings and commission rates</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-900/20 border border-red-700 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-400">Error</p>
            <p className="text-sm text-red-400/70 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-green-900/20 border border-green-700 rounded-xl p-4 flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-green-400">Settings saved successfully</p>
            <p className="text-sm text-green-400/70 mt-1">
              Commission rates have been updated. New transactions will use these rates.
            </p>
          </div>
        </div>
      )}

      {/* Fee Settings */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Percent className="h-5 w-5 text-green-400" />
            Commission Settings
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Default rates applied to all sellers. You can set custom rates for specific sellers in User Management.
          </p>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Default Buyer Premium (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={buyerPremium}
                  onChange={(e) => setBuyerPremium(e.target.value)}
                  className="w-full px-4 py-2 pr-10 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Added to the sale price and paid by the buyer
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Default Seller Commission (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={sellerCommission}
                  onChange={(e) => setSellerCommission(e.target.value)}
                  className="w-full px-4 py-2 pr-10 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Deducted from the sale price before paying the seller
              </p>
            </div>
          </div>

          <div className="bg-slate-700/50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-slate-300 mb-2">Example Calculation</h3>
            <div className="text-xs text-slate-400 space-y-1">
              <p>Sale Price: $10,000</p>
              <p>Buyer Premium ({buyerPremium}%): +${(10000 * parseFloat(buyerPremium || '0') / 100).toLocaleString()}</p>
              <p>Buyer Pays: ${(10000 + 10000 * parseFloat(buyerPremium || '0') / 100).toLocaleString()}</p>
              <p className="border-t border-slate-600 pt-1 mt-1">
                Seller Commission ({sellerCommission}%): -${(10000 * parseFloat(sellerCommission || '0') / 100).toLocaleString()}
              </p>
              <p>Seller Receives: ${(10000 - 10000 * parseFloat(sellerCommission || '0') / 100).toLocaleString()}</p>
              <p className="border-t border-slate-600 pt-1 mt-1 text-green-400 font-medium">
                Platform Earnings: ${((10000 * parseFloat(buyerPremium || '0') / 100) + (10000 * parseFloat(sellerCommission || '0') / 100)).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Auction Settings */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-400" />
            Auction Settings
          </h2>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Auction Extension (minutes)
              </label>
              <input
                type="number"
                min="0"
                value={auctionExtension}
                onChange={(e) => setAuctionExtension(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <p className="text-xs text-slate-500 mt-1">
                Time added when a bid is placed in the final minutes
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Offer Expiry (hours)
              </label>
              <input
                type="number"
                min="1"
                value={offerExpiry}
                onChange={(e) => setOfferExpiry(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <p className="text-xs text-slate-500 mt-1">
                Hours before an offer or counter-offer expires
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Last Updated Info */}
      {settings && (
        <div className="text-sm text-slate-500">
          Last updated: {new Date(settings.updated_at).toLocaleString()}
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end gap-4">
        {hasChanges && (
          <button
            onClick={fetchSettings}
            className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
          >
            Discard Changes
          </button>
        )}
        <button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Settings
            </>
          )}
        </button>
      </div>
    </div>
  );
}
