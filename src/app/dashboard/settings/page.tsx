'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { User, Building2, Mail, Phone, Bell, Shield, CreditCard, MapPin, Truck } from 'lucide-react';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  company_name: string | null;
  phone: string | null;
  bio: string | null;
  is_verified: boolean;
  is_seller: boolean;
  phone_verified: boolean;
  notify_email: boolean;
  notify_push: boolean;
  notify_sms: boolean;
  // Address fields
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
}

interface NotificationPreferences {
  // Bidding notifications
  notify_new_bid: boolean;
  notify_outbid: boolean;
  notify_auction_ending: boolean;
  notify_auction_won: boolean;
  // Offer notifications
  notify_new_offer: boolean;
  notify_offer_response: boolean;
  // Message notifications
  notify_new_message: boolean;
  // Payment notifications
  notify_payment_received: boolean;
  notify_payment_reminder: boolean;
  // Shipping notifications
  notify_item_shipped: boolean;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState('profile');

  const [profile, setProfile] = useState<Profile>({
    id: '',
    email: '',
    full_name: '',
    company_name: '',
    phone: '',
    bio: '',
    is_verified: false,
    is_seller: false,
    phone_verified: false,
    notify_email: true,
    notify_push: true,
    notify_sms: false,
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'US',
  });

  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences>({
    notify_new_bid: true,
    notify_outbid: true,
    notify_auction_ending: true,
    notify_auction_won: true,
    notify_new_offer: true,
    notify_offer_response: true,
    notify_new_message: true,
    notify_payment_received: true,
    notify_payment_reminder: true,
    notify_item_shipped: true,
  });

