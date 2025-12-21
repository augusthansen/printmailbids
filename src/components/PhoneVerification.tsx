'use client';

import { useState, useEffect, useRef } from 'react';
import { Phone, CheckCircle, Loader2, AlertCircle, X } from 'lucide-react';

interface PhoneVerificationProps {
  userId: string;
  currentPhone?: string;
  isVerified?: boolean;
  onVerified?: (phone: string) => void;
  onClose?: () => void;
  showAsModal?: boolean;
}

type Step = 'phone' | 'code' | 'success';

export default function PhoneVerification({
  userId,
  currentPhone = '',
  isVerified = false,
  onVerified,
  onClose,
  showAsModal = false,
}: PhoneVerificationProps) {
  const [step, setStep] = useState<Step>(isVerified ? 'success' : 'phone');
  const [phone, setPhone] = useState(currentPhone);
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [canResend, setCanResend] = useState(false);

  const codeInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for code expiry
  useEffect(() => {
    if (!expiresAt) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
      setTimeLeft(remaining);

      if (remaining <= 0) {
        setCanResend(true);
        clearInterval(interval);
      }
    }, 1000);

    // Allow resend after 30 seconds
    const resendTimer = setTimeout(() => {
      setCanResend(true);
    }, 30000);

    return () => {
      clearInterval(interval);
      clearTimeout(resendTimer);
    };
  }, [expiresAt]);

  // Format phone number as user types
  const formatPhoneInput = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    let formatted = '';

    if (cleaned.length > 0) {
      formatted = '(' + cleaned.substring(0, 3);
    }
    if (cleaned.length >= 3) {
      formatted += ') ' + cleaned.substring(3, 6);
    }
    if (cleaned.length >= 6) {
      formatted += '-' + cleaned.substring(6, 10);
    }

    return formatted;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneInput(e.target.value);
    setPhone(formatted);
    setError('');
  };

  const sendVerificationCode = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/verification/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to send verification code');
        return;
      }

      setExpiresAt(new Date(data.expiresAt));
      setCanResend(false);
      setStep('code');
      setCode(['', '', '', '', '', '']);

      // Focus first code input
      setTimeout(() => {
        codeInputRefs.current[0]?.focus();
      }, 100);
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeInput = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const digits = value.replace(/\D/g, '').split('').slice(0, 6);
      const newCode = [...code];
      digits.forEach((digit, i) => {
        if (index + i < 6) {
          newCode[index + i] = digit;
        }
      });
      setCode(newCode);

      // Focus the next empty input or last input
      const nextIndex = Math.min(index + digits.length, 5);
      codeInputRefs.current[nextIndex]?.focus();

      // Auto-submit if all filled
      if (newCode.every(d => d !== '')) {
        verifyCode(newCode.join(''));
      }
      return;
    }

    const newCode = [...code];
    newCode[index] = value.replace(/\D/g, '');
    setCode(newCode);
    setError('');

    // Auto-advance to next input
    if (value && index < 5) {
      codeInputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when complete
    if (value && index === 5 && newCode.every(d => d !== '')) {
      verifyCode(newCode.join(''));
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  const verifyCode = async (codeString?: string) => {
    const verificationCode = codeString || code.join('');

    if (verificationCode.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/verification/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: verificationCode, userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Invalid verification code');
        return;
      }

      setStep('success');
      onVerified?.(data.phone);
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatTimeLeft = () => {
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const content = (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Phone className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {step === 'success' ? 'Phone Verified' : 'Verify Your Phone'}
            </h3>
            <p className="text-sm text-gray-500">
              {step === 'success'
                ? 'Your phone number has been verified'
                : 'Required to place bids and make offers'}
            </p>
          </div>
        </div>
        {showAsModal && onClose && (
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Step: Phone Number Input */}
      {step === 'phone' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={handlePhoneChange}
              placeholder="(555) 123-4567"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              disabled={loading}
            />
            <p className="mt-1 text-xs text-gray-500">
              US phone numbers only. Standard SMS rates may apply.
            </p>
          </div>

          <button
            onClick={sendVerificationCode}
            disabled={loading || phone.replace(/\D/g, '').length < 10}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Sending...
              </>
            ) : (
              'Send Verification Code'
            )}
          </button>
        </div>
      )}

      {/* Step: Code Verification */}
      {step === 'code' && (
        <div className="space-y-6">
          <div className="text-center">
            <p className="text-gray-600">
              Enter the 6-digit code sent to your phone
            </p>
            {timeLeft > 0 && (
              <p className="text-sm text-gray-500 mt-1">
                Code expires in {formatTimeLeft()}
              </p>
            )}
          </div>

          {/* Code Input */}
          <div className="flex justify-center gap-2">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { codeInputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={digit}
                onChange={(e) => handleCodeInput(index, e.target.value)}
                onKeyDown={(e) => handleCodeKeyDown(index, e)}
                className="w-12 h-14 text-center text-2xl font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
            ))}
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => verifyCode()}
              disabled={loading || code.some(d => !d)}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify Code'
              )}
            </button>

            <div className="flex items-center justify-between text-sm">
              <button
                onClick={() => {
                  setStep('phone');
                  setCode(['', '', '', '', '', '']);
                  setError('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                Change number
              </button>

              <button
                onClick={sendVerificationCode}
                disabled={!canResend || loading}
                className="text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                {canResend ? 'Resend code' : 'Resend in 30s'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step: Success */}
      {step === 'success' && (
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <div>
            <p className="text-lg font-medium text-gray-900">
              Phone Verified!
            </p>
            <p className="text-gray-500 mt-1">
              You can now place bids and make offers on listings.
            </p>
          </div>
          {showAsModal && onClose && (
            <button
              onClick={onClose}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              Continue
            </button>
          )}
        </div>
      )}
    </div>
  );

  if (showAsModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {content}
    </div>
  );
}
