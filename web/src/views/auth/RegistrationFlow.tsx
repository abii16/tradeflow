import React, { useState } from 'react';
import { Building2, Truck, Briefcase, ChevronRight, CheckCircle2, UploadCloud, X, Loader2, Eye, EyeOff, ShieldCheck, UserCog } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface RegistrationFlowProps {
  onClose: () => void;
}

export default function RegistrationFlow({ onClose }: RegistrationFlowProps) {
  const { register } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Form State
  const [role, setRole] = useState<'shipper' | 'transporter' | 'forwarder' | 'customs_officer' | 'admin' | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    companyName: '',
    taxId: '',
    licenseNumber: '',
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
      // Map frontend role to backend enum
      let mappedRole = 'SHIPPER';
      if (role === 'transporter') mappedRole = 'TRANSPORTER';
      if (role === 'forwarder') mappedRole = 'FORWARDER';
      if (role === 'customs_officer') mappedRole = 'CUSTOMS_OFFICER';
      if (role === 'admin') mappedRole = 'ADMIN';

      await register({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        phone: formData.phone,
        role: mappedRole,
        companyName: formData.companyName,
        licenseNumber: formData.licenseNumber || formData.taxId,
      });

      setStep(role === 'transporter' ? 5 : 4); // Go to success step
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleOptions = [
    { id: 'shipper', title: 'Shipper / Importer', desc: 'I need to move freight', icon: Briefcase },
    { id: 'transporter', title: 'Transporter', desc: 'I own a truck or fleet', icon: Truck },
    { id: 'forwarder', title: 'Freight Forwarder', desc: 'I act as an intermediary', icon: Building2 },
    { id: 'customs_officer', title: 'Customs Officer', desc: 'ECC Official Only', icon: ShieldCheck },
    { id: 'admin', title: 'Administrator', desc: 'System Admin', icon: UserCog },
  ];

  const renderStep1 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-[#EDEDED] tracking-tight mb-1">Account Details</h3>
        <p className="text-sm text-[#8F8F8F]">Create your profile to get started.</p>
      </div>

      {/* Google Button */}
      <button className="w-full flex items-center justify-center gap-3 bg-[#232323] hover:bg-[#2A2A2A] text-[#EDEDED] border border-[#2E2E2E] hover:border-[#8F8F8F] transition-all px-4 py-3 rounded-xl font-bold text-sm mb-6">
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
          <label className="block text-[10px] font-mono uppercase tracking-widest text-[#8F8F8F] mb-1.5">Full Name</label>
          <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="w-full bg-[#1C1C1C] text-[#EDEDED] border border-[#2E2E2E] rounded-xl p-3 text-sm focus:ring-1 focus:ring-[#3ECF8E] focus:border-[#3ECF8E] outline-none transition-all placeholder-[#8F8F8F]/50" placeholder="John Doe" />
        </div>
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-widest text-[#8F8F8F] mb-1.5">Email Address</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-[#1C1C1C] text-[#EDEDED] border border-[#2E2E2E] rounded-xl p-3 text-sm focus:ring-1 focus:ring-[#3ECF8E] focus:border-[#3ECF8E] outline-none transition-all placeholder-[#8F8F8F]/50" placeholder="john@example.com" />
        </div>
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-widest text-[#8F8F8F] mb-1.5">Phone Number</label>
          <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full bg-[#1C1C1C] text-[#EDEDED] border border-[#2E2E2E] rounded-xl p-3 text-sm focus:ring-1 focus:ring-[#3ECF8E] focus:border-[#3ECF8E] outline-none transition-all placeholder-[#8F8F8F]/50" placeholder="+251 911 234 567" />
        </div>
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-widest text-[#8F8F8F] mb-1.5">Password</label>
          <div className="relative">
            <input 
              type={showPassword ? 'text' : 'password'} 
              name="password" 
              value={formData.password} 
              onChange={handleChange} 
              className="w-full bg-[#1C1C1C] text-[#EDEDED] border border-[#2E2E2E] rounded-xl p-3 pr-10 text-sm focus:ring-1 focus:ring-[#3ECF8E] focus:border-[#3ECF8E] outline-none transition-all placeholder-[#8F8F8F]/50" 
              placeholder="Min 8 chars, 1 special char (!@#$)" 
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8F8F8F] hover:text-[#EDEDED] focus:outline-none transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
      </div>

      <div className="pt-6 flex justify-end border-t border-[#2E2E2E]">
        <button 
          onClick={handleNext} 
          disabled={!formData.fullName || !formData.email || !formData.password}
          className="bg-[#3ECF8E] hover:bg-[#34b27b] text-black px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(62,207,142,0.15)]"
        >
          Next Step <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="mb-8 text-center">
        <h3 className="text-xl font-bold text-[#EDEDED] tracking-tight mb-2">Select your primary role</h3>
        <p className="text-sm text-[#8F8F8F]">Choose how you will interact with the platform.</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {roleOptions.map(r => (
          <div 
            key={r.id} 
            onClick={() => setRole(r.id as any)}
            className={`cursor-pointer border rounded-2xl p-4 flex flex-col items-center text-center transition-all duration-200 ${
              role === r.id 
                ? 'bg-[#3ECF8E]/10 border-[#3ECF8E] shadow-[0_0_20px_rgba(62,207,142,0.15)] transform scale-[1.02]' 
                : 'bg-[#1C1C1C] border-[#2E2E2E] hover:border-[#8F8F8F] hover:bg-[#232323]'
            }`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${role === r.id ? 'bg-[#3ECF8E] text-black' : 'bg-[#2E2E2E] text-[#8F8F8F]'}`}>
              <r.icon size={20} />
            </div>
            <div className="font-bold text-sm text-[#EDEDED] mb-1">{r.title}</div>
            <div className="text-[11px] font-mono tracking-wide text-[#8F8F8F]">{r.desc}</div>
          </div>
        ))}
      </div>

      <div className="pt-6 flex justify-between border-t border-[#2E2E2E]">
        <button onClick={handleBack} className="text-[#8F8F8F] hover:text-[#EDEDED] px-4 py-2 text-sm font-bold rounded-lg transition-colors">Back</button>
        <button 
          disabled={!role}
          onClick={role === 'admin' || role === 'customs_officer' ? handleSubmit : handleNext} 
          className="bg-[#3ECF8E] hover:bg-[#34b27b] text-black px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_15px_rgba(62,207,142,0.15)]"
        >
          {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Submitting...</> : (role === 'admin' || role === 'customs_officer' ? 'Submit Registration' : 'Continue')}
          {!isSubmitting && <ChevronRight size={16} />}
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-[#EDEDED] tracking-tight mb-1">Business Details</h3>
        <p className="text-sm text-[#8F8F8F]">Provide your legal entity information.</p>
      </div>
      
      {error && <div className="p-3 bg-red-500/10 text-red-400 text-sm rounded-lg border border-red-500/20 mb-4">{error}</div>}

      <div className="space-y-4">
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-widest text-[#8F8F8F] mb-1.5">Company / Legal Name</label>
          <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} className="w-full bg-[#1C1C1C] text-[#EDEDED] border border-[#2E2E2E] rounded-xl p-3 text-sm focus:ring-1 focus:ring-[#3ECF8E] focus:border-[#3ECF8E] outline-none transition-all placeholder-[#8F8F8F]/50" placeholder="e.g. Abyssinia Transit PLC" />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-widest text-[#8F8F8F] mb-1.5">Tax ID (TIN)</label>
            <input type="text" name="taxId" value={formData.taxId} onChange={handleChange} className="w-full bg-[#1C1C1C] text-[#EDEDED] border border-[#2E2E2E] rounded-xl p-3 text-sm focus:ring-1 focus:ring-[#3ECF8E] focus:border-[#3ECF8E] outline-none transition-all placeholder-[#8F8F8F]/50" placeholder="10 digit number" />
          </div>
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-widest text-[#8F8F8F] mb-1.5">Trade License No.</label>
            <input type="text" name="licenseNumber" value={formData.licenseNumber} onChange={handleChange} className="w-full bg-[#1C1C1C] text-[#EDEDED] border border-[#2E2E2E] rounded-xl p-3 text-sm focus:ring-1 focus:ring-[#3ECF8E] focus:border-[#3ECF8E] outline-none transition-all placeholder-[#8F8F8F]/50" placeholder="MTI/..." />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-mono uppercase tracking-widest text-[#8F8F8F] mb-1.5">Upload Business Documents</label>
          <div className="border-2 border-dashed border-[#2E2E2E] hover:border-[#3ECF8E]/50 bg-[#1C1C1C] rounded-xl p-8 text-center transition-all cursor-pointer group">
            <UploadCloud size={28} className="mx-auto text-[#8F8F8F] group-hover:text-[#3ECF8E] mb-3 transition-colors" />
            <p className="text-sm font-bold text-[#EDEDED]">Click to upload Trade License & TIN</p>
            <p className="text-[10px] font-mono tracking-widest text-[#8F8F8F] mt-2">PDF OR JPEG, MAX 5MB</p>
          </div>
        </div>
      </div>

      <div className="pt-6 flex justify-between border-t border-[#2E2E2E]">
        <button onClick={handleBack} disabled={isSubmitting} className="text-[#8F8F8F] hover:text-[#EDEDED] px-4 py-2 text-sm font-bold rounded-lg disabled:opacity-50 transition-colors">Back</button>
        <button 
          onClick={role === 'transporter' ? handleNext : handleSubmit} 
          disabled={isSubmitting || !formData.companyName}
          className="bg-[#3ECF8E] hover:bg-[#34b27b] text-black px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(62,207,142,0.15)]"
        >
          {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Submitting...</> : (role === 'transporter' ? 'Next: Fleet Details' : 'Submit Registration')}
          {!isSubmitting && <ChevronRight size={16} />}
        </button>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-[#EDEDED] tracking-tight mb-1">Fleet Declarations</h3>
        <p className="text-sm text-[#8F8F8F]">Transporter verification details.</p>
      </div>
      
      {error && <div className="p-3 bg-red-500/10 text-red-400 text-sm rounded-lg border border-red-500/20 mb-4">{error}</div>}

      <div className="space-y-4">
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-widest text-[#8F8F8F] mb-1.5">Primary Vehicle Types</label>
          <select className="w-full bg-[#1C1C1C] text-[#EDEDED] border border-[#2E2E2E] rounded-xl p-3 text-sm focus:ring-1 focus:ring-[#3ECF8E] focus:border-[#3ECF8E] outline-none transition-all">
            <option>Flatbed Trailer (40ft)</option>
            <option>Dry Van Box Truck</option>
            <option>Fuel Tanker</option>
            <option>Refrigerated Trailer</option>
          </select>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-widest text-[#8F8F8F] mb-1.5">Total Fleet Size</label>
            <input type="number" className="w-full bg-[#1C1C1C] text-[#EDEDED] border border-[#2E2E2E] rounded-xl p-3 text-sm focus:ring-1 focus:ring-[#3ECF8E] focus:border-[#3ECF8E] outline-none transition-all placeholder-[#8F8F8F]/50" placeholder="Number of trucks" />
          </div>
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-widest text-[#8F8F8F] mb-1.5">Insurance Policy No.</label>
            <input type="text" className="w-full bg-[#1C1C1C] text-[#EDEDED] border border-[#2E2E2E] rounded-xl p-3 text-sm focus:ring-1 focus:ring-[#3ECF8E] focus:border-[#3ECF8E] outline-none transition-all placeholder-[#8F8F8F]/50" placeholder="Policy ID" />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-mono uppercase tracking-widest text-[#8F8F8F] mb-1.5">Upload Roadworthiness Certificate</label>
          <div className="border-2 border-dashed border-[#2E2E2E] hover:border-[#3ECF8E]/50 bg-[#1C1C1C] rounded-xl p-8 text-center transition-all cursor-pointer group">
            <UploadCloud size={28} className="mx-auto text-[#8F8F8F] group-hover:text-[#3ECF8E] mb-3 transition-colors" />
            <p className="text-sm font-bold text-[#EDEDED]">Click to upload Libre/Certificate</p>
          </div>
        </div>
      </div>

      <div className="pt-6 flex justify-between border-t border-[#2E2E2E]">
        <button onClick={handleBack} disabled={isSubmitting} className="text-[#8F8F8F] hover:text-[#EDEDED] px-4 py-2 text-sm font-bold rounded-lg disabled:opacity-50 transition-colors">Back</button>
        <button 
          onClick={handleSubmit} 
          disabled={isSubmitting}
          className="bg-[#3ECF8E] hover:bg-[#34b27b] text-black px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(62,207,142,0.15)]"
        >
          {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Submitting...</> : <>Submit Application <CheckCircle2 size={16} /></>}
        </button>
      </div>
    </div>
  );

  const renderSuccess = () => (
    <div className="text-center py-10 animate-in zoom-in-95 duration-500">
      <div className="w-20 h-20 bg-[#3ECF8E]/10 text-[#3ECF8E] border border-[#3ECF8E]/30 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(62,207,142,0.2)]">
        <CheckCircle2 size={40} />
      </div>
      <h3 className="text-2xl font-bold text-[#EDEDED] tracking-tight mb-3">Registration Submitted!</h3>
      <p className="text-sm text-[#8F8F8F] max-w-sm mx-auto mb-8 leading-relaxed">
        Your account has been created successfully. You are now logged in and can access the platform, but some features may require Verification Queue administrator approval.
      </p>
      <button 
        onClick={onClose} 
        className="bg-[#3ECF8E] hover:bg-[#34b27b] text-black px-8 py-3.5 rounded-xl text-sm font-bold w-full transition-all shadow-[0_0_15px_rgba(62,207,142,0.15)]"
      >
        Access Portal
      </button>
    </div>
  );

  // Total steps logic based on role selected in step 2
  let totalSteps = 3;
  if (role === 'transporter') totalSteps = 4;
  if (role === 'admin' || role === 'customs_officer') totalSteps = 2; // They don't need company details
  
  const isSuccess = step > totalSteps;

  return (
    <div className="fixed inset-0 z-[200] bg-[#141414]/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#232323] rounded-3xl w-full max-w-lg shadow-2xl border border-[#2E2E2E] flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header & Stepper */}
        {!isSuccess && (
          <div className="px-6 py-5 border-b border-[#2E2E2E] bg-[#1C1C1C]">
            <div className="flex justify-between items-center mb-6">
              <span className="font-bold text-[#EDEDED] text-lg tracking-tight">Platform Onboarding</span>
              <button onClick={onClose} className="text-[#8F8F8F] hover:text-[#EDEDED] transition-colors">
                <X size={20} />
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
            <div className="mt-2 text-[10px] font-mono text-[#8F8F8F] uppercase tracking-widest">
              Step {step} of {totalSteps}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-8 overflow-y-auto [&::-webkit-scrollbar]:hidden">
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
