import React, { useState } from 'react';
import { Building2, Truck, Briefcase, ChevronRight, CheckCircle2, UploadCloud, X, Loader2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface RegistrationFlowProps {
  onClose: () => void;
}

export default function RegistrationFlow({ onClose }: RegistrationFlowProps) {
  const { register } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [role, setRole] = useState<'shipper' | 'transporter' | 'forwarder' | 'customs' | 'admin' | null>(null);
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
      if (role === 'customs') mappedRole = 'CUSTOMS_OFFICER';

      if (role === 'admin') mappedRole = 'ADMIN';

      await register({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        phone: formData.phone,
        role: mappedRole,
        companyName: ['customs', 'admin'].includes(role as string) ? undefined : formData.companyName,
        tinNumber: ['customs', 'admin'].includes(role as string) ? undefined : formData.taxId,
        tradeLicense: ['customs', 'admin'].includes(role as string) ? undefined : formData.licenseNumber,
        badgeId: role === 'customs' ? formData.taxId : undefined, // using taxId input as badgeId for customs for simplicity in UI state
      });

      setStep(role === 'transporter' ? 4 : 3); // Go to success step
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-slate-900 mb-6">Account Details</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
          <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm" placeholder="John Doe" />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm" placeholder="john@example.com" />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
          <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm" placeholder="+251 911 234 567" />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
          <input type="password" name="password" value={formData.password} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm" placeholder="Minimum 8 characters" />
        </div>
      </div>

      <div className="pt-6 flex justify-between">
        <button onClick={onClose} className="text-slate-600 px-4 py-2 text-sm font-bold hover:bg-slate-100 rounded-lg">Cancel</button>
        <button 
          onClick={handleNext} 
          disabled={!formData.fullName || !formData.email || !formData.password}
          className="bg-slate-900 text-white px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 disabled:opacity-50"
        >
          Next: Business Info <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-slate-900 mb-6">Business Details</h3>
      
      {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200 mb-4">{error}</div>}

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Primary Role</label>
          <select 
            value={role || ''} 
            onChange={(e) => setRole(e.target.value as any)} 
            className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-white"
            required
          >
            <option value="" disabled>Select your role...</option>
            <option value="shipper">Shipper / Importer</option>
            <option value="forwarder">Freight Forwarder</option>
            <option value="transporter">Transporter / Fleet Owner</option>
            <option value="customs">Customs Inspector</option>
            <option value="admin">System Administrator</option>
          </select>
        </div>

        {!['customs', 'admin'].includes(role as string) && (
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Company / Legal Name</label>
            <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm" placeholder="e.g. Abyssinia Transit PLC" />
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-4">
          {!['admin'].includes(role as string) && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{role === 'customs' ? 'Badge ID' : 'Tax ID (TIN)'}</label>
              <input type="text" name="taxId" value={formData.taxId} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm" placeholder={role === 'customs' ? 'Customs Badge Number' : '10 digit number'} />
            </div>
          )}
          {!['customs', 'admin'].includes(role as string) && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Trade License No.</label>
              <input type="text" name="licenseNumber" value={formData.licenseNumber} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm" placeholder="MTI/..." />
            </div>
          )}
        </div>

        {!['customs', 'admin'].includes(role as string) && (
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Upload Business Documents</label>
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50 transition-colors cursor-pointer">
              <UploadCloud size={24} className="mx-auto text-slate-400 mb-2" />
              <p className="text-sm font-medium text-blue-600">Click to upload Trade License & TIN</p>
              <p className="text-xs text-slate-500 mt-1">PDF or JPEG, max 5MB</p>
            </div>
          </div>
        )}
      </div>

      <div className="pt-6 flex justify-between">
        <button onClick={handleBack} disabled={isSubmitting} className="text-slate-600 px-4 py-2 text-sm font-bold hover:bg-slate-100 rounded-lg disabled:opacity-50">Back</button>
        <button 
          onClick={role === 'transporter' ? handleNext : handleSubmit} 
          disabled={isSubmitting || (!['customs', 'admin'].includes(role as string) && !formData.companyName) || !role}
          className="bg-slate-900 text-white px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 disabled:opacity-50"
        >
          {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Submitting...</> : (role === 'transporter' ? 'Next: Fleet Details' : 'Submit Registration')}
          {!isSubmitting && <ChevronRight size={16} />}
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-slate-900 mb-6">Fleet Declarations</h3>
      
      {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200 mb-4">{error}</div>}

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Primary Vehicle Types</label>
          <select className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-white">
            <option>Flatbed Trailer (40ft)</option>
            <option>Dry Van Box Truck</option>
            <option>Fuel Tanker</option>
            <option>Refrigerated Trailer</option>
          </select>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Total Fleet Size</label>
            <input type="number" className="w-full border border-slate-300 rounded-lg p-2.5 text-sm" placeholder="Number of trucks" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Insurance Policy No.</label>
            <input type="text" className="w-full border border-slate-300 rounded-lg p-2.5 text-sm" placeholder="Policy ID" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Upload Roadworthiness Certificate</label>
          <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50 transition-colors cursor-pointer">
            <UploadCloud size={24} className="mx-auto text-slate-400 mb-2" />
            <p className="text-sm font-medium text-emerald-600">Click to upload Libre/Certificate</p>
          </div>
        </div>
      </div>

      <div className="pt-6 flex justify-between">
        <button onClick={handleBack} disabled={isSubmitting} className="text-slate-600 px-4 py-2 text-sm font-bold hover:bg-slate-100 rounded-lg disabled:opacity-50">Back</button>
        <button 
          onClick={handleSubmit} 
          disabled={isSubmitting}
          className="bg-emerald-600 text-white px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-emerald-700 disabled:opacity-50"
        >
          {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Submitting...</> : <>Submit Application <CheckCircle2 size={16} /></>}
        </button>
      </div>
    </div>
  );

  const renderSuccess = () => (
    <div className="text-center py-8">
      <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle2 size={32} />
      </div>
      <h3 className="text-2xl font-bold text-slate-900 mb-2">Registration Submitted!</h3>
      <p className="text-sm text-slate-600 max-w-sm mx-auto mb-8">
        Your account has been created successfully. You are now logged in and can access the platform, but some features may require Verification Queue administrator approval (FR-01.4).
      </p>
      <button 
        onClick={onClose} 
        className="bg-slate-900 text-white px-8 py-3 rounded-xl text-sm font-bold w-full"
      >
        Go to Portal
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">Platform Onboarding</span>
            {step < (role === 'transporter' ? 4 : 3) && <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-xs font-mono">Step {step} of {role === 'transporter' ? 3 : 2}</span>}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && role === 'transporter' && renderStep3()}
          {step === 3 && role !== 'transporter' && renderSuccess()}
          {step === 4 && renderSuccess()}
        </div>

      </div>
    </div>
  );
}
