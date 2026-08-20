import React, { useState } from 'react';
import { Star, X, CheckCircle2 } from 'lucide-react';

interface RatingModalProps {
  transporterName: string;
  shipmentId: string;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => void;
}

export default function RatingModal({ transporterName, shipmentId, onClose, onSubmit }: RatingModalProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    onSubmit(rating, comment);
    setSubmitted(true);
    setTimeout(() => onClose(), 2000);
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 z-[200] bg-slate-950/60 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg w-full max-w-sm shadow-lg p-6 text-center border border-slate-200">
          <CheckCircle2 size={36} className="text-emerald-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-900 mb-1">Rating Submitted</h3>
          <p className="text-xs text-slate-500">Thank you for rating {transporterName}.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-md shadow-lg overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Rate Transporter</h3>
            <p className="text-[11px] font-mono text-slate-500 mt-0.5">{shipmentId}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-md hover:bg-slate-100 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="text-center">
            <p className="text-xs text-slate-600 mb-3">How was your experience with <span className="font-medium text-slate-900">{transporterName}</span>?</p>
            <div className="flex justify-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 focus:outline-none transition-transform hover:scale-105"
                >
                  <Star 
                    size={24} 
                    className={`${(hoverRating || rating) >= star ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} transition-colors`} 
                  />
                </button>
              ))}
            </div>
            <div className="mt-1.5 text-xs font-medium text-amber-600 h-4">
              {rating === 1 && "Poor"}
              {rating === 2 && "Fair"}
              {rating === 3 && "Good"}
              {rating === 4 && "Very Good"}
              {rating === 5 && "Excellent"}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Additional Comments (Optional)</label>
            <textarea 
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Was the delivery on time? How was the communication?"
              className="w-full border border-slate-300 rounded-md p-2.5 text-xs focus:ring-1 focus:ring-slate-900 focus:border-slate-900 outline-none resize-none"
            ></textarea>
          </div>

          <div className="flex gap-2 pt-2 border-t border-slate-100">
            <button 
              onClick={onClose} 
              className="flex-1 border border-slate-300 text-slate-700 px-3 py-2 rounded-md text-xs font-medium hover:bg-slate-50 transition-colors"
            >
              Skip
            </button>
            <button 
              disabled={rating === 0}
              onClick={handleSubmit}
              className="flex-1 bg-slate-900 text-white px-3 py-2 rounded-md text-xs font-medium hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit Rating
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
