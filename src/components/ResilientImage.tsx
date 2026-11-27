import { useState } from 'react';
import { Diamond } from 'lucide-react';

interface ResilientImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
}

export function ResilientImage({
  src,
  alt,
  className = 'w-full h-full object-cover',
  fallbackTitle = 'Southern Well Senior Concierge',
}: ResilientImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-primary-container to-tertiary-container text-on-primary p-6 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <Diamond className="w-7 h-7 text-secondary-fixed mb-2" strokeWidth={1.5} />
        <span className="font-editorial text-sm font-medium text-secondary-fixed">
          {fallbackTitle}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
    />
  );
}
