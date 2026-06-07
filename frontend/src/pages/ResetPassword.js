import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { FaLock, FaEye, FaEyeSlash, FaCheck } from 'react-icons/fa';
import AuthShell from '../components/auth/AuthShell';
import { API_URL } from '../config/api';

// Must match the backend password policy
const PASSWORD_RULES = [
  { key: 'length', label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { key: 'upper', label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { key: 'lower', label: 'One lowercase letter', test: (p) => /[a-z]/.test(p) },
  { key: 'number', label: 'One number', test: (p) => /[0-9]/.test(p) },
  { key: 'special', label: 'One special character', test: (p) => /[^A-Za-z0-9]/.test(p) }
];

const evaluate = (pw) => {
  const rules = PASSWORD_RULES.map((r) => ({ ...r, ok: r.test(pw) }));
  return { rules, allValid: rules.every((r) => r.ok) };
};

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const strength = useMemo(() => evaluate(password), [password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!strength.allValid) return toast.error('Please meet all password requirements');
    if (password !== confirm) return toast.error('Passwords do not match');

    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/auth/reset-password/${token}`, { password });
      setDone(true);
      toast.success('Password reset successful');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Reset link is invalid or expired');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <AuthShell headline="Password updated" subline="You can now sign in with your new password.">
        <div data-testid="reset-success">
          <h2 className="text-2xl sm:text-3xl font-bold text-black">All set 🎉</h2>
          <p className="mt-3 text-gray-600 text-sm">Your password has been changed successfully.</p>
          <Link to="/login" className="auth-yellow-btn mt-6 inline-block text-center">Go to login</Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell headline="Choose a new password" subline="Make it strong — you'll use it to sign in.">
      <div data-testid="reset-password-page">
        <h2 className="text-2xl sm:text-3xl font-bold text-black">Reset password</h2>
        <p className="mt-2 text-gray-600 text-sm">Enter and confirm your new password below.</p>

        <form onSubmit={handleSubmit} className="mt-7 space-y-5" data-testid="reset-password-form">
          <div>
            <label className="block text-sm font-medium text-black mb-1">New password</label>
            <div className="relative">
              <FaLock className="absolute left-0 top-4 text-gray-400" />
              <input
                type={show ? 'text' : 'password'}
                placeholder="Create a new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input-beebark pl-7 pr-8"
                data-testid="password-input"
              />
              <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-0 top-4 text-gray-400 hover:text-black" tabIndex={-1} aria-label="Toggle password visibility">
                {show ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {password && (
              <ul className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1">
                {strength.rules.map((r) => (
                  <li key={r.key} className={`flex items-center gap-1.5 text-xs ${r.ok ? 'text-green-600' : 'text-gray-400'}`}>
                    <FaCheck className={`text-[9px] ${r.ok ? 'opacity-100' : 'opacity-30'}`} />
                    {r.label}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-1">Confirm password</label>
            <div className="relative">
              <FaLock className="absolute left-0 top-4 text-gray-400" />
              <input
                type={show ? 'text' : 'password'}
                placeholder="Re-enter your new password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                className="input-beebark pl-7"
                data-testid="confirm-password-input"
              />
            </div>
            {confirm && confirm !== password && <p className="mt-1 text-xs text-red-500">Passwords don't match</p>}
          </div>

          <button type="submit" disabled={loading} className="auth-yellow-btn disabled:opacity-50 disabled:cursor-not-allowed" data-testid="reset-submit-button">
            {loading ? 'Resetting...' : 'Reset password'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          <Link to="/login" className="font-semibold text-black hover:underline">Back to sign in</Link>
        </p>
      </div>
    </AuthShell>
  );
};

export default ResetPassword;
