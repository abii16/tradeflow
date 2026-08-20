import React, { useState } from 'react';
import { UploadCloud, CheckCircle2, AlertTriangle, X } from 'lucide-react';

interface CustomsDocumentUploadModalProps {
  manifestId: string;
  onClose: () => void;
}

export default function CustomsDocumentUploadModal({ manifestId, onClose }: CustomsDocumentUploadModalProps) {
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
    <div className="fixed inset-0 z-[200] bg-slate-950/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-lg shadow-lg border border-slate-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Customs Clearance Docs</h3>
            <p className="text-[11px] font-mono text-slate-500 mt-0.5">{manifestId}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-md hover:bg-slate-100 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto">
          {!isComplete ? (
            <div className="space-y-4">
              
              <div className="bg-blue-50/70 border border-blue-200 rounded-md p-3 text-xs text-blue-900 flex items-start gap-2.5">
                <AlertTriangle size={15} className="text-blue-600 shrink-0 mt-0.5" />
                <p><strong>FR-06 Validation Rules:</strong> Provide the exact invoice value and cargo weight. These will be checked against the uploaded Commercial Invoice and Bill of Lading using OCR.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Declared Value ($)</label>
                  <input 
                    type="number" 
                    value={invoiceValue}
                    onChange={(e) => setInvoiceValue(e.target.value)}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-xs focus:ring-1 focus:ring-slate-900 focus:border-slate-900 outline-none" 
                    placeholder="e.g. 45000" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Total Weight (KG)</label>
                  <input 
                    type="number" 
                    value={cargoWeight}
                    onChange={(e) => setCargoWeight(e.target.value)}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-xs focus:ring-1 focus:ring-slate-900 focus:border-slate-900 outline-none" 
                    placeholder="e.g. 24500" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Document Bundle (CI, PL, BL, COO)</label>
                <div className="border border-dashed border-slate-300 rounded-md p-6 text-center hover:bg-slate-50/60 hover:border-slate-400 transition-colors cursor-pointer group">
                  <UploadCloud size={24} className="mx-auto text-slate-400 group-hover:text-slate-700 transition-colors mb-2" />
                  <p className="text-xs font-medium text-slate-900 mb-0.5">Drag and drop PDF bundle here</p>
                  <p className="text-[11px] text-slate-400">PDF or JPEG (Max 20MB)</p>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button 
                  onClick={onClose}
                  className="px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 border border-slate-300 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button 
                  disabled={!invoiceValue || !cargoWeight || isUploading}
                  onClick={handleUpload}
                  className="bg-slate-900 text-white px-4 py-2 rounded-md text-xs font-medium flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors"
                >
                  {isUploading ? 'Validating Docs...' : 'Submit & Validate'}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-3 border border-emerald-200">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-1">Documents Validated</h3>
              <p className="text-xs text-slate-600 max-w-sm mx-auto mb-4 leading-relaxed">
                The structured data matches the extracted document text. The bundle has been cryptographically hashed and submitted to the Customs queue.
              </p>
              <div className="bg-slate-50 border border-slate-200 rounded p-2 text-[10px] font-mono text-slate-500 break-all mb-5">
                HASH: 8a6f9c4d2e1b3a5f7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b
              </div>
              <button 
                onClick={onClose} 
                className="w-full bg-slate-900 text-white px-4 py-2.5 rounded-md text-xs font-medium hover:bg-slate-800 transition-colors"
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
