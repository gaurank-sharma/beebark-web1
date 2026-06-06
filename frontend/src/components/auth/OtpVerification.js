import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';

const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

/**
 * Email OTP verification step.
 * @param {string} email        Email the code was sent to
 * @param {(data) => void} onVerified  Called with the auth payload on success
 * @param {() => void} [onBack]  Optional "use a different email" handler
 */
const OtpVerification = ({ email, onVerified, onBack }) => {
  const { verifyOtp, resendOtp } = useAuth();
  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_SECONDS);
  const inputsRef = useRef([]);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const code = digits.join('');

  const submit = async (value) => {
    const otp = value ?? code;
    if (otp.length !== OTP_LENGTH) {
      toast.error('Enter the 6-digit code');
      return;
    }
    setLoading(true);
    try {
      const data = await verifyOtp(email, otp);
      toast.success('Email verified!');
      onVerified?.(data);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Verification failed');
      setDigits(Array(OTP_LENGTH).fill(''));
      inputsRef.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (index, val) => {
    const char = val.replace(/\D/g, '').slice(-1);
    if (!char && val !== '') return;
    const next = [...digits];
    next[index] = char;
    setDigits(next);
    if (char && index < OTP_LENGTH - 1) inputsRef.current[index + 1]?.focus();
    if (char && index === OTP_LENGTH - 1 && next.every((d) => d)) submit(next.join(''));
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = Array(OTP_LENGTH).fill('');
    pasted.split('').forEach((c, i) => { next[i] = c; });
    setDigits(next);
    const last = Math.min(pasted.length, OTP_LENGTH - 1);
    inputsRef.current[last]?.focus();
    if (pasted.length === OTP_LENGTH) submit(pasted);
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    try {
      await resendOtp(email);
      toast.success('A new code has been sent');
      setCooldown(RESEND_SECONDS);
    } catch (error) {
      const retry = error.response?.data?.retryAfter;
      if (retry) setCooldown(retry);
      toast.error(error.response?.data?.error || 'Could not resend code');
    }
  };

  return (
    <div data-testid="otp-step">
      <h2 className="text-2xl sm:text-3xl font-bold text-black">Verify your email</h2>
      <p className="mt-2 text-gray-600 text-sm">
        We sent a 6-digit code to <span className="font-semibold text-black break-all">{email}</span>.
        Enter it below to activate your account.
      </p>

      <div className="mt-8 flex justify-between gap-2 sm:gap-3" onPaste={handlePaste}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => (inputsRef.current[i] = el)}
            type="text"
            inputMode="numeric"
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
            maxLength={1}
            value={d}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className="otp-box"
            data-testid={`otp-input-${i}`}
            aria-label={`Digit ${i + 1}`}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={() => submit()}
        disabled={loading || code.length !== OTP_LENGTH}
        className="auth-yellow-btn mt-8 disabled:opacity-50 disabled:cursor-not-allowed"
        data-testid="otp-verify-button"
      >
        {loading ? 'Verifying...' : 'Verify & Continue'}
      </button>

      <div className="mt-6 text-center text-sm text-gray-600">
        Didn't get the code?{' '}
        <button
          type="button"
          onClick={handleResend}
          disabled={cooldown > 0}
          className="font-semibold text-black hover:underline disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed"
        >
          {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
        </button>
      </div>

      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="mt-4 w-full text-center text-sm text-gray-500 hover:text-black"
        >
          ← Use a different email
        </button>
      )}
    </div>
  );
};

export default OtpVerification;
