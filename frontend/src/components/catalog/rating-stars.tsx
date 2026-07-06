'use client';
import { Star } from 'lucide-react';

interface RatingStarsProps {
  nota: number;
  size?: number;
  showValue?: boolean;
}

export function RatingStars({ nota, size = 16, showValue }: RatingStarsProps) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          className={`${star <= Math.round(nota) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
        />
      ))}
      {showValue && <span className="text-sm text-gray-500 ml-1">({nota.toFixed(1)})</span>}
    </div>
  );
}
