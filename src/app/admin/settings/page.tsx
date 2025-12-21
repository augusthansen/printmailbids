'use client';

import { useState } from 'react';
import { Settings, Save, Percent, DollarSign, Clock, AlertTriangle } from 'lucide-react';

export default function AdminSettingsPage() {
  const [buyerPremium, setBuyerPremium] = useState('5.0');
  const [sellerCommission, setSellerCommission] = useState('8.0');
  const [auctionExtension, setAuctionExtension] = useState('2');
  const [offerExpiry, setOfferExpiry] = useState('48');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    // TODO: Implement settings save to database
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
    alert('Settings would be saved (not yet implemented - settings are currently hardcoded)');
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 mt-1">Configure platform settings</p>
      </div>

      {/* Warning */}
      <div className="bg-yellow-900/20 border border-yellow-700 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-yellow-400">Settings Not Yet Implemented</p>
          <p className="text-sm text-yellow-400/70 mt-1">
            These settings are currently hardcoded in the application. Changing values here will not affect the platform until a settings system is implemented.
          </p>
        </div>
      </div>

      {/* Fee Settings */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Percent className="h-5 w-5 text-green-400" />
            Fee Settings
          </h2>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Buyer Premium (%)
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
                Seller Commission (%)
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

      {/* Current Hardcoded Values */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">Current Hardcoded Values</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="bg-slate-700/50 rounded-lg p-3">
              <p className="text-slate-400">Buyer Premium</p>
              <p className="text-white font-bold">5%</p>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-3">
              <p className="text-slate-400">Seller Commission</p>
              <p className="text-white font-bold">8%</p>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-3">
              <p className="text-slate-400">Auction Extension</p>
              <p className="text-white font-bold">2 min</p>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-3">
              <p className="text-slate-400">Offer Expiry</p>
              <p className="text-white font-bold">48 hrs</p>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
