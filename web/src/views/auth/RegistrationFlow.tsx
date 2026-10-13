import React, { useState } from 'react';
import { 
  Building2, Truck, Briefcase, ChevronRight, CheckCircle2, 
  UploadCloud, X, Loader2, Eye, EyeOff, ShieldCheck, 
  Clock, Lock, ShieldAlert, Award, FileText
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface RegistrationFlowProps {
  onClose: () => void;
}

const COMMON_WEAK_PASSWORDS = new Set([
  'password', 'password1', 'password123', 'password1234', 'password!', 'p@ssword', 'p@ssword1',
  '12345678', '123456789', '12345678a', '12345678aa', '1234567890',
  'qwerty123', 'admin123', 'admin@123', 'administrator', 'tradeflow', 'tradeflow123',
  'welcome123', 'welcome@123', 'iloveyou1', 'sunshine1', 'ethiopia123', 'ethiopia1',
  'addisababa1', 'changeme1', 'letmein123', 'pass@123',
]);

export default function RegistrationFlow({ onClose }: RegistrationFlowProps) {
  const { register, loginWithGoogle } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Form State
  const [role, setRole] = useState<'shipper' | 'transporter' | 'forwarder' | 'customs_officer' | null>(null);
  const [formData, setFormData] = useState({
    // Step 1: Personal Profile
    fullName: '',
    email: '',
    phone: '',
    password: '',

    // Step 3: Legal & Entity Info (SRS FR-01.1)
    companyName: '',
    businessSector: 'Importer (Dry Cargo / Industrial & Construction Goods)',
    taxId: '',
    licenseNumber: '',
    businessAddress: '',
    city: 'Addis Ababa',

    // Transporter Specifics (SRS FR-01.2)
    vehicleType: 'Flatbed Trailer (40ft Containerized)',
    fleetSize: '',
    vehicleCapacity: '40 Metric Tons',
    insurancePolicy: '',

    // Forwarder Specifics
    forwarderLicense: '',
    customsBrokerLicense: '',

    // Customs Officer Specifics
    badgeId: '',
    customsStation: 'Modjo Dry Port Terminal',
    customsDivision: 'Clearance & Valuation',

    // Document filenames
    tradeLicenseFile: 'trade_license_mti.pdf',
    tinDocFile: 'tin_registration_cert.pdf',
    libreDocFile: 'roadworthiness_libre_2026.pdf',
    insuranceDocFile: 'git_cargo_policy.pdf',
    eccAccreditationFile: 'ecc_customs_broker_cert.pdf',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNext = () => setStep((s) => s + 1);
  const handleBack = () => setStep((s) => s - 1);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      let mappedRole: 'SHIPPER' | 'TRANSPORTER' | 'FORWARDER' | 'CUSTOMS_OFFICER' = 'SHIPPER';
      if (role === 'transporter') mappedRole = 'TRANSPORTER';
      if (role === 'forwarder') mappedRole = 'FORWARDER';
      if (role === 'customs_officer') mappedRole = 'CUSTOMS_OFFICER';

      const tinClean = formData.taxId.trim();
      const licenseClean = (formData.licenseNumber || formData.forwarderLicense || 'MTI/2026/001').trim();

      await register({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        phone: formData.phone,
        role: mappedRole,
        companyName: formData.companyName,
        tinNumber: tinClean,
        tradeLicense: licenseClean,
        businessSector: formData.businessSector,
        businessAddress: `${formData.businessAddress || 'Commercial District'}, ${formData.city}`,
        fleetName: role === 'transporter' ? formData.companyName : undefined,
        operatorLicense: role === 'transporter' ? licenseClean : undefined,
        vehicleCapacity: formData.vehicleCapacity || (formData.fleetSize ? `${formData.fleetSize} Trucks` : undefined),
        vehicleType: formData.vehicleType,
        fleetSize: formData.fleetSize,
        insurancePolicy: formData.insurancePolicy,
        customsBrokerLicense: formData.customsBrokerLicense,
        badgeId: formData.badgeId,
        customsStation: formData.customsStation,
        customsDivision: formData.customsDivision,
        documentUrls: {
          tradeLicense: `https://storage.tradeflow.et/docs/${encodeURIComponent(licenseClean)}_license.pdf`,
          taxId: `https://storage.tradeflow.et/docs/${encodeURIComponent(tinClean)}_tin.pdf`,
          roadworthiness: `https://storage.tradeflow.et/docs/${encodeURIComponent(licenseClean)}_libre.pdf`,
          insurance: `https://storage.tradeflow.et/docs/${encodeURIComponent(formData.insurancePolicy || 'policy')}.pdf`,
        },
      });

      // Advance to success step
      setStep(role === 'transporter' ? 5 : 4);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please verify required fields.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // SRS Section 2.3 User Classes & Characteristics (Public Marketplace Actors)
  const roleOptions = [
    { 
      id: 'shipper', 
      title: 'Shipper / Cargo Owner', 
      badge: 'Cargo Owner',
      desc: 'Commercial importers, exporters & industrial cargo owners posting loads & contracting transport.', 
      icon: Briefcase,
    },
    { 
      id: 'transporter', 
      title: 'Transporter / Carrier', 
      badge: 'Motor Carrier',
      desc: 'Fleet owners & transport operators managing heavy trucks, bidding on loads & executing corridor transit.', 
      icon: Truck,
    },
    { 
      id: 'forwarder', 
      title: 'Freight Forwarder', 
      badge: 'Transit Broker',
      desc: 'Licensed multimodal logistics agencies & customs brokers consolidating cargo manifests & clearance.', 
      icon: Building2,
    },
    { 
      id: 'customs_officer', 
      title: 'Customs Authority Staff', 
      badge: 'ECC Official',
      desc: 'Ethiopian Customs Commission (ECC) officers validating clearance documentation & inspections.', 
      icon: ShieldCheck,
    },
  ];

  // STEP 1: Personal Credentials
  const renderStep1 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-[#EDEDED] tracking-tight mb-1">Create Your Account</h3>
        <p className="text-xs text-[#8F8F8F]">Step 1 of 3: Authorized contact profile on the TradeFlow corridor.</p>
      </div>

      {/* Google Sign Up Button */}
      <button 
        type="button" 
        onClick={async () => {
          try {
            let mappedRole = 'SHIPPER';
            if (role === 'transporter') mappedRole = 'TRANSPORTER';
            if (role === 'forwarder') mappedRole = 'FORWARDER';
            if (role === 'customs_officer') mappedRole = 'CUSTOMS_OFFICER';
            await loginWithGoogle(mappedRole);
          } catch(err: any) {
            setError(err.message || 'Google Sign Up failed');
          }
        }} 
        className="w-full flex items-center justify-center gap-3 bg-[#232323] hover:bg-[#2A2A2A] text-[#EDEDED] border border-[#2E2E2E] hover:border-[#8F8F8F] transition-all px-4 py-3 rounded-xl font-bold text-xs mb-6 shadow-sm"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Sign up with Google
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-px bg-[#2E2E2E]"></div>
        <span className="text-[10px] font-mono uppercase tracking-widest text-[#8F8F8F]">Or register with email</span>
        <div className="flex-1 h-px bg-[#2E2E2E]"></div>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-widest text-[#8F8F8F] mb-1.5">Authorized Representative Full Name *</label>
          <input 
            type="text" 
            name="fullName" 
            value={formData.fullName} 
            onChange={handleChange} 
            className="w-full bg-[#1C1C1C] text-[#EDEDED] border border-[#2E2E2E] rounded-xl p-3 text-xs focus:ring-1 focus:ring-[#3ECF8E] focus:border-[#3ECF8E] outline-none transition-all placeholder-[#8F8F8F]/50" 
            placeholder="e.g. Demirew Manidefro" 
          />
        </div>
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-widest text-[#8F8F8F] mb-1.5">Corporate / Work Email Address *</label>
          <input 
            type="email" 
            name="email" 
            value={formData.email} 
            onChange={handleChange} 
            className="w-full bg-[#1C1C1C] text-[#EDEDED] border border-[#2E2E2E] rounded-xl p-3 text-xs focus:ring-1 focus:ring-[#3ECF8E] focus:border-[#3ECF8E] outline-none transition-all placeholder-[#8F8F8F]/50" 
            placeholder="corporate@enterprise.com.et" 
          />
        </div>
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-widest text-[#8F8F8F] mb-1.5">Authorized Mobile Phone *</label>
          <input 
            type="tel" 
            name="phone" 
            value={formData.phone} 
            onChange={handleChange} 
            className="w-full bg-[#1C1C1C] text-[#EDEDED] font-mono border border-[#2E2E2E] rounded-xl p-3 text-xs focus:ring-1 focus:ring-[#3ECF8E] focus:border-[#3ECF8E] outline-none transition-all placeholder-[#8F8F8F]/50" 
            placeholder="+251 911 234 567" 
          />
        </div>
        {(() => {
          const pwd = formData.password;
          const rules = {
            minLength: pwd.length >= 8,
            hasUpper: /[A-Z]/.test(pwd),
            hasLower: /[a-z]/.test(pwd),
            hasNumber: /[0-9]/.test(pwd),
            hasSpecial: /[\W_]/.test(pwd),
            notCommon: !COMMON_WEAK_PASSWORDS.has(pwd.toLowerCase().trim()),
          };
          const passedCount = [rules.minLength, rules.hasUpper, rules.hasLower, rules.hasNumber, rules.hasSpecial].filter(Boolean).length;
          const isCommonWeak = pwd.length > 0 && !rules.notCommon;
          const isPasswordValid = passedCount === 5 && rules.notCommon;

          let strengthLabel = 'Too Short';
          let strengthColor = 'bg-red-500';
          let textColor = 'text-red-400';
          if (passedCount >= 5 && rules.notCommon) {
            strengthLabel = 'Strong (INSA Certified)';
            strengthColor = 'bg-[#3ECF8E]';
            textColor = 'text-[#3ECF8E]';
          } else if (passedCount >= 4) {
            strengthLabel = 'Good';
            strengthColor = 'bg-blue-500';
            textColor = 'text-blue-400';
          } else if (passedCount >= 3) {
            strengthLabel = 'Moderate';
            strengthColor = 'bg-amber-500';
            textColor = 'text-amber-400';
          } else if (passedCount >= 1) {
            strengthLabel = 'Weak';
            strengthColor = 'bg-red-500';
            textColor = 'text-red-400';
          }

          return (
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-[10px] font-mono uppercase tracking-widest text-[#8F8F8F]">
                  Password (INSA Hardened) *
                </label>
                {pwd.length > 0 && (
                  <span className={`text-[10px] font-mono font-bold ${textColor}`}>
                    {strengthLabel}
                  </span>
                )}
              </div>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  name="password" 
                  value={formData.password} 
                  onChange={handleChange} 
                  className={`w-full bg-[#1C1C1C] text-[#EDEDED] border rounded-xl p-3 pr-10 text-xs focus:ring-1 outline-none transition-all placeholder-[#8F8F8F]/50 ${
                    isCommonWeak 
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                      : isPasswordValid 
                      ? 'border-[#3ECF8E]/50 focus:border-[#3ECF8E] focus:ring-[#3ECF8E]/20' 
                      : 'border-[#2E2E2E] focus:border-[#3ECF8E] focus:ring-[#3ECF8E]/20'
                  }`}
                  placeholder="Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 symbol" 
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8F8F8F] hover:text-[#EDEDED] focus:outline-none transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Password Strength Meter Bar */}
              {pwd.length > 0 && (
                <div className="mt-2 space-y-1.5 animate-in fade-in duration-200">
                  <div className="grid grid-cols-4 gap-1.5 h-1.5">
                    <div className={`rounded-full h-full transition-all duration-300 ${passedCount >= 1 ? strengthColor : 'bg-[#2E2E2E]'}`}></div>
                    <div className={`rounded-full h-full transition-all duration-300 ${passedCount >= 3 ? strengthColor : 'bg-[#2E2E2E]'}`}></div>
                    <div className={`rounded-full h-full transition-all duration-300 ${passedCount >= 4 ? strengthColor : 'bg-[#2E2E2E]'}`}></div>
                    <div className={`rounded-full h-full transition-all duration-300 ${passedCount >= 5 && rules.notCommon ? strengthColor : 'bg-[#2E2E2E]'}`}></div>
                  </div>

                  {isCommonWeak && (
                    <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-[10px] text-red-400 flex items-center gap-1.5">
                      <ShieldAlert size={12} className="shrink-0" />
                      <span><strong>Rejected by INSA policy:</strong> This is a common dictionary password. Please choose a unique passphrase.</span>
                    </div>
                  )}

                  {/* Checklist of rules */}
                  <div className="grid grid-cols-2 gap-1 pt-1 text-[10px] font-mono">
                    <div className={`flex items-center gap-1.5 ${rules.minLength ? 'text-[#3ECF8E]' : 'text-[#8F8F8F]'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${rules.minLength ? 'bg-[#3ECF8E]' : 'bg-[#3A3A3A]'}`} />
                      8+ characters
                    </div>
                    <div className={`flex items-center gap-1.5 ${rules.hasUpper ? 'text-[#3ECF8E]' : 'text-[#8F8F8F]'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${rules.hasUpper ? 'bg-[#3ECF8E]' : 'bg-[#3A3A3A]'}`} />
                      Uppercase letter (A-Z)
                    </div>
                    <div className={`flex items-center gap-1.5 ${rules.hasLower ? 'text-[#3ECF8E]' : 'text-[#8F8F8F]'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${rules.hasLower ? 'bg-[#3ECF8E]' : 'bg-[#3A3A3A]'}`} />
                      Lowercase letter (a-z)
                    </div>
                    <div className={`flex items-center gap-1.5 ${rules.hasNumber ? 'text-[#3ECF8E]' : 'text-[#8F8F8F]'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${rules.hasNumber ? 'bg-[#3ECF8E]' : 'bg-[#3A3A3A]'}`} />
                      Number (0-9)
                    </div>
                    <div className={`flex items-center gap-1.5 ${rules.hasSpecial ? 'text-[#3ECF8E]' : 'text-[#8F8F8F]'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${rules.hasSpecial ? 'bg-[#3ECF8E]' : 'bg-[#3A3A3A]'}`} />
                      Symbol (!@#$...)
                    </div>
                    <div className={`flex items-center gap-1.5 ${rules.notCommon ? 'text-[#3ECF8E]' : 'text-red-400'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${rules.notCommon ? 'bg-[#3ECF8E]' : 'bg-red-500'}`} />
                      Non-dictionary
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      <div className="pt-6 flex justify-end border-t border-[#2E2E2E]">
        {(() => {
          const pwd = formData.password;
          const rules = {
            minLength: pwd.length >= 8,
            hasUpper: /[A-Z]/.test(pwd),
            hasLower: /[a-z]/.test(pwd),
            hasNumber: /[0-9]/.test(pwd),
            hasSpecial: /[\W_]/.test(pwd),
            notCommon: !COMMON_WEAK_PASSWORDS.has(pwd.toLowerCase().trim()),
          };
          const isPasswordValid = rules.minLength && rules.hasUpper && rules.hasLower && rules.hasNumber && rules.hasSpecial && rules.notCommon;
          const isFormValid = formData.fullName && formData.email && formData.phone && isPasswordValid;

          return (
            <button 
              onClick={handleNext} 
              disabled={!isFormValid}
              className="bg-[#3ECF8E] hover:bg-[#34b27b] text-black px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-[0_0_15px_rgba(62,207,142,0.15)]"
            >
              Next: Choose Role <ChevronRight size={16} />
            </button>
          );
        })()}
      </div>
    </div>
  );

  // STEP 2: Role Selection (SRS Section 2.3 Actors)
  const renderStep2 = () => (
    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="mb-4 text-center">
        <h3 className="text-xl font-bold text-[#EDEDED] tracking-tight mb-1">Select Marketplace Actor Role</h3>
        <p className="text-xs text-[#8F8F8F]">Defined per IEEE 830 SRS Section 2.3 for the Djibouti–Modjo Trade Corridor.</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {roleOptions.map(r => (
          <div 
            key={r.id} 
            onClick={() => setRole(r.id as any)}
            className={`cursor-pointer border rounded-2xl p-4 flex flex-col items-start text-left transition-all duration-200 relative overflow-hidden ${
              role === r.id 
                ? 'bg-[#3ECF8E]/10 border-[#3ECF8E] shadow-[0_0_20px_rgba(62,207,142,0.15)] transform scale-[1.01]' 
                : 'bg-[#1C1C1C] border-[#2E2E2E] hover:border-[#8F8F8F] hover:bg-[#232323]'
            }`}
          >
            <div className="flex items-center justify-between w-full mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${role === r.id ? 'bg-[#3ECF8E] text-black' : 'bg-[#2E2E2E] text-[#8F8F8F]'}`}>
                <r.icon size={18} />
              </div>
              <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${
                role === r.id 
                  ? 'bg-[#3ECF8E]/20 text-[#3ECF8E] border-[#3ECF8E]/30' 
                  : 'bg-[#2E2E2E] text-[#8F8F8F] border-[#3A3A3A]'
              }`}>
                {r.badge}
              </span>
            </div>
            <div className="font-bold text-xs text-[#EDEDED] mb-1">{r.title}</div>
            <div className="text-[11px] leading-relaxed text-[#8F8F8F]">{r.desc}</div>
          </div>
        ))}
      </div>

      {/* Security Note for Platform Administrators */}
      <div className="p-3 bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl flex items-center gap-2.5 text-[11px] text-[#8F8F8F]">
        <Lock size={14} className="text-amber-400 shrink-0" />
        <span>
          <strong>Looking for Platform Administration?</strong> Administrators cannot self-register publicly. Authorized system administrators must sign in via the main Sign In modal.
        </span>
      </div>

      <div className="pt-4 flex justify-between border-t border-[#2E2E2E]">
        <button onClick={handleBack} className="text-[#8F8F8F] hover:text-[#EDEDED] px-4 py-2 text-xs font-bold rounded-lg transition-colors">Back</button>
        <button 
          disabled={!role}
          onClick={handleNext} 
          className="bg-[#3ECF8E] hover:bg-[#34b27b] text-black px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_15px_rgba(62,207,142,0.15)]"
        >
          Continue <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );

  // STEP 3: Business & Legal Entity Registration (SRS FR-01.1)
  const renderStep3 = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="mb-2">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#3ECF8E]/10 text-[#3ECF8E] border border-[#3ECF8E]/20 mb-1.5">
          <ShieldCheck size={12} /> SRS FR-01.1 Legal Identity & Business Verification
        </div>
        <h3 className="text-lg font-bold text-[#EDEDED] tracking-tight">
          {role === 'shipper' && 'Shipper / Cargo Owner Business Profile'}
          {role === 'transporter' && 'Carrier Fleet Operator Legal Profile'}
          {role === 'forwarder' && 'Freight Forwarding Agency Legal Profile'}
          {role === 'customs_officer' && 'Customs Commission Official Credentials'}
        </h3>
        <p className="text-xs text-[#8F8F8F]">
          Required by Ethiopian Ministry of Trade & Regional Integration and Customs Commission.
        </p>
      </div>
      
      {error && <div className="p-3 bg-red-500/10 text-red-400 text-xs rounded-xl border border-red-500/20">{error}</div>}

      <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
        
        {/* Company / Legal Name */}
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-widest text-[#8F8F8F] mb-1">
            {role === 'customs_officer' ? 'Customs Directorate / Branch Office *' : 'Registered Legal Business / Entity Name *'}
          </label>
          <input 
            type="text" 
            name="companyName" 
            value={formData.companyName} 
            onChange={handleChange} 
            required 
            className="w-full bg-[#1C1C1C] text-[#EDEDED] border border-[#2E2E2E] rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-[#3ECF8E] focus:border-[#3ECF8E] outline-none transition-all placeholder-[#8F8F8F]/50" 
            placeholder={
              role === 'transporter' 
                ? 'e.g. Abyssinia Cross-Border Freight Transport Share Co.' 
                : role === 'forwarder'
                ? 'e.g. Horn Logistics & Multimodal Freight Forwarding PLC'
                : role === 'customs_officer'
                ? 'e.g. Modjo Inland Dry Port Customs Branch'
                : 'e.g. Ethiopian Industrial Goods Import & Export Enterprise'
            } 
          />
        </div>

        {/* Role-Specific Fields */}
        {role === 'customs_officer' ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-[#8F8F8F] mb-1">ECC Official Badge ID *</label>
                <input 
                  type="text" 
                  name="badgeId" 
                  value={formData.badgeId} 
                  onChange={handleChange} 
                  required
                  className="w-full bg-[#1C1C1C] text-[#EDEDED] font-mono border border-[#2E2E2E] rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-[#3ECF8E] focus:border-[#3ECF8E] outline-none transition-all placeholder-[#8F8F8F]/50" 
                  placeholder="ECC-OFF-2026-9041" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-[#8F8F8F] mb-1">Station / Port of Assignment</label>
                <select 
                  name="customsStation" 
                  value={formData.customsStation} 
                  onChange={handleChange}
                  className="w-full bg-[#1C1C1C] text-[#EDEDED] border border-[#2E2E2E] rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-[#3ECF8E] focus:border-[#3ECF8E] outline-none transition-all"
                >
                  <option value="Modjo Dry Port Terminal">Modjo Dry Port Terminal</option>
                  <option value="Djibouti Port / DFTZ Terminal">Djibouti Port / DFTZ Terminal</option>
                  <option value="Galafi Border Clearance Post">Galafi Border Clearance Post</option>
                  <option value="Kality Inland Customs Directorate">Kality Inland Customs Directorate</option>
                  <option value="Dire Dawa Free Trade Zone Port">Dire Dawa Free Trade Zone Port</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase tracking-widest text-[#8F8F8F] mb-1">ECC Division / Responsibility</label>
              <select 
                name="customsDivision" 
                value={formData.customsDivision} 
                onChange={handleChange}
                className="w-full bg-[#1C1C1C] text-[#EDEDED] border border-[#2E2E2E] rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-[#3ECF8E] focus:border-[#3ECF8E] outline-none transition-all"
              >
                <option value="Clearance & Valuation">Clearance, Valuation & Tariff Verification</option>
                <option value="Inspection & Transit Seals">Cargo Physical Inspection & Transit GPS Seals</option>
                <option value="Document Audit & Compliance">Customs Declaration Audit & Manifest Reconciliation</option>
              </select>
            </div>
          </>
        ) : (
          <>
            {/* Commercial Entity Fields: Shipper, Transporter, Forwarder */}
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-widest text-[#8F8F8F] mb-1">Business Classification / Sector *</label>
              <select 
                name="businessSector" 
                value={formData.businessSector} 
                onChange={handleChange}
                className="w-full bg-[#1C1C1C] text-[#EDEDED] border border-[#2E2E2E] rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-[#3ECF8E] focus:border-[#3ECF8E] outline-none transition-all"
              >
                {role === 'shipper' && (
                  <>
                    <option value="Importer (Dry Cargo / Industrial Goods)">Commercial Importer (Dry Cargo & Industrial Goods)</option>
                    <option value="Exporter (Coffee / Agricultural Commodities)">Commercial Exporter (Coffee, Pulses & Oilseeds)</option>
                    <option value="Industrial Manufacturer / Agro-Processing">Industrial Manufacturer & Agro-Processing Enterprise</option>
                    <option value="Wholesale Distributor & FMCG">Wholesale Distributor & FMCG Goods</option>
                  </>
                )}
                {role === 'transporter' && (
                  <>
                    <option value="Cross-Border Freight Motor Carrier">Cross-Border Commercial Motor Carrier (Djibouti Corridor)</option>
                    <option value="Specialized Bulk & Tanker Haulage">Specialized Bulk Haulage (Fuel, Gas & Chemicals)</option>
                    <option value="Inland Dry Cargo Fleet Operator">Inland Heavy Cargo Fleet Operator</option>
                  </>
                )}
                {role === 'forwarder' && (
                  <>
                    <option value="Multimodal Transport Operator (MTO)">Multimodal Transport Operator (MTO Agency)</option>
                    <option value="Authorized Customs Clearance Broker">Authorized Customs Clearance Agency & Brokerage</option>
                    <option value="International Freight Forwarding">International Freight Forwarding & Consolidation</option>
                  </>
                )}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-[#8F8F8F] mb-1">Tax ID (10-Digit TIN) *</label>
                <input 
                  type="text" 
                  name="taxId" 
                  value={formData.taxId} 
                  onChange={handleChange} 
                  required
                  maxLength={12}
                  className="w-full bg-[#1C1C1C] text-[#EDEDED] font-mono border border-[#2E2E2E] rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-[#3ECF8E] focus:border-[#3ECF8E] outline-none transition-all placeholder-[#8F8F8F]/50" 
                  placeholder="e.g. 0049281742" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-[#8F8F8F] mb-1">
                  {role === 'transporter' ? 'Transport Competency License *' : 'Trade License No. (MTI) *'}
                </label>
                <input 
                  type="text" 
                  name="licenseNumber" 
                  value={formData.licenseNumber} 
                  onChange={handleChange} 
                  required
                  className="w-full bg-[#1C1C1C] text-[#EDEDED] font-mono border border-[#2E2E2E] rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-[#3ECF8E] focus:border-[#3ECF8E] outline-none transition-all placeholder-[#8F8F8F]/50" 
                  placeholder={role === 'transporter' ? 'MOTL/FLT/2026/892' : 'MTI/AA/2026/0984'} 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-[#8F8F8F] mb-1">Operating Hub / Base</label>
                <select 
                  name="city" 
                  value={formData.city} 
                  onChange={handleChange}
                  className="w-full bg-[#1C1C1C] text-[#EDEDED] border border-[#2E2E2E] rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-[#3ECF8E] focus:border-[#3ECF8E] outline-none transition-all"
                >
                  <option value="Addis Ababa">Addis Ababa</option>
                  <option value="Modjo Dry Port">Modjo Dry Port</option>
                  <option value="Dire Dawa Free Trade Zone">Dire Dawa Free Trade Zone</option>
                  <option value="Adama Logistics Hub">Adama Logistics Hub</option>
                  <option value="Semera / Galafi Border">Semera / Galafi Border</option>
                  <option value="Djibouti Port / DFTZ">Djibouti Port / DFTZ</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-[#8F8F8F] mb-1">Head Office / Terminal Address</label>
                <input 
                  type="text" 
                  name="businessAddress" 
                  value={formData.businessAddress} 
                  onChange={handleChange} 
                  className="w-full bg-[#1C1C1C] text-[#EDEDED] border border-[#2E2E2E] rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-[#3ECF8E] focus:border-[#3ECF8E] outline-none transition-all placeholder-[#8F8F8F]/50" 
                  placeholder="Kirkos Sub-City, Woreda 03" 
                />
              </div>
            </div>

            {/* Document Upload Previews */}
            <div className="space-y-1.5 pt-1">
              <label className="block text-[10px] font-mono uppercase tracking-widest text-[#8F8F8F]">Required Regulatory Documents (FR-01.1)</label>
              <div className="grid grid-cols-2 gap-3">
                <div className="border border-[#2E2E2E] hover:border-[#3ECF8E]/60 bg-[#1C1C1C] rounded-xl p-2.5 text-center transition-all cursor-pointer group">
                  <UploadCloud size={18} className="mx-auto text-[#8F8F8F] group-hover:text-[#3ECF8E] mb-1 transition-colors" />
                  <p className="text-[11px] font-bold text-[#EDEDED]">Commercial Trade License</p>
                  <p className="text-[9px] font-mono text-[#3ECF8E] mt-0.5 flex items-center justify-center gap-1">
                    <CheckCircle2 size={10} /> {formData.tradeLicenseFile}
                  </p>
                </div>
                <div className="border border-[#2E2E2E] hover:border-[#3ECF8E]/60 bg-[#1C1C1C] rounded-xl p-2.5 text-center transition-all cursor-pointer group">
                  <UploadCloud size={18} className="mx-auto text-[#8F8F8F] group-hover:text-[#3ECF8E] mb-1 transition-colors" />
                  <p className="text-[11px] font-bold text-[#EDEDED]">TIN Registration Certificate</p>
                  <p className="text-[9px] font-mono text-[#3ECF8E] mt-0.5 flex items-center justify-center gap-1">
                    <CheckCircle2 size={10} /> {formData.tinDocFile}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2.5 text-[11px] text-amber-300">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0 animate-ping"></div>
          <div>
            <span className="font-bold">SRS FR-01 Compliance Policy:</span> Account will be submitted in <strong>PENDING VERIFICATION</strong> status. Core commercial operations remain locked until credentials are reviewed and approved in the Verification Queue.
          </div>
        </div>
      </div>

      <div className="pt-3 flex justify-between border-t border-[#2E2E2E]">
        <button onClick={handleBack} disabled={isSubmitting} className="text-[#8F8F8F] hover:text-[#EDEDED] px-4 py-2 text-xs font-bold rounded-lg disabled:opacity-50 transition-colors">Back</button>
        <button 
          onClick={role === 'transporter' ? handleNext : handleSubmit} 
          disabled={
            isSubmitting || 
            !formData.companyName || 
            (role !== 'customs_officer' && (!formData.taxId || !formData.licenseNumber)) ||
            (role === 'customs_officer' && !formData.badgeId)
          }
          className="bg-[#3ECF8E] hover:bg-[#34b27b] text-black px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_15px_rgba(62,207,142,0.15)]"
        >
          {isSubmitting ? (
            <><Loader2 size={14} className="animate-spin" /> Submitting...</>
          ) : role === 'transporter' ? (
            <>Next: Fleet Declarations (FR-01.2) <ChevronRight size={14} /></>
          ) : (
            'Submit Registration'
          )}
        </button>
      </div>
    </div>
  );

  // STEP 4: Fleet & Haulage Declarations (SRS FR-01.2 - Transporters only)
  const renderStep4 = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="mb-2">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#3ECF8E]/10 text-[#3ECF8E] border border-[#3ECF8E]/20 mb-1.5">
          <Truck size={12} /> SRS FR-01.2 Carrier Fleet Verification & Activation
        </div>
        <h3 className="text-lg font-bold text-[#EDEDED] tracking-tight">Fleet Details & Roadworthiness Declarations</h3>
        <p className="text-xs text-[#8F8F8F]">Mandatory under Ethiopian Transport Authority guidelines for corridor activation.</p>
      </div>
      
      {error && <div className="p-3 bg-red-500/10 text-red-400 text-xs rounded-xl border border-red-500/20">{error}</div>}

      <div className="space-y-3.5 max-h-[50vh] overflow-y-auto pr-1">
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-widest text-[#8F8F8F] mb-1">Primary Heavy Vehicle / Equipment Configuration *</label>
          <select 
            name="vehicleType"
            value={formData.vehicleType}
            onChange={handleChange}
            className="w-full bg-[#1C1C1C] text-[#EDEDED] border border-[#2E2E2E] rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-[#3ECF8E] focus:border-[#3ECF8E] outline-none transition-all"
          >
            <option value="Flatbed Trailer (40ft Containerized)">Flatbed Trailer (40ft Heavy Containerized)</option>
            <option value="Dry Van Heavy Box Truck">Dry Van Heavy Box Truck</option>
            <option value="Fuel / Petroleum Tanker (45,000L)">Fuel / Petroleum Tanker (45,000L Semi-Trailer)</option>
            <option value="Refrigerated Reefer Trailer">Refrigerated Reefer Trailer (Cold Chain)</option>
            <option value="Lowbed Heavy Machinery Carrier">Lowbed Heavy Machinery & Out-of-Gauge Carrier</option>
          </select>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-widest text-[#8F8F8F] mb-1">Active Heavy Fleet Size (Trucks) *</label>
            <input 
              type="number" 
              name="fleetSize"
              value={formData.fleetSize}
              onChange={handleChange}
              min="1"
              required
              className="w-full bg-[#1C1C1C] text-[#EDEDED] font-mono border border-[#2E2E2E] rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-[#3ECF8E] focus:border-[#3ECF8E] outline-none transition-all placeholder-[#8F8F8F]/50" 
              placeholder="e.g. 15" 
            />
          </div>
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-widest text-[#8F8F8F] mb-1">Total Fleet Haulage Capacity *</label>
            <input 
              type="text" 
              name="vehicleCapacity"
              value={formData.vehicleCapacity}
              onChange={handleChange}
              required
              className="w-full bg-[#1C1C1C] text-[#EDEDED] font-mono border border-[#2E2E2E] rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-[#3ECF8E] focus:border-[#3ECF8E] outline-none transition-all placeholder-[#8F8F8F]/50" 
              placeholder="e.g. 600 Metric Tons" 
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-mono uppercase tracking-widest text-[#8F8F8F] mb-1">Goods-In-Transit (GIT) Insurance Policy No. *</label>
          <input 
            type="text" 
            name="insurancePolicy"
            value={formData.insurancePolicy}
            onChange={handleChange}
            required
            className="w-full bg-[#1C1C1C] text-[#EDEDED] font-mono border border-[#2E2E2E] rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-[#3ECF8E] focus:border-[#3ECF8E] outline-none transition-all placeholder-[#8F8F8F]/50" 
            placeholder="e.g. EIC/GIT/2026/09428" 
          />
        </div>

        {/* Upload Certificate Cards */}
        <div className="space-y-1.5 pt-1">
          <label className="block text-[10px] font-mono uppercase tracking-widest text-[#8F8F8F]">Roadworthiness & Libre Certificates</label>
          <div className="grid grid-cols-2 gap-3">
            <div className="border border-[#2E2E2E] hover:border-[#3ECF8E]/60 bg-[#1C1C1C] rounded-xl p-2.5 text-center transition-all cursor-pointer group">
              <UploadCloud size={18} className="mx-auto text-[#8F8F8F] group-hover:text-[#3ECF8E] mb-1 transition-colors" />
              <p className="text-[11px] font-bold text-[#EDEDED]">Annual Roadworthiness Cert</p>
              <p className="text-[9px] font-mono text-[#3ECF8E] mt-0.5 flex items-center justify-center gap-1">
                <CheckCircle2 size={10} /> {formData.libreDocFile}
              </p>
            </div>
            <div className="border border-[#2E2E2E] hover:border-[#3ECF8E]/60 bg-[#1C1C1C] rounded-xl p-2.5 text-center transition-all cursor-pointer group">
              <UploadCloud size={18} className="mx-auto text-[#8F8F8F] group-hover:text-[#3ECF8E] mb-1 transition-colors" />
              <p className="text-[11px] font-bold text-[#EDEDED]">Carrier Insurance Policy</p>
              <p className="text-[9px] font-mono text-[#3ECF8E] mt-0.5 flex items-center justify-center gap-1">
                <CheckCircle2 size={10} /> {formData.insuranceDocFile}
              </p>
            </div>
          </div>
        </div>

        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2 text-[11px] text-red-300">
          <ShieldAlert size={14} className="shrink-0 mt-0.5 text-red-400" />
          <div>
            <strong>FR-01 Acceptance Enforcement:</strong> Unverified transporters are strictly blocked from the "Accept Load" and "Submit Bid" actions until all fleet certificates are verified.
          </div>
        </div>
      </div>

      <div className="pt-3 flex justify-between border-t border-[#2E2E2E]">
        <button onClick={handleBack} disabled={isSubmitting} className="text-[#8F8F8F] hover:text-[#EDEDED] px-4 py-2 text-xs font-bold rounded-lg disabled:opacity-50 transition-colors">Back</button>
        <button 
          onClick={handleSubmit} 
          disabled={isSubmitting || !formData.fleetSize || !formData.insurancePolicy}
          className="bg-[#3ECF8E] hover:bg-[#34b27b] text-black px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(62,207,142,0.15)]"
        >
          {isSubmitting ? (
            <><Loader2 size={14} className="animate-spin" /> Submitting Application...</>
          ) : (
            <>Submit Carrier Application <CheckCircle2 size={14} /></>
          )}
        </button>
      </div>
    </div>
  );

  // SUCCESS CONFIRMATION MODAL
  const renderSuccess = () => (
    <div className="text-center py-6 animate-in zoom-in-95 duration-500">
      <div className="w-14 h-14 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
        <Clock size={28} />
      </div>
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-2.5">
        ● STATUS: PENDING VERIFICATION
      </div>
      <h3 className="text-xl font-bold text-[#EDEDED] tracking-tight mb-1">Registration Submitted for Review</h3>
      
      <p className="text-xs text-[#8F8F8F] max-w-sm mx-auto mb-4 leading-relaxed">
        Your organization credentials for <strong className="text-[#EDEDED]">{formData.companyName || 'your enterprise'}</strong> have been queued for administrative compliance verification.
      </p>

      <div className="bg-[#1C1C1C] border border-[#2E2E2E] rounded-xl p-3.5 max-w-md mx-auto text-left space-y-2 mb-5 text-xs">
        <div className="flex justify-between border-b border-[#2E2E2E]/60 pb-1.5">
          <span className="text-[#8F8F8F]">Assigned Actor Role:</span>
          <span className="font-bold text-[#3ECF8E]">{role?.toUpperCase()}</span>
        </div>
        {formData.taxId && (
          <div className="flex justify-between border-b border-[#2E2E2E]/60 pb-1.5">
            <span className="text-[#8F8F8F]">TIN Number:</span>
            <span className="font-mono text-[#EDEDED]">{formData.taxId}</span>
          </div>
        )}
        {formData.licenseNumber && (
          <div className="flex justify-between border-b border-[#2E2E2E]/60 pb-1.5">
            <span className="text-[#8F8F8F]">Trade / Operator License:</span>
            <span className="font-mono text-[#EDEDED]">{formData.licenseNumber}</span>
          </div>
        )}
        {formData.badgeId && (
          <div className="flex justify-between border-b border-[#2E2E2E]/60 pb-1.5">
            <span className="text-[#8F8F8F]">ECC Badge ID:</span>
            <span className="font-mono text-[#EDEDED]">{formData.badgeId}</span>
          </div>
        )}
        {role === 'transporter' && formData.fleetSize && (
          <div className="flex justify-between border-b border-[#2E2E2E]/60 pb-1.5">
            <span className="text-[#8F8F8F]">Declared Fleet Units:</span>
            <span className="font-mono text-[#EDEDED]">{formData.fleetSize} Heavy Trucks</span>
          </div>
        )}
        <div className="text-[11px] text-amber-300/90 pt-1 leading-normal">
          🔒 <strong>SRS FR-01 Acceptance Notice:</strong> You can browse live corridor telematics and market benchmarks, but critical actions (Accept Load / Post Cargo) remain locked until an Administrator reviews and approves your submission in the Verification Queue.
        </div>
      </div>

      <button 
        onClick={onClose} 
        className="bg-[#3ECF8E] hover:bg-[#34b27b] text-black px-8 py-2.5 rounded-xl text-xs font-bold w-full transition-all shadow-[0_0_15px_rgba(62,207,142,0.15)]"
      >
        Enter TradeFlow Platform
      </button>
    </div>
  );

  // Stepper calculations
  let totalSteps = 3;
  if (role === 'transporter') totalSteps = 4;
  const isSuccess = step > totalSteps;

  return (
    <div className="fixed inset-0 z-[200] bg-[#141414]/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#232323] rounded-3xl w-full max-w-lg shadow-2xl border border-[#2E2E2E] flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header & Stepper */}
        {!isSuccess && (
          <div className="px-6 py-4 border-b border-[#2E2E2E] bg-[#1C1C1C]">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#EDEDED] text-base tracking-tight">Platform Onboarding</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#3ECF8E]/10 text-[#3ECF8E] border border-[#3ECF8E]/20">
                  SRS FR-01
                </span>
              </div>
              <button onClick={onClose} className="text-[#8F8F8F] hover:text-[#EDEDED] transition-colors p-1">
                <X size={18} />
              </button>
            </div>
            
            {/* Visual Stepper */}
            <div className="flex items-center gap-2">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <React.Fragment key={i}>
                  <div className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${step > i ? 'bg-[#3ECF8E] shadow-[0_0_10px_rgba(62,207,142,0.3)]' : 'bg-[#2E2E2E]'}`}></div>
                </React.Fragment>
              ))}
            </div>
            <div className="mt-2 text-[10px] font-mono text-[#8F8F8F] uppercase tracking-widest flex justify-between">
              <span>Step {step} of {totalSteps}</span>
              <span className="text-[#3ECF8E]">
                {step === 1 && 'Personal Profile'}
                {step === 2 && 'Marketplace Actor'}
                {step === 3 && 'Legal Entity Verification'}
                {step === 4 && 'Fleet Specifications'}
              </span>
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto [&::-webkit-scrollbar]:hidden">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && role === 'transporter' && renderStep4()}
          {isSuccess && renderSuccess()}
        </div>

      </div>
    </div>
  );
}
