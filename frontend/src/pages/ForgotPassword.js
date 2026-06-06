import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { FaEnvelope } from 'react-icons/fa';
import AuthShell from '../components/auth/AuthShell';
import { API_URL } from '../config/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/auth/forgot-password`, { email: email.trim() });
      setSent(true);
      toast.success('If an account exists, a reset link has been sent.');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      headline="Reset your password"
      subline="We'll email you a secure link to set a new password."
    >
      <div data-testid="forgot-password-page">
        <h2 className="text-2xl sm:text-3xl font-bold text-black">Forgot password</h2>
        <p className="mt-2 text-gray-600 text-sm">
          {sent ? 'Check your inbox for reset instructions.' : 'Enter your email and we’ll send you a reset link.'}
        </p>

        {!sent ? (
          <form onSubmit={handleSubmit} className="mt-7 space-y-5" data-testid="forgot-password-form">
            <div>
              <label className="block text-sm font-medium text-black mb-1">Email</label>
              <div className="relative">
                <FaEnvelope className="absolute left-0 top-4 text-gray-400" />
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="input-beebark pl-7"
                  data-testid="email-input"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="auth-yellow-btn disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="submit-button"
            >
              {loading ? 'Sending...' : 'Send reset link'}
            </button>
          </form>
        ) : (
          <div className="mt-7 rounded-2xl border-2 border-yellow-200 bg-yellow-50 p-5 text-sm text-gray-700">
            We've sent a password reset link to <strong className="text-black break-all">{email}</strong> if an
            account exists for it. The link expires in 1 hour.
          </div>
        )}

        <p className="mt-6 text-center text-sm text-gray-600">
          <Link to="/login" className="font-semibold text-black hover:underline" data-testid="back-to-login-link">
            Back to sign in
          </Link>
        </p>
      </div>
    </AuthShell>
  );
};

export default ForgotPassword;
