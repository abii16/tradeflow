import React, { useState } from 'react';
import { Scale, CheckCircle2, AlertCircle, X } from 'lucide-react';

interface DisputeFormModalProps {
  transactionId: string;
  onClose: () => void;
}

export default function DisputeFormModal({ transactionId, onClose }: DisputeFormModalProps) {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = () => {
    setIsSubmitted(true);
    setTimeout(() => onClose(), 2500);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-md shadow-lg border border-slate-200 flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Scale size={16} className="text-amber-600" />
            <h3 className="text-sm font-semibold text-slate-900">Raise Payment Dispute</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-md hover:bg-slate-100 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {!isSubmitted ? (
            <div className="space-y-4">
              <div className="bg-amber-50/70 border border-amber-200 rounded-md p-3 text-xs text-amber-800 flex items-start gap-2">
                <AlertCircle size={15} className="text-amber-600 shrink-0 mt-0.5" />
                <p>You are disputing transaction <span className="font-mono font-semibold">{transactionId}</span>. This will freeze the associated escrow funds until mediation is complete.</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Dispute Reason</label>
                <select 
                  value={reason} 
                  onChange={(e) => setReason(e.target.value)} 
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-xs bg-white focus:ring-1 focus:ring-slate-900 focus:border-slate-900 outline-none"
                >
                  <option value="" disabled>Select a reason...</option>
                  <option value="delay">Unjustified Delay Penalty</option>
                  <option value="fuel">Fuel Surcharge Mismatch</option>
                  <option value="damage">Cargo Damage/Shortage Claim</option>
                  <option value="payment">Payment Amount Incorrect</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Detailed Description</label>
                <textarea 
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-slate-300 rounded-md p-2.5 text-xs focus:ring-1 focus:ring-slate-900 focus:border-slate-900 outline-none resize-none"
                  placeholder="Provide detailed evidence or timestamps. Operations will review GPS and telematics logs."
                ></textarea>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button 
                  onClick={onClose}
                  className="px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 border border-slate-300 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button 
                  disabled={!reason || !description}
                  onClick={handleSubmit}
                  className="bg-amber-600 text-white px-4 py-2 rounded-md text-xs font-medium hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Submit Dispute
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-5">
              <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto mb-3">
                <Scale size={24} />
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-1">Dispute Filed</h3>
              <p className="text-xs text-slate-600 max-w-sm mx-auto mb-1">
                Ticket <span className="font-mono font-semibold text-slate-900">DISP-9982</span> has been routed to the Admin Control Tower.
              </p>
              <p className="text-[11px] text-slate-400">You will be notified once a resolution is reached.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
