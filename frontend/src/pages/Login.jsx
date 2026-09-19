import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Login({ onNavigateToSignup }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await authAPI.login({ email, password });
      login(res.data);
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-100">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 border border-slate-100 min-h-[580px]">
        {/* Left Visual Column matching login.png */}
        <div className="relative hidden md:flex flex-col justify-between p-10 bg-gradient-to-b from-sky-500 via-blue-600 to-slate-900 text-white overflow-hidden">
          {/* Background Image Overlay */}
          <div
            className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-80"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=900&auto=format&fit=crop&q=80')`,
            }}
          />
          {/* Subtle dark gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-blue-900/30" />

          {/* Top Branding */}
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 shadow-lg">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 17l4 4 4-4m-4-5v9m-7-4h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">RideLink</h1>
            <p className="text-xl font-medium text-blue-100 leading-snug">
              Ride together.<br />
              Reach further.
            </p>
          </div>

          {/* Bottom Tagline */}
          <div className="relative z-10 text-sm font-medium text-slate-200/90 leading-relaxed">
            Students. Same routes.<br />
            A smarter tomorrow.
          </div>
        </div>

        {/* Right Form Column matching login.png */}
        <div className="p-8 sm:p-12 flex flex-col justify-center">
          <div className="max-w-sm w-full mx-auto">
            <h2 className="text-3xl font-extrabold text-[#0f172a] tracking-tight mb-2">Welcome Back</h2>
            <p className="text-sm font-medium text-slate-500 mb-8">Login to continue to RideLink</p>

            {error && (
              <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1.5">Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@college.edu"
                    className="w-full pl-11 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-800 text-sm font-medium focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-colors"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1.5">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-11 py-3 bg-white border border-slate-300 rounded-xl text-slate-800 text-sm font-medium focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-colors tracking-wide"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-800"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                <div className="flex justify-end mt-2">
                  <a href="#forgot" onClick={(e) => { e.preventDefault(); alert('Please contact administrator or re-register.'); }} className="text-xs font-semibold text-[#2563eb] hover:underline">
                    Forgot password?
                  </a>
                </div>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-[#2563eb] hover:bg-blue-700 active:scale-[0.99] text-white font-bold rounded-xl text-base shadow-lg shadow-blue-500/25 transition-all cursor-pointer disabled:opacity-50 mt-3"
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>

              {/* Register Link */}
              <div className="text-center pt-3 text-sm text-slate-600 font-medium">
                Don’t have an account?{' '}
                <button
                  type="button"
                  onClick={onNavigateToSignup}
                  className="font-bold text-[#2563eb] hover:underline cursor-pointer ml-1"
                >
                  Register
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
