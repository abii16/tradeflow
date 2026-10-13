import React, { useState } from 'react';
import { 
  Building2, Truck, Briefcase, ShieldCheck, CheckCircle2, 
  AlertCircle, Loader2, X, FileText, FileCheck, ArrowRight
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { completeUserProfile } from '@/lib/apiClient';

interface CompleteProfileModalProps {
  onClose?: () => void;
  onSuccess?: () => void;
}

export default function CompleteProfileModal({ onClose, onSuccess }: CompleteProfileModalProps) {
  const { user, refreshUser } = useAuth();

  const [role, setRole] = useState<'SHIPPER' | 'TRANSPORTER' | 'FORWARDER' | 'CUSTOMS_OFFICER'>(
    (user?.role as any) || 'SHIPPER'
  );

  const [formData, setFormData] = useState({
    companyName: user?.companyName || (user?.fullName ? `${user.fullName}'s Logistics` : ''),
    phone: user?.phone || '+251 9',
    tinNumber: user?.tinNumber || '',
    tradeLicense: user?.tradeLicense || '',
    businessSector: 'Importer / Exporter (Industrial & Dry Cargo)',
    businessAddress: 'Bole Sub-City, Addis Ababa',
    
    // Transporter fleet details (SRS FR-01.2)
    vehicleType: 'Flatbed Trailer (40ft Containerized)',
    fleetSize: '12',
    vehicleCapacity: '40 Metric Tons',
    insurancePolicy: 'GIT-ETH-2026-9921',

    // Customs Officer details
    badgeId: user?.badgeId || '',
    customsStation: 'Modjo Dry Port Clearance Hub',
    customsDivision: 'Commercial Inspection & Valuation',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successSubmitted, setSuccessSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.companyName.trim()) {
      setError('Please provide your registered legal company or entity name.');
      return;
    }
    if (!formData.tinNumber.trim() || formData.tinNumber.trim().length < 5) {
      setError('Please enter a valid 10-digit Ethiopian Taxpayer Identification Number (TIN).');
      return;
    }
    if (!formData.tradeLicense.trim() || formData.tradeLicense.trim().length < 3) {
      setError('Please enter your valid Ministry of Trade & Regional Integration (MOTRI) license number.');
      return;
    }

    setIsSubmitting(true);
    try {
      await completeUserProfile({
        role,
        companyName: formData.companyName.trim(),
        tinNumber: formData.tinNumber.trim(),
        tradeLicense: formData.tradeLicense.trim(),
        phone: formData.phone.trim(),
        businessSector: formData.businessSector,
        businessAddress: formData.businessAddress,
        vehicleType: role === 'TRANSPORTER' ? formData.vehicleType : undefined,
        fleetSize: role === 'TRANSPORTER' ? formData.fleetSize : undefined,
        vehicleCapacity: role === 'TRANSPORTER' ? formData.vehicleCapacity : undefined,
        insurancePolicy: role === 'TRANSPORTER' ? formData.insurancePolicy : undefined,
        badgeId: role === 'CUSTOMS_OFFICER' ? formData.badgeId : undefined,
        customsStation: role === 'CUSTOMS_OFFICER' ? formData.customsStation : undefined,
        customsDivision: role === 'CUSTOMS_OFFICER' ? formData.customsDivision : undefined,
      });

      await refreshUser();
      setSuccessSubmitted(true);
      setTimeout(() => {
        if (onSuccess) onSuccess();
        if (onClose) onClose();
      }, 1800);
    } catch (err: any) {
      setError(err.message || 'Failed to submit regulatory credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleCards = [
    {
      id: 'SHIPPER',
      title: 'Shipper / Cargo Owner',
      amharic: 'አስመጪ / ላኪ ድርጅት',
      desc: 'Imports or exports containerized cargo along Djibouti–Modjo corridor.',
      icon: Briefcase,
    },
    {
      id: 'TRANSPORTER',
      title: 'Transporter / Fleet Carrier',
      amharic: 'የትራንስፖርት ድርጅት / ባለንብረት',
      desc: 'Operates heavy freight trucks, bids on loads & executes haulage.',
      icon: Truck,
    },
    {
      id: 'FORWARDER',
      title: 'Freight Forwarder',
      amharic: 'የትራንስፖርት አስተላላፊ',
      desc: 'Licensed multimodal logistics agent managing cargo manifests.',
      icon: Building2,
    },
    {
      id: 'CUSTOMS_OFFICER',
      title: 'Customs Authority Staff',
      amharic: 'የጉምሩክ ባለስልጣን',
      desc: 'ECC Officer conducting clearance, sealing & inspections.',
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#1C1C1C] rounded-2xl w-full max-w-2xl border border-[#2E2E2E] shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 bg-[#232323] border-b border-[#2E2E2E] flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-wider font-bold bg-[#3ECF8E]/10 text-[#3ECF8E] border border-[#3ECF8E]/30">
                IEEE 830 SRS FR-01 COMPLIANCE
              </span>
              <span className="text-[10px] text-[#8F8F8F] font-mono">
                {user?.email}
              </span>
            </div>
            <h2 className="text-xl font-bold text-[#EDEDED] tracking-tight">
              የንግድ ፈቃድ እና ህጋዊ ምዝገባ ማሟያ
            </h2>
            <p className="text-xs text-[#8F8F8F] mt-1">
              Complete mandatory trade license, tax ID (TIN), and corridor credentials to activate marketplace bidding and load posting.
            </p>
          </div>
          {onClose && (
            <button 
              onClick={onClose} 
              className="text-[#8F8F8F] hover:text-[#EDEDED] p-1.5 rounded-lg hover:bg-[#2A2A2A] transition-colors"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Success Feedback View */}
        {successSubmitted ? (
          <div className="p-10 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#3ECF8E]/10 border border-[#3ECF8E]/40 flex items-center justify-center animate-bounce">
              <CheckCircle2 size={36} className="text-[#3ECF8E]" />
            </div>
            <h3 className="text-xl font-bold text-[#EDEDED]">
              ህጋዊ መረጃዎ በተሳካ ሁኔታ ተልኳል!
            </h3>
            <p className="text-sm text-[#8F8F8F] max-w-md">
              Your trade license and TIN credentials have been synced and submitted to the <strong className="text-white">Admin Operations Control Tower</strong> verification queue.
            </p>
            <div className="flex items-center gap-2 text-xs text-[#3ECF8E] font-mono bg-[#232323] px-4 py-2 rounded-xl border border-[#2E2E2E]">
              <Loader2 size={14} className="animate-spin" /> Updating session & corridor privileges...
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center gap-2.5">
                <AlertCircle size={16} className="shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Step 1: Corridor Role Selection */}
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-[#8F8F8F] mb-2.5">
                1. Select Corridor Role (የተጠቃሚ ሚና ይምረጡ)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {roleCards.map((r) => {
                  const Icon = r.icon;
                  const isSelected = role === r.id;
                  return (
                    <div
                      key={r.id}
                      onClick={() => setRole(r.id as any)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                        isSelected
                          ? 'bg-[#3ECF8E]/10 border-[#3ECF8E] shadow-sm'
                          : 'bg-[#232323] border-[#2E2E2E] hover:border-[#404040]'
                      }`}
                    >
                      <div className={`p-2 rounded-lg mt-0.5 ${isSelected ? 'bg-[#3ECF8E] text-black' : 'bg-[#1C1C1C] text-[#8F8F8F]'}`}>
                        <Icon size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#EDEDED]">{r.title}</span>
                          {isSelected && <CheckCircle2 size={14} className="text-[#3ECF8E]" />}
                        </div>
                        <div className="text-[10px] text-[#3ECF8E] font-medium">{r.amharic}</div>
                        <p className="text-[10px] text-[#8F8F8F] mt-1 leading-snug truncate">{r.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Commercial & Legal Identity */}
            <div className="space-y-4">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-[#8F8F8F]">
                2. Legal Entity & Regulatory Credentials (ንግድ ፈቃድ እና ግብር)
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#EDEDED] mb-1.5">
                    Company / Entity Legal Name (የድርጅት ስም) *
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Abyssinia Logistics PLC"
                    className="w-full bg-[#232323] text-[#EDEDED] border border-[#2E2E2E] rounded-xl px-3 py-2.5 text-xs focus:ring-1 focus:ring-[#3ECF8E] focus:border-[#3ECF8E] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#EDEDED] mb-1.5">
                    Official Business Phone (ስልክ ቁጥር) *
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    placeholder="+251 911 234567"
                    className="w-full bg-[#232323] text-[#EDEDED] border border-[#2E2E2E] rounded-xl px-3 py-2.5 text-xs focus:ring-1 focus:ring-[#3ECF8E] focus:border-[#3ECF8E] outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#EDEDED] mb-1.5 flex items-center justify-between">
                    <span>Trade License Number (የንግድ ፈቃድ) *</span>
                    <span className="text-[10px] text-[#3ECF8E] font-mono">MOTRI Certified</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="tradeLicense"
                      value={formData.tradeLicense}
                      onChange={handleChange}
                      required
                      placeholder="e.g. MTI/AA/2026/0491"
                      className="w-full bg-[#232323] text-[#EDEDED] border border-[#2E2E2E] rounded-xl px-3 py-2.5 text-xs focus:ring-1 focus:ring-[#3ECF8E] focus:border-[#3ECF8E] outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#EDEDED] mb-1.5 flex items-center justify-between">
                    <span>Taxpayer ID (TIN ቁጥር) *</span>
                    <span className="text-[10px] text-[#3ECF8E] font-mono">10 Digits</span>
                  </label>
                  <input
                    type="text"
                    name="tinNumber"
                    value={formData.tinNumber}
                    onChange={handleChange}
                    required
                    maxLength={14}
                    placeholder="e.g. 0048192837"
                    className="w-full bg-[#232323] text-[#EDEDED] border border-[#2E2E2E] rounded-xl px-3 py-2.5 text-xs focus:ring-1 focus:ring-[#3ECF8E] focus:border-[#3ECF8E] outline-none font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Step 3: Role Specific Details */}
            {role === 'TRANSPORTER' && (
              <div className="p-4 bg-[#232323] border border-[#2E2E2E] rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#EDEDED]">
                  <Truck size={14} className="text-[#3ECF8E]" />
                  <span>Carrier Fleet Specifications (የጭነት መኪናዎች መረጃ)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] text-[#8F8F8F] mb-1">Fleet Size (የተሽከርካሪ ብዛት)</label>
                    <input
                      type="number"
                      name="fleetSize"
                      value={formData.fleetSize}
                      onChange={handleChange}
                      className="w-full bg-[#1C1C1C] text-[#EDEDED] border border-[#2E2E2E] rounded-lg px-2.5 py-1.5 text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#8F8F8F] mb-1">Vehicle Type</label>
                    <select
                      name="vehicleType"
                      value={formData.vehicleType}
                      onChange={handleChange}
                      className="w-full bg-[#1C1C1C] text-[#EDEDED] border border-[#2E2E2E] rounded-lg px-2.5 py-1.5 text-xs outline-none"
                    >
                      <option>Flatbed Trailer (40ft)</option>
                      <option>Lowbed Heavy Hauler</option>
                      <option>Refrigerated Reefer</option>
                      <option>Tanker (Fuel/Liquid)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#8F8F8F] mb-1">Capacity (Tons)</label>
                    <input
                      type="text"
                      name="vehicleCapacity"
                      value={formData.vehicleCapacity}
                      onChange={handleChange}
                      className="w-full bg-[#1C1C1C] text-[#EDEDED] border border-[#2E2E2E] rounded-lg px-2.5 py-1.5 text-xs outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-[#8F8F8F] mb-1">Goods-in-Transit (GIT) Policy #</label>
                  <input
                    type="text"
                    name="insurancePolicy"
                    value={formData.insurancePolicy}
                    onChange={handleChange}
                    placeholder="e.g. NIC-GIT-2026-8819"
                    className="w-full bg-[#1C1C1C] text-[#EDEDED] border border-[#2E2E2E] rounded-lg px-2.5 py-1.5 text-xs outline-none font-mono"
                  />
                </div>
              </div>
            )}

            {role === 'CUSTOMS_OFFICER' && (
              <div className="p-4 bg-[#232323] border border-[#2E2E2E] rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#EDEDED]">
                  <ShieldCheck size={14} className="text-[#3ECF8E]" />
                  <span>ECC Customs Official Accreditation</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-[#8F8F8F] mb-1">Badge ID / Service Number *</label>
                    <input
                      type="text"
                      name="badgeId"
                      value={formData.badgeId}
                      onChange={handleChange}
                      placeholder="e.g. ECC-MODJO-882"
                      required
                      className="w-full bg-[#1C1C1C] text-[#EDEDED] border border-[#2E2E2E] rounded-lg px-2.5 py-1.5 text-xs outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#8F8F8F] mb-1">Customs Station</label>
                    <input
                      type="text"
                      name="customsStation"
                      value={formData.customsStation}
                      onChange={handleChange}
                      className="w-full bg-[#1C1C1C] text-[#EDEDED] border border-[#2E2E2E] rounded-lg px-2.5 py-1.5 text-xs outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="pt-2 flex items-center justify-between border-t border-[#2E2E2E]">
              <span className="text-[11px] text-[#8F8F8F] flex items-center gap-1.5">
                <FileCheck size={14} className="text-[#3ECF8E]" />
                Enforces Djibouti–Modjo corridor legal compliance
              </span>

              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#3ECF8E] hover:bg-[#34b27b] text-black font-bold text-xs px-6 py-2.5 rounded-xl transition flex items-center gap-2 shadow-md disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Submitting Dossier...
                  </>
                ) : (
                  <>
                    Submit For Regulatory Verification <ArrowRight size={14} />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