  useEffect(() => {
    async function loadProfile() {
      if (!user?.id) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data && !error) {
        setProfile(data);
      }
      setLoading(false);
    }

    loadProfile();
  }, [user?.id, supabase]);

  const handleSave = async () => {
    if (!user?.id) return;

    setSaving(true);
    setMessage(null);

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: profile.full_name,
        company_name: profile.company_name,
        phone: profile.phone,
        bio: profile.bio,
        notify_email: profile.notify_email,
        notify_push: profile.notify_push,
        notify_sms: profile.notify_sms,
        address_line1: profile.address_line1,
        address_line2: profile.address_line2,
        city: profile.city,
        state: profile.state,
        postal_code: profile.postal_code,
        country: profile.country,
      })
      .eq('id', user.id);

    if (error) {
      console.error('Save error:', error);
      setMessage({ type: 'error', text: `Failed to save: ${error.message}` });
    } else {
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
    }

    setSaving(false);
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'address', label: 'Address', icon: MapPin },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'billing', label: 'Billing', icon: CreditCard },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account preferences and settings</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-8">
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

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg mb-6 ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Profile Information</h2>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={profile.full_name || ''}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={profile.company_name || ''}
                    onChange={(e) => setProfile({ ...profile, company_name: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Acme Printing Co."
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    value={profile.email || ''}
                    disabled
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Contact support to change your email</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="tel"
                    value={profile.phone || ''}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bio / Company Description
              </label>
              <textarea
                value={profile.bio || ''}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                rows={4}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Tell buyers about yourself or your company..."
              />
            </div>

            {/* Account Status */}
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Account Status</h3>
              <div className="flex flex-wrap gap-3">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm ${
                  profile.is_verified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  <Shield className="h-4 w-4" />
                  {profile.is_verified ? 'Verified' : 'Unverified'}
                </span>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm ${
                  profile.is_seller ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  <Building2 className="h-4 w-4" />
                  {profile.is_seller ? 'Seller Account' : 'Buyer Account'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Address Tab */}
      {activeTab === 'address' && (
        <div className="space-y-6">
          {/* Shipping Address */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <Truck className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Shipping Address</h2>
            </div>
            <p className="text-sm text-gray-500 mb-6">
              This address will be used as the default for shipping purchased equipment.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Street Address
                </label>
                <input
                  type="text"
                  value={profile.address_line1 || ''}
                  onChange={(e) => setProfile({ ...profile, address_line1: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="123 Main Street"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address Line 2 <span className="text-gray-400">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={profile.address_line2 || ''}
                  onChange={(e) => setProfile({ ...profile, address_line2: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Suite 100, Building A"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    value={profile.city || ''}
                    onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Chicago"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State / Province
                  </label>
                  <input
                    type="text"
                    value={profile.state || ''}
                    onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="IL"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ZIP / Postal Code
                  </label>
                  <input
                    type="text"
                    value={profile.postal_code || ''}
                    onChange={(e) => setProfile({ ...profile, postal_code: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="60601"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country
                  </label>
                  <select
                    value={profile.country || 'US'}
                    onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="MX">Mexico</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Billing Address */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Billing Address</h2>
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                defaultChecked
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700">Same as shipping address</span>
            </label>
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          {/* Delivery Methods */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Notification Delivery</h2>
            <p className="text-sm text-gray-500 mb-6">Choose how you want to receive notifications</p>

            <div className="space-y-4">
              <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">Email Notifications</p>
                    <p className="text-sm text-gray-500">Receive updates via email</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={profile.notify_email}
                  onChange={(e) => setProfile({ ...profile, notify_email: e.target.checked })}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">Push Notifications</p>
                    <p className="text-sm text-gray-500">Get real-time alerts in your browser</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={profile.notify_push}
                  onChange={(e) => setProfile({ ...profile, notify_push: e.target.checked })}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
              </label>

              <label className={`flex items-center justify-between p-4 rounded-lg transition-colors ${
                profile.phone && profile.phone_verified
                  ? 'bg-gray-50 cursor-pointer hover:bg-gray-100'
                  : 'bg-gray-100 cursor-not-allowed opacity-60'
              }`}>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">SMS Notifications</p>
                    <p className="text-sm text-gray-500">
                      {profile.phone && profile.phone_verified
                        ? 'Get text messages for important updates'
                        : 'Add and verify your phone number to enable SMS'}
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={profile.notify_sms}
                  onChange={(e) => setProfile({ ...profile, notify_sms: e.target.checked })}
                  disabled={!profile.phone || !profile.phone_verified}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 disabled:opacity-50"
                />
              </label>
            </div>
          </div>

          {/* Buyer Notifications */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Buyer Notifications</h2>
            <p className="text-sm text-gray-500 mb-6">Notifications for when you&apos;re buying equipment</p>

            <div className="space-y-3">
              <label className="flex items-center justify-between py-3 border-b border-gray-100 cursor-pointer">
                <div>
                  <p className="font-medium text-gray-900">Outbid alerts</p>
                  <p className="text-sm text-gray-500">When someone outbids you on an auction</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifPrefs.notify_outbid}
                  onChange={(e) => setNotifPrefs({ ...notifPrefs, notify_outbid: e.target.checked })}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
              </label>

              <label className="flex items-center justify-between py-3 border-b border-gray-100 cursor-pointer">
                <div>
                  <p className="font-medium text-gray-900">Auction ending soon</p>
                  <p className="text-sm text-gray-500">Reminder when auctions you&apos;re watching are ending</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifPrefs.notify_auction_ending}
                  onChange={(e) => setNotifPrefs({ ...notifPrefs, notify_auction_ending: e.target.checked })}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
              </label>

              <label className="flex items-center justify-between py-3 border-b border-gray-100 cursor-pointer">
                <div>
                  <p className="font-medium text-gray-900">Auction won</p>
                  <p className="text-sm text-gray-500">When you win an auction</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifPrefs.notify_auction_won}
                  onChange={(e) => setNotifPrefs({ ...notifPrefs, notify_auction_won: e.target.checked })}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
              </label>

              <label className="flex items-center justify-between py-3 border-b border-gray-100 cursor-pointer">
                <div>
                  <p className="font-medium text-gray-900">Offer responses</p>
                  <p className="text-sm text-gray-500">When a seller responds to your offer</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifPrefs.notify_offer_response}
                  onChange={(e) => setNotifPrefs({ ...notifPrefs, notify_offer_response: e.target.checked })}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
              </label>

              <label className="flex items-center justify-between py-3 cursor-pointer">
                <div>
                  <p className="font-medium text-gray-900">Item shipped</p>
                  <p className="text-sm text-gray-500">When your purchased item ships</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifPrefs.notify_item_shipped}
                  onChange={(e) => setNotifPrefs({ ...notifPrefs, notify_item_shipped: e.target.checked })}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
              </label>
            </div>
          </div>

          {/* Seller Notifications */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Seller Notifications</h2>
            <p className="text-sm text-gray-500 mb-6">Notifications for when you&apos;re selling equipment</p>

            <div className="space-y-3">
              <label className="flex items-center justify-between py-3 border-b border-gray-100 cursor-pointer">
                <div>
                  <p className="font-medium text-gray-900">New bids</p>
                  <p className="text-sm text-gray-500">When someone places a bid on your listing</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifPrefs.notify_new_bid}
                  onChange={(e) => setNotifPrefs({ ...notifPrefs, notify_new_bid: e.target.checked })}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
              </label>

              <label className="flex items-center justify-between py-3 border-b border-gray-100 cursor-pointer">
                <div>
                  <p className="font-medium text-gray-900">New offers</p>
                  <p className="text-sm text-gray-500">When someone makes an offer on your listing</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifPrefs.notify_new_offer}
                  onChange={(e) => setNotifPrefs({ ...notifPrefs, notify_new_offer: e.target.checked })}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
              </label>

              <label className="flex items-center justify-between py-3 border-b border-gray-100 cursor-pointer">
                <div>
                  <p className="font-medium text-gray-900">Payment received</p>
                  <p className="text-sm text-gray-500">When a buyer completes payment</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifPrefs.notify_payment_received}
                  onChange={(e) => setNotifPrefs({ ...notifPrefs, notify_payment_received: e.target.checked })}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
              </label>

              <label className="flex items-center justify-between py-3 cursor-pointer">
                <div>
                  <p className="font-medium text-gray-900">Payment reminders</p>
                  <p className="text-sm text-gray-500">Reminders about pending payments from buyers</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifPrefs.notify_payment_reminder}
                  onChange={(e) => setNotifPrefs({ ...notifPrefs, notify_payment_reminder: e.target.checked })}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
              </label>
            </div>
          </div>

          {/* Messages */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Messages</h2>
            <p className="text-sm text-gray-500 mb-6">Notifications for direct messages</p>

            <label className="flex items-center justify-between py-3 cursor-pointer">
              <div>
                <p className="font-medium text-gray-900">New messages</p>
                <p className="text-sm text-gray-500">When you receive a new message from a buyer or seller</p>
              </div>
              <input
                type="checkbox"
                checked={notifPrefs.notify_new_message}
                onChange={(e) => setNotifPrefs({ ...notifPrefs, notify_new_message: e.target.checked })}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
            </label>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Security Settings</h2>

          <div className="space-y-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Change Password</h3>
              <p className="text-sm text-gray-500 mb-4">Update your password to keep your account secure</p>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Update Password
              </button>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Two-Factor Authentication</h3>
              <p className="text-sm text-gray-500 mb-4">Add an extra layer of security to your account</p>
              <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
                Enable 2FA
              </button>
            </div>

            <div className="p-4 bg-red-50 rounded-lg">
              <h3 className="font-medium text-red-900 mb-2">Delete Account</h3>
              <p className="text-sm text-red-700 mb-4">Permanently delete your account and all associated data</p>
              <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Billing Tab */}
      {activeTab === 'billing' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Billing & Payments</h2>

          <div className="space-y-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Payment Methods</h3>
              <p className="text-sm text-gray-500 mb-4">Manage your payment methods for purchases</p>
              <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
                Add Payment Method
              </button>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Payout Settings</h3>
              <p className="text-sm text-gray-500 mb-4">Configure how you receive payments from sales</p>
              <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
                Connect Bank Account
              </button>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Transaction History</h3>
              <p className="text-sm text-gray-500 mb-4">View your complete payment history</p>
              <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
                View History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Button */}
      {(activeTab === 'profile' || activeTab === 'address' || activeTab === 'notifications') && (
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      )}
    </div>
  );
}
