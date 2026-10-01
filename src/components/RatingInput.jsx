import { useState } from 'react';

/**
 * Likert star control. Material Symbols carries the FILL variation axis, so
 * filled vs. empty stars are one font with a variable-font toggle.
 */
export default function RatingInput({ value, onChange }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  return (
    <div
      className="flex items-center gap-1.5"
      onMouseLeave={() => setHover(0)}
      role="radiogroup"
      aria-label="Overall experience rating"
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const active = star <= shown;
        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
            onMouseEnter={() => setHover(star)}
            onFocus={() => setHover(star)}
            onBlur={() => setHover(0)}
            onClick={() => onChange(star)}
            className="p-1 rounded-md hover:bg-surface-container-highest transition-colors focus:outline-none"
          >
            <span
              className={`material-symbols-outlined text-[36px] transition-transform hover:scale-110 ${
                active ? 'text-secondary' : 'text-outline-variant'
              }`}
              style={{
                fontSize: '36px',
                fontVariationSettings: `'FILL' ${active ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 36`,
              }}
            >
              star
            </span>
          </button>
        );
      })}
    </div>
  );
}