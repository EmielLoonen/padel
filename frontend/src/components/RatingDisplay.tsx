interface RatingDisplayProps {
  rating: number | null;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export default function RatingDisplay({ 
  rating, 
  size = 'md', 
  showLabel = false,
  className = '' 
}: RatingDisplayProps) {
  if (rating === null || rating === undefined) {
    return (
      <span className={`inline-flex items-center gap-2 ${className}`}>
        {showLabel && <span className="text-gray-400 text-sm">Rating:</span>}
        <span className="text-gray-500 text-sm italic">N/A</span>
      </span>
    );
  }

  const formattedRating = rating.toFixed(2);
  
  // Determine color based on rating
  const getRatingColor = (rating: number) => {
    if (rating >= 12) return 'text-purple-400'; // Elite
    if (rating >= 9) return 'text-blue-400'; // Advanced
    if (rating >= 6) return 'text-green-400'; // Intermediate
    if (rating >= 3) return 'text-yellow-400'; // Beginner
    return 'text-gray-400'; // Novice
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-xs';
      case 'md':
        return 'text-sm';
      case 'lg':
        return 'text-lg';
      default:
        return 'text-sm';
    }
  };

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      {showLabel && (
        <span className={`text-gray-400 ${getSizeClasses()}`}>UTR:</span>
      )}
      <span className={`font-bold ${getRatingColor(rating)} ${getSizeClasses()}`}>
        {formattedRating}
      </span>
    </span>
  );
}

