import React from 'react';
import { Star } from 'lucide-react';

interface ReviewStarsProps {
    rating: number;
    interactive?: boolean;
    onChange?: (rating: number) => void;
    size?: 'sm' | 'md' | 'lg';
    maxStars?: number;
}

export default function ReviewStars({ rating, interactive = false, onChange, size = 'sm', maxStars = 5 }: ReviewStarsProps) {
    const starSizes = { sm: 'w-3.5 h-3.5', md: 'w-5 h-5', lg: 'w-6 h-6' };

    return (
        <div className="flex items-center gap-0.5">
            {Array.from({ length: maxStars }, (_, i) => {
                const filled = i + 1 <= rating;
                return (
                    <button
                        key={i}
                        type="button"
                        disabled={!interactive}
                        onClick={() => interactive && onChange?.(i + 1)}
                        className={`${interactive ? 'cursor-pointer hover:scale-110 active:scale-95' : 'cursor-default'} transition-transform`}
                    >
                        <Star
                            className={`${starSizes[size]} ${
                                filled ? 'fill-amber-400 text-amber-400' : 'fill-none text-slate-300'
                            }`}
                        />
                    </button>
                );
            })}
        </div>
    );
}
