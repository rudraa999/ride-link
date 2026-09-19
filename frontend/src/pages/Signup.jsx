import React, { useState, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff, GraduationCap, MapPin, Phone, User } from 'lucide-react';
import { authAPI, collegeAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Signup({ onNavigateToLogin }) {
  const { login } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [collegeList, setCollegeList] = useState([]);
  const [college, setCollege] = useState('MIT-WPU');
  const [activeCampus, setActiveCampus] = useState('MIT-WPU Pune (Kothrud)');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    collegeAPI.getAll().then((res) => {
      if (res.data && res.data.length > 0) {
        setCollegeList(res.data);
      }
    }).catch(err => console.log('Colleges fetch err:', err));
  }, []);

  const handleCollegeChange = (e) => {
    const selected = e.target.value;
    setCollege(selected);
    setActiveCampus(`${selected} (Pune)`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!phone || phone.replace(/\D/g, '').length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);

    try {
      const res = await authAPI.register({
        fullName,
        email,
        password,
        college,
        activeCampus,
        phone: phone.replace(/\D/g, ''),
      });
      login(res.data);
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.message || 'Registration failed. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-100">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 border border-slate-100 min-h-[640px]">
        {/* Left Visual Column matching signup.png */}
        <div className="relative hidden md:flex flex-col justify-between p-10 bg-gradient-to-b from-sky-400 via-blue-600 to-slate-900 text-white overflow-hidden">
          {/* Background Image: Classical college building with green lawn */}
          <div
            className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-90"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=900&auto=format&fit=crop&q=80')`,
            }}
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-blue-900/40" />

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
              Students today.<br />
              Greener tomorrows.
            </p>
          </div>

          {/* Bottom Tagline */}
          <div className="relative z-10 text-sm font-medium text-slate-200/95 italic leading-relaxed">
            Same Campus.<br />
            Same Routes.<br />
            Stronger Together.
          </div>
        </div>

        {/* Right Form Column matching signup.png */}
        <div className="p-8 sm:p-10 flex flex-col justify-center overflow-y-auto">
          <div className="max-w-sm w-full mx-auto">
            <h2 className="text-3xl font-extrabold text-[#0f172a] tracking-tight mb-1">Create Your Account</h2>
            <p className="text-sm font-medium text-slate-500 mb-6">Join RideLink and start connecting</p>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Rudra Italiya"
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 text-sm font-medium focus:ring-2 focus:ring-blue-600 outline-none"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1">Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@college.edu"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 text-sm font-medium focus:ring-2 focus:ring-blue-600 outline-none"
                    required
                  />
                </div>
              </div>

              {/* Mobile Number */}
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1">Mobile Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="Enter 10-digit mobile number"
                    maxLength={10}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 text-sm font-medium focus:ring-2 focus:ring-blue-600 outline-none"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 text-sm font-medium focus:ring-2 focus:ring-blue-600 outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-800"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* College Dropdown */}
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1">College</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <select
                    value={college}
                    onChange={handleCollegeChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 text-sm font-medium focus:ring-2 focus:ring-blue-600 outline-none appearance-none cursor-pointer"
                  >
                    <option value="MIT-WPU">MIT-WPU</option>
                    <option value="Dr. Vishwanath Karad MIT World Peace University">Dr. Vishwanath Karad MIT World Peace University</option>
                    <option value="COEP Technological University">COEP Technological University</option>
                    <option value="Pune Institute of Computer Technology">Pune Institute of Computer Technology</option>
                    <option value="Vishwakarma Institute of Technology">Vishwakarma Institute of Technology</option>
                    <option value="Symbiosis International University">Symbiosis International University</option>
                    <option value="Bharati Vidyapeeth Deemed University">Bharati Vidyapeeth Deemed University</option>
                    {collegeList.map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Default Campus Dropdown */}
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1">Default Campus</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <select
                    value={activeCampus}
                    onChange={(e) => setActiveCampus(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 text-sm font-medium focus:ring-2 focus:ring-blue-600 outline-none appearance-none cursor-pointer"
                  >
                    <option value="MIT-WPU Pune (Kothrud)">MIT-WPU Pune (Kothrud)</option>
                    <option value="COEP Shivajinagar Campus">COEP Shivajinagar Campus</option>
                    <option value="PICT Dhankawadi Campus">PICT Dhankawadi Campus</option>
                    <option value="VIT Bibwewadi Campus">VIT Bibwewadi Campus</option>
                    <option value="Symbiosis Viman Nagar Campus">Symbiosis Viman Nagar Campus</option>
                    <option value="Bharati Vidyapeeth Katraj Campus">Bharati Vidyapeeth Katraj Campus</option>
                  </select>
                </div>
              </div>

              {/* Register Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-[#2563eb] hover:bg-blue-700 active:scale-[0.99] text-white font-bold rounded-xl text-base shadow-lg shadow-blue-500/25 transition-all cursor-pointer disabled:opacity-50 mt-2"
              >
                {loading ? 'Creating Account...' : 'Register'}
              </button>

              {/* Already have an account? Login */}
              <div className="text-center pt-2 text-sm text-slate-600 font-medium">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={onNavigateToLogin}
                  className="font-bold text-[#2563eb] hover:underline cursor-pointer ml-1"
                >
                  Login
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
