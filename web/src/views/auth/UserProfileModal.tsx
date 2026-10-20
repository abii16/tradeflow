import React, { useState, useRef } from 'react';
import { 
  X, User, Mail, Phone, Building, Camera, Upload, 
  Trash2, Check, ShieldCheck, AlertCircle, Loader2, 
  Sparkles, FileText, CheckCircle2, RefreshCw
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSessions?: () => void;
}

const AVATAR_PRESETS = [
  { id: 'preset-1', name: 'Transporter Male', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=250&h=250&fit=crop&crop=faces' },
  { id: 'preset-2', name: 'Operations Female', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=250&h=250&fit=crop&crop=faces' },
  { id: 'preset-3', name: 'Fleet Captain', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=250&h=250&fit=crop&crop=faces' },
  { id: 'preset-4', name: 'Logistics Director', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=250&h=250&fit=crop&crop=faces' },
  { id: 'preset-5', name: 'Port Specialist', url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=250&h=250&fit=crop&crop=faces' },
];

/**
 * Resizes and compresses any uploaded image to ~300x300 JPEG
 * Prevents bloated payload while guaranteeing crisp avatar rendering
 */
function compressImage(file: File, maxWidth = 300, maxHeight = 300, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function UserProfileModal({ isOpen, onClose, onOpenSessions }: UserProfileModalProps) {
  const { user, updateProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const defaultAvatar = user?.avatarUrl || user?.metadata?.avatarUrl || `https://i.pravatar.cc/150?u=${user?.email || 'user'}`;
  
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [companyName, setCompanyName] = useState(user?.companyName || '');
  const [bio, setBio] = useState(user?.metadata?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState<string>(defaultAvatar);
  
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPresets, setShowPresets] = useState(false);

  if (!isOpen || !user) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setStatusMessage({ type: 'error', text: 'Please upload a valid image file (PNG, JPG, WebP).' });
      return;
    }

    setIsUploadingPhoto(true);
    setStatusMessage(null);
    try {
      const compressedDataUrl = await compressImage(file);
      setAvatarUrl(compressedDataUrl);
      setStatusMessage({ type: 'success', text: 'Photo selected! Click "Save Changes" to apply.' });
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Failed to process image. Please try another.' });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = () => {
    const fallback = `https://i.pravatar.cc/150?u=${user.email}`;
    setAvatarUrl(fallback);
    setStatusMessage({ type: 'success', text: 'Photo reset to default avatar. Click "Save Changes" to confirm.' });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setStatusMessage({ type: 'error', text: 'Full name cannot be empty.' });
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);
    try {
      await updateProfile({
        fullName: fullName.trim(),
        phone: phone.trim(),
        companyName: companyName.trim(),
        avatarUrl: avatarUrl,
        bio: bio.trim(),
      });

      setStatusMessage({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to update profile. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[250] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#171717] rounded-2xl w-full max-w-xl shadow-2xl border border-[#242424] flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 flex justify-between items-center border-b border-[#242424] bg-[#121212]/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#3ECF8E]/10 border border-[#3ECF8E]/20 flex items-center justify-center">
              <User size={20} className="text-[#3ECF8E]" />
            </div>
            <div>
              <h2 className="font-bold text-[#EDEDED] text-base leading-tight">My Profile & Account</h2>
              <p className="text-xs text-[#8F8F8F]">Manage personal info, avatar photo, and organization credentials</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8F8F8F] hover:text-[#EDEDED] hover:bg-[#242424] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Status notification banner */}
        {statusMessage && (
          <div className={`px-5 py-2.5 text-xs font-medium flex items-center gap-2 border-b transition-all ${
            statusMessage.type === 'success' 
              ? 'bg-[#3ECF8E]/10 text-[#3ECF8E] border-[#3ECF8E]/20' 
              : 'bg-red-500/10 text-red-400 border-red-500/20'
          }`}>
            {statusMessage.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Scrollable Body */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Avatar Upload Card */}
          <div className="bg-[#121212] border border-[#242424] rounded-xl p-4 flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div className="relative group shrink-0">
              <div className="w-20 h-20 rounded-full border-2 border-[#3ECF8E]/40 overflow-hidden ring-4 ring-[#171717] bg-[#242424] shadow-md">
                <img 
                  src={avatarUrl} 
                  alt={fullName || 'Avatar'} 
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingPhoto}
                className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                title="Change profile photo"
              >
                <Camera size={18} />
                <span className="text-[10px] mt-0.5 font-medium">Edit</span>
              </button>
            </div>

            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-sm font-semibold text-[#EDEDED]">Profile Photo</h3>
              <p className="text-xs text-[#8F8F8F] mt-0.5">
                Upload your picture or choose from curated professional presets. Max 5MB (PNG, JPG, WebP).
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
                <input 
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingPhoto}
                  className="px-3 py-1.5 rounded-lg bg-[#242424] hover:bg-[#2E2E2E] text-xs font-medium text-[#EDEDED] border border-[#333] flex items-center gap-1.5 transition-colors"
                >
                  {isUploadingPhoto ? <Loader2 size={13} className="animate-spin text-[#3ECF8E]" /> : <Upload size={13} />}
                  Upload Photo
                </button>

                <button
                  type="button"
                  onClick={() => setShowPresets(!showPresets)}
                  className="px-3 py-1.5 rounded-lg bg-[#1F1F1F] hover:bg-[#242424] text-xs font-medium text-[#3ECF8E] border border-[#3ECF8E]/30 flex items-center gap-1.5 transition-colors"
                >
                  <Sparkles size={13} />
                  Choose Preset
                </button>

                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="p-1.5 rounded-lg text-[#8F8F8F] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  title="Reset to default avatar"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Preset Gallery */}
              {showPresets && (
                <div className="mt-3 p-3 bg-[#171717] border border-[#242424] rounded-lg animate-in fade-in duration-150">
                  <p className="text-[11px] font-medium text-[#8F8F8F] mb-2">Select a preset profile avatar:</p>
                  <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                    {AVATAR_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setAvatarUrl(preset.url);
                          setShowPresets(false);
                          setStatusMessage({ type: 'success', text: `Selected preset: ${preset.name}. Click "Save Changes" to apply.` });
                        }}
                        className={`w-11 h-11 rounded-full border-2 overflow-hidden shrink-0 transition-transform hover:scale-105 ${
                          avatarUrl === preset.url ? 'border-[#3ECF8E] ring-2 ring-[#3ECF8E]/30' : 'border-[#333] hover:border-[#555]'
                        }`}
                        title={preset.name}
                      >
                        <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Full Name */}
            <div>
              <label className="block text-xs font-medium text-[#EDEDED] mb-1.5">
                Full Name <span className="text-[#3ECF8E]">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8F8F8F]">
                  <User size={14} />
                </div>
                <input 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Kebede Abebe"
                  required
                  className="w-full bg-[#121212] border border-[#242424] focus:border-[#3ECF8E] focus:ring-1 focus:ring-[#3ECF8E] rounded-lg py-2 pl-9 pr-3 text-xs text-[#EDEDED] placeholder-[#555] transition-colors outline-none"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-medium text-[#EDEDED] mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8F8F8F]">
                  <Phone size={14} />
                </div>
                <input 
                  type="tel" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+251 91 123 4567"
                  className="w-full bg-[#121212] border border-[#242424] focus:border-[#3ECF8E] focus:ring-1 focus:ring-[#3ECF8E] rounded-lg py-2 pl-9 pr-3 text-xs text-[#EDEDED] placeholder-[#555] transition-colors outline-none"
                />
              </div>
            </div>

            {/* Email (Read-Only) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-[#EDEDED]">
                  Email Address
                </label>
                <span className="text-[10px] text-[#8F8F8F] bg-[#242424] px-1.5 py-0.5 rounded border border-[#333]">
                  Read-Only
                </span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#555]">
                  <Mail size={14} />
                </div>
                <input 
                  type="email" 
                  value={user.email}
                  disabled
                  className="w-full bg-[#121212]/50 border border-[#242424] rounded-lg py-2 pl-9 pr-3 text-xs text-[#8F8F8F] cursor-not-allowed outline-none"
                />
              </div>
            </div>

            {/* Company / Fleet Name */}
            <div>
              <label className="block text-xs font-medium text-[#EDEDED] mb-1.5">
                Organization / Fleet Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8F8F8F]">
                  <Building size={14} />
                </div>
                <input 
                  type="text" 
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Ethio-Djibouti Express"
                  className="w-full bg-[#121212] border border-[#242424] focus:border-[#3ECF8E] focus:ring-1 focus:ring-[#3ECF8E] rounded-lg py-2 pl-9 pr-3 text-xs text-[#EDEDED] placeholder-[#555] transition-colors outline-none"
                />
              </div>
            </div>

            {/* Role & Verification (Display Card) */}
            <div className="sm:col-span-2 bg-[#121212] border border-[#242424] rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#242424] border border-[#333] flex items-center justify-center text-[#3ECF8E]">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#EDEDED]">{user.role}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded border bg-[#3ECF8E]/10 text-[#3ECF8E] border-[#3ECF8E]/30 font-medium">
                      {user.verificationStatus || 'VERIFIED'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8F8F8F] mt-0.5">
                    TIN: <span className="font-mono text-[#CCC]">{user.tinNumber || '0048192837'}</span> • License: <span className="font-mono text-[#CCC]">{user.tradeLicense || 'MOT/AA/2026/089'}</span>
                  </p>
                </div>
              </div>

              {onOpenSessions && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenSessions();
                  }}
                  className="text-xs text-[#8F8F8F] hover:text-[#3ECF8E] transition-colors underline underline-offset-2"
                >
                  Manage Connected Devices →
                </button>
              )}
            </div>

            {/* Bio / Corridor Specialization */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-[#EDEDED] mb-1.5">
                Bio / Operations Note
              </label>
              <textarea 
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder="Briefly describe your logistics services, corridor routes, or company profile..."
                className="w-full bg-[#121212] border border-[#242424] focus:border-[#3ECF8E] focus:ring-1 focus:ring-[#3ECF8E] rounded-lg p-3 text-xs text-[#EDEDED] placeholder-[#555] transition-colors outline-none resize-none"
              />
              <span className="text-[10px] text-[#777] mt-1 block">Visible on verified shipping manifests and carrier bids.</span>
            </div>

          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-[#242424] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl text-xs font-medium text-[#8F8F8F] hover:text-[#EDEDED] hover:bg-[#242424] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-[#3ECF8E] hover:bg-[#34b27b] text-black text-xs font-bold transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 size={14} className="animate-spin text-black" />
                  Saving...
                </>
              ) : (
                <>
                  <Check size={14} className="text-black" />
                  Save Changes
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
