interface AvatarProps {
  src?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-16 h-16 text-xl',
  xl: 'w-24 h-24 text-3xl',
};

export default function Avatar({ src, name, size = 'md', className = '' }: AvatarProps) {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  
  // Get initials from name
  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const initials = getInitials(name);
  // Check if src is already a full URL (Cloudinary) or a relative path (local)
  const fullSrc = src ? (src.startsWith('http') ? src : `${API_URL}${src}`) : null;

  return (
    <div
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-bold ${className}`}
    >
      {fullSrc ? (
        <img
          src={fullSrc}
          alt={name}
          className="w-full h-full rounded-full object-cover"
        />
      ) : (
        <div className="w-full h-full rounded-full bg-gradient-to-br from-padel-green to-padel-blue flex items-center justify-center text-white">
          {initials}
        </div>
      )}
    </div>
  );
}

