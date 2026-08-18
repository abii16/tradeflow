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
    <div className="fixed inset-0 z-[200] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2">
            <Scale size={18} className="text-amber-600" />
            <h3 className="font-bold text-slate-900">Raise Payment Dispute</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!isSubmitted ? (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 flex items-start gap-2">
                <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <p>You are disputing transaction <span className="font-mono font-bold">{transactionId}</span>. This will freeze the associated escrow funds until mediation is complete.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Dispute Reason</label>
                <select 
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-white"
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
                <label className="block text-xs font-bold text-slate-700 mb-1">Detailed Description</label>
                <textarea 
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                  placeholder="Provide detailed evidence or timestamps. Operations will review GPS and telematics logs."
                ></textarea>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button 
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button 
                  disabled={!reason || !description}
                  onClick={handleSubmit}
                  className="bg-amber-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Submit Dispute
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Scale size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Dispute Filed</h3>
              <p className="text-sm text-slate-600 max-w-sm mx-auto mb-2">
                Ticket <span className="font-mono font-bold text-slate-900">DISP-9982</span> has been routed to the Admin Control Tower.
              </p>
              <p className="text-[11px] text-slate-500">You will be notified once a resolution is reached.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
