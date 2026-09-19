import React, { useState, useEffect, useRef } from 'react';
import { Edit3, ChevronRight, Lock, Bell, Shield, HelpCircle, LogOut, Camera, Check, Loader2, X, Eye, EyeOff, CheckCircle2, KeyRound, Phone, Navigation } from 'lucide-react';
import Header from '../components/Header';
import { profileAPI, collegeAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ProfileSettings({ setActiveTab, onOpenMobileSidebar }) {
  const { user, updateUser, logout } = useAuth();
  const [editingField, setEditingField] = useState(null);
  const [activeCampus, setActiveCampus] = useState(user?.activeCampus || 'MIT-WPU Pune (Kothrud)');
  const [phone, setPhone] = useState(user?.phone || '');
  const [fullName, setFullName] = useState(user?.fullName || 'Rudra Italiya');
  const [campusList, setCampusList] = useState([]);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);

  // Change Password state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Privacy Settings state
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showProfile, setShowProfile] = useState(user?.showProfile !== false);
  const [showPhonePostMatch, setShowPhonePostMatch] = useState(user?.showPhonePostMatch !== false);
  const [showPreciseDistance, setShowPreciseDistance] = useState(user?.showPreciseDistance !== false);
  const [showRideStats, setShowRideStats] = useState(user?.showRideStats !== false);
  const [privacyLoading, setPrivacyLoading] = useState(false);
  const [privacySuccess, setPrivacySuccess] = useState('');

  useEffect(() => {
    if (user?.activeCampus) {
      setActiveCampus(user.activeCampus);
    }
    if (user?.phone) {
      setPhone(user.phone);
    }
    if (user?.fullName) {
      setFullName(user.fullName);
    }
    if (user) {
      setShowProfile(user.showProfile !== false);
      setShowPhonePostMatch(user.showPhonePostMatch !== false);
      setShowPreciseDistance(user.showPreciseDistance !== false);
      setShowRideStats(user.showRideStats !== false);
    }
  }, [user]);

  useEffect(() => {
    collegeAPI.getAll().then((res) => {
      if (res.data && res.data.length > 0) {
        setCampusList(res.data.map((c) => `${c.name} (${c.city || 'Pune'})`));
      }
    }).catch(err => console.log('Load colleges:', err));
  }, []);

  const handleSaveField = async (field) => {
    if (field === 'phone') {
      const cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.length !== 10) {
        alert('Please enter a valid 10-digit mobile number.');
        return;
      }
    }
    try {
      const payload = {
        fullName,
        activeCampus,
        phone: phone.replace(/\D/g, ''),
      };
      const res = await profileAPI.updateProfile(payload);
      updateUser(res.data);
      setEditingField(null);
      setIsEditingProfile(false);
    } catch (err) {
      console.error('Failed to update profile:', err);
      alert('Failed to update profile');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await profileAPI.changePassword({
        currentPassword,
        newPassword,
      });
      setPasswordSuccess(res.data?.message || 'Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordSuccess('');
      }, 1500);
    } catch (err) {
      console.error('Password change error:', err);
      setPasswordError(err.response?.data?.message || 'Failed to change password. Please check your current password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setPasswordSuccess('');
  };

  const handleSavePrivacy = async () => {
    setPrivacyLoading(true);
    setPrivacySuccess('');
    try {
      const res = await profileAPI.updatePrivacy({
        showProfile,
        showPhonePostMatch,
        showPreciseDistance,
        showRideStats,
      });
      updateUser(res.data);
      setPrivacySuccess('Privacy preferences saved successfully!');
      setTimeout(() => {
        setPrivacySuccess('');
        setShowPrivacyModal(false);
      }, 1200);
    } catch (err) {
      console.error('Failed to save privacy settings', err);
      alert('Failed to save privacy settings');
    } finally {
      setPrivacyLoading(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = '';
    setUploadingPhoto(true);
    try {
      const res = await profileAPI.uploadPhoto(file);
      updateUser(res.data);
    } catch (err) {
      console.error('Failed to upload photo:', err);
      alert(err.response?.data?.message || 'Photo upload failed. Please try a smaller image (under 5MB).');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const initial = user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'R';

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#f8fafc] w-full">
      <Header
        setActiveTab={setActiveTab}
        onOpenMobileSidebar={onOpenMobileSidebar}
      />

      <main className="flex-1 px-4 sm:px-8 py-5 sm:py-6 max-w-6xl w-full mx-auto">
        {/* 2-Column Layout matching profile section.png */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Left Card: Profile Information */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 flex flex-col justify-between">
            <div>
              {/* Header Info */}
              <div className="flex items-start justify-between mb-6 sm:mb-8 gap-3">
                <div className="flex items-center gap-4 sm:gap-5 min-w-0">
                  {/* Avatar with upload overlay */}
                  <div className="relative group flex-shrink-0">
                    {user?.profileImageUrl ? (
                      <img
                        src={user.profileImageUrl}
                        alt={user.fullName}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover ring-2 ring-slate-100 shadow-sm"
                      />
                    ) : (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#9381ff] text-white font-bold text-2xl sm:text-3xl flex items-center justify-center shadow-md">
                        {initial}
                      </div>
                    )}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingPhoto}
                      className={`absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white transition-opacity cursor-pointer ${
                        uploadingPhoto ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}
                      title="Upload profile photo"
                    >
                      {uploadingPhoto ? (
                        <Loader2 className="w-6 h-6 animate-spin text-white" />
                      ) : (
                        <Camera className="w-5 h-5 sm:w-6 sm:h-6" />
                      )}
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handlePhotoUpload}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>

                  <div className="min-w-0">
                    {isEditingProfile ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="px-2.5 py-1 border border-slate-300 rounded-lg text-base sm:text-lg font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 w-full"
                        />
                        <button
                          onClick={() => handleSaveField('fullName')}
                          className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-tight truncate">
                        {user?.fullName || 'Rudra Italiya'}
                      </h2>
                    )}
                    <p className="text-xs sm:text-sm font-medium text-slate-500 mt-0.5 sm:mt-1 truncate">{user?.email || 'student@college.edu'}</p>
                  </div>
                </div>

                <button
                  onClick={() => setIsEditingProfile(!isEditingProfile)}
                  className="px-3.5 sm:px-5 py-1.5 sm:py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors flex-shrink-0 cursor-pointer"
                >
                  {isEditingProfile ? 'Cancel' : 'Edit'}
                </button>
              </div>

              {/* Profile Details Rows */}
              <div className="divide-y divide-slate-100 text-xs sm:text-sm">
                {/* College */}
                <div className="py-3.5 sm:py-4 flex items-center justify-between gap-3">
                  <span className="font-bold text-slate-700 flex-shrink-0">College</span>
                  <span className="font-bold text-slate-900 text-right truncate">{user?.college || 'MIT-WPU'}</span>
                </div>

                {/* Active Campus */}
                <div className="py-3.5 sm:py-4 flex items-center justify-between gap-3">
                  <span className="font-bold text-slate-700 flex-shrink-0">Active Campus</span>
                  {editingField === 'campus' ? (
                    <div className="flex items-center gap-2 max-w-[280px] sm:max-w-[340px]">
                      <select
                        value={activeCampus}
                        onChange={(e) => setActiveCampus(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 truncate cursor-pointer"
                      >
                        <option value="MIT-WPU Pune (Kothrud)">MIT-WPU Pune (Kothrud)</option>
                        <option value="COEP Technological University (Shivajinagar)">COEP Technological University (Shivajinagar)</option>
                        <option value="Pune Institute of Computer Technology (Dhankawadi)">Pune Institute of Computer Technology (Dhankawadi)</option>
                        <option value="Vishwakarma Institute of Technology (Bibwewadi)">Vishwakarma Institute of Technology (Bibwewadi)</option>
                        <option value="Symbiosis International University (Viman Nagar)">Symbiosis International University (Viman Nagar)</option>
                        <option value="Bharati Vidyapeeth (Katraj)">Bharati Vidyapeeth (Katraj)</option>
                        {campusList.map((c, idx) => (
                          <option key={idx} value={c}>{c}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleSaveField('campus')}
                        className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex-shrink-0 cursor-pointer shadow-xs"
                        title="Save Campus"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setActiveCampus(user?.activeCampus || 'MIT-WPU Pune (Kothrud)');
                          setEditingField(null);
                        }}
                        className="p-1.5 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200 flex-shrink-0 cursor-pointer"
                        title="Cancel"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-bold text-slate-900 text-right truncate">{user?.activeCampus || 'MIT-WPU Pune (Kothrud)'}</span>
                      <button
                        onClick={() => setEditingField('campus')}
                        className="text-blue-600 hover:text-blue-800 p-1 flex-shrink-0 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Phone */}
                <div className="py-3.5 sm:py-4 flex items-center justify-between gap-3">
                  <span className="font-bold text-slate-700 flex-shrink-0">Phone</span>
                  {editingField === 'phone' ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        maxLength={10}
                        placeholder="10-digit number"
                        className="w-36 px-2.5 py-1 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => handleSaveField('phone')}
                        className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
                        title="Save Phone"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setPhone(user?.phone || '');
                          setEditingField(null);
                        }}
                        className="p-1.5 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200 cursor-pointer"
                        title="Cancel"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{user?.phone || 'Not provided'}</span>
                      <button
                        onClick={() => setEditingField('phone')}
                        className="text-blue-600 hover:text-blue-800 p-1 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Card: Settings matching profile section.png */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 flex flex-col justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight mb-4 sm:mb-6">Settings</h2>

              <div className="divide-y divide-slate-100">
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="w-full py-3.5 sm:py-4 flex items-center justify-between text-left hover:bg-slate-50/60 px-2 rounded-xl transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 text-slate-700 font-semibold text-xs sm:text-sm">
                    <Lock className="w-4 h-4 text-slate-600" />
                    <span>Change Password</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  onClick={() => alert('Notification preferences')}
                  className="w-full py-3.5 sm:py-4 flex items-center justify-between text-left hover:bg-slate-50/60 px-2 rounded-xl transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 text-slate-700 font-semibold text-xs sm:text-sm">
                    <Bell className="w-4 h-4 text-slate-600" />
                    <span>Notifications</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  onClick={() => setShowPrivacyModal(true)}
                  className="w-full py-3.5 sm:py-4 flex items-center justify-between text-left hover:bg-slate-50/60 px-2 rounded-xl transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 text-slate-700 font-semibold text-xs sm:text-sm">
                    <Shield className="w-4 h-4 text-slate-600" />
                    <span>Privacy & Visibility</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  onClick={() => alert('Support team: support@ridelink.app')}
                  className="w-full py-3.5 sm:py-4 flex items-center justify-between text-left hover:bg-slate-50/60 px-2 rounded-xl transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 text-slate-700 font-semibold text-xs sm:text-sm">
                    <HelpCircle className="w-4 h-4 text-slate-600" />
                    <span>Help & Support</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>

            <div className="pt-6 sm:pt-8 flex justify-center">
              <button
                onClick={logout}
                className="w-full sm:w-auto px-8 py-3.5 bg-[#ef4444] hover:bg-red-600 active:scale-95 text-white font-bold rounded-2xl text-sm shadow-md shadow-red-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>&gt; Logout</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 relative">
            <button
              onClick={closePasswordModal}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Change Password</h3>
                <p className="text-xs font-medium text-slate-500">Update your account login password</p>
              </div>
            </div>

            {passwordError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold flex items-center gap-2">
                <X className="w-4 h-4 flex-shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              {/* Current Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Current Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min. 6 chars)"
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Confirm New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your new password"
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closePasswordModal}
                  disabled={passwordLoading}
                  className="px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {passwordLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{passwordLoading ? 'Updating...' : 'Update Password'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Privacy Settings Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowPrivacyModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Privacy & Visibility</h3>
                <p className="text-xs font-medium text-slate-500">Manage what details other students can see</p>
              </div>
            </div>

            {privacySuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{privacySuccess}</span>
              </div>
            )}

            <div className="space-y-4">
              {/* Feature 1: Public Profile Visibility */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-blue-600" />
                    <h4 className="text-sm font-bold text-slate-900">Show Profile in Search</h4>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Allow other students to see your full name and photo in route matching. If disabled, you appear as <span className="font-semibold text-slate-700">"Campus Peer"</span>.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowProfile(!showProfile)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    showProfile ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      showProfile ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Feature 2: Post-match Phone Number */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-sm font-bold text-slate-900">Share Phone Post-Match</h4>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Make your phone number visible to your partner on the active ride screen after matching. If disabled, only in-app chat is used.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPhonePostMatch(!showPhonePostMatch)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    showPhonePostMatch ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      showPhonePostMatch ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Feature 3: Exact Distance */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-purple-600" />
                    <h4 className="text-sm font-bold text-slate-900">Share Exact Distance</h4>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Show precise distance in kilometers (e.g. 0.4 km away). If disabled, displays approximate proximity ("Nearby &lt; 1 km").
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPreciseDistance(!showPreciseDistance)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    showPreciseDistance ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      showPreciseDistance ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Feature 4: Ride & Eco Stats */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-amber-600" />
                    <h4 className="text-sm font-bold text-slate-900">Show Ride & Eco Stats</h4>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Display your ride count and environmental carbon savings stats to matched peers on your profile.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRideStats(!showRideStats)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    showRideStats ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      showRideStats ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="pt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowPrivacyModal(false)}
                disabled={privacyLoading}
                className="px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePrivacy}
                disabled={privacyLoading}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {privacyLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{privacyLoading ? 'Saving...' : 'Save Preferences'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
