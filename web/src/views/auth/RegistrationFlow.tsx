import React, { useState } from 'react';
import { Building2, Truck, Briefcase, ChevronRight, CheckCircle2, UploadCloud, X } from 'lucide-react';

interface RegistrationFlowProps {
  onClose: () => void;
}

export default function RegistrationFlow({ onClose }: RegistrationFlowProps) {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<'shipper' | 'transporter' | 'forwarder' | null>(null);

  const handleNext = () => setStep((s) => s + 1);
  const handleBack = () => setStep((s) => s - 1);

  const renderStep1 = () => (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-slate-900 mb-6">Select your primary role</h3>
      
      <button 
        onClick={() => setRole('shipper')}
        className={`w-full flex items-center gap-4 p-4 rounded-xl border ${role === 'shipper' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-400'} text-left transition-colors`}
      >
        <div className={`p-3 rounded-lg ${role === 'shipper' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
          <Building2 size={24} />
        </div>
        <div>
          <div className="font-bold text-slate-900">Shipper / Importer</div>
          <div className="text-xs text-slate-500">I want to post cargo and get transport rates</div>
        </div>
      </button>

      <button 
        onClick={() => setRole('forwarder')}
        className={`w-full flex items-center gap-4 p-4 rounded-xl border ${role === 'forwarder' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-indigo-400'} text-left transition-colors`}
      >
        <div className={`p-3 rounded-lg ${role === 'forwarder' ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
          <Briefcase size={24} />
        </div>
        <div>
          <div className="font-bold text-slate-900">Freight Forwarder</div>
          <div className="text-xs text-slate-500">I manage cargo and customs for multiple clients</div>
        </div>
      </button>

      <button 
        onClick={() => setRole('transporter')}
        className={`w-full flex items-center gap-4 p-4 rounded-xl border ${role === 'transporter' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-emerald-400'} text-left transition-colors`}
      >
        <div className={`p-3 rounded-lg ${role === 'transporter' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
          <Truck size={24} />
        </div>
        <div>
          <div className="font-bold text-slate-900">Transporter / Fleet Owner</div>
          <div className="text-xs text-slate-500">I have trucks and want to accept freight loads</div>
        </div>
      </button>

      <div className="pt-4 flex justify-end">
        <button 
          disabled={!role}
          onClick={handleNext} 
          className="bg-slate-900 text-white px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-slate-900 mb-6">Business Details</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Company / Legal Name</label>
          <input type="text" className="w-full border border-slate-300 rounded-lg p-2.5 text-sm" placeholder="e.g. Abyssinia Transit PLC" />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Tax ID (TIN)</label>
            <input type="text" className="w-full border border-slate-300 rounded-lg p-2.5 text-sm" placeholder="10 digit number" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Trade License No.</label>
            <input type="text" className="w-full border border-slate-300 rounded-lg p-2.5 text-sm" placeholder="MTI/..." />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Upload Business Documents</label>
          <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50 transition-colors cursor-pointer">
            <UploadCloud size={24} className="mx-auto text-slate-400 mb-2" />
            <p className="text-sm font-medium text-blue-600">Click to upload Trade License & TIN</p>
            <p className="text-xs text-slate-500 mt-1">PDF or JPEG, max 5MB</p>
          </div>
        </div>
      </div>

      <div className="pt-6 flex justify-between">
        <button onClick={handleBack} className="text-slate-600 px-4 py-2 text-sm font-bold hover:bg-slate-100 rounded-lg">Back</button>
        <button 
          onClick={handleNext} 
          className="bg-slate-900 text-white px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2"
        >
          {role === 'transporter' ? 'Next: Fleet Details' : 'Submit Registration'} <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-slate-900 mb-6">Fleet Declarations</h3>
      
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
        <button onClick={handleBack} className="text-slate-600 px-4 py-2 text-sm font-bold hover:bg-slate-100 rounded-lg">Back</button>
        <button 
          onClick={handleNext} 
          className="bg-emerald-600 text-white px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-emerald-700"
        >
          Submit Application <CheckCircle2 size={16} />
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
        Your application is now under review by the Verification Queue administrators (FR-01.4). You will receive an email once approved.
      </p>
      <button 
        onClick={onClose} 
        className="bg-slate-900 text-white px-8 py-3 rounded-xl text-sm font-bold w-full"
      >
        Return to Home
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
            {step < 4 && <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-xs font-mono">Step {step} of {role === 'transporter' ? 3 : 2}</span>}
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
