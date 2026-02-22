import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { FaFacebook, FaGithub, FaGoogle, FaEnvelope, FaUser, FaLock } from 'react-icons/fa';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user'
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await register(formData.name, formData.email, formData.password, formData.role);
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" data-testid="register-page">
      {/* Left Side - Illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-cyan-400 to-blue-500 items-center justify-center p-12">
        <div className="text-center">
          <div className="mb-8">
            <svg viewBox="0 0 400 400" className="w-96 h-96">
              <rect x="50" y="50" width="300" height="300" fill="#60A5FA" opacity="0.2" rx="20"/>
              <circle cx="200" cy="150" r="40" fill="#FCD34D"/>
              <rect x="160" y="190" width="80" height="120" fill="#1E40AF" rx="10"/>
              <text x="200" y="340" textAnchor="middle" fontSize="24" fill="white" fontWeight="bold">
                Join BeeBark
              </text>
            </svg>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <div className="mb-10">
            <h1 className="text-4xl font-bold text-black mb-2">BeeBark</h1>
            <h2 className="text-3xl font-semibold text-black mb-4">Sign up</h2>
            <p className="text-gray-600">
              If you already have an account register<br />
              You can{' '}
              <Link to="/login" className="text-red-500 font-semibold hover:underline">
                Login here !
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6" data-testid="register-form">
            <div>
              <label className="block text-sm font-medium text-black mb-2">Email</label>
              <div className="relative">
                <FaEnvelope className="absolute left-0 top-4 text-gray-400" />
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="input-beebark pl-7"
                  data-testid="email-input"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">Username</label>
              <div className="relative">
                <FaUser className="absolute left-0 top-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Enter your User name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="input-beebark pl-7"
                  data-testid="name-input"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">Password</label>
              <div className="relative">
                <FaLock className="absolute left-0 top-4 text-gray-400" />
                <input
                  type="password"
                  placeholder="Enter your Password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="input-beebark pl-7"
                  data-testid="password-input"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">Confirm Password</label>
              <div className="relative">
                <FaLock className="absolute left-0 top-4 text-gray-400" />
                <input
                  type="password"
                  placeholder="Confirm your Password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  className="input-beebark pl-7"
                  data-testid="confirm-password-input"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="auth-yellow-btn"
              data-testid="register-submit-button"
            >
              {loading ? 'Creating Account...' : 'Register'}
            </button>
          </form>

          <div className="mt-8">
            <p className="text-center text-gray-500 mb-4">or continue with</p>
            <div className="flex justify-center space-x-4">
              <button className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center hover:bg-blue-700 transition">
                <FaFacebook className="text-white text-xl" />
              </button>
              <button className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-900 transition">
                <FaGithub className="text-white text-xl" />
              </button>
              <button className="w-12 h-12 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center hover:bg-gray-50 transition">
                <FaGoogle className="text-red-500 text-xl" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;