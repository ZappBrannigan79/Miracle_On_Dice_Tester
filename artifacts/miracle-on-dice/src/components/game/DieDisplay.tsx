import React from 'react';
import { cn } from '@/lib/utils';

const getAssetUrl = (path: string) => {
  const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
};

interface DieDisplayProps {
  face: any; // Accepting any structure (string or object)
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

export const DieDisplay: React.FC<DieDisplayProps> = ({
  face,
  size = 'md',
  className,
  onClick,
}) => {
  // Extract string value if 'face' is an object (e.g. { type: 'shoot' } or { face: 'SHOOT' } or { result: 'SHOOT' })
  let faceString = '';

  if (typeof face === 'string') {
    faceString = face;
  } else if (typeof face === 'object' && face !== null) {
    faceString = face.type || face.face || face.result || face.name || face.value || JSON.stringify(face);
  }

  const rawFace = String(faceString).toLowerCase().trim();

  let faceKey = 'blank';

  if (rawFace.includes('shoot') || rawFace === 's') {
    faceKey = 'shoot';
  } else if (rawFace.includes('block') || rawFace === 'b') {
    faceKey = 'block';
  } else if (rawFace.includes('energy') || rawFace === 'e') {
    faceKey = 'energy';
  } else if (rawFace.includes('wild') || rawFace === 'w') {
    faceKey = 'wild';
  } else if (rawFace.includes('shutout') || rawFace === 'so') {
    faceKey = 'shutout';
  }

  const imagePath = getAssetUrl(`/assets/dice/face_${faceKey}.png`);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative flex items-center justify-center rounded-lg bg-slate-950 border border-slate-700 shadow-md overflow-hidden shrink-0 cursor-pointer select-none',
        sizeClasses[size],
        className
      )}
    >
      <img
        src={imagePath}
        alt={`${faceKey} die face`}
        className="w-full h-full object-contain p-1 pointer-events-none"
        onError={(e) => {
          (e.target as HTMLElement).style.display = 'none';
        }}
      />
    </div>
  );
};
