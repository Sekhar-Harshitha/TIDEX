import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, Mail, Phone, Camera, Shield, Key, CheckCircle, 
  AlertCircle, Loader2, ArrowRight, LogOut, Edit2, 
  ShieldCheck, Smartphone, MailCheck, Clock, Award
} from 'lucide-react';

export const Profile: React.FC = () => {
  const { currentUser, logout, t } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Form States
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || ''
  });
  
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [otpMode, setOtpMode] = useState<'email' | 'phone' | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!currentUser) return null;

  const handlePhotoClick = () => fileInputRef.current?.click();

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      setLoading(true);
      try {
        // Simulate upload
        await new Promise(resolve => setTimeout(resolve, 1500));
        setSuccess("Profile photo updated successfully!");
        setTimeout(() => setSuccess(null), 3000);
      } catch (err) {
        setError("Failed to upload photo.");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (formData.email !== currentUser.email || formData.phone !== currentUser.phone) {
        setOtpMode(formData.email !== currentUser.email ? 'email' : 'phone');
        setSuccess("Verification code sent!");
      } else {
        setIsEditing(false);
        setSuccess("Profile updated successfully!");
      }
    } catch (err) {
      setError("Failed to update profile.");
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const handleVerifyOtp = async () => {
    setVerifyingOtp(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setOtpMode(null);
      setIsEditing(false);
      setSuccess("Verification successful! Profile updated.");
    } catch (err) {
      setError("Invalid OTP code.");
    } finally {
      setVerifyingOtp(false);
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsChangingPassword(false);
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setSuccess("Password changed successfully!");
    } catch (err) {
      setError("Failed to change password.");
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  // Calculate profile completion
  const completionFields = [currentUser.name, currentUser.email, currentUser.phone, currentUser.profile_image_url];
  const completedCount = completionFields.filter(Boolean).length;
  const completionPercentage = (completedCount / completionFields.length) * 100;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Header Section */}
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-display font-bold text-white mb-2">Account Settings</h1>
          <p className="text-slate-400">Manage your personal information and security preferences.</p>
        </div>
        <button 
          onClick={logout}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all border border-red-500/20 text-sm font-bold"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-midnight-900 rounded-3xl border border-midnight-800 p-8 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-ocean-500 to-cyan-400"></div>
            
            <div className="flex flex-col items-center">
              <div className="relative mb-6">
                <div 
                  className="w-32 h-32 rounded-full border-4 border-midnight-800 shadow-2xl overflow-hidden bg-slate-800 flex items-center justify-center group-hover:border-ocean-500/50 transition-all cursor-pointer"
                  onClick={handlePhotoClick}
                >
                  {currentUser.profile_image_url ? (
                    <img src={currentUser.profile_image_url} alt={currentUser.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <User size={48} className="text-slate-600" />
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Camera size={24} className="text-white" />
                  </div>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handlePhotoChange} 
                  className="hidden" 
                  accept="image/*"
                />
              </div>

              <h2 className="text-xl font-bold text-white mb-1">{currentUser.name}</h2>
              <p className="text-ocean-400 font-bold text-[10px] uppercase tracking-widest mb-4">{currentUser.role}</p>
              
              <div className="w-full space-y-3 pt-6 border-t border-midnight-800">
                <div className="flex items-center gap-3 text-slate-400 text-sm">
                  <Mail size={14} />
                  <span className="truncate">{currentUser.email}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-400 text-sm">
                  <Phone size={14} />
                  <span>{currentUser.phone || 'No phone set'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Completion Progress */}
          <div className="bg-midnight-900 rounded-3xl border border-midnight-800 p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Profile Strength</h3>
              <span className="text-ocean-400 font-mono font-bold text-xs">{Math.round(completionPercentage)}%</span>
            </div>
            <div className="h-2 bg-midnight-800 rounded-full overflow-hidden mb-4">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${completionPercentage}%` }}
                className="h-full bg-gradient-to-r from-ocean-600 to-cyan-400"
              />
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Complete your profile to unlock all features and increase your trust score within the TideX network.
            </p>
          </div>

          {/* Stats/Info */}
          <div className="bg-midnight-900 rounded-3xl border border-midnight-800 p-6 shadow-xl space-y-4">
             <div className="flex items-center gap-3">
                <div className="bg-ocean-500/10 p-2 rounded-lg">
                  <Clock size={16} className="text-ocean-400" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Last Login</p>
                  <p className="text-xs text-white font-medium">Today, 09:45 AM</p>
                </div>
             </div>
             <div className="flex items-center gap-3">
                <div className="bg-emerald-500/10 p-2 rounded-lg">
                  <Award size={16} className="text-emerald-400" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Member Since</p>
                  <p className="text-xs text-white font-medium">March 2026</p>
                </div>
             </div>
          </div>
        </div>

        {/* Right Column: Settings Forms */}
        <div className="lg:col-span-2 space-y-8">
          {/* Success/Error Toasts */}
          <AnimatePresence>
            {success && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex items-center gap-3 text-emerald-400"
              >
                <CheckCircle size={20} />
                <span className="text-sm font-medium">{success}</span>
              </motion.div>
            )}
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 text-red-400"
              >
                <AlertCircle size={20} />
                <span className="text-sm font-medium">{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Personal Information */}
          <section className="bg-midnight-900 rounded-3xl border border-midnight-800 shadow-xl overflow-hidden">
            <div className="p-6 border-b border-midnight-800 flex justify-between items-center bg-midnight-950/50">
              <div className="flex items-center gap-3">
                <User className="text-ocean-400" size={20} />
                <h3 className="font-bold text-white">Personal Information</h3>
              </div>
              {!isEditing && (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="text-xs font-bold text-ocean-400 hover:text-white flex items-center gap-1 transition-colors"
                >
                  <Edit2 size={14} />
                  Edit Profile
                </button>
              )}
            </div>
            
            <div className="p-8">
              {otpMode ? (
                <div className="max-w-sm mx-auto text-center py-8">
                  <div className="bg-ocean-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                    {otpMode === 'email' ? <MailCheck size={32} className="text-ocean-400" /> : <Smartphone size={32} className="text-ocean-400" />}
                  </div>
                  <h4 className="text-xl font-bold text-white mb-2">Verify your {otpMode}</h4>
                  <p className="text-slate-400 text-sm mb-8">We've sent a 6-digit code to your new {otpMode}. Please enter it below to confirm the change.</p>
                  
                  <div className="flex gap-2 justify-center mb-8">
                    <input 
                      type="text" 
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="000000"
                      className="w-full max-w-[200px] bg-midnight-950 border border-midnight-700 rounded-xl px-4 py-3 text-center text-2xl font-mono tracking-[0.5em] text-white focus:outline-none focus:border-ocean-500 transition-all"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={handleVerifyOtp}
                      disabled={verifyingOtp || otpCode.length < 6}
                      className="w-full py-3 rounded-xl bg-ocean-600 hover:bg-ocean-500 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {verifyingOtp ? <Loader2 className="animate-spin" size={18} /> : "Verify & Save"}
                    </button>
                    <button 
                      onClick={() => setOtpMode(null)}
                      className="text-slate-500 hover:text-white text-xs font-bold transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleProfileUpdate} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest ml-1">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                        <input 
                          type="text"
                          disabled={!isEditing}
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          className="w-full bg-midnight-950 border border-midnight-700 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-ocean-500 disabled:opacity-50 transition-all"
                          placeholder="John Doe"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest ml-1">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                        <input 
                          type="email"
                          disabled={!isEditing}
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          className="w-full bg-midnight-950 border border-midnight-700 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-ocean-500 disabled:opacity-50 transition-all"
                          placeholder="john@example.com"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest ml-1">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                        <input 
                          type="tel"
                          disabled={!isEditing}
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                          className="w-full bg-midnight-950 border border-midnight-700 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-ocean-500 disabled:opacity-50 transition-all"
                          placeholder="+91 98765 43210"
                        />
                      </div>
                    </div>
                  </div>

                  {isEditing && (
                    <div className="flex gap-4 pt-4">
                      <button 
                        type="submit"
                        disabled={loading}
                        className="px-8 py-3 rounded-xl bg-ocean-600 hover:bg-ocean-500 text-white font-bold flex items-center gap-2 transition-all"
                      >
                        {loading ? <Loader2 className="animate-spin" size={18} /> : "Save Changes"}
                      </button>
                      <button 
                        type="button"
                        onClick={() => {
                          setIsEditing(false);
                          setFormData({
                            name: currentUser.name,
                            email: currentUser.email,
                            phone: currentUser.phone || ''
                          });
                        }}
                        className="px-8 py-3 rounded-xl bg-midnight-800 hover:bg-midnight-700 text-slate-300 font-bold transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </form>
              )}
            </div>
          </section>

          {/* Security Settings */}
          <section className="bg-midnight-900 rounded-3xl border border-midnight-800 shadow-xl overflow-hidden">
            <div className="p-6 border-b border-midnight-800 flex justify-between items-center bg-midnight-950/50">
              <div className="flex items-center gap-3">
                <Shield className="text-ocean-400" size={20} />
                <h3 className="font-bold text-white">Security & Password</h3>
              </div>
              {!isChangingPassword && (
                <button 
                  onClick={() => setIsChangingPassword(true)}
                  className="text-xs font-bold text-ocean-400 hover:text-white flex items-center gap-1 transition-colors"
                >
                  <Key size={14} />
                  Change Password
                </button>
              )}
            </div>

            <div className="p-8">
              {isChangingPassword ? (
                <form onSubmit={handlePasswordChange} className="space-y-6 max-w-md">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest ml-1">Old Password</label>
                    <input 
                      type="password"
                      required
                      value={passwordData.oldPassword}
                      onChange={(e) => setPasswordData({...passwordData, oldPassword: e.target.value})}
                      className="w-full bg-midnight-950 border border-midnight-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-ocean-500 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest ml-1">New Password</label>
                    <input 
                      type="password"
                      required
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                      className="w-full bg-midnight-950 border border-midnight-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-ocean-500 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest ml-1">Confirm New Password</label>
                    <input 
                      type="password"
                      required
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                      className="w-full bg-midnight-950 border border-midnight-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-ocean-500 transition-all"
                    />
                  </div>
                  
                  <div className="flex gap-4 pt-2">
                    <button 
                      type="submit"
                      disabled={loading}
                      className="px-8 py-3 rounded-xl bg-ocean-600 hover:bg-ocean-500 text-white font-bold flex items-center gap-2 transition-all"
                    >
                      {loading ? <Loader2 className="animate-spin" size={18} /> : "Update Password"}
                    </button>
                    <button 
                      type="button"
                      onClick={() => setIsChangingPassword(false)}
                      className="px-8 py-3 rounded-xl bg-midnight-800 hover:bg-midnight-700 text-slate-300 font-bold transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex items-center justify-between p-4 bg-midnight-950/30 rounded-2xl border border-midnight-800/50">
                  <div className="flex items-center gap-4">
                    <div className="bg-emerald-500/10 p-3 rounded-full">
                      <ShieldCheck className="text-emerald-400" size={24} />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-sm">Two-Factor Authentication</h4>
                      <p className="text-slate-500 text-xs">Add an extra layer of security to your account.</p>
                    </div>
                  </div>
                  <button className="px-4 py-2 rounded-lg bg-midnight-800 text-slate-300 text-xs font-bold hover:bg-midnight-700 transition-all">
                    Enable 2FA
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
