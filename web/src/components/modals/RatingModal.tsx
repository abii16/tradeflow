import React, { useState } from 'react';
import { Star, X, CheckCircle2, Award, ShieldCheck, Loader2 } from 'lucide-react';

interface RatingModalProps {
  transporterName: string;
  shipmentId: string;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => Promise<void> | void;
}

export default function RatingModal({ transporterName, shipmentId, onClose, onSubmit }: RatingModalProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      await onSubmit(rating, comment);
      setSubmitted(true);
      setTimeout(() => onClose(), 1800);
    } catch (e) {
      // quiet catch, error toast handled by parent
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 z-[200] bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div className="bg-[#1C1C1C] rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center border border-[#3ECF8E]/30 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#3ECF8E] to-emerald-400" />
          <div className="w-14 h-14 rounded-2xl bg-[#3ECF8E]/10 border border-[#3ECF8E]/30 text-[#3ECF8E] flex items-center justify-center mx-auto mb-3 shadow-[0_0_20px_rgba(62,207,142,0.2)]">
            <CheckCircle2 size={32} />
          </div>
          <h3 className="text-base font-bold text-[#EDEDED] mb-1">Carrier Rating Recorded</h3>
          <p className="text-xs text-[#8F8F8F]">
            Your verified feedback for <span className="text-[#3ECF8E] font-medium">{transporterName}</span> has been permanently registered to the corridor performance index.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#1C1C1C] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-[#2E2E2E] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#2E2E2E] bg-[#171717] flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Award size={15} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#EDEDED]">Rate Corridor Transporter</h3>
              <p className="text-[10px] font-mono text-[#8F8F8F]">{shipmentId}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-[#8F8F8F] hover:text-[#EDEDED] p-1.5 rounded-lg hover:bg-[#232323] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="text-center">
            <p className="text-xs text-[#8F8F8F] mb-3">
              How was your service experience with{' '}
              <strong className="text-[#EDEDED]">{transporterName}</strong>?
            </p>
            
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 focus:outline-none transition-transform hover:scale-110 active:scale-95"
                >
                  <Star 
                    size={28} 
                    className={`${(hoverRating || rating) >= star ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]' : 'text-[#3A3A3A] hover:text-[#555]'} transition-all`} 
                  />
                </button>
              ))}
            </div>

            <div className="mt-2 text-xs font-mono font-bold text-amber-400 h-4">
              {rating === 1 && '★ 1.0 — Needs Significant Improvement'}
              {rating === 2 && '★★ 2.0 — Below Corridor Standards'}
              {rating === 3 && '★★★ 3.0 — Satisfactory Transit'}
              {rating === 4 && '★★★★ 4.0 — High Corridor Efficiency'}
              {rating === 5 && '★★★★★ 5.0 — Outstanding Tier-1 Carrier'}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase tracking-widest text-[#8F8F8F] mb-1.5">
              Service Notes & Driver Observations (Optional)
            </label>
            <textarea 
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="e.g. On-time delivery at Modjo, excellent road telemetry compliance, clean digital waybill..."
              className="w-full bg-[#141414] border border-[#2E2E2E] rounded-xl p-3 text-xs text-[#EDEDED] focus:ring-1 focus:ring-[#3ECF8E] focus:border-[#3ECF8E] outline-none resize-none placeholder-[#8F8F8F]/40 transition-all font-sans"
            ></textarea>
          </div>

          <div className="p-3 bg-[#171717] border border-[#2E2E2E] rounded-xl flex items-center gap-2 text-[11px] text-[#8F8F8F]">
            <ShieldCheck size={14} className="text-[#3ECF8E] shrink-0" />
            <span>Ratings update the live Transporter Scorecard and AI matching priority along the corridor.</span>
          </div>

          <div className="flex gap-2.5 pt-2 border-t border-[#2E2E2E]">
            <button 
              type="button"
              onClick={onClose} 
              className="flex-1 bg-[#232323] hover:bg-[#2A2A2A] border border-[#2E2E2E] text-[#8F8F8F] hover:text-[#EDEDED] px-4 py-2.5 rounded-xl text-xs font-bold transition-colors"
            >
              Skip
            </button>
            <button 
              type="button"
              disabled={rating === 0 || isSubmitting}
              onClick={handleSubmit}
              className="flex-1 bg-[#3ECF8E] hover:bg-[#34b27b] text-black px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-[0_0_15px_rgba(62,207,142,0.2)] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <><Loader2 size={14} className="animate-spin" /> Submitting...</>
              ) : (
                'Submit Review'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
