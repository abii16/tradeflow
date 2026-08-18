import React, { useState } from 'react';
import { UploadCloud, CheckCircle2, FileText, AlertTriangle, X } from 'lucide-react';

interface CustomsDocumentUploadModalProps {
  manifestId: string;
  onClose: () => void;
}

export default function CustomsDocumentUploadModal({ manifestId, onClose }: CustomsDocumentUploadModalProps) {
  const [step, setStep] = useState(1);
  const [invoiceValue, setInvoiceValue] = useState('');
  const [cargoWeight, setCargoWeight] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const handleUpload = () => {
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      setIsComplete(true);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="font-bold text-slate-900">Customs Clearance Docs</h3>
            <p className="text-[11px] font-mono text-slate-500">{manifestId}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {!isComplete ? (
            <div className="space-y-6">
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800 flex items-start gap-3">
                <AlertTriangle size={16} className="text-blue-600 mt-0.5" />
                <p><strong>FR-06 Validation Rules:</strong> Please provide the exact invoice value and cargo weight. These will be automatically checked against the uploaded Commercial Invoice and Bill of Lading using OCR.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Declared Invoice Value ($)</label>
                  <input 
                    type="number" 
                    value={invoiceValue}
                    onChange={(e) => setInvoiceValue(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm" 
                    placeholder="e.g. 45000" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Total Weight (KG)</label>
                  <input 
                    type="number" 
                    value={cargoWeight}
                    onChange={(e) => setCargoWeight(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm" 
                    placeholder="e.g. 24500" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Document Bundle (CI, PL, BL, COO)</label>
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors cursor-pointer group">
                  <UploadCloud size={32} className="mx-auto text-slate-400 group-hover:text-blue-500 transition-colors mb-3" />
                  <p className="text-sm font-medium text-slate-900 mb-1">Drag and drop your PDF bundle here</p>
                  <p className="text-xs text-slate-500">Or click to browse files (Max 20MB)</p>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button 
                  disabled={!invoiceValue || !cargoWeight || isUploading}
                  onClick={handleUpload}
                  className="bg-slate-900 text-white px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? 'Validating Docs...' : 'Submit & Validate'}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Documents Validated</h3>
              <p className="text-sm text-slate-600 max-w-sm mx-auto mb-6">
                The structured data matches the extracted document text. The bundle has been cryptographically hashed and submitted to the Customs queue.
              </p>
              <div className="bg-slate-50 border border-slate-200 rounded p-3 text-[10px] font-mono text-slate-500 break-all mb-8">
                HASH: 8a6f9c4d2e1b3a5f7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b
              </div>
              <button 
                onClick={onClose} 
                className="bg-slate-900 text-white px-8 py-3 rounded-xl text-sm font-bold w-full"
              >
                Return to Vault
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
