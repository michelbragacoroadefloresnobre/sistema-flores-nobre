import { Star } from "lucide-react";
import { useState } from "react";

interface Props {
  value?: number;
  onValueChange?: (v: number) => void;
  readOnly?: boolean;
}

export function StarRating({ value, onValueChange, readOnly = false }: Props) {
  const [hoveredStar, setHoveredStar] = useState(0);

  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !readOnly && onValueChange?.(star)}
          onMouseEnter={() => !readOnly && setHoveredStar(star)}
          onMouseLeave={() => !readOnly && setHoveredStar(0)}
          disabled={readOnly}
          className={`focus:outline-none transition-colors py-1 ${
            readOnly ? "cursor-default" : "cursor-pointer"
          }`}
        >
          <Star
            className={`h-5 w-5 transition-colors ${
              star <= (value || 0) || star <= hoveredStar
                ? "fill-primary text-primary"
                : "text-muted-foreground"
            }`}
          />
        </button>
      ))}
    </div>
  );
}
