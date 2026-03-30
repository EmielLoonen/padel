interface AvatarProps {
  src?: string | null;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  shape?: 'round' | 'square';
  className?: string;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-16 h-16 text-xl',
  xl: 'w-24 h-24 text-3xl',
};

export default function Avatar({ src, name, size = 'md', shape = 'round', className = '' }: AvatarProps) {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const initials = getInitials(name);
  const fullSrc = src ? (src.startsWith('http') ? src : `${API_URL}${src}`) : null;
  const roundClass = shape === 'square' ? 'rounded-lg' : 'rounded-full';

  return (
    <div
      className={`${sizeClasses[size]} ${roundClass} flex items-center justify-center font-bold ${className}`}
    >
      {fullSrc ? (
        <img
          src={fullSrc}
          alt={name}
          className={`w-full h-full ${roundClass} object-cover`}
        />
      ) : (
        <div className={`w-full h-full ${roundClass} bg-gradient-to-br from-padel-green to-padel-blue flex items-center justify-center text-white`}>
          {initials}
        </div>
      )}
    </div>
  );
}
