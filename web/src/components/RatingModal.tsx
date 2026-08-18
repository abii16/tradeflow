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
      <div className="fixed inset-0 z-[200] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-8 text-center border border-slate-200">
          <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-900 mb-2">Rating Submitted</h3>
          <p className="text-sm text-slate-500">Thank you for rating {transporterName}.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="font-bold text-slate-900">Rate Transporter</h3>
            <p className="text-[11px] font-mono text-slate-500">{shipmentId}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <p className="text-sm text-slate-600 mb-4">How was your experience with <span className="font-bold text-slate-900">{transporterName}</span>?</p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 focus:outline-none transition-transform hover:scale-110"
                >
                  <Star 
                    size={32} 
                    className={`${(hoverRating || rating) >= star ? 'fill-amber-400 text-amber-400' : 'text-slate-300'} transition-colors`} 
                  />
                </button>
              ))}
            </div>
            <div className="mt-2 text-xs font-bold text-amber-500 h-4">
              {rating === 1 && "Poor"}
              {rating === 2 && "Fair"}
              {rating === 3 && "Good"}
              {rating === 4 && "Very Good"}
              {rating === 5 && "Excellent"}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-xs font-bold text-slate-700 mb-2">Additional Comments (Optional)</label>
            <textarea 
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Was the delivery on time? How was the communication?"
              className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
            ></textarea>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={onClose} 
              className="flex-1 bg-slate-100 text-slate-700 px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-slate-200 transition-colors"
            >
              Skip
            </button>
            <button 
              disabled={rating === 0}
              onClick={handleSubmit}
              className="flex-1 bg-slate-900 text-white px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit Rating
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
