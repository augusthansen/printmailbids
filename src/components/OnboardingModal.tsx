'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { X, Upload, User, Building2, Phone, Check, ArrowRight, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface OnboardingModalProps {
  userId: string;
  userEmail?: string;
  onComplete: () => void;
  onSkip: () => void;
}

type Step = 'welcome' | 'profile' | 'phone' | 'complete';

export default function OnboardingModal({ userId, userEmail, onComplete, onSkip }: OnboardingModalProps) {
  const [step, setStep] = useState<Step>('welcome');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile fields
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Phone verification
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  const supabase = createClient();

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarUploading(true);
    try {
      const filename = `${userId}/avatar-${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filename, file, {
          contentType: file.type,
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filename);

      setAvatarUrl(urlData.publicUrl);
    } catch (error) {
      console.error('Error uploading avatar:', error);
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      alert('Please enter your name to continue.');
      return;
    }

    setIsLoading(true);
    try {
      const updateData: Record<string, unknown> = {
        full_name: fullName.trim(),
        updated_at: new Date().toISOString(),
      };

      if (companyName.trim()) {
        updateData.company_name = companyName.trim();
      }

      if (avatarUrl) {
        updateData.avatar_url = avatarUrl;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId);

      if (error) throw error;

      setStep('phone');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) {
      return digits;
    } else if (digits.length <= 6) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    } else {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    }
  };

  const sendVerificationCode = async () => {
    const digits = phoneNumber.replace(/\D/g, '');
    if (digits.length !== 10) {
      setPhoneError('Please enter a valid 10-digit phone number.');
      return;
    }

    setSendingCode(true);
    setPhoneError('');

    try {
      const formattedPhone = `+1${digits}`;

      const response = await fetch('/api/verification/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formattedPhone }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send code');
      }

      setCodeSent(true);
    } catch (error: any) {
      setPhoneError(error.message || 'Failed to send verification code.');
    } finally {
      setSendingCode(false);
    }
  };

  const verifyCode = async () => {
    if (verificationCode.length !== 6) {
      setPhoneError('Please enter the 6-digit code.');
      return;
    }

    setVerifying(true);
    setPhoneError('');

    try {
      const digits = phoneNumber.replace(/\D/g, '');
      const formattedPhone = `+1${digits}`;

      const response = await fetch('/api/verification/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: formattedPhone,
          code: verificationCode,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Invalid code');
      }

      setStep('complete');
    } catch (error: any) {
      setPhoneError(error.message || 'Failed to verify code.');
    } finally {
      setVerifying(false);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      await supabase
        .from('profiles')
        .update({ onboarding_completed: true, onboarding_skipped: false })
        .eq('id', userId);

      onComplete();
    } catch (error) {
      console.error('Error completing onboarding:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    setIsLoading(true);
    try {
      await supabase
        .from('profiles')
        .update({ onboarding_skipped: true })
        .eq('id', userId);

      onSkip();
    } catch (error) {
      console.error('Error skipping onboarding:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderWelcomeStep = () => (
    <div className="text-center">
      <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <User className="w-10 h-10 text-blue-600" />
      </div>

      <h2 className="text-2xl font-bold text-slate-900 mb-3">
        Welcome to PrintMailBids!
      </h2>

      <p className="text-slate-600 mb-8 max-w-sm mx-auto">
        Let's set up your profile so sellers and buyers know who they're working with.
      </p>

      <div className="space-y-4 mb-8">
        <div className="flex items-start gap-4 text-left p-4 bg-green-50 rounded-xl">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Check className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="font-medium text-slate-900">Build Trust</p>
            <p className="text-sm text-slate-600">Complete profiles get more responses</p>
          </div>
        </div>

        <div className="flex items-start gap-4 text-left p-4 bg-blue-50 rounded-xl">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Phone className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-slate-900">Stay Informed</p>
            <p className="text-sm text-slate-600">Get SMS alerts for bids and offers</p>
          </div>
        </div>
      </div>

      <button
        onClick={() => setStep('profile')}
        className="w-full bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
      >
        Get Started
        <ArrowRight className="w-5 h-5" />
      </button>

      <button
        onClick={handleSkip}
        disabled={isLoading}
        className="mt-4 text-slate-500 hover:text-slate-700 text-sm font-medium"
      >
        Skip for now
      </button>
    </div>
  );

  const renderProfileStep = () => (
    <div>
      <h2 className="text-xl font-bold text-slate-900 mb-1 text-center">
        Your Profile
      </h2>
      <p className="text-slate-500 text-sm mb-6 text-center">
        Tell us a bit about yourself
      </p>

      {/* Avatar */}
      <div className="flex justify-center mb-6">
        <div className="relative">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-dashed border-slate-300 hover:border-blue-400 transition-colors"
          >
            {avatarUrl ? (
              <Image src={avatarUrl} alt="Avatar" fill className="object-cover" />
            ) : (
              <Upload className="w-8 h-8 text-slate-400" />
            )}
            {avatarUploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              </div>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarUpload}
            className="hidden"
          />
        </div>
      </div>
      <p className="text-center text-xs text-slate-400 mb-6">Click to upload a photo</p>

      {/* Name */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Full Name <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Enter your full name"
            className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Company */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Company Name <span className="text-slate-400">(optional)</span>
        </label>
        <div className="relative">
          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Enter your company name"
            className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <button
        onClick={handleSaveProfile}
        disabled={isLoading || !fullName.trim()}
        className="w-full bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            Continue
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>
    </div>
  );

  const renderPhoneStep = () => (
    <div>
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Phone className="w-8 h-8 text-green-600" />
      </div>

      <h2 className="text-xl font-bold text-slate-900 mb-1 text-center">
        Verify Your Phone
      </h2>
      <p className="text-slate-500 text-sm mb-6 text-center">
        Get instant SMS notifications for bids, offers, and important updates
      </p>

      {!codeSent ? (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Phone Number
            </label>
            <div className="flex">
              <span className="inline-flex items-center px-4 bg-slate-100 border border-r-0 border-slate-300 rounded-l-xl text-slate-600 font-medium">
                +1
              </span>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
                placeholder="(555) 555-5555"
                maxLength={14}
                className="flex-1 px-4 py-3 border border-slate-300 rounded-r-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {phoneError && (
              <p className="mt-1 text-sm text-red-600">{phoneError}</p>
            )}
          </div>

          <button
            onClick={sendVerificationCode}
            disabled={sendingCode}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {sendingCode ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Send Verification Code'
            )}
          </button>
        </>
      ) : (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Enter 6-digit code
            </label>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl font-bold tracking-widest"
            />
            {phoneError && (
              <p className="mt-1 text-sm text-red-600">{phoneError}</p>
            )}
          </div>

          <button
            onClick={verifyCode}
            disabled={verifying}
            className="w-full bg-green-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {verifying ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Check className="w-5 h-5" />
                Verify Phone
              </>
            )}
          </button>

          <button
            onClick={() => {
              setCodeSent(false);
              setVerificationCode('');
              setPhoneError('');
            }}
            className="w-full mt-3 text-blue-600 text-sm font-medium hover:text-blue-700"
          >
            Change phone number
          </button>
        </>
      )}

      <button
        onClick={() => setStep('complete')}
        className="mt-4 w-full text-slate-500 hover:text-slate-700 text-sm font-medium py-2"
      >
        Skip for now
      </button>
    </div>
  );

  const renderCompleteStep = () => (
    <div className="text-center">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <Check className="w-10 h-10 text-green-600" />
      </div>

      <h2 className="text-2xl font-bold text-slate-900 mb-3">
        You're All Set!
      </h2>

      <p className="text-slate-600 mb-8 max-w-sm mx-auto">
        Your profile is ready. Start browsing equipment or list your own items for sale.
      </p>

      <div className="bg-slate-50 rounded-xl p-4 mb-8 text-left space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-slate-600">Name</span>
          <span className="font-medium text-slate-900">{fullName || 'Not set'}</span>
        </div>
        {companyName && (
          <div className="flex items-center justify-between">
            <span className="text-slate-600">Company</span>
            <span className="font-medium text-slate-900">{companyName}</span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-slate-600">Phone</span>
          <span className={`font-medium ${codeSent && verificationCode.length === 6 ? 'text-green-600' : 'text-slate-400'}`}>
            {codeSent && verificationCode.length === 6 ? 'Verified' : 'Not verified'}
          </span>
        </div>
      </div>

      <button
        onClick={handleComplete}
        disabled={isLoading}
        className="w-full bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            Start Browsing
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>
    </div>
  );

  const renderStep = () => {
    switch (step) {
      case 'welcome':
        return renderWelcomeStep();
      case 'profile':
        return renderProfileStep();
      case 'phone':
        return renderPhoneStep();
      case 'complete':
        return renderCompleteStep();
    }
  };

  const getProgress = () => {
    switch (step) {
      case 'welcome': return 0;
      case 'profile': return 33;
      case 'phone': return 66;
      case 'complete': return 100;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-slate-200">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${getProgress()}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-6">
          {renderStep()}
        </div>
      </div>
    </div>
  );
}
