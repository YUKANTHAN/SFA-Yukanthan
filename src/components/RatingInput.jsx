import React, { useState } from 'react';
import { Star } from 'lucide-react';

export default function RatingInput({ value, onChange }) {
  const [hoverRating, setHoverRating] = useState(0);

  const ratingLabels = {
    1: 'Poor (Needs major improvement)',
    2: 'Needs Improvement',
    3: 'Average / Satisfactory',
    4: 'Good (Exceeds expectations)',
    5: 'Outstanding / Excellent!'
  };

  const currentDisplay = hoverRating || value;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const isSelected = star <= currentDisplay;
          return (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="star-btn focus:outline-none"
              title={`Rate ${star} star${star > 1 ? 's' : ''}`}
            >
              <Star
                size={32}
                className={`transition-all duration-200 ${
                  isSelected
                    ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                    : 'text-slate-600 hover:text-slate-400'
                }`}
              />
            </button>
          );
        })}
      </div>

      <div className="h-6">
        {currentDisplay > 0 ? (
          <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 animate-fade-in">
            {currentDisplay} ★ - {ratingLabels[currentDisplay]}
          </span>
        ) : (
          <span className="text-xs text-slate-500">Select a rating from 1 to 5 stars</span>
        )}
      </div>
    </div>
  );
}
